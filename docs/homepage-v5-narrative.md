# 首页 v5 叙事设计文档

> 状态：设计已确认，动效与文案待定。日期 2026-07-30。
> 前身：`/home-v4`（`src/pages/home-v4.astro` + `IndexPageV4.tsx`）。v5 在 v4 的卡片范式与 canvas 分层之上重写叙事层。

---

## 1. 目标与定位

### 唯一目标：被记住

首页的成功标准不是转化，是**一个陌生访客滚完之后能复述出一句关于我的命题**。

明确的非目标：

| 非目标 | 归属 |
| --- | --- |
| 联系 / 求职转化 | `/about` |
| 面试向项目清单（CareerTime、Eyrie、VoiceStream、Hawk） | `/about` |
| 文章分发 | `SiteMenu` 的 Posts → `/blogs` |
| 履历、经历、stack | `/about` |

**首页 = 论证，About = 履历。** 这条分工是硬约束：任何清单型内容（项目列表、技能标签、经历时间线）出现在首页都会稀释命题浓度，应当拒绝。

### 页面本身是论据

站点定位「网站本身就是作品」。「我在意 craft」这句话**永远不写出来**——访客滚动时手上的树影 canvas、像素尾迹、滚动驱动的语义反转就在替它说话。这是全站唯一一处刻意的 show-don't-tell。

---

## 2. 主命题

一条五环因果链，闭合、可分段展开：

```
省事                我追求省事
  ↓
不外包判断          省事的意思是外包执行，不是外包判断
  ↓
约束 / pattern      要外包执行，就得先提供约束和 pattern：
                    把判断固化成规则，让执行者在我的品味里自由
  ↓
品味                而约束的来源是品味 —— 品味是人的损失函数
  ↓
make something      所以在 agent 时代，Make something agent want
agent want          （收在「所以要创造」）
```

### 为什么是这条链

- **有个人味**：「对省事的追求」是性格而非美德，比「我很勤奋钻研」耐读。一个怕麻烦的人反而造了最多东西，这个反差本身是钩子。
- **有张力**：「省事」听起来像放弃，「不外包判断」立刻翻回来。读者会被转折抓住。
- **有敌人**：这条链反对的是**把判断也一起交出去的那种省事**。有立场，所以有记忆点。
- **信息密度匹配滚动长度**：五环需要滚动来展开，正好用得上视差卡片的预算。单句命题会让卡片沦为纯装饰。
- **解释了栏目为什么存在**：Lab 是品味的试错场（「所以要创造」的直接兑现）。链条不是悬空的态度，末端落在实物上。

### 链条终点的原文

`src/content/04-Resource/品味与创造：损失函数视角.md` 是这条链的题眼原文，链条第 4 环直接源于它：

> 当你停止创造，你的才能就不再重要，你所拥有只剩下你的品位。而品位会裹挟你，让你排斥他人，变得狭隘。所以，要创造。

这句话把「品味」从终点推回「所以要创造」，让链条闭环并交棒给 Lab 区。

### 文案铁律

**全文第一人称。** 不用第三人称叙述自己（「他追求省事」这类写法一律不采纳）。第三人称是简历语言，属于 About。

### 被降级的候选命题

| 候选 | 处置 |
| --- | --- |
| 「从零理解，然后重造」 | 降为链条内部的方法论，不做主命题（任何优秀工程师都能挂这块招牌，缺个人识别度） |
| 「把网页当作品做的人」 | **不说出来**，由网站本身证明 |
| 「在 Agent 时代重做前端交互」 | 作为第 5 环的当代注脚（两年后会变味，不适合做主命题） |

---

## 3. 结构

### 分层契约（继承 v4，不可违反）

```
z-0   fixed DappledLight canvas ── 全程地面，严禁被不透明整版背景盖死
z-?   PixelMouse3D（纸飞机）    ── 浮在 canvas 之上、卡片之下
z-1+  各 section = homepage-card ── calc(100vw-1.5rem) 宽、1.5rem squircle
                                    卡间 0.75rem 缝隙透出 canvas
最底  Footer                     ── 全屏 sticky 谢幕，底部必须透明
```

参见 `memory/feedback_v4-canvas-card-paradigm.md`。新增 section 默认做成透明区块或浮卡，绝不加全幅不透明背景。

### 卡片序列

| # | Section | 类型 | 内容 | 节奏 |
| --- | --- | --- | --- | --- |
| 1 | Hero | 保留现状 | `Hello` → `I'm` + 手写签名逐笔绘出。**不加字** | 静 |
| 2 | 链条卡 ① | **pin**（zoom-out） | 「我追求省事」→ 滚动中语义反转 →「但我不把判断交出去」 | 重·被劫持 |
| 3 | 链条卡 ② | 普通视差卡 | 约束与 pattern：把判断固化成规则 | 中 |
| 4 | 链条卡 ③ | 普通视差卡 | 品味是人的损失函数 | 中 |
| 5 | 链条卡 ④ | 普通视差卡 | Make something agent want，收在「所以要创造」 | 中 |
| 6 | Lab 横滚区 | **pin**（横向 scrub） | `labs/` 的 11 个 demo，gif/mp4 预览 | 重·被劫持 |
| 7 | Footer | 保留现状 | 全屏 sticky 谢幕、透明底、巨型签名水印视差 | 收 |

### 节奏设计

`静 → 重 → 中中中 → 重 → 收`。三种密度交替，读者不会疲劳。

**pin 只有两个，这是上限。** pin 的力量来自稀缺——每段都劫持一次滚动，读者会觉得这页不让人正常滚。任何新增 pin 的提案都要先拿掉一个现有的。

### Hero 为什么不动

首屏不是零信息量。`HeroSignature.tsx` 在 `Hello` 之后接 `I'm` + `SignatureDraw` 逐笔绘出（6s），本身已是第一人称自陈。不加钩子文案、不加滚动提示：

- 加一行标语等于给已经完整的第一印象打补丁。
- 滚动提示解决的是「读者不知道要滚」，而树影 canvas + 像素尾迹已经把滚动感做足了。

首屏到链条第一环的衔接由纸飞机承担（见 §4）。

### 链条为什么压成 4 张而不是 5 张

第 1、2 环合并成一张 pin 卡，在卡内用滚动做语义反转。

- 卡片数不该靠拆句子来凑。五张连续纯文字卡是 PPT，且句子间的因果关系会被卡片缝隙切断。
- 「省事 → 不外包判断」这个转折**本身就是一个滚动叙事**：用滚动做语义反转，而不只做位移。这是全站最强的动效机会，也是「网站本身就是作品」的兑现点。

---

## 4. 全程元素：纸飞机

### 是什么

复用现有的 `src/components/effects/PixelMouse3D.tsx`——`/pixel_art_mouse_cursor/scene.gltf` 那个像素鼠标模型，改成纸飞机式的飞行体。

**不是新画一个 SVG。** 模型、材质、倾斜逻辑（`model.rotation.x = my * 0.12`）都现成，而且它已经在 canvas 层，分层不用重做。

### 为什么是纸飞机而不是笔

`memory/project_signature-pen-animation.md` 里那个「渲染笔的倾斜姿态」的设想，载体换成纸飞机，倾斜算法整套复用：

- **笔的隐喻是「书写/记录」**，把注意力拉回签名本身——一个已经完成的动作。
- **纸飞机的隐喻是「被放出去、飞行、带路」**，方向性天然向前。这条滚动线要的是带路。
- 「我写完 → 我放它飞 → 它带你看」比「签名自己缩小成角标」干净，签名可以留在原地不被搬走。

### 行为：持续在场 + 间歇位移

- **静止时**：维持现有的悬浮 + 跟随鼠标微倾斜行为（读者已经能接受，不构成噪音）。
- **章节交接时**：机头压平飞向下一个锚点。
- **每个 section 一个锚点**，滚动进度在锚点之间插值。
- **姿态**：`azimuth = atan2(dy, dx)` 定朝向；tilt 由速度映射——快飞时压平，慢下来时机头抬起。

### 驱动方式：SVG path + 归一化视口坐标系

飞行轨迹由一条 SVG path 定义，**path 画在归一化坐标系里**：

```
<svg viewBox="0 0 100 100" preserveAspectRatio="none">  ← 不渲染，只做数学
  <path d="M 88 79 C ... " />                            ← 坐标即视口百分比
```

取样与映射：

```
const len = path.getTotalLength()
const p   = path.getPointAtLength(scrollProgress * len)   // p.x / p.y ∈ [0,100]
model.position.x = halfW * (p.x / 50 - 1)                 // → 3D 场景坐标
model.position.y = -halfH * (p.y / 50 - 1)
```

朝向直接从 path 取切线（相邻取样点差值），比手算更准：

```
const a = path.getPointAtLength(s - ε)
const b = path.getPointAtLength(s + ε)
azimuth = atan2(b.y - a.y, b.x - a.x)
```

tilt 由飞行速度映射——快飞时压平，慢下来时机头抬起。

**为什么必须是归一化坐标而不是 DOM 坐标**：卡片高度会随内容和视口变化——横滚区的 scrub、字体加载后的 `ScrollTrigger.refresh()`，任何一次重排都会让基于 DOM 坐标的轨迹错位。归一化坐标系下布局怎么变都不会崩。

**path 是必要的，不能用锚点插值替代**：锚点之间只能是直线，中间轨迹完全不可控，而 path 存在的意义恰恰是定义中间那段怎么飞（穿过卡片缝隙、绕过卡片、在链条转折处急转）。形状由 path 给，抗重排由坐标系给，两者不冲突。

---

## 5. Lab 横滚区

### 复用 v4 的横向 pin 容器，换掉内容

`WorksV4.tsx` 的横向 scrub 容器（纵向滚动映射横向位移、`--cp` 驱动每卡微场景、末尾 10% 停留缓冲）保留，四张项目卡换成 11 个 lab demo。

### 为什么 demo 比项目卡适合横滚

横向 pin 的价值在于「一个接一个地看视觉物」。项目卡是文字密集的（tag + title + desc + beat）：**横向滚动逼着人快看，文字逼着人慢读，两者打架。** demo 是纯视觉物，横向快扫恰好合适。

而且它直接接上链条终点——「所以要创造」的下一屏就是 11 个 demo 横着滚过去。这是全站最强的一次 show-don't-tell。

### 素材来源

`src/pages/labs/` 现有 11 项：`lenis`、`blur-gsap`、`blur-motion`、`blur-waapi`、`dappled-baseline`、`friends-prototype`、`layered-parallax-clouds`、`mobile`、`noise-pixel`、`signature-glass-demo`、`texture-lab`。

### 预览形式：gif / mp4

**已知坑（实现时必读）**：`video.currentTime` 跳转只能落在关键帧上，普通编码的 mp4 做 scrub 会卡顿或糊。要顺滑得用 `-g 1`（每帧都是关键帧）重编码，文件会大 3–5 倍；或走 canvas 逐帧贴图。

11 个 demo 全做 scrub 体积会失控。建议策略：

- **当前聚焦的那一张**：滚动 scrub。
- **其余**：进视口自动播放，不做 scrub。

最终方案实现时定。

---

## 6. 移除清单

| 移除项 | 原因 | 内容去向 |
| --- | --- | --- |
| `WorksV4` 的四张项目卡 | 面试准备材料，不属于 Blog index | `/about` |
| `LabStrip.tsx`（文字跑马灯） | 被 Lab 横滚区吸收 | — |
| `WritingV4.tsx` | `SiteMenu` 已有常驻 Posts 入口，首页再放一遍是冗余 | `/blogs` |
| `ManifestoV4` 现有英文文案 | 被链条卡 ① 取代 | — |

### 关于去掉文章的决定

原本担心「链条只剩下半边」——「品味从哪来」缺少物证。这个担心过度了：横滚 demo 区已是完整证据，「理解」在文章里，不必在首页兑现。**less is more。**

---

## 7. 待定项

以下全部由本人决定，不代为实现：

- [ ] 链条四张卡的具体文案（第一人称）
- [ ] 每张卡的具体动效
  - 候选：`/Users/feichuan/Documents/quickDemos/stamp-impasto/src/StampMesh.tsx` 的火焰揭开效果（`burnEdge` / `burnGlow` / `reveal` 那套 impasto shader），语义上适合「揭示」类转场
- [ ] 纸飞机 SVG path 的形状（`viewBox="0 0 100 100"` 归一化坐标）
- [ ] 纸飞机的门控策略（滚动时出现 / 停下淡出，或维持现有悬浮）
- [ ] `MarqueeV4`（滚动速度驱动的跑马灯）留不留 —— 本轮未讨论
- [ ] Lab demo 的 gif/mp4 编码与播放策略
- [ ] v5 是新开 `/home-v5` 迭代还是直接改 `/`

---

## 8. 相关文件

| 路径 | 说明 |
| --- | --- |
| `src/pages/index.astro` | 当前线上首页（旧版：Hero + SectionTwo） |
| `src/pages/home-v4.astro` | v4 叙事流 + 827 行内联 CSS |
| `src/components/homepage/IndexPageV4.tsx` | v4 装配层 |
| `src/components/homepage/HeroSection.tsx` | Hero 卡（保留） |
| `src/components/homepage/HeroContent.tsx` | `Hello` + `I'm` + 签名（保留） |
| `src/components/homepage/HeroSignature.tsx` | `I'm` 逐字 + `SignatureDraw`（保留） |
| `src/components/homepage/FixedVisualStage.tsx` | fixed z-0 canvas 舞台 |
| `src/components/effects/PixelMouse3D.tsx` | 像素鼠标 → 纸飞机改造目标 |
| `src/components/homepage/v4/WorksV4.tsx` | 横向 pin 容器（保留容器，换内容） |
| `src/components/homepage/v4/ManifestoV4.tsx` | zoom-out pin（保留机制，换文案） |
| `src/components/homepage/v4/FooterV4.tsx` | sticky 谢幕（保留） |
| `src/components/homepage/v4/PixelTrailV4.tsx` | 像素鼠标尾迹（保留） |
| `src/content/04-Resource/品味与创造：损失函数视角.md` | 链条题眼原文 |
