import { Canvas } from '@react-three/fiber'
import { DappledPlane, type ColorScheme } from './DappledLight'
import { PixelMouseScene } from './PixelMouse3D'

export function HeroScene({ scheme, play }: { scheme: ColorScheme; play: boolean }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      camera={{ fov: 32, position: [0, 0, 10], near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 4, 3]} intensity={0.4} />
      <DappledPlane scheme={scheme} />
      <PixelMouseScene play={play} />
    </Canvas>
  )
}
