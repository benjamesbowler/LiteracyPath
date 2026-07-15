# Sound Seekers — Vertical Slice: Loop to Completion

**To the agent (Codex):** This is a loop-to-completion brief, not a task list. You do not stop when the code compiles. You stop when every acceptance test in every workstream passes **and you have produced the named proof for each**. If you cannot produce a proof, the workstream is not done — say so, in those words, and keep going.

Read this whole document before you touch a file. Then read the four ground-truth files named below. Do not begin until you have.

---

## The one rule that governs all others

**No workarounds, no fakery, no hallucination.** Concretely, all of the following are failures, not shortcuts — if you do any of them the work is rejected:

- A function that returns a hardcoded `true`, a stubbed value, or an empty array to make a caller pass.
- A test that asserts nothing, is skipped, is deleted, or is weakened to go green. Tests get *stronger* in this work, never weaker.
- A `// TODO`, `// for now`, `// placeholder`, `// simplified`, or a commented-out block left in shipped code.
- Referencing a file, model, audio clip, function, or prop that you have not verified exists on disk. If you need an asset that isn't there, **stop and say so** — do not invent a path.
- Claiming a visual or interactive result you have not seen rendered. "It should look right" is not proof. A screenshot or a headless render assertion is.
- Widening scope to the other 35 stops to look productive. The slice is the slice.
- Committing `public/models/library/` (71 MB). It is gitignored; keep it that way.

If a task turns out to be impossible as specified, **write down why, in the report, with the evidence** — do not fake completion. An honest "6 of 7, and here is exactly where #7 is blocked" is a success. A dishonest "all done" is the single worst outcome, because someone builds on your word. (The last automated pass claimed `trail-run`, `retire()` and gear equip were finished; none were. Do not repeat that.)

---

## Architecture ground truth — read before coding, do not re-derive

- **App:** Vite 8 (Rolldown) + React 19. Bundler config in `vite.config.js`.
- **The quest 3D scene is hand-written imperative Three.js (r0.185) inside a React component.** It is **NOT** React Three Fiber. `src/components/quest/world/QuestHub.jsx` news up `THREE.WebGLRenderer` directly, builds the scene graph by hand, runs its own `requestAnimationFrame` loop, raycasts, and disposes on unmount.
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` are installed but **imported nowhere**. Do not use them. Do not write `<Canvas>` or `useFrame`. If you touch dependencies, remove them; never add R3F code.
- **React is the HUD layer only.** DOM overlays are positioned each frame by `projectElement()` projecting world coords through the camera. The scene and the HUD talk through refs, not re-renders.
- **Post-processing** is the raw `postprocessing` package (`EffectComposer`, Bloom, Vignette, SMAA, SSAO).
- **Models** load via `three/addons/loaders/GLTFLoader.js`. Only ~2.4 MB of `public/models/library/` is referenced; the rest is a local pick-from dump.

**Read these four files fully before writing anything:**
1. `src/components/quest/world/QuestHub.jsx` — the renderer, camera, loop, raycast, HUD projection.
2. `src/utils/questPhysicalMechanics.js` — `buildPhysicalTask`, `physicalStage`, the per-encounter verbs.
3. `src/utils/questEncounters.js` + `src/utils/questHub.js` — how a stop becomes encounters and a walkable section.
4. `src/data/questChapterOne.js` — the Seedwake slice spec (s1–s5), collectibles, repairs, mechanics.

---

## The slice

**The slice is Chapter One: "Seedwake" — stops s1, s2, s3, s4, s5**, from the child's first entry (creature creator → Den → walk) through the **first gate** at the end of the chapter, and the reward/transition that follows it.

This is the child's first ten minutes. It is the only thing a new player judges the game on. **Perfect it.** Do not spread effort across s6–s40. You may edit shared code (QuestHub, questPhysicalMechanics, HUD, camera) — that is expected — but every *authored* asset, tuning value, and performance you add is for s1–s5 only, and you must not regress s6–s40 (the full-trail tests must stay green).

**Scope fence:** if a change helps the slice but breaks a later stop, gate it by stop/chapter, don't break the later stop. If you find yourself authoring content for s6+, stop — that's out of scope.

---

## The loop protocol

Work one workstream at a time, in the order below (each depends on the last). For each:

1. **Build** it to the acceptance criteria — fully, no stubs.
2. **Prove** it — produce the named proof artifact and look at it. A render proof means you actually captured the frame and inspected it, not that you expect it to be fine.
3. **Self-critique** — open the proof and ask "would a 5-year-old, a teacher, and a designer each accept this?" Write one honest sentence per lens. If any is "no", you are not done — return to step 1.
4. **Regression** — run the global gates (below). All green, or you fix what you broke before moving on.
5. Only then advance to the next workstream.

After all seven, run the whole slice end to end once more and re-verify every proof still holds (later workstreams can break earlier ones). Then write the report.

**Global gates — must be green after every workstream, no exceptions:**
```
npm test
npm run lint
npm run check:quest
npm run check:quest-3d
npm run check:quest-art
node tools/stageUsedModels.mjs      # must exit 0: no referenced model missing from disk
npm run build
```
If a gate has no coverage for what you built, **add the test** — that is part of the workstream, not optional. A feature with no gate is a feature that will silently rot; you are here because that already happened once.

---

## Workstream 1 — Encounter camera: guarantee an unobstructed answer

**Intent:** When a child is asked to choose (tap a flower, feed a beast, lay a plank), every choosable object must be fully visible, unoccluded, and comfortably inside the safe area on both a phone (portrait, ~390px) and an iPad (landscape). Today the free-roam camera can leave a choice behind a tree, off-screen, or under the HUD.

**Build:** An encounter-camera system in `QuestHub.jsx`. On entering an encounter, the camera moves to an authored framing for that encounter kind that places all `task.items` within a defined safe rectangle, raises them clear of scenery (or fades/culls occluders between camera and choices), and holds still while the child answers. On resolve, it returns to travel framing. Movement is eased, not cut.

**Acceptance criteria:**
- For every encounter kind in the slice (flower-patch, hungry-beast, broken-bridge, echo-cave, and the Seedwake field tasks used in s1–s5), every choice object's projected screen position sits inside the safe area with no overlap with HUD chrome, at both 390×844 and 1194×834.
- No choosable object is occluded by scenery at answer time (verify by raycast from camera to each choice — the first hit is the choice, not a tree).
- Camera is stationary (± a tiny idle drift) during answering; no choice enters or leaves frame while a child is deciding.

**Proof:**
- Add `tools/checkQuestSliceCamera.mjs` (headless, SwiftShader, like `checkQuestRouteVisual.mjs`) that, for s1–s5 at both viewports, drives to each encounter and asserts: (a) every choice's projected rect is inside the safe area, (b) camera-to-choice raycast hits the choice first. It must exit non-zero on violation. Wire it into package.json as `check:quest-slice-camera`.
- Captured screenshots of each encounter at both viewports, saved under `docs/previews/slice/`, that you have opened and confirmed show every choice clear.

---

## Workstream 2 — One genuinely different physical verb per Seedwake task

**Intent:** The five Seedwake stops must each be a *different thing the body does*, not five reskins of "walk into the right one." `questChapterOne.js` already declares a distinct `mechanic` per stop; the physical layer must actually deliver five distinct verbs.

**Build:** In `questPhysicalMechanics.js` (and the encounter views), implement five distinct interaction verbs across s1–s5 — e.g. *find-and-enter*, *carry-and-deliver*, *place-in-sequence*, *catch-in-order*, *sort-into-pens* (map to the mechanics Chapter One declares; do not invent new curriculum). Each verb must feel and control differently, not merely relabel the same tap.

**Acceptance criteria:**
- The existing Seedwake validator (the check in `questChapterOne.js` that rejects a repeated `mechanic`, `collectible`, or `repair`) passes with five genuinely distinct mechanics.
- No two of the five stops resolve their answer through the identical input path. Prove distinctness structurally: each stop's task exposes a different `verb` id, and a test asserts the five ids are unique and each maps to a different handler.
- Every verb is completable by a keyboard-only player and a touch-only player (see WS1 safe area + WS7 feedback).

**Proof:**
- A unit test in `tests/unit/` asserting: five stops, five distinct `verb` ids, each with a non-stub handler (assert the handler is a function of non-trivial length or, better, assert its observable behaviour differs — e.g. sequence verb rejects out-of-order input, catch verb is time-ordered, sort verb needs two pens).
- A short captured clip or frame sequence per stop under `docs/previews/slice/` showing the five different actions. Confirm by viewing.

---

## Workstream 3 — Authored locomotion, turns, reactions, resident performances

**Intent:** The Beastie and the residents must feel *alive and directed*, not slide along a spline. Today motion is procedural drift.

**Build:** Authored motion in the character system (`buildTrailCharacters` / `updateTrailCharacters` / `updateCharacterMotion` in `QuestHub.jsx`): real locomotion (accel/decel, a settle on stop), banked turns when the path curves, reactions on correct/incorrect (a hop on right, a flinch-and-recover on wrong — never a punishing one), and a short authored **resident performance** at each of the five encounters (the resident does something in-world when you arrive and when you succeed — waves you over, celebrates, repairs their landmark).

**Acceptance criteria:**
- Locomotion has visible acceleration and deceleration, not constant velocity; the Beastie faces its travel direction and banks into curves.
- On a correct answer the active resident plays a distinct success performance; on a wrong answer, a gentle non-punitive reaction, then a re-cue. These are authored per resident for the five stops, not one shared shrug.
- Reactions are driven by the answer result, verifiable in code (a test asserts correct→success-clip, wrong→recover-clip).
- Nothing here is frame-rate-dependent to the point of breaking on a slow device (use dt).

**Proof:**
- A unit test over the motion/reaction state machine: given a correct/incorrect result and a turn in the path, the expected clip/heading is selected.
- Captured before/after frames of a turn and of a success reaction under `docs/previews/slice/`, viewed and confirmed.

---

## Workstream 4 — Redesign the first gate as a reward + transition sequence

**Intent:** The first gate (end of Chapter One) is currently a plain section handoff. It should be the memorable payoff of the first ten minutes: the child sees what they built (stones lit, gear earned), the gate opens as a *consequence*, and the world visibly hands off toward what's next.

**Build:** An authored gate sequence at the slice's end: the collected Seedwake repairs visibly complete, the reward moment plays (this is where the real `RewardScreen` content belongs — stars landing, stones arriving, **the earned gear actually worn** — reuse it, do not rebuild a toast), the gate opens with weight, and a short transition frames the next chapter. It must read as earned, not automatic.

**Acceptance criteria:**
- Reaching the gate with the chapter complete plays the reward beat **before** transition — the child sees stars + any newly lit stones + the creature wearing gear it earned.
- **Earned gear is worn on the creature in this sequence** (this closes the standing "gear is earned but never equipped" bug for the slice — `creature.equipped` is written and rendered; do not fake it with a static image).
- The gate opening is caused by completion, not a timer; the transition names/points to the next chapter.
- Copy is voiced or wordless where a non-reader must understand it (see WS7).

**Proof:**
- A test asserting: at slice completion, the reward payload contains the earned gear id and it is present in `creature.equipped`; the gate `open` state is a function of chapter completion.
- Captured frames of the reward beat and the gate opening under `docs/previews/slice/`, viewed and confirmed to show worn gear and lit stones.

---

## Workstream 5 — One coherent authored environment kit

**Intent:** The slice currently mixes kit sources (medieval windmill next to halloween tree next to space parts). Chapter One must look like **one place, authored on purpose.**

**Build:** Curate a single coherent environment kit for Seedwake (s1–s5) — one consistent set of trees, ground, path, props, landmarks, palette and lighting that belong together. Wire s1–s5 to it. Remove the mismatched pulls for the slice. Keep everything CC0 and keep `check:quest-3d` / `check:quest-art` green.

**Acceptance criteria:**
- Every model, prop and texture used across s1–s5 comes from the curated slice kit; no cross-theme intruders (no space/halloween/dungeon assets in the meadow slice unless deliberately restyled to belong).
- The palette and lighting are consistent stop-to-stop across the five; transitions between stops don't jarringly reskin.
- `node tools/stageUsedModels.mjs` still resolves every referenced model to a file on disk (exit 0), and the kit stays inside the size budget in `docs/3D_ASSET_LIBRARY.md`.

**Proof:**
- A test/manifest listing every asset the five stops reference, asserting each belongs to the declared slice kit set (maintain an explicit allowlist for the slice; assert referenced ⊆ allowlist).
- Captured wide frames of all five stops under `docs/previews/slice/`, viewed together, that read as one world.

---

## Workstream 6 — Simplify the HUD to objective + essential reward only

**Intent:** The HUD must show the child exactly one thing to do and one thing they're earning — nothing else competing for a 5-year-old's attention.

**Build:** Reduce the in-world HUD for the slice to: (1) the immediate objective (what to do now, voiced/iconic), and (2) the essential reward readout (progress toward the stop's payoff). Remove or fold away everything else during play (debug text, redundant labels, secondary counters). Keep it legible at 390px.

**Acceptance criteria:**
- During an encounter, the HUD shows the current objective and the reward indicator, and no third competing element.
- Nothing in the HUD requires reading to understand the *action* (icon + audio carry it); text is reinforcement, not the only channel.
- Objective and reward elements meet a real tap/scale/contrast bar (objective text ≥ the slice's minimum legible size; reward icons clear at 390px).

**Proof:**
- A DOM test asserting that, in encounter state for s1–s5, exactly the objective and reward nodes are present in the HUD region (assert others absent).
- Captured phone-viewport frames under `docs/previews/slice/`, viewed, confirming a clean two-element HUD.

---

## Workstream 7 — Visible phoneme slots, blending progression, stronger success feedback

**Intent:** The child must *see the sounds build into the word*. Blending is the point of the whole product and it is currently invisible. Success must feel unmistakable through more than colour.

**Build:**
- **Visible phoneme slots:** in the word encounters (broken-bridge / echo-cave) and wherever a word is built in the slice, render one slot per grapheme; as each sound is placed correctly it fills its slot, in order.
- **Blending progression:** after the slots fill, play an authored blend — the slots visibly draw together and the whole word is spoken as one, so the child hears sounds become a word.
- **Stronger success feedback:** multi-channel — motion + sound + an explicit non-colour marker (a check/shape, not red-vs-green alone) + `aria-live` announcement. It must be unmistakable with sound off, with reduced-motion on, and to a colourblind child. (This closes the "feedback is colour-only" finding for the slice.)

**Acceptance criteria:**
- A word built in the slice shows N slots for N graphemes; each fills on the correct sound, in order; a wrong sound does not fill a slot.
- The blend animation plays after completion and the whole-word audio fires (or, where the clip is a known gap, the slot sequence still completes and the missing audio is handled silently per the no-browser-TTS rule — never a wrong clip).
- Success is conveyed by ≥3 independent channels; with `prefers-reduced-motion` set and sound muted, a non-colour success marker is still present and an `aria-live` region announces the result.

**Proof:**
- A DOM/unit test: N graphemes → N slots; correct fills in order; wrong doesn't; on completion the success marker node and `aria-live` text are present with motion disabled and sound stubbed.
- Captured frames of the slot fill and the blend moment under `docs/previews/slice/`, viewed and confirmed.

---

## Definition of done — every box checked, each with its proof

- [ ] WS1 Encounter camera — `check:quest-slice-camera` exits 0 at both viewports; screenshots viewed
- [ ] WS2 Five distinct verbs — Seedwake validator green; uniqueness test; five clips viewed
- [ ] WS3 Authored motion/reactions/performances — state-machine test; turn + reaction frames viewed
- [ ] WS4 First gate reward+transition — earned gear written to `creature.equipped` and rendered; reward-before-transition test; frames viewed
- [ ] WS5 One coherent kit — referenced ⊆ slice allowlist test; `stageUsedModels` exit 0; five wide frames viewed as one world
- [ ] WS6 Minimal HUD — two-element DOM test; phone frames viewed
- [ ] WS7 Phoneme slots + blend + multi-channel success — slot/blend/feedback tests incl. reduced-motion + muted; frames viewed
- [ ] All global gates green (test, lint, check:quest, check:quest-3d, check:quest-art, stageUsedModels, build)
- [ ] Full slice played end to end once more; all proofs re-verified
- [ ] `public/models/library/` still untracked/gitignored; no 71 MB in the commit

## Report contract (write this at the end, honestly)

For each of the seven workstreams: **DONE / PARTIAL / BLOCKED**, the proof artifact path, and — if not DONE — exactly what remains and why, with evidence. List every new file, every new test, every gate added. If you stubbed, faked, or skipped anything, say so here plainly; a disclosed gap is recoverable, a hidden one is not. End with the one-sentence-per-lens self-critique (child / teacher / designer) for the slice as a whole.

Do not report a workstream DONE unless you have opened its proof and it holds.
