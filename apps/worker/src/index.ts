import { getRedirect } from './redirects.js';
import { logScan } from './analytics.js';
import { handleAdmin } from './admin.js';
import { renderDashboard } from './dashboard.js';

export interface Env {
  REDIRECTS: KVNamespace;
  page_scans: AnalyticsEngineDataset;
  ADMIN_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    // Dashboard
    if (path === '/dashboard') {
      return renderDashboard();
    }

    // Admin endpoints
    if (path.startsWith('/admin/')) {
      return handleAdmin(request, env.REDIRECTS, env.ADMIN_TOKEN);
    }

    // Redirect by book / answer-link version / page (e.g. /answers/nfl/1/57
    // → KV key nfl:1:57). The version only changes when a new printing
    // renumbers pages, so every printed copy's QR codes keep resolving (see
    // apps/web/src/utils/answerLinks.ts). The older unversioned forms
    // (/answers/nfl/57, /answers/57) predate versioning and resolve as
    // version 1. Scoped under /answers/ so this worker only owns that path
    // prefix — everything else on the domain (marketing site, book reader)
    // is served by the actual site, not this worker.
    const versionedMatch = path.match(/^\/answers\/([a-z]+)\/(\d+)\/(\d+)$/);
    const bookMatch = !versionedMatch && path.match(/^\/answers\/([a-z]+)\/(\d+)$/);
    const bareMatch = !versionedMatch && !bookMatch && path.match(/^\/answers\/(\d+)$/);
    const id = versionedMatch ? `${versionedMatch[1]}:${versionedMatch[2]}:${versionedMatch[3]}`
             : bookMatch ? `${bookMatch[1]}:1:${bookMatch[2]}`
             : bareMatch ? `nfl:1:${bareMatch[1]}`
             : null;
    if (id) {

      let entry;
      try {
        entry = await getRedirect(env.REDIRECTS, id);
      } catch (err) {
        console.error('KV lookup failed:', err);
        return new Response('Service temporarily unavailable', { status: 503 });
      }

      if (!entry || !entry.url) {
        return notFoundResponse(id);
      }

      // Log non-blocking — fire and forget
      logScan(env.page_scans, id, entry, request);

      return Response.redirect(entry.url, 301);
    }

    return new Response('Not found', { status: 404 });
  },
};

function notFoundResponse(id: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Not Found</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 4rem auto; text-align: center; color: #111; }
    h1 { font-size: 1.5rem; }
    p { color: #6b7280; }
  </style>
</head>
<body>
  <h1>Question #${id} not found</h1>
  <p>This question may have moved or this code is from an older edition.</p>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
