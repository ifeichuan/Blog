import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// sticky 谢幕：主内容滑过后露出；巨型签名水印视差浮起
// 文案沿用 Footer.tsx（v3 迭代）
const TAGS = [
  'Vue 3 / Nuxt',
  'React / Next',
  'Electron',
  'TypeScript',
  'GSAP',
  'Three.js',
  'Astro',
  'AI SDK / MCP',
  'LangGraph',
  'Tauri',
  'Rust',
]

export function FooterV4() {
  const ref = useRef<HTMLElement>(null)
  const ghostRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const footer = ref.current
    const ghost = ghostRef.current
    if (!footer || !ghost) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const els = footer.querySelectorAll<HTMLElement>('.f-stage > *')
        // footer 是 sticky（自身位置测量不可靠）→ 用前一张卡的 bottom 触发，
        // 揭示窗口 = 卡片滑走的最后一个视口
        const st = ScrollTrigger.create({
          trigger: (footer.previousElementSibling as HTMLElement) ?? footer,
          start: 'bottom bottom',
          end: () => `+=${window.innerHeight}`,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress
            els.forEach((el, i) => el.classList.toggle('in', p > 0.25 + i * 0.1))
            // ghost 随揭示淡入：footer 全程 sticky 在视口底，不门控会在上方透明区提前穿帮
            gsap.set(ghost, { yPercent: (1 - p) * 30, autoAlpha: Math.min(1, p * 2) })
          },
        })
        return () => st.kill()
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        footer
          .querySelectorAll<HTMLElement>('.f-stage > *')
          .forEach((el) => el.classList.add('in'))
        gsap.set(ghost, { autoAlpha: 1 })
      })
    }, footer)
    return () => ctx.revert()
  }, [])

  return (
    <footer ref={ref} className="v4-footer" aria-label="Contact">
      <p className="f-ghost" aria-hidden="true" ref={ghostRef}>
        feichuan
      </p>
      <div className="f-stage">
        <h2 className="f-title">
          想聊聊？
          <br />
          或者直接看我的代码。
        </h2>
        <p className="f-now">最近在给字节开源的 OpenViking（Agent 数据库）做前端和网页 Agent 部分的贡献。</p>
        <nav className="f-links">
          <a href="https://github.com/feichuans">GitHub</a>
          <a href="mailto:feichuan05@gmail.com">邮箱</a>
          <a href="#">简历</a>
        </nav>
        <p className="f-tags">
          {TAGS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
        <p className="f-copy">© 2026 Feichuan</p>
      </div>
    </footer>
  )
}
