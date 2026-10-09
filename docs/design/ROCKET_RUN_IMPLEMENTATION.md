# Rocket Run

## Current game

The product owner's 9 October 2026 direction restores the original three-lane
rocket style. The live registry imports `RocketRunGame.jsx`: steering into a
word makes the onset choice, with no separate Catch action. Its existing
target replay, retry, round continuation, checkpoints and engine-owned
completion remain active. The catalogue restores the matching earlier header
treatment so the target replay remains unobscured. The courier-flight replacement is outside the live
registry; its retained sources and checks below are production provenance,
not the current gameplay specification.

`arcadeRenderBudget.js` owns the shared backing-pixel ceiling. Apple touch
devices, including desktop-identifying iPad Safari, start with direct rendering,
one backing pixel per CSS pixel and no shadow/post-processing passes. Source
art, lane coordinates, word/audio pacing and scoring are independent of this
graphics choice. Browser checks are separate from physical-device evidence.

Current checks include `rocket-run-audio-replay.spec.js`,
`arcade-ipad-performance.spec.js`, `rocketRunRounds.test.js` and
`arcadeRenderBudget.test.js`.

## Courier production provenance

The retained authored leaf was exercised through an isolated alias of the real
GamePlayer. All three ten-sector outings and all nine itineraries have passed
ordinary native play, Continue and Replay. The live wrapper remains legacy:
Root's integration gates must close before Root admits and releases the new
leaf. Current desktop timing evidence is recorded with its limits below.
Compact presentation, genuine
Next, cancellation, context recovery, asset/audio recovery and quota recovery
now have separate current native proofs below.

## Learning and physical play

The construct is `heard-onset-print-word-selection`, with the canonical
`rocket-run-v2` version. A child reads approaching printed words, steers the
spacecraft and deliberately selects a currently readable courier with Catch or
its native key. Only the first real swept receiver contact with that exact
selected carrier can create a language row. Default-lane catches, another
carrier's interception, an unselected passage, boost, meteor damage and motor
Retry cannot create a correct or wrong reading response.

The ten seeded rounds retain their true correct-word denominators and fixed
trial identities. Missed required words return with a new physical flight
identity and explicit motor support. Wrong-onset responses preserve the selected
word, fixed choices, first response and assisted retry; recorded feedback names
the actual onset. The local v2 bank excludes queen and quilt as negative
distractors for heard /k/, without changing global banks or correct counts.

The visible target grapheme and printed words are legitimate reading stimuli.
They are not described as independent spelling or hidden-word encoding. Actual
matching recorded phoneme `onEnd` receipts, plus any actual incoming word
start/end model, are attached to immutable response context. Requested playback
and file coverage do not prove delivery. Optional missing word names remain
unavailable; no browser TTS is substituted. Practice, formal-assessment,
mastery and motor-evidence flags remain respectively true, false, false, false.

Movement is a continuous three-lane, critically damped flight with a 1/120 motor
step and foreground clock. The authored receiver has radius .34 and collision
depth .24. Wider wings and thrusters do not select words. Meteors use the same
travelled distance, three finite lives and brief visible immunity. Retry keeps
the current task, language history and accepted words. Pause, ownership expiry
and input cancellation clear the pending Catch.

## Authored production

Easy uses Bouncy in the Millstar Express, Medium Chompy in the Fossil Flyer,
and Hard Pip in the Lantern Skipper. The three source recipes retain individual
canonical pilot surfaces and character bones from frozen original editable
models. Kart meshes, vehicle bones and racing clips are excluded. New hulls,
yokes, foot docks, thrusters and visible reading receivers are authored here.

Seven original actions are cruise, left/right bank, boost, shield recovery,
catch and celebration. The final genuine catch retains its follow-through
before celebration. Each source palm and sole is evaluated against the actual
moving support, with an unchanged 1e-5 contact gate. Intentional finale release
of the left hand is separately declared. The left arm keeps its canonical
forward chest–upper-arm–forearm–hand hierarchy under unit-scale ancestry. Its
whole celebration path is anatomically reachable at the original segment
lengths, with a stable bend-plane twist and hemisphere-continuous equivalent
quaternion keys. Neither raw vertices, UVs, numeric weights nor original
materials change. The source and actual exported GLB gate also measure the
original shoulder-to-torso attachment, alongside all eight limb joins and
four supported contacts.

The primary runtime is a real skinned GLB. Delivered authored Canvas banks use
the same actual seven action clips, measured common-camera receiver anchor,
true alpha and exact original pixels: 42 primary poses, 21 network-independent
poses and one independent idle per world. Full RGBA parity includes transparent
RGB and empty cells; decoded action owners remain within 16 MiB per world.
Primary, independently delivered idle and network-independent action views are
distinct delivery facts. The
three retained original empty-space illustrations contain no hero, target
words, lanes or HUD. The actual scene composes seven original registered
courier/scenery roles per world, hazards and printed labels on the shared
physical projection.

The world exposes cloned, read-only actor, receiver, evaluated contact,
delivery and bounded frame/input snapshots. Context loss pauses actual flight;
a decoded surviving scene and explicit Continue are required for recovery.
Resize repaints frozen state. Source texture decode ownership, leased skins,
material/geometry disposal and late-unmount cancellation have separate gates.

## Reproducing the accepted Meadow source candidate

The visible celebration wave is authored in
`artwork/games/rocket-run/rocket_flight_spec.py`, in
`celebration_free_wrist()`. Its free wrist follows
`(-.64 + leftWave, -.45, 1.84 + .055 * sin(pi * phase))`. The earlier, visibly
occluded candidate used an X base of `-.53`; its source and actual twelve
renders remain regression evidence. The accepted X change is in the retained
authoring file, with no temporary script patch or runtime override. Duration,
release phases, the other six curves, camera, canonical surfaces and strict
contact/attachment gates remain unchanged.

Run the commands below from the project root with a fresh output directory.
`ROCKET_CANONICAL_ROOT` must contain the original
`source-art/arcade/sound-racer-3d/bouncy-kart-v2.blend` with SHA-256
`af3e55c1b7bcbf9ba3919cdbac61764855fe730879142c3d13f7c134ff42bf84`.
The exporter verifies that input before using the pilot's original mesh,
materials, UVs and numeric skin weights. It does not run or alter the racing
generator.

```sh
ROCKET_OUTPUT_ROOT=/absolute/path/to/fresh-rocket-output
ROCKET_CANONICAL_ROOT=/absolute/path/to/canonical-source-checkout

/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 \
  --python artwork/games/rocket-run/build_rocket_craft.py -- "$ROCKET_OUTPUT_ROOT" \
  --world meadow --input-root "$ROCKET_CANONICAL_ROOT" --bake-substeps 1 --no-render

node artwork/games/rocket-run/verify_rocket_craft_contacts.mjs \
  "$ROCKET_OUTPUT_ROOT/public/game-assets/rocket-run/models/bouncy-spacecraft-v1.glb" \
  "$ROCKET_OUTPUT_ROOT/source-art/arcade/rocket-run/bouncy-spacecraft-v1.json" \
  "$ROCKET_OUTPUT_ROOT/actual-glb-motion.json"

/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 \
  --python artwork/games/rocket-run/render_rocket_craft_actions.py -- "$ROCKET_OUTPUT_ROOT" \
  --world meadow --size 256

python3 artwork/games/rocket-run/compile_rocket_flight_art.py \
  "$ROCKET_OUTPUT_ROOT" --world meadow
```

The renderer's default selects all seven real clips and six actual source
frames per clip, producing the complete 42-view bank with one measured camera.
The lossless compiler produces the primary atlas, independent idle view and
21-view emergency atlas from those originals. It verifies alpha and visible
RGB pixel parity without resizing or repainting. A finite batch may explicitly
select `--clips cruise,celebrate`, then
`--clips bank_left,bank_right,boost,shield_recover,catch`; retained originals may
join only when source-model hash, camera and canvas registration are identical.
The owned authoring files, original canonical input and source deliveries are
the reproducibility authority and must join the final scoped source inventory;
ignored orchestration logs are evidence of the actual bounded runs. This
unfinished Rocket source has not yet been committed or published.

The complete Meadow source and lossless delivery have been admitted to the 50
named source/model paths: three verified model replacements and 47 additions.
Original model recovery and accepted source-review evidence remain intact.
The runtime wrapper, menu registry, generated bank and other worlds did not
change. Focused source/lifecycle checks and continuous evaluation of the actual
exported GLB passed, but authored route props, the two other worlds and native
fallback/full-game acceptance remain open.

## Retained earlier evidence

The attempt-specific states below preserve the original failures, source
diagnosis and staged provenance. Their pending/admission descriptions apply to
those earlier attempts; the current all-world native proof follows afterward.

The unchanged legacy baseline was retained in two ignored runs. The first
failed only because its Hear observer used a stale dynamic accessible name;
the corrected actual selector passed in 7.937 seconds under an attached
60-second bound. Both contexts and all browsers closed; its 377-path graph
remained byte-exact. This is mixed-workload functional baseline evidence, with
numeric legacy motion and teaching-end delivery unobserved.

Focused source gates passed 62 Node tests, 12 Python checks and scoped lint.
An added evaluated-bone observer then passed 15 affected Node gates after
correcting a test fixture to Three's actual sanitized node-name convention.
These are source/lifecycle gates, not native graphics acceptance.

The first Easy export failed its strict bank-left/frame-2 left-grip contact
gate before producing any output. The log, exact three input fingerprints and
failure interpretation remain retained. Blender's default process exit was
zero despite its Python exception; the enclosing guard correctly failed on
missing outputs. The corrected exporter uses `--python-exit-code 1` as well as
requiring all three actual output files.

The corrected first Easy no-render export passed in 1.892 seconds under a
120-second guard. Its original inputs were unchanged. The GLB is 1,731,772
bytes, contains seven original clips, 25 semantic joints, 17 meshes/materials
and one texture. All 294 source frames were evaluated, with 1,122 supported
contact samples and maximum separation 7.416e-7. Fifty-four explicitly released
left-hand samples occur only during the finale. No native likeness, GLB grip,
small-screen composition or finished-world claim follows from these facts.

The ignored first-craft review imports the actual owned presentation and
existing GamePlayer, selecting it only in that review page's in-memory
registry. It leaves the shared registry and legacy wrapper unchanged. It uses
the first actual GLB and original Easy sky; encoded fallback banks and the
other worlds are absent and unverified. The actual first pilot failed in
33.092 seconds under an attached unexpired 90-second guard, with all browser
contexts closed, zero page errors and all 396 frozen paths unchanged. Bouncy's
curl coat, red scarf, craft and original sky read clearly in the directly viewed
opening. The ordinary Right action then exposed the absent Canvas actor after
the current quality policy adapted from Three to Canvas. The scene correctly
stopped motor play instead of creating language responses with missing art;
no genuine catch occurred. This is an actual visible incomplete recovery path.
The ivory station/courier primitives also remain below the requested art standard.

In that historical first pilot, the target `/audio/phonemes/c.mp3` reached its actual teaching end callback.
The approaching sock model reached a real start, but a matching incoming-word
end was not observed. Its original audit had 457 of the possible
476 word-name recordings, with 19 unavailable. Those gaps can affect
near-courier speech, not only optional post-response feedback. File coverage,
printed choices and a target-phoneme end cannot close the spatial incoming-word
utterance requirement. No paid recording or fabricated speech is used.

Native bank contact separation reached 7.19e-4. An additional actual GLB buffer
evaluation found larger supported contact drift, including key times, and an
incorrect finale reconnection interval. The old source's integer-frame contact
pass therefore does not establish continuous source/exported/native contact.
The first eight-second diagnosis guard retained its exact expiry: 14 Python
checks and JS syntax passed, the new gate's missing Node-global imports failed
lint, and the actual old GLB failed the unchanged 1e-5 contact gate. The old
Blender source opened, but the remaining time was insufficient for its complete
subframe walk, so no old-source subframe result is claimed. All original outputs
were fingerprinted before/after and retained unchanged for this active QC.

The failed reversed-chain density 1/2/4/8 candidates and their exact source
bytes remain separate QC evidence. Merely checking wrists and elbows initially
missed an opening at the original shoulder attachment. Quaternion sign
continuity corrected a large interpolation flip; preserving the canonical
forward chain and its stable anatomical twist closed the remaining attachment
drift. The original recently authored celebration wrist path was outside the
natural arm reach. Its replacement is an explicit friendly three-cycle wave
near the shoulder, rather than a per-frame clamp, hidden stretch or removal of
the gesture. Duration, release envelope, right grip, stance, soles and the other
six flight curves remain unchanged.

The corrected density-1 source candidate passed all seven clips in 4.040 seconds:
294 authored keys and 1,435 genuine subframes, 6,587 supported contacts, 13,832
limb-join samples and 3,458 actual shoulder observations. Contact, join and
shoulder maxima were respectively 3.6172e-6, 1.1802e-6 and 7.6390e-7, all below
the unchanged 1e-5 gate. The canonical raw surface fingerprints stayed exact.

The subsequent staged no-render export and actual GLB binary validation passed
in 4.978 seconds under an unexpired 120-second process-group guard. It evaluated
1,729 actual exported poses, 6,585 supported contacts, 13,832 limb joins and
3,458 shoulder samples across seven clips. Their maxima were 3.6575e-6,
1.1642e-6 and 7.5650e-7, with zero failed samples. All Float32 tracks are finite,
start at zero and retain actual durations. The staged GLB is 1,718,076 bytes,
below the existing 6 MiB model budget. Its editable source, metadata and GLB are
retained in `.artifacts/arcade-standard-upgrade/rocket-first-craft-export-v3`.
The active old files are still unchanged: staged validation does not promote
the new model or establish rendered anatomy, fallback or full-game acceptance.

The current v2-only recorded-slot repair preserves ordinals, booleans and true
denominators while replacing the nineteen unavailable incoming names with
unused reviewed same-onset recorded words. Equal lengths are preferred within
the existing difficulty bands. Six approved capacity additions (`added`, `ink`,
`inside`, `mother`, `otter`, `voice`) use existing committed recordings. Shared
legacy/global banks remain unchanged. The current resolver audit covers all
27 targets across all three bands: 462 possible incoming labels resolve to 462
shipped recordings, with zero gaps. This replaces the historical 476/457 file
count; it does not prove actual near-position start/end delivery or listening.

The fallback renderer rendered finite original-source batches
using one camera measured over all 42 intended poses. Registration refuses to
mix different model hashes, cameras or duplicate poses, and the compiler
rejects an incomplete seven-action bank. Full-size true-alpha primary,
independent idle and original-phase emergency banks total 16 MiB of decoded
base pixels per world before venue images. All three complete banks and the
seven props per world were subsequently delivered and exercised in the native
proofs below; these earlier source-candidate notes remain provenance.

## Current full native proof — 6 October 2026

Visible default Chromium 148 on ARM64 reported ANGLE Metal Apple M4. These are
functional runs under mixed workloads, not quiet performance or physical-iPad
evidence. Each run used the actual GamePlayer-generated seed, normal tempo,
trusted pointer controls and unchanged first physical-contact authority.

| World | Actual seed | Required/caught | First responses / assisted retries | Motor Retry | Foreground play |
| --- | --- | --- | --- | --- | --- |
| Meadow | 3867008163 | 50 / 50 | 50 / 2 | 4 | 446.348 s |
| Dino | 2982800941 | 90 / 90 | 90 / 2 | 5 | 642.401 s |
| Moonwood | 1607858552 | 114 / 114 | 114 / 2 | 8 | 768.443 s |

The true denominator comes from each seeded unique-word bank; a nominal maximum
is not a reason to invent extra words or remove requirements. Every outing
completed ten sectors, deliberately retained two wrong responses, saved a
genuine held prefix, continued with the same seed/IDs/history, stored immutable
completion and replayed with a fresh seed and empty history. All three themed
itineraries per world visibly passed planet approach, asteroid corridor,
station fly-through and comet-side passage. Source identities were respectively
806, 809 and 815 exact paths before/after; all browsers, video contexts and
process groups closed before their 900-second guards expired.

The actual target-phoneme ends were 18/17/20, and approaching-word ends were
122/222/259. They are real playback-end receipts, not listening claims. Hard's
actual `inside` and `added` catches retained both matching target ends and word
ends at visible/readable approaching couriers, with positive time to contact.
The immutable rows are retained with the original full report.

The compact source index is
`.artifacts/arcade-standard-upgrade/rocket-full-current-proof-index.json`.
Full reports, native WebMs, stage frames, actual stage-nine storage states,
completion records and delivered Replay frames remain in
`rocket-full-easy-native-v3`, `rocket-full-medium-native-v1` and
`rocket-full-hard-native-v2` under the same ignored evidence root. Earlier
startup/fixture failures remain separate. Hard's ignored driver only added a
durable post-assertion report before video teardown; it changed no game rule,
wait, guard, quality or clock.

After those full runs closed, two owned presentation fixes made route-only
image failure expose Reload art and made short-screen Catch display the actual
caught/needed count alongside lives. The 104-pixel short Catch retains the
56-pixel control floor and 8-pixel gaps without changing projection, physics,
audio or vocabulary. Eleven actual presentation/completion/geometry cases and
scoped lint passed in 1.361 seconds. Two test-host omissions were corrected and
retained as fixture failures. The separate current proofs below close compact
pixels and actual route-failure Reload. Historical full runs retain their exact
source identities.

## Current presentation, lifecycle and recovery proof

Every entry below used default visible Chromium 148/ARM64, ordinary controls,
the actual GamePlayer seed and unchanged physical-contact authority. These
functional runs are not quiet profiling or physical-device evidence. Each
bounded runner joined its worker, closed all contexts/browser/process groups
and confirmed frozen inputs before/after. The evidence folders are under
`.artifacts/arcade-standard-upgrade/`.

| Current proof | Result / bound | Actual behavior |
| --- | --- | --- |
| `rocket-compact-route-recovery-native-v3` | PASS 95.780 / 180 s | All three themes at 320×568, 320×340, 568×320 and 568×260; real wrong/correct history, Tools, route primary plus embedded failure and Reload. |
| `rocket-next-trail-native-v1` | PASS 92.121 / 180 s | Genuine Hard stage-nine prefix, twelve catches to 114, immutable completion and literal Next with a new actual seed. Its original short completion overlap was retained and repaired below. |
| `rocket-current-finish-native-v1` | PASS 52.443 / 180 s | Genuine Easy stage-nine prefix, five catches to 50, compact ending at 568×260/320×340 clear of Pause/Tools/Exit, literal Next. |
| `rocket-current-exit-native-v2` | PASS 15.922 / 180 s | Actual response, native Exit, disposed read-only facade, no engine/canvas or resurrected ownership. |
| `rocket-current-context-native-v3` | PASS 8.982 / 180 s | Real WebGL context loss, full Canvas, reachable Continue with preserved response and updated coach, actual GL restore, Tools/input/resize and passive zero RAF/listener/audio owners after Exit. |
| `rocket-remaining-dino-fault-native-v2` | PASS 12.903 / 180 s | Selected module import fails; first explicit JSON retry also fails; the next literal Reload delivers identical full records with unchanged actual seed. Separate model/action primary failure uses the complete emergency action bank, catches a real word, then reloads without rewriting history. |
| `rocket-remaining-hard-fault-native-v2` | PASS 9.427 / 180 s | Model and both full action sources genuinely fail. Independent idle remains recognisable and explicitly nonplayable; Catch creates no intent or language row. Literal Reload restores complete Pip actions and a real recorded-cue catch. |
| `rocket-remaining-audio-quota-native-v3` | PASS 24.834 / 180 s | Actual target Howler loaderror and no end; a real first answer retains a null audio receipt. Hear produces a real end without rewriting that answer. Genuine browser quota exposes Retry saving; removing only recorded fixture filler keys and native Save restores exact seed/history. |

Original compact line-box failures, the disposed-facade observer mismatch,
cached ES-module retry failure, and transient `lastEvent` audio-observer failure
remain separate required regression evidence. Corrected observers use the real
disposed status or actual Howler emissions; no game clock, collision, audio-end
or touch/label threshold was lowered.

The selected metadata owner aborts superseded/exit requests. A healthy selected
world still loads its lazy module alone. Only after a genuine import failure and
child-requested Reload does it fetch its exact independent JSON packet. All
three generated packets deep-match the full module records, including 42/21
poses, original contacts, seven props and source URLs; retry errors remain
retryable. The three HTTP-only recovery packets total 4,485,569 bytes and are
never fetched by the healthy path. Generated modules parse the exact JSON text
to retain all IEEE values without lossy printed number literals; before/after
all-record parity and recovery packet byte identity passed.

Final focused source checks passed 120 Node cases, 27 Python cases and whole
owned lint in 2.433 seconds under a 60-second bound. The preceding generated
numeric-literal lint failure is retained alongside the serialization correction.
Twelve route and nine runtime anatomy/packet Python cases also passed separately.
Scoped cleanup removed fourteen reproducible Python caches (257,506 bytes),
with hashes and reference decisions in `rocket-cleanup-current-v1/ledger.json`.
Original art, editable sources, failed strict anatomy/contact reports, native
videos and corrected visual proof remain required provenance/QC.

## Current timing and reduced-motion evidence

The current production guide requires profiling the actual game, complete
quality paths and explicit resource ownership. It specifies no 27-second
desktop sample or desktop FPS gate. No physical-device threshold is inferred
from these Mac measurements.

The exclusive current `rocket-current-quiet-native-v1` run preserved a genuine
Easy active interval: 1,625 callback-frame samples averaged 16.668 ms, p95
18.8 ms and maximum 20.9 ms. Twenty-five trusted key-to-next-rendered-frame
samples averaged 9.62 ms, p95 14.9 ms and maximum 16.3 ms. Its Medium portion
lost its final shield; the original survival assertion failed before its
independent raw interval was written. That overall failure remains intact. The
captured Medium engine aggregate had 1,800 frame samples averaging 16.6665 ms,
p95 18.6 ms, and ten input samples averaging 11.73 ms. Those rolling samples
are not a newly proved active 27-second Medium interval.

The narrower `rocket-current-quiet-native-v3` passed in 42.917 seconds under its
180-second guard, with all 860 inputs exact and zero remaining browser/context
owners. It restored that genuine zero-life Medium capture through the production
session validator/serializer, then exercised native Retry and active steering
with the same seed, queued identities and immutable response prefix. It did
not repeat the Medium interval. Hard's previously unrun 27.0934-second interval
started with one heart and stopped after 374.3 ms. Its 22 observed active frames
averaged 17.014 ms, p95 18.3 ms; 1,603 stopped frames averaged 16.662 ms, p95
19.3 ms. Only two active input samples existed. This proves the recorded
stop/Retry behavior and bounded timing, not sustained active Hard profiling.
The actual Retry-button boundary follows the normal HUD notification delay.

The retained 768.443-second Hard outing supplies the separate actual long-play
evidence: every completed sector has a 1,800-sample rolling renderer aggregate.
At completed sector nine the mean was 16.982 ms, p95 18.7 ms and maximum 35.3
ms; the retained 120-input aggregate averaged 6.436 ms, p95 13.7 ms and maximum
16.3 ms. These are functional mixed-workload aggregates, may include real
stop/Retry or reward portions and overlap one another; they are not independent
quiet windows. The full run made 114 real catches and eight native motor
Retries. Its renderer, art/model bytes, pose, geometry, motion, collision and
audio authorities match the current sources. Current engine code differs only
by the repaired context-resume coach; removing that literal reproduces the
historical engine SHA. Generated-record serialization preserves every parsed
value. The later changes to controls, completion placement and metadata
recovery have their own actual native proofs above.

The v3 320×568 body exercised the real reduced-motion preference, canonical Pip
craft, complete low-quality world, native steering/Boost and matching target
audio end without changing the response prefix. Selected delivered snapshots
show one action-image owner (11,010,048 decoded base bytes), one sky image and
texture (3,686,400 base bytes), one route texture (8,388,608 base bytes) and one
model lease. Hard's wide rich renderer recorded 31 draw calls and five textures.
These are measured selected-world owners, not total browser memory. Native
Exit left a disposed facade and closed contexts/resources.

The hash-bound checked-in owner proof is
`source-art/arcade/rocket-run/native-owner-verification-v2.json`. The generated
scene manifest records whether its reviewed inputs still match; changed future
inputs retain that proof as history rather than inheriting a native pass.

## Remaining shared admission

Root owns catalogue, bridge, metadata, integration checks and release; no new
selection is exposed by this isolation. True hidden-tab behavior remains
UNKNOWN in the owner desktop focus environment; native Exit/Tools cleanup and
shared visibility contracts remain separate facts.

Human listening, physical supported iPad and classroom results remain UNKNOWN.
Ignored source/native evidence is kept separate from release proof. Original
art, editable sources, strict contact failures and corrected proof remain
active provenance/QC inputs; disposable task material is removed only after
reference and recovery checks.
