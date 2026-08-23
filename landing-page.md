# DYKB Trivia — "How to Play" Web Page Spec

## Overview
Standalone landing/advertising page for the DYKB Trivia book. Serves as both a product pitch and a how-to-play guide. Designed at 1200px wide, cream background.

## Design System

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Ink | `#1a1a1a` | Primary text, dark section backgrounds |
| Mid | `#555` | Body text, secondary copy |
| Light | `#999` | Tertiary text |
| Red | `#c8102e` | Accent, CTAs, "Spice It Up" section bg |
| Red Dark | `#a50d24` | Hover/pressed states (not yet implemented) |
| Cream | `#f5e9d0` | Page background |
| Cream Light | `#f7ecd2` | Alternate light bg |
| Cream Dark | `#ebd9b4` | Muted text on dark backgrounds |

### Typography
| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | Anton | 400 | Headlines, section titles, CTAs |
| Mono | IBM Plex Mono | 400–700 | Labels, eyebrows, bullet items |
| Body | Inter | 400 | Body copy, descriptions |

### Patterns
- Subtle diagonal line texture on dark hero (`repeating-linear-gradient 45deg, 0.04 opacity`)
- Square number blocks (56×56, ink bg, cream text) for steps
- Red square bullets (6×6) for list items
- O and X icons (SVG) for Solo / With a Friend modes
- Section eyebrows: Plex Mono, 12px, 0.4em letter-spacing, uppercase

---

## Page Sections (top to bottom)

### 1. Hero (dark — ink background)
- **Eyebrow:** "PRO FOOTBALL EDITION" — Plex Mono 13px, red, 0.5em tracking
- **H1:** "(DYKB) TRIVIA" — Anton 96px, cream, line-height 0.88
- **Red rule:** 80×4px
- **Pitch copy:** "Not your typical trivia night. No single-answer gotcha questions — every challenge is a list you fill out, debate, and argue over. Grab the book, grab a friend, and see who really knows ball." — Inter 18px, cream-dark, max-width 480px
- **Decorative:** Large "?" glyph, Anton 200px, 15% opacity, right-aligned

### 2. Selling Points Banner (red background)
Three equal columns, centered text, 48px vertical padding:

| Column | Headline | Copy |
|--------|----------|------|
| 1 | IN-PERSON FUN | Put down the phone. This is face-to-face, pen-in-hand trivia you can play anywhere. |
| 2 | MORE THAN ONE ANSWER | Lists, matchups, and brackets — not just "who did it first?" Every question is a conversation. |
| 3 | ALWAYS CURRENT | Scan the QR code for answer keys that update with every roster move and record broken. |

- Headlines: Anton 20px
- Copy: Inter 14px, 85% opacity

### 3. How to Play — 3 Steps (cream background)
- **Eyebrow:** "THE PLAYBOOK"
- **H2:** "HOW TO PLAY" — Anton 44px
- **Subhead:** "Everything you need to get started — three steps and you're in." — Inter 15px, mid
- **Steps:** 3-column flex layout, gap 32px

| Step | Title | Description |
|------|-------|-------------|
| 01 | PICK YOUR CHALLENGE | Each page has a category, difficulty level, and a set of questions ready to go. Flip to whatever catches your eye. |
| 02 | ANSWER UP | Write your guesses on the lines provided — or just keep them in your head. No peeking until you're done. |
| 03 | SCAN & SCORE | Point your phone at the QR code. The answer key loads instantly. Check your work and tally your score. |

- Number blocks: 56×56px, ink bg, Anton 28px
- Connector lines between steps 1→2 and 2→3 (2px, ink, 15% opacity)
- Titles: Plex Mono 13px bold, 0.15em tracking
- Descriptions: Inter 15px, mid color

### 4. Always Up to Date (dark — ink background)
- **Layout:** Phone scan illustration (160px wide SVG) + text, flex row, 60px gap
- **Eyebrow:** "ALWAYS UP TO DATE" — red
- **Headline:** "ANSWERS THAT STAY CURRENT" — Anton 36px
- **Copy:** "Answer keys live online, so they're never out of date. Rosters change, records break, stats update — your answers stay current. Just scan and check." — Inter 17px, cream-dark, max-width 520px
- **Illustration:** Phone outline with QR code, red viewfinder corners, red checkmark circle, scan beam line

### 5. Play Your Way (cream background)
- **Eyebrow:** "PLAY YOUR WAY"
- **H2:** "SOLO OR WITH FRIENDS" — Anton 44px
- **Layout:** Two equal cards, flex row, gap 32px

#### Solo Card (light)
- Border: 2.5px solid ink
- Padding: 36px 32px
- Icon: Circle (O) SVG, 32×32
- Title: "SOLO" — Anton 32px
- Copy: "Fill in your answers, scan the QR code to check, and keep a running score. Try to beat your best next time around."
- Bullets (red squares): Write answers in the book · Scan QR to check · Track your score over time

#### With a Friend Card (dark — ink background)
- Same dimensions, inverted colors
- Icon: X SVG, 32×32, cream stroke
- Title: "WITH A FRIEND" — Anton 32px
- Copy: "One person scans the QR code and holds the answers. Read the questions aloud, give hints if they're stuck, and keep score."
- Bullets: One person holds the answers · Read questions aloud · Give hints if they're stuck

### 6. Spice It Up (red background)
- **Eyebrow:** "MAKE IT INTERESTING" — 70% opacity
- **H2:** "SPICE IT UP" — Anton 52px, 48px bottom margin
- **Layout:** 3 equal cards, flex row, gap 28px
- **Card style:** rgba(0,0,0,0.2) background, 32px 28px padding

| Card | Title | Description |
|------|-------|-------------|
| 1 | SET A TIMER | 30 seconds per answer, or give yourself 5 minutes for the whole page. Pressure makes it fun. |
| 2 | BET THE ROUND | Loser buys the next round of drinks. Simple stakes, maximum motivation. |
| 3 | SET A LINE | Call your number before you start: "I'm hitting 18 out of 25." Over or under? |

- Titles: Anton 28px
- Copy: Inter 15px, 85% opacity

### 7. CTA Footer (dark — ink background)
- **Centered layout**, 60px vertical padding
- **Headline:** "READY TO PLAY?" — Anton 48px
- **Copy:** "Pick up your copy of Do You Know Ball? and put your pro football knowledge to the test." — Inter 17px, cream-dark, max-width 480px
- **Buttons:**
  - Primary: "GET THE BOOK" — red bg, white text, Anton 20px, 16px 40px padding
  - Secondary: "LEARN MORE" — cream border/text outline, Anton 20px, 16px 40px padding
- **Brand mark:** "(DYKB) TRIVIA · Pro Football Edition" — 50% opacity

---

## Layout Notes
- Max content width: 960px (centered, 40px horizontal padding)
- All section padding: 60–80px vertical
- Full-bleed color sections: hero (ink), sell banner (red), QR section (ink), spice it up (red), CTA (ink)
- Cream sections: steps, play your way

## Responsive Notes (not yet implemented)
- At <768px: stack 3-column steps vertically, stack solo/friend cards, stack spice-it-up cards
- At <480px: reduce headline sizes ~60%, reduce section padding to 40px

## Assets Needed for Production
- [ ] Real QR code image (replace SVG placeholder)
- [ ] Product photo or book mockup for hero (optional)
- [ ] Buy link URL for "GET THE BOOK" button
- [ ] "LEARN MORE" destination URL
- [ ] Hover/active states for buttons (red-dark for primary, cream bg for secondary)
