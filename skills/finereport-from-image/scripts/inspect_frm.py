#!/usr/bin/env python3
"""Read-only structural inspection of a FineReport .frm; does not execute SQL."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET


def inspect(path, external_datasets=()):
    result = {
        'file': str(Path(path).resolve()), 'status': 'failed',
        'errors': [], 'warnings': [], 'datasets': [], 'widgets': [],
        'data_columns': [], 'charts': [], 'static_numeric_candidates': [],
        'limits': ['XML inspection only; no SQL execution, visual comparison, or designer validation.'],
    }

    def issue(level, code, detail):
        result[level].append({'code': code, 'detail': detail})

    try:
        data = Path(path).read_bytes()
        result['sha256'] = hashlib.sha256(data).hexdigest()
        if re.search(br'<!DOCTYPE|<!ENTITY', data, re.I):
            raise ValueError('DTD/entity declarations are not supported by this inspector.')
        root = ET.fromstring(data)
    except (OSError, ET.ParseError, ValueError) as exc:
        issue('errors', 'unreadable_xml', str(exc))
        return result
    if root.tag != 'Form':
        issue('errors', 'not_a_form', f'Expected Form root; got {root.tag}.')
    if root.find('Layout/Center') is None:
        issue('errors', 'missing_body', 'Layout/Center is missing.')
    mark = root.find('NewFormMarkAttr/NewFormMarkAttr')
    if mark is None:
        issue('warnings', 'version_metadata_review', 'NewFormMarkAttr is absent; verify against the target FineReport version.')
    else:
        result['design_size'] = {'width': mark.get('bodyWidth'), 'height': mark.get('bodyHeight')}

    parents = {child: parent for parent in root.iter() for child in parent}

    def owner(node):
        while node is not None:
            n = node.find('WidgetName')
            if n is not None:
                return n.get('name', '')
            node = parents.get(node)
        return '(form)'

    datasets = root.findall('TableDataMap/TableData')
    names = [d.get('name', '') for d in datasets]
    known = set(names) | set(external_datasets)
    for name, count in Counter(n.casefold() for n in names).items():
        if count > 1:
            issue('errors', 'duplicate_dataset', name)
    for d in datasets:
        name = d.get('name', '')
        if not name:
            issue('errors', 'unnamed_dataset', 'A TableData has no name.')
        query = d.findtext('Query', '')
        scrubbed = re.sub(r"'(?:''|[^'])*'", "''", query)
        scrubbed = re.sub(r'/\*.*?\*/|--[^\n]*', '', scrubbed, flags=re.S)
        constant = bool(re.match(r'\s*SELECT\b', scrubbed, re.I)) and not re.search(r'\bFROM\b', scrubbed, re.I)
        result['datasets'].append({
            'name': name, 'class': d.get('class'),
            'connection': d.findtext('Connection/DatabaseName'),
            'query_kind': 'constant_select_candidate' if constant else ('query' if query.strip() else 'non_query_dataset'),
        })

    def binding(ds_name, location, column=None):
        if not ds_name or ds_name not in known:
            issue('errors', 'missing_dataset_reference', {'dataset': ds_name, 'location': location, 'column': column})

    widget_nodes = [n for n in root.iter() if n.find('WidgetName') is not None]
    widget_names = [n.find('WidgetName').get('name', '') for n in widget_nodes]
    for name, count in Counter(n.casefold() for n in widget_names).items():
        if count > 1:
            issue('errors', 'duplicate_widget_name', name)
    for node in widget_nodes:
        name = node.find('WidgetName').get('name', '')
        cls = node.get('class', '')
        parent = parents.get(node)
        bounds = parent.find('BoundsAttr') if parent is not None else None
        rect = dict(bounds.attrib) if bounds is not None else None
        result['widgets'].append({'name': name, 'class': cls, 'bounds': rect})
        if not name:
            issue('errors', 'unnamed_widget', cls)
        if re.search(r'HtmlEditor|WebView|IFrame|WebFrame', cls, re.I):
            issue('errors', 'embedded_web_component', name)
        if bounds is not None:
            try:
                values = {k: float(bounds.get(k, 'nan')) for k in ('x', 'y', 'width', 'height')}
                if not all(v == v for v in values.values()) or values['width'] <= 0 or values['height'] <= 0:
                    raise ValueError('Nonpositive or missing width/height.')
                if any(float(bounds.get(k)) != int(float(bounds.get(k))) for k in values):
                    issue('warnings', 'fractional_design_bounds', name)
            except (ValueError, TypeError, OverflowError) as exc:
                issue('errors', 'invalid_bounds', {'widget': name, 'reason': str(exc)})
        if cls.endswith('.ChartEditor'):
            bindings = []
            for table in node.findall('.//ChartDefinition//TableData'):
                if table.get('class', '').endswith('.NameTableData'):
                    ds = table.findtext('Name', '').strip()
                    binding(ds, name)
                    bindings.append(ds)
            if not bindings:
                issue('errors', 'chart_not_dataset_bound', name)
            fields = [dict(n.attrib) for n in node.findall('.//ChartSummaryColumn')]
            result['charts'].append({'name': name, 'datasets': bindings, 'series_fields': fields,
                                     'plot_types': [n.get('class') for n in node.findall('.//Plot')]})
        if cls.endswith('.Label'):
            text = node.findtext('widgetValue/O', '')
            if re.search(r'\d', text):
                result['static_numeric_candidates'].append({'widget': name, 'kind': 'label', 'text': text[:160]})

    for o in root.findall(".//O[@t='DSColumn']"):
        attrs = o.find('Attributes')
        if attrs is None:
            issue('errors', 'invalid_dscolumn', owner(o))
            continue
        ds, col = attrs.get('dsName'), attrs.get('columnName')
        binding(ds, owner(o), col)
        if not col:
            issue('errors', 'missing_column_name', owner(o))
        result['data_columns'].append({'widget': owner(o), 'dataset': ds, 'column': col})
    for cell in root.findall('.//FormElementCase/CellElementList/C'):
        o = cell.find('O')
        if o is not None and o.get('t', '') not in ('DSColumn', 'Formula') and re.search(r'\d', o.text or ''):
            result['static_numeric_candidates'].append({'widget': owner(cell), 'kind': 'cell', 'cell': dict(cell.attrib), 'text': (o.text or '')[:160]})
    if result['static_numeric_candidates']:
        issue('warnings', 'review_static_numbers', f"Review {len(result['static_numeric_candidates'])} candidates; dates and labels may be intentional.")

    for node in root.iter():
        if node.tag in ('IM', 'Script') and (len(node) or (node.text or '').strip()):
            issue('errors', 'event_or_script_requires_review', owner(node))
        for key, value in node.attrib.items():
            if key.casefold() in ('usehtml', 'isusehtml') and value.casefold() == 'true':
                issue('errors', 'html_enabled', {'widget': owner(node), 'node': node.tag})
        if node.tag == 'O' and re.search(r'\b[\w]+\.select\s*\(', node.text or '', re.I):
            issue('errors', 'formula_dataset_selection', owner(node))
        if node.tag == 'FineImage' and not ''.join(node.itertext()).strip() and not len(node):
            issue('errors', 'empty_image_resource', owner(node))
        if node.tag == 'BorderImage':
            issue('warnings', 'review_image_border', owner(node))

    result['counts'] = {key: len(result[key]) for key in ('datasets', 'widgets', 'data_columns', 'charts', 'static_numeric_candidates')}
    result['status'] = 'passed_with_warnings' if result['warnings'] else 'passed'
    if result['errors']:
        result['status'] = 'failed'
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('template', type=Path)
    parser.add_argument('--json', type=Path, help='Optional JSON report output; template is never changed.')
    parser.add_argument('--external-dataset', action='append', default=[], help='Known server dataset name; repeat if necessary.')
    args = parser.parse_args()
    result = inspect(args.template, args.external_dataset)
    encoded = json.dumps(result, ensure_ascii=False, indent=2)
    if args.json:
        if args.json.resolve() == args.template.resolve():
            parser.error('--json must not overwrite the inspected template.')
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(encoded+'\n', encoding='utf-8')
    print(encoded)
    return 1 if result['errors'] else 0


if __name__ == '__main__':
    sys.exit(main())
