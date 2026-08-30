---
type: current-state
status: active
updated: 2026-08-31
authority: orientation-only
---

# Current state

## Stable project facts

- LiteracyPath is the current product repository and its running application
  is the final behavioural authority.
- The repository root is also the Obsidian vault. Markdown remains the owned,
  reviewable source; Obsidian supplies search, links, backlinks, properties,
  Bases, and graph navigation.
- The authoritative documentation entry point is [Documentation index](../INDEX.md).
- Shared agent context uses a local-first system: concise project notes,
  global Codex guidance, local Codex memories, and live task inspection.
- Generated dependency graphs and task transcripts are not project memory.
  Retrieve code and current task details only when needed.

## Current coordination rule

Live task state is read from Codex rather than copied here. Use
[Workstreams](WORKSTREAMS.md) only for durable collision warnings, blockers,
and handoffs. A task that changes an authoritative rule must update the
authoritative source and, when the choice is durable, record a linked decision.

## Known blockers

No second-brain infrastructure blocker is recorded. The Codex startup hook was
installed, reviewed, and trusted on 2026-08-03.

## Current beta release state

- A child-friendly student welcome tour now opens on a learner's first real
  sign-in on a device. The second and third sign-ins show a small optional
  reminder, and a persistent Help control reopens the tour from any unlocked
  page that shows the shared student header. The tour supports tap-to-hear,
  keyboard focus containment, and per-learner local cleanup; it is suppressed
  during teacher-controlled Student Sessions. Automated Chromium coverage is
  complete, while physical-iPad and observed first-use testing with children
  remain release evidence gaps.
- Teacher-controlled Student Sessions are implemented in source for whole
  active classes or selected students. Teachers can assign each child's next
  Skills checkpoint, one common published Skills area, one exact available
  Guided Reading book, one exact learning game, Reading Library, or Letters
  Practice; the existing synchronized Guided Reading setup remains available
  separately. Whole-class membership is derived atomically by the database,
  sessions restore from opaque student sign-in tokens, and unavailable exact
  content fails closed without opening a shelf or chooser. Migrations
  `20260828120000` and `20260830213034` have not been applied or verified on the
  hosted project, and the in-app lock still needs physical-iPad classroom
  verification.
- Child-facing background music is independently controllable from spoken
  teaching audio and game sounds across Home, Arcade/full-screen games, Sound
  Beat, and Sound Seekers. Existing whole-sound or quiet-soundscape preferences
  migrate without unexpectedly turning music back on.
- Pending media is test-visible during beta without being labelled human
  approved. Quarantined pairings remain excluded immediately. The governing
  decision is `decisions/2026-08-15-beta-media-test-visibility.md`.
- The school-linked parent area is implemented at `/parent`. Teachers explicitly
  invite a guardian, release family-safe report snapshots, and can revoke access;
  guardians cannot read teacher evidence or another family's records directly.
- The lean release source retires six optional product surfaces: Class Decodable
  Press, Class Quest Live, Observed Change, Paper-to-Progress, Story Crew, and
  Reading Passport. Their routes, buttons, runtime modules, feature tests, and
  callable feature RPCs are removed. Historical database rows and immutable
  migrations remain solely so existing learner data can still be exported or
  erased; new writes to the two retired progress areas are rejected.
- The linked Supabase project was verified on 2026-08-22 with migrations applied
  through `20260822123000` and the pre-retirement 94 browser RPCs visible to
  PostgREST. Source now defines 83 browser RPCs after the lean-release cleanup
  and the Student Sessions RPCs in `20260828120000`, extended by
  `20260830213034`; neither Student Sessions migration nor the post-retirement
  hosted surface has been verified on the hosted project.
  The two remaining database-lint warnings are older volatility declarations in
  `lp_quest_merge_mastery` and `lp_merge_transfer_missions`; neither is part of
  the guardian portal. Recheck hosted state before relying on this dated
  observation for a later release.
