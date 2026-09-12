---
name: media-production
description: Generate, replace or verify LiteracyPath images, narration, phoneme cues and media mappings. Use for missing, mismatched or silent assets; not for CSS spacing or text-only edits.
---

# Media production and integrity

Identify the exact runtime selection path and the text, word or scene the asset
must represent. Read [assessment media evidence](../../../docs/design/ASSESSMENT_MEDIA_EVIDENCE.md)
for assessment assets, [phoneme recording](../../../docs/audio/PHONEME_RECORDING_STANDARD.md)
for isolated sounds, or the relevant [story standard](../../../docs/content/STORY_AND_STORY_QUEST_BIBLE.md)
and canon for narrative media. Use the current generator/manifest, not a second
registry or filename guess.

Inspect source art and preserve world-qualified character identity. Generate
only the requested assets and required variants. Each scene assignment must
match its exact text; reuse requires an appropriate existing asset and must
not replace a request for distinct outputs. Preserve rights and provenance.

For images, decode the actual file, inspect dimensions/alpha where required,
and review its meaning and legibility at the displayed size. Exercise missing
and failed evidence images: they must not produce a scored text-only guess.

For audio, verify resolution, decoding, signal across the spoken segment,
truncation and clipping; an HTTP 200, nonzero duration or isolated peak does
not establish audible speech. Listen against the exact text and role. Test
replay, interruption and device autoplay behavior. When replacing cached audio,
verify the runtime requests the new bytes. File checks cannot certify a phoneme.

Run the applicable `image-integrity` and `audio-integrity` profiles from
[task gates](../../../docs/verification/TASK_GATES.md), then the surface-specific
checks. The audio profile covers assessment recordings; use the actual changed
files and generator tests for other audio families. Preserve
[pass-by-exception review](../../../docs/brain/decisions/2026-08-21-continuous-qa-pass-by-exception.md):
do not invent a sign-off queue or bypass a reported quarantine. Record actual
visual/listening results separately from automated integrity checks.
