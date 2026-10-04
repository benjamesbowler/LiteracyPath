# Arcade learning pictures

The manifests in this folder own the original prompts, source pixels, runtime
derivatives and hashes for the reviewed picture-cue repairs. The game engines
own responses and recording delivery; an image path or an encoded file does not
establish that a learner heard a cue or answered independently.

- `manifest.json` records the horseshoe magnet original and twenty retained
  Sound Beat word pictures. It includes the reviewed lamp for the spoken word
  "light". The shared child-word resolver selects these pictures.
- `letter-leap/manifest.json` records an isolated stump and eight sentence
  scenes. Letter Leap marks those scenes as sentence context, preserving the
  distinction between a scene illustration and an independently recognisable
  word. Its v2 plan changes only the two missing-recording slots, from grump to
  stump and robot to rocket; the global curriculum banks are unchanged.

Rebuild the magnet with `node tools/buildArcadeCueMedia.mjs`. Add `--letter-leap`
to rebuild all nine Leap deliveries as well. The encoder reads the retained
originals, writes WebP derivatives and refreshes their exact hashes. The seed
scene's first image is retained as the input to its reviewed repair; the
complete watering-can version is the selected runtime source.

The delivered cues have no printed spelling targets. Reviewed source pixels,
actual decoding and local recorded-file coverage are separate from native
playback receipts. Automated review does not imply human listening, classroom
observation or physical-device verification.
