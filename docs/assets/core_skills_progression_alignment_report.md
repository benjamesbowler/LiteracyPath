# Core Skills Progression Alignment Report

Date: 2026-05-25

## Summary

This pass aligned the login/session behavior, desktop assessment image sizing, and core phonics runtime-depth checks for Initial Sounds, Ending Sounds, CVC Short Vowels, and Rhyming Words.

## Login Reset Behavior

- Changed startup profile restore so a cached teacher profile no longer auto-loads the previous `studentId` or `studentName`.
- On a fresh app/session load, the app now clears selected-student state and lands on student selection.
- Class selection and class/student lists are preserved; student records are not deleted.
- Stale generic selected-student keys are cleared from local/session storage.

## Desktop Question Image Size

- Increased assessment prompt image containers by about 20% for desktop/large tablet layouts only.
- Mobile image sizing remains governed by the existing small-screen rules.
- Updated shared assessment image containers and the Initial Sounds `FirstSoundQuestion` image area.

## Runtime Depth And Progression

| Skill | Runtime-Selectable Items | Minimum | Sample Round Size | Status |
| --- | ---: | ---: | ---: | --- |
| Initial Sounds | 473 | 100 | 15 | pass |
| Ending Sounds | 195 | 100 | 15 | pass |
| CVC Short Vowels | 256 | 100 | 15 | pass |
| Rhyming Words | 133 | 100 | 15 | pass |

## Ending Sounds

- Level gating remains active: Level 1 serves simple single-letter final sounds first; Level 2 is reserved for harder endings once Level 1 coverage is mastered/covered.
- Runtime-selectable bank: 195 items.
- Repeated 15-question simulation passed.

Sample repeated rounds:

- Round 1: hat, map, sun, dog, jam, bed, duck, bell, bus, leaf, listen and find, cat, pan, pin, bat
- Round 2: bag, cup, web, jet, pen, ham, fish, sock, ring, hand, tent, lamp, park, fork, desk
- Round 3: log, cap, pot, hen, ram, dish, rock, king, shell, chair, roof, octopus, thumb, ship, shop
- Round 4: mug, fan, gum, brush, whale, car, red, mat, boat, moon, drum, top, fog, run, a blanket fort

## CVC Short Vowels

- Runtime-selectable bank: 256 items.
- Validation now simulates repeated rounds and requires 100+ selectable items.
- Missing audio no longer removes an otherwise valid image-backed item from app-level question validation.
- One Round 4 repeated target (`mop`) was unavoidable in the strict unused-word simulation after the available unique unused-word pool dropped below 15; the round still returns 15 valid questions.

Sample repeated rounds:

- Round 1: cat, map, red, sit, dog, cup, mat, pen, pin, hop, rug, bag, bat, bed, cap
- Round 2: dot, fin, hat, jam, leg, log, man, mud, mug, nap, pig, pot, ram, sun, wig
- Round 3: lid, pan, net, cot, nut, web, jet, fish, sock, duck, fox, bug, hen, ship, shop
- Round 4: mop, tap, top, dig, lip, ham, win, rod, hut, pet, kid, van, did, big, mop

## Rhyming Words

- Runtime-selectable bank: 133 items.
- Repeated 15-question simulation passed.
- Rhyming media semantics remain allowed to differ between prompt word and represented option image because the image can represent the correct rhyme or a distractor.

Sample repeated rounds:

- Round 1: hat, rug, run, red, hop, lake, dish, ring, coat, car, spoon, night, tree, bear, listen and find
- Round 2: cat, cap, fan, bed, pen, pig, fin, sit, dog, mop, pot, bug, sun, map, pan
- Round 3: pin, log, jet, sock, wig, ten, ram, mug, fox, bell, chair, boat, goat, bee, rain
- Round 4: coat, listen and find, cap, fan, bed, pen, pig, fin, sit, dog, mop, pot, bug, sun, cat

## Validation Results

- `node tools/checkCoreSkillRuntimeDepth.js` passed.
- `node tools/auditPhonicsMediaInventory.js` passed.
- `node tools/checkRuntimeQuestionCoverage.js` passed.
- `node tools/auditQuestionBank.js` passed.
- `npm run check:media-quality` passed.
- `npm run build` passed.

## Remaining Gaps

- CVC Short Vowels has enough depth, but the strict unused target-word pool can still exhaust before four full rounds because several templates reuse the same CVC target across different formats. This is now visible in the validation report instead of silently failing.
- Some inventory rows remain intentionally blocked for unsuitable target words or rejected media. They are listed in the skill inventory and Kimi request docs.
