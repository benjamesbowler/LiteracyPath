# Second Block Skill Media Depth Audit

Generated: 2026-06-04T01:42:10.842Z

Scope: Digraphs, Long Vowels / Silent E, Vowel Teams, R-Controlled Vowels, Nouns, Verbs, Adjectives, Prepositions, Plurals, Antonyms / Synonyms.

Pass criteria: at least 100 selectable runtime questions where the K3 source pool supports it, zero image gaps, zero audio gaps for audio-prompt questions, no QA-blocked media, no duplicate target/template pairs in the top-up bank, and no live fake/non-word targets.

| Skill | Selectable | L1 | L2 | Second-block top-up | Image gaps | Audio gaps | Blocked media | Duplicate top-up targets | Fake/non-word live | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Digraphs | 120 | 60 | 60 | 0 | 0 | 0 | 0 | 0 | 0 | pass |
| Long Vowels / Silent E | 106 | 52 | 54 | 48 | 0 | 0 | 0 | 0 | 0 | pass |
| Vowel Teams | 116 | 31 | 85 | 24 | 0 | 0 | 0 | 0 | 0 | pass |
| R-Controlled Vowels | 118 | 32 | 86 | 0 | 0 | 0 | 0 | 0 | 0 | pass |
| Nouns | 100 | 50 | 50 | 40 | 0 | 0 | 0 | 0 | 0 | pass |
| Verbs | 100 | 59 | 41 | 40 | 0 | 0 | 0 | 0 | 0 | pass |
| Adjectives | 100 | 64 | 36 | 40 | 0 | 0 | 0 | 0 | 0 | pass |
| Prepositions | 103 | 29 | 74 | 42 | 0 | 0 | 0 | 0 | 0 | pass |
| Plurals | 104 | 28 | 76 | 39 | 0 | 0 | 0 | 0 | 0 | pass |
| Antonyms / Synonyms | 100 | 16 | 84 | 38 | 0 | 0 | 0 | 0 | 0 | pass |

## Notes

- Digraphs and R-Controlled Vowels already exceeded the 100-question target before this top-up, so the generated second-block bank did not add extra rows for them.
- Duplicate target count is scoped to the new second-block top-up bank by level, target, and template type; any duplicate target/template pair fails this audit.
- Fake/non-word rejected count is the generator denylist size used to prevent known bad targets such as ballshell/bookdesk from entering runtime.

## Failures

- none
