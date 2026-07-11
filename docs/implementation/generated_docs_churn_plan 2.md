# Generated Docs Churn Plan

Generated: 2026-05-29

## Current Shape

Tracked/generated documentation is useful for QA, but many validation commands rewrite reports on each run. That creates noisy diffs and makes it harder to see real feature changes.

| Folder | File count at audit time | Churn risk |
| --- | ---: | --- |
| `docs/assets/` | 80 | High |
| `docs/guided-reading/` | 34 | Medium |
| `docs/validation/` | 48 | High |
| `docs/implementation/` | 9 | Low/medium |
| Total tracked docs in these folders | 170 | High |

## Should Stay Tracked

These are intentional project records and should normally stay tracked:

- Human-authored implementation docs in `docs/implementation/`
- Guided reading import/removal audit docs that explain irreversible content decisions
- Kimi request docs that are actively handed off for media generation
- Final import reports for media packs that were actually applied
- Schema/setup notes, such as signup approval implementation notes

Examples:

- `docs/implementation/roadmap.md`
- `docs/implementation/signup_approval_access_control.md`
- `docs/guided-reading/*_import_audit.md`
- `docs/guided-reading/*_removal_audit.md`
- `docs/assets/kimi_*_request.md` when actively used for generation

## Generated But Not Usually Committed

These are valuable during QA runs, but they are often rewritten by validation scripts and should not be included in routine feature commits unless the user explicitly wants the new report snapshot:

- `docs/validation/*_audit.md`
- `docs/validation/*_audit.json`
- `docs/validation/*_check.md`
- `docs/assets/*_coverage.md`
- `docs/assets/audio_quality_audit.md`
- `docs/assets/image_quality_audit.md`
- `docs/assets/media_coverage_report.md`
- `docs/assets/usable_vocab_media_inventory.*`
- `docs/assets/suspect_audio_quarantine.md`

Recent validation commands rewrote files such as:

- `docs/validation/full_question_bank_audit.md`
- `docs/validation/question_bank_quality_audit.md`
- `docs/validation/skill_bank_master_audit.md`
- `docs/validation/skill_progression_audit.md`
- `docs/assets/assessment_asset_coverage.md`
- `docs/assets/audio_quality_audit.md`

## Move To `docs/generated/` Later

A later cleanup pass should consider moving frequently regenerated outputs into a dedicated generated-docs area:

- `docs/generated/validation/`
- `docs/generated/assets/`
- `docs/generated/guided-reading/`

That would make it clearer which docs are stable project history and which are machine output.

Recommended candidates:

- `docs/validation/*.json`
- `docs/validation/*_audit.md`
- `docs/assets/*_coverage.md`
- `docs/assets/*_inventory.json`
- `docs/assets/*_inventory.md`

## Ignore Later

Do not ignore these yet in Phase 1, because some workflows still expect them to be visible and tracked. In a later pass, after scripts are updated to write into `docs/generated/`, consider ignoring:

- `docs/generated/**`
- temporary editor swap files such as `*.swp` if not already covered
- local-only import scratch reports

`.gitignore` already has `*.sw?`, so swap files are covered for new files.

## Commit Hygiene Recommendation

Before future commits:

1. Run `git status --short`.
2. Separate source/code changes from generated report churn.
3. Avoid `git add .`.
4. Stage generated docs only when they are the deliverable or when the user asks for the updated audit snapshot.
5. Keep feature commits narrow: code + directly relevant docs, not every regenerated report.

## Current Phase 1 Action

No tracking rules were changed for docs. This plan is documentation only.
