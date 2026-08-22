---
type: current-state
status: active
updated: 2026-08-22
authority: orientation-only
---

# Current state

## Stable project facts

- LiteracyPath is the current product repository and its running application
  is the final behavioural authority.
- The repository root is also the Obsidian vault. Markdown remains the owned,
  reviewable source; Obsidian supplies search, links, backlinks, properties,
  Bases, and graph navigation.
- The authoritative documentation entry point is [Documentation index](../INDEX.md).
- Shared agent context uses a local-first system: concise project notes,
  global Codex guidance, local Codex memories, and live task inspection.
- Generated dependency graphs and task transcripts are not project memory.
  Retrieve code and current task details only when needed.

## Current coordination rule

Live task state is read from Codex rather than copied here. Use
[Workstreams](WORKSTREAMS.md) only for durable collision warnings, blockers,
and handoffs. A task that changes an authoritative rule must update the
authoritative source and, when the choice is durable, record a linked decision.

## Known blockers

No second-brain infrastructure blocker is recorded. The Codex startup hook was
installed, reviewed, and trusted on 2026-08-03.

## Current beta release state

- Pending media is test-visible during beta without being labelled human
  approved. Quarantined pairings remain excluded immediately. The governing
  decision is `decisions/2026-08-15-beta-media-test-visibility.md`.
- The school-linked parent area is implemented at `/parent`. Teachers explicitly
  invite a guardian, release family-safe report snapshots, and can revoke access;
  guardians cannot read teacher evidence or another family's records directly.
- The linked Supabase project was verified on 2026-08-22 with migrations applied
  through `20260822123000` and all 94 current browser RPCs visible to PostgREST.
  The two remaining database-lint warnings are older volatility declarations in
  `lp_quest_merge_mastery` and `lp_merge_transfer_missions`; neither is part of
  the guardian portal. Recheck hosted state before relying on this dated
  observation for a later release.
