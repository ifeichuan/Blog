import { createElement, useMemo, useRef, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  variant?: "settle" | "noBounce";
  threshold?: number;
  rootMargin?: string;
  onAnimationComplete?: () => void;
  stepDuration?: number;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
  start?: boolean;
};

const BlurTextGsap = ({
  text = "",
  delay = 80,
  className = "",
  animateBy = "letters",
  direction = "top",
  variant = "settle",
  threshold = 0.1,
  rootMargin = "0px",
  onAnimationComplete,
  stepDuration = 0.28,
  as: Component = "p",
  start = true,
}: BlurTextProps) => {
  const elements = useMemo(() => {
    return animateBy === "words" ? text.split(" ") : text.split("");
  }, [animateBy, text]);

  const containerRef = useRef<HTMLElement>(null);
  const completeRef = useRef(onAnimationComplete);
  completeRef.current = onAnimationComplete;

  useGSAP(() => {
    const container = containerRef.current;
    if (!container || !start) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      gsap.set(container.children, {
        autoAlpha: 1,
        filter: "blur(0px)",
        y: 0,
        scale: 1,
      });
      completeRef.current?.();
      return;
    }

    const yOffset = direction === "top" ? -10 : 10;
    
    // Initial state
    gsap.set(container.children, {
      autoAlpha: 0,
      filter: "blur(5px)",
      y: yOffset,
      scale: 1.16,
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(container);

          const tl = gsap.timeline({
            onComplete: () => {
              completeRef.current?.();
            }
          });

          if (variant === "noBounce") {
            tl.to(container.children, {
              autoAlpha: 1,
              filter: "blur(0px)",
              y: 0,
              scale: 1,
              duration: stepDuration,
              ease: "power3.out", // approximation of custom cubic bezier
              stagger: delay / 1000,
            });
          } else {
            // Settle variant (bounce effect) - use GSAP's native back.out for natural overshoot
            tl.to(container.children, {
              autoAlpha: 1,
              filter: "blur(0px)",
              y: 0,
              scale: 1,
              duration: stepDuration * 2,
              ease: "back.out(2)", // native overshoot mimicking the keyframe bounce
              stagger: delay / 1000,
            });
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [
    delay,
    direction,
    variant,
    start,
    stepDuration,
    threshold,
    rootMargin,
  ]);

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
        aria-hidden="true"
        style={{
          display: "inline-block",
          transformOrigin: "50% 50%",
          opacity: 0, // initially hidden before JS kicks in
        }}
      >
        {segment === " " ? "\u00A0" : segment}
        {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
      </span>
    ))
  );
};

export default BlurTextGsap;
