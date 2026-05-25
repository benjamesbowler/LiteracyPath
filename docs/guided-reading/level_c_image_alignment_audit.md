# Level C Guided Story Image Alignment Audit

Generated: 2026-05-25

## Summary

The Level C pilot images were not production-ready as originally mapped. Several books had page-image sequencing drift where a generated image matched an earlier or later page better than the page it was attached to.

Runtime action taken:

- Kept the five pilot books visible for teacher review.
- Remapped the clearest shifted images to the page text they best support.
- Preserved `originalImage` and `imageRemapSourcePage` on remapped pages for traceability.
- Changed pilot QA state to `needs_image_alignment_review`.
- Added a Guided Reading Image QA admin page so the user can mark `Text-picture match` or `No match remake image using text` and export a Kimi remake request.

## Remap Table

| Book ID | Title | App Page | Current Image Source Page | Notes |
|---|---|---:|---:|---|
| gs-c-01 | The Lion and the Little Mouse | 1 | 2 | Better than empty landscape; still lacks Pip over paw. |
| gs-c-01 | The Lion and the Little Mouse | 2 | 4 | Better shows lion and mouse interaction. |
| gs-c-01 | The Lion and the Little Mouse | 3 | 3 | Mouse running home. |
| gs-c-01 | The Lion and the Little Mouse | 4 | 8 | Shows lion trapped in net. |
| gs-c-01 | The Lion and the Little Mouse | 5 | 5 | Lion roaring; acceptable review candidate. |
| gs-c-01 | The Lion and the Little Mouse | 6 | 9 | Shows net/ropes and mouse; needs review. |
| gs-c-01 | The Lion and the Little Mouse | 7 | 7 | Weak rope action; likely needs remake if teacher rejects. |
| gs-c-01 | The Lion and the Little Mouse | 8 | 10 | Shows freed lion and loose net; needs review. |
| gs-c-01 | The Lion and the Little Mouse | 9 | 6 | Better character interaction than original, but likely still weak. |
| gs-c-01 | The Lion and the Little Mouse | 10 | 10 | Closing image. |
| gs-c-02 | The Crow and the Water Jar | 1 | 2 | Crow flying/searching. |
| gs-c-02 | The Crow and the Water Jar | 2 | 1 | Jar scene; lacks Cora but fits discovery setup better. |
| gs-c-02 | The Crow and the Water Jar | 3 | 3 | Beak in jar. |
| gs-c-02 | The Crow and the Water Jar | 4 | 4 | Garden/jar context; stones need review. |
| gs-c-02 | The Crow and the Water Jar | 5 | 8 | Crow with stone at jar; better action. |
| gs-c-02 | The Crow and the Water Jar | 6 | 6 | General jar action; needs review. |
| gs-c-02 | The Crow and the Water Jar | 7 | 7 | Crow continuing task. |
| gs-c-02 | The Crow and the Water Jar | 8 | 9 | Crow drinking from raised water. |
| gs-c-02 | The Crow and the Water Jar | 9 | 10 | Sparrow beside crow and jar. |
| gs-c-02 | The Crow and the Water Jar | 10 | 5 | Plan/idea image, but lightbulb symbol may need remake. |
| gs-c-03 | The Fox and the High Grapes | 1 | 2 | Fox walking by vineyard. |
| gs-c-03 | The Fox and the High Grapes | 2 | 3 | Fox looking at high grapes. |
| gs-c-03 | The Fox and the High Grapes | 3 | 4 | Jumping toward grapes. |
| gs-c-03 | The Fox and the High Grapes | 4 | 7 | Landing/missed jump. |
| gs-c-03 | The Fox and the High Grapes | 5 | 5 | Fox checks who saw. |
| gs-c-03 | The Fox and the High Grapes | 6 | 6 | Bird and fox near grapes. |
| gs-c-03 | The Fox and the High Grapes | 7 | 8 | Fox and bird after sour-grapes claim; needs review. |
| gs-c-03 | The Fox and the High Grapes | 8 | 9 | Fox walking away/stopping. |
| gs-c-03 | The Fox and the High Grapes | 9 | 3 | Weak fit; likely needs remake. |
| gs-c-03 | The Fox and the High Grapes | 10 | 10 | Grapes-only closing is weak; likely needs remake. |
| gs-c-04 | The Dog and the River Shadow | 1 | 9 | Baker/dog scene; best available for treat source. |
| gs-c-04 | The Dog and the River Shadow | 2 | 3 | Bridge crossing. |
| gs-c-04 | The Dog and the River Shadow | 3 | 4 | Reflection/other dog. |
| gs-c-04 | The Dog and the River Shadow | 4 | 5 | Dog considers reflection/treat. |
| gs-c-04 | The Dog and the River Shadow | 5 | 6 | Treat falling into water. |
| gs-c-04 | The Dog and the River Shadow | 6 | 7 | Ripples/empty river. |
| gs-c-04 | The Dog and the River Shadow | 7 | 5 | Weak fit; likely needs remake. |
| gs-c-04 | The Dog and the River Shadow | 8 | 9 | Baker asks Rex. |
| gs-c-04 | The Dog and the River Shadow | 9 | 8 | Sad dog. |
| gs-c-04 | The Dog and the River Shadow | 10 | 10 | Dog goes home. |
| gs-c-06 | The Bell in the Tree | 1 | 3 | Mina, Taro, tree, bell. |
| gs-c-06 | The Bell in the Tree | 2 | 2 | Taro running; leaf/gate absent, needs review. |
| gs-c-06 | The Bell in the Tree | 3 | 1 | Empty tree/bell works better for listening moment. |
| gs-c-06 | The Bell in the Tree | 4 | 4 | Bell ringing under tree. |
| gs-c-06 | The Bell in the Tree | 5 | 5 | Taro hears bell. |
| gs-c-06 | The Bell in the Tree | 6 | 6 | Mina rings bell; muddy/run action weak. |
| gs-c-06 | The Bell in the Tree | 7 | 8 | Reunion/hug. |
| gs-c-06 | The Bell in the Tree | 8 | 7 | Weak fit; likely needs remake for gate rule. |
| gs-c-06 | The Bell in the Tree | 9 | 9 | Taro under tree. |
| gs-c-06 | The Bell in the Tree | 10 | 10 | Extra child appears; likely needs remake. |

## Admin QA Workflow

Use the admin page `Guided Reading Image QA` to review the corrected current mappings.

- Choose `Text-picture match` for pages that are acceptable.
- Choose `No match remake image using text` for pages Kimi must regenerate.
- Export `Kimi Remake Request` after reviewing all books.

## Known Remaining Concerns

Some pages still have no strong matching image in the supplied pack. Those should be marked for remake rather than forced into production.
