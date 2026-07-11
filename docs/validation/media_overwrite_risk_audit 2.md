# Media Overwrite Risk Audit

Date: 2026-07-10T01:53:19.645Z

This guardrail checks current Git changes under:

- public/images
- public/audio
- public/guided-reading
- public/media

## Summary

| Metric | Count |
| --- | --- |
| Changed paths in live media roots | 20 |
| Changed media files | 20 |
| Deleted paths | 0 |
| Temp/source paths | 0 |
| Non-webp image paths changed | 0 |
| Warnings | 21 |
| Failures | 0 |

## Result

PASS

## Warnings

- Live media folder changes detected. Review before committing to avoid overwriting approved media.
- added: public/audio/music/dino-loop 2.mp3
- added: public/audio/music/meadow-loop 2.mp3
- added: public/audio/music/moonwood-loop 2.mp3
- added: public/images/learn-games/art/star-gallery.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-curator-v1.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-dino-arena-v3.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-dino-bg-v1.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-dino-bg-v2.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-dino-courier-v1.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-guide-dino-v2.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-guide-meadow-v2.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-guide-moonwood-v2.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-meadow-arena-v3.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-meadow-bg-v1.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-meadow-bg-v2.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-meadow-courier-v1.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-moonwood-arena-v3.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-moonwood-bg-v1.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-moonwood-bg-v2.webp
- added: public/images/learn-games/ps1-arcade/star-gallery-moonwood-courier-v1.webp

## Failures

_None._

## Changed Live Media Paths

| Status | Path | Kind | Risk |
| --- | --- | --- | --- |
| added | public/audio/music/dino-loop 2.mp3 | media | review |
| added | public/audio/music/meadow-loop 2.mp3 | media | review |
| added | public/audio/music/moonwood-loop 2.mp3 | media | review |
| added | public/images/learn-games/art/star-gallery.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-curator-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-dino-arena-v3.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-dino-bg-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-dino-bg-v2.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-dino-courier-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-guide-dino-v2.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-guide-meadow-v2.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-guide-moonwood-v2.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-meadow-arena-v3.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-meadow-bg-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-meadow-bg-v2.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-meadow-courier-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-moonwood-arena-v3.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-moonwood-bg-v1.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-moonwood-bg-v2.webp | media | review |
| added | public/images/learn-games/ps1-arcade/star-gallery-moonwood-courier-v1.webp | media | review |
