# 收藏他人的技能

这里存放收藏的第三方技能及其修改版。2026-11-03 已收录本机使用的 8 个技能快照：

| 技能 | 来源记录 | 许可 |
| --- | --- | --- |
| [grilling](grilling/SKILL.md) | [Matt Pocock / 对照与差异](grilling/SOURCE.md) | MIT |
| [find-skills](find-skills/SKILL.md) | [Vercel / 对照与差异](find-skills/SOURCE.md) | MIT |
| [agent-reach](agent-reach/SKILL.md) | [Panniantong / 对照与差异](agent-reach/SOURCE.md) | MIT |
| [neat-freak](neat-freak/SKILL.md) | [数字生命卡兹克 / 对照与差异](neat-freak/SOURCE.md) | MIT |
| [frontend-design](frontend-design/SKILL.md) | [Anthropic 上游对照 / 本机差异](frontend-design/SOURCE.md) | Apache-2.0 |
| [interview-prep-generator](interview-prep-generator/SKILL.md) | [davila7 / 对照与差异](interview-prep-generator/SOURCE.md) | MIT |
| [security-audit](security-audit/SKILL.md) | [Cloudflare / 对照与差异](security-audit/SOURCE.md) | MIT |
| [codex-with-chatgpt](codex-with-chatgpt/SKILL.md) | [XiaoDuoYa / 对照与差异](codex-with-chatgpt/SOURCE.md) | MIT |

除 `codex-with-chatgpt` 将本机安装目录恢复为 `<ACTUAL_CHECKOUT_PATH>`（校验对应公开版本，原始哈希另记在 SOURCE.md）外，技能正文和支持文件保持本机收录时的原始字节，`SHA256SUMS.txt` 列出这些文件的校验值；额外补入 `SOURCE.md` 与缺少的上游许可。上游对照提交不是原始安装版本，不将历史差异推断为本仓库作者的修改。

每个技能放在独立的 `<技能名>/` 目录中，保留原有技能内容、作者声明和许可证，并在该目录的 `SOURCE.md` 记录：

- 原作者或维护组织。
- 原始仓库或发布页面链接。
- 收录的版本、标签或提交号，以及收录日期。
- 许可证及对应文件；许可不明确时先确认允许再分发，再上传内容。
- 本地修改说明；未修改则写“未修改”。

根 README 的“收藏他人”列表同步列出技能、原作者与来源链接。修改别人的技能仍归入本分类，不能改标为自己原创。

## 测试夹具与安全边界

`neat-freak/evals/fixtures/` 来自该技能上游，包含用于验证隐私和清理边界的合成 `.env`、记忆及会话样例。这些不是本机真实凭据或会话。仅为已核对的两份合成 `.env` 设置精确的 Git 忽略例外；不允许借此收录真实凭据、日志或个人历史。

## 手动更新

本收藏仓库和本机已安装技能不自动同步，也不自动跟随上游。每次更新须指定技能、比较差异并由用户确认范围，再更新来源说明和校验值；不要静默覆盖本机修改。实际依赖和运行权限以对应技能文档及当前环境为准。

## 仅链接收录

`workbuddy-executor` 和 `deepseek-executor` 来自 [dudu555-djiao/codex-workbuddy-gateway](https://github.com/dudu555-djiao/codex-workbuddy-gateway)。原仓库未提供许可证，用户选择只在根 README 中列出来源和用途，本仓库不包含其技能文件。
