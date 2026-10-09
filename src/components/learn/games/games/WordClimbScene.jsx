import { createArcadeRenderGate } from '../shared/arcadeFramePolicy.js';
import { createBlenderLandmarks } from '../shared/arcadeBlenderLandmarks.js';
import { GAME_RECOVERY_URLS, loadGameRecoveryBytes } from '../../../../utils/gameRecoveryAssets.js';
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createRenderer, disposeObject, disposeRenderer, detectQualityTier } from "../shared/threeShell.js";
import { climbSurfaceDepth, createClimbSceneKit, createClimbForeground } from "./wordClimbSceneKit.js";
import { CLIMB_VIEW_HEIGHT } from "./wordClimbWorld.js";
import { CLIMB_ROUTE_HALF_WIDTH, climbJourneyWind } from "./wordClimbJourney.js";
import { climbViewportMetrics, climbActorDepth, climbGripVineMode } from "./wordClimbView.js";
import { WORD_CLIMB_ATLASES, WORD_CLIMB_MOVEMENT_ATLASES } from "./wordClimbArt.generated.js";
import { physicalThemeForDifficulty } from "../shared/physicalArcadeThemes.js";
import { createWordClimbRegisteredActor } from "./wordClimbRegisteredActor.js";
import { createWordClimbVine } from "./wordClimbVine.js";
import { createWordClimbScenery } from "./wordClimbScenery.js";
import { createWordClimbCanvasWorld } from "./wordClimbCanvasWorld.js";
import { wordClimbRecoveryAtlases } from "./wordClimbRecoveryArt.js";
import { createWordClimbRenderBudget } from "./wordClimbRenderBudget.js";

function clipFor(world) {
  if (world.completed) return "summit";
  if (world.state === "climbing") return "climb";
  if (world.state === "gripping") return "grip";
  if (world.state === "clinging") return "grip";
  if (world.state === "recovering") return "recover";
  if (world.state === "airborne") return "jump";
  if (world.state === "landed") return "land";
  return "rest";
}

export default function WordClimbScene({ world, difficulty="easy", renderMetrics }) {
  const mount = useRef(null);
  const [status, setStatus] = useState("loading");
  const [rendererMode,setRendererMode] = useState("three");
  const qualityHistory=useRef([]);
  useEffect(() => {
    const host = mount.current;
    if(rendererMode==="canvas"){
      let disposed=false,ready=false;
      const owner=createWordClimbCanvasWorld(host,world,difficulty,{renderMetrics,onReady:()=>{if(!disposed&&!ready){ready=true;setStatus("canvas");}}});
      if(import.meta.env.DEV&&window.location.pathname==="/preview/game-overlay.html")host.__wordClimbVisual=()=>({...owner.inspect(),quality:{tier:'canvas',transitions:structuredClone(qualityHistory.current)}});
      return()=>{disposed=true;delete host.__wordClimbVisual;owner.dispose();};
    }
    const renderGate=createArcadeRenderGate();
    const theme=physicalThemeForDifficulty(difficulty);
    const renderBudget=createWordClimbRenderBudget(detectQualityTier());
    host.dataset.quality=renderBudget.tier;
    let renderer, kit, foreground, model, mixer, frame, observer, gripHand, registered, canonicalRecovery, activeRegistered, disposed = false, pendingReady = false, last = null, activeClip = null;
    let width = 1, height = 1, viewWidth = 1, cameraOffset=0, summitTime=0;
    let legacyDelivery='not-requested',legacyRepresentation=null;
    queueMicrotask(()=>{if(!disposed)setStatus("loading");});
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.Fog(theme.sky, 510, 1100);
    const camera = new THREE.OrthographicCamera(-250,250,CLIMB_VIEW_HEIGHT,0,1,1400);
    camera.position.set(0,0,450);
    const light = new THREE.DirectionalLight(0xffe4b5, 2.8);light.position.set(-160,250,300);scene.add(light,light.target);
    const fill = new THREE.DirectionalLight(0xc0e2ff, .95);fill.position.set(160,30,150);scene.add(fill,fill.target);
    scene.add(new THREE.HemisphereLight(0xe9f5ea,0x344e46,1.2));
    const rootSky=new THREE.Color(theme.sky),summitSky=new THREE.Color(theme.id==="moonwood"?0x52628c:theme.id==="dino"?0xf1dcc2:0xd1e7ed);
    const hero = new THREE.Group();hero.name=`${theme.hero}PhysicalClimber`;scene.add(hero);
    const contactShadow=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x172c28,transparent:true,opacity:.34,depthWrite:false}));contactShadow.name=`${theme.hero}-ledge-contact-shadow`;scene.add(contactShadow);
    const vineOwner=createWordClimbVine(THREE),vine=vineOwner.mesh;scene.add(vine);
    const handPoint=new THREE.Vector3(),vineAnchor=new THREE.Vector3();
    const windLeaves=Array.from({length:4},()=>{const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,4),new THREE.MeshStandardMaterial({color:0xbed488,roughness:1}));leaf.scale.set(4,1.3,.7);leaf.visible=world.journey?.stageIndex%3===1;scene.add(leaf);return leaf;});
    let landmarks;
    const scenery=createWordClimbScenery(THREE,theme.id,{onDelivery:value=>{
      if(disposed)return;host.dataset.authoredScenery=value;
      if(value==="delivered"){if(kit?.userData.legacyCanopies){kit.userData.authoredSceneryDelivered=true;kit.userData.legacyCanopies.visible=false;
        kit.userData.legacyDistantMaterials.forEach(material=>{material.visible=false;});}if(foreground)foreground.visible=false;}
      else installLegacyLandmarks();
    }});scene.add(scenery.root);
    host.dataset.authoredScenery=scenery.delivery();host.dataset.blenderWorld = "word-climb";
    const actions = new Map();
    const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      renderer = createRenderer(THREE, { pixelRatioCap: renderBudget.pixelRatio(window.devicePixelRatio), toneMappingExposure: .95 });
      renderer.domElement.setAttribute("aria-hidden","true");host.appendChild(renderer.domElement);
    } catch { disposed=true;scenery.dispose();vineOwner.dispose();disposeObject(scene);queueMicrotask(()=>setRendererMode("canvas")); return undefined; }
    // Easy intentionally moves from the valid legacy Pip cast to canonical
    // Bouncy. This is a new visual production choice, not a defect diagnosis.
    const heroId=theme.characterId;
    const atlas=WORD_CLIMB_ATLASES[heroId];
    if(atlas){registered=createWordClimbRegisteredActor(THREE,atlas,{movementAtlas:WORD_CLIMB_MOVEMENT_ATLASES[heroId],onDelivery:value=>{host.dataset.registeredClimber=value;}});registered.root.scale.setScalar(2.56/atlas.nominalHeight);hero.add(registered.root);host.dataset.registeredClimber=registered.delivery();}
    function resize() {
      renderGate.invalidate();
      width = Math.max(1,host.clientWidth);height = Math.max(1,host.clientHeight);
      const metrics=climbViewportMetrics(width,height);viewWidth=metrics.viewWidth;cameraOffset=metrics.cameraOffset;
      renderer.setSize(width,height,false);camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=metrics.viewHeight;camera.updateProjectionMatrix();
      if(kit){scene.remove(kit);disposeObject(kit);}
      kit=createClimbSceneKit(world.platforms,world.summit,viewWidth,metrics.shelfPixels*metrics.viewHeight/height,world.journey,metrics.viewHeight/height,theme.id);scene.add(kit);
      if(scenery.delivery()==="delivered"){kit.userData.authoredSceneryDelivered=true;kit.userData.legacyCanopies.visible=false;
        kit.userData.legacyDistantMaterials.forEach(material=>{material.visible=false;});}
      if(foreground){scene.remove(foreground);disposeObject(foreground);}
      foreground=createClimbForeground(viewWidth,metrics.viewHeight);scene.add(foreground);
      foreground.visible=scenery.delivery()!=="delivered";
      hero.scale.setScalar(metrics.heroPixels*metrics.viewHeight/height/2.56);
      const ascent = world.summitHeight || world.summit * 210;
      scenery.resize({viewWidth,viewHeight:metrics.viewHeight,ascent});
      if(scenery.delivery()==="unavailable")installLegacyLandmarks();
    }
    function installLegacyLandmarks(){
      if(disposed||!kit)return;landmarks?.dispose();
      const ascent=world.summitHeight||world.summit*210;
      landmarks = createBlenderLandmarks("word-climb", Array.from({ length: Math.min(16, Math.ceil(ascent / 450)) }, (_, i) => ({ x: (i % 2 ? -1 : 1) * viewWidth * .35, y: 30 + i * 450, z: -125, height: 135, yaw: i % 2 ? -.15 : .15 })));
      scene.add(landmarks.root);
      for (let i = 0; i < Math.min(16, Math.ceil(ascent / 450)); i++) {
        const x = (i % 2 ? -1 : 1) * viewWidth * .35, y = 30 + i * 450;
        const branch = new THREE.CatmullRomCurve3([new THREE.Vector3(0, y + 65, -125), new THREE.Vector3(x * .65, y + 10, -125), new THREE.Vector3(x, y + 3, -125)]);
        const support = new THREE.Mesh(new THREE.TubeGeometry(branch, 12, 5, 6, false), new THREE.MeshStandardMaterial({ color: 0x735332, roughness: .95 }));
        support.name = 'Lookout supporting branch'; kit.add(support);
      }
    }
    resize();observer=new ResizeObserver(resize);observer.observe(host);
    const loader=new GLTFLoader();
    const install=(gltf,representation)=>{
      if(disposed){disposeObject(gltf.scene);return;}
      model=gltf.scene;hero.add(model);model.rotation.y=Math.PI-.22;
      gripHand=model.getObjectByName("handL") || model.getObjectByName("hand.L");
      mixer=new THREE.AnimationMixer(model);
      for(const clip of gltf.animations){const name=clip.name.replace(/^climb_/,"");const action=mixer.clipAction(clip);actions.set(name,action);}
      legacyDelivery='delivered';legacyRepresentation=representation;
      pendingReady=true;
    };
    const loadLegacy=()=>{legacyDelivery='pending';loader.load("/game-assets/word-climb/pip-climber.glb",gltf=>install(gltf,'legacy-pip-glb'),undefined,async()=>{
      try {
        const bytes=await loadGameRecoveryBytes(GAME_RECOVERY_URLS.climber);
        if(disposed)return;
        loader.parse(bytes,"",gltf=>install(gltf,'legacy-compressed-pip'),()=>{if(!disposed){legacyDelivery='unavailable';setRendererMode("canvas");}});
      }catch{if(!disposed){legacyDelivery='unavailable';setRendererMode("canvas");}}
    });};
    function loadCanonicalRecovery(){
      if(disposed||canonicalRecovery)return;
      const retained=wordClimbRecoveryAtlases(heroId);
      canonicalRecovery=createWordClimbRegisteredActor(THREE,retained.climber,{movementAtlas:retained.movement,
        representation:'canonical-retained-pal-recovery',onDelivery:value=>{if(!disposed)host.dataset.recoveryClimber=value;}});
      canonicalRecovery.root.scale.setScalar(2.56/2.2);hero.add(canonicalRecovery.root);host.dataset.recoveryClimber='pending';
      canonicalRecovery.ready.then(delivered=>{if(disposed)return;if(delivered)pendingReady=true;
        else if(theme.id==='moonwood')loadLegacy();else setRendererMode('canvas');});
    }
    if(registered)registered.ready.then(delivered=>{if(disposed)return;if(delivered)pendingReady=true;else loadCanonicalRecovery();});
    else loadCanonicalRecovery();
    function tick(time){
      const frozen=world.paused||document.hidden;
      const revision=`${scenery.delivery()}:${registered?.delivery()}:${canonicalRecovery?.delivery()}:${legacyDelivery}:${pendingReady}:${landmarks?.root.userData.assetState}`;
      if(!renderGate.shouldRender(frozen,revision)){last=null;frame=requestAnimationFrame(tick);return;}
      const renderStart=performance.now();
      const dt=last===null?0:Math.min(.05,(time-last)/1000);last=document.hidden?null:time;
      if(!world.paused&&!document.hidden){
        summitTime=world.completed&&!reducedMotion?summitTime+dt:0;
        landmarks?.update(dt, { reducedMotion });
        const next=clipFor(world);
        if(mixer && activeClip!==next){
          const before=actions.get(activeClip),after=actions.get(next);
          if(after){after.reset().setEffectiveWeight(1).play();if(before)before.crossFadeTo(after,.1,false);}
          activeClip=next;
        }
        mixer?.update(reducedMotion&&["rest","summit"].includes(next)?0:dt);
      }
      const onTrunk = ["climbing","gripping"].includes(world.state);
      const ledgeFront=world.journey?CLIMB_ROUTE_HALF_WIDTH*viewWidth/1000-55:0;
      hero.position.set((world.x-500)/1000*viewWidth,world.y,climbActorDepth(climbSurfaceDepth(world.journey,world.y,world.x,viewWidth),ledgeFront,onTrunk));
      const lean=THREE.MathUtils.clamp(-world.vx/13000,-.12,.12);
      const original=registered?.update(world,{lean,celebrationTime:summitTime})||false;
      const retained=!original&&(canonicalRecovery?.update(world,{lean,celebrationTime:summitTime})||false);
      activeRegistered=original?registered:retained?canonicalRecovery:null;
      const authored=Boolean(activeRegistered);
      if(model){model.visible=!authored;model.rotation.y=onTrunk ? 0 : Math.PI-.22;}
      for(const id of world.journey?.collected || []){const orb=kit.getObjectByName(id);if(orb)orb.visible=false;}
      hero.rotation.z=authored?0:lean;
      const below=world.platforms.filter(p=>p.y<=world.y&&Math.abs(world.x-p.x)<=p.width/2).sort((a,b)=>b.y-a.y)[0];
      contactShadow.visible=!onTrunk&&Boolean(below)&&world.y-below.y<180;
      if(below){contactShadow.position.set(hero.position.x,below.y-1,ledgeFront+30);contactShadow.scale.set(hero.scale.x*.45,hero.scale.x*.045,1);contactShadow.material.opacity=.34*Math.max(0,1-(world.y-below.y)/180);}
      const hand=authored?activeRegistered.contactWorld("grip",handPoint):gripHand?.getWorldPosition(handPoint);
      const gripMode=climbGripVineMode(world.state);
      vine.visible=Boolean(hand)&&Boolean(gripMode);
      if(vine.visible){
        scene.updateMatrixWorld(true);
        const safe=world.platforms.find(p=>p.id===world.safeId);
        if(gripMode==="ascent")vineAnchor.set(hand.x,hand.y+110,hand.z-4);
        else vineAnchor.set(0,Math.max((safe?.y||0)+180,world.y+90),-25);
        vineOwner.update(vineAnchor,hand);
      }
      camera.position.y=world.camera+cameraOffset;
      foreground.position.y=world.camera+cameraOffset+Math.sin(world.y/700)*9;
      scenery.update(world.camera+cameraOffset);
      if(world.journey?.stageIndex%3===1){const wind=climbJourneyWind(world.journey,world.y,world.elapsed);
        windLeaves.forEach((leaf,i)=>{const drift=reducedMotion?0:world.elapsed*wind*.4;leaf.position.set(((i*.28*viewWidth+drift)%viewWidth+viewWidth)%viewWidth-viewWidth/2,world.camera+50+i*64,90);leaf.rotation.z=wind>0?-.4:.4;});
      }
      const altitude=Math.max(0,world.camera/(world.summitHeight || world.summit*210));
      scene.background.copy(rootSky).lerp(summitSky,altitude);scene.fog.color.copy(scene.background);
      light.position.y=world.camera+250;fill.position.y=world.camera+30;
      light.target.position.y=world.camera+100;fill.target.position.y=world.camera+100;
      host.dataset.blenderWorldState = landmarks?.root.userData.assetState || "loading";
      host.dataset.blenderWorldTime = String(landmarks?.root.userData.animationTime || 0);
      renderer.render(scene,camera);const submittedAt=performance.now();renderMetrics?.frame(time,submittedAt,submittedAt-renderStart,!world.paused&&!document.hidden);host.dataset.pose=activeRegistered?.action||activeClip||"loading";
      if(!registered)host.dataset.registeredClimber="legacy-glb";
      if(pendingReady){pendingReady=false;setStatus("ready");}
      host.dataset.drawCalls=String(renderer.info.render.calls);
      const nextTier=renderBudget.observe(time,!world.paused&&!document.hidden&&Boolean(activeRegistered||model));
      if(nextTier){
        host.dataset.quality=nextTier;
        qualityHistory.current.push({budget:renderBudget.inspect(),rendering:renderMetrics?.snapshot()||null});
        if(qualityHistory.current.length>6)qualityHistory.current.shift();
        renderMetrics?.reset();
        if(nextTier==='canvas'){setRendererMode('canvas');return;}
        renderer.setPixelRatio(renderBudget.pixelRatio(window.devicePixelRatio));renderer.setSize(width,height,false);
        if(nextTier==='low')windLeaves.forEach(leaf=>{leaf.visible=false;});
      }
      frame=requestAnimationFrame(tick);
    }
    const contextLost=event=>{event.preventDefault();setRendererMode("canvas");};
    renderer.domElement.addEventListener("webglcontextlost",contextLost);
    frame=requestAnimationFrame(tick);
    if(import.meta.env.DEV&&window.location.pathname==="/preview/game-overlay.html")host.__wordClimbVisual=()=>structuredClone({actor:(activeRegistered||registered)?.inspect()||null,originalDelivery:registered?.delivery()||'not-requested',recoveryDelivery:canonicalRecovery?.delivery()||'not-requested',legacyDelivery,representation:activeRegistered?activeRegistered.inspect().representation:model?.visible?legacyRepresentation:'loading',hand:(activeRegistered?.contactWorld("grip",handPoint)||gripHand?.getWorldPosition(handPoint))?.toArray()||null,
      heroOrigin:hero.position.toArray(),heroScale:hero.scale.toArray(),contacts:Object.fromEntries(["feet","bootLeft","bootRight","grip","lowerHand"].map(name=>[name,activeRegistered?.contactWorld(name,handPoint)?.toArray()||null])),vineVisible:vine.visible,vineVertices:vine.geometry.attributes.position?.count||0,scenery:scenery.inspect(),drawCalls:renderer.info.render.calls,renderer:"three",quality:{...renderBudget.inspect(),transitions:structuredClone(qualityHistory.current)},rendering:renderMetrics?.snapshot()||null});
    return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();renderer.domElement.removeEventListener("webglcontextlost",contextLost);mixer?.stopAllAction();delete host.__wordClimbVisual;registered?.dispose();canonicalRecovery?.dispose();scenery.dispose();vineOwner.dispose();landmarks?.dispose();disposeObject(scene);disposeRenderer(renderer,{forceContextLoss:true});};
  },[world,difficulty,rendererMode,renderMetrics]);
  return <div ref={mount} className="wc-scene" data-wc-scene={status} aria-hidden="true" />;
}
