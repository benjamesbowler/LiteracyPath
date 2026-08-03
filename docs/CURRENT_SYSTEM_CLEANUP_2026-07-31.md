# Current system cleanup — 31 July 2026

## Outcome

The repository now uses the current application as its authority. Duplicate assessment
banks, stale publication rules, person-specific approval requirements, historical
audits, generated evidence dumps, old media requests, obsolete Admin QA inventories,
and disconnected tools have been removed.

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
- `src/data/childWordMediaManifest.js`
- `src/data/vocabularyMediaLexicon.js`
- `src/data/vocabularyAudioPreferences.js`
- `src/data/cleanAudioManifest.js`

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
