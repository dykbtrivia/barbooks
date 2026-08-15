/**
 * excelSyncTypes.ts
 *
 * Shared types for the Excel → pageConfig.ts sync pipeline (excelParser.ts,
 * pageOrder.ts, pageConfigCodegen.ts, excelToJson.ts). Mirrors the runtime
 * PageConfiguration union in pageTypes.ts, but kept separate since this side
 * only needs the fields the sync script itself produces/consumes.
 */

export interface ActionContent {
  content:  string;
  position: 'left' | 'right';
  rotation: number;
  icon:     string;
}

export type PageDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface ListPage {
  type:          'list';
  title:         string;
  description:   string;
  category?:     string;
  subcategory?:  string;
  difficulty?:   PageDifficulty;
  items:         { clue: string | number }[];
  columns:       number;
  answerKeyUrl:  string;
  /** The real destination URL from the Excel sheet, before it's overwritten
   *  with the redirect URL. Only scripts/seed-kv.ts reads this — it's not
   *  serialized into pageConfig.ts. */
  realAnswerUrl?: string;
  actionContent?: ActionContent;
}

export interface MatchupItem {
  centerText: string;
  context:    string;
}

export interface MatchupPage {
  type:          'matchup';
  title:         string;
  description:   string;
  category?:     string;
  subcategory?:  string;
  difficulty?:   PageDifficulty;
  items:         MatchupItem[];
  columns:       number;
  answerKeyUrl:  string;
  realAnswerUrl?: string;
  actionContent?: ActionContent;
}

export interface TextPage {
  type:          'text';
  title?:        string;
  content:       string;
  answerKeyUrl:  string;
}

export interface TocPage {
  type:          'toc';
  title:         string;
  answerKeyUrl:  string;
}

export interface TeamsPage {
  type:          'teams';
  title:         string;
  description:   string;
  category?:     string;
  subcategory?:  string;
  difficulty?:   PageDifficulty;
  answerKeyUrl:  string;
  realAnswerUrl?: string;
  actionContent?: ActionContent;
}

export interface BracketPage {
  type:          'bracket';
  title:         string;
  description:   string;
  category?:     string;
  subcategory?:  string;
  difficulty?:   PageDifficulty;
  /** Raw column G value passed straight through to the component */
  clueStyle:     string;
  answerKeyUrl:  string;
  realAnswerUrl?: string;
  actionContent?: ActionContent;
}

export type PageConfig = ListPage | MatchupPage | TextPage | TeamsPage | BracketPage | TocPage;
