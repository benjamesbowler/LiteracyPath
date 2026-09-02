# Task 4 fix round 2 report

Date: 2026-09-02

Base: `45a357af2`

## Changes

- The official `RELEASE_GATES` entries now pass `--release` to both Story Content Policy and Guided Reading Story Bible. Their ordinary npm scripts remain non-release diagnostics, while the canonical release run enforces Willow Street media, provenance, visual-review, and human-listening readiness.
- `Build a Cardboard Ramp` page seven now tells the reader to raise the ramp, release the same car again, and mark its second stopping point. Its brief preserves the first blue mark and adds the second yellow mark. Page eight and the static teacher prompt compare those two marks.
- The fingerprint-bound Guided Reading policy baseline was refreshed for the final page-seven manuscript.

## TDD and verification

Before implementation, the focused suite failed twice: the release registry lacked both `--release` arguments, and ramp page seven lacked the second marking action. After implementation:

```text
node --test tests/unit/guidedReadingBridgeBooks.test.js tests/unit/guidedReadingReleaseReadiness.test.js
14 passed; 0 failed.

npm run check:guided-reading-discussion-prompts
226 static book records passed.

npm run check:story-content-policy
Diagnostic mode passed policy shape and fingerprints and honestly reported one release-blocked Willow group.

npm run check:guided-reading-story-bible
226 books; 2,021 pages; 0 manuscript/profile failures; 20 Willow books remain release-blocked.

npx eslint <six changed JS/MJS files>
Passed with no findings.

git diff --check
Passed.
```

The new regression inspects the exported canonical gate registry directly and requires the exact strict commands. The broad release suite was not run. Until Tasks 5–7 complete the media and human evidence, the official release gate is expected to fail on both strict content checks.
