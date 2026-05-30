# Learn Lesson Player UI Rebuild Audit

## What Was Wrong

- Full-screen Learn mode still behaved like a web page instead of a classroom slide player.
- Slide content could be cut off because the slide stage scrolled while the footer remained visually dominant.
- The bottom controls repeated the lesson title and competed with the slide content.
- Display text was oversized on some slides, especially HFW and title slides.
- Picture-word cards did not have a stable image/letter/word/sound structure.
- Meet-letter slides were too dense for a teacher-led classroom display.
- Short-a notation could render as visually confusing `/ă/` in large slide contexts.

## Files Changed

- `src/components/LearnAreaPage.jsx`
- `src/App.css`
- `docs/implementation/learn_lesson_player_ui_rebuild_audit.md`

No assessment, Supabase/auth, Guided Reading, or student dashboard logic was changed.

## Layout System Introduced

- Added a `.learn-lesson-player` full-screen shell using a four-row grid:
  - compact top bar
  - progress strip
  - slide stage
  - compact bottom controls
- The player uses `100dvh`, keeps bottom controls in normal document flow, and hides normal app chrome behind the full-screen overlay.
- Slide cards now have a consistent centered stage with controlled padding, width, height, and typography variables.
- Lesson typography now uses shared CSS variables for:
  - title
  - subtitle/instruction
  - teacher note
  - card word
  - small support text
- Meet-letter slides now use a two-column classroom layout: large letter tile, sound/formation card, and a bottom teacher/children cue.
- Picture-word cards now use a stable structure: placeholder image area, letter badge, word, and optional sound cue.
- Sound Safari and Letter Sort slides now use compact instruction blocks, one centered card row, and a secondary teacher reveal area.
- Short-a is displayed as `/a/` in the lesson player with the teacher cue `short a as in apple`.

## Cycle 1 Slides Checked

Reasoned through the first eight generated Cycle 1 lesson slides after the reorder:

1. Title screen
2. Meet Aa
3. Aa picture words
4. `/a/` Sound Safari
5. Meet Mm
6. Mm picture words
7. `/m/` Sound Safari
8. Letter Sort

Checks:

- Slide order now matches the requested Cycle 1 inspection path.
- Four picture cards fit as a single row on classroom desktop/laptop widths.
- The footer remains below the stage in grid flow and does not overlay slide content.
- Meet-letter content is reduced and spaced into a stable two-column layout.
- Sound Safari/Letter Sort reveal content is collapsed by default and does not reserve large vertical space.

## Remaining Known Limitations

- Picture cards currently use clean placeholder image boxes because the Learn-specific Kimi images have not been imported yet.
- The placeholder structure is ready for first-party Learn images once the assets from `docs/assets/kimi_learn_area_image_audio_request.md` are generated.
- Some later-cycle slides can still contain many cards; the renderer uses compact card sizing rather than allowing footer overlap.
