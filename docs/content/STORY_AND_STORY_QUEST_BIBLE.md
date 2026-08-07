# Literacy Guide Story Bible

**Status:** Canonical two-part content standard
**Version:** 2.0
**Date:** 3 August 2026

The Bible is deliberately separated into two documents so that universal children's-book
craft for fiction and nonfiction is never confused with Literacy Guide-specific
character and production canon.

## Part I — How to Write an Excellent Children's Book

[Open Part I](./STORY_BIBLE_PART_1_WRITING.md)

The research-led writing standard: fiction and nonfiction architecture, meaningful
choices, early-emergent Level A/B/C reading bands, ages 4–8 interest, human-specific
prose, social consequence and repair, earned endings, workflow, scorecard and release
checklist.

[Open the human-writing evidence database](../guided-reading/HUMAN_WRITING_EVIDENCE_DATABASE.json)

The database contains short examples and cross-source craft analysis. It is evidence for
writing decisions, not a source of lines to copy.

## Part II — Literacy Guide Worlds and Character Canon

[Open Part II](./STORY_BIBLE_PART_2_CANON.md)

The product canon: worlds, personalities, relationships, appearance, scale, illustration,
audio, continuity, known conflicts and automated release gates.

## Release rule

A book must pass every applicable rule in both parts. Part I can approve the writing while
Part II rejects a wrong-looking character; Part II can approve continuity while Part I
rejects lifeless fiction or incoherent nonfiction. Neither result can override the other.

## Enforced authoring and approval

[Open the mandatory authoring template](./STORY_CONTENT_AUTHORING_TEMPLATE.md)

The repository registers every active narrative catalogue and fingerprints the reviewed
source. `npm run check:story-content-policy` rejects unregistered or silently changed
content and rejects any unsupported approval claim. `npm run
check:story-content-release` is the strict publication verdict; it remains red while any
registered narrative item is not approved.

The current evidence record is:

[Story Quest policy audit and complete remediation blueprint — 31 July 2026](./STORY_QUEST_POLICY_AUDIT_2026-07-31.md)
