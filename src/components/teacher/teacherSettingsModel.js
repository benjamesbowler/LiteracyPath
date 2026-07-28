/**
 * Settings receives the same roster state as the class page. A failed class
 * refresh may temporarily leave rows from the previous class in that state, so
 * privacy controls must scope by each row's saved class id rather than assuming
 * every supplied row belongs to the current selection.
 */
export function studentsForSettingsClass({
  studentList = [],
  archivedStudentList = [],
  selectedClassId = ""
} = {}) {
  if (!selectedClassId) return [];
  const classKey = String(selectedClassId);
  return [...studentList, ...archivedStudentList].filter(
    row => String(row?.class_id || "") === classKey
  );
}
