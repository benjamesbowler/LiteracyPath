export const THREE_ASSET_MANIFEST_URL = "/models/library/manifest.json";

export const FIELD_OBJECT_MODELS = Object.freeze({
  "seed-lantern": Object.freeze({
    url: "/models/library/kaykit/halloween/models/lantern_standing.gltf",
    targetHeight: 0.86,
    rotationY: 0,
    tintStrength: 0.18
  }),
  "awakened-lantern": Object.freeze({
    url: "/models/library/kaykit/halloween/models/lantern_hanging.gltf",
    targetHeight: 0.9,
    rotationY: 0,
    tintStrength: 0.12
  }),
  "jump-flower": Object.freeze({
    url: "/models/library/kaykit/medieval/models/decoration/nature/waterlily_A.gltf",
    targetSize: 1.28,
    rotationY: 0,
    tintStrength: 0.28
  }),
  "flower-step": Object.freeze({
    url: "/models/library/kaykit/medieval/models/decoration/nature/waterlily_B.gltf",
    targetSize: 1.34,
    rotationY: 0,
    tintStrength: 0.2
  }),
  "sound-parcel": Object.freeze({
    url: "/models/library/kaykit/restaurant/models/crate.gltf",
    targetSize: 0.94,
    rotationY: Math.PI / 7,
    tintStrength: 0.24
  }),
  "delivered-parcel": Object.freeze({
    url: "/models/library/kaykit/restaurant/models/crate_lid.gltf",
    targetSize: 0.88,
    rotationY: -Math.PI / 8,
    tintStrength: 0.18
  }),
  "delivery-marker": Object.freeze({
    url: "/models/library/kaykit/halloween/models/post_lantern.gltf",
    targetHeight: 1.36,
    rotationY: 0,
    tintStrength: 0.1
  }),
  "chorus-lantern": Object.freeze({
    url: "/models/library/kaykit/halloween/models/lantern_standing.gltf",
    targetHeight: 1.02,
    rotationY: 0,
    tintStrength: 0.34
  }),
  "lit-chorus-lantern": Object.freeze({
    url: "/models/library/kaykit/halloween/models/lantern_hanging.gltf",
    targetHeight: 1.04,
    rotationY: 0,
    tintStrength: 0.18
  }),
  cake: Object.freeze({
    url: "/models/library/poly-pizza/objectives/Cupcake.glb",
    targetHeight: 0.92,
    rotationY: 0,
    tintStrength: 0.72
  }),
  fish: Object.freeze({
    url: "/models/library/poly-pizza/objectives/Fish.glb",
    targetHeight: 0.88,
    rotationY: Math.PI / 2,
    animation: "Idle",
    tintStrength: 0.42
  }),
  boots: Object.freeze({
    url: "/models/library/poly-pizza/objectives/Boots.glb",
    targetHeight: 0.68,
    rotationY: 0,
    tintStrength: 0.36
  })
});

// Seedwake's five stops share a palette, not a silhouette. Each route gets a
// small authored landmark kit so the child can recognise where they are before
// reading a single label.
export const QUEST_STOP_ASSET_KITS = Object.freeze({
  s1: Object.freeze([
    { url: "/models/library/kaykit/medieval/models/decoration/nature/trees_A_large.gltf", height: 6.6, progress: 0.72, side: -1, offset: 3.2 },
    { url: "/models/library/kaykit/halloween/models/lantern_hanging.gltf", height: 1.4, progress: 0.36, side: 1, offset: 2.5, copies: 4 },
    { url: "/models/library/kaykit/medieval/models/buildings/green/building_well_green.gltf", height: 2.8, progress: 0.58, side: 1, offset: 3 }
  ]),
  s2: Object.freeze([
    { url: "/models/library/kaykit/medieval/models/decoration/nature/waterlily_A.gltf", size: 1.45, progress: 0.34, side: -1, offset: 2.2, copies: 5 },
    { url: "/models/library/kaykit/medieval/models/buildings/green/building_tower_base_green.gltf", height: 4.6, progress: 0.74, side: 1, offset: 3.2 },
    { url: "/models/library/kaykit/medieval/models/decoration/nature/trees_B_medium.gltf", height: 4.2, progress: 0.56, side: -1, offset: 3.4 }
  ]),
  s3: Object.freeze([
    { url: "/models/library/kaykit/medieval/models/buildings/yellow/building_windmill_yellow.gltf", height: 6.4, progress: 0.76, side: -1, offset: 3.4 },
    { url: "/models/library/kaykit/restaurant/models/crate.gltf", height: 0.82, progress: 0.38, side: 1, offset: 2.5, copies: 4 },
    { url: "/models/library/kaykit/medieval/models/decoration/nature/rock_single_C.gltf", height: 1.35, progress: 0.6, side: 1, offset: 3, copies: 3 }
  ]),
  s4: Object.freeze([
    { url: "/models/library/kaykit/medieval/models/buildings/neutral/building_bridge_B.gltf", height: 3.4, progress: 0.74, side: 1, offset: 3.15 },
    { url: "/models/library/kaykit/medieval/models/buildings/blue/building_watermill_blue.gltf", height: 4.8, progress: 0.34, side: -1, offset: 5.2 },
    { url: "/models/library/kaykit/medieval/models/decoration/nature/waterlily_B.gltf", size: 1.4, progress: 0.4, side: 1, offset: 2.4, copies: 4 }
  ]),
  s5: Object.freeze([
    { url: "/models/library/kaykit/halloween/models/arch_gate.gltf", height: 5.8, progress: 0.78, side: 1, offset: 3.1 },
    { url: "/models/library/kaykit/halloween/models/tree_dead_large_decorated.gltf", height: 6.2, progress: 0.57, side: -1, offset: 3.5 },
    { url: "/models/library/kaykit/halloween/models/lantern_standing.gltf", height: 1.45, progress: 0.36, side: 1, offset: 2.6, copies: 5 }
  ])
});

// Authored chapter silhouettes. These are deliberately small curated kits, not
// random manifest searches at runtime: each chapter keeps a recognisable visual
// identity while every model remains traceable to the local licensed library.
export const QUEST_CHAPTER_ASSET_KITS = Object.freeze({
  "seedwake-meadow": Object.freeze([
    { url: "/models/library/kaykit/medieval/models/buildings/green/building_windmill_green.gltf", height: 6.8, progress: 0.78, side: 1, offset: 3.4 },
    { url: "/models/library/kaykit/medieval/models/buildings/neutral/fence_wood_straight_gate.gltf", height: 2.2, progress: 0.42, side: -1, offset: 2.7 },
    { url: "/models/library/kaykit/medieval/models/decoration/nature/trees_A_medium.gltf", height: 3.8, progress: 0.62, side: -1, offset: 3.2 }
  ]),
  "river-gardens": Object.freeze([
    { url: "/models/library/kaykit/medieval/models/buildings/blue/building_watermill_blue.gltf", height: 6.4, progress: 0.8, side: -1, offset: 3.5 },
    { url: "/models/library/kaykit/medieval/models/buildings/neutral/building_bridge_A.gltf", height: 2.8, progress: 0.48, side: 1, offset: 2.8 },
    { url: "/models/library/kaykit/medieval/models/decoration/nature/waterlily_A.gltf", height: 0.55, progress: 0.64, side: 1, offset: 2.1, copies: 3 }
  ]),
  "fossil-canyon": Object.freeze([
    { url: "/models/library/kaykit/halloween/models/arch_gate.gltf", height: 5.4, progress: 0.8, side: 1, offset: 3.1 },
    { url: "/models/library/kaykit/halloween/models/bone_A.gltf", height: 1.4, progress: 0.54, side: -1, offset: 2.5, copies: 3 },
    { url: "/models/library/kaykit/medieval/models/decoration/props/tent.gltf", height: 2.6, progress: 0.7, side: -1, offset: 3.2 },
    { url: "/models/library/kaykit/halloween/models/tree_dead_large.gltf", height: 5.2, progress: 0.33, side: 1, offset: 3.5 }
  ]),
  "forge-settlement": Object.freeze([
    { url: "/models/library/kaykit/medieval/models/buildings/red/building_blacksmith_red.gltf", height: 6.2, progress: 0.8, side: -1, offset: 3.5 },
    { url: "/models/library/kaykit/space/models/drill_structure.gltf", height: 4.5, progress: 0.58, side: 1, offset: 3.1 },
    { url: "/models/library/kaykit/space/models/cargo_A_stacked.gltf", height: 2.1, progress: 0.4, side: -1, offset: 2.7 }
  ]),
  "glass-marsh": Object.freeze([
    { url: "/models/library/kaykit/dungeon/models/pillar_decorated.gltf.glb", height: 5.5, progress: 0.8, side: 1, offset: 3.3 },
    { url: "/models/library/kaykit/medieval/models/decoration/nature/waterplant_A.gltf", height: 1.3, progress: 0.52, side: -1, offset: 2.5, copies: 4 },
    { url: "/models/library/kaykit/medieval/models/decoration/nature/waterlily_B.gltf", height: 0.55, progress: 0.65, side: 1, offset: 2.2, copies: 3 }
  ]),
  "storm-coast": Object.freeze([
    { url: "/models/library/kaykit/medieval/models/buildings/blue/building_tower_B_blue.gltf", height: 8.2, progress: 0.82, side: -1, offset: 3.7 },
    { url: "/models/library/kaykit/medieval/models/buildings/neutral/building_bridge_B.gltf", height: 3, progress: 0.5, side: 1, offset: 3 },
    { url: "/models/library/kaykit/space/models/windturbine_tall.gltf", height: 5.8, progress: 0.66, side: 1, offset: 3.4 }
  ]),
  "lantern-forest": Object.freeze([
    { url: "/models/library/kaykit/halloween/models/tree_dead_large_decorated.gltf", height: 6.6, progress: 0.78, side: 1, offset: 3.5 },
    { url: "/models/library/kaykit/space/models/lights.gltf", height: 2.4, progress: 0.52, side: -1, offset: 2.6, copies: 3 },
    { url: "/models/library/kaykit/dungeon/models/wall_archedwindow_open.gltf.glb", height: 4.4, progress: 0.67, side: -1, offset: 3.2 }
  ]),
  "star-reach": Object.freeze([
    { url: "/models/library/kaykit/space/models/basemodule_C.gltf", height: 5.6, progress: 0.8, side: -1, offset: 3.5 },
    { url: "/models/library/kaykit/space/models/lander_A.gltf", height: 3.8, progress: 0.62, side: 1, offset: 3.1 },
    { url: "/models/library/kaykit/space/models/solarpanel.gltf", height: 2.5, progress: 0.42, side: -1, offset: 2.8, copies: 2 },
    { url: "/models/library/kaykit/space/models/lights.gltf", height: 2.2, progress: 0.7, side: 1, offset: 2.7, copies: 2 }
  ])
});

export async function fetchThreeAssetLibrary(fetchImpl = fetch) {
  const response = await fetchImpl(THREE_ASSET_MANIFEST_URL);
  if (!response.ok) throw new Error(`Unable to load 3D asset library (${response.status})`);
  return response.json();
}

export function searchThreeAssetLibrary(manifest, query = "", {
  category = null,
  animated = null,
  pack = null,
  limit = 60
} = {}) {
  const words = String(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const wantedCategory = category?.toLowerCase() || null;
  const wantedPack = pack?.toLowerCase() || null;

  return (manifest?.models || [])
    .filter(model => {
      if (animated != null && Boolean(model.animated) !== Boolean(animated)) return false;
      if (wantedPack && model.packId.toLowerCase() !== wantedPack) return false;
      if (wantedCategory && !(model.categories || []).some(value => value.toLowerCase() === wantedCategory)) return false;
      if (!words.length) return true;
      const haystack = [model.name, model.packId, ...(model.categories || []), ...(model.tags || [])]
        .join(" ")
        .toLowerCase();
      return words.every(word => haystack.includes(word));
    })
    .slice(0, Math.max(1, limit));
}
