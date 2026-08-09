# Fossil Canyon Named Cast

Fen, Rook, Amber, and Claw are project-authored 64-pixel resident animation
kits produced for Sound Seekers on 17 July 2026 with OpenAI image generation,
then manually curated into exact Phaser sprite grids.

Each named resident includes:

- a four-direction, four-frame walk sheet (`256x256`);
- a four-frame front-facing idle sheet (`256x64`);
- a four-frame role-specific work sheet (`256x64`); and
- a four-frame celebration sheet (`256x64`).

The source boards use a fixed character-row and direction/action-column contract.
Generated cells were isolated from a flat chroma key, cleaned of colour fringe,
point-sampled, bottom-anchored on 64-pixel transparent canvases, and assembled
without runtime procedural character drawing.

Character ownership:

- Fen: fennec fossil ranger and field brusher
- Rook: corvid bone surveyor and map reader
- Amber: young triceratops dig captain
- Claw: feathered raptor pass runner and signal caller

These project-authored files are not part of the upstream Ninja Adventure CC0
pack documented at `public/game-assets/quest-pixel/SOURCE.md`.
