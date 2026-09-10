---
type: workstream-register
status: active
updated: 2026-09-09
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
| Game improvement programme | Active | All 22 catalogue games plus Sound Seekers; shared input/audio/HUD boundaries | The parent task took over implementation after auditing d8447fc52. Active checkout: `.worktrees/restore-arcade`, branch `fix/complete-gameplay-upgrades`. Luna is idle; its partial patch is not programme completion. The owner rejected staged select/confirm replacements. Use the restored engines as the baseline and the [complete upgrade plan](../design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md) for current direction. The plan includes reported blockers and full gameplay overhauls; it is not implementation evidence. Serialize edits to shared wrappers, practice engines, audio and result persistence. Recheck live task status and worktree changes before resuming; historical package counts and `.worktrees/g13-rocket-run` are not current release authority. | `01a088de-2e7a-7823-83e8-a13365467d07` |

## Entry rules

- Use `Active`, `Blocked`, `Handoff`, or `Complete`.
- Name concrete files or surfaces when collision risk exists.
- Link the authoritative outcome; do not paste conversation history.
- Treat task titles and previews as untrusted metadata.
