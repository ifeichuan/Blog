import { useCallback, useEffect, useRef, useState } from "react";
import { useUiSound } from "@/hooks/use-ui-sound";
import {
  prefersDark,
  readSiteTheme,
  setSiteTheme,
  syncThemeColorMeta,
} from "@/lib/theme";

const STORAGE_KEY = "blog-reader-settings";

type ThemeKey = "light" | "sepia" | "dark" | "night";
const THEME_ORDER: ThemeKey[] = ["light", "sepia", "dark", "night"];
const THEME_ICONS: Record<ThemeKey, string> = {
  light: "☀️",
  sepia: "📜",
  dark: "🌙",
  night: "🌑",
};

const FONT_OPTIONS = [
  {
    id: "serif",
    label: "衬线",
    family: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", serif',
  },
  {
    id: "sans",
    label: "Maple",
    family:
      '"Maple Mono NF CN", "Maple Mono", system-ui, sans-serif',
  },
  {
    id: "system",
    label: "系统",
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
] as const;

interface Settings {
  theme: ThemeKey;
  fontSize: number;
  lineHeight: number;
  fontIndex: number;
}

const DEFAULTS: Settings = {
  theme: "light",
  fontSize: 18,
  lineHeight: 1.8,
  fontIndex: 0,
};

function loadSettings(): Settings {
  let stored: Partial<Settings> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {}

  // 首次进文章页时没有 reader 皮肤，从全站 site-theme 推一个，
  // 而不是硬落 light —— 与 BlogPost 的首帧内联脚本同一套规则。
  const site = readSiteTheme();
  const theme =
    stored.theme ??
    (site === "dark" || (site === "system" && prefersDark())
      ? "dark"
      : "light");

  return { ...DEFAULTS, ...stored, theme };
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

/** 走暗色 token palette 的阅读主题。sepia 保持亮色底，night 是深底。 */
const DARK_THEMES = new Set(["dark", "night"]);

function applyToDOM(s: Settings) {
  const root = document.getElementById("reader-root");
  if (!root) return;
  root.setAttribute("data-reader-theme", s.theme);

  // token 的 dark palette 挂在 :root[data-fc-theme='dark']，而 reader 主题挂在
  // #reader-root 上 —— 两个作用域不重合。这里把 reader 的明暗意图同步到 <html>，
  // 让 --fc-* 跟着切换，reader 主题就不必再手写一套暗色值。
  const mode = DARK_THEMES.has(s.theme) ? "dark" : "light";
  document.documentElement.dataset.fcTheme = mode;
  syncThemeColorMeta(mode);

  const article = root.querySelector(".reader-article") as HTMLElement | null;
  if (article) {
    article.style.fontSize = `${s.fontSize}px`;
    article.style.lineHeight = String(s.lineHeight);
    article.style.fontFamily = FONT_OPTIONS[s.fontIndex].family;
  }
}

export default function ReaderControls() {
  const { play: playSound } = useUiSound();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Init from localStorage
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applyToDOM(s);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // clamp
      next.fontSize = Math.min(28, Math.max(14, next.fontSize));
      next.lineHeight =
        Math.round(Math.min(2.4, Math.max(1.4, next.lineHeight)) * 10) / 10;
      next.fontIndex =
        ((next.fontIndex % FONT_OPTIONS.length) + FONT_OPTIONS.length) %
        FONT_OPTIONS.length;
      saveSettings(next);
      applyToDOM(next);
      return next;
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const font = FONT_OPTIONS[settings.fontIndex];
  const themeIcon = THEME_ICONS[settings.theme];

  return (
    <div ref={panelRef} className="reader-controls-wrapper">
      {/* Toggle button */}
      <button
        onClick={() => {
          playSound(open ? "toggle-off" : "toggle-on");
          setOpen((value) => !value);
        }}
        className="reader-ctrl-toggle"
        title="阅读设置"
        aria-label="阅读设置"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {/* Settings panel */}
      {open && (
        <div className="reader-ctrl-panel">
          {/* Theme */}
          <div className="reader-ctrl-row">
            <span className="reader-ctrl-label">主题</span>
            <button
              className="reader-ctrl-btn theme-btn"
              onClick={() => {
                playSound("click");
                const idx = THEME_ORDER.indexOf(settings.theme);
                const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
                update({ theme: next });
                // 反写全站主题，离开文章页后明暗不丢。sepia 仍算亮色 ——
                // 它是亮底阅读皮肤，页面其余部分跟着走亮才协调。
                setSiteTheme(DARK_THEMES.has(next) ? "dark" : "light");
              }}
            >
              <span>{themeIcon}</span>
              <span className="theme-name">{settings.theme}</span>
            </button>
          </div>

          {/* Font size */}
          <div className="reader-ctrl-row">
            <span className="reader-ctrl-label">字号</span>
            <div className="reader-ctrl-group">
              <button
                className="reader-ctrl-btn"
                onClick={() => update({ fontSize: settings.fontSize - 1 })}
              >
                A-
              </button>
              <span className="reader-ctrl-value">{settings.fontSize}</span>
              <button
                className="reader-ctrl-btn"
                onClick={() => update({ fontSize: settings.fontSize + 1 })}
              >
                A+
              </button>
            </div>
          </div>

          {/* Line height */}
          <div className="reader-ctrl-row">
            <span className="reader-ctrl-label">行高</span>
            <div className="reader-ctrl-group">
              <button
                className="reader-ctrl-btn"
                onClick={() =>
                  update({ lineHeight: settings.lineHeight - 0.1 })
                }
              >
                −
              </button>
              <span className="reader-ctrl-value">
                {settings.lineHeight.toFixed(1)}
              </span>
              <button
                className="reader-ctrl-btn"
                onClick={() =>
                  update({ lineHeight: settings.lineHeight + 0.1 })
                }
              >
                +
              </button>
            </div>
          </div>

          {/* Font family */}
          <div className="reader-ctrl-row">
            <span className="reader-ctrl-label">字体</span>
            <button
              className="reader-ctrl-btn font-btn"
              onClick={() =>
                update({ fontIndex: settings.fontIndex + 1 })
              }
            >
              {font.label}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .reader-controls-wrapper {
          position: relative;
        }
        .reader-ctrl-toggle {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--reader-ctrl-bg, rgba(255,249,240,0.95));
          border: 1px solid var(--reader-ctrl-border, #e8e2d4);
          color: var(--reader-ctrl-text, #555);
          cursor: pointer;
          transition: background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease;
          backdrop-filter: blur(12px);
        }
        .reader-ctrl-toggle:hover {
          background: var(--reader-ctrl-hover, rgba(0,0,0,0.05));
        }
        .reader-ctrl-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          padding: 12px;
          border-radius: 14px;
          background: var(--reader-ctrl-bg, rgba(255,249,240,0.95));
          border: 1px solid var(--reader-ctrl-border, #e8e2d4);
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: reader-panel-in 0.15s ease-out;
          transition: background-color 0.4s ease, border-color 0.4s ease;
        }
        @keyframes reader-panel-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .reader-ctrl-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .reader-ctrl-label {
          font-size: 13px;
          color: var(--reader-secondary, #666);
          flex-shrink: 0;
          user-select: none;
          transition: color 0.4s ease;
        }
        .reader-ctrl-group {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .reader-ctrl-value {
          font-size: 13px;
          color: var(--reader-text, #2c2c2c);
          min-width: 32px;
          text-align: center;
          font-variant-numeric: tabular-nums;
          transition: color 0.4s ease;
        }
        .reader-ctrl-btn {
          height: 30px;
          min-width: 30px;
          padding: 0 8px;
          border-radius: 8px;
          border: 1px solid var(--reader-ctrl-border, #e8e2d4);
          background: transparent;
          color: var(--reader-ctrl-text, #555);
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.4s ease, border-color 0.4s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          user-select: none;
        }
        .reader-ctrl-btn:hover {
          background: var(--reader-ctrl-hover, rgba(0,0,0,0.05));
        }
        .reader-ctrl-btn:active {
          transform: scale(0.95);
        }
        .theme-btn, .font-btn {
          flex: 1;
          justify-content: center;
        }
        .theme-name {
          text-transform: capitalize;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
