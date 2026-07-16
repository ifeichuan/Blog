# Research: 超椭圆（superellipse）在线CSS生成/微调网页工具

## Summary

目前有多个在线工具可以直接编辑CSS参数并实时预览超椭圆形状。其中 **corner-shape.com** 是最贴合需求的工具——直接使用原生 CSS `corner-shape: superellipse()` 属性进行实时微调。此外还有基于 SVG/clip-path 方案的工具，浏览器兼容性更好，适合生产环境使用。

## Findings

1. **corner-shape.com — CSS corner-shape superellipse() generator**  
   最直接的超椭圆 CSS 在线编辑器。基于浏览器原生 `corner-shape` 属性，支持 `superellipse()` 函数参数微调。提供逐角独立控制（四角可分别设置不同形状和半径）、全局链接半径、实时预览。需要注意的是，该工具依赖的 `corner-shape` 属性目前仅 Edge、Chrome、Opera 支持。 [corner-shape.com](https://www.corner-shape.com/)

2. **squircle.style — CSS squircle corner-shape preview tool**  
   简洁的 squircle（方圆形，超椭圆的特例）在线预览工具。使用 `corner-shape: squircle` 配合 `border-radius: 50%` 实时渲染。交互极简，滑动切换 square / squircle / round / bevel / scoop / notch 等形状，适合快速对比效果。 [squircle.style](https://www.squircle.style/)

3. **web-toolbox.dev — Squircle Generator**  
   功能最全面的 squircle/超椭圆生成器。输出格式包括完整 CSS（`clip-path: path()`）、`clip-path` 值、SVG path `d` 属性、完整 SVG 代码四种。提供预设（App Icon、Avatar、Button、Card 4:3、Thumbnail 16:9），可调节角平滑度、旋转角度、宽高比、填充色。因使用 `clip-path` 方案，浏览器兼容性优于 `corner-shape`，适合生产使用。 [web-toolbox.dev](https://web-toolbox.dev/en/tools/squircle-generator)

4. **superellipse.xxhax.com — SuperEllipse SVG Generator**  
   纯 SVG 超椭圆生成器。核心参数为 Power (N) 值（0.5–10），配合 Width/Height 控制尺寸。输出下载 SVG 文件和 CSS clip-path SVG mask，操作直接、结果干净。适合需要 SVG 素材而非纯 CSS 的场景。 [superellipse.xxhax.com](https://superellipse.xxhax.com/)

5. **superellipse.mmeme.me — 超椭圆生成工具（中文）**  
   中文界面的超椭圆 SVG 在线生成器，功能丰富。支持：曲率 N 值调节、描边/填充色、描边宽度、旋转角度、SVG 代码实时预览与导出、CSS Background Code（SVG 转 base64）、彩带效果、预设超椭圆 Demo。灵感来源于小米 200 万 Logo（n=3 超椭圆）。 [superellipse.mmeme.me](https://superellipse.mmeme.me/)

## 方案对比

| 工具 | 技术方案 | 浏览器兼容性 | 输出格式 | 逐角控制 |
|------|----------|-------------|----------|----------|
| corner-shape.com | 原生 `corner-shape` CSS | 仅 Chromium | CSS | ✅ |
| squircle.style | 原生 `corner-shape` CSS | 仅 Chromium | CSS（手动复制） | ❌ |
| web-toolbox.dev | `clip-path: path()` | 较好 | CSS / SVG 多格式 | ❌ |
| superellipse.xxhax.com | SVG | 最佳 | SVG 下载 | ❌ |
| superellipse.mmeme.me | SVG | 最佳 | SVG / CSS background | ❌ |

## Sources

- Kept: [corner-shape.com](https://www.corner-shape.com/) — 最直接的原生 CSS superellipse 实时编辑器
- Kept: [squircle.style](https://www.squircle.style/) — 极简 squircle 形状对比预览
- Kept: [web-toolbox.dev](https://web-toolbox.dev/en/tools/squircle-generator) — 功能最全的 squircle 生成器，多格式输出
- Kept: [superellipse.xxhax.com](https://superellipse.xxhax.com/) — 纯 SVG 超椭圆生成，参数简洁
- Kept: [superellipse.mmeme.me](https://superellipse.mmeme.me/) — 中文超椭圆工具，功能丰富含 CSS Background Code
- Reference: [MDN superellipse()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/superellipse) — 原生 CSS 函数文档
- Reference: [CSS-Tricks superellipse()](https://css-tricks.com/almanac/functions/s/superellipse/) — CSS 函数详解
- Dropped: Stu Nicholls CSS Play — 演示性质，非交互式生成工具
- Dropped: tofrankie/superellipse-generator (GitHub) — 需本地运行，非在线工具
- Dropped: teckyio/superellipse-css (GitHub) — CSS 代码片段参考，非在线工具
- Dropped: semicolony.dev border-radius generator — 通用圆角工具，不支持超椭圆/squircle
- Dropped: FrontendGeek border-radius generator — 通用圆角工具，不支持超椭圆
- Dropped: AllDevToolsHub border-radius generator — 通用圆角工具，不支持超椭圆
- Dropped: ObservableHQ Superellipse Generator — 需要编程交互，非即用型 UI 工具

## Gaps

- 目前没有同时支持**逐角独立控制 + 良好浏览器兼容性**的工具。corner-shape.com 支持逐角控制但仅限 Chromium；web-toolbox.dev 兼容性好但不支持逐角。
- 所有工具均不支持 `border-radius` 原生方案实现超椭圆（数学上不可行），这本身就是这类工具的固有局限。
- 如果后续 Chrome 之外的浏览器普遍支持 `corner-shape` 属性，corner-shape.com 将成为首选工具。

## Supervisor coordination

无需协调。研究完成。