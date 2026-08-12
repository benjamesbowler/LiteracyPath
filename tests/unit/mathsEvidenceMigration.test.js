import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const evidenceMigration = fs.readFileSync(
  new URL(
    "../../supabase/migrations/20260812100000_maths_evidence_boundary.sql",
    import.meta.url
  ),
  "utf8"
);
const securityBoundary = fs.readFileSync(
  new URL(
    "../../supabase/migrations/20260812101000_security_definer_boundary.sql",
    import.meta.url
  ),
  "utf8"
);
const readVolatilityMigration = fs.readFileSync(
  new URL(
    "../../supabase/migrations/20260812102000_maths_evidence_read_volatility.sql",
    import.meta.url
  ),
  "utf8"
);

function functionBody(source, name) {
  const marker = `create function public.${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing ${name}`);
  const next = source.indexOf("\ncreate function public.", start + marker.length);
  return source.slice(start, next === -1 ? source.length : next);
}

test("Maths evidence is an append-only RPC boundary without browser table grants", () => {
  assert.match(evidenceMigration, /create table public\.maths_evidence_events/i);
  assert.match(
    evidenceMigration,
    /unique \(student_id, client_event_id\)/i
  );
  assert.match(
    evidenceMigration,
    /alter table public\.maths_evidence_events enable row level security/i
  );
  assert.match(
    evidenceMigration,
    /revoke all on table public\.maths_evidence_events[\s\S]*?from public, anon, authenticated/i
  );
  assert.doesNotMatch(
    evidenceMigration,
    /grant\s+(?:select|insert|update|delete|all)[\s\S]*?maths_evidence_events/i
  );
  assert.match(evidenceMigration, /evidence_purpose = 'formative_not_mastery'/i);
  assert.doesNotMatch(evidenceMigration, /\b(?:insert|update)\s+(?:into\s+)?public\.(?:mastery|item_mastery)\b/i);
  assert.doesNotMatch(evidenceMigration, /child_(?:audio|image)|voice_recording|image_upload/i);
});

test("child evidence derives identity from a current token and rejects teacher observations", () => {
  const body = functionBody(evidenceMigration, "student_record_maths_evidence");
  assert.match(body, /v_student := public\.student_from_token\(p_token\)/i);
  assert.match(body, /v_student\.archived_at is not null/i);
  assert.match(body, /coalesce\(p_event_type, ''\) not in \(\s*'practice_attempt',\s*'skills_check_response'/i);
  assert.match(body, /v_student\.teacher_id,\s*v_student\.class_id,\s*v_student\.id/i);
  assert.match(body, /on conflict \(student_id, client_event_id\) do nothing/i);
  assert.match(body, /client_event_id_conflict/i);
  assert.doesNotMatch(body, /auth\.uid\(\)/i);
});

test("teacher evidence reads and writes are class-owner scoped", () => {
  const write = functionBody(evidenceMigration, "teacher_record_maths_evidence");
  const read = functionBody(evidenceMigration, "teacher_read_maths_evidence");
  for (const body of [write, read]) {
    assert.match(body, /perform public\.assert_current_actor_teacher_access\(\)/i);
    assert.match(body, /auth\.uid\(\)/i);
  }
  assert.match(write, /student\.class_id = p_class_id/i);
  assert.match(write, /student\.teacher_id = auth\.uid\(\)/i);
  assert.match(write, /learner_not_in_owned_class/i);
  assert.match(write, /client_event_id_conflict/i);
  assert.match(read, /class\.id = p_class_id and class\.teacher_id = auth\.uid\(\)/i);
  assert.match(read, /event\.teacher_id = auth\.uid\(\)/i);
  assert.match(read, /event\.class_id = p_class_id/i);
});

test("learner export and verified deletion include Maths evidence", () => {
  const exportBody = functionBody(evidenceMigration, "teacher_export_learner_data");
  const deleteBody = functionBody(evidenceMigration, "teacher_complete_learner_deletion");
  assert.match(exportBody, /'mathsEvidence'/i);
  assert.match(exportBody, /where event\.student_id = p_student_id/i);
  assert.match(deleteBody, /'maths_evidence_queue'/i);
  assert.match(deleteBody, /teacher_complete_learner_deletion_without_maths/i);
});

test("the final function boundary exposes only the intended Maths RPC roles", () => {
  assert.match(
    securityBoundary,
    /grant execute on function public\.student_record_maths_evidence\([\s\S]*?\) to anon, authenticated/i
  );
  assert.match(
    securityBoundary,
    /grant execute on function public\.teacher_record_maths_evidence\([\s\S]*?\) to authenticated/i
  );
  assert.match(
    securityBoundary,
    /grant execute on function public\.teacher_read_maths_evidence\(uuid, uuid, integer\)\s+to authenticated/i
  );
  assert.match(securityBoundary, /'teacher_read_maths_evidence\(uuid,uuid,integer\)'/i);
  assert.match(
    securityBoundary,
    /'teacher_record_maths_evidence\(uuid,uuid,text,text,text,jsonb,timestamp with time zone,text\)'/i
  );
  assert.match(securityBoundary, /notify pgrst, 'reload schema'/i);
  assert.match(
    readVolatilityMigration,
    /alter function public\.teacher_read_maths_evidence\(uuid, uuid, integer\)\s+volatile/i
  );
});
