import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adventureStationContinuation } from '../../src/policy/adventureContinuation.js';
import { preparedClassCode, preparedClassEntryUrl } from '../../src/policy/preparedClassEntry.js';
import { humanActivityDuration, studentSessionOperationalState, sessionCyclePracticeTitle } from '../../src/utils/cyclePracticeReporting.js';
const stations = ['letters','sound','trace','spell'].map(id => ({id})).concat([{id:'rhyme',optional:true},{id:'check'}]);
test('session title claims a shared cycle only when every learner assignment agrees', () => {
  const member = cycle => ({ resolved_config: { cycle_id: `cycle-${cycle}`, cycle_number: cycle, cycle_title: `Cycle ${cycle}` } });
  assert.equal(sessionCyclePracticeTitle([member(3), member(3)]), 'Cycle 3');
  assert.equal(sessionCyclePracticeTitle([member(3), member(6)]), 'Individual cycles');
  assert.equal(sessionCyclePracticeTitle([member(3), {}]), 'Individual cycles');
  assert.equal(sessionCyclePracticeTitle([member(27)]), 'Cycle 27: Word and sound review');
  assert.equal(sessionCyclePracticeTitle([]), 'Assignments loading');
});
test('session launch is bound to its original teacher and class and cleared on navigation', () => {
  const surface = readFileSync(new URL('../../src/components/AppSurface.jsx', import.meta.url), 'utf8');
  assert.match(surface, /studentSessionLaunchScope === studentSessionScope/);
  assert.match(surface, /if \(previousSessionScope !== studentSessionScope\) \{[\s\S]{0,350}setStudentSessionContext\(\{\}\)/);
  assert.match(surface, /setStudentSessionLaunchScope\(studentSessionScope\)/);
});
test('map continuation resumes the first unfinished main station and retains mixed quest gate', () => {
  assert.equal(adventureStationContinuation(stations).nextStation.id,'letters');
  assert.equal(adventureStationContinuation(stations,{stations:{letters:true}}).nextStation.id,'sound');
  assert.equal(adventureStationContinuation(stations,{stations:{letters:true,sound:true,trace:true}}).checkLocked,true);
  const result = adventureStationContinuation(stations,{stations:{letters:true,sound:true,trace:true,spell:true}});
  assert.equal(result.checkLocked,false);assert.equal(result.nextStation.id,'check');
  assert.equal(adventureStationContinuation(stations,{stars:2}).checkLocked,false);
});
test('prepared class entry carries only a validated roster code in a fragment', () => {
  assert.equal(preparedClassEntryUrl('https://literacy.guide/path','ABC123'),'https://literacy.guide/#class=ABC123');
  assert.equal(preparedClassCode('#class=ABC123'),'ABC123');
  for(const input of ['#class=','?class=ABC123','#class=invalid','#class=abc123','#token=ABC123']) assert.equal(preparedClassCode(input),'');
  assert.equal(preparedClassEntryUrl('https://literacy.guide','<script>'),'');
});
test('session status separates operational faults from incomplete learning checks', () => {
  assert.equal(studentSessionOperationalState({content_ok:false,status:'needs_attention',connected:true}),'Content unavailable');
  assert.equal(studentSessionOperationalState({status:'needs_attention',connected:false}),'Waiting for connection');
  assert.equal(studentSessionOperationalState({status:'needs_attention',connected:true}),'Check incomplete');
  assert.equal(studentSessionOperationalState({status:'completed',connected:false}),'Finished');
  assert.equal(studentSessionOperationalState({content_ok:true,connected:true,status:'needs_attention',cycle_practice_result:{mediaFailedCount:1}}),'Media unavailable');
  assert.equal(humanActivityDuration(1810),'30 min 10 sec');
  assert.equal(humanActivityDuration(null),'Not recorded');
});

test('prepared classroom entry takes precedence over remembered learner and teacher sessions', () => {
  const surface = readFileSync(new URL('../../src/components/AppSurface.jsx', import.meta.url), 'utf8');
  const controller = readFileSync(new URL('../../src/appState/useAppSessionController.js', import.meta.url), 'utf8');
  assert.match(controller, /preparedEntryRequested = useRef\(Boolean\(preparedClassCode\(window.location.hash\)\)\)/);
  assert.match(controller, /studentSession \|\| preparedEntryRequested.current/);
  assert.match(surface, /if \(sessionMode !== "student" && authMode !== "resetPassword" && entryMode === "student"\)/);
});
