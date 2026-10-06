import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { registerRocketCraftAnatomy } from '../../src/components/learn/games/games/rocketRunCraftAnatomy.js';

function fixture() {
  const root = new THREE.Group(),nodes = {};
  const record = { actualSourceSubframes:{threshold:1e-5},jointEndpoints:{},torsoAttachmentPairs:{},contacts:{},
    release:{clip:'celebrate',contact:'leftGrip',startPhase:.04,endPhase:.96} };
  function bone(name) { if (!nodes[name]) { const node = new THREE.Bone();node.name=name;nodes[name]=node;root.add(node); } return nodes[name]; }
  bone('chest');
  for (const side of ['L','R']) {
    for (const [name,from,to] of [['Wrist','forearm','hand'],['Elbow','upperarm','forearm'],['Ankle','shin','foot'],['Knee','thigh','shin']]) {
      bone(from+'.'+side);bone(to+'.'+side);
      record.jointEndpoints[side.toLowerCase()+name] = {fromBone:from+'.'+side,toBone:to+'.'+side,
        fromSourcePoint:[0,0,0],toSourcePoint:[0,0,0]};
    }
    record.torsoAttachmentPairs[side.toLowerCase()+'Shoulder'] = {fromBone:'upperarm.'+side,toBone:'chest',
      fromSourcePoint:[0,0,0],toSourcePoint:[0,0,0]};
  }
  for (const name of ['leftGrip','rightGrip','leftSole','rightSole']) {
    const boneName = (name.endsWith('Grip')?'hand.':'foot.')+(name.startsWith('left')?'L':'R');
    const support = name.endsWith('Grip')?name+'Socket':name.replace('Sole','FootDock');
    bone(support);record.contacts[name] = {bone:boneName,support,sourcePoint:[0,0,0]};
  }
  return {root,nodes,record};
}

test('real loaded joint/shoulder/support observations remain independent after a returned snapshot is modified',()=>{
  const {root,record} = fixture(),before = JSON.stringify(record),anatomy = registerRocketCraftAnatomy(root,record);
  const first = anatomy.sample('cruise',.5);
  assert.equal(first.contacts.length,4);assert.equal(first.joints.length,8);assert.equal(first.shoulders.length,2);
  assert.ok([...first.contacts,...first.joints,...first.shoulders].every(row=>row.attached===true));
  first.joints[0].from[0] = 999;first.contacts[0].point[0] = 888;
  assert.deepEqual(anatomy.sample('cruise',.5).joints[0].from,[0,0,0]);
  assert.equal(JSON.stringify(record),before);
});

test('visible left-palm release exempts only that physical support; wrist/shoulder and other limbs remain observed',()=>{
  const {root,nodes,record} = fixture(),anatomy = registerRocketCraftAnatomy(root,record);
  nodes['hand.L'].position.x = .1;
  nodes['upperarm.L'].position.y = .001;
  nodes['hand.R'].position.z = .002;
  const wave = anatomy.sample('celebrate',.5);
  const released = wave.contacts.find(row=>row.name==='leftGrip');
  assert.equal(released.supported,false);assert.equal(released.attached,null);assert.equal(released.separation,.1);
  assert.equal(wave.contacts.find(row=>row.name==='rightGrip').attached,false);
  assert.equal(wave.joints.find(row=>row.name==='lWrist').attached,false);
  assert.equal(wave.shoulders.find(row=>row.name==='lShoulder').attached,false);
  for (const [clip,phase] of [['cruise',.5],['celebrate',.04],['celebrate',.96]]) {
    const held = anatomy.sample(clip,phase).contacts.find(row=>row.name==='leftGrip');
    assert.equal(held.supported,true);assert.equal(held.attached,false);
  }
  assert.deepEqual(nodes['hand.L'].position.toArray(),[.1,0,0]);
});

test('missing actual anatomy registrations/skin bones cannot acquire a contact observation',()=>{
  for (const repair of [value=>delete value.record.jointEndpoints.rAnkle,
    value=>delete value.record.torsoAttachmentPairs.rShoulder,
    value=>{value.record.jointEndpoints.lWrist.toBone='chest';},
    value=>{value.nodes['hand.L'].isBone=false;},
    value=>{value.record.release.contact='rightGrip';}]) {
    const value = fixture();repair(value);
    assert.throws(()=>registerRocketCraftAnatomy(value.root,value.record));
  }
});
