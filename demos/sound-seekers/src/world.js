import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRenderer, disposeObject, disposeRenderer } from '../../../src/components/learn/games/shared/threeShell.js';
import { LANDMARKS, FIREFLIES, START, riverZ, movePlayer, canWalk } from './rules.js';

const V=THREE.Vector3;
const PATH = [[1,25],[1,17],[-3,12],[-12,7],[-9,3],[-5,1],[3,2],[10,0],[10,-4],[9,-10],[1,-13],[-11,-20],[-10,-26],[1,-31],[6,-33]];
const TREE_SPOTS=[[-24,20,1.3],[-17,17,1],[-10,20,1.4],[11,20,1.15],[20,20,1.4],[24,11,1.2],[-25,11,1.3],[-20,7,.8],[-23,-6,1.3],[-16,-8,1.15],[-6,-3,1.05],[2,11,.85],[16,6,1.15],[23,-2,1.45],[21,-9,1.1],[23,-21,1.6],[15,-20,1.1],[4,-19,.95],[-4,-11,.8],[-23,-18,1.5],[-25,-29,1.5],[-15,-32,1.2],[-9,-35,1.2],[11,-35,1.2],[22,-31,1.5],[-32,0,2.2],[-32,-21,2.3],[32,-17,2],[-21,-42,2],[1,-46,2.2],[24,-43,2.4],[36,9,2.4],[-34,27,2],[29,27,2],[-12,35,2.2]];
function material(color,extra={}) {return new THREE.MeshStandardMaterial({color,roughness:.95,...extra});}
function mesh(g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
function ribbon(points,width,y){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new V(p[0],y,p[1])));
  const positions=[],uv=[],indices=[];
  for(let i=0;i<=180;i++){const t=i/180,p=curve.getPoint(t),d=curve.getTangent(t),n=new V(-d.z,0,d.x).multiplyScalar(width/2);positions.push(p.x+n.x,y,p.z+n.z,p.x-n.x,y,p.z-n.z);uv.push(0,t*30,1,t*30);if(i<180){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function terrain(){
  const g=new THREE.PlaneGeometry(180,180,120,120);g.rotateX(-Math.PI/2);const p=g.attributes.position,col=[];const a=new THREE.Color('#81975d'),b=new THREE.Color('#b2ba78');
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),outside=Math.max(0,Math.hypot(x/1.25,z)-38);p.setY(i,outside?Math.sin(x*.09)*Math.cos(z*.08)*outside*.35:0);const noise=(Math.sin(x*.25+Math.cos(z*.37))+Math.cos(z*.23+x*.11)+2)/4;const c=a.clone().lerp(b,noise*.75);col.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();return g;
}
function petals(){
  const gs=[];
  for(let j=0;j<5;j++){const angle=j*Math.PI*2/5;const g=new THREE.SphereGeometry(.14,8,6);g.scale(1.5,.4,.8);g.rotateY(-angle);g.translate(Math.cos(angle)*.13,.3,Math.sin(angle)*.13);gs.push(g);}
  return mergeGeometries(gs);
}
function groundTexture(){
  const size=128,data=new Uint8Array(size*size*4);let s=784;
  for(let i=0;i<size*size;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;const n=224+(s%30);data.set([n,n,n,255],i*4);}
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(70,70);texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export async function createWorld(host, callbacks, settings={}) {
  const landmarks=settings.landmarks||LANDMARKS, roads=settings.roads||[PATH];
  const walkStage=()=>settings.chapter?(restored.brook===3?2:0):mission;
  let restored={picnic:0,brook:0,garden:0,parcels:0,tree:0}, decor=null;
  let disposed=false,paused=true,phase='title',mission=0,reduce=!!settings.reduced,low=!!settings.low;
  const renderer=createRenderer(THREE,{pixelRatioCap:low?1:1.6,toneMappingExposure:1.13,shadowMap:true,powerPreference:'high-performance'});
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label','Woodland. Tap the ground to walk. Use arrow keys or W A S D to explore.');
  renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#c9d8bf');scene.fog=new THREE.Fog('#c9d8bf',40,98);
  const camera=new THREE.PerspectiveCamera(43,1,.2,180);camera.position.set(24,26,34);
  const hemi=new THREE.HemisphereLight('#fff3d1','#658982',1.35);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffe3ab',2.3);sun.position.set(-18,33,12);sun.castShadow=!low;sun.shadow.mapSize.set(low?512:2048,low?512:2048);sun.shadow.camera.left=-37;sun.shadow.camera.right=37;sun.shadow.camera.top=37;sun.shadow.camera.bottom=-37;sun.shadow.camera.far=90;sun.shadow.normalBias=.04;sun.shadow.bias=-.00012;scene.add(sun);
  const fill=new THREE.DirectionalLight('#afdbeb',.65);fill.position.set(20,10,-30);scene.add(fill);
  const ground=mesh(terrain(),material('#ffffff',{vertexColors:true,map:groundTexture()}));ground.castShadow=false;scene.add(ground);
  for(const points of roads){const road=mesh(ribbon(points,3.7,.025),material('#ddcaa0'));road.castShadow=false;scene.add(road);}
  const spur=mesh(ribbon([[1,17],[9,15],[16,14],[20,9]],2,.023),material('#cfc49c'));spur.castShadow=false;scene.add(spur);
  const waterPoints=Array.from({length:30},(_,i)=>{const x=-65+i*4.5;return [x,riverZ(x)];});
  const shore=mesh(ribbon(waterPoints,4.1,.034),material('#d2c8a0'));shore.castShadow=false;scene.add(shore);
  const water=mesh(ribbon(waterPoints,3.25,.06),material('#69b8b1',{roughness:.28,metalness:.12}));water.castShadow=false;scene.add(water);
  const ripples=[];const rippleMat=new THREE.MeshBasicMaterial({color:'#d6efcf',transparent:true,opacity:.34,side:THREE.DoubleSide});
  for(let i=0;i<24;i++){const x=-31+i*2.6;const r=mesh(new THREE.TorusGeometry(.38+(i%3)*.14,.012,4,28),rippleMat,x,.08,riverZ(x)+Math.sin(i)*.7);r.rotation.x=Math.PI/2;r.scale.y=.3;r.castShadow=false;scene.add(r);ripples.push(r);}
  const stoneMat=material('#aeb5a1');const bridge=new THREE.Group();bridge.position.set(10,0,riverZ(10));scene.add(bridge);
  const stones=[];
  for(let i=0;i<6;i++){const s=mesh(new THREE.SphereGeometry(1,18,12),stoneMat,0,.22,-1.75+i*.7);s.scale.set(1.48,.24,.55);bridge.add(s);stones.push(s);}
  const circleG=new THREE.CircleGeometry(1,64);const gladeMat=material('#dbcb9b');
  for(const [i,l] of landmarks.entries()){const disc=mesh(circleG,gladeMat,l.x,.035,l.z);disc.rotation.x=-Math.PI/2;disc.scale.setScalar((!settings.chapter&&i===3)?4.5:3.3);disc.castShadow=false;scene.add(disc);}
  const garden=new THREE.Group();garden.position.set(-11,0,-20);scene.add(garden);const gardenFlowers=[];
  const basket=new THREE.Group();basket.position.set(-12.2,.18,6.4);scene.add(basket);const basketMat=material('#bc955c');
  const bowl=mesh(new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.35,.04),new THREE.Vector2(.6,.15),new THREE.Vector2(.72,.7),new THREE.Vector2(.68,.74),new THREE.Vector2(.57,.2),new THREE.Vector2(0,.13)],40),basketMat);basket.add(bowl);
  const handleCurve=new THREE.CatmullRomCurve3([new V(-.67,.63,0),new V(-.5,1.4,0),new V(0,1.65,0),new V(.5,1.4,0),new V(.67,.63,0)]);basket.add(mesh(new THREE.TubeGeometry(handleCurve,32,.055,8,false),basketMat));const packedTokens=[];
  for(let i=0;i<6;i++){const token=mesh(new THREE.SphereGeometry(.18,14,10),material('#efbf64'),Math.cos(i*2.4)*.35,.58+i*.025,Math.sin(i*2.4)*.35);token.scale.y=.5;basket.add(token);packedTokens.push(token);}
  const stemMat=material('#507d5a'),goldMat=material('#ffcf65',{emissive:'#ffb93a',emissiveIntensity:.3}),petalMat=material('#f4c5a7');
  for(let i=0;i<6;i++){const angle=i*Math.PI*2/6;const stem=new THREE.CatmullRomCurve3([new V(),new V(.1,.5,0),new V(0,1.2,0)]);const group=new THREE.Group();group.position.set(Math.cos(angle)*2.8,0,Math.sin(angle)*2.8);group.add(mesh(new THREE.TubeGeometry(stem,12,.045,6,false),stemMat));const head=mesh(petals(),petalMat,0,1.1,0);head.scale.setScalar(2.5);group.add(head);const bulb=mesh(new THREE.SphereGeometry(.2,12,10),goldMat,0,1.35,0);group.add(bulb);garden.add(group);gardenFlowers.push(group);}
  // Soft planting, joined once per material; plants never resemble answer tokens.
  const greens=[],flowers=[];let randomSeed=4242;
  const rand=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
  for(let i=0;i<260;i++){const x=rand()*58-29,z=rand()*67-38;if(Math.abs(z-riverZ(x))<2.7)continue;
    const near=roads.some(road=>road.some(p=>Math.hypot(p[0]-x,p[1]-z)<2.8));if(near)continue;
    const g=new THREE.SphereGeometry(.12+rand()*.12,6,5);g.scale(.5,2.5,.4);g.rotateZ(rand()-.5);g.translate(x,.2,z);greens.push(g);
    if(i%3===0){const f=petals();f.translate(x,0,z);flowers.push(f);}
  }
  if(greens.length)scene.add(mesh(mergeGeometries(greens),material('#64865a')));
  if(flowers.length)scene.add(mesh(mergeGeometries(flowers),material('#f5deb0')));
  const lightOrbs=FIREFLIES.map((p,i)=>{const o=mesh(new THREE.SphereGeometry(.16,14,10),material('#f8f2bc',{emissive:'#ffc94e',emissiveIntensity:2.2}),p.x,1.3,p.z);o.userData.id=i;scene.add(o);return o;});
  const dustPos=new Float32Array(120*3);for(let i=0;i<120;i++){dustPos[i*3]=rand()*52-26;dustPos[i*3+1]=1+rand()*6;dustPos[i*3+2]=rand()*64-36;}
  const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));const dust=new THREE.Points(dustG,new THREE.PointsMaterial({color:'#fff5c7',size:.065,transparent:true,opacity:.65}));scene.add(dust);
  const marker=new THREE.Group();scene.add(marker);const ring=mesh(new THREE.TorusGeometry(1,.045,8,64),material('#fff0b2',{emissive:'#deb147',emissiveIntensity:.3}));ring.rotation.x=Math.PI/2;ring.position.y=.13;marker.add(ring);
  const motes=new THREE.Group();scene.add(motes);for(let i=0;i<20;i++){const m=mesh(new THREE.SphereGeometry(.06,6,5),goldMat);m.visible=false;motes.add(m);}
  const clickRing=mesh(new THREE.TorusGeometry(.35,.025,6,24),rippleMat);clickRing.rotation.x=Math.PI/2;clickRing.position.y=.16;clickRing.visible=false;scene.add(clickRing);
  const loader=new GLTFLoader();let hero,heroBody,mixer,actions={},actionName='',lanternTree;const treeClones=[],obstacles=[],residentMixers=[],residents={};
  async function load(path) {const gltf=await loader.loadAsync(settings.assetUrl?settings.assetUrl(path):`/assets/${path}`);if(disposed){disposeObject(gltf.scene);throw new Error('Scene closed');}gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material)o.material.roughness=Math.max(.65,o.material.roughness??.8);}});return gltf;}
  try {
    const [bouncy,tree,cottage,lantern,mushroom,rock]=await Promise.all([load('characters/bouncy.glb'),load('forest/tree.glb'),load('forest/cottage.glb'),load('forest/lantern-tree.glb'),load('forest/mushrooms.glb'),load('forest/rock.glb')]);
    hero=new THREE.Group();heroBody=bouncy.scene;heroBody.scale.setScalar(1.13);hero.add(heroBody);scene.add(hero);mixer=new THREE.AnimationMixer(heroBody);for(const c of bouncy.animations)actions[c.name]=mixer.clipAction(c);
    TREE_SPOTS.forEach(([x,z,s],i)=>{if(settings.chapter&&x===15&&z===-20){x=18;z=-18;}const t=tree.scene.clone(true);t.position.set(x,0,z);t.scale.setScalar(s);t.rotation.y=i*1.83;scene.add(t);treeClones.push(t);if(x>-26&&x<26&&z>-35&&z<24)obstacles.push({x,z,r:.65*s});});
    const home=cottage.scene;home.position.set(-14,0,2.3);home.rotation.y=.2;scene.add(home);obstacles.push({x:-14,z:2.3,r:2.3});
    lanternTree=lantern.scene;lanternTree.position.set(1,0,-34);scene.add(lanternTree);obstacles.push({x:1,z:-34,r:1.8});
    [[-19,12,.8],[16,10,.8],[-4,-18,1],[17,-27,1.2],[-18,-24,.9]].forEach(([x,z,s],i)=>{const m=mushroom.scene.clone(true);if(settings.chapter&&x===-18&&z===-24){x=-21;z=-22;}m.position.set(x,0,z);m.scale.setScalar(s);m.rotation.y=i*1.9;scene.add(m);});
    [[-23,17,1],[-20,-1,1],[20,0,.6],[20,-18,1.3],[-18,-28,.9],[11,-30,.7],[-4,6,.65]].forEach(([x,z,s])=>{const r=rock.scene.clone(true);r.position.set(x,0,z);r.scale.setScalar(s);scene.add(r);obstacles.push({x,z,r:.7*s});});
    for(const resident of [{file:'woolly',x:-14.6,z:7.6,scale:1},{file:'splashy',x:12.4,z:-.8,scale:1},{file:'clucky',x:-13.7,z:-18.7,scale:1}]){
      const model=await load(`characters/${resident.file}.glb`);model.scene.position.set(resident.x,0,resident.z);model.scene.userData.home={x:resident.x,z:resident.z};model.scene.scale.setScalar(resident.scale);model.scene.rotation.y=.4;scene.add(model.scene);residents[resident.file]=model.scene;const rm=new THREE.AnimationMixer(model.scene);const idle=model.animations.find(a=>a.name==='Idle');if(idle)rm.clipAction(idle).play();residentMixers.push(rm);
    }
    decor=settings.decorate?.(scene);
    callbacks.ready?.();
  }catch(error){if(!disposed)callbacks.failure?.(error);}
  const player={...START,vx:0,vz:0};const input={x:0,z:0,run:false};let destination=null,routeQueue=[],frame=0,last=0,acc=0,t=0,snapshotTime=0,burstTime=0,collected=[],glow=0,frameAverage=16.7;
  const look=new V(0,1,4),camTarget=new V(),lookTarget=new V();
  function setAnimation(name){if(name===actionName)return;const next=actions[name]||Object.values(actions).find(a=>a.getClip().name.toLowerCase().includes(name.toLowerCase()));if(!next)return;const previous=actions[actionName];next.reset().fadeIn(.18).play();previous?.fadeOut(.18);actionName=name;}
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new V(0,1,0),0),hit=new V();
  function onGround(event){if(paused||phase!=='explore')return;const box=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);if(ray.ray.intersectPlane(plane,hit)&&canWalk(hit.x,hit.z,walkStage(),obstacles)){routeQueue=[];destination={x:hit.x,z:hit.z};clickRing.position.set(hit.x,.16,hit.z);clickRing.visible=true;renderer.domElement.focus({preventScroll:true});}}
  renderer.domElement.addEventListener('pointerdown',onGround);
  function lost(event){event.preventDefault();callbacks.failure?.(new Error('Graphics paused. Your journey is saved.'));}
  renderer.domElement.addEventListener('webglcontextlost',lost);
  const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(Math.max(1,width),Math.max(1,height));camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function update(now){
    if(disposed)return;frame=requestAnimationFrame(update);const actualDt=last?(now-last)/1000:0;frameAverage+=((actualDt||.0167)*1000-frameAverage)*.025;const dt=Math.min(actualDt,.08);last=now;if(!paused||phase==='title')t+=dt;
    if(!paused&&phase==='explore'){
      let dx=input.x,dz=input.z;
      if(destination&&!dx&&!dz){const len=Math.hypot(destination.x-player.x,destination.z-player.z);if(len<.25){destination=routeQueue.shift()||null;clickRing.visible=false;}else{dx=(destination.x-player.x)/len;dz=(destination.z-player.z)/len;}}
      else if(dx||dz){destination=null;routeQueue=[];clickRing.visible=false;}
      // Camera-relative keyboard axes; tap-to-walk already uses world space.
      const move=destination?{x:dx,z:dz,run:input.run}:{x:dx*.857+dz*.514,z:-dx*.514+dz*.857,run:input.run};
      acc+=dt;while(acc>=1/60){movePlayer(player,move,1/60,walkStage(),obstacles);acc-=1/60;}
      for(let i=0;i<FIREFLIES.length;i++)if(!collected.includes(i)&&Math.hypot(player.x-FIREFLIES[i].x,player.z-FIREFLIES[i].z)<1.35){collected.push(i);callbacks.collect?.(i);burstTime=t;}
    }else acc=0;
    if(hero){hero.position.set(player.x,.02,player.z);const speed=Math.hypot(player.vx,player.vz);if(speed>.2&&!paused&&phase==='explore'){const angle=Math.atan2(player.vx,player.vz);hero.rotation.y+=Math.atan2(Math.sin(angle-hero.rotation.y),Math.cos(angle-hero.rotation.y))*Math.min(1,dt*12);}setAnimation(phase==='complete'||phase==='reward'?'Celebrate':speed>.3&&!paused&&phase==='explore'?'Walk':'Idle');if(!paused||phase==='title'){mixer.timeScale=actionName==='Walk'?Math.max(.75,speed/4):1;mixer.update(dt);residentMixers.forEach(m=>m.update(dt));}}
    const target=landmarks[Math.min(mission,landmarks.length-1)];marker.position.set(target.x,0,target.z);marker.visible=phase==='explore';ring.scale.setScalar(reduce?1:1+Math.sin(t*2)*.06);
    for(let i=0;i<stones.length;i++)stones[i].visible=(settings.chapter?restored.brook===3||restored.brook>=1&&i<3||restored.brook>=2&&i<5:mission>=2)||i===0||i===5;
    packedTokens.forEach(token=>{token.visible=settings.chapter?restored.picnic>=1:mission>=1;});
    gardenFlowers.forEach((g,i)=>{g.scale.y=settings.chapter?(.35+Math.min(3,restored.garden)*.217):(mission>=3?1:.35);g.rotation.y=reduce?0:Math.sin(t+i)*.04;});
    if(lanternTree){const wanted=phase==='complete'?1:settings.chapter?([restored.picnic,restored.brook,restored.garden].filter(n=>n===3).length/3*.35+restored.tree*.12):mission/3*.35;glow+=Math.min(1,dt*1.5)*(wanted-glow);lanternTree.traverse(o=>{if(o.isMesh&&o.name.startsWith('Lantern_')&&o.material.emissive)o.material.emissiveIntensity=.08+glow*3;});}
    lightOrbs.forEach((o,i)=>{o.visible=!collected.includes(i);o.position.y=1.3+(reduce?0:Math.sin(t*2+i)*.22);});
    if(!reduce&&!paused){dust.rotation.y=Math.sin(t*.03)*.04;ripples.forEach((r,i)=>r.scale.setScalar(.85+Math.sin(t+i)*.2));}
    dust.visible=!low;
    if(burstTime&&t-burstTime<1.3&&!reduce){motes.children.forEach((m,i)=>{m.visible=true;const a=i*2.4,age=t-burstTime;m.position.set(player.x+Math.cos(a)*age*2,1+Math.sin(age*2)*2,player.z+Math.sin(a)*age*2);m.scale.setScalar(1-age/1.3);});}else motes.children.forEach(m=>m.visible=false);
    if(phase==='title'){camTarget.set(23,22,30);lookTarget.set(-3,0,0);}
    else if(phase==='activity'||phase==='reward'){camTarget.set(target.x+8,12,target.z+13);lookTarget.set(target.x,.5,target.z);}
    else if(phase==='complete'){camTarget.set(18,17,-12);lookTarget.set(1,4,-33);}
    else {const extra=camera.aspect<.85?1.28:1;camTarget.set(player.x+6.2*extra,10.5*extra,player.z+12*extra);lookTarget.set(player.x,1,player.z-2);}
    const damp=reduce?1:1-Math.exp(-dt*4);camera.position.lerp(camTarget,damp);look.lerp(lookTarget,damp);camera.lookAt(look);
    // Foreground trees cannot conceal Bouncy or the walkable interaction point.
    treeClones.forEach(tr=>{const tx=tr.position.x-player.x,tz=tr.position.z-player.z;tr.visible=!(phase!=='title'&&tz>-1&&tz<17&&Math.abs(tx-tz*6.2/12)<3.5*tr.scale.x+1);});
    if(now-snapshotTime>90){snapshotTime=now;host.dataset.frameMs=frameAverage.toFixed(1);const near=Math.hypot(target.x-player.x,target.z-player.z)<3.9;const projected=new V(target.x,2.8,target.z).project(camera);callbacks.snapshot?.({x:player.x,z:player.z,near,marker:{x:(projected.x+1)/2*host.clientWidth,y:(1-projected.y)/2*host.clientHeight,visible:projected.z<1},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});}
    renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(update);
  return {
    setState(state){restored=state.repairs||restored;decor?.update(restored);if(settings.chapter){const active=landmarks[Math.min(state.mission,landmarks.length-1)];for(const [id,model] of Object.entries(residents)){const follows=id==='woolly'&&['picnic','parcels'].includes(active.projectId)||id==='splashy'&&active.projectId==='brook'||id==='clucky'&&active.projectId==='garden';if(state.phase==='complete'){const i=['woolly','splashy','clucky'].indexOf(id);model.position.set(-2+i*3,0,-29);model.rotation.y=.3;}else if(follows){model.position.set(active.x-2.3,0,active.z-1.3);model.rotation.y=.4;}else{const home=model.userData.home;model.position.set(home.x,0,home.z);model.rotation.y=.4;}}}phase=state.phase;paused=state.paused;renderer.domElement.tabIndex=phase==='explore'&&!paused?0:-1;mission=state.mission;collected=[...state.fireflies];reduce=state.reduced;low=state.low;sun.castShadow=!low;renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.6));if(paused){input.x=input.z=0;player.vx=player.vz=0;destination=null;}},
    restore(position){player.x=position.x;player.z=position.z;player.vx=player.vz=0;input.x=input.z=0;destination=null;routeQueue=[];clickRing.visible=false;acc=0;},
    move(x,z){input.x=x;input.z=z;},
    guide(){const goal=landmarks[Math.min(mission,landmarks.length-1)];if(settings.route){routeQueue=settings.route(player,goal,walkStage(),obstacles);destination=routeQueue.shift()||null;return;}const index=PATH.reduce((best,p,i)=>Math.hypot(p[0]-player.x,p[1]-player.z)<Math.hypot(PATH[best][0]-player.x,PATH[best][1]-player.z)?i:best,0);const goalIndex=PATH.findIndex(p=>Math.hypot(p[0]-goal.x,p[1]-goal.z)<1);const points=index<=goalIndex?PATH.slice(index,goalIndex+1):PATH.slice(goalIndex,index+1).reverse();routeQueue=points.map(p=>({x:p[0],z:p[1]}));destination=routeQueue.shift()||{x:goal.x,z:goal.z};},
    burst(){burstTime=t;},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',onGround);renderer.domElement.removeEventListener('webglcontextlost',lost);mixer?.stopAllAction();residentMixers.forEach(m=>m.stopAllAction());disposeObject(scene);disposeRenderer(renderer,{forceContextLoss:true});},
  };
}
