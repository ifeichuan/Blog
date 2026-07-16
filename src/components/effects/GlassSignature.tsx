import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { motion, useReducedMotion } from 'motion/react'
import { Suspense, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'

const VIEW_BOX = '309.940 236.719 850.021 333.500'
const VIEW_BOX_RECT = { x: 309.94, y: 236.719, width: 850.021, height: 333.5 }
const DRAW_DURATION = 3.35
const DRAW_STAGGER = 0.54

type GlassSignatureProps = {
  className?: string
}

type Ripple = {
  id: number
  x: number
  y: number
}

export function GlassSignature({ className = '' }: GlassSignatureProps) {
  const reduced = useReducedMotion()
  const rawId = useId().replaceAll(':', '')
  const filterId = `signature-glass-${rawId}`
  const maskId = `signature-mask-${rawId}`
  const rippleGradientId = `signature-ripple-${rawId}`
  const rippleFilterId = `signature-ripple-filter-${rawId}`
  const rippleIdRef = useRef(0)
  const [paths, setPaths] = useState<string[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])

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

  const createRipple = (event: React.PointerEvent<SVGSVGElement>) => {
    if (reduced) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = VIEW_BOX_RECT.x + ((event.clientX - rect.left) / rect.width) * VIEW_BOX_RECT.width
    const y = VIEW_BOX_RECT.y + ((event.clientY - rect.top) / rect.height) * VIEW_BOX_RECT.height
    const id = rippleIdRef.current++

    setRipples((current) => [...current, { id, x, y }].slice(-4))
    window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id))
    }, 980)
  }

  return (
    <motion.svg
      className={`glass-signature ${className}`.trim()}
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMid meet"
      initial={{ opacity: 0.92 }}
      animate={{ opacity: reduced ? 0.8 : 1 }}
      onPointerEnter={createRipple}
      aria-label="Feichuan signature"
    >
      <defs>
        <radialGradient id={rippleGradientId}>
          <stop offset="0%" stopColor="white" stopOpacity="0.34" />
          <stop offset="52%" stopColor="#dff6ff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id={rippleFilterId} x="-20%" y="-40%" width="140%" height="180%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.07" numOctaves="2" seed="17" result="rippleNoise" />
          <feDisplacementMap in="SourceGraphic" in2="rippleNoise" scale="4.4" xChannelSelector="R" yChannelSelector="B" />
          <feGaussianBlur stdDeviation="0.18" />
        </filter>
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
      <g className="glass-signature__ripples" mask={`url(#${maskId})`} filter={`url(#${rippleFilterId})`}>
        {ripples.map((ripple) => (
          <g key={ripple.id}>
            <motion.circle
              className="glass-signature__ripple-fill"
              cx={ripple.x}
              cy={ripple.y}
              r="12"
              fill={`url(#${rippleGradientId})`}
              initial={{ scale: 0.24, opacity: 0.58 }}
              animate={{ scale: 8.4, opacity: 0 }}
              transition={{ duration: 0.92, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.circle
              className="glass-signature__ripple-ring"
              cx={ripple.x}
              cy={ripple.y}
              r="12"
              initial={{ scale: 0.35, opacity: 0.68 }}
              animate={{ scale: 7.6, opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </g>
        ))}
      </g>
      <rect className="glass-signature__backdrop" {...VIEW_BOX_RECT} mask={`url(#${maskId})`} />
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
    tone === 'red' ? 'translate(1.05 0.25)' : tone === 'blue' ? 'translate(-1.05 -0.25)' : undefined

  return (
    <motion.path
      className={className}
      d={d}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      transform={transform}
      initial={reduced ? { pathLength: 1, opacity: tone ? 0.18 : 0.86 } : { pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: tone === 'spark' ? 0.38 : tone ? 0.2 : 0.9 }}
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
      <section className="signature-scroll-copy signature-scroll-copy--middle" aria-label="Glass signature notes">
        <p>Refraction follows the ink path.</p>
        <p>Dappled light keeps moving underneath.</p>
      </section>
      <section className="signature-scroll-copy signature-scroll-copy--end" aria-label="Glass signature ending">
        <p>The mark stays glassy while the page keeps breathing.</p>
      </section>
    </main>
  )
}

function DappledLight({ reduced }: { reduced: boolean }) {
  return (
    <Canvas
      className="dappled-canvas"
      orthographic
      camera={{ position: [0, 0, 10], zoom: 100 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <DappledScene reduced={reduced} />
      </Suspense>
    </Canvas>
  )
}

const dappledVertex = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const dappledFragment = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uWind;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.52;
    mat2 rot = mat2(0.82, -0.57, 0.57, 0.82);
    for (int i = 0; i < 5; i++) {
      value += amp * noise(p);
      p = rot * p * 2.05 + 11.7;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv;
    p.x *= uResolution.x / uResolution.y;

    float t = uTime * uWind;
    vec2 driftA = vec2(t * 0.045, sin(t * 0.35) * 0.08);
    vec2 driftB = vec2(-t * 0.028, cos(t * 0.22) * 0.06);

    float canopyA = fbm(p * 3.2 + driftA);
    float canopyB = fbm(p * 6.0 + driftB);
    float leafMask = canopyA * 0.72 + canopyB * 0.38;
    float sunPatches = pow(smoothstep(0.62, 0.78, leafMask), 1.7);

    float vignette = smoothstep(0.92, 0.18, distance(uv, vec2(0.58, 0.44)));
    float caustic = fbm(p * 13.0 + vec2(t * 0.09, -t * 0.04));
    sunPatches *= mix(0.86, 1.16, caustic) * vignette;

    vec3 ground = mix(vec3(0.67, 0.55, 0.35), vec3(0.86, 0.78, 0.58), uv.y);
    vec3 shade = vec3(0.30, 0.36, 0.22);
    vec3 sun = vec3(1.0, 0.86, 0.50);

    vec3 color = mix(ground * shade, ground, 0.56);
    color = mix(color, sun, clamp(sunPatches, 0.0, 1.0));
    color += vec3(1.0, 0.65, 0.22) * sunPatches * 0.22;
    color *= 0.9 + 0.1 * noise(uv * uResolution.xy * 0.55);

    gl_FragColor = vec4(color, 1.0);
  }
`

function DappledScene({ reduced }: { reduced: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size, viewport } = useThree()

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uTime.value = reduced ? 0 : clock.elapsedTime
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height)
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={dappledVertex}
        fragmentShader={dappledFragment}
        depthWrite={false}
        transparent
        uniforms={{
          uResolution: { value: new THREE.Vector2(size.width, size.height) },
          uTime: { value: 0 },
          uWind: { value: 0.25 },
        }}
      />
    </mesh>
  )
}
