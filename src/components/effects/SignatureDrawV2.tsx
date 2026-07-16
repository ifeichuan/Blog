import type { ComponentProps } from 'react'
import type { TargetAndTransition } from 'motion/react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const initialProps: TargetAndTransition = {
  pathLength: 0,
  opacity: 0,
}

const animateProps: TargetAndTransition = {
  pathLength: 1,
  opacity: 1,
}

export type SignatureDrawV2Props = Omit<
  ComponentProps<typeof motion.svg>,
  'durationScale' | 'onAnimationComplete'
> & {
  durationScale?: number
  onAnimationComplete?: () => void
}

export function SignatureDrawV2({
  className,
  durationScale = 1,
  onAnimationComplete,
  ...props
}: SignatureDrawV2Props) {
  const [paths, setPaths] = useState<string[]>([])
  const calc = (x: number) => x * durationScale

  useEffect(() => {
    fetch('/feichuan-signature-glass-source.svg')
      .then((r) => r.text())
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
        setPaths([...doc.querySelectorAll('path')].map((p) => p.getAttribute('d') || ''))
      })
      .catch(() => setPaths([]))
  }, [])

  return (
    <motion.svg
      className={cn('h-20', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="309.940 236.719 850.021 333.500"
      fill="none"
      stroke="currentColor"
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      <title>Feichuan</title>

      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(2.4),
            ease: 'easeInOut',
            delay: calc(i * 0.45),
            opacity: { duration: 0.4, delay: calc(i * 0.45) },
          }}
          onAnimationComplete={i === paths.length - 1 ? onAnimationComplete : undefined}
        />
      ))}
    </motion.svg>
  )
}
