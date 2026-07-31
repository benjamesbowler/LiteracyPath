import assert from "node:assert/strict";
import test from "node:test";

import {
  isLegacyClassSchemaError,
  isLegacyStudentSchemaError,
  isMissingRpcOverload,
  loadCompatibleDashboardStudents,
  loadCompatibleStudentClass,
  loadCompatibleTeacherClassCounts,
  loadCompatibleTeacherClasses,
  loadCompatibleTeacherStudents,
  loginCompatibleStudent
} from "../../src/data/classApiCompatibility.js";

function queryResponse(response, calls, fields) {
  calls.push(fields);
  return {
    eq() {
      return this;
    },
    order() {
      return Promise.resolve(response);
    }
  };
}

test("teacher classes retry only for the known rolling-release columns", async () => {
  const calls = [];
  const missingColumn = {
    code: "42703",
    message: "column classes.access_code_created_at does not exist"
  };
  const responses = [
    { data: null, error: missingColumn },
    { data: [{ id: "class-1", name: "Owls" }], error: null }
  ];
  const client = {
    table(name) {
      assert.equal(name, "classes");
      return {
        select(fields) {
          return queryResponse(responses.shift(), calls, fields);
        }
      };
    }
  };

  const result = await loadCompatibleTeacherClasses({
    client,
    teacherId: "teacher-1"
  });

  assert.equal(result.error, null);
  assert.equal(result.compatibility, "legacy");
  assert.equal(result.data[0].name, "Owls");
  assert.match(calls[0], /access_code_expires_at/);
  assert.equal(calls[1], "id,name,school_id,access_code");
  assert.equal(isLegacyClassSchemaError(missingColumn), true);
});

test("teacher classes do not mask permission or unrelated database failures", async () => {
  const calls = [];
  const denied = { code: "42501", message: "permission denied for table classes" };
  const client = {
    table() {
      return {
        select(fields) {
          return queryResponse({ data: null, error: denied }, calls, fields);
        }
      };
    }
  };

  const result = await loadCompatibleTeacherClasses({
    client,
    teacherId: "teacher-1"
  });

  assert.equal(result.error, denied);
  assert.equal(result.compatibility, "current");
  assert.equal(calls.length, 1);
});

test("teacher class counts come from active roster rows", async () => {
  const calls = [];
  const client = {
    table(name) {
      assert.equal(name, "students");
      return {
        select(fields) {
          return studentQueryResponse({
            data: [
              { id: "student-1", class_id: "class-1", archived_at: null },
              { id: "student-2", class_id: "class-1", archived_at: null }
            ],
            error: null
          }, calls, fields);
        }
      };
    }
  };

  const result = await loadCompatibleTeacherClassCounts({
    client,
    teacherId: "teacher-1"
  });

  assert.equal(result.error, null);
  assert.equal(result.data.length, 2);
  assert.deepEqual(calls[0].filters, [
    ["eq", "teacher_id", "teacher-1"],
    ["is", "archived_at", null]
  ]);
});

test("teacher class loading reads beyond the server's first 1,000 rows", async () => {
  const rows = Array.from({ length: 1001 }, (_unused, index) => ({
    id: `class-${index}`,
    name: `Class ${String(index).padStart(4, "0")}`
  }));
  const client = {
    table(name) {
      assert.equal(name, "classes");
      return {
        select() {
          return {
            eq() {
              return this;
            },
            order() {
              return this;
            },
            async range(from, to) {
              return { data: rows.slice(from, to + 1), error: null };
            }
          };
        }
      };
    }
  };

  const result = await loadCompatibleTeacherClasses({
    client,
    teacherId: "teacher-1"
  });

  assert.equal(result.error, null);
  assert.equal(result.truncated, false);
  assert.equal(result.data.length, 1001);
  assert.equal(result.data.at(-1).id, "class-1000");
});

function studentQueryResponse(response, calls, fields) {
  const call = { fields, filters: [] };
  calls.push(call);
  const query = {
    eq(field, value) {
      call.filters.push(["eq", field, value]);
      return query;
    },
    is(field, value) {
      call.filters.push(["is", field, value]);
      return query;
    },
    order() {
      return Promise.resolve(response);
    }
  };
  return query;
}

test("teacher roster retries the pre-archive student fields", async () => {
  const calls = [];
  const missingUpdatedAt = {
    code: "42703",
    message: "column students.updated_at does not exist"
  };
  const responses = [
    { data: null, error: missingUpdatedAt },
    {
      data: [{
        id: "student-1",
        name: "Robin",
        class_id: "class-1",
        symbol_password: "123"
      }],
      error: null
    }
  ];
  const client = {
    table(name) {
      assert.equal(name, "students");
      return {
        select(fields) {
          return studentQueryResponse(responses.shift(), calls, fields);
        }
      };
    }
  };

  const result = await loadCompatibleTeacherStudents({
    client,
    teacherId: "teacher-1",
    classId: "class-1"
  });

  assert.equal(result.error, null);
  assert.equal(result.compatibility, "legacy");
  assert.equal(result.data[0].name, "Robin");
  assert.match(calls[0].fields, /updated_at/);
  assert.match(calls[0].fields, /teacher_id/);
  assert.equal(
    calls[1].fields,
    "id,name,teacher_id,class_id,created_at,symbol_password"
  );
  assert.equal(isLegacyStudentSchemaError(missingUpdatedAt), true);
});

test("dashboard roster removes only the unavailable archive filter", async () => {
  const calls = [];
  const responses = [
    {
      data: null,
      error: {
        code: "42703",
        message: "column students.archived_at does not exist"
      }
    },
    { data: [{ id: "student-1", name: "Robin" }], error: null }
  ];
  const client = {
    table() {
      return {
        select(fields) {
          return studentQueryResponse(responses.shift(), calls, fields);
        }
      };
    }
  };

  const result = await loadCompatibleDashboardStudents({
    client,
    teacherId: "teacher-1",
    classId: "class-1"
  });

  assert.equal(result.compatibility, "legacy");
  assert.deepEqual(calls[0].filters.at(-1), ["is", "archived_at", null]);
  assert.equal(
    calls[1].filters.some(([, field]) => field === "archived_at"),
    false
  );
});

test("teacher roster loading reads beyond the server's first 1,000 rows", async () => {
  const rows = Array.from({ length: 1001 }, (_unused, index) => ({
    id: `student-${index}`,
    name: `Student ${String(index).padStart(4, "0")}`,
    class_id: "class-1"
  }));
  const client = {
    table(name) {
      assert.equal(name, "students");
      return {
        select() {
          return {
            eq() {
              return this;
            },
            order() {
              return this;
            },
            async range(from, to) {
              return { data: rows.slice(from, to + 1), error: null };
            }
          };
        }
      };
    }
  };

  const result = await loadCompatibleTeacherStudents({
    client,
    teacherId: "teacher-1",
    classId: "class-1"
  });

  assert.equal(result.error, null);
  assert.equal(result.truncated, false);
  assert.equal(result.data.length, 1001);
  assert.equal(result.data.at(-1).id, "student-1000");
});

test("student roster lookup fails closed when the secure signature is absent", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push([name, payload]);
      return {
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.student_class_by_code(p_code, p_device_id)"
        }
      };
    }
  };

  const result = await loadCompatibleStudentClass({
    client,
    code: "READ42",
    deviceId: "device-1"
  });

  assert.equal(result.data, null);
  assert.equal(result.error.code, "PGRST202");
  assert.equal(result.compatibility, "migration-required");
  assert.deepEqual(calls.map(([, payload]) => payload), [
    { p_code: "READ42", p_device_id: "device-1" }
  ]);
});

test("student login never retries the retired insecure signature", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push([name, payload]);
      return {
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.student_login(p_code, p_device_id, p_sequence, p_student_id)"
        }
      };
    }
  };

  const result = await loginCompatibleStudent({
    client,
    studentId: "student-1",
    sequence: "123",
    deviceId: "device-1",
    code: "READ42"
  });

  assert.equal(result.data, null);
  assert.equal(result.error.code, "PGRST202");
  assert.equal(result.compatibility, "migration-required");
  assert.deepEqual(calls.map(([, payload]) => payload), [{
    p_student_id: "student-1",
    p_sequence: "123",
    p_device_id: "device-1",
    p_code: "READ42"
  }]);
  assert.equal(isMissingRpcOverload(
    { code: "42501", message: "permission denied for public.student_login" },
    "student_login"
  ), false);
});
