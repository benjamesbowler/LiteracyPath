# Present mode redesign — 2026-07-28

**Record.** Implements the approved Present-mode redesign (design handoff of 2026-07-28)
across the four files that own the feature. No cycle data was edited; the curriculum
logic (which slides a cycle/day gets) is unchanged from the 2026-07-26 rebuild.

## What shipped

| File | Change |
| --- | --- |
| `src/utils/present/presentationBuilder.js` | Fixed 1920×1080 stage (px sizes, deck.js scales to fit); persistent section rail driven by `data-section`; organic theme (cream/terracotta/sage, Caprasimo for chrome, **Andika stays on every glyph a child decodes**); teacher tip moved to a quiet "For you" strip; new slide types: reveal warm-ups, thinking-time ring, "Everyone together" call-and-response, sight-word sentences; `POSES` whitelist (the `point` pose never existed on disk — slides that asked for it now fall back to `think`); `graphemeFontSize()` steps wide graphemes (Ww/Mm) down so they stay in the circle; new `presentationSlideIndex()` export parsed from the deck's own HTML. |
| `public/present/deck.js` | Stage scaling, rail painting, reveal/timer runtimes; embedded-preview mode — framed same-origin, it hides the start overlay and follows `postMessage` from the picker (the projector popup ignores messages). |
| `src/components/PresentPage.jsx` | Picker rebuilt: day `<select>` → six-tile day grid with real slide counts; structured "What's in this deck" contents list; live preview = the **actual deck in an `<iframe srcdoc>`** with a thumbnail rail driving it. |
| `src/styles/present.css` | New. Picker-side styles only, on the teacher `--lp-*` tokens (the deck palette stays a children's surface). |

## Two defects found in the handoff and fixed during implementation

1. **The thinking-time dial never rendered.** The builder set `data-timer` and deck.js
   ran the countdown, but nothing emitted the `timerDial()` markup (ESLint flagged it as
   unused). `slide()` now renders the dial on timer slides; the corner mascot yields the
   spot (both occupy bottom-right). Locked by a unit test pairing every `data-timer`
   with a `data-timer-start`.
2. **The stage was offset and clipped on every window smaller than 1920×1080.**
   `#scaler` used grid `place-items: center`, but Chromium start-aligns a grid item that
   overflows its track, so the stage hung down-right and the top-left of every slide was
   cut off. Centering is now an explicit `translate(-50%,-50%)` in the same transform
   deck.js scales with. Caught by rendered screenshots, not by tests — the deck HTML was
   byte-identical either way.

## CSP posture (verified empirically, headless Chromium against the production headers)

- `<iframe srcdoc>` **is allowed** under `frame-src 'none'` (about:srcdoc is exempt);
  a `blob:` iframe is **blocked**. The preview therefore uses srcdoc and must never be
  switched to a blob URL. `vercel.json` and `tools/checkCsp.mjs` are untouched.
- The popup deck stays a blob document loading `/present/deck.js` (same-origin, no
  inline script), exactly per the 2026-07-26 CSP fix. Zero CSP violations observed in
  either context.

## Verification (all observed green, 2026-07-28)

- `npm run test:unit` — 1721/1721 (TZ-matched run; `elExportEvidenceConsistency` has a
  pre-existing timezone-literal assertion that fails under UTC with or without this
  change).
- `npm run lint`, `npm run build`, `npm run check:app-copy`, `node tools/checkCsp.mjs` — pass.
- `tests/unit/presentationBuilder.test.js` re-anchored to the new markup and extended:
  slide-index mirror, pose-files-exist, timer-dial pairing, together-slide rotation,
  wide-grapheme sizing.
- Rendered QA: served `dist/` with the production headers; screenshotted the srcdoc
  preview (postMessage-driven through every slide type, reveal + timer live) and the
  popup (start overlay → fullscreen → arrow-key nav, counter advancing).

## Open follow-ups

- `PresentPage` accepts an optional `currentCycleId` and prefers it over the
  `lp-present-last` localStorage memory. No caller passes it yet — the class model has
  no current-cycle field to derive it from. Wiring it is a data-model task, not a
  Present task.
- The three `{world}-point.webp` poses can be commissioned later; add `"point"` to
  `POSES` when they land.
- All Andika/Caprasimo webfonts load from Google Fonts inside the deck (allowed by CSP;
  system fallbacks keep an offline projector legible).
