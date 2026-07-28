import assert from "node:assert/strict";
import test from "node:test";

import { loadTeacherSchoolName } from "../../src/data/teacherSchoolProfile.js";

function schoolClient(result) {
  const calls = [];
  const query = {
    select(columns) {
      calls.push(["select", columns]);
      return query;
    },
    eq(column, value) {
      calls.push(["eq", column, value]);
      return query;
    },
    async maybeSingle() {
      calls.push(["maybeSingle"]);
      if (result instanceof Error) throw result;
      return result;
    }
  };
  return {
    calls,
    client: {
      table(name) {
        calls.push(["table", name]);
        return query;
      }
    }
  };
}

test("school-name reads return the verified saved name", async () => {
  const { calls, client } = schoolClient({
    data: { name: "  Willow Primary  " },
    error: null
  });

  const result = await loadTeacherSchoolName({
    client,
    schoolId: "school-a"
  });

  assert.deepEqual(result, { data: "Willow Primary", error: null });
  assert.deepEqual(calls, [
    ["table", "schools"],
    ["select", "name"],
    ["eq", "id", "school-a"],
    ["maybeSingle"]
  ]);
});

test("failed or missing school-name reads never become plausible blank data", async () => {
  const databaseError = new Error("network unavailable");
  const failed = schoolClient({ data: null, error: databaseError });
  const missing = schoolClient({ data: null, error: null });
  const rejected = schoolClient(databaseError);

  const failedResult = await loadTeacherSchoolName({
    client: failed.client,
    schoolId: "school-a"
  });
  const missingResult = await loadTeacherSchoolName({
    client: missing.client,
    schoolId: "school-a"
  });
  const rejectedResult = await loadTeacherSchoolName({
    client: rejected.client,
    schoolId: "school-a"
  });

  assert.equal(failedResult.data, "");
  assert.equal(failedResult.error, databaseError);
  assert.equal(missingResult.data, "");
  assert.match(missingResult.error?.message || "", /did not return a name/);
  assert.equal(rejectedResult.data, "");
  assert.equal(rejectedResult.error, databaseError);
});

test("an account with no saved school does not issue a school query", async () => {
  const { calls, client } = schoolClient({
    data: { name: "Unused" },
    error: null
  });

  assert.deepEqual(
    await loadTeacherSchoolName({ client, schoolId: "" }),
    { data: "", error: null }
  );
  assert.deepEqual(calls, []);
});
