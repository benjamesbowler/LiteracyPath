# Skill Routing Purity Audit

Generated: 2026-05-26T01:39:28.603Z

## Summary

- Fatal routing failures: 0
- Rhyming, CVC Short Vowels, and Final Sounds were checked for cross-skill contamination across 20 simulated rounds each.

## Final Sounds

- Runtime-selectable pool: 417
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | ENDING_SOUND_WORD_MATCH, FINAL_SOUND_PAIR_SELECT | hat, map, sun, dog, jam, bed, duck, bell, bus, leaf, red, bug, bag, pig, leg |
| 2 | 15 | ENDING_SOUND_WORD_MATCH, FINAL_SOUND_PAIR_SELECT | bell, bus, leaf, bed, dog, book, ball, ram, fan, cap, car, vase, octopus, cat, bat |
| 3 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | lid, dog, book, ball, ram, fan, cap, car, bus, cat, web, fish, dish, brush, duck |
| 4 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | leg, book, ball, ram, fan, cap, car, bus, cat, bed, web, fish, dish, brush, duck |
| 5 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | snake, ball, ram, fan, cap, car, bus, cat, dog, bed, web, fish, dish, brush, duck |
| 6 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | ham, fan, cap, car, bus, cat, dog, bed, web, bell, fish, duck, sock, rock, ring |
| 7 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | pin, cap, car, bus, cat, dog, bed, web, jam, bell, fish, duck, sock, rock, ring |
| 8 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | car, bus, cat, dog, bed, map, pan, web, jam, bell, fish, duck, sock, rock, ring |
| 9 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | bus, cat, dog, bed, map, pan, web, jam, bell, fish, duck, ring, king, hand, tent |
| 10 | 15 | ENDING_SOUND | cat, dog, bed, map, pan, web, jam, bell, fish, duck, ring, hand, tent, lamp, park |
| 11 | 15 | ENDING_SOUND | bag, cup, web, jet, jam, sun, lid, bell, fish, duck, ring, hand, tent, lamp, park |
| 12 | 15 | ENDING_SOUND | log, cap, pot, pen, ham, lid, bell, fish, duck, ring, hand, tent, lamp, park, fork |
| 13 | 15 | ENDING_SOUND | fan, ham, net, lid, bell, fish, duck, ring, hand, tent, lamp, park, fork, desk, shell |
| 14 | 15 | ENDING_SOUND | cut, lid, bell, fish, duck, ring, hand, tent, lamp, park, desk, chair, car, tiger, leaf |
| 15 | 15 | ENDING_SOUND | dish, duck, ring, hand, tent, lamp, park, desk, shell, chair, leaf, ship, bus, octopus, thumb |
| 16 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | hand, tent, lamp, park, desk, shell, chair, leaf, ship, bus, thumb, fish, dish, mat, map |
| 17 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | whale, chair, leaf, ship, bus, thumb, fish, mat, bed, pen, dog, duck, book, crab, cat |
| 18 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT, ENDING_SOUND_WORD_MATCH | bus, thumb, leaf, fish, mat, map, bed, pen, dog, duck, crab, bell, ham, cap, sun |
| 19 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND, ENDING_SOUND_WORD_MATCH | fish, mat, map, bed, pen, dog, drum, duck, crab, bell, cap, sun, jam, hat, bag |
| 20 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND, ENDING_SOUND_WORD_MATCH | pen, dog, drum, duck, crab, cat, bed, map, bell, mat, cap, sun, jam, hat, bag |

### Failures

- none

## CVC Short Vowels

- Runtime-selectable pool: 529
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

- Runtime-selectable pool: 203
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | RHYME_PAIR_SELECT | cat, pan, map, jam, bed, pen, jet, pig, pin, sit, dog, mop, hop, hot, pot |
| 2 | 15 | RHYME_PAIR_SELECT | hat, pan, map, jam, bed, pen, jet, pig, pin, sit, dog, mop, hop, hot, pot |
| 3 | 15 | RHYME_PAIR_SELECT | fan, map, jam, bed, pen, jet, pig, pin, sit, dog, mop, hot, pot, dot, bug |
| 4 | 15 | RHYME_PAIR_SELECT | nap, jam, bed, pen, jet, pig, pin, sit, dog, mop, hot, bug, rug, mug, sun |
| 5 | 15 | RHYME_PAIR_SELECT | hen, jet, pig, pin, sit, dog, mop, hot, bug, sun, cup, cut, ring, sock, bell |
| 6 | 15 | RHYME_PAIR_SELECT | dig, pin, sit, dog, mop, hot, bug, sun, cup, cut, ring, sock, bell, fish, cake |
| 7 | 15 | RHYME_PAIR_SELECT, LISTEN_FIND_RHYME | mop, hot, bug, sun, cup, cut, ring, sock, bell, fish, cake, boat, coat, car, cat |
| 8 | 15 | RHYME_PAIR_SELECT, LISTEN_FIND_RHYME | dot, bug, sun, cup, cut, ring, sock, bell, fish, cake, boat, car, cat, cap, fan |
| 9 | 15 | RHYME_PAIR_SELECT, LISTEN_FIND_RHYME | sun, cup, cut, ring, sock, bell, fish, cake, boat, car, cat, cap, fan, bed, pen |
| 10 | 15 | RHYME_PAIR_SELECT, LISTEN_FIND_RHYME | bell, fish, cake, boat, car, cat, cap, fan, bed, pen, pig, fin, sit, dog, mop |
| 11 | 15 | LISTEN_FIND_RHYME, RHYMING_PICTURE | cat, cap, fan, bed, pen, pig, fin, sit, dog, mop, pot, bug, sun, map, pan |
| 12 | 15 | READ_FIND_RHYME, LISTEN_FIND_RHYME, RHYMING_PICTURE | bed, pen, pig, fin, sit, dog, mop, pot, bug, sun, cat, map, pan, pin, log |
| 13 | 15 | LISTEN_FIND_RHYME, RHYMING_PICTURE | sit, dog, mop, pot, bug, sun, cat, map, pan, pin, jet, sock, hat, wig, hop |
| 14 | 15 | READ_FIND_RHYME, LISTEN_FIND_RHYME, RHYMING_PICTURE | pot, bug, sun, cat, map, pan, pin, log, jet, sock, wig, hop, ten, ram, cap |
| 15 | 15 | RHYMING_PICTURE | pan, pin, log, bug, sun, jet, sock, hat, wig, hop, ten, ram, cap, fin, mug |
| 16 | 15 | RHYMING_PICTURE | hat, wig, hop, ten, ram, cap, fin, mug, fox, rock, ring, bell, chair, boat, goat |
| 17 | 15 | RHYMING_PICTURE, READ_FIND_RHYME | mug, fox, rock, ring, bell, chair, boat, bee, rain, bat, pan, cap, tap, jam, ham |
| 18 | 15 | RHYMING_PICTURE, READ_FIND_RHYME | goat, bee, rain, bat, pan, cap, jam, pen, pig, pin, dog, pot, cot, bug, rug |
| 19 | 15 | READ_FIND_RHYME | hat, pan, cap, jam, pen, pig, pin, dog, pot, bug, cup, ring, king, sock, rock |
| 20 | 15 | LISTEN_FIND_RHYME, READ_FIND_RHYME | rat, pan, cap, jam, pen, pig, pin, dog, pot, bug, cup, ring, king, sock, rock |

### Failures

- none

