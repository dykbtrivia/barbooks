/**
 * Renders the social-share card (og:image) referenced by the home page's
 * Open Graph / Twitter tags to `public/og-image.png` at 1200x630.
 *
 * Run with: npm run og-image
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'og-image.png');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; background: #1a1a1a; color: #f5e9d0;
    font-family: 'Anton', sans-serif; position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: center;
    padding: 0 80px;
  }
  .grain {
    position: absolute; inset: 0; opacity: 0.05;
    background-image: repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 12px);
  }
  .qmark {
    position: absolute; right: 20px; top: -80px; font-size: 520px;
    line-height: 1; opacity: 0.12; color: #f5e9d0;
  }
  .kicker {
    font-family: 'IBM Plex Mono', monospace; font-weight: 500; font-size: 22px;
    letter-spacing: 0.5em; text-transform: uppercase; color: #c8102e; margin-bottom: 28px;
  }
  h1 { font-size: 116px; line-height: 0.88; letter-spacing: 0.01em; }
  .rule { width: 110px; height: 6px; background: #c8102e; margin: 32px 0; }
  p { font-family: 'IBM Plex Mono', monospace; font-size: 27px; color: #ebd9b4; max-width: 780px; }
</style></head>
<body>
  <div class="grain"></div>
  <div class="qmark">?</div>
  <div class="kicker">(DYKB) Trivia &middot; Pro Football Edition</div>
  <h1>DO YOU KNOW BALL?</h1>
  <div class="rule"></div>
  <p>The pro football trivia book you play with friends.</p>
</body></html>`;

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT, type: 'png' });
await browser.close();
console.log(`Wrote ${OUT}`);
