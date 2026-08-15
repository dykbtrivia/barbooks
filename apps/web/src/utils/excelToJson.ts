/**
 * excelToJson.ts
 *
 * Reads multiple .xlsx files and regenerates src/utils/pageConfig.ts.
 * Orchestration only — reading + parsing + ordering lives in
 * buildBookPages.ts (shared with scripts/seed-kv.ts so the two can't derive
 * different final page numbers for the same book), and TypeScript
 * code-generation lives in pageConfigCodegen.ts.
 *
 * Usage:
 *   npx tsx src/utils/excelToJson.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { buildOrderedPages } from './buildBookPages.js';
import { generatePageConfigSource } from './pageConfigCodegen.js';
import { BOOKS } from './excelSheetHeaders.js';
import type { PageConfig } from './excelSyncTypes.js';

const OUT_PATH = path.join('src', 'utils', 'pageConfig.ts');

const bookResults: { id: string; pages: PageConfig[] }[] = [];
let totalWarnings = 0;

for (const book of BOOKS) {
  const built = buildOrderedPages(book);
  if (!built) continue;

  totalWarnings += built.warnings;
  bookResults.push({ id: book.id, pages: built.pages });
  console.log(`✅  Generated ${built.pages.length} pages for [${book.id}]`);
}

const output = generatePageConfigSource(bookResults);

const outDir = path.dirname(OUT_PATH);
if (outDir && !fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(OUT_PATH, output, 'utf8');

if (totalWarnings > 0) {
  console.warn(`⚠️   ${totalWarnings} warning(s) above — review before committing.`);
}
