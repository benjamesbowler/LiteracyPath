# Garden and plaza kit

`Garden-and-Plaza.blend` is the editable scene bank. Rebuild with Blender 5.2:

```sh
blender --background --python tools/blender/build_arcade_garden_plaza.py
```

The generator exports thirteen complete GLBs, five transparent ground-registered WebP views and a repeatable bark surface. The runtime manifest records source, generator, input and delivery hashes. `--reuse-renders` is only for geometry/provenance rebuilds when the reviewed camera/material output is unchanged; a visual change requires rendering again.

The rounded rover is original project artwork, retaining the approved seated Pip mesh from the existing Sound Racer kart. Editable named panels, basket, steering, guards and independent wheel pivots remain in the source. The runtime merges static parts by material and keeps wheel pivots separate.

Architecture and the small rock use Kenney's CC0 City Kit Suburban 2.0 and Nature Kit 2.1. Four imported GLBs, their required atlas and both licences are retained. `imports.json` records their original hashes and official URLs.

Foliage, grass and the textured rock use Quaternius Ultimate Stylized Nature, CC0. The official product page and exact downloaded files are recorded in `imports/quaternius/provenance.json`. The shared download folder's generic licence carries a different pack title; the official Nature page itself explicitly supplies the CC0 grant. Keep that original licence unaltered. Birch and shrub glTFs retain all their buffers and curated textures; original download hashes and texture modifications are recorded separately. `woodland-selection.blend` contains five selected objects with all eight required images packed. The original whole-pack blend and redundant raw texture downloads are reproducible and are not retained.

The runtime instances repeated meshes, uses depth-writing leaf cutouts, and thins distant scenery on low tiers. Every solid trunk stays visible. Token trees share the same template regardless of correctness; removing a token detaches its model before the game's generic disposal. Late loads cannot restore an exited game. Asset failure retains the existing playable scene.

Native Blender source checks, exact GLB bounds/dependency closures, animation, disposal, ownership and provenance are exercised in `tests/unit/arcadeGardenAssets.test.js`; physical game/browser evidence is under the ignored `.artifacts/arcade-world-upgrade/` directory. These checks do not imply physical iPad observation or human listening.
