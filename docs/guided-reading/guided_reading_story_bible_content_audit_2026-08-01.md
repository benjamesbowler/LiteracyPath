# Guided Reading Story Bible content audit — 1 August 2026

**Status:** Complete and release-approved
**Standard:** `docs/content/STORY_AND_STORY_QUEST_BIBLE.md`
**Scope:** Every active Guided Reading book, page, image, narration and comprehension question

## Result

- Active books: **176/176 approved**
- Active pages: **1,601/1,601 approved**
- Fiction: **100 books**
- Nonfiction: **76 books**
- Exact-text Google Leda narration: **1,601/1,601 pages**
- Page images present and hash-locked: **1,601/1,601 pages**
- Comprehension questions grounded in book evidence: **528/528**
- Open Story Bible failures: **0**
- Books still awaiting a rewrite record: **0**

This is a fail-closed result. A change to active text, narration, image bytes or an audited
path invalidates the relevant fingerprint and requires the gates to be run again.

## What was reworked

Every book is now served through an explicit Story Bible manuscript record:

| Registry | Books | Purpose |
| --- | ---: | --- |
| `guidedReadingStoryBibleRewrites.js` | 111 | Core human fiction and all active nonfiction manuscripts |
| `guidedReadingHumanFictionRewrites.js` | 20 | James and Anna plus Aiden and Betty fiction |
| `guidedReadingWorldFictionRewrites.js` | 45 | Meadow Pals, Dino Pals and Moonwood Tales fiction |
| **Total** | **176** | One active review/manuscript for every book |

The fiction rewrites explicitly record a concrete story spine, a genuine failed attempt,
an earned resolution and canonical character IDs. The nonfiction rewrites explicitly
record a topic question, concept progression and synthesis. Level A, B and C page ceilings
are enforced by the release gate.

Sixteen old source pages in ten books were removed from the active reading route because
they duplicated beats, interrupted causality or weakened the revised story spine. Their
source media remains recoverable, but they are marked `story_bible_removed` and do not
appear to children:

- James and Anna go to Space: pages 5 and 9
- James and Anna go Shopping: page 6
- James and Anna go to the Dentist: page 5
- James and Anna build a Tree House: pages 3 and 6
- James and Anna and the School Play: page 13
- James and Anna's New Bikes: page 9
- James, Anna and Chips go Camping: pages 4 and 7
- Giggly and Clucky Bake a Cake: pages 6 and 9
- Grumpy's Secret: page 9
- The Big Farm Party: pages 5, 11 and 12

## Reading-band evidence

| Level | Books | Active pages | Enforced page ceiling |
| --- | ---: | ---: | --- |
| A | 55 | 443 | 6 words, one text line, 5–10 scenes |
| B | 76 | 631 | 14 words, two text lines, 6–12 scenes |
| C | 45 | 527 | 22 words, three text lines, 8–14 scenes |

The difficulty gap comes from richer meaning, inference and causal structure—not vague
language, missing picture support or longer instructions.

## Anti-slop counter-check

The 100 fiction books contain 1,060 active pages. A normalized cross-book duplicate scan
found one repeated page sentence: `Sleepy stays asleep.` It appears once in *Sleepy Can't
Wake Up* and once in *Noisy Wakes Everyone Up*, where it is a character-true repeated beat,
not a copied plot template. No active manuscript contains the checked stated-moral endings
(`learns that`, `from that day`, `always remember`, `best day`, or `never forget`).

This mechanical counter-check does not replace editorial judgement; it attacks the most
likely catalogue-scale failure mode—template repetition—after the per-book editorial
rewrite and page-image review.

## Browser evidence

The local child reader was opened for representative fiction and nonfiction books at all
three levels:

- Level A fiction: *Muddy Has a Bath*
- Level B fiction: *Chompy's Big Lunch*
- Level C fiction: *One Night in the Deep Dark*
- Level A nonfiction: *Colors*
- Level B nonfiction: *Colours We Can See*
- Level C nonfiction: *Honeybees and Pollination*

Each preview loaded the expected locked first-page text, a non-empty page image, reading
help controls, page narration controls and page navigation. Page turning was exercised in
the Level A reader. The local preview reported only its expected missing-Supabase warning;
that warning affects login/progress persistence, not the standalone book preview.

## Gates run

- `node tools/checkGuidedReadingStoryBible.mjs` — **176 books, 1,601 pages, 0 failures**
- `node tools/checkGuidedReadingNarrationProvenance.mjs --check` — **1,601 exact-resolved pages, 0 missing audio, 0 word-sequence mismatches**
- `npm run check:validate:guided-reading` — **176 active books; 23 rejected legacy candidates remain disabled**
- `npm run check:validate:guided-reading-questions` — **176/176 books; 528/528 questions evidence-grounded**
- `npm run check:validate:guided-stories` — **100 fiction and 76 nonfiction books; 0 draft exports**
- `npm run check:story-content-release` — **all registered narrative content approved for release**

## Related evidence

- `docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json`
- `docs/guided-reading/guided_reading_question_bank_audit_2026-07-22.md`
- `src/content/storyContentReviews.js`
- `tools/checkGuidedReadingStoryBible.mjs`
- `tools/checkGuidedReadingNarrationProvenance.mjs`
