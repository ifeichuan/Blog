import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const posts = [
  { title: '被 AI 逼疯的前端：从手搓流式打字机，到浏览器端跑 React', desc: 'SSE 替代伪流式、Unicode 多字节截断、Markdown 流式渲染「防抖」算法。', tags: ['流式渲染', 'SSE', 'React'] },
  { title: 'OpenClaw 架构解析：一个生产级 AI Agent 是如何设计的', desc: '渠道适配 / 网关 / Runner / Agentic Loop 五层服务，Claude tool use 三方 SDK 横向对比。', tags: ['Agent', 'Anthropic SDK', 'worktree'] },
  { title: 'Lenis 与 GSAP ScrollTrigger 深度解析', desc: '虚拟滚动原理：内容靠 transform 移动而非真滚动。', tags: ['动效', 'Lenis', 'GSAP'] },
]

export function Writing() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const items = ref.current.querySelectorAll<HTMLElement>('.post-item')
    const ctx = gsap.context(() => {
      items.forEach((item, i) => {
        gsap.from(item, {
          x: -60, opacity: 0,
          duration: .7,
          ease: 'back.out(1.2)',
          scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none none' },
          delay: i * .08
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="py-[16vh] px-6 max-w-[1080px] mx-auto">
      <p className="text-xs tracking-[.2em] uppercase text-[--tx3] mb-9">我写下来的一些东西</p>
      {posts.map((p, i) => (
        <div key={i} className="post-item flex justify-between items-start gap-5 py-7 border-b border-[--line] cursor-pointer hover:pl-3.5 transition-[padding] group">
          <div>
            <div className="text-[clamp(17px,2.2vw,22px)] font-semibold">{p.title}</div>
            <div className="text-[13.5px] text-[--tx2] mt-2 max-w-[680px]">{p.desc}</div>
            <div className="mt-2.5 flex gap-1.5 flex-wrap">
              {p.tags.map(t => <b key={t} className="font-normal text-[11px] text-[--tx2] bg-[--ui] border border-[--line] px-2 py-0.5 rounded-md">{t}</b>)}
            </div>
          </div>
          <span className="text-[--tx3] text-xl group-hover:text-[--orange] group-hover:translate-x-1 transition-all">↗</span>
        </div>
      ))}
    </section>
  )
}
