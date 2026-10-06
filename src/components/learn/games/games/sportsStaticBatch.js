import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const materialKeys=['type','side','transparent','opacity','alphaTest','depthTest','depthWrite','blending','roughness','metalness','emissiveIntensity','flatShading','vertexColors','wireframe','toneMapped','fog'];
const textureKeys=['map','alphaMap','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','bumpMap','displacementMap'];
function materialIdentity(material){
  if(material.userData.sportsMutable)return material.uuid;
  return JSON.stringify([...materialKeys.map(key=>material[key]),material.color?.getHex(),material.emissive?.getHex(),...textureKeys.map(key=>material[key]?.uuid||null)]);
}
const visibleWithin=(node,root)=>{for(let parent=node;parent;parent=parent.parent){if(!parent.visible||parent.userData.sportsBatchDynamic)return false;if(parent===root)return true;}return false;};

// Bake only fixed opaque park dressing into bounded spatial batches. Actual
// normals, UVs, surface vertices and collider authorities remain unchanged.
// Animated skins, billboard art, text and particles retain their own owners.
export function batchSportsStaticWorld(root,{cellSize=32}={}){
  root.updateMatrixWorld(true);
  const inverse=root.matrixWorld.clone().invert(),candidates=[],buckets=new Map();
  root.traverse(node=>{
    if(!node.isMesh||node.isSkinnedMesh||node.isInstancedMesh||node.isBatchedMesh||node.material.vertexColors||Array.isArray(node.material)
      ||node.material.transparent||!visibleWithin(node,root)||node.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return;
    candidates.push(node);
  });
  for(const node of candidates){
    const transform=new THREE.Matrix4().multiplyMatrices(inverse,node.matrixWorld);
    const center=new THREE.Vector3().setFromMatrixPosition(transform);
    const key=`${Math.floor(center.x/cellSize)}:${Math.floor(center.z/cellSize)}:${node.renderOrder}:${node.castShadow}:${node.receiveShadow}:${materialIdentity(node.material)}`;
    if(!buckets.has(key))buckets.set(key,{nodes:[],material:node.material,castShadow:node.castShadow,receiveShadow:node.receiveShadow,renderOrder:node.renderOrder});
    const geometry=(node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone()).applyMatrix4(transform);
    // Fixed park forms use position/normal/UV. Standardise their attributes so
    // merging a lathe, extrusion and indexed ramp never loses surface detail.
    const normalized=new THREE.BufferGeometry();
    for(const [name,size] of [['position',3],['normal',3],['uv',2]]){
      const attribute=geometry.getAttribute(name),count=geometry.getAttribute('position').count;
      normalized.setAttribute(name,new THREE.Float32BufferAttribute(attribute?Array.from(attribute.array):new Float32Array(count*size),size));
    }
    geometry.dispose();buckets.get(key).nodes.push({node,geometry:normalized});
  }
  const group=new THREE.Group();group.name='OriginalSportsStaticSurfaceBatches';root.add(group);
  const sourceGeometries=new Set(),unusedMaterials=new Set();let surfaceVertices=0;
  for(const bucket of buckets.values()){
    const geometry=mergeGeometries(bucket.nodes.map(({geometry})=>geometry),false);
    if(!geometry)throw new Error('Compatible sports surface batch failed');
    const mesh=new THREE.Mesh(geometry,bucket.material);mesh.castShadow=bucket.castShadow;mesh.receiveShadow=bucket.receiveShadow;mesh.renderOrder=bucket.renderOrder;
    geometry.computeBoundingBox();geometry.computeBoundingSphere();group.add(mesh);surfaceVertices+=geometry.attributes.position.count;
    for(const item of bucket.nodes){item.geometry.dispose();sourceGeometries.add(item.node.geometry);if(item.node.material!==bucket.material)unusedMaterials.add(item.node.material);item.node.removeFromParent();}
  }
  // A hidden authored-art fallback may still reference an original material or
  // geometry. Keep such resources until the normal scene owner tears it down.
  const retainedGeometry=new Set(),retainedMaterials=new Set();root.traverse(node=>{if(node.isMesh){retainedGeometry.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:[node.material])retainedMaterials.add(m);}});
  for(const geometry of sourceGeometries)if(!retainedGeometry.has(geometry))geometry.dispose();
  const duplicates=[...unusedMaterials].filter(material=>!retainedMaterials.has(material));
  group.userData={sourceMeshes:candidates.length,batchMeshes:group.children.length,surfaceVertices,cellSize};
  let disposed=false;
  return{group,snapshot:()=>({...group.userData}),dispose(){if(disposed)return;disposed=true;for(const material of duplicates)material.dispose();}};
}

// Different authored venue forms share material batches without duplicating
// their source meshes for each placement. BatchedMesh also culls each actual
// instance, so an off-camera clubhouse is not submitted with a visible flower.
export function createSportsVenueBatches(recipes){
 const root=new THREE.Group();root.name='OriginalSportsVenueMaterialBatches';
 const materialGroups=new Map(),records=[];
 for(const recipe of recipes){if(Array.isArray(recipe.material))throw new Error('Split venue material groups before batching');if(!materialGroups.has(recipe.material))materialGroups.set(recipe.material,[]);materialGroups.get(recipe.material).push(recipe);}
 for(const [material,items] of materialGroups){
  const unique=new Map();
  for(const item of items)if(!unique.has(item.geometry)){
   const source=item.geometry,geometry=new THREE.BufferGeometry();
   for(const [name,size] of [['position',3],['normal',3],['uv',2]]){
    const attribute=source.getAttribute(name),count=source.getAttribute('position').count,values=[];
    for(let i=0;i<count;i++)for(let axis=0;axis<size;axis++)values.push(attribute?attribute[['getX','getY','getZ'][axis]](i):0);
    geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
   }
   if(source.index)geometry.setIndex(source.index.clone());unique.set(source,{geometry,id:null});
  }
  const vertices=[...unique.values()].reduce((sum,item)=>sum+item.geometry.attributes.position.count,0),indices=[...unique.values()].reduce((sum,item)=>sum+(item.geometry.index?.count||0),0);
  const mesh=new THREE.BatchedMesh(items.length,vertices,indices,material);mesh.name=`SportsVenue_${material.name||material.type}`;mesh.castShadow=true;mesh.receiveShadow=true;
  for(const entry of unique.values()){entry.id=mesh.addGeometry(entry.geometry);entry.geometry.dispose();}
  for(const item of items){const id=mesh.addInstance(unique.get(item.geometry).id);mesh.setMatrixAt(id,item.transform);records.push({mesh,id,location:item.location,ordinal:item.ordinal});}
  mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);
 }
 root.userData={materialBatches:root.children.length,sourceInstances:records.length};let disposed=false;
 return{root,records,snapshot:()=>({...root.userData}),setVisible(predicate){if(disposed)return;let visible=0;for(const record of records){const value=Boolean(predicate(record));record.mesh.setVisibleAt(record.id,value);if(value)visible++;}root.userData.visibleSurfaces=visible;},
  setShadows(enabled){for(const mesh of root.children)mesh.castShadow=enabled;},dispose(){if(disposed)return;disposed=true;for(const mesh of root.children)mesh.dispose();root.removeFromParent();root.clear();records.length=0;materialGroups.clear();}};
}
