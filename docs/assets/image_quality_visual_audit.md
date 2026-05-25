# Image Quality Visual Audit

Generated: 2026-05-25T11:13:07.796Z

This audit focuses on assessment media. It uses safe static heuristics only: filenames/paths and exact-file hash comparisons. It does not delete or replace assets automatically.

## Summary

- Public assessment images scanned: 1386
- Active image-backed assessment mappings scanned: 1678
- Likely rainbow/over-stylized active mappings: 0
- Known unsuitable assessment assets blocked/requested: 0
- Known unsuitable assets still active: 0
- Excluded weird/unusual targets still active: 0
- Rainbow/path warnings in public assets: 0
- Over-saturated active image manual-review warnings: 13
- Known semantic conflict failures: 0
- Audio replacement requests: 0

## Likely Rainbow Or Over-Stylized Active Mappings

_None._

## Known Unsuitable Assessment Assets

_None._

## Known Unsuitable Images Still Active

_None._

## Rainbow/Colorful Filename Warnings In Public Assets

_None._

## Color-Heuristic Manual Review Warnings

| word(s) | image path | saturated ratio | bright ratio | hue buckets | warning |
| --- | --- | --- | --- | --- | --- |
| apron | /media/initial-sounds/images/a/apron.webp | 0.66 | 0.317 | 10 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| antenna | /media/initial-sounds/images/a/antenna.webp | 0.614 | 0.45 | 7 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| bird | /media/initial-sounds/images/b/bird.webp | 0.576 | 0.361 | 8 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| coat | /media/initial-sounds/images/c/coat.webp | 0.755 | 0.713 | 7 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| camera | /media/initial-sounds/images/c/camera.webp | 0.741 | 0.608 | 7 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| fox | /media/initial-sounds/images/f/fox.webp | 0.564 | 0.464 | 7 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| gingerbread | /media/initial-sounds/images/g/gingerbread.webp | 0.645 | 0.468 | 7 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| juice | /media/initial-sounds/images/j/juice.webp | 0.561 | 0.43 | 6 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| pot | /media/initial-sounds/images/p/pot.webp | 0.63 | 0.252 | 6 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| rocket | /media/initial-sounds/images/r/rocket.webp | 0.568 | 0.414 | 6 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| star | /media/initial-sounds/images/s/star.webp | 0.706 | 0.624 | 7 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| woodpecker | /media/initial-sounds/images/w/woodpecker.webp | 0.652 | 0.127 | 8 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |
| clap, flag, frog, slide, black | /images/child-mode/blends/flag.png | 0.635 | 0.406 | 9 | Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking. |

## Known Semantic Conflict Checks

| word A | word B | status | detail |
| --- | --- | --- | --- |
| acorn | nut | pass | No active shared image path/hash detected. |
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

_None._

## Kimi Style Rule

Cute cartoon educational images are acceptable. Rainbow-colored ordinary objects are not acceptable. Use natural colors unless the target word itself requires color, such as `rainbow`. Non-living objects, foods, body parts, tools, vehicles, and nature objects must not have faces, eyes, smiles, character expressions, sparkles, confetti, magical glow, or baby/kawaii styling. A `nut` image should show a generic nut such as a walnut, peanut, or hazelnut, not an acorn unless the target word is `acorn`.
