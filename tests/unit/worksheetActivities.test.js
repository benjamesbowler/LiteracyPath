import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makePictureCrossword } from '../../src/utils/worksheets/pictureCrossword.js';
import { WORKSHEET_CHARACTER_ART } from '../../src/utils/worksheets/worksheetCharacterArt.js';
import { availableWorksheetTypes, buildWorksheetDocument, buildWorksheetPreviewDocument, buildWorksheetAnswerKeyDocument, worksheetAnswerRecords, getWorksheetCycle, worksheetCycleOptions } from '../../src/utils/worksheets/worksheetBuilder.js';

const cycles = worksheetCycleOptions().map(option => getWorksheetCycle(option.id));

test('every pictured crossword has connected, matching numbered clue answers', () => {
  let checked = 0;
  for (const cycle of cycles) {
    if (!availableWorksheetTypes(cycle).includes('crossword')) continue;
    const { html } = buildWorksheetDocument({ cycleId: cycle.id, type: 'crossword', pages: 6 });
    const pages = [...html.matchAll(/<section class="page"[\s\S]*?<\/section>/g)].map(m => m[0]);
    for (const page of pages) {
      const cells = new Map([...page.matchAll(/class="ws-cross-cell" data-row="(\d+)" data-col="(\d+)" data-answer="([a-z])"/g)].map(m => [`${m[1]},${m[2]}`, m[3]]));
      const clues = [...page.matchAll(/class="ws-cross-clue" data-answer="([a-z]+)" data-direction="(across|down)" data-row="(\d+)" data-col="(\d+)"[^>]*><b>(\d+)/g)];
      assert.ok(clues.length >= 2 && clues.length <= 4);
      const uses = new Map();
      for (const [, word, direction, row, col, number] of clues) {
        assert.ok(Number(number) >= 1);
        assert.doesNotMatch(word, /oa|ee|oo|ai|ay/, 'an untaught vowel team cannot enter a beginner crossword');
        for (let i = 0; i < word.length; i += 1) {
          const key = `${Number(row) + (direction === 'down' ? i : 0)},${Number(col) + (direction === 'across' ? i : 0)}`;
          assert.equal(cells.get(key), word[i], `${cycle.id}: ${word} clue agrees with the solved grid`);
          uses.set(key, (uses.get(key) || 0) + 1);
        }
        assert.match(page, new RegExp(`alt="${word}"`));
      }
      assert.ok([...uses.values()].some(value => value === 2), 'a crossword must have a shared letter');
      assert.equal([...uses.values()].filter(value => value === 2).length, clues.length - 1, 'every added word connects once');
      checked += 1;
    }
  }
  assert.ok(checked > 100, 'the whole eligible catalogue is exercised');
});

test('crossword placement rejects parallel overlaps and produces consistent clue numbers', () => {
  const result = makePictureCrossword(['cat','cap','tap','map','mat','can']);
  assert.ok(result.placements.length >= 2);
  const starts = [...result.placements].sort((a,b) => a.row - b.row || a.col - b.col);
  assert.ok(starts.every((p,i) => !i || p.number >= starts[i-1].number));
  for (const p of result.placements) for (let i=0;i<p.word.length;i++) assert.equal(result.grid[p.row+(p.direction==='down'?i:0)][p.col+(p.direction==='across'?i:0)],p.word[i]);
  assert.deepEqual(makePictureCrossword([]), { grid: [], placements: [] });
});

test('colour by word uses all six final character assets and only taught sight words', () => {
  assert.equal(new Set(WORKSHEET_CHARACTER_ART.map(art => art.id)).size, 6);
  for (const art of WORKSHEET_CHARACTER_ART) assert.ok(fs.statSync(`public/images/worksheets/${art.id}-colouring.png`).size > 10000);
  for (const cycle of cycles) {
    const taught = new Set(cycles.filter(c => c.cycleNumber <= cycle.cycleNumber).flatMap(c => c.highFrequencyWords || []).map(w=>w.toLowerCase()));
    const { html } = buildWorksheetDocument({ cycleId:cycle.id, type:'characterColouring', pages:6 });
    for (const art of WORKSHEET_CHARACTER_ART) assert.match(html, new RegExp(`data-character="${art.id}"`));
    const labels = [...html.matchAll(/data-region="(\d+)" data-answer="([^"]+)"/g)];
    assert.equal(labels.length,48);
    for (const [, , code] of labels) {
      const [word,colour] = code.split(':');
      assert.ok(taught.has(word.toLowerCase()), `${cycle.id}: ${word} is taught`);
      assert.ok(['blue','green','yellow'].includes(colour));
    }
    assert.match(html,/Leave unlabelled parts white/);
  }
});

test('preview shows the selected physical child page with identical task content', () => {
  const recipe = { cycleId:'cycle-10',type:'crossword',pages:6 };
  const full = buildWorksheetDocument(recipe);
  for(let index=0;index<6;index++){
    const preview = buildWorksheetPreviewDocument(recipe,index);
    const section = [...full.html.matchAll(/<section class="page"[\s\S]*?<\/section>/g)][index][0];
    assert.ok(preview.html.includes(section));
    assert.equal((preview.html.match(/data-worksheet-page=/g)||[]).length,1);
    assert.equal(preview.pageIndex,index);
  }
  assert.equal(buildWorksheetPreviewDocument(recipe,99).pageIndex,5);
  assert.equal(buildWorksheetDocument({...recipe,pages:2.9}).pageCount,2);
});

test('teacher answers stay separate and distinguish open writing from exact answers', () => {
  for (const type of ['characterColouring','crossword','wordTracing','writingPractice','sentenceBuilder','sightWords']) {
    const recipe={cycleId:'cycle-10',type,pages:6};
    const child=buildWorksheetDocument(recipe);
    const key=buildWorksheetAnswerKeyDocument(recipe);
    assert.doesNotMatch(child.html,/data-answer-key-page=/);
    assert.equal((key.html.match(/data-answer-key-page=/g)||[]).length,6);
    const records=worksheetAnswerRecords(recipe);
    assert.equal(records.length,6);
    assert.ok(records.every(r=>r.tasks.length>=2));
    assert.ok(records.every(r=>r.tasks.every(t=>t.answers.length||t.review)));
    if(type==='crossword') assert.match(key.html,/\d+ (across|down): [a-z]+/);
    if(type==='writingPractice') assert.ok(records.every(r=>r.tasks.every(t=>!t.answers.length&&t.review.includes('Responses vary'))));
    if(type==='sentenceBuilder') assert.ok(records[4].tasks.every(t=>!t.answers.length));
  }
});

test('print typography is embedded and has no network font dependency', () => {
  const {html}=buildWorksheetDocument({cycleId:'cycle-1',type:'wordTracing',pages:1});
  assert.match(html,/data:font\/woff2;base64,/);
  assert.match(html,/font-size: 14pt/);
  assert.doesNotMatch(html,/<link|fonts\.google|fonts\.gstatic/);
});


test('a chosen Guide survives the saved type recipe and starts the pack', () => {
  for (const art of WORKSHEET_CHARACTER_ART) {
    const recipe = {cycleId:'cycle-10',type:`characterColouring:${art.id}`,pages:6};
    const full=buildWorksheetDocument(recipe);
    assert.ok(full.title.endsWith(art.name));
    const preview=buildWorksheetPreviewDocument(recipe,0);
    assert.match(preview.html,new RegExp(`data-character="${art.id}"`));
    assert.equal(new Set([...full.html.matchAll(/data-character="([^"]+)"/g)].map(m=>m[1])).size,6);
    assert.match(buildWorksheetAnswerKeyDocument(recipe).html,new RegExp(art.name));
  }
  assert.throws(()=>buildWorksheetDocument({cycleId:'cycle-10',type:'characterColouring:unknown',pages:1}),/Unknown worksheet character/);
  assert.throws(()=>buildWorksheetDocument({cycleId:'cycle-10',type:'wordSearch:fluff',pages:1}),/Unknown worksheet character/);
});

test('independent spelling pages keep the answers out of the visible child text', () => {
  for (const type of ['wordBuilding', 'pictureMatching']) {
    const recipe={cycleId:'cycle-10',type,pages:6};
    const html=buildWorksheetPreviewDocument(recipe,5).html;
    const visible=html.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<[^>]*>/g,' ');
    const spelling=[...html.matchAll(/class="ws-build-row" data-answer="([a-z]+)"/g)].map(m=>m[1]);
    assert.ok(spelling.length);
    for(const word of spelling) assert.doesNotMatch(visible,new RegExp(`\\b${word}\\b`));
  }
});

test('letter-pair tracing prints the spelling without curriculum labels or slashes', () => {
  for (const [cycleId, spelling] of [['cycle-9','qu'], ['cycle-22','nk'], ['cycle-23','ng']]) {
    const {html}=buildWorksheetDocument({cycleId,type:'letterFormation',pages:6});
    const models=[...html.matchAll(/class="ws-trace ws-school-model">([^<]+)</g)].map(m=>m[1]);
    assert.ok(models.includes(spelling));
    assert.ok(models.every(model=>/^[a-z]+$/i.test(model)));
  }
});

test('sentence models and teacher answers demonstrate capital letters at the start', () => {
  for (const cycle of cycles) {
    const recipe={cycleId:cycle.id,type:'sentenceBuilder',pages:6};
    for (const record of worksheetAnswerRecords(recipe)) {
      for (const task of record.tasks) {
        for (const answer of task.answers) assert.match(answer, /^["“]?[A-Z]/, `${cycle.id}: ${answer}`);
      }
    }
    const {html}=buildWorksheetDocument(recipe);
    assert.doesNotMatch(html, /class="ws-sentence-model">(?:<b>)?(?:he|she|this|they|each|look|put|what|when|who|does|which|why)\b/);
  }
});
