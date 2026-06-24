import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { DappledLight, COLOR_SCHEMES, type ColorScheme } from './DappledLight'
import { HeroContent } from './HeroContent'

const schemeNames = Object.keys(COLOR_SCHEMES) as (keyof typeof COLOR_SCHEMES)[]

export function HeroSection() {
  const [canvasReady, setCanvasReady] = useState(false)
  const [schemeIndex, setSchemeIndex] = useState(0)
  const reduced = useReducedMotion()

  const currentName = schemeNames[schemeIndex]
  const currentScheme = COLOR_SCHEMES[currentName]

  const next = () => setSchemeIndex((i) => (i + 1) % schemeNames.length)

  return (
    <section className="relative z-1 w-[calc(100vw-1.5rem)] h-[calc(100vh-1.5rem)] rounded-2xl overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0"
        initial={reduced ? {} : { filter: 'blur(18px)', opacity: 0.5, y: -30, scale: 1.04 }}
        animate={{ filter: 'blur(0px)', opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 1.8,
          ease: [0.22, 1, 0.36, 1],
          y: { type: 'spring', stiffness: 80, damping: 14 },
          scale: { type: 'spring', stiffness: 80, damping: 14 },
        }}
        onAnimationComplete={() => setCanvasReady(true)}
      >
        <DappledLight scheme={currentScheme} />
      </motion.div>
      <div className="relative z-10 h-full flex items-center justify-center text-near-black">
        <HeroContent play={canvasReady} />
      </div>

      <button
        onClick={next}
        className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/60 backdrop-blur-sm border border-black/10 hover:bg-white/80 transition-colors"
      >
        {currentName}
      </button>
    </section>
  )
}
