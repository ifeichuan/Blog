# Section 2 实现计划

## 概览

Section 1 → Section 2 过渡 + Section 2 内容区。涉及 5 个独立效果模块。

---

## 模块拆解

### 1. Section 1 浮动 Icons（视差滚动）

**效果**：技术栈 3D 图标 + 抽象几何/emoji 在 hello 签名周围漂浮，滚动时以不同速率下移（视差）。

**实现**：
- 容器 absolute 在 section 1 内，z-index 在签名下方或周围
- 每个 icon 有随机初始位置 + 缓慢旋转（太空漂浮感）
- 滚动驱动：GSAP ScrollTrigger，每个 icon 不同 `speed` 系数（0.3x ~ 1.5x）
- 3D 图标来源：待定（选项：three.js 内建几何体渲染 / 现成 3D icon 库如 icons8.com/3d-fluency 或 3dicons.co）

**文件**：`src/components/FloatingIcons.tsx`

---

### 2. Section 1 → 2 过渡：Pixel Dot Dither Mask + Scale Down

**效果**：滚动驱动，Section 1 缩小（scale 1 → 0.92），同时像素点遮罩从底部往上爬升，像素点颜色 = section 2 背景色（跟随 dark/light 主题）。

**实现**：
- 滚动容器 200vh（section 1 sticky + 过渡区间）
- GSAP ScrollTrigger scrub
- Scale：section 1 card 的 transform: scale()
- Pixel mask：Canvas 或 CSS mask-image（径向圆点 pattern），通过改变 mask-position 从底向上覆盖
- 主题感知：CSS 变量 `--section2-bg`，light=white / dark=near-black

**文件**：`src/components/SectionTransition.tsx`

---

### 3. Section 2 背景：Pixel Trail + Gooey

**效果**：鼠标移动时方块亮起拖影，带 gooey 融合效果。

**参考**：
- https://www.fancycomponents.dev/docs/components/background/pixel-trail
- https://www.fancycomponents.dev/docs/components/filter/gooey-svg-filter

**实现**：
- Canvas 网格，鼠标经过的格子亮起并渐隐
- SVG gooey filter（feGaussianBlur + feColorMatrix）叠加在 canvas 上
- 主题感知：亮起颜色 light 模式为浅灰高光，dark 模式为柔白高光
- reduced-motion：静态网格纹理

**文件**：`src/components/PixelTrailBg.tsx`

---

### 4. Section 2 内容：自我介绍 + 像素化头像

**效果**：一句话介绍 + 头像图片（默认像素化，hover 时清晰化）。

**参考**：`demos/mc-pixelate-transition/app.js`（canvas drawImage 缩小再放大实现像素化）

**实现**：
- 头像用 canvas 渲染，默认 pixelSize=16（像素化）
- hover 时 GSAP 动画 pixelSize 16 → 1，ease steps(6)，duration 0.6s
- 离开时反向 1 → 16
- imageSmoothingEnabled=false 保持硬像素边缘

**文件**：`src/components/PixelAvatar.tsx`

---

### 5. Dark/Light 主题系统

**实现**：
- CSS 变量切换：`:root` vs `[data-theme="dark"]`
- Section 2 bg：`var(--color-section2-bg)` — light: `#FAF9F5` / dark: `#141413`
- Pixel dot mask 颜色同步
- Pixel trail 亮度同步

**文件**：`src/styles/new.css` 扩展

---

### 6. 素材：Shockwave 涟漪过渡（参考）

**参考**：
- https://www.reacticx.com/docs/components/shockwave（React Native / Expo / Skia 实现，卡片切换的水波扩散转场）
- `@react-three/postprocessing` 内建 `ShockWave` 效果（WebGL 后处理涟漪，可用于 3D 场景）

**用途**：
- 水波涟漪扩散的卡片/页面转场效果
- 已在项目引入 `@react-three/postprocessing`，场景中可直接挂载 3D 版 ShockWave

---

### 7. Section 2 素材：Fluid Glass（玻璃质感参考）

**参考**：
- https://www.reactbits.dev/components/fluid-glass

**用途**：
- 作为 Section 2 头像/简介卡片的玻璃折射、色差、lens/bar/cube 交互参考
- 先借鉴视觉语言，不直接引入依赖；原组件依赖 `three`、`@react-three/fiber`、`@react-three/drei`、`maath`

**落地建议**：
- lazy：优先复用现有 SVG/CSS 玻璃滤镜，只有需要真实 3D 折射时再引入 R3F 版本

---

## 执行顺序

| Step | 模块 | 依赖 |
|------|------|------|
| 1 | Section 2 骨架 + 背景色 + 主题变量 | 无 |
| 2 | Pixel Trail 背景 | Step 1 |
| 3 | Pixel Avatar（hover 清晰化） | Step 1 |
| 4 | Section 过渡（scale + pixel mask） | Step 1 |
| 5 | 浮动 Icons（视差） | 需确认图标来源 |

---

## 待决

- [ ] 3D 技术栈图标来源（3dicons.co / icons8 / 自己用 R3F 建模 / Spline）
- [ ] Section 2 具体文案
- [ ] 头像图片路径
- [ ] 过渡区间滚动距离（建议 150-200vh）
- [ ] Pixel dot 尺寸和密度
