import { useEffect, useRef } from 'react'

export function FpsMeter() {
  const rafFpsRef = useRef(0)
  const tickFpsRef = useRef(0)
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frames = 0
    let lastTime = performance.now()
    let rafId: number

    const loop = () => {
      frames++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        rafFpsRef.current = frames
        frames = 0
        lastTime = now
        update()
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    // 1-tick FPS: measure how fast a single frame can render
    let tickId: ReturnType<typeof setTimeout>
    const measureTick = () => {
      const t0 = performance.now()
      requestAnimationFrame(() => {
        const dt = performance.now() - t0
        tickFpsRef.current = dt > 0 ? Math.round(1000 / dt) : 0
        tickId = setTimeout(measureTick, 500)
      })
    }
    measureTick()

    function update() {
      if (elRef.current) {
        elRef.current.textContent = `RAF ${rafFpsRef.current} fps | Tick ${tickFpsRef.current} fps`
      }
    }

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(tickId)
    }
  }, [])

  return (
    <div
      ref={elRef}
      className="fixed bottom-4 left-4 z-[200] px-3 py-1.5 rounded-lg text-xs font-mono bg-black/60 text-green-400 backdrop-blur-sm pointer-events-none"
    >
      RAF 0 fps | Tick 0 fps
    </div>
  )
}
