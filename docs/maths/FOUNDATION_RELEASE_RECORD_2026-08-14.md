# Foundation Maths release record — 2026-08-14

Status: released candidate verified on production

Release boundary: the eight Foundation number-sense goals in
`FOUNDATION_REBUILD_SPEC.md`. The wider Foundation–Year 2 programme remains a
separately gated roadmap and is not represented as released.

Verified implementation commit: `2cb6b1030a`

Initial production deployment: Vercel deployment `dpl_GcH4DSwtxQHuxNKfwP6GKaZMW9pJ`,
built from `main` commit `2cb6b10` and promoted to `literacy.guide`.

## Released product evidence

- 8 approved Foundation number-sense skills across sequence, counting,
  subitising, matching, comparing and part–whole understanding;
- 40 seven-stage lesson recipes;
- 160 stable authored assessment models across six interaction blueprints;
- 5 interactive manipulatives;
- 2 released eight-page Number Stories with 16 reviewed page illustrations and
  countable models; 2 further stories remain clearly marked as drafts;
- 4 untimed curriculum games with eight decisions per session;
- 3 original chant/song packs;
- teacher presentation, skills-check, assignment, small-group, worksheet,
  reporting, Family Bridge and audio-review workflows;
- private, versioned Maths evidence and assignment RPCs with export and verified
  learner-deletion coverage;
- no child voice, face, camera, image upload, public profile, timer, lives or
  speed-based mastery claim.

## Verification run

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
migration had a matching remote version through `20260813120000`; there was no
pending SQL.

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

Within the stated Foundation boundary, there is no known open code, content,
database, media-resolution, responsive-layout or production-access blocker.
