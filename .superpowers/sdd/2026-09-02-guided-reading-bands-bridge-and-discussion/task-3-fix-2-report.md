# Task 3 fix round 2 report

## Outcome

Replaced the rejected mechanical 206-record prompt catalogue with three disjoint, hand-authored static source-family modules. Each teacher move is written from its own book's active final text and picture evidence. The public authority composes the three frozen maps without deriving prompt language at runtime.

## Quality corrections

- Removed title/quotation prefixes and rotating generic question tails.
- Removed doubled, misplaced, and unbalanced punctuation.
- Added recurrence detection for four- and five-word phrases anywhere in prompts and cues, including text hidden after a provenance prefix.
- Added malformed-punctuation and prefix-bypass regression fixtures.
- Registered all three static source modules as active Guided Reading sources.

## Coverage and recurrence evidence

- Core/nonfiction: 76 exact records; maximum repeated four-word phrase 2; five-word phrase 1.
- Recurring series: 60 exact records; maximum repeated four-word phrase 3; five-word phrase 1.
- Meadow/Moonwood: 70 exact records; maximum repeated four/five-word phrase 2.
- Combined authority: 206/206 records; zero missing/orphan records; zero malformed punctuation; zero exact duplicate prompts/cues; all visual references target active media-backed pages and pass the concrete-evidence gate.

## Verification

- `node --test tests/unit/guidedReadingDiscussionPrompts.test.js`: 10/10 passed.
- `npm run check:guided-reading-discussion-prompts`: 206 records passed.
- Scoped ESLint for the authority modules, registry, gate, and unit test: passed.
- Full focused Task 3 browser batch: seven existing checks passed; the teacher assertion failed only because it still expected the replaced prompt/page text.
- Updated teacher/student privacy expectations, then reran those two browser cases: 2/2 passed.
- No runtime integration behavior changed beyond loading the curated static modules.

## Evidence boundaries

The existing preview warns when local Supabase frontend variables are absent. This teacher support performs no learner-data writes. No physical-iPad or hosted authenticated claim is made.
