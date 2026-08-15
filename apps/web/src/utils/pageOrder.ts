/**
 * pageOrder.ts
 *
 * Decides the final physical order of a book's pages — grouped by category,
 * then subcategory within it — and stamps each page's final answerKeyUrl to
 * match, since the URL is derived from final page position. These are one
 * fact (position decides the URL), so they're one function: callers never
 * need to know URL-fixup is a separate concern from ordering.
 *
 * To change how a book is organized, edit CATEGORY_ORDER / SUBCATEGORY_ORDER
 * below.
 */

import type { PageConfig } from './excelSyncTypes.js';

// Controls the order categories/subcategories are sorted into during sync —
// edit these lists to change how the book (and its TOC) is organized.
// Anything not listed here falls back to alphabetical, placed after every
// name that IS listed.
export const CATEGORY_ORDER: string[] = [
  'All-Time',
  'Awards',
  'Contracts',
  'Fantasy',
  'Other',
  'Playoffs',
  'Recent',
  'Single-Season',
];

export const SUBCATEGORY_ORDER: string[] = [
  'Bracket',
  'Matchups',
];

const CONTENT_TYPES = new Set(['list', 'matchup', 'teams', 'bracket']);

// Names in `order` sort by their position in that list (first = first);
// anything not listed falls back to alphabetical, placed after every name
// that IS listed. Blank/undefined always sorts last of all.
function makeOrderComparator(order: string[]) {
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
}

// Reorders parsed pages so the book's physical layout matches what the TOC
// promises: grouped by category, then subcategory within it, per
// CATEGORY_ORDER/SUBCATEGORY_ORDER above. `toc` pages are pinned to the
// front. `text`/`custom` pages aren't sorted independently — each stays
// glued to its nearest neighboring content page (following, if it appears
// before any content page in the sheet — front matter like a "How to Play"
// page — otherwise the preceding one) and travels with it. Front-matter
// text/custom pages are pinned directly after the toc pages rather than
// glued to whichever category the next content page happens to sort into.
//
// Returns pages in final order, each with a correct final answerKeyUrl.
export function reorderPages(pages: PageConfig[], bookId: string): PageConfig[] {
  const tocPages = pages.filter(p => p.type === 'toc');
  const rest = pages.filter(p => p.type !== 'toc');

  interface Group { anchor: PageConfig; trailers: PageConfig[]; originalIndex: number; }
  const groups: Group[] = [];
  let currentGroup: Group | null = null;
  const pendingLeaders: PageConfig[] = []; // front matter: text/custom before any content page seen yet

  rest.forEach((page, idx) => {
    if (CONTENT_TYPES.has(page.type)) {
      currentGroup = { anchor: page, trailers: [], originalIndex: idx };
      groups.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.trailers.push(page);
    } else {
      pendingLeaders.push(page);
    }
  });

  let ordered: PageConfig[];
  if (groups.length === 0) {
    ordered = [...tocPages, ...rest]; // no content pages — nothing to sort
  } else {
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

    const orderedRest = groups.flatMap(g => [g.anchor, ...g.trailers]);
    ordered = [...tocPages, ...pendingLeaders, ...orderedRest];
  }

  return ordered.map((page, i) => ({
    ...page,
    answerKeyUrl: `https://dykbtrivia.com/answers/${bookId}/${i + 1}`,
  })) as PageConfig[];
}
