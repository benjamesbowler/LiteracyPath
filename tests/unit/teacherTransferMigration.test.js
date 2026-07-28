import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const transferMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260728090000_teacher_transfer_student.sql",
    import.meta.url
  ),
  "utf8"
);
const boundaryMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260728091000_security_definer_boundary.sql",
    import.meta.url
  ),
  "utf8"
);

test("student transfer verifies both class boundaries and fails closed", () => {
  assert.match(
    transferMigration,
    /where s\.id = p_student_id\s+and s\.class_id = p_source_class_id/i
  );
  assert.match(
    transferMigration,
    /where target_class\.id = p_target_class_id\s+and target_class\.teacher_id = v_owner_id/i
  );
  assert.match(transferMigration, /v_owner_id is distinct from v_actor_id/i);
  assert.match(transferMigration, /errcode = '42501'/i);
  assert.match(transferMigration, /errcode = 'P0002'/i);
  assert.match(transferMigration, /errcode = '22023'/i);
  assert.match(
    transferMigration,
    /if v_moved_id is null then[\s\S]*?errcode = 'P0002'/i
  );
});

test("student transfer revokes old sessions and changes only current class membership", () => {
  const revokeAt = transferMigration.indexOf("update public.student_sessions");
  const moveAt = transferMigration.indexOf("update public.students");
  assert.ok(revokeAt > -1 && moveAt > revokeAt);
  assert.match(
    transferMigration,
    /set revoked = true\s+where student_id = p_student_id\s+and revoked = false/i
  );
  assert.match(
    transferMigration,
    /set class_id = p_target_class_id,[\s\S]*?where s\.id = p_student_id[\s\S]*?returning s\.id, s\.class_id/i
  );

  // Completed evidence retains the class where the work happened. Moving the
  // roster row must not rewrite assessment or report provenance.
  assert.doesNotMatch(
    transferMigration,
    /update public\.(assessment_attempts|assessment_sessions|el_assessment_reports|answers|learn_activity)/i
  );
});

test("the transfer RPC is private by default and present in the final boundary", () => {
  assert.match(
    transferMigration,
    /revoke all on function public\.teacher_transfer_student\(uuid, uuid, uuid\)\s+from public, anon/i
  );
  assert.match(
    boundaryMigration,
    /revoke execute on function %s from public, anon, authenticated/i
  );
  assert.match(
    boundaryMigration,
    /grant execute on function public\.teacher_transfer_student\(uuid, uuid, uuid\)\s+to authenticated/i
  );
});
