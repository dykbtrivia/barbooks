/**
 * generate-pdf.ts
 *
 * Generates a single print-ready PDF for each book by:
 *   1. Building the Astro site (unless --skip-build is passed)
 *   2. Starting a local preview server
 *   3. Using Puppeteer to print each configured page to PDF
 *   4. Stitching all page PDFs into one book PDF with pdf-lib
 *
 * Pages are printed by a small fixed pool of long-lived tabs pulling page
 * numbers from a shared queue, so a book prints several pages at a time.
 *
 * Usage:
 *   npx tsx scripts/generate-pdf.ts [--book nfl] [--skip-build] [--out output.pdf] [--concurrency 6]
 */

import puppeteer, { type Browser } from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import { spawn, type ChildProcess } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { booksConfig } from '../src/utils/pageConfig.js';

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const bookFilter = args.includes('--book') ? args[args.indexOf('--book') + 1] : null;
const outFlagIdx = args.indexOf('--out');
const outFlag = outFlagIdx !== -1 ? args[outFlagIdx + 1] : null;
const concurrencyIdx = args.indexOf('--concurrency');
const CONCURRENCY = concurrencyIdx !== -1 ? Number(args[concurrencyIdx + 1]) : 6;

const PREVIEW_PORT = 4322;
const BASE_URL = `http://localhost:${PREVIEW_PORT}`;
const TMP_DIR = join(process.cwd(), '.pdf-tmp');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[generate-pdf] ${msg}`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return; // server is up
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: false });
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
  });
}

// detached: the server gets its own process group, so stopPreviewServer()
// can kill npx AND the `astro preview` it spawns. Killing just the npx
// process left astro running, holding this script's stdout pipe open so it
// never exited after printing "Done."
function startPreviewServer(): ChildProcess {
  const child = spawn('npx', ['astro', 'preview', '--port', String(PREVIEW_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    detached: true,
  });
  // Pipe output without blocking
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
  return child;
}

function stopPreviewServer(child: ChildProcess) {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, 'SIGTERM'); // negative pid = the whole process group
  } catch {
    child.kill(); // group already gone, or platform without process groups
  }
}

// Prints pages 1..pageCount of one book using a fixed pool of tabs. Each
// worker pulls the next page number from a shared counter, and results land
// in an array indexed by page number, so merge order never depends on which
// tab finishes first. A fixed pool rather than a tab per page: opening and
// closing a tab per page costs extra CDP round-trips and has proven flaky
// over a ~200-page run; page.goto() fully replaces the document anyway.
async function printBook(browser: Browser, bookId: string, pageCount: number): Promise<Buffer[]> {
  const pagePdfs: Buffer[] = new Array(pageCount);
  let next = 1;

  const worker = async () => {
    const page = await browser.newPage();
    try {
      while (next <= pageCount) {
        const pageNum = next++;
        const url = `${BASE_URL}/${bookId}/${pageNum}/`;

        // Pages are static HTML: the print-footer QR is an SVG inlined at
        // build time (the runtime-generated on-screen QR is hidden in print),
        // so 'load' plus web fonts being ready is everything print depends on.
        // Reading offsetHeight forces layout first, so every font the page
        // uses has started loading before fonts.ready is awaited.
        await page.goto(url, { waitUntil: 'load' });
        await page.evaluate(async () => {
          void document.body.offsetHeight;
          await document.fonts.ready;
        });

        const pdfBytes = await page.pdf({
          width: '6in',
          height: '9in',
          printBackground: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });

        pagePdfs[pageNum - 1] = Buffer.from(pdfBytes);
        log(`  Page ${pageNum}/${pageCount}: ${url}`);
      }
    } finally {
      await page.close();
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pageCount) }, worker));
  return pagePdfs;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // 0. Validate args before doing any slow work
  const bookIds = bookFilter ? [bookFilter] : Object.keys(booksConfig);
  if (outFlag && bookIds.length > 1) {
    // Every book would be written to the same path, each overwriting the last.
    throw new Error('--out can only be used together with --book <id> (one book at a time).');
  }
  if (!Number.isInteger(CONCURRENCY) || CONCURRENCY < 1) {
    throw new Error(`--concurrency must be a positive integer, got "${args[concurrencyIdx + 1]}".`);
  }

  // 1. Build
  if (!skipBuild) {
    log('Building Astro site…');
    await runCommand('npx', ['astro', 'build']);
  } else {
    log('Skipping build (--skip-build)');
  }

  // 2. Start preview server
  log(`Starting preview server on port ${PREVIEW_PORT}…`);
  const server = startPreviewServer();
  await waitForServer(`${BASE_URL}/nfl/1/`);
  log('Preview server ready.');

  // 3. Set up tmp dir
  mkdirSync(TMP_DIR, { recursive: true });

  // 4. Launch browser (puppeteer ships its own Chrome, installed by `npm install`)
  //
  // protocolTimeout is raised from puppeteer's 180s default: printing a whole
  // book is hundreds of CDP round-trips and the default has been hit in
  // practice partway through a run.
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    protocolTimeout: 300_000,
  });

  try {
    for (const bookId of bookIds) {
      const bookConfig = booksConfig[bookId];
      if (!bookConfig) {
        log(`Unknown book "${bookId}", skipping.`);
        continue;
      }

      const configuredPageCount = bookConfig.pages.length;
      log(`\nGenerating PDF for book: ${bookId} (${configuredPageCount} pages, ${CONCURRENCY} tabs)`);

      const startedAt = Date.now();
      const pagePdfs = await printBook(browser, bookId, configuredPageCount);
      log(`Printed ${pagePdfs.length} pages in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

      // 5. Merge page PDFs into one book PDF
      log(`\nMerging ${pagePdfs.length} pages for "${bookId}"…`);
      const mergedDoc = await PDFDocument.create();

      for (const pdfBuf of pagePdfs) {
        const srcDoc = await PDFDocument.load(pdfBuf);
        const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach(p => mergedDoc.addPage(p));
      }

      const mergedBytes = await mergedDoc.save();
      const outPath = outFlag ?? join(process.cwd(), `${bookId}-book.pdf`);
      writeFileSync(outPath, mergedBytes);
      log(`Saved: ${outPath}`);
    }
    log('Done.');
  } finally {
    // Runs on failure too, so it must not report success.
    await browser.close();
    stopPreviewServer(server);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
