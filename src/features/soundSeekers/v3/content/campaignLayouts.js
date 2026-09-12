import { buildExplorationLayout } from './explorationLayout.js';
import { addCampaignTraversal } from '../engine/campaignTraversal.js';
// Authored place composition plus reusable physical action kits. Geometry is in
// world pixels, +y down, and feeds platformPhysics directly. A layout does not
// assert that its art, action controller or educational content has been tested.
import { CAMPAIGN_STAGES, getCampaignStage, getCampaignMission } from './campaign.js';
import { BACKDROPS } from './trail.js';

const GROUND = 560;
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

// Each row specifies its own hub span, landmark composition, raised route,
// mission meet points, construction gap and action-area width. Dino locations
// use wooden/stone machinery and the valley painting, never the forge painting.
const PLACE_ROWS = [
  ['meadow-01', 'seedwake-meadow', 3440, 'oak-bath-corner', 1250, 440, 360, 1260, [[420,560],[1020,560],[1550,560],[2240,560],[3010,560],[780,440],[1960,440]]],
  ['meadow-02', 'seedwake-meadow', 3660, 'fern-shelter', 1390, 350, 320, 1380, [[390,560],[1050,560],[1720,560],[2470,560],[3260,560],[860,440],[2140,350]]],
  ['meadow-03', 'seedwake-meadow', 3520, 'stone-wall-nest', 1510, 440, 340, 1300, [[410,560],[1130,560],[1840,560],[2500,560],[3160,560],[820,440],[2190,440]]],
  ['meadow-04', 'river-gardens', 3980, 'two-bank-pond', 1730, 440, 460, 1500, [[430,560],[1240,560],[2060,560],[2830,560],[3550,560],[930,440],[2450,440]]],
  ['meadow-05', 'seedwake-meadow', 3740, 'bramble-picnic-gate', 1620, 350, 380, 1440, [[480,560],[1140,560],[1930,560],[2660,560],[3370,560],[850,440],[2290,350]]],
  ['meadow-06', 'seedwake-meadow', 3860, 'bluff-basket-hoist', 1560, 260, 400, 1520, [[430,560],[1200,560],[2010,560],[2770,560],[3450,560],[920,440],[2380,260]]],
  ['meadow-07', 'river-gardens', 4080, 'lily-ferry-moorings', 1810, 440, 480, 1560, [[470,560],[1300,560],[2130,560],[2910,560],[3650,560],[960,440],[2530,440]]],
  ['meadow-08', 'river-gardens', 3640, 'fishpool-picnic-tables', 1420, 440, 320, 1340, [[450,560],[1150,560],[1810,560],[2490,560],[3240,560],[820,440],[2160,440]]],
  ['meadow-09', 'river-gardens', 3920, 'wheelhouse-ladder', 1680, 230, 420, 1580, [[420,560],[1170,560],[1960,560],[2780,560],[3520,560],[880,440],[2360,230]]],
  ['meadow-10', 'river-gardens', 4200, 'weir-gathering-signals', 1850, 350, 460, 1620, [[460,560],[1270,560],[2160,560],[3030,560],[3780,560],[960,440],[2610,350]]],
  ['dino-11', 'fossil-canyon', 3920, 'amber-ridge-signs', 1610, 350, 390, 1490, [[420,560],[1160,560],[1980,560],[2740,560],[3500,560],[880,440],[2380,350]]],
  ['dino-12', 'fossil-canyon', 3800, 'cozy-stone-shelter', 1490, 440, 350, 1410, [[460,560],[1210,560],[1900,560],[2600,560],[3400,560],[910,440],[2240,440]]],
  ['dino-13', 'fossil-canyon', 4380, 'split-path-parcels', 1980, 350, 430, 1660, [[430,560],[1320,560],[2250,560],[3150,560],[3970,560],[970,440],[2680,350]]],
  ['dino-14', 'fossil-canyon', 4260, 'fern-counterweight-crossing', 1840, 230, 510, 1710, [[470,560],[1260,560],[2200,560],[3060,560],[3850,560],[930,440],[2630,230]]],
  ['dino-15', 'fossil-canyon', 4120, 'claw-pass-drawbridge', 1780, 350, 450, 1570, [[450,560],[1190,560],[2070,560],[2940,560],[3730,560],[880,440],[2490,350]]],
  ['dino-16', 'fossil-canyon', 3860, 'wooden-signal-arms', 1580, 260, 380, 1460, [[420,560],[1160,560],[1940,560],[2720,560],[3480,560],[870,440],[2290,260]]],
  ['dino-17', 'fossil-canyon', 4040, 'stone-supply-bays', 1630, 440, 410, 1530, [[460,560],[1230,560],[2040,560],[2810,560],[3650,560],[920,440],[2440,440]]],
  ['dino-18', 'fossil-canyon', 3900, 'wooden-sign-workshop', 1650, 350, 370, 1480, [[450,560],[1190,560],[1980,560],[2720,560],[3510,560],[870,440],[2330,350]]],
  ['dino-19', 'fossil-canyon', 4320, 'handcart-convoy-yard', 1880, 440, 440, 1640, [[420,560],[1300,560],[2180,560],[3040,560],[3910,560],[950,440],[2600,440]]],
  ['dino-20', 'fossil-canyon', 4520, 'valley-two-span-crossing', 1960, 350, 540, 1790, [[460,560],[1350,560],[2330,560],[3240,560],[4080,560],[990,440],[2780,350]]],
  ['moonwood-21', 'glass-marsh', 4200, 'reed-floating-landing', 1830, 440, 490, 1610, [[450,560],[1290,560],[2140,560],[2990,560],[3800,560],[960,440],[2560,440]]],
  ['moonwood-22', 'glass-marsh', 4020, 'mica-illuminated-stair', 1700, 200, 410, 1540, [[430,560],[1210,560],[2050,560],[2870,560],[3620,560],[920,440],[2460,200]]],
  ['moonwood-23', 'glass-marsh', 4460, 'fen-reflected-forks', 2030, 350, 470, 1730, [[450,560],[1340,560],[2290,560],[3180,560],[4030,560],[1000,440],[2750,350]]],
  ['moonwood-24', 'storm-coast', 4320, 'shell-shore-workbench', 1880, 440, 500, 1680, [[480,560],[1320,560],[2220,560],[3090,560],[3900,560],[970,440],[2630,440]]],
  ['moonwood-25', 'storm-coast', 4580, 'harbour-lighthouse-piers', 2090, 230, 520, 1810, [[470,560],[1380,560],[2370,560],[3290,560],[4150,560],[1030,440],[2820,230]]],
  ['moonwood-26', 'lantern-forest', 4180, 'garden-root-walkway', 1820, 350, 430, 1590, [[420,560],[1250,560],[2130,560],[2980,560],[3760,560],[900,440],[2540,350]]],
  ['moonwood-27', 'lantern-forest', 4700, 'stone-wide-forest-route', 2180, 440, 570, 1860, [[460,560],[1410,560],[2450,560],[3400,560],[4270,560],[1030,440],[2920,440]]],
  ['moonwood-28', 'star-reach', 4460, 'observatory-dome-stair', 1990, 110, 460, 1770, [[440,560],[1320,560],[2300,560],[3200,560],[4050,560],[950,440],[2770,110]]],
  ['moonwood-29', 'star-reach', 4280, 'aster-message-archive', 1860, 350, 420, 1650, [[470,560],[1290,560],[2190,560],[3060,560],[3850,560],[940,440],[2610,350]]],
  ['moonwood-30', 'star-reach', 4900, 'three-community-skybridge', 2290, 230, 600, 1920, [[450,560],[1470,560],[2560,560],[3530,560],[4450,560],[1040,440],[3050,230]]]
];

export const CAMPAIGN_STAGE_LAYOUTS = freeze(PLACE_ROWS.map(([stageId, backdropKey, width, landmark, repairX, upperY, bridgeWidth, roomWidth, meets]) => ({
  stageId, backdropKey, width, landmark, repairX, upperY, bridgeWidth, roomWidth,
  missionMeetPoints: meets.map(([x, y]) => ({ x, y }))
})));
const placeById = new Map(CAMPAIGN_STAGE_LAYOUTS.map(layout => [layout.stageId, layout]));
const platform = (id, x, y, width) => ({ id, x, y, width, height: 28 });
const object = (id, kind, x, y, extra = {}) => ({ id, kind, x, y, ...extra });
const floor = (id, x, width, y = GROUND) => ({ id, x, y, width, height: 340 });
export function getCampaignHubLayout(stageId) {
  const stage = getCampaignStage(stageId), place = placeById.get(stageId);
  if (!stage || !place) return null;
  const layout = buildExplorationLayout(stage, place);
  return { ...layout, id: `${stageId}/hub`, coordinateSystem: 'top-down-x-right-y-down',
    backdrop: BACKDROPS[place.backdropKey], missionNodes: layout.nodes,
    objects: [{id:'landmark',...layout.landmark}],
    repairFootprint: {repairId:stage.repairId,x:layout.landmark.x,y:layout.landmark.y-190,width:520,height:190}
  };
}

function baseRoom(mission, place, index, familyId, x, y) {
  const w = place.roomWidth;
  const anchorX = x + 310;
  return {
    id: `${mission.id}/room-${index}`, familyId, originX: x, groundY: y, width: w, activityWidth: w,
    spawn: { x: x + 100, y }, exit: { x: x + w - 95, y },
    solids: [floor(`floor-${index}`, x, w, y)], platforms: [], hazards: [], repairPlatforms: [],
    // Choice indices carry no answer information. A controller positions the
    // public choices here after its independent answer-ordering contract.
    choiceAnchors: Array.from({ length: 10 }, (_, n) => ({ x: anchorX + n * Math.min(100, (w - 540) / 9), y })),
    objects: [], checkpoints: [{ id: `${mission.id}-room-${index}`, x: x + 65, y: y - 100, width: 70, height: 110, spawn: { x: x + 100, y } }],
    repairFootprint: { repairId: `${mission.id}-room-${index}-repair`, x: x + w - 350, y: y - 160, width: 220, height: 160 },
    actionContract: { commitment: 'explicit-language-action', motorErrors: 'recovery-only', supportChanges: 'preserve-in-attempt' }
  };
}

const kits = {
  'sound-steps'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    // The renderer installs the public choices as the actual stepping surfaces;
    // unrelated shelves must not overlap and mask their landing contacts.
    room.platforms = [];
    room.objects = [object('sound-source', 'listening-stone', x + 150, y), object('route-end', place.landmark, x + w - 220, y)];
    room.choiceAnchors = room.choiceAnchors.map((p, i) => ({ ...p, y: i < 3 ? y - 90 : y }));
    // The low route stays usable for motor assistance and return travel.
    room.actionContract.commitment = 'intentional-tile-action';
  },
  'word-pop'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    room.objects = [object('launcher', 'seed-or-bubble-launcher', x + 170, y), object('target-rack', 'stationary-sign-rack', x + w - 500, y - 210), object('released-item', place.landmark, x + w - 260, y)];
    room.choiceAnchors = room.choiceAnchors.map((p, i) => ({ ...p, y: y - [170, 230, 190, 210, 150, 220, 180, 230, 160, 200][i] }));
    room.actionContract = { ...room.actionContract, commitment: 'shot-hit-labelled-target', emptyShot: 'motor-only', targetLock: true, targetMotion: 'stationary' };
  },
  'rescue-bridge'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    const gapWidth = Math.min(place.bridgeWidth, w - 790), gapX = x + w * .56;
    room.solids = [floor(`${room.id}-near-bank`, x, gapX - x, y), floor(`${room.id}-far-bank`, gapX + gapWidth, x + w - gapX - gapWidth, y)];
    room.hazards = [{ id: `${room.id}-gap`, kind: 'safe-return-void', x: gapX, y: y + 80, width: gapWidth, height: 390, response: 'last-checkpoint', literacyPenalty: false }];
    room.repairPlatforms = [platform(`${room.id}-built-span`, gapX - 8, y, gapWidth + 16)];
    room.objects = [object('rack', 'grapheme-plank-rack', x + 200, y), object('bridge-slots', 'construction-slots', gapX, y, { spanWidth: gapWidth }), object('rescue-item', place.landmark, x + w - 180, y)];
    room.choiceAnchors = room.choiceAnchors.map((p, i) => ({ x: x + 180 + i * Math.min(58, (gapX - x - 320) / 9), y }));
    room.repairFootprint = { ...room.repairFootprint, x: gapX, y: y - 20, width: gapWidth, height: 55 };
    room.actionContract = { ...room.actionContract, commitment: 'place-grapheme-in-ordered-slot', collisionUnlock: 'encoding-complete', keepCorrectSlots: true, allowUndo: true };
  },
  'tree-rescue'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    room.solids = [];
    room.platforms = [platform(`${room.id}-rest`, x + 45, y, 320), platform(`${room.id}-step-a`, x + 285, y - 100, 280), platform(`${room.id}-step-b`, x + 500, y - 200, 280), platform(`${room.id}-upper-rest`, x + 700, y - 300, w - 745)];
    room.choiceAnchors = room.choiceAnchors.map((p, i) => ({ x: x + 770 + i * Math.min(62, (w - 900) / 9), y: y - 300 }));
    room.exit = { x: x + w - 105, y: y - 300 };
    room.objects = [object('climb-anchor', 'ladder-or-vine', x + 410, y - 100), object('waiting-friend', place.landmark, x + w - 195, y - 300)];
    room.actionContract = { ...room.actionContract, commitment: 'foothold-language-action', retainHeightOnRetry: true, verticalFollow: true };
  },
  'pals-post'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    room.platforms = [platform(`${room.id}-upper-loop`, x + 500, y - 110, 340), platform(`${room.id}-return-loop`, x + w - 510, y - 110, 290)];
    room.objects = [object('parcel-pickup', 'recoverable-parcel', x + 180, y), object('near-destination', 'delivery-marker', x + 460, y), object('far-destination', place.landmark, x + w - 380, y), object('return-sign', 'return-shortcut-sign', x + w - 180, y)];
    room.choiceAnchors = room.choiceAnchors.map((p, i) => ({ x: x + 350 + i * (w - 650) / 9, y }));
    room.actionContract = { ...room.actionContract, commitment: 'deliver-carried-object', wrongDelivery: 'retain-parcel', carryAssist: 'select-then-place' };
  },
  'sound-herd'(room) {
    const { originX: x, groundY: y, width: w } = room;
    room.objects = [object('release', 'carrier-release', x + 150, y), object('left-channel', 'sound-routing-channel', x + 460, y), object('right-channel', 'sound-routing-channel', x + w - 400, y), object('return-loop', 'carrier-return-track', x + w - 200, y)];
    room.platforms = [platform(`${room.id}-gate-lookout`, x + 280, y - 105, 250)];
    room.actionContract = { ...room.actionContract, commitment: 'route-carrier-to-labelled-bin', pauseDuringContrast: true, wrongRoute: 'return-carrier' };
  },
  'river-route'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    room.platforms = [platform(`${room.id}-upper-bank`, x + 360, y - 100, 340), platform(`${room.id}-lower-bank`, x + w - 540, y - 75, 320)];
    room.objects = [object('raft', 'safe-route-raft', x + 170, y), object('eddy', 'decision-eddy', x + w * .44, y), object('junction-a', 'route-junction', x + w * .57, y - 100), object('junction-b', 'route-junction', x + w * .57, y), object('landing', place.landmark, x + w - 200, y)];
    room.actionContract = { ...room.actionContract, commitment: 'choose-route-at-safe-junction', noTimedReading: true, steeringError: 'motor-only' };
  },
  'sentence-express'(room) {
    const { originX: x, groundY: y, width: w } = room;
    room.objects = [object('word-carts', 'carryable-word-carts', x + 220, y), object('coupling-rail', 'wooden-assembly-rail', x + 470, y, { width: w - 710 }), object('message-board', 'meaning-board', x + w - 220, y - 170)];
    room.repairFootprint = { ...room.repairFootprint, x: x + 470, y: y - 90, width: w - 710, height: 90 };
    room.actionContract = { ...room.actionContract, commitment: 'couple-word-cart', equivalence: 'authored-valid-orders', preserveValidAssembly: true };
  },
  'fix-it-workshop'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    room.platforms = [platform(`${room.id}-parts-shelf`, x + 240, y - 110, 310)];
    room.objects = [object('parts-rack', 'letter-part-rack', x + 330, y - 110), object('workbench', 'changeable-word-workbench', x + w * .56, y), object('mechanism', place.landmark, x + w - 270, y)];
    room.actionContract = { ...room.actionContract, commitment: 'replace-requested-word-part', noNaiveSuffixRule: true, showPhysicalChange: true };
  },
  'garden-kitchen'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    room.objects = [object('carry-object', 'instruction-object', x + 170, y), object('rail', 'horizontal-rail', x + w * .40, y - 140), object('tray', 'open-tray', x + w * .62, y - 60), object('stool', 'stool-with-clear-under-space', x + w * .82, y), object('setting', place.landmark, x + w - 140, y)];
    room.actionContract = { ...room.actionContract, commitment: 'place-object-in-semantic-location', instructionMode: 'oral-or-explicit-print', carryAssist: 'select-then-place' };
  },
  'lantern-search'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    room.platforms = [platform(`${room.id}-clue-shelf`, x + 350, y - 110, 320), platform(`${room.id}-lookout`, x + w - 610, y - 100, 290)];
    room.objects = [object('clue-one', 'inspectable-note', x + 200, y), object('clue-two', 'inspectable-note', x + w * .60, y), object('search-nook', place.landmark, x + w - 290, y)];
    room.actionContract = { ...room.actionContract, commitment: 'select-clue-supported-object', cluesPersist: true, contextMustNotRevealReadingAnswer: true };
  },
  'story-rescue'(room, place) {
    const { originX: x, groundY: y, width: w } = room;
    room.platforms = [platform(`${room.id}-story-lookout`, x + 460, y - 100, 310)];
    room.objects = [object('message', 'inspectable-story-message', x + 180, y), object('action-place', 'story-action-station', x + w * .57, y), object('resolved-place', place.landmark, x + w - 240, y)];
    room.actionContract = { ...room.actionContract, commitment: 'perform-message-supported-action', referenceMustBeUnambiguous: true, helpChangesSupportStatus: true };
  }
};

/** beatFamilies lets a finale use the actual builder family of each beat.
 * Never infer answers or learning state from geometry or room number. */
export function getCampaignLayout(missionId, { beatCount = 1, beatFamilies = [], beatMechanics = [], beatSections = [] } = {}) {
  const mission = getCampaignMission(missionId);
  if (!mission) return null;
  if (!Number.isInteger(beatCount) || beatCount < 1 || beatCount > 200) throw new RangeError('Layout needs a finite authored beat count between 1 and 200');
  const place = placeById.get(mission.stageId);
  const rooms = [];
  let x = 0, y = GROUND;
  for (let index = 0; index < beatCount; index += 1) {
    const familyId = beatFamilies[index] || mission.familyId;
    if (!kits[familyId]) throw new Error(`No physical action kit for ${familyId}`);
    const teaching = beatMechanics[index] === 'sound_signpost';
    const room = baseRoom(mission, teaching ? {...place,roomWidth:720} : place, index, familyId, x, y);
    room.teaching=teaching;
    if(teaching){
      room.objects=[object('sound-source','listening-stone',x+145,y),object('route-end','grass-platform',x+590,y)];
      room.actionContract.commitment='listen-to-teaching';
    }else kits[familyId](room, place);
    // Crossings punctuate completed groups. A teaching card never demands a
    // long lever detour, and a continuous group keeps its camera and terrain.
    const sectionEnd=index===beatCount-1 || beatFamilies[index+1]&&beatFamilies[index+1]!==familyId || beatSections[index+1]!==beatSections[index];
    if (!teaching && familyId !== 'tree-rescue' && (sectionEnd || index%3===2)) addCampaignTraversal(room, Number(mission.id.split('-').at(-1)) + Math.floor(index/3));
    rooms.push(room);
    x += room.width;
    y = room.exit.y;
  }
  const platforms = rooms.flatMap(room => room.platforms);
  // Consecutive ascent rooms meet at the same exit height. Each has real
  // platforms and the camera follows actual height rather than screen offsets.
  const top = Math.min(0, ...rooms.map(room => room.exit.y - 500));
  return {
    id: mission.layoutId, missionId, stageId: mission.stageId, coordinateSystem: 'x-right-y-down-feet',
    bounds: { left: 0, right: x, top, bottom: 1080 }, spawn: rooms[0].spawn,
    solids: rooms.flatMap(room => room.solids), platforms,
    hazards: rooms.flatMap(room => room.hazards), checkpoints: rooms.flatMap(room => room.checkpoints),
    rooms, camera: { vertical: rooms.some(room => room.familyId === 'tree-rescue'), mode: mission.layout.camera },
    backdropKey: place.backdropKey, backdrop: BACKDROPS[place.backdropKey],
    repairFootprint: { ...rooms.at(-1).repairFootprint, repairId: mission.outcome.repairId },
    evidenceBoundary: 'Geometry and motor recovery do not award literacy evidence.'
  };
}

export const getCampaignStageLayout = stageId => placeById.get(stageId) || null;
export const CAMPAIGN_LAYOUT_STAGE_IDS = freeze(CAMPAIGN_STAGES.map(stage => stage.id));

/** Wide public-choice targets, independent of their answer values. More than
 * five choices use a second shelf; callers render each anchor in world space. */
export function getCampaignChoiceAnchors(room, count) {
  if (!room || !Number.isInteger(count) || count < 1) return [];
  const columns = Math.min(5, count);
  const spacing = room.familyId === 'rescue-bridge' ? 120 : 150;
  const first = room.teaching ? room.originX+room.activityWidth/2 : room.familyId === 'tree-rescue' ? room.originX + 770 : room.familyId === 'rescue-bridge' ? room.originX + 120 : room.originX + ((room.activityWidth || room.width) - (columns - 1) * spacing) / 2;
  const groundY = room.familyId === 'tree-rescue' ? room.exit.y : room.groundY;
  return Array.from({ length: count }, (_, index) => ({
    x: first + index % columns * spacing,
    y: groundY - Math.floor(index / columns) * 140 - (room.teaching ? 0 : room.familyId === 'word-pop' ? [145,205,170,220,155][index%5] : room.familyId==='sound-steps' ? [75,125,75,125,75][index%5] : 0)
  }));
}
