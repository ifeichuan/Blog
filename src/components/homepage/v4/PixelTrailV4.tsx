import React, { useEffect, useRef, useState } from 'react'

// Gooey PixelTrail 鼠标液态像素尾迹
// 视觉沿用 demos/gooey：PixelTrail（网格按格点亮，瞬亮→停→瞬灭）+ GooeySvgFilter（模糊→alpha 阈值）
// 性能改造（对比 demo 原版）：
// - 去掉 framer-motion：1300+ useAnimationControls hook → 纯 class 切换 + setTimeout
// - mousemove 节流 20ms + 同格跳过：高回报率鼠标不再每事件触发动画调度
// - 直接按行列索引取格子，去掉每事件 getElementById
// - 同时点亮数上限：限制 SVG filter 脏区重算范围
// v4 适配（不变）：fixed 层浮在 canvas(z0) 之上、卡片流(z1) 之下；事件挂 window；
// 滚过第一屏（canvas 完成溶解）才激活；Safari 降级不加 filter
const PIXEL = 32
const HOLD_MS = 500
const THROTTLE_MS = 20
const MAX_ACTIVE = 24
const FILTER_ID = 'v4-gooey-trail'

function GooeySvgFilter({ strength = 5 }: { strength?: number }) {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
      <defs>
        <filter id={FILTER_ID}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={strength} result="blur-sm" />
          <feColorMatrix
            in="blur-sm"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

type ActiveCell = { el: HTMLElement; timer: number }

export function PixelTrailV4() {
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [isSafari, setIsSafari] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
    const measure = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (matchMedia('(hover: none)').matches) return

    let lastTime = 0
    let lastKey = ''
    const active: ActiveCell[] = []

    const off = (cell: ActiveCell) => {
      window.clearTimeout(cell.timer)
      cell.el.classList.remove('on')
    }

    const onMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastTime < THROTTLE_MS) return
      if (window.scrollY < window.innerHeight) return
      const grid = gridRef.current
      if (!grid) return
      const col = Math.floor(e.clientX / PIXEL)
      const row = Math.floor(e.clientY / PIXEL)
      const key = `${col}-${row}`
      if (key === lastKey) return
      const el = grid.children[row]?.children[col] as HTMLElement | undefined
      if (!el) return
      lastTime = now
      lastKey = key

      el.classList.add('on')
      const cell: ActiveCell = {
        el,
        timer: window.setTimeout(() => {
          el.classList.remove('on')
          const idx = active.indexOf(cell)
          if (idx !== -1) active.splice(idx, 1)
        }, HOLD_MS),
      }
      active.push(cell)
      // 超上限时立刻熄灭最旧的格子，限制 filter 需要重算的区域
      while (active.length > MAX_ACTIVE) off(active.shift()!)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      active.forEach(off)
    }
  }, [])

  const cols = Math.ceil(dims.w / PIXEL)
  const rows = Math.ceil(dims.h / PIXEL)

  return (
    <div className="v4-pixel-trail" aria-hidden="true">
      <GooeySvgFilter strength={5} />
      <div
        ref={gridRef}
        style={{
          position: 'absolute',
          inset: 0,
          filter: isSafari ? 'none' : `url(#${FILTER_ID})`,
        }}
      >
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="v4-trail-px" style={{ width: PIXEL, height: PIXEL }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
