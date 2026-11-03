# neat-freak — 来源与收录记录

- 原作者 / 上游维护者：数字生命卡兹克 / KKKKhazix。
- 上游仓库：[KKKKhazix/khazix-skills](https://github.com/KKKKhazix/khazix-skills)。
- 上游对照目录：[neat-freak](https://github.com/KKKKhazix/khazix-skills/tree/322346ded8129436b3f64707789a73e732ae24d9/neat-freak)。
- 上游对照提交：`322346ded8129436b3f64707789a73e732ae24d9`。
- 收录日期：2026-11-03。
- 收录来源：本机已安装技能的当前副本；这是手动快照，不是自动追踪上游的安装。
- 原始安装版本：技能声明版本 3.0.0，全部文件与上述提交相同；不据此推断原始安装提交。
- 许可证：[MIT](LICENSE)，保留原始许可及声明，不宣称原创。
- 原始 SKILL.md SHA256：`6c0ca2236d3518ccaad710f6db8e9c4aa7af67b685dc699ad347ae42186951e1`。
- 原始文件清单及 SHA256：[SHA256SUMS.txt](SHA256SUMS.txt)（只覆盖本机收录的 96 个原始文件；不包括新增的来源记录和补充许可证）。

## 与上游的差异

版本 3.0.0。本机全部 96 个原始文件与固定上游提交逐字节相同，未修改。

差异只表示与固定对照提交不一致，也可能是历史版本差异，不等于收录者修改。补入该固定上游提交的 MIT LICENSE；新增 SOURCE.md 和 SHA256SUMS.txt。原始技能和支持文件没有重新排版、改换行或改指令。

evals/fixtures/ 中的 .env、记忆和会话样例是上游合成测试夹具，不是本机真实凭据、记忆或会话；保留用于回归验证。

测试夹具包含刻意缺失的记忆引用等负面样例，不按正式文档修复。scripts/audit-inventory.sh 的 POSIX 可执行位在 Git 中保留；原始 evals/validate.py 在 Windows 原生运行时会因该执行位断言失败，需在 POSIX 环境运行，或明确以 Git 模式位进行 Windows 元数据兼容验证。这不是对原脚本的修改，也不代表完成动态行为评估。

## 更新约定

手动同步，不自动更新。原作者仓库、本收藏仓库和本机已安装副本互不自动同步。更新时先比较指定技能的差异、检查许可与安全边界，再由用户确认同步范围；不能用上游最新版静默覆盖本机修改。
