import { Canvas, useFrame } from '@react-three/fiber'
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

  vec3 ground = mix(vec3(0.67, 0.55, 0.35), vec3(0.86, 0.78, 0.58), uv.y);
  vec3 shade = vec3(0.30, 0.36, 0.22);
  vec3 sun = vec3(1.0, 0.86, 0.50);

  vec3 color = mix(ground * shade, ground, 0.56);
  color = mix(color, sun, clamp(sunPatches, 0.0, 1.0));
  color += vec3(1.0, 0.65, 0.22) * sunPatches * 0.22;
  gl_FragColor = vec4(color, 1.0);
}
`

function DappledPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        }}
      />
    </mesh>
  )
}

export function DappledLight() {
  return (
    <div className="dappled-bg">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: '100%', height: '100%' }}
      >
        <DappledPlane />
      </Canvas>
    </div>
  )
}
