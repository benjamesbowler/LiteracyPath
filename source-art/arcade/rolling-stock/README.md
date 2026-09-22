# Original railway rolling stock

`Railway.blend` contains editable wagon, steam-engine and caboose scenes. Rebuild with `blender --background --python tools/blender/build_arcade_rolling_stock.py`.

The modeled recessed cream panels hold live sentence text in Sentence Express. Four wheels per vehicle rotate about their true axles. Eight registered transparent frames cover one spoke pitch without a visible loop jump; GLBs also retain the keyed wheel animations. Animation advances only while the assembled train moves, freezes on pause and is disabled for reduced motion. Existing drawn rolling stock remains the failed-image fallback, including its light text treatment.

The models are original Literacy Guide artwork and contain no external geometry or textures. `public/game-assets/arcade-worlds/trains/manifest.json` records source/generator/model/sprite hashes. Runtime game delivery uses the small WebP atlases; GLBs remain available for direct 3D reuse and source verification.
