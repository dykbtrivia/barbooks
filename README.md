# BarBooks

A multi-sport trivia book system designed for print-on-demand distribution. Players fill in answers to questions like "name the last 20 NFL MVPs" or "who is each team's all-time passing leader." Books are authored in Excel, rendered as a web app, and exported to PDF for physical printing.

## How it works

```
Excel spreadsheet  →  npm run sync-pages  →  Astro web app  →  PDF  →  Print-on-demand
                                                   ↕
                                          QR codes in print footer
                                                   ↓
                                     dykbtrivia.com/{book}/{page}
                                                   ↓
                                        Cloudflare Worker (KV)
                                                   ↓
                                          Real answer key URL
```

Question pages don't include printed answers. Each page has a QR code that redirects through a Cloudflare Worker to the real answer source — so broken links can be fixed without reprinting.

## Repository Structure

```
barbooks/
├── apps/
│   ├── web/                         # Astro site (book renderer + PDF generator)
│   │   ├── NBA Barbook Trivia.xlsx  # NBA content source of truth
│   │   ├── NFL Barbook Trivia.xlsx  # NFL content source of truth
│   │   ├── scripts/
│   │   │   └── generate-pdf.ts      # Playwright + pdf-lib PDF export
│   │   └── src/
│   │       ├── components/          # Astro UI components
│   │       ├── pages/
│   │       │   ├── index.astro      # Redirects to /barbooks/nfl/1/
│   │       │   └── [book]/[page].astro  # Dynamic route for all pages
│   │       └── utils/
│   │           ├── pageTypes.ts     # TypeScript interfaces
│   │           ├── pageConfig.ts    # Auto-generated page content (do not edit)
│   │           └── excelToJson.ts   # Excel → pageConfig.ts generator
│   │
│   └── worker/                      # Cloudflare Worker (QR redirect + analytics)
│       ├── src/index.ts             # Request handler / router
│       └── wrangler.toml            # Cloudflare config
│
└── package.json                     # Root monorepo scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```sh
npm install
```

### Run the development server

```sh
npm run dev:web
# Site is available at http://localhost:4321
```

## Commands

All commands are run from the **repository root**:

| Command | Description |
|---|---|
| `npm run dev:web` | Start the Astro dev server at `localhost:4321` |
| `npm run build:web` | Build the production site to `apps/web/dist/` |
| `npm run sync-pages` | Regenerate `pageConfig.ts` from the Excel files |
| `npm run generate-pdf` | Export a print-ready PDF for all books |
| `npm run dev:worker` | Start the Cloudflare Worker locally via Wrangler |
| `npm run deploy:worker` | Deploy the Worker to Cloudflare |

### PDF generation flags

```sh
# Generate all books
npm run generate-pdf

# One book only, skip rebuilding the site
npm run generate-pdf -- --book nfl --skip-build

# Custom output path
npm run generate-pdf -- --book nfl --out ~/Desktop/nfl-draft.pdf
```

Playwright browser binaries must be installed before running PDF generation:

```sh
npx playwright install chromium
```

## Updating Content

Content is authored entirely in the Excel files — **never edit `pageConfig.ts` by hand**, it is auto-generated.

1. Open `apps/web/NFL Barbook Trivia.xlsx` (or the NBA equivalent)
2. Edit the **Pages** sheet (one row = one page) or the **Matchup Items** sheet
3. Run `npm run sync-pages` to regenerate `src/utils/pageConfig.ts`
4. Verify with `npm run dev:web` or `npm run build:web`

### Page types

| Type | Description |
|---|---|
| `list` | Numbered fill-in-the-blank items with optional clues (year, rank, etc.) |
| `matchup` | Head-to-head comparisons with a center label (e.g. score, "vs") |
| `text` | Plain paragraph content — intro pages, rules, etc. |
| `custom` | Arbitrary HTML for special layouts |

## QR Code Redirects

QR codes in the printed book point to `https://dykbtrivia.com/{book}/{pageNum}`. A Cloudflare Worker handles those requests and redirects to the real answer key URL (e.g. a pro-football-reference page).

To seed or update the Worker's KV store with URLs from the Excel file:

```sh
cd apps/web && npx tsx scripts/seed-kv.ts
cd apps/worker && npx wrangler kv bulk put --namespace-id <id> kv-seed.json
```

## Deployment

The web app deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`. The live site is at `https://mfortman11.github.io/barbooks`.

The Cloudflare Worker is deployed separately:

```sh
npm run deploy:worker
```
