import { SOUND_SEEKERS_ROUNDED_PALETTE } from '../visual/visualTokens.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRenderer, disposeRenderer } from '../../../components/learn/games/shared/threeShell.js';
import { getCampaignStage, getCampaignMission } from '../v3/content/campaign.js';
import { getCampaignWorldLayout, CAMPAIGN_WORLD_THEMES, campaignTerrainHeight, campaignCanWalk, campaignRoute, segmentDistance, campaignRoadSamples } from './campaignWorldLayouts.js';
import { CAMPAIGN_ROUNDED_RESTORATIONS, getRoundedCampaignRestoration } from './campaignRestorations.js';

const V = THREE.Vector3;
export const ROUNDED_CAMPAIGN_PROP_KINDS = Object.freeze('apple bag bank basket beam bed bench blanket boat book bread bridge brush bucket camp card cart cloth cover crate cup cushion dock dome egg feather fern flag flower frame garden gate gem handle hedge ladder lantern ledge letter lever lily mat nest paint parcel path pillow plank plate pond post pot raft rail ramp reed reflector rock roof room root rope scroll seat seed shelf shell sign soap stair stick stone tool towel tray tree wheel window'.split(' '));
const solidKinds = new Set('basket bed bench boat bucket camp cart crate dome egg frame garden gate hedge ladder lantern ledge nest parcel post pot reflector rock roof room seat shelf stone tree wheel'.split(' '));
const standingScale = new Set(['post','roof','room','tree','dome','shelf','gate','frame','ladder','stair']);
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

// These pure helpers are shared with traversal tests. Movement integrates real
// visible collider bounds; a blocked destination cannot move Bouncy or complete
// a literacy task. Sliding follows an unobstructed axis rather than teleporting.
function canStep(layout,player,x,z) {
  if(campaignCanWalk(layout,x,z))return true;
  // A newly installed object may surround a stationary explorer. Permit only
  // outward escape from that overlap, with every other collider still active.
  const obstacles=layout.obstacles.filter(o=>{const old=Math.hypot(player.x-o.x,player.z-o.z),next=Math.hypot(x-o.x,z-o.z);return old>=o.r+.48||next<=old;});
  return obstacles.length<layout.obstacles.length&&campaignCanWalk({...layout,obstacles},x,z);
}
export function campaignStepPlayer(layout,player,input,dt) {
  const length=Math.hypot(input.x,input.z),speed=input.run?7:4.6;
  const dx=length?input.x/Math.max(1,length)*speed:0,dz=length?input.z/Math.max(1,length)*speed:0;
  const damping=1-Math.exp(-dt*18);
  player.vx+=(dx-player.vx)*damping;player.vz+=(dz-player.vz)*damping;
  const steps=Math.max(1,Math.ceil(Math.hypot(player.vx,player.vz)*dt/.12));
  for(let i=0;i<steps;i++) {
    const nx=player.x+player.vx*dt/steps,nz=player.z+player.vz*dt/steps;
    if(canStep(layout,player,nx,nz)){player.x=nx;player.z=nz;}
    else {
      if(canStep(layout,player,nx,player.z))player.x=nx;else player.vx=0;
      if(canStep(layout,player,player.x,nz))player.z=nz;else player.vz=0;
    }
  }
  return player;
}
export function campaignNearMission(layout,player,available=[],completed=[]) {
  const availableIds=new Set(available),done=new Set(completed);
  return layout.missions.filter(p=>availableIds.has(p.missionId)&&!done.has(p.missionId))
    .map(p=>({...p,distance:Math.hypot(p.x-player.x,p.z-player.z)}))
    .filter(p=>p.distance<=2.6).sort((a,b)=>a.distance-b.distance)[0]?.missionId||null;
}
export function campaignNearbyWorldInteraction(layout,player,state={}) {
  const done=new Set(state.discoveredIds||[]),candidates=[];
  for(const discovery of layout.discoveries){
    if(discovery.kind==='carry'&&done.has(discovery.id))continue;
    const delivery=discovery.kind==='carry'&&state.carrying===discovery.id;
    const point=delivery?discovery.destination:discovery.source;
    const distance=Math.hypot(player.x-point.x,player.z-point.z);
    if(distance>2.6)continue;
    const action=discovery.kind==='operate'?'operate':delivery?'place':'pickup';
    candidates.push({id:discovery.id,action,title:discovery.title,prompt:action==='operate'?discovery.title:action==='place'?`Place the ${discovery.itemTitle}`:`Carry the ${discovery.itemTitle}`,distance});
  }
  return candidates.sort((a,b)=>a.distance-b.distance)[0]||null;
}
export function campaignRestoreWorldInventory(layout,previous={},saved={}) {
  const discoveredIds=Array.from(new Set(saved.discoveredIds??previous.discoveredIds??[])).filter(id=>layout.discoveries.some(d=>d.id===id));
  const candidate=saved.carryingId===undefined?previous.carrying:saved.carryingId;
  const carrying=layout.discoveries.some(d=>d.id===candidate&&d.kind==='carry')&&!discoveredIds.includes(candidate)?candidate:null;
  const newlyRestored=discoveredIds.includes('operate')&&!(previous.discoveredIds||[]).includes('operate');
  return {discoveredIds,carrying,operated:discoveredIds.includes('operate')&&(newlyRestored||!!previous.operated)};
}
export function campaignUseWorldObject(layout,player,state={}) {
  const interaction=campaignNearbyWorldInteraction(layout,player,state);
  if(!interaction)return {accepted:false,state};
  const known=new Set(state.discoveredIds||[]),before=known.has(interaction.id);
  const next={discoveredIds:[...known],carrying:state.carrying||null,operated:!!state.operated};
  if(interaction.action==='pickup')next.carrying=interaction.id;
  else if(interaction.action==='place'){next.carrying=null;known.add(interaction.id);}
  else {next.operated=!next.operated;known.add(interaction.id);}
  next.discoveredIds=[...known];
  return {accepted:true,state:next,interaction,discovery:!before&&known.has(interaction.id)?{stageId:layout.stageId,id:interaction.id,kind:interaction.action==='operate'?'operate':'carry'}:null};
}
export function campaignEncounterProps(layout,completed=[]) {
  const done=new Set(completed),plan=CAMPAIGN_ROUNDED_RESTORATIONS[layout.stageId];
  return plan.jobs.flatMap(job=>{
    if(done.has(job.missionId))return [];
    const point=layout.missions.find(p=>p.missionId===job.missionId);
    return job.before.map((p,index)=>{
      let place=null;
      for(const radius of [2.9,3.6,4.5])for(let i=0;i<16&&!place;i++){
        const angle=(i+index*3)*Math.PI/8,x=point.x+Math.cos(angle)*radius,z=point.z+Math.sin(angle)*radius;
        if(!campaignCanWalk(layout,x,z,.8)||Math.hypot(x-layout.landmark.x,z-layout.landmark.z)<3.5)continue;
        if(layout.roads.some(r=>r.points.slice(1).some((b,j)=>segmentDistance(x,z,r.points[j],b)<r.width/2+.8)))continue;
        place={x,z};
      }
      if(!place)throw new Error(`Recovery supply needs a clear verge: ${job.missionId}`);
      return {...p,...place,lift:Math.min(.2,p.lift),missionId:job.missionId,installed:false};
    });
  });
}

export function campaignPropCollision(prop,landmark) {
  if(!solidKinds.has(prop.kind)||prop.lift>1.7||(prop.kind==='lantern'&&prop.lift>=1))return null;
  const size=prop.size*(standingScale.has(prop.kind)?1:.85);
  // Raised furniture has a visible footprint; flat blankets, ropes, planks and
  // installed crossings are walkable. Tiny recovered supplies remain scenery.
  const radius=prop.kind==='tree'?size*.3:prop.kind==='post'?size*(prop.variant==='beacon-tower'?.44:.08):prop.kind==='shelf'?size*.45:size*.42;
  if(radius<.28)return null;
  return {kind:prop.kind,x:landmark.x+prop.x,z:landmark.z+prop.z,r:radius};
}
export function campaignCollisionLayout(layout,completed=[],low=false) {
  const state=getRoundedCampaignRestoration(layout.stageId,completed);
  const trees=low?layout.trees.filter((_,i)=>i%3===0):layout.trees;
  const obstacles=layout.obstacles.filter(o=>o.kind!=='tree'||trees.some(t=>t.x===o.x&&t.z===o.z));
  obstacles.push(...state.props.filter(p=>!p.missionId||p.installed).map(p=>campaignPropCollision(p,layout.landmark)).filter(Boolean));
  obstacles.push(...campaignEncounterProps(layout,completed).map(p=>campaignPropCollision(p,{x:0,z:0})).filter(Boolean));
  const crossings=state.props.filter(p=>p.installed&&['bridge','dock','raft','path'].includes(p.kind)).map(p=>({
    minX:layout.landmark.x+p.x-p.size*(p.kind==='path'?1:1.28),maxX:layout.landmark.x+p.x+p.size*(p.kind==='path'?1:1.28),
    minZ:layout.landmark.z+p.z-p.size*(p.kind==='path'?.35:.75),maxZ:layout.landmark.z+p.z+p.size*(p.kind==='path'?.35:.75),
    height:campaignTerrainHeight(layout,layout.landmark.x,layout.landmark.z)+p.lift+p.size*(p.kind==='path'?.085:.23)
  }));
  return {...layout,obstacles,crossings};
}
export function campaignWalkHeight(layout,x,z) {
  const ground=campaignTerrainHeight(layout,x,z);
  const deck=(layout.crossings||[]).filter(c=>x>=c.minX&&x<=c.maxX&&z>=c.minZ&&z<=c.maxZ).map(c=>c.height);
  return Math.max(ground,...deck);
}

function ownsResources() {
  const geometries=new Set(),materials=new Set(),textures=new Set(),tints=new Map();
  const remember=root=>root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  return {geometries,materials,tints,remember,rememberTexture:texture=>textures.add(texture),dispose(){textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());textures.clear();materials.clear();geometries.clear();tints.clear();}};
}
function makeFurniture(theme,resources) {
  const colors={wood:theme.wood,cream:theme.cream,sage:theme.leaf,rose:theme.flower,gold:SOUND_SEEKERS_ROUNDED_PALETTE['e8b76e'],soil:theme.soil,rock:theme.rock,water:theme.water,white:SOUND_SEEKERS_ROUNDED_PALETTE['fff8e5'],dark:SOUND_SEEKERS_ROUNDED_PALETTE['615f5b']};
  const mats=Object.fromEntries(Object.entries(colors).map(([id,color])=>{const m=new THREE.MeshStandardMaterial({color,roughness:.88});resources.materials.add(m);return[id,m];}));
  mats.glow=new THREE.MeshStandardMaterial({color:theme.cream,emissive:theme.light,emissiveIntensity:.6,roughness:.5});resources.materials.add(mats.glow);
  const sphere=new THREE.SphereGeometry(1,16,12),cylinder=new THREE.CylinderGeometry(1,1,1,14),torus=new THREE.TorusGeometry(1,.09,8,24),box=new THREE.BoxGeometry(1,1,1);
  [sphere,cylinder,torus,box].forEach(g=>resources.geometries.add(g));
  function mesh(parent,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,mats[m]||m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const oval=(p,x,y,z,sx,sy,sz,m)=>mesh(p,sphere,m,x,y,z,sx,sy,sz);
  const plank=(p,x,y,z,sx,sy,sz,m='wood')=>oval(p,x,y,z,sx,sy,sz,m);
  const pole=(p,x,y,z,h=.8,r=.08,m='wood')=>mesh(p,cylinder,m,x,y+h/2,z,r,h,r);
  function ring(parent,x,y,z,r,m='cream',vertical=false){const o=mesh(parent,torus,m,x,y,z,r,r,r);if(!vertical)o.rotation.x=Math.PI/2;return o;}
  function curve(parent,points,r=.06,m='cream') {const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new V(...p))),20,r,7,false);resources.geometries.add(g);g.userData.transient=true;return mesh(parent,g,m);}
  function container(parent,wide=.58,height=.62,color='wood') {
    const profile=[[0,0],[wide*.6,.03],[wide,.16],[wide*.95,height],[wide*.8,height],[wide*.78,.17],[0,.11]].map(p=>new THREE.Vector2(...p));
    const g=new THREE.LatheGeometry(profile,20);resources.geometries.add(g);g.userData.transient=true;mesh(parent,g,color);ring(parent,0,height,0,wide*.89,'cream');
  }
  function basket(parent){container(parent);curve(parent,[[-.52,.55,0],[-.38,1.04,0],[.38,1.04,0],[.52,.55,0]]);}
  function flower(parent,x=0,z=0){pole(parent,x,.05,z,.5,.028,'sage');for(let i=0;i<5;i++){const a=i*Math.PI*2/5;oval(parent,x+Math.cos(a)*.13,.58,z+Math.sin(a)*.13,.16,.05,.12,'rose');}oval(parent,x,.6,z,.08,.06,.08,'gold');}
  function frame(parent,width=1.5,height=1.6){pole(parent,-width/2,0,0,height);pole(parent,width/2,0,0,height);plank(parent,0,height,0,width/2+.12,.08,.11);}
  function sign(parent,direction){pole(parent,0,0,0,.95);plank(parent,0,.85,0,.66,.22,.08,'cream');const dir=direction==='left'?-1:1;const arrow=new THREE.Shape();arrow.moveTo(-.3*dir,-.035);arrow.lineTo(.2*dir,-.035);arrow.lineTo(.2*dir,-.13);arrow.lineTo(.43*dir,0);arrow.lineTo(.2*dir,.13);arrow.lineTo(.2*dir,.035);arrow.lineTo(-.3*dir,.035);arrow.closePath();const g=new THREE.ShapeGeometry(arrow);resources.geometries.add(g);g.userData.transient=true;const o=mesh(parent,g,'sage',0,.85,.087);return o;}
  function bridge(parent,length=2.26,rails=true){for(let i=0;i<12;i++)plank(parent,(i/11-.5)*length,.16,0,.15,.07,.75);if(rails){for(const z of [-.68,.68]){for(const x of [-length/2,length/2])pole(parent,x,.15,z,.62,.05);curve(parent,[[-length/2,.74,z],[0,.66,z],[length/2,.74,z]],.035,'cream');}}}
  function shelf(parent){frame(parent,1.65,1.85);for(const y of [.35,1,1.75])plank(parent,0,y,0,.88,.07,.3);}
  function roof(parent){const points=[new THREE.Vector2(0,.82),new THREE.Vector2(.1,.81),new THREE.Vector2(1,.15),new THREE.Vector2(1.05,0),new THREE.Vector2(.95,0),new THREE.Vector2(0,.72)];const g=new THREE.LatheGeometry(points,4);resources.geometries.add(g);g.userData.transient=true;const o=mesh(parent,g,'sage');o.rotation.y=Math.PI/4;o.scale.set(1,.75,1.25);}
  function crate(parent){for(const z of [-.38,.38])for(const y of [.16,.4,.64])plank(parent,0,y,z,.48,.095,.04);for(const x of [-.42,.42])for(const y of [.16,.4,.64])plank(parent,x,y,0,.04,.095,.4);plank(parent,0,.08,0,.5,.05,.42);}
  function page(parent,kind){mesh(parent,box,'cream',0,.13,0,.75,.025,.52);if(kind==='letter'){curve(parent,[[-.36,.15,-.24],[0,.15,.1],[.36,.15,-.24]],.018,'wood');}else for(let i=0;i<3;i++)plank(parent,0,.155,-.16+i*.12,.24,.008,.012,'wood');}
  function wheel(parent,turned=false){const rotor=new THREE.Group();rotor.position.y=.65;rotor.rotation.x=turned?.44:0;parent.add(rotor);const t=ring(rotor,0,0,0,.53,'wood',true);t.rotation.y=Math.PI/2;for(let i=0;i<6;i++){const a=i*Math.PI/3;curve(rotor,[[0,0,0],[0,Math.sin(a)*.52,Math.cos(a)*.52]],.05,'cream');}oval(rotor,0,.43,0,.06,.07,.08,'rose');pole(parent,0,0,0,.7,.09);}
  function stairs(parent){for(let i=0;i<6;i++)plank(parent,(i-2.5)*.25,.12+i*.14,0,.2,.11,.56,'rock');}
  function prop(desc,assets) {
    if(!ROUNDED_CAMPAIGN_PROP_KINDS.includes(desc.kind))throw new Error(`Unauthored rounded prop: ${desc.kind}`);
    const g=new THREE.Group(),kind=desc.kind,s=desc.size;
    // Each noun has its own readable construction. Residents are exclusively
    // the approved character assets, never any of this scenery geometry.
    switch(kind) {
      case 'tree': {const tree=assets.tree.scene.clone(true);tree.scale.setScalar(.38);g.add(tree);break;}
      case 'rock': case 'stone': case 'ledge': case 'bank': oval(g,0,kind==='ledge'?.28:.17,0,.65,kind==='ledge'?.3:.24,.55,'rock');break;
      case 'pond': oval(g,0,.035,0,.95,.025,.5,'water');break;
      case 'bucket': case 'paint': case 'pot': case 'cup': container(g,kind==='cup'?.33:.5,kind==='pot'?.58:.68,kind==='bucket'?'sage':kind==='paint'?'rose':'cream');if(kind==='bucket'){curve(g,[[-.44,.58,0],[-.32,1,0],[.32,1,0],[.44,.58,0]],.035,'wood');if(desc.filled)oval(g,0,.55,0,.35,.025,.35,'water');}if(kind==='cup')curve(g,[[.25,.58,0],[.54,.54,0],[.54,.25,0],[.25,.25,0]],.045,'wood');break;
      case 'basket': basket(g);if(desc.accessory==='carrot'){oval(g,0,.63,0,.18,.1,.34,'gold');for(let i=0;i<3;i++)oval(g,-.1+i*.1,.8,-.13,.06,.25,.07,'sage');}if(desc.accessory==='apple')oval(g,0,.63,0,.25,.23,.25,'rose');if(desc.accessory==='blanket')plank(g,0,.68,0,.4,.08,.3,'rose');break;
      case 'tray': case 'plate': ring(g,0,.1,0,.53,'cream');oval(g,0,.06,0,.55,.03,.4,'cream');break;
      case 'soap': oval(g,0,.1,0,.48,.11,.27,'cream');ring(g,0,.19,0,.18,'gold');break;
      case 'mat': case 'blanket': case 'cloth': case 'towel': case 'cover': plank(g,0,.06,0,.63,.045,.47,kind==='towel'?'cream':'rose');for(let i=-2;i<=2;i++)plank(g,i*.2,.105,0,.022,.01,.44,'cream');break;
      case 'pillow': case 'cushion': oval(g,0,.16,0,.58,.16,.38,'cream');break;
      case 'rail': frame(g,1.6,.8);plank(g,0,.4,0,.8,.04,.04);break;
      case 'post': if(desc.variant==='beacon-tower'){pole(g,0,0,0,.68,.38,'cream');ring(g,0,.7,0,.44,'wood');for(const x of [-.27,.27])for(const z of [-.27,.27])pole(g,x,.7,z,.4,.027);plank(g,0,.21,.38,.12,.21,.025,'wood');break;}pole(g,0,0,0,1.25,.08,desc.worldId==='meadow'?'sage':desc.worldId==='dino'?'gold':desc.worldId==='moonwood'?'rose':'wood');break;
      case 'rope': curve(g,[[-.5,.1,0],[-.3,.5,0],[.25,.7,0],[.55,.15,0]],.035,'cream');break;
      case 'beam': case 'plank': case 'stick': case 'root': plank(g,0,.12,0,.68,kind==='root'?.15:.08,.11,'wood');if(kind==='root')curve(g,[[-.6,.1,0],[-.3,.3,.12],[.1,.1,.06],[.6,.12,-.1]],.13,'wood');break;
      case 'path': for(let i=-3;i<=3;i++)oval(g,i*.28,.04,0,.16,.045,.35,'cream');break;
      case 'bridge': case 'dock': case 'raft': bridge(g,2.26,kind==='bridge');break;
      case 'ramp': bridge(g,1.5,false);g.rotation.z=.14;break;
      case 'gate': frame(g,1.7,1.1);for(const dir of [-1,1]){const wing=new THREE.Group();wing.position.set(dir*.82,0,0);wing.rotation.y=desc.open?dir*Math.PI*.43:0;g.add(wing);for(const y of [.35,.7])plank(wing,-dir*.38,y,0,.38,.065,.07);pole(wing,-dir*.74,.15,0,.75,.065);}break;
      case 'bed': case 'bench': case 'seat': plank(g,0,kind==='bed'?.35:.65,0,.8,.1,.45);for(const x of [-.6,.6])for(const z of [-.3,.3])pole(g,x,0,z,kind==='bed'?.38:.65);if(kind==='bed')plank(g,-.65,.5,0,.1,.35,.46);break;
      case 'roof': roof(g);break;
      case 'room': frame(g,1.6,.7);plank(g,0,.15,0,.9,.1,.7,'rock');for(const x of [-.8,.8])plank(g,x,.38,0,.08,.26,.55,'rock');break;
      case 'dome': {const geo=new THREE.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI/2);resources.geometries.add(geo);mesh(g,geo,'sage',0,.1,0,1,.7,1);ring(g,0,.12,0,1,'cream');break;}
      case 'frame': frame(g,1.2,1.2);curve(g,[[-.5,1.2,0],[0,1.65,0],[.5,1.2,0]],.05,'cream');break;
      case 'window': ring(g,0,.5,0,.46,'cream',true);oval(g,0,.5,0,.4,.4,.02,'water');plank(g,0,.5,.025,.035,.42,.035);plank(g,0,.5,.025,.42,.035,.035);break;
      case 'ladder': for(const x of [-.28,.28])pole(g,x,0,0,1.8,.05);for(let i=0;i<7;i++)plank(g,0,.12+i*.25,0,.32,.04,.06);g.rotation.x=-.15;break;
      case 'stair': stairs(g);break;
      case 'shelf': shelf(g);break;
      case 'sign': sign(g,desc.direction);if(desc.turned)g.rotation.y=.85;break;
      case 'egg': oval(g,0,.35,0,.23,.35,.23,'cream');break;
      case 'nest': for(let i=0;i<6;i++){const t=ring(g,0,.08+i*.055,0,.53+i*.025,'wood');t.rotation.z=(i%2-.5)*.06;}oval(g,0,.08,0,.43,.035,.43,'soil');break;
      case 'feather': oval(g,0,.05,0,.14,.025,.48,'cream');curve(g,[[0,.08,-.4],[0,.08,.4]],.015,'wood');break;
      case 'fern': case 'reed': case 'hedge': for(let i=0;i<7;i++){const a=i*Math.PI*2/7;pole(g,Math.cos(a)*.3,0,Math.sin(a)*.3,kind==='reed'?1.4:.4,.027,'sage');const leaf=oval(g,Math.cos(a)*.3,.4,Math.sin(a)*.3,.17,kind==='reed'?.55:.3,.12,'sage');leaf.rotation.z=Math.cos(a)*.5;}if(kind==='hedge')for(let i=-1;i<=1;i++)oval(g,i*.45,.45,0,.52,.45,.42,'sage');break;
      case 'lily': oval(g,0,.04,0,.6,.025,.5,'sage');flower(g);break;
      case 'flower': flower(g);break;
      case 'garden': oval(g,0,.06,0,.8,.065,.6,'soil');for(let i=0;i<4;i++)flower(g,(i%2-.5)*.6,(Math.floor(i/2)-.5)*.5);break;
      case 'seed': oval(g,0,.06,0,.12,.07,.2,'gold');break;
      case 'apple': oval(g,0,.25,0,.25,.25,.26,'rose');pole(g,0,.46,0,.12,.025);oval(g,.08,.53,0,.13,.03,.06,'sage');break;
      case 'bread': oval(g,0,.17,0,.48,.18,.25,'gold');for(let i=-1;i<=1;i++)plank(g,i*.2,.33,0,.025,.012,.13,'cream');break;
      case 'parcel': mesh(g,box,'cream',0,.35,0,.78,.65,.58);plank(g,0,.69,0,.05,.018,.3,'rose');plank(g,0,.69,0,.4,.018,.04,'rose');break;
      case 'crate': crate(g);break;
      case 'bag': oval(g,0,.33,0,.4,.34,.32,'cream');ring(g,0,.62,0,.23,'wood');break;
      case 'cart': crate(g);for(const x of [-.5,.5])for(const z of [-.35,.35]){const t=ring(g,x,.13,z,.18,'wood',true);t.rotation.y=Math.PI/2;}curve(g,[[-.45,.7,0],[-.85,.62,0],[-1.1,.48,0]],.05,'wood');break;
      case 'boat': oval(g,0,.17,0,.95,.24,.38,'wood');oval(g,0,.33,0,.7,.09,.25,'cream');plank(g,0,.4,0,.08,.035,.45);break;
      case 'letter': case 'card': page(g,kind);break;
      case 'scroll': page(g,kind);for(const x of [-.4,.4]){const c=mesh(g,cylinder,'cream',x,.16,0,.07,.53,.07);c.rotation.x=Math.PI/2;}break;
      case 'book': mesh(g,box,'sage',0,.16,0,.7,.12,.55);mesh(g,box,'cream',0,.23,0,.62,.05,.48);break;
      case 'brush': case 'tool': plank(g,0,.08,0,.07,.06,.36,'wood');oval(g,0,.08,-.35,kind==='brush'?.2:.26,.06,.15,kind==='brush'?'cream':'rock');break;
      case 'handle': curve(g,[[-.25,.15,0],[-.25,.45,0],[.25,.45,0],[.25,.15,0]],.055,'wood');break;
      case 'lever': oval(g,0,.12,0,.32,.12,.3,'rock');curve(g,[[0,.15,0],[.3,.8,0]],.055,'wood');oval(g,.3,.8,0,.13,.1,.1,'gold');break;
      case 'wheel': wheel(g,desc.turned);break;
      case 'flag': pole(g,0,0,0,1.55,.04);plank(g,.24,1.25,0,.27,.18,.035,'rose');break;
      case 'lantern': pole(g,0,0,0,.65,.055);oval(g,0,.8,0,.25,.33,.25,desc.lit===false?'cream':desc.lit||desc.installed?'glow':'cream');ring(g,0,.51,0,.25,'wood');ring(g,0,1.08,0,.25,'wood');break;
      case 'reflector': if(desc.turned)g.rotation.y=.85;pole(g,0,0,0,.75);ring(g,0,.9,0,.45,'wood',true);oval(g,0,.9,0,.4,.4,.04,'white');break;
      case 'shell': for(let i=0;i<7;i++){const a=(i/6-.5)*Math.PI*.7;const leaf=oval(g,Math.sin(a)*.18,.12,Math.cos(a)*.2,.12,.08,.4,'cream');leaf.rotation.y=a;}break;
      case 'gem': {const geo=new THREE.OctahedronGeometry(.4);resources.geometries.add(geo);mesh(g,geo,'water',0,.4,0);break;}
      case 'camp': frame(g,1.2,.8);roof(g);plank(g,0,.08,0,.65,.05,.5,'rose');break;
      default: throw new Error(`Missing rounded construction: ${kind}`);
    }
    g.position.set(desc.x,desc.lift,desc.z);g.scale.setScalar(s);
    return g;
  }
  return {prop,mats,oval,pole,flower};
}
// Batch static, tactile furniture by its actual material. All authored repairs
// remain present in the low tier; batching trims submission work, not content.
function batchFurniture(group,resources) {
  group.updateMatrixWorld(true);const byMaterial=new Map();
  group.traverse(o=>{if(!o.isMesh)return;const list=byMaterial.get(o.material)||[];list.push(o.geometry.clone().applyMatrix4(o.matrixWorld));byMaterial.set(o.material,list);});
  const result=new THREE.Group();
  for(const [material,geometries] of byMaterial){const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geometry)throw new Error('Rounded furniture could not be assembled');resources.geometries.add(geometry);const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;result.add(mesh);}
  const transient=new Set();group.traverse(o=>{if(o.geometry?.userData.transient)transient.add(o.geometry);});transient.forEach(g=>{g.dispose();resources.geometries.delete(g);});
  return result;
}
function sceneryHeight(layout,x,z) {
  const b=layout.bounds,outside=Math.max(0,b.minX-x,x-b.maxX,b.minZ-z,z-b.maxZ);
  return campaignTerrainHeight(layout,x,z)+outside*.055*(1+Math.sin(x*.09));
}
function terrainGeometry(layout,theme) {
  const g=new THREE.PlaneGeometry(240,240,160,160);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[],soil=new THREE.Color(theme.soil),grass=new THREE.Color(theme.grass);
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),w=layout.water;const wet=w?.circle?Math.hypot(x-w.circle[0],z-w.circle[1])<w.circle[2]:w?.axis&&Math.abs((w.axis==='x'?x:z)-w.at)<w.width/2&&(w.axis==='x'?z:x)>w.from&&(w.axis==='x'?z:x)<w.to;p.setY(i,sceneryHeight(layout,x,z)-(wet?(layout.kind==='canyon'?2.3:.48):0));const n=(Math.sin(x*.32)+Math.cos(z*.23+x*.12)+2)/4,c=soil.clone().lerp(grass,.28+n*.6);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
function roadGeometry(layout,road) {
  const points=campaignRoadSamples(road),positions=[],indices=[];
  for(let i=0;i<points.length;i++){
    const previous=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],distance=Math.hypot(next[0]-previous[0],next[1]-previous[1])||1,nx=-(next[1]-previous[1])/distance*road.width/2,nz=(next[0]-previous[0])/distance*road.width/2,[x,z]=points[i];
    for(const dir of [1,-1]){const px=x+nx*dir,pz=z+nz*dir;positions.push(px,campaignTerrainHeight(layout,px,pz)+.04,pz);}
    if(i<points.length-1){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function groundTexture(resources) {
  const size=64,data=new Uint8Array(size*size*4);let seed=541;
  for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=205+seed%51;data.set([value,value,value,255],i*4);}
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(44,44);texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;resources.rememberTexture(texture);return texture;
}

function instanceAsset(asset,placements,scene,resources,theme,tint=false,shadows=true) {
  asset.scene.updateMatrixWorld(true);const result=new THREE.Group(),matrix=new THREE.Matrix4(),pose=new THREE.Object3D();
  asset.scene.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh)return;let material=o.material;if(tint){const source=material;material=resources.tints.get(source);if(!material){material=source.clone();material.color.multiply(new THREE.Color(theme.worldId==='dino'?SOUND_SEEKERS_ROUNDED_PALETTE['eddbb7']:theme.worldId==='moonwood'?SOUND_SEEKERS_ROUNDED_PALETTE['bfd6e6']:SOUND_SEEKERS_ROUNDED_PALETTE['ffffff']));resources.tints.set(source,material);resources.materials.add(material);}}const mesh=new THREE.InstancedMesh(o.geometry,material,placements.length);placements.forEach((p,i)=>{pose.position.set(p.x,sceneryHeight(theme.layout,p.x,p.z),p.z);pose.scale.setScalar(p.scale||1);pose.rotation.set(0,p.rotation||0,0);pose.updateMatrix();matrix.multiplyMatrices(pose.matrix,o.matrixWorld);mesh.setMatrixAt(i,matrix);});mesh.castShadow=shadows;mesh.receiveShadow=shadows;mesh.computeBoundingSphere();result.add(mesh);});scene.add(result);return result;
}

/** Rounded presentation for the canonical campaign; no movement/evidence writes. */
export async function createCampaignWorld(host,callbacks={},settings={}) {
  const layout=getCampaignWorldLayout(settings.stageId),stage=getCampaignStage(settings.stageId);
  if(!layout||!stage)throw new Error(`Unknown campaign place: ${settings.stageId}`);
  if(typeof settings.assetUrl!=='function')throw new Error('Approved rounded asset resolver is required');
  let disposed=false,failed=false,phase='title',paused=true,reduced=!!settings.reduced,low=!!settings.low,dirty=true,frame=0,last=0,acc=0,snapshotTime=0,drawTime=0,renderedFrames=0,frameAverage=16.7,completed=[],available=[],focusMissionId=null,repairKey='';
  const loadingController=new AbortController();
  const resources=ownsResources(),scene=new THREE.Scene(),theme=CAMPAIGN_WORLD_THEMES[layout.worldId],camera=new THREE.PerspectiveCamera(43,1,.1,140);
  camera.position.set(27,35,38);camera.lookAt(0,1,-3);
  scene.background=new THREE.Color(theme.sky);scene.fog=new THREE.Fog(theme.fog,35,95);
  let renderer;
  try {renderer=createRenderer(THREE,{pixelRatioCap:low?1:1.5,toneMappingExposure:1.13,shadowMap:!low,powerPreference:'high-performance'});}catch(error){callbacks.failure?.(error);throw error;}
  const canvas=renderer.domElement;canvas.tabIndex=-1;canvas.setAttribute('aria-label',`Walk through ${stage.name}. Arrow keys move; choose a nearby reading mission.`);host.append(canvas);
  const sun=new THREE.DirectionalLight(theme.light,2.2);sun.position.set(-16,29,13);sun.castShadow=!low;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-37;sun.shadow.camera.right=37;sun.shadow.camera.top=37;sun.shadow.camera.bottom=-37;sun.shadow.camera.far=90;sun.shadow.normalBias=.07;scene.add(sun);
  scene.add(new THREE.HemisphereLight(theme.fill,theme.ambient,2.1));
  const terrainMat=new THREE.MeshStandardMaterial({vertexColors:true,map:groundTexture(resources),roughness:1}),roadMat=new THREE.MeshStandardMaterial({color:theme.road,roughness:1}),waterMat=new THREE.MeshStandardMaterial({color:theme.water,roughness:.48,metalness:.06});
  [terrainMat,roadMat,waterMat].forEach(m=>resources.materials.add(m));
  const ground=new THREE.Mesh(terrainGeometry(layout,theme),terrainMat);ground.receiveShadow=true;scene.add(ground);resources.geometries.add(ground.geometry);
  for(const road of layout.roads){const mesh=new THREE.Mesh(roadGeometry(layout,road),roadMat);mesh.receiveShadow=true;resources.geometries.add(mesh.geometry);scene.add(mesh);}
  const w=layout.water;
  if(w){const geometry=w.circle?new THREE.CircleGeometry(w.circle[2],40):new THREE.PlaneGeometry(w.width,w.to-w.from,1,24);geometry.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geometry,waterMat),x=w.circle?.[0]??(w.axis==='x'?w.at:(w.from+w.to)/2),z=w.circle?.[1]??(w.axis==='x'?(w.from+w.to)/2:w.at);if(w.axis==='z')geometry.rotateY(Math.PI/2);const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,campaignTerrainHeight(layout,x+p.getX(i),z+p.getZ(i))-(layout.kind==='canyon'?1.95:.05));geometry.computeVertexNormals();mesh.position.set(x,0,z);scene.add(mesh);resources.geometries.add(geometry);}
  const furniture=makeFurniture(theme,resources),markerGroup=new THREE.Group(),markerMeshes=new Map();scene.add(markerGroup);
  for(const p of layout.missions){const marker=new THREE.Group(),ringGeometry=new THREE.TorusGeometry(.72,.045,8,32);resources.geometries.add(ringGeometry);const ring=new THREE.Mesh(ringGeometry,furniture.mats.glow);ring.rotation.x=Math.PI/2;ring.position.y=.1;marker.add(ring);furniture.pole(marker,0,.1,0,.7,.04,'cream');furniture.oval(marker,0,1,0,.16,.2,.16,'gold');marker.position.set(p.x,campaignTerrainHeight(layout,p.x,p.z),p.z);markerGroup.add(marker);markerMeshes.set(p.missionId,marker);}
  const clickGeometry=new THREE.TorusGeometry(.35,.028,6,24);resources.geometries.add(clickGeometry);const clickRing=new THREE.Mesh(clickGeometry,furniture.mats.glow);clickRing.rotation.x=Math.PI/2;clickRing.visible=false;scene.add(clickRing);
  const player={...layout.spawn,vx:0,vz:0},input={x:0,z:0,run:false},look=new V(),cameraTarget=new V(),lookTarget=new V(),projected=new V(),forward=new V(),right=new V(),destinationHit=new V(),pointer=new THREE.Vector2(),ray=new THREE.Raycaster();
  look.set(0,1,-3);
  let discoveryState={discoveredIds:[],carrying:null,operated:false};
  let discoveryGroup=null,carriedObject=null,encounterGroup=null;
  let destination=null,routeQueue=[],hero=null,mixer=null,actionName='',actions={},residents=[],restorationGroup=null,treesGroup=null,decorGroup=null,assets=null,collisionLayout=campaignCollisionLayout(layout,completed,low);
  function clearInstances(group){group?.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
  function cleanup(){if(disposed)return;disposed=true;loadingController.abort();cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',onGround);canvas.removeEventListener('webglcontextlost',lost);settings.signal?.removeEventListener('abort',cleanup);mixer?.stopAllAction();residents.forEach(r=>r.mixer.stopAllAction());clearInstances(treesGroup);clearInstances(decorGroup);resources.dispose();scene.clear();disposeRenderer(renderer,{forceContextLoss:true});}
  function stopped(){input.x=input.z=0;player.vx=player.vz=0;destination=null;routeQueue=[];acc=0;clickRing.visible=false;}
  function fail(error){if(failed||disposed)return;failed=true;stopped();canvas.tabIndex=-1;callbacks.failure?.(error);}
  function action(name){if(actionName===name)return;const next=actions[name];if(!next)return;actions[actionName]?.fadeOut(.18);next.reset().fadeIn(.18).play();actionName=name;}
  function resize(){if(disposed)return;const {width,height}=host.getBoundingClientRect();renderer.setSize(Math.max(1,width),Math.max(1,height));camera.aspect=Math.max(1,width)/Math.max(1,height);camera.updateProjectionMatrix();dirty=true;}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function onGround(event){if(disposed||failed||paused||phase!=='explore'||event.button>0)return;const box=canvas.getBoundingClientRect();pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObject(ground,false)[0];if(!hit||!campaignCanWalk(collisionLayout,hit.point.x,hit.point.z))return;destinationHit.copy(hit.point);const route=campaignRoute(collisionLayout,player,destinationHit);if(!route.length)return;routeQueue=route;destination=routeQueue.shift();input.x=input.z=0;clickRing.position.set(hit.point.x,campaignTerrainHeight(layout,hit.point.x,hit.point.z)+.13,hit.point.z);clickRing.visible=true;dirty=true;canvas.focus({preventScroll:true});}
  function lost(event){event.preventDefault();fail(new Error('The 3D view is unavailable. Continue on the illustrated trail; your reading progress is saved.'));}
  canvas.addEventListener('pointerdown',onGround);canvas.addEventListener('webglcontextlost',lost);
  settings.signal?.addEventListener('abort',cleanup,{once:true});
  if(settings.signal?.aborted)cleanup();
  const loader=new GLTFLoader(),residentFiles=new Set(layout.missions.map(p=>getCampaignMission(p.missionId)?.residentId).filter(id=>['woolly','splashy','clucky'].includes(id)));
  const names=['characters/bouncy.glb','forest/tree.glb','forest/rock.glb','forest/mushrooms.glb',...(layout.features.some(f=>f.kind==='cottage')?['forest/cottage.glb']:[]),...Array.from(residentFiles,id=>`characters/${id}.glb`)];
  async function load(path){
    const url=settings.assetUrl(path);
    try{
      const response=await fetch(url,{signal:loadingController.signal});
      if(!response.ok)throw new Error(`Approved rounded asset could not load: ${path}`);
      const gltf=await loader.parseAsync(await response.arrayBuffer(),url.slice(0,url.lastIndexOf('/')+1));
      resources.remember(gltf.scene);
      if(disposed){resources.dispose();throw new Error('Rounded place was closed');}
      gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const material of Array.isArray(o.material)?o.material:[o.material])material.shadowSide=THREE.FrontSide;}});
      return[path,gltf];
    }catch(error){loadingController.abort();throw error;}
  }
  try {
    const timeout=setTimeout(()=>loadingController.abort(),25000);
    let results;
    try{results=await Promise.allSettled(names.map(load));}finally{clearTimeout(timeout);}
    const failure=results.find(result=>result.status==='rejected');
    if(disposed){resources.dispose();throw new Error('Rounded place was closed');}
    if(failure)throw failure.reason;
    const loaded=Object.fromEntries(results.map(result=>result.value));
    assets={tree:loaded['forest/tree.glb'],rock:loaded['forest/rock.glb'],mushrooms:loaded['forest/mushrooms.glb'],cottage:loaded['forest/cottage.glb']};
    const bouncy=loaded['characters/bouncy.glb'];hero=new THREE.Group();hero.add(bouncy.scene);hero.scale.setScalar(1.1);scene.add(hero);mixer=new THREE.AnimationMixer(bouncy.scene);actions=Object.fromEntries(bouncy.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));action('Idle');
    // Only a Pal's exact authored GLB may appear in this world. Every other
    // resident is deliberately encountered through their canonical illustration.
    for(const id of residentFiles){const source=loaded[`characters/${id}.glb`],model=cloneSkeleton(source.scene),rm=new THREE.AnimationMixer(model),idle=source.animations.find(clip=>clip.name==='Idle');if(idle)rm.clipAction(idle).play();const point=layout.missions.find(p=>getCampaignMission(p.missionId)?.residentId===id);model.position.set(point.x-.8,campaignTerrainHeight(layout,point.x,point.z),point.z-.65);model.rotation.y=.4;scene.add(model);residents.push({model,mixer:rm,id});}
    function plant(){if(treesGroup){clearInstances(treesGroup);scene.remove(treesGroup);}const trees=low?layout.trees.filter((_,i)=>i%3===0):layout.trees;treesGroup=new THREE.Group();scene.add(treesGroup);instanceAsset(assets.tree,trees,treesGroup,resources,{...theme,worldId:layout.worldId,layout},true);instanceAsset(assets.tree,low?layout.backdrop.filter((_,i)=>i%6===0):layout.backdrop,treesGroup,resources,{...theme,worldId:layout.worldId,layout},true,false);}
    function dress(){
      if(decorGroup){clearInstances(decorGroup);decorGroup.traverse(o=>{if(o.userData.batched&&o.geometry){o.geometry.dispose();resources.geometries.delete(o.geometry);}});scene.remove(decorGroup);}
      decorGroup=new THREE.Group();scene.add(decorGroup);
      instanceAsset(assets.rock,layout.rocks,decorGroup,resources,{...theme,layout});
      for(const kind of ['rock','mushrooms','cottage']){const placements=layout.features.filter(f=>f.kind===kind);if(placements.length&&assets[kind])instanceAsset(assets[kind],placements,decorGroup,resources,{...theme,layout},kind==='cottage');}
      const plants=new THREE.Group();
      for(const feature of layout.features.filter(f=>!['rock','mushrooms','cottage'].includes(f.kind))){const object=furniture.prop({kind:feature.kind,x:feature.x,z:feature.z,lift:0,size:feature.scale,installed:true},assets);object.position.y+=campaignTerrainHeight(layout,feature.x,feature.z);object.rotation.y=feature.rotation;plants.add(object);}
      const natural=batchFurniture(plants,resources);natural.traverse(o=>{o.userData.batched=true;});decorGroup.add(natural);
      if(!low){
        const spots=layout.trees.filter((_,i)=>i%5===0).map(t=>({x:t.x-.7,z:t.z+.8,scale:.48,rotation:t.rotation}));
        instanceAsset(assets.mushrooms,spots,decorGroup,resources,{...theme,layout});
        const flowers=new THREE.Group();
        for(let i=0;i<28;i++){const p=layout.trees[i%layout.trees.length];if(p){const small=new THREE.Group();small.position.set(p.x+Math.sin(i*2.4)*1.6,campaignTerrainHeight(layout,p.x,p.z),p.z+Math.cos(i*2.4)*1.6);small.scale.setScalar(.45);furniture.flower(small);flowers.add(small);}}
        const batched=batchFurniture(flowers,resources);batched.traverse(o=>{o.userData.batched=true;});decorGroup.add(batched);
      }
    }
    function discoveries(){
      if(discoveryGroup){scene.remove(discoveryGroup);discoveryGroup.traverse(o=>{if(o.geometry){o.geometry.dispose();resources.geometries.delete(o.geometry);}});}
      if(carriedObject){hero.remove(carriedObject);carriedObject.traverse(o=>{if(o.geometry?.userData.transient){o.geometry.dispose();resources.geometries.delete(o.geometry);}});carriedObject=null;}
      const composition=new THREE.Group();
      for(const d of layout.discoveries){
        const known=discoveryState.discoveredIds.includes(d.id),delivered=d.kind==='carry'&&known;
        const location=delivered?d.destination:d.source;
        if(d.kind==='carry'){
          const stand=furniture.prop({kind:d.standKind,x:d.destination.x+1.1,z:d.destination.z-.8,lift:0,size:.72,installed:true},assets);
          stand.position.y+=campaignTerrainHeight(layout,d.destination.x,d.destination.z);composition.add(stand);
          if(discoveryState.carrying===d.id){carriedObject=furniture.prop({kind:d.itemKind,x:.42,z:.35,lift:1.1,size:.45,installed:false},assets);hero.add(carriedObject);continue;}
        }
        const object=furniture.prop({kind:d.itemKind,x:location.x+(delivered?1.1:.8),z:location.z-.8,lift:delivered?.35:0,size:d.kind==='operate'?1.05:.62,installed:false,lit:discoveryState.operated,turned:discoveryState.operated,direction:'left'},assets);
        object.position.y+=campaignTerrainHeight(layout,location.x,location.z);composition.add(object);
        if(d.kind==='operate'&&known){const bloom=new THREE.Group();bloom.position.set(location.x-.8,campaignTerrainHeight(layout,location.x,location.z),location.z-.8);furniture.flower(bloom);composition.add(bloom);}
      }
      discoveryGroup=batchFurniture(composition,resources);scene.add(discoveryGroup);dirty=true;
    }
    function repair(){const key=completed.slice().sort().join('|');if(key===repairKey&&restorationGroup)return;repairKey=key;if(restorationGroup){scene.remove(restorationGroup);restorationGroup.traverse(o=>{if(o.geometry){o.geometry.dispose();resources.geometries.delete(o.geometry);}});}const composition=new THREE.Group(),state=getRoundedCampaignRestoration(layout.stageId,completed);for(const desc of state.props.filter(p=>(!p.missionId||p.installed)&&!(layout.water&&p.kind==='pond')))composition.add(furniture.prop(desc,assets));restorationGroup=batchFurniture(composition,resources);restorationGroup.position.set(layout.landmark.x,campaignTerrainHeight(layout,layout.landmark.x,layout.landmark.z),layout.landmark.z);scene.add(restorationGroup);
      if(encounterGroup){scene.remove(encounterGroup);encounterGroup.traverse(o=>{if(o.geometry){o.geometry.dispose();resources.geometries.delete(o.geometry);}});}
      const encounters=new THREE.Group();
      for(const p of campaignEncounterProps(layout,completed)){const object=furniture.prop(p,assets);object.position.y+=campaignTerrainHeight(layout,p.x,p.z);encounters.add(object);}
      for(const point of layout.missions){if(completed.includes(point.missionId))continue;const job=CAMPAIGN_ROUNDED_RESTORATIONS[layout.stageId].jobs.find(j=>j.missionId===point.missionId);if(job?.before.length)continue;const side=point.missionId.includes('-side-'),object=furniture.prop({kind:side?'lantern':'book',x:point.x+1,z:point.z-.85,lift:0,size:side?.65:.85,installed:false},assets);object.position.y+=campaignTerrainHeight(layout,point.x,point.z);encounters.add(object);}
      encounterGroup=batchFurniture(encounters,resources);scene.add(encounterGroup);collisionLayout=campaignCollisionLayout(layout,completed,low);}
    assets.plant=plant;assets.dress=dress;assets.repair=repair;assets.discoveries=discoveries;plant();dress();repair();discoveries();callbacks.ready?.();
  } catch(error){if(!disposed){fail(error);cleanup();}}
  function snapshot(){const width=host.clientWidth,height=host.clientHeight;callbacks.snapshot?.({stageId:layout.stageId,x:player.x,z:player.z,nearMissionId:campaignNearMission(layout,player,available,completed),worldInteraction:campaignNearbyWorldInteraction(layout,player,discoveryState),carrying:discoveryState.carrying?{id:discoveryState.carrying,kind:layout.discoveries[0].itemKind,title:layout.discoveries[0].itemTitle}:null,markers:layout.missions.map(p=>{projected.set(p.x,campaignTerrainHeight(layout,p.x,p.z)+1.5,p.z).project(camera);const job=CAMPAIGN_ROUNDED_RESTORATIONS[layout.stageId].jobs.find(j=>j.missionId===p.missionId);return {missionId:p.missionId,objectKind:job?.before[0]?.kind||job?.after[0]?.kind||'lantern',x:(projected.x+1)/2*width,y:(1-projected.y)/2*height,visible:phase==='explore'&&available.includes(p.missionId)&&!completed.includes(p.missionId)&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.94&&Math.abs(projected.y)<.9&&Math.hypot(player.x-p.x,player.z-p.z)>2.6};}),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,renderedFrames,frameMs:frameAverage});}
  function update(now){
    if(disposed||failed)return;frame=requestAnimationFrame(update);
    const moving=!paused&&phase==='explore'&&(destination||input.x||input.z||Math.hypot(player.vx,player.vz)>.025);
    if(!dirty&&!moving&&(reduced||paused||phase!=='explore')){last=now;return;}
    // Cap idle animations; a reduced idle scene never submits identical pixels.
    if(!dirty&&!moving&&!reduced&&now-drawTime<1000/30)return;
    const actual=last?(now-last)/1000:0,dt=Math.min(actual,.07);last=now;dirty=false;drawTime=now;
    if(!paused&&phase==='explore'){
      let dx=input.x,dz=input.z,worldInput=false;
      if(destination&&!dx&&!dz){const distance=Math.hypot(destination.x-player.x,destination.z-player.z);if(distance<.18){destination=routeQueue.shift()||null;if(!destination){clickRing.visible=false;player.vx=player.vz=0;}}if(destination){const d=Math.hypot(destination.x-player.x,destination.z-player.z);dx=(destination.x-player.x)/d;dz=(destination.z-player.z)/d;worldInput=true;}}
      else if(dx||dz){destination=null;routeQueue=[];clickRing.visible=false;}
      if(!worldInput){camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,new V(0,1,0)).normalize();const x=right.x*dx-forward.x*dz,z=right.z*dx-forward.z*dz;dx=x;dz=z;}
      acc+=dt;while(acc>=1/60){campaignStepPlayer(collisionLayout,player,{x:dx,z:dz,run:input.run},1/60);acc-=1/60;}
    }else acc=0;
    const groundHeight=campaignWalkHeight(collisionLayout,player.x,player.z),speed=Math.hypot(player.vx,player.vz);
    if(hero){hero.position.set(player.x,groundHeight+.04,player.z);if(speed>.15&&!paused&&phase==='explore'){const angle=Math.atan2(player.vx,player.vz);hero.rotation.y+=Math.atan2(Math.sin(angle-hero.rotation.y),Math.cos(angle-hero.rotation.y))*Math.min(1,dt*14);}action(speed>.15&&!paused&&phase==='explore'?'Walk':'Idle');if(!reduced&&!paused){mixer.timeScale=actionName==='Walk'?Math.max(.8,speed/4.6):1;mixer.update(dt);residents.forEach(r=>r.mixer.update(dt));}}
    for(const p of layout.missions){const marker=markerMeshes.get(p.missionId);marker.visible=phase==='explore'&&available.includes(p.missionId)&&!completed.includes(p.missionId);marker.scale.setScalar(p.missionId===focusMissionId?1.14:1);}
    if(phase==='title'){cameraTarget.set(27,35,38);lookTarget.set(0,1,-3);}else{const extra=camera.aspect<.85?1.32:1;cameraTarget.set(player.x+7*extra,groundHeight+11.8*extra,player.z+13.3*extra);lookTarget.set(player.x,groundHeight+.85,player.z-2.3);}
    const damp=reduced?1:1-Math.exp(-Math.max(dt,.016)*5);camera.position.lerp(cameraTarget,damp);look.lerp(lookTarget,damp);camera.lookAt(look);
    renderer.render(scene,camera);renderedFrames++;if(moving)frameAverage+=(Math.min(actual*1000,250)-frameAverage)*.08;canvas.dataset.phase=phase;canvas.dataset.paused=String(paused);canvas.dataset.available=available.join(',');canvas.dataset.destination=destination?`${destination.x},${destination.z}`:'';canvas.dataset.stageId=layout.stageId;canvas.dataset.playerX=player.x.toFixed(3);canvas.dataset.playerZ=player.z.toFixed(3);canvas.dataset.renderedFrames=String(renderedFrames);canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);canvas.dataset.frameMs=frameAverage.toFixed(2);if(now-snapshotTime>90||reduced){snapshotTime=now;snapshot();}
    if(!reduced&&camera.position.distanceTo(cameraTarget)>.03)dirty=true;
  }
  if(!disposed)frame=requestAnimationFrame(update);
  return {
    setState(state={}){if(disposed||failed)return;const before=JSON.stringify([phase,paused,reduced,low,completed,available,focusMissionId,discoveryState.discoveredIds,discoveryState.carrying]);const wasInteractive=phase==='explore'&&!paused,wasPaused=paused,previousPhase=phase;phase=state.phase??phase;paused=state.paused??paused;reduced=state.reduced??reduced;const previousLow=low;low=state.low??low;completed=Array.from(state.completedMissionIds??completed);available=Array.from(state.availableMissionIds??available);focusMissionId=state.focusMissionId===undefined?focusMissionId:state.focusMissionId;const oldDiscoveries=discoveryState.discoveredIds.join('|'),oldCarrying=discoveryState.carrying;discoveryState=campaignRestoreWorldInventory(layout,discoveryState,state);if(before===JSON.stringify([phase,paused,reduced,low,completed,available,focusMissionId,discoveryState.discoveredIds,discoveryState.carrying]))return;dirty=true;canvas.tabIndex=phase==='explore'&&!paused?0:-1;if(phase!=='explore'||paused)stopped();else if(!wasInteractive&&(state.focusOnResume!==false||previousPhase!=='explore'||!wasPaused))canvas.focus({preventScroll:true});sun.castShadow=!low;renderer.shadowMap.enabled=!low;const ratio=Math.min(window.devicePixelRatio||1,low?1:1.5);if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);if(previousLow!==low&&assets){assets.plant();assets.dress();collisionLayout=campaignCollisionLayout(layout,completed,low);}assets?.repair();if(oldDiscoveries!==discoveryState.discoveredIds.join('|')||oldCarrying!==discoveryState.carrying)assets?.discoveries();},
    restore(position){if(disposed||failed||!position||!campaignCanWalk(collisionLayout,position.x,position.z))return false;player.x=position.x;player.z=position.z;stopped();dirty=true;return true;},
    move(x,z){if(disposed||failed||paused||phase!=='explore')return;input.x=Number.isFinite(x)?clamp(x,-1,1):0;input.z=Number.isFinite(z)?clamp(z,-1,1):0;if(input.x||input.z){destination=null;routeQueue=[];clickRing.visible=false;}dirty=true;},
    run(value){input.run=!!value;},
    walkToMission(id){
      canvas.dataset.lastWalkMission=id;
      if(disposed||failed||paused||phase!=='explore'){canvas.dataset.lastWalk='inactive';return false;}
      if(!available.includes(id)||completed.includes(id)){canvas.dataset.lastWalk='unavailable';return false;}
      const point=layout.missions.find(p=>p.missionId===id);if(!point){canvas.dataset.lastWalk='unknown';return false;}
      const route=campaignRoute(collisionLayout,player,point);
      if(!route.length){canvas.dataset.lastWalk='unreachable';return false;}
      stopped();routeQueue=route;destination=routeQueue.shift();focusMissionId=id;dirty=true;canvas.dataset.lastWalk='following';canvas.focus({preventScroll:true});return true;
    },
    interact(){if(disposed||failed||paused||phase!=='explore')return false;const result=campaignUseWorldObject(layout,player,discoveryState);if(!result.accepted)return false;discoveryState=result.state;assets?.discoveries();dirty=true;callbacks.interaction?.({stageId:layout.stageId,...result.interaction,carryingId:discoveryState.carrying});if(result.discovery)callbacks.discovery?.(result.discovery);return result.interaction;},
    walkToDiscovery(id){if(disposed||failed||paused||phase!=='explore')return false;const d=layout.discoveries.find(d=>d.id===id);if(!d)return false;const goal=d.kind==='carry'&&discoveryState.carrying===id?d.destination:d.source,route=campaignRoute(collisionLayout,player,goal);if(!route.length)return false;stopped();routeQueue=route;destination=routeQueue.shift();dirty=true;canvas.focus({preventScroll:true});return true;},
    position(){return {stageId:layout.stageId,x:player.x,z:player.z};},
    dispose:cleanup
  };
}
