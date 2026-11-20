/**
 * freeze-links.ts
 *
 * Run when a book is published (uploaded to KDP for printing). Writes
 * answer-links/{book}-v{linkVersion}.json — the page → question mapping
 * every printed QR code of this version depends on. From then on
 * `npm run sync-pages` and `npm run seed-kv` refuse to run if that version's
 * page numbering changes (see answerLinks.ts).
 *
 * Usage:
 *   npx tsx scripts/freeze-links.ts --book nfl           # freeze the current version
 *   npx tsx scripts/freeze-links.ts --book nfl --force   # accept a title-only fix on a frozen version
 */

import * as fs from 'fs';
import * as path from 'path';

import { BOOKS } from '../src/utils/excelSheetHeaders.js';
import { buildOrderedPages } from '../src/utils/buildBookPages.js';
import { buildLinkMap, frozenLinksPath, type FrozenLinks } from '../src/utils/answerLinks.js';
import { getLinkVersion } from '../src/utils/bookMetadata.js';

const args = process.argv.slice(2);
const bookId = args.includes('--book') ? args[args.indexOf('--book') + 1] : null;
const force = args.includes('--force');

const book = BOOKS.find(b => b.id === bookId);
if (!book) {
  console.error(`Usage: npx tsx scripts/freeze-links.ts --book <${BOOKS.map(b => b.id).join('|')}> [--force]`);
  process.exit(1);
}

const file = frozenLinksPath(book.id);
const version = getLinkVersion(book.id);
if (fs.existsSync(file) && !force) {
  console.error(`❌  ${path.basename(file)} already exists — v${version} of "${book.id}" is frozen.`);
  console.error(`    Pass --force only to accept a title fix that left every page number unchanged.`);
  process.exit(1);
}

// With --force the existing freeze would make buildOrderedPages() throw, so
// move it aside while rebuilding the mapping.
const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
if (existing) fs.unlinkSync(file);

let built;
try {
  built = buildOrderedPages(book);
} finally {
  if (existing && !built) fs.writeFileSync(file, existing);
}
if (!built) process.exit(1);

const frozen: FrozenLinks = {
  book: book.id,
  linkVersion: version,
  frozenAt: new Date().toISOString(),
  pages: buildLinkMap(built.pages),
};

fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(frozen, null, 2) + '\n');

console.log(`✅  Froze ${Object.keys(frozen.pages).length} question pages for ${book.id} v${version} → ${path.relative(process.cwd(), file)}`);
console.log(`\nNext: commit it, then tag the published version so its links can be recreated later:`);
console.log(`    git tag ${book.id}-v${version} && git push origin ${book.id}-v${version}`);
