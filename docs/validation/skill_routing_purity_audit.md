# Skill Routing Purity Audit

Generated: 2026-06-02T07:44:22.556Z

## Summary

- Fatal routing failures: 0
- Rhyming, CVC Short Vowels, and Final Sounds were checked for cross-skill contamination across 20 simulated rounds each.

## Final Sounds

- Runtime-selectable pool: 451
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | bed, dog, book, ball, ram, fan, cap, car, bus, cat, web, fish, dish, brush, duck |
| 2 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | dog, book, ball, ram, fan, cap, car, bus, cat, bed, web, fish, dish, brush, duck |
| 3 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | sock, ball, ram, fan, cap, car, bus, cat, dog, bed, web, fish, dish, brush, duck |
| 4 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | shell, ram, fan, cap, car, bus, cat, dog, bed, web, fish, duck, sock, rock, ring |
| 5 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | fan, cap, car, bus, cat, dog, bed, web, jam, animal, fish, duck, sock, rock, ring |
| 6 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | mop, car, bus, cat, dog, bed, pan, web, jam, animal, fish, duck, sock, rock, ring |
| 7 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | fork, bus, cat, dog, bed, map, pan, web, jam, animal, fish, duck, sock, rock, ring |
| 8 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND | jet, dog, bed, map, pan, web, jam, animal, fish, duck, ring, hand, tent, lamp, park |
| 9 | 15 | ENDING_SOUND | map, pan, bat, bag, web, jam, lid, animal, fish, duck, ring, hand, tent, lamp, park |
| 10 | 15 | ENDING_SOUND | cub, jet, jam, sun, log, cap, lid, animal, fish, duck, ring, hand, tent, lamp, park |
| 11 | 15 | ENDING_SOUND | cob, jet, jam, sun, log, cap, lid, animal, fish, duck, ring, hand, tent, lamp, park |
| 12 | 15 | ENDING_SOUND | mug, cap, pot, pen, ham, lid, tub, animal, fish, duck, ring, hand, tent, lamp, park |
| 13 | 15 | ENDING_SOUND | ham, fin, net, lid, tub, animal, fish, duck, ring, hand, tent, lamp, park, fork, desk |
| 14 | 15 | ENDING_SOUND | lid, tub, animal, fish, duck, ring, hand, tent, lamp, park, desk, shell, whale, chair, car |
| 15 | 15 | ENDING_SOUND | nail, fish, duck, ring, hand, tent, lamp, park, desk, shell, chair, leaf, roof, ship, bus |
| 16 | 15 | ENDING_SOUND | dish, duck, ring, hand, tent, lamp, park, desk, shell, whale, chair, leaf, roof, ship, bus |
| 17 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | hand, tent, lamp, park, desk, shell, whale, chair, leaf, ship, bus, thumb, roof, fish, dish |
| 18 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | whale, chair, leaf, ship, bus, thumb, fish, mat, bed, pen, dog, duck, book, crab, map |
| 19 | 15 | ENDING_SOUND, FINAL_SOUND_PAIR_SELECT | bus, thumb, leaf, fish, mat, map, bed, pen, dog, duck, crab, seal, red, lid, web |
| 20 | 15 | FINAL_SOUND_PAIR_SELECT, ENDING_SOUND, ENDING_SOUND_WORD_MATCH | fish, mat, map, bed, pen, dog, drum, duck, crab, seal, dot, ship, beach, bib, bulb |

### Failures

- none

## CVC Short Vowels

- Runtime-selectable pool: 394
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | cat, bag, bat, cap, cup, dog, dot, fin, hat, jam, leg, log, man, map, mud |
| 2 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | dot, fin, hat, jam, leg, log, man, map, mud, mug, nap, pen, pig, pot, ram |
| 3 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, MISSING_VOWEL_CVC | map, mud, mug, nap, pen, pig, pot, ram, red, sit, sun, wig, lid, cat, bag |
| 4 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, MISSING_VOWEL_CVC, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | ram, red, sit, sun, wig, lid, cat, bed, pig, dog, cup, pen, map, pan, pin |
| 5 | 15 | MISSING_VOWEL_CVC, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | bag, bed, pig, dog, cup, pen, cat, map, pan, pin, bat, web, jet, jam, fish |
| 6 | 15 | MISSING_VOWEL_CVC, PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | sit, dog, cup, pen, cat, bed, map, pan, pin, bat, bag, web, jet, jam, fish |
| 7 | 15 | PICTURE_TO_PRINT_MATCH, PUT_SOUNDS_IN_ORDER | pen, cat, dog, bed, map, pan, pin, bat, bag, cup, web, jet, jam, fish, sock |
| 8 | 15 | PUT_SOUNDS_IN_ORDER | bat, bag, cup, web, jet, jam, fish, sock, duck, sun, hat, log, mug, fox, bug |
| 9 | 15 | PUT_SOUNDS_IN_ORDER | sock, duck, sun, hat, log, mug, fox, bug, wig, lid, fin, sit, pot, cap, man |
| 10 | 15 | PUT_SOUNDS_IN_ORDER, COMPLETE_WORD | bug, wig, lid, fin, sit, pot, cap, man, ram, cat, dog, bed, map, pan, pin |
| 11 | 15 | PUT_SOUNDS_IN_ORDER, COMPLETE_WORD | man, ram, cat, dog, bed, map, pan, pin, bat, bag, cup, web, jet, jam, sun |
| 12 | 15 | COMPLETE_WORD, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | pin, bat, bag, cup, web, jet, jam, sun, hat, log, mud, fin, map, ram, pen |
| 13 | 15 | COMPLETE_WORD, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | sun, hat, log, mud, fin, cup, map, ram, pen, jam, sit, pot, leg, bag, red |
| 14 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR | cup, map, ram, pen, jam, sit, pot, leg, bag, red, sun, pig, dot, wig, cap |
| 15 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, SHORT_VOWEL_WORD | leg, bag, red, sun, pig, dot, wig, cap, lid, mug, van, bat, dog, man, bad |
| 16 | 15 | HEARD_WORD_TO_PRINT_MINIMAL_PAIR, SHORT_VOWEL_WORD | cap, lid, mug, van, bat, dog, man, bad, den, bib, cob, bug, bun, bus, cub |
| 17 | 15 | SHORT_VOWEL_WORD, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | bad, den, bib, cob, bug, cat, bag, bat, cap, cup, dog, dot, fin, hat, jam |
| 18 | 15 | MISSING_VOWEL_CVC, SHORT_VOWEL_WORD, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | bat, den, bib, cob, bug, cat, bag, cap, cup, dog, dot, fin, hat, jam, leg |
| 19 | 15 | PICTURE_TO_PRINT_MATCH, SHORT_VOWEL_WORD, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | can, den, bib, cob, bug, cat, bag, bat, cap, cup, dog, dot, fin, hat, jam |
| 20 | 15 | SHORT_VOWEL_WORD, HEARD_WORD_TO_PRINT_MINIMAL_PAIR | dad, den, bib, cob, bug, cat, bag, bat, cap, cup, dog, dot, fin, hat, jam |

### Failures

- none

## Rhyming Words

- Runtime-selectable pool: 220
- Routing/purity failures: 0

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
| 1 | 15 | RHYMING_PICTURE | cat, pan, map, jam, bag, bad, bed, pen, jet, leg, pig, pin, fin, bin, lip |
| 2 | 15 | RHYMING_PICTURE | bat, pan, map, jam, bag, bad, bed, pen, jet, leg, pig, pin, fin, bin, lip |
| 3 | 15 | RHYMING_PICTURE | hat, pan, map, jam, bag, bad, bed, pen, jet, leg, pig, pin, fin, bin, lip |
| 4 | 15 | RHYMING_PICTURE | rat, pan, map, jam, bag, bad, bed, pen, jet, leg, pig, pin, fin, bin, lip |
| 5 | 15 | RHYMING_PICTURE | fan, map, jam, bag, bad, bed, pen, jet, leg, pig, pin, lip, zip, sit, hit |
| 6 | 15 | RHYMING_PICTURE | man, map, jam, bag, bad, bed, pen, jet, leg, pig, pin, lip, zip, sit, hit |
| 7 | 15 | RHYMING_PICTURE | map, jam, bag, bad, bed, pen, jet, leg, pig, pin, lip, sit, hit, dog, log |
| 8 | 15 | RHYMING_PICTURE | nap, jam, bag, bad, bed, pen, jet, leg, pig, pin, lip, sit, hit, dog, log |
| 9 | 15 | RHYMING_PICTURE | jam, bag, bad, bed, pen, jet, leg, pig, pin, lip, sit, dog, log, mop, hop |
| 10 | 15 | RHYMING_PICTURE | ram, bag, bad, bed, pen, jet, leg, pig, pin, lip, sit, dog, log, mop, hop |
| 11 | 15 | RHYMING_PICTURE | red, pen, jet, leg, pig, pin, lip, sit, dog, mop, hot, bug, rug, mug, jug |
| 12 | 15 | RHYMING_PICTURE | ten, jet, leg, pig, pin, lip, sit, dog, mop, hot, bug, sun, run, bun, cup |
| 13 | 15 | RHYMING_PICTURE | pig, pin, lip, sit, dog, mop, hot, bug, sun, cup, cut, ring, king, sock, rock |
| 14 | 15 | RHYMING_PICTURE | wig, pin, lip, sit, dog, mop, hot, bug, sun, cup, cut, ring, king, sock, rock |
| 15 | 15 | RHYMING_PICTURE | big, pin, lip, sit, dog, mop, hot, bug, sun, cup, cut, ring, king, sock, rock |
| 16 | 15 | RHYMING_PICTURE | fin, lip, sit, dog, mop, hot, bug, sun, cup, cut, ring, sock, rock, bell, shell |
| 17 | 15 | RHYMING_PICTURE | hit, dog, mop, hot, bug, sun, cup, cut, ring, sock, bell, fish, dish, cake, snake |
| 18 | 15 | RHYMING_PICTURE | hop, hot, bug, sun, cup, cut, ring, sock, bell, fish, cake, boat, coat, goat, car |
| 19 | 15 | RHYMING_PICTURE | hot, bug, sun, cup, cut, ring, sock, bell, fish, cake, boat, car, star, back, brick |
| 20 | 15 | RHYMING_PICTURE | dot, bug, sun, cup, cut, ring, sock, bell, fish, cake, boat, car, star, back, brick |

### Failures

- none

