import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSION_PASSAGES, passageById } from '../../src/content/comprehension/passages.js';
import { initialPractice, reducePractice, readPractice, savePractice } from '../../src/content/comprehension/practice.js';

test('24 original complete passages have exact supported questions and phonics targets', () => {
  assert.equal(COMPREHENSION_PASSAGES.length, 24);
  assert.equal(new Set(COMPREHENSION_PASSAGES.map(p => p.text)).size, 24);
  const counts = Object.groupBy(COMPREHENSION_PASSAGES, p => p.family);
  assert.deepEqual(Object.fromEntries(Object.entries(counts).map(([k,v]) => [k,v.length])), { short: 4, digraph: 4, silent: 6, teams: 10 });
  for (const p of COMPREHENSION_PASSAGES) {
    assert.ok(p.wordCount >= 30 && p.wordCount <= 90, p.id);
    assert.equal(p.questions.length, 3);
    assert.ok(p.prerequisites.length);
    for (const w of p.targetWords) assert.ok(p.text.toLowerCase().match(new RegExp(`\\b${w}\\b`)), `${p.id}: ${w}`);
    for (const q of p.questions) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.options.includes(q.answer));
      assert.ok(q.evidence.every(e => p.sentences.includes(e)), q.id);
      assert.ok(q.evidence.length);
    }
  }
  assert.equal(passageById('missing'), null);
});

test('a first response stays immutable through supported retry and completion', () => {
  const p = COMPREHENSION_PASSAGES[0]; let s = initialPractice(p);
  const q = p.questions[0]; const wrong = q.options.find(a => a !== q.answer);
  s = reducePractice(p,s,{type:'answer',questionId:q.id,value:wrong});
  assert.equal(s.responses[q.id].first,wrong);
  s = reducePractice(p,s,{type:'answer',questionId:q.id,value:q.answer});
  assert.equal(s.responses[q.id].first,wrong);
  assert.equal(s.responses[q.id].correct,true);
  assert.equal(s.completed,false);
  for (const other of p.questions.slice(1)) s=reducePractice(p,s,{type:'answer',questionId:other.id,value:other.answer});
  assert.equal(s.completed,true);
  assert.deepEqual(reducePractice(p,s,{type:'reset'}),initialPractice(p));
  assert.deepEqual(reducePractice(p,s,{type:'answer',questionId:q.id,value:'invented'}),s);
});

test('practice storage is learner scoped, validates corruption and survives denied storage', () => {
 const m = new Map(); const storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 const p=COMPREHENSION_PASSAGES[0]; let s=reducePractice(p,initialPractice(p),{type:'read',index:0});
 savePractice(storage,'teacher:one/child:one',p,s);
 assert.equal(readPractice(storage,'teacher:one/child:one',p).reads[0],true);
 assert.equal(readPractice(storage,'teacher:two/child:one',p).reads[0],false);
 for(const k of m.keys())m.set(k,'{"version":1,"reads":[true,true,true],"responses":{"bogus":{"correct":true}}}');
 assert.deepEqual(readPractice(storage,'teacher:one/child:one',p),initialPractice(p));
 assert.deepEqual(readPractice({getItem(){throw Error('denied');}},'one',p),initialPractice(p));
 assert.equal(savePractice({setItem(){throw Error('denied');}},'one',p,s),false);
});

test('print variants are deterministic, validate selection and separate teacher answers', async () => {
 const {buildComprehensionDocument:build}=await import('../../src/content/comprehension/print.js');
 const id=COMPREHENSION_PASSAGES[0].id;
 const a=build({passageIds:[id],variant:'pair'});
 assert.deepEqual(a,build({passageIds:[id],variant:'pair'}));
 const taskIds=[...a.html.matchAll(/data-task-id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(taskIds).size,taskIds.length,'task metadata stays unique when the passage repeats for drawing');
 assert.equal(a.pages,2); assert.equal((a.html.match(/data-worksheet-page=/g)||[]).length,2);
 assert.ok(a.html.includes('data-task-kind="comprehension"'));
 assert.ok(a.html.includes('data:font/woff2;base64,'));
 assert.ok(!a.html.includes('Teacher guide'));
 assert.ok(build({passageIds:[id],variant:'teacher'}).html.includes('Teacher guide'));
 assert.throws(()=>build({passageIds:[],variant:'pair'}));
 assert.throws(()=>build({passageIds:['bad'],variant:'pair'}));
 assert.throws(()=>build({passageIds:[id],variant:'bad'}));
 assert.equal(build({passageIds:[id,id],variant:'worksheet'}).pages,1);
});

test('comprehension is a reachable child route and teacher class resource', async()=>{
 const {APP_VIEWS}=await import('../../src/appState/appViews.js');
 const {isStudentAllowedView,getPersistedAppView,teacherIntentHash}=await import('../../src/appState/appViewHelpers.js');
 assert.equal(APP_VIEWS.COMPREHENSION,'comprehension');
 assert.equal(isStudentAllowedView(APP_VIEWS.COMPREHENSION),true);
 assert.equal(getPersistedAppView({appView:APP_VIEWS.COMPREHENSION}),APP_VIEWS.COMPREHENSION);
 assert.equal(teacherIntentHash({appView:APP_VIEWS.COMPREHENSION,classId:'class',learnerId:'child'}),'#teacher/teach/comprehension?class=class');
});

test('teacher deep links stay class scoped and existing exact assignments keep focus', async()=>{
 const {parse}=await import('../../src/appState/routes.js');
 const {APP_VIEWS}=await import('../../src/appState/appViews.js');
 const {enforceStudentFocusView}=await import('../../src/policy/studentFocusTargets.js');
 const route=parse('#teacher/teach/comprehension?class=abc&learner=private');
 assert.equal(route.appView,APP_VIEWS.COMPREHENSION);assert.equal(route.learnerId,'');
 const session={status:'active',target:'assigned_book',expires_at:new Date(Date.now()+60000).toISOString()};
 assert.equal(enforceStudentFocusView(APP_VIEWS.COMPREHENSION,session),APP_VIEWS.GUIDED_READING);
});
