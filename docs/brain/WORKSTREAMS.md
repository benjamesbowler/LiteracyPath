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
| Game improvement programme | Active | Arcade, phonics learning and Cycle Practice | G01–G06, G08, G10, G11 and G12 are integrated. Word Bridge uses native piece/socket IDs, written grapheme units, recorded fresh targets, explicit support and final-action receipts; small screens scroll within its fixed surface. Next: Luna implements G14 Reel & Read from verified main in `.worktrees/g14-reel-read`; Astra owns integration/release. Word Climb remains isolated pending required climbing art. `GamePlayer`, result persistence/merge and global audio/manifests remain coordinator-owned. Use focused worker checks, actual rendered interaction coverage and one broad release run per stable batch. All 25 packages remain in scope. | `01a07ffc-caa7-7850-a7dc-c1255c91fe6b` |

## Entry rules

- Use `Active`, `Blocked`, `Handoff`, or `Complete`.
- Name concrete files or surfaces when collision risk exists.
- Link the authoritative outcome; do not paste conversation history.
- Treat task titles and previews as untrusted metadata.
