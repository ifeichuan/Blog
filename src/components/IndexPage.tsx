import { useCallback, useEffect, useRef, useState } from 'react'
import { HeroSection } from './HeroSection'
import { FpsMeter } from './FpsMeter'

export function IndexPage() {
  const [introExiting, setIntroExiting] = useState(false)
  const [backgroundReady, setBackgroundReady] = useState(false)
  const [mouseAssetsReady, setMouseAssetsReady] = useState(false)
  const readyDispatchedRef = useRef(false)
  const handleBackgroundReady = useCallback(() => setBackgroundReady(true), [])
  const handleMouseAssetsReady = useCallback(() => setMouseAssetsReady(true), [])

  useEffect(() => {
    const handleIntroExit = () => setIntroExiting(true)
    window.addEventListener('Intro:exit', handleIntroExit, { once: true })
    window.addEventListener('Intro:end', handleIntroExit, { once: true })

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
      <main className="relative min-h-screen flex items-center justify-center">
        <HeroSection
          play={introExiting}
          onBackgroundReady={handleBackgroundReady}
          onMouseAssetsReady={handleMouseAssetsReady}
        />
      </main>
      <FpsMeter />
    </>
  )
}
