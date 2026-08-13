# Foundation Maths rebuild specification

Status: implementation authority for the Foundation number-sense release

Release boundary: eight Foundation number-sense goals. Foundation to Year 2 expansion remains a separately gated roadmap.

## Product intent

Maths is a calm, story-rich learning place inside LiteracyPath. It is not a worksheet website, a score dashboard, or a collection of multiple-choice quizzes. Children make, move, compare, split and explain quantities. Teachers see the representation and response that produced the evidence.

Every released activity follows six principles:

1. Concrete, pictorial, abstract: learners can act on a model before choosing a numeral.
2. The mathematical decision is the interaction: moving, matching, building or partitioning is the play mechanic.
3. Errors are informative: evidence records the response, representation, action count and item version without claiming a diagnosis.
4. Variation is deliberate: object identity, layout and language change while the mathematical structure stays stable.
5. Time is never the construct: no timer, streak or speed score changes a mathematical judgement.
6. Privacy is visible: no child voice, camera, image upload, public profile or behavioural advertising.

## Foundation learning map

| Goal | Child-facing promise | Required representations | Observable decision |
| --- | --- | --- | --- |
| Sequence to 20 | Put numbers in order and find what comes next | path, numeral cards, number line | choose or move the missing numeral |
| Count to 10 | Count each object once and say how many altogether | loose collection, row, five/ten frame | touch-count then choose the cardinal total |
| Count to 20 | Count larger collections without losing track | two rows, double ten frame, grouped collection | organise or count then choose the total |
| See to 5 | Recognise small quantities without counting every object | dice pattern, five frame, irregular dots | identify a briefly shown quantity |
| Match numeral and quantity | Make a quantity that matches a numeral | numeral card, tray, frame | add or remove objects until the model matches |
| Compare quantities | Decide which group has more, fewer or the same | matched rows, frames, loose groups | align or inspect groups then choose the relationship |
| Parts make 5 | Split 5 and find a hidden part | two-colour frame, part-part-whole | build the missing part |
| Parts make 10 | Split 10 and find a hidden part | ten frame, two hands, part-part-whole | build the missing part |

## Student information architecture

The Maths landing page has one recommended next action and four clearly secondary destinations.

- Today: the next incomplete teacher assignment, or the recommended lesson when none is assigned.
- Learn: one seven-stage guided lesson built around a manipulable model.
- Check: a six-decision formative check with no correctness teaching during the round.
- Number Stories: illustrated stories in which the quantity changes for a reason.
- Arcade: four full-screen practice worlds with actual movement and construction mechanics.

The shared student shell keeps the existing LiteracyPath student header, name, avatar and subject switch. Maths content uses the same spacing, type scale, controls and safe-area behaviour as Literacy. Arcade is the only immersive visual exception.

## Screen contracts

### Maths home

- Fits between the shared header and the bottom safe area at 1440 x 900 and 1024 x 768 without document-level horizontal overflow.
- The recommended action is visually dominant and states the goal, activity and natural stopping point.
- Assignment failure never blocks independent learning.
- Completed assignments move to a compact "Finished today" state rather than disappearing without explanation.
- The subject switch reads "Back to Literacy" and is always reachable.

### Guided lesson

- One stage at a time.
- On desktop and tablet, instruction and manipulative share a two-column workbench.
- On small screens they stack, with the next action after the manipulative.
- Stage progress is compact and exposes all seven named stages on request.
- A stage cannot advance until its meaningful interaction is complete.
- Refresh restores the exact stage and model state.
- Completion stores practice evidence only and cannot create a formal mastery judgement.

### Skills check

- A calm start screen names the goal, number of decisions and available access support.
- Six decisions use at least two representation families.
- Correctness is not shown between items. The interface acknowledges that the response was saved and advances.
- Answer positions rotate deterministically.
- Constructed-response tasks require construction, not a disguised answer button.
- A count or comparison model never exposes the answer in visible or accessible labels before response.
- Completion explains that the teacher sees evidence, not a percentage score.

### Number Stories

- The shelf shows a clear cover, mathematical promise and estimated shared-reading time.
- The reader fits one illustrated scene, one short text block, one model and navigation per view.
- Page text is meaningful narrative, not a word problem pasted onto unrelated art.
- The mathematical state changes causally from page to page.
- Text reading ability is never scored as mathematics.
- Family prompts use household objects and work without a family account.

### Arcade

- The game world occupies the available stage after a compact mission header.
- A round contains eight mathematical decisions and a natural stopping point.
- No countdown, lives, public leaderboard, streak pressure or paid currency.
- Touch, pointer and keyboard controls are equivalent.
- Reduced-motion mode removes camera and celebratory motion but preserves state changes.
- Leaving mid-round stores no false completion evidence.

## Arcade game designs

### Number Trail 3D

Goal: sequence numbers and locate a missing value.

World: a low-poly meadow path made from numbered stepping stones. The camera looks down the next short section, not an endless runner track.

Core action: the learner moves the explorer to one of three stones. Landing on a stone is the answer. A correct choice completes the broken section; an incorrect choice gently returns the explorer and leaves the sequence visible.

Controls: left/right plus go, direct stone tap, and arrow keys plus Enter. No dexterity penalty.

### Frame Foundry 2D

Goal: make a target quantity or missing part.

World: a tactile workshop with a ten-frame workbench and counter conveyor.

Core action: drag or tap counters into frame spaces. Submit checks the constructed model. For part-whole rounds, two counter colours remain visually distinct.

Controls: drag and drop, tap source then frame, arrow-key frame editing, plus/minus alternative controls.

### Count and Carry 2D

Goal: count a collection with one-to-one correspondence.

World: a meadow delivery yard. Objects sit in countable positions and an empty cart waits nearby.

Core action: move each object into the cart. Each object can move once. The learner then selects the delivery label that matches the cardinal total.

Controls: drag, tap-to-move, keyboard item traversal. Object movement is not timed.

### Bridge Builder 2D

Goal: compare quantities.

World: two banks of a stream hold two groups. The learner lays one-to-one bridge planks between matched objects.

Core action: pair objects across the stream, then choose left has more, same amount, or right has more. Unmatched objects remain visible as mathematical evidence.

Controls: automatic next-pair button, direct object pairing, or keyboard pairing. Relationship labels include text and position, never colour alone.

## Assessment content standard

Every item is an authored record, not a runtime arithmetic formula. An authored record includes:

- stable item ID and content version;
- exact child-facing prompt;
- exact expected response;
- blueprint and construct;
- values and maximum;
- representation family and arrangement;
- object family chosen for countability and cultural neutrality;
- two plausible distractors when selection is appropriate;
- interaction type and accessible equivalent;
- teacher-facing evidence note;
- limited observable-signal rules, never an automatic misconception diagnosis.

An assessment round must pass these checks:

- no duplicated mathematical model in the same round;
- no visible, alt-text or audio answer leak;
- at least two representations;
- at least one constructed response when the goal can validly support it;
- no accidental dependence on colour, reading fluency, motor speed or object size;
- deterministic reconstruction from item key and content version;
- server acceptance only when item ID, version, response and expected value match the released manifest.

## Number Story standard

Each released story has 8 pages and contains:

1. a concrete character goal;
2. an initial quantity that can be modelled;
3. a causal change;
4. an attempted solution;
5. a second change or check;
6. a representation switch;
7. a resolved mathematical decision;
8. an earned ending and family invitation.

Each page record includes exact text, page art, model, mathematical focus, LEDA narration request, and talk prompt. Stories are released only when the page art and model show the same count as the text.

## Audio standard

- Production voice: `en-US-Chirp3-HD-Leda`.
- Exact instruction, assessment prompt, story page and song-vocal scripts have stable request IDs.
- Runtime never uses browser speech as a substitute for a missing production clip.
- A missing or teacher-flagged clip leaves readable text and a clear unavailable state.
- Existing accepted clips remain usable until flagged, per the project release decision.

## Teacher information architecture

The teacher Maths workspace uses a stable local tool rail:

- Overview: class snapshot, assignments needing attention and recommended next teaching actions.
- Present: full-screen manipulatives, prompts and reveal controls for whole-class teaching.
- Plan groups: evidence-informed suggestions, editable membership and an explicit teach/model/practise/check sequence.
- Assign: goal, activity, learners, deadline and a plain-language preview of what children will do.
- Assess: launch a check, record an observation or inspect incomplete evidence.
- Reports: goal-by-learner evidence with source, representation, recency and next teaching step.
- Print: worksheet generator with support/core/extend variants and answer notes.
- Family: printable no-account activity and exact resource access path.
- Audio review: flagged-clip queue with text and context, no child recording.

No report uses a red state for "Not checked". Practice can show participation and observed strategy, but cannot independently produce a formal `Secure` judgement.

## Responsive and accessibility acceptance

| Viewport | Required behaviour |
| --- | --- |
| 1440 x 900 | Shared shell and primary task fit; no clipped bottom actions |
| 1024 x 768 | Tablet landscape fit; teacher tool rail may become a compact tab row |
| 768 x 1024 | Single-column student workbench; no sideways page scroll |
| 390 x 844 | 44 px minimum controls, safe-area padding, readable 16 px body text, no fixed element covering an action |

All surfaces require keyboard traversal, visible focus, semantic headings, readable live regions, text alternatives that do not disclose answers, reduced-motion support, colour contrast at WCAG AA, and controls that do not rely on hover.

## Evidence and reporting contract

Stored evidence contains learner, class, activity, skill, item or round ID, content version, representation, response, source, accessibility mode, client session ID and timestamps. Server functions derive correctness from the released content manifest. The browser may display feedback but cannot authoritatively declare correctness in stored rows.

Formal status language is limited to:

- Not checked
- Practice observed
- Needs follow-up
- Mixed evidence
- Demonstrated

The evidence drawer must let a teacher answer: what was asked, what model was shown, what the learner did, when it happened, whether support changed the representation, and what to teach next.

## Release gates

Foundation Maths is releasable only when all of the following are evidenced:

1. Authored content: every assessment item, lesson stage, story page and game round has a stable reviewed manifest.
2. Mathematical validity: automated count/model checks and manual sample review agree.
3. Interaction validity: the mathematical decision is completed in the interaction, not guessed from a generic answer card.
4. Student UX: home, lesson, check, story and all games pass desktop, tablet and small-screen playtests.
5. Teacher UX: all nine tools work with empty, loading, error, partial and populated states.
6. Accessibility: keyboard, touch, screen-reader naming, reduced motion and non-colour cues pass.
7. Evidence integrity: offline queue, retry, idempotency, assignment completion and versioned validation pass.
8. Database safety: migrations apply in order, RPCs are narrow, grants are verified and live schema probes pass.
9. Media: exact-text manifests resolve, files decode and flagged audio fails safely.
10. Build and regression: lint, unit, content, release, production build and direct browser smoke checks pass.

Passing code checks alone is not permission to call the release complete. The final release record names the viewports and interactions directly exercised, the migrations applied, the remote commit, and any remaining unverified hosted condition.
