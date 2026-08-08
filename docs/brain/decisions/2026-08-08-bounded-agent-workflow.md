---
type: decision
status: active
date: 2026-08-08
authority: operating-process
---

# Bounded agent workflow

## Decision

LiteracyPath uses three bounded lanes for substantial work:

1. **Research/planning** — current sources, scope, acceptance criteria, risks.
2. **Implementation** — the smallest change that satisfies the brief.
3. **Verification/release** — focused checks, diff review, and evidence-based
   handoff.

The parent task remains responsible for scope, collision safety, merge, and
release decisions. Independent lanes may run in parallel only when they do not
share mutable files or hosted state.

## Why

The supplied multi-agent and memory research consistently points to bounded
orchestration, selective context, and explicit verifiers. The repository
already has local-first memory, focused checks, and release gates, so adding a
hosted memory graph or self-modifying agent would add cost and risk before a
measured need exists.

## Required brief

Delegated work must identify the exact files/surface, non-goals, acceptance
checks, and handoff evidence. Use `AGENT_TASK_BRIEF.md` as the starting form.

## Guardrails

- No agent may broaden scope, rewrite its own instructions, or change release
  authority.
- No remote MCP, hosted memory service, or unknown installer is a default
  dependency.
- Child-facing content, learner data, Supabase changes, production deploys, and
  generated media require parent review and the applicable project gates.
- A benchmark result must include context, elapsed time, cost where available,
  quality evidence, and rework; social engagement or vendor claims are not
  performance evidence.

## Review point

After ten representative tasks (five research/QA and five implementation),
compare the current workflow with these lanes. Adopt additional infrastructure
only if it improves total time and quality without increasing review burden or
weakening privacy and auditability.
