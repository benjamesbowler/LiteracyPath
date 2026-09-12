import test from 'node:test';
import assert from 'node:assert/strict';
import { readSoundSeekersPreviewReadiness } from '../../src/features/soundSeekers/preview/previewReadiness.js';

const element=(attributes,stage=null)=>({getAttribute:name=>attributes[name]??null,querySelector:selector=>selector==='[data-sound-seekers-stage]'?stage:null});
const documentFor=(campaign=null,legacy=null)=>({querySelector:selector=>selector==='[data-sound-seekers-game][data-presentation]'?campaign:selector==='[data-sound-seekers-game="v2"]'?legacy:null});

test('the current campaign reports all public presentations and its real loading/error transitions',()=>{
  const attributes={'data-presentation':'landscape','data-runtime-status':'loading'},document=documentFor(element(attributes));
  assert.equal(readSoundSeekersPreviewReadiness(document).status,'loading');
  attributes['data-runtime-status']='ready';
  for(const view of ['landscape','platform','maze']){
    attributes['data-presentation']=view;
    assert.deepEqual(readSoundSeekersPreviewReadiness(document),{status:'ready',currentPhaseId:null,view,stageStatus:'ready'});
  }
  attributes['data-runtime-status']='error';assert.equal(readSoundSeekersPreviewReadiness(document).status,'error');
  delete attributes['data-runtime-status'];assert.equal(readSoundSeekersPreviewReadiness(document).status,'loading');
});

test('a campaign loaded from a legacy fixture does not fabricate a legacy phase or wait for one',()=>{
  const campaign=element({'data-presentation':'landscape','data-runtime-status':'ready','data-phase-id':'unexpected-legacy-phase'});
  const staleLegacy=element({'data-view':'play','data-phase-id':'legacy-stop'});
  const report=readSoundSeekersPreviewReadiness(documentFor(campaign,staleLegacy),{hasFixture:true});
  assert.equal(report.status,'ready');assert.equal(report.currentPhaseId,null);assert.equal(report.view,'landscape');
});

test('legacy readiness retains its phase requirement and nested stage loading contract',()=>{
  const attributes={'data-view':'play'},stageAttributes={'data-runtime-status':'loading'};
  const document=documentFor(null,element(attributes,element(stageAttributes)));
  assert.equal(readSoundSeekersPreviewReadiness(document,{hasFixture:true}).status,'loading');
  stageAttributes['data-runtime-status']='ready';assert.equal(readSoundSeekersPreviewReadiness(document,{hasFixture:true}).status,'loading');
  assert.equal(readSoundSeekersPreviewReadiness(document).status,'ready');
  attributes['data-phase-id']='phase-a';
  assert.deepEqual(readSoundSeekersPreviewReadiness(document,{hasFixture:true}),{status:'ready',currentPhaseId:'phase-a',view:'play',stageStatus:'ready'});
});

test('an unmounted route stays loading without guessed view or phase data',()=>{
  assert.deepEqual(readSoundSeekersPreviewReadiness(documentFor()),{status:'loading',currentPhaseId:null,view:null,stageStatus:null});
});
