# Codex Guided Story Generation Pipeline

Date: 2026-05-25

## Pipeline Rule

Codex writes and validates the books. Kimi renders assets.

Kimi must not invent story details, rewrite text, redesign characters, or change environments. Kimi receives exact instructions and produces images/audio from those instructions only.

## Step 1: Codex Writes Validated Story Text

Codex creates:
- book title
- type: fiction or nonfiction
- level A-E
- exact page text
- target literacy focus
- target vocabulary
- comprehension focus
- decodable/high-frequency word metadata
- story source or original status
- QA metadata

Fiction must have a beginning, middle, and ending. Nonfiction must have coherent informational structure.

## Step 2: Codex Generates Production Metadata

For fiction, Codex generates:
- canonical character bible
- environment bible
- continuity notes
- continuity checklist
- continuity status
- page-by-page image requirements
- exact narration scripts
- deterministic image/audio filenames
- rejection rules

For nonfiction, Codex generates:
- topic structure
- page relevance requirements
- image requirements
- exact narration scripts
- deterministic filenames
- factual QA notes

## Step 3: Kimi Renders Assets

Kimi creates:
- page images
- cover images
- page narration audio
- optional word-level audio if requested

Kimi must:
- follow Codex prompts exactly
- preserve fiction continuity
- avoid embedded text
- avoid watermarks
- avoid extra story details
- match narration to app text exactly

Kimi must never:
- rewrite page text
- paraphrase narration
- change character clothing
- change character appearance
- change setting/weather/lighting unless Codex text requires it
- add unrequested characters or props

## Step 4: Codex Validates Rendered Assets

Codex checks:
- image/text alignment
- narration/text exact match
- missing files
- filename match
- fiction character continuity
- fiction environment continuity
- fiction story sequence
- nonfiction page relevance
- nonfiction educational accuracy
- no embedded text conflicts
- no broken media paths

Failed pages/books stay inactive and receive regeneration reasons.

## Step 5: Activation

Only approved books become active.

Activation requires:
- approved text QA
- approved asset QA
- approved narration QA
- approved continuity QA for fiction
- required cover/page/narration files present
- no blocked QA status

Draft books remain inactive until this pipeline passes.

## Production Batch Loop

Each batch follows:
1. generate
2. quality check
3. revise
4. render assets
5. validate
6. activate approved books
7. document remaining gaps

Do not expand the library by quantity alone. Quality, continuity, literacy progression, and teacher trust are the controlling requirements.
