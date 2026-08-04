import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createStampTextures, type StampTextures } from './createStampTextures'
import type { DebugParams } from './debugParams'
import { liveFromDebug } from './shaderLive'
import type { CardOrigin } from './StampCard'
import { StampMesh } from './StampMesh'
import type { StampDef } from './stamps'

type Props = {
  stamp: StampDef
  origin: CardOrigin
  debug: DebugParams
  onClose: () => void
}

export function Lightbox({ stamp, origin, debug, onClose }: Props) {
  const reduce = useReducedMotion()
  const [textures] = useState<StampTextures>(() => createStampTextures(stamp))
  const [lightUV, setLightUV] = useState({ x: 0.5, y: 0.42 })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [shaderReady, setShaderReady] = useState(Boolean(reduce))
  const pointerFrameRef = useRef<number | null>(null)
  const pendingPointerRef = useRef({ x: 0.5, y: 0.42 })
  const size = Math.min(420, typeof window !== 'undefined' ? window.innerWidth * 0.72 : 420)

  useEffect(() => {
    if (reduce) return
    const id = window.setTimeout(() => setShaderReady(true), 420)
    return () => window.clearTimeout(id)
  }, [reduce])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current)
    },
    [],
  )

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const stampBox = event.currentTarget.querySelector('.lightbox-stamp') as HTMLElement | null
    if (!stampBox) return
    const bounds = stampBox.getBoundingClientRect()
    const nx = (event.clientX - bounds.left) / bounds.width
    const ny = (event.clientY - bounds.top) / bounds.height
    pendingPointerRef.current = { x: nx, y: ny }
    if (pointerFrameRef.current !== null) return
    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = null
      const point = pendingPointerRef.current
      setLightUV(point)
      setTilt({
        x: Math.max(-1, Math.min(1, point.x * 2 - 1)),
        y: Math.max(-1, Math.min(1, point.y * 2 - 1)),
      })
    })
  }

  const viewportCenterX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  const viewportCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  const sourceOffsetX = origin.centerX - viewportCenterX
  const sourceOffsetY = origin.centerY - viewportCenterY
  const tiltMax = debug.tiltMax + 2
  const tiltX = reduce ? 0 : -tilt.y * tiltMax
  const tiltY = reduce ? 0 : tilt.x * tiltMax
  const live = liveFromDebug(debug, 1, lightUV, 1, 0)

  return (
    <motion.div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${stamp.label} 详情`}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0 }}
      transition={{ duration: reduce ? 0.12 : 0.28, ease: 'easeOut' }}
      onClick={onClose}
      onPointerMove={onMove}
    >
      <div className="lightbox-perspective" onClick={(event) => event.stopPropagation()}>
        <motion.div
          className="lightbox-stamp"
          style={{ transformStyle: 'preserve-3d' }}
          initial={
            reduce
              ? { width: size }
              : {
                  x: sourceOffsetX,
                  y: sourceOffsetY,
                  width: origin.width,
                  rotate: origin.rotation,
                  scale: 1,
                }
          }
          animate={{
            x: 0,
            y: 0,
            width: size,
            rotate: 0,
            rotateX: tiltX,
            rotateY: tiltY,
            scale: 1,
          }}
          exit={
            reduce
              ? { opacity: 0 }
              : {
                  x: sourceOffsetX,
                  y: sourceOffsetY,
                  width: origin.width,
                  rotate: origin.rotation,
                  rotateX: 0,
                  rotateY: 0,
                  scale: 1,
                }
          }
          transition={
            reduce
              ? { duration: 0.12 }
              : {
                  type: 'spring',
                  stiffness: debug.springStiffness * 0.72,
                  damping: debug.springDamping + 3,
                  mass: 0.78,
                }
          }
        >
          <img
            className="lightbox-static-face"
            src={textures.albedoUrl}
            alt=""
            draggable={false}
          />
          {shaderReady && (
            <div className="lightbox-shader-face">
              <StampMesh
                albedoUrl={textures.albedoUrl}
                heightUrl={textures.heightUrl}
                width={textures.width}
                height={textures.height}
                live={live}
                displayWidth={size}
                fluidWidth
              />
            </div>
          )}
        </motion.div>
      </div>
      <motion.p
        className="lightbox-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: reduce ? 0 : 0.25, duration: 0.2 }}
      >
        点击空白区域或按 ESC 返回
      </motion.p>
      <motion.div
        className="lightbox-info"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: reduce ? 0 : 0.3, duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="lightbox-desc">{stamp.desc}</p>
        <a
          className="lightbox-link"
          href={`https://${stamp.url}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          访问 {stamp.label}
        </a>
      </motion.div>
    </motion.div>
  )
}
