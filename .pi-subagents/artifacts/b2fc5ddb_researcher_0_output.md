# Research: Agent Hooks 管理平台

## Summary

“Agent Hooks 管理平台”目前涵盖三个不同但相关的赛道：(1) **Agent 生命周期事件总线**——在 agent 执行各阶段（工具调用前后、会话起止等）拦截事件并路由到订阅者；(2) **AI Agent 专用 Webhook/回调中继服务**——让 AI agent 能可靠接收和发送 webhook，无需暴露公网端口；(3) **Agent 框架内置中间件/钩子系统**——LangChain、Microsoft Agent Framework 等框架提供的 SDK 级钩子扩展点。第一类产品最少但最贴近“agent hooks management platform”的语义。

---

## Findings

### 一、Agent 生命周期事件总线 / Hooks 管理平台

1. **HookBus** — 目前最完整的 agent hooks 管理平台。定位为“agent event bus”，代理任意支持 hooks 的 agent runtime（Claude Code、Codex CLI、AmpCode、Hermes Agent、OpenClaw、OpenCode 等），将生命周期事件路由到订阅者，订阅者可以执行 allow/deny/ask、审计、成本追踪、注入策略上下文等操作。提供 HookBus Light（本地运行）和 HookBus Agent（企业级治理循环）两个版本。开源。 [HookBus](https://hookbus.com/) | [HookBus Agent](https://hookbusagent.com/)

2. **Hooksbase** — “AI agent 的事件基础设施”。支持通过 HTTP、Email、表单、定时任务四种方式将事件注入 agent，提供签名验证、类型化出站目标、确定性回放。与 HookBus 定位不同：Hooksbase 侧重“把外部事件可靠地送入 agent”，而 HookBus 侧重“agent 执行过程中挂载治理逻辑”。 [Hooksbase](https://www.hooksbase.com/for-agents)

3. **REM Labs agent-hooks** — 面向 coding agent 的四处理器反馈循环：`onToolError`、`onSyntaxError`、`onAssertionFailure`、`onFileChange`，在错误发生瞬间捕获、摘要、并在下一次尝试前呈现。仍处于预览阶段（预计 Q3 2026 发布）。 [REM Labs](https://remlabs.dev/agent-hooks)

4. **Pollack.ai agent-hooks** — 可移植 Java API，在工具调用边界控制 agent 行为。核心模块零依赖，定义事件模型、决策类型和注册表。适配器支持 Spring AI、Claude Agent SDK、Gemini CLI。 [Pollack.ai](https://lab.pollack.ai/projects/agent-hooks)

5. **Sigil-Core/agent-hooks** — PreToolUse 拦截器，在 agent 执行工具调用前向 Sigil Sign `/v1/authorize` 端点提交授权请求，根据策略决定允许或阻止。支持 Claude Code、ELIZA、LangChain 或通过通用 `checkIntent` API 集成。 [GitHub](https://github.com/Sigil-Core/agent-hooks)

### 二、AI Agent Webhook / 回调中继平台

6. **HookSense** — “AI Agent 的 Webhook 与回调层”，MCP-native。Agent 通过 MCP Server 创建回调端点，将 URL 交给长时间运行的工具、人类审批者或其他 agent，然后用 `wait_for_callback` 等待签名结果。免费层 300 req/day，付费从 $29/月起。 [HookSense](https://hooksense.com/)

7. **AgentWebhook** — 拉取式（pull-native）webhook 中继，专为私有系统设计。外部发送 webhook 到平台提供的 URL，平台持久化队列存储，agent 就绪时拉取处理。无需公网端点、隧道或开放端口。 [AgentWebhook](https://app.agentwebhook.com/)

8. **Herald** — 轻量 webhook 中继和消息队列，为无法暴露公网端点的 AI agent 提供稳定的 inbound URL。负载去重哈希、加密存储，agent 通过 REST 拉取。 [Herald](https://herald.tools/)

9. **CoffeeRelay** — 将 LLM 变成事件驱动型 worker。外部系统通过 webhook 触发 agent 工作流，替代轮询方式，节省 token 和 CPU。 [CoffeeRelay](https://coffeerelay.dev/)

10. **GetHook** — Webhook 可靠性网关，同时支持入站和出站 webhook。持久化、自动重试、回放、可观测性，定位为 AI agent pipeline 的 webhook 基础设施层。 [GetHook](https://gethook.to/use-cases/ai-agents)

11. **One Relay (WithOne AI)** — 统一 webhook 基础设施，单端点接入 500+ 平台，标准化 payload 后交付给 AI agent 消费。 [One Relay](https://www.withone.ai/products/relay)

### 三、Agent 框架内置中间件 / 钩子系统

12. **LangChain Middleware** — 在 agent 执行管线的关键点（模型调用前后、工具执行前后）注入日志、追踪、输入重写、访问控制等逻辑。 [LangChain Docs](https://docs.langchain.com/oss/python/langchain/middleware/custom)

13. **Microsoft Agent Framework** — 中间件包裹 agent 执行管线，拦截并修改请求/响应。12K+ GitHub stars，支持 Python 和 .NET。 [GitHub](https://github.com/microsoft/agent-framework)

14. **AgentScope** — 暴露 6 个钩子位置（`on_reply` 等）加一个 tool-provider 钩子，覆盖从外层响应到原始模型 API 调用的完整路径。 [AgentScope Docs](https://docs.agentscope.io/v2/building-blocks/middleware)

15. **agent-express** — 5 个洋葱钩子（agent / session / turn / model / tool），统一 `(ctx, next)` 模式。 [agent-express](https://agent-express.ai/reference/api/index/interfaces/middleware/)

16. **ragbits 1.5** — 生命周期钩子、工具确认、并行工具执行、多 agent 编排。 [deepsense.ai](https://deepsense.ai/blog/building-production-ai-agents-hooks-tool-confirmation-and-multi-agent-orchestration-in-ragbits-1-5-release/)

17. **Orloj** — 开源 agent 编排全栈：声明式定义 agent、工具、策略，内置 webhook、审批、策略、追踪。 [GitHub](https://github.com/orlojHQ/orloj)

18. **Agen for SaaS (Frontegg)** — 托管 MCP Gateway，让 SaaS 产品安全暴露 API 给 AI agent。提供认证、授权、治理和可观测性。 [Frontegg Docs](https://developers.frontegg.com/agen-for-saas/introduction/overview)

---

## 分类对比

| 维度 | 事件总线型 (HookBus/Hooksbase) | Webhook 中继型 (HookSense/AgentWebhook等) | 框架中间件 (LangChain/MS AF等) |
|---|---|---|---|
| **核心功能** | 拦截 agent 执行生命周期事件 | 可靠收发外部 webhook | SDK 级钩子扩展 agent 行为 |
| **运行方式** | 独立服务 / sidecar | SaaS 托管中继 | 框架内置 |
| **适用场景** | 治理、审计、策略注入 | 事件驱动 agent、回调等待 | 日志、追踪、guardrails |
| **与 agent 耦合度** | 低（agent 只需发射 hooks） | 极低（纯 HTTP 集成） | 高（框架绑定） |
| **典型用户** | 企业治理团队 | 需要外部事件触发的 agent 开发者 | agent 应用开发者 |

---

## Sources

- Kept: HookBus (https://hookbus.com/) — 最直接匹配“agent hooks management platform”的产品
- Kept: Hooksbase (https://www.hooksbase.com/for-agents) — agent 事件基础设施，视角互补
- Kept: HookSense (https://hooksense.com/) — MCP-native 回调层，有定价和文档
- Kept: AgentWebhook (https://app.agentwebhook.com/) — 独特的 pull-native 设计
- Kept: REM Labs (https://remlabs.dev/agent-hooks) — coding agent 专用 hooks，虽未正式发布但方向独特
- Kept: Pollack.ai (https://lab.pollack.ai/projects/agent-hooks) — 唯一跨运行时可移植 hook API 实现
- Kept: Sigil-Core/agent-hooks (https://github.com/Sigil-Core/agent-hooks) — 策略执行型 hooks
- Kept: Hooksbase 博客 (https://www.hooksbase.com/blog/ai-agent-platforms-compared) — 行业全景对比
- Dropped: LangChain/Microsoft AF/AgentScope 等框架文档 — 属于框架内置功能而非独立管理平台，仅作为参考类别列出

## Gaps

- **HookBus 定价与成熟度**：官网未披露明确的定价信息或 GA 状态，商业化程度待确认。
- **实际采用案例**：以上产品大多处于早期阶段，缺乏公开的生产环境用户案例或 case study。
- **“Agent hooks management platform”作为独立品类是否成立**：目前市场尚未形成共识术语，这些产品各自用小众关键词定位（event bus、webhook relay 等），尚未出现像 Vercel/Figma 那样的品类定义者。
- **大厂动向**：AWS Loom（2026 年 7 月发布）和 Google Agent Development Kit 等基础设施级产品可能在未来挤压独立平台空间，但目前未直接定位为 hooks management。