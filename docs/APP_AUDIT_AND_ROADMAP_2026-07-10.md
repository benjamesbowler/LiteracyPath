# Literacy Guide — Full App Audit & Roadmap (2026-07-10)

Four parallel deep-dives: bloat/dead-weight, educational content, kid-side UX/logic, infrastructure/overlaps.
Every finding cites file:line and is labeled VERIFIED (read at source) or SUSPECTED (needs runtime check).

---

## Part 1 — Bloat removed (done, in this commit)

~170MB deleted from the deploy. Every deletion was reference-proven: a file was removed only if
neither its exact path nor its basename appears anywhere in src/, AND no code constructs its path
dynamically. Two near-misses prove the gate was needed (see "checked and KEPT" below).

Deleted:
- `public/media/_replaced/` (53MB) + `public/media/_rejected/` (8MB) — media QA graveyards from 2026-05, zero references.
- `public/images/scenes/` (13MB) — an abandoned scene-image bank; only the disk-scanner tool knew it existed.
- `public/images/child-mode/echo-caves/` (14MB) + `rumble/` (11MB) — art for two game concepts that never shipped; not referenced even by the dead ChildMode page.
- `public/images/child-mode/ui/` orphans (16MB), `vowels/` + `minimal-pairs/` orphans, ~13 unreferenced `images/comprehension/*.png` (~15MB) — file-level orphans inside otherwise-live dirs, exact-path verified against the generated registries.
- `public/media/learn/images/` orphans (32MB) — old cycle-01 lesson media superseded by Present mode; the referenced subset stays.
- `public/audio/music/* 2.mp3` Finder duplicates (6MB, untracked, byte-identical).
- Dead code: `src/components/ChildMode.jsx` (1,046 lines, zero importers, contained a rival "Space Hub" economy contradicting coins-only rewards), `src/components/books/PageTurnReader.jsx` (dead + wrote an unscoped localStorage key), `Gem.jsx` (gem era), `src/utils/reelReadLevels 2.js` (stray duplicate whose edits would silently do nothing).
- Audio manifest regenerated after deletions; 230/230 unit tests and eslint 0 errors after.

Checked and KEPT (looked dead, proven alive):
- `public/images/assessment/hfw/*.webp` (74MB) — built at runtime: `assessmentMediaRegistry.js:423` constructs `/images/assessment/hfw/${word}.webp`.
- `public/media/initial-sounds/` (28MB) — built at runtime: `initialSoundWordBank.js:375`.
- `public/images/story-quests/dino-pals/` (54MB) — paths constructed per quest slug; all 6 disk quests are in the data.
- `public/learn-decks/` (84MB) — referenced by `src/data/learnDecks.js` deck player.
- `public/images/pals/poems/` — constructed in `presentationBuilder.js:686`.
- `public/images/child-mode/` question media (bulk) — live generated question banks reference it.

Not yet deleted (recommend, but decide deliberately):
- `docs/validation/` history and superseded audit reports — repo-only weight (doesn't ship). Archive to a `docs/archive/` folder or delete; the audit tools regenerate their outputs.
- Root preview files (`*-preview.html/jsx`) — dev harnesses, don't ship in the build; harmless.
- `tools/` twins (5 pairs doing the same job) — listed in Part 2, delete one of each after confirming which is current.

---

## Part 2 — Verified issues (ranked, deduped across the four audits)

### P1 — fix next (trust, money, or pedagogy at stake)

1. **Comprehension distractors corrupted with nonsense padding.** ~150 live items in `qbAssess_main_idea.js` (70/100), `qbAssess_cause_effect.js` (40/100), `qbAssess_inf.js` (36/60) have distractors ending in tacked-on qualifiers ("every day every day", "after lunch", "with friends"). Children pick answers by spotting gibberish; TTS reads nonsense. Fix: rewrite padded distractors as plausible-but-wrong statements; add a hard-fail rule to `auditCheckpointIntegrity.js` banning trailing-qualifier padding. VERIFIED.
2. **First book of the day: quiz killed 1.6s after it opens.** `GuidedReadingPage.jsx:876` fires the mission event before the quiz; `App.jsx:7642` yanks the child to Home 1.6s later, unmounting the quiz and losing `quizScore` (the teacher-facing record). Same mechanism kills the EL cycle-check celebration/certificate (`ElSkillsQuest.jsx:459`). Fix: fire mission events on quiz-finish/celebration-dismiss instead. VERIFIED.
3. **Hollow never recomputes after cloud hydration.** `HollowPage.jsx:155` memoizes the wallet on `[scope]` only — the identical bug already fixed on Home. On a fresh device a child can be blocked from purchases or double-spend. Fix: add the same `lp-progress-hydrated` listener. VERIFIED.
4. **Coin messaging contradicts the economy 7×.** `AdventureGame.jsx:25` and `ArcadePracticeGame.jsx:53` show "+N coins" (1:1) while the economy pays 7/star (`hollowEconomy.js:21`). Fix: `+{stars*7}` + rename the leftover `kid-gems-earned` class. VERIFIED.
5. **Arcade "hear instructions" is silent for all 8 arcade games.** Recordings exist only for the 6 old practice games; browser TTS is a deliberate no-op. Pre-readers tap and get nothing. Fix: record 8 gold-voice clips at `/audio/learn-games/instructions/<slug>.mp3`, hide the button when no recording exists. VERIFIED.
6. **BookQuiz requires reading, with zero audio.** `BookQuiz.jsx:170` — prompt and choices are text-only in the one place Level-A readers must answer questions. Fix: speaker button per choice + recorded prompt. VERIFIED.
7. **main_idea "level 3" passages are adult-register** (digital detox, light pollution and the cosmos, decades of artistic regret; grade 5–7 readability). Fix: replace the 20 `l3` passages with 40–70-word child-topic texts. VERIFIED.
8. **28/200 preposition items have a synonym of the answer as a distractor** ("in" vs "inside", "under" vs "below") — both are correct English. Root cause: `prepositionClozeScenes.js` reuses identical stems under different keys (lines 25/44, 38/83). Fix: synonym-exclusion sets in the generator + unique scenes; regenerate. VERIFIED.
9. **Bundle: manualChunks re-merges lazily-split banks into monoliths.** `vite.config.js:110-126` glues independently dynamic-imported banks into 3.3MB/2.5MB/1.8MB chunks; `loadAssessmentSkillBank.js:12-49` statically imports 1.5MB of expansions paid on the first question of ANY skill; `App.jsx:24-33` eagerly ships teacher pages (AppPages 121KB etc.) to every student. Fixes are config-level (~30 lines) and cut the first assessment payload by several MB. VERIFIED.
10. **Nine practice games are unreachable** except via one random daily-mission deep link (no `surfaces:["arcade"]`, and the "they live in Daily Challenge + EL maps" comment is false — EL builds its own rounds). Fix: a second "Practice" shelf in the arcade hub. VERIFIED.

### P2 — schedule soon

11. **Sentence Express is fully built but wired nowhere** — not in `GAME_LIST`, not in `games/index.js`. It also fires `onComplete(object)` per level while `GamePlayer` expects `(stars, score, words)` once — unadapted it would record NaN stars. Needs: registry entry, GAME_LIST entry, `/images/learn-games/art/sentence-express.webp`, and a completion adapter. VERIFIED.
12. **Checkpoints resurrect across devices** — `progressMerge.js:111` forward-merges `checkpoints.<difficulty>.level` by max, resurrecting cleared checkpoints from stale cloud rows. Exempt checkpoints (last-write-wins). VERIFIED mechanism.
13. **Sound Racer bests + EL last-stop + book-level overrides live in unscoped/unsynced localStorage** (`SoundRacerGame.jsx:429` etc.) — siblings share bests on one iPad; teacher overrides don't follow the teacher. Route through PROGRESS_AREAS. VERIFIED.
14. **`assessment_attempts` and `el_assessment_reports` are write-only tables** — upserted, never selected; per-question teacher review is single-device only. Add hydrate-on-load reads. VERIFIED.
15. **CVC bank contains non-CVC words** ("tree", "star", "train", "bread") feeding "build short vowel words" games (`learnGamesData.js:10-19`). VERIFIED.
16. **Sound Safari hard tier demands 8–9 phoneme segmentation** ("witchcraft", "dragonfly") — K-2 norms top out ~5-6. Cap at 6. VERIFIED.
17. **Poem findWords use untaught graphemes in 10 cycles** (C1 "moon" before oo, C9 "queen" before e). Constrain findWords to taught-graphemes-or-cycle-HFW. VERIFIED.
18. **Egg dead-end**: a child owning all commons pays 100 coins, hatch dedupes, gets nothing but a celebration (`hollowEconomy.js:226` vs `:269`). Gate `canBuy` on unowned species or pay a berry pity-reward. VERIFIED.
19. **Hollow room art generated but never wired** — `scene-meadow/dino/moonwood.webp` + 4 `band-*.webp` are committed and orphaned; either wire them as Hollow room backdrops (original intent) or delete. VERIFIED.
20. **Four parallel audio resolvers** (audioTextIndex, audioPreferenceManifest, learnGamesAudio, cuePlayer) with divergent fallbacks; consolidate into one module. VERIFIED.
21. **~50 dead CSS rules** for removed pages (`.rewards-page`, `.kid-gem-counter`, old arcade skin in `arcade-dark.css`) + dead `treasureTrail` gem/badge computation still running per render. Purge sweep. VERIFIED.
22. **ConfettiCelebration ignores reduced-motion** (180 pieces unconditionally) while App.jsx gates its own confetti. VERIFIED.
23. **Missing `egg-welcome.webp`** — the one Hollow catalog item rendering as an emoji. Generate it. VERIFIED.
24. **Four pattern-A books labeled level B** (`gr-a-26..29` "Pets" etc.). Verify intent or relevel. SUSPECTED.
25. **Leaderboard RPC scoping unverifiable from client** — `get_game_leaderboard` takes a client-supplied school id and returns student names; confirm the SQL enforces scope server-side. SUSPECTED (check in Supabase dashboard).

Coverage headline (education audit): **initial sounds have 5 practice surfaces and CVC has 8, while all
14 assessed comprehension/language skills (main idea, inference, cause/effect, nouns, verbs, prepositions,
r-controlled vowels…) have zero.** The assessment system tests a curriculum twice as wide as the practice system.

---

## Part 3 — Ten deep improvements (exactly how)

1. **Build the comprehension arcade.** Close the biggest gap: (a) wire Sentence Express (see #11 above) as the sentence-comprehension flagship; (b) add a "Story Detective" arcade game reusing the ArcadePracticeGame shell + the (repaired) qbAssess banks: 60-second illustrated micro-story, then 3 tappable questions with audio, star rubric from `starRubric.js`; (c) an r-controlled/vowel-team round pack for Sound Safari. Every assessed skill gets ≥1 practice surface; route checkpoint failures to the matching game ("Practice this, then retry").
2. **Kill the 1.6-second yank.** Move `notifyMissionTaskDone` calls to quiz-finish (`GuidedReadingPage.handleQuizFinish`) and celebration-dismiss (`ElSkillsQuest`), and make the App.jsx listener no-op while a quiz/celebration is open. One afternoon, fixes findings 2 and the certificate bug at once.
3. **Content integrity gate.** Extend `tools/auditCheckpointIntegrity.js` with three hard-fail rules: trailing-qualifier padding (regex on distractors), synonym-of-answer distractors (preposition/antonym synonym sets), readability ceiling per level (syllable+sentence-length heuristic). Then rewrite the ~170 flagged comprehension items to pass. The audit already runs in the push gate, so corruption can never ship again.
4. **Bundle diet.** Delete the three bank groupings in `vite.config.js:110-126`; convert `loadAssessmentSkillBank.js`'s 45 static imports into per-skill `DYNAMIC_BANK_LOADERS` entries; replace the `earlySkillQuestions` barrel with four entries; emit a keys-only module for `hfwRuntimeEligibility`; `lazyWithRetry` the five eagerly-imported teacher pages in App.jsx. Expected: student first-load drops by ~2-3MB gzipped, first-assessment payload drops ~70%.
5. **One audio system.** Create `src/utils/audio/resolveAudio.js` as the single word→clip resolver (manifest + preference + blocklist), make the four existing layers call it, and record the 8 missing arcade instruction clips + BookQuiz prompts in the gold voice. Rule going forward: no child-facing screen ships without an audio affordance (add a unit test that greps child screens for the speaker component).
6. **Economy coherence pass.** Fix the 7× message, the egg dead-end, HollowPage hydration, wire or delete the orphaned room art, generate `egg-welcome.webp`, purge gem-era CSS/code. One commit, mostly one-liners, makes the reward loop feel professionally finished.
7. **Cross-device integrity.** Move Sound Racer bests + EL last-stop + book overrides into PROGRESS_AREAS; exempt `checkpoints` from forward-merge; hydrate `assessment_attempts` on student load so teacher per-question review works from any iPad.
8. **App.jsx decomposition** (8,412 lines): extract the assessment round engine (~900 pure lines → `src/assessment/roundEngine.js`), the export/report block (~700 lines → `src/utils/exports/`), and session+hydration (~400 lines → `src/appState/studentSession.js`). Do it one module per commit with the test suite as the gate; future changes stop being archaeology.
9. **Difficulty-to-curriculum alignment.** Filter digraph/-ng words out of easy game tiers, fix the CVC bank, cap Sound Safari segmentation, constrain poem findWords — then encode "easy=cycles 1-9, medium=10-18, hard=19-27" as data so every round generator can enforce it (one shared `taughtGraphemesForTier()`).
10. **Playtest instrumentation.** Add a tiny event logger (game started/completed/quit-early, per-question right/wrong, time-on-task) writing to one Supabase table. This is the difference between guessing and knowing which of the 17 games children actually love — and it powers the teacher engagement report you already built.

## Part 4 — Ten next steps for growth

1. Ship the parent link: a read-only progress page per child + an automated Friday email (streak, books read, skills mastered) built from the engagement data already computed for teacher exports.
2. School pilot kit: a 10-minute teacher onboarding deck (use Present mode itself), CSV class import, and a printable per-cycle worksheet pack — the three things a school asks for on day one.
3. Pricing scaffold: free single-class tier → per-school license; put Stripe behind the teacher dashboard now so the beta→paid conversation is a toggle, not a rebuild.
4. PWA installability + offline: service-worker caching for the audio manifest and current cycle's media so classroom iPads survive bad Wi-Fi; then a Capacitor wrapper for App Store presence.
5. Efficacy evidence: run a pre/post study with the beta school using the BOY/MOY checkpoint data you already collect; a one-page "measurable growth" PDF is the single strongest sales asset in edu.
6. SEO content flywheel: publish the 27-cycle scope & sequence, per-cycle poem pages, and decodable book lists as public pages — teachers search for exactly these terms.
7. Teacher referral loop: "invite a co-teacher" with both classes getting extended trial; teachers are the viral channel in K-2.
8. Retention events: the seasonal Hollow caravans and monthly book drops already exist mechanically — market them (in-app "new this month" banner + email).
9. Case-study capture: in-app NPS + a "share a win" prompt for teachers; harvest quotes while the beta school is engaged.
10. Distribution partnerships: EL-aligned curriculum marketplaces and homeschool co-ops fit the existing content shape with zero product change.

## Part 5 — Ten things we aren't doing that we should be

1. **Error telemetry** — no Sentry/crash reporting; a child hitting a white screen is invisible. (Half-day to add.)
2. **Product analytics** — no funnel/usage data (PostHog or the Supabase event table from improvement #10).
3. **CI** — every gate runs on one MacBook; a GitHub Action running tests+lint+build on every push ends "works on my machine" risk.
4. **E2E tests** — zero browser tests; five Playwright golden paths (login→mission→game→reward; assessment round; report export; Present deck; Hollow purchase) would catch what unit tests can't.
5. **Backups/DR** — confirm Supabase PITR is enabled + schedule a weekly SQL export; today a bad migration is unrecoverable.
6. **COPPA/FERPA posture** — student names flow through a client-parameterized RPC; needs a server-side scope check, a privacy policy page, and a data-retention statement before selling to US schools.
7. **Accessibility** — inconsistent reduced-motion, no dyslexia-friendly font option, unaudited touch-target sizes — for a literacy app this is product, not compliance.
8. **Healthy-use design** — no session-length awareness or "great work, come back tomorrow" moment; parents notice.
9. **In-app content feedback** — teachers can't flag a bad question from the report review; a one-tap flag writing to a Supabase table turns every classroom into QA.
10. **Architecture documentation** — progress areas, audio pipeline, bank loading, deploy flow live in memory and chat history; one ARCHITECTURE.md makes every future contributor (human or AI) faster and safer.

---

*Method note: three parallel audit agents (education, kid-side, infrastructure) + a reference-proven bloat scan.
All 230 unit tests and the checkpoint integrity audit pass after the deletions in Part 1.*
