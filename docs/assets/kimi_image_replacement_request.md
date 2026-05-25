# Kimi Image Replacement Request

Generated: 2026-05-25T04:30:25.378Z

These are image-only replacement requests for assessment content quality. The existing audio is good unless a separate audit marks it genuinely missing or broken.

**AUDIO IS NOT NEEDED FOR THESE ITEMS. IMAGE ONLY.**

## Global Image Rules

- Realistic/natural object colors.
- Cute clean educational cartoon or semi-realistic style is fine.
- No rainbow-colored ordinary objects.
- No faces, eyes, smiles, or character expressions on non-living objects, foods, body parts, tools, vehicles, or nature objects.
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
| initial_sounds |  | gum |  | /media/initial-sounds/images/g/gum.webp | /media/initial-sounds/images/g/gum.webp | Manual review: object image is babyfied with a face/decorative styling. Non-living objects must not have faces. | Create a clear, natural-colored piece of chewing gum or pack of gum on a clean white/simple background. No face, no eyes, no smile, no rainbow colors, no sparkles, no text, no labels, no watermark. |
| initial_sounds |  | hat |  | /media/initial-sounds/images/h/hat.webp | /media/initial-sounds/images/h/hat.webp | Manual review: object image is babyfied with a face/decorative shapes. Non-living objects must not have faces. | Create one clear, natural-colored cartoon hat on a clean white/simple background. No face, no eyes, no smile, no sparkles, no confetti, no text, no labels, no watermark. |
| initial_sounds |  | jam |  | /media/initial-sounds/images/j/jam.webp | /media/initial-sounds/images/j/jam.webp | Manual review: food/object image is babyfied with a face. Non-living food/object targets must not have faces. | Create one clear jar of strawberry jam on a clean white/simple background. Natural red jam color, no face, no eyes, no smile, no sparkles, no embedded text, no labels, no watermark. |
| initial_sounds |  | leg |  | /media/initial-sounds/images/l/leg.webp | /media/initial-sounds/images/l/leg.webp | Manual review: body-part image is babyfied with a face. Body-part targets should be natural and clear, not character objects. | Create one clear, natural cartoon human leg from knee to foot, neutral skin tone, simple shoe optional, clean white/simple background. No face, no eyes, no smile, no sparkles, no text, no labels, no watermark. |
| initial_sounds |  | sun |  | /media/initial-sounds/images/s/sun.webp | /media/initial-sounds/images/s/sun.webp | Manual review: nature/object image is babyfied with sunglasses/face. Non-living nature/object targets must not have faces. | Create one clear natural yellow sun icon/cartoon on a clean white/simple sky background. No face, no sunglasses, no eyes, no smile, no rainbow colors, no sparkles, no text, no labels, no watermark. |
| initial_sounds |  | wig |  | /media/initial-sounds/images/w/wig.webp | /media/initial-sounds/images/w/wig.webp | Manual review: object image is babyfied with a face/rainbow styling. Non-living objects must not have faces. | Create one clear natural-colored wig on a simple wig stand or plain background. No face, no eyes, no smile, no rainbow colors, no sparkles, no text, no labels, no watermark. |

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
