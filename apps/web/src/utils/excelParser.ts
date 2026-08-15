/**
 * excelParser.ts
 *
 * Turns already-loaded raw Excel rows (Pages + Matchup Items sheets, read via
 * XLSX.utils.sheet_to_json) into PageConfig objects. No file I/O here —
 * callers hand it plain row arrays, which also makes it usable with plain JS
 * fixtures rather than real .xlsx files.
 *
 * Page order and answerKeyUrl are NOT decided here — see pageOrder.ts.
 * The answerKeyUrl assigned below is provisional (built from each row's
 * declared pageNum) and gets overwritten once final page order is known.
 */

import type { ActionContent, MatchupItem, PageConfig, PageDifficulty } from './excelSyncTypes.js';

// ── Helper: parse the "itemsNote" column into an items array ──────────────────
export function parseItemsNote(note: string): { clue: string | number }[] {
  const countMatch = note.match(/^(\d+)\s+items/i);
  if (!countMatch) {
    console.warn(`  ⚠️  Could not parse item count from: "${note}" — defaulting to 10 items with empty clues.`);
    return Array.from({ length: 10 }, () => ({ clue: '' }));
  }
  const count = parseInt(countMatch[1], 10);

  const yearMatch = note.match(/years\s+descending\s+from\s+(\d{4})/i);
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1], 10);
    return Array.from({ length: count }, (_, i) => ({ clue: startYear - i }));
  }

  if (/rank\s+numbers?/i.test(note)) {
    return Array.from({ length: count }, (_, i) => ({ clue: `#${i + 1}` }));
  }

  console.warn(`  ⚠️  Unrecognised clue style in: "${note}" — items will have empty clues.`);
  return Array.from({ length: count }, () => ({ clue: '' }));
}

interface CommonFields {
  category?: string;
  subcategory?: string;
  difficulty?: PageDifficulty;
  actionContent?: ActionContent;
}

// category/subcategory/difficulty/actionContent are handled identically by
// list, matchup, teams, and bracket rows — extracted once so each type's
// branch only has to spread the result rather than repeat this per type.
function extractCommonFields(row: any): CommonFields {
  const categoryRaw    = String(row.category ?? '').trim();
  const subcategoryRaw = String(row.subcategory ?? '').trim();
  const difficultyRaw  = String(row.difficulty ?? '').trim();
  const category    = categoryRaw || undefined;
  const subcategory = subcategoryRaw || undefined;
  const difficulty = (['Easy', 'Medium', 'Hard'].includes(difficultyRaw) ? difficultyRaw : undefined) as PageDifficulty | undefined;

  let actionContent: ActionContent | undefined;
  const noteText = String(row.actionNote ?? '').trim();
  if (noteText) {
    const rotation = Number(row.noteRotation);
    actionContent = {
      content:  noteText,
      position: String(row.notePosition ?? '').trim().toLowerCase() === 'left' ? 'left' : 'right',
      rotation: isNaN(rotation) ? 0 : rotation,
      icon:     String(row.noteIcon ?? '').trim() || '📌',
    };
  }

  return {
    ...(category    ? { category }    : {}),
    ...(subcategory ? { subcategory } : {}),
    ...(difficulty  ? { difficulty }  : {}),
    ...(actionContent ? { actionContent } : {}),
  };
}

function buildMatchupsByPage(matchupRaw: any[]): Map<number, MatchupItem[]> {
  const matchupsByPage = new Map<number, MatchupItem[]>();
  for (const row of matchupRaw) {
    if (row.pageNum === '' || row.pageNum === undefined || row.pageNum === null) continue;
    const pageNum = Number(row.pageNum);
    if (Number.isNaN(pageNum)) continue;
    if (!matchupsByPage.has(pageNum)) matchupsByPage.set(pageNum, []);
    matchupsByPage.get(pageNum)!.push({
      centerText: String(row.centerText ?? '').trim(),
      context:    String(row.context ?? '').trim(),
    });
  }
  return matchupsByPage;
}

export function parseBookPages(pagesRaw: any[], matchupRaw: any[], bookId: string): { pages: PageConfig[]; warnings: number } {
  const matchupsByPage = buildMatchupsByPage(matchupRaw);

  const pages: PageConfig[] = [];
  let warnings = 0;

  for (const row of pagesRaw) {
    // pageNum only needs to be present — its literal value doesn't drive the
    // final page number (page order decided by pageOrder.ts does), so 0 is
    // valid, only a truly blank cell should skip the row.
    if (row.pageNum === '' || row.pageNum === undefined || row.pageNum === null) continue;
    const pageNum = Number(row.pageNum);
    if (Number.isNaN(pageNum)) continue;

    const type       = String(row.type ?? '').trim().toLowerCase();
    const title      = String(row.title ?? '').trim();
    const desc       = String(row.description ?? '').trim();
    const columns    = Number(row.columns) || 1;
    // Provisional — pageOrder.reorderPages recomputes the real answerKeyUrl
    // from each page's final position.
    const url        = `https://dykbtrivia.com/answers/${bookId}/${pageNum}`;
    // The real destination (e.g. a pro-football-reference page) — kept
    // separate from `url` above, which is the redirect URL that goes into
    // pageConfig.ts. Only scripts/seed-kv.ts reads this field.
    const realAnswerUrl = String(row.answerKeyUrl ?? '').trim() || undefined;
    const commonFields = extractCommonFields(row);

    if (type === 'list') {
      const itemsNote = String(row.itemsNote ?? '').trim();
      pages.push({
        type:         'list',
        title,
        description:  desc,
        ...commonFields,
        items:        parseItemsNote(itemsNote),
        columns,
        answerKeyUrl: url,
        ...(realAnswerUrl ? { realAnswerUrl } : {}),
      });
    } else if (type === 'matchup') {
      const items = matchupsByPage.get(pageNum) ?? [];
      if (items.length === 0) {
        console.warn(`  ⚠️  [${bookId}] Page ${pageNum} is matchup but has no rows.`);
        warnings++;
      }
      pages.push({
        type:         'matchup',
        title,
        description:  desc,
        ...commonFields,
        items,
        columns,
        answerKeyUrl: url,
        ...(realAnswerUrl ? { realAnswerUrl } : {}),
      });
    } else if (type === 'text') {
      pages.push({
        type:         'text',
        ...(title ? { title } : {}),
        content:      desc,
        answerKeyUrl: url,
      });
    } else if (type === 'toc') {
      pages.push({
        type:         'toc',
        title:        title || 'Table of Contents',
        answerKeyUrl: url,
      });
    } else if (type === 'teams') {
      pages.push({
        type:         'teams',
        title,
        description:  desc,
        ...commonFields,
        answerKeyUrl: url,
        ...(realAnswerUrl ? { realAnswerUrl } : {}),
      });
    } else if (type === 'bracket') {
      const clueStyle = String(row.itemsNote ?? '').trim();
      if (!clueStyle) {
        console.warn(`  ⚠️  [${bookId}] Page ${pageNum} is bracket but column G is empty.`);
        warnings++;
      }
      pages.push({
        type:         'bracket',
        title,
        description:  desc,
        ...commonFields,
        clueStyle,
        answerKeyUrl: url,
        ...(realAnswerUrl ? { realAnswerUrl } : {}),
      });
    } else {
      console.warn(`  ⚠️  [${bookId}] Page ${pageNum} has unknown type "${type}".`);
      warnings++;
    }
  }

  return { pages, warnings };
}
