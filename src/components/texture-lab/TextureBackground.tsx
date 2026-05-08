import { useEffect, useRef, useState } from "react";
import { WebGLRenderer } from "./renderer";
import { PRESETS, createEffect, EFFECT_TYPES } from "./types";

interface TextureBackgroundProps {
  preset?: keyof typeof PRESETS;
  imageSrc?: string;
  className?: string;
  animate?: boolean;
}

export default function TextureBackground({
  preset = "analog-film",
  imageSrc = "/mesh.webp",
  className = "",
  animate = true,
}: TextureBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const seedRef = useRef(Math.random() * 100000);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer(canvas);
    } catch {
      return;
    }
    rendererRef.current = renderer;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      renderer.setImage(img);
      setLoaded(true);
    };
    img.src = imageSrc;

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!loaded || !rendererRef.current) return;

    const presetData = PRESETS[preset];
    if (!presetData) return;

    const effects = presetData.effects.map((e) => ({
      ...createEffect(e.type),
      enabled: e.enabled,
      params: { ...e.params },
    }));

    const renderer = rendererRef.current;
    const canvas = canvasRef.current!;

    const render = () => {
      if (animate) {
        seedRef.current += 0.5;
      }

      const width = canvas.clientWidth * window.devicePixelRatio;
      const height = canvas.clientHeight * window.devicePixelRatio;

      renderer.render(effects, seedRef.current, width, height);

      if (animate) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [loaded, preset, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
