/**
 * answerLinks.ts
 *
 * Every question page's QR code points at
 *   https://dykbtrivia.com/answers/{book}/{linkVersion}/{page}
 * and the redirect worker looks up the KV key `{book}:{linkVersion}:{page}`.
 *
 * Printed copies can never be updated, so once a version of the book is
 * published its page numbering is frozen. If a later printing changes page
 * numbers (a page removed or added mid-book), bump `linkVersion` for that book
 * in bookMetadata.ts: the new printing gets fresh links and the old version's
 * KV entries stay untouched. Just fixing where an answer link redirects needs
 * no new version — update that KV entry in the worker.
 *
 * Each published version's page → question mapping is frozen in
 * answer-links/{book}-v{n}.json (written by scripts/freeze-links.ts). The sync
 * refuses to run if the current numbering no longer matches the frozen file
 * for the current version, so page numbers can't shift under printed QR codes
 * by accident.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { getLinkVersion } from './bookMetadata.js';
import type { PageConfig } from './excelSyncTypes.js';

const ANSWERS_BASE = 'https://dykbtrivia.com/answers';

// Page types that print an answer-key QR code — the only pages whose numbers
// printed copies depend on.
export const QUESTION_TYPES = new Set(['list', 'matchup', 'teams', 'bracket']);

export function answerKeyUrl(bookId: string, pageNum: number): string {
  return `${ANSWERS_BASE}/${bookId}/${getLinkVersion(bookId)}/${pageNum}`;
}

export function answerKvKey(bookId: string, pageNum: number): string {
  return `${bookId}:${getLinkVersion(bookId)}:${pageNum}`;
}

// ─── Frozen versions ─────────────────────────────────────────────────────────

const FROZEN_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'answer-links');

export interface FrozenLinks {
  book: string;
  linkVersion: number;
  frozenAt: string;
  /** Page number → question title, for every page that prints a QR code. */
  pages: Record<string, string>;
}

export function frozenLinksPath(bookId: string, version = getLinkVersion(bookId)): string {
  return path.join(FROZEN_DIR, `${bookId}-v${version}.json`);
}

/** The page → question mapping for `pages` (already in final order). */
export function buildLinkMap(pages: PageConfig[]): Record<string, string> {
  const map: Record<string, string> = {};
  pages.forEach((page, i) => {
    if (QUESTION_TYPES.has(page.type)) map[String(i + 1)] = 'title' in page ? page.title ?? '' : '';
  });
  return map;
}

/**
 * Throws if the current version of this book was already frozen and its page
 * numbering has changed since. Returns quietly when the version isn't frozen
 * yet (nothing printed with it, so numbers are still free to move).
 */
export function assertLinksUnchanged(bookId: string, pages: PageConfig[]): void {
  const file = frozenLinksPath(bookId);
  if (!fs.existsSync(file)) return;

  const frozen: FrozenLinks = JSON.parse(fs.readFileSync(file, 'utf8'));
  const current = buildLinkMap(pages);
  const allPages = new Set([...Object.keys(frozen.pages), ...Object.keys(current)]);
  const changed = [...allPages]
    .filter(p => frozen.pages[p] !== current[p])
    .sort((a, b) => Number(a) - Number(b));
  if (changed.length === 0) return;

  const lines = changed.slice(0, 10).map(p =>
    `    page ${p}: ${JSON.stringify(frozen.pages[p] ?? '(none)')} → ${JSON.stringify(current[p] ?? '(none)')}`);
  if (changed.length > 10) lines.push(`    …and ${changed.length - 10} more`);

  throw new Error([
    `[${bookId}] Answer links v${frozen.linkVersion} are frozen (printed), but ${changed.length} question page(s) changed:`,
    ...lines,
    `  • If page numbers moved, bump linkVersion for "${bookId}" in src/utils/bookMetadata.ts.`,
    `  • If this is only a title fix on the same page, re-freeze: npx tsx scripts/freeze-links.ts --book ${bookId} --force`,
  ].join('\n'));
}
