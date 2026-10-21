/**
 * bookMetadata.ts
 *
 * Per-book publishing metadata — the single source of truth for everything
 * printed on the title, copyright, and about pages. KDP requires the title,
 * subtitle, author, and (if printed) ISBN in the manuscript to match the
 * book's KDP title setup EXACTLY, so edit these here to match KDP, not the
 * other way around.
 *
 * Hand-edited (unlike pageConfig.ts) and read at render time, so dropping in
 * the KDP-assigned ISBN only needs a rebuild + `npm run generate-pdf` — no
 * `npm run sync-pages`.
 */

export interface BookMetadata {
  title: string;
  subtitle?: string;
  author: string;
  /** Imprint name, or omit to print "Independently published". */
  imprint?: string;
  /** Who holds the copyright, as printed after "©". */
  copyrightHolder: string;
  copyrightYear: number;
  /** KDP's free ISBN is assigned during title setup — fill in once known.
   *  Left blank, the copyright page omits the ISBN line entirely. */
  isbn?: string;
  /** Short edition label used on the title page (e.g. "Pro Football Edition"). */
  edition?: string;
}

const SHARED = {
  title: 'Do You Know Ball?',
  author: 'DYKB Trivia',
  copyrightHolder: 'DYKB Trivia',
  copyrightYear: 2026,
} as const;

export const BOOK_METADATA: Record<string, BookMetadata> = {
  nfl: { ...SHARED, subtitle: 'Pro Football Trivia', edition: 'Pro Football Edition · Vol. I' },
  nba: { ...SHARED, subtitle: 'Pro Basketball Trivia', edition: 'Pro Basketball Edition · Vol. I' },
};

export function getBookMetadata(bookId: string): BookMetadata {
  const meta = BOOK_METADATA[bookId];
  if (!meta) throw new Error(`No book metadata for "${bookId}" — add it to bookMetadata.ts`);
  return meta;
}
