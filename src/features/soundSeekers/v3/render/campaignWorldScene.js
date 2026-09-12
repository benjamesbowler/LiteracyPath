import { openingSceneAppearance } from '../content/campaignLanguage.js';
import { createMazeAdventureScene } from './mazeAdventureScene.js';
import { activityAreaFor,usesMazeArea } from '../content/activityAreas.js';
import { LEARNING_SPRITES,PUZZLE_SPRITES,drawPuzzleSprite } from './puzzleSprites.js';
import { WORLD_MATERIALS,worldMaterial } from './illustratedWorldArt.js';
import { traversalWaypoints,openCampaignTraversal,advanceCampaignTraversal } from '../engine/campaignTraversal.js';
import { createExplorationScene } from './explorationScene.js';
import { SOUND_SEEKERS_CAMPAIGN_PALETTE as P } from '../../visual/visualTokens.js';
import { createCampaignActionMotion,advanceCampaignActionMotion,resolveCampaignActionMotion,cancelCampaignActionMotion } from '../engine/campaignActionMotion.js';
import { drawCampaignActionMotion } from './campaignActionMotion.js';
import { drawCampaignHero,createCampaignHeroAnimator,getCampaignHeroAssets } from './campaignHeroes.js';
import { drawCampaignProp,campaignRelationPlacement,drawCampaignRelationForeground } from './campaignProps.js';
import { CAST } from '../content/cast.js';
import { getCampaignLayout, getCampaignChoiceAnchors } from '../content/campaignLayouts.js';
import { MECHANICS } from '../engine/challenges.js';
import { createPlatformState, setPlatformInput, releasePlatformInput, advancePlatform, platformSnapshot } from '../engine/platformPhysics.js';
import { createPuppet, drawPuppet, getImage, tickPuppet } from './sprites.js';

const INK = P['world-tone-1'], CREAM = P['world-tone-2'], GREEN = P['world-tone-3'];
const GROUND = 560;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const familyOf = (mission, beat) => beat?.familyId || mission?.familyId;
const caption = (ctx, text, x, y, size = 24, color = INK) => {
  ctx.fillStyle = color; ctx.font = `800 ${size}px "Nunito", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
};
function board(ctx, x, y, w, h, fill = CREAM) {
  ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
}
function terrain(ctx, r, world) {
  ctx.fillStyle = worldMaterial(ctx,world,'earth') || (world === 'moonwood' ? P['world-tone-4'] : world === 'dino' ? P['world-tone-5'] : P['world-tone-6']);
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.width, Math.max(28, r.height || 32), [12, 12, 3, 3]); ctx.fill();
  ctx.strokeStyle = worldMaterial(ctx,world,'grass') || (world === 'moonwood' ? P['world-tone-7'] : P['world-tone-8']); ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(r.x + 8, r.y + 3); ctx.lineTo(r.x + r.width - 8, r.y + 3); ctx.stroke();
  ctx.strokeStyle = P['world-tone-9']; ctx.lineWidth = 2;
  for (let x = r.x + 25; x < r.x + r.width; x += 65) { ctx.beginPath(); ctx.moveTo(x, r.y + 17); ctx.lineTo(x + 24, r.y + 22); ctx.stroke(); }
}
function choiceObjects(beat, state) {
  if (!beat) return [];
  if (beat.mechanic === MECHANICS.SIGNPOST) return beat.view.cards.map(c => ({ id: c.targetId, label:c.grapheme,audio:c.phonemeAudio,audioSequence:[c.phonemeAudio,...(c.unitAudio||[]).map(u=>u.audio),c.anchorAudio].filter(Boolean),image:c.anchorImage, action: { type: 'HEARD_CARD', targetId: c.targetId }, role: 'teach' }));
  if (beat.mechanic === MECHANICS.WORD_FORGE || beat.mechanic === 'sentence_build') return beat.view.tiles.map((t,slotIndex) => ({...t,slotIndex})).filter(t => !state?.placed?.includes(t.id)).map(t => ({ ...t, label: t.grapheme, action: { type: 'PLACE_TILE', tileId: t.id }, role: 'plank' }));
  if (beat.mechanic === MECHANICS.SOUND_SORT) return beat.view.bins.map(b => ({ ...b, label: b.grapheme || b.label || b.soundLabel, action: { type: 'PLACE', itemId: beat.view.items[state?.itemIndex || 0]?.id, binId: b.id }, role: 'basket' }));
  if (beat.mechanic === MECHANICS.STORY_BRIDGE) return beat.view.choices.map(c => ({ ...c, sceneObject:beat.view.sceneObjects?.find(o=>o.id===c.icon), action: { type: 'CHOOSE', choiceId: c.id }, role: 'destination' }));
  if (beat.mechanic === MECHANICS.GATE_RIDDLE) return beat.view.keys.map(c => ({ ...c, label: c.word || c.label, action: { type: 'CHOOSE', keyId: c.id }, role: 'key' }));
  return (beat.view.options || []).map(c => ({ ...c, label: c.grapheme || c.label || c.word || '♪', action: { type: 'CHOOSE', optionId: c.id }, role: 'choice' }));
}

/** The scene knows only the public challenge projection. All literacy choices
 * go through onAction; physics events never create learning evidence. */
function createPlatformAdventureScene({ stage, missions = [], mission = null, beats = [], beatIndex = 0, beatState = null, heroId, onAction, onAdvance, onHear, onSound, onSavePosition, reducedMotion = false, simplifiedBackgrounds = false, position = null }) {
  const layout = getCampaignLayout(mission.id,{beatCount:beats.length,beatFamilies:beats.map(b=>b.familyId),beatMechanics:beats.map(b=>b.mechanic),beatSections:beats.map(b=>b.sectionId)});
  const length = layout.bounds.right;
  const activeRoom=layout.rooms[beatIndex];
  let areaStartIndex=beatIndex;
  while(areaStartIndex>0&&beats[areaStartIndex-1].familyId===beats[beatIndex].familyId&&beats[areaStartIndex-1].sectionId===beats[beatIndex].sectionId&&!usesMazeArea(beats[areaStartIndex-1]))areaStartIndex--;
  const areaStart=layout.rooms[areaStartIndex].originX;
  // Expanded routes can move an old checkpoint outside its active room. Recover
  // motor position there while keeping the saved learning beat and evidence.
  if(position&&(position.x<areaStart-120||position.x>activeRoom.originX+activeRoom.width))position=null;
  const player = createPlatformState({...layout,spawn:activeRoom.spawn,snapshot:position,tuning:{width:48,height:90,speed:340,jumpSpeed:630},camera:{...layout.camera,width:1100,height:700}});
  if(!layout.camera.vertical)player.camera.y=0;
  const restoredRooms = new Set();
  function restoreRoom(n) {
    const r=layout.rooms?.[n];
    if (!r || restoredRooms.has(n)) return;
    player.platforms.push(...r.repairPlatforms); restoredRooms.add(n);
  }
  if (mission) for(let n=0;n<beatIndex;n++)restoreRoom(n);
  if(beatState?.done)restoreRoom(beatIndex);
  const heroPuppet = createPuppet();
  const heroAnimator=createCampaignHeroAnimator(heroId);
  let animation=heroAnimator.update(0),heroAction=null,actionId=0;
  let time = 0, gaitTime=0, index = beatIndex, state = beatState, w = 1100, h = 700, scale = 1;
  let activityPending=false,route=[],motion=null,destination = null, aim = null, projectiles = [], effects = [], lastSave = 0;
  let lastContact=null,analogSpeed=1,sprinting=false,advancePending=false,feedback=null;
  let actionLock = false, disposed = false, lastPlayerSnapshot = '';
  const background = layout.backdrop;
  const area=activityAreaFor(beats[beatIndex]?.familyId||mission.familyId);
  const beat = () => beats[index];
  const room = () => layout.rooms?.[index];
  const origin = () => (room()?.originX || 0) + 310;
  const levelY = () => room()?.exit.y ?? GROUND;
  const exitX = () => room()?.exit.x ?? 0;
  function openTraversal(r,immediate=false) {
    const t=r?.traversal;if(!t)return;
    openCampaignTraversal(t,player,{immediate:immediate||reducedMotion});
    if(!player.checkpoints.some(c=>c.id===t.checkpoint.id))player.checkpoints.push(t.checkpoint);
  }
  for(let n=0;n<beatIndex;n++)openTraversal(layout.rooms[n],true);
  if(position?.x>room()?.traversal?.x+220)openTraversal(room(),true);
  const advance=()=>{if(advancePending)return;advancePending=true;release();onAdvance?.();};
  function availableObjects() {
    const onward = state?.done ? [...(room()?.traversal&&!room().traversal.opened?[room().traversal.switch]:[]),{ id: 'leave-room', x: exitX(), y: levelY(), label: index === beats.length - 1 ? 'Bring it home' : 'Follow the path', role: 'exit' }] : [];
    // Finishing narration opens the path; the teaching picture remains available
    // to look at and replay until the learner actually enters the next room.
    if (state?.done && beat()?.mechanic !== MECHANICS.SIGNPOST) return onward;
    const choices = choiceObjects(beat(), state);
    const anchors = getCampaignChoiceAnchors(room(),beat()?.view.tiles?.length || choices.length);
    const objects=choices.map((c,i)=>({...c,...anchors[c.slotIndex??i]}));
    if(['lantern-search','story-rescue'].includes(familyOf(mission,beat()))){const clue=room().objects.find(o=>o.id.includes('clue-one')||o.id.includes('message'));if(clue)objects.unshift({...clue,id:'inspect-clue',role:'clue',label:'Hear the clue'});}
    return [...objects, ...onward];
  }
  function interaction() {
    const objects=availableObjects(),selected=objects.find(o=>o.id===aim);
    const nearby=selected||objects.filter(o=>Math.abs(o.x-player.x)<(familyOf(mission,beat())==='word-pop'?900:160)&&Math.abs(o.y-player.y)<250).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
    if(!nearby)return null;
    const label=nearby.role==='teach'?`Hear ${nearby.label}`:nearby.role==='plank'?`Place ${nearby.label}`:nearby.role==='basket'?`Send to ${nearby.label}`:familyOf(mission,beat())==='word-pop'?`Aim at ${nearby.label}`:nearby.label;
    return {id:nearby.id,label,role:nearby.role};
  }
  function trigger(object) {
    activityPending=true;
    if (!object || disposed) return;
    lastContact=object.id;
    if(!['exit','walk'].includes(object.role))heroAction={state:object.role==='teach'||object.role==='clue'?'talk':'use',life:.65,id:++actionId};
    if(object.role==='mechanism'){openTraversal(room());if(object.continueTo)approach(object.continueTo);onSound?.('place');effects.push({x:object.x,y:object.y-70,text:'A new way across!',life:2});return;}
    if (object.role === 'exit') { advance(); return; }
    if(object.role==='clue'){void onHear?.(beat().prompt.cues.map(c=>c.src).filter(Boolean),{kind:'clue'});effects.push({x:object.x,y:object.y-100,text:'Listen. Then explore.',life:3});return;}
    if(object.role==='walk')return;
    if (object.role === 'teach') {
      void onHear?.(object.audioSequence, { kind: 'teach', targetId: object.id });
      return;
    }
    if (actionLock || motion&&!['settled','returned','cancelled'].includes(motion.phase)) return;
    feedback={x:object.x,y:object.y-70,id:object.id,life:.45,type:'working'};
    if (familyOf(mission, beat()) === 'word-pop') {
      onSound?.('launch');
      projectiles.push({ x: player.x, y: player.y - 65, target: { ...object }, age: 0 });
      actionLock = true;
    } else {
      const family=familyOf(mission,beat()),appearance=openingSceneAppearance(object.sceneObject);
      const placement=appearance.relation&&appearance.landmark?campaignRelationPlacement({...appearance,size:125,objectKind:beat().view.objectId||appearance.kind}):null,offset=placement?.object||{x:0,y:-35,size:65};
      const from=beat().view.phase==='pickup'?{x:object.x,y:object.y}:family==='sound-herd'?{x:room().originX+170,y:room().groundY}:family==='sentence-express'||family==='fix-it-workshop'?{x:object.x,y:object.y}:{x:player.x,y:player.y-35};
      const to=beat().view.phase==='pickup'?{x:player.x+42*player.facing,y:player.y-35}:family==='sentence-express'?{x:origin()+(state.placed.length%6)*110,y:levelY()-Math.floor(state.placed.length/6)*140}:family==='fix-it-workshop'?{x:origin()+(beat().view.workshop?.slotIndex||state.placed.length)*104+48,y:levelY()-270}:{x:object.x+offset.x,y:object.y+(family==='river-route'?0:offset.y)};
      const item=beat().view.items?.[state?.itemIndex||0];
      motion=createCampaignActionMotion({familyId:family,action:object.action,from,to,objectId:family==='fix-it-workshop'?'tool':beat().view.objectId||object.sceneObject?.appearance?.kind||object.sceneObject?.icon||'',appearance:{...appearance,relation:null,landmark:null,size:offset.size},label:family==='sentence-express'||family==='fix-it-workshop'?object.label:family==='sound-herd'&&beat().view.mode==='read'?item?.word:'',reducedMotion});
      if(motion){onSound?.(beat().view.phase==='pickup'?'pickup':'route');release();actionLock=true;}else onAction?.(object.action);
    }
  }
  function approach(object) {
    activityPending=true;analogSpeed=1;player.tuning.speed=sprinting?470:340;
    if (!object) return;
    if (object.role === 'choice' && beat()?.view.direction === 'letter-to-sound') { onHear?.([object.audio], { kind: 'option' }); aim = object.id; return; }
    if(familyOf(mission,beat())==='word-pop'&&Math.abs(object.x-player.x)<1000){trigger(object);return;}
    if(familyOf(mission,beat())==='river-route'){trigger(object);return;}
    if(object.role==='exit'&&room()?.traversal){
      const t=room().traversal;
      if(!t.opened){approach({...t.switch,continueTo:object});return;}
      destination=object;route=traversalWaypoints(t).filter(p=>p.x>player.x+25);return;
    }
    destination = object;
    route=(familyOf(mission,beat())==='tree-rescue')?room().platforms.filter(p=>p.y<player.y-30&&p.y>=object.y&&p.x<=object.x).sort((a,b)=>b.y-a.y).map(p=>({x:clamp(object.x,p.x+65,p.x+p.width-65),y:p.y})):[];
    if (Math.abs(player.x - object.x) < 120 && Math.abs(player.y - object.y) < (familyOf(mission,beat())==='sound-steps'?25:150)) { destination = null; trigger(object); }
  }
  function release() { analogSpeed=1;sprinting=false;player.tuning.speed=340;releasePlatformInput(player); destination = null;route=[]; }
  function update(dt) {
    if (disposed) return;
    time += dt;if(Math.abs(player.vx)>10)gaitTime+=dt*Math.abs(player.vx)/340;tickPuppet(heroPuppet, dt);
    if (destination) {
      const waypoint=route[0]||destination;
      const dx = waypoint.x - player.x;
      const needJump = player.grounded ? waypoint.y<player.y-30&&!player.input.jump : player.input.jump&&player.vy<0;
      setPlatformInput(player, { left: dx < -35, right: dx > 35, jump: needJump });
      if(route.length&&Math.abs(dx)<45&&Math.abs(player.y-waypoint.y)<12&&player.grounded)route.shift();
      if (!route.length&&Math.abs(destination.x-player.x) < (familyOf(mission,beat())==='word-pop'?900:40) && Math.abs(player.y - destination.y) < (familyOf(mission,beat())==='sound-steps'?25:150)) { const target = destination; release(); trigger(target); }
    }
    if(familyOf(mission,beat())==='sound-steps' && !state?.done){
      for(const o of availableObjects()){
        const id=`choice-${index}-${o.id}`;
        if(!player.platforms.some(p=>p.id===id))player.platforms.push({id,x:o.x-65,y:o.y,width:130,height:0});
      }
    }
    if(mission){player.bounds.left=areaStart;player.bounds.right=room().originX+room().width;if(state?.done&&room().traversal?.opened&&!player.checkpoints.some(c=>c.id===room().traversal.checkpoint.id))player.checkpoints.push(room().traversal.checkpoint);}
    advanceCampaignTraversal(room().traversal,player,dt,{reducedMotion});
    const { events } = advancePlatform(player, dt);
    if(events.some(event=>event.type==='jump'))onSound?.('jump');
    if(familyOf(mission,beat())==='sound-steps' && !state?.done && player.grounded && (player.input.left||player.input.right||player.input.jump)){
      const landed=availableObjects().find(o=>Math.abs(o.x-player.x)<48&&Math.abs(o.y-player.y)<8);
      if(landed && (!destination||destination.id===landed.id) && events.some(e=>e.type==='land') && lastContact!==landed.id)trigger(landed);
      if(!landed)lastContact=null;
    }
    if(motion){
      const activeMotion=motion;
      for(const event of advanceCampaignActionMotion(activeMotion,dt)){if(event.type==='commit')onAction?.(event.action);}
      if(activeMotion.familyId==='river-route'&&motion===activeMotion){player.x=activeMotion.position.x;player.y=activeMotion.position.y-12;player.vx=0;player.vy=0;}
      if(['settled','returned','cancelled'].includes(activeMotion.phase)){motion=null;actionLock=false;}
    }
    for (const e of events) if (e.type === 'recover') effects.push({ x: player.x, y: player.y - 50, text: 'Try that jump again', life: 2 });
    for (const shot of projectiles) {
      shot.age += dt;
      const tx = shot.target.x, ty = shot.target.y - 60;
      const distance = Math.hypot(tx - shot.x, ty - shot.y);
      if (distance < 24) {
        shot.done = true; actionLock = false; onAction?.(shot.target.action);
      } else { shot.x += (tx - shot.x) / distance * Math.min(distance, dt * 850); shot.y += (ty - shot.y) / distance * Math.min(distance, dt * 850); }
    }
    projectiles = projectiles.filter(p => !p.done && p.age < 4);
    if(!projectiles.length)actionLock=false;
    effects = effects.map(e => ({ ...e, life: e.life - dt })).filter(e => e.life > 0);
    if(feedback){feedback.life-=dt;if(feedback.life<=0)feedback=null;}
    if(heroAction){heroAction.life-=dt;if(heroAction.life<=0)heroAction=null;}
    const speed=Math.abs(player.vx),heroState=player.grounded?(speed>10?(sprinting?'run':'walk'):heroAction?.state||'idle'):(player.vy<0?'jump':'fall');
    animation=heroAnimator.update(dt,{state:heroState,speed,actionId:heroAction?.id,reducedMotion});
    if (state?.done && player.x >= exitX() - 45 && Math.abs(player.y-levelY())<120) advance();
    if(disposed)return;
    if (time - lastSave > 1.5) {
      lastSave = time; const snapshot = platformSnapshot(player), key = JSON.stringify(snapshot);
      if (key !== lastPlayerSnapshot) { onSavePosition?.(snapshot); lastPlayerSnapshot = key; }
    }
  }
  function draw(ctx, width, height) {
    w = width; h = height; scale = clamp(height / 730, .55, 1.5);
    player.cameraOptions.width = w / scale; player.cameraOptions.height = h / scale;
    ctx.clearRect(0, 0, w, h);
    const image = getImage(background);
    ctx.fillStyle = stage.worldId === 'moonwood' ? P['world-tone-10'] : P['world-tone-11']; ctx.fillRect(0, 0, w, h);
    if (image&&!simplifiedBackgrounds) {
      const zoom=Math.max(w*1.18/image.naturalWidth,h/image.naturalHeight);
      const iw=image.naturalWidth*zoom,ih=image.naturalHeight*zoom;
      const fraction=clamp(player.camera.x/Math.max(1,layout.bounds.right-w/scale),0,1);
      ctx.drawImage(image,-(iw-w)*fraction,(h-ih)*.5,iw,ih);
    }
    ctx.save(); ctx.scale(scale, scale); ctx.translate(-player.camera.x, -player.camera.y);
    const inView=r=>r.x+r.width>player.camera.x-200&&r.x<player.camera.x+w/scale+200;
    for(const r of player.solids)if(inView(r))terrain(ctx,r,stage.worldId);
    for(const r of player.platforms)if(inView(r)){
      if(r.id.includes('/traverse/'))drawPuzzleSprite(ctx,r.id.includes('span')?'bridge':'wood-platform',r.x+r.width/2,r.y+(r.id.includes('span')?24:r.width*.52),r.width);
      else if(r.id.startsWith('choice-'))drawPuzzleSprite(ctx,'grass-platform',r.x+r.width/2,r.y+r.width*.52,r.width);
      else terrain(ctx,r,stage.worldId);
    }
    if(mission)for(const r of layout.rooms){const t=r.traversal;if(!t||t.x>player.camera.x+w/scale+100||t.x+t.width<player.camera.x-100)continue;
      ctx.fillStyle=worldMaterial(ctx,stage.worldId,'water')||(stage.worldId==='moonwood'?P['adventure-1']:P['adventure-2']);ctx.fillRect(t.x+210,t.y+75,490,250);
      if(t.kind!=='stepping-stones'){
        drawPuzzleSprite(ctx,'lever',t.switch.x,t.switch.y,90);
        caption(ctx,t.opened?'✓':'↔',t.switch.x,t.switch.y-125,34);
        if(t.kind==='hoist')for(const platform of t.platforms||[]){
          const surface=player.platforms.find(p=>p.id===platform.id),sy=surface?.y??platform.y+160;
          ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(platform.x+20,t.y-290);ctx.lineTo(platform.x+20,sy);ctx.moveTo(platform.x+platform.width-20,t.y-290);ctx.lineTo(platform.x+platform.width-20,sy);ctx.stroke();
          ctx.save();ctx.translate(platform.x+platform.width/2,t.y-270);ctx.rotate(reducedMotion?0:t.progress*Math.PI*2);drawPuzzleSprite(ctx,'wheel',0,35,70);ctx.restore();
        }
        if(t.kind==='drawbridge'&&!t.opened){ctx.save();ctx.translate(t.x+205,t.y);ctx.rotate(-Math.PI*.38);drawPuzzleSprite(ctx,'bridge',250,20,500);ctx.restore();}
        if(!t.opened){ctx.strokeStyle=CREAM;ctx.lineWidth=4;ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(t.x+215,t.y);ctx.lineTo(t.x+695,t.y);ctx.stroke();ctx.setLineDash([]);}
      }
    }
    drawPuzzleSprite(ctx,area.prop,room().originX+room().activityWidth-200,room().groundY,150);
    drawPuzzleSprite(ctx,'door',room().originX+60,room().groundY,110);
    if(state?.done)drawPuzzleSprite(ctx,'door',exitX(),levelY(),110);
    // Ground dressing is quiet and outside the letters' reading plane.
    ctx.strokeStyle = GREEN; ctx.lineWidth = 3;
    if(!simplifiedBackgrounds)for (let x = Math.max(20,Math.floor(player.camera.x/127)*127); x < Math.min(length,player.camera.x+w/scale+127); x += 127) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x - 10, GROUND - 22, x - 20, GROUND - 24); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x + 3, GROUND - 20, x + 17, GROUND - 16); ctx.stroke(); }
    {
      const b = beat();
      if(b?.act&&b.act.id!==beats[index-1]?.act?.id){board(ctx,room().originX+25,room().groundY-215,280,64,P['world-tone-19']);caption(ctx,b.act.title,room().originX+165,room().groundY-183,20);}
      if(familyOf(mission,b)==='river-route'){ctx.fillStyle=P['world-tone-25'];ctx.fillRect(room().originX,room().groundY-10,room().width,140);ctx.strokeStyle=P['world-tone-26'];ctx.lineWidth=3;for(let rx=room().originX+20;rx<room().originX+room().width;rx+=90){ctx.beginPath();ctx.ellipse(rx+(reducedMotion?0:Math.sin(time+rx)*8),room().groundY+35,25,4,0,0,Math.PI);ctx.stroke();}}
      if(familyOf(mission,b)==='sentence-express'){for(let n=0;n<(state?.placed?.length||0);n++){const tile=b.view.tiles.find(t=>t.id===state.placed[n]),px=origin()+n%6*110,py=levelY()-Math.floor(n/6)*140;drawCampaignProp(ctx,'cart',px,py,{size:95});caption(ctx,tile?.grapheme||'',px,py-85,19);}}
      for(const prop of room()?.objects||[])drawCampaignProp(ctx,prop.kind,prop.x,prop.y,{size:110});
      for(const [roomIndex,action] of Object.entries(state?.sceneRepairs||{})){
        const past=beats[Number(roomIndex)],pastRoom=layout.rooms[Number(roomIndex)];
        if(!past?.view.objectId || past.view.phase==='pickup' || !pastRoom)continue;
        const chosen=past.view.choices?.find(o=>o.id===action.choiceId);
        if(!chosen)continue;
        const choices=past.view.choices,choiceIndex=choices.indexOf(chosen),anchors=getCampaignChoiceAnchors(pastRoom,choices.length);
        const px=anchors[choiceIndex].x;
        const semantic=past.view.sceneObjects?.find(o=>o.id===chosen.icon),appearance=semantic?.appearance;
        const placement=appearance?.landmark?campaignRelationPlacement({...appearance,size:125,objectKind:past.view.objectId}):null,offset=placement?.object||{x:0,y:-60,size:65};
        if(placement){const host=placement.landmark;drawCampaignProp(ctx,host.kind,px+host.x,anchors[choiceIndex].y+host.y,{...host});}
        drawCampaignProp(ctx,past.view.objectId,px+offset.x,anchors[choiceIndex].y+offset.y,{...appearance,relation:null,landmark:null,size:offset.size});
        if(placement)drawCampaignRelationForeground(ctx,placement,px,anchors[choiceIndex].y);
      }

      if(familyOf(mission,b)==='rescue-bridge'&&b?.mechanic===MECHANICS.WORD_FORGE){
        const span=room().repairPlatforms[0],slots=b.view.slots;
        for(let n=0;n<slots;n++){const tile=b.view.tiles.find(t=>t.id===state?.placed?.[n]),pw=span.width/slots;
          if(tile){board(ctx,span.x+n*pw,span.y-35,pw-3,45,P['world-tone-15']);caption(ctx,tile.grapheme,span.x+(n+.5)*pw,span.y-14,26);}else{ctx.setLineDash([5,6]);ctx.strokeStyle=INK;ctx.strokeRect(span.x+n*pw,span.y-30,pw-3,35);ctx.setLineDash([]);}
        }
      }
      if(b?.view.workshop?.mode==='replace'){
        const workshop=b.view.workshop,units=state?.wordUnits||workshop.baseUnits;
        if(!state?.done)caption(ctx,workshop.baseWord,origin()+units.length*52,levelY()-385,30);
        for(let n=0;n<units.length;n++){const px=origin()+n*104;board(ctx,px,levelY()-340,96,78,n===workshop.slotIndex?P['world-tone-23']:CREAM);caption(ctx,units[n],px+48,levelY()-301,32);if(n===workshop.slotIndex)caption(ctx,'↓',px+48,levelY()-370,28);}
      }
      if ((b?.mechanic === MECHANICS.WORD_FORGE&&!b?.view.workshop) || b?.view.workshop?.mode==='assembly' || b?.mechanic === 'sentence_build') {
        const slots = b.view.slots;
        let sx=origin(),sy=levelY()-(b.mechanic==='sentence_build'?400:340);
        const rowEnd=origin()+Math.min(680,room().width-420);
        for(let i=0;i<slots;i++){
          const selected=b.view.tiles.find(t=>t.id===state?.placed?.[i]);
          const sentence=b.mechanic==='sentence_build',word=selected?.grapheme||'';
          const sw=sentence?Math.max(100,word.length*14+30):92;
          if(sx+sw>rowEnd&&sx>origin()){sx=origin();sy+=84;}
          board(ctx,sx,sy,sw,70,selected?P['world-tone-15']:P['world-tone-16']);
          caption(ctx,word||String(i+1),sx+sw/2,sy+35,sentence?23:32,word?INK:P['world-tone-17']);
          sx+=sw+10;
        }
      }
      if(state?.done&&state.completedWord){const word=state.completedWord,bw=Math.max(180,word.length*27+40);board(ctx,origin(),levelY()-210,bw,70,P['world-tone-15']);caption(ctx,word,origin()+bw/2,levelY()-175,34);}
      if (b?.view.text || b?.view.context) {
        board(ctx, origin() - 60, levelY() - 385, 760, 72);
        caption(ctx, b.view.text || b.view.context, origin() + 320, levelY() - 347, 23);
      }
      if(b?.mechanic===MECHANICS.SOUND_SORT){
        const item=b.view.items[state?.itemIndex||0];
        if(item&&!motion){const cx=room().originX+170,cy=room().groundY;drawCampaignProp(ctx,'cart',cx,cy,{size:110});board(ctx,cx-80,cy-170,160,65);if(b.view.mode==='read')caption(ctx,item.word||'',cx,cy-138,25);else{const picture=getImage(item.image);if(picture)ctx.drawImage(picture,cx-45,cy-155,90,70);else caption(ctx,'♪',cx,cy-138,30);}}
      }
      for (const object of availableObjects()) {
        const selected = aim === object.id;
        const text = object.label || '';
        if(object.role==='mechanism')continue;
        if(object.role==='clue'){drawCampaignProp(ctx,'lantern',object.x,object.y,{size:110,filled:true});board(ctx,object.x-95,object.y-170,190,48);caption(ctx,'Hear the clue',object.x,object.y-145,18);continue;}
        if (object.role === 'exit') {
          ctx.fillStyle = P['world-tone-18']; ctx.fillRect(object.x - 6, object.y - 180, 12, 180); board(ctx, object.x - 105, object.y - 175, 210, 58, P['world-tone-19']); caption(ctx, index === beats.length - 1 ? 'Home →' : 'Next →', object.x, object.y - 147, 28); continue;
        }
        if(object.role==='destination' && object.sceneObject) {
          const semantic=object.sceneObject || object;
          const appearance=openingSceneAppearance(semantic);
          for(const prop of appearance.scenery||[])drawCampaignProp(ctx,prop.kind,object.x+prop.x,object.y+prop.y,{size:prop.size});
          const openingIcons={'button-small':'button','button-large':'button','little':'button','large':'button','shade':'seat','sun':'seat','pond':'seat'};
          const kind=appearance.kind || semantic.kind || semantic.icon || openingIcons[object.icon] || object.icon;
          if(b.view.phase==='delivery' && appearance.relation && appearance.landmark){
            const placement=campaignRelationPlacement({...appearance,size:125,objectKind:b.view.objectId}),host=placement.landmark,offset=placement.object;
            drawCampaignProp(ctx,host.kind,object.x+host.x,object.y+host.y,{...host});
            ctx.setLineDash([7,6]);ctx.lineWidth=3;ctx.strokeStyle=P['world-tone-20'];ctx.beginPath();ctx.ellipse(object.x+offset.x,object.y+offset.y,Math.max(20,offset.size*.55),Math.max(10,offset.size*.25),0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
          }else drawCampaignProp(ctx,kind,object.x,object.y,{size:125,...appearance});
          const ownerId=semantic.residentId||appearance.residentId||appearance.landmark?.residentId;
          if(ownerId&&!drawCampaignHero(ctx,ownerId,{x:object.x+50,y:object.y-100,height:55,state:'idle',time,reducedMotion}))drawPuppet(ctx,getImage(CAST[ownerId]?.sprite),{x:object.x+50,y:object.y-100,height:55,state:'idle',src:CAST[ownerId]?.sprite});
        } else {
          const width = Math.max(112,Math.min(200,text.length*18+30));
          if(familyOf(mission,b)==='word-pop'){ctx.fillStyle=P['world-tone-21'];ctx.strokeStyle=P['world-tone-22'];ctx.lineWidth=4;ctx.beginPath();ctx.arc(object.x,object.y-62,58,0,Math.PI*2);ctx.fill();ctx.stroke();}
          else board(ctx,object.x-width/2,object.y-220,width,84,selected?P['world-tone-23']:CREAM);
          caption(ctx,text,object.x,object.y-(familyOf(mission,b)==='word-pop'?60:178),text.length>7?19:34);
          if(object.role==='teach'&&object.image){const anchor=getImage(object.image);if(anchor)ctx.drawImage(anchor,object.x-55,object.y-345,110,110);}
        }
        if (state?.modelShown && object.id === state?.revealedId) { caption(ctx, '↓', object.x, object.y - 130, 32, P['world-tone-24']); }
      }
      for (const shot of projectiles) { ctx.fillStyle = P['world-tone-25']; ctx.strokeStyle = P['world-tone-26']; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(shot.x, shot.y, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
    if(familyOf(mission,beat())==='river-route'&&!motion)drawCampaignProp(ctx,'raft',player.x,player.y+12,{size:135});
    drawCampaignActionMotion(ctx,motion);
    if(feedback){
      const life=clamp(feedback.life/.8,0,1),radius=50+(1-life)*35;
      ctx.save();ctx.globalAlpha=life;ctx.strokeStyle=feedback.type==='incorrect'?P['world-tone-26']:P['world-tone-24'];ctx.lineWidth=4;
      ctx.beginPath();ctx.ellipse(feedback.x,feedback.y+55,radius,radius*.3,0,0,Math.PI*2);ctx.stroke();
      if(feedback.type==='incorrect')caption(ctx,'↶',feedback.x,feedback.y-20,42);
      else if(['complete','correct','progress'].includes(feedback.type))caption(ctx,'✓',feedback.x,feedback.y-20,38);
      ctx.restore();
    }
    const cast = CAST[heroId] || CAST.speedy, src = cast.heroSprite || cast.sprite;
    const heroState=familyOf(mission,beat())==='river-route'?'idle':player.grounded?(Math.abs(player.vx)>10?'walk':'idle'):(player.vy<0?'jump':'fall');
    if(!drawCampaignHero(ctx,heroId,{x:player.x,y:player.y,height:112,facing:player.facing,time:heroState==='walk'?gaitTime:time,state:heroState,reducedMotion,animation}))
      drawPuppet(ctx,getImage(src),{x:player.x,y:player.y,height:112,facing:player.facing,t:reducedMotion?0:time,state:heroState,puppet:heroPuppet,src});
    const carrying = !motion && !state?.done && beat()?.view.phase !== 'pickup' && beat()?.view.objectId;
    if(carrying)drawCampaignProp(ctx,carrying,player.x+42*player.facing,player.y-35,{size:48});
    for (const effect of effects) { board(ctx, effect.x - 170, effect.y - 110, 340, 48, P['world-tone-27']); caption(ctx, effect.text, effect.x, effect.y - 85, 19); }
    ctx.restore();
  }
  if(!state?.done&&familyOf(mission,beat())==='rescue-bridge'&&room()?.repairPlatforms[0]&&state?.placed?.length){const span=room().repairPlatforms[0];player.platforms.push({...span,id:'current-partial-bridge',width:span.width*state.placed.length/beat().view.slots});}
  return {
    update, draw, release,
    consumeActivity({includeMotion=true}={}){const active=activityPending||includeMotion&&(player.input.left||player.input.right||player.input.jump||Boolean(destination)||Boolean(motion));activityPending=false;return Boolean(active);},
    assets: () => {const residents=new Set([heroId,...missions.map(m=>m.residentId===heroId?m.residentAlternateId:m.residentId),...beats.flatMap(b=>(b.view.sceneObjects||[]).flatMap(o=>[o.residentId,o.appearance?.residentId,o.appearance?.landmark?.residentId]))]);return [LEARNING_SPRITES,PUZZLE_SPRITES,WORLD_MATERIALS,background,...getCampaignHeroAssets(heroId),...[...residents].flatMap(id=>[CAST[id]?.sprite,CAST[id]?.heroSprite,...getCampaignHeroAssets(id)]),...beats.flatMap(b=>[...(b.view.cards||[]).map(c=>c.anchorImage),...(b.view.items||[]).map(item=>item.image)])].filter(Boolean);},
    setInput(name, value) { activityPending=true;if(name==='analogX'){destination=null;route=[];analogSpeed=Math.abs(value);player.tuning.speed=(sprinting?470:340)*analogSpeed;setPlatformInput(player,{left:value<-.1,right:value>.1});return;}if(name==='sprint'){sprinting=value;player.tuning.speed=(sprinting?470:340)*analogSpeed;return;}if(!['left','right','jump'].includes(name))return;if(name!=='jump'){analogSpeed=1;player.tuning.speed=sprinting?470:340;}destination = null;route=[];setPlatformInput(player, { [name]: value }); },
    key(code, down) {
      activityPending=true;analogSpeed=1;player.tuning.speed=sprinting?470:340;
      if(['ShiftLeft','ShiftRight'].includes(code)){sprinting=down;player.tuning.speed=sprinting?470:340;return true;}
      const k = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump' }[code];
      if (k) { destination = null;route=[]; setPlatformInput(player, { [k]: down }); return true; }
      if (down && ['Enter', 'KeyE'].includes(code)) {
        const nearby=interaction();trigger(availableObjects().find(o=>o.id===nearby?.id));return true;
      }
      return false;
    },
    pointerDown(x, y) {
      const wx = x / scale + player.camera.x, wy = y / scale + player.camera.y;
      const o = availableObjects().find(o => Math.abs(o.x - wx) < (o.role === 'friend' ? 100 : 85) && wy < o.y + 15 && wy > o.y - (o.role==='destination'||o.role==='friend'?190:280));
      if (o) approach(o);
      else if(mission){destination={id:"walk",role:"walk",x:clamp(wx,30,room().originX+room().width-40),y:room().groundY};route=[];}
    },
    activate(id) { approach(availableObjects().find(o => o.id === id)); },
    confirm() { trigger(availableObjects().find(o => o.id === aim)); aim = null; },
    getObjects: () => availableObjects().map(({id,label,role,audio,sceneObject})=>({id,label:label||sceneObject?.label||'',role,audio})),
    getInteraction:interaction,
    setProgress() {},
    setState(next, nextIndex = index) { if(nextIndex!==index){for(let n=0;n<nextIndex;n++){restoreRoom(n);openTraversal(layout.rooms[n],true);}lastContact=null;destination=null;route=[];aim=null;projectiles=[];feedback=null;advancePending=false;cancelCampaignActionMotion(motion);motion=null;} state = next; index = nextIndex; if(next?.done)restoreRoom(index);
      player.platforms=player.platforms.filter(p=>p.id!=='current-partial-bridge');
      const span=room()?.repairPlatforms?.[0];
      if(!next?.done&&familyOf(mission,beat())==='rescue-bridge'&&span&&next?.placed?.length)player.platforms.push({...span,id:'current-partial-bridge',width:span.width*next.placed.length/beat().view.slots});
      actionLock = false; },
    applyOutcome(outcome) { activityPending=true;resolveCampaignActionMotion(motion,outcome);if(['complete','correct'].includes(outcome.type))heroAction={state:'celebrate',life:.7,id:++actionId};else if(outcome.type==='incorrect')heroAction={state:'sad',life:.5,id:++actionId};if(feedback)feedback={...feedback,life:reducedMotion?.3:.8,type:outcome.type};if (outcome.revealId) state = { ...state, revealedId: outcome.revealId };  },
    snapshot: () => platformSnapshot(player),
    debug: () => ({ motion:motion?{phase:motion.phase,position:{...motion.position},from:{...motion.from},to:{...motion.to},objectId:motion.objectId}:null,player: platformSnapshot(player), camera: { ...player.camera }, beatIndex: index, objects: availableObjects().map(({ id, x, y, label }) => ({ id, x, y, label })), hub:false,mode:'side',area,traversal:room()?.traversal ? {...room().traversal} : null }),
    dispose() { disposed = true; release();cancelCampaignActionMotion(motion);motion=null; projectiles = []; effects = []; }
  };
}

export function createCampaignWorldScene(options) {
  if(!options.mission)return createExplorationScene(options);
  let index=options.beatIndex||0,state=options.beatState,transition=0,scene;
  const make=position=>(usesMazeArea(options.beats[index])?createMazeAdventureScene:createPlatformAdventureScene)({...options,beatIndex:index,beatState:state,position});
  scene=make(options.position);
  return {
    update(dt){transition=Math.max(0,transition-dt);scene.update(dt);},
    draw(ctx,w,h){scene.draw(ctx,w,h);if(transition&&!options.reducedMotion){ctx.save();ctx.globalAlpha=transition/.32*.65;ctx.fillStyle=P['adventure-transition'];ctx.fillRect(0,0,w,h);ctx.restore();}},
    setState(next,nextIndex=index){state=next;if(nextIndex!==index){
      const before=options.beats[index],after=options.beats[nextIndex],sameArea=before.familyId===after.familyId&&before.sectionId===after.sectionId;
      if(sameArea&&!usesMazeArea(before)&&!usesMazeArea(after)){
        // Consecutive platform problems are rooms on the same physical route.
        // Keep the player's feet, camera and completed construction in place.
        index=nextIndex;scene.setState(next,index);
      }else{
        const position=sameArea&&usesMazeArea(before)&&usesMazeArea(after)?scene.snapshot():null;
        scene.dispose();index=nextIndex;scene=make(position);transition=.32;
      }
    }else scene.setState(next,index);},
    getPresentation:()=>usesMazeArea(options.beats[index])?'depth':'side',
    getArea:()=>activityAreaFor(options.beats[index]?.familyId||options.mission.familyId),
    assets:()=>[...new Set([...scene.assets(),LEARNING_SPRITES,PUZZLE_SPRITES,...Object.values(CAST).flatMap(c=>[c.sprite,c.heroSprite]),...options.beats.flatMap(b=>[...(b.view.cards||[]).map(c=>c.anchorImage),...(b.view.items||[]).map(i=>i.image),...(b.view.sceneObjects||[]).flatMap(o=>[o.residentId,o.appearance?.residentId,o.appearance?.landmark?.residentId].flatMap(getCampaignHeroAssets))])])].filter(Boolean),
    setInput:(...args)=>scene.setInput(...args),key:(...args)=>scene.key(...args),pointerDown:(...args)=>scene.pointerDown(...args),activate:id=>scene.activate(id),confirm:()=>scene.confirm(),
    getObjects:()=>scene.getObjects(),getInteraction:()=>scene.getInteraction?.()||null,setProgress:p=>scene.setProgress(p),applyOutcome:o=>scene.applyOutcome(o),snapshot:()=>scene.snapshot(),release:()=>scene.release(),consumeActivity:(...args)=>scene.consumeActivity(...args),debug:()=>scene.debug(),dispose:()=>scene.dispose()
  };
}
