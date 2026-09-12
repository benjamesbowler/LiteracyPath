---
type: context-brief
status: active
updated: 2026-09-12
authority: orientation-only
---

# LiteracyPath shared context

LiteracyPath is a React/Vite literacy application. Its current runtime imports
and automated checks establish the active system; [repository rules](../../AGENTS.md)
and the relevant standards in [the documentation index](../INDEX.md) govern changes.

Inspect Git status and overlapping active tasks before editing. Consult
[Workstreams](WORKSTREAMS.md) for shared-surface handoffs; retrieve
[Current state](NOW.md) or [the knowledge map](MAP.md) when the task needs them.
Do not load the whole brain or historical audits at startup.

Repository skills live in `.agents/skills/`. Select by task, then read only that
skill's relevant references. [Agent workflow](../engineering/AGENT_WORKFLOW.md)
explains discovery, task briefs and validation when changing this setup.

For content release, the current [pass-by-exception decision](decisions/2026-08-21-continuous-qa-pass-by-exception.md)
means missing review metadata is not a waiting queue. Reported defects remain
quarantined until verified; automated evidence never implies human observation.

Write back only changed durable decisions, blockers and handoffs. Keep generated
reports in ignored `.artifacts/`; keep credentials and transcripts out of the brain.
