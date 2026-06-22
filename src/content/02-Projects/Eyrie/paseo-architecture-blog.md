---
title: paseo-architecture-blog
author: EyrieAI
date: 2026-06-12
tags:
  - software-engineering
  - ai-agent
  - platform-engineering
  - architecture
description: 当多个 AI Coding Agent 同时操作同一项目，端口冲突、WebSocket 碰撞、文件覆盖——这些问题本质上不是配置问题，而是架构问题。本文从第一性原理出发，拆解 Paseo 的四层隔离模型，以及它如何把 O(N×M) 的手工复杂度降维成一份声明式配置。
isPub: true
dateCreated: 2026-06-12T10:12:24+08:00
dateModified: 2026-06-12T11:13:39+08:00
---

# Agent 并行开发的冲突解决之道：从端口碰撞到平台层抽象

> 如果你觉得 `PORT=3001 npm run dev` 就够了，那你还没同时跑过三个 Agent。

---

## 问题不在端口，在假设

2026 年，AI Coding Agent 已经能独立完成从写代码到提 PR 的全流程。但当你想同时跑三个 Agent——一个做登录模块、一个做支付、一个修 Bug——你会发现世界崩塌了。

不是模型不够好，不是上下文不够长。是 **Agent A 的 dev server 占了 3000 端口，Agent B 的 dev server 直接 EADDRINUSE 炸了**。

更隐蔽的是：Vite 的 HMR WebSocket 固定占用 24678 端口。就算 HTTP 端口全部分配了不同值，三个 Vite 实例的 WebSocket 还是会撞在一起，热更新集体失效。你改了一行代码，浏览器不刷新，Agent 以为自己改坏了，又改回去——然后陷入死循环。

这不是配置问题。这是**架构问题**。

---

## 第一性原理：三个冲突，一个根源

我们先把问题拆到最底层。

**冲突一：端口是全局命名空间**

TCP 端口是一个操作系统级的单例资源。`:3000` 同时只能被一个进程绑定。这跟 Redis 的 `KEYS *`、跟全局变量、跟单线程模型的共享状态——是同一类问题：**共享可变状态在并发下的必然冲突**。

**冲突二：WebSocket 端口是影子资源**

Vite 把 HMR WebSocket 设计为独立端口，且不跟随 HTTP 端口变化。这是框架级别的硬编码假设——"一台机器只会跑一个 Vite"。在 Agent 时代，这个假设失效了。

**冲突三：文件系统是共享的**

两个 Agent 同时 `npm install`，同时写 `src/auth.ts`，同时跑 `npm run build`。工作目录是同一个。依赖安装互相覆盖，构建产物互相污染。

这三个冲突有一个共同根源：**开发工具链假定"一个项目 = 一个开发者 = 一个运行实例"**。Agent 打破了这个假定，但没有提供替代方案。

---

## 四条路径，只有一条能治本

### 路径 A：手动换端口

```bash
PORT=3001 npm run dev
```

问题：它能解决 HTTP 端口，解决不了 Vite 的 WebSocket 端口。三个 Agent 就是三个手动配置点。四个服务（前端、后端、数据库、Redis）就是 3×4=12 个手动配置点。而且这些数字需要你自己记住——Agent A 的预览在 `:3001`，Agent B 在 `:3003`，手机上看还得输 IP:端口。

**结论：O(N×M) 的手工复杂度，不可扩展。**

### 路径 B：Docker 容器隔离

```yaml
services:
  app:
    ports:
      - "0:3000"  # 随机宿主机端口
```

问题：Docker 太重。每次创建 Agent 任务需要拉起全套容器，冷启动 10-30 秒。Agent 改一行代码想预览效果，等容器重启的时间够它写完整个函数了。而且容器内的 `node_modules` 无法共享，3 个 Agent 就是 3 份完整的 `node_modules`，磁盘和安装时间都翻倍。

**结论：隔离足够，但太重、太慢。Agent 需要的是"瞬时隔离"。**

### 路径 C：Git Worktree + 手动编排

```bash
git worktree add ../feat-auth feature-auth
cd ../feat-auth && npm ci
PORT=3001 npm run dev  # 还得记着这个端口
```

问题：Worktree 解决了文件隔离，端口还得手动管。你知道 feat-auth 用了 `:3001`，feat-payment 用了 `:3002`——但一个月后回来再看，那些数字早就忘了。

**结论：有隔离但缺编排，手工管理的上限是 2 个 Agent。**

### 路径 D：平台层抽象（Paseo 的做法）

把端口分配、请求路由、文件隔离从应用层提升到平台层。开发者只声明"我有什么服务"，平台负责分配资源、建立路由、透传流量。

```
你写的：paseo.json（声明式）    →    运行时自动变成：隔离 worktree + 唯一端口 + 可读 URL + WS 透传
```

**结论：把 O(N×M) 降到 O(1)。这才是治本。**

---

## Paseo 的四层模型

Paseo 的冲突解决不是一个功能，而是一套分层架构。每一层独立解决一个问题，层与层之间通过明确的接口（环境变量、URL 格式、worktree 路径）耦合。

### 第一层：Git Worktree —— 文件系统隔离

这是最底层。每个 Agent 获得一个独立的 Git worktree——一份代码的平行副本：

```
~/.paseo/worktrees/
└── 1vnnm9k3/                    ← 源仓库路径的 hash
    ├── tidy-fox/                ← Agent A：feature-auth 分支
    │   ├── src/  node_modules/  paseo.json
    └── bold-owl/                ← Agent B：feature-payment 分支
        ├── src/  node_modules/  paseo.json
```

Worktree 不同于 `git clone`——它共享 `.git` 对象库，创建几乎瞬间完成，磁盘开销仅增量文件。每个 Worktree 拥有独立的 `node_modules`、独立的 `.env`、独立的构建缓存。

**工程意义**：Worktree 不是新鲜事物（Git 2.5 就有了），但把它作为 Agent 的基础设施原语，是一种设计选择。它比 Docker 轻得多（毫秒级 vs 秒级），比手动 `cp -r` 安全得多（git 保证了可追溯和可合并），且天然与 Git 工作流融合（Agent 的改动就是普通分支，review 就是普通 diff）。

### 第二层：动态端口分配 —— 网络命名空间隔离

有了独立的工作目录，还需要独立的网络端口。Paseo 的做法是**声明式**：项目通过 `paseo.json` 声明自己有哪些服务，daemon 在运行时分配端口。

```json
{
  "scripts": {
    "web": {
      "type": "service",                          // 标记为长期运行的服务
      "command": "npm run dev -- --port $PASEO_PORT",  // 用变量，不写死
      "port": 3000                                 // 默认端口（可选）
    },
    "api": {
      "type": "service",
      "command": "go run . --port $PASEO_PORT"
    }
  }
}
```

关键设计决策：

**1. 为什么是 `$PASEO_PORT` 而不是自动检测端口？**

因为自动检测有竞态条件。Agent A 检测到 14001 空闲，但在它 `listen()` 之前，Agent B 也可能检测到 14001 空闲。daemon 作为唯一调度者，先分配、后启动，避免了所有竞态。

**2. 为什么不在 daemon 里强行改写进程的网络栈？**

技术上可以通过 `LD_PRELOAD` 劫持 `bind()` syscall，或者用网络命名空间。但这会让 dev server 的日志和实际监听的端口不一致，调试噩梦。Paseo 选择了一个更干净的方案：**约定优于注入**——项目遵守"用 `$PASEO_PORT`"的约定，daemon 提供环境变量。

**3. 为什么端口是分配而非共享？**

因为不同 worktree 的 dev server 可能跑不同版本的代码、不同的数据库状态。共享端口意味着共享后端状态，这会引入更隐蔽的 bug——Agent A 改 API 返回格式，Agent B 的前端莫名其妙报错，因为它们在共用同一个 API 进程。

### 第三层：反向代理 —— 人类可读的路由

端口是机器友好的（`:14001`），但对人类是噪音。Paseo 的反向代理把数字端口映射为可读 URL：

```
http://web--feature-auth--my-app.localhost:6767
      ─┬── ────┬───── ──┬──
       │       │         └─ 项目名
       │       └─ 分支名
       └─ 服务名
```

这个 URL 格式有几个精细的设计：

**1. 用 `--` 分隔，不用 `/`**

`/` 会让浏览器把 `web` 当作路径而非域名的一部分。`--` 是合法的主机名字符，且几乎不会出现在实际的服务名或分支名中。

**2. `*.localhost` 不需要 DNS**

现代操作系统（macOS、Linux、Windows 10+）自动将 `*.localhost` 解析到 `127.0.0.1`。零配置。

**3. URL 是确定性的**

同一个 worktree 的同一个 service，每次重启 URL 不变。因为 URL 只依赖三个稳定的标识符（服务名、分支名、项目名），而不依赖端口号。你可以把这个 URL 存书签、写进 README、发到 Slack——都不会过期（除非 worktree 被 archive）。

### 第四层：WebSocket 透传 —— 代理的最后一公里

反向代理最难处理的协议就是 WebSocket。HTTP 请求是一次性的——代理转发请求、收到响应、关闭连接。WebSocket 是长连接——代理需要把 TCP 连接升级为全双工隧道，然后一直维持。

Paseo 的反向代理在检测到 `Upgrade: websocket` 请求头后，自动完成升级握手，后续帧双向透明转发。这意味着 Vite 的 HMR、Next.js 的 Fast Refresh、Webpack 的 WDS 热更新全部正常工作，不需要任何额外配置。

**为什么 Nginx 做不到"零配置"？**

Nginx 必须显式声明 `proxy_set_header Upgrade $http_upgrade` 和 `proxy_set_header Connection "upgrade"`。这不是 Nginx 的缺陷——Nginx 的设计目标是通用反向代理，它不能假设所有后端都是 WebSocket。但 Paseo 的设计目标就是 dev server 代理，所有 dev server 都可能发出 WebSocket 升级请求，所以这个假设是安全且合理的。

---

## 工程谱系：这不是凭空发明

Paseo 的设计不是凭空冒出来的。它在工程史上有四条清晰的谱系：

### 1. 十二因子应用（12-Factor App）

十二因子的第三因子是"配置存储在环境变量中"——端口不应写死在代码里，而应通过 `PORT` 环境变量注入。Paseo 的 `$PASEO_PORT` 就是这个原则的 Agent 时代延续。

### 2. 服务网格（Service Mesh）

Istio/Envoy 的 Sidecar 模式：应用不需要知道网络拓扑，sidecar 透明代理所有流量。Paseo daemon 就是 Agent 的 sidecar——Agent 只知道 `$PASEO_PORT`，不知道前面有反向代理、不知道还有其他 Agent 实例、不知道自己的 URL 是什么。

### 3. 平台工程（Platform Engineering）

Heroku、Fly.io、Kubernetes 的核心思想：开发者声明意图，平台负责调度资源。`paseo.json` 就是声明，"启动 web 和 api"就是意图，daemon 就是调度器。

### 4. 声明式基础设施（Declarative Infrastructure）

Terraform、Kubernetes YAML、Nix Flake——"描述想要的状态，而非执行的步骤"。Paseo.json 描述"这个项目有哪些服务"，而不是"在 14001 端口启动 web，在 14002 端口启动 api"。后者是命令式，前者是声明式。

---

## 如果拆成独立模块

Paseo 的四个核心能力，每一个都可以拆成独立可复用的模块：

| 模块 | 职责 | 接口 | 独立可行性 | 已有竞品 |
|---|---|---|---|---|
| **Worktree Manager** | 创建/管理隔离工作区，生命周期钩子 | `Create(opts) → Workspace`, `Archive(ws)` | 🟢 零外部依赖 | 无直接竞品 |
| **Port Allocator** | 为多进程分配互不冲突的 HTTP+WS 端口 | `Allocate(key, PortHTTP/PortWS) → int` | 🟢 最易独立 | comport (Rust) |
| **Reverse Proxy** | Host 头路由 + WS 自动透传 | `AddRoute(hostname, target)`, `RemoveRoute(hostname)` | 🟡 需定义路由管理协议 | Caddy/Traefik（偏静态配置） |
| **Env Injector** | 向子进程注入服务地址，实现零配置服务发现 | `Register(svc)`, `EnvFor(svcName) → []string` | 🟢 纯数据结构 | Docker Compose 网络别名（容器层） |

**组合方式**：这四个模块只依赖一个共享的 Service 定义结构体，彼此间无代码耦合。你可以只引入 Port Allocator 来管理 monorepo 的并发 dev server，也可以全栈引入四个模块来构建自己的 Agent 平台。

**拆分价值**：如果有人想写一个新 Agent CLI（不管基于 Claude、Codex、还是自定义模型），不需要从零实现 worktree + 端口管理。直接引入这四个模块，专注做 Agent 逻辑。就像 `express` 之于 Node.js HTTP，这些模块可以成为 Agent 开发环境管理领域的标准组件。

---

## 一个可能的开放标准：Dev Workspace Spec

如果这四层不只是 Paseo 的内部设计，而是社区标准，可以定义一个 `dev-workspace.json`：

```json
{
  "$schema": "https://dev-workspace-spec.dev/schema.json",
  "version": "1.0",
  "project": "my-app",
  "services": {
    "web": {
      "command": "npm run dev",
      "httpPort": 3000,
      "wsPort": 24678
    },
    "api": {
      "command": "go run .",
      "httpPort": 8080
    }
  },
  "setup": "npm ci && cp .env.example .env",
  "teardown": "rm -rf .cache"
}
```

这个 spec 可以同时被 Paseo、Multica、CI 系统、甚至 VS Code 插件消费。`git clone` 一个项目 → 它自带 `dev-workspace.json` → 任何兼容的 runtime 自动创建隔离 worktree + 分配端口 + 启动所有服务 + 生成预览 URL。不管你用什么工具，体验完全一致。

**这定义了 Agent 时代的开发环境标准。**

---

## 结语

Paseo 的四层模型回答了这个问题：

> 当开发不再是"一个人 + 一个 IDE"，而是"多个人类 + 多个 Agent + 多台机器"，开发工具链需要做出什么改变？

答案不是更好的端口管理器、不是更重的容器、不是更复杂的 CI 配置。答案是**把环境管理从应用层提升到平台层**——就像 Kubernetes 把部署从"SSH 到机器上手动启动"提升到"声明 Pod 的期望状态"。

Worktree 隔离、动态端口、反向代理、WS 透传——这些单独看都不新鲜。但把它们组合成一个声明式、零配置、瞬时创建的开发环境层，是 Agent 时代的基础设施创新。

工具会变，模型会变，但这个"声明意图 → 平台分配 → 透明路由"的模式会留下来。因为无论是什么 Agent、什么框架、什么语言，**不想管端口**是普遍需求，"**写完代码能立刻看到效果**"是永远不会过时的体验。

---

*Paseo 是开源项目（AGPL-3.0），代码托管在 [github.com/getpaseo/paseo](https://github.com/getpaseo/paseo)。*
