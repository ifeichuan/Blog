---
tags:
  - Javascript
  - AI
  - Nodejs
isPub: true
title: 被 AI 逼疯的前端：从手搓流式打字机，到浏览器端跑 React
description: 前端 AI 应用开发实战，深入讲解流式传输、Markdown 实时渲染、NDJSON 数据流和浏览器端代码编译等技术
dateCreated: 2026-01-08T22:37:48+08:00
dateModified: 2026-01-08T22:39:44+08:00
---
>  为了防止被认为是菜鸡, 所以先说一句, 第一关到第三关我还是会的 😭
>  面试官不要再学历挂我了好吗

> **前言**：
> 上周一，产品经理搬着椅子坐到了我旁边：“咱们的 AI 助手体验太‘古典’了，请求发出去要转圈五秒钟才吐字。你看人家 ChatGPT，那个字是一个个蹦出来的，多解压！还有，能不能让 AI 给我写个 React 组件，直接渲染出来让我点？就像那个 Gemini Canvas 或者 Vercel v0 一样？”
> 
> 我看着手里还在用 `await fetch().json()` 的代码，陷入了沉思。
> 这不是加个 CSS 动画能解决的事，这是一场从网络层到渲染层的全面重构。

这几天，我像是经历了一场前端技术的“大航海”，踩了无数坑，终于把这套 **流式渲染（Streaming Rendering）** 架构跑通了。这篇文章就是我的“航海日志”，希望能帮同样在做 AI 应用的兄弟们少掉几根头发。

---

## 第一关：放弃 `setInterval` —— 真正的流式传输

刚接手时，由于思维还停留在传统的 CRUD 模式，我天真地想：后端能不能先把生成好的文案发给我，我自己在前端搞个 `setInterval`，每 50ms 往 `div` 里追加一个字？

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
````

### 1.2 致命的 Unicode 截断

拿到的 value 是 Uint8Array 二进制流。必须引入 TextDecoder 来翻译。

这里藏着一个巨大的隐患：中文和 Emoji 是多字节的。

一个汉字（如“好”）占 3 个字节。网络传输时，TCP 包可能会把这 3 个字节切开：前一个 Chunk 包含前 2 个字节，后一个 Chunk 包含第 3 个字节。

如果你直接 decode 前一个 Chunk，会得到一个乱码符号 ``。

✅ 正确姿势：

必须配置 { stream: true }，告诉 Decoder 内部维护一个 buffer，如果字节没凑齐一个字，就先攒着不吐出来。

JavaScript

```
const decoder = new TextDecoder('utf-8');
// 必须处理流式解码，防止汉字被截断导致乱码
const chunk = decoder.decode(value, { stream: true }); 
```

---

## 第二关：页面在跳舞？—— Markdown 渲染的“防抖”算法

流接通了，字也能吐出来的。我兴冲冲地把这段实时变长的文本丢进 `react-markdown` 里，结果迎来了第二个噩梦：**Layout Shift（视觉抖动）**。

### 2.1 灾难现场还原

当 AI 试图写一段代码时，它是这样吐字的：

1. 收到 \`👉 页面渲染为普通文本。
    
2. 收到 \`\` 👉 解析器认为这是 **行内代码 (Inline Code)**，瞬间把这行字变成了灰色背景的小方块，字体变小，行高变矮。
    
3. 收到 \`\` \` 👉 **砰！** 解析器判定这是 **代码块 (Code Block)** 的开始，页面瞬间撑开一个占据整行宽度的黑色大框，把下面的内容全部顶飞。
    

在这个毫秒级的过程中，页面像是在蹦迪，忽大忽小，用户体验极差。

### 2.2 主动干预算法：看不清，就别画

查了一圈资料，没找到现成的库能完美解决这个问题。于是我写了一个预处理函数（Middleware），核心逻辑只有一句话：**“看不清，就别画”**。

我们需要在数据交给 Markdown 组件之前，先进行清洗。

**核心代码逻辑**：

TypeScript

```
function smoothMarkdown(content: string) {
  // 1. 防抖策略：如果末尾悬挂 1 个或 2 个反引号，先暂时切掉不渲染
  // 只有当攒够 3 个变成了 ```，或者是 `text` 这种明确格式时才放行
  if (content.endsWith('``')) {
    return content.slice(0, -2); // 🔪 切掉，等下一个包
  } else if (content.endsWith('`')) {
    return content.slice(0, -1); // 🔪 切掉
  }
  
  // 2. 自动闭合：防止代码块渲染了一半样式崩坏
  const codeBlockCount = (content.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    return content + '\n```'; // 🧱 帮它补全
  }
  
  return content;
}
```

加上这段只有几行的代码后，那个“闪烁的灰色小方块”彻底消失了。用户看到的是：文本 -> 文本 -> 稳稳出现的黑色代码框。**丝滑！**

---

## 第三关：不仅是聊天 —— 复杂数据的 NDJSON 救赎

需求升级了。产品经理不满足于纯文本，想让 AI 在聊天中直接丢出一个实时的“销售报表”或者“用户信息卡片”。

### 3.1 `JSON.parse` 的死穴

纯文本流我搞定了，但结构化数据怎么办？

如果我让 AI 返回一个巨大的 JSON，万一它生成到一半卡住了，前端拿到的就是个残缺的字符串 {"user": "Ale...。

这时候 JSON.parse 是极其严格的，会直接报错抛出异常。我们总不能等整个 JSON 传完了再渲染吧？那流式就没意义了。

### 3.2 救星：NDJSON (Newline Delimited JSON)

我引入了一个后端架构模式：Single Request, Multiple Updates。

简单说，就是让后端别一次性把所有数据给我，而是像发弹幕一样，把一个大任务拆成多个小事件，用换行符分隔：

JSON

```
{"type": "init", "status": "thinking"} \n
{"type": "user_info", "data": {"name": "Alex", "role": "admin"}} \n
{"type": "chart_data", "data": {"q1": 100}, "isPartial": true} \n
```

### 3.3 前端 Buffer 池设计

在前端，我不能简单地 split('\n')，因为网络包的边界可能刚好切在一行 JSON 的中间。

我必须设计一个 Buffer 缓冲池：

JavaScript

```
let buffer = '';
while (true) {
  const { value } = await reader.read();
  buffer += decoder.decode(value, { stream: true });
  
  // 关键：按换行符切割，但要保留最后一个可能不完整的片段
  const lines = buffer.split('\n');
  buffer = lines.pop(); // 把最后那半句塞回 buffer，等下一次拼接
  
  for (const line of lines) {
    if (line.trim()) {
      dispatch(JSON.parse(line)); // 放心 Parse，这一行肯定是完整的
    }
  }
}
```

这种感觉就像是在拼图，后端不断递给我碎片，我实时把它们拼到 Redux/Context 的状态树上。页面不再是尴尬的“Loading”，而是生动的**“Growing”**。

---

## 第四关：魔法时刻 —— 浏览器端编译 (Runtime Bundling)

这是最让我头秃，也最让我兴奋的一关。

产品经理指着 Vercel v0 说：“你看人家，生成的 React 代码直接就跑起来了，还能点，还能交互。咱们能不能也搞一个？”

灵魂发问：

AI 返回的是字符串啊！浏览器只能跑 JS，怎么跑 JSX？而且 React 组件通常还要 import { Button } from 'antd'，浏览器去哪找 node_modules？

### 4.1 玩具版：Iframe + Babel Standalone

一开始，我试着在 Iframe 里硬塞了一个 `babel.min.js`。

- **原理**：利用 Babel 在浏览器端实时把 JSX 编译成 `React.createElement`。
    
- **结果**：简单的 `<div>Hello</div>` 能跑。但一旦 AI 写了 `import`，控制台直接炸了：`Uncaught ReferenceError: require is not defined`。
    

我意识到，我缺的不是编译器，而是一个**打包器 (Bundler)**。

### 4.2 工业版：拥抱 Sandpack (Web Worker Bundler)

深挖之后，我发现了 Vercel v0 背后的神级技术栈：**Sandpack**（源自 CodeSandbox）。

它的原理极其硬核：它在浏览器里起了一个 **Web Worker**，在这个 Worker 里运行了一个微型的 Webpack。

**它是怎么工作的？**

1. **拦截 Import**：当代码里出现 `import { BarChart } from 'recharts'`。
    
2. **动态拉包**：Worker 拦截请求，去专门的 CDN (如 esm.sh) 拉取 `recharts` 的元数据和代码。
    
3. **内存构建**：它在内存里建立虚拟文件系统，把这些包和 AI 生成的代码打包在一起。
    
4. **安全执行**：最后把打包好的 JS 丢给 Iframe 执行。
    

**我的集成代码**：

JavaScript

```
import { Sandpack } from "@codesandbox/sandpack-react";

// AI 生成的代码流直接喂给 files
<Sandpack 
  template="react"
  files={{
    "/App.js": aiGeneratedCode, // 👈 就算是流式传输的残缺代码，它也能容错
  }}
  customSetup={{
    dependencies: {
      "recharts": "latest", // 👈 预置好依赖，AI 随便调
      "lucide-react": "latest"
    }
  }}
/>
```

那一刻，屏幕上那个柱状图随着 AI 的打字机效果一点点画出来，还能跟随鼠标交互时，我感觉自己不再只是一个写页面的前端，而是在构建一个**“容器”**。

---

## 总结：从“切图仔”到“容器架构师”

回顾这几天的折腾，从一开始的懵懂无知到现在的豁然开朗，我发现 AI 时代的前端开发逻辑变了：

- **以前**：我们追求**静态的完美**（Pixel Perfect），所有的状态、文案、组件都是预设好的。
    
- **现在**：我们追求**动态的流畅**（Streaming Perfection）。我们要处理的不仅是数据流，还有视觉流、代码流。
    
- **以前**：我们**写代码**给浏览器跑，我们是代码的创造者。
    
- **现在**：我们**写环境**让 AI 的代码跑，我们成了代码的“监护人”和“架构师”。
    

这条路还在继续，但我已经不再迷茫了。下一个挑战：如何在浏览器里跑 Python 进行数据分析？**WebAssembly**，我来了！