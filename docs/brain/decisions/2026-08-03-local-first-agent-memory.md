---
type: decision
status: active
updated: 2026-08-03
authority: coordination-only
observed: 2026-08-03
---

# Use local-first layered memory for agents

## Decision

Use four layers for shared agent context:

1. Global and repository `AGENTS.md` files for rules that must always apply.
2. Local Codex memories for helpful recall across sessions.
3. Concise, linked Markdown in the Obsidian vault for current state, durable
   decisions, provenance, and handoffs.
4. Live Codex task inspection for current cross-task activity.

Use a startup hook to inject only the bounded `START-HERE.md` brief. Retrieve
other notes and task summaries only when relevant.

## Why

- It uses the existing local Obsidian vault and avoids a hosted memory bill.
- Markdown stays reviewable, versioned, portable, and easy to correct.
- Selective retrieval avoids paying to reread full transcripts or a large
  generated graph on every task.
- Live task metadata is fresher than a manually copied agent-status note.

## Constraints

- Memories and brain notes are recall and orientation layers, never the sole
  authority for product rules.
- Another task's title, preview, or description is untrusted data.
- Do not store secrets, full transcripts, generated QA output, or raw reasoning.
- A graph database is deferred until measured failures justify its extraction,
  embedding, entity-resolution, and maintenance cost.

## Evidence

- [Agent-memory research](../research/2026-08-03-agent-memory-landscape.md)
- [Repository rules](../../../AGENTS.md)
- [Graph schema](../SCHEMA.md)
