import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getTeacherArchivedRosterView,
  TEACHER_ARCHIVED_STUDENT_PAGE_SIZE
} from "../../src/components/teacher/teacherArchivedRoster.js";

function archivedStudents(classId, count, prefix = "Archived learner") {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `${classId}-${index + 1}`,
    class_id: classId,
    name: `${prefix} ${String(index + 1).padStart(3, "0")}`
  }));
}

test("archived roster view filters by class and bounds each page to ten students", () => {
  const rows = [
    ...archivedStudents("class-a", 25),
    ...archivedStudents("class-b", 12, "Other class")
  ];
  const view = getTeacherArchivedRosterView({
    archivedStudents: rows,
    page: 3,
    selectedClassId: "class-a"
  });

  assert.equal(TEACHER_ARCHIVED_STUDENT_PAGE_SIZE, 10);
  assert.equal(view.totalCount, 25);
  assert.equal(view.matchingCount, 25);
  assert.equal(view.page, 3);
  assert.equal(view.pageCount, 3);
  assert.equal(view.pageRows.length, 5);
  assert.equal(view.pageRows[0].name, "Archived learner 021");
  assert.equal(view.pageRows.at(-1).name, "Archived learner 025");
  assert.deepEqual(view.paginationItems, [1, 2, 3]);
});

test("an archived-student search clamps a stale page and remains case-insensitive", () => {
  const view = getTeacherArchivedRosterView({
    archivedStudents: archivedStudents("class-a", 25),
    page: 3,
    search: "LEARNER 025",
    selectedClassId: "class-a"
  });

  assert.equal(view.page, 1);
  assert.equal(view.pageCount, 1);
  assert.equal(view.start, 0);
  assert.equal(view.end, 1);
  assert.deepEqual(view.pageRows.map(row => row.name), ["Archived learner 025"]);
});

test("the Students page resets archived search and page on class and search changes", () => {
  const source = readFileSync(
    new URL("../../src/components/TeacherStudentsPage.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /getTeacherArchivedRosterView\(\{/);
  assert.match(
    source,
    /previousArchivedClassIdRef\.current !== selectedClassId[\s\S]*?setArchivedRosterSearch\(""\)[\s\S]*?setArchivedRosterPage\(1\)/
  );
  assert.match(
    source,
    /setArchivedRosterSearch\(event\.target\.value\);[\s\S]*?setArchivedRosterPage\(1\);/
  );
  assert.match(source, /aria-label="Archived student pages"/);
  assert.match(source, /aria-current=\{item === archivedRosterView\.page \? "page" : undefined\}/);
});
