import { createArcadeRenderGate, arcadeHeldAxes } from '../shared/arcadeFramePolicy.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SpeakerHigh, ArrowClockwise, HandPalm, TennisBall, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { loadThree, createRenderer, createFrameLoop, attachResize, attachContextLossGuard, disposeObject, disposeRenderer, detectQualityTier, QUALITY_TIERS } from '../shared/threeShell.js';
import { createPalFigure, animatePalFigure } from '../shared/physicalArcadeWorld.js';
import { preloadPhysicalPalArt, drawPhysicalPalArt, physicalPalFrame, physicalPalArtDelivery } from '../shared/physicalPalArt.js';
import { buildRallyPalsRounds, consumeRallyPalsFrame, RALLY_PALS_SIMULATION_STEP, commitRallyPalsAim, newRallyPalsEvidence, RALLY_PALS_CONTENT_VERSION, RALLY_PALS_COURTS, RALLY_PALS_WORLD_ART, rallyLaneX, rallyShot, stepRallyShot, rallyContactWindow, chooseOpponentReturn } from '../../../../utils/rallyPalsRules.js';
import { loadRallyPalsSession, saveRallyPalsSession } from '../../../../utils/rallyPalsSession.js';
import { phonicsTargetHint } from '../../../../utils/phonicsTargetPresentation.js';
import { createDrumTrailVoice } from '../../../../utils/drumTrailVoice.js';
import { getLedaInstructionAudioPath } from '../../../../data/ledaProductionAudio.js';
import { physicalThemeForDifficulty } from '../shared/physicalArcadeThemes.js';
import { playPopSound, playWhoosh, playTapSound, playStarChime, playCelebrationFanfare, cancelGameSfx } from '../../../../utils/audio/gameSfx.js';
import './RallyPalsGame.css';

function courtTitle(court,difficulty){const titles=difficulty==='medium'?['Fern Club','Clifftop Court','Fossil Lights']:difficulty==='hard'?['Moonwood Garden','Observatory Court','Starlight Court']:['Meadow Court','Rooftop Court','Moonlit Court'];return titles[RALLY_PALS_COURTS.findIndex(row=>row.id===court.id)]||titles[0];}

function initialGame(rounds, difficulty, seed, startLevel, scope, resumed, journeyIndex) {
  const saved = loadRallyPalsSession(scope, difficulty, seed, startLevel, rounds);
  if (saved) return { ...saved, mode:saved.mode||'match',targetHits:saved.targetHits||0,targetShots:saved.targetShots||0, phase: saved.phase === 'complete' ? 'complete' : saved.evidence.completions.includes(saved.roundId) ? 'rally' : 'serve', saveError: false };
  const index = Math.min(Math.max(0, startLevel), rounds.length - 1);
  return { seed, index, cursor: index, roundId: rounds[index].roundId, phase: 'serve', aim: null, aimX: null, aimZ: -7.1, wrong: 0,
    delivery: 'pending', pictureDelivery: 'pending', visualModel: false,
    supportReasons: resumed || startLevel ? ['resume-without-support-record'] : [],
    mode:'match', targetHits:0, targetShots:0, learningAim:null, learningAimX:null, learningAimZ:-7.1,
    court: RALLY_PALS_COURTS[Math.floor(journeyIndex / 4) % 3].id,
    assisted: true, rallyPause: false, score: 0, matchPoints: 0, bestRally: 0, motorMisses: 0,
    evidence: newRallyPalsEvidence(), saveError: false, message: 'Choose a sound lane, then serve. Take your time.' };
}

function makeRacket(THREE, color = 0xe89468) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: .5 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.62,8), material);
  handle.rotation.z = Math.PI / 2; handle.position.x = .27; group.add(handle);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(.44,.055,8,24),material);
  frame.scale.y = 1.25; frame.position.x = .77; group.add(frame);
  const strings = new THREE.LineBasicMaterial({ color: 0xfaf8e5, transparent: true, opacity: .8 });
  for (let index = -3; index <= 3; index++) {
    const offset = index * .11, half = Math.sqrt(Math.max(0,.42*.42 - offset*offset));
    const g1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.77-half,offset*1.2,0),new THREE.Vector3(.77+half,offset*1.2,0)]);
    const g2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.77+offset,-half*1.2,0),new THREE.Vector3(.77+offset,half*1.2,0)]);
    group.add(new THREE.Line(g1,strings),new THREE.Line(g2,strings));
  }
  return group;
}

// Original painterly layers surround physical court/net/racket/ball geometry.
// Atlas rectangles are pixel bounds, not assumed uniform generated cells.
function makeCourtZoneTexture(THREE,text) {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;
  const ctx=canvas.getContext('2d');
  if(ctx){ctx.clearRect(0,0,512,384);ctx.fillStyle='rgba(102,173,215,.37)';ctx.fillRect(9,9,494,366);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=6;ctx.strokeRect(12,12,488,360);ctx.fillStyle='#fffdf0';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${text.length>2?128:170}px Fredoka,Nunito,sans-serif`;ctx.fillText(text,256,198,444);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function makeCourt(THREE,mount,courtId,reduced,onLost,difficulty,budget,onQualityDrop) {
  const tier=detectQualityTier(),quality=QUALITY_TIERS[tier],theme=physicalThemeForDifficulty(difficulty);
  const world=theme.id,art=RALLY_PALS_WORLD_ART[world];
  let disposed=false,renderCeiling=Math.min(tier==='low'?760:tier==='medium'?1120:1600,budget?.ceiling??1600),runtimeTier=budget?.tier||tier;
  let qualityReason=budget?.reason||'device-signals',qualityChanges=budget?.changes||0,qualityFrames=[];
  const renderer=createRenderer(THREE,{pixelRatioCap:quality.pixelRatioCap,toneMappingExposure:1.02,shadowMap:tier==='low'?null:'pcf'});
  renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.className='rally-pals-canvas';mount.appendChild(renderer.domElement);
  if(runtimeTier==='low'){renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;}
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,1,.1,120);
  const evening=world==='moonwood'||courtId==='moonwood';
  scene.background=new THREE.Color(evening?theme.id==='moonwood'?'#20375a':'#536c8a':theme.sky);
  scene.add(new THREE.HemisphereLight(evening?'#d1e0ff':theme.light,evening?'#3f596a':'#70936f',evening?1.35:1.8));
  const sun=new THREE.DirectionalLight(evening?'#bed2ee':theme.light,evening?1.55:2.15);sun.position.set(-8,16,10);sun.castShadow=runtimeTier!=='low';sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15});scene.add(sun);
  const loader=new THREE.TextureLoader(),artDelivery={grass:'pending',plank:'pending',stone:'pending',scenery:'pending',horizon:'pending'};
  const loadArt=(url,key)=>loader.load(url,texture=>{if(disposed){texture.dispose();return;}artDelivery[key]='delivered';},undefined,()=>{if(!disposed)artDelivery[key]='failed';});
  const albedo=(name,repeatX=1,repeatY=1)=>{const map=loadArt(`/game-assets/physical-arcade/burrow-builders/materials/${name}-albedo-v1.webp`,name);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(repeatX,repeatY);map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return map;};
  const grass=albedo('grass',14,20),borderGrass=albedo('grass',28,32),woodMap=albedo('plank',1,2),stoneMap=albedo('stone',2,1);
  const lawnMaterial=map=>{const material=new THREE.MeshStandardMaterial({map,color:'#ffffff',roughness:1});material.onBeforeCompile=shader=>{
    shader.vertexShader=`varying vec3 vLawnWorld;\n${shader.vertexShader}`.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvLawnWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    const lawnTint=evening?'vec3(.11,.19,.19)':world==='dino'?'vec3(.34,.37,.18)':'vec3(.27,.39,.15)';
    shader.fragmentShader=`varying vec3 vLawnWorld;\n${shader.fragmentShader}`.replace('#include <map_fragment>',`#include <map_fragment>\nfloat lawnLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));\ndiffuseColor.rgb=mix(vec3(lawnLuma),diffuseColor.rgb,.70);\ndiffuseColor.rgb=mix(diffuseColor.rgb,${lawnTint},.28);\nfloat lawnPatch=.5+.5*sin(vLawnWorld.x*.61+sin(vLawnWorld.z*.44))*sin(vLawnWorld.z*.22+.7);\ndiffuseColor.rgb*=.95+.10*lawnPatch;`);
  };material.customProgramCacheKey=()=> `rally-pals-lawn-${world}-${evening}-v2`;return material;};
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(76,78),lawnMaterial(borderGrass));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.16,-7);ground.receiveShadow=true;ground.renderOrder=-3;scene.add(ground);
  const turf=new THREE.Mesh(new THREE.PlaneGeometry(11.8,20),lawnMaterial(grass));turf.rotation.x=-Math.PI/2;turf.position.y=-.065;turf.receiveShadow=true;scene.add(turf);
  const stone=new THREE.MeshStandardMaterial({map:stoneMap,color:'#e1dcc3',roughness:.95}),wood=new THREE.MeshStandardMaterial({map:woodMap,color:'#efd2a0',roughness:.9});
  for(const x of [-6.5,6.5]){const curb=new THREE.Mesh(new THREE.BoxGeometry(.6,.35,25),stone);curb.position.set(x,-.06,-1);curb.receiveShadow=true;scene.add(curb);}
  for(let strip=0;strip<4;strip++){const stripe=new THREE.Mesh(new THREE.PlaneGeometry(2.5,18),new THREE.MeshBasicMaterial({color:strip%2?'#d6edb5':'#688849',transparent:true,opacity:.065,depthWrite:false}));stripe.rotation.x=-Math.PI/2;stripe.position.set(-3.75+strip*2.5,-.061,0);scene.add(stripe);}
  const chalk=new THREE.MeshBasicMaterial({color:'#fff7da'});
  const line=(x,z,w,d)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),chalk);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,-.055,z);scene.add(mesh);};
  line(-5,0,.075,18);line(5,0,.075,18);line(0,-9,10,.075);line(0,9,10,.075);line(0,-3.7,10,.065);line(0,3.7,10,.065);line(0,0,.055,7.4);
  // Alpha-tested, unlit authored scenery retains its painted material depth on
  // every graphics tier. Each independent object occupies an actual world depth.
  const atlas=loadArt(`/game-assets/physical-arcade/rally-pals/${world}-scenery-v1.webp`,'scenery');atlas.colorSpace=THREE.SRGBColorSpace;
  const cardMaterial=new THREE.MeshBasicMaterial({map:atlas,color:evening&&world!=='moonwood'?'#95abc6':'#ffffff',alphaTest:.04,side:THREE.DoubleSide,toneMapped:false});
  const cardGeometry=(key,height)=>{const[x,y,w,h]=art.frames[key],g=new THREE.PlaneGeometry(height*w/h,height),uv=g.attributes.uv;
    for(let i=0;i<uv.count;i++){uv.setXY(i,(x+uv.getX(i)*w)/art.width,1-(y+(1-uv.getY(i))*h)/art.height);}return g;};
  const card=(key,x,z,height,rotation=0)=>{const mesh=new THREE.Mesh(cardGeometry(key,height),cardMaterial);mesh.position.set(x,height/2-.08-(courtId==='rooftop'&&Math.abs(z)>13?2.4:0),z);mesh.rotation.y=rotation;mesh.castShadow=runtimeTier!=='low';scene.add(mesh);return mesh;};
  const horizonMap=loadArt(`/game-assets/physical-arcade/rally-pals/${world}-horizon-v1.webp`,'horizon');horizonMap.colorSpace=THREE.SRGBColorSpace;
  const horizon=new THREE.Mesh(new THREE.PlaneGeometry(76,25),new THREE.MeshBasicMaterial({map:horizonMap,color:evening&&world!=='moonwood'?'#8b9eb9':'#ffffff',alphaTest:.025,side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false}));horizon.position.set(0,(art.horizonFoot/887-.5)*25-7.8,-34);horizon.renderOrder=-2;scene.add(horizon);
  card('club',10.6,-14,5.9,-.22);
  for(const side of [-1,1]){
    card('crowd',side*10.5,-4.2,2.55,side*-.31);card('crowd',side*11.3,-9.8,2.3,side*-.27);
    for(let i=0;i<6;i++)card('flowers',side*(7.5+(i%2)*.2),-12+i*3.8,.88,side*-.5);
    for(let i=0;i<6;i++)card('tree',side*(12.4+(courtId==='rooftop'?0:(i%2)*2.8)),-21+i*6.2,5.3+(i%3)*1.1,side*-.12);
  }
  if(courtId==='rooftop'){
    ground.position.y=-2.6;const deck=new THREE.Mesh(new THREE.BoxGeometry(27,2.55,28),stone);deck.position.set(0,-1.37,-1);deck.receiveShadow=true;scene.add(deck);
    card('club',-12.2,-20,5.2,.25);card('club',17,-25,5.4,-.3);
    for(const x of[-12.4,12.4])for(const z of[-11,7]){const column=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,3,16),stone);column.position.set(x,-1.6,z);scene.add(column);}
  }
  if(evening){
    const moon=new THREE.Mesh(new THREE.SphereGeometry(1.1,24,16),new THREE.MeshBasicMaterial({color:'#fff2c7',toneMapped:false}));moon.position.set(15,4.5,-45);moon.renderOrder=-4;scene.add(moon);
    const starPoints=Array.from({length:40},(_,i)=>new THREE.Vector3(-35+i*1.8,3.1+(i%4)*.55,-49));scene.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(starPoints),new THREE.PointsMaterial({color:'#f6e9c9',size:.09,toneMapped:false})));
    const glass=new THREE.MeshStandardMaterial({color:'#ffdc92',emissive:'#ffc25e',emissiveIntensity:.8,roughness:.38});
    for(const x of[-7.3,7.3])for(const z of[-8,5]){const lamp=new THREE.Group();lamp.position.set(x,0,z);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.09,2.4,10),wood);pole.position.y=1.2;lamp.add(pole);const light=new THREE.Mesh(new THREE.BoxGeometry(.31,.44,.31),glass);light.position.y=2.5;lamp.add(light);for(const y of[2.25,2.75]){const cap=new THREE.Mesh(new THREE.BoxGeometry(.39,.07,.39),wood);cap.position.y=y;lamp.add(cap);}scene.add(lamp);}
  }
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;const contactCtx=contactCanvas.getContext('2d');
  if(contactCtx){const gradient=contactCtx.createRadialGradient(64,64,7,64,64,63);gradient.addColorStop(0,'rgba(28,47,30,.52)');gradient.addColorStop(1,'rgba(28,47,30,0)');contactCtx.fillStyle=gradient;contactCtx.fillRect(0,0,128,128);}
  const contactMap=new THREE.CanvasTexture(contactCanvas),contactMaterial=new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false});
  const shadow=(x,z,w,d)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),contactMaterial);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,-.052,z);scene.add(mesh);return mesh;};
  for(const side of [-1,1])for(let i=0;i<6;i++)shadow(side*(12.4+(i%2)*2.8),-21+i*6.2,5,3.5);
  const playerShadow=shadow(0,7.4,3.2,1.3),opponentShadow=shadow(0,-7.4,1.8,.95),ballShadow=shadow(0,0,.55,.4);
  const clothCanvas=document.createElement('canvas');clothCanvas.width=clothCanvas.height=256;const cc=clothCanvas.getContext('2d');
  if(cc){cc.fillStyle='#42776b';cc.fillRect(0,0,256,256);cc.strokeStyle='#e7d88c';cc.lineWidth=8;cc.strokeRect(15,15,226,226);cc.beginPath();cc.ellipse(99,117,32,51,-.35,0,Math.PI*2);cc.ellipse(157,117,32,51,.35,0,Math.PI*2);cc.stroke();cc.beginPath();cc.moveTo(80,163);cc.lineTo(130,222);cc.moveTo(175,163);cc.lineTo(128,222);cc.stroke();for(let x=78;x<122;x+=11){cc.beginPath();cc.moveTo(x,78);cc.lineTo(x+14,148);cc.stroke();}}
  const clothMap=new THREE.CanvasTexture(clothCanvas);clothMap.colorSpace=THREE.SRGBColorSpace;const cloth=new THREE.MeshStandardMaterial({map:clothMap,side:THREE.DoubleSide,roughness:1});
  for(const x of [-5.6,5.6]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,1.65,12),wood);post.position.set(x,.72,0);post.castShadow=true;scene.add(post);const banner=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.1),cloth);banner.position.set(x<0?x+.52:x-.52,.63,.045);scene.add(banner);}
  const strands=[];for(let x=-4.5;x<=4.5;x+=.16)strands.push(new THREE.Vector3(x,.03,0),new THREE.Vector3(x,1.22,0));for(let y=.04;y<=1.22;y+=.115)strands.push(new THREE.Vector3(-4.5,y,0),new THREE.Vector3(4.5,y,0));
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(strands),new THREE.LineBasicMaterial({color:'#263d33',transparent:true,opacity:.77})));
  const tape=new THREE.Mesh(new THREE.BoxGeometry(11.1,.065,.06),chalk);tape.position.y=1.26;scene.add(tape);
  for(const side of [-1,1]){for(let z=-13;z<=10;z+=2.3){const post=new THREE.Mesh(new THREE.BoxGeometry(.16,1.25,.16),wood);post.position.set(side*7.1,.52,z);post.castShadow=true;scene.add(post);}for(const y of [.45,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.16,.12,24),wood);rail.position.set(side*7.1,y,-1.5);scene.add(rail);}}
  const bunting=new THREE.Group();scene.add(bunting);
  const points=Array.from({length:25},(_,i)=>new THREE.Vector3(-12+i,3.8-Math.sin(i/24*Math.PI)*.45,-12.8));bunting.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#cdb98e'})));
  for(let i=0;i<24;i++){const shape=new THREE.Shape();shape.moveTo(-.23,0);shape.lineTo(.23,0);shape.lineTo(0,-.57);shape.closePath();const flag=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:['#f1d270','#d6e4ca','#609883'][i%3],side:THREE.DoubleSide,roughness:1}));flag.position.copy(points[i]);bunting.add(flag);}
  const lanes=[];for(let lane=0;lane<3;lane++){const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.05,2.8),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide}));panel.rotation.x=-Math.PI/2;panel.position.set(rallyLaneX(lane),-.047,-6.6);scene.add(panel);lanes.push(panel);}
  const player=createPalFigure(THREE,{world:theme.id,scale:1.62,artActions:['tennis','tools']}),opponent=createPalFigure(THREE,{world:theme.id,scale:1.12,artActions:['tennis','tools']});player.rotation.y=Math.PI;player.userData.artDirection='back';opponent.userData.artDirection='front';scene.add(player,opponent);
  const racket=makeRacket(THREE,0x3677bc),rivalRacket=makeRacket(THREE,0x548dc8);
  const racketSocket=player.userData.artHands?.right,rivalSocket=opponent.userData.artHands?.right;
  if(racketSocket)racketSocket.add(racket);else{racket.position.set(.6,1.15,0);player.add(racket);}
  if(rivalSocket)rivalSocket.add(rivalRacket);else{rivalRacket.position.set(.6,1.15,0);opponent.add(rivalRacket);}
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.17,18,12),new THREE.MeshStandardMaterial({color:'#d9e754',roughness:.85}));ball.castShadow=true;scene.add(ball);
  const trailGeometry=new THREE.BufferGeometry(),trailPositions=new Float32Array(36);trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));
  const trail=new THREE.Line(trailGeometry,new THREE.LineBasicMaterial({color:'#f6f3c0',transparent:true,opacity:.35}));trail.frustumCulled=false;scene.add(trail);let trailHistory=[],trailShot=null;
  const seams=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(Array.from({length:40},(_,i)=>{const a=i/20*Math.PI;return new THREE.Vector3(Math.cos(a)*.17,Math.sin(a)*.17,.045*Math.sin(a*2));})),new THREE.LineBasicMaterial({color:'#fff9de'}));ball.add(seams);
  const landing=new THREE.Mesh(new THREE.RingGeometry(.45,.51,40),new THREE.MeshBasicMaterial({color:'#fff9e7',side:THREE.DoubleSide,transparent:true,opacity:.95}));landing.rotation.x=-Math.PI/2;landing.position.y=-.042;scene.add(landing);
  const target=new THREE.Mesh(new THREE.TorusGeometry(.72,.1,8,32),new THREE.MeshStandardMaterial({color:'#edc45b',roughness:.74}));target.rotation.x=-Math.PI/2;target.position.set(0,.18,-7.1);scene.add(target);
  const resizeBudget=()=>{const ratio=Math.min(1,renderCeiling/Math.max(1,mount.clientWidth));renderer.setSize(Math.max(1,Math.round(mount.clientWidth*ratio)),Math.max(1,Math.round(mount.clientHeight*ratio)),false);};
  const resize=attachResize({mount,renderer,camera,updateStyle:false,width:()=>Math.round(mount.clientWidth*Math.min(1,renderCeiling/Math.max(1,mount.clientWidth))),height:()=>Math.round(mount.clientHeight*Math.min(1,renderCeiling/Math.max(1,mount.clientWidth))),onResize:()=>{const portrait=mount.clientWidth/mount.clientHeight<1,shortPhone=portrait&&mount.clientWidth<=520&&mount.clientHeight<=650;camera.fov=shortPhone?75:portrait?55:50;camera.position.set(0,portrait?15.6:7,portrait?23.4:15.8);camera.lookAt(0,shortPhone?3:.65,portrait?-.5:2.2);camera.updateProjectionMatrix();}});
  const loss=attachContextLossGuard(renderer,{onLost:()=>onLost(),onRestored:()=>{}});
  const contactPoint=(actor,direction,action='forehand',phase=1/3,swing=10/3)=>{
    const near=direction==='back',grip=physicalPalFrame(theme.id,0,false,{direction,action,phase}).rightHand;
    const rotation=new THREE.Euler(0,grip[0]<0?Math.PI:0,-.3+Math.sin(swing*.6)*(near?.8:.7));
    const point=new THREE.Vector3(.77,0,0).applyEuler(rotation).add(new THREE.Vector3(...grip)).applyQuaternion(camera.quaternion).multiplyScalar(near?1.62:1.12);
    point.add(new THREE.Vector3(actor.x,0,actor.z));return{x:point.x,y:point.y,z:point.z};
  };
  return {updateChoices:choices=>lanes.forEach((mesh,index)=>{mesh.material.map?.dispose();mesh.material.map=makeCourtZoneTexture(THREE,choices[index]);mesh.material.needsUpdate=true;}),
    contactPoint,
    draw:(engine,at)=>{player.position.set(engine.player.x,0,engine.player.z);opponent.position.set(engine.opponent.x,0,engine.opponent.z);animatePalFigure(player,at,engine.moving,{direction:'back',action:engine.phase==='point'||engine.phase==='complete'?'celebrate':engine.swing>0?engine.swingStyle:engine.moving?undefined:'ready',phase:engine.swing>0?1-engine.swing/5:0});animatePalFigure(opponent,at,engine.opponentMoving,{direction:'front',action:engine.rivalSwing>0?engine.rivalStyle:engine.opponentMoving?undefined:'ready',phase:engine.rivalSwing>0?1-engine.rivalSwing/5:0});
      const authored=player.userData.authoredPal?.delivery==='delivered';player.rotation.y=authored?0:Math.PI;
      // A Sprite's vertical axis faces the camera. Its real prop socket must use
      // that same basis instead of an upright world-space arm coordinate.
      for(const[actor,socket]of[[player,racketSocket],[opponent,rivalSocket]])if(actor.userData.authoredPal?.delivery==='delivered'&&socket){socket.position.applyQuaternion(camera.quaternion);socket.quaternion.copy(camera.quaternion);}
      racket.rotation.y=authored&&racketSocket?.position.x<0?Math.PI:0;rivalRacket.rotation.y=rivalSocket?.position.x<0?Math.PI:0;
      racket.rotation.z=-.3+Math.sin(engine.swing*.6)*.8;rivalRacket.rotation.z=-.3+Math.sin(engine.rivalSwing*.6)*.7;
      const b=engine.ball||contactPoint(engine.player,'back','ready',0,0);ball.visible=!['point','complete'].includes(engine.phase);ball.position.set(b.x,b.y,b.z);ball.rotation.z=at*1.2;ballShadow.visible=ball.visible;ballShadow.position.set(b.x,-.052,b.z);ballShadow.scale.setScalar(.6+b.y*.12);playerShadow.position.x=engine.player.x;playerShadow.position.z=engine.player.z;opponentShadow.position.x=engine.opponent.x;opponentShadow.position.z=engine.opponent.z;
      if(engine.ball?.from!==trailShot){trailShot=engine.ball?.from;trailHistory=[];}if(engine.ball&&!reduced){trailHistory.push({...b,at});trailHistory=trailHistory.filter(p=>p.at>=at-.12).slice(-12);}
      trail.visible=Boolean(engine.ball&&!reduced&&trailHistory.length>1);trailHistory.forEach((point,index)=>{trailPositions[index*3]=point.x;trailPositions[index*3+1]=point.y;trailPositions[index*3+2]=point.z;});trailGeometry.setDrawRange(0,trailHistory.length);trailGeometry.attributes.position.needsUpdate=true;
      landing.visible=engine.aim!=null;landing.position.x=engine.aimX??rallyLaneX(engine.aim??1);landing.position.z=engine.aimZ??-7.1;target.visible=engine.mode==='targets';target.position.x=engine.targetX??0;if(!reduced)bunting.rotation.x=Math.sin(at*.55)*.006;renderer.render(scene,camera);},
    screenAim:(x,y)=>{const ray=new THREE.Raycaster(),hit=new THREE.Vector3();ray.setFromCamera(new THREE.Vector2(x*2-1,1-y*2),camera);return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),hit)?{x:Math.max(-4.6,Math.min(4.6,hit.x)),z:Math.max(-8.5,Math.min(-3.8,hit.z))}:null;},
    sampleFrame:milliseconds=>{if(milliseconds<=0||milliseconds>1000||disposed)return;qualityFrames.push(milliseconds);if(qualityFrames.length<36)return;const average=qualityFrames.reduce((a,b)=>a+b,0)/qualityFrames.length;qualityFrames=[];if(average<=35||renderCeiling<=560)return;renderCeiling=renderCeiling>1120?1120:renderCeiling>760?760:560;runtimeTier=renderCeiling<=760?'low':'medium';qualityReason='sustained-frame-budget';qualityChanges++;renderer.setPixelRatio(1);if(runtimeTier==='low'){renderer.shadowMap.enabled=false;sun.castShadow=false;}resizeBudget();onQualityDrop?.({ceiling:renderCeiling,tier:runtimeTier,reason:qualityReason,changes:qualityChanges});},
    qualityStatus:()=>({initialTier:tier,tier:runtimeTier,ceiling:renderCeiling,reason:qualityReason,changes:qualityChanges,renderWidth:renderer.domElement.width,renderHeight:renderer.domElement.height,shadows:renderer.shadowMap.enabled,drawCalls:renderer.info.render.calls,artPipeline:'painted-depth-layers',authoredArtRetained:true,artDelivery:{...artDelivery},palDelivery:player.userData.authoredPal?.delivery,palActionDelivery:{...player.userData.authoredPal?.actionDelivery},palAction:player.userData.authoredPal?.action,palFrame:player.userData.authoredPal?.frame}),
    dispose:()=>{disposed=true;resize();loss();disposeObject(scene);disposeRenderer(renderer,{forceContextLoss:true});}};
}

// The fallback is a live court using the same physics and input, not a still
// image or substitute question board. It needs neither WebGL nor remote art.
function makeCanvasCourt(mount,difficulty,courtId='meadow') {
  const theme=physicalThemeForDifficulty(difficulty),art=RALLY_PALS_WORLD_ART[theme.id],night=theme.id==='moonwood'||courtId==='moonwood';
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.className='rally-pals-canvas';mount.appendChild(canvas);
  const ctx=canvas.getContext('2d');let choices=[],disposed=false,palDelivered=false,palAction='pending',palFrame='pending';const delivery={scenery:'pending',horizon:'pending',grass:'pending'},pictures={};
  for(const[key,url]of Object.entries({scenery:`/game-assets/physical-arcade/rally-pals/${theme.id}-scenery-v1.webp`,horizon:`/game-assets/physical-arcade/rally-pals/${theme.id}-horizon-v1.webp`,grass:'/game-assets/physical-arcade/burrow-builders/materials/grass-albedo-v1.webp'})){
    const image=new Image();image.onload=()=>{if(!disposed)delivery[key]=image.naturalWidth?'delivered':'failed';};image.onerror=()=>{if(!disposed)delivery[key]='failed';};image.src=url;pictures[key]=image;
  }
  const presentation=()=>{
    const w=mount.clientWidth,h=mount.clientHeight;
    if(w>520||w>=h)return{top:h*.26,span:h*.67,nearPalHeight:h*.30,farPalHeight:h*.10};
    // Portrait teaching chrome is stable throughout a rally. Fit both actors
    // below it without moving the projection when a shot changes phase.
    const farPalHeight=Math.max(40,h*.075),farFoot=252+farPalHeight;
    const nearLine=Math.min(h*.82,h-140),span=Math.max(80,(nearLine-farFoot)/.9831),top=farFoot-span*.0169;
    const nearFoot=top+span*.7569,nearPalHeight=Math.min(h*.18,Math.max(50,(nearFoot-farFoot)*.75));
    return{top,span,nearPalHeight,farPalHeight};
  };
  const contactPoint=(actor,direction,action='forehand',phase=1/3,swing=10/3)=>{
    const near=direction==='back',w=mount.clientWidth,h=mount.clientHeight,t=(actor.z+10)/20,layout=presentation();
    const grip=physicalPalFrame(theme.id,0,false,{direction,action,phase}).rightHand,scale=(near?layout.nearPalHeight:layout.farPalHeight)/2.2,sign=grip[0]<0?-1:1;
    const angle=-sign*(-.3+Math.sin(swing*.6)*(near?.8:.7));
    return{x:actor.x+(grip[0]*scale+sign*.77*scale*Math.cos(angle))/(w*(.025+t*.05)),
      y:(grip[1]*scale-sign*.77*scale*Math.sin(angle))/(h*(.045+t*.06)),z:actor.z};
  };
  const draw=(engine,at)=>{
    if(!ctx||disposed)return;const w=mount.clientWidth,h=mount.clientHeight;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.fillStyle=night?'#263f68':theme.sky;ctx.fillRect(0,0,w,h);ctx.fillStyle=night?'#52696c':'#94a66b';ctx.fillRect(0,h*.19,w,h*.81);
    if(delivery.grass==='delivered'){const pattern=ctx.createPattern(pictures.grass,'repeat');pattern?.setTransform(new DOMMatrix([.18,0,0,.18,0,0]));ctx.globalAlpha=night?.22:.36;ctx.fillStyle=pattern;ctx.fillRect(0,h*.19,w,h*.81);ctx.globalAlpha=1;}
    if(delivery.horizon==='delivered')ctx.drawImage(pictures.horizon,0,-h*.09,w,h*.46);
    const layout=presentation(),project=(x,z)=>{const t=(z+10)/20;return{x:w*.5+x*w*(.025+t*.05),y:layout.top+layout.span*t*t,t};};
    const card=(key,x,y,height)=>{if(delivery.scenery!=='delivered')return;const[sx,sy,sw,sh]=art.frames[key],width=height*sw/sh;ctx.drawImage(pictures.scenery,sx,sy,sw,sh,x-width/2,y-height,width,height);};
    for(const side of[-1,1]){card('tree',w*(.5+side*.40),h*.37,h*.43);card('tree',w*(.5+side*.49),h*.63,h*.37);card('crowd',w*(.5+side*.35),h*.40,h*.15);for(let i=0;i<4;i++)card('flowers',w*(.5+side*(.23+i*.055)),h*(.43+i*.09),h*.07);}
    card('club',w*.78,h*.31,h*.29);if(courtId==='rooftop')card('club',w*.22,h*.26,h*.20);
    const corners=[project(-5.5,-10),project(5.5,-10),project(5.5,10),project(-5.5,10)];ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=night?'#526e70':'#92a769';ctx.fill();if(delivery.grass==='delivered'){ctx.save();ctx.clip();const lawn=ctx.createPattern(pictures.grass,'repeat');lawn?.setTransform(new DOMMatrix([.14,0,0,.14,0,0]));ctx.globalAlpha=night?.17:.30;ctx.fillStyle=lawn;ctx.fillRect(0,0,w,h);ctx.restore();}ctx.lineWidth=3;ctx.strokeStyle='#fff5da';ctx.stroke();
    const line=(ax,az,bx,bz)=>{const a=project(ax,az),b=project(bx,bz);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};line(-5.5,-3.7,5.5,-3.7);line(-5.5,3.7,5.5,3.7);line(0,-3.7,0,3.7);
    choices.forEach((choice,lane)=>{const p=project(rallyLaneX(lane),-7);ctx.fillStyle='rgba(160,194,225,.45)';ctx.fillRect(p.x-w*.05,p.y-h*.016,w*.10,h*.027);ctx.strokeRect(p.x-w*.05,p.y-h*.016,w*.10,h*.027);ctx.fillStyle='#fffbea';ctx.font=`bold ${Math.max(13,h*.024)}px Fredoka,sans-serif`;ctx.textAlign='center';ctx.fillText(choice,p.x,p.y+h*.005);});
    const netL=project(-5.5,0),netR=project(5.5,0),netHeight=h*.065;ctx.strokeStyle='#294039';ctx.lineWidth=1;for(let x=netL.x;x<=netR.x;x+=8){ctx.beginPath();ctx.moveTo(x,netL.y-netHeight);ctx.lineTo(x,netL.y);ctx.stroke();}for(let y=netL.y-netHeight;y<=netL.y;y+=7){ctx.beginPath();ctx.moveTo(netL.x,y);ctx.lineTo(netR.x,y);ctx.stroke();}ctx.strokeStyle='#fff5da';ctx.lineWidth=3;line(-5.5,0,5.5,0);ctx.beginPath();ctx.moveTo(netL.x,netL.y-netHeight);ctx.lineTo(netR.x,netL.y-netHeight);ctx.stroke();
    palDelivered=true;for(const[actor,direction,moving,swing,style,height]of[[engine.opponent,'front',engine.opponentMoving,engine.rivalSwing,engine.rivalStyle,layout.farPalHeight],[engine.player,'back',engine.moving,engine.swing,engine.swingStyle,layout.nearPalHeight]]){
      const p=project(actor.x,actor.z),action=direction==='back'&&['point','complete'].includes(engine.phase)?'celebrate':swing>0?style:moving?undefined:'ready',phase=swing>0?1-swing/5:0;
      if(direction==='back'){const pose=physicalPalFrame(theme.id,at,moving,{direction,action,phase}),delivered=physicalPalArtDelivery(theme.id);palAction=delivered[pose.kind]==='delivered'?pose.action:delivered.locomotion==='delivered'?'idle':'unavailable';palFrame=`${delivered[pose.kind]==='delivered'?pose.kind:'locomotion'}:${pose.index}`;}
      ctx.fillStyle='rgba(22,38,35,.28)';ctx.beginPath();ctx.ellipse(p.x,p.y,height*.30,height*.07,0,0,Math.PI*2);ctx.fill();
      if(!drawPhysicalPalArt(ctx,{world:theme.id,time:at,moving,direction,action,phase,x:p.x,y:p.y,height})){palDelivered=false;ctx.fillStyle=theme.id==='dino'?'#df863a':theme.id==='moonwood'?'#577743':'#ffdf6e';ctx.beginPath();ctx.ellipse(p.x,p.y-height*.4,height*.26,height*.40,0,0,Math.PI*2);ctx.fill();}
      const grip=physicalPalFrame(theme.id,at,moving,{direction,action,phase}).rightHand,scale=height/2.2,gx=p.x+grip[0]*scale,gy=p.y-grip[1]*scale,sign=grip[0]<0?-1:1;
      ctx.save();ctx.translate(gx,gy);ctx.rotate(-sign*(-.3+Math.sin(swing*.6)*(direction==='back'?.8:.7)));ctx.strokeStyle='#3677bc';ctx.lineWidth=Math.max(3,height*.022);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(sign*scale*.5,0);ctx.stroke();ctx.beginPath();ctx.ellipse(sign*scale*.77,0,scale*.44,scale*.55,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fff5da';ctx.lineWidth=1;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(sign*scale*.77-scale*.26,i*scale*.11);ctx.lineTo(sign*scale*.77+scale*.26,i*scale*.11);ctx.stroke();}ctx.restore();
    }
    const b=engine.ball||contactPoint(engine.player,'back','ready',0,0),p=project(b.x,b.z);ctx.fillStyle='#e4ec72';ctx.beginPath();ctx.arc(p.x,p.y-b.y*h*(.045+p.t*.06),Math.max(4,h*.006),0,Math.PI*2);ctx.fill();
    if(engine.mode==='targets'){const p=project(engine.targetX??0,-7.1);ctx.strokeStyle='#eabb61';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(p.x,p.y+6,23,9,0,0,Math.PI*2);ctx.stroke();}
    if(engine.aim!=null){const p=project(engine.aimX??rallyLaneX(engine.aim),engine.aimZ??-7.1);ctx.strokeStyle='#fffadd';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+8,20,7,0,0,Math.PI*2);ctx.stroke();}
  };
  return {draw,contactPoint,screenAim:(x,y)=>{const layout=presentation(),t=Math.sqrt(Math.max(0,(y*mount.clientHeight-layout.top)/layout.span));return{x:Math.max(-4.6,Math.min(4.6,(x-.5)/(.025+t*.05))),z:Math.max(-8.5,Math.min(-3.8,t*20-10))};},updateChoices:value=>{choices=value;},qualityStatus:()=>({tier:'canvas',reason:'webgl-unavailable',artPipeline:'painted-depth-layers',authoredArtRetained:true,artDelivery:{...delivery},palDelivery:palDelivered?'delivered':'unavailable',palActionDelivery:physicalPalArtDelivery(theme.id),palAction,palFrame}),dispose:()=>{disposed=true;for(const image of Object.values(pictures)){image.onload=null;image.onerror=null;}canvas.remove();}};
}

export default function RallyPalsGame({ difficulty='easy',sessionSeed=0,journey,startLevel=0,resumedCheckpoint=false,
  progressScopeKey='default',isSoundEnabled=true,onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onResultReady,onSessionStart,onEngineReady }) {
  const theme=physicalThemeForDifficulty(difficulty);
  const rounds=useMemo(()=>buildRallyPalsRounds(difficulty,sessionSeed,journey?.index||0),[difficulty,sessionSeed,journey?.index]);
  const [game,setGame]=useState(()=>initialGame(rounds,difficulty,sessionSeed,startLevel,progressScopeKey,resumedCheckpoint,journey?.index||0));
  const [view,setView]=useState({paused:false,renderer:'loading',rally:0,contact:false,targetPhase:'serve'});
  const stageRef=useRef(null),cueImageRef=useRef(null),controllerRef=useRef(null),handlers=useRef({});
  const soundRef=useRef(isSoundEnabled);
  useEffect(()=>{handlers.current={onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onResultReady,onSessionStart,onEngineReady};},[onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onResultReady,onSessionStart,onEngineReady]);
  const round=rounds[game.index], hint=phonicsTargetHint(round.word,game.wrong);

  useEffect(()=>{
    let disposed=false, state=initialGame(rounds,difficulty,sessionSeed,startLevel,progressScopeKey,resumedCheckpoint,journey?.index||0);
    let enginePaused=false,hidden=document.hidden,userPaused=false,reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
    let renderBudget=null,resumeFeed=state.mode!=='targets'&&state.phase==='rally';
    let sound=isSoundEnabled,teachingBusy=false,scene=null,rendererMode='loading',loop=null,last=performance.now(),drawAt=0,saveAt=0,serveGeneration=0,completed=false,gameTime=0,simulationRemainder=0;
    preloadPhysicalPalArt(theme.id,{actions:['tennis','tools']});
    const pacing={frames:0,intervals:[],renderMs:0,inputAt:null,lastInputLatencyMs:0,maxInputLatencyMs:0};
    const noteInput=()=>{pacing.inputAt=performance.now();};
    const held=new Set(),voice=createDrumTrailVoice({enabled:()=>sound});
    const effectsRequested={movement:0,contact:0,point:0,recovery:0,completion:0};
    const effect=(kind,play)=>{if(!sound||enginePaused||hidden||state.saveError||teachingBusy)return;effectsRequested[kind]++;play();};
    const physics={player:{x:0,z:7.4},opponent:{x:0,z:-7.4},ball:null,moving:false,opponentMoving:false,aim:state.aim,aimX:state.aimX??rallyLaneX(state.aim??1),aimZ:state.aimZ??-7.1,swing:0,rivalSwing:0,swingStyle:'forehand',rivalStyle:'forehand',rally:0,flightCount:0,pointTime:0,missTime:0,soft:false,mode:state.mode,world:theme.id,hero:theme.hero,targetPhase:'serve',targetX:chooseOpponentReturn(sessionSeed,state.index,state.targetShots||0).x};
    const item=()=>rounds[state.index];
    const publish=(next=state)=>{state=next;if(state.saveError)simulationRemainder=0;if(!disposed)setGame({...state});};
    const snapshot=()=>({gameId:'rally-pals',index:state.index,cursor:state.cursor,phase:state.phase,roundId:state.roundId,
      cueId:item().id,court:state.court,choices:state.mode==='targets'?['left','middle','right']:[...item().choices],mode:state.mode,world:theme.id,hero:theme.hero,targetPhase:physics.targetPhase,targetHits:state.targetHits,targetShots:state.targetShots,aim:state.aim,aimX:state.aimX,aimZ:state.aimZ,wrong:state.wrong,delivery:state.delivery,pictureDelivery:state.pictureDelivery,
      supportReasons:[...state.supportReasons],renderer:rendererMode,paused:enginePaused,assisted:state.assisted,rallyPause:state.rallyPause,
      player:{...physics.player},opponent:{...physics.opponent},ball:physics.ball?{x:physics.ball.x,y:physics.ball.y,z:physics.ball.z,from:{...physics.ball.from},to:{...physics.ball.to},startHeight:physics.ball.startHeight,time:physics.ball.time,direction:physics.ball.direction,lob:physics.ball.lob,duration:physics.ball.duration}:null,lastContact:physics.lastContact?{...physics.lastContact}:null,
      rally:physics.rally,matchPoints:state.matchPoints,bestRally:state.bestRally,motorMisses:state.motorMisses,elapsedSeconds:gameTime,simulation:{kind:'fixed-step',stepSeconds:RALLY_PALS_SIMULATION_STEP,remainderSeconds:simulationRemainder},
      quality:scene?.qualityStatus?.()||{tier:'canvas',reason:'webgl-unavailable'},pacing:{frames:pacing.frames,meanFrameMs:pacing.intervals.length?pacing.intervals.reduce((a,b)=>a+b,0)/pacing.intervals.length:0,p95FrameMs:[...pacing.intervals].sort((a,b)=>a-b)[Math.floor(pacing.intervals.length*.95)]||0,renderMs:pacing.renderMs,lastInputLatencyMs:pacing.lastInputLatencyMs,maxInputLatencyMs:pacing.maxInputLatencyMs},
      score:state.score,completions:state.evidence.completions.length,evidence:structuredClone(state.evidence),saveError:state.saveError,audioEffects:{requested:{...effectsRequested},teachingBusy}});
    const persist=(checkpoint=false)=>{
      const result=saveRallyPalsSession(progressScopeKey,difficulty,{...state});
      if(!result.localSaved){held.clear();publish({...state,saveError:true,message:'Your game is waiting to save. Try saving again.'});return false;}
      if(checkpoint)try{handlers.current.onCheckpoint?.(state.cursor,rounds.length);}catch{publish({...state,saveError:true});return false;}
      return true;
    };
    const markSupported=(reason='mission-help')=>{publish({...state,supportReasons:[...new Set([...state.supportReasons,reason])]});persist();};
    const refreshPause=()=>{simulationRemainder=0;const next=userPaused||hidden;if(next===enginePaused)return;enginePaused=next;held.clear();last=performance.now();if(next){voice.pause();cancelGameSfx();persist();}else voice.resume();if(!disposed)setView(v=>({...v,paused:next}));};
    const visualModel=()=>{publish({...state,visualModel:true,delivery:'unavailable',supportReasons:[...new Set([...state.supportReasons,'visual-matching-model'])],message:'Match the sound shown. You can try Hear again.'});persist();};
    const prompt=async()=>{
      const ticket=++serveGeneration;
      if(state.mode==='targets')return;
      if(!sound){teachingBusy=false;visualModel();return;}
      cancelGameSfx();teachingBusy=true;
      const result=await voice.play(item().audio);
      if(disposed||ticket!==serveGeneration)return;teachingBusy=false;
      if(result.status==='delivered'){publish({...state,delivery:'delivered'});persist();}
      else if(result.status==='unavailable'){visualModel();}
    };
    const returnToServe=()=>{physics.ball=null;physics.soft=false;physics.player.z=7.4;publish({...state,phase:'serve'});persist();};
    const point=winner=>{
      physics.ball=null;physics.pointTime=0;
      effect('point',winner==='player'?playStarChime:playTapSound);
      if(state.mode==='targets'){physics.targetPhase='point';publish({...state,bestRally:Math.max(state.bestRally,physics.rally),message:'Great target rally! Aim again when you are ready.'});persist();return;}
      publish({...state,phase:'point',matchPoints:state.matchPoints+(winner==='player'?1:0),bestRally:Math.max(state.bestRally,physics.rally),
        message:winner==='player'?`Point for ${theme.hero}! Nice shot.`:'Rally complete! Your sound point is safe.'});persist(true);
    };
    const nextPoint=()=>{
      if(state.saveError)return;
      if(state.index+1>=rounds.length){
        if(completed)return;completed=true;effect('completion',playCelebrationFanfare);publish({...state,phase:'complete',message:'Match complete!'});persist();
        const evidence={...state.evidence,contentVersion:RALLY_PALS_CONTENT_VERSION,sessionSeed,journeyIndex:journey?.index||0,
          practiceOnly:true,construct:'tennis-sound-placement',independentFirstCorrect:state.evidence.firstResponses.filter(row=>row.correct&&row.independentPractice).length,
          motor:{matchPoints:state.matchPoints,bestRally:state.bestRally,motorMisses:state.motorMisses}};
        handlers.current.onComplete?.(3,state.score,state.evidence.completions.length,evidence);return;
      }
      const index=state.index+1;
      physics.ball=null;physics.rally=0;physics.flightCount=0;physics.player={x:0,z:7.4};physics.opponent={x:0,z:-7.4};physics.aim=null;physics.aimX=null;physics.aimZ=-7.1;
      publish({...state,index,cursor:index,roundId:rounds[index].roundId,phase:'serve',aim:null,aimX:null,aimZ:-7.1,wrong:0,delivery:'pending',pictureDelivery:'pending',
        visualModel:false,supportReasons:[],message:'New sound. Aim, then serve when you are ready.'});
      scene?.updateChoices(item().choices);persist(true);handlers.current.onProgressUpdate?.(state.evidence.completions.length,rounds.length);prompt();
    };
    const aim=lane=>{noteInput();if(enginePaused||state.saveError||state.phase==='complete')return;if(!Number.isInteger(lane)||lane<0||lane>2)return;physics.aim=lane;physics.aimX=rallyLaneX(lane);physics.aimZ=-7.1;publish({...state,aim:lane,aimX:physics.aimX,aimZ:physics.aimZ});persist();};
    const aimAt=(x,y)=>{noteInput();const point=scene?.screenAim?.(x,y);if(!point||enginePaused||state.saveError||state.phase==='complete')return;const lane=Math.max(0,Math.min(2,Math.round(point.x/3.15)+1));physics.aim=lane;physics.aimX=point.x;physics.aimZ=point.z;publish({...state,aim:lane,aimX:point.x,aimZ:point.z});persist();};
    const strike=(near,to,{lob=false,soft=false}={})=>{
      const actor=near?physics.player:physics.opponent;
      const origin=scene?.contactPoint?.(actor,near?'back':'front',lob?'lob':'forehand')||{...actor,y:1.35};
      physics.lastContact={...origin,actor:near?'player':'opponent',style:lob?'lob':'forehand',elapsedSeconds:gameTime,renderer:rendererMode};
      if(!soft)effect('contact',lob?playWhoosh:playPopSound);
      return rallyShot({x:origin.x,z:origin.z},to,{lob,soft,startHeight:origin.y});
    };
    const swing=lob=>{
      noteInput();
      physics.swingStyle=lob?'lob':'forehand';
      if(state.mode==='targets'){
        if(enginePaused||state.saveError||physics.targetPhase==='point')return;
        physics.swing=10/3;if(state.aim===null){publish({...state,message:'Choose where to aim first.'});return;}
        if(physics.targetPhase==='serve'){physics.targetPhase='rally';physics.rally=0;physics.flightCount=0;physics.ball=strike(true,{x:physics.aimX??0,z:physics.aimZ??-7.1},{lob});publish({...state,message:'Aim at the golden target. No sound answer needed.'});return;}
        if(physics.ball&&rallyContactWindow(physics.ball,physics.player,state.assisted)){physics.rally++;physics.flightCount++;physics.ball=strike(true,{x:physics.aimX??0,z:physics.aimZ??-7.1},{lob});publish({...state,bestRally:Math.max(state.bestRally,physics.rally),message:lob?'Lob toward the target.':'Flat drive toward the target.'});persist();}return;
      }
      if(enginePaused||state.saveError||state.phase==='complete'||state.phase==='point')return;
      physics.swing=10/3;
      if(state.phase==='serve'){
        if(state.aim===null){publish({...state,message:'Choose where to aim first.'});return;}
        const selected=item().choices[state.aim];
        const result=commitRallyPalsAim(state.evidence,item(),selected,{delivery:state.delivery,pictureDelivery:state.pictureDelivery,
          supportReasons:state.supportReasons,visualModel:state.visualModel,motorAssist:state.assisted});
        if(result.ignored)return;
        publish({...state,evidence:result.evidence,score:state.score+result.awarded,wrong:state.wrong+(result.correct?0:1),
          phase:result.correct?'rally':'serve',supportReasons:result.correct?state.supportReasons:[...new Set([...state.supportReasons,'sound-contrast',...(state.wrong+1>=2?['partial-hint']:[])])],
          message:result.correct?'Sound matched! Keep the rally going.':`That lane is ${selected}. Listen again and try a different sound.`});
        handlers.current.onScoreUpdate?.(state.score);handlers.current.onProgressUpdate?.(state.evidence.completions.length,rounds.length);
        if(!persist(true))return;
        if(result.correct){physics.rally=0;physics.flightCount=0;physics.soft=false;physics.ball=strike(true,{x:physics.aimX??rallyLaneX(state.aim),z:physics.aimZ??-7.1},{lob});}
        else{physics.soft=true;physics.ball=strike(true,{x:rallyLaneX(state.aim),z:3.7},{soft:true});
          const contrastTicket=serveGeneration;cancelGameSfx();teachingBusy=true;
          voice.play(getLedaInstructionAudioPath('Try again')).then(()=>{if(disposed||contrastTicket!==serveGeneration)return;teachingBusy=false;if(state.phase==='serve'&&state.mode!=='targets')prompt();});}
        return;
      }
      if(!physics.ball){physics.ball=strike(true,{x:physics.aimX??rallyLaneX(state.aim??1),z:physics.aimZ??-7.1},{lob});return;}
      if(physics.ball.direction!=='near')return;
      if(!rallyContactWindow(physics.ball,physics.player,state.assisted)){
        publish({...state,message:'Move closer to the ball, or use Rally Hold.'});return;
      }
      physics.rally++;physics.flightCount++;
      publish({...state,bestRally:Math.max(state.bestRally,physics.rally),message:lob?'High lob! Give yourself room.':'Return! Aim away from your pal.'});
      physics.ball=strike(true,{x:physics.aimX??rallyLaneX(state.aim??1),z:physics.aimZ??-7.1},{lob});
      persist();
    };
    const beginHeld=(direction,id)=>{noteInput();if(enginePaused||state.saveError)return;if(!held.size)effect('movement',playTapSound);held.add(`${id}:${direction}`);};
    const releaseHeld=id=>{for(const entry of held)if(entry.startsWith(`${id}:`))held.delete(entry);};
    const changeMode=mode=>{
      if(!['match','coop','targets'].includes(mode)||mode===state.mode||enginePaused||state.phase==='complete')return;
      voice.cancel();cancelGameSfx();teachingBusy=false;serveGeneration++;held.clear();physics.ball=null;physics.rally=0;physics.pointTime=0;physics.missTime=0;physics.soft=false;physics.mode=mode;physics.targetPhase='serve';
      const entering=mode==='targets'&&state.mode!=='targets',leaving=state.mode==='targets'&&mode!=='targets';
      const selectedAim=entering?null:leaving?state.learningAim:state.aim;
      const selectedX=entering?null:leaving?state.learningAimX:state.aimX,selectedZ=leaving?state.learningAimZ:state.aimZ;
      publish({...state,mode,learningAim:entering?state.aim:state.learningAim,learningAimX:entering?state.aimX:state.learningAimX,learningAimZ:entering?state.aimZ:state.learningAimZ,aim:selectedAim,aimX:selectedX,aimZ:selectedZ??-7.1,
        message:entering?'Aim at the golden target. Tennis practice only.':mode==='coop'?'Build a six-return rally together.':'Choose a sound lane, then play a quick match.'});
      physics.aim=selectedAim;physics.aimX=selectedX;physics.aimZ=selectedZ??-7.1;
      scene?.updateChoices(mode==='targets'?['←','•','→']:item().choices);persist();
      if(mode!=='targets'&&state.phase==='rally'){physics.rivalStyle='lob';physics.rivalSwing=10/3;physics.ball=strike(false,{x:physics.player.x,z:7.7},{lob:true});}
      if(mode!=='targets')prompt();
    };
    const selectPlay=value=>{const [mode,id]=value.includes(':')?value.split(':'):['match',value];changeMode(mode);if(id!==state.court)changeCourt(id);};
    const changeCourt=id=>{
      if(!RALLY_PALS_COURTS.some(court=>court.id===id)||enginePaused)return;
      publish({...state,court:id});persist();buildScene();
    };
    const buildScene=async()=>{
      const ticket=++drawAt;scene?.dispose();scene=null;
      try{const THREE=await loadThree();if(disposed||ticket!==drawAt)return;
        scene=makeCourt(THREE,stageRef.current,state.court,reduce,()=>{
          if(disposed)return;markSupported('webgl-context-lost');scene?.dispose();scene=makeCanvasCourt(stageRef.current,difficulty,state.court);scene.updateChoices(state.mode==='targets'?['←','•','→']:item().choices);rendererMode='canvas';setView(v=>({...v,renderer:rendererMode}));
        },difficulty,renderBudget,value=>{renderBudget=value;});rendererMode='webgl';
      }catch{if(disposed||ticket!==drawAt)return;scene=makeCanvasCourt(stageRef.current,difficulty,state.court);rendererMode='canvas';}
      if(disposed)return;scene.updateChoices(state.mode==='targets'?['←','•','→']:item().choices);setView(v=>({...v,renderer:rendererMode}));
      if(resumeFeed&&state.phase==='rally'&&!physics.ball){resumeFeed=false;physics.rivalStyle='lob';physics.rivalSwing=10/3;physics.ball=strike(false,chooseOpponentReturn(sessionSeed,state.index,0),{lob:true});}
    };
    const renderGate=createArcadeRenderGate();
    const tick=now=>{
      const frameMs=now-last;const elapsed=Math.min(.35,Math.max(0,frameMs/1000));last=now;
      if(!enginePaused)scene?.sampleFrame?.(frameMs);
      const frame=consumeRallyPalsFrame(simulationRemainder,elapsed,{active:!enginePaused&&!state.saveError});simulationRemainder=frame.remainder;
      pacing.frames++;pacing.intervals.push(frameMs);if(pacing.intervals.length>120)pacing.intervals.shift();
      if(pacing.inputAt!==null){pacing.lastInputLatencyMs=Math.max(0,performance.now()-pacing.inputAt);pacing.maxInputLatencyMs=Math.max(pacing.maxInputLatencyMs,pacing.lastInputLatencyMs);pacing.inputAt=null;}
      for(let step=0;step<frame.steps&&!enginePaused&&!state.saveError;step++){const dt=RALLY_PALS_SIMULATION_STEP;gameTime+=dt;
      if(!enginePaused&&!state.saveError&&state.phase!=='complete'){
        const {x:dx,y:dz}=arcadeHeldAxes(held);
        physics.player.x=Math.max(-4.8,Math.min(4.8,physics.player.x+dx*dt*5.5));
        physics.player.z=Math.max(4.2,Math.min(8.8,physics.player.z+dz*dt*4.5));physics.moving=Boolean(dx||dz);
        physics.swing=Math.max(0,physics.swing-dt*10);physics.rivalSwing=Math.max(0,physics.rivalSwing-dt*10);
        if(state.mode==='targets'&&physics.targetPhase==='point'){physics.pointTime+=dt;if(physics.pointTime>1.2){physics.targetPhase='serve';physics.rally=0;publish({...state,message:'Take your time. Aim and serve again.'});}}else if(state.mode!=='targets'&&state.phase==='point'){physics.pointTime+=dt;if(physics.pointTime>1.8)nextPoint();}
        if(physics.ball){
          const near=physics.ball.direction==='near';
          if(state.assisted&&near&&!physics.soft){
            const difference=physics.ball.to.x-physics.player.x;
            if(!dx){physics.player.x+=Math.sign(difference)*Math.min(Math.abs(difference),dt*6.2);physics.moving=physics.moving||Math.abs(difference)>.1;}
            if(!dz)physics.player.z+=Math.sign(7.5-physics.player.z)*Math.min(Math.abs(7.5-physics.player.z),dt*4.2);
          }
          const target=physics.ball.direction==='far'?(physics.ball.time>.18?physics.ball.to.x:physics.opponent.x):physics.player.x*.45;
          const difference=target-physics.opponent.x;
          const rivalSpeed=state.mode==='coop'?6.4:state.mode==='targets'?7.5:RALLY_PALS_COURTS.findIndex(c=>c.id===state.court)===1?3.7:4.5;
          physics.opponent.x+=Math.sign(difference)*Math.min(Math.abs(difference),dt*rivalSpeed);physics.opponentMoving=Math.abs(difference)>.1;
          // Hold only ordinary return flight near contact; no reading deadline.
          const heldReturn=near&&state.rallyPause&&!physics.soft&&physics.ball.z>5.8;
          if(!heldReturn)physics.ball=stepRallyShot(physics.ball,dt);
          if(physics.soft&&physics.ball.landed){returnToServe();}
          else if(!physics.soft&&!near&&physics.ball.landed){
            if(state.mode==='targets'){const hit=Math.abs(physics.ball.x-physics.targetX)<1.25;publish({...state,targetShots:Math.min(10000,state.targetShots+1),targetHits:Math.min(10000,state.targetHits+(hit?1:0)),message:hit?'Target hit!':'Try aiming closer to the golden ring.'});physics.targetX=chooseOpponentReturn(sessionSeed,state.index,state.targetShots).x;persist();}
            const goal=state.mode==='coop'?6:state.mode==='targets'?5:item().returnsGoal;
            if(physics.rally>=goal||(state.mode==='match'&&Math.abs(physics.opponent.x-physics.ball.x)>1.8)){point('player');}
            else {physics.rivalSwing=10/3;const destination=state.mode==='coop'?{x:physics.player.x,z:7.7}:chooseOpponentReturn(sessionSeed,state.index,physics.flightCount);const lob=state.mode==='coop'||item().opponentStyle==='lob'&&physics.flightCount%2===1;physics.rivalStyle=lob?'lob':'forehand';physics.ball=strike(false,destination,{lob});}
          }else if(!physics.soft&&near){
            // Assistance widens contact and holds a caught ball; Swing still
            // belongs to the child and aiming never chooses the expected lane.
            if(state.assisted&&rallyContactWindow(physics.ball,physics.player,true)&&physics.ball.z>=7.1){physics.ball.time=Math.min(physics.ball.time,physics.ball.duration*.94);physics.ball.z=7.5;physics.ball.y=1.25;}
            if(physics.ball.landed&&!state.assisted){
              effect('recovery',playTapSound);
              physics.ball=null;physics.missTime=0;if(state.mode==='coop')physics.rally=0;publish({...state,motorMisses:state.motorMisses+1,message:state.mode==='targets'?'Missed return. Move toward the next ball.':'Missed return. Your sound point is safe.'});persist();
            }
          }
        }else if(state.mode==='targets'?physics.targetPhase==='rally':state.phase==='rally'){
          physics.missTime+=dt;
          if(physics.missTime>.8&&scene){physics.missTime=0;physics.rivalStyle='lob';physics.rivalSwing=10/3;physics.ball=strike(false,chooseOpponentReturn(sessionSeed,state.index,physics.flightCount),{lob:true});}
        }
      }
      }
      physics.phase=state.phase;
      const art=scene?.qualityStatus?.();
      const renderRevision=`${stageRef.current?.clientWidth}:${stageRef.current?.clientHeight}:${drawAt}:${JSON.stringify(art?.artDelivery)}:${art?.palDelivery}:${JSON.stringify(art?.palActionDelivery)}`;
      if(scene&&renderGate.shouldRender(enginePaused,renderRevision)){const began=performance.now();scene.draw(physics,gameTime);pacing.renderMs=performance.now()-began;}
      if(now-saveAt>100){saveAt=now;if(!disposed)setView({paused:enginePaused,renderer:rendererMode,rally:physics.rally,targetPhase:physics.targetPhase,contact:Boolean(physics.ball&&rallyContactWindow(physics.ball,physics.player,state.assisted))});}
    };
    const onKeyDown=event=>{
      if(event.target?.closest('select,input,textarea')||event.altKey||event.ctrlKey||event.metaKey)return;
      const key=event.key.toLowerCase();const directions={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down'};
      if(directions[key]){event.preventDefault();beginHeld(directions[key],`key-${key}`);return;}
      // Native focused-button activation retains its own action.
      if(event.target?.closest('button'))return;
      if(['1','2','3'].includes(key)){event.preventDefault();aim(Number(key)-1);}
      else if(key===' '&&!event.repeat){event.preventDefault();swing(false);}
      else if(key==='e'&&!event.repeat){event.preventDefault();swing(true);}
    };
    const onKeyUp=event=>releaseHeld(`key-${event.key.toLowerCase()}`);
    const onHide=()=>{hidden=document.hidden;refreshPause();},onBlur=()=>held.clear();
    document.addEventListener('keydown',onKeyDown);document.addEventListener('keyup',onKeyUp);document.addEventListener('visibilitychange',onHide);window.addEventListener('blur',onBlur);
    const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');const onMotion=event=>{reduce=event.matches;buildScene();};motion?.addEventListener?.('change',onMotion);
    const api={pause:()=>{userPaused=true;refreshPause();},resume:()=>{userPaused=false;refreshPause();},markSupported,
      inspect:snapshot,debugSnapshot:snapshot,
      aim,aimAt,swing,beginHeld,releaseHeld,changeCourt,changeMode,selectPlay,
      replay:prompt,resetTarget:()=>{if(enginePaused||state.mode!=='targets')return;effect('recovery',playTapSound);physics.ball=null;physics.targetPhase='serve';physics.rally=0;physics.soft=false;publish({...state,message:'Take your time. Aim and serve a new target rally.'});persist();},
      picture:(id,status)=>{if(item().id===id){publish({...state,pictureDelivery:status});persist();if(status==='unavailable'&&state.delivery!=='delivered')visualModel();}},
      setSound:enabled=>{sound=enabled;voice.cancel();cancelGameSfx();teachingBusy=false;serveGeneration++;if(state.mode==='targets')return;if(enabled){publish({...state,delivery:'pending'});prompt();}else visualModel();},
      toggleAssist:()=>{publish({...state,assisted:!state.assisted,message:!state.assisted?'Footwork help on. You still choose every shot.':'Manual footwork on. Move to meet the ball.'});persist();},
      toggleHold:()=>{publish({...state,rallyPause:!state.rallyPause,message:!state.rallyPause?'Rally Hold on. Incoming balls wait for your swing.':'Rally Hold off.'});persist();},
      retrySave:()=>{if(persist()){publish({...state,saveError:false,message:'Saved. Ready to play.'});persist(true);}},
    };
    controllerRef.current=api;publish();handlers.current.onSessionStart?.({seed:sessionSeed,index:state.index,total:rounds.length});
    handlers.current.onEngineReady?.(api);handlers.current.onScoreUpdate?.(state.score);handlers.current.onProgressUpdate?.(state.evidence.completions.length,rounds.length);
    persist(true);buildScene();loop=createFrameLoop(tick);loop.start();
    if(state.phase==='complete')nextPoint();
    prompt();
    return()=>{disposed=true;serveGeneration++;drawAt++;loop?.stop();voice.dispose();cancelGameSfx();scene?.dispose();held.clear();controllerRef.current=null;
      document.removeEventListener('keydown',onKeyDown);document.removeEventListener('keyup',onKeyUp);document.removeEventListener('visibilitychange',onHide);window.removeEventListener('blur',onBlur);motion?.removeEventListener?.('change',onMotion);};
  // Sound preference changes retain the same physics and stable cue.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[rounds,difficulty,sessionSeed,journey?.index,startLevel,progressScopeKey,resumedCheckpoint]);

  useEffect(()=>{if(soundRef.current!==isSoundEnabled){soundRef.current=isSoundEnabled;controllerRef.current?.setSound(isSoundEnabled);}},[isSoundEnabled]);
  useEffect(()=>{const image=cueImageRef.current;if(image?.complete)controllerRef.current?.picture(round.id,image.naturalWidth?'delivered':'unavailable');},[round.id]);
  const moveButton=(direction,Icon,label)=><button key={direction} type="button" className="rally-pals-move" aria-label={label}
    onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture?.(event.pointerId);controllerRef.current?.beginHeld(direction,`pointer-${event.pointerId}`);}}
    onPointerUp={event=>controllerRef.current?.releaseHeld(`pointer-${event.pointerId}`)}
    onPointerCancel={event=>controllerRef.current?.releaseHeld(`pointer-${event.pointerId}`)}
    onLostPointerCapture={event=>controllerRef.current?.releaseHeld(`pointer-${event.pointerId}`)}
    onKeyDown={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();controllerRef.current?.beginHeld(direction,`button-${direction}`);}}}
    onKeyUp={()=>controllerRef.current?.releaseHeld(`button-${direction}`)} onBlur={()=>controllerRef.current?.releaseHeld(`button-${direction}`)}><Icon size={28} weight="bold"/></button>;
  return <div className={`rally-pals-game ${view.paused?'is-paused':''}`} data-testid="rally-pals-game" data-pal-world={theme.id} data-hero={theme.hero} data-phase={game.mode==='targets'?(view.targetPhase==='serve'?'serve':'rally'):game.phase} data-mode={game.mode} data-renderer={view.renderer} data-index={game.index} data-aim={game.aim??''}>
    <div ref={stageRef} className="rally-pals-world" role="img" aria-label={`${theme.hero}'s ${theme.name} tennis court. Use movement, aim and swing controls to play.`} onPointerUp={event=>{
      if(event.target!==event.currentTarget&&!event.target.classList.contains('rally-pals-canvas'))return;
      const rect=event.currentTarget.getBoundingClientRect();
      controllerRef.current?.aimAt((event.clientX-rect.left)/rect.width,(event.clientY-rect.top)/rect.height);
    }}/>
    <div className="rally-pals-topline">
      <label className="rally-pals-court-label"><span>Play</span><select aria-label="Game mode and tennis court" value={game.mode==='match'?game.court:`${game.mode}:${game.court}`} onChange={event=>controllerRef.current?.selectPlay(event.target.value)}>{[ ['match','Match'],['coop','Co-op'],['targets','Targets'] ].flatMap(([mode,label])=>RALLY_PALS_COURTS.map(court=><option key={`${mode}:${court.id}`} value={mode==='match'?court.id:`${mode}:${court.id}`}>{label} · {courtTitle(court,difficulty).replace(' Court','').replace(' Garden','')}</option>))}</select></label>
      <div className="rally-pals-match" aria-label="Tennis score">{game.mode==='targets'?'Hits':game.mode==='coop'?'Team':'Points'} <strong>{game.mode==='targets'?game.targetHits:game.matchPoints}</strong> · Rally <strong>{view.rally}</strong> · Best <strong>{game.bestRally}</strong></div>
    </div>
    <div className="rally-pals-cue">
      <div className="rally-pals-picture">{game.mode!=='targets'&&round.image&&game.pictureDelivery!=='unavailable'?<img ref={cueImageRef} key={round.id} src={round.image} alt="Picture cue" draggable="false" onLoad={()=>controllerRef.current?.picture(round.id,'delivered')} onError={()=>controllerRef.current?.picture(round.id,'unavailable')}/>:<TennisBall aria-hidden="true" size={46}/>}</div>
      <div className="rally-pals-cue-copy"><strong>{game.mode==='targets'?'Aim at the golden target.':round.cue}</strong><span>{game.mode==='targets'?`${game.targetShots} shots · Tennis practice`:game.phase==='rally'?'Keep the rally going!':`Sound point ${game.index+1} / ${rounds.length}`}</span>
        {game.mode!=='targets'&&game.visualModel&&<span className="rally-pals-visual-model" aria-label="Supported visual sound model">Match: <b>{round.expected}</b></span>}
        {game.mode!=='targets'&&hint&&<span className="rally-pals-hint">Hint: <b>{hint}</b></span>}
      </div>
      <button type="button" className="rally-pals-hear" aria-label={game.mode==='targets'?'Start a new target rally':'Hear the picture cue'} onClick={()=>game.mode==='targets'?controllerRef.current?.resetTarget():controllerRef.current?.replay()}>{game.mode==='targets'?<ArrowClockwise size={25}/>:<SpeakerHigh size={25}/>}<span>{game.mode==='targets'?'Reset':'Hear'}</span></button>
    </div>
    <div className="rally-pals-lanes" role="group" aria-label="Choose your shot direction">
      {(game.mode==='targets'?['left','middle','right']:round.choices).map((choice,index)=><button type="button" key={`${round.roundId}:${index}`} aria-label={`Aim at ${choice}`} aria-pressed={game.aim===index} className={game.aim===index?'is-aimed':''} onClick={()=>controllerRef.current?.aim(index)}><span>{game.mode==='targets'?['←','•','→'][index]:choice}</span><small>{index+1}</small></button>)}
    </div>
    <div className="rally-pals-feedback" role="status" aria-live="polite">{game.message}</div>
    <div className="rally-pals-controls">
      <div className="rally-pals-movement" role="group" aria-label={`Move ${theme.hero}`}>{moveButton('left',ArrowLeft,'Move left')}{moveButton('up',ArrowUp,'Move forward')}{moveButton('down',ArrowDown,'Move back')}{moveButton('right',ArrowRight,'Move right')}</div>
      <div className="rally-pals-support"><button type="button" aria-pressed={game.assisted} onClick={()=>controllerRef.current?.toggleAssist()}><HandPalm size={19}/><span>Footwork {game.assisted?'on':'off'}</span></button><button type="button" aria-pressed={game.rallyPause} onClick={()=>controllerRef.current?.toggleHold()}><HandPalm size={19}/><span>Rally Hold</span></button></div>
      <div className="rally-pals-shots"><button type="button" className={`rally-pals-swing ${view.contact?'has-contact':''}`} onClick={()=>controllerRef.current?.swing(false)}><TennisBall size={27} weight="fill"/><span>{(game.mode==='targets'?view.targetPhase==='serve':game.phase==='serve')?'Serve':'Swing'}</span></button><button type="button" className="rally-pals-lob" onClick={()=>controllerRef.current?.swing(true)}><ArrowUp size={27} weight="bold"/><span>Lob</span></button></div>
    </div>
    {game.saveError&&<div className="rally-pals-save" role="alert"><p>Your game is waiting to save.</p><button type="button" onClick={()=>controllerRef.current?.retrySave()}><ArrowClockwise size={22}/>Try saving again</button></div>}
    {view.paused&&<div className="rally-pals-paused" aria-hidden="true">Court paused</div>}
    {game.phase==='complete'&&<div className="rally-pals-complete" role="status"><TennisBall size={50} weight="fill"/><h2>Great match!</h2><p>{game.matchPoints} tennis points · Best rally {game.bestRally}</p></div>}
  </div>;
}
