import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../../supabase/migrations/20260727120000_assessment_data_integrity_boundary.sql",
  import.meta.url
);

async function migrationSource() {
  return readFile(migrationUrl, "utf8");
}

function functionBlock(source, name, nextMarker) {
  const start = source.indexOf(`create or replace function public.${name}`);
  const end = source.indexOf(nextMarker, start);
  assert.ok(start >= 0, `${name} must exist`);
  assert.ok(end > start, `${name} must have a bounded source block`);
  return source.slice(start, end);
}

test("practice reset keeps profile, Guided Reading, and Story Quest records", async () => {
  const source = await migrationSource();
  const block = functionBlock(
    source,
    "teacher_reset_student_progress",
    "-- Credential changes and session revocation"
  );

  assert.match(
    block,
    /delete from public\.student_progress sp\s+where sp\.student_id = v_student\.id\s+and sp\.area not in \('profile', 'guided_reading', 'story_quests'\)/i
  );
  assert.match(block, /'learnerProfileRetained', true/);
  assert.match(block, /'guidedReadingRetained', true/);
  assert.match(block, /'storyQuestRetained', true/);
  assert.doesNotMatch(
    block,
    /delete from public\.student_progress sp\s+where sp\.student_id = v_student\.id\s*;/i,
    "a practice reset must never delete the accessibility/profile row"
  );
});

test("verified deletion redacts one learner from shared teacher evidence and deletes only singleton rows", async () => {
  const source = await migrationSource();
  const block = functionBlock(
    source,
    "perform_verified_learner_deletion",
    "create or replace function public.teacher_delete_learner_data_staged"
  );

  assert.match(
    block,
    /update public\.teacher_insight_observations io\s+set student_ids = array_remove\(io\.student_ids, v_student\.id\)\s+where v_student\.id = any\(io\.student_ids\)\s+and cardinality\(io\.student_ids\) > 1/i
  );
  assert.match(
    block,
    /update public\.teacher_instructional_group_reviews gr\s+set student_ids = array_remove\(gr\.student_ids, v_student\.id\)[\s\S]*?where v_student\.id = any\(gr\.student_ids\)\s+and cardinality\(gr\.student_ids\) > 1/i
  );
  assert.match(
    block,
    /delete from public\.teacher_insight_observations io\s+where v_student\.id = any\(io\.student_ids\)/i,
    "after multi-learner rows are redacted, only singleton rows can still contain the subject"
  );
  assert.match(
    block,
    /delete from public\.teacher_instructional_group_reviews gr\s+where v_student\.id = any\(gr\.student_ids\)/i
  );
  assert.match(block, /'teacherObservationsRedacted'/);
  assert.match(block, /'instructionalGroupReviewsRedacted'/);
  assert.match(
    block,
    /delete from public\.teacher_interventions ti\s+where v_student\.id = any\(ti\.student_ids\)\s+and cardinality\(ti\.student_ids\) = 1/i,
    "a singleton intervention must be deleted rather than retained as an empty plan"
  );
  assert.match(
    block,
    /set student_ids = array_remove\(ti\.student_ids, v_student\.id\),[\s\S]*?owner_label = public\.redact_learner_free_text[\s\S]*?group_label = public\.redact_learner_free_text[\s\S]*?focus = public\.redact_learner_free_text[\s\S]*?activity = public\.redact_learner_free_text[\s\S]*?outcome_note = public\.redact_learner_free_text/i,
    "every free-text field on a retained shared intervention must be redacted"
  );
  assert.match(block, /'interventionsDeleted'/);
  assert.match(block, /'interventionsRedacted'/);
  assert.match(
    block,
    /'\{memberCount\}'[\s\S]*?cardinality\(array_remove\(gr\.student_ids, v_student\.id\)\)/,
    "the retained group snapshot must describe the retained classmates"
  );
});

test("append-only shared evidence remains browser-immutable during the privacy-only redaction exception", async () => {
  const source = await migrationSource();

  assert.match(
    source,
    /revoke insert, update, delete on public\.teacher_insight_observations\s+from anon, authenticated/i
  );
  assert.match(
    source,
    /revoke insert, update, delete on public\.teacher_instructional_group_reviews\s+from anon, authenticated/i
  );
  assert.match(
    source,
    /literacy_path\.verified_learner_deletion_redaction/
  );
});
