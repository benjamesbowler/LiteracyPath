# Sound Seekers current product bible

## Authority

This document describes the current product only. The live runtime, imported
data modules, and maintained checks are the final authority when wording here
becomes stale.

Current child-route implementation ownership:

- `src/features/soundSeekers/SoundSeekersRoute.jsx`
- `src/features/soundSeekers/v3/SoundSeekersV3.jsx`
- `src/features/soundSeekers/v3/content/`
- `src/features/soundSeekers/v3/engine/`
- `src/features/soundSeekers/v3/render/`
- `src/features/soundSeekers/v3/storage.js`

The v3 trail consumes the canonical stop order and teaching records from
`src/data/questSequence.js`. Existing `src/components/quest/` and
`src/utils/quest*` modules are compatibility and non-child-route consumers
until their zero-reference retirement checks pass; they do not define the
current Sound Seekers child presentation.

Historical pass numbers, scores, audit rounds, bundle baselines, prototype
targets, and named-person approvals are not product rules.

## Product standard

Sound Seekers is a phonics adventure, not a question bank wrapped in a game.
The current experience must preserve these outcomes:

- A child can understand the next action through audio, staging, iconography,
  and concise text.
- Answer objects are readable, reachable, and forgiving across supported input
  and display modes.
- Movement, interaction, correction, chapter handoff, and resume behavior do not
  create or erase learning evidence.
- Every chapter has a recognisable place, cast, interaction language, reward,
  and destination.
- Educational progression is decodable, recoverable after error, and honest
  about what the child independently demonstrated.
- Accessible and low-power presentations preserve the same learning intent,
  correction state, progress, and rewards.

## Current world

The adventure has eight current chapters and 40 route-authored stops. Chapter
maps, casts, scenery, interaction assets, gates, ceremonies, and rewards are
resolved from the current modules listed above. Project-authored and licensed
pixel-art provenance is consolidated in
`public/game-assets/quest-pixel/SOURCE.md`.

Pixel mode is the primary authored adventure presentation. The maintained 3D
and accessible 2D paths are supported presentations where the runtime exposes
them; they must not become parallel curriculum or progress systems.

## Learning and mastery

`src/utils/questMastery.js` is the single source for Sound Seekers mastery
rules. This document deliberately does not duplicate its numeric values.

The current principles are:

- only independent attempts contribute knowledge evidence;
- evidence must meet the active target type's rule;
- different days protect against same-sitting cramming;
- different task contexts protect against game-specific guessing where the
  target type supports more than one context;
- consecutive misses can invalidate an earlier mastery claim;
- completing a stop or narrative gate never automatically means mastery;
- narrative progress is not withheld because a mastery state is incomplete.

Review scheduling is owned by `src/utils/questReviewScheduler.js`. Reporting
must derive from the same stored attempts and mastery state used by the game.

## Interaction contract

- One child action produces at most one attempt.
- A missed tap never becomes a different action or an unintended answer.
- A wrong answer preserves the active problem long enough to teach the
  correction; it must not silently regenerate the choices.
- Assistance and timeouts are recorded honestly and cannot be converted into
  independent success.
- Active tasks survive pause, route rebuild, and checkpoint resume without
  changing their target or choices.
- Every audio-dependent phonics task resolves a current committed clip.
- Browser text-to-speech is not a production phonics-audio fallback.

## Presentation and accessibility contract

- The child sees one clear immediate objective.
- Essential instructions never rely on text, colour, motion, or sound alone.
- Keyboard, touch, pointer, reduced-motion, high-contrast, and accessible
  alternatives retain equivalent educational meaning.
- Focus cannot escape into content behind a modal.
- Renderer or asset failure must lead to a calm supported fallback, not a blank
  or permanently loading screen.
- Current media selection comes from runtime manifests; old request packs and
  source-board workspaces are not fallback libraries.

## Data and lifecycle contract

- One journey uses one progress model and one active scene lifecycle.
- Timers, listeners, tweens, and scene resources are disposed when their owner
  ends.
- Offline progress is queued before network work and reconciled without losing
  or inventing attempts.
- Telemetry is minimal, child-safe, and limited to product reliability and
  teaching evidence needs.
- Debug shortcuts and test hooks cannot create release evidence that the real
  child input path does not support.

## Current verification

Use the checks relevant to the changed system:

```text
npm test
npm run lint
npm run build
npm run check:quest
npm run check:quest-pixel
npm run check:quest-pacing
npm run check:quest-pixel-bundle
npm run check:quest-offline
npm run test:quest-browser
```

The pixel-bundle check verifies the current lazy-chunk architecture and required
subsystems. It does not enforce a historical byte ceiling, module-count target,
or percentage reduction.

Local checks prove source consistency and exercised behavior. They do not by
themselves prove physical-device performance, assistive-technology behavior,
classroom audio, or observed child comprehension. Those are release-specific
external checks, not hidden publication switches or permanent approval fields.

## Definition of ready

Sound Seekers is ready for a release only when the enabled current journey
passes its maintained automated checks, the affected real-input paths have been
exercised, and any untested external environment is stated plainly. No dated
audit, pass score, reviewer name, historical baseline, or missing evidence pack
can override the current application.
