# Comprehension Fullscreen and Pictures Implementation Plan

> **For agentic workers:** Use the approved design and dispatching-parallel-agents skill for independent file owners. The user explicitly approved building; execute continuously without another approval gate.

**Goal:** Deliver the full-screen no-scroll comprehension lesson and exact-story black-and-white pictures for all 72 passages, on screen and in a separate picture-page PDF.

**Architecture:** Keep PassageWorkspace as the single owner of practice and Leda state. Its presentation stage uses native fullscreen plus a fixed viewport fallback, with paged Read/Pictures/Questions views where the viewport cannot fit the complete desktop layout. A private authoring manifest supplies generated runtime metadata for screen and print; exact prompts and byte provenance remain in tools/docs.

**Tech Stack:** Existing React/Vite, shared focus/fullscreen patterns, built-in image_gen raster generation, existing self-contained worksheet renderer, Playwright/Node checks.

**Spec:** ../specs/2026-10-27-comprehension-fullscreen-pictures-design.md

## Global constraints

- All 72 existing passages; unchanged concrete K–3/ESL text and all 216 keyed questions.
- Approved Guide identity, black outlines on white, no speech bubbles, pseudo-writing or answer-letter cues.
- Readable type and touch targets at 320×568, 568×320, 768×1024, 1024×768, 1366×768 and 1920×1080.
- Native and fallback fullscreen; no clipping disguised as no-scroll; safe keyboard exit and focus return.
- Preserve shuffled answers, saved first response/retry, private teacher notes and canonical Leda ownership.
- Existing GitHub/live publication approval persists. No hosted student writes or new dependencies.

## Review focus

1. Longest story/choices plus revealed feedback must remain reachable on the smallest active view.
2. Browser rejecting fullscreen must retain the complete viewport lesson and a working exit.
3. Picture failures must show a concrete recovery message and leave reading/audio usable.
4. Switching tabs or entering/exiting must preserve selection and first-response evidence.
5. Single-scene/comic art must match exact object states and sequence, with no invented events.

## Task 1 — Authored visual plans and all raster assets

Files: create `src/content/comprehension/pictures.js`, `tools/checkComprehensionPictures.mjs`, `tests/unit/comprehensionPictures.test.js`, `public/images/comprehension/passages/*.webp` and `docs/content/comprehension-images/provenance.json`.

Interfaces: `COMPREHENSION_PICTURES` is an object keyed by passage ID. Each record has `sourceText`, `textSha256`, `kind` (`scene` or `comic`), `panels` (1 or 3 `{scene,alt}` records), `alt`, `src`, `referencePath`, and `prompt`. `passagePicture(passage)` returns its matching record or null when the source text differs. Authoring lives in `tools/authoring/comprehensionPictures.mjs`; `tools/generateComprehensionPictures.mjs` omits prompts from the generated runtime module. Paths are `/images/comprehension/passages/<passage-id>.webp`, preserving existing legacy images in the parent directory.

- [x] Author and independently check all 72 exact visual plans and six character references.
- [x] Add tests for exact coverage, source hash, 1/3 panels, concrete alternatives and stable local assets; watch required missing-assets check fail before production.
- [x] Generate real story art through built-in image_gen with inspected character references. Store final optimized WebP inside the repository, plus source/generation/hash provenance.
- [x] Inspect every final picture against its story at display size; repair errors. Decode every asset, verify dimensions, hashes, source match and no orphan paths.

## Task 2 — Responsive fullscreen lesson

Files: modify `src/components/comprehension/ComprehensionPage.jsx` and `comprehension.css`; create focused stage components/hooks if needed; extend `tools/checkComprehensionBrowser.mjs` or add `tools/checkComprehensionFullscreen.mjs`.

Consumes `passagePicture(p)` from Task 1. The normal workspace and full-screen stage use the same question/practice state. Full-screen controls and view changes preserve state; the stage shows/hides the exact story image with a visible failure state.

- [x] Add failing browser cases for native/fallback entry, shell-free stage, body/active-view zero scroll, complete text/options, support/feedback, Escape/focus and preserved retry/selection.
- [x] Implement the full-screen stage with Read/Pictures/Questions tabs or text paging when needed, using shared accessible focus behavior and native fullscreen when supported.
- [x] Verify all 72 stories, longest choices/evidence, completion and image failure across the six required dimensions. Inspect rendered screenshots and actual interactions; fix overflow rather than suppressing it.
- [x] Re-run the existing comprehension browser and child/device gates.

## Task 3 — Picture print pages, integration and release

Files: modify `src/content/comprehension/print.js`, `tools/checkComprehensionPrint.mjs`, comprehension unit tests and `docs/product/READING_COMPREHENSION.md`.

Consumes the same `passagePicture(p)` record. Add print variant `picture`: one A4 page per story with the original story, large approved picture and concrete picture-retell instruction. Existing choice/written/draw/teacher formats retain their content and keys. UI adds the picture variant and batch action.

- [x] Add failing print cases for picture coverage, self-contained raster embedding, page count, complete story, alt, and unchanged answer keys.
- [x] Implement the separate picture variant and integrate its controls through the UI owner; test popup and preview paths.
- [x] Render all 72 picture sheets; inspect layouts/content; deliver `.artifacts/comprehension/reading-comprehension-picture-stories.pdf`.
- [x] Run focused suites, applicable question/image/mobile/worksheet checks, full regression/lint/build/hygiene; obtain independent whole-patch review and resolve material findings.
- [ ] Commit named files, fetch/recheck main, publish through protected PR/CI and existing production pipeline. Verify exact hosted source/assets and native teacher controls.
- [ ] Retain final PDF/evidence; remove reproducible task caches/failed generations only after protected-root and reference checks. Report actual release and verification boundaries.

Release execution and the final hosted/cleanup results are recorded in
`.artifacts/comprehension/release.json`, `hosted-check.json` and `cleanup.json`.
These generated receipts are deliberately excluded from source control.
