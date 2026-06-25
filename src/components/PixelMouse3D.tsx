import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const baseRotZ = 0.785 // 朝左倾 45°

// 贴纸弯折：plane 顶点轻微弧面位移，随机凸/凹方向
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

export function PixelMouse3D({ play, className = '' }: { play: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const playRef = useRef(play)
  const logoTlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    playRef.current = play
    if (play && logoTlRef.current) logoTlRef.current.play()
  }, [play])

  useEffect(() => {
    const mount = ref.current
    if (!mount) return
    const reduce = reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(innerWidth, innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    const cam = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 100)
    cam.position.set(0, 0, 10)
    cam.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const key = new THREE.DirectionalLight(0xffffff, 0.4)
    key.position.set(2, 4, 3)
    scene.add(key)

    const wrapper = new THREE.Group()
    scene.add(wrapper)

    let model: THREE.Group | null = null
    let baseX = 0
    let baseY = 0
    const layout = () => {
      const halfH = 10 * Math.tan((32 * Math.PI / 180) / 2)
      const halfW = halfH * (innerWidth / innerHeight)
      baseX = halfW * 0.62
      baseY = -halfH * 0.42
      wrapper.position.x = baseX
      wrapper.position.y = baseY
    }

    new GLTFLoader().load(
      '/pixel_art_mouse_cursor/scene.gltf',
      (gltf) => {
        model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const s = 2.2 / Math.hypot(size.x, size.y)
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
        layout()
      },
      undefined,
      (e) => console.error('[PixelMouse3D] load failed', e),
    )

    // Claude logo 贴纸：白边贴图 + 弯折 plane，GSAP timeline 错开入场（60ms），之后太空漂浮
    const logos: THREE.Mesh[] = []
    const LOGO_COUNT = 8
    let logoTex: THREE.CanvasTexture | null = null
    let logoMat: THREE.MeshBasicMaterial | null = null
    fetch('/claudecode-color.svg')
      .then((r) => r.text())
      .then((svg) => {
        const d = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('path')?.getAttribute('d') || ''
        const SZ = 128
        const cv = document.createElement('canvas')
        cv.width = cv.height = SZ
        const ctx = cv.getContext('2d')!
        ctx.save()
        ctx.scale(SZ / 24, SZ / 24)
        ctx.lineJoin = 'round'
        ctx.lineWidth = 1.0
        ctx.strokeStyle = '#ffffff'
        const p = new Path2D(d)
        ctx.stroke(p)
        ctx.fillStyle = '#D97757'
        ctx.fill(p, 'evenodd')
        ctx.restore()
        logoTex = new THREE.CanvasTexture(cv)
        logoTex.colorSpace = THREE.SRGBColorSpace
        logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
        logoMat.toneMapped = false
        const tl = gsap.timeline({ paused: true })
        for (let i = 0; i < LOGO_COUNT; i++) {
          const geo = new THREE.PlaneGeometry(1, 1, 5, 5)
          bendGeo(geo)
          const m = new THREE.Mesh(geo, logoMat)
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
          scene.add(m)
          logos.push(m)
          if (reduce) {
            m.scale.set(target, target, 1)
          } else {
            tl.to(m.scale, { x: target, y: target, duration: 0.5, ease: 'back.out(1.6)' }, i * 0.06)
          }
        }
        if (!reduce) {
          logoTlRef.current = tl
          if (playRef.current) tl.play()
        }
      })
      .catch((e) => console.error('[PixelMouse3D] svg load failed', e))

    let mx = 0
    let my = 0
    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / innerWidth - 0.5) * 2
      my = (e.clientY / innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)

    const onResize = () => {
      renderer.setSize(innerWidth, innerHeight)
      cam.aspect = innerWidth / innerHeight
      cam.updateProjectionMatrix()
      layout()
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = (performance.now() - t0) * 0.001
      if (model) {
        if (reduce) {
          model.rotation.z = baseRotZ
        } else {
          wrapper.position.y = baseY + Math.sin(t * 1.2) * 0.1
          model.rotation.x = my * 0.12
          model.rotation.z = baseRotZ + mx * 0.08
        }
      }
      if (!reduce) {
        for (let i = 0; i < logos.length; i++) {
          const m = logos[i]
          const ud = m.userData
          m.position.x = ud.base.x + Math.sin(t * ud.sx + ud.rx) * ud.amp
          m.position.y = ud.base.y + Math.cos(t * ud.sy + ud.ry) * ud.amp * 0.7
          m.position.z = ud.base.z + Math.sin(t * ud.sz + ud.rz) * 0.8
          m.rotation.x = Math.sin(t * 0.3 + ud.rx) * 0.25
          m.rotation.y = Math.cos(t * 0.35 + ud.ry) * 0.25
          m.rotation.z = Math.sin(t * 0.25 + ud.rz) * 0.2
        }
      }
      renderer.render(scene, cam)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      logoTlRef.current?.kill()
      logos.forEach((m) => (m.geometry as THREE.BufferGeometry).dispose())
      if (logoMat) logoMat.dispose()
      if (logoTex) logoTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      const el = renderer.domElement
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [reduced])

  return <div ref={ref} className={className} aria-hidden="true" />
}
