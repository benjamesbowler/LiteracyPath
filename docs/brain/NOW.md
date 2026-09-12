---
type: current-state
status: active
updated: 2026-09-12
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

## Immediate activity access

The product owner requires games, assessments, Cycles and phonics activities to accept input while instructions play, with optional replay and no mandatory onboarding or countdown overlays. The [game design bible](../design/GAME_DESIGN_BIBLE.md) and [Cycle Practice contract](../product/CYCLE_PRACTICE.md) carry this rule. Audio evidence records actual delivery even when the learner responds early.

## Current game-production direction

- Sound Seekers retains three worlds, 30 stages, 150 main missions, 60 optional quests and eight playable Pals. Branching landscapes now use compass guidance, an obstacle-aware follow camera and explicit nearby activity entry; completed activities remain in Pause replay. Related platform problems preserve the camera, position and construction, with shorter teaching rooms, raised sound stones and animated crossings. Maze actions carry/return objects. Forty-eight illustrated action poses supplement walking cycles. Initial anchors use m → map; meaningful text help remains supported across sort items and resumed attempts. The [release Bible](../SOUND_SEEKERS_RELEASE_BIBLE.md) owns current behaviour, media and verification boundaries. Local browser checks cover all three worlds, activity entry, maze completion/replay, saved help and small-screen controls; later-world fixtures remain synthetic. Former corridor-time estimates are superseded and twenty hours remains unmeasured.
- Sound Seekers earned local play and synthetic later-land fixtures remain distinct evidence. Its campaign merge and fixed-search-path migrations were applied to production on 10 September with explicit owner authorization; hosted engine/delta parity and retry idempotence passed. Authenticated learner save round trips and physical-device play remain unverified by the current refinement. Coordinate shared progress files with this task and Arcade audio files with the game-restoration task.
- The owner rejected the staged select/confirm Arcade replacements. Gameplay restoration is the baseline, not completion of the requested console-quality upgrades. Earlier descriptions of held word gates, nominated fish and six-answer basket collection are superseded and must not guide new implementation.
- The [complete upgrade plan](../design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md) covers all 22 catalogue games (13 Arcade, nine Phonics) plus Sound Seekers. It incorporates the 10 September reports: near-rocket word audio, persistent Letter Leap pickups/platforming, actual Word Climb ascent, real 3D turning Sound Racer, unobstructed Sound Beat/Sentence Grove/Spell & Skate views, and restored Sound Seekers adventure pacing. It is a plan, not evidence that those changes are implemented.
- Preserve the owner-valued play in Rhyme Pop, Sound Safari and Reel & Read; build on Sentence Express’s strong mechanics. Resolve reported blockers before broad presentation work. Sound Racer’s requested flagship requires real track geometry, vehicle heading and steering, not decorative curvature behind a straight runner.
- The [Game Design Bible](../design/GAME_DESIGN_BIBLE.md) and [production guide](../design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md) retain learning, input, quality and evidence requirements. No instruction playback may block starting or continuing an activity. The new plan supplies the current detailed upgrade direction; historical package counts and structural briefs do not establish finished gameplay or visual quality.

## Known blockers

No second-brain infrastructure blocker is recorded. The Codex startup hook was
installed, reviewed, and trusted on 2026-08-03.

## Current beta release state

- Letter and Word Workshop practice retain immutable v3 completion events through local storage, queue coalescing and hydration. Trace, Listen, Match, Hear, Build and Magic use larger learning objects, recoverable recorded audio and explicit supported continuation. Magic preserves the intended target and first deliberate response separately from its modeled example. Completion describes supported practice/exposure, not mastery; Workshop sequencing names the actual authored grapheme prerequisites. The `check:phonics-learning` release check exercises media, response evidence, audio recovery and trusted-touch browser interaction. See [Learning Policy](../design/LEARNING_POLICY.md).

- Sound Racer and Reel & Read use their restored real-time engines. The prior held-fork confirmation and nominated-fish descriptions are superseded. Current reported defects and requested upgrades are tracked in the [complete upgrade plan](../design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md); restoration does not establish that these later requests have been delivered.

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
- Music defaults off outside the main menu; the A–Z song keeps its on default.
  Game, Quest and Sound Seekers music opt-ins last only for the current visit;
  saved or synced music-on settings cannot start a new activity. Spoken audio stays independent.
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

## Arcade restoration

- The product owner rejected the staged select/confirm Arcade rewrites. Rocket Run, Sound Racer, Word Bridge, Rhyme Pop, Sound Safari and Reel & Read use their pre-rewrite engines again; Sound Beat restores its original rhythm performance; shared result-save protection and music defaults remain current. Preserve real-time gameplay as required by the Game Design Bible.
