# Full App Audio Audit — 10 June 2026

How audio works everywhere in the app: the code tries recorded MP3 files
first and falls back to the browser's robot voice when a file is missing.
So every "bad" sound is either a missing file or a code bug skipping a
file that exists. Both kinds were found.

## Fixed in code this round (no new files needed)

1. **Vowel sounds in games played the robot voice** even though proper
   short-vowel recordings exist. The lookup marked vowels "generated" and
   skipped the files. Fixed — vowels now play the real recordings, so CVC
   and spelling games say the letter *sound*, not the letter name.
2. **Child login prompts** ("Tap your three secret pictures" etc.) were
   hard-wired to the browser voice. Now wired to recorded files in
   `public/audio/ui/voice/` with the robot voice only as a fallback until
   the recordings are dropped in.

## Needs recordings (Kimi request docs ready)

- **10 login voice prompts** — `docs/KIMI_AUDIO_VOICE_AND_WORDS_REQUEST.md`
- **333 single words** missing recordings (word-taps in nonfiction books,
  regen books, plus 22 new game words) — same doc
- **13 game sentences** (Word Hopscotch / Reading Race read-alouds) — same doc
- **30 books with NO narration**: the Bob and Nan, Aiden and Betty, and
  James and Anna series — full page-by-page scripts with exact filenames
  in `docs/KIMI_AUDIO_NARRATION_REQUEST.md`. (One small code change from
  me after the files land: these three series have their audio switched
  off in the data.)

## Confirmed healthy (no action)

- Core guided reading books (23) and regen books (21): full narration
- Dino Pals (20), Meadow Pals (25), Moonwood Tales (25): full narration
- All First Facts and Level C nonfiction books: full page narration
- Story Quest books: all 330 referenced audio files present
- Letter sounds: all 26 letters + digraph recordings present
- Game words: previous pool was 99% covered; new expanded pool needs the
  22 words listed in the request doc

## Unused / orphaned audio found (the "in the app but not used" check)

- Narration sets `gr-b-10` and `gr-d-20` exist on disk but no book with
  those ids exists any more — safe to delete or re-link if those books
  return
- `sam-pam` audio folder under story-quests is not referenced by data
- One stale reference to `gr-c-36` narration in the media inventory file
  (book no longer exists)

## Minor data cleanups for a future round

- Level C books contain word-tap references to numbers ("11", "1000") and
  one empty filename — junk entries worth stripping
- Child Mode has a dev-only browser-voice fallback (marked as such in
  code; assessments never use it)
