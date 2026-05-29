# Assessment Audio Audit Method

Generated: 2026-05-29T04:35:39.128Z

## What The Tool Checks

- All audio references in the assessment question banks loaded by `tools/phonicsRuntimeUtils.js`
- Physical audio files under `public/audio` and `public/media`, excluding Guided Reading folders
- Whether referenced files exist
- Whether paths are approved by `src/data/audioPreferenceManifest.js`
- Whether paths use the current clean-human standard root
- Whether paths are deprecated, review-needed, old/original, Kimi-suffixed alternates, or choice-audio legacy files
- Basic file metadata from macOS `afinfo`: duration, sample rate, bitrate, channel count, and file size

## What The Tool Cannot Prove

Code cannot reliably identify speaker voice by listening. Files that are not clearly approved clean-human standard audio are marked for replacement or human review instead of being falsely marked clean.

## Status Rules

- `KEEP_STANDARD_VOICE`: approved clean-human path with no detected issue
- `REPLACE_OLD_ORIGINAL`: older child-mode, choice-audio, or deprecated audio path
- `REPLACE_WRONG_VOICE`: Kimi alternate/review path or known nonstandard voice signal
- `REPLACE_LOW_QUALITY`: metadata suggests clipping, very short file, low sample rate, or tiny file
- `REPLACE_SCRIPT_MISMATCH`: missing script or suspicious duration/script mismatch
- `MISSING_AUDIO`: referenced path does not exist
- `BROKEN_REFERENCE`: reference cannot resolve to a public file
- `NEEDS_HUMAN_REVIEW`: exists, but voice/script cannot be proven standard by metadata

## Repeatable Command

```bash
node tools/auditAssessmentAudio.js
```
