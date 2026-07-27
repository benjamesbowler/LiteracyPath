import assert from "node:assert/strict";
import test from "node:test";

import {
  isLegacyClassSchemaError,
  isLegacyStudentSchemaError,
  isMissingRpcOverload,
  loadCompatibleDashboardStudents,
  loadCompatibleStudentClass,
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
  assert.equal(
    calls[1].fields,
    "id,name,class_id,created_at,symbol_password"
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

test("student roster lookup retries the previous signature only when absent", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push([name, payload]);
      if (calls.length === 1) {
        return {
          data: null,
          error: {
            code: "PGRST202",
            message: "Could not find the function public.student_class_by_code(p_code, p_device_id)"
          }
        };
      }
      return {
        data: { ok: true, class: { id: "class-1", name: "Owls" }, students: [] },
        error: null
      };
    }
  };

  const result = await loadCompatibleStudentClass({
    client,
    code: "READ42",
    deviceId: "device-1"
  });

  assert.equal(result.data.ok, true);
  assert.equal(result.compatibility, "legacy");
  assert.deepEqual(calls.map(([, payload]) => payload), [
    { p_code: "READ42", p_device_id: "device-1" },
    { p_code: "READ42" }
  ]);
});

test("student login retries the matching previous signature but preserves real errors", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push([name, payload]);
      if (calls.length === 1) {
        return {
          data: null,
          error: {
            code: "PGRST202",
            message: "Could not find the function public.student_login(p_code, p_device_id, p_sequence, p_student_id)"
          }
        };
      }
      return { data: { ok: true, token: "token-1" }, error: null };
    }
  };

  const result = await loginCompatibleStudent({
    client,
    studentId: "student-1",
    sequence: "123",
    deviceId: "device-1",
    code: "READ42"
  });

  assert.equal(result.data.ok, true);
  assert.equal(result.compatibility, "legacy");
  assert.deepEqual(calls[1][1], {
    p_student_id: "student-1",
    p_sequence: "123"
  });
  assert.equal(isMissingRpcOverload(
    { code: "42501", message: "permission denied for public.student_login" },
    "student_login"
  ), false);
});
