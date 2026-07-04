# Media Overwrite Risk Audit

Date: 2026-07-04T08:08:01.423Z

This guardrail checks current Git changes under:

- public/images
- public/audio
- public/guided-reading
- public/media

## Summary

| Metric | Count |
| --- | --- |
| Changed paths in live media roots | 1 |
| Changed media files | 1 |
| Deleted paths | 1 |
| Temp/source paths | 1 |
| Non-webp image paths changed | 0 |
| Warnings | 2 |
| Failures | 2 |

## Result

FAIL

## Warnings

- Live media folder changes detected. Review before committing to avoid overwriting approved media.
- deleted: public/audio/child-mode/clean-human/words/source.mp3

## Failures

- Deleted live media paths detected: 1.
- Temp/source files detected in live media folders: 1.

## Changed Live Media Paths

| Status | Path | Kind | Risk |
| --- | --- | --- | --- |
| deleted | public/audio/child-mode/clean-human/words/source.mp3 | media | deleted, temp/source |
