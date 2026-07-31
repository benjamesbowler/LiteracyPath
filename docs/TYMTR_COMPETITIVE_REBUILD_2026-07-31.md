# Literacy Guide vs Teach Your Monster to Read

**Date:** 2026-07-31  
**Scope:** Sound Seekers, Arcade, character system, audio, pedagogy, replay  
**Method:** official TYMTR game guides and mini-game documentation; public official
screenshots/trailer material; direct browser play of our current release; source and
test audit. TYMTR's authenticated game could not be entered without creating an
account, so this document does not pretend a private full play-through occurred.

## Executive verdict

TYMTR currently wins the child's first impression and the moment-to-moment learning
fantasy. It does not present a quiz and decorate it afterwards. It turns the learning
target into a useful physical verb: herd the right animals, find a machine part, jump
to a grapheme, rescue a bear by segmenting a word, feed a tricky-word creature, follow
an instruction to open a gate. Character, voice, goal, motion, feedback and reward all
explain the same action.

Literacy Guide currently wins breadth, adult visibility and the foundations for
personalisation: 30 assessed skills, two skill levels, mastery evidence, book worlds,
teacher reporting, a 40-stop Sound Seekers journey, a larger library and an economy
without adverts or IAP. The problem is conversion. Too much of that value reaches a
five-year-old as menus, text, repeated answer panels, generic avatars and visually
unrelated arcade games.

The rebuild principle is therefore:

> **Every learning target becomes a voiced, visible, physical job for a known book
> character, and the world changes because the child succeeded.**

## Evidence sources

- Official overview: <https://www.teachyourmonster.org/teach-your-monster-to-read-overview/>
- Official mini-game breakdown: <https://www.teachyourmonster.org/teach-your-monster-to-read-mini-games/>
- Official educational rationale: <https://help.teachyourmonster.org/en/articles/5736688-how-is-teach-your-monster-to-read-educational>
- First Steps guide: <https://www.teachyourmonster.org/wp-content/uploads/2025/12/TYMTR1-gameguide-2025_KL_01.pdf>
- Fun With Words guide: <https://www.teachyourmonster.org/wp-content/uploads/2025/12/TYMTR2_game-guide-2.pdf>
- Champion Reader guide: <https://www.teachyourmonster.org/wp-content/uploads/2025/12/TYMTR3_game_guide_3.pdf>

## Side-by-side score before this rebuild

Scores are an implementation review, not child-outcome research. A release claim
requires the acceptance evidence at the end of this document.

| Area | TYMTR | Literacy Guide before pass | Why TYMTR feels better |
|---|---:|---:|---|
| First 30 seconds | 9.3 | 6.0 | Immediate character fantasy and authored scene versus route UI and setup |
| Character appeal | 9.4 | 5.8 | Recognisable expressive protagonist versus a selector promising Muddy but rendering a generic vector |
| Art unity | 9.2 | 6.5 | One contour/material language versus painterly maps, AI portraits, pixel residents, vector avatar and 3D primitives |
| Animation/acting | 8.8 | 6.1 | Reactions communicate success; ours often bobs, toasts or swaps a panel |
| Audio direction | 9.1 | 7.0 | Narrator, instruction, object and reward are one scene; ours has strong coverage but inconsistent staging and ducking |
| Learning-to-play clarity | 9.3 | 6.2 | One physical action per screen; ours still explains controls and rules in text |
| Phonics task validity | 9.2 | 8.0 | Both are systematic; TYMTR's task usually practises the named cognitive operation directly |
| Correction teaching | 8.8 | 8.4 | Ours has a stronger correction/mastery engine, but some arcade loops still punish or continue before teaching |
| Adaptive sequence | 9.0 | 9.1 | Sound Seekers' mastery and spaced-review architecture is a genuine advantage |
| Mini-game variety | 9.3 | 6.7 | TYMTR changes the verb; several Literacy Guide titles still change theme around related answer-selection engines |
| Narrative purpose | 9.0 | 7.1 | Reading/actions cause visible story progress; ours has good lore with weaker immediate consequence |
| Replay value | 8.9 | 7.0 | Varied actions, customisation and long progression; ours has scores/stars but repeated loop structure becomes visible |
| Teacher evidence | 7.8 | 9.2 | Literacy Guide records much richer assessment and classroom evidence |
| Accessibility foundations | 7.7 | 9.0 | Literacy Guide has a tested 2D route, reduced motion, keyboard and evidence gates, but the old fallback looked unfinished |
| Overall child product | **9.1** | **7.1** | Our architecture is stronger than the child-facing conversion |

## Why TYMTR works

### 1. It binds cognition to action

The child is not asked to click the correct token eight times. They use phonics to
complete a job. The action itself carries meaning:

- phoneme-to-grapheme recognition becomes jumping to, collecting or building with
  the correct grapheme;
- blending becomes rescuing, climbing or reaching;
- segmenting becomes constructing a word in sequence;
- tricky-word automaticity becomes finding, feeding or collecting a character;
- comprehension becomes following an instruction that changes the route.

### 2. It uses one communication stack

The same friendly voice introduces the action, names the target, responds to the
attempt and celebrates the result. Music and effects support that voice rather than
competing with it. The character looks toward the relevant object. A non-reader can
infer what to do from voice, gaze, motion and affordance before reading the caption.

### 3. It gives every activity a silhouette

A still image can distinguish the games: herd, jump, build, climb, feed, fish, cook.
In our current Arcade a still image can distinguish the menu art, but several live
activities converge on moving word labels, answer panels or a shared shell.

### 4. It spends its visual budget on the play space

TYMTR's authored 2D scenes use large shapes, strong contour control, high foreground/
background separation and characters large enough to read emotionally. Our premium
maps are attractive, but the low-end Sound Seekers path previously replaced them with
flat clipped hills and beige panels—the exact route that many school devices will see.

### 5. It makes repetition feel like progress

Weak graphemes return adaptively, but the setting, character job and reward change.
Our mastery engine is more explicit and defensible; our presentation made the repeated
selection structure easier to notice.

## Release rebuild

### Gate 0 — trust and correctness

- A selected book character must appear recognisably in the first playable scene.
- No prompt may advance, score or celebrate against a different active target.
- A sound-dependent task does not ship without the sound.
- Every Level 1 instruction is operable without reading.
- Wrong answers trigger teach-back, not only a buzz, heart loss or repeated prompt.

### Gate 1 — first-session vertical slice

- Replace the 2D emergency worksheet with the authored Meadow/Dino/Moonwood scene.
- Put the chosen book character in the scene, at child-readable scale.
- Keep one primary action visible; move progress and economy to quiet secondary UI.
- Voice each incoming easy-mode word before reaction is required.
- First easy round: no hazards, no simultaneous choices, five evidence-bearing
  responses, generous timing.
- Stage an in-world reward: object changes, resident reacts, character celebrates.

### Gate 2 — eight real mechanic families

Every Sound Seekers chapter and Arcade set must draw from visibly and cognitively
different families:

1. **Herd and sort** — move book-world creatures/objects to sound homes.
2. **Build and repair** — place graphemes/letters to complete a machine or bridge.
3. **Jump and navigate** — move a character through the correct sound path.
4. **Rescue and climb** — blend/segment to move toward someone in need.
5. **Catch and avoid** — timed fluency only after untimed accuracy is secure.
6. **Fish and reel** — listen, select, then perform a controlled motor action.
7. **Cook and order** — sequence phonemes, letters or sentence parts.
8. **Read and act** — follow meaningful captions/instructions that alter the world.

A skin, title or background change does not count as a new mechanic family.

### Gate 3 — instructional architecture

- Use assessment evidence to select the target and entry difficulty.
- Level 1 is voice-first, picture-led, untimed by default, one contrast at a time.
- Level 2 adds decodable words, adjacent consonants, sentence meaning and controlled
  time pressure.
- On a first error: repeat the word/sound and preserve all choices.
- Second error: contrast the two relevant options.
- Third error: reveal and model, let the child complete it, then requeue three turns
  later. The modelled response is not counted as independent mastery.
- Mastery remains 70% per phase where the assessment contract requires it; gameplay
  evidence may personalise practice but cannot silently promote assessment phases.

### Gate 4 — character and world production

- One canonical model sheet per named book character: proportions, palette, contour,
  expressions, poses and forbidden drift.
- Minimum playable set per avatar: idle, walk four directions, listen, choose, carry,
  jump, stumble, cheer and sad/retry.
- Residents are world-correct: Meadow Pals in Meadow, Dino Pals in Dino Land,
  Moonwood cast in Moonwood.
- Avatar can be any flagship character, regardless of world.
- Customisation must preserve the chosen character's identity rather than replacing it.
- World motion has narrative purpose: waterfall drives a wheel, wind moves a route
  marker, fireflies reveal a path, lava powers a forge.

### Gate 5 — sound direction

- A named guide voice owns instruction, correction and celebration.
- Every Level 1 prompt has a speaker control and auto-plays once.
- Incoming items in listening games are spoken early enough to act.
- Music ducks under voice; effects never mask phonemes.
- Correct: immediate soft confirmation, object consequence, short character response.
- Incorrect: neutral contrast sound, spoken model, no shame/failure explosion.
- Classroom mix acceptance: 95% prompt intelligibility in quiet, fan and group-noise
  profiles; zero masked phoneme cues.

### Gate 6 — replay

- Three authored variants per mechanic before palette swaps count.
- Voluntary side goals: rescue all residents, discover a book-page memory, perfect the
  sound set, collect a character item.
- Repeat play changes route/object arrangement without changing answer validity.
- Sessions remain short enough for classroom turns; the longer journey comes from
  varied visits, not an oversized single round.

## Acceptance bar for “better”

The product may claim it is better for this audience only when the comparison is
observable, not because a developer assigned a 10:

- at least 8/10 children aged 4–7 begin the first task without adult text-reading;
- median first-action time under 8 seconds after the voiced instruction;
- at least 85% can explain what sound/word they practised after the activity;
- at least 70% voluntarily choose another activity or replay;
- no mechanic exceeds 10% false-success/false-failure in recorded test runs;
- classroom audio clears the mix acceptance above;
- teachers identify the learner's next need correctly from the report at least 90%;
- iPad, Chromebook and low-end Android complete a 20-minute journey without a
  blank fallback, lost input, blocked navigation or unreadable crop;
- independent visual review finds no selected-character identity mismatch and no
  cross-world cast error.

## Implemented in the first competitive pass

- The low-end Sound Seekers route now uses the authored Meadow, Dino and Moonwood
  panorama art rather than flat clipped hills.
- It now keeps the task inside one continuous scene, with quiet translucent teaching
  chrome instead of a separate beige worksheet.
- Muddy, Chompy and Pip now have transparent, production-scale character cutouts in
  the playable fallback, preserving the book-character promise.
- The creator no longer swaps a named book character for a generic vector. Muddy,
  Chompy or Pip remains the single live preview while colour, mood, pose and earned
  trail-gear choices update that identity.
- Those character colour, pose and gear choices now carry into the playable 2D route.
- The first Sound Seekers selection has been changed from rectangular answer cards
  into animated authored seed-lantern objects, with the grapheme visibly attached.
- Its speaker control is always available when a recorded cue exists, and a tapped
  answer advances without a second continue click.
- Easy Rocket Run is now a listening-first game: each word is voiced as it enters,
  the first round has no hazards, simultaneous spawns are removed, timing is slower,
  and five deliberate catches replace eight reaction-heavy catches.
- Rocket onboarding is reduced to a voice-supported three-step action: listen,
  choose, fly.
- Easy Spell & Skate is now genuinely entry-level: the skater moves automatically,
  speed is reduced, only left/right controls remain, decorative pickups are removed,
  and the sound pieces form one calm Meadow route in reading order. The final blend
  pauses until the child chooses a clearly separated left or right word lane; taps
  work as well as holds. A missed sound is moved back into a supported attempt, an
  incorrect word returns to a supported retry, and every new word resets to the
  centred runway instead of inheriting the previous answer lane. The
  introduction demonstrates the actual c → a → t sequence instead of teaching six
  skate controls before the first phonics action. Advanced movement remains an
  optional Medium/Hard layer rather than a Level 1 prerequisite.
- The Moonwood character Pip has been removed from the Meadow guide role; the opening
  guide is now Bouncy from the Meadow books, and Bouncy appears alongside the chosen
  avatar when the scene says “Meet Bouncy”.

## Known production gap

The integration audit confirms all required current Arcade cues and all 90 Sound
Safari gold-voice items are recorded and browser TTS remains blocked. Forty-seven
later Sound Seekers graphemes do not yet have approved gold-voice recordings; those
prompts remain silent by policy rather than substituting a robot voice. This is a
tracked Gate 5 production dependency, not something this review counts as finished.

This pass closes the largest first-session failures. Gates 2–6 remain the production
programme; the acceptance bar must be measured rather than declared.
