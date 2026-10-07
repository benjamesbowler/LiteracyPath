# Sound Seekers current product Bible

The child entry is the expanded rounded 3D adventure with Bouncy. On 30 September
2026 the owner requested all app audit repairs followed by the complete campaign
expansion. This extends the approved 15 September storybook direction; it does
not reinstate the former pixel game. The existing Woodland Homecoming remains a
separately selectable chapter with its own saved progress.

## Campaign and current owners

The forty canonical curriculum anchors in `src/data/questSequence.js` map into
thirty authored places: ten in Sunny Meadow Farm, ten in Sunny Hollow and ten in
Moonwood. `v3/content/campaign.js` owns those places, five main missions and two
optional missions per place: 150 main and 60 optional missions. The campaign has
210 authored mission packs. Forty anchors are not forty stage IDs. Main missions
follow their declared prerequisites; extras never gate the ending. Twenty hours
is a content and pacing target, not a measured child duration. No timer, waiting
or repeated-answer quota manufactures it.

`SoundSeekersRoute.jsx` owns the full-screen portal, focus containment, learner
identity and return boundary. Its default `rounded/RoundedCampaign.jsx` mounts
`campaignWorld.js`, `campaignWorldLayouts.js`, `campaignRestorations.js` and
`CampaignActivity.jsx`. The route offers free keyboard/touch movement, branched
paths, nearby encounter entry, optional carry/use discoveries and operating
objects. The Find action walks along a collision-safe route; it never opens an
encounter automatically. Places provides direct motor assistance to the same
missions. Finishing a mission returns control to exploration, without forcing
the next mission open. Each completed main mission leaves its exact authored
repair; a finale or optional action cannot stand in for the other four repairs.

Movement follows the current Game Design Bible: left/right steering at the
lower left, independent forward/back controls at the lower right and the
nearby contextual action between the thumb zones. Held pointers combine;
releasing or cancelling one finger leaves the other active. Lost capture,
pause, visibility loss and departure clear held movement. A short tap uses
the same bounded collision steps as continuous movement. Controls are 72px
on roomy iPads and retain the 56px floor on smaller or shorter viewports.

`campaignChallenges.js` and `campaignInstructions.js` remain the single teaching
and judging authority. Twelve authored activity families use sound introductions,
sound/letter choices, oral or read sorting, ordered sound-piece construction,
message construction and spoken object placement. The rounded activity presents
the exact semantic choices, distinct repeated pieces and canonical art, with
specific retries, undo where appropriate, replay and labelled support. Correct
completion advances automatically. The controller alone receives private answer
keys; canvas motion, movement assistance and optional discoveries never judge
literacy. Failed picture media offers deliberate supported text recovery.

The October interaction upgrade uses `campaignPlayfield.js` as the family-action
inventory. The response controls are the physical targets in the playfield:
stones, bubbles, bridge pieces, landings, deliveries, baskets, docks, carriages,
workshop parts, garden placements, lantern finds and story decisions. Dragging
and tapping send the same existing semantic action. Cancelled drops, carrying
and opening lanterns are motor actions, with no answer, teaching or completion
credit. Lanterns reveal before a deliberate selection. Layouts derive from the
saved beat identity, never the key; public settled pieces and receipts drive
Bouncy's movement and the repair display. Keyboard and direct tap retain parity.

`CampaignLearningScene.jsx` keeps those objects and the frozen original choices
visible inside the shared `LearningPracticeTask` response owner. A wrong answer
retains its original response and partial word; requested help is labelled as
support. Guided multi-part models save their exact cursor. Fresh transfer uses
the same construct and format with new eligible semantic content, and remains
supported practice. Four bounded reserve packs improve availability without
changing an unfinished authored pack. Encoding keeps its target hidden and
offers a partial hint after repeated mistakes. Independent reading stimuli
retain their declared silent or spoken modality.
Supported sentence construction retains its written message model when voice
delivery fails; spelling construction still conceals its target.

Choice generation follows the Question Design Bible: three strong options by
default, four when all three distractors are diagnostic. Opening letter-to-sound
items offer four distinct committed isolated phoneme recordings from their own
curricular anchor; oral foils carry no printed spelling or teaching credit.
Sound-to-letter choices use only this mission's explicit introductions and the
learner's already-taught code. The first two-letter printed tasks therefore keep
their legitimate two-choice exception. Word recognition prioritises nearby taught
phoneme sequences and excludes homophones. Word construction offers up to three
distinct recorded distractor pieces from actually taught code, retaining every
required repeated piece; a workshop also retains the original marked part within
four choices. Authored three-destination oral scenes and two-bin sound sorts keep
their exact semantics. More choices do not add teaching events or mastery claims.

These pools apply to newly built attempts and explicit replays. An unfinished
saved round retains its original options, IDs, private key, mistakes, assistance
and evidence, including earlier two-choice auditory rounds. Resuming or refreshing
teaching media never regenerates a saved question or rewrites historical responses.

## Art, audio and access

The approved Blender Bouncy is the golden spring-legged lamb. Bouncy, Woolly,
Clucky and Splashy use the four original GLBs and their authored animation clips,
with editable source and hashes in the demo character provenance. Other Pals
appear as their canonical illustrated portraits and encounter art. Do not present
unrelated placeholder models as a named resident. Three world palettes and the
thirty place layouts, problem objects and repairs share this book-world direction.
Simpler scenery and gentle motion preserve paths, controls and learning content.

Rounded activity panels keep the scene and response controls together instead of
placing a clipped route strip in an otherwise empty screen. All twelve families
use their own scene, canonical portraits and registered painted prop atlases.
Activity-banner landscapes, bridge pieces, stepping stones, train, mailbox,
bubbles and garden props are complete painted raster images. CSS positions and
animates those images; it does not construct the depicted objects from shapes.
`campaignSceneArt.generated.json` retains exact source paths and natural aspect
ratios. `tools/soundSeekersQuestionArt/landscape-source.json` records the three
painted landscape variants and their generation prompt.
Later-world activity scenery reuses the owned Fossil Canyon and Lantern Forest
paintings through `campaignPlayfieldLandscape`; their retired playable runtime
is not imported. Offline warming resolves the same authored landscape selector.
Exploration uses a closer camera and collision-checked work objects near the
residents. Walking retains elapsed time through fixed collision steps when
rendering slows, with at most fifteen steps after a quarter-second hitch.
Automatic travel rechecks each waypoint within those steps; it cannot skip a
corner or claim a mission arrival without the existing nearby gate.
Twelve short owned physical sound effects have byte-level source
provenance in `tools/soundSeekersQuestionArt/action-sounds.json`; the bounded
effects bus does not interrupt speech or claim instructional delivery.
Question choices, carried-object cues, worked examples and eligible fresh spatial
practice use the same exact
committed painted scene selected by `rounded/campaignQuestionArt.js`. Spatial
choices depict the carried object in every proposed position. The renderer never
constructs a meaningful picture from primitive shapes or dotted target markers.
`tools/soundSeekersQuestionArt/sources.json` records source illustrations and
generation prompts; its builder composites owned raster artwork into the complete
question corpus with common framing and explicit semantic attributes. A missing
source, clipped scene or indistinguishable choice set fails verification. Image
loading errors retain deliberate retry and supported access, without a shape fallback.
Bridge planks, collected objects and other repairs project already-settled public
state; a wrong answer or replay cannot advance the artwork. Undo and restoration
show the exact remaining repair. Scenery never reads a private answer key or
changes progress, scoring or teaching. Motion pauses with the activity and tab,
and gentle movement removes flights while retaining the settled result. Buttons,
slots and support use the shared blue interface roles; natural foliage stays green.
Written supported introductions stay visible throughout the result dwell,
including after Pause/Resume, without changing their recorded exposure type.

`demos/sound-seekers/src/audio.js` owns one unlocked Web Audio context, ordered
recorded playback, cancellation, retry and a bounded decoded working set. Existing
campaign Leda recordings, isolated word and phoneme recordings are reused through
same-origin catalogues. Speech synthesis is not a fallback. Teaching exposure is
credited only after the complete still-current recording sequence, or explicitly
labelled visual support. Option replay does not choose an answer. Pause, exit,
new input and content change cancel obsolete cues. Muted play has a visual support
path. Music is optional and does not start with the game.

The owner's 7 October listening review accepted the standard contextual masters
for schwa, ear_lax, ed_id and ure_no_y. once_onset reuses the unchanged approved
/w/ cue; all three generated letter-name takes were rejected and are absent from
the runtime. The [contextual review record](audio/SOUND_SEEKERS_CONTEXTUAL_UNIT_REVIEW.md)
and public `audio/phonemes/reviewed/contextual-source.json` own the exact reviewed
hashes, source provenance and grown-up disclosure. The 22 affected pronunciation
blockers are resolved; unrelated unreviewed cues still fail the existing gate.

`assetUrls.js` packages owned demo media as hashed same-origin assets. The offline
worker caches requested models and bounded active-mission audio; it does not warm
the entire campaign. A first visit still needs an online load and worker control.
Do not claim a place or recording is downloaded before it has actually been cached.
`campaignQuestionArtOffline.js` adds the exact pictured choices and scene media
for that active saved mission. It never downloads the entire question-image bank
or reads private answer keys. Fresh practice retains the shared learning-response
owner and freezes its pictured options when any image fails, with deliberate retry.

## Progress, participation and privacy

`v3/campaignStorage.js` is the canonical storage owner. It retains immutable packs,
choice order, partial pieces, attempts, mistakes, support, current place, scoped
3D position, observed activity time and exact completion. Local-only try-out saves
never queue cloud writes. The public try-out retains its memory-only boundary and
labels progress as just for the visit. Authenticated learners use the existing
`sound_seekers_v3` row, compatibility transport, hydration, reset and conflict
rules; no new database schema or permissions are required. Newer, unreadable or
conflicting saves are preserved and blocked from replacement. A failed local save
cannot silently advance or exit an unfinished task.

Earlier campaign choices and evidence are retained. Old stop completion supplies
narrative anchors only; it does not fabricate new mission completion or relabel a
historical hero as Bouncy. New rounded positions have an explicit coordinate basis;
old pixel coordinates cannot teleport a new scene. Game discoveries merge as
narrative rewards, separate from formative responses and assessment mastery.

`rounded/campaignSummary.js` owns Home and teacher participation projections.
Home counts thirty places and 150 main adventures; the sixty extras stay optional.
Missing progress is unavailable, not an invented zero. Teacher projections contain
only completion/attempt identifiers, place and an explicit participation cache;
no checkpoint challenges, answer keys or raw response bodies. Exact response IDs
supply totals. A sync timestamp is not recent play; the date is labelled Last
reported practice answer. Sound Seekers is formative practice, never an automatic
assessment or mastery decision. Learner deletion and teacher reset include both
the campaign and the separate Woodland checkpoint.

The rounded checkpoint merge migration keeps the two existing pure, invoker
server helpers aligned with the client: action revisions preserve deliberate
Undo, listening delivery belongs to the current sort item, and narrative
discoveries/inventory merge without resurrecting a delivered object. This
compatibility update must be verified on the authorized target before releasing
the expanded client. It changes no learner rows, tables or permissions.

## Retained chapter and historical sources

`WoodlandChapter.jsx` continues to mount the complete five-project, 120-round
[Woodland Homecoming](../demos/sound-seekers/CHAPTER_ONE.md). It retains its independent
`woodland_homecoming_v1` cloud row, v2 checkpoint transport and exact local save.
It is selected from the campaign entrance; returning to it never consumes retired
assignments or replaces campaign progress.

The [campaign reference](SOUND_SEEKERS_CAMPAIGN_REFERENCE.md) preserves former
presentation details and reusable curriculum/media/save rules. The default child
route reuses its pure content and authority modules, not `SoundSeekersCampaign`,
`QuestRoot` or `QuestPixelWorld`. Vite rejects those old playable runtimes from the
normal live build. Isolated preview HTML entries are excluded from that build;
synthetic stage fixtures never belong to the child route or learning evidence.
No learner history, canonical artwork or editable approved model source is removed.

## Verification and release

Verify all thirty places and 210 mission entrances, collision-safe travel, actual
object discoveries, all 150 exact repairs and the ending. Exercise every mechanic
and family, wrong answers, repeated pieces, automatic completion, cue cancellation,
muted and failed-media recovery, pause/focus, keyboard/touch, small screens and
both scene qualities. Run actual continuous routes as well as pure whole-corpus
checks; fixture-unlocked places are not earned completion. Verify partial resume,
support retention, scope isolation, hydration/acknowledgement/reset/conflict,
Home totals, teacher privacy and controlled-worker offline recovery. Run the normal
production build and exact-commit hosted checks after a scoped Git release.

Keep automated, direct rendered, hosted, human listening, classroom duration and
physical iPad evidence separate. Tests of full recording delivery do not establish
human pronunciation review; software-rendered browser performance does not prove
physical school hardware. Never describe the twenty-hour target as measured play.

The 30 September release was verified at `literacy.guide`: implementation commit
`f51dd0807c13d923eefb7eee3feec35abd210103`, automatic deployment
`dpl_DcYBhzHaXjYBgm3EtQ3kjMopwRKR`, verified READY with the production alias.
The owner-approved pure helper update passed live synthetic Undo, current-item
hearing and narrative-inventory checks without changing learner rows or access.
The separate public try-out exercised the rendered world, real Find/Help route,
recorded teaching, native answer and Home/Carry on restoration at step 4 of 8;
all thirty places were visible across three worlds and no browser warnings or
errors were observed. Integrated checks covered 99 unique device-matrix cases,
16 native desktop/mobile routes and eight split-thumb control cases. Compact
proof, passing visual evidence and helper rollback definitions remain in ignored
`.artifacts/app-fixes-child`. Physical iPad performance, authenticated hosted
learner roundtrips, human listening and child-paced classroom duration are not
established by these checks.

The 7 October interaction upgrade was verified live at `literacy.guide` on
scoped release commit `e74954a0f36c574a77c181343ec24755bb73d079`, automatic production
deployment `dpl_UjwyLEpc5uxDy3MCNt6U6vXPiyq2` (READY with the production alias).
The compiled entry contains that exact release ID; all nineteen checked public
assets match the committed recordings, action effects, source ledger and
grown-up disclosure. Local checks passed all 5,341 unit tests and required
coverage, all 210 mission entrances, 630 sequential replay packs, all twelve
native families and the canonical Sound Seekers audio release gate. The live
public try-out verified real travel/Help, recorded teaching, frozen wrong-answer
guidance, automatic progression and Home/Carry on restoration at step 4 of 8.
Its hundred observed requests were GET, with no failed requests or console
warnings/errors; no hosted learner data was written. Compact receipts and live
screenshots remain in ignored `.artifacts/sound-seekers-upgrade`. The four
contextual standards have the owner's listening approval; this release does
not establish physical iPad performance or child-paced classroom duration.
