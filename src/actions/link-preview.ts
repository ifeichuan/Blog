const MICROLINK_API = "https://api.microlink.io";

interface MicrolinkResponse {
  status: string;
  data: {
    title?: string;
    description?: string;
    screenshot?: {
      url: string;
      width: number;
      height: number;
    };
  };
}

const cache = new Map<string, { result: LinkPreviewResult; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24;

export interface LinkPreviewResult {
  screenshotUrl: string;
  title?: string;
  description?: string;
}

export async function fetchLinkPreview(
  url: string,
): Promise<LinkPreviewResult | null> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.result;
  }

  const params = new URLSearchParams({
    url,
    screenshot: "true",
    "screenshot.width": "1280",
    "screenshot.height": "800",
    "screenshot.type": "jpeg",
  });

  const res = await fetch(`${MICROLINK_API}?${params}`);
  if (!res.ok) return null;

  const json = (await res.json()) as MicrolinkResponse;
  if (json.status !== "success" || !json.data.screenshot?.url) return null;

  const result: LinkPreviewResult = {
    screenshotUrl: json.data.screenshot.url,
    title: json.data.title,
    description: json.data.description,
  };

  cache.set(url, { result, ts: Date.now() });
  return result;
}
