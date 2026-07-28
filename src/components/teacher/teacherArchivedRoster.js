import {
  getTeacherPageSlice,
  getTeacherPaginationWindow
} from "./teacherPagination.js";

export const TEACHER_ARCHIVED_STUDENT_PAGE_SIZE = 10;

function normalizedSearchText(value = "") {
  return String(value || "").trim().toLocaleLowerCase();
}

export function getTeacherArchivedRosterView({
  archivedStudents = [],
  page = 1,
  pageSize = TEACHER_ARCHIVED_STUDENT_PAGE_SIZE,
  search = "",
  selectedClassId = ""
} = {}) {
  const classRows = (Array.isArray(archivedStudents) ? archivedStudents : [])
    .filter(student => (
      String(student?.class_id || student?.classId || "")
      === String(selectedClassId || "")
    ))
    .sort((left, right) => String(left?.name || "").localeCompare(
      String(right?.name || ""),
      undefined,
      { sensitivity: "base" }
    ));
  const normalizedSearch = normalizedSearchText(search);
  const matchingRows = normalizedSearch
    ? classRows.filter(student => (
        normalizedSearchText(student?.name).includes(normalizedSearch)
      ))
    : classRows;
  const pageSlice = getTeacherPageSlice({
    page,
    pageSize,
    rows: matchingRows
  });

  return {
    classRows,
    matchingRows,
    page: pageSlice.page,
    pageCount: pageSlice.pageCount,
    pageRows: pageSlice.rows,
    paginationItems: getTeacherPaginationWindow({
      page: pageSlice.page,
      pageCount: pageSlice.pageCount
    }),
    start: pageSlice.start,
    end: pageSlice.start + pageSlice.rows.length,
    totalCount: classRows.length,
    matchingCount: matchingRows.length
  };
}
