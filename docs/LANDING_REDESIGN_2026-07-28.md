# Public landing page redesign — 2026-07-28

**Record.** The signed-out entry ("Choose your space", `StudentEntryPage.jsx`) became a
full marketing landing page per the approved `Landing Page.dc.html` design: sticky
header, hero with the two branded destination cards (same `onStudent`/`onTeacher` exits,
so session logic upstream is untouched), stat strip, children features, the three
worlds, a dark Teacher Tools band, safe-by-default, final CTA and footer. Styles live in
`src/styles/landing.css` (the entry block in `pal-worlds.css` was superseded and
removed); every image already existed in `public/images/` — no new assets.

Facts corrected rather than copied from the mock (derived from the data, checkable):
"70 levelled books / four levels / 12 phonics games" → **176 levelled books (A:55,
B:76, C:45), three levels, 21 games** (`guidedReadingBooks`, `GAME_LIST`); "Levels C–D"
→ Level C (no D exists); world bands match `themeWorldForCycle` (1–9 / 10–18 / 19–27).
Teacher-path copy uses the child-safe vocabulary ("checks", "child") because
`check:app-copy` scans the whole entry surface as child copy — same reason the old
gateway said "Checks".

Two mechanisms found during rendered QA (both invisible to source-level tests):
`App.css`'s `.student-entry-page { display: grid; place-items: center }` shrink-wrapped
every section **even after a `display: block` override** — modern Chromium applies box
alignment to block containers, so `place-items` must be explicitly reset — and
`minmax(0, 420px)` resolves to a fixed 420px track that overflows a 390px phone
(`min(100%, 420px)` is the fluid form).

Verified green 2026-07-28: `TZ=Asia/Shanghai npm run test:unit` 1721/1721, `lint`,
`build`, `check:app-copy` 18/18, and full-page screenshots at 1440px and 390px
(no horizontal overflow at either) against the served production build.
`tests/unit/childBrand.test.js` re-anchored: entry styles path → `landing.css`, new
ground `#f7f0e4`, CTA copy "Start playing" / "Open Teacher Tools".
