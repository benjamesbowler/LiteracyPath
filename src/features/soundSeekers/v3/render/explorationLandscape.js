import { HERO_BILLBOARD,RESIDENT_BILLBOARD,cameraReachBeforeObstacle,prepareLandscapeContext } from './adventurePresentation.js';
import { visibleAdventureNodes,adventureResidents } from '../engine/adventureNavigation.js';
import { SOUND_SEEKERS_CAMPAIGN_PALETTE as P } from '../../visual/visualTokens.js';
import { LEARNING_SPRITES,PUZZLE_SPRITES,drawPuzzleSprite } from './puzzleSprites.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CAST } from '../content/cast.js';
import { drawCampaignHero,createCampaignHeroAnimator,getCampaignHeroAssets,HERO_ANIMATIONS } from './campaignHeroes.js';
import { getCampaignRestorationState } from './campaignRestoration.js';
import { drawCampaignProp } from './campaignProps.js';
import { WORLD_MATERIALS } from './illustratedWorldArt.js';
import { getImage,preload } from './sprites.js';
const S=30;
const MODEL_ROOT='/models/library/kaykit/medieval/models/';
export const EXPLORATION_MODELS={
  tree:'/models/quest/nature/BirchTree_1.gltf',bush:'/models/quest/nature/Bush_Large.gltf',flowers:'/models/quest/nature/Bush_Flowers.gltf',
  tent:`${MODEL_ROOT}decoration/props/tent.gltf`,
  gate:`${MODEL_ROOT}buildings/neutral/fence_wood_straight_gate.gltf`
};
const themes={meadow:{sky:P['landscape-1'],fog:P['landscape-2'],grass:P['landscape-3'],sun:P['landscape-4']},dino:{sky:P['landscape-5'],fog:P['landscape-6'],grass:P['landscape-7'],sun:P['landscape-8']},moonwood:{sky:P['landscape-9'],fog:P['landscape-10'],grass:P['landscape-11'],sun:P['landscape-12']}};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const segmentDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
export function createLandscapeSurface(layout){
  const routes=layout.paths;
  const pathDistance=(px,py)=>Math.min(...routes.map(([a,b])=>segmentDistance(px,py,a,b)),...layout.nodes.map(n=>Math.hypot(px-n.x,py-n.y)));
  const height=(x,z)=>{
    const px=x*S,pz=z*S;
    const outside=Math.max(0,-x,x-layout.width/S,-z,z-layout.height/S);
    if(outside>5)return Math.min(48,Math.pow(outside*.23,1.25))*(.6+.25*Math.sin(x*.034+z*.052)+.11*Math.sin(x*.147-z*.093)+.07*Math.sin(x*.43+z*.31))+Math.sin(x*.16)*2;
    const hill=1.4+Math.sin(x*.17)*Math.cos(z*.12)*1.1+Math.cos(x*.07-z*.18)*.8;
    const quiet=clamp(pathDistance(px,pz)/220,0,1);
    let result=hill*quiet;
    const waterDistance=Math.max(0,layout.riverX-px,px-layout.riverX-layout.riverWidth);
    result=result*clamp(waterDistance/95,0,1)-.65*(1-clamp(waterDistance/40,0,1));
    return result;
  };
  return {height,pathDistance,groundHeight:(x,z,shortcut)=>layout.bridges.some(b=>(!b.shortcut||shortcut)&&x*S>=b.x&&x*S<=b.x+b.width&&z*S>=b.y&&z*S<=b.y+b.height)?.25:height(x,z)};
}

export function createExplorationLandscape({canvas,layout,stage,heroId,nodes,completed,isAvailable,reducedMotion,simplifiedBackgrounds,onFailure}){
  const theme=themes[stage.worldId]||themes.meadow,surface=createLandscapeSurface(layout),scene=new THREE.Scene();
  scene.background=new THREE.Color(theme.sky);scene.fog=new THREE.FogExp2(theme.fog,.006);
  const renderer=new THREE.WebGLRenderer({canvas,context:prepareLandscapeContext(canvas),antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,simplifiedBackgrounds?1:1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=!simplifiedBackgrounds;renderer.shadowMap.type=THREE.PCFShadowMap;
  const occluders=[],cameraDirection=new THREE.Vector3();
  const camera=new THREE.PerspectiveCamera(52,1,.15,400),target=new THREE.Vector3(),desired=new THREE.Vector3(),cameraPoint=new THREE.Vector3();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),resources=new Set(),roots=[];
  let disposed=false,terrain=null,water=null,bridge=null,lever=null,bridgeLift=0,lastFrame=-1,lastRenderTime=0,lastWidth=0,lastHeight=0,restorationKey='',grassUniform={value:0};
  const released=new Set();
  function disposeTree(root){root.traverse(o=>{for(const resource of [o.geometry,...(o.material?(Array.isArray(o.material)?o.material:[o.material]):[])]){if(!resource||released.has(resource))continue;released.add(resource);for(const v of Object.values(resource))if(v?.isTexture&&!released.has(v)){released.add(v);v.dispose();}resource.dispose();}});}
  const register=resource=>{if(disposed){resource.dispose();released.add(resource);}else resources.add(resource);return resource;};
  const hemisphere=new THREE.HemisphereLight(P['landscape-13'],P['landscape-14'],1.8);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight(theme.sun,2.3);sun.position.set(-25,65,30);sun.castShadow=!simplifiedBackgrounds;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:150});sun.shadow.bias=-.0005;sun.shadow.normalBias=.08;scene.add(sun);scene.add(sun.target);
  const skyGeo=register(new THREE.SphereGeometry(280,32,16));
  const skyMat=register(new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(theme.sky)},bottom:{value:new THREE.Color(theme.fog)}},vertexShader:'varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vP; uniform vec3 top; uniform vec3 bottom; void main(){float h=clamp(normalize(vP).y*1.8,0.,1.);gl_FragColor=vec4(mix(bottom,top,h),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));scene.add(new THREE.Mesh(skyGeo,skyMat));
  function canvasTexture(width,height,paint){const c=document.createElement('canvas');c.width=width;c.height=height;paint(c.getContext('2d'),c);const texture=register(new THREE.CanvasTexture(c));texture.colorSpace=THREE.SRGBColorSpace;return texture;}
  function sprite(texture,x,y,z,height,width=height){const mat=register(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:true,toneMapped:false}));const s=new THREE.Sprite(mat);s.position.set(x,y+height/2,z);s.scale.set(width,height,1);scene.add(s);return s;}
  const heroCanvas=document.createElement('canvas');heroCanvas.width=HERO_BILLBOARD.size;heroCanvas.height=HERO_BILLBOARD.size;
  const heroTexture=register(new THREE.CanvasTexture(heroCanvas));heroTexture.colorSpace=THREE.SRGBColorSpace;
  const hero=sprite(heroTexture,0,0,0,HERO_BILLBOARD.worldSize),heroAnimator=createCampaignHeroAnimator(heroId),actors=[],labels=[],doors=[];let lastHeroPose='';
  // Replace a loading-time walk fallback even when the idle pose has not changed.
  void preload(getCampaignHeroAssets(heroId)).then(()=>{if(!disposed)lastHeroPose='';});
  const shadowTexture=canvasTexture(128,128,c=>{const g=c.createRadialGradient(64,64,3,64,64,62);g.addColorStop(0,P['adventure-8']);g.addColorStop(1,P['adventure-9']);c.fillStyle=g;c.fillRect(0,0,128,128);});
  const shadow=new THREE.Mesh(register(new THREE.PlaneGeometry(2.8,2.8)),register(new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false})));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  function labelTexture(text){return canvasTexture(512,96,c=>{c.fillStyle=P['adventure-10'];c.beginPath();c.roundRect(5,5,502,86,30);c.fill();c.font='700 36px Nunito, sans-serif';c.textAlign='center';c.fillStyle=P['adventure-11'];c.fillText(text,256,62);});}
  const footprints=[],footGeometry=register(new THREE.PlaneGeometry(.48,.72));
  const footprintTexture=canvasTexture(64,64,c=>{c.fillStyle=P['hero-shadow'];c.beginPath();c.ellipse(32,38,14,20,0,0,Math.PI*2);c.fill();});
  for(let i=0;i<24;i++){const material=register(new THREE.MeshBasicMaterial({map:footprintTexture,transparent:true,depthWrite:false,opacity:0})),mark=new THREE.Mesh(footGeometry,material);mark.rotation.x=-Math.PI/2;mark.visible=false;scene.add(mark);footprints.push({mark,born:-10});}
  let footDistance=0,footCursor=0,previousJump=false;
  const landingRing=new THREE.Mesh(register(new THREE.RingGeometry(.6,.75,32)),register(new THREE.MeshBasicMaterial({color:P['world-tone-2'],transparent:true,depthWrite:false,opacity:0,side:THREE.DoubleSide})));landingRing.rotation.x=-Math.PI/2;scene.add(landingRing);let landedAt=-10;
  const restorationCanvas=document.createElement('canvas');restorationCanvas.width=800;restorationCanvas.height=500;
  const restorationTexture=register(new THREE.CanvasTexture(restorationCanvas));restorationTexture.colorSpace=THREE.SRGBColorSpace;
  const restoration=sprite(restorationTexture,layout.landmark.x/S,surface.height(layout.landmark.x/S,layout.landmark.y/S),layout.landmark.y/S,5,8);
  let naturalProps=null;
  function refreshRestoration(){const key=stage.missionIds.map(id=>Boolean(completed()[id])).join();if(key===restorationKey)return;restorationKey=key;const c=restorationCanvas.getContext('2d');c.clearRect(0,0,800,500);const state=getCampaignRestorationState(stage.id,completed());
    // The task inventory retains its exact authored composition; natural scenery
    // is modeled in the landscape instead of drawing a flat tree billboard.
    for(const prop of state.props){if(naturalProps?.has(prop.kind))continue;const {kind,x,y,...appearance}=prop;drawCampaignProp(c,kind,400+x,430+y,appearance);}
    restorationTexture.needsUpdate=true;}
  function normalize(model,width){const root=model.scene.clone(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());const scale=width/Math.max(size.x,size.z,.01);root.scale.setScalar(scale);root.position.set(-((box.min.x+box.max.x)/2)*scale,-box.min.y*scale,-((box.min.z+box.max.z)/2)*scale);const group=new THREE.Group();group.add(root);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){mat.side=THREE.DoubleSide;if(/leave|leaf/i.test(mat.name)){mat.color.set(stage.worldId==='moonwood'?P['landscape-15']:stage.worldId==='dino'?P['landscape-16']:P['landscape-17']);mat.roughness=1;}if(mat.transparent){mat.alphaTest=.4;mat.depthWrite=true;mat.transparent=false;}}}}});return group;}
  function place(model,x,z,width,rotation=0){const group=normalize(model,width);group.position.set(x,surface.height(x,z),z);group.rotation.y=rotation;scene.add(group);occluders.push(group);return group;}
  const loader=new GLTFLoader();
  const modelLoads=Object.entries(EXPLORATION_MODELS).map(async([key,path])=>{const model=await loader.loadAsync(path);if(disposed)disposeTree(model.scene);else roots.push(model.scene);return [key,model];});
  const ready=Promise.all(modelLoads).then(async entries=>{
    const models=Object.fromEntries(entries);if(disposed)return;
    await preload([LEARNING_SPRITES,PUZZLE_SPRITES,...nodes.flatMap(n=>{const id=n.mission.residentId===heroId?n.mission.residentAlternateId:n.mission.residentId;return [CAST[id]?.sprite,...getCampaignHeroAssets(id)];})]);if(disposed)return;
    const source=await new THREE.TextureLoader().loadAsync(WORLD_MATERIALS);register(source);if(disposed)return;
    const row={meadow:0,dino:1,moonwood:2}[stage.worldId]||0;
    const materialTexture=col=>{const t=canvasTexture(512,512,c=>{const sw=source.image.width/4,sh=source.image.height/3;c.drawImage(source.image,col*sw+2,row*sh+2,sw-4,sh-4,0,0,512,512);});t.wrapS=t.wrapT=THREE.MirroredRepeatWrapping;t.repeat.set(75,65);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;};
    const grass=materialTexture(0),path=materialTexture(1),waterMap=materialTexture(2);
    const sizeX=layout.width/S+180,sizeZ=layout.height/S+180;
    const geometry=register(new THREE.PlaneGeometry(sizeX,sizeZ,180,160));geometry.rotateX(-Math.PI/2);geometry.translate(layout.width/S/2,0,layout.height/S/2);
    const positions=geometry.attributes.position,weights=new Float32Array(positions.count),colors=new Float32Array(positions.count*3);
    for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,surface.height(x,z));weights[i]=1-THREE.MathUtils.smoothstep(surface.pathDistance(x*S,z*S),45,92);const color=new THREE.Color(P['landscape-18']).lerp(new THREE.Color(P['landscape-19']),clamp((surface.height(x,z)-8)/35,0,.8));colors.set([color.r,color.g,color.b],i*3);}
    geometry.setAttribute('pathWeight',new THREE.BufferAttribute(weights,1));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
    const groundMaterial=register(new THREE.MeshStandardMaterial({map:grass,vertexColors:true,roughness:1}));
    groundMaterial.onBeforeCompile=shader=>{shader.uniforms.pathTexture={value:path};shader.uniforms.groundTint={value:new THREE.Color(theme.grass)};shader.vertexShader='attribute float pathWeight; varying float vPathWeight;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPathWeight=pathWeight;');shader.fragmentShader='uniform sampler2D pathTexture; uniform vec3 groundTint; varying float vPathWeight;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\nvec4 sampledDiffuseColor = mix(mix(vec4(groundTint,1.),texture2D(map,vMapUv),.48),texture2D(pathTexture,vMapUv),vPathWeight); diffuseColor *= sampledDiffuseColor;\n#endif');};
    terrain=new THREE.Mesh(geometry,groundMaterial);terrain.receiveShadow=true;scene.add(terrain);
    const waterMat=register(new THREE.MeshStandardMaterial({map:waterMap,color:stage.worldId==='moonwood'?P['landscape-20']:P['landscape-21'],transparent:true,opacity:.84,roughness:.19,metalness:.2}));waterMap.repeat.set(2,20);
    water=new THREE.Mesh(register(new THREE.PlaneGeometry(layout.riverWidth/S,layout.height/S+15,1,30)),waterMat);water.rotation.x=-Math.PI/2;water.position.set((layout.riverX+layout.riverWidth/2)/S,-.1,layout.height/S/2);scene.add(water);
    const stoneMap=canvasTexture(512,512,c=>{const sw=source.image.width/4,sh=source.image.height/3;c.drawImage(source.image,sw*3+2,sh*2+2,sw-4,sh-4,0,0,512,512);});stoneMap.wrapS=stoneMap.wrapT=THREE.RepeatWrapping;
    const stoneMaterial=register(new THREE.MeshStandardMaterial({map:stoneMap,roughness:1,color:P['landscape-22']}));
    let bark;models.tree.scene.traverse(o=>{if(o.material?.name?.includes('Bark'))bark=o.material.map;});
    const barkMaterial=register(new THREE.MeshStandardMaterial({map:bark,color:P['landscape-23'],roughness:1}));
    const deckMaterial=register(new THREE.MeshStandardMaterial({map:bark,color:P['landscape-24'],roughness:.94}));
    const ropeMaterial=register(new THREE.MeshStandardMaterial({color:P['landscape-25'],roughness:1}));
    for(const b of layout.bridges){
      const group=new THREE.Group(),w=b.width/S,d=b.height/S;
      // Deck tops and collision feet share y=.25; broad rails sit outside the
      // usable crossing width. No visual arch floating above the actual route.
      for(let i=0;i<16;i++){const plank=new THREE.Mesh(register(new THREE.BoxGeometry(w/16-.012,.22,d)),deckMaterial);plank.position.set(-w/2+(i+.5)*w/16,.14,0);plank.receiveShadow=true;group.add(plank);}
      for(const side of [-1,1]){
        for(const x of [-w/2,w/2]){const post=new THREE.Mesh(register(new THREE.CylinderGeometry(.08,.11,1.3,12)),barkMaterial);post.position.set(x,.65,side*d/2);post.castShadow=true;group.add(post);}
        const points=[new THREE.Vector3(-w/2,1.2,side*d/2),new THREE.Vector3(0,.85,side*d/2),new THREE.Vector3(w/2,1.2,side*d/2)];const rail=new THREE.Mesh(register(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.035,6,false)),ropeMaterial);group.add(rail);
      }
      group.position.set((b.x+b.width/2)/S,0,(b.y+b.height/2)/S);scene.add(group);if(b.shortcut){bridge=group;group.position.x=b.x/S;for(const child of group.children)child.position.x+=w/2;group.rotation.z=Math.PI*.48;}
    }
    naturalProps=new Set(['tree','fern','hedge','reed','stone','rock','bank','pond','path','ledge','root','lily']);
    for(const prop of getCampaignRestorationState(stage.id,completed()).props){
      if(!naturalProps.has(prop.kind))continue;
      const x=layout.landmark.x/S+prop.x/65,z=layout.landmark.y/S+prop.y/110;
      if(['tree','fern','hedge','reed'].includes(prop.kind))place(prop.kind==='tree'?models.tree:models.bush,x,z,prop.size/38);
      else if(['stone','rock','bank','ledge','root'].includes(prop.kind)){const mesh=new THREE.Mesh(register(new THREE.IcosahedronGeometry(1,2)),stoneMaterial);mesh.scale.set(prop.size/65,prop.size/110,prop.size/90);mesh.position.set(x,surface.height(x,z),z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
      else if(prop.kind==='pond'){const pond=new THREE.Mesh(register(new THREE.CircleGeometry(prop.size/65,48)),waterMat);pond.rotation.x=-Math.PI/2;pond.position.set(x,surface.height(x,z)+.04,z);scene.add(pond);}
    }
    for(const b of layout.blockers){if(b.kind==='grove'){for(let n=0;n<3;n++)place(models.tree,(b.x+45+n*80)/S,(b.y+b.height/2)/S,3.5+n*.25,n*1.7);}else if(b.kind==='rock'){const geometry=register(new THREE.IcosahedronGeometry(1,3)),p=geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),noise=1+Math.sin(x*9+z*3)*.09+Math.sin(y*14-z*8)*.07;p.setXYZ(i,x*noise,y*noise,z*noise);}geometry.computeVertexNormals();const rock=new THREE.Mesh(geometry,stoneMaterial);rock.scale.set(b.width/S*.55,1.7,b.height/S*.6);rock.position.set((b.x+b.width/2)/S,surface.height((b.x+b.width/2)/S,(b.y+b.height/2)/S)+.65,(b.y+b.height/2)/S);rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);}else if(b.kind==='log'){const log=new THREE.Mesh(register(new THREE.CylinderGeometry(.46,.54,b.width/S,24)),barkMaterial);log.rotation.z=Math.PI/2;log.position.set((b.x+b.width/2)/S,surface.height((b.x+b.width/2)/S,(b.y+b.height/2)/S)+.42,(b.y+b.height/2)/S);log.castShadow=true;scene.add(log);}}
    for(const tree of layout.dressing){place(models.tree,tree.x/S,tree.y/S,tree.size,tree.rotation);if(tree.bush)place(models.bush,tree.x/S+1.7,tree.y/S+1.2,1.7);}
    for(let i=0;i<35;i++){const x=((i*419)%Math.floor(layout.width))/S,z=((i*257)%Math.floor(layout.height))/S;if(surface.pathDistance(x*S,z*S)<90||Math.abs(x*S-layout.riverX-75)<150)continue;place(models.flowers,x,z,1.3);}
    place(models.tent,layout.camp.x/S-3,layout.camp.y/S+9,3.2,-.5);
    lever=new THREE.Group();const base=new THREE.Mesh(register(new THREE.CylinderGeometry(.45,.65,.35,12)),register(new THREE.MeshStandardMaterial({color:P['landscape-26'],roughness:.95})));base.position.y=.18;lever.add(base);const arm=new THREE.Mesh(register(new THREE.CylinderGeometry(.09,.1,1.2,8)),register(new THREE.MeshStandardMaterial({color:P['landscape-27'],roughness:.6})));arm.position.y=.85;arm.rotation.z=-.5;lever.add(arm);const knob=new THREE.Mesh(register(new THREE.SphereGeometry(.2,12,8)),register(new THREE.MeshStandardMaterial({color:P['landscape-28'],roughness:.5})));knob.position.set(.28,1.35,0);lever.add(knob);lever.position.set(layout.switch.x/S,surface.height(layout.switch.x/S,layout.switch.y/S),layout.switch.y/S);scene.add(lever);
    place(models.tent,layout.secret.x/S,layout.secret.y/S,3.5,.8);
    const portal=place(models.gate,layout.portal.x/S,layout.portal.y/S,4);portal.userData.portal=true;
    const doorTexture=canvasTexture(384,480,c=>{drawPuzzleSprite(c,'door',192,470,345);});
    for(const n of nodes){const door=sprite(doorTexture,(n.x+105)/S,surface.height((n.x+105)/S,n.y/S),n.y/S,4.3,3.44);doors.push({actor:door,id:n.id});const id=n.mission.residentId===heroId?n.mission.residentAlternateId:n.mission.residentId,cast=CAST[id];const image=getImage(cast?.sprite);if(!image)continue;const animated=Boolean(HERO_ANIMATIONS[id]),actorCanvas=animated?document.createElement('canvas'):null;if(actorCanvas){actorCanvas.width=RESIDENT_BILLBOARD.size;actorCanvas.height=RESIDENT_BILLBOARD.size;}const texture=register(animated?new THREE.CanvasTexture(actorCanvas):new THREE.Texture(image));texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;const ratio=animated?1:image.naturalWidth/image.naturalHeight,actorHeight=animated?RESIDENT_BILLBOARD.worldSize:2.65;const actor=sprite(texture,n.x/S,surface.height(n.x/S,n.y/S),n.y/S,actorHeight,actorHeight*ratio);actors.push({actor,id:n.id,heroId:id,texture,canvas:actorCanvas,animator:animated?createCampaignHeroAnimator(id):null,poseKey:''});const label=sprite(labelTexture(n.mission.title),n.x/S,surface.height(n.x/S,n.y/S)+3.4,n.y/S,.55,3.1);labels.push({label,id:n.id});}
    // Instanced, wind-bent grass keeps the broad landscape alive at mobile scale.
    const grassGeometry=register(new THREE.BufferGeometry());grassGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,.015,.22,0,-.025,.22,0,0,.43,.03],3));grassGeometry.setIndex([0,1,2,0,2,3,3,2,4]);grassGeometry.computeVertexNormals();
    const grassMaterial=register(new THREE.MeshStandardMaterial({color:theme.grass,side:THREE.DoubleSide,roughness:1}));
    grassMaterial.onBeforeCompile=shader=>{shader.uniforms.windTime=grassUniform;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(windTime+instanceMatrix[3].x*.7+instanceMatrix[3].z*.4)*position.y*position.y*.18;');};
    const count=simplifiedBackgrounds?1800:6500,instanced=new THREE.InstancedMesh(grassGeometry,grassMaterial,count),dummy=new THREE.Object3D();let placed=0;
    for(let i=0;i<count*2&&placed<count;i++){const rand=n=>{const r=Math.sin(n*127.1+311.7)*43758.5453;return r-Math.floor(r);};const x=rand(i)*layout.width/S,z=rand(i+719)*layout.height/S;if(surface.pathDistance(x*S,z*S)<85||Math.abs(x*S-layout.riverX-layout.riverWidth/2)<130)continue;dummy.position.set(x,surface.height(x,z),z);dummy.rotation.y=i*2.4;dummy.scale.setScalar(.6+(i%9)*.1);dummy.updateMatrix();instanced.setMatrixAt(placed++,dummy.matrix);}instanced.count=placed;instanced.receiveShadow=true;scene.add(instanced);
    const cloudMaterial=register(new THREE.MeshLambertMaterial({color:P['landscape-29'],transparent:true,opacity:.83,depthWrite:false})),cloudGeometry=register(new THREE.SphereGeometry(1,16,12));for(let i=0;i<9;i++){const group=new THREE.Group();for(let j=0;j<5;j++){const puff=new THREE.Mesh(cloudGeometry,cloudMaterial);puff.scale.set(4+j%3*2,1.5+j%2,2.5+j%3);puff.position.set(j*3,Math.sin(j)*1.2,0);group.add(puff);}group.position.set(-60+i*24,38+i%3*6,-25+i%2*90);scene.add(group);}
    restorationKey='';refreshRestoration();
  });
  const contextLost=event=>{event.preventDefault();onFailure?.();};canvas.addEventListener('webglcontextlost',contextLost);
  return {ready,surface,
    render({width,height,player,yaw,distance,time,gait,nearby,message}){
      if(disposed)return;
      if(width!==lastWidth||height!==lastHeight){lastWidth=width;lastHeight=height;renderer.setSize(width,height,false);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();}
      const x=player.x/S,z=player.y/S,ground=surface.groundHeight(x,z,player.shortcut),hop=player.jumpTime?Math.sin(player.jumpTime/.55*Math.PI)*1.5:0;
      const dt=lastFrame<0?0:Math.min(.1,Math.max(0,time-lastRenderTime)),speed=Math.hypot(player.vx,player.vy);
      const lead=reducedMotion?0:Math.min(1,speed/330)*.055,orbitDistance=distance*(1+(reducedMotion?0:Math.min(1,speed/470)*.08));
      target.set(x+player.vx*lead/S,ground+1.8,z+player.vy*lead/S);desired.set(x+Math.sin(yaw)*orbitDistance,ground+orbitDistance*.3+1.4,z+Math.cos(yaw)*orbitDistance);
      // Keep the orbit outside solid scenery while retaining a stable view of the hero.
      cameraDirection.copy(desired).sub(target);const reach=cameraDirection.length();raycaster.set(target,cameraDirection.normalize());raycaster.far=reach;const obstruction=raycaster.intersectObjects(occluders,true).find(hit=>hit.distance>2);if(obstruction)desired.copy(target).addScaledVector(cameraDirection,cameraReachBeforeObstacle(reach,obstruction.distance));
      desired.y=Math.max(desired.y,surface.height(desired.x,desired.z)+2.3);camera.position.lerp(desired,lastFrame<0||reducedMotion?1:1-Math.exp(-10*Math.min(.1,time-lastRenderTime)));lastRenderTime=time;camera.lookAt(target);
      hero.position.set(x,ground+HERO_BILLBOARD.worldSize/2+hop,z);shadow.position.set(x,ground+.05,z);
      const heroState=hop?(player.jumpTime>.275?'jump':'fall'):player.actionTime?player.actionState:speed>390?'run':speed>12?'walk':'idle';
      const animation=heroAnimator.update(dt,{state:heroState,speed,reducedMotion}),facing=speed>12?Math.sign(player.vx*Math.cos(yaw)-player.vy*Math.sin(yaw))||player.facing:player.facing;
      const poseKey=`${animation.sheet}:${animation.frame}:${facing}`;
      if(poseKey!==lastHeroPose){const c=heroCanvas.getContext('2d');c.clearRect(0,0,HERO_BILLBOARD.size,HERO_BILLBOARD.size);const drawn=drawCampaignHero(c,heroId,{x:HERO_BILLBOARD.x,y:HERO_BILLBOARD.footY,height:HERO_BILLBOARD.drawHeight,facing,time:gait,state:heroState,animation,reducedMotion,shadow:false});if(drawn){heroTexture.needsUpdate=true;lastHeroPose=poseKey;}}lastFrame=Math.floor(time*30);

      if(!reducedMotion){
        footDistance+=speed*dt;if(speed>30&&!hop&&footDistance>115){footDistance=0;const entry=footprints[footCursor++%footprints.length],side=footCursor%2?1:-1,angle=Math.atan2(player.vx,player.vy);entry.mark.position.set(x+Math.cos(angle)*side*.3,ground+.055,z-Math.sin(angle)*side*.3);entry.mark.rotation.z=-angle;entry.mark.visible=true;entry.born=time;}
        if(previousJump&&!hop){landedAt=time;landingRing.position.set(x,ground+.07,z);}previousJump=Boolean(hop);
        for(const entry of footprints){entry.mark.material.opacity=Math.max(0,1-(time-entry.born)/4)*.48;if(time-entry.born>4)entry.mark.visible=false;}
        const landingAge=time-landedAt;landingRing.visible=landingAge<.38;landingRing.scale.setScalar(1+landingAge*3);landingRing.material.opacity=Math.max(0,1-landingAge/.38)*.3;
      }
      bridgeLift+=(Number(player.shortcut)-bridgeLift)*(reducedMotion?1:1-Math.exp(-12*dt));if(bridge)bridge.rotation.z=(1-bridgeLift)*Math.PI*.48;if(lever)lever.rotation.z=bridgeLift*-.8;
      if(water&&!reducedMotion)water.material.map.offset.y=time*.004;grassUniform.value=reducedMotion?0:time;
      sun.target.position.copy(target);sun.position.set(x-25,60,z+30);sun.target.updateMatrixWorld();
      const visible=visibleAdventureNodes(nodes,completed(),isAvailable),visibleIds=new Set(visible.map(n=>n.id)),residentIds=new Set(adventureResidents(visible,heroId).map(n=>n.id));
      for(const {label,id} of labels){const n=nodes.find(n=>n.id===id),d=Math.hypot(n.x-player.x,n.y-player.y);cameraPoint.copy(label.position).applyMatrix4(camera.matrixWorldInverse);label.visible=cameraPoint.z<-5&&d<650&&visibleIds.has(id);const pixelScale=-cameraPoint.z*2*Math.tan(camera.fov*Math.PI/360)/Math.max(height,1);label.scale.set(125*pixelScale,24*pixelScale,1);}
      for(const {actor,id} of doors){cameraPoint.copy(actor.position).applyMatrix4(camera.matrixWorldInverse);actor.visible=cameraPoint.z<-3&&visibleIds.has(id);}
      for(const entry of actors){const {actor,id,animator}=entry;cameraPoint.copy(actor.position).applyMatrix4(camera.matrixWorldInverse);actor.visible=cameraPoint.z<-3&&residentIds.has(id);if(actor.visible&&animator){const animation=animator.update(dt,{state:nearby?.id===id?'talk':'idle',speed:0,reducedMotion}),key=`${animation.sheet}:${animation.frame}`;if(key!==entry.poseKey){const c=entry.canvas.getContext('2d');c.clearRect(0,0,RESIDENT_BILLBOARD.size,RESIDENT_BILLBOARD.size);const drawn=drawCampaignHero(c,entry.heroId,{x:RESIDENT_BILLBOARD.x,y:RESIDENT_BILLBOARD.footY,height:RESIDENT_BILLBOARD.drawHeight,state:'idle',animation,reducedMotion,shadow:false});if(drawn){entry.texture.needsUpdate=true;entry.poseKey=key;}}}}
      restoration.visible=true;refreshRestoration();renderer.render(scene,camera);
      return {nearby,message,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
    },
    project(x,y){const v=new THREE.Vector3(x/S,surface.height(x/S,y/S)+1,y/S).project(camera);return {x:(v.x+1)*lastWidth/2,y:(1-v.y)*lastHeight/2,visible:v.z<1&&v.z>-1};},
    groundPoint(x,y){if(!terrain)return null;pointer.set(x/lastWidth*2-1,1-y/lastHeight*2);raycaster.far=Infinity;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(terrain)[0];return hit?{x:hit.point.x*S,y:hit.point.z*S}:null;},
    dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',contextLost);for(const root of [...roots,scene])disposeTree(root);for(const r of resources)if(!released.has(r)){released.add(r);r.dispose();}sun.shadow.dispose();renderer.resetState();renderer.dispose();}
  };
}
