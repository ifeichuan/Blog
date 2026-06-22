import { useEffect, useRef } from 'react'

const items = ['Creative Frontend', '交互设计', 'Agent UI', 'VoiceStream', 'Eyrie', 'CareerTime']

export function ScrollMarquee() {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const lastScrollRef = useRef(0)
  const velocityRef = useRef(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf: number
    const loop = () => {
      const diff = window.scrollY - lastScrollRef.current
      lastScrollRef.current = window.scrollY
      velocityRef.current += (diff - velocityRef.current) * .1
      posRef.current -= 1.5 + velocityRef.current * .8
      const trackW = track.scrollWidth / 2
      if (Math.abs(posRef.current) >= trackW) posRef.current = 0
      track.style.transform = `translateX(${posRef.current}px)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="overflow-hidden whitespace-nowrap py-[6vh] border-y border-[--line]">
      <div ref={trackRef} className="inline-flex will-change-transform">
        {[...items, ...items].map((t, i) => (
          <span key={i} className={`text-[clamp(40px,7vw,80px)] font-extrabold tracking-tighter px-10 ${i % 2 ? 'text-[--orange]' : 'text-[--tx3] [-webkit-text-stroke:1px_var(--line)]'}`}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
