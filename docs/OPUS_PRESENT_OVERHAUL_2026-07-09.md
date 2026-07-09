# OPUS 4.8 — Present-mode (teacher slides) curriculum overhaul

**Read first:** operate by the LiteracyPath Operating Manual (`AGENTS.md` →
`docs/OPERATING_MANUAL.md`). Cardinal rule: never claim success without a
passing check you can name. Gate everything: `npm run test:unit && npm run
lint && npm run build` before any push. Do not touch Codex's arcade WIP
(untracked `Sound*`/`StarGallery*`/`RhymePop*` game files, stash
`arcade-split-and-wip`). Work on branch `comic-redesign-audit-fixes`.

## Scope
`src/utils/present/presentationBuilder.js` (deck builder, 621 lines),
`src/components/PresentPage.jsx` (picker, 55 lines),
curriculum source of truth: `src/data/elSkillsBlockCycles.js` (27 cycles +
assessment rows; fields: `focusLetters` [grapheme, sound, spelling, **day**],
`highFrequencyWords`, `phonemicAwareness`, `friday`, `phase`, `sections`
(incl. `overview.goals`, `letterLearning.cards[].articulation`,
`poemAndChant`), guided-reading fiction/nonfiction sequences),
`src/data/elCyclePoems.js`, `tests/unit/presentationBuilder.test.js`.

Deck assembly today (buildCyclePresentation): title → goal → per-letter
(sound slide + writing slide) → ≤4 sight words → ≤4 PA slides → (fluency:
pattern + chain) → poem → end.

## Findings — fix ALL of these

### A. Curriculum-fidelity errors (the deck teaches less than the plan says)
1. **The PA cap silently drops whole skills.** `phonemicAwarenessSlides`
   builds 2 slides per skill then `slice(0, 4)`; skills that route to two
   builders ("Combine deletion…", "Review deletion…", "Review
   substitution…", "rhyme review", bare "two-syllable") emit 4 slides from
   the FIRST skill, so the cycle's second declared skill never appears.
   Fix: budget per skill (2 each when 2 skills, cap total 4 by trimming
   WITHIN skills, never dropping one). Add a test: for every cycle, every
   `phonemicAwareness` line contributes ≥1 slide.
2. **The Monday/Tuesday day structure is ignored.** Each `focusLetters`
   card carries a day; `friday` says "Cycle Practice" or "Cycle Check".
   One monolithic deck forces Monday teachers to reveal Tuesday's letter.
   Fix: `buildCyclePresentation(cycleId, { day })` with day options
   Mon (letter 1 + its writing + PA warm-up), Tue (letter 2 …), Wed/Thu
   (sight words + PA + blending review), Fri (review deck honouring the
   `friday` field: Practice = mixed replay; Check = quiz-style prompts,
   no new teaching), and "Whole cycle" (current behaviour, default).
   Day sections must reuse the same slide builders — no duplication.
3. **No blending/decoding slides.** After both letters are taught the
   curriculum expects word building with taught graphemes (the kid quest
   has Word Build; the class deck has nothing). Add 1–2 "Blend with me"
   slides for non-fluency cycles ≥2: pick 2–3 CVC words whose letters have
   ALL been taught by that cycle (reuse the taught-letter word logic from
   the quest's word-build round builder; audio via `wordAudioPath`).
   Test: every blend word's letters ⊆ letters taught in cycles 1..n.
4. **Guided reading is invisible.** `elSkillsBlockCycles` maps each cycle
   to a fiction + nonfiction book (`selectGuidedReadingBook`). Add one
   "Our books this cycle" slide (covers via the guided-reading book index,
   `onerror` hide) so the class sees the week's books.
5. **3-letter graphemes are filtered out.** `focusCards` keeps only
   `/^[a-z]{1,2}$/` spellings — any cycle card with a 3-letter spelling
   (e.g. digraph+ patterns in later cycles) silently loses its letter
   slide. Verify against all 27 cycles; widen to `{1,3}` with stroke/audio
   fallbacks (skip writingSlide if any char lacks strokes — never a blank
   SVG). Test: every non-fluency cycle emits exactly one letter-sound
   slide per focus card.
6. **HFW truncation.** `slice(0, 4)` on `highFrequencyWords`: assert no
   cycle exceeds 4 (test), and if any does, show all — the cap is
   arbitrary, the curriculum list is the contract.
7. **Assessment rows vanish.** `presentationCycleOptions` filters them
   out with no trace. Either add a simple assessment-week deck (title +
   `routines` list + goal) or list them disabled with a tooltip — pick the
   first; `routines` data already exists.

### B. Logic/robustness bugs
8. **`pickPer` collisions:** two skills sharing a bank in one deck can
   surface overlapping examples ("review deletion" uses compound+syllable
   banks with the same n as the plain skills). Thread a per-deck offset
   (skill index) into `pickPer` so no duplicate example appears twice in
   one deck. Test: no two PA slides in a deck show the same `whole` word.
9. **`CURRENT_WORLD` is module-global state** set per build — fine for a
   single window, but concurrent builds (e.g. building Mon+Fri previews)
   would cross-contaminate. Pass `world` through the builders (pure), keep
   the exported API identical.
10. **`window.open` + `document.write`** breaks under popup blockers and
    can't be reopened/projected elsewhere. Keep as primary path but add a
    Blob-URL fallback (`URL.createObjectURL`) and surface a "Popups
    blocked — click to open" message instead of silently returning false
    (PresentPage currently ignores the `false`).
11. **Google-font dependency in the deck** (`Andika`, `Fredoka` fetched at
    open): on an offline classroom projector the deck flashes fallback
    fonts. Inline a `font-display: swap` and system-font stack that still
    looks right with no network; keep the link as enhancement.

### C. Teacher UX (PresentPage)
12. **No default cycle.** The picker starts blank; the teacher dashboard
    already knows each class's current cycle from progress data. Default
    the dropdown to the class's modal current cycle (fall back to last
    presented, localStorage `lp-present-last`).
13. **No preview or day choice.** Add the day selector (from finding 2)
    and a one-line summary under the picker: "Cycle 4 · Ff Dd · 2 sight
    words · rhyming + compound-word warm-ups · poem: <title>" — built from
    the same data, so it can't drift.
14. **Slide counter/nav** is small for a projector: bump `#nav` hit areas
    to ≥56px and add keyboard hint on the start screen (already partially
    there).

### D. Style/content polish
15. End slide "Great learning!" is flat — reuse the world celebrate pal +
    show WHICH letters/words were learned (recap chips, tappable audio).
16. Title-slide `phase` renders raw ("early letter sound") — humanize:
    "Letter Sounds · Early" style labels, sentence case throughout (no
    ALL-CAPS body text anywhere in the deck).
17. Articulation tip line (`💡`) is teacher-voice on a class slide — keep
    it, but style it visibly as a "teacher tip" ribbon so teachers know
    it's theirs to read aloud, not for kids to decode.

## Non-negotiable invariants (existing tests must stay green)
- Deck is deterministic: same cycle (+ same day) = same bytes.
- Every numbered cycle builds; unknown cycle throws.
- PA slides teach the cycle's OWN skills; consecutive cycles sharing a
  skill show different examples.
- Fluency cycles (25–27) drill their own pattern; no letter slides.
- Blocklisted audio never referenced (respect existing audio blocklist
  helpers — never hand-build `/audio/...` paths for words).

## Order of work
1. Findings 1, 5, 6, 8 (pure builder fixes + tests) — one commit.
2. Finding 2 + 12 + 13 (day decks + picker UX) — one commit.
3. Findings 3, 4, 7 (new slide types) — one commit.
4. Findings 9, 10, 11 (robustness) — one commit.
5. Findings 15–17 (polish) — one commit.
Each commit: `npm run test:unit && npm run lint && npm run build` green
BEFORE committing; push with the standard gated one-liner. Update
`tests/unit/presentationBuilder.test.js` alongside every behaviour change —
new behaviour without a new named test does not count as done.

## Verification hand-back to Benjamin (non-technical)
After the final push, print: the preview URL path to the teacher Present
page, one line per day-deck ("Mon deck: N slides"), and the single command
to open cycle 4's Monday deck locally. No "should work" — name the checks
that ran.
