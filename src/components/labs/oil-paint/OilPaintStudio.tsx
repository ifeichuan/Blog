import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import * as THREE from 'three'
import { OIL_PAINT_FRAGMENT, OIL_PAINT_VERTEX } from './oilPaintShader'
import {
  DEFAULT_PARAMS,
  PARAM_GROUPS,
  PRESETS,
  VIEW_MODE_INDEX,
  VIEW_MODES,
  type OilPaintParams,
  type ViewMode,
} from './params'
import './oil-paint-studio.css'

const SOURCES = [
  { id: 'portrait', label: '肖像 A', url: '/labs/oil-paint/portrait.jpg' },
  { id: 'color', label: '肖像 B', url: '/labs/oil-paint/portrait-color.jpg' },
] as const

function formatValue(key: keyof OilPaintParams, value: number) {
  if (key === 'strokeDirection') return `${Math.round(value)}°`
  if (key === 'colorLevels' || key === 'strokeScale' || key === 'canvasScale') {
    return String(Math.round(value))
  }
  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

function OilMesh({
  texture,
  params,
  viewMode,
  compare,
  lightUV,
}: {
  texture: THREE.Texture
  params: OilPaintParams
  viewMode: ViewMode
  compare: boolean
  lightUV: THREE.Vector2
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uResolution: { value: new THREE.Vector2(1024, 1024) },
      uLightUV: { value: new THREE.Vector2(0.38, 0.62) },
      uViewMode: { value: 0 },
      uCompare: { value: 0 },
      uStrokeScale: { value: params.strokeScale },
      uStrokeDirection: { value: 0 },
      uStrokeStrength: { value: params.strokeStrength },
      uStrokeAnisotropy: { value: params.strokeAnisotropy },
      uSmearStrength: { value: params.smearStrength },
      uSmearLength: { value: params.smearLength },
      uPaintThickness: { value: params.paintThickness },
      uPaintBump: { value: params.paintBump },
      uDisplacement: { value: params.displacement },
      uCanvasScale: { value: params.canvasScale },
      uCanvasBump: { value: params.canvasBump },
      uRoughness: { value: params.roughness },
      uSpecular: { value: params.specular },
      uColorLevels: { value: params.colorLevels },
    }),
    [texture],
  )

  useFrame(() => {
    const mat = materialRef.current
    if (!mat) return
    const u = mat.uniforms
    const img = texture.image as { width?: number; height?: number } | undefined
    u.uTexture.value = texture
    u.uResolution.value.set(img?.width ?? 1024, img?.height ?? 1024)
    u.uLightUV.value.copy(lightUV)
    u.uViewMode.value = VIEW_MODE_INDEX[viewMode]
    u.uCompare.value = compare ? 1 : 0
    u.uStrokeScale.value = params.strokeScale
    u.uStrokeDirection.value = (params.strokeDirection * Math.PI) / 180
    u.uStrokeStrength.value = params.strokeStrength
    u.uStrokeAnisotropy.value = params.strokeAnisotropy
    u.uSmearStrength.value = params.smearStrength
    u.uSmearLength.value = params.smearLength
    u.uPaintThickness.value = params.paintThickness
    u.uPaintBump.value = params.paintBump
    u.uDisplacement.value = params.displacement
    u.uCanvasScale.value = params.canvasScale
    u.uCanvasBump.value = params.canvasBump
    u.uRoughness.value = params.roughness
    u.uSpecular.value = params.specular
    u.uColorLevels.value = params.colorLevels
  })

  const aspect = useMemo(() => {
    const img = texture.image as { width?: number; height?: number } | undefined
    const w = img?.width ?? 3
    const h = img?.height ?? 4
    return w / Math.max(h, 1)
  }, [texture, texture.image])

  const scale = useMemo(() => {
    const viewAspect = viewport.width / Math.max(viewport.height, 0.001)
    const pad = 0.78
    if (aspect > viewAspect) {
      const w = viewport.width * pad
      return [w, w / aspect, 1] as const
    }
    const h = viewport.height * pad
    return [h * aspect, h, 1] as const
  }, [aspect, viewport.height, viewport.width])

  return (
    <group rotation={[-0.06, 0.1, 0.01]}>
      <mesh scale={[scale[0] * 1.05, scale[1] * 1.05, scale[0]]} position={[0, 0, -0.08]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#3a2416" />
      </mesh>
      <mesh scale={[scale[0] * 1.02, scale[1] * 1.02, scale[0]]} position={[0, 0, -0.05]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#cbb89a" />
      </mesh>
      <mesh scale={[scale[0], scale[1], scale[0]]}>
        <planeGeometry args={[1, 1, 220, 220]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={OIL_PAINT_VERTEX}
          fragmentShader={OIL_PAINT_FRAGMENT}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function Scene({
  url,
  params,
  viewMode,
  compare,
  lightUV,
}: {
  url: string
  params: OilPaintParams
  viewMode: ViewMode
  compare: boolean
  lightUV: THREE.Vector2
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let disposed = false
    let loaded: THREE.Texture | null = null
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    const apply = (tex: THREE.Texture) => {
      if (disposed) {
        tex.dispose()
        return
      }
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
      tex.wrapS = THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.needsUpdate = true
      loaded = tex
      setTexture(tex)
    }

    loader.load(url, apply, undefined, () => {
      const canvas = document.createElement('canvas')
      canvas.width = 900
      canvas.height = 1200
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const sky = ctx.createLinearGradient(0, 0, 0, 1200)
      sky.addColorStop(0, '#2a4d86')
      sky.addColorStop(1, '#142848')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, 900, 1200)
      ctx.fillStyle = '#d4a06a'
      ctx.beginPath()
      ctx.ellipse(450, 500, 230, 290, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3a2416'
      ctx.beginPath()
      ctx.ellipse(450, 250, 200, 90, 0, 0, Math.PI * 2)
      ctx.fill()
      apply(new THREE.CanvasTexture(canvas))
    })
    return () => {
      disposed = true
      loaded?.dispose()
    }
  }, [url])

  if (!texture) return null
  return (
    <OilMesh
      texture={texture}
      params={params}
      viewMode={viewMode}
      compare={compare}
      lightUV={lightUV}
    />
  )
}

export default function OilPaintStudio() {
  const [params, setParams] = useState<OilPaintParams>(DEFAULT_PARAMS)
  const [viewMode, setViewMode] = useState<ViewMode>('final')
  const [sourceId, setSourceId] = useState<string>('portrait')
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [compare, setCompare] = useState(false)
  const lightUV = useMemo(() => new THREE.Vector2(0.36, 0.64), [])

  const sourceUrl = customUrl ?? SOURCES.find((item) => item.id === sourceId)?.url ?? SOURCES[0].url

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault()
        setCompare(event.type === 'keydown')
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (customUrl) URL.revokeObjectURL(customUrl)
    }
  }, [customUrl])

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      lightUV.set(
        (event.clientX - rect.left) / Math.max(rect.width, 1),
        1 - (event.clientY - rect.top) / Math.max(rect.height, 1),
      )
    },
    [lightUV],
  )

  const onUpload = (file: File | undefined) => {
    if (!file) return
    if (customUrl) URL.revokeObjectURL(customUrl)
    setCustomUrl(URL.createObjectURL(file))
    setSourceId('upload')
  }

  const set = <K extends keyof OilPaintParams>(key: K, value: OilPaintParams[K]) => {
    setParams((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="oil-studio">
      <div
        className="oil-stage"
        onPointerMove={onPointerMove}
        onPointerDown={() => setCompare(true)}
        onPointerUp={() => setCompare(false)}
        onPointerLeave={() => setCompare(false)}
      >
        <header className="oil-mast">
          <a href="/labs">Labs</a>
          <h1>厚涂</h1>
          <p>底材、笔触、堆积、横向融化。不是一张噪声贴图，是四层材质叠在一张照片上。</p>
        </header>
        <div className="oil-stage-canvas">
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0.16, 0.07, 2.2], fov: 32, near: 0.1, far: 20 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            onCreated={({ gl, camera }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace
              camera.lookAt(0, 0, 0)
            }}
          >
            <Scene
              key={sourceUrl}
              url={sourceUrl}
              params={params}
              viewMode={viewMode}
              compare={compare}
              lightUV={lightUV}
            />
          </Canvas>
        </div>
        <p className="oil-compare">
          按住 <kbd>空格</kbd> 或画布看原图 · 鼠标是灯
        </p>
      </div>

      <aside className="oil-palette" aria-label="油画参数">
        <h2>调色桌</h2>
        <p className="oil-lead">先换图，再单独打开一层看它在做什么。</p>

        <div className="oil-sources">
          {SOURCES.map((source) => (
            <button
              key={source.id}
              type="button"
              className="oil-chip"
              data-on={sourceId === source.id && !customUrl ? 'true' : 'false'}
              onClick={() => {
                if (customUrl) {
                  URL.revokeObjectURL(customUrl)
                  setCustomUrl(null)
                }
                setSourceId(source.id)
              }}
            >
              {source.label}
            </button>
          ))}
          <label className="oil-upload">
            上传照片
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onUpload(event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="oil-layers">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className="oil-chip"
              data-on={viewMode === mode.id ? 'true' : 'false'}
              title={mode.hint}
              onClick={() => setViewMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="oil-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="oil-chip"
              onClick={() => setParams(preset.params)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {PARAM_GROUPS.map((group) => (
          <fieldset className="oil-group" key={group.title}>
            <legend>{group.title}</legend>
            <p className="oil-hint">{group.hint}</p>
            {group.controls.map((control) => (
              <label className="oil-control" key={control.key}>
                <span className="oil-control-head">
                  <strong>{control.label}</strong>
                  <em>{formatValue(control.key, params[control.key])}</em>
                </span>
                <small>{control.hint}</small>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={params[control.key]}
                  onChange={(event) => set(control.key, Number(event.target.value))}
                />
              </label>
            ))}
          </fieldset>
        ))}

        <div className="oil-actions">
          <button type="button" onClick={() => setParams(DEFAULT_PARAMS)}>
            恢复参考
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(JSON.stringify(params, null, 2))
            }}
          >
            复制参数
          </button>
        </div>
      </aside>
    </div>
  )
}
