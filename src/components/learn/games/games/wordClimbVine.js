/** A reusable, camera-facing physical safety vine. Geometry ownership is
 * stable for its whole engine lifetime; no per-frame TubeGeometry allocation. */
export function createWordClimbVine(THREE,{segments=24,width=1.2}={}){
  const geometry=new THREE.BufferGeometry(),vertices=new Float32Array((segments+1)*6),uv=new Float32Array((segments+1)*4),indices=[];
  for(let i=0;i<=segments;i++){
    uv.set([0,i/segments,1,i/segments],i*4);
    if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);
  const material=new THREE.MeshBasicMaterial({color:0xd2bb7f,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='contact-following-reusable-safety-vine';mesh.visible=false;mesh.frustumCulled=false;
  let disposed=false;
  return{mesh,update(start,end){
    if(disposed)return;
    const mx=(start.x+end.x)/2+18,my=(start.y+end.y)/2,mz=(start.z+end.z)/2;
    for(let i=0;i<=segments;i++){
      const t=i/segments,a=(1-t)*(1-t),b=2*(1-t)*t,c=t*t;
      const x=a*start.x+b*mx+c*end.x,y=a*start.y+b*my+c*end.y,z=a*start.z+b*mz+c*end.z;
      const dx=2*((1-t)*(mx-start.x)+t*(end.x-mx)),dy=2*((1-t)*(my-start.y)+t*(end.y-my));
      const length=Math.hypot(dx,dy)||1,nx=-dy/length*width/2,ny=dx/length*width/2;
      vertices.set([x+nx,y+ny,z,x-nx,y-ny,z],i*6);
    }
    geometry.attributes.position.needsUpdate=true;mesh.visible=true;
  },dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();geometry.dispose();material.dispose();}};
}
