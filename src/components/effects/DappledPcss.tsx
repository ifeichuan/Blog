import { OrbitControls, SoftShadows } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { createContext, useContext, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'

type WindValue = 'XS' | 'M' | 'L'

type TreeSettings = {
  tubularSegments: number
  radialSegments: number
  maxLevel: number
  startLength: number
  startRadius: number
  lengthFactor: number
  radiusFactor: number
  branchesPerBranch: number
  isUniformBranchHeight: boolean
  curveV: number
  curveTopAngle: number
  curveBottomAngle: number
  curveRes: number
  leafSize: number
  leafCurve: number
  leavesPerBranch: number
  tropism: [number, number, number]
}

const WIND_SPEEDS: Record<WindValue, number> = { XS: 1, M: 10, L: 20 }

const TREE_SETTINGS: TreeSettings = {
  tubularSegments: 10,
  radialSegments: 8,
  maxLevel: 4,
  startLength: 12,
  startRadius: 0.5,
  lengthFactor: 0.65,
  radiusFactor: 0.8,
  branchesPerBranch: 4,
  isUniformBranchHeight: true,
  curveV: 0,
  curveTopAngle: -90,
  curveBottomAngle: 90,
  curveRes: 15,
  leafSize: 6,
  leafCurve: 1,
  leavesPerBranch: 3,
  tropism: [0, -0.05, 0],
}

const WindContext = createContext<MutableRefObject<number> | null>(null)
const TreeContext = createContext<TreeSettings | null>(null)
const LeafTextureContext = createContext<THREE.Texture | null>(null)

class VariableTubeGeometry extends THREE.BufferGeometry {
  constructor(
    path: THREE.Curve<THREE.Vector3>,
    tubularSegments = 64,
    radius: number | ((factor: number) => number) = 1,
    radialSegments = 8,
    closed = false,
  ) {
    super()
    const radiusAt = typeof radius === 'function' ? radius : () => radius
    const frames = path.computeFrenetFrames(tubularSegments, closed)
    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const point = new THREE.Vector3()
    const normal = new THREE.Vector3()

    const generateSegment = (index: number) => {
      const factor = index / tubularSegments
      const currentRadius = radiusAt(factor)
      path.getPointAt(factor, point)
      const frameNormal = frames.normals[index]
      const frameBinormal = frames.binormals[index]

      for (let segment = 0; segment <= radialSegments; segment++) {
        const angle = (segment / radialSegments) * Math.PI * 2
        const sin = Math.sin(angle)
        const cos = -Math.cos(angle)
        normal.set(
          cos * frameNormal.x + sin * frameBinormal.x,
          cos * frameNormal.y + sin * frameBinormal.y,
          cos * frameNormal.z + sin * frameBinormal.z,
        ).normalize()
        normals.push(normal.x, normal.y, normal.z)
        vertices.push(
          point.x + currentRadius * normal.x,
          point.y + currentRadius * normal.y,
          point.z + currentRadius * normal.z,
        )
      }
    }

    for (let index = 0; index < tubularSegments; index++) generateSegment(index)
    generateSegment(closed ? 0 : tubularSegments)

    for (let index = 0; index <= tubularSegments; index++) {
      for (let segment = 0; segment <= radialSegments; segment++) {
        uvs.push(index / tubularSegments, segment / radialSegments)
      }
    }

    for (let index = 1; index <= tubularSegments; index++) {
      for (let segment = 1; segment <= radialSegments; segment++) {
        const a = (radialSegments + 1) * (index - 1) + (segment - 1)
        const b = (radialSegments + 1) * index + (segment - 1)
        const c = (radialSegments + 1) * index + segment
        const d = (radialSegments + 1) * (index - 1) + segment
        indices.push(a, b, d, b, c, d)
      }
    }

    this.setIndex(indices)
    this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  }
}

function bendLeafGeometry(geometry: THREE.PlaneGeometry, size: number, curve: number) {
  const width = geometry.parameters.width
  const halfWidth = width / 2
  const circleRadius = size / Math.PI * 2
  const rise = (circleRadius - Math.sqrt(circleRadius ** 2 - (size / 2) ** 2)) * curve
  const left = new THREE.Vector2(-halfWidth, 0)
  const peak = new THREE.Vector2(0, rise)
  const right = new THREE.Vector2(halfWidth, 0)
  const a = new THREE.Vector2().subVectors(left, peak)
  const b = new THREE.Vector2().subVectors(peak, right)
  const chord = new THREE.Vector2().subVectors(left, right)
  const circumradius = a.length() * b.length() * chord.length() / (2 * Math.abs(a.cross(chord)))
  const center = new THREE.Vector2(0, rise - circumradius)
  const angle = (new THREE.Vector2().subVectors(left, center).angle() - Math.PI / 2) * 2
  const uv = geometry.attributes.uv
  const position = geometry.attributes.position
  const point = new THREE.Vector2()

  for (let index = 0; index < uv.count; index++) {
    const factor = 1 - uv.getX(index)
    const originalY = position.getY(index)
    point.copy(right).rotateAround(center, angle * factor)
    position.setXYZ(index, point.x, originalY, -point.y)
  }

  position.needsUpdate = true
}

type LeafProps = {
  position: THREE.Vector3
  tangent: THREE.Vector3
  isLeft: boolean
  parentRadius: number
}

function Leaf({ position, tangent, isLeft, parentRadius }: LeafProps) {
  const settings = useContext(TreeContext) ?? TREE_SETTINGS
  const windSpeedRef = useContext(WindContext)
  const texture = useContext(LeafTextureContext)
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => {
    const next = new THREE.PlaneGeometry(settings.leafSize, settings.leafSize, 20, 20)
    bendLeafGeometry(next, settings.leafSize, settings.leafCurve)
    next.translate(settings.leafSize / 2, 0.5, 0)
    return next
  }, [settings.leafCurve, settings.leafSize])
  const quaternion = useMemo(() => {
    const orient = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
    const side = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(isLeft ? 45 : -45),
    )
    const tilt = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(22.5),
    )
    return orient.multiply(side).multiply(tilt)
  }, [isLeft, tangent])
  const rotation = useMemo(() => new THREE.Euler(0, 0, THREE.MathUtils.degToRad(90)), [])
  const phase = useMemo(() => Math.random() * Math.PI * 2 / parentRadius / 5, [parentRadius])
  const amplitude = useMemo(() => 5 + 5 * Math.random(), [])

  useFrame(({ clock }) => {
    if (!meshRef.current || !windSpeedRef) return
    const angle = Math.sin(clock.elapsedTime * windSpeedRef.current / 10 + phase) * amplitude
    meshRef.current.rotation.y = THREE.MathUtils.degToRad(angle)
    meshRef.current.rotation.x = THREE.MathUtils.degToRad(angle * 0.5)
  })

  return (
    <group position={position} quaternion={quaternion}>
      <mesh ref={meshRef} geometry={geometry} rotation={rotation} castShadow>
        <meshBasicMaterial
          map={texture}
          alphaMap={texture}
          side={THREE.DoubleSide}
          transparent
          alphaTest={0.001}
          opacity={0}
        />
      </mesh>
    </group>
  )
}

type BranchProps = {
  length: number
  radius: number
  level?: number
}

function Branch({ length, radius, level = 0 }: BranchProps) {
  const settings = useContext(TreeContext) ?? TREE_SETTINGS
  const windSpeedRef = useContext(WindContext)
  const groupRef = useRef<THREE.Group>(null)
  const radiusAt = (factor: number) => {
    const taper = radius - factor * (1 - settings.radiusFactor)
    const ripple = 0.5 * Math.sin(10 * factor) + 0.3
    return taper + 0.1 * Math.pow(ripple, 3)
  }
  const path = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segmentLength = length / settings.curveRes
    let point = new THREE.Vector3(0, 0, 0)
    const tangent = new THREE.Vector3(0, 1, 0)
    const rotation = new THREE.Quaternion()
    const axis = new THREE.Vector3(1, 0, 0)
    const curveVariation = THREE.MathUtils.degToRad(settings.curveV)

    for (let index = 0; index <= settings.curveRes; index++) {
      let curveAngle = 0
      if (level > 0) {
        curveAngle = index < settings.curveRes / 2
          ? settings.curveTopAngle * (1 - level / settings.maxLevel / 4) / settings.curveRes
          : settings.curveBottomAngle * (1 - level / settings.maxLevel / 4) / settings.curveRes
      }
      rotation.setFromAxisAngle(axis, THREE.MathUtils.degToRad(curveAngle) + Math.random() * curveVariation)
      tangent.applyQuaternion(rotation).normalize()
      if (level > 0) tangent.add(new THREE.Vector3(...settings.tropism)).normalize()
      point = point.clone().add(tangent.clone().multiplyScalar(segmentLength))
      points.push(point)
    }

    const center = points[0].clone()
    for (const current of points) current.sub(center)
    return new THREE.CatmullRomCurve3(points)
  }, [length, level, settings])
  const branchPoints = useMemo(() => {
    const points = []
    const center = path.getPointAt(0)
    const count = settings.branchesPerBranch - (level - 1)
    const start = 0.4 - 0.4 * level / settings.maxLevel
    let offset = 0.05 * Math.random() - 0.025

    for (let index = 1; index <= count; index++) {
      const factor = start + (1 - start - 0.05) * index / count + offset
      points.push({
        position: path.getPointAt(factor).sub(center),
        tangent: path.getTangentAt(factor).normalize(),
        factor: index / count,
      })
      offset = 0.05 * Math.random() - 0.025
    }
    return points
  }, [level, path, settings])
  const leafPoints = useMemo(() => {
    const points = []
    const center = path.getPointAt(0)
    const start = 0.5 - level / 10
    let offset = 0.05 * Math.random() - 0.025

    for (let index = 1; index <= settings.leavesPerBranch; index++) {
      const factor = start + (1 - start - 0.05) * index / settings.leavesPerBranch + offset
      points.push({
        position: path.getPointAt(factor).sub(center),
        tangent: path.getTangentAt(factor).normalize(),
      })
      offset = 0.05 * Math.random() - 0.025
    }
    return points
  }, [level, path, settings.leavesPerBranch])
  const phase = useMemo(() => Math.random() / (radius * length), [length, radius])
  const branchAmplitude = useMemo(() => (windSpeedRef?.current ?? 1) * Math.random(), [windSpeedRef])
  const geometry = useMemo(
    () => new VariableTubeGeometry(path, settings.tubularSegments, radiusAt, settings.radialSegments, true),
    [path, radius, settings.radialSegments, settings.radiusFactor, settings.tubularSegments],
  )

  useFrame(({ clock }) => {
    if (level === 0 || !groupRef.current) return
    const angle = Math.sin(clock.elapsedTime + phase) * branchAmplitude
    groupRef.current.rotation.y = THREE.MathUtils.degToRad(angle)
    groupRef.current.rotation.x = THREE.MathUtils.degToRad(angle * 0.5)
  })

  if (radius < 0.2) return null

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <shadowMaterial transparent opacity={0} />
      </mesh>
      {level < settings.maxLevel && branchPoints.map((branch, index) => {
        const quaternion = new THREE.Quaternion()
          .setFromUnitVectors(new THREE.Vector3(0, 1, 0), branch.tangent)
          .multiply(new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            THREE.MathUtils.degToRad(360 * branch.factor + 45 * Math.random() - 22.5),
          ))
        return (
          <group key={index} position={branch.position} quaternion={quaternion}>
            <Branch
              length={length * settings.lengthFactor}
              radius={radiusAt(branch.factor)}
              level={level + 1}
            />
          </group>
        )
      })}
      {level > 0 && leafPoints.map((leaf, index) => (
        <Leaf
          key={index}
          position={leaf.position}
          tangent={leaf.tangent}
          isLeft={index % 2 === 0}
          parentRadius={radius}
        />
      ))}
    </group>
  )
}

function Tree() {
  const texture = useLoader(THREE.TextureLoader, '/dappled/leaf.png')

  return (
    <LeafTextureContext.Provider value={texture}>
      <TreeContext.Provider value={TREE_SETTINGS}>
        <Branch length={TREE_SETTINGS.startLength} radius={TREE_SETTINGS.startRadius} />
      </TreeContext.Provider>
    </LeafTextureContext.Provider>
  )
}

export function DappledPcssScene({
  onReady,
  toneMapped = true,
}: {
  onReady?: () => void
  toneMapped?: boolean
}) {
  const renderedFrames = useRef(0)
  const readyRef = useRef(false)

  return (
    <>
      <directionalLight
        color="#ffe5c7"
        castShadow
        position={[-15, 28, 23]}
        intensity={5}
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />
      <ambientLight color="#9dacb1" intensity={0.8} />
      <SoftShadows focus={1} samples={24} size={25} />
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onAfterRender={() => {
          if (readyRef.current || ++renderedFrames.current < 2) return
          readyRef.current = true
          onReady?.()
        }}
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="white" toneMapped={toneMapped} />
      </mesh>
      <group position={[-7, 0, 14]}>
        <Tree />
      </group>
      <OrbitControls />
    </>
  )
}

function FrameLimiter({ active, fps }: { active: boolean; fps: number }) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => invalidate(), 1000 / fps)
    return () => clearInterval(id)
  }, [active, fps, invalidate])

  return null
}

function DappledCanvas({ active = true, fps = 20, onReady }: { active?: boolean; fps?: number; onReady?: () => void }) {
  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [-18.375, 21, 0], fov: 10.5 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <FrameLimiter active={active} fps={fps} />
      <DappledPcssScene onReady={onReady} />
    </Canvas>
  )
}

export function DappledPcssCanvas({
  active = true,
  fps = 20,
  onReady,
  windSpeed = 10,
}: {
  active?: boolean
  fps?: number
  onReady?: () => void
  windSpeed?: number
}) {
  const windSpeedRef = useRef(windSpeed)

  useEffect(() => {
    windSpeedRef.current = windSpeed
  }, [windSpeed])

  return (
    <WindContext.Provider value={windSpeedRef}>
      <DappledCanvas active={active} fps={fps} onReady={onReady} />
    </WindContext.Provider>
  )
}

export default function DappledBaseline() {
  const windSpeedRef = useRef(1)
  const changeWind = (value: WindValue) => {
    windSpeedRef.current = WIND_SPEEDS[value]
  }

  return (
    <WindContext.Provider value={windSpeedRef}>
      <style>{`
        @font-face {
          font-family: "Geist Mono";
          src: url("/dappled/geist-mono.woff2") format("woff2");
          font-style: normal;
          font-weight: 100 900;
          font-display: swap;
        }
        * { box-sizing: border-box; }
        astro-dev-toolbar { display: none !important; }
        html, body { margin: 0; background: rgb(242, 240, 238); color: rgb(23, 23, 23); }
        body { font-family: "Geist Mono", monospace; font-weight: 300; }
        .dappled-page { position: relative; min-height: 100vh; overflow-x: hidden; }
        .dappled-nav { position: absolute; top: 32px; left: 32px; z-index: 2; line-height: 24px; }
        .dappled-nav a { padding: 5px 5px 5px 0; color: inherit; font-size: 13.6px; font-weight: 300; line-height: 20.4px; text-decoration: none; }
        .dappled-nav-trail { margin-left: 8px; opacity: .5; }
        .dappled-content { display: flex; width: 100%; flex-direction: column; align-items: center; padding: 120px 0 80px; }
        .dappled-title { text-align: center; }
        .dappled-title h1, .dappled-title p { margin: 0; font-size: 13.6px; line-height: 17.68px; }
        .dappled-title h1 { font-weight: 400; }
        .dappled-title p { font-weight: 300; opacity: .5; }
        .dappled-canvas-wrap { display: flex; width: 500px; max-width: calc(100% - 32px); flex-direction: column; align-items: flex-start; justify-content: center; gap: 12px; margin: 92px 0; }
        .dappled-canvas { width: 100%; aspect-ratio: 500 / 307; }
        .dappled-canvas > div, .dappled-canvas canvas { width: 100% !important; height: 100% !important; }
        .dappled-canvas canvas { display: block; border-radius: 2px; }
        .dappled-controls { display: flex; align-items: center; justify-content: space-between; margin: 2px 0 0 15px; }
        .dappled-control-row { display: flex; align-items: center; gap: 8px; }
        .dappled-control-row h3 { margin: 0; font-size: 12.32px; font-weight: 400; line-height: 18.48px; }
        .dappled-options { display: flex; gap: 8px; }
        .dappled-option { display: flex; width: 25.6px; height: 25.6px; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: 9999px; cursor: pointer; font-size: 12px; font-weight: 300; line-height: 18px; }
        .dappled-option:has(input:checked) { border-color: rgb(0, 0, 0); }
        .dappled-option input { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
        .dappled-desc { display: flex; width: 500px; max-width: calc(100% - 32px); flex-direction: column; gap: 16px; margin: 0 auto; padding: 0 12px 16px; }
        .dappled-desc p { margin: 0; font-size: 12.8px; font-weight: 300; line-height: 16.64px; }
        .dappled-notes { display: flex; flex-direction: column; gap: 4px; }
        .dappled-notes h3 { margin: 0; font-size: 12.32px; font-weight: 400; line-height: 18.48px; }
        .dappled-code { border-radius: 3.2px; background: rgba(0, 0, 0, .07); color: rgb(49, 48, 48); padding: .8px 6.4px 1.92px; font-size: 12.32px; font-weight: 400; }
        @media (max-width: 800px) {
          .dappled-content { width: calc(100% - 32px); }
        }
      `}</style>
      <main className="dappled-page">
        <nav className="dappled-nav">
          <a href="/">
            <span aria-hidden="true">↩︎</span> Home
            <span className="dappled-nav-trail">/ Projects</span>
          </a>
        </nav>
        <section className="dappled-content">
          <header className="dappled-title">
            <h1>Dappled light</h1>
            <p>Nov 2024</p>
          </header>
          <div className="dappled-canvas-wrap">
            <div className="dappled-canvas">
              <DappledCanvas />
            </div>
            <div className="dappled-controls">
              <div className="dappled-control-row" role="radiogroup" aria-labelledby="wind-label">
                <h3 id="wind-label">Wind:</h3>
                <div className="dappled-options">
                  {(['XS', 'M', 'L'] as const).map((value) => (
                    <label className="dappled-option" key={value}>
                      <input
                        type="radio"
                        name="wind"
                        value={value}
                        defaultChecked={value === 'XS'}
                        onChange={() => changeWind(value)}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <section className="dappled-desc">
            <p>
              Growing up, I loved this mix of shade and sun I called "shun." Sunlight slipped through the leaves,
              and its tiny gaps turned into pinholes that project little dancing suns. It felt like magic.
            </p>
            <div className="dappled-notes">
              <h3>Dev Notes.</h3>
              <p>Built with Lindenmayer systems. Uses percentage-closer soft shadows from <span className="dappled-code">@react-three/drei</span>.</p>
            </div>
          </section>
        </section>
      </main>
    </WindContext.Provider>
  )
}
