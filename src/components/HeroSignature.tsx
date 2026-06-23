import { motion, useReducedMotion } from 'motion/react'
import { SignatureDraw } from './SignatureDraw'

type HeroSignatureProps = {
  play?: boolean
}

export function HeroSignature({ play = false }: HeroSignatureProps) {
  const reduced = useReducedMotion()
  const showIm = play || reduced
  const letters = "I'm".split('')

  return (
    <div className="flex items-center gap-3" style={{ fontFamily: "'Geist Mono', monospace" }}>
      <span className="text-5xl text-near-black whitespace-nowrap flex">
        {letters.map((char, i) => (
          <motion.span
            key={i}
            initial={reduced ? {} : { opacity: 0, filter: 'blur(8px)', y: -12 }}
            animate={showIm ? { opacity: 1, filter: 'blur(0px)', y: 0 } : undefined}
            transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.08 }}
          >
            {char}
          </motion.span>
        ))}
      </span>

      <SignatureDraw play={play} className="h-28 w-auto" duration={6000} />
    </div>
  )
}
