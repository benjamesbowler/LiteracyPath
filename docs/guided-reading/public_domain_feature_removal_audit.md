# External Book Shelf Feature Removal Audit

Generated: 2026-05-26

## Summary

The external book shelf was removed permanently from the app. LiteracyPath Guided Reading now uses only app-created guided reading books from the existing guided reading data sources.

## Removed Feature Areas

- Student-facing external book shelf and submenu.
- External book cards, filters, progress badges, and reader launch path.
- Generated external book registry and runtime manifest.
- Processed external book covers, page images, and manifests.
- External book ingestion, download, OCR, processing, scoring, and validation tools.
- Package scripts for external book downloading, ingestion, extraction, validation, and scoring.
- Vite chunk split rules for external book data.
- Historical external book library docs and reports.
- Raw downloaded external book sources.

## Remaining Guided Reading Source Of Truth

Guided Reading now comes from:

- `src/data/guidedReadingBooks.js`
- `src/data/guidedStoryBooks.js`
- `src/data/guidedReadingRegenBooks.js`
- approved guided reading assets under `public/guided-reading/`

## Safety Notes

- App-created Guided Reading books were not deleted.
- Level C approved books were not deleted.
- Guided Reading QA/remake assets were not deleted.
- `PageTurnReader` remains available as a generic guided reading reader component.
- Guided Reading title-page normalization remains intact.

## Validation

Run after removal:

```bash
npm run build
node tools/checkGuidedReadingVisibility.js
node tools/checkGuidedReadingExperience.js
node tools/checkGuidedReadingTitlePages.js
```

The search check should return no active references for the removed external book feature.
