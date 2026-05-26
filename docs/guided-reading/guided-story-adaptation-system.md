# Guided Story Adaptation System

## Purpose

The purpose of this system is to create a high-quality Guided Reading library using:
- classic-source stories
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
6. Fiction continuity
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

This legacy section describes the starter-library leveling baseline. The controlled production model later in this document is the stricter standard for all new production batches.

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

# Classic Source Adaptation Rules

Allowed:
- classic fairy tales
- classic folk tales
- classic fables
- classic myths adapted for children

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

# Fiction Continuity Enforcement

Fiction continuity is mandatory.

This is a literacy and comprehension requirement, not just a visual preference. Children use repeated character appearance, stable settings, predictable props, and coherent page-to-page events to understand who is acting, where events happen, and how the story sequence works.

Continuity failures invalidate a fiction book. A book with inconsistent characters, random clothing changes, unexplained setting changes, broken weather/time continuity, or disconnected story events cannot become active in the Guided Reading library.

Consistency overrides image prettiness. A beautiful illustration that redesigns a character, changes clothing without story cause, changes species/body proportions, or jumps to an unrelated setting is a failed illustration.

For fiction:
- characters must remain visually identical across all pages
- clothing must remain consistent unless the story explicitly changes it
- hair, fur, feather, skin, and body colors must remain consistent
- body proportions, visual age, and species must remain consistent
- recurring props and accessories must remain consistent
- settings must remain logically continuous
- time of day, weather, and lighting must remain coherent unless intentionally changed in the text
- events must flow sequentially from page to page
- visual style must remain stable across the whole book

For nonfiction:
- page visuals may vary because each page may explain a different fact, object, place, or process
- page-level relevance is more important than character continuity
- recurring narrator/mascot characters, if used, must still remain visually consistent

## Character Bible Enforcement

Every fiction book must include a canonical character sheet before assets can be requested or approved.

Required character fields:
- name
- age/species
- skin/fur/feather/body color
- hair style/color, mane detail, or head detail
- eye color/style
- clothing
- accessories
- personality
- speaking style
- height/build/body proportions
- setting relationship
- canonical appearance summary

Character bible rules:
- The same character bible must be referenced in every page image prompt.
- Kimi or any future generator must not redesign characters page-to-page.
- If a page cannot preserve the character bible, the page must be regenerated.
- If a full book cannot preserve the character bible, the book remains inactive.

## Environment Continuity Enforcement

Every fiction book must include an environment bible.

Required environment fields:
- primary setting
- time-of-day logic
- weather logic
- lighting logic
- recurring props
- setting continuity notes
- forbidden setting drift

If a story starts in a forest cabin at sunset during winter, later pages cannot randomly become a desert, daytime beach, or modern classroom unless that movement is explicitly written into the story.

Environment continuity rules:
- Keep the main setting stable unless the text describes a journey or change.
- Keep weather and lighting coherent with the story sequence.
- Keep recurring props visually consistent.
- Do not add random background characters or objects that change the story meaning.
- Do not shift art style between pages.

## Continuity Metadata Requirements

Every fiction guided story must support:
- `characterBible`
- `environmentBible`
- `continuityNotes`
- `continuityChecklist`
- `continuityStatus`

Allowed continuity statuses:
- `draft_needs_assets`
- `approved`
- `needs_fix`
- `needs_regeneration`
- `rejected`

Draft books may remain inactive with `draft_needs_assets`. Active fiction books must have `approved` continuity status after visual QA.

## Future Automated Continuity Support

The system should keep hooks for future automated support without adding heavy AI vision logic yet.

Planned future checks:
- image embedding comparison between pages
- character similarity scoring
- clothing/accessory consistency scoring
- environment similarity scoring
- visual style drift detection
- page-sequence anomaly detection

These checks should support, not replace, human literacy QA.

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
- fiction continuity checklist

## Image QA
Check:
- image/text match
- no conflicting embedded text
- visual clarity
- same character appearance across pages for fiction
- same clothing/accessories across pages for fiction
- same environment/time/weather/lighting continuity for fiction
- same visual style across pages for fiction

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
- main character appearance changes
- clothing or accessories randomly change
- environment continuity breaks
- weather, time of day, or lighting changes without story cause
- visual style changes heavily between pages
- narrative continuity breaks
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
- characterBible for fiction
- environmentBible for fiction
- continuityNotes for fiction
- continuityChecklist for fiction
- continuityStatus for fiction

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

---

# Controlled Production Model

Guided Reading production now uses a controlled batch model. Codex is the story author and quality-control owner. Kimi is the asset renderer.

## Codex Responsibilities

Codex must:
- write the books
- structure reading levels
- enforce literacy progression
- enforce fiction continuity
- generate exact page-by-page image requirements
- generate exact narration scripts
- generate canonical character bibles
- generate environment bibles
- generate Kimi asset request files
- generate validation metadata
- approve or reject assets after QA

## Kimi Responsibilities

Kimi must:
- create the actual images
- create the actual narration audio
- follow Codex instructions exactly
- preserve character, setting, and story continuity
- use exact app text for narration

Kimi must never:
- invent story details
- rewrite app text
- paraphrase narration
- redesign characters
- change clothing randomly
- change setting/weather/lighting randomly
- add embedded text unless explicitly requested
- activate or approve content

Kimi is an asset renderer, not the story author.

## Batch Strategy

Production proceeds in batches, not infinite generation.

Each production round contains:
- 5 fiction books per level
- 5 nonfiction books per level
- Levels A, B, C, D, E
- 50 books total per round
- 25 fiction books
- 25 nonfiction books

Batch flow:
1. Codex writes and validates book text.
2. Codex generates character bibles, continuity metadata, page image requirements, narration scripts, filenames, and QA metadata.
3. Kimi renders images and audio exactly from Codex instructions.
4. Codex validates continuity, narration match, image/text alignment, literacy correctness, and technical file integrity.
5. Only approved books become active.

Current active books remain as temporary starter content. They should not be removed until replacement batches are validated and approved.

---

# Production Level Requirements

## Level A

Requirements:
- 6-10 pages
- 1-2 simple sentences per page
- heavy image support
- focused on decoding, first 1-25 high-frequency words, CVC words, and a few long-vowel words
- clear page-to-page meaning even with very simple text

## Level B

Requirements:
- 8-10 pages
- 2-3 simple sentences per page
- focused on blends, digraphs, long vowels, vowel teams, CVC words, first 1-50 high-frequency words, and some rhyming patterns
- simple story or informational flow

## Level C

Requirements:
- 10-12 pages
- 1 simple paragraph per page
- focused on all K-1 reading skills, CVC words, blends, short vowels, long vowels, vowel teams, and first 100 sight words
- proper beginning, middle, and ending for fiction
- clear topic sequence for nonfiction

## Level D

Requirements:
- 12-15 pages
- multiple short paragraphs per page
- focused on K-3 reading skills, stronger comprehension, richer vocabulary, and deeper narrative or informational structure
- more inference, sequencing, and evidence-based discussion

## Level E

Requirements:
- 12-15 pages
- multiple paragraphs per page
- more advanced language than Level D
- more complex narrative or informational structure
- stronger emotional/comprehension depth
- richer sentence variety
- clear opportunities for discussion, inference, and retelling

---

# Nonfiction Expectations

Nonfiction books must:
- be factually accurate
- use clear topic progression
- avoid random fact lists
- define or support new vocabulary
- use images that directly support the text
- organize information in a way teachers can discuss
- remain age-appropriate and not babyish

Continuity is relaxed for nonfiction because pages may show different subtopics, examples, diagrams, places, or processes. If a nonfiction book uses a recurring narrator, child, mascot, or guide character, that recurring character must remain visually consistent.
