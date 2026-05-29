# Assessment Audio Replacement Import Report

Generated: 2026-05-29T07:26:47.642Z

## Source

- Source archive inspected: `/Users/benjaminbowler/Desktop/public/Audio replacement 566 files.zip`
- Temporary extraction folder: `/private/tmp/literacypath-audio-replacements`
- Manifest rows in package: 566
- Unique MP3 target paths in package: 565
- Duplicate manifest target rows: `/audio/child-mode/clean-human/phrases/pete.mp3` (2 rows)

## Import Summary

| Metric | Count |
| --- | ---: |
| MP3 files imported | 565 |
| Files skipped | 0 |
| Unmatched source files | 0 |
| Duplicate/ambiguous target rows | 1 |
| Current request target paths missing from source zip | 37 |

## Files Imported By Priority Batch

| Priority batch | Imported files |
| --- | ---: |
| Priority 1: Missing/broken active assessment audio | 61 |
| Priority 2: Old/original active assessment audio | 117 |
| Priority 3: Frequent human-review items | 78 |
| Priority 4: Low-priority inactive/rare/uncertain items | 309 |

## Audit Counts Before And After

| Audit metric | Before import | After import |
| --- | ---: | ---: |
| Total references | 6483 | 6483 |
| Total physical files | 1748 | 2270 |
| Standard voice count | 3393 | 3393 |
| Replacement needed count | 1262 | 1154 |
| Missing audio count | 154 | 0 |
| Broken reference count | 154 | 0 |
| Needs human review count | 2022 | 2022 |

Focused audio-role checker after import:

- Remaining missing target-word audio requests: 37
- Blocking audio-role failures: 0
- Short Vowel Discrimination remains role-clean; the bun item resolves to `/audio/child-mode/clean-human/words/bun.mp3`.

## Remaining Missing Target-Word Audio

The broad assessment audio audit now reports 0 missing/broken references. The focused audio-role checker still lists 37 target-word paths where the normalized role-specific destination is not present in the pack. These remain in `docs/assets/replacement_assessment_audio_request.md` under the audio-role consistency addendum.

Current approved request paths not present in the source zip:

| Requested target path | Import status |
| --- | --- |
| `/audio/child-mode/clean-human/words/goldfish.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/hairbrush.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/jellyfish.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/paintbrush.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/sh.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/toothbrush.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/th.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/tooth.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/ballshell.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/baseball.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/doll.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/football.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/hill.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/inkwell.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/quill.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/sealshell.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/uphill.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/volleyball.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/waterfall.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/building.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/ng.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/unpacking.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/diamond.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/island.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/nd.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/playground.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/pond.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/quicksand.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/sand.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/underground.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/goalpost.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/nest.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/violinist.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/bookdesk.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/kiosk.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/sk.mp3` | Not present in source zip |
| `/audio/child-mode/clean-human/words/gift.mp3` | Not present in source zip |


## Import Safety

- Imported files were limited to approved paths under `public/audio/child-mode/clean-human/hfw/`, `public/audio/child-mode/clean-human/words/`, and `public/audio/child-mode/clean-human/phrases/`.
- No Guided Reading files were changed by this import.
- No question text, scoring, progression, Supabase/auth, teacher dashboard, or report code was changed.
- Existing files at approved replacement paths were overwritten only because they matched explicit replacement targets in the request/manifest.

## Sample Imported Files

| Batch | Script | Target path | Action |
| --- | --- | --- | --- |
| Priority 1 | after | `/audio/child-mode/clean-human/hfw/after.mp3` | created approved target |
| Priority 1 | again | `/audio/child-mode/clean-human/hfw/again.mp3` | created approved target |
| Priority 1 | am | `/audio/child-mode/clean-human/hfw/am.mp3` | created approved target |
| Priority 4 | an | `/audio/child-mode/clean-human/hfw/an.mp3` | overwritten approved target |
| Priority 1 | any | `/audio/child-mode/clean-human/hfw/any.mp3` | created approved target |
| Priority 4 | are | `/audio/child-mode/clean-human/hfw/are.mp3` | overwritten approved target |
| Priority 1 | around | `/audio/child-mode/clean-human/hfw/around.mp3` | created approved target |
| Priority 4 | as | `/audio/child-mode/clean-human/hfw/as.mp3` | overwritten approved target |
| Priority 1 | ask | `/audio/child-mode/clean-human/hfw/ask.mp3` | created approved target |
| Priority 1 | asked | `/audio/child-mode/clean-human/hfw/asked.mp3` | created approved target |
| Priority 1 | away | `/audio/child-mode/clean-human/hfw/away.mp3` | created approved target |
| Priority 4 | be | `/audio/child-mode/clean-human/hfw/be.mp3` | overwritten approved target |
| Priority 1 | before | `/audio/child-mode/clean-human/hfw/before.mp3` | created approved target |
| Priority 1 | big | `/audio/child-mode/clean-human/hfw/big.mp3` | created approved target |
| Priority 1 | blue | `/audio/child-mode/clean-human/hfw/blue.mp3` | created approved target |
| Priority 4 | by | `/audio/child-mode/clean-human/hfw/by.mp3` | overwritten approved target |
| Priority 1 | came | `/audio/child-mode/clean-human/hfw/came.mp3` | created approved target |
| Priority 1 | cold | `/audio/child-mode/clean-human/hfw/cold.mp3` | created approved target |
| Priority 4 | come | `/audio/child-mode/clean-human/hfw/come.mp3` | overwritten approved target |
| Priority 4 | could | `/audio/child-mode/clean-human/hfw/could.mp3` | overwritten approved target |
| Priority 4 | down | `/audio/child-mode/clean-human/hfw/down.mp3` | overwritten approved target |
| Priority 1 | every | `/audio/child-mode/clean-human/hfw/every.mp3` | created approved target |
| Priority 1 | find | `/audio/child-mode/clean-human/hfw/find.mp3` | created approved target |
| Priority 1 | fly | `/audio/child-mode/clean-human/hfw/fly.mp3` | created approved target |
| Priority 4 | for | `/audio/child-mode/clean-human/hfw/for.mp3` | overwritten approved target |
| Priority 1 | found | `/audio/child-mode/clean-human/hfw/found.mp3` | created approved target |
| Priority 4 | from | `/audio/child-mode/clean-human/hfw/from.mp3` | overwritten approved target |
| Priority 1 | funny | `/audio/child-mode/clean-human/hfw/funny.mp3` | created approved target |
| Priority 1 | give | `/audio/child-mode/clean-human/hfw/give.mp3` | created approved target |
| Priority 4 | go | `/audio/child-mode/clean-human/hfw/go.mp3` | overwritten approved target |
| Priority 1 | going | `/audio/child-mode/clean-human/hfw/going.mp3` | created approved target |
| Priority 4 | had | `/audio/child-mode/clean-human/hfw/had.mp3` | overwritten approved target |
| Priority 4 | has | `/audio/child-mode/clean-human/hfw/has.mp3` | overwritten approved target |
| Priority 4 | have | `/audio/child-mode/clean-human/hfw/have.mp3` | overwritten approved target |
| Priority 1 | help | `/audio/child-mode/clean-human/hfw/help.mp3` | created approved target |
| Priority 1 | helps | `/audio/child-mode/clean-human/hfw/helps.mp3` | created approved target |
| Priority 1 | here | `/audio/child-mode/clean-human/hfw/here.mp3` | created approved target |
| Priority 1 | him | `/audio/child-mode/clean-human/hfw/him.mp3` | created approved target |
| Priority 4 | how | `/audio/child-mode/clean-human/hfw/how.mp3` | overwritten approved target |
| Priority 1 | i | `/audio/child-mode/clean-human/hfw/i.mp3` | created approved target |
| Priority 4 | into | `/audio/child-mode/clean-human/hfw/into.mp3` | overwritten approved target |
| Priority 1 | jump | `/audio/child-mode/clean-human/hfw/jump.mp3` | created approved target |
| Priority 4 | just | `/audio/child-mode/clean-human/hfw/just.mp3` | overwritten approved target |
| Priority 4 | know | `/audio/child-mode/clean-human/hfw/know.mp3` | overwritten approved target |
| Priority 1 | let | `/audio/child-mode/clean-human/hfw/let.mp3` | created approved target |
| Priority 4 | like | `/audio/child-mode/clean-human/hfw/like.mp3` | overwritten approved target |
| Priority 4 | little | `/audio/child-mode/clean-human/hfw/little.mp3` | overwritten approved target |
| Priority 1 | live | `/audio/child-mode/clean-human/hfw/live.mp3` | created approved target |
| Priority 4 | look | `/audio/child-mode/clean-human/hfw/look.mp3` | overwritten approved target |
| Priority 1 | made | `/audio/child-mode/clean-human/hfw/made.mp3` | created approved target |
| Priority 4 | make | `/audio/child-mode/clean-human/hfw/make.mp3` | overwritten approved target |
| Priority 1 | may | `/audio/child-mode/clean-human/hfw/may.mp3` | created approved target |
| Priority 4 | me | `/audio/child-mode/clean-human/hfw/me.mp3` | overwritten approved target |
| Priority 1 | must | `/audio/child-mode/clean-human/hfw/must.mp3` | created approved target |
| Priority 4 | my | `/audio/child-mode/clean-human/hfw/my.mp3` | overwritten approved target |
| Priority 1 | new | `/audio/child-mode/clean-human/hfw/new.mp3` | created approved target |
| Priority 4 | not | `/audio/child-mode/clean-human/hfw/not.mp3` | overwritten approved target |
| Priority 4 | now | `/audio/child-mode/clean-human/hfw/now.mp3` | overwritten approved target |
| Priority 1 | old | `/audio/child-mode/clean-human/hfw/old.mp3` | created approved target |
| Priority 1 | once | `/audio/child-mode/clean-human/hfw/once.mp3` | created approved target |
| Priority 4 | one | `/audio/child-mode/clean-human/hfw/one.mp3` | overwritten approved target |
| Priority 1 | open | `/audio/child-mode/clean-human/hfw/open.mp3` | created approved target |
| Priority 1 | our | `/audio/child-mode/clean-human/hfw/our.mp3` | created approved target |
| Priority 4 | out | `/audio/child-mode/clean-human/hfw/out.mp3` | overwritten approved target |
| Priority 2 | over | `/audio/child-mode/clean-human/hfw/over.mp3` | overwritten approved target |
| Priority 1 | play | `/audio/child-mode/clean-human/hfw/play.mp3` | created approved target |
| Priority 1 | please | `/audio/child-mode/clean-human/hfw/please.mp3` | created approved target |
| Priority 1 | pretty | `/audio/child-mode/clean-human/hfw/pretty.mp3` | created approved target |
| Priority 1 | put | `/audio/child-mode/clean-human/hfw/put.mp3` | created approved target |
| Priority 1 | read | `/audio/child-mode/clean-human/hfw/read.mp3` | created approved target |
| Priority 1 | red | `/audio/child-mode/clean-human/hfw/red.mp3` | created approved target |
| Priority 1 | round | `/audio/child-mode/clean-human/hfw/round.mp3` | created approved target |
| Priority 1 | run | `/audio/child-mode/clean-human/hfw/run.mp3` | created approved target |
| Priority 1 | saw | `/audio/child-mode/clean-human/hfw/saw.mp3` | created approved target |
| Priority 1 | say | `/audio/child-mode/clean-human/hfw/say.mp3` | created approved target |
| Priority 4 | see | `/audio/child-mode/clean-human/hfw/see.mp3` | overwritten approved target |
| Priority 1 | sleep | `/audio/child-mode/clean-human/hfw/sleep.mp3` | created approved target |
| Priority 4 | some | `/audio/child-mode/clean-human/hfw/some.mp3` | overwritten approved target |
| Priority 1 | soon | `/audio/child-mode/clean-human/hfw/soon.mp3` | created approved target |
| Priority 1 | stop | `/audio/child-mode/clean-human/hfw/stop.mp3` | created approved target |

_Showing first 80 of 565 imported files._


## Validation

Completed after import:

- `node tools/checkAssessmentAudioRoleConsistency.js`: passed
- `node tools/checkAssessmentRuntimeSafety.js`: passed
- `node tools/checkRuntimeQuestionCoverage.js`: passed
- `node tools/auditAssessmentAudio.js`: completed, missing/broken audio now 0

Additional validation:

- `npm run build`: passed
- `git diff --check`: passed
