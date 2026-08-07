# Guided Reading Level B Visual Audit

Date: 2026-08-04  
Scope: every active Level B cover and story/fact-page illustration  
Status: visual audit, 254-asset staged-first approval, hash-guarded installation and Level B visual approval refresh complete; audio generation awaits explicit third-party TTS consent

## Standard

Every active asset was reviewed against all of the following questions:

1. Does the picture show the people, animals, objects, action, place, time and emotion stated or necessarily implied by the page text?
2. Do recurring characters keep the same species, age, body shape, face, colors, clothing and signature features across pages and books?
3. Are anatomy and object construction coherent, with no extra or fused limbs, human-like animal hands, malformed faces, impossible grips, duplicated props or broken geometry?
4. Does the page preserve story state from the previous page, including object counts, damage, weather, location, time of day and who knows what?
5. Is the cast exact, with no unexplained helper, duplicate character or missing participant?
6. Is the action physically readable, scientifically accurate where applicable, and safe for a child-facing book?
7. Is the composition clear at reading size, without accidental cropping, collage panels, fake lettering, watermarks or title text baked into the art?
8. Does the cover truthfully represent the book's main characters, problem or subject?
9. Does the final image show the resolution promised by the final text?

`WARN` is not acceptable under this audit. Every warning joins every failure in the replacement queue.

### Non-negotiable art direction for future work

Every future Level B replacement, retry or supersession must use bright, clean, classic children's-cartoon illustration. Reject embossed, grainy, fake-canvas, pebbled, relief-like, over-sharpened or hyper-textured rendering, even when its anatomy and text alignment otherwise pass.

This rule was added on 2026-08-04 as a prospective acceptance gate. Already-created candidates are grandfathered when their only issue is the earlier textured treatment, as explicitly authorized by the project owner; they are not regenerated for style alone. Every image generated, retried or superseded after this rule was adopted must pass the clean-cartoon gate as well as anatomy, continuity and text-alignment review.

## Initial exhaustive source audit

The active runtime inventory contains **86 books**, **711 story/fact pages** and **86 covers**: **797 visual assets** in total. The audit used the final Level B manuscript snapshot:

`sha256:785edc7c3577004f971c019afe94db89b01e9c4da79f7d46e10ca8b6bb6dadf0`

The final classification of the initial/source audit is:

| Collection | Books | Pages | Covers | Assets | Pass | Warn | Fail | Replace |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Nonfiction | 46 | 311 | 46 | 357 | 307 | 41 | 9 | 50 |
| James & Anna | 10 | 120 | 10 | 130 | 105 | 4 | 21 | 25 |
| Dino Pals | 30 | 280 | 30 | 310 | 138 | 4 | 168 | 172 |
| **Total** | **86** | **711** | **86** | **797** | **550** | **49** | **198** | **247** |

No active Level B cover or page was left unreviewed. The strict `WARN + FAIL` rule therefore produced a **247-asset replacement queue**. These numbers describe the audited source images before installation; they are not a claim that 247 production files have already been replaced.

The queue is frozen against the production-image SHA-256 values recorded in:

- `.artifacts/guided-reading/level-b-visual-audit/aggregate-audit.json`
- `.artifacts/guided-reading/level-b-visual-audit/full-books/inventory.json`

## Independent continuity expansion

The frame-by-frame source audit was followed by independent full-book and cross-character review of staged candidates. This second view was necessary because a plausible single frame can still fail when placed beside adjacent pages or every other appearance of the same character.

It caught and corrected or superseded, among other things:

- Grumpy becoming upright or receiving a human pointing hand instead of remaining a low, heavy four-footed ankylosaur;
- Zippy losing the fixed rainbow scarf or replacing it with a solid-color scarf;
- Dozy's single plain blue pillow disappearing, changing color or becoming patterned while the story state still required it;
- recurring quadrupeds standing like people, using human hands, or performing actions with hand-like forelimbs instead of natural feet, mouths, snouts, heads or gaze;
- Shy's head, neck, feet or tail being cropped so severely that character identity and body continuity could not be checked;
- Flappy losing the canonical feathered-dinosaur model or receiving incomplete, inconsistent or ordinary-bird wings;
- generated candidates that fixed one defect while introducing another, including unclear story actions, detached tails, extra limbs, unsafe crops or broken prop counts.

Most independent-pass findings supplied stricter replacements or supersessions for targets already inside the frozen 247-source queue. The final staged-first full-book review also found **seven previously passing source assets with sequence-level or legibility failures**: two covers, four connected Day and Night diagrams, and one James & Anna action frame. Those findings are recorded separately rather than rewriting the historical source-audit counts. The final installation queue is therefore **254 unique production targets**: 247 initial targets plus 7 aggregate-review additions. Three candidates inside the original queue were also superseded without increasing that count.

The seven aggregate-review additions and three supersessions are frozen against their production hashes in:

- `.artifacts/guided-reading/level-b-replacements/qa/aggregate-review-supplement.json`

Current continuity evidence includes:

- `.artifacts/guided-reading/level-b-visual-audit/dino-pals/continuity-sheets/`
- `.artifacts/guided-reading/level-b-visual-audit/continuity/grumpy/index.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-continuity-expansion/generation-jobs.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-continuity-expansion/generation-attempts-lane-a.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-continuity-expansion/generation-manifest.json`

## Non-negotiable continuity anchors

- James remains the fair-skinned child with curly red hair, a green-and-white striped shirt, navy shorts and red sneakers. Anna remains the brown-skinned child with dark pigtails and yellow ties, a yellow star shirt, purple pants and purple shoes. Wardrobe changes must be motivated by the story.
- Chips remains the same small dog across the James & Anna books. His collar, scale, anatomy and relationship to the children must not drift.
- Grumpy is a low, heavy gray ankylosaur with tan armor, exactly four natural legs and one attached brown club tail. He never stands like a person or gains arms or hands.
- Zippy is the red-and-yellow young velociraptor with one tail and the same small rainbow scarf in every appearance.
- Dozy is the lavender-purple sleepy stegosaur with fixed rounded plates. The same single plain blue pillow persists until the text visibly changes its state.
- Bouncy has exactly two green three-toed feet, each above its own separate silver spring. Ordinary hind legs, one central spring and merged springs are failures.
- Honky keeps one complete rainbow crest, including the cool-color bands.
- Shy remains the small mint-green spotted longneck and must be framed widely enough to show a readable head, body, four feet and one tail when those parts are needed for continuity.
- Flappy remains the small orange-brown feathered young dinosaur with a cream chest, coherent feathered wings and stable clawed feet. Flappy is not a chick or an ordinary bird.
- Fancy, Clumsy, Sneezy and every other four-footed Pal remain natural quadrupeds. Story actions must not introduce human hands or upright human body plans.
- Nonfiction images must accurately show the named fact, count, process and safety behavior. Decorative plausibility cannot replace scientific or factual alignment.

## Required staged-first QA and hash-guarded installation

Per-collection and per-batch generation manifests are evidence that replacements were created and inspected. They are not, by themselves, permission to install. The required aggregate process is:

1. Keep every candidate outside `public/` and inspect it at original size for text/action alignment, anatomy, cast, object counts, artifacts, crop safety and the clean classic-cartoon art direction.
2. Build all **86** books as staged-first contact sheets: each proposed replacement is substituted into its full sequence while every retained source frame remains visible and labeled with current text.
3. Build cross-character sheets for recurring Dino Pals and the complete James/Anna/Chips sequence. Reject or supersede any frame that breaks identity, clothing, props, anatomy or story state.
4. Freeze one aggregate manifest containing exactly **254 unique production targets**: the immutable 247-target source queue plus the 7-target aggregate-review supplement. It must report no missing or unexpected staged images, duplicate targets, duplicate staged paths, duplicate staged hashes, wrong dimensions, wrong format, wrong color space or production target changed since the applicable source or supplemental audit.
5. Run the installer in dry-run mode. Only an aggregate `PASS` may allow the explicit apply mode.
6. During apply, recheck every staged and production SHA-256, enforce the staged and production path allowlists, back up every existing production file, copy the replacements and verify every installed hash.
7. Preserve the install receipt and backup location before any audio regeneration or post-install approval refresh begins.

The required process is encoded in:

- `.artifacts/guided-reading/level-b-replacements/qa/build-staged-full-book-sheets.mjs`
- `.artifacts/guided-reading/level-b-replacements/qa/build-level-b-replacement-manifest.mjs`
- `.artifacts/guided-reading/level-b-replacements/qa/install-level-b-replacements.mjs`
- `.artifacts/guided-reading/level-b-replacements/qa/refresh-level-b-visual-approvals.mjs`

## Current staged evidence

Source-audit evidence:

- `.artifacts/guided-reading/level-b-visual-audit/aggregate-audit.json`
- `.artifacts/guided-reading/level-b-visual-audit/aggregate-summary.md`
- `.artifacts/guided-reading/level-b-visual-audit/nonfiction/audit.json`
- `.artifacts/guided-reading/level-b-visual-audit/james-anna/audit.json`
- `.artifacts/guided-reading/level-b-visual-audit/dino-pals/audit.json`
- `.artifacts/guided-reading/level-b-visual-audit/full-books/`

Replacement-generation evidence:

- `.artifacts/guided-reading/level-b-replacements/nonfiction/generation-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/james-and-anna/generation-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-01-10/generation-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-11-15/generation-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-14-15/generation-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-16-20/generation-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-20/generation-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-21-30/generation-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/dino-pals/batch-continuity-expansion/generation-manifest.json`

## Installation — COMPLETE

The final staged-first pass contains **86 complete book sheets**, **70 recurring-character continuity sheets** and all **797** Level B cover/page assets. Its manifest passed with **254/254** expected replacements and zero missing targets, unexpected staged images, duplicate targets, duplicate staged paths, duplicate staged hashes, technical failures or changed production sources.

The guarded installer then backed up and installed all 254 reviewed assets. It rechecked each source and staged hash before copying and verified each installed hash afterward. Evidence:

- `.artifacts/guided-reading/level-b-replacements/qa/full-books/inventory.json`
- `.artifacts/guided-reading/level-b-replacements/qa/continuity/`
- `.artifacts/guided-reading/level-b-replacements/qa/level-b-replacement-manifest.json`
- `.artifacts/guided-reading/level-b-replacements/qa/level-b-install-receipt.json`
- `.artifacts/guided-reading/level-b-replacements/qa/preinstall-backup-2026-08-04T13-14-02-200Z/`

The post-install visual approval refresh covers 86 books, 711 pages and 797 covers/pages. `node tools/checkGuidedReadingVisualAlignment.mjs --level B` passes with 711 approved pages and zero failures.

## Audio — AWAITING EXPLICIT GOOGLE CLOUD CONSENT

The Level B audio dry run is complete. It found 107 exact page narrations already resolved, 604 missing exact page clips, 539 stale `narrationNeedsRebuild` markers and 697 missing page/isolated-word files in the generation inventory, with zero broken exact overrides, normalized collisions or page-text mismatches.

The configured generator uses Google Cloud Text-to-Speech with the Leda voice. No Level B manuscript text was transmitted during this pass: external generation is paused until the project owner explicitly authorizes sending the approved Level B page sentences and isolated words to Google Cloud TTS.

Required audio evidence will include:

- `src/data/generated/guidedReadingLedaGaps.generated.js`
- `src/data/generated/guidedReadingNarrationClearance.generated.js`
- `public/audio/production/en-US/guided_page/`
- `public/audio/production/en-US/isolated_word/`

Those paths are evidence only after the Level B inventory has been regenerated, checked for exact text resolution and listened to where new audio was created.

## Post-install verification — PARTIAL PASS; AUDIO OPEN

The following installed Level B checks pass:

- `node tools/checkGuidedReadingHumanVoice.mjs --level B`
- `node tools/checkGuidedReadingStoryBible.mjs --level B --skip-audio`
- `node tools/checkGuidedReadingVisualAlignment.mjs --level B`
- `npm run check:guided-reading-visibility`
- `node tools/checkGuidedReadingImageTextAlignment.js`
- `node tools/checkGuidedReadingExperience.js`
- `node tools/checkGuidedReadingTitlePages.js`

The all-level validation surfaces remain red because Level B exact audio is not yet complete and Level C still has open text/audio-to-audit hashes that belong to the next approval round. The Level B-specific manuscript and visual gates themselves pass. After audio consent and generation, rerun:

- `npm run check:validate:guided-reading`
- `npm run check:guided-reading-human-voice`
- `npm run check:guided-reading-story-bible`
- `npm run check:guided-reading-visual-alignment`
- `npm run check:guided-reading-visibility`

Manual/browser evidence must also cover the complete reading experience, title pages, direct launches, shared/follower sessions and the final installed full-book sheets. The checked-in audit surfaces to refresh are:

- `docs/guided-reading/guided_reading_experience_audit.md`
- `docs/guided-reading/guided_reading_image_text_alignment_audit.md`
- `docs/guided-reading/guided_reading_title_page_audit.md`

Level B visual installation and visual approval are complete. Audio completion and final audio-inclusive validation remain open pending explicit Google Cloud TTS consent.
