/**
 * excelToJson.ts
 *
 * Reads multiple .xlsx files and regenerates src/utils/pageConfig.ts
 *
 * Usage:
 *   npx tsx src/utils/excelToJson.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

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

// Controls the order categories/subcategories are sorted into during sync —
// edit these lists to change how the book (and its TOC) is organized.
// Anything not listed here falls back to alphabetical, placed after every
// name that IS listed.
const CATEGORY_ORDER: string[] = [
  'All-Time',
  'Awards',
  'Contracts',
  'Fantasy',
  'Other',
  'Playoffs',
  'Recent',
  'Single-Season',
];

const SUBCATEGORY_ORDER: string[] = [
  'Bracket',
  'Matchups',
];

// ── Types mirroring the existing PageConfiguration union ─────────────────────
interface ActionContent {
  content:  string;
  position: 'left' | 'right';
  rotation: number;
  icon:     string;
}

type PageDifficulty = 'Easy' | 'Medium' | 'Hard';

interface ListPage {
  type:          'list';
  title:         string;
  description:   string;
  category?:     string;
  subcategory?:  string;
  difficulty?:   PageDifficulty;
  items:         { clue: string | number }[];
  columns:       number;
  answerKeyUrl:  string;
  actionContent?: ActionContent;
}

interface MatchupItem {
  centerText: string;
  context:    string;
}

interface MatchupPage {
  type:          'matchup';
  title:         string;
  description:   string;
  category?:     string;
  subcategory?:  string;
  difficulty?:   PageDifficulty;
  items:         MatchupItem[];
  columns:       number;
  answerKeyUrl:  string;
  actionContent?: ActionContent;
}

interface TextPage {
  type:          'text';
  content:       string;
  answerKeyUrl:  string;
}

interface TocPage {
  type:          'toc';
  title:         string;
  answerKeyUrl:  string;
}

interface TeamsPage {
  type:          'teams';
  title:         string;
  description:   string;
  category?:     string;
  subcategory?:  string;
  difficulty?:   PageDifficulty;
  answerKeyUrl:  string;
  actionContent?: ActionContent;
}

interface BracketPage {
  type:          'bracket';
  title:         string;
  description:   string;
  category?:     string;
  subcategory?:  string;
  difficulty?:   PageDifficulty;
  /** Raw column G value passed straight through to the component */
  clueStyle:     string;
  answerKeyUrl:  string;
  actionContent?: ActionContent;
}

type PageConfig = ListPage | MatchupPage | TextPage | TeamsPage | BracketPage | TocPage;

// ── Helper: parse the "itemsNote" column into an items array ──────────────────
function parseItemsNote(note: string): { clue: string | number }[] {
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

const CONTENT_TYPES = new Set(['list', 'matchup', 'teams', 'bracket']);

// Reorders parsed pages so the book's physical layout matches what the TOC
// promises: grouped by category, then subcategory within it, per
// CATEGORY_ORDER/SUBCATEGORY_ORDER above (alphabetical fallback for anything
// not listed there). `toc` pages are pinned to the front. `text`/`custom`
// pages aren't sorted independently — each stays glued to its nearest
// neighboring content page (preceding if one exists, otherwise the next one)
// and travels with it.
function reorderPages(pages: PageConfig[]): PageConfig[] {
  const tocPages = pages.filter(p => p.type === 'toc');
  const rest = pages.filter(p => p.type !== 'toc');

  interface Group { anchor: PageConfig; leaders: PageConfig[]; trailers: PageConfig[]; originalIndex: number; }
  const groups: Group[] = [];
  let currentGroup: Group | null = null;
  const pendingLeaders: PageConfig[] = [];

  rest.forEach((page, idx) => {
    if (CONTENT_TYPES.has(page.type)) {
      currentGroup = { anchor: page, leaders: [...pendingLeaders], trailers: [], originalIndex: idx };
      pendingLeaders.length = 0;
      groups.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.trailers.push(page);
    } else {
      pendingLeaders.push(page); // text/custom before any content page seen yet
    }
  });

  if (groups.length === 0) return [...tocPages, ...rest]; // no content pages — nothing to sort

  if (pendingLeaders.length > 0) {
    groups[0].leaders = [...pendingLeaders, ...groups[0].leaders];
  }

  // Names in `order` sort by their position in that list (first = first);
  // anything not listed falls back to alphabetical, placed after every name
  // that IS listed. Blank/undefined always sorts last of all.
  const makeOrderComparator = (order: string[]) => {
    const indexOf = new Map(order.map((name, i) => [name, i]));
    return (a?: string, b?: string): number => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      const ai = indexOf.get(a);
      const bi = indexOf.get(b);
      if (ai !== undefined && bi !== undefined) return ai - bi;
      if (ai !== undefined) return -1;
      if (bi !== undefined) return 1;
      return a.localeCompare(b);
    };
  };

  const compareCategory = makeOrderComparator(CATEGORY_ORDER);
  const compareSubcategory = makeOrderComparator(SUBCATEGORY_ORDER);

  groups.sort((a, b) => {
    const catCmp = compareCategory(
      'category' in a.anchor ? a.anchor.category : undefined,
      'category' in b.anchor ? b.anchor.category : undefined,
    );
    if (catCmp !== 0) return catCmp;

    const subCmp = compareSubcategory(
      'subcategory' in a.anchor ? a.anchor.subcategory : undefined,
      'subcategory' in b.anchor ? b.anchor.subcategory : undefined,
    );
    if (subCmp !== 0) return subCmp;

    return a.originalIndex - b.originalIndex; // stable fallback
  });

  const orderedRest = groups.flatMap(g => [...g.leaders, g.anchor, ...g.trailers]);
  return [...tocPages, ...orderedRest];
}

function processBook(bookId: string, excelPath: string, pagesHeader: string[]) {
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

  const pages: PageConfig[] = [];
  let warnings = 0;

  for (const row of pagesRaw) {
    // pageNum only needs to be present — its literal value doesn't drive the
    // final page number (page order in the sheet does), so 0 is valid, only
    // a truly blank cell should skip the row.
    if (row.pageNum === '' || row.pageNum === undefined || row.pageNum === null) continue;
    const pageNum = Number(row.pageNum);
    if (Number.isNaN(pageNum)) continue;

    const type       = String(row.type ?? '').trim().toLowerCase();
    const title      = String(row.title ?? '').trim();
    const desc       = String(row.description ?? '').trim();
    const columns    = Number(row.columns) || 1;
    // Provisional — pages get reordered by category/subcategory below, so the
    // real answerKeyUrl (based on final page position) is recomputed after that.
    const url        = `https://dykbtrivia.com/${bookId}/${pageNum}`;
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

    if (type === 'list') {
      const itemsNote = String(row.itemsNote ?? '').trim();
      pages.push({
        type:         'list',
        title,
        description:  desc,
        ...(category   ? { category }   : {}),
        ...(subcategory ? { subcategory } : {}),
        ...(difficulty ? { difficulty } : {}),
        items:        parseItemsNote(itemsNote),
        columns,
        answerKeyUrl: url,
        ...(actionContent ? { actionContent } : {}),
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
        ...(category   ? { category }   : {}),
        ...(subcategory ? { subcategory } : {}),
        ...(difficulty ? { difficulty } : {}),
        items,
        columns,
        answerKeyUrl: url,
        ...(actionContent ? { actionContent } : {}),
      });
    } else if (type === 'text') {
      pages.push({
        type:         'text',
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
        ...(category   ? { category }   : {}),
        ...(subcategory ? { subcategory } : {}),
        ...(difficulty ? { difficulty } : {}),
        answerKeyUrl: url,
        ...(actionContent ? { actionContent } : {}),
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
        ...(category   ? { category }   : {}),
        ...(subcategory ? { subcategory } : {}),
        ...(difficulty ? { difficulty } : {}),
        clueStyle,
        answerKeyUrl: url,
        ...(actionContent ? { actionContent } : {}),
      });
    } else {
      console.warn(`  ⚠️  [${bookId}] Page ${pageNum} has unknown type "${type}".`);
      warnings++;
    }
  }

  const ordered = reorderPages(pages);
  const finalPages = ordered.map((page, i) => ({
    ...page,
    answerKeyUrl: `https://dykbtrivia.com/${bookId}/${i + 1}`,
  })) as PageConfig[];

  return { pages: finalPages, warnings };
}

// ── Code-generation helpers ───────────────────────────────────────────────────
function indent(str: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(l => pad + l).join('\n');
}

function serializeActionContent(ac: ActionContent): string {
  return [
    `{`,
    `  content: ${JSON.stringify(ac.content)},`,
    `  position: '${ac.position}',`,
    `  rotation: ${ac.rotation},`,
    `  icon: '${ac.icon}'`,
    `}`
  ].join('\n');
}

function serializeListItems(items: { clue: string | number }[]): string {
  const clues = items.map(i => i.clue);
  const count = clues.length;
  if (count === 0) return '[]';

  const firstClue = clues[0];

  if (typeof firstClue === 'number') {
    const isDescendingYears = clues.every(
      (c, i) => typeof c === 'number' && c === (firstClue as number) - i
    );
    if (isDescendingYears) {
      return `Array.from({length: ${count}}, (_, i) => ({\n  clue: ${firstClue} - i,\n}))`;
    }
  }

  if (typeof firstClue === 'string' && firstClue === '#1') {
    const isRanks = clues.every((c, i) => c === `#${i + 1}`);
    if (isRanks) {
      return `Array.from({length: ${count}}, (_, i) => ({\n  clue: \`#\${i + 1}\`,\n}))`;
    }
  }

  const lines = items.map(it => `  { clue: ${JSON.stringify(it.clue)} },`);
  return `[\n${lines.join('\n')}\n]`;
}

function serializeMatchupItems(items: MatchupItem[]): string {
  const lines = items.map(it =>
    `  { centerText: ${JSON.stringify(it.centerText)}, context: ${JSON.stringify(it.context)} },`
  );
  return `[\n${lines.join('\n')}\n]`;
}

function serializePage(page: PageConfig): string {
  const lines: string[] = ['{'];

  if (page.type === 'text') {
    lines.push(`  type: 'text',`);
    lines.push(`  content: ${JSON.stringify(page.content)},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)}`);
  } else if (page.type === 'toc') {
    lines.push(`  type: 'toc',`);
    lines.push(`  title: ${JSON.stringify(page.title)},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)}`);
  } else if (page.type === 'teams') {
    lines.push(`  type: 'teams',`);
    lines.push(`  title: ${JSON.stringify(page.title)},`);
    lines.push(`  description: ${JSON.stringify(page.description)},`);
    if (page.category)    lines.push(`  category: ${JSON.stringify(page.category)},`);
    if (page.subcategory) lines.push(`  subcategory: ${JSON.stringify(page.subcategory)},`);
    if (page.difficulty) lines.push(`  difficulty: '${page.difficulty}',`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)},`);
    if (page.actionContent) {
      const acStr = serializeActionContent(page.actionContent);
      lines.push(`  actionContent: ${acStr.split('\n').join('\n  ')}`);
    }
  } else if (page.type === 'bracket') {
    lines.push(`  type: 'bracket',`);
    lines.push(`  title: ${JSON.stringify(page.title)},`);
    lines.push(`  description: ${JSON.stringify(page.description)},`);
    if (page.category)    lines.push(`  category: ${JSON.stringify(page.category)},`);
    if (page.subcategory) lines.push(`  subcategory: ${JSON.stringify(page.subcategory)},`);
    if (page.difficulty) lines.push(`  difficulty: '${page.difficulty}',`);
    lines.push(`  clueStyle: ${JSON.stringify(page.clueStyle)},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)},`);
    if (page.actionContent) {
      const acStr = serializeActionContent(page.actionContent);
      lines.push(`  actionContent: ${acStr.split('\n').join('\n  ')}`);
    }
  } else {
    lines.push(`  type: '${page.type}',`);
    lines.push(`  title: ${JSON.stringify(page.title)},`);
    lines.push(`  description: ${JSON.stringify(page.description)},`);
    if ('category'    in page && page.category)    lines.push(`  category: ${JSON.stringify(page.category)},`);
    if ('subcategory' in page && page.subcategory) lines.push(`  subcategory: ${JSON.stringify(page.subcategory)},`);
    if ('difficulty'  in page && page.difficulty)  lines.push(`  difficulty: '${page.difficulty}',`);

    if (page.type === 'list') {
      const itemsStr = serializeListItems(page.items);
      lines.push(`  items: ${itemsStr.split('\n').join('\n  ')},`);
    } else {
      const itemsStr = serializeMatchupItems(page.items);
      lines.push(`  items: ${itemsStr.split('\n').join('\n  ')},`);
    }

    lines.push(`  columns: ${page.columns},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)},`);

    if ('actionContent' in page && page.actionContent) {
      const acStr = serializeActionContent(page.actionContent);
      lines.push(`  actionContent: ${acStr.split('\n').join('\n  ')}`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

const bookConfigs: string[] = [];
let totalWarnings = 0;

for (const book of BOOKS) {
  const result = processBook(book.id, book.file, book.pagesHeader);
  if (!result) continue;

  totalWarnings += result.warnings;
  const pagesBlock = result.pages.map(p => indent(serializePage(p), 4)).join(',\n\n');
  
  const bookStr = `
  '${book.id}': {
    pages: [
${pagesBlock}
    ],
    getPageConfiguration(pageNum: number) {
      const pageIndex = pageNum - 1;
      if (pageIndex >= 0 && pageIndex < this.pages.length) {
        return this.pages[pageIndex];
      }
      return {
        type: 'text',
        content: \`This is page \${pageNum} of our \${'${book.id}'.toUpperCase()} book. The content for this page is dynamically generated.\`,
        answerKeyUrl: \`https://example.com/page-\${pageNum}-answers\`
      };
    },
    getAnswerKeyUrl(pageNum: number): string {
      const pageConfiguration = this.getPageConfiguration(pageNum);
      return pageConfiguration.answerKeyUrl || \`https://example.com/page-\${pageNum}-answers\`;
    },
    pageExists(pageNum: number): boolean {
      return pageNum >= 1 && pageNum <= this.pages.length;
    }
  }`;
  bookConfigs.push(bookStr);
  console.log(`✅  Generated ${result.pages.length} pages for [${book.id}]`);
}

const output = `import type { PageConfig, PageConfiguration } from './pageTypes.js';

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-GENERATED by excelToJson.ts
// Generated: ${new Date().toISOString()}
//
// DO NOT EDIT BY HAND
// ─────────────────────────────────────────────────────────────────────────────

export const booksConfig: Record<string, PageConfig> = {
${bookConfigs.join(',\n')}
};

// Aliasing for backward compatibility if ever needed directly (points to nfl by default)
export const pageConfig = booksConfig['nfl'];
`;

const outDir = path.dirname(OUT_PATH);
if (outDir && !fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(OUT_PATH, output, 'utf8');

if (totalWarnings > 0) {
  console.warn(`⚠️   ${totalWarnings} warning(s) above — review before committing.`);
}
