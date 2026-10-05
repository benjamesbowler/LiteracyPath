import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLine } from '../../src/utils/sentenceExpressLevels.js';
import { buildSentenceExpressRounds, commitSentenceExpressChoice, commitSentenceExpressSend, commitSentenceExpressDeparture,
  newSentenceExpressAssembly, newSentenceExpressEvidence, sentenceExpressDecision, validSentenceExpressEvidence } from '../../src/components/learn/games/games/sentenceExpressLearning.js';

const fixture = (difficulty = 'easy') => buildSentenceExpressRounds(buildLine(difficulty, 3), difficulty, 3, 0);
function build(round, chooseRepeatedFirst = false) {
  let assembly = newSentenceExpressAssembly(), evidence = newSentenceExpressEvidence(), time = 1;
  while (sentenceExpressDecision(round, assembly).task !== 'send') {
    const decision = sentenceExpressDecision(round, assembly);
    const matches = decision.task === 'couple' ? decision.choices.filter(id => round.train.words[id] === decision.expected) : [decision.expected];
    const selected = chooseRepeatedFirst ? matches.at(-1) : matches[0];
    const result = commitSentenceExpressChoice(evidence, round, assembly, selected, { responseAt: time++ });
    assert.equal(result.correct, true); assembly = result.assembly; evidence = result.evidence;
  }
  return { assembly, evidence };
}

test('Express retains all ninety original trains, every repeated word instance and actual sequential recorded-word paths', () => {
  let count = 0, wordSlots = 0;
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const rounds = fixture(difficulty); assert.equal(rounds.length, 30); count += rounds.length;
    assert.deepEqual(rounds, fixture(difficulty));
    for (const round of rounds) {
      assert.deepEqual(round.readback.map(row => row.word), round.train.words);
      for (const row of round.readback) assert.ok(row.source, row.word);
      wordSlots += round.readback.length;
      assert.equal(round.printedModel, `${round.train.words.join(' ')}${round.train.endMark}`);
    }
  }
  assert.equal(count, 90); assert.equal(wordSlots, 494);
});

test('Express repeated-word carriages remain interchangeable physical instances without disappearing or duplicating', () => {
  const rounds = fixture('hard'), round = rounds.find(row => row.train.words.filter(word => word === 'ran').length === 2);
  const { evidence, assembly } = build(round, true);
  assert.equal(assembly.coupled.length, round.train.words.length);
  assert.equal(new Set(assembly.coupled).size, round.train.words.length);
  assert.deepEqual(assembly.coupled.map(id => round.train.words[id]), round.train.words);
  assert.equal(validSentenceExpressEvidence(evidence, rounds), true);
  for (const row of evidence.firstResponses) {
    assert.equal(row.modelUsed, true); assert.equal(row.independentSentencePractice, false);
    assert.ok(row.supportReasons.includes('printed-sentence-model-visible'));
  }
});

test('Express actual wrong choice retains its first attempt; fully coupled train still requires one explicit Send', () => {
  const rounds = fixture('hard'), round = rounds.find(row => row.train.engine);
  let assembly = newSentenceExpressAssembly(), evidence = newSentenceExpressEvidence();
  const wrong = commitSentenceExpressChoice(evidence, round, assembly, round.train.engine.options.find(option => option !== round.train.engine.correct), { responseAt: 1 });
  const first = structuredClone(wrong.evidence.firstResponses);
  assert.equal(wrong.correct, false); assert.deepEqual(wrong.assembly, assembly);
  const retry = commitSentenceExpressChoice(wrong.evidence, round, assembly, round.train.engine.correct, { responseAt: 2 });
  assert.equal(retry.first, false); assert.deepEqual(retry.evidence.firstResponses, first);
  assert.equal(commitSentenceExpressSend(retry.evidence, round, retry.assembly, 3), null);
  assembly = retry.assembly; evidence = retry.evidence;
  while (sentenceExpressDecision(round, assembly).task !== 'send') {
    const decision = sentenceExpressDecision(round, assembly), selected = decision.task === 'couple'
      ? decision.choices.find(id => round.train.words[id] === decision.expected) : decision.expected;
    const result = commitSentenceExpressChoice(evidence, round, assembly, selected, { responseAt: 10 });
    assembly = result.assembly; evidence = result.evidence;
  }
  assert.deepEqual(evidence.sends, []);
  assert.equal(commitSentenceExpressDeparture(evidence, round, { readback: [], travelComplete: true }), null);
  const sent = commitSentenceExpressSend(evidence, round, assembly, 100);
  assert.equal(sent.response.explicitSend, true);
  assert.equal(commitSentenceExpressSend(sent.evidence, round, assembly, 101), null);
  assert.equal(validSentenceExpressEvidence(sent.evidence, rounds), true);
});

test('Express readback errors settle travel truthfully and never create an ended receipt or a second departure stamp', () => {
  const rounds = fixture(), round = rounds[0], completed = build(round);
  const sent = commitSentenceExpressSend(completed.evidence, round, completed.assembly, 100);
  const receipts = round.readback.map(row => ({ ...row, status: 'delivered', endedAt: 110 + row.slot }));
  assert.equal(commitSentenceExpressDeparture(sent.evidence, round, { readback: receipts, travelComplete: false, completedAt: 130 }), null);
  const unavailable = structuredClone(receipts); unavailable[1].status = 'timeout'; unavailable[1].endedAt = null;
  const settled = commitSentenceExpressDeparture(sent.evidence, round, { readback: unavailable, travelComplete: true, completedAt: 130 });
  assert.equal(settled.departures[0].audioComplete, false); assert.equal(validSentenceExpressEvidence(settled, rounds), true);
  unavailable[1].status = 'delivered'; assert.equal(settled.departures[0].readback[1].status, 'timeout', 'The retained observation is an immutable snapshot');
  assert.equal(commitSentenceExpressDeparture(settled, round, { readback: receipts, travelComplete: true, completedAt: 140 }), null);
  const forged = structuredClone(settled); forged.departures[0].readback[1].endedAt = 125;
  assert.equal(validSentenceExpressEvidence(forged, rounds), false);
  const future = structuredClone(receipts); future[0].endedAt = 131;
  assert.equal(commitSentenceExpressDeparture(sent.evidence, round, { readback: future, travelComplete: true, completedAt: 130 }), null);
});

test('Express real catch-up Send and readback remain playable without a second original completion', () => {
  const rounds = fixture('hard'), round = rounds.find(row => row.train.words.filter(word => word === 'ran').length === 2);
  const completed = build(round, true), sent = commitSentenceExpressSend(completed.evidence, round, completed.assembly, 100);
  const originalReadback = round.readback.map(row => ({...row,status:'delivered',endedAt:110+row.slot}));
  let evidence = commitSentenceExpressDeparture(sent.evidence,round,{readback:originalReadback,travelComplete:true,completedAt:130});
  const immutable=structuredClone({first:evidence.firstResponses,accepted:evidence.acceptedResponses,sends:evidence.sends,departures:evidence.departures});
  let assembly=newSentenceExpressAssembly(),responseAt=200;
  while(sentenceExpressDecision(round,assembly).task!=='send') {
    const decision=sentenceExpressDecision(round,assembly),selected=decision.task==='couple'
      ? decision.choices.find(id=>round.train.words[id]===decision.expected):decision.expected;
    const result=commitSentenceExpressChoice(evidence,round,assembly,selected,{responseAt:responseAt++,visitIndex:1,supportReasons:['catch-up-rehearsal']});
    assert.equal(result.first,false);evidence=result.evidence;assembly=result.assembly;
  }
  const repeated=commitSentenceExpressSend(evidence,round,assembly,300,1);
  assert.equal(repeated.rehearsal,true);assert.equal(repeated.response.explicitSend,true);
  assert.equal(commitSentenceExpressSend(repeated.evidence,round,assembly,301,1),null,'one input cannot send the same visit twice');
  const readback=round.readback.map(row=>({...row,status:'delivered',endedAt:310+row.slot}));
  const settled=commitSentenceExpressDeparture(repeated.evidence,round,{readback,travelComplete:true,completedAt:330,visitIndex:1});
  assert.deepEqual({first:settled.firstResponses,accepted:settled.acceptedResponses,sends:settled.sends,departures:settled.departures},immutable);
  assert.equal(settled.rehearsalSends.length,1);assert.equal(settled.rehearsalDepartures.length,1);
  assert.ok(settled.assistedRetries.every(row=>row.supportReasons.includes('catch-up-rehearsal')));
  assert.equal(validSentenceExpressEvidence(settled,rounds),true);
  const premature=commitSentenceExpressSend(sent.evidence,round,assembly,120,1);
  assert.equal(premature,null,'rehearsal requires the previous real journey to finish');
  const forged=structuredClone(settled);forged.rehearsalDepartures[0].readback[0].endedAt=299;
  assert.equal(validSentenceExpressEvidence(forged,rounds),false,'an older original clip cannot stand in for rehearsal delivery');
});
