import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DebugPanel } from './DebugPanel'
import { DEFAULT_DEBUG, type DebugParams } from './debugParams'
import { Lightbox } from './Lightbox'
import { startStampScrollBus } from './scrollBus'
import { StampCard, type CardOrigin } from './StampCard'
import { buildStamps, stampFieldBands, type FriendItem, type StampDef, type StampId } from './stamps'
import './stamp-gallery.css'

type ViewerState = {
  id: StampId
  origin: CardOrigin
}

type Props = {
  /** 友链数据：name / url / desc */
  items: FriendItem[]
  className?: string
}

/**
 * 邮票墙 —— 从 quickDemos/stamp-impasto 移植的主组件。
 *
 * DOM 邮票群 + 悬停 3D 倾斜 + WebGL 烫金/喷砂 shader + 灯箱检视。
 * 数据由 props 传入（友链），调色面板仅 DEV 构建可见。
 */
export function StampGallery({ items, className }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState<StampId | null>(null)
  const [viewer, setViewer] = useState<ViewerState | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [debug, setDebug] = useState<DebugParams>(DEFAULT_DEBUG)

  const stamps: StampDef[] = useMemo(() => buildStamps(items), [items])
  const bands = useMemo(() => stampFieldBands(items.length), [items.length])

  const openStamp = useMemo(
    () => stamps.find((stamp) => stamp.id === viewer?.id) ?? null,
    [stamps, viewer],
  )

  const onFocus = useCallback((id: StampId | null) => {
    setFocused(id)
  }, [])

  const onOpen = useCallback((id: StampId, origin: CardOrigin) => {
    setFocused(null)
    setViewer({ id, origin })
    setViewerOpen(true)
  }, [])

  const baseWidth = useMemo(() => {
    if (typeof window === 'undefined') return 176
    const { innerWidth: w, innerHeight: h } = window
    return Math.max(132, Math.min(220, w * 0.14, h * 0.22))
  }, [])

  const viewerActive = viewer !== null
  const previewTargetId = focused ?? stamps[0]?.id ?? ''

  // 灯箱打开时给 body 打标记，宿主页面用它模糊背后的文字 ——
  // 组件不直接碰页面元素，只把状态说出去（与原型 body[data-stamp-focus] 同款约定）
  useEffect(() => {
    document.body.classList.toggle('has-stamp-viewer', viewerActive)
    return () => document.body.classList.remove('has-stamp-viewer')
  }, [viewerActive])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    return startStampScrollBus(stage)
  }, [])

  return (
    <div
      ref={stageRef}
      className={`stamp-stage${viewerActive ? ' has-viewer' : ''}${className ? ` ${className}` : ''}`}
      style={{
        ['--viewer-blur' as string]: `${debug.dimBlur}px`,
        ['--stamp-bands' as string]: bands,
      }}
    >
      <div className="stamp-field" aria-label="邮票作品集">
        {stamps.map((stamp) => (
          <StampCard
            key={stamp.id}
            stamp={stamp}
            baseWidth={baseWidth}
            isFocused={focused === stamp.id && !viewerActive}
            isDimmed={
              viewerActive
                ? viewer?.id !== stamp.id
                : focused !== null && focused !== stamp.id
            }
            // viewerOpen 在关闭动作一开始就翻 false —— 卡片从那一刻开始按
            // viewerTiming 的时序延迟渐显，与旧邮票落点渐隐同步（交叉淡化）
            isOpen={viewerOpen && viewer?.id === stamp.id}
            isViewerActive={viewerActive}
            isPreviewTarget={
              debug.previewEnabled && !viewerActive && stamp.id === previewTargetId
            }
            debug={debug}
            onFocus={onFocus}
            onOpen={onOpen}
          />
        ))}
      </div>

      {/* 调色台：原型实验工具，仅本地开发可见，线上构建不打包 */}
      {import.meta.env.DEV && <DebugPanel params={debug} onChange={setDebug} />}

      <AnimatePresence
        onExitComplete={() => {
          setViewer(null)
        }}
      >
        {viewerOpen && openStamp && viewer && (
          <Lightbox
            key={openStamp.id}
            stamp={openStamp}
            origin={viewer.origin}
            debug={debug}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
