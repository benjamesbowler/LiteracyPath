---
type: research
status: complete
updated: 2026-08-03
authority: evidence-only
observed: 2026-08-03
---

# Agent memory and second-brain research

## Findings used by the implementation

- Codex supports global and repository guidance, local memories, startup hooks,
  task inspection, and progressive retrieval. These are enough for the first
  version without a separate memory vendor.
- Effective multi-agent memory separates durable insights, task/query state,
  and detailed interactions instead of placing entire histories into every
  prompt.
- Graph memory becomes valuable when relationships, temporal changes,
  contradictions, or provenance chains must be queried directly.
- Full-context replay is expensive. Memory systems can reduce retrieval tokens,
  but vendor and paper benchmarks should be validated against this project's
  real tasks before adopting their infrastructure.

## Sources

- [Codex memories](https://learn.chatgpt.com/docs/customization/memories)
- [Codex AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex hooks](https://learn.chatgpt.com/docs/hooks)
- [Graphiti temporal context graphs](https://help.getzep.com/graphiti/getting-started/overview)
- [G-Memory](https://arxiv.org/pdf/2506.07398)
- [Mem0 research](https://arxiv.org/html/2504.19413v1)
- [Shared graph memory with Neo4j](https://neo4j.com/blog/developer/when-your-agents-share-a-brain-building-multi-agent-memory-with-neo4j/)

## Deferred option

If selective Markdown retrieval later fails on temporal or multi-hop questions,
index these same notes with a local temporal graph and expose it through MCP.
Markdown remains the source of truth and the graph remains rebuildable.
