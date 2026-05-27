# Meadow Pals / Guided Reading Missing Word Audio Import Report

Date: 2026-05-28

## Source

- Drop folder: `/Users/benjaminbowler/Desktop/public`
- Zip inspected: `/Users/benjaminbowler/Desktop/public/Missing Words.zip`
- Loose duplicate audio inspected: `/Users/benjaminbowler/Desktop/public/Kimi media Req after audit/vocabulary/audio/`

## Import Result

The app resolves guided-reading tap-to-hear word audio through approved audio preferences. The imported files were placed in both the shared vocabulary audio bank and the guided-reading word-audio folder so they are reachable by browser path and by manifest preference.

| Word | Source | Vocabulary Path | Guided Reading Path | Status |
| --- | --- | --- | --- | --- |
| germs | `Missing Words.zip/germs.mp3` | `/media/vocabulary/audio/germs.mp3` | `/guided-reading/audio/words/germs.mp3` | imported and approved |
| precious | `Missing Words.zip/precious.mp3` | `/media/vocabulary/audio/precious.mp3` | `/guided-reading/audio/words/precious.mp3` | imported and approved |
| rivers | `Missing Words.zip/rivers.mp3` | `/media/vocabulary/audio/rivers.mp3` | `/guided-reading/audio/words/rivers.mp3` | imported and approved |
| roads | `Missing Words.zip/roads.mp3` | `/media/vocabulary/audio/roads.mp3` | `/guided-reading/audio/words/roads.mp3` | imported and approved |
| stronger | `Missing Words.zip/stronger.mp3` | `/media/vocabulary/audio/stronger.mp3` | `/guided-reading/audio/words/stronger.mp3` | imported and approved |

## Skipped Files

- `crawl.mp3` from `Missing Words.zip` was skipped because `/media/vocabulary/audio/crawl.mp3` already exists and is already approved by the current vocabulary audio manifest.
- 24 loose files under `Kimi media Req after audit/vocabulary/audio/` were skipped because byte-for-byte identical files already exist in `public/media/vocabulary/audio/`.

Skipped duplicate loose files:

`a-blanket-fort`, `bellshell`, `burn`, `cute`, `day`, `dishfish`, `five`, `fog`, `game`, `hear`, `june`, `kingring`, `loud`, `name`, `pete`, `quietly`, `shine`, `silent`, `teacher`, `theme`, `these`, `tune`, `turn`, `win`.

## Manifest Updates

Updated `src/data/audioPreferenceManifest.js` with approved exact-word mappings for:

- germs
- precious
- rivers
- roads
- stronger

Each points to the shared vocabulary audio path, while the matching guided-reading fallback files also exist.

## Verification

The audio resolver now returns existing approved files for the imported words:

| Word | Approved Path |
| --- | --- |
| germs | `/media/vocabulary/audio/germs.mp3` |
| precious | `/media/vocabulary/audio/precious.mp3` |
| rivers | `/media/vocabulary/audio/rivers.mp3` |
| roads | `/media/vocabulary/audio/roads.mp3` |
| stronger | `/media/vocabulary/audio/stronger.mp3` |

