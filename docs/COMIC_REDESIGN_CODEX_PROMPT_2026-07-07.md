# CODEX/OPUS PROMPT — Comic-Book Redesign (Mockup Fidelity Pass)

> Paste everything in this file into Codex/Opus as one prompt. It was written against the
> real codebase on 2026-07-07: every file path and CSS class named below was verified to exist.

---

## ROLE & MISSION

You are the implementing engineer for **Literacy Guide** (repo folder `LiteracyPath`, a Vite + React app).
Restyle the five child-facing screens to match a set of comic-book/pop-art mockups with **exact fidelity**:

1. **Student Home** — `src/components/StudentHomePage.jsx`
2. **Daily Challenge strip** (lives on Home) — `student-mission-*` classes
3. **EL Map Quests** — `src/components/elQuest/ElSkillsQuest.jsx`
4. **Story Quests picker** — `src/components/LearnAreaPage.jsx`
5. **Reading Library** — `src/components/guided-reading/GuidedReadingPage.jsx`

The target look (from the mockups): cream paper background with faint halftone dots; every card is a
**panel** with a thick near-black border and a **hard offset shadow** (no blur); headers are heavy
condensed uppercase **slanted display type** on rotated "sticker" slabs; small labels are chunky
rounded uppercase pills; saturated flat primaries (yellow/red/blue/green/purple/teal/orange); gold
outlined stars; yellow arrow CTA buttons; the Arcade panel alone is "night mode" (near-black with a
neon pink→cyan border). The app already has a proto version of this in `src/styles/student-vibrant.css`
(3px `#172033` borders, hard shadows) — you are **upgrading it to full mockup fidelity**, not starting from zero.

### Operating rules (non-negotiable)

- **Read `AGENTS.md` at the repo root first** and follow the Operating Manual it describes.
- **Cardinal rule: never claim success without a passing check you can name.** Work in a loop:
  inspect → smallest correct change → run ALL checks → read results honestly → repeat until green.
- **Branding:** visible text must NEVER say "Literacy Path" or "LiteracyPath". The live product is
  **"Literacy Guide"**. The mockups show a "LITERACY PATH" logo — do **not** copy that text.
  Internal code identifiers keep the old name; only rendered text is affected.
- **CSS-first.** All restyling goes into ONE new file, `src/styles/comic-theme.css`, loaded last.
  JSX edits are limited to the surgical diffs listed in each work order. Do not rename or remove any
  existing class. Do not edit `lg-design-system.css`, `pal-worlds.css`, or game logic/data files.
- **Scope to student mode.** The root container gets `student-mode-app` when a student is signed in
  (`src/App.jsx` ~line 7777). Prefix every new rule with `.student-mode-app` (Guided Reading also
  renders for teachers — there, scope with `.student-guided-reading-page`).
- **Readability is sacred.** Comic display type (`Anton`) is for chrome/headers/labels ONLY. Book
  text, story text, questions, and any sentence a child reads stay on the existing readable fonts
  (Lexend/Nunito). Body text contrast must stay WCAG AA (≥4.5:1). Keep all `prefers-reduced-motion`
  blocks working; keep tap targets ≥44px; keep visible `:focus-visible` outlines.
- **Do not fabricate data.** The mockups show "points", "Level 7 Reader", "XP". The app has: gems,
  streak, next-reward progress (`computeTreasury`), and daily-mission done-state. Style what exists;
  invent nothing.

### The check gate ("done" means this is green)

```bash
npm run lint && npm test && npm run build && npx playwright test tests/smoke
```

Plus the per-screen visual acceptance checklists below, verified by eye at 1280×800 (`npm run dev`).
If a check is red, it is yours until you prove it pre-existed on `main`.

---

## PHASE 0 — Foundation (fonts + theme file)

### 0.1 Add the display font (Anton) to `index.html`

Both font `<link>` lines (the `media="print"` one on line 8 and the `<noscript>` copy on line 9)
currently begin with:

```
https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Inter:...
```

In **both** lines, add Anton by replacing `family=Fredoka` with `family=Anton&family=Fredoka`
(keep everything else identical, preserving the non-render-blocking pattern).

### 0.2 Create `src/styles/comic-theme.css` and load it last

In `src/main.jsx`, immediately after the existing line `import './styles/student-vibrant.css'`, add:

```js
// Comic-book mockup-fidelity layer. MUST stay after student-vibrant.css so it wins the cascade.
import './styles/comic-theme.css'
```

Create `src/styles/comic-theme.css` starting with exactly this foundation
(then append the per-screen sections from the work orders):

```css
/* ============================================================================
   COMIC THEME — pop/comic-book reskin (mockup fidelity, 2026-07)
   Loaded LAST in main.jsx. Chrome/headers only; reading text stays readable.
   All rules scoped to .student-mode-app (or .student-guided-reading-page).
   ============================================================================ */

:root {
  /* Ink & paper */
  --comic-ink: #12141f;
  --comic-ink-soft: #2a2d3d;
  --comic-paper: #faf6ec;
  --comic-dot: rgba(18, 20, 31, 0.08);
  --comic-white: #ffffff;

  /* Pops (sampled from the mockups) */
  --comic-yellow: #ffc917;
  --comic-yellow-deep: #f0a800;
  --comic-red: #e03a2a;
  --comic-red-deep: #b52a1d;
  --comic-blue: #1c5be0;
  --comic-blue-deep: #123f9e;
  --comic-green: #2fa341;
  --comic-green-deep: #1f7a2e;
  --comic-purple: #6c34c9;
  --comic-teal: #0aa4a8;
  --comic-orange: #f28a1b;
  --comic-magenta: #e8368f;
  --comic-cyan: #23c4de;
  --comic-success: #25c76f;
  --comic-star: #ffc400;
  --comic-gem: #8b3de8;

  /* Arcade night mode */
  --comic-night: #0c0d16;
  --comic-night-2: #181a33;

  /* Type */
  --comic-display: "Anton", "Archivo Black", Impact, "Arial Black", sans-serif;
  --comic-label: "Nunito", "Fredoka", system-ui, sans-serif;

  /* Structure */
  --comic-bw: 3px;               /* standard border */
  --comic-bw-lg: 4px;            /* hero/sticker border */
  --comic-r-sm: 8px;
  --comic-r: 12px;
  --comic-r-lg: 16px;
  --comic-shadow-sm: 3px 3px 0 var(--comic-ink);
  --comic-shadow: 5px 5px 0 var(--comic-ink);
  --comic-shadow-lg: 7px 7px 0 var(--comic-ink);
}

/* ── Paper + halftone page background ──────────────────────────────────── */
.student-mode-app {
  background-color: var(--comic-paper);
  background-image: radial-gradient(var(--comic-dot) 1.3px, transparent 1.4px);
  background-size: 16px 16px;
}

/* ── Shared recipes ────────────────────────────────────────────────────── */
.student-mode-app .comic-panel {
  background: var(--comic-white);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: var(--comic-r);
  box-shadow: var(--comic-shadow);
}

/* Display type: heavy, condensed, uppercase, slanted like the mockups */
.student-mode-app .comic-display {
  font-family: var(--comic-display);
  font-style: italic;            /* Anton has no italic; synthetic oblique = mockup slant */
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.015em;
  line-height: 0.95;
}

/* Rotated sticker slab (e.g. the red "STORY QUESTS" header) */
.student-mode-app .comic-sticker {
  display: inline-block;
  padding: 10px 18px 12px;
  background: var(--comic-yellow);
  color: var(--comic-ink);
  border: var(--comic-bw-lg) solid var(--comic-ink);
  border-radius: 6px;
  box-shadow: var(--comic-shadow);
  transform: rotate(-2.5deg);
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
  line-height: 0.95;
}
.student-mode-app .comic-sticker--red    { background: var(--comic-red);    color: #fff; }
.student-mode-app .comic-sticker--blue   { background: var(--comic-blue);   color: #fff; }
.student-mode-app .comic-sticker--white  { background: var(--comic-white); }

/* Chunky uppercase label pill ("READ · DISCOVER · ADVENTURE") */
.student-mode-app .comic-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 4px;
  background: var(--comic-ink);
  color: #fff;
  border-radius: 6px;
  font-family: var(--comic-label);
  font-weight: 900;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Yellow arrow CTA (VIEW PROGRESS ➜ / OPEN BOOK ➜ / START QUEST ➜) */
.student-mode-app .comic-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 10px 22px;
  background: var(--comic-yellow);
  color: var(--comic-ink);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-display);
  font-style: italic;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
}
.student-mode-app .comic-btn::after { content: "➜"; font-style: normal; }
.student-mode-app .comic-btn:hover  { transform: translate(-1px, -2px); box-shadow: 6px 7px 0 var(--comic-ink); }
.student-mode-app .comic-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--comic-ink); }
.student-mode-app .comic-btn--red   { background: var(--comic-red);   color: #fff; }
.student-mode-app .comic-btn--blue  { background: var(--comic-blue);  color: #fff; }
.student-mode-app .comic-btn--green { background: var(--comic-green); color: #fff; }

/* Level chips (LEVEL A blue / B green / C red, like the library mockup) */
.student-mode-app .comic-level-chip {
  display: inline-block;
  padding: 2px 10px 3px;
  border: 2px solid var(--comic-ink);
  border-radius: 7px;
  box-shadow: 2px 2px 0 var(--comic-ink);
  color: #fff;
  font-family: var(--comic-label);
  font-weight: 900;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.student-mode-app .comic-level-chip--a { background: var(--comic-blue); }
.student-mode-app .comic-level-chip--b { background: var(--comic-green); }
.student-mode-app .comic-level-chip--c { background: var(--comic-red); }

/* Numbered circle badge (the ①②③ of the daily strip / map stops) */
.student-mode-app .comic-num {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  background: var(--comic-white);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 50%;
  font-family: var(--comic-label);
  font-weight: 900;
  font-size: 0.95rem;
  color: var(--comic-ink);
}

/* Ink-bordered progress bar with rounded fill */
.student-mode-app .comic-progress {
  height: 14px;
  background: #fff;
  border: 2px solid var(--comic-ink);
  border-radius: 999px;
  overflow: hidden;
}
.student-mode-app .comic-progress > span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--comic-success);
}

/* Outlined gold stars (★★☆) — apply to existing star spans */
.student-mode-app .comic-star-on,
.student-mode-app .comic-star-off {
  -webkit-text-stroke: 1.5px var(--comic-ink);
  font-size: 1.05rem;
}
.student-mode-app .comic-star-on  { color: var(--comic-star); }
.student-mode-app .comic-star-off { color: #fff; }

/* Comic wordmark (replaces the logo image — text says LITERACY GUIDE) */
.student-mode-app .comic-wordmark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
  line-height: 0.9;
  user-select: none;
}
.student-mode-app .comic-wordmark-star {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  background: var(--comic-yellow);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  transform: rotate(-8deg);
  font-style: normal;
  font-size: 1.3rem;
  color: var(--comic-ink);
}
.student-mode-app .comic-wordmark strong { color: var(--comic-ink); font-weight: 400; font-size: 1.15rem; display: block; }
.student-mode-app .comic-wordmark em {
  color: #fff;
  font-size: 1.15rem;
  background: var(--comic-blue);
  border: 2px solid var(--comic-ink);
  border-radius: 6px;
  padding: 1px 8px 2px;
  box-shadow: 2px 2px 0 var(--comic-ink);
}

/* Focus visibility on the new controls */
.student-mode-app .comic-btn:focus-visible,
.student-mode-app .student-home-card:focus-visible,
.student-mode-app .student-mission-tile:focus-visible {
  outline: 3px solid var(--comic-blue);
  outline-offset: 3px;
}

/* Reduced motion: kill the hover/active translations */
@media (prefers-reduced-motion: reduce) {
  .student-mode-app .comic-btn,
  .student-mode-app .comic-btn:hover,
  .student-mode-app .comic-btn:active { transition: none; transform: none; }
}
```

**Check 0:** `npm run lint` passes; `npm run dev` renders the cream halftone background on the
student home with nothing visually broken.

---

## WORK ORDER A — Student Home (mockup: 5-section comic dashboard)

**Files:** `src/components/StudentHomePage.jsx` + append to `comic-theme.css`.
Current grid lives in `src/styles/student-vibrant.css` (~line 1445, `.student-mode-app .student-home-board`)
— do NOT edit it there; override it from `comic-theme.css`.

**Target layout:** daily-challenge strip full-width on top; row 2 = two heroes side by side
(Phonics green, left; Arcade night-mode, right); row 3 = EL Map Quests (blue), Story Quests (red),
Reading Library (purple); full-width blue Points + Progress band at the bottom.

**Interpretation note (chosen, deliberate):** in the mockups the titles are painted inside the art.
Our real art must stay text-free, so each card = flat color panel, art image filling the **right ~52%**
behind a 3px ink divider, and the UI renders the big slanted title + label pills on the left.

### A.1 JSX diffs (surgical)

1. **Wordmark** — in `StudentHomePage.jsx` replace:
```jsx
<img className="student-home-logo pals-logo" src="/images/pals/literacy-pals-logo.webp" alt="Literacy Pals" />
```
with:
```jsx
<span className="comic-wordmark" role="img" aria-label="Literacy Guide">
  <span className="comic-wordmark-star" aria-hidden="true">★</span>
  <span><strong>Literacy</strong><em>Guide</em></span>
</span>
```
(Text reads "Literacy Guide" — never "Literacy Path".)

2. **Gems chip in the topbar** — inside `<header className="student-home-topbar">`, directly before
the streak span, add (uses the already-computed `treasury` and imported `Gem`):
```jsx
<span className="comic-topbar-gems" title="Gems collected">
  <Gem color="violet" size={18} />
  {treasury.gems}
</span>
```

3. **Arcade CTA** — add an optional `cta` prop to `StudentHomeCard` and render it after the tags:
```jsx
{cta && <span className="comic-card-cta" aria-hidden="true">{cta}</span>}
```
Pass `cta="Play now"` on the Arcade card only. (It's a `<span>`, not a nested button — the whole card
is already a button.)

4. **Arcade art** — if `public/images/learn-games/home/home-arcade.webp` exists (see the companion
image-prompt doc), point the Arcade card's `art` at it; otherwise keep `cvc-train.webp` (broken images
already hide via `hideOnError`).

### A.2 CSS — append to `comic-theme.css`

```css
/* ═══ A. STUDENT HOME ══════════════════════════════════════════════════ */
.student-mode-app .student-home-board {
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-template-rows: auto minmax(290px, auto) minmax(205px, auto) auto;
  grid-template-areas:
    "mission mission mission mission mission mission"
    "phonics phonics phonics arcade arcade arcade"
    "map map story story library library"
    "progress progress progress progress progress progress";
  gap: clamp(14px, 1.6vw, 22px);
}

/* Topbar: white band with ink rule + comic chips */
.student-mode-app .student-home-topbar {
  background: var(--comic-white);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: var(--comic-r);
  box-shadow: var(--comic-shadow-sm);
  padding: 10px 16px;
}
.student-mode-app .student-home-avatar {
  border: var(--comic-bw) solid var(--comic-ink);
  box-shadow: 2px 2px 0 var(--comic-ink);
}
.student-mode-app .student-home-topbar > div strong {
  background: var(--comic-blue);
  color: #fff;
  border: 2px solid var(--comic-ink);
  border-radius: 999px;
  box-shadow: 2px 2px 0 var(--comic-ink);
  padding: 2px 14px 3px;
  font-family: var(--comic-label);
  font-weight: 900;
}
.student-mode-app .comic-topbar-gems,
.student-mode-app .student-home-streak {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--comic-white);
  border: 2px solid var(--comic-ink);
  border-radius: 999px;
  box-shadow: 2px 2px 0 var(--comic-ink);
  padding: 3px 12px;
  font-family: var(--comic-label);
  font-weight: 900;
  color: var(--comic-ink);
}

/* Card shell: thick ink borders, hard offset shadow, flat color fields */
.student-mode-app .student-home-card {
  position: relative;
  border: var(--comic-bw-lg) solid var(--comic-ink);
  border-radius: var(--comic-r-lg);
  box-shadow: var(--comic-shadow-lg);
  overflow: hidden;
  text-align: left;
}
.student-mode-app .student-home-card:hover {
  transform: translate(-2px, -3px);
  box-shadow: 9px 10px 0 var(--comic-ink);
}
.student-mode-app .student-home-card-phonics { background: var(--comic-green); }
.student-mode-app .student-home-card-map     { background: var(--comic-blue); }
.student-mode-app .student-home-card-story   { background: var(--comic-red); }
.student-mode-app .student-home-card-library { background: var(--comic-purple); }

/* Art fills the right half behind an ink divider */
.student-mode-app .student-home-card-art {
  position: absolute;
  inset: 0 0 0 auto;
  width: 52%;
  border-left: var(--comic-bw) solid var(--comic-ink);
}
.student-mode-app .student-home-card-art img { width: 100%; height: 100%; object-fit: cover; }

/* Left column: big slanted title + black label bar + tag chips */
.student-mode-app .student-home-card-label {
  position: relative;
  z-index: 1;
  width: 48%;
  height: 100%;
  padding: clamp(12px, 1.6vw, 22px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
}
.student-mode-app .student-home-card-label strong {
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
  color: #fff;
  font-size: clamp(1.45rem, 2.6vw, 2.35rem);
  line-height: 0.92;
  text-shadow: 2.5px 2.5px 0 var(--comic-ink);
}
.student-mode-app .student-home-card-meta { display: none; } /* superseded by the big title */
.student-mode-app .student-home-card-subtitle {
  background: var(--comic-ink);
  color: #fff;
  border-radius: 6px;
  padding: 3px 10px 4px;
  font-family: var(--comic-label);
  font-weight: 900;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.student-mode-app .student-home-card-tags span {
  background: #fff;
  color: var(--comic-ink);
  border: 2px solid var(--comic-ink);
  border-radius: 999px;
  box-shadow: 2px 2px 0 var(--comic-ink);
  padding: 2px 10px;
  font-weight: 900;
  font-size: 0.72rem;
  text-transform: uppercase;
}

/* Arcade hero: night mode with neon gradient border + starfield */
.student-mode-app .student-home-card-arcade {
  border: var(--comic-bw-lg) solid transparent;
  background:
    radial-gradient(1.5px 1.5px at 18% 30%, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 72% 18%, #ffd84d 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 44% 74%, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 88% 62%, #23c4de 50%, transparent 51%),
    linear-gradient(var(--comic-night), var(--comic-night-2)) padding-box,
    linear-gradient(135deg, var(--comic-magenta), var(--comic-purple), var(--comic-cyan)) border-box;
}
.student-mode-app .student-home-card-arcade .student-home-card-art { border-left-color: rgba(255,255,255,0.25); }
.student-mode-app .student-home-card-arcade .student-home-card-subtitle { background: var(--comic-magenta); }
.student-mode-app .comic-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding: 8px 18px;
  background: var(--comic-yellow);
  color: var(--comic-ink);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
  font-size: 1rem;
}
.student-mode-app .comic-card-cta::after { content: "➜"; font-style: normal; }

/* Points + Progress band: royal blue, ink border, yellow CTA */
.student-mode-app .kid-den-banner.student-progress-banner {
  background: var(--comic-blue);
  border: var(--comic-bw-lg) solid var(--comic-ink);
  border-radius: var(--comic-r-lg);
  box-shadow: var(--comic-shadow-lg);
  color: #fff;
}
.student-mode-app .student-progress-banner .kid-gem-counter {
  background: #fff;
  color: var(--comic-ink);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-label);
  font-weight: 900;
}
.student-mode-app .student-progress-banner .kid-next-unlock-track {
  height: 14px;
  background: #fff;
  border: 2px solid var(--comic-ink);
  border-radius: 999px;
  overflow: hidden;
}
.student-mode-app .student-progress-banner .kid-next-unlock-track span { background: var(--comic-yellow); }
.student-mode-app .student-progress-banner .kid-den-button {
  background: var(--comic-yellow);
  color: var(--comic-ink);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
}

/* Home on narrow screens: stack heroes, then the trio */
@media (max-width: 900px) {
  .student-mode-app .student-home-board {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "mission mission"
      "phonics phonics"
      "arcade arcade"
      "map story"
      "library library"
      "progress progress";
  }
  .student-mode-app .student-home-card-art { position: relative; inset: auto; width: 100%; height: 140px; border-left: 0; border-top: var(--comic-bw) solid var(--comic-ink); }
  .student-mode-app .student-home-card-label { width: 100%; height: auto; }
}
```

**Acceptance (Home):** cream halftone page; white ink-bordered topbar with star wordmark reading
"Literacy Guide", blue name pill, gems + streak chips; yellow daily strip on top; green Phonics hero +
neon-bordered night Arcade hero with yellow "PLAY NOW ➜"; blue/red/purple trio beneath with slanted
white titles and black label bars; blue progress band with white gem counter, yellow progress fill and
yellow "Points / Progress" display button. No dead space, no overflow at 1280×800 and 375×812.

---

## WORK ORDER B — Daily Challenge strip (mockups: top strip + challenge cards)

**Files:** CSS only — the existing markup already has everything
(`.student-mission-banner`, `.student-mission-head`, `.student-board-kicker`, `.student-mission-tracker`,
`.student-mission-grid`, `.student-mission-tile` with art/copy/done-badge, `.student-mission-next-button`
in `StudentHomePage.jsx`). Numbers come from CSS counters — **zero JSX changes**.

```css
/* ═══ B. DAILY CHALLENGE STRIP ═════════════════════════════════════════ */
.student-mode-app .student-mission-banner {
  background: var(--comic-yellow);
  border: var(--comic-bw-lg) solid var(--comic-ink);
  border-radius: var(--comic-r-lg);
  box-shadow: var(--comic-shadow-lg);
}
/* "DAILY CHALLENGE" kicker becomes the rotated sticker slab */
.student-mode-app .student-mission-banner .student-board-kicker {
  display: inline-block;
  padding: 6px 14px 8px;
  background: var(--comic-red);
  color: #fff;
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 6px;
  box-shadow: var(--comic-shadow-sm);
  transform: rotate(-2.5deg);
  font-family: var(--comic-display);
  font-style: italic;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.student-mode-app .student-mission-head h1 {
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}

/* Task tiles: white panels with circled numbers ① ② ③ */
.student-mode-app .student-mission-grid { counter-reset: mission-step; }
.student-mode-app .student-mission-tile {
  position: relative;
  background: #fffdf4;
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: var(--comic-r);
  box-shadow: var(--comic-shadow-sm);
  padding-left: 44px;
}
.student-mode-app .student-mission-tile::before {
  counter-increment: mission-step;
  content: counter(mission-step);
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  background: #fff;
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 50%;
  font-family: var(--comic-label);
  font-weight: 900;
  color: var(--comic-ink);
}
.student-mode-app .student-mission-tile.done::before { background: var(--comic-success); color: #fff; content: "✓"; }
.student-mode-app .student-mission-art {
  border: 2px solid var(--comic-ink);
  border-radius: 10px;
  overflow: hidden;
}
.student-mode-app .student-mission-copy small {
  font-family: var(--comic-label);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--comic-ink);
}
.student-mode-app .student-mission-done-badge { background: var(--comic-success); border: 2px solid var(--comic-ink); }

/* Tracker + start button */
.student-mode-app .student-mission-tracker {
  background: #fff;
  border: var(--comic-bw) solid var(--comic-ink);
  box-shadow: var(--comic-shadow-sm);
}
.student-mode-app .student-mission-next-button {
  background: var(--comic-ink);
  color: #fff;
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
}
```

**Acceptance (strip):** yellow band with red rotated "Daily challenge" sticker; three white numbered
task tiles (①②③, ✓ turns the circle green); tracker pill white with ink border; strip matches the
mockups' top band at a glance.

---

## WORK ORDER C — EL Map Quests (mockup: island map + quest rail)

**Files:** CSS only, appended to `comic-theme.css`. Component: `src/components/elQuest/ElSkillsQuest.jsx`;
existing styles: `src/styles/skills-block-quest.css` (do not edit — override).
Verified hooks: `.skills-block-quest`, `.sbq-top` (+ `.compact`), `.sbq-kicker`, `.sbq-sub`,
`.sbq-mapwrap`, `.sbq-map-viewport`, `.sbq-route`, `.sbq-route-line`, `.sbq-stop-marker`,
`.sbq-stop-name`, `.sbq-station-step`, `.sbq-next-up`, `.sbq-primary-button`, `.sbq-ghost-button`,
`.sbq-progress-track`, `.sbq-world-tabs`.

⚠ **Known trap (already fixed once — do not regress):** a global `button:hover { transform: … }`
once clobbered the map markers' centering transform and made them jump. The fix lives at
`.sbq-mapboard .sbq-stop { transform: translate(-50%, -50%) !important; }`
(skills-block-quest.css ~line 881) plus `:not(.sbq-stop)` guards. Never add `transform` on
`.sbq-stop`/`.sbq-stop-marker` hover, and keep those guards intact.

```css
/* ═══ C. EL MAP QUESTS ═════════════════════════════════════════════════ */
:root { --comic-sea: #3d9be9; }

.student-mode-app .skills-block-quest .sbq-kicker {
  display: inline-block;
  padding: 8px 16px 10px;
  background: var(--comic-yellow);
  color: var(--comic-ink);
  border: var(--comic-bw-lg) solid var(--comic-ink);
  border-radius: 6px;
  box-shadow: var(--comic-shadow);
  transform: rotate(-2.5deg);
  font-family: var(--comic-display);
  font-style: italic;
  font-size: clamp(1.2rem, 2vw, 1.7rem);
  text-transform: uppercase;
}
.student-mode-app .skills-block-quest .sbq-sub {
  font-family: var(--comic-label);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--comic-ink);
}

/* The map becomes a sea-blue comic panel */
.student-mode-app .skills-block-quest .sbq-mapwrap {
  background: var(--comic-sea);
  border: var(--comic-bw-lg) solid var(--comic-ink);
  border-radius: var(--comic-r-lg);
  box-shadow: var(--comic-shadow-lg);
  overflow: hidden;
}

/* Stops: white ink-ringed circles; current stop gets the yellow ring */
.student-mode-app .skills-block-quest .sbq-stop-marker {
  background: #fff;
  border: var(--comic-bw) solid var(--comic-ink);
  box-shadow: 2px 2px 0 var(--comic-ink);
  color: var(--comic-ink);
  font-family: var(--comic-label);
  font-weight: 900;
}
.student-mode-app .skills-block-quest .sbq-stop-name {
  background: #fff;
  border: 2px solid var(--comic-ink);
  border-radius: 8px;
  box-shadow: 2px 2px 0 var(--comic-ink);
  padding: 1px 8px;
  font-weight: 900;
}

/* Route: `.sbq-route-line` is an SVG <path> (ElSkillsQuest.jsx ~line 761).
   Base style lives in skills-block-quest.css line ~868 (stroke rgba(255,248,225,.5),
   dasharray 2 26 = dotted). Mockup wants chunky white dashes: */
.student-mode-app .skills-block-quest .sbq-route-line {
  stroke: rgba(255, 255, 255, 0.95);
  stroke-dasharray: 14 12;
}
/* If any draw-in animation turns out to depend on stroke-dasharray/dashoffset,
   keep the existing dasharray and override only the stroke color. */

/* Right rail / next-up: white comic panel with a red header + yellow CTA */
.student-mode-app .skills-block-quest .sbq-next-up {
  background: #fff;
  border: var(--comic-bw-lg) solid var(--comic-ink);
  border-radius: var(--comic-r-lg);
  box-shadow: var(--comic-shadow);
}
.student-mode-app .skills-block-quest .sbq-primary-button {
  background: var(--comic-yellow);
  color: var(--comic-ink);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
}
.student-mode-app .skills-block-quest .sbq-ghost-button {
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  background: #fff;
  color: var(--comic-ink);
  font-weight: 900;
}
.student-mode-app .skills-block-quest .sbq-progress-track {
  border: 2px solid var(--comic-ink);
  border-radius: 999px;
  background: #fff;
  overflow: hidden;
}
.student-mode-app .skills-block-quest .sbq-world-tabs button {
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-weight: 900;
}
```

Before writing these overrides, open `src/styles/skills-block-quest.css` and check each hook's
current box model so the overrides don't fight positioning (markers are absolutely positioned —
touch colors/borders/shadows only, never their `position/transform`). **If any selector here doesn't
match reality, stop and re-inspect — do not guess.**

**Acceptance (EL Map):** yellow rotated "EL Map Quests" sticker header; sea-blue ink-bordered map
panel; white numbered stops with hard mini-shadows; white dashed route; white quest rail with yellow
slanted START button. Stops do not jump on hover (regression check). In-quest gameplay screens are
visually unchanged apart from inherited buttons.

---

## WORK ORDER D — Story Quests picker (mockup: level tabs + story cards)

**Files:** CSS only. Component: `src/components/LearnAreaPage.jsx`.
Verified hooks: `.learn-area-page.story-quest-learn-page`, `.learn-story-quest-library.card`,
`.story-quest-kicker`, `.story-quest-library-stats`, `.learn-story-level-selector`,
`.story-quest-continue-strip`, `.learn-story-level-section`, `.learn-story-level-header`,
`.learn-story-level-grid`, `.learn-story-quest-cover`, `.learn-story-quest-card-copy`,
`.learn-story-word-preview`, `.story-quest-card-progress`, `.learn-story-quest-actions`.

```css
/* ═══ D. STORY QUESTS PICKER ═══════════════════════════════════════════ */
/* Red rotated sticker header */
.student-mode-app .story-quest-learn-page .story-quest-kicker {
  display: inline-block;
  padding: 8px 16px 10px;
  background: var(--comic-red);
  color: #fff;
  border: var(--comic-bw-lg) solid var(--comic-ink);
  border-radius: 6px;
  box-shadow: var(--comic-shadow);
  transform: rotate(-2.5deg);
  font-family: var(--comic-display);
  font-style: italic;
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  text-transform: uppercase;
}

/* Level tabs A/B/C (verified DOM, LearnAreaPage.jsx ~line 163): buttons are
   .learn-story-level-button with aria-pressed + .active, containing
   <strong>Level A</strong><span>n/N complete</span> — the mockup's exact content. */
.student-mode-app .learn-story-level-button {
  background: #fff;
  color: var(--comic-ink);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px 10px 0 0;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-label);
  font-weight: 900;
  text-transform: uppercase;
}
.student-mode-app .learn-story-level-button[aria-pressed="true"],
.student-mode-app .learn-story-level-button.active {
  background: var(--comic-red);
  color: #fff;
}
.student-mode-app .learn-story-level-button.active::before { content: "★ "; color: var(--comic-star); }

/* Continue strip: yellow banner with ink border */
.student-mode-app .story-quest-continue-strip {
  background: var(--comic-yellow);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: var(--comic-r);
  box-shadow: var(--comic-shadow);
}
.student-mode-app .story-quest-continue-strip .lp-button {
  background: var(--comic-red);
  color: #fff;
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
}

/* Story cards: cover with ink frame, colored body cycling like the mockup */
.student-mode-app .learn-story-level-grid > * {
  background: var(--comic-red);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: var(--comic-r);
  box-shadow: var(--comic-shadow);
  overflow: hidden;
}
.student-mode-app .learn-story-level-grid > *:nth-child(4n+2) { background: var(--comic-blue); }
.student-mode-app .learn-story-level-grid > *:nth-child(4n+3) { background: var(--comic-teal); }
.student-mode-app .learn-story-level-grid > *:nth-child(4n)   { background: var(--comic-purple); }
.student-mode-app .learn-story-quest-cover {
  border-bottom: var(--comic-bw) solid var(--comic-ink);
}
.student-mode-app .learn-story-quest-card-copy strong,
.student-mode-app .learn-story-quest-card-copy h3 {
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 2px 2px 0 var(--comic-ink);
  letter-spacing: 0.02em;
}
.student-mode-app .learn-story-word-preview,
.student-mode-app .story-quest-card-progress {
  background: #fff;
  color: var(--comic-ink);
  border: 2px solid var(--comic-ink);
  border-radius: 999px;
  box-shadow: 2px 2px 0 var(--comic-ink);
  font-weight: 900;
}
.student-mode-app .learn-story-quest-actions .lp-button-primary {
  background: var(--comic-yellow);
  color: var(--comic-ink);
  border: var(--comic-bw) solid var(--comic-ink);
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
}

/* Stats panel (words found) as a teal comic panel */
.student-mode-app .story-quest-library-stats {
  background: var(--comic-teal);
  color: #fff;
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: var(--comic-r);
  box-shadow: var(--comic-shadow);
  font-weight: 900;
}
```

Style only what exists — the mockup's "Quest Streak 12 days" panel has no data source in
`LearnAreaPage.jsx`; skip it rather than inventing one. **In-story reading view
(`StoryQuestPlayer.jsx`): restyle nothing except buttons it already shares (`lp-button`) — story text
stays exactly as is.**

**Acceptance (Story Quests):** red rotated sticker header; A/B/C tab slabs with red active tab;
yellow continue banner with red slanted CONTINUE button; story cards with ink-framed cover, colored
bodies (red/blue/teal/purple cycle), white pill chips for words/progress; teal stats panel.

---

## WORK ORDER E — Reading Library (mockup: shelf rows + level chips)

**Files:** CSS only. Component: `src/components/guided-reading/GuidedReadingPage.jsx` (2086 lines,
shared with teacher mode). **Scope every rule to `.student-guided-reading-page`** — teacher mode must
be pixel-identical to today. Verified hooks: `.guided-library-breadcrumb`, `.guided-level-grid`,
`.guided-level-card`, `.guided-category-grid`, `.guided-category-card`, `.guided-category-icon`,
`.guided-book-grid`, `.guided-book-cover`, `.guided-book-cover-wrap`, `.guided-book-info`,
`.guided-book-meta`, `.guided-book-title`, `.guided-book-progress`, `.guided-book-action`,
`.guided-reader-header`. Reading surface (`.guided-page-text`, `.guided-page-reading`) is untouchable.

```css
/* ═══ E. READING LIBRARY (student mode only) ═══════════════════════════ */
.student-guided-reading-page .guided-library-breadcrumb {
  font-family: var(--comic-label);
  font-weight: 900;
  text-transform: uppercase;
}

/* Level / category pickers become chip slabs (blue/green/red like the mockup) */
.student-guided-reading-page .guided-level-card,
.student-guided-reading-page .guided-category-card {
  background: #fff;
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: var(--comic-r);
  box-shadow: var(--comic-shadow-sm);
  font-weight: 900;
}
.student-guided-reading-page .guided-level-card:hover,
.student-guided-reading-page .guided-category-card:hover {
  transform: translate(-1px, -2px);
  box-shadow: var(--comic-shadow);
}
.student-guided-reading-page .guided-level-grid > :nth-child(1) .guided-level-card,
.student-guided-reading-page .guided-level-grid > :nth-child(1) { border-color: var(--comic-ink); }

/* Book cards: ink-framed covers, chunky titles, comic progress bar */
.student-guided-reading-page .guided-book-cover,
.student-guided-reading-page .guided-book-cover-wrap {
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  overflow: hidden;
}
.student-guided-reading-page .guided-book-title {
  font-family: var(--comic-label);
  font-weight: 900;
}
.student-guided-reading-page .guided-book-meta {
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
/* Verified DOM (GuidedReadingPage.jsx ~line 1674): .guided-book-progress is a
   text <p> ("3/8 pages read" / "Completed" / "Not started"), NOT a fill bar —
   style it as a status pill chip, green when it says Completed is not
   distinguishable in CSS, so one pill style for all states: */
.student-guided-reading-page .guided-book-progress {
  display: inline-block;
  background: #fff;
  color: var(--comic-ink);
  border: 2px solid var(--comic-ink);
  border-radius: 999px;
  box-shadow: 2px 2px 0 var(--comic-ink);
  padding: 2px 10px;
  font-weight: 900;
  font-size: 0.78rem;
  text-transform: uppercase;
}
.student-guided-reading-page .guided-book-action {
  background: var(--comic-yellow);
  color: var(--comic-ink);
  border: var(--comic-bw) solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: var(--comic-shadow-sm);
  font-family: var(--comic-display);
  font-style: italic;
  text-transform: uppercase;
}

/* Reader chrome only: header buttons pick up ink borders; text untouched */
.student-guided-reading-page .guided-reader-header button {
  border: 2px solid var(--comic-ink);
  border-radius: 10px;
  box-shadow: 2px 2px 0 var(--comic-ink);
  font-weight: 900;
}
```

Open the component first and confirm the level cards' DOM (letter + label) so the LEVEL A/B/C chips
can be tinted blue/green/red by targeting whatever real attribute or text is there (e.g. a
`data-level` attribute or nth-of-type). If levels can't be distinguished in CSS, add
`data-level={level.key}` to the level card JSX — that is the only JSX change permitted here.

**Acceptance (Library):** student library shows ink-bordered white filter slabs, book cards with
framed covers + white status pill chips + yellow slanted action buttons; **teacher-mode library and
the in-book reading surface are visually unchanged** (diff screenshots before/after to prove it).

---

## ASSETS (current pass = existing art in comic frames)

Keep every existing image; the ink frames make them read as comic panels. New mockup-style art is
generated separately via `docs/COMIC_REDESIGN_IMAGE_PROMPTS_2026-07-07.md` and imported through the
Kimi pipeline; slots and dimensions are listed there. The only conditional swap in this pass is the
Arcade card art (Work Order A.1 step 4).

---

## VERIFICATION LOOP (run after every work order, not just at the end)

1. `npm run lint && npm test` — must be green.
2. `npm run build` — must be green.
3. `npx playwright test tests/smoke` — must be green.
4. `npm run dev` → eyeball each screen against its acceptance list above at 1280×800 **and** 375×812.
5. Teacher-mode spot check: sign in as teacher → dashboard, guided reading, worksheets look unchanged.
6. Reduced-motion check: enable "reduce motion" in OS/devtools → no hover translations remain.
7. If the graphify CLI is installed: `graphify update .`

A red check is yours until you prove it pre-existed. If you stall for 2–3 iterations on the same
red, your map is wrong — go back and re-inspect the real DOM/CSS instead of re-guessing.

**Self-test before reporting done (all must be YES):**
1. Did a named check pass for every claim of success?
2. Does every screen meet its acceptance list, verified by eye?
3. Is teacher mode pixel-identical?
4. Does any rendered text say "Literacy Path" anywhere? (must be NO)
5. Is every change scoped to `comic-theme.css` + the small JSX diffs listed above?

---

## HANDOFF (gated — do not push to main)

This is a whole-app visual change, so it ships to a **preview branch** for Benjamin to approve
(Vercel builds a preview URL per branch). When every check above is green, run exactly:

```bash
npm run lint && npm test && npm run build && git checkout -b comic-redesign && git add -A && git commit -m "Comic redesign: mockup-fidelity reskin (home, daily strip, EL map, story quests, library)" && git push -u origin comic-redesign
```

Then report: what green means (the named checks), the preview URL, and any deviations from the
mockups with the reason (e.g. "no Quest Streak panel — no data source"). Merging to `main`/live
happens only after Benjamin approves the preview visually.

