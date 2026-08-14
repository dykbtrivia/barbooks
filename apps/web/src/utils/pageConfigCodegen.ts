/**
 * pageConfigCodegen.ts
 *
 * Turns final, ordered PageConfig[] per book into the generated
 * src/utils/pageConfig.ts TypeScript source. Pure text generation — no file
 * I/O, no parsing/ordering decisions.
 */

import type { ActionContent, MatchupItem, PageConfig, PageDifficulty } from './excelSyncTypes.js';

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

// category/subcategory/difficulty are serialized identically for every
// content page type — shared here so each branch only differs in its own
// type-specific line(s).
function serializeCategorization(page: { category?: string; subcategory?: string; difficulty?: PageDifficulty }): string[] {
  const lines: string[] = [];
  if (page.category)    lines.push(`  category: ${JSON.stringify(page.category)},`);
  if (page.subcategory) lines.push(`  subcategory: ${JSON.stringify(page.subcategory)},`);
  if (page.difficulty)  lines.push(`  difficulty: '${page.difficulty}',`);
  return lines;
}

function serializeActionContentLine(actionContent?: ActionContent): string[] {
  if (!actionContent) return [];
  const acStr = serializeActionContent(actionContent);
  return [`  actionContent: ${acStr.split('\n').join('\n  ')}`];
}

export function serializePage(page: PageConfig): string {
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
    lines.push(...serializeCategorization(page));
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)},`);
    lines.push(...serializeActionContentLine(page.actionContent));
  } else if (page.type === 'bracket') {
    lines.push(`  type: 'bracket',`);
    lines.push(`  title: ${JSON.stringify(page.title)},`);
    lines.push(`  description: ${JSON.stringify(page.description)},`);
    lines.push(...serializeCategorization(page));
    lines.push(`  clueStyle: ${JSON.stringify(page.clueStyle)},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)},`);
    lines.push(...serializeActionContentLine(page.actionContent));
  } else {
    lines.push(`  type: '${page.type}',`);
    lines.push(`  title: ${JSON.stringify(page.title)},`);
    lines.push(`  description: ${JSON.stringify(page.description)},`);
    lines.push(...serializeCategorization(page));

    if (page.type === 'list') {
      const itemsStr = serializeListItems(page.items);
      lines.push(`  items: ${itemsStr.split('\n').join('\n  ')},`);
    } else {
      const itemsStr = serializeMatchupItems(page.items);
      lines.push(`  items: ${itemsStr.split('\n').join('\n  ')},`);
    }

    lines.push(`  columns: ${page.columns},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)},`);
    lines.push(...serializeActionContentLine(page.actionContent));
  }

  lines.push('}');
  return lines.join('\n');
}

function generateBookBlock(bookId: string, pages: PageConfig[]): string {
  const pagesBlock = pages.map(p => indent(serializePage(p), 4)).join(',\n\n');

  return `
  '${bookId}': {
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
        content: \`This is page \${pageNum} of our \${'${bookId}'.toUpperCase()} book. The content for this page is dynamically generated.\`,
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
}

export function generatePageConfigSource(books: { id: string; pages: PageConfig[] }[]): string {
  const bookConfigs = books.map(({ id, pages }) => generateBookBlock(id, pages));

  return `import type { PageConfig, PageConfiguration } from './pageTypes.js';

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
}
