# LP Assets Usage Audit

Generated: 2026-05-29

## Summary

`LP Assets/` is a tracked archive inside the repository, not an active runtime asset folder.

| Check | Result |
| --- | --- |
| Folder size | 879 MB |
| Files on disk | 1,500 including `.DS_Store` files |
| Files tracked by Git | 1,497 |
| Main file types | 931 MP3, 552 PNG, 10 JSON, 1 DOCX, 1 CSV, 2 MD |
| Direct app/runtime references to `LP Assets/` paths | None found |
| Direct references found | `tools/consolidateLocalAssets.js` and prior audit docs |
| Active app asset source | `public/`, `src/data/`, and generated manifests |

The folder README describes it as a clean, deduplicated local backup of Kimi/LiteracyPath asset pack folders. It explicitly says the app still uses assets under `public/` and data manifests under `src/data/`.

## References Found

Direct references to the literal `LP Assets` path:

| File | Purpose |
| --- | --- |
| `tools/consolidateLocalAssets.js` | Creates/consolidates the archive and writes its README/manifest. |
| `docs/implementation/bundle_size_and_repo_hygiene_audit.md` | Prior hygiene audit notes that the folder is tracked and large. |

No source code, CSS, runtime data file, Vite config, package script, or public manifest was found loading an asset using an `LP Assets/...` path.

## Asset Name Overlap

Many filenames inside `LP Assets/` also exist as active assets under `public/`, such as common word audio filenames. This means basename-only matches are not reliable evidence that `LP Assets/` itself is used by the app. The active references point to paths such as:

- `/audio/child-mode/...`
- `/audio/child-mode/clean-human/...`
- `/media/...`
- `/guided-reading/...`

They do not point to `LP Assets/...`.

## Referenced Files

No individual file inside `LP Assets/` appears to be referenced by direct `LP Assets/...` path from app runtime code.

## Unreferenced Files

By direct path usage, all 1,497 tracked files in `LP Assets/` appear unreferenced by the app. They should still be treated as a source/archive collection until the project owner confirms whether the archive is needed.

## Safety Recommendation

Do not delete `LP Assets/`.

Recommended next action for a later cleanup pass:

1. Copy or move the archive outside the repo, ideally to `/Users/benjaminbowler/Desktop/LP Assets` or a cloud/archive drive.
2. Confirm the moved archive has the same file count and size.
3. In a separate commit, untrack the folder with `git rm --cached -r "LP Assets"` while keeping the local files.
4. Keep `LP Assets/` in `.gitignore` so future archive copies are not re-added.
5. Run the normal app checks after untracking to confirm no runtime dependency was hidden.

## Current Phase 1 Action

Only `.gitignore` was updated to ignore future `LP Assets/` additions. No archive files were deleted, moved, or untracked.
