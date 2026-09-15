# Sound Seekers current product Bible

The live child entry is **The Lost Little Lights: A Woodland Homecoming**.
The owner explicitly requested replacing the previous game with this small
chapter on 15 September 2026 and preserving the previous game for reuse.
The approved direction is a rounded 3D adventure with direct 2D/2.5D activities.
The [chapter specification](../demos/sound-seekers/CHAPTER_ONE.md) owns its
content, prerequisites, visual direction and acceptance criteria.

## Active implementation

`src/features/soundSeekers/SoundSeekersRoute.jsx` preserves the app's full-screen
portal, focus containment, learner identity and return-to-home boundary.
`WoodlandChapter.jsx` mounts `demos/sound-seekers/src/chapter/Chapter.jsx`.
The chapter's content, progress, paths and scenery modules own five projects,
15 visits, 120 round slots and the complete homecoming. Shared `world.js` owns
the smooth Blender models, camera and movement; `audio.js` owns cancellable
recorded playback. Movement does not decide literacy correctness.

`assetUrls.js` packages owned media as hashed, same-origin URLs, including
short recordings that must not be inlined under the live security policy.
The scoped styles cannot change the surrounding app. The standalone previews
alone own document/body sizing; the live route owns its portal.

## Progress and learning boundary

This chapter provides supported practice in first sounds, missing letters,
CVC spelling, sound sorting and spoken object placement. It does not award
assessment mastery or invent teacher evidence. Its 30–40-minute authoring
target is not measured child play; the complete 20-hour game remains later work.

Each learner has a separate **device-local** checkpoint through
`woodlandChapterStorageKey` in `src/utils/progressKeys.js`. It retains exact
partial words, project choices, repairs and settings, and participates in
learner deletion and practice reset. A hydrated teacher reset remounts the
chapter after cleanup. Storage failure is shown honestly in the game.
The public try-out keeps the existing memory-only storage boundary and labels
its progress as just for this visit. There is no anonymous-preview migration
and no cloud progress sync for this small chapter. The previous campaign's local and cloud records stay separate.

## Preserved earlier game

The [campaign reference](SOUND_SEEKERS_CAMPAIGN_REFERENCE.md) retains its
mechanics, media, teaching content, evidence policies and save codec. Source
remains under `src/features/soundSeekers/v3/`, with older compatibility sources
under `src/components/quest/`. Media in `public/game-assets/sound-seekers/`,
`public/audio/sound-seekers/` and related shared libraries remains available
for reuse. No learner history or original artwork was deleted.

`src/quest-preview.jsx` remains a local campaign review entry. These preview
HTML pages are excluded from the normal live build. The live route imports
only the woodland chapter; the Vite build rejects reintroduced playable
campaign, QuestRoot or QuestPixelWorld entries. Old data/merge code remains
where existing learner history still requires it. The pre-cutover source is
also recoverable at Git commit `bd240cf3f`.

## Verification and release

Run the chapter/demo content and audio tests, scoped save/privacy checks,
route isolation, child-surface and device tests, plus the regression profile.
Inspect the actual 3D scene, mini games, save/return/reload, sound, pause,
keyboard/touch controls, loading recovery and small-screen fit. A normal
production build must contain the woodland chapter and no playable legacy
runtime. Verify the exact deployed commit and exercise the live child entry.

Keep automated, direct rendered, hosted, human listening, child-paced duration
and physical iPad evidence separate. Earlier chapter playthroughs reached all
120 rounds and replay in development and the packaged preview; those do not
establish twenty hours, physical-device performance or human listening approval.
