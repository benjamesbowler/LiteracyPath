# Maths implementation backlog and release plan

## 1. Delivery rule

Implement in vertical slices. A slice is not complete when components exist; it is
complete when teacher setup, child experience, evidence saving, reporting, media,
accessibility and browser verification all work together.

Preserve all existing Literacy routes and evidence semantics. Stage and commit only
Maths-scoped files plus deliberate shared-platform changes.

## 2. Success measures

Targets are launch hypotheses and must be reviewed after pilot data exists.

### Reliability

- 99.5% of started activities reach a valid completion or explicit resume state.
- 0 lost or duplicated evidence events in offline/retry tests.
- 0 count mismatches between visual model and authored quantity.
- 0 child-media collection paths.

### Usability

- 90% of pilot teachers can assign a Maths activity without support.
- 85% of Foundation pilot learners can begin the first recommended activity after
  picture-code sign-in without adult navigation help.
- 95% of teacher-started assessment items render valid media and interaction.

### Instructional usefulness

- Teachers can name a next instructional action from every non-neutral report state.
- Every reported misconception links to observable evidence and a check activity.
- Every launch skill includes concrete, pictorial and transfer teaching material.

Do not set a mastery-accuracy threshold from these product metrics. Mastery policy
requires separate pilot calibration.

## 3. Explicit non-goals for v1

- Year 3–6 curriculum coverage.
- Open-ended handwriting recognition.
- Child voice explanations or automatic speech scoring.
- Camera-based counting of physical objects.
- AI-generated live assessment questions.
- Overall maths age, IQ-like score or norm-referenced percentile.
- Public competitions, global leaderboards or timed high-stakes facts tests.
- Computer algebra, symbolic equation parsing or geometry proof.

## 4. Phase 0 — shared subject foundation

### MATH-001 Subject registry and routes

Files:

- add `src/subjects/subjectRegistry.js`;
- update `src/appState/appViews.js`;
- update `src/components/AppSurface.jsx` route rendering;
- update the teacher and child navigation components;
- add `src/maths/teacher/MathsTeacherDashboard.jsx` and
  `src/maths/learn/MathsHome.jsx` empty-state shells.

Acceptance:

- `Literacy | Maths` switch is visible to authenticated teachers;
- child opens the subject assigned/recommended, with an accessible switch back;
- direct hashes survive reload and back/forward;
- existing Literacy deep links remain unchanged;
- subject preference never bypasses authentication or class ownership.

Tests:

- `tests/unit/subjectRegistry.test.js`;
- `tests/unit/appViewHelpers.test.js` updates;
- `tests/release/maths-subject-navigation.spec.js` desktop/mobile.

### MATH-002 Database evidence boundary

Files:

- add timestamped migration for `maths_evidence_events` and RPCs;
- update `tools/verifyLiveDatabaseFunctions.mjs`;
- add `src/maths/data/mathsEvidenceStore.js`;
- add offline retry integration.

Acceptance:

- only class owner reads teacher-side evidence;
- valid child token writes only for its own learner/class;
- archived learner, stale token and cross-class IDs fail closed;
- duplicate client event is idempotent;
- deletion/export paths include Maths evidence.

Tests:

- database policy contract;
- live PostgREST visibility probe;
- cross-tenant negative tests;
- retry and duplicate-event unit tests.

## 5. Phase 1 — Foundation number-sense vertical slice

### MATH-101 Curriculum registry

Implement Foundation skills F-N-SEQ-20 through F-N-PART-10 first. Create the full
F–2 registry now, but expose only approved slices using `releaseStatus`.

Files:

- `src/maths/curriculum/mathsSkillTree.js`;
- `src/maths/curriculum/mathsCycles.js`;
- `src/maths/curriculum/mathsPrerequisites.js`;
- `src/maths/curriculum/standardsCrosswalk.js`;
- `tools/checkMathsCurriculum.mjs`.

Gate: unique IDs, known standards, acyclic prerequisites, representations and next
actions for every released skill.

### MATH-102 Core manipulatives

Implement Counter Tray, Five Frame, Ten Frame, Number Line and Part–Whole Model.

Shared utilities:

- `src/maths/manipulatives/manipulativeState.js`;
- `src/maths/manipulatives/MathsManipulativeFrame.jsx`;
- `src/maths/manipulatives/mathsManipulative.css`.

Tests include state reducer, keyboard actions, tap alternative, reset, reduced
motion and visual snapshots at 390×844, 768×1024 and 1366×768.

### MATH-103 Lesson player

Implement `Retrieve → Notice → Model → Make → Explain → Apply → Check` with
resumable step state. Add 5 recipes for each released Foundation number skill.

The Check step does not save formal assessment evidence. Teacher can explicitly
record an exit observation from the teaching surface.

### MATH-104 Foundation skills check

Implement blueprints: `count_collection`, `quick_quantity`, `make_quantity`,
`compare_quantities`, `part_whole`.

Create at least:

- 20 authored item models per released skill;
- 4 surface variants per mathematical model;
- 2 representation families per skill;
- named distractor/misconception rules;
- exact prompt audio requests.

Gate simulations must prove no item repeats within a round, all visual counts match
models, all possible responses are classified and no one answer slot is favoured.

### MATH-105 Teacher report slice

Ship learner and class reports for the released Foundation number skills, including
evidence count, source, representations, freshness, possible patterns and next
action. Disable `Secure` until calibration is explicitly enabled.

### MATH-106 First content release

Ship Stories 1–4 and Songs 1–3 from the launch pack. Generate exact LEDA audio,
story images, captions and listening/visual review sheets. Ship Number Trail and
Frame Foundry with Foundation content.

**Phase 1 exit:** a teacher can select a class, teach a number lesson, present it,
assign practice, administer a valid skills check, see evidence, open a Number Story
and send a no-account Family Bridge activity.

## 6. Phase 2 — Year 1 number and resources

### MATH-201 Place value and calculation

Release Year 1 number skills with Base-Ten Blocks, Rekenrek and Bar Model. Add
`number_line_move` and `representation_match` assessment blueprints.

### MATH-202 Teacher tools

Implement Maths Presentation, Small-group Composer and Worksheet Generator.
Recipes are curriculum-linked and versioned. Add print/browser tests and PDF
semantic checks.

### MATH-203 Content

Ship Stories 5–8, Songs 4–7, Parcel Sorter and Bridge Builder. Produce all approved
media and audio.

### MATH-204 Reporting and recommendations

Add deterministic instructional grouping and representation-gap recommendations.
Teacher must be able to view the exact evidence underlying each recommendation.

## 7. Phase 3 — Year 2 and remaining strands

### MATH-301 Year 2 number

Release place value to 1,000, facts, early multiplication/division, fractions and
money. Add Coin Tray, grouped arrays and fraction strips.

### MATH-302 Measurement, space, statistics and probability

Release Balance Scale, Clock Face and Shape Builder. Implement `measure_compare`
and `shape_attribute` assessment blueprints, plus graph/data model checks.

### MATH-303 Content

Ship Stories 9–12, Songs 8–10 and the final four arcade games: Equal Picnic, Shape
Shipyard, Clockwork Station and Data Detective.

### MATH-304 Full reports

Complete strand aggregation, curriculum coverage, family narrative, retention
history and export. Avoid one overall score.

## 8. Phase 4 — calibration and production release

### MATH-401 Pilot instrumentation

Collect only necessary de-identified/teacher-owned learning events. Monitor item
completion, response distribution, accessibility use, media errors, sync health and
teacher override—not child recordings.

### MATH-402 Content validity review

For every assessment blueprint:

- mathematics specialist review;
- early-years teacher review;
- accessibility review;
- cultural/locale review;
- distractor and ambiguity audit;
- device playtest with adult simulation, then supervised child usability testing
  conducted by the school under its own consent process without recordings in the
  app.

### MATH-403 Mastery calibration

Use pilot evidence to define construct-specific thresholds, minimum evidence,
cross-representation requirements and retention intervals. Record one policy in
`src/maths/policy/mathsStatusPolicy.js`; do not reuse literacy’s phase rule or add
parallel thresholds.

### MATH-404 Release

- all migrations applied and probed live;
- full unit, lint and build green;
- Maths route browser matrix green;
- all media technical checks green;
- human visual and listening review complete;
- teacher workflows exercised against production Supabase;
- rollback plan tested;
- support and privacy documentation updated.

## 9. File-by-file implementation order

```text
1  src/subjects/subjectRegistry.js
2  src/appState/appViews.js
3  src/maths/curriculum/*
4  src/maths/policy/*
5  Supabase migration + live verifier
6  src/maths/data/mathsEvidenceStore.js
7  shared subject navigation
8  Maths teacher/student shells
9  manipulative state reducers
10 manipulative components
11 lesson recipe manifests and player
12 assessment blueprints and authored bank
13 assessment controller/session storage
14 misconception engine
15 reports and recommendation engine
16 Presentation / Small Groups / Worksheets / Family Bridge
17 story catalog and reader
18 audio source manifest and LEDA pipeline
19 story art and QA manifests
20 arcade games and media
21 release simulations and browser matrix
22 production database/deployment verification
```

## 10. Required automated checks

Add these scripts:

```json
{
  "check:maths-curriculum": "node tools/checkMathsCurriculum.mjs",
  "check:maths-assessment": "node tools/checkMathsAssessment.mjs",
  "check:maths-visual-quantities": "node tools/checkMathsVisualQuantities.mjs",
  "check:maths-stories": "node tools/checkMathsStories.mjs",
  "check:maths-audio": "node tools/checkMathsAudio.mjs",
  "check:maths-games": "node tools/checkMathsGames.mjs",
  "check:maths-reporting": "node --test tests/unit/mathsReporting*.test.js",
  "check:maths-release": "npm run check:maths-curriculum && npm run check:maths-assessment && npm run check:maths-visual-quantities && npm run check:maths-stories && npm run check:maths-audio && npm run check:maths-games && playwright test tests/release/maths-*.spec.js"
}
```

## 11. Browser/device matrix

Required:

- Chrome desktop teacher, 1366×768 and 1920×1080;
- Safari/iPad portrait and landscape;
- 390×844 child portrait;
- 844×390 short landscape;
- keyboard-only desktop;
- reduced motion;
- 200% zoom teacher reports;
- offline start/resume and delayed evidence sync;
- projector presentation at 16:9;
- audio muted, audio unavailable and replay paths.

## 12. Implementation estimates

These are planning ranges, not promises:

| Phase | Focused effort |
|---|---:|
| Phase 0 | 1–2 weeks |
| Phase 1 | 5–8 weeks |
| Phase 2 | 5–8 weeks |
| Phase 3 | 7–11 weeks |
| Phase 4 | 4–8 weeks plus pilot calendar time |

Parallel media/content production can shorten elapsed time, but release may not skip
human visual/listening review or pilot calibration.

## 13. Definition of done for every ticket

- current source and owner are clear;
- code and content use stable versioned IDs;
- happy, empty, loading, error, retry and offline states exist;
- no cross-subject data leakage;
- no child media collection;
- unit and behavioural tests pass;
- real browser path is exercised;
- visual state is inspected at required breakpoints;
- audio text matches authored text and has been listened to when released;
- report claim matches stored evidence;
- documentation and live database verifier are updated when contracts change;
- only scoped files are staged and pushed after verification.

## 14. First implementation command brief

The next implementation task can use this exact scope:

```text
Implement Maths Phase 0 and MATH-101 from docs/maths. Preserve all current
Literacy behaviour and unrelated worktree changes. Add the subject registry,
routes, teacher/student Maths shells, complete F–2 skill registry, standards
crosswalk, acyclic prerequisite checks, and browser coverage. Do not create or
apply the evidence migration until the schema has been checked against the current
linked Supabase project. Verify, then push scoped changes to main.
```
