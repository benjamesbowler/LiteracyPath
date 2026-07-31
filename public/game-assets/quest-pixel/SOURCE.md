# Sound Seekers pixel asset source

The curated sprite, tile, animation, atmosphere, collectible, and non-voice sound-effect files under `seedwake/`, `dino/`, and `moonwood/` come from **Ninja Adventure - Asset Pack** by Pixel-boy and AAA.

- Source: https://pixel-boy.itch.io/ninja-adventure-asset-pack
- Creator: https://pixel-boy.itch.io/
- License: Creative Commons Zero 1.0 Universal (CC0 1.0)
- Local license copy: `license/CC0-1.0.txt`

The pack permits reuse, modification, and commercial use without attribution. This note is retained so future asset work can verify provenance and keep the visual kit coherent.

Every resident directory now retains the source character's authored `Idle`, `Item`, and `Jump` performances beside its directional walk sheet. The runtime uses those separate poses for resting, presenting task objects, success reactions, and chapter ceremonies instead of slicing false work and celebration loops from locomotion frames. `samurai-green` is the pack's `CamouflageGreen` character; its displayed project name is retained for compatibility with saved chapter casts.

The `ninja-blue`, `samurai-blue`, and `samurai-green` directional sheets, cache pots and crates, reactive grass, debris strips, and authored rain, ground-splash, cloud, and snow sheets were copied from the creator's official Godot 4 project at commit `6ac7823`. The original CC0 pack also supplies the two complete Fossil Canyon cave-family variants, Moonwood's orange sorcerer, green robot, and skeleton, plus the dedicated idle sheets retained beside all twelve Fossil and Moonwood walk sheets:

- Source repository: https://github.com/pixel-boy/NinjaAdventure
- Pack license confirmation: https://pixel-boy.itch.io/ninja-adventure-asset-pack

## Project-authored premium kits

The shipping premium character, scenery, and interaction PNGs are current
Sound Seekers assets. Project-authored with OpenAI image generation on 17 July
2026, they were then curated locally into fixed transparent pixel-art canvases. They are not
part of the upstream CC0 pack. This is the single retained provenance note for:

- project-authored premium Seedwake scenery;
- project-authored premium River Gardens scenery;
- the project-authored Fossil Canyon scenery kit;
- the project-authored Fossil Canyon interaction kit;
- the project-authored Forge Settlement scenery kit;
- the project-authored Forge Settlement interaction kit;
- the project-authored Glass Marsh scenery kit;
- the project-authored Glass Marsh interaction kit;
- the project-authored Storm Coast scenery kit;
- the project-authored Storm Coast interaction kit;
- the project-authored Lantern Forest character, scenery, and interaction kits;
- Star Reach premium scenery sources and Star Reach premium interaction sources;
- named premium character casts for every current chapter.

The source boards used flat chroma backgrounds. Shipping derivatives were
chroma-keyed, inspected, point-resampled, and packed into the fixed canvases
verified by the runtime tests. Grapheme labels are applied by the renderer so
the artwork remains reusable across curriculum targets. Temporary generation
boards and machine-local paths are intentionally not retained.
