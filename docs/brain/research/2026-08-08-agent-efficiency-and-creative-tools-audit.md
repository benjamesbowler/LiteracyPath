# Agent efficiency and creative-tools audit

**Date:** 2026-08-08  
**Scope:** the eight supplied X posts, MotionSites, and the implications for LiteracyPath.

## Executive decision

The useful pattern across the sources is **bounded orchestration + selective memory + explicit verification**. LiteracyPath already has the strongest part of this foundation: a local-first project brain, targeted retrieval, focused checks, and release gates. We should improve the operating pattern before adding another hosted agent platform.

No new agent platform, hosted memory service, remote MCP, or pipe-to-shell installer was added as part of this audit. The supplied Prime Agent installer and the Seedance skill offered through a social-media DM are not sufficiently trustworthy or necessary for the current project. `agent-reach` was checked and is already current (`v1.5.0`).

## Source digest

| Source | What it claims or demonstrates | Confidence | LiteracyPath relevance |
|---|---|---:|---|
| [RoundtableSpace: Google multi-agent course](https://x.com/RoundtableSpace/status/2085761636304884107) | A free, roughly two-hour course about moving from one prompt to many agents in a graph. | Medium | Useful training for graph-shaped workflows, but the exact course/video was not independently identified. Use official Google ADK material instead. |
| [RoundtableSpace: Codex subagent tip](https://x.com/RoundtableSpace/status/2084130890507329609) | Configure a custom Codex worker with a cheaper/different model, bounded instructions, and parent validation. | Medium | The pattern is useful. The named `gpt-5.6-luna` model and exact config are not installed or verified here. |
| [Viktor Oddy: MotionSites MCP](https://x.com/viktoroddy/status/2085737284692041743) | MotionSites exposes a large library of animated websites, backgrounds, prompts, sections, and apps through MCP. | Medium | Good source of visual references and prompt patterns. Not an application runtime dependency. |
| [TwoClipping: Seedance skill](https://x.com/twoclipping/status/2085247950700020061) | A Claude skill based on a claimed official Seedance 2.5 guide, with 23 task types and 67 templates. | Low/marketing | The prompt ideas are useful; the skill and numeric claims were not independently verified. Do not install from a DM or pipe an unknown package into the repo. |
| [unicodef1wn: Obsidian graph memory](https://x.com/unicodef1wn/status/2085514401407226070) | A router/index/nodes/edges approach can answer from a few relevant files instead of reading an entire vault. | Medium | Strongly matches our existing `START-HERE.md`, `MAP.md`, and bounded retrieval model. Improve measurement and routing before adding a graph database. |
| [Viktor Oddy: Claude 3D course](https://x.com/viktoroddy/status/2085358189395280254) | A one-hour course for building 3D games and websites with Claude. | Low/marketing | Potential inspiration for visual prototyping; not a dependency or evidence of educational quality. |
| [N01ennn: PlugMem](https://x.com/N01ennn/status/2085100042566701419) | A memory module compiles experience into a knowledge graph and retrieves high-utility facts, claiming much lower context use. | Medium-high for the paper; low for the post's numeric framing | The principle is valuable. The paper is research evidence, not a reason to buy a hosted memory product. |
| [Miles Deutscher: Prime Agent](https://x.com/milesdeutscher/status/2085399864259858487) | A self-improving harness can rewrite prompts, memory, and skills, coordinate persistent subagents, and achieve a claimed ARC-AGI-3 score. | Low for the product/benchmark claims | Borrow evaluation and context-slicing ideas. Do not install the shell command without a specific, reviewed need. |
| [MotionSites](https://motionsites.ai/) | A paid prompt/content library for Lovable, Bolt, Cursor, Claude, and MCP; the page advertises premium packs and an MCP endpoint. | High for observed site behavior | Useful as an optional design-reference catalogue. Hosted MCP would send prompts/tool activity to a third party and should remain opt-in. |

## Primary-source cross-checks

- [Microsoft Research: PlugMem](https://www.microsoft.com/en-us/research/publication/plugmem-a-task-agnostic-plugin-memory-module-for-llm-agents/) describes task-agnostic, knowledge-centric memory that stores reusable knowledge units and retrieves relevant knowledge rather than replaying raw trajectories. This supports the principle of selective memory, not the post's “100x” guarantee.
- [Google ADK course](https://www.cloudskillsboost.google/course_templates/1275?locale=en), [ADK codelab](https://codelabs.developers.google.com/adkcourse/instructions?hl=en), and [ADK Go graph workflow announcement](https://developers.googleblog.com/announcing-adk-go-20/) support graph workflows, parallel agents, human-in-the-loop, and telemetry. They do not establish that every LiteracyPath task should become multi-agent.
- [Prime Intellect's RLM](https://www.primeintellect.ai/blog/rlm), [Lab](https://www.primeintellect.ai/blog/lab-is-open), and [Verifiers v1](https://www.primeintellect.ai/blog/verifiers-v1) support programmable context slicing, harnesses, verifiers, and measured improvement. These are safer principles to adopt than the unverified Prime Agent installer/score claim.
- [ByteDance Seed](https://seed.bytedance.com/en/seed2) confirms the Seedance family. A practical [Seedance 2.5 guide](https://dreamina.capcut.com/seedance/seedance-2-5-prompt) exists, but the supplied post's “23 task types / 67 templates” claim was not confirmed from an official ByteDance source.

## What to adopt now

### 1. Three bounded work lanes

For substantial work, use a small graph rather than an open-ended swarm:

1. **Research/planning:** gather current sources, define acceptance criteria, and identify risks.
2. **Implementation:** make the smallest scoped change with no authority to broaden the task.
3. **Verification/release:** run focused checks, inspect the diff, and decide whether the evidence is sufficient.

The parent task owns scope, merges only reviewed changes, and remains the human checkpoint for child-facing, data, production, and hosted-service decisions.

### 2. Knowledge units instead of transcript accumulation

When a finding is durable, record only:

- decision or current state;
- source/evidence and date;
- affected files or workflow;
- reusable action and its limits.

Route it through the existing project brain index. Do not add raw transcripts, generated dependency graphs, or whole-vault retrieval. This is the practical version of the PlugMem/Obsidian insight and is already consistent with the repository's local-first policy.

### 3. Add measurement before infrastructure

For ten representative tasks, compare the current process with bounded retrieval and parallel independent checks:

| Measure | Record |
|---|---|
| Context | files/bytes/tokens supplied to the agent |
| Speed | elapsed time to a reviewable result |
| Cost | model/API spend where available |
| Quality | focused-test result plus reviewer defects found |
| Rework | number of correction turns or reverted edits |

Only consider a graph database, hosted memory, or new harness if this baseline shows a repeatable gain without weakening privacy, auditability, or educational QA.

### 4. Use creative tools as pre-production references

MotionSites and 3D/Seedance material can help us explore layouts, motion language, and media prompts. Any asset used in LiteracyPath still needs the existing construct, accessibility, licensing, child-safety, and human-listening/visual QA gates. Generative video should be treated as a pre-generated asset, never as an unreviewed runtime dependency or a replacement for curated phonics audio.

## Do not adopt yet

- **Prime Agent installer:** do not run `curl ... | sh`; the installer is opaque, the product claims were not verified from a primary source, and existing Codex collaboration covers our immediate needs.
- **MotionSites MCP in production:** do not add the remote endpoint to the project by default. It is a hosted service with premium gating and analytics; use it only after a deliberate privacy, cost, and account decision.
- **Seedance skill from a DM:** do not install or send private project content to it. Recreate only the prompt structure we need from primary/known sources.
- **A self-modifying swarm:** agents must not rewrite their own production prompts, permissions, release gates, or Supabase behavior without parent review.
- **A hosted memory vendor:** our current local-first brain is cheaper, inspectable, and already integrated with repository rules.

## Recommended next experiment

Run one two-week internal benchmark on real LiteracyPath tasks: five research/QA tasks and five implementation tasks. Compare the current single-parent workflow against the three bounded lanes above. Keep the experiment local, use existing Codex collaboration, and capture the five measures in the table. If it wins on quality and total time without increasing review burden, formalize the lane templates in `AGENTS.md` and the project brain. If not, keep the current workflow and record the negative result.

## Research limitations

Direct X pages were unavailable to the research reader because X returned an access block; the post text was checked through a public status mirror and the original X links are retained above. Social-post engagement numbers and promotional claims were not treated as evidence of product quality. No external account, MCP, package, or installer was added during this audit.
