import assert from "node:assert/strict";
import test from "node:test";

import {
  studentsForSettingsClass
} from "../../src/components/teacher/teacherSettingsModel.js";

test("settings privacy students fail closed to the selected class", () => {
  const result = studentsForSettingsClass({
    selectedClassId: "class-b",
    studentList: [
      { id: "student-a", name: "Aarav", class_id: "class-a" },
      { id: "student-b", name: "Diego", class_id: "class-b" },
      // A row without provenance must not be assumed to belong to whichever
      // class happens to be selected.
      { id: "student-unknown", name: "Unknown" }
    ],
    archivedStudentList: [
      { id: "student-old-a", name: "Aisha", class_id: "class-a", archived_at: "now" },
      { id: "student-old-b", name: "Mina", class_id: "class-b", archived_at: "now" }
    ]
  });

  assert.deepEqual(result.map(row => row.id), ["student-b", "student-old-b"]);
  assert.deepEqual(studentsForSettingsClass({
    selectedClassId: "",
    studentList: [{ id: "student-b", class_id: "class-b" }]
  }), []);
});
