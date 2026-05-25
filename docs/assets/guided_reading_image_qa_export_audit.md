# Guided Reading Image QA Export Audit

Date: 2026-05-25

Source export: `/Users/benjaminbowler/Desktop/literacypath-guided-reading-image-qa.csv`

## Current Export Result

The provided export currently contains only the header row and no page-review rows. No text-picture-match, single-page remake, or whole-book continuity-remake decisions were present to apply.

## Guided Reading QA Options

The Guided Reading Image QA admin page now supports three review outcomes:

- `text-picture match`: keep the current image.
- `no match remake image using text`: request a replacement for one page using that page's exact app text.
- `whole book continuity remake`: request a completely new full image set for the selected book because the current set lacks complete continuity.
- `reject whole book/story`: reject the whole book because the writing/story is weak, lame, nonsensical, or not worth salvaging; the export marks it as `+1 replacement book` for the next development round.

## Whole-Book Continuity Remake Behavior

When `Whole book continuity remake` is selected on any page card, every page in that book is marked `whole_book_continuity_remake`.

For continuity remakes, the Kimi export creates a whole-book section instructing Kimi to remake the complete cover/page image set with full continuity of:

- characters
- clothing/accessories
- setting
- scene sequence
- season
- time of day
- lighting
- recurring props
- illustration style

Kimi does not need a page-by-page explanation of the continuity failure. The export tells Kimi to regenerate the full set from the exact app text and preserve complete continuity across the book.

## Action

- No guided reading image mappings were changed from this CSV.
- The QA UI now includes the requested whole-book continuity remake option.
- The Kimi markdown export now includes single-page remake requests, whole-book continuity remake requests, and whole-book story rejections.
- Whole-book story rejections are not image requests; they add one replacement book to the next guided story development round.
