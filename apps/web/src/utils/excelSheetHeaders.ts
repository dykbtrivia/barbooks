/**
 * excelSheetHeaders.ts
 *
 * Column layout for each book's "Pages" sheet, shared by every script that
 * reads the raw Excel rows (excelToJson.ts, scripts/seed-kv.ts). Keeping
 * this in one place means the two can't silently drift apart the way they
 * did before — seed-kv.ts had its own stale copy that didn't get updated
 * when the `subcategory` column was added, which shifted every column
 * after it by one and corrupted the URLs the redirect worker would have
 * stored in KV.
 */

// NFL has category/subcategory/difficulty columns that NBA doesn't have yet.
export const NFL_PAGES_HEADER = [
  'pageNum', 'type', 'title', 'description', 'category', 'subcategory', 'difficulty',
  'itemsNote', 'columns', 'answerKeyUrl', 'actionNote', 'notePosition',
  'noteRotation', 'noteIcon',
];

export const NBA_PAGES_HEADER = [
  'pageNum', 'type', 'title', 'description',
  'itemsNote', 'columns', 'answerKeyUrl', 'actionNote', 'notePosition',
  'noteRotation', 'noteIcon',
];

export const BOOKS = [
  { id: 'nfl', file: 'NFL Barbook Trivia.xlsx', pagesHeader: NFL_PAGES_HEADER },
  { id: 'nba', file: 'NBA Barbook Trivia.xlsx', pagesHeader: NBA_PAGES_HEADER },
];
