# Guided Story Adaptation System

## Purpose

The purpose of this system is to create a high-quality Guided Reading library using:
- public-domain stories
- original stories
- adapted folk tales
- adapted fairy tales
- adapted fables
- decodable and semi-decodable readers

The system exists to ensure all books are:
- coherent
- age appropriate
- visually consistent
- literacy-focused
- narratively meaningful
- progression-based
- phonics-aware
- suitable for K–2 guided reading instruction

The system must prioritize:
1. Literacy correctness
2. Reading comprehension
3. Narrative quality
4. Reading enjoyment
5. Vocabulary development
6. Consistency
7. Technical reliability

---

# Core Principles

## 1. Every book must feel like a real story
Books must not feel like:
- random sentences
- disconnected pages
- image collections
- phonics drills pretending to be stories

Books must contain:
- a beginning
- a middle
- an ending
- a clear setting
- consistent characters
- logical events
- emotional continuity

Even simple Level A books should feel intentional.

---

## 2. Images and text must always match
Images must visually support the exact reading text.

The child should never see:
- conflicting objects
- conflicting actions
- conflicting settings
- conflicting weather/time of day
- embedded image text that differs from app text

Forbidden examples:
- text says “It is day” but image shows moon/stars
- text says “bag” while image focus is a map
- image contains different story text than the app text

---

## 3. Guided reading levels must actually progress
Higher levels must contain:
- longer text
- richer vocabulary
- more narrative structure
- more inference/comprehension
- more dialogue
- more varied sentence structures

The app must not use:
“one sentence per page”
for every level.

---

# Reading Level Structure

## Level A
Purpose:
- emergent reading
- print tracking
- confidence building

Requirements:
- 1 short sentence per page
- repetitive structure
- strong image support
- very high-frequency vocabulary
- predictable pattern

Examples:
- “Sam has a hat.”
- “The pig is big.”

Page count:
- 6 pages

Sentence length:
- 3–7 words

---

## Level B
Purpose:
- reinforce simple sentence reading
- increase confidence
- introduce simple story flow

Requirements:
- 1–2 sentences per page
- repeated characters/settings
- simple action progression

Page count:
- 6–8 pages

Sentence length:
- 4–10 words

---

## Level C
Purpose:
- introduce mini-story structure

Requirements:
- beginning/middle/end
- simple sequencing
- repeated vocabulary
- simple dialogue may begin

Page count:
- 6–8 pages

Sentence length:
- 5–12 words

---

## Level D
Purpose:
- develop comprehension and retelling

Requirements:
- short paragraphs
- richer settings
- stronger narrative flow
- emotions/actions

Page count:
- 8–10 pages

---

## Level E
Purpose:
- transition into true guided literature

Requirements:
- meaningful story arc
- dialogue
- problem/solution
- descriptive language
- stronger vocabulary

Page count:
- 8–12 pages

---

## Level F+
Purpose:
- adapted literature and fables
- comprehension-rich reading

Requirements:
- multiple events
- emotional understanding
- sequencing
- inference opportunities
- retelling support

Page count:
- 10–14 pages

---

# Story Types

## Decodable Readers
Purpose:
- phonics practice
- controlled decoding
- fluency

Characteristics:
- controlled vocabulary
- repeated spelling patterns
- limited irregular words

Examples:
- CVC stories
- short vowel readers
- digraph readers

---

## Guided Story Readers
Purpose:
- comprehension
- story structure
- enjoyment
- retelling

Characteristics:
- richer language
- stronger narrative
- emotional continuity
- literature adaptation

Examples:
- Three Little Pigs
- The Tortoise and the Hare
- Goldilocks
- Little Red Hen

---

# Public Domain Adaptation Rules

Allowed:
- public-domain fairy tales
- public-domain folk tales
- public-domain fables
- public-domain myths adapted for children

Examples:
- Aesop’s Fables
- Grimm stories
- Andersen stories
- Lang Fairy Books

Forbidden:
- copyrighted modern children’s books
- Disney text/story adaptations
- copyrighted illustrations
- modern rewritten commercial versions

All adaptations must:
- use modern simple English
- shorten complex passages
- remove inappropriate content
- simplify archaic language
- preserve core story structure

---

# Story Construction Rules

Every story must contain:

## Beginning
Introduce:
- character
- setting
- basic situation

## Middle
Introduce:
- action
- challenge
- discovery
- journey
- interaction

## Ending
Provide:
- resolution
- emotional conclusion
- moral (if appropriate)

---

# Character Rules

Characters must remain:
- visually consistent
- emotionally consistent
- logically consistent

Names must not randomly change.

Avoid:
- too many characters in early levels
- confusing pronouns
- unexplained scene changes

---

# Vocabulary Rules

Vocabulary must:
- match reading level
- be imageable
- be understandable for K–2
- avoid unnecessary complexity

Avoid:
- abstract language
- culturally obscure references
- difficult-to-illustrate nouns
- confusing proper nouns

Preferred:
- concrete nouns
- visible actions
- emotionally understandable language

---

# Phonics Integration Rules

Books may optionally include:
- target phonics patterns
- target high-frequency words
- repeated decodable structures

But:
Story quality must never be destroyed by phonics forcing.

Forbidden:
- nonsense sentences
- awkward phrasing
- random repetition

Bad example:
“The duck can duck by the duck.”

---

# Image Generation Rules

Images must:
- match page text exactly
- maintain character consistency
- maintain clothing consistency where possible
- maintain environment consistency
- avoid visual clutter
- support comprehension

Preferred style:
- warm
- clean
- child friendly
- expressive
- readable on mobile

Forbidden:
- embedded story text in images
- watermarks
- hyper-detailed chaotic scenes
- horror elements
- distorted anatomy
- confusing backgrounds

---

# Narration Rules

Narration text must match:
- app page text
- punctuation
- wording
- capitalization

Exactly.

No paraphrasing allowed.

---

# Guided Reading QA Pipeline

Every book must pass:

## Text QA
Check:
- punctuation
- capitalization
- grammar
- reading level
- sentence flow

## Story QA
Check:
- coherent sequence
- beginning/middle/end
- character consistency
- setting consistency

## Image QA
Check:
- image/text match
- no conflicting embedded text
- visual clarity

## Audio QA
Check:
- narration exact match
- correct page sequencing
- audio exists

---

# Rejection Rules

Reject or regenerate if:
- image conflicts with text
- narration differs from text
- punctuation missing
- story incoherent
- page sequence broken
- characters inconsistent
- embedded image text conflicts
- literacy quality weak

Do not activate failed books.

---

# Metadata Requirements

Every book must include:
- id
- title
- level
- type (fiction/nonfiction)
- pageCount
- targetVocabulary
- phonicsFocus
- highFrequencyWords
- coverImage
- narrationFiles
- QA status

Every page must include:
- pageNumber
- text
- image
- narration
- imageAlt
- targetWords
- qaStatus

---

# Reading Comprehension Support

Higher-level books should support:
- retelling
- sequencing
- prediction
- character feelings
- problem/solution
- vocabulary discussion

Optional additions:
- teacher prompts
- comprehension questions
- retell cards

---

# Final System Philosophy

The library must feel like:
- a real guided reading system
- a real classroom library
- a literacy tool teachers trust

NOT:
- random AI-generated content
- disconnected image cards
- automated nonsense readers

The system must always prioritize:
- reading quality
- literacy integrity
- educational usefulness
- child readability
- teacher trust
over content quantity.