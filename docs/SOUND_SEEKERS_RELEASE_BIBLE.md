# Sound Seekers current product bible

## Authority and implementation

This document describes the current child route. Current imports, authored
content and maintained checks are the implementation authority; historical
pass counts, review scores and named-person approvals are not product rules.

The child route is `src/features/soundSeekers/SoundSeekersRoute.jsx`, which
mounts `v3/SoundSeekersCampaign.jsx`. Its owners are:

- `v3/content/campaign.js`: worlds, stages, residents, mission prerequisites,
  curriculum anchors, restoration outcomes and production duration estimates.
- `v3/content/campaignLanguage.js`, `campaignLearningPacks.js` and
  `campaignNarration.js`, `campaignTransferPacks.js` and
  `campaignSentenceTransfer.js`: exact oral prompts, choices, word/sentence content,
  encounter narration and help.
- `v3/content/campaignLayouts.js` and `v3/render/campaignWorldScene.js`:
  hub geometry, encounter rooms, collision surfaces and physical actions.
- `v3/engine/campaignChallenges.js`: executable private challenge records and
  action resolution, using the shared challenge, authority and lexicon modules.
- `v3/render/campaignRestoration.js`: thirty explicit before/partial/restored
  hub compositions, installing recovered objects from completed main missions.
- `v3/engine/campaignActionMotion.js` and `v3/render/campaignActionMotion.js`:
  visible routing, delivery, cart and workshop motion; motor presentation never
  decides literacy correctness.
- `v3/engine/campaignProgress.js` and `v3/campaignStorage.js`: campaign
  progression, formative evidence, checkpoints and learner-scoped storage.
- `v3/engine/campaignAudio.js`, `v3/render/campaignProps.js`,
  `v3/render/campaignHeroes.js`, `v3/render/heroMotion.js`,
  `v3/content/heroActions.json` and `v3/sound-seekers-campaign.css`:
  narration delivery, visible objects, canonical Pal pose animation and interface.
- `v3/engine/adventureNavigation.js`: available quest guidance and resident
  identity selection, independent of learning answers.

Paths above are relative to `src/features/soundSeekers/`. The former
`SoundSeekersV3.jsx` presentation, its map/encounter renderers, director,
stylesheet and storage/audio adapters have been retired after their executable
references were removed. Shared `v3/content/trail.js`, cast, lexicon,
challenges, authority, progress and sprite modules remain live dependencies.
Legacy QuestRoot, pixel and v2 components still have preview or compatibility
consumers; their presence does not define the current child presentation.

## Current campaign and duration boundary

The authored campaign contains three worlds: Sunny Meadow Farm, Sunny Hollow
and Moonwood. Each has ten stages. Each stage has five main missions and two
optional quests: 150 main missions and 60 optional quests overall. Eight
canonical Pals are selectable. Residents have explicit alternate characters
when the chosen hero would otherwise meet a duplicate of itself.

Stage progression preserves structured teaching access with choices between
available missions. Optional quests do not gate the main campaign. Stage
repairs and finales represent narrative progress, not curriculum mastery.
The forty existing `s1`–`s40` curriculum records remain teaching anchors;
they are not thirty stage IDs or an inferred EL cycle map. Available print is
explicitly gated by the taught code. Opening teaching separates a/m from t/s
before mat/sat construction becomes available.

The production plan allocates 1,020 minutes to main missions and 180 minutes
to hub exploration, for a **20-hour target**. Optional quests are excluded.
`estimatedMinutes` and `explorationMinutes` are authoring estimates, not
observed duration. Runtime coverage marks duration as requiring measured
playthrough. A spelling tile placement is a diagnostic substep, not a whole
word mastered; `coverage.decisionCount` must not be presented as an equivalent
number of independent literacy decisions.

Validate first-play active time separately from pause, loading, inactivity,
help, retries and recovery across learners with different reading and motor
confidence. Add meaningful authored content if the campaign is materially
short. Waiting, forced grinding or blocking a fast learner cannot establish
the advertised duration. Automated completion does not validate twenty hours.

### Pacing evidence

Earlier pre-expansion and expanded linear-corridor distance calculations and
their derived playtime ranges are superseded. Continuous platform sections,
shorter teaching routes, sprint and new overworld branches change navigation
substantially. No replacement duration estimate or measured twenty-hour result
is established by this revision. Content counts and prompt durations remain
inventories, not observed playtime; time must be measured in the current route.

### Three-act expansion — local implementation

`v3/content/campaignTransferPacks.js` now authors 876 distinct new oral
situations for 29 later finales and 44 regular main missions, twelve per
mission. Retrieval requires interpreting an object's relation to a landmark;
later-world retrieval requires both size and relation. Application uses a new
object/station arrangement. The 876 full requests are unique across this
expansion and do not repeat the original scenarios in the same mission.
Options have explicit object appearance, landmark geometry and exact narration.
Each pack identifies its retrieval/application act and physical family, allowing
climbing, carrying, route travel, search and placement to vary by the mission.
Opening missions remain short and retain the a/m then t/s teaching boundary.

The builder now consumes those packs plus 180 new sentence/temporal-grammar
situations in `campaignSentenceTransfer.js`, and cumulative canonical taught-word
retrieval/application. Sequential construction of all 210 missions finds 3,648
main beats, 2,853 de-correlated main scenarios and 5,558 tile/item action units.
The main beats include 429 word-construction, 270 sentence, 36 sorting, 12 sound
choice, 103 signpost and 2,798 oral/reading/story beats. Optional quests add 311
beats and 274 scenarios, excluded from the main duration model. The runtime's
scenario count separates correlated pickup/delivery phases and counts the
separate classifications in sorting; it remains a content count, not observed
independent mastery or time.

Primary campaign prompt occurrences total about 97 minutes of verified audio;
another 1,224 canonical cue occurrences are outside that subtotal. Optional
choice-label replay is excluded and audio can overlap movement.

## Learning and evidence

The campaign currently records **formative practice**, not formal assessment
or a mastery determination. `campaignChallenges.js` and the shared authority
own prompt/answer separation and assistance outcomes;
`campaignProgress.js` owns campaign evidence and narrative unlocks. Retained
legacy target counters do not turn this into an assessment instrument.
`src/utils/questMastery.js` and the old review scheduler remain separate
legacy consumers; do not claim they govern this campaign's new evidence.

- Teach before independent print use; keep oral vocabulary and grammar
  distinct from decoding, spelling and heart-word evidence.
- Only an unassisted eligible response may be recorded as independent.
  Models, text help, answer reveals and missing essential audio affect support.
- Word construction produces one word-level outcome with diagnostic substeps.
  Pickup and delivery within one scenario are correlated evidence.
- Narrative completion never creates mastery or independent evidence.
- Replay and resumed checkpoint actions must not duplicate evidence or rewards.
- Old saves retain their original evidence and narrative anchors. An old
  completed stop does not silently complete newly expanded missions.

`campaignTextSupport(beat, state)` reconstructs requested help from the private
authored challenge. Echo help names its target and canonical anchor (for example,
“Find m. Map starts with /m/.”); sort help names the current word and distinguishes
initial sounds, contained sounds and spelling patterns. Other activities retain
their authored support scripts. The public scene never receives the answer key.
Text support remains marked throughout that attempt, including subsequent sort
items and older resumed states whose per-item model flag was reset. Emitted and
stored practice events remain supported; a new beat starts its own support state.
Visual introductions still award exposure without independent evidence.

### Workshop contract

Across all fifteen workshop missions, nine currently have a valid taught
canonical one-part replacement; six use explicit supported word assembly.
Replacement keeps the existing word visible, asks for the changed part and
preserves the original on error. Its outcome records the base word, changed
slot and substitution construct. Supported assembly is labeled instructional
word assembly and cannot be claimed as independent phoneme substitution.
The six assembly missions are `meadow-08-2`, `dino-12-2`, `dino-13-4`,
`dino-16-2`, `dino-20-4` and `moonwood-29-2`.

## Interaction, presentation and media

Sound Seekers must integrate the literacy decision with meaningful world
action: choosing a route, placing a bridge piece, carrying an object, aiming
at a printed target or helping a resident. Repeated families require authored
content and layout variation. One clear immediate objective should be legible
through staging, audio and concise text.

Answer objects must remain readable, reachable and forgiving. Wrong answers
keep the current problem and choices long enough for specific correction.
Motor misses must not fabricate language mistakes. Movement, jump and one
contextual action coexist with keyboard and accessible object selection.
Touch targets, focus, reduced motion and modal isolation follow the current
Game Design Bible. An accessible route must preserve the same educational
meaning, correction state and progress. Missing assets must lead to a calm
supported recovery, not a blank or permanently loading scene.

Canonical cast and existing land artwork remain the visual identity anchors.
`campaignRestoration.js` shows actual recovered supplies and structures at
the authored hub landmark. Bath supplies, shelter bedding, egg/nest access,
crossings, signal equipment and community gathering objects persist by main
mission ID. Optional completions and mastery values do not alter restoration;
a finale ID alone cannot fabricate a finished composition. Action motion
shows routing and item return on incorrect outcomes. Reduced motion preserves
the same action and evidence contract.

The campaign renders authored Canvas scenes; it is not the older Phaser pixel
presentation. Prop silhouettes and semantic attributes must distinguish the
actual choices without revealing which answer is correct.

`campaignSoundscape.js` owns the current route's recorded world music,
ambience and action effects. Music defaults off under the shared audio
preference contract and has an explicit saved pause-menu toggle. Spoken
teaching silences the other layers for the entire cue sequence. Pause, mute,
hidden tabs and disposal stop owned audio; quiet settings suppress continuous
layers and reduce effects. This lifecycle is tested separately from listening
quality. Failed scene images have a visible retry which reloads failed exact
assets while preserving progress and successful image loads.

Every essential audio prompt must resolve a current committed clip. New
campaign narration uses the existing Google Cloud Leda provider and exact
scripts, with provenance in `public/audio/sound-seekers/campaign/manifest.json`.
The authored inventory currently comprises 3,820 MP3 clips (136,482,793 bytes,
137.881 minutes of unique recorded audio). A sequential build of all 210
missions resolves all 4,413 referenced audio paths, including canonical words
and tiles outside the campaign directory. Exact text, file bytes and current
source hashes are verified; unchanged clips preserve original generation
source hashes when their source module changes. Canonical phoneme
clips remain separate and are not synthesized by the campaign generator.
`tools/generateSoundSeekersCampaignAudio.mjs` defaults to a dry run and requires
explicit generation. Format, duration, text and byte hashes are technical
evidence. The manifest's unreviewed human listening state must remain honest;
technical probes do not establish pronunciation or classroom listening quality.
Browser speech synthesis is not a production phonics fallback.

## Data and lifecycle

One learner journey uses one progress model and one active scene lifecycle.
The campaign retains the existing `sound_seekers_v3` cloud row and uses the
canonical learner-local `:v3:campaign-v1` key suffix. The storage adapter owns save status, corruption recovery,
per-learner lifecycle and conservative cross-tab reconciliation. Offline and
sync status must never conceal a failed local save. Unknown future schemas
and conflicting saves are preserved rather than silently overwritten.

Dispose owned timers, listeners, scene resources and audio when their owner
ends. Checkpoints preserve actual choices, target, support, attempt ID and
physical position across resume. The current hub is saved explicitly in
`campaign.currentStageId`; `visitedStageIds` is history, not a reliable last
location after a cross-tab union. An active mission's stage takes precedence
on resume, and a saved hub must still pass its unlock check. Test hooks cannot fabricate evidence that
the real child input path would not support. Reliability and learning data
remain minimal and child-safe.

## Maintained verification and release evidence

Run relevant source tests, lint and build. Campaign-specific suites include
`tests/unit/soundSeekersCampaign*.test.js`, the current component contract in
`tests/unit/soundSeekersGameContract.test.js`, and retained shared engine
regressions in `tests/unit/soundSeekersV3.test.js`. Curriculum anchor and
source-media tests remain useful even where their historic filenames persist.

The current route preview is `preview/quest-preview.html`, which imports
`src/quest-preview.jsx` and `SoundSeekersRoute`. Its `stage` parameter selects
an explicit synthetic fixture through `preview/campaignPreview.js` under an
isolated `sound-seekers-preview:` scope. Earlier main completions and taught
code are seeded solely to inspect that stage, marked `previewFixture.synthetic`;
they are not earned progress or educational evidence. `resume=1` preserves the
preview save unless explicitly reset. These fixtures do not enter the real
child route. By contrast,
`preview/quest.html` mounts the older QuestRoot. Existing quest pixel,
pixel-bundle, forty-stop pacing, v2 content and legacy browser/offline checks
must not be cited as current campaign proof merely because they pass. Retain
checks for their actual consumers; campaign coverage must exercise the new
route, actual asset graph and campaign audio paths.

Current-route verification must cover each world and family, branch unlocks,
help/retry, real input and motor recovery, quit/resume, learner switching,
conflicting saves, failed audio/assets and supported display sizes. Source
checks and browser automation are distinct from physical iPad use, assistive
technology, listening review and observed child play. Report each evidence
class and its untested boundaries accurately; these are not hidden permanent
publication switches.

A release is ready only when its enabled current journey passes the applicable
maintained checks, the affected real-input paths have been exercised, and
known defects are corrected. The 210 authored mission records, generated
audio inventory and green automated tests do not alone establish a finished,
classroom-validated twenty-hour educational game.

Current local verification (10 September): the production build, lint and
repository hygiene checks pass. After integration with the latest game work,
the full suite ran 3,597 tests with 3,592 passing. The campaign first-render
loading regression was then fixed, with all 30 controller/media checks
passing. The other four failures reproduce on parent commit `4462102c8`:
two EL export assertions, one Arcade completion-policy assertion and the
legacy Sound Seekers import graph. Campaign persistence passed its 146
focused checks plus journal, worker and credential-race follow-ups. Actual
browser input completed the five main opening missions and opened stage two;
later Dino workshop and Moonwood raft checks used explicitly synthetic
fixtures. Picture failure/retry, audio failure/text support, character choice
and saved music preference were also exercised locally. Neither physical
iPad use, pronunciation listening, observed learner pacing nor hosted save
behaviour is established by those local checks.

Hosted release verification (10 September): `sound_seekers_campaign_merge`
and `sound_seekers_campaign_search_path` were applied to the linked production
project before client publication, following explicit owner authorization.
The actual engine checkpoint and ACK delta matched the hosted merge exactly;
repeated submission was idempotent with two evidence events retained. The
follow-up configuration pins all 14 campaign function search paths; the
security advisor reports no campaign-specific findings. This pure-function
check does not establish an authenticated learner save round trip. Both SQL
migrations passed 18 checks. Integration with main `3e4b1c70f` passed the
production build and 69 route, controller, image and save-recovery checks.

Production `1ead74fbf` reached READY on literacy.guide. All eight hero atlases
and one recorded cue per world matched local SHA-256 bytes. The normal public
try flow reached Sounds, the eight-Pal chooser, live movement, the first NPC
encounter and its mission. This is public trial play, not an authenticated
learner save check. Direct viewing exposed underlying floating Back navigation
overlapping Map; the route portal now establishes its own fullscreen stacking
layer above the inert app shell. Its route check, lint and rebuilt bundle pass.

## Exploration and platform interaction contract

The child-facing direction is Breath-of-the-Wild-inspired exploration: a
third-person textured 3D landscape connects separate side-view platform and
2.5D clue-maze adventures.
The deliberate hybrid retains canonical illustrated Pal animation in the modeled
world, rather than replacing the cast with stock 3D characters.
`v3/content/explorationLayout.js` owns overworld geometry through
`getCampaignHubLayout`; `v3/engine/exploration.js` owns collision and accessible
route finding, `v3/render/explorationScene.js` owns interaction and camera controls, and
`v3/render/explorationLandscape.js` owns Three.js presentation. The production
brief is the `sound-seekers` record in `arcadeVerticalSliceBriefs.js`.
The former side-view hub corridor has been removed from the renderer.

All thirty places retain their canonical residents, seven missions, explicit
curriculum prerequisites and authored restoration. Streams block movement except
at physical crossings; operating a lever opens a real shortcut. Hidden picnic
nooks offer a return to camp. Authored grove, ridge, bank and switchback branches
vary across the thirty places; jumpable logs have walkable detours, and mission
entrances connect to the trail network. Exploring a place is free; starting a learning
mission remains governed by its existing prerequisites. Completing main missions
continues to restore the corresponding authored landmark from saved progress.

The compass points toward an available main quest, or an optional quest when
none remains. Only one visible resident represents each Pal identity; other
available entrances remain reachable. E/Use explicitly enters a nearby mission
without a second confirmation panel. Completed activities leave the active
entrance roster and remain available through Pause → Play an activity again.

`v3/engine/campaignTraversal.js` places crossings after completed problem groups
and at section ends. Teaching cards have short connected rooms without crossing
detours. Lever-operated bridge spans grow and hoist decks rise with their real
collision surfaces, carrying a standing rider. Stepping platforms can be crossed
directly or through the same motor-assist path. These interactions
never emit literacy actions. A completed learning area remains completed after
a missed jump. Existing mission snapshots, formative attempts, support markers,
audio and sync contracts are retained. Overworld position, lever and discovery
state persist across local scene transitions in memory; these cosmetic fields
are not uploaded or presented as learning evidence.

Controls: arrows/WASD explore relative to the camera; drag, Q/C or the camera
buttons turn the view, wheel adjusts distance and R recentres the camera. The
orbit follows movement with damped look-ahead, clears nearby solid scenery and
stays above terrain. Left/right and Space move/jump in side-view
missions; E/Enter uses a nearby object. Pointer-ground movement and semantic
object selection follow actual terrain. Touch uses a proportional stick and
separate jump/action controls; optional direction buttons remain available.
Capture loss and blur release input. Nearby contextual labels and compact Help
keep controls subordinate to the world and current learning objects.

The art target is detailed illustrated game scenery consistent with the Pals.
Simple vector environment drawings are not accepted final art. Material textures
must follow collision geometry; opaque prop sheets, fake checkerboard alpha and
flat scene wallpaper are not usable sprite replacements. The same geometry owns visible bridge decks, river blocking, tree trunks and
assisted routes. Reduced effects retain every solid object, disable shadows and
reduce grass density and pixel ratio. Failed essential assets or a lost WebGL
context offer Retry. Current authored
materials live under `public/game-assets/sound-seekers/campaign/environment/`.

Verification owners: `soundSeekersExploration.test.js`,
`soundSeekersCampaignScene.test.js`, `soundSeekersCampaignLayouts.test.js`,
`platformPhysics.test.js`, campaign persistence/evidence checks and direct browser
play. Physical-device and observed campaign-duration claims require that exact
additional evidence; neither is implied by the new traversal sequences.

The landscape uses the existing Quaternius nature trees, bushes and flowers,
and KayKit medieval tent and gate models. Their exact runtime paths are exported
by `EXPLORATION_MODELS`; dependency existence is checked by the exploration tests.
They retain the CC0 notices in the shared library. The environment material
atlas was generated for this game; its grass, path, water and soil tiles are
applied to geometry rather than used as a full-screen scene image.

Local verification for the exploration cutover: 148 focused campaign, navigation
and platform checks, scoped lint, production build and repository hygiene pass.
Direct browser play exercised a platform crossing, mission return, an opened
river bridge, the hidden nook/camp shortcut and recovery after forced WebGL
context loss. All three worlds were viewed; phone controls were checked for
intersections and a tablet viewport exercised reduced effects. This is local
browser evidence, not hosted sync, physical-iPad or observed-duration evidence.
The broader premium-game suite has two pre-existing Word Climb/Rocket Run
source-anchor failures, reproduced against its unmodified baseline; the new
Sound Seekers brief has its own passing structural check.


### Segmented activity areas and illustrated sprites

`v3/content/activityAreas.js` selects twelve named activity settings from the
existing physical families. Learning beats use bounded areas, with a
short transition when the activity setting changes. Related platform beats keep
one continuous route, player position, camera and completed construction; sound
choices occupy real raised landing stones. Related maze clues share one room.
Construction, aiming, climbing,
delivery, sorting, routing and workshop mechanics retain their exact authored
stimuli and challenge outcomes. A finished area exposes its onward route;
walking against an area edge cannot skip a learning beat.

`v3/engine/mazeAdventure.js` and `v3/render/mazeAdventureScene.js` add connected
2.5D hedge mazes to search and story-delivery challenges. In the fully taught
campaign configuration, 666 beats use these areas. Layout generation uses the
mission and section identity, never its answer key. Every offered destination
has a traversable route. Keyboard, analog movement and accessible destination
selection share collision. Clue replay is separate from choosing. Carrying or
inspection visibly travels to the chosen object before the original action is
resolved; wrong choices return the item and retain the problem. Correct spatial
deliveries remain visible at their authored placement. Area-qualified maze
positions survive checkpoints and continue between related
clues. A successful intermediate clue offers its next interaction at the player,
rather than requiring a trip back to the entrance. A final clue exposes the
entrance exit. Positions cannot transfer into a different platform area.

`v3/engine/adventureControls.js` supports standard browser gamepads with stick
dead zones, proportional movement, sprint, jump, interaction and pause. Held
interaction cannot repeat after a dialog, and disconnect releases input. Hub
camera damping uses elapsed time. This is browser Gamepad API support, not a
claim of a native Nintendo Switch build or verified physical controller support.

`v3/render/puzzleSprites.js` draws the generated 4-by-4 RGBA atlas at
`public/game-assets/sound-seekers/campaign/environment/puzzle-props.png`.
Its sixteen painted props include platforms, bridge, doorway, sign, lever,
crate, basket, lantern, bucket, bedding, chest, hedge, wheel, ladder and workbench.
The original transparent source is preserved; runtime alpha bounds remove cell
padding without changing proportions. Generated on 12 September 2026 using the
built-in image tool, with a prompt for detailed illustrated 2.5D wood, moss,
stone and metal props, upper-left lighting, isolated transparent cells, no text,
no vector or pixel treatment. The committed image is 1254 by 1254 with genuine
alpha, not a drawn checkerboard. Neutral scenery uses these sprites; exact
colour, size, count, shape, ownership and spatial contrasts remain authored
semantic props so the new art cannot silently change a learning answer.

`heroActions.json` registers 48 illustrated action poses across all eight Pals,
supplementing their existing walking cycles: rest, blink, crouch, airborne,
reach and cheer. `heroMotion.js` selects frames for actual movement, jump/fall,
landing, interaction, talking and feedback states. Hero gait follows travelled
distance; nearby residents also change poses. The two committed action sheets
retain magenta backing, converted to transparency in cached rendering canvases
by `campaignHeroes.js`; they are not source-alpha images. Ground registration
keeps physics responsible for position and jump height. Reduced motion retains
legible action poses while suppressing extra motion. Drawn frames and automated
pose checks are distinct from finished animation-quality or hardware proof.

`v3/content/campaignLearningJourney.js` provides an explicit practice crosswalk
to the current 27 EL cycles in `src/data/elSkillsBlockCycles.js`, plus long
vowels, vowel teams, alternative spellings and longer-word extensions. The pause
menu exposes this journey. The links describe related sound and reading practice;
they do not assert coverage of every EL oral-language, writing or assessment
routine. Cycle numbers and `s1`–`s40` anchors remain different identifiers.
The 1,200-minute main-adventure budget is shown as planned time, with optional
quests additional and no enforced minimum playtime. Segmentation and sprint
change traversal time; earlier corridor-distance arithmetic does not measure
this version's duration.

Local segmented-area verification: 176 focused campaign, shared learning,
exploration, platform and new activity-area checks pass, together with scoped
lint, production build and repository hygiene. Checks traverse every maze-bearing
mission's first eligible choices and exits, inspect reachability for every
authored maze beat, and cover controller edges, collision, area changes and
checkpoint recovery. Browser play exercised wrong/correct maze responses and
confirmed that a completed maze resumes after reload, then finished all three
opening button mazes and returned to the landscape with optional completion
persisted; tablet and phone views
were directly inspected. Physical controller/iPad use, hosted learner sync and
observed twenty-hour pacing remain separate, unestablished evidence classes.

Opening button sizes and seat settings now have explicit authored appearances in
`campaignLanguage.js`. Both area renderers use the same definitions, including
for earlier saved scene records. Small/large buttons differ in scale; seats show
a tree, sun or pond, and rail/tray/stool deliveries use their actual placement
geometry. No narration, answer key or saved learning outcome changed.


A second transparent atlas, `learning-props.png` (1312 by 1199 RGBA), supplies
sixteen painted everyday objects: button, ribbon, seat, tree, pond, rail, stool,
tray, towel, soap, cloth, brush, ball, cushion, hat and bag. It was generated with
the same tool and art direction on 12 September, requesting four button holes,
recognisable materials and isolated alpha. Explicit source rectangles follow
its actual spacing. Neutral props and simple button-size comparisons use these
sprites. Attribute-specific and relational host drawings retain their authored
geometry; a generic image cannot override the requested colour, shape, count
or placement. Both source atlases are committed intact and preloaded by the
active scenes.


## Initial-sound examples and control refinement — 12 September 2026

For the 25 initial-sound targets (including qu), teaching anchors must start
with both the authored grapheme and target sound. The canonical first unit,
letter index, picture and recorded word are checked together. **m uses map**;
t, s, d, i, o, u, e, w, qu, k, g and y also use clearer onset examples. x retains
box as an explicit final-/ks/ exception. Ham remains a valid later decodable
practice word, but is not the introductory example for m.

Eleven missing oral picture anchors were added to the pronunciation authoring
corpus against its pinned CMUdict reference. They are marked oral teaching only;
this does not admit umbrella, insect or other untaught spellings into independent
decodable practice. The generated corpus now has 542 records. Umbrella includes
a final schwa, increasing the existing contextual-unit human-audio review ledger
from 21 to 22 entries across the same five sound keys. The initial /u/ teaching
uses its recorded target and whole word, not an unavailable schwa recording.
The existing release gate remains enforced.

Unscored signposts are refreshed from current teaching metadata on resume.
Saved scored challenges, attempt identities and learning history are preserved.
The previous anchor test accepted a target anywhere in a word; the onset test
now prevents another m/ham introduction.

Touch layouts use a proportional radial movement stick, with explicit release
on pointer loss and blur. Direction buttons remain available in the pause menu.
Desktop displays a compact keyboard or controller guide. Quest title, area and
progress stay visible; Help contains assisted walking, model, text support and
undo. Muted instruction replay explicitly enables sound when pressed. Palette
values live in the shared visual-token authority.

Browser refinement checks cover the revised teaching display, explicit sound
activation, proportional stick movement/release, and clear phone controls.
Synthetic scene checks cover related-clue continuity, nearby onward interaction,
resume, keyboard takeover and assisted walking after analog release. These are
local browser and automated observations, not child enjoyment ratings, physical
controller verification or measured twenty-hour play. The owner's 4/10 feedback
remains a quality signal; no 10/10 acceptance is asserted by this update.


Previous refinement validation: 52 pronunciation, teaching, corpus/import and activity
checks passed; all six failures from a broader 668-check run were corrected,
and the affected content/contract/scene gates passed in a 49-check rerun. Lint,
production build, generator currency and repository hygiene pass (existing bundle
size and hygiene warnings remain). Actual browser play reached the revised map
introduction and advanced Tiny's first maze clue to the next clue at the same
saved area position. No hosted or physical-device result is implied.

Current adventure refinement verification (12 September): the broad Sound Seekers
run executed 693 checks, with 691 passing and two localhost-listener checks blocked
by the sandbox. All three matching range-server checks passed outside that
restriction. The subsequent 36-check focused run covered challenge help, resumed
rendering, preview readiness and presentation; all passed. The final 12-check
presentation/preview/render rerun also passed. These overlapping runs are not an
additive total. Scoped lint, production build and repository hygiene pass; the build retains
its existing bundle-size warning.

Direct local browser play verified drawn Speedy jump/rest poses, continuous opening
teaching, maze incorrect-return/correct-next-clue behaviour, earned maze completion,
explicit replay and completed-entrance removal. Supported help survived reload,
keyboard releases cleared when focus changed, and the pointer-driven stick released
correctly. Desktop, 1024×768, 390×844 and 700×390 browser layouts were viewed; obsolete
phone rules that overlapped Help and clues were removed. Chompy in Sunny Hollow and
Pip's reduced-motion Moonwood platform entry used explicitly synthetic later-stage
fixtures. All 48 action drawings and their walk continuity were directly reviewed.

Billboard padding now fits every authored pose without changing body scale or feet.
A reproduced WebGL context-reuse upload error was corrected; four dirty-state
construction/disposal cycles returned no graphics errors. The isolated local
preview lacks Supabase credentials, so these checks establish local browser storage,
not authenticated hosted saves. No physical controller/Switch, classroom listening,
observed child-play or measured twenty-hour result is implied.
