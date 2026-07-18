const STOP_MAP_DEFINITIONS = "meander,grove,dew-lantern-grove|branching-grove,terraces,fern-step-terraces|horseshoe,crossing,rook-stone-ford|switchback,workyard,tumble-bridge-yard|ridge-climb,arena,bramble-chorus-bowl|horseshoe,grove,beehive-canal-orchard|island-loop,crossing,fizzle-ferry-isles|branching-grove,terraces,lily-channel-gardens|figure-eight,workyard,waterwheel-crossroads|switchback,arena,singing-weir-stage|ridge-climb,terraces,sun-bone-shelves|switchback,crossing,red-rock-ravine|horseshoe,workyard,amber-dig-basin|branching-grove,grove,rescue-track-camp|figure-eight,arena,claw-pass-ring|hub-and-spokes,workyard,first-gear-square|switchback,terraces,ore-chute-steps|figure-eight,crossing,steam-pipe-crossing|ridge-climb,grove,rail-siding-market|island-loop,arena,word-forge-court|branching-grove,grove,glass-reed-garden|island-loop,crossing,moon-lily-isles|spiral,terraces,mica-pool-spiral|horseshoe,workyard,mirror-maker-walk|figure-eight,arena,mirror-fen-beacon|ridge-climb,terraces,black-cliff-stairs|horseshoe,crossing,harbour-rope-cove|switchback,grove,rain-shelter-bend|branching-grove,workyard,storm-lens-yard|spiral,arena,thunder-light-ring|branching-grove,grove,moth-lantern-bowers|spiral,terraces,stormlight-root-stairs|hub-and-spokes,workyard,fernturn-map-hub|figure-eight,crossing,hare-hollow-bridges|ridge-climb,arena,listening-rock-dome|spiral,terraces,creature-falls-ascent|hub-and-spokes,grove,knowledge-tree-court|figure-eight,crossing,tallgrass-sky-bridges|branching-grove,workyard,kettle-memory-yard|ridge-climb,arena,first-reading-star".split("|").map(stop => stop.split(","));
function freezePoints(points) {
  const unpacked = typeof points === "string" ? points.split(";").map(point => point.split(",").map(Number)) : points;
  return Object.freeze(unpacked.map(point => Object.freeze(point)));
}
function freezeOptionalRoutes(routes = []) {
  const unpacked = typeof routes === "string" ? routes.split("|").map(route => {
    const [from, to, ...points] = route.split(",").map(Number);
    return {
      from,
      to,
      points: Array.from({
        length: points.length / 2
      }, (_, index) => points.slice(index * 2, index * 2 + 2))
    };
  }) : routes;
  return Object.freeze(unpacked.map(route => Object.freeze({
    ...route,
    points: freezePoints(route.points)
  })));
}
const SCENERY_PREFIXES = "seedwake river fossil forge glass storm lantern star".split(" ");
const SCENERY_KEYS = "0tree|0shrub|0blossom-tree|1willow|1canal-map|1garden-arch|1lily-ferry|1sluice-gate|1waterwheel|2amber-outcrop|2survey-station|2bone-signal|2dig-camp|2rib-arch|3steam-pipes|3tool-rack|3rail-signal|3ore-cart|3workshop-market|3sorting-conveyor|3ore-hopper|3plate-foundry|4reeds|4lilies|4lantern|4mirror-pool|4workshop|5buoy|5black-cliff|5tide-pool|5windbreak|5storm-shelter|5boardwalk|6moths|6tree|6roots|6telescope-pedestal|6workshop|6root-bridge|7comet-beacon|7dawn-crystals|7floating-garden|7constellation-rail|7workshop|7skybridge-island".split("|").map(value => `${SCENERY_PREFIXES[Number(value[0])]}-premium-${value.slice(1)}`);
const SCENERY_META = [[0.41, ""], [0.34, ""], [0.38, ""], [0.35, ""], [0.24, ""], [0.3, ""], [0.31, ""], [0.28, ""], [0.29, ""], [0.36, ""], [0.3, ""], [0.29, ""], [0.3, ""], [0.3, ""], [0.24, "s"], [0.25, ""], [0.22, "i"], [0.24, ""], [0.3, ""], [0.27, ""], [0.3, ""], [0.29, ""], [0.25, "g"], [0.28, "pg"], [0.22, "g"], [0.27, "p"], [0.29, ""], [0.2, "b"], [0.26, ""], [0.28, "p"], [0.25, "w"], [0.31, ""], [0.29, "p"], [0.25, "pu"], [0.28, "g"], [0.28, "pg"], [0.24, ""], [0.31, ""], [0.28, "p"], [0.22, "f"], [0.26, "pg"], [0.25, "f"], [0.27, "pg"], [0.3, ""], [0.25, "f"]];
function freezeScenery(anchors) {
  const motionCodes = {
    s: "steam",
    i: "signal",
    g: "glow",
    b: "bob",
    w: "gale",
    u: "flutter",
    f: "float"
  };
  const unpacked = typeof anchors === "string" ? anchors.split(";").map(anchor => {
    const [progress, lateral, keyIndex, scaleOverride = "0", flagsOverride = ""] = anchor.split(",");
    return [Number(progress), Number(lateral), Number(keyIndex), Number(scaleOverride), flagsOverride];
  }) : anchors;
  return Object.freeze(unpacked.map(anchor => {
    const [progress, lateral, keyIndex, scaleOverride = 0, flagsOverride = ""] = anchor;
    const [defaultScale, defaultFlags] = SCENERY_META[keyIndex];
    const flags = flagsOverride || defaultFlags;
    const motionCode = [...flags].find(flag => motionCodes[flag]);
    return Object.freeze({
      progress,
      lateral,
      key: SCENERY_KEYS[keyIndex],
      scale: scaleOverride || defaultScale,
      ...(flags.includes("p") ? {
        passable: true
      } : {}),
      ...(flags.includes("x") ? {
        flipX: true
      } : {}),
      ...(motionCode ? {
        motion: motionCodes[motionCode]
      } : {})
    });
  }));
}
function freezeMap(routePoints, optionalRoutes, terrainAnchors, landmark, scenery, residents) {
  return Object.freeze({
    routePoints: freezePoints(routePoints),
    optionalRoutes: freezeOptionalRoutes(optionalRoutes),
    terrainAnchors: Object.freeze(terrainAnchors),
    landmarkAnchor: Object.freeze({
      progress: landmark[0],
      lateral: landmark[1]
    }),
    sceneryAnchors: freezeScenery(scenery),
    residentSides: Object.freeze(residents)
  });
}

// Compact source strings expand into immutable, hand-composed route maps. All
// forty stops own explicit navigation, staging, scenery, and landmark data.
export const SEEDWAKE_AUTHORED_MAPS = Object.freeze({
  s1: freezeMap("0,320;0.12,302;0.25,350;0.39,282;0.53,258;0.68,332;0.83,374;1,320", [], [], [0.54, -158], "0.07,-154,0,0.4;0.11,132,1,0.32;0.2,-176,2,0.37;0.29,166,0,0.42;0.4,-168,1,0.3;0.49,178,0,0.39;0.63,-180,2,0.39;0.72,154,1;0.82,-164,0,0.43;0.91,150,2,0.36", [1, -1, 1]),
  s2: freezeMap("0,320;0.16,344;0.31,300;0.44,278;0.58,318;0.73,354;0.88,305;1,320", "0.31,0.73,0.31,300,0.39,370,0.5,422,0.61,408,0.73,354", [], [0.6, -154], "0.06,164,0,0.38;0.14,-146,1;0.23,178,2,0.4;0.32,-174,0;0.44,-166,1,0.31;0.54,-182,2,0.37;0.66,176,0,0.43;0.76,-154,1,0.33;0.85,158,0,0.39;0.93,-166,2", [-1, 1, -1]),
  s3: freezeMap("0,320;0.14,282;0.28,224;0.43,196;0.56,222;0.69,290;0.82,388;0.92,410;1,320", [], [], [0.46, -154], "0.06,-162,2;0.13,148,0;0.24,-154,1,0.32;0.34,176,0,0.39;0.43,-172,2,0.41;0.57,166,1;0.67,-180,0,0.44;0.77,158,2,0.36;0.86,-150,1,0.3;0.94,168,0,0.4", [1, -1, 1]),
  s4: freezeMap("0,320;0.12,270;0.25,224;0.37,390;0.49,416;0.61,254;0.73,212;0.86,378;1,320", [], [], [0.63, 152], "0.05,158,1,0.33;0.12,-170,0,0.42;0.22,174,2,0.39;0.31,-162,1,0.31;0.42,180,0,0.44;0.52,-176,2;0.64,168,1;0.74,-154,0,0.4;0.84,162,2,0.37;0.93,-168,0", [-1, 1, -1]),
  s5: freezeMap("0,320;0.14,350;0.28,302;0.42,372;0.56,286;0.7,398;0.84,270;1,320", [], [], [0.72, -150], "0.06,-168,0;0.14,152,2;0.25,-176,1,0.32;0.35,180,0,0.43;0.45,-158,2,0.4;0.56,166,1;0.65,-182,0,0.45;0.76,158,2,0.36;0.86,-148,1,0.31;0.94,170,0,0.42", [1, -1, 1])
});
export const RIVER_AUTHORED_MAPS = Object.freeze({
  s6: freezeMap("0,320;0.12,270;0.24,202;0.37,174;0.49,228;0.63,396;0.76,458;0.89,402;1,320", [], [0.18, 0.84], [0.48, 168], "0.06,-170,3,0.34;0.13,154,4,0.25;0.21,-162,5;0.31,176,3,0.36,;0.42,-184,6;0.54,174,7;0.65,-168,3;0.75,158,4;0.85,-174,5,0.29,;0.94,164,3,0.34,", [-1, 1, -1]),
  s7: freezeMap("0,320;0.11,382;0.23,450;0.35,430;0.48,344;0.61,226;0.74,178;0.88,244;1,320", "0.23,0.74,0.23,450,0.34,484,0.48,468,0.61,378,0.74,178", [0.14, 0.57, 0.87], [0.57, -164], "0.05,168,3,0,;0.14,-158,6,0.33;0.25,178,7;0.34,-176,3,0.36;0.44,-166,4;0.55,-182,5;0.67,190,3,0.34,;0.77,-160,6,0,;0.87,170,7,0.27;0.95,-166,3", [1, -1, 1]),
  s8: freezeMap("0,320;0.13,276;0.25,188;0.38,226;0.5,354;0.63,458;0.75,408;0.88,292;1,320", "0.25,0.63,0.25,188,0.34,154,0.45,176,0.54,264,0.63,458", [0.19, 0.81], [0.64, 158], "0.06,-164,5;0.15,172,3,0,;0.24,-180,4,0.25;0.34,164,6,0.32;0.44,174,3,0.36;0.56,184,7;0.66,-168,3,0.34;0.76,156,5,0.29,;0.86,-172,6;0.94,166,3,0,", [-1, 1, -1]),
  s9: freezeMap("0,320;0.12,400;0.24,462;0.37,388;0.5,320;0.63,190;0.76,176;0.88,258;1,320", [], [0.13, 0.48, 0.9], [0.5, -172], "0.05,164,3,0,;0.13,-174,8;0.23,178,4;0.33,-158,3,0.34;0.43,184,7;0.56,-180,5;0.67,166,3,0.36,;0.77,-170,6,0.32;0.87,158,4,0.25;0.95,-168,3", [1, -1, 1]),
  s10: freezeMap("0,320;0.11,190;0.23,452;0.35,180;0.48,444;0.61,206;0.74,420;0.87,266;1,320", [], [0.16, 0.86], [0.7, 174], "0.05,-172,5;0.14,162,3,0,;0.24,-184,7;0.34,176,6,0.32;0.44,-160,3,0.36;0.55,182,8;0.65,-174,4;0.76,158,3,0.34,;0.86,-168,5,0.29;0.95,170,3,0,", [-1, 1, -1])
});
export const FOSSIL_AUTHORED_MAPS = Object.freeze({
  s11: freezeMap("0,320;0.1,286;0.2,230;0.3,196;0.42,224;0.54,312;0.65,402;0.78,452;0.9,390;1,320", [], [0.14, 0.86], [0.58, -150], "0.06,-156,9,0.38;0.14,168,10;0.22,-150,11;0.31,178,12,0.31,;0.4,-166,9,0.34;0.5,172,13,0.31;0.62,-174,10,0.29,;0.72,154,11,0.3;0.84,-170,9;0.94,160,12", [1, -1, 1]),
  s12: freezeMap("0,320;0.1,406;0.2,458;0.31,414;0.43,286;0.54,188;0.65,208;0.76,314;0.88,434;1,320", "0.2,0.65,0.2,458,0.31,500,0.43,478,0.55,340,0.65,208", [0.15, 0.56, 0.86], [0.68, 168], "0.06,164,11;0.14,-166,9;0.24,140,10,0.29,;0.34,-176,12;0.45,-170,13;0.56,-132,11,0.28;0.68,178,9,0.37;0.78,-166,10;0.87,132,12,0,;0.95,-158,11", [-1, 1, -1]),
  s13: freezeMap("0,320;0.1,256;0.2,194;0.3,166;0.42,194;0.54,284;0.64,408;0.74,470;0.84,432;0.92,382;1,320", [], [0.14, 0.52, 0.88], [0.64, -158], "0.06,166,10,0.29;0.14,-148,9,0.35;0.24,176,13;0.34,150,11;0.44,180,12,0.31,;0.55,-172,10;0.66,154,9;0.76,-168,11;0.86,150,13;0.95,-162,12", [1, -1, 1]),
  s14: freezeMap("0,320;0.1,372;0.2,440;0.3,418;0.42,342;0.53,258;0.64,190;0.75,174;0.86,244;1,320", "0.2,0.64,0.2,440,0.3,500,0.42,478,0.54,350,0.64,190", [0.15, 0.52, 0.87], [0.74, 164], "0.06,-164,9;0.14,154,11;0.24,-162,10;0.34,-150,12;0.45,-176,13;0.56,172,9;0.66,150,11;0.77,178,10,0,;0.87,-166,12;0.95,158,9,0.35", [-1, 1, -1]),
  s15: freezeMap("0,320;0.12,240;0.24,214;0.36,290;0.48,414;0.6,438;0.72,350;0.84,230;0.92,270;1,320", [], [0.14, 0.5, 0.86], [0.68, 150], "0.05,164,11,0.3;0.13,-138,9;0.23,142,10,0.29;0.33,-134,13;0.43,144,12;0.53,-150,11;0.63,142,9;0.73,-142,10;0.83,150,13;0.94,-160,12,0,", [1, -1, 1])
});
export const FORGE_AUTHORED_MAPS = Object.freeze({
  s16: freezeMap("0,320;0.12,320;0.24,300;0.36,320;0.48,320;0.6,320;0.72,340;0.86,320;1,320", "0.32,0.7,0.32,314,0.4,230,0.5,190,0.6,232,0.7,337|0.32,0.7,0.32,314,0.4,410,0.5,460,0.6,414,0.7,337", [0.16, 0.88], [0.58, 216], "0.06,-166,14;0.14,160,15;0.23,-174,16;0.32,176,17;0.42,198,18;0.53,230,14,0,;0.64,-178,19;0.75,166,16;0.85,-164,15;0.95,170,17", [0, -1, 1]),
  s17: freezeMap("0,320;0.11,414;0.22,456;0.34,404;0.46,282;0.58,184;0.7,220;0.82,358;0.92,426;1,320", [], [0.14, 0.82], [0.52, 164], "0.05,164,17;0.14,-154,14;0.24,132,15;0.34,-166,16;0.44,174,20;0.55,-132,19;0.66,174,14,0,;0.76,-168,15;0.87,140,16;0.96,-162,17", [-1, 1, -1]),
  s18: freezeMap("0,320;0.12,230;0.24,210;0.36,300;0.48,414;0.6,434;0.72,344;0.84,224;0.92,270;1,320", "0.25,0.75,0.25,218,0.35,170,0.48,230,0.6,370,0.75,322", [0.12, 0.9], [0.62, -166], "0.05,-164,16;0.14,170,14;0.24,-146,17;0.34,172,15;0.45,174,21;0.55,132,19;0.65,-166,14,0,;0.76,164,16;0.86,-140,15;0.95,168,17", [1, -1, 1]),
  s19: freezeMap("0,320;0.11,280;0.22,230;0.34,190;0.46,218;0.58,302;0.7,410;0.82,460;0.92,400;1,320", [], [0.18, 0.86], [0.7, -158], "0.05,168,15;0.14,-152,14;0.24,174,16;0.34,-138,17;0.44,180,18;0.55,-170,19;0.66,166,14,0,;0.77,-164,16;0.87,134,15;0.96,-168,17", [-1, 1, -1]),
  s20: freezeMap("0,320;0.12,390;0.24,452;0.36,420;0.48,320;0.6,220;0.72,180;0.84,230;0.94,288;1,320", "0.24,0.72,0.24,452,0.36,500,0.48,470,0.6,350,0.72,180", [0.15, 0.89], [0.56, -158], "0.05,-168,16;0.14,158,14;0.24,-142,17;0.34,160,15;0.44,-172,18;0.55,-166,19;0.66,-140,14,0,;0.76,176,16;0.87,-146,15;0.96,164,17", [1, -1, 1])
});
export const GLASS_AUTHORED_MAPS = Object.freeze({
  s21: freezeMap("0,320;0.12,266;0.24,210;0.36,228;0.48,320;0.6,414;0.72,442;0.84,386;1,320", "0.24,0.7,0.24,210,0.34,154,0.46,176,0.58,286,0.7,438", [0.14, 0.9], [0.64, -170], "0.05,-164,22;0.14,170,23;0.24,-142,24;0.34,176,25;0.44,172,26;0.55,170,22,0,;0.66,-166,23;0.76,152,24;0.86,-168,25;0.95,164,22", [1, -1, 1]),
  s22: freezeMap("0,320;0.12,398;0.24,456;0.36,430;0.48,334;0.6,224;0.72,178;0.84,234;1,320", "0.24,0.72,0.24,456,0.35,500,0.48,470,0.6,340,0.72,178", [0.16, 0.52, 0.88], [0.58, -164], "0.05,166,24;0.14,-158,22;0.24,132,23;0.34,-170,25;0.45,-174,26;0.56,-162,24;0.67,176,22,0,;0.77,-152,23;0.87,164,25;0.96,-166,22", [-1, 1, -1]),
  s23: freezeMap("0,320;0.1,404;0.2,458;0.31,424;0.42,326;0.53,218;0.64,174;0.75,226;0.86,354;1,320", [], [0.13, 0.9], [0.48, -166], "0.05,-166,25;0.14,152,22;0.24,-142,24;0.34,174,23;0.44,-176,26;0.55,172,25;0.66,-132,22;0.76,178,24;0.86,-154,23;0.95,166,22,0,", [1, -1, 1]),
  s24: freezeMap("0,320;0.11,264;0.22,206;0.34,174;0.46,206;0.58,302;0.7,420;0.82,466;0.92,402;1,320", [], [0.15, 0.88], [0.7, -158], "0.05,166,22;0.14,-152,23;0.24,174,24;0.34,-132,25;0.44,176,26;0.55,-170,22,0,;0.66,164,23;0.77,-164,24;0.87,132,25;0.96,-168,22", [-1, 1, -1]),
  s25: freezeMap("0,320;0.12,232;0.24,214;0.36,294;0.48,410;0.6,436;0.72,348;0.84,226;0.92,270;1,320", "0.25,0.75,0.25,220,0.35,166,0.48,224,0.6,366,0.75,318", [0.16, 0.54, 0.88], [0.62, 164], "0.05,-164,24;0.14,170,22;0.24,-142,23;0.34,174,25;0.44,172,26;0.55,132,24;0.66,-166,22,0,;0.76,162,23;0.86,-140,25;0.95,168,22", [1, -1, 1])
});
export const STORM_AUTHORED_MAPS = Object.freeze({
  s26: freezeMap("0,320;0.11,274;0.22,222;0.34,184;0.46,216;0.58,306;0.7,414;0.82,458;0.92,398;1,320", [], [0.17, 0.86], [0.68, -164], "0.05,166,27;0.14,-154,28;0.24,176,29;0.34,-168,30;0.44,182,31;0.55,-174,32;0.66,166,27,0,;0.76,-176,28;0.86,150,29;0.95,-166,30", [-1, 1, -1]),
  s27: freezeMap("0,320;0.12,392;0.24,448;0.36,424;0.48,330;0.6,224;0.72,184;0.84,238;1,320", "0.24,0.72,0.24,448,0.35,492,0.48,460,0.6,334,0.72,184", [0.14, 0.5, 0.88], [0.56, -166], "0.05,-166,30;0.14,158,27;0.24,-146,29;0.34,176,32;0.44,-182,31;0.55,-174,27,0,;0.66,-176,28;0.76,166,30;0.86,-152,29;0.95,168,27", [1, -1, 1]),
  s28: freezeMap("0,320;0.1,412;0.2,462;0.31,410;0.42,286;0.53,180;0.64,210;0.75,358;0.87,446;1,320", [], [0.2, 0.82], [0.48, 166], "0.05,168,28;0.14,-154,27;0.24,174,30;0.34,-170,29;0.44,178,31;0.55,-176,32;0.66,164,27,0,;0.76,-170,30;0.86,148,29;0.95,-168,28", [-1, 1, -1]),
  s29: freezeMap("0,320;0.12,250;0.24,206;0.36,244;0.48,338;0.6,430;0.72,446;0.84,376;1,320", "0.22,0.72,0.22,212,0.34,154,0.47,178,0.59,302,0.72,446", [0.13, 0.46, 0.9], [0.62, 174], "0.05,-166,27;0.14,162,30;0.24,-150,29;0.34,182,28;0.44,176,31;0.55,182,32;0.66,170,27,0,;0.76,-174,30;0.86,150,29;0.95,-168,28", [1, -1, 1]),
  s30: freezeMap("0,320;0.1,232;0.2,188;0.31,226;0.42,338;0.53,444;0.64,454;0.75,354;0.86,212;1,320", "0.25,0.75,0.25,204,0.36,156,0.48,224,0.61,374,0.75,354", [0.16, 0.55, 0.87], [0.58, 168], "0.05,166,30;0.14,-158,27;0.24,174,29;0.34,176,28;0.44,182,31;0.55,184,32;0.66,172,27,0,;0.76,-174,30;0.86,150,29;0.95,-168,28", [-1, 1, -1])
});
export const LANTERN_AUTHORED_MAPS = Object.freeze({
  s31: freezeMap("0,320;0.12,264;0.24,216;0.36,238;0.48,328;0.6,418;0.72,444;0.84,382;1,320", "0.24,0.7,0.24,216,0.34,158,0.46,178,0.58,294,0.7,440", [0.15, 0.88], [0.64, -170], "0.05,-166,33;0.14,160,34;0.24,-148,35;0.34,176,36;0.44,182,37;0.55,176,38;0.66,168,33,0,;0.76,-174,34;0.86,150,35;0.95,-166,36", [1, -1, 1]),
  s32: freezeMap("0,320;0.1,404;0.2,456;0.31,420;0.42,318;0.53,210;0.64,176;0.75,236;0.86,362;1,320", [], [0.2, 0.82], [0.48, -166], "0.05,166,34;0.14,-154,33;0.24,174,35;0.34,-170,36;0.44,178,37;0.55,-176,38;0.66,164,33,0,;0.76,-172,34;0.86,148,35;0.95,-168,36", [-1, 1, -1]),
  s33: freezeMap("0,320;0.12,280;0.24,252;0.36,286;0.48,320;0.6,354;0.72,388;0.84,360;1,320", "0.28,0.68,0.28,264,0.39,174,0.5,156,0.59,214,0.68,376|0.32,0.72,0.32,274,0.41,416,0.5,482,0.61,446,0.72,388", [0.14, 0.5, 0.9], [0.58, 220], "0.05,-166,33;0.14,160,34;0.23,-174,35;0.32,214,36;0.42,-250,37;0.53,250,38;0.64,-216,33,0,;0.75,178,34;0.85,-164,35;0.95,170,36", [0, -1, 1]),
  s34: freezeMap("0,320;0.12,230;0.24,212;0.36,298;0.48,414;0.6,438;0.72,346;0.84,224;0.92,270;1,320", "0.25,0.75,0.25,220,0.35,166,0.48,224,0.6,368,0.75,316", [0.16, 0.54, 0.87], [0.62, 166], "0.05,166,34;0.14,-158,33;0.24,174,35;0.34,176,36;0.44,182,37;0.55,182,38;0.66,170,33,0,;0.76,-174,34;0.86,150,35;0.95,-168,36", [1, -1, 1]),
  s35: freezeMap("0,320;0.11,276;0.22,226;0.34,188;0.46,216;0.58,300;0.7,410;0.82,458;0.92,402;1,320", [], [0.18, 0.46, 0.84], [0.7, -164], "0.05,-166,33;0.14,160,34;0.24,-148,35;0.34,176,36;0.44,-180,37;0.55,176,38;0.66,-168,33,0,;0.76,174,34;0.86,-150,35;0.95,168,36", [-1, 1, -1])
});
export const STAR_AUTHORED_MAPS = Object.freeze({
  s36: freezeMap("0,320;0.1,408;0.2,458;0.31,420;0.42,316;0.53,208;0.64,176;0.75,238;0.86,366;1,320", [], [0.16, 0.88], [0.48, -168], "0.05,166,39;0.14,-156,40;0.24,176,41;0.34,-170,42;0.44,182,43;0.55,-176,44;0.66,168,39,0,;0.76,-174,40;0.86,150,41;0.95,-168,42", [-1, 1, -1]),
  s37: freezeMap("0,320;0.12,278;0.24,250;0.36,284;0.48,320;0.6,356;0.72,390;0.84,360;1,320", "0.28,0.68,0.28,262,0.39,174,0.5,154,0.59,212,0.68,378|0.32,0.72,0.32,272,0.41,416,0.5,484,0.61,448,0.72,390", [0.14, 0.5, 0.9], [0.58, 222], "0.05,-166,39;0.14,160,40;0.23,-174,41;0.32,218,42;0.42,-250,43;0.53,252,44;0.64,-216,39,0,;0.75,178,40;0.85,-164,41;0.95,170,42", [0, -1, 1]),
  s38: freezeMap("0,320;0.12,232;0.24,214;0.36,298;0.48,414;0.6,438;0.72,348;0.84,226;0.92,270;1,320", "0.25,0.75,0.25,220,0.35,164,0.48,224,0.6,368,0.75,318", [0.2, 0.82], [0.62, 168], "0.05,166,41;0.14,-158,39;0.24,174,40;0.34,178,42;0.44,182,43;0.55,184,44;0.66,-170,39,0,;0.76,174,40;0.86,-150,41;0.95,168,42", [1, -1, 1]),
  s39: freezeMap("0,320;0.12,252;0.24,208;0.36,246;0.48,340;0.6,430;0.72,446;0.84,378;1,320", "0.22,0.72,0.22,214,0.34,156,0.47,178,0.59,304,0.72,446", [0.16, 0.54, 0.87], [0.62, 176], "0.05,-166,39;0.14,162,40;0.24,-150,41;0.34,182,42;0.44,178,43;0.55,184,44;0.66,170,39,0,;0.76,-174,40;0.86,150,41;0.95,-168,42", [-1, 1, -1]),
  s40: freezeMap("0,320;0.11,276;0.22,224;0.34,186;0.46,214;0.58,298;0.7,410;0.82,460;0.92,402;1,320", [], [0.18, 0.46, 0.84], [0.7, -166], "0.05,-166,39;0.14,160,40;0.24,-150,41;0.34,176,42;0.44,-180,43;0.55,176,44;0.66,-168,39,0,;0.76,174,40;0.86,-150,41;0.95,168,42", [1, -1, 1])
});
export const AUTHORED_PIXEL_MAPS = Object.freeze({
  ...SEEDWAKE_AUTHORED_MAPS,
  ...RIVER_AUTHORED_MAPS,
  ...FOSSIL_AUTHORED_MAPS,
  ...FORGE_AUTHORED_MAPS,
  ...GLASS_AUTHORED_MAPS,
  ...STORM_AUTHORED_MAPS,
  ...LANTERN_AUTHORED_MAPS,
  ...STAR_AUTHORED_MAPS
});
export const STOP_PIXEL_MAPS = Object.freeze(Object.fromEntries(STOP_MAP_DEFINITIONS.map(([topology, scene, motif], index) => {
  const stopId = `s${index + 1}`;
  const authored = AUTHORED_PIXEL_MAPS[stopId];
  return [stopId, Object.freeze({
    topology,
    scene,
    motif,
    authorship: authored ? "route-authored" : "generated",
    phase: (index * 0.37 + index % 5 * 0.11) % (Math.PI * 2),
    residentSides: authored?.residentSides || Object.freeze(topology === "hub-and-spokes" ? [0, -1, 1] : topology === "island-loop" ? [-1, 1, 0] : topology === "branching-grove" ? [1, -1, 1] : index % 2 ? [-1, 1, -1] : [1, -1, 1]),
    routePoints: authored?.routePoints || null,
    optionalRoutes: authored?.optionalRoutes || Object.freeze([]),
    terrainAnchors: authored?.terrainAnchors || Object.freeze([]),
    landmarkAnchor: authored?.landmarkAnchor || null,
    sceneryAnchors: authored?.sceneryAnchors || Object.freeze([])
  })];
})));
export function stopPixelMap(sectionOrStop = 1) {
  const stopId = typeof sectionOrStop === "object" ? sectionOrStop?.stopId || `s${sectionOrStop?.stopIndex || 1}` : typeof sectionOrStop === "string" ? sectionOrStop : `s${sectionOrStop}`;
  return STOP_PIXEL_MAPS[stopId] || STOP_PIXEL_MAPS.s1;
}
export function samplePixelMapRoute(points, progress) {
  if (!Array.isArray(points) || points.length === 0) return null;
  if (points.length === 1) return Number(points[0][1]) || 0;
  const value = Math.max(0, Math.min(1, Number(progress) || 0));
  let segment = 0;
  while (segment < points.length - 2 && value > points[segment + 1][0]) segment += 1;
  const current = points[segment];
  const next = points[segment + 1];
  const span = Math.max(0.0001, next[0] - current[0]);
  const t = Math.max(0, Math.min(1, (value - current[0]) / span));
  const previousX = Number(points[Math.max(0, segment - 1)][1]) || 0;
  const currentX = Number(current[1]) || 0;
  const nextX = Number(next[1]) || 0;
  const followingX = Number(points[Math.min(points.length - 1, segment + 2)][1]) || 0;
  const t2 = t * t;
  const t3 = t2 * t;
  const x = 0.5 * (2 * currentX + (-previousX + nextX) * t + (2 * previousX - 5 * currentX + 4 * nextX - followingX) * t2 + (-previousX + 3 * currentX - 3 * nextX + followingX) * t3);
  return Math.max(140, Math.min(500, x));
}
export function authoredPixelRouteCenters(map, progress) {
  if (!map?.routePoints) return null;
  const main = samplePixelMapRoute(map.routePoints, progress);
  const optional = (map.optionalRoutes || []).filter(route => progress >= route.from && progress <= route.to).map(route => samplePixelMapRoute(route.points, progress));
  return [main, ...optional.filter(value => Number.isFinite(value))];
}
