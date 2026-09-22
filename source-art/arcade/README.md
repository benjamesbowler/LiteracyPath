# Blender Arcade world kit

`Arcade-worlds.blend` is the editable source for all 13 current Arcade games.
Its 21 named scenes retain semantic parts, non-destructive edge modifiers,
delivery cameras, lights and independently editable animated details.

| Arcade game | Blender delivery | Motion |
| --- | --- | --- |
| Sound Racer | Meadow windmills/copses, Dino fossil arches/cycads, Moonwood observatories/mushrooms | Rotating windmill sails |
| Rocket Run | Courier craft, observatories, solar outposts, crystal asteroids | Existing flight, banking, boost and corridor movement |
| Letter Leap | Treetop burrows | Hanging lantern |
| Word Climb | Branch-supported cloud lookouts | Hanging lantern |
| Word Bridge | Bank-side construction workshop | Suspended tool counterweight |
| Sound Beat | Percussion pavilion | Cymbals follow successful beat pulses |
| Rhyme Pop | Festival pavilion | Pennant movement |
| Sound Safari | Canopy field station | Hanging field lantern |
| Reel & Read | Harbour waterwheel | Turning wheel |
| Sentence Grove | Orchard greenhouses | Turning weather vanes |
| Sentence Express | Station and clock tower | Clock hand |
| Spell & Skate | Sheltered park pavilions | Turning weather vanes |
| SoundKeys | Resonance instrument | Pendulum responds during playing and celebration |

## Rebuild and delivery

Run `tools/blender/build_arcade_assets.py` with the installed Blender executable
in background mode. It loads `arcade_world_extensions.py` and invokes
`pack_arcade_frames.py` using `python3` with Pillow installed. The packer only
assembles frames: all geometry, lighting, surfaces and animation are rendered
by Blender. Review renders go to ignored `.artifacts/blender-arcade/`.

The native 3D games load compact GLBs. The eight canvas/DOM games load transparent
WebP animation atlases instead of adding another WebGL context. Each atlas has
24 registered 384px frames, arranged in four columns, covering a four-second
Blender animation at six frames per second. Every new landmark also retains its
animated GLB as a reusable native export. The editable `.blend` stays outside
the deployed public directory.

The generated manifest records per-file sizes/hashes, axes, animation pivots,
Blender version and hashes of all three authoring inputs. All 21 models are
original project-authored geometry with no external model, texture or character
inputs. Rights follow the project's terms; this is not a third-party CC0 pack.
GLBs have no external texture/buffer dependencies.

## Runtime boundaries

The existing characters, answer targets, physical routes, collisions, scoring,
feedback and audio remain owned by their current games. Landmarks sit outside
physical 3D play areas; Word Climb's lookouts have visible branch supports.
Sound Racer uses instanced models outside its road-clearance envelope. The
Rocket Run craft retains its complete procedural fallback during asset failure.

Sprite animation follows active game time, with no independent game timer.
Pause freezes the details and reduced-motion mode suppresses their animation.
Sound Beat uses its existing beat pulse; SoundKeys animates during performance.
Native landmark scopes release shared model resources once, and both loaders
discard late results after leaving. Failed decorative loads leave the original
playfield and controls available.

## Verification

Run `tests/unit/arcadeBlenderAssets.test.js` for complete Arcade coverage,
authoring/export provenance, real animation tracks, loader failure, pause,
reduced motion and disposal. Exercise each affected game's existing browser
checks, the mobile-layout profile and direct play. Inspect actual game frames
at tablet and small-screen sizes; inspect motion in the saved Blender project
and in the games. Browser verification does not establish physical iPad,
human listening or observed-child results.
