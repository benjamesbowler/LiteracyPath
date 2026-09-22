# Blender Arcade world kit

`Arcade-worlds.blend` is the editable source. Each named scene contains semantic
parts, non-destructive edge modifiers, a delivery camera and three area lights.
`tools/blender/build_arcade_assets.py` reproduces the source, compact GLB exports,
and the generated asset/provenance manifest. Review renders go to ignored
`.artifacts/blender-arcade/`. Run the script with the installed Blender executable
in background mode. The GLBs alone are deployed; the source is retained here.

The three worlds also receive distinct foliage: rounded woodland copses with
wildflowers, broad cycad fronds and luminous mushroom groves.

The authored forms use rounded manufactured edges, ivory/teal/coral rocket
bodywork, warm plaster and timber in Meadow, exposed stone and fossils in Dino,
and a lantern observatory in Moonwood. Space observatories, solar outposts and
crystalline asteroids provide distinct silhouettes beside Rocket Run's lanes.
The rocket has a sculpted fuselage, swept wings, cockpit, independent nacelles
and a dorsal stabiliser; the game supplies banking, boost, catch and engine
animation from its existing simulation.

Sound Racer uses instanced landmarks outside the current road-clearance envelope.
The windmill rotor has its own centred export pivot and turns during active play;
pause and reduced motion stop its motion. Kerbs, road, literacy gates, the existing
Pip driver and collision/evidence rules stay owned by their current modules.
Rocket Run streams the new scenery through its existing quality tiers and keeps
its complete procedural corridor and craft available during asset failure.

All ten assets are original geometry authored locally in Blender for this
project, with no external model, texture or character inputs. Rights follow the
project's terms; this is not a third-party CC0 pack. The generated runtime
manifest records byte sizes, hashes, axes, tool version and reproducible source.
Material-merged runtime meshes have no external texture/buffer dependencies.

Validate with the Blender asset unit checks, existing Sound Racer production and
circuit checks, Rocket Run controls/audio checks and Arcade rendering checks.
Inspect actual game frames in all three Sound Racer worlds, Rocket Run, reduced
motion and failed loads. Browser verification does not establish physical iPad,
human listening or observed-child results.
