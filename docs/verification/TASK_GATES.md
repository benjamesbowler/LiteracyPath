# Verification by changed surface

Use the profiles below when their surface changes. Add the focused regression
that reproduces the actual defect and any checks required by its product
standard. These profiles select existing checks; they do not redefine product
thresholds or certify a whole release.

```sh
npm run verify:task -- --list
npm run verify:task -- --plan question-contracts image-integrity
npm run verify:task -- question-contracts image-integrity
```

The [runner](../../tools/agentVerification.mjs) is the single command registry.
It validates all profile names before executing, deduplicates commands and
stops on failure. Inspect `--plan` for the exact commands. Browser checks need
installed Playwright Chromium; audio signal checks need FFmpeg. Generated
checks may write ignored local artifacts, but these profiles do not apply
migrations, seed databases or deploy.

| Profile | When required | Evidence and limits |
| --- | --- | --- |
| `instructions` | Repository instructions, skill triggers, briefs or gate tooling change | Metadata, reference and command integrity plus runner behavior. Also perform the representative model evaluations below. |
| `question-contracts` | Scored content, phonics targets, options, enrichment or scoring changes | Current question policy and assessment contracts. Review literal stimuli and every answer; add the area-specific bank, story or reporting gates. |
| `image-integrity` | Assessment imagery, media resolution or evidence-image rendering changes | Media policy, sizes, real image-error replacement and overwrite risk. Decode and inspect changed images; a path or hash cannot prove the depicted meaning. For non-assessment art use its own runtime and manifest checks as well. |
| `audio-integrity` | Assessment recordings, audio resolution or shared playback changes | Decoded assessment signal and playback-lifecycle contracts. Inspect signal throughout changed speech and listen to the exact words/phonemes. For other audio families run their current generator and surface tests; assessment coverage does not cover them. |
| `mobile-layout` | Child screens, shared controls, responsive layout or accessibility changes | Current device-matrix and child-surface browser tests. Interact with the affected route and inspect rendered fit; emulator evidence is not physical-device proof. Teacher changes use their current state/roster device tests. |
| `supabase-local` | RPC, auth, RLS, migration or data-boundary changes | Source boundary and policy contracts without a hosted write. Add actual changed-SQL behavior in an isolated database; hosted verification needs the authorized target. |
| `regression` | Application code or shared build/runtime infrastructure changes | Unit suite, lint, build and repository hygiene. A passing build does not establish live, media or device behavior. |

Animation requires the direct export, anatomy, continuity, contact, sound and
target-tool checks in the [animation skill](../../.agents/skills/animation-production/SKILL.md)
and current production bible. There is no synthetic "animation passed" alias.

For full-product readiness use the existing [release manifest](../../tools/releaseGate.mjs)
and [CI](../../.github/workflows/ci.yml). `npm run check:release-environment`
checks credentials structurally; it does not establish a live release.
Some broader checks, including `check:db-policies`, invoke mutating seed tools.
Read their implementation and follow current authorization before execution.

## Representative instruction evaluations

[Cases](../../tests/fixtures/agent-instructions/cases.json) contain realistic
prompts, expected skill choices and observable acceptance criteria. When skill
scope or guidance changes:

1. Use a fresh evaluator with only the task prompt and skill name/description
   catalog first. Do not provide expected selections or conclusions.
2. Record selected skills, then let it read those skills and only the sources
   needed to complete the bounded review. Include the negative and mixed cases.
3. Compare its actual response, tool actions and artifacts with each case's
   acceptance criteria. Check for extra approval requests, unrelated reading,
   scope growth and unwarranted completion claims. Correct demonstrated errors.
4. Exercise representative real commands from the chosen profiles. Keep
   secret-free evidence, model identity when available and environment under
   ignored `.artifacts/`. Structural fixture checks alone do not test routing.

Use synthetic/read-only inputs for evaluation. Any implementation evaluation
belongs in a disposable isolated checkout; any extra external mutation still
needs authorization. These cases are regression inputs, not permanent prompts
for ordinary product tasks.
