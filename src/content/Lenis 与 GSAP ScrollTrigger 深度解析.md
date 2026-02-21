---
tags:
  - 前端
  - 动画
  - GSAP
  - Lenis
title: Lenis 与 GSAP ScrollTrigger 深度解析
description: 深入剖析 Lenis 平滑滚动与 GSAP ScrollTrigger 的工作原理，从浏览器原生滚动到虚拟滚动，从 scrollerProxy 配置到实战应用，带你彻底理解现代网页滚动动画的实现机制
dateCreated: 2026-01-30T00:50:00+08:00
dateModified: 2026-02-21T21:24:27+08:00
isPub: true
---

  

# Lenis 与 GSAP ScrollTrigger 深度解析

  

在现代网页设计中，流畅的滚动体验已经成为高品质网站的标配。本文将深入剖析 Lenis 平滑滚动库与 GSAP ScrollTrigger 的协作原理，带你从底层理解如何打造丝滑的滚动动画。

  

## 一、浏览器原生滚动 vs 虚拟滚动

  

### 原生滚动的局限

  

浏览器原生的滚动机制虽然简单直接，但存在明显的问题：

  

```javascript

// 浏览器原生滚动

window.scrollTo(0, 1000);  // 立即跳转，生硬

  

// 用户滚轮事件

document.addEventListener('wheel', (e) => {

  // 浏览器直接改变 scrollTop，没有缓动

  window.scrollY += e.deltaY;  

});

```

  

**主要问题：**

- ❌ 滚动是离散的、跳跃的

- ❌ 没有惯性效果

- ❌ 不同设备滚动速度差异大

- ❌ 无法自定义缓动曲线

  

### 虚拟滚动（Lenis）的核心思想

  

Lenis 通过"虚拟滚动"技术彻底改变了这一现状：

  

```

真实滚动：

┌─────────────┐

│  viewport   │ ← 固定不动（overflow: hidden）

└─────────────┘

      ↓

   内容通过 transform 移动

      ↓

┌─────────────┐

│   content   │ ← transform: translateY(-1000px)

│             │

│   (很长)    │

└─────────────┘

  

工作流程：

用户滚轮 → Lenis 监听 → 计算目标位置 → RAF 动画循环 → 更新 transform

```

  

关键点：页面实际上**没有滚动**，只是内容元素通过 `transform` 属性在移动，产生滚动的视觉效果。

  

## 二、Lenis 配置详解

  

### 基础配置示例

  

```javascript

const lenis = new Lenis({

  wrapper: document.querySelector(".smooth-wrapper"),

  content: document.querySelector(".smooth-content"),

  duration: 1.2,

  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),

  orientation: "vertical",

  gestureOrientation: "vertical",

  smoothWheel: true,

  wheelMultiplier: 1,

  smoothTouch: false,

  touchMultiplier: 2,

  infinite: false,

});

```

  

### 关键参数深度解析

  

#### 1. `wrapper` 与 `content`：双层结构的必要性

  

```html

<div class="smooth-wrapper">     ← wrapper（视口，overflow: hidden）

  <div class="smooth-content">   ← content（被移动的内容）

    <article>...</article>

    <article>...</article>

  </div>

</div>

```

  

**为什么需要两层？**

- `wrapper`：固定尺寸的视口容器，用户实际看到的区域

- `content`：真实内容容器，通过 `transform: translateY()` 移动

  

这种分离设计是虚拟滚动的基础，`wrapper` 负责"窗口"，`content` 负责"画布"。

  

#### 2. `duration: 1.2`：缓动响应时间

  

```javascript

// 注意：这不是"滚动到目标位置的总时间"！

// 而是"缓动响应速度"

  

// 举例：

用户滚轮滚动 100px

    ↓

Lenis 不会立即移动 100px

    ↓

而是在约 1.2 秒内"追赶"到目标位置

    ↓

产生平滑、有惯性的效果

```

  

数值越大，滚动越"慵懒"；越小，响应越灵敏。

  

#### 3. `easing` 函数：自定义缓动曲线

  

```javascript

easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))

//       ↑

//    t = 0 到 1 的进度值

  

// 这是一个"ease-out"曲线：

// t=0   → 0      (开始快)

// t=0.5 → 0.999  (中间快)

// t=1   → 1      (结束慢)

  

// 效果：滚动快速启动，然后自然减速停止

```

  

你可以使用任何缓动函数，比如：

- `t => t`：线性

- `t => t * t`：ease-in

- `t => 1 - Math.pow(1 - t, 3)`：ease-out cubic

  

#### 4. `smoothWheel: true`：惯性滚动的关键

  

```javascript

// false: 每次滚轮事件立即到达目标

document.addEventListener('wheel', (e) => {

  scrollTo(current + e.deltaY);  // 立即跳转，无缓动

});

  

// true: 滚轮事件累积速度，产生惯性

let velocity = 0;

document.addEventListener('wheel', (e) => {

  velocity += e.deltaY;  // 累积速度

  // RAF 循环中逐渐应用速度，形成惯性

});

```

  

开启后，滚动会有"物理感"，就像真实世界中推动一个物体。

  

### Lenis 内部运作机制

  

```javascript

// Lenis 内部简化版伪代码

class Lenis {

  raf(time) {

    // 1. 获取当前滚动位置

    const current = this.scroll;

    // 2. 获取目标位置（用户想滚动到哪里）

    const target = this.targetScroll;

    // 3. 计算差值并应用缓动

    const delta = target - current;

    const easedDelta = delta * this.easing(progress);

    this.scroll += easedDelta;

    // 4. 更新 DOM（核心！）

    this.content.style.transform = `translateY(-${this.scroll}px)`;

    // 5. 触发 scroll 事件供外部监听

    this.emit('scroll', { scroll: this.scroll });

    // 6. 继续下一帧

    requestAnimationFrame((t) => this.raf(t));

  }

}

```

  

**关键点：**

- 使用 `requestAnimationFrame` 保证 60fps 流畅度

- 每帧计算缓动，逐渐接近目标位置

- 通过 `transform` 而非 `scrollTop` 移动内容（GPU 加速）

  

## 三、ScrollTrigger 与虚拟滚动的冲突

  

### ScrollTrigger 的默认行为

  

```javascript

// ScrollTrigger 默认监听 window.scroll 事件

window.addEventListener('scroll', () => {

  const scrollY = window.scrollY;  // 获取滚动位置

  // 检查每个 trigger 元素

  triggers.forEach(trigger => {

    const rect = trigger.element.getBoundingClientRect();

    if (rect.top < window.innerHeight) {

      trigger.activate();  // 触发动画

    }

  });

});

```

  

### 核心问题：Lenis 不触发 scroll 事件

  

```javascript

// Lenis 的滚动是虚拟的：

content.style.transform = 'translateY(-1000px)';

//                        ↑

//                 DOM 没有真正滚动！

  

// 所以：

window.scrollY                  // 永远是 0 ❌

document.documentElement.scrollTop  // 永远是 0 ❌

  

// ScrollTrigger 完全检测不到滚动！

```

  

这就是为什么简单地结合 Lenis 和 ScrollTrigger 会失败的原因。

  

## 四、scrollerProxy：桥接两个世界

  

### 为什么需要 scrollerProxy？

  

`scrollerProxy` 是 GSAP 提供的 API，用于告诉 ScrollTrigger：

- 如何获取自定义滚动容器的滚动位置

- 如何设置滚动位置

- 容器的边界信息

  

### 完整配置示例

  

```javascript

ScrollTrigger.scrollerProxy(".smooth-wrapper", {

  // 1. 滚动位置的获取/设置

  scrollTop(value) {

    if (arguments.length) {

      // ScrollTrigger 想设置滚动位置

      lenis.scrollTo(value, { immediate: true });

    }

    // ScrollTrigger 想获取滚动位置

    return lenis.scroll;  // 返回 Lenis 的虚拟滚动位置

  },

  // 2. 容器边界信息

  getBoundingClientRect() {

    return {

      top: 0,

      left: 0,

      width: window.innerWidth,

      height: window.innerHeight,  // 视口高度

    };

  },

  // 3. 定位模式

  pinType: wrapper.style.transform ? "transform" : "fixed",

});

```

  

### 深度解析每个方法

  

#### `scrollTop(value)`：双向桥接

  

```javascript

scrollTop(value) {

  if (arguments.length) {

    // 有参数 = ScrollTrigger 想设置滚动位置

    lenis.scrollTo(value, { immediate: true });

    //                      ↑

    //         立即跳转，不要动画

    //        （ScrollTrigger 自己控制动画）

  }

  // 无参数 = ScrollTrigger 想获取当前位置

  return lenis.scroll;  // 返回虚拟滚动位置

}

  

// ScrollTrigger 内部会频繁调用：

const pos = scroller.scrollTop();  // 获取位置

scroller.scrollTop(1000);          // 设置位置（用于 pin 等功能）

```

  

#### `getBoundingClientRect()`：定义视口

  

```javascript

getBoundingClientRect() {

  // ScrollTrigger 需要知道"视口"的位置和尺寸

  return {

    top: 0,        // 容器顶部 = 视口顶部

    left: 0,

    width: window.innerWidth,

    height: window.innerHeight,  // 容器高度 = 视口高度

  };

}

  

// ScrollTrigger 用它来计算：

// "trigger 元素距离容器顶部的距离"

// "start/end 位置的具体像素值"

```

  

**为什么是固定值？**

因为 `.smooth-wrapper` 总是填满整个视口，所以边界就是窗口边界。

  

#### `pinType`：固定元素的定位方式

  

```javascript

pinType: wrapper.style.transform ? "transform" : "fixed"

  

// 用于 ScrollTrigger 的 pin 功能

// 如果容器使用了 transform，固定元素也要用 transform

// 否则用 CSS fixed 定位

```

  

### 同步更新机制

  

```javascript

// Lenis 每帧更新时，通知 ScrollTrigger

lenis.on("scroll", ({ scroll, limit }) => {

  ScrollTrigger.update();  // 强制 ScrollTrigger 重新计算所有触发器

});

  

// ScrollTrigger.update() 内部做什么？

// 1. 调用 scrollerProxy.scrollTop() 获取最新滚动位置

// 2. 重新计算所有 trigger 的状态（是否进入触发区）

// 3. 激活应该播放的动画

```

  

完整的同步代码：

  

```javascript

// 在 GSAP ticker 中运行 Lenis

gsap.ticker.add((time) => {

  lenis.raf(time * 1000);  // time 是秒，Lenis 需要毫秒

});

  

// 禁用 lag smoothing，避免帧率波动时的卡顿

gsap.ticker.lagSmoothing(0);

  

// 当 ScrollTrigger 刷新时，也刷新 Lenis

ScrollTrigger.addEventListener("refresh", () => lenis.resize());

```

  

## 五、实战：博客列表滚动动画

  

### 完整配置代码

  

```javascript

// 初始化动画

function initScrollAnimations() {

  const blogItems = document.querySelectorAll(".blog-item");

  const scroller = document.querySelector(".smooth-wrapper");

  

  blogItems.forEach((item, index) => {

    // 设置初始状态

    gsap.set(item, {

      y: 100,       // 向下偏移 100px

      opacity: 0,   // 完全透明

    });

  

    // 创建滚动触发动画

    gsap.to(item, {

      y: 0,           // 移动到原位

      opacity: 1,     // 完全不透明

      duration: 1.2,  // 动画持续 1.2 秒

      ease: "power3.out",  // 缓动函数

      scrollTrigger: {

        trigger: item,                 // 触发元素

        scroller: ".smooth-wrapper",   // 自定义滚动容器

        start: "top bottom-=100",      // 开始位置

        end: "top center",             // 结束位置

        toggleActions: "play none none none",

        markers: true,                 // 调试标记

      },

    });

  });

  

  ScrollTrigger.refresh();

}

```

  

### 参数详解

  

#### `trigger: item`

  

```

视口 (viewport)

┌─────────────────┐

│                 │

│                 │  ← item 的位置

└─────────────────┘

       ↑

  监听这个元素相对于视口的位置

```

  

#### `scroller: ".smooth-wrapper"`

  

```javascript

// 告诉 ScrollTrigger：

// "不要监听 window，监听 .smooth-wrapper"

  

// ScrollTrigger 会：

// 1. 查找之前定义的 scrollerProxy(".smooth-wrapper")

// 2. 使用 proxy 的 scrollTop() 获取滚动位置

// 3. 使用 proxy 的 getBoundingClientRect() 计算边界

```

  

#### `start: "top bottom-=100"`

  

```

语法: "[trigger位置] [scroller位置]"

  

"top bottom-=100" 含义：

┌──────────────────┐ ← scroller top

│                  │

│   viewport       │

│                  │

│                  │

├──────────────────┤ ← scroller bottom

│      ↑           │

│    100px         │

├──────────────────┤ ← bottom-100 (触发线)

│      ↑           │

│  当 trigger.top 到达这里时开始动画

│                  │

└──────────────────┘

  

// 效果：元素还没完全进入视口时，就提前开始动画

```

  

#### `end: "top center"`

  

```

"top center" 含义：

┌──────────────────┐ ← scroller top

│                  │

├──────────────────┤ ← scroller center (50% 高度)

│      ↑           │

│  trigger.top 到达这里时动画结束

│                  │

└──────────────────┘ ← scroller bottom

  

// 动画从 start 到 end 之间的滚动距离内完成

```

  

#### `toggleActions: "play none none none"`

  

```javascript

toggleActions: "onEnter onLeave onEnterBack onLeaveBack"

//              ↓       ↓        ↓           ↓

//           向下滚   向下滚    向上滚      向上滚

//           进入     离开      再次进入    再次离开

  

"play none none none" 含义：

- 向下滚动进入触发区：play（播放动画）

- 向下滚动离开触发区：none（保持状态）

- 向上滚动回到触发区：none（保持状态）

- 向上滚动离开触发区：none（保持状态）

  

// 效果：只在第一次进入时播放一次，之后保持结束状态

  

// 其他常用配置：

// "play reverse play reverse"  - 完全可逆的动画

// "play pause resume reset"    - 离开时暂停，回来时继续

```

  

## 六、完整的事件流程图

  

```

用户滚动鼠标滚轮

    ↓

Lenis 监听 wheel 事件

    ↓

Lenis 计算目标滚动位置

    ↓

Lenis RAF 循环（每帧）

    ↓

应用缓动，更新 lenis.scroll

    ↓

更新 content.style.transform = `translateY(-${scroll}px)`

    ↓

触发 lenis.on('scroll') 事件

    ↓

调用 ScrollTrigger.update()

    ↓

ScrollTrigger 调用 scrollerProxy.scrollTop()

    ↓

ScrollTrigger 获取最新虚拟滚动位置

    ↓

ScrollTrigger 遍历检查所有 trigger

    ↓

计算 trigger 元素的 getBoundingClientRect()

    ↓

判断是否进入触发区域

    ↓

触发区域内的动画开始播放

    ↓

GSAP 更新元素的 transform/opacity 等属性

    ↓

浏览器重绘（GPU 加速）

    ↓

用户看到流畅的滚动动画

```

  

## 七、常见问题与调试技巧

  

### 问题 1：动画完全不触发

  

**症状：** 滚动页面，元素没有任何动画效果。

  

**排查步骤：**

  

```javascript

// 1. 检查 scrollerProxy 是否配置

console.log(ScrollTrigger.getScrollFunc(".smooth-wrapper"));

// 应该返回一个函数，如果是 null，说明 proxy 未配置

  

// 2. 检查 Lenis 是否正常工作

lenis.on('scroll', (e) => {

  console.log('Lenis scroll:', e.scroll);  // 应该看到滚动值变化

});

  

// 3. 检查 ScrollTrigger 是否收到更新

lenis.on('scroll', () => {

  console.log('Updating ScrollTrigger');

  ScrollTrigger.update();  // 确认这行有执行

});

  

// 4. 检查 scroller 参数

gsap.to(".item", {

  scrollTrigger: {

    scroller: ".smooth-wrapper",  // 必须匹配 scrollerProxy 的选择器

  }

});

```

  

### 问题 2：markers 位置不正确

  

**症状：** 开启 `markers: true` 后，绿色/红色标记线位置异常。

  

**原因：** `getBoundingClientRect()` 返回值不正确。

  

**解决：**

  

```javascript

getBoundingClientRect() {

  return {

    top: 0,                    // 必须是 0

    left: 0,                   // 必须是 0

    width: window.innerWidth,  // 视口宽度

    height: window.innerHeight, // 视口高度（不是 wrapper.offsetHeight！）

  };

}

```

  

### 问题 3：滚动不流畅或卡顿

  

**可能原因：**

  

1. **RAF 同步问题**

  

```javascript

// 确保 Lenis 在 GSAP ticker 中运行

gsap.ticker.add((time) => {

  lenis.raf(time * 1000);  // 注意：time 是秒，需要转换为毫秒

});

  

// 禁用 lag smoothing

gsap.ticker.lagSmoothing(0);

```

  

2. **动画性能问题**

  

```javascript

// ❌ 不好：使用 width/height/top/left（触发 layout）

gsap.to(element, { width: 500, height: 300 });

  

// ✅ 好：只使用 transform 和 opacity（GPU 加速）

gsap.to(element, {

  x: 100,       // transform: translateX

  y: 50,        // transform: translateY

  scale: 1.2,   // transform: scale

  opacity: 0.5  // opacity

});

```

  

3. **过多的 ScrollTrigger 实例**

  

```javascript

// ❌ 不好：为每个元素创建独立的 ScrollTrigger

items.forEach(item => {

  gsap.to(item, {

    scrollTrigger: { trigger: item }

  });

});

  

// ✅ 更好：批量处理

gsap.to(".item", {

  y: 0,

  stagger: 0.1,  // 交错动画

  scrollTrigger: {

    trigger: ".container",  // 统一触发区域

  }

});

```

  

### 调试工具箱

  

```javascript

// 查看所有 ScrollTrigger 实例

ScrollTrigger.getAll().forEach((st, i) => {

  console.log(`Trigger ${i}:`, {

    trigger: st.trigger,

    start: st.start,

    end: st.end,

    scroller: st.scroller,

    progress: st.progress,  // 当前进度 0-1

  });

});

  

// 手动刷新所有 ScrollTrigger

ScrollTrigger.refresh();

  

// 查看当前滚动位置对比

console.log({

  lenis: lenis.scroll,        // Lenis 虚拟滚动位置

  window: window.scrollY,     // 应该是 0

  proxy: ScrollTrigger.getScrollFunc(".smooth-wrapper")(),  // 应该等于 lenis.scroll

});

  

// 杀死所有 ScrollTrigger（重新初始化时）

ScrollTrigger.getAll().forEach(st => st.kill());

```

  

## 八、性能优化建议

  

### 1. 使用 will-change 提示浏览器

  

```css

.blog-item {

  /* 提前告诉浏览器这些属性会变化 */

  will-change: transform, opacity;

}

  

/* 但不要滥用！只在必要时使用 */

/* 过多的 will-change 会消耗内存 */

```

  

### 2. 批量处理元素

  

```javascript

// ✅ 推荐：使用 stagger 批量动画

gsap.to(".blog-item", {

  y: 0,

  opacity: 1,

  stagger: {

    each: 0.1,        // 每个元素间隔 0.1 秒

    from: "start",    // 从第一个开始

  },

  scrollTrigger: {

    trigger: ".blog-list",

    start: "top bottom",

  }

});

```

  

### 3. 防抖/节流滚动事件

  

```javascript

// 如果你需要在滚动时执行自定义逻辑

let rafId;

lenis.on('scroll', (e) => {

  // 使用 RAF 防抖

  if (rafId) return;

  rafId = requestAnimationFrame(() => {

    // 你的逻辑

    console.log('Scroll position:', e.scroll);

    rafId = null;

  });

});

```

  

### 4. 懒加载动画

  

```javascript

// 只为视口附近的元素创建 ScrollTrigger

const observer = new IntersectionObserver((entries) => {

  entries.forEach(entry => {

    if (entry.isIntersecting) {

      // 元素接近视口时才创建动画

      createScrollAnimation(entry.target);

      observer.unobserve(entry.target);

    }

  });

}, { rootMargin: "200px" });

  

document.querySelectorAll('.blog-item').forEach(item => {

  observer.observe(item);

});

```

  

## 九、总结

  

Lenis + GSAP ScrollTrigger 的组合强大之处在于：

- **Lenis** 提供丝滑的虚拟滚动体验

- **ScrollTrigger** 提供强大的滚动动画能力

- **scrollerProxy** 桥接两者，让它们完美协作

  

关键要点：

1. 理解虚拟滚动的本质：内容通过 `transform` 移动，而非真实滚动

2. `scrollerProxy` 是连接 Lenis 和 ScrollTrigger 的关键

3. 性能优化：优先使用 `transform` 和 `opacity`，避免触发 layout

4. 调试技巧：善用 `markers`、console.log 和 ScrollTrigger API

  

掌握这些原理后，你就可以打造出媲美 Apple、Awwwards 获奖网站的高品质滚动体验了！

  

## 参考资源

  

- [Lenis 官方文档](https://lenis.studiofreight.com/)

- [GSAP ScrollTrigger 文档](https://greensock.com/docs/v3/Plugins/ScrollTrigger)

- [Lenis + ScrollTrigger 官方示例](https://codepen.io/GreenSock/pen/wvYJZNM)