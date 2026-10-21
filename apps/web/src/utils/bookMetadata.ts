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
 * `npm run sync-pages`.
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
}

type SeriesMetadata = Omit<BookMetadata, 'subtitle' | 'edition' | 'isbn'>;
type PerBookMetadata = Pick<BookMetadata, 'subtitle' | 'edition' | 'isbn'>;

// Same for every book in the series.
const SERIES: SeriesMetadata = {
  title: 'Do You Know Ball?',
  author: 'DYKB Trivia',
  copyrightHolder: 'DYKB Trivia',
  copyrightYear: 2026,
};

// Only what differs between books: the name, and each book's own ISBN.
const BOOKS: Record<string, PerBookMetadata> = {
  nfl: { subtitle: 'Pro Football Trivia', edition: 'Pro Football Edition · Vol. I' },
  nba: { subtitle: 'Pro Basketball Trivia', edition: 'Pro Basketball Edition · Vol. I' },
};

export function getBookMetadata(bookId: string): BookMetadata {
  const book = BOOKS[bookId];
  if (!book) throw new Error(`No book metadata for "${bookId}" — add it to BOOKS in bookMetadata.ts`);
  return { ...SERIES, ...book };
}
