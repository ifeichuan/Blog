import { useEffect, useState } from 'react'
import { HeroSection } from './HeroSection'
import { FpsMeter } from './FpsMeter'

export function IndexPage() {
  const [introComplete, setIntroComplete] = useState(false)

  useEffect(() => {
    const handleIntroEnd = () => setIntroComplete(true)
    window.addEventListener('Intro:end', handleIntroEnd, { once: true })

    document.documentElement.dataset.homepageReady = 'true'
    window.dispatchEvent(new Event('homepage:ready'))

    return () => window.removeEventListener('Intro:end', handleIntroEnd)
  }, [])

  return (
    <>
      <main className="relative min-h-screen flex items-center justify-center">
        <HeroSection play={introComplete} />
      </main>
      <FpsMeter />
    </>
  )
}
