# Plan: Guided Reading Word-Tap Audio (308 words)

## Goal
Generate 308 individual MP3 audio files of single words for a children's guided reading app. Each word is spoken naturally by a warm female narrator ("gold voice"). Save to `public/audio/child-mode/clean-human/words/`.

## Voice Selection
Use ElevenLabs voice **Dorothy (ThT5KcBeYPX3keUqHPh)** — warm, expressive female voice ideal for children's storytelling. Falls back to **Rachel (21m00Tcm4TlvDq8ikWAM)** if needed.

## Execution Strategy
Split 308 words into 10 parallel batches of ~30-31 words each. Each batch processed by a dedicated sub-agent.

## Stages

### Stage 1 — Parallel Audio Generation (10 sub-agents)
Each sub-agent receives:
- A chunk of 30-31 words with their exact filenames
- The target voice ID
- Output directory path
- Rules: natural pronunciation, no SSML, one unhurried take per file

Batches:
- Batch 1: according through apples (words 1-10)
- Batch 2: aside through burrows (words 11-20)
- Batch 3: cage through convinced (words 21-30)
- Batch 4: corners through gripped (words 31-40)
- Batch 5: ha through likes (words 41-50)
- Batch 6: logs through performance (words 51-60)
- Batch 7: pick through spirit (words 61-70)
- Batch 8: spirits through swish (words 71-80)
- Batch 9: taking through twitch (words 81-90)
- Batch 10: unhappy through zoom + optional numbers (words 91-308)

Wait, let me recalculate with actual word counts...

### Stage 2 — Verification
Count generated files and confirm all 308 exist.

### Stage 3 — Package
Deliver the complete `public/audio/child-mode/clean-human/words/` folder.
