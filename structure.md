# Project Structure

```
src/
├── actions/            # Astro actions (umami 统计)
├── assets/             # 静态资源（图片、音频、SVG）
├── components/
│   ├── about/          # About 页面组件
│   ├── blog/           # 博客相关（BlogList、TOC、ReaderControls、FormattedDate、AnnouncementBar）
│   ├── effects/        # 视觉效果原语（BlurText*、DappledLight、Noise、SignatureDraw、PixelMouse3D...）
│   ├── fancy/          # 花式文本效果
│   ├── homepage/       # 首页专属（Hero、SectionTwo、IndexPage、StaggeredMenu...）
│   ├── hooks/          # 通用 hooks
│   ├── lab/            # 实验性 demo 组件（ChainTests、InfiniteMenu、LenisFeelDemo、InterfaceFeelDemos）
│   ├── layout/         # 站点骨架（BaseHead、Nav、Header、Footer、Mouse、Intro、OnDevMode）
│   ├── texture-lab/    # WebGL 纹理引擎
│   ├── tools/          # 小工具
│   └── ui/             # 通用 UI 原语
├── content/            # 博客文章（Obsidian 风格分类）
├── entries/            # 客户端入口（homepage dynamic import）
├── hooks/              # 全局 hooks
├── layouts/            # Astro 布局（Base、BlogPost、MobileLayout）
├── lib/                # 工具函数
├── pages/
│   ├── _archive/       # 归档旧版本（不生成路由）
│   ├── blogs/          # 博客列表 + 详情
│   ├── labs/           # 所有实验性 demo 页面
│   │   └── lenis/     # Lenis 滚动对比
│   └── tools/          # 工具页面
└── styles/             # 全局样式

/（根目录）
├── _archive/           # 归档的原型文件（prototype-*.html、CRITIQUE.md、PLAN-section2.md）
├── demos/              # 独立 HTML demo（不走 Astro 构建）
├── docs/               # 设计规格文档
├── public/             # 静态公共资源
├── src/                # 源码
└── ...配置文件
```
