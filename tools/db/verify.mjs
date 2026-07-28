import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
const sql = readFileSync(process.argv[2], "utf8");
const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(readFileSync("bootstrap.sql", "utf8"));
await db.exec(readFileSync("legacy.sql", "utf8"));

for (const pass of [1, 2, 3]) {
  try {
    await db.exec(sql);
    console.log(`pass ${pass}: applied`);
  } catch (e) {
    console.log(`pass ${pass} FAILED: ${String(e?.message || e).split("\n")[0]}`);
    if (e?.detail) console.log("  detail: " + String(e.detail).slice(0, 200));
    if (e?.hint) console.log("  hint:   " + String(e.hint).slice(0, 200));
    process.exit(1);
  }
}

const want = ["teacher_prepare_learner_deletion","teacher_delete_learner_data_staged",
  "teacher_complete_learner_deletion","teacher_get_learner_deletion_status",
  "teacher_export_learner_data","teacher_list_learner_data_rights",
  "teacher_set_student_archived","teacher_set_student_symbol_password",
  "teacher_transfer_student",
  "teacher_reset_student_progress","teacher_delete_saved_assessment_report",
  "teacher_delete_empty_class","redact_learner_from_shared_reports",
  "jsonb_strip_student_entries","student_from_token"];
const { rows } = await db.query(
  `select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname = any($1)`, [want]);
const have = new Set(rows.map(r => r.proname));
console.log("\nfunctions the app calls:");
for (const f of want) console.log(`  ${have.has(f) ? "present" : "MISSING "}  ${f}`);

const r2 = await db.query(`
  select
    public.jsonb_strip_student_entries(
      '{"class":"3B","learners":[
          {"studentId":"11111111-1111-1111-1111-111111111111","name":"Aaron"},
          {"studentId":"22222222-2222-2222-2222-222222222222","name":"Bea"}],
        "file":"report-11111111-1111-1111-1111-111111111111.json"}'::jsonb,
      '11111111-1111-1111-1111-111111111111')::text
        not like '%11111111-1111-1111-1111-111111111111%' as erased,
    public.jsonb_strip_student_entries(
      '{"learners":[{"studentId":"11111111-1111-1111-1111-111111111111"},
                    {"studentId":"22222222-2222-2222-2222-222222222222","name":"Bea"}]}'::jsonb,
      '11111111-1111-1111-1111-111111111111')::text
        like '%Bea%' as other_kept`);
console.log("\nredaction: subject erased =", r2.rows[0].erased,
            "| other child kept =", r2.rows[0].other_kept);
const ok = want.every(f => have.has(f)) && r2.rows[0].erased && r2.rows[0].other_kept;
console.log(ok ? "\nALL CHECKS PASSED" : "\nCHECKS FAILED");
if (!ok) process.exitCode = 1;
