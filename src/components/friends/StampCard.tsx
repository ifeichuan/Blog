import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createStampTextures, type StampTextures } from './createStampTextures'
import type { DebugParams } from './debugParams'
import { liveFromDebug } from './shaderLive'
import { StampMesh, type StampMeshHandle } from './StampMesh'
import type { StampDef } from './stamps'
import { SWAP_DELAY_S, SWAP_FADE_S } from './viewerTiming'

export type CardOrigin = {
  centerX: number
  centerY: number
  /** 聚焦态（×focusScale）下的视觉宽高 —— 灯箱起手用 */
  width: number
  height: number
  /** 未缩放的布局宽高 —— 灯箱落回时用（卡片以 scale 1 接棒） */
  baseWidth: number
  baseHeight: number
  rotation: number
}

type Props = {
  stamp: StampDef
  baseWidth: number
  isFocused: boolean
  isDimmed: boolean
  isOpen: boolean
  /** 灯箱检视中（含退出动画期间）：暂停浮游，保证落点与卡片位置一致 */
  isViewerActive: boolean
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
  isViewerActive,
  isPreviewTarget,
  debug,
  onFocus,
  onOpen,
}: Props) {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLButtonElement>(null)
  const meshRef = useRef<StampMeshHandle>(null)
  const [textures, setTextures] = useState<StampTextures | null>(null)
  const [ready, setReady] = useState(false)
  const [inView, setInView] = useState(true)
  const pointerFrameRef = useRef<number | null>(null)
  const pendingPointerRef = useRef({ x: 0.5, y: 0.5 })
  const lightUVRef = useRef({ x: 0.5, y: 0.5 })
  const tiltXRaw = useMotionValue(0)
  const tiltYRaw = useMotionValue(0)
  const shadowXRaw = useMotionValue(0)
  const focusedRef = useRef(isFocused)
  focusedRef.current = isFocused
  const tiltSpring = useMemo(
    () => ({
      stiffness: debug.springStiffness,
      damping: debug.springDamping,
      mass: 0.55,
    }),
    [debug.springStiffness, debug.springDamping],
  )
  const tiltX = useSpring(tiltXRaw, tiltSpring)
  const tiltY = useSpring(tiltYRaw, tiltSpring)
  const shadowX = useSpring(shadowXRaw, tiltSpring)
  const shadowTransform = useMotionTemplate`translateY(14px) translateX(${shadowX}px) scale(0.98)`

  // 记录上一轮的 isOpen：关闭灯箱时 isOpen 在退出动画开始时就翻回 false，
  // 卡片需要延迟到飞行接近尾声再渐显，与旧邮票的渐隐做交叉淡化
  const wasOpenRef = useRef(false)
  useEffect(() => {
    wasOpenRef.current = isOpen
  }, [isOpen])

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
    let cancelled = false
    const build = () => {
      void createStampTextures(stamp).then((next) => {
        if (cancelled) return
        setTextures(next)
        setReady(true)
      })
    }

    const idleWindow = window as typeof window & {
      requestIdleCallback?: typeof window.requestIdleCallback
      cancelIdleCallback?: typeof window.cancelIdleCallback
    }
    if (typeof idleWindow.requestIdleCallback === 'function') {
      const id = idleWindow.requestIdleCallback(build, { timeout: 280 + stamp.z * 45 })
      return () => {
        cancelled = true
        idleWindow.cancelIdleCallback?.(id)
      }
    }

    const id = globalThis.setTimeout(build, 80 + stamp.z * 45)
    return () => {
      cancelled = true
      globalThis.clearTimeout(id)
    }
  }, [stamp])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { rootMargin: '80px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current)
    },
    [],
  )

  useEffect(() => {
    if (isFocused && !reduce) return
    tiltXRaw.set(0)
    tiltYRaw.set(0)
    shadowXRaw.set(0)
  }, [isFocused, reduce, tiltXRaw, tiltYRaw, shadowXRaw])

  const displayWidth = baseWidth * stamp.scale
  const displayHeight = textures
    ? displayWidth * (textures.height / textures.width)
    : displayWidth / stamp.aspect

  const phase = useMemo(() => {
    let h = 0
    for (let i = 0; i < stamp.id.length; i++) h = (h * 31 + stamp.id.charCodeAt(i)) | 0
    return (h % 1000) / 1000
  }, [stamp.id])

  const applyPointer = (nx: number, ny: number, withTilt: boolean) => {
    lightUVRef.current.x = nx
    lightUVRef.current.y = ny
    if (withTilt && !reduce) {
      const tx = Math.max(-1, Math.min(1, nx * 2 - 1))
      const ty = Math.max(-1, Math.min(1, ny * 2 - 1))
      tiltXRaw.set(-ty * debug.tiltMax)
      tiltYRaw.set(tx * debug.tiltMax)
      shadowXRaw.set(tx * 6)
    }
    meshRef.current?.requestRender()
  }

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
      applyPointer(point.x, point.y, focusedRef.current)
    })
  }

  const clearPointer = () => {
    onFocus(null)
    applyPointer(0.5, 0.5, false)
    tiltXRaw.set(0)
    tiltYRaw.set(0)
    shadowXRaw.set(0)
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
      baseWidth: element.offsetWidth,
      baseHeight: element.offsetHeight,
      rotation: stamp.rotation,
    })
  }

  const focusScale = debug.focusScale
  const dimBlur = debug.dimBlur

  // live 对象用 useMemo 稳定：指针坐标写进同一个 lightUV 引用，
  // 避免每次移动都新建对象并触发 StampMesh 的 React 重渲。
  const live = useMemo(
    () =>
      liveFromDebug(
        debug,
        showShader ? 1 : 0,
        lightUVRef.current,
        reveal,
        reduce || isPreviewTarget ? 0 : debug.burnDuration,
      ),
    [debug, showShader, reveal, reduce, isPreviewTarget],
  )

  return (
    <motion.button
      ref={rootRef}
      type="button"
      className={`stamp-card${isFocused ? ' is-focused' : ''}${isDimmed ? ' is-dimmed' : ''}${isViewerActive ? ' is-viewer-active' : ''}${inView ? '' : ' is-offscreen'}`}
      data-depth={(stamp.z - 3.5) / 3}
      style={{
        left: `${stamp.x}%`,
        top: `${stamp.y}%`,
        width: displayWidth,
        height: displayHeight,
        zIndex: isFocused ? 40 : stamp.z,
        filter: isDimmed
          ? `blur(${reduce ? Math.max(0, dimBlur - 2) : dimBlur}px)`
          : undefined,
        ['--rot' as string]: `${stamp.rotation}deg`,
        ['--bob-up' as string]: `${-5 - phase * 4}px`,
        ['--bob-down' as string]: `${4 + phase * 3}px`,
        ['--bob-dur' as string]: `${7 + phase * 3}s`,
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
        // 打开时渐隐（与灯箱邮票的渐显交叉淡化）；关闭时延迟到飞行尾声再渐显
        opacity: {
          duration: isOpen || wasOpenRef.current ? SWAP_FADE_S : 0.16,
          delay: !isOpen && wasOpenRef.current ? SWAP_DELAY_S : 0,
        },
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
      <div className="stamp-scroll-layer">
        <div className="stamp-perspective">
        <motion.div
          className="stamp-tilt"
          style={{
            transformStyle: 'preserve-3d',
            rotateX: reduce ? 0 : tiltX,
            rotateY: reduce ? 0 : tiltY,
          }}
        >
          <div className="stamp-float">
            <motion.div
              className={`stamp-shadow ${isFocused ? 'deep' : ''}`}
              style={isFocused && !reduce ? { transform: shadowTransform } : undefined}
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
            {shaderAlive && (
              <div
                className="stamp-shader-layer"
                style={{ opacity: showShader ? 1 : 0, visibility: showShader ? 'visible' : 'hidden' }}
              >
                <StampMesh
                  ref={meshRef}
                  albedoUrl={textures.albedoCanvas}
                  heightUrl={textures.heightCanvas}
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
          </div>
        </motion.div>
        </div>
      </div>
    </motion.button>
  )
}
