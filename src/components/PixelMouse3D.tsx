import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const baseRotZ = 0.785

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

export function PixelMouseScene({ play }: { play: boolean }) {
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
  const enterTlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => { reduceRef.current = reduce }, [reduce])

  useEffect(() => {
    playRef.current = play
    if (!play) return
    const entry = entryRef.current
    if (!entry) return
    entry.visible = true
    logoTlRef.current?.play()
    enterTlRef.current?.kill()
    if (reduceRef.current) {
      entry.scale.set(1, 1, 1)
      entry.position.y = baseY.current
    } else {
      entry.scale.set(0, 0, 0)
      enterTlRef.current = gsap.timeline()
      enterTlRef.current.to(entry.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.6)' }, 0)
      enterTlRef.current.fromTo(entry.position, { y: baseY.current + 1.5 }, { y: baseY.current, duration: 0.6, ease: 'power2.out' }, 0)
    }
  }, [play])

  useEffect(() => {
    if (!desktop) return
    const wrapper = wrapperRef.current
    const entry = entryRef.current
    if (!wrapper || !entry) return
    entry.visible = false
    entry.scale.set(0, 0, 0)

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
      },
      undefined,
      (e) => console.error('[PixelMouseScene] load failed', e),
    )

    const logos: THREE.Mesh[] = []
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
        const logoTex = new THREE.CanvasTexture(cv)
        logoTex.colorSpace = THREE.SRGBColorSpace
        logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
        logoMat.toneMapped = false
        const tl = gsap.timeline({ paused: true })
        const LOGO_COUNT = 8
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
          wrapper.add(m)
          logos.push(m)
          if (reduceRef.current) {
            m.scale.set(target, target, 1)
          } else {
            tl.to(m.scale, { x: target, y: target, duration: 0.5, ease: 'back.out(1.6)' }, i * 0.06)
          }
        }
        logosRef.current = logos
        if (!reduceRef.current) {
          logoTlRef.current = tl
          if (playRef.current) tl.play()
        }
      })
      .catch((e) => console.error('[PixelMouseScene] svg load failed', e))

    return () => {
      window.removeEventListener('mousemove', onMove)
      logoTlRef.current?.kill()
      enterTlRef.current?.kill()
      logosRef.current.forEach((m) => (m.geometry as THREE.BufferGeometry).dispose())
      if (logoMat) {
        logoMat.map?.dispose()
        logoMat.dispose()
      }
      scene.environment = null
      pmrem.dispose()
    }
  }, [desktop, scene, gl])

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
    if (!entry || !entry.visible || !wrapper) return
    const reduce = reduceRef.current
    const model = modelRef.current
    const t = state.clock.elapsedTime
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
