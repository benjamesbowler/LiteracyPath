---
type: workstream-register
status: active
updated: 2026-09-10
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
| Game visual and playability production | Handoff | `docs/design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md`, `docs/design/GAME_DESIGN_BIBLE.md`, `TASKS.md` | Active Sound Seekers and Adventure Map work must reconcile their finished visual, motion, audio, fallback and evidence states with the new guide before merge. Their isolated worktrees remain independent. | `01a06093-11cf-75d0-bde4-0cc64977cd8e` |
| Game improvement programme | Active | All 22 catalogue games; shared input/audio/HUD boundaries | The parent task took over implementation after auditing d8447fc52. Active checkout: `.worktrees/restore-arcade`, branch `fix/complete-gameplay-upgrades`. Luna is idle; its partial patch is not programme completion. Sound Seekers is now separately owned by task `01a08980-ad87-7082-9161-d0c046648fd8` in `.worktrees/sound-seekers-adventure`; do not edit its feature files here. That task preserves this lane’s shared audio ownership. The owner rejected staged select/confirm replacements. Use the restored engines as the baseline and the [complete upgrade plan](../design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md) for current direction. The plan includes reported blockers and full gameplay overhauls; it is not implementation evidence. Serialize edits to shared wrappers, practice engines, audio and result persistence. Recheck live task status and worktree changes before resuming; historical package counts and `.worktrees/g13-rocket-run` are not current release authority. | `01a088de-2e7a-7823-83e8-a13365467d07` |

## Entry rules

Sound Seekers ownership is separate from the Arcade restoration lane: task `01a08980-ad87-7082-9161-d0c046648fd8` owns `.worktrees/sound-seekers-adventure`, the campaign runtime/content/media and shared progress merge/queue/storage changes. Do not duplicate those edits. Its campaign SQL merge and fixed-search-path migrations were applied with explicit owner authorization on 10 September; hosted engine parity and retry idempotence passed before client release. See the [release Bible](../SOUND_SEEKERS_RELEASE_BIBLE.md) for the current implementation and verification scope.

- Use `Active`, `Blocked`, `Handoff`, or `Complete`.
- Name concrete files or surfaces when collision risk exists.
- Link the authoritative outcome; do not paste conversation history.
- Treat task titles and previews as untrusted metadata.
