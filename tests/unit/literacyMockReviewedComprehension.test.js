import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { LITERACY_MOCK_RUNTIME_V14 } from '../../src/data/generated/literacyMockRuntimeV14.generated.js';
import { reviewComprehensionItem as review, reviewedComprehensionBand as band } from '../../src/data/literacyMockReviewedComprehension.js';
import { normalizeLedaAudioText } from '../../src/data/normalizeLedaAudioText.js';
import { scoreLiteracyMockResponse as scores } from '../../src/data/literacyMockRuntimeContract.js';

const before = LITERACY_MOCK_RUNTIME_V14.map(item=>item.itemSnapshot);
const reviewed = before.filter(q=>['reading','listening','writing'].includes(q.domainId)).map(review);
const changed = reviewed.filter(q=>q.sourceProvenance?.v15Review);
const get = id=>reviewed.find(q=>q.id===id);
const label = (q,id)=>q.choices.find(c=>c.id===id).label;
const publicDir = new URL('../../public/',import.meta.url);

test('new scenes require a relationship or action and use their exact original recording and pictures',()=>{
  const q = get('mock.v5.listening.phrase.ball.v11');
  assert.equal(q.passage,'The ball is below the shelf.');
  assert.equal(label(q,q.answer),'ball below shelf');
  assert.ok(q.choices.some(c=>c.label==='ball between boxes'));
  assert.ok(q.choices.some(c=>c.label==='book on shelf'));
  assert.equal(q.hideWrittenLabels,true);
  assert.equal(q.displayPassageDuringResponse,false);
  assert.equal(q.requiredAudioCues.filter(c=>c.role==='passage')[0].text,q.passage);
  const scenes = changed.filter(q=>q.sourceProvenance.v15Review.operation==='understand-spoken-scene');
  assert.ok(scenes.length>=35);
  assert.ok(new Set(scenes.map(q=>q.exposureFamilyId)).size>=33);
  const open=scenes.find(q=>q.passage==='Open the gate.');
  const shut=scenes.find(q=>q.passage==='Shut the gate.');
  assert.equal(open.exposureFamilyId,shut.exposureFamilyId);
  assert.notEqual(open.canonicalItemId,shut.canonicalItemId);
  const wrongImages=q.choices.map(c=>({...c,image:q.choices[0].image}));
  assert.equal(band({...q,choices:wrongImages}),null);
});

test('one- and two-episode lessons compete against plausible advice; two true partials survive only on the harder task',()=>{
  for (const lesson of changed.filter(q=>q.adaptiveAreaBand>=5 && q.sourceProvenance.v15Review.operation==='infer-supported-lesson')) {
    const peers=lesson.taskDemand.proof.competingLessons;
    assert.equal(peers.length,lesson.adaptiveAreaBand===5?3:1);
    assert.ok(peers.every(p=>p!==label(lesson,lesson.answer)));
    if (lesson.adaptiveAreaBand===6) {
      const historical=before.find(p=>p.id===lesson.id);
      for(const id of ['c1','c2']) assert.equal(label(lesson,id),label(historical,id));
    }
  }
  const q = get('mock.v8.comprehension.reading.theme.turn-taking.b5.v11');
  assert.ok(q.passage.includes('waited for the bottom to clear'));
  assert.ok(q.choices.some(c=>c.label==='Agree on a plan before working together.'));
  assert.equal(label(q,q.answer),'Wait for a clear turn when people share an activity.');
});

test('middle order has exactly three events; evidence sets require both supported details',()=>{
  const qs=changed.filter(q=>q.sourceProvenance.v15Review.operation==='recover-middle-event');
  assert.ok(qs.some(q=>q.domainId==='listening') && qs.some(q=>q.domainId==='reading'));
  for(const q of qs) {
    assert.ok(!q.passage.includes('At the end,'));
    assert.equal(label(q,q.answer),q.taskDemand.proof.chronology[1]);
    assert.equal(q.taskDemand.proof.chronology.length,3);
  }
  const q=get('mock.v8.comprehension.reading.main_idea.lunchbox.b4.v11');
  assert.ok(scores(q,['c1','c2']));
  assert.ok(!scores(q,['c0','c1']));
  assert.ok(!scores(q,['c1']));
  assert.match(label(q,'c1'),/apples/);
  assert.match(label(q,'c2'),/clips/);
  assert.match(q.passage,/clips hold the lid shut/);
});

test('writing tests complete thought and clause boundaries with the answer cues removed',()=>{
  const q=get('mock.capacity.writing.stop-detail-4.v11');
  assert.equal(q.format,'select_text');
  assert.equal(label(q,q.answer),'goal');
  assert.equal(q.passage,'The players gathered by the goal everyone turned when the whistle blew');
  assert.equal(band(q),5);
  assert.equal(band({...q,answer:'w0'}),null);
  const punctuated=get('mock.sentence.birds');
  assert.deepEqual(punctuated.answer.map(id=>label(punctuated,id)),['two','little','birds','sing']);
  const bell=get('mock.capacity.writing.word-order-entry-2');
  assert.equal(bell.explanation,'This bell needs fixing.');
  assert.ok(bell.stimulusKey.includes('fixing'));
  const cap=get('literacy.capitalization.sentence-fix-easy-0.v11');
  assert.deepEqual(cap.choices.map(c=>c.label),['The','the','They','they']);
  const paragraph=get('literacy.writing_organization.remove-detail.v11');
  assert.ok(paragraph.choices.every(c=>paragraph.passage.includes(c.label)));
});

test('every reviewed response has a verifiable band and aligned available media, without changing V14',()=>{
  assert.ok(changed.length>450);
  for (const item of changed) {
    assert.equal(band(item),item.adaptiveAreaBand,item.id);
    for (const path of [...item.requiredAudioPaths,...item.requiredImagePaths]) {
      assert.ok(existsSync(new URL(path.slice(1),publicDir)),path);
    }
    for (const cue of item.requiredAudioCues.filter(c=>c.role==='choice')) {
      const choice=item.choices.find(c=>c.id===cue.choiceId);
      assert.equal(normalizeLedaAudioText(cue.text),normalizeLedaAudioText(choice.label));
      assert.equal(cue.path,choice.audioPath);
    }
    if(item.domainId==='reading') assert.ok(item.requiredAudioCues.every(c=>c.role!=='passage'));
  }
  assert.equal(before.find(q=>q.id==='mock.v5.listening.phrase.ball.v11').passage,'I have a red ball.');
});
