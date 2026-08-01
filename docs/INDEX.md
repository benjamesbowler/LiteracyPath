# LiteracyPath documentation

This folder contains current product standards and operating references. The running
application, its imported modules, and its automated tests are the final authority.
A dated document must never override current code.

## Start here

- [Product vision](architecture/PRODUCT_VISION.md)
- [Repository rules](../AGENTS.md)
- [Instructional standards](instructional/instructional_standards.md)
- [Current-system cleanup record](CURRENT_SYSTEM_CLEANUP_2026-07-31.md)

## Current learning and assessment rules

- [Skills assessment authoring standard](skills-assessment-rebuild/AUTHORING_STANDARDS.md)
- [Skills assessment mastery standard](skills-assessment-rebuild/MASTERY_SYSTEM.md)
- [Question blueprints](skills-assessment-rebuild/BLUEPRINTS_PHONOLOGICAL.md)
- [Learning policy](design/LEARNING_POLICY.md)
- [Assessment media evidence](design/ASSESSMENT_MEDIA_EVIDENCE.md)
- [EL benchmark suite](EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21.md)
- [Guided Reading](guided-reading/INDEX.md)
- [Story Quest authoring rules](STORY_QUEST_REWRITE_2026-07-26.md)

The Skills assessment has one current progression threshold: the 70% phase rule in
`src/content/blueprints/skillBlueprints.js`. Publication is controlled by the six
automated v3 gates. There is no personal approval switch, legacy-bank fallback,
random-guess percentage, or separate 80%, 85%, or 90% assessment pass rule.

## Product design

- [Child surface rules](design/CHILD_SURFACE_RULES.md)
- [Student emphasis budget](design/STUDENT_EMPHASIS_BUDGET.md)
- [Little Literacy Guides design system](LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM.md)
- [Teacher UI primitives](teacher/UI_PRIMITIVES.md)
- [Teacher state matrix](teacher/STATE_MATRIX.md)
- [Teacher parity matrix](teacher/PARITY_MATRIX.md)
- [App copy standard](APP_COPY_STANDARD_2026-07-25.md)

## Current product bibles

- [Sound Seekers release bible](SOUND_SEEKERS_RELEASE_BIBLE.md)
- [Sound Seekers curriculum matrix](SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md)
- [Shared game curriculum](GAME_CURRICULUM_FRAMEWORK_2026-07-06.md)
- [Sound Seekers world blueprint](SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md)
- [3D asset library](3D_ASSET_LIBRARY.md)

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
