# World Discovery

Status: all three fifty-book cohorts are registered and active in the local
source catalogue, for 150 World Discovery books. Cohort `21-30` adds 50 nonfiction
books; the complete local Guided Reading runtime now contains 447 books,
including 217 nonfiction. These are local registration counts, not a claim of
production deployment or completed release verification. Current text and
media fingerprints are enforced by the release checks below. The original
fifty-book source and media remain immutable. Registration and publication are
separate: full app, release and live-deployment verification remain required. The
[cohort registration contract](WORLD_DISCOVERY_COHORT_REGISTRATION.md) owns
expansion paths, immutable-original checks and activation mechanics.

The locally registered collection has thirty books at each public App level
A, B, C, D and E. The first 100 books, in cohorts `01-10` and `11-20`, retain the original ten strands:
identity, relationships, community, fantasy, geography, space, animals, life cycles,
classification and caring for our world. Fantasy is explicitly fiction.
The fifty books in `21-30` are all nonfiction and add ten books at each A–E level. Their
explicit `nonfiction-discovery` topic profile broadens coverage; it does not
reclassify the original books or permit a repeated inquiry with a new title.
Information books use connected inquiries and
checked factual sources. These are predictable/levelled readers, not cumulative
decodables; interest ages 4–8 are separate from text complexity.

The Story Bible Parts I and II, illustration style standard, exact Leda narration
contract, reading-level authority and continuous pass-by-exception policy apply.
There is no change to existing books, placement, scores or quarantine behavior.

## Manuscript and production authority

`src/content/world-discovery/level-a.json` through `level-e.json` hold complete
ordered manuscripts, scene/state ledgers, factual evidence, discussion support
and editorial level rationales. `src/data/guidedReadingWorldDiscoveryBooks.js`
adapts the reviewed sources; `reviews.json` binds independent public-level and
complete-book editorial reviews to exact manuscript and media fingerprints.
Each book has its own
cover and a distinct illustration for every page. Full sequences require visual
review against their text before publication. Generated media is not approval.

Original IDs are `world-discovery-a-01` through `world-discovery-e-10`.
Expansion IDs run from 11 through 20 in the second cohort and 21 through 30 in the
third. The number within each cohort selects its declared profile's strand;
every book still needs a distinct original story or connected inquiry. Image paths are
`/guided-reading/world-discovery/a-01/cover.webp` and `page-01.webp`, etc.

Use 8 pages for A–C and 10 pages for D–E unless an editorial need requires a
different count within the governing band. A uses internal A (maximum 6 words
per page), B internal B (maximum 14), and C–E internal C standard (maximum 22).
Higher public bands come from actual syntax, concept relationships, sustained
meaning and inference, not inflated word counts or a copied requested letter.
Full-text independent calibration must confirm each requested band.

## Fifty additional nonfiction books: cohort 21–30

`src/data/worldDiscoveryTopicProfiles.js` is the shared topic/type authority used
by the cohort contract and all source validation. The `21-30` manifest row must
declare `topicProfile: "nonfiction-discovery"`; no profile is inferred from a
folder name or a book's own claimed topic. All fifty `type` and
`storyBibleReview.kind` values must be `nonfiction`.

| Number at each A–E level | Exact topic |
| --- | --- |
| 21 | transport |
| 22 | geography |
| 23 | human body |
| 24 | weather and earth |
| 25 | physics and engineering |
| 26 | technology |
| 27 | food and making |
| 28 | animals and habitats |
| 29 | everyday knowledge |
| 30 | space and environment |

Each book needs a distinct, concrete inquiry appropriate to its actual reading
level, with checked primary factual sources and complete illustration/narration
production. The original cast, neutral-setting restrictions, language limits,
independent calibration, complete-book review and all release gates below remain
unchanged. Broader human geography topics must respect those setting restrictions
unless the user explicitly changes this authority. Existing subjects may supply
background, but the main inquiry must fill a documented gap or add a materially
new explanation. A transit overview, for example, must not be a renamed version
of the existing bicycle-brake or canal-lock books.

Canonical sources are in `src/content/world-discovery/cohorts/21-30/`, with five
level JSON files and an independent `reviews.json`. The local registration in
`src/content/world-discovery/registrations/21-30.json` binds their current source,
review and media evidence, and the generated cohort module imports them.
Registration does not establish production visibility; release and live checks
remain separate requirements.

## Original cast and world lock

World: World Discovery, ordinary contemporary homes, school, park and community.
No cultural costumes, flags, religious or political settings. Factual animals
have natural anatomy and behavior. Facts never depend on the fantasy rules.

- **WD-KIT / Kit**: human boy, about six, warm light-medium golden skin, short
  straight black hair with a side part, teal short-sleeved shirt, mustard shorts,
  navy sneakers. Compact child proportions. Likes building and testing; tends
  to try the obvious fix first. No glasses, hat, logos or clothing changes.
- **WD-ZOE / Zoe**: human girl, about six, deep brown skin, black hair in two
  round puffs, yellow short-sleeved shirt beneath plum overalls, white sneakers.
  Same standing height as Kit. Notices small differences and likes drawing;
  can be impatient about sharing her tools. No changing hairstyles or clothes.

The locked model sheet must be generated and inspected before page production.
It includes orthographic/three-quarter views, ordinary poses and expressions,
palette and equal-height lineup. Use its actual file as an image reference in
every recurring-cast generation. Adults may remain unnamed and appear only
where needed, with their exact appearance and relative scale locked per book.
No other named recurring cast is introduced without extending this authority.

Fantasy books may establish one concrete magical object/rule near their opening.
The protagonist must act within that rule; unexplained magic cannot solve a
problem. Name the rule and persistent prop state in the manuscript metadata.

## Required per-book source fields

Each JSON array entry contains `id`, `number` (1–10 for the original set;
11–20 or 21–30 for the declared expansion cohorts), `title`, `topic`, `type`
(`fiction` or `nonfiction`), `appLevel`, `level`, `readingBandProfile`,
`readingMode`, `interestAge`, `storyBibleReview`, `setting`, `props`,
`coverBrief`, `pages`, `discussion`, `levelRationale`, and `languagePrep`.
Use `standard`, `predictable-levelled`, and `4–8` for the three corresponding
fields. Fiction review includes `kind`, `canonIds`, `storySpine`,
`failedAttempt`, `resolution`; nonfiction includes `kind`, `canonIds` (possibly
empty), `topicQuestion`, `progression`, `synthesis`, `scienceSources` with exact
URLs and supported claims. Any science in fiction also needs checked sources.

Each page has `pageNumber`, exact final `text`, `imageBrief`, `imageAlt`,
`pageDescription`, `state`, `embeddedImageText` (normally empty). Briefs describe
one specific moment, exact subjects/counts/relationships and changing state;
they must not simply repeat prose. Optional `imageLayout` is `scene` (the default),
`integrated-diagram` or `comparison-diagram`. A diagram declaration permits only
the explanatory cutaway, inset, views or stages explicitly specified in its
brief; it never permits a contact sheet or unrequested panels. Only the exact
nonempty `embeddedImageText` may appear as lettering; otherwise art contains no
text. Optional `coverImageLayout` uses the same three layout values and permits
only the explanatory elements explicitly described in `coverBrief`. References
and covers always contain no text; cover diagrams do not relax that restriction.
The production pipeline adds common style
and cast references. Discussion has `oral: {prompt, listenFor}` and
`visual: {page, prompt, lookFor}`. No scored quizzes. `languagePrep` contains a
few `{word, meaning}` entries for oral support, never a decoding claim.

## Acceptance

Complete all fifty manuscripts in each declared cohort, independently check factual claims and levels,
inspect every final cover/page in sequence, generate exact page/title/missing
word Leda audio and verify its integrity, register current fingerprints and
reviews, exercise the collection in the app, pass applicable checks, and publish
the requested library addition. Report browser/automated/direct visual evidence
accurately; do not claim human listening, classroom or physical-device checks.

## Current implementation and evidence

The 150 locally registered books contain 1,320 reading pages and 150 covers,
with 150 separate library-card renditions. World Discovery is a named child-library
collection; public App levels A–E each contain thirty of its books locally. Teacher browsing, preview,
class reading, word help and oral/visual discussion use the existing reader.

`source-art/world-discovery` retains the locked cast, per-book reference boards,
individual generation/inspection receipts, card review and narration review.
Every cover and page received direct image/sequence inspection; reported anatomy,
prop and scene-continuity defects were repaired and independently rechecked.
The original cohort has 490 new page/title clips and 136 new word clips, using Google Leda;
existing approved word audio is reused. Full decode, signal and independent
recognition checks are documented separately from browser playback. Six
explicit-phoneme clips retain documented recognition ambiguities in
`narration-review.json`; this is not a claim of human listening.

The second cohort uses the canonical sources and complete-book reviews in
`src/content/world-discovery/cohorts/11-20/`. Its 490 final illustrations received
independent full-sequence review after repairs to physical geometry, anatomy,
scene state and framing; all fifty final card renditions were inspected separately.
Its narration inventory contains 1,017 screened clips (490 page/title and 527 word)
and 705 exact prior-cohort reuses. Contextual pronunciations retain exact book/page
bindings. The isolated word `lends` retains a documented recognition ambiguity;
the report preserves the failed negative acoustic control and makes no certified
auditory-identity or human-listening claim. Reported defects remain blocking.

The third cohort's canonical source and reviews are in
`src/content/world-discovery/cohorts/21-30/`. Its local registration binds 50 books,
440 reading pages, 490 final illustrations, 50 card renditions and 51 reference
assets. Its 1,829 consumed audio files comprise 1,074 screened clips and 755 exact
prior-evidence reuses. The source-art receipts retain direct image inspections
and independent sequence reviews; narration screening is automated evidence,
not human listening. This records cohort-local evidence, not completion of the
remaining global, browser or deployment checks.

Run `npm run check:world-discovery` for the exact currently registered release contract
and `npm run test:world-discovery` for all pages, narration, word help,
completion, library order, public-level filters, classroom controls and the
current device profiles. Canonical story, level, narration and app-visual
checks remain required. Task-specific rendered, regression and live-deployment
evidence is retained under ignored `.artifacts/world-discovery/`.
Expansion production and verification evidence belongs under
`.artifacts/world-discovery-expansion/`; original evidence is retained unchanged.
The nonfiction cohort's production, integration and topic-coverage evidence is
under `.artifacts/nonfiction-next-50/`; its `topics/` audit distinguishes the 167
baseline nonfiction books from the 50 additions and records 27 remaining subject
areas with 108 specific inquiry opportunities.
