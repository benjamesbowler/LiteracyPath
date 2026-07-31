# LiteracyPath repository rules

## Authority

The current working application is the product authority. Start with the live
runtime imports, `package.json`, and `docs/INDEX.md`. A file that is not wired
into the current app, a current check, or a current operational requirement is
not allowed to redefine product behaviour.

Keep one authoritative source for each rule, dataset, bank, layout, and media
selection path. When a replacement is adopted, remove the superseded source
instead of keeping an alternative, archive, compatibility fallback, or dated
audit beside it.

## Rules that must not return

- No approval, publication, or quality gate may depend on Benjamin or any other
  named person signing it off.
- Do not introduce provider-owned product rules or current filenames such as
  Claude-, Codex-, Kimi-, or model-specific authority.
- Do not restore historical assessment banks, runtime shards, media requests,
  audit evidence, scorecards, preview artifacts, or production scratch output.
- Do not invent or revive a pass rate, confidence target, simulation threshold,
  bundle budget, or other numeric gate from an old document. A current numeric
  policy must have one live definition and current behavioral coverage.
- Generated reports and temporary QA evidence belong in ignored `.artifacts`
  or operating-system temporary storage, not in the documentation tree.

## Change discipline

- Preserve current user-visible behavior unless the requested change says to
  alter it.
- Delete disconnected code and assets only after confirming they have no live
  runtime, package-script, test, or operational reference.
- Do not restore deleted files merely because Git still lists them as tracked
  deletions in an uncommitted cleanup.
- Keep `docs/INDEX.md` and
  `docs/CURRENT_SYSTEM_CLEANUP_2026-07-31.md` aligned with any authority change.
- Do not commit, push, publish, deploy, or mutate hosted data unless the user
  explicitly requests that external action.

## Verification

Use checks that exercise the changed current system. For broad source cleanup,
the normal local evidence is:

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run check:audit:assessment-rebuild` when assessment sources change
- `npm run check:repo-hygiene` when repository contents change

Report any environment that was not actually exercised. A historical audit or
an approval record is never a substitute for a current check.
