# Games Audit + Learn Area Overhaul Plan

*Prepared 10 June 2026*

## Part 1: Games audit — your instinct was right

The arcade shows ten games, but under the hood they are one shared engine
(`ArcadePracticeGame.jsx`) with six actual play mechanics. Four of the ten
titles are duplicates of another title with a different name and picture.

| Title in arcade | Real mechanic | Duplicate of |
|---|---|---|
| CVC Word Builder | Build the word from letters | — |
| CVC Train | Build the word from letters | CVC Word Builder |
| Sound Slide | Build the word from letters | CVC Word Builder |
| Blend & Build | Sort words into families | — |
| Rhyme Time | Match pairs | Sight Word Memory (variant) |
| Sight Word Memory | Match pairs | — |
| Pop the Word | Tap the target word | — |
| Sight Word Fishing | Tap the target word | Pop the Word |
| Word Hopscotch | Complete the sentence | — |
| Reading Race | Multiple-choice quiz | — |

**Difficulty findings**

- Games run 6 rounds on easy, 8 on medium, 10 on hard — short sessions.
- The word pools are small (a few dozen CVC words, three short sight-word
  lists, ~8 rhyming pairs). Children will see the same words repeat within
  a couple of plays, which makes everything feel easy quickly.
- Difficulty is a setting, not a progression — nothing in the games adapts
  to the student's actual skill level from assessments, and results don't
  feed back into their progress record.

**Recommendations (in priority order)**

1. Cut or differentiate the four duplicate titles. Either remove them or
   give them genuinely different mechanics (e.g. CVC Train becomes a
   timed sequencing game, Sight Word Fishing adds decoys that look similar).
2. Tie difficulty to the student's current skill level from the skill tree
   instead of a manual easy/medium/hard switch.
3. Expand word pools 3–5x and draw them from the same phonics progression
   data the Learn area uses, so games always practise the right sounds.
4. Send game results into student progress so teachers see practice effort.

## Part 2: Learn area design overhaul

Goal: professional and consistent for adults and children — playful through
colour, illustration, and motion, never through clutter or novelty fonts.

Direction:

- One design language across student screens, built on the existing design
  tokens (teal primary, amber accent, Lexend/Inter type) instead of the
  current mix of styles.
- Consistent screen anatomy everywhere: calm header (activity name + Home
  button), one clear content card, progress shown the same way in every
  activity (the same star/meter component).
- Colour discipline: neutral warm background, teal for actions, amber for
  rewards/celebration only. Remove competing gradients and rainbow accents.
- Bigger touch targets (min 56px) and generous spacing for small fingers;
  no hover-dependent interactions (tablet-first).
- Typography scale: Lexend for all reading content, Inter for UI labels,
  max two sizes per screen beyond the heading.

## Part 3: Mobile usability

Already done in this round: sidebar auto-collapses to icons on phones, and
student-mode screens can now scroll when content is taller than the screen.

Still to do, screen by screen (next round): teacher dashboard tables become
cards on narrow screens; report controls stack; admin dashboard action
buttons move into a row that stays reachable; test every screen at 375px
width and at iPad sizes.
