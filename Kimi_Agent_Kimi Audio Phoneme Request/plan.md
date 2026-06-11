# Audio Generation Plan — Letter Sounds + Word Re-records

## Overview
Generate 72 MP3 audio files for a children's phonics app using a warm, clear British English female narrator.

## Voice Configuration
- Use generate_speech with voice_id NLl76XZRVj1RVeXptX3h (warm, friendly female)
- Prompt override: "Warm, clear British English female narrator, natural pace for young children, friendly but not babyish."

## Stage 1 — Generate 31 Phoneme Sound Files
Output: `public/audio/phonemes/`
- 26 consonant + 5 vowel phonemes
- Ultra-short: just the pure sound, no label, no example word spoken
- Consonants crisp, minimal schwa ("b" not "buh")

## Stage 2 — Generate 41 Word Re-record Files
Output: `public/audio/child-mode/clean-human/words/`
- Single word per file, natural pronunciation
- Same voice, same style

## Stage 3 — Verification
- Count all files in both directories
- Report any missing files

## Parallelization
Split into 6 parallel batches:
- 3 batches for phonemes (10-11 files each)
- 3 batches for words (13-14 files each)
