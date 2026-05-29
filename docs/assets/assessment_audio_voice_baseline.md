# Assessment Audio Voice Baseline

Generated: 2026-05-29T04:35:39.128Z

## Target Voice

- Neutral soft American female voice
- American English
- Calm, warm, clear, teacher-like
- Child-friendly but not cartoonish
- Consistent pacing and volume
- Clean generated-audio quality
- No background noise, music, sound effects, character acting, clipping, or muffling

## Discovered Config

| Field | Value |
| --- | --- |
| Provider | unknown |
| Voice ID | Not formally recorded in repo |
| Model ID | Not formally recorded in repo |
| Standard root | /audio/child-mode/clean-human/ |
| Import/source convention | Kimi/Pack 6 clean-human assessment audio where available |
| Generation script found | `tools/generateAudioBatch.js` defaults to OpenAI TTS env vars, but current approved assessment standard is represented by imported clean-human files. |

## Baseline Files

| Path | Expected script | Duration ms | Sample rate | Bitrate | Channels | Status | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| /audio/child-mode/clean-human/hfw/a.mp3 | a | 1008 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/a.mp3 | a | 1008 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/a.mp3 | a | 1008 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/all.mp3 | all | 1080 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/all.mp3 | all | 1080 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/all.mp3 | all | 1080 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/and.mp3 | and | 1152 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/and.mp3 | and | 1152 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/and.mp3 | and | 1152 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |
| /audio/child-mode/clean-human/hfw/at.mp3 | at | 1080 | 24000 | 64000 | 1 | approved | Approved clean-human path used by assessment questions. |

## Notes

No formal provider voice ID was found for the imported clean-human Kimi/Pack 6 files. The baseline therefore uses approved files under `/audio/child-mode/clean-human/` that are already selected by `src/data/audioPreferenceManifest.js`.
