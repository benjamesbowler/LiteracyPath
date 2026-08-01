# LiteracyPath instructional standard

This is the current whole-product instructional standard. The running application,
the fixed EL cycle data, the EL benchmark implementation, and the current v3 Skills
assessment blueprints remain the executable authority for their own scopes.

This document replaces earlier instructional policies. A future policy change
must update this authority and remove its superseded rule and implementation;
parallel variants are permitted only for an explicitly requested A/B test.

## The literacy model

LiteracyPath has three complementary learning lanes. They are not competing
curricula and they do not share one universal completion or pass rule.

### 1. Teach the code — EL

The EL-aligned benchmark is used to identify and teacher-confirm the student's
instructional microphase and cycle anchor. Formal teaching continues from that
confirmed point.

The current EL benchmark content, assessments, 27-cycle sequence and Present
experience remain unchanged by this standard.

### 2. Practise through play

Adventure Map, Sound Seekers and general games provide retrieval, reinforcement,
automaticity and enjoyment. Every child may begin this practice journey at Cycle 1,
including a child whose formal EL starting point is later.

Practice completion, stars, coins, game scores, help use and exposure must not:

- change a teacher-confirmed EL placement;
- create a formal Secure judgement by themselves;
- prevent access to the child's assessed teaching point;
- be described as an assessment result.

Printed decoding and encoding challenges inside EL-linked practice use only code
that has been taught by that cycle. Listening, stories and meaning activities may
contain richer language when support is explicit.

### 3. Build language and meaning

Books and Story Quests build oral language, vocabulary, knowledge, comprehension,
syntax, morphology, fluency, motivation and writing. Their ideas do not have to be
restricted to the child's EL cycle.

Every book is presented for one truthful purpose:

- **Read it yourself:** every running word is a taught high-frequency word or uses
  code available at the student's confirmed EL cycle anchor.
- **Read with help:** narration, word help or an adult supports access to richer
  language and ideas. Supported reading remains valuable but is not independent
  decoding evidence.

Pictures support meaning and knowledge. They must not be used to guess an unknown
printed word. Decoding support directs attention to the word's sounds and spelling.

## Knowledge journeys

Nonfiction is organised into cumulative text sets rather than isolated facts. Each
knowledge journey has:

- a guiding question;
- repeated domain vocabulary;
- books that revisit and extend the topic;
- oral explanation using evidence from the book;
- a drawing or writing response.

The current journeys are plants and growth, earth and sky, animals and habitats,
body and health, and water and forces. Their live source is
`src/data/knowledgeJourneys.js`.

## High-frequency words

High-frequency and sight words are a separate learning strand that runs beside
phonics. Their introduction does not wait for every letter or spelling in the
word to have been taught through the phonics sequence. This is why a word such
as **are** can be taught and recognised before `e` is a phonics focus.

Dedicated practice teaches children to recognise, understand and use the whole
word, with repeated reading and spelling in meaningful language. It must not be
reported as evidence that the child has mastered each phonics pattern inside the
word. Conversely, a high-frequency word already taught in its own strand counts
as available when deciding whether a book can be read independently.

EL retains authority for which high-frequency words are introduced and when;
their order is not recalculated from phonics coverage.

## Comprehension and writing

Finishing pages or retrying a multiple-choice quiz does not by itself demonstrate
comprehension. Book and story experiences should repeatedly ask children to:

- retell important information or events;
- explain cause, motivation or change;
- support an answer with the text or illustration;
- use new vocabulary in speech;
- compare ideas across books;
- draw, label, dictate or write a response.

## Fluency

Fluency means accurate, increasingly automatic and expressive oral reading. Page
turns and silent taps are participation evidence, not fluency measures. Formal
fluency evidence continues to come from the teacher-led EL assessment and recorded
reading observations. Rereading and phrasing practice may support fluency without
claiming to measure it.

## Assessment boundaries

- EL benchmarks retain their own administration, scoring and teacher-confirmation
  rules.
- The v3 Skills assessment retains the single phase rule defined in
  `src/content/blueprints/skillBlueprints.js`.
- There is no whole-product 80%, 85%, 90% or named-person approval rule.
- Exposure, supported performance, independent performance and formal assessment
  remain distinguishable in saved evidence and reports.

## Current implementation sources

- `src/policy/literacyExperiencePolicy.js` — lane, placement and reading-purpose rules
- `src/data/elSkillsBlockCycles.js` — fixed EL cycle sequence
- `src/data/elBenchmarkAssessmentCatalog.js` — fixed EL-aligned benchmark definitions
- `src/data/knowledgeJourneys.js` — cumulative knowledge text sets
- `src/utils/guidedReading/recommendBooksForStudent.js` — reading recommendations
- `src/components/elQuest/elQuestEngine.js` — cycle-bounded practice generation
- `src/data/reportingEvidenceModel.js` — evidence claim boundaries

## Research basis

This standard follows converging evidence rather than treating the Science of
Reading as one programme or phonics alone:

- [IES foundational reading recommendations](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published)
- [IES K–3 comprehension recommendations](https://ies.ed.gov/ncee/wwc/PracticeGuide/14)
- [EL Skills Block Resource Manual](https://eleducation.org/documents/1619/Curriculum_Tools_K2_Skills_Block_Resource_Manual-0124.pdf)
- [Duke and Cartwright, The Science of Reading Progresses](https://ila.onlinelibrary.wiley.com/doi/10.1002/rrq.411)
- [Ehri, orthographic mapping](https://eric.ed.gov/?id=EJ1027413)
