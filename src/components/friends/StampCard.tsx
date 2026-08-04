import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createStampTextures } from './createStampTextures'
import type { DebugParams } from './debugParams'
import { liveFromDebug } from './shaderLive'
import { StampMesh } from './StampMesh'
import type { StampDef } from './stamps'

export type CardOrigin = {
  centerX: number
  centerY: number
  width: number
  height: number
  rotation: number
}

type Props = {
  stamp: StampDef
  baseWidth: number
  isFocused: boolean
  isDimmed: boolean
  isOpen: boolean
  isPreviewTarget: boolean
  debug: DebugParams
  onFocus: (id: StampDef['id'] | null) => void
  onOpen: (id: StampDef['id'], origin: CardOrigin) => void
}

export function StampCard({
  stamp,
  baseWidth,
  isFocused,
  isDimmed,
  isOpen,
  isPreviewTarget,
  debug,
  onFocus,
  onOpen,
}: Props) {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLButtonElement>(null)
  const [textures, setTextures] = useState<ReturnType<typeof createStampTextures> | null>(null)
  const [lightUV, setLightUV] = useState({ x: 0.5, y: 0.5 })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)
  const pointerFrameRef = useRef<number | null>(null)
  const pendingPointerRef = useRef({ x: 0.5, y: 0.5 })

  const reveal = isPreviewTarget ? debug.previewProgress : isFocused ? 1 : 0
  const showShader = isPreviewTarget || isFocused

  // shader 层按需挂载：hover 时才创建 WebGL context，移开后延迟 600ms 卸载。
  // （移开后 shader 层 opacity 已经为 0，600ms 只影响 GPU 资源释放时机，
  // 不影响视觉。11 张卡只会有 1-3 个并发 context，GPU 内存与 shader 编译
  // 只在真正需要时发生。首次 hover 多一次编译，之后立即出画。）
  const [shaderAlive, setShaderAlive] = useState(false)
  const shaderAliveRef = useRef(false)
  const shaderTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (showShader) {
      if (shaderTimerRef.current !== null) {
        clearTimeout(shaderTimerRef.current)
        shaderTimerRef.current = null
      }
      if (!shaderAliveRef.current) {
        shaderAliveRef.current = true
        setShaderAlive(true)
      }
    } else if (shaderAliveRef.current) {
      shaderTimerRef.current = window.setTimeout(() => {
        shaderAliveRef.current = false
        setShaderAlive(false)
      }, 600)
    }
    return () => {
      if (shaderTimerRef.current !== null) clearTimeout(shaderTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShader])


  useEffect(() => {
    const build = () => {
      setTextures(createStampTextures(stamp))
      setReady(true)
    }

    const idleWindow = window as typeof window & {
      requestIdleCallback?: typeof window.requestIdleCallback
      cancelIdleCallback?: typeof window.cancelIdleCallback
    }
    if (typeof idleWindow.requestIdleCallback === 'function') {
      const id = idleWindow.requestIdleCallback(build, { timeout: 280 + stamp.z * 45 })
      return () => idleWindow.cancelIdleCallback?.(id)
    }

    const id = globalThis.setTimeout(build, 80 + stamp.z * 45)
    return () => globalThis.clearTimeout(id)
  }, [stamp])

  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current)
    },
    [],
  )

  const displayWidth = baseWidth * stamp.scale
  const displayHeight = textures
    ? displayWidth * (textures.height / textures.width)
    : displayWidth / stamp.aspect

  const phase = useMemo(() => {
    let h = 0
    for (let i = 0; i < stamp.id.length; i++) h = (h * 31 + stamp.id.charCodeAt(i)) | 0
    return (h % 1000) / 1000
  }, [stamp.id])

  const onPointerMove = (e: React.PointerEvent) => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top) / r.height
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

  const clearPointer = () => {
    onFocus(null)
    setTilt({ x: 0, y: 0 })
    setLightUV({ x: 0.5, y: 0.5 })
  }

  const openViewer = () => {
    const element = rootRef.current
    if (!element) return
    const bounds = element.getBoundingClientRect()
    onOpen(stamp.id, {
      centerX: bounds.left + bounds.width / 2,
      centerY: bounds.top + bounds.height / 2,
      width: element.offsetWidth * debug.focusScale,
      height: element.offsetHeight * debug.focusScale,
      rotation: stamp.rotation,
    })
  }

  const tiltMax = debug.tiltMax
  const tiltX = reduce || !isFocused ? 0 : -tilt.y * tiltMax
  const tiltY = reduce || !isFocused ? 0 : tilt.x * tiltMax
  const focusScale = debug.focusScale
  const dimBlur = debug.dimBlur

  // live 对象用 useMemo 稳定：只在真实参数变化时才新建引用，
  // 避免每次 render 都触发 StampMesh 的 requestRender（无谓重绘一帧）
  const live = useMemo(
    () =>
      liveFromDebug(
        debug,
        showShader ? 1 : 0,
        lightUV,
        reveal,
        reduce || isPreviewTarget ? 0 : debug.burnDuration,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debug, showShader, lightUV, reveal, reduce, isPreviewTarget],
  )

  return (
    <motion.button
      ref={rootRef}
      type="button"
      className={`stamp-card ${isFocused ? 'is-focused' : ''} ${isDimmed ? 'is-dimmed' : ''}`}
      style={{
        left: `${stamp.x}%`,
        top: `${stamp.y}%`,
        width: displayWidth,
        height: displayHeight,
        zIndex: isFocused ? 40 : stamp.z,
        filter: isDimmed
          ? `blur(${reduce ? Math.max(0, dimBlur - 2) : dimBlur}px)`
          : 'blur(0px)',
        ['--rot' as string]: `${stamp.rotation}deg`,
      }}
      initial={false}
      animate={
        reduce
          ? {
              x: '-50%',
              y: '-50%',
              rotate: stamp.rotation,
              scale: isFocused ? focusScale * 0.98 : 1,
              opacity: isOpen ? 0 : isDimmed ? 0.9 : 1,
            }
          : {
              x: '-50%',
              y: '-50%',
              rotate: stamp.rotation,
              scale: isFocused ? focusScale : 1,
              opacity: isOpen ? 0 : isDimmed ? 0.72 : 1,
            }
      }
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 28,
        mass: 0.85,
        opacity: { duration: isOpen ? 0.04 : 0.16 },
      }}
      onPointerEnter={() => onFocus(stamp.id)}
      onPointerLeave={clearPointer}
      onPointerMove={onPointerMove}
      onClick={openViewer}
      onFocus={() => onFocus(stamp.id)}
      onBlur={clearPointer}
      aria-label={`${stamp.label} stamp`}
      aria-expanded={isOpen}
    >
      <div className="stamp-perspective">
        <motion.div
          className="stamp-tilt"
          initial={false}
          animate={{
            rotateX: tiltX,
            rotateY: tiltY,
          }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  type: 'spring',
                  stiffness: debug.springStiffness,
                  damping: debug.springDamping,
                  mass: 0.55,
                }
          }
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div
            className="stamp-float"
            animate={
              reduce || isFocused
                ? { y: 0, rotate: 0 }
                : {
                    y: [0, -5 - phase * 4, 0, 4 + phase * 3, 0],
                    rotate: [0, 0.6, 0, -0.5, 0],
                  }
            }
            transition={
              reduce || isFocused
                ? { duration: 0.2 }
                : {
                    duration: 7 + phase * 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          >
            <div
              className={`stamp-shadow ${isFocused ? 'deep' : ''}`}
              style={
                isFocused && !reduce
                  ? {
                      transform: `translateY(14px) translateX(${tilt.x * 6}px) scale(0.98)`,
                    }
                  : undefined
              }
            />
            {ready && textures ? (
              <>
                {/* flat print always underneath; shader burns over it */}
                <img
                  src={textures.albedoUrl}
                  alt=""
                  draggable={false}
                  className="stamp-img"
                  width={displayWidth}
                  height={displayHeight}
                  style={{
                    opacity: showShader ? 0.88 : 1,
                  }}
                />
            {ready && textures && shaderAlive && (
              <div
                className="stamp-shader-layer"
                style={{ opacity: showShader ? 1 : 0, visibility: showShader ? 'visible' : 'hidden' }}
              >
                <StampMesh
                  albedoUrl={textures.albedoUrl}
                  heightUrl={textures.heightUrl}
                  width={textures.width}
                  height={textures.height}
                  live={live}
                  displayWidth={displayWidth}
                  className="stamp-canvas"
                  active={showShader}
                />
              </div>
            )}
              </>
            ) : (
              <div
                className="stamp-placeholder"
                style={{ width: displayWidth, height: displayHeight }}
              />
            )}

            {isFocused && (
              <motion.span
                className="stamp-pill"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                style={{ transform: 'translateX(-50%) translateZ(28px)' }}
              >
                {stamp.label}
              </motion.span>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.button>
  )
}
