# Level C Guided Story Image Alignment Audit

Generated: 2026-05-25

## Summary

The Level C pilot books are visible for teacher review, but they should not be treated as production-approved yet. A visual contact-sheet audit found recurring image/text alignment problems, especially page sequencing drift where an image often appears to illustrate an earlier page rather than the current page.

Runtime action taken:

- Kept the five pilot books visible for teacher review.
- Changed their QA state to `needs_image_alignment_review`.
- Added an `Image Review` badge in the guided reading shelf.
- Left narration optional/hidden when missing.

## Books Checked

| Book ID | Title | Pages Checked | Status |
|---|---|---:|---|
| gs-c-01 | The Lion and the Little Mouse | 10 | Needs image alignment review |
| gs-c-02 | The Crow and the Water Jar | 10 | Needs image alignment review |
| gs-c-03 | The Fox and the High Grapes | 10 | Needs image alignment review |
| gs-c-04 | The Dog and the River Shadow | 10 | Needs image alignment review |
| gs-c-06 | The Bell in the Tree | 10 | Needs image alignment review |

## Page-Level Findings

### gs-c-01: The Lion and the Little Mouse

- Page 1 text introduces Luma sleeping and Pip running over his paw, but the image is an empty savanna/tree landscape with no lion or mouse visible.
- Page 2 image shows the sleeping lion under the tree, which better matches page 1 than page 2.
- Page 3 image shows Pip alone running, which misses the lion's reaction described in the text.
- Page 4 text says Luma is caught in a rope net, but the image shows the lion and mouse together without the net.
- Pages 5-8 appear shifted relative to the rescue sequence; the trapped lion image appears on page 8 after the text says the net has opened.
- Page 9 and page 10 better match the closing sequence but still need continuity review.

### gs-c-02: The Crow and the Water Jar

- Page 1 text says Cora flies over a dry garden looking for water, but the image focuses on an empty jar scene without Cora.
- Page 2 image introduces Cora flying but also includes unrelated small animals, while the text is about finding the jar.
- Page 4 text says Cora sees stones near the wall, but the image focuses on Cora and a sparrow near the jar.
- Page 5 image includes a lightbulb/idea symbol, which is visually distracting and not appropriate for clean guided reading illustration.
- Later pages generally communicate the water-jar sequence, but sparrow placement and stone action need tighter page matching.

### gs-c-03: The Fox and the High Grapes

- Page 1 text introduces Felix by the vine, but the image shows only a vineyard with no fox.
- Page 2 image shows Felix walking, which is closer to page 1 setup than the page 2 jump preparation.
- Page 6 text says the bird comments from the fence, but the image shows Felix actively jumping.
- Page 7 image shows Felix landing in dust, which better matches page 4.
- Page 10 image shows grapes only and omits Felix and the bird, weakening the ending's main idea.

### gs-c-04: The Dog and the River Shadow

- Page 1 text says Rex found a treat and carried it home, but the image focuses on a baker in the bakery with no clear dog/treat action.
- Page 2 image shows Rex in town rather than crossing the bridge described in the text.
- Page 3 and page 4 align more closely with bridge/reflection content.
- Page 6 image shows the falling treat, which better matches page 5 than page 6.
- Page 8 text introduces the baker asking Rex a question, but the image shows Rex alone in town.
- Page 9 image shows the baker and dog, which better matches page 8.

### gs-c-06: The Bell in the Tree

- Page 1 text says Mina hangs the bell while Taro watches, but the image shows only the tree and bell.
- Page 2 image shows Mina and Taro running together, but the text says Taro chased a leaf through the gate.
- Page 3 image shows Mina and Taro by the bell despite the text saying Taro did not come.
- Page 4 image shows Mina and Taro together again, weakening the “far away” listening moment.
- Page 6 text says Taro runs toward the bell with muddy paws, but the image shows a calm interaction under the tree.
- Page 10 adds an extra child not established in the story, which breaks continuity.

## Kimi Regeneration Guidance

For the next image pass, each page prompt must include:

- The exact page text.
- The required visible characters.
- The required action from that exact page only.
- A warning not to illustrate previous or later pages.
- No extra characters unless named in the page text.
- No embedded text, captions, speech bubbles, symbols, lightbulbs, or decorative idea icons.
- Character continuity from the book bible.

## Current Decision

The pilot remains visible because the user needs to review it, but it is now explicitly marked as image-review content rather than production-approved guided reading content.
