/** 全站亮暗主题层。
 *
 * 与文章页的 reader 主题（blog-reader-settings，四种阅读皮肤）是两套东西：
 *   · site-theme     —— 全站明暗意图，system / light / dark，本文件负责
 *   · reader theme   —— 文章页的阅读皮肤，ReaderControls 负责
 *
 * 二者都最终落在 <html data-fc-theme>，所以需要一条优先级规则：
 * 文章页内 reader 主题赢（用户在那个页面做的选择更具体），其余页面听 site-theme。
 * 落地方式见 resolveFcTheme()。
 */

export type SiteTheme = "system" | "light" | "dark";

export const SITE_THEME_KEY = "site-theme";
export const THEME_CHANGE_EVENT = "site-theme-change";

/** reader 皮肤里走暗色 token palette 的那两个。与 ReaderControls 的 DARK_THEMES 同源。 */
const DARK_READER_THEMES = new Set(["dark", "night"]);

export function isSiteTheme(v: unknown): v is SiteTheme {
  return v === "system" || v === "light" || v === "dark";
}

export function readSiteTheme(): SiteTheme {
  try {
    const raw = localStorage.getItem(SITE_THEME_KEY);
    if (isSiteTheme(raw)) return raw;
  } catch {}
  return "system";
}

export function prefersDark(): boolean {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** site-theme 的 system 解析成实际明暗。 */
export function resolveSiteTheme(theme: SiteTheme): "light" | "dark" {
  if (theme === "system") return prefersDark() ? "dark" : "light";
  return theme;
}

/** 文章页在读的 reader 皮肤，非文章页返回 null。 */
function activeReaderTheme(): string | null {
  const root = document.getElementById("reader-root");
  return root?.getAttribute("data-reader-theme") ?? null;
}

/** 决定 <html data-fc-theme> 的最终值：reader 皮肤优先，其次 site-theme。 */
export function resolveFcTheme(): "light" | "dark" {
  const reader = activeReaderTheme();
  if (reader) return DARK_READER_THEMES.has(reader) ? "dark" : "light";
  return resolveSiteTheme(readSiteTheme());
}

/** 把最终明暗写到 <html>，并同步移动端浏览器工具栏色。 */
export function applyFcTheme(mode: "light" | "dark" = resolveFcTheme()) {
  document.documentElement.dataset.fcTheme = mode;
  syncThemeColorMeta(mode);
}

/** <meta name="theme-color"> 必须跟着切，否则暗色下 iOS Safari 工具栏还是亮的。
 *
 *  取值读 computed 的 --fc-surface-page，省得在两处维护同一个色号 —— 但不能直接
 *  塞进 content：变量的原始值是 oklch()，而 iOS Safari 对 theme-color 里的
 *  oklch 支持不可靠（会整条忽略，工具栏留在上一个颜色）。这里借一次 canvas
 *  把任意 CSS 颜色规范化成 rgb()，浏览器认得的才写进去。 */
export function syncThemeColorMeta(mode: "light" | "dark") {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (!meta) return;

  // 文章页优先读 reader 皮肤的底色：sepia 和 night 是手写皮肤，底色与
  // --fc-surface-page 不同（sepia 是暖纸、night 是低蓝光深底），读错的话
  // 工具栏会跟正文差一档。
  const root = document.getElementById("reader-root");
  const source = root
    ? getComputedStyle(root).getPropertyValue("--reader-bg").trim()
    : "";
  const page =
    source ||
    getComputedStyle(document.documentElement)
      .getPropertyValue("--fc-surface-page")
      .trim();

  meta.content =
    toRgbString(page) ?? (mode === "dark" ? "#22201c" : "#f5f4ed");
}

/** 把任意 CSS 颜色转成 rgb() 字符串；解析失败返回 null。
 *
 *  不能只读 fillStyle —— 按 CSS Color 4 的序列化规则，浏览器会把 oklch() 原样
 *  返回，等于没转。真正落到 sRGB 要靠画一个像素再读回来。 */
function toRgbString(color: string): string | null {
  if (!color) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    // 先用哨兵填底：若 color 无法解析，fillStyle 保持哨兵值，画出来就是哨兵色
    ctx.fillStyle = "#ff00ff";
    ctx.fillStyle = color;
    if (ctx.fillStyle === "#ff00ff" && !/magenta|#f0f|#ff00ff/i.test(color)) {
      return null;
    }

    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null;
  }
}

export function setSiteTheme(theme: SiteTheme) {
  try {
    localStorage.setItem(SITE_THEME_KEY, theme);
  } catch {}
  applyFcTheme();
  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } }),
  );
}

/** system → light → dark → system。三态而非两态，是为了让"跟随系统"可回到。 */
export function cycleSiteTheme(): SiteTheme {
  const order: SiteTheme[] = ["system", "light", "dark"];
  const next = order[(order.indexOf(readSiteTheme()) + 1) % order.length];
  setSiteTheme(next);
  return next;
}

/** 监听系统偏好变化 —— 仅在 site-theme 为 system 且不在文章页时才需要跟着动。 */
export function watchSystemTheme(): () => void {
  if (typeof matchMedia !== "function") return () => {};
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (readSiteTheme() === "system") applyFcTheme();
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
