import { useEffect, useRef } from 'react'

export function Strands() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let w: number, h: number, mx = 0, my = 0
    const N = 12
    const strands = Array.from({ length: N }, (_, i) => ({
      phase: Math.random() * Math.PI * 2,
      speed: .3 + Math.random() * .5,
      amp: 30 + Math.random() * 60,
      y: 0,
      hue: 20 + Math.random() * 30,
    }))

    function resize() {
      const dpr = devicePixelRatio || 1
      w = c!.offsetWidth; h = c!.offsetHeight
      c!.width = w * dpr; c!.height = h * dpr
      ctx.scale(dpr, dpr)
      strands.forEach((s, i) => { s.y = h * (i + 1) / (N + 1) })
    }
    resize()
    window.addEventListener('resize', resize)
    c.addEventListener('mousemove', e => { const r = c!.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top })

    let active = false, raf = 0
    const io = new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active && !raf) draw() }, { threshold: .1 })
    io.observe(c)

    function draw() {
      if (!active) { raf = 0; return }
      ctx.clearRect(0, 0, w, h)
      const t = performance.now() * .001
      strands.forEach(s => {
        ctx.beginPath()
        ctx.strokeStyle = `hsla(${s.hue},70%,55%,.35)`
        ctx.lineWidth = 1.5
        ctx.shadowBlur = 8; ctx.shadowColor = `hsla(${s.hue},80%,50%,.3)`
        for (let x = 0; x <= w; x += 4) {
          const distX = mx - x, distY = my - s.y
          const dist = Math.sqrt(distX * distX + distY * distY)
          const influence = Math.max(0, 1 - dist / 200) * 25
          const y = s.y + Math.sin(x * .008 + t * s.speed + s.phase) * s.amp + influence * (distY > 0 ? -1 : 1)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke(); ctx.shadowBlur = 0
      })
      raf = requestAnimationFrame(draw)
    }

    return () => { io.disconnect(); window.removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div className="relative h-[50vh] overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
