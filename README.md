# Agent Skills

个人创建和收藏的 Agent 技能库，按来源分开管理：

- `skills/created/<技能名>/`：自己创建的技能，包括与 AI 协作创建的技能。
- `skills/collected/<技能名>/`：收藏他人的技能，包括基于他人技能修改的版本，保留原作者与来源。

每个技能独立包含 `SKILL.md` 及其需要的脚本、参考资料和素材。

## 技能目录

### 自己创建

| 技能 | 作者 / 来源 | 用途 |
| --- | --- | --- |
| [finereport-from-image](skills/created/finereport-from-image/SKILL.md) | NANAiiiii，与 Codex 协作创建 | 给它一张报表截图，帮你在 FineReport 中做出或调整对应的驾驶舱，生成可继续编辑的 `.frm` 文件，并检查预览效果。 |

### 收藏他人

| 技能 | 原作者 / 上游对照 | 用途 |
| --- | --- | --- |
| [grilling](skills/collected/grilling/SKILL.md) | [Matt Pocock](https://github.com/mattpocock/skills) | 当你有想法但还没想清楚时，让 AI 一步步追问，帮你明确需求、发现遗漏，再决定怎么做。 |
| [find-skills](skills/collected/find-skills/SKILL.md) | [Vercel](https://github.com/vercel-labs/skills) | 告诉它你想做什么，帮你找有没有现成 Skill，并说明适合装哪一个。 |
| [agent-reach](skills/collected/agent-reach/SKILL.md) | [Panniantong](https://github.com/Panniantong/Agent-Reach) | 让 AI 去网页、GitHub、B站、小红书等平台查资料，并选择对应的搜索或读取工具。 |
| [neat-freak](skills/collected/neat-freak/SKILL.md) | [数字生命卡兹克](https://github.com/KKKKhazix/khazix-skills) | 项目做完后，帮你找出文档与代码不一致、规则过时或交接遗漏的地方，按授权整理收尾，方便下次接着做。 |
| [frontend-design](skills/collected/frontend-design/SKILL.md) | [Anthropic 上游对照](https://github.com/anthropics/skills) | 做网页或应用界面时，帮你设计布局、配色、字体和交互外观；本机副本与当前上游不同。 |
| [interview-prep-generator](skills/collected/interview-prep-generator/SKILL.md) | [davila7 / claude-code-templates](https://github.com/davila7/claude-code-templates) | 面试前，把你的简历和岗位要求交给它，帮你整理项目经历怎么讲、可能被问什么，以及怎样回答。 |
| [security-audit](skills/collected/security-audit/SKILL.md) | [Cloudflare](https://github.com/cloudflare/security-audit-skill) | 想检查代码是否有安全漏洞时，帮你排查风险、验证问题，并说明影响和修复建议。 |
| [codex-with-chatgpt](skills/collected/codex-with-chatgpt/SKILL.md) | [XiaoDuoYa](https://github.com/XiaoDuoYa/codex-with-chatgpt) | 让 ChatGPT 帮忙想方案、检查结果，Codex 负责改文件、运行命令和测试；需要另行安装配套连接工具。 |

这 8 个技能于 2026-11-03 收录，保存本机当时正在使用的版本，不代表各上游最新版。每个目录的 `SOURCE.md` 记录固定上游对照提交、许可和差异，`SHA256SUMS.txt` 记录收录文件的字节校验值；`codex-with-chatgpt` 已将本机路径恢复为安装占位符，其校验对应公开版本。收录规则见[收藏说明](skills/collected/README.md)。

### 仅保留来源链接

以下两个技能的原仓库未提供许可证；按用户选择，只列用途和来源，不在本仓库复制技能文件。

| 技能 | 来源 | 用途 |
| --- | --- | --- |
| workbuddy-executor | [dudu555-djiao / codex-workbuddy-gateway](https://github.com/dudu555-djiao/codex-workbuddy-gateway/tree/main/skills/workbuddy-executor) | 让 Codex 把任务交给桌面 WorkBuddy 执行，等它回报后检查成果，需要时让它继续修改；依赖配套 Gateway。 |
| deepseek-executor | [dudu555-djiao / codex-workbuddy-gateway](https://github.com/dudu555-djiao/codex-workbuddy-gateway/tree/main/skills/deepseek-executor) | 让 Codex 把任务交给 DeepSeek Harness 中的指定会话执行，读取结果、检查成果并安排返工；依赖配套 Gateway 和 Harness 插件。 |

## 使用

将需要的单个技能目录（如 `skills/created/finereport-from-image/`）复制到本机 Codex 的技能目录（通常为 `~/.codex/skills/`），不要复制 `created` 或 `collected` 分类目录。在新会话中通过技能名调用，例如：

> 使用 $finereport-from-image，按这张图片创建原生 FineReport 驾驶舱，保存到我指定的目录。

收藏技能同理，例如复制 `skills/collected/grilling/` 这个完整目录，然后通过 `$grilling` 调用。保留目录内的脚本、参考资料和许可文件；目标已存在时先备份并比较，不直接覆盖。本仓库保存技能说明及支持资料，不会自动安装技能所需的 CLI、登录态或其他外部依赖。

FineReport 技能附带检查脚本、预览脚本和原生参考模板。运行条件和使用方式见技能文档；预览需要可访问的 FineReport 服务及相应授权。

在仓库根目录可用 Python 3（仅标准库）检查参考模板：

```sh
python skills/created/finereport-from-image/scripts/inspect_frm.py skills/created/finereport-from-image/assets/reference-dashboard.frm
```

真实预览另需 Node.js、Playwright、可用的 Chrome 和 FineReport 服务，参数见技能文档。XML 检查通过不能代替服务器预览或设计器验收。

## 收录约定

- 新技能按来源放入对应分类，根目录的技能列表同步更新，不把第三方改版归为自己原创。
- 收藏第三方技能时记录原始来源，保留作者声明及许可证，遵守其使用和再分发条件。
- 不上传账号密码、令牌、会话文件、业务数据、本机日志或预览输出。
- 本仓库不自动同步本机已安装技能，更新时明确选择要提交的内容。

## 更新方式

**手动同步，不自动更新。** 原作者发布新版，不会自动更新本仓库；本仓库有新提交，也不会自动更新本机安装副本。

更新时先选定具体技能，比较上游、本仓库和本机副本的差异，检查新增指令、脚本及许可，再由用户确认要同步哪一份。保留本机修改，更新来源记录和校验值；不配置定时任务、自动覆盖或自动更新工作流。
