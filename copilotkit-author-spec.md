# CopilotKit Trivia Authoring Tool — Spec

## Overview

A standalone Next.js app inside the existing monorepo that uses **CopilotKit v2** to draft new trivia pages by chatting with an AI. The agent emits structured `ListPageConfig` / `MatchupPageConfig` objects matching the existing `pageTypes.ts` interfaces, renders them in a live preview using React ports of `List.astro` / `Matchup.astro`, and exports clipboard-ready TSV rows that paste directly into the existing Excel spreadsheets.

The print pipeline (`Excel → sync-pages → pageConfig.ts → Astro → PDF`) is **untouched**. This tool only produces spreadsheet rows; it never writes to `pageConfig.ts`.

```
Author chats in Copilot sidebar
  → frontend tool generateListPage(args) fires
  → React state updates → live preview renders
  → author tweaks via more chat or direct edit
  → "Copy as Excel row" → paste into NFL Barbook Trivia.xlsx
  → npm run sync-pages (existing workflow)
```

---

## Repo Structure

```
barbooks/
├── apps/
│   ├── web/                          ← existing Astro book app
│   ├── worker/                       ← existing Cloudflare Worker
│   └── author/                       ← NEW
│       ├── package.json
│       ├── next.config.mjs
│       ├── tsconfig.json             ← path alias to ../web/src/utils/pageTypes
│       ├── .env.local                ← ANTHROPIC_API_KEY (gitignored)
│       └── src/
│           ├── app/
│           │   ├── layout.tsx        ← <CopilotKit runtimeUrl="/api/copilotkit">
│           │   ├── page.tsx          ← main UI + <CopilotSidebar>
│           │   └── api/copilotkit/route.ts  ← CopilotRuntime endpoint
│           ├── components/
│           │   ├── PagePreview.tsx
│           │   ├── ListPreview.tsx   ← React port of List.astro
│           │   ├── MatchupPreview.tsx
│           │   └── ExcelRowExport.tsx
│           ├── copilot/
│           │   ├── useGenerateListPage.ts     ← useCopilotAction
│           │   ├── useGenerateMatchupPage.ts
│           │   ├── useRefineItems.ts
│           │   └── useDraftContext.ts         ← useCopilotReadable
│           ├── lib/
│           │   ├── schemas.ts        ← zod mirrors of pageTypes.ts
│           │   └── toExcelRow.ts     ← PageConfig → TSV
│           └── types/pageTypes.ts    ← re-export from apps/web
└── package.json                      ← workspaces already include apps/*
```

---

## URL / Surface

| Route | Purpose |
|---|---|
| `/` | Single-page authoring surface — left: live preview; right: `<CopilotSidebar>` chat |
| `/api/copilotkit` | CopilotRuntime endpoint (Anthropic adapter) |

No persistence. Drafts live in React state. Author copies TSV out when satisfied.

---

## Frontend Tools (CopilotKit Actions)

Each is a `useCopilotAction` hook with a zod schema mirroring `pageTypes.ts`. The handler updates the draft React state — that's it. The LLM picks which to call based on the chat.

| Action | Parameters | Effect |
|---|---|---|
| `generateListPage` | `title`, `description?`, `itemsNote`, `items[].clue`, `columns?`, `actionContent?` | Replace draft with a new `ListPageConfig` |
| `generateMatchupPage` | `title`, `description?`, `items[].context`, `items[].centerText`, `columns?` | Replace draft with a new `MatchupPageConfig` |
| `refineItems` | `mode: 'reorder' \| 'edit' \| 'add' \| 'remove'`, `items[]` | Mutate the current draft's items |
| `setActionBadge` | `content`, `position`, `rotation`, `icon` | Add/update the decorative badge |

---

## Shared Context (CopilotKit Readables)

Surface the current draft + relevant book conventions to the LLM via `useCopilotReadable`:

- **Current draft** — the in-progress `PageConfig` so refine actions know what to mutate
- **Book conventions** — short string describing `itemsNote` patterns the parser recognises (`"25 items – clues are years descending from 2024"`, `"20 items – clues are rank numbers"`)
- **Existing pages** — optionally a digest of `pageConfig.pages` so the LLM avoids duplicating recent topics

---

## Skill → Task Mapping

Each phase of the build maps to one of the installed CopilotKit skills.

| Phase | Skill | What it covers |
|---|---|---|
| 1. Bootstrap `apps/author` Next.js app, install `@copilotkit/react-core` + `@copilotkit/react-ui` + `@copilotkit/runtime`, wire `<CopilotKit>` provider, create `/api/copilotkit/route.ts` with Anthropic adapter, prove a hello-world chat works | **copilotkit-setup** | Framework detection, package installation, runtime wiring, provider setup, first working chat |
| 2. Implement `useGenerateListPage`, `useGenerateMatchupPage`, `refineItems`, `setActionBadge` as `useCopilotAction` hooks; share draft + conventions via `useCopilotReadable`; add `<CopilotSidebar>` to the page | **copilotkit-develop** | Frontend tools, sharing application context, chat UI components |
| 3. (Optional later) If a single LLM call isn't smart enough — e.g. multi-step generate → critique → refine — wrap it in a custom agent backend (LangGraph or hand-rolled) speaking AG-UI | **copilotkit-agui** + **copilotkit-integrations** | AG-UI event protocol; LangGraph wiring through the runtime |
| 4. When the runtime won't connect, streaming stalls, or tool calls don't fire | **copilotkit-debug** | Runtime connectivity, AG-UI event tracing, tool execution problems |

Phases 1 and 2 are the MVP. Phase 3 is only worth doing if the simple single-action approach produces low-quality drafts. Phase 4 is reactive.

---

## Build Order

1. **`apps/author` scaffold + runtime** (skill: `copilotkit-setup`) — get a chat box rendering and talking to Claude. Verify with a trivial echo.
2. **`lib/schemas.ts`** — zod schemas derived from `pageTypes.ts`. This is the contract the LLM fills in.
3. **`ListPreview.tsx` / `MatchupPreview.tsx`** — port the Astro components to React. Render hardcoded fixture data first, no Copilot involved.
4. **`useGenerateListPage` + `useGenerateMatchupPage`** (skill: `copilotkit-develop`) — actions that swap draft state. Test by asking the chat *"make a list page of the last 25 NFL MVPs"* and confirming the preview updates.
5. **`useCopilotReadable` for the current draft** — so the LLM can see what it just made.
6. **`refineItems` + `setActionBadge`** — incremental editing actions.
7. **`ExcelRowExport.tsx`** — `toExcelRow(draft)` produces a TSV string matching Pages-sheet columns A–K (and Matchup Items rows where applicable). Copy-to-clipboard button. Paste into spreadsheet, run `npm run sync-pages`, done.

---

## Out of Scope (v1)

- Writing directly to the Excel file (would bypass the human review the spreadsheet provides)
- Persisting drafts across sessions (state lives in React only)
- Auth (local dev tool, single user)
- Multi-page batch generation (one page at a time keeps the LLM focused and the preview honest)
- Image/asset generation for `ActionContent` icons (stick with emoji)

---

## Open Questions

1. **Which Claude model?** Default to `claude-sonnet-4-6` for cost; bump to `claude-opus-4-7` if structured output quality lags.
2. **Does `apps/author` deploy anywhere?** Probably not — it's a local authoring tool. Skip CI entirely unless that changes.
3. **Should the LLM see the existing `pageConfig.ts`?** Useful for avoiding duplicate topics, but adds tokens. Defer until we see the LLM repeating itself.
