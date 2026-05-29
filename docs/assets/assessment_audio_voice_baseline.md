# Assessment Audio Voice Baseline

Generated: 2026-05-29T04:46:58.847Z

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

| Category | Path | Expected script | Duration ms | Sample rate | Bitrate | Channels | Status | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hfw | /audio/child-mode/clean-human/hfw/a.mp3 | a | 1008 | 24000 | 64000 | 1 | approved | Approved clean-human hfw baseline. |
| hfw | /audio/child-mode/clean-human/hfw/all.mp3 | all | 1080 | 24000 | 64000 | 1 | approved | Approved clean-human hfw baseline. |
| hfw | /audio/child-mode/clean-human/hfw/and.mp3 | and | 1152 | 24000 | 64000 | 1 | approved | Approved clean-human hfw baseline. |
| word | /audio/child-mode/clean-human/words/chip.mp3 | chip | 1152 | 24000 | 64000 | 1 | approved | Approved clean-human word baseline. |
| word | /audio/child-mode/clean-human/words/ant.mp3 | ant | 1176 | 24000 | 64000 | 1 | approved | Approved clean-human word baseline. |
| prompt | /audio/child-mode/phrases/excellent-listening.mp3 | excellent listening | 1680 | 24000 | 64000 | 1 | approved | Approved prompt audio baseline. This path is not clean-human and should be regenerated if prompt voice consistency is required. |
| prompt | /audio/child-mode/phrases/great-job.mp3 | great job | 1272 | 24000 | 64000 | 1 | approved | Approved prompt audio baseline. This path is not clean-human and should be regenerated if prompt voice consistency is required. |
| phonics | /audio/child-mode/clean-human/words/apple.mp3 | apple | 1080 | 24000 | 64000 | 1 | approved | Approved phonics baseline. |
| phonics | /audio/child-mode/clean-human/words/bag.mp3 | bag | 1080 | 24000 | 64000 | 1 | approved | Approved phonics baseline. |
| phonics | /audio/child-mode/clean-human/words/ball.mp3 | ball | 1080 | 24000 | 64000 | 1 | approved | Approved phonics baseline. |

## Notes

No formal provider voice ID was found for the imported clean-human Kimi/Pack 6 files. The baseline therefore uses approved files selected by `src/data/audioPreferenceManifest.js`. HFW, word, and phonics examples come from the clean-human standard root where available. Prompt-audio examples are included from currently approved prompt paths; they are marked for future review if they are not yet clean-human.
