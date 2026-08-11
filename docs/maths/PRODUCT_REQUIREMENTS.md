# Maths product requirements and experience map

## Problem

Teachers currently need separate systems for early literacy and mathematics,
duplicating class setup, learner sign-in, assessment, planning, resources and
reporting. Learners must relearn navigation and families receive disconnected
recommendations. Maths inside LiteracyPath should reuse the trusted platform while
providing mathematics-specific pedagogy, representations and evidence.

## Goals

- One roster and sign-in grants access to both subjects without merging their
  curriculum or evidence.
- Teachers can move from a Maths observation to a concrete next teaching action in
  no more than three selections.
- Every released skill has teach, practise, assess, report and home-connection
  material.
- Learners can demonstrate the same idea in at least two representations.
- Number Stories and games deepen mathematical language and reasoning without
  creating invalid mastery evidence.

## Personas and user stories

### Classroom teacher

- As a Foundation teacher, I want to present a ten frame and move counters with my
  class so that children can see part–whole relationships.
- As a teacher, I want to run a short untimed skill check so that I can distinguish
  counting difficulty from numeral-recognition difficulty.
- As a teacher, I want suggested groups based on a specific next action so that I
  can teach rather than decode a dashboard.
- As a teacher, I want printable and digital versions of the same model so that
  classroom representations stay consistent.
- As a teacher, I want `Not checked` to stay neutral so absence is not reported as
  failure.

### Learner

- As a young learner, I want to use the same picture-code sign-in so that Maths is
  easy to find.
- As a learner, I want to move, tap and build quantities so that I can show what I
  understand without needing advanced reading.
- As a learner, I want a wrong answer to help me repair the model so that I can try
  again without losing rewards.
- As a learner who cannot drag accurately, I want tap and keyboard alternatives so
  that I can complete the same mathematical action.
- As a learner, I want stories, songs and games that use the mathematics I am
  learning so practice feels connected.

### Family member

- As a family member, I want a five-minute activity requiring no account or special
  equipment so that I can practise the current idea at home.
- As a family member, I want plain-language progress information so that I know what
  the learner can do and what to try next.
- As a family member, I do not want to upload a child’s voice or image.

### School leader

- As a school leader, I want one privacy and data-rights model across both subjects.
- As a school leader, I want coverage and evidence quality without a simplistic
  overall child ranking.
- As a school leader, I want locale and standards mappings that can be audited.

## Experience map

### Teacher

```text
Sign in
→ choose class
→ choose Maths
→ Today: current cycle, learners to check, suggested group
→ Teach / Assess / Resources / Reports
```

`Teach` opens presentation, lesson or small-group plan. `Assess` opens learner,
skill and resume state. `Resources` contains Number Stories, worksheets, songs,
manipulatives and Family Bridge. `Reports` shows evidence and next actions.

### Learner

```text
Picture-code sign-in
→ Maths Home
→ Continue lesson / Daily Maths / Number Story / Arcade / Explore tools
→ short activity
→ clear stopping point
```

The home screen shows one primary continuation, one teacher assignment and a small
choice area. It does not expose every strand at once.

## Feature requirements

### P0 — launch requirements

| Area | Requirement | Acceptance summary |
|---|---|---|
| Subject navigation | Shared Literacy/Maths switch | Direct links, back/forward and auth remain correct |
| Curriculum | Full F–2 registry; approved slices released | Stable IDs, standards and prerequisites validated |
| Teaching | Lesson player and presentation | Concrete→pictorial→abstract connection is explicit |
| Manipulatives | 12 controlled accessible tools | Tap/keyboard alternative and serialisable state |
| Assessment | 10 blueprints, untimed, resumable | Media/model valid; unadministered not incorrect |
| Evidence | Immutable, tenant-safe Maths event archive | Offline retry, idempotency and export/delete coverage |
| Reports | Class and learner next-action reports | Source, count, freshness and representation visible |
| Planning | Small-group composer | Exact teacher language, materials and exit observation |
| Print | Maths worksheet generator | A4/Letter, grayscale and answer sheets |
| Stories | 12 complete Number Stories | Exact text, model interactions, narration and prompts |
| Songs | 10 original songs | Lyrics, instrumental, adult vocal/guide and captions |
| Games | 8 integrated arcade games | Learning action is game action; no speed mastery |
| Family | No-account Family Bridge | Common materials, five minutes, no child media |
| Media | LEDA instruction/narration pipeline | Fingerprints, technical QA and human listening review |
| Privacy | Existing high-privacy child model | No camera, child recording, image upload or public data |

### P1 — fast follow

- teacher-authored number-talk collections using approved models;
- locale packs for `en-US` and `en-GB` currency/terminology;
- paired collaborative mode on one device without identifying audio;
- more Story worlds and nonfiction maths books;
- additional fact strategy games after conceptual launch;
- teacher import/export of curriculum mappings;
- school-level coverage trends with minimum cohort protections.

### P2 — future, designed but not promised

- Years 3–6 modules;
- multilingual adult-facing Family Bridge translations;
- physical printable manipulative kits with QR deep links;
- research-calibrated fluency measures for explicitly suitable constructs;
- standards packs for additional jurisdictions.

## States every surface must define

- initial/loading;
- ready;
- partial data;
- empty/not assigned;
- media unavailable;
- offline;
- pending sync;
- retryable write error;
- permission/class mismatch;
- archived learner;
- interrupted/resumable assessment;
- complete with next action.

No screen may show a button that cannot succeed under its displayed state.

## Analytics and privacy

Permitted operational events:

- surface opened;
- activity started/completed/exited;
- item model ID and response classification;
- accessibility setting used;
- media load failure;
- sync queued/recovered;
- teacher recommendation opened/acted on.

Forbidden:

- child voice/image;
- free-text child chat;
- precise location;
- advertising identifiers;
- cross-school behavioural profile;
- raw teacher notes in product analytics.

## Open decisions resolved for implementation

- Product name in navigation: **Maths** for the launch `en-AU` locale.
- Scope: Foundation–Year 2; later years use the same module boundary.
- Platform: same app, repo, Supabase project and learner records.
- Maths evidence: new immutable subject-specific table; no reuse of Literacy
  `answers` as an untyped catch-all.
- Stories: read-with-help by default; listening/reading does not affect Maths score.
- Audio: Leda for spoken content; adult vocalist or owned singing source for final
  songs; no child recording.
- Mastery: disabled until pilot calibration; reports use evidence states meanwhile.
- Locale: AUD and metric at launch, with locale contract from day one.
