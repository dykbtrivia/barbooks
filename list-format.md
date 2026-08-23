# DYKB Trivia — List Question Format Spec

## Overview
Single-column list layouts for the 6×9 book page (600×900px). Lists range from 5 to 32 items. The layout must vertically fill the available content area so that answer lines are evenly distributed with no dead space at the bottom.

---

## Available Space

| Zone | Height | Notes |
|------|--------|-------|
| Header | ~80–100px | Varies by header variant (A–D) |
| Title block | ~36–50px | Title (Anton 22px) + optional subtitle (Inter 10px) + margin |
| **Content area** | **~660–700px** | flex:1 region — answer lines fill this |
| Footer | ~44–54px | Varies by footer variant |

The content area is the `flex:1` child inside the page shell. Answer lines use `justifyContent: 'space-between'` on this container so they distribute evenly regardless of count.

---

## Row Anatomy

Each row is a horizontal flex container:

```
[ LABEL ]  [ ————————————————————— answer line ————————————————————— ]
```

- **Label**: left-aligned, fixed width, never wraps
- **Answer line**: `flex:1`, bottom border `1px solid #1a1a1a`
- **Gap** between label and line: 10px

---

## Row Sizing by Item Count

Row height is not set explicitly — it's the result of `space-between` distribution across the content area. The table below gives approximate per-row heights and the font sizes that work at each density.

| Items | ~Row height | Label font | Label size | Rank size | Notes |
|-------|-------------|------------|------------|-----------|-------|
| 5–8 | 80–130px | Plex Mono | 12px | Anton 36px | Generous — can add secondary answer fields |
| 9–12 | 55–75px | Plex Mono | 11px | Anton 28px | Comfortable — room for a hint line |
| 13–18 | 37–50px | Plex Mono | 10px | Anton 22px | Standard density |
| 19–25 | 26–36px | Plex Mono | 10px | Anton 18px | Tight — label and line only |
| 26–32 | 20–26px | Plex Mono | 9px | Anton 16px | Maximum density — minimum viable |

**Hard minimums:**
- Row height never below 20px (answer line becomes unusable for handwriting)
- Label font never below 9px
- Rank number never below 14px

---

## Label Types

### Ranked (e.g. "Top 10 receivers")
```
#1  _______________
#2  _______________
```
- Label: `#` + number, Anton, right-aligned
- Label width: `Math.max(36, digitCount * 16 + 12)` px
- Color: ink (#1a1a1a)

### Year-labeled (e.g. "MVPs 2000–2024")
```
2024:  _______________
2023:  _______________
```
- Label: 4-digit year + colon, Plex Mono bold
- Label width: 48px
- Color: ink

### Numbered (e.g. "Name 15 teams that…")
```
1.  _______________
2.  _______________
```
- Label: number + period, Plex Mono semibold
- Label width: `Math.max(24, digitCount * 10 + 8)` px
- Color: ink

### Plain (no label — e.g. "List every team in the NFC")
```
_______________
_______________
```
- No label, answer line spans full width
- Left padding: 0 (line starts at content edge)

---

## Answer Line

| Property | Value |
|----------|-------|
| Border | `1px solid #1a1a1a` (bottom only) |
| Min width | 120px (ensures usable writing space) |
| Alignment | baseline-aligned with label text |
| Right edge | Flush to content margin (32px from page edge) |

### Multi-field rows (for 5–12 item lists with room)
When item count is ≤ 12 and the question asks for multiple data points per entry (e.g. player name + stat), split the answer line into segments:

```
#1  [ —— name —— ]  [ — yards — ]
```

- Primary field: `flex:1`
- Secondary field: fixed width (60–80px), right-aligned
- Separator: 12px gap
- Field hint text: Plex Mono 8px, color #999, baseline-aligned, only on first row

---

## Separator Lines

For lists ≥ 13 items, no separator between rows — `space-between` provides the visual grouping.

For lists ≤ 12 items, add a subtle separator:
- `1px solid #ddd` (ruleLight) between rows
- No separator after last row

---

## Content Area Layout Rules

```jsx
<div style={{
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',  // key: distributes rows evenly
  paddingTop: items <= 12 ? 8 : 4,
  paddingBottom: items <= 12 ? 4 : 2,
}}>
  {rows}
</div>
```

### Vertical padding adjustment
| Items | Top pad | Bottom pad |
|-------|---------|------------|
| 5–8 | 12px | 8px |
| 9–12 | 8px | 4px |
| 13–25 | 4px | 2px |
| 26–32 | 2px | 0px |

---

## Title Block

| Element | Font | Size | Notes |
|---------|------|------|-------|
| Title | Anton | 22px | Uppercase, line-height 1.1 |
| Subtitle | Inter | 10px | Color: #555 (mid), line-height 1.4, max 2 lines |
| Gap below subtitle | — | 10px | Before content area starts |

If no subtitle, title margin-bottom is 10px.

---

## Edge Cases

### Odd counts in two-column mode (future)
Not yet specified — will revisit if single-column doesn't work for 25+ items.

### Lists with grouped sections
Some questions group items (e.g. "Name 3 per division, 4 divisions"). Handle with section headers inside the list:
- Section header: Plex Mono 8px, bold, uppercase, 0.2em tracking, color #555
- Takes one "row slot" in the vertical distribution
- 2px ink rule below section header, spanning full width
- Count section headers in the total item count for spacing math

### Bonus/extra credit line
If a question has a bonus item (e.g. "Name 10… and a bonus 11th"):
- Last row gets a different label style: Plex Mono italic, color #999
- Separated from main list by a 1px dashed line (#ccc)
