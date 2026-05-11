import { useState, useCallback, useRef, useEffect } from "react";

interface PreviewData {
  screenshotUrl: string;
  title?: string;
  description?: string;
}

const previewCache = new Map<string, PreviewData | null>();
const inflightRequests = new Map<string, Promise<PreviewData | null>>();

async function fetchMicrolink(url: string): Promise<PreviewData | null> {
  if (previewCache.has(url)) return previewCache.get(url)!;
  if (inflightRequests.has(url)) return inflightRequests.get(url)!;

  const request = (async () => {
    try {
      const params = new URLSearchParams({
        url,
        screenshot: "true",
        "screenshot.width": "1280",
        "screenshot.height": "800",
        "screenshot.type": "jpeg",
      });
      const res = await fetch(`https://api.microlink.io?${params}`);
      if (!res.ok) {
        previewCache.set(url, null);
        return null;
      }
      const json = await res.json();
      if (json.status !== "success" || !json.data?.screenshot?.url) {
        previewCache.set(url, null);
        return null;
      }
      const result: PreviewData = {
        screenshotUrl: json.data.screenshot.url,
        title: json.data.title,
        description: json.data.description,
      };
      previewCache.set(url, result);
      return result;
    } catch {
      previewCache.set(url, null);
      return null;
    } finally {
      inflightRequests.delete(url);
    }
  })();

  inflightRequests.set(url, request);
  return request;
}

export function HoverLinkEnhancer() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  const fetchPreview = useCallback(async (url: string) => {
    if (previewCache.has(url)) {
      const cached = previewCache.get(url);
      if (cached) setPreview(cached);
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchMicrolink(url);
      if (result) {
        setPreview(result);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePosition = useCallback((e: MouseEvent) => {
    const cardWidth = 320;
    const cardHeight = 220;
    const offsetY = 16;

    let x = e.clientX - cardWidth / 2;
    let y = e.clientY - cardHeight - offsetY;

    if (x + cardWidth > window.innerWidth - 16) {
      x = window.innerWidth - cardWidth - 16;
    }
    if (x < 16) x = 16;
    if (y < 16) y = e.clientY + offsetY;

    setPosition({ x, y });
  }, []);

  useEffect(() => {
    const article = document.querySelector(".reader-article");
    if (!article) return;

    const hostname = window.location.hostname;

    const handleEnter = (e: Event) => {
      const link = e.currentTarget as HTMLAnchorElement;
      const href = link.href;
      if (!href || link.hostname === hostname) return;

      updatePosition(e as MouseEvent);

      hoverTimeout.current = setTimeout(() => {
        setIsVisible(true);
        setPreview(previewCache.get(href) || null);
        fetchPreview(href);
      }, 300);
    };

    const handleMove = (e: Event) => {
      if (isVisibleRef.current) {
        updatePosition(e as MouseEvent);
      }
    };

    const handleLeave = () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
      setIsVisible(false);
      setIsLoading(false);
    };

    const links = article.querySelectorAll<HTMLAnchorElement>(
      'a[href^="http"]',
    );

    links.forEach((link) => {
      if (link.hostname === hostname) return;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.addEventListener("mouseenter", handleEnter);
      link.addEventListener("mousemove", handleMove);
      link.addEventListener("mouseleave", handleLeave);
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener("mouseenter", handleEnter);
        link.removeEventListener("mousemove", handleMove);
        link.removeEventListener("mouseleave", handleLeave);
      });
    };
  }, [fetchPreview, updatePosition]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed pointer-events-none z-[1000] transition-all duration-200 ease-out ${
        preview || isLoading
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-95"
      }`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="bg-[#1a1a1a] rounded-xl p-1.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur-sm overflow-hidden">
        {isLoading && !preview ? (
          <div className="w-[300px] h-[180px] rounded-lg bg-[#2a2a2a] animate-pulse flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : preview ? (
          <>
            <img
              src={preview.screenshotUrl}
              alt={preview.title || ""}
              className="w-[300px] h-auto rounded-lg block"
              loading="lazy"
            />
            {preview.title && (
              <div className="px-2 pt-2 pb-1 text-xs text-white font-semibold truncate">
                {preview.title}
              </div>
            )}
            {preview.description && (
              <div className="px-2 pb-2 text-[11px] text-[#888] truncate">
                {preview.description}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
