import { useEffect, useRef } from 'react'

type SignatureDrawProps = {
  play?: boolean
  className?: string
  duration?: number
}

export function SignatureDraw({ play = false, className = '', duration = 6000 }: SignatureDrawProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animatedRef = useRef(false)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    fetch('/feichuan-signature-glass-source.svg')
      .then((r) => r.text())
      .then((markup) => {
        container.innerHTML = markup
        const svg = container.querySelector('svg')
        if (!svg) return
        svg.removeAttribute('id')
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
        svg.style.width = '100%'
        svg.style.height = '100%'
        svg.style.overflow = 'visible'
        container.querySelectorAll('path').forEach((path) => {
          path.style.fill = 'none'
          path.style.stroke = 'black'
          path.style.strokeWidth = '14'
          path.style.strokeLinecap = 'round'
          path.style.strokeLinejoin = 'round'
          if (!reduced) {
            const length = path.getTotalLength()
            path.style.strokeDasharray = `${length}`
            path.style.strokeDashoffset = `${length}`
          }
        })
      })
  }, [reduced])

  useEffect(() => {
    if (!play || animatedRef.current || reduced) return
    const container = containerRef.current
    if (!container) return
    animatedRef.current = true

    const paths = [...container.querySelectorAll('path')] as SVGPathElement[]
    const totalPaths = paths.length
    const stagger = 360

    paths.forEach((path, index) => {
      const length = path.getTotalLength()
      const anim = path.animate(
        [
          { strokeDashoffset: `${length}` },
          { strokeDashoffset: '0' },
        ],
        {
          duration,
          delay: index * stagger,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards',
        },
      )

      if (index === totalPaths - 1) {
        anim.onfinish = () => {
          paths.forEach((p) => {
            p.style.fill = 'black'
            p.style.transition = 'fill 0.3s ease'
          })
        }
      }
    })
  }, [play, reduced, duration])

  return <div ref={containerRef} className={className} />
}
