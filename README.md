# Agent Skills

个人创建和收藏的 Agent 技能库。每个技能独立存放在 `skills/<技能名>/`，包含 `SKILL.md` 及其需要的脚本、参考资料和素材。

## 技能目录

| 技能 | 用途 |
| --- | --- |
| [finereport-from-image](skills/finereport-from-image/SKILL.md) | 根据截图创建或调整原生 FineReport `.frm` 驾驶舱，使用数据集与原生数据列，并进行预览检查。 |

## 使用

将需要的技能目录复制到本机 Codex 的技能目录（通常为 `~/.codex/skills/`）。在新会话中通过技能名调用，例如：

> 使用 $finereport-from-image，按这张图片创建原生 FineReport 驾驶舱，保存到我指定的目录。

FineReport 技能附带检查脚本、预览脚本和原生参考模板。运行条件和使用方式见技能文档；预览需要可访问的 FineReport 服务及相应授权。

在仓库根目录可用 Python 3（仅标准库）检查参考模板：

```sh
python skills/finereport-from-image/scripts/inspect_frm.py skills/finereport-from-image/assets/reference-dashboard.frm
```

真实预览另需 Node.js、Playwright、可用的 Chrome 和 FineReport 服务，参数见技能文档。XML 检查通过不能代替服务器预览或设计器验收。

## 收录约定

- 新技能放在独立目录，根目录的技能列表同步更新。
- 收藏第三方技能时记录原始来源，保留作者声明及许可证，遵守其使用和再分发条件。
- 不上传账号密码、令牌、会话文件、业务数据、本机日志或预览输出。
- 本仓库不自动同步本机已安装技能，更新时明确选择要提交的内容。
