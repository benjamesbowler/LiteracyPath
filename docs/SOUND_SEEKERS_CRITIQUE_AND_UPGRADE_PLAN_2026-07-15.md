# Sound Seekers — Critique & Upgrade Plan

**Date:** 2026-07-15
**Benchmark:** Teach Your Monster to Read (TYMTR) — art, polish, and playability bar
**Method:** read the quest code and yesterday's audit; re-verified every reused claim against today's source; executed `wordsForTarget` for blends; ran `node --test` on quest units (38/38 green in sandbox); inspected the project's own deterministic screenshots (`docs/previews/shots/*` from Jul 14, `docs/previews/slice/*` from this morning) as visual ground truth.
Labels: **[observed]** seen in source/screenshot · **[executed]** ran the real code · **[derived]** arithmetic from observed facts · **[inferred]** judgement · **[verify]** needs a human/live check.

---

## 1. Verdict in one paragraph

The **engineering skeleton is now genuinely good** — mastery gate, review scheduler, map, chapter ceremonies, 2D fallback, telemetry, teacher panel, and economy are all wired since the 07-14 audit, and the logic layer is the best-tested code in the repo. What stands between this and Teach Your Monster is no longer wiring — it is **(a) four still-open pedagogy holes** (fluency mechanic dropped silently, no correction loop, blends taught with zero example words, the Sound Sort lesson has no audio), **(b) a game that still requires reading to learn to read** (every instruction, ceremony, and menu is text-only), and **(c) a look that reads as engine blockout rather than a made world** — flat-material terrain, a capsule creature with a default frown, primitive-brown gates, admin-panel UI in Georgia serif, and a reward "receipt" where the celebration should be. TYMTR wins on none of your pedagogy and all of your presentation. The plan below closes both, in that order of risk: correctness → voice → correction → art.

---

## 2. Status of the 2026-07-14 audit — re-verified today

The audit's header says the production upgrade landed; that is mostly true. Exact state as of this morning:

| Finding | Status today | Evidence |
|---|---|---|
| P0-1 WebGL blank screen | **FIXED (auto-fallback)** | `QuestRoot.jsx:474` `onSceneError={() => setForce2d(true)}` → `QuestTrail2D`; `resolveQuestQuality({webglAvailable})` [observed] |
| P0-2 RewardScreen / TrailMap dead | **FIXED (partially — see U1)** | Both imported and routed (`QuestRoot.jsx:16-17, 413, 492`); map lets the child pick stops. Per-stop reward is still only a 4.2s toast; RewardScreen fires only on chapter finales (8 of 40 stops) `QuestRoot.jsx:279-295` [observed] |
| P0-3 Gear never wearable | **FIXED** | `recordStopResult` writes `creature.equipped` (`questProgress.js:199-215`); staff/hat visible in `seedwake-reward-equipped.png` [observed] |
| P0-4 Server merge destroys mastery | **OPEN — the worst live bug** | No `phonics_quest` handling in any migration (grep = 0); client special-cases it (`progressMerge.js:202`); `tests/unit/progressMerge.test.js` has **zero** `phonics_quest` cases [observed] |
| P0-4b No hydrate listener | **OPEN** | `lp-progress-hydrated` absent from `QuestRoot.jsx`/`questStore.js` (grep = 0) [observed] |
| P1-1 trail-run never built | **OPEN** | `ENCOUNTERS` (`questEncounters.js:46-53`) has no `trail-run` source; `questSequence.js` still declares it at ~15 stops; `FROM_SHELL[...]​.filter(Boolean)` drops it silently [observed] |
| P1-2 `retire()` never called | **OPEN** | Only definition + tests reference it (grep) — box 5 / "nothing rots" still unreachable [observed] |
| P1-3 No correction loop | **OPEN** | No hint/choice-reduction/teach-back anywhere in quest (grep); DOM encounters re-arm the same beat; mistake accounting still split (once-per-beat `Encounters.jsx:196,263,317,384` vs per-tap `QuestHub.jsx:4033`) [observed] |
| P1-4 Late-trail audio missing | **OPEN** | `public/audio/quest/` does not exist → all 8 alt pronunciations silent; slice report itself: "16 known later-trail recordings remain intentionally silent" [observed] |
| P1-5 Blends: zero example words | **OPEN** | [executed] `wordsForTarget('st',12) → []`, same for `bl`, `br`, `nd` — Guide hides the row, so four stops introduce 22 blends with no words |
| P1-6 Mastery header stale + BLEND_RULES bug | **OPEN** | Header still claims 8-correct/85%-of-10 (`questMastery.js:9-10`) vs code 4/0.75/window-4 (`:47-49`); `BLEND_RULES {minCorrect:3, accuracyWindow:3, minAccuracy:0.75}` still demands a **perfect 3/3** (2/3=0.67 fails) — harsher than graphemes, opposite of the comment's intent [observed/derived] |
| P1-7 Invisible to teachers/parents | **FIXED** | `TeacherDashboardPage.jsx:500-504` renders trails/stones-lit/time-on-task; `FinishedReportPage.jsx:1259` `SoundSeekersSection`; stars flow into gems + Hollow coins (`treasureTrail.js:91-96`, `hollowEconomy.js:23`) [observed] |
| P1-8 Zero telemetry, wrong mission slot | **FIXED** | `logStudentActivity("phonics_quest", …)` on answer/stop/session (`QuestRoot.jsx:211,247,303,345,382`); mission slot now `"quest"` (`:246,302`) [observed] |
| P1-9 Mastery silo vs app model | **OPEN (economy half fixed)** | Stars→coins done; quest attempts still never write `answers`/`item_mastery`, and never read the assessment's evidence in [observed] |
| P1-10 Entry point | **OPEN** | Still a text-only pill in the topbar (`StudentHomePage.jsx:196-207`); the mission tile labelled **"Quest"** (`:78`) still points at EL Quest [observed] |
| P2-2 No CI | **OPEN** | No `.github/`, no hooks. The Jul-14 `world-s1-gate-ipad.png` is a **fully blank screen with 0 console errors** — exactly the silent-regression class only a visual gate catches. It was fixed by Jul-15, but nothing prevents the next one. [observed] |
| P2-3 70 MB models ship | **MOSTLY FIXED** | `.gitignore:73` excludes the library; tracked subset = **3.0 MB / 100 files** [executed]. Remaining: 71 MB local-only bloat, no size gate on the tracked set |
| P2-4 A11y gaps | **PARTIAL** | `aria-live` now on results/notices; phoneme slots have non-colour check + assertive announce (slice WS7). Still open: OS `prefers-reduced-motion` never read in the 3D loop (grep `matchMedia` in quest = 0; settings flag only lowers *quality tier*, `questPerformance.js:85`); tap targets below the stated 64px rule (`quest.css:163` 44px, `:189` 56px, `:280` 44px, `:422` 40px); iPad Safari still lands the **rich** tier because `deviceMemory` defaults to 8 (`questPerformance.js:74-85`) [observed] |
| P2-6 QuestHub monolith | **WORSE** | Now **4,391 lines** (was 2,973) [observed] |

Everything below is **new** critique on top of that table.

---

## 3. The TYMTR bar — scorecard

What makes TYMTR read "professional" is not budget mystique; it is seven specific disciplines. Where Sound Seekers stands on each:

| Discipline | TYMTR | Sound Seekers today | Gap |
|---|---|---|---|
| **Art unity** | One painted style; every prop, sky, and UI chrome belongs to the same illustration | Painted skies + parallax panels **[observed, good]** sitting on flat-shaded low-poly terrain, untextured brown gate primitives, floating white orbs; bright green hedges inside the bone-desert act (`world-s12-ipad.png`) | High |
| **Character** | The monster is the product: expressive face, squash-and-stretch, reacts to every answer | 2D vector creature is charming (`den-ipad.png`); the 3D capsule that actually walks the trail has a **default frown** (`world-s12/s24-ipad.png`), one stub arm, no reactions beyond clips | High |
| **Voice** | Every instruction, reward, and menu is spoken; a non-reader can play alone | Only graphemes/words are voiced. Guide's lesson line, all encounter prompts, Den, map, Trading Post, ceremony = **text only**. The 2D fallback teach screen plays **no audio at all** (`QuestTrail2D.jsx:122-135`) | **Critical** |
| **Reward choreography** | Every level ends in a staged payoff (item lands on monster, fanfare, dance) | 32 of 40 stops end in a 4.2 s toast while the next trail is already loading; chapter ceremony is a **data receipt** (five 12-counts, "Sparks banked", dense text — `seedwake-reward-equipped.png`) | High |
| **One action per screen** | A child always knows the single next tap | Trail HUD shows two exits ("Close" + "Back to the Den"), currency pills, objective card, guide call — during *walking* | Medium |
| **Responsive difficulty** | 2026 rebuild: "instruction should respond to learner performance" | Mastery gate + review scheduler are *better* than TYMTR's — but a wrong answer just re-arms the same question (brute-forceable), and `retire()`/trail-run never run | Medium (logic there, loop missing) |
| **Text load** | Zero reading required to operate | "Find the sleeping seed-lanterns", "3 to cache", "Sparks become parts", "sound evidence ready to bank", serif headers, ALL-CAPS labels | **Critical** |

Where you already **beat** TYMTR (protect these): honest mastery gate + demotions, spaced review, placement-order matching the classroom, decodability guarantees in the round builder, teacher evidence panel, no IAP, tappable-word policy in Story flow, response-level logging (nobody in the category can run an efficacy trial; you can).

---

## 4. New findings

### E — Errors / bugs (verified)

| # | Finding | Where | Fix |
|---|---|---|---|
| E1 | **Server merge still corrupts `phonics_quest`** on any two-device use: window arrays union-collapse, `state` last-write-wins can undo demotions, checkpoint merges teleport mid-stop | `supabase/migrations/20260614090000_progress_forward_merge.sql` vs `progressMerge.js:202` | Mirror the client's `phonics_quest` branch in SQL; add the missing `progressMerge.test.js` case; **check:** new unit + a two-row merge fixture |
| E2 | **Pre-hydrate clobber**: QuestRoot snapshots localStorage at mount, never listens for `lp-progress-hydrated`; first tap on a fresh device commits over the cloud save | `QuestRoot.jsx:61` region | Subscribe like `StudentHomePage.jsx:146`; re-load state on hydrate; **check:** unit with delayed hydrate event |
| E3 | **`trail-run` silently dropped** at ~15 stops → the only fluency/automaticity mechanic never runs, and the curriculum matrix over-claims coverage | `questEncounters.js:46-57`, `questSequence.js`, `questMechanicMatrix.js` | Add `ENCOUNTERS["trail-run"]` + a DOM view + 3D staging (fork-sign sprint already spec'd); or delete the declarations and correct the matrix. Build > delete. **Check:** playthrough test asserting every declared shell builds |
| E4 | **`retire()` dead** → box 5 sampling never fires; "nothing rots" guarantee false | `questMastery.js:171` | Call it from the review path when a mastered item survives a ≥12-stop review; **check:** scheduler unit reaching box 5 |
| E5 | **BLEND_RULES arithmetic**: window 3 @ 0.75 ⇒ perfect-3 required; stricter than graphemes, contradicts its own comment | `questMastery.js` blend block | `accuracyWindow: 4, minAccuracy: 0.75` (3/4 passes) or 0.66 threshold; update the stale 8-correct/85% header while in there (E5b); **check:** unit for 3-of-4 blend mastery |
| E6 | **Blends teach with zero example words** [executed] | `wordsForTarget` (segment-based) | Blend targets should source via `blendsIn(word, taughtBlends)` instead — the function already exists (`questRounds.js:38`); **check:** every `kind:"blend"` teach entry yields ≥2 examples across s12-15 |
| E7 | **Alt-pronunciation audio path resolves to a folder that doesn't exist** → Sound Sort stops (s16, s28, s29, s37) ask children to sort by sounds that never play — the one lesson unsolvable by sight | `questAudio.js:107`, missing `public/audio/quest/alt/` | Record the 8 alt clips + 16 late-trail teach clips (list already exact in `check:quest`); until they land, **gate those stops' sound-sort beats out** rather than running them mute; **check:** `check:quest` zero-silent for shipped stops |
| E8 | **Mistake accounting split** corrupts the mastery signal: bridge/cave/pens/word-beast report once per beat; 3D field tasks report every wrong tap | `Encounters.jsx:196,263,317,384` vs `QuestHub.jsx:4033` | Pick per-attempt (recommended — it is the honest signal), emit on every tap in DOM views too; **check:** unit asserting one `onAnswer` per tap in both paths |
| E9 | **Trading Post header collision**: sparks pill renders under/over "Close" ("1Close") | `post-ipad.png` [observed]; `TradingPost.jsx` header + global `.q-exit` | Reserve top-right for the single global exit; move currency into the panel header; **check:** shots diff |
| E10 | **"1 stars"** in the trail toast (`{trailNotice.stars} stars`) and "0 of 3 stars" phrasing on the map | `QuestRoot.jsx:487`, `TrailMap.jsx:121` | Pluralise once in a helper; **check:** unit |
| E11 | **Ceremony numbers can contradict the HUD** — journey-complete render shows "0 finds · 0 Sparks banked" beside a topbar reading 240/180 sparks | `seedwake-journey-complete.png` [observed]; `RewardScreen.jsx:34` vs header pills | [verify] in live play; if real, ceremony must read the same `ended` state as the pills; regardless, **drop duplicate currencies from the ceremony** (see U4) |
| E12 | **Jul-14 gate render was a fully blank screen with zero console errors** — fixed by the slice, but the failure class (canvas alive, scene empty) has no guard | `world-s1-gate-ipad.png` + its `.txt` | Make `npm run shots` a **failing** gate (non-zero exit on blank-frame heuristic — it already computes nonblank pixel checks in `check:quest-route-visual`) and run it in CI (R1) |

### P — Pedagogy

| # | Finding | Fix |
|---|---|---|
| P1 | **No correction ladder** — the single biggest learning-and-frustration lever, and TYMTR's one mechanic worth copying wholesale. Wrong → same question, indefinitely; half the encounters brute-forceable; `Signpost` never reveals the answer | 2nd miss: reduce to two choices. 3rd: teach-back ("This one says /sh/. Listen. Now you find it") then re-ask. Cap wrong-taps per beat; after reveal, requeue the target 3 back (reuse `makeCatchUp`). Implement once in the shell contract so DOM + 3D + 2D all inherit it. **Check:** unit simulating 3 misses → sees reveal, mastery records ≤ capped attempts |
| P2 | **The game still requires reading.** Instruction cards ("CONDUCT — Conduct the five lantern gardens…"), Den copy, map labels, ceremony, Trading Post economy line — all text-only. Band words: *cache, conduct, chorus, relic, banked* | Voice pack (see §6 manifest, ~90 clips) + icon language for every instruction verb (magnifier=find, boot=jump, basket=carry, notes=order, drum=rhythm — the five verbs already exist as systems). Objective card = icon + voiced line + ≤4 words of text |
| P3 | **Letter names**: "What is it called?" is a text button; single letters only; 2D mode drops it | Speaker-icon pair on every teach card (sound + name), both voiced, both modes |
| P4 | **Guide example words are dead text** — the design's "every word tappable" promise stops at the guide (`Guide.jsx:64-67`); 2D teach is fully silent | Render each example as a tappable chip playing `/audio/child-mode/clean-human/words/<slug>.mp3` (697 recordings already exist); wire `sayGrapheme` into the 2D teach phase |
| P5 | **Per-stop reward is a toast** (32/40 stops) while the next trail is already loading — effort→payoff link broken for the child | 6-8 s in-world beat at every gate: stars arc in one at a time (chime each), stone flies to satchel, gear (when earned) lands **on the creature** with a bounce; skippable by tap. Keep the full RewardScreen for finales |
| P6 | **Quest mastery is still a silo** — a child who proved /sh/ in class starts at zero; quest evidence invisible to the app's item-mastery model | Write-through each attempt to `answers`/`item_mastery`; seed initial boxes from existing assessment evidence at first launch |
| P7 | Mastery ceremony message "No new stones yet. These sounds will come back" is honest and right — but after a perfect run it is the *only* mastery feedback | Add the near-miss state: "s is one good day away" (box/streak data already exists) [inferred] |

### U — UI / UX

| # | Finding | Fix |
|---|---|---|
| U1 | **Two exits on screen at all times** ("Close" top-right global + "Back to the Den" top-left) — ambiguous for a 5-year-old | One home button (Den icon), one place. "Close app" lives on the Den only |
| U2 | **HUD noise while walking**: name pill + trail counter + two currency pills + objective card + guide call | Walking shows: guide call + collectible count *only when it changes*. Currencies appear on collect (+1 fly-up) and in Den/Post |
| U3 | **Admin-panel skin**: dark navy cards, ALL-CAPS micro-labels ("SEEDWAKE SATCHEL", "THE STONE WALL"), Georgia serif headers (`quest.css:276,311,2308,2551`) clash with the rounded child UI | One display face (rounded, chunky — match the app's comic theme), sentence case, min 18-22px body; kill serif |
| U4 | **Ceremony = receipt**: five 12-counts, two currencies, relic name repeated twice, seven text blocks (`seedwake-reward-equipped.png`) | Rebuild as staged moments: relic lights → creature wears gear (big, centre) → stars land → ONE number (stars) → voiced "Seedwake is awake again." Everything else belongs to the Den/teacher report |
| U5 | **Map is abstract**: CSS hills + SVG curve + text-card stops ("Unexplored", "0 of 5"); design promised illustrated act maps with drawn roads | Ship the 3 painted act maps (spec §13 of the design plan, generator pipeline exists); stops = carved-marker art with star pips; fog silhouettes for locked stops, no "Unexplored" text |
| U6 | **Creator layout**: 60% dead space, near-identical body thumbnails, text-only tabs, no scene | Egg/nest scene backdrop; bigger differentiated previews; icon tabs (paw = feet, eye = eyes…); voiced "Make your creature!" |
| U7 | **Tap targets** below the house rule (44-56px live; the rule itself targets dead `.qs-*` selectors) | Re-point the rule at live `.qw-*`/`.qh-*`/`.q2d-*` classes; 64px min; add an eslint-style CSS check to `check:quest` |
| U8 | **Entry point**: flagship = text pill; "Quest" tile = a different mode | Give Sound Seekers the hero card in the grid (key art + creature); rename the mission tile "Skills Quest"; add Sidebar entry for teachers |
| U9 | **Phone encounter layout**: top 45% is empty wash while the task floats in a dark card (`world-s1-question-phone.png`) | When encounter opens on phone, camera should frame the encounter prop behind a shorter card; or paint the culled area with the stop's parallax panel |
| U10 | `prefers-reduced-motion` ignored by the 3D loop; settings flag only drops quality tier | `matchMedia` at hub mount → damp camera lerp/bloom/particles/gate swing; honour the settings flag the same way |
| U11 | iPad Safari lands **rich** tier by defaulting `deviceMemory` to 8 | Probe-based tiering: first-frame time + `getParameter(MAX_TEXTURE_SIZE)` heuristic, cache result in settings [inferred fix, observed bug] |

### A — Art / graphics

| # | Finding | Fix |
|---|---|---|
| A1 | **Terrain/materials are blockout**: single-colour grass plane, painterly-streak road texture stretched flat, hard road edges, visible seams and a z-fighting line-fan at bends (`phoneme-slots-blend.png` top-centre) | Material pass: tri-planar grass with colour variation + baked AO strip along road edges; fix the degenerate road-join geometry; blend road→grass with a transition ring |
| A2 | **The player creature (3D) kills the charm**: capsule body, stuck-on face with **default frown**, one stub arm, ball-hand; hat/staff read as floating primitives (`world-s12/s24`, `seedwake-gate-open.png`) | Either (a) billboard the 2D vector creature in-world — the original locked design, preserves all 13.8M combos and the Den/creator identity; or (b) commission one properly stylised rigged mesh per body with a face that defaults to **happy**, blinks, and reacts (cheer/think/sad-for-1s). (a) is one slice; (b) is a studio task. Recommend (a) [inferred] |
| A3 | **Gates/climax props are brown primitives** with floating white orbs (`seedwake-gate-open.png`) — the chapter's emotional peak looks like placeholder | One authored gate set-piece per chapter (8 total): painted textures, opening animation, light spill, particles matching the relic |
| A4 | **Kit coherence fixed only for s1-s5**; Act II/III still show clashes (bright hedges + green bushes in bone desert; murky flat light in Moonwood — `world-s12/s24-ipad.png`) | Extend the WS5 allowlist approach chapter-by-chapter (`SEEDWAKE_ASSET_ALLOWLIST` pattern → per-chapter manifests); relight: Fossil Ridge = warm amber key + long shadows; Moonwood = cool key + emissive fungus/fireflies |
| A5 | **Encounter staging is sparse**: letter blocks on hay bales in an empty road (`s1-encounter-1-hungry-beast-ipad.png`); the "beast" is a mud-brown generic model | Each encounter kind gets a staged vignette (flower ring, bridge gap over water, cave mouth, pen fences) + one charming resident model per world; camera frames it (the deterministic camera work from WS1 makes this cheap) |
| A6 | **Collectibles/props mismatch**: sun-drops are 2D sprites floating over 3D; parcel objects tiny/ambiguous at distance (`s3-verb-action.png`) | 3D-billboard drops with glow + pickup burst; parcels = oversized, silhouette-readable objects from the word's image bank |
| A7 | **Sky/ground mismatch**: painted sky panels are lovely; horizon line where 3D ground meets them is a hard cut (`s1-wide-ipad.png`) | Fog band tuned per lighting arc + a painted far-hills card between terrain and sky |

### C — Content / copy

| # | Finding | Fix |
|---|---|---|
| C1 | Register drifts adult: "cache", "banked", "sound evidence", "conduct", "chorus", "relic retained" | Copy pass to CVC-adjacent register; every line ≤8 words; verbs first ("Find the lanterns!") |
| C2 | 2D gate line: "Your progress and sound evidence are ready to bank." (`QuestTrail2D.jsx:154`) | "You did it! The gate is open." |
| C3 | Guide lines are good ("The old stones are humming. Hear it?") but unvoiced (see P2) | Record as-is — they're the best copy in the mode |
| C4 | Encounter prompt "Find the letter that matches the sound" replays only the phoneme via the play chip — fine — but the *sentence* is silent for non-readers | Include the 8 shell-instruction lines in the voice pack; auto-play once on encounter open |

---

## 5. Prioritised roadmap

Effort: S < ½ day · M = 1-3 days · L = a slice. Every row lands with its named check green.

**Phase 0 — Stop the bleeding (all S, do first)**
| # | Work | Closes |
|---|---|---|
| R1 | **CI**: GitHub Actions running `test` + `lint` + all quest gates + `shots` with non-zero exit on blank frames; block Vercel on red | P2-2, E12 |
| R2 | Server merge branch for `phonics_quest` + merge test case | E1 |
| R3 | Hydrate listener in QuestRoot | E2 |
| R4 | BLEND_RULES window fix + stale header rewrite | E5 |
| R5 | Unify mistake accounting (per-attempt everywhere) | E8 |
| R6 | Pluralisation + Trading Post header collision + single-exit HUD | E9, E10, U1 |

**Phase 1 — A non-reader can play alone (the TYMTR gap that matters most)**
| # | Work | Effort | Closes |
|---|---|---|---|
| R7 | **Voice pack** (~90 clips, manifest in §6) recorded via the KIMI gold-voice route; auto-play on guide/encounter/ceremony; speaker chips on example words; 2D teach speaks | M (+recording lead time) | P2, P3, P4, C4 |
| R8 | **Correction ladder** in the shell contract (2 choices → teach-back → re-ask; reveal in Signpost; requeue via `makeCatchUp`) | M | P1 |
| R9 | Icon language for the five verbs + objective card redesign (icon + ≤4 words) | S | P2 |
| R10 | Blend example words via `blendsIn` | S | E6 |

**Phase 2 — Finish the curriculum's promises**
| # | Work | Effort | Closes |
|---|---|---|---|
| R11 | Wire **trail-run** (ENCOUNTERS entry + DOM view + 3D fork-sprint staging) | M | E3 |
| R12 | Call **retire()** from the review path; box-5 sampling live | S | E4 |
| R13 | Record the 16 late-trail + 8 alt clips; unmute Sound Sort; gate mute stops until then | M (recording) | E7 |
| R14 | Bridge quest ↔ app mastery (write-through + placement seed) | M | P6 |
| R15 | Per-stop reward beat (stars/stone/gear choreography in-world) | M | P5 |

**Phase 3 — Look like a made world (the TYMTR polish bar)**
| # | Work | Effort | Closes |
|---|---|---|---|
| R16 | Typography + HUD skin pass (one rounded display face, sentence case, HUD diet) | M | U2, U3 |
| R17 | Creature v2: billboard the 2D vector creature in the 3D world (or commission rigged meshes); default-happy face, blink, answer reactions | M-L | A2 |
| R18 | Terrain/material pass + road-join geometry fix + horizon blend | M | A1, A7 |
| R19 | Chapter gate set-pieces ×8 + relight Acts II-III + per-chapter kit allowlists | L | A3, A4 |
| R20 | Encounter vignettes + resident characters + collectible upgrade | L | A5, A6 |
| R21 | Ceremony rebuild as staged, voiced celebration | M | U4, E11 |
| R22 | Illustrated act maps + carved stop markers | M | U5 |
| R23 | Creator scene + icon tabs; home-grid hero card + rename "Quest" tile; Sidebar entry | M | U6, U8 |
| R24 | A11y closeout: matchMedia damping, 64px targets + CSS check, probe-based quality tiers | M | U7, U10, U11 |

**Phase 4 — Prove it (commercial differentiator)**
| # | Work | Effort |
|---|---|---|
| R25 | Teacher panel v2: per-GPC heat map, weakest-five with dates, demotion log, **practice-assign** (pick GPC + shell → child's next session) | M |
| R26 | Funnel dashboards from the now-live telemetry (drop-off per stop, time-to-mastery per GPC) | M |
| R27 | Split QuestHub.jsx (renderer / rig / scene / state machine); test the three plain-JS quest files | L |

---

## 6. Voice-pack manifest (Phase 1, R7)

All human gold-voice, per house rule (no TTS). Counts derived from live copy:

| Set | Count | Notes |
|---|---|---|
| Guide lesson lines | 3 templates × reuse | Record the three world-guide lines with grapheme slot spliced from existing phoneme clips ("…it says" + clip) — or 40 stop-specific lines if splicing sounds wrong [needs ear-check] |
| Shell/encounter instructions | 8 | One per encounter kind, incl. trail-run |
| Verb objectives | 5 | find / jump / carry / order / rhythm |
| Ceremony + gate | ~10 | "The gate is open", chapter finale lines ×8 |
| Den / map / post / creator | ~12 | "This is your Den", "Pick a trail", "Make your creature", economy line |
| Praise (randomised) | 10 | "That's the one." "Nice ears." |
| Gentle retry + teach-back | 8 | "Not that one. Listen again." + "This one says —. Now you find it." (grapheme spliced) |
| Letter-name prompt | 2 | "Its name is —" / "It says —" |
| Alt pronunciations | 8 | E7 — unblocks Sound Sort |
| Late-trail teach clips | 16 | E7 list from `check:quest` |
| **Total** | **≈80-90 clips** | Batch as one KIMI request doc |

---

## 7. What I could not verify from here

- `npm run build` and the full 438-test suite (sandbox lacks the platform binaries; unit subset ran green [executed]).
- Any audio quality, and the ceremony-satchel zeros in live play (E11 [verify]).
- Live 3D feel (camera, frame rate on a real iPad) — judged from the deterministic harness PNGs only.

**Full gate to run after any of the above lands:**
```bash
rm -rf dist && npm run build && npm test && npm run lint \
  && npm run check:quest && npm run check:quest-3d && npm run check:quest-art \
  && npm run check:quest-music && npm run check:quest-gate && npm run check:quest-route-visual \
  && npm run check:quest-slice-camera && npm run shots
```

---

## 8. Closing note

Yesterday's audit ended: *"the seam between the logic and the screen is where the tests stop and the CI doesn't exist."* One day later that is still the truest sentence about this mode — the slice proved the team can close screen-level gaps at speed *when a brief names them*. This document is that brief for the remaining distance. The order matters: **CI and the merge fix protect children's data this week; voice and correction make the game playable by its actual audience; the art pass is what finally makes it look like Teach Your Monster — and it should go last, because it is the only layer that can't corrupt a save file.**
