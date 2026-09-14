# Sound Seekers woodland asset kit

Created for the requested five-minute 3D adventure demo on 14 September 2026.
The five models are original geometry authored with the accompanying Blender
Python source. No downloaded model, texture, rig, font or external generation
service contributes to this kit. There is no third-party attribution dependency.
This record describes asset evidence; gameplay, browser composition and device
performance are verified by the demo owner in the running scene.

## Source and export

- Authoring source: `build_forest.py`; Blender 5.2.0 LTS, build `fbe6228777e7`.
- Editable geometry and lit asset gallery: `forest.blend`.
- Runtime exports: `../assets/forest/*.glb`, glTF 2.0 binary with embedded geometry,
  vertex pigment and materials. No texture or remote file dependency.
- Orientation: exported Y-up; forward is +Z. The cottage door and steps face +Z.
- Origin: ground centre at Y=0. Blender's source uses Z-up and -Y forward; the
  exporter applies the glTF axis conversion.
- Static geometry is joined by material. The lantern tree retains six separate
  glowing meshes named `Lantern_1` through `Lantern_6`, each carrying
  `runtime_role: restoration_lantern` and a matching `lantern_index` in extras.
- `Woodland_Painted` uses the exported `COLOR_0` vertex pigment. Runtime should
  retain vertex colours. `Lantern_Warm_Emission` supplies the bulbs' warm glow.
  Clone that material per instance/bulb before independently changing intensity.
- Ground collision should follow the trunks/stem, not the canopy/roof bounds.
  The cottage roof is about 5.48 m wide; its body is about 2.9 m wide, and the
  three rounded steps extend in front of the door.

| Export | X width (m) | Y height (m) | Z depth (m) | Triangles | Draw primitives | Bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| tree.glb | 6.582 | 7.281 | 3.546 | 21,464 | 1 | 536,780 |
| cottage.glb | 5.483 | 5.218 | 5.673 | 48,622 | 1 | 1,223,508 |
| lantern-tree.glb | 9.956 | 9.942 | 4.861 | 76,964 | 7 | 1,893,900 |
| mushrooms.glb | 2.012 | 1.242 | 1.665 | 20,140 | 1 | 521,512 |
| rock.glb | 2.438 | 1.295 | 1.755 | 5,184 | 1 | 134,404 |

The kit is 4,310,104 bytes total. Each model is below the project's 6 MB limit.
Repeated scenery count, shadows and renderer resolution still need a sustained
performance check in the actual demo. These are static environment assets;
animation and rig checks do not apply.

## Rebuild and direct inspection

From this worktree:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python demos/sound-seekers/source/build_forest.py -- \
  --roundtrip-preview /private/tmp/sound-seekers-forest-roundtrip.png
```

The script exports all five models, saves the editable gallery, then deletes
the authoring scene objects and imports the actual GLBs into a fresh gallery.
It asserts finite geometry, ground origin within 2 mm, mesh count, vertex
pigment, and the six stable lantern names. The optional roundtrip preview is
rendered from those imported files. CPU Cycles uses 24 samples and denoising;
the preview is a disposable inspection artifact, not a runtime asset.

On this Mac, Blender's startup Metal detection crashed inside the filesystem
sandbox before executing Python. The same local Blender invocation succeeded
outside the sandbox under automatic approval review. There is no runtime need
for Blender or elevated access.

## Evidence recorded during production

- PASS: all five GLB headers, declared byte lengths, glTF 2.0 versions, local
  embedded dependencies, vertex-colour attributes and size limits checked.
- PASS: all five exports loaded through Blender's glTF importer; finite
  geometry, ground contact, mesh count, pigment and named bulbs asserted.
- PASS: lit render of the imported models inspected. Detached-looking bark
  ribbons found in the first render were rebuilt to follow the actual trunk
  surfaces. The revised imported render was inspected again.
- PASS: a second independent build produced identical SHA-256 hashes for all
  five GLBs. Surface variation uses an explicit deterministic smooth field.
- PASS: after the runtime owner measured 35 ordinary tree instances, that tree
  alone was optimized from 36,296 to 21,464 triangles and from 899,232 to 536,780
  bytes. The crown and root/branch sampling were reduced, and decorative leaf
  tips were reduced from 45 to 27. Smooth shading, colours, root name and axes
  were retained. Actual before/after GLBs were rendered with the same camera
  and lighting and inspected. The other four GLBs remained byte-for-byte
  unchanged. A second tree-only build reproduced the optimized file exactly.
- NOT APPLICABLE: animations, external asset licensing and texture dependencies.
- Handed to demo owner: final runtime lighting/composition, camera occlusion,
  mobile frame rate and low-power scenery density checks.

| Export | SHA-256 |
| --- | --- |
| tree.glb | `694ca8a97fa3353c501a62f2e3f30db4653b1ce8d94fd6128459cd4e78fb5383` |
| cottage.glb | `d4d7d40c8e4767f27623d039d450b918147e2f64332d858b917bbabeda4472e9` |
| lantern-tree.glb | `0a7e10ebd633b89adfa60dbafa0b513eaaea3787cf6f811d1d1944814e995f39` |
| mushrooms.glb | `bc60c0cf131520f2c551f67baae7cdc14fcfc5645b01303dc51e95e51f7ab481` |
| rock.glb | `d27f865af569d516b16e65fdc56a3bc7ffada94cba032d9a21964fe86d6e7ed3` |

## Scoped cleanup

Removed the first superseded preview, the automatic `forest.blend1` backup,
and the temporary hash-comparison file after the final source, exports and
imported render were verified. They were reproducible task outputs. The latest
roundtrip preview remains temporarily available for the demo owner's review;
the command above recreates it. The source retains no failed duplicate models,
placeholder models or unused external downloads.

The tree optimization recovery copies (original GLB, gallery and generator)
were removed after the comparison and import checks passed. The two comparison
renders are temporary review evidence. `--tree-only` rebuilds just the ordinary
tree and replaces it in the editable gallery without touching the other GLBs.
