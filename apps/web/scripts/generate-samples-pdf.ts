/**
 * generate-samples-pdf.ts
 *
 * Prints every page-type sample to its own 6x9 PDF with the same print
 * settings the real book uses (see generate-pdf.ts), so the /samples gallery
 * can show what actually prints rather than a live screen render.
 *
 * Uses puppeteer rather than playwright — it ships its own Chrome download, so
 * this works without the separate `npx playwright install chromium` step that
 * generate-pdf.ts needs.
 *
 * Output, both gitignored generated artifacts under public/samples-pdf/:
 *   {id}.pdf — the real print output; what the gallery's "Open PDF" links to.
 *   {id}.png — a raster of that PDF, which is what the gallery tiles show.
 *
 * Why the raster: Chrome's PDF viewer won't paint reliably inside the
 * CSS-transformed (scaled-down) tiles, so embedding the PDF directly gives a
 * grid of blank grey boxes. The PNG is a faithful rendering of the same PDF,
 * so the tiles still show print output rather than a screen render.
 *
 * Usage:
 *   npm run samples-pdf            # build, preview, print all samples
 *   npm run samples-pdf -- --dev   # print against an already-running `npm run dev`
 *   npm run samples-pdf -- --only matchup,teams
 */

import puppeteer from 'puppeteer';
import { spawn, type ChildProcess } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { samplePages } from '../src/utils/samplePages.js';

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
// --dev prints against the dev server you already have open, which skips both
// the build and the preview server — the fast path while iterating on a layout.
const useDevServer = args.includes('--dev');
const onlyFlagIdx = args.indexOf('--only');
const onlyIds = onlyFlagIdx !== -1 ? args[onlyFlagIdx + 1].split(',').map(s => s.trim()) : null;

const DEV_PORT = 4321;
const PREVIEW_PORT = 4322;
const PORT = useDevServer ? DEV_PORT : PREVIEW_PORT;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = join(process.cwd(), 'public', 'samples-pdf');

function log(msg: string) {
  console.log(`[samples-pdf] ${msg}`);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function runCommand(cmd: string, cmdArgs: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: false });
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
  });
}

/** Tile width in the gallery's unscaled layout — see FRAME_W in samples/index.astro. */
const RASTER_WIDTH = 720;

/**
 * PDF → PNG via macOS `sips`, which is preinstalled and handles PDF input.
 * Returns false (with a warning) anywhere sips isn't available; the gallery
 * then falls back to the live page for that tile rather than failing the run.
 */
async function rasterize(pdfPath: string, pngPath: string): Promise<boolean> {
  try {
    await runCommandQuiet('sips', [
      '-s', 'format', 'png',
      '--resampleWidth', String(RASTER_WIDTH),
      pdfPath,
      '--out', pngPath,
    ]);
    return true;
  } catch {
    return false;
  }
}

function runCommandQuiet(cmd: string, cmdArgs: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: 'ignore', shell: false });
    child.on('error', reject);
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
  });
}

async function main() {
  const samples = onlyIds
    ? samplePages.filter(s => onlyIds.includes(s.id))
    : samplePages;

  if (samples.length === 0) {
    throw new Error(`No samples matched --only ${onlyIds?.join(',')}`);
  }

  let server: ChildProcess | null = null;

  if (useDevServer) {
    log(`Using dev server at ${BASE_URL} (--dev)`);
    await waitForServer(`${BASE_URL}/samples/`).catch(() => {
      throw new Error(`No dev server on port ${DEV_PORT}. Run \`npm run dev\` first, or drop --dev.`);
    });
  } else {
    if (!skipBuild) {
      log('Building Astro site…');
      await runCommand('npx', ['astro', 'build']);
    }
    log(`Starting preview server on port ${PREVIEW_PORT}…`);
    server = spawn('npx', ['astro', 'preview', '--port', String(PREVIEW_PORT)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });
    server.stdout?.pipe(process.stdout);
    server.stderr?.pipe(process.stderr);
    await waitForServer(`${BASE_URL}/samples/`);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const rasterFailures: string[] = [];

  try {
    for (const sample of samples) {
      const url = `${BASE_URL}/samples/${sample.id}/`;
      log(`  ${sample.id}: ${url}`);

      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle0' });
        // Same settle time as generate-pdf.ts — lets webfonts and the
        // build-time QR SVG paint before the snapshot.
        await sleep(500);

        // Identical print settings to the book pipeline: 6x9 KDP trim, no
        // margins (the page's own print CSS owns them).
        const pdfBytes = await page.pdf({
          width: '6in',
          height: '9in',
          printBackground: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });

        const pdfPath = join(OUT_DIR, `${sample.id}.pdf`);
        writeFileSync(pdfPath, Buffer.from(pdfBytes));

        const ok = await rasterize(pdfPath, join(OUT_DIR, `${sample.id}.png`));
        if (!ok) rasterFailures.push(sample.id);
      } finally {
        await page.close();
      }
    }

    // Drop PDFs for samples that no longer exist, so the gallery never shows
    // a stale tile for a deleted fixture.
    if (!onlyIds) {
      const live = new Set(samplePages.flatMap(s => [`${s.id}.pdf`, `${s.id}.png`]));
      const { readdirSync } = await import('fs');
      for (const file of readdirSync(OUT_DIR)) {
        if (!live.has(file)) {
          rmSync(join(OUT_DIR, file));
          log(`  removed stale ${file}`);
        }
      }
    }

    log(`Wrote ${samples.length} PDF(s) to public/samples-pdf/`);
    if (rasterFailures.length > 0) {
      log(`Could not rasterize (needs macOS \`sips\`): ${rasterFailures.join(', ')}`);
      log('Those tiles will fall back to the live page; the PDFs themselves are fine.');
    }
  } finally {
    await browser.close();
    server?.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
