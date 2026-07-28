import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// 文章数据沿用 Writing.tsx（v3 迭代）
const POSTS = [
  {
    title: '被 AI 逼疯的前端：从手搓流式打字机，到浏览器端跑 React',
    desc: 'SSE 替代伪流式、Unicode 多字节截断、Markdown 流式渲染「防抖」算法。',
    tags: ['流式渲染', 'SSE', 'React'],
  },
  {
    title: 'OpenClaw 架构解析：一个生产级 AI Agent 是如何设计的',
    desc: '渠道适配 / 网关 / Runner / Agentic Loop 五层服务，Claude tool use 三方 SDK 横向对比。',
    tags: ['Agent', 'Anthropic SDK', 'worktree'],
  },
  {
    title: 'Lenis 与 GSAP ScrollTrigger 深度解析',
    desc: '虚拟滚动原理：内容靠 transform 移动而非真滚动。',
    tags: ['动效', 'Lenis', 'GSAP'],
  },
]

export function WritingV4() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const items = root.querySelectorAll<HTMLElement>('.post')
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        items.forEach((item, i) => {
          gsap.from(item, {
            x: -48,
            opacity: 0,
            duration: 0.7,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: item,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
            delay: i * 0.08,
          })
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="v4-writing" aria-label="Writing">
      <p className="v4-eyebrow">writing — 把原理写清楚</p>
      {POSTS.map((p, i) => (
        <a key={i} className="post" href="#">
          <span className="no">{String.fromCharCode(97 + i)}</span>
          <span className="body">
            <span className="t">{p.title}</span>
            <span className="d">{p.desc}</span>
            <span className="tags">
              {p.tags.map((t) => (
                <b key={t}>{t}</b>
              ))}
            </span>
          </span>
          <span className="arrow">↗</span>
        </a>
      ))}
    </section>
  )
}
