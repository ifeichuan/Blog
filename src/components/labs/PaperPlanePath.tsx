import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// 机制验证页：滚动进度 → SVG path 取样 → 3D 模型位置/朝向。
// path 画在归一化坐标系里（viewBox 0 0 100 100），x = 视口宽百分比，
// y = **整篇文档高度**的百分比 —— 轨迹不被压进一屏，全程贯穿所有卡片。
// 屏幕位置 = 文档位置 − 滚动量。取样按 **y** 而非弧长（见 lut），所以
// **d 的 y 必须单调递增**：可以左右横穿、可以急转，但不能往回上翻，
// 否则查表会退化、飞机在原地抖。
// 布局重排（字体加载、pin 重测、横滚 scrub）只改 docH，归一化坐标不会错位。
const DEFAULT_D = [
  'M 82 4', // 起点在 Hero 右上
  'C 90 14, 70 20, 46 23', // 掠过 Hero，向左
  'C 24 26, 12 33, 14 42', // 贴左侧缝隙下行
  'C 16 51, 40 53, 58 57', // 横穿到右
  'C 78 61, 88 68, 84 76', // 右侧下行
  'C 80 84, 54 84, 36 87', // 回到左侧
  'C 20 90, 14 94, 24 97', // 底部左下
  'C 34 99, 44 99, 50 99', // 收在 Footer 中间
].join(' ')

const CARDS = [
  { idx: '01', title: 'Hero', note: 'Hello → I’m + 手写签名。纸飞机从这里被放出去', tall: false },
  { idx: '02', title: '链条 ① 省事 / 不外包判断', note: 'pin · 语义反转（用 240vh 模拟 pin 占的滚动长度）', tall: true },
  { idx: '03', title: '链条 ② 约束与 pattern', note: '普通视差卡', tall: false },
  { idx: '04', title: '链条 ③ 品味是损失函数', note: '普通视差卡', tall: false },
  { idx: '05', title: '链条 ④ make something agent want', note: '普通视差卡 · 收在「所以要创造」', tall: false },
  { idx: '06', title: 'Lab 横滚区', note: 'pin · 横向 scrub（240vh 模拟）', tall: true },
  { idx: '07', title: 'Footer', note: 'sticky 谢幕', tall: false },
]

type Tune = {
  scale: number
  heading: number // deg，模型静态朝向的补偿量
  bank: number // 转弯速率 → 侧倾
  pitch: number // 速度 → 抬头（慢抬头、快压平）
  smooth: number // 姿态平滑
  bob: number // 悬浮振幅
}

// heading = -90：实测把补偿归零、切线取 0°（正右）时，模型的手指是朝上的，
// 即模型固有指向比飞行方向超前 90°，要减回去
const DEFAULT_TUNE: Tune = { scale: 1, heading: -90, bank: 0.6, pitch: 0.45, smooth: 0.18, bob: 0.08 }

// x/y 是归一化读数（面板显示用）；sx/sy 与 tx/ty 是**屏幕像素**坐标，
// 给 fixed 的叠加层画取样点和切线箭头 —— 归一化空间被 preserveAspectRatio=none
// 非等比拉伸过，在里面画圆会变成竖椭圆、画箭头会歪，所以这两样一律走像素空间
type Sample = {
  x: number
  y: number
  azimuth: number
  speed: number
  sx: number
  sy: number
  tx: number
  ty: number
}

// 角度插值走最短弧，避免 ±π 跨越时甩一整圈
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const lerpAngle = (from: number, to: number, t: number) => from + wrap(to - from) * t

function PlaneScene({
  d,
  progressRef,
  pathRef,
  tuneRef,
  metrics,
  onSample,
}: {
  d: string
  progressRef: RefObject<number>
  pathRef: RefObject<SVGPathElement | null>
  tuneRef: RefObject<Tune>
  metrics: RefObject<{ docH: number; vh: number }>
  onSample: (s: Sample) => void
}) {
  const { scene, gl, camera, size } = useThree()
  const entryRef = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const half = useRef({ w: 10, h: 10 })
  const state = useRef({ az: 0, bank: 0, pitch: 0, prevX: 0, prevY: 0, ready: false })
  const emitRef = useRef(0)
  // y → 弧长查找表。按弧长取样是错的：横向绕行会「吃掉」进度，
  // 飞机的文档位置就落后于滚动位置，被甩出屏外好几百像素。
  // 改成按 y 取样后，飞机的文档 y 始终随滚动线性推进，path 只负责 x 和切线。
  const lut = useRef<{ ys: Float32Array; ss: Float32Array; y0: number; y1: number } | null>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    if (!len) return
    const N = 400
    const ys = new Float32Array(N + 1)
    const ss = new Float32Array(N + 1)
    for (let i = 0; i <= N; i++) {
      const s = (i / N) * len
      ss[i] = s
      ys[i] = path.getPointAtLength(s).y
    }
    lut.current = { ys, ss, y0: ys[0], y1: ys[N] }
  }, [d, pathRef])

  // 视口 → 3D 场景平面尺寸（相机在 z=10 看向原点）
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const h = 10 * Math.tan(((cam.fov * Math.PI) / 180) / 2)
    half.current = { h, w: h * (size.width / size.height) }
  }, [camera, size.width, size.height])

  useEffect(() => {
    const entry = entryRef.current
    if (!entry) return
    let disposed = false
    let loaded: THREE.Group | null = null
    const pmrem = new THREE.PMREMGenerator(gl)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    new GLTFLoader().load('/pixel_art_mouse_cursor/scene.gltf', (gltf) => {
      if (disposed) return
      const model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const sz = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const s = 2.2 / Math.hypot(sz.x, sz.y)
      model.scale.setScalar(s)
      model.position.set(-center.x * s, -center.y * s, -center.z * s)
      model.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] | undefined
        const apply = (m: THREE.MeshStandardMaterial) => {
          if (m.name === 'material_1') {
            m.metalness = 0.7
            m.roughness = 0.25
            m.envMapIntensity = 1
          } else m.roughness = 0.45
          m.needsUpdate = true
        }
        if (Array.isArray(mat)) mat.forEach(apply)
        else if (mat) apply(mat)
      })
      // 外层 group 承担飞行朝向，内层 model 保留自身的居中偏移
      const holder = new THREE.Group()
      holder.add(model)
      entry.add(holder)
      modelRef.current = holder
      loaded = holder
    })

    // 清理必须把模型从 entry 摘掉并释放：不然 StrictMode 双重挂载（以及 HMR）
    // 会把上一次加载的模型留成孤儿，和新模型叠在同一位置
    return () => {
      disposed = true
      if (loaded) {
        entry.remove(loaded)
        loaded.traverse((o) => {
          const mesh = o as THREE.Mesh
          mesh.geometry?.dispose()
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat?.dispose()
        })
        loaded = null
      }
      modelRef.current = null
      scene.environment = null
      pmrem.dispose()
    }
  }, [gl, scene])

  useFrame((st, delta) => {
    const entry = entryRef.current
    const holder = modelRef.current
    const path = pathRef.current
    if (!entry || !holder || !path) return
    const tune = tuneRef.current
    const table = lut.current
    const len = path.getTotalLength()
    if (!len || !table) return

    const p = Math.min(1, Math.max(0, progressRef.current))
    // 目标 y 由进度直接给出，再在 LUT 里查它对应的弧长（ys 单调递增，走二分）
    const yWant = table.y0 + (table.y1 - table.y0) * p
    const { ys, ss } = table
    let lo = 0
    let hi = ys.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (ys[mid] <= yWant) lo = mid
      else hi = mid
    }
    const span = ys[hi] - ys[lo]
    const s = ss[lo] + (ss[hi] - ss[lo]) * (span > 1e-6 ? (yWant - ys[lo]) / span : 0)
    const pt = path.getPointAtLength(s)

    // pt.x → 视口宽百分比；pt.y → 整篇文档高百分比。
    // 屏幕位置 = 文档位置 − 已滚动量，再换算成场景单位（unit = 每像素多少场景单位）。
    const { w, h } = half.current
    const { docH, vh } = metrics.current
    const unit = (2 * h) / Math.max(1, vh)
    // 用真实 scrollY 而不是 p·(docH−vh)：调试层是随文档滚动的 absolute SVG，
    // 两边必须减同一个滚动量，否则取样点会和描边错开
    const docY = (pt.y / 100) * docH
    const screenY = docY - window.scrollY
    const x = w * (pt.x / 50 - 1)
    const y = (vh / 2 - screenY) * unit

    // 切线：相邻取样点差值。ε 取 path 长度的 0.4%，短了会被浮点噪声主导。
    // 归一化坐标被 preserveAspectRatio=none 拉伸过，求角度前要还原成场景比例；
    // y 的口径是文档高，所以用 docH·h/vh 而不是 h。
    const eps = Math.max(0.5, len * 0.004)
    const a = path.getPointAtLength(Math.max(0, s - eps))
    const b = path.getPointAtLength(Math.min(len, s + eps))
    // SVG 的 y 向下，3D 的 y 向上 → 取切线时取反
    const azTarget = Math.atan2((-(b.y - a.y) * docH * h) / Math.max(1, vh), (b.x - a.x) * w)

    const sm = state.current
    if (!sm.ready) {
      sm.ready = true
      sm.az = azTarget
      sm.prevX = x
      sm.prevY = y
    }

    // 屏宽归一化的瞬时速度 → pitch；转弯速率 → bank
    const dt = Math.max(1 / 240, delta)
    const speed = Math.hypot(x - sm.prevX, y - sm.prevY) / dt / Math.max(0.001, w)
    sm.prevX = x
    sm.prevY = y
    const turn = wrap(azTarget - sm.az)

    // 帧率无关的平滑系数
    const ease = 1 - Math.pow(1 - Math.min(0.999, tune.smooth), dt * 60)
    // 每帧归一化，否则连续绕行会让 az 单调累积（读数飘到几百度，且 lerp 精度变差）
    sm.az = wrap(lerpAngle(sm.az, azTarget, ease))
    sm.bank = THREE.MathUtils.lerp(sm.bank, THREE.MathUtils.clamp(turn * 26, -1.1, 1.1) * tune.bank, ease)
    // 快压平、慢抬头
    sm.pitch = THREE.MathUtils.lerp(sm.pitch, (0.55 - THREE.MathUtils.clamp(speed * 1.6, 0, 1.1)) * tune.pitch, ease)

    entry.position.set(x, y + Math.sin(st.clock.elapsedTime * 1.2) * tune.bob, 0)
    entry.scale.setScalar(tune.scale)
    holder.rotation.set(sm.pitch, 0, sm.az + (tune.heading * Math.PI) / 180 + sm.bank)

    // 面板读数节流到 ~15fps，别每帧 setState
    if (st.clock.elapsedTime - emitRef.current > 1 / 15) {
      emitRef.current = st.clock.elapsedTime
      // 场景单位 → 屏幕像素：x 用 w，y 用 h，都除以对应的半屏尺寸
      const sx = ((x / w) * 0.5 + 0.5) * size.width
      const sy = (0.5 - y / h * 0.5) * size.height
      const arrow = size.width * 0.08 // 箭头长度取 8% 屏宽
      onSample({
        x: pt.x,
        y: pt.y,
        azimuth: sm.az,
        speed,
        sx,
        sy,
        tx: sx + Math.cos(sm.az) * arrow,
        ty: sy - Math.sin(sm.az) * arrow,
      })
    }
  })

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 4, 3]} intensity={0.4} />
      <group ref={entryRef} />
    </>
  )
}

// 调试层分两块，因为两者的坐标口径不同：
//   pp-track —— absolute、高度 = 整篇文档，随文档一起滚。归一化 viewBox，
//               承载那条被 3D 取样的 path（常驻 DOM，只切 strokeOpacity，不能 display:none）
//   pp-hud   —— fixed、屏幕像素坐标。取样点和切线跟着飞机走，必须留在屏内
function Guide({
  d,
  docH,
  pathRef,
  showTrack,
  showDot,
  showTangent,
  sample,
}: {
  d: string
  docH: number
  pathRef: RefObject<SVGPathElement | null>
  showTrack: boolean
  showDot: boolean
  showTangent: boolean
  sample: Sample
}) {
  return (
    <>
      <svg
        className="pp-track"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ height: docH }}
        aria-hidden="true"
      >
        {/* non-scaling-stroke：viewBox 被非等比拉伸，不然描边会一头粗一头细 */}
        <path
          ref={pathRef}
          d={d}
          vectorEffect="non-scaling-stroke"
          strokeOpacity={showTrack ? 1 : 0}
        />
      </svg>
      <svg className="pp-hud" aria-hidden="true">
        {showTangent && <line x1={sample.sx} y1={sample.sy} x2={sample.tx} y2={sample.ty} />}
        {showDot && <circle cx={sample.sx} cy={sample.sy} r={4} />}
      </svg>
    </>
  )
}

export default function PaperPlanePath() {
  const [draft, setDraft] = useState(DEFAULT_D)
  const [d, setD] = useState(DEFAULT_D)
  const [err, setErr] = useState('')
  const [tune, setTune] = useState<Tune>(DEFAULT_TUNE)
  // weave：卡片 z 交替 —— 奇数卡在飞机之上、偶数卡在飞机之下，
  // 于是飞机在相邻两卡之间穿插（从一张背后钻出、掠过下一张）
  const [vis, setVis] = useState({ track: true, dot: true, tangent: true, weave: true, above: false })
  const [alpha, setAlpha] = useState(0.22)
  const [sample, setSample] = useState<Sample>({
    x: 0,
    y: 0,
    azimuth: 0,
    speed: 0,
    sx: 0,
    sy: 0,
    tx: 0,
    ty: 0,
  })
  const [progress, setProgress] = useState(0)
  const [docH, setDocH] = useState(0)

  const flowRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const progressRef = useRef(0)
  const metricsRef = useRef({ docH: 1, vh: 1 })
  const tuneRef = useRef(tune)
  useEffect(() => {
    tuneRef.current = tune
  }, [tune])

  // 文档高度由 flow 决定，而不是 documentElement.scrollHeight —— 轨迹 SVG 自己
  // 就有 docH 那么高，用 scrollHeight 会形成「量到多高就撑多高」的正反馈
  useEffect(() => {
    const measure = () => {
      const flow = flowRef.current
      const h = flow ? flow.offsetTop + flow.offsetHeight : document.documentElement.scrollHeight
      metricsRef.current = { docH: h, vh: window.innerHeight }
      setDocH(h)
    }
    measure()
    window.addEventListener('resize', measure)
    ScrollTrigger.addEventListener('refreshInit', measure)
    return () => {
      window.removeEventListener('resize', measure)
      ScrollTrigger.removeEventListener('refreshInit', measure)
    }
  }, [])

  // 校验：交给浏览器的 path 解析器，非法 d 会让 getTotalLength 抛错
  useEffect(() => {
    const t = setTimeout(() => {
      const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      probe.setAttribute('d', draft)
      try {
        const l = probe.getTotalLength()
        if (!Number.isFinite(l) || l <= 0) throw new Error('长度为 0')
        setErr('')
        setD(draft)
      } catch (e) {
        setErr(`d 无效：${(e as Error).message}`)
      }
    }, 220)
    return () => clearTimeout(t)
  }, [draft])

  // 全页滚动进度 → progressRef，与首页同一套 ScrollTrigger
  useEffect(() => {
    const flow = flowRef.current
    if (!flow) return
    const st = ScrollTrigger.create({
      trigger: flow,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progressRef.current = self.progress
        setProgress(self.progress)
      },
    })
    ScrollTrigger.refresh()
    return () => st.kill()
  }, [])

  const seek = useCallback((p: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: max * p, behavior: 'auto' })
  }, [])

  const onSample = useCallback((s: Sample) => setSample(s), [])

  return (
    <>
      <div className="pp-stage" data-above={vis.above}>
        <Canvas
          camera={{ fov: 32, position: [0, 0, 10], near: 0.1, far: 100 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.toneMapping = THREE.ACESFilmicToneMapping
          }}
        >
          <PlaneScene
            d={d}
            progressRef={progressRef}
            pathRef={pathRef}
            tuneRef={tuneRef}
            metrics={metricsRef}
            onSample={onSample}
          />
        </Canvas>
      </div>

      <Guide
        d={d}
        docH={docH}
        pathRef={pathRef}
        showTrack={vis.track}
        showDot={vis.dot}
        showTangent={vis.tangent}
        sample={sample}
      />

      <div className="pp-flow" ref={flowRef}>
        {CARDS.map((c, i) => {
          // stage 的 z 是 10：20 在其上、5 在其下
          const under = vis.weave && i % 2 === 1
          return (
            <section
              className="pp-card"
              key={c.idx}
              data-tall={c.tall}
              data-under={under}
              style={{ '--pp-z': under ? 5 : 20, '--pp-alpha': alpha } as React.CSSProperties}
            >
              <span className="idx">
                {c.idx} · z {under ? 5 : 20}
              </span>
              <h2>{c.title}</h2>
              <p>{c.note}</p>
            </section>
          )
        })}
      </div>

      <aside className="pp-panel">
        <h3>path · d（归一化 0–100）</h3>
        <textarea
          value={draft}
          data-err={err ? 'true' : 'false'}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
        />
        {err && <span className="err">{err}</span>}
        <div className="row">
          <button onClick={() => setDraft(DEFAULT_D)}>重置 path</button>
          <button onClick={() => navigator.clipboard?.writeText(d)}>复制 d</button>
        </div>

        <hr />
        <h3>可视化</h3>
        <div className="toggles">
          {(
            [
              ['track', '轨迹描边'],
              ['dot', '取样点'],
              ['tangent', '切线'],
              ['weave', '卡片 z 交替'],
              ['above', 'canvas 压过全部'],
            ] as const
          ).map(([k, label]) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={vis[k]}
                onChange={(e) => setVis((v) => ({ ...v, [k]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="row">
          <span>卡片不透明度</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
          />
          <span className="val">{alpha.toFixed(2)}</span>
        </div>

        <hr />
        <h3>姿态</h3>
        {(
          [
            ['scale', '缩放', 0.3, 2.5, 0.05],
            ['heading', '朝向补偿°', -180, 180, 1],
            ['bank', '侧倾', 0, 2, 0.05],
            ['pitch', '抬头', 0, 2, 0.05],
            ['smooth', '平滑', 0.02, 0.6, 0.01],
            ['bob', '悬浮', 0, 0.4, 0.01],
          ] as const
        ).map(([k, label, min, max, step]) => (
          <div className="row" key={k}>
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={tune[k]}
              onChange={(e) => setTune((t) => ({ ...t, [k]: Number(e.target.value) }))}
            />
            <span className="val">{tune[k]}</span>
          </div>
        ))}
        <button onClick={() => setTune(DEFAULT_TUNE)}>重置姿态</button>

        <hr />
        <h3>进度</h3>
        <div className="row">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <span className="val">{progress.toFixed(3)}</span>
        </div>
        <pre>
{`x        ${sample.x.toFixed(2)}
y        ${sample.y.toFixed(2)}
azimuth  ${((sample.azimuth * 180) / Math.PI).toFixed(1)}°
speed    ${sample.speed.toFixed(3)}`}
        </pre>
      </aside>
    </>
  )
}
