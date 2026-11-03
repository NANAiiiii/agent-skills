#!/usr/bin/env node
'use strict';

// Screenshot/DOM verification only. This script never modifies a FineReport template.
const fs = require('node:fs');
const path = require('node:path');

const HELP = `FineReport native dashboard preview
Required:
  --base-url URL          FineReport web application root (ending e.g. /webroot)
  --template PATH         reportlets-relative .frm path
  --out DIR              Screenshots and report.json output directory
Optional:
  --widths CSV           Default: 1366,1550,1920
  --design-size WxH      Set proportional viewport heights from the actual design
  --height N             Viewport height if design-size is omitted (default: 900)
  --playwright-path PATH Installed Playwright module; otherwise require('playwright')
  --browser-executable P Existing Chrome/Chromium executable; otherwise channel chrome
  --storage-state PATH   Authorized external Playwright session state (read-only)
  --card-selector CSS    Card elements to record and check for overlap
  --expect-widgets CSV   Required native widget names (case-insensitive)
  --chart-widgets CSV    Native chart widget names requiring SVG or canvas content
  --allow-scroll CSV     Intentional page scroll widgets (default: BODY,WORKSPACE)
  --settle-ms N          Render wait after load/resize (default: 3000)
  --timeout-ms N         Page/readiness timeout (default: 30000)

Credentials are optional and never accepted as CLI values. Only after user
authorization, set process env FR_PREVIEW_USER and FR_PREVIEW_PASSWORD for login.
Without a session or supplied env, a login page produces auth_required (exit 3).
Exit codes: 0 checked, 1 verification/runtime failure, 2 invalid arguments, 3 auth.
Screenshots and DOM checks do not prove SQL correctness or visual similarity.
`;

function options(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return {help: true};
  const allowed = new Set(['base-url','template','out','widths','design-size','height',
    'playwright-path','browser-executable','storage-state','card-selector',
    'expect-widgets','chart-widgets','allow-scroll','settle-ms','timeout-ms']);
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || !allowed.has(key) || !argv[i+1] || argv[i+1].startsWith('--')) {
      throw new Error('Unknown option or missing value: '+argv[i]);
    }
    args[key] = argv[i+1];
  }
  for (const key of ['base-url','template','out']) if (!args[key]) throw new Error('Missing --'+key);
  const base = new URL(args['base-url']);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error('base-url must be an HTTP(S) app root without credentials or query parameters.');
  }
  const template = args.template.replaceAll('\\', '/');
  if (template.startsWith('/') || template.split('/').some(p=>['..','.',''].includes(p)) || !/\.frm$/i.test(template) || /[:?#]/.test(template)) {
    throw new Error('template must be a relative .frm path inside reportlets.');
  }
  const int = (value, label, min) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < min) throw new Error('Invalid '+label);
    return n;
  };
  const widths = (args.widths || '1366,1550,1920').split(',').map(v=>int(v,'width',320));
  const dimensions = args['design-size']?.toLowerCase().split('x').map(v=>int(v,'design size',1));
  if (dimensions && dimensions.length !== 2) throw new Error('design-size must be WIDTHxHEIGHT.');
  const url = new URL(base.href.replace(/\/$/,'')+'/decision/view/form');
  url.searchParams.set('viewlet', template);
  const csv = value => (value || '').split(',').map(x=>x.trim()).filter(Boolean);
  return {...args, url: url.href, template, widths, dimensions,
    height: int(args.height || 900,'height',240),
    settle: int(args['settle-ms'] || 3000,'settle-ms',0),
    timeout: int(args['timeout-ms'] || 30000,'timeout-ms',1000),
    expected: csv(args['expect-widgets']), charts: csv(args['chart-widgets']),
    allowScroll: csv(args['allow-scroll'] || 'BODY,WORKSPACE'),
    output: path.resolve(args.out)};
}

async function run(args) {
  let browser;
  const result = {status:'failed', template:args.template, audits:[], pageErrors:[],
    httpErrors:[], failedRequests:[], findings:[], limits:[
      'Runtime/DOM checks only; inspect screenshots and server logs separately.',
      'No designer UI verification or business/SQL correctness assertion.'
    ]};
  fs.mkdirSync(args.output,{recursive:true});
  const save = () => fs.writeFileSync(path.join(args.output,'report.json'),JSON.stringify(result,null,2)+'\n');
  const redact = value => {
    let text = String(value);
    for(const secret of [process.env.FR_PREVIEW_PASSWORD,process.env.FR_PREVIEW_USER]) {
      if(secret) text = text.split(secret).join('[redacted]');
    }
    return text.replace(/([?&](?:sessionid|token|access_token|password)=)[^&\s]+/gi,'$1[redacted]');
  };
  try {
    const {chromium} = require(args['playwright-path'] ? path.resolve(args['playwright-path']) : 'playwright');
    browser = await chromium.launch({headless:true,...(args['browser-executable'] ?
      {executablePath:args['browser-executable']} : {channel:'chrome'})});
    const firstHeight = args.dimensions ? Math.ceil(args.widths[0]*args.dimensions[1]/args.dimensions[0])+16 : args.height;
    const context = await browser.newContext({viewport:{width:args.widths[0],height:firstHeight},deviceScaleFactor:1,
      ...(args['storage-state'] ? {storageState:args['storage-state']} : {})});
    const page = await context.newPage();
    page.setDefaultTimeout(args.timeout);
    page.on('pageerror', e=>result.pageErrors.push(redact(e.message)));
    page.on('response', response=>{
      if(response.status()>=400){
        const u = new URL(response.url());
        if(!u.pathname.endsWith('/favicon.ico')) result.httpErrors.push({status:response.status(),path:u.pathname});
      }
    });
    page.on('requestfailed', request=>{
      const reason = request.failure()?.errorText || '';
      if(reason.includes('ERR_ABORTED')) return;
      const u = new URL(request.url());
      result.failedRequests.push({path:u.pathname,reason:redact(reason)});
    });
    await page.goto(args.url,{waitUntil:'domcontentloaded',timeout:args.timeout});
    const waitForSurface = async () => {
      await page.waitForFunction(()=>Boolean(document.querySelector('[widgetname="BODY" i], input[type="password"]')),
        null,{timeout:args.timeout});
    };
    await waitForSurface();
    const password = page.locator('input[type="password"]:visible');
    if(await password.count()) {
      if(!process.env.FR_PREVIEW_USER || !process.env.FR_PREVIEW_PASSWORD){
        result.status='auth_required';
        result.findings.push('A login page is visible; no authorized process credentials/session were supplied.');
        await page.screenshot({path:path.join(args.output,'auth-required.png')});
        save();
        return 3;
      }
      await page.getByPlaceholder(/用户名|账号|username|account/i).fill(process.env.FR_PREVIEW_USER);
      await password.fill(process.env.FR_PREVIEW_PASSWORD);
      const submit = page.getByText(/^(登录|登 录|Log in|Sign in|Login)$/i);
      await submit.click();
    }
    await page.locator('[widgetname="BODY" i]').waitFor({state:'visible',timeout:args.timeout});
    // Wait for native sheet/chart requests; networkidle is unreliable with auto-refresh widgets.
    await page.waitForTimeout(args.settle);
    for(const width of args.widths){
      const height = args.dimensions ? Math.ceil(width*args.dimensions[1]/args.dimensions[0])+16 : args.height;
      await page.setViewportSize({width,height});
      await page.waitForTimeout(args.settle);
      const audit = await page.evaluate(({expected,charts,cardSelector,allowScroll})=>{
        const rect = e => {const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height};};
        const visible = e => {const r=e.getBoundingClientRect(),s=getComputedStyle(e); return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
        const widgetNodes = [...document.querySelectorAll('[widgetname]')].filter(visible);
        const byName = new Map(widgetNodes.map(e=>[e.getAttribute('widgetname').toUpperCase(),e]));
        // Native ChartEditor uses <widget>__<uuid>__index__<n> IDs in 11.x,
        // rather than a widgetname attribute on the rendered chart host.
        for(const e of [...document.querySelectorAll('[id]')].filter(visible)){
          const match=e.id.match(/^(.+)__[0-9a-f]{8}-[0-9a-f-]{27}__index__\d+$/i);
          if(match)byName.set(match[1].toUpperCase(),e);
        }
        const missing = expected.filter(n=>!byName.has(n.toUpperCase()));
        const missingChartContent = charts.filter(n=>!byName.get(n.toUpperCase())?.querySelector('svg,canvas'));
        const scrollable = [...document.querySelectorAll('*')].filter(e=>{
          if(!visible(e)||!e.clientWidth||!e.clientHeight)return false;
          const s=getComputedStyle(e);
          return (/auto|scroll/.test(s.overflowX)&&e.scrollWidth>e.clientWidth+2)||
            (/auto|scroll/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+2);
        }).map(e=>({widget:e.getAttribute('widgetname')||e.closest('[widgetname]')?.getAttribute('widgetname')||null,
          tag:e.tagName,width:e.clientWidth,height:e.clientHeight,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight}));
        const allowed = new Set(allowScroll.map(s=>s.toUpperCase()));
        const internalScrollers = scrollable.filter(e=>e.widget&&!allowed.has(e.widget.toUpperCase()));
        const cards = cardSelector ? [...document.querySelectorAll(cardSelector)].filter(visible).map(e=>({name:e.getAttribute('widgetname'),...rect(e)})) : [];
        const overlaps=[];
        for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){
          const a=cards[i],b=cards[j];
          if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>2&&
             Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>2)overlaps.push([a.name,b.name]);
        }
        // Native report pieces have no stable DOM widget name in some 11.x
        // builds. Record their rectangles for screenshot review; don't invent IDs.
        const reportBlocks=[...document.querySelectorAll('.report-report-piece-component')].filter(visible)
          .map(e=>({...rect(e),canvasCount:e.querySelectorAll('canvas').length}));
        return {visibleWidgetCount:byName.size,visibleWidgetNames:[...byName.keys()],reportBlocks,
          missingWidgets:missing,missingChartContent,
          cards,cardOverlaps:overlaps,scrollable,internalScrollers,
          documentHorizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
          svgCount:document.querySelectorAll('svg').length,canvasCount:document.querySelectorAll('canvas').length};
      },{expected:args.expected,charts:args.charts,cardSelector:args['card-selector'],allowScroll:args.allowScroll});
      const filename=`preview-${width}.png`;
      await page.screenshot({path:path.join(args.output,filename),fullPage:true});
      audit.width=width; audit.height=height; audit.screenshot=filename;
      result.audits.push(audit);
      if(audit.missingWidgets.length||audit.missingChartContent.length||audit.cardOverlaps.length||audit.internalScrollers.length||audit.documentHorizontalOverflow){
        result.findings.push(`Layout/content checks need correction at ${width}px; inspect its audit and screenshot.`);
      }
      // If a page-sized scroll container remains, the PNG is a viewport view, not an entire dashboard.
      if(audit.scrollable.length) result.findings.push(`Scrollable content exists at ${width}px; visually review or capture additional scrolled views.`);
    }
    if(!args.expected.length) result.limits.push('No expected widget list supplied; component completeness was not asserted.');
    if(!args.charts.length) result.limits.push('No chart widget list supplied; chart content completeness was not asserted.');
    const badAudit=result.audits.some(a=>a.missingWidgets.length||a.missingChartContent.length||a.cardOverlaps.length||a.internalScrollers.length||a.documentHorizontalOverflow);
    result.status=badAudit||result.pageErrors.length||result.httpErrors.length||result.failedRequests.length ? 'failed' : 'passed';
    save();
    return result.status==='passed' ? 0 : 1;
  } catch(error){
    result.findings.push(redact(error.message));
    save();
    return 1;
  } finally {
    if(browser) await browser.close();
    console.log(JSON.stringify({status:result.status,viewports:result.audits.length,
      pageErrors:result.pageErrors.length,httpErrors:result.httpErrors.length,
      failedRequests:result.failedRequests.length,report:path.join(args.output,'report.json')}));
  }
}

if(require.main===module){
  let args;
  try{args=options(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=2;}
  if(args?.help)console.log(HELP);
  else if(args)run(args).then(code=>{process.exitCode=code;}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
module.exports={options,run};
