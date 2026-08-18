import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { IMPASTO_FRAGMENT, IMPASTO_VERTEX } from './impastoShader'

export type StampMeshHandle = {
  requestRender: () => void
  renderNow: () => void
}

export type TextureSource = string | HTMLCanvasElement

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
  albedoUrl: TextureSource | null
  heightUrl: TextureSource | null
  width: number
  height: number
  live: ShaderLive
  className?: string
  displayWidth: number
  active?: boolean
  fluidWidth?: boolean
  /** 把 canvas 挂到票卡 shader 层；为空则留在组件自己的壳里。 */
  slot?: HTMLElement | null
  /** 换票时重置显影插值。 */
  stampKey?: string
  /** 贴图已绑、canvas 已挂上并画完第一帧。 */
  onPresented?: () => void
}

type Engine = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.Camera
  uniforms: ReturnType<typeof createUniforms>
  material: THREE.ShaderMaterial
  mesh: THREE.Mesh
  canvas: HTMLCanvasElement
  albedoTex: THREE.Texture | null
  heightTex: THREE.Texture | null
  dummyAlbedo: THREE.Texture
  dummyHeight: THREE.Texture
  disposed: boolean
  raf: number
  lastFrame: number
  start: number
  revealCurrent: number
  revealFrom: number
  revealTarget: number
  revealStartedAt: number
}

function createUniforms(width: number, height: number) {
  return {
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
  }
}

function loadTexture(source: TextureSource, loader: THREE.TextureLoader | null) {
  if (typeof source !== 'string') {
    return Promise.resolve(new THREE.CanvasTexture(source))
  }
  if (!loader) return Promise.reject(new Error('TextureLoader missing'))
  return loader.loadAsync(source)
}

function applyTextureFlags(albedo: THREE.Texture, heightMap: THREE.Texture) {
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.generateMipmaps = true
  albedo.minFilter = THREE.LinearMipmapLinearFilter
  albedo.magFilter = THREE.LinearFilter
  heightMap.colorSpace = THREE.NoColorSpace
  heightMap.generateMipmaps = false
  heightMap.minFilter = THREE.LinearFilter
  heightMap.magFilter = THREE.LinearFilter
}

function maxDprFor(displayWidth: number) {
  return Math.min(window.devicePixelRatio, displayWidth >= 300 ? 1.5 : 1.2)
}

function resetReveal(engine: Engine, live: ShaderLive, now: number) {
  const target = live.reveal
  engine.revealCurrent = target >= 0.999 && live.revealDuration > 0 ? 0 : target
  engine.revealFrom = engine.revealCurrent
  engine.revealTarget = target
  engine.revealStartedAt = now
}

function isCanvasTex(tex: THREE.Texture | null, source: HTMLCanvasElement) {
  return tex instanceof THREE.CanvasTexture && tex.image === source
}

/** 现成 canvas 贴图同步绑上，避免第一帧还是 dummy / 上一张票。 */
function bindCanvasTextures(
  engine: Engine,
  albedoSource: TextureSource | null,
  heightSource: TextureSource | null,
) {
  if (!albedoSource || !heightSource) return false
  if (typeof albedoSource === 'string' || typeof heightSource === 'string') return false

  const albedo = isCanvasTex(engine.albedoTex, albedoSource)
    ? engine.albedoTex!
    : new THREE.CanvasTexture(albedoSource)
  const heightMap = isCanvasTex(engine.heightTex, heightSource)
    ? engine.heightTex!
    : new THREE.CanvasTexture(heightSource)

  if (engine.albedoTex !== albedo || engine.heightTex !== heightMap) {
    applyTextureFlags(albedo, heightMap)
  }
  if (engine.albedoTex !== albedo) {
    engine.albedoTex?.dispose()
    engine.albedoTex = albedo
    engine.uniforms.uAlbedo.value = albedo
  }
  if (engine.heightTex !== heightMap) {
    engine.heightTex?.dispose()
    engine.heightTex = heightMap
    engine.uniforms.uHeight.value = heightMap
  }
  return true
}

function paint(engine: Engine, live: ShaderLive, now: number) {
  if (engine.disposed) return false

  if (Math.abs(live.reveal - engine.revealTarget) > 0.0001) {
    engine.revealFrom = engine.revealCurrent
    engine.revealTarget = live.reveal
    engine.revealStartedAt = now
  }
  if (live.revealDuration <= 0) {
    engine.revealCurrent = engine.revealTarget
  } else {
    const p = Math.min(1, (now - engine.revealStartedAt) / (live.revealDuration * 1000))
    const eased = 1 - Math.pow(1 - p, 3)
    engine.revealCurrent = engine.revealFrom + (engine.revealTarget - engine.revealFrom) * eased
  }

  const uniforms = engine.uniforms
  uniforms.uTime.value = (now - engine.start) / 1000
  uniforms.uIntensity.value = live.intensity
  uniforms.uLightUV.value.set(live.lightUV.x, 1 - live.lightUV.y)
  uniforms.uReveal.value = engine.revealCurrent
  uniforms.uBumpScale.value = live.bumpScale
  uniforms.uFoil.value = live.foil
  uniforms.uGlitter.value = live.glitter
  uniforms.uGlitterDensity.value = live.glitterDensity
  uniforms.uGlitterSharpness.value = live.glitterSharpness
  uniforms.uDapple.value = live.dapple
  uniforms.uFrost.value = live.frost
  uniforms.uFrostSharpness.value = live.frostSharpness
  uniforms.uMicroGrain.value = live.microGrain
  uniforms.uMicroGrainScale.value = live.microGrainScale
  uniforms.uFoilSharpness.value = live.foilSharpness
  uniforms.uHoloBands.value = live.holoBands
  uniforms.uLightHeight.value = live.lightHeight
  uniforms.uLightRadius.value = live.lightRadius
  uniforms.uAmbient.value = live.ambient
  uniforms.uKeyLight.value = live.keyLight
  uniforms.uBurnNoise.value = live.burnNoise
  uniforms.uBurnDetailScale.value = live.burnDetailScale
  uniforms.uBurnDetailMix.value = live.burnDetailMix
  uniforms.uBurnBite.value = live.burnBite
  uniforms.uBurnBiteThreshold.value = live.burnBiteThreshold
  uniforms.uBurnWarp.value = live.burnWarp
  uniforms.uBurnDirection.value = live.burnDirection
  uniforms.uBurnEdge.value = live.burnEdge
  uniforms.uBurnGlow.value = live.burnGlow
  uniforms.uBurnShadow.value = live.burnShadow
  uniforms.uBurnGrain.value = live.burnGrain
  uniforms.uBurnDrift.value = live.burnDrift
  engine.renderer.render(engine.scene, engine.camera)
  engine.lastFrame = now
  return Math.abs(engine.revealCurrent - engine.revealTarget) > 0.001
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
    slot = null,
    stampKey = '',
    onPresented,
  },
  ref,
) {
  const homeRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const stateRef = useRef(live)
  const activeRef = useRef(active)
  const requestRenderRef = useRef<(() => void) | null>(null)
  const renderNowRef = useRef<(() => void) | null>(null)
  const classNameRef = useRef(className)
  const fluidWidthRef = useRef(fluidWidth)
  const stampKeyRef = useRef(stampKey)
  const onPresentedRef = useRef(onPresented)
  stateRef.current = live
  activeRef.current = active
  classNameRef.current = className
  fluidWidthRef.current = fluidWidth
  onPresentedRef.current = onPresented

  useImperativeHandle(
    ref,
    () => ({
      requestRender: () => requestRenderRef.current?.(),
      renderNow: () => renderNowRef.current?.(),
    }),
    [],
  )

  const displayHeight = displayWidth * (height / width)
  const sizeRef = useRef({ displayWidth, displayHeight, width, height })
  sizeRef.current = { displayWidth, displayHeight, width, height }

  useLayoutEffect(() => {
    const home = homeRef.current
    if (!home) return

    const canvas = document.createElement('canvas')
    canvas.className = classNameRef.current ?? 'stamp-canvas'
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = fluidWidthRef.current ? 'auto' : '100%'
    home.appendChild(canvas)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      // 挪 DOM 时浏览器会清 drawing buffer；留住上一帧，避免空 canvas 闪一下
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    })
    renderer.sortObjects = false
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(maxDprFor(displayWidth))
    renderer.setSize(displayWidth, displayHeight, false)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
    camera.position.z = 1

    const uniforms = createUniforms(width, height)
    const dummyAlbedo = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
    dummyAlbedo.needsUpdate = true
    const dummyHeight = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1)
    dummyHeight.needsUpdate = true
    uniforms.uAlbedo.value = dummyAlbedo
    uniforms.uHeight.value = dummyHeight

    const material = new THREE.ShaderMaterial({
      vertexShader: IMPASTO_VERTEX,
      fragmentShader: IMPASTO_FRAGMENT,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    mesh.frustumCulled = false
    scene.add(mesh)

    const start = performance.now()
    const engine: Engine = {
      renderer,
      scene,
      camera,
      uniforms,
      material,
      mesh,
      canvas,
      albedoTex: null,
      heightTex: null,
      dummyAlbedo,
      dummyHeight,
      disposed: false,
      raf: 0,
      lastFrame: 0,
      start,
      revealCurrent: 0,
      revealFrom: 0,
      revealTarget: 0,
      revealStartedAt: start,
    }
    resetReveal(engine, stateRef.current, start)
    engineRef.current = engine

    const loop = (now: number) => {
      if (engine.disposed) return
      if (now - engine.lastFrame < 1000 / 60) {
        engine.raf = requestAnimationFrame(loop)
        return
      }
      engine.raf = 0
      if (paint(engine, stateRef.current, now)) {
        engine.raf = requestAnimationFrame(loop)
      }
    }

    requestRenderRef.current = () => {
      if (engine.disposed || engine.raf !== 0) return
      engine.raf = requestAnimationFrame(loop)
    }
    renderNowRef.current = () => {
      if (engine.disposed) return
      const keep = paint(engine, stateRef.current, performance.now())
      if (keep && engine.raf === 0) engine.raf = requestAnimationFrame(loop)
    }

    renderer.compile(scene, camera)
    paint(engine, stateRef.current, start)

    return () => {
      engine.disposed = true
      requestRenderRef.current = null
      renderNowRef.current = null
      cancelAnimationFrame(engine.raf)
      material.dispose()
      mesh.geometry.dispose()
      engine.albedoTex?.dispose()
      engine.heightTex?.dispose()
      dummyAlbedo.dispose()
      dummyHeight.dispose()
      renderer.dispose()
      canvas.remove()
      engineRef.current = null
    }
    // Renderer is created once. Size, textures and slot are patched below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    const engine = engineRef.current
    const home = homeRef.current
    if (!engine || engine.disposed) return

    bindCanvasTextures(engine, albedoUrl, heightUrl)

    const size = sizeRef.current
    engine.renderer.setPixelRatio(maxDprFor(size.displayWidth))
    engine.renderer.setSize(size.displayWidth, size.displayHeight, false)
    engine.uniforms.uResolution.value.set(size.width, size.height)

    if (stampKey && stampKey !== stampKeyRef.current) {
      resetReveal(engine, stateRef.current, performance.now())
    }
    stampKeyRef.current = stampKey

    const dest = slot && document.contains(slot) ? slot : home
    if (dest && engine.canvas.parentElement !== dest) dest.appendChild(engine.canvas)
    if (classNameRef.current) engine.canvas.className = classNameRef.current

    // 先换贴图、再挪节点、再同步画一帧。浏览器清 buffer 也赶在 paint 前补上。
    if (activeRef.current || slot) renderNowRef.current?.()
    if (slot) onPresentedRef.current?.()
  }, [slot, albedoUrl, heightUrl, stampKey, displayWidth, displayHeight, width, height])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine || engine.disposed) return
    if (!albedoUrl || !heightUrl) return
    if (typeof albedoUrl !== 'string' && typeof heightUrl !== 'string') return

    let cancelled = false
    const loader = new THREE.TextureLoader()

    Promise.all([loadTexture(albedoUrl, loader), loadTexture(heightUrl, loader)]).then(
      ([albedo, heightMap]) => {
        if (cancelled || engine.disposed) {
          albedo.dispose()
          heightMap.dispose()
          return
        }
        applyTextureFlags(albedo, heightMap)
        engine.albedoTex?.dispose()
        engine.heightTex?.dispose()
        engine.albedoTex = albedo
        engine.heightTex = heightMap
        engine.uniforms.uAlbedo.value = albedo
        engine.uniforms.uHeight.value = heightMap
        renderNowRef.current?.()
      },
    )

    return () => {
      cancelled = true
    }
  }, [albedoUrl, heightUrl])

  useEffect(() => {
    if (active) requestRenderRef.current?.()
  }, [active, live])

  return (
    <div
      ref={homeRef}
      className={slot ? undefined : className}
      style={
        slot
          ? undefined
          : fluidWidth
            ? { width: '100%', height: 'auto', aspectRatio: `${width} / ${height}`, display: 'block' }
            : { width: displayWidth, height: displayHeight, display: 'block' }
      }
    />
  )
})
