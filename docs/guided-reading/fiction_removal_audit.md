# Guided Reading Fiction Removal Audit

Generated: 2026-05-26T06:23:39.047Z

## Removal Decision

All Guided Reading fiction books and fiction-only assets are being permanently removed from the active app. Nonfiction books, the Guided Reading reader architecture, title-page normalization, QA tools, and assessment systems are retained.

## Fiction Books To Remove

Counted registry rows: 71

The table below includes duplicate references across the active export, source registries, and draft story registry so the cleanup can be audited back to every source file. The active student-facing Guided Reading shelf had 28 fiction books before removal; after cleanup it has 0 fiction books and 23 nonfiction books.

| ID | Title | Level | Type | Registry | Source File | Cover Path | Page Image Folder(s) | Audio Folder(s) |
|---|---|---|---|---|---|---|---|---|
| gr-a-01 | The Red Hat | A | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-01-cover.png | /guided-reading/regen/pages/gr-a-01-page-* | /guided-reading/regen/audio/narration/gr-a-01-page-* |
| gr-a-02 | The Mess | A | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-02-cover.png | /guided-reading/regen/pages/gr-a-02-page-* | /guided-reading/regen/audio/narration/gr-a-02-page-* |
| gr-a-03 | The Map | A | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-03-cover.png | /guided-reading/regen/pages/gr-a-03-page-* | /guided-reading/regen/audio/narration/gr-a-03-page-* |
| gr-a-04 | The Box | A | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-04-cover.png | /guided-reading/regen/pages/gr-a-04-page-* | /guided-reading/regen/audio/narration/gr-a-04-page-* |
| gr-a-05 | The Seed | A | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-05-cover.png | /guided-reading/regen/pages/gr-a-05-page-* | /guided-reading/regen/audio/narration/gr-a-05-page-* |
| gr-b-06 | The Picnic | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-06-cover.png | /guided-reading/regen/pages/gr-b-06-page-* | /guided-reading/regen/audio/narration/gr-b-06-page-* |
| gr-b-07 | The Lost Dog | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-07-cover.png | /guided-reading/regen/pages/gr-b-07-page-* | /guided-reading/regen/audio/narration/gr-b-07-page-* |
| gr-b-08 | The Big Hill | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-08-cover.png | /guided-reading/regen/pages/gr-b-08-page-* | /guided-reading/regen/audio/narration/gr-b-08-page-* |
| gr-b-09 | The Rainy Day | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-09-cover.png | /guided-reading/regen/pages/gr-b-09-page-* | /guided-reading/regen/audio/narration/gr-b-09-page-* |
| gr-c-11 | The Camping Trip | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-11-cover.png | /guided-reading/pages/gr-c-11/ | /guided-reading/regen/audio/narration/gr-c-11-page-* |
| gr-c-12 | The New Puppy | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-12-cover.png | /guided-reading/pages/gr-c-12/ | /guided-reading/regen/audio/narration/gr-c-12-page-* |
| gr-c-13 | The Kite | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-13-cover.png | /guided-reading/pages/gr-c-13/ | /guided-reading/regen/audio/narration/gr-c-13-page-* |
| gr-c-14 | The Store | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-14-cover.png | /guided-reading/pages/gr-c-14/ | /guided-reading/regen/audio/narration/gr-c-14-page-* |
| gr-c-15 | The Farm Visit | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-15-cover.png | /guided-reading/pages/gr-c-15/ | /guided-reading/regen/audio/narration/gr-c-15-page-* |
| gr-d-16 | The School Play | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-16-cover.png | /guided-reading/pages/gr-d-16/ | /guided-reading/regen/audio/narration/gr-d-16-page-* |
| gr-d-17 | The Tree House | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-17-cover.png | /guided-reading/pages/gr-d-17/ | /guided-reading/regen/audio/narration/gr-d-17-page-* |
| gr-d-18 | The Broken Toy | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-18-cover.png | /guided-reading/pages/gr-d-18/ | /guided-reading/regen/audio/narration/gr-d-18-page-* |
| gr-d-19 | The Race | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-19-cover.png | /guided-reading/pages/gr-d-19/ | /guided-reading/regen/audio/narration/gr-d-19-page-* |
| gr-e-21 | The Talent Show | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-21-cover.png | /guided-reading/pages/gr-e-21/ | /guided-reading/regen/audio/narration/gr-e-21-page-* |
| gr-e-22 | The Garden | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-22-cover.png | /guided-reading/pages/gr-e-22/ | /guided-reading/regen/audio/narration/gr-e-22-page-* |
| gr-e-23 | The Sleepover | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-23-cover.png | /guided-reading/pages/gr-e-23/ | /guided-reading/regen/audio/narration/gr-e-23-page-* |
| gr-e-24 | The New Neighbor | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-24-cover.png | /guided-reading/pages/gr-e-24/ | /guided-reading/regen/audio/narration/gr-e-24-page-* |
| gr-e-25 | The Lost Tooth | B | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-25-cover.png | /guided-reading/pages/gr-e-25/ | /guided-reading/regen/audio/narration/gr-e-25-page-* |
| gs-c-01 | The Lion and the Little Mouse | C | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/covers/gs-c-01-cover.webp | /guided-reading/pages/gs-c-01/ | none |
| gs-c-02 | The Crow and the Water Jar | C | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/covers/gs-c-02-cover.webp | /guided-reading/pages/gs-c-02/ | none |
| gs-c-03 | The Fox and the High Grapes | C | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/covers/gs-c-03-cover.webp | /guided-reading/pages/gs-c-03/ | none |
| gs-c-04 | The Dog and the River Shadow | C | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/covers/gs-c-04-cover.webp | /guided-reading/pages/gs-c-04/ | none |
| gs-c-06 | The Bell in the Tree | C | fiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/covers/gs-c-06-cover.webp | /guided-reading/pages/gs-c-06/ | none |
| gr-a-01 | The Red Hat | A | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-a-01-cover.png | /guided-reading/regen/pages/gr-a-01-page-* | /guided-reading/regen/audio/narration/gr-a-01-page-* |
| gr-a-02 | The Mess | A | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-a-02-cover.png | /guided-reading/regen/pages/gr-a-02-page-* | /guided-reading/regen/audio/narration/gr-a-02-page-* |
| gr-a-03 | The Map | A | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-a-03-cover.png | /guided-reading/regen/pages/gr-a-03-page-* | /guided-reading/regen/audio/narration/gr-a-03-page-* |
| gr-a-04 | The Box | A | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-a-04-cover.png | /guided-reading/regen/pages/gr-a-04-page-* | /guided-reading/regen/audio/narration/gr-a-04-page-* |
| gr-a-05 | The Seed | A | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-a-05-cover.png | /guided-reading/regen/pages/gr-a-05-page-* | /guided-reading/regen/audio/narration/gr-a-05-page-* |
| gr-b-06 | The Picnic | B | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-b-06-cover.png | /guided-reading/regen/pages/gr-b-06-page-* | /guided-reading/regen/audio/narration/gr-b-06-page-* |
| gr-b-07 | The Lost Dog | B | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-b-07-cover.png | /guided-reading/regen/pages/gr-b-07-page-* | /guided-reading/regen/audio/narration/gr-b-07-page-* |
| gr-b-08 | The Big Hill | B | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-b-08-cover.png | /guided-reading/regen/pages/gr-b-08-page-* | /guided-reading/regen/audio/narration/gr-b-08-page-* |
| gr-b-09 | The Rainy Day | B | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-b-09-cover.png | /guided-reading/regen/pages/gr-b-09-page-* | /guided-reading/regen/audio/narration/gr-b-09-page-* |
| gr-c-11 | The Camping Trip | C | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-c-11-cover.png | /guided-reading/pages/gr-c-11/ | /guided-reading/regen/audio/narration/gr-c-11-page-* |
| gr-c-12 | The New Puppy | C | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-c-12-cover.png | /guided-reading/pages/gr-c-12/ | /guided-reading/regen/audio/narration/gr-c-12-page-* |
| gr-c-13 | The Kite | C | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-c-13-cover.png | /guided-reading/pages/gr-c-13/ | /guided-reading/regen/audio/narration/gr-c-13-page-* |
| gr-c-14 | The Store | C | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-c-14-cover.png | /guided-reading/pages/gr-c-14/ | /guided-reading/regen/audio/narration/gr-c-14-page-* |
| gr-c-15 | The Farm Visit | C | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-c-15-cover.png | /guided-reading/pages/gr-c-15/ | /guided-reading/regen/audio/narration/gr-c-15-page-* |
| gr-d-16 | The School Play | D | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-d-16-cover.png | /guided-reading/pages/gr-d-16/ | /guided-reading/regen/audio/narration/gr-d-16-page-* |
| gr-d-17 | The Tree House | D | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-d-17-cover.png | /guided-reading/pages/gr-d-17/ | /guided-reading/regen/audio/narration/gr-d-17-page-* |
| gr-d-18 | The Broken Toy | D | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-d-18-cover.png | /guided-reading/pages/gr-d-18/ | /guided-reading/regen/audio/narration/gr-d-18-page-* |
| gr-d-19 | The Race | D | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-d-19-cover.png | /guided-reading/pages/gr-d-19/ | /guided-reading/regen/audio/narration/gr-d-19-page-* |
| gr-e-21 | The Talent Show | E | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-e-21-cover.png | /guided-reading/pages/gr-e-21/ | /guided-reading/regen/audio/narration/gr-e-21-page-* |
| gr-e-22 | The Garden | E | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-e-22-cover.png | /guided-reading/pages/gr-e-22/ | /guided-reading/regen/audio/narration/gr-e-22-page-* |
| gr-e-23 | The Sleepover | E | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-e-23-cover.png | /guided-reading/pages/gr-e-23/ | /guided-reading/regen/audio/narration/gr-e-23-page-* |
| gr-e-24 | The New Neighbor | E | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-e-24-cover.png | /guided-reading/pages/gr-e-24/ | /guided-reading/regen/audio/narration/gr-e-24-page-* |
| gr-e-25 | The Lost Tooth | E | fiction | guidedReadingRegenBooks source | src/data/guidedReadingRegenBooks.js | /guided-reading/regen/covers/gr-e-25-cover.png | /guided-reading/pages/gr-e-25/ | /guided-reading/regen/audio/narration/gr-e-25-page-* |
| gs-c-01 | The Lion and the Little Mouse | C | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | /guided-reading/covers/gs-c-01-cover.webp | /guided-reading/pages/gs-c-01/ | none |
| gs-c-02 | The Crow and the Water Jar | C | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | /guided-reading/covers/gs-c-02-cover.webp | /guided-reading/pages/gs-c-02/ | none |
| gs-c-03 | The Fox and the High Grapes | C | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | /guided-reading/covers/gs-c-03-cover.webp | /guided-reading/pages/gs-c-03/ | none |
| gs-c-04 | The Dog and the River Shadow | C | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | /guided-reading/covers/gs-c-04-cover.webp | /guided-reading/pages/gs-c-04/ | none |
| gs-d-01 | The Tortoise Takes Each Step | D | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-d-02 | The Ant Saves a Crumb | D | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-d-03 | The Bundle That Would Not Break | D | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-d-04 | Two Mice, Two Homes | D | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-e-01 | The Three Small Houses | E | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-e-02 | Golda and the Three Bowls | E | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-e-03 | The Gingerbread Runner | E | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-e-04 | The Helpful Shoemaker Elves | E | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-f-01 | The Small Duck Who Kept Going | F | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-f-02 | Jack and the Tall Bean Vine | F | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-f-03 | The Quiet Pea | F | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-f-04 | Hare and Hedgehog at the Field | F | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-c-06 | The Bell in the Tree | C | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | /guided-reading/covers/gs-c-06-cover.webp | /guided-reading/pages/gs-c-06/ | none |
| gs-d-06 | Mina and the Broken Bridge | D | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-e-06 | The Lantern Path | E | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |
| gs-f-06 | The Fox and the Rain Jar | F | fiction | guidedStoryBooks source | src/data/guidedStoryBooks.js | none | (page paths listed per file in data) | none |

## Nonfiction Books To Keep

Count: 23

| ID | Title | Level | Type | Registry | Source File | Cover Path | Page Image Folder(s) | Audio Folder(s) |
|---|---|---|---|---|---|---|---|---|
| gr-a-26 | Pets | A | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-26-cover.png | /guided-reading/regen/pages/gr-a-26-page-* | /guided-reading/regen/audio/narration/gr-a-26-page-* |
| gr-a-27 | The Sun | A | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-27-cover.png | /guided-reading/regen/pages/gr-a-27-page-* | /guided-reading/regen/audio/narration/gr-a-27-page-* |
| gr-a-28 | Colors | A | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-28-cover.png | /guided-reading/regen/pages/gr-a-28-page-* | /guided-reading/regen/audio/narration/gr-a-28-page-* |
| gr-a-29 | My Body | A | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-a-29-cover.png | /guided-reading/regen/pages/gr-a-29-page-* | /guided-reading/regen/audio/narration/gr-a-29-page-* |
| gr-b-31 | Seasons | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-31-cover.png | /guided-reading/regen/pages/gr-b-31-page-* | /guided-reading/regen/audio/narration/gr-b-31-page-* |
| gr-b-32 | Fruits | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-32-cover.png | /guided-reading/regen/pages/gr-b-32-page-* | /guided-reading/regen/audio/narration/gr-b-32-page-* |
| gr-b-33 | Tools | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-33-cover.png | /guided-reading/regen/pages/gr-b-33-page-* | /guided-reading/regen/audio/narration/gr-b-33-page-* |
| gr-b-34 | Day and Night | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-34-cover.png | /guided-reading/regen/pages/gr-b-34-page-* | /guided-reading/regen/audio/narration/gr-b-34-page-* |
| gr-b-35 | Community Helpers | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-b-35-cover.png | /guided-reading/regen/pages/gr-b-35-page-* | /guided-reading/regen/audio/narration/gr-b-35-page-* |
| gr-c-36 | Bugs | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-36-cover.png | /guided-reading/pages/gr-c-36/ | /guided-reading/regen/audio/narration/gr-c-36-page-* |
| gr-c-37 | Water | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-37-cover.png | /guided-reading/regen/pages/gr-c-37-page-* | /guided-reading/regen/audio/narration/gr-c-37-page-* |
| gr-c-38 | Five Senses | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-38-cover.png | /guided-reading/regen/pages/gr-c-38-page-* | /guided-reading/regen/audio/narration/gr-c-38-page-* |
| gr-c-39 | Shapes | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-c-39-cover.png | /guided-reading/regen/pages/gr-c-39-page-* | /guided-reading/regen/audio/narration/gr-c-39-page-* |
| gr-d-41 | Transportation | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-41-cover.png | /guided-reading/pages/gr-d-41/ | /guided-reading/regen/audio/narration/gr-d-41-page-* |
| gr-d-42 | Our Earth | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-42-cover.png | /guided-reading/regen/pages/gr-d-42-page-* | /guided-reading/regen/audio/narration/gr-d-42-page-* |
| gr-d-43 | Healthy Habits | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-43-cover.png | /guided-reading/regen/pages/gr-d-43-page-* | /guided-reading/regen/audio/narration/gr-d-43-page-* |
| gr-d-44 | Animal Homes | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-44-cover.png | /guided-reading/regen/pages/gr-d-44-page-* | /guided-reading/regen/audio/narration/gr-d-44-page-* |
| gr-d-45 | Space | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-d-45-cover.png | /guided-reading/regen/pages/gr-d-45-page-* | /guided-reading/regen/audio/narration/gr-d-45-page-* |
| gr-e-46 | Reptiles | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-46-cover.png | /guided-reading/regen/pages/gr-e-46-page-* | /guided-reading/regen/audio/narration/gr-e-46-page-* |
| gr-e-47 | How Things Grow | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-47-cover.png | /guided-reading/regen/pages/gr-e-47-page-* | /guided-reading/regen/audio/narration/gr-e-47-page-* |
| gr-e-48 | Magnets | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-48-cover.png | /guided-reading/regen/pages/gr-e-48-page-* | /guided-reading/regen/audio/narration/gr-e-48-page-* |
| gr-e-49 | Clothes | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-49-cover.png | /guided-reading/regen/pages/gr-e-49-page-* | /guided-reading/regen/audio/narration/gr-e-49-page-* |
| gr-e-50 | Our Five Senses | B | nonfiction | guidedReadingBooks export | src/data/guidedReadingBooks.js | /guided-reading/regen/covers/gr-e-50-cover.png | /guided-reading/regen/pages/gr-e-50-page-* | /guided-reading/regen/audio/narration/gr-e-50-page-* |

## Asset Removal Scope

Fiction-only cover, page, narration, replacement-backup, and QA-remake files matching the removed fiction book ids are deleted. Nonfiction ids are preserved.
