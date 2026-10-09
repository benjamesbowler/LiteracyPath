# Letter Leap authored platforming implementation

## iPad rendering repair — 9 October 2026

The retained illustration, character registration and fixed-step platform
physics remain the current design. `arcadeRenderBudget.js` bounds backing work
on iPad Safari. The horizon is rasterized once at its displayed size and only
visible repetitions, props and enemies are drawn. A paused or hidden game
stops repainting after its frozen frame; resize and completed art delivery
invalidate that frame. The WebKit fleet regression covers all catalogue games
and difficulties, with a separate Letter Leap movement and paused-draw check.
These are browser checks, not physical ninth-generation iPad evidence.

## Retained production record

Status: active production work in the isolated world/platform lane. Three-world
native pilots, complete 50-word Easy and 40-word Medium outings, a genuine
73-to-86 saved Hard continuation, authored collision recovery and the all-three
final-art-failure paths have passed. The Hard run’s final observer assertion
failed; a separate 11-gate retained-state audit verifies actual completion
without replacing that failed report. Two separate genuine final pickups from
the exact naturally written 85-word save passed literal Next/Replay activation.
The later single-pickup correction passed three affected native checks. The
leaf is verified for parent integration. This document does not claim release,
physical-iPad use, classroom observation or human listening.

The upgrade preserves the real side-scrolling route, jump/coyote/buffer physics,
moving shelves, springs, breakable/prize crates, enemies, backtracking and
catch-up courses. Easy uses Bouncy, Medium Chompy and Hard Pip. Bouncy replacing
the previously valid Speedy hero is an explicit new production cast choice.

## Learning and saved state

`letterLeapLearning.js` owns the construct
`heard-word-grapheme-encoding`, stable encounter identities, first responses,
supported retries, accepted ordered contacts and unique word completions. It
imports the single canonical `LETTER_LEAP_CONTENT_VERSION` authority. Running,
coins, falls, stomps, springs and crate bumps are motor events and never literacy
responses. The current choices stay fixed on retry. A partial spelling hint
appears after two mistakes; accepted child letters remain visible. Sentence cues
mask future words and any earlier instance equal to the active target.

The root-owned `src/data/letterLeapEncodingContent.js` clones the global ladder
for this unpublished v2 only. It repairs the two unrecorded targets GRUMP and
ROBOT to explicitly sourced STUMP and ROCKET; global word/sentence banks and
the full 10-course/word/leg counts remain intact. Root-owned exact sentence
scene cues accompany the active word's own recording. Immutable rows record
`pictureKind: 'sentence-context'` and `sentence-context-picture` support, so
these pictures never become independent unique-picture encoding evidence.
The active spelling stays hidden, including the former onboarding YOU label.

`letterLeapCue.js` measures the displayed picture's successful decode and the
matching production word clip's actual Howler end separately. Immutable response
rows retain each source URL and observed end/decode time. Fulfilled promises,
audio errors, missing pictures, cancellation, stale callbacks and later delivery
cannot counterfeit an earlier independently delivered cue. Muted and assisted
play remain supported practice, with no mastery claim.

`letterLeapSession.js` saves only under the existing scoped learn-games record's
`games['letter-leap'].practiceSession[difficulty]`. It validates the content
version, seed, journey, queue, accepted prefix, evidence and bounded mutable
world against canonical generated route geometry. It preserves chosen bank
positions, moving-platform riders, enemies, used/broken crates and reward
pickups. Resizing rebases the same geometry; it does not roll a new choice bank.
A local save failure holds the exact snapshot and pending transition until
Retry save receives a local receipt. The root owns cloud sanitization and
immutable completion metadata.

Only the actually collected letter is marked taken. Its untouched neighbour
stays at the same location as a neutral inactive token after the decision; it
cannot generate an answer for a later slot. Future decisions remain hidden.
Older v2 paired-retirement saves are admitted only with their genuine accepted
slot history: the target stays collected, the uncollected neighbour reappears,
and all response histories remain unchanged. Historical learning never marks
an untaken object collected in a fresh catch-up replay. Malformed-world recovery
rebuilds only the actual accepted physical prefix at the held cursor.

All ten original courses remain. Sentence courses spell every sentence leg.
Correct final contact automatically saves the word, permits continued physical
movement during feedback, then advances the word/leg/course. The final outing
commits once without requiring a separate finish-flag trip. Catch-up keeps
previous word credit and requeues the unfinished course.

## Art, contacts and ownership

The source authority is
`source-art/arcade/physical-worlds/letter-leap/manifest.json`. Each input has its
retained original PNG, exact prompt/reference roles, source/runtime dimensions
and independent hashes. Runtime derivatives are under
`public/game-assets/physical-arcade/letter-leap/`. The generated module is built
by `scripts/art/build-letter-leap-art.mjs`; it is not hand edited.

Each canonical hero has original idle, extended/passing run, brake, takeoff,
rise, fall, landing and bump/recover/correct/summit poses. Irregular source cells
retain measured opaque sole/crown bounds. Missing hands are omitted rather than
invented. Original encounter banks contain four distinct species per world,
each with idle, two travel and impact states. `letterLeapSceneKit.js` selects
poses from actual physical state and owns exact-dimension decoded scene images;
the root's registered art bank owns reference-counted character decodes.

`letterLeapContact.js` uses the same registered visible crown as the renderer
for crate undersides, solid sides and low-ceiling clearance. It preserves the
existing controller's physical foot/landing baseline. Retained normal contact
frames showed and repaired the old 46-unit controller head overlapping the
larger authored hero.

Far authored horizons, separate textured platform caps/soil and live action
props surround actual editable controller geometry. They do not contain target
text or a pre-rendered completed game. All runtime actors, letter decisions,
crates, springs, pickups and collision surfaces remain live. Decorative clocks
are simulation-owned and freeze with pause/visibility; reduced motion freezes
ambient effects while retaining essential physical action.

Recovery order is the owned platforming art, shared authored Pal continuity,
the active legacy canonical image, then root's asset-free canonical
`physicalPalFallback.js`. The final procedural path is explicitly
`procedural-art-unavailable`; rendered recovery does not become a delivered
authored-art receipt. Active legacy cast/background/terrain/foe/landmark sources
remain preserved until their complete normal and recovery consumers are audited.
Legacy image listeners/decodes are bounded and detached on unmount.

## Controls and native verification

Left/Right or A/D moves; Up/W/Space jumps. Held touch movement and the one-finger
Leap action share the real controller, with pointer cancellation/lost-capture
release. Hear is in the picture cue on wide/portrait screens and a clear side
rail on short landscape. Primary controls meet 56px minimum and 8px separation;
coarse tablet controls use 72px. Shared title/Pause/Tools/Exit belong to the root.

The final owner focused unit gates pass 48 cases across `letterLeapArt`,
`letterLeapEvidence`, `letterLeapLearning`, `letterLeapCue`, `letterLeapSession`,
`letterLeapMetrics` and `letterLeapNativeNavigation`. Scoped ESLint passes. These prove deterministic rules,
registration/manifest identity, learning receipts and bounded persistence; they
do not by themselves prove the final rendered outing.

Retained native evidence is under ignored
`.artifacts/arcade-standard-upgrade/letter-leap/`:

- `baseline/`: original runtime comparison; physical controls and one word.
- `pilot-1/`: original Meadow authored pilot, including the visible head/crate
  defect and before frames.
- `pilot-2/`: repaired head contact and three delivered worlds plus 320 portrait
  and 568 short landscape. These precede actual audio-end receipt wiring.
- `pilot-3/`: preserved failed driver attempt; it walked through the lower
  correct choice while trying to reach an upper deliberate wrong choice.
- `pilot-3-retry/`: five passed native scenarios with frozen source hashes,
  actual audio-end/image-decode receipts, stable two-wrong hint, accepted prefix,
  Tools pause, real reload/Continue and all-three authored enemy/world frames.
- `pilot-4/`: all-three final missing-art recovery paths passed native jump and
  Tools pause with unavailable authored-art receipts. Its original course driver
  failed after moving blindly through feedback; the failure report and frames
  remain intact.
- `pilot-4-retry/`: course 0 completed all five distinct words, displayed the
  original correct and summit poses, then automatically advanced to course 1.
  The inspection-copy mutation gate passed and source hashes stayed unchanged.
  The report remains failed for a separate recovery driver that backtracked
  while standing on an upper shelf instead of reaching a ground foe. Authored
  bump/recover was repaired and proven separately below.
- `pilot-4-reaction/`: passed ground-foe contact through real held movement and
  small key taps outside the spring cap. The live patrol caused one motor hit
  and a life loss, then displayed the original Bouncy bump and recover poses.
  There were no reading errors or word completions; frozen source hashes and
  zero page errors are retained with the actual contact frames.

`hard-cue-gap-packet.json` preserves the exact original uncorrected seed-3
resolver/source results that prompted the narrow v2 repair. It is historical
gap evidence, not the current repaired bank. Hard sentence-scene and STUMP
derivatives are now copied from the root-reviewed cue pack: all nine decode,
the full 176-word seed-3 plan has retained recorded-file existence coverage,
and five root semantic/progress checks pass in this checkout. This is local
asset/preflight evidence. The later genuine native Hard continuation below
proves delivery and completion against this full repaired bank. Easy/Medium plans are unchanged by this content seam. The root owns
`src/data/letterLeapEncodingContent.js`, its semantic test, the shared support
bridge, `tools/buildArcadeCueMedia.mjs`, the cue manifests and originals under
`source-art/arcade/cue-images/`, the reviewed nine runtime images under
`public/images/child-mode/reviewed/letter-leap/`, and the separately corrected
MAGNET override/source/runtime. Those files are excluded from the leaf commit.

The latest source adds authored feedback, canonical final recovery, compact
observation, ordinary frame metrics and image cleanup after pilot 3. Correct,
summit, bump/recover and final canonical recovery have the affected proof above;
sustained Easy/Medium outings and the genuine saved Hard continuation have
the retained results below. Long course tests use trace off,
bounded read-only `__letterLeapMotion` during movement and full cloned histories
only at meaningful checkpoints/end. No controller mutation, clock shortcut or
expected-answer injection completes a route. Test driver knowledge selects
real visible letter contacts through native movement.

The retained ordinary-clock ten-course Easy and Medium outings now pass in
`.artifacts/arcade-standard-upgrade/letter-leap/full-outings/{easy,medium}/`.
Easy saved all 50 distinct words in 768.586 seconds; Medium saved all 40 in
1050.721 seconds, including genuine catch-up courses. Native key release was
empty at every captured feedback boundary (54 Easy, 55 Medium). Both retained
immutable first responses, retries, correct accepted responses and the actual
settled local completion record, with zero page errors and unchanged imported
source hashes. Last warmed 600-frame headless desktop means were about16.67ms;
these owner diagnostics do not establish physical iPad/display latency or human
listening. The corresponding actual completion frames were directly viewed.
Next/replay controls are visible; their actual activation is proven separately
below.
Their historical source identities are retained unchanged. A later presentation
correction makes the completed HUD show Trail10/10 while active catch-up still
shows its actual current course; the later Hard completion frame and actual
completed-save lifecycle exercise this corrected presentation.

`letterLeapMetrics.js` retains ordinary rAF intervals, actual render submission
duration and input-to-submission values after a 15-second warmup. It includes
slow saves/frames; it does not assert physical display latency. The genuine
original 73-word saved state is retained byte for byte at
`full-outings/hard-saved-continuation/actual-scoped-learn-games.json`, SHA-256
`f66904980111ab2479ff09ba0cd3d5877e8482bf657e2b43fcf1527c49b3a7a1`.
The later ordinary-clock `full-outings/hard-73-shelf-continuation/` earned the
remaining 13 distinct words in 686.839 seconds, preserved all four prior
immutable histories, completed all ten actual course cursors and saved one
86-word completion. Its final assertion expected a fresh stage-9 playing
checkpoint, though the restored stage was already in word-result. The original
FAILED report remains unchanged; `retained-completion-audit.json` passes 11
literal state/evidence/source gates. Last warmed 600-frame intervals averaged
16.6665ms (p95 17.9ms); input-to-submission p95 was 10.8ms. These are headless
desktop diagnostics, not physical-device or photon-latency claims.

The unchanged final resilience suite in `resilience-final/` passed six cases:
missing picture, missing audio, all-three canonical final-art recovery, and
muted/reduced-motion/touch/visibility input cancellation. The quota/reload case
retained an original failed report because its test initScript reseeded the
same saved progress at every navigation. A fixture-only absent-key guard and
the one affected retry in `resilience-quota-fixture-retry/` passed with the same
held-prefix, retry, equality and timeout assertions. No engine or save logic
changed. `completed-save-lifecycle/` passes four real reopening/Pause/restart/
reload gates: the earned exact 86 save naturally opens chapter 1 with a fresh
seed, and the original completion/stamp remains unchanged. This does not claim
activation of the old ending dialog’s literal Next/Replay buttons.

`full-outings/hard-73-ending-actions/` retains a second genuine ordinary native
73-to-86 continuation. Natural catch-ups left GROW as the last new word. The
observer incorrectly anticipated CASTLE and reached its unchanged watchdog
after actual completion; that original FAILED report remains intact. The
read-only `retained-ending-audit.json` passes nine literal raw-state, prefix,
source and action gates. Actual 86 was observed after 2106.231 seconds; the
whole observer run closed at 2284.186 seconds. It retained 388 first responses,
903 retries, 388 accepted contacts and 107 empty-held feedback boundaries, with
all 29 declared source inputs unchanged. The genuine naturally written 85 save
has SHA-256 `1c3b4d522f2cd07068a8888e5c54e972de2b11583e9e5dec36df9f11d3896733`.

`literal-ending-recovery/` passes two actual native ending paths in 18.947
seconds. Each separate isolated preview scope reopens those exact unmodified
85 bytes, earns the real final W through movement, and displays the ending.
Actual Next trail opens chapter 1 with a fresh seed; actual Play this again
opens chapter 0 with a fresh seed. Both accept native ArrowRight afterward,
reset only current-session evidence and retain exactly one original completion
and journey stamp. These are bounded last-pickup lifecycle proofs, not two new
whole outings. Their four actual ending/fresh-input frames were directly viewed.

The upgrade plan's one-object acceptance exposed an inherited paired-retirement
defect after those outings. The later corrected source has separate proof in
`pickup-correction-launch-retry/`: three native cases pass in 14.427 seconds,
with all 30 start/end identities equal. They prove one-object collection,
walking spring launch, deliberately missed pickup, real overlap with a retained
inactive neighbour without another response, local wrong contact, fresh-prefix
reload and old paired-format migration without any evidence change. The
original `pickup-correction/` failure is preserved: its old test launcher waited
for the lazy module before clicking Continue and never reached native play.
Moving exact Continue before that wait repaired only the harness. Earlier full
outing identities remain historical; no full outing was rerun or relabelled for
this bounded correction. No physics, teaching bank, audio receipt or route
geometry changed.

Parent integration retained a separate original 22-case report with 19 passes
and three failures. Two fixtures seeded checkpoint zero but waited for the
engine behind the real Continue gate. They now activate exact Continue before
the unchanged native assertions. The third failed first-course steering at a
covered shelf. `parent-route-diagnosis/original-native-cause/` records a genuine
38.526-second original-driver capture: soles at y286 on the x5822 crate, above
the intended y308 shelf, remained aligned with the waypoint for two seconds.
The old driver waited for the lower shelf's exact height despite actual grounded
support. This fresh capture used seed3411259335/CAT, with the same stage-zero
terrain as the original seed3/MAT failure; it is not labelled an exact content
replay. Its exact scoped raw save and eight-second input/geometry history remain
retained. The steering helper now accepts a genuine higher support within the
covered shelf span, while rejecting airborne, underneath and remote crossings.
Game physics, routes, word banks, evidence and all image bytes remain unchanged.
The parent affected retry took93.678 seconds: the seed3 five-word course and
actual automatic stage-one advance passed in68.812 seconds, confirming the
waypoint correction through real keyboard contacts. The two Continue fixtures
reached the game but still collected zero letters. Their seed0 assumption that
the first answer occupied the lower route was false; target placement remains
seeded, and the upper choice is170 pixels farther along the trail.
The fixtures now use the already observed seed3 MUD/M encounter, assert its
actual seed, target, two-choice identity, floor alignment and clear approach
before input, and retain exact local-save bytes, native snapshots and rendered
before/after frames. The height case additionally verifies every pickup's real
ground-relative rebase; the tap case verifies physical movement after each of
the same six pointer/Enter actions before completing the word through native
jumps. Both calibrated affected native cases passed in14.2 seconds, with
before/after raw state retained by the parent. Both earlier failed reports remain
intact; those fixture repairs made no runtime, physics, art or answer-bank change.

The viewport-rebase unit now compares the actual evidence snapshot taken before
restore, including timestamps, instead of a second freshly generated sample.
The art compiler's metadata-only path leaves the original source manifest and
authoring provenance untouched. Browser scene metadata uses Literacy Guide and
repository-relative references. A complete-object regression preserves every
other public contract field. `parent-route-diagnosis/metadata-only-provenance.json`
verifies exact before/after SHA-256 equality for the manifest, all14 original
PNG/runtime WebP pairs and all14 prompts. The affected owner/brand units pass
54/54 and scoped lint passes; these checks do not substitute for the pending
native parent retries.

The parent checkout's first metadata regression retained its original 64/65
result: resolving an original authoring absolute path relative to a different
checkout incorrectly expected a sibling-worktree path. The portable compiler
now admits that absolute reference only through its exact repository suffix and
the independently measured retained concept-image hash. The complete metadata
regression derives the same source suffix, verifies the local reference exists,
and remains a complete-object equality check. Metadata-only compilation changes
no generated scene values from the previous correct authoring checkout and
keeps every retained source/runtime byte exact. No parent native result is
claimed by this source portability correction.

A final shared policy check found the retained emoji inside the Hear button.
The icon alone now uses an inline currentColor speaker SVG; the 56px wrapper,
Hear label, accessible name, cue receipt and controls remain unchanged. Twelve
affected cue/art units and scoped lint pass. The parent's 4639-unit and 120-case
device results precede this icon-only runtime follow-up. Its existing native
Hear size/audio-state case passed in 3.0 seconds with all 80 source hashes
unchanged. The learn-game guard passed: 145/145 images, 90/90 Safari voice cues
and 3/3 reward cues, with no browser speech.
