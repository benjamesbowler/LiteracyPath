import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureV10} from '../helpers/literacyMockV10Database.js';
import {query,teacher,other,classId} from '../helpers/literacyMockDatabase.js';
import {literacyMockV11SchemaSql} from '../../tools/generateLiteracyMockV11.mjs';
import {literacyMockBoundaryState,literacyMockBoundarySchedule} from '../../src/policy/literacyMockBoundaryPolicy.js';
import {LITERACY_MOCK_AREA_ORDER,LITERACY_MOCK_AREA_MAX} from '../../src/policy/literacyMockAdaptivePolicy.js';
const row=(area,band,correct,index,flags={})=>({questionId:`v11-sql.${area}.${index}`,domainId:area,responseStatus:'answered',evidenceType:'independent',isCorrect:correct,
 itemSnapshot:{contentVersion:'literacy-mock-v11',domainId:area,adaptiveAreaBand:band,adaptiveAreaVersion:'areas-v6'},...flags});
test('V11 canonical SQL mirrors all-area hold/rise/descent/support histories and leaves V9 routing frozen',async()=>{
 const db=await fixtureV10();try{
  await db.exec(literacyMockV11SchemaSql());
  const cases=[[]];
  for(const area of LITERACY_MOCK_AREA_ORDER){
   const maximum=LITERACY_MOCK_AREA_MAX[area];
   cases.push([row(area,0,true,0)],[row(area,0,true,0),row(area,0,true,1)]);
   const right=[];for(let band=0;band<=maximum;band++)for(let i=0;i<(band===0?3:2);i++)right.push(row(area,band,true,right.length));cases.push(right);
   cases.push([row(area,0,true,0),row(area,0,true,1),row(area,0,true,2),row(area,1,false,3),row(area,1,false,4)]);
   cases.push([...cases.at(-1),row(area,0,true,5)]);
   cases.push([row(area,0,true,0),row(area,0,true,1),row(area,0,true,2,{supportUsed:true}),row(area,0,true,3)]);
   cases.push([row(area,1,true,0),row(area,1,false,1),row(area,1,true,2),row(area,1,false,3)]);
  }
  for(const [index,rows] of cases.entries()){
   const state=literacyMockBoundaryState(rows,{contentVersion:'literacy-mock-v11'});
   assert.deepEqual(await query(db,"select lp_mock_boundary_state_for_version($1,'literacy-mock-v11') value",[rows]),state,`state ${index}`);
   assert.deepEqual(await query(db,"select lp_mock_boundary_schedule_for_version($1,$2,'literacy-mock-v11') value",[rows,state]),literacyMockBoundarySchedule(rows,{contentVersion:'literacy-mock-v11'}),`schedule ${index}`);
  }
  const old=[row('vocabulary',0,true,0)];old[0].itemSnapshot.contentVersion='literacy-mock-v10';
  assert.equal((await query(db,"select lp_mock_boundary_state_for_version($1,'literacy-mock-v10') value",[old])).vocabulary.nextBand,1);
  assert.equal((await query(db,"select lp_mock_boundary_state_for_version($1,'literacy-mock-v11') value",[old])).vocabulary.nextBand,0);
  const rights=(await db.query("select has_function_privilege('anon','public.lp_mock_boundary_state_v11(jsonb)','execute') child,has_function_privilege('authenticated','public.lp_mock_boundary_state_v11(jsonb)','execute') teacher")).rows[0];
  assert.deepEqual(rights,{child:false,teacher:false});
  await db.exec(`set fixture.actor='${other}';`);
  const denied=await query(db,"select teacher_prepare_literacy_mock_session_v11($1,'{}',true,20,124,'v11-foreign','untimed') value",[classId]);assert.equal(denied.ok,false);
  await db.exec(`set fixture.actor='${teacher}';`);
  const unpublished=await query(db,"select teacher_prepare_literacy_mock_session_v11($1,'{}',true,20,124,'v11-unpublished','untimed') value",[classId]);assert.equal(unpublished.error,'mock_v11_unavailable');
 }finally{await db.close();}
});
