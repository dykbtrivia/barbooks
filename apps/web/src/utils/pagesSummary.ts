import type { PageConfiguration } from './pageTypes.js';

export interface PageSummary {
  pageNum: number;
  label: string;
  type: string;
  category: string;
  difficulty: string;
}

export function buildPagesSummary(pages: PageConfiguration[]): PageSummary[] {
  return pages.map((page, i) => ({
    pageNum: i + 1,
    label: ('title' in page && page.title) ? page.title : `(${page.type})`,
    type: page.type,
    category: ('category' in page && page.category) ? page.category : '',
    difficulty: ('difficulty' in page && page.difficulty) ? page.difficulty : '',
  }));
}
