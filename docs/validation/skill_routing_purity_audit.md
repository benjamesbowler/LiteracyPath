# Skill Routing Purity Audit

Generated: 2026-05-26T04:40:04.289Z

## Summary

- Fatal routing failures: 0
- Rhyming, CVC Short Vowels, and Final Sounds were checked for cross-skill contamination across 20 simulated rounds each.

## Final Sounds

- Runtime-selectable pool: 248
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | bed, dog, book, ball, ram, fan, cap, car, bus, cat, web, fish, dish, brush, duck |
| 2 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | dog, book, ball, ram, fan, cap, car, bus, cat, bed, web, fish, dish, brush, duck |
| 3 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | sock, ball, ram, fan, cap, car, bus, cat, dog, bed, web, fish, dish, brush, duck |
| 4 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | shell, ram, fan, cap, car, bus, cat, dog, bed, web, fish, duck, sock, rock, ring |
| 5 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | fan, cap, car, bus, cat, dog, bed, web, jam, fish, duck, ring, king, hand, tent |
| 6 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | mop, car, bus, cat, dog, bed, pan, web, jam, fish, duck, ring, king, hand, tent |
| 7 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | fork, bus, cat, dog, bed, map, pan, web, jam, fish, duck, ring, king, hand, tent |
| 8 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | jet, dog, bed, map, pan, web, jam, fish, duck, ring, hand, tent, lamp, park, fork |
| 9 | 15 | ENDING_SOUND | map, pan, bat, bag, web, jam, lid, fish, duck, ring, hand, tent, lamp, park, fork |
| 10 | 15 | ENDING_SOUND | jet, jam, sun, log, cap, lid, fish, duck, ring, hand, tent, lamp, park, fork, desk |
| 11 | 15 | ENDING_SOUND | cap, pot, pen, ham, lid, fish, duck, ring, hand, tent, lamp, park, fork, desk, shell |
| 12 | 15 | ENDING_SOUND | gum, fin, net, lid, fish, duck, ring, hand, tent, lamp, park, desk, shell, whale, chair |
| 13 | 15 | ENDING_SOUND | dish, duck, ring, hand, tent, lamp, park, desk, shell, chair, leaf, ship, bus, octopus, thumb |
| 14 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | hand, tent, lamp, park, desk, shell, chair, leaf, ship, bus, thumb, fish, dish, mat, map |
| 15 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | whale, chair, leaf, ship, bus, thumb, fish, mat, bed, pen, dog, duck, book, crab, map |
| 16 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | bus, thumb, leaf, fish, mat, map, bed, pen, dog, duck, crab, girl, oval, gum, ham |
| 17 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | fish, mat, map, bed, pen, dog, drum, duck, crab, girl, th, baseball, bell, doll, football |
| 18 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | pen, dog, drum, duck, crab, bed, map, hat, girl, brush, th, baseball, bell, doll, football |
| 19 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | duck, crab, bed, map, pin, bag, hat, jam, girl, brush, th, baseball, bell, doll, football |
| 20 | 15 | ENDING_SOUND | web, hat, log, red, jam, sun, cup, girl, brush, th, baseball, building, king, ng, ring |

### Failures

- none

## CVC Short Vowels

- Runtime-selectable pool: 199
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | cat, bag, bat, bed, cap, cup, dog, dot, fin, hat, jam, leg, log, man, map |
| 2 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | dog, dot, fin, hat, jam, leg, log, man, map, mud, mug, nap, pen, pig, pot |
| 3 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, MISSING_VOWEL_CVC | man, map, mud, mug, nap, pen, pig, pot, ram, red, sit, sun, wig, lid, cat |
| 4 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, MISSING_VOWEL_CVC, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | pot, ram, red, sit, sun, wig, lid, cat, bed, pig, dog, cup, mud, pen, map |
| 5 | 15 | MISSING_VOWEL_CVC, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | cat, bed, pig, dog, cup, pen, map, pan, pin, bat, bag, web, jet, jam, fish |
| 6 | 15 | MISSING_VOWEL_CVC, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | fin, dog, cup, pen, cat, bed, map, pan, pin, bat, bag, web, jet, jam, fish |
| 7 | 15 | MISSING_VOWEL_CVC, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | sun, pen, cat, dog, bed, map, pan, pin, bat, bag, cup, web, jet, jam, fish |
| 8 | 15 | PUT_SOUNDS_IN_ORDER | pin, bat, bag, cup, web, jet, jam, fish, sock, duck, sun, hat, log, mug, fox |
| 9 | 15 | PUT_SOUNDS_IN_ORDER | fish, sock, duck, sun, hat, log, mug, fox, bug, wig, lid, fin, sit, pot, cap |
| 10 | 15 | PUT_SOUNDS_IN_ORDER, COMPLETE_WORD | fox, bug, wig, lid, fin, sit, pot, cap, man, ram, cat, dog, bed, map, pan |
| 11 | 15 | PUT_SOUNDS_IN_ORDER, COMPLETE_WORD | cap, man, ram, cat, dog, bed, map, pan, pin, bat, bag, cup, web, jet, jam |
| 12 | 15 | COMPLETE_WORD, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | pan, pin, bat, bag, cup, web, jet, jam, sun, hat, log, cat, bed, mud, fin |
| 13 | 15 | COMPLETE_WORD, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | jam, sun, hat, log, cat, bed, mud, fin, cup, map, ram, pen, sit, pot, leg |
| 14 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | mud, fin, log, cup, map, ram, pen, jam, sit, pot, leg, bag, red, sun, pig |
| 15 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | jam, sit, pot, leg, bag, red, sun, pig, dot, wig, cap, lid, mug, van, bat |
| 16 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, MISSING_VOWEL_CVC | pig, dot, wig, cap, lid, mug, van, bat, dog, man, bag, hen, jet, leg, pen |
| 17 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, MISSING_VOWEL_CVC | bat, dog, man, bag, hen, fin, cot, bug, cat, bed, cap, cup, dot, hat, jam |
| 18 | 15 | MISSING_VOWEL_CVC, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | cap, hen, fin, cot, bug, cat, bag, bat, bed, cup, dog, dot, hat, jam, leg |
| 19 | 15 | PICTURE_TO_PRINT_MATCH, MISSING_VOWEL_CVC, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | hat, hen, fin, cot, bug, cat, bag, bat, bed, cap, cup, dog, dot, jam, leg |
| 20 | 15 | MISSING_VOWEL_CVC, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | pan, hen, fin, cot, bug, cat, bag, bat, bed, cap, cup, dog, dot, hat, jam |

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

