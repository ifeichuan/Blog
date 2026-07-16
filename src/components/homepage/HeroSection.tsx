import { useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import { HeroContent } from './HeroContent'

type HeroSectionProps = {
  play: boolean
  schemeName: string
  onNextScheme: () => void
}

export function HeroSection({ play, schemeName, onNextScheme }: HeroSectionProps) {
  const [contentPlay, setContentPlay] = useState(false)
  const reduced = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    const reduce = reduced ?? false

    if (!play) {
      if (!reduce) {
        gsap.set(content, { opacity: 0, y: 20 })
      }
      return
    }

    if (reduce) {
      setContentPlay(true)
      return
    }
    gsap.set(content, { opacity: 0, y: 20 })
    const tl = gsap.timeline()
    tl.call(() => setContentPlay(true), [], 1.8)
      .to(content, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.8)
    return () => {
      tl.kill()
    }
  }, [play, reduced])

  return (
    <section className="homepage-card relative z-1">
      <div ref={contentRef} className="relative z-10 h-full flex items-center justify-center text-near-black">
        <HeroContent play={contentPlay} />
      </div>
      <button
        onClick={onNextScheme}
        className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/60 backdrop-blur-sm border border-black/10 hover:bg-white/80 transition-colors"
      >
        {schemeName}
      </button>
    </section>
  )
}
