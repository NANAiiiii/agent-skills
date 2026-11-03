# FineReport 原生结构与排错

以下结构来自已通过 FineReport 11.x 实际预览的模板。版本或主题不同可能改变细节；先读取目标环境的正常模板，不凭片段拼造整个文件。

## 容器与组件

常见主体为 `Form → Layout(WBorderLayout) → Center(WFitLayout)`，内含一个覆盖画布的 `WAbsoluteLayout` 工作区。组件是 `Widget` 包装的 `InnerWidget` 与 `BoundsAttr`。保留版本、`NewFormMarkAttr` 等必需元数据，并同步 body 尺寸、工作区尺寸、设计标记尺寸。

```xml
<Widget class="com.fr.form.ui.container.WAbsoluteLayout$BoundsWidget">
  <InnerWidget class="com.fr.form.ui.ElementCaseEditor">
    <WidgetName name="metric_amount"/>
    <!-- 原生模板中的其他必需节点保留 -->
  </InnerWidget>
  <BoundsAttr x="20" y="40" width="180" height="40"/>
</Widget>
```

组件名应唯一，检查时按不区分大小写比较。图表模板可能同时有同名外层容器；选择 `InnerWidget[@class='com.fr.form.ui.ChartEditor']` 并确认其实际 `Plot` 类型，不能仅按 `WidgetName` 获取第一个匹配项。复制后更新组件名、WidgetID（如存在）、图表 UUID 和新模板标识，保留现有报表中不需要修改的ID。

`body/LCAttr@compInterval` 会在坐标间距之外再增加间隔。已用坐标控制 gap 时通常设为0，并单独检查 margin。画布大小、卡片布局、横向自适应及字体是否随缩放，以参考图和目标分辨率决定。

## 原生数据列和度量单位

```xml
<C c="0" r="0" s="0">
  <O t="DSColumn">
    <Attributes dsName="ds_metrics" columnName="purchase_amount"/>
    <Complex/>
    <RG class="com.fr.report.cell.cellattr.core.group.FunctionGrouper"/>
    <Parameters/>
  </O>
</C>
```

实际演示环境中，报表块 `ColumnWidth`、`RowHeight` 使用38100内部单位对应96 DPI下1 CSS像素；`BoundsAttr` 使用设计像素。该比例应通过当前正常模板和实际预览再次确认。把36000误当固定像素换算曾造成数值与标签越往右越偏；逻辑列宽总和还可能大于组件宽度，产生内部滚动条。

样式字体大小不是直接的CSS像素；示例中 `FRFont@size=96` 约为16px，`144` 约为24px，应结合目标缩放检查。`horizontal_alignment=0`、`vertical_alignment=0` 是此示例中的居中设置。

```xml
<Format class="com.fr.base.CoreDecimalFormat" roundingMode="6"><![CDATA[#,##0]]></Format>
```

已验证格式：`#,##0`、`#0.0`、`#0%`、`#0.0%`、`#0.0天`、`#0家`。部分图表在仅用 `0` 时出现多位数字被裁成末位的情况，使用 `#0` 后正常。不要把Java格式中带引号的单位用法直接移植过来，曾出现引号被当正文显示。页脚前缀宜用独立静态单元格或标签，数值继续保持数据列；复杂前后缀格式曾被错误输出到数值后面。

## 无表演示数据

```sql
SELECT 0.985 AS on_time_rate, 556780 AS purchase_amount
```

```sql
SELECT 1 AS month_order, '4月' AS month_label,
       680 AS purchase_amount, 0.019 AS reduction_rate
UNION ALL
SELECT 2, '5月', 620, 0.018
```

字段别名保持稳定，首行明确定义；`UNION ALL` 各列类型一致。常量数据不需要 `FROM`。需要强制类型时使用目标预览连接和 Greenplum 均接受的 `CAST(... AS NUMERIC)` 等语法，或将只适用于目标库的查询与本机验证清楚区分。不要默认本机有 Greenplum 驱动或同名连接。参考素材使用的 `FRDemo` 只是连接别名，不是技能要求。

## 图表直接绑定

普通图表通常使用 `MoreNameCDDefinition`：

```xml
<MoreNameCDDefinition>
  <Top topCate="-1" topValue="-1" isDiscardOtherCate="false"
       isDiscardOtherSeries="false" isDiscardNullCate="false" isDiscardNullSeries="false"/>
  <TableData class="com.fr.data.impl.NameTableData"><Name>ds_monthly</Name></TableData>
  <CategoryName value="month_label"/>
  <ChartSummaryColumn name="purchase_amount"
      function="com.fr.data.util.function.NoneFunction" customName="采购额"/>
</MoreNameCDDefinition>
```

柱线组合图使用 `VanChartCustomPlot`，其 `CustomPlotList` 包含柱、线子图；`CustomDefinition/DefinitionMapList` 中 `key="column"`、`key="line"` 对应不同字段。同一月数据可来自同一数据集，不需要按月复制图表或单元格。

主图与子图的 `YAxisList` 和 `stackAndAxisCondition` 都要一致：金额轴对应 `yAxisIndex=0`，比例轴对应 `yAxisIndex=1`，右轴 `AxisPosition=4`。百分比使用小数范围和百分比格式，例如0至1、步长0.2；降低率可能为0至0.04，不能直接沿用0至100。

条形图在 `VanChartColumnPlotAttr@isBar=true`。核对阶段从上到下的顺序与数值轴从左向右方向，`axisReversed` 设错会使条形从右侧起画。仅在截图需要时启用数据标签。

图表配色除了 `ColorList`，还受 `PredefinedStyle@themed`、`isCustomFillStyle`、`GradientStyle` 和子图调色板影响。仅改顶层颜色可能仍显示默认蓝绿；检查主图和子图，关闭继承的主题覆盖，使用截图中的配色。折线平滑应复用曲线模板参数；示例中 `VanAttrLine/Attr@lineStyle=2` 为平滑曲线，不应无意被统一置0。

## 边框、层级与空图片配置

当前绝对布局示例中，较早的兄弟组件绘制在较晚的组件之上。色块底栏可能覆盖卡片边框和分隔线；应修正层级和合理内缩，不反复加粗边线。其他布局必须在预览中确认层级。

自适应把设计坐标取整为实际像素，四条独立的1px色块可能产生粗细差异。先检查实际DOM位置、像素、透明度、重复叠加和遮挡。使用原生单层边框或稳定的背景内嵌方式，最终以截图为准；不要把“2px加透明度”当作任何分辨率都等价于1px的通用修复。

复制图表时可能继承：

```xml
<Border>
  <border type="1" .../>
  <BorderImage name="ImageBackground"><FineImage fm="png"/></BorderImage>
</Border>
```

即使 `border@style=0`，空 `BorderImage/FineImage` 仍可能在自适应接口触发 `ImageIcon`、`FormFitConfigHandler` 空指针。无需图片边框时删除 `BorderImage`，设置 `type=0`，清理示例的 WidgetTitle、背景和透明度。只禁用显示不等于移除了无效资源。清理后重测服务器新增日志，不能依赖页面当前仍能显示就忽略异常。

## 修改与验证边界

- 使用最新部署文件生成候选副本；记录源哈希，写回前重新比对。源变更则重新基于新版本修改。
- `.frm` 结构合法不代表服务端能读，服务端能读不代表字段存在；字段能读也不代表版式相似。数据列文本有时在canvas中，DOM `innerText` 不包含它们是正常现象；必须查看截图和实际请求结果。
- `inspect_frm.py` 只读XML，不能执行SQL或证实业务口径；静态数字候选需要人工判断，年份和单位常量可能合理。
- `preview_frm.cjs` 只证明指定会话、窗口及检查项的结果。图表DOM存在不代表数值正确，滚动检测通过也不代表无文字截断。设计器、日志和图片对照分别记录。
- 凭据和会话状态仅从运行时获取。不要复制某次项目脚本中的密码、缓存目录、固定端口或用户名到新技能或报表。
