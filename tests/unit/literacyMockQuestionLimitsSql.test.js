import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureV10 } from '../helpers/literacyMockV10Database.js';
import { query, teacher, other, classId, studentId } from '../helpers/literacyMockDatabase.js';
import { literacyMockQuestionLimitsSql, MOCK_QUESTION_LIMIT_MIGRATION } from '../../tools/generateLiteracyMockQuestionLimits.mjs';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan, sameLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockBoundaryState } from '../../src/policy/literacyMockBoundaryPolicy.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { literacyMockWorkingSummary } from '../../src/utils/literacyMockWorkingSummary.js';

const migration = name => fs.readFileSync(new URL(`../../supabase/migrations/${name}`,import.meta.url),'utf8');
const prepare = (db,count,key) => query(db,'select teacher_prepare_literacy_mock_session_v12($1,$2,false,40,$3,$4,\'untimed\') value',[classId,[studentId],count,key]);
const save = (db,id,key,revision,plan,response=null,token='synthetic-token') => query(db,'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value',[token,id,key,revision,plan,response]);

test('V12 finite question limits preserve canonical adaptation, ownership, immutable history and uncertain stopping evidence',async()=>{
  const db=await fixtureV10({catalogue:true});
  try {
    for(const name of ['20261020030000_literacy_mock_progression_v11.sql','20261016202515_literacy_mock_v10_quality_lookup.sql',
      '20261020030001_literacy_mock_catalogue_v11.sql','20261028040000_literacy_mock_beginner_vocabulary.sql',
      '20261028040100_literacy_mock_beginner_v12.sql','20261028040101_literacy_mock_catalogue_v12.sql']) await db.exec(migration(name));
    const digest=async()=> (await db.query("select content_version,count(*)::integer item_count,md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate \"C\")) digest from literacy_mock_items group by content_version order by content_version")).rows;
    const before=await digest(),sql=literacyMockQuestionLimitsSql();
    assert.equal(sql,migration(MOCK_QUESTION_LIMIT_MIGRATION));
    await db.exec(sql);assert.deepEqual(await digest(),before,'Every immutable V1–V12 publication remains byte-identical');
    const grants=(await db.query("select has_function_privilege('anon','public.lp_mock_session_boundary_schedule(uuid,jsonb,jsonb,text)','execute') child,has_function_privilege('authenticated','public.lp_mock_session_boundary_schedule(uuid,jsonb,jsonb,text)','execute') teacher")).rows[0];
    assert.deepEqual(grants,{child:false,teacher:false});
    await db.exec(`set fixture.actor='${other}'`);
    assert.equal((await prepare(db,15,'foreign')).ok,false);
    await db.exec(`set fixture.actor='${teacher}'`);
    for(const count of [null,0,14,16,24,26,41,125]) assert.equal((await prepare(db,count,`invalid-${count}`)).error,'invalid_mock_options');

    const bank=await loadLiteracyMockBank({contentVersion:'literacy-mock-v12'}),byId=new Map(bank.map(item=>[item.id,item]));
    // Isolate each pattern's learner-history ledger while exercising every real
    // client/RPC route. The rows below exist only in this in-memory database.
    for(const count of [15,25,40]) for(const pattern of ['correct','incorrect']) {
      await db.query('delete from literacy_mock_runs where student_id=$1',[studentId]);
      await db.query('delete from literacy_mock_events where student_id=$1',[studentId]);
      const key=`finite-${count}-${pattern}`,prepared=await prepare(db,count,key);
      assert.equal(prepared.ok,true,prepared.error);assert.equal(prepared.session.mock.item_count,count);
      const id=prepared.session.id;
      const duplicate=await prepare(db,count,key);assert.equal(duplicate.duplicate,true);assert.equal(duplicate.session.id,id);
      const started=await query(db,'select teacher_control_literacy_mock_session($1,\'start\',0,\'start\') value',[id]);
      assert.equal(started.ok,true,`${key}: ${started.error}`);
      let plan=selectLiteracyMockPlan(bank,{sessionId:id,studentId,itemCount:count});
      let result=await save(db,id,'initial',0,plan);assert.equal(result.ok,true,result.error);
      assert.equal((await save(db,id,'bad-token',result.run.revision,plan,null,'invalid-token')).ok,false);
      const shortened={...plan,itemIds:plan.itemIds.slice(0,-1)};
      assert.equal((await save(db,id,'forged-stop',result.run.revision,shortened)).ok,false,'A client cannot arbitrarily shorten its sitting');
      const extra=bank.find(item=>item.adaptiveMixedEligible && !plan.itemIds.includes(item.id));
      assert.equal((await save(db,id,'forged-extension',result.run.revision,{...plan,itemIds:[...plan.itemIds,extra.id]})).ok,false,'A client cannot exceed the chosen sitting limit');
      const harder=bank.find(item=>item.domainId==='sound_awareness' && item.adaptiveAreaBand===1 && item.adaptiveMixedEligible);
      assert.equal((await save(db,id,'forged-jump',result.run.revision,{...plan,itemIds:[harder.id,...plan.itemIds.slice(1)]})).ok,false);
      let index=0;
      while(result.run.status!=='completed') {
        const item=byId.get(plan.itemIds[index]);
        const state=literacyMockBoundaryState(result.run.responses,{bank:byId})[item.domainId];
        assert.equal(item.adaptiveAreaBand,state.nextBand);assert.equal(state.complete,false);
        const presented=await query(db,'select student_record_literacy_mock_event(\'synthetic-token\',$1,$2,\'presented\',$3) value',[id,item.id,`shown-${index}`]);
        assert.equal(presented.ok,true,presented.error);
        const selected=pattern==='correct'?item.answer:item.choices.find(choice=>choice.id!==item.answer)?.id;
        if(pattern==='incorrect') assert.equal(item.format,'choice');
        const response={questionId:item.id,selected,responseStatus:'answered',knownFamiliar:false,supportUsed:false,
          audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path=>[path,'completed']))};
        result=await save(db,id,`answer-${index}`,result.run.revision,null,response);assert.equal(result.ok,true,`${key} answer ${index}: ${result.error}`);
        index++;
        if(result.run.status!=='completed') {
          const next=adaptLiteracyMockPlan(bank,plan,result.run.responses,[],result.run.presentations,{itemCount:count});
          if(!sameLiteracyMockPlan(plan,next)) {result=await save(db,id,`adapt-${index}`,result.run.revision,next);assert.equal(result.ok,true,`${key} adaptation ${index}: ${result.error}`);}
          plan=next;
        }
      }
      assert.equal(index,pattern==='correct'?count:Math.min(16,count));
      assert.equal(result.run.responses.length,index);
      const collected=await query(db,'select teacher_control_literacy_mock_session($1,\'collect\',$2,\'collect\') value',[id,result.mock.revision]);
      assert.equal(collected.ok,true,collected.error);
      const report=await query(db,'select teacher_get_literacy_mock_report($1) value',[id]);assert.equal(report.ok,true);
      const view=buildLiteracyMockReport(report,{students:[{id:studentId,name:'Synthetic learner'}]});
      const pupil=view.pupils.find(value=>value.studentId===studentId);assert.equal(pupil.maximumPlanned,count);
      const summary=literacyMockWorkingSummary(pupil);
      if(pattern==='correct') assert.ok(summary.boundaryAreas.every(area=>area.stopReason==='session_question_limit' && area.boundary===null));
      else if(count>=16) assert.ok(summary.boundaryAreas.every(area=>area.stopReason==='floor_confirmed'));
      else {
        assert.equal(summary.boundaryAreas.filter(area=>area.stopReason==='floor_confirmed').length,7);
        assert.equal(summary.boundaryAreas.filter(area=>area.stopReason==='session_question_limit' && area.boundary===null).length,1);
      }
    }
    // Original clients may still prepare and resume the complete 124-budget
    // sitting. The new options never rewrite that historical contract.
    assert.equal((await prepare(db,124,'historical-full')).ok,true);
  } finally { await db.close(); }
});
