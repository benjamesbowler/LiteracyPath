# Kimi HFW Unique Scene Variant Request

Generated: 2026-06-04

## Why This Request Exists

The app currently has 100 HFW image assets for 100 HFW words, one image per word.

That is no longer enough for the assessment standard. A word cannot be counted as a new question if the app only reuses the same sentence/image and moves the answer choices around.

The contract validator now fails HFW unless each question has a genuinely distinct sentence/context and, where the question uses a visual scene, a genuinely distinct image.

## Required Standard

For each HFW band:

- 4 formal assessment phases: Level 1 Phase 1, Level 1 Phase 2, Level 2 Phase 1, Level 2 Phase 2
- 15 questions per round
- Retry-safe depth: if a learner misses 3 questions and retries the phase, the next 15-question round must not repeat correctly answered questions
- Minimum unique slots per phase without buffer: 27
- Required unique question-image slots per HFW band with 125% buffer: 136
- Existing usable unique HFW images per band: 25
- Additional unique HFW scene images needed per band with 125% buffer: 111

Across all four HFW bands:

- Required unique HFW question-image slots with 125% buffer: 544
- Existing usable unique HFW images: 100
- Additional unique HFW scene images needed with 125% buffer: 444

## Output Location And Naming

Please create WEBP images with no printed text, letters, captions, labels, signs, or speech bubbles.

Use this path pattern:

`public/images/assessment/hfw/variants/{band}/{word}-{phase}-{variant}.webp`

Examples:

- `public/images/assessment/hfw/variants/hfw-1-25/go-l1p1-01.webp`
- `public/images/assessment/hfw/variants/hfw-1-25/go-l1p2-01.webp`
- `public/images/assessment/hfw/variants/hfw-1-25/go-l2p1-01.webp`
- `public/images/assessment/hfw/variants/hfw-1-25/go-l2p2-01.webp`

## Image Style

- Warm cartoon-realistic classroom/child-friendly style
- Clear single idea per image
- No text in the image
- No logos, trademarks, branded clothing, or UI elements
- No surreal/unclear AI artifacts
- Show the sentence meaning through action/context, not by writing the word
- Each variant must be visually different: different composition, setting, action, pose, or object arrangement

## Sentence Rules

Each HFW slot needs a unique cloze sentence. The target word should be the only correct answer.

Good examples:

- Target `go`: `We ___ home.`
- Target `go`: `Can we ___ now?`
- Target `go`: `I will ___ with you.`
- Target `go`: `They ___ to school.`
- Target `you`: `Can ___ swim?`
- Target `you`: `I like ___.`
- Target `you`: `Do ___ like pizza?`
- Target `you`: `___ are tall.`

Avoid ambiguous article clozes where more than one answer can be true, for example:

- Bad: `I see ___ dog.` with both `a` and `the` in the answer choices

## Counts Needed By Band With 125% Buffer

| Band | Words | Required unique slots with buffer | Existing unique images | New images needed |
| --- | ---: | ---: | ---: | ---: |
| hfw-1-25 | 25 | 136 | 25 | 111 |
| hfw-26-50 | 25 | 136 | 25 | 111 |
| hfw-51-75 | 25 | 136 | 25 | 111 |
| hfw-76-100 | 25 | 136 | 25 | 111 |
| Total | 100 | 544 | 100 | 444 |

## HFW Word Bands

### hfw-1-25

the, to, and, a, i, you, it, in, said, for, up, look, is, go, we, little, can, see, me, my, on, one, big, come, like

### hfw-26-50

down, not, play, all, are, as, be, but, came, from, have, he, she, they, was, with, that, then, this, what, when, where, will, help, make

### hfw-51-75

after, again, an, any, around, ask, away, before, by, could, every, find, fly, found, funny, give, going, had, has, her, here, him, his, how, into

### hfw-76-100

just, know, let, live, made, may, must, new, now, of, old, once, open, our, out, over, please, pretty, put, read, round, some, take, thank, yes

## Acceptance Rules

A returned asset should be rejected if:

- It reuses the same composition as another HFW slot
- It contains visible text or letters
- The sentence could reasonably take two answer choices
- The image does not clearly support the sentence context
- The image is only a word icon rather than a sentence scene
- It relies on answer shuffling to seem new

## Related Validator

Run this after importing the media and wiring new question slots:

`npm run check:assessment-skill-contracts`

The HFW contracts should not pass until the duplicate sentence/image/content failures are gone and every phase can build a fresh retry round without repeating correctly answered questions.
