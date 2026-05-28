# Bud Audio and Image QA Status

Generated: 2026-05-28

## Audio Import

- Source: `/Users/benjaminbowler/Desktop/public/Bud Audio File.zip`
- Imported file: `bud.mp3`
- Destination: `public/audio/child-mode/words/bud.mp3`
- Result: clean bud audio replaced the previous local `bud.mp3`.
- Deprecated variant preserved: `public/audio/child-mode/words/bud-kimi3.mp3`

## Image Status

The current bud images remain blocked from live assessment use because the visual is ambiguous and not clearly an unopened flower bud:

- `public/images/child-mode/cvc/bud.png`
- `public/images/child-mode/initial-sounds/bud.png`
- `public/images/child-mode/minimal-pairs/bud.png`

`src/data/childAssets.js` marks the bud image asset as `needs_image_replacement`, preserving audio while removing the image from resolved child word assets.

## Kimi Replacement Request

Replacement image request added/updated in:

- `docs/assets/kimi_missing_skill_media_request.md`
- `docs/assets/kimi_assessment_missing_images_request.md`
- `docs/assets/kimi_assessment_missing_media_combined_request.md`

Required image: simple natural cartoon flower bud, clearly unopened, no face, no sparkles, no rainbow colors, no confusing full flower, no shadows, no text.

## Runtime Notes

- Bud is not active in Final Sounds live pair-selection question `coverage_final_d_002`.
- `coverage_final_d_002` uses `red`, `lid`, `fish`, and `cat`.
- Clean bud audio is available for future use after the bud image is replaced and QA-approved.
