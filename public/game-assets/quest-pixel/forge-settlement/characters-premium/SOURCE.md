# Forge Settlement Named Cast

Cinder, Bolt, Soot, and Bellows are project-authored 64-pixel resident animation
kits produced for Sound Seekers on 17 July 2026 with OpenAI image generation,
then manually curated into exact Phaser sprite grids.

Each named resident includes:

- a four-direction, four-frame walk sheet (`256x256`);
- a four-frame front-facing idle sheet (`256x64`);
- a four-frame role-specific work sheet (`256x64`); and
- a four-frame celebration sheet (`256x64`).

The source boards use a fixed character-row and direction/action-column contract.
Generated cells were isolated from a flat chroma key, point-sampled,
bottom-anchored on 64-pixel transparent canvases, and assembled without runtime
procedural character drawing.

Character ownership:

- Cinder: red-panda forge apprentice and gear assembler
- Bolt: brass-and-teal workshop robot and ore sorter
- Soot: soot-black salamander train driver and parcel runner
- Bellows: broad boar master smith and word-forge keeper

These project-authored files are not part of the upstream Ninja Adventure CC0
pack documented at `public/game-assets/quest-pixel/SOURCE.md`.
