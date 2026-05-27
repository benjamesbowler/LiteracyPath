# Kimi Vocabulary 500 Import Audit

- Source folder: `/Users/benjaminbowler/Desktop/Literacy Path Past Assets/Kimi New Vocabulary 500 Media Pairs`
- Existing lexicon: `src/content/lexicon/masterWordLexicon.js` builds a runtime lexicon from question banks.
- Added reserve lexicon: `src/data/kimiVocabulary500Lexicon.js` stores imported Kimi vocabulary media with safe metadata.
- Audio source of truth: `src/data/audioPreferenceManifest.js`, extended through `src/data/kimiVocabulary500AudioPreferences.js`.
- Media resolution: app paths resolve from `/public`, with imported vocabulary media under `/media/vocabulary/images/` and `/media/vocabulary/audio/`.

## Counts

| Metric | Count |
| --- | --- |
| Manifest words | 500 |
| Expected clean-list words matched | 500 |
| Image files found | 500 |
| Audio files found | 500 |
| Imported app-ready pairs | 500 |
| Imported approved Level 1 / stretch | 83 |
| Imported reserve Level 2+ | 417 |
| Needs review | 0 |
| Rejected/missing/duplicate | 0 |
| Duplicate existing approved | 0 |
| Missing image | 0 |
| Missing audio | 0 |

## Difficulty Distribution

| Band | Count |
| --- | --- |
| level_1 | 43 |
| level_1_stretch | 40 |
| level_2 | 370 |
| level_3 | 47 |

## Skill Metadata Distribution

| Skill | Eligible imported words |
| --- | --- |
| blends | 150 |
| cvcShortVowels | 44 |
| digraphs | 63 |
| finalSounds | 191 |
| initialSounds | 500 |
| longVowelsSilentE | 52 |
| rControlledVowels | 115 |
| rhyming | 500 |
| vocabulary | 500 |
| vowelTeams | 127 |

## Problem Examples

_No missing, duplicate, rejected, or review-only records._

## Manual QA Checklist

- 20 Level 1 / stretch words: arm, bar, barn, bead, bean, beet, bib, board, boot, bow, bowl, bulb, cab, can, card, cart, coal, cob, coin, cold
- 20 reserve words: above, airplane, alligator, almond, anteater, applesauce, arch, armchair, around, artichoke, ash, asparagus, back, badge, badger, bagel, balcony, bamboo, bandage, bark
- Final /b/ focus words: bib, blob, bulb, cab, club, cob, crib, cub, cube, curb, dab, grab, knob, lab, orb, robe, rub, sub, tube
- Needs-review words: none
- Spot-check each listed word for exact object/action match, no text/watermarks, natural colors, and audio saying the target word only.

## Safety Notes

- No live question-bank selection logic was changed.
- Imported reserve media is available to future validated generators but is not automatically active in Level 1.
- Harder phonics patterns, multisyllable items, abstract/spatial words, silent-e, vowel-team, r-controlled, blend, and digraph words are level-gated as reserve.