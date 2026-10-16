import { fixture,read } from './literacyMockDatabase.js';
import { createLiteracyMockManifest } from '../../tools/generateLiteracyMockManifest.mjs';
const v4=await createLiteracyMockManifest({contentVersion:'literacy-mock-v4'});

export async function fixtureV8({upgrade=true}={}){
 const db=await fixture();
 await db.exec("alter table student_focus_sessions add constraint student_focus_sessions_expiry_check check(expires_at>started_at and expires_at<=started_at+interval '2 hours')");
 for(const name of ['20261010140000_literacy_mock_evidence_v3.sql','20261010150000_literacy_mock_followup_evidence.sql','20261012041604_literacy_mock_tutorial_lookup_index.sql','20261012083202_literacy_mock_adaptive_v4.sql','20261013053259_literacy_mock_content_quarantine.sql','20261014020000_literacy_mock_device_collection.sql'])await db.exec(read(name));
 await db.query("insert into literacy_mock_items(id,content_version,item)select q->>'id','literacy-mock-v4',q from jsonb_array_elements($1::jsonb)q",[v4.items]);
 await db.query("insert into literacy_mock_publications(content_version,item_count)values('literacy-mock-v4',$1)",[v4.itemCount]);
 for(const file of ['20261015052954_literacy_mock_areas_v5.sql','20261015053013_literacy_mock_catalogue_v5.sql','20261015054235_literacy_mock_delivery_projection.sql','20261015054802_literacy_mock_incremental_validation.sql','20261015060558_literacy_mock_picture_quarantine.sql','20261015105406_literacy_mock_demand_v6.sql','20261015105421_literacy_mock_catalogue_v6.sql','20261015111510_literacy_mock_comprehension_demand_v7.sql','20261015111525_literacy_mock_catalogue_v7.sql'])await db.exec(read(file));
 if(upgrade){await db.exec(read('20261016062452_literacy_mock_retake_v8.sql'));await db.exec(read('20261016062517_literacy_mock_catalogue_v8.sql'));}
 return db;
}
