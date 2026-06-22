import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(pointer: coarse)').matches) return
    let cx = 0, cy = 0, tx = 0, ty = 0
    const move = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }
    const loop = () => {
      cx += (tx - cx) * .12; cy += (ty - cy) * .12
      el.style.left = cx + 'px'; el.style.top = cy + 'px'
      requestAnimationFrame(loop)
    }
    document.addEventListener('mousemove', move)
    requestAnimationFrame(loop)

    const grow = () => el.classList.add('scale-[2.5]')
    const shrink = () => el.classList.remove('scale-[2.5]')
    document.querySelectorAll('a,button,.work-card,.demo-visual').forEach(n => {
      n.addEventListener('pointerenter', grow)
      n.addEventListener('pointerleave', shrink)
    })
    return () => { document.removeEventListener('mousemove', move) }
  }, [])

  return <div ref={ref} className="fixed w-6 h-6 rounded-full bg-white mix-blend-difference pointer-events-none z-[999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 hidden md:block" />
}

export function ClickSpark() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const spark = document.createElement('div')
      spark.className = 'fixed pointer-events-none z-[200]'
      spark.style.left = e.clientX + 'px'; spark.style.top = e.clientY + 'px'
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('i')
        const angle = (i / 8) * Math.PI * 2
        const dist = 20 + Math.random() * 30
        Object.assign(p.style, {
          position: 'absolute', width: '3px', height: '12px', background: '#DA702C',
          borderRadius: '2px', transform: `rotate(${angle}rad)`,
          animation: `sparkFly .6s cubic-bezier(.175,.885,.32,1.275) forwards`,
          '--dir': `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) scale(0)`
        } as any)
        spark.appendChild(p)
      }
      document.body.appendChild(spark)
      setTimeout(() => spark.remove(), 700)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
  return null
}
