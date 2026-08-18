import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./hover-preview.css";

interface PreviewData {
  screenshotUrl: string;
  title?: string;
  description?: string;
}

const CARD_MAX_WIDTH = 400;
const CARD_FALLBACK_HEIGHT = 310;
const VIEWPORT_PAD = 16;
const CURSOR_GAP = 18;
const SHOW_DELAY = 220;
const HIDE_DELAY = 80;

const previewCache = new Map<string, PreviewData | null>();
const inflightRequests = new Map<string, Promise<PreviewData | null>>();
const loadedShots = new Set<string>();

const CACHE_STORAGE_KEY = "fc-hover-preview";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 80;

type StoredCache = {
  v: 1;
  savedAt: number;
  entries: [string, PreviewData | null][];
};

function prefetchShot(url: string) {
  if (!url || loadedShots.has(url)) return;
  const img = new Image();
  img.onload = () => {
    loadedShots.add(url);
  };
  img.src = url;
}

function persistPreviewCache() {
  try {
    const entries = [...previewCache].slice(-CACHE_MAX_ENTRIES);
    const payload: StoredCache = {
      v: 1,
      savedAt: Date.now(),
      entries,
    };
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function hydratePreviewCache() {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as StoredCache;
    if (data?.v !== 1 || !Array.isArray(data.entries)) return;
    if (Date.now() - data.savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_STORAGE_KEY);
      return;
    }
    for (const [url, preview] of data.entries) {
      previewCache.set(url, preview);
      if (preview?.screenshotUrl) prefetchShot(preview.screenshotUrl);
    }
  } catch {
    /* ignore broken payload */
  }
}

hydratePreviewCache();

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function prefersFineHover(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

async function fetchMicrolink(url: string): Promise<PreviewData | null> {
  if (previewCache.has(url)) return previewCache.get(url)!;
  if (inflightRequests.has(url)) return inflightRequests.get(url)!;

  const request = (async () => {
    try {
      const params = new URLSearchParams({
        url,
        screenshot: "true",
        "screenshot.width": "800",
        "screenshot.height": "500",
        "screenshot.type": "jpeg",
      });
      const res = await fetch(`https://api.microlink.io?${params}`);
      if (!res.ok) {
        previewCache.set(url, null);
        persistPreviewCache();
        return null;
      }
      const json = await res.json();
      if (json.status !== "success" || !json.data?.screenshot?.url) {
        previewCache.set(url, null);
        persistPreviewCache();
        return null;
      }
      const result: PreviewData = {
        screenshotUrl: json.data.screenshot.url,
        title: json.data.title,
        description: json.data.description,
      };
      previewCache.set(url, result);
      prefetchShot(result.screenshotUrl);
      persistPreviewCache();
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
  const [hostname, setHostname] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<number>(0);
  const hideTimer = useRef<number>(0);
  const raf = useRef<number>(0);
  const requestGen = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const openRef = useRef(false);
  const hrefRef = useRef<string | null>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const place = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = Math.min(CARD_MAX_WIDTH, Math.max(0, vw - VIEWPORT_PAD * 2));
    root.style.setProperty("--hp-w", `${cardW}px`);

    const cardH = cardRef.current?.offsetHeight || CARD_FALLBACK_HEIGHT;
    const { x: cx, y: cy } = pointer.current;

    let x = cx - cardW / 2;
    x = Math.min(Math.max(x, VIEWPORT_PAD), vw - cardW - VIEWPORT_PAD);

    let y = cy - cardH - CURSOR_GAP;
    if (y < VIEWPORT_PAD) y = cy + CURSOR_GAP;
    if (y + cardH > vh - VIEWPORT_PAD) {
      y = Math.max(VIEWPORT_PAD, vh - cardH - VIEWPORT_PAD);
    }

    root.style.setProperty("--hp-x", `${x}px`);
    root.style.setProperty("--hp-y", `${y}px`);
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, preview, loading, hostname, place]);

  const schedulePlace = useCallback(() => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      place();
    });
  }, [place]);

  const hide = useCallback(() => {
    window.clearTimeout(showTimer.current);
    showTimer.current = 0;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = 0;
    requestGen.current += 1;
    hrefRef.current = null;
    setOpen(false);
    setLoading(false);
  }, []);

  const reveal = useCallback(
    (href: string) => {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = 0;
      if (hrefRef.current === href && openRef.current) {
        place();
        return;
      }

      hrefRef.current = href;
      requestGen.current += 1;
      const gen = requestGen.current;
      const cached = previewCache.get(href) ?? null;

      const shotReady = Boolean(
        cached?.screenshotUrl && loadedShots.has(cached.screenshotUrl),
      );

      setHostname(hostnameOf(href));
      setPreview(cached);
      setImageLoaded(shotReady);
      setLoading(!cached);
      setOpen(true);
      place();

      if (cached) {
        if (cached.screenshotUrl) prefetchShot(cached.screenshotUrl);
        return;
      }

      void fetchMicrolink(href).then((result) => {
        if (gen !== requestGen.current) return;
        if (result) {
          setPreview(result);
          setLoading(false);
        } else {
          setPreview(null);
          setLoading(false);
          setOpen(false);
        }
      });
    },
    [place],
  );

  useEffect(() => {
    const article = document.querySelector(".reader-article");
    if (!article || !prefersFineHover()) return;

    const hostname = window.location.hostname;

    const externalFrom = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const link = target.closest<HTMLAnchorElement>("a[href^='http']");
      if (!link?.href || link.hostname === hostname) return null;
      return link;
    };

    const handleEnter = (e: Event) => {
      const link = externalFrom(e.target);
      if (!link) return;

      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");

      if (e instanceof MouseEvent) {
        pointer.current = { x: e.clientX, y: e.clientY };
        place();
      }

      window.clearTimeout(hideTimer.current);
      hideTimer.current = 0;
      window.clearTimeout(showTimer.current);

      const href = link.href;
      const delay = openRef.current ? 0 : SHOW_DELAY;
      showTimer.current = window.setTimeout(() => {
        showTimer.current = 0;
        reveal(href);
      }, delay);
    };

    const handleMove = (e: Event) => {
      if (!(e instanceof MouseEvent)) return;
      pointer.current = { x: e.clientX, y: e.clientY };
      if (openRef.current || showTimer.current) schedulePlace();
    };

    const handleLeave = (e: Event) => {
      const next = (e as MouseEvent).relatedTarget;
      if (next instanceof Element && article.contains(next)) {
        const stillOnLink = externalFrom(next);
        if (stillOnLink) return;
      }
      window.clearTimeout(showTimer.current);
      showTimer.current = 0;
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(hide, HIDE_DELAY);
    };

    const handleResize = () => {
      if (openRef.current) place();
    };

    article.addEventListener("mouseover", handleEnter);
    article.addEventListener("mousemove", handleMove);
    article.addEventListener("mouseout", handleLeave);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("lenis-scroll", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("resize", handleResize);

    return () => {
      article.removeEventListener("mouseover", handleEnter);
      article.removeEventListener("mousemove", handleMove);
      article.removeEventListener("mouseout", handleLeave);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("lenis-scroll", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [hide, place, reveal, schedulePlace]);

  const showCard = open && (Boolean(preview) || loading);
  const shot = preview?.screenshotUrl;

  return (
    <div
      ref={rootRef}
      className="hover-preview"
      data-open={showCard ? "true" : "false"}
      aria-hidden="true"
    >
      <div ref={cardRef} className="hover-preview__card">
        <div className="hover-preview__shot-wrap">
          {(loading || !imageLoaded) && (
            <div className="hover-preview__skeleton">
              <div className="hover-preview__skel-chrome">
                <i />
                <i />
                <i />
                <span />
              </div>
              <div className="hover-preview__skel-page">
                <b />
                <em />
                <em />
                <div>
                  <u />
                  <u />
                  <u />
                </div>
              </div>
              <div className="hover-preview__skel-scan" />
            </div>
          )}
          {shot && (
            <img
              key={shot}
              src={shot}
              alt=""
              className="hover-preview__shot"
              data-loaded={imageLoaded ? "true" : "false"}
              decoding="async"
              onLoad={(e) => {
                if (e.currentTarget.naturalWidth > 0) {
                  loadedShots.add(shot);
                  setImageLoaded(true);
                }
              }}
            />
          )}
        </div>
        {(hostname || preview?.title || preview?.description) && (
          <div className="hover-preview__meta">
            {hostname && <div className="hover-preview__host">{hostname}</div>}
            {preview?.title && (
              <div className="hover-preview__title">{preview.title}</div>
            )}
            {preview?.description && (
              <div className="hover-preview__desc">{preview.description}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
