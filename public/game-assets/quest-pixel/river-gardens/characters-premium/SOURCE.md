# River Gardens Named Cast

Nori, Fizz, Quill, and Rill are project-authored 64-pixel resident animation
kits produced for Sound Seekers on 17 July 2026 with OpenAI image generation,
then manually curated into exact Phaser sprite grids.

Each named resident includes:

- a four-direction, four-frame walk sheet (`256x256`);
- a four-frame front-facing idle sheet (`256x64`);
- a four-frame role-specific work sheet (`256x64`); and
- a four-frame celebration sheet (`256x64`).

The source boards use a fixed character-row and direction/action-column contract.
Generated cells were isolated from a flat chroma key, inspected, point-sampled,
bottom-anchored on 64-pixel transparent canvases, and assembled without runtime
procedural character drawing.

Character ownership:

- Nori: otter river pilot and paddler
- Fizz: bee engineer and waterwheel mechanic
- Quill: porcupine canal cartographer
- Rill: newt weir conductor

These project-authored files are not part of the upstream Ninja Adventure CC0
pack documented at `public/game-assets/quest-pixel/SOURCE.md`.
