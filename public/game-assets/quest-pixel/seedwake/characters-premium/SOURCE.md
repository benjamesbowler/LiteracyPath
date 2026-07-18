# Seedwake Named Cast

Pip, Moss, Tumble, and Bramble are project-authored 64-pixel resident animation
kits produced for Sound Seekers on 17 July 2026 with OpenAI image generation,
then manually curated into exact Phaser sprite grids.

Each named resident includes:

- a four-direction, four-frame walk sheet (`256x256`);
- a four-frame front-facing idle sheet (`256x64`);
- a four-frame role-specific work sheet (`256x64`); and
- a four-frame celebration sheet (`256x64`).

The source prompts lock each resident's identity, job, equipment, palette,
direction order, foot anchor, animation intent, and flat chroma-key background.
Generated sources were chroma-keyed, inspected frame by frame, resized with
nearest-neighbour sampling, and assembled without runtime procedural drawing.

Character ownership:

- Pip: lantern keeper and meadow scout
- Moss: seed gardener
- Tumble: ford builder
- Bramble: gate keeper

These project-authored files are not part of the upstream Ninja Adventure CC0
pack documented at `public/game-assets/quest-pixel/SOURCE.md`.
