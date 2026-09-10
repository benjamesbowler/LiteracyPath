import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { climbRouteCenter, climbRouteRadius, CLIMB_ROUTE_HALF_WIDTH } from "./wordClimbJourney.js";

// Original editable Moonwood kit. Geometry is deterministic and language-blind:
// shelf material, shape and illumination never depend on the correct answer.
const palette = {
  bark: [0x785238, 0x4d342b, 0xa0784d], moss: [0x6d9456, 0x9ab867, 0x456b45],
  stone: [0x80735c, 0xa79875, 0x574d42], leaf: [0x335d4c, 0x4e7954, 0x89a260],
};
function material(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .9, ...extra }); }
function mesh(geometry, mat, name) { const value = new THREE.Mesh(geometry, mat); value.name = name; value.castShadow = true; value.receiveShadow = true; return value; }
function tube(points, radii, mat, name, sides = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const steps = Math.max(12, points.length * 5); const frames = curve.computeFrenetFrames(steps, false);
  const vertices = [], indices = [];
  for (let j = 0; j <= steps; j++) {
    const t = j / steps, center = curve.getPoint(t), segment = Math.min(radii.length - 2, Math.floor(t * (radii.length - 1)));
    const r = THREE.MathUtils.lerp(radii[segment], radii[segment + 1], t * (radii.length - 1) - segment);
    for (let i = 0; i < sides; i++) {
      const angle = i * Math.PI * 2 / sides;
      const p = center.clone().addScaledVector(frames.normals[j], Math.cos(angle) * r).addScaledVector(frames.binormals[j], Math.sin(angle) * r);
      vertices.push(p.x, p.y, p.z);
      if (j < steps) { const a = j * sides + i, b = j * sides + (i + 1) % sides; indices.push(a, b, b + sides, a, b + sides, a + sides); }
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return mesh(geometry, mat, name);
}
function leaf(length, width, mat) {
  const vertices = [], indices = [];
  for (let j = 0; j <= 10; j++) {
    const t = j / 10, half = Math.sin(t * Math.PI) * width;
    vertices.push(-half, t * length, -Math.sin(t * Math.PI) * 5, 0, t * length, Math.sin(t * Math.PI) * 3, half, t * length, -Math.sin(t * Math.PI) * 5);
    if (j < 10) for (let k = 0; k < 2; k++) { const a = j * 3 + k; indices.push(a,a+1,a+4,a,a+4,a+3); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  return mesh(geometry,mat,"veined-lance-leaf");
}
function shelf(width, height, row, mats) {
  const group = new THREE.Group(); group.name = `moss-capped-branch-shelf-${row}`;
  const vertices = [], indices = [], sides = 14;
  // Each horizontal ring is a lipped stone profile; the upper contact stays y=0.
  for (const [y, factor] of [[0,.91],[-5,1],[-height*.7,.94],[-height,.66]]) {
    for (let i=0;i<sides;i++) { const a=i/sides*Math.PI*2; const wobble=1+.035*Math.sin(i*7+row); vertices.push(Math.cos(a)*width/2*factor*wobble,y,Math.sin(a)*24*factor+4); }
  }
  for(let j=0;j<3;j++) for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;indices.push(a,b,b+sides,a,b+sides,a+sides);}
  const topStart=indices.length;for(let i=1;i<sides-1;i++)indices.push(0,i+1,i);
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.addGroup(0,topStart,0);geo.addGroup(topStart,indices.length-topStart,1);geo.computeVertexNormals();
  group.add(mesh(geo,[mats.stone[row%3],mats.moss[row%3]],"solid-ledge-with-moss-contact"));
  // Moss cushions follow the rim, leaving the engraved front clear.
  group.add(tube([[-width*.44,-1,15],[-width*.22,1,24],[0,-1,27],[width*.25,1,22],[width*.44,-1,13]],[3,4,4,3,2],mats.moss[(row+1)%3],"moss-rim",8));
  for(let i=0;i<4;i++){const x=(i/3-.5)*width*.7;group.add(tube([[x,-height*.73,25],[x+5,-height*.8,24],[x+3,-height*.9,20]],[.8,.6,.2],mats.bark[1],"stone-grain",5));}
  return group;
}

function batchSurfaces(group) {
  group.updateMatrixWorld(true);
  const batches=new Map(),originals=[];
  group.traverse(object=>{if(object.isMesh&&!Array.isArray(object.material)&&!object.userData.dynamic){
    const list=batches.get(object.material)||[];list.push(object.geometry.clone().applyMatrix4(object.matrixWorld));batches.set(object.material,list);originals.push(object);
  }});
  for(const object of originals){object.removeFromParent();object.geometry.dispose();}
  for(const [mat,geometries] of batches){const merged=mergeGeometries(geometries,false);for(const geometry of geometries)geometry.dispose();if(merged)group.add(mesh(merged,mat,"batched-authored-world-surface"));}
}

export function climbSurfaceDepth(journey,y,x,viewWidth) {
 const center=journey?climbRouteCenter(journey,y,journey.branchStartX):500;
 const radius=journey?climbRouteRadius(journey,y)*viewWidth/1000:Math.min(72,viewWidth*.11);
 const dx=(x-center)*viewWidth/1000;
 let surface=-65+Math.sqrt(Math.max(0,radius*radius-dx*dx));
 if(journey){const mainDx=(x-climbRouteCenter(journey,y))*viewWidth/1000,mainRadius=CLIMB_ROUTE_HALF_WIDTH*viewWidth/1000;
   if(Math.abs(mainDx)<mainRadius)surface=Math.max(surface,-65+Math.sqrt(mainRadius*mainRadius-mainDx*mainDx));
 }
 return surface;
}

export function createClimbSceneKit(platforms,summit,viewWidth,shelfHeight,journey=null,unitsPerPixel=1) {
  const root=new THREE.Group();root.name="MoonwoodRootCanopySummit";
  const family=journey?journey.stageIndex%3:0;
  const detailScale=Math.max(1,unitsPerPixel);
  const colours={...palette,bark:family===1?[0x66684b,0x414c3c,0x929166]:family===2?[0x867255,0x564b3c,0xb09a6c]:palette.bark};
  const mats=Object.fromEntries(Object.entries(colours).map(([name,colors])=>[name,colors.map(c=>material(c,{side:THREE.DoubleSide}))]));
  const far=material(family===2?0x6d8395:0x527f75,{side:THREE.DoubleSide}),distant=material(0x3f655c,{side:THREE.DoubleSide});
  const glow=material(0xffd795,{emissive:0xe8ac4d,emissiveIntensity:.8});
  const top=journey?journey.sectionHeight*summit:summit*210;
  const radius=journey?CLIMB_ROUTE_HALF_WIDTH*viewWidth/1000:Math.min(72,viewWidth*.11);
  const xAt=y=>journey?(climbRouteCenter(journey,Math.max(0,Math.min(top-1,y)))-500)*viewWidth/1000:(Math.sin(y/280)*.30+Math.sin(y/530)*.14)*radius;
  // Static geometry is batched in short vertical chunks. Distant parts are
  // frustum-culled, so a three-minute course does not draw its entire tree.
  for(let bottom=-180;bottom<top+260;bottom+=600){
    const chunk=new THREE.Group();chunk.name=`woodland-chunk-${bottom}`;
    const high=Math.min(top+260,bottom+600),points=[];
    for(let y=bottom-75;y<high+75;y+=75)points.push([xAt(y),y,-65]);points.push([xAt(high+75),high+75,-65]);
    const radii=points.map(p=>radius*(1+.025*Math.sin(p[1]/80)));
    chunk.add(tube(points,radii,mats.bark[0],"continuous-climbable-bark",18));
    for(let ridge=0;ridge<8;ridge++){
      const angle=(ridge/7-.5)*Math.PI;
      const lines=points.map(([x,y,z],i)=>[x+Math.sin(angle)*radii[i],y,z+Math.cos(angle)*radii[i]]);
      chunk.add(tube(lines,lines.map(()=>Math.min(2.8,radius*.05)),mats.bark[ridge%3],"flowing-bark-ridge",6));
    }
    for(let y=bottom+90,index=0;y<high;y+=180,index++){
      const x=xAt(y)+(index%2?1:-1)*radius*.25;
      const ring=Array.from({length:17},(_,j)=>{const a=j/16*Math.PI*2;return[x+Math.cos(a)*7,y+Math.sin(a)*19,-65+radius+2];});
      chunk.add(tube(ring,ring.map(()=>1.5),mats.bark[1],"weathered-bark-knot",6));
      for(let j=0;j<3;j++){
        const frond=leaf(27+j*8,5+j,mats.leaf[(index+j)%3]);frond.position.set(xAt(y)+(index%2?1:-1)*radius*.94,y,-65+radius*.4);frond.rotation.z=(index%2?1:-1)*(1.1+j*.3);chunk.add(frond);
      }
    }
    for(let tree=0;tree<4;tree++){
      const sign=tree<2?-1:1,x=[-.46,-.29,.31,.48][tree]*viewWidth,z=-210-tree*40,mat=tree%2?far:distant;
      chunk.add(tube([bottom-60,(bottom+high)/2,high+60].map(y=>[x+Math.sin(y/550+tree)*13,y,z]),[17,19,17],mat,"distant-moonwood-trunk",8));
      const end=x-sign*viewWidth*.23,y=bottom+200+(tree%2)*180;
      chunk.add(tube([[x,y-100,z],[x-sign*viewWidth*.11,y-30,z+5],[end,y,z]],[10,6,.5],mat,"distant-reaching-branch",7));
      for(let f=0;f<5;f++){const canopy=leaf(55+viewWidth*.04,14+viewWidth*.012,mat);canopy.position.set(end,y,z);canopy.rotation.z=(f-2)*.55;chunk.add(canopy);}
    }
    // Fern terraces and broad boughs make each bend a readable woodland place.
    // They attach behind the collision corridor, never mask its branch hazards.
    for(let y=bottom+140,index=0;y<high;y+=240,index++){
      const side=(Math.floor(y/240)%2)?1:-1,anchor=xAt(y),end=anchor+side*(radius+viewWidth*.12),z=-85;
      chunk.add(tube([[anchor,y-35,z],[anchor+side*radius*.9,y-18,z+8],[end,y-25,z+15]],[Math.min(17,radius*.25),10,2],mats.bark[1],"fern-terrace-bough",10));
      for(let f=0;f<7;f++){const blade=leaf((40+(f%3)*15)*Math.max(.75,detailScale*.6),9+(f%2)*3,mats.leaf[f%3]);blade.position.set(end-side*(f%3)*9,y-20,z+18);blade.rotation.z=side*(.2+(f-3)*.27);chunk.add(blade);}
      for(let f=0;f<3;f++){const moss=mesh(new THREE.SphereGeometry(1,9,5),mats.moss[f%3],"terrace-moss-pad");moss.scale.set(10+f*3,3,7);moss.position.set(anchor+side*(radius*.6+f*12),y-17,z+20);chunk.add(moss);}
    }
    batchSurfaces(chunk);root.add(chunk);
  }
  for(const p of platforms){
    const station=new THREE.Group();station.name=`physical-hold-${p.id}`;
    const x=(p.x-500)/1000*viewWidth,small=p.kind==="rest",front=journey?CLIMB_ROUTE_HALF_WIDTH*viewWidth/1000-55:0,branchRadius=Math.min(small?7:18,viewWidth*.045);
    const points=Math.abs(x-xAt(p.y))<viewWidth*.04?[[xAt(p.y-35),p.y-40,-35],[x,p.y-25,front-10],[x,p.y-12,front]]:[[xAt(p.y-80),p.y-95,-50],[x*.55,p.y-60,front-10],[x,p.y-18,front]];
    station.add(tube(points,[branchRadius,branchRadius*.78,branchRadius*.5],mats.bark[p.row%3],"load-bearing-branch"));
    const ledge=shelf(p.width/1000*viewWidth,small?Math.max(14,unitsPerPixel*13):shelfHeight,p.row,mats);ledge.position.set(x,p.y,front);station.add(ledge);
    if(!small)for(let j=0;j<3;j++){const frond=leaf(25+j*6,5+j,mats.leaf[(p.row+j)%3]);frond.position.set(x+(p.x<500?-1:1)*p.width/1000*viewWidth*.42,p.y-9,front-10);frond.rotation.z=(p.x<500?1:-1)*(.6+j*.4);station.add(frond);}
    batchSurfaces(station);root.add(station);
  }
  if(journey){
    // Equal branch starts above every word station prevent route art revealing
    // the correct word. They converge on the next winding trunk section.
    for(let section=1;section<summit;section++){
      const y=section*journey.sectionHeight;
      const fork=new THREE.Group();fork.name=`equal-route-forks-${section}`;
      for(const lane of [190,500,810]){
        const pts=[[((lane-500)*viewWidth/1000),y-30,-65],...Array.from({length:7},(_,i)=>{const yy=y+i*40;return[(climbRouteCenter(journey,yy,lane)-500)*viewWidth/1000,yy,-65];})];
        const sizes=pts.map((p,i)=>i===0?viewWidth*.045:climbRouteRadius(journey,p[1])*viewWidth/1000);
        fork.add(tube(pts,sizes,mats.bark[0],"climbable-word-ledge-fork",16));
        for(let ridge=0;ridge<5;ridge++){
          const angle=(ridge/4-.5)*Math.PI*.85;
          const line=pts.map(([x,yy,z],i)=>[x+Math.sin(angle)*sizes[i],yy,z+Math.cos(angle)*sizes[i]]);
          fork.add(tube(line,line.map(()=>Math.min(2.3,viewWidth*.004)),mats.bark[ridge%3],"fork-bark-ridge",6));
        }
      }
      batchSurfaces(fork);root.add(fork);
    }
    for(const obstacle of journey.obstacles){
      const branch=new THREE.Group();branch.name=obstacle.id;const x=(obstacle.x-500)/1000*viewWidth,w=obstacle.width/1000*viewWidth,z=climbSurfaceDepth(journey,obstacle.y,obstacle.x,viewWidth)+12;
      branch.add(tube([[x-w/2,obstacle.y,z],[x,obstacle.y+4,z+4],[x+w/2,obstacle.y,z]],[6*detailScale,8*detailScale,5*detailScale],mats.bark[1],"branch-obstruction",10));
      for(let k=0;k<3;k++)branch.add(tube([[x+(k-1)*w*.27,obstacle.y+3,z],[x+(k-1)*w*.27+4,obstacle.y+17*detailScale,z+3]],[2.5*detailScale,.4],mats.bark[2],"branch-tip",6));
      batchSurfaces(branch);root.add(branch);
    }
    for(const light of journey.lights){
      const orb=mesh(new THREE.LatheGeometry([new THREE.Vector2(0,-7),new THREE.Vector2(4,-5),new THREE.Vector2(6,0),new THREE.Vector2(3,7),new THREE.Vector2(0,9)],12),glow,light.id);
      orb.position.set((light.x-500)/1000*viewWidth,light.y,climbSurfaceDepth(journey,light.y,light.x,viewWidth)+18);orb.scale.setScalar(Math.max(1,unitsPerPixel*1.6));orb.userData.dynamic=true;root.add(orb);
    }
  }
  const roots=new THREE.Group();roots.name="buttress-root-landmark";
  for(let i=0;i<7;i++){const sign=i%2?1:-1,scale=Math.min(1,viewWidth/400);roots.add(tube([[0,-25,-50],[sign*(40+i*8)*scale,-60,0],[sign*(100+i*22)*scale,-95,18]],[22*scale,17*scale,1],mats.bark[i%3],"buttress-root",12));}
  for(let i=0;i<9;i++){
    const x=(i-4)*viewWidth*.07,y=-45-Math.abs(i-4)*5;
    roots.add(tube([[x,y-20,16],[x+3,y,16]],[2.2,1.8],mats.stone[1],"mushroom-stem",7));
    const cap=mesh(new THREE.LatheGeometry([new THREE.Vector2(0,8),new THREE.Vector2(5,7),new THREE.Vector2(12,2),new THREE.Vector2(13,0),new THREE.Vector2(7,-1),new THREE.Vector2(0,-1)],16),glow,"amber-mushroom-cap");cap.position.set(x+3,y,16);roots.add(cap);
  }
  batchSurfaces(roots);root.add(roots);
  const crown=new THREE.Group();crown.name="summit-lantern-landmark";
  for(let i=0;i<8;i++){
    const side=i%2?1:-1,x=side*(40+i*viewWidth*.022);
    crown.add(tube([[0,top+35,-60],[x*.6,top+140,-35],[x,top+190-(i%3)*25,-30]],[14,9,1],mats.bark[i%3],"summit-crown-branch",9));
    for(let j=0;j<5;j++){const foliage=leaf(65,15,mats.leaf[(i+j)%3]);foliage.position.set(x,top+150,-25);foliage.rotation.z=(j-2)*.5;crown.add(foliage);}
  }
  const lantern=new THREE.Group();const lanternFront=radius-15;lantern.position.set(0,top+215,lanternFront);
  crown.add(tube([[0,top+170,-35],[0,top+250,lanternFront-5],[0,top+244,lanternFront]],[5,4,2],mats.bark[1],"lookout-lantern-support",8));
  for(const x of [-12,12])lantern.add(tube([[x,-20,0],[x,17,0]],[1.4,1.4],mats.bark[1],"lantern-frame",6));
  lantern.add(mesh(new THREE.LatheGeometry([new THREE.Vector2(0,-12),new THREE.Vector2(9,-8),new THREE.Vector2(9,11),new THREE.Vector2(0,15)],12),glow,"warm-lantern-glass"));
  lantern.add(tube([[-16,17,0],[0,29,0],[16,17,0]],[2,2,2],mats.bark[0],"lantern-roof",7));crown.add(lantern);batchSurfaces(crown);root.add(crown);
  return root;
}

export function createClimbForeground(viewWidth,viewHeight) {
 const group=new THREE.Group();group.name="near-moonwood-fern-frame";
 const green=material(0x254f43,{side:THREE.DoubleSide}),light=material(0x457553,{side:THREE.DoubleSide});
 for(const side of [-1,1])for(let tier=0;tier<2;tier++){
  const x=side*viewWidth*.54,y=viewHeight*(tier?.82:.12);
  for(let f=0;f<5;f++){
   const blade=leaf(Math.min(viewHeight*.30,viewWidth*.16),Math.min(12,viewWidth*.025),f%2?green:light);
   blade.position.set(x,y,175+tier*4);blade.rotation.z=side*(.35+f*.20);group.add(blade);
  }
 }
 batchSurfaces(group);return group;
}
