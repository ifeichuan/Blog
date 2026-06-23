import { Canvas, useFrame } from '@react-three/fiber'
import { motion, useReducedMotion } from 'motion/react'
import { Suspense, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'

const VIEW_BOX = '309.940 236.719 850.021 333.500'
const VIEW_BOX_RECT = { x: 309.94, y: 236.719, width: 850.021, height: 333.5 }
const DRAW_DURATION = 3.35
const DRAW_STAGGER = 0.54

type GlassSignatureProps = {
  className?: string
}

export function GlassSignature({ className = '' }: GlassSignatureProps) {
  const reduced = useReducedMotion()
  const rawId = useId().replaceAll(':', '')
  const filterId = `signature-glass-${rawId}`
  const maskId = `signature-mask-${rawId}`
  const [paths, setPaths] = useState<string[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/feichuan-signature-glass-source.svg', { signal: controller.signal })
      .then((response) => response.text())
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
        setPaths([...doc.querySelectorAll('path')].map((path) => path.getAttribute('d') || ''))
      })
      .catch(() => setPaths([]))
    return () => controller.abort()
  }, [])

  return (
    <motion.svg
      className={`glass-signature ${className}`.trim()}
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMid meet"
      initial={{ opacity: 0.92 }}
      animate={{ opacity: reduced ? 0.8 : 1 }}
      aria-label="Feichuan signature"
    >
      <defs>
        <filter id={filterId} x="-8%" y="-18%" width="116%" height="136%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.055" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7.5" xChannelSelector="R" yChannelSelector="B" />
          <feGaussianBlur stdDeviation="0.24" />
        </filter>
        <filter id={`${filterId}-ca`} x="-10%" y="-22%" width="120%" height="144%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="11" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="11" xChannelSelector="R" yChannelSelector="B" />
        </filter>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect {...VIEW_BOX_RECT} fill="black" />
          {paths.map((d, index) => (
            <SignatureMaskPath key={index} d={d} index={index} reduced={Boolean(reduced)} />
          ))}
        </mask>
      </defs>
      <foreignObject {...VIEW_BOX_RECT} mask={`url(#${maskId})`}>
        <div className="glass-signature__backdrop" />
      </foreignObject>
      <g filter={`url(#${filterId})`}>
        {paths.length === 0 ? (
          <image href="/feichuan-signature-glass-source.svg" x="309.94" y="236.719" width="850.021" height="333.5" />
        ) : (
          paths.map((d, index) => (
            <g key={index}>
              <SignaturePath d={d} index={index} reduced={Boolean(reduced)} tone="red" />
              <SignaturePath d={d} index={index} reduced={Boolean(reduced)} tone="blue" />
              <SignaturePath d={d} index={index} reduced={Boolean(reduced)} />
            </g>
          ))
        )}
      </g>
      <g filter={`url(#${filterId}-ca)`}>
        {paths.map((d, index) => (
          <SignaturePath key={index} d={d} index={index} reduced={Boolean(reduced)} tone="spark" />
        ))}
      </g>
    </motion.svg>
  )
}

function SignatureMaskPath({ d, index, reduced }: { d: string; index: number; reduced: boolean }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="white"
      strokeWidth="24"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{
        duration: reduced ? 0 : DRAW_DURATION,
        delay: reduced ? 0 : index * DRAW_STAGGER,
        ease: [0.16, 1, 0.3, 1],
      }}
    />
  )
}

function SignaturePath({
  d,
  index,
  reduced,
  tone,
}: {
  d: string
  index: number
  reduced: boolean
  tone?: 'red' | 'blue' | 'spark'
}) {
  const className = ['glass-signature__path', tone && `glass-signature__path--${tone}`].filter(Boolean).join(' ')
  const transform =
    tone === 'red' ? 'translate(3.2 0.7)' : tone === 'blue' ? 'translate(-3.2 -0.7)' : undefined

  return (
    <motion.path
      className={className}
      d={d}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      transform={transform}
      initial={reduced ? { pathLength: 1, opacity: tone ? 0.32 : 0.86 } : { pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: tone === 'spark' ? 0.42 : tone ? 0.48 : 0.9 }}
      transition={{
        duration: reduced ? 0 : DRAW_DURATION,
        delay: reduced ? 0 : index * DRAW_STAGGER,
        ease: [0.16, 1, 0.3, 1],
      }}
    />
  )
}

const bubbleCards = [
  { title: '晨光', detail: 'thin light', x: '9%', y: '18%', delay: 1.7 },
  { title: '树影', detail: 'slow leaves', x: '69%', y: '15%', delay: 2.25 },
  { title: '彩边', detail: 'soft chroma', x: '12%', y: '66%', delay: 2.85 },
  { title: '气泡', detail: 'clear edge', x: '72%', y: '61%', delay: 3.35 },
]

export function SignatureGlassDemo() {
  const reduced = useReducedMotion()

  return (
    <main className="signature-scene">
      <svg className="signature-filter-bank" aria-hidden="true" focusable="false">
        <filter id="bubble-card-glass" x="-18%" y="-30%" width="136%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.045" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5.5" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </svg>
      <DappledLight reduced={Boolean(reduced)} />
      <div className="bubble-layer" aria-hidden="true">
        {bubbleCards.map((card) => (
          <motion.article
            key={card.title}
            className="bubble-card"
            style={{ '--x': card.x, '--y': card.y } as CSSProperties}
            initial={reduced ? { opacity: 0.78 } : { opacity: 0, scale: 0.82, y: 18 }}
            animate={{ opacity: 0.86, scale: 1, y: 0 }}
            transition={{
              delay: reduced ? 0 : card.delay,
              type: 'spring',
              stiffness: 92,
              damping: 15,
              mass: 0.85,
            }}
          >
            <span>{card.title}</span>
            <small>{card.detail}</small>
          </motion.article>
        ))}
      </div>
      <div className="signature-shell">
        <GlassSignature />
      </div>
    </main>
  )
}

function DappledLight({ reduced }: { reduced: boolean }) {
  return (
    <Canvas
      className="dappled-canvas"
      orthographic
      camera={{ position: [0, 0, 10], zoom: 78 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <DappledScene reduced={reduced} />
      </Suspense>
    </Canvas>
  )
}

function DappledScene({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const patches = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => {
        const a = index * 2.399
        const light = index % 3 !== 0
        return {
          x: Math.cos(a) * (1.3 + (index % 7) * 0.42),
          y: Math.sin(a * 0.82) * (0.8 + (index % 6) * 0.34),
          sx: light ? 0.72 + (index % 5) * 0.16 : 0.5 + (index % 4) * 0.12,
          sy: light ? 0.22 + (index % 4) * 0.08 : 0.12 + (index % 3) * 0.05,
          r: a,
          opacity: light ? 0.16 + (index % 5) * 0.018 : 0.07,
          color: light ? '#f3d883' : '#3f674d',
          light,
        }
      }),
    [],
  )

  useFrame(({ clock }) => {
    if (!groupRef.current || reduced) return
    const time = clock.elapsedTime
    groupRef.current.rotation.z = Math.sin(time * 0.09) * 0.055
    groupRef.current.position.x = Math.sin(time * 0.13) * 0.18
    groupRef.current.position.y = Math.cos(time * 0.1) * 0.12
  })

  return (
    <group ref={groupRef}>
      {patches.map((patch, index) => (
        <mesh
          key={index}
          position={[patch.x, patch.y, 0]}
          rotation={[0, 0, patch.r]}
          scale={[patch.sx, patch.sy, 1]}
        >
          <circleGeometry args={[1, 36]} />
          <meshBasicMaterial
            color={patch.color}
            transparent
            opacity={patch.opacity}
            depthWrite={false}
            blending={patch.light ? THREE.AdditiveBlending : THREE.NormalBlending}
          />
        </mesh>
      ))}
    </group>
  )
}
