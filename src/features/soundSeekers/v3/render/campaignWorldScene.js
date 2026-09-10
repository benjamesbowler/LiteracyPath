import { SOUND_SEEKERS_CAMPAIGN_PALETTE as P } from '../../visual/visualTokens.js';
import { createCampaignActionMotion,advanceCampaignActionMotion,resolveCampaignActionMotion,cancelCampaignActionMotion } from '../engine/campaignActionMotion.js';
import { drawCampaignActionMotion } from './campaignActionMotion.js';
import { drawCampaignRestoration } from './campaignRestoration.js';
import { HERO_ANIMATIONS, drawCampaignHero } from './campaignHeroes.js';
import { drawCampaignProp,campaignRelationPlacement,drawCampaignRelationForeground } from './campaignProps.js';
import { CAST } from '../content/cast.js';
import { getCampaignLayout, getCampaignHubLayout, getCampaignChoiceAnchors } from '../content/campaignLayouts.js';
import { MECHANICS } from '../engine/challenges.js';
import { createPlatformState, setPlatformInput, releasePlatformInput, advancePlatform, platformSnapshot } from '../engine/platformPhysics.js';
import { createPuppet, drawPuppet, getImage, tickPuppet } from './sprites.js';

const FAMILY_PROP = {'sound-steps':'stone','word-pop':'soap','rescue-bridge':'bridge','tree-rescue':'tree','pals-post':'parcel','sound-herd':'gate','river-route':'raft','sentence-express':'cart','fix-it-workshop':'tool','garden-kitchen':'towel','lantern-search':'lantern','story-rescue':'book'};
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
  ctx.fillStyle = world === 'moonwood' ? P['world-tone-4'] : world === 'dino' ? P['world-tone-5'] : P['world-tone-6'];
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.width, Math.max(28, r.height || 32), [12, 12, 3, 3]); ctx.fill();
  ctx.strokeStyle = world === 'moonwood' ? P['world-tone-7'] : P['world-tone-8']; ctx.lineWidth = 12;
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
export function createCampaignWorldScene({ stage, missions = [], mission = null, beats = [], beatIndex = 0, beatState = null, heroId, progress, isAvailable = () => true, onMission, onAction, onAdvance, onHear, onSound, onTravel, nextStage, onSavePosition, reducedMotion = false, simplifiedBackgrounds = false, position = null }) {
  const hub = !mission;
  const layout = hub ? getCampaignHubLayout(stage.id) : getCampaignLayout(mission.id,{beatCount:beats.length,beatFamilies:beats.map(b=>b.familyId)});
  const length = layout.bounds.right;
  const player = createPlatformState({...layout,snapshot:position,tuning:{width:48,height:90,speed:340,jumpSpeed:630},camera:{...layout.camera,width:1100,height:700}});
  if(!layout.camera.vertical)player.camera.y=0;
  const restoredRooms = new Set();
  function restoreRoom(n) {
    const r=layout.rooms?.[n];
    if (!r || restoredRooms.has(n)) return;
    player.platforms.push(...r.repairPlatforms); restoredRooms.add(n);
  }
  if (!hub) for(let n=0;n<beatIndex;n++)restoreRoom(n);
  if(beatState?.done)restoreRoom(beatIndex);
  const puppets = new Map();
  const heroPuppet = createPuppet();
  let time = 0, gaitTime=0, index = beatIndex, state = beatState, w = 1100, h = 700, scale = 1;
  let activityPending=false,route=[],motion=null,destination = null, aim = null, projectiles = [], effects = [], lastSave = 0;
  let lastContact=null;
  let actionLock = false, disposed = false, lastPlayerSnapshot = '';
  const background = layout.backdrop;
  const completed = () => progress?.campaign?.completedMissions || {};
  const beat = () => beats[index];
  const room = () => layout.rooms?.[index];
  const origin = () => (room()?.originX || 0) + 310;
  const levelY = () => room()?.exit.y ?? GROUND;
  const exitX = () => room()?.exit.x ?? 0;
  const nodes = hub ? layout.missionNodes.map(n=>({...n,mission:missions.find(m=>m.id===n.id)})) : [];
  function availableObjects() {
    if (hub) {const places=nodes.filter(n=>isAvailable(n.id)).map(n=>({...n,label:n.mission.title,role:'friend'}));if(completed()[stage.finaleMissionId]&&nextStage)places.push({id:'next-land',x:length-100,y:GROUND,label:`Explore ${nextStage.name}`,role:'portal'});return places;}
    if (state?.done) return [{ id: 'leave-room', x: exitX(), y: levelY(), label: index === beats.length - 1 ? 'Bring it home' : 'Follow the path', role: 'exit' }];
    const choices = choiceObjects(beat(), state);
    const anchors = getCampaignChoiceAnchors(room(),beat()?.view.tiles?.length || choices.length);
    const objects=choices.map((c,i)=>({...c,...anchors[c.slotIndex??i]}));
    if(['lantern-search','story-rescue'].includes(familyOf(mission,beat()))){const clue=room().objects.find(o=>o.id.includes('clue-one')||o.id.includes('message'));if(clue)objects.unshift({...clue,id:'inspect-clue',role:'clue',label:'Hear the clue'});}
    return objects;
  }
  function trigger(object) {
    activityPending=true;
    if (!object || disposed) return;
    lastContact=object.id;
    if (hub) { release(); if(object.role==='portal')onTravel?.(nextStage.id);else onMission?.(object.mission); return; }
    if (object.role === 'exit') { release(); onAdvance?.(); return; }
    if(object.role==='clue'){void onHear?.(beat().prompt.cues.map(c=>c.src).filter(Boolean),{kind:'clue'});effects.push({x:object.x,y:object.y-100,text:'Listen. Then explore.',life:3});return;}
    if (object.role === 'teach') {
      void onHear?.(object.audioSequence, { kind: 'teach', targetId: object.id });
      return;
    }
    if (actionLock || motion&&!['settled','returned','cancelled'].includes(motion.phase)) return;
    if (familyOf(mission, beat()) === 'word-pop') {
      onSound?.('launch');
      projectiles.push({ x: player.x, y: player.y - 65, target: { ...object }, age: 0 });
      actionLock = true;
    } else {
      const family=familyOf(mission,beat()),appearance=object.sceneObject?.appearance||{};
      const placement=appearance.relation&&appearance.landmark?campaignRelationPlacement({...appearance,size:125,objectKind:beat().view.objectId||appearance.kind}):null,offset=placement?.object||{x:0,y:-35,size:65};
      const from=beat().view.phase==='pickup'?{x:object.x,y:object.y}:family==='sound-herd'?{x:room().originX+170,y:room().groundY}:family==='sentence-express'||family==='fix-it-workshop'?{x:object.x,y:object.y}:{x:player.x,y:player.y-35};
      const to=beat().view.phase==='pickup'?{x:player.x+42*player.facing,y:player.y-35}:family==='sentence-express'?{x:origin()+(state.placed.length%6)*110,y:levelY()-Math.floor(state.placed.length/6)*140}:family==='fix-it-workshop'?{x:origin()+(beat().view.workshop?.slotIndex||state.placed.length)*104+48,y:levelY()-270}:{x:object.x+offset.x,y:object.y+(family==='river-route'?0:offset.y)};
      const item=beat().view.items?.[state?.itemIndex||0];
      motion=createCampaignActionMotion({familyId:family,action:object.action,from,to,objectId:family==='fix-it-workshop'?'tool':beat().view.objectId||object.sceneObject?.appearance?.kind||object.sceneObject?.icon||'',appearance:{...appearance,relation:null,landmark:null,size:offset.size},label:family==='sentence-express'||family==='fix-it-workshop'?object.label:family==='sound-herd'&&beat().view.mode==='read'?item?.word:'',reducedMotion});
      if(motion){onSound?.(beat().view.phase==='pickup'?'pickup':'route');release();actionLock=true;}else onAction?.(object.action);
    }
  }
  function approach(object) {
    activityPending=true;
    if (!object) return;
    if (object.role === 'choice' && beat()?.view.direction === 'letter-to-sound') { onHear?.([object.audio], { kind: 'option' }); aim = object.id; return; }
    if(!hub && familyOf(mission,beat())==='word-pop'&&Math.abs(object.x-player.x)<1000){trigger(object);return;}
    if(!hub&&familyOf(mission,beat())==='river-route'){trigger(object);return;}
    destination = object;
    route=(!hub&&familyOf(mission,beat())==='tree-rescue'||hub&&object.y<player.y-30)?(hub?layout.platforms:room().platforms).filter(p=>p.y<player.y-30&&p.y>=object.y&&p.x<=object.x&&(!hub||p.x>=object.x-Math.ceil((GROUND-object.y)/100)*220-230)).sort((a,b)=>b.y-a.y).map(p=>({x:clamp(object.x,p.x+65,p.x+p.width-65),y:p.y})):[];
    if (Math.abs(player.x - object.x) < 120 && Math.abs(player.y - object.y) < (familyOf(mission,beat())==='sound-steps'?25:150)) { destination = null; trigger(object); }
  }
  function release() { releasePlatformInput(player); destination = null;route=[]; }
  function update(dt) {
    if (disposed) return;
    time += dt;if(Math.abs(player.vx)>10)gaitTime+=dt*Math.abs(player.vx)/340;tickPuppet(heroPuppet, dt);
    if (destination) {
      const waypoint=route[0]||destination;
      const dx = waypoint.x - player.x;
      const needJump = route.length ? (player.grounded ? waypoint.y<player.y-30&&!player.input.jump : player.input.jump&&player.vy<0) : waypoint.y < player.y - 30 && !(player.grounded && player.input.jump);
      setPlatformInput(player, { left: dx < -35, right: dx > 35, jump: needJump });
      if(route.length&&Math.abs(dx)<45&&Math.abs(player.y-waypoint.y)<12&&player.grounded)route.shift();
      if (!route.length&&Math.abs(destination.x-player.x) < (familyOf(mission,beat())==='word-pop'?900:40) && Math.abs(player.y - destination.y) < (familyOf(mission,beat())==='sound-steps'?25:150)) { const target = destination; release(); trigger(target); }
    }
    if(!hub && familyOf(mission,beat())==='sound-steps' && !state?.done){
      for(const o of availableObjects()){
        const id=`choice-${index}-${o.id}`;
        if(!player.platforms.some(p=>p.id===id))player.platforms.push({id,x:o.x-65,y:o.y,width:130,height:20});
      }
    }
    const { events } = advancePlatform(player, dt);
    if(events.some(event=>event.type==='jump'))onSound?.('jump');
    if(!hub && familyOf(mission,beat())==='sound-steps' && !state?.done && player.grounded && (player.input.left||player.input.right||player.input.jump)){
      const landed=availableObjects().find(o=>Math.abs(o.x-player.x)<48&&Math.abs(o.y-player.y)<8);
      if(landed && events.some(e=>e.type==='land') && lastContact!==landed.id)trigger(landed);
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
    if (!hub && state?.done && player.x >= exitX() - 45 && Math.abs(player.y-levelY())<120) onAdvance?.();
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
    for(const r of player.platforms)if(inView(r))terrain(ctx,r,stage.worldId);
    // Ground dressing is quiet and outside the letters' reading plane.
    ctx.strokeStyle = GREEN; ctx.lineWidth = 3;
    if(!simplifiedBackgrounds)for (let x = Math.max(20,Math.floor(player.camera.x/127)*127); x < Math.min(length,player.camera.x+w/scale+127); x += 127) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x - 10, GROUND - 22, x - 20, GROUND - 24); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x + 3, GROUND - 20, x + 17, GROUND - 16); ctx.stroke(); }
    if (hub) {
      drawCampaignRestoration(ctx,{stage,layout,completed:completed(),time,reducedMotion});
      if(completed()[stage.finaleMissionId]&&nextStage){drawCampaignProp(ctx,'gate',length-100,GROUND,{size:180,open:true});board(ctx,length-225,GROUND-250,240,60,P['world-tone-19']);caption(ctx,'Next land →',length-105,GROUND-220,23);}
      for (const n of nodes) {
        const unlocked = isAvailable(n.id), done = Boolean(completed()[n.id]);
        const residentId = n.mission.residentId === heroId ? n.mission.residentAlternateId : n.mission.residentId;
        const resident = CAST[residentId];
        if (!puppets.has(n.id)) puppets.set(n.id, createPuppet());
        const actor = n.id === stage.missionIds[0] || n.mission.kind==='optional';
        if(actor)drawPuppet(ctx, getImage(resident?.sprite), { x: n.x, y: n.y, height: 112, t: reducedMotion ? 0 : time + n.x, state:'idle',puppet:puppets.get(n.id),alpha:unlocked?1:.65,src:resident?.sprite });
        else drawCampaignProp(ctx,FAMILY_PROP[n.mission.familyId],n.x,n.y,{size:140,filled:done});
        const label = actor ? (resident?.name || 'Friend') : n.mission.title;
        board(ctx,n.x-120,n.y-185,240,58,done?P['world-tone-12']:CREAM);
        caption(ctx,label,n.x,n.y-156,label.length>20?15:19);
        if(done)caption(ctx,'✓',n.x+90,n.y-100,26,P['world-tone-13']);
        if (unlocked && !done) { ctx.fillStyle = P['world-tone-14']; ctx.beginPath(); ctx.arc(n.x + 61, n.y - 87 + Math.sin(time * 2) * (reducedMotion ? 0 : 4), 17, 0, Math.PI * 2); ctx.fill(); caption(ctx, '!', n.x + 61, n.y - 85, 23); }
      }
    } else {
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
        if(object.role==='clue'){drawCampaignProp(ctx,'lantern',object.x,object.y,{size:110,filled:true});board(ctx,object.x-95,object.y-170,190,48);caption(ctx,'Hear the clue',object.x,object.y-145,18);continue;}
        if (object.role === 'exit') {
          ctx.fillStyle = P['world-tone-18']; ctx.fillRect(object.x - 6, object.y - 180, 12, 180); board(ctx, object.x - 105, object.y - 175, 210, 58, P['world-tone-19']); caption(ctx, '→', object.x, object.y - 147, 40); continue;
        }
        if(object.role==='destination' && object.sceneObject) {
          const semantic=object.sceneObject || object;
          const appearance=semantic.appearance || object.appearance || {};
          const openingIcons={'button-small':'button','button-large':'button','little':'button','large':'button','shade':'seat','sun':'seat','pond':'seat'};
          const kind=appearance.kind || semantic.kind || semantic.icon || openingIcons[object.icon] || object.icon;
          if(b.view.phase==='delivery' && appearance.relation && appearance.landmark){
            const placement=campaignRelationPlacement({...appearance,size:125,objectKind:b.view.objectId}),host=placement.landmark,offset=placement.object;
            drawCampaignProp(ctx,host.kind,object.x+host.x,object.y+host.y,{...host});
            ctx.setLineDash([7,6]);ctx.lineWidth=3;ctx.strokeStyle=P['world-tone-20'];ctx.beginPath();ctx.ellipse(object.x+offset.x,object.y+offset.y,Math.max(20,offset.size*.55),Math.max(10,offset.size*.25),0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
          }else drawCampaignProp(ctx,kind,object.x,object.y,{size:125,...appearance});
          const ownerId=semantic.residentId||appearance.residentId||appearance.landmark?.residentId;
          if(ownerId)drawPuppet(ctx,getImage(CAST[ownerId]?.sprite),{x:object.x+50,y:object.y-100,height:55,state:'idle',src:CAST[ownerId]?.sprite});
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
    if(!hub&&familyOf(mission,beat())==='river-route'&&!motion)drawCampaignProp(ctx,'raft',player.x,player.y+12,{size:135});
    drawCampaignActionMotion(ctx,motion);
    const cast = CAST[heroId] || CAST.speedy, src = cast.heroSprite || cast.sprite;
    const heroState=!hub&&familyOf(mission,beat())==='river-route'?'idle':player.grounded?(Math.abs(player.vx)>10?'walk':'idle'):(player.vy<0?'jump':'fall');
    if(!drawCampaignHero(ctx,heroId,{x:player.x,y:player.y,height:112,facing:player.facing,time:heroState==='walk'?gaitTime:time,state:heroState,reducedMotion}))
      drawPuppet(ctx,getImage(src),{x:player.x,y:player.y,height:112,facing:player.facing,t:reducedMotion?0:time,state:heroState,puppet:heroPuppet,src});
    const carrying = !hub && !motion && !state?.done && beat()?.view.phase !== 'pickup' && beat()?.view.objectId;
    if(carrying)drawCampaignProp(ctx,carrying,player.x+42*player.facing,player.y-35,{size:48});
    for (const effect of effects) { board(ctx, effect.x - 170, effect.y - 110, 340, 48, P['world-tone-27']); caption(ctx, effect.text, effect.x, effect.y - 85, 19); }
    ctx.restore();
  }
  if(!hub&&!state?.done&&familyOf(mission,beat())==='rescue-bridge'&&room()?.repairPlatforms[0]&&state?.placed?.length){const span=room().repairPlatforms[0];player.platforms.push({...span,id:'current-partial-bridge',width:span.width*state.placed.length/beat().view.slots});}
  return {
    update, draw, release,
    consumeActivity({includeMotion=true}={}){const active=activityPending||includeMotion&&(player.input.left||player.input.right||player.input.jump||Boolean(destination)||Boolean(motion));activityPending=false;return Boolean(active);},
    assets: () => {const residents=new Set([heroId,...missions.map(m=>m.residentId===heroId?m.residentAlternateId:m.residentId),...beats.flatMap(b=>(b.view.sceneObjects||[]).flatMap(o=>[o.residentId,o.appearance?.residentId,o.appearance?.landmark?.residentId]))]);return [background,HERO_ANIMATIONS[heroId]?.src,...[...residents].flatMap(id=>[CAST[id]?.sprite,CAST[id]?.heroSprite]),...beats.flatMap(b=>[...(b.view.cards||[]).map(c=>c.anchorImage),...(b.view.items||[]).map(item=>item.image)])].filter(Boolean);},
    setInput(name, value) { activityPending=true;destination = null;route=[]; setPlatformInput(player, { [name]: value }); },
    key(code, down) {
      activityPending=true;
      const k = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump' }[code];
      if (k) { destination = null;route=[]; setPlatformInput(player, { [k]: down }); return true; }
      if (down && ['Enter', 'KeyE'].includes(code)) {
        const objects = availableObjects();
        const nearest = objects.filter(o => Math.abs(o.x - player.x) < 180 && Math.abs(o.y - player.y) < 250).sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))[0];
        trigger(aim ? objects.find(o => o.id === aim) : nearest); return true;
      }
      return false;
    },
    pointerDown(x, y) {
      const wx = x / scale + player.camera.x, wy = y / scale + player.camera.y;
      const o = availableObjects().find(o => Math.abs(o.x - wx) < (o.role === 'friend' ? 100 : 85) && wy < o.y + 15 && wy > o.y - (o.role==='destination'||o.role==='friend'?190:280));
      if (o) approach(o);
    },
    activate(id) { approach(availableObjects().find(o => o.id === id)); },
    confirm() { trigger(availableObjects().find(o => o.id === aim)); aim = null; },
    getObjects: () => availableObjects().map(({id,label,role,audio,sceneObject})=>({id,label:label||sceneObject?.label||'',role,audio})),
    setProgress(p) { progress = p; },
    setState(next, nextIndex = index) { if(nextIndex!==index){for(let n=0;n<nextIndex;n++)restoreRoom(n);lastContact=null;destination=null;route=[];aim=null;projectiles=[];cancelCampaignActionMotion(motion);motion=null;} state = next; index = nextIndex; if(next?.done)restoreRoom(index);
      player.platforms=player.platforms.filter(p=>p.id!=='current-partial-bridge');
      const span=room()?.repairPlatforms?.[0];
      if(!next?.done&&familyOf(mission,beat())==='rescue-bridge'&&span&&next?.placed?.length)player.platforms.push({...span,id:'current-partial-bridge',width:span.width*next.placed.length/beat().view.slots});
      actionLock = false; },
    applyOutcome(outcome) { activityPending=true;resolveCampaignActionMotion(motion,outcome);if (outcome.revealId) state = { ...state, revealedId: outcome.revealId };  },
    snapshot: () => platformSnapshot(player),
    debug: () => ({ motion:motion?{phase:motion.phase,position:{...motion.position},from:{...motion.from},to:{...motion.to},objectId:motion.objectId}:null,player: platformSnapshot(player), camera: { ...player.camera }, beatIndex: index, objects: availableObjects().map(({ id, x, y, label }) => ({ id, x, y, label })), hub }),
    dispose() { disposed = true; release();cancelCampaignActionMotion(motion);motion=null; projectiles = []; effects = []; }
  };
}
