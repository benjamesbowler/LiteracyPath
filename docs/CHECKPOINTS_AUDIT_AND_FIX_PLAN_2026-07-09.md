# Checkpoints (skills assessments) — audit + fix plan (2026-07-09)

Audited: bank loading (`loadAssessmentSkillBank.js`), selection (`App.jsx
pickQuestion` ~4700–4880), scoring (`masterySystem.js`, `buildCheckpointDecision`
App.jsx ~5378), banks (`qbAssess_*`, expansions, generated), plus all four of
the repo's own validators (run fresh; outputs in docs/validation/).

**Verdict:** the machinery is mostly honest — options shuffle at render, repeat
guards are real and wired, no hardcoded answers, no onset giveaways (validator:
0 across 30 skills). The problems are: a handful of factually wrong/ambiguous
answer keys, a longest-answer tell in comprehension banks, thin pools that
force repeats, and a mastery model that passes on accuracy alone and can never
be un-earned. Validators are structured to "pass" while warning about real
failures, which is how these survived.

## A. Wrong or ambiguous questions (fix the content — P0)
1. `p3_digraph_word_th_6`: "starts with th?" options include BOTH `thumb`
   (keyed) and `thin` — two right answers, one scored. Same in
   `p3_digraph_word_wh_7` (`whale` keyed, `wheel` also correct). Live items.
2. `qb12_rh_041`: "'She fell in the ___.' rhymes with 'well'" — options
   well/bell/fell/sell ALL rhyme; key is `bell` but the sentence begs `well`.
3. `qb14_th_028`: prompt stored in the passage field, asks theme-vs-plot —
   metalinguistic, above age band, malformed record.
4. `grammar_adjectives_l2_002`: all four options grammatical; the tiebreaker
   image is the CVC card for "red", not the scene. Near-duplicate items across
   L1/L2 (`grammar_nouns_l1_001` = `l2_001`).
5. `qb12_cvc_020`: distractor "fen" isn't K-vocabulary.
**Fix:** sweep every bank with a new validator: (a) exactly one option may
satisfy the prompt's rule (start-sound/rhyme/middle-sound checks are
mechanisable with the existing grapheme helpers); (b) no empty prompt with
non-empty passage; (c) no duplicate prompt+answer across levels of a skill;
(d) distractor vocabulary must come from the approved child word list. Fail
the build on violations (no warn-and-pass). Then correct the flagged items.

## B. Longest-answer tell in comprehension (P0)
Correct option is uniquely longest in main_idea **80%**, theme 72%, inference
59%, cause_effect 52% of items — a child (or teacher) can pass without
reading. **Fix:** length-balance pass over these banks (pad distractors to
±20% of key length or trim keys); add validator: ≤35% uniquely-longest per
skill; regenerate the worst items.

## C. Pool sufficiency (P1)
Verbs **25** and adjectives **25** runtime questions cannot fill two
15-question checkpoints without repeats (the loader's GRAMMAR_SENTENCE_FIT
filter cuts 118/122 authored items to 25 — validator counts the pre-filter
number, so the gap is invisible). Digraphs L1 fills only 9/15 unique targets
per round (repo's own audit, all 3 rounds); rounds 2–3 reuse ~14/15 words in
most skills. Sentence Picture Matching has **0** media-complete items (target
30). Thinnest runtime pools: verbs 25, adjectives 25, nouns 90, hfw_76_100
148, hfw banks 150 each (~half spelling-tile variants), r_controlled 161.
**Fix:** author to a floor of 45 runtime-eligible items per skill (3 clean
rounds); make `checkRepeatSelection` count POST-filter runtime pools and fail
under the floor; unblock/complete Long Vowels silent-e targets and the
gl/pl/gr/pr blends; clean garbage blocked-target keys ("3", "cet", "bat hat").

## D. Mastery model (P1 — the "cheat-fix" cluster)
1. `getMasteryRule` force-overrides every skill to 15 questions / 80% — the
   per-skill rules table above it is dead config. Delete the table or honour it.
2. `mastered || prev.mastered` ratchet: one lucky 12/15 = mastered forever;
   failed retakes never demote. Add decay/demotion (two consecutive fails
   clears mastered) or at minimum surface retake results on the teacher view.
3. Coverage is computed and displayed but never gates a pass (except
   initial/final sounds): HFW 1-25 can be mastered having seen a subset of
   words. Gate: pass requires accuracy AND ≥80% of the skill's target set seen.
4. Two-option coin-flip items (61 homophones, 28 rhyming, 28 svd, 30
   sentence-comprehension) score identically to 4-option items. Weight them
   0.5, or require 3 options minimum for checkpoint eligibility.
5. `saveMasteryToSupabase` hardcodes `attempts: 1`; teacher "secure" label
   fires at 2 data points (App.jsx ~6247). Record real attempts; require ≥5
   evidence points for "secure".

## E. Guardrails so this stays fixed (P1)
Make all four validators FAIL (non-zero exit) on: two-correct-option items,
uniquely-longest >35%, runtime pool < 45, 0-media skills, pool_exhausted
gaps, >20% recent-word reuse in simulated round 2. Wire them into the same
gate as tests (`npm run gate:assessments`), so warn-and-pass can't recur.

## Order of work
1. P0 content sweep + new single-correct/length validators (one commit).
2. Pool floors + runtime-count fix in checkRepeatSelection + author thin
   skills to 45 (verbs, adjectives first) (one commit per bank batch).
3. Mastery: honour per-skill rules, coverage gate, demotion, real attempts,
   evidence floor (one commit + unit tests on buildCheckpointDecision —
   extract it from App.jsx into a pure module first so it's testable).
4. Validator hard-fail wiring (final commit).
Every commit: `npm run test:unit && npm run lint && npm run build` green
before push. Never claim done without naming the passing check.
