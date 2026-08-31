import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { TEACHER_COPY } from "../../src/copy/teacherCopy.js";

const rosterPage = readFileSync(
  new URL("../../src/components/TeacherStudentsPage.jsx", import.meta.url),
  "utf8"
);

test("teacher roster surfaces share the no-surname display-name rule", () => {
  assert.equal(
    TEACHER_COPY.roster.privacy,
    "Use a familiar first name or classroom nickname. Do not enter a surname or other personal details."
  );
  assert.match(rosterPage, /\{TEACHER_COPY\.roster\.privacy\}/);
  assert.doesNotMatch(rosterPage, /surname unless your school requires/i);
});
