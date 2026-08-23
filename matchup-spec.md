# DYKB Trivia — Matchup Grid Question Format Spec

## Overview
Grid-lines layout for matchup questions — two answer fields per row separated by a "VS" divider, with a year (or other label) on the left. Uses the same `space-between` vertical distribution as list questions to fill the content area regardless of item count.

---

## Available Space

Same as list questions: ~660–700px content area depending on header/footer variant. The grid distributes rows evenly within this region.

---

## Grid Structure

4-column CSS grid per row:

```
[ LABEL ]  [ ——— team 1 ——— ]  [ VS ]  [ ——— team 2 ——— ]
```

```jsx
gridTemplateColumns: '50px 1fr 30px 1fr'
```

| Column | Width | Content |
|--------|-------|---------|
| Label | 50px | Year or round identifier |
| Team 1 | `1fr` | Answer line (bottom border) |
| Divider | 30px | "VS" text, centered |
| Team 2 | `1fr` | Answer line (bottom border) |

Column gap: 6px

---

## Row Sizing by Item Count

Rows are not given explicit heights — `space-between` on the parent flex container handles distribution.

| Items | ~Row height | Label size | VS size | Notes |
|-------|-------------|------------|---------|-------|
| 4–6 | 100–160px | Anton 28px | Anton 16px | Very generous — could add score fields |
| 7–10 | 65–95px | Anton 22px | Anton 14px | Standard matchup density |
| 11–15 | 43–60px | Anton 18px | Anton 12px | Tighter but comfortable |
| 16–20 | 32–42px | Anton 16px | Anton 11px | Dense — minimum for handwriting |

**Hard minimums:**
- Row height: 30px (two answer fields must remain writable)
- Label font: 14px
- VS font: 10px

---

## Label Column

### Year label (default)
- Font: Anton
- Color: ink (#1a1a1a)
- Line-height: 1
- Vertically centered in row via `alignItems: 'center'` on the grid

### Round label (e.g. "WC", "DIV", "CONF")
- Font: Plex Mono bold
- Size: 10px
- Uppercase, 0.1em tracking
- Same 50px column width

### Numbered label (e.g. "Game 1")
- Font: Anton
- Same sizing as year label

---

## Answer Lines

| Property | Value |
|----------|-------|
| Border | `1px solid #1a1a1a` (bottom only) |
| Height | 18px (the line sits at the bottom of this space) |
| Flex | `1fr` — fills available column width |

The answer line is a div with only a bottom border, giving a clean write-on line.

---

## VS Divider

| Property | Value |
|----------|-------|
| Font | Anton |
| Size | Scaled with row density (see table above) |
| Color | mid (#555) |
| Alignment | `text-align: center` within its 30px column |

---

## Row Separator

- `1px solid #eee` (ruleLight) bottom border on each row
- No separator after the last row
- For ≤ 6 items: consider `1px solid #ddd` for slightly more definition given the extra whitespace

---

## Container Layout

```jsx
<div style={{
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  paddingTop: items <= 10 ? 8 : 4,
  paddingBottom: items <= 10 ? 4 : 2,
}}>
  {rows}
</div>
```

---

## Variants

### With score field
For matchups where the answer includes a score (e.g. "Fill in teams and scores"), expand to a 6-column grid:

```
[ LABEL ]  [ — team 1 — ]  [ score ]  [ VS ]  [ score ]  [ — team 2 — ]
```

```jsx
gridTemplateColumns: '50px 1fr 40px 30px 40px 1fr'
```

- Score columns: 40px, bottom border only, centered text
- Only viable for ≤ 12 items (rows need ~55px+ to fit two lines comfortably)

### With winner indicator
For matchups where one team advances (e.g. playoff results), add a small checkbox or circle after each team line:

```
[ LABEL ]  [ — team 1 — ] ○  [ VS ]  [ — team 2 — ] ○
```

- Circle: 10px × 10px, `border: 1.5px solid #1a1a1a`, `border-radius: 50%`
- Sits 6px after the answer line, inside a slightly adjusted grid:
  ```jsx
  gridTemplateColumns: '50px 1fr 14px 30px 1fr 14px'
  ```

---

## Edge Cases

### Non-year labels
Some matchups aren't year-indexed (e.g. "Week 1–17 opponents"). Label column stays 50px but uses Plex Mono 10px for longer text like "WK 17".

### Uneven matchup counts
If the question has an odd structure (e.g. a bye week in a list of matchups), leave a full row with label but replace the grid content with a single centered italic note: "BYE" in Plex Mono 10px, color #999, spanning columns 2–4.

### Mixed with a result column
For questions asking "who won?" alongside the matchup, add a 5th column:

```
[ LABEL ]  [ — team 1 — ]  [ VS ]  [ — team 2 — ]  [ winner ]
```

```jsx
gridTemplateColumns: '50px 1fr 30px 1fr 60px'
```

- Winner column: 60px, bottom border, slightly shorter line
- Header label "Winner" in Plex Mono 8px bold above the column (first row only)
