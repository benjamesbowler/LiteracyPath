import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeRosterStudentName,
  setRosterStudentArchived,
  updateRosterStudentName
} from "../../src/data/teacherRosterOperations.js";

function updateQuery(result, calls) {
  const call = { filters: [] };
  calls.push(call);
  const query = {
    eq(field, value) {
      call.filters.push([field, value]);
      return query;
    },
    select(fields) {
      call.fields = fields;
      return Promise.resolve(result);
    }
  };
  return query;
}

test("student names are normalised and updated only inside the selected class", async () => {
  const calls = [];
  const client = {
    table(name) {
      assert.equal(name, "students");
      return {
        update(values) {
          calls.push({ values });
          return updateQuery({
            data: [{ id: "student-1", name: "Aaron Lee", class_id: "class-1" }],
            error: null
          }, calls);
        }
      };
    }
  };

  const result = await updateRosterStudentName({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    name: "  Aaron   Lee  "
  });

  assert.equal(normalizeRosterStudentName("  Aaron   Lee  "), "Aaron Lee");
  assert.equal(result.error, null);
  assert.deepEqual(calls[0].values, { name: "Aaron Lee" });
  assert.deepEqual(calls[1].filters, [
    ["id", "student-1"],
    ["class_id", "class-1"]
  ]);
});

test("blank and overlong child names are rejected before a write", async () => {
  let writes = 0;
  const client = {
    table() {
      writes += 1;
      return {};
    }
  };

  const blank = await updateRosterStudentName({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    name: " "
  });
  const long = await updateRosterStudentName({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    name: "a".repeat(81)
  });

  assert.equal(blank.error.code, "LP_INVALID_STUDENT_NAME");
  assert.equal(long.error.code, "LP_INVALID_STUDENT_NAME");
  assert.equal(writes, 0);
});

test("archive uses the owned RPC and does not fall through after real errors", async () => {
  let tableCalls = 0;
  const denied = { code: "42501", message: "You do not have permission." };
  const client = {
    async call(name, payload) {
      assert.equal(name, "teacher_set_student_archived");
      assert.deepEqual(payload, {
        p_student_id: "student-1",
        p_class_id: "class-1",
        p_archived: true
      });
      return { data: null, error: denied };
    },
    table() {
      tableCalls += 1;
      return {};
    }
  };

  const result = await setRosterStudentArchived({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    archived: true
  });

  assert.equal(result.error, denied);
  assert.equal(tableCalls, 0);
});

test("archive falls back during a frontend-first rolling release", async () => {
  const calls = [];
  const client = {
    async call() {
      return {
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.teacher_set_student_archived"
        }
      };
    },
    table(name) {
      assert.equal(name, "students");
      return {
        update(values) {
          calls.push({ values });
          return updateQuery({
            data: [{ id: "student-1" }],
            error: null
          }, calls);
        }
      };
    }
  };

  const result = await setRosterStudentArchived({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    archived: false
  });

  assert.equal(result.error, null);
  assert.deepEqual(calls[0].values, { archived_at: null });
});
