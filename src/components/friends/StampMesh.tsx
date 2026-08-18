import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { IMPASTO_FRAGMENT, IMPASTO_VERTEX } from './impastoShader'

export type StampMeshHandle = {
  requestRender: () => void
}

type TextureSource = string | HTMLCanvasElement

function loadTexture(source: TextureSource, loader: THREE.TextureLoader | null) {
  if (typeof source !== 'string') {
    return Promise.resolve(new THREE.CanvasTexture(source))
  }
  if (!loader) {
    return Promise.reject(new Error('TextureLoader missing'))
  }
  return loader.loadAsync(source)
}

export type ShaderLive = {
  intensity: number
  lightUV: { x: number; y: number }
  reveal: number
  revealDuration: number
  bumpScale: number
  foil: number
  glitter: number
  glitterDensity: number
  glitterSharpness: number
  dapple: number
  frost: number
  frostSharpness: number
  microGrain: number
  microGrainScale: number
  foilSharpness: number
  holoBands: number
  lightHeight: number
  lightRadius: number
  ambient: number
  keyLight: number
  burnNoise: number
  burnDetailScale: number
  burnDetailMix: number
  burnBite: number
  burnBiteThreshold: number
  burnWarp: number
  burnDirection: number
  burnEdge: number
  burnGlow: number
  burnShadow: number
  burnGrain: number
  burnDrift: number
}

type Props = {
  albedoUrl: TextureSource
  heightUrl: TextureSource
  width: number
  height: number
  live: ShaderLive
  className?: string
  displayWidth: number
  /** Inactive instances compile once, then remain fully demand-driven. */
  active?: boolean
  /** CSS follows the animated parent width while render resolution stays stable. */
  fluidWidth?: boolean
}

/** Single-plane WebGL stamp: sand-grit + foil + organic reveal seam. */
export const StampMesh = forwardRef<StampMeshHandle, Props>(function StampMesh(
  {
    albedoUrl,
    heightUrl,
    width,
    height,
    live,
    className,
    displayWidth,
    active = true,
    fluidWidth = false,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(live)
  const activeRef = useRef(active)
  const requestRenderRef = useRef<(() => void) | null>(null)
  stateRef.current = live
  activeRef.current = active

  useImperativeHandle(
    ref,
    () => ({
      requestRender: () => requestRenderRef.current?.(),
    }),
    [],
  )

  const displayHeight = displayWidth * (height / width)

  useEffect(() => {
    if (active) requestRenderRef.current?.()
  }, [active, live])

  const uniforms = useMemo(
    () => ({
      uAlbedo: { value: null as THREE.Texture | null },
      uHeight: { value: null as THREE.Texture | null },
      uResolution: { value: new THREE.Vector2(width, height) },
      uLightUV: { value: new THREE.Vector2(0.5, 0.5) },
      uIntensity: { value: 0 },
      uBumpScale: { value: 1.85 },
      uTime: { value: 0 },
      uDapple: { value: 0.55 },
      uFoil: { value: 1.0 },
      uGlitter: { value: 0.52 },
      uGlitterDensity: { value: 0.58 },
      uGlitterSharpness: { value: 78 },
      uFrost: { value: 0.24 },
      uFrostSharpness: { value: 15 },
      uMicroGrain: { value: 0.16 },
      uMicroGrainScale: { value: 1.35 },
      uFoilSharpness: { value: 56 },
      uHoloBands: { value: 1 },
      uLightHeight: { value: 0.68 },
      uLightRadius: { value: 0.19 },
      uAmbient: { value: 0.78 },
      uKeyLight: { value: 0.45 },
      uReveal: { value: 0 },
      uBurnNoise: { value: 3.4 },
      uBurnDetailScale: { value: 9 },
      uBurnDetailMix: { value: 0.24 },
      uBurnBite: { value: 0.26 },
      uBurnBiteThreshold: { value: 0.62 },
      uBurnWarp: { value: 0.055 },
      uBurnDirection: { value: 0.08 },
      uBurnEdge: { value: 0.052 },
      uBurnGlow: { value: 0.42 },
      uBurnShadow: { value: 0.14 },
      uBurnGrain: { value: 0.48 },
      uBurnDrift: { value: 0.12 },
    }),
    [width, height],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      // discard + MSAA 互相抵消，关抗锯齿不改票面，省一层多重采样。
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    })
    renderer.sortObjects = false
    const maxDpr = displayWidth >= 300 ? 1.5 : 1.2
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr))
    renderer.setSize(displayWidth, displayHeight, false)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
    camera.position.z = 1

    const loader =
      typeof albedoUrl === 'string' || typeof heightUrl === 'string'
        ? new THREE.TextureLoader()
        : null
    let disposed = false
    let albedoTex: THREE.Texture | null = null
    let heightTex: THREE.Texture | null = null
    let material: THREE.ShaderMaterial | null = null
    let mesh: THREE.Mesh | null = null
    let raf = 0
    let lastFrame = 0
    const start = performance.now()
    const initialTarget = stateRef.current.reveal
    let revealCurrent = initialTarget >= 0.999 && stateRef.current.revealDuration > 0 ? 0 : initialTarget
    let revealFrom = revealCurrent
    let revealTarget = initialTarget
    let revealStartedAt = start

    Promise.all([loadTexture(albedoUrl, loader), loadTexture(heightUrl, loader)]).then(
      ([albedo, heightMap]) => {
        if (disposed) {
          albedo.dispose()
          heightMap.dispose()
          return
        }
        albedo.colorSpace = THREE.SRGBColorSpace
        albedo.generateMipmaps = true
        albedo.minFilter = THREE.LinearMipmapLinearFilter
        albedo.magFilter = THREE.LinearFilter
        heightMap.colorSpace = THREE.NoColorSpace
        heightMap.generateMipmaps = false
        heightMap.minFilter = THREE.LinearFilter
        heightMap.magFilter = THREE.LinearFilter

        albedoTex = albedo
        heightTex = heightMap
        uniforms.uAlbedo.value = albedo
        uniforms.uHeight.value = heightMap

        material = new THREE.ShaderMaterial({
          vertexShader: IMPASTO_VERTEX,
          fragmentShader: IMPASTO_FRAGMENT,
          uniforms,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        })

        const geo = new THREE.PlaneGeometry(1, 1)
        mesh = new THREE.Mesh(geo, material)
        mesh.frustumCulled = false
        scene.add(mesh)

        const loop = (now: number) => {
          if (disposed) return

          // Reveal/fire-edge motion needs 60 fps. Rendering still stops entirely
          // after it settles, so this does not restore a permanent frame loop.
          if (now - lastFrame < 1000 / 60) {
            raf = requestAnimationFrame(loop)
            return
          }
          lastFrame = now
          raf = 0
          const s = stateRef.current

          if (Math.abs(s.reveal - revealTarget) > 0.0001) {
            revealFrom = revealCurrent
            revealTarget = s.reveal
            revealStartedAt = now
          }
          if (s.revealDuration <= 0) {
            revealCurrent = revealTarget
          } else {
            const p = Math.min(1, (now - revealStartedAt) / (s.revealDuration * 1000))
            const eased = 1 - Math.pow(1 - p, 3)
            revealCurrent = revealFrom + (revealTarget - revealFrom) * eased
          }

          uniforms.uTime.value = (now - start) / 1000
          uniforms.uIntensity.value = s.intensity
          uniforms.uLightUV.value.set(s.lightUV.x, 1 - s.lightUV.y)
          uniforms.uReveal.value = revealCurrent
          uniforms.uBumpScale.value = s.bumpScale
          uniforms.uFoil.value = s.foil
          uniforms.uGlitter.value = s.glitter
          uniforms.uGlitterDensity.value = s.glitterDensity
          uniforms.uGlitterSharpness.value = s.glitterSharpness
          uniforms.uDapple.value = s.dapple
          uniforms.uFrost.value = s.frost
          uniforms.uFrostSharpness.value = s.frostSharpness
          uniforms.uMicroGrain.value = s.microGrain
          uniforms.uMicroGrainScale.value = s.microGrainScale
          uniforms.uFoilSharpness.value = s.foilSharpness
          uniforms.uHoloBands.value = s.holoBands
          uniforms.uLightHeight.value = s.lightHeight
          uniforms.uLightRadius.value = s.lightRadius
          uniforms.uAmbient.value = s.ambient
          uniforms.uKeyLight.value = s.keyLight
          uniforms.uBurnNoise.value = s.burnNoise
          uniforms.uBurnDetailScale.value = s.burnDetailScale
          uniforms.uBurnDetailMix.value = s.burnDetailMix
          uniforms.uBurnBite.value = s.burnBite
          uniforms.uBurnBiteThreshold.value = s.burnBiteThreshold
          uniforms.uBurnWarp.value = s.burnWarp
          uniforms.uBurnDirection.value = s.burnDirection
          uniforms.uBurnEdge.value = s.burnEdge
          uniforms.uBurnGlow.value = s.burnGlow
          uniforms.uBurnShadow.value = s.burnShadow
          uniforms.uBurnGrain.value = s.burnGrain
          uniforms.uBurnDrift.value = s.burnDrift
          renderer.render(scene, camera)

          // Keep drawing only while reveal is in flight. Pointer/parameter
          // changes explicitly request one new frame through requestRenderRef.
          if (Math.abs(revealCurrent - revealTarget) > 0.001) {
            raf = requestAnimationFrame(loop)
          }
        }

        requestRenderRef.current = () => {
          if (disposed || raf !== 0) return
          raf = requestAnimationFrame(loop)
        }

        // One idle frame compiles the program. Future frames are demand-only.
        renderer.compile(scene, camera)
        renderer.render(scene, camera)
        if (activeRef.current) requestRenderRef.current()
      },
    )

    return () => {
      disposed = true
      requestRenderRef.current = null
      cancelAnimationFrame(raf)
      material?.dispose()
      mesh?.geometry.dispose()
      albedoTex?.dispose()
      heightTex?.dispose()
      renderer.dispose()
    }
  }, [albedoUrl, heightUrl, displayWidth, displayHeight, uniforms])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={Math.round(displayWidth * Math.min(window.devicePixelRatio, displayWidth >= 300 ? 1.5 : 1.2))}
      height={Math.round(displayHeight * Math.min(window.devicePixelRatio, displayWidth >= 300 ? 1.5 : 1.2))}
      style={
        fluidWidth
          ? { width: '100%', height: 'auto', aspectRatio: `${width} / ${height}`, display: 'block' }
          : { width: displayWidth, height: displayHeight, display: 'block' }
      }
    />
  )
})
