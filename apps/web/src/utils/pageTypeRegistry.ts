/**
 * pageTypeRegistry.ts
 *
 * Single source of truth for "what does this page type need to render":
 * which component, what props it needs (from the page config and from
 * render-time context like bookId), what goes in the PageHeader, and
 * whether this type gets a PageHeader/PageFooter at all.
 *
 * Adding a new page type means adding one entry here — [page].astro and
 * Layout.astro don't need to change.
 */

import List from '../components/page-types/List.astro';
import Matchup from '../components/page-types/Matchup.astro';
import Teams from '../components/page-types/Teams.astro';
import PlayoffBracket from '../components/PlayoffBracket.astro';
import TableOfContents from '../components/page-types/TableOfContents.astro';
import TextContent from '../components/page-types/TextContent.astro';

import type {
  BracketPageConfig, CustomPageConfig, ListPageConfig, MatchupPageConfig, PageConfiguration,
  PageDifficulty, PageType, TeamsPageConfig, TextPageConfig, TocPageConfig,
} from './pageTypes.js';
import type { TocCategoryEntry } from './tocBuilder.js';

export interface RegistryContext {
  bookId: string;
  tocEntries: TocCategoryEntry[];
}

export interface HeaderProps {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: PageDifficulty;
  itemCount?: number;
}

export interface PageTypeRegistryEntry {
  // AstroComponentFactory — kept loose since Astro doesn't export a
  // convenient public type for "a .astro component reference."
  component: any;
  // `page` is narrowed to the specific PageConfig variant for this type by
  // construction (the registry is only ever looked up by pageConfiguration.type),
  // so each entry casts internally rather than fighting a union parameter type.
  getComponentProps: (page: PageConfiguration, ctx: RegistryContext) => Record<string, unknown>;
  getHeaderProps: (page: PageConfiguration) => HeaderProps;
  showsHeader: boolean;
  showsFooter: boolean;
}

const noHeaderProps = (): HeaderProps => ({});

export const pageTypeRegistry: Record<PageType, PageTypeRegistryEntry> = {
  list: {
    component: List,
    getComponentProps: (page) => {
      const p = page as ListPageConfig;
      return { items: p.items, columns: p.columns, showInstructions: p.showInstructions, instructionText: p.instructionText };
    },
    getHeaderProps: (page) => {
      const p = page as ListPageConfig;
      return { title: p.title, description: p.description, category: p.category, difficulty: p.difficulty, itemCount: p.items.length };
    },
    showsHeader: true,
    showsFooter: true,
  },
  matchup: {
    component: Matchup,
    getComponentProps: (page) => {
      const p = page as MatchupPageConfig;
      return { items: p.items, columns: p.columns, showInstructions: p.showInstructions, instructionText: p.instructionText };
    },
    getHeaderProps: (page) => {
      const p = page as MatchupPageConfig;
      return { title: p.title, description: p.description, category: p.category, difficulty: p.difficulty, itemCount: p.items.length };
    },
    showsHeader: true,
    showsFooter: true,
  },
  teams: {
    component: Teams,
    getComponentProps: (_page, ctx) => ({ bookId: ctx.bookId }),
    getHeaderProps: (page) => {
      const p = page as TeamsPageConfig;
      return { title: p.title, description: p.description, category: p.category, difficulty: p.difficulty };
    },
    showsHeader: true,
    showsFooter: true,
  },
  bracket: {
    component: PlayoffBracket,
    getComponentProps: (page) => ({ clueStyle: (page as BracketPageConfig).clueStyle }),
    getHeaderProps: (page) => {
      const p = page as BracketPageConfig;
      return { title: p.title, description: p.description, category: p.category, difficulty: p.difficulty };
    },
    showsHeader: true,
    showsFooter: true,
  },
  toc: {
    component: TableOfContents,
    getComponentProps: (page, ctx) => ({ entries: ctx.tocEntries, bookId: ctx.bookId, title: (page as TocPageConfig).title }),
    getHeaderProps: noHeaderProps,
    showsHeader: false,
    showsFooter: false,
  },
  text: {
    component: TextContent,
    getComponentProps: (page) => ({ content: (page as TextPageConfig).content }),
    getHeaderProps: (page) => ({ title: (page as TextPageConfig).title }),
    showsHeader: true,
    showsFooter: true,
  },
  custom: {
    component: TextContent,
    getComponentProps: (page) => ({ content: (page as CustomPageConfig).content }),
    getHeaderProps: noHeaderProps,
    showsHeader: true,
    showsFooter: true,
  },
};
