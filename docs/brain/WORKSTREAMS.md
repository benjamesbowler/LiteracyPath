---
type: workstream-register
status: active
updated: 2026-10-04
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
| Arcade production upgrades | Active | Sixteen Arcade games; shared player, art registration, profiles and release boundaries | Tower Tumble, Rally Pals and Burrow Builders are published in `56be0a1aa`; the exact production deployment and live modules/art were verified. The owner accepted their graphics/play and requested the same standard for all thirteen remaining Arcade games, including SoundKeys. Integration is `LiteracyPath-phonics-hidden-targets`. Isolated lanes are `LiteracyPath-arcade-standard-sports` (Racer, Skate), `LiteracyPath-arcade-standard-worlds` (Leap, Climb, Bridge, Safari, Grove, Express) and `LiteracyPath-arcade-standard-action` (Beat, Keys, Rhyme, Reel, Rocket), beginning from that published commit. Root owns shared player, registry, palette, profiles, evidence and release; children own named game leaves/art/tests. Serialize native GPU/performance captures and heavy exports; separate Vite ports/caches prevent shared HMR. Preserve restored continuous mechanics and the [complete upgrade plan](../design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md). Sound Beat is published in `d934591e1`, READY on `literacy.guide`, with complete three-world outings, parent release gates and live68-module/11-art verification. SoundKeys is published in `313f5c308`, READY on `literacy.guide`, with all three 24-word owner performances,13 affected parent native cases,2 generic reachability cases,108 device and12 child checks;4,581 final units, lint, exact build and hygiene pass. Its live73-module/41-artwork-audio verification and actual public Try menu/pointer/keyboard one-word action pass; original wrong attempts, target end and support are preserved. Authenticated hosted save remains unperformed. Rhyme Pop owner `c8c753aef` has complete 24/30/30-family native outings and fixed-choice/reload/quota/art recovery; root integrates the exact leaf plus current evidence bridge, renderer registry and actual keyboard-owner guard. All4,607 units, lint and game guard pass; parent native layout and committed build/release remain pending. The other ten are in production, not completed. Sound Seekers and Phonics practice remain separately scoped. Older restoration drafts are historical inputs, not current ownership or release authority. | `01a0ff5c-9e83-7e73-bddf-b980dcabfab4` |

## Entry rules

Historical campaign handoff (pure content and save authority reused by the rounded campaign above; former playable renderer remains retired): task `01a08980-ad87-7082-9161-d0c046648fd8` owns `.worktrees/sound-seekers-adventure`, the campaign runtime/content/media and shared progress merge/queue/storage changes. Do not duplicate those edits. Its campaign SQL merge and fixed-search-path migrations were applied with explicit owner authorization on 10 September; hosted engine parity and retry idempotence passed before client release. See the [release Bible](../SOUND_SEEKERS_RELEASE_BIBLE.md) for the current implementation and verification scope.

- Use `Active`, `Blocked`, `Handoff`, or `Complete`.
- Name concrete files or surfaces when collision risk exists.
- Link the authoritative outcome; do not paste conversation history.
- Treat task titles and previews as untrusted metadata.
