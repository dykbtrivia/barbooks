/**
 * excelToJson.ts
 *
 * Reads multiple .xlsx files and regenerates src/utils/pageConfig.ts.
 * Orchestration only — parsing lives in excelParser.ts, page ordering (and
 * the sort-order config: CATEGORY_ORDER/SUBCATEGORY_ORDER) lives in
 * pageOrder.ts, and TypeScript code-generation lives in pageConfigCodegen.ts.
 *
 * Usage:
 *   npx tsx src/utils/excelToJson.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

import { parseBookPages } from './excelParser.js';
import { reorderPages } from './pageOrder.js';
import { generatePageConfigSource } from './pageConfigCodegen.js';
import type { PageConfig } from './excelSyncTypes.js';

const OUT_PATH = path.join('src', 'utils', 'pageConfig.ts');

// Each book's Pages sheet can have its own column layout — NFL has
// category/subcategory/difficulty columns that NBA doesn't have yet.
const NFL_PAGES_HEADER = [
  'pageNum', 'type', 'title', 'description', 'category', 'subcategory', 'difficulty',
  'itemsNote', 'columns', 'answerKeyUrl', 'actionNote', 'notePosition',
  'noteRotation', 'noteIcon',
];

const NBA_PAGES_HEADER = [
  'pageNum', 'type', 'title', 'description',
  'itemsNote', 'columns', 'answerKeyUrl', 'actionNote', 'notePosition',
  'noteRotation', 'noteIcon',
];

const BOOKS = [
  { id: 'nfl', file: 'NFL Barbook Trivia.xlsx', pagesHeader: NFL_PAGES_HEADER },
  { id: 'nba', file: 'NBA Barbook Trivia.xlsx', pagesHeader: NBA_PAGES_HEADER }
];

function readBookRows(excelPath: string, pagesHeader: string[]): { pagesRaw: any[]; matchupRaw: any[] } | null {
  if (!fs.existsSync(excelPath)) {
    console.warn(`⚠️  Could not find Excel file at: ${excelPath}. Skipping.`);
    return null;
  }

  const workbook = XLSX.readFile(excelPath);

  const pagesSheet = workbook.Sheets['Pages'];
  if (!pagesSheet) {
    console.error(`❌  Could not find "Pages" in ${excelPath}.`);
    return null;
  }

  const pagesRaw: any[] = XLSX.utils.sheet_to_json(pagesSheet, {
    header: pagesHeader,
    range: 4,
    defval: '',
  });

  const matchupSheet = workbook.Sheets['Matchup Items'];
  let matchupRaw: any[] = [];
  if (matchupSheet) {
    matchupRaw = XLSX.utils.sheet_to_json(matchupSheet, {
      header: ['pageNum', 'context', 'centerText', 'notes'],
      range: 4,
      defval: '',
    });
  } else {
    console.warn(`⚠️  Could not find "Matchup Items" in ${excelPath}.`);
  }

  return { pagesRaw, matchupRaw };
}

const bookResults: { id: string; pages: PageConfig[] }[] = [];
let totalWarnings = 0;

for (const book of BOOKS) {
  const rows = readBookRows(book.file, book.pagesHeader);
  if (!rows) continue;

  const { pages, warnings } = parseBookPages(rows.pagesRaw, rows.matchupRaw, book.id);
  totalWarnings += warnings;

  const ordered = reorderPages(pages, book.id);
  bookResults.push({ id: book.id, pages: ordered });
  console.log(`✅  Generated ${ordered.length} pages for [${book.id}]`);
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
