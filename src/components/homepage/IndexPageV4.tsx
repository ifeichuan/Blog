import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HeroSection } from './HeroSection'
import { FpsMeter } from './FpsMeter'
import { FixedVisualStage } from './FixedVisualStage'
import { COLOR_SCHEMES } from '../effects/DappledLight'
import { ManifestoV4 } from './v4/ManifestoV4'
import { MarqueeV4 } from './v4/MarqueeV4'
import { WorksV4 } from './v4/WorksV4'
import { LabStrip } from './v4/LabStrip'
import { WritingV4 } from './v4/WritingV4'
import { FooterV4 } from './v4/FooterV4'
import { PixelTrailV4 } from './v4/PixelTrailV4'

// v4：在 IndexPage 基础上接入新叙事
// Hero(现有) → Manifesto(zoom-out card) → Marquee → Works(横向) → Lab → Writing → Sticky Footer
const schemeNames = Object.keys(COLOR_SCHEMES) as (keyof typeof COLOR_SCHEMES)[]

export function IndexPageV4() {
  const [introExiting, setIntroExiting] = useState(false)
  const [backgroundReady, setBackgroundReady] = useState(false)
  const [mouseAssetsReady, setMouseAssetsReady] = useState(false)
  const [schemeIndex, setSchemeIndex] = useState(0)
  const readyDispatchedRef = useRef(false)
  const visualRangeRef = useRef<HTMLElement>(null)
  const handleBackgroundReady = useCallback(() => setBackgroundReady(true), [])
  const handleMouseAssetsReady = useCallback(() => setMouseAssetsReady(true), [])
  const currentName = schemeNames[schemeIndex]
  const currentScheme = COLOR_SCHEMES[currentName]
  const nextScheme = useCallback(
    () => setSchemeIndex((index) => (index + 1) % schemeNames.length),
    [],
  )

  useEffect(() => {
    const handleIntroExit = () => setIntroExiting(true)
    window.addEventListener('Intro:exit', handleIntroExit, { once: true })
    window.addEventListener('Intro:end', handleIntroExit, { once: true })
    if (document.documentElement.dataset.introEnded === 'true') handleIntroExit()

    return () => {
      window.removeEventListener('Intro:exit', handleIntroExit)
      window.removeEventListener('Intro:end', handleIntroExit)
    }
  }, [])

  useEffect(() => {
    if (!backgroundReady || !mouseAssetsReady || readyDispatchedRef.current) return
    readyDispatchedRef.current = true
    document.documentElement.dataset.homepageReady = 'true'
    window.dispatchEvent(new Event('homepage:ready'))
  }, [backgroundReady, mouseAssetsReady])

  // 字体分块加载会改变布局 → 让 ScrollTrigger 重测，避免 pin 位错位
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    const t = setTimeout(() => ScrollTrigger.refresh(), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <main
        ref={visualRangeRef}
        className="relative flex min-h-screen flex-col items-center gap-3 py-3"
      >
        <FixedVisualStage
          play={introExiting}
          scheme={currentScheme}
          triggerRef={visualRangeRef}
          onReady={handleBackgroundReady}
          onMouseAssetsReady={handleMouseAssetsReady}
        />
        {/* 像素尾迹：浮在变化后的 canvas 上、卡片之下 */}
        <PixelTrailV4 />
        <HeroSection
          play={introExiting}
          schemeName={currentName}
          onNextScheme={nextScheme}
        />
        {/* v4 叙事流：每个 section 都是一张浮在 canvas 上的 card（homepage-card 范式），
            缝隙与圆角让 fixed z-0 的 DappledLight 全程透出 */}
        <div className="v4-flow">
          <ManifestoV4 />
          <MarqueeV4 />
          <WorksV4 />
          <LabStrip />
          <WritingV4 />
          <FooterV4 />
        </div>
      </main>
      <FpsMeter />
    </>
  )
}
