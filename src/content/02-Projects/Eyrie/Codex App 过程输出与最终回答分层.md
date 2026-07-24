---
isPub: true
title: Codex App 过程输出与最终回答分层
tags:
  - codex
  - buffin
  - eyrie
  - agent-ui
  - app-server
  - streaming
  - activity
  - final-answer
confidence: high
sourceCount: 4
lastConfirmed: 2026-07-22
dateCreated: 2026-07-22T00:59:00+08:00
dateModified: 2026-07-22T00:59:00+08:00
---

## For future Claude

这页解释 Codex App 为什么能在执行期间展示过程输出，并在最终回答开始后把过程区自动折叠。2026-07-22 通过 OpenAI Codex App Server 官方文档、Codex 开源协议源码、本机 Codex App 26.715.31925 的 `app.asar` 和 Buffin 本地实现交叉验证。处理 Buffin 的 commentary/final answer 分层、ActivityGroup、自动折叠或 Codex provider 事件归一化时先读这页。

# Codex App 过程输出与最终回答分层

> [!abstract] 当前结论
> Codex App 不会在 turn 结束后由客户端重新总结过程日志。模型与 App Server 从协议层把中途播报标记为 `agentMessage.phase = commentary`，把最终回答标记为 `agentMessage.phase = final_answer`；命令、文件修改、reasoning 和工具调用则是独立 item。UI 在 final answer 开始后将先前 activity 收束为可折叠区，并把 final answer 独立展示。

## 已知客观事实

### 1. App Server 的层级是 Thread、Turn、Item

- **Thread** 是一段会话，包含多个 turn。
- **Turn** 是一次用户请求及其后续 agent 工作。
- **Item** 是 turn 内的一项输入或输出，例如 user message、agent message、reasoning、command execution、file change 或 tool call。

客户端通过 `turn/started` 进入运行态，通过 item 事件增量构建界面，通过 `turn/completed` 获取整个 turn 的最终状态。`turn/completed` 的状态可能是 `completed`、`interrupted` 或 `failed`。

### 2. Item 有独立生命周期

所有 item 共享：

```text
item/started → delta... → item/completed
```

`item/completed` 携带该 item 的权威终态。常见 delta 包括：

| 内容 | 协议事件 |
|---|---|
| Assistant 文本 | `item/agentMessage/delta` |
| Reasoning 摘要 | `item/reasoning/summaryTextDelta` |
| 原始 reasoning | `item/reasoning/textDelta` |
| 命令输出 | `item/commandExecution/outputDelta` |
| 计划更新 | `turn/plan/updated` |
| 聚合 diff | `turn/diff/updated` |

### 3. Assistant message 自带 phase

Codex 协议中的 `MessagePhase`：

```rust
pub enum MessagePhase {
    Commentary,
    FinalAnswer,
}
```

语义是：

| Phase | 语义 | UI 归属 |
|---|---|---|
| `commentary` | 中途 preamble / progress narration；后面仍可能继续调用工具或输出消息 | Activity / 工作过程 |
| `final_answer` | 当前 turn 的终局回答 | 独立最终正文 |
| `null` | provider/model 未提供 phase | 必须走兼容策略，不能武断分类 |

因此最终总结不是 UI 从工具日志里再次提炼，而是模型最后输出的独立 `agentMessage`：

```json
{
  "type": "agentMessage",
  "text": "Implemented the change and verified the tests...",
  "phase": "final_answer"
}
```

## Codex App 的界面状态机

### Turn 相位

本机 Codex App `26.715.31925` 的打包前端使用三态：

```text
idle → prework → final_answer
```

压缩后的判断逻辑等价于：

```ts
function latestTurnPhase(turn) {
  if (turn.status !== "inProgress") return "idle"

  let hasCommentary = false
  for (const item of turn.items) {
    if (item.type !== "agentMessage") continue
    if (item.phase === "commentary") {
      hasCommentary = true
      continue
    }
    return "final_answer"
  }

  return hasCommentary || turn.firstTurnWorkItemStartedAtMs != null
    ? "prework"
    : turn.finalAssistantStartedAtMs == null
      ? "idle"
      : "final_answer"
}
```

其中 **prework** 不是 reasoning 的同义词，而是最终回答前的整个工作阶段，包括 commentary、工具调用和其他 activity。

### 自动折叠条件

本机 bundle 中的折叠函数等价于：

```ts
function resolveCollapse({
  hasFinalAssistantStarted,
  isTurnCancelled,
  hasRenderableAgentItems,
  forceExpanded = false,
  preventAutoCollapse,
  persistedCollapsed,
}) {
  if (!hasFinalAssistantStarted || isTurnCancelled || !hasRenderableAgentItems) {
    return { shouldAllowCollapse: false, isCollapsed: false }
  }

  return {
    shouldAllowCollapse: true,
    isCollapsed: !forceExpanded && (persistedCollapsed ?? !preventAutoCollapse),
  }
}
```

这意味着：

1. **工作进行中**：activity 展开，让用户看见 agent 正在做什么。
2. **final answer 开始**：允许把此前过程自动折叠，而不是必须等到 `turn/completed`。
3. **用户选择优先**：持久化的手动展开/折叠覆盖自动策略。
4. **取消或无内容**：不启用自动折叠。
5. **turn 完成**：负责关闭运行状态和记录最终 status，不承担最终回答分类。

### 折叠后的内容不是全部消失

Codex App 会先把 agent items 分成：

- `collapsibleEntries`：普通工作过程，折叠后隐藏到 disclosure 内。
- `persistentEntries`：即使过程区折叠也应持续显示的交互或结果。
- `preToggleEntries`：放在折叠开关之前的内容。

因此正确模型是 **过程内容分组后收束**，不是收到 completion 后把整段 transcript 一刀隐藏。

## 协议到 UI 的完整链路

```text
turn/started
  ↓
reasoning / commentary / commandExecution / fileChange / toolCall
  ↓
item/started → delta... → item/completed
  ↓
agentMessage { phase: final_answer }
  ↓
ActivityGroup 自动收束，FinalResponse 独立渲染
  ↓
turn/completed
```

## Buffin 当前缺口

Buffin 已接入 Codex App Server，但当前归一化层丢掉了 `agentMessage.phase`：

- `apps/daemon/src/agent/providers/codex/protocol.ts` 把所有 `agentMessage` 都映射成 `message.completed { role: assistant }`。
- `apps/desktop/src/renderer/features/session/models/session-store.ts` 只区分 `assistant` 与 `reasoning`。
- `ReasoningBlock` 当前用本地 `open=true` 初始化，完成后没有基于 final answer 的 activity-group 收束。

结果是 Buffin 无法可靠区分“干活途中播报”和“最终回答”，只能依赖位置或 run completion 猜测。

## Buffin 推荐模型

### 事件契约

应在 provider 归一化层保留 phase：

```ts
type AssistantMessagePhase = "commentary" | "final_answer" | "unknown"

type MessageEvent = {
  type: "message.delta" | "message.completed"
  role: "assistant" | "reasoning"
  phase?: AssistantMessagePhase
  itemId?: string
  text?: string
}
```

`unknown` 或字段缺失必须保留兼容行为，因为 Codex 源码明确说明并非所有 provider/model 都稳定提供 phase。

### 展示分组

```text
Turn
├─ UserMessage
├─ ActivityGroup
│  ├─ commentary
│  ├─ reasoning
│  ├─ tool calls
│  ├─ file changes
│  └─ approvals / input requests
└─ FinalResponse
   └─ agentMessage.phase = final_answer
```

### 折叠规则

```ts
const canCollapse =
  hasActivity &&
  !turnCancelled &&
  (finalAnswerStarted || turnCompleted)

const collapsed = userOverride ?? (canCollapse && !preventAutoCollapse)
```

建议以 **final answer 首个 item 开始**作为主要自动折叠点，以 `turn.completed` 作为 phase 缺失时的兼容兜底。不要把 `run.completed` 当最终答案生成器。

### 与流式呈现两轴模型的关系

ActivityGroup 的展开/折叠与文本 reveal 是不同维度：

- `message.completed` 只让 source sealed。
- `final_answer` 决定 narrative 分区与 activity 收束时机。
- `skip | pace | hold` 决定当前 surface 如何播放文本。
- 折叠状态决定用户是否看见 activity detail。

不能用一个 `isFinished` 同时承担这四种语义。相关状态所有权见 [[Buffin Session 呈现两轴模型]] 与 [[流式 UI 的数据完成态与播放完成态分离]]。

## MVP 实施顺序

1. Codex adapter 保留 `agentMessage.phase`，补协议测试。
2. 归一化消息事件增加可选 phase，不破坏 phase 缺失的其他 provider。
3. Session reducer 把 phase 持久化到 text part。
4. Presentation 将 commentary、reasoning 和 tools 归入 ActivityGroup。
5. FinalResponse 独立渲染；其开始时自动折叠 ActivityGroup。
6. 用户手动展开后，本轮不再被后续事件强行折叠。
7. replay 已完成 turn 时直接使用终态折叠策略，不重演自动折叠动画。

## 验证清单

- commentary 后继续 tool call，不会被误当最终回答。
- final answer 首个 delta 到达时，activity 默认折叠。
- 用户手动展开后，新 delta 不会再次抢夺展开状态。
- turn interrupted 时保留可见过程和错误上下文。
- phase 缺失时仍能显示 assistant 文本。
- replay completed turn 直接渲染稳定终态。
- `message.completed` 不会让尚未播放完的文本硬切，遵守 [[Buffin Session 呈现两轴模型]]。

## 相关页面

- [[Eyrie Agent Session UI 组件设计]]
- [[Eyrie Agent 事件契约与流式恢复模型]]
- [[Buffin Session 呈现两轴模型]]
- [[流式 UI 的数据完成态与播放完成态分离]]
- [[流式Agent-Session-UI实现方案与踩坑]]

## 来源

- [Codex App Server 官方文档](https://developers.openai.com/codex/app-server)
- [OpenAI Codex App Server README](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md)
- [OpenAI Codex `MessagePhase` 源码](https://github.com/openai/codex/blob/main/codex-rs/protocol/src/models.rs)
- 本机 `/Applications/ChatGPT.app/Contents/Resources/app.asar`，bundle id `com.openai.codex`，版本 `26.715.31925`，2026-07-22 只读核验
