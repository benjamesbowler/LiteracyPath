# Guided Reading Regeneration Import Audit

Generated: 2026-05-25T04:47:10.189Z

## Source

- Pack root: /Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath Regen Assets Pack
- Zip parts found: 13
  - kimi regeneration 1 - part 1 covers manifest docs.zip
  - kimi regeneration 1 - part 2a pages A fiction.zip
  - kimi regeneration 1 - part 2b pages A nonfiction.zip
  - kimi regeneration 1 - part 2c pages B fiction.zip
  - kimi regeneration 1 - part 2d pages B nonfiction.zip
  - kimi regeneration 1 - part 3a pages C fiction.zip
  - kimi regeneration 1 - part 3b pages C nonfiction.zip
  - kimi regeneration 1 - part 3c pages D fiction.zip
  - kimi regeneration 1 - part 3d pages D nonfiction.zip
  - kimi regeneration 1 - part 3e pages E fiction.zip
  - kimi regeneration 1 - part 3f pages E nonfiction.zip
  - kimi regeneration 1 - part 5 audio levels A-B.zip
  - kimi regeneration 1 - part 6 audio levels C-E.zip
- Merged validation folder: /var/folders/6d/shw6vkc913qdb6jyr157sg_h0000gn/T/lp-guided-regen-validate/guided-reading-regeneration-pack

## Manifest Claims

- Pack name: Guided Reading Regeneration Pack
- Version: 1.0.0
- Claimed total books: 50
- Claimed fiction/nonfiction: 25 / 25
- Claimed levels: {"A":10,"B":10,"C":10,"D":10,"E":10}
- Image policy note: All images contain NO embedded text. All narration audio matches page text word-for-word.

## Discovered Assets After Zip Merge

- Covers found: 50
- Page images found: 276
- Narration MP3 files found: 300
- Orphan media assets: 0

## QA Result

- Books inspected: 50
- Pages inspected: 300
- Books approved for activation: 46
- Pages approved for activation: 276
- Books rejected/kept inactive: 4
- Page-level failures: 24
- Page-level warnings: 0

## Import Result

- Import was not requested for this validation run.
- Existing approved runtime data file present: src/data/guidedReadingRegenBooks.js
- Current pack validation still approves 46 books / 276 pages for activation.

## Book Activation Mapping

| Old Book ID | Title | Level | Type | Decision | Reason | Replacement Mapping |
|---|---|---|---|---|---|---|
| gr-a-01 | The Red Hat | A | fiction | approved | Passed automated strict QA | gr-a-01 -> gr-a-01 |
| gr-a-02 | The Mess | A | fiction | approved | Passed automated strict QA | gr-a-02 -> gr-a-02 |
| gr-a-03 | The Map | A | fiction | approved | Passed automated strict QA | gr-a-03 -> gr-a-03 |
| gr-a-04 | The Box | A | fiction | approved | Passed automated strict QA | gr-a-04 -> gr-a-04 |
| gr-a-05 | The Seed | A | fiction | approved | Passed automated strict QA | gr-a-05 -> gr-a-05 |
| gr-a-26 | Pets | A | nonfiction | approved | Passed automated strict QA | gr-a-26 -> gr-a-26 |
| gr-a-27 | The Sun | A | nonfiction | approved | Passed automated strict QA | gr-a-27 -> gr-a-27 |
| gr-a-28 | Colors | A | nonfiction | approved | Passed automated strict QA | gr-a-28 -> gr-a-28 |
| gr-a-29 | My Body | A | nonfiction | approved | Passed automated strict QA | gr-a-29 -> gr-a-29 |
| gr-a-30 | At the Park | A | nonfiction | rejected | missing page image file: images/pages/gr-a-30-page-01.png; missing page image file: images/pages/gr-a-30-page-02.png; missing page image file: images/pages/gr-a-30-page-03.png; missing page image file: images/pages/gr-a-30-page-04.png; missing page image file: images/pages/gr-a-30-page-05.png; missing page image file: images/pages/gr-a-30-page-06.png | gr-a-30 -> gr-a-30 |
| gr-b-06 | The Picnic | B | fiction | approved | Passed automated strict QA | gr-b-06 -> gr-b-06 |
| gr-b-07 | The Lost Dog | B | fiction | approved | Passed automated strict QA | gr-b-07 -> gr-b-07 |
| gr-b-08 | The Big Hill | B | fiction | approved | Passed automated strict QA | gr-b-08 -> gr-b-08 |
| gr-b-09 | The Rainy Day | B | fiction | approved | Passed automated strict QA | gr-b-09 -> gr-b-09 |
| gr-b-10 | The Gift | B | fiction | rejected | missing page image file: images/pages/gr-b-10-page-01.png; missing page image file: images/pages/gr-b-10-page-02.png; missing page image file: images/pages/gr-b-10-page-03.png; missing page image file: images/pages/gr-b-10-page-04.png; missing page image file: images/pages/gr-b-10-page-05.png; missing page image file: images/pages/gr-b-10-page-06.png | gr-b-10 -> gr-b-10 |
| gr-b-31 | Seasons | B | nonfiction | approved | Passed automated strict QA | gr-b-31 -> gr-b-31 |
| gr-b-32 | Fruits | B | nonfiction | approved | Passed automated strict QA | gr-b-32 -> gr-b-32 |
| gr-b-33 | Tools | B | nonfiction | approved | Passed automated strict QA | gr-b-33 -> gr-b-33 |
| gr-b-34 | Day and Night | B | nonfiction | approved | Passed automated strict QA | gr-b-34 -> gr-b-34 |
| gr-b-35 | Community Helpers | B | nonfiction | approved | Passed automated strict QA | gr-b-35 -> gr-b-35 |
| gr-c-11 | The Camping Trip | C | fiction | approved | Passed automated strict QA | gr-c-11 -> gr-c-11 |
| gr-c-12 | The New Puppy | C | fiction | approved | Passed automated strict QA | gr-c-12 -> gr-c-12 |
| gr-c-13 | The Kite | C | fiction | approved | Passed automated strict QA | gr-c-13 -> gr-c-13 |
| gr-c-14 | The Store | C | fiction | approved | Passed automated strict QA | gr-c-14 -> gr-c-14 |
| gr-c-15 | The Farm Visit | C | fiction | approved | Passed automated strict QA | gr-c-15 -> gr-c-15 |
| gr-c-36 | Bugs | C | nonfiction | approved | Passed automated strict QA | gr-c-36 -> gr-c-36 |
| gr-c-37 | Water | C | nonfiction | approved | Passed automated strict QA | gr-c-37 -> gr-c-37 |
| gr-c-38 | Five Senses | C | nonfiction | approved | Passed automated strict QA | gr-c-38 -> gr-c-38 |
| gr-c-39 | Shapes | C | nonfiction | approved | Passed automated strict QA | gr-c-39 -> gr-c-39 |
| gr-c-40 | Weather | C | nonfiction | rejected | missing page image file: images/pages/gr-c-40-page-01.png; missing page image file: images/pages/gr-c-40-page-02.png; missing page image file: images/pages/gr-c-40-page-03.png; missing page image file: images/pages/gr-c-40-page-04.png; missing page image file: images/pages/gr-c-40-page-05.png; missing page image file: images/pages/gr-c-40-page-06.png | gr-c-40 -> gr-c-40 |
| gr-d-16 | The School Play | D | fiction | approved | Passed automated strict QA | gr-d-16 -> gr-d-16 |
| gr-d-17 | The Tree House | D | fiction | approved | Passed automated strict QA | gr-d-17 -> gr-d-17 |
| gr-d-18 | The Broken Toy | D | fiction | approved | Passed automated strict QA | gr-d-18 -> gr-d-18 |
| gr-d-19 | The Race | D | fiction | approved | Passed automated strict QA | gr-d-19 -> gr-d-19 |
| gr-d-20 | The Magic Show | D | fiction | rejected | missing page image file: images/pages/gr-d-20-page-01.png; missing page image file: images/pages/gr-d-20-page-02.png; missing page image file: images/pages/gr-d-20-page-03.png; missing page image file: images/pages/gr-d-20-page-04.png; missing page image file: images/pages/gr-d-20-page-05.png; missing page image file: images/pages/gr-d-20-page-06.png | gr-d-20 -> gr-d-20 |
| gr-d-41 | Transportation | D | nonfiction | approved | Passed automated strict QA | gr-d-41 -> gr-d-41 |
| gr-d-42 | Our Earth | D | nonfiction | approved | Passed automated strict QA | gr-d-42 -> gr-d-42 |
| gr-d-43 | Healthy Habits | D | nonfiction | approved | Passed automated strict QA | gr-d-43 -> gr-d-43 |
| gr-d-44 | Animal Homes | D | nonfiction | approved | Passed automated strict QA | gr-d-44 -> gr-d-44 |
| gr-d-45 | Space | D | nonfiction | approved | Passed automated strict QA | gr-d-45 -> gr-d-45 |
| gr-e-21 | The Talent Show | E | fiction | approved | Passed automated strict QA | gr-e-21 -> gr-e-21 |
| gr-e-22 | The Garden | E | fiction | approved | Passed automated strict QA | gr-e-22 -> gr-e-22 |
| gr-e-23 | The Sleepover | E | fiction | approved | Passed automated strict QA | gr-e-23 -> gr-e-23 |
| gr-e-24 | The New Neighbor | E | fiction | approved | Passed automated strict QA | gr-e-24 -> gr-e-24 |
| gr-e-25 | The Lost Tooth | E | fiction | approved | Passed automated strict QA | gr-e-25 -> gr-e-25 |
| gr-e-46 | Reptiles | E | nonfiction | approved | Passed automated strict QA | gr-e-46 -> gr-e-46 |
| gr-e-47 | How Things Grow | E | nonfiction | approved | Passed automated strict QA | gr-e-47 -> gr-e-47 |
| gr-e-48 | Magnets | E | nonfiction | approved | Passed automated strict QA | gr-e-48 -> gr-e-48 |
| gr-e-49 | Clothes | E | nonfiction | approved | Passed automated strict QA | gr-e-49 -> gr-e-49 |
| gr-e-50 | Our Five Senses | E | nonfiction | approved | Passed automated strict QA | gr-e-50 -> gr-e-50 |

## Page-Level Failures

| Book ID | Title | Page | Text | Failure reason | Image | Narration |
|---|---|---:|---|---|---|---|
| gr-a-30 | At the Park | 1 | I run at the park. | missing page image file: images/pages/gr-a-30-page-01.png | images/pages/gr-a-30-page-01.png | audio/page-narration/gr-a-30-page-01.mp3 |
| gr-a-30 | At the Park | 2 | I jump at the park. | missing page image file: images/pages/gr-a-30-page-02.png | images/pages/gr-a-30-page-02.png | audio/page-narration/gr-a-30-page-02.mp3 |
| gr-a-30 | At the Park | 3 | I slide at the park. | missing page image file: images/pages/gr-a-30-page-03.png | images/pages/gr-a-30-page-03.png | audio/page-narration/gr-a-30-page-03.mp3 |
| gr-a-30 | At the Park | 4 | I swing at the park. | missing page image file: images/pages/gr-a-30-page-04.png | images/pages/gr-a-30-page-04.png | audio/page-narration/gr-a-30-page-04.mp3 |
| gr-a-30 | At the Park | 5 | I climb at the park. | missing page image file: images/pages/gr-a-30-page-05.png | images/pages/gr-a-30-page-05.png | audio/page-narration/gr-a-30-page-05.mp3 |
| gr-a-30 | At the Park | 6 | I love the park! | missing page image file: images/pages/gr-a-30-page-06.png | images/pages/gr-a-30-page-06.png | audio/page-narration/gr-a-30-page-06.mp3 |
| gr-b-10 | The Gift | 1 | It is Mom's big day. | missing page image file: images/pages/gr-b-10-page-01.png | images/pages/gr-b-10-page-01.png | audio/page-narration/gr-b-10-page-01.mp3 |
| gr-b-10 | The Gift | 2 | Dad and I bake a cake. | missing page image file: images/pages/gr-b-10-page-02.png | images/pages/gr-b-10-page-02.png | audio/page-narration/gr-b-10-page-02.mp3 |
| gr-b-10 | The Gift | 3 | I draw a big red heart. | missing page image file: images/pages/gr-b-10-page-03.png | images/pages/gr-b-10-page-03.png | audio/page-narration/gr-b-10-page-03.mp3 |
| gr-b-10 | The Gift | 4 | I make Mom a card. | missing page image file: images/pages/gr-b-10-page-04.png | images/pages/gr-b-10-page-04.png | audio/page-narration/gr-b-10-page-04.mp3 |
| gr-b-10 | The Gift | 5 | Surprise, Mom! | missing page image file: images/pages/gr-b-10-page-05.png | images/pages/gr-b-10-page-05.png | audio/page-narration/gr-b-10-page-05.mp3 |
| gr-b-10 | The Gift | 6 | Mom gives us a big hug. | missing page image file: images/pages/gr-b-10-page-06.png | images/pages/gr-b-10-page-06.png | audio/page-narration/gr-b-10-page-06.mp3 |
| gr-c-40 | Weather | 1 | Some days are sunny. | missing page image file: images/pages/gr-c-40-page-01.png | images/pages/gr-c-40-page-01.png | audio/page-narration/gr-c-40-page-01.mp3 |
| gr-c-40 | Weather | 2 | Some days are rainy. | missing page image file: images/pages/gr-c-40-page-02.png | images/pages/gr-c-40-page-02.png | audio/page-narration/gr-c-40-page-02.mp3 |
| gr-c-40 | Weather | 3 | Some days are windy. | missing page image file: images/pages/gr-c-40-page-03.png | images/pages/gr-c-40-page-03.png | audio/page-narration/gr-c-40-page-03.mp3 |
| gr-c-40 | Weather | 4 | Some days are cloudy. | missing page image file: images/pages/gr-c-40-page-04.png | images/pages/gr-c-40-page-04.png | audio/page-narration/gr-c-40-page-04.mp3 |
| gr-c-40 | Weather | 5 | Some days are snowy. | missing page image file: images/pages/gr-c-40-page-05.png | images/pages/gr-c-40-page-05.png | audio/page-narration/gr-c-40-page-05.mp3 |
| gr-c-40 | Weather | 6 | What is the weather today? | missing page image file: images/pages/gr-c-40-page-06.png | images/pages/gr-c-40-page-06.png | audio/page-narration/gr-c-40-page-06.mp3 |
| gr-d-20 | The Magic Show | 1 | Leo puts on a magic show. | missing page image file: images/pages/gr-d-20-page-01.png | images/pages/gr-d-20-page-01.png | audio/page-narration/gr-d-20-page-01.mp3 |
| gr-d-20 | The Magic Show | 2 | He waves his magic wand. | missing page image file: images/pages/gr-d-20-page-02.png | images/pages/gr-d-20-page-02.png | audio/page-narration/gr-d-20-page-02.mp3 |
| gr-d-20 | The Magic Show | 3 | Abracadabra, the ball is gone! | missing page image file: images/pages/gr-d-20-page-03.png | images/pages/gr-d-20-page-03.png | audio/page-narration/gr-d-20-page-03.mp3 |
| gr-d-20 | The Magic Show | 4 | The crowd claps and cheers. | missing page image file: images/pages/gr-d-20-page-04.png | images/pages/gr-d-20-page-04.png | audio/page-narration/gr-d-20-page-04.mp3 |
| gr-d-20 | The Magic Show | 5 | Leo takes a big bow. | missing page image file: images/pages/gr-d-20-page-05.png | images/pages/gr-d-20-page-05.png | audio/page-narration/gr-d-20-page-05.mp3 |
| gr-d-20 | The Magic Show | 6 | What a great magic show! | missing page image file: images/pages/gr-d-20-page-06.png | images/pages/gr-d-20-page-06.png | audio/page-narration/gr-d-20-page-06.mp3 |

## Warnings

| Book ID | Title | Page | Text | Warning |
|---|---|---:|---|---|
| none | none | none | none | No warnings. |

## Embedded Text Policy

Pages with non-empty embeddedImageText are rejected unless the embedded text exactly matches the app text. This pack declares embeddedImageText as empty for approved pages; no OCR is used at runtime.

## Runtime Decision

Only complete books with all six page images, cover image, narration files, exact pageAudioText/app-text match, clean punctuation, sequential page numbers, valid level/type, and no embedded text conflicts are exported into the active Guided Reading runtime file.
