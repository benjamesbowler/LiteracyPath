# Screen Usage Audit — every user-facing page

*Method note: Chrome wasn't connectable for live pixel measurement, so
these figures are computed from the stylesheets - each screen's container
width vs available viewport (minus page padding and, for teacher pages,
the sidebar). They are exact for width; vertical fill is estimated from
the known section heights and your screenshots. Deterministic, but worth
one visual spot-check after the next deploy.*

## Width utilization by device + vertical fill

| Screen | Who | 1440 | 1280 | 1024 | 768 | 390 | Vertical fill (laptop) |
|---|---|---|---|---|---|---|---|
| Entry (workspace choice) | public | 77% | 87% | 100% | 100% | 100% | ~88% |
| Teacher login/signup | public | 83% | 94% | 100% | 100% | 100% | ~90% |
| Child login (school/class/name/pictures) | child | 77% | 87% | 100% | 100% | 100% | ~86% |
| Child home (mission/explore) | child | 77% | 87% | 100% | 100% | 100% | ~92% |
| Skills Quest map | child | 87% | 98% | 100% | 100% | 100% | ~90% |
| Skills Quest stations | child | 66% | 74% | 93% | 100% | 100% | ~78% |
| Skills Quest round | child | 87% | 98% | 100% | 100% | 100% | ~85% |
| Phonics letters grid | child | 83% | 94% | 100% | 100% | 100% | ~88% |
| Phonics letter lesson | child | 64% | 73% | 91% | 100% | 100% | ~80% |
| Word Workshop | child | 69% | 77% | 98% | 100% | 100% | ~80% |
| Game arcade | child | 80% | 90% | 100% | 100% | 100% | ~95% |
| In-game stage | child | 61% | 69% | 87% | 100% | 100% | ~82% |
| Reading Library shelves | child | 84% | 95% | 100% | 100% | 100% | ~88% |
| Book reader | child | 91% | 100% | 100% | 100% | 100% | ~96% |
| Story Quest player | child | 94% | 100% | 100% | 100% | 100% | ~94% |
| Teacher dashboard | teacher | 100% | 100% | 100% | 100% | 100% | ~90% |
| Reports | teacher | 100% | 100% | 100% | 100% | 100% | ~88% |
| Guided reading (teacher tools) | teacher | 100% | 100% | 100% | 100% | 100% | ~88% |
| Admin dashboard | teacher | 100% | 100% | 100% | 100% | 100% | ~86% |
| EL checks / assessments | teacher | 100% | 100% | 100% | 100% | 100% | ~92% |


## Headlines

- **Average width utilization: 1440px laptop 84%, 1280px laptop 93%,
  iPad 99%+, phone 100%.** The product is now genuinely full-width on
  everything up to a 13" laptop; only large monitors show side margins,
  and most premium apps cap line length there on purpose.
- **Average vertical fill ~88%** - the worst offenders from your
  screenshots (phonics letters at ~55%, quest stations in a skinny
  column) were fixed in the last push and now sit at ~78-90%.
- **Remaining worst screens (worth one more pass):**
  1. Skills Quest stations - 66% width at 1440 (intentionally narrow
     list; could go 3-up).
  2. In-game stage - 60-ish% width at 1440 by design (focus panel);
     fine, but the backdrop world art now fills the rest.
  3. Phonics letter lesson + Word Workshop steps - 80% vertical, some
     bottom slack on tall screens.
- **Scrolling rule status:** child home, arcade, quest map, and game
  screens fit one screen on a 1280x800 laptop. Phonics letters grid
  still wraps below the fold on small laptops (5 rows + header) - the
  one child screen left that can scroll on laptop. On iPad portrait and
  phone, scrolling is natural and intended.

## Space wasted (the inverse view, laptop 1440)

Wasted = side margins + vertical slack. Top 5 by wasted area:
station list (~40%), in-game stage chrome (~35%, deliberate), phonics
lesson steps (~28%), child login card (~25%), entry page (~25%).
Teacher dashboard, reports, admin: under 12% wasted (fluid layouts).
