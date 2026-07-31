---
name: bracket-row
description: Build a single "Pages" sheet row for a playoff-bracket trivia page (type "bracket") in NFL Barbook Trivia.xlsx / NBA Barbook Trivia.xlsx, output as a paste-ready Excel array literal. Use when the user wants to add a new playoff-bracket question, mentions "bracket page", "playoff bracket trivia", or asks to generate an Excel row for the Pages sheet.
---

# Bracket Row Builder

Turns a described playoff bracket ("2010 season", "guess the AFC/NFC seeds") into one
ready-to-paste row for the **Pages** sheet in `NFL Barbook Trivia.xlsx` (or the NBA
equivalent, if this book ever adds a bracket format). Does **not** edit the `.xlsx`
file — output the row text and let the user paste it in themselves.

## Column reference (13 columns, in order)

`pageNum, type, title, description, category, difficulty, itemsNote, columns, answerKeyUrl, actionNote, notePosition, noteRotation, noteIcon`

For a bracket row specifically:

| # | Column | Rule |
|---|--------|------|
| 1 | pageNum | Next available page number. **Ask the user**, or have them check the current max `pageNum` in the Pages sheet — never guess silently. |
| 2 | type | Always `"bracket"`. |
| 3 | title | Short heading, e.g. `"Guess the Season — Playoff Bracket"`. |
| 4 | description | One-line instruction, e.g. `"Fill in the teams and guess the year."` |
| 5 | category | Free text, e.g. `"Playoffs"`. |
| 6 | difficulty | One of `Easy`, `Medium`, `Hard`. |
| 7 | itemsNote (clueStyle) | See format below. This is the field the bracket renderer actually parses. |
| 8 | columns | Unused for brackets — always `""`. |
| 9 | answerKeyUrl | Real reference URL for the season (e.g. a pro-football-reference.com playoffs page). This is for human reference only — the sync script rewrites it to a `dykbtrivia.com` redirect, so it just needs to be correct. |
| 10 | actionNote | Optional badge text, e.g. `"How many teams can you place correctly?"`. Blank `""` if no badge. |
| 11 | notePosition | `"left"` or `"right"`. Blank `""` if no badge. |
| 12 | noteRotation | Bare number, degrees, can be negative (e.g. `-8`). `0` if no badge. |
| 13 | noteIcon | Single emoji, e.g. `"🏆"`. Blank `""` if no badge. |

## clueStyle format (column 7)

```
"{prefix}: {seed1, seed2, ..., seedN} / {seed1, seed2, ..., seedN}"
```

- **prefix** is either:
  - `"1990-2019"` — 12-team format, **6 seeds per conference**. WC round is #3v#6 and #4v#5 (seeds #1 and #2 have a bye).
  - `"2020+"` — 14-team format, **7 seeds per conference**. WC round is #2v#7, #3v#6, #4v#5 (seed #1 has a bye).
- Teams are listed **in seed order starting at #1**, comma-separated, for each conference.
- The two conference lists are joined with ` / `.
- A single-list variant without `/` also renders (one flat bracket, no conference split), but the standard case for this book is the dual AFC/NFC form — default to that unless the user asks for a single bracket.

**Validate before emitting:** count the teams on each side of the `/` and confirm it matches 6 (for `1990-2019`) or 7 (for `2020+`). If it doesn't match, stop and flag the mismatch to the user rather than emitting a bad row.

## Canonical example

```
={179, "bracket", "Guess the Season — Playoff Bracket", "Fill in the teams and guess the year.", "Playoffs", "Hard", "1990-2019: Patriots, Steelers, Ravens, Colts, Jets, Chiefs / Falcons, Bears, Eagles, Seahawks, Saints, Packers", "", "https://www.pro-football-reference.com/years/2010/playoffs.htm", "How many teams can you place correctly?", "right", -8, "🏆"}
```

## Workflow

1. **Gather the specifics.** Ask (or infer from what the user already gave you):
   - Which season/year (determines the prefix: pre-2020 → `1990-2019`, 2020 or later → `2020+`, and thus 6 vs 7 seeds per conference).
   - The seeded team order for each conference (seed #1 → last seed). If the user only names a year, look up or ask for the actual seeding — don't invent teams.
   - Title / description wording (defaults are fine if the user doesn't care: `"Guess the Season — Playoff Bracket"` / `"Fill in the teams and guess the year."`).
   - category / difficulty.
   - The answer key URL (a real page for that season, e.g. `https://www.pro-football-reference.com/years/{YEAR}/playoffs.htm`).
   - Whether they want the optional badge (actionNote/notePosition/noteRotation/noteIcon); otherwise use `"", "", 0, ""`.
   - The page number — ask, don't assume.
2. **Validate** the seed counts against the prefix (6 or 7 per side).
3. **Emit exactly one row** in the `={...}` literal format: strings double-quoted, numbers bare, fields comma-separated in the 13-column order above. Nothing else needs to be in the reply besides the row (plus a one-line note on the pageNum used).
4. Remind the user this only produces the row text — they still need to paste it into the Pages sheet themselves and run `npm run sync-pages` afterward.
