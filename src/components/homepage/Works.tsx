import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const projects = [
  { tag: '实习 · 求职平台', title: 'CareerTime 小程序', desc: 'pdf.js+Canvas 双层标注、rAF 分页渲染、豆包多模态 90%+、LangGraph 编排 AI 三链路、微信支付。', meta: ['Vue 3', '小程序', 'Hono', 'LangGraph'] },
  { tag: '系统设计 · Agent UI', title: 'Eyrie Session UI', desc: '桌面端 Agent 会话：message parts、ToolGroup、ApprovalTicket、流式+工具渲染。UI-only 架构。', meta: ['React', 'Electron', 'streaming'] },
  { tag: '语音 · Tauri', title: 'VoiceStream', desc: 'Mac 上用语音输入文字、润色内容、后台执行 Agent 任务。ShaderOrb 声波球、实时 ASR。', meta: ['Tauri 2', 'Rust', 'WebGL', 'STT'] },
  { tag: '产品设计 · PRD', title: 'Hawk / Recap', desc: '跨 Agent 的注意力恢复层——管「人」的上下文，不管 Agent 本身。', meta: ['Agent', '产品', '认知线程'] },
]

export function Works() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const cards = ref.current.querySelectorAll<HTMLElement>('.work-card')
    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.from(card, {
          x: 80, opacity: 0,
          duration: .8,
          ease: 'back.out(1.4)',
          scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
          delay: i * .1
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="py-[20vh] px-6 max-w-[1080px] mx-auto">
      <p className="text-xs tracking-[.2em] uppercase text-[--tx3] mb-10">我做过的真东西</p>
      <div className="flex gap-5 overflow-visible flex-wrap">
        {projects.map((p, i) => (
          <article key={i} className="work-card flex-1 min-w-[280px] border border-[--line] rounded-2xl p-7 bg-[--bg2] relative overflow-hidden group cursor-pointer" style={{ perspective: '800px' }}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              const x = (e.clientX - r.left) / r.width - .5
              const y = (e.clientY - r.top) / r.height - .5
              e.currentTarget.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(8px)`
            }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = '' }}
          >
            <div className="text-[11px] tracking-[.1em] text-[--tx3] uppercase">{p.tag}</div>
            <h3 className="text-xl font-semibold mt-2.5 mb-2.5 relative z-10">{p.title}</h3>
            <p className="text-sm text-[--tx2] relative z-10 leading-relaxed">{p.desc}</p>
            <div className="mt-4 flex flex-wrap gap-1.5 relative z-10">
              {p.meta.map(m => <span key={m} className="text-[10.5px] text-[--tx2] bg-[--ui] border border-[--line] px-2 py-0.5 rounded-md">{m}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
