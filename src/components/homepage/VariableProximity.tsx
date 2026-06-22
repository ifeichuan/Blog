import { useEffect, useRef } from 'react'

const text = 'CREATIVE FRONTEND'

export function VariableProximity() {
  const containerRef = useRef<HTMLDivElement>(null)
  const spansRef = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      spansRef.current.forEach(s => {
        const r = s.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2)
        const t = Math.max(0, 1 - dist / 200)
        s.style.transform = `scale(${1 + t * .3}) translateY(${-t * 8}px)`
        s.style.opacity = String(.4 + t * .6)
        s.style.filter = `blur(${(1 - t) * 2}px)`
      })
    }
    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [])

  return (
    <section ref={containerRef} className="py-[10vh] px-6 max-w-[1080px] mx-auto text-center">
      <div className="inline text-[clamp(36px,6vw,72px)] font-extrabold tracking-tight leading-tight">
        {text.split('').map((ch, i) => (
          <span key={i} ref={el => { if (el) spansRef.current[i] = el }}
            className="inline-block transition-[transform,opacity,filter] duration-150 will-change-transform">
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </div>
    </section>
  )
}
