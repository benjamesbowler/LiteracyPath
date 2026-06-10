# Media Overwrite Risk Audit

Date: 2026-06-10T06:35:06.803Z

This guardrail checks current Git changes under:

- public/images
- public/audio
- public/guided-reading
- public/media

## Summary

| Metric | Count |
| --- | --- |
| Changed paths in live media roots | 28 |
| Changed media files | 28 |
| Deleted paths | 0 |
| Temp/source paths | 0 |
| Non-webp image paths changed | 0 |
| Warnings | 30 |
| Failures | 0 |

## Result

PASS

## Warnings

- Live media folder changes detected. Review before committing to avoid overwriting approved media.
- added: public/audio/child-mode/clean-human/graphemes/consonants/k.mp3
- added: public/audio/child-mode/clean-human/graphemes/consonants/q.mp3
- added: public/audio/child-mode/clean-human/graphemes/consonants/x.mp3
- added: public/audio/child-mode/clean-human/words/clock.mp3
- added: public/audio/child-mode/clean-human/words/men.mp3
- added: public/audio/child-mode/clean-human/words/stamp.mp3
- added: public/audio/child-mode/phrases/learn-six-letters-first.mp3
- added: public/audio/child-mode/phrases/now-you-try.mp3
- added: public/audio/child-mode/phrases/start-at-the-top.mp3
- added: public/audio/child-mode/phrases/watch-me-first.mp3
- added: public/audio/child-mode/phrases/watch-the-magic.mp3
- added: public/audio/learn-games/instructions/build-the-word-you-hear.mp3
- added: public/audio/learn-games/instructions/find-the-matching-sight-words.mp3
- added: public/audio/learn-games/instructions/find-the-rhyming-words.mp3
- added: public/audio/learn-games/instructions/hop-on-the-next-word.mp3
- added: public/audio/learn-games/instructions/listen-then-tap-the-matching-word.mp3
- added: public/audio/learn-games/instructions/load-the-train-in-sound-order.mp3
- added: public/audio/learn-games/instructions/pick-a-beginning-sound.mp3
- added: public/audio/learn-games/instructions/read-the-sentence-and-choose.mp3
- added: public/audio/learn-games/instructions/touch-each-sound-then-blend-the-word.mp3
- added: public/audio/learn-games/sentences/i-see-a-big-dog.mp3
- added: public/audio/learn-games/sentences/she-has-a-red-hat.mp3
- added: public/audio/learn-games/sentences/the-cat-sat-on-the-mat.mp3
- added: public/audio/learn-games/sentences/the-children-played-happily-outside.mp3
- added: public/audio/learn-games/sentences/the-little-bird-can-fly.mp3
- added: public/audio/learn-games/sentences/they-went-to-the-park.mp3
- added: public/audio/learn-games/sentences/we-can-run-and-play.mp3
- added: public/audio/learn-games/sentences/which-book-would-you-like-to-read.mp3
- 28 media files changed. This should be a dedicated media import commit.

## Failures

_None._

## Changed Live Media Paths

| Status | Path | Kind | Risk |
| --- | --- | --- | --- |
| added | public/audio/child-mode/clean-human/graphemes/consonants/k.mp3 | media | review |
| added | public/audio/child-mode/clean-human/graphemes/consonants/q.mp3 | media | review |
| added | public/audio/child-mode/clean-human/graphemes/consonants/x.mp3 | media | review |
| added | public/audio/child-mode/clean-human/words/clock.mp3 | media | review |
| added | public/audio/child-mode/clean-human/words/men.mp3 | media | review |
| added | public/audio/child-mode/clean-human/words/stamp.mp3 | media | review |
| added | public/audio/child-mode/phrases/learn-six-letters-first.mp3 | media | review |
| added | public/audio/child-mode/phrases/now-you-try.mp3 | media | review |
| added | public/audio/child-mode/phrases/start-at-the-top.mp3 | media | review |
| added | public/audio/child-mode/phrases/watch-me-first.mp3 | media | review |
| added | public/audio/child-mode/phrases/watch-the-magic.mp3 | media | review |
| added | public/audio/learn-games/instructions/build-the-word-you-hear.mp3 | media | review |
| added | public/audio/learn-games/instructions/find-the-matching-sight-words.mp3 | media | review |
| added | public/audio/learn-games/instructions/find-the-rhyming-words.mp3 | media | review |
| added | public/audio/learn-games/instructions/hop-on-the-next-word.mp3 | media | review |
| added | public/audio/learn-games/instructions/listen-then-tap-the-matching-word.mp3 | media | review |
| added | public/audio/learn-games/instructions/load-the-train-in-sound-order.mp3 | media | review |
| added | public/audio/learn-games/instructions/pick-a-beginning-sound.mp3 | media | review |
| added | public/audio/learn-games/instructions/read-the-sentence-and-choose.mp3 | media | review |
| added | public/audio/learn-games/instructions/touch-each-sound-then-blend-the-word.mp3 | media | review |
| added | public/audio/learn-games/sentences/i-see-a-big-dog.mp3 | media | review |
| added | public/audio/learn-games/sentences/she-has-a-red-hat.mp3 | media | review |
| added | public/audio/learn-games/sentences/the-cat-sat-on-the-mat.mp3 | media | review |
| added | public/audio/learn-games/sentences/the-children-played-happily-outside.mp3 | media | review |
| added | public/audio/learn-games/sentences/the-little-bird-can-fly.mp3 | media | review |
| added | public/audio/learn-games/sentences/they-went-to-the-park.mp3 | media | review |
| added | public/audio/learn-games/sentences/we-can-run-and-play.mp3 | media | review |
| added | public/audio/learn-games/sentences/which-book-would-you-like-to-read.mp3 | media | review |
