# agent-reach Windows 实战笔记

适用环境：Windows + PowerShell + Codex。这台机器验证过的渠道和踩坑点。

## 环境

Python venv 路径：

```
C:\Users\admin\.agent-reach-venv
C:\Users\admin\.agent-reach-venv\Scripts\agent-reach.exe
C:\Users\admin\.agent-reach-venv\Scripts\yt-dlp.exe
```

外部工具路径（winget/npm 解压后手装位置）：

```
C:\Users\admin\.agent-reach-tools\gh\bin\gh.exe       (gh 2.95.0)
D:\Nodejs\node_global\mcporter                        (mcporter 0.12.3)
```

PATH（用户级）已经包含上面三个目录，但**PowerShell 当前 shell 不会自动刷新**。每次新开一个 shell 用 agent-reach，必须先临时设 PATH：

```powershell
$env:Path = "C:\Users\admin\.agent-reach-tools\gh\bin;C:\Users\admin\.agent-reach-venv\Scripts;D:\Nodejs\node_global;$env:Path"
```

或用一次性 cmd 调用：

```powershell
cmd /c "set `PATH=C:\Users\admin\.agent-reach-tools\gh\bin;C:\Users\admin\.agent-reach-venv\Scripts;D:\Nodejs\node_global;%PATH%` && <命令>"
```

## 已知可用渠道

| 渠道 | 状态 | 触发词 / 工具 |
|---|---|---|
| Exa 全网搜索 | ✅ 实测通过 | 搜一下 / 帮我查 / search online |
| B 站搜索 | ✅ 实测通过 | 搜一下 / 看 B 站 |
| RSS / Atom | ✅ | feedparser 解析 |
| YouTube 视频/字幕 | ⚠️ 装了但需联网验证 | yt-dlp，看视频 |
| GitHub | ⚠️ gh 已装但未认证 | gh auth login（交互） |
| 任意网页 Jina | ❌ 412/超时 | 走代理或换网络 |
| V2EX | ❌ 超时 | 同上 |

## 踩坑点

### 1. mcporter call 的参数格式

`mcporter call exa.web_search_exa --args "<JSON>"` 只能吃 JSON 字符串，**不吃文件路径**。
不要写 `--args /path/to/args.json`，会当 JSON 解析失败。

也不要写 `query="OpenAI latest model 2026"`，会把空格当多参数。

**正确用法**：用 Python 脚本通过 subprocess 传 JSON 字符串：

```python
import json, os, subprocess
extra_path = r"C:\Users\admin\.agent-reach-tools\gh\bin;C:\Users\admin\.agent-reach-venv\Scripts;D:\Nodejs\node_global"
env = os.environ.copy()
env["PATH"] = extra_path + ";" + env.get("PATH", "")
payload = {"query": "...", "numResults": 3}
result = subprocess.run(
    ["mcporter", "call", "exa.web_search_exa", "--args", json.dumps(payload)],
    capture_output=True, env=env, timeout=45,
)
# 中文/特殊字符要写到文件再读，不能直接 print 到 stdout
with open(r"C:\Users\admin\AppData\Local\Temp\out.txt", "wb") as f:
    f.write(result.stdout)
```

不要 print 到 stdout：mcporter 的中文输出含 U+2011 等特殊字符，Windows Python 默认 GBK 编码会崩 `UnicodeEncodeError`。

### 2. B 站 API 必须带浏览器 UA + Referer

默认 `curl api.bilibili.com/...` 直接返回 412。

```python
subprocess.run([
    "curl.exe", "-sS", "--max-time", "15",
    "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "-H", "Referer: https://www.bilibili.com/",
    "https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=<kw>",
], capture_output=True, timeout=30)
```

agent-reach 内置的 B 站渠道已经带好这些头，所以用 skill 触发时不需要手写。

### 3. B 站 API 返回 GBK 编码 JSON

B 站 API 的 title 字段是 GBK 字节混在 UTF-8 字符串里。要拿干净中文：

```python
import requests
r = requests.get(url, headers={"User-Agent": "...", "Referer": "https://www.bilibili.com/"})
r.encoding = "utf-8"  # 关键：覆盖 requests 的自动探测
print(r.json()["data"]["result"][0]["title"])
```

agent-reach 的 format 子命令会做这步处理。

### 4. winget 装 gh 不会自动让 PowerShell 找到 gh.exe

winget --scope user 装完后，`gh.exe` 不在 `WindowsApps` 实际位置。

**解决**：用 winget 下载 zip，Expand-Archive 后手动放路径：

```powershell
winget install --id GitHub.cli -e --scope user
# 找到 zip（一般在 C:\Users\admin\AppData\Local\Temp\WinGet\GitHub.cli.*\gh_*_windows_amd64.zip）
Expand-Archive -LiteralPath <zip> -DestinationPath "$env:USERPROFILE\.agent-reach-tools\gh" -Force
# 把这个 bin 目录加到 PATH
```

### 5. PowerShell 命令行 `&` 转义

PowerShell 见到 URL 里的 `&` 会当成后台操作符。需要 `"...&..."` 或反引号 `` `& `` 转义。

```powershell
# 会崩
curl "...?search_type=video&keyword=OpenAI"
# 正确
curl "...?search_type=video`&keyword=OpenAI"
# 或直接用 Invoke-WebRequest 用变量
$url = "https://...?search_type=video&keyword=OpenAI"
Invoke-WebRequest -Uri $url
```

### 6. mcporter/agent-reach 的子进程 PATH

agent-reach 是 Python 写的，它调 mcporter / yt-dlp / gh 走的是子进程的 PATH。如果 PATH 不对，doctor 会报"未安装"，即使文件实际存在。

**最稳**：用 `cmd /c "set PATH=...;%PATH% && agent-reach ..."` 起一个新 shell。

## 推荐的执行模式

写一个 wrapper Python 脚本到工作区，统一处理：
1. 设 PATH
2. 用 subprocess 调工具
3. 写到文件再读，避免 GBK 编码问题
4. timeout 保护

`C:\Users\admin\AppData\Local\Temp\` 是临时输出好地方，跨进程安全。
