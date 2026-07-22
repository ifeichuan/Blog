import { cn } from "@/lib/utils";
import { useReducedMotion } from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  type LiquidFrame,
  type LiquidMode,
  type LiquidPeelParameters,
  liquidPath,
} from "./liquid-path";

export type LiquidConnectorProps = {
  open: boolean;
  upperContent: ReactNode;
  lowerContent: ReactNode;
  className?: string;
  ariaLabel?: string;
  surfaceColor?: string;
  outlineColor?: string;
  focusColor?: string;
  debug?: boolean;
  gap?: number;
  peelParameters?: Partial<LiquidPeelParameters>;
  onFrame?: (frame: LiquidFrame) => void;
  onOpenComplete?: () => void;
  onCloseComplete?: () => void;
};

type Runtime = {
  age: number;
  direction: "idle" | "opening" | "closing";
  gap: number;
  lastTime: number;
  mode: LiquidMode;
  peakOpeningTension: number;
  raf: number;
  tearAge: number;
  tearStrength: number;
  velocity: number;
};

const geometry = liquidPath.LIQUID_GEOMETRY;

function percent(value: number, total: number) {
  return `${((value / total) * 100).toFixed(4)}%`;
}

function initialRuntime(open: boolean): Runtime {
  const gap = open ? geometry.restGap : geometry.hiddenGap;
  return {
    age: 0,
    direction: "idle",
    gap,
    lastTime: 0,
    mode: liquidPath.resolveLiquidMode(undefined, gap),
    peakOpeningTension: 0,
    raf: 0,
    tearAge: -1,
    tearStrength: 0,
    velocity: 0,
  };
}

function initialFrame(
  runtime: Runtime,
  debug: boolean,
  peelParameters: Partial<LiquidPeelParameters>,
) {
  return liquidPath.createLiquidFrame(runtime.gap, 0, {
    mode: runtime.mode,
    debug,
    peelParameters,
  });
}

export function LiquidConnector({
  open,
  upperContent,
  lowerContent,
  className,
  ariaLabel = "Liquid connector",
  surfaceColor = "var(--popover)",
  outlineColor = "var(--border)",
  focusColor = "var(--ring)",
  debug = false,
  gap,
  peelParameters,
  onFrame,
  onOpenComplete,
  onCloseComplete,
}: LiquidConnectorProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const hostRef = useRef<HTMLDivElement>(null);
  const fillPathRef = useRef<SVGPathElement>(null);
  const edgePathRef = useRef<SVGPathElement>(null);
  const debugActualRef = useRef<SVGPathElement>(null);
  const debugOutputRef = useRef<SVGPathElement>(null);
  const debugInputRef = useRef<SVGPathElement>(null);
  const debugContactZoneRef = useRef<SVGPathElement>(null);
  const debugContactBandRef = useRef<SVGPathElement>(null);
  const debugWaistRef = useRef<SVGPathElement>(null);
  const upperRef = useRef<HTMLDivElement>(null);
  const lowerRef = useRef<HTMLDivElement>(null);
  const lowerInnerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const initialFrameRef = useRef<LiquidFrame | null>(null);
  const previousOpenRef = useRef(open);
  const openRef = useRef(open);
  const debugRef = useRef(debug);
  const peelParametersRef = useRef(liquidPath.normalizePeelParameters(peelParameters));
  const onFrameRef = useRef(onFrame);
  const onOpenCompleteRef = useRef(onOpenComplete);
  const onCloseCompleteRef = useRef(onCloseComplete);

  onOpenCompleteRef.current = onOpenComplete;
  onCloseCompleteRef.current = onCloseComplete;
  onFrameRef.current = onFrame;
  debugRef.current = debug;
  peelParametersRef.current = liquidPath.normalizePeelParameters(peelParameters);

  if (!runtimeRef.current) runtimeRef.current = initialRuntime(open);
  if (!initialFrameRef.current) {
    initialFrameRef.current = initialFrame(
      runtimeRef.current,
      debug,
      peelParametersRef.current,
    );
  }
  const firstFrame = initialFrameRef.current;

  const applyFrame = useCallback((frame: LiquidFrame) => {
    fillPathRef.current?.setAttribute("d", frame.d);
    edgePathRef.current?.setAttribute("d", frame.edgeD);

    const debugGeometry = frame.debug;
    debugActualRef.current?.setAttribute("d", debugGeometry?.actualD ?? "");
    debugOutputRef.current?.setAttribute("d", debugGeometry?.outputD ?? "");
    debugInputRef.current?.setAttribute("d", debugGeometry?.inputD ?? "");
    debugContactZoneRef.current?.setAttribute(
      "d",
      debugGeometry?.contactZoneD ?? "",
    );
    debugContactBandRef.current?.setAttribute(
      "d",
      debugGeometry?.contactBandD ?? "",
    );
    debugWaistRef.current?.setAttribute("d", debugGeometry?.waistD ?? "");

    const upper = upperRef.current;
    if (upper) {
      upper.style.top = percent(frame.outputY, geometry.viewHeight);
      upper.style.height = percent(frame.outputHeight, geometry.viewHeight);
      upper.style.opacity = frame.outputOpacity.toFixed(3);
      upper.style.transform = `scaleY(${frame.outputScaleY.toFixed(3)})`;
      const interactive =
        openRef.current &&
        runtimeRef.current?.direction === "idle" &&
        frame.outputOpacity > 0.88;
      upper.style.pointerEvents = interactive ? "auto" : "none";
      upper.inert = !interactive;
      upper.setAttribute("aria-hidden", frame.outputOpacity > 0.08 ? "false" : "true");
    }

    const lower = lowerRef.current;
    if (lower) {
      lower.style.top = percent(frame.inputVisualY, geometry.viewHeight);
      lower.style.height = percent(frame.inputVisualHeight, geometry.viewHeight);
    }

    const lowerInner = lowerInnerRef.current;
    if (lowerInner) {
      lowerInner.style.height = percent(frame.inputContentHeight, frame.inputVisualHeight);
      lowerInner.style.transform =
        `translateY(${percent(frame.inputContentY - frame.inputVisualY, frame.inputVisualHeight)}) ` +
        `scaleY(${frame.inputContentScaleY.toFixed(3)})`;
    }

    if (hostRef.current) {
      hostRef.current.dataset.liquidMode = frame.mode;
      hostRef.current.dataset.liquidPhase = frame.phase;
    }

    onFrameRef.current?.(frame);
  }, []);

  useEffect(() => {
    openRef.current = open;
    const runtime = runtimeRef.current;
    if (!runtime) return;

    if (typeof gap === "number") {
      cancelAnimationFrame(runtime.raf);
      runtime.raf = 0;
      runtime.direction = "idle";
      runtime.age = 0;
      runtime.gap = gap;
      runtime.velocity = 0;
      runtime.mode = liquidPath.resolveScrubMode(
        runtime.mode,
        gap,
        peelParametersRef.current,
      );
      previousOpenRef.current = open;
      applyFrame(
        liquidPath.createLiquidFrame(gap, 0, {
          mode: runtime.mode,
          debug: debugRef.current,
          peelParameters: peelParametersRef.current,
          scrub: true,
        }),
      );
      hostRef.current?.removeAttribute("data-animating");
      return;
    }

    if (previousOpenRef.current === open) return;
    previousOpenRef.current = open;

    cancelAnimationFrame(runtime.raf);
    runtime.raf = 0;
    runtime.direction = open ? "opening" : "closing";
    runtime.age = 0;
    runtime.lastTime = performance.now();
    runtime.peakOpeningTension = 0;
    runtime.tearAge = -1;
    runtime.tearStrength = 0;

    const finish = () => {
      runtime.direction = "idle";
      runtime.raf = 0;
      runtime.velocity = 0;
      runtime.gap = open ? geometry.restGap : geometry.hiddenGap;
      runtime.mode = liquidPath.resolveLiquidMode(
        runtime.mode,
        runtime.gap,
        0,
        peelParametersRef.current,
      );
      applyFrame(
        liquidPath.createLiquidFrame(runtime.gap, 0, {
          mode: runtime.mode,
          debug: debugRef.current,
          peelParameters: peelParametersRef.current,
        }),
      );
      hostRef.current?.removeAttribute("data-animating");
      upperRef.current?.style.removeProperty("will-change");
      lowerRef.current?.style.removeProperty("will-change");
      if (lowerRef.current) lowerRef.current.inert = false;
      if (open) onOpenCompleteRef.current?.();
      else onCloseCompleteRef.current?.();
    };

    if (reducedMotion) {
      finish();
      return;
    }

    hostRef.current?.setAttribute("data-animating", "");
    if (upperRef.current) upperRef.current.style.willChange = "opacity, transform";
    if (lowerRef.current) {
      lowerRef.current.inert = true;
      lowerRef.current.style.willChange = "transform";
    }

    const tick = (now: number) => {
      const delta = Math.min(0.032, Math.max(0.001, (now - runtime.lastTime) / 1000));
      runtime.lastTime = now;
      runtime.age += delta;

      const sample = liquidPath.sampleMeasuredTransition(
        runtime.direction === "opening" ? "opening" : "closing",
        runtime.age,
        geometry.hiddenGap,
        geometry.restGap,
      );
      runtime.gap = sample.gap;
      runtime.velocity = sample.velocity;
      if (runtime.direction === "opening") {
        runtime.peakOpeningTension = Math.max(
          runtime.peakOpeningTension,
          liquidPath.openingTension(runtime.velocity),
        );
      }

      const nextMode = liquidPath.resolveLiquidMode(
        runtime.mode,
        runtime.gap,
        runtime.velocity,
        peelParametersRef.current,
      );
      if (runtime.mode === "merged" && nextMode === "detached") {
        runtime.tearStrength = runtime.peakOpeningTension;
        runtime.tearAge = runtime.tearStrength > 0 ? 0 : -1;
      } else if (runtime.mode === "detached" && nextMode === "merged") {
        runtime.tearStrength = 0;
        runtime.tearAge = -1;
      }
      runtime.mode = nextMode;
      if (runtime.tearAge >= 0) runtime.tearAge += delta;

      applyFrame(
        liquidPath.createLiquidFrame(runtime.gap, runtime.velocity, {
          mode: runtime.mode,
          tearAge: runtime.tearAge,
          tearStrength: runtime.tearStrength,
          closeAge: runtime.direction === "closing" ? runtime.age : -1,
          openAge: runtime.direction === "opening" ? runtime.age : -1,
          openStrength: runtime.peakOpeningTension,
          debug: debugRef.current,
          peelParameters: peelParametersRef.current,
        }),
      );

      if (sample.done) finish();
      else runtime.raf = requestAnimationFrame(tick);
    };

    runtime.raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(runtime.raf);
      runtime.raf = 0;
    };
  }, [applyFrame, gap, open, reducedMotion]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.mode =
      typeof gap === "number"
        ? liquidPath.resolveScrubMode(
            runtime.mode,
            gap,
            peelParametersRef.current,
          )
        : liquidPath.resolveLiquidMode(
            runtime.mode,
            runtime.gap,
            runtime.velocity,
            peelParametersRef.current,
          );
    applyFrame(
      liquidPath.createLiquidFrame(runtime.gap, runtime.velocity, {
        mode: runtime.mode,
        debug,
        peelParameters: peelParametersRef.current,
        scrub: typeof gap === "number",
      }),
    );
  }, [
    applyFrame,
    debug,
    peelParameters?.couplingRadius,
    peelParameters?.detachGap,
    peelParameters?.pull,
    peelParameters?.transition,
  ]);

  useEffect(() => {
    return () => {
      const runtime = runtimeRef.current;
      if (runtime) cancelAnimationFrame(runtime.raf);
    };
  }, []);

  const variables = {
    "--liquid-react-surface": surfaceColor,
    "--liquid-react-outline": outlineColor,
    "--liquid-react-focus": focusColor,
  } as CSSProperties;

  return (
    <div
      ref={hostRef}
      role="group"
      aria-label={ariaLabel}
      data-liquid-mode={firstFrame.mode}
      data-liquid-phase={firstFrame.phase}
      className={cn(
        "group/liquid relative isolate w-full overflow-visible [aspect-ratio:520/300]",
        className,
      )}
      style={variables}
    >
      <svg
        viewBox={`0 0 ${geometry.viewWidth} ${geometry.viewHeight}`}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <path
          ref={fillPathRef}
          d={firstFrame.d}
          fill="var(--liquid-react-surface)"
        />
        <path
          ref={edgePathRef}
          d={firstFrame.edgeD}
          fill="none"
          stroke="var(--liquid-react-outline)"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
          className="transition-[stroke] group-focus-within/liquid:stroke-[var(--liquid-react-focus)]"
        />
        <g className={debug ? "" : "hidden"}>
          <path
            ref={debugInputRef}
            d={firstFrame.debug?.inputD ?? ""}
            fill="none"
            stroke="#78a4ff"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            ref={debugOutputRef}
            d={firstFrame.debug?.outputD ?? ""}
            fill="none"
            stroke="#78a4ff"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            ref={debugContactZoneRef}
            d={firstFrame.debug?.contactZoneD ?? ""}
            fill="none"
            stroke="#ff5353"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            ref={debugContactBandRef}
            d={firstFrame.debug?.contactBandD ?? ""}
            fill="none"
            stroke="#ff5353"
            strokeDasharray="2 3"
            strokeOpacity="0.68"
            strokeWidth="0.85"
            vectorEffect="non-scaling-stroke"
          />
          <path
            ref={debugActualRef}
            d={firstFrame.debug?.actualD ?? ""}
            fill="none"
            stroke="#ff9348"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
          />
          <path
            ref={debugWaistRef}
            d={firstFrame.debug?.waistD ?? ""}
            fill="none"
            stroke="#ff5353"
            strokeDasharray="3 3"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>

      <div
        ref={upperRef}
        aria-hidden={firstFrame.outputOpacity <= 0.08}
        inert={!open}
        className="absolute origin-bottom overflow-hidden"
        style={{
          left: percent(40, geometry.viewWidth),
          top: percent(firstFrame.outputY, geometry.viewHeight),
          width: percent(440, geometry.viewWidth),
          height: percent(firstFrame.outputHeight, geometry.viewHeight),
          opacity: firstFrame.outputOpacity,
          transform: `scaleY(${firstFrame.outputScaleY})`,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {upperContent}
      </div>

      <div
        ref={lowerRef}
        className="absolute origin-bottom overflow-hidden"
        style={{
          left: percent(40, geometry.viewWidth),
          top: percent(firstFrame.inputVisualY, geometry.viewHeight),
          width: percent(440, geometry.viewWidth),
          height: percent(firstFrame.inputVisualHeight, geometry.viewHeight),
        }}
      >
        <div
          ref={lowerInnerRef}
          className="relative size-full origin-bottom"
          style={{
            transform:
              `translateY(${percent(firstFrame.inputContentY - firstFrame.inputVisualY, firstFrame.inputVisualHeight)}) ` +
              `scaleY(${firstFrame.inputContentScaleY})`,
          }}
        >
          {lowerContent}
        </div>
      </div>
    </div>
  );
}
