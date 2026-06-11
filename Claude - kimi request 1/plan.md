# Learn Area AAA Polish — Media Generation Plan

## Overview
Generate 18 images + 8 audio files for children's educational app "Learn Area".

## Stage 1 — Setup
- Check for Phinny reference image (`phinny-waving.png`)
- Create output directories: `art/`, `home/`, `audio/ui/`

## Stage 2 — Parallel Image Generation (Batch 1)
- 10 game card artwork images (16:9, 800x450, opaque)
- 3 student home card art images (3:2, 600x400, opaque)
- 5 mascot poses (1:1, 1024x1024, transparent) — needs reference image

## Stage 3 — Parallel Audio Generation
- 8 UI sound effects (MP3, various durations)

## Stage 4 — Validation & Delivery
- Verify all files exist with correct names
- Confirm file sizes and formats
- Deliver final file paths

## Output Structure
```
/mnt/agents/output/
├── art/                    (10 game card PNGs)
├── home/                   (3 home card PNGs)
├── phinny/                 (5 mascot PNGs, transparent)
└── audio/ui/               (8 MP3 sound effects)
```
