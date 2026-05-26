# Guided Reading Level C Image Alignment Audit

Date checked: 2026-05-26

## Scope

Books audited:

- `gs-c-01` - The Lion and the Little Mouse
- `gs-c-02` - The Crow and the Water Jar
- `gs-c-03` - The Fox and the High Grapes
- `gs-c-04` - The Dog and the River Shadow
- `gs-c-06` - The Bell in the Tree

## Root Cause

The Level C review books had two image sets in the project:

- nested runtime paths such as `/guided-reading/pages/gs-c-01/page-001.webp`
- flat generated/remake paths such as `/guided-reading/pages/gs-c-01-page-01.webp`

The review wrapper was set up to support page remapping, but the remap table was empty. That meant the reader kept using the nested page order even when the better matching QA/remake images lived in the flat generated set. Several books therefore showed images that were one or more story beats away from the current page text.

## Fix Applied

The Level C review wrapper now uses an explicit page-to-image remap table. The app text remains unchanged. Books remain visible in review mode. Images now point to the best available matching page image before the next QA pass.

## Page Remap Table

### `gs-c-01` - The Lion and the Little Mouse

| Text page | Image source page | Notes |
| --- | ---: | --- |
| 1 | 2 | Lion sleeping under tree. |
| 2 | 4 | Lion and mouse interaction. |
| 3 | 3 | Mouse running away. |
| 4 | 8 | Lion caught in net. |
| 5 | 5 | Lion roaring in net with birds startled. |
| 6 | 9 | Mouse by the net ropes. |
| 7 | 9 | Same best available rope image; needs QA for whether a new chewing-rope image is needed. |
| 8 | 10 | Lion free after the net opens. |
| 9 | 7 | Lion and mouse together for thanks. |
| 10 | 6 | Lion and mouse calm together. |

### `gs-c-02` - The Crow and the Water Jar

| Text page | Image source page | Notes |
| --- | ---: | --- |
| 1 | 2 | Crow flying over garden. |
| 2 | 3 | Crow at the clay jar. |
| 3 | 3 | Same best available jar/reach image. |
| 4 | 4 | Crow notices stones near wall. |
| 5 | 6 | Crow carrying/dropping a stone. |
| 6 | 8 | Water and stones rising. |
| 7 | 6 | Same best available stone-carrying image; may need new persistence image. |
| 8 | 10 | Crow drinking from jar. |
| 9 | 4 | Sparrow watching near jar. |
| 10 | 10 | Crow and sparrow near completed jar. |

### `gs-c-03` - The Fox and the High Grapes

| Text page | Image source page | Notes |
| --- | ---: | --- |
| 1 | 2 | Fox walking by vineyard. |
| 2 | 3 | Fox looking at grapes. |
| 3 | 4 | Fox reaching for grapes. |
| 4 | 7 | Fox landing in dust. |
| 5 | 8 | Fox pausing with embarrassment. |
| 6 | 5 | Bird by fence and fox near grapes. |
| 7 | 5 | Same best available fox-and-bird image; may need new sour-grapes expression image. |
| 8 | 8 | Fox thinking honestly. |
| 9 | 9 | Fox speaking honestly to bird. |
| 10 | 5 | Best available walking-away image; may need stronger ending image. |

### `gs-c-04` - The Dog and the River Shadow

| Text page | Image source page | Notes |
| --- | ---: | --- |
| 1 | 2 | Dog carrying treat near village. |
| 2 | 3 | Dog crossing bridge. |
| 3 | 4 | Dog sees reflection. |
| 4 | 5 | Dog tempted by reflection/treat. |
| 5 | 6 | Treat drops into river. |
| 6 | 7 | Dog sees ripples/empty river. |
| 7 | 7 | Same best available bridge-loss image. |
| 8 | 9 | Baker speaking to dog. |
| 9 | 8 | Dog sad/thoughtful after poor choice. |
| 10 | 10 | Dog walking home calmly. |

### `gs-c-06` - The Bell in the Tree

| Text page | Image source page | Notes |
| --- | ---: | --- |
| 1 | 3 | Mina hanging bell with Taro watching. |
| 2 | 1 | Taro chasing leaf in wind. |
| 3 | 4 | Mina listening/calling near the bell tree. |
| 4 | 6 | Bell ringing as a sound cue. |
| 5 | 6 | Same best available dog-hears-bell image. |
| 6 | 6 | Same best available bell-ringing return image; may need a clearer running-back image. |
| 7 | 7 | Mina hugs Taro. |
| 8 | 5 | Best available garden rule/close-gate placeholder; likely needs remake. |
| 9 | 9 | Taro resting/listening near tree. |
| 10 | 10 | Closing friend-home image. |

## QA Reset

The Guided Reading Image QA local review state is version-reset to `2026-05-26-level-c-page-alignment-reset`. On the next admin QA page load, prior `match`, `no_match_remake`, `whole_book_continuity_remake`, and `whole_book_reject_story` labels are cleared to `unreviewed`.

A manual `Reset QA` button is also available on the Guided Reading Image QA page.

## Remaining QA Guidance

This pass fixes the page-to-text sequencing before the next visual quality QA. It does not approve the image set. Any page listed as reusing a "best available" image should be reviewed carefully and may still need a Kimi remake for stronger text-picture match or continuity.
