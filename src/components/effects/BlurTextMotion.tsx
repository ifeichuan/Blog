import { createElement, useMemo, useRef, type CSSProperties } from "react";
import { motion, useInView } from "motion/react";

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

const BlurTextMotion = ({
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
  as = "p",
  start = true,
}: BlurTextProps) => {
  const elements = useMemo(() => {
    return animateBy === "words" ? text.split(" ") : text.split("");
  }, [animateBy, text]);

  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, {
    once: true,
    amount: threshold,
    margin: rootMargin as any,
  });

  const MotionComponent = useMemo(() => motion.create(as as any), [as]);

  const yOffset = direction === "top" ? -10 : 10;
  const bounceYOffset = direction === "top" ? 1.5 : -1.5;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay / 1000,
      },
    },
  };

  const transition = variant === "noBounce"
    ? { duration: stepDuration, ease: [0.25, 1, 0.5, 1] }
    : { type: "spring", duration: stepDuration * 2, bounce: 0.4 };

  const itemVariants = {
    hidden: {
      opacity: 0,
      filter: "blur(5px)",
      y: yOffset,
      scale: 1.16,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      scale: 1,
      transition: transition,
    },
  };

  return (
    <MotionComponent
      ref={containerRef}
      aria-label={text}
      className={`blur-text ${className} flex flex-wrap`}
      style={
        {
          display: "flex",
          flexWrap: "wrap",
          textWrap: as === "p" ? "pretty" : "balance",
        } as CSSProperties
      }
      variants={containerVariants}
      initial="hidden"
      animate={start && isInView ? "visible" : "hidden"}
      onAnimationComplete={onAnimationComplete}
    >
      {elements.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          aria-hidden="true"
          style={{
            display: "inline-block",
            transformOrigin: "50% 50%",
          }}
          variants={itemVariants}
        >
          {segment === " " ? "\u00A0" : segment}
          {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </MotionComponent>
  );
};

export default BlurTextMotion;
