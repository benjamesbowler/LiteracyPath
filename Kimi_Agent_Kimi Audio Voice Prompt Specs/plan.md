# Plan: Generate Kimi Audio Files (356 MP3s)

## Overview
Generate all voice recordings for the Kimi children's app using a single British English female narrator (Alice - Clear, Engaging Educator).

## Voice Spec
- Voice ID: `Xb7hH8MSUJpSbSDYk0k2` (Alice)
- Model: eleven_multilingual_v2
- Warm, clear British English female, natural pace for young children
- Plain MP3, no music, no effects

## Directory Structure
```
public/audio/ui/voice/          (10 files)
public/audio/child-mode/words/  (333 files)
public/audio/learn-games/sentences/ (13 files)
```

## Execution Strategy
- Total: 356 files
- Delegate to subagents in parallel batches
- Each subagent handles ~50-60 files
- Stage 1: UI voice prompts (10 files) + game sentences (13 files) = 23 files
- Stage 2: Word recordings split into 6 batches of ~55-56 words each
- Stage 3: Verify all files generated successfully
