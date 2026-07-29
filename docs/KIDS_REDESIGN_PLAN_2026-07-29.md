# Kids-side redesign — implementation plan (2026-07-29)

**Standard while the build runs; supersede when the last phase ships.** The approved
design is `mockups/design-handoff-kids-side/Kids Side Redesign.dc.html`; its README in
the same folder is the written spec (tokens, per-screen geometry, copy) and is binding.
`Current Kids Home (recreation).dc.html` is a before-picture, not a target.

**Viewing it offline:** run `./link-assets.sh` in that folder (symlinks repo art into
`assets/`; all 66 prototype assets were verified byte-identical to repo originals on
2026-07-29, so none were committed), then serve over HTTP and open
`serve-kids.dc.html` — it maps the runtime's unpkg React/Babel onto the committed
local copies. Use the bottom tabs and Home doorways to reach all seven screens;
**Go** on the Sound Trail opens the celebration overlay.

## What makes this different from the teacher redesign

1. **It replaces the child navigation.** The left rail becomes a five-tab bottom bar.
   The spec is explicit: `studentRailPolicy.js` gets a *corresponding revision, not a
   bypass*. `studentRailPolicy.test.js` and `childSurfaceRules.test.js` encode the
   current policy — read them before changing it.
2. **It is a fixed-canvas design.** 1194 × 834 (iPad landscape). Other viewports
   **scale the whole stage to fit** rather than reflowing. (Present mode already does
   exactly this — see `public/present/deck.js` `fitStage()`, and note the centring
   trap recorded in `PRESENT_REDESIGN_2026-07-28.md`: reset `place-items` and centre
   with a translate inside the same transform.)
3. **It caps the child's numeric systems at two** — stars (earned) and coins
   (spendable). The spec says the prior build surfaced ~8 (flame/streak, gems, XP,
   points…) and forbids reintroducing them. `studentEmphasisBudget.test.js` is the
   related guard.
4. **New visual system.** "Liquid glass": three tiers of frosted panel over a warm
   ambient gradient, hairline light borders, diffuse shadows, no ink outlines, no
   text-shadow (a missing scrim is what makes you want one). Belongs in a new
   `src/styles/kids-glass.css`, in the spirit of `home-sage.css` — **do not delete
   `comic-theme.css`**, which is the shared base the sage palette layers onto
   (2026-07-22 decision).
5. **Fonts:** Baloo 2 (headings/numerals/buttons) + Nunito (body/captions), to be
   self-hosted. `index.html` already loads a Google Fonts set — extend it there.

## Phase order

Phase A — **Foundation**: `kids-glass.css` (all three glass tiers, tokens, motion with
`prefers-reduced-motion`), the fixed 1194×834 stage with scale-to-fit, the 78px header
(profile / stars / coins / grown-ups) and the 92px five-tab bottom bar, plus the
`studentRailPolicy.js` revision and the Story-Quests→Books / Adventure-Map→Sounds
active-tab mapping. Everything else depends on this.

Phase B — **Home**: continue hero (232px), "Today's three stops" strip with the dashed
connector, six-doorway grid. One unmistakable next action.

Phase C — **Sound Trail** + **Adventure Map**: both are percentage-positioned node
scenes over a scrimmed panorama with an SVG polyline; build them together so the node
machinery is shared. Mind the animation gotcha (`bob` sets `transform` and destroys
centring transforms — split wrapper and inner img).

Phase D — **Books** + **Story Quests**: continue panel with progress, two shelves,
3×2 quest grid. Books ⇄ Story Quests with the Books tab staying lit.

Phase E — **Arcade**: world filter, the one dark featured panel (the app's only
"recommendation" surface, and it must explain *why*), 6×2 game grid with star rows.

Phase F — **My Hollow** + **Celebration overlay**: percentage-placed decorations, the
dashed empty spot, the Market with affordable/unaffordable states; then the overlay
whose "Spend my coins" button closes the earn→spend loop.

## Binding rules for every phase

- 44 × 44 is the hard minimum for every interactive element in the child area.
- Never white text on light glass over an illustration — add the scrim instead.
- All numbers in the mock are placeholders: wire to real student state, and where a
  real source does not exist, say so rather than inventing one.
- Child copy must clear `npm run check:app-copy` (the child surfaces have a banned-word
  list — "evidence", "assessment", "student" among them; check `TEACHER_BANNED` /
  child equivalents before writing new strings).
- Loading/error/empty states are undesigned: follow existing app patterns, and a load
  failure must never render as an empty-data claim.
- Keep every existing child capability reachable — this is a re-layout, not a cull.

## Verification per phase (same bar as the teacher redesign)

`TZ=Asia/Shanghai npm run test:unit` + `lint` + `build` + `check:app-copy`, plus
rendered screenshots at 1194×834 next to the prototype screen. Suites that assert the
current child surfaces: `studentRailPolicy`, `childSurfaceRules`, `childBrand`,
`studentEmphasisBudget`, `studentHomeRecommendationPolicy`, `learnerAccessibility`,
`reducedMotionTeaching`, `studentDeviceMatrix`, `gameSurfaces`, `storyQuestSurface`,
`questHub`. Update them to the new truth per phase; never delete one.
