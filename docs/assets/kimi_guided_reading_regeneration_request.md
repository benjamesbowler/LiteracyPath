# Kimi Guided Reading Regeneration Request

Generated: 2026-05-24T04:57:16.828Z

## Source Audit

Use the QA findings in `docs/guided-reading/guided_reading_content_audit.md`. The current Pack 8 Guided Reading books are disabled because page images often contain embedded story text and visual details that conflict with the app text/narration.

## Non-Negotiable Requirements

- Create replacement assets only. Do not reuse the current mismatched page art.
- Images must contain **no embedded text**, labels, captions, signs, book-page copy, speech bubbles, title text, or decorative readable words.
- Each book must have exactly 6 coherent pages plus one cover.
- Page narration audio must match the app text exactly, word-for-word, including contractions and punctuation intent.
- Neutral, clean human voice only. No robotic/TTS sound, odd intonation, clipped endings, or spelling words letter-by-letter.
- Images must clearly show the nouns/actions in the page text. If the app text says map, show a map. If it says night, show night.
- Maintain fiction/nonfiction type and Level A-E control. Do not make Level A/B babyish or nonsensical.
- Keep characters visually consistent across all six pages of a fiction book.
- Use culturally neutral/global classroom, home, nature, and community visuals. No copyrighted characters, logos, brands, or styles.
- Filenames must match the requested filenames exactly.

## Required Output Structure

```text
guided-reading-regeneration-pack/
  guided_reading_regeneration_manifest.json
  images/
    covers/
    pages/
  audio/
    page-narration/
  docs/
    generation_notes.md
    copyright_notes.md
```

## Manifest Schema Required

Each book entry must include:

```json
{
  "id": "gr-a-01",
  "title": "Example Title",
  "type": "fiction",
  "level": "A",
  "active": true,
  "qaStatus": "approved",
  "targetSkills": [
    "short a CVC"
  ],
  "coverImage": "images/covers/gr-a-01-cover.png",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Exact app text.",
      "image": "images/pages/gr-a-01-page-01.png",
      "imageAlt": "Alt text.",
      "pageDescription": "Plain description of what the illustration shows.",
      "embeddedImageText": "",
      "targetWords": [
        "exact",
        "app",
        "text"
      ],
      "decodableFocus": [
        "short a"
      ],
      "highFrequencyWords": [
        "the"
      ],
      "pageAudio": "audio/page-narration/gr-a-01-page-01.mp3",
      "pageAudioText": "Exact app text.",
      "qaStatus": "approved",
      "qaNotes": "No embedded image text."
    }
  ]
}
```

## Book Requests

### gr-a-01: The Red Hat Plan

- Type: fiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: short a CVC, simple HFW
- Theme/learning goal: solving a small classroom problem
- Cover filename: `images/covers/gr-a-01-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Red Hat Plan`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Nan has a red hat. | `images/pages/gr-a-01-page-01.png` | Illustrate this page only: Nan has a red hat. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a CVC, simple HFW, Nan, red, hat, has, a |
| 2 | The hat is on the mat. | `images/pages/gr-a-01-page-02.png` | Illustrate this page only: The hat is on the mat. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a CVC, simple HFW, hat, mat, The, is, on, the |
| 3 | Nan can not get the hat. | `images/pages/gr-a-01-page-03.png` | Illustrate this page only: Nan can not get the hat. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a CVC, simple HFW, Nan, hat, can, not, get, the |
| 4 | Sam has a plan. | `images/pages/gr-a-01-page-04.png` | Illustrate this page only: Sam has a plan. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a CVC, simple HFW, Sam, plan, has, a |
| 5 | Sam can tap the mat. | `images/pages/gr-a-01-page-05.png` | Illustrate this page only: Sam can tap the mat. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a CVC, simple HFW, Sam, tap, mat, can, the |
| 6 | Nan can get the hat! | `images/pages/gr-a-01-page-06.png` | Illustrate this page only: Nan can get the hat! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a CVC, simple HFW, Nan, hat, can, get, the |

Audio files required:

- `audio/page-narration/gr-a-01-page-01.mp3`: Nan has a red hat.
- `audio/page-narration/gr-a-01-page-02.mp3`: The hat is on the mat.
- `audio/page-narration/gr-a-01-page-03.mp3`: Nan can not get the hat.
- `audio/page-narration/gr-a-01-page-04.mp3`: Sam has a plan.
- `audio/page-narration/gr-a-01-page-05.mp3`: Sam can tap the mat.
- `audio/page-narration/gr-a-01-page-06.mp3`: Nan can get the hat!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-02: Sam Can Help

- Type: fiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: CVC, can, help
- Theme/learning goal: kindness during cleanup
- Cover filename: `images/covers/gr-a-02-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Sam Can Help`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The class has a mess. | `images/pages/gr-a-02-page-01.png` | Illustrate this page only: The class has a mess. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC, can, help, class, mess, The, has, a |
| 2 | Cans and bags are on the rug. | `images/pages/gr-a-02-page-02.png` | Illustrate this page only: Cans and bags are on the rug. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC, can, help, Cans, bags, rug, and, are, on, the |
| 3 | Sam can pick up the cans. | `images/pages/gr-a-02-page-03.png` | Illustrate this page only: Sam can pick up the cans. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC, can, help, Sam, pick, cans, can, up, the |
| 4 | Sam can pick up the bags. | `images/pages/gr-a-02-page-04.png` | Illustrate this page only: Sam can pick up the bags. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC, can, help, Sam, pick, bags, can, up, the |
| 5 | I can help, says Nan. | `images/pages/gr-a-02-page-05.png` | Illustrate this page only: I can help, says Nan. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC, can, help, Nan, can, help, says |
| 6 | The class is clean! | `images/pages/gr-a-02-page-06.png` | Illustrate this page only: The class is clean! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC, can, help, class, clean, The, is |

Audio files required:

- `audio/page-narration/gr-a-02-page-01.mp3`: The class has a mess.
- `audio/page-narration/gr-a-02-page-02.mp3`: Cans and bags are on the rug.
- `audio/page-narration/gr-a-02-page-03.mp3`: Sam can pick up the cans.
- `audio/page-narration/gr-a-02-page-04.mp3`: Sam can pick up the bags.
- `audio/page-narration/gr-a-02-page-05.mp3`: I can help, says Nan.
- `audio/page-narration/gr-a-02-page-06.mp3`: The class is clean!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-03: The Map in the Bag

- Type: fiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: short a, map, bag
- Theme/learning goal: using a map to find a lost item
- Cover filename: `images/covers/gr-a-03-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Map in the Bag`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Nan and Sam see a bag. | `images/pages/gr-a-03-page-01.png` | Illustrate this page only: Nan and Sam see a bag. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a, map, bag, Nan, Sam, bag, and, see, a |
| 2 | A map is in the bag! | `images/pages/gr-a-03-page-02.png` | Illustrate this page only: A map is in the bag! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a, map, bag, map, bag, is, in, the |
| 3 | The map has an X. | `images/pages/gr-a-03-page-03.png` | Illustrate this page only: The map has an X. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a, map, bag, map, The, has, an |
| 4 | Nan and Sam run to the X. | `images/pages/gr-a-03-page-04.png` | Illustrate this page only: Nan and Sam run to the X. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a, map, bag, Nan, Sam, run, and, to, the |
| 5 | The X is on a mat. | `images/pages/gr-a-03-page-05.png` | Illustrate this page only: The X is on a mat. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a, map, bag, mat, is, on, a |
| 6 | A red pen is on the mat! | `images/pages/gr-a-03-page-06.png` | Illustrate this page only: A red pen is on the mat! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short a, map, bag, red, pen, mat, is, on, the |

Audio files required:

- `audio/page-narration/gr-a-03-page-01.mp3`: Nan and Sam see a bag.
- `audio/page-narration/gr-a-03-page-02.mp3`: A map is in the bag!
- `audio/page-narration/gr-a-03-page-03.mp3`: The map has an X.
- `audio/page-narration/gr-a-03-page-04.mp3`: Nan and Sam run to the X.
- `audio/page-narration/gr-a-03-page-05.mp3`: The X is on a mat.
- `audio/page-narration/gr-a-03-page-06.mp3`: A red pen is on the mat!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-04: Kit and the Big Box

- Type: fiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: short i/o, big, box
- Theme/learning goal: sharing space and taking turns
- Cover filename: `images/covers/gr-a-04-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Kit and the Big Box`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Kit sees a big box. | `images/pages/gr-a-04-page-01.png` | Illustrate this page only: Kit sees a big box. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short i/o, big, box, Kit, box, sees, a, big |
| 2 | I sit in the box, says Kit. | `images/pages/gr-a-04-page-02.png` | Illustrate this page only: I sit in the box, says Kit. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short i/o, big, box, sit, box, Kit, in, the, says |
| 3 | Dot sees the big box. | `images/pages/gr-a-04-page-03.png` | Illustrate this page only: Dot sees the big box. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short i/o, big, box, Dot, box, sees, the, big |
| 4 | I sit in the box, says Dot. | `images/pages/gr-a-04-page-04.png` | Illustrate this page only: I sit in the box, says Dot. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short i/o, big, box, sit, box, Dot, in, the, says |
| 5 | You sit. I sit. We sit! | `images/pages/gr-a-04-page-05.png` | Illustrate this page only: You sit. I sit. We sit! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short i/o, big, box, You, sit, We |
| 6 | The box is fun for Kit and Dot! | `images/pages/gr-a-04-page-06.png` | Illustrate this page only: The box is fun for Kit and Dot! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short i/o, big, box, box, Kit, Dot, The, is, fun, for, and |

Audio files required:

- `audio/page-narration/gr-a-04-page-01.mp3`: Kit sees a big box.
- `audio/page-narration/gr-a-04-page-02.mp3`: I sit in the box, says Kit.
- `audio/page-narration/gr-a-04-page-03.mp3`: Dot sees the big box.
- `audio/page-narration/gr-a-04-page-04.mp3`: I sit in the box, says Dot.
- `audio/page-narration/gr-a-04-page-05.mp3`: You sit. I sit. We sit!
- `audio/page-narration/gr-a-04-page-06.mp3`: The box is fun for Kit and Dot!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-05: Nan and the Seed

- Type: fiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: short e, seed vocabulary in context
- Theme/learning goal: patience as a seed sprouts
- Cover filename: `images/covers/gr-a-05-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Nan and the Seed`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Nan has a seed. | `images/pages/gr-a-05-page-01.png` | Illustrate this page only: Nan has a seed. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short e, seed vocabulary in context, Nan, seed, has, a |
| 2 | Nan puts the seed in a pot. | `images/pages/gr-a-05-page-02.png` | Illustrate this page only: Nan puts the seed in a pot. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short e, seed vocabulary in context, Nan, puts, seed, pot, the, in, a |
| 3 | Nan gets a wet rag. | `images/pages/gr-a-05-page-03.png` | Illustrate this page only: Nan gets a wet rag. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short e, seed vocabulary in context, Nan, wet, rag, gets, a |
| 4 | The seed is in the wet rag. | `images/pages/gr-a-05-page-04.png` | Illustrate this page only: The seed is in the wet rag. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short e, seed vocabulary in context, seed, wet, rag, The, is, in, the |
| 5 | Nan lets the seed rest. | `images/pages/gr-a-05-page-05.png` | Illustrate this page only: Nan lets the seed rest. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short e, seed vocabulary in context, Nan, seed, lets, the, rest |
| 6 | The seed is a plant! | `images/pages/gr-a-05-page-06.png` | Illustrate this page only: The seed is a plant! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short e, seed vocabulary in context, seed, plant, The, is, a |

Audio files required:

- `audio/page-narration/gr-a-05-page-01.mp3`: Nan has a seed.
- `audio/page-narration/gr-a-05-page-02.mp3`: Nan puts the seed in a pot.
- `audio/page-narration/gr-a-05-page-03.mp3`: Nan gets a wet rag.
- `audio/page-narration/gr-a-05-page-04.mp3`: The seed is in the wet rag.
- `audio/page-narration/gr-a-05-page-05.mp3`: Nan lets the seed rest.
- `audio/page-narration/gr-a-05-page-06.mp3`: The seed is a plant!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-26: What Is a Map?

- Type: nonfiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: map, road, park
- Theme/learning goal: maps show places
- Cover filename: `images/covers/gr-a-26-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `What Is a Map?`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | A map shows a place. | `images/pages/gr-a-26-page-01.png` | Illustrate this page only: A map shows a place. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | map, road, park, map, place, A, shows, a |
| 2 | This map shows a park. | `images/pages/gr-a-26-page-02.png` | Illustrate this page only: This map shows a park. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | map, road, park, map, park, This, shows, a |
| 3 | The park has a road. | `images/pages/gr-a-26-page-03.png` | Illustrate this page only: The park has a road. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | map, road, park, park, road, The, has, a |
| 4 | The road has a path. | `images/pages/gr-a-26-page-04.png` | Illustrate this page only: The road has a path. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | map, road, park, road, path, The, has, a |
| 5 | The path has a pond. | `images/pages/gr-a-26-page-05.png` | Illustrate this page only: The path has a pond. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | map, road, park, path, pond, The, has, a |
| 6 | A map helps you see a place! | `images/pages/gr-a-26-page-06.png` | Illustrate this page only: A map helps you see a place! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | map, road, park, map, place, A, helps, you, see, a |

Audio files required:

- `audio/page-narration/gr-a-26-page-01.mp3`: A map shows a place.
- `audio/page-narration/gr-a-26-page-02.mp3`: This map shows a park.
- `audio/page-narration/gr-a-26-page-03.mp3`: The park has a road.
- `audio/page-narration/gr-a-26-page-04.mp3`: The road has a path.
- `audio/page-narration/gr-a-26-page-05.mp3`: The path has a pond.
- `audio/page-narration/gr-a-26-page-06.mp3`: A map helps you see a place!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-27: Day and Night

- Type: nonfiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: sun, moon, sky
- Theme/learning goal: basic day/night cycle
- Cover filename: `images/covers/gr-a-27-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Day and Night`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The sun is in the sky. | `images/pages/gr-a-27-page-01.png` | Illustrate this page only: The sun is in the sky. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sun, moon, sky, sun, sky, The, is, in, the |
| 2 | It is day. | `images/pages/gr-a-27-page-02.png` | Illustrate this page only: It is day. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sun, moon, sky, day, It, is |
| 3 | The sun goes down. | `images/pages/gr-a-27-page-03.png` | Illustrate this page only: The sun goes down. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sun, moon, sky, sun, The, goes, down |
| 4 | The moon is in the sky. | `images/pages/gr-a-27-page-04.png` | Illustrate this page only: The moon is in the sky. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sun, moon, sky, moon, sky, The, is, in, the |
| 5 | It is night. | `images/pages/gr-a-27-page-05.png` | Illustrate this page only: It is night. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sun, moon, sky, night, It, is |
| 6 | Day and night go round and round! | `images/pages/gr-a-27-page-06.png` | Illustrate this page only: Day and night go round and round! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sun, moon, sky, Day, night, and, go, round |

Audio files required:

- `audio/page-narration/gr-a-27-page-01.mp3`: The sun is in the sky.
- `audio/page-narration/gr-a-27-page-02.mp3`: It is day.
- `audio/page-narration/gr-a-27-page-03.mp3`: The sun goes down.
- `audio/page-narration/gr-a-27-page-04.mp3`: The moon is in the sky.
- `audio/page-narration/gr-a-27-page-05.mp3`: It is night.
- `audio/page-narration/gr-a-27-page-06.mp3`: Day and night go round and round!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-28: How Rain Helps

- Type: nonfiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: rain, plant, grow
- Theme/learning goal: rain supports plants
- Cover filename: `images/covers/gr-a-28-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `How Rain Helps`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Rain comes down from the sky. | `images/pages/gr-a-28-page-01.png` | Illustrate this page only: Rain comes down from the sky. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | rain, plant, grow, Rain, comes, sky, down, from, the |
| 2 | Rain helps the plants. | `images/pages/gr-a-28-page-02.png` | Illustrate this page only: Rain helps the plants. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | rain, plant, grow, Rain, plants, helps, the |
| 3 | The plants get a drink. | `images/pages/gr-a-28-page-03.png` | Illustrate this page only: The plants get a drink. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | rain, plant, grow, plants, The, get, a, drink |
| 4 | The plants grow up. | `images/pages/gr-a-28-page-04.png` | Illustrate this page only: The plants grow up. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | rain, plant, grow, plants, The, grow, up |
| 5 | The sun helps the plants too. | `images/pages/gr-a-28-page-05.png` | Illustrate this page only: The sun helps the plants too. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | rain, plant, grow, sun, plants, The, helps, too |
| 6 | Rain and sun help plants grow! | `images/pages/gr-a-28-page-06.png` | Illustrate this page only: Rain and sun help plants grow! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | rain, plant, grow, Rain, sun, plants, and, help, grow |

Audio files required:

- `audio/page-narration/gr-a-28-page-01.mp3`: Rain comes down from the sky.
- `audio/page-narration/gr-a-28-page-02.mp3`: Rain helps the plants.
- `audio/page-narration/gr-a-28-page-03.mp3`: The plants get a drink.
- `audio/page-narration/gr-a-28-page-04.mp3`: The plants grow up.
- `audio/page-narration/gr-a-28-page-05.mp3`: The sun helps the plants too.
- `audio/page-narration/gr-a-28-page-06.mp3`: Rain and sun help plants grow!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-29: Animal Homes

- Type: nonfiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: nest, den, pond
- Theme/learning goal: animals need safe homes
- Cover filename: `images/covers/gr-a-29-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Animal Homes`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Animals need homes. | `images/pages/gr-a-29-page-01.png` | Illustrate this page only: Animals need homes. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | nest, den, pond, Animals, homes, need |
| 2 | A bird has a nest in a tree. | `images/pages/gr-a-29-page-02.png` | Illustrate this page only: A bird has a nest in a tree. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | nest, den, pond, bird, nest, tree, A, has, in, a |
| 3 | A fox has a den in a hill. | `images/pages/gr-a-29-page-03.png` | Illustrate this page only: A fox has a den in a hill. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | nest, den, pond, fox, den, hill, A, has, in, a |
| 4 | A fish has a pond. | `images/pages/gr-a-29-page-04.png` | Illustrate this page only: A fish has a pond. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | nest, den, pond, fish, pond, A, has, a |
| 5 | A bug has a log. | `images/pages/gr-a-29-page-05.png` | Illustrate this page only: A bug has a log. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | nest, den, pond, bug, log, A, has, a |
| 6 | Each animal has a safe home! | `images/pages/gr-a-29-page-06.png` | Illustrate this page only: Each animal has a safe home! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | nest, den, pond, animal, home, Each, has, a, safe |

Audio files required:

- `audio/page-narration/gr-a-29-page-01.mp3`: Animals need homes.
- `audio/page-narration/gr-a-29-page-02.mp3`: A bird has a nest in a tree.
- `audio/page-narration/gr-a-29-page-03.mp3`: A fox has a den in a hill.
- `audio/page-narration/gr-a-29-page-04.mp3`: A fish has a pond.
- `audio/page-narration/gr-a-29-page-05.mp3`: A bug has a log.
- `audio/page-narration/gr-a-29-page-06.mp3`: Each animal has a safe home!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-a-30: We Take Care of Books

- Type: nonfiction
- Level: A
- Level control: Very simple early reader. Short natural sentences, strong picture support, mostly decodable CVC/high-frequency words, no babyish filler.
- Target skills: book, page, shelf
- Theme/learning goal: book care routines
- Cover filename: `images/covers/gr-a-30-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `We Take Care of Books`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Books are for us. | `images/pages/gr-a-30-page-01.png` | Illustrate this page only: Books are for us. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | book, page, shelf, Books, are, for, us |
| 2 | We turn the pages with care. | `images/pages/gr-a-30-page-02.png` | Illustrate this page only: We turn the pages with care. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | book, page, shelf, pages, We, turn, the, with, care |
| 3 | We keep books dry. | `images/pages/gr-a-30-page-03.png` | Illustrate this page only: We keep books dry. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | book, page, shelf, books, We, keep, dry |
| 4 | We put books on the shelf. | `images/pages/gr-a-30-page-04.png` | Illustrate this page only: We put books on the shelf. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | book, page, shelf, books, shelf, We, put, on, the |
| 5 | We share books with friends. | `images/pages/gr-a-30-page-05.png` | Illustrate this page only: We share books with friends. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | book, page, shelf, books, friends, We, share, with |
| 6 | We love our books! | `images/pages/gr-a-30-page-06.png` | Illustrate this page only: We love our books! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | book, page, shelf, books, We, love, our |

Audio files required:

- `audio/page-narration/gr-a-30-page-01.mp3`: Books are for us.
- `audio/page-narration/gr-a-30-page-02.mp3`: We turn the pages with care.
- `audio/page-narration/gr-a-30-page-03.mp3`: We keep books dry.
- `audio/page-narration/gr-a-30-page-04.mp3`: We put books on the shelf.
- `audio/page-narration/gr-a-30-page-05.mp3`: We share books with friends.
- `audio/page-narration/gr-a-30-page-06.mp3`: We love our books!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-06: Mina Fixes the Gate

- Type: fiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: short vowels, silent e preview, blends (st, nd), persistence
- Theme/learning goal: persistence and teamwork
- Cover filename: `images/covers/gr-b-06-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Mina Fixes the Gate`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Mina sees a broken gate. | `images/pages/gr-b-06-page-01.png` | Illustrate this page only: Mina sees a broken gate. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, silent e preview, blends (st, nd), persistence, Mina, sees, broken, gate, a |
| 2 | The gate will not stay shut. | `images/pages/gr-b-06-page-02.png` | Illustrate this page only: The gate will not stay shut. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, silent e preview, blends (st, nd), persistence, gate, stay, shut, The, will, not |
| 3 | Mina gets a stick and some string. | `images/pages/gr-b-06-page-03.png` | Illustrate this page only: Mina gets a stick and some string. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, silent e preview, blends (st, nd), persistence, Mina, gets, stick, string, and, some |
| 4 | She ties the stick to the gate. | `images/pages/gr-b-06-page-04.png` | Illustrate this page only: She ties the stick to the gate. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, silent e preview, blends (st, nd), persistence, She, ties, stick, gate, the, to |
| 5 | The stick breaks! Mina tries again. | `images/pages/gr-b-06-page-05.png` | Illustrate this page only: The stick breaks! Mina tries again. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, silent e preview, blends (st, nd), persistence, stick, breaks, Mina, tries, again, The |
| 6 | This time, Mina uses a plank and nails. The gate stays shut! | `images/pages/gr-b-06-page-06.png` | Illustrate this page only: This time, Mina uses a plank and nails. The gate stays shut! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, silent e preview, blends (st, nd), persistence, This, time, Mina, uses, plank, and, nails, gate, stays, shut, The |

Audio files required:

- `audio/page-narration/gr-b-06-page-01.mp3`: Mina sees a broken gate.
- `audio/page-narration/gr-b-06-page-02.mp3`: The gate will not stay shut.
- `audio/page-narration/gr-b-06-page-03.mp3`: Mina gets a stick and some string.
- `audio/page-narration/gr-b-06-page-04.mp3`: She ties the stick to the gate.
- `audio/page-narration/gr-b-06-page-05.mp3`: The stick breaks! Mina tries again.
- `audio/page-narration/gr-b-06-page-06.mp3`: This time, Mina uses a plank and nails. The gate stays shut!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-07: The Quiet Bell

- Type: fiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: short vowels, -ell word family, community awareness
- Theme/learning goal: noticing needs in a community
- Cover filename: `images/covers/gr-b-07-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Quiet Bell`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Tess has a bell on her desk. | `images/pages/gr-b-07-page-01.png` | Illustrate this page only: Tess has a bell on her desk. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, -ell word family, community awareness, Tess, bell, on, desk, has, a, her |
| 2 | The bell is too quiet. | `images/pages/gr-b-07-page-02.png` | Illustrate this page only: The bell is too quiet. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, -ell word family, community awareness, bell, quiet, The, is, too |
| 3 | No one can hear the bell ring. | `images/pages/gr-b-07-page-03.png` | Illustrate this page only: No one can hear the bell ring. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, -ell word family, community awareness, hear, bell, ring, No, one, can, the |
| 4 | Tess gets a shell and a spoon. | `images/pages/gr-b-07-page-04.png` | Illustrate this page only: Tess gets a shell and a spoon. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, -ell word family, community awareness, Tess, gets, shell, spoon, a, and |
| 5 | She bangs the spoon on the shell. | `images/pages/gr-b-07-page-05.png` | Illustrate this page only: She bangs the spoon on the shell. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, -ell word family, community awareness, She, bangs, spoon, shell, the, on |
| 6 | Now the class can hear! Tess made a new bell. | `images/pages/gr-b-07-page-06.png` | Illustrate this page only: Now the class can hear! Tess made a new bell. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | short vowels, -ell word family, community awareness, Now, class, Tess, new, bell, the, can, hear, made, a |

Audio files required:

- `audio/page-narration/gr-b-07-page-01.mp3`: Tess has a bell on her desk.
- `audio/page-narration/gr-b-07-page-02.mp3`: The bell is too quiet.
- `audio/page-narration/gr-b-07-page-03.mp3`: No one can hear the bell ring.
- `audio/page-narration/gr-b-07-page-04.mp3`: Tess gets a shell and a spoon.
- `audio/page-narration/gr-b-07-page-05.mp3`: She bangs the spoon on the shell.
- `audio/page-narration/gr-b-07-page-06.mp3`: Now the class can hear! Tess made a new bell.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-08: A Lunch for Two

- Type: fiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: HFW practice, simple dialogue, friendship
- Theme/learning goal: generosity and friendship
- Cover filename: `images/covers/gr-b-08-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `A Lunch for Two`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Dell has a big lunch bag. | `images/pages/gr-b-08-page-01.png` | Illustrate this page only: Dell has a big lunch bag. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | HFW practice, simple dialogue, friendship, Dell, lunch, bag, has, a, big |
| 2 | She sees Nell with no lunch. | `images/pages/gr-b-08-page-02.png` | Illustrate this page only: She sees Nell with no lunch. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | HFW practice, simple dialogue, friendship, She, sees, Nell, lunch, with, no |
| 3 | Will you share? asks Nell. | `images/pages/gr-b-08-page-03.png` | Illustrate this page only: Will you share? asks Nell. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | HFW practice, simple dialogue, friendship, Will, share, Nell, you, asks |
| 4 | Yes! says Dell. She splits the sandwich. | `images/pages/gr-b-08-page-04.png` | Illustrate this page only: Yes! says Dell. She splits the sandwich. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | HFW practice, simple dialogue, friendship, Yes, Dell, splits, sandwich, says, She, the |
| 5 | They share the chips and the drink. | `images/pages/gr-b-08-page-05.png` | Illustrate this page only: They share the chips and the drink. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | HFW practice, simple dialogue, friendship, They, share, chips, drink, the, and |
| 6 | Two friends, one lunch. It is the best lunch ever! | `images/pages/gr-b-08-page-06.png` | Illustrate this page only: Two friends, one lunch. It is the best lunch ever! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | HFW practice, simple dialogue, friendship, Two, friends, lunch, ever, one, It, is, the, best |

Audio files required:

- `audio/page-narration/gr-b-08-page-01.mp3`: Dell has a big lunch bag.
- `audio/page-narration/gr-b-08-page-02.mp3`: She sees Nell with no lunch.
- `audio/page-narration/gr-b-08-page-03.mp3`: Will you share? asks Nell.
- `audio/page-narration/gr-b-08-page-04.mp3`: Yes! says Dell. She splits the sandwich.
- `audio/page-narration/gr-b-08-page-05.mp3`: They share the chips and the drink.
- `audio/page-narration/gr-b-08-page-06.mp3`: Two friends, one lunch. It is the best lunch ever!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-09: The Kite That Waited

- Type: fiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: long i preview, short vowels, patience
- Theme/learning goal: waiting for the right conditions
- Cover filename: `images/covers/gr-b-09-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Kite That Waited`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Finn has a red kite. | `images/pages/gr-b-09-page-01.png` | Illustrate this page only: Finn has a red kite. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long i preview, short vowels, patience, Finn, red, kite, has, a |
| 2 | He runs with the kite. It will not fly. | `images/pages/gr-b-09-page-02.png` | Illustrate this page only: He runs with the kite. It will not fly. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long i preview, short vowels, patience, He, runs, kite, fly, with, the, It, will, not |
| 3 | No wind, says Finn. He sits and waits. | `images/pages/gr-b-09-page-03.png` | Illustrate this page only: No wind, says Finn. He sits and waits. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long i preview, short vowels, patience, No, wind, Finn, sits, waits, says, He, and |
| 4 | The trees start to sway. The wind is here! | `images/pages/gr-b-09-page-04.png` | Illustrate this page only: The trees start to sway. The wind is here! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long i preview, short vowels, patience, trees, start, sway, wind, The, to, is, here |
| 5 | Finn runs fast. The kite goes up, up, up! | `images/pages/gr-b-09-page-05.png` | Illustrate this page only: Finn runs fast. The kite goes up, up, up! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long i preview, short vowels, patience, Finn, runs, fast, kite, goes, The, up |
| 6 | The kite flies high in the sky. Waiting was worth it! | `images/pages/gr-b-09-page-06.png` | Illustrate this page only: The kite flies high in the sky. Waiting was worth it! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long i preview, short vowels, patience, kite, flies, high, sky, Waiting, was, worth, The, in, the, it |

Audio files required:

- `audio/page-narration/gr-b-09-page-01.mp3`: Finn has a red kite.
- `audio/page-narration/gr-b-09-page-02.mp3`: He runs with the kite. It will not fly.
- `audio/page-narration/gr-b-09-page-03.mp3`: No wind, says Finn. He sits and waits.
- `audio/page-narration/gr-b-09-page-04.mp3`: The trees start to sway. The wind is here!
- `audio/page-narration/gr-b-09-page-05.mp3`: Finn runs fast. The kite goes up, up, up!
- `audio/page-narration/gr-b-09-page-06.mp3`: The kite flies high in the sky. Waiting was worth it!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-10: Omar's Bright Idea

- Type: fiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: CVC and HFW mix, creative problem solving
- Theme/learning goal: creative problem solving
- Cover filename: `images/covers/gr-b-10-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Omar's Bright Idea`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The classroom is dark and gloomy. | `images/pages/gr-b-10-page-01.png` | Illustrate this page only: The classroom is dark and gloomy. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC and HFW mix, creative problem solving, classroom, dark, gloomy, The, is, and |
| 2 | The bulb is burned out. | `images/pages/gr-b-10-page-02.png` | Illustrate this page only: The bulb is burned out. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC and HFW mix, creative problem solving, bulb, burned, The, is, out |
| 3 | Omar looks at the sun-filled windows. | `images/pages/gr-b-10-page-03.png` | Illustrate this page only: Omar looks at the sun-filled windows. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC and HFW mix, creative problem solving, Omar, looks, sun, filled, windows, at, the |
| 4 | He gets foil and tape. He makes a reflector. | `images/pages/gr-b-10-page-04.png` | Illustrate this page only: He gets foil and tape. He makes a reflector. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC and HFW mix, creative problem solving, gets, foil, tape, makes, reflector, He, and, a |
| 5 | Omar puts the reflector by the window. | `images/pages/gr-b-10-page-05.png` | Illustrate this page only: Omar puts the reflector by the window. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC and HFW mix, creative problem solving, Omar, puts, reflector, window, the, by |
| 6 | Sunlight bounces in! The room is bright. Omar saved the day! | `images/pages/gr-b-10-page-06.png` | Illustrate this page only: Sunlight bounces in! The room is bright. Omar saved the day! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | CVC and HFW mix, creative problem solving, Sunlight, bounces, in, room, bright, Omar, saved, day, The, is |

Audio files required:

- `audio/page-narration/gr-b-10-page-01.mp3`: The classroom is dark and gloomy.
- `audio/page-narration/gr-b-10-page-02.mp3`: The bulb is burned out.
- `audio/page-narration/gr-b-10-page-03.mp3`: Omar looks at the sun-filled windows.
- `audio/page-narration/gr-b-10-page-04.mp3`: He gets foil and tape. He makes a reflector.
- `audio/page-narration/gr-b-10-page-05.mp3`: Omar puts the reflector by the window.
- `audio/page-narration/gr-b-10-page-06.mp3`: Sunlight bounces in! The room is bright. Omar saved the day!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-11: The Bridge of Sticks

- Type: fiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: silent e, teamwork, engineering thinking
- Theme/learning goal: cooperation and creative engineering
- Cover filename: `images/covers/gr-c-11-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Bridge of Sticks`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The creek is wide. The friends need to cross. | `images/pages/gr-c-11-page-01.png` | Illustrate this page only: The creek is wide. The friends need to cross. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, teamwork, engineering thinking, creek, wide, friends, need, cross, The, is, to |
| 2 | Jade piles stones in the water. They wobble and sink. | `images/pages/gr-c-11-page-02.png` | Illustrate this page only: Jade piles stones in the water. They wobble and sink. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, teamwork, engineering thinking, Jade, piles, stones, water, wobble, sink, the, and |
| 3 | We need a plan, says Blake. Let us use sticks. | `images/pages/gr-c-11-page-03.png` | Illustrate this page only: We need a plan, says Blake. Let us use sticks. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, teamwork, engineering thinking, We, need, plan, Blake, Let, sticks, a, says, us, use |
| 4 | They weave long sticks over the stones. | `images/pages/gr-c-11-page-04.png` | Illustrate this page only: They weave long sticks over the stones. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, teamwork, engineering thinking, They, weave, long, sticks, stones, over, the |
| 5 | Mud seals the cracks. Leaves cover the top. | `images/pages/gr-c-11-page-05.png` | Illustrate this page only: Mud seals the cracks. Leaves cover the top. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, teamwork, engineering thinking, Mud, seals, cracks, Leaves, cover, top, the |
| 6 | The bridge holds! Together, they made a safe path. | `images/pages/gr-c-11-page-06.png` | Illustrate this page only: The bridge holds! Together, they made a safe path. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, teamwork, engineering thinking, bridge, holds, Together, They, made, safe, path, The, a |

Audio files required:

- `audio/page-narration/gr-c-11-page-01.mp3`: The creek is wide. The friends need to cross.
- `audio/page-narration/gr-c-11-page-02.mp3`: Jade piles stones in the water. They wobble and sink.
- `audio/page-narration/gr-c-11-page-03.mp3`: We need a plan, says Blake. Let us use sticks.
- `audio/page-narration/gr-c-11-page-04.mp3`: They weave long sticks over the stones.
- `audio/page-narration/gr-c-11-page-05.mp3`: Mud seals the cracks. Leaves cover the top.
- `audio/page-narration/gr-c-11-page-06.mp3`: The bridge holds! Together, they made a safe path.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-12: The Lost Paintbrush

- Type: fiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: silent e, problem-solution structure, descriptive language
- Theme/learning goal: resourcefulness when things go missing
- Cover filename: `images/covers/gr-c-12-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Lost Paintbrush`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Rosa needs her paintbrush for art class. | `images/pages/gr-c-12-page-01.png` | Illustrate this page only: Rosa needs her paintbrush for art class. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, problem-solution structure, descriptive language, Rosa, needs, paintbrush, art, class, her, for |
| 2 | She looks in her desk. She looks in her bag. | `images/pages/gr-c-12-page-02.png` | Illustrate this page only: She looks in her desk. She looks in her bag. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, problem-solution structure, descriptive language, looks, desk, bag, She, in, her |
| 3 | The brush is gone! Rosa feels upset. | `images/pages/gr-c-12-page-03.png` | Illustrate this page only: The brush is gone! Rosa feels upset. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, problem-solution structure, descriptive language, brush, gone, Rosa, upset, The, is, feels |
| 4 | She sees a feather on the floor. | `images/pages/gr-c-12-page-04.png` | Illustrate this page only: She sees a feather on the floor. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, problem-solution structure, descriptive language, She, sees, feather, floor, a, on, the |
| 5 | Rosa dips the feather in paint. It makes fine lines! | `images/pages/gr-c-12-page-05.png` | Illustrate this page only: Rosa dips the feather in paint. It makes fine lines! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, problem-solution structure, descriptive language, Rosa, dips, feather, paint, makes, fine, lines, the, in, It |
| 6 | Sometimes the best tools are the ones you find. | `images/pages/gr-c-12-page-06.png` | Illustrate this page only: Sometimes the best tools are the ones you find. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, problem-solution structure, descriptive language, Sometimes, tools, find, the, best, are, the, ones, you |

Audio files required:

- `audio/page-narration/gr-c-12-page-01.mp3`: Rosa needs her paintbrush for art class.
- `audio/page-narration/gr-c-12-page-02.mp3`: She looks in her desk. She looks in her bag.
- `audio/page-narration/gr-c-12-page-03.mp3`: The brush is gone! Rosa feels upset.
- `audio/page-narration/gr-c-12-page-04.mp3`: She sees a feather on the floor.
- `audio/page-narration/gr-c-12-page-05.mp3`: Rosa dips the feather in paint. It makes fine lines!
- `audio/page-narration/gr-c-12-page-06.mp3`: Sometimes the best tools are the ones you find.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-13: A Garden for Everyone

- Type: fiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: silent e, vowel teams (ea, oo), community theme
- Theme/learning goal: inclusive community projects
- Cover filename: `images/covers/gr-c-13-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `A Garden for Everyone`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The playground has a bare spot by the fence. | `images/pages/gr-c-13-page-01.png` | Illustrate this page only: The playground has a bare spot by the fence. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams (ea, oo), community theme, playground, bare, spot, fence, The, has, a, by, the |
| 2 | Ivy has an idea. We can plant a garden here! | `images/pages/gr-c-13-page-02.png` | Illustrate this page only: Ivy has an idea. We can plant a garden here! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams (ea, oo), community theme, Ivy, plant, garden, an, idea, We, can, a, here |
| 3 | Some kids bring seeds. Some bring tools. | `images/pages/gr-c-13-page-03.png` | Illustrate this page only: Some kids bring seeds. Some bring tools. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams (ea, oo), community theme, kids, seeds, tools, Some, bring |
| 4 | They dig the soil. They drop in seeds. | `images/pages/gr-c-13-page-04.png` | Illustrate this page only: They dig the soil. They drop in seeds. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams (ea, oo), community theme, They, dig, soil, drop, in, seeds, the |
| 5 | Each day they water and weed. Green shoots peek up! | `images/pages/gr-c-13-page-05.png` | Illustrate this page only: Each day they water and weed. Green shoots peek up! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams (ea, oo), community theme, Each, day, water, weed, Green, shoots, peek, they, and, up |
| 6 | Soon the garden blooms. It is bright and beautiful and ours. | `images/pages/gr-c-13-page-06.png` | Illustrate this page only: Soon the garden blooms. It is bright and beautiful and ours. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams (ea, oo), community theme, Soon, garden, blooms, bright, beautiful, the, It, is, and, and, ours |

Audio files required:

- `audio/page-narration/gr-c-13-page-01.mp3`: The playground has a bare spot by the fence.
- `audio/page-narration/gr-c-13-page-02.mp3`: Ivy has an idea. We can plant a garden here!
- `audio/page-narration/gr-c-13-page-03.mp3`: Some kids bring seeds. Some bring tools.
- `audio/page-narration/gr-c-13-page-04.mp3`: They dig the soil. They drop in seeds.
- `audio/page-narration/gr-c-13-page-05.mp3`: Each day they water and weed. Green shoots peek up!
- `audio/page-narration/gr-c-13-page-06.mp3`: Soon the garden blooms. It is bright and beautiful and ours.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-14: The Rain Jar

- Type: fiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: silent e, cause and effect, environmental awareness
- Theme/learning goal: observing nature and resourcefulness
- Cover filename: `images/covers/gr-c-14-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Rain Jar`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The sun bakes the school garden. The leaves droop. | `images/pages/gr-c-14-page-01.png` | Illustrate this page only: The sun bakes the school garden. The leaves droop. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, cause and effect, environmental awareness, sun, bakes, garden, leaves, droop, The, the, school |
| 2 | We need water, says Chen. But the hose is off. | `images/pages/gr-c-14-page-02.png` | Illustrate this page only: We need water, says Chen. But the hose is off. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, cause and effect, environmental awareness, water, Chen, hose, We, need, says, But, the, is, off |
| 3 | Chen looks at the dark clouds. Rain is coming! | `images/pages/gr-c-14-page-03.png` | Illustrate this page only: Chen looks at the dark clouds. Rain is coming! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, cause and effect, environmental awareness, Chen, looks, dark, clouds, Rain, the, is, coming |
| 4 | He places a big jar by the garden bed. | `images/pages/gr-c-14-page-04.png` | Illustrate this page only: He places a big jar by the garden bed. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, cause and effect, environmental awareness, He, places, big, jar, garden, bed, a, by, the |
| 5 | Plop, plop, plop! Rain fills the jar. | `images/pages/gr-c-14-page-05.png` | Illustrate this page only: Plop, plop, plop! Rain fills the jar. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, cause and effect, environmental awareness, Plop, Rain, fills, jar, the |
| 6 | Chen pours the rain on the plants. Nature gave them a drink! | `images/pages/gr-c-14-page-06.png` | Illustrate this page only: Chen pours the rain on the plants. Nature gave them a drink! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, cause and effect, environmental awareness, Chen, pours, rain, plants, Nature, gave, drink, the, on, the, them, a |

Audio files required:

- `audio/page-narration/gr-c-14-page-01.mp3`: The sun bakes the school garden. The leaves droop.
- `audio/page-narration/gr-c-14-page-02.mp3`: We need water, says Chen. But the hose is off.
- `audio/page-narration/gr-c-14-page-03.mp3`: Chen looks at the dark clouds. Rain is coming!
- `audio/page-narration/gr-c-14-page-04.mp3`: He places a big jar by the garden bed.
- `audio/page-narration/gr-c-14-page-05.mp3`: Plop, plop, plop! Rain fills the jar.
- `audio/page-narration/gr-c-14-page-06.mp3`: Chen pours the rain on the plants. Nature gave them a drink!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-15: The Lantern Path

- Type: fiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: silent e, vowel teams, empathy and courage
- Theme/learning goal: kindness and bravery
- Cover filename: `images/covers/gr-c-15-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Lantern Path`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The power goes out at school. The halls go dark. | `images/pages/gr-c-15-page-01.png` | Illustrate this page only: The power goes out at school. The halls go dark. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams, empathy and courage, power, goes, out, halls, The, at, school, The, go, dark |
| 2 | Some kids are scared. Mei sees their worried faces. | `images/pages/gr-c-15-page-02.png` | Illustrate this page only: Some kids are scared. Mei sees their worried faces. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams, empathy and courage, kids, scared, Mei, worried, faces, Some, are, sees, their |
| 3 | She finds paper lanterns in the art room. | `images/pages/gr-c-15-page-03.png` | Illustrate this page only: She finds paper lanterns in the art room. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams, empathy and courage, She, finds, paper, lanterns, in, the, art, room |
| 4 | Mei lights each one with a small candle. | `images/pages/gr-c-15-page-04.png` | Illustrate this page only: Mei lights each one with a small candle. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams, empathy and courage, Mei, lights, small, candle, each, one, with, a |
| 5 | She places them along the hallway floor. | `images/pages/gr-c-15-page-05.png` | Illustrate this page only: She places them along the hallway floor. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams, empathy and courage, She, places, hallway, them, along, the, floor |
| 6 | A warm path glows. No one is scared now. Mei led the way. | `images/pages/gr-c-15-page-06.png` | Illustrate this page only: A warm path glows. No one is scared now. Mei led the way. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | silent e, vowel teams, empathy and courage, warm, path, glows, No, one, scared, Mei, led, A, is, now, the, way |

Audio files required:

- `audio/page-narration/gr-c-15-page-01.mp3`: The power goes out at school. The halls go dark.
- `audio/page-narration/gr-c-15-page-02.mp3`: Some kids are scared. Mei sees their worried faces.
- `audio/page-narration/gr-c-15-page-03.mp3`: She finds paper lanterns in the art room.
- `audio/page-narration/gr-c-15-page-04.mp3`: Mei lights each one with a small candle.
- `audio/page-narration/gr-c-15-page-05.mp3`: She places them along the hallway floor.
- `audio/page-narration/gr-c-15-page-06.mp3`: A warm path glows. No one is scared now. Mei led the way.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-16: Maya and the Broken Bridge

- Type: fiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: vowel teams (ai, ay), problem-solving, perseverance
- Theme/learning goal: perseverance through setbacks
- Cover filename: `images/covers/gr-d-16-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Maya and the Broken Bridge`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Maya and her friends build a bridge of blocks. | `images/pages/gr-d-16-page-01.png` | Illustrate this page only: Maya and her friends build a bridge of blocks. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ai, ay), problem-solving, perseverance, Maya, friends, build, bridge, blocks, and, her |
| 2 | They test it with a toy car. Crash! The bridge falls. | `images/pages/gr-d-16-page-02.png` | Illustrate this page only: They test it with a toy car. Crash! The bridge falls. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ai, ay), problem-solving, perseverance, They, test, toy, car, Crash, bridge, it, with, a, The, falls |
| 3 | "It is ruined!" stamps Leo. Maya shakes her head. | `images/pages/gr-d-16-page-03.png` | Illustrate this page only: "It is ruined!" stamps Leo. Maya shakes her head. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ai, ay), problem-solving, perseverance, ruined, stamps, Leo, Maya, shakes, head, It, is, her |
| 4 | We need a base, says Maya. Wide and flat and strong. | `images/pages/gr-d-16-page-04.png` | Illustrate this page only: We need a base, says Maya. Wide and flat and strong. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ai, ay), problem-solving, perseverance, We, need, base, Maya, Wide, flat, strong, a, says, and, and |
| 5 | They slide a book under the blocks. The bridge stands tall. | `images/pages/gr-d-16-page-05.png` | Illustrate this page only: They slide a book under the blocks. The bridge stands tall. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ai, ay), problem-solving, perseverance, They, slide, book, blocks, bridge, tall, a, under, the, The, stands |
| 6 | The toy car rolls across. Maya smiles. Never give up! | `images/pages/gr-d-16-page-06.png` | Illustrate this page only: The toy car rolls across. Maya smiles. Never give up! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ai, ay), problem-solving, perseverance, car, rolls, Maya, smiles, Never, give, The, toy, across, up |

Audio files required:

- `audio/page-narration/gr-d-16-page-01.mp3`: Maya and her friends build a bridge of blocks.
- `audio/page-narration/gr-d-16-page-02.mp3`: They test it with a toy car. Crash! The bridge falls.
- `audio/page-narration/gr-d-16-page-03.mp3`: "It is ruined!" stamps Leo. Maya shakes her head.
- `audio/page-narration/gr-d-16-page-04.mp3`: We need a base, says Maya. Wide and flat and strong.
- `audio/page-narration/gr-d-16-page-05.mp3`: They slide a book under the blocks. The bridge stands tall.
- `audio/page-narration/gr-d-16-page-06.mp3`: The toy car rolls across. Maya smiles. Never give up!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-17: The Honest Choice

- Type: fiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: vowel teams (oa, ow), character moral decisions
- Theme/learning goal: honesty and integrity
- Cover filename: `images/covers/gr-d-17-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Honest Choice`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Zoe finds a shiny coin in the lunch line. | `images/pages/gr-d-17-page-01.png` | Illustrate this page only: Zoe finds a shiny coin in the lunch line. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (oa, ow), character moral decisions, Zoe, finds, shiny, coin, lunch, a, in, the, line |
| 2 | She looks around. No one seems to notice. | `images/pages/gr-d-17-page-02.png` | Illustrate this page only: She looks around. No one seems to notice. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (oa, ow), character moral decisions, She, looks, notice, around, No, one, seems, to |
| 3 | Zoe clutches the coin. She thinks of the bake sale. | `images/pages/gr-d-17-page-03.png` | Illustrate this page only: Zoe clutches the coin. She thinks of the bake sale. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (oa, ow), character moral decisions, Zoe, clutches, coin, thinks, bake, sale, the, She, of, the |
| 4 | Then she sees a younger child crying by the door. | `images/pages/gr-d-17-page-04.png` | Illustrate this page only: Then she sees a younger child crying by the door. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (oa, ow), character moral decisions, Then, younger, child, crying, door, she, sees, a, by, the |
| 5 | "Did you lose this?" Zoe asks. The child nods and beams. | `images/pages/gr-d-17-page-05.png` | Illustrate this page only: "Did you lose this?" Zoe asks. The child nods and beams. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (oa, ow), character moral decisions, Did, lose, Zoe, asks, nods, beams, you, this, The, child, and |
| 6 | Zoe feels warm inside. Doing the right thing is its own reward. | `images/pages/gr-d-17-page-06.png` | Illustrate this page only: Zoe feels warm inside. Doing the right thing is its own reward. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (oa, ow), character moral decisions, Zoe, feels, warm, inside, Doing, reward, the, right, thing, is, its, own |

Audio files required:

- `audio/page-narration/gr-d-17-page-01.mp3`: Zoe finds a shiny coin in the lunch line.
- `audio/page-narration/gr-d-17-page-02.mp3`: She looks around. No one seems to notice.
- `audio/page-narration/gr-d-17-page-03.mp3`: Zoe clutches the coin. She thinks of the bake sale.
- `audio/page-narration/gr-d-17-page-04.mp3`: Then she sees a younger child crying by the door.
- `audio/page-narration/gr-d-17-page-05.mp3`: "Did you lose this?" Zoe asks. The child nods and beams.
- `audio/page-narration/gr-d-17-page-06.mp3`: Zoe feels warm inside. Doing the right thing is its own reward.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-18: The Smallest Seed

- Type: fiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: vowel teams (ee, ea), growth mindset metaphor
- Theme/learning goal: patience and believing in small beginnings
- Cover filename: `images/covers/gr-d-18-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Smallest Seed`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | In a garden of giants, one seed is tiny. | `images/pages/gr-d-18-page-01.png` | Illustrate this page only: In a garden of giants, one seed is tiny. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ee, ea), growth mindset metaphor, garden, giants, seed, tiny, In, a, of, one, is |
| 2 | The other seeds tease it. You are too small to grow! | `images/pages/gr-d-18-page-02.png` | Illustrate this page only: The other seeds tease it. You are too small to grow! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ee, ea), growth mindset metaphor, seeds, tease, small, grow, The, other, it, You, are, too, to |
| 3 | A gust of wind blows the tiny seed far away. | `images/pages/gr-d-18-page-03.png` | Illustrate this page only: A gust of wind blows the tiny seed far away. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ee, ea), growth mindset metaphor, gust, wind, blows, tiny, seed, far, A, of, away |
| 4 | It lands in rich soil. Rain falls. Sun beams down. | `images/pages/gr-d-18-page-04.png` | Illustrate this page only: It lands in rich soil. Rain falls. Sun beams down. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ee, ea), growth mindset metaphor, lands, rich, beams, It, in, soil, Rain, falls, Sun, down |
| 5 | A green leaf peeks out. Then two. Then ten! | `images/pages/gr-d-18-page-05.png` | Illustrate this page only: A green leaf peeks out. Then two. Then ten! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ee, ea), growth mindset metaphor, green, leaf, peeks, two, ten, out, Then, Then |
| 6 | The tiny seed becomes the tallest sunflower. Small starts matter. | `images/pages/gr-d-18-page-06.png` | Illustrate this page only: The tiny seed becomes the tallest sunflower. Small starts matter. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | vowel teams (ee, ea), growth mindset metaphor, tiny, becomes, tallest, sunflower, Small, starts, The, seed, the, matter |

Audio files required:

- `audio/page-narration/gr-d-18-page-01.mp3`: In a garden of giants, one seed is tiny.
- `audio/page-narration/gr-d-18-page-02.mp3`: The other seeds tease it. You are too small to grow!
- `audio/page-narration/gr-d-18-page-03.mp3`: A gust of wind blows the tiny seed far away.
- `audio/page-narration/gr-d-18-page-04.mp3`: It lands in rich soil. Rain falls. Sun beams down.
- `audio/page-narration/gr-d-18-page-05.mp3`: A green leaf peeks out. Then two. Then ten!
- `audio/page-narration/gr-d-18-page-06.mp3`: The tiny seed becomes the tallest sunflower. Small starts matter.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-19: The Team With No Captain

- Type: fiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: r-controlled vowels, leadership and shared responsibility
- Theme/learning goal: shared leadership and collaboration
- Cover filename: `images/covers/gr-d-19-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Team With No Captain`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The soccer team has no captain. Everyone wants to lead. | `images/pages/gr-d-19-page-01.png` | Illustrate this page only: The soccer team has no captain. Everyone wants to lead. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | r-controlled vowels, leadership and shared responsibility, soccer, team, captain, The, has, no, Everyone, wants, to, lead |
| 2 | We need one voice, says Coach Verra. Not five. | `images/pages/gr-d-19-page-02.png` | Illustrate this page only: We need one voice, says Coach Verra. Not five. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | r-controlled vowels, leadership and shared responsibility, We, need, voice, Coach, Verra, five, one, says, Not |
| 3 | During practice, each player calls a different play. | `images/pages/gr-d-19-page-03.png` | Illustrate this page only: During practice, each player calls a different play. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | r-controlled vowels, leadership and shared responsibility, During, practice, player, calls, play, each, a, different |
| 4 | They trip and tangle. No goal. No score. Just chaos. | `images/pages/gr-d-19-page-04.png` | Illustrate this page only: They trip and tangle. No goal. No score. Just chaos. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | r-controlled vowels, leadership and shared responsibility, They, trip, tangle, goal, score, chaos, No, No, Just |
| 5 | Then Stan speaks up. What if we take turns leading? | `images/pages/gr-d-19-page-05.png` | Illustrate this page only: Then Stan speaks up. What if we take turns leading? Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | r-controlled vowels, leadership and shared responsibility, Stan, What, leading, Then, speaks, up, if, we, take, turns |
| 6 | They win the game. Every player scored. Together, they were the captain. | `images/pages/gr-d-19-page-06.png` | Illustrate this page only: They win the game. Every player scored. Together, they were the captain. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | r-controlled vowels, leadership and shared responsibility, They, win, player, Together, captain, the, game, Every, scored, they, were, the |

Audio files required:

- `audio/page-narration/gr-d-19-page-01.mp3`: The soccer team has no captain. Everyone wants to lead.
- `audio/page-narration/gr-d-19-page-02.mp3`: We need one voice, says Coach Verra. Not five.
- `audio/page-narration/gr-d-19-page-03.mp3`: During practice, each player calls a different play.
- `audio/page-narration/gr-d-19-page-04.mp3`: They trip and tangle. No goal. No score. Just chaos.
- `audio/page-narration/gr-d-19-page-05.mp3`: Then Stan speaks up. What if we take turns leading?
- `audio/page-narration/gr-d-19-page-06.mp3`: They win the game. Every player scored. Together, they were the captain.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-20: The Window Garden

- Type: fiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: multisyllabic words, vowel teams, urban nature theme
- Theme/learning goal: finding nature in unexpected places
- Cover filename: `images/covers/gr-d-20-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Window Garden`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Ava lives in a tall building. There is no yard to tend. | `images/pages/gr-d-20-page-01.png` | Illustrate this page only: Ava lives in a tall building. There is no yard to tend. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | multisyllabic words, vowel teams, urban nature theme, Ava, lives, building, yard, tend, in, a, tall, There, is, no, to |
| 2 | She looks out the window at the brick wall. | `images/pages/gr-d-20-page-02.png` | Illustrate this page only: She looks out the window at the brick wall. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | multisyllabic words, vowel teams, urban nature theme, She, looks, brick, out, the, window, at, the, wall |
| 3 | Ava fills small pots with soil. She places them on the sill. | `images/pages/gr-d-20-page-03.png` | Illustrate this page only: Ava fills small pots with soil. She places them on the sill. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | multisyllabic words, vowel teams, urban nature theme, Ava, fills, small, pots, soil, places, sill, with, She, them, on, the |
| 4 | She plants basil, mint, and a tiny tomato vine. | `images/pages/gr-d-20-page-04.png` | Illustrate this page only: She plants basil, mint, and a tiny tomato vine. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | multisyllabic words, vowel teams, urban nature theme, She, plants, basil, mint, tomato, vine, and, a, tiny |
| 5 | Each morning she waters. Each evening she checks for sprouts. | `images/pages/gr-d-20-page-05.png` | Illustrate this page only: Each morning she waters. Each evening she checks for sprouts. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | multisyllabic words, vowel teams, urban nature theme, Each, morning, waters, Each, evening, checks, sprouts, she, she, for |
| 6 | Green leaves reach for the sky. A garden can grow anywhere. | `images/pages/gr-d-20-page-06.png` | Illustrate this page only: Green leaves reach for the sky. A garden can grow anywhere. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | multisyllabic words, vowel teams, urban nature theme, Green, leaves, reach, sky, garden, for, the, A, can, grow, anywhere |

Audio files required:

- `audio/page-narration/gr-d-20-page-01.mp3`: Ava lives in a tall building. There is no yard to tend.
- `audio/page-narration/gr-d-20-page-02.mp3`: She looks out the window at the brick wall.
- `audio/page-narration/gr-d-20-page-03.mp3`: Ava fills small pots with soil. She places them on the sill.
- `audio/page-narration/gr-d-20-page-04.mp3`: She plants basil, mint, and a tiny tomato vine.
- `audio/page-narration/gr-d-20-page-05.mp3`: Each morning she waters. Each evening she checks for sprouts.
- `audio/page-narration/gr-d-20-page-06.mp3`: Green leaves reach for the sky. A garden can grow anywhere.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-21: The Long Way Home

- Type: fiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: long vowel teams (ai, ee, oa), narrative sequencing, problem solving
- Theme/learning goal: adaptability when plans change
- Cover filename: `images/covers/gr-e-21-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Long Way Home`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The school bus breaks down far from home. | `images/pages/gr-e-21-page-01.png` | Illustrate this page only: The school bus breaks down far from home. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long vowel teams (ai, ee, oa), narrative sequencing, problem solving, breaks, The, school, bus, down, far, from, home |
| 2 | The driver calls for help. We must wait, she says. | `images/pages/gr-e-21-page-02.png` | Illustrate this page only: The driver calls for help. We must wait, she says. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long vowel teams (ai, ee, oa), narrative sequencing, problem solving, driver, calls, The, for, help, We, must, wait, she, says |
| 3 | Eli looks at the map on his phone. There is a path through the park. | `images/pages/gr-e-21-page-03.png` | Illustrate this page only: Eli looks at the map on his phone. There is a path through the park. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long vowel teams (ai, ee, oa), narrative sequencing, problem solving, Eli, looks, phone, path, park, at, the, map, on, his, There, is, a, through, the |
| 4 | Who wants to walk? he asks. Five friends raise their hands. | `images/pages/gr-e-21-page-04.png` | Illustrate this page only: Who wants to walk? he asks. Five friends raise their hands. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long vowel teams (ai, ee, oa), narrative sequencing, problem solving, walk, friends, raise, hands, Who, wants, to, he, asks, Five, their |
| 5 | They hike past ponds and meadows. They spot birds and deer. | `images/pages/gr-e-21-page-05.png` | Illustrate this page only: They hike past ponds and meadows. They spot birds and deer. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long vowel teams (ai, ee, oa), narrative sequencing, problem solving, They, hike, ponds, meadows, spot, birds, deer, past, and, and |
| 6 | They reach home at sunset. Sometimes the long way is the best way. | `images/pages/gr-e-21-page-06.png` | Illustrate this page only: They reach home at sunset. Sometimes the long way is the best way. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | long vowel teams (ai, ee, oa), narrative sequencing, problem solving, reach, sunset, long, They, home, at, Sometimes, the, way, is, the, best, way |

Audio files required:

- `audio/page-narration/gr-e-21-page-01.mp3`: The school bus breaks down far from home.
- `audio/page-narration/gr-e-21-page-02.mp3`: The driver calls for help. We must wait, she says.
- `audio/page-narration/gr-e-21-page-03.mp3`: Eli looks at the map on his phone. There is a path through the park.
- `audio/page-narration/gr-e-21-page-04.mp3`: Who wants to walk? he asks. Five friends raise their hands.
- `audio/page-narration/gr-e-21-page-05.mp3`: They hike past ponds and meadows. They spot birds and deer.
- `audio/page-narration/gr-e-21-page-06.mp3`: They reach home at sunset. Sometimes the long way is the best way.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-22: The Debate at Table Four

- Type: fiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: complex vowel teams, persuasive language, respectful disagreement
- Theme/learning goal: learning to disagree respectfully
- Cover filename: `images/covers/gr-e-22-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Debate at Table Four`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | At lunch, table four has a big debate. Which season is best? | `images/pages/gr-e-22-page-01.png` | Illustrate this page only: At lunch, table four has a big debate. Which season is best? Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowel teams, persuasive language, respectful disagreement, lunch, debate, season, At, table, four, has, a, big, Which, is, best |
| 2 | Winter! shouts Nia. Snow days and hot cocoa by the fire! | `images/pages/gr-e-22-page-02.png` | Illustrate this page only: Winter! shouts Nia. Snow days and hot cocoa by the fire! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowel teams, persuasive language, respectful disagreement, Winter, shouts, Nia, Snow, days, hot, cocoa, by, the, fire |
| 3 | Spring! cries Jules. Flowers bloom and birds return to sing! | `images/pages/gr-e-22-page-03.png` | Illustrate this page only: Spring! cries Jules. Flowers bloom and birds return to sing! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowel teams, persuasive language, respectful disagreement, Spring, cries, Jules, Flowers, bloom, birds, return, sing, to |
| 4 | Voices rise. Faces flush. No one will change their mind. | `images/pages/gr-e-22-page-04.png` | Illustrate this page only: Voices rise. Faces flush. No one will change their mind. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowel teams, persuasive language, respectful disagreement, Voices, rise, Faces, flush, No, one, will, change, their, mind |
| 5 | Then Kira speaks. What if each season teaches us something? | `images/pages/gr-e-22-page-05.png` | Illustrate this page only: Then Kira speaks. What if each season teaches us something? Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowel teams, persuasive language, respectful disagreement, Kira, season, teaches, Then, speaks, What, if, each, us, something |
| 6 | Table four grows quiet. Maybe being right is less important than being kind. | `images/pages/gr-e-22-page-06.png` | Illustrate this page only: Table four grows quiet. Maybe being right is less important than being kind. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowel teams, persuasive language, respectful disagreement, Maybe, right, important, Table, four, grows, quiet, being, is, less, than, being, kind |

Audio files required:

- `audio/page-narration/gr-e-22-page-01.mp3`: At lunch, table four has a big debate. Which season is best?
- `audio/page-narration/gr-e-22-page-02.mp3`: Winter! shouts Nia. Snow days and hot cocoa by the fire!
- `audio/page-narration/gr-e-22-page-03.mp3`: Spring! cries Jules. Flowers bloom and birds return to sing!
- `audio/page-narration/gr-e-22-page-04.mp3`: Voices rise. Faces flush. No one will change their mind.
- `audio/page-narration/gr-e-22-page-05.mp3`: Then Kira speaks. What if each season teaches us something?
- `audio/page-narration/gr-e-22-page-06.mp3`: Table four grows quiet. Maybe being right is less important than being kind.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-23: The Day the Lights Went Out

- Type: fiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: complex phonics, community resilience, descriptive language
- Theme/learning goal: community coming together during hardship
- Cover filename: `images/covers/gr-e-23-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Day the Lights Went Out`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | A storm knocks out the power on Maple Street. | `images/pages/gr-e-23-page-01.png` | Illustrate this page only: A storm knocks out the power on Maple Street. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex phonics, community resilience, descriptive language, storm, knocks, Maple, Street, out, the, power, on |
| 2 | Screens go black. Clocks blink. The fridge hums to silence. | `images/pages/gr-e-23-page-02.png` | Illustrate this page only: Screens go black. Clocks blink. The fridge hums to silence. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex phonics, community resilience, descriptive language, Screens, fridge, hums, go, black, Clocks, blink, The, to, silence |
| 3 | Mr. Cruz brings flashlights. Ms. Reed shares candles from her pantry. | `images/pages/gr-e-23-page-03.png` | Illustrate this page only: Mr. Cruz brings flashlights. Ms. Reed shares candles from her pantry. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex phonics, community resilience, descriptive language, Mr, Cruz, brings, flashlights, Ms, Reed, shares, candles, pantry, from, her |
| 4 | Neighbors gather in the street. They share food from warming grills. | `images/pages/gr-e-23-page-04.png` | Illustrate this page only: Neighbors gather in the street. They share food from warming grills. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex phonics, community resilience, descriptive language, Neighbors, gather, street, warming, grills, in, the, They, share, food, from |
| 5 | Children play tag in the moonlight. Stories pass from porch to porch. | `images/pages/gr-e-23-page-05.png` | Illustrate this page only: Children play tag in the moonlight. Stories pass from porch to porch. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex phonics, community resilience, descriptive language, Children, moonlight, Stories, pass, porch, porch, play, tag, in, the, from, to |
| 6 | When the lights return, no one rushes inside. The dark brought them together. | `images/pages/gr-e-23-page-06.png` | Illustrate this page only: When the lights return, no one rushes inside. The dark brought them together. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex phonics, community resilience, descriptive language, return, dark, brought, When, the, lights, no, one, rushes, inside, The, them, together |

Audio files required:

- `audio/page-narration/gr-e-23-page-01.mp3`: A storm knocks out the power on Maple Street.
- `audio/page-narration/gr-e-23-page-02.mp3`: Screens go black. Clocks blink. The fridge hums to silence.
- `audio/page-narration/gr-e-23-page-03.mp3`: Mr. Cruz brings flashlights. Ms. Reed shares candles from her pantry.
- `audio/page-narration/gr-e-23-page-04.mp3`: Neighbors gather in the street. They share food from warming grills.
- `audio/page-narration/gr-e-23-page-05.mp3`: Children play tag in the moonlight. Stories pass from porch to porch.
- `audio/page-narration/gr-e-23-page-06.mp3`: When the lights return, no one rushes inside. The dark brought them together.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-24: The Community Mural

- Type: fiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: complex multisyllabic words, collaborative creativity, cultural celebration
- Theme/learning goal: collective art and community identity
- Cover filename: `images/covers/gr-e-24-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Community Mural`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | A gray wall sits at the edge of the playground. It needs color. | `images/pages/gr-e-24-page-01.png` | Illustrate this page only: A gray wall sits at the edge of the playground. It needs color. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex multisyllabic words, collaborative creativity, cultural celebration, gray, wall, sits, edge, playground, A, at, the, of, the, It, needs, color |
| 2 | Ms. Park asks each student to paint one thing they love about their town. | `images/pages/gr-e-24-page-02.png` | Illustrate this page only: Ms. Park asks each student to paint one thing they love about their town. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex multisyllabic words, collaborative creativity, cultural celebration, Ms, Park, asks, each, student, to, paint, one, thing, they, love, about, their, town |
| 3 | Diego paints the library. Amara paints the farmers market. Lena paints the river. | `images/pages/gr-e-24-page-03.png` | Illustrate this page only: Diego paints the library. Amara paints the farmers market. Lena paints the river. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex multisyllabic words, collaborative creativity, cultural celebration, Diego, paints, library, Amara, farmers, market, Lena, river, the, the, the |
| 4 | They paint families, pets, and trees. Each brushstroke tells a story. | `images/pages/gr-e-24-page-04.png` | Illustrate this page only: They paint families, pets, and trees. Each brushstroke tells a story. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex multisyllabic words, collaborative creativity, cultural celebration, They, paint, families, pets, trees, brushstroke, tells, and, Each, a, story |
| 5 | The mural grows. Faces, places, memories blend into one big picture. | `images/pages/gr-e-24-page-05.png` | Illustrate this page only: The mural grows. Faces, places, memories blend into one big picture. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex multisyllabic words, collaborative creativity, cultural celebration, mural, grows, Faces, places, memories, blend, picture, The, big |
| 6 | The whole town gathers to see. This wall belongs to everyone. | `images/pages/gr-e-24-page-06.png` | Illustrate this page only: The whole town gathers to see. This wall belongs to everyone. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex multisyllabic words, collaborative creativity, cultural celebration, gathers, The, whole, town, to, see, This, wall, belongs, to, everyone |

Audio files required:

- `audio/page-narration/gr-e-24-page-01.mp3`: A gray wall sits at the edge of the playground. It needs color.
- `audio/page-narration/gr-e-24-page-02.mp3`: Ms. Park asks each student to paint one thing they love about their town.
- `audio/page-narration/gr-e-24-page-03.mp3`: Diego paints the library. Amara paints the farmers market. Lena paints the river.
- `audio/page-narration/gr-e-24-page-04.mp3`: They paint families, pets, and trees. Each brushstroke tells a story.
- `audio/page-narration/gr-e-24-page-05.mp3`: The mural grows. Faces, places, memories blend into one big picture.
- `audio/page-narration/gr-e-24-page-06.mp3`: The whole town gathers to see. This wall belongs to everyone.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-25: A Promise to the Pond

- Type: fiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: complex vowels, environmental stewardship, narrative arc
- Theme/learning goal: protecting nature through commitment
- Cover filename: `images/covers/gr-e-25-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `A Promise to the Pond`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | The pond behind school is full of trash. The water smells foul. | `images/pages/gr-e-25-page-01.png` | Illustrate this page only: The pond behind school is full of trash. The water smells foul. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowels, environmental stewardship, narrative arc, pond, The, behind, school, is, full, of, trash, The, water, smells, foul |
| 2 | No frogs croak. No dragonflies hover. The pond is dying. | `images/pages/gr-e-25-page-02.png` | Illustrate this page only: No frogs croak. No dragonflies hover. The pond is dying. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowels, environmental stewardship, narrative arc, frogs, croak, dragonflies, hover, No, No, The, pond, is, dying |
| 3 | Tara makes a pledge. We will clean this pond. We will save it. | `images/pages/gr-e-25-page-03.png` | Illustrate this page only: Tara makes a pledge. We will clean this pond. We will save it. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowels, environmental stewardship, narrative arc, Tara, makes, pledge, clean, save, a, We, will, this, pond, We, will, it |
| 4 | Every Friday, they pull out bottles and bags. They scoop mud. | `images/pages/gr-e-25-page-04.png` | Illustrate this page only: Every Friday, they pull out bottles and bags. They scoop mud. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowels, environmental stewardship, narrative arc, Every, Friday, pull, bottles, bags, scoop, mud, out, and, They |
| 5 | Week by week, the water clears. Green moss returns. Tadpoles wriggle. | `images/pages/gr-e-25-page-05.png` | Illustrate this page only: Week by week, the water clears. Green moss returns. Tadpoles wriggle. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowels, environmental stewardship, narrative arc, Week, week, water, clears, Green, moss, returns, Tadpoles, wriggle, by, the |
| 6 | At last, a frog croaks. Tara keeps her promise. Nature keeps its promise too. | `images/pages/gr-e-25-page-06.png` | Illustrate this page only: At last, a frog croaks. Tara keeps her promise. Nature keeps its promise too. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | complex vowels, environmental stewardship, narrative arc, last, frog, croaks, Tara, Nature, At, a, keeps, her, promise, keeps, its, promise, too |

Audio files required:

- `audio/page-narration/gr-e-25-page-01.mp3`: The pond behind school is full of trash. The water smells foul.
- `audio/page-narration/gr-e-25-page-02.mp3`: No frogs croak. No dragonflies hover. The pond is dying.
- `audio/page-narration/gr-e-25-page-03.mp3`: Tara makes a pledge. We will clean this pond. We will save it.
- `audio/page-narration/gr-e-25-page-04.mp3`: Every Friday, they pull out bottles and bags. They scoop mud.
- `audio/page-narration/gr-e-25-page-05.mp3`: Week by week, the water clears. Green moss returns. Tadpoles wriggle.
- `audio/page-narration/gr-e-25-page-06.mp3`: At last, a frog croaks. Tara keeps her promise. Nature keeps its promise too.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-31: How Seeds Become Plants

- Type: nonfiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: science vocabulary, sequence words, short vowels
- Theme/learning goal: plant life cycle
- Cover filename: `images/covers/gr-b-31-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `How Seeds Become Plants`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | A seed is small. But it has a big job. | `images/pages/gr-b-31-page-01.png` | Illustrate this page only: A seed is small. But it has a big job. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science vocabulary, sequence words, short vowels, seed, job, A, is, small, But, it, has, a, big |
| 2 | The seed sits in soil. It drinks up water. | `images/pages/gr-b-31-page-02.png` | Illustrate this page only: The seed sits in soil. It drinks up water. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science vocabulary, sequence words, short vowels, seed, sits, soil, drinks, The, in, It, up, water |
| 3 | A root pops out. It digs deep down. | `images/pages/gr-b-31-page-03.png` | Illustrate this page only: A root pops out. It digs deep down. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science vocabulary, sequence words, short vowels, root, pops, digs, deep, out, It, down |
| 4 | A stem reaches up. A leaf opens wide. | `images/pages/gr-b-31-page-04.png` | Illustrate this page only: A stem reaches up. A leaf opens wide. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science vocabulary, sequence words, short vowels, stem, reaches, leaf, opens, wide, up, A |
| 5 | The sun gives the plant food. It grows tall. | `images/pages/gr-b-31-page-05.png` | Illustrate this page only: The sun gives the plant food. It grows tall. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science vocabulary, sequence words, short vowels, plant, grows, The, sun, gives, the, food, It, tall |
| 6 | A tiny seed can become a huge plant. Nature is amazing! | `images/pages/gr-b-31-page-06.png` | Illustrate this page only: A tiny seed can become a huge plant. Nature is amazing! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science vocabulary, sequence words, short vowels, tiny, seed, huge, plant, Nature, A, can, become, a, is, amazing |

Audio files required:

- `audio/page-narration/gr-b-31-page-01.mp3`: A seed is small. But it has a big job.
- `audio/page-narration/gr-b-31-page-02.mp3`: The seed sits in soil. It drinks up water.
- `audio/page-narration/gr-b-31-page-03.mp3`: A root pops out. It digs deep down.
- `audio/page-narration/gr-b-31-page-04.mp3`: A stem reaches up. A leaf opens wide.
- `audio/page-narration/gr-b-31-page-05.mp3`: The sun gives the plant food. It grows tall.
- `audio/page-narration/gr-b-31-page-06.mp3`: A tiny seed can become a huge plant. Nature is amazing!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-32: Why Bees Visit Flowers

- Type: nonfiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: science concepts, pollination intro, simple cause-effect
- Theme/learning goal: pollination and nature's partnerships
- Cover filename: `images/covers/gr-b-32-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Why Bees Visit Flowers`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Bees buzz from flower to flower. They are not just playing. | `images/pages/gr-b-32-page-01.png` | Illustrate this page only: Bees buzz from flower to flower. They are not just playing. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science concepts, pollination intro, simple cause-effect, Bees, buzz, flower, flower, from, to, They, are, not, just, playing |
| 2 | A flower has sweet nectar inside. The bee wants a sip. | `images/pages/gr-b-32-page-02.png` | Illustrate this page only: A flower has sweet nectar inside. The bee wants a sip. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science concepts, pollination intro, simple cause-effect, flower, sweet, bee, sip, A, has, nectar, inside, The, wants, a |
| 3 | The bee lands on a petal. Dust sticks to its legs. | `images/pages/gr-b-32-page-03.png` | Illustrate this page only: The bee lands on a petal. Dust sticks to its legs. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science concepts, pollination intro, simple cause-effect, bee, lands, petal, Dust, sticks, legs, The, on, a, its |
| 4 | That dust is pollen. It helps plants make seeds. | `images/pages/gr-b-32-page-04.png` | Illustrate this page only: That dust is pollen. It helps plants make seeds. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science concepts, pollination intro, simple cause-effect, dust, pollen, That, is, helps, plants, make, seeds |
| 5 | The bee flies to the next bloom. Pollen drops off. | `images/pages/gr-b-32-page-05.png` | Illustrate this page only: The bee flies to the next bloom. Pollen drops off. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science concepts, pollination intro, simple cause-effect, bee, flies, bloom, Pollen, drops, The, to, the, next, off |
| 6 | Bees get food. Flowers get help. They need each other! | `images/pages/gr-b-32-page-06.png` | Illustrate this page only: Bees get food. Flowers get help. They need each other! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science concepts, pollination intro, simple cause-effect, Bees, Flowers, get, food, get, help, They, need, each, other |

Audio files required:

- `audio/page-narration/gr-b-32-page-01.mp3`: Bees buzz from flower to flower. They are not just playing.
- `audio/page-narration/gr-b-32-page-02.mp3`: A flower has sweet nectar inside. The bee wants a sip.
- `audio/page-narration/gr-b-32-page-03.mp3`: The bee lands on a petal. Dust sticks to its legs.
- `audio/page-narration/gr-b-32-page-04.mp3`: That dust is pollen. It helps plants make seeds.
- `audio/page-narration/gr-b-32-page-05.mp3`: The bee flies to the next bloom. Pollen drops off.
- `audio/page-narration/gr-b-32-page-06.mp3`: Bees get food. Flowers get help. They need each other!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-33: What Makes Shadows?

- Type: nonfiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: light and shadow science, question-answer format
- Theme/learning goal: physics of light and shadows
- Cover filename: `images/covers/gr-b-33-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `What Makes Shadows?`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Look at your shadow! It moves when you move. | `images/pages/gr-b-33-page-01.png` | Illustrate this page only: Look at your shadow! It moves when you move. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | light and shadow science, question-answer format, Look, shadow, moves, at, your, It, when, you, move |
| 2 | A shadow needs light. It also needs something solid. | `images/pages/gr-b-33-page-02.png` | Illustrate this page only: A shadow needs light. It also needs something solid. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | light and shadow science, question-answer format, shadow, solid, A, needs, light, It, also, needs, something |
| 3 | When light hits you, it stops. It cannot pass through. | `images/pages/gr-b-33-page-03.png` | Illustrate this page only: When light hits you, it stops. It cannot pass through. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | light and shadow science, question-answer format, hits, When, light, it, stops, It, cannot, pass, through |
| 4 | The dark spot behind you is the shadow. | `images/pages/gr-b-33-page-04.png` | Illustrate this page only: The dark spot behind you is the shadow. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | light and shadow science, question-answer format, shadow, The, dark, spot, behind, you, is, the |
| 5 | A big object makes a big shadow. A small object makes a small one. | `images/pages/gr-b-33-page-05.png` | Illustrate this page only: A big object makes a big shadow. A small object makes a small one. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | light and shadow science, question-answer format, big, object, big, shadow, small, object, small, A, makes, a, A, makes, a, one |
| 6 | Try it! Stand in the sun. Watch your shadow dance. | `images/pages/gr-b-33-page-06.png` | Illustrate this page only: Try it! Stand in the sun. Watch your shadow dance. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | light and shadow science, question-answer format, Stand, shadow, dance, in, the, sun, Watch, your |

Audio files required:

- `audio/page-narration/gr-b-33-page-01.mp3`: Look at your shadow! It moves when you move.
- `audio/page-narration/gr-b-33-page-02.mp3`: A shadow needs light. It also needs something solid.
- `audio/page-narration/gr-b-33-page-03.mp3`: When light hits you, it stops. It cannot pass through.
- `audio/page-narration/gr-b-33-page-04.mp3`: The dark spot behind you is the shadow.
- `audio/page-narration/gr-b-33-page-05.mp3`: A big object makes a big shadow. A small object makes a small one.
- `audio/page-narration/gr-b-33-page-06.mp3`: Try it! Stand in the sun. Watch your shadow dance.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-34: How Bread Is Made

- Type: nonfiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: sequence and process, food science vocabulary
- Theme/learning goal: from wheat to bread
- Cover filename: `images/covers/gr-b-34-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `How Bread Is Made`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Bread starts as a tiny seed. The seed is wheat. | `images/pages/gr-b-34-page-01.png` | Illustrate this page only: Bread starts as a tiny seed. The seed is wheat. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sequence and process, food science vocabulary, Bread, starts, tiny, seed, seed, wheat, as, a, The, is |
| 2 | Farmers plant wheat in fields. The sun and rain help it grow. | `images/pages/gr-b-34-page-02.png` | Illustrate this page only: Farmers plant wheat in fields. The sun and rain help it grow. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sequence and process, food science vocabulary, Farmers, plant, wheat, fields, sun, rain, in, The, and, help, it, grow |
| 3 | When wheat is dry, it turns to grain. Mills grind the grain into flour. | `images/pages/gr-b-34-page-03.png` | Illustrate this page only: When wheat is dry, it turns to grain. Mills grind the grain into flour. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sequence and process, food science vocabulary, wheat, Mills, grain, flour, When, is, dry, it, turns, to, grain, grind, the, into |
| 4 | Bakers mix flour with water and yeast. The dough gets soft and puffy. | `images/pages/gr-b-34-page-04.png` | Illustrate this page only: Bakers mix flour with water and yeast. The dough gets soft and puffy. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sequence and process, food science vocabulary, Bakers, mix, flour, water, yeast, dough, puffy, with, and, The, gets, soft, and |
| 5 | They bake the dough in a hot oven. The smell fills the room! | `images/pages/gr-b-34-page-05.png` | Illustrate this page only: They bake the dough in a hot oven. The smell fills the room! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sequence and process, food science vocabulary, They, bake, dough, the, in, a, hot, oven, The, smell, fills, the, room |
| 6 | From seed to loaf, many hands help. Bread is a team effort! | `images/pages/gr-b-34-page-06.png` | Illustrate this page only: From seed to loaf, many hands help. Bread is a team effort! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | sequence and process, food science vocabulary, seed, loaf, Bread, From, to, many, hands, help, is, a, team, effort |

Audio files required:

- `audio/page-narration/gr-b-34-page-01.mp3`: Bread starts as a tiny seed. The seed is wheat.
- `audio/page-narration/gr-b-34-page-02.mp3`: Farmers plant wheat in fields. The sun and rain help it grow.
- `audio/page-narration/gr-b-34-page-03.mp3`: When wheat is dry, it turns to grain. Mills grind the grain into flour.
- `audio/page-narration/gr-b-34-page-04.mp3`: Bakers mix flour with water and yeast. The dough gets soft and puffy.
- `audio/page-narration/gr-b-34-page-05.mp3`: They bake the dough in a hot oven. The smell fills the room!
- `audio/page-narration/gr-b-34-page-06.mp3`: From seed to loaf, many hands help. Bread is a team effort!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-b-35: Big Machines at Work

- Type: nonfiction
- Level: B
- Level control: Early sentence reading. Simple but coherent events, high-frequency support, light decodable patterns, natural oral language.
- Target skills: machine vocabulary, descriptive features, action words
- Theme/learning goal: construction vehicles and their jobs
- Cover filename: `images/covers/gr-b-35-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Big Machines at Work`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Look at the big machines! Each one has a special job. | `images/pages/gr-b-35-page-01.png` | Illustrate this page only: Look at the big machines! Each one has a special job. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | machine vocabulary, descriptive features, action words, Look, machines, at, the, big, Each, one, has, a, special, job |
| 2 | The bulldozer pushes piles of dirt. It clears the land. | `images/pages/gr-b-35-page-02.png` | Illustrate this page only: The bulldozer pushes piles of dirt. It clears the land. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | machine vocabulary, descriptive features, action words, bulldozer, land, The, pushes, piles, of, dirt, It, clears, the |
| 3 | The crane lifts steel beams up high. It builds towers. | `images/pages/gr-b-35-page-03.png` | Illustrate this page only: The crane lifts steel beams up high. It builds towers. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | machine vocabulary, descriptive features, action words, crane, lifts, steel, beams, towers, The, up, high, It, builds |
| 4 | The dump truck hauls rocks and sand. Its bed tips way back. | `images/pages/gr-b-35-page-04.png` | Illustrate this page only: The dump truck hauls rocks and sand. Its bed tips way back. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | machine vocabulary, descriptive features, action words, dump, truck, hauls, rocks, sand, and, Its, bed, tips, way, back |
| 5 | The cement mixer spins and spins. It keeps concrete smooth. | `images/pages/gr-b-35-page-05.png` | Illustrate this page only: The cement mixer spins and spins. It keeps concrete smooth. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | machine vocabulary, descriptive features, action words, cement, mixer, spins, spins, concrete, and, keeps, smooth |
| 6 | Big machines work hard. They help build our roads and homes! | `images/pages/gr-b-35-page-06.png` | Illustrate this page only: Big machines work hard. They help build our roads and homes! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | machine vocabulary, descriptive features, action words, Big, machines, work, hard, They, help, build, our, roads, and, homes |

Audio files required:

- `audio/page-narration/gr-b-35-page-01.mp3`: Look at the big machines! Each one has a special job.
- `audio/page-narration/gr-b-35-page-02.mp3`: The bulldozer pushes piles of dirt. It clears the land.
- `audio/page-narration/gr-b-35-page-03.mp3`: The crane lifts steel beams up high. It builds towers.
- `audio/page-narration/gr-b-35-page-04.mp3`: The dump truck hauls rocks and sand. Its bed tips way back.
- `audio/page-narration/gr-b-35-page-05.mp3`: The cement mixer spins and spins. It keeps concrete smooth.
- `audio/page-narration/gr-b-35-page-06.mp3`: Big machines work hard. They help build our roads and homes!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-36: Weather Tools

- Type: nonfiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: science tools vocabulary, how things work, silent e
- Theme/learning goal: tools meteorologists use
- Cover filename: `images/covers/gr-c-36-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Weather Tools`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | How do we know what the weather will be? We use tools! | `images/pages/gr-c-36-page-01.png` | Illustrate this page only: How do we know what the weather will be? We use tools! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science tools vocabulary, how things work, silent e, tools, do, we, know, what, the, weather, will, be, We, use |
| 2 | A thermometer measures heat. The red line rises on a hot day. | `images/pages/gr-c-36-page-02.png` | Illustrate this page only: A thermometer measures heat. The red line rises on a hot day. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science tools vocabulary, how things work, silent e, thermometer, rises, measures, heat, The, red, line, on, a, hot, day |
| 3 | A rain gauge collects drops. It shows how much rain fell. | `images/pages/gr-c-36-page-03.png` | Illustrate this page only: A rain gauge collects drops. It shows how much rain fell. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science tools vocabulary, how things work, silent e, gauge, collects, drops, It, shows, how, much, rain, fell |
| 4 | A wind vane points where wind blows. It spins on top of a pole. | `images/pages/gr-c-36-page-04.png` | Illustrate this page only: A wind vane points where wind blows. It spins on top of a pole. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science tools vocabulary, how things work, silent e, vane, points, where, wind, blows, It, spins, on, top, of, a, pole |
| 5 | A barometer measures air pressure. It helps predict storms. | `images/pages/gr-c-36-page-05.png` | Illustrate this page only: A barometer measures air pressure. It helps predict storms. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science tools vocabulary, how things work, silent e, barometer, measures, air, pressure, It, helps, predict, storms |
| 6 | With these tools, we can read the sky. Weather is no mystery! | `images/pages/gr-c-36-page-06.png` | Illustrate this page only: With these tools, we can read the sky. Weather is no mystery! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | science tools vocabulary, how things work, silent e, With, these, tools, we, can, read, the, sky, Weather, is, no, mystery |

Audio files required:

- `audio/page-narration/gr-c-36-page-01.mp3`: How do we know what the weather will be? We use tools!
- `audio/page-narration/gr-c-36-page-02.mp3`: A thermometer measures heat. The red line rises on a hot day.
- `audio/page-narration/gr-c-36-page-03.mp3`: A rain gauge collects drops. It shows how much rain fell.
- `audio/page-narration/gr-c-36-page-04.mp3`: A wind vane points where wind blows. It spins on top of a pole.
- `audio/page-narration/gr-c-36-page-05.mp3`: A barometer measures air pressure. It helps predict storms.
- `audio/page-narration/gr-c-36-page-06.mp3`: With these tools, we can read the sky. Weather is no mystery!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-37: How We Use Water

- Type: nonfiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: everyday science, conservation awareness, descriptive language
- Theme/learning goal: water in our daily lives
- Cover filename: `images/covers/gr-c-37-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `How We Use Water`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Water is everywhere. It is in our lakes, sinks, and bodies. | `images/pages/gr-c-37-page-01.png` | Illustrate this page only: Water is everywhere. It is in our lakes, sinks, and bodies. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | everyday science, conservation awareness, descriptive language, Water, lakes, sinks, bodies, is, everywhere, It, is, in, our, and |
| 2 | We drink water to stay healthy. It keeps our skin clear. | `images/pages/gr-c-37-page-02.png` | Illustrate this page only: We drink water to stay healthy. It keeps our skin clear. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | everyday science, conservation awareness, descriptive language, drink, We, water, to, stay, healthy, It, keeps, our, skin, clear |
| 3 | Farmers use water to grow food. Without it, crops would wilt. | `images/pages/gr-c-37-page-03.png` | Illustrate this page only: Farmers use water to grow food. Without it, crops would wilt. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | everyday science, conservation awareness, descriptive language, Farmers, wilt, use, water, to, grow, food, Without, it, crops, would |
| 4 | Factories need water too. It cools hot machines. | `images/pages/gr-c-37-page-04.png` | Illustrate this page only: Factories need water too. It cools hot machines. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | everyday science, conservation awareness, descriptive language, Factories, cools, need, water, too, It, hot, machines |
| 5 | Water helps us clean. We wash hands, clothes, and floors. | `images/pages/gr-c-37-page-05.png` | Illustrate this page only: Water helps us clean. We wash hands, clothes, and floors. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | everyday science, conservation awareness, descriptive language, Water, floors, helps, us, clean, We, wash, hands, clothes, and |
| 6 | Clean water is precious. We must use it wisely and keep it pure. | `images/pages/gr-c-37-page-06.png` | Illustrate this page only: Clean water is precious. We must use it wisely and keep it pure. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | everyday science, conservation awareness, descriptive language, Clean, water, is, precious, We, must, use, it, wisely, and, keep, it, pure |

Audio files required:

- `audio/page-narration/gr-c-37-page-01.mp3`: Water is everywhere. It is in our lakes, sinks, and bodies.
- `audio/page-narration/gr-c-37-page-02.mp3`: We drink water to stay healthy. It keeps our skin clear.
- `audio/page-narration/gr-c-37-page-03.mp3`: Farmers use water to grow food. Without it, crops would wilt.
- `audio/page-narration/gr-c-37-page-04.mp3`: Factories need water too. It cools hot machines.
- `audio/page-narration/gr-c-37-page-05.mp3`: Water helps us clean. We wash hands, clothes, and floors.
- `audio/page-narration/gr-c-37-page-06.mp3`: Clean water is precious. We must use it wisely and keep it pure.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-38: Birds Build Nests

- Type: nonfiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: animal behavior, process description, nature vocabulary
- Theme/learning goal: how birds construct homes
- Cover filename: `images/covers/gr-c-38-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Birds Build Nests`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Birds need safe homes for their eggs. So they build nests! | `images/pages/gr-c-38-page-01.png` | Illustrate this page only: Birds need safe homes for their eggs. So they build nests! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, process description, nature vocabulary, Birds, nests, need, safe, homes, for, their, eggs, So, they, build |
| 2 | A robin weaves grass and twigs. She makes a round cup. | `images/pages/gr-c-38-page-02.png` | Illustrate this page only: A robin weaves grass and twigs. She makes a round cup. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, process description, nature vocabulary, robin, weaves, grass, twigs, A, and, She, makes, a, round, cup |
| 3 | A hummingbird uses spider silk. The silk holds the nest to a branch. | `images/pages/gr-c-38-page-03.png` | Illustrate this page only: A hummingbird uses spider silk. The silk holds the nest to a branch. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, process description, nature vocabulary, hummingbird, spider, uses, silk, The, silk, holds, the, nest, to, a, branch |
| 4 | An eagle builds a huge pile of sticks. It can weigh a ton! | `images/pages/gr-c-38-page-04.png` | Illustrate this page only: An eagle builds a huge pile of sticks. It can weigh a ton! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, process description, nature vocabulary, eagle, builds, huge, pile, An, of, sticks, It, can, weigh, a, ton |
| 5 | A woodpecker carves a hole in a tree. No sticks needed! | `images/pages/gr-c-38-page-05.png` | Illustrate this page only: A woodpecker carves a hole in a tree. No sticks needed! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, process description, nature vocabulary, woodpecker, carves, hole, in, a, tree, No, sticks, needed |
| 6 | Each nest is just right for its bird. Nature is a clever builder! | `images/pages/gr-c-38-page-06.png` | Illustrate this page only: Each nest is just right for its bird. Nature is a clever builder! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, process description, nature vocabulary, Nature, Each, nest, is, just, right, for, its, bird, is, a, clever, builder |

Audio files required:

- `audio/page-narration/gr-c-38-page-01.mp3`: Birds need safe homes for their eggs. So they build nests!
- `audio/page-narration/gr-c-38-page-02.mp3`: A robin weaves grass and twigs. She makes a round cup.
- `audio/page-narration/gr-c-38-page-03.mp3`: A hummingbird uses spider silk. The silk holds the nest to a branch.
- `audio/page-narration/gr-c-38-page-04.mp3`: An eagle builds a huge pile of sticks. It can weigh a ton!
- `audio/page-narration/gr-c-38-page-05.mp3`: A woodpecker carves a hole in a tree. No sticks needed!
- `audio/page-narration/gr-c-38-page-06.mp3`: Each nest is just right for its bird. Nature is a clever builder!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-39: From Caterpillar to Butterfly

- Type: nonfiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: life cycle sequence, transformation vocabulary, nature science
- Theme/learning goal: complete metamorphosis
- Cover filename: `images/covers/gr-c-39-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `From Caterpillar to Butterfly`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | A butterfly starts as an egg. The egg is no bigger than a dot! | `images/pages/gr-c-39-page-01.png` | Illustrate this page only: A butterfly starts as an egg. The egg is no bigger than a dot! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | life cycle sequence, transformation vocabulary, nature science, butterfly, A, starts, as, an, egg, The, egg, is, no, bigger, than, a |
| 2 | The egg hatches. A tiny caterpillar crawls out. It is very hungry! | `images/pages/gr-c-39-page-02.png` | Illustrate this page only: The egg hatches. A tiny caterpillar crawls out. It is very hungry! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | life cycle sequence, transformation vocabulary, nature science, caterpillar, crawls, The, egg, hatches, A, tiny, out, It, is, very, hungry |
| 3 | The caterpillar eats leaves. It grows bigger each day. | `images/pages/gr-c-39-page-03.png` | Illustrate this page only: The caterpillar eats leaves. It grows bigger each day. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | life cycle sequence, transformation vocabulary, nature science, caterpillar, The, eats, leaves, It, grows, bigger, each, day |
| 4 | Then it spins a chrysalis. It hangs like a jewel on a stem. | `images/pages/gr-c-39-page-04.png` | Illustrate this page only: Then it spins a chrysalis. It hangs like a jewel on a stem. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | life cycle sequence, transformation vocabulary, nature science, chrysalis, hangs, Then, it, spins, a, It, like, a, jewel, on, a, stem |
| 5 | Inside, big changes happen. The caterpillar turns to soup! | `images/pages/gr-c-39-page-05.png` | Illustrate this page only: Inside, big changes happen. The caterpillar turns to soup! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | life cycle sequence, transformation vocabulary, nature science, caterpillar, soup, Inside, big, changes, happen, The, turns, to |
| 6 | At last, a winged beauty breaks free. Hello, butterfly! | `images/pages/gr-c-39-page-06.png` | Illustrate this page only: At last, a winged beauty breaks free. Hello, butterfly! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | life cycle sequence, transformation vocabulary, nature science, butterfly, At, last, a, winged, beauty, breaks, free, Hello |

Audio files required:

- `audio/page-narration/gr-c-39-page-01.mp3`: A butterfly starts as an egg. The egg is no bigger than a dot!
- `audio/page-narration/gr-c-39-page-02.mp3`: The egg hatches. A tiny caterpillar crawls out. It is very hungry!
- `audio/page-narration/gr-c-39-page-03.mp3`: The caterpillar eats leaves. It grows bigger each day.
- `audio/page-narration/gr-c-39-page-04.mp3`: Then it spins a chrysalis. It hangs like a jewel on a stem.
- `audio/page-narration/gr-c-39-page-05.mp3`: Inside, big changes happen. The caterpillar turns to soup!
- `audio/page-narration/gr-c-39-page-06.mp3`: At last, a winged beauty breaks free. Hello, butterfly!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-c-40: Healthy Hands

- Type: nonfiction
- Level: C
- Level control: Stronger Grade 1. More complete story/information sequence, decodable patterns in context, simple dialogue only when useful.
- Target skills: health habits, procedural text, hygiene vocabulary
- Theme/learning goal: proper handwashing and health
- Cover filename: `images/covers/gr-c-40-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Healthy Hands`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Your hands touch many things. They pick up germs you cannot see. | `images/pages/gr-c-40-page-01.png` | Illustrate this page only: Your hands touch many things. They pick up germs you cannot see. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | health habits, procedural text, hygiene vocabulary, Your, hands, touch, many, things, They, pick, up, germs, you, cannot, see |
| 2 | Germs can make you sick. Washing hands keeps them away. | `images/pages/gr-c-40-page-02.png` | Illustrate this page only: Germs can make you sick. Washing hands keeps them away. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | health habits, procedural text, hygiene vocabulary, Germs, can, make, you, sick, Washing, hands, keeps, them, away |
| 3 | First, wet your hands under warm water. | `images/pages/gr-c-40-page-03.png` | Illustrate this page only: First, wet your hands under warm water. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | health habits, procedural text, hygiene vocabulary, First, wet, your, hands, under, warm, water |
| 4 | Next, add soap. Rub your palms, backs, and between fingers. | `images/pages/gr-c-40-page-04.png` | Illustrate this page only: Next, add soap. Rub your palms, backs, and between fingers. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | health habits, procedural text, hygiene vocabulary, Rub, palms, backs, Next, add, soap, your, and, between, fingers |
| 5 | Scrub for twenty seconds. Sing a song to keep time! | `images/pages/gr-c-40-page-05.png` | Illustrate this page only: Scrub for twenty seconds. Sing a song to keep time! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | health habits, procedural text, hygiene vocabulary, Scrub, for, twenty, seconds, Sing, a, song, to, keep, time |
| 6 | Rinse and dry. Now your hands are clean. Good job! | `images/pages/gr-c-40-page-06.png` | Illustrate this page only: Rinse and dry. Now your hands are clean. Good job! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | health habits, procedural text, hygiene vocabulary, Rinse, and, dry, Now, your, hands, are, clean, Good, job |

Audio files required:

- `audio/page-narration/gr-c-40-page-01.mp3`: Your hands touch many things. They pick up germs you cannot see.
- `audio/page-narration/gr-c-40-page-02.mp3`: Germs can make you sick. Washing hands keeps them away.
- `audio/page-narration/gr-c-40-page-03.mp3`: First, wet your hands under warm water.
- `audio/page-narration/gr-c-40-page-04.mp3`: Next, add soap. Rub your palms, backs, and between fingers.
- `audio/page-narration/gr-c-40-page-05.mp3`: Scrub for twenty seconds. Sing a song to keep time!
- `audio/page-narration/gr-c-40-page-06.mp3`: Rinse and dry. Now your hands are clean. Good job!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-41: How Bridges Hold Weight

- Type: nonfiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: engineering concepts, structural vocabulary, cause-effect
- Theme/learning goal: bridge engineering basics
- Cover filename: `images/covers/gr-d-41-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `How Bridges Hold Weight`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Bridges carry people and cars across rivers and valleys. How do they stay up? | `images/pages/gr-d-41-page-01.png` | Illustrate this page only: Bridges carry people and cars across rivers and valleys. How do they stay up? Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | engineering concepts, structural vocabulary, cause-effect, Bridges, carry, people, and, cars, across, rivers, and, valleys, How, do, they, stay, up |
| 2 | A beam bridge is flat and simple. The beam pushes down on two strong posts called piers. | `images/pages/gr-d-41-page-02.png` | Illustrate this page only: A beam bridge is flat and simple. The beam pushes down on two strong posts called piers. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | engineering concepts, structural vocabulary, cause-effect, beam, bridge, beam, piers, is, flat, and, simple, The, pushes, down, on, two, strong, posts, called |
| 3 | An arch bridge curves up. The curve spreads weight to both ends. | `images/pages/gr-d-41-page-03.png` | Illustrate this page only: An arch bridge curves up. The curve spreads weight to both ends. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | engineering concepts, structural vocabulary, cause-effect, arch, bridge, curves, An, up, The, curve, spreads, weight, to, both, ends |
| 4 | A suspension bridge hangs from cables. Towers hold the cables tight. | `images/pages/gr-d-41-page-04.png` | Illustrate this page only: A suspension bridge hangs from cables. Towers hold the cables tight. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | engineering concepts, structural vocabulary, cause-effect, suspension, bridge, hangs, Towers, A, from, cables, hold, the, cables, tight |
| 5 | The key is balance. Every part shares the load. Engineers test each bridge. | `images/pages/gr-d-41-page-05.png` | Illustrate this page only: The key is balance. Every part shares the load. Engineers test each bridge. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | engineering concepts, structural vocabulary, cause-effect, Engineers, test, The, key, is, balance, Every, part, shares, the, load, Each, bridge |
| 6 | Next time you cross a bridge, look at its shape. Smart design keeps you safe! | `images/pages/gr-d-41-page-06.png` | Illustrate this page only: Next time you cross a bridge, look at its shape. Smart design keeps you safe! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | engineering concepts, structural vocabulary, cause-effect, Smart, design, Next, time, you, cross, a, bridge, look, at, its, shape, keeps, you, safe |

Audio files required:

- `audio/page-narration/gr-d-41-page-01.mp3`: Bridges carry people and cars across rivers and valleys. How do they stay up?
- `audio/page-narration/gr-d-41-page-02.mp3`: A beam bridge is flat and simple. The beam pushes down on two strong posts called piers.
- `audio/page-narration/gr-d-41-page-03.mp3`: An arch bridge curves up. The curve spreads weight to both ends.
- `audio/page-narration/gr-d-41-page-04.mp3`: A suspension bridge hangs from cables. Towers hold the cables tight.
- `audio/page-narration/gr-d-41-page-05.mp3`: The key is balance. Every part shares the load. Engineers test each bridge.
- `audio/page-narration/gr-d-41-page-06.mp3`: Next time you cross a bridge, look at its shape. Smart design keeps you safe!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-42: Why Leaves Change

- Type: nonfiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: seasonal science, chlorophyll concept, nature cycles
- Theme/learning goal: the science of autumn leaf color
- Cover filename: `images/covers/gr-d-42-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Why Leaves Change`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | In summer, leaves are green. But hidden colors wait inside. | `images/pages/gr-d-42-page-01.png` | Illustrate this page only: In summer, leaves are green. But hidden colors wait inside. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | seasonal science, chlorophyll concept, nature cycles, In, summer, leaves, are, green, But, hidden, colors, wait, inside |
| 2 | A green chemical called chlorophyll helps leaves catch sunlight. | `images/pages/gr-d-42-page-02.png` | Illustrate this page only: A green chemical called chlorophyll helps leaves catch sunlight. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | seasonal science, chlorophyll concept, nature cycles, chlorophyll, A, green, chemical, called, helps, leaves, catch, sunlight |
| 3 | As days get shorter, trees make less chlorophyll. The green fades away. | `images/pages/gr-d-42-page-03.png` | Illustrate this page only: As days get shorter, trees make less chlorophyll. The green fades away. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | seasonal science, chlorophyll concept, nature cycles, chlorophyll, As, days, get, shorter, trees, make, less, The, green, fades, away |
| 4 | Then yellow and orange shine through. These colors were there all along! | `images/pages/gr-d-42-page-04.png` | Illustrate this page only: Then yellow and orange shine through. These colors were there all along! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | seasonal science, chlorophyll concept, nature cycles, Then, yellow, and, orange, shine, through, These, colors, were, there, all, along |
| 5 | Some trees make red and purple too. Sugar trapped in leaves makes these hues. | `images/pages/gr-d-42-page-05.png` | Illustrate this page only: Some trees make red and purple too. Sugar trapped in leaves makes these hues. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | seasonal science, chlorophyll concept, nature cycles, hues, Some, trees, make, red, and, too, Sugar, trapped, in, leaves, makes, these |
| 6 | When leaves fall, they feed the soil. New green leaves will come in spring! | `images/pages/gr-d-42-page-06.png` | Illustrate this page only: When leaves fall, they feed the soil. New green leaves will come in spring! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | seasonal science, chlorophyll concept, nature cycles, When, leaves, fall, they, feed, the, soil, New, green, leaves, will, come, in, spring |

Audio files required:

- `audio/page-narration/gr-d-42-page-01.mp3`: In summer, leaves are green. But hidden colors wait inside.
- `audio/page-narration/gr-d-42-page-02.mp3`: A green chemical called chlorophyll helps leaves catch sunlight.
- `audio/page-narration/gr-d-42-page-03.mp3`: As days get shorter, trees make less chlorophyll. The green fades away.
- `audio/page-narration/gr-d-42-page-04.mp3`: Then yellow and orange shine through. These colors were there all along!
- `audio/page-narration/gr-d-42-page-05.mp3`: Some trees make red and purple too. Sugar trapped in leaves makes these hues.
- `audio/page-narration/gr-d-42-page-06.mp3`: When leaves fall, they feed the soil. New green leaves will come in spring!

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-43: The Work of Pollinators

- Type: nonfiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: ecosystem science, animal roles, cause-effect
- Theme/learning goal: pollinators and food production
- Cover filename: `images/covers/gr-d-43-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `The Work of Pollinators`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | One out of every three bites of food exists because of pollinators. | `images/pages/gr-d-43-page-01.png` | Illustrate this page only: One out of every three bites of food exists because of pollinators. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | ecosystem science, animal roles, cause-effect, pollinators, one, out, of, every, three, bites, of, food, exists, because, of |
| 2 | Bees are the most famous pollinators. But butterflies, birds, and bats help too. | `images/pages/gr-d-43-page-02.png` | Illustrate this page only: Bees are the most famous pollinators. But butterflies, birds, and bats help too. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | ecosystem science, animal roles, cause-effect, Bees, pollinators, butterflies, birds, bats, are, the, most, famous, But, and, and, help, too |
| 3 | When a bee visits a bloom, pollen dusts its fuzzy body. | `images/pages/gr-d-43-page-03.png` | Illustrate this page only: When a bee visits a bloom, pollen dusts its fuzzy body. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | ecosystem science, animal roles, cause-effect, When, a, bee, visits, a, bloom, pollen, dusts, its, fuzzy, body |
| 4 | The bee flies to the next flower. Pollen rubs off. The flower can now make fruit. | `images/pages/gr-d-43-page-04.png` | Illustrate this page only: The bee flies to the next flower. Pollen rubs off. The flower can now make fruit. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | ecosystem science, animal roles, cause-effect, The, bee, flies, to, the, next, flower, Pollen, rubs, off, The, flower, can, now, make, fruit |
| 5 | Without pollinators, apples, berries, and almonds would vanish. | `images/pages/gr-d-43-page-05.png` | Illustrate this page only: Without pollinators, apples, berries, and almonds would vanish. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | ecosystem science, animal roles, cause-effect, pollinators, Without, apples, berries, and, almonds, would, vanish |
| 6 | Planting flowers helps pollinators thrive. They feed us. We should feed them too. | `images/pages/gr-d-43-page-06.png` | Illustrate this page only: Planting flowers helps pollinators thrive. They feed us. We should feed them too. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | ecosystem science, animal roles, cause-effect, Planting, flowers, helps, pollinators, thrive, They, feed, us, We, should, feed, them, too |

Audio files required:

- `audio/page-narration/gr-d-43-page-01.mp3`: One out of every three bites of food exists because of pollinators.
- `audio/page-narration/gr-d-43-page-02.mp3`: Bees are the most famous pollinators. But butterflies, birds, and bats help too.
- `audio/page-narration/gr-d-43-page-03.mp3`: When a bee visits a bloom, pollen dusts its fuzzy body.
- `audio/page-narration/gr-d-43-page-04.mp3`: The bee flies to the next flower. Pollen rubs off. The flower can now make fruit.
- `audio/page-narration/gr-d-43-page-05.mp3`: Without pollinators, apples, berries, and almonds would vanish.
- `audio/page-narration/gr-d-43-page-06.mp3`: Planting flowers helps pollinators thrive. They feed us. We should feed them too.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-44: How Communities Share Spaces

- Type: nonfiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: social studies, community concepts, compare-contrast
- Theme/learning goal: shared community places and their purposes
- Cover filename: `images/covers/gr-d-44-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `How Communities Share Spaces`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | A community is a group of people living in the same area. They share many spaces. | `images/pages/gr-d-44-page-01.png` | Illustrate this page only: A community is a group of people living in the same area. They share many spaces. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | social studies, community concepts, compare-contrast, community, is, a, group, of, people, living, in, the, same, area, They, share, many, spaces |
| 2 | A park gives people a place to play and rest. It has grass, trees, and paths. | `images/pages/gr-d-44-page-02.png` | Illustrate this page only: A park gives people a place to play and rest. It has grass, trees, and paths. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | social studies, community concepts, compare-contrast, park, grass, trees, paths, gives, people, a, place, to, play, and, rest, It, has, and, and |
| 3 | A library holds books for everyone. You can borrow stories and learn new facts. | `images/pages/gr-d-44-page-03.png` | Illustrate this page only: A library holds books for everyone. You can borrow stories and learn new facts. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | social studies, community concepts, compare-contrast, library, holds, books, for, everyone, You, can, borrow, stories, and, learn, new, facts |
| 4 | A market lets people buy fresh food. Farmers sell fruits and vegetables there. | `images/pages/gr-d-44-page-04.png` | Illustrate this page only: A market lets people buy fresh food. Farmers sell fruits and vegetables there. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | social studies, community concepts, compare-contrast, market, Farmers, fruits, vegetables, lets, people, buy, fresh, food, sell, and, there |
| 5 | A school is where children learn. Teachers help them read, write, and think. | `images/pages/gr-d-44-page-05.png` | Illustrate this page only: A school is where children learn. Teachers help them read, write, and think. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | social studies, community concepts, compare-contrast, school, is, where, children, learn, Teachers, help, them, read, write, and, think |
| 6 | These spaces bring people together. When we share, our community grows stronger. | `images/pages/gr-d-44-page-06.png` | Illustrate this page only: These spaces bring people together. When we share, our community grows stronger. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | social studies, community concepts, compare-contrast, These, spaces, bring, people, together, When, we, share, our, community, grows, stronger |

Audio files required:

- `audio/page-narration/gr-d-44-page-01.mp3`: A community is a group of people living in the same area. They share many spaces.
- `audio/page-narration/gr-d-44-page-02.mp3`: A park gives people a place to play and rest. It has grass, trees, and paths.
- `audio/page-narration/gr-d-44-page-03.mp3`: A library holds books for everyone. You can borrow stories and learn new facts.
- `audio/page-narration/gr-d-44-page-04.mp3`: A market lets people buy fresh food. Farmers sell fruits and vegetables there.
- `audio/page-narration/gr-d-44-page-05.mp3`: A school is where children learn. Teachers help them read, write, and think.
- `audio/page-narration/gr-d-44-page-06.mp3`: These spaces bring people together. When we share, our community grows stronger.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-d-45: What Soil Is Made Of

- Type: nonfiction
- Level: D
- Level control: Grade 2 style. Paragraph-ready ideas across pages, richer vocabulary supported by image/context, clear problem/solution or factual sequence.
- Target skills: earth science, layers and composition, scientific vocabulary
- Theme/learning goal: soil composition and importance
- Cover filename: `images/covers/gr-d-45-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `What Soil Is Made Of`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Look down at the ground beneath your feet. That brown matter is soil. | `images/pages/gr-d-45-page-01.png` | Illustrate this page only: Look down at the ground beneath your feet. That brown matter is soil. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, layers and composition, scientific vocabulary, down, at, the, ground, beneath, your, feet, That, brown, matter, is, soil |
| 2 | Soil is a mix of many things. It has rock bits, water, air, and living matter. | `images/pages/gr-d-45-page-02.png` | Illustrate this page only: Soil is a mix of many things. It has rock bits, water, air, and living matter. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, layers and composition, scientific vocabulary, soil, is, a, mix, of, many, things, It, has, rock, bits, water, air, and, living, matter |
| 3 | Tiny rocks in soil come from big rocks that broke apart over time. | `images/pages/gr-d-45-page-03.png` | Illustrate this page only: Tiny rocks in soil come from big rocks that broke apart over time. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, layers and composition, scientific vocabulary, Tiny, rocks, in, soil, come, from, big, rocks, that, broke, apart, over, time |
| 4 | Dead leaves and plants rot in the soil. They add nutrients that help new plants grow. | `images/pages/gr-d-45-page-04.png` | Illustrate this page only: Dead leaves and plants rot in the soil. They add nutrients that help new plants grow. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, layers and composition, scientific vocabulary, nutrients, Dead, leaves, and, plants, rot, in, the, soil, They, add, that, help, new, plants, grow |
| 5 | Worms and bugs live in soil. They dig tunnels that let air and water move through. | `images/pages/gr-d-45-page-05.png` | Illustrate this page only: Worms and bugs live in soil. They dig tunnels that let air and water move through. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, layers and composition, scientific vocabulary, Worms, tunnels, and, bugs, live, in, soil, They, dig, that, let, air, and, water, move, through |
| 6 | Without soil, most plants could not grow. Soil keeps our world green and fed. | `images/pages/gr-d-45-page-06.png` | Illustrate this page only: Without soil, most plants could not grow. Soil keeps our world green and fed. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, layers and composition, scientific vocabulary, Without, soil, most, plants, could, not, grow, soil, keeps, our, world, green, and, fed |

Audio files required:

- `audio/page-narration/gr-d-45-page-01.mp3`: Look down at the ground beneath your feet. That brown matter is soil.
- `audio/page-narration/gr-d-45-page-02.mp3`: Soil is a mix of many things. It has rock bits, water, air, and living matter.
- `audio/page-narration/gr-d-45-page-03.mp3`: Tiny rocks in soil come from big rocks that broke apart over time.
- `audio/page-narration/gr-d-45-page-04.mp3`: Dead leaves and plants rot in the soil. They add nutrients that help new plants grow.
- `audio/page-narration/gr-d-45-page-05.mp3`: Worms and bugs live in soil. They dig tunnels that let air and water move through.
- `audio/page-narration/gr-d-45-page-06.mp3`: Without soil, most plants could not grow. Soil keeps our world green and fed.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-46: How Water Changes the Land

- Type: nonfiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: earth science, erosion and weathering, process description
- Theme/learning goal: water as a force that shapes landscapes
- Cover filename: `images/covers/gr-e-46-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `How Water Changes the Land`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Water is patient and powerful. Over time, it changes the shape of the land. | `images/pages/gr-e-46-page-01.png` | Illustrate this page only: Water is patient and powerful. Over time, it changes the shape of the land. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, erosion and weathering, process description, Water, is, patient, and, powerful, Over, time, it, changes, the, shape, of, the, land |
| 2 | Rain falls on mountains. Tiny drops find cracks in the rock and freeze. | `images/pages/gr-e-46-page-02.png` | Illustrate this page only: Rain falls on mountains. Tiny drops find cracks in the rock and freeze. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, erosion and weathering, process description, Rain, falls, on, mountains, Tiny, drops, find, cracks, in, the, rock, and, freeze |
| 3 | Frozen water expands. The cracks grow wider. Bits of rock break off. | `images/pages/gr-e-46-page-03.png` | Illustrate this page only: Frozen water expands. The cracks grow wider. Bits of rock break off. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, erosion and weathering, process description, Frozen, water, expands, The, cracks, grow, wider, Bits, of, rock, break, off |
| 4 | Rivers carry sand and stone. They grind against canyon walls, carving deep paths. | `images/pages/gr-e-46-page-04.png` | Illustrate this page only: Rivers carry sand and stone. They grind against canyon walls, carving deep paths. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, erosion and weathering, process description, Rivers, carry, sand, and, stone, They, grind, against, canyon, walls, carving, deep, paths |
| 5 | Waves hit the shore again and again. They smooth rocks and shape beaches. | `images/pages/gr-e-46-page-05.png` | Illustrate this page only: Waves hit the shore again and again. They smooth rocks and shape beaches. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, erosion and weathering, process description, Waves, hit, the, shore, again, and, again, They, smooth, rocks, and, shape, beaches |
| 6 | Every river valley, every canyon, every beach tells a water story. | `images/pages/gr-e-46-page-06.png` | Illustrate this page only: Every river valley, every canyon, every beach tells a water story. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | earth science, erosion and weathering, process description, Every, river, valley, every, canyon, every, beach, tells, a, water, story |

Audio files required:

- `audio/page-narration/gr-e-46-page-01.mp3`: Water is patient and powerful. Over time, it changes the shape of the land.
- `audio/page-narration/gr-e-46-page-02.mp3`: Rain falls on mountains. Tiny drops find cracks in the rock and freeze.
- `audio/page-narration/gr-e-46-page-03.mp3`: Frozen water expands. The cracks grow wider. Bits of rock break off.
- `audio/page-narration/gr-e-46-page-04.mp3`: Rivers carry sand and stone. They grind against canyon walls, carving deep paths.
- `audio/page-narration/gr-e-46-page-05.mp3`: Waves hit the shore again and again. They smooth rocks and shape beaches.
- `audio/page-narration/gr-e-46-page-06.mp3`: Every river valley, every canyon, every beach tells a water story.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-47: Planning a Safe Route

- Type: nonfiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: spatial reasoning, safety concepts, procedural planning
- Theme/learning goal: how to plan safe walking routes
- Cover filename: `images/covers/gr-e-47-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Planning a Safe Route`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Getting from one place to another takes planning. A safe route keeps you out of danger. | `images/pages/gr-e-47-page-01.png` | Illustrate this page only: Getting from one place to another takes planning. A safe route keeps you out of danger. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | spatial reasoning, safety concepts, procedural planning, Getting, from, one, place, to, another, takes, planning, A, safe, route, keeps, you, out, of, danger |
| 2 | Start by looking at a map. Find your home and your goal. Trace the streets between them. | `images/pages/gr-e-47-page-02.png` | Illustrate this page only: Start by looking at a map. Find your home and your goal. Trace the streets between them. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | spatial reasoning, safety concepts, procedural planning, Start, by, looking, at, a, map, Find, your, home, and, your, goal, Trace, the, streets, between, them |
| 3 | Pick paths with sidewalks. Walking on the street is risky. Sidewolds separate you from cars. | `images/pages/gr-e-47-page-03.png` | Illustrate this page only: Pick paths with sidewalks. Walking on the street is risky. Sidewolds separate you from cars. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | spatial reasoning, safety concepts, procedural planning, paths, with, sidewalks, Walking, on, the, street, is, risky, you, from, cars |
| 4 | Choose well-lit streets. Darkness hides tripe and other hazards. Light helps you see. | `images/pages/gr-e-47-page-04.png` | Illustrate this page only: Choose well-lit streets. Darkness hides tripe and other hazards. Light helps you see. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | spatial reasoning, safety concepts, procedural planning, Choose, hazards, well, lit, streets, Darkness, hides, and, other, Light, helps, you, see |
| 5 | Cross at corners and use crosswalks. Drivers expect walkers there. Always look both ways. | `images/pages/gr-e-47-page-05.png` | Illustrate this page only: Cross at corners and use crosswalks. Drivers expect walkers there. Always look both ways. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | spatial reasoning, safety concepts, procedural planning, Cross, at, corners, and, use, crosswalks, Drivers, expect, walkers, there, Always, look, both, ways |
| 6 | A good route is safe, short, and simple. Plan ahead, walk smart, and stay alert. | `images/pages/gr-e-47-page-06.png` | Illustrate this page only: A good route is safe, short, and simple. Plan ahead, walk smart, and stay alert. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | spatial reasoning, safety concepts, procedural planning, A, good, route, is, safe, short, and, simple, Plan, ahead, walk, smart, and, stay, alert |

Audio files required:

- `audio/page-narration/gr-e-47-page-01.mp3`: Getting from one place to another takes planning. A safe route keeps you out of danger.
- `audio/page-narration/gr-e-47-page-02.mp3`: Start by looking at a map. Find your home and your goal. Trace the streets between them.
- `audio/page-narration/gr-e-47-page-03.mp3`: Pick paths with sidewalks. Walking on the street is risky. Sidewolds separate you from cars.
- `audio/page-narration/gr-e-47-page-04.mp3`: Choose well-lit streets. Darkness hides tripe and other hazards. Light helps you see.
- `audio/page-narration/gr-e-47-page-05.mp3`: Cross at corners and use crosswalks. Drivers expect walkers there. Always look both ways.
- `audio/page-narration/gr-e-47-page-06.mp3`: A good route is safe, short, and simple. Plan ahead, walk smart, and stay alert.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-48: Why Animals Migrate

- Type: nonfiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: animal behavior, seasonal adaptation, ecosystem connections
- Theme/learning goal: the reasons and methods of animal migration
- Cover filename: `images/covers/gr-e-48-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Why Animals Migrate`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Every year, billions of animals travel long distances. This journey is called migration. | `images/pages/gr-e-48-page-01.png` | Illustrate this page only: Every year, billions of animals travel long distances. This journey is called migration. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, seasonal adaptation, ecosystem connections, migration, Every, year, billions, of, animals, travel, long, distances, This, journey, is, called |
| 2 | Most animals migrate to find food. When winter comes, insects and plants disappear. | `images/pages/gr-e-48-page-02.png` | Illustrate this page only: Most animals migrate to find food. When winter comes, insects and plants disappear. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, seasonal adaptation, ecosystem connections, Most, animals, migrate, to, find, food, When, winter, comes, insects, and, plants, disappear |
| 3 | Birds fly south to warm places. They follow the same paths their parents used. | `images/pages/gr-e-48-page-03.png` | Illustrate this page only: Birds fly south to warm places. They follow the same paths their parents used. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, seasonal adaptation, ecosystem connections, Birds, fly, south, to, warm, places, They, follow, the, same, paths, their, parents, used |
| 4 | Some whales swim to cold waters to feed. There, tiny sea creatures bloom in summer. | `images/pages/gr-e-48-page-04.png` | Illustrate this page only: Some whales swim to cold waters to feed. There, tiny sea creatures bloom in summer. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, seasonal adaptation, ecosystem connections, Some, whales, swim, to, cold, waters, to, feed, There, tiny, sea, creatures, bloom, in, summer |
| 5 | Monarch butterflies travel thousands of miles. It takes four generations to complete the round trip! | `images/pages/gr-e-48-page-05.png` | Illustrate this page only: Monarch butterflies travel thousands of miles. It takes four generations to complete the round trip! Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, seasonal adaptation, ecosystem connections, Monarch, butterflies, travel, thousands, of, miles, It, takes, four, generations, to, complete, the, round, trip |
| 6 | Migrating animals do not use maps. They use the sun, stars, and Earths magnetic field to guide them. | `images/pages/gr-e-48-page-06.png` | Illustrate this page only: Migrating animals do not use maps. They use the sun, stars, and Earths magnetic field to guide them. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | animal behavior, seasonal adaptation, ecosystem connections, Migrating, Earths, animals, do, not, use, maps, They, use, the, sun, stars, and, magnetic, field, to, guide, them |

Audio files required:

- `audio/page-narration/gr-e-48-page-01.mp3`: Every year, billions of animals travel long distances. This journey is called migration.
- `audio/page-narration/gr-e-48-page-02.mp3`: Most animals migrate to find food. When winter comes, insects and plants disappear.
- `audio/page-narration/gr-e-48-page-03.mp3`: Birds fly south to warm places. They follow the same paths their parents used.
- `audio/page-narration/gr-e-48-page-04.mp3`: Some whales swim to cold waters to feed. There, tiny sea creatures bloom in summer.
- `audio/page-narration/gr-e-48-page-05.mp3`: Monarch butterflies travel thousands of miles. It takes four generations to complete the round trip!
- `audio/page-narration/gr-e-48-page-06.mp3`: Migrating animals do not use maps. They use the sun, stars, and Earths magnetic field to guide them.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-49: How Simple Machines Help

- Type: nonfiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: physics basics, six simple machines, real-world applications
- Theme/learning goal: simple machines and their uses
- Cover filename: `images/covers/gr-e-49-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `How Simple Machines Help`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | A simple machine is a tool that makes work easier. There are six kinds. | `images/pages/gr-e-49-page-01.png` | Illustrate this page only: A simple machine is a tool that makes work easier. There are six kinds. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | physics basics, six simple machines, real-world applications, simple, machine, is, a, tool, that, makes, work, easier, There, are, six, kinds |
| 2 | A lever helps you lift heavy things. A seesaw on the playground is a lever. | `images/pages/gr-e-49-page-02.png` | Illustrate this page only: A lever helps you lift heavy things. A seesaw on the playground is a lever. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | physics basics, six simple machines, real-world applications, lever, seesaw, helps, you, lift, heavy, things, A, on, the, playground, is, a, lever |
| 3 | A wheel and axle let things roll. Bikes, cars, and scooters all use this pair. | `images/pages/gr-e-49-page-03.png` | Illustrate this page only: A wheel and axle let things roll. Bikes, cars, and scooters all use this pair. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | physics basics, six simple machines, real-world applications, wheel, Bikes, cars, scooters, and, axle, let, things, roll, and, all, use, this |
| 4 | A pulley uses a rope and wheel to lift loads up high. Flagpoles use pulleys. | `images/pages/gr-e-49-page-04.png` | Illustrate this page only: A pulley uses a rope and wheel to lift loads up high. Flagpoles use pulleys. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | physics basics, six simple machines, real-world applications, pulley, pulleys, uses, a, rope, and, wheel, to, lift, loads, up, high, Flagpoles, use |
| 5 | An inclined plane is a slanted surface. Ramps help wheelchairs roll up stairs. | `images/pages/gr-e-49-page-05.png` | Illustrate this page only: An inclined plane is a slanted surface. Ramps help wheelchairs roll up stairs. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | physics basics, six simple machines, real-world applications, inclined, plane, Ramps, stairs, is, a, slanted, surface, help, wheelchairs, roll, up |
| 6 | Simple machines are everywhere. They make our daily tasks possible. | `images/pages/gr-e-49-page-06.png` | Illustrate this page only: Simple machines are everywhere. They make our daily tasks possible. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | physics basics, six simple machines, real-world applications, simple, machines, are, everywhere, They, make, our, daily, tasks, possible |

Audio files required:

- `audio/page-narration/gr-e-49-page-01.mp3`: A simple machine is a tool that makes work easier. There are six kinds.
- `audio/page-narration/gr-e-49-page-02.mp3`: A lever helps you lift heavy things. A seesaw on the playground is a lever.
- `audio/page-narration/gr-e-49-page-03.mp3`: A wheel and axle let things roll. Bikes, cars, and scooters all use this pair.
- `audio/page-narration/gr-e-49-page-04.mp3`: A pulley uses a rope and wheel to lift loads up high. Flagpoles use pulleys.
- `audio/page-narration/gr-e-49-page-05.mp3`: An inclined plane is a slanted surface. Ramps help wheelchairs roll up stairs.
- `audio/page-narration/gr-e-49-page-06.mp3`: Simple machines are everywhere. They make our daily tasks possible.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

### gr-e-50: Reading Like a Researcher

- Type: nonfiction
- Level: E
- Level control: Grade 3 style. More mature sentence variety, reasoning/comprehension value, domain vocabulary supported by context.
- Target skills: research habits, active reading, literacy metacognition
- Theme/learning goal: how to read and learn like a researcher
- Cover filename: `images/covers/gr-e-50-cover.png`
- Cover prompt: Create a warm, modern, copyright-safe cover illustration for `Reading Like a Researcher`. Show the central topic/problem clearly. No embedded title text or readable words in the image.

| Page | Exact app text / narration script | Page image filename | Matching image description | Target phonics / HFW |
|---:|---|---|---|---|
| 1 | Researchers do not just read words. They ask questions, make connections, and dig deeper. | `images/pages/gr-e-50-page-01.png` | Illustrate this page only: Researchers do not just read words. They ask questions, make connections, and dig deeper. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | research habits, active reading, literacy metacognition, Researchers, do, not, just, read, words, They, ask, questions, make, connections, and, dig, deeper |
| 2 | Before reading, look at the title and pictures. What do you already know? What do you hope to learn? | `images/pages/gr-e-50-page-02.png` | Illustrate this page only: Before reading, look at the title and pictures. What do you already know? What do you hope to learn? Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | research habits, active reading, literacy metacognition, Before, reading, look, at, the, title, and, pictures, What, do, you, already, know, What, do, you, hope, to, learn |
| 3 | While reading, pause to think. Does this make sense? Highlight important facts. | `images/pages/gr-e-50-page-03.png` | Illustrate this page only: While reading, pause to think. Does this make sense? Highlight important facts. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | research habits, active reading, literacy metacognition, While, reading, pause, to, think, Does, this, make, sense, Highlight, important, facts |
| 4 | After reading, summarize what you learned. Say it in your own words. | `images/pages/gr-e-50-page-04.png` | Illustrate this page only: After reading, summarize what you learned. Say it in your own words. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | research habits, active reading, literacy metacognition, After, reading, summarize, what, you, learned, Say, it, in, your, own, words |
| 5 | Good readers check sources. Is the author an expert? Is the information current? | `images/pages/gr-e-50-page-05.png` | Illustrate this page only: Good readers check sources. Is the author an expert? Is the information current? Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | research habits, active reading, literacy metacognition, Good, readers, check, sources, Is, the, author, an, expert, Is, the, information, current |
| 6 | Reading is not just looking at words. It is thinking, wondering, and growing your mind. | `images/pages/gr-e-50-page-06.png` | Illustrate this page only: Reading is not just looking at words. It is thinking, wondering, and growing your mind. Show the specific nouns/actions clearly, keep characters/settings consistent with the book, and include no embedded text anywhere in the image. | research habits, active reading, literacy metacognition, Reading, is, not, just, looking, at, words, It, is, thinking, wondering, and, growing, your, mind |

Audio files required:

- `audio/page-narration/gr-e-50-page-01.mp3`: Researchers do not just read words. They ask questions, make connections, and dig deeper.
- `audio/page-narration/gr-e-50-page-02.mp3`: Before reading, look at the title and pictures. What do you already know? What do you hope to learn?
- `audio/page-narration/gr-e-50-page-03.mp3`: While reading, pause to think. Does this make sense? Highlight important facts.
- `audio/page-narration/gr-e-50-page-04.mp3`: After reading, summarize what you learned. Say it in your own words.
- `audio/page-narration/gr-e-50-page-05.mp3`: Good readers check sources. Is the author an expert? Is the information current?
- `audio/page-narration/gr-e-50-page-06.mp3`: Reading is not just looking at words. It is thinking, wondering, and growing your mind.

QA checklist for this book:

- Six pages only.
- No image contains embedded text.
- Narration matches each page text exactly.
- Image content matches page text exactly.
- Character names and visual identities remain consistent.
- Sentences have correct capitalization and punctuation.

## Final Validation Required From Kimi

- No missing cover/page/narration filenames referenced in manifest.
- No duplicate book IDs or page filenames.
- No embedded text in any image.
- No copyrighted text, characters, styles, or brands.
- Narration text exactly matches manifest page text.
- Every book has 6 coherent pages and a clear beginning/middle/end or factual sequence.