# Full-screen comprehension and ESL story pictures

## Intent and agreed direction

Make Reading Comprehension usable as an actual full-screen lesson without
scrolling. Add meaningful story illustrations to help early readers and ESL
learners understand the actions, objects and order of events.

The user chose **whichever picture format suits each passage**. Cover all 72
existing passages. Keep the current concrete K–3/ESL wording, phonics marks,
four-choice questions, Leda audio, private teacher reveals, saved practice and
black-and-white colouring style.

## Approaches

One large scene per passage gives objects and spatial relationships more room,
but cannot clearly show a changing sequence. A three-panel comic makes first,
next and last clear, but gives each moment less space. The selected approach
uses either format according to the exact passage: a single scene for a useful
snapshot; three panels for a problem, action and result. This is a teaching
choice per story, not random variation or reused character portraits.

A larger normal page would still compete with the app shell and printing
tools. Use a dedicated lesson stage launched by **Full screen**, with native
browser fullscreen where supported and a viewport-filling fallback otherwise.

## Lesson stage

- Hide the surrounding navigation, resource headers, catalogue and print tools
  while the stage is open. Keep the passage title, current mode and a clear
  Exit full screen control. Escape exits safely and restores focus.
- On classroom laptop and tablet landscape sizes, show the complete passage
  and its pictures beside one question with all four answer choices. Keep
  Check/Reveal, evidence feedback and Previous/Next reachable without scrolling.
- Use the available viewport, including mobile browser controls and safe areas.
  Preserve readable type and touch targets; do not shrink a whole desktop page
  into a tiny canvas or conceal overflow to claim fit.
- On narrow or short screens, use explicit Read / Pictures / Questions views
  instead of vertical scrolling. Keep the question state and audio controls
  stable when changing views. If text needs more than one readable screen,
  show clear previous/next text pages rather than clipping it.
- Keep Leda story/question playback, Stop and phonics marks available. Put word
  help in a short accessible support panel. Teacher notes stay private and do
  not appear automatically in the lesson stage.
- Entering/exiting fullscreen preserves the current passage, question, choice,
  reread ticks and practice. Stop narration on exit and retain the established
  stop/replay/navigation ownership rules. No new student-result writes.

## Pictures and print

Author one reviewed visual plan per passage, tied to its current text hash.
Record the exact scene(s), important prop states, setting, character reference
and short concrete alternative text. Sequence images must depict events in the
actual story order. No answer letters, correct-answer cues, extra story events,
pseudo-writing, speech balloons or decorative scene substitutions.

Use the approved six Guide designs and existing reference art. Preserve species,
silhouette, markings, clothing and props. Generate actual raster illustrations
through the built-in image tool and retain provenance. Check each image against
the story and reference at its displayed size; repair defective images before
release. Keep clean black outlines, white backgrounds and large colouring areas.

Pictures are supported-reading material, not independent-decoding evidence.
Provide Show/Hide pictures so a teacher can choose when to reveal the visual
support. If an image fails, explain it and keep reading and Leda usable.

Reuse each passage's approved illustration in a separate printable picture-story
page. Preserve the current reading/question sheets, independent drawing task
and matching teacher keys. Picture pages print in black and white without
shrinking current worksheets or replacing the child's own drawing activity.

## Verification and release

Exercise every passage's fullscreen layout and picture coverage, longest text,
longest choices, revealed evidence, completion, support, failed images, saved
retry, keyboard focus and native/fallback fullscreen exit. At minimum check
320×568, 568×320, 768×1024, 1024×768, 1366×768 and 1920×1080. Zero scrolling must
mean complete visible content in the active view, not clipped or hidden text.

Verify all 72 visual assignments, story/text hashes, real file decoding and
manual image-content inspection. Run the current comprehension, question,
image, mobile, print and regression gates appropriate to the final patch.
Render and inspect the complete picture-page PDF and retain evidence under
ignored `.artifacts/comprehension/`. Use the existing approved GitHub and live
release workflow, verify the deployed version and clean disposable task output.

Browser emulation, automatic image checks and production HTTP checks remain
distinct from physical-iPad, classroom and human-listening observations.
