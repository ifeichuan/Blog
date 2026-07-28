import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// 横向 pinned：纵向滚动映射横向位移，每卡微场景由 --cp (0~1) 驱动
// 项目数据沿用 Works.tsx（v3 迭代）
type Scene = 'orb' | 'chat' | 'pdf' | 'quote'
type Project = {
  tag: string
  title: string
  desc: string
  beat: string
  cap: string
  scene: Scene
  accent: string
}

const PROJECTS: Project[] = [
  {
    tag: '01 · 实习 · 求职平台 · AI',
    title: 'CareerTime 小程序',
    desc: 'pdf.js + Canvas 双层标注、rAF 分页渲染、豆包多模态 90%+、LangGraph 编排 AI 三链路、微信支付。',
    beat: '滚动推进：标注 → 编辑 → AI 生成',
    cap: 'PDF 标注 + 简历编辑器 · 实机 demo 接入位',
    scene: 'pdf',
    accent: 'var(--green)',
  },
  {
    tag: '02 · 系统设计 · Agent UI · 流式',
    title: 'Eyrie Session UI',
    desc: '桌面端 Agent 会话：message parts、ToolGroup、ApprovalTicket、流式 + 工具渲染。UI-only 架构。',
    beat: '滚动推进：消息流入 → 工具展开 → 审批',
    cap: '流式对话 + 工具调用 · 实机 demo 接入位',
    scene: 'chat',
    accent: 'var(--blue)',
  },
  {
    tag: '03 · 语音 · Tauri · WebGL',
    title: 'VoiceStream',
    desc: 'Mac 上用语音输入文字、润色内容、后台执行 Agent 任务。ShaderOrb 声波球、实时 ASR。',
    beat: '滚动推进：静默 → 说话 → 响应',
    cap: 'ShaderOrb 声波球 · 实机 demo 接入位',
    scene: 'orb',
    accent: 'var(--orange)',
  },
  {
    tag: '04 · 产品设计 · PRD',
    title: 'Hawk / Recap',
    desc: '跨 Agent 的注意力恢复层——管「人」的上下文，不管 Agent 本身。',
    beat: '滚动推进：文字逐段显影',
    cap: 'PRD · 认知线程 · 文档接入位',
    scene: 'quote',
    accent: 'var(--purple)',
  },
]

function DemoScene({ scene }: { scene: Scene }) {
  switch (scene) {
    case 'orb':
      return (
        <div className="scene scene-orb" aria-hidden="true">
          <i className="orb" />
          <div className="bars">
            {[0.35, 0.8, 0.55, 1, 0.7, 0.45, 0.9].map((f, i) => (
              <i key={i} style={{ '--f': f, '--ph': i } as React.CSSProperties} />
            ))}
          </div>
        </div>
      )
    case 'chat':
      return (
        <div className="scene scene-chat" aria-hidden="true">
          <div className="bub user" style={{ '--t': 0.08 } as React.CSSProperties}>
            帮我看下这个 PR 的风险点
          </div>
          <div className="bub" style={{ '--t': 0.3 } as React.CSSProperties}>
            正在读取 diff…
          </div>
          <div className="bub tool" style={{ '--t': 0.52 } as React.CSSProperties}>
            ⚙ ToolGroup · Read × 3
          </div>
          <div className="bub ok" style={{ '--t': 0.74 } as React.CSSProperties}>
            ✓ ApprovalTicket · 已批准
          </div>
        </div>
      )
    case 'pdf':
      return (
        <div className="scene scene-pdf" aria-hidden="true">
          <i className="pdf-line" style={{ '--t': 0.05, '--w': '92%' } as React.CSSProperties} />
          <i className="pdf-line" style={{ '--t': 0.15, '--w': '78%' } as React.CSSProperties} />
          <i className="pdf-line hl" style={{ '--t': 0.3, '--w': '85%' } as React.CSSProperties} />
          <i className="pdf-line" style={{ '--t': 0.45, '--w': '60%' } as React.CSSProperties} />
          <span className="pdf-box" style={{ '--t': 0.62 } as React.CSSProperties}>
            AI 标注
          </span>
        </div>
      )
    case 'quote':
      return (
        <div className="scene scene-quote" aria-hidden="true">
          {['你上次想到哪了？', 'Agent 记得任务，', '没人记得你的思路。'].map((line, i) => (
            <span key={i} className="q-line" style={{ '--t': 0.1 + i * 0.25 } as React.CSSProperties}>
              {line}
            </span>
          ))}
        </div>
      )
  }
}

export function WorksV4() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    const cards = Array.from(track.children) as HTMLElement[]

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add(
        '(min-width: 761px) and (prefers-reduced-motion: no-preference)',
        () => {
          let shift = 0
          const st = ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: () => {
              shift = Math.max(0, track.scrollWidth - window.innerWidth)
            },
            onUpdate: (self) => {
              // 末尾留 10% 停留缓冲
              const t = Math.min(1, self.progress / 0.9)
              gsap.set(track, { x: -t * shift })
              if (idxRef.current) {
                idxRef.current.textContent = String(
                  Math.min(cards.length, Math.floor(t * cards.length) + 1),
                ).padStart(2, '0')
              }
              cards.forEach((c, i) =>
                c.style.setProperty(
                  '--cp',
                  Math.min(1, Math.max(0, t * cards.length - i)).toFixed(3),
                ),
              )
            },
          })
          return () => st.kill()
        },
      )
      mm.add('(max-width: 760px), (prefers-reduced-motion: reduce)', () => {
        gsap.set(track, { x: 0 })
        cards.forEach((c) => c.style.setProperty('--cp', '1'))
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="v4-works" aria-label="Works">
      <div className="v4-pin v4-works-pin">
        <header className="works-head">
          <span className="v4-eyebrow">craft</span>
          <span className="works-note">纵向滚动 → 横向前进 · demo 均为实机接入位</span>
          <span className="counter">
            <b ref={idxRef}>01</b>&nbsp;/&nbsp;{String(PROJECTS.length).padStart(2, '0')}
          </span>
        </header>
        <div className="track" ref={trackRef}>
          {PROJECTS.map((p) => (
            <article
              key={p.title}
              className="project"
              style={{ '--accent': p.accent } as React.CSSProperties}
            >
              <div className="info">
                <p className="k">{p.tag}</p>
                <h3>{p.title}</h3>
                <p className="d">{p.desc}</p>
                <p className="beat">{p.beat}</p>
              </div>
              <div className="demo-slot">
                <DemoScene scene={p.scene} />
                <span className="cap">{p.cap}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
