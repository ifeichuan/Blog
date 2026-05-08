import {
  createElement,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";

type SnapshotValue = string | number;
type Snapshot = Record<string, SnapshotValue>;
type Easing = string | [number, number, number, number];
type SegmentStyleState = "initial" | "running" | "complete";

export type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  variant?: "settle" | "noBounce";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Snapshot;
  animationTo?: Snapshot[];
  easing?: Easing;
  onAnimationComplete?: () => void;
  stepDuration?: number;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
  start?: boolean;
};

const toCssEasing = (easing: Easing) => {
  return Array.isArray(easing) ? `cubic-bezier(${easing.join(", ")})` : easing;
};

const DEFAULT_EASING: Easing = [0.25, 1, 0.5, 1];
const COMPLETE_SEGMENT_STYLE = {
  opacity: 1,
  filter: "blur(0px)",
  transform: "translate3d(0, 0, 0) scale(1)",
} satisfies CSSProperties;

const toTransform = (snapshot: Snapshot) => {
  const y = snapshot.y ?? 0;
  const scale = snapshot.scale ?? 1;
  return `translate3d(0, ${y}px, 0) scale(${scale})`;
};

const toKeyframe = (snapshot: Snapshot): Keyframe => ({
  opacity: Number(snapshot.opacity ?? 1),
  filter: String(snapshot.filter ?? "blur(0px)"),
  transform: toTransform(snapshot),
});

const BlurText = ({
  text = "",
  delay = 80,
  className = "",
  animateBy = "letters",
  direction = "top",
  variant = "settle",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = DEFAULT_EASING,
  onAnimationComplete,
  stepDuration = 0.28,
  as: Component = "p",
  start = true,
}: BlurTextProps) => {
  const elements = useMemo(() => {
    return animateBy === "words" ? text.split(" ") : text.split("");
  }, [animateBy, text]);
  const containerRef = useRef<HTMLElement>(null);
  const segmentRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const completeRef = useRef(onAnimationComplete);
  const hasPlayedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  completeRef.current = onAnimationComplete;

  const defaultFrom = useMemo(
    () =>
      direction === "top"
        ? { filter: "blur(5px)", opacity: 0, scale: 1.16, y: -10 }
        : { filter: "blur(5px)", opacity: 0, scale: 1.16, y: 10 },
    [direction],
  );

  const defaultTo = useMemo(
    () =>
      variant === "noBounce"
        ? [{ filter: "blur(0px)", opacity: 1, scale: 1, y: 0 }]
        : [
            {
              filter: "blur(1.5px)",
              opacity: 0.72,
              scale: 1.03,
              y: direction === "top" ? 1.5 : -1.5,
            },
            { filter: "blur(0px)", opacity: 1, scale: 1, y: 0 },
          ],
    [direction, variant],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !start) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];

    const applyFinalStyles = () => {
      segmentRefs.current.forEach((segment) => {
        if (!segment) return;
        Object.assign(segment.style, COMPLETE_SEGMENT_STYLE);
        segment.style.willChange = "auto";
      });
    };

    const completeOnce = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      applyFinalStyles();
      completeRef.current?.();
    };

    const finishImmediately = () => {
      completeOnce();
    };

    const play = () => {
      if (hasPlayedRef.current) {
        if (hasCompletedRef.current) applyFinalStyles();
        return;
      }
      hasPlayedRef.current = true;

      if (mediaQuery.matches) {
        finishImmediately();
        return;
      }

      const fromSnapshot = animationFrom ?? defaultFrom;
      const toSnapshots = animationTo ?? defaultTo;
      const keyframes = [fromSnapshot, ...toSnapshots].map(toKeyframe);
      const totalDuration = stepDuration * Math.max(toSnapshots.length, 1);
      const cssEasing = toCssEasing(easing);
      const lastIndex = elements.length - 1;

      if (lastIndex < 0) {
        finishImmediately();
        return;
      }

      animations = segmentRefs.current
        .map((segment, index) => {
          if (!segment) return null;
          segment.style.willChange = "transform, filter, opacity";
          const animation = segment.animate(keyframes, {
            duration: totalDuration * 1000,
            delay: index * delay,
            easing: cssEasing,
            fill: "forwards",
          });

          animation.finished
            .then(() => {
              segment.style.willChange = "auto";
              if (index === lastIndex) completeOnce();
            })
            .catch(() => {});

          return animation;
        })
        .filter(Boolean) as Animation[];
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(container);
          play();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, [
    animationFrom,
    animationTo,
    defaultFrom,
    defaultTo,
    delay,
    easing,
    elements.length,
    rootMargin,
    start,
    stepDuration,
    threshold,
  ]);

  const segmentStyleState: SegmentStyleState = hasCompletedRef.current
    ? "complete"
    : hasPlayedRef.current
      ? "running"
      : "initial";

  const initialSegmentStyle = {
    opacity: 0,
    filter: "blur(5px)",
    transform:
      direction === "top"
        ? "translate3d(0, -10px, 0) scale(1.16)"
        : "translate3d(0, 10px, 0) scale(1.16)",
  } satisfies CSSProperties;

  const animatedSegmentStyle =
    segmentStyleState === "complete"
      ? COMPLETE_SEGMENT_STYLE
      : segmentStyleState === "initial"
        ? initialSegmentStyle
        : undefined;

  return createElement(
    Component,
    {
      ref: containerRef,
      "aria-label": text,
      className: `blur-text ${className} flex flex-wrap`,
      style: {
        display: "flex",
        flexWrap: "wrap",
        textWrap: Component === "p" ? "pretty" : "balance",
      } satisfies CSSProperties,
    },
    elements.map((segment, index) => (
      <span
        key={`${segment}-${index}`}
        ref={(node) => {
          segmentRefs.current[index] = node;
        }}
        aria-hidden="true"
        style={{
          display: "inline-block",
          transformOrigin: "50% 50%",
          ...animatedSegmentStyle,
        }}
      >
        {segment === " " ? "\u00A0" : segment}
        {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
      </span>
    )),
  );
};

export default BlurText;
