# LiteracyPath 3D asset library

## Standard

All 3D work should be completed to the highest practical degree of effort and accuracy. A model is not production-ready merely because it loads: it must be checked for licensing, provenance, glTF validity, scale, orientation, materials, animation behavior, mobile performance, and visual coherence in the running game.

## Runtime library

The runtime collection lives in `public/models/library/`. It contains web-ready glTF/GLB files only. Blender, FBX, and OBJ source files stay out of the deployed tree because they duplicate geometry and are not loaded by Three.js.

Run these commands after adding or removing models:

```sh
npm run build:3d-library
npm run check:3d-library
```

The generated `public/models/library/manifest.json` is the source of truth for searchable names, tags, categories, sizes, rigging, animation counts, creators, licences, and source links. Application code can query it through `src/data/threeAssetLibrary.js`.

## Imported packs

| Provider | Pack | Runtime models | Licence | Intended use |
| --- | --- | ---: | --- | --- |
| KayKit | Character Pack: Adventurers | 32 | CC0 1.0 | Animated people, fantasy NPCs, equipment |
| KayKit | Character Pack: Skeletons | 17 | CC0 1.0 | Animated enemies and equipment |
| KayKit | City Builder Bits | 41 | CC0 1.0 | Towns, roads, vehicles, street props |
| KayKit | Dungeon Remastered | 203 | CC0 1.0 | Fantasy rooms, architecture, props |
| KayKit | Furniture Bits | 53 | CC0 1.0 | Interior dressing |
| KayKit | Halloween Bits | 63 | CC0 1.0 | Seasonal scenery and props |
| KayKit | Medieval Hexagon Pack | 221 | CC0 1.0 | Settlements, terrain, farms, structures |
| KayKit | Prototype Bits | 72 | CC0 1.0 | Gameplay prototyping and platforming |
| KayKit | Restaurant Bits | 144 | CC0 1.0 | Food, kitchens, restaurants, cooking tasks |
| KayKit | Space Base Bits | 57 | CC0 1.0 | Science-fiction worlds and future games |
| Poly Pizza | Curated field objectives | 3 | CC0 1.0 | Animated fish, cake, wearable boots |

## Researched sources

### Ready for production imports

- Kenney: https://kenney.nl/assets - large CC0 game-asset catalogue. Prefer 3D packs with glTF exports and preserve each included licence file.
- Quaternius: https://quaternius.com/ - extensive CC0 stylised packs with animated characters, animals, platformer kits, nature, food, buildings, and props. Existing Sound Seekers characters and nature models come from this source.
- KayKit: https://kaylousberg.itch.io/ - CC0, mobile-friendly, consistent atlas-textured game kits. The official GitHub mirrors are used for reproducible imports.
- Poly Haven: https://polyhaven.com/models - CC0 high-detail PBR models. Use selectively for hero objects and close-up scenes after polygon, texture, and download-size optimisation.
- ambientCG: https://ambientcg.com/ - CC0 scanned models, PBR materials, and HDRIs. Best for surface quality and realistic environment dressing.
- Poly Pizza: https://poly.pizza/ - thousands of low-poly models with model-specific licences. Import only items explicitly marked Public Domain (CC0).

### Conditional sources

- Smithsonian Open Access: https://www.si.edu/OpenAccess - CC0 cultural and scientific 3D scans. Strong for museums, history, fossils, and science games; most assets need retopology and texture reduction.
- NASA 3D Resources: https://science.nasa.gov/3d-resources/ - free mission models subject to NASA media usage guidelines. Review every use and do not describe these as CC0.
- Blender Studio: https://studio.blender.org/characters/ - excellent rigs and production files, usually CC-BY. Attribution and Blender-version compatibility are required.
- Khronos glTF Sample Assets: https://github.com/KhronosGroup/glTF-Sample-Assets - high-quality reference models with per-model licences. Useful for renderer testing; verify each asset before game use.
- MakeHuman Community: https://www.makehumancommunity.org/ - useful character generation, but application code, base assets, and community add-ons can have different terms. Record the exact generation and asset chain.
- OpenGameArt: https://opengameart.org/ - mixed licences and quality. Use only individually verified CC0 assets unless a project deliberately accepts attribution or share-alike obligations.

## Import checklist

1. Confirm the exact model page or official repository and licence before downloading.
2. Keep creator, source URL, source revision, and licence beside the runtime model in the manifest.
3. Export or select glTF 2.0. Prefer GLB for animated characters and glTF plus shared atlas texture for large prop packs.
4. Remove duplicate source formats from `public/`.
5. Keep each model under 6MB and the shared runtime model collection under 75MB until the deployment budget changes deliberately.
6. Test rigged models with idle and locomotion clips, not merely a static first frame.
7. Inspect final lighting, material response, scale, shadows, framing, and mobile performance in the browser.
