# Learning policy

**Owner:** `src/policy/learningPolicy.js`
**Permanent gate:** `npm run check:learning-policy`

LiteracyPath uses one versioned policy for learner accuracy conclusions. A
reporting or presentation layer must call the policy; it must not recreate a
numeric cutoff.

## Current contract

- **Secure:** 90–100%.
- **Developing:** 70–89%.
- **Needs support:** below 70%.
- **Not enough evidence:** the accuracy does not meet the declared conclusion
  scope, is missing or stale, or has an otherwise insufficient confidence
  basis.
- **Not checked:** no scored evidence exists.
- Accuracy conclusions use evidence from the latest 90-day window.
- Every policy call declares one of three scopes:
  - **General learner/class:** at least ten current scored responses across
    at least two distinct skills. One heavily practised skill cannot become a
    whole-learner or whole-class judgement.
  - **Named skill:** at least ten current scored responses for that named
    skill. The UI must keep the skill name attached to the conclusion.
  - **Exact item instructional progression:** at least three independent current
    attempts at that exact item. Repeated variants in one sitting count once.
    This is a practice-progression rule, not a reportable proficiency judgement.
- Stronger general confidence requires at least 20 responses across at least
  three skills; moderate general confidence requires at least two skills.
  Single-skill evidence is sufficient only for an explicitly named skill or
  exact-item conclusion.
- Progression requires a Secure exact-item conclusion and at least two correct
  responses. Practice exposure alone cannot establish progression.
- Class outliers require policy-ready learner evidence and a distance of at
  least 15 percentage points from the policy-ready class median.
- Class summaries always distinguish learner-weighted accuracy (each
  policy-ready learner counts once) from response-weighted accuracy (each
  scored response counts once), with both denominators visible.
- A single headline class average is comparable only with at least two
  policy-ready learners, at least 70% policy-ready learner coverage, and no
  more than a 4:1 response-count imbalance. When any condition fails, both
  descriptive views remain visible but the single headline is suppressed.
- **Secure** is a current acquisition judgement. A separate retained-learning
  claim additionally needs Secure evidence on at least two separate days and a
  successful re-probe 14–28 days later. Until those longitudinal observations
  are stored, the app must not claim that retention has been validated.

Every derived conclusion stores `policyVersion`. Historical assessment records
retain their recorded scoring-policy version; current report conclusions also
state the current learning-policy version so a future policy change is
auditable rather than silently rewriting history.

## Product behavior

A sparse or stale sample never creates a reteach group, outlier, mastery,
average, or challenge recommendation. A single-skill result may create a
clearly named skill conclusion, but it cannot create an overall learner band,
class average, outlier or general recommendation. The UI renders **Not enough
evidence** for the broader scope and discloses attempts, diversity, recency,
confidence, and recorded support use.

Teacher roster **Focus accuracy** and **Focus status** use the same named-skill
conclusion as Today, with evidence aligned to the displayed current focus.
**Across skills** and whole-learner report counts retain the general scope;
a ready focus result does not make that broader summary ready. Saved Skills
answers and received activity are labelled separately. Current Sound Seekers
project/campaign completion and responses are supported-practice participation,
never a Skills result or an independent mastery judgement.

## Change control

Change the policy version whenever a threshold, recency window, confidence
requirement, or progression rule changes. Update its unit boundary tests,
authenticated sparse-learner route test, reporting definitions, exports, and
this document in the same commit.

## Learning pace and result ownership

`src/utils/learningPace.js` owns initial practice tuning: a completed word stays
visible for at least 1,600 ms, a sentence for 2,400 ms, and a newly taught concept
for 2,000 ms. Feedback also waits for its actual terminal media event, then a
500 ms settle. A teaching card has a 1,200 ms reflection interval after its
recording before the next concept. These are product starting parameters, not
research-derived thresholds or proof of classroom suitability.

MAP practice is a scoped exception to timed result replacement: presentation
`literacy-explicit-submit-v2` keeps its saved correctness/explanation visible
until **Next question**. Rehearsal uses explicit **Next** submission and neutral
continuation, with explanation review after completion. Routing `strands-v3`
changes only the responding area and shares eligibility with reports; known
familiarity cannot create independent success. These product parameters are
specified in [MAP preparation](../product/MAP_PREPARATION.md).

Committing a response and replacing the displayed item are separate actions.
Sound Seekers, Adventure Map, Cycle Practice and Letters save the original response
promptly while keeping that answered object visible. Letters saves a separate
held-card cursor, so reload restores the solved card without recording another
response. Arcade construction,
recognition and adventure scenes, and timed arcade word/sentence results, use
the same ownership rule. Explicit replay replaces the current voice completion
gate, never the saved answer. Reduced motion changes animation, not cognitive
dwell. The owner freezes foreground time on pause, resumes the same result and
its interrupted voice, and cancels on leaving. `useLearningResult` adapts this
contract to React practice scenes; native game queues retain their remaining
time through `createPausableTasks`.

Native recorded cues and Howler result voices share the same replay gate.
`useRecordedPracticeCue` returns its actual terminal promise and gives it to
the owner for both manual replay and resumed automatic cues; starting a result
stops an obsolete native prompt. The phonics player retains actual end-event
ownership with a duration-aware missing-terminal watchdog (recorded duration
plus 2,000 ms, at least 5,000 ms; 30,000 ms if duration is unknown). A watchdog
reports unavailable delivery, never a successfully heard recording.

This rule does not delay an individual movement, jump, hit, rhythm note or
phoneme join within one word. Rocket Run and Sound Racer already require a
child action to change the next learning target. Story Quest paths and completed
letter tracing retain manual progression. Woodland Homecoming keeps its
existing maximum of 1,600 ms from the response and actual voice completion plus
450 ms. Skills supported practice keeps the longer of its existing
1,800/3,200 ms receipts and the word/sentence/concept floor, and freezes on
tab-hide. Its explanation is written; this effect does not start a new voice.
Formal Skills assessment keeps its 250 ms neutral receipt and Cycle checks
keep their existing 450 ms receipt. These pace changes add no corrective audio,
answer reveal or practice credit to formal checking.

Guided Reading currently resolves segmented narration for every active runtime
page: 227 books and 2,031 pages in the October 2026 review. That route retains
1,500 ms page lead-in and lead-out with narration at 0.88 rate. The continuous
legacy full-book fallback remains synchronized with its authored track; adding
arbitrary pauses to that recording would break its cue alignment. The catalogue
coverage check must remain satisfied before new books use the segmented route.

Present formation starts with a static preparation cue. A teacher chooses
**Watch the pencil** or **Write with me**. That action plays the exact Leda cue
“Get your air-writing finger ready. Point your finger.” from
`src/copy/presentLearningCopy.js` and the generated student-support manifest.
Formation waits for both a three-second preparation floor and actual recording
completion. Blank-screen and tab-hide pause the same cue and formation clock;
**Stop writing** cancels the run while preserving its ink, and **Watch again**
starts a fresh preparation/model. Failed media shows a teacher modelling cue
and retains the preparation floor without deadlocking.
Watch main strokes last 1,200–2,000 ms; write-together
strokes last 1,800–2,500 ms; small dots last 800 ms and pen lifts last 600 ms.
Strokes appear sequentially and completed ink remains until explicit replay or
slide navigation. Reduced motion keeps these same intervals with static ink
updates. Letter and Cycle tracing models retain their existing drawing input
and manual completion controls; they never require a launch countdown.

Focused regression evidence lives in `tests/unit/learningPace.test.js`,
`tests/unit/ownedGameAudio.test.js`, `tests/unit/presentReadinessAudio.test.js`,
`tests/unit/learningReplayOwnership.test.js`, `tests/unit/cvcProgressionAudio.test.js`,
`tests/release/learning-pace.spec.js`, and
the long-feedback/pause cases in the Cycle Practice and rounded route suites,
plus replay and saved-answer reload cases in the Letters and illustrated
practice suites.
Those tests establish timing and cancellation behavior under synthetic audio;
they do not establish human listening quality, physical-iPad usability or
classroom learning outcomes.

## Cycle Practice activity and check evidence

`src/policy/cyclePracticePolicy.js` owns Cycle Practice policy v2. The existing
30-minute requirement counts active participation, not a browser left open.
Active time is credited only between learner inputs in visible, unpaused
practice. Interactions more than 60 seconds apart are treated as an idle gap
and earn no time for that gap. This is an explicit conservative product rule,
not a measurement of attention. Background, pause, check and offline refresh
intervals earn no practice time. A monotonic clock separates session elapsed,
active practice and check duration; practice freezes when the check starts.
Refresh restores the same session, item, support history and frozen submission.

Checks preserve the first response. Supported and unavailable-media records are
unscored, disclosed separately, and leave independent evidence incomplete.
Accuracy uses only independently scored responses. Actual mechanic constructs
(e.g. memory retrieval or supported formation) remain distinct from decoding
and handwriting proficiency. Cycle checks never establish formal Skills/EL
placement. Failed saving retries the identical attempt and answers.

## Phonics and Word Workshop practice records

Letter and CVC activities retain immutable completion events with step delivery,
first response, attempts and assistance. Tracing a model, listening to examples,
matching printed word beginnings and modeled word building are practice; their
completion is never an independent mastery conclusion. Legacy completed values
remain activity history with unknown evidence. Save at the final learning action;
leaving a celebration or playing again cannot create or erase that completion.

Workshop curriculum sequencing uses the actual graphemes in each authored
family's targets, transformations and distractors. A completed letter activity
records prior curriculum exposure for this supported practice only. It does not
claim proficiency or satisfy the independent instructional-progression policy
above. The picker names missing letter activities; neither six arbitrary letters
nor completing the previous family supplies those prerequisites.

## Recognition and sentence game records

Sight Word Memory records spatial pair matching, Pop the Word records high
frequency word recognition practice, Word Hopscotch records sentence ordering,
and Sentence Fix-It records contextual sentence repair. These constructs remain
separate from independent decoding or formal mastery. Printed targets, modeled
ordering, first responses and assisted retries are disclosed in the result.
Recorded-cue availability is not proof that the child heard a clip.

Completed game practice is saved at the final learning action in the existing
learn-games progress record, separately from displaying or leaving its result.
Each evidence-bearing completion has an immutable session identity; replay starts
a new session. Hydration preserves whole sessions and reports same-identity
conflicts instead of merging a wrong first response into a later correct answer.
Legacy stars and play counts have unknown response evidence.

Drum Trail shows the unsegmented word and its picture on every turn. Its new
responses use picture-and-word syllable practice with presentation version 2;
word visibility and actual picture/audio delivery are frozen at the response.
Printed-word access never becomes independent oral-only evidence. Earlier
recorded responses retain their original modality. Showing syllable chunks,
mission help and retries remain supported practice; the game never establishes
formal mastery or hearing/reading proficiency.

## Self-chosen Skills practice

The child Home's **Skills trail** opens the current 30 published v3 Skills areas
for voluntary practice. The child may revisit an area or choose harder questions;
this does not alter teacher placement, checkpoints or formal assessment results.
The trail reuses the current bank and response renderer rather than creating a
second question catalogue. Instructions and replay do not block deliberate input.
Actual required-media delivery and the timing boundary remain separate evidence.

`src/utils/skillsPracticeModel.js` owns the practice plan and saved evidence.
Immutable item events live in the existing synchronized
`learn_games.games["skills-trail"].practiceRecord` envelope. The stored question,
options, first response, help, skip, unanswered/media-failure status and available
latency support teacher review. Reload cannot replace a first answer with a later
correct answer. A failed required image/audio item is unscored and replaced.
Missing timing or unfinished attempts are disclosed rather than guessed.

Teacher **Other learning** and its Data ledger show self-chosen practice separately.
Practice supplies no Arcade stars, game play count, formal pass, independent
mastery or proficiency judgement. Admin app-improvement analysis keeps its mode
and item cohorts separate, under the [usage export contract](../ops/APP_USAGE_INSIGHTS_RUNBOOK.md).


## Practice response and teaching contract

`src/policy/learningResponsePolicy.js` and `src/utils/learningResponseState.js`
own `learning-response-v1`. Skills trail, Cycle Practice and Adventure Map save
one deliberate first response before showing correctness. A mistake leads to a
worked example, an active modeled match/build action, and one genuinely fresh
eligible task. The original choices do not reopen for a second independent score.
A second transfer error finishes with supported modeled work; the next episode
begins with a visible model. Exhausted transfer content is recorded explicitly.
This does not change the formal Skills phase/mastery thresholds or the Cycle
Check's separately versioned scoring contract.

Saved states retain the exact source stimulus/options, first response, modeled
part cursor and transfer. Immediate transfer is formative learning after
teaching, excluded from independent accuracy and mastery. Instruction replay,
unfinished pair/multi-selections, drag cancellation, partial tracing and memory
exploration retain their native boundaries. Help, intentional unknown, skip,
exit and media failure remain distinguishable; an exit creates no fictional
correct response. Ignored/repeated presses do not add active practice time or
infer cheating, ability or intent. Completion and rewards remain once per
original slot, separately from independent evidence.

Worked examples replay existing authored recordings and approved exact words/
phonemes, with readable labeled models and real relevant pictures. They do not
create new explanatory speech through browser TTS. Original built correct parts
survive teaching. Unknown/old archives retain their recorded scoring semantics;
new practice and Progress Check instruments require explicit admission and cannot
fall through to formal Skills evidence.
