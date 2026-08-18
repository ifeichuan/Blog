import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_DEBUG } from './debugParams'
import { liveFromDebug } from './shaderLive'
import { StampMesh, type ShaderLive, type StampMeshHandle } from './StampMesh'
import type { StampTextures } from './createStampTextures'

export type StampShaderClaim = {
  id: string
  slot: HTMLElement | null
  textures: StampTextures
  displayWidth: number
  live: ShaderLive
}

type StampShaderApi = {
  claim: (next: StampShaderClaim) => void
  release: (id: string) => void
  requestRender: () => void
}

const StampShaderContext = createContext<StampShaderApi | null>(null)
const StampPresentedContext = createContext<string | null>(null)

export function useStampShader() {
  return useContext(StampShaderContext)
}

export function useStampPresented() {
  return useContext(StampPresentedContext)
}

const IDLE_LIVE = liveFromDebug(DEFAULT_DEBUG, 0, { x: 0.5, y: 0.5 }, 0, 0)

/**
 * 全场只养一个 WebGL context。票卡 claim 时把 canvas 挪进自己的 shader 层，
 * 换票只换贴图和分辨率，不再编译、不再叠多个 context。
 */
export function StampShaderHost({ children }: { children: ReactNode }) {
  const meshRef = useRef<StampMeshHandle>(null)
  const claimantRef = useRef<string | null>(null)
  const [claim, setClaim] = useState<StampShaderClaim | null>(null)
  const [presentedId, setPresentedId] = useState<string | null>(null)

  const api = useMemo<StampShaderApi>(
    () => ({
      claim: (next) => {
        if (claimantRef.current !== next.id) setPresentedId(null)
        claimantRef.current = next.id
        setClaim(next)
      },
      release: (id) => {
        if (claimantRef.current !== id) return
        claimantRef.current = null
        setPresentedId(null)
        setClaim((current) => (current ? { ...current, slot: null, live: IDLE_LIVE } : null))
      },
      requestRender: () => meshRef.current?.requestRender(),
    }),
    [],
  )

  return (
    <StampShaderContext.Provider value={api}>
      <StampPresentedContext.Provider value={presentedId}>
        {children}
        <div className="stamp-shader-home" aria-hidden="true">
          <StampMesh
            ref={meshRef}
            stampKey={claim?.id ?? ''}
            slot={claim?.slot ?? null}
            albedoUrl={claim?.textures.albedoCanvas ?? null}
            heightUrl={claim?.textures.heightCanvas ?? null}
            width={claim?.textures.width ?? 512}
            height={claim?.textures.height ?? 512}
            live={claim?.live ?? IDLE_LIVE}
            displayWidth={claim?.displayWidth ?? 176}
            className="stamp-canvas"
            active={Boolean(claim?.slot)}
            onPresented={() => {
              if (claimantRef.current) setPresentedId(claimantRef.current)
            }}
          />
        </div>
      </StampPresentedContext.Provider>
    </StampShaderContext.Provider>
  )
}
