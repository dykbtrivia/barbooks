/**
 * generate-pdf.ts
 *
 * Generates a single print-ready PDF for each book by:
 *   1. Building the Astro site (unless --skip-build is passed)
 *   2. Starting a local preview server
 *   3. Using Puppeteer to print each configured page to PDF
 *   4. Stitching all page PDFs into one book PDF with pdf-lib
 *
 * Usage:
 *   npx tsx scripts/generate-pdf.ts [--book nfl] [--skip-build] [--out output.pdf] [--concurrency 6]
 */

import puppeteer from 'puppeteer';
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
const concurrency = concurrencyIdx !== -1 ? Number(args[concurrencyIdx + 1]) : 6;
if (!Number.isInteger(concurrency) || concurrency < 1) {
  console.error('--concurrency must be a positive integer');
  process.exit(1);
}

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

function startPreviewServer(): ChildProcess {
  const child = spawn('npx', ['astro', 'preview', '--port', String(PREVIEW_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  // Pipe output without blocking
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
  return child;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
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

  // 4. Determine which books to process
  const bookIds = bookFilter ? [bookFilter] : Object.keys(booksConfig);
  if (outFlag && bookIds.length > 1) {
    throw new Error('--out can only be used with a single book; pass --book <id>.');
  }

  // 5. Launch browser (puppeteer ships its own Chrome, installed by `npm install`)
  //
  // protocolTimeout is raised from puppeteer's 180s default: printing a whole
  // book is hundreds of sequential CDP round-trips and the default has been
  // hit in practice partway through a run.
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    protocolTimeout: 300_000,
  });

  // A fixed pool of tabs is reused for every page of every book. Opening and
  // closing a tab per page costs two extra CDP round-trips each and has proven
  // flaky over a 193-page run; page.goto() fully replaces the document anyway.
  const pages = await Promise.all(Array.from({ length: concurrency }, () => browser.newPage()));

  try {
    for (const bookId of bookIds) {
      const bookConfig = booksConfig[bookId];
      if (!bookConfig) {
        log(`Unknown book "${bookId}", skipping.`);
        continue;
      }

      const configuredPageCount = bookConfig.pages.length;
      log(`\nGenerating PDF for book: ${bookId} (${configuredPageCount} pages)`);

      // Indexed by pageNum - 1 so the merge order is correct no matter which
      // worker finishes first.
      const pagePdfs: Buffer[] = new Array(configuredPageCount);
      let nextPage = 1;

      await Promise.all(
        pages.map(async page => {
          while (nextPage <= configuredPageCount) {
            const pageNum = nextPage++;
            const url = `${BASE_URL}/${bookId}/${pageNum}/`;
            log(`  Page ${pageNum}: ${url}`);

            await page.goto(url, { waitUntil: 'load' });
            // The print-footer QR is an inline SVG baked in at build time, so
            // fonts are the only async thing print output can still be waiting on.
            await page.evaluate(() => document.fonts.ready);

            const pdfBytes = await page.pdf({
              width: '6in',
              height: '9in',
              printBackground: true,
              margin: { top: '0', right: '0', bottom: '0', left: '0' },
            });

            pagePdfs[pageNum - 1] = Buffer.from(pdfBytes);
          }
        }),
      );

      // 6. Merge page PDFs into one book PDF
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
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
