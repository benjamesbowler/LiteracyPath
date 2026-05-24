# LP Assets

This folder is a clean, deduplicated local backup of the Kimi/LiteracyPath asset pack folders found on the Desktop.

It is an archive, not the active app runtime. The LiteracyPath application still uses its existing assets under `public/` and data manifests under `src/data/`.

## Important Safety Notes

- Original Kimi/source folders were not deleted, moved, or modified.
- Active LiteracyPath runtime paths were not changed.
- Exact duplicate files were skipped from canonical folders and recorded in the master manifest.
- Same-key conflicts were preserved under `images/review-needed` or `audio/review-needed` with suffixes.
- Unsupported/archive files are listed under `rejected/unsupported/unsupported-files.json`.

## Key Files

- Master manifest JSON: `manifests/lp-assets-master-manifest.json`
- Master manifest CSV: `manifests/lp-assets-master-manifest.csv`
- Consolidation report: `reports/asset_consolidation_report.md`

## How To Use Later

Use this folder as a reference library when choosing future production assets. Before moving anything into the active LiteracyPath app, run the app's normal validation and approved-audio checks. Do not treat review-needed alternatives as approved assets without human review.

## Actual Location

The requested Desktop-level path was `/Users/benjaminbowler/Desktop/LP Assets`, but the current sandbox cannot write there directly. This backup was created at:

`/Users/benjaminbowler/Desktop/LiteracyPath/LP Assets`
