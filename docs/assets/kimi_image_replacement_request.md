# Kimi Image Replacement Request

Generated: 2026-05-25T03:05:16.813Z

These are image-only replacement requests for assessment content quality. The existing audio is good unless a separate audit marks it genuinely missing or broken.

**AUDIO IS NOT NEEDED FOR THESE ITEMS. IMAGE ONLY.**

## Global Image Rules

- Realistic/natural object colors.
- Cute clean educational cartoon or semi-realistic style is fine.
- No rainbow-colored ordinary objects.
- No embedded text, labels, captions, or watermarks.
- Single clear target object on a clean white/simple background.
- Kindergarten safe.
- Object must clearly match the target word.
- Do not use an acorn image for `nut`.

## Image Replacements Needed

| Skill ID | Level | Target Word | Letter/Sound/Pattern | Current Bad Image Path | Exact Replacement Image Path | Reason | Image-Only Prompt |
|---|---:|---|---|---|---|---|---|
| initial_sounds | 1 | acorn | a | /media/initial-sounds/images/a/acorn.webp | /media/initial-sounds/images/a/acorn.webp | Manual review: rainbow-colored cap/character styling is too stylized for an ordinary acorn assessment image. | Create a clean, naturally colored acorn image with a plain background and no face, rainbow cap, embedded text, or extra objects. |
| initial_sounds | 1 | nut | n | /media/initial-sounds/images/n/nut.webp | /media/initial-sounds/images/n/nut.webp | Manual review: rainbow-colored character styling is too stylized and too confusable for a generic nut assessment image. | Create a clean, naturally colored generic nut image, such as walnut/peanut/hazelnut or mixed nuts, with no face, rainbow colors, embedded text, or acorn shape. |
| assessment_shared |  | nut | n | /images/child-mode/short-u/nut.png | /images/child-mode/short-u/nut.png | Manual review: image is visually an acorn, not a generic nut, so it is blocked from active assessment use. | Create a clean, naturally colored generic nut image, such as walnut/peanut/hazelnut or mixed nuts, with no acorn cap, no face, no embedded text, and no rainbow colors. |

## Excluded Weird/Unusual Words

These targets should stay inactive unless replaced with better K-2 words. Do not generate audio for these excluded words.

| Excluded Word | Reason | Replacement Direction |
|---|---|---|
| zinnia | Unusual flower name for K-2 Initial Sounds. Replace with zebra, zipper, zoo, zero, or zigzag. | Use zebra, zipper, zoo, zero, or zigzag if a replacement /z/ target is needed. |
| zinnia flower | Unusual phrase target for K-2 Initial Sounds. Replace with a simpler /z/ word. | Use zebra, zipper, zoo, zero, or zigzag if a replacement /z/ target is needed. |
| zannia | Misspelled/unusual target. Do not use in active assessment. | Use zebra, zipper, zoo, zero, or zigzag if a replacement /z/ target is needed. |
| zone | Abstract and hard to image clearly for early Initial Sounds. | Use zebra, zipper, zoo, zero, or zigzag if a replacement /z/ target is needed. |
| observer | Abstract/role-based and hard to image clearly for early Initial Sounds. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| opera | Culturally specific and not a strong early assessment target. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| quartz | Obscure for K-2 Initial Sounds. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| quiver | Potentially ambiguous for K-2 Initial Sounds. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| quickstep | Obscure/culturally specific for K-2 Initial Sounds. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| upbeat | Abstract and hard to image clearly. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| uplift | Abstract and hard to image clearly. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| urban garden | Phrase target with no single clear object for early Initial Sounds. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| velvet | Texture-based and hard to image unambiguously. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| yodeler | Culturally specific and not a strong K-2 assessment target. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
| yucca plant | Less familiar and not a strong early Initial Sounds target. | Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored. |
