# Guided Reading Level A Visual Audit

Date: 2026-08-03 to 2026-08-04  
Scope: every active Level A cover and story-page illustration  
Status: complete; all approved replacements are installed and hash-locked

## Standard

Every asset was reviewed against all of the following questions:

1. Does the picture show the people, animals, objects, action, place, time and emotion stated or necessarily implied by the page text?
2. Do recurring characters keep the same species, age, body shape, face, colors, clothing and signature features across pages and books?
3. Are anatomy and object construction coherent, with no extra or fused limbs, hand-like hooves, malformed faces, impossible grips, duplicated props or broken geometry?
4. Does the page preserve story state from the previous page, including object counts, damage, weather, location, time of day and who knows what?
5. Is the cast exact, with no unexplained adult, helper, duplicate character or missing participant?
6. Is the action physically readable and safe for a child-facing book?
7. Is the composition clear at reading size, without accidental cropping, collage panels, fake lettering, watermarks or title text baked into the art?
8. Does the cover truthfully represent the book's main characters, problem or subject?
9. Does the final image show the resolution promised by the final text?

`WARN` was not treated as acceptable. Every warning entered the replacement queue with every failure.

## Initial exhaustive audit

| Collection | Assets checked | Pass | Warn | Fail |
|---|---:|---:|---:|---:|
| First Facts and Bob and Nan | 245 | 217 | 7 | 21 |
| Meadow Pals 1-18 | 181 | 108 | 9 | 64 |
| Meadow Pals 19-35 story pages | 145 | 102 | 6 | 37 |
| Meadow Pals 19-35 covers | 17 | 9 | 3 | 5 |
| **Total** | **588** | **436** | **25** | **127** |

The initial audit therefore sent 152 assets to replacement. A second full-output sequence and cross-book pass expanded the final repair scope to 192 assets. The extra 40 were not cosmetic additions: they were pages that only failed when read beside the page before and after, counted across a whole sequence, or compared against the canonical recurring character.

The second pass caught, among other things:

- additional Grumpy changes that were visible only in the 63-appearance cross-book sheet;
- Sleepy's missing red forelock bow inside dream scenes;
- a missing active resolution in *Grumpy's Secret*;
- wrong or incomplete party cast, discovery and reunion beats in *The Big Farm Party*;
- six-block continuity in *Muddy's Cool Wall* and three-reed construction continuity in *Splashy's Reed Boat*;
- an unsafe bank-edge pose in *Shy's Pond Rings*;
- story-state errors in *Tiny's Giant Berry* and *Grumpy's Sun Clock*;
- the eight-flower, broken-wheel and repaired-wheel sequence in *Giggly's Round Wheel*.

The final installed replacement count is:

| Collection | Replacements |
|---|---:|
| First Facts Level A | 6 |
| Bob and Nan | 22 |
| Meadow Pals | 164 |
| **Total** | **192** |

## Non-negotiable continuity anchors

- Bob and Nan retain their canonical faces, hair, age, proportions and clothing within each outing. Their mother and Fluff may appear only when the story calls for them.
- Grumpy is one short, stocky, dark-brown goat with a small beard and slim tan horns angled backward. He does not become a different goat, stand like a person or acquire human hands.
- Bouncy has exactly two spring legs and two orange shoes.
- Woolly remains a sheep and does not gain humanlike arms or hands.
- Tiny remains a small gray mouse. Shy is also a mouse, not a rabbit.
- Counted story objects remain countable and stable: hay bales, stones, yarn loops, flowers, party guests and zoo-card checks must match their text and sequence.

## Replacement QA and installation

Each accepted replacement must pass:

- visual inspection at full size and in a labeled contact sheet;
- within-book sequence inspection, including the page before and after a replacement;
- cross-book character inspection for recurring characters;
- exact 1365 x 768 dimensions, WebP format and sRGB color space;
- a unique, resolvable production target with no duplicate mapping;
- a recorded staged SHA-256 and pre-install production SHA-256;
- the complete Guided Reading image, experience, title-page and visibility checks after installation.

The frozen pre-install manifest passed with all 192 expected assets present and no extras, duplicate targets, duplicate hashes, corrupt files, wrong dimensions/colorspace, unresolved targets, symlinks or pre-existing production-file changes. Every replacement is a 1365 x 768 sRGB WebP.

The 192 assets were then installed through a guarded operation that rechecked every staged and production SHA-256 before copying, backed up every prior production file, and verified every installed hash afterward. The changed production set matches the receipt exactly: 192 expected files, no missing files and no unexpected files.

Evidence retained locally:

- `.artifacts/guided-reading/replacements/qa/level-a-replacement-manifest.json`
- `.artifacts/guided-reading/replacements/qa/level-a-replacement-qa.md`
- `.artifacts/guided-reading/replacements/qa/level-a-install-receipt.json`
- `.artifacts/guided-reading/replacements/qa/full-books/inventory.json`
- `.artifacts/guided-reading/replacements/qa/contact-sheets/index.json`
- `.artifacts/guided-reading/replacements/qa/contact-sheets/active-grumpy-continuity-index.json`

The final contact-sheet inventory contains all 65 Level A books, all 523 active story pages and all 65 covers: 588 active visual assets in total. Inactive legacy pages were observed but excluded from production replacement decisions.

## Post-install verification

- Human-voice and U.S.-spelling gate: 0 Level A findings.
- Writing-evidence database: 124 examples; 0 validation failures.
- Image/text alignment: 0 failures.
- Reading experience, title-page and visibility checks: 0 failures.
- Story Bible Level A gate: 65 books, 523 pages, 523 exact Leda pages, 0 failures.
- Visual alignment Level A gate: 523 approved pages, 0 open replacements, 0 failures.
- Leda audio inventory: 65 books, 523 active pages, 523 exact resolutions, 0 missing clips, rebuilds, text mismatches, unresolved collisions, broken overrides or missing files.
