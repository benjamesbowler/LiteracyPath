import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CAST } from '../content/cast.js';
import { drawCampaignHero } from './campaignHeroes.js';
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
const themes={meadow:{sky:0x91c6da,fog:0xa4c9be,grass:0x9abd72,sun:0xffedbb},dino:{sky:0xa8cfcc,fog:0xc3c6a0,grass:0xafb86e,sun:0xffe3ac},moonwood:{sky:0x526b94,fog:0x708598,grass:0x739b8e,sun:0xbbd7ec}};
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
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,simplifiedBackgrounds?1:1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=!simplifiedBackgrounds;renderer.shadowMap.type=THREE.PCFShadowMap;
  const camera=new THREE.PerspectiveCamera(52,1,.15,400),target=new THREE.Vector3(),desired=new THREE.Vector3(),cameraPoint=new THREE.Vector3();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),resources=new Set(),roots=[];
  let disposed=false,terrain=null,water=null,bridge=null,lever=null,lastFrame=-1,lastWidth=0,lastHeight=0,restorationKey='',grassUniform={value:0};
  const released=new Set();
  function disposeTree(root){root.traverse(o=>{for(const resource of [o.geometry,...(o.material?(Array.isArray(o.material)?o.material:[o.material]):[])]){if(!resource||released.has(resource))continue;released.add(resource);for(const v of Object.values(resource))if(v?.isTexture&&!released.has(v)){released.add(v);v.dispose();}resource.dispose();}});}
  const register=resource=>{if(disposed){resource.dispose();released.add(resource);}else resources.add(resource);return resource;};
  const hemisphere=new THREE.HemisphereLight(0xc6e9ff,0x6d733d,1.8);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight(theme.sun,2.3);sun.position.set(-25,65,30);sun.castShadow=!simplifiedBackgrounds;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:150});sun.shadow.bias=-.0005;sun.shadow.normalBias=.08;scene.add(sun);scene.add(sun.target);
  const skyGeo=register(new THREE.SphereGeometry(280,32,16));
  const skyMat=register(new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(theme.sky)},bottom:{value:new THREE.Color(theme.fog)}},vertexShader:'varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vP; uniform vec3 top; uniform vec3 bottom; void main(){float h=clamp(normalize(vP).y*1.8,0.,1.);gl_FragColor=vec4(mix(bottom,top,h),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));scene.add(new THREE.Mesh(skyGeo,skyMat));
  function canvasTexture(width,height,paint){const c=document.createElement('canvas');c.width=width;c.height=height;paint(c.getContext('2d'),c);const texture=register(new THREE.CanvasTexture(c));texture.colorSpace=THREE.SRGBColorSpace;return texture;}
  function sprite(texture,x,y,z,height,width=height){const mat=register(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:true,toneMapped:false}));const s=new THREE.Sprite(mat);s.position.set(x,y+height/2,z);s.scale.set(width,height,1);scene.add(s);return s;}
  const heroCanvas=document.createElement('canvas');heroCanvas.width=384;heroCanvas.height=384;
  const heroTexture=register(new THREE.CanvasTexture(heroCanvas));heroTexture.colorSpace=THREE.SRGBColorSpace;
  const hero=sprite(heroTexture,0,0,0,3.2),actors=[],labels=[];
  const shadowTexture=canvasTexture(128,128,c=>{const g=c.createRadialGradient(64,64,3,64,64,62);g.addColorStop(0,'rgba(20,35,20,.38)');g.addColorStop(1,'rgba(20,35,20,0)');c.fillStyle=g;c.fillRect(0,0,128,128);});
  const shadow=new THREE.Mesh(register(new THREE.PlaneGeometry(2.8,2.8)),register(new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false})));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  function labelTexture(text){return canvasTexture(512,96,c=>{c.fillStyle='rgba(24,43,41,.8)';c.beginPath();c.roundRect(5,5,502,86,30);c.fill();c.font='700 36px Nunito, sans-serif';c.textAlign='center';c.fillStyle='#fff4d2';c.fillText(text,256,62);});}
  const restorationCanvas=document.createElement('canvas');restorationCanvas.width=800;restorationCanvas.height=500;
  const restorationTexture=register(new THREE.CanvasTexture(restorationCanvas));restorationTexture.colorSpace=THREE.SRGBColorSpace;
  const restoration=sprite(restorationTexture,layout.landmark.x/S,surface.height(layout.landmark.x/S,layout.landmark.y/S),layout.landmark.y/S,5,8);
  let naturalProps=null;
  function refreshRestoration(){const key=stage.missionIds.map(id=>Boolean(completed()[id])).join();if(key===restorationKey)return;restorationKey=key;const c=restorationCanvas.getContext('2d');c.clearRect(0,0,800,500);const state=getCampaignRestorationState(stage.id,completed());
    // The task inventory retains its exact authored composition; natural scenery
    // is modeled in the landscape instead of drawing a flat tree billboard.
    for(const prop of state.props){if(naturalProps?.has(prop.kind))continue;const {kind,x,y,...appearance}=prop;drawCampaignProp(c,kind,400+x,430+y,appearance);}
    restorationTexture.needsUpdate=true;}
  function normalize(model,width){const root=model.scene.clone(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());const scale=width/Math.max(size.x,size.z,.01);root.scale.setScalar(scale);root.position.set(-((box.min.x+box.max.x)/2)*scale,-box.min.y*scale,-((box.min.z+box.max.z)/2)*scale);const group=new THREE.Group();group.add(root);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){mat.side=THREE.DoubleSide;if(/leave|leaf/i.test(mat.name)){mat.color.set(stage.worldId==='moonwood'?0x699797:stage.worldId==='dino'?0x92bc62:0x95b995);mat.roughness=1;}if(mat.transparent){mat.alphaTest=.4;mat.depthWrite=true;mat.transparent=false;}}}}});return group;}
  function place(model,x,z,width,rotation=0){const group=normalize(model,width);group.position.set(x,surface.height(x,z),z);group.rotation.y=rotation;scene.add(group);return group;}
  const loader=new GLTFLoader();
  const modelLoads=Object.entries(EXPLORATION_MODELS).map(async([key,path])=>{const model=await loader.loadAsync(path);if(disposed)disposeTree(model.scene);else roots.push(model.scene);return [key,model];});
  const ready=Promise.all(modelLoads).then(async entries=>{
    const models=Object.fromEntries(entries);if(disposed)return;
    await preload(nodes.map(n=>CAST[n.mission.residentId===heroId?n.mission.residentAlternateId:n.mission.residentId]?.sprite));if(disposed)return;
    const source=await new THREE.TextureLoader().loadAsync(WORLD_MATERIALS);register(source);if(disposed)return;
    const row={meadow:0,dino:1,moonwood:2}[stage.worldId]||0;
    const materialTexture=col=>{const t=canvasTexture(512,512,c=>{const sw=source.image.width/4,sh=source.image.height/3;c.drawImage(source.image,col*sw+2,row*sh+2,sw-4,sh-4,0,0,512,512);});t.wrapS=t.wrapT=THREE.MirroredRepeatWrapping;t.repeat.set(75,65);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;};
    const grass=materialTexture(0),path=materialTexture(1),waterMap=materialTexture(2);
    const sizeX=layout.width/S+180,sizeZ=layout.height/S+180;
    const geometry=register(new THREE.PlaneGeometry(sizeX,sizeZ,180,160));geometry.rotateX(-Math.PI/2);geometry.translate(layout.width/S/2,0,layout.height/S/2);
    const positions=geometry.attributes.position,weights=new Float32Array(positions.count),colors=new Float32Array(positions.count*3);
    for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,surface.height(x,z));weights[i]=1-THREE.MathUtils.smoothstep(surface.pathDistance(x*S,z*S),45,92);const color=new THREE.Color(0xf3f2da).lerp(new THREE.Color(0x839695),clamp((surface.height(x,z)-8)/35,0,.8));colors.set([color.r,color.g,color.b],i*3);}
    geometry.setAttribute('pathWeight',new THREE.BufferAttribute(weights,1));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
    const groundMaterial=register(new THREE.MeshStandardMaterial({map:grass,vertexColors:true,roughness:1}));
    groundMaterial.onBeforeCompile=shader=>{shader.uniforms.pathTexture={value:path};shader.uniforms.groundTint={value:new THREE.Color(theme.grass)};shader.vertexShader='attribute float pathWeight; varying float vPathWeight;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPathWeight=pathWeight;');shader.fragmentShader='uniform sampler2D pathTexture; uniform vec3 groundTint; varying float vPathWeight;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\nvec4 sampledDiffuseColor = mix(mix(vec4(groundTint,1.),texture2D(map,vMapUv),.48),texture2D(pathTexture,vMapUv),vPathWeight); diffuseColor *= sampledDiffuseColor;\n#endif');};
    terrain=new THREE.Mesh(geometry,groundMaterial);terrain.receiveShadow=true;scene.add(terrain);
    const waterMat=register(new THREE.MeshStandardMaterial({map:waterMap,color:stage.worldId==='moonwood'?0x6b91bc:0xb1deda,transparent:true,opacity:.84,roughness:.19,metalness:.2}));waterMap.repeat.set(2,20);
    water=new THREE.Mesh(register(new THREE.PlaneGeometry(layout.riverWidth/S,layout.height/S+15,1,30)),waterMat);water.rotation.x=-Math.PI/2;water.position.set((layout.riverX+layout.riverWidth/2)/S,-.1,layout.height/S/2);scene.add(water);
    const stoneMap=canvasTexture(512,512,c=>{const sw=source.image.width/4,sh=source.image.height/3;c.drawImage(source.image,sw*3+2,sh*2+2,sw-4,sh-4,0,0,512,512);});stoneMap.wrapS=stoneMap.wrapT=THREE.RepeatWrapping;
    const stoneMaterial=register(new THREE.MeshStandardMaterial({map:stoneMap,roughness:1,color:0xb9c0aa}));
    let bark;models.tree.scene.traverse(o=>{if(o.material?.name?.includes('Bark'))bark=o.material.map;});
    const barkMaterial=register(new THREE.MeshStandardMaterial({map:bark,color:0x9a805d,roughness:1}));
    const deckMaterial=register(new THREE.MeshStandardMaterial({map:bark,color:0xc2ae83,roughness:.94}));
    const ropeMaterial=register(new THREE.MeshStandardMaterial({color:0xa18b5b,roughness:1}));
    for(const b of layout.bridges){
      const group=new THREE.Group(),w=b.width/S,d=b.height/S;
      // Deck tops and collision feet share y=.25; broad rails sit outside the
      // usable crossing width. No visual arch floating above the actual route.
      for(let i=0;i<16;i++){const plank=new THREE.Mesh(register(new THREE.BoxGeometry(w/16-.012,.22,d)),deckMaterial);plank.position.set(-w/2+(i+.5)*w/16,.14,0);plank.receiveShadow=true;group.add(plank);}
      for(const side of [-1,1]){
        for(const x of [-w/2,w/2]){const post=new THREE.Mesh(register(new THREE.CylinderGeometry(.08,.11,1.3,12)),barkMaterial);post.position.set(x,.65,side*d/2);post.castShadow=true;group.add(post);}
        const points=[new THREE.Vector3(-w/2,1.2,side*d/2),new THREE.Vector3(0,.85,side*d/2),new THREE.Vector3(w/2,1.2,side*d/2)];const rail=new THREE.Mesh(register(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.035,6,false)),ropeMaterial);group.add(rail);
      }
      group.position.set((b.x+b.width/2)/S,0,(b.y+b.height/2)/S);scene.add(group);if(b.shortcut){bridge=group;group.visible=false;}
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
    lever=new THREE.Group();const base=new THREE.Mesh(register(new THREE.CylinderGeometry(.45,.65,.35,12)),register(new THREE.MeshStandardMaterial({color:0x77877a,roughness:.95})));base.position.y=.18;lever.add(base);const arm=new THREE.Mesh(register(new THREE.CylinderGeometry(.09,.1,1.2,8)),register(new THREE.MeshStandardMaterial({color:0xb89a5f,roughness:.6})));arm.position.y=.85;arm.rotation.z=-.5;lever.add(arm);const knob=new THREE.Mesh(register(new THREE.SphereGeometry(.2,12,8)),register(new THREE.MeshStandardMaterial({color:0xc15f35,roughness:.5})));knob.position.set(.28,1.35,0);lever.add(knob);lever.position.set(layout.switch.x/S,surface.height(layout.switch.x/S,layout.switch.y/S),layout.switch.y/S);scene.add(lever);
    place(models.tent,layout.secret.x/S,layout.secret.y/S,3.5,.8);
    const portal=place(models.gate,layout.portal.x/S,layout.portal.y/S,4);portal.userData.portal=true;
    for(const n of nodes){const id=n.mission.residentId===heroId?n.mission.residentAlternateId:n.mission.residentId,cast=CAST[id];const image=getImage(cast?.sprite);if(!image)continue;const texture=register(new THREE.Texture(image));texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;const ratio=image.naturalWidth/image.naturalHeight;const actor=sprite(texture,n.x/S,surface.height(n.x/S,n.y/S),n.y/S,2.65,2.65*ratio);actors.push({actor,id:n.id});const label=sprite(labelTexture(cast.name),n.x/S,surface.height(n.x/S,n.y/S)+3.4,n.y/S,.55,3.1);labels.push({label,id:n.id});}
    // Instanced, wind-bent grass keeps the broad landscape alive at mobile scale.
    const grassGeometry=register(new THREE.BufferGeometry());grassGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,.015,.22,0,-.025,.22,0,0,.43,.03],3));grassGeometry.setIndex([0,1,2,0,2,3,3,2,4]);grassGeometry.computeVertexNormals();
    const grassMaterial=register(new THREE.MeshStandardMaterial({color:theme.grass,side:THREE.DoubleSide,roughness:1}));
    grassMaterial.onBeforeCompile=shader=>{shader.uniforms.windTime=grassUniform;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(windTime+instanceMatrix[3].x*.7+instanceMatrix[3].z*.4)*position.y*position.y*.18;');};
    const count=simplifiedBackgrounds?1800:6500,instanced=new THREE.InstancedMesh(grassGeometry,grassMaterial,count),dummy=new THREE.Object3D();let placed=0;
    for(let i=0;i<count*2&&placed<count;i++){const rand=n=>{const r=Math.sin(n*127.1+311.7)*43758.5453;return r-Math.floor(r);};const x=rand(i)*layout.width/S,z=rand(i+719)*layout.height/S;if(surface.pathDistance(x*S,z*S)<85||Math.abs(x*S-layout.riverX-layout.riverWidth/2)<130)continue;dummy.position.set(x,surface.height(x,z),z);dummy.rotation.y=i*2.4;dummy.scale.setScalar(.6+(i%9)*.1);dummy.updateMatrix();instanced.setMatrixAt(placed++,dummy.matrix);}instanced.count=placed;instanced.receiveShadow=true;scene.add(instanced);
    const cloudMaterial=register(new THREE.MeshLambertMaterial({color:0xfff6df,transparent:true,opacity:.83,depthWrite:false})),cloudGeometry=register(new THREE.SphereGeometry(1,16,12));for(let i=0;i<9;i++){const group=new THREE.Group();for(let j=0;j<5;j++){const puff=new THREE.Mesh(cloudGeometry,cloudMaterial);puff.scale.set(4+j%3*2,1.5+j%2,2.5+j%3);puff.position.set(j*3,Math.sin(j)*1.2,0);group.add(puff);}group.position.set(-60+i*24,38+i%3*6,-25+i%2*90);scene.add(group);}
    restorationKey='';refreshRestoration();
  });
  const contextLost=event=>{event.preventDefault();onFailure?.();};canvas.addEventListener('webglcontextlost',contextLost);
  return {ready,surface,
    render({width,height,player,yaw,distance,time,gait,nearby,message}){
      if(disposed)return;
      if(width!==lastWidth||height!==lastHeight){lastWidth=width;lastHeight=height;renderer.setSize(width,height,false);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();}
      const x=player.x/S,z=player.y/S,ground=surface.groundHeight(x,z,player.shortcut),hop=player.jumpTime?Math.sin(player.jumpTime/.55*Math.PI)*1.5:0;
      target.set(x,ground+1.8,z);desired.set(x+Math.sin(yaw)*distance,ground+distance*.22+1.4,z+Math.cos(yaw)*distance);
      desired.y=Math.max(desired.y,surface.height(desired.x,desired.z)+2.3);camera.position.lerp(desired,lastFrame<0||reducedMotion?1:.16);camera.lookAt(target);
      hero.position.set(x,ground+1.6+hop,z);shadow.position.set(x,ground+.05,z);
      const frame=Math.floor(time*12);if(frame!==lastFrame){const c=heroCanvas.getContext('2d');c.clearRect(0,0,384,384);drawCampaignHero(c,heroId,{x:192,y:368,height:310,facing:(Math.abs(player.vx)+Math.abs(player.vy)>12?Math.sign(player.vx*Math.cos(yaw)-player.vy*Math.sin(yaw))||player.facing:player.facing),time:Math.hypot(player.vx,player.vy)>12?gait:time,state:hop?'jump':Math.hypot(player.vx,player.vy)>12?'walk':'idle',reducedMotion});heroTexture.needsUpdate=true;lastFrame=frame;}
      if(bridge)bridge.visible=player.shortcut;if(lever)lever.rotation.y=player.shortcut?Math.PI:0;
      if(water&&!reducedMotion)water.material.map.offset.y=time*.004;grassUniform.value=reducedMotion?0:time;
      sun.target.position.copy(target);sun.position.set(x-25,60,z+30);sun.target.updateMatrixWorld();
      for(const {label,id} of labels){const n=nodes.find(n=>n.id===id),d=Math.hypot(n.x-player.x,n.y-player.y);cameraPoint.copy(label.position).applyMatrix4(camera.matrixWorldInverse);label.visible=cameraPoint.z<-5&&d<650&&isAvailable(id)&&!completed()[id];const pixelScale=-cameraPoint.z*2*Math.tan(camera.fov*Math.PI/360)/Math.max(height,1);label.scale.set(125*pixelScale,24*pixelScale,1);}
      for(const {actor,id} of actors){cameraPoint.copy(actor.position).applyMatrix4(camera.matrixWorldInverse);actor.visible=cameraPoint.z<-3&&isAvailable(id)&&!completed()[id];}
      restoration.visible=true;refreshRestoration();renderer.render(scene,camera);
      return {nearby,message,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
    },
    project(x,y){const v=new THREE.Vector3(x/S,surface.height(x/S,y/S)+1,y/S).project(camera);return {x:(v.x+1)*lastWidth/2,y:(1-v.y)*lastHeight/2,visible:v.z<1&&v.z>-1};},
    groundPoint(x,y){if(!terrain)return null;pointer.set(x/lastWidth*2-1,1-y/lastHeight*2);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(terrain)[0];return hit?{x:hit.point.x*S,y:hit.point.z*S}:null;},
    dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',contextLost);for(const root of [...roots,scene])disposeTree(root);for(const r of resources)if(!released.has(r)){released.add(r);r.dispose();}sun.shadow.dispose();renderer.dispose();}
  };
}
