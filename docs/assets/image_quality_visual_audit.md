# Image Quality Visual Audit

Generated: 2026-05-25T01:03:40.876Z

This audit focuses on assessment media. It uses safe static heuristics only: filenames/paths and exact-file hash comparisons. It does not delete or replace assets automatically.

## Summary

- Public assessment images scanned: 821
- Active image-backed assessment mappings scanned: 1632
- Likely rainbow/over-stylized active mappings: 0
- Known unsuitable assessment assets blocked/requested: 3
- Known unsuitable assets still active: 0
- Excluded weird/unusual targets still active: 0
- Rainbow/path warnings in public assets: 0
- Known semantic conflict failures: 0
- Audio replacement requests: 0

## Likely Rainbow Or Over-Stylized Active Mappings

_None._

## Known Unsuitable Assessment Assets

| skill | word | image path | reason |
| --- | --- | --- | --- |
| initial_sounds | acorn | /media/initial-sounds/images/a/acorn.webp | Manual review: rainbow-colored cap/character styling is too stylized for an ordinary acorn assessment image. |
| initial_sounds | nut | /media/initial-sounds/images/n/nut.webp | Manual review: rainbow-colored character styling is too stylized and too confusable for a generic nut assessment image. |
| initial_sounds | nut | /images/child-mode/short-u/nut.png | Manual review: image is visually an acorn, not a generic nut, so it is blocked from active assessment use. |

## Known Unsuitable Images Still Active

_None._

## Rainbow/Colorful Filename Warnings In Public Assets

_None._

## Known Semantic Conflict Checks

| word A | word B | status | detail |
| --- | --- | --- | --- |
| acorn | nut | not active | No active image-backed items found for one or both words. |
| sock | duck | pass | No active shared image path/hash detected. |
| seed | bed | pass | No active shared image path/hash detected. |
| rain | pan | pass | No active shared image path/hash detected. |

## Excluded Weird Or Unusual Targets

### Active Failures

_None._

### Blocked/Inactive

| skill | question id | target word | qa status | reason |
| --- | --- | --- | --- | --- |
| initial_sounds | fs_o_opera_l2 | opera | excluded_unsuitable_word | Opera is culturally specific and too hard to image clearly for early Initial Sounds assessment. |
| initial_sounds | fs_o_observer_l2 | observer | excluded_unsuitable_word | Observer is abstract/role-based and hard to image clearly for early Initial Sounds assessment. |
| initial_sounds | fs_q_quartz_l2 | quartz | excluded_unsuitable_word | Quartz is obscure for K-2 Initial Sounds assessment and should not be active without explicit vocabulary teaching. |
| initial_sounds | fs_q_quiver_l2 | quiver | excluded_unsuitable_word | Quiver is potentially ambiguous and not a strong K-2 Initial Sounds assessment target. |
| initial_sounds | fs_q_quickstep_l2 | quickstep | excluded_unsuitable_word | Quickstep is obscure/culturally specific and not a strong K-2 Initial Sounds assessment target. |
| initial_sounds | fs_u_upbeat_l2 | upbeat | excluded_unsuitable_word | Upbeat is abstract and hard to image clearly for early Initial Sounds assessment. |
| initial_sounds | fs_u_uplift_l2 | uplift | excluded_unsuitable_word | Uplift is abstract and hard to image clearly for early Initial Sounds assessment. |
| initial_sounds | fs_u_urban-garden_l2 | urban garden | excluded_unsuitable_word | Urban garden is a phrase with a less clear single target object for early Initial Sounds assessment. |
| initial_sounds | fs_v_velvet_l2 | velvet | excluded_unsuitable_word | Velvet is texture-based and hard to image unambiguously for early Initial Sounds assessment. |
| initial_sounds | fs_y_yodeler_l2 | yodeler | excluded_unsuitable_word | Yodeler is culturally specific and not a strong K-2 Initial Sounds assessment target. |
| initial_sounds | fs_y_yucca-plant_l2 | yucca plant | excluded_unsuitable_word | Yucca plant is less familiar and not a strong early Initial Sounds target. |
| initial_sounds | fs_z_zone_l1 | zone | excluded_unsuitable_word | Zone is abstract and hard to image clearly for early Initial Sounds assessment. |
| initial_sounds | fs_z_zinnia_l1 | zinnia | excluded_unsuitable_word | Zinnia is too unusual for this K-2 Initial Sounds assessment bank and should be replaced with a simpler /z/ word. |
| initial_sounds | fs_z_zinnia-flower_l2 | zinnia flower | excluded_unsuitable_word | Zinnia flower is too unusual for this K-2 Initial Sounds assessment bank and should be replaced with a simpler /z/ word. |

## Recommended Replacement Requests

| word | current path/detail | recommended Kimi prompt |
| --- | --- | --- |
| acorn | /media/initial-sounds/images/a/acorn.webp | Create a clean, naturally colored acorn image with a plain background and no face, rainbow cap, embedded text, or extra objects. |
| nut | /media/initial-sounds/images/n/nut.webp | Create a clean, naturally colored generic nut image, such as walnut/peanut/hazelnut or mixed nuts, with no face, rainbow colors, embedded text, or acorn shape. |
| nut | /images/child-mode/short-u/nut.png | Create a clean, naturally colored generic nut image, such as walnut/peanut/hazelnut or mixed nuts, with no acorn cap, no face, no embedded text, and no rainbow colors. |

## Kimi Style Rule

Cute cartoon educational images are acceptable. Rainbow-colored ordinary objects are not acceptable. Use natural colors unless the target word itself requires color, such as `rainbow`. A `nut` image should show a generic nut such as a walnut, peanut, or hazelnut, not an acorn unless the target word is `acorn`.
