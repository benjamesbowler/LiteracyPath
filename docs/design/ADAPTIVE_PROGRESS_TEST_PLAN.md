---
type: design-proposal
status: stages-a-c-implemented-locally
updated: 2026-10-02
authority: proposal-only
---

# Adaptive Progress Test — implementation proposal

**Decision proposed:** add a teacher-assigned **Progress check** that finds suitable
question difficulty from the child's independent first answers. A correct answer
raises the next target difficulty in that track; an incorrect answer lowers it.
Separate literacy tracks keep a difficulty change in word reading from changing
the difficulty of oral comprehension. Start with an honest adaptive task profile;
add comparable growth scores only after calibration establishes their validity.

**State:** stages A–C are implemented locally as a descriptive correctness-adaptive
Progress check. [The current implementation and backend contract](../product/PROGRESS_CHECKS.md)
own operational behavior and evidence. This proposal retains the wider future
calibration design; stages D–E remain future work. Local implementation and automated
verification do not establish deployment, physical-device, human-listening or classroom
validation. The instrument is not an official MAP product or an equated assessment scale.

The first bank contains 576 original question prompts/choice sets: six tracks,
three reviewed ordinal tiers and 32 distinct families per tier. Spoken-word and
listening-stimulus recordings reuse approved exact existing media. Listening
passages were previously public, so the **questions** are reserved originals but
their **passages** are not claimed unseen. Known question/family/passage exposure
is excluded; unknown familiarity remains a reported limitation. New printed
reading passages are original. Existing isolated-word recordings remain reusable
across new contrast families; ordinary instruction/choice access may use the
Question Bible's browser speech accommodation, with actual delivery recorded.

**Source baseline:** executable sources inspected at
`ad7fa787bd3dffd84034cfb6c4a74dfcb2431096` on 2 October 2026. Read the current
sources again before implementation; implementation must not freeze this snapshot
as a parallel rulebook.

## 1. Problem, outcomes and boundaries

Current Skills phases check a named skill at a fixed level and phase. Skills trail,
Cycle Practice and Adventure Map are learning experiences with support. Teachers
need a separate periodic check that samples several literacy areas, adjusts to the
child, and shows what to investigate or teach next without confusing assisted
completion with independent performance.

The proposed product must deliver four outcomes:

1. A child encounters suitable questions, with correct/incorrect first answers
   changing difficulty within the relevant track.
2. Every result can be explained from its immutable items, responses, route and
   media delivery. Extra presses cannot improve the saved test answer.
3. Teachers receive sampled strengths, unresolved areas and a concrete next
   check or teaching move; absent evidence stays absent.
4. Repeated results can support progress interpretation only when the tasks and
   measurement model are demonstrably comparable.

The first release does not replace EL benchmarks, produce diagnoses or risk cut
scores, measure oral-reading fluency from tap speed, confer Skills phase passes,
or produce MAP/RIT, Lexile, percentile, age-equivalent or grade-equivalent scores.
There is no overall literacy score from averaging unrelated strands. All such
claims would need evidence and product policy beyond this proposal.

### User stories

- As a child, I can listen to the task, choose once, pause if needed, and finish
  without being shown a failure band or compared with classmates.
- As a teacher, I can assign a broad check, inspect its actual evidence, and
  request a focused follow-up for an area that was sparsely sampled.
- As a teacher, I can distinguish a literacy error from help, a skip, an unheard
  stimulus or a failed picture before deciding what to teach.
- As a teacher reviewing an old result, I can replay the administered content and
  recorded policy even after the current bank changes.

## 2. Current behavior and governing sources

| Current behavior, verified from source | Proposed addition |
| --- | --- |
| Thirty published v3 Skills banks; Level 1 and 2, each with two phases; the shared Skills phase rule is 70%. | A separate instrument with its own routing blueprint and saved instrument identity. Existing phases and their rule stay intact. |
| Formal Skills sitting plans are composed before administration. | A progress check freezes its eligible pool and blueprint at start, then selects items one at a time from the frozen pool. |
| Diagnostic mode in `assessmentRoundController.js` prioritizes recently missed diagnostic targets. | Explicit harder/easier routing on independent first responses; a different feature from weak-target prioritization. |
| V3 Level 1/2 labels describe authored entry/extension content, not empirically calibrated item difficulty. | Reviewed ordinal difficulty metadata within a specific routing track; later empirical difficulty parameters, if validated. |
| Required media fails closed and is replaced without scoring or progress credit. | Preserve that contract, including exclusions for every item sharing the failed source. |
| Skills trail already retains first-response, support and media evidence as voluntary practice. | Separate formal progress-test evidence; never relabel a practice event as a test item. |
| Completed assessment records include versioned immutable replay evidence. | Extend that envelope with the exact adaptive route and instrument-specific result. |

Sources governing implementation:

- [Instructional standard](../instructional/instructional_standards.md): EL
  teacher-confirmed placement, taught-code practice, HFW and evidence boundaries.
- [Skills mastery standard](../skills-assessment-rebuild/MASTERY_SYSTEM.md),
  [`skillBlueprints.js`](../../src/content/blueprints/skillBlueprints.js) and
  [`skillStatusPolicy.js`](../../src/policy/skillStatusPolicy.js): current Skills
  phases, status, retention and unit evidence. Do not add a second pass rule.
- [Authoring standard](../skills-assessment-rebuild/AUTHORING_STANDARDS.md) and
  [Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md): construct, prompts,
  distractors, audio roles, exact media and runtime publication checks.
- [Assessment media evidence](ASSESSMENT_MEDIA_EVIDENCE.md): actual availability,
  accessible evidence and unscored replacement.
- [Reporting Bible](../reporting/REPORTING_BIBLE.md), especially Laws 1–4 and
  Parts IV–V, and [learning policy](LEARNING_POLICY.md): scope, uncertainty,
  recency and the separation of achievement, participation and growth.
- [Immutable assessment evidence](../teacher/ASSESSMENT_EVIDENCE.md): archived
  content, policy, ownership, terminal attempts and replay.
- [EL benchmark suite](../EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21.md):
  original EL-aligned content, provisional suggestions and teacher confirmation.
- [Learning response-system proposal](LEARNING_RESPONSE_SYSTEM_PLAN.md): the
  companion design for teaching after errors and fresh independent re-probes.

### Policy change required before implementation

Question Design Bible §11 currently requires Correct/Not yet feedback, a brief
construct-linked reason and automatic progression. This proposal recommends a
**scoped progress-test exception**: neutral receipt during the scored sitting,
with teaching deferred until the test is over. Implementers must amend/version
that authority and its tests in the same change; they must not silently suppress
the existing rule or alter ordinary Skills feedback. Revealing an answer can
teach a later related test item and compromise independent evidence.

## 3. Child and teacher experience

### Entry and assignment

Add Progress check to the existing teacher Checks catalogue. The teacher chooses
learner(s), **Broad profile** or **Focused check**, and the intended administration
window. The assignment records the plan before a child starts. It is available
through the child's current assigned activity, without moving Skills trail into
an assessment role or making a progress test a daily reward grind.

The teacher start panel states what the selected plan will sample and what it
cannot conclude. For a new child, the teacher may choose a starting range with a
reason; that is only a test starting point. No initial setting writes EL placement.

### Preparation

Show one friendly panel with a speaker, a character and one **Let's begin**
button. Suggested spoken copy: “Some questions will feel easy. Some will feel
tricky. Choose what you think. You can listen again.” Do not announce that a
specific answer moved difficulty up or down.

Use two short unscored warm-ups for the actual touch and replay mechanics.
Use distinct non-test content, not a worked example of a scored target. Demonstrate
an unfamiliar mechanic again when it first appears. Verify required audio/image
delivery and comfortable target size before the scored test begins. A child who
cannot use the mechanic gets a different valid format or a teacher access review,
not incorrect literacy responses.

### Question surface

```text
┌───────────────────────────────────────────────────────┐
│ Progress check                 [Pause]                │
│ Small section trail:  ● ● ○                            │
│                                                       │
│           [Listen to the task]                         │
│           One short instruction                       │
│           Required picture / passage / spoken target   │
│           [Replay target, only when permitted]         │
│                                                       │
│           [Choice]   [Choice]   [Choice]                │
│                                                       │
│           [I don't know yet]                          │
└───────────────────────────────────────────────────────┘
```

Use the existing Woodland assessment components and cobalt design language.
Keep one centered task with complete evidence, large answer targets, predictable
keyboard focus and replay controls. Hide answer-revealing print or spoken options
when the construct requires it. Pictures are mandatory where they are evidence;
a picture is not required where it would answer a printed-word task.

One deliberate answer commits immediately. Controls freeze before any receipt.
A short, centered “Answer saved” receipt advances automatically when ready;
there is no Check or Continue gate and no correctness/answer reveal. Use the same
receipt and transition for correct and incorrect responses. The child's section
trail shows participation, without correctness colors or a fake fixed “x of y”
when the test may extend. If the next question is still loading, retain the
answered object with a neutral loading state rather than displaying a blank item.

Replay of the permitted instruction/stimulus is access, not automatically help.
Adult explanation, a clue or an answer reveal is support and makes that response
ineligible for independent routing/scoring. The teacher may record support through
private administration controls. There is no Show me button during the scored test.

Pause restores the same uncommitted item or the same committed receipt, freezes
foreground timing, and never asks an answered item again. The app offers an
optional break at section boundaries. A child or teacher can end early without a
failure label. A timer never measures literacy accuracy or silently marks wrong.

### Finish

The child sees “You finished your check” or “We saved your questions for later,”
with neutral encouragement and a clear return to their learning. No percentage,
ability band, proficiency label, leaderboard or answer-key pack is shown.
Correctness-based rewards do not apply to this instrument.

The teacher sees the immutable profile, coverage and two suggested next actions.
Practice can follow in a separate session after the terminal test is saved. Its
worked examples/retries do not rewrite test evidence or enter the same sitting.

## 4. Multi-strand blueprint

Use six report strands. Each contains **routing tracks with one explicit
construct and modality**, not a shared ladder across all listed skills.

| Report strand | Candidate source content | Evidence boundary / missing content |
| --- | --- | --- |
| Hear sounds | Spoken rhyme; audio-only same-initial/final-sound comparisons from eligible v3 items | Initial/final items answered with printed letters are sound-to-letter evidence, not pure oral awareness. Current coverage does not justify claims about full blending, segmentation or manipulation; those need original authoring. |
| Read words and spellings | Sound-to-letter items, CVC/short vowels, blends, digraphs, silent-e, vowel teams, r-controlled patterns | Track printed recognition, GPC application and encoding separately. Selecting/building an answer is not observed oral decoding or fluency. |
| Recognize common words | Four HFW banks, with recognition, spelling and contextual-use tracks | A higher numbered HFW list is not automatically a harder calibrated tier. Preserve Flash/Heart/temporarily irregular distinctions in teacher detail. |
| Understand words and sentences | Nouns, verbs, adjectives, prepositions, plurals, affixes, synonyms/antonyms, homophones | Grammar, oral vocabulary and printed morphology retain separate constructs; no pooled “language ability” cutoff. |
| Understand spoken stories | Listening variants of sentence/detail/sequence/main-idea/inference/cause/context/theme tasks | A listening track requires actual passage audio; do not use its evidence to claim independent reading. Existing item eligibility must be checked rather than inferred from a replay button. |
| Read and understand | Eligible text comprehension across those same eight Skills areas | Reading stimulus stays printed and unmodeled. Passage narration makes the item supported reading, excluded from independent reading routing. Show text and allowed instruction replay without reading the target for the child. |

The broad profile samples one declared representative track per strand initially.
Its blueprint names the sampled targets and format quotas. It does **not** claim
that all thirty Skills areas, or every subconstruct within a strand, were tested.
Teacher detail explicitly lists unsampled skills. New routes or a different track
selection create a new blueprint version and have separate comparison cohorts.

The teacher can assign a focused check in a specific track after the survey.
Do not send a child to an inappropriate printed-reading track because their
listening answers were strong. A child without accessible reading evidence still
has valuable listening results; the reading row remains unresolved or unassessed.

### Proposed product parameters — not current rules or validated test lengths

| Plan | Minimum valid independent responses | Maximum valid responses | Intended use |
| --- | ---: | ---: | --- |
| Broad profile | 4 per strand = 24 | 36 total, at most 8 in any one strand | Descriptive sampling and selection of focused checks. No named-strand proficiency judgment. |
| Focused check | 10 in the named track | 16 | Denser evidence for the actual construct; still descriptive in the uncalibrated release. |

Break a broad profile into short sections with a proposed break after eight valid
responses. Target comfortable classroom sessions and pilot actual duration; no
claim that a particular item count equals a validated minute estimate. Proposed
administration cap: offer a teacher/child break after 15 active minutes. Resume
the frozen attempt later, or end as partial. Time is an access/comfort control.

Invalid or supported presentations do not count toward valid-response quotas.
Separately cap all presentations at 48 for broad and 24 for focused plans, to
prevent endless replacement/skip loops. Reaching a cap yields an incomplete
profile with reasons, not fabricated quota completion.

These parameters belong in one future versioned progress-test policy module,
not copied into renderers, SQL, exports or this document as competing constants.

## 5. Starting point, adaptation and selection

### Initial test starting point

For each track, choose in this order:

1. A recent, comparable **progress-test** route with adequate independent evidence
   from the same track, modality, blueprint and difficulty version.
2. A teacher-selected test starting range, with reason.
3. A conservative entry tier defined by that track's blueprint.

Use the existing policy's current evidence window; do not create a second recency
window. Legacy Skills passes, practice stars and supported completion may inform
the teacher's choice but are not automatically imported as test ability estimates.
EL placement can constrain the initial taught-code sampling choice without
becoming the result of this test. All starting-point sources are saved.

### Release 1: ordinal adaptive routing

The first release uses an **authored difficulty order**, for example five tiers
`0..4`, inside each routing track. Tiers must differ in relevant demand: sound
contrast, grapheme/word structure, morphology, sentence relation or passage
reasoning. Obscure vocabulary, smaller buttons and extra instructions do not make
a valid harder tier. Five tiers are a proposed authoring target; a track with
only two defensible tiers exposes that narrower coverage honestly.

Existing v3 Level 1/2 and skill sequence numbers cannot be converted mechanically
to these tiers. Each item needs a reviewed `routingTrackId`, `difficultyTier` and
`difficultyRationale`. The runtime admits only explicit mappings. Do not claim
an ordinal tier is a psychometric ability score.

For each valid independent first answer at tier `d`:

```js
nextTier = correct ? Math.min(d + 1, trackMax) : Math.max(d - 1, trackMin);
```

The change applies to the **next visit to that same track**. The outer scheduler
also balances strand coverage, so the immediately following screen may sample a
different strand with its own difficulty state. Skips, missing media, support and
unanswered items leave difficulty unchanged. Do not use tap count or latency to
move difficulty, correct an error, diagnose disengagement or silently discard a
response. An adult can pause for an observed access problem and record it.

At floor/ceiling, use a fresh item in that boundary tier; do not invent content
outside the bank. A correct ceiling item means the current bank has not found
the child's upper boundary. Incorrect floor responses do not prove inability
below that floor or trigger an EL demotion.

### Content selection, applied before difficulty preference

Select eligible items in this order:

1. Correct instrument, frozen content version, published source, explicit track,
   response format and declared media/construct eligibility.
2. Exclude retention-only stock, rejected/quarantined items, failed sources,
   already administered items, semantic duplicates and enemy families.
3. Enforce the frozen plan's content/format quotas and remaining-slot feasibility.
4. Prefer the requested tier within that same track.
5. Among equivalent candidates, use a saved seeded tie-break with exposure
   control. Deterministic option shuffling remains separate from item selection.

If the exact requested tier has no eligible item, a same-tier validation probe
may be scheduled only when the blueprint permits it, with `routeDeviation` saved.
Never silently borrow another construct or an arbitrary harder/easier tier. If
no feasible completion exists, mark the affected track unavailable and finish
the other tracks as a partial profile. Required-media replacement retains the
requested tier and coverage intent.

The frozen plan includes a reachability check for possible future branches.
Every selection saves why that item was chosen, the pre/post track state and
remaining constraints. Reload replays saved choices, not a freshly seeded path.

### Example route

An illustrative printed-word recognition track starts at tier 1. A correct first
response requests tier 2; an incorrect response there requests tier 1. Later
correct responses can return to tier 2 and reach tier 3. None of these answers
changes the child's confirmed EL cycle or counts as a Skills phase sitting.
Actual item examples must be supplied by the current authoring/gates; this route
description does not establish particular words as calibrated test items.

## 6. Stopping and uncertainty

### Release 1 stopping

After its minimum count, a track may stop early only when the blueprint's required
coverage is met and one of these descriptive conditions holds:

- An observed adjacent boundary: at least two correct first responses at one
  tier and at least two incorrect first responses at the adjacent higher tier,
  each using distinct stimulus families; at least six valid responses total.
- The floor or ceiling is probed twice with the relevant outcome (incorrect at
  floor, correct at ceiling), on distinct stimulus families, and the plan minimum
  and coverage are met. A track may require more probes in its versioned blueprint.

Those conditions are **proposed routing heuristics**, not proficiency thresholds
or validated confidence criteria. At a budget of four items the broad survey
will often leave a track unresolved. Allocate extra items to unresolved tracks
in order of coverage deficit, then fewest valid responses, then a frozen tie-break.
Stop at the plan cap even if the boundary remains unresolved.

Contradictory evidence, such as success at a higher tier and repeated failure at
a lower tier, stays visible as an unresolved pattern. Do not force it into a
monotonic ladder or erase responses until a neat boundary appears. Broader
construct sampling and changing formats can also explain variability.

Stop or pause on adult/child request, loss of access, no safe media replacement,
unrecoverable pool exhaustion, or the presentation cap. Completion of the allotted
plan and completeness of evidence are independent fields.

### What the first release may report

Report actual sampled tasks, tier-by-tier counts, formats, modalities, first
responses, omissions and whether a boundary was observed. Use “difficulty profile
from this check” rather than “reading level” or “ability estimate.” Show uncertainty
as unresolved coverage, sparse counts and open floor/ceiling boundaries. Do not
draw a numeric confidence interval around an uncalibrated tier or percent correct.

A broad survey's four-to-eight items per strand never supports a proficiency
judgment. The Reporting Bible's minimum volume rules still apply, but **ten items
alone do not make adaptive percent correct a valid proficiency measure**. A check
that deliberately gets harder after success will not have comparable raw accuracy
to an easier path. Keep accuracy, if exposed in teacher detail, explicitly
descriptive of the administered items with its numerator/denominator. Do not feed
it into generic Secure/Developing logic, learner bands, class averages or rankings.

Until forms are linked, show repeated checks as separate dated evidence profiles.
Do not label a tier increase as measured growth, connect unequal difficulty paths
with a trend line, or pool practice with progress-test responses. A same-construct
comparison can show literal changed responses on documented comparable probes,
with limits; it cannot create a normed rate of growth.

### Later calibrated release

Establish empirical item difficulty from representative independent administrations
with an explicit calibration design, external-to-route validation sample, linked
anchors and fairness/fit checks. Select Rasch/1PL, 2PL, 3PL or a different model
only after testing assumptions. Multiple-choice chance does not authorize an
arbitrary “guessing correction,” and a multidimensional bank does not authorize
a single latent reading scale.

If a suitable model is validated, keep per-track posterior distributions and
update only from valid first responses. For a validated Rasch track, for example,
`P(correct) = logistic(theta - itemDifficulty)`; estimate item parameters from
data, not from authored tier numbers. Choose informative eligible items while
meeting hard content, exposure and independence constraints.

Calibrated stopping needs a minimum evidence count, fulfilled content coverage,
a precision target validated in simulations/pilot data, and a hard maximum.
Store the target, achieved interval, estimation method and stop reason. The target
must be on LiteracyPath's own validated scale; do not copy a MAP SEM cutoff.
If a cap is reached first, report the wider uncertainty and incomplete precision.

Only validated common constructs may have linked longitudinal scores. Report
change with uncertainty from both administrations and their covariance/linking
method; avoid a simplistic gain-minus-two-independent-SEs rule when estimates
are dependent. Norms, percentile growth and benchmark/risk cut points remain
separate research projects. Reporting Bible volume, comparability and trend rules
still govern; insufficient strand samples remain descriptive even with IRT.

## 7. Independent evidence and item-bank readiness

### Response contract

- First deliberate construct-bearing response is immutable. A second tap, key
  press, route change, refresh or save retry cannot replace or duplicate it.
- A construction task may permit arranging before submission, as its mechanic
  declares; freeze its first complete submitted construction, not every tile tap.
- `correct` and `incorrect` route only when required evidence was available,
  required stimulus audio actually completed where the construct demands it,
  and no assistance was recorded before submission.
- `skipped`, `no_response`, `supported`, `media_failed` and `not_administered`
  remain distinct, unscored outcomes for this instrument. A wrong independent
  answer is different from a child who did not answer.
- Instruction replay and stimulus replay are recorded separately. Delivery proves
  the clip completed, not that the child heard or understood it. Accessibility
  accommodation is not automatically teacher coaching; log its actual effect
  and preserve the declared construct/modality.
- If an access failure is discovered after an answer, append an explicit evidence
  invalidation/correction record with reason and actor; preserve the original
  response and every item/route decision that actually occurred. Recompute the
  final summary and future routing state from the valid ledger, record the
  correction boundary, and never pretend a different item was administered or
  silently convert an incorrect response to correct.
- Store foreground response time with its start boundary or `null` when unknown.
  It is contextual telemetry, not a cheating/attention/ability judgment.

The companion [response-system proposal](LEARNING_RESPONSE_SYSTEM_PLAN.md)
teaches after learning errors and uses fresh transfer tasks. The progress-test
runner does not enter that teaching/retry state while the scored sitting is active.

### Bank requirements

Keep one content authority: current v3 authoring and gate output. Add progress
eligibility and reserved-purpose metadata to the relevant authoring records, with
generated filtered views if useful; do not revive legacy banks or copy questions
into an independently edited progress catalogue. New oral-awareness tracks need
original items and approved formats, with corresponding blueprint/gate updates.

The v3 publication gate remains necessary but is not sufficient to certify a
progress test. A progress-test readiness check must additionally prove:

- Explicit construct, modality, track, difficulty rationale, stimulus family,
  enemy-item groups and exposure policy for every eligible item.
- Genuine fresh content for two complete supported branch paths: initial and
  later administration, including floor, ceiling, oscillating, mixed and
  replacement cases. Stock is sized by worst-case route demand, not total IDs.
- Named unit/content coverage and more than one response format when the
  construct supports it; a different mechanic is never fabricated for a quota.
- Complete exact evidence media and actual replay roles with no print/audio
  leakage, near-duplicate picture keying, or answer-position shortcuts.
- Distinct ordinary Skills, Skills retention and progress-test reserves. Progress
  checks never consume Skills retention-only items or deplete formal phase stock.
- Prior practice exposure checked at stimulus-family level. An exact or semantically
  equivalent rehearsed item does not become “unseen” by changing its ID or option
  order. Learning a grapheme, word or concept is the intended source of progress;
  it does not disqualify every fresh task testing that evidence unit. HFW word
  identity is the construct, while the administered context/stimulus identifies
  the exposure family.

For an exploratory pilot, currently public/practised items can be used with
`exposureStatus: known/unknown` and an explicit familiarity limitation. An
operational independent progress instrument needs its own reserved originals in
the same authoring pipeline, hidden from practice/modeling routes. Merely hiding
old public content now does not make it historically unexposed. Retake exclusions
and stock must be measured before choosing cadence.

## 8. Data model and integration work

### Proposed immutable attempt shape

Use the existing assessment history/archive infrastructure after explicit schema
support. The following is a proposed contract, not accepted current runtime data:

```js
{
  attemptId, studentId, classId, teacherId,
  assessmentType: "adaptive_progress_test",
  assessmentVersion, contentVersion, policyVersion, evidenceSchemaVersion,
  startedAt, completedAt: null,
  administrationStatus: "in_progress", // later completed/partial/discontinued/not_scorable
  status: "in_progress", passed: false,
  metadata: {
    instrumentId: "literacypath_progress",
    planKind: "broad_profile", blueprintVersion,
    difficultyVersion, calibrationVersion: null,
    administrationMode, intendedWindow, accommodations,
    bankSnapshot, blueprintSnapshot, policySnapshot,
    startingPoints, seed, exposureSnapshot,
    routingState, routeDecisions, stopReasons,
    completion: { planComplete: false, evidenceComplete: false },
    result: { reportingMode: "descriptive", strands: [] }
  },
  questionRecords: [
    {
      responseId, questionId, stimulusFamilyId,
      itemSnapshot, contentVersion, skillId, constructClaim,
      routingTrackId, modality, difficultyTier,
      itemParameterVersion: null, calibrationVersion: null,
      presentedAt, responseStatus, selected, isCorrect,
      firstResponse, supportEvents, audioDelivery, mediaDelivery,
      foregroundResponseTimeMs, timingBoundary, exposureStatus,
      routeBefore, routeAfter, routeReason, routeDeviation
    }
  ],
  // Existing raw-evidence archive freezes this exact attempt on terminal save.
}
```

Preserve administered prompt, text, option order, targets, key, exact media
identities and content hash in `itemSnapshot`. Protect keys and teacher notes
through existing roles; a child assignment receives only needed public stimulus
and response controls. A browser client cannot guarantee high-stakes item secrecy;
do not describe this formative instrument as secure against a determined client.

On resume after a break, append any newly known exposure/support exclusions from
learning between sections. Keep the content/policy snapshot frozen, but remove
newly rehearsed equivalent stimuli from the remaining candidate set; never invent
an earlier exposure event. If the changed exclusions exhaust the pool, end with
the recorded availability limit rather than add new deployment content mid-run.

Save every committed response with idempotent event/attempt identity. Preserve
the pending uncommitted item, exclusions and next-item selection across reload.
Separate an acknowledged cloud save, a pending local save and a terminal result.
Failure retries the same frozen attempt. A new administration gets a new attempt
ID within the server's current length limit; terminal records are append-only.
Historical replay reads the archived result, not current bank or routing policy.

### Concrete integration points and traps

| Source / surface | Required implementation |
| --- | --- |
| `src/data/assessmentCatalog.js` and teacher Checks funnel | New starter/assignment kind, plan choice and honest scope/start guidance; do not overload `skillCheck`. |
| `src/data/loadAssessmentSkillBank.js`, `src/data/v3/v3Registry.js`, `tools/assessmentRebuild/authoring/` | Reuse current normalization/publication rules; admit only explicit progress eligibility and purpose reserves. |
| `AssessmentShell`, `QuestionRenderer`, `ChoiceGrid`, `AssessmentAudioButton` | Reuse response mechanics/media with explicit instrument mode; lock/neutral receipt, skip, replay and pause behavior need their own tests. |
| New pure `progressTestPolicy` and `progressTestRouter` modules | One owner for blueprint, routing, eligibility, quotas, stopping and result derivation. UI/controller uses events; no duplicate reducer in SQL or exports. |
| `assessmentRoundController.js` / `assessmentSitting.js` | Keep Skills fixed phases intact. Create a separate adapter/controller for adaptive runs rather than making fixed phase completion depend on an evolving length. |
| `assessmentHistoryStore.js` / `assessmentEvidenceReplay.js` | Explicit instrument normalization, frozen route/result, null score semantics and terminal immutability; preserve custom snapshots through storage round trips. |
| `skillStatusPolicy.js` / item-mastery adapters / report aggregators | Positive instrument allowlists. Progress-test attempts must not affect Skills phase passes, retention, item-mastery or legacy stored `mastered` summaries. |
| `reportingEvidenceModel.js` and teacher/student exports | Separate source cohort and descriptive evidence kind by default. Do not assign generic formal strength or Secure via adaptive raw accuracy. |
| Student focus sessions, save RPCs, RLS and migrations | Add the new target deliberately; bind exact learner, assignment, instrument/content versions and attempt. Validate server-side outcomes against authoritative items/route; test cross-student isolation and idempotency. |

Two current traps require explicit fixes **before** accepting progress attempts:
`normalizeAssessmentAttempt` can infer `passed`, `mastered` or `needs_retry` for
unfamiliar instruments; `assessmentAttemptsToSkillLedger` does not begin with a
progress-instrument exclusion. A new type label alone is insufficient isolation.
Default `skillLevel`/`skillPhase` values must not turn an adaptive item into a phase.
Keep progress result payloads separate from Skills mastery fields, and prove this
through archived, hydrated, teacher-side and student-token save paths.

## 9. Reports and teaching actions

### Teacher diagnostic view

Show plan/date/version, completed versus incomplete evidence, sampled/unsampled
constructs and independent count. Each strand expands to tracks, actual tier
counts, formats/modalities, recorded answers, source-family exposure, support,
skips, unavailable media and route reasons. Sparse rows remain neutral. A
disagreement with an EL/Skills result appears as mixed source evidence; do not
average it away or automatically change placement.

End with at most two evidence-linked actions, for example:

- “Check printed CVC word reading next: four recognition items were sampled;
  oral decoding was not observed.”
- “Practise listening to word endings, then use a fresh focused check: two
  final-sound comparisons were missed; rhyme performance was stronger.”

Actions are suggestions. Proposed teaching groups require sufficient comparable
evidence under the governing report policy, and teacher confirmation remains
explicit. Completion and effort are separate from achievement.

### Other audiences and exports

Family output uses no more than these six strands, plain language, strengths
first, two practical actions, evidence limits and no scaled/grade labels. An
uncalibrated survey can say which tasks were observed, not assign a reading level.
Child output remains effort and goal-relative participation only.

Leader aggregates show coverage, administration conditions and comparable
cohorts. No named ranking, mixed-route raw percentage headline or false no-use
denominator. Exports follow the Reporting Bible's cover/summary/teach-next/data/
provenance contract and include instrument, modality, policy versions, response
state and denominator. Suppressed conclusions stay suppressed in Excel too.

## 10. Implementation stages and definition of readiness

| Stage | Deliverable | Exit evidence |
| --- | --- | --- |
| A — Resolve contract | Versioned scoped feedback policy, six-strand/track blueprint, source mapping, supported/unscored rules and instrument isolation design | Every existing placement/status rule identified and unchanged; implementation owners agree precise semantics. This document alone is not approval of a runtime policy change. |
| B — Bank and deterministic engine | Authored/reserved item metadata, branch-readiness checker, pure router, ledger/replay/schema adapters | All declared branch/cap/replacement paths feasible; existing v3 gates pass; no generated-bank hand edits; serialization and status-isolation tests pass. |
| C — Usable adaptive profile | Teacher assignment, child warm-ups/runner, pause/reload, neutral receipts, descriptive reports and exports | Intended classroom child flow exercised; automated/browser/device/observational evidence recorded separately; authenticated ownership/save path verified where authorized. No calibrated-score claims. |
| D — Calibration study | Predeclared representative sampling, fixed/linked pilot forms, item fit, modality/format effects, fairness, alternate-form and test-retest analyses | Independent validation supports the intended interpretation. Author-created tier labels are not accepted as estimated parameters. |
| E — Comparable progress | Versioned validated parameter release, precision-aware score/stop model, linked results with uncertainty | Own-scale comparability and change interpretation established; sparse subscores suppressed; no unsupported external-scale or growth-norm claims. |

Fixed/linked pilot forms and planned anchors are necessary to estimate difficulty
without interpreting the adaptively selected exposure cohort as a random sample.
If subconstructs fail a common-scale assumption, retain separate tracks. If some
items do not fit or show unfairness, quarantine/replace them and rerun evidence;
do not waive the failed criterion to obtain a growth chart.

The user asked for a design, so the deliverable of this task is this proposal.
A later request for a working adaptive progress instrument requires Stages A–C
in full; a request for MAP-like comparable growth measurement also requires D–E.
Calibration cost, recruitment, licensed instruments and external validity cannot
be replaced with a token-scaled score and a disclaimer.

### Success measures

- Zero double-scored or overwritten first responses in automated and persistence
  tests; zero Skills/EL placement changes from any progress-test path.
- All simulated published routes obey hard eligibility, content and media rules.
  Infeasible plans are stopped or rejected before misleading completion.
- All missing/support states remain disjoint through child flow, teacher report,
  archive and export; no unknown value becomes zero or a failure band.
- Pilot leading measures: completion/partial rate, presentation/replacement rate,
  foreground duration, access/support use, coverage and floor/ceiling frequency,
  each with its eligible denominator. Set comfort/completion targets after the
  pilot baseline, not from an invented industry benchmark.
- Lagging measurement evidence: stable difficulty order, item/track model fit,
  fairness, linked-form agreement and precision adequate for the proposed use.
  Feature adoption does not establish measurement validity or learning gains.

## 11. Acceptance tests for implementation

| Test | Required result |
| --- | --- |
| Correct → harder / incorrect → easier | At an interior tier, the next visit to that track requests exactly one tier up/down; another strand's state is unchanged. |
| First error then recovery | The first wrong response remains wrong while later fresh correct responses can raise difficulty again; no permanent ability ceiling. |
| All correct / all incorrect | Ceiling/floor stays bounded, uses fresh probes and reports an open boundary. No extrapolated score or EL/Skills promotion/demotion. |
| Alternating and contradictory pattern | Route is reproducible; mixed evidence remains visible; no fabricated stable boundary at the cap. |
| Content quotas | Strong performance in one strand cannot eliminate another required strand. A branch that would make quotas infeasible is not selected. |
| Familiar/near-duplicate/enemy item | A renamed, shuffled or rehearsed stimulus family does not count as fresh independent evidence; exposure status survives replay. |
| Double tap, key repeat, delayed callback | Exactly one deliberate first response, one route update and one saved event; all late input references the owned item/run. |
| Help or adult explanation | Supported evidence is saved, does not route or score, and cannot be converted to independent through refresh. |
| Skip / no response / end early | Separate unscored states; difficulty holds, presentation caps apply, evidence is partial without a failure label. |
| Image 404 / wrong required source | Failed item and all shared-source candidates excluded; no score/progress increase; same-track/tier replacement or availability stop. |
| Audio delivery and leakage | Required stimulus not completed yields unscored access evidence; printed-word options are not pronounced; listening stimuli remain unprinted where required. |
| Pause/hide/reload | Restore pending item or committed receipt and seeded route; foreground time freezes; no duplicate response or renewed answer opportunity. |
| Save failure and retry | Identical attempt/first responses retained until positive acknowledgment; pending/acknowledged status visible; server rejects cross-owner/conflicting terminal writes. |
| Current bank/policy changes | Old result and route replay identically from snapshots; a new administration uses new versions. |
| Instrument isolation | Broad, focused, partial, all-correct, supported, legacy-hydrated and token-saved progress attempts change no phase/status/mastery/placement field. |
| Sparse report / changing item difficulty | Under-ten-item rows have no proficiency label; ten items alone do not enable raw-accuracy mastery; unequal paths have no gain/trend or pooled class score. |
| Touch/keyboard/screen-reader flow | Child-size targets, readable evidence, logical focus and replay work on the actual route; no inaccessible evidence is scored as a literacy error. |
| Calibrated future engine | Simulations cover ability range, extreme patterns, exposure, content, precision and caps; held-out data validates parameters/intervals and comparison behavior. |

Use the current [task verification profiles](../verification/TASK_GATES.md):
`question-contracts`, `image-integrity`, `audio-integrity`, `mobile-layout`,
`supabase-local` and `regression` as their changed surfaces require. Add focused
adaptive and isolation tests rather than weakening existing gates. Automated
simulation is not physical-iPad, child observation, pronunciation approval or
psychometric evidence. Hosted mutations/deployment require the authorized target
and separate live verification. Clean task-created disposable data/artifacts,
while retaining required secret-free measurement and regression evidence.

## 12. Decisions to resolve before runtime work

| Owner | Decision | Recommended default / consequence |
| --- | --- | --- |
| Product + instructional owner | Teacher-assigned only, or voluntary self-check too? | Teacher-assigned operational test; keep voluntary Skills trail as practice. Decide before entry/assignment implementation. |
| Product + instructional owner | Neutral progress-test receipts | Adopt the scoped Bible exception; otherwise the design must account for feedback teaching later items, not claim independent CAT evidence. |
| Content + measurement | Initial routing tracks and defensible difficulty tiers | Freeze representative tracks per six-strand plan; disclose incomplete oral-awareness coverage; author missing content rather than infer it. |
| Product + teachers | Broad/focused budgets, break schedule and repeat cadence | Pilot the proposed 24–36 / 10–16 counts. Cadence depends on fresh stock and classroom comfort, not a daily retest incentive. |
| Measurement + product | End goal: adaptive profile or comparable scaled growth? | Ship an explicitly descriptive adaptive profile first; comparable growth needs funded calibration and an independent validation design. No chosen sample size or model is claimed here. |
| Engineering + reporting | Instrument exclusion/normalization and authorized student save contract | Hard prerequisite: positive type allowlists, no inferred mastery flags, explicit data/role tests and preserved archived route. |

These are unresolved future implementation decisions, not blockers to delivering
the requested design. This proposal grants no hosted-data or release permission.

## 13. Primary external references and their limits

- [NWEA family explanation of MAP Growth](https://www.nwea.org/the-map-suite/common-questions-families/):
  describes response-based harder/easier questions and why children encounter
  both success and error. This inspires the proposed reassurance copy; it does
  not validate LiteracyPath's item order or scores.
- [NWEA MAP Growth Technical Report 2024–2025](https://www.nwea.org/uploads/MAP-Growth-Technical-Report-2025.pdf),
  Chapters 6–8: item selection balances statistical and content requirements,
  tests require pool-breadth/depth simulations, score precision matters, and a
  scaled interpretation needs a measurement model. Its current detailed content
  reward functions are proprietary. This proposal uses these public principles,
  not an asserted reproduction of NWEA's engine, numerical stopping values or scale.
- [NWEA early learner administration guidance](https://cms-admin.mapnwea.org/assist/help_map/Content/Testing/EarlyLearning.htm):
  separates growth, screening and specific Skills Checklist purposes and provides
  practice orientation. That distinction supports preserving LiteracyPath's
  existing practice, Skills and EL lanes.
- [AERA/APA/NCME testing standards, 2014 open-access edition](https://www.testingstandards.net/uploads/7/6/6/4/76643089/standards_2014edition.pdf): validity,
  reliability/precision and fairness frame any later score-use claim; the current
  Question Design and Reporting Bibles remain LiteracyPath's operative policies.

External sources accessed 2 October 2026. Numerical routing budgets and heuristics
in this document are original **product proposals** for piloting, not published
MAP parameters or research-validated thresholds.
