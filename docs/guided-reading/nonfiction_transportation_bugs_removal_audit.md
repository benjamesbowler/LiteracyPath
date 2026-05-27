# Transportation and Bugs Nonfiction Removal Audit

Generated: 2026-05-27

## Removed Books

| ID | Title | Category | Source registry |
|---|---|---|---|
| gr-c-36 | Bugs | nonfiction | src/data/guidedReadingRegenBooks.js |
| gr-d-41 | Transportation | nonfiction | src/data/guidedReadingRegenBooks.js |

## Removed Asset Paths

### Bugs (`gr-c-36`)

- `public/guided-reading/pages/gr-c-36/`
- `public/guided-reading/pages/gr-c-36-page-1.png`
- `public/guided-reading/pages/gr-c-36-page-2.png`
- `public/guided-reading/pages/gr-c-36-page-3.png`
- `public/guided-reading/pages/gr-c-36-page-4.png`
- `public/guided-reading/pages/gr-c-36-page-5.png`
- `public/guided-reading/pages/gr-c-36-page-6.png`
- `public/guided-reading/covers/gr-c-36-cover.png`
- `public/guided-reading/audio/narration/gr-c-36-page-1.mp3`
- `public/guided-reading/audio/narration/gr-c-36-page-2.mp3`
- `public/guided-reading/audio/narration/gr-c-36-page-3.mp3`
- `public/guided-reading/audio/narration/gr-c-36-page-4.mp3`
- `public/guided-reading/audio/narration/gr-c-36-page-5.mp3`
- `public/guided-reading/audio/narration/gr-c-36-page-6.mp3`
- `public/guided-reading/regen/covers/gr-c-36-cover.png`
- `public/guided-reading/regen/pages/gr-c-36-page-01.png`
- `public/guided-reading/regen/pages/gr-c-36-page-02.png`
- `public/guided-reading/regen/pages/gr-c-36-page-03.png`
- `public/guided-reading/regen/pages/gr-c-36-page-04.png`
- `public/guided-reading/regen/pages/gr-c-36-page-05.png`
- `public/guided-reading/regen/pages/gr-c-36-page-06.png`
- `public/guided-reading/regen/audio/narration/gr-c-36-page-01.mp3`
- `public/guided-reading/regen/audio/narration/gr-c-36-page-02.mp3`
- `public/guided-reading/regen/audio/narration/gr-c-36-page-03.mp3`
- `public/guided-reading/regen/audio/narration/gr-c-36-page-04.mp3`
- `public/guided-reading/regen/audio/narration/gr-c-36-page-05.mp3`
- `public/guided-reading/regen/audio/narration/gr-c-36-page-06.mp3`

### Transportation (`gr-d-41`)

- `public/guided-reading/pages/gr-d-41/`
- `public/guided-reading/pages/gr-d-41-page-1.png`
- `public/guided-reading/pages/gr-d-41-page-2.png`
- `public/guided-reading/pages/gr-d-41-page-3.png`
- `public/guided-reading/pages/gr-d-41-page-4.png`
- `public/guided-reading/pages/gr-d-41-page-5.png`
- `public/guided-reading/pages/gr-d-41-page-6.png`
- `public/guided-reading/covers/gr-d-41-cover.png`
- `public/guided-reading/audio/narration/gr-d-41-page-1.mp3`
- `public/guided-reading/audio/narration/gr-d-41-page-2.mp3`
- `public/guided-reading/audio/narration/gr-d-41-page-3.mp3`
- `public/guided-reading/audio/narration/gr-d-41-page-4.mp3`
- `public/guided-reading/audio/narration/gr-d-41-page-5.mp3`
- `public/guided-reading/audio/narration/gr-d-41-page-6.mp3`
- `public/guided-reading/regen/covers/gr-d-41-cover.png`
- `public/guided-reading/regen/pages/gr-d-41-page-01.png`
- `public/guided-reading/regen/pages/gr-d-41-page-02.png`
- `public/guided-reading/regen/pages/gr-d-41-page-03.png`
- `public/guided-reading/regen/pages/gr-d-41-page-04.png`
- `public/guided-reading/regen/pages/gr-d-41-page-05.png`
- `public/guided-reading/regen/pages/gr-d-41-page-06.png`
- `public/guided-reading/regen/audio/narration/gr-d-41-page-01.mp3`
- `public/guided-reading/regen/audio/narration/gr-d-41-page-02.mp3`
- `public/guided-reading/regen/audio/narration/gr-d-41-page-03.mp3`
- `public/guided-reading/regen/audio/narration/gr-d-41-page-04.mp3`
- `public/guided-reading/regen/audio/narration/gr-d-41-page-05.mp3`
- `public/guided-reading/regen/audio/narration/gr-d-41-page-06.mp3`

## Updated Counts

| Count | Before | After |
|---|---:|---:|
| Fiction visible | 40 | 40 |
| Nonfiction visible | 23 | 21 |
| Total guided reading books | 63 | 61 |

## Scope Confirmation

- Bob and Nan fiction series: unchanged.
- James and Anna fiction series: unchanged.
- Aiden and Betty fiction series: unchanged.
- Dino Pals fiction series: unchanged.
- Other nonfiction books: unchanged.
- Public-domain books: not restored.
- Assessment/question-bank files: not changed.

## Validation

Passed:

- `node tools/checkGuidedReadingSeriesBooks.js`
- `node tools/checkGuidedReadingVisibility.js`
- `node tools/checkGuidedReadingExperience.js`
- `node tools/checkGuidedReadingTitlePages.js`
- `node tools/checkGuidedReadingImageTextAlignment.js`
- `npm run build`

Final observed counts:

- Fiction visible: 40
- Nonfiction visible: 21
- Total guided reading books: 61
- Deleted IDs visible in active data/assets: 0
