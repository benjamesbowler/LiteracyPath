import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createRenderer, disposeObject, disposeRenderer } from "../shared/threeShell.js";
import { climbSurfaceDepth, createClimbSceneKit, createClimbForeground } from "./wordClimbSceneKit.js";
import { CLIMB_VIEW_HEIGHT } from "./wordClimbWorld.js";
import { CLIMB_ROUTE_HALF_WIDTH, climbJourneyWind } from "./wordClimbJourney.js";
import { climbViewportMetrics } from "./wordClimbView.js";

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

export default function WordClimbScene({ world }) {
  const mount = useRef(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    const host = mount.current;
    let renderer, kit, foreground, model, mixer, frame, observer, gripHand, disposed = false, pendingReady = false, last = null, activeClip = null;
    let width = 1, height = 1, viewWidth = 1, cameraOffset=0;
    queueMicrotask(()=>{if(!disposed)setStatus("loading");});
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x82aaa1);
    scene.fog = new THREE.Fog(0x82aaa1, 510, 1100);
    const camera = new THREE.OrthographicCamera(-250,250,CLIMB_VIEW_HEIGHT,0,1,1400);
    camera.position.set(0,0,450);
    const light = new THREE.DirectionalLight(0xffe4b5, 2.3);light.position.set(-160,250,300);scene.add(light,light.target);
    const fill = new THREE.DirectionalLight(0xc0e2ff, .8);fill.position.set(160,30,150);scene.add(fill,fill.target);
    scene.add(new THREE.HemisphereLight(0xe9f5ea,0x344e46,1.2));
    const rootSky=new THREE.Color(0x597f76),summitSky=new THREE.Color(0x8fabc1);
    const hero = new THREE.Group();hero.name="PipPhysicalClimber";scene.add(hero);
    const contactShadow=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x172c28,transparent:true,opacity:.34,depthWrite:false}));contactShadow.name="Pip-ledge-contact-shadow";scene.add(contactShadow);
    const vine=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:0xd2bb7f,roughness:.85}));vine.name="contact-following-safety-vine";vine.visible=false;scene.add(vine);
    const windLeaves=Array.from({length:4},()=>{const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,4),new THREE.MeshStandardMaterial({color:0xbed488,roughness:1}));leaf.scale.set(4,1.3,.7);leaf.visible=world.journey?.stageIndex%3===1;scene.add(leaf);return leaf;});
    const actions = new Map();
    const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      renderer = createRenderer(THREE, { pixelRatioCap: 1.5, toneMappingExposure: .95 });
      renderer.domElement.setAttribute("aria-hidden","true");host.appendChild(renderer.domElement);
    } catch { queueMicrotask(()=>setStatus("fallback")); return undefined; }
    function resize() {
      width = Math.max(1,host.clientWidth);height = Math.max(1,host.clientHeight);
      const metrics=climbViewportMetrics(width,height);viewWidth=metrics.viewWidth;cameraOffset=metrics.cameraOffset;
      renderer.setSize(width,height,false);camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=metrics.viewHeight;camera.updateProjectionMatrix();
      if(kit){scene.remove(kit);disposeObject(kit);}
      kit=createClimbSceneKit(world.platforms,world.summit,viewWidth,metrics.shelfPixels*metrics.viewHeight/height,world.journey,metrics.viewHeight/height);scene.add(kit);
      if(foreground){scene.remove(foreground);disposeObject(foreground);}
      foreground=createClimbForeground(viewWidth,metrics.viewHeight);scene.add(foreground);
      hero.scale.setScalar(metrics.heroPixels*metrics.viewHeight/height/2.56);
    }
    resize();observer=new ResizeObserver(resize);observer.observe(host);
    const loader=new GLTFLoader();
    const install=gltf=>{
      if(disposed){disposeObject(gltf.scene);return;}
      model=gltf.scene;hero.add(model);model.rotation.y=Math.PI-.22;
      gripHand=model.getObjectByName("handL") || model.getObjectByName("hand.L");
      mixer=new THREE.AnimationMixer(model);
      for(const clip of gltf.animations){const name=clip.name.replace(/^climb_/,"");const action=mixer.clipAction(clip);actions.set(name,action);}
      pendingReady=true;
    };
    loader.load("/game-assets/word-climb/pip-climber.glb",install,undefined,async()=>{
      try {
        const { CLIMBER_GLB_BASE64 }=await import("./wordClimbAssetFallback.js");
        const bytes=Uint8Array.from(atob(CLIMBER_GLB_BASE64),c=>c.charCodeAt(0));
        loader.parse(bytes.buffer,"",install,()=>{if(!disposed)setStatus("fallback");});
      }catch{if(!disposed)setStatus("fallback");}
    });
    function tick(time){
      const dt=last===null?0:Math.min(.05,(time-last)/1000);last=time;
      if(!world.paused){
        const next=clipFor(world);
        if(mixer && activeClip!==next){
          const before=actions.get(activeClip),after=actions.get(next);
          if(after){after.reset().setEffectiveWeight(1).play();if(before)before.crossFadeTo(after,.1,false);}
          activeClip=next;
        }
        mixer?.update(reducedMotion&&["rest","summit"].includes(next)?0:dt);
        const onTrunk = ["climbing","gripping"].includes(world.state);
        const ledgeFront=world.journey?CLIMB_ROUTE_HALF_WIDTH*viewWidth/1000-55:0;
        hero.position.set((world.x-500)/1000*viewWidth,world.y,onTrunk ? climbSurfaceDepth(world.journey,world.y,world.x,viewWidth)+6 : ledgeFront+20);
        if(model)model.rotation.y=onTrunk ? 0 : Math.PI-.22;
        for(const id of world.journey?.collected || []){const orb=kit.getObjectByName(id);if(orb)orb.visible=false;}
        hero.rotation.z=THREE.MathUtils.clamp(-world.vx/13000,-.12,.12);
        const below=world.platforms.filter(p=>p.y<=world.y&&Math.abs(world.x-p.x)<=p.width/2).sort((a,b)=>b.y-a.y)[0];
        contactShadow.visible=!onTrunk&&Boolean(below)&&world.y-below.y<180;
        if(below){contactShadow.position.set(hero.position.x,below.y-1,ledgeFront+30);contactShadow.scale.set(hero.scale.x*.45,hero.scale.x*.045,1);contactShadow.material.opacity=.34*Math.max(0,1-(world.y-below.y)/180);}
        vine.visible=Boolean(gripHand)&&["clinging","recovering"].includes(world.state);
        if(vine.visible){
          scene.updateMatrixWorld(true);
          const hand=gripHand.getWorldPosition(new THREE.Vector3());
          const safe=world.platforms.find(p=>p.id===world.safeId);
          const anchor=new THREE.Vector3(0,Math.max(safe.y+180,world.y+90),-25);
          const middle=anchor.clone().lerp(hand,.5);middle.x+=18;
          vine.geometry.dispose();vine.geometry=new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(anchor,middle,hand),18,1.2,6,false);
        }
        camera.position.y=world.camera+cameraOffset;
        foreground.position.y=world.camera+cameraOffset+Math.sin(world.y/700)*9;
        if(world.journey?.stageIndex%3===1){const wind=climbJourneyWind(world.journey,world.y,world.elapsed);
          windLeaves.forEach((leaf,i)=>{const drift=reducedMotion?0:world.elapsed*wind*.4;leaf.position.set(((i*.28*viewWidth+drift)%viewWidth+viewWidth)%viewWidth-viewWidth/2,world.camera+50+i*64,90);leaf.rotation.z=wind>0?-.4:.4;});
        }
        const altitude=Math.max(0,world.camera/(world.summitHeight || world.summit*210));
        scene.background.copy(rootSky).lerp(summitSky,altitude);scene.fog.color.copy(scene.background);
        light.position.y=world.camera+250;fill.position.y=world.camera+30;
        light.target.position.y=world.camera+100;fill.target.position.y=world.camera+100;
      }
      renderer.render(scene,camera);host.dataset.pose=activeClip||"loading";
      if(pendingReady){pendingReady=false;setStatus("ready");}
      host.dataset.drawCalls=String(renderer.info.render.calls);
      frame=requestAnimationFrame(tick);
    }
    const contextLost=event=>{event.preventDefault();setStatus("fallback");};
    renderer.domElement.addEventListener("webglcontextlost",contextLost);
    frame=requestAnimationFrame(tick);
    return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();renderer.domElement.removeEventListener("webglcontextlost",contextLost);mixer?.stopAllAction();disposeObject(scene);disposeRenderer(renderer,{forceContextLoss:true});};
  },[world]);
  return <div ref={mount} className="wc-scene" data-wc-scene={status} aria-hidden="true" />;
}
