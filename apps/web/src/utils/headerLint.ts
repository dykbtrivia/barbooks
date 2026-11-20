/**
 * headerLint.ts
 *
 * Sync-time checks on what each question page prints in its PageHeader, so
 * problems are caught in Excel rather than spotted in a printed proof:
 *
 * - Title too long: past TITLE_MAX_CHARS a title no longer fits two lines at
 *   the header's normal size. PageHeaderScorecard shrinks it as a fallback,
 *   but a shorter title reads better.
 * - Description echoes title: the description should add something the title
 *   doesn't say (a qualifier such as "Since 1966." or "Full PPR."), not
 *   restate it. Leave it blank when there is nothing to add.
 */

import type { PageConfig } from './excelSyncTypes.js';

/** Longest title that fits two lines at the header's full font size. */
export const TITLE_MAX_CHARS = 55;

// Words that carry no meaning of their own when comparing title vs description.
const STOP_WORDS = new Set(
  ('the a an of in on by for to with and or from at is are this that each all ' +
   'nfl nba name list who which what top players player most').split(' '),
);

// Extra description words that only rephrase (not qualify) the title.
const FILLER_WORDS = new Set(
  'total history time leader recent recently completed during over across among'.split(' '),
);

function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(w => w && !STOP_WORDS.has(w))
    .map(w => w.replace(/s$/, ''));
}

/** True when the description mostly restates the title without adding to it. */
export function descriptionEchoesTitle(title: string, description: string): boolean {
  const titleWords = new Set(contentWords(title));
  const descWords = contentWords(description);
  if (titleWords.size === 0 || descWords.length === 0) return false;

  const covered = [...titleWords].filter(w => descWords.includes(w)).length / titleWords.size;
  const added = descWords.filter(w => !titleWords.has(w) && !FILLER_WORDS.has(w));
  return covered >= 0.8 && added.length <= 2;
}

/** Logs a warning per problem; returns the number of warnings. */
export function lintPageHeaders(pages: PageConfig[], bookId: string): number {
  let warnings = 0;

  pages.forEach((page, i) => {
    const pageNum = i + 1;
    const title = 'title' in page ? (page.title ?? '') : '';
    const description = 'description' in page ? (page.description ?? '') : '';
    if (!title || page.type === 'text') return;

    if (title.length > TITLE_MAX_CHARS) {
      console.warn(`  ⚠️  [${bookId}] Page ${pageNum} title is ${title.length} chars (max ${TITLE_MAX_CHARS}): "${title}"`);
      warnings++;
    }
    if (description && descriptionEchoesTitle(title, description)) {
      console.warn(`  ⚠️  [${bookId}] Page ${pageNum} description repeats the title: "${description}"`);
      warnings++;
    }
  });

  return warnings;
}
