# Kimi Language Skill Unique Scene Variant Request

Generated: 2026-06-04

## Status

This is a planning request, not a final production count request.

The following assessment contracts still need formal 2-level x 2-phase maps before exact counts can be locked:

- Nouns
- Verbs
- Adjectives
- Prepositions
- Plurals
- Antonyms / Synonyms

Do not treat this request as permission to pad the app with random images. These media assets should only be wired once the formal phase maps and target lists are approved.

## Required Standard

For grammar/language-category assessment questions, a repeated image with shuffled answer choices does not count as a new question.

Each usable question needs:

- A distinct prompt/context
- A distinct image or visual scene where the question uses an image
- One clearly correct answer
- Three clearly incorrect distractors
- No duplicate target/template/content pairs within the same game progression path
- Enough fresh questions that a retry after 3 wrong answers does not repeat correctly answered questions

## Image Style

- Warm cartoon-realistic child-friendly scene style
- No text, labels, captions, signs, speech bubbles, or visible letters
- One clear concept per image
- Different composition/action/setting for each variant
- No logos, brands, celebrity likenesses, or recognizable copyrighted characters

## Skill-Specific Guidance

### Nouns

Create concrete, imageable noun scenes. Avoid abstract labels and avoid text in the image.

Good targets include: dog, cat, book, cup, bed, map, rug, box, ball, hat, bag, tree, car, bus, fish, bird.

### Verbs

Show the action clearly. The image should make the verb answer obvious without needing written text.

Good targets include: run, jump, swim, read, write, sit, stand, eat, drink, sleep, help, play, look, make, give.

### Adjectives

Show contrast or a clear property. Avoid ambiguous adjectives unless the scene makes the property unmistakable.

Good targets include: big, little, hot, cold, wet, dry, fast, slow, happy, sad, clean, dirty, full, empty, old, new.

### Prepositions

Use simple spatial scenes with the same object shown in different positions. Each image must make the relation clear.

Good targets include: in, on, under, over, beside, behind, in front of, between, around, through.

### Plurals

Use clean one-vs-many visual contrast. Avoid cluttered scenes where counting is unclear.

Good targets include: cat/cats, dog/dogs, box/boxes, dish/dishes, bus/buses, baby/babies, leaf/leaves.

### Antonyms / Synonyms

Use matched scene pairs for antonyms and clearly equivalent action/property scenes for synonyms.

Good antonym pairs include: hot/cold, up/down, open/closed, wet/dry, happy/sad, fast/slow, big/little.

## Naming Pattern

Use this path pattern after formal phase maps are approved:

`public/images/assessment/language/variants/{skill}/{target}-{phase}-{variant}.webp`

Examples:

- `public/images/assessment/language/variants/verbs/jump-l1p1-01.webp`
- `public/images/assessment/language/variants/adjectives/cold-l2p1-03.webp`
- `public/images/assessment/language/variants/prepositions/under-l1p2-02.webp`

## Acceptance Rules

Reject returned assets if:

- The same image/composition is reused for multiple questions
- The image contains text or answer clues
- The answer could reasonably be more than one option
- The target is too obscure for early literacy assessment
- The asset is a generic icon when a sentence/context scene is required
- The image only supports answer shuffling rather than a genuinely new question

## Related Validator

Once formal phase maps are added, this standard should be enforced by:

`npm run check:assessment-skill-contracts`
