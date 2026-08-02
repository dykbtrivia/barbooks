# Staggered Bracket Spec — Content Area Only

## Overview
A playoff bracket filling the content area (~536 × 660px) of a 6×9 book page. AFC occupies the **top-left**, NFC occupies the **bottom-right**, and the Super Bowl cell sits at the **center** where they converge. The diagonal stagger uses the full page height better than a side-by-side layout.

This spec covers **two distinct bracket formats**, matching the two `clueStyle` prefixes already parsed by the bracket renderer (`1990-2019` vs `2020+`). The two formats differ in round count, bye handling, and therefore total vertical space needed — the stagger geometry must flex per format rather than assume one fixed shape.

Font sizes, colors, and other visual styling are intentionally **out of scope** for this pass — only layout/geometry is specified here.

---

## The Two Formats

| | **12-team (`1990-2019`)** | **14-team (`2020+`)** |
|---|---|---|
| Seeds per conference | 6 | 7 |
| Wild Card games | 2 (`#3 v #6`, `#4 v #5`) | 3 (`#2 v #7`, `#3 v #6`, `#4 v #5`) |
| Byes | #1 and #2 both bye directly into Divisional | Only #1 byes directly into Divisional |
| Divisional games | 2 (`#1 v WC1 winner`, `#2 v WC2 winner`) — fixed pairing | 2 (`#1 v a WC winner`, `winner v winner`) — **reseeded**, no fixed pairing |
| Rounds before SB | Wild Card → Divisional → Conf. Championship | Wild Card → Divisional → Conf. Championship |
| Relative vertical footprint | Shorter (2 WC slots stacked) | Taller (3 WC slots stacked) |

Because byes advance straight into a Divisional slot (they are not a separate round), there is **no dashed "BYE" column** in either format — a bye is simply a labeled cell that already sits in the Divisional column with no incoming connector, only an outgoing one. The previous version of this spec's separate BYE column with dashed connector lines does not match either real format and is removed.

---

## Grid & Dimensions (geometry only — no color/font)

| Token | Value |
|-------|-------|
| Cell width | 92 px |
| Cell height | 20 px |
| Cell gap (vertical, within a matchup pair) | 5 px |
| Extra vertical gap between separate matchups in the same round | 24 px |
| Connector arm length | 14 px |
| Line weight | 1.5 px |

These are shared by both formats; only the number of stacked WC slots (and therefore total height) changes.

---

## Structure

### AFC — Top-Left (flows left → right → center)

**12-team format:**
```
Column 0 (x=0)          Column 1 (x=106)         Column 2 (x=212)
WILD CARD                DIVISIONAL               AFC CHAMPIONSHIP
┌──────────┐             ┌──────────┐
│  #3 Seed │─┐           │  #1 Seed │─┐           ┌──────────┐
├──────────┤ ├──conn──→  ├──────────┤ ├──conn──→  │ Div win  │─┐
│  #6 Seed │─┘           │ WC1 win  │─┘           ├──────────┤ ├──conn──→ SB
├──────────┤             └──────────┘             │ Div win  │─┘
│  #4 Seed │─┐           ┌──────────┐             └──────────┘
├──────────┤ ├──conn──→  │  #2 Seed │─┐
│  #5 Seed │─┘           ├──────────┤ ├──conn──→
└──────────┘             │ WC2 win  │─┘
                         └──────────┘
```
- 2 WC matchup pairs (4 slots total)
- Each Divisional slot is either a bye seed (#1 or #2) paired with the corresponding WC winner
- 2 Divisional matchup pairs → 1 Conf. Championship pair → SB

**14-team format:**
```
Column 0 (x=0)          Column 1 (x=106)         Column 2 (x=212)
WILD CARD                DIVISIONAL               AFC CHAMPIONSHIP
┌──────────┐
│  #2 Seed │─┐
├──────────┤ ├──conn──→  ┌──────────┐
│  #7 Seed │─┘           │  #1 Seed │─┐
├──────────┤             ├──────────┤ ├──conn──→  ┌──────────┐
│  #3 Seed │─┐           │ WC win   │─┘           │ Div win  │─┐
├──────────┤ ├──conn──→  └──────────┘             ├──────────┤ ├──conn──→ SB
│  #6 Seed │─┘           ┌──────────┐             │ Div win  │─┘
├──────────┤             │ WC win   │─┐           └──────────┘
│  #4 Seed │─┐           ├──────────┤ ├──conn──→
├──────────┤ ├──conn──→  │ WC win   │─┘
│  #5 Seed │─┘           └──────────┘
└──────────┘
```
- 3 WC matchup pairs (6 slots total) — one full extra matchup pair taller than the 12-team format
- Divisional is reseeded: #1's bye slot pairs with one WC winner; the other Divisional slot pairs two WC winners together. Which WC winner lands where isn't fixed at spec time — leave the second slot of each Divisional pair unlabeled (winner TBD) the same way the renderer already does
- 2 Divisional matchup pairs → 1 Conf. Championship pair → SB

**Y positions (AFC, either format):**
- Title "AFC" sits above column 0
- WC slots stack top-to-bottom, one matchup pair per game, with the extra vertical gap between pairs (14-team has 3 pairs instead of 2, so it is taller)
- Each Divisional matchup pair is vertically centered on the midpoint of its corresponding WC output (bye slots align directly since they have no WC input)
- Conf. Championship pair is vertically centered between the two Divisional pair midpoints

### NFC — Bottom-Right (flows right → left → center, mirrored)

Identical structure to AFC (same 12-team / 14-team distinction) but:
- **Horizontally mirrored**: WC at the right edge, flowing leftward
- **Vertically offset**: starts below the AFC bracket's vertical extent so the two brackets don't overlap — the offset must account for whichever format is taller (14-team AFC needs more headroom before NFC can start)
- Connectors use reversed direction (arms extend left instead of right)

### Super Bowl — Center

- Positioned at horizontal center, single cell
- Vertical position = midpoint between the AFC Conf. Championship output and the NFC Conf. Championship output
- Single empty cell for the champion; season/champion labeling deferred (style/content pass, not this spec)

---

## Connector Logic

### Standard Connector (AFC, left-to-right)
From a **matchup pair** (two stacked cells) to the next round:
1. Horizontal arm from right edge of top cell → halfway point
2. Horizontal arm from right edge of bottom cell → halfway point
3. Vertical line connecting those two endpoints
4. Horizontal arm from vertical midpoint → left edge of next cell

A bye slot (12-team #1/#2, 14-team #1 only) has **no incoming connector** — only the standard outgoing connector to the next round, since it has nothing to merge with in its own round.

### Reversed Connector (NFC, right-to-left)
Same shape, mirrored: arms extend from left edges, vertical on the left side.

### Conference → Super Bowl
Single diagonal line from the Conference Championship connector output to the Super Bowl cell. AFC line enters from the left; NFC line enters from the right.

---

## Round Labels
- Positioned above the first cell of each round
- AFC labels: left-aligned
- NFC labels: right-aligned
- Text: "WILD CARD", "DIVISIONAL", "AFC CHAMPIONSHIP" / "NFC CHAMPIONSHIP"
- No separate "BYE" label — byes are just unlabeled-round cells inside the Divisional column

---

## Visual Flow

```
AFC ─────────────→
  WC → DIV → CHAMP ──╲
                       ╲
                    SUPER BOWL
                       ╱
  WC → DIV → CHAMP ──╱
                 ←───────── NFC
```

The diagonal creates a natural "funnel" from opposite corners toward the center, using the full height and width of the content area. The 14-team format's extra WC matchup pair makes its funnel taller than the 12-team format's — the layout must derive total height from the format in use rather than assume a fixed page fill.
