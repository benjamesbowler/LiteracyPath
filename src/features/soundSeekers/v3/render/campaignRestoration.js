// Persistent narrative scenery. Only completed main mission IDs install parts;
// target evidence, mastery and optional-quest counts never enter this renderer.
import { drawCampaignProp } from './campaignProps.js';
import { CAMPAIGN_STAGES } from '../content/campaign.js';
import { CAMPAIGN_STAGE_LAYOUTS } from '../content/campaignLayouts.js';

const p = (kind, x, y, size = 80, appearance = {}) => ({ kind, x, y, size, ...appearance });
const job = (missionNumber, before, after) => ({ missionNumber, before, after });
// Coordinates are local to the authored hub landmark, x centre / y feet.
// Each five-part row follows the actual stage mission outcomes. Supplies remain
// visible at their recovery positions before the corresponding job is done.
const rows = [
  ['meadow-01', [p('tree',-170,0,210),p('tray',120,-5,110)], [
    job(1,[p('bucket',-240,0,70)],[p('bucket',15,0,150)]),
    job(2,[p('soap',-105,-165,45)],[p('soap',120,-25,45)]),
    job(3,[p('mat',200,0,75)],[p('mat',15,10,210)]),
    job(4,[p('towel',-75,0,65)],[p('rail',205,0,110),p('towel',205,-12,60)]),
    job(5,[],[p('bucket',15,0,150,{filled:true}),p('brush',-75,0,70),p('cloth',110,-24,38)])]],
  ['meadow-02',[p('fern',-210,0,130),p('bed',0,0,180)], [
    job(1,[p('blanket',-170,-100,75)],[p('blanket',0,-37,125)]),
    job(2,[p('basket',170,0,80)],[p('basket',-130,0,80),p('pillow',-130,-37,60)]),
    job(3,[p('plank',220,0,95)],[p('ramp',120,0,150)]),
    job(4,[p('pillow',-240,0,65)],[p('pillow',-48,-75,65)]),
    job(5,[p('roof',205,-45,70)],[p('post',-90,0,175),p('post',90,0,175),p('roof',0,-145,245),p('lantern',160,-55,55)])]],
  ['meadow-03',[p('stone',-180,0,130),p('stone',100,0,160)], [
    job(1,[p('egg',-230,0,45)],[p('egg',-90,0,45,{supersededOnFinal:true})]),
    job(2,[p('plank',-50,0,120)],[p('ramp',-40,0,170)]),
    job(3,[p('stick',165,-120,80)],[p('nest',100,-110,130)]),
    job(4,[p('sign',220,0,65)],[p('sign',-160,0,75)]),
    job(5,[],[p('egg',100,-133,45),p('feather',155,-120,40)])]],
  ['meadow-04',[p('pond',0,10,290),p('bank',-205,0,120),p('bank',205,0,120)], [
    job(1,[p('plank',-235,-12,70)],[p('bridge',0,0,285)]),
    job(2,[p('stone',230,0,70)],[p('stone',-105,0,85),p('stone',105,0,85)]),
    job(3,[p('basket',230,-65,65)],[p('basket',-220,-35,65)]),
    job(4,[p('letter',180,-120,55)],[p('post',-145,-20,75),p('letter',-145,-63,38)]),
    job(5,[],[p('flag',-205,-70,85),p('flag',205,-70,85)])]],
  ['meadow-05',[p('hedge',-175,0,145),p('hedge',175,0,145)], [
    job(1,[p('stick',-45,0,95),p('root',40,0,90)],[p('path',0,8,160)]),
    job(2,[p('beam',-235,0,110)],[p('gate',0,0,180,{open:true})]),
    job(3,[p('plank',230,0,100)],[p('ramp',-105,0,125)]),
    job(4,[p('blanket',175,-115,60)],[p('blanket',175,0,115)]),
    job(5,[],[p('basket',185,-25,60),p('flower',-160,-25,55)])]],
  ['meadow-06',[p('ledge',90,-120,165),p('post',-55,0,195)], [
    job(1,[p('basket',90,-155,70)],[p('basket',-80,-95,70,{supersededOnFinal:true})]),
    job(2,[p('handle',-215,0,60)],[p('wheel',-55,-70,80)]),
    job(3,[p('crate',230,0,70)],[p('crate',135,0,75),p('bag',200,0,60)]),
    job(4,[p('letter',-160,0,55)],[p('sign',-195,0,90),p('letter',-195,-45,35)]),
    job(5,[],[p('rope',-55,-80,120),p('basket',-55,0,95,{accessory:'carrot'})])]],
  ['meadow-07',[p('pond',0,10,290),p('lily',-90,0,70),p('lily',90,0,70)], [
    job(1,[p('crate',215,0,65),p('basket',-210,0,65)],[p('crate',-195,0,65),p('basket',195,0,65)]),
    job(2,[p('plank',-245,0,80)],[p('dock',-160,0,120),p('dock',160,0,120)]),
    job(3,[p('parcel',140,-65,60)],[p('parcel',-220,-42,60)]),
    job(4,[p('sign',50,0,70)],[p('sign',-170,-45,80),p('sign',170,-45,80)]),
    job(5,[],[p('raft',0,0,150),p('basket',0,-23,50)])]],
  ['meadow-08',[p('bench',0,0,230),p('pond',-220,5,100)], [
    job(1,[p('basket',230,0,75)],[p('basket',-180,0,80,{accessory:'apple'})]),
    job(2,[p('plate',150,0,55),p('cup',-90,0,45)],[p('plate',-50,-100,75),p('cup',30,-100,45)]),
    job(3,[p('seat',210,-70,65)],[p('seat',-120,0,90),p('seat',120,0,90)]),
    job(4,[p('letter',-235,-55,45)],[p('letter',85,-100,45),p('bread',-50,-115,50)]),
    job(5,[],[p('cloth',0,-102,170),p('plate',-48,-108,65),p('apple',48,-110,40)])]],
  ['meadow-09',[p('wheel',100,0,180),p('ledge',-100,-165,140)], [
    job(1,[p('plank',-230,0,80)],[p('ladder',-120,0,210)]),
    job(2,[p('cushion',-100,-200,60)],[p('cushion',-190,0,70)]),
    job(3,[p('handle',230,0,55)],[p('handle',100,-80,65)]),
    job(4,[p('sign',-10,0,70)],[p('sign',210,0,80)]),
    job(5,[],[p('basket',-195,0,100,{accessory:'blanket'}),p('flower',200,-10,55)])]],
  ['meadow-10',[p('pond',0,10,290),p('post',-160,0,100),p('post',160,0,100)], [
    job(1,[p('flag',-220,0,70)],[p('flag',-160,-85,90)]),
    job(2,[p('beam',-70,0,100)],[p('gate',0,0,170,{open:true})]),
    job(3,[p('sign',210,0,70)],[p('sign',160,-65,85)]),
    job(4,[p('letter',85,0,55)],[p('post',-230,0,80),p('letter',-230,-42,45)]),
    job(5,[],[p('raft',0,0,170),p('basket',60,-10,65),p('flag',160,-100,95)])]],
  ['dino-11',[p('rock',-200,0,125),p('post',0,0,170)], [
    job(1,[p('sign',0,-120,110,{direction:'left'})],[p('sign',0,-120,110,{direction:'right'})]),
    job(2,[p('parcel',-230,-80,75)],[p('parcel',145,0,75)]),
    job(3,[p('beam',215,0,85)],[p('beam',0,-30,95)]),
    job(4,[p('scroll',-100,0,60)],[p('scroll',0,-60,60)]),
    job(5,[],[p('path',130,10,220),p('flag',220,0,100)])]],
  ['dino-12',[p('stone',-160,0,125),p('stone',160,0,125)], [
    job(1,[p('blanket',225,0,65)],[p('bed',0,0,145),p('blanket',0,-25,100)]),
    job(2,[p('beam',-210,-95,80)],[p('post',-90,0,185),p('post',90,0,185)]),
    job(3,[p('roof',200,-80,85)],[p('roof',0,-150,240)]),
    job(4,[p('sign',-45,0,70)],[p('sign',-205,0,85)]),
    job(5,[],[p('pillow',-38,-62,65),p('lantern',160,-100,55)])]],
  ['dino-13',[p('path',-100,5,160),p('path',100,5,160)], [
    job(1,[p('parcel',-230,0,65)],[p('parcel',170,0,65)]),
    job(2,[p('plank',-70,0,85)],[p('ramp',-140,0,130)]),
    job(3,[p('letter',60,0,50)],[p('post',0,0,105),p('letter',0,-60,50)]),
    job(4,[p('card',230,0,45)],[p('card',170,-45,40)]),
    job(5,[],[p('cart',170,0,160),p('parcel',170,-65,65),p('flag',-165,0,100)])]],
  ['dino-14',[p('rock',-195,0,130),p('rock',195,0,130),p('post',-155,-90,130)], [
    job(1,[p('plank',-225,0,90)],[p('bridge',0,0,295)]),
    job(2,[p('rope',220,-90,80)],[p('rope',-155,-60,135),p('stone',-150,-80,65)]),
    job(3,[p('sign',85,0,70)],[p('sign',185,-95,90)]),
    job(4,[p('basket',-75,0,60)],[p('basket',215,-30,70)]),
    job(5,[],[p('blanket',205,0,115),p('basket',215,-20,65),p('flag',-190,-100,95)])]],
  ['dino-15',[p('rock',-220,0,140),p('rock',220,0,140)], [
    job(1,[p('card',-150,-70,50)],[p('sign',-160,0,120),p('card',-160,-65,50)]),
    job(2,[p('handle',120,0,65)],[p('lever',-100,0,100)]),
    job(3,[p('sign',20,0,80,{direction:'left'})],[p('sign',210,-100,85,{direction:'right'})]),
    job(4,[p('plank',-240,0,75)],[p('bridge',20,0,250)]),
    job(5,[],[p('gate',20,0,210,{open:true}),p('flag',-210,-90,85)])]],
  ['dino-16',[p('post',0,0,215)], [
    job(1,[p('sign',-210,0,80)],[p('sign',-185,0,95)]),
    job(2,[p('beam',120,0,100)],[p('beam',0,-160,180)]),
    job(3,[p('letter',220,0,50)],[p('post',165,0,100),p('letter',165,-55,50)]),
    job(4,[p('scroll',-100,0,60)],[p('scroll',0,-65,65)]),
    job(5,[],[p('flag',-65,-155,100),p('flag',65,-155,100),p('lever',85,0,85)])]],
  ['dino-17',[p('shelf',-115,0,175),p('shelf',115,0,175)], [
    job(1,[p('crate',-240,0,65)],[p('crate',-115,-35,70)]),
    job(2,[p('letter',40,0,45)],[p('letter',-115,-108,50)]),
    job(3,[p('basket',225,0,65)],[p('basket',115,-35,70)]),
    job(4,[p('sign',-20,0,70)],[p('sign',0,-160,100)]),
    job(5,[],[p('parcel',115,-112,65),p('bag',-115,-110,55)])]],
  ['dino-18',[p('bench',0,0,220),p('post',185,0,120)], [
    job(1,[p('plank',-215,0,85)],[p('sign',-195,0,120)]),
    job(2,[p('sign',185,-70,100,{direction:'left'})],[p('sign',185,-70,100,{direction:'right'})]),
    job(3,[p('card',100,0,50)],[p('card',0,-95,60)]),
    job(4,[p('brush',-60,0,65)],[p('brush',-55,-95,65),p('paint',50,-95,60)]),
    job(5,[],[p('sign',0,-90,140),p('flower',210,0,55)])]],
  ['dino-19',[p('path',0,10,300),p('post',-205,0,95)], [
    job(1,[p('cart',-70,0,135)],[p('cart',90,0,150)]),
    job(2,[p('sign',-205,-50,75,{direction:'left'})],[p('sign',-205,-50,75,{direction:'right'})]),
    job(3,[p('card',215,0,55)],[p('card',90,-65,55)]),
    job(4,[p('letter',-140,0,50)],[p('letter',-205,-30,45)]),
    job(5,[],[p('cart',-85,0,150),p('crate',-85,-55,65),p('crate',90,-55,65)])]],
  ['dino-20',[p('bank',-220,0,130),p('bank',220,0,130),p('post',0,0,130)], [
    job(1,[p('plank',-230,-45,85)],[p('bridge',-105,0,185)]),
    job(2,[p('scroll',180,-90,60)],[p('sign',-220,-65,100),p('scroll',-220,-120,45)]),
    job(3,[p('beam',120,0,95)],[p('bridge',105,0,185)]),
    job(4,[p('handle',-85,0,55)],[p('lever',-160,0,95)]),
    job(5,[],[p('cart',110,-30,125),p('crate',110,-77,55),p('flag',220,-90,100)])]],
  ['moonwood-21',[p('pond',0,10,290),p('reed',-220,0,140),p('reed',220,0,140)], [
    job(1,[p('plank',-235,-30,80)],[p('bridge',0,0,280)]),
    job(2,[p('sign',110,0,70)],[p('sign',-175,-30,90)]),
    job(3,[p('lantern',-80,0,55)],[p('lantern',175,-50,75)]),
    job(4,[p('basket',230,-80,65)],[p('basket',-220,-25,65)]),
    job(5,[],[p('dock',150,0,150),p('camp',185,-30,130)])]],
  ['moonwood-22',[p('stone',-200,0,120),p('ledge',160,-170,160)], [
    job(1,[p('cover',210,-200,60)],[p('stair',0,0,250)]),
    job(2,[p('basket',-230,-80,65)],[p('basket',-180,0,65)]),
    job(3,[p('letter',90,0,50)],[p('shelf',-80,0,110),p('letter',-80,-55,45)]),
    job(4,[p('lantern',60,0,60)],[p('lantern',20,-100,65),p('lantern',140,-185,65)]),
    job(5,[],[p('rail',80,-120,160),p('flag',200,-190,75)])]],
  ['moonwood-23',[p('pond',0,10,285),p('reed',-215,0,120)], [
    job(1,[p('sign',-175,-50,85,{direction:'left'})],[p('sign',-175,-50,85,{direction:'right'})]),
    job(2,[p('reflector',30,0,100)],[p('reflector',150,-40,125)]),
    job(3,[p('letter',215,0,50)],[p('post',-80,0,95),p('letter',-80,-52,45)]),
    job(4,[p('stone',-235,0,65)],[p('path',0,0,215)]),
    job(5,[],[p('reflector',-20,-35,110),p('lantern',175,-145,70)])]],
  ['moonwood-24',[p('bench',0,0,230),p('shell',-230,0,95)], [
    job(1,[p('basket',225,0,65)],[p('boat',-170,0,125),p('basket',-170,-35,55)]),
    job(2,[p('crate',-130,0,65)],[p('crate',170,0,80)]),
    job(3,[p('scroll',220,-90,55)],[p('scroll',-55,-103,55)]),
    job(4,[p('card',60,0,45)],[p('card',170,-65,45)]),
    job(5,[],[p('tool',15,-102,65),p('brush',70,-103,55),p('paint',120,-102,55)])]],
  ['moonwood-25',[p('post',0,0,240),p('pond',0,10,290)], [
    job(1,[p('lantern',-150,0,65)],[p('lantern',0,-190,100)]),
    job(2,[p('sign',100,0,70)],[p('sign',-185,-30,95)]),
    job(3,[p('crate',225,0,65)],[p('dock',165,0,150),p('crate',175,-32,65)]),
    job(4,[p('letter',-70,0,50)],[p('letter',-185,-80,45)]),
    job(5,[],[p('roof',0,-240,160),p('boat',-90,5,160),p('flag',185,-80,95)])]],
  ['moonwood-26',[p('root',-190,0,150),p('garden',195,0,150)], [
    job(1,[p('beam',-220,-75,90)],[p('bridge',0,0,270)]),
    job(2,[p('pot',80,0,65)],[p('pot',200,-50,70)]),
    job(3,[p('sign',-50,0,70)],[p('sign',-170,-30,85)]),
    job(4,[p('seed',-230,0,45)],[p('flower',200,-75,85),p('pot',135,0,65)]),
    job(5,[],[p('gate',0,0,195,{open:true}),p('flower',135,-28,65)])]],
  ['moonwood-27',[p('tree',-215,0,210),p('tree',215,0,210)], [
    job(1,[p('sign',-140,0,85,{direction:'left'})],[p('sign',-170,-25,85,{direction:'right'})]),
    job(2,[p('plank',50,0,105)],[p('bridge',0,0,305)]),
    job(3,[p('crate',-230,0,65),p('crate',210,-120,85)],[p('crate',140,-28,85),p('crate',215,-28,65)]),
    job(4,[p('scroll',-70,0,55)],[p('scroll',-170,-70,50)]),
    job(5,[],[p('cart',70,-18,155),p('bag',70,-85,65),p('rail',-20,-35,170)])]],
  ['moonwood-28',[p('room',0,0,240),p('ledge',190,-130,130)], [
    job(1,[p('frame',215,-165,65)],[p('stair',-150,0,175)]),
    job(2,[p('gem',-215,0,50)],[p('window',0,-90,95)]),
    job(3,[p('handle',-70,0,55)],[p('handle',85,-90,60)]),
    job(4,[p('cover',215,0,70)],[p('frame',0,-210,135)]),
    job(5,[],[p('dome',0,-85,245),p('lantern',-165,-105,65)])]],
  ['moonwood-29',[p('shelf',-125,0,170),p('shelf',125,0,170)], [
    job(1,[p('book',-225,0,65)],[p('book',-125,-105,65)]),
    job(2,[p('card',215,0,55)],[p('card',125,-105,55)]),
    job(3,[p('scroll',-45,0,60)],[p('scroll',-125,-35,60),p('scroll',125,-35,60)]),
    job(4,[p('letter',50,0,55)],[p('letter',0,-80,65),p('post',0,0,120)]),
    job(5,[],[p('roof',0,-175,305),p('lantern',0,-195,70)])]],
  ['moonwood-30',[p('bank',-220,0,120),p('bank',220,0,120)], [
    job(1,[p('sign',-200,-70,80,{direction:'left'})],[p('sign',-200,-70,80,{direction:'right'})]),
    job(2,[p('plank',-80,0,90)],[p('bridge',0,0,310)]),
    job(3,[p('letter',210,-100,50)],[p('post',-130,-25,85,{worldId:'meadow'}),p('post',0,-25,85,{worldId:'dino'}),p('post',130,-25,85,{worldId:'moonwood'})]),
    job(4,[p('scroll',80,0,60)],[p('scroll',-200,-125,55)]),
    job(5,[],[p('flag',-210,-130,95),p('flag',210,-130,95),p('lantern',0,-140,100)])]]
];

function freeze(value) { if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value; }
export const CAMPAIGN_RESTORATIONS = freeze(Object.fromEntries(rows.map(([stageId,base,jobs]) => {
  const stage=CAMPAIGN_STAGES.find(s=>s.id===stageId), place=CAMPAIGN_STAGE_LAYOUTS.find(p=>p.stageId===stageId);
  return [stageId,{stageId,landmark:place.landmark,problem:stage.problem,base,jobs:jobs.map(j=>({...j,missionId:stage.missionIds[j.missionNumber-1]}))}];
})));
const hasCompleted = (completed,id) => completed instanceof Set ? completed.has(id) : Array.isArray(completed) ? completed.includes(id) : Object.prototype.hasOwnProperty.call(completed||{},id)&&Boolean(completed[id]);
export function getCampaignRestorationState(stageId,completed={}) {
  const plan=CAMPAIGN_RESTORATIONS[stageId];if(!plan)return null;
  const done=plan.jobs.map(j=>hasCompleted(completed,j.missionId));
  // A forged finale ID alone cannot depict a completed restoration.
  done[4]=done.every(Boolean);
  return {stageId,completedCount:done.filter(Boolean).length,fullyRestored:done.every(Boolean),
    props:[...plan.base.map(prop=>({...prop,installed:true})),...plan.jobs.flatMap((j,i)=>(done[i]?j.after:j.before).map(prop=>({...prop,missionId:j.missionId,installed:done[i]}))).filter(prop=>!(done[4]&&prop.supersededOnFinal))]};
}

export function drawCampaignRestoration(ctx,{stage,layout,completed={},time=0,reducedMotion=false}={}) {
  const state=getCampaignRestorationState(typeof stage==='string'?stage:stage?.id,completed);if(!state||!layout)return null;
  const landmark=layout.objects?.find(o=>o.id==='landmark');
  const footprint=layout.repairFootprint;
  const x=landmark?.x??footprint?.x??0,y=landmark?.y??((footprint?.y??0)+(footprint?.height??0));
  // Keep the composition tied to its authored footprint without making later
  // props so small that their repaired state becomes unreadable.
  const scale=Math.max(.9,Math.min(1.12,(footprint?.width||520)/520));
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  let drawnProps=0;
  for(const prop of state.props){const {kind,x:px,y:py,...appearance}=prop;
    const sway=!reducedMotion&&state.fullyRestored&&kind==='flag'?Math.sin(time/650+px)*1.5:0;
    if(drawCampaignProp(ctx,kind,px+sway,py,appearance))drawnProps++;
  }
  ctx.restore();return {...state,drawnProps};
}
