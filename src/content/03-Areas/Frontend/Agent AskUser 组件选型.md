---
isPub: true
title: Agent AskUser 组件选型
tags:
  - frontend
  - agent-ui
  - ask-user
  - shadcn
confidence: medium
sourceCount: 1
lastConfirmed: 2026-07-18
dateCreated: 2026-07-18T15:15:00+08:00
dateModified: 2026-07-18T15:18:35+08:00
---

## For future Claude

这页记录 Agent Composer 中 AskUser 的 registry 候选、产品边界和当前推荐。它写于 2026-07-18，来源是 Shoogle registry 索引与 Buffin/Liquid Connector 原型讨论。设计或实现 AskUser、多问题表单、回答收据时应先读本页。

# Agent AskUser 组件选型

## 当前结论

**优先只读核验 `@fluid/ask-user-questions`，暂不直接安装。** 它在索引描述中最贴近 Agent AskUser：支持多问题、单选/多选、Other 输入、Skip、数字键 1–9、自动前进和问题导航。视觉质量与源码依赖尚未打开核验，因此采用结论保持 `uncertain`。

AskUser 不应被压成横向工具条。Composer 内应承载完整问答流程；回答后由 Liquid Connector 分离成 compact receipt，thread 只保存问题摘要、回答和状态，不复制完整表单。这个边界延续了 [[Eyrie Agent Session UI 组件设计]] 与 [[Eyrie Session UI 优化方案]] 的 ticket/receipt 模型。

## 候选对比

| 候选 | registry | 能力 | 适用判断 |
| --- | --- | --- | --- |
| ask-user-questions | [@fluid](https://www.fluidfunctionalism.com/) | 多问题、单选/多选、Other、Skip、快捷键、自动前进 | **功能首选，先核验源码与画面** |
| question-flow | [@tool-ui](https://www.tool-ui.com/) | 多步问题与分支 | 适合复杂引导，但可能比 Composer AskUser 更重 |
| choice-box | [@intentui](https://intentui.com/) | 结构化选择卡片 | 适合自行组合轻量 AskUser |
| choice-poll | [@cult-ui](https://www.cult-ui.com/) | 单选/多选、结果态、键盘导航 | 交互接近，但 poll 语义需要剥离 |
| radio-group | [@fluid](https://www.fluidfunctionalism.com/) | 距离 hover、弹簧选择点、受控 API | 完整组件过重时的原语备选 |
| radio | [@beui](https://beui.dev/) | layoutId 滑动指示点、按压反馈 | 适合强调单选反馈，不负责问题流程 |
| radio-group | [@smoothui](https://smoothui.dev/) | 弹簧选择指示器 | 动效原语备选 |

## Add targets

- `npx shadcn@latest add @fluid/ask-user-questions`
- `npx shadcn@latest add @tool-ui/question-flow`
- `npx shadcn@latest add @intentui/choice-box`
- `npx shadcn@latest add @cult-ui/choice-poll`
- `npx shadcn@latest add @fluid/radio-group`
- `npx shadcn@latest add @beui/radio`
- `npx shadcn@latest add @smoothui/radio-group`

## 接入边界

1. **Composer 是完整交互面。** 展示问题序号、问题正文、纵向选项、Other 输入、Skip 和提交。
2. **Liquid Connector 只负责状态转场。** 它不拥有问答状态，只消费 pending/resolved 和 receipt 内容。
3. **Thread 是历史摘要。** Answered/Skipped receipt 控制在一至两行，需要展开时再查看原问题详情。
4. **多问题需要重新评估几何高度。** 当前 React Liquid Connector 的 inputHeight 固定为 134；完整多问题不应通过继续缩小字号硬塞进去，应让 Composer 内容区可变高、分页，或把问答面板放在 liquid surface 上方的独立布局层。
5. **模式切换只在稳定态进行。** 分离或合并过程中切换 Approval/AskUser 会替换仍可见的 receipt，应禁用或排队到动画完成。

## 搜索记录

2026-07-18 使用 Shoogle MCP 的 registry name/description 全文索引检索：

- `choice`：9/9
- `question`：12/12
- `radio`：展示 1–30/82
- `survey`：请求被 rate limit，未取得结果

Shoogle 只证明 registry 元数据命中，不证明组件视觉质量、依赖质量或与现有 React/Tailwind 版本兼容。安装前仍需查看 demo、源码、依赖和 license。

## 相关页面

- [[前端设计资源-给Agent用]]
- [[Eyrie Agent Session UI 组件设计]]
- [[Eyrie Session UI 优化方案]]
- [[流式 UI 的数据完成态与播放完成态分离]]

## 原始材料

- [Shoogle MCP 安装与能力说明](https://shoogle.dev/mcp-install)
- [Fluid Functionalism registry](https://www.fluidfunctionalism.com/)
- [Tool UI registry](https://www.tool-ui.com/)
- [IntentUI registry](https://intentui.com/)
- [Cult UI registry](https://www.cult-ui.com/)
- [BEUI registry](https://beui.dev/)
- [SmoothUI registry](https://smoothui.dev/)