/**
 * bookMetadata.ts
 *
 * Publishing metadata printed on the title, copyright, and about pages. Those
 * pages are the same in every book — only the book's name varies — so
 * everything shared lives in SERIES, and BOOKS carries just the per-book bits.
 *
 * KDP requires the title, subtitle, author, and (if printed) ISBN in the
 * manuscript to match the book's KDP title setup EXACTLY, so edit these here
 * to match KDP, not the other way around.
 *
 * Hand-edited (unlike pageConfig.ts) and read at render time, so dropping in
 * the KDP-assigned ISBN only needs a rebuild + `npm run generate-pdf` — no
 * `npm run sync-pages`. The exception is `linkVersion`, which is baked into
 * every QR code by the sync — re-run `npm run sync-pages` after changing it.
 */

export interface BookMetadata {
  title: string;
  subtitle: string;
  /** Short edition label used on the title page (e.g. "Pro Football Edition · Vol. I"). */
  edition: string;
  author: string;
  /** Imprint name, or omit to print "Independently published". */
  imprint?: string;
  /** Who holds the copyright, as printed after "©". */
  copyrightHolder: string;
  copyrightYear: number;
  /** KDP's free ISBN is assigned per book during title setup — fill in once
   *  known. Left blank, the copyright page omits the ISBN line entirely. */
  isbn?: string;
  /** Answer-link version in every QR code (/answers/{book}/{linkVersion}/{page}).
   *  Bump ONLY when a new printing changes page numbers — see answerLinks.ts. */
  linkVersion: number;
}

type PerBookKey = 'subtitle' | 'edition' | 'isbn' | 'linkVersion';
type SeriesMetadata = Omit<BookMetadata, PerBookKey>;
type PerBookMetadata = Pick<BookMetadata, PerBookKey>;

// Same for every book in the series.
const SERIES: SeriesMetadata = {
  title: 'Do You Know Ball?',
  author: 'DYKB Trivia',
  copyrightHolder: 'DYKB Trivia',
  copyrightYear: 2026,
};

// Only what differs between books: the name, each book's own ISBN, and its
// answer-link version.
const BOOKS: Record<string, PerBookMetadata> = {
  nfl: { subtitle: 'Pro Football Trivia', edition: 'Pro Football Edition · Vol. I', linkVersion: 1 },
  nba: { subtitle: 'Pro Basketball Trivia', edition: 'Pro Basketball Edition · Vol. I', linkVersion: 1 },
};

export function getBookMetadata(bookId: string): BookMetadata {
  const book = BOOKS[bookId];
  if (!book) throw new Error(`No book metadata for "${bookId}" — add it to BOOKS in bookMetadata.ts`);
  return { ...SERIES, ...book };
}

export function getLinkVersion(bookId: string): number {
  return getBookMetadata(bookId).linkVersion;
}
