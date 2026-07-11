# Media Resolution Migration Audit

## Scope

This is the Phase 1 audit and first safe implementation pass for centralizing media resolution. It inspected Learn, Learn decks, Guided Reading, assessment media, public media roots, and the main manifests without changing assessment scoring, Supabase/auth, reports, Guided Reading record saving, or student progress/mastery logic.

## Current Media Roots

- `public/media` - 2,739 files. Main Kimi/imported media root with `initial-sounds`, `final-sounds`, `rhyming`, `vocabulary`, and `learn` subfolders.
- `public/audio` - 1,186 files. Child mode, choice audio, high-frequency word audio, and generated/approved speech assets.
- `public/guided-reading` - 5,794 files. Guided Reading covers, pages, narration, sync files, regenerated packs, and series assets.
- `public/learn-decks` - 84 files. Teacher-created deck slide images and PPTX download files.
- `public/images` - 414 files. Child mode, comprehension, grammar, object, phonics, scene, and vocabulary images.
- `public/books` - currently empty.

## Current Image Fallback Patterns

- Learn deck slide images previously used `slide.image` directly in `LearnDeckPlayer`, with a placeholder only when the `image` field was absent.
- Learn interaction card images used `LearnCardImage`, which fell back to a single-letter tile only when the `image` prop was absent.
- Learn area cycle resources use local maps in `LearnAreaPage.jsx` and fall back to text tiles or omitted images.
- Guided Reading pages and covers use direct `book.coverImage`, `page.image`, `cover`, and `coverUrl` fields in `AppPages.jsx` and `LearnAreaPage.jsx`, with several local placeholder branches.
- Assessment images are resolved through many direct field checks such as `imagePath`, `imageUrl`, `targetImage`, card image fields, and generated media fields in `App.jsx` and `AppPages.jsx`.

## Current Audio Fallback Patterns

- Learn deck card audio used `new Audio(audio)` directly and swallowed playback errors.
- Learn area built-in lesson audio uses hardcoded `LEARN_AUDIO_BY_CYCLE` paths and renders native `<audio controls preload="none">` only when a path exists.
- Assessment audio uses `getApprovedAudioPath`, `getPreferredAudioPath`, `audioManifest`, `HEAD` checks, and browser speech fallback from `App.jsx`.
- Guided Reading page, book, and word audio use `new Audio(...)`, page sync metadata, `pageAudio`, word `audioPath`, and explicit pause/cleanup logic in `AppPages.jsx`.
- Child mode uses its own speech/audio fallback chain and is intentionally untouched in this pass.

## Duplicated Helper Logic

- Local path normalization happens implicitly in many places by trusting `image`, `imagePath`, `audio`, `audioPath`, `coverImage`, `pageAudio`, and `src` fields.
- Missing image fallbacks are reimplemented as one-letter tiles, cover initials, page placeholders, or omitted media.
- Missing audio fallbacks are either hidden buttons, native audio omission, speech synthesis, or swallowed playback errors.
- Assessment audio approval logic exists in `audioPreferenceManifest.js`, but Learn and Guided Reading do not share a small resolver wrapper yet.

## Missing/Broken Path Risks

- A malformed Learn deck card image/audio path could previously be sent directly into `<img>` or `new Audio`.
- A broken slide image path rendered a broken image instead of the existing slide placeholder.
- External URLs could accidentally be passed into Learn card media if deck metadata gained them.
- Guided Reading has a large asset surface with direct `pageAudio`, `coverImage`, and `image` references; this pass adds resolver helpers but does not wire them yet.
- Assessment media has multiple valid sources and approval rules; this pass exposes `resolveAssessmentAudio` but does not alter assessment runtime behavior.

## Components With Direct Media Path Assumptions

- `src/components/LearnAreaPage.jsx` - hardcoded Learn image/audio maps; direct Guided Reading cover/page image rendering; native audio for built-in lesson cues.
- `src/components/LearnDeckPlayer.jsx` - slide image paths and deck media diagnostics.
- `src/components/learn/LearnCardMedia.jsx` - card image/audio rendering for Learn deck interactions.
- `src/components/learn/TurnCardReveal.jsx`, `SortCardsGame.jsx`, `WordWallGame.jsx`, `SoundSafariGame.jsx` - card media passed through `LearnCardMedia`.
- `src/components/AppPages.jsx` - Guided Reading images/audio, assessment stimulus media, and answer choice media.
- `src/App.jsx` - assessment normalization, media QA filtering, audio manifest loading, and speech fallback.
- `src/data/elSkillsBlockCycles.js` - cycle data with content but not yet colocated image/audio metadata.
- `src/data/learnDecks.js` - deck slide image and PPTX paths.
- `src/data/guidedReadingBooks.js` and `src/data/guidedReadingSeriesBooks.js` - book covers, page images, page audio, word audio.
- `src/data/audioPreferenceManifest.js`, `src/data/audioManifest.js`, `src/data/publicMediaInventory.js` - approval and inventory manifests.

## What Changed In This Pass

- Added `src/utils/mediaResolver.js` with:
  - `resolveLearnImage`
  - `resolveLearnAudio`
  - `resolveDeckSlideImage`
  - `resolveGuidedReadingImage`
  - `resolveGuidedReadingAudio`
  - `resolveAssessmentAudio`
  - `hasMediaPath`
  - `normalizeMediaPath`
  - `createMediaFallbackLabel`
- Updated `src/components/learn/LearnCardMedia.jsx` so Learn deck card images/audio use the shared resolver.
- Updated `src/components/LearnDeckPlayer.jsx` so slide images use the shared resolver and broken slide images fall back to the slide placeholder.
- Kept Learn deck audio user-triggered only; no autoplay was added.
- Added dev-only console warnings for Learn deck media paths that the resolver treats as unavailable.
- Added `tools/checkMediaResolverContracts.js` to verify resolver exports, Learn card fallback behavior, no Learn deck autoplay, no external PowerPoint embeds, slide placeholder support, and build success.

## Deliberately Not Changed

- No media files were moved or deleted.
- No large public media folders were reorganized.
- No assessment scoring, reports, Supabase/auth, Guided Reading record saving, or student progress/mastery logic was changed.
- Guided Reading and assessment rendering were not rewired to the resolver in Phase 1; the resolver now provides the safe API for that later migration.
- `LEARN_IMAGE_BY_WORD`, `LEARN_IMAGE_ALIAS_BY_WORD`, and `LEARN_AUDIO_BY_CYCLE` remain in `LearnAreaPage.jsx` for now. Moving those into cycle data is a larger content migration.
- No external PowerPoint viewer/embed was introduced; PPTX remains download-only.

## Recommended Migration Steps

1. Move Learn image/audio maps into cycle data gradually, starting with cycles 1, 8, 15, and 23, while keeping `resolveLearnImage` and `resolveLearnAudio` as the rendering boundary.
2. Update `LearnAreaPage.jsx` built-in lesson cards and resource tokens to consume media objects from cycle data.
3. Wire Guided Reading image/audio rendering through `resolveGuidedReadingImage` and `resolveGuidedReadingAudio`, preserving existing read-aloud and record-save behavior.
4. Wire assessment audio display points through `resolveAssessmentAudio` only where it preserves current `getApprovedAudioPath` behavior exactly.
5. Add a generated media inventory check that compares resolver-valid paths against `publicMediaInventory`.
6. Extend Learn deck contract checks to verify that declared `/learn-decks/...` files exist on disk once deck authoring stabilizes.

## Risks

- Resolver validity currently means "safe local public path shape", not "file definitely exists on disk" in the browser.
- Assessment audio behavior is intentionally delicate because it mixes approved audio, generated manifests, fallback `HEAD` checks, and speech synthesis.
- Guided Reading has the largest media surface and should be migrated in small visual QA batches.
- Cycle data migration can create content churn if image/audio metadata is embedded before the data shape is finalized.

## Validation Commands

Run these after this pass and after each later migration slice:

```sh
node tools/checkMediaResolverContracts.js
node tools/checkLearnDeckContracts.js
node tools/checkLearnAreaContracts.js
node tools/checkMobileLayoutContracts.js
node tools/checkAssessmentRuntimeSafety.js
npm run build
git diff --check
```
