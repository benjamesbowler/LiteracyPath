import { openingSceneAppearance } from '../content/campaignLanguage.js';
import { createActivityMaze,advanceMazeWalker,mazePath,mazeBlocked,MAZE_CELL } from '../engine/mazeAdventure.js';
import { drawPuppet,getImage } from './sprites.js';
import { CAST } from '../content/cast.js';
import { HERO_ANIMATIONS,drawCampaignHero } from './campaignHeroes.js';
import { LEARNING_SPRITES,PUZZLE_SPRITES,drawPuzzleSprite } from './puzzleSprites.js';
import { WORLD_MATERIALS,worldMaterial } from './illustratedWorldArt.js';
import { drawCampaignProp,campaignRelationPlacement } from './campaignProps.js';
import { getCampaignHubLayout } from '../content/campaignLayouts.js';
import { activityAreaFor } from '../content/activityAreas.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createMazeAdventureScene({stage,beats,beatIndex=0,beatState,heroId,position,onAction,onAdvance,onHear,onSound,onSavePosition,reducedMotion=false}){
  const beat=beats[beatIndex],maze=createActivityMaze(beat.id,beatIndex%3),checkpoint=`maze:${beat.id}`,background=getCampaignHubLayout(stage.id).backdrop;
  const player={...maze.spawn,vx:0,vy:0,facing:1,input:{left:false,right:false,up:false,down:false},path:[]};
  if(position?.lastCheckpointId===checkpoint&&!mazeBlocked(maze,position.x,position.y))Object.assign(player,{x:position.x,y:position.y});
  let state=beatState,time=0,width=1100,height=730,scale=1,disposed=false,destination=null,activity=false,lastSave=0,hop=0;
  const camera={x:Math.max(-100,player.x-500),y:Math.max(-220,player.y*.68-350)};
  const objects=()=>state?.done?[{id:'leave-room',...maze.spawn,role:'exit',label:'Leave the maze'}]:[{id:'inspect-clue',...maze.spawn,role:'clue',label:'Hear the clue'},...(beat.view.choices||[]).map((c,i)=>({...c,...maze.destinations[i],role:'destination',label:c.label||beat.view.sceneObjects?.find(o=>o.id===c.icon)?.label||'Explore this place',sceneObject:beat.view.sceneObjects?.find(o=>o.id===c.icon)}))];
  const snapshot=()=>({v:1,x:player.x,y:player.y,vx:0,vy:0,facing:player.facing,recoveries:0,lastCheckpointId:checkpoint});
  function release(){for(const k of Object.keys(player.input))player.input[k]=false;player.analogX=0;player.analogY=0;player.sprint=false;player.vx=0;player.vy=0;player.path=[];destination=null;}
  function trigger(o){if(!o||disposed)return;release();activity=true;if(o.role==='exit')onAdvance?.();else if(o.role==='clue')onHear?.(beat.prompt.cues.map(c=>c.src).filter(Boolean),{kind:'clue'});else{onSound?.('place');onAction?.({type:'CHOOSE',choiceId:o.id});}}
  const nearest=()=>objects().find(o=>Math.hypot(o.x-player.x,o.y-player.y)<115);
  function approach(o){if(!o)return;destination=o;player.path=mazePath(maze,player,o);activity=true;}
  function input(k,v){activity=true;if(k in player.input){player.input[k]=v;player.path=[];destination=null;}else if(k==='analogX'||k==='analogY'){player[k]=v;if(Math.abs(v)>.1){player.path=[];destination=null;}}else if(k==='sprint')player.sprint=v;else if(k==='jump'&&v)hop=.5;}
  return {
    update(dt){if(disposed)return;time+=dt;hop=Math.max(0,hop-dt);advanceMazeWalker(player,maze,dt);if(destination&&Math.hypot(destination.x-player.x,destination.y-player.y)<65)trigger(destination);
      const k=reducedMotion?1:1-Math.exp(-8*dt);camera.x+=(clamp(player.x-width/scale*.5,-100,Math.max(-100,maze.width-width/scale+100))-camera.x)*k;camera.y+=(clamp(player.y*.68-height/scale*.5,-220,Math.max(-220,maze.height*.68-height/scale+220))-camera.y)*k;
      if(time-lastSave>1.5){lastSave=time;onSavePosition?.(snapshot());}},
    draw(c,w,h){width=w;height=h;scale=clamp(h/800,.6,1.15);c.clearRect(0,0,w,h);c.fillStyle='#274b46';c.fillRect(0,0,w,h);const bg=getImage(background);if(bg){c.globalAlpha=.3;c.drawImage(bg,0,0,w,h);c.globalAlpha=1;}
      c.save();c.scale(scale,scale);c.translate(-camera.x,-camera.y);
      c.fillStyle=worldMaterial(c,stage.worldId,'path')||'#a7976c';c.fillRect(-300,-300,maze.width+600,maze.height*.68+600);
      const entries=[];for(let y=0;y<maze.rows;y++)for(let x=0;x<maze.cols;x++)if(maze.grid[y][x])entries.push({y:(y+1)*MAZE_CELL,draw:()=>{drawPuzzleSprite(c,'hedge',(x+.5)*MAZE_CELL,(y+1)*MAZE_CELL*.68,MAZE_CELL+18);}});
      for(const o of objects())entries.push({y:o.y,draw:()=>{const yy=o.y*.68;
        if(o.role==='exit')drawPuzzleSprite(c,'door',o.x,yy,120);
        else if(o.role==='clue')drawPuzzleSprite(c,'lantern',o.x-65,yy,65);
        else if(o.sceneObject){
          const appearance=openingSceneAppearance(o.sceneObject),icons={'button-small':'button','button-large':'button',little:'button',large:'button',shade:'seat',sun:'seat',pond:'seat'};
          for(const prop of appearance.scenery||[])drawCampaignProp(c,prop.kind,o.x+prop.x,yy+prop.y,{size:prop.size});
          const kind=appearance.kind||o.sceneObject.kind||o.sceneObject.icon||icons[o.icon]||o.icon;
          if(beat.view.phase==='delivery'&&appearance.relation&&appearance.landmark){
            const {landmark:host,object:offset}=campaignRelationPlacement({...appearance,size:95,objectKind:beat.view.objectId});
            drawCampaignProp(c,host.kind,o.x+host.x,yy+host.y,{...host});
            c.setLineDash([7,6]);c.lineWidth=3;c.strokeStyle='#fff4c6';c.beginPath();c.ellipse(o.x+offset.x,yy+offset.y,Math.max(20,offset.size*.55),Math.max(10,offset.size*.25),0,0,Math.PI*2);c.stroke();c.setLineDash([]);
          }else drawCampaignProp(c,kind,o.x,yy,{...appearance,size:95});
          const owner=o.sceneObject.residentId||appearance.residentId||appearance.landmark?.residentId;
          if(owner)drawPuppet(c,getImage(CAST[owner]?.sprite),{x:o.x+45,y:yy-85,height:55,state:'idle',src:CAST[owner]?.sprite});
          drawPuzzleSprite(c,'lantern',o.x-52,yy,30);
        }
        else{drawPuzzleSprite(c,'sign',o.x,yy,125);if(o.label){c.fillStyle='#352b22';c.font='800 24px Nunito,sans-serif';c.textAlign='center';c.fillText(o.label,o.x,yy-65,100);}}
        if(state?.revealedId===o.id){c.fillStyle='#fff4c6';c.font='bold 34px sans-serif';c.fillText('↓',o.x,yy-140);}
      }});
      entries.push({y:player.y,draw:()=>{const yy=player.y*.68-(hop?Math.sin(hop/.5*Math.PI)*35:0);c.fillStyle='#17352b44';c.beginPath();c.ellipse(player.x,player.y*.68,28,9,0,0,Math.PI*2);c.fill();drawCampaignHero(c,heroId,{x:player.x,y:yy,height:110,facing:player.facing,time,state:hop?'jump':Math.hypot(player.vx,player.vy)>10?'walk':'idle',reducedMotion});if(!state?.done&&beat.view.objectId)drawCampaignProp(c,beat.view.objectId,player.x+38*player.facing,yy-35,{size:42});}});
      entries.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());c.restore();},
    assets:()=>[LEARNING_SPRITES,PUZZLE_SPRITES,WORLD_MATERIALS,background,HERO_ANIMATIONS[heroId]?.src,CAST[heroId]?.heroSprite,CAST[heroId]?.sprite].filter(Boolean),
    setInput:input,key(code,down){const k={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',ShiftLeft:'sprint',ShiftRight:'sprint'}[code];if(k){input(k,down);return true;}if(down&&['KeyE','Enter'].includes(code)){trigger(nearest());return true;}return false;},
    pointerDown(x,y){const wx=x/scale+camera.x,wy=(y/scale+camera.y)/.68;const o=objects().find(o=>Math.abs(o.x-wx)<90&&Math.abs(o.y-wy)<170);if(o)approach(o);else if(!mazeBlocked(maze,wx,wy)){destination=null;player.path=mazePath(maze,player,{x:wx,y:wy});activity=true;}},
    activate(id){approach(objects().find(o=>o.id===id));},confirm(){trigger(nearest());},getObjects:()=>objects().map(({id,label,role})=>({id,label,role})),setState(next){state=next;},setProgress(){},applyOutcome(o){if(o.revealId)state={...state,revealedId:o.revealId};},snapshot,release,
    consumeActivity(){const v=activity||Math.hypot(player.vx,player.vy)>10;activity=false;return v;},
    debug:()=>({hub:false,mode:'maze',area:activityAreaFor(beat.familyId),player:snapshot(),beatIndex,objects:objects(),maze}),
    dispose(){disposed=true;release();}
  };
}
