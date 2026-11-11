# World Discovery cohort registration

During this additive expansion, the existing published books remain unchanged.
All three cohorts are locally registered: 150 World Discovery books, including
the 50 nonfiction books in `21-30`, ten in each production band A–E. Current
independent public shelves are 30 A, 30 B, 30 C, 31 D and 29 E across the series.
`src/content/world-discovery/cohorts.json` declares three ordered cohorts.
`01-10`, `11-20` and `21-30` are active in the local source catalogue. The complete
local Guided Reading runtime contains 447 books, including 217 nonfiction.
Their exact source, complete-book reviews, media and screening inventories are
bound by separate registration receipts. Publication still requires the global
release, browser and live-deployment checks below; local activation does not
claim that those checks are complete or that the new books are live.

Each cohort contains ten consecutive numbers at each of A–E: `01-10`, `11-20`
and `21-30`. The first two retain the `original` topic profile (the backward-compatible
default). The third must explicitly declare `nonfiction-discovery`, with the ten
exact topics in the [content Bible](WORLD_DISCOVERY_CONTENT_BIBLE.md). The shared
authority is `src/data/worldDiscoveryTopicProfiles.js`. Profile changes cannot
reinterpret published cohorts, and all fifty new books must be nonfiction.
Topic strands never justify repeating a manuscript or inquiry. Every cohort declares
50 books and 440 pages independently of the files currently present. An editorial
page-count exception requires updating the reviewed declaration explicitly.

## Sources and preservation

The original five level JSON files, `reviews.json`, cast, references, receipts,
illustrations, card copies and consumed audio stay unchanged. Existing second-cohort
sources and evidence are also preserved. New final sources belong in
`src/content/world-discovery/cohorts/21-30/`, with the same five
`level-{a,b,c,d,e}.json` files and a separate `reviews.json`. Drafts may remain
under `.artifacts/nonfiction-next-50/manuscripts/` while authored.
Do not import these draft files into runtime code.

The fixed preservation fixture in `tests/fixtures/world-discovery/published-first-50.json`
pins the production merge `8c6079d9dfa623a6820f5bef32a320867980883d`.
Its test reads actual original media bytes, including shared vocabulary clips;
626 newly generated clips were only part of the 1,742 consumed audio files.
Do not refresh this fixture to accept an expansion side effect.

The owner's 9 November 2026 instruction separately authorizes repairs across the
entire Guided Reading catalogue. That maintenance follows the versioned repair
route below. The original fixture, original registration receipts and original
narration reports remain historical evidence; a separate reviewed maintenance
snapshot protects the repaired catalogue. This exception does not authorize an
expansion to rewrite earlier books.

The original series orders remain 1–50. Later orders use
`cohort.index * 50 + levelIndex * 10 + number - cohort.firstNumber + 1`, yielding
51–100 for the second cohort and 101–150 for the third without renumbering any
existing book. New IDs and media folders are `world-discovery-a-21` and
`/guided-reading/world-discovery/a-21/`, etc.

## Isolated production

The production tools retain their original defaults. To select the `21-30` nonfiction
cohort explicitly (use a separate draft directory instead if still authoring):

```sh
node tools/worldDiscoveryImageJobs.mjs job world-discovery-a-21 reference \
  --source-dir src/content/world-discovery/cohorts/21-30 \
  --first-number 21 --last-number 30 --topic-profile nonfiction-discovery

node tools/prepareWorldDiscoveryNarration.mjs \
  --source-dir src/content/world-discovery/cohorts/21-30 \
  --first-number 21 --last-number 30 --topic-profile nonfiction-discovery \
  --output-dir .artifacts/nonfiction-next-50/audio/21-30
```

Pass the same source flags to image `install`. The exact job JSON and prompt
must match the current manuscript/state hash. For an intentional repair prompt,
keep its JSON `prompt` and text file identical and preserve exact references.
Installation records pending review; it never grants visual approval.

Declare page `imageLayout` only where a reviewed brief needs an
`integrated-diagram` or `comparison-diagram`. The default `scene` stays one
coherent moment without panels or insets. Diagram prompts allow only authored
explanatory elements, never a contact sheet. Nonempty `embeddedImageText` is an
exact lettering whitelist; an empty value prohibits all text. Cover and reference
jobs always prohibit text. Optional `coverImageLayout` permits only the diagram
elements explicitly specified in `coverBrief`, with no lettering. Reference-board
prompts explicitly ignore any lettering requested by their opening-page context.
Layout, labels and briefs are part of the manuscript
hash, so finalize them before generating images and keep receipts current.

Narration preparation requires all fifty manuscripts and independent matching
text reviews. It emits a content-hashed unpublished snapshot and its SHA-256.
Use those with the existing `generateGuidedReadingLedaGaps.mjs` manuscript-file,
manuscript-sha256, book-prefix and preserve-existing options. Run its dry-run
collision check first. Existing Leda mappings, exact pronunciation repairs and
shared clips must remain unchanged. This guide does not change audio authorization.

Genuine heteronyms and cohort-scoped clarity repairs use explicit reviewed entries in
`src/content/guidedReadingContextualWordAudio.json`, bound to book ID, page number,
exact page text, token, IPA and audio bytes. The reader, session preloading and
release inventories resolve the same page context. Unrelated callers retain their
existing dictionary clip; stale explicit context fails closed. These entries do
not edit the manuscript or overwrite a shared pronunciation.

The unpublished 11–20 cohort's eight superseded generic word takes use already
reviewed same-meaning defaults through `worldDiscoveryExpansionAudioRepairs.mjs`.
The rejected duplicate ribbon-bow take uses only its exact C12 page8 context;
the shared `bow` dictionary remains unchanged. Their nine removals are recorded
in `isolatedWordSupersessions` in the existing book-retirement manifest. The
media-overwrite gate verifies pinned production/source history, exact old and
retained recovery bytes, absence of live references, current accepted word and
pronunciation contexts, decoded replacement bytes and durable generator aliases.
An ignored recovery copy is required review evidence, not public media. This
scoped record does not permit removal of published or unrelated clips. Run
`node tools/checkMediaOverwriteRisk.js --validate-word-audio-retirements` to
revalidate the evidence, including after the deletion commit.

Once final sources are placed at their declared checked-in paths, prepare card
copies without activating books or changing the global card manifest:

```sh
node tools/buildGuidedReadingCoverRenditions.mjs --world-discovery-cohort 21-30
```

The isolated output is generated delivery metadata, not a review. Directly inspect
every card and write the declared cohort `card-cover-review.json` with method
`codex-direct-card-rendition-inspection`, evidence, and exactly fifty `assets`.
Each asset binds `canonicalSource`, `sourceSha256`, `path` and `sha256`.

## Evidence and registration

Every final cover, page and book reference requires its current direct-inspection
receipt under `source-art/world-discovery/receipts/`. Expansion receipts also bind
the complete selected manuscript hash. A complete per-book 12-category scorecard
must match the text, score at least 38/48 with no category below three, and have
no unresolved manuscript or media defects. Automated checks do not establish
editorial quality, factual truth, image meaning or human listening.

After final audio bindings and complete review metadata are stable, write the
explicit audio screening inventory:

```sh
node tools/registerWorldDiscoveryCohorts.mjs --plan-audio 21-30
```

The inventory partitions every consumed audio path, role, text and actual hash
into `required` screening and exact unchanged `reused` clips from prior registered
cohorts. A changed hash or different text/role cannot inherit reuse evidence.
The cohort narration report must cover exactly the `required` set with the
existing full-decode, signal and recognition evidence fields. Previously
registered reports remain unchanged. Replanning invalidates a stale report or
registration; neither file length nor a status label defines expected coverage.

Audit without changing registration, then register only after all findings close:

```sh
node tools/registerWorldDiscoveryCohorts.mjs --audit 21-30
node tools/registerWorldDiscoveryCohorts.mjs --register 21-30
```

Registration runs complete source/review/media checks before writing anything.
It writes a compact hash-bound receipt, updates the generated static import module
and activates that one cohort in declared order. It changes no manuscript,
authored review or media file and performs no hosted action. Inactive cohorts have
no imports, metadata or library entries. A flag or text fingerprint alone cannot
activate a cohort. Post-registration source/review changes fail the runtime
binding; media changes fail registration checks before metadata generation/build.

## Canonical integration and release

Registration establishes the complete cohort-local evidence needed to resolve the
runtime/generator dependency. It is not publication. Immediately update the
existing global text-analysis/index, card-rendition, narration-clearance/provenance,
Story Bible policy registration and scoped app/page visual registries from the
already inspected cohort. Use per-book visual registration, preserving old rows.
The global card builder reuses valid unchanged renditions rather than re-encoding
their source images. Canonical generators and `prebuild` verify current cohort
registration hashes.

Run the original checks and complete reader coverage:

```sh
npm run check:world-discovery-registration
npm run check:world-discovery
node --test tests/unit/worldDiscoveryBooks.test.js tests/unit/worldDiscoveryCohorts.test.js \
  tests/unit/worldDiscoveryDraftProduction.test.js tests/unit/worldDiscoveryPublishedPreservation.test.js
npm run test:world-discovery
```

`check:world-discovery` checks every active cohort and the union of its exact
narration evidence against the real runtime. All existing global story, level,
narration, visual, regression and device gates remain required. The browser suite
uses declared registered counts, traverses every selected book and exercises class
reading for every active cohort and level. `LP_WORLD_DISCOVERY_BOOK_IDS` supports
bounded diagnostic reruns; it does not redefine complete release coverage.

Final expansion completion additionally requires:

```sh
npm run check:world-discovery-expansion
```

This requires all three declared cohorts and all 150 books to be registered and
pass release checks. Local registration now supplies that cohort membership;
it does not replace the remaining checks. Keep both prior cohorts' release evidence
unchanged and record the new fifty's evidence separately. Use the existing PR-triggered Security
workflow, normal merge, automatic production deployment, and exact live UI/media
verification. A manual workflow-dispatch success does not satisfy the required
Security check. No workflow/protection bypass or manual deployment is part of
this process.

Preserve the original browser evidence when checking the expansion:

```sh
LP_WORLD_DISCOVERY_EVIDENCE_DIR=.artifacts/nonfiction-next-50 npm run test:world-discovery
```

This changes only the evidence directory; it still exercises every active book
(currently 150 locally registered books). All original checks remain required.

## Authorized catalogue repairs

Use `tools/repairWorldDiscoveryCohorts.mjs` for an explicitly authorized repair
of already active books. Additive registration retains its preservation rules.
The legacy source `appLevel` keeps a repair's production slot, ID, media folder,
language limits and ordering stable. The current independent exact-text review
owns its public A–H shelf. A whole-topic replacement may earn another shelf;
registration must validate that review rather than force the old assignment.
The repair manifest must keep cohort membership, IDs, ordering, declared counts,
source directories and active status unchanged. It names new dated registration,
narration-review and narration-inventory files, plus a hash-pinned historical
audio baseline. Existing dated evidence may be reused only when identical;
changed evidence requires a new revision path.

When a repair replaces covers, give `cardReview` a new dated cohort-specific
`source-art/world-discovery/remediation/YYYY-MM-DD/<cohort>-...-card-cover-review.json`
path. Preserve the historical card receipt byte-for-byte at its pinned path.
The new receipt must still bind all fifty current canonical/delivery pairs; a
new path is not visual approval and does not bypass the complete audit.

```sh
node tools/repairWorldDiscoveryCohorts.mjs --plan-audio REVIEWED_MANIFEST.json
node tools/repairWorldDiscoveryCohorts.mjs --audit REVIEWED_MANIFEST.json
node tools/repairWorldDiscoveryCohorts.mjs --register REVIEWED_MANIFEST.json
```

Every repaired cohort still requires complete manuscript and ordered image
review, current cover/card/reference receipts and exact narration evidence.
Historical audio reuse requires the same word, role, path and byte hash; current
pages and titles require screening evidence. A previously screened unchanged
page may reuse its exact evidence. Changed narration gets a new file; historical
published MP3 bytes remain intact.

Keep an image receipt's original generation input distinct from its later
`reviewedManuscriptSource`. The latter binds the exact current manuscript and a
complete-book review containing the installed image hash. Replacing art records
the former generation separately, together with the new prompt, references and
source image. Do not describe a text-only revision as a new image generation.

If an earlier reviewed word retirement refers to text that is now repaired,
preserve its historical entry. Explicit `contextWithdrawals` and
`contextAdditions` may record exact removed or added uses, with current manuscript
and registration hashes. Withdrawals require the word and contextual override to
be absent; additions require the same reviewed meaning, pronunciation and default
audio. Unlisted uses, stale source text, changed bytes or invented historical
contexts fail validation. This maintains retirement proof without freezing
otherwise authorized editorial work.

The November repair provenance is under
`source-art/world-discovery/remediation/2026-11-09/`; broader Guided Reading
narration evidence is under `source-art/guided-reading-remediation/2026-11-09/`.
Registration remains a local integrity check. Global content/media checks,
actual reader interaction, required PR checks and deployed verification still
follow before release is reported complete.
