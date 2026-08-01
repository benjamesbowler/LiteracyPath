# Literacy Guide Story Bible

**Status:** Canonical two-part content standard
**Version:** 1.0
**Date:** 31 July 2026

The Bible is deliberately separated into two documents so that universal children's-story
craft is never confused with Literacy Guide-specific character and production canon.

## Part I — How to Write an Excellent Children's Story

[Open Part I](./STORY_BIBLE_PART_1_WRITING.md)

The heavily researched writing standard: narrative comprehension, story architecture,
meaningful choices, Level A/B/C language, human-specific prose, workflow, scorecard and
release checklist.

## Part II — Literacy Guide Worlds and Character Canon

[Open Part II](./STORY_BIBLE_PART_2_CANON.md)

The product canon: worlds, personalities, relationships, appearance, scale, illustration,
audio, continuity, known conflicts and automated release gates.

## Release rule

A story must pass both parts. Part I can approve the writing while Part II rejects a
wrong-looking character; Part II can approve continuity while Part I rejects a lifeless
story. Neither result can override the other.

## Enforced authoring and approval

[Open the mandatory authoring template](./STORY_CONTENT_AUTHORING_TEMPLATE.md)

The repository registers every active narrative catalogue and fingerprints the reviewed
source. `npm run check:story-content-policy` rejects unregistered or silently changed
content and rejects any unsupported approval claim. `npm run
check:story-content-release` is the strict publication verdict; it remains red while any
registered narrative item is not approved.

The current evidence record is:

[Story Quest policy audit and complete remediation blueprint — 31 July 2026](./STORY_QUEST_POLICY_AUDIT_2026-07-31.md)
