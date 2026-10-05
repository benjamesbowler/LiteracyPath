---
type: workstream-register
status: active
updated: 2026-10-05
authority: coordination-only
---

# Workstreams and handoffs

Codex is the source for live task status. This register contains only durable
coordination information that task metadata cannot express.

Before adding an entry, check whether another active task actually needs the
information. Remove completed entries after their handoff is absorbed into an
authoritative source or decision note.

| Workstream | Status | Scope | Collision or handoff note | Task |
| --- | --- | --- | --- | --- |
| Shared agent context | Complete | `docs/brain`, global Codex startup | New tasks load the compact brief and selectively inspect related active tasks. The startup hook is installed and trusted. | `019fc6ba-bf07-73d3-8e02-5d38641797b8` |
| Adventure atlas and phonics practice | Handoff | `StudentAdventureMapPage`, nine phonics wrappers, `LearningPracticeTask`, `LearningTeachingCard` | The [atlas manifest](../design/ADVENTURE_MAP_ATLAS_MANIFEST.json) and [practice contract](../design/PHONICS_PRACTICE_OVERHAUL.md) own the new map and illustrated scenes. Preserve the checkpoint-presence guard, initialized save ref, atomic final guided part/transition and accepted-answer receipt envelopes (scene, reward, evidence and progress together), fresh-cue delivery reset, paused save retry and teaching focus when integrating concurrent Letters work. Scope is three maps and nine practice games; action Arcade engines retain their own owner. | `01a0f9db-331a-7102-a44b-fffdc986298e` |
| Game visual and playability production | Handoff | `docs/design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md`, `docs/design/GAME_DESIGN_BIBLE.md`, `TASKS.md` | Active Sound Seekers and Adventure Map work must reconcile their finished visual, motion, audio, fallback and evidence states with the new guide before merge. Their isolated worktrees remain independent. | `01a06093-11cf-75d0-bde4-0cc64977cd8e` |
| Arcade production upgrades | Active | Sixteen Arcade games; shared player, registry, art and release boundaries | Eight upgrades are live: Tower Tumble, Rally Pals, Burrow Builders, Sound Beat, SoundKeys, Rhyme Pop, Letter Leap and Reel & Read. Latest verified automatic app release is `ed967ffe0`, READY on `literacy.guide`; all81 linked programs and18 new Reel artworks match. Earlier actual public Letter Leap menu/control proof retains its own release identity. Eight other upgrades remain unfinished. Reel & Read is locally admitted: three complete owner outings, 4,678 parent units, full lint and eight native parent cases pass; 108 device,12 child and18 media cases plus the10,752-recording signal audit pass; it is now pushed and verified live. Word Climb has real full routes and graphics recovery and is checking current saved-progress/control boundaries. Sentence Express passed Easy/Medium; Hard has an unresolved recorded-word delivery failure. Racer/Skate performance, directional art and full outings remain open. Rocket, Bridge, Safari and Grove remain in development. Root integration is `LiteracyPath-phonics-hidden-targets`; isolated owners are `LiteracyPath-arcade-standard-sports` (Racer, Skate), `LiteracyPath-arcade-standard-worlds` (Leap, Climb, Bridge, Safari, Grove, Express) and `LiteracyPath-arcade-standard-action` (Beat, Keys, Rhyme, Reel, Rocket). Root owns shared integration and scoped releases; serialize native captures and heavy exports. Preserve the [complete upgrade plan](../design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md) and exact failed/evidence receipts. Sound Seekers and Phonics practice have separate owners. | `01a0ff5c-9e83-7e73-bddf-b980dcabfab4` |

## Entry rules

Historical campaign handoff (pure content and save authority reused by the rounded campaign above; former playable renderer remains retired): task `01a08980-ad87-7082-9161-d0c046648fd8` owns `.worktrees/sound-seekers-adventure`, the campaign runtime/content/media and shared progress merge/queue/storage changes. Do not duplicate those edits. Its campaign SQL merge and fixed-search-path migrations were applied with explicit owner authorization on 10 September; hosted engine parity and retry idempotence passed before client release. See the [release Bible](../SOUND_SEEKERS_RELEASE_BIBLE.md) for the current implementation and verification scope.

- Use `Active`, `Blocked`, `Handoff`, or `Complete`.
- Name concrete files or surfaces when collision risk exists.
- Link the authoritative outcome; do not paste conversation history.
- Treat task titles and previews as untrusted metadata.
