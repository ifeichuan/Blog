import { useEffect, useRef } from 'react'

export function Footer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) ref.current!.classList.add('!blur-0', '!opacity-100')
    }, { threshold: .3 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <section className="border-t border-[--line] py-[14vh] px-6 max-w-[1080px] mx-auto">
      <div ref={ref} className="blur-[12px] opacity-30 transition-all duration-[1.2s]">
        <h2 className="text-[clamp(28px,4.5vw,48px)] font-bold tracking-tight leading-tight">
          想聊聊？<br/>或者直接看我的代码。
        </h2>
        <div className="flex flex-wrap gap-2 mt-8">
          {['Vue 3 / Nuxt', 'React / Next', 'Electron', 'TypeScript', 'GSAP', 'Three.js', 'Astro', 'AI SDK / MCP', 'LangGraph', 'Tauri', 'Rust'].map(t =>
            <span key={t} className="text-xs text-[--tx2] bg-[--bg2] border border-[--line] px-3 py-1.5 rounded-lg">{t}</span>
          )}
        </div>
        <p className="text-sm text-[--tx2] mt-6 mb-6">最近在给字节开源的 OpenViking（Agent 数据库）做前端和网页 Agent 部分的贡献。</p>
        <div className="flex gap-3.5 flex-wrap">
          <a href="https://github.com/feichuans" className="text-sm border border-[--line] px-5 py-3 rounded-xl hover:border-[--orange] hover:text-[--orange] transition-colors">GitHub</a>
          <a href="mailto:feichuan05@gmail.com" className="text-sm border border-[--line] px-5 py-3 rounded-xl hover:border-[--orange] hover:text-[--orange] transition-colors">邮箱</a>
        </div>
      </div>
    </section>
  )
}
