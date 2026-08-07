---
type: graph-schema
status: active
updated: 2026-08-03
authority: coordination-only
---

# Shared knowledge graph schema

The first graph is Markdown plus Obsidian links. Do not introduce a graph
database until measured retrieval failures, temporal conflicts, or scale make
the extra extraction and maintenance cost worthwhile.

## Note types

- `context-brief`: bounded startup orientation.
- `current-state`: current cross-area facts and material blockers.
- `workstream-register`: collision notes and handoffs.
- `decision`: a durable choice with evidence and consequences.
- `research`: sourced findings that may inform, but do not define, the product.
- `system`, `requirement`, or `artifact`: use only when a dedicated entity note
  materially improves navigation.

## Required properties

Every brain note has `type`, `status`, `updated`, and `authority`. Decisions and
research also identify their sources. Use `active`, `blocked`, `complete`, or
`superseded` for status.

## Link meanings

- `GOVERNS`: an authority controls a system or process.
- `IMPLEMENTS`: code or a workflow realizes a requirement or decision.
- `DEPENDS_ON`: the source needs the target to remain valid.
- `BLOCKS`: the source prevents progress on the target.
- `TOUCHES`: a workstream may collide with an artifact or area.
- `EVIDENCED_BY`: a claim is grounded by the target source.
- `SUPERSEDES`: a newer decision replaces an older one without erasing history.

Write the relationship in prose beside a normal Markdown or Obsidian link.
Every durable claim must remain traceable to an authoritative file, current
check, task, or external source.

## Temporal and provenance fields

When facts change over time, record `observed`, `valid_from`, `valid_to`, and
`supersedes` where applicable. Never silently rewrite historical decisions to
make them appear as if the new rule always existed.
