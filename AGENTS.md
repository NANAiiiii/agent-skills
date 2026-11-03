# 仓库维护

本仓库收录个人创建和收藏的 Agent Skills；使用与技能索引以 README.md 为准。

- 每个技能存放在 `skills/<技能名>/`；新增技能时更新 README 的目录。
- 技能包含 Markdown/YAML、Python 3、Node.js 和必要素材，没有统一应用服务或构建步骤。
- 检查 FineReport 示例：`python skills/finereport-from-image/scripts/inspect_frm.py skills/finereport-from-image/assets/reference-dashboard.frm`。
- JavaScript 语法检查：`node --check skills/finereport-from-image/scripts/preview_frm.cjs`。
- 真实预览的依赖和参数见对应 SKILL.md，不把 XML 检查当作真实预览通过。
- 修改技能只涉及本次要求的部分，保持支持文件和相对链接有效；收藏第三方技能时保留来源与许可证。
- `skills/**` 按 .gitattributes 保留原始字节，不为统一换行重新格式化模板或技能文件。
- 仓库与本机已安装技能不自动同步；修改安装副本需要明确授权。
- 不提交凭据、会话、业务数据、日志和预览输出。

当前已收录 `finereport-from-image`；后续按用户要求新增技能，不自动收录其他本机技能。
