# Task 4 fix round 1 report

Date: 2026-09-02

Base: `513c3b643`

Scope: reviewer findings only; no image or audio binaries created

## Corrections

1. Removed the author-controlled `mediaStatus` bypass. A central, fingerprint-bound Willow Street release-readiness authority now classifies missing media separately from approved manuscript content. All 20 books remain in the 226-book authored runtime catalogue. An unregistered book cannot suppress missing-media errors by setting `mediaStatus`.
2. Reordered all eight reader-visible fruit-and-yogurt steps so adult allergy checking comes first, before ingredients are handled. The approved title remains exactly `Make Fruit and Yoghurt Cups`; child-facing body copy uses U.S. `yogurt`.
3. Replaced Task 4 child-facing British spellings with U.S. spellings and extended the human-voice gate to detect `vapour` and `yoghurt`, with one exact title-only exception for the approved title.
4. Completed the cardboard-ramp comparison within eight pages: release and mark the first stop, raise the ramp, release again, and compare both marks.
5. Aligned the Eid manuscript, teacher prompt, briefs, and Story Bible evidence around Samir's visible hope to meet Maya, the busy doorway setback, and finding her at the welcome table before they share breakfast.
6. Corrected the puddle ending and brief: the group reaches the garden by the safe dry path, while Leo's tested boot remains muddy.

## TDD evidence

The focused regressions were added before implementation. The initial run had four expected failures: missing reader-visible allergy safety, missing visible Eid goal/setback evidence, a non-U.S. spelling, and missing central release-readiness exports. After implementation:

```text
node --test tests/unit/guidedReadingBridgeBooks.test.js tests/unit/guidedReadingReleaseReadiness.test.js tests/unit/guidedReadingBookMetadata.test.js tests/unit/guidedReadingDiscussionPrompts.test.js tests/unit/freeTierContent.test.js
49 passed; 0 failed.
```

The regression explicitly constructs an unregistered book with `mediaStatus: "scheduled"`; its missing image remains an error. The 20 registered Willow IDs derive pending status only from the central frozen authority, whose fingerprint is verified by the Story Content Policy gate and included in the catalogue fingerprint.

## Gate evidence

```text
npm run check:guided-reading-discussion-prompts
226 static book records passed.

npm run check:validate:guided-reading
226 active approved books; 340 honest release-blocking media findings:
20 missing covers, 160 missing page images, 160 missing narration files.

npm run check:guided-reading-story-bible
226 books; 2,021 pages; 0 manuscript/profile failures.
20 Willow books remain release-blocked; 480 page-level findings comprise
160 missing images, 160 missing narration files, and 160 open rebuild flags.

npm run check:story-content-policy
Policy registration, evidence shape, source fingerprints, and approved manuscript content passed.
One Willow Street release-readiness group remains blocked.

node tools/checkStoryContentPolicy.mjs --release
Expected nonzero release verdict: 180/180 images and 160/160 narration pages are not release-ready; direct visual review, provenance, and human listening remain open.

node tools/checkGuidedReadingHumanVoice.mjs --level C
0 generic-voice findings; 0 U.S.-spelling findings.

npx eslint <changed JS/MJS production, gate, and unit-test files>
Passed with no findings.

git diff --check
Passed.
```

## Remaining release work

The 20 manuscripts are content-approved and catalogued, but release readiness is intentionally blocked. Tasks 5–6 must create and directly review 20 covers plus 160 page images and bind provenance. Task 7 must create exact-current-text narration for 160 pages, update generated authorities through their generators, verify decoding/waveforms, and complete direct human listening. No illustration, narration, visual approval, provenance, listening, physical-device, hosted, or release claim is made here.
