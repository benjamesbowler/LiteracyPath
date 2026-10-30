import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSION_PASSAGES, passageById } from '../../src/content/comprehension/passages.js';
import { initialPractice, reducePractice, readPractice, savePractice, practiceQuestion } from '../../src/content/comprehension/practice.js';

test('172 original complete passages have exact supported questions and phonics targets', () => {
  assert.equal(COMPREHENSION_PASSAGES.length, 172);
  assert.equal(new Set(COMPREHENSION_PASSAGES.map(p => p.text)).size, 172);
  const counts = Object.groupBy(COMPREHENSION_PASSAGES, p => p.family);
  assert.deepEqual(Object.fromEntries(Object.entries(counts).map(([k,v]) => [k,v.length])), { short: 41, digraph: 41, silent: 40, teams: 50 });
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
  const reset=reducePractice(p,s,{type:'reset'});assert.notEqual(reset.runSeed,s.runSeed);assert.deepEqual(reset.responses,{});assert.deepEqual(reset.reads,[false,false,false]);assert.equal(reset.completed,false);
  assert.deepEqual(reducePractice(p,s,{type:'answer',questionId:q.id,value:'invented'}),s);
});

test('early-reader language stays brief and word help reaches both child sheets', async () => {
 const {buildComprehensionDocument:build}=await import('../../src/content/comprehension/print.js');
 const words=text=>text.match(/[a-z]+(?:'[a-z]+)?/gi)||[];
 for(const p of COMPREHENSION_PASSAGES){
  assert.ok(!p.supportWords.includes('s'),`${p.id}: a possessive ending is not a separate support word`);
  for(const sentence of p.sentences)assert.ok(words(sentence).length<=12,`${p.id}: long sentence`);
  for(const q of p.questions)assert.ok(words(q.prompt).length<=16,`${q.id}: long question`);
  assert.ok(p.wordHelp.length>=1&&p.wordHelp.length<=2,p.id);
  for(const [word,meaning] of p.wordHelp){
   assert.ok(word&&meaning);
   assert.ok(words(meaning).length<=10,`${p.id}: long word meaning`);
   for(const variant of ['worksheet','choice','extension']){
    const {html}=build({passageIds:[p.id],variant});
    assert.ok(html.includes(`${word} = ${meaning}`),`${p.id}: missing print word help`);
   }
  }
 }
});

test('practice storage is learner scoped, validates corruption and survives denied storage', () => {
 const m = new Map(); const storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 const p=COMPREHENSION_PASSAGES[0]; let s=reducePractice(p,initialPractice(p),{type:'read',index:0});
 savePractice(storage,'teacher:one/child:one',p,s);
 assert.equal(readPractice(storage,'teacher:one/child:one',p).reads[0],true);
 assert.equal(readPractice(storage,'teacher:two/child:one',p).reads[0],false);
 for(const k of m.keys())m.set(k,'{"version":1,"reads":[true,true,true],"responses":{"bogus":{"correct":true}}}');
 assert.deepEqual(readPractice(storage,'teacher:one/child:one',p).responses,{});
 assert.deepEqual(readPractice({getItem(){throw Error('denied');}},'one',p).responses,{});
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


test('choice order is shuffled per saved run and remains stable through replay, retry and reload',()=>{
 const p=COMPREHENSION_PASSAGES[0],m=new Map(),store={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 let state=readPractice(store,'learner',p);
 const before=practiceQuestion(p,state,0).options;
 assert.deepEqual(practiceQuestion(p,readPractice(store,'learner',p),0).options,before,'new unanswered run is saved for reload');
 state=reducePractice(p,state,{type:'answer',questionId:p.questions[0].id,value:p.questions[0].answer});
 assert.deepEqual(practiceQuestion(p,state,0).options,before);
 savePractice(store,'learner',p,state);
 assert.deepEqual(practiceQuestion(p,readPractice(store,'learner',p),0).options,before);
 const positions=new Set(Array.from({length:100},(_,i)=>{const q=practiceQuestion(p,initialPractice(p,`run-${i}`),0);assert.deepEqual([...q.options].sort(),[...p.questions[0].options].sort());return q.options.indexOf(q.answer);}));
 assert.equal(positions.size,4,'fresh runs can use every answer position');
 assert.equal(new Set(COMPREHENSION_PASSAGES.map(p=>p.id)).size,172);
});

test('the full 344-page student pack embeds only six shared portraits',async()=>{
 const {buildComprehensionDocument,embedComprehensionImages}=await import('../../src/content/comprehension/print.js');
 const pack=buildComprehensionDocument({passageIds:COMPREHENSION_PASSAGES.map(p=>p.id),variant:'pair'});
 assert.equal(pack.pages,344);
 assert.equal((pack.html.match(/<use href=/g)||[]).length,344);
 let requests=0;
 const html=await embedComprehensionImages(pack.html,{fetchImpl:async()=>{requests++;return {ok:true,blob:async()=>new Blob(['fixture'],{type:'image/webp'})};}});
 assert.equal(requests,6,'fetch each approved character once');
 assert.equal((html.match(/data:image\/webp;base64,/g)||[]).length,6,'large packs must not duplicate raster bytes on every page');
 assert.ok(!html.includes('href="/images/'));
 assert.equal((html.match(/class="printed-option"/g)||[]).length,172*3*4);
});
