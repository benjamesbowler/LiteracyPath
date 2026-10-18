import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { buildLiteracyMockReport, LITERACY_MOCK_REPORT_SKILLS } from "../../src/utils/literacyMockReport.js";
import { REPORTING_BIBLE_POLICY } from "../../src/policy/reportingBible.js";
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { allocateIndependentItems } from '../../src/utils/literacyMockPlanner.js';

let vite;
let panel;
let reportComponent;
test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ TeacherLiteracyMockPanel: panel } = await vite.ssrLoadModule("/src/components/progress/TeacherLiteracyMockPanel.jsx"));
  ({ LiteracyMockReport: reportComponent } = await vite.ssrLoadModule("/src/components/progress/LiteracyMockReport.jsx"));
});
test.after(async () => { await vite?.close(); });

test("teacher preparation exposes one full mock for the class or selected children", () => {
  const html = renderToStaticMarkup(React.createElement(panel, { classId: "c", students: [{ id: "s", name: "Alex" }], initialStudentIds: ["s"] }));
  assert.match(html, /teacher-product-page literacy-mock-teacher/);
  assert.match(html, /Full adaptive test · up to 67 questions/);
  assert.match(html, /All eight literacy areas, starting with the simplest tasks/);
  assert.match(html, /Repeated observations can finish an area early/);
  assert.doesNotMatch(html, /Short mock|Timed sample|Assessment length/);
  assert.match(html, /Adaptive Literacy Test/);
  assert.match(html, /Results save automatically/);
  assert.match(html, /Individual or selected students/);
  assert.match(html, /This test has no time limit/);
  assert.match(html, /Use Pause assessment for a break, then Resume assessment/);
  assert.doesNotMatch(html, /Time before a break|Break settings/);
  assert.match(html, /not affiliated with or endorsed by NWEA/);
  assert.match(html, /original questions for MAP-style Reading K–2 preparation/);
  assert.doesNotMatch(html, /Loading session history/);
  const resultsHtml = renderToStaticMarkup(React.createElement(panel, { classId: "c", students: [{ id: "s", name: "Alex" }], initialPhase: "results" }));
  assert.match(resultsHtml, /Loading session history/);
  assert.doesNotMatch(resultsHtml, /Prepare a new session/);
  assert.doesNotMatch(html, /Start assessment/);
  assert.match(renderToStaticMarkup(React.createElement(panel, {})), /Choose a class/);
});

test("teacher report retains neutral missing samples and individual report has semantic tables", () => {
  const report = buildLiteracyMockReport({ session: { mock: { item_count: 43 } }, members: [{ student_id: "s", run: null }] }, { students: [{ id: "s", name: "Alex" }] });
  const classHtml = renderToStaticMarkup(React.createElement(reportComponent, { report }));
  assert.match(classHtml, /What to practise next/);
  assert.match(classHtml, /Alex: no independent sample/);
  assert.doesNotMatch(classHtml, /Secure<|Needs support</);
  const pupilHtml = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: "s" }));
  assert.match(pupilHtml, /role="region" aria-label="Alex: four literacy areas" tabindex="0"/);
  assert.match(pupilHtml, /All 47 skills and next steps/);
  assert.match(pupilHtml, /Questions not reached/);
  assert.match(pupilHtml, /No recorded question in this sitting — no result/);
  assert.doesNotMatch(pupilHtml, /All 43 questions answered/);
  assert.doesNotMatch(pupilHtml, /NaN|undefined/);
});

test('adaptive class review uses the sampled demand across all eight areas instead of the source level', async () => {
  const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10' });
  const domains = ['sound_awareness','phonics','print','vocabulary','listening','language','reading','writing'];
  const pools = domains.map(domain => {
    const pool = bank.filter(item => item.domainId === domain && item.adaptiveAreaBand === 0 && item.format === 'choice'
      && item.mediaReady !== false && item.adaptiveMixedEligible === true && !item.tutorialOnly && isLiteracyItemEligible(item));
    assert.ok(pool.length, `First-step question required for ${domain}`);
    return pool.sort((left,right) => Number(right.level === 2) - Number(left.level === 2));
  });
  const items = allocateIndependentItems(pools);
  assert.ok(items.some(item => item.level === 2), 'The regression must include a source level that differs from adaptive demand');
  const responses = items.map(item => ({ questionId:item.id, skillId:item.skillId, domainId:item.domainId,
    level:item.level, itemSnapshot:item, responseStatus:'answered', selected:item.choices.find(choice => choice.id !== item.answer).id,
    isCorrect:false, evidenceType:'independent', supportUsed:false, knownFamiliar:false, serverReceivedAt:new Date().toISOString() }));
  const report = buildLiteracyMockReport({ session:{ id:'adaptive-review',content_version:'literacy-mock-v10',mock:{item_count:67,window_mode:'untimed'} },
    members:[{student_id:'s',run:{contentVersion:'literacy-mock-v10',status:'completed',plan:{itemIds:items.map(item => item.id)},responses}}] },
  {students:[{id:'s',name:'Alex'}]});
  assert.deepEqual(new Set(report.reviewCandidates.map(group => group.domainId)),new Set(domains));
  const html = renderToStaticMarkup(React.createElement(reportComponent,{report}));
  const summaries = [...html.matchAll(/<summary>([^<]*?)<span>/g)].map(match => match[1]);
  assert.equal(summaries.length,8);
  assert.ok(summaries.every(text => text.includes('First steps') && !text.includes('Level ')),summaries.join('\n'));
  assert.doesNotMatch(html,/on this skill at level/);
  assert.match(html,/same task demand and access conditions/);
});

test('all 43 answers across 15 skills are complete, while 32 catalogue skills remain separate', () => {
  const responses = LITERACY_MOCK_REPORT_SKILLS.slice(0, 15).flatMap((skill, index) =>
    Array.from({ length: index === 14 ? 1 : 3 }, (_, repeat) => ({
      questionId: `${skill.id}-${repeat}`, skillId: skill.id, domainId: skill.domainId, level: 1,
      responseStatus: 'answered', isCorrect: true, evidenceType: 'independent', supportUsed: false,
      serverReceivedAt: '2026-10-14T02:00:00Z',
      itemSnapshot: { prompt: `Example ${skill.id}-${repeat}` },
    })));
  const report = buildLiteracyMockReport({ session: { mock: { item_count: 43 } }, members: [{ student_id: 's', run: {
    plan: { itemIds: responses.map(response => response.questionId) }, responses,
  } }] }, { students: [{ id: 's', name: 'Alex' }], now: '2026-10-14T03:00:00Z' });
  assert.equal(report.pupils[0].answered, 43);
  assert.equal(report.pupils[0].notOfferedSkills, 32);
  const html = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: 's' }));
  assert.match(html, /All 43 questions answered\./);
  assert.match(html, /Skills shown in this sitting<\/dt><dd>15<\/dd>/);
  assert.match(html, /32 of 47 catalogue skills/);
  assert.match(html, /not a completion target for one sitting/);
  assert.doesNotMatch(html, /Skills with no recorded offer| offered ·|Offered without an independent response/);
  const classHtml = renderToStaticMarkup(React.createElement(reportComponent, { report }));
  assert.match(classHtml, /Alex: 15 skills shown in this sitting/);
  assert.doesNotMatch(classHtml, /Collect a sample first|32 skills with no recorded offer/);
});

test('partial, skipped, historical and empty records never claim all questions answered', () => {
  const response = { questionId: 'q', skillId: 'rhyming', level: 1, responseStatus: 'answered',
    isCorrect: true, evidenceType: 'independent', supportUsed: false };
  for (const run of [
    { plan: { itemIds: ['q', 'next'] }, responses: [response], presentationTracking: true },
    { plan: { itemIds: ['q', 'skip'] }, responses: [response, { ...response, questionId: 'skip', responseStatus: 'skipped', isCorrect: null }] },
    { responses: [response] },
    { plan: { itemIds: [] }, responses: [] },
  ]) {
    const report = buildLiteracyMockReport({ members: [{ student_id: 's', run }] }, { students: [{ id: 's', name: 'Alex' }] });
    const html = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: 's' }));
    assert.doesNotMatch(html, /All \d+ questions answered/);
    assert.match(html, /Skills shown in this sitting/);
    if (!run.presentationTracking) assert.match(html, /Not recorded for this older session/);
  }
});

test('class receipt labels distinguish a full sitting from an early finish', () => {
  const response={questionId:'q',skillId:'rhyming',level:1,responseStatus:'answered',isCorrect:true,evidenceType:'independent'};
  for(const [ids,label] of [[['q'],'Full sitting received'],[['q','next'],'Partial sitting received']]) {
    const report=buildLiteracyMockReport({session:{mock:{item_count:ids.length}},members:[{student_id:'s',run:{status:'completed',plan:{itemIds:ids},responses:[response]}}]},{students:[{id:'s',name:'Alex'}]});
    const html=renderToStaticMarkup(React.createElement(reportComponent,{report}));
    assert.match(html,new RegExp(label));
    assert.doesNotMatch(html,/Finished \/ partial/);
  }
});

test("teacher media log is separate from answer evidence and does not imply failed literacy", () => {
  const report = buildLiteracyMockReport({ session: { mock: { item_count: 24 } }, members: [{ student_id: "s", run: {
    plan: { itemIds: Array.from({ length: 24 }, (_, index) => `q${index}`) }, responses: [],
    mediaFailures: [{ questionId: "failed", skillId: "rhyming", level: 1, itemSnapshot: { prompt: "Choose the two pictures that rhyme." }, failedMediaPaths: ["/audio/shared.mp3"], responseStatus: "media_failed", isCorrect: null }]
  } }] }, { students: [{ id: "s", name: "Alex" }] });
  const html = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: "s" }));
  assert.match(html, /Media availability log \(1\)/);
  assert.match(html, /Question-by-question evidence \(0\)/);
  assert.match(html, /These events did not use an answer slot or create a skill result/);
  assert.match(html, /No independent errors recorded/);
  assert.doesNotMatch(html, /\/audio\/shared\.mp3/);
});

test('a withdrawn spelling response shows its original key without diagnosing a learner error', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const itemSnapshot = bank.find(item => item.id === 'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.heard-print.fur');
  const selected = itemSnapshot.choices.find(choice => choice.id !== itemSnapshot.answer).id;
  const report = buildLiteracyMockReport({ session: { id: 'current' }, members: [{ student_id: 's', run: { responses: [{
    questionId: itemSnapshot.id, skillId: itemSnapshot.skillId, domainId: itemSnapshot.domainId, level: itemSnapshot.level,
    itemSnapshot, selected, isCorrect: false, responseStatus: 'answered', evidenceType: 'independent', supportUsed: false,
    serverReceivedAt: '2026-10-13T02:00:00Z',
  }] } }] }, { students: [{ id: 's', name: 'Alex' }], now: '2026-10-13T03:00:00Z' });
  const html = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: 's' }));
  assert.match(html, /Question withdrawn — unscored/);
  assert.match(html, /Original key:/);
  assert.match(html, /both fur and fir/);
  assert.match(html, /does not count as a success or an error/);
  assert.match(html, /No independent errors recorded/);
  assert.doesNotMatch(html, /Why this answer:|What the selected alternative may indicate:|<strong>Expected:<\/strong>/);
});

test("a sparse error appears only in an unselected review list with its exact access conditions", () => {
  const report = buildLiteracyMockReport({ members: [{ student_id: "s", run: { plan: { itemIds: ["q"] }, responses: [{
    questionId: "q", skillId: "key_details", level: 1, responseStatus: "answered", isCorrect: false, evidenceType: "independent", supportUsed: false,
    serverReceivedAt: new Date().toISOString(), itemSnapshot: { prompt: "Choose.", passage: "Text", passageAccess: "text_and_audio", constructClaim: "key_details" }
  }] } }] }, { students: [{ id: "s", name: "Alex" }] });
  const html = renderToStaticMarkup(React.createElement(reportComponent, { report }));
  assert.equal(report.groups.length, 0);
  assert.match(html, /0 selected for teacher review/);
  assert.match(html, /Text and audio/);
  assert.match(html, /Not enough comparable evidence for a teaching-group suggestion/);
  assert.doesNotMatch(html, /checked=""/);
});

test('teacher report distinguishes the latest sufficient sample from older pooled errors and names administration', () => {
  const minimum = REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems;
  const makeResponse = (id, isCorrect, date) => ({ questionId: id, skillId: 'key_details', domainId: 'reading', level: 1,
    responseStatus: 'answered', evidenceType: 'independent', isCorrect, supportUsed: false, serverReceivedAt: date,
    itemSnapshot: { prompt: 'Choose.', passage: `Distinct passage ${id}.`, constructClaim: 'key_details', modality: 'reading' } });
  const report = buildLiteracyMockReport({ session: { id: 'current', mock: { window_mode: 'timed_sample', duration_seconds: 600 } },
    members: [{ student_id: 's', run: { timeExtensionCount: 1, responses: Array.from({ length: minimum }, (_, i) => makeResponse(`new-${i}`, true, '2026-10-10T02:00:00Z')) },
      priorRuns: [{ assignmentId: 'old', windowMode: 'timed_sample', durationSeconds: 600, timeExtensionCount: 1,
        responses: Array.from({ length: minimum }, (_, i) => makeResponse(`old-${i}`, false, '2026-09-01T02:00:00Z')) }] }] },
  { students: [{ id: 's', name: 'Alex' }], now: '2026-10-10T03:00:00Z' });
  const html = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: 's' }));
  assert.match(html, new RegExp(`All dated observations: ${minimum} correct · ${minimum} to revisit · ${minimum * 2} independent responses`));
  assert.match(html, new RegExp(`Latest comparable sample: ${minimum} correct · 0 to revisit · ${minimum} responses`));
  assert.match(html, /Timed sample · 10-minute initial limit · 1 time extension recorded/);
  assert.match(html, /This latest sample does not suggest a teaching group/);
  assert.doesNotMatch(html, /Enough current comparable evidence to consider a teaching group|Secure<|Needs support</);
});

test('the teacher report reveals spoken choices without relabelling a silent reading passage as listening', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const itemSnapshot = bank.find(item => item.id === 'mock.depth.context_clues.bank');
  const report = buildLiteracyMockReport({ session: { id: 'current' }, members: [{ student_id: 's', run: { responses: [{
    questionId: itemSnapshot.id, skillId: itemSnapshot.skillId, level: itemSnapshot.level, itemSnapshot,
    selected: 'c2', isCorrect: false, responseStatus: 'answered', evidenceType: 'independent',
    audioDelivery: Object.fromEntries(itemSnapshot.requiredAudioPaths.map(path => [path, 'completed'])),
    serverReceivedAt: '2026-10-10T02:00:00Z',
  }] } }] }, { students: [{ id: 's', name: 'Alex' }], now: '2026-10-10T03:00:00Z' });
  const html = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: 's' }));
  assert.match(html, /Printed text · Required choice narration completed · No answer assistance recorded/);
  assert.match(html, /Independent first response/);
  assert.doesNotMatch(html, /Construct: definition_clue · Audio/);
});
