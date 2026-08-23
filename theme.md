# DYKB Trivia — Web Theme Spec

A unified design system for the DYKB web presence: the How to Play landing page, answer key pages, and the internal dev/test site.

---

## Color Tokens

### Core Palette
```css
--ink:          #1a1a1a    /* Primary text, dark backgrounds */
--ink-soft:     #2a2a2a    /* Slightly lifted ink for cards on dark bg */
--mid:          #555555    /* Body text, secondary copy */
--light:        #999999    /* Tertiary text, disabled states */
--cream:        #f5e9d0    /* Primary background */
--cream-light:  #f7ecd2    /* Alternate light background */
--cream-dark:   #ebd9b4    /* Muted text on dark backgrounds */
--red:          #c8102e    /* Accent, CTAs, active states */
--red-dark:     #a50d24    /* Hover/pressed on red elements */
--white:        #ffffff    /* Card surfaces, inputs */
```

### Semantic Usage
| Context | Background | Text | Accent |
|---------|-----------|------|--------|
| Light sections | `--cream` | `--ink` | `--red` |
| Dark sections | `--ink` | `--cream` | `--red` |
| Red sections | `--red` | `--cream` | `--ink` |
| Cards on cream | `--white` | `--ink` | `--red` |
| Cards on ink | `--ink-soft` | `--cream` | `--red` |

### Textures
- **Paper:** `repeating-linear-gradient(45deg, rgba(120,80,40,0.05) 0 2px, transparent 2px 6px)` on `--cream-light`
- **Dark paper:** `repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 6px)` on `--ink`
- Use sparingly — hero sections and feature areas, not every surface.

---

## Typography

### Font Stack
```css
--font-display: 'Anton', sans-serif;
--font-mono:    'IBM Plex Mono', monospace;
--font-body:    'Inter', sans-serif;
```

### Google Fonts Import
```
Anton
IBM+Plex+Mono:wght@400;500;600;700
Inter:wght@400;500;600;700
```

### Type Scale

| Role | Font | Size | Weight | Tracking | Usage |
|------|------|------|--------|----------|-------|
| H1 | Anton | 96px | 400 | 0.015em | Page hero titles |
| H2 | Anton | 44–52px | 400 | 0 | Section titles |
| H3 | Anton | 28–36px | 400 | 0 | Sub-section titles |
| Eyebrow | Plex Mono | 12–13px | 400–600 | 0.4–0.5em | Section labels, categories |
| Body | Inter | 15–17px | 400 | 0 | Paragraphs, descriptions |
| Body Small | Inter | 14px | 400 | 0 | Captions, secondary info |
| Label | Plex Mono | 12–13px | 700 | 0.1–0.15em | List items, data labels |
| Button | Anton | 18–20px | 400 | 0.04em | CTAs, actions |
| Code/Data | Plex Mono | 14px | 400 | 0.05em | Scores, stats, technical |

### Type Rules
- Anton is always UPPERCASE
- Plex Mono eyebrows are always uppercase with wide tracking
- Body text line-height: 1.6–1.75
- Display line-height: 0.88–1.0
- Max body text width: ~520px for readability

---

## Spacing

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Inline spacing |
| md | 16px | Component padding, small gaps |
| lg | 24px | Section sub-spacing |
| xl | 32px | Card gaps, column gaps |
| 2xl | 40px | Horizontal page padding |
| 3xl | 48px | Section vertical padding (small) |
| 4xl | 60–80px | Section vertical padding (large) |

### Layout
- Max content width: **960px**, centered
- Horizontal padding: **40px** (desktop)
- Section vertical padding: **60–80px**

---

## Components

### Buttons

#### Primary (Red)
```
Background: --red
Text: white
Font: Anton 18–20px, uppercase, 0.04em tracking
Padding: 16px 40px
Border: none
Hover: --red-dark
```

#### Secondary (Outline)
```
Background: transparent
Text: current text color (cream on dark, ink on light)
Font: Anton 18–20px, uppercase, 0.04em tracking
Padding: 16px 40px
Border: 2px solid current text color
Hover: fill with text color, invert text
```

### Cards
```
Border: 2.5px solid --ink
Padding: 32–36px
Background: --white (light) or --ink (dark/inverted)
No border-radius (square corners throughout)
```

### Numbered Steps
```
Block: 56×56px square
Background: --ink
Text: --cream, Anton 28px
Connector: 2px line, --ink at 15% opacity
```

### Bullets / List Markers
```
Red square: 6×6px, --red, no border-radius
Gap to text: 10px
Text: Plex Mono 12px, 0.1em tracking
```

### Dividers
```
Horizontal rule: 2px solid --ink
Red accent rule: 80×4px --red (used after headlines)
```

### Eyebrow Pattern
```
Font: Plex Mono, 12–13px, uppercase
Tracking: 0.4–0.5em
Color: --red (on dark bg) or --mid (on light bg)
Margin below: 10px
```

---

## Section Backgrounds

Alternate between cream and dark to create rhythm. The pattern:

1. **Dark (ink)** — Hero / emphasis
2. **Red** — Selling points / callouts (use sparingly, max 1–2 per page)
3. **Cream** — Default content sections
4. **White** — Cards and inputs sitting on cream

Never stack two sections of the same background color.

---

## Links
```css
a { color: var(--red); text-decoration: underline; text-underline-offset: 3px; }
a:hover { color: var(--red-dark); }
/* On dark backgrounds */
.dark a { color: var(--cream); }
.dark a:hover { color: var(--white); }
```

---

## Iconography
- No emoji in production UI
- Simple geometric SVG icons (strokes, not fills)
- Stroke width: 2–2.5px
- Color: inherit from parent text color
- Sport metaphors: O (circle) and X for play modes, viewfinder corners for scanning

---

## Dev Site Application

For the internal dev/test site, apply at minimum:

1. **Global styles:** Set `body` background to `--cream`, text to `--ink`, font to Inter
2. **Navigation/header:** Ink background, cream text, DYKB logo mark (small lockup)
3. **Code blocks / data:** Plex Mono on ink-soft background
4. **Action buttons:** Use primary (red) and secondary (outline) button styles
5. **Page titles:** Anton uppercase
6. **Cards/panels:** White bg, 2.5px ink border, square corners

---

## CSS Custom Properties Block

Drop this in any page's `<style>` to access the full token set:

```css
:root {
  --cream: #f5e9d0;
  --cream-light: #f7ecd2;
  --cream-dark: #ebd9b4;
  --red: #c8102e;
  --red-dark: #a50d24;
  --ink: #1a1a1a;
  --ink-soft: #2a2a2a;
  --mid: #555;
  --light: #999;

  --font-display: 'Anton', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
  --font-body: 'Inter', sans-serif;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 40px;
  --space-3xl: 48px;
  --space-4xl: 64px;

  --max-content: 960px;
  --border-width: 2.5px;
}
```
