# Kimi New Vocabulary Media Import Audit

Generated: 2026-06-04

## Source

- `/Users/benjaminbowler/Desktop/public/Kimi new Vocab media /vocabulary_media`
- CSV files: 20 total (19 chunk files plus `full_media_plan.csv`)

## Import Result

- Source JPG images: 723
- Converted image files added: 723
- Image files already present/skipped: 0
- Source MP3 audio files: 352
- Audio files copied: 342
- Audio files already present/skipped: 10
- Generated manifest entries: 728
- Conversion target: `/public/media/vocabulary/images/*.webp`
- Audio target: `/public/media/vocabulary/audio/*.mp3`
- Manifest target: `src/data/generated/k3VocabularyMediaManifest.generated.js`

## Pack Pairing

- Words with image and audio in this pack: 347
- Words with image only in this pack: 376
- Words with audio only in this pack: 5
- Audio-only words: hang, screw, song, twin, wolf

## Existing Audio Preserved

- bake: kept existing /media/vocabulary/audio/bake.mp3
- buses: kept existing /media/vocabulary/audio/buses.mp3
- dirt: kept existing /media/vocabulary/audio/dirt.mp3
- feed: kept existing /media/vocabulary/audio/feed.mp3
- harm: kept existing /media/vocabulary/audio/harm.mp3
- helper: kept existing /media/vocabulary/audio/helper.mp3
- rich: kept existing /media/vocabulary/audio/rich.mp3
- save: kept existing /media/vocabulary/audio/save.mp3
- share: kept existing /media/vocabulary/audio/share.mp3
- visit: kept existing /media/vocabulary/audio/visit.mp3

## Verification

- Every imported image has a generated WebP file in the app vocabulary image folder.
- Every imported audio word resolves to an MP3 in the app vocabulary audio folder, either copied now or already present.
- The generated manifest includes all imported words so runtime media resolution can use the files directly.
