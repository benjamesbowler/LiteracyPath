# Guided Reading Layout Audit

Date: 2026-05-24

## Summary

The Guided Reading library layout was tightened so book cards behave like a stable library grid instead of unstable wrapped tiles. The fixes focus on preventing horizontal overflow, clipped titles, uneven card heights, and mobile overlap while preserving the existing category -> level -> book flow, completion ticks, reading tracking, and report/export behavior.

## Problems Fixed

- Book cards used a grid row structure that no longer matched the card contents, which allowed title/meta/action content to compress or spill.
- Mobile rules forced each book card into a small horizontal mini-card layout, causing clipped titles and crowded metadata.
- The book grid allowed inconsistent card widths and did not fully guard against nested overflow.
- Cover images inherited generic page-image sizing, which made cover ratios inconsistent.
- Long titles had no dedicated wrapping/clamping rule.

## Layout Rules Applied

- Guided Reading page width is constrained to a centered `1180px` content area.
- Category, level, and book sections use CSS grid with `minmax()` columns and explicit overflow guards.
- Desktop book grid uses `auto-fit` with a `176px` minimum, allowing roughly 4-6 cards per row depending on available width.
- Tablet breakpoint uses three book cards per row.
- Mobile breakpoint uses two compact book cards per row.
- Very narrow phone screens switch to one card per row for readability.

## Book Card Rules

- Cards are equal-height grid items with a fixed internal structure:
  - cover wrapper
  - cover image or generated fallback cover
  - info wrapper
  - title
  - metadata
  - Read / Read Again button
- Covers use a consistent `3 / 4` aspect ratio.
- Cover images use `object-fit: cover` on standard card layouts and switch to `contain` on very narrow single-column layouts.
- Titles are line-clamped to two lines and wrap safely inside card bounds.
- Metadata wraps inside card bounds without escaping the card.
- Completion badges remain pinned in the card corner without affecting layout flow.
- The Read / Read Again button is inside the card markup, not floating as an outside sibling.

## Regression Guard Notes

- `.guided-book-card` must remain a contained card with `overflow: hidden`.
- `.guided-book-cover-wrap` must keep a fixed `3 / 4` aspect ratio and explicit max-height.
- `.guided-book-cover` must keep `width: 100%`, `height: 100%`, and `object-fit`.
- Book cards should keep `.guided-book-info` as the title/meta/action container.
- Do not return to loose cover/title/meta/action siblings without a cover wrapper and info wrapper.

## Responsive Breakpoints

- Base/desktop: `repeat(auto-fit, minmax(min(176px, 100%), 1fr))`
- `max-width: 820px`: three book cards per row
- `max-width: 560px`: two book cards per row
- `max-width: 390px`: one book card per row

## Remaining UI Concerns

- This pass stabilizes layout and card rendering only. It does not review the artistic quality of individual covers.
- Visual browser QA may depend on whether the local dev server can bind in the current environment.
