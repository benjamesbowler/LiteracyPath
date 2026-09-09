---
type: current-state
status: active
updated: 2026-09-09
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

## Current game-production direction

- The improvement programme has integrated G01–G06 and G08. The latter adds
  authored workshop object actions, short onset/rime reuse missions and
  one-letter garden transformations; response records remain supported
  practice rather than independent proficiency. Word Climb engineering is
  isolated while its required climbing art remains unfinished. Independent
  phonics batches may continue from G08's verified wrapper; the full Arcade,
  phonics and Cycle Practice acceptance scope is unchanged.
- The [Game Design Bible](../design/GAME_DESIGN_BIBLE.md) remains the product
  authority. The [Game Visual and Playability Production Guide](../design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md)
  is the current provider-neutral workflow for raising game presentation and
  playability to the product owner's console-quality target.
- The live Learn Games catalogue has 22 games: 13 are surfaced as the current
  Arcade roster and nine remain in the wider catalogue. Existing version 2.0
  records document intended contracts and selected mechanic anchors; only five
  currently have validated vertical-slice briefs, and none of those documents
  is direct visual, motion, human-listening, physical-device or child-play
  approval.
- [TASKS.md](../../TASKS.md) tracks the full catalogue plus Sound Seekers,
  Adventure Map and other game-like surfaces. It proposes Sound Racer 3.0 as the
  first gold-standard implementation, followed by shared production/evidence
  tooling and the wider fleet; that order remains a programme recommendation,
  not a durable product-priority decision.

## Known blockers

No second-brain infrastructure blocker is recorded. The Codex startup hook was
installed, reviewed, and trusted on 2026-08-03.

## Current beta release state

- Letter and Word Workshop practice retain immutable v3 completion events through local storage, queue coalescing and hydration. Trace, Listen, Match, Hear, Build and Magic use larger learning objects, recoverable recorded audio and explicit supported continuation. Magic preserves the intended target and first deliberate response separately from its modeled example. Completion describes supported practice/exposure, not mastery; Workshop sequencing names the actual authored grapheme prerequisites. The `check:phonics-learning` release check exercises media, response evidence, audio recovery and trusted-touch browser interaction. See [Learning Policy](../design/LEARNING_POLICY.md).

- Sound Racer uses an authored village rally with held word-choice forks, deliberate confirmation, curved travel and preserved first responses. Its DOM/SVG recovery scene shares the same rules and evidence as the authored renderer. Final completion saves once and has one result dialog. Current contracts and evidence boundaries remain in the [Game Design Bible](../design/GAME_DESIGN_BIBLE.md); local/browser checks do not establish physical-device or human-listening approval.

- Cycle Practice now uses six pictured, recorded-audio activity families with automatic responses, forgiving guided tracing, and full distinct decks for all 27 cycles. Assessment requires 30 active minutes plus completed coverage of taught sounds, words and activity types. Legacy memory/gate/confirmation mechanics are removed from this surface. See [Cycle Practice](../product/CYCLE_PRACTICE.md). It uses typed independent/support/media-failure evidence, retained first responses, pause-safe active practice time, immutable retry payloads and owner-scoped teacher results. The hosted migration is `20260908122903`; local and rollback-only hosted SQL checks passed. Current contracts are in [Cycle Practice](../product/CYCLE_PRACTICE.md) and [Learning Policy](../design/LEARNING_POLICY.md). Browser emulation does not establish physical-device or human-listening evidence.

- Cycle Practice touch choices now accept a released finger that drifts within
  the same button and discard cancelled or interrupted holds. Sorting shelves
  preserve visible letter labels; word-building retries preserve accepted parts.
  Media recovery does not count as a literacy attempt. All 13 activity layouts
  retain simultaneous models and responses on short landscape screens. Chromium,
  WebKit and recorded-audio delivery were checked; the repaired physical iPad
  remains untested. The current contract is in [Cycle Practice](../product/CYCLE_PRACTICE.md).

- Learner session recovery preserves pending progress and assessment revisions,
  retries with the current same-learner credential, and exposes one shared retry
  notice. Hosted migration `20260908114742` adds server-owned login expiry and
  token-only sign-out revocation. Hosted transaction tests passed on 2026-09-08
  with synthetic fixtures rolled back; authenticated browser and physical-iPad
  recovery remain unverified. This completes the A2 code/database dependency;
  the shared Cycle Practice recovery contract is now integrated as described above.
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
  `20260828120000` and `20260830213034` were applied to and structurally
  verified on the linked hosted project on 2026-08-31; all 83 browser RPCs were
  visible to PostgREST. The in-app lock still needs physical-iPad classroom
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
- The linked Supabase project was verified on 2026-08-31 with migrations applied
  through `20260830213034` and all 83 current browser RPCs visible to PostgREST.
  The Student Sessions tables are RPC-only with RLS enabled, the whole-class
  start RPC has one seven-parameter signature, and the exact-target and audience
  constraints are live.
  Current advisors also retain unrelated historical findings and expected
  notices for deliberately RPC-only tables and teacher-authorized
  `SECURITY DEFINER` entry points. No Student Sessions table was accidentally
  exposed to browser roles; advisor cleanup remains a separate workstream.
