import * as THREE from 'three';
import { PROJECTS } from './content.js';

// Rounded, tactile furniture complements the editable Blender forest kit.
export function decorateChapter(scene) {
  const materials = Object.fromEntries(Object.entries({wood:'#a57a51',cream:'#f4ddb0',sage:'#789573',rose:'#c88471',gold:'#efb85b',soil:'#7e6248'}).map(([id,color])=>[id,new THREE.MeshStandardMaterial({color,roughness:.9})]));
  const groups=[];
  const globe=new THREE.SphereGeometry(1,20,14);
  function oval(parent,x,y,z,sx,sy,sz,color){const o=new THREE.Mesh(globe,materials[color]);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function basket(parent,x,z){
    const b=new THREE.Group();b.position.set(x,0,z);parent.add(b);
    const profile=[[0,0],[.4,.05],[.64,.2],[.75,.8],[.7,.85],[.58,.24],[0,.14]].map(p=>new THREE.Vector2(...p));
    b.add(new THREE.Mesh(new THREE.LatheGeometry(profile,32),materials.wood));
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.7,.7,0),new THREE.Vector3(-.45,1.5,0),new THREE.Vector3(.45,1.5,0),new THREE.Vector3(.7,.7,0)]);
    b.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.06,8,false),materials.cream));return b;
  }
  for(const project of PROJECTS)for(const [i,act] of project.acts.entries()){
    const group=new THREE.Group();group.position.set(act.x,0,act.z-1);scene.add(group);
    const finished=new THREE.Group();group.add(finished);groups.push({group:finished,project:project.id,act:i});
    if(act.kind==='sort'){
      basket(group,-1.4,0);basket(group,1.4,0);
      for(let j=0;j<8;j++){const x=j<4?-1.4:1.4;oval(finished,x+(j%2-.5)*.45,.52+Math.floor(j%4/2)*.28,.04,.28,.25,.3,j%2?'sage':'rose');}
    }else if(act.kind==='place'){
      oval(group,-2,.04,0,1.4,.045,.95,'sage');basket(group,0,0);
      oval(group,2,1.25,0,1.25,.17,.8,'wood');
      for(const dx of [-.75,.75])for(const dz of [-.4,.4])oval(group,2+dx,.65,dz,.1,.65,.1,'wood');
      oval(finished,-2,.2,0,.34,.17,.4,'cream');oval(finished,0,.65,0,.35,.28,.3,'rose');oval(finished,2,.26,0,.4,.26,.35,'gold');
    }else if(project.id==='parcels'){
      oval(group,0,.12,0,2,.16,1,'sage');
      for(let j=0;j<8;j++)oval(finished,(j%4-1.5)*.8,.33+Math.floor(j/4)*.38,0,.36,.31,.4,j%2?'cream':'rose');
    }else if(project.id==='tree'){
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-2,1.9,0),new THREE.Vector3(0,1.5,0),new THREE.Vector3(2,1.9,0)]);
      finished.add(new THREE.Mesh(new THREE.TubeGeometry(curve,20,.025,6,false),materials.wood));
      for(let j=0;j<5;j++)oval(finished,-1.6+j*.8,1.55-Math.sin(j/4*Math.PI)*.3,0,.18,.26,.09,j%2?'cream':'gold');
    }else{
      for(let j=0;j<5;j++)oval(finished,(j-2)*.5,.18,0,.23,.18,.25,j%2?'gold':'cream');
    }
  }
  const gathering=new THREE.Group();gathering.position.set(1,0,-28);scene.add(gathering);
  oval(gathering,0,.04,0,4,.045,2,'rose');
  for(let i=0;i<6;i++)oval(gathering,Math.cos(i*Math.PI/3)*2.4,.14,Math.sin(i*Math.PI/3)*1.2,.43,.055,.43,'cream');
  basket(gathering,0,0);
  return {update(repaired){for(const entry of groups)entry.group.visible=repaired[entry.project]>entry.act;gathering.visible=repaired.tree===3;}};
}
