---
tags:
  - Javascript
  - AI
  - Nodejs
isPub: true
title: 被 AI 逼疯的前端：从手搓流式打字机，到浏览器端跑 React
dateCreated: 2026-01-08T22:37:48+08:00
dateModified: 2026-01-08T22:39:44+08:00
---


> **前言**：
> 上周一，产品经理搬着椅子坐到了我旁边：“咱们的 AI 助手体验太‘古典’了，请求发出去要转圈五秒钟才吐字。你看人家 ChatGPT，那个字是一个个蹦出来的，多解压！还有，能不能让 AI 给我写个 React 组件，直接渲染出来让我点？就像那个 Gemini Canvas 或者 Vercel v 0 一样？”
> 
> 我看着手里还在用 `await fetch().json()` 的代码，陷入了沉思。
> 这不是加个 CSS 动画能解决的事，这是一场从网络层到渲染层的全面重构。

这几天，我像是经历了一场前端技术的“大航海”，踩了无数坑，终于把这套 **流式渲染（Streaming Rendering）** 架构跑通了。这篇文章就是我的“航海日志”，希望能帮同样在做 AI 应用的兄弟们少掉几根头发。

---

## 第一关：放弃 `setInterval` —— 真正的流式传输

刚接手时，由于思维还停留在传统的 CRUD 模式，我天真地想：后端能不能先把生成好的文案发给我，我自己在前端搞个 `setInterval`，每 50 ms 往 `div` 里追加一个字？

**被打脸的瞬间**：
这种“伪流式”根本解决不了核心痛点——**首字节延迟（TTFB）**。
如果是复杂的推理任务，后端生成完整回复可能需要 15 秒。难道让用户盯着空白屏幕转圈看 15 秒？AI 时代，**“快”**不代表总时长短，而代表**“响应开始得早”**。

所以，必须上 **Server-Sent Events (SSE)** 或者 **HTTP Chunked Transfer**。

### 1.1 `fetch` 的另一面
我开始深入研究 `fetch` API。以前我们只用 `response.json()`，但面对流，我们要用 `response.body.getReader()`。

这扇新世界的大门打开后，全是坑：

```javascript
// ❌ 错误示范：以为拿到的是字符串
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(value); // 打印出来全是 Uint8Array [233, 189, 128...] ???
}