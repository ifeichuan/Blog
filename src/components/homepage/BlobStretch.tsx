import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function buildBlob(stretch: number) {
  const cx = 100, topY = 80
  const midTopY = 200 + stretch * 0.3
  const midBotY = 600 - stretch * 0.3
  const bulge = 70 + stretch * 0.08
  const yA = 280 + stretch * 0.5
  const yB = 520 - stretch * 0.5 + stretch
  const botY = 720 + stretch
  return `M${cx},${topY} C${cx + 75},${topY + 30} ${cx + bulge},${midTopY} ${cx + bulge - 10},${yA} C${cx + bulge - 20},${yA + 60} ${cx + bulge - 15},${yB - 60} ${cx + bulge - 10},${yB} C${cx + bulge},${midBotY + stretch * 0.7} ${cx + 75},${botY - 30} ${cx},${botY} C${cx - 75},${botY - 30} ${cx - bulge},${midBotY + stretch * 0.7} ${cx - bulge + 10},${yB} C${cx - bulge + 20},${yB - 60} ${cx - bulge + 15},${yA + 60} ${cx - bulge + 10},${yA} C${cx - bulge},${midTopY} ${cx - 75},${topY + 30} ${cx},${topY} Z`
}

export function BlobStretch() {
  const ref = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!ref.current || !pathRef.current || !svgRef.current) return
    const path = pathRef.current
    const svg = svgRef.current
    path.setAttribute('d', buildBlob(0))

    const ctx = gsap.context(() => {
      gsap.to({}, {
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            const stretch = self.progress * 400
            path.setAttribute('d', buildBlob(stretch))
            svg.setAttribute('viewBox', `0 0 200 ${800 + stretch}`)
          }
        }
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="relative h-[120vh] flex items-center justify-center overflow-visible">
      <svg ref={svgRef} viewBox="0 0 200 800" preserveAspectRatio="xMidYMid meet" className="absolute left-1/2 -translate-x-1/2 w-[220px] h-full">
        <path ref={pathRef} className="fill-[--orange] opacity-[.18]" />
      </svg>
    </div>
  )
}
