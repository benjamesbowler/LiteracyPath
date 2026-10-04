# Rally Pals

The visual acceptance work was reopened on 3 October after the owner rejected
the primitive scenery against the approved concept. Gameplay remains intact;
the replacement painted-depth renderer is being imported and reviewed in the
actual game. The earlier checks below establish the prior mechanics and recovery
behavior, not the new art's visual quality or release readiness.

Rally Pals is a continuously controlled three-dimensional tennis outing. The
child moves the selected world’s hero independently of aim, serves, intercepts returns, drives and
lobs. A moving rival reacts to the flight. A successful learning serve begins
an ordinary rally; subsequent racket contacts create sporting play, not repeated
learning evidence. Six fresh serves complete one match, with three to five
returns per point according to the saved outing.

Difficulty selects a full canonical cast and world. Easy’s Meadow Pals features
Bouncy, the golden lamb with red scarf and spring legs, around the clubhouse,
painted village/lake/mountain layers, detailed trees, wooden furniture, pennants and flowers. Medium’s Dino Pals
uses orange Chompy with a cream bandana, prehistoric mesas, a volcano, fossil
arches and ribs, ferns and fossil stones. Hard’s Moonwood uses brown-haired
elf Pip in green, a moonlit pine forest, an observatory, telescope, lanterns,
mushrooms and constellations. Original editable court geometry, independently placed authored scenery and shared
registered plush character atlases provide the world. The approved mockup remains a style reference.

Each theme has three selectable settings, independent of difficulty and saved
outings: Meadow/Rooftop/Moonlit, Fern Club/Clifftop/Fossil Lights, and Moonwood
Garden/Observatory/Starlight. The court selector also offers three playable
modes. **Match** retains the six learning serves and normal opponent movement.
**Co-op** adds a six-return team goal, a more generous returning rival and lobs
toward the player; a motor miss resets that sport streak while preserving the
sound response. **Targets** suspends the learning serve and its selected aim,
uses a golden physical target with shot/hit counts and ordinary tennis returns,
and records no linguistic completion or additional learning evidence. Returning
to Match or Co-op restores the cue, history and child’s prior aim. Every mode
keeps independent movement, native zone aiming, broad court aiming and drive/lob.

## Learning and control contract

Easy targets initial sounds, Medium final sounds and digraphs, and Hard spoken
rime families. An unlabelled picture and an existing production recording cue
the word; its complete spelling is absent from captions, alternatives, court
textures and fallbacks. The three equally styled responses are shuffled with
the session seed and saved outing and remain stable through repair and resume.

Aim is selected with the broad court or the native zone controls. A serve Swing
records its intended linguistic lane independently of later ball contact. The
first response retains stimulus delivery and support as they actually stood at
that moment. A soft rebound names the chosen sound and permits repair without
losing a life. Two wrong linguistic attempts add the shared partial spelling
hint; motor misses never cause a hint or erase a correct sound decision.

Footwork assistance follows the incoming ball and enlarges contact tolerance;
it leaves aim and Swing entirely to the child. Held manual input overrides assistance on its axis, so assistance cannot pull against a deliberate movement. Rally Hold stops an ordinary
incoming return near contact. Both settings are independent of literacy
difficulty. New learning serves are untimed. Manual misses replay the ordinary
ball and retain linguistic progress.

When sound is off or unavailable, a visible **sound fragment** changes the
construct to supported visual grapheme matching. The whole word remains hidden.
These responses explicitly retain support and never establish independent oral
practice. A replay that later delivers audio cannot retrospectively upgrade an
earlier response or erase a delivered model.

Keyboard: arrows or WASD move; 1, 2 and 3 select shot lanes; Space swings; E
lobs. Native focused controls retain Enter/Space semantics. Tablet movement
controls are at least 72px; all primary controls retain the 56px floor and
8px gaps. Pointer release, cancellation, lost capture, blur, pause and hiding
release movement. The shared player owns pause, guide, audio and completion.

## Recovery and ownership

The existing profile-scoped `learn_games` practiceSession contains bounded
mutable state for `rally-pals`, indexed by difficulty. It retains the seed,
active point, frozen response history, support, selected court, aim, assistance,
match score, best rally, selected mode, target shots/hits and the suspended
learning aim. Scope, seed, version, cursor, response ownership and
score consistency are validated before restoring. A resumed rally begins with
a safe incoming ball while retaining its accepted learning serve.

A failed local save displays an explicit retry and holds gameplay. Completed
immutable practice evidence uses the existing shared completion writer;
`contentVersion` is the canonical `rally-pals-v1`. Match points, best rally and
motor misses occupy a separate motor evidence field. No new account, remote
service, child identifier or public leaderboard is introduced.

WebGL loss and unavailable WebGL use a live Canvas court with the same physics,
choices, movement and racket controls. Asset failures retain a supported cue,
never a caption containing the answer. Reduced motion removes ball trails and lowers the graphics tier without selecting responses or removing
physical control. A sustained measured frame budget reduces render resolution,
DPR and shadows when the initial device tier
fails its budget. The 3D court, canonical hero, world landmarks, physics, picture
and native choice controls remain. The lowered budget follows court changes.
Read-only quality diagnostics expose actual bitmap dimensions and the reason
for each reduction; startup hardware labels alone do not establish performance.
Renderer disposal removes listeners, GPU resources (including
instanced geometry) and canvas. Physics uses a 1/60-second fixed-step accumulator with at most twelve catch-up steps per frame. Pausing, hiding or a failed save resets its remainder; renders with no step retain the last movement/action state. Ball speed does not depend on the rendered frame count. The read-only preview
snapshot reports mean/p95 frame interval, render duration and input-to-frame
latency to distinguish software-renderer load from input/locator overhead.

Recorded word and contrast cues take priority over the sporting mix. Existing
learner-intensity-aware UI sounds provide brief movement onset, racket contact,
lob, point, recovery and completion feedback. Teaching playback suppresses
these effects; pause, visibility loss, sound-off and unmount cancel them. The
read-only audio-effect counters record requests rather than claiming audible
delivery.

## Authoritative files

- `src/components/learn/games/games/RallyPalsGame.jsx` and `.css`: court,
  continuous physics owner, controls, voice delivery and lifecycle.
- `src/utils/rallyPalsRules.js`: authored banks, seeded decks, evidence and
  deterministic shot/contact rules and measured scenery frame bounds.
- `src/utils/rallyPalsSession.js`: bounded scoped save/resume validation.
- `src/components/learn/games/shared/physicalArcadeWorld.js`: shared original
  canonical themed heroes, trees and material geometry.
- `tests/unit/rallyPalsRules.test.js` and `rallyPalsSession.test.js`: curriculum,
  assets, shuffle, response ownership, arcs, motor distinction and isolation.
- `tests/unit/rallyPalsArt.test.js`: all six original alpha sources, runtime
  hashes, dimensions, measured frame bounds and retained generation provenance.
- `tests/release/rally-pals-gameplay.spec.js`: full matches, wrong/repair/hint,
  responsive input, pause, modes, all themed courts, context loss, failed assets,
  save recovery and pointer cancellation.

Rendered desktop/tablet/phone browser evidence is distinct from human listening,
physical iPad, classroom and hosted learner verification. The release task
records actual check results and these boundaries; this document does not
claim unobserved proof.

## Prior-renderer local verification, 3 October 2026

The focused rules/session suite passes 9/9 and scoped ESLint passes. There are
21 distinct passed browser cases across the main run, focused repairs and
measured rendering run: complete matches at all three difficulties, wrong-first
contrast/two-attempt hint, manual motor miss, movement/aim separation, pause,
native Continue with saved court/aim, six device sizes, all three themed settings,
co-op/target practice, WebGL loss/failed assets, failed-save retry, pointer
cancellation, actual ended recorded audio and sustained rendering. The initial
browser run exposed the missing pre-answer checkpoint and an overly broad test
resource interceptor; both were corrected and their focused cases pass. A full
Easy match was repeated after the graphics adaptation change.

Normal-motion 1366×900 Chromium/SwiftShader initially missed budget. Measured
adaptation retained the live 3D world at a 560×339 bitmap with crisp DOM controls,
DPR 1 and shadows/decorative particles off. During live ordinary returns the
mean/p95 intervals were 20.98/33.5ms (Bouncy), 24.58/34.8ms (Chompy), and
19.31/33.4ms (Pip), approximately 48/41/52fps. Maximum sampled native
input-to-next-frame delays were 29.5/29.0/35.6ms. These are local software-renderer
measurements; they do not establish physical-device GPU or Safari performance.

Retained rendered review evidence and exact measurements live in the ignored
`.artifacts/rally-pals/` folder: the three `*-themed-gl.png` high-tier opening
frames, three `*-adapted-rally-gl.png` measured live courts, all court variants,
phone/tablet frames, `adaptive-metrics.json` and `verification.json`. A separate
board-depth screenshot verifies the final separation of the sign face and wood
support, preventing coplanar flicker at reduced resolution.

## Current authored art pipeline

The physical court, net, racket and moving ball retain Three geometry and the
same simulation. Original textured grass, oak and weathered stone are shared
from Burrow Builders' retained material bank. All three canonical themes use their own original horizons and scenery. Each uses independently
placed true-alpha tree, clubhouse, flowerbed and spectator cards at several
world depths, with a separate original distant horizon: a Meadow village/lake/mountains, a Dino volcano/mesas/fern lake, or Moonwood forest/lake/observatory. These are
scene layers rather than a static image of an entire playable court. Low graphics
tiers retain the authored scenery while reducing render resolution and shadows.

The shared Pal module supplies registered plush locomotion atlases, with actual
decoded image delivery reported separately from a functional primitive fallback.
Rackets remain live geometry attached to the shared measured per-pose hand sockets in the camera-facing sprite basis. Stationary players use the explicit tennis ready pose with extended hands; walking retains locomotion poses. A native forehand releases the ball from the registered racket-string centre and its actual height as the contact pose begins, followed by the follow-through. Player and rival shots use this same scene contact authority in WebGL and Canvas; aim targets and motor tolerance remain independent. No animation waits or sound-answer deadlines are introduced. Forehand and lob animations use the separately decoded tennis atlases; point celebrations use the tool/action atlases. Canvas fallback draws the same registered poses and original scene assets with the same physics and native controls. The court’s lawn shader softly desaturates the original surface texture while retaining fine detail and varied patches; it does not modify the retained source image. Exact image
generation prompts, source files, delivery hashes, alpha inspection and encoding
are retained in `source-art/arcade/physical-worlds/rally-pals/`. The original
approved `rally-pals.png` is the visual reference and is never loaded as scenery.
The renderer's read-only quality record reports each actual asset delivery.
Portrait phones retain equal 56-pixel choices at the outer edge throughout play.
Short-phone camera framing and a stable Canvas portrait projection reserve the
teaching panel while retaining both actors, the court and clear status feedback.
The Canvas racket and ball use the same rendered actor scale and registered hand
coordinates, so resizing does not substitute an invented contact point.

## Current authored-renderer local verification, 4 October 2026

The final rules/session/art suite passes 12/12 and scoped ESLint passes. The full
24-case browser suite passes in 8.4 minutes: complete six-serve matches at all
three learning bands, immutable wrong-first/repaired evidence, partial hints,
manual misses, modes and courts, pause/resume, six device sizes, asset/context
failure, save recovery, pointer cancellation, actual ended teaching audio,
action-sound request/sound-off behavior and sustained frame-budget adaptation.
Three native contact cases separately exercise player and rival string origins
and Canvas lob parity. After the portrait presentation repair, all six affected
origin/portrait/context-loss cases pass again in 38.3 seconds; twelve additional
all-theme GL/Canvas phone cases capture opening, delivered cue and native serve
at 320×568 and 390×844, with equal targets, eight-pixel gaps, no interactive
overlap, no visible spelling target and no page errors. The actual phone pixels
were reviewed for actor and choice visibility.

Fresh normal-motion 1440×900 native play retains high-tier opening frames, then
adapts the measured software renderer through 1120, 760 and 560-pixel ceilings.
The final bitmap is 560×350, DPR 1, shadows off; every authored scene and Pal
action layer remains delivered. Each theme profile includes 25 seconds of
ordinary target rallies, 14 native movement/input samples and five or six actual
returns after warm-up:

| World | Frames / simulation elapsed | Mean / p95 frame interval | Maximum input-to-frame | Draw calls |
| --- | --- | --- | --- | --- |
| Meadow / Bouncy | 1595 / 29.55s | 16.65 / 18.60ms | 6.9ms | 157 |
| Dino / Chompy | 1625 / 30.15s | 16.67 / 18.60ms | 12.3ms | 157 |
| Moonwood / Pip | 1596 / 29.90s | 16.67 / 18.50ms | 5.8ms | 175 |

These measured profiles precede only the narrowly scoped phone presentation
repair; wide rendering, physics and audio remain unchanged. Tools freeze the
clock and movement, trap focus, close with Escape, restore playfield focus and
permit native movement afterward. Actual WebGL loss retains the authored live
Canvas court and broad aiming. Exact snapshots, measurements and final high/low
quality, Canvas, tablet and phone images are retained under the ignored
`.artifacts/rally-pals/art-rebuild/final-steady/` and `portrait-repair/` folders.
Actual 1440×900 native forehand/lob/opponent motion videos and extracted contact
frames are retained in `contact-motion/`; the ball is visibly at the strings in
the contact frames rather than being released near an unrelated body point.
These are local Chromium browser observations, distinct from physical iPad
Safari, human listening, classroom observations, hosted saves or deployment.

The final read-only inspector audit also found and closed a live evidence
reference: diagnostic snapshots now clone the bounded evidence graph. The
existing wrong/hint/motor browser case deliberately mutates the exposed first
response, nested support lists, retry rows/array and completion list; a fresh
snapshot retains the exact original evidence. That focused native case passed
1/1 in 12.5 seconds, alongside 12/12 focused units and scoped ESLint, with output
under `.artifacts/rally-pals/final-inspector-isolation/`. This repair changes only
the diagnostic return boundary, leaving play, learning and rendering unchanged.

Cleanup removed the task's failed raw temporary capture video and a superseded
prompt scratch file. Original art sources, current prompts/manifests, native
motion recordings and before/after regression pixels remain active provenance
and quality evidence.
