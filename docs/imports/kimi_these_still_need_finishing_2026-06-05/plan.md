# Plan: HFW Variation Media Generation

## Overview
- 1,173 must-have HFW scene images (WEBP 1024x1024)
- 177 optional buffer HFW scene images
- 1 audio file (MP3)
- production_manifest.json

## Stage 1: Parse and Prepare
- Extract all JSON tasks from the markdown file
- Organize by skill_id (hfw_1_25, hfw_26_50, hfw_51_75, hfw_76_100)
- Create batch manifests for parallel processing
- Set up directory structure

## Stage 2: Generate Audio
- Generate the zip.mp3 audio file (simple, single file)

## Stage 3: Generate Images (Parallel Batches)
- Use multiple sub-agents in parallel to generate images in batches
- Each agent handles a chunk of images
- Images generated as PNG then converted to WEBP 1024x1024
- Organize by skill_id folders

## Stage 4: Validate and Create Manifest
- Verify all generated files
- Create production_manifest.json with all asset records

## Execution Strategy
- Stage 1: Orchestrator (Python parsing)
- Stage 2: Single audio agent (parallel with Stage 3)
- Stage 3: Multiple image generation agents (20+ agents in batches of ~60 images each)
- Stage 4: Orchestrator (validation + manifest creation)
