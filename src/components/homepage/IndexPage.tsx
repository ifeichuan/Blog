import { useCallback, useEffect, useRef, useState } from 'react'
import { HeroSection } from './HeroSection'
import { FpsMeter } from './FpsMeter'
import { SectionTwo } from './SectionTwo'
import { FixedVisualStage } from './FixedVisualStage'
import { COLOR_SCHEMES } from '../effects/DappledLight'

const schemeNames = Object.keys(COLOR_SCHEMES) as (keyof typeof COLOR_SCHEMES)[]

export function IndexPage() {
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
  const nextScheme = useCallback(() => setSchemeIndex((index) => (index + 1) % schemeNames.length), [])

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

  return (
    <>
      <main ref={visualRangeRef} className="relative flex min-h-screen flex-col items-center gap-3 py-3">
        <FixedVisualStage
          play={introExiting}
          scheme={currentScheme}
          triggerRef={visualRangeRef}
          onReady={handleBackgroundReady}
          onMouseAssetsReady={handleMouseAssetsReady}
        />
        <HeroSection
          play={introExiting}
          schemeName={currentName}
          onNextScheme={nextScheme}
        />
        <SectionTwo />
      </main>
      <FpsMeter />
    </>
  )
}
