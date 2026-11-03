# 仓库维护

本仓库收录个人创建和收藏的 Agent Skills；使用与技能索引以 README.md 为准。

- 自建技能放在 `skills/created/<技能名>/`，收藏及第三方改版放在 `skills/collected/<技能名>/`；新增技能时更新 README 的分类索引。
- 技能包含 Markdown/YAML、Python 3、Node.js 和必要素材，没有统一应用服务或构建步骤。
- 检查 FineReport 示例：`python skills/created/finereport-from-image/scripts/inspect_frm.py skills/created/finereport-from-image/assets/reference-dashboard.frm`。
- JavaScript 语法检查：`node --check skills/created/finereport-from-image/scripts/preview_frm.cjs`。
- 真实预览的依赖和参数见对应 SKILL.md，不把 XML 检查当作真实预览通过。
- 修改技能只涉及本次要求的部分，保持支持文件和相对链接有效；收藏第三方技能时按 collected/README.md 记录作者、来源、版本与许可证，保留原始声明。
- `skills/**` 按 .gitattributes 保留原始字节，不为统一换行重新格式化模板或技能文件。
- 仓库与本机已安装技能不自动同步；修改安装副本需要明确授权。
- 不提交凭据、会话、业务数据、日志和预览输出。
- `skills/collected/neat-freak/evals/fixtures/` 中的上游合成凭据、记忆和会话样例是受控测试资料，不是本机隐私数据；只保留经过核对的夹具，禁止扩大 .env 忽略例外。
- 收藏快照的 `SHA256SUMS.txt` 只覆盖本机原始收录文件；补充的 SOURCE.md 和许可证单独审查。上游对照提交不得冒称原始安装版本，不自动替换为上游最新版。

当前自建技能为 `finereport-from-image`；收藏技能为 `grilling`、`find-skills`、`agent-reach`、`neat-freak`、`frontend-design`。后续按用户要求新增，始终手动同步，不自动收录或更新其他本机技能。
