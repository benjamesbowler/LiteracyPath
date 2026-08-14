# Foundation Maths release record — 2026-08-14

Status: current v3 Foundation candidate passed the complete local, hosted
database and production application identity gates

Release boundary: the eight Foundation number-sense goals in
`FOUNDATION_REBUILD_SPEC.md`. The wider Foundation–Year 2 programme remains a
separately gated roadmap and is not represented as released.

Previous production baseline: commit `2cb6b1030a`

Previous production deployment: Vercel deployment `dpl_GcH4DSwtxQHuxNKfwP6GKaZMW9pJ`,
built from `main` commit `2cb6b10` and promoted to `literacy.guide`.

## Current v3 verification

The current tree passed the scoped Foundation Maths release gate on 2026-08-14:

- content gate: 8 released skills, 40 lesson recipes, 160 authored assessment
  models, 48 released story pages, 5 direct-manipulation games and 8 chants;
- unit, content, evidence, reporting, migration and policy layer: 113 passed,
  0 failed;
- real-browser release layer: 35 passed, 0 failed;
- accessibility: zero Axe findings of any impact on all five student Maths
  routes and the Maths teacher dashboard at desktop and mobile viewports;
- layout and touch-target matrix: all five student Maths routes plus the teacher
  dashboard passed without horizontal overflow at phone portrait/landscape,
  tablet portrait/landscape, laptop and desktop sizes; enabled child controls
  remained at least 44 CSS pixels after fixed-canvas scaling settled;
- exact audio gate: 890 request mappings, 252 exact LEDA files and 8 owned
  instrumentals passed decoding, provenance and duration checks;
- targeted lint and whitespace checks: passed;
- production Vite build: passed.

Direct visual inspection covered every new story cover and all 32 new story
page illustrations, plus the redesigned student home, lesson, skills check,
story library and Arcade at desktop and small-phone sizes. Browser playback
started real LEDA lesson audio and an owned instrumental. The browser flow also
exercised all five game mechanics, story completion and Family Bridge, teacher
presentation, worksheets, reports, resources and assignments.

The v3 migration was applied to the linked hosted Supabase project on
2026-08-14. The remote ledger matched every local migration through
`20260814143000`; all 101 app-called RPC signatures remained visible to
PostgREST, and the focused Maths live boundary check passed. The current
production JavaScript bundle embedded the exact release ID
`96f99f7bcd7e94eb76c944603f16a85b22e57f7f`, so the v3 client candidate and
hosted schema are deployed together.

## Released product evidence

- 8 approved Foundation number-sense skills across sequence, counting,
  subitising, matching, comparing and part–whole understanding;
- 8 seven-stage guided lesson paths powered by 40 phase-specific recipes;
- 160 stable authored assessment models across six interaction blueprints;
- 5 interactive manipulatives;
- 6 released eight-page Number Stories with 48 page illustrations and exact
  countable models; 2 further stories remain clearly marked as drafts;
- 5 untimed curriculum game worlds with eight decisions per session;
- 8 original chant/song packs, with at least one for every released skill;
- teacher presentation, skills-check, assignment, small-group, worksheet,
  reporting, Family Bridge and audio-review workflows;
- private, versioned Maths evidence and assignment RPCs with export and verified
  learner-deletion coverage;
- no child voice, face, camera, image upload, public profile, timer, lives or
  speed-based mastery claim.

## Previous baseline verification

The full release command was run from a clean archive of commit `2cb6b1030a`,
not from the mixed development worktree.

- release/content/unit layer: 106 passed, 0 failed;
- real-browser layer: 34 passed, 0 failed;
- accessibility: zero serious or critical Axe findings on the tested Maths
  child and teacher routes;
- exact audio gate: 835 mappings and 177 exact LEDA files passed;
- production build: passed;
- focused teacher-account regression: 9 passed, 0 failed;
- focused Maths platform layer after arcade repair: 17 passed, 0 failed.

Direct visual inspection covered:

- child home and Number Trail at 1440 × 900 and 393 × 851;
- teacher overview at desktop and 393 × 851;
- Number Trail sequence, missing position, three tactile choices, selected state
  and educational repair feedback;
- all four game worlds through the browser release flow;
- teacher presentation, worksheet, reports, resources and audio playback through
  the browser release flow.

Audio playback was exercised in a real browser for a lesson instruction and an
owned song instrumental. Current technically valid clips remain accepted until
an exact clip is flagged, as directed by the product owner.

## Hosted data and production checks

The linked Supabase migration list was read after deployment. Every local
migration had a matching remote version through `20260814143000`; there was no
pending SQL. `check:live-database` confirmed all 101 functions called by the app
were visible using their real PostgREST parameter signatures. The focused Maths
probe confirmed token-derived student identity, anonymous denial for all teacher
operations and the v3 validator, and anonymous denial for the five private
Maths tables.

The production teacher Maths route was opened in an existing authenticated
Chrome profile. It loaded the owned class and remained on the Maths teaching
dashboard beyond the former 30-second admin-check failure window. An unavailable
admin lookup now fails closed as non-admin while a separately approved teacher
account continues; the fallback cannot grant elevated access.

## Deliberate release boundaries

- Formal `Secure` judgements remain disabled until pilot calibration provides
  the required teacher-observation evidence.
- Technically valid audio remains usable until an exact clip is flagged; no
  blanket human-listening gate is required under the current owner decision.
- Physical iPad Safari and supervised child-usability sessions are not claimed by
  this engineering record. The automated device matrix, emulated small-screen
  checks and adult-operated browser playtests passed.
- The wider Foundation–Year 2 skill, story, song, manipulative and game roadmap
  remains planned. This record does not relabel planned content as released.

The production frontend was fetched directly and its embedded release ID matched
commit `96f99f7bc`. Future releases must repeat both the hosted migration ledger
check and this deployed-bundle identity check; a successful local build or Git
push alone is not production proof.
