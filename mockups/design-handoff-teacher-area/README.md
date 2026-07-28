# Handoff: Teacher Area Redesign (LiteracyPath)

## Overview

A redesign of the **teacher side only** of the Literacy Guide app: six screens — Dashboard,
Students, Assessments, Reports, Resources, Settings — restructured so that a teacher lands on
a decision, not a data dump, and so that a student, once chosen, stays chosen.

The student-facing side of the app is out of scope and unchanged.

## About the Design Files

The files in this bundle are **design references created in HTML**. They are prototypes showing
intended look and behaviour — they are **not production code to copy directly**.

The task is to **recreate these designs inside the existing LiteracyPath codebase** (React +
Vite, plain CSS with `--lp-*` custom properties in `src/App.css` and
`src/styles/lg-design-system.css`), using its established components, tokens and routing. Do
not introduce a new styling approach; the mock's inline styles exist only because the prototype
is a single self-contained file.

Two visual variants are included:

| File | Visual language | Status |
| --- | --- | --- |
| `Teacher Redesign v2.dc.html` | **The one to build.** Uses the app's existing `--lp-*` palette, Inter/Lexend, rounded cards, `#0F172A` sidebar. | Approved |
| `Teacher Redesign.dc.html` | Same structure in a flat "Modernist" style (square corners, 2px rules, red accent). | Reference only — do not build |

Both files are runnable HTML. Open `Teacher Redesign v2.dc.html` in a browser; the left rail
switches screens. `support.js` must sit next to them (it is the runtime the prototypes use and
has nothing to do with the target implementation).

## Fidelity

**High-fidelity.** Colours, type, spacing, copy and states are final and are drawn from the
existing codebase's tokens. Recreate pixel-closely using existing LiteracyPath components where
they already exist (buttons, tags, cards, tables in `src/components/teacher/ui/`), rather than
writing new one-off styles.

Content is realistic but **not real**: skill names, assessment names and Level C book titles are
taken from the codebase (`src/data/firstFactsLevelCBooks.js`, teacher copy files); student names
are invented. All numbers are placeholders — wire them to real selectors.

## What changed, and why

The current teacher area works but asks the teacher to reassemble context on every screen. Five
structural changes:

1. **Persistent context bar.** Class, school, student count and the current teaching cycle sit
   in a sticky bar above every screen. Every tool below it is implicitly scoped to that class
   and cycle, so no screen needs its own class picker.
2. **The dashboard leads with two capped lists.** "Who needs attention" (3 max, red) and
   "What's due" (3 shown of N, teal). Metrics, the sound map and recent changes sit *below*
   them — summary, not headline. Balanced density: summary up front, detail one click away.
3. **Students is a roster + persistent student panel.** Selecting a row fills a right-hand
   panel with that student's status counts, evidence and every action available for them
   (assess, guided reading, report, print). The teacher never picks a student twice.
4. **Assessments is an explicit 1-2-3 funnel.** Student → assessment → run. The student select
   is scoped to the class and changing it does not navigate away.
5. **Resources is the whole-class shelf** (Present / Worksheets / Guided reading), while
   per-student versions of the same tools live in the student panel. "Present" is *also* a
   global button in the context bar.

## Screens / Views

Shared shell (all screens):

- **Sidebar** — 208px fixed, sticky, full height, `#0F172A`. Brand row (26px teal rounded
  square with "L", 14px/700 white wordmark). Class chip: `rgba(255,255,255,0.06)`, 6px radius,
  10px uppercase label `rgba(255,255,255,0.5)`, 13px/600 white value. Nav items: 44px min
  height, 6px radius, 13.5px, inactive `rgba(255,255,255,0.78)` / active `#fff` on
  `rgba(12,107,101,0.32)`, hover `rgba(255,255,255,0.07)`. Order: Dashboard (badge "8"),
  Students, Assessments, Reports, Resources, Settings. Footer: signed-in email 11px
  `rgba(255,255,255,0.55)` + Sign out.
- **Context bar** — sticky top, white, 1px `#E2E8F0` bottom border, `--lp-shadow-nav`, 12px 24px
  padding, wraps. Left: "School and class" (10px uppercase `#6B7585`) / "Willow Class" 15px/700
  + "Change" link / "St Mary's Primary · 28 students" 12px `#51607A`. 1px vertical divider.
  Then "Teaching cycle" / "Cycle 6 · Digraphs and blends" 14px/600. Right, pushed by a flex
  spacer: secondary **Present**, primary **Assess a student**, both 44px min height.
- **Content area** — 24px padding, 18–20px vertical gap between sections.

### 1. Dashboard (`today`)

Purpose: decide who to work with in the next ten minutes.

- **Header** — kicker "Today · Tuesday 28 July" (11px, 0.09em, uppercase, 700, `#0C6B65`);
  h1 "Start with these students" (Lexend 27px/1.15, -0.02em, 700, `#101828`); sub 14px
  `#51607A`, max 60ch.
- **Metric strip** — `repeat(auto-fit, minmax(170px, 1fr))`, 14px gap. Each card: white, 1px
  `#E2E8F0`, 10px radius, `--lp-shadow-card`, 14px 16px. Label 11px uppercase `#6B7585` +
  15px circular "i" tooltip; value Lexend 28px/700; note 12px `#51607A`.
  Five metrics: Students 28 / Ready to sign in 26 / Have played 24 / Played today 11 /
  Class accuracy 72%. Tooltip copy is in the HTML — keep the existing "fair average" wording.
- **Two list panels** — `repeat(auto-fit, minmax(400px, 1fr))`, 16px gap. Card chrome as above,
  `overflow: hidden`.
  - *Who needs attention* — header `#FEF2F2` bg, title `#B91C1C` 13px/700, count pill solid
    `#B91C1C` on white text, 999px radius.
  - *What's due* — header `#E3F4F2` bg, title `#084E4A`, count pill solid `#0C6B65`.
  - Rows: name 15px/700 + status pill; focus 14px/600; evidence 12px `#51607A`. Right column
    stacks two 40px buttons — primary/secondary "Assess" and ghost "Open student".
  - Attention footer note: subtle bg, 12px muted. Due footer: full-width "Show all 5" button
    linking to Students.
- **Class sound map** — card. Header row (title + description + secondary "Print group pack").
  Grid `repeat(auto-fit, minmax(170px, 1fr))`, 10px gap, 14px 18px padding. Each tile is a
  button, 8px radius, 84px min height, heat-coloured by how many students still need the skill:
  low → `#F0FDF4`/`#14532D`/border `#BBF7D0`; mid → `#FEF3C7`/`#B45309`/`#FDE68A`;
  high → `#FEF2F2`/`#B91C1C`/`#FECACA`; not checked → `#F8FAFC`/`#6B7585`/`#E2E8F0`.
  Label 12.5px/600, count Lexend 22px/700, note 11px at 0.85 opacity. Hover adds the card shadow.
- **Recent changes** — collapsed `<details>` in card chrome; rows are name / summary / relative
  comparison.

### 2. Students (`students`)

Purpose: find a student and do everything for them without leaving.

- **Header** — kicker/h1 "Willow Class — 28 students"/sub, plus a wrapping button row:
  secondary "Import a class list", secondary "Print sign-in cards", primary "Add student".
- **Filter row** — 44px search input (250px max, 1px `#CBD5E1`, 6px radius) then pill filters
  (`Everyone`, `Needs help`, `No scored answers`, `Played today`): 40px, 999px radius, active =
  solid `#0C6B65` white text, inactive = white with `#CBD5E1` border. Result count pushed right,
  12px `#6B7585`.
- **Layout** — flex-wrap: roster `flex: 1 1 640px`, panel `flex: 1 1 340px; max-width: 400px`.
  Below ~1040px the panel drops beneath the roster.
- **Roster** — card with `overflow-x: auto`. Header and rows share
  `grid-template-columns: minmax(150px,1.4fr) minmax(140px,1fr) minmax(70px,0.7fr) minmax(130px,0.9fr) minmax(90px,0.8fr)`,
  8px gap, `min-width: 620px` (scrolls horizontally below that). Header: `#F8FAFC`, 11px
  uppercase `#6B7585`. Rows: 56px min height, 3px left border (`#0C6B65` when selected),
  selected bg `#E3F4F2`, hover `#F8FAFC`. Cells: name 14.5px/700 + sign-in state 11px `#6B7585`;
  focus; accuracy 14px/700; status pill; last active `#51607A`. Footer strip: archived count.
- **Student panel** — sections divided by 1px rules:
  1. Header — "Student panel" label, name Lexend 21px/700, one-line summary.
  2. Three status tiles — Secure `#F0FDF4`/`#14532D`, Developing `#FEF3C7`/`#B45309`,
     Needs `#FEF2F2`/`#B91C1C`; 6px radius, count Lexend 20px/700.
  3. **Do next** — four full-width, left-aligned, 44px buttons: primary "Assess {first name}",
     secondary "Open guided reading — Level C", secondary "Open report", ghost "Print practice pack".
  4. **Latest evidence** — up to four rows: skill 13px, accuracy 12px muted, status pill.
  5. Footer links — Sign-in pictures, Move class, Archive (Archive in `#B91C1C`).

### 3. Assessments (`assess`)

- **Step strip** — three cards, `repeat(auto-fit, minmax(240px, 1fr))`, 12px gap. Step 1 is
  active: `#E3F4F2` bg, `#C0E6E3` border, solid teal 28px number dot. Steps 2–3: white,
  `#E2E8F0` border, `#F1F5F9` dot, step 3 text muted.
- **Panel 1 · Student** (`flex: 1 1 300px; max-width: 360px`) — labelled select (44px), the note
  "Changing student here does not leave the page", and a teal-soft suggestion block naming the
  suggested assessment and its evidence.
- **Panel 2 · Assessment** (`flex: 1 1 480px`) — `repeat(auto-fit, minmax(240px, 1fr))` of six
  cards: kind kicker (colour-coded: Suggested `#0C6B65`, Phonics `#2563EB`, Curriculum `#6D28D9`,
  Benchmark/Words `#B45309`), title 16px/700, body, then meta + 40px "Start". Hover: teal border
  + card shadow. Footer strip carries the accuracy-vs-status caveat verbatim.

### 4. Reports (`reports`)

- Header with secondary "Export spreadsheet" and primary "Export PDF".
- **Status split** — five cards `repeat(auto-fit, minmax(190px, 1fr))`: Needs support (red-soft),
  Developing (amber-soft), Secure (green-soft), Not enough results (white), Not checked (white).
  Label 11px uppercase 700, count Lexend 30px/700, note 12px at 0.85 opacity.
- **Skills table** — card, `overflow-x: auto`, table `min-width: 640px`. Header `#F8FAFC`, 11px
  uppercase; rows 11px 18px, 1px `#E2E8F0` rules; columns Skill (600) / Students assessed /
  Answers / Accuracy (700) / Class status (pill). Footer strip: the EL-benchmark caveat.
  Accuracy and learning status are deliberately separate columns — do not merge them.

### 5. Resources (`resources`)

- Three cards `repeat(auto-fit, minmax(280px, 1fr))`, 250px min height: **Present** (whole class),
  **Worksheets** (print), **Guided reading** (small group). Each: kind kicker, Lexend 20px/700
  title, body, three bullets 12.5px muted, then a full primary 44px action.
- **Suggested next books — Level C** — card with `repeat(auto-fit, minmax(210px, 1fr))` of book
  tiles: title 14.5px/700, "First Facts · nonfiction · Level C", ghost "Open reader". Titles
  come from `src/data/firstFactsLevelCBooks.js` — wire to the real list rather than hardcoding.

### 6. Settings (`settings`)

Four cards `repeat(auto-fit, minmax(300px, 1fr))`: Classes and groups, Sign-in pictures,
Accessibility, Data and privacy. Title 16px/700, body 13px muted, secondary 44px action.

## Interactions & Behavior

- **Navigation** — sidebar switches screens; the context bar persists. In the real app these are
  routes, not local state.
- **Cross-screen jumps** — "Assess" anywhere → Assessments with that student preselected;
  "Open student" → Students with that student selected in the panel; sound-map tile → Reports
  filtered to that skill; "Change" (class) → Settings › Classes; "Show all 5" → Students filtered
  to the due list.
- **Student selection** is the core state on the Students screen: clicking a row swaps the panel
  with no navigation and no scroll jump. Preserve scroll position.
- **Hover** — nav `rgba(255,255,255,0.07)`; roster rows `#F8FAFC`; secondary buttons gain a
  `#0C6B65` border + `#F8FAFC` fill; primary buttons darken to `#084E4A`; ghost buttons gain a
  `#E3F4F2` fill; sound-map tiles and assessment cards gain `--lp-shadow-card`.
- **Focus** — `outline: 2px solid #0C6B65; outline-offset: 2px` on all interactive elements.
  Never leave the browser default.
- **Touch targets** — 44px minimum everywhere (matches the existing
  `--teacher-ui-target-min`); the only 40px controls are secondary in-row actions.
- **Responsive** — every multi-column grid is `auto-fit`/`minmax`, so nothing is fixed-column.
  The roster and the reports table scroll horizontally below 620/640px rather than compressing.
  Below roughly 1040px the student panel and the assessment panels stack.
- **Empty and insufficient-data states are first-class.** "Not enough results" and "Not checked"
  are distinct from a low score; never render them as 0%. Keep the existing wording — an em dash
  for accuracy and an explanatory note.

## State Management

Per screen:

- `selectedClassId` — global, drives the context bar and scopes every screen.
- `currentCycle` — global, derived from the class.
- `selectedStudentId` — shared between Students and Assessments; set by any "Assess" or
  "Open student" action so the target screen opens pre-scoped.
- `rosterFilter` — one of `everyone | needsHelp | noScored | playedToday`, plus a search string.
- `assessmentStep` — derived, not stored: step 2 is active once a student exists, step 3 once an
  assessment is chosen.
- `soundMapSkillFilter` — passed to Reports when a tile is clicked.

Data needed: class roster with per-student current focus, accuracy, learning status, last-active
timestamp and sign-in readiness; per-student skill evidence list; class-level per-skill
aggregates (students assessed, answer count, accuracy, class status); the today lists (attention,
due, recent changes); the Level C book list.

## Design Tokens

All already defined in `src/App.css` — use the variables, not the hex values.

Colour: `--lp-color-primary` #0C6B65 · `--lp-color-primary-strong` #084E4A ·
`--lp-color-primary-soft` #E3F4F2 · `--lp-color-primary-mid` #C0E6E3 ·
`--lp-color-success` #15803D / `-soft` #F0FDF4 / `-text` #14532D ·
`--lp-color-warning` #B45309 / `-soft` #FEF3C7 ·
`--lp-color-danger` #B91C1C / `-soft` #FEF2F2 ·
`--lp-color-text` #172033 · `-strong` #101828 · `-muted` #51607A · `-subtle` #6B7585 ·
`--lp-color-surface` #ffffff · `-subtle` #F8FAFC · `--lp-color-background` #F1F5F9 ·
`--lp-color-border` #E2E8F0 · `-strong` #CBD5E1 ·
sidebar `--lg-sidebar-bg` #0F172A · `--lg-domain-phonics` #2563EB · `--lg-domain-grammar` #6D28D9.
Extra heat-tile borders used by the sound map: `#BBF7D0`, `#FDE68A`, `#FECACA`.

Radius: `--lp-radius-sm` 4 · `-md` 6 · `-lg` 8 · `-card` 10 · `-pill` 999.

Shadow: `--lp-shadow-card` `0 1px 4px rgba(15,23,42,.06), 0 4px 16px rgba(15,23,42,.06)` ·
`--lp-shadow-nav` `0 1px 3px rgba(15,23,42,.08)`.

Type: Inter for UI (400/500/600/700), Lexend for headings and numerals (700).
h1 26–27px/1.15/-0.02em · section title 13px/700 · body 13–14px/1.45 · meta 12px ·
kicker and column headers 10–11px uppercase, 0.05–0.09em tracking, 600–700.

Spacing: 24px page padding · 18–20px between sections · 12–16px grid gaps · 13–18px card padding.

## Assets

No new assets. Icons should come from whatever set LiteracyPath already uses — the prototype
deliberately omits icons so the implementation can slot in the real ones (sidebar items, metric
tooltips, and the three resource cards are the obvious places).

## Files

- `Teacher Redesign v2.dc.html` — **the approved design.** Open in a browser; use the left rail.
- `Teacher Redesign.dc.html` — alternate flat visual treatment, same structure. Reference only.
- `support.js` — runtime required by the two HTML files. Not part of the implementation.

Existing codebase files this touches: `src/components/Sidebar.jsx`,
`src/components/TeacherTodayPage.jsx`, `src/components/TeacherReportsHubPage.jsx`,
`src/components/teacher/` (incl. `TeacherIntentPage.jsx`, `ui/TeacherPrimitives.jsx`,
`ui/teacherTokens.css`), `src/copy/teacherCopy.js`, `src/App.css`,
`src/styles/lg-design-system.css`, `src/data/firstFactsLevelCBooks.js`.

## Suggested prompt for Claude Code

> Read `design_handoff_teacher_area/README.md` and open
> `design_handoff_teacher_area/Teacher Redesign v2.dc.html` in a browser to see the target.
> Implement this teacher-area redesign in this React codebase using the existing `--lp-*`
> tokens and the components in `src/components/teacher/ui/`. Do not copy the prototype's inline
> styles. Start with the shared shell (sidebar + context bar), then the Dashboard, then Students.
> Keep all existing copy strings from `src/copy/teacherCopy.js` where they already say the same
> thing. Show me a diff per screen before moving to the next one.
