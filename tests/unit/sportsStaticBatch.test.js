import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {batchSportsStaticWorld} from '../../src/components/learn/games/games/sportsStaticBatch.js';

test('sports fixed-surface batches preserve transformed riding vertices, normals, UVs and material variation',()=>{
 const root=new THREE.Group(),a=new THREE.MeshStandardMaterial({color:'#c5a17c'}),b=a.clone();
 const group=new THREE.Group();group.position.set(4,2,3);group.rotation.y=.4;root.add(group);
 for(const [x,mat] of [[0,a],[3,b]]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,1,4),mat);mesh.position.x=x;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 const mutable=a.clone();mutable.userData.sportsMutable=true;const stripe=new THREE.Mesh(new THREE.BoxGeometry(2,.1,.3),mutable);stripe.position.set(6,0,5);stripe.castShadow=stripe.receiveShadow=true;root.add(stripe);
 const fixed=[];root.updateMatrixWorld(true);root.traverse(n=>{if(n.isMesh){const g=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();g.applyMatrix4(n.matrixWorld);for(let i=0;i<g.attributes.position.count;i++)fixed.push([g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i)].map(v=>v.toFixed(5)).join(','));g.dispose();}});
 const batch=batchSportsStaticWorld(root);assert.equal(batch.snapshot().sourceMeshes,3);assert.equal(batch.snapshot().batchMeshes,2);
 const result=[];batch.group.traverse(n=>{if(n.isMesh)for(let i=0;i<n.geometry.attributes.position.count;i++)result.push([n.geometry.attributes.position.getX(i),n.geometry.attributes.position.getY(i),n.geometry.attributes.position.getZ(i)].map(v=>v.toFixed(5)).join(','));});assert.deepEqual(result.sort(),fixed.sort());
 assert.ok(batch.group.children.every(n=>n.geometry.attributes.normal.count===n.geometry.attributes.position.count&&n.geometry.attributes.uv.count===n.geometry.attributes.position.count));mutable.emissiveIntensity=.7;assert.ok(batch.group.children.some(n=>n.material.emissiveIntensity===.7));batch.dispose();
});

test('sports batching retains authored billboards, animation, hidden fallback and independent teardown',()=>{
 const root=new THREE.Group(),g=new THREE.BoxGeometry(),m=new THREE.MeshStandardMaterial(),dynamic=new THREE.Group();dynamic.userData.sportsBatchDynamic=true;root.add(dynamic);
 const actor=new THREE.Mesh(g,m);dynamic.add(actor);const hidden=new THREE.Mesh(g,m);hidden.visible=false;root.add(hidden);const staticMesh=new THREE.Mesh(g,m);root.add(staticMesh);
 let geometryDisposed=0;g.addEventListener('dispose',()=>geometryDisposed++);const batch=batchSportsStaticWorld(root);assert.equal(batch.snapshot().sourceMeshes,1);assert.equal(actor.parent,dynamic);assert.equal(hidden.parent,root);assert.equal(geometryDisposed,0);batch.dispose();batch.dispose();assert.equal(geometryDisposed,0);
});

test('authored venue batches retain unique geometry, exact placements, independent culling and release their private textures',async()=>{
 const {createSportsVenueBatches}=await import('../../src/components/learn/games/games/sportsStaticBatch.js');
 const material=new THREE.MeshStandardMaterial(),box=new THREE.BoxGeometry(),round=new THREE.SphereGeometry(1,8,6),matrices=[new THREE.Matrix4().makeTranslation(2,0,3),new THREE.Matrix4().makeRotationY(.7),new THREE.Matrix4().makeTranslation(-70,0,-90)];
 const batches=createSportsVenueBatches(matrices.map((transform,i)=>({geometry:i===1?round:box,material,transform,location:{x:i===2?-70:2,z:3},ordinal:i})));
 assert.equal(batches.snapshot().materialBatches,1);assert.equal(batches.snapshot().sourceInstances,3);const mesh=batches.root.children[0];assert.equal(mesh.perObjectFrustumCulled,true);assert.equal(mesh.instanceCount,3);
 for(const [i,record] of batches.records.entries()){const actual=new THREE.Matrix4();mesh.getMatrixAt(record.id,actual);assert.ok(actual.elements.every((value,axis)=>Math.abs(value-matrices[i].elements[axis])<1e-6));}
 batches.setVisible(({location})=>location.x>0);assert.equal(batches.snapshot().visibleSurfaces,2);assert.equal(mesh.getVisibleAt(batches.records[2].id),false);
 let disposed=0;mesh._matricesTexture.addEventListener('dispose',()=>disposed++);mesh._indirectTexture.addEventListener('dispose',()=>disposed++);batches.dispose();batches.dispose();assert.equal(disposed,2);assert.equal(batches.root.children.length,0);assert.equal(batches.records.length,0,'Released batch records cannot retain parsed source materials');assert.ok(box.attributes.position.count>0);
});
