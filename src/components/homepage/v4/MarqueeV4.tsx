import { useEffect, useRef } from 'react'

// 滚动速度驱动的换场跑马灯（逻辑沿用 ScrollMarquee.tsx，样式走 v4 CSS 层）
const ITEMS = ['Creative Frontend', '交互设计', 'Agent UI', 'Motion', 'WebGL']

export function MarqueeV4() {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const lastScrollRef = useRef(0)
  const velocityRef = useRef(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf: number
    const loop = () => {
      const diff = window.scrollY - lastScrollRef.current
      lastScrollRef.current = window.scrollY
      velocityRef.current += (diff - velocityRef.current) * 0.1
      posRef.current -= 1.2 + Math.abs(velocityRef.current) * 0.6
      const trackW = track.scrollWidth / 2
      if (trackW > 0 && Math.abs(posRef.current) >= trackW) posRef.current = 0
      track.style.transform = `translateX(${posRef.current}px)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="v4-marquee" aria-hidden="true">
      <div className="mq-clip">
        <div className="mq-track" ref={trackRef}>
          {[...ITEMS, ...ITEMS].map((t, i) => (
            <span key={i} className={i % 2 ? 'mq-alt' : undefined}>
              {t}&nbsp;—&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
