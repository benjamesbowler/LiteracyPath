// Actual projected world triangles, shared physical UVs and retained texels.
// This is drawing only; no collider/route/answer state enters the projection.
export function groveAffineTexture(source,destination) {
  if(![...source,...destination].every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)))return null;
  const [u,v,w]=source,[a,b,c]=destination;
  const determinant=(v.x-u.x)*(w.y-u.y)-(w.x-u.x)*(v.y-u.y);
  if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-8)return null;
  const xx=((b.x-a.x)*(w.y-u.y)-(c.x-a.x)*(v.y-u.y))/determinant;
  const xy=((b.y-a.y)*(w.y-u.y)-(c.y-a.y)*(v.y-u.y))/determinant;
  const yx=((c.x-a.x)*(v.x-u.x)-(b.x-a.x)*(w.x-u.x))/determinant;
  const yy=((c.y-a.y)*(v.x-u.x)-(b.y-a.y)*(w.x-u.x))/determinant;
  return[xx,xy,yx,yy,a.x-xx*u.x-yx*u.y,a.y-xy*u.x-yy*u.y];
}
export function drawGroveTexturedTriangle(context,image,source,points) {
  if(!points.every(point=>point.visible))return false;
  const transform=groveAffineTexture(source,points);if(!transform)return false;
  context.save();context.beginPath();points.forEach((point,index)=>index?context.lineTo(point.x,point.y):context.moveTo(point.x,point.y));context.closePath();context.clip();
  context.transform(...transform);context.drawImage(image,0,0);context.restore();return true;
}
export function drawGroveSceneryFloor(THREE,context,camera,project,detail,width,height) {
  if(!detail)return{ground:0,horizons:0};
  const {images,plan,group}=detail;let ground=0,horizons=0;
  const vertex=new THREE.Vector3(),normal=new THREE.Vector3(),centre=new THREE.Vector3(),toward=new THREE.Vector3();
  group.updateWorldMatrix(true,true);
  if(images.horizon)for(const mesh of group.children.filter(child=>child.userData.groveAuthoredHorizon)){
    mesh.getWorldPosition(centre);mesh.getWorldDirection(normal);toward.copy(camera.position).sub(centre);if(normal.dot(toward)<0)continue;
    const position=mesh.geometry.attributes.position,points=[0,1,2,3].map(index=>{vertex.fromBufferAttribute(position,index).applyMatrix4(mesh.matrixWorld);return project(camera,vertex.x,vertex.y,vertex.z);});
    const source=[{x:0,y:0},{x:images.horizon.width,y:0},{x:0,y:images.horizon.height},{x:images.horizon.width,y:images.horizon.height}];
    for(const indices of[[0,2,1],[2,3,1]])if(drawGroveTexturedTriangle(context,images.horizon,indices.map(i=>source[i]),indices.map(i=>points[i])))horizons++;
  }
  if(images.grass){const tile=plan.groundTileWorldSize,minX=-128,maxX=128,minZ=-98,maxZ=98;
    for(let z=minZ;z<maxZ;z+=tile)for(let x=minX;x<maxX;x+=tile){
      const right=Math.min(maxX,x+tile),bottom=Math.min(maxZ,z+tile),points=[[x,z],[right,z],[x,bottom],[right,bottom]].map(([px,pz])=>project(camera,px,-.02,pz));
      if(!points.every(point=>point.visible)||Math.max(...points.map(p=>p.x))<0||Math.min(...points.map(p=>p.x))>width||Math.max(...points.map(p=>p.y))<0||Math.min(...points.map(p=>p.y))>height)continue;
      const u=images.grass.width*(right-x)/tile,v=images.grass.height*(bottom-z)/tile,source=[{x:0,y:0},{x:u,y:0},{x:0,y:v},{x:u,y:v}];
      for(const indices of[[0,2,1],[2,3,1]])if(drawGroveTexturedTriangle(context,images.grass,indices.map(i=>source[i]),indices.map(i=>points[i])))ground++;
    }
  }
  return{ground,horizons};
}
