import { useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import { COLOR_SCHEMES } from './DappledLight'
import { HeroContent } from './HeroContent'
import { HeroMouseLayer, HeroScene } from './HeroScene'

const schemeNames = Object.keys(COLOR_SCHEMES) as (keyof typeof COLOR_SCHEMES)[]

type HeroSectionProps = {
  play: boolean
  onBackgroundReady?: () => void
  onMouseAssetsReady?: () => void
}

export function HeroSection({ play, onBackgroundReady, onMouseAssetsReady }: HeroSectionProps) {
  const [contentPlay, setContentPlay] = useState(false)
  const [mousePlay, setMousePlay] = useState(false)
  const [schemeIndex, setSchemeIndex] = useState(0)
  const reduced = useReducedMotion()
  const bgRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<HTMLDivElement>(null)

  const currentName = schemeNames[schemeIndex]
  const currentScheme = COLOR_SCHEMES[currentName]
  const next = () => setSchemeIndex((i) => (i + 1) % schemeNames.length)

  useLayoutEffect(() => {
    const bg = bgRef.current
    const content = contentRef.current
    const mouse = mouseRef.current
    if (!bg || !content || !mouse) return
    const reduce = reduced ?? false

    if (!play) {
      if (!reduce) {
        gsap.set(bg, { filter: 'blur(18px)', opacity: 0.5, y: -30, scale: 1.04 })
        gsap.set(content, { opacity: 0, y: 20 })
        gsap.set(mouse, { opacity: 0, filter: 'blur(12px)', y: 40 })
      }
      return
    }

    if (reduce) {
      setContentPlay(true)
      setMousePlay(true)
      return
    }
    gsap.set(bg, { filter: 'blur(18px)', opacity: 0.5, y: -30, scale: 1.04 })
    gsap.set(content, { opacity: 0, y: 20 })
    gsap.set(mouse, { opacity: 0, filter: 'blur(12px)', y: 40 })
    // 一个 GSAP timeline 统一编排：背景就位 → 内容 → 鼠标，错开 200ms
    const tl = gsap.timeline()
    tl.to(bg, { filter: 'blur(0px)', opacity: 1, y: 0, scale: 1, duration: 1.8, ease: 'power3.out' }, 0)
      .call(() => setContentPlay(true), [], 1.8)
      .to(content, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.8)
      .call(() => setMousePlay(true), [], 2.0)
      .to(mouse, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.6, ease: 'power2.out' }, 2.0)
    return () => {
      tl.kill()
    }
  }, [play, reduced])

  return (
    <section className="homepage-card relative z-1">
      <div ref={bgRef} className="absolute inset-0 z-0">
        <HeroScene scheme={currentScheme} onReady={onBackgroundReady} />
      </div>
      <div ref={mouseRef} className="absolute inset-0 z-[2] hidden md:block">
        <HeroMouseLayer play={mousePlay} onReady={onMouseAssetsReady} />
      </div>
      <div ref={contentRef} className="relative z-10 h-full flex items-center justify-center text-near-black">
        <HeroContent play={contentPlay} />
      </div>
      <button
        onClick={next}
        className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/60 backdrop-blur-sm border border-black/10 hover:bg-white/80 transition-colors"
      >
        {currentName}
      </button>
    </section>
  )
}
