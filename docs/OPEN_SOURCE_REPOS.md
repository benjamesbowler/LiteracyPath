# Open-source repos worth using for LiteracyPath

Curated 2026-07-04. Vetted against what LiteracyPath actually is: a React/Vite phonics app with narrated books, skill banks, audit scripts, Playwright smoke tests, and a Supabase-backed worksheet bank. Nothing here gets installed blindly — the "Install now" one is safe; the rest are pipeline/data tools Claude uses on demand.

---

## Install now (one safe dev dependency)

### 1. @axe-core/playwright — automated accessibility checks
- https://github.com/dequelabs/axe-core-npm · https://playwright.dev/docs/accessibility-testing
- Why: a kids' app lives or dies on contrast, touch-target size, and focus order. This plugs straight into the existing Playwright smoke suite and flags WCAG issues automatically — no new infra.
- Run this on your Mac (Claude will then wire it into the tests):

```bash
cd /Users/benjaminbowler/Desktop/LiteracyPath
npm install --save-dev @axe-core/playwright
```

---

## Use in the content pipeline (no install into the app)

### 2. Kokoro TTS — free local narration for drafts and QA
- https://github.com/hexgrad/kokoro · https://github.com/thewh1teagle/kokoro-onnx
- Why: Apache-2.0, 82M-param model, runs on CPU, better-than-real-time. Use it to batch-generate placeholder/QA audio for new words and questions so gaps never ship silent — the gold narrator voice stays the canonical voice; Kokoro is only scaffolding until real clips land.

### 3. CMUdict + IPA + frequency list — phoneme ground truth
- https://github.com/menelik3/cmudict-ipa (includes Brown-corpus frequency list)
- https://github.com/stdlib-js/datasets-cmudict
- Why: 134k words with phoneme breakdowns. Powers real decodability checks: verify a word only uses taught sounds, auto-generate rhyme/onset distractors, and strengthen the existing `check:distractor-onset-giveaway` / rhyming audits with data instead of hand lists.

### 4. microsoft/PhoneticMatching — sound-alike comparison
- https://github.com/microsoft/PhoneticMatching
- Why: compares strings by phoneme, not spelling. Useful for catching ambiguous distractors (words that *sound* too close to the answer) in skill banks.

### 5. StoryWeaver Open + GlotStoryBook — thousands of CC-licensed kids' books
- https://github.com/PrathamBooks/StoryWeaverOpen · https://open.storyweaver.org.in/
- https://github.com/cisnlp/GlotStoryBook
- Also: Bloom leveled readers (https://docs.bloomlibrary.org/leveled-readers/)
- Why: 25k+ open-licensed titles, many leveled. A vetted source to expand `public_domain_books` beyond what's there now — filter to CC-BY / Public Domain only, re-illustrate to match the art direction.

### 6. MinerU — PDF → clean text/markdown
- https://github.com/opendatalab/MinerU
- Why (from your list): the one genuinely useful for us. Converts public-domain book PDFs into clean text for the book-import pipeline instead of hand-transcribing.

### 7. voicebox — local voice studio
- https://github.com/jamiepine/voicebox
- Why (from your list): local voice cloning/dictation. Potentially useful for maintaining the gold narrator voice, but treat with caution — verify license and output quality before it touches the audio pipeline. Not adopted yet.

---

## From your list — skipped, with reasons

- **ai-website-cloner-template** — for cloning other sites; nothing to clone, we have our own architecture.
- **Anthropic-Cybersecurity-Skills** — MITRE/NIST security skills; irrelevant to a phonics app.
- **BuilderIO/agent-native** — framework for building agent-first apps from scratch; LiteracyPath is already built, adopting it would mean re-architecture for no user benefit.

---

## Adoption order

1. `@axe-core/playwright` (paste the command above; Claude wires the test + runs the loop).
2. CMUdict data into `tools/data/` to upgrade distractor/decodability audits.
3. Kokoro for placeholder audio on the next content batch.
4. StoryWeaver/MinerU next time we expand the book library.
