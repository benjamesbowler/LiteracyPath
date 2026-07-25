# Loop D curriculum release board

This file is generated from the same model rendered by the live admin Content
Coverage console. Do not edit it by hand.

Canonical release standard: `2026.07.24-a1.4`

## Current truth

- Skills ready: **17/30**
- Skills blocked: **13/30**
- A READY row means the canonical question-count, balance, media,
  accessibility, and live runtime-selectability dimensions pass.
- “Student exposure today” is counted from the real student bank loader after
  the release decision, not inferred from authored inventory.
- The exposure fingerprint identifies the exact sorted question-and-level set.
- A media waiver is an explicit review-dated exclusion from runtime. It never
  permits a missing-media question to reach a child.

| Skill | Gate | Owner | Authored | Approved | Student exposure today | Exact exposure set | Gate reason | Release exclusions / waivers |
| --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| Initial Sounds | READY | Phonics curriculum + media QA | 150 | 131 | 92 today (L1 46; L2 46) | sha256:740f87634c00 | All canonical release dimensions pass. | None |
| Final Sounds | READY | Phonics curriculum + media QA | 530 | 366 | 366 today (L1 189; L2 177) | sha256:cd43aa53a702 | All canonical release dimensions pass. | 6 excluded; review 2026-10-23 |
| Rhyming | READY | Phonics curriculum + media QA | 812 | 666 | 666 today (L1 476; L2 190) | sha256:5a9fd648d81b | All canonical release dimensions pass. | None |
| CVC Short Vowels | READY | Phonics curriculum + media QA | 467 | 412 | 412 today (L1 266; L2 146) | sha256:2d3a933c2665 | All canonical release dimensions pass. | 5 excluded; review 2026-10-23 |
| Short Vowel Discrimination | BLOCKED | Phonics curriculum + media QA | 542 | 314 | 0 — blocked from children | sha256:e3b0c44298fc | Live student bank is missing 100 of 314 canonically approved questions. | 7 excluded; review 2026-10-23 |
| High-Frequency Words 1-25 | BLOCKED | Literacy curriculum + media QA | 150 | — | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | None |
| High-Frequency Words 26-50 | BLOCKED | Literacy curriculum + media QA | 150 | — | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | None |
| High-Frequency Words 51-75 | BLOCKED | Literacy curriculum + media QA | 150 | — | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | None |
| High-Frequency Words 76-100 | BLOCKED | Literacy curriculum + media QA | 148 | — | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | None |
| Blends | READY | Phonics curriculum + media QA | 253 | 97 | 97 today (L1 47; L2 50) | sha256:318b21a4799d | All canonical release dimensions pass. | None |
| Digraphs | READY | Phonics curriculum + media QA | 252 | 120 | 120 today (L1 60; L2 60) | sha256:faebe50b8669 | All canonical release dimensions pass. | 1 excluded; review 2026-10-23 |
| Long Vowels and Silent E | READY | Phonics curriculum + media QA | 226 | 106 | 106 today (L1 50; L2 56) | sha256:61a6712dc1d5 | All canonical release dimensions pass. | 1 excluded; review 2026-10-23 |
| Vowel Teams | BLOCKED | Phonics curriculum + media QA | 116 | 101 | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | None |
| R-Controlled Vowels | BLOCKED | Phonics curriculum + media QA | 113 | 97 | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | 5 excluded; review 2026-10-23 |
| Nouns | BLOCKED | Curriculum + media QA | 382 | 184 | 0 — blocked from children | sha256:e3b0c44298fc | Live student bank is missing 124 of 184 canonically approved questions. | None |
| Verbs | BLOCKED | Curriculum + media QA | 383 | 161 | 0 — blocked from children | sha256:e3b0c44298fc | Live student bank is missing 130 of 161 canonically approved questions. | None |
| Adjectives | BLOCKED | Curriculum + media QA | 333 | 127 | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. | None |
| Prepositions of Place | BLOCKED | Curriculum + media QA | 303 | 46 | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | None |
| Plurals | BLOCKED | Curriculum + media QA | 153 | 96 | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | None |
| Prefixes and Suffixes | READY | Curriculum + media QA | 317 | 92 | 92 today (L1 46; L2 46) | sha256:29a178b2fc81 | All canonical release dimensions pass. | None |
| Antonyms and Synonyms | BLOCKED | Curriculum + media QA | 201 | 46 | 0 — blocked from children | sha256:e3b0c44298fc | Question-count floor is not met at both levels. Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard. | None |
| Homophones and Homonyms | READY | Curriculum + media QA | 162 | 92 | 92 today (L1 46; L2 46) | sha256:9b702df6d230 | All canonical release dimensions pass. | None |
| Sentence Comprehension | READY | Curriculum + media QA | 92 | 92 | 92 today (L1 46; L2 46) | sha256:7efc64c1c5b2 | All canonical release dimensions pass. | None |
| Key Details | READY | Curriculum + media QA | 185 | 185 | 185 today (L1 92; L2 93) | sha256:957bf9d0a57d | All canonical release dimensions pass. | None |
| Sequencing | READY | Curriculum + media QA | 92 | 92 | 92 today (L1 46; L2 46) | sha256:5bcf0215c8c8 | All canonical release dimensions pass. | None |
| Main Idea | READY | Curriculum + media QA | 92 | 92 | 92 today (L1 46; L2 46) | sha256:f3ac8d890867 | All canonical release dimensions pass. | None |
| Inference | READY | Curriculum + media QA | 92 | 92 | 92 today (L1 46; L2 46) | sha256:06e87b07334d | All canonical release dimensions pass. | None |
| Cause and Effect | READY | Curriculum + media QA | 92 | 92 | 92 today (L1 46; L2 46) | sha256:423871366f72 | All canonical release dimensions pass. | None |
| Context Clues | READY | Curriculum + media QA | 92 | 92 | 92 today (L1 46; L2 46) | sha256:3792c6cfa335 | All canonical release dimensions pass. | None |
| Theme and Higher Comprehension | READY | Curriculum + media QA | 92 | 92 | 92 today (L1 46; L2 46) | sha256:59055bf504ab | All canonical release dimensions pass. | None |

## Loop D rule

For each blocked skill: fill canonical question/variation gaps, wire and review
required media, rerun the strict audit and runtime simulation, regenerate this
board, and do not mark READY until the real student loader exposes the reviewed
set. Completion requires 30/30 READY with zero variation and media-wiring
failures.
