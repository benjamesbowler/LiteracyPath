# Final Sounds Level 1 Progression Depth Audit

Generated: 2026-05-26T07:52:46.130Z

## New Mastery Rule

Final Sounds Level 1 no longer unlocks Level 2 after simple 8/8 sound coverage.

Each Level 1 final sound must have:

- 3 correct answers
- 3 different correct target words where possible
- 2 successful Level 1 rounds

Level 1 sounds stay limited to: b, d, g, l, m, n, p, t.

## Runtime Depth Inventory

| Sound | Usable target words | Words | Enough depth? |
|---|---:|---|---|
| b | 2 | tub, web | no |
| d | 4 | bed, kid, lid, red | yes |
| g | 9 | bag, bug, dog, leg, log, mug, pig, rug, wig | yes |
| l | 1 | seal | no |
| m | 5 | gum, ham, jam, ram, yam | yes |
| n | 9 | fan, fin, hen, man, pan, pen, pin, sun, van | yes |
| p | 7 | cap, cup, map, tap, top, up, zip | yes |
| t | 13 | bat, cat, cot, cut, exit, hat, jet, mat, net, newt, pot, rat, sit | yes |

## Simulation Results

- One perfect 15-question Level 1 round unlocks Level 2: no
- One-round successful rounds: 1/2
- Next round after one perfect round stayed Level 1 clean: yes
- Synthetic full-depth evidence unlocks Level 2: yes

## Content Gaps

- b: 2/3 usable words (web, tub)
- l: 1/3 usable words (seal)

## Warnings

- Some Level 1 final sounds do not have 3 usable target words: b(2), l(1).

## Failures

- none
