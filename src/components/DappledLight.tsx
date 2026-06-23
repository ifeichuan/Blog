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
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

float leafMask(vec2 uv, float t) {
  vec2 p = uv * 3.2;
  p.x += sin(t * 0.12) * 0.3;
  p.y += cos(t * 0.08) * 0.2;
  float leaves = fbm(p + vec2(t * 0.02, t * 0.015));
  leaves = smoothstep(0.35, 0.65, leaves);
  return leaves;
}

float sunPatches(vec2 uv, float mask) {
  float sun = smoothstep(0.0, 1.0, 1.0 - mask);
  sun = pow(sun, 1.6);
  return sun;
}

void main() {
  vec2 uv = vUv;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  float t = u_time;
  float mask = leafMask(uv, t);
  float sun = sunPatches(uv, mask);

  vec3 ground = vec3(0.96, 0.94, 0.90);
  vec3 warm = vec3(1.0, 0.98, 0.88);
  vec3 shadow = vec3(0.88, 0.87, 0.83);

  vec3 col = mix(shadow, ground, sun);
  col = mix(col, warm, sun * 0.5);

  float caustic = noise(uv * 8.0 + t * 0.05);
  col += vec3(0.02, 0.015, 0.0) * caustic * sun;

  gl_FragColor = vec4(col, 1.0);
}
`

function DappledPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const uniformsRef = useRef({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  })

  useFrame((_, delta) => {
    uniformsRef.current.u_time.value += delta * 3.0
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniformsRef.current}
      />
    </mesh>
  )
}

export function DappledLight() {
  return (
    <div className="dappled-bg">
      <Canvas
        gl={{ antialias: false, alpha: false }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: '100%', height: '100%' }}
      >
        <DappledPlane />
      </Canvas>
    </div>
  )
}
