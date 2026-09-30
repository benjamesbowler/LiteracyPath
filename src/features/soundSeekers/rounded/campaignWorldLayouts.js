import { SOUND_SEEKERS_ROUNDED_PALETTE } from '../visual/visualTokens.js';
import { CAMPAIGN_STAGES } from '../v3/content/campaign.js';

// Metres on the rounded world's x/z plane. Each authored branch belongs to the
// same walkable geometry used by its road, camera and collision checks.
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const rows = [
  ['meadow-01','grove', [[0,21],[-9,12],[-17,3],[-8,-4],[3,-10],[15,-3],[18,12],[-18,-15],[4,4]], [[0,1,2,3,4,5],[1,8,5,6,0],[3,7]], [-4,-16]],
  ['meadow-02','fern-steps', [[4,21],[-8,12],[-17,2],[-7,-6],[8,-13],[17,-4],[18,11],[-20,-14],[4,3]], [[0,1,2,3,4],[0,6,5,4],[2,7],[1,8,5]], [3,-19]],
  ['meadow-03','stone-ring', [[-3,21],[-16,12],[-19,-2],[-9,-13],[8,-14],[17,-3],[17,13],[-23,-15],[1,3]], [[0,1,2,3,4,5,6,0],[3,7],[1,8,5]], [0,-22]],
  ['meadow-04','ford', [[-10,21],[-19,11],[-20,-5],[-10,-17],[7,-18],[19,-6],[18,13],[0,11],[-23,-19]], [[0,1,2,3,4,5,6,7,0],[2,8]], [0,-5], {axis:'x',at:0,width:3,from:-13,to:8}],
  ['meadow-05','bramble-gate', [[0,22],[-13,14],[-20,2],[-13,-12],[1,-18],[16,-8],[20,8],[8,9],[-21,-19]], [[0,1,2,3,4,5,6,7,0],[3,8],[1,7]], [5,-7]],
  ['meadow-06','bluff', [[-7,21],[-18,12],[-21,-2],[-12,-15],[4,-18],[16,-9],[19,9],[3,5],[-21,-23]], [[0,1,2,3,4,5,6,7,0],[3,8],[2,7]], [7,-8]],
  ['meadow-07','ferry', [[-11,21],[-21,10],[-19,-6],[-6,-19],[12,-17],[21,-3],[20,14],[7,13],[-24,-20]], [[0,1,2,3,4,5,6,7,0],[2,8]], [2,-5], {axis:'x',at:2,width:3.6,from:-13,to:8}],
  ['meadow-08','picnic', [[3,22],[-10,13],[-21,3],[-15,-10],[0,-17],[16,-8],[22,7],[-22,-19],[7,5]], [[0,1,2,3,4,5,6,8,0],[1,8],[3,7]], [3,-7], {circle:[-18,16,3.2]}],
  ['meadow-09','mill', [[-6,22],[-18,12],[-20,-5],[-10,-18],[9,-19],[20,-6],[20,12],[4,9],[-24,-23]], [[0,1,2,3,4,5,6,7,0],[2,8],[1,7]], [4,-6], {axis:'x',at:3,width:2.7,from:-14,to:3}],
  ['meadow-10','weir', [[-12,22],[-21,9],[-17,-9],[-3,-20],[15,-15],[22,0],[17,15],[2,13],[-23,-22]], [[0,1,2,3,4,5,6,7,0],[2,8]], [5,-4], {axis:'x',at:5,width:3,from:-12,to:8}],
  ['dino-11','ridge', [[-5,22],[-18,12],[-22,-2],[-12,-16],[6,-20],[20,-10],[21,10],[3,5],[-24,-23]], [[0,1,2,3,4,5,6,7,0],[3,8],[2,7]], [3,-10]],
  ['dino-12','stone-shelter', [[8,21],[-7,14],[-20,4],[-16,-12],[1,-20],[17,-11],[22,5],[-23,-21],[3,3]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7]], [3,-11]],
  ['dino-13','split-flats', [[0,23],[-13,15],[-22,2],[-13,-14],[3,-21],[18,-10],[22,10],[-24,-22],[5,5]], [[0,1,2,3,4],[0,8,6,5,4],[3,7],[1,8]], [3,-7]],
  ['dino-14','canyon', [[-9,22],[-21,11],[-21,-7],[-9,-21],[10,-20],[21,-5],[20,14],[5,14],[-24,-24]], [[0,1,2,3,4,5,6,7,0],[2,8]], [1,-4], {axis:'x',at:1,width:3.3,from:-14,to:9}],
  ['dino-15','pass', [[7,22],[-8,14],[-21,3],[-14,-13],[2,-22],[18,-12],[22,6],[-24,-21],[1,2]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7]], [4,-11]],
  ['dino-16','signal', [[-1,22],[-16,13],[-21,-3],[-9,-18],[8,-21],[21,-7],[21,12],[-24,-23],[3,5]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7]], [2,-9]],
  ['dino-17','store', [[-8,22],[-20,13],[-22,-4],[-11,-18],[6,-20],[21,-9],[22,10],[-24,-23],[3,5]], [[0,1,2,3,4,5,6,8,0],[1,8,5],[3,7]], [5,-7]],
  ['dino-18','workshop', [[4,22],[-10,14],[-22,3],[-16,-13],[0,-21],[17,-11],[22,8],[-24,-22],[3,3]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7]], [3,-10]],
  ['dino-19','yard', [[-4,22],[-18,14],[-22,-1],[-13,-16],[5,-22],[21,-11],[22,12],[-24,-23],[3,6],[11,-8]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7],[8,9,4]], [4,-8]],
  ['dino-20','valley-crossing', [[-12,22],[-22,10],[-20,-8],[-7,-21],[12,-20],[22,-4],[19,15],[3,14],[-24,-24]], [[0,1,2,3,4,5,6,7,0],[2,8]], [2,-5], {axis:'x',at:2,width:3.5,from:-14,to:9}],
  ['moonwood-21','reeds', [[-11,22],[-21,10],[-18,-8],[-4,-21],[14,-17],[22,-1],[18,16],[3,13],[-23,-24]], [[0,1,2,3,4,5,6,7,0],[2,8]], [3,-4], {axis:'x',at:3,width:3.7,from:-13,to:8}],
  ['moonwood-22','mica-stairs', [[5,22],[-11,14],[-21,1],[-12,-15],[5,-23],[21,-11],[22,10],[-24,-22],[4,5]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7]], [5,-11]],
  ['moonwood-23','mirror-fen', [[-8,22],[-20,12],[-21,-5],[-7,-21],[12,-20],[22,-4],[19,15],[2,12],[-24,-24]], [[0,1,2,3,4,5,6,7,0],[2,8]], [2,-5], {axis:'x',at:2,width:3.2,from:-14,to:7}],
  ['moonwood-24','shore-workshop', [[-6,22],[-19,14],[-22,-2],[-11,-18],[8,-21],[21,-8],[22,11],[-24,-23],[4,5]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7]], [4,-8], {circle:[16,19,3.6]}],
  ['moonwood-25','harbour', [[-12,22],[-22,9],[-17,-11],[-1,-23],[16,-17],[23,1],[17,17],[1,12],[-24,-25]], [[0,1,2,3,4,5,6,7,0],[2,8]], [3,-5], {axis:'x',at:4,width:3.8,from:-12,to:8}],
  ['moonwood-26','root-garden', [[1,22],[-14,14],[-22,0],[-13,-16],[4,-23],[20,-10],[22,10],[-24,-23],[5,5]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7]], [2,-8]],
  ['moonwood-27','wide-turn', [[-7,22],[-21,12],[-21,-6],[-8,-22],[11,-22],[22,-5],[21,14],[5,13],[-24,-25]], [[0,1,2,3,4,5,6,7,0],[2,8]], [3,-5], {axis:'x',at:3,width:3.6,from:-14,to:8}],
  ['moonwood-28','observatory', [[6,22],[-10,14],[-22,1],[-14,-17],[5,-24],[21,-12],[23,8],[-24,-24],[4,3]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7]], [4,-10]],
  ['moonwood-29','archive', [[-2,22],[-17,14],[-23,-1],[-14,-18],[5,-23],[22,-10],[23,12],[-24,-25],[3,5],[11,-9]], [[0,1,2,3,4,5,6,0],[1,8,5],[3,7],[8,9,4]], [3,-9]],
  ['moonwood-30','gathering', [[-10,22],[-22,10],[-19,-10],[-3,-24],[16,-19],[24,-1],[19,17],[2,13],[-24,-25]], [[0,1,2,3,4,5,6,7,0],[2,8],[3,5]], [4,-7], {axis:'x',at:4,width:3.8,from:-14,to:8}]
];

// Optional game discoveries have no literacy score. Each place authors a spare
// object to carry home and a physical lookout to operate off the teaching path.
const discoveryRows = [
 ['meadow-01','seed','oak seed','tray','lantern','Light the root lantern'],
 ['meadow-02','cushion','spare cushion','basket','sign','Turn the hillside trail sign'],
 ['meadow-03','feather','fallen feather','tray','wheel','Turn the rook wind wheel'],
 ['meadow-04','shell','river shell','tray','lantern','Light the far-bank lantern'],
 ['meadow-05','flower','wild flower','pot','sign','Turn the garden trail sign'],
 ['meadow-06','apple','fallen apple','basket','wheel','Turn the bluff wind wheel'],
 ['meadow-07','flower','lily blossom','pot','reflector','Turn the ferry lookout mirror'],
 ['meadow-08','cup','spare cup','tray','lantern','Light the picnic lantern'],
 ['meadow-09','parcel','small delivery','basket','wheel','Turn the spare mill wheel'],
 ['meadow-10','feather','river feather','tray','sign','Turn the weir lookout sign'],
 ['dino-11','stone','smooth ridge stone','tray','reflector','Turn the ridge lookout mirror'],
 ['dino-12','book','spare storybook','basket','lantern','Light the shelter trail lantern'],
 ['dino-13','parcel','small delivery','basket','sign','Turn the flats trail sign'],
 ['dino-14','stone','striped canyon stone','tray','wheel','Turn the canyon wind wheel'],
 ['dino-15','tool','spare tool','tray','lantern','Light the pass lookout lantern'],
 ['dino-16','handle','spare handle','tray','wheel','Turn the gearworks wind wheel'],
 ['dino-17','seed','ridge seed','pot','sign','Turn the store trail sign'],
 ['dino-18','brush','spare paintbrush','tray','reflector','Turn the workshop lookout mirror'],
 ['dino-19','letter','spare envelope','tray','lantern','Light the yard trail lantern'],
 ['dino-20','flag','spare flag','basket','wheel','Turn the valley wind wheel'],
 ['moonwood-21','flower','reed flower','pot','lantern','Light the reed lookout lantern'],
 ['moonwood-22','gem','mica crystal','tray','reflector','Turn the mica lookout mirror'],
 ['moonwood-23','shell','fen shell','tray','reflector','Turn the fen lookout mirror'],
 ['moonwood-24','shell','shore shell','tray','wheel','Turn the harbour wind wheel'],
 ['moonwood-25','lantern','spare lantern','tray','sign','Turn the harbour trail sign'],
 ['moonwood-26','seed','garden seed','pot','lantern','Light the garden lookout lantern'],
 ['moonwood-27','scroll','spare scroll','basket','sign','Turn the wide-path trail sign'],
 ['moonwood-28','gem','moon crystal','tray','reflector','Turn the observatory mirror'],
 ['moonwood-29','book','spare storybook','basket','lantern','Light the archive trail lantern'],
 ['moonwood-30','flower','star flower','pot','wheel','Turn the gathering wind wheel']
];

// Permanent natural/place context, separate from the five recovered parts.
// The approved forest sculptures and tactile plants make the local geography
// readable before the first repair: terraces, rook stones, banks and workshops.
const f=(kind,x,z,scale=1,rotation=0)=>({kind,x,z,scale,rotation});
const featureRows=[
 ['meadow-01',[f('fern',-9,-20,2.1),f('fern',1,-23,1.8),f('mushrooms',-12,-22,.8),f('rock',3,-24,1.5)]],
 ['meadow-02',[f('rock',5,-25,2.1),f('rock',-2,-24,1.6),f('fern',-3,-21,2.5),f('fern',10,-23,2.2),f('fern',1,-27,1.6)]],
 ['meadow-03',[f('rock',-5,-25,2.7),f('rock',3,-26,3),f('rock',8,-23,2.1),f('fern',-3,-28,1.5)]],
 ['meadow-04',[f('reed',-2.7,-3,1.6),f('reed',2.7,-9,1.6),f('rock',-6,-8,1.4),f('lily',.3,0,.8),f('reed',-3,3,1.8)]],
 ['meadow-05',[f('hedge',1,-3,1.6),f('hedge',12,-17,1.6),f('hedge',-1,-6,1.4),f('flower',9,-15,1.3),f('mushrooms',-5,-24,.7)]],
 ['meadow-06',[f('rock',7,-25,2.7),f('rock',13,-24,2),f('rock',1,-26,2.1),f('fern',9,-27,2),f('fern',-2,-24,1.7)]],
 ['meadow-07',[f('reed',-.8,-4,1.8),f('reed',5,-8,1.6),f('lily',2,-9,.9),f('lily',2,2,.8),f('fern',-4,-4,1.6)]],
 ['meadow-08',[f('fern',-21,15,2),f('reed',-18,13,1.2),f('mushrooms',7,-15,.8),f('fern',6,-20,2),f('rock',-4,-24,1.8)]],
 ['meadow-09',[f('cottage',9,-8,1),f('reed',.4,-8,1.5),f('reed',5.4,0,1.2),f('rock',9,-25,1.7),f('fern',-3,-25,2)]],
 ['meadow-10',[f('reed',2,-8,1.6),f('reed',8,4,1.6),f('lily',5,-3,.9),f('rock',-2,-26,2),f('fern',11,-25,1.8)]],
 ['dino-11',[f('rock',1,-26,2.8),f('rock',10,-27,2.5),f('rock',-7,-25,2),f('fern',11,-23,1.5)]],
 ['dino-12',[f('rock',5,-25,2.1),f('rock',-4,-25,2.3),f('rock',11,-25,1.6),f('fern',7,-22,1.8)]],
 ['dino-13',[f('rock',1,-27,1.8),f('rock',11,-26,2.2),f('fern',-5,-24,1.6),f('mushrooms',10,-23,.6)]],
 ['dino-14',[f('rock',-5,-8,2),f('rock',6,-10,2),f('rock',-4,-12,1.8),f('rock',6,3,1.8),f('fern',-5,1,1.8)]],
 ['dino-15',[f('rock',-4,-26,2.5),f('rock',7,-27,2.8),f('rock',12,-24,2),f('fern',1,-28,1.7)]],
 ['dino-16',[f('rock',-2,-27,1.9),f('rock',12,-25,2.1),f('fern',5,-28,1.6),f('mushrooms',-8,-26,.7)]],
 ['dino-17',[f('rock',4,-27,2),f('rock',12,-26,1.9),f('fern',-3,-24,2),f('mushrooms',7,-25,.7)]],
 ['dino-18',[f('cottage',6,-26,.9),f('rock',12,-25,1.5),f('rock',-5,-25,1.8),f('fern',9,-27,1.5)]],
 ['dino-19',[f('cottage',6,-27,.9),f('rock',-3,-27,1.6),f('fern',13,-26,1.8),f('rock',-9,-26,1.5)]],
 ['dino-20',[f('rock',-3,-6,1.7),f('rock',7,-12,1.6),f('rock',-3,2,1.8),f('fern',7,3,1.8),f('reed',4.4,-7,1.4)]],
 ['moonwood-21',[f('reed',0,-4,2),f('reed',6,-8,1.8),f('lily',3,-9,.9),f('lily',3,1,.8),f('fern',-3,-8,1.7)]],
 ['moonwood-22',[f('rock',2,-28,2.4),f('rock',12,-27,2.1),f('rock',-5,-27,2),f('fern',8,-24,1.7)]],
 ['moonwood-23',[f('reed',-.7,-6,1.8),f('reed',4.7,-9,1.8),f('lily',2,-10,.8),f('fern',-3,1,1.8),f('rock',7,-25,1.9)]],
 ['moonwood-24',[f('cottage',7,-27,.9),f('reed',14,17,1.5),f('rock',-3,-26,1.9),f('fern',12,-25,1.7)]],
 ['moonwood-25',[f('reed',.7,-6,1.8),f('reed',7.3,-9,1.8),f('rock',-3,-27,2.1),f('fern',8,-27,1.8),f('lily',4,2,.9)]],
 ['moonwood-26',[f('fern',-2,-25,2),f('fern',10,-26,2.3),f('hedge',-3,-7,1.5),f('flower',8,-23,1.4),f('mushrooms',4,-27,.8)]],
 ['moonwood-27',[f('reed',0,-5,1.8),f('reed',6,-10,1.8),f('fern',-3,2,2),f('rock',8,-26,1.9),f('lily',3,-10,.8)]],
 ['moonwood-28',[f('rock',-4,-27,2.5),f('rock',12,-27,2.3),f('fern',7,-28,1.8),f('rock',2,-29,1.8)]],
 ['moonwood-29',[f('cottage',5,-28,.9),f('fern',-4,-27,2),f('rock',12,-26,1.7),f('mushrooms',-9,-26,.7)]],
 ['moonwood-30',[f('reed',.8,-7,1.8),f('reed',7.2,-10,1.8),f('fern',-3,-27,2),f('rock',10,-27,2),f('lily',4,1,.9)]]
];

export const CAMPAIGN_WORLD_THEMES = freeze({
  meadow: { sky:SOUND_SEEKERS_ROUNDED_PALETTE['d5e3ca'], fog:SOUND_SEEKERS_ROUNDED_PALETTE['c9ddbc'], soil:SOUND_SEEKERS_ROUNDED_PALETTE['809565'], grass:SOUND_SEEKERS_ROUNDED_PALETTE['acbb78'], road:SOUND_SEEKERS_ROUNDED_PALETTE['e1cc9f'], shore:SOUND_SEEKERS_ROUNDED_PALETTE['d2c391'], water:SOUND_SEEKERS_ROUNDED_PALETTE['76b9b3'], rock:SOUND_SEEKERS_ROUNDED_PALETTE['a3afa0'], wood:SOUND_SEEKERS_ROUNDED_PALETTE['a87b55'], cream:SOUND_SEEKERS_ROUNDED_PALETTE['f4dfb8'], leaf:SOUND_SEEKERS_ROUNDED_PALETTE['7d9a65'], flower:SOUND_SEEKERS_ROUNDED_PALETTE['e9b09e'], light:SOUND_SEEKERS_ROUNDED_PALETTE['ffe4b0'], fill:SOUND_SEEKERS_ROUNDED_PALETTE['b7d8df'], ambient:SOUND_SEEKERS_ROUNDED_PALETTE['799b88'] },
  dino: { sky:SOUND_SEEKERS_ROUNDED_PALETTE['e9d5ad'], fog:SOUND_SEEKERS_ROUNDED_PALETTE['d8bc94'], soil:SOUND_SEEKERS_ROUNDED_PALETTE['ad946a'], grass:SOUND_SEEKERS_ROUNDED_PALETTE['c6b781'], road:SOUND_SEEKERS_ROUNDED_PALETTE['efd0a0'], shore:SOUND_SEEKERS_ROUNDED_PALETTE['d5bc8b'], water:SOUND_SEEKERS_ROUNDED_PALETTE['85b9b3'], rock:SOUND_SEEKERS_ROUNDED_PALETTE['b58f72'], wood:SOUND_SEEKERS_ROUNDED_PALETTE['98724f'], cream:SOUND_SEEKERS_ROUNDED_PALETTE['f5dbb2'], leaf:SOUND_SEEKERS_ROUNDED_PALETTE['819764'], flower:SOUND_SEEKERS_ROUNDED_PALETTE['e2ba77'], light:SOUND_SEEKERS_ROUNDED_PALETTE['ffd391'], fill:SOUND_SEEKERS_ROUNDED_PALETTE['c6d4d5'], ambient:SOUND_SEEKERS_ROUNDED_PALETTE['a49373'] },
  moonwood: { sky:SOUND_SEEKERS_ROUNDED_PALETTE['778fa7'], fog:SOUND_SEEKERS_ROUNDED_PALETTE['7e99ad'], soil:SOUND_SEEKERS_ROUNDED_PALETTE['657f83'], grass:SOUND_SEEKERS_ROUNDED_PALETTE['8eaaa2'], road:SOUND_SEEKERS_ROUNDED_PALETTE['c5c6b3'], shore:SOUND_SEEKERS_ROUNDED_PALETTE['a3b7b0'], water:SOUND_SEEKERS_ROUNDED_PALETTE['75acbe'], rock:SOUND_SEEKERS_ROUNDED_PALETTE['8d9ead'], wood:SOUND_SEEKERS_ROUNDED_PALETTE['938579'], cream:SOUND_SEEKERS_ROUNDED_PALETTE['f1e3c3'], leaf:SOUND_SEEKERS_ROUNDED_PALETTE['69898c'], flower:SOUND_SEEKERS_ROUNDED_PALETTE['cfb5d7'], light:SOUND_SEEKERS_ROUNDED_PALETTE['e3eaff'], fill:SOUND_SEEKERS_ROUNDED_PALETTE['b2cced'], ambient:SOUND_SEEKERS_ROUNDED_PALETTE['637c93'] }
});

const ridgeKinds = new Set(['fern-steps','bluff','ridge','canyon','pass','signal','valley-crossing','mica-stairs','observatory']);
const squared = (x,z) => x*x+z*z;
export function campaignTerrainHeight(layout,x,z) {
  if (!ridgeKinds.has(layout.kind)) return .1*Math.sin(x*.11)*Math.cos(z*.13);
  const rise = Math.max(0,Math.min(1,(13-z)/39));
  return rise*(layout.kind==='bluff'||layout.kind==='mica-stairs'||layout.kind==='observatory'?4.5:2.5) + .12*Math.sin(x*.16);
}
export function segmentDistance(x,z,a,b) {
  const dx=b[0]-a[0], dz=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-(a[0]+dx*t),z-(a[1]+dz*t));
}
const nearRoad = (roads,x,z,width=4.7) => roads.some(road=>road.points.slice(1).some((b,i)=>segmentDistance(x,z,road.points[i],b)<width));

export const CAMPAIGN_WORLD_LAYOUTS = freeze(Object.fromEntries(rows.map(([stageId,kind,points,branches,landmark,water])=>{
  const stage=CAMPAIGN_STAGES.find(stage=>stage.id===stageId);
  const discovery=discoveryRows.find(row=>row[0]===stageId);
  const p7=points[7];
  const valid=(x,z)=>{if(Math.hypot(x-landmark[0],z-landmark[1])<5)return false;if(water?.circle&&Math.hypot(x-water.circle[0],z-water.circle[1])<water.circle[2]+1)return false;return !(water?.axis&&Math.abs((water.axis==='x'?x:z)-water.at)<water.width/2+1&&(water.axis==='x'?z:x)>water.from-1&&(water.axis==='x'?z:x)<water.to+1);};
  const operationPoint=[[4.4,-2.6],[-4.4,-2.6],[0,4.8],[4.8,0],[-4.8,0]].map(([dx,dz])=>[p7[0]+dx,p7[1]+dz]).find(([x,z])=>x>-27&&x<27&&z>-30&&z<25&&Array.from({length:13},(_,i)=>valid(p7[0]+(x-p7[0])*i/12,p7[1]+(z-p7[1])*i/12)).every(Boolean));
  if(!operationPoint)throw new Error(`Discovery offshoot needs authoring: ${stageId}`);
  const roads=branches.map(nodes=>({width:kind==='wide-turn'||kind==='gathering'?4.1:3.4,points:nodes.map(i=>points[i])}));
  roads.push({width:2,points:[p7,operationPoint]});
  const discoveries=[{id:'carry',kind:'carry',itemKind:discovery[1],itemTitle:discovery[2],standKind:discovery[3],title:`A ${discovery[2]} for the entrance`,source:{x:points[8][0],z:points[8][1]},destination:{x:points[0][0],z:points[0][1]}},{id:'operate',kind:'operate',itemKind:discovery[4],title:discovery[5],source:{x:operationPoint[0],z:operationPoint[1]}}];
  const features=featureRows.find(row=>row[0]===stageId)[1];
  const missions=[...stage.missionIds,...stage.optionalMissionIds].map((missionId,i)=>({missionId,x:points[i+1][0],z:points[i+1][1]}));
  const trees=[];
  // Authored perimeter planting follows each branch and reserves the foreground
  // sightline. This is dressing, never an invisible route constraint.
  const planting=[[-27,-29],[-20,-30],[-10,-30],[0,-31],[11,-30],[22,-29],[28,-24],[-28,-20],[28,-13],[-28,-8],[28,-1],[-28,4],[28,9],[-27,15],[27,17],[-22,23],[22,24],[-10,26],[12,26],[-17,-9],[17,-9],[-8,2],[10,1],[-9,-9],[0,-1],[9,-1],[-9,8],[0,8],[9,8],[-1,-21],[12,-21]];
  planting.forEach(([x,z],i)=>{
    const shift=(stage.number%3-1)*.7; x+=shift; z+=(stage.number%4-1.5)*.4;
    if(nearRoad(roads,x,z)||Math.hypot(x-landmark[0],z-landmark[1])<7||!valid(x,z)||features.some(f=>['rock','cottage'].includes(f.kind)&&Math.hypot(x-f.x,z-f.z)<4*f.scale)) return;
    trees.push({x,z,scale:(kind==='grove'?1.15:kind==='ridge'||kind==='canyon'?.85:1)+i%3*.14,rotation:i*1.87+stage.number*.12});
  });
  const obstacles=trees.map(tree=>({kind:'tree',x:tree.x,z:tree.z,r:.72*tree.scale}));
  // Installation colliders come from the exact visible rounded props. A
  // blanket invisible circle would incorrectly block a mat or an empty site.
  const rocks=[[-25,-27],[25,-25],[-25,17],[25,19],[-25,-13],[25,-12]].filter(([x,z])=>!nearRoad(roads,x,z,2.8)).map(([x,z],i)=>({x,z,scale:.8+i%3*.2,rotation:i*1.4}));
  obstacles.push(...rocks.map(rock=>({kind:'rock',x:rock.x,z:rock.z,r:.75*rock.scale})));
  obstacles.push(...features.filter(f=>f.kind==='rock'||f.kind==='cottage'||f.kind==='hedge').map(f=>({kind:f.kind,x:f.x,z:f.z,r:(f.kind==='cottage'?3.95:f.kind==='rock'?1.5:.9)*f.scale})));
  const backdrop=Array.from({length:24},(_,i)=>{const angle=i*Math.PI/12+.07*stage.number,radius=47+i%3*3;return{x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,scale:1.35+i%4*.18,rotation:i*1.53};});
  return [stageId,{stageId,name:stage.name,worldId:stage.worldId,kind,bounds:{minX:-29,maxX:29,minZ:-32,maxZ:27},spawn:{x:points[0][0],z:points[0][1]},roads,missions,discoveries,features,backdrop,landmark:{x:landmark[0],z:landmark[1]},water:water||null,trees,rocks,obstacles}];
})));
export const getCampaignWorldLayout = stageId => CAMPAIGN_WORLD_LAYOUTS[stageId] || null;
export function campaignMissionPoint(stageId,missionId) {
  return getCampaignWorldLayout(stageId)?.missions.find(point=>point.missionId===missionId)||null;
}
export function campaignCanWalk(layout,x,z,radius=.48) {
  if(!layout||!Number.isFinite(x)||!Number.isFinite(z))return false;
  const b=layout.bounds;
  if(x<b.minX+radius||x>b.maxX-radius||z<b.minZ+radius||z>b.maxZ-radius)return false;
  if(layout.obstacles.some(o=>squared(x-o.x,z-o.z)<squared(o.r+radius,0)))return false;
  const onCrossing=(layout.crossings||[]).some(c=>x>=c.minX+radius&&x<=c.maxX-radius&&z>=c.minZ+radius&&z<=c.maxZ-radius);
  if(onCrossing)return true;
  const w=layout.water;
  if(w?.circle&&Math.hypot(x-w.circle[0],z-w.circle[1])<w.circle[2]+radius)return false;
  if(w?.axis){
    const cross=w.axis==='x'?x:z, along=w.axis==='x'?z:x;
    if(Math.abs(cross-w.at)<w.width/2+radius&&along>w.from-radius&&along<w.to+radius)return false;
  }
  return true;
}
export function campaignSegmentWalkable(layout,a,b,radius=.48) {
  const length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.ceil(length/.28);
  for(let i=0;i<=steps;i++)if(!campaignCanWalk(layout,a.x+(b.x-a.x)*i/(steps||1),a.z+(b.z-a.z)*i/(steps||1),radius))return false;
  return true;
}

// Round the authored corners inside their road clearance. The sampled centre
// and the terrain ribbon share these exact coordinates; no decorative curve
// may drift into the river or an impassable trunk.
export function campaignRoadSamples(road) {
  const out=[road.points[0]],append=to=>{const from=out[out.length-1],steps=Math.max(1,Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/.6));for(let i=1;i<=steps;i++)out.push([from[0]+(to[0]-from[0])*i/steps,from[1]+(to[1]-from[1])*i/steps]);};
  for(let i=1;i<road.points.length-1;i++){
    const a=road.points[i-1],b=road.points[i],c=road.points[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]),cut=Math.min(2,ab*.18,bc*.18);
    const entry=[b[0]+(a[0]-b[0])*cut/ab,b[1]+(a[1]-b[1])*cut/ab],exit=[b[0]+(c[0]-b[0])*cut/bc,b[1]+(c[1]-b[1])*cut/bc];
    append(entry);for(let j=1;j<=10;j++){const t=j/10;out.push([(1-t)**2*entry[0]+2*(1-t)*t*b[0]+t*t*exit[0],(1-t)**2*entry[1]+2*(1-t)*t*b[1]+t*t*exit[1]]);}
  }
  append(road.points[road.points.length-1]);return out;
}

// Road junctions are the preferred route. The bounded A* fallback handles a
// ground tap behind a real trunk/rock without steering forever into its face.
export function campaignRoute(layout,start,goal) {
  if(!campaignCanWalk(layout,start.x,start.z)||!campaignCanWalk(layout,goal.x,goal.z))return [];
  const nodes=[{...start},{...goal}],edges=new Map();
  const addPoint=p=>{const i=nodes.findIndex(n=>n.x===p[0]&&n.z===p[1]);if(i>=0)return i;nodes.push({x:p[0],z:p[1]});return nodes.length-1;};
  const connect=(a,b)=>{if(!campaignSegmentWalkable(layout,nodes[a],nodes[b]))return;(edges.get(a)||edges.set(a,[]).get(a)).push(b);(edges.get(b)||edges.set(b,[]).get(b)).push(a);};
  for(const road of layout.roads){const ids=road.points.map(addPoint);ids.slice(1).forEach((id,i)=>connect(ids[i],id));}
  for(let i=2;i<nodes.length;i++){connect(0,i);connect(1,i);}
  const d=Array(nodes.length).fill(Infinity),previous=[],open=new Set(nodes.map((_,i)=>i));d[0]=0;
  while(open.size){let current=-1;for(const i of open)if(current<0||d[i]<d[current])current=i;if(d[current]===Infinity)break;open.delete(current);if(current===1){const route=[];for(let at=1;at!==0;at=previous[at])route.unshift(nodes[at]);return route;}
    for(const next of edges.get(current)||[]){const cost=d[current]+Math.hypot(nodes[next].x-nodes[current].x,nodes[next].z-nodes[current].z);if(cost<d[next]){d[next]=cost;previous[next]=current;}}
  }
  const step=.8, width=Math.ceil((layout.bounds.maxX-layout.bounds.minX)/step)+1,height=Math.ceil((layout.bounds.maxZ-layout.bounds.minZ)/step)+1;
  const point=id=>({x:layout.bounds.minX+id%width*step,z:layout.bounds.minZ+Math.floor(id/width)*step});
  const closest=p=>{let best=-1,distance=Infinity;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const ix=Math.round((p.x-layout.bounds.minX)/step)+dx,iz=Math.round((p.z-layout.bounds.minZ)/step)+dz;if(ix<0||ix>=width||iz<0||iz>=height)continue;const id=iz*width+ix,candidate=point(id),dist=Math.hypot(candidate.x-p.x,candidate.z-p.z);if(dist<distance&&campaignSegmentWalkable(layout,p,candidate)){best=id;distance=dist;}}return best;};
  const from=closest(start),to=closest(goal);if(from<0||to<0)return [];
  const cost=new Map([[from,0]]),parents=new Map(),queue=new Set([from]);
  while(queue.size){let at=-1,best=Infinity;for(const id of queue){const p=point(id),score=cost.get(id)+Math.hypot(p.x-goal.x,p.z-goal.z);if(score<best){best=score;at=id;}}queue.delete(at);
    if(at===to){let path=[goal];for(let id=to;id!==from;id=parents.get(id))path.unshift(point(id));path.unshift(point(from));const smooth=[];let anchor=start;while(path.length){let index=path.length-1;while(index>0&&!campaignSegmentWalkable(layout,anchor,path[index]))index--;anchor=path[index];smooth.push(anchor);path=path.slice(index+1);}return smooth;}
    const col=at%width,row=Math.floor(at/width);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=col+dx,z=row+dz;if(x<0||x>=width||z<0||z>=height)continue;const id=z*width+x,p=point(id);if(!campaignSegmentWalkable(layout,point(at),p))continue;const next=cost.get(at)+Math.hypot(dx,dz)*step;if(next<(cost.get(id)??Infinity)){cost.set(id,next);parents.set(id,at);queue.add(id);}}
  }
  return [];
}
