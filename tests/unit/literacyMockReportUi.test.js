import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { LITERACY_MOCK_DEMAND_LADDERS } from '../../src/policy/literacyMockDemandV6.js';

let vite, LiteracyMockReport;
test.before(async()=>{
  vite=await createServer({appType:'custom',logLevel:'silent',server:{middlewareMode:true}});
  ({LiteracyMockReport}=await vite.ssrLoadModule('/src/components/progress/LiteracyMockReport.jsx'));
});
test.after(()=>vite?.close());

const response=(id,overrides={})=>({questionId:id,skillId:'context_clues',domainId:'vocabulary',level:1,
  responseStatus:'answered',isCorrect:true,evidenceType:'independent',supportUsed:false,
  serverReceivedAt:'2026-06-01T00:00:00Z',selected:'c0',itemSnapshot:{prompt:'Which meaning fits this occurrence?',
    choices:[{id:'c0',label:'The saved meaning'},{id:'c1',label:'A different meaning'}],answer:'c0',
    constructClaim:'meaning_at_named_occurrence',adaptiveAreaVersion:'areas-v4',adaptiveAreaBand:3,
    adaptiveDemand:{operation:'interpret_one_context',requires:'Use one occurrence of a word to select its contextual sense.'}},...overrides});
function report(rows,version='literacy-mock-v8'){
  return buildLiteracyMockReport({session:{id:'historical',content_version:version,mock:{item_count:version==='literacy-mock-v9'?67:43}},
    members:[{student_id:'a',run:{status:'completed',plan:{itemIds:rows.length ? rows.map(row=>row.questionId) : ['q1','q2']},responses:rows}}]},
  {now:'2026-10-16T13:00:00Z',students:[{id:'a',name:'Alex'}]});
}
const render=(rows,version)=>renderToStaticMarkup(React.createElement(LiteracyMockReport,{report:report(rows,version),initialStudentId:'a'}));

test('an individual report shows historical demand, the saved operation and unknown prior exposure without a freshness claim',()=>{
  const html=render([response('q1')]);
  assert.match(html,/Last sampled: Building/);
  assert.match(html,/Historical sample · Jun 1, 2026/);
  assert.match(html,/Use one occurrence of a word to select its contextual sense/);
  assert.match(html,/Tasks sampled \(1\)/);
  assert.match(html,/Earlier familiarity is unknown for 1 of these independent answers/);
  assert.match(html,/absence from the available history does not prove a question is new/);
  assert.doesNotMatch(html,/percentage uses fresh, independent/);
  assert.match(html,/1 of 1 independent answers correct/);
});

test('a missing independent sample stays unmeasured while helped answers remain separate',()=>{
  const html=render([response('q1',{supportUsed:true,evidenceType:'supported'})]);
  assert.match(html,/Not measured/);
  assert.match(html,/No independent scored answers received/);
  assert.match(html,/1 helped/);
  assert.doesNotMatch(html,/0 of 0 independent answers correct/);
  assert.doesNotMatch(html,/Tasks sampled \(/);
  assert.match(html,/Skills without a recorded question in this sitting/);
});

test('V9 reports the observed boundary counts and keeps higher unsampled demands missing',()=>{
  const rows=[0,1,0,1].map((band,index)=>response(`q${index}`,{serverReceivedAt:'2026-10-16T12:00:00Z',isCorrect:band===0,
    itemSnapshot:{...response('template').itemSnapshot,domainId:'vocabulary',skillId:'context_clues',level:1,adaptiveAreaVersion:'areas-v5',adaptiveAreaBand:band,
      constructClaim:'synthetic_vocabulary_task',adaptiveDemand:LITERACY_MOCK_DEMAND_LADDERS.vocabulary[band]}}));
  const html=render(rows,'literacy-mock-v9');
  assert.match(html,/All 4 questions answered/);
  assert.match(html,/can use up to 67 questions/);
  assert.match(html,/What went well:<\/strong> Context Clues tasks — 2 independent answers correct in this sitting/);
  assert.doesNotMatch(html,/Partial sitting/);
  assert.match(html,/Boundary observed: First steps \/ Starter/);
  assert.match(html,/2 independent correct answers at First steps and 2 independent incorrect answers at Starter/);
  assert.match(html,/No independent answers at: Early, Building, Developing, Extending/);
  assert.match(html,/These demands have no independent result here/);
  assert.match(html,/not an established working level/);
  assert.doesNotMatch(html,/Secure|Mastered|RIT score:/);
});
