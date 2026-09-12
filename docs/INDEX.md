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
- [Question blueprints](skills-assessment-rebuild/BLUEPRINTS_PHONOLOGICAL.md)
- [Question design bible](content/QUESTION_DESIGN_BIBLE.md)
- [Worksheet design bible](content/WORKSHEET_DESIGN_BIBLE.md)
- [Learning policy](design/LEARNING_POLICY.md)
- [Assessment media evidence](design/ASSESSMENT_MEDIA_EVIDENCE.md)
- [EL benchmark suite](EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21.md)
- [Guided Reading](guided-reading/INDEX.md)
- [Story and Story Quest bible](content/STORY_AND_STORY_QUEST_BIBLE.md)
- [Story writing standard](content/STORY_BIBLE_PART_1_WRITING.md)
- [Little Literacy Guides SEL Books 1-10](content/sel-books/README.md)
- [Story canon](content/STORY_BIBLE_PART_2_CANON.md)
- [Story Quest authoring rules](STORY_QUEST_REWRITE_2026-07-26.md)

The Skills assessment has one current progression threshold: the 70% phase rule in
`src/content/blueprints/skillBlueprints.js`. Publication is controlled by the six
automated v3 gates. There is no personal approval switch, legacy-bank fallback,
random-guess percentage, or separate 80%, 85%, or 90% assessment pass rule.

During the current beta, content and media are accepted under continuous human
review unless a defect is reported. Quarantined pairings remain excluded
immediately. Missing review metadata is not a publication queue.

## Product design

- [Cycle Practice](product/CYCLE_PRACTICE.md) — spoken, pictured mini-games, automatic feedback, forgiving tracing and teacher-assigned cycle sessions

- [Teacher-controlled Student Sessions](product/STUDENT_SESSIONS.md) — whole-class or selected-student iPad focus sessions for targeted Skills checks, exact books and games, plus Reading Library, Letters Practice, and existing synchronized Guided Reading
- [Student welcome guide](product/STUDENT_WELCOME_GUIDE.md) — first-login orientation, lightweight reminders, replayable Help, spoken guidance, and focus-session suppression
- [School-linked parent area](product/PARENT_AREA_SPEC.md) — guardian portal product model, privacy boundary, release scope and working seeded preview
- [Child surface rules](design/CHILD_SURFACE_RULES.md)
- [Complete game upgrade plan](design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md) — all 22 games plus Sound Seekers; gameplay, graphics, learning, reported defects and per-game acceptance
- [Game design bible](design/GAME_DESIGN_BIBLE.md) — preserves original Arcade gameplay, including Sound Beat rhythm; instruction playback never blocks activity input
- [Game visual and playability production guide](design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md) — agent workflow for authored visual, asset, audio, performance and evidence quality
- [Meadow Pals animation production bible](design/ANIMATION_PRODUCTION_BIBLE.md)
- [Student emphasis budget](design/STUDENT_EMPHASIS_BUDGET.md)
- [Little Literacy Guides design system](LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM.md)
- [Teacher UI primitives](teacher/UI_PRIMITIVES.md)
- [Teacher state matrix](teacher/STATE_MATRIX.md)
- [Teacher parity matrix](teacher/PARITY_MATRIX.md)
- [App copy standard](APP_COPY_STANDARD_2026-07-25.md)

## Current product bibles

- [Sound Seekers release bible](SOUND_SEEKERS_RELEASE_BIBLE.md) — three-world exploration, continuous platform puzzles and illustrated animation; automatic spoken guidance, persistent sound pictures and labelled replay/movement controls; current media, formative evidence and verification boundaries
- [Sound Seekers curriculum matrix](SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md)
- [Phoneme recording standard](audio/PHONEME_RECORDING_STANDARD.md)
- [Shared game curriculum](GAME_CURRICULUM_FRAMEWORK_2026-07-06.md)
- [Sound Seekers world blueprint](SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md) — retained v2 design/compatibility reference; the release bible defines the current child route
- [3D asset library](3D_ASSET_LIBRARY.md)

## Product plans

- [Sound Seekers three-world adventure](design/SOUND_SEEKERS_THREE_WORLD_ADVENTURE_PLAN.md) — authorised production plan implemented locally as 30 stages, 150 main missions and 60 optional quests, including expanded learning acts and recorded campaign narration; 20-hour target remains unmeasured, with release and end-use validation still outstanding.
- [Public free tier spec](product/FREE_TIER_SPEC.md) — email + password, two children, ~20% of the
  content, no parent reporting. Spec only; no code.
## Operations, research, legal and security

- [Recovery](ops/RECOVERY_RUNBOOK.md), [retention](ops/RETENTION_RUNBOOK.md), and [data rights](ops/DATA_RIGHTS_RUNBOOK.md)
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
