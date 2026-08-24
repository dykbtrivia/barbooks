/**
 * samplePages.ts
 *
 * Hand-written fixtures — one representative page per PageType — used by the
 * /samples gallery to eyeball every renderer at once without hunting for a
 * real page of that type in the book (or authoring an Excel row just to see
 * a layout change).
 *
 * These deliberately do NOT come from pageConfig.ts: they're stable test
 * input, so a layout regression shows up here even if the book's content
 * changes. Keep each sample "worst case but realistic" — long titles, a full
 * item count, the clue styles that actually appear in the books — since the
 * point of the gallery is to catch overflow and spacing problems.
 *
 * Adding a new page type? Add a sample here and it shows up in the gallery
 * automatically (same as adding an entry to pageTypeRegistry.ts).
 */

import type { PageConfiguration, PageType } from './pageTypes.js';
import type { TocCategoryEntry } from './tocBuilder.js';

export interface SamplePage {
  /** URL slug + gallery anchor: /samples/{id}/ */
  id: string;
  /** Which renderer this exercises. */
  type: PageType;
  /** Shown under the tile in the gallery. */
  label: string;
  /** What this particular sample is meant to stress. */
  note: string;
  /** Page number the sample renders as — drives the header counter, the
   *  footer page number, and which margin side the page number sits on. */
  pageNum: number;
  config: PageConfiguration;
}

/** Stand-in TOC data for the `toc` sample (real books get this from buildToc). */
export const SAMPLE_TOC_ENTRIES: TocCategoryEntry[] = [
  { name: 'Awards', startingPage: 4 },
  { name: 'Draft', startingPage: 12 },
  { name: 'Playoffs', startingPage: 21 },
  { name: 'Records', startingPage: 33 },
  { name: 'Super Bowl', startingPage: 45 },
  { name: 'Teams', startingPage: 58 },
];

const yearsDescending = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ clue: from - i }));

const ranks = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ clue: `#${i + 1}` }));

export const samplePages: SamplePage[] = [
  {
    id: 'list-years',
    type: 'list',
    label: 'List — year clues',
    note: '25 items, single column, year clues descending — the most common page in the book.',
    pageNum: 7,
    config: {
      type: 'list',
      title: 'Name The Last 25 NFL MVPs',
      description: 'One name per season. No phones, no peeking.',
      category: 'Awards',
      difficulty: 'Medium',
      items: yearsDescending(2024, 25),
      columns: 1,
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/7',
    },
  },
  {
    id: 'list-ranked-2col',
    type: 'list',
    label: 'List — ranked, 2 columns',
    note: '30 ranked items in two columns — checks the grid split and the tightest row spacing.',
    pageNum: 8,
    config: {
      type: 'list',
      title: 'Top 30 All-Time Passing Yards Leaders',
      description: 'Rank order, regular season only.',
      category: 'Records',
      difficulty: 'Hard',
      items: ranks(30),
      columns: 2,
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/8',
    },
  },
  {
    id: 'list-plain',
    type: 'list',
    label: 'List — no clues',
    note: 'Items with empty clues, plus the instruction line — the "plain" label branch.',
    pageNum: 9,
    config: {
      type: 'list',
      title: 'Every Team To Win A Super Bowl',
      category: 'Super Bowl',
      difficulty: 'Easy',
      items: Array.from({ length: 20 }, () => ({})),
      columns: 2,
      showInstructions: true,
      instructionText: 'Order does not matter — just get all 20.',
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/9',
    },
  },
  {
    id: 'matchup',
    type: 'matchup',
    label: 'Matchup',
    note: 'Score-style center text with context labels above each row.',
    pageNum: 10,
    config: {
      type: 'matchup',
      title: 'Name Both Super Bowl Teams',
      description: 'Final score is your only clue.',
      category: 'Super Bowl',
      difficulty: 'Medium',
      items: [
        { context: 'Super Bowl LVIII', centerText: '25-22' },
        { context: 'Super Bowl LVII', centerText: '38-35' },
        { context: 'Super Bowl LVI', centerText: '23-20' },
        { context: 'Super Bowl LV', centerText: '31-9' },
        { context: 'Super Bowl LIV', centerText: '31-20' },
        { context: 'Super Bowl LIII', centerText: '13-3' },
        { context: 'Super Bowl LII', centerText: '41-33' },
        { context: 'Super Bowl LI', centerText: '34-28' },
      ],
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/10',
    },
  },
  {
    id: 'teams',
    type: 'teams',
    label: 'Teams',
    note: 'All 32 NFL teams by conference/division — the densest layout in the book.',
    pageNum: 11,
    config: {
      type: 'teams',
      title: "Name Each Team's All-Time Passing Leader",
      description: 'One name per team. Partial credit is a myth.',
      category: 'Teams',
      difficulty: 'Hard',
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/11',
    },
  },
  {
    id: 'bracket',
    type: 'bracket',
    label: 'Bracket — 14 team',
    note: 'Current (2020+) seven-seed-per-conference playoff format.',
    pageNum: 12,
    config: {
      type: 'bracket',
      title: 'Fill In The 2023 Playoff Bracket',
      description: 'Seeds are given — fill in the teams and the winners.',
      category: 'Playoffs',
      difficulty: 'Hard',
      clueStyle: '2020+: 1, 2, 3, 4, 5, 6, 7 / 1, 2, 3, 4, 5, 6, 7',
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/12',
    },
  },
  {
    id: 'bracket-12',
    type: 'bracket',
    label: 'Bracket — 12 team',
    note: 'Legacy (1990-2019) six-seed format — taller rows, fewer matchups.',
    pageNum: 13,
    config: {
      type: 'bracket',
      title: 'Fill In The 2015 Playoff Bracket',
      category: 'Playoffs',
      difficulty: 'Hard',
      clueStyle: '1990-2019: 1, 2, 3, 4, 5, 6 / 1, 2, 3, 4, 5, 6',
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/13',
    },
  },
  {
    id: 'toc',
    type: 'toc',
    label: 'Table of contents',
    note: 'Renders from SAMPLE_TOC_ENTRIES. Gets no PageHeader and no PageFooter.',
    pageNum: 3,
    config: {
      type: 'toc',
      title: 'Contents',
    },
  },
  {
    id: 'text',
    type: 'text',
    label: 'Text',
    note: 'Front-matter prose — paragraph rhythm and measure.',
    pageNum: 2,
    config: {
      type: 'text',
      title: 'How To Play',
      content: `<p>Pick a page. Any page. Each one asks you to name a list of things — MVPs, rushing leaders, Super Bowl matchups — and gives you the blanks to fill in.</p>
<p>Play it solo and see how deep your knowledge really goes, or hand the book to a friend, let them read the questions aloud, and race the clock. There are no single-answer gotchas here: every page is an argument waiting to happen.</p>
<p>When you're done, scan the QR code at the bottom of the page. The answer key lives online, so it's current — rosters move, records break, and the answers keep up.</p>`,
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/2',
    },
  },
  {
    id: 'custom',
    type: 'custom',
    label: 'Custom HTML',
    note: 'Arbitrary HTML via set:html. No header content — the markup owns the page.',
    pageNum: 14,
    config: {
      type: 'custom',
      content: `<h2 style="font-family: Anton, sans-serif; text-transform: uppercase; font-size: 40px; line-height: 1;">Halftime</h2>
<p>Custom pages get the raw HTML treatment — use them when a layout doesn't fit any other page type.</p>
<ul><li>Arbitrary markup</li><li>Inline styles allowed</li><li>Still gets the print footer</li></ul>`,
      answerKeyUrl: 'https://dykbtrivia.com/answers/nfl/14',
    },
  },
];

export function getSamplePage(id: string): SamplePage | undefined {
  return samplePages.find((s) => s.id === id);
}

/** Page types that have no sample yet — surfaced in the gallery as a gap. */
export function missingSampleTypes(allTypes: PageType[]): PageType[] {
  const covered = new Set(samplePages.map((s) => s.type));
  return allTypes.filter((t) => !covered.has(t));
}
