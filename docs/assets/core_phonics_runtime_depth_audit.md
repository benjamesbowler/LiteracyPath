# Core Phonics Runtime Depth Audit

Date: 2026-05-25

## Root Cause Of Initial Sounds Stopping Early

Initial Sounds was building a 15-question plan first and then filtering QA-blocked images afterward in the app. If previously rejected image statuses remained for the first selected core words, the visible queue could collapse to a small number of questions. The repair moves the image/media QA predicate into the Initial Sounds selector so it chooses replacement words before the round queue is finalized. The selector also treats missing audio as non-blocking for image-backed Initial Sounds items.

## Skill Summary

| Skill | Image Files/Refs | Audio Files/Refs | Matched Image+Audio Words | Image-Only Words | Audio-Only Words | Active Items | Runtime-Selectable Items | Blocked/Filtered | Duplicate Words | Missing Media References |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial Sounds | 500 | 500 | 500 | 0 | 0 | 473 | 473 | 27 | 0 | 0 |
| Ending Sounds | 102 | 103 | 60 | 1 | 1 | 200 | 200 | 1 | 16 | 0 |
| CVC Short Vowels | 57 | 47 | 44 | 0 | 0 | 256 | 203 | 38 | 40 | 0 |
| Rhyming Words | 68 | 77 | 30 | 0 | 0 | 143 | 100 | 27 | 1 | 0 |

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
2. bag / bag
3. bat / bat
4. bed / bed
5. cap / cap
6. cup / cup
7. dog / dog
8. dot / dot
9. fin / fin
10. hat / hat
11. jam / jam
12. leg / leg
13. log / log
14. man / man
15. map / map

### Rhyming Words

1. at / listen and find
2. ap / cap
3. an / fan
4. ed / bed
5. en / pen
6. ig / pig
7. in / fin
8. it / sit
9. og / dog
10. op / mop
11. ot / pot
12. ug / bug
13. un / sun
14. at / cat
15. ap / map

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
- Initial Sounds: zoo gate (z) - Zoo gate is a location/entrance phrase, not a single concrete Initial Sounds object.
- Initial Sounds: zebra mask (z) - Zebra mask tests mask more than zebra and is visually confusing for Initial Sounds.
- Initial Sounds: zoo train (z) - Zoo train is a niche scene/vehicle phrase and not a strong clean /z/ target.
- Initial Sounds: zeppelin (z) - Zeppelin is obscure for K-2 Initial Sounds assessment and is blocked from active use.
- Initial Sounds: zesty lemon (z) - Zesty lemon is an adjective phrase and visually tests lemon rather than a /z/ target.
- Ending Sounds: nut (t) - inactive
- CVC Short Vowels: bag (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: big (pattern unknown) - wrong skill/template: UNKNOWN is not allowed for cvc_short_vowels
- CVC Short Vowels: cap (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: cot (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: cup (pattern unknown) - wrong skill/template: UNKNOWN is not allowed for cvc_short_vowels
- CVC Short Vowels: cup (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: did (pattern unknown) - wrong skill/template: UNKNOWN is not allowed for cvc_short_vowels
- CVC Short Vowels: dig (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: dog (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: ham (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: hat (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: hen (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: hop (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: hut (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: kid (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: leg (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: lip (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: log (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: map (pattern unknown) - wrong skill/template: UNKNOWN is not allowed for cvc_short_vowels
- CVC Short Vowels: map (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: mat (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: net (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: nut (pattern unknown) - inactive
- CVC Short Vowels: pen (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: pet (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: pet (pattern unknown) - wrong skill/template: UNKNOWN is not allowed for cvc_short_vowels
- CVC Short Vowels: pin (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: red (pattern unknown) - wrong skill/template: UNKNOWN is not allowed for cvc_short_vowels
- CVC Short Vowels: red (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: rod (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: rug (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: sit (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: tap (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: top (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: win (pattern unknown) - wrong skill/template: MULTIPLE_CHOICE is not allowed for cvc_short_vowels
- CVC Short Vowels: nut (nut) - inactive
- CVC Short Vowels: net (short_e) - inactive
- CVC Short Vowels: nut (short_u) - inactive
- Rhyming Words: bear (air) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: cake (ake) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: lake (ake) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: cap (ap) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: car (ar) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: hat (at) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: bed (ed) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: fed (ed) - inactive
- Rhyming Words: red (ed) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: bee (ee) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: tree (ee) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: shell (ell) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: pen (en) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: night (ight) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: will (ill) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: ring (ing) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: dish (ish) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: coat (oat) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: snow (oh) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: spoon (oon) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: hop (op) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: rose (ose) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: house (ouse) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: rug (ug) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: fun (un) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: run (un) - wrong skill/template: MULTIPLE_CHOICE is not allowed for rhyming
- Rhyming Words: nut (ut) - inactive
