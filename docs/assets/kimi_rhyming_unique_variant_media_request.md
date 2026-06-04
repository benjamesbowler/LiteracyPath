# Kimi Rhyming Unique Variant Media Request

Generated: 2026-06-04

## Why This Request Exists

Rhyming has enough total selectable rows to build 15-question rounds, but many target words rely on one prompt image. The new standard should let genuinely different answer sets count as new rhyming questions, but we still need enough visual variation so repeated targets like `pig` do not feel like the same card over and over.

Example accepted pattern:

- Target `pig`: answer set 1 includes `big` as the correct rhyme, with distractors such as `bug`, `top`, `leg`.
- Target `pig`: answer set 2 includes `wig` as the correct rhyme, with different distractors such as `jet`, `dog`, `peg`.
- Target `pig`: answer set 3 includes `fig` as the correct rhyme, with different distractors such as `hot`, `cat`, `tag`.

Shuffling the same four choices is not a new question.

## Buffered Media Target

This request uses a 125% buffer over the four-real-variants-per-family-target standard.

| Metric | Count |
| --- | ---: |
| Active rhyming family/target pairs | 143 |
| Minimum variants per family/target pair | 4 |
| Required unique target-question slots before buffer | 572 |
| Required unique target-question slots with 125% buffer | 715 |
| Current unique target prompt images | 143 |
| Additional unique target-scene images needed | 572 |

## Image Requirements

- WEBP format
- No printed text, letters, captions, signs, labels, or speech bubbles
- Child-friendly cartoon-realistic style
- One clear target object/action per prompt image
- Each variant should feel visually different: changed pose, angle, setting, prop arrangement, or action
- Do not create fake/non-word rhyme items
- Do not use obscure targets unless already present in the app bank

## Suggested Naming Pattern

`public/images/assessment/rhyming/variants/{family}/{target}-{variant}.webp`

Examples:

- `public/images/assessment/rhyming/variants/ig/pig-01.webp`
- `public/images/assessment/rhyming/variants/ig/pig-02.webp`
- `public/images/assessment/rhyming/variants/ig/pig-03.webp`
- `public/images/assessment/rhyming/variants/ig/pig-04.webp`

## Current Rhyming Family Counts

| Family | Targets | Rows | Content Variants | Prompt Images | Answer Sets |
| --- | ---: | ---: | ---: | ---: | ---: |
| ack | 2 | 8 | 8 | 2 | 8 |
| ad | 5 | 24 | 24 | 5 | 11 |
| ag | 4 | 16 | 16 | 4 | 11 |
| ake | 2 | 2 | 2 | 2 | 2 |
| all | 4 | 22 | 22 | 4 | 17 |
| am | 4 | 16 | 16 | 4 | 11 |
| ame | 3 | 9 | 9 | 3 | 9 |
| an | 5 | 24 | 24 | 5 | 11 |
| ang | 3 | 9 | 9 | 3 | 9 |
| ap | 5 | 24 | 24 | 5 | 11 |
| ar | 2 | 2 | 2 | 2 | 2 |
| ash | 2 | 2 | 2 | 2 | 2 |
| at | 5 | 24 | 24 | 5 | 11 |
| ed | 3 | 9 | 9 | 3 | 7 |
| eep | 2 | 8 | 8 | 2 | 8 |
| eg | 3 | 9 | 9 | 3 | 7 |
| ell | 4 | 16 | 16 | 4 | 13 |
| en | 4 | 16 | 16 | 4 | 13 |
| et | 4 | 16 | 16 | 4 | 13 |
| ick | 2 | 8 | 8 | 2 | 8 |
| ide | 3 | 9 | 9 | 3 | 6 |
| ig | 5 | 24 | 24 | 5 | 15 |
| ight | 3 | 9 | 9 | 3 | 6 |
| ill | 2 | 2 | 2 | 2 | 2 |
| in | 4 | 16 | 16 | 4 | 11 |
| ing | 4 | 22 | 22 | 4 | 18 |
| ink | 2 | 2 | 2 | 2 | 2 |
| ip | 4 | 16 | 16 | 4 | 11 |
| ird | 2 | 2 | 2 | 2 | 2 |
| ish | 2 | 2 | 2 | 2 | 2 |
| it | 3 | 9 | 9 | 3 | 6 |
| oat | 3 | 9 | 9 | 3 | 6 |
| ock | 3 | 9 | 9 | 3 | 6 |
| og | 3 | 9 | 9 | 3 | 6 |
| ong | 3 | 9 | 9 | 3 | 6 |
| op | 4 | 16 | 16 | 4 | 9 |
| or | 2 | 2 | 2 | 2 | 2 |
| ot | 4 | 16 | 16 | 4 | 9 |
| ouse | 2 | 2 | 2 | 2 | 2 |
| uck | 2 | 2 | 2 | 2 | 2 |
| ug | 4 | 16 | 16 | 4 | 8 |
| un | 4 | 16 | 16 | 4 | 8 |
| up | 3 | 9 | 9 | 3 | 6 |
| urn | 2 | 2 | 2 | 2 | 2 |
| ut | 2 | 2 | 2 | 2 | 2 |

## Current Rhyming Target Detail

- ack/back: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ack/sack: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ad/bad: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ad/dad: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ad/mad: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ad/pad: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ad/sad: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ag/bag: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ag/rag: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ag/tag: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ag/wag: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ake/cake: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ake/snake: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- all/ball: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- all/fall: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- all/tall: 7 rows, 7 content variants, 1 prompt image(s), 7 answer set(s)
- all/wall: 7 rows, 7 content variants, 1 prompt image(s), 7 answer set(s)
- am/dam: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- am/ham: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- am/jam: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- am/ram: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ame/flame: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ame/game: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ame/name: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- an/can: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- an/fan: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- an/man: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- an/pan: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- an/van: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ang/bang: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ang/hang: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ang/rang: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ap/cap: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ap/gap: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ap/map: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ap/nap: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ap/tap: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ar/car: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ar/star: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ash/cash: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ash/trash: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- at/bat: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- at/cat: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- at/hat: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- at/mat: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- at/rat: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ed/bed: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ed/fed: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ed/red: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- eep/sheep: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- eep/sleep: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- eg/egg: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- eg/leg: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- eg/peg: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ell/bell: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ell/fell: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ell/shell: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ell/well: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- en/hen: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- en/men: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- en/pen: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- en/ten: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- et/jet: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- et/net: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- et/pet: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- et/wet: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ick/brick: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ick/kick: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ide/hide: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ide/ride: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ide/slide: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ig/big: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ig/dig: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ig/fig: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ig/pig: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ig/wig: 5 rows, 5 content variants, 1 prompt image(s), 5 answer set(s)
- ight/light: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ight/night: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ight/sight: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ill/pill: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ill/will: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- in/bin: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- in/fin: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- in/pin: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- in/win: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ing/king: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ing/ring: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ing/swing: 7 rows, 7 content variants, 1 prompt image(s), 7 answer set(s)
- ing/wing: 7 rows, 7 content variants, 1 prompt image(s), 7 answer set(s)
- ink/pink: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ink/sink: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ip/dip: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ip/lip: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ip/sip: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ip/zip: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ird/bird: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ird/third: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ish/dish: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ish/fish: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- it/hit: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- it/pit: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- it/sit: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- oat/boat: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- oat/coat: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- oat/goat: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ock/clock: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ock/rock: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ock/sock: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- og/dog: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- og/fog: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- og/log: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ong/gong: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ong/long: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- ong/song: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- op/hop: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- op/mop: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- op/pop: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- op/top: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- or/corn: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- or/horn: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ot/cot: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ot/dot: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ot/hot: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ot/pot: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ouse/house: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ouse/mouse: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- uck/duck: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- uck/truck: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ug/bug: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ug/jug: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ug/mug: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- ug/rug: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- un/bun: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- un/fun: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- un/run: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- un/sun: 4 rows, 4 content variants, 1 prompt image(s), 4 answer set(s)
- up/cup: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- up/pup: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- up/up: 3 rows, 3 content variants, 1 prompt image(s), 3 answer set(s)
- urn/burn: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- urn/turn: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ut/cut: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)
- ut/hut: 1 rows, 1 content variants, 1 prompt image(s), 1 answer set(s)

## Acceptance Rules

Reject returned assets if:

- The image is a near-duplicate of another variant for the same target
- The image contains written text or answer clues
- The target word is visually unclear
- The asset introduces a non-word or fake rhyme
- The visual is too abstract for early readers

## Related Audit

Run after importing and wiring media:

`node tools/auditAssessmentVariantDepth.js`
`npm run check:assessment-skill-contracts`
