# Media Overwrite Risk Audit

Date: 2026-07-04T12:44:14.110Z

This guardrail checks current Git changes under:

- public/images
- public/audio
- public/guided-reading
- public/media

## Summary

| Metric | Count |
| --- | --- |
| Changed paths in live media roots | 7 |
| Changed media files | 7 |
| Deleted paths | 0 |
| Temp/source paths | 0 |
| Non-webp image paths changed | 0 |
| Warnings | 8 |
| Failures | 0 |

## Result

PASS

## Warnings

- Live media folder changes detected. Review before committing to avoid overwriting approved media.
- modified: public/audio/child-mode/clean-human/words/am.mp3
- modified: public/audio/child-mode/clean-human/words/at.mp3
- modified: public/audio/child-mode/clean-human/words/ax.mp3
- modified: public/audio/child-mode/clean-human/words/if.mp3
- modified: public/audio/child-mode/clean-human/words/is.mp3
- modified: public/audio/child-mode/clean-human/words/it.mp3
- modified: public/audio/child-mode/clean-human/words/of.mp3

## Failures

_None._

## Changed Live Media Paths

| Status | Path | Kind | Risk |
| --- | --- | --- | --- |
| modified | public/audio/child-mode/clean-human/words/am.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/words/at.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/words/ax.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/words/if.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/words/is.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/words/it.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/words/of.mp3 | media | review |
