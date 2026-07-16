import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ColorScheme } from '../effects/DappledLight'
import { GlobalVisualCanvas } from '../effects/GlobalVisualCanvas'

gsap.registerPlugin(ScrollTrigger)

type FixedVisualStageProps = {
  play: boolean
  scheme: ColorScheme
  triggerRef: RefObject<HTMLElement | null>
  onReady?: () => void
  onMouseAssetsReady?: () => void
}

export function FixedVisualStage({
  play,
  scheme,
  triggerRef,
  onReady,
  onMouseAssetsReady,
}: FixedVisualStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const invalidateRef = useRef<(() => void) | null>(null)

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    if (!play) {
      gsap.set(stage, { filter: 'blur(18px)', opacity: 0.5, scale: 1.04 })
      return
    }

    const tween = gsap.to(stage, {
      filter: 'blur(0px)',
      opacity: 1,
      scale: 1,
      duration: 1.8,
      ease: 'power3.out',
    })
    return () => tween.kill()
  }, [play])

  useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const scrollTrigger = ScrollTrigger.create({
        trigger,
        start: 'top top',
        end: () => `+=${window.innerHeight}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress
          invalidateRef.current?.()
        },
      })
      progressRef.current = scrollTrigger.progress
      invalidateRef.current?.()
      return () => scrollTrigger.kill()
    })
    media.add('(prefers-reduced-motion: reduce)', () => {
      progressRef.current = 1
      invalidateRef.current?.()
    })

    ScrollTrigger.refresh()
    return () => media.revert()
  }, [triggerRef])

  return (
    <div ref={stageRef} className="fixed inset-0 z-0 overflow-hidden bg-parchment pointer-events-none" aria-hidden="true">
      <GlobalVisualCanvas
        play={play}
        progressRef={progressRef}
        scheme={scheme}
        onBackgroundReady={onReady}
        onMouseAssetsReady={onMouseAssetsReady}
        onInvalidateReady={(invalidate) => {
          invalidateRef.current = invalidate
        }}
      />
    </div>
  )
}
