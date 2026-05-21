# Audio Source Research Notes

## Current Manifest Shape

- `src/data/audioManifest.js` contains deduped text entries keyed by stable hashes.
- Choice audio is played from `public/audio/choices/<hash>.mp3` before falling back to the older manifest path and then browser speech synthesis.
- The first OpenAI TTS pilot already filled the top 100 reusable choice texts, so the Commons proof of concept targets the next most reusable missing single-word choices.

## Sources Considered

### Wikimedia Commons / Wiktionary / Lingua Libre

Wiktionary pronunciation files are stored on Wikimedia Commons, and Commons exposes per-file license and attribution metadata. Lingua Libre recordings are also uploaded to Commons and are generally listed as CC BY-SA 4.0.

Pros:
- Human recordings.
- Per-file metadata can be captured.
- Reuse is often allowed, including school use, when license terms are followed.

Risks:
- License varies by file; many older files are CC BY-SA 3.0 or GFDL.
- Attribution and share-alike requirements may complicate bundled commercial distribution.
- Pronunciation coverage is inconsistent, and voice/quality varies.

Commercial/school-use confidence: possible but not automatic. Treat each file as requiring attribution review before production.

### Dictionary API / Hosted Dictionary MP3 URLs

DictionaryAPI.dev returns phonetic audio URLs, often from hosted dictionary audio such as `ssl.gstatic.com`.

Pros:
- Easy API lookup.
- MP3 URLs are common.

Risks:
- Audio reuse license is unclear from the API page.
- The API may be free to call, but that does not clearly grant redistribution rights for downloaded MP3s.

Commercial/school-use confidence: uncertain; not recommended for bundled production assets without explicit permission.

### Merriam-Webster / Oxford / Similar Dictionary Audio

These sources provide high-quality pronunciation audio, but licensing is controlled by the provider. Merriam-Webster states commercial apps or higher usage require licensing, and Oxford provides pronunciation data as a commercial product.

Commercial/school-use confidence: good only with a paid or explicit license.

## Prototype Recommendation

Existing public human pronunciation audio is useful for a small number of common words, but it is not ideal as the primary app audio source because licensing, attribution, coverage, and consistency vary. For a classroom app, OpenAI TTS or local human recording is more predictable for full coverage. Commons audio can be a supplemental source when attribution metadata is retained and licensing is reviewed file by file.

## Proof of Concept

The prototype importer is `tools/importPublicWordAudioPilot.js`.

- It targets 20 common, reusable answer-choice texts that do not already have local MP3 files.
- It tries Wikimedia Commons first, using exact `En-us-word.ogg` pronunciation files and their MP3 transcodes.
- If Commons cannot provide enough files, it tries DictionaryAPI.dev phonetic audio as a licensing-uncertain fallback.
- It writes audio to `public/audio/choices/<manifest-hash>.mp3`, which preserves the current playback order.
- It writes attribution/source metadata to `public/audio/choices/public-word-audio-pilot.json`.

The first Commons-only pass found only 10 usable files before exhausting likely candidates and hitting some transcode rate limits. That result is part of the finding: Commons is promising for individual words, but not reliable enough as the only source for this app.
