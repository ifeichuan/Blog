import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { DappledPlane, type ColorScheme } from '../effects/DappledLight'
import { PixelMouseScene } from '../effects/PixelMouse3D'

const camera = { fov: 32, position: [0, 0, 10] as [number, number, number], near: 0.1, far: 100 }

// frameloop="demand" 下，仅按设定 fps 周期性 invalidate 触发重渲染，把 144Hz 降到目标帧率
function FrameLimiter({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / fps)
    return () => clearInterval(id)
  }, [fps, invalidate])
  return null
}

export function HeroScene({ scheme, onReady }: { scheme: ColorScheme; onReady?: () => void }) {
  return (
    <Canvas
      frameloop="demand"
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      camera={camera}
      style={{ width: '100%', height: '100%' }}
    >
      <FrameLimiter fps={30} />
      <DappledPlane scheme={scheme} onReady={onReady} />
    </Canvas>
  )
}

export function HeroMouseLayer({ play, onReady }: { play: boolean; onReady?: () => void }) {
  const desktop = matchMedia('(min-width: 768px)').matches

  useEffect(() => {
    if (!desktop) onReady?.()
  }, [desktop, onReady])

  if (!desktop) return null

  return (
    <Canvas
      frameloop="demand"
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      camera={camera}
      style={{ width: '100%', height: '100%' }}
    >
      <FrameLimiter fps={60} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 4, 3]} intensity={0.4} />
      <PixelMouseScene play={play} onReady={onReady} />
    </Canvas>
  )
}
