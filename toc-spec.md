# Table of Contents — Feature Spec

## Overview

Add a Table of Contents page type to BarBooks that lists each category (and optional subcategory) with its starting page number. The TOC renders as a standalone page in the book (captured by the PDF pipeline for KDP) and doubles as a navigable index on the web. Individual questions are not listed — the TOC is a section-level directory.

---

## Goals

- Give readers a quick way to jump to a topic area by category and subcategory
- Show the starting page number for each section, not every individual question
- Support two levels of grouping: **category** (e.g., "All Time Stats") and an optional **subcategory** (e.g., "Running Backs")
- Authors control the ordering of questions within each section manually in the Excel sheet — the TOC does not auto-sort by difficulty
- Require zero manual maintenance — the TOC rebuilds itself from page data every time `sync-pages` runs
- Render cleanly in print (PDF/KDP) and on screen (clickable links on the Astro site)
- Provide a collapsible side panel on the website so users can jump between sections from any page without navigating back to the TOC

---

## Data Model Changes

### New field: `subcategory`

Every content page type (`list`, `matchup`, `teams`, `bracket`) gains an optional `subcategory` string field, sitting between `category` and `difficulty` in the data model.

**Excel change:** Insert a new column between `category` (currently col E) and `difficulty` (currently col F). The new column order becomes:

| Col | Field | Notes |
|-----|-------|-------|
| A | pageNum | unchanged |
| B | type | unchanged |
| C | title | unchanged |
| D | description | unchanged |
| E | category | unchanged |
| **F** | **subcategory** | **NEW — optional, free text** |
| G | difficulty | shifted right by 1 |
| H | itemsNote | shifted right by 1 |
| I | columns | shifted right by 1 |
| J | answerKeyUrl | shifted right by 1 |
| K | actionNote | shifted right by 1 |
| L | notePosition | shifted right by 1 |
| M | noteRotation | shifted right by 1 |
| N | noteIcon | shifted right by 1 |

The `subcategory` column is optional. Categories without subcategories render as a single row in the TOC.

**TypeScript change:** Add `subcategory?: string` to `ListPageConfig`, `MatchupPageConfig`, `TeamsPageConfig`, and `BracketPageConfig` in `pageTypes.ts`.

**Sync script change:** Update the `header` array in `excelToJson.ts` to include `subcategory`, read and emit it alongside `category`.

### New page type: `toc`

A new page type that tells the renderer to generate a Table of Contents at that position in the book.

**Excel usage:** Add a row to the Pages sheet:

| Field | Value |
|-------|-------|
| pageNum | desired position (e.g., 1 for front matter) |
| type | `toc` |
| title | "Table of Contents" (or custom — optional) |
| all other cols | blank |

**TypeScript interface:**

```
TocPageConfig {
  type: 'toc'
  title?: string          // defaults to "Table of Contents"
  answerKeyUrl?: string   // included for structural consistency; no QR rendered
}
```

Add `'toc'` to the `PageType` union and `TocPageConfig` to the `PageConfiguration` union.

---

## TOC Rendering Logic

### What the TOC shows

The TOC displays **categories and subcategories with their starting page numbers** — not individual questions.

Each row in the TOC represents either:
- A **category** (e.g., "Awards") with the page number of its first question
- A **subcategory** (e.g., "Quarterbacks" under "All Time Stats") with the page number of its first question

### How starting page numbers are determined

For each category: the lowest page number among all pages tagged with that category.

For each subcategory: the lowest page number among all pages tagged with that category + subcategory combination.

The category-level starting page should always equal the lowest starting page among its subcategories (or its direct pages if it has no subcategories).

### Grouping logic

1. Iterate all pages in the book's config (by array index = page number)
2. Skip non-content pages (`text`, `custom`, and `toc` pages themselves)
3. Collect unique categories, and within each, unique subcategories
4. For each category and subcategory, find the minimum page number (the "starting page")
5. Sort categories alphabetically. Sort subcategories alphabetically within their parent category.

### No difficulty in the TOC

Difficulty is **not displayed** in the TOC — no pips, dots, or labels. Authors handle ordering within each section manually in the Excel sheet. An optional italic note at the top of the TOC can indicate that questions are ordered easy → hard within each section (this note text should be configurable or omittable).

### Data flow

```
booksConfig[bookId].pages
  → filter out text/custom/toc
  → group by category (default "Uncategorised" if blank)
    → group by subcategory
  → for each category: startingPage = min(pageNum) across all its pages
  → for each subcategory: startingPage = min(pageNum) across its pages
  → sort categories A-Z, subcategories A-Z
  → render
```

---

## Visual Design

The TOC is a standalone page — it does **not** use the standard `PageHeader` (scorecard meta-grid) or `PageFooter` (QR code). It has its own self-contained layout.

### Structure (top to bottom)

1. **Top stripe:** dark background (#111) with brand name ("Do You Know Ball?") left-aligned, edition tag (e.g., "NFL · Vol. I") right-aligned — same visual language as the scorecard header stripe but simpler
2. **Title block:** "Table of Contents" in Bebas Neue, 36px, with a 2px solid bottom border
3. **Optional note:** small italic line (e.g., "Questions within each section are ordered easy → hard") — configurable, can be omitted
4. **Body:** category and subcategory rows (see below)
5. **Bottom stripe:** dark background with the domain (dykbtrivia.com) centered

### Category rows

Each category is a row with:
- **Category name** in Bebas Neue, ~17px, uppercase
- **Solid leader line** (1.5px solid #111) filling the space between name and page number
- **Starting page number** right-aligned, bold, tabular-nums

### Subcategory rows (when present)

Nested under the category, indented with a left border accent (3px solid #ddd):
- **Subcategory name** in IBM Plex Mono, 10px, bold, uppercase, color #555
- **Dotted leader line** (1px dotted #aaa)
- **Starting page number** right-aligned, bold

### Categories without subcategories

Render as a single category row with no nested items (e.g., "Awards ——— 1").

### Typography

- Bebas Neue for brand, title, and category names
- IBM Plex Mono for subcategory names, page numbers, and note text
- Consistent with the rest of the book's type system

### Example output

```
┌─────────────────────────────────────────────┐
│ DO YOU KNOW BALL?              NFL · VOL. I  │  ← dark stripe
├─────────────────────────────────────────────┤
│ TABLE OF CONTENTS                            │  ← title block
├─────────────────────────────────────────────┤
│ Questions within each section ordered easy→hard │ ← optional note
│                                              │
│ ALL TIME STATS ———————————————————————————  8 │  ← category row
│   ┃ QUARTERBACKS  · · · · · · · · · · ·  12 │  ← subcategory
│   ┃ RUNNING BACKS · · · · · · · · · · ·   8 │
│   ┃ WIDE RECEIVERS  · · · · · · · · · ·  15 │
│                                              │
│ AWARDS ————————————————————————————————————  1 │  ← no subcategories
│                                              │
│ DRAFT —————————————————————————————————————  19│
│                                              │
│ PLAYOFFS ——————————————————————————————————  6 │
│                                              │
│ SUPER BOWL ————————————————————————————————  17│
│                                              │
│ TEAM KNOWLEDGE ————————————————————————————  22│
│   ┃ AFC EAST  · · · · · · · · · · · · ·  22 │
│   ┃ AFC NORTH · · · · · · · · · · · · ·  26 │
│   ┃ NFC WEST  · · · · · · · · · · · · ·  30 │
│                                              │
├─────────────────────────────────────────────┤
│              dykbtrivia.com                  │  ← dark stripe
└─────────────────────────────────────────────┘
```

---

## TOC Side Panel (Web Navigation)

In addition to the printed TOC page, the website should have a **collapsible side panel** that shows the same TOC structure for quick navigation. This gives users a persistent way to jump between sections without flipping back to the TOC page.

### Behavior

- A toggle button in the `SiteHeader` opens/closes the panel. The button should be a recognizable icon (e.g., a list/menu icon or a small "TOC" label).
- The panel slides in from the left side of the viewport, overlaying the page content. It does not push the content — it floats on top with a semi-transparent backdrop behind it.
- Clicking a category or subcategory navigates to that section's starting page (same `/{bookId}/{pageNum}/` route the rest of the site uses).
- Clicking the backdrop or a close button dismisses the panel.
- The panel preserves the current book context — if you're in the NFL book, it shows the NFL TOC. Switching sport books in the header updates the panel data.

### What it shows

The same data as the printed TOC page:

- **Categories** as section headers (bold, uppercase)
- **Subcategories** nested and indented beneath their parent category, each showing its starting page number
- Categories without subcategories show their starting page number directly
- The currently active section (based on the page you're on) should be visually highlighted so you know where you are in the book

### Active section highlighting

Determine which category/subcategory the current page belongs to and apply a highlight style (e.g., bold text, a left accent bar, or a subtle background color). This gives the user a "you are here" indicator.

### Layout and styling

- **Width:** ~280px on desktop, full-width on mobile
- **Background:** white with a subtle left border or shadow to separate it from page content
- **Typography:** same Bebas Neue (categories) + IBM Plex Mono (subcategories, page numbers) as the printed TOC, but scaled down slightly for the narrower panel
- **Category rows:** category name left-aligned, starting page number right-aligned, no leader dots needed in the panel (the compact width makes dots unnecessary)
- **Subcategory rows:** indented ~16px, left border accent (3px solid #ddd), subcategory name + page number
- **Close button:** top-right corner of the panel, or the same toggle button in the header acts as a toggle
- **Hidden in print:** the panel and toggle button should have `print:hidden` so they don't appear in PDFs

### Relationship to existing SiteHeader filters

The side panel complements but does not replace the existing category/difficulty/type filter dropdowns in `SiteHeader`. The filters control which pages appear in the page-select dropdown; the side panel is a structural overview for jumping between sections. They serve different purposes — the filters are for narrowing within a flat list, the panel is for navigating the book's hierarchy.

### Data source

The side panel uses the same `tocBuilder.ts` utility and `booksConfig` data as the printed TOC page. The `buildToc()` function is called at build time, and the resulting data is passed to the panel component via Astro props or serialized into a client-side script block for interactivity (opening/closing the panel requires client-side JS).

### Implementation approach

The panel should be rendered server-side by Astro (so the TOC data is baked in at build time) and toggled client-side with a small script. Suggested structure:

- **New component:** `TocSidePanel.astro` — renders the panel markup + styles, hidden by default
- **Client script:** a small inline script (similar to the existing filter logic in `SiteHeader`) that toggles a CSS class to show/hide the panel
- **Included in `Layout.astro`:** the panel is part of the page layout, positioned fixed/absolute, so it's available on every page

### Wireframe

```
┌──────────────────────┬─────────────────────────────────┐
│ [×]                  │                                 │
│                      │                                 │
│ ALL TIME STATS     8 │         (page content           │
│   Quarterbacks    12 │          behind semi-            │
│   Running Backs    8 │          transparent             │
│   Wide Receivers  15 │          backdrop)               │
│                      │                                 │
│ AWARDS             1 │                                 │
│                      │                                 │
│ DRAFT             19 │                                 │
│                      │                                 │
│ PLAYOFFS           6 │                                 │
│                      │                                 │
│ SUPER BOWL        17 │                                 │
│                      │                                 │
│ TEAM KNOWLEDGE    22 │                                 │
│  ▸ AFC East       22 │                                 │
│  ▸ AFC North      26 │                                 │
│  ▸ NFC West       30 │                                 │
│                      │                                 │
└──────────────────────┴─────────────────────────────────┘
```

---

## Integration Points

### Files that need changes

| File | Change |
|------|--------|
| `pageTypes.ts` | Add `subcategory` to content page interfaces, add `TocPageConfig`, update unions |
| `excelToJson.ts` | Update header array, read/emit subcategory, handle `toc` type, update serialization |
| `[book]/[page].astro` | Import and render the new TOC component when `type === 'toc'`; skip `PageHeader` and `PageFooter` for `toc` pages |
| `Layout.astro` | Pass `subcategory` through in `pagesSummary`; include `TocSidePanel` component; serialize TOC data for client-side toggle |
| `SiteHeader.astro` | Add a TOC toggle button that opens/closes the side panel |
| `PageFooter.astro` | Suppress QR code rendering for `toc` pages (or handled by skipping footer entirely in `[page].astro`) |
| Excel files | Insert subcategory column, add `toc` row(s) |

### New files

| File | Purpose |
|------|---------|
| `src/utils/tocBuilder.ts` | Utility that takes a pages array and returns grouped categories/subcategories with starting page numbers |
| `src/components/page-types/TableOfContents.astro` | Astro component that renders the printed TOC page |
| `src/components/TocSidePanel.astro` | Collapsible side panel component for web navigation (hidden in print) |

### Header/Footer handling for TOC pages

The `toc` page type should **not** render `PageHeader` (the scorecard meta-grid) or `PageFooter` (the QR code stripe). In `[page].astro`, the conditional that checks page type should skip both components when `type === 'toc'`. The TOC component renders its own header and footer internally.

### PDF pipeline

No changes needed to `generate-pdf.ts`. The TOC is just another page in `booksConfig` — Playwright visits its URL and prints it like any other page, and pdf-lib stitches it into the final document. The side panel is `print:hidden` and does not affect PDF output.

### Cloudflare Worker

No changes needed.

---

## TOC Builder Types

```
TocSubcategoryEntry {
  name: string           // subcategory name
  startingPage: number   // lowest page number in this subcategory
}

TocCategoryEntry {
  name: string                      // category name
  startingPage: number              // lowest page number across all pages in this category
  subcategories: TocSubcategoryEntry[]  // sorted A-Z, empty array if none
}
```

The builder function signature:

```
buildToc(pages: PageConfiguration[]): TocCategoryEntry[]
```

Returns categories sorted A-Z, each with subcategories sorted A-Z and starting page numbers computed as the minimum page number within each group.

---

## Excel Authoring Example

For an NFL book where the TOC is page 1:

| pageNum | type | title | category | subcategory | difficulty |
|---------|------|-------|----------|-------------|------------|
| 1 | toc | Table of Contents | | | |
| 2 | list | NFL DPOY (2015–2024) | Awards | | Easy |
| 3 | list | NFL MVP Challenge (2000–2024) | Awards | | Hard |
| 4 | list | Top 10 Career Rushing TDs | All Time Stats | Running Backs | Easy |
| 5 | list | Top 20 Career Rushing Yards | All Time Stats | Running Backs | Medium |
| 6 | list | Single-Season Rush Yards Leaders | All Time Stats | Running Backs | Hard |
| 7 | list | Most Career Passing TDs (Top 10) | All Time Stats | Quarterbacks | Easy |
| 8 | list | Most Career Passing Yards (Top 15) | All Time Stats | Quarterbacks | Hard |

The TOC would render:

```
ALL TIME STATS ———————————————————  4
  ┃ QUARTERBACKS · · · · · · · ·  7
  ┃ RUNNING BACKS  · · · · · · ·  4

AWARDS ————————————————————————————  2
```

Note: "All Time Stats" shows page 4 because that's the lowest page number across all its subcategories. Authors control question order within each section by arranging rows in the Excel sheet.

---

## Open Questions

1. **TOC position:** Should the TOC always be page 1, or flexible? (Current spec: flexible — wherever you put the row in Excel.)
2. **Multi-book TOC:** Should each sport volume (NFL, NBA) get its own TOC? (Current spec: one TOC per book, since each is a separate Excel file.)
3. **KDP page numbering:** KDP front matter (title page, copyright) may need unnumbered pages before the TOC. Does the current page-numbering scheme need adjustment, or will front-matter pages be separate PDFs merged outside the pipeline?
4. **Note text:** Should the optional note ("Questions within each section are ordered easy → hard") be hardcoded, configurable via Excel, or a toggle?
