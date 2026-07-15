# Content rubrics — vendored from anthropics/k12-teacher-skills

Source: https://github.com/anthropics/k12-teacher-skills (`evals/`), Apache-2.0.
Copyright 2026 Anthropic, PBC and Learning Commons — see `NOTICE` and
`LICENSE-Apache-2.0` in this directory. Co-developed by Anthropic and Learning
Commons as published quality standards for AI-generated K-12 classroom
materials, grounded in Science of Reading research.

## Why they are in this repo

Two of the K-2 phonics criteria are the exact rules Sound Seekers is built on,
and having them here lets us (a) enforce the mechanically-checkable ones in CI
and (b) say, truthfully, that our content is scored against a published,
field-grounded rubric:

| Rubric ID | Criterion | How LiteracyPath enforces it |
|---|---|---|
| ela P-E4 | **No three-cueing** — no picture-cue / context-guess / first-letter-guess prompting | `npm run check:content-rubric` scans every child-facing prompt and hint for cueing language and fails the build on a hit |
| ela P-E5 | **Decodable practice text only** — taught patterns + known HFWs | `npm run check:quest` (≥6 decodable words per stop, decodability enforced at build time in `questRounds.js` / `questEncounters.js`) |

The remaining criteria (33 shared + subject files) need judgement, not string
matching. Use them as an LLM-as-judge pass over generated content batches:
`judge-prompt.txt` is the published judge system prompt; feed it a rubric CSV
plus the content under review and require the JSON verdict array. Run it
through the same route as the KIMI review docs.

## Files

- `shared.csv` — 33 core criteria (P pedagogy / R rigor / O output / M scaffolding)
- `ela.csv`, `math.csv`, `science.csv`, `social_studies.csv` — subject overlays
- `differentiation.csv`, `clarifying_question.csv` — tiered-differentiation criteria
- `judge-prompt.txt` — LLM-as-judge system prompt (verbatim from upstream)
