# Execution Plan — Audio Re-record + Literacy Pals Brand Pack

## Context
- Workspace is fresh (no prior files). Reference images for characters are not accessible.
- Available voices are Mandarin Chinese only — no British English female voice available.
- 21 sentences from prior request are not available in workspace.

## Stage 1 — Audio Generation (parallel batches)
- Skill: N/A (direct tool usage)
- Generate 8 instruction audio files → public/audio/learn-games/instructions/
- Generate 2 word audio files → public/audio/child-mode/words/
- Note: 21 sentences pending user input (not in workspace). Will ask.
- Voice: Use best available warm female voice (NLl76XZRVj1RVeXptX3h) and note limitation.
- After generation: listen to 3 random files for quality check.

## Stage 2 — Image Generation (parallel batches)
- Skill: N/A (direct tool usage)
- Generate 2 logo files → public/images/pals/
- Generate 12 pose pack files → public/images/pals/poses/
- Generate 3 sprite sheet files → public/images/pals/sprites/
- No reference images available — generate based on descriptions, note character consistency limitation.
- All transparent PNGs as specified.

## Stage 3 — Delivery
- Verify all generated files exist
- Provide file manifest
- Deploy if appropriate
