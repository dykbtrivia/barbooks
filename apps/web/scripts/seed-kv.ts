/**
 * seed-kv.ts
 *
 * Generates a JSON file for bulk-uploading redirect entries to Cloudflare
 * KV, from the same final page order excelToJson.ts uses for pageConfig.ts
 * (via buildOrderedPages() in buildBookPages.ts) — so KV keys always match
 * the printed page numbers readers actually scan, not the Excel sheet's raw
 * `pageNum` column.
 *
 * Usage:
 *   npx tsx scripts/seed-kv.ts
 *   npx wrangler kv bulk put --namespace-id <id> kv-seed.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { BOOKS } from '../src/utils/excelSheetHeaders.js';
import { buildOrderedPages } from '../src/utils/buildBookPages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KVEntry {
  key: string;
  value: string;
}

const entries: KVEntry[] = [];

for (const book of BOOKS) {
  const built = buildOrderedPages(book);
  if (!built) continue;

  let count = 0;
  built.pages.forEach((page, i) => {
    const finalPageNum = i + 1;
    const realUrl = (page as { realAnswerUrl?: string }).realAnswerUrl;
    if (!realUrl) return; // toc/text pages, or rows with no Excel answerKeyUrl

    const title = 'title' in page ? page.title ?? '' : '';
    const category = ('category' in page && page.category) ? page.category : 'General';

    entries.push({
      key: `${book.id}:${finalPageNum}`,
      value: JSON.stringify({ url: realUrl, label: title, category }),
    });
    count++;
  });

  console.log(`✅  ${book.id}: ${count} redirect entries`);
}

const outPath = path.resolve(__dirname, '..', '..', 'worker', 'kv-seed.json');
fs.writeFileSync(outPath, JSON.stringify(entries, null, 2));
console.log(`\nWrote ${entries.length} entries to kv-seed.json`);
console.log(`\nNext: npx wrangler kv bulk put --namespace-id 8d9e8560388f4140a6819922931f5a48 kv-seed.json`);
