# Media Overwrite Risk Audit

Date: 2026-07-08T12:15:49.993Z

This guardrail checks current Git changes under:

- public/images
- public/audio
- public/guided-reading
- public/media

## Summary

| Metric | Count |
| --- | --- |
| Changed paths in live media roots | 5 |
| Changed media files | 5 |
| Deleted paths | 0 |
| Temp/source paths | 0 |
| Non-webp image paths changed | 0 |
| Warnings | 6 |
| Failures | 0 |

## Result

PASS

## Warnings

- Live media folder changes detected. Review before committing to avoid overwriting approved media.
- added: public/images/learn-games/ps1-arcade/sound-safari-dino-bg-v1.webp
- added: public/images/learn-games/ps1-arcade/sound-safari-guide-v1.webp
- added: public/images/learn-games/ps1-arcade/sound-safari-meadow-bg-v1.webp
- added: public/images/learn-games/ps1-arcade/sound-safari-moonwood-bg-v1.webp
- added: public/images/learn-games/ps1-arcade/sound-safari-net-v1.webp

## Failures

_None._

## Changed Live Media Paths

| Status | Path | Kind | Risk |
| --- | --- | --- | --- |
| added | public/images/learn-games/ps1-arcade/sound-safari-dino-bg-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/sound-safari-guide-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/sound-safari-meadow-bg-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/sound-safari-moonwood-bg-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/sound-safari-net-v1.webp | media | review |
