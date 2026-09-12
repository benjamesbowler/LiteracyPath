# Selective repository guidance

The repository keeps a short root contract and task-specific skills. Normal
work starts with `AGENTS.md` and the compact brain brief, selects a skill by its
description, and retrieves the authoritative source for that area. It does
not load every skill, product bible, historical decision or audit.

| Location | Responsibility |
| --- | --- |
| [AGENTS.md](../../AGENTS.md) | Scope, authority, privacy, collision safety, completion and Git authorization |
| [.agents/skills/](../../.agents/skills) | Discoverable domain workflows; body loaded only when relevant |
| [Task brief](../brain/AGENT_TASK_BRIEF.md) | Outcome, scope, observable acceptance, necessary context and verification |
| [Task gates](../verification/TASK_GATES.md) | Which current checks and direct evidence apply |
| [Decisions](../brain/decisions) | Durable rationale and provenance, retrieved when needed |

## Skill discovery

| Skill | Trigger |
| --- | --- |
| [literacy-qa](../../.agents/skills/literacy-qa/SKILL.md) | Questions, phonics, reading content, scoring or reports |
| [media-production](../../.agents/skills/media-production/SKILL.md) | Images, narration, phoneme cues or media mappings |
| [animation-production](../../.agents/skills/animation-production/SKILL.md) | Character rigs, animated scenes and exported films |
| [supabase-changes](../../.agents/skills/supabase-changes/SKILL.md) | Database behavior, migration, RPC, RLS or access boundaries |
| [ui-verification](../../.agents/skills/ui-verification/SKILL.md) | Layout, responsive interaction, accessibility or game presentation |
| [release-verification](../../.agents/skills/release-verification/SKILL.md) | Scoped Git publication, readiness or requested deployment |

A task may need several skills or none. A README typo needs no media, database
or animation workflow. A CSS transition is UI work; an animated character film
is animation work. Skills never replace explicit user intent, expand scope or
create another approval requirement for an already authorized action.

Start a new task with the repository as its working directory. Codex discovers
`.agents/skills` from that directory up to the repository root. Starting in a
parent folder does not discover skills in a child repository. If a host does
not expose repository skills, read the matching linked skill directly. This
layout travels with Git and does not require a global installation or an API key.

## Model and instruction boundaries

This migration targets GPT-6 Astra's documented sensitivity to conflicting
context, while keeping product guidance independent of a model name. It does
not modify application AI calls, model routing, user settings or installed
global plugins. Choose a requested execution model in the host's real model
selector; writing a model name in a prompt cannot switch it.

The prior 14 imported design/prompt presets and their lockfile were removed
after checking their references. Their general style prescriptions conflicted
with the project's own design, motion and child-layout standards; the new UI,
media and animation skills route to those standards. Historical provenance is
available in Git rather than another active compatibility copy.

Use [the instruction evaluation procedure](../verification/TASK_GATES.md#representative-instruction-evaluations)
when changing triggers or guidance. Run `npm run check:agent-instructions` for
reference integrity and `npm run verify:task -- instructions` for runner checks.
Keep evaluation output out of this document. Root/skill byte counts measure
repository text, not total tokens injected by a host or a performance improvement.

## Official guidance verified for the migration

- [GPT-6 Astra instruction following](https://developers.openai.com/api/docs/guides/latest-model#gpt-6-astra-instruction-following): clarify the priority of user intent over skill guidance and identify an instruction that causes a pause.
- [Codex skills](https://developers.openai.com/codex/skills/): concise descriptions, progressive disclosure, repository discovery and trigger testing.

The supplied [OpenAI Developers post](https://x.com/openaidevs/status/2098480213244117065)
was inaccessible during the migration; the implementation is based on the
official documentation above, retrieved on 2026-09-12.
