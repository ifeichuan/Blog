# Feichuan's Blog — 设计评审报告

> 生成时间：2026-04-15
> 评审范围：全站（首页、文章页、工具页）

---

## Design Health Score (28/40)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Nav 进度条好，但博客页缺加载反馈 |
| 2 | Match System / Real World | 4 | 主题图标（☀️📜🌙🌑）直觉正确 |
| 3 | User Control and Freedom | 3 | 设置可调，但 Intro 无法跳过 |
| 4 | Consistency and Standards | 4 | OKLCH token 系统、统一间距节奏 |
| 5 | Error Prevention | 2 | 字号有 clamp，但评论/外部资源无错误处理 |
| 6 | Recognition Rather Than Recall | 3 | TOC 可见，但文章页无面包屑 |
| 7 | Flexibility and Efficiency | 3 | localStorage 持久化好，缺键盘快捷键 |
| 8 | Aesthetic and Minimalist Design | 4 | 视觉层级清晰，噪点纹理克制 |
| 9 | Error Recovery | 1 | Twikoo 失败静默，无兜底 UI |
| 10 | Help and Documentation | 1 | 无 tooltip/帮助文字，Reader 控件无引导 |

---

## Priority Issues

### [P1] Intro 动画不可跳过
- 首次访问强制 2.5 秒等待，无跳过按钮
- Fix: 添加 Skip 按钮触发 `Intro:end`，或将 sessionStorage 改为 localStorage

### [P1] 15+ 处 console.log 留在生产代码
- BaseHead、Intro、BlogList、OnDevMode 等组件有大量调试日志
- Fix: 全局移除或替换为 `if (import.meta.env.DEV)` 条件日志

### [P2] Reader 主题切换闪烁
- 进入文章页先显示 light 默认主题，然后硬切到保存的主题
- Fix: 将主题初始化脚本移到 `<head>` 阻塞执行

### [P2] Reader 控件可发现性差
- 齿轮图标在右侧栏，无任何引导提示
- Fix: 首次访问显示脉冲圆点或 tooltip

### [P3] Light/Sepia 主题链接对比度不足
- Light 主题链接 `#b8860b` 在 `#f8f5ec` 上约 4.2:1，未达 WCAG AA
- Fix: Light 链接加深到 `#8a6500`，Sepia 链接加深到 `#705010`

---

## What's Working
1. Reader 主题系统精良（四套主题 + CSS 变量驱动 + prose 继承）
2. 动画编排有"导演感"（8 段 GSAP timeline + 音频循环）
3. 移动端策略务实（检测跳转 /mobile，自定义光标仅桌面端）

## Minor Observations
- BlogList 中有 `class="ssss"` 调试类名
- Mouse 组件 MutationObserver 全量扫描 DOM，大页面可能卡
- 首页三栏布局左右两栏是空的
- `prefers-reduced-motion` 未被检查
- Footer `font-mono` + `mix-blend-overlay` 可读性差

## Automated Scan Summary
- console.log: 15+ 处（CRITICAL）
- Glassmorphism: 5 处（多数功能性，可接受）
- Card 包裹过度: 5+ 处
- 居中过多: banner + footer
- OKLCH 调色系统: 正面模式

---

## Next Steps
1. `/audit` — 清理 console.log + 修对比度 + 加错误处理
2. `/animate` — Intro 添加跳过机制
3. `/optimize` — Reader 主题闪烁修复
4. `/delight` — Reader 控件引导动效
5. `/layout` — 首页空白三栏重新设计
6. `/polish` — 最终细节打磨
