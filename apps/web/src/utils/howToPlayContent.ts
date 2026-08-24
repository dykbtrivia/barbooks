/**
 * howToPlayContent.ts
 *
 * The "How to Play" front-matter page is the same for every book, so it's
 * synthesized in code (see excelToJson.ts) rather than authored as a row in
 * each book's Excel file. reorderPages() (pageOrder.ts) pins it directly
 * after the toc page(s), so it always lands as page 2 (or page 1, for a
 * book that doesn't have a toc page yet).
 */

export const HOW_TO_PLAY_HTML = [
  '<p class="mb-4">Do You Know Ball? is a collaborative trivia book built for groups &mdash; road trips, tailgates, bars, living rooms. There\'s no app and no host required. Just open to a page and start playing.</p>',
  '<h3 class="text-lg font-bold text-ink mb-2 print:text-base">The Basics</h3>',
  '<ol class="list-decimal list-inside space-y-1.5 mb-4">',
  '<li>Open to any page. Every page is its own self-contained trivia challenge.</li>',
  '<li>Read the prompt out loud to the group (e.g. &ldquo;Name the last 20 MVPs&rdquo;).</li>',
  '<li>Work together (or split into teams) filling in as many blanks as you can from memory.</li>',
  '<li>Set a time limit if you want to keep things moving &mdash; 2&ndash;5 minutes works well for most pages.</li>',
  '<li>Scan the QR code in the footer to reveal the answer key and see how you did.</li>',
  '</ol>',
  '<h3 class="text-lg font-bold text-ink mt-5 mb-2 print:text-base">Scoring (Optional)</h3>',
  '<p class="mb-4">Award 1 point per correct answer. For matchup and bracket pages, award 1 point per correct side. Highest score at the end of the book wins bragging rights &mdash; there\'s no prize besides pride.</p>',
  '<h3 class="text-lg font-bold text-ink mt-5 mb-2 print:text-base">Tips</h3>',
  '<ul class="list-disc list-inside space-y-1.5">',
  '<li>Play solo to test yourself, or in a group to see who really knows ball.</li>',
  '<li>No phones until the QR scan &mdash; looking it up early is cheating.</li>',
  '<li>Categories and difficulty are noted at the top of every page, so you can start easy and work up to Hard.</li>',
  '</ul>',
].join('');
