# LiteracyPath Roadmap
## Product Development Roadmap
### Version 1

Status: Active Development

Purpose:
This roadmap defines the long-term development direction for LiteracyPath.

It exists to:
- prevent feature chaos
- prioritize implementation order
- maintain instructional coherence
- align AI-assisted development
- separate core infrastructure from polish/features

This roadmap is intentionally high-level.
Detailed implementation tasks should live separately.

---

# Core Product Philosophy

LiteracyPath is being designed as:

- an adaptive early literacy assessment system
- a teacher-friendly intervention platform
- a child-friendly learning experience
- an instructional decision support tool
- an ESL-compatible literacy environment
- a mastery-based progression system

The product must remain:

- instructionally valid
- cognitively simple
- operationally calm
- scalable
- mobile-friendly
- teacher-trustworthy

The product should NOT become:
- overstimulating
- excessively game-like
- enterprise software clutter
- worksheet software
- fake-adaptive edtech

---

# Development Principles

## 1. Instruction First
Educational validity is more important than visual flair.

## 2. Teacher Cognitive Load Matters
The teacher UX must remain calm, fast, and readable.

## 3. Child Motivation Matters
Child Mode should feel rewarding without becoming distracting.

## 4. No Fake Mastery
Progression should reflect real demonstrated skill.

## 5. Adaptive Support Over Punishment
Mistakes should trigger scaffolding, not failure states.

## 6. Preserve Existing Infrastructure
Do not casually break:
- EL assessments
- exports
- Supabase logic
- mastery tracking
- reporting systems

---

# PHASE 1 — Stable Assessment Platform
## Status: ACTIVE

Goal:
Build a stable, instructionally-valid teacher assessment system.

Current major areas:
- class management
- student management
- adaptive assessments
- checkpoint progression
- item mastery tracking
- teacher reports
- exports
- admin tools
- question flagging
- Supabase persistence

Current priorities:
- assessment validity
- UX cleanup
- checkpoint vs mastery separation
- question quality
- teacher workflow clarity
- responsive layouts
- assessment reliability

Success criteria:
- teachers can run assessments smoothly
- exports remain stable
- mastery logic is trustworthy
- question quality is consistent
- UX confusion is reduced

---

# PHASE 2 — Child Learning World
## Status: ACTIVE EARLY BUILD

Goal:
Build a child-friendly adaptive learning layer connected to mastery evidence.

Current world:
- Echo Caves (Short-A)

Core systems:
- picture-supported decoding
- heard-word decoding
- mastery confirmation
- image/audio support
- adaptive question formats
- child-mode evidence tracking

Current priorities:
- better assets
- larger content banks
- image/audio quality
- no-scroll mobile UX
- response speed
- mastery integrity
- adaptive scaffolding

Planned future worlds:
- Short-I world
- Short-O world
- Short-U world
- Short-E world
- Blends world
- Digraph world
- Vowel Teams world
- Controlled R world

Success criteria:
- children can use independently
- teachers trust the learning evidence
- gameplay supports literacy goals
- adaptive support feels natural

---

# PHASE 3 — Adaptive Remediation Engine
## Status: PLANNING

Goal:
Create meaningful adaptive instructional support.

Planned systems:
- scaffold escalation
- remediation loops
- confidence estimation
- exposure tracking
- mastery confidence weighting
- false-mastery prevention
- format rotation
- ESL-aware supports

Planned adaptive behaviors:
- image support when needed
- harder distractors after success
- replay support logic
- minimal pair escalation
- mixed review scheduling
- targeted intervention suggestions

Success criteria:
- struggling students receive useful support
- advanced students move efficiently
- teachers trust recommendations

---

# PHASE 4 — Teacher Intelligence Layer
## Status: PLANNING

Goal:
Turn assessment data into actionable teaching insight.

Planned systems:
- intervention dashboard
- skill grouping suggestions
- class-level coverage maps
- trend analysis
- recommended next skills
- suggested small groups
- plateau detection
- risk indicators

Planned outputs:
- cleaner dashboards
- teacher-friendly summaries
- intervention suggestions
- student snapshots
- skill heatmaps

Success criteria:
- teachers save planning time
- intervention decisions become easier
- dashboards feel useful instead of overwhelming

---

# PHASE 5 — UX / Visual Refinement
## Status: PLANNING

Goal:
Create a polished and coherent product experience.

Areas:
- Teacher Mode redesign
- navigation consistency
- design token system
- mobile optimization
- animation polish
- accessibility
- loading performance
- responsive layouts

Design goals:
- calm
- warm
- readable
- professional
- modern educational software

Avoid:
- visual clutter
- overstimulation
- excessive animation
- enterprise dashboard aesthetics

---

# PHASE 6 — Content Scaling
## Status: ACTIVE EARLY BUILD

Goal:
Expand instructional coverage safely.

Areas:
- phonics banks
- sight words
- sentence work
- comprehension
- blends
- digraphs
- vowel teams
- controlled-r
- fluency tasks

Content priorities:
- quality over quantity
- real instructional progression
- valid distractors
- ESL readability
- audio consistency
- image consistency

Infrastructure:
- Kimi asset pipeline
- instructional audit rules
- mastery metadata
- question framework tagging

---

# PHASE 7 — Production Readiness
## Status: FUTURE

Goal:
Prepare for stable real-world deployment.

Areas:
- performance optimization
- bundle reduction
- production testing
- teacher onboarding
- analytics
- authentication hardening
- backup/recovery
- deployment workflow

Potential future:
- hosted SaaS platform
- school accounts
- parent portals
- district-level reporting
- multi-language support

---

# Current Major Risks

## 1. Content Quality Drift
Risk:
Large question banks become inconsistent or weak.

Mitigation:
- audit rules
- instructional standards
- validity reviews
- format framework

## 2. UX Complexity Growth
Risk:
Teacher Mode becomes cluttered.

Mitigation:
- UX architecture review
- progressive disclosure
- navigation simplification

## 3. False Mastery
Risk:
Students progress without genuine literacy skill.

Mitigation:
- multiple format requirements
- adaptive remediation
- mastery confidence rules

## 4. Asset Inconsistency
Risk:
Images/audio become visually inconsistent.

Mitigation:
- Kimi style guides
- asset manifests
- coverage tracking

---

# Current Development Priority Order

1. Assessment validity
2. Teacher UX clarity
3. Child Mode stability
4. Adaptive remediation
5. Content scaling
6. Visual polish
7. Deployment preparation

---

# Source-of-Truth Documents

Architecture:
- PRODUCT_VISION.md
- teacher_assessment_ux_review_v1.md
- Child_Learning_Experience_Layer.md

Instructional:
- instructional_standards.md
- QUESTION_VALIDITY_RULES.md
- LiteracyPath_Phonics_Question_Model_Framework_v1.md
- Adaptive_Remediation.md

Assets:
- child_mode_asset_coverage.md
- audio-source-research.md

---

# Important Rule For AI-Assisted Development

Claude:
- instructional systems
- UX architecture
- remediation logic
- audit philosophy

Codex:
- implementation
- bug fixing
- integrations
- CSS/components
- Supabase wiring

Kimi:
- images
- audio
- UI assets
- content asset scaling

All implementation should follow documented standards before introducing new systems.