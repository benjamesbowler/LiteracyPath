import * as THREE from 'three';

export function arcadeSurfaceTexture(kind, world='meadow') {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d');
  const palettes={ meadow:{concrete:'#c6c6b7',gravel:'#c9b590',grass:'#66805a'},dino:{concrete:'#a5937c',gravel:'#ac8056',grass:'#657453'},moonwood:{concrete:'#525d79',gravel:'#77748f',grass:'#3d5363'} };
  ctx.fillStyle=(palettes[world]||palettes.meadow)[kind];ctx.fillRect(0,0,512,512);
  let seed=581;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<11000;i++) {
    const x=random()*512,y=random()*512,size=.3+random()*1.8;
    ctx.fillStyle=i%3?'rgba(255,255,240,.045)':'rgba(18,36,32,.09)';
    ctx.fillRect(x,y,size,kind==='grass'?size*2:size);
  }
  if(kind==='concrete'){
    ctx.strokeStyle='rgba(49,65,61,.20)';ctx.lineWidth=1;
    ctx.strokeRect(.5,.5,511,511);
    ctx.strokeStyle='rgba(255,255,255,.17)';ctx.strokeRect(2,2,508,508);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;
  texture.repeat.set(kind==='grass'?12:8,kind==='grass'?12:8);return texture;
}

export function createGrovePaths(world, route=0) {
  const group=new THREE.Group();group.name='Garden gravel trails';
  const map=arcadeSurfaceTexture('gravel',world);map.repeat.set(1,24);
  const material=new THREE.MeshStandardMaterial({map,roughness:.96,metalness:0,polygonOffset:true,polygonOffsetFactor:-1});
  const paths=[[[0,80],[0,48],[-6,0],[0,-44],[0,-83]]];
  for(const z of [[48,4,-44],[50,-12,-52],[40,0,-65]][route%3])paths.push([[-113,z-8],[-72,z+3],[-28,z-4],[0,z],[45,z+4],[82,z-6],[113,z]]);
  for(const points of paths) {
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(route%2?-x:x,.035,z)));
    const verts=[],uv=[],indices=[],segments=120;
    for(let i=0;i<=segments;i++){
      const t=i/segments,p=curve.getPoint(t),tan=curve.getTangent(t),side=new THREE.Vector3(-tan.z,0,tan.x);
      const half=3.3+Math.sin(t*13)*.3;
      for(const sign of [-1,1]){const q=p.clone().addScaledVector(side,half*sign);verts.push(q.x,q.y,q.z);uv.push((sign+1)/2,t);}
      if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;group.add(mesh);
  }
  return group;
}
