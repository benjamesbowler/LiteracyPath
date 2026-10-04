# Arcade learning pictures

The manifests in this folder own the original prompts, source pixels, runtime
derivatives and hashes for the reviewed picture-cue repairs. The game engines
own responses and recording delivery; an image path or an encoded file does not
establish that a learner heard a cue or answered independently.

- `manifest.json` records three original pictures (magnet, chill and thud) and
  forty-one retained word pictures for Sound Beat and Spell & Skate. It includes
  the reviewed lamp for "light", the sun scene for "bright" and the isolated
  smiling face. The shared child-word resolver selects these pictures.
- `letter-leap/manifest.json` records an isolated stump and eight sentence
  scenes. Letter Leap marks those scenes as sentence context, preserving the
  distinction between a scene illustration and an independently recognisable
  word. Its v2 plan changes only the two missing-recording slots, from grump to
  stump and robot to rocket; the global curriculum banks are unchanged.
- `action/manifest.json` records nine original and twenty-eight retained Arcade
  cue pictures for Rhyme Pop and Reel & Read. Broad scenes such as "helpful" are
  explicitly recorded-word meaning context and stay outside assessment image
  matching. Its generated lookup is consumed through `getArcadeCuePicture`.
  The flat square replaces the cube in Arcade; "glow" uses a close luminous
  firefly rather than a tiny jar in a crowded scene. Two retained Cycle Leda
  recordings, cupcake and itch, keep their current exact authoring provenance.

Rebuild the three originals with `node tools/buildArcadeCueMedia.mjs`. Add `--letter-leap`
to rebuild all nine Leap deliveries as well. The encoder reads the retained
originals, writes WebP derivatives and refreshes their exact hashes. The seed
scene's first image is retained as the input to its reviewed repair; the
complete watering-can version is the selected runtime source.

Add `--action` to encode its nine originals and regenerate the scoped Arcade
lookup. This performs local encoding only, with no recording or generation API.

The delivered cues have no printed spelling targets. Reviewed source pixels,
actual decoding and local recorded-file coverage are separate from native
playback receipts. Automated review does not imply human listening, classroom
observation or physical-device verification.
