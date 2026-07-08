# Plan: 为新首页添加 Staggered Menu + Gooey 效果

## 概述

在 `src/components/homepage/` 中新建 `Menu.tsx`，实现一个固定在右上角的菜单按钮，点击后展开全屏侧边导航面板，使用 GSAP 做 staggered 入场动画，结合已有的 `GooeyFilter` 组件实现流体 gooey 过渡效果。

## 设计方案

### 视觉设计
- 按钮位于右上角，fixed 定位，z-index 高于所有内容
- 按钮为一个 + 图标 + "Menu" 文字，打开后旋转为 × + "Close"
- 面板从右侧滑入，宽度 `clamp(300px, 40vw, 480px)`，移动端全屏
- 面板底色 `--bg2` (#1C1B1A)，配合 gooey blob 背景装饰
- 菜单项: Posts、Labs、Resumes + 一个回到旧版首页的链接
- 社交链接区域放在底部: GitHub / Email

### Gooey 效果
- 在面板打开过程中，2-3 个 prelayer 色块（使用 `--orange`、`--blue`）从右侧 stagger 滑入
- 这些色块应用 SVG gooey filter，使相邻色块产生融合粘连的流体效果
- 复用项目中已有的 `GooeyFilter` 组件

### GSAP 动画序列（Open）
1. prelayer 色块从 `xPercent: 100` → `0`，stagger 0.07s，duration 0.5s，ease `power4.out`
2. 主面板 `xPercent: 100` → `0`，duration 0.65s，ease `power4.out`
3. 菜单项文字 `yPercent: 140, rotate: 10` → `yPercent: 0, rotate: 0`，stagger 0.1s，duration 1s，ease `power4.out`
4. 社交链接 `y: 25, opacity: 0` → `y: 0, opacity: 1`

### GSAP 动画序列（Close）
- 所有层 + 面板同时 `xPercent: 100`，duration 0.32s，ease `power3.in`
- onComplete 重置所有子元素状态

### 按钮动画
- 图标：两条线组成 +，打开时整体旋转 225° 变成 ×
- 文字：在 "Menu" / "Close" 之间做 yPercent 滚动切换

## 文件变更

1. **新建** `src/components/homepage/Menu.tsx` — 完整的 StaggeredMenu 组件
2. **修改** `src/components/homepage/index.tsx` — 引入 Menu 组件，放在 ScrollProvider 内部最前面

## 菜单项数据

```ts
const menuItems = [
  { label: 'Posts', href: '/blogs' },
  { label: 'Labs', href: '/labs' },
  { label: 'Resumes', href: '/resumes' },
]
const socialItems = [
  { label: 'GitHub', href: 'https://github.com/feichuan' },
  { label: 'Email', href: 'mailto:contact@feichuan.dev' },
]
```

## 技术要点
- 使用 `useLayoutEffect` 设置 GSAP 初始状态
- 使用 refs 管理 timeline 实例，防止内存泄漏
- 面板打开时 `overflow-y: auto` 允许内容滚动
- 点击面板外部自动关闭
- 移动端响应式：面板改为全屏宽度
- 样式完全用 Tailwind + inline style，不新建 CSS 文件
