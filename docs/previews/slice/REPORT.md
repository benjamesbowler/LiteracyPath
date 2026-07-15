# Sound Seekers Seedwake Vertical Slice Report

Date: 2026-07-15

## Outcome

All seven workstreams are DONE against the acceptance criteria in `docs/SOUND_SEEKERS_SLICE_LOOP.md`. No test was skipped, deleted, or weakened. No runtime function was stubbed, no asset path was invented, and no placeholder or browser speech fallback was added.

The complete live journey also passed: s1-s5, 20 guide beats, 13 encounters, 62 unique correct live stage selections, five completion-gated crossings, and the final equipped `stone-staff` ceremony. See `journey-report.json` and `seedwake-journey-complete.png`.

## Workstreams

### WS1 - DONE - Encounter camera

The encounter camera now derives a deterministic held pose from the live choice set and exact viewport. All active slice scenery is culled during answering, and camera-to-choice raycasts reject any solid first hit outside the target object.

Proof: `camera-report.json`, `slice-contact-sheet.jpg`, and every `s*-encounter-*-phone/ipad.{png,json}` file in this directory. `npm run check:quest-slice-camera` passed 26 encounter/view checks at 390x844 and 1194x834 with every projected box safe and every solid ray clear.

### WS2 - DONE - Five physical verbs

Seedwake now has five distinct live handlers: find-and-enter, jump-and-land, carry-and-deliver, place-in-sequence, and conduct-in-rhythm. Their input contracts and progression rules differ; delivery needs pickup then carry, and sequence/rhythm handlers reject invalid order.

Proof: `s1-verb-action.png` through `s5-verb-action.png`; `tests/unit/questSliceSystems.test.js`; the existing and strengthened Chapter One/physical-mechanics tests. The release validator reports five distinct trails and 27 physical tasks.

### WS3 - DONE - Locomotion and performances

Movement is dt-driven with acceleration, heading easing, banked turns, coast/deceleration, and a stable settle. Correct and wrong results select stop-specific resident success/recovery clips and drive visible character motion.

Proof: `locomotion-turn-before.png`, `locomotion-turn-banked.png`, `locomotion-turn-settled.png`, `locomotion-evidence.json`, and the five verb action frames. Recorded motion moves from speed 0/bank 0 to speed 1.134/bank 0.0548, then settles at speed 0/bank below 0.008. State-machine coverage is in `tests/unit/questSliceSystems.test.js`.

### WS4 - DONE - Gate, reward, and equipped gear

Every gate derives its open state from encounter completion. Stop rewards write earned gear into `creature.equipped`; the chapter ceremony renders the real cumulative creature, stars, stones/satchel state, relic, earned gear, and next trail before continuation.

Proof: `seedwake-gate-open.png`, `seedwake-reward-equipped.png`, `seedwake-journey-complete.png`, `journey-report.json`, and gear/gate assertions in `tests/unit/questProgress.test.js` and `tests/unit/questSliceSystems.test.js`.

### WS5 - DONE - Coherent environment kit

All Seedwake-authored model references are restricted to the explicit KayKit Medieval allowlist. Mixed Halloween, space, dungeon, and restaurant pulls were removed from s1-s5 while later stops remain untouched.

Proof: `s1-wide-ipad.png` through `s5-wide-ipad.png`; `SEEDWAKE_ASSET_ALLOWLIST` and `seedwakeAssetManifest()` in `src/data/threeAssetLibrary.js`; subset assertions in `tests/unit/questChapterOne.test.js` and `tools/checkQuestChapterOneRelease.mjs`. `node tools/stageUsedModels.mjs` resolved 89 files/2.76 MB.

### WS6 - DONE - Objective and reward HUD

During a physical encounter, the normal header, route meter, mission, and duplicate prompt are absent. The encounter HUD contains exactly two marked nodes: one replayable objective and one reward/progress readout. Both use icons/shapes plus text, fit the phone proof, and preserve accessible labels.

Proof: the phone encounter frames, the `hudNodes: 2` assertion in every camera JSON file, and the HUD contract test in `tests/unit/questSliceSystems.test.js`.

### WS7 - DONE - Phoneme slots and success feedback

Multi-grapheme bridge/echo tasks expose one visible slot per grapheme. Correct choices fill in order; wrong choices do not fill. Completion draws the slots together, presents a CSS-drawn non-colour check shape, announces the completed word through assertive `aria-live`, and requests whole-word recorded audio only when allowed by the existing audio contract.

Proof: `phoneme-slots-empty.png`, `phoneme-slots-fill-1.png`, `phoneme-slots-blend.png`, `phoneme-success-reduced-motion-phone.png`, and `accessible-success.json`. The reduced-motion/muted proof reports marker text, an assertive announcement, reduced motion true, and muted true. Unit coverage is in `tests/unit/questSliceSystems.test.js`.

## New Files

- `src/utils/questSliceSystems.js`
- `tools/checkQuestSliceCamera.mjs`
- `tests/unit/questSliceSystems.test.js`
- `src/components/quest/world/questPremiumRender.js`
- `tests/unit/questPremiumRender.test.js`
- `public/fonts/quest/helvetiker_bold.typeface.json`
- `docs/previews/slice/REPORT.md`
- All PNG, JPG, and JSON evidence files in `docs/previews/slice/`

`docs/SOUND_SEEKERS_SLICE_LOOP.md` is the supplied brief, not generated implementation output.

## Test Coverage Changed

- New: `tests/unit/questSliceSystems.test.js`
- New: `tests/unit/questPremiumRender.test.js`
- Strengthened: `tests/unit/questChapterOne.test.js`
- Strengthened: `tests/unit/questPhysicalMechanics.test.js`
- Strengthened: `tests/unit/questProgress.test.js`
- Strengthened: `tests/unit/questRouteGraph.test.js`
- Existing full-playthrough coverage remained green through all 40 stops.

## Gates

- `npm test`: PASS, 438/438, 0 skipped
- `npm run lint`: PASS, 0 errors; 19 pre-existing warnings outside this slice
- `npm run check:quest`: PASS; 16 known later-trail recordings remain intentionally silent
- `npm run check:quest-3d`: PASS, 12 rigged characters and 7 scenery models
- `npm run check:quest-art`: PASS, 43 images
- `node tools/stageUsedModels.mjs`: PASS, 89 referenced files/2.76 MB
- `node tools/checkQuestChapterOneRelease.mjs`: PASS
- `npm run check:quest-slice-camera`: PASS, 26/26 encounter/view checks
- `npm run build`: PASS, 831 modules
- `git diff --check`: PASS

The added package gate is `check:quest-slice-camera`.

## Repository Safety

`.gitignore` still excludes `/public/models/library/`. The local pick-from library remains about 71 MB, while the release stager resolves only 2.76 MB of referenced files. `git status` reports zero changes under that directory, so this work does not add the 71 MB library to a commit. The repository already tracks its previously staged used subset; this task did not alter it.

## Self-Critique

Child: Accept - the next action is concise, choices are clear, reactions are kind, the route continues through all five gates, and success remains unmistakable without sound or colour.

Teacher: Accept - the live sequence exposes ordered grapheme construction, replayable audio cues, non-punitive retry state, and mastery-safe progression without allowing an incorrect answer to fill a slot.

Designer: Accept for this slice brief - camera, interaction language, HUD hierarchy, motion, kit coherence, and payoff now form one directed experience; the low-device proof tier remains intentionally simpler than the rich renderer and should not be used as the final premium-art benchmark.
