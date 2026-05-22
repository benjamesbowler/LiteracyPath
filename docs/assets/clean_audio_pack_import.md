# Clean Audio Pack Import Guide

Expected clean-human audio root:

```text
public/audio/child-mode/clean-human/
  words/
  hfw/
  phrases/
```

Naming convention:
- Lowercase filenames.
- Hyphenate multiword phrases, for example `listen-and-find.mp3`.
- Each MP3 should contain only the exact word or phrase represented by the filename.
- No browser TTS, generated sentence audio, long silence, clipped endings, background noise, or strong synthetic intonation.

Manifest process:
1. Import files without deleting older audio.
2. Compare filenames against `docs/assets/complete_audio_replacement_request.md`.
3. Update `src/data/audioPreferenceManifest.js` with `preferredAudioPath` pointing to the clean-human file.
4. Set `status: "approved"` only after human review.
5. Move any replaced Pack/Kimi/legacy variants into `deprecatedAudioPaths` or `reviewNeededPaths`.
6. Run `npm run build`, `node tools/auditQuestionBank.js`, and `node tools/checkRuntimeQuestionCoverage.js`.
