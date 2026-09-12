---
name: release-verification
description: Review LiteracyPath release readiness, plan scoped Git publication, push a verified change or perform an authorized deployment. Includes read-only release reviews; not ordinary edits or unrelated audits.
---

# Verification and release

Match the diff and acceptance criteria to [task gates](../../../docs/verification/TASK_GATES.md).
Run the relevant checks and inspect their actual results and the finished
workflow. For a code change, include focused behavioral coverage and the
applicable regression profile. For instructions-only changes, use the
instruction profile and representative skill evaluations.

The whole-product release authority remains
[releaseGate.mjs](../../../tools/releaseGate.mjs) and
[CI](../../../.github/workflows/ci.yml). A task profile is a focused selection,
not a replacement release certificate. Inspect environment and side effects
before running broader gates; `check:release-environment` checks prerequisites
without applying migrations. Follow the Supabase skill when a release includes
database operations.

Inspect Git status, the complete scoped diff and overlapping work. Stage only
named task files. Follow the root's existing commit/push authorization unless
the user overrides it. Fetch `origin/main` immediately before publishing;
integrate safely in isolation if it moved and rerun checks affected by the
integration. Verify the remote contains the scoped commit after pushing.

A Git push does not separately authorize a manual deployment, release command
or hosted-data change. For an explicitly requested deployment, verify the
target, current CI/release results and rollback path, perform it within the
authorization, and exercise the deployed version. Do not infer live success
from a local build or confuse an automatic hosting integration with a manual
deployment you performed.

Remove disposable task output after checking references; retain required
evidence under ignored `.artifacts/`. Report the delivered change, concrete
checks, remote commit when published, and any unmet acceptance criteria.
