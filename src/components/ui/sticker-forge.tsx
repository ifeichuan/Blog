"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import {
  createSticker,
  type StickerInstance,
  type StickerOptions,
  type StickerPoint,
  type StickerSource,
} from "@/lib/sticker-forge/sticker-forge";
import { cn } from "@/lib/utils";

export type {
  StickerBackOptions,
  StickerImageSource,
  StickerInstance,
  StickerOptions,
  StickerOutlineOptions,
  StickerPeelOptions,
  StickerPoint,
  StickerShadowOptions,
  StickerSoundOptions,
  StickerSource,
  StickerSvgSource,
  StickerTextSource,
} from "@/lib/sticker-forge/sticker-forge";

export interface StickerReadyDetail {
  width: number;
  height: number;
  hasTransparency: boolean;
}

export interface StickerPeelDetail {
  amount: number;
  progress: number;
  origin?: StickerPoint | null;
  direction?: StickerPoint;
}

export interface StickerPeelEndDetail {
  amount: number;
  progress: number;
  willReset: boolean;
}

export interface StickerErrorDetail {
  message: string;
}

export interface StickerForgeProps extends StickerOptions {
  className?: string;
  style?: CSSProperties;
  onReady?: (detail: StickerReadyDetail) => void;
  onPeelStart?: (detail: StickerPeelDetail) => void;
  onPeelChange?: (detail: StickerPeelDetail) => void;
  onPeelEnd?: (detail: StickerPeelEndDetail) => void;
  onError?: (detail: StickerErrorDetail) => void;
}

const EVENT_NAME_MAP = {
  onReady: "ready",
  onPeelStart: "peelstart",
  onPeelChange: "peelchange",
  onPeelEnd: "peelend",
  onError: "error",
} as const;

function pickOptionProps(props: Partial<StickerOptions>): StickerOptions {
  const out: StickerOptions = {};
  if (props.source !== undefined) out.source = props.source;
  if (props.outline !== undefined) out.outline = props.outline;
  if (props.shadow !== undefined) out.shadow = props.shadow;
  if (props.peel !== undefined) out.peel = props.peel;
  if (props.back !== undefined) out.back = props.back;
  if (props.sound !== undefined) out.sound = props.sound;
  if (props.tilt !== undefined) out.tilt = props.tilt;
  if (props.wind !== undefined) out.wind = props.wind;
  if (props.quality !== undefined) out.quality = props.quality;
  return out;
}

export const StickerForge = forwardRef<StickerInstance | null, StickerForgeProps>(
  function StickerForge(props, ref) {
    const {
      className,
      style,
      source,
      outline,
      shadow,
      peel,
      back,
      sound,
      tilt,
      wind,
      quality,
      onReady,
      onPeelStart,
      onPeelChange,
      onPeelEnd,
      onError,
    } = props;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<StickerInstance | null>(null);
    // 串行化 createSticker：React StrictMode 双重挂载时，避免两个 createSticker
    // 在同一容器并发（双 WebGL context / 双 animation loop 会让拖拽卡顿失灵）。
    const initChainRef = useRef<Promise<void>>(Promise.resolve());

    // 最新事件回调，避免 effect 因回调变化重订阅引擎事件。
    const handlersRef = useRef({ onReady, onPeelStart, onPeelChange, onPeelEnd, onError });
    handlersRef.current = { onReady, onPeelStart, onPeelChange, onPeelEnd, onError };

    useImperativeHandle(
      ref,
      () => ({
        setSource: (src: StickerSource) => instanceRef.current?.setSource(src) ?? Promise.resolve(),
        setOptions: (opts) => instanceRef.current?.setOptions(opts),
        reset: () => instanceRef.current?.reset(),
        resize: () => instanceRef.current?.resize(),
        getState: () =>
          instanceRef.current?.getState() ?? {
            ready: false,
            dragging: false,
            progress: 0,
            grabPoint: null,
            pointer: null,
          },
        destroy: () => instanceRef.current?.destroy(),
      }),
      []
    );

    // 挂载：创建引擎实例并订阅事件。容器尺寸由调用方决定。
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      let cancelled = false;

      const dispatch = (name: string) => (event: Event) => {
        const detail = (event as CustomEvent).detail;
        const h = handlersRef.current;
        if (name === "ready") h.onReady?.(detail);
        else if (name === "peelstart") h.onPeelStart?.(detail);
        else if (name === "peelchange") h.onPeelChange?.(detail);
        else if (name === "peelend") h.onPeelEnd?.(detail);
        else if (name === "error") h.onError?.(detail);
      };

      const listeners = Object.entries(EVENT_NAME_MAP).map(([, name]) => {
        const handler = dispatch(name);
        container.addEventListener(name, handler);
        return { name, handler };
      });

      // 串行化：等上一个 createSticker 完成（含被 cancelled 后的 destroy）再启动。
      const ready = initChainRef.current.then<StickerInstance | null>(() => {
        if (cancelled) return null;
        return createSticker(container, pickOptionProps(props));
      });
      initChainRef.current = ready.then(
        () => undefined,
        () => undefined,
      );

      ready
        .then((instance) => {
          if (!instance || cancelled) {
            instance?.destroy();
            return;
          }
          instanceRef.current = instance;
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          handlersRef.current.onError?.({ message });
        });

      return () => {
        cancelled = true;
        for (const { name, handler } of listeners) {
          container.removeEventListener(name, handler);
        }
        ready.then((instance) => instance?.destroy());
        instanceRef.current = null;
      };
      // 仅在挂载时创建一次；source/options 的后续变化由下面的 effect 驱动。
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // source 变化 → setSource（跳过首次，挂载时 createSticker 已处理）。
    // 仅以序列化内容为依赖。source 是对象引用，父组件每次渲染都会重建
    // （即使内容未变），若放进依赖，拖拽时 onPeelChange→setState→重渲染 会
    // 反复触发 setSource，把贴纸 reset 掉，表现为“刚拖就弹回”。
    const sourceKey = JSON.stringify(source) ?? "";
    const firstSourceRef = useRef(true);
    useEffect(() => {
      if (firstSourceRef.current) {
        firstSourceRef.current = false;
        return;
      }
      if (source) void instanceRef.current?.setSource(source);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceKey]);

    // 其余 options 变化 → setOptions（深度合并，跳过首次）。
    const optionsKey = JSON.stringify({ outline, shadow, peel, back, sound, tilt, wind, quality });
    const firstOptionsRef = useRef(true);
    useEffect(() => {
      if (firstOptionsRef.current) {
        firstOptionsRef.current = false;
        return;
      }
      instanceRef.current?.setOptions(
        pickOptionProps({ outline, shadow, peel, back, sound, tilt, wind, quality })
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [optionsKey]);

    const setContainer = useCallback((node: HTMLDivElement | null) => {
      containerRef.current = node;
    }, []);

    return (
      <div
        ref={setContainer}
        className={cn(
          "sticker-forge-root relative block h-full w-full touch-none select-none",
          className
        )}
        style={style}
        role="img"
        aria-label={
          source && source.type === "text" ? source.text : "Interactive peel sticker"
        }
      />
    );
  }
);

StickerForge.displayName = "StickerForge";
