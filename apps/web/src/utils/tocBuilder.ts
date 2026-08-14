import type { PageConfiguration } from './pageTypes.js';

export interface TocCategoryEntry {
  name: string;
  startingPage: number;
}

const UNCATEGORISED = 'Uncategorised';

export function buildToc(pages: PageConfiguration[]): TocCategoryEntry[] {
  const startingPageByCategory = new Map<string, number>();

  pages.forEach((page, index) => {
    if (page.type === 'text' || page.type === 'custom' || page.type === 'toc') return;

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
