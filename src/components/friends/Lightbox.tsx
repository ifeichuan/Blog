import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createStampTextures,
  getCachedStampTextures,
  type StampTextures,
} from './createStampTextures'
import type { DebugParams } from './debugParams'
import { liveFromDebug } from './shaderLive'
import type { CardOrigin } from './StampCard'
import { StampMesh, type StampMeshHandle } from './StampMesh'
import type { StampDef } from './stamps'
import { SWAP_DELAY_S, SWAP_FADE_S } from './viewerTiming'

type Props = {
  stamp: StampDef
  origin: CardOrigin
  debug: DebugParams
  onClose: () => void
}

export function Lightbox({ stamp, origin, debug, onClose }: Props) {
  const reduce = useReducedMotion()
  const stampBoxRef = useRef<HTMLDivElement>(null)
  const meshRef = useRef<StampMeshHandle>(null)
  const [textures, setTextures] = useState<StampTextures | null>(
    () => getCachedStampTextures(stamp.id) ?? null,
  )
  const [shaderReady, setShaderReady] = useState(Boolean(reduce))
  const pointerFrameRef = useRef<number | null>(null)
  const pendingPointerRef = useRef({ x: 0.5, y: 0.42 })
  const lightUVRef = useRef({ x: 0.5, y: 0.42 })
  const tiltXRaw = useMotionValue(0)
  const tiltYRaw = useMotionValue(0)
  const tiltSpring = useMemo(
    () => ({
      stiffness: debug.springStiffness,
      damping: debug.springDamping,
      mass: 0.55,
    }),
    [debug.springStiffness, debug.springDamping],
  )
  const tiltXSpring = useSpring(tiltXRaw, tiltSpring)
  const tiltYSpring = useSpring(tiltYRaw, tiltSpring)
  const size = Math.min(420, typeof window !== 'undefined' ? window.innerWidth * 0.72 : 420)

  useEffect(() => {
    let cancelled = false
    void createStampTextures(stamp).then((next) => {
      if (!cancelled) setTextures(next)
    })
    return () => {
      cancelled = true
    }
  }, [stamp])

  useEffect(() => {
    if (reduce) return
    const id = window.setTimeout(() => setShaderReady(true), 420)
    return () => window.clearTimeout(id)
  }, [reduce])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        tiltXRaw.set(0)
        tiltYRaw.set(0)
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, tiltXRaw, tiltYRaw])

  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current)
    },
    [],
  )

  const close = () => {
    tiltXRaw.set(0)
    tiltYRaw.set(0)
    onClose()
  }

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const stampBox = stampBoxRef.current
    if (!stampBox) return
    const bounds = stampBox.getBoundingClientRect()
    const nx = (event.clientX - bounds.left) / bounds.width
    const ny = (event.clientY - bounds.top) / bounds.height
    pendingPointerRef.current = { x: nx, y: ny }
    if (pointerFrameRef.current !== null) return
    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = null
      const point = pendingPointerRef.current
      lightUVRef.current.x = point.x
      lightUVRef.current.y = point.y
      if (!reduce) {
        const tx = Math.max(-1, Math.min(1, point.x * 2 - 1))
        const ty = Math.max(-1, Math.min(1, point.y * 2 - 1))
        const tiltMax = debug.tiltMax + 2
        tiltXRaw.set(-ty * tiltMax)
        tiltYRaw.set(tx * tiltMax)
      }
      meshRef.current?.requestRender()
    })
  }

  const viewportCenterX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  const viewportCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  const sourceOffsetX = origin.centerX - viewportCenterX
  const sourceOffsetY = origin.centerY - viewportCenterY
  const live = useMemo(
    () => liveFromDebug(debug, 1, lightUVRef.current, 1, 0),
    [debug],
  )

  // 根节点不再整体淡出：遮罩独立成层，邮票保持不透明飞回落点，
  // 否则邮票还没到落点就先透明了，墙上原卡又还没淡入 —— 中间的空窗就是闪烁
  return (
    <motion.div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${stamp.label} 详情`}
      initial={false}
      onClick={close}
      onPointerMove={onMove}
    >
      <motion.div
        className="lightbox-backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.12 : 0.28, ease: 'easeOut' }}
      />
      <div className="lightbox-perspective" onClick={(event) => event.stopPropagation()}>
        <motion.div
          ref={stampBoxRef}
          className="lightbox-stamp"
          style={{
            transformStyle: 'preserve-3d',
            rotateX: reduce ? 0 : tiltXSpring,
            rotateY: reduce ? 0 : tiltYSpring,
          }}
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
            scale: 1,
          }}
          exit={
            reduce
              ? { opacity: 0 }
              : {
                  x: sourceOffsetX,
                  y: sourceOffsetY,
                  // 落回时用未缩放的布局宽度：原卡以 scale 1 接棒，落点尺寸才一致
                  width: origin.baseWidth,
                  rotate: origin.rotation,
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
          <motion.div
            className="lightbox-stamp-face"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              // 飞行接近尾声才开始渐隐，与墙上原卡的渐显同步（交叉淡化）
              transition: { duration: reduce ? 0.12 : SWAP_FADE_S, delay: reduce ? 0 : SWAP_DELAY_S },
            }}
            transition={{ duration: reduce ? 0.12 : SWAP_FADE_S }}
          >
            {textures && (
              <img
                className="lightbox-static-face"
                src={textures.albedoUrl}
                alt=""
                draggable={false}
              />
            )}
            {textures && shaderReady && (
              <div className="lightbox-shader-face">
                <StampMesh
                  ref={meshRef}
                  albedoUrl={textures.albedoCanvas}
                  heightUrl={textures.heightCanvas}
                  width={textures.width}
                  height={textures.height}
                  live={live}
                  displayWidth={size}
                  fluidWidth
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
      <motion.p
        className="lightbox-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={{ delay: reduce ? 0 : 0.25, duration: 0.2 }}
      >
        点击空白区域或按 ESC 返回
      </motion.p>
      <motion.div
        className="lightbox-info"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
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
