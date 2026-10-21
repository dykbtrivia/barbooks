import type { PageConfiguration, PageType } from './pageTypes.js';

export interface TocCategoryEntry {
  name: string;
  startingPage: number;
}

const UNCATEGORISED = 'Uncategorised';

// Pages that never get a TOC entry — front/back matter and prose pages.
const NON_CONTENT_TYPES = new Set<PageType>(['text', 'custom', 'toc', 'title', 'copyright', 'about']);

export function buildToc(pages: PageConfiguration[]): TocCategoryEntry[] {
  const startingPageByCategory = new Map<string, number>();

  pages.forEach((page, index) => {
    if (NON_CONTENT_TYPES.has(page.type)) return;

    const pageNum = index + 1;
    const category = ('category' in page && page.category) ? page.category : UNCATEGORISED;

    const existing = startingPageByCategory.get(category);
    if (existing === undefined || pageNum < existing) {
      startingPageByCategory.set(category, pageNum);
    }
  });

  return Array.from(startingPageByCategory.entries())
    .map(([name, startingPage]) => ({ name, startingPage }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
