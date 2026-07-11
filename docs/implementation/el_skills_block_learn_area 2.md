# EL Skills Block Learn Area

## Purpose

The Learn area adds a teacher-led EL Skills Block learning sequence to LiteracyPath. It is separate from assessments: it does not score students, update mastery, change placement, or write progress records. Teachers can choose a cycle, open the learning plan, and generate printable practice from that cycle's content.

## Data Structure

Cycle data lives in `src/data/elSkillsBlockCycles.js`. Each entry includes:

- `id`, `cycleNumber`, `title`, `type`, and `phase`
- `focusLetters` and `reviewLetters`
- `highFrequencyWords`
- `phonemicAwareness`
- `routines`, `friday`, and `dailyFlow`
- a consistent `sections` object for all Learn pages

The data is organized by instructional cycle order, not by calendar dates.

## Cycle Navigation

The app now exposes a `Learn` navigation button in Teacher Mode. The Learn landing page includes:

- a search box for cycles, skills, letters, sounds, and HFW
- a mobile cycle selector
- cycle cards with letters/sounds, HFW, phonemic awareness focus, and practice/check status
- a recommended cycle indicator that can later connect to saved progress evidence

## Included Sequence

The sequence includes BOY, Cycle 1 through Cycle 27, review/extension entries, MOY, EOY, and Celebrate Learning. The encoded cycle sequence follows the Kindergarten EL pacing order while intentionally omitting dates.

Examples included in the contract checker:

- Cycle 1: Aa/Mm, HFW `am` and `I`, compound word deletion, rhyming recognition
- Cycle 15: `sh`, `ch`, `th`, HFW `good` and `look`
- Cycle 23: `ng` plus `ang`, `ing`, `ong`, and `ung`

## Learning Sections

Every cycle has the same section structure:

- Cycle Overview
- Letter & Sound Learning
- Poem / Chant / Oral Language
- Phonemic Awareness
- Rhyming / Word Play
- High-Frequency Words
- Decoding / Chaining
- Writing / Encoding Practice
- Worksheet Generator
- Teacher Notes / Differentiation

The chants, routines, practice items, and teacher notes are original LiteracyPath content generated from the pacing focus, not copied EL lesson text.

## Worksheet Generator

The first version generates printable HTML inside the Learn page. Teachers can choose worksheet type, difficulty, item count, answer key, handwriting lines, and picture boxes. The print button prints the worksheet preview only. PDF export is intentionally left for a later pass.

## Full-Screen Lesson Deck

Each cycle now supports an in-app full-screen teaching deck. The deck hides the regular app chrome behind a fixed lesson surface and advances through large classroom-friendly slides: welcome, letter/sound focus, example word cards, games, chant, high-frequency word cards, writing, worksheet time, and celebration. Keyboard arrows move between slides and `Escape` exits the lesson.

## Games And Video Resources

Learn cycles include simple teacher-led game cards such as Sound Safari, Letter Sort, Rhyme Pop, Beat Builder, Word Chain, HFW Flash, and Writing Mission. These are classroom activities, not scored assessments. Video support is teacher-controlled through YouTube search links such as Little Fox English phonics searches. LiteracyPath does not embed, autoplay, download, or copy external video content.

## Mobile Behavior

The Learn area uses stacked mobile layouts, a mobile cycle selector, and a mobile section selector. The desktop cycle/sidebar layout collapses to one column, worksheet controls stack, and cards stay within the viewport.

## Future Integration

The data model is ready to connect with saved assessment evidence later. Future work can:

- recommend cycles based on mastered and needs-support items
- link weak skills to cycle worksheets
- show teacher small-group suggestions from assessment history
- save teacher-selected cycle plans

## Known Limitations / TODOs

- Worksheet output is printable HTML, not PDF.
- Recommended cycle logic is intentionally conservative and simple.
- Learn content does not currently save completion or practice history.
- No new media assets are attached to Learn cards yet.
