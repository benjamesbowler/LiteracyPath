# Lantern Trail character assets

Created on 14 September 2026 for the explicitly requested Sound Seekers demo.

## Authorship and source

These are original Blender-authored meshes, materials, soft-part rigs and
animation clips created for this repository. No downloaded mesh, third-party
rig, texture pack, external generation service or external runtime asset is
included. The character designs follow the repository's existing canonical
images, which remain the design authority:

- `public/game-assets/sound-seekers/v3/cast/meadow/bouncy.webp`
- `public/game-assets/sound-seekers/v3/cast/meadow/woolly.webp`
- `public/game-assets/sound-seekers/v3/cast/meadow/clucky.webp`
- `public/game-assets/sound-seekers/v3/cast/meadow/splashy.webp`

The new geometry does not embed or redistribute those reference images. It
inherits this project's character rights; it is not a new CC0 character pack.

Editable source for all four characters: `../../source/characters.blend`.
Authoring recipes: run `../../source/build_characters.py` for Bouncy and Woolly,
then `../../source/build_residents.py` to add Clucky and Splashy. The second
recipe verifies that the working Bouncy and Woolly GLB hashes remain unchanged.
Authoring application: Blender 5.2.0 LTS, build `fbe6228777e7`.

## Runtime contract

Both models use glTF 2.0 GLB, +Y up, +Z forward, ground origin and no external
resources. Each contains one skinned surface. Materials use smooth shading and
standard glTF metallic/roughness values, with sRGB design colours converted to
linear values during authoring. No special shader or texture loader is needed.

| Model | Design | Height | Bytes | Triangles | Joints |
| --- | --- | ---: | ---: | ---: | ---: |
| `bouncy.glb` | Golden fleece, red scarf, two metal coil legs with five turns each, two hand hooves and two attached foot hooves | 2.2493 | 2,035,232 | 65,677 | 13 |
| `woolly.glb` | Cream fleece, blue eyes, peach nose, four natural lamb legs, no springs | 2.2600 | 1,446,020 | 46,190 | 11 |
| `clucky.glb` | Red-orange hen, red comb and paired wattles, tapered yellow beak, two wings and two three-toed feet | 1.6915 | 809,008 | 25,773 | 11 |
| `splashy.glb` | Yellow duckling, small feather crest, orange bill, two wings and two webbed feet | 1.7534 | 841,404 | 26,999 | 11 |

Each GLB includes clips with the same names:

| Character | `Idle` | `Walk` | `Celebrate` |
| --- | --- | --- | --- |
| Bouncy | 4-second breathing, ear motion and blink loop | 0.8333-second in-place spring step loop | 2.6667-second anticipation, jump, landing and settle |
| Woolly | 5-second breathing, head motion and blink loop | 1.3333-second in-place four-legged walk loop | 3-second gentle happy nod |
| Clucky | 4-second breathing, head motion and blink loop | 1-second in-place two-legged walk loop | 2.5-second happy wing flutter |
| Splashy | 4-second breathing, head motion and blink loop | 1-second in-place two-legged waddle loop | 2.5-second happy wing flutter |

Use `Idle` and `Walk` as loops and `Celebrate` as a one-shot clip, with short
cross-fades. Set walking animation speed in proportion to world travel speed.
Locomotion clips contain no root translation. Bouncy's spring vertices blend
between the body and each foot so that the visible spring remains attached
during compression, walking and celebration.

SHA-256:

- `bouncy.glb`: `9a28dd274c068d3733829d0d97c01cd5a0521b2bd8ba77f6b517b58eeee83054`
- `woolly.glb`: `f38f00ff7315c8ed5457b11bda06a03e9aaae65f2841ff332026be55f89ece44`
- `clucky.glb`: `db7dc75ffd7d8768ac12489d32d78f68131eb47edbe6fe0d191a09a9e7181d81`
- `splashy.glb`: `d8a63e9686e763f3ad24bc8f44c897ac0483abc5645c28959ec2207d410bd5eb`

## Verification and cleanup

All four exported GLBs were imported into fresh Blender scenes. The expected
rigs, skinned mesh, ground contact, dimensions and all three animation names
survived. Binary glTF checks confirmed version, complete file length, clip
durations, skin counts, no external resources and the per-model 6 MB budget.
Front and three-quarter rendered views of all four models, Bouncy's airborne
celebration pose and the birds' wing-flutter poses were directly inspected.
The palette, Bouncy's smile, Clucky's beak and both birds' shoulder joins were
refined after rendered review; final geometry was reduced for the demo.

Review evidence is kept in the ignored
`.artifacts/sound-seekers-lantern-demo/characters/` folder at repository root.
This asset evidence does not establish running-game camera quality, motion
matching, device performance, physical iPad use or observed child play; those
checks belong to the integrated demo.

Superseded GLBs and review renders were replaced in place. The automatically
created `characters.blend1` backup was removed after the current editable file
and runtime exports were verified. The source generator recreates the assets;
no disposable alternate character versions remain.
