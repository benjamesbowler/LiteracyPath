# Burrow Builders implementation

Status: implemented and locally verified at the retained source revision below;
shared release verification remains with the parent workstream.
Content version: `BURROW_BUILDERS_CONTENT_VERSION` in `src/data/arcadeContentVersions.js`.

## Play and learning

Burrow Builders is an editable, stepped 11 × 11 island with real walking,
construction, removal, rotation, supplies, undo and camera views. A stream and
pond interrupt walking until a bridge or solid crossing exists. Closed gates
block walking; placing the selected gate again opens it. Dug channels carry
water when connected to the upstream source, and dams stop downstream flow.
Removing or undoing them restores the derived water layout. Garden beds grow
during foreground play; roofs keep beds dry and stop the visual rain above
their footprint. These events award no learning credit.

Fresh child worlds begin with three real editable bridge pieces at the upstream
crossing. Both banks have broad, clear building space: no prefab shelter,
sleeping spot, gardens or gates are supplied. The centre stream crossing remains
for the child to build. These three pieces use the same pickup, placement,
water, capacity, undo and persistence rules; they do not spend starting
materials or create response evidence. The quieter start follows the user's
4 October play review, superseding the earlier 32-piece prefab start. Existing
saved worlds retain every validated structure rather than being replaced;
the grid, content version and save schema are unchanged. Physical supplies now
sit near the island edges, but retain their original gathered-receipt keys so
previously collected materials cannot respawn after this presentation change.
Dams must reach the low stream bed; an elevated barrier cannot drain water below.

Free Build is selectable immediately. Ordinary materials are unlimited there,
while the unfinished learning blueprint, accepted units, choice order and
response evidence remain intact. Returning to that blueprint resumes its next
sound. The editable island has a finite capacity of 180 placed pieces, five
placement levels and sixteen undo entries. Each of the three selectable islands
has its own retained structure and supplies. Starting a fresh learning outing
carries validated worlds forward without copying answers or credit.

Each outing has six blueprints. Easy encodes the CVC building nouns `hut`,
`log`, `box`, `pot`, `mat` and `bed`; medium encodes `shed`, `shop`, `rock`,
`duck`, `ring` and `fish`, using their digraphs as single grapheme units. The
heard word and a shared production picture are the cue. No spelling target is
printed in the HUD, fallback, world textures or feedback. The child's accepted
units remain visible on the physical foundation rail. Two incorrect literacy
attempts reveal only the shared partial spelling hint. The construction menu
calls its bed piece a "Sleep spot" so it cannot reveal the easy spelling cue.

The final correct unit automatically crafts a useful construction kit. A
completed shelter contains a roof-protected bed; a crossing changes the stream's
traversability. Hard uses six literal spatial reading instructions and three
equally styled, numbered construction places. The printed instruction is
legitimate reading material. An unmarked placement is a motor action, not an
incorrect reading response. The camera remains fixed for those instructions so
left, right and behind have a stable reference. Completing all six automatically
commits the existing completion transaction and leaves Free Build running.
Next trail and fresh blueprints remain explicit choices.

## Worlds and controls

The shared difficulty-to-world mapping is authoritative. Easy uses Meadow Pals
with Bouncy, timber, broadleaf trees and meadow grass. Medium uses Dino Pals
with Chompy, ferns, egg and fossil landmarks, warm cliffs and thatched kits.
Hard uses Moonwood with Pip, pines, stars, mushrooms, lanterns and glowing
windows. Island selection remains independent of that mapping.

The current visual rebuild uses original retained grass, soil, stone, plank and
shingle albedos on bevelled, instanced live geometry. The cottage has a stone
footing, timber corners, framed windows, a fitted door and shingled slopes.
Garden foliage grows from the existing saved state; the live derived stream
owns its ripple and foam geometry. Each theme has a separately authored distant
alpha horizon. These are depth layers behind editable terrain, rather than an
image of a complete game. The original PNG sources, exact prompts, source/runtime
hashes, dimensions and alpha checks are retained in
`source-art/arcade/physical-worlds/burrow-builders/manifest.json`.
Detailed tree sprites reuse original Meadow, Dino and Moonwood art from the
Rally scenery bank. Each complete tree crop, actual transparent pixels and
cross-manifest source hash is recorded in Burrow's manifest. The fixed cottage,
reading-reference trees and boundary scenery remain. Decorative cranes and
wheeled carts were removed from the child clearing, paths reduced to crossing
approaches, and grass/flower dressing kept on the outer rim. The cottage and
specialized construction geometry are merged by shared material to reduce draw
calls. A three-by-three physical workbench keeps all equally styled grapheme
bricks clear of the opening building space.

The shared Pal art API supplies the canonical character's directional animation.
The builder carries an actual selected piece attached to its hand socket. The
camera follows the builder during ordinary construction and remains fixed for
literal spatial reading. The world fills the viewport behind floating blue/white
picture/audio, island and construction controls. The opening asks one short
action, "Listen. Pick each sound.", with a compact kit counter. Redundant initial
feedback and material/shelter/island status are omitted; real wrong, correct,
recovery and save feedback remains visible. Texture load failure retains
material fallbacks and the same saved construction; diagnostics expose actual
texture and Pal-art delivery separately from learning cue delivery.

The user rejected the earlier primitive renderer's visual fidelity. The current
authored rebuild has been reviewed in actual Three and Canvas frames against the
approved concept: plush canonical heroes, detailed foliage, textured editable
terrain and shelter, an inhabited worksite and flowing water. The retained
verification below exercises the complete rebuilt game; generated assets alone
do not establish that result.

Use arrows or WASD to walk, E/Space to place, Backspace to pick up and Q to
turn a piece. Held touch controls support the same walking actions and release
on pointer-up, cancellation, lost capture, blur, pause and page hiding. Camera
changes preserve screen-relative movement and billboard the visible glyphs.
Native workbench actions perform the same construction/learning action as
selecting the physical world brick.

The overhead build view provides named cells and independent row/column
selectors. Primary actions and exposed native cell targets retain the 56px
floor and spacing. Roomy tablet motor controls are 72px or larger. On small
screens secondary rotation, undo and camera tools remain in the piece drawer.
There is one visible Pieces button on every viewport. Choosing a part closes
the drawer and returns the child to the island. Rotate, undo, camera tools and
material counts remain available there; islands and unfinished blueprints retain
their own drawer. Essential
walking, audio, response, Place and Pick up controls retain their native target
sizes.
GPU failure, context loss, or the shared frame budget reaching its final 2D tier switches to an authored isometric Canvas renderer in `burrowBuildersCanvasWorld.js`. It projects the same bounded terrain, every saved piece and growth/flow/shelter effect, supplies, cottage, original tree/horizon art and shared directional Pal. Tight cached object layers are composed into two depth banks around the character, preserving occlusion as the guide walks behind real structures. The banks repaint only after an edit/growth beat or a crossed object-depth boundary; steady play submits a handful of image layers while retaining every editable piece. Reading-place labels remain in front of canopies at their truthful world positions. Physical grapheme and cell hit regions call the existing controller; the named overhead construction view remains optional. Walking, curriculum, learning evidence, undo and saves retain their existing ownership. Reduced motion removes rain and decorative
character motion, retaining the same action and feedback rules.

## Evidence, ownership and recovery

The existing scoped `learn_games.games['burrow-builders'].practiceSession`
stores bounded world maps, the current blueprint and its response history. It
adds no child identifier, separate storage prefix, service or destination.
Strict validation rejects invalid positions, duplicate blocks, excessive undo,
invalid growth, wrong content/seed/outing, forged response correctness and
completions without their accepted units. Completed world maps can carry into
a new seed; evidence cannot. Shared reset/export/deletion owns the same record,
and shared cloud sanitization strips the mutable practice session.

First response, repair and completion are separate records. Actual word-audio
and picture delivery are frozen at each encoding response. A missing or pending
picture cannot produce independent picture/audio credit, even when audio has
played. Missing audio, sound off, early answers, contrast feedback and partial
help remain supported practice. Model delivery never retroactively changes an
earlier response. Initial checkpoint zero retains the first encounter's seed
and choice order before any response; reload retains wrong attempts and a held
correct prefix. Completion is practice, never a formal assessment or mastery
claim.

Failed local saves keep the live island and require an explicit save retry.
Pause and page hiding stop foreground movement, growth, audio and automatic
learning advancement; returning resumes the owned recording/feedback beat.
Undo and dismantling recover the guide to a safe cell if their supporting
structure disappears. A build cannot eliminate the last safe standing place.

Actual placement, pickup, undo/recovery, accepted graphemes, crafted kits,
reading contrast and final completion use the existing local `gameSfx`
recordings. Spoken teaching owns priority: the engine cancels action sounds
before a word cue and suppresses new effects while that owned cue is pending.
Sound-off, pause, page hiding, blueprint changes, Free Build and unmount retain
the same cancellation boundaries. Sound request counters are diagnostics;
the named browser proof records actual media-play receipts separately and
does not claim human listening.

## Named verification

- `tests/unit/burrowBuildersRules.test.js`: content/media, deterministic
  choices, correct prefix, supported evidence, crossings, gates, finite
  construction, undo, water flow, growth and roof shelter.
- `tests/unit/burrowBuildersCanvasWorld.test.js`: fixed-camera literal spatial landmark projection and finite projection of every selectable cell across all camera/viewport combinations.
- `tests/unit/burrowBuildersSession.test.js`: scoped retention, fresh world
  carryover, malformed state, failed saves and creative completion. The previous
  32-piece prefab-sized structure, gathered receipts, held prefix and response
  evidence survive load/save and a new outing unchanged.
- `tests/release/burrow-builders.spec.js`: responsive rendered controls,
  keyboard/touch input, complete outings at every difficulty, immediate Free
  Build, water/garden/shelter effects, themes, reload, pause, failed assets,
  context loss and failed-save recovery. This suite retains easy/medium/hard
  GL screenshots, real rendered-frame timing, dispatched-key state response
  and next-frame timing, and an unmuted delivered-cue first-response record.
- Engine diagnostics contain only a bounded recent timing sample and rendered
  draw calls; they do not select curriculum answers or modify learning state.
  A 150-piece validated saved sculpture is restored and edited through native
  controls while retaining texture counts and the same frame/input measurements.
- The release suite also checks all six literal reading plans at wide, short
  landscape and phone dimensions. It records actual projected marker centres,
  their equal radii and the cue/status/rack/control rectangles, verifies that
  no visible UI overlaps any candidate, and retains the corresponding frames.
  Each equally styled number plaque has a 24px visual floor and at least 13px
  digits; the GL texture uses a 26px plaque to preserve that type size. Native
  response buttons remain separate, equally styled 56px controls.
- A short-landscape coverage gate captures all three builders in both Three and
  Canvas, at opening and after native movement. Actual authored sprite crops
  must clear the picture cue, feedback and native controls. The short encoding
  camera frames the full character below the cue; secondary feedback occupies
  the left bank and the physical workbench remains accessible. This repair
  preserves the fixed spatial-reading camera and all saved world coordinates.

Wood and cream materials are pooled lazily within each rendered world rebuild; placed timber, the house, supply piles and workbench share their engine-owned albedos. Decoded original images and GPU textures have engine lifetime, so a placement does not upload the large art bank again. The canonical Pal and its action textures remain attached to the engine while world geometry is rebuilt.
Ordinary wood/stone cubes and stone marks are instanced with their exact saved
position and rotation; instance hit testing still selects that editable cell.
The placement ghost clones material opacity while retaining the owned texture,
so ordinary structures stay opaque. Rebuilding the world detaches retained asset maps before disposing geometry and materials. Closing or switching renderer releases those GPU maps once; Canvas closes its tight cached layers and its owned decoded images. The shared Pal decoder retains its separately owned image cache.

The shared frame-budget policy samples actual foreground animation-frame
intervals to lower rendering quality after sustained delay. CPU submission
cost is recorded separately. Software renderers start at the shared low tier,
without the expensive shadow pass, with a composed contact shadow and modest
desktop pixel-density reduction. This changes neither retained structure nor
semantic controls. The authored Canvas path uses the same bounded 0.8 desktop
raster ratio when the actual GL adapter identified a software renderer; its
logical projections and native targets retain their CSS dimensions. Short
landscape reading docks the cue and secondary feedback on the left, keeping
the three truthful world markers between the controls instead of shrinking
the island to clear a wide caption. Diagnostics record quality, software detection, pixel ratio,
draw calls, textures, geometry counts and separate samples after the first
180 warmup frames; the previous GL transition and actual piece count remain in read-only diagnostics. The motor simulation uses a bounded 1/60-second accumulator independent of rendering. A dispatched key's state response and next-frame delay are
measured separately from any physical display latency.

Browser emulation and rendered checks are distinct from physical iPad,
classroom observation and listening review. Current release evidence must name
the executed revision and retained report; this document does not establish
those observations by itself.

## Retained earlier authored-world verification — 4 October 2026

The final owner suite passed **26/26**, scoped rules/session/projection tests
passed **23/23**, and scoped ESLint passed. Runtime, shared actor/chrome and test
hashes were unchanged throughout the browser run. The retained identity is
`.artifacts/burrow-builders/production-source-revision.json`; the complete
Playwright report is `.artifacts/burrow-builders/production-browser/report.json`.
Its `results` directory contains all three complete six-blueprint outings,
eighteen actual reading-plan frames and marker/HUD rectangles, all twelve short
Three/Canvas opening/carry frames with authored Pal bounds, real sound-play
receipts, delivered first-response evidence, failed-image/audio handling,
held-prefix reload, free building, save recovery and context loss.

The valid 150-piece saved sculpture retained every piece and remained editable.
After 180 warmup frames, the actual software-adapter path selected authored
Canvas at a 0.8 desktop raster ratio. It submitted five image layers using two
cached depth banks: mean frame interval **16.680ms**, p95 **17.6ms**, native state
response **1ms**, and next animation frame **18.5ms**. Placement and undo retained
one art-bank load and returned to the same 150-piece world; the resulting mean
was **17.097ms**, p95 **18.3ms**. These meet the existing 42ms mean-frame and 90ms
input/next-frame gates without removing structure or changing the gate.
The exact measurements are retained under
`production-browser/results/release-burrow-builders-a--24650--and-bounded-world-textures-desktop/substantial-build-frame-input.json`.

This is local Headless Chromium evidence on the development Mac. It does not
claim a physical iPad test, human listening, classroom observation, hosted
progress verification or deployment. The shared catalogue/completion/cloud
sanitizer and whole-project release gates belong to the parent workstream.
The source/runtime asset manifest records the final art review and this proof.
Scoped cleanup is recorded in `.artifacts/burrow-builders/cleanup.json`;
original source art, actual frames and passing reports remain intact.

## Clear-start verification — 4 October 2026

The full owner suite passed **26/26** after the quieter start and Pieces drawer
changes, with **24/24** scoped rules/session/projection unit checks and scoped
ESLint passing. The executed runtime, shared actor/chrome, preview and release
test identities were unchanged throughout the run, recorded in
`.artifacts/burrow-builders/clear-start-final-source-revision.json` and verified
in `clear-start-final-verification.json`. The raw passing report is
`.artifacts/burrow-builders/clear-start-final-browser/report.json`.

This run exercises five native viewport layouts, all three six-kit outings,
immediate free building, all three themes in Three and Canvas, twelve actual
short opening/carry frames with Pal/HUD bounds, all six Hard plans at wide,
short and phone dimensions, placement/removal/rotation/undo through the Pieces
drawer, growth/water/shelter effects, held-prefix save/resume, actual sound-play
receipts, failed-image/audio/save handling, pause and context loss. The complete
150-piece saved sculpture was retained and edited: after 180 warmup frames the
authored Canvas path at 0.8 raster ratio submitted five draws through two depth
banks, with **16.666ms** mean frame interval, **16.8ms** p95, **1.1ms** native
state response and **13.3ms** next frame. Placement and undo retained all 150
pieces and one art-bank load; the resulting mean was **17.054ms**, p95
**18.2ms**. The unchanged gates remain 42ms mean and 90ms input/next frame.
Exact measurements are in
`clear-start-final-browser/results/release-burrow-builders-a--24650--and-bounded-world-textures-desktop/substantial-build-frame-input.json`.

Actual earlier-density frames and their source/provenance are retained in
`.artifacts/burrow-builders/clear-start-before/`; their wide frames use the River
island and their Hard short opening uses Free Build, as recorded rather than
presented as identical encounters. Fresh desktop, tablet and phone openings are
in the passing report's `results` directory. The parent directly reviewed those
clearings and the Dino/Moonwood Canvas frames. No art pixels were changed.

The first complete clearing run passed 25/26: redundant initial feedback
overlapped the Pal's short Canvas crop. That actual failure report remains
unmodified at `.artifacts/burrow-builders/clear-start-browser/report.json`.
Removing only the redundant opening feedback repaired the overlap; the current
full 26/26 run preserves the same coverage assertion and real event feedback.

The separate bounded preview review scope `?review=clear-start` starts the new
clearing without replacing a previous default review island. Native review proof
is retained in `.artifacts/burrow-builders/clear-start-review-proof/`: a validated
32-piece construction, gathered receipts and coordinates survive unchanged in
the default scope, while the review starts with three bridge pieces and zero
learning responses; an ordinary native placement persists a fourth piece only
in that scope. No curriculum answers or evidence were injected. The proof
script is `clear-start-review-proof.mjs` next to that directory. This short proof
was recaptured after the parent aligned only the shared chrome's colours with
the existing approved blue/white/ink palette. Engine, actor, geometry, selectors
and native button sizes were unchanged. Its separate source identity is
`clear-start-review-source-revision.json`; the earlier full-suite identity is
retained rather than retroactively updated.

These are local Headless Chromium observations, with physical-device, human
listening, classroom, hosted progress and deployment checks remaining distinct.
Shared catalogue/input/completion verification belongs to the parent workstream.

## Shared Tools focus follow-up — 4 October 2026

After the retained owner outing proof, the parent integration check found
resume taking focus from the host playfield. The resume action now preserves
focus already inside its host main while retaining standalone root focus.
The unchanged shared Tools test passed its focus trap, Escape return without
a quit dialog, real ArrowRight movement and paused sound toggle. The all-Arcade
gesture gate also passed. Exact follow-up proof is retained in
`.artifacts/physical-arcade-build/builder-host-focus-final.log`; the original
26-case source identity remains unchanged historical evidence. No construction,
artwork, learning or storage rule changes in this follow-up.
