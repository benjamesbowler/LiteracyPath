# Core Phonics Runtime Depth Audit

Date: 2026-05-25

## Root Cause Of Initial Sounds Stopping Early

Initial Sounds was building a 15-question plan first and then filtering QA-blocked images afterward in the app. If previously rejected image statuses remained for the first selected core words, the visible queue could collapse to a small number of questions. The repair moves the image/media QA predicate into the Initial Sounds selector so it chooses replacement words before the round queue is finalized. The selector also treats missing audio as non-blocking for image-backed Initial Sounds items.

## Skill Summary

| Skill | Image Files/Refs | Audio Files/Refs | Matched Image+Audio Words | Image-Only Words | Audio-Only Words | Active Items | Runtime-Selectable Items | Blocked/Filtered | Duplicate Words | Missing Media References |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial Sounds | 500 | 500 | 500 | 0 | 0 | 473 | 473 | 27 | 0 | 0 |
| Ending Sounds | 101 | 102 | 56 | 1 | 1 | 195 | 195 | 1 | 16 | 0 |
| CVC Short Vowels | 57 | 47 | 44 | 0 | 0 | 256 | 256 | 4 | 40 | 0 |
| Rhyming Words | 58 | 72 | 30 | 0 | 0 | 133 | 133 | 2 | 1 | 0 |

## Initial Sounds Progression Samples

- Level 1 Round 1: a:ant, b:bat, c:cat, d:dog, e:egg, f:fan, g:gum, h:hat, i:ink, j:jam, k:king, l:leg, m:map, n:nest, o:ox
- Level 1 Round 2: p:pig, q:queen, r:ring, s:sun, t:tent, u:up, v:van, w:wig, y:yak, z:zoo, a:apple, b:ball, c:cup, d:duck, e:elf

## Sample 15-Question Rounds

### Initial Sounds

1. a / ant
2. b / bat
3. c / cat
4. d / dog
5. e / egg
6. f / fan
7. g / gum
8. h / hat
9. i / ink
10. j / jam
11. k / king
12. l / leg
13. m / map
14. n / nest
15. o / ox

### Ending Sounds

1. hat / hat
2. map / map
3. sun / sun
4. dog / dog
5. jam / jam
6. bed / bed
7. duck / duck
8. bell / bell
9. bus / bus
10. leaf / leaf
11. d / listen and find
12. t / cat
13. n / pan
14. n / pin
15. t / bat

### CVC Short Vowels

1. - / cat
2. - / map
3. - / red
4. - / sit
5. - / dog
6. - / cup
7. - / mat
8. - / pen
9. - / pin
10. - / hop
11. - / rug
12. bag / bag
13. bat / bat
14. bed / bed
15. cap / cap

### Rhyming Words

1. at / hat
2. ug / rug
3. un / run
4. ed / red
5. op / hop
6. ake / lake
7. ish / dish
8. ing / ring
9. oat / coat
10. ar / car
11. oon / spoon
12. ight / night
13. ee / tree
14. air / bear
15. at / listen and find

## Remaining Gaps Needing Kimi

- Initial Sounds: opera (o) - Opera is culturally specific and too hard to image clearly for early Initial Sounds assessment.
- Initial Sounds: observer (o) - Observer is abstract/role-based and hard to image clearly for early Initial Sounds assessment.
- Initial Sounds: quilted blanket (q) - Quilted blanket is an adjective phrase; use quilt or blanket in a more appropriate skill.
- Initial Sounds: quail nest (q) - Quail nest adds a second object/scene; use quail as the target if needed.
- Initial Sounds: quiet room (q) - Quiet room is an abstract setting phrase, not a single concrete Initial Sounds object.
- Initial Sounds: quartz (q) - Quartz is obscure for K-2 Initial Sounds assessment and should not be active without explicit vocabulary teaching.
- Initial Sounds: quiver (q) - Quiver is potentially ambiguous and not a strong K-2 Initial Sounds assessment target.
- Initial Sounds: quickstep (q) - Quickstep is obscure/culturally specific and not a strong K-2 Initial Sounds assessment target.
- Initial Sounds: upbeat (u) - Upbeat is abstract and hard to image clearly for early Initial Sounds assessment.
- Initial Sounds: uplift (u) - Uplift is abstract and hard to image clearly for early Initial Sounds assessment.
- Initial Sounds: umpire mask (u) - Umpire mask is a niche object phrase and not a strong early Initial Sounds target.
- Initial Sounds: urban garden (u) - Urban garden is a phrase with a less clear single target object for early Initial Sounds assessment.
- Initial Sounds: vegetable soup (v) - Vegetable soup is a phrase/meal scene; use vegetable or another single V object.
- Initial Sounds: velvet (v) - Velvet is texture-based and hard to image unambiguously for early Initial Sounds assessment.
- Initial Sounds: yellow jacket (y) - Yellow jacket is ambiguous between clothing and insect and is not a clean Initial Sounds target.
- Initial Sounds: yo-yo string (y) - Yo-yo string is an object-part phrase; use yo-yo/yoyo as the target instead.
- Initial Sounds: yodeler (y) - Yodeler is culturally specific and not a strong K-2 Initial Sounds assessment target.
- Initial Sounds: yucca plant (y) - Yucca plant is less familiar and not a strong early Initial Sounds target.
- Initial Sounds: zone (z) - Zone is abstract and hard to image clearly for early Initial Sounds assessment.
- Initial Sounds: zinnia (z) - Zinnia is too unusual for this K-2 Initial Sounds assessment bank and should be replaced with a simpler /z/ word.
- Initial Sounds: zebra crossing (z) - Zebra crossing is a culturally variable road-marking phrase, not a single concrete Initial Sounds object.
- Initial Sounds: zinnia flower (z) - Zinnia flower is too unusual for this K-2 Initial Sounds assessment bank and should be replaced with a simpler /z/ word.

## Validation Results

- `node tools/generatePublicMediaInventory.js` passed.
- `node tools/auditPhonicsMediaInventory.js` passed.
- `node tools/checkInitialSoundsRuntimeDepth.js` passed.
- `node tools/checkCoreSkillRuntimeDepth.js` passed.
- `node tools/checkInitialSoundProgression.js` passed.
- `node tools/auditQuestionBank.js` passed.
- `node tools/checkRuntimeQuestionCoverage.js` passed.
- `npm run check:media-quality` passed.
- `npm run build` passed.
- Initial Sounds: zoo gate (z) - Zoo gate is a location/entrance phrase, not a single concrete Initial Sounds object.
- Initial Sounds: zebra mask (z) - Zebra mask tests mask more than zebra and is visually confusing for Initial Sounds.
- Initial Sounds: zoo train (z) - Zoo train is a niche scene/vehicle phrase and not a strong clean /z/ target.
- Initial Sounds: zeppelin (z) - Zeppelin is obscure for K-2 Initial Sounds assessment and is blocked from active use.
- Initial Sounds: zesty lemon (z) - Zesty lemon is an adjective phrase and visually tests lemon rather than a /z/ target.
- Ending Sounds: nut (t) - inactive
- CVC Short Vowels: nut (pattern unknown) - inactive
- CVC Short Vowels: nut (nut) - inactive
- CVC Short Vowels: net (short_e) - inactive
- CVC Short Vowels: nut (short_u) - inactive
- Rhyming Words: fed (ed) - inactive
- Rhyming Words: nut (ut) - inactive
