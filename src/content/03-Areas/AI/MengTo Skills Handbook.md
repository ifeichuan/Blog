---
isPub: true
title: MengTo Skills Handbook
tags:
  - AI
  - agent
  - skills
  - MengTo
  - web-design
  - game-development
confidence: high
sourceCount: 4
lastConfirmed: 2026-07-30
dateCreated: 2026-07-30T09:20:00+08:00
dateModified: 2026-07-30T09:30:00+08:00
---

## For future Claude

这页是 [MengTo/Skills](https://github.com/MengTo/Skills) 的本机使用手册：定义、场景、调用方法、流水线、118 个 skill 全表、安装落点与验收标准。2026-07-29 已全量装入 `~/.agents/skills` / Pi / Claude。需要选设计/复刻/动效/游戏类 skill、或把参考变成可执行 prompt 时先读本页。它解决「知道好看，但 agent 做不稳」的问题，不是通用工程流水线（工程流看 [[Matt Pocock Skills 使用手册]]）。

# MengTo Skills Handbook

## 一句话定义

**MengTo/Skills** 是一组面向 **设计师 + builder + AI coding agent** 的 **操作手册（SOP）库**。

- 每个 skill = 一个文件夹 + 必选 `SKILL.md`
- 目标：把「好提示词 / 抓取流程 / 实现套路 / 审美约束」固化成可重复执行的版本化文件
- 适用 agent：**Codex / Claude / Cursor / Pi / 其他** 只要能加载 `SKILL.md`
- 仓库定位不是「装完就变强的插件」，而是 **任务路由到对应 runbook，再按输出合同交付**

官方仓库：[https://github.com/MengTo/Skills](https://github.com/MengTo/Skills)

---

## 与其他 skill 体系的边界

| 体系 | 解决什么 | 何时优先 |
|---|---|---|
| **MengTo/Skills** | 设计方向、参考复刻、落地页/动效/WebGL、可玩网页游戏、灵感资产生产 | 视觉与交互质量、从参考到 prompt/实现 |
| **[[Matt Pocock Skills 使用手册]]** | grill → spec → tickets → implement / TDD / review | 工程需求澄清、架构、实现闭环 |
| **[[pi-skills-handbook]]** / [[Agent Skills 与 SKILL.md 工作流]] | Pi/通用 skill 机制与本机能力地图 | 先理解 skill 系统本身 |

**不要混用场景：**

- 做 CRUD / 修 bug / 写后端契约 → Matt / 工程 skill
- 做 Awwwards 级站、GSAP 叙事、Three.js 小游戏、视频转 superprompt → MengTo
- 两边可串联：先用 Matt 把产品边界问清，再用 MengTo 做视觉与交互实现

---

## 哲学（作者四条，决定怎么用）

来源：[README Philosophy](https://github.com/MengTo/Skills/blob/main/README.md)

1. **Prompts are assets** — 好 prompt 存文件、版本化，不当一次性聊天。
2. **Specs beat vibes** — 约束、层级、「一次只改 1–2 件事」优于模糊审美。
3. **References beat paragraphs** — 截图/视频比长描述更能携带字体、间距、节奏。
4. **Skills are operating procedures** — 写清何时用、先做什么、默认值、别踩什么坑。

Agent 使用时的翻译：

- 不要「参考一下 skill 写点东西」
- 要「严格按 skill 的 workflow + quality bar 跑完并验收」

---

## 本机安装状态（2026-07-29 核验）

| 项目 | 状态 |
|---|---|
| 源 skill 数 | **118** |
| `~/.agents/skills` | **118/118** |
| Pi `~/.pi/agent/skills` | **118/118** 链接 |
| Claude `~/.claude/skills` | **118/118** |
| 本地缓存副本 | `~/.cache/mengto-skills` |
| Eve / PromptScript | 不支持 global，跳过 |
| `~/.codex/skills` / `~/.cursor/skills` | **未单独落点**（CLI 全局安装未完整写入这两处） |

分类计数（以本机缓存 `agent-skills/**/SKILL.md` 为准）：

| 分类                   |      数量 | 内容倾向                   |
| -------------------- | ------: | ---------------------- |
| **web-design**       |      79 | 落地页、风格系统、动效、WebGL、布局细节 |
| **game-development** |      19 | Three.js/可玩网页游戏系统与 QA  |
| **codex**            |      17 | 采集、复刻、审计、迭代验证、内容生产工作流  |
| **media**            |       2 | 图库选图                   |
| **ui**               |       1 | 设计优先 prompt 结构         |
| **合计**               | **118** |                        |

安装命令（本机实际路径）：

```bash
# 网络直装不稳定时可先浅克隆
git clone --depth 1 https://github.com/MengTo/Skills.git ~/.cache/mengto-skills
npx skills add ~/.cache/mengto-skills -g --all --full-depth
```

直装等价写法：

```bash
npx skills add MengTo/Skills -g --all --full-depth
```

更新：

```bash
npx skills update -g -y
# 或重装缓存副本
```

> 注意：本机已有 `gsap-core` 等 GSAP 系列 skill；MengTo 的实现 skill 名是 **`gsap`**，二者并存，不互相覆盖。

---

## 文件夹契约

```text
agent-skills/<category>/<skill-name>/
  SKILL.md        # 必选：frontmatter + workflow
  REFERENCES.md   # 可选：只放链接
  ARTICLE.md      # 可选：长文解释
  assets/         # 可选
  scripts/        # 可选
  demo/
    index.html    # 可运行 demo
    PROMPT.md     # 复刻/remix 提示
```

约定：

- agent **只把 `SKILL.md` 当执行入口**
- `REFERENCES.md` 不塞进 workflow 正文
- 视觉 skill 常带 `demo/`，可先看 demo 再实现
- skill 应 **portable**：无密钥、无私有路径、不绑定某个客户仓库

---

## 正确使用方法

### 核心心智（3 条）

1. **Skill = 场景路由 + 作业流程**，不是百科。
2. **一次只加载最窄的 1 个**，或一条明确流水线；禁止 118 个全塞上下文。
3. **你提供触发条件与输入物；skill 负责步骤、默认值、输出合同与验收。**

### 方法 A：单 skill 触发（最常用）

模板：

```text
严格按 `<skill-name>` 执行。
输入：<视频/URL/HTML/截图/当前仓库文件>
目标：exact recreation | inspired adaptation
输出：按该 skill 的 Output Contract / Quality Bar
不要泛泛总结；缺输入先列缺口再停。
```

示例：

```text
严格按 video-to-superprompt 执行。
输入：./refs/hero-scroll.mp4
模式：exact recreation
输出：单个 paste-ready superprompt + asset map
```

### 方法 B：流水线串联（设计复刻 / 灵感生产）

旗舰 web-design 流水线（README 推荐顺序）：

```text
参考视频/站点
  → video-to-superprompt
  → stitched-full-page-capture
  → html-to-interaction-prompts
  → design-first-ui-prompting
  → landing-page / gsap / threejs / 具体风格 skill
```

| 步骤 | Skill | 产出 |
|---|---|---|
| 1 | `video-to-superprompt` | 可重建的超级提示词 |
| 2 | `stitched-full-page-capture` | 全页结构证据（不只 hero） |
| 3 | `html-to-interaction-prompts` | 分节交互 prompt 包 |
| 4 | `design-first-ui-prompting` | 把模糊审美压成约束卡 |
| 5 | 实现 skill | 真正落地代码 |

关键：**前几步产出“可粘贴资产”，后几步才写代码。** 否则 agent 容易直接“凭感觉生成一个差不多的页面”。

### 方法 C：实现型 skill（写/修代码）

```text
用 gsap skill 修当前 hero → features 滚动叙事。
要求：timeline + ScrollTrigger pin + scrub
约束：只用 transform/opacity；React 用 gsap.context 清理；支持 reduced-motion
```

价值来源：

- When to use
- recipes / defaults
- pitfalls（性能、清理、触发器、FOUC）

### 方法 D：约束型 skill（把审美说清楚）

`design-first-ui-prompting` 强制结构：

```text
GOAL → FORMAT → LAYOUT → TYPE → COLOR → COPY → CONSTRAINTS → NEGATIVE
```

规则：

- 先锁定 layout + hierarchy + copy
- 变体 **一次只改 1–2 个变量**
- 排版不稳就 2-pass（先无字生成，再人工/Figma 排版）

### 方法 E：日常灵感资产生产

```text
按 daily-ui-inspiration-capture 跑今天的包
输出目录：articles/YYYY-MM-DD-ui-inspiration-capture/
必须 5 个 references + full-page + section crops + motion frames
```

后续可接：

```text
build-daily-inspiration-sites
```

把 5 个参考变成 5 个原创 Sites 构建任务。

---

## 三类 skill 的使用差异

| 类型 | 例子 | 你怎么用 | 产出形态 |
|---|---|---|---|
| **工作流 skill** | `daily-ui-inspiration-capture`、`video-to-superprompt` | “按 workflow 跑一遍” | 固定目录/固定格式资产 |
| **规范 skill** | `landing-page`、`design-first-ui-prompting` | “先问齐信息，再按结构写” | 信息清单 + 页面/提示词骨架 |
| **实现 skill** | `gsap`、`threejs`、`tailwindcss` | “按 recipes + pitfalls 实现/修” | 代码模式 + 性能/清理约束 |
| **风格系统 skill** | `dark-glass-clean-layout`、`editorial-tech` | “整页采用这套视觉语法” | 色/字/布局/材质默认值 |

---

## 场景路由表（先查这张）

| 你现在要做的事               | 首选 skill                                      | 备选/后续                                                 |
| --------------------- | --------------------------------------------- | ----------------------------------------------------- |
| 视频/录屏 → 可重建提示词        | `video-to-superprompt`                        | `stitched-full-page-capture`                          |
| 已有 HTML → 分拆交互 prompt | `html-to-interaction-prompts`                 | 各实现 skill                                             |
| 只截到 hero，结构不全         | `stitched-full-page-capture`                  | `daily-ui-inspiration-capture`                        |
| 每日灵感采集                | `daily-ui-inspiration-capture`                | `build-daily-inspiration-sites`                       |
| 高转化单页落地               | `landing-page`                                | `pricing-page`、`product-proof-saas`                   |
| 提示词太虚、出图不稳            | `design-first-ui-prompting`                   | 风格系统 skill                                            |
| Awwwards/作品集级整站       | `build-awwwards-quality-sites`                | `cinematic-gsap-lenis-motion-system`                  |
| GSAP 时间轴/滚动           | `gsap`                                        | `gsap-scrolltrigger-storytelling`、`animation-systems` |
| Three.js / WebGL      | `threejs`、`webgl-landing-steering`            | `vantajs`、`globe-gl`、`unicorn-studio`                 |
| 可玩网页游戏                | `build-isometric-arpg`                        | 敌人/关卡/音频/QA 子系统                                       |
| 动效性能差                 | `optimize-web-animations`                     | `optimize-threejs-games`                              |
| 任务要反复验证直到过线           | `iterate-until-verified`                      | 具体领域 skill                                            |
| 选营销图                  | `unsplash-asset-images` / `aura-asset-images` | —                                                     |
| 写像 Meng 的 X 帖         | `write-like-meng-on-x`                        | `x-bookmark-quote-posts`                              |
| 审查是否抄参考太狠             | `audit-reference-originality`                 | `generate-reference-inspired-brand-worlds`            |

---

## 旗舰 skill 深读

### 1) `video-to-superprompt`

**何时用：** 用户给了视频/录屏/链接，要求分析设计、动效、滚动、字体、WebGL，或生成可复刻 prompt。

**工作流摘要：**

1. 定位源视频（本地/URL/上传）；不可访问就先停
2. 技术检查：`ffprobe` + `ffmpeg` 抽关键帧
3. 分层分析：故事 / 布局 / 运动 / 视觉 / 技术栈 / a11y·性能
4. 资产地图（URL / 本地名 / 占位）
5. 写 superprompt（默认单个 fenced text 块）
6. 验证路径与代表性帧

**输出模式：**

- Prompt only
- Article
- Implementation brief
- Asset-generation pack

**质量线：**

- 不看原视频也能重建
- 运动机制要写死：pin、scrub、`video.currentTime`、mask、shader 等
- 每次都写 mobile + reduced-motion
- 明确 anti-patterns（通用 SaaS 段、装饰 blob、错误的 autoplay 等）

来源：`agent-skills/codex/video-to-superprompt/SKILL.md`

### 2) `landing-page`

**核心判断：** Landing page ≠ Homepage。

- Homepage：多意图
- Landing page：**一个 offer → 一个受众 → 一个主行动**

**开工前必须收集：**

1. 页面目的 / 主 CTA / 转化定义
2. ICP、问题、前 3 个异议、流量来源、先验知识
3. 证明材料与资产
4. 品牌语气与设计方向

**默认结构：**

- Above the fold：标题 / 副标 / 主 CTA / 一条证明 / Hero 视觉
- Mid：问题→方案 / 利益点 / How it works / 社会证明
- Bottom：FAQ / 风险逆转 / 最终 CTA

来源：`agent-skills/web-design/landing-page/SKILL.md`

### 3) `design-first-ui-prompting`

**核心原则：** Prompt like a design system, not a wish.

**迭代规则：**

- 第一稿锁定 layout + hierarchy + copy
- variants 只改一个变量：angle / accent / card arrangement / background
- 保留本地 reference pack，不要让模型“记住品味”

来源：`agent-skills/ui/design-first-ui-prompting/SKILL.md`

### 4) `daily-ui-inspiration-capture`

**不是**截图倾倒，而是 **article-ready bundle**。

默认合同：

- 目录：`articles/YYYY-MM-DD-ui-inspiration-capture/`
- 文件：`content.md` + `manifest.json` + 本地图片/视频
- **正好 5 个** final references
- 每个 live 站：full-page + 连续 section crops + motion frames
- 去重：对比历史 manifest 的 title/URL/image URL

来源：`agent-skills/codex/daily-ui-inspiration-capture/SKILL.md`

### 5) `gsap`

**何时用：** 专业 UI 动效、时间轴编排、ScrollTrigger 叙事。

**默认偏好：**

- 动画 `x/y/scale/rotation/autoAlpha`，不动画 layout 属性
- React/SPA 用 `gsap.context()` 清理
- 字体/图片稳定后再 `ScrollTrigger.refresh()`

来源：`agent-skills/web-design/gsap/SKILL.md`

---

## 你给 agent 的标准说法（可复制）

### 分析参考

```text
严格遵循 video-to-superprompt。
输入：<视频或链接>
模式：exact recreation
输出：paste-ready superprompt + asset map
不要总结；section-by-section 写清运动机制
```

### 写转化页

```text
用 landing-page skill。
先按 Before you design 问齐缺口。
结构按 Core structure；above the fold 只有一个主 CTA。
```

### 修动效

```text
用 gsap skill。
目标：hero 入场 + 中段 pin + scrub。
禁止 animating top/left/width/height；卸载要清理；支持 prefers-reduced-motion。
```

### 压提示词

```text
先跑 design-first-ui-prompting，把下面描述压成完整 prompt skeleton，
再生成 3 个 variants，每个只改一个变量。
```

### 日常灵感

```text
按 daily-ui-inspiration-capture 执行今日采集。
输出 5 references 的完整 bundle，不要 README.md。
```

---

## 全量 skill 目录（118）

> 说明：下表 description 来自各 `SKILL.md` frontmatter，2026-07-29 从本机缓存抽取。执行时仍以对应 `SKILL.md` 正文为准。

### Codex 工作流（17）

| Skill                                      | 用途摘要                                |
| ------------------------------------------ | ----------------------------------- |
| `article-prompts-to-skills`                | 文章/教程/prompt pack → 可复用 skill 包     |
| `audit-reference-originality`              | 对照参考审原创性/抄袭风险                       |
| `audit-verify-explain-grade-5`             | 审计、用证据验证、用小学生能懂的话解释                 |
| `browser-video-recording`                  | 把浏览器场景录成精致演示视频                      |
| `build-daily-inspiration-sites`            | 把每日灵感包变成 5 个原创 landing 构建           |
| `daily-ui-inspiration-capture`             | 日更 UI 灵感采集与打包                       |
| `elevenlabs-tts`                           | ElevenLabs TTS / 本地 voice profile   |
| `generate-reference-inspired-brand-worlds` | 参考视觉 → 多套原创品牌世界                     |
| `html-to-interaction-prompts`              | HTML → 截图背书的交互 prompt 文             |
| `implement-fog-of-war`                     | Three.js 战争迷雾/感知系统                  |
| `iterate-until-verified`                   | 任意重任务的执行-验证循环                       |
| `optimize-web-animations`                  | 前端动画/Canvas/WebGL 性能优化              |
| `performance-profiling`                    | Apple 平台 Instruments/MetricKit 性能剖析 |
| `stitched-full-page-capture`               | 懒加载/动效/WebGL 页的可靠全页截图               |
| `video-to-superprompt`                     | 参考视频 → 超详细重建 prompt                 |
| `write-like-meng-on-x`                     | 按 Meng 语料校准 X 帖风格                   |
| `x-bookmark-quote-posts`                   | 书签 → 有来源的 quote-post 草稿             |

### Media（2）

| Skill | 用途摘要 |
|---|---|
| `aura-asset-images` | Aura Assets 选营销/设计图 |
| `unsplash-asset-images` | Unsplash 按场景/裁切/比例选图 |

### UI（1）

| Skill | 用途摘要 |
|---|---|
| `design-first-ui-prompting` | 设计优先、规格驱动的 UI prompt 系统 |

### Game development（19）

| Skill | 用途摘要 |
|---|---|
| `author-game-levels` | 可读的扁平世界关卡编排 |
| `build-game-audio-feedback` | 战斗/状态/空间音频反馈 |
| `build-game-camera-controls` | 等距/跟随/遮挡/锁定/震动相机 |
| `build-game-changelog` | 游戏内 changelog 与发布 provenance |
| `build-game-inventory` | 背包/装备/tooltip/拖拽/持久化 |
| `build-game-map-editor` | 浏览器地图编辑器 |
| `build-game-monster-system` | 怪物资产契约与集成 |
| `build-hybrid-game-assets` | 导入网格/程序化/AI 资产生成混合管线 |
| `build-isometric-arpg` | 可玩等距 ARPG 架构 |
| `build-mobile-threejs-games` | 移动端触控与安全区 |
| `build-threejs-enemy-systems` | 数据驱动敌人原型与招式 |
| `build-vesperfall-review-assets` | Vesperfall 资源库审查对 |
| `create-game-vfx` | 可读且性能安全的战斗 VFX |
| `design-action-combat` | 可读战术动作战斗 |
| `design-game-encounters` | 遭遇战节奏与 boss 阶段 |
| `optimize-threejs-games` | 游戏性能剖析与优化 |
| `ship-web-games` | 打包部署与生产冒烟 |
| `test-playable-web-games` | 可玩性 E2E + 浏览器证据 |
| `tune-enemy-ai` | 仇恨/走位/招式选择与可读 telegraph |

### Web design（79）

#### 转化与整站

| Skill | 用途摘要 |
|---|---|
| `build-awwwards-quality-sites` | 高辨识度营销/作品集整站 |
| `landing-page` | 高转化单 offer 落地页 |
| `pricing-page` | SaaS 定价页 |
| `product-proof-saas` | 以真实工作流/界面为证明的 SaaS 页 |
| `operational-enterprise-ai` | 企业 AI/自动化/审计边界产品页 |
| `tailwindcss` | Tailwind 布局/字体/响应式/组件惯例 |
| `animation-systems` | 产品级动效原则与编排 |
| `webgl-landing-steering` | WebGL 重落地页的视觉方向舵 |

#### 运动与滚动叙事

| Skill                                | 用途摘要                                    |
| ------------------------------------ | --------------------------------------- |
| `animation-on-scroll`                | IntersectionObserver 滚动显现               |
| `cinematic-gsap-lenis-motion-system` | GSAP + ScrollTrigger + Lenis 电影感系统      |
| `cinematic-scroll-storytelling`      | 滚动驱动电影感 landing                         |
| `gsap`                               | GSAP timeline / ScrollTrigger / stagger |
| `gsap-scrolltrigger-storytelling`    | sticky 产品叙事                             |
| `marquee-loop`                       | 无缝无限跑马灯                                 |
| `masked-reveal`                      | 遮罩分词显现                                  |
| `staggered-word-reveal`              | 轻量分词上浮显现                                |
| `scroll-progress-timeline`           | 流程步骤滚动时间线                               |
| `scroll-scrubbed-visual-sequence`    | 滚动擦洗视觉序列                                |
| `scroll-scrubbed-word-reveal`        | 滚动进度驱动逐词显现                              |
| `scroll-world-storytelling`          | 长文/案例 → 滚动世界故事页                         |

#### WebGL / Canvas / 3D

| Skill | 用途摘要 |
|---|---|
| `add-shader-cursor-trail` | WebGPU 光标尾迹 |
| `background-grid-webgl` | 透视网格背景 |
| `cobejs` | 轻量交互地球 |
| `globe-gl` | globe.gl 数据地球 |
| `globe-particles` | 粒子球/环可视化 |
| `matterjs` | Matter.js 2D 物理 |
| `threejs` | Three.js 场景/加载/性能 |
| `unicorn-studio` | Unicorn Studio 嵌入与性能 |
| `vantajs` | Vanta 背景特效 |
| `webgl-3d-object` | 单物体 PBR/光照展示 |
| `webgl-laser` | 全屏激光背景 |
| `shaders-cursor-ripples` | 光标流体扭曲 |
| `liquid-metal-border` | 液态金属边框 |
| `thinking-orbs` | AI loading/状态球体 |

#### CSS 细节与材质

| Skill | 用途摘要 |
|---|---|
| `beautiful-shadows` | 分层中性 elevation 阴影 |
| `company-logos` | Iconify Simple Icons logo |
| `container-lines` | 容器参考线与角标 |
| `corner-diagonals` | 斜切角/倒角 |
| `corner-lasers` | 角锚激光构图 |
| `css-alpha-masking` | 线性 alpha 边缘淡出 |
| `css-border-gradient` | 细腻渐变描边 |
| `gooey-blob-system` | SVG 滤镜黏液团 |
| `number-details` | 01/02/03 装饰编号 |
| `progressive-blur` | 分层 progressive blur |
| `solar-duotone-bold` | Solar Duotone Bold 图标风格 |
| `beam-glow-states` | border-beam 交互态光边 |
| `reveal-hover-effect` | 光标 spotlight 揭幕 |
| `ambient-section-particles` | 单 section 克制粒子氛围 |

#### 布局系统

| Skill | 用途摘要 |
|---|---|
| `agency-grid-layout-minimal` | 极简 agency 编辑网格 |
| `book-serif-index` | 书档 serif + mono 索引 |
| `editorial-tech` | 杂志编辑感 × 产品科技细节 |
| `framed-grid-layout` | 可见边界线 + L 角框网格 |
| `image-first-grid-layout` | 图像主导网格 |
| `nested-container-frames` | 容器套容器框架 |
| `split-layout-technical` | 技术双栏分屏 |
| `technical-wireframe-info-layout` | 线框注解信息布局 |

#### 视觉风格 / 页面气质

| Skill | 用途摘要 |
|---|---|
| `atmosphere-background` | 暗色大气光褶背景 |
| `blue-cloudy-clean-modern` | 明亮蓝天白云干净现代 |
| `blue-laser-clean-glass-layout` | 蓝激光 + 暗玻璃 |
| `bright-green-tech-system-webgl` | 亮绿技术系统 + WebGL |
| `clean-minimal-beige-light-mode` | 米色极简浅色 |
| `dark-blue-contrasting-clean` | 高对比暗蓝 |
| `dark-glass-clean-layout` | 暗玻璃多栏工作台 |
| `dither-background` | 有序抖动暗底 |
| `dither-laser-dark-mode` | 抖动纹理 + 激光暗色 |
| `framed-tech-dark-border-gradient` | 框式暗技术 + 边框渐变 |
| `funky-purple-container-tech` | 紫调容器技术风 |
| `glass-dark-mode-clock` | 暗玻璃 + 表盘校准感 |
| `glass-dark-ui` | 可读对比的暗玻璃 UI |
| `high-contrast-skeuomorphic-clean` | 高对比干净拟物 |
| `light-mode-paper-technical` | 浅色纸感技术风 |
| `mesh-gradient-dark-blue-clean` | 暗蓝 mesh gradient |
| `nested-container-clean-agency` | 嵌套容器干净 agency |
| `orange-clean-paper-saas` | 橙色纸感 SaaS |
| `skeuomorphic-ui` | 分层拟物表面 |
| `tech-green-dark-mode-modern` | 墨绿信号暗色现代 |

#### 叙事/产品专题页型

| Skill | 用途摘要 |
|---|---|
| `documentary-brutalist-agency` | 纪录片式粗野 agency |
| `editorial-portfolio-chapters` | 作品章节主导作品集 |
| `editorial-service-booking` | 预约服务编辑感站点 |

---

## 什么时候不该用

| 情况 | 原因 |
|---|---|
| 普通业务逻辑 / API / 数据模型 | 不在 MengTo 射程，用工程 skill |
| 已有精确设计稿只需像素实现 | skill 会引入额外“审美自由” |
| description 不匹配却硬套 | 污染上下文，降低执行精度 |
| 一次加载十几个 skill 当灵感合集 | 稀释约束，违背「最窄匹配」 |
| 需要系统级 macOS 原生能力 | 这是网页/设计向库，不是 AppKit/SwiftUI 手册 |

---

## 质量验收清单（通用）

跑完任意 MengTo skill 后，至少检查：

1. **是否读了对应 `SKILL.md` 而不是凭记忆**
2. **输入物是否齐全**；缺则先列缺口
3. **输出是否符合该 skill 的 contract**（目录/格式/prompt 结构）
4. **约束是否写成可执行规格**（尺寸、缓动、层级、禁止项）
5. **是否写了 mobile / reduced-motion / 性能边界**（视觉类几乎总需要）
6. **是否一次只改 1–2 个变量**（迭代时）
7. **参考是 evidence 还是装饰**（截图/帧是否真被用进决策）

---

## 推荐学习顺序（本机已安装后）

### 第 1 天：建立“规格 > 感觉”

1. `design-first-ui-prompting`
2. `landing-page`
3. 用同一产品写一版 hero + above-the-fold

### 第 2 天：参考 → 资产

1. `video-to-superprompt`
2. `stitched-full-page-capture`
3. `html-to-interaction-prompts`

### 第 3 天：实现一层

1. `gsap` 或 `animation-on-scroll`
2. 选 1 个风格 skill（如 `dark-glass-clean-layout`）
3. 做一页可滚动 demo

### 第 4 天：闭环

1. `daily-ui-inspiration-capture`
2. `build-daily-inspiration-sites`（可选）
3. `optimize-web-animations` 做一次性能收口

### 若做游戏

1. `build-isometric-arpg`
2. `design-action-combat` + `build-threejs-enemy-systems`
3. `test-playable-web-games` + `ship-web-games`

---

## 与本 vault / 本机 agent 的协作建议

- **Pi 会话**：skill 已在 `~/.pi/agent/skills`；对话中点名 skill 名即可。
- **Claude Code**：`~/.claude/skills` 已有 118 个。
- **工程任务**：继续用 [[Matt Pocock Skills 使用手册]]；视觉任务切 MengTo。
- **机制层**：skill 格式与加载原理见 [[Agent Skills 与 SKILL.md 工作流]]、[[pi-skills-handbook]]。
- **前端资源页**：实现细节还可交叉 [[前端设计资源-给Agent��]]。

---

## 已知限制 / uncertain

1. **skills.sh 排行榜安装量与本仓库本地 118 是否完全一致**：未交叉核验，`uncertain`。
2. **Codex / Cursor 专用 skills 目录未完整落点**：当前以 `~/.agents/skills` + Pi/Claude 为准；若某 agent 只扫自己目录，需额外适配，`uncertain` 取决于该 agent 发现规则。
3. **部分 skill 依赖 Codex in-app browser / 特定本地路径约定**（如 daily capture 的 article 目录）；换到 Pi 时要在任务里显式改输出落点。
4. **风格 skill 之间有重叠审美**；同时启用多个风格系统会互相打架——应单选。

---

## 来源

1. [MengTo/Skills GitHub](https://github.com/MengTo/Skills)
2. [README.md](https://github.com/MengTo/Skills/blob/main/README.md)
3. 本机缓存：`~/.cache/mengto-skills/agent-skills/**/SKILL.md`（2026-07-29 安装快照，118 个）
4. 代表性 skill 正文：`video-to-superprompt`、`landing-page`、`design-first-ui-prompting`、`daily-ui-inspiration-capture`、`gsap`

## 相关页面

- [[Matt Pocock Skills 使用手册]]
- [[Agent Skills 与 SKILL.md 工作流]]
- [[pi-skills-handbook]]
- [[前端设计资源-给Agent用]]
