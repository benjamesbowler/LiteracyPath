# Skill Routing Purity Audit

Generated: 2026-05-26T00:05:14.308Z

## Summary

- Fatal routing failures: 0
- Rhyming, CVC Short Vowels, and Final Sounds were checked for cross-skill contamination across 20 simulated rounds each.

## Final Sounds

- Runtime-selectable pool: 476
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | ENDING_SOUND_WORD_MATCH, FINAL_SOUND_PAIR_SELECT | hat, map, sun, dog, jam, bed, duck, bell, bus, leaf, red, bug, bag, pig, leg |
| 2 | 15 | ENDING_SOUND_WORD_MATCH, FINAL_SOUND_PAIR_SELECT | bell, bus, leaf, bed, dog, book, ball, ram, fan, cap, car, vase, octopus, cat, bat |
| 3 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | lid, dog, book, ball, ram, fan, cap, car, bus, cat, web, fish, dish, brush, duck |
| 4 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | leg, book, ball, ram, fan, cap, car, bus, cat, bed, web, fish, dish, brush, duck |
| 5 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | snake, ball, ram, fan, cap, car, bus, cat, dog, bed, web, fish, dish, brush, duck |
| 6 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | ham, fan, cap, car, bus, cat, dog, bed, web, fish, duck, ring, king, hand, tent |
| 7 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | pin, cap, car, bus, cat, dog, bed, web, jam, fish, duck, ring, king, hand, tent |
| 8 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | car, bus, cat, dog, bed, map, pan, web, jam, fish, duck, ring, king, hand, tent |
| 9 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | bus, cat, dog, bed, map, pan, web, jam, fish, duck, ring, hand, tent, lamp, park |
| 10 | 15 | ENDING_SOUND | cat, dog, bed, map, pan, web, jam, fish, duck, ring, hand, tent, lamp, park, fork |
| 11 | 15 | ENDING_SOUND | bag, cup, web, jet, jam, sun, lid, fish, duck, ring, hand, tent, lamp, park, fork |
| 12 | 15 | ENDING_SOUND | log, cap, pot, pen, ham, lid, fish, duck, ring, hand, tent, lamp, park, fork, desk |
| 13 | 15 | ENDING_SOUND | fan, ham, net, lid, fish, duck, ring, hand, tent, lamp, park, desk, shell, whale, chair |
| 14 | 15 | ENDING_SOUND | cut, lid, fish, duck, ring, hand, tent, lamp, park, desk, shell, chair, car, tiger, leaf |
| 15 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | rock, ring, hand, tent, lamp, park, desk, shell, chair, leaf, ship, bus, octopus, thumb, roof |
| 16 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | fork, desk, shell, chair, leaf, ship, bus, thumb, fish, mat, bed, pen, ten, sun, dog |
| 17 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT, ENDING_SOUND_WORD_MATCH | leaf, ship, bus, thumb, fish, mat, bed, pen, dog, duck, crab, bell, ham, cap, sun |
| 18 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND, ENDING_SOUND_WORD_MATCH | roof, fish, mat, map, bed, pen, dog, drum, duck, crab, bell, cap, sun, jam, hat |
| 19 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND, ENDING_SOUND_WORD_MATCH | cap, bed, pen, dog, drum, duck, crab, cat, bell, mat, sun, jam, hat, map, bag |
| 20 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND, ENDING_SOUND_WORD_MATCH | mug, drum, duck, crab, cat, bed, map, pan, bell, mat, dog, cap, sun, jam, hat |

### Failures

- none

## CVC Short Vowels

- Runtime-selectable pool: 521
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | cat, bag, bat, bed, cap, cup, dog, dot, fin, hat, jam, leg, log, man, map |
| 2 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | dog, dot, fin, hat, jam, leg, log, man, map, mud, mug, nap, pen, pig, pot |
| 3 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, LISTEN_CHOOSE_VOWEL | man, map, mud, mug, nap, pen, pig, pot, ram, red, sit, sun, wig, lid, cat |
| 4 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, LISTEN_CHOOSE_VOWEL, PICTURE_TO_PRINT_MATCH | pot, ram, red, sit, sun, wig, lid, cat, bed, pig, dog, cup, mud, hat, map |
| 5 | 15 | LISTEN_CHOOSE_VOWEL, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | cat, bed, pig, dog, cup, pen, map, pan, pin, bat, bag, web, jet, jam, fish |
| 6 | 15 | PICTURE_TO_PRINT_MATCH, LISTEN_CHOOSE_VOWEL, PUT_SOUNDS_IN_ORDER | map, bed, pig, dog, cup, pen, cat, pan, pin, bat, bag, web, jet, jam, fish |
| 7 | 15 | MISSING_VOWEL_CVC, LISTEN_CHOOSE_VOWEL, PUT_SOUNDS_IN_ORDER | pen, pig, dog, cup, hat, cat, bed, map, pan, pin, bat, bag, web, jet, jam |
| 8 | 15 | LISTEN_CHOOSE_VOWEL, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | fin, dog, cup, hat, red, pen, cat, bed, map, pan, pin, bat, bag, web, jet |
| 9 | 15 | PICTURE_TO_PRINT_MATCH, LISTEN_CHOOSE_VOWEL, PUT_SOUNDS_IN_ORDER | dog, cup, hat, red, pig, pen, cat, bed, map, pan, pin, bat, bag, web, jet |
| 10 | 15 | MISSING_VOWEL_CVC, LISTEN_CHOOSE_VOWEL, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | log, cup, hat, red, pig, pen, cat, dog, bed, map, pan, pin, bat, bag, web |
| 11 | 15 | LISTEN_CHOOSE_VOWEL, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | sun, hat, red, pig, pot, pen, cat, dog, bed, map, pan, pin, bat, bag, cup |
| 12 | 15 | PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | cap, red, pig, pot, cup, pen, cat, dog, bed, map, pan, pin, bat, bag, web |
| 13 | 15 | PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | jet, pig, pot, cup, pen, cat, dog, bed, map, pan, pin, bat, bag, web, jam |
| 14 | 15 | PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | sit, pot, cup, pen, cat, dog, bed, map, pan, pin, bat, bag, web, jet, jam |
| 15 | 15 | PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | mud, pen, cat, dog, bed, map, pan, pin, bat, bag, cup, web, jet, jam, fish |
| 16 | 15 | PUT_SOUNDS_IN_ORDER | dog, bed, map, pan, pin, bat, bag, cup, web, jet, jam, fish, sock, duck, sun |
| 17 | 15 | PUT_SOUNDS_IN_ORDER | cup, web, jet, jam, fish, sock, duck, sun, hat, log, mug, fox, bug, wig, lid |
| 18 | 15 | PUT_SOUNDS_IN_ORDER, COMPLETE_WORD | sun, hat, log, mug, fox, bug, wig, lid, fin, sit, pot, cap, man, ram, cat |
| 19 | 15 | PUT_SOUNDS_IN_ORDER, COMPLETE_WORD | lid, fin, sit, pot, cap, man, ram, cat, dog, bed, map, pan, pin, bat, bag |
| 20 | 15 | COMPLETE_WORD | cat, dog, bed, map, pan, pin, bat, bag, cup, web, jet, jam, sun, hat, log |

### Failures

- none

## Rhyming Words

- Runtime-selectable pool: 219
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | RHYME_PAIR_SELECT | cat, cap, fan, bed, pen, pig, fin, sit, dog, mop, pot, bug, mug, rug, sun |
| 2 | 15 | RHYME_PAIR_SELECT | fan, bed, pen, pig, fin, sit, dog, mop, pot, bug, sun, box, jet, king, bell |
| 3 | 15 | RHYME_PAIR_SELECT | hen, pig, fin, sit, dog, mop, pot, bug, sun, box, jet, king, bell, fish, boat |
| 4 | 15 | RHYME_PAIR_SELECT | sit, dog, mop, pot, bug, sun, box, jet, king, bell, fish, boat, coat, bee, car |
| 5 | 15 | RHYME_PAIR_SELECT, LISTEN_FIND_RHYME | stop, pot, bug, sun, box, jet, king, bell, fish, boat, bee, car, bear, sock, cat |
| 6 | 15 | RHYME_PAIR_SELECT, LISTEN_FIND_RHYME | sun, box, jet, king, bell, fish, boat, bee, car, bear, sock, cat, cap, fan, bed |
| 7 | 15 | RHYME_PAIR_SELECT, LISTEN_FIND_RHYME | boat, bee, car, bear, sock, cat, cap, fan, bed, pen, pig, fin, sit, dog, mop |
| 8 | 15 | READ_FIND_RHYME, LISTEN_FIND_RHYME, RHYMING_PICTURE | cat, cap, fan, bed, pen, pig, fin, sit, dog, mop, pot, bug, sun, map, pan |
| 9 | 15 | LISTEN_FIND_RHYME, RHYMING_PICTURE | pen, pig, fin, sit, dog, mop, pot, bug, sun, cat, map, pan, pin, log, jet |
| 10 | 15 | READ_FIND_RHYME, LISTEN_FIND_RHYME, RHYMING_PICTURE | sit, dog, mop, pot, bug, sun, cat, map, pan, pin, jet, sock, hat, wig, hop |
| 11 | 15 | LISTEN_FIND_RHYME, RHYMING_PICTURE | bug, sun, cat, map, pan, pin, log, jet, sock, wig, hop, ten, ram, cap, fin |
| 12 | 15 | RHYMING_PICTURE | pin, log, bug, sun, jet, sock, hat, wig, hop, ten, ram, cap, fin, mug, fox |
| 13 | 15 | RHYMING_PICTURE | wig, hop, ten, ram, cap, fin, mug, fox, rock, ring, bell, chair, boat, goat, bee |
| 14 | 15 | RHYMING_PICTURE, READ_FIND_RHYME | fox, rock, ring, bell, chair, boat, bee, rain, bat, can, cap, den, hen, pen, ten |
| 15 | 15 | RHYMING_PICTURE, READ_FIND_RHYME, RHYME_PAIR_SELECT | bee, rain, bat, can, cap, den, big, bin, dog, hop, bug, bun, run, sun, cat |
| 16 | 15 | LISTEN_FIND_RHYME, READ_FIND_RHYME, RHYME_PAIR_SELECT | hat, can, cap, den, big, bin, dog, hop, bug, bun, bed, sit, hit, frog, log |
| 17 | 15 | READ_FIND_RHYME, RHYME_PAIR_SELECT | rat, can, cap, den, big, bin, dog, hop, bug, bun, bed, sit, hit, frog, log |
| 18 | 15 | READ_FIND_RHYME, RHYME_PAIR_SELECT | fan, cap, den, big, bin, dog, hop, bug, bun, cat, bed, sit, hit, frog, log |
| 19 | 15 | LISTEN_FIND_RHYME, READ_FIND_RHYME, RHYME_PAIR_SELECT | pan, cap, den, big, bin, dog, hop, bug, bun, cat, bed, sit, hit, frog, log |
| 20 | 15 | READ_FIND_RHYME, RHYME_PAIR_SELECT | cap, den, big, bin, dog, hop, bug, bun, cat, fan, bed, sit, hit, frog, log |

### Failures

- none

