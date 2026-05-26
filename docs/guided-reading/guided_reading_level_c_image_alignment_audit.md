# Guided Reading Level C Image Alignment Audit

Generated: 2026-05-26

## Scope

Books checked:

- `gs-c-01` - The Lion and the Little Mouse
- `gs-c-02` - The Crow and the Water Jar
- `gs-c-03` - The Fox and the High Grapes
- `gs-c-04` - The Dog and the River Shadow
- `gs-c-06` - The Bell in the Tree

## Root Cause

The reader was receiving story page text as page 1 while the visual sequence also included cover/title art. That made the images appear one page out of step with the text in the reading experience.

## Fix Applied

Guided Reading now normalizes every app-created book with a reader title page:

1. Reader page 1 is the cover/title page.
2. Reader page 1 text is the title, author line, and illustrator line.
3. Original story page 1 becomes reader page 2.
4. Story page images keep their original story page numbering.

No global Level C one-page image remap is used. The old remap helper was removed from the Level C wrapper so page order is not silently shifted to compensate for the missing title page.

## Validation

The current alignment check verifies that the Level C reader page 1 is a title page and that each story page uses the image with the same story page number.

Run:

```bash
node tools/checkGuidedReadingTitlePages.js
node tools/checkGuidedReadingImageTextAlignment.js
```

Current result:

- Level C books checked: 5
- Level C story pages checked: 50
- Image/text alignment failures: 0
- Title page failures: 0

## Remaining QA Guidance

This pass fixes the mechanical sequencing drift. It does not claim every image is semantically perfect. The next QA round should review whether each picture clearly captures the main idea of its now-correct page text.
