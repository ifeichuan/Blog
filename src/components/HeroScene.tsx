import { Canvas } from '@react-three/fiber'
import { DappledPlane, type ColorScheme } from './DappledLight'
import { PixelMouseScene } from './PixelMouse3D'

const camera = { fov: 32, position: [0, 0, 10] as [number, number, number], near: 0.1, far: 100 }

export function HeroScene({ scheme }: { scheme: ColorScheme }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      camera={camera}
      style={{ width: '100%', height: '100%' }}
    >
      <DappledPlane scheme={scheme} />
    </Canvas>
  )
}

export function HeroMouseLayer({ play }: { play: boolean }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      camera={camera}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 4, 3]} intensity={0.4} />
      <PixelMouseScene play={play} />
    </Canvas>
  )
}
