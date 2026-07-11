# LiteracyPath EL Skills Block Learn Area — Revised Production Design Specification

## Purpose

This document replaces the raw PPT-focused specification as the working design and content brief for the LiteracyPath **EL Skills Block Learn Area**.

The previous specification was useful for structure, slide sequencing, and visual expectations, but it contained direct YouTube links, external-image sourcing instructions, some weak/awkward poems, and some early-cycle decoding/chaining examples that are too advanced unless teacher-modelled. This revised version is app-first, copyright-safe, kindergarten-appropriate, and ready to give to Codex as the design and content standard.

The goal is not to make the Learn Area look like a meeting deck. The goal is to create an engaging kindergarten teaching space with lesson decks, printable worksheets, clay mats, vocabulary mats, games, teacher scripts, and guided reading connections.

---

## Non-Negotiable Rules

1. **No copied proprietary text.** Use the EL pacing order and structure only. All poems, chants, teacher scripts, worksheets, games, and activity wording must be original LiteracyPath content.
2. **No hotlinked external images.** Use existing app assets or generate a Kimi request for missing visuals.
3. **No direct embedded video autoplay.** Use teacher-controlled YouTube search/open links only.
4. **Cycle focus comes first.** HFW are separate practice items, not the main phonics focus.
5. **Do not expect children to decode untaught patterns independently.** If an activity includes untaught letters/patterns, mark it as teacher-modelled oral work, vocabulary exposure, or listening practice.
6. **Not board-meeting style.** Use big visuals, cards, classroom-screen formatting, large letters, simple child language, and clear teaching flow.
7. **All printable resources must be black-and-white friendly.** Colour can be used in screen views, but print resources should not waste ink.
8. **All cycle content must be auditable.** Each activity must know which cycle skill it supports.

---

## Product Areas to Implement

Each cycle should generate the following resources:

1. **In-App Full-Screen Lesson Deck**
2. **Teacher Plan / Lesson Flow**
3. **Clay Mat**
4. **Vocabulary Mat**
5. **Worksheet Pack**
6. **Game / Task Cards**
7. **Writing Practice Sheet**
8. **Guided Reading This Week**
9. **Video Resource Search Cards**
10. **Missing Visuals Request Rows** where needed

---

## Universal Visual Design Standards

### Screen / Lesson Deck

- Format: 16:9 classroom display layout.
- Main colour: deep navy `#1A3A6B`.
- Accent: gold `#F5A623`.
- Success: green `#2ECC40`.
- Try again / support: red `#CC2200`.
- Backgrounds: white, soft blue `#EAF4FB`, soft yellow `#FFFBEA`.
- Use large rounded cards and tiles.
- Avoid dense text.
- One clear teaching idea per slide.
- Keep teacher controls visible but not distracting.

### Typography

Use existing app fonts. If available, approximate:

- Slide titles: rounded bold, 40–54px equivalent.
- Large letters: very large, 120–180px equivalent.
- Body text: bold, 28–36px equivalent.
- Small teacher notes: 18–22px equivalent.

### Print Resources

- Use white background.
- Use black/grey outlines.
- Name and date line at top.
- Large handwriting lines.
- Clear directions.
- Page-break friendly.
- Do not rely on colour.

---

## Recommended App Components

Suggested implementation files:

- `src/data/elSkillsBlockCycles.js`
- `src/data/elLearnResourceTemplates.js`
- `src/utils/learnDeckBuilder.js`
- `src/utils/learnWorksheetBuilder.js`
- `src/components/LearnAreaPage.jsx`
- `src/components/learn/LearnLessonDeck.jsx`
- `src/components/learn/ClayMatPreview.jsx`
- `src/components/learn/VocabularyMatPreview.jsx`
- `src/components/learn/WorksheetPackPreview.jsx`
- `src/components/learn/GameCardPreview.jsx`
- `src/components/learn/TeacherPlanPreview.jsx`
- `tools/checkLearnAreaContentQuality.js`
- `tools/checkLearnAreaContracts.js`
- `docs/assets/kimi_learn_area_missing_visuals_request.md`

Keep the current structure if different, but the data/rendering should be separated enough that content can improve without rewriting UI.

---

## Cycle Data Schema

Each cycle should include:

```js
{
  id: "cycle-1",
  cycleNumber: 1,
  title: "Cycle 1: Meet A and M",
  phase: "early-letter-sound",
  childFriendlyGoal: "I can hear /ă/ and /m/.",
  teacherGoal: "Students identify Aa /ă/ and Mm /m/ and practise HFW am and I.",
  focusLetters: [
    {
      grapheme: "Aa",
      uppercase: "A",
      lowercase: "a",
      sound: "/ă/",
      spelling: "a",
      keywords: ["apple", "ant", "alligator"],
      articulation: "Open your mouth wide for the short /ă/ sound.",
      formation: {
        uppercase: ["Slant down", "Slant down", "Cross in the middle"],
        lowercase: ["Circle around", "Short line down"]
      }
    }
  ],
  focusPatterns: [],
  highFrequencyWords: ["am", "I"],
  phonemicAwareness: [
    "Delete the first part of compound words",
    "Rhyming recognition"
  ],
  vocabularyCards: [],
  decodableWords: [],
  exposureWords: [],
  poem: {},
  callResponse: [],
  games: [],
  chainingTasks: [],
  writingTasks: [],
  worksheetTasks: [],
  videoSearches: [],
  guidedReadingRecommendations: {},
  teacherTips: []
}
```

---

# Lesson Deck Model

The app should generate three lesson deck types per cycle. These are in-app full-screen lesson decks first. PPTX export can come later.

---

## Lesson 1: Poem Launch and Getting to Know Letters / Patterns

Use for the first focus letter or pattern.

Slide sequence:

1. Title slide
2. Today We Learn slide
3. Learning Targets
4. Quick Review: previous known letters/patterns
5. Quick Review: previous HFW
6. Warm-Up Picture Game
7. New Letter / Pattern Card
8. Sound and Mouth Card
9. Example Word Cards
10. High-Frequency Word Routine
11. Poem / Chant Launch
12. Call-and-Response Practice
13. Formation / Writing Practice
14. Mini Game
15. Check for Understanding
16. Worksheet / Teacher Task
17. Celebration slide

---

## Lesson 2: Second Letter / Pattern, Fluency, Rhyme, and Video Search

Slide sequence:

1. Title slide
2. Quick Review cards
3. Teacher-Controlled Video Search card
4. Learning Targets
5. Second Letter / Pattern Card
6. Sound and Mouth Card
7. Example Word Cards
8. HFW Flashcards
9. Sentence Frames
10. Rhyming or Word Play
11. Fluency Text
12. Writing Practice
13. Game
14. Check for Understanding
15. Celebration slide

---

## Lesson 3: Call and Response and Chaining

Slide sequence:

1. Title slide
2. Quick Review: letters/patterns
3. Quick Review: HFW
4. Learning Targets: fluency
5. Learning Targets: phonemic awareness
6. Poem / Chant reread
7. Call-and-Response
8. Chaining / Word Building
9. Mini Game
10. Fluency Text
11. Check for Understanding
12. Worksheet / Independent Practice
13. Celebration slide

---

# Slide Type Specifications

## Title Slide

- Full-screen navy background.
- Large white cycle title.
- Gold subtitle.
- Big friendly icon/letter tile.
- Example: `Cycle 1: Meet A and M`.

## Letter / Pattern Card

- Big uppercase/lowercase tile or pattern tile.
- Sound bubble.
- 2–4 image/word cards.
- Teacher script.

Example:

- A a
- `/ă/`
- apple, ant, alligator
- Script: “A can say /ă/. Say /ă/ like apple.”

## HFW Routine Slide

For each HFW:

- Look: show the word.
- Spell: letter by letter.
- Read: say the word.
- Write: skywrite / whiteboard.
- Use: short sentence.

## Poem / Chant Slide

- Short, rhythmic poem.
- 4–8 lines max per slide.
- Large text.
- Target letters/patterns highlighted.
- HFW underlined or shown as chips.
- Add movement cue.

## Game Slide

Every game needs:

- game title
- teacher instruction
- student action
- cards/items
- answer/reveal
- support prompt
- challenge prompt

## Chaining Slide

- Show word chain one step at a time.
- Highlight changed letter/sound.
- Use sound boxes.
- Include teacher prompt: “What changed?”

## Video Search Slide

- No embed by default.
- Button opens teacher-controlled YouTube search in new tab.
- Search terms based on cycle focus.
- Example: `Little Fox English letter A phonics kindergarten`.

---

# Resource Generators

## Clay Mat

Purpose: printable black-and-white sheet for clay or marker formation.

Must include:

- Name line
- Cycle label
- large outline letters/patterns
- picture prompt boxes/circles
- word labels
- handwriting lines
- simple directions

Letter cycles:

- top section for first letter
- bottom section for second letter

Pattern cycles:

- one section per pattern
- example picture/word prompts under each

## Vocabulary Mat

Purpose: cycle word bank for display and oral vocabulary.

Must include:

- cycle title
- focus letters/patterns
- grid of picture/word cards
- HFW card row
- no random decorative clutter

Words should be grouped by focus:

- A words
- M words
- HFW
- review words

## Worksheet Pack

Worksheet pack should include 3–6 tasks per cycle:

- trace
- circle
- sort
- match
- draw
- read/write HFW
- oral PA task
- chaining or pattern practice where appropriate

## Teacher Plan

Include:

- objective
- materials
- lesson flow
- teacher script
- differentiation
- quick check
- guided reading recommendation
- worksheet suggestion

---

# Content Quality Standards

## Poem / Chant Rules

Good kindergarten chant:

- short lines
- strong rhythm
- easy to say aloud
- simple vocabulary
- clear sound focus
- natural phrasing
- includes movement/call-response potential

Bad chant:

- long sentences
- forced alliteration
- strange adult phrasing
- too many unfamiliar words
- phonics focus gets buried

## Decoding Rules

- Independent decoding should use previously taught letters/patterns.
- Vocabulary exposure can use broader words but must not be framed as independent decoding.
- CVC games in very early cycles may be teacher-modelled only unless all graphemes are taught.

## HFW Rules

HFW are learned as words:

- read
- spell
- trace/write
- say in sentence

Do not treat HFW as the main phonics focus unless they align with the target skill.

---

# Priority Cycle Content Rewrites

These cycles must be excellent before expanding the same quality standard to all cycles.

---

## Cycle 1: Meet A and M

### Focus

- Aa says /ă/
- Mm says /m/
- HFW: am, I
- Phonemic awareness: delete first part of compound words; rhyming recognition

### Child Goal

“I can hear /ă/ and /m/.”

### Sound Cards

#### A/a

- Sound: /ă/
- Keywords: apple, ant, alligator
- Articulation: open mouth, short sound
- Teacher script: “A can say /ă/. Say /ă/ like apple.”

#### M/m

- Sound: /m/
- Keywords: moon, mouse, map
- Articulation: lips together, humming sound
- Teacher script: “M says /m/. Put your lips together and hum: /m/.”

### HFW Cards

- am
- I

### Revised Poem / Chant: “Ant and Mouse”

```text
A, a, apple,
A, a, ant.
M, m, mouse,
March, march, march.

I am me.
I am Sam.
A and M,
I can say am.
```

### Call and Response

```text
Teacher: What sound does A make?
Children: /ă/ /ă/ /ă/!
Teacher: What sound does M make?
Children: /m/ /m/ /m/!
Teacher: Read this word: am.
Children: am!
Teacher: Read this word: I.
Children: I!
```

### Games

#### Sound Safari

Teacher says: “Find a word that starts with /ă/.”

Cards:

- apple — correct for /ă/
- ant — correct for /ă/
- mouse — correct for /m/
- map — correct for /m/

#### Letter Sort

Baskets:

- A/a
- M/m

Cards:

- apple
- ant
- alligator
- moon
- mouse
- map

#### Beat Builder

Oral task:

- Say sunshine. Say it without sun. Answer: shine.
- Say rainbow. Say it without rain. Answer: bow.
- Say cupcake. Say it without cup. Answer: cake.

### Worksheet Tasks

1. Trace A/a.
2. Trace M/m.
3. Circle pictures that start with /ă/.
4. Circle pictures that start with /m/.
5. Trace/write: am.
6. Trace/write: I.
7. Draw something that starts with A.
8. Draw something that starts with M.

---

## Cycle 8: B and W

### Focus

- Bb says /b/
- Ww says /w/
- HFW: not, that
- Phonemic awareness: delete onset of CVC words; rhyming identification

### Sound Cards

#### B/b

- Keywords: bear, ball, bat, book
- Script: “B says /b/. Bounce your lips open: /b/.”

#### W/w

- Keywords: wolf, watch, watermelon, wave
- Script: “W says /w/. Make your lips round: /w/.”

### Revised Poem / Chant: “Bear and Wave”

```text
B, b, bear,
B, b, ball.
W, w, wave,
Big and tall.

Bear has a book.
Wolf has a hat.
I can read not.
I can read that.
```

### Chaining

Use the teacher-modelled chain:

```text
wit → bit → bat → mat → mad
```

Make clear that the teacher leads the chain and children listen for what changed.

### Clay Mat

Generate B/b and W/w clay mat:

- B/b section: ball, bat, book
- W/w section: wolf, watch, watermelon
- large outline letters
- writing lines

---

## Cycle 15: sh, ch, th

### Focus

- sh
- ch
- th
- HFW: good, look
- substitute initial sound in CVC words
- delete first part of two-syllable words

### Pattern Cards

- sh: shark, sheep, shop, ship
- ch: chair, cheese, chin, chip
- th: teeth, three, thumb, think

### Revised Poem / Chant: “Three Sound Friends”

```text
Sh, sh, sheep,
quiet in the shop.
Ch, ch, chip,
crunch, crunch, stop.

Th, th, three,
thumbs up, look!
Good sounds today,
in our reading book.
```

### Game: Pattern Sort

Baskets:

- sh
- ch
- th

Cards:

- ship
- sheep
- shop
- chip
- chair
- cheese
- thumb
- three
- teeth

### Clay Mat

Generate ch / th / sh mat:

- each pattern has dotted writing line
- picture box
- word label

---

## Cycle 23: ng and Rime Families

### Focus

- ng
- ang, ing, ong, ung
- HFW: only, other
- delete last syllable in two-syllable words
- substitute initial sound in CVC words

### Pattern Cards

- -ang: bang, sang, rang
- -ing: ring, sing, king
- -ong: song, long, gong
- -ung: sung, hung, rung

### Revised Poem / Chant: “The King Can Sing”

```text
Ring, ring, ring,
the king can sing.
Sing, sing, sing,
hear the bells ring.

Bang, bang, bang,
long, long song.
Only one king,
sings all day long.
```

### Games

- NG Word Family Sort
- Ring/Sing/King rhyming chain
- Build the word: r + ing = ring

---

# Cycle Brief Table

Use this as the master sequence. Add cycle-rich content following the priority-cycle standard above.

| Cycle | Focus | HFW | Notes |
|---|---|---|---|
| BOY | Baseline assessment | — | Letter ID and phonological awareness |
| 1 | Aa /ă/, Mm /m/ | am, I | Delete first part of compound words; rhyming recognition |
| 2 | Tt /t/, Ss /s/ | a, the | Delete first part of compound words; rhyming recognition |
| 3 | Nn /n/, Ii /ĭ/ | an, and | Delete last part of compound words |
| 4 | Ff /f/, Dd /d/ | is, of | Delete last part of compound words |
| Review 1–4 | a, m, t, s, n, i, f, d | am, I, a, the, an, and, is, of | Review and extension |
| 5 | Oo /ŏ/, Ll /l/ | go, no, so | Delete first part of two-syllable words |
| 6 | Rr /r/, Hh /h/ | do, my, to | Delete first part of two-syllable words |
| 7 | Review cycles 1–6 | into, said | Microphase assessment |
| 8 | Bb /b/, Ww /w/ | not, that | Delete onset of CVC words |
| 9 | Qu /kw/, Uu /ŭ/ | he, me, she | Delete onset of CVC words; rhyme production |
| 10 | Cc /k/, Gg /g/ | are, as, you | Delete onset of CVC words |
| 11 | Pp /p/, Yy /y/, Xx /ks/ | see, was | Delete rime of CVC words |
| 12 | Ee /ĕ/, Vv /v/ | for, or | Delete rime of CVC words |
| 13 | Kk /k/, Jj /j/, Zz /z/ | her, his | Rhyme review |
| 14 | Review cycles 8–13 | this, with, your | Microphase assessment |
| 15 | sh, ch, th | good, look | Pattern Power begins |
| 16 | short a, all | all, says, they | Substitute initial sound in CVC words |
| 17 | short i | each, like, little | Substitute initial sound in CVC words |
| 18 | short o | from, have, more | Delete first syllable in 3-syllable compounds |
| 19 | short u | about, out, put | Substitute rime in CVC words |
| 20 | short e | be, get, very | Substitute rime in CVC words |
| 21 | wh /w/ | what, when, who | Microphase assessment |
| 22 | nk | does, goes | Substitute rime in 3-sound words |
| 23 | ng, ang/ing/ong/ung | only, other | Word family/rime work |
| 24 | ff, ss, zz, ll | off, which | FSZL/fizzle pattern |
| 25 | Review | again, day, say | Microphase assessment |
| 26 | y as long i | by, my, why, try | Pattern Power / review |
| 27 | Review and celebration | first, friend, half | Final cycle |
| EOY | Benchmark | — | End-of-year evidence |
| Celebrate | Review | — | Celebration learning |

---

# Video Resource Policy

Use teacher-controlled search links only.

Search term format:

```text
Little Fox English [letter/pattern] phonics kindergarten
```

Examples:

- Little Fox English letter A phonics kindergarten
- Little Fox English letter M phonics kindergarten
- Little Fox English sh ch th digraph phonics kindergarten
- Little Fox English ng words phonics kindergarten

Do not embed direct videos by default. Do not autoplay. Do not download or copy videos.

---

# Missing Visuals Request Policy

If a resource needs an image that does not exist, add a row to:

`docs/assets/kimi_learn_area_missing_visuals_request.md`

Each row:

- cycle
- resource type
- word/object
- target path
- style
- notes

Style:

- natural kindergarten cartoon
- no text in image unless specifically requested
- no fake letters
- no watermarks
- no babyfied object faces
- no rainbow/sparkle weirdness
- simple clear background

---

# Validation Expectations

Run:

```bash
node tools/checkLearnAreaContentQuality.js
node tools/checkLearnAreaContracts.js
node tools/checkMobileLayoutContracts.js
node tools/checkTeacherDashboardDataContracts.js
node tools/checkAssessmentRuntimeSafety.js
npm run build
git diff --check
```

---

# Acceptance Criteria

- Cycle 1 teaches A and M separately.
- HFW are separate from phonics focus.
- Priority cycles 1, 8, 15, and 23 have strong content.
- Lesson decks feel like kindergarten teaching decks.
- Clay mats match or beat current uploaded examples.
- Vocabulary mats match or beat current uploaded examples.
- Worksheets are printable and useful.
- Games are playable.
- No external hotlinked images.
- No copied copyrighted text.
- Video support is teacher-controlled.
- Build passes.
