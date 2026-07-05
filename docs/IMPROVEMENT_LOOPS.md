# IMPROVEMENT LOOPS — the instruction file

**How to use me:** tell any AI assistant *"Find the instruction file 'improvement loops'
(docs/IMPROVEMENT_LOOPS.md) and run loop N."* Each loop is self-contained. Run one loop
per session. Every loop ends with the same verification gate and push commands.

**Who this app is for:** LiteracyPath (literacy.guide) teaches phonics and early reading
to 4-7 year olds, used by teachers on projectors/laptops and children on tablets. The
owner (Benjamin) is non-technical: never ask him to write or edit code — implement
everything, then give him complete copy-paste terminal commands and file links.

---

## PART A — NON-NEGOTIABLE FUNDAMENTALS (read before ANY loop)

These rules override anything a loop asks for. If a loop step conflicts with a rule
here, the rule wins and you skip that step.

1. **Never change educational logic, curriculum order, or Supabase structure without
   asking first.** The 27-cycle phonics sequence (`src/data/elSkillsBlockCycles.js`),
   what each cycle teaches, letter-sound correctness, and any database schema are
   sacred. Improving HOW something is presented is fine; changing WHAT is taught is not.
2. **Never overwrite approved media** (anything in `public/audio/`, `public/images/`,
   `public/guided-reading/`, `public/story-quests/`). If better art/audio is needed,
   write a precise request document in `docs/` (NOT `docs/assets/` — that folder is
   reserved for the import pipeline and fails the hygiene check).
3. **Never generate synthetic audio for phonics.** TTS/AI letter sounds have failed
   human ear-checks twice. Audio comes from human recordings only. The blocklist in
   `src/data/knownBadWordAudio.js` must never be emptied without a human ear-check;
   wrong audio teaches children wrong sounds — worse than silence.
4. **Never claim success without the gate passing.** Done = build succeeds + all unit
   tests pass + ESLint 0 errors + all check scripts pass. No exceptions, no "should work".
5. **Work loop-style:** inspect → find root cause → smallest safe fix → run checks →
   fix failures → re-run until clean. Never batch ten speculative changes then test once.
6. **Child-facing content rules:** realistic-cartoon art style, fantasy/sci-fi/nature
   themes; no rainbow motifs, no faces on inanimate objects, nothing babyish; child
   prompts say "tap" (never click/select/press); the app-wide narrator is the single
   gold voice; UK-appropriate, age-appropriate everything.
7. **Rewards are DERIVED, never stored.** `src/utils/treasureTrail.js` computes rewards
   from synced progress. Do not persist reward state; do not break merge monotonicity
   (more effort must never mean fewer rewards).
8. **Teacher/admin surfaces are calm.** Child styling lives in
   `src/styles/student-vibrant.css` (imported LAST, wins the cascade) and is scoped to
   child surfaces. Never let playful styles leak into teacher/admin/assessment views.
9. **Keep the knowledge graph current:** answer codebase questions via
   `graphify query "<question>"` when `graphify-out/graph.json` exists, and note that
   the post-commit hook rebuilds it automatically.
10. **Git discipline:** never force-push, never rewrite history, never delete files you
    did not create this session. New docs go in `docs/`. Remove `.DS_Store` before the gate.

### The verification gate (every loop ends with this)

```bash
cd /Users/benjaminbowler/Desktop/LiteracyPath && rm -f .DS_Store && rm -rf dist && npm run build && npm run test:unit && npm run lint && npm run check:approved-runtime-sources && npm run check:distractor-onset-giveaway && npm run audit:app-image-inventory && npm run check:media-overwrite-risk && npm run check:repo-hygiene && echo "✅ ALL FINAL CHECKS PASSED"
```

Requirements: build ✓, tests 0 fail, lint **0 errors** (warnings tolerated), every
check script PASS. If anything fails: fix, re-run, repeat until the ✅ prints.

### The push (only after the ✅)

```bash
cd /Users/benjaminbowler/Desktop/LiteracyPath && git add -A && git commit -m "<one-line summary of the loop>" && git push
```

Vercel deploys automatically on push. If `git push` times out, run `git push` again.

### Shared loop protocol (applies to all 10)

1. **Inspect first** — read the relevant code/tests/docs before changing anything.
   Use `graphify query` for orientation. List what you found and what you'll change.
2. **Fix root causes**, not symptoms.
3. **Add or extend a unit test** in `tests/unit/` that locks in each behavioural fix,
   so the improvement can't silently regress. Pure logic goes in testable modules
   (`src/utils/`, engine files), not buried in components.
4. **Self-verify visuals** — you cannot ask a 5-year-old. Render the thing (build an
   HTML preview in `docs/previews/`, or screenshot via a browser tool) and LOOK at it
   before declaring it good. For anything subjective (does this sound right? look
   right?), produce a one-page preview file Benjamin can open and check in 60 seconds.
5. **Run the gate. Push. Summarize** in 5 lines what changed, what was verified, and
   what (if anything) needs Benjamin's eyes/ears.

---

## PART B — THE TEN LOOPS

---

### LOOP 1 — Educational content accuracy & curriculum integrity

**Goal:** every letter, sound, word, sentence, question, and worksheet a child sees is
phonically correct, matches its cycle, and never assumes untaught knowledge.

1. Map the curriculum: read `src/data/elSkillsBlockCycles.js` and the quest engine
   (`src/components/elQuest/elQuestEngine.js`). Note what each cycle 1-27 teaches and
   the taught-graphemes-so-far progression.
2. Audit for violations, cycle by cycle: rounds using letters/words not yet taught;
   distractors that give the answer away; questions with zero or multiple right
   answers; word banks containing non-decodable or inappropriate words; worksheet
   content that doesn't match its cycle; short vowels taught as letter names.
3. For every violation: fix the generator/data (smallest change), then add a unit test
   that scans ALL cycles for that class of violation (see
   `tests/unit/gamePlaythroughs.test.js` for the pattern — tests iterate every cycle
   and assert winnability/correctness).
4. Check cross-surface consistency: the same cycle must teach the same content in the
   quest, the learn decks (`learnDeckBuilder`), the worksheets, and the games.
5. Anything requiring new recorded audio or art: write a request doc in `docs/`,
   block the bad asset if one is live, and move on.
**Definition of done:** an itemised violations-found/violations-fixed table, every fix
covered by a test, gate green.

---

### LOOP 2 — Visual design & style polish (kill the slop)

**Goal:** child surfaces look like a world-class kids app (Raz-Kids / Teach Your
Monster tier); teacher surfaces look clean and professional. No generic
"AI-generated admin panel" styling anywhere.

1. Read the style architecture first: `src/styles/lg-design-system.css` and
   `pal-worlds.css` load via App.css; `src/styles/student-vibrant.css` is the
   final-word child layer imported last in main.jsx. If design-taste skills are
   installed (`.claude/skills/design-taste-frontend`, `high-end-visual-design`,
   `redesign-existing-projects`), read and apply them.
2. Screenshot/render each child surface (home, quest map, stations, rounds, arcade,
   game player, rewards den, phonics learn, guided reading) at 1366×768 (projector),
   1024×768 (iPad landscape), and 1920×1080. Look at every one.
3. Hunt specifics: narrow columns on wide screens; inconsistent radii/shadows/spacing;
   default-looking buttons; illegible or timid type (child text should be big, Fredoka
   display face); dead whitespace; misaligned grids; hover states that jump or clip;
   overflow/scroll where a screen should fit.
4. Fix in the correct layer (usually student-vibrant.css), scoped so teacher views are
   untouched. Respect existing `--kid-*` tokens; extend them rather than hardcoding.
5. Re-render the same screenshots after; compare before/after; write both sets to
   `docs/previews/` so Benjamin can see the diff.
**Forbidden:** touching character art, changing information architecture, restyling
teacher/assessment surfaces playfully.
**Definition of done:** before/after previews for every surface touched, gate green.

---

### LOOP 3 — Game quality, fairness & juice

**Goal:** every game is winnable, coaches mistakes, feels alive, and pays into the
reward system.

1. Inventory games: `GAME_LIST` in `src/data/learnGamesData.js`, components in
   `src/components/learn/games/games/`, round builders in `src/utils/` (e.g.
   `adventureRounds.js`) and the quest engine stations.
2. For each game verify, with unit tests that iterate every difficulty many times:
   every round is winnable; the target is always among the choices; no duplicate
   choices; sort/classify items are decidable from what the child can see/hear; no
   round depends on blocklisted audio; rounds never come out empty.
3. Verify the play feel in code + render: correct answers give instant visible payoff
   (pop/sparkle/plank/flower within 150ms); wrong answers coach (replay the cue, let
   the child retry) rather than punish; double-taps can't double-count (answer locks);
   completion pays stars/gems via the standard `onComplete` contract so the Treasure
   Den and daily missions pick it up.
4. Compare against Teach Your Monster / Raz-Kids patterns: does each game have a
   visible "thing you built" by the end? If a game is pure quiz with no world, propose
   (don't silently rebuild) a re-theme.
5. Add missing juice cheaply: CSS keyframe celebration moments, streak effects,
   `prefers-reduced-motion` fallbacks for decorative (not teaching) motion.
**Definition of done:** playthrough-style tests cover every game, felt-experience
checklist filled per game, gate green.

---

### LOOP 4 — Motion, animation & "wow" moments (including 3D-style flourishes)

**Goal:** polished, performant animation that makes key moments feel magical, on
school-grade hardware.

1. Audit existing motion: letter-writing animation (`letterStrokes.js` +
   `LetterWriter.jsx`), sparkles, map pulse, den, game celebrations. Screenshot or
   record each; check that TEACHING animation (letter strokes) always plays even with
   macOS Reduce Motion on, while decorative motion respects it.
2. Upgrade the top 3 emotional moments first: cycle completion, treasure/gem award,
   quest-map progression. Techniques allowed: CSS 3D transforms (perspective,
   rotateX/Y — e.g. a treasure chest that opens), layered parallax on the quest map,
   SVG path animation, particle bursts via CSS/canvas. Keep each effect < ~150 lines
   and GPU-cheap (transform/opacity only; never animate layout properties).
3. Heavy 3D (Three.js/WebGL) only as a lazy-loaded, feature-detected enhancement that
   falls back cleanly — the app must stay fast on old school laptops. Measure: no
   animation may hold the main thread > 16ms/frame; test with CPU throttling.
4. Every new animation: verify by rendering it (HTML preview in `docs/previews/` or
   screenshot), check it at 1366×768, confirm reduced-motion behaviour, and keep it
   out of teacher surfaces.
**Forbidden:** animation that delays a child's ability to answer, autoplaying motion
loops on content screens, anything that drops the bundle-size or frame budget.
**Definition of done:** before/after recordings/previews, frame-budget note, gate green.

---

### LOOP 5 — Art & image pipeline (audit + request docs, never overwrite)

**Goal:** every image slot filled, on-style, and QA-clean — with new art requested
properly, never self-generated over approved media.

1. Run `npm run audit:app-image-inventory` and read
   `docs/validation/app_image_inventory_audit.json`. Cross-reference code references
   vs files on disk: list missing images (referenced but absent), orphans (present but
   unreferenced), and wrong-format files (non-webp in app areas).
2. Spot-check on-screen: broken image icons, stretched/squashed aspect ratios, images
   with baked-in text, off-style art (violates: realistic-cartoon, no rainbows, no
   faces on objects, not babyish).
3. For every missing/rejected asset, write ONE consolidated request doc
   `docs/ART_REQUEST_<date>.md`: exact target path, dimensions, format (webp), art
   direction sentence, and the scene description. Precise enough that an image tool or
   artist can fulfil it without questions.
4. Where code references a missing image, add a graceful fallback (onError hide, or a
   themed placeholder) so nothing renders broken in the meantime.
5. Check alt text: meaningful images need real alt text; decorative ones need
   `alt=""` + `aria-hidden`. Fix inline.
**Forbidden:** writing anything into `public/` media folders, generating replacement
art directly, deleting "orphan" media (flag it; the import pipeline may own it).
**Definition of done:** inventory table, request doc, fallbacks in place, gate green.

---

### LOOP 6 — Audio integrity (the ear-check loop)

**Goal:** no child ever hears a wrong sound. Every audio path either plays a verified
human recording or falls back silently/to a word cue.

1. Read `src/data/knownBadWordAudio.js` (word blocklist + path blocklist) and the
   resolver chain (quest engine `graphemeAudioPath`/`wordAudioPath`,
   `learnGamesAudio`). Understand: blocked path → resolver skips → next good copy or
   silence. THE BLOCKLIST IS LOAD-BEARING — while letter audio is blocked awaiting
   human re-recording, do not unblock anything without a human ear-check.
2. Regenerate the ear-check page `docs/previews/letter_audio_audit.html` (buttons that
   play each letter sound/name and short words) so Benjamin can audit in 5 minutes.
   If new recordings have arrived (e.g. the wife-recording per
   `docs/RECORDING_SCRIPT.md`): validate durations with ffprobe (0.2s-3s), split on
   silences, normalise loudness, compress to match the existing bank (~48-64kbps mono
   mp3), copy with hash verification to every target path, THEN regenerate the
   ear-check page and STOP — Benjamin ear-checks before the blocklist is cleared.
3. Sweep for orphan audio references (code → missing mp3) and silent-failure spots
   (play() with no fallback). Add word-cue fallbacks where a station would otherwise
   be mute.
4. Extend tests: no game round may TARGET a blocklisted word; resolvers must never
   return a blocklisted path; when the blocklist is empty, letters must resolve
   (see `tests/unit/elQuestEngine.test.js` and `knownBadWordAudio.test.js`).
**Forbidden:** TTS/AI-generated phonics audio, clearing blocklist entries without an
explicit human "the new clips pass" message, overwriting media without hash-verified
import + a dedicated media commit.
**Definition of done:** ear-check page current, tests green, gate green.

---

### LOOP 7 — Performance & code health

**Goal:** fast first load on school hardware; codebase that stays easy to change.

1. Baseline: run the build, record the bundle table. Current known issue: several
   chunks > 1MB (generated word banks, audio manifest, index). Record dist total.
2. Code-split the biggest wins WITHOUT changing behaviour: lazy-load admin/teacher
   surfaces and heavy export libs (already partly done — verify); dynamic-import the
   giant generated banks so a child's first paint doesn't pay for assessment data;
   ensure route-level lazy() for every page-sized component.
3. ESLint: keep 0 errors; then burn down warnings (exhaustive-deps ones carefully —
   only "fix" a dependency array when you can PROVE no behaviour change; otherwise
   leave it and note why).
4. Dead code: find unused exports/components/CSS (grep + graphify), list them, delete
   only what is provably unreferenced, run the gate after each deletion batch.
5. Re-measure: bundle table before/after in the summary. Never trade correctness for
   size; never remove the prebuild manifest generation.
**Definition of done:** measurable size/structure improvement, tests still 100%, gate green.

---

### LOOP 8 — Testing & resilience hardening

**Goal:** widen the safety net so future changes (by any model) can't break the app
undetected.

1. Coverage inventory: list `tests/unit/*.test.js`, map which modules have no tests.
   Priority order: anything educational (round builders, curriculum data), progress
   sync/merge (`storyQuestProgress`, monotonic merges), rewards derivation, then utils.
2. Write tests in the house style: pure-function tests, iterate ALL cycles/difficulties
   with repetition for randomised builders, assert invariants (winnable, decidable,
   monotonic, deterministic-where-promised) rather than snapshots.
3. Resilience sweeps: what happens with empty/corrupt localStorage, offline Supabase,
   a missing audio/image file, an unknown cycle number, double-tapped buttons? Each
   should degrade gracefully — add guards + tests where they don't.
4. Add invariant tests for the fundamentals in PART A: rewards monotonicity, blocklist
   respected everywhere, child prompts say "tap", no `generated:` audio sources, quest
   rounds never empty. These make the rules self-enforcing for future sessions.
5. Keep the suite fast (< 60s) and deterministic — seed or repeat randomised tests,
   never test wall-clock timing.
**Definition of done:** test count meaningfully up, every new test failing-before/
passing-after where it locks a fix, gate green.

---

### LOOP 9 — UX flows, onboarding & accessibility

**Goal:** a 5-year-old can drive the child mode alone; a teacher can do every weekly
job in minimal clicks; the app meets baseline accessibility.

1. Walk the child journey end-to-end (render every step): login → home → start
   today's quest → complete a station → see reward → rewards den → back. Count taps,
   note every moment a child could be lost (no obvious next action, text-only
   instruction with no audio/icon, dead ends without a "home" escape).
2. Walk the teacher journey: pick class → run a lesson deck on the projector → check
   progress → print worksheets → review assessment. Note friction and fix the top items.
3. Accessibility sweep on child surfaces: tap targets ≥ 44px (prefer 64px+ for kids);
   text contrast ≥ 4.5:1; focus states visible; all interactive elements are real
   `<button>`s; aria-labels on icon-only buttons; keyboard-navigable teacher surfaces.
   Fix inline; test what's testable (e.g. a unit test that scans built markers/CSS
   tokens for minimum sizes if patterns allow).
4. Empty/edge states: brand-new student with zero progress, a class with no students,
   a finished student — every state should look intentional and encouraging, never
   blank or broken.
5. Verify with before/after renders in `docs/previews/`.
**Forbidden:** restructuring navigation or renaming teacher concepts without asking.
**Definition of done:** tap-count/friction table before/after, fixes verified
visually, gate green.

---

### LOOP 10 — Market research & product saleability

**Goal:** know exactly where LiteracyPath stands against paid competitors and ship the
highest-leverage parity/differentiation items — plus keep the "sellable product"
surface (positioning, onboarding, trust) sharp.

1. Research (web): current state of Raz-Kids, Teach Your Monster to Read, Starfall,
   Khan Kids, Duolingo ABC, Reading Eggs — features, pricing models, what teachers
   praise/complain about in reviews. Update `docs/COMPETITOR_NOTES.md` with dated
   findings.
2. Gap analysis: list the top 10 gaps (features they have that matter) and top 5
   differentiators (what LiteracyPath does better — e.g. UK phonics fidelity, teacher
   projector mode, human-recorded audio). Rank by impact-for-effort.
3. Ship the top 1-2 SMALL gap-closers this loop (a feature that fits in one session,
   built with tests, per all fundamentals). Bigger items: write a one-page spec in
   `docs/` for a future loop instead of half-building them.
4. Saleability surface: audit the first-run experience as a NEW teacher/parent would
   see it — is the value obvious in 60 seconds? Is there a demo path with sample data?
   Write/refresh `docs/MARKET_READINESS.md` with a scored checklist (content quality,
   polish, onboarding, trust/safety, pricing-readiness) and a verdict.
5. Nothing in this loop may weaken fundamentals: no dark patterns, no engagement
   mechanics that pressure children (no lives/timers that punish), COPPA/GDPR-K-aware
   handling of any child data ideas.
**Definition of done:** updated competitor notes + readiness scorecard, 1-2 shipped
improvements with tests, gate green.

---

## PART C — QUICK REFERENCE

| # | Loop | One-liner |
|---|------|-----------|
| 1 | Educational accuracy | Every sound/word/question correct for its cycle, test-enforced |
| 2 | Visual design polish | World-class kids-app look, teacher surfaces calm |
| 3 | Game quality & juice | Winnable, coaching, rewarding, alive |
| 4 | Motion & wow moments | Polished animation/3D flourishes, performance-safe |
| 5 | Art & image pipeline | Audit slots, request docs, never overwrite |
| 6 | Audio integrity | Ear-check loop; human recordings only; blocklist sacred |
| 7 | Performance & code health | Smaller bundles, cleaner code, zero regressions |
| 8 | Testing & resilience | Widen the safety net; make fundamentals self-enforcing |
| 9 | UX & accessibility | Child-drivable, teacher-efficient, accessible |
| 10 | Market & saleability | Competitor parity, readiness scorecard, ship gap-closers |

**Every loop:** obey PART A → follow the shared protocol → gate → push → 5-line summary.
