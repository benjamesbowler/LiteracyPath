# LiteracyPath documentation

This folder contains current product standards and operating references. The running
application, its imported modules, and its automated tests are the final authority.
A dated document must never override current code.

## Start here

- [Product vision](architecture/PRODUCT_VISION.md)
- [Repository rules](../AGENTS.md)
- [Shared agent context](brain/START-HERE.md)
- [Agent workflow and skill discovery](engineering/AGENT_WORKFLOW.md)
- [Task verification gates](verification/TASK_GATES.md)
- [Continuous QA pass-by-exception decision](brain/decisions/2026-08-21-continuous-qa-pass-by-exception.md)
- [Agent task brief](brain/AGENT_TASK_BRIEF.md)
- [Instructional standards](instructional/instructional_standards.md)
- [Current-system cleanup record](CURRENT_SYSTEM_CLEANUP_2026-07-31.md)
- [**The Reporting Bible**](reporting/REPORTING_BIBLE.md) — governing: what we report, to whom, and what we refuse to report

## Reporting

- [The Reporting Bible](reporting/REPORTING_BIBLE.md) — **GOVERNING.** Overrides any other document or
  code comment on reporting. Its numbers live in `src/policy/reportingBible.js`.
- [Multilingual learner language reporting](reporting/MLL_LANGUAGE_REPORTING.md) — the WIDA-aligned MLL
  module. Note "EL" in this codebase means EL Education, not English Learner.
- [Reporting audit 2026-08-06](reporting/REPORTING_AUDIT_2026-08-06.md) — every surface and export
  against the bible, severity-ranked, with what is still open.

## Current learning and assessment rules

- [Skills assessment authoring standard](skills-assessment-rebuild/AUTHORING_STANDARDS.md)
- [Skills assessment mastery standard](skills-assessment-rebuild/MASTERY_SYSTEM.md)
- [Current skills assessment validity audit and remediation plan](skills-assessment-rebuild/CURRENT_VALIDITY_AUDIT_AND_REMEDIATION.md)
- [High-frequency word expansion review](skills-assessment-rebuild/HFW_DEPTH_REVIEW_2026-09-28.md)
- [Question blueprints](skills-assessment-rebuild/BLUEPRINTS_PHONOLOGICAL.md)
- [Question design bible](content/QUESTION_DESIGN_BIBLE.md)
- [Worksheet design bible](content/WORKSHEET_DESIGN_BIBLE.md) — cycle-matched print studio, character colouring, picture puzzles, writing progression and separate teacher answers.
- [Present teaching lessons](PRESENT_REDESIGN_2026-07-28.md) — three daily formats across 27 cycles; interactive spelling, oral language, private notes and projection
- [Learning policy](design/LEARNING_POLICY.md)
- [Assessment media evidence](design/ASSESSMENT_MEDIA_EVIDENCE.md)
- [Six teacher-administered assessments and EL benchmark suite](EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21.md) — current forms, protected pupil display, diagnostic evidence and draft compatibility
- [Guided Reading](guided-reading/INDEX.md)
- [App reading levels and text measures](guided-reading/READING_LEVELS_AND_TEXT_MEASURES.md) — editorial book bands, full-text review and verified Lexile provenance
- [Story and Story Quest bible](content/STORY_AND_STORY_QUEST_BIBLE.md)
- [Story writing standard](content/STORY_BIBLE_PART_1_WRITING.md)
- [Little Literacy Guides SEL Books 1-10](content/sel-books/README.md)
- [Story canon](content/STORY_BIBLE_PART_2_CANON.md)
- [Story Quest production contract](content/STORY_QUEST_PRODUCTION.md)

The Skills assessment has one current progression threshold: the 70% phase rule in
`src/content/blueprints/skillBlueprints.js`. Publication is controlled by the ten
automated v3 gates. There is no personal approval switch, legacy-bank fallback,
random-guess percentage, or separate 80%, 85%, or 90% assessment pass rule.

During the current beta, content and media are accepted under continuous human
review unless a defect is reported. Quarantined pairings remain excluded
immediately. Missing review metadata is not a publication queue.

## Product design

- [Learn Letters](product/LEARN_LETTERS.md) — five saved rounds per letter, uppercase and lowercase tracing, varied picture/sound practice and cumulative review
- [Cycle Practice](product/CYCLE_PRACTICE.md) — cumulative word recognition and phonics, shared reviewed CVC pictures, varied replay, automatic feedback and teacher-assigned sessions
- [Adventure Map games](product/ADVENTURE_MAP.md) — ten simple spoken letter, word and picture games; focused mixed quests, optional rhyme and current audio/learning contracts
- [Adventure atlas art manifest](design/ADVENTURE_MAP_ATLAS_MANIFEST.json) — the three overhead map paintings, owned source inputs, runtime hashes and versioned wide-map coordinates
- [Nine phonics practice games](design/PHONICS_PRACTICE_OVERHAUL.md) — current direct-play worlds, declared constructs, saved outings and response evidence

- [Teacher-controlled Student Sessions](product/STUDENT_SESSIONS.md) — whole-class or selected-student iPad focus sessions for targeted Skills checks, exact books and games, plus Reading Library, Letters Practice, and existing synchronized Guided Reading
- [Student welcome guide](product/STUDENT_WELCOME_GUIDE.md) — first-login orientation, lightweight reminders, replayable Help, spoken guidance, and focus-session suppression
- [School-linked parent area](product/PARENT_AREA_SPEC.md) — guardian access, released family reports, privacy boundary and seeded preview; Family Bridge is retired
- [Blue interface and simpler Hollow](design/BLUE_UI_AND_SIMPLE_HOLLOW.md) — native catalogue layouts, eight visible Home objects, shared navigation art and retained economy
- [Navigation object provenance](../public/images/navigation/manifest.json) — separate transparent WebP exports; teaching glyphs remain live text
- [Simple task flows](design/SIMPLE_UI_AND_TASK_FLOWS.md) — owner-approved student and teacher simplification, complete-content disclosure, task chrome and evidence boundaries
- [Child surface rules](design/CHILD_SURFACE_RULES.md)
- [Original 22-game upgrade programme](design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md) — gameplay, graphics, learning, reported defects and per-game acceptance for the original catalogue plus Sound Seekers; subsequent additions use the current game briefs and Bible
- [Game menu art and generation prompts](../public/images/learn-games/menu/manifest.json) — matching text-free images for all 27 Arcade and Phonics menu cards
- [Game design bible](design/GAME_DESIGN_BIBLE.md) — current split-thumb iPad control placement and motor forgiveness — preserves original Arcade gameplay, including Sound Beat rhythm; Sentence Express uses engine, sentence and labelled departure stages; instruction playback never blocks activity input
- [Arcade saved journeys](design/GAME_DESIGN_BIBLE.md#arcade-saved-journeys) — twelve saved outings per Arcade game, replay variation and scoped continuity data
- [Word Match progression](design/GAME_DESIGN_BIBLE.md#word-match-progression) — cycle-ordered matching, four-pair boards and frequency-ordered continuation
- [Game visual and playability production guide](design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md) — agent workflow for authored visual, asset, audio, performance and evidence quality
- [Three Arcade concept mockups](design/arcade-concepts-2026-10-03/README.md) — approved design reference for the physical platformer, tennis and construction games; the review board and screen artwork remain concept artifacts
- [Physical Arcade contracts](../src/components/learn/games/shared/physicalArcadeBriefs.js) — actual gameplay, learning/evidence, fallback and scoped persistence contracts for all three additions
- [Physical Arcade art manifest](../source-art/arcade/physical-worlds/manifest.json) — original character/action atlases, independently placed scenery, scene material kits and current visual verification status
- [Arcade learning picture sources](../source-art/arcade/cue-images/README.md) — text-free word cues, supported sentence scenes, original prompts, selected derivatives and reproducible encoding
- [Sound Beat concert implementation](design/SOUND_BEAT_IMPLEMENTATION.md) — three authored concert worlds, real input contacts, complete ten-section performances and owned recorded-cue practice
- [SoundKeys band implementation](design/SOUNDKEYS_IMPLEMENTATION.md) — eight canonical performers across three authored venues, real instrument contacts, complete 24-word performances and retained cue/save recovery
- [Tower Tumble implementation](design/TOWER_TUMBLE_IMPLEMENTATION.md) — scaffold physics, nine rescues, authored content, resume validation and named checks
- [Rally Pals implementation](design/RALLY_PALS_IMPLEMENTATION.md) — continuous tennis, match/co-op/target modes, themed courts and bounded evidence
- [Burrow Builders implementation](design/BURROW_BUILDERS_IMPLEMENTATION.md) — editable islands, bridges, water flow, shelter, growing gardens and themed free building
- [Meadow Pals animation production bible](design/ANIMATION_PRODUCTION_BIBLE.md)
- [Student emphasis budget](design/STUDENT_EMPHASIS_BUDGET.md)
- [Little Literacy Guides design system](LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM.md) — includes the shared Woodland activity presentation for assessments, Adventure Map, Cycle Practice and Letters
- [Teacher UI primitives](teacher/UI_PRIMITIVES.md)
- [Teacher state matrix](teacher/STATE_MATRIX.md)
- [Teacher parity matrix](teacher/PARITY_MATRIX.md)
- [App copy standard](APP_COPY_STANDARD_2026-07-25.md)

## Current product bibles

- [Sound Seekers release bible](SOUND_SEEKERS_RELEASE_BIBLE.md) — current rounded 3D campaign: 30 places, 150 main and 60 optional missions covering 40 curriculum anchors; approved character assets, scoped saves, formative evidence and verification boundaries
- [Sound Seekers curriculum matrix](SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md)
- [Sound Seekers 3D woodland chapter](../demos/sound-seekers/CHAPTER_ONE.md) — separately selectable Woodland Homecoming preserving the approved storybook direction; five projects, five interaction families and 120 contextual rounds with separate local/cloud checkpoints. Its 30–40-minute target awaits child-paced observation.
- [Phoneme recording standard](audio/PHONEME_RECORDING_STANDARD.md)
- [Shared game curriculum](GAME_CURRICULUM_FRAMEWORK_2026-07-06.md)
- [Sound Seekers world blueprint](SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md) — retained v2 design/compatibility reference; the release bible defines the current child route
- [3D asset library](3D_ASSET_LIBRARY.md)

## Product plans

- [Adaptive progress checks](product/PROGRESS_CHECKS.md) — implemented separate literacy tracks, correctness-adaptive ordinal routing, scoped saved evidence and descriptive reports. The [design proposal](design/ADAPTIVE_PROGRESS_TEST_PLAN.md) retains future calibration and pilot work.
- [Learning response system](design/LEARNING_RESPONSE_SYSTEM_PLAN.md) — implemented immutable first response, worked example and fresh transfer task; the integration matrix records each mechanic's evidence boundary.
- [Sound Seekers three-world adventure](design/SOUND_SEEKERS_THREE_WORLD_ADVENTURE_PLAN.md) — retained campaign authoring plan; the release Bible owns the expanded rounded presentation and current route. See also the [preserved campaign reference](SOUND_SEEKERS_CAMPAIGN_REFERENCE.md).
- [Public free tier spec](product/FREE_TIER_SPEC.md) — email + password, two children, ~20% of the
  content, no parent reporting. Spec only; no code.
## Operations, research, legal and security

- [Startup download checks](../tools/checkFirstLoadNetwork.mjs) and [offline cache checks](../tools/checkQuestOffline.mjs) — measured production shells, offline sign-in and on-demand Quest executable warming.

- [Recovery](ops/RECOVERY_RUNBOOK.md), [retention](ops/RETENTION_RUNBOOK.md), and [data rights](ops/DATA_RIGHTS_RUNBOOK.md)
- [Admin app usage exports](ops/APP_USAGE_INSIGHTS_RUNBOOK.md) — on-demand complete snapshots, source coverage, pseudonymous downloads and exploratory question review
- [Research pack](research/README.md)
- [Legal and procurement pack](legal/README.md)
- [Dependency exception policy](security/DEPENDENCY_EXCEPTIONS.md)
- [Accessibility audit program](accessibility/MANUAL_AUDIT_PROGRAM.md)

Research protocols, legal drafts, and operational policies serve their named scopes.
They are not learner progression rules and cannot publish assessment content.

## Documentation hygiene

Do not restore retired audits, generated review inventories, dated handoff prompts,
preview evidence, release scorecards, or historical media requests. If a standard
changes, edit the current standard in place. If the app and a document disagree,
correct or delete the document.

- [Blue interface and simpler Hollow](design/BLUE_UI_AND_SIMPLE_HOLLOW.md) — owner-approved 30 September 2026 chrome and disclosure direction.
