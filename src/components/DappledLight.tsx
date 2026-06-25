import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float u_time;
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

void main() {
  vec2 uv = vUv;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 1.7;
  vec2 driftA = vec2(t * 0.045, sin(t * 0.35) * 0.08);
  vec2 driftB = vec2(-t * 0.028, cos(t * 0.22) * 0.06);

  float canopyA = fbm(p * 3.2 + driftA);
  float canopyB = fbm(p * 6.0 + driftB);
  float leafMask = canopyA * 0.72 + canopyB * 0.38;

  float sunPatches = smoothstep(0.62, 0.78, leafMask);
  sunPatches = pow(sunPatches, 1.7);

  float vignette = smoothstep(0.92, 0.18, distance(uv, vec2(0.58, 0.44)));
  float caustic = fbm(p * 13.0 + vec2(t * 0.09, -t * 0.04));
  sunPatches *= mix(0.86, 1.16, caustic) * vignette;

  vec3 ground = mix(u_ground1, u_ground2, uv.y);
  vec3 color = mix(ground * u_shade, ground, 0.56);
  color = mix(color, u_sun, clamp(sunPatches, 0.0, 1.0));
  color += u_sun * sunPatches * 0.22;
  gl_FragColor = vec4(color, 1.0);
}
`

export type ColorScheme = {
  ground1: [number, number, number]
  ground2: [number, number, number]
  shade: [number, number, number]
  sun: [number, number, number]
}

export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  forest: {
    ground1: [0.67, 0.55, 0.35],
    ground2: [0.86, 0.78, 0.58],
    shade: [0.30, 0.36, 0.22],
    sun: [1.0, 0.86, 0.50],
  },
  dawn: {
    ground1: [0.72, 0.55, 0.50],
    ground2: [0.92, 0.75, 0.65],
    shade: [0.35, 0.25, 0.30],
    sun: [1.0, 0.72, 0.55],
  },
  ocean: {
    ground1: [0.35, 0.52, 0.58],
    ground2: [0.60, 0.76, 0.82],
    shade: [0.18, 0.28, 0.35],
    sun: [0.85, 0.95, 1.0],
  },
  lavender: {
    ground1: [0.58, 0.48, 0.62],
    ground2: [0.80, 0.72, 0.85],
    shade: [0.28, 0.22, 0.35],
    sun: [0.95, 0.85, 1.0],
  },
  mono: {
    ground1: [0.88, 0.87, 0.85],
    ground2: [0.96, 0.95, 0.93],
    shade: [0.40, 0.40, 0.40],
    sun: [1.0, 1.0, 0.98],
  },
  sky: {
    ground1: [0.55, 0.72, 0.88],
    ground2: [0.78, 0.88, 0.96],
    shade: [0.32, 0.45, 0.62],
    sun: [1.0, 0.98, 0.92],
  },
}

type DappledPlaneProps = { scheme: ColorScheme }

export function DappledPlane({ scheme }: DappledPlaneProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (!matRef.current) return
    matRef.current.uniforms.u_time.value = state.clock.elapsedTime
    matRef.current.uniforms.u_ground1.value.set(...scheme.ground1)
    matRef.current.uniforms.u_ground2.value.set(...scheme.ground2)
    matRef.current.uniforms.u_shade.value.set(...scheme.shade)
    matRef.current.uniforms.u_sun.value.set(...scheme.sun)
  })

  return (
    <mesh renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        depthWrite={false}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          u_ground1: { value: new THREE.Vector3(...scheme.ground1) },
          u_ground2: { value: new THREE.Vector3(...scheme.ground2) },
          u_shade: { value: new THREE.Vector3(...scheme.shade) },
          u_sun: { value: new THREE.Vector3(...scheme.sun) },
        }}
      />
    </mesh>
  )
}


