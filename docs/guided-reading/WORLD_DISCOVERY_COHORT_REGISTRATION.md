# World Discovery cohort registration

The published first fifty books remain immutable. The confirmed expansion is 50
additional books, ten at each public App level A–E, for 100 World Discovery
books in total. `src/content/world-discovery/cohorts.json` declares two ordered
cohorts. Both `01-10` and `11-20` are registered and active in the source catalogue.
Their exact source, complete-book reviews, media and screening inventories are
bound by separate registration receipts. Publication still requires the global
release, browser and live-deployment checks below.

Each cohort contains ten consecutive numbers at each of A–E: `01-10` and `11-20`.
Numbers repeat the existing ten topic strands;
they do not justify repeating a manuscript or inquiry. Every cohort declares
50 books and 440 pages independently of the files currently present. An editorial
page-count exception requires updating the reviewed declaration explicitly.

## Sources and preservation

The original five level JSON files, `reviews.json`, cast, references, receipts,
illustrations, card copies and consumed audio stay unchanged. New final sources
belong in `src/content/world-discovery/cohorts/11-20/`, with the same five
`level-{a,b,c,d,e}.json` files and a separate `reviews.json`. Drafts may remain
under `.artifacts/world-discovery-expansion/manuscripts/first-50/` while authored.
Do not import these draft files into runtime code.

The fixed preservation fixture in `tests/fixtures/world-discovery/published-first-50.json`
pins the production merge `8c6079d9dfa623a6820f5bef32a320867980883d`.
Its test reads actual original media bytes, including shared vocabulary clips;
626 newly generated clips were only part of the 1,742 consumed audio files.
Do not refresh this fixture to accept an expansion side effect.

The original series orders remain 1–50. Later orders use
`cohort.index * 50 + levelIndex * 10 + number - cohort.firstNumber + 1`, yielding
51–100 without renumbering any original book. IDs and media folders remain
`world-discovery-a-11` and `/guided-reading/world-discovery/a-11/`, etc.

## Isolated production

The production tools retain their original defaults. To select a draft cohort:

```sh
node tools/worldDiscoveryImageJobs.mjs job world-discovery-a-11 reference \
  --source-dir .artifacts/world-discovery-expansion/manuscripts/first-50 \
  --first-number 11 --last-number 20

node tools/prepareWorldDiscoveryNarration.mjs \
  --source-dir .artifacts/world-discovery-expansion/manuscripts/first-50 \
  --first-number 11 --last-number 20 \
  --output-dir .artifacts/world-discovery-expansion/audio/11-20
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
jobs always prohibit text. Layout, labels and briefs are part of the manuscript
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

Once final sources are placed at their declared checked-in paths, prepare card
copies without activating books or changing the global card manifest:

```sh
node tools/buildGuidedReadingCoverRenditions.mjs --world-discovery-cohort 11-20
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
node tools/registerWorldDiscoveryCohorts.mjs --plan-audio 11-20
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
node tools/registerWorldDiscoveryCohorts.mjs --audit 11-20
node tools/registerWorldDiscoveryCohorts.mjs --register 11-20
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

This fails until both declared cohorts and all 100 books are registered and
pass release checks. Keep the original fifty-book release evidence unchanged and
record expansion evidence separately. Use the existing PR-triggered Security
workflow, normal merge, automatic production deployment, and exact live UI/media
verification. A manual workflow-dispatch success does not satisfy the required
Security check. No workflow/protection bypass or manual deployment is part of
this process.

Preserve the original browser evidence when checking the expansion:

```sh
LP_WORLD_DISCOVERY_EVIDENCE_DIR=.artifacts/world-discovery-expansion npm run test:world-discovery
```

This changes only the evidence directory; it still exercises all 100 books.
