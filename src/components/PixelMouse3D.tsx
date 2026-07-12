import { useEffect, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const baseRotZ = 0.785
const stickerUrls = [
  '/logo-stickers/chatgpt.svg',
  '/logo-stickers/css.svg',
  '/logo-stickers/javascript.svg',
  '/logo-stickers/react.svg',
  '/logo-stickers/tailwind.svg',
  '/logo-stickers/vue.svg',
]
const mouseBeforeLogoDelay = 0.75
const logoInDuration = 0.5
const logoGap = 0.15
const STICKER_SIZE = 128

// SVG 多无 width/height，TextureLoader 用 <img> 加载拿不到尺寸会得到空纹理；
// 这里 fetch 文本后补尺寸、转 blob 再 drawImage 栅格化到 canvas，保证内容能渲染。
function svgToStickerTexture(url: string): Promise<THREE.CanvasTexture> {
  return fetch(url)
    .then((r) => r.text())
    .then((svg) => {
      const sized = /<svg[^>]*\swidth=/.test(svg) ? svg : svg.replace(/<svg/, `<svg width="${STICKER_SIZE}" height="${STICKER_SIZE}"`)
      const blob = new Blob([sized], { type: 'image/svg+xml;charset=utf-8' })
      const blobUrl = URL.createObjectURL(blob)
      return new Promise<THREE.CanvasTexture>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const cv = document.createElement('canvas')
          cv.width = cv.height = STICKER_SIZE
          const ctx = cv.getContext('2d')!
          ctx.drawImage(img, 0, 0, STICKER_SIZE, STICKER_SIZE)
          URL.revokeObjectURL(blobUrl)
          const tex = new THREE.CanvasTexture(cv)
          tex.colorSpace = THREE.SRGBColorSpace
          resolve(tex)
        }
        img.onerror = (e) => { URL.revokeObjectURL(blobUrl); reject(e) }
        img.src = blobUrl
      })
    })
}

// 原 claude 贴纸：白边 + 橙色填充，保持原观感
function claudeStickerTexture(): Promise<THREE.CanvasTexture> {
  return fetch('/claudecode-color.svg')
    .then((r) => r.text())
    .then((svg) => {
      const d = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('path')?.getAttribute('d') || ''
      const cv = document.createElement('canvas')
      cv.width = cv.height = STICKER_SIZE
      const ctx = cv.getContext('2d')!
      ctx.save()
      ctx.scale(STICKER_SIZE / 24, STICKER_SIZE / 24)
      ctx.lineJoin = 'round'
      ctx.lineWidth = 1.0
      ctx.strokeStyle = '#ffffff'
      const p = new Path2D(d)
      ctx.stroke(p)
      ctx.fillStyle = '#D97757'
      ctx.fill(p, 'evenodd')
      ctx.restore()
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    })
}

function bendGeo(geo: THREE.PlaneGeometry) {
  const pos = geo.attributes.position as THREE.BufferAttribute
  const ax = 0.08 + Math.random() * 0.1
  const ay = 0.08 + Math.random() * 0.1
  const sign = Math.random() > 0.5 ? 1 : -1
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    pos.setZ(i, sign * (ax * x * x + ay * y * y))
  }
  geo.computeVertexNormals()
}

export function PixelMouseScene({
  play,
  transitionProgressRef,
  onReady,
}: {
  play: boolean
  transitionProgressRef?: MutableRefObject<number>
  onReady?: () => void
}) {
  const { scene, gl, camera, size } = useThree()
  const reduced = useReducedMotion()
  const reduce = reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches
  const desktop = matchMedia('(min-width: 768px)').matches

  const entryRef = useRef<THREE.Group>(null)
  const wrapperRef = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const logosRef = useRef<THREE.Mesh[]>([])
  const mouse = useRef({ x: 0, y: 0 })
  const baseY = useRef(0)
  const reduceRef = useRef(reduce)
  const playRef = useRef(play)
  const logoTlRef = useRef<gsap.core.Timeline | null>(null)
  const logoTimerRef = useRef<number | null>(null)

  useEffect(() => { reduceRef.current = reduce }, [reduce])

  useEffect(() => {
    playRef.current = play
    if (!play) return
    const entry = entryRef.current
    if (!entry) return
    entry.visible = true
    if (logoTimerRef.current) window.clearTimeout(logoTimerRef.current)
    logoTlRef.current?.pause(0)
    if (!reduceRef.current) {
      logoTimerRef.current = window.setTimeout(() => {
        logoTimerRef.current = null
        logoTlRef.current?.play()
      }, mouseBeforeLogoDelay * 1000)
    }
    entry.scale.set(1, 1, 1)
    entry.position.y = baseY.current
  }, [play])

  useEffect(() => {
    if (!desktop) {
      onReady?.()
      return
    }
    const wrapper = wrapperRef.current
    const entry = entryRef.current
    if (!wrapper || !entry) return
    let disposed = false
    let modelSettled = false
    let stickersSettled = false
    const reportReady = () => {
      if (!disposed && modelSettled && stickersSettled) onReady?.()
    }
    const settleModel = () => {
      modelSettled = true
      reportReady()
    }
    const settleStickers = () => {
      stickersSettled = true
      reportReady()
    }
    entry.visible = false
    entry.scale.set(1, 1, 1)

    const pmrem = new THREE.PMREMGenerator(gl)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / innerWidth - 0.5) * 2
      mouse.current.y = (e.clientY / innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)

    new GLTFLoader().load(
      '/pixel_art_mouse_cursor/scene.gltf',
      (gltf) => {
        if (disposed) return
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const sz = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const s = 2.2 / Math.hypot(sz.x, sz.y)
        model.scale.setScalar(s)
        model.position.set(-center.x * s, -center.y * s, -center.z * s)
        model.rotation.z = baseRotZ
        model.traverse((o) => {
          const mesh = o as THREE.Mesh
          const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] | undefined
          const apply = (m: THREE.MeshStandardMaterial) => {
            if (m.name === 'material_1') {
              m.metalness = 0.7
              m.roughness = 0.25
              m.envMapIntensity = 1.0
            } else {
              m.roughness = 0.45
            }
            m.needsUpdate = true
          }
          if (Array.isArray(mat)) mat.forEach(apply)
          else if (mat) apply(mat)
        })
        wrapper.add(model)
        modelRef.current = model
        settleModel()
      },
      undefined,
      (e) => {
        console.error('[PixelMouseScene] load failed', e)
        settleModel()
      },
    )

    const logos: THREE.Mesh[] = []
    const logoMats: THREE.MeshBasicMaterial[] = []
    const logoTextures: THREE.Texture[] = []
    const texturePromises: Promise<THREE.CanvasTexture>[] = [
      claudeStickerTexture(),
      ...stickerUrls.map((url) => svgToStickerTexture(url)),
    ]
    Promise.allSettled(texturePromises)
      .then((results) => {
        if (disposed) return
        const textures: THREE.CanvasTexture[] = []
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) textures.push(r.value)
        }
        if (!textures.length) {
          settleStickers()
          return
        }
        const tl = gsap.timeline({ paused: true })
        for (const texture of textures) {
          logoTextures.push(texture)
          const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide, depthWrite: false })
          mat.toneMapped = false
          logoMats.push(mat)
        }
        for (let i = 0; i < textures.length; i++) {
          const geo = new THREE.PlaneGeometry(1, 1, 5, 5)
          bendGeo(geo)
          const m = new THREE.Mesh(geo, logoMats[i])
          const target = 0.4 + Math.random() * 0.6
          m.scale.set(0, 0, 1)
          m.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4)
          m.userData = {
            base: m.position.clone(),
            target,
            sx: 0.2 + Math.random() * 0.5,
            sy: 0.2 + Math.random() * 0.5,
            sz: 0.1 + Math.random() * 0.3,
            rx: Math.random() * Math.PI * 2,
            ry: Math.random() * Math.PI * 2,
            rz: Math.random() * Math.PI * 2,
            amp: 0.8 + Math.random() * 1.2,
          }
          wrapper.add(m)
          logos.push(m)
          if (reduceRef.current) {
            m.scale.set(target, target, 1)
          } else {
            tl.to(m.scale, { x: target, y: target, duration: logoInDuration, ease: 'back.out(1.6)' }, i * (logoInDuration + logoGap))
          }
        }
        logosRef.current = logos
        if (!reduceRef.current) {
          logoTlRef.current = tl
          if (playRef.current && !logoTimerRef.current) {
            logoTimerRef.current = window.setTimeout(() => {
              logoTimerRef.current = null
              tl.play()
            }, mouseBeforeLogoDelay * 1000)
          }
        }
        settleStickers()
      })
      .catch((e) => {
        console.error('[PixelMouseScene] sticker load failed', e)
        settleStickers()
      })

    return () => {
      disposed = true
      window.removeEventListener('mousemove', onMove)
      if (logoTimerRef.current) window.clearTimeout(logoTimerRef.current)
      logoTlRef.current?.kill()
      logosRef.current.forEach((m) => (m.geometry as THREE.BufferGeometry).dispose())
      logoMats.forEach((mat) => mat.dispose())
      logoTextures.forEach((texture) => texture.dispose())
      scene.environment = null
      pmrem.dispose()
    }
  }, [desktop, scene, gl, onReady])

  useEffect(() => {
    const entry = entryRef.current
    if (!entry) return
    const cam = camera as THREE.PerspectiveCamera
    const halfH = 10 * Math.tan((cam.fov * Math.PI / 180) / 2)
    const halfW = halfH * (size.width / size.height)
    entry.position.x = halfW * 0.62
    entry.position.y = -halfH * 0.42
    baseY.current = -halfH * 0.42
  }, [size.width, size.height, camera])

  useFrame((state) => {
    const entry = entryRef.current
    const wrapper = wrapperRef.current
    if (!entry || !wrapper) return
    const reduce = reduceRef.current
    const model = modelRef.current
    const t = state.clock.elapsedTime
    const transition = transitionProgressRef?.current ?? 0
    const presence = 1 - THREE.MathUtils.smoothstep(transition, 0.1, 0.82)
    entry.visible = playRef.current && presence > 0.001
    if (!entry.visible) return
    entry.scale.setScalar(Math.max(0.001, presence))
    entry.rotation.z = transition * transition * 0.45
    entry.position.y = baseY.current + transition * 1.8
    const { x: mx, y: my } = mouse.current
    if (model) {
      if (reduce) {
        model.rotation.z = baseRotZ
      } else {
        wrapper.position.y = Math.sin(t * 1.2) * 0.1
        model.rotation.x = my * 0.12
        model.rotation.z = baseRotZ + mx * 0.08
      }
    }
    if (!reduce) {
      for (let i = 0; i < logosRef.current.length; i++) {
        const m = logosRef.current[i]
        const ud = m.userData
        m.position.x = ud.base.x + Math.sin(t * ud.sx + ud.rx) * ud.amp
        m.position.y = ud.base.y + Math.cos(t * ud.sy + ud.ry) * ud.amp * 0.7
        m.position.z = ud.base.z + Math.sin(t * ud.sz + ud.rz) * 0.8
        m.rotation.x = Math.sin(t * 0.3 + ud.rx) * 0.25
        m.rotation.y = Math.cos(t * 0.35 + ud.ry) * 0.25
        m.rotation.z = Math.sin(t * 0.25 + ud.rz) * 0.2
      }
    }
  })

  return (
    <group ref={entryRef}>
      <group ref={wrapperRef} />
    </group>
  )
}
