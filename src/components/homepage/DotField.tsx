import { useEffect, useRef } from 'react'

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const gap = 28
    let w: number, h: number, dots: { x: number; y: number }[] = []
    let mx = -1, my = -1

    function resize() {
      const dpr = devicePixelRatio || 1
      w = c!.offsetWidth; h = c!.offsetHeight
      c!.width = w * dpr; c!.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dots = []
      const cols = Math.ceil(w / gap), rows = Math.ceil(h / gap)
      for (let r = 0; r < rows; r++)
        for (let cl = 0; cl < cols; cl++)
          dots.push({ x: cl * gap + gap / 2, y: r * gap + gap / 2 })
    }
    resize()
    window.addEventListener('resize', resize)
    c.addEventListener('mousemove', e => { const r = c!.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top })
    c.addEventListener('mouseleave', () => { mx = -1; my = -1 })

    let active = false, raf = 0
    const io = new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active && !raf) draw() }, { threshold: .1 })
    io.observe(c)

    function draw() {
      if (!active) { raf = 0; return }
      ctx.clearRect(0, 0, w, h)
      dots.forEach(d => {
        const dist = mx < 0 ? 999 : Math.sqrt((mx - d.x) ** 2 + (my - d.y) ** 2)
        const t = Math.max(0, 1 - dist / 120)
        ctx.beginPath()
        ctx.arc(d.x, d.y, 1.5 + t * 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(218,112,44,${.15 + t * .7})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    return () => { io.disconnect(); window.removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div className="relative h-[40vh] overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
