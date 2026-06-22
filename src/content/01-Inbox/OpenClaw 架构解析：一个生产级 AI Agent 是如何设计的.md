---
tags:
  - 前端工程化
  - AI
  - Typescript
  - OpenClaw架构解析
isPub: true
title: OpenClaw 架构解析：一个生产级 AI Agent 是如何设计的
dateCreated: 2026-03-05T17:29:41+08:00
dateModified: 2026-03-05T17:29:51+08:00
description: 深入解析 Claude tool use、Anthropic SDK、Vercel AI SDK 与 pi-ai 的架构差异，结合 git worktree 实现多 Agent 并行隔离执行，附完整代码示例。
---
# OpenClaw 架构解析：一个生产级 AI Agent 是如何设计的

> OpenClaw / MiniClaw / Anthropic SDK / Vercel AI SDK / pi-ai / parallel-code / Git Worktree

## 目录

1. [OpenClaw 架构与服务分层](#1-openclaw-架构与服务分层)
2. [Claude Agent 内部决策流程](#2-claude-agent-内部决策流程)
3. [工具调用的完整生命周期](#3-工具调用的完整生命周期)
4. [Anthropic SDK：Tool 传入与背后逻辑](#4-anthropic-sdktool-传入与背后逻辑)
5. [Vercel AI SDK：自动化 Loop](#5-vercel-ai-sdk自动化-loop)
6. [三方 SDK 横向对比](#6-三方-sdk-横向对比)
7. [parallel-code 多 Agent 并行架构](#7-parallel-code-多-agent-并行架构)
8. [Git Worktree 完整解析](#8-git-worktree-完整解析)
9. [用 pi-ai 复现 parallel-code](#9-用-pi-ai-复现-parallel-code)

---

## 1. OpenClaw 架构与服务分层

### 定位

OpenClaw 是一个网关（Gateway），一个坐在 AI 模型和外部世界中间的单体运行时，不是框架。

### 五层服务

第一层：渠道适配层（Channel Adapter）

把 Discord、Telegram 等不同平台的输入转成统一消息格式，顺便提取附件。一个 Agent 挂多个渠道靠的就是这层。

第二层：网关服务器（Gateway Server）

流量总入口。Session Router 判断消息属于哪个会话，然后交给 Lane Queue（车道队列）做并发管理，避免多个对话同时跑的时候请求撞车或上下文串了。

第三层：Agent Runner（智能体运行器）

管模型选择、API Key 轮换冷却、提示词拼装和上下文窗口。

第四层：Agent Runtime / Agentic Loop

跑完整的 AI 循环：从会话历史和记忆里拼上下文 → 调模型 → 执行工具（浏览器自动化、文件操作、Canvas、定时任务等）→ 把更新后的状态存下来。

就是模型说"我要调工具"，系统执行，结果塞回去，模型再想，再调，直到搞定为止。

第五层：Memory & Skills

文件都很朴素：
- `events.jsonl`：逐行审计日志
- `MEMORY.md`：Markdown 格式的记忆，存摘要和经验
- `skills/`：Markdown 技能文件，按关键词匹配动态加载

### Mini Claw 生态

| 项目 | 语言 | 定位 | 学习价值 |
|---|---|---|---|
| htlin222/mini-claw | TypeScript | 极简替代品 | 理解 Agent Loop |
| xprilion/miniclaw | Python | 生产就绪版 | 完整服务分层实现 |
| mattdef/miniclaw | Rust | 边缘计算版 | <15MB，256MB RAM 能跑 |
| PLKwan/miniclaw | — | AI-native 无配置版 | skills-over-features 思路 |

---

## 2. Claude Agent 内部决策流程

### 工具类型决策

```
收到用户消息
  ↓
意图识别：是否需要实时信息？
  ↓
选择工具类型：
  web_search（宽泛查询）
    → web_fetch（深入具体页面）
    → bash/file（文件操作任务）
    → 直接回答（知识性问题，无需工具）
```

### 和 OpenClaw 的对照

| OpenClaw 层 | Claude 的对应 |
|---|---|
| Channel Adapter | claude.ai 界面 / API → 统一消息格式 |
| Session Router | 对话历史上下文 |
| Agent Runner | 系统提示词 + 工具列表注入 |
| Agentic Loop | tool_call → result → 再推理 → 再 tool_call |
| Memory (AGENTS.md) | 系统提示 + 用户偏好 |
| Skills | `/mnt/skills/` 文件系统 |

---

## 3. 工具调用的完整生命周期

### 第 1 步：发送请求（带工具定义）

```json
POST /v1/messages
{
  "model": "claude-sonnet-4-6",
  "tools": [
    {
      "name": "get_weather",
      "description": "查询指定城市的天气",
      "input_schema": {
        "type": "object",
        "properties": {
          "city": { "type": "string" }
        },
        "required": ["city"]
      }
    }
  ],
  "messages": [
    { "role": "user", "content": "新加坡今天天气怎么样？" }
  ]
}
```

### 第 2 步：模型返回 `tool_use` 块

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01XyZ",
      "name": "get_weather",
      "input": { "city": "Singapore" }
    }
  ],
  "stop_reason": "tool_use"
}
```

注意 `stop_reason` 是 `tool_use`，说明模型主动停下来等结果，不是对话结束。

### 第 3 步：执行工具，回传结果

```json
{
  "messages": [
    { "role": "user", "content": "新加坡今天天气怎么样？" },
    {
      "role": "assistant",
      "content": [{ "type": "tool_use", "id": "toolu_01XyZ", ... }]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01XyZ",
          "content": "{ \"temp\": 31, \"humidity\": 84, \"condition\": \"Partly Cloudy\" }"
        }
      ]
    }
  ]
}
```

注意 `tool_result` 挂在 `user` role 下面，不是 `assistant`。工具执行的结果属于"外部世界"的返回，放在 user 侧。

### 第 4 步：生成最终答案

```json
{
  "role": "assistant",
  "content": [{ "type": "text", "text": "新加坡今天天气部分多云，气温 31°C..." }],
  "stop_reason": "end_turn"
}
```

### 流程总结

```
用户消息
  ↓
模型 → stop_reason: "tool_use"   （模型不知道天气，停下来）
  ↓
你的程序调用真实 API
  ↓
tool_result 作为 user 消息回传
  ↓
模型 → stop_reason: "end_turn"   （现在知道了，给出答案）
```

一句话：模型本身不执行任何工具。它只输出"调用意图"，HTTP 请求、数据库查询这些活儿全是你的程序干的。模型是调度者，不是执行者。

---

## 4. Anthropic SDK：Tool 传入与背后逻辑

### Python SDK 示例

```python
import anthropic
import json

client = anthropic.Anthropic()

tools = [
    {
        "name": "get_weather",
        "description": "查询指定城市的实时天气。当用户询问天气时调用此工具。",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名，如 Singapore 或 New York"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "温度单位"
                }
            },
            "required": ["city"]
        }
    }
]

# 第一次调用
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "新加坡今天多少度？"}]
)

tool_use_id = response.content[0].id
result = get_weather(**response.content[0].input)

# 回传结果
response2 = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "新加坡今天多少度？"},
        {"role": "assistant", "content": response.content},
        {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": tool_use_id,
                    "content": json.dumps(result)
                }
            ]
        }
    ]
)
```

### 背后的 5 个逻辑

1. `tools` 参数被注入系统提示词

传入 `tools` 时，API 会自动拼一段系统提示：

```
In this environment you have access to a set of tools...

<functions>
{ "name": "get_weather", "description": "...", "parameters": { ... } }
</functions>
```

工具不是什么魔法，就是被转成 prompt 里的文字描述。模型靠读这段文字来"学会"怎么调用。

2. `tool_result` 挂在 `user` role 下

消息模型只有 `user` 和 `assistant` 两种 role，工具执行属于外部世界的返回，归 user 侧。

3. `tool_choice` 控制调用策略

```python
tool_choice={"type": "auto"}                        # 默认，模型自行决定
tool_choice={"type": "any"}                         # 必须调用某个工具
tool_choice={"type": "tool", "name": "get_weather"} # 只能调这个工具
tool_choice={"type": "none"}                        # 禁止调用工具
```

4. 并行工具调用

模型可以在一次响应里返回多个 `tool_use` 块，全部执行完后一起回传：

```python
{
    "role": "user",
    "content": [
        {"type": "tool_result", "tool_use_id": "toolu_001", "content": "31°C"},
        {"type": "tool_result", "tool_use_id": "toolu_002", "content": "12°C"},
    ]
}
```

5. Tool Runner（自动化 Agentic Loop，Beta）

Tool Runner 是个可迭代对象，自动循环处理工具调用。token 用量超过阈值时会自动压缩生成摘要，让长任务可以突破上下文窗口限制。

---

## 5. Vercel AI SDK：自动化 Loop

### 和原生 SDK 的区别

原生 SDK 给你原材料，loop 自己写。Vercel AI SDK 给你成品流水线，`execute` 绑定加自动循环。

### 示例

```typescript
import { tool, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// 定义时直接绑定执行函数
const getWeather = tool({
  description: '查询指定城市的实时天气',
  inputSchema: z.object({
    city: z.string().describe('城市名'),
    unit: z.enum(['celsius', 'fahrenheit']).optional()
  }),
  execute: async ({ city, unit = 'celsius' }) => {
    const data = await fetchWeatherAPI(city);
    return { temp: data.temp, condition: data.condition };
  }
});

// 自动循环直到没有工具调用
const { text, steps } = await generateText({
  model: anthropic('claude-sonnet-4-6'),
  tools: { getWeather },
  stopWhen: stepCountIs(10),
  prompt: '新加坡和东京今天天气怎样，哪个更适合旅游？'
});
```

### SDK 内部自动干了什么

```
你调用 generateText(tools, stopWhen)
  ↓
SDK 发请求 → 模型返回 tool_use
  ↓
SDK 自动找到 execute 函数并调用
  ↓
SDK 自动构建 tool_result 消息
  ↓
SDK 自动再发一次请求（新的一步）
  ↓
重复，直到 stop_reason = "end_turn"
  ↓
返回最终 { text, steps }
```

### 人工审批门控（AI SDK 6）

```typescript
const deleteFile = tool({
  description: '删除文件',
  inputSchema: z.object({ path: z.string() }),
  needsApproval: true,   // 暂停，等人点确认
  execute: async ({ path }) => { /* ... */ }
});
```

### 三种执行位置

| 类型 | 在哪执行 | 怎么触发 |
|---|---|---|
| Server Tool | 服务器（Node.js） | `execute` 函数自动调用 |
| Client Auto Tool | 浏览器 | `onToolCall` 回调 |
| Client UI Tool | 浏览器 | 渲染组件，等用户操作 |

---

## 6. 三方 SDK 横向对比

### 工具定义方式

| SDK | Schema 格式 | 执行绑定 | 类型安全 |
|---|---|---|---|
| Anthropic 原生 | JSON Schema（纯对象） | 手动 | 无 |
| Vercel AI SDK | Zod | `execute` 绑定 | 有 |
| pi-ai | TypeBox | `execute` + `onUpdate` 回调 | 有 |

### Agent Loop 控制方式

| | Anthropic SDK | Vercel AI SDK | pi-ai |
|---|---|---|---|
| Loop 方式 | 自己写 while | `stopWhen: stepCountIs(n)` | 自动循环，无 maxSteps |
| 停止控制 | 手动 break | `stopWhen` 条件 | 信任模型自己判断 |
| 流式事件 | 无内置 | `onStepFinish` 回调 | 完整事件流 |
| 多 Provider | 只支持 Anthropic | 支持 | 支持（含 OpenRouter） |

### pi-ai 独有的东西

Session 树状结构：Session 以树状存储，可以在会话中分支。比如开一个支线任务去修 bug，不消耗主会话的 context，修完后回滚到主会话之前的位置。

pi-ai 的包分层：

```
pi-ai              ← 只要 LLM 通信（多 Provider 统一接口）
pi-agent-core      ← 需要 tool loop（Agent 运行时）
pi-coding-agent    ← 需要完整 coding agent
pi-tui             ← 需要 TUI 终端界面
```

OpenClaw 本身用的就是 pi SDK。

### 选型

```
你的场景是什么？
│
├── 需要完整控制 / 学习底层原理
│   └── Anthropic 原生 SDK（手动 loop）
│
├── 快速构建 Next.js / React 应用
│   └── Vercel AI SDK（上手最快，生态完整）
│
└── 构建 Terminal 工具 / 编码 Agent / 嵌入 OpenClaw 类产品
    └── pi-ai（最灵活，无框架锁定）
```

---

## 7. parallel-code 多 Agent 并行架构

### 是什么

parallel-code 是一个 Electron 桌面 App，把三件事捏在一起：
- 每个 Agent 有独立 GUI 面板
- 每个任务自动用 git worktree 做隔离
- 支持同时派 N 个任务然后走开

### 怎么跑的

```
用户点击「新建任务」
  ↓
Electron 主进程自动执行：
  git worktree add .trees/task-name -b task-name
  ↓
在新目录 spawn 一个 pty（伪终端）进程
  运行 claude / codex / gemini CLI
  ↓
Electron renderer（前端）通过 IPC 订阅终端输出流
  在 UI 里渲染每个 Agent 的面板
```

### 隔离分三层

```
文件系统隔离  → git worktree（每个 Agent 在不同目录）
进程隔离      → 独立 pty 进程（每个 Agent 有独立的 env 和 PATH）
上下文隔离    → 每个 CLI 进程有独立的会话历史
```

---

## 8. Git Worktree 完整解析

### Git 内部数据模型

```
.git/
├── objects/          ← 对象数据库（所有内容存在这里）
│   ├── pack/         ← 压缩后的对象包
│   └── ab/cd1234...  ← 单个对象（blob/tree/commit/tag）
├── refs/
│   ├── heads/        ← 本地 branch 指针
│   │   ├── main      ← 内容: "a1b2c3d4..."（一个 commit hash）
│   │   └── feature   ← 内容: "e5f6g7h8..."
│   └── remotes/      ← 远程 branch 指针
├── HEAD              ← 当前激活的 branch（"ref: refs/heads/main"）
├── index             ← Staging Area（暂存区）
└── config            ← 仓库配置
```

`objects/` 是仓库的真实数据，文件内容、目录结构、提交历史全在里面。`HEAD`、`index`、工作目录都只是"视图"。

### 普通 clone 浪费磁盘

```bash
git clone repo/ project-feature-auth   # .git/objects/ → 500MB
git clone repo/ project-feature-ui     # .git/objects/ → 再复制 500MB
git clone repo/ project-bugfix         # .git/objects/ → 再复制 500MB
# 总计：1.5GB，其实是同一份数据复制了三次
```

### Worktree 的磁盘结构

```bash
git worktree add .trees/feature-auth -b feature-auth
git worktree add .trees/feature-ui   -b feature-ui
git worktree add .trees/bugfix-api   -b bugfix-api
```

```
my-project/
├── .git/
│   ├── objects/                   ← 唯一的对象数据库（所有 worktree 共享）
│   ├── refs/heads/
│   │   ├── main
│   │   ├── feature-auth
│   │   ├── feature-ui
│   │   └── bugfix-api
│   │
│   └── worktrees/                 ← 每个附加 worktree 的元数据
│       ├── feature-auth/
│       │   ├── HEAD               ← "ref: refs/heads/feature-auth"
│       │   ├── index              ← 独立的暂存区
│       │   ├── gitdir             ← 指回主 .git 的路径
│       │   └── commondir          ← "../../" 告诉 Git 去哪找 objects/
│       ├── feature-ui/
│       │   ├── HEAD               ← 独立 HEAD
│       │   └── index              ← 独立暂存区
│       └── bugfix-api/
│           ├── HEAD
│           └── index
│
├── src/                           ← 主工作区文件（main branch）
│
├── .trees/feature-auth/           ← 附加工作区（feature-auth branch）
│   ├── .git                       ← 不是目录！是一个文件
│   │   └── 内容: "gitdir: ../../.git/worktrees/feature-auth"
│   └── src/                       ← 独立的工作文件
│
├── .trees/feature-ui/
└── .trees/bugfix-api/
```

### 每个 Worktree 独立和共享的部分

独立的：
- 工作目录（磁盘上的文件）
- HEAD（当前指向哪个 branch）
- index（暂存区，git add 的内容）
- MERGE_HEAD / CHERRY_PICK_HEAD（进行中的操作状态）
- 未提交的修改

共享的：
- objects/（所有 commit、文件内容的数据库）
- refs/（所有 branch 和 tag 的指针）
- config（remote 配置、用户信息）
- hooks/（git hook 脚本）

### 同一 branch 不能被两个 worktree 同时 checkout

```bash
# 假设 main 已经在主工作区被 checkout
git worktree add .trees/main-copy main
# 报错：fatal: 'main' is already checked out at '/my-project'
```

Git 用 `.git/worktrees/<name>/locked` 文件来记录锁定状态，防止冲突。

### 常用命令

```bash
# 创建新 worktree（自动创建新 branch）
git worktree add .trees/feature-auth -b feature-auth

# 创建新 worktree（从指定 commit/branch 开始）
git worktree add .trees/hotfix origin/main

# 查看所有 worktree
git worktree list
# 输出：
# /my-project              a1b2c3d [main]
# /my-project/.trees/feature-auth  e5f6g7h [feature-auth]

# 删除 worktree
git worktree remove .trees/feature-auth

# 强制删除
git worktree remove --force .trees/feature-auth

# 清理已手动删除的 worktree 的残留元数据
git worktree prune
```

### 为什么 AI Agent 并行要用这个

```
Agent 1 在 .trees/feature-auth/ 运行
  → 读写文件：只影响这个目录
  → git add / commit：只提交到 feature-auth branch
  → 跑测试：在这个目录的代码上跑

Agent 2 在 .trees/feature-ui/ 运行
  → 完全感知不到 Agent 1 的存在
  → 两个 Agent 可以同时改"同名文件"（如 src/app.ts）
     但在不同 branch 上，完全不冲突
```

隔离靠的是 Git 原生的分支机制，在文件系统层面就把冲突的可能性断掉了，不需要应用层加锁。

---

## 9. 用 pi-ai 复现 parallel-code

### 方案一：Node.js 纯代码并行

```typescript
import { createAgentSession } from "@mariozechner/pi-coding-agent";
import { execSync } from "child_process";
import path from "path";

function createWorktree(taskName: string, baseBranch = "main") {
  const worktreePath = path.resolve(`.trees/${taskName}`);
  execSync(`git worktree add ${worktreePath} -b ${taskName} ${baseBranch}`);
  return worktreePath;
}

async function spawnAgent(taskName: string, prompt: string) {
  const worktreePath = createWorktree(taskName);

  const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
    workingDirectory: worktreePath,   // ← 隔离点
  });

  return session.prompt(prompt);
}

// 用 Promise.all 并行跑多个 Agent
const tasks = [
  { name: "feature-auth",   prompt: "实现 OAuth2 登录流程" },
  { name: "feature-search", prompt: "实现全文搜索功能" },
  { name: "bugfix-api",     prompt: "修复 /api/users 的 500 错误" },
];

const results = await Promise.all(
  tasks.map(({ name, prompt }) => spawnAgent(name, prompt))
);
```

### 方案二：Orchestrator 模式

```typescript
class ParallelOrchestrator {
  private tasks = new Map<string, TaskState>();

  async dispatch(taskName: string, prompt: string) {
    const worktreePath = this.createWorktree(taskName);
    const session = await this.createSession(worktreePath);

    this.tasks.set(taskName, { status: "RUNNING", worktreePath, session });

    // 不 await，让它在背景跑
    session.prompt(prompt).then(() => {
      this.tasks.get(taskName)!.status = "COMPLETE";
    });
  }

  status() {
    return [...this.tasks.entries()].map(([name, state]) => ({
      name, status: state.status, branch: name
    }));
  }

  async merge(taskName: string) {
    execSync(`git merge ${taskName}`, { cwd: process.cwd() });
    execSync(`git worktree remove .trees/${taskName}`);
    this.tasks.delete(taskName);
  }
}
```

### parallel-code vs pi-ai 方案

| 隔离层 | parallel-code | pi-ai 方案 |
|---|---|---|
| 文件系统 | git worktree（独立目录） | git worktree（独立目录） |
| Agent 上下文 | 独立 CLI 进程 | 独立 `session` 内存对象 |
| 会话历史 | 进程级隔离 | `SessionManager.inMemory()` 各自隔离 |
| GUI | Electron 面板 | 需自己实现 |
| 合并流程 | 点击按钮 PR | `git merge` 命令 |

---

*整理自对话学习笔记。*
