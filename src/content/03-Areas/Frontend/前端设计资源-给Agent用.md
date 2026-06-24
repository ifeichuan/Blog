---
created: 2026-06-14
tags:
  - frontend
  - design
  - ai-agent
isPub: true
title: 前端设计资源-给Agent用
dateCreated: 2026-06-23T00:47:38+08:00
dateModified: 2026-06-24T12:34:24+08:00
---

# 前端样式/设计资源 — 给 AI Agent 用

> 整理于 2026-06-14。每条附原始链接，可证。分六块：改 Agent 行为的 skill → 灵感/组件站 → 组件库推荐 → 2026 CSS 技巧 → 动效库 → 本地已装 skill。

相关笔记：[[前端交互效果收集]] | [[CSS]]

---

## 一、专门给 Agent 装的设计 Skill（npx 可装）

| Skill | 特点 | 链接 |
|-------|------|------|
| **ui-skill** (`/ui`) | 设计系统优先，5 模式 plan/build/theme/motion/audit，写码前先跑无障碍+响应式检查；支持 Claude Code / Gemini CLI / Antigravity | https://github.com/lcanady/ui-skill |
| **modern-frontend-skill v3** | 专为 2026：OKLCH token、scroll-driven 动画、Liquid Glass、View Transitions、Anchor Positioning，附反模式对照表 | https://github.com/deveshpunjabi/modern-frontend-skill |
| **better-web-ui** | 框架无关，30+ skill（add-ui、critique、depth、data-viz、empty-state、forms、hierarchy 等），让 UI 别再像 Midjourney 的 SaaS dashboard | https://github.com/aladicf/better-web-ui |
| **better-react-web-ui** | React + Tailwind + Shadcn 特化版，作者主力维护 | https://github.com/aladicf/better-react-web-ui |
| **ui-craft** | 28 个设计工程参考文档，给 Agent 注入品味知识（规则，非模板） | https://github.com/educlopez/ui-craft |
| **OpenAI frontend-skill** | 官方：composition-first、双字体/单 accent、首屏当海报 | https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4 |
| **awesome-agent-skills** | 聚合索引，1424+ skills，含 Anthropic/Vercel/Google Labs/Figma/Stripe/GSAP 等官方出品 | https://github.com/VoltAgent/awesome-agent-skills |

安装示例：

```bash
npx skills add aladicf/better-web-ui --agent codex
npx skills add educlopez/ui-craft
```

---

## 二、参考/组件网站

### 带 AI prompt（最适合 Agent）

- **UIDatabase** — 每个 pattern 配可粘贴 prompt（Cursor/v0/ChatGPT）— https://uidatabase.com/guides/best-ui-design-tools-2026

### 灵感画廊（按用途，来源 [Colorlib](https://colorlib.com/wp/showcase-inspiration-sites-web-design/)）

| 用途 | 站点 |
|------|------|
| 落地页（整页截图/滚动叙事） | Lapa Ninja / Land-book |
| 获奖级视觉 | Awwwards / CSS Design Awards / [Godly](https://godly.design/) |
| 真实产品 UX 研究（60 万+ 截图） | [Mobbin](https://mobbin.com) / [Refero](https://refero.design) / Page Flows |
| SaaS UI 模式库（Notion、Linear、Intercom 等） | [SaaSUI.design](https://saasui.design) |
| 配色/排版方向 | Dribbble（可按颜色搜）/ Behance |
| 克制/排版控 | Minimal Gallery / SiteInspire |
| 每日被动灵感 | Muzli（Chrome 插件，聚合）/ [Collect UI](https://collectui.com)（按 404/login/pricing 分类） |
| 灵感站聚合导航 | [TOOOLS.design](https://www.toools.design/ui-web-design-inspiration-websites)（200+ 站索引） |
| 13,400+ 组件 + 源码 | [Shuffle](https://shuffle.dev/components) |

> 最优组合：Mobbin + Refero 做 UX 研究、Awwwards/Godly 看视觉、Lapa Ninja 找落地页。

### 技术博客 / 案例

| 站点 | 说明 |
|------|------|
| [Codrops](https://tympanus.net/codrops/) | 前端动效/创意开发教程+案例拆解，含 Creative Hub 演示集、Webzibition 2000+ 精选站、Case Studies 深度复盘 |

### 移动端微交互

| 站点 | 说明 |
|------|------|
| [Screenlane](https://screenlane.com) | 移动端 UI 细节动效截图，微交互参考宝库 |

---

## 三、组件库（2026 年推荐）

来源：[Untitled UI - 14 Best React UI Component Libraries in 2026](https://www.untitledui.com/blog/react-component-libraries)

2026 关键趋势：TypeScript、WCAG 无障碍、暗色/亮色主题、SSR 兼容已成标配。

| 库 | 定位 | 特点 |
|----|------|------|
| **shadcn/ui** | 复制粘贴式 | 完全控制源码，社区最大 |
| **Radix UI** | 无样式可访问原语 | shadcn/ui 的底层依赖 |
| **React Aria** | 无障碍行为库 | Adobe 出品，30+ 组件原语 |
| **Base UI** | MUI 无样式版 | Material 团队出品 |
| **MUI** | 成品组件库 | Material Design |
| **Ant Design** | 成品组件库 | 企业级 |
| **Magic UI** | 动画组件 | 设计感强，动效丰富 |
| **React Bits** | 动效组件 | Framer Motion 驱动，视觉冲击力强 |
| **Fancy Components** | 创意组件 | awwwards 风格，直接套用 |
| **Aceternity UI** | 炫技组件 | 3D 卡片、粒子等，适合 hero section |
| **Origin UI** | 2025 新秀 | 现代审美，轻量 |
| **Cult UI** | 轻量组件 | 设计精致 |

---

## 四、2026 核心 CSS 技巧

来源：[Modern CSS in 2026 (dev.to)](https://dev.to/alexcloudstar/modern-css-in-2026-the-javascript-you-can-finally-delete-2l15) · [AppCommandos](https://appcommandos.com/blog/modern-css-2026-container-queries-cascade-layers) · [2026 CSS Features (Riad Kilani)](https://blog.riadkilani.com/2026-css-features-you-must-know/) · [Web Standards 2026 Deep Dive](https://www.youngju.dev/blog/culture/2026-05-16-web-standards-2026-container-queries-view-transitions-popover-anchor-positioning-css-nesting-deep-dive.en)

### 已全面可用（所有主流浏览器 baseline）

| 特性 | 用途 | 替代了什么 |
|------|------|-----------|
| `:has()` | 父选择器 | JS class 切换 |
| `@container` queries | 组件级响应式（基于父容器） | 全局 media query |
| CSS Nesting | 原生嵌套 | Sass/PostCSS 嵌套 |
| `@layer` | 级联层显式管理优先级 | specificity 战争 |
| `oklch()` + `color-mix()` + `light-dark()` | 感知均匀色彩 / 动态混合 / 亮暗自动切换，纯 CSS 生成整套调色板 | hex/rgb/hsl |
| `text-wrap: balance / pretty` | 标题自动换行平衡 | 手动 `<br>` |
| View Transitions API | 同文档 + 跨文档路由过渡动画 | react-transition-group 等 |
| Popover API | 原生弹出层，自动处理顶层和焦点 | 手写 z-index + portal |
| Anchor Positioning | 锚点定位（tooltip/dropdown 原生） | Popper.js / Floating UI |
| Scroll-driven Animations | `animation-timeline: view()` 滚动驱动，不占主线程 | JS scroll 监听 |
| `@starting-style` | 首次渲染初始样式，弹窗入场无闪烁 | `setTimeout` hack |
| `@scope` | 样式作用域隔离 | BEM / CSS Modules |
| `field-sizing: content` | 输入框自适应内容大小 | JS 计算高度 |

### 渐进增强（部分浏览器）

| 特性 | 状态 |
|------|------|
| CSS `if()` | 属性值内条件逻辑，Chrome 实验 |
| Grid Lanes (Masonry) | 原生瀑布流布局 |
| Scroll-state queries | 容器滚动/吸附状态查询 |

---

## 五、设计工具

| 工具 | 说明 |
|------|------|
| [Coolors](https://coolors.co) | 空格键刷配色方案，支持对比度检测和调色 |
| [Fontpair](https://fontpair.co) | Google Fonts 字体配对推荐 |
| [Typescale](https://typescale.com) | 视觉化字体比例生成器，直接输出 CSS 变量 |
| [CSS Gradient](https://cssgradient.io) | 可视化渐变生成，支持 mesh gradient 和径向渐变 |
| [SVG Repo](https://svgrepo.com) | 50 万+ 免费 SVG 图标 |
| [Rive](https://rive.app) | 交互动画设计工具，比 Lottie 更强，直接嵌 React |

## 六、动效库选型

来源：[LogRocket 2026 测评](https://blog.logrocket.com/best-react-animation-libraries/) · [GSAP vs Motion vs Spring](https://lab.good-fella.com/blog/gsap-vs-framer-motion-vs-react-spring) · [SmoothUI 对比](https://smoothui.dev/blog/best-react-animation-libraries)

| 库 | 适用场景 | 特点 | 周下载量 |
|----|---------|------|---------|
| **Motion**（原 Framer Motion） | 通用 UI 动画、路由过渡、手势 | 声明式，React 首选，30.7k★ | ~300 万 |
| **TailwindCSS Motion** | Tailwind 项目 CSS-first | 零 JS，class 驱动 | - |
| **GSAP** | 复杂时间线、滚动叙事、SVG 形变 | 框架无关，Webflow 内置，行业标准 | ~100 万 |
| **React Spring** | 物理弹簧动画 | 29k★，API 小，弹簧物理模型 | ~78 万 |
| **Anime.js** | 轻量 SVG 动画 | 66k★ | ~20 万 |
| **AutoAnimate** | 列表增删动画 | 一行代码零配置 | ~40 万 |

### 选型速查

```
UI 交互 + 路由过渡 → Motion
复杂时间线 + 滚动叙事 → GSAP
物理质感动画 → React Spring
列表动画零配置 → AutoAnimate
Tailwind 项目 CSS-first → TailwindCSS Motion
```

---

## 七、本地已装 skill（无需联网，即用）

- **改进套件**（`impeccable` 入口）：`critique` 评估 / `audit` 体检 / `typeset`·`arrange`·`layout` 排版 / `colorize` 配色 / `distill` 简化 / `optimize` 性能 / `adapt` 响应式 / `harden` 健壮 / `clarify` 文案 / `extract` 抽组件
- **风格强度**：`bolder` / `delight` / `quieter` / `overdrive` / `normalize`
- **生成/规划**：`frontend-design`、`shape`、`make-interfaces-feel-better`、`teach-impeccable`
- **动效**：`animate` + GSAP 全家桶（`gsap-core`/`gsap-timeline`/`gsap-scrolltrigger`/`gsap-react` 等）
- **找参考/组件**：`design-explorer`、`component-scout`、`lazyweb-*`
- **实时迭代/设计稿**：`agent-browser`（真浏览器截图）、Pencil MCP（`.pen` 文件）

---

## 八、学习方法论

| 资源 | 作者 | 内容 |
|------|------|------|
| [Refactoring UI](https://refactoringui.com) | Adam Wathan & Steve Schoger | 实用 UI 改进技巧（书） |
| [Laws of UX](https://lawsofux.com) | Jon Yablonski | UX 定律速查卡片 |
| [animations.dev](https://animations.dev) | Emil Kowalski | 动效设计教学 |
| [Fixing Visual AI Slop](https://trilogyai.substack.com/p/fixing-visual-ai-slop) | TrilogyAI | AI Agent 生成 UI 的设计标准文章 |

---

## 八、更多灵感站（2026-06 补充）

来源：[TOOOLS.design 100 Best](https://www.toools.design/blog-posts/ultimate-list-100-best-inspiration-sites-to-inspire-designers) · [FrontendPlanet 22 Sites](https://www.frontendplanet.com/web-design-inspiration-websites/)

### UI/UX 模式库

| 站点 | 说明 |
|------|------|
| [Design Spells](https://www.designspells.com/) | 多学科设计灵感 |
| [Recent Design](https://recent.design/) | 最新设计趋势 |
| [UX Bites](https://builtformars.com/ux-bites) | UX 洞察 |
| [Design Vault](https://designvault.io/) | 设计模式库 |
| [Details Matter](https://detailsmatter.framer.website/) | 微交互画廊 |
| [Viewport UI](https://viewport-ui.design/) | 精选 UI 体验 |
| [Unsection](https://www.unsection.com/) | 网站区块 + hover 效果 |
| [SaaSFrame](https://www.saasframe.io/) | SaaS 设计灵感库 |

### 动效 / 创意

| 站点 | 说明 |
|------|------|
| [Landing Love](https://www.landing.love/) | 动画网站展示（含录屏） |
| [Eyecandy](https://eyecannndy.com/) | Motion graphics 展示 |
| [Hoverstat.es](https://www.hoverstat.es/) | 实验性网站项目 |
| [The Whimsical Web](https://whimsical.club/) | 奇趣创意网站 |
| [Browsing Mode](https://browsingmode.com/) | 极端创新设计 |
| [The FWA](https://thefwa.com/) | 技术创新奖项（老牌） |

### 专项（按页面部件）

| 站点 | 说明 |
|------|------|
| [Supahero](https://www.supahero.io/) | Hero section 设计 |
| [Navbar Gallery](https://www.navbar.gallery/) | 导航栏设计 |
| [Footer](https://www.footer.design/) | 页脚设计 |
| [404s](https://www.404s.design/) | 404 页面 |
| [Pricing Pages](https://pricingpages.design/) | 定价页 |
| [OGimage.gallery](https://www.ogimage.gallery/) | OG 社交图片 |

### 落地页 / 营销

| 站点 | 说明 |
|------|------|
| [One Page Love](https://onepagelove.com/) | 单页网站 |
| [Landingfolio](https://www.landingfolio.com/) | 落地页灵感 |
| [Page Collective](https://pagecollective.com/) | 落地页大集合 |
| [Landdding](https://landdding.com/) | 按行业分类优秀站 |
| [Commerce Cream](https://commercecream.com/) | 电商网站 |
| [Curated Web Design](https://www.curated.design/) | 按风格/行业分类 |

### 极简 / 暗色

| 站点 | 说明 |
|------|------|
| [Dead Simple Sites](https://deadsimplesites.com/) | 极简网站 |
| [Dark Mode Design](https://www.darkmodedesign.com/) | 暗色主题 |
| [Dark](https://www.dark.design/) | 暗色主题合集 |
| [httpster](https://httpster.net/) | 独立创意工作室 |

### 其他垂直领域

| 站点 | 说明 |
|------|------|
| [Really Good Emails](https://reallygoodemails.com/) | 邮件设计 |
| [Scrnshts](https://scrnshts.club/) | App Store 截图 |
| [iOS Icon Gallery](https://www.iosicongallery.com/) | iOS 图标 |
| [HUDS + GUIS](https://www.hudsandguis.com/) | HUD/科幻界面 |
| [The Brand Identity](https://the-brandidentity.com/) | 品牌设计 |
| [CSS Nectar](https://cssnectar.com/) | 按颜色/风格/国家筛选 |

---

## 九、项目实践

- [[Eyrie Agent Session UI 组件设计]] — 这些资源的主要落地场景
- [[流式Markdown与ToolCall渲染方案]] — 流式渲染选型
- [[Unicode Braille Loading 组件库]] — loading 组件方向
