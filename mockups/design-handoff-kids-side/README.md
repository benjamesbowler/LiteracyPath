# Handoff: Kids Side Redesign (LiteracyPath child area)

## Overview

A full redesign of the child-facing side of LiteracyPath — the area where a 5–7 year old
plays educational arcade games, visits their Hollow, reads books, plays Story Quests,
walks the Adventure Map, and progresses through the long-form pixel phonics game
**Sound Seekers** (presented in this design as *The Sound Trail*).

The redesign has two goals:

1. **A clean, logical flow.** The old home page offered a daily-mission strip, a
   "recommended" hero, two secondary cards and a collapsed "more to explore" drawer,
   all competing for attention, behind a text-labelled left nav rail that a pre-reader
   cannot use. The redesign replaces this with **one unmistakable next action**, a
   three-stop daily loop, and a six-doorway "go anywhere" grid, over a **five-tab
   bottom bar** sized for tablet thumbs.
2. **An appealing, calm-but-playful look.** A "liquid glass" system — frosted
   translucent panels with hairline light borders over a warm ambient gradient — so
   the shell recedes and the illustrated worlds and game art carry the colour.

Seven screens are covered: Home, Sound Trail (Sound Seekers), Adventure Map, Books,
Story Quests, Arcade, My Hollow, plus a Celebration overlay.

## About the Design Files

The files in this bundle are **design references created in HTML**. They are prototypes
that demonstrate the intended look, layout, and behaviour — **they are not production
code to lift directly**.

The task is to **recreate these designs inside the LiteracyPath codebase's existing
environment** (React 18 + Vite, plain CSS files under `src/styles/`, components under
`src/components/`), using its established patterns:

- Follow the existing component conventions (function components, hooks, no TS).
- Put styles in a stylesheet under `src/styles/` (e.g. `kids-glass.css`) in the same
  spirit as the current `home-sage.css`, rather than the inline styles used in the
  prototype. The prototype inlines everything only because it must render standalone.
- Reuse the existing routing/navigation and student-state plumbing
  (`studentRailPolicy.js` and friends) — the tab bar below is a **replacement for the
  rail**, so that policy module needs a corresponding revision, not a bypass.
- Reuse existing audio/TTS services for the "hear this" speaker buttons.

The prototype is a single Design Component with an internal `screen` state variable
standing in for real routing. In the app, each screen should be its own route/component.

## Fidelity

**High fidelity.** Colours, typography, spacing, radii, blur values, and interaction
states below are final and exact. Recreate the UI pixel-perfectly, substituting the
codebase's own primitives where equivalents already exist.

Two caveats:

- The design targets **iPad landscape at 1194 × 834 CSS px** (the canvas is fixed at
  that size). This is the primary classroom device. Desktop/other sizes are out of
  scope for this pass — see *Responsive behaviour*.
- All numeric content (star counts, coin balance, page numbers, progress) is
  **placeholder data**. Wire it to real student state.

---

## Design Tokens

### Colour — ink & surface

| Token | Hex | Use |
|---|---|---|
| Ink primary | `#16302A` | Body text, headings on light glass |
| Ink deep green | `#20423A` | Icon strokes, secondary button text |
| Ink mid green | `#2B4A40` | Inactive tab label/icon |
| Ink muted | `#5C6E66` | Sub-labels, captions, secondary copy |
| Ink disabled | `#8FA396` | Locked item titles |
| Ink disabled soft | `#A8B3AC` | Locked item captions, locked numerals |
| Ink on accent | `#1B2E12` | Text/icons on the amber accent glass |
| Canvas base | `#F7F4EC` | Root background beneath the gradient |
| Page background (outside canvas) | `#E9EFE8` | `body` background |

### Colour — ambient background

The root canvas paints a single decorative layer (`z-index: 0`, `aria-hidden`):

```css
background:
  radial-gradient(680px 500px at 12% -6%,  rgba(143,205,180,.55), transparent 62%),
  radial-gradient(720px 520px at 96%  8%,  rgba(255,214,150,.50), transparent 64%),
  radial-gradient(760px 620px at 62% 108%, rgba(163,203,232,.46), transparent 62%),
  linear-gradient(170deg, #FBF7EF, #EFF3EA);
```

### Colour — accent & semantic

| Token | Hex | Use |
|---|---|---|
| Accent amber (default) | `#F2B33D` | Primary action, "next" markers, stars |
| Accent alternates | `#E2725B`, `#8EC9E8`, `#5FA052` | Themeable accent (prop) |
| Coin outer | `#F0A93C` | Coin icon ring |
| Coin inner | `#FFCE5C` | Coin icon centre |
| Success green | `#6FB35F` / `rgba(111,179,95,.9)` | Completed stops, progress fill |
| Progress gradient | `linear-gradient(90deg, #6FB35F, #4E9A6E)` | Reading progress bar |
| Terracotta | `#E2725B` / `rgba(226,114,91,.9)` | Trail milestone ("Lantern Camp") |
| Amber ink | `#8A7038` | "STARS" caption |
| Terracotta ink | `#A05B3E` | "TO SPEND" caption, eyebrow labels |
| Brown ink | `#7A5320` | "Next world" badge text |
| Dark scrim | `rgba(18,44,38, .34→.72)` | Over illustrations, behind white text |
| World dot — Meadow | `#6FB35F` | Arcade world filter |
| World dot — Dino | `#D98841` | Arcade world filter |
| World dot — Moonwood | `#5E4D9C` | Arcade world filter |

### Colour — card tints (home doorways)

| Doorway | Tint |
|---|---|
| Adventure Map | `rgba(191,227,216,.70)` |
| Books | `rgba(255,246,222,.75)` |
| Story Quests | `rgba(255,239,228,.75)` |
| Arcade | `rgba(232,227,245,.75)` |
| Letters | `rgba(241,247,240,.80)` |
| My Hollow | `rgba(255,239,228,.75)` |

### The liquid-glass recipe

This is the single most important visual rule. **Three tiers**, all with hairline
light borders and soft *diffuse* shadows — never hard offset shadows, never ink
outlines.

**Tier 1 — chrome (header, tab bar).** Sits on the ambient gradient.

```css
background: rgba(255,255,255,.50);
backdrop-filter: blur(26px) saturate(1.5);   /* tab bar: blur(28px) */
border-bottom: 1px solid rgba(255,255,255,.70);   /* top bar: border-top */
box-shadow: 0 1px 24px -10px rgba(30,60,50,.28);
```

**Tier 2 — panels & cards.** The workhorse.

```css
background: rgba(255,255,255,.50);            /* range .40–.56 by prominence */
backdrop-filter: blur(20px) saturate(1.4);    /* range 20–26px */
border: 1px solid rgba(255,255,255,.82);      /* range .72–.85 */
box-shadow: 0 14px 30px -24px rgba(30,60,50,.55),
            inset 0 1px 1px rgba(255,255,255,.90);
```

The `inset` highlight is what sells the glass — keep it. The outer shadow uses a
large negative spread so it reads as ambient occlusion, not a drop shadow.

**Tier 3 — dark glass.** Only over illustrations, so white text has contrast.

```css
background: rgba(18,44,38,.50);   /* .50–.62 */
backdrop-filter: blur(18px) saturate(1.4);
border: 1px solid rgba(255,255,255,.42);
```

**Accent glass** (primary buttons), where `accent` is the accent hex:

```css
background: linear-gradient(150deg, rgba(accent,.94), rgba(accent,.72));
backdrop-filter: blur(14px) saturate(1.6);
border: 1px solid rgba(255,255,255,.70);
box-shadow: 0 14px 28px -16px rgba(30,60,50,.60),
            inset 0 1px 2px rgba(255,255,255,.80);
color: #1B2E12;
```

**Active tab / hero panels** (dark accent glass):

```css
background: linear-gradient(150deg, rgba(46,75,62,.94), rgba(62,119,107,.86));
border: 1px solid rgba(255,255,255,.40);
box-shadow: 0 14px 26px -14px rgba(20,45,38,.60),
            inset 0 1px 2px rgba(255,255,255,.40);
```

> **Contrast rule.** Never place white text on light glass over an illustration.
> Any panel over artwork gets a dark scrim
> (`linear-gradient(180deg, rgba(18,44,38,.34), rgba(18,44,38,.50))`) and its overlays
> use Tier 3 dark glass. This removes the need for `text-shadow` entirely — if you
> find yourself reaching for text-shadow, the scrim is missing.

### Typography

Two families, loaded from Google Fonts:

- **Baloo 2** (500/600/700) — all headings, numerals, button labels, card titles.
  Rounded and friendly; this is the child-facing voice.
- **Nunito** (500/600/700/800) — body copy, captions, sub-labels, eyebrows.

| Role | Family | Size | Weight | Line-height |
|---|---|---|---|---|
| Hero title (Home) | Baloo 2 | 44px | 700 | 1.02 |
| Celebration title | Baloo 2 | 40px | 700 | 1.05 |
| Screen title (h1) | Baloo 2 | 33px | 700 | default |
| Hero subtitle | Nunito | 18px | 700 | default |
| Section heading (h2) | Baloo 2 | 20–22px | 700 | default |
| Panel heading | Baloo 2 | 26–28px | 700 | default |
| Big button label | Baloo 2 | 22–27px | 700 | 1 |
| Card title | Baloo 2 | 15.5–19px | 700 | 1.10–1.15 |
| Currency numeral | Baloo 2 | 23px | 700 | 1 |
| Body / description | Nunito | 15.5–16.5px | 600–700 | default |
| Caption / state | Nunito | 12.5–14.5px | 700–800 | default |
| Eyebrow (uppercase) | Nunito | 12px | 800 | `letter-spacing: .07em` |
| Currency caption | Nunito | 11.5px | 800 | `letter-spacing: .05em` |

Headings and body both use `text-wrap: pretty` where they can wrap.

### Spacing, radii, motion

- **Spacing scale (px):** 2, 4, 7, 9, 11, 13, 14, 16, 20, 22, 24. Screen padding is
  `14px 24px` (Home `16px 24px`); grid gaps 12–15px; panel padding 13–20px.
- **Radii (px):** 8 (swatch) · 11–14 (icon chip) · 14–15 (market button) ·
  16–18 (secondary button) · 20–22 (card, big button) · 22–24 (doorway) ·
  26–28 (panel, scene) · 30 (hero) · 34 (celebration modal) · 999 (pill).
- **Blur:** 14px (buttons) · 18–22px (cards) · 26–28px (chrome, large panels).
  Always paired with `saturate(1.3–1.6)`. Always ship the `-webkit-` prefix.
- **Motion:**
  - `bob` — 3.0–3.6s ease-in-out infinite, `translateY(0 → -6px → 0)`. Companion sprites.
  - `haloPulse` — 2.0–2.2s ease-out infinite, box-shadow spread `0 → 22px`, alpha `.5 → 0`. "Next" markers.
  - `popIn` — 340ms `cubic-bezier(.3,1.4,.6,1)`, scale `.9 → 1` + fade. Celebration modal.
  - **All animation is disabled under `prefers-reduced-motion: reduce`.**

> **Animation gotcha (cost us real debugging time):** `bob` sets `transform`, which
> **overrides any inline `transform` used for centring**. Never combine
> `transform: translate(-50%,-100%)` with an animated element. Split them: an outer
> positioned wrapper (use negative margins, not transform, to centre) and an inner
> animated `<img>`.

---

## Global Chrome

Present on every screen. Root is a fixed **1194 × 834** flex column,
`overflow: hidden`, `isolation: isolate`.

### Header — 78px tall, Tier 1 glass, `z-index: 5`

Layout: `display:flex; align-items:center; gap:12px; padding:0 22px`, with a
`flex:1` spacer after the profile button.

1. **Profile button** (left, navigates Home) — 54px circular glass avatar
   (`rgba(255,255,255,.72)`, 1px `rgba(255,255,255,.9)` border,
   `0 6px 16px -8px rgba(30,60,50,.4)` + inset highlight) holding a 48px companion
   image; beside it the child's name ("Aaron", Baloo 2 21/700) over
   "with {Pal}" (Nunito 13/700, `#5C6E66`).
2. **Star counter** (display only) — 48px-tall pill, `rgba(255,255,255,.56)`,
   star glyph + count (Baloo 2 23/700) + uppercase "STARS" caption in `#8A7038`.
3. **Coin counter** (button → My Hollow) — identical pill; coin glyph + count +
   "TO SPEND" caption in `#A05B3E`.
4. **Grown-ups button** — 48 × 48, radius 16, `rgba(255,255,255,.44)`, person icon
   stroked `#5C6E66` at 1.9.

**Only two currencies are ever shown**: stars (earned, per activity) and coins
(spendable). The prior build surfaced roughly eight numeric systems — flame/streak,
gems, XP, points and others. **Do not reintroduce them into the child UI.**

### Bottom tab bar — 92px tall, Tier 1 glass, `z-index: 5`

`display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; padding:0 20px`.
Each tab is a 68px-tall button, radius 20, icon (27px, `currentColor`, stroke 1.9,
round caps/joins) stacked over a Baloo 2 16.5/700 label with `gap: 2px`.

| Tab | Screen | Icon |
|---|---|---|
| Home | Home | house |
| Sounds | Sound Trail | speaker with waves |
| Books | Books | open book |
| Games | Arcade | arcade cabinet |
| Hollow | My Hollow | house/roof |

- **Active:** dark accent glass, `#FFFFFF` ink, `aria-current="page"`.
- **Inactive:** `rgba(255,255,255,.42)`, ink `#2B4A40`, border `rgba(255,255,255,.80)`,
  inset highlight only.
- **Active-tab mapping:** Story Quests highlights **Books**; Adventure Map highlights
  **Sounds**. Sub-screens must never leave the bar with nothing lit.

Five tabs across 1194px gives each a ~215px hit area — far above the 44px floor.
**44 × 44 is the hard minimum for every interactive element in the child area**
(design-system rule; the speaker buttons are exactly 44).

---

## Screens

### 1. Home

**Purpose:** answer "what do I do now?" in under a second, while leaving every
destination one tap away.

**Layout:** `padding: 16px 24px`, vertical grid, `gap: 13px`, rows
`232px auto minmax(0,1fr)` (when the daily stops strip is on) or
`300px minmax(0,1fr)` (off).

**a. Continue hero** — 232px, radius 30, `box-shadow: 0 22px 44px -22px rgba(20,45,38,.55)`.
Full-bleed `pals/meadow-panorama.webp` under a left-to-right scrim
(`linear-gradient(100deg, rgba(18,44,38,.72), rgba(18,44,38,.34) 52%, transparent)`).
Content grid `minmax(0,1fr) 250px`, padding `18px 22px`:

- Eyebrow pill "Carry on where you stopped" — dark-glass-on-image
  (`rgba(255,255,255,.24)`, blur 14, white text, uppercase, 12/800, `.07em`).
- `<h1>` "The Sound Trail" — Baloo 2 44/700, white.
- "Stop 12 — the Windy Bridge" — Nunito 18/700, `rgba(255,255,255,.86)`.
- **Play** — 66px tall accent-glass button, radius 22, Baloo 2 27/700, play triangle.
- **Hear this** — 66 × 66 companion button, `rgba(255,255,255,.26)`, speaker icon.
- `pals/meadow-point.webp` at 250 × 196, right-aligned, `bob` 3.4s.

**b. Today's three stops** — Tier 2 panel, radius 26, padding `13px 22px 15px`.
Header row: "Today's three stops" (Baloo 2 22/700) and "6 stars waiting"
(Nunito 14.5/800, `#3E776B`) with a star glyph.
Below, a 3-column grid with a dashed connector behind the markers
(`repeating-linear-gradient(90deg, rgba(62,119,107,.3) 0 10px, transparent 10px 22px)`,
4px tall, `top: 32px`, inset 17% each side).

Each stop is a 64px circular marker + two-line label:

| Stop | Marker | Label |
|---|---|---|
| Adventure Map | `rgba(111,179,95,.9)`, art at 30% under a green veil, white ✓ | "Done" |
| Read a book | white glass, full-opacity art, accent ring + `0 0 0 4px rgba(accent,.22)` | "Up next" |
| Play a game | white glass, art at 42%, no glow, ink `#5C6E66` | "After that" |

Three tasks, one clearly *next* — a checklist a child can read at a glance without
reading words.

**c. "Or go anywhere you like"** — heading (Baloo 2 22/700) with a 44px speaker
button, then a 6-column equal grid, `gap: 13px`, filling remaining height. Each
doorway is a Tier 2 card, radius 24, grid `minmax(0,1fr) auto`: full-bleed art with a
top sheen (`linear-gradient(180deg, rgba(255,255,255,.12), transparent 40%)`), then a
footer with a 32px tinted icon chip, title (Baloo 2 17/700) and note (Nunito 12/700).

| Doorway | Note | Art |
|---|---|---|
| Adventure Map | Win stars | `home/adventure-map.webp` |
| Books | Real books | `home/reading-library.webp` |
| Story Quests | You choose | `home/story-quests.webp` |
| Arcade | 12 games | `home/arcade.webp` |
| Letters | Sounds & writing | `home/phonics.webp` |
| My Hollow | Make it yours | `home/my-hollow.webp` |

Notes hide entirely when `doorLabels === "Icons only"`.

**Reading level:** every destination is carried by art + icon + a short high-frequency
label, and every screen has a speaker button. A child who cannot read still navigates
by picture.

### 2. Sound Trail (Sound Seekers)

**Purpose:** the long game — show how far you've come and exactly what's next.

Rows `auto minmax(0,1fr) auto`, `padding: 14px 24px`, `gap: 13px`.

- **Header:** "The Sound Trail" (33/700) + "You are 12 stops in. Two more to reach the
  Lantern Camp."; right-aligned glass pill with `hollow/beastie-ember-fox-s2.webp`
  (30px) and "Ember Fox · stage 2".
- **Trail scene:** radius 28, `pals/meadow-panorama.webp`, scrim
  `linear-gradient(180deg, rgba(18,44,38,.10), rgba(18,44,38,.42))`.
  Ten nodes on a percentage-positioned SVG polyline
  (`rgba(255,255,255,.72)`, 2.5px, dashed `4 6`, `vector-effect: non-scaling-stroke`):

  | State | Size | Fill | Content |
  |---|---|---|---|
  | done (×5) | 38px | `rgba(111,179,95,.9)` | ✓ |
  | next (×1) | 58px | `rgba(accent,.92)` | — (`haloPulse`) |
  | locked (×3) | 34px | `rgba(255,255,255,.26)` | — |
  | camp (×1) | 46px | `rgba(226,114,91,.9)` | ★ |

  Node coordinates (x%, y%): 6/68, 15/52, 24/66, 33/46, 42/60, **51/42 (next)**,
  61/58, 70/40, **80/54 (camp)**, 91/38. Labelled nodes get a dark-glass pill
  centred `size/2 + 11px` below. The Ember Fox sprite (80px) stands **above** the
  next node — wrapper at `left:51%; top:calc(42% - 32px)`, `margin:-80px 0 0 -40px`,
  animation on the inner img (see the animation gotcha).
- **Next-stop panel** (left, 1.35fr): eyebrow "NEXT STOP", "The Windy Bridge" (26/700),
  a one-line instruction naming the target graphemes, a 60px accent **Go** button and a
  60px speaker button. *In the prototype, **Go** opens the Celebration overlay so the
  reward moment can be reviewed — in production it launches the level.*
- **Sounds you own** (right, 1fr): wrapping chips, min 44 × 44, radius 14 —
  13 mastered (green, white ink), the current focus `sh` (accent glass, `0 0 0 3px`
  accent halo), the rest pale (`rgba(255,255,255,.42)`, ink `#8FA396`).

### 3. Adventure Map

Rows `auto minmax(0,1fr) auto`.

- Title "Adventure Map" + "Walk the Meadow. Your pal is waiting at the Apple Orchard."
- **Map scene:** radius 28, `pals/meadow-map-wide.webp`, **scrim
  `linear-gradient(180deg, rgba(18,44,38,.34), rgba(18,44,38,.50))`** — required, the
  artwork is bright and all overlay text is white. Seven stops on a dotted white
  polyline (6px, `dasharray 1 12`): 11/64, 24/44, 37/68, **50/46 (next)**, 64/70,
  77/44, 89/64. Done = 46px green ✓; next = 64px accent, numeral `#1B2E12`,
  `haloPulse`; locked = 46px **dark glass `rgba(18,44,38,.55)`** with a white numeral.
  Labels are dark-glass pills (`rgba(18,44,38,.62)`), 44px below. Companion sprite
  (74px) above the next stop, same wrapper technique.
  Top-left: dark-glass world badge with `pals/meadow-emblem.webp` — "Meadow — part 1 of 3".
- **Four stop cards** below, grid `42px minmax(0,1fr)`, radius 22: Duck Pond (✓, 3 of 3
  stars), Windy Hill (✓, 2 of 3), **Apple Orchard** (accent chip "4", "Your pal is here",
  tinted `rgba(255,250,236,.62)`), Old Barn ("5", "Locked", faded to
  `rgba(255,255,255,.34)` with `#8FA396` ink).

### 4. Books

Rows `auto auto minmax(0,1fr)`.

- Title "Books" with a right-aligned **Story Quests →** glass button (50px, radius 18).
- **Continue panel** — radius 28, grid `190px minmax(0,1fr)`, gap 20. Cover
  `books/a28.png` at 190 × 130, radius 16. Eyebrow "YOU STOPPED HERE", "The Rain Cycle"
  (28/700), a 250 × 10 progress track (`rgba(62,119,107,.16)`, radius 999) filled 42%
  with the green gradient, "Page 5 of 12" (14.5/800), a 58px accent **Keep reading**
  button and a 58px "Read it to me" speaker button.
- **Two shelves**, equal-height rows, each a heading row (22px tinted swatch + title +
  note) over a 4-column grid. Cards are horizontal: 66 × 50 cover, title
  (Baloo 2 16/700), and a star-count pill on the right.

  - *Just right for you* (Level A, green swatch): The Rain Cycle (1★),
    Explore Our World (0), Tree Homes (0), A Seed Grows (0)
  - *Read it again* (Books you finished, blue swatch): Day and Night (3★),
    Busy Bees (3★), Sunlight and Shadows (2★), Be a Book Buddy (3★)

  Titles are the real titles printed on the supplied cover art — keep title and cover
  paired when wiring real data.

### 5. Story Quests

Reached from Books (or the Home doorway); the Books tab stays lit and a back chevron
returns to Books.

Title row: 50px back button, "Story Quests" (33/700), and a pill
"You choose what happens" (`rgba(255,241,232,.7)`, ink `#A05B3E`).

3 × 2 grid of cards, radius 24, `gap: 15px`; art fills the top with a badge pill at
`left:10px; bottom:10px`, footer holds title (19/700) + note (13.5/700).

| Card | Note | Badge |
|---|---|---|
| Muddy and Splashy Make a Mess | You are on page 3 | **Carry on** (accent glass) |
| Splashy Finds a Puddle | 4 endings | New (`rgba(191,227,216,.8)`) |
| Tiny and Brave Go on an Adventure | 3 endings | New |
| Bouncy and Speedy Have a Race | Finished ✓ | Done (white glass, `#5C6E66`) |
| Chompy's Big Lunch | Dino Pals | Next world (`rgba(245,231,208,.85)`, `#7A5320`) |
| Sunny's Rainy Day | Dino Pals | Next world |

### 6. Arcade

Rows `auto auto minmax(0,1fr)`.

- Title "Arcade" + "Twelve games. Every one of them earns stars."
- **World filter** (right): a 5px-padded glass tray, radius 18, holding three 44px
  segmented buttons — Meadow / Dino / Moonwood, each with a 13px colour dot. Active =
  dark accent glass + white; inactive = transparent.
- **Featured panel** — the one dark panel in the app
  (`linear-gradient(120deg, rgba(46,75,62,.9), rgba(62,119,107,.78))`), radius 28,
  grid `200px minmax(0,1fr)`. Art `games/rhyme-pop.webp` (200 × 122, radius 16);
  eyebrow "{PAL} PICKED THIS FOR YOU" in `#F5C979`; "Rhyme Pop" (27/700, white);
  a one-line rationale that ties the pick to the child's current graphemes; a 54px
  accent **Play** button; a "2 of 3 stars" chip.
  This is the only "recommendation" surface — it explains *why*, and it never competes
  with the Home hero because it lives one level down.
- **Game grid** — 6 × 2, radius 20, art on top, footer with title (15.5/700) and a
  3-star row (14px glyphs; earned `#F2B33D`, unearned `rgba(62,119,107,.2)`).
  Twelve games: Rhyme Pop (2★), Pop the Word (3), Rocket Run (1), Letter Leap (3),
  Word Bridge (0), Sound Safari (2), Sound Beat (0), Reel Read (1), Sentence Express (0),
  Letter Garden (3), Word Hopscotch (2), CVC Train (0).

### 7. My Hollow

Rows `auto minmax(0,1fr) auto`.

- Title "My Hollow" + "Your place. Spend coins here to make it yours."
- **Hollow scene** — radius 28, `hollow/interior.webp`, with six placed decorations
  positioned by percentage and centred with `translate(-50%,-50%)`, each carrying
  `drop-shadow(0 10px 14px rgba(0,0,0,.4))`:
  story shelf 14/42 (146px), mushroom stool 34/70 (104px), glow jar 60/32 (84px),
  star banner 79/20 (134px), star owl 51/60 (116px, `bob` 3.6s), gold egg 71/72 (72px).
  A dashed "empty spot" placeholder sits at 16/78 (100 × 84, radius 20, dashed
  `rgba(255,255,255,.7)`) — the invitation to buy more.
  Bottom-right: **Move things** button (52px, dark glass over art).
- **The Market** — merchant portrait (46px) + "The Market" + "Four new things today",
  then a 4-column grid. Each item: 70px art beside a title and a **min 44px** price
  button showing the coin glyph + cost. Meadow Crown 30, Leaf Cloak 45, Trail Boots 25
  (all affordable → accent glass); Wizard Hat 120 (unaffordable → pale glass,
  `#A8B3AC` ink).
  Coins are earned by working and spent here — the loop closes visibly, which is what
  the old build lacked.

### 8. Celebration overlay

Triggered on activity completion (prototype: the Sound Trail **Go** button).

Full-canvas `rgba(22,48,42,.42)` + `blur(10px)` backdrop, `z-index: 20`,
`role="dialog" aria-label="Well done"`. Card: 580px wide, radius 34,
`rgba(255,255,255,.62)` + `blur(34px) saturate(1.6)`,
`box-shadow: 0 34px 70px -30px rgba(20,45,38,.7)` + inset highlight, `popIn` entrance.

Contents: 30 static confetti chips (clipped, 45% opacity, five brand colours);
`phinny/celebrating.png` at 152px with `bob`; "You did it!" (Baloo 2 40/700);
"The Windy Bridge is crossed."; two reward chips — **+2 stars**
(`rgba(255,246,222,.8)`) and **+8 coins** (`rgba(255,239,228,.8)`), both Baloo 2 23/700;
then two 64px actions: **Next stop** (accent glass → returns to the trail) and
**Spend my coins** (white glass → jumps to My Hollow).

That second button is deliberate: it converts a reward into a reason to visit the
Hollow, tying earning to spending in one tap.

---

## Interactions & Behaviour

- **Navigation:** five bottom tabs; six Home doorways; coin counter → Hollow; profile →
  Home; Books ⇄ Story Quests. Every tap is instant — no transitions between screens.
- **Hover/active:** the prototype ships no hover treatment; it is a touch design. If
  you add one for desktop, lift `background` alpha by ~.08 and keep geometry static.
  Add a visible focus ring for keyboard/switch access — the prototype does not include
  one and it is required for the a11y pass.
- **Speaker buttons:** present on Home (heading + hero), Sound Trail, and Books.
  Wire to the existing TTS/audio service; they must read the adjacent copy aloud.
- **Loading/error/empty states:** not designed. Follow existing app patterns; the
  dashed "empty spot" in the Hollow is the one designed empty affordance.
- **Responsive:** the canvas is fixed at 1194 × 834. For other viewports, scale the
  whole stage to fit rather than reflowing. A true phone layout is a separate exercise.
- **Reduced motion:** all animation removed; nothing else changes.

## State Management

Prototype state (replace with routing + real student data):

| State | Values | Notes |
|---|---|---|
| `screen` | home / sounds / map / books / stories / games / hollow | → routes |
| `world` | meadow / dino / moonwood | Arcade filter (currently visual only) |
| `celebrating` | boolean | Celebration overlay |

Real data the screens need: child name and companion; star and coin balances; current
Sound Trail stop + node states; owned/current graphemes; daily-loop task states; book
progress (current book, page, per-book stars); story quest progress; per-game star
counts; Hollow placements; market catalogue with prices and affordability;
per-activity reward amounts.

Prototype props, exposed as tweaks — treat as configuration, not shipped features:
`startScreen`, `companion` (Pip/Muddy/Chompy), `doorLabels` (Words and icons / Icons
only), `showDailyStops` (bool), `accent` (colour).

## Assets

All art is copied from the LiteracyPath repo (`public/images/...`) into `assets/` in
this bundle, so the prototype runs offline. **Use the repo originals** rather than
these copies.

- `assets/home/` — 8 doorway/card illustrations
- `assets/games/` — 12 game tiles
- `assets/books/` — 10 book covers (a26–a30, b31–b33, c37–c38)
- `assets/stories/` — 7 story quest illustrations
- `assets/hollow/` — interior, 4 decorations, 2 beasties, gold egg, 4 gear items, merchant, meadow scene
- `assets/pals/` — meadow panorama, wide map, point/cheer poses, emblem, dino cheer
- `assets/companions/` — Pip, Muddy, Chompy
- `assets/phinny/` — celebrating, cheering, thinking, waving
- `assets/brand/` — logo, mark

Icons are inline SVG paths defined in the prototype's logic (`ICONS`), stroked with
`currentColor`. No icon library is required.

Fonts: **Baloo 2** and **Nunito** from Google Fonts. Self-host them in production.

## Files

- `Kids Side Redesign.dc.html` — the redesign. All seven screens plus the celebration
  overlay, with an internal screen switcher. **This is the reference to build from.**
- `Current Kids Home (recreation).dc.html` — a faithful recreation of the *existing*
  home page, for before/after comparison. Not a build target.
- `support.js` — runtime for the two HTML files. Not part of the design; do not port.
- `assets/` — all imagery referenced above.

Open either HTML file directly in a browser. In the redesign, use the bottom tabs and
the Home doorways to reach every screen; press **Go** on the Sound Trail to see the
celebration moment.
