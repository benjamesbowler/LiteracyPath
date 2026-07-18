# Arcade Area — Full Review & Recommendations

**Scope:** `src/components/learn/games/` — 11 arcade-tier games, 9 practice games (2 shared engines), the hub/player shell, styles, and asset pipeline.
**Method:** 15 parallel specialist reviewers, one per game/engine plus hub infrastructure and an asset audit. All Critical claims below were independently re-verified against the code.
**Date:** 2026-07-18

---

## 1. Executive Summary

The arcade is in good shape *technically*: every game honors the GamePlayer contract, teardown hygiene is generally excellent, level generators are deterministic and several are unit-tested, distractor content is carefully curated (homophone-aware onset filtering, true-rhyme families), reduced-motion support is common, and the audio pipeline (recorded-voice-or-silence with a known-bad quarantine) is genuinely thoughtful.

But there is one overwhelming educational problem and a cluster of systemic issues:

> **The arcade's flagship phonics games are silent.** Eight of the eleven arcade games never speak a single word, phoneme, or sentence — despite `speak()`, `speakWord()`, `speakLetterSound()`, and 43 recorded phonemes already existing in the app. "Catch beginning sounds", "Hear and pop rhyming words", "Tap and blend sounds to the beat" are all playable — and winnable — as pure visual letter-matching, bypassing the very skills they claim to teach, and locking out pre-readers entirely.

Alongside that:

- **Answers are telegraphed visually** in six games (glowing gates/trees/critters, ALL-CAPS decoys, answer-flash rings), so children can win without reading.
- **The star rubric degenerates** almost everywhere: completion forces 100% accuracy (1 star unreachable), while in other games one slip costs a star, and dexterity errors are graded as literacy errors.
- **Six Critical bugs**, including a death-loop, a resume flow that silently discards finished runs, and a mathematically impossible 3-star target.
- **~9,700 lines of duplicated engine code** across five near-identical files, one of which (1,667 lines) is completely orphaned, plus ~500 lines of dead CSS and ~20 MB of orphan assets shipped in `public/`.

### Scorecard

| Game | Score | One-line verdict |
|---|---|---|
| Rocket Run | 7/10 | Superb 3D engineering wrapping a hollow, silent letter-matching core |
| Letter Leap | 7/10 | Great platformer feel; **Critical respawn death-loop**; grades dexterity not spelling |
| Sound Racer | 7/10 | Real phonics content but glowing gates give answers away; 3,080-line file |
| Word Bridge | 7/10 | Solid tested generator; decoy casing cheat + broken narrow-screen sentences |
| Sound Beat | 6/10 | A rhythm game whose music is never synced to the beat — and never speaks |
| Rhyme Pop | 7/10 | Accurate rhyme content, but a "listen" game with zero audio |
| Sound Safari | 7/10 | Nice ordered-segmentation pedagogy that self-solves via highlights |
| Reel & Read | 6.5/10 | **Critical spawn-cull churn bug**; teaches non-morphemic word chunks |
| Sentence Grove | 6/10 | Correct trees literally glow a different color; wrong answers leak the answer |
| Sentence Express | 7/10 | Best pedagogy in the arcade; **Critical adapter bug discards resumed runs** |
| Grammar Grind | 6.5/10 | Ambiguous item punishes correct English; 3 stars ≈ perfect run |
| Practice engine (6 games) | 6.5/10 | **Memory mode: 3 stars mathematically impossible** on easy/medium |
| Adventure engine (3 games) | 7/10 | Warm coaching loop; input race can double-fire `onComplete` |
| Hub & shell | 6.5/10 | Good checkpoint/resume; win moment killed by mission auto-return |
| Asset pipeline | 6/10 | Graceful fallbacks, but ~20 MB orphans + missing art/music for 4+3 games |

---

## 2. Cross-Cutting Themes (fix these once, fix them everywhere)

### 2.1 🔇 The silence problem — the arcade's #1 educational issue
**Affected:** Rocket Run, Sound Racer, Word Bridge, Sound Beat, Rhyme Pop, Sound Safari, Reel & Read, Sentence Grove, Grammar Grind (+ Sound Sort Factory in practice).

Every one of these games imports only chime/buzz SFX. Target words, phonemes, rhymes, and sentences are shown only as text (often moving, often small) to an audience that includes non-readers. Examples:

- **Sound Beat** (a *blending* game): children see "sh / i / p" and tap, but never hear the phonemes or the blended word — beatable as pure whack-a-mole (`Ps1ArcadeGame.jsx`; `speakLetterSound`/`speakWord` exist unused at `learnGamesAudio.js:139`).
- **Rhyme Pop**: catalog says "Listen for the word, then pop every balloon that rhymes" — the target is only ever text (`RhymePopArcadeGame.jsx:1237-1239`). Rhyme *awareness* is an auditory skill; as built it's rime-spelling matching.
- **Rocket Run**: "catch words that start with the sound" — the sound is never pronounced; kids match first-letter shapes.
- **Sentence Grove / Grammar Grind**: sentences are never read aloud; easy tier targets 4–6-year-olds who cannot read them.

**Recommendation (arcade-wide standard):**
1. Speak the target word/sound/sentence at round start and on tap of a speaker button (reuse `speak()` from `learnGamesAudio.js`, as `GamePlayer.jsx:177` already does).
2. Speak each caught/popped/collected item as feedback.
3. Sound-off must mean a *visible text fallback* appears — not a silently dead button (Sentence Express currently hides the target sentence entirely with sound off; Word Rescue / Letter Garden have **no target at all** with sound off).

### 2.2 🎯 Answer telegraphing — children can win without reading
| Game | The giveaway |
|---|---|
| Sentence Grove | Correct trees get a different glow color + 2× brighter point light (`StarGalleryArcadeGame.jsx:1025-1028,1053,1076-1078`) — **Critical** |
| Sound Racer | Correct gates glow bright (opacity .9/emissive .45) vs dull gray wrong gates (`SoundRacerGame.jsx:1008-1028`) |
| Sound Safari | "Next sound: c" label + the correct critter is highlighted, on all difficulties (`:765,921,980`) |
| Word Bridge | Sentence-mode decoys are ALL CAPS, correct words aren't (`wordBridgeLevels.js:115-118`) |
| Rhyme Pop | After any correct pop, ALL remaining rhyme balloons flash a ring for 0.72s (`:1087-1093`) |
| Word Hopscotch | The full sentence renders with the next word highlighted (`ArcadePracticeGame.jsx:613-618`) |

**Recommendation:** render all options identically until chosen; reveal highlights only as *adaptive scaffolding* after 1–2 mistakes (Sound Safari's reviewer suggests exactly this pattern); preserve decoy casing.

### 2.3 ⭐ Star rubric degeneration
The shared `starRubric(correct, total, mistakes)` breaks down in four distinct ways:

1. **Accuracy always 100%** — games that force completion of every target report `correct === total`, so 1 star is mathematically unreachable and stars reduce to a mistake count: Rocket Run, Rhyme Pop, Sound Beat (`currentWordClean` is never set false), Sentence Grove, Adventure engine (only 2/3 stars reachable).
2. **One slip = one star lost** — Grammar Grind feeds `total = max(attempts, correct)`, so one mistake in 10 → 90.9% < the 95% bar (`GrammarGrindGame.jsx:1226`); Sound Racer identical. Reel & Read is harsher still: one mistake on a 2-target level = 1 star.
3. **Dexterity graded as literacy** — Letter Leap counts pit falls and enemy hits as `wrongHits`; Sound Racer counts obstacle hits; Sentence Grove counts hazard collisions. A weak platformer who spells perfectly caps at 2 stars.
4. **Memory mode ceiling (Critical)** — `finish()` passes `totalRounds` (6/8/10) but max correct is the pair count (3/6/10): easy caps at 1 star, medium at 2 (`ArcadePracticeGame.jsx:194-195`).

**Recommendation:** grade on **first-attempt accuracy per target** (track `firstTryCorrect`), separate motor mistakes from literacy mistakes (the rubric already accepts `deaths`), pass per-target totals, and add one free slip at small target counts.

### 2.4 🧹 Lifecycle & timer bugs (same pattern, five games)
- **Word Bridge:** the 1.8s level-complete `setTimeout` is never cleared in `teardown` → unmount during celebration restarts the render loop on a detached canvas indefinitely (`WordBridgeGame.jsx:749-751, 2003-2011`). *Verified.*
- **Adventure engine:** no input lockout during the 600ms advance → double-tap double-counts, and `onComplete` can fire twice, double-saving results (`AdventureGame.jsx:172-175`).
- **Practice engine:** un-cleaned timeouts let a game complete (and save) after the child quit (`:353,364,443,447,547,600,655`).
- **Sentence Express:** depart chain, chuff loop and word `Audio` objects keep playing behind the quit dialog; the adapter **drops `onEngineReady` entirely** so GamePlayer can't pause it (`SentenceExpressArcade.jsx:13-21`).
- **Pause bypasses:** Rocket Run's countdown sets `running=true` unconditionally; Sound Beat's `noteStart` is wall-clock so resume instantly fails the in-flight word; Sentence Grove's post-cut timer fires while paused.

**Recommendation:** one shared pattern — track all timer ids in a ref, clear on unmount, and shift game clocks by paused duration on resume. Apply arcade-wide.

### 2.5 📦 Duplication & dead code
- **Five PS1-engine forks ≈ 9,700 lines**: `Ps1ArcadeGame.jsx`, `RhymePopArcadeGame.jsx`, `SoundSafariArcadeGame.jsx`, `StarGalleryArcadeGame.jsx`, `SoundBeatArcadeGame.jsx`. Each file carries unreachable draw/update/input paths for the *other* games' kinds; `SoundBeatArcadeGame.jsx` (1,667 lines) **is imported nowhere**. Extract one shared `ps1Engine` module parameterized by kind; delete the forks.
- **Two 3D engine forks**: Rocket Run (1,400+ lines) and Sound Racer (3,080 lines, a ~2,700-line single closure) duplicate the same CDN-Three catch-the-sound architecture. Extract a shared 3D shell (scene lifecycle, steer zones, HUD, disposal).
- **~500 lines of dead CSS** (`.lg-game-card`, `.lg-arcade-header`, etc. — no JSX consumers since the tile redesign), dead shared components (`LetterTile`, `WordTile`, `StarIcon`), dead modes (`rhyme`, `train`, `slide` in the practice engine), dead mechanics in Sentence Grove (carry/deliver/nav-arrow/offRoad).
- **Naming debt:** catalog id `star-gallery` is titled "Sentence Grove"; `reading-race` is "Sentence Fix-It"; icons reused across different games.

### 2.6 🌐 Three.js r128 from CDN, no SRI, no offline
Rocket Run, Sound Racer (and the other 3D games) load Three.js r128 (2021) from cdnjs at runtime with no integrity hash and no local fallback — offline classrooms get a dead game, and it's a supply-chain risk. `src/vendor/` already exists. **Vendor and pin Three.js locally** (or bundle via the Vite import graph).

### 2.7 ♿ Accessibility floor
- **Screen readers:** every flagship game is canvas-only; the only AT surface is a wrapper `aria-label`. Standard fix: a visually-hidden `aria-live="polite"` region announcing target, results, and level transitions.
- **Keyboard:** Rhyme Pop has fire-but-no-aim; Sound Racer/Rocket Run steer buttons listen only to `pointerdown` (Enter/Space do nothing); Word Bridge captures window keys even behind the quit dialog.
- **Sound-off:** Word Rescue / Letter Garden are *unplayable* silently (no visual target); Sentence Express hides the sentence; several "Hear word" buttons bypass the sound toggle while the GamePlayer help button no-ops when off — pick one policy.
- **Motion:** FOV boost warp (Sound Racer) and balloon bob (practice CSS) ignore reduced-motion; CRT scanline/grain overlays (Letter Leap, Sound Safari) are exactly the motion noise emergent readers struggle with.
- **Fonts:** "Press Start 2P" pixel font at 0.6–0.78rem for tab labels/scores is hard decoding for 4–8-year-olds — keep it for the 8-bit H1 only; use Lexend/Fredoka elsewhere.

### 2.8 🎓 No onboarding anywhere
Nearly every game drops straight into play. Nothing teaches steering (Rocket Run, Sound Racer, Sentence Grove's undiscoverable hold-to-drive, Grammar Grind's hold-jump-to-grind), tile pick/drop (Word Bridge), or drag-to-cast (Reel & Read). **Standard:** a one-time first-run coach overlay/hint (Letter Leap already has `showOverlay()`; reuse it).

---

## 3. Critical Bugs (all verified in code)

| # | Game | Bug | Evidence |
|---|---|---|---|
| C1 | **Letter Leap** | Respawn-over-pit death loop: landing on any platform sets `spawnX`; `hurt()` respawns at *ground level* at that x — over a ravine the player falls and is hurt repeatedly until all hearts drain, hands-free | `LetterLeapGame.jsx` platform landing sets `p.spawnX = p.x`; respawn `player.y = groundY() - 46` |
| C2 | **Sentence Express** | Resumed runs can never complete: adapter fires `onComplete` only at `levelsDone >= 10`, but GamePlayer resumes at the checkpoint level, so a resumed run plays fewer levels → no stars, checkpoint never cleared, child stuck on the resume prompt | `SentenceExpressArcade.jsx:40` |
| C3 | **Sight Word Memory** | 3 stars mathematically impossible on easy/medium: `finish()` grades against `totalRounds` (6/8) but max correct is pairs (3/6) — easy caps at 1 star, medium at 2 | `ArcadePracticeGame.jsx:194-195` |
| C4 | **Reel & Read** | Fish spawn up to ±780px off-screen but the cull filter is ±180px → ~half of spawns deleted the same frame; `refillFish()` churns allocations every frame | `ReelReadGame.jsx:345-347` vs `:521` |
| C5 | **Sentence Grove** | Correct trees glow a different color (cut-mark, foliage, sign rail, beacon, brighter point light) — "cut the yellow tree" replaces reading within two rounds | `StarGalleryArcadeGame.jsx:1025-1028,1053,1076-1078` |
| C6 | **Adventure engine** | No input lockout in the 600ms advance window: double-taps double-count and `onComplete` can fire twice, double-saving results | `AdventureGame.jsx:172-175` |

---

## 4. Per-Game Findings

### 4.1 Rocket Run — 7/10
*3D lane-runner (Three.js via CDN): catch words starting with the target sound. Best-in-class engineering: anti-soft-lock re-queue, mastery-gated rounds, homophone-safe distractors, reduced-motion, full teardown.*

- **[High] No spoken audio** — skill collapses to first-letter shape matching. Speak target sound at countdown + words on catch.
- **[Med] Word pools too thin** — 3–6 usable words per grapheme after CLEAN filtering; intended 8/10/12-per-round difficulty never materializes; same words recycle. Expand to 12+ vetted words/grapheme.
- **[Med] Wrong-word hit = full heart loss** with no explanation — same punishment as a meteor. Make it a soft penalty + flash/speak the contrast ("map starts with m").
- **[Low]** Pause bypassed during countdown; stars effectively always ≥2 (dual rubrics); progress reports "0/8" in round 1; steering never taught; no aria-live.
- **[Med] Three.js r128 via CDN, no SRI** — vendor it.
- **Top fixes:** ① speak sounds/words ② expand word pools ③ soften wrong-word collisions ④ vendor Three.js ⑤ fix countdown pause + teach steering.

### 4.2 Letter Leap — 7/10
*Canvas platformer: grab each word's letters in order across three worlds. Excellent game feel (coyote time, jump buffering), smart catch-up that re-queues skipped letters, real curriculum ramp (CVC → blends → sentences).*

- **[Critical] Respawn-over-pit death loop** (see C1). Store `spawnY`/ground-validated checkpoints.
- **[High] Wrong-letter feedback punitive, not instructive** — decoy touch costs a heart with no info; decoys look identical to real letters. Show/speak "That's D — you need C!" without heart loss.
- **[High] Stars grade platforming** — enemy hits and pit falls count as `wrongHits`; 3 stars needs zero deaths. Split literacy mistakes from dexterity hits.
- **[High] No onboarding** — drops straight into play.
- **[Med]** Progress double-counts after a failed stage (>100%); CRT grain/scanline overlay hurts legibility (honor reduced-motion); decoys never include confusables (b/d, c/k); uppercase-only presentation (early literacy is lowercase-first).
- **Top fixes:** ① fix respawn checkpoints ② instructive decoy feedback ③ split rubric inputs ④ first-run overlay ⑤ roll back progress on stage requeue.

### 4.3 Sound Racer — 7/10
*3D racer, the largest file (3,080 lines). Genuinely tests rapid onset identification; digraph-aware pools; seeded fair tracks; no-death shield; per-student best splits.*

- **[High] Wrong-onset words taught as correct** — "one" (sounds /w/) appears as a correct O gate and as a W distractor; "whole" (sounds /h/) in wh extras. Add a phonetic-onset override table.
- **[High] Hard-mode copy lies** — says "words carrying this sound" but matching is initial-sound only. Fix copy or implement medial/final matching.
- **[Med] Correct gates glow** — aim at the shiny ring, no reading needed. Identical styling for all gates.
- **[Med]** Retry score farming; auto-assist catches words for the child after 2 misses (game plays itself); ~1,600 draw calls, no instancing, scene rebuilt every level — expect frame drops on older iPads; 3,080-line single file.
- **[Low]** FOV warp ignores reduced-motion; best-split storage regresses; CDN Three.js; steer buttons ignore keyboard.
- **Top fixes:** ① onset overrides ② align hard copy ③ identical gate styling ④ instancing/quality tier ⑤ split file + share 3D engine with Rocket Run.

### 4.4 Word Bridge — 7/10
*Canvas bridge-building spelling; pure deterministic unit-tested level generator; sound-confusable decoys excluded; forgiving "later" hint design.*

- **[High] Sentence decoys are ALL CAPS** — instantly identifiable fakes (`wordBridgeLevels.js:115-118`). Match casing.
- **[High] 8-word sentences overflow phones** — slots go off-screen below ~700px width. Cap sentence length or scale.
- **[Med] Patience timer is a consequence-free prop** — drains to 0, nothing happens; the "out of tiles" fail path is unreachable. Wire a gentle consequence or remove the bar.
- **[Med] rAF leak** (see §2.4); target word always fully visible → shape matching, not spelling (add "hear the word" + fade filled slots); identical duplicate letters rejected as "later" (accept any correct-glyph tile); no re-layout on resize.
- **Top fixes:** ① decoy casing ② narrow-screen sentences ③ clear celebration timer ④ resolve fake timer ⑤ audio + glyph-slot acceptance.

### 4.5 Sound Beat — 6/10
*PS1-style rhythm game: tap graphemes to a scrolling beat highway, hit GO to blend. Clean lifecycle, generous hit windows, no-fail retry loop.*

- **[High] Music never synced to the beat grid** — `ensureMusic`/`stopMusic` are empty stubs; GamePlayer's fixed-tempo loop (~122.5 BPM) runs against 82–135 BPM note timing with independent phase. In a *rhythm game*. Restore the orphaned `startSoundBeatMusic({bpm})` wiring or lock timing to the loop.
- **[High] No spoken sounds** in a blending game — play recorded phonemes per beat + the blended word on GO.
- **[Med]** `currentWordClean` never false → accuracy always 100% → 1 star unreachable; pause doesn't freeze note timing (resume = instant unfair miss); ~600 lines dead code + the fully orphaned `SoundBeatArcadeGame.jsx` (1,667 lines).
- **[Low]** Double-tap resets the whole word (add ~150ms lockout); static decorative HUD hearts/stars; four cosmetic lanes imply lane input; hard levels switch to sentence words (skill drift); unused 1.8MB bg png.
- **Top fixes:** ① BPM-synced music ② phoneme/word audio ③ delete dead forks ④ real accuracy ⑤ resume offset + tap lockout.

### 4.6 Rhyme Pop — 7/10
*Canvas balloon shooter: pop every balloon rhyming with the target. Accurate, well-tiered rhyme content (zero false rhymes); forgiving loop; corrective coach text ("Ship does not rhyme with Cat").*

- **[High] A "listen and rhyme" game with no audio** — speak the target word on level start/tap, and popped words too.
- **[High] ~60% of the file is dead code** for other games' kinds; engine forked across 5 files (~9,700 lines). Extract shared engine.
- **[Med]** POP! ring flashes ALL rhyme balloons (answers telegraphed); easy/medium use the *same* family sequence — difficulty barely differs; add near-rime distractors at hard.
- **[Med]** Keyboard play impossible (fire without aim); wrong-balloon-in-the-way punishes good aim (shots pop whatever they touch first).
- **[Low]** Vocabulary flags for ages 4–8: "gun", "stun", "fight" → swap for "nun/shun", "knight/sight"; 60 balloons/run is long; dev preview harness ships in prod.
- **Top fixes:** ① spoken words ② kill the answer flash ③ extract engine ④ real difficulty tiers ⑤ keyboard aim.

### 4.7 Sound Safari — 7/10
*Canvas netting game: catch critters carrying the word's graphemes in left-to-right order. Nice ordered-segmentation coaching ("Need c before a"); decoys include the word's own other graphemes; no-fail model.*

- **[High] Self-solves** — "Next sound: c" label + correct critter highlighted on all difficulties. Hide on medium/hard; reveal only as adaptive hint after mistakes.
- **[High] No spoken words/phonemes** — non-negotiable for phonics.
- **[High] Silent-e & double consonants counted as "sounds"** — `segmentWord` splits stone→s-t-o-n-e, glimmer→…m-m-er: teaches wrong phoneme models. Handle magic-e + collapse doubles, or swap the words (stone, flame, glide, prize, glimmer, shimmer, sparkle).
- **[Med]** Per-frame CRT dot grid (~14k fillRects) + per-critter hue-rotate will tax low-end tablets (pre-render overlay); resize resurrects caught critters.
- **[Low]** Countdown shows "4"; ArrowUp dual-maps; `onComplete` passes grapheme-units as "words" (~3× inflation).
- **Top fixes:** ① stop revealing answers ② add audio ③ fix segmenter ④ pre-render overlays ⑤ resize repositions, not recreates.

### 4.8 Reel & Read — 6.5/10
*Fishing game: compounds, synonyms/antonyms, prefixes/suffixes across three tiers. `orderMatters` sequencing genuinely teaches blending order; forced-spawn prevents stalemates; thoughtful foils ("red" vs "read").*

- **[Critical] Spawn-cull churn** (see C4).
- **[High] Non-morphemic "word parts"** — medium/hard split rocket→"rock"+"et", volcano→"vol"+"ca"+"no"; "et"/"vol" aren't morphemes and "rock" is a real word not in rocket. Restrict to true compounds/correct syllabification.
- **[High] Star rubric brutal at 2–3 targets** — one slip = 1 star. Allow one free mistake at ≤3 targets.
- **[High] No onboarding** — nothing explains steering/casting.
- **[Med]** No read-aloud ("courageous", "disloyal" are above reading level → guesswork); `onComplete` passes level count as words; 12px fish labels; no reduced-motion path; heavy per-frame gradients; renders while paused.
- **Top fixes:** ① cull band ② real morphemes ③ soften rubric ④ onboarding + audio ⑤ aria-live + reduced motion.

### 4.9 Sentence Grove (id `star-gallery`) — 6/10
*Three.js drive-and-cut sentence fixing. Strong tiered content (capitals → blends → contractions/homophones); plausible distractors; keyboard-playable; disciplined teardown.*

- **[Critical] Correct trees glow differently** (see C5). Identical rendering until chosen.
- **[Critical-adjacent] Wrong answers leak the answer** — "WRONG TREE — Look for `{answer}`" + 1.2s cooldown → trial-and-error beats reading. Hint the *rule*, not the answer; escalate cooldowns.
- **[High] Proximity auto-cut punishes driving** — any tree within 2.05u cuts automatically in a crowded map; require an explicit cut action.
- **[High]** Hazard collisions count as literacy mistakes; no read-aloud; no control onboarding (hold-to-drive is undiscoverable).
- **[Med]** Star rubric degenerates (grade first-attempt accuracy); HUD panels collide <650px + missing `touch-action:none`; 7–9 dynamic PointLights + per-frame DOM writes; dead carry/frame/nav-arrow code; id/title mismatch (`star-gallery` = "Sentence Grove") is legacy rename residue — alias or rename.
- **Top fixes:** ① identical trees ② rule hints + deliberate cut ③ TTS + onboarding ④ separate hazard mistakes ⑤ delete dead mechanic + responsive HUD.

### 4.10 Sentence Express — 7/10
*The most pedagogically ambitious game: word order, capitalization, punctuation, semantic choice, cloze — one coherent train metaphor, capped by karaoke read-back (the best single teaching moment in the arcade). Deterministic seeded levels; real `<button>` cars with aria-labels.*

- **[Critical] Adapter resume bug** (see C2). Track completion against levels actually played this session.
- **[High] `onEngineReady` dropped** → can't be paused; chuff loop/timers/audio run behind the quit dialog. Forward the prop; implement pause + cleanup.
- **[High] Sound-off hides the target sentence** — the "Hear it again" button silently no-ops. Show sentence text when sound is off.
- **[Med]** Error feedback is a bare buzz; some panels are 2-option coin flips (guarantee ≥3 options); karaoke strip clips long sentences on desktop; combo feeds nothing; `words` arg misreported.
- **[Low]** Stilted model sentences ("What a fast red fox that is!"); adjective distractors almost always "wet/old/sad" (children learn "pick the non-wet one").
- **Top fixes:** ① resume bug ② pause/cleanup ③ silent-mode text fallback ④ corrective feedback + ≥3 options ⑤ karaoke overflow + real word count.

### 4.11 Grammar Grind — 6.5/10
*3D skate park: ride through the gate that fixes the sentence. Real grammar progression with READ→RULE→SOLVE scaffolding; cues restate rules; broad input support.*

- **[High] Ambiguous item punishes correct English** — "The birds _ in the tree" (sing/sings/sang, no time marker) marks "sang" wrong (`grammarGrindLevels.js:88-94`). Anchor the tense or drop the option.
- **[High] 3 stars ≈ perfect run** — `total = max(attempts, correct)` → one slip in 10 = 90.9% < 95% bar. Pass per-target total.
- **[High] No read-aloud** — unplayable solo for non-readers.
- **[Med]** Wrong feedback reveals the answer on first miss ("Aim for X") → bump-a-gate strategy; hard tier overshoots (colon-before-list, third conditional ≈ grade 4–6; BrE-standard "The team are" marked wrong); grind mechanic undiscoverable; NearestFilter + no antialiasing makes gate text (the thing children must read) blocky.
- **[Low]** Per-frame `onScoreUpdate` re-renders the header at 60fps (throttle); jump-spam farms style points; double chime fatigue.
- **Top fixes:** ① fix the birds item ② per-target rubric ③ TTS ④ hint-don't-tell ⑤ onboarding + LinearFilter text.

### 4.12 Phonics Practice engine (CVC Builder, Sight Word Memory, Blend & Build, Pop the Word, Word Hopscotch, Sentence Fix-It) — 6.5/10
*One DOM engine, six wrappers. Sensible tiering, strong Sentence Fix-It homophone content, careful audio governance (known-bad quarantine), duplicate-letter correctness, light rendering.*

- **[Critical] Memory-mode star ceiling** (see C3) + progress meter stuck at "1/6" (reports wrong tuple).
- **[High]** Third tap during flip-back double-penalizes (no `selected.length >= 2` guard); hard CVC Builder: 18/30 words have no image and no visual target — silent-mode brute force (filter pool to words with assets, or reveal after N attempts).
- **[Med]** Blend & Build has no failure state (every tap correct → guaranteed 3 stars; hard = ~44 repetitive taps; add distractor onsets + sound out the blend); `onCheckpoint`/`startLevel` ignored → resume dead for all six games; un-cleaned timeouts complete after quit; screen reader leaks the answer via image `alt` in secret mode; Word Hopscotch highlights the next word.
- **[Low]** "Hear word" buttons bypass the sound toggle (policy inconsistency); dead modes (`rhyme`/`train`/`slide`); balloon bob ignores reduced-motion.
- **Top fixes:** ① memory star total ② memory progress tuple ③ flip-back guard ④ hard-round cues ⑤ wire checkpoints.

### 4.13 Adventure engine (Word Rescue, Sound Sort Factory, Letter Garden) — 7/10
*Warm retry-with-coaching loop, pure unit-tested round builders, great sort contrast pairs (s/m, sh/ch, b/d), gold-voice-only audio discipline.*

- **[High] Input race** (see C6) — busy-lock during the 600ms advance.
- **[High] Rescue & Garden unplayable with sound off** — target exists only as audio; "Hear word" bypasses the toggle. Gate the button + visual fallback (picture/word card).
- **[Med]** Sound Sort never uses sound despite its name (speak belt word + phoneme bins on tap/miss); foils are random words, not minimal pairs (length/first-letter giveaways invite brute-force); timers never cleaned on unmount; `onCheckpoint`/`startLevel` ignored; sort item invisible to screen readers.
- **[Low]** Stars collapse to 2/3 (grade first-try accuracy); instruction/mechanic mismatch ("Read the word" — nothing readable shown); hardcoded pal pose regardless of world.
- **Top fixes:** ① busy-lock ② silent-mode fallback ③ real sort audio ④ timer cleanup + contract ⑤ minimal-pair foils.

### 4.14 Hub & shell — 6.5/10
*Per-difficulty checkpoints with resume prompt, pause-on-tab-hide, fail-closed privacy leaderboard, monotonic progress merge, lazyWithRetry — a thoughtfully engineered shell.*

- **[High] Mission auto-return kills the win moment** — `notifyMissionTaskDone` without `deferReturn` navigates home 1.6s after a win, mid-celebration (`GamePlayer.jsx:102`, `dailyMission.js:129-133`). Pass `{ deferReturn: true }` + announce from hub `onClose`.
- **[High] Leaderboard illegible in dark skin** — light text on ~80% white glass (~1.3:1 contrast).
- **[High] Content bug: "he-li-cop"** (`learnGamesData.js:123`) concatenates to a non-word — segment as `["hel","i","cop","ter"]`.
- **[Med]** No error boundary around games (one render throw unmounts the app); leaderboard shows "No high scores yet" while loading + no `.catch`; pixel font for young readers; dialog has no focus trap/Esc; closing a deep-linked practice game lands on the Arcade tab.
- **[Low]** Dead CSS (~500 lines), dead shared components, two skins fighting (`arcade-dark` vs comic starfield vs inline world style), 3 practice tiles show duplicate art.
- **Top fixes:** ① deferReturn ② leaderboard contrast ③ fix "he-li-cop" ④ error boundary + loading states ⑤ prune dead CSS/skins.

### 4.15 Asset pipeline — 6/10
*Graceful degradation everywhere (zero in-game 404s); sensible modern webp for new art.*

- **[High] ~20 MB orphan files shipped in `public/`** — 17 `ps1-arcade/star-gallery-*` files (3.5MB, game is pure Three.js), 3 unused `*-bg.png` (6.4MB), 9 `word-bridge/*.png` (~9.8MB), 6 root icons (~4.6MB), 5 phinny files (~3MB), poems v1 audio (~1.9MB).
- **[High] 4 games missing tile art** (`art/reel-read.webp` + 3 practice games) — hub falls back to heavy/wrong icons.
- **[High] 3 of 11 arcade games lack music loops** (reel-read, sentence-express, grammar-grind) — they inherit thematically-off quest loops.
- **[Med]** Idle preload fires 5 guaranteed 404s and warms ~11.5MB of legacy PNG icons on every home visit; 8 PNG icons at 1.2–1.8MB each vs 20–40KB webp siblings (convert → ~13MB saved).
- **Top fixes:** ① purge ~20MB orphans ② 4 missing art tiles ③ 3 music loops ④ webp icons + scoped preload ⑤ delete orphaned engine fork.

---

## 5. Prioritized Roadmap

### P0 — Critical bugs (days, all verified)
1. Letter Leap: ground-validated respawn checkpoints (C1)
2. Sentence Express adapter: count completion against levels played this session (C2)
3. Memory mode: grade against pair count (C3)
4. Reel & Read: widen the cull band past the farthest `entryX` (C4)
5. Sentence Grove: identical tree rendering until chosen (C5)
6. Adventure engine: input busy-lock (C6)
7. Data: fix "he-li-cop" syllable entry

### P1 — Educational core (the big wins)
1. **Arcade-wide speech standard**: target spoken at round start + tap-to-repeat + items spoken on catch (9 games; infrastructure already exists)
2. **Kill answer telegraphing**: Sound Racer gates, Sound Safari highlights, Word Bridge decoy casing, Rhyme Pop flash ring, Word Hopscotch highlight
3. **Star rubric reform**: first-attempt accuracy, separate motor vs literacy mistakes, one free slip at small target counts
4. **Content corrections**: phonetic-onset overrides ("one", "whole"), magic-e/double-consonant segmentation, non-morphemic splits in Reel & Read, "The birds sing/sang", Rhyme Pop vocab swaps, BrE "team are"
5. **Sound-off standard**: visual target fallback everywhere (Rescue/Garden/Sentence Express/CVC-hard); one consistent policy for child-initiated audio vs the toggle

### P2 — UX foundations
1. First-run onboarding overlay/hints in every game (controls + objective)
2. Timer/pause hygiene arcade-wide (clear on unmount; offset clocks on resume; forward `onEngineReady` in Sentence Express)
3. Hub: `deferReturn` for mission auto-return; leaderboard contrast/loading states; error boundary; readable fonts
4. Sound Beat: restore BPM-synced music
5. Sentence Grove: deliberate cut input + rule-hint feedback

### P3 — Code & asset health
1. Extract shared PS1 engine; delete the 4 forks + orphaned `SoundBeatArcadeGame.jsx` (~7,000+ lines removed)
2. Extract shared 3D shell from Rocket Run / Sound Racer; vendor + pin Three.js locally
3. Purge ~20 MB orphan assets; convert 8 PNG icons → webp; scope preload to arcade games
4. Prune ~500 lines dead CSS + dead shared components; resolve the two-skin fight
5. Add the 4 missing art tiles + 3 missing music loops

### P4 — Accessibility & polish
1. `aria-live` mirrors in all canvas games; keyboard aim where missing; gate window key-capture on phase
2. Reduced-motion coverage for CRT overlays, FOV warps, balloon bob
3. Performance: instancing/quality tiers for the 3D games; pre-render static canvas layers; skip render while paused
4. Difficulty deepening: real per-tier content in Rhyme Pop; near-rime distractors; minimal-pair foils in Adventure; Blend & Build failure state

---

## 6. What to keep doing
- The GamePlayer contract + checkpoint/resume/pause design is genuinely good — extend it (checkpoints) to the practice engines rather than redesigning.
- Deterministic seeded, unit-tested level generators (Word Bridge, Adventure, Sentence Express) — make this the standard for all games.
- Distractor curation (homophone-aware onsets, true-rhyme families, plausible grammar foils) is better than most commercial literacy apps.
- The recorded-voice-or-silence audio policy with known-bad quarantine — now just *use* it in the flagship games.
- Forgiving failure design (re-queues, catch-up lanes, no-fail retries) is exactly right for the age band.
