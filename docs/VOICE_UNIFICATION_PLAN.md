# Voice Unification Plan

## The problem, confirmed

Git history shows the app's audio was generated in **~25 separate
batches** over the project's life - each batch a potential different
voice. The biggest blocks:

| Voice batch (by import) | Files | Where you hear it |
|---|---|---|
| Clean guided reading pack | 2,251 | word taps in books |
| Clean fan audio + reading words | 1,110 | word taps, child mode |
| Assessment replacement pack | 522 | EL checks |
| Big Kimi batch (words/prompts/phonemes) | 420 | games, login, letter sounds |
| Story Quest narration (9 batches) | ~660 | Story Quests |
| Book narration (core + nonfiction + series) | ~1,090 | read-alouds |
| Clean-human words/graphemes (4 batches) | ~430 | assessments, phonics |

That's why a child hears one accent on a button, another in the game,
and a third in the book.

## The standard (your spec)

> One natural female human voice - soft, light, clear, British or
> American - used for EVERYTHING except Level A book narration, which
> keeps its existing gentle "young" voice on purpose.

## Step 1 - you pick the gold voice (60 seconds)

Listen to these three, in the app:

1. **Login prompts** - child login, tap a student name ("Tap your three
   secret pictures") - the most recent dedicated voice batch.
2. **A game word** - play Sight Word Memory and listen to the word
   audio - the big words batch.
3. **A Level B book** - open any Dino Pals book with read-aloud - the
   narration batch.

Tell me which of the three is THE voice (or "none - request a fresh
one"). That choice becomes the reference sample attached to every future
Kimi request.

## Step 2 - I generate the re-record manifest

Once you pick, I produce per-folder Kimi request docs for everything NOT
in the gold batch, in priority order:

1. Letter sounds + game words (children hear these most, smallest set)
2. Game instructions/sentences + login prompts (if not the gold batch)
3. Assessment audio (teacher-supervised, still high volume)
4. Word-tap clips in books (huge set - batched by level)
5. Narration (only the series that clash; Level A exempt)

Every request carries the strict rules (plain text, no SSML, never
spell, listen before delivering) plus the gold reference clip.

## Step 3 - drop-in replacement

All re-records keep identical filenames, so each delivered batch
replaces its predecessor instantly - no code changes, and the app never
has a gap while we work through the list.
