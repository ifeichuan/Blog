import { createPortal, Canvas, useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { ColorScheme } from './DappledLight'
import { DappledPcssScene } from './DappledPcss'
import { PixelMouseScene } from './PixelMouse3D'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float u_time;
uniform float u_progress;
uniform sampler2D u_pcss;
uniform vec2 u_resolution;
uniform vec3 u_ground1;
uniform vec3 u_ground2;
uniform vec3 u_shade;
uniform vec3 u_sun;
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

vec3 fbmColor(vec2 uv) {
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;
  float t = u_time * 1.7;
  float canopyA = fbm(p * 3.2 + vec2(t * 0.045, sin(t * 0.35) * 0.08));
  float canopyB = fbm(p * 6.0 + vec2(-t * 0.028, cos(t * 0.22) * 0.06));
  float leafMask = canopyA * 0.72 + canopyB * 0.38;
  float sunPatches = pow(smoothstep(0.62, 0.78, leafMask), 1.7);
  float vignette = smoothstep(0.92, 0.18, distance(uv, vec2(0.58, 0.44)));
  float caustic = fbm(p * 13.0 + vec2(t * 0.09, -t * 0.04));
  sunPatches *= mix(0.86, 1.16, caustic) * vignette;
  vec3 ground = mix(u_ground1, u_ground2, uv.y);
  vec3 color = mix(ground * u_shade, ground, 0.56);
  color = mix(color, u_sun, clamp(sunPatches, 0.0, 1.0));
  return color + u_sun * sunPatches * 0.22;
}

void main() {
  vec2 uv = vUv;
  float progress = clamp(u_progress, 0.0, 1.0);
  float fieldA = fbm(uv * 3.4 + vec2(progress * 0.7, -progress * 0.35));
  float fieldB = noise(uv * 9.0 + vec2(-progress * 1.4, progress));
  float field = clamp(fieldA * 0.76 + fieldB * 0.24, 0.08, 0.92);
  float reveal = smoothstep(field - 0.045, field + 0.045, progress);
  float transformStrength = sin(progress * 3.14159265);
  vec2 warp = vec2(
    noise(uv * 5.0 + vec2(2.7, progress)),
    noise(uv * 5.0 + vec2(-4.1, -progress))
  ) - 0.5;
  vec2 pcssUv = clamp(uv + warp * 0.055 * transformStrength, 0.0, 1.0);
  vec3 oldLight = fbmColor(uv - warp * 0.025 * transformStrength);
  vec3 newLight = texture2D(u_pcss, pcssUv).rgb;
  newLight = sRGBTransferOETF(vec4(ACESFilmicToneMapping(newLight), 1.0)).rgb;
  float seam = 1.0 - smoothstep(0.0, 0.045, abs(progress - field));
  vec3 color = mix(oldLight, newLight, reveal);
  color += seam * transformStrength * vec3(0.035, 0.032, 0.026);
  gl_FragColor = vec4(color, 1.0);
}
`

type GlobalSceneProps = {
  play: boolean
  progressRef: MutableRefObject<number>
  scheme: ColorScheme
  onBackgroundReady?: () => void
  onMouseAssetsReady?: () => void
  onInvalidateReady?: (invalidate: () => void) => void
}

function GlobalScene({
  play,
  progressRef,
  scheme,
  onBackgroundReady,
  onMouseAssetsReady,
  onInvalidateReady,
}: GlobalSceneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const backgroundReadyRef = useRef(false)
  const pcssReadyRef = useRef(false)
  const lastPcssFrameRef = useRef(-Infinity)
  const pcssScene = useMemo(() => new THREE.Scene(), [])
  const pcssCamera = useMemo(() => new THREE.PerspectiveCamera(10.5, 1, 0.1, 1000), [])
  const target = useFBO({ depthBuffer: true, stencilBuffer: false, samples: 0 })
  const invalidate = useThree((state) => state.invalidate)
  const size = useThree((state) => state.size)

  useEffect(() => onInvalidateReady?.(invalidate), [invalidate, onInvalidateReady])

  useEffect(() => {
    pcssCamera.aspect = size.width / size.height
    pcssCamera.position.set(-18.375, 21, 0)
    pcssCamera.lookAt(0, 0, 0)
    pcssCamera.updateProjectionMatrix()
  }, [pcssCamera, size.height, size.width])

  useFrame(({ clock, gl }) => {
    const progress = progressRef.current
    const material = materialRef.current
    if (material) {
      material.uniforms.u_time.value = clock.elapsedTime
      material.uniforms.u_progress.value = progress
      material.uniforms.u_resolution.value.set(size.width, size.height)
      material.uniforms.u_ground1.value.set(...scheme.ground1)
      material.uniforms.u_ground2.value.set(...scheme.ground2)
      material.uniforms.u_shade.value.set(...scheme.shade)
      material.uniforms.u_sun.value.set(...scheme.sun)
    }

    const shouldRenderPcss = !pcssReadyRef.current || progress > 0.015
    if (shouldRenderPcss && clock.elapsedTime - lastPcssFrameRef.current >= 1 / 20) {
      lastPcssFrameRef.current = clock.elapsedTime
      gl.setRenderTarget(target)
      gl.clear()
      gl.render(pcssScene, pcssCamera)
      gl.setRenderTarget(null)
    }
  }, -1)

  return (
    <>
      {createPortal(
        <DappledPcssScene
          toneMapped={false}
          onReady={() => {
            pcssReadyRef.current = true
          }}
        />,
        pcssScene,
      )}
      <mesh
        renderOrder={-1000}
        frustumCulled={false}
        onAfterRender={() => {
          if (backgroundReadyRef.current || !pcssReadyRef.current) return
          backgroundReadyRef.current = true
          onBackgroundReady?.()
        }}
      >
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          depthTest={false}
          depthWrite={false}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            u_time: { value: 0 },
            u_progress: { value: 0 },
            u_pcss: { value: target.texture },
            u_resolution: { value: new THREE.Vector2(size.width, size.height) },
            u_ground1: { value: new THREE.Vector3(...scheme.ground1) },
            u_ground2: { value: new THREE.Vector3(...scheme.ground2) },
            u_shade: { value: new THREE.Vector3(...scheme.shade) },
            u_sun: { value: new THREE.Vector3(...scheme.sun) },
          }}
        />
      </mesh>
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 4, 3]} intensity={0.4} />
      <PixelMouseScene play={play} transitionProgressRef={progressRef} onReady={onMouseAssetsReady} />
    </>
  )
}

function FrameLimiter() {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    const id = setInterval(invalidate, 1000 / 30)
    return () => clearInterval(id)
  }, [invalidate])
  return null
}

export function GlobalVisualCanvas(props: GlobalSceneProps) {
  return (
    <Canvas
      frameloop="demand"
      camera={{ fov: 32, position: [0, 0, 10], near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      shadows
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <FrameLimiter />
      <GlobalScene {...props} />
    </Canvas>
  )
}
