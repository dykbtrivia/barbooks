import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Interfaze } from "interfaze";
import { scrapeUrl, searchWeb } from "./scrape.mjs";

const publicDirectory = resolve(fileURLToPath(new URL("../public/", import.meta.url)));
const port = Number.parseInt(process.env.PORT ?? "4174", 10);
const contentTypes = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new RangeError("Request body is too large.");
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new SyntaxError("Request body must be valid JSON."); }
}

async function serveAsset(pathname, response) {
  const requestedPath = pathname === "/" ? "index.html" : pathname === "/search" || pathname === "/search/" ? "search.html" : pathname.slice(1);
  const filePath = resolve(publicDirectory, requestedPath);
  if (!filePath.startsWith(`${publicDirectory}/`)) return json(response, 404, { error: "Not found." });
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream" });
    response.end(body);
  } catch (error) {
    if (error?.code === "ENOENT") return json(response, 404, { error: "Not found." });
    throw error;
  }
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    if (request.method === "POST" && requestUrl.pathname === "/api/scrape") {
      if (!process.env.INTERFAZE_API_KEY) return json(response, 503, { error: "INTERFAZE_API_KEY is not configured on the server." });
      const body = await readJson(request);
      const result = await scrapeUrl(new Interfaze({ apiKey: process.env.INTERFAZE_API_KEY }), body.url);
      return json(response, 200, result);
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/search") {
      if (!process.env.INTERFAZE_API_KEY) return json(response, 503, { error: "INTERFAZE_API_KEY is not configured on the server." });
      const body = await readJson(request);
      const result = await searchWeb(new Interfaze({ apiKey: process.env.INTERFAZE_API_KEY }), body.query);
      return json(response, 200, result);
    }
    if (request.method !== "GET") return json(response, 405, { error: "Method not allowed." });
    await serveAsset(requestUrl.pathname, response);
  } catch (error) {
    const status = error instanceof TypeError || error instanceof SyntaxError ? 400 : error instanceof RangeError ? 413 : Number.isInteger(error?.status) ? error.status : 500;
    json(response, status, { error: status === 500 ? "The scrape failed unexpectedly." : error.message });
  }
});

server.listen(port, () => console.log(`BarBooks Scraper running at http://localhost:${port}`));
