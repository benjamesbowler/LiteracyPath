# Assessment media is evidence

**Permanent gate:** `npm run check:assessment-media-evidence`

Assessment imagery is part of the item, not cosmetic polish. A question is valid only while every image needed to understand its stimulus or answer choices is available and has an equivalent accessible name.

## Required contract

- Stimulus, prompt, and answer-choice images use `data-assessment-media-kind="evidence"` and a specific `data-assessment-media-role`.
- Early visual-choice items resolve every answer card to approved exact-word media before rendering. Purpose-built assessment variants take precedence over generic legacy word art, and every option in the item must retain one complete image card.
- Evidence names describe the represented object. Generic alternatives such as `image`, `picture`, and `question visual` are rejected and replaced from the item label. Evidence with neither a meaningful supplied alternative nor a represented label fails closed.
- Non-instructional visuals use `data-assessment-media-kind="decorative"` and `aria-hidden="true"`. The listening glyph is decoration; the recorded word and named control carry its meaning.
- An evidence-image load error invalidates the whole item. The runtime records the failed item and source for that assessment session, removes every candidate using either, and selects a replacement without recording an answer, attempt, score, item-mastery update, or progress increment.
- If no safe replacement remains, the assessment stops with an availability message. It never converts a visual item into a text guess.
- Failure exclusions reset when a new assessment or targeted-review session starts.

## Verification

The unit gate proves failed-item removal, shared-source exclusion, fixed-length refill, evidence-name derivation, fail-closed unnamed evidence, explicit decoration, and complete exact-word option imagery across the published Rhyming bank. The browser gate mounts the production assessment renderer, forces a real image 404, and proves the replacement round contains neither the failed item nor another item sharing that source. It also proves progress remains at question 1, no feedback or scoring occurs, every rendered evidence image has its meaningful name and role, decoration is hidden, replacement assets load, and Axe reports no serious or critical finding.
