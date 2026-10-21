/**
 * buildBookPages.ts
 *
 * The single source of truth for "what is book X's final, ordered page
 * list" — reads the raw Excel rows, parses them, injects the synthesized
 * front/back matter (title, copyright, "How to Play", about), and reorders. Both excelToJson.ts (which
 * generates pageConfig.ts) and scripts/seed-kv.ts (which seeds the Worker's
 * KV redirect table) call this, so the two can never derive different final
 * page numbers for the same book — that mismatch previously caused every
 * seeded KV redirect to point at the wrong page.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

import { parseBookPages } from './excelParser.js';
import { reorderPages } from './pageOrder.js';
import { HOW_TO_PLAY_HTML } from './howToPlayContent.js';
import type { PageConfig } from './excelSyncTypes.js';

export interface BookSource {
  id: string;
  file: string;
  pagesHeader: string[];
}

export interface BuiltBook {
  pages: PageConfig[];
  warnings: number;
}

// book.file is a bare filename (e.g. "NFL Barbook Trivia.xlsx") that lives
// directly in apps/web/ — resolved relative to this module's own location
// rather than process.cwd(), so it works the same regardless of where the
// calling script (excelToJson.ts, scripts/seed-kv.ts) is invoked from.
const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function buildOrderedPages(book: BookSource): BuiltBook | null {
  const excelPath = path.resolve(WEB_ROOT, book.file);
  if (!fs.existsSync(excelPath)) {
    console.warn(`⚠️  Could not find Excel file at: ${excelPath}. Skipping.`);
    return null;
  }

  const workbook = XLSX.readFile(excelPath);

  const pagesSheet = workbook.Sheets['Pages'];
  if (!pagesSheet) {
    console.error(`❌  Could not find "Pages" in ${book.file}.`);
    return null;
  }

  const pagesRaw: any[] = XLSX.utils.sheet_to_json(pagesSheet, {
    header: book.pagesHeader,
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
    console.warn(`⚠️  Could not find "Matchup Items" in ${book.file}.`);
  }

  const { pages, warnings } = parseBookPages(pagesRaw, matchupRaw, book.id);

  // Every book gets the same synthesized front/back matter rather than
  // authoring it per-book in Excel: title + copyright pages (content from
  // bookMetadata.ts at render time), a "How to Play" page, and an about page
  // at the back. reorderPages() pins each into place — title on page 1,
  // copyright on 2, toc on 3, How to Play on 4, about last — and stamps the
  // final answerKeyUrl, so the placeholder URLs here are overwritten.
  const placeholderUrl = `https://dykbtrivia.com/answers/${book.id}/0`;
  const bookMatter: PageConfig[] = [
    { type: 'title', answerKeyUrl: placeholderUrl },
    { type: 'copyright', answerKeyUrl: placeholderUrl },
    { type: 'text', title: 'How to Play', content: HOW_TO_PLAY_HTML, answerKeyUrl: placeholderUrl },
    { type: 'about', answerKeyUrl: placeholderUrl },
  ];

  const ordered = reorderPages([...bookMatter, ...pages], book.id);

  return { pages: ordered, warnings };
}
