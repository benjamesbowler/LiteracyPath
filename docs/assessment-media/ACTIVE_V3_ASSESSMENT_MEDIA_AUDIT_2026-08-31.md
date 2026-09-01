---
title: Active v3 assessment media audit and remediation
status: current
date: 2026-08-31
scope: all 30 active v3 assessment areas
---

# Active v3 assessment media audit and remediation

## Outcome

The active v3 assessment bank was audited as one assessment system, not as an
Initial Sounds-only repair. The pre-remediation snapshot covered all 30
authored skills, 2,175 regular-runtime questions, and 1,175 distinct displayed
image paths. The audit
found systemic failures in old cropped mosaics, scene-heavy word pictures,
subjective HFW rebuses, answer-cueing comprehension art, and images whose most
likely child label did not match the assessed word.

The remediation adopts one rule across every assessment area:

- use an image only when it is direct evidence required by the construct;
- use a single, complete, plainly nameable referent for picture-word and
  phonological evidence;
- use explicit text-only or audio-only decisions when an image would be
  decorative, subjective, complex, answer-revealing, or lexically ambiguous;
- require an exact direct-review decision and pixel hash before an assessment
  image can become active.

The current written bank contains 2,512 items: 2,169 regular-runtime and 343
retention-only. Four hundred and fifteen items use scoring images, resolving
187 distinct displayed paths. The objective-word library contains 109 directly
reviewed files: 90 approved and 19 retained as rejected evidence under
`objective-word-direct-review-2026-09-01-v5`. The current bank references 81
distinct approved objective paths overall: 80 in regular-runtime items and 36
in retention items; those sets overlap. No authored item resolves a rejected or
unreviewed objective file.

## Audit scope and evidence

The following table is the pre-remediation snapshot that drove the repair. It
is historical audit evidence, not the current runtime count.

| Scope | Regular-runtime questions | Distinct displayed paths | Direct audit result |
| --- | ---: | ---: | --- |
| Early phonics, HFW, and replacement phonics (14 skills) | 1,311 | 509 | 187 confirmed failures; 322 conservative review records |
| Grammar, language, and comprehension (16 skills) | 864 | 689 | 547 pass; 105 fail; 37 review |
| All 30 skills after cross-scope deduplication | 2,175 | 1,175 | Every displayed path appeared in the audit inventory |

Initial Sounds also received a deeper word-by-word and card-by-card pass inside
the 14-skill scope: 140 distinct images produced 57 passes, 73 failures, and 10
review decisions in the pre-remediation snapshot. Those figures are a nested
drill-down and must not be added to the 14-skill totals.

The conservative 14-skill ledger deliberately did not convert an unrecorded
cell into a pass merely because it appeared on a contact sheet. Its 322 review
records comprise unresolved visual-review uncertainty, machine-only warnings,
and inspected cells without a separate path verdict. This prevents an inflated
pass claim.

| Current written bank | Total | Regular runtime | Retention-only | Image-bearing items | Distinct displayed paths |
| --- | ---: | ---: | ---: | ---: | ---: |
| All 30 skills | 2,512 | 2,169 | 343 | 415 total: 373 regular, 42 retention | 187 combined: 180 regular, 63 retention |

The regular and retention path sets overlap, so 180 plus 63 must not be read as
243. All 2,512 items are published bank entries; the 343 retention entries are
additionally marked `retentionOnly`.

## Severe review standard

Every objective-word approval records all of the following:

1. **Crop:** the assessed referent is complete, centered, and padded on every
   side; there is no adjacent mosaic strip or accidental frame cut.
2. **Nameability:** the picture has a direct, age-appropriate child label that
   matches the assessed word.
3. **Objectivity:** the answer is visible rather than inferred from emotion,
   relationship, theme, cause, or surrounding context.
4. **Complexity:** one visual focus carries the evidence; unrelated scenery and
   competing nouns are absent.
5. **Style:** bright, bold, professionally finished 2D raster artwork with
   crisp contours. Approved profiles are classic flat raster with smooth solid
   surfaces or professionally rendered storybook raster with smooth richly
   rendered surfaces. Basic vector-icon treatment, grain, paper/canvas
   texture, embossed or bevelled faux 3D, photorealism, painterly finish, text,
   and symbol cues are not acceptable.
6. **Pixel identity:** the approved SHA-256 hash must match the current 768 by
   768 WebP. Changing the pixels invalidates the recorded approval.

The recorder checks exact folder coverage as well as approved images. A file
cannot escape review by being added to the directory, and a rejected file
cannot be reactivated merely because it still exists.

## Systemic findings and resolutions

### High-frequency words

The 100 old HFW word-scene files affected 500 visible uses. Function words such
as *a*, *and*, *of*, *or*, *the*, *which*, and *would* cannot be represented by
objective pictures without turning the assessment into a subjective rebus.
HFW authoring now uses print and required audio rather than these scenes.

### Grammar, language, and comprehension

The audit confirmed 105 failures, including 32 adjacent-panel crops, 21
multi-concept collages, 18 answer-neutrality leaks, 11 shared-asset semantic
mismatches, and several wrong-object, wrong-quantity, tense, scale, and prompt
mismatches. Decorative and answer-cueing art is removed through explicit
text-only decisions. Images remain only for formats where the child must inspect
the visual evidence itself, such as a direct spatial relationship or matching a
sentence to a scene. The cropped multi-panel sequencing set was removed from
scoring use entirely; sequencing now uses concise text and audio evidence.

### Early and replacement phonics

The old rhyming, long-vowel, blend, digraph, plural-variant, and HFW pools mixed
cropped mosaic remnants with busy scenes and inconsistent styles. Common defects
included a shark used for *fin*, soup used for *hot*, a dog used for *run*, a
whole child used for *neck*, a sandal/foot used for *toe*, and composite scenes
used as single-word evidence. Objective replacements now resolve ahead of those
legacy pools. Rejected concepts are removed from active scoring-image use rather
than given a more attractive but still ambiguous picture.

### Question wording and construct validity

The wording review covered every authored question in all 30 assessment areas,
not only Initial Sounds. Picture-led stems no longer ask children which *image*,
*picture*, or *one* "starts like" another object. When a phonological construct
requires a pictured referent, the visible stem asks for the word and the recorded
prompt first names the reference word. For example, the Initial Sounds *tooth*
item now displays `Which word has the same starting sound?` and records `Tooth.
Which word has the same starting sound?`. Final-sound items use `Which word has
the same final sound?`; rhyming, vowel, blend, digraph, and print-matching items
use their own construct-specific wording.

The same pass removed answer-leaking context, ambiguous pronouns, invalid plural
distractors, and prompts that assessed the wrong spatial or morphological
relationship. A whole-bank wording policy now rejects the legacy stems and
checks each generated item against its declared assessment construct.

## Objective replacement library

Thirteen concrete failures were regenerated in the first replacement batch and
then re-inspected at their final project size: `bag`, `hen`, `iguana`, `ink`,
`jam`, `quilt`, `rat`, `rose`, `rug`, `wasp`, `wheat`, `lid`, and `seal`.
Twelve passed. `rug` was rejected because children can objectively name the
same picture *mat*. Each retained final file is a padded, single-focus 768 by
768 WebP in `public/images/assessment/objective-words`.

Later iPad-sized review rejected old icon-like or scene-heavy cards still
visible around the corrected *tooth* question. Proper raster image generation
replaced `fan`, `tie`, `dog`, `duck`, `watch`, `wheel`, and `clock`, alongside
the earlier proper-raster `sled` and `tooth`. All nine use the
`professionally-rendered-storybook-raster` profile with richly rendered smooth
surfaces. The selected originals remain under
`/Users/benjaminbowler/.codex/generated_images/01a05553-d500-79c3-b1e8-fcb9b205a16d`;
the first replacement batch remains under
`/Users/benjaminbowler/.codex/generated_images/01a055c8-c2d5-7893-a23f-084709abc2f3`.

The proper-raster `sled` and `tooth` files have SHA-256 hashes
`653717915f5d1bd4e04246ce88ed0c3f22fc1d22bb1ab6fd383f7667e779c828`
and `87cdbc6455b03ac8238bffd7d0844f59cc0eec3ad74644168b1554f3f6f50022`.
They replace an inactive busy child-sledding scene and a tooth-plus-toothbrush
picture. Every proper-raster approval records provenance
`proper-raster-image-generation-2026-08-31`.

A final all-path review then found 11 legacy rhyme variants with visible strips
from neighboring panels and one zoomed legacy zebra with right-edge
contamination. Their exact paths and pixel hashes are now blocked. Proper raster
generation supplied isolated replacements for `cat`, `cup`, `ham`, `mat`,
`pan`, and `zebra`; ambiguous `nap`, `red`, and `dig` pictures were reauthored
to direct alternatives instead. Three visually clean candidates were still
rejected on lexical validity: `tap` can correctly be named *faucet*, `ram` can
correctly be named *sheep*, and `hut` can correctly be named *house*. All 16
items that could have depended on those labels were reauthored to direct
referents or text-and-audio evidence.

Proper image generation did not make the `pad` and `pit` candidates valid.
`pad` read primarily as a notepad or notebook, while `pit` read primarily as a
hole. Both candidates were rejected and removed from the checked-in objective
library, so they are not included in the reviewed 109-file folder. Rhyming was
reauthored from `ad/pad` and `it/pit` to the objective `ub/tub` and `ock/clock`
families. Neither candidate image is used by an assessment item.

The 19 explicitly rejected files are:

| Word | Why it cannot be active scoring art |
| --- | --- |
| `bath` | A bathtub does not objectively depict the event/word *bath*. |
| `beach` | Umbrella, sand, and wave form a multi-cue scene, not one named referent. |
| `cherry` | Two cherries conflict with the singular hidden label. |
| `chip` | The pictured potato crisp is regionally nameable as *crisp*, not objectively *chip*. |
| `dish` | The primary pictured label is *plate*. |
| `engine` | The mechanism is complex and is equally nameable as *motor*. |
| `hut` | The dwelling is equally nameable as *house*, changing the assessed onset, rime, and final sound. |
| `jet` | The passenger aircraft is more likely to be named *plane* or *airplane*. |
| `neck` | The cropped child profile creates competing labels such as *head*, *face*, and *boy*. |
| `nose` | The partial face includes competing eye, mouth, profile, and face labels. |
| `rug` | The floor covering is equally nameable as *mat*. |
| `ram` | Young children can correctly name the pictured animal *sheep*, changing the assessed sounds. |
| `run` | A still cannot force the base-form action rather than *boy*, *runner*, or *running*. |
| `tap` | The fixture is regionally named *faucet*, so the hidden word is not cross-locale objective. |
| `toe` | The picture's primary label is *foot*. |
| `toy` | A spinning top is a specific object; *toy* is a broad category. |
| `tube` | The plain cylinder is equally nameable as *pipe*. |
| `yogurt` | The open cup could be yogurt, pudding, or ice cream. |
| `zip` | The picture shows a zipper; *zip* is a dialectal noun or action. |

These rejections remain checked in as evidence, but the composite approval map
omits them and the active-source test prevents any authored question from using
them.

## Automated safeguards

- `active-v3-rejected-image-evidence.tsv` preserves the exact SHA-256, path,
  scope, reason code, and direct-review reason for 320 unique rejected bitmaps
  under `active-v3-severe-audit-2026-08-31-v4`. The combined policy contains
  362 unique rejected hashes under `direct-pixel-review-2026-09-01-v9`: 320
  severe-ledger, 23 legacy exact-pixel, and 19 objective-library rejections.
  The same pixels therefore cannot return under a different filename.
- `assessmentSevereMediaAudit.test.js` checks the rejection evidence and proves
  that no active authored regular-runtime question resolves a rejected bitmap.
- `recordObjectiveAssessmentImageReviews.mjs` validates exact directory
  coverage, review fields, dimensions, still-image format, and hashes, then
  records approved and rejected decisions separately.
- `assessmentImageStyleDecisions.js` combines the existing reviewed library
  with approved objective-word decisions without replacing either authority.
- `objectiveAssessmentImageReviews.test.js` proves folder coverage, exact
  approved pixels, composite integrity, and zero active references to rejected
  or unreviewed objective art.
- `assessmentGeneratedBankFreshness.test.js` and the no-write rebuild gate
  compare every checked-in generated bank with its authoritative authoring
  source. A stale serialized bank fails release instead of continuing to serve
  superseded wording or image paths.
- The runtime controller validates the resolved image decision before rendering
  a question. A path or decision mismatch fails and refills the item rather
  than exposing stale or unreviewed evidence to the learner.
- `assessmentImageCachePolicy.test.js` locks an assessment-specific browser
  revalidation rule after the generic media-cache rule. Assessment images may
  remain cached at the Vercel edge for one day, but the child device must
  revalidate them instead of retaining old pixels for a day plus stale time.
- The assessment rebuild gate and media-decision synchronizer consume the
  composite approval map, so an unreviewed objective path fails closed.

## Production assessment audio

Every current prompt, passage, target word, and answer choice in all 30 banks
resolves through the production Leda voice library. The final bank contains
6,898 unique spoken texts, which resolve to 6,886 distinct MP3 files because
some normalized texts intentionally share one recording. A full-file decoder
and peak-volume pass confirmed that every mapped file exists, decodes, and
peaks above -40 dB. The gap generator reports zero unresolved texts.

The release gate now runs this full audibility check rather than relying only
on path presence. Generation uses atomic temporary files and rejects a new
recording before publication when it is missing, undecodable, or silent. This
mechanical decoder and level evidence does not replace human listening for
pronunciation, prosody, or child comprehensibility.

## Current-source iPad-size evidence

The browser release fixture now imports the real generated Initial Sounds and
Digraphs banks rather than a synthetic picture-card example. It pins the exact
*tooth* items at 1024 by 768 landscape and 768 by 1024 portrait, and checks:

- the visible question is `Which word has the same starting sound?` or
  `Which word has the same final sound?` as appropriate;
- legacy forms such as `Which one starts like tooth?` do not appear;
- hidden answer labels remain hidden;
- the expected objective-image URLs load successfully at a natural size of 768
  by 768 pixels;
- every answer image renders at least 96 pixels wide and high;
- the prompt, answer cards, and controls remain inside the viewport with no
  horizontal overflow or page errors.

The landscape and portrait current-source checks pass. This is browser viewport
evidence; it is not a substitute for a final tap-and-audio check on a physical
iPad after the production deployment.

## Evidence boundaries

The direct review and automated checks establish current source, file, hash,
crop, nameability, objectivity, and style evidence. They do not replace:

- observed word-elicitation checks with children for a representative sample;
- human listening of newly generated assessment audio;
- physical-iPad layout and tap testing;
- an authenticated hosted-production assessment run.

Those are separate evidence activities, not permission to reactivate a rejected
image or to treat a subjective picture as valid.
