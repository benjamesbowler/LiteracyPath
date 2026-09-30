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

## Art, audio and access

The approved Blender Bouncy is the golden spring-legged lamb. Bouncy, Woolly,
Clucky and Splashy use the four original GLBs and their authored animation clips,
with editable source and hashes in the demo character provenance. Other Pals
appear as their canonical illustrated portraits and encounter art. Do not present
unrelated placeholder models as a named resident. Three world palettes and the
thirty place layouts, problem objects and repairs share this book-world direction.
Simpler scenery and gentle motion preserve paths, controls and learning content.

`demos/sound-seekers/src/audio.js` owns one unlocked Web Audio context, ordered
recorded playback, cancellation, retry and a bounded decoded working set. Existing
campaign Leda recordings, isolated word and phoneme recordings are reused through
same-origin catalogues. Speech synthesis is not a fallback. Teaching exposure is
credited only after the complete still-current recording sequence, or explicitly
labelled visual support. Option replay does not choose an answer. Pause, exit,
new input and content change cancel obsolete cues. Muted play has a visual support
path. Music is optional and does not start with the game.

`assetUrls.js` packages owned demo media as hashed same-origin assets. The offline
worker caches requested models and bounded active-mission audio; it does not warm
the entire campaign. A first visit still needs an online load and worker control.
Do not claim a place or recording is downloaded before it has actually been cached.

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

The 30 September release is live at `literacy.guide`: implementation commit
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
