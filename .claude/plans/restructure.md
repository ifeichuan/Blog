# Blog 文件结构优化 & 新旧版本迁移计划

## 目标
1. 归档旧版页面（不删除，移入 archive）
2. 实验性页面统一收归 `/labs/` 路由
3. 组件按类型分组

---

## 一、归档旧版本

将以下文件移入 `src/pages/_archive/`（加下划线前缀，Astro 不会为其生成路由）：

| 文件 | 说明 |
|------|------|
| `src/pages/old.astro` | 旧首页 |
| `src/pages/new/homepage.astro` | 新首页原型（已被 index.astro 取代） |
| `src/pages/new/index.astro` | 原型 scaffold |
| `src/pages/new/index.tsx` | 原型组件 |
| `src/pages/card.astro` | 开发调试页（列出所有路由） |

同时清理根目录的过程文件：
- `prototype-homepage.html` → 移入 `_archive/`
- `prototype-v3.html` → 移入 `_archive/`
- `CRITIQUE.md` → 移入 `_archive/`
- `PLAN-section2.md` → 移入 `_archive/`

---

## 二、实验页面统一到 `/labs/`

将散落在 `src/pages/` 顶层的实验页面移入 `src/pages/labs/`：

| 现路由 | 新路由 |
|--------|--------|
| `/texture-lab` | `/labs/texture-lab` |
| `/blur-gsap` | `/labs/blur-gsap` |
| `/blur-motion` | `/labs/blur-motion` |
| `/blur-waapi` | `/labs/blur-waapi` |
| `/noise-pixel` | `/labs/noise-pixel` |
| `/signature-glass-demo` | `/labs/signature-glass-demo` |
| `/dappled-baseline` | `/labs/dappled-baseline` |
| `/mobile` | `/labs/mobile` |
| `/lenis/*` | `/labs/lenis/*` |

更新 `labs.astro` 中的 href 链接（加 `/labs/` 前缀），并将未列出的实验页面（noise-pixel、signature-glass-demo、dappled-baseline、mobile）也加入列表。

---

## 三、组件按类型分组

新的 `src/components/` 结构：

```
src/components/
├── layout/          # 站点骨架
│   ├── BaseHead.astro
│   ├── Header.astro
│   ├── HeaderLink.astro
│   ├── Nav.astro
│   ├── Footer.astro
│   ├── Intro.astro
│   ├── Mouse.astro
│   └── OnDevMode.astro
├── blog/            # 博客阅读体验
│   ├── BlogList.astro
│   ├── TOC.astro
│   ├── ReaderControls.tsx
│   ├── FormattedDate.astro
│   └── AnnouncementBar.tsx
├── effects/         # 视觉效果 & 动画原语
│   ├── BlurText.tsx
│   ├── BlurTextGsap.tsx
│   ├── BlurTextMotion.tsx
│   ├── SplitText.tsx
│   ├── TextType.tsx
│   ├── Noise.tsx
│   ├── DappledLight.tsx
│   ├── DappledPcss.tsx
│   ├── GlobalVisualCanvas.tsx
│   ├── PixelMouse3D.tsx
│   ├── SignatureDraw.tsx
│   ├── SignatureDrawV2.tsx
│   └── GlassSignature.tsx
├── homepage/        # 首页专属（已存在）
│   ├── ... (现有文件保留)
│   ├── IndexPage.tsx
│   ├── HeroSection.tsx
│   ├── HeroContent.tsx
│   ├── HeroSignature.tsx
│   ├── apple-hello-effect-english.tsx
│   ├── HeroScene.tsx
│   ├── SectionTwo.tsx
│   ├── FixedVisualStage.tsx
│   ├── HomeIntro.astro
│   ├── IndexTypeSequence.tsx
│   └── FpsMeter.tsx
├── lab/             # 实验性 demo 组件
│   ├── ChainTests.tsx
│   ├── InterfaceFeelDemos.tsx
│   ├── LenisFeelDemo.astro
│   └── InfiniteMenu.tsx
├── about/           # (已存在)
├── fancy/           # (已存在，保留 text/ 子目录)
├── hooks/           # (已存在)
├── texture-lab/     # (已存在)
├── tools/           # (已存在)
└── ui/              # (已存在)
```

删除变空的 `blogs-lab/` 目录（如果有内容则合并到 `blog/` 或 `lab/`）。

---

## 四、更新所有 import 路径

组件移动后，全局替换所有引用路径。Astro 使用 `@/` alias 指向 `src/`，所以需要更新的模式：

- `@/components/BaseHead.astro` → `@/components/layout/BaseHead.astro`
- `@/components/BlogList.astro` → `@/components/blog/BlogList.astro`
- `@/components/BlurText` → `@/components/effects/BlurText`
- 等等

同时更新 `src/layouts/` 中的 import。

---

## 五、验证

1. `pnpm build` 确保无编译错误
2. 检查所有路由可访问
3. 确认 archive 页面不再生成路由

---

## 执行顺序

1. 先做归档（影响最小）
2. 移动实验页面到 labs/
3. 组件分组 + 批量更新 import
4. 构建验证
