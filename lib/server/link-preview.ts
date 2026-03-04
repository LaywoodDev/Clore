import type { LinkPreview } from "@/lib/server/store";

const URL_REGEX = /https?:\/\/[^\s<>"']+/i;

function extractMeta(html: string, property: string): string {
  // og: property
  const ogMatch = html.match(
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")
  ) ?? html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i")
  );
  return ogMatch?.[1]?.trim() ?? "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? "";
}

export async function fetchLinkPreview(text: string): Promise<LinkPreview | null> {
  const urlMatch = text.match(URL_REGEX);
  if (!urlMatch) return null;
  const url = urlMatch[0];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CloreBot/1.0; +https://clore.app)",
          Accept: "text/html",
        },
        redirect: "follow",
      });
    } finally {
      clearTimeout(timer);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await response.text();

    const title = extractMeta(html, "og:title") || extractTitle(html);
    if (!title) return null;

    const description = extractMeta(html, "og:description");
    const imageUrl = extractMeta(html, "og:image");
    const ogSiteName = extractMeta(html, "og:site_name");
    const siteName = ogSiteName || new URL(url).hostname;

    return { url, title, description, imageUrl, siteName };
  } catch {
    return null;
  }
}
