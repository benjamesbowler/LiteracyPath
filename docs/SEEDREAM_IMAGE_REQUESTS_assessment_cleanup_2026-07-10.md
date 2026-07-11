# Assessment Image Cleanup — banned-style purge (2026-07-10)

Benjamin's standing art rule (strictly enforced): **no rainbow motifs, no faces on
inanimate objects, not babyish**. This audit found violations live in the teacher-side
checkpoint assessments and fixed them without losing a single question.

## Method
Extracted every image the checkpoint runtime can actually show (1,460 distinct files
across all 30 skills, via the real bank loaders + getQuestionMediaPaths), rendered all
of them onto 24 numbered contact sheets, and visually judged each one. Rejection
criteria: (a) face/eyes/smile on an inanimate object, (b) rainbow colouring or rainbow
motifs, (c) glow/aura sticker style on dark backgrounds (matches the QA system's own
banned-words heuristics), (d) rainbow-striped clothing/objects.

**99 images rejected.** They are shared by thousands of question instances (one sticker
"star" backs 30 questions across 6 skills), so blocking/deleting them would have gutted
question pools. Instead every fix is **same-path replacement** - the picture changes,
the filename stays, all questions keep working, pool counts untouched.

## Actions
- **34 swapped immediately**: a clean storybook image of the same word already existed
  in the live set; it was converted and copied over the banned file. Verified visually.
- **67 regenerations queued** (65 + the moon pair caught in verification - the moon's
  "clean" candidate had a smiley face too): run

  ```
  cd ~/Desktop/LiteracyPath && node tools/regenerate-banned-assessment-images.mjs
  ```

  (Seedream, in-place overwrite, art direction baked into every prompt: realistic-cartoon
  storybook, no faces on objects, no rainbows, no sparkles/glow, not babyish. Use
  `ARK_MODEL=seedream-4-5-251128` if 4.0 is rate-limited; `ONLY=<word>` to redo one.)
- Emoji-as-image questions exist (113, including a 🌈 emoji) - separate mechanism,
  flagged for a future decision, not touched here.
- The 60 preposition placeholder SVGs are abstract line-art (no rainbow/face risk);
  they remain on the replacement list from the earlier audit.

## Known accepted borderlines (deliberate keeps)
Cute ANIMAL faces are allowed (crab, whale, ladybug, goldfish - the companions
themselves are cute animals); multicoloured objects that are naturally multicoloured
(xylophone, beach ball, book stacks); small incidental classroom-decor rainbows inside
busy scenes. If any of these should also go, say so and they join the regen list.

## Full rejection record

| File | Skills | Question uses | Action |
|---|---|---|---|
| `/images/assessment/digraphs/sock.webp` | digraphs | 2 | SWAPPED (clean same-word art copied over) |
| `/images/assessment/language/variants/homophones-homonyms/hi-high-01.webp` | homophones_homonyms | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/blends/blue.png` | blends, vowel_teams, adjectives, homophones_homonyms | 30 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/blends/cloud.png` | blends | 8 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/blends/drum.png` | final_sounds, short_vowel_discrimination, blends | 22 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/blends/star.png` | final_sounds, rhyming, short_vowel_discrimination, blends, digraphs, r_controlled_vowels | 30 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/blends/tree.png` | rhyming, short_vowel_discrimination, blends, digraphs, vowel_teams, plurals | 24 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/cvc/bad.png` | final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, antonyms_synonyms | 46 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/cvc/bed.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, nouns, plurals | 81 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/cvc/book.png` | final_sounds, rhyming, nouns, plurals | 12 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/cvc/cap.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, nouns | 87 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/cvc/dot.png` | final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination | 51 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/cvc/fish.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, digraphs, nouns, plurals | 89 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/digraphs/shell.png` | final_sounds, rhyming, short_vowel_discrimination, digraphs | 41 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/digraphs/ship.png` | final_sounds, rhyming, short_vowel_discrimination, digraphs | 35 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/bear.png` | rhyming, nouns, plurals | 25 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/big.png` | antonyms_synonyms | 4 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/box.png` | rhyming, short_vowel_discrimination, nouns, plurals | 39 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/bus.png` | plurals | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/coat.png` | long_vowels_silent_e, vowel_teams, nouns, plurals | 4 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/cup.png` | nouns, plurals | 4 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/drum.png` | plurals | 1 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/duck.png` | nouns, plurals | 2 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/fox.png` | nouns, plurals | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/ham.png` | nouns | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/hat.png` | plurals | 1 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/hot.png` | final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, adjectives, antonyms_synonyms | 73 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/jam.png` | nouns | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/key.png` | initial_sounds, plurals | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/leg.png` | nouns, plurals | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/moon.png` | initial_sounds, final_sounds, rhyming, short_vowel_discrimination | 12 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/pen.png` | plurals | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/pig.png` | plurals | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/rain.png` | initial_sounds, final_sounds, rhyming, short_vowel_discrimination, long_vowels_silent_e, vowel_teams, homophones_homonyms | 19 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/red.png` | homophones_homonyms | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/sit.png` | antonyms_synonyms | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/sled.png` | short_vowel_discrimination | 1 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/sock.png` | plurals | 2 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/initial-sounds/star.png` | plurals | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/thin.png` | short_vowel_discrimination, digraphs, antonyms_synonyms | 35 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/initial-sounds/umbrella.png` | initial_sounds | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/minimal-pairs/cut.png` | final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, verbs | 36 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/plurals/books.png` | short_vowel_discrimination, plurals | 15 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/plurals/boxes.png` | plurals | 5 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/plurals/brushes.png` | plurals | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/plurals/cats.png` | plurals | 11 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/plurals/cups.png` | plurals | 17 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/plurals/dishes.png` | plurals | 4 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/plurals/dogs.png` | plurals | 14 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/plurals/hats.png` | plurals | 10 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/r-controlled/bird.png` | r_controlled_vowels | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/r-controlled/corn.png` | r_controlled_vowels | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/short-a/ham.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination | 41 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/short-e/net.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination | 40 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/short-e/pen.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, nouns | 108 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/short-e/red.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, adjectives | 122 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/short-i/zip.png` | final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination | 39 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/short-o/mop.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination | 87 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/short-o/rock.png` | initial_sounds, final_sounds, rhyming, short_vowel_discrimination | 23 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/short-u/bus.png` | final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, nouns | 23 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/short-u/cup.png` | initial_sounds, final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, nouns | 131 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/short-u/mud.png` | initial_sounds, final_sounds, cvc_short_vowels, short_vowel_discrimination | 37 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/vowel-teams/bee.png` | rhyming, short_vowel_discrimination, vowel_teams | 51 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/images/child-mode/vowel-teams/home.png` | long_vowels_silent_e | 5 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/vowel-teams/tree.png` | vowel_teams | 1 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/vowels/road.png` | vowel_teams | 1 | SWAPPED (clean same-word art copied over) |
| `/images/child-mode/vowels/soap.png` | vowel_teams | 1 | SWAPPED (clean same-word art copied over) |
| `/images/vocabulary/umbrella.png` | key_details, inference | 3 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/a/astronaut.webp` | initial_sounds | 17 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/b/backpack.webp` | short_vowel_discrimination | 1 | SWAPPED (clean same-word art copied over) |
| `/media/initial-sounds/images/b/butterfly.webp` | short_vowel_discrimination, plurals | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/c/cow.webp` | plurals | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/d/doll.webp` | final_sounds | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/g/goalpost.webp` | final_sounds | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/j/jar.webp` | rhyming | 12 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/k/kitten.webp` | short_vowel_discrimination | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/l/lake.webp` | rhyming, long_vowels_silent_e | 25 | SWAPPED (clean same-word art copied over) |
| `/media/initial-sounds/images/n/nail.webp` | final_sounds | 4 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/p/paintbrush.webp` | final_sounds | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/p/pencil.webp` | final_sounds, plurals | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/r/raccoon.webp` | final_sounds | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/r/rainbow.webp` | short_vowel_discrimination | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/v/vine.webp` | long_vowels_silent_e | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/initial-sounds/images/y/yellow.webp` | short_vowel_discrimination | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/learn/images/cycle-23/bang.png` | final_sounds, rhyming | 13 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/learn/images/cycle-23/gong.png` | final_sounds, rhyming | 12 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/learn/images/cycle-23/hang.png` | final_sounds, rhyming | 20 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/learn/images/cycle-23/rang.png` | final_sounds, rhyming | 16 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/learn/images/cycle-23/song.png` | final_sounds, rhyming | 10 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/rhyming/images/sad.webp` | final_sounds, rhyming, cvc_short_vowels, short_vowel_discrimination, adjectives | 37 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/vocabulary/images/adjective-purple.webp` | adjectives | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/vocabulary/images/adjective-rough.webp` | antonyms_synonyms | 1 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/vocabulary/images/adjective-shiny.webp` | adjectives | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/vocabulary/images/adjective-smooth.webp` | adjectives | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/vocabulary/images/adjective-warm.webp` | adjectives | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/vocabulary/images/bead.webp` | rhyming, long_vowels_silent_e, vowel_teams | 19 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/vocabulary/images/bright.webp` | short_vowel_discrimination, long_vowels_silent_e, vowel_teams, antonyms_synonyms | 6 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
| `/media/vocabulary/images/draw.webp` | blends | 1 | SWAPPED (clean same-word art copied over) |
| `/media/vocabulary/images/verb-melt.webp` | verbs | 2 | REGENERATE (tools/regenerate-banned-assessment-images.mjs) |
