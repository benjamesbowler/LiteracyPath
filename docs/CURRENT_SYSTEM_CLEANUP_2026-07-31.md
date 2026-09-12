# Current system cleanup — 31 July 2026

## Outcome

The repository now uses the current application as its authority. Duplicate assessment
banks, stale publication rules, person-specific approval requirements, historical
audits, generated evidence dumps, old media requests, obsolete Admin QA inventories,
and disconnected tools have been removed.

## Literacy-only release update — 16 August 2026

The running product is now literacy-only. The former non-literacy learner and teacher routes,
navigation, application modules, previews, styles, tests, generation tools, release
checks, documentation, music, narration and story artwork have been removed. Historical
Supabase migrations remain as immutable database rebuild history, and the live database
has not been destructively altered. Learner-deletion code retains only the two retired
local-storage prefixes and the retired evidence-store name needed to erase legacy data.

Teacher class restoration now starts its class read immediately after account approval,
before loading the optional route-restoration module. Deep-link hydration reuses that same
read rather than starting a competing request. A malformed saved profile or a teacher
route can therefore no longer leave the class list at its initial loading state.

## Lean release retirement — 22 August 2026

The current release no longer includes Class Decodable Press, Class Quest Live,
Observed Change, Paper-to-Progress, Story Crew, or Reading Passport. Their learner
and teacher entry points, runtime components, feature-only content and policies,
styles, tests, verification tools, and unused QR-code dependency have been removed.
The ordinary worksheet library, presentation decks, Guided Reading, Story Quests,
reports, learner exports, and the retained supporting-feature directory remain.

Historical Supabase migrations are immutable rebuild history, and historical rows
from the retired surfaces are preserved for learner export and verified erasure.
The final retirement migration removes 19 feature RPCs, revokes direct access to
the retired feature tables, excludes retired progress from child hydration, and
rejects new Reading Passport or Story Crew progress writes. This source migration
is a pending hosted operation until the linked project is explicitly rechecked.

## Selective agent guidance — 12 September 2026

Repository instructions now use a compact root contract and six domain skills.
The 14 imported style/prompt presets, their generated Stitch design example and
unused installer lockfile were removed after reference checks; their provenance
remains in Git. Task briefs are outcome/acceptance templates, and the mandatory
three-lane process is superseded. Product standards and runtime behavior remain
unchanged. [Agent workflow](engineering/AGENT_WORKFLOW.md) and
[task gates](verification/TASK_GATES.md) are the current operating references.

## Current authoritative sources

### Skills assessment

- `src/data/loadAssessmentSkillBank.js`
- `src/data/v3/v3Registry.js`
- `src/content/blueprints/skillBlueprints.js`
- `src/data/v3/banks/*.v3.generated.js`
- `tools/assessmentRebuild/gate.mjs`

The v3 banks are the only published Skills assessment source. All 30 current skills
must pass G1–G6. Publication has no personal sign-off field and no legacy fallback.
The only current assessment phase threshold is 70%, defined once by
`PHASE_PASS_RULE`.

### Media

- `src/data/assessmentMediaRegistry.js`
- `src/data/assessmentMediaPicker.js`
- `src/data/questionMediaResolver.js`
- `src/data/mediaQaManifest.js`
- `src/data/mediaQaReviewStatus.js`
- `src/policy/betaReleasePolicy.js`
- `src/data/childWordMediaManifest.js`
- `src/data/vocabularyMediaLexicon.js`
- `src/data/vocabularyAudioPreferences.js`
- `src/data/cleanAudioManifest.js`

The beta release policy keeps pending media test-visible so complete product
flows can be exercised. It does not convert pending evidence into human
approval. A quarantined pairing is still removed from runtime immediately, and
the strict human-review completion check remains available separately from the
beta deployment gate.

### Guided Reading and Story Quest

- the current Guided Reading modules listed in `src/data/sourceOfTruthRegistry.js`
- `src/policy/literacyExperiencePolicy.js`
- `src/data/knowledgeJourneys.js`
- `src/data/storyQuests.js`
- `src/utils/storyQuestProgress.js`
- `supabase/migrations/20260801090000_synced_guided_reading.sql`
- `src/data/readingSession.js`
- `src/hooks/useReadingSessionFollower.js`
- `src/hooks/useReadingSessionHost.js`
- `supabase/migrations/20260803120000_guided_reading_publication_gate.sql`
- `src/data/guidedReadingPublication.js`

Shared reading uses the existing opaque child token boundary and visible-only
one-second polling. The frozen session page list, six reviewed RPCs, and ordinary
per-child `guided_reading` progress rows are the single current synchronization
and marking path; there is no parallel push implementation.

Guided Reading child publication is separately fail-closed and role-based. Missing
reviews and quarantined books are hidden on all child paths; an app-admin Pass
decision is the single action that makes a book available to children. A Fail
decision requires a repair note and keeps the book quarantined. This does not
restore any named-person approval rule.

### Child games

- `docs/design/GAME_DESIGN_BIBLE.md`
- `docs/design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md`
- `src/data/learnGamesData.js`
- `src/components/learn/games/games/index.js`
- `src/components/learn/games/shared/arcadeVerticalSliceBriefs.js`
- `src/components/learn/games/shared/premiumGameStandard.js`
- `docs/SOUND_SEEKERS_RELEASE_BIBLE.md`
- `src/components/quest/QuestRoot.jsx`
- `docs/3D_ASSET_LIBRARY.md`

The Game Design Bible remains the product-rule authority for learning, controls,
accessibility, privacy and shipping. The production quality guide is its single
provider-neutral implementation workflow for authored art, asset production,
game feel, camera, audio, quality tiers, direct review and evidence. Automated
contract or renderer checks do not by themselves certify visual, motion,
listening, physical-device or child-play quality.

## Problems corrected

- Removed old question-bank discovery, release/exposure manifests, generated shards,
  item-universe files, and fallback loading.
- Replaced multiple mastery definitions with the current blueprint and 70% phase rule.
- Removed the obsolete 85% level rule and the random-guess Monte Carlo threshold.
- Removed the obsolete WS9 bundle ratchet and its future-dated 500 KB/150 KB
  target. It contradicted the current working production build and falsely
  classified established chunks as unapproved new work. Current build and
  split-boundary checks remain; any future performance budget must be based on
  the then-current application rather than a historical schedule.
- Removed the G7/person-signoff publication requirement and related status language.
- Removed stale Admin assessment-audio inventory pages and data that described old
  paths and retired banks.
- Regenerated the Admin public-media inventory directly from the current public
  folder: 9,068 images and 20,856 audio files.
- Consolidated three overlapping child-word media manifests into one current
  manifest while preserving the runtime's existing selection priority.
- Renamed the retained vocabulary and clean-audio sources around product purpose,
  removing obsolete provider ownership from current filenames and metadata.
- Removed disconnected Initial Sounds and media-style registries that were still
  indexed despite no longer being valid runtime sources.
- Removed tools and package commands that regenerated retired audits, workbooks,
  inventories, contact sheets, or legacy banks.
- Removed old release scorecards, waivers, implementation roadmaps, provider handoffs,
  preview evidence, and historical audit documents.
- Removed historical generated release artifacts, audio-recording packs, image-QA
  sheets, preview folders, and obsolete media-request folders.
- Moved any newly generated local release or QA evidence to ignored `.artifacts`
  or operating-system temporary storage so it cannot become documentation authority.
- Replaced the documentation index and work workflow with current-source rules.
- Replaced the overlapping `CLAUDE.md`, 471-line operating manual, quick reference,
  and former agent rules with one concise `AGENTS.md` authority policy.
- Removed a 3.4 GB untracked audio-production workspace containing 85,771 staging,
  review, audition, alternate-engine, and reconciliation files. The installed
  production audio under `public` remains intact.
- Removed 20 disconnected audio production/review/install tools whose only input
  was that retired workspace.
- Removed the 4.7 MB completed assessment media-production request and changed
  audio coverage to derive directly from the current v3 banks.
- Removed disconnected manual preview harnesses, old child-login diagnostic SQL,
  provider handoff instructions, obsolete performance/lexicon reports, and
  repetitive machine-local source-board notes that were not used by the application.
- Consolidated the current quest-art provenance into
  `public/game-assets/quest-pixel/SOURCE.md`; runtime tests now verify that one
  record instead of 22 overlapping per-folder notes.
- Removed the disconnected skill-progression exception list and old question-bank
  workbook repair tool. Neither was imported, package-wired, or operational.
- Removed obsolete Sound Seekers mastery history from live comments and test names;
  they now describe only the current rules defined in `MASTERY_RULES`.
- Replaced the historical App.jsx 3,000-line milestone with direct checks for the
  current session and rendering boundaries.
- Removed the old Sound Seekers pixel-bundle byte, module-count, and percentage-
  reduction ceilings. Its maintained check now verifies the current lazy-chunk
  architecture and required/forbidden subsystems without a historical baseline.
- Deleted the tracked assessment rebuild gate reports (including their former
  personal-signoff history). Future `--write` evidence goes only to ignored
  `.artifacts/assessment-rebuild`.
- Routed repository-hygiene output to ignored `.artifacts/repo-hygiene` instead
  of the deleted `docs/validation` audit tree.

## Permanently retired — do not restore

- Class Decodable Press, Class Quest Live, Observed Change, Paper-to-Progress,
  Story Crew, and Reading Passport
- pre-v3 Skills assessment banks, shards, manifests, and release boards
- personal approval fields such as `signedOffBy`, `reviewedBy`, “Ben approved,”
  or “pending Ben”
- G7 human sign-off and any publication rule tied to a named person
- random blind-guess trial thresholds, including the former 10,000-trial/0.1% rule
- alternate assessment pass thresholds such as retired 80%, 85%, or 90% rules
- the WS9 blanket bundle-size schedule, its 500 KB/150 KB main-entry target,
  and its generic 250 KB “new chunk” approval rule
- dated audits, remediation receipts, release scorecards, waiver boards, and loop logs
- Kimi/Claude/Codex handoff prompts and import reports
- generated contact sheets, review workbooks, listening packs, preview evidence,
  superseded images/audio, and inventories for deleted paths
- disconnected scripts that create any of the above

## Remaining local problems

No unresolved rule, dataset, bank, media-selection, import, lint, unit-test, or
build conflict was found by the final local checks. The production build still
reports advisory large-chunk warnings, and repository hygiene reports nine
warnings for current generated or intentionally large production files. These
are not alternate product rules and neither check failed.

Final local evidence:

- lint: pass
- unit tests: 1,836 passed, 0 failed
- production build: pass
- split boundaries: pass
- v3 assessment rebuild: all 30 skills passed G1-G6
- repository hygiene: pass, 0 failures and 3 advisory warnings
- documentation index: all retained local links resolve
- patch whitespace validation: pass

## Remaining limits

Local automated checks can prove source consistency, unit behavior, and buildability.
They do not prove the state of a hosted database, signed-in production environment,
physical device, or external service. Those environments should be checked only when
a release specifically requires them; their absence does not revive any retired local
rule or dataset.

## Cycle Practice activity replacement

Cycle Practice now owns its pictured six-mechanic curriculum and renderer in
`src/components/cycle-practice`. Its old Adventure Map rendering, confirmation
controls and Cycle-only Adventure CSS are removed. Shared Adventure code remains
active for Adventure Map. The current contract is
[Cycle Practice](product/CYCLE_PRACTICE.md).

## Adventure Map simple games

The [Adventure Map contract](product/ADVENTURE_MAP.md) replaces the retired
distinct-mechanics plan and spec. Sound-gate, word-window, word-machine,
multi-step poetry/fluency and tracing renderers and their exclusive state/tests
and styles are removed after checking references. Shared letter-writing
utilities remain active for other surfaces. Ten direct matching, phonics,
rhyming and picture-search games now supply the existing teacher station IDs.
Silent and superseded Adventure instruction files are removed and replaced by
audible recordings with new filenames; shared word/phoneme audio is retained.
All removed tracked files remain recoverable in Git history.

## Arcade engine restoration

The original Arcade engines are the active runtime. Superseded select/confirm engine modules and their exclusive tests were removed; Git retains recovery history. Shared result-save protection, current classroom code and music preferences are preserved. The Game Design Bible requires gameplay preservation.

Mandatory Arcade instruction cards and startup countdown gates were removed on 2026-09-10. Cycle and phonics response controls no longer wait for narration; replay and actual audio-delivery evidence are retained.

## Game upgrade planning correction — 10 September 2026

The complete gameplay/graphics/learning plan now covers 22 catalogue games plus Sound Seekers. The untracked eight-game draft was expanded and renamed rather than retained as a competing plan. Stale brain descriptions of the rejected select/confirm engines were replaced with the restored-runtime baseline and current upgrade handoff. The Story Trail plan now marks the newer gameplay/pacing requirements explicitly. No runtime code, learner data or user source assets were removed by this documentation pass.


## Sound Seekers campaign cutover — 10 September 2026

The local child route now mounts `v3/SoundSeekersCampaign.jsx`: three worlds,
30 stages, 150 main missions and 60 optional quests. The current contract is
[Sound Seekers release bible](SOUND_SEEKERS_RELEASE_BIBLE.md). This entry records
local implementation and scoped cleanup, not a pushed or deployed release.
The twenty-hour main campaign remains a production estimate requiring measured
first-play timing; authored records and automated completion do not validate it.

After retargeting maintained tests and verifying zero executable references in
`src`, `tests` and `tools`, these disconnected files were removed from
`src/features/soundSeekers/v3/`: `SoundSeekersV3.jsx`,
`sound-seekers-v3.css`, `render/mapScene.js`, `render/encounterScene.js`,
`engine/director.js`, `engine/audio.js` and `storage.js`. Git retains recovery
history. Shared cast, trail, sprites, curriculum, challenge authority and target
ledger modules remain active inputs and were preserved. Existing learner saves
continue through the campaign storage adapter on the same journey row.

`tests/unit/soundSeekersGameContract.test.js` now exercises the real campaign's
eight-Pal chooser and hub controls. `tests/unit/soundSeekersV3.test.js` now
builds campaign missions while retaining shared authority, decodability, target
ledger and source-media regressions. The two focused suites passed 20 tests;
focused lint passed. Legacy QuestRoot preview, pixel, pacing and offline gates
still have distinct consumers and must not be described as campaign coverage.

The initial 1,205 campaign audio files were expanded to 3,820 current MP3s.
All retain exact script and byte-hash provenance; the final sequential
210-mission build resolves 4,413 audio references with zero missing files.
The expansion adds 876 oral transfer situations and 180 sentence/grammar
situations, with the runtime retaining correlated-phase evidence boundaries.
Twenty-three superseded unsupported spatial-choice label clips were removed
after exact reference checks; one changed spatial prompt was regenerated.
A palette-only source refactor required provenance re-verification, not audio
regeneration: original generation source hashes are preserved alongside current
source hashes where changed. Unchanged scripts retained their generated MP3 bytes.
The former corridor-based pacing model is superseded by continuous platform
sections, shorter teaching and revised exploration routes. Twenty hours remains
unmeasured; no replacement time estimate is asserted. Human
listening, physical-device play, observed learner comprehension and measured
playthrough duration remain distinct evidence; no approval or readiness claim
is inferred from technical checks.

## Sound Seekers exploration cutover

The former side-view hub corridor is replaced by the current third-person
landscape controller and renderer. Side-view mission rooms retain their
curriculum and gain motor-only crossing routes. `campaignLayouts.js` remains
the geometry authority; the release Bible and machine-readable game brief
describe the intentional modeled-world / illustrated-Pal presentation.
No learner progress fields or hosted schema were introduced.


## Sound Seekers segmented areas

The current campaign renderer now switches between bounded platform activities
and 2.5D clue mazes, retaining the existing challenge/evidence authority. Two transparent
prop atlases supply illustrated scenery and everyday learning objects; semantic answer attributes
retain their authored meanings. The release Bible describes the live controls,
EL practice crosswalk and planned-duration boundary. Temporary browser evidence
and integration scripts remain in ignored `.artifacts`; no alternative runtime,
source art or learner records were removed.


## Sound Seekers teaching and controls — 12 September 2026

Replaced weak introductory sound anchors, including m/ham, with authored initial
sound examples. Updated generated pronunciation and connected-use data from their
single authoring sources; retained ham in legitimate decodable practice. Current
signposts supersede earlier saved introductions without replacing scored history.
Consolidated canvas/control colours into the shared palette. Task scratch scripts,
downloaded pronunciation lookup and transient browser logs are removed or retained
only as ignored scoped verification evidence; no learner or user source was deleted.

## Sound Seekers continuous adventure and animation — 12 September 2026

Replaced per-answer platform scene resets and long teaching detours with
continuous related rooms and crossings between completed problem groups.
Raised choice stones, animated collision decks and maze carry/return motion
retain the challenge authority. Overworld branches, compass guidance, camera
recentring and one visible actor per resident identity now use the current
navigation owners. Explicit nearby entry replaces the redundant confirmation;
completed activities remain available through Pause replay.

`heroActions.json` and `heroMotion.js` own the 48 drawn action poses alongside
the existing walk atlases. Magenta-backed action sheets are keyed to transparent
rendering canvases; prop atlases retain source alpha. `campaignTextSupport`
replaces empty help lines and preserves supported evidence across sort items
and resumed attempts. No hosted schema or alternative runtime was added.
Superseded corridor-time claims were removed from the current release Bible;
scoped test logs and visual evidence remain under ignored `.artifacts`. Obsolete
phone control offsets and the legacy-only preview readiness check were replaced.
Temporary browser snapshots and incidental regenerated audio indexes were removed
from the change. Local browser checks passed; no new duration or physical-device
readiness claim is implied.


## Sound Seekers pre-reader guidance — 12 September 2026

Consolidated automatic instruction and replay selection into one speech plan;
removed the signpost exclusion that left teaching silent and the separate
next-sort narration trigger. Replaced primary text-only controls with accessible
picture buttons and moved the detailed assistance menu under Pause. Generic
reading-task directions and canonical morphology word pairs close silent
content paths without disclosing answers. Three exact-script recorded clips
and their generated path registrations are current runtime assets.

No learner history, hosted data, original artwork or previous evidence was
deleted. Generation scratch files were cleaned by the existing generator;
scoped browser evidence and check logs remain in ignored `.artifacts`.


## Sound picture and control clarification — 12 September 2026

Removed blanket text-hiding rules from the Sound Seekers controls, movement
stick and nearby guidance. Icons now supplement short labels. Consolidated
sound-picture selection into the canonical helper, with explicit picture-cue
support tracking. Completed teaching signs remain visible until advancement.
No new images, duplicate word banks or narration files were added; no learner
data or original assets were deleted. Scoped check and browser evidence lives
in ignored `.artifacts/sound-picture-labels`.
