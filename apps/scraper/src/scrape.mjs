const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

export function parseTargetUrl(value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError("Enter a URL to scrape.");
  let url;
  try { url = new URL(value.trim()); } catch { throw new TypeError("Enter a complete URL, including https://."); }
  if (!HTTP_PROTOCOLS.has(url.protocol)) throw new TypeError("Only http:// and https:// URLs are supported.");
  return url.href;
}

export async function scrapeUrl(client, value) {
  const url = parseTargetUrl(value);
  return { url, result: await client.tasks.scrape(url) };
}

export function parseSearchQuery(value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError("Enter a search query.");
  if (value.trim().length > 500) throw new TypeError("Keep the search query under 500 characters.");
  return value.trim();
}

export async function searchWeb(client, value) {
  const query = parseSearchQuery(value);
  return { query, result: await client.tasks.webSearch(query) };
}
