export const TEACHER_FUNNEL_STUDENT_PAGE_SIZE = 8;

export function getTeacherPageSlice({
  page = 1,
  pageSize,
  rows = []
} = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const pageCount = Math.max(1, Math.ceil(safeRows.length / safePageSize));
  const safePage = Math.min(pageCount, Math.max(1, Number(page) || 1));
  const start = (safePage - 1) * safePageSize;
  return {
    page: safePage,
    pageCount,
    rows: safeRows.slice(start, start + safePageSize),
    start
  };
}

// Keep long rosters navigable without creating a tab stop for every page.
// The current page, its neighbours, and both ends stay directly reachable;
// omitted ranges are represented by a non-interactive ellipsis.
export function getTeacherPaginationWindow({
  page = 1,
  pageCount = 1
} = {}) {
  const total = Math.max(1, Number(pageCount) || 1);
  const current = Math.min(total, Math.max(1, Number(page) || 1));
  if (total <= 7) {
    return Array.from({ length: total }, (_unused, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", total];
  }
  if (current >= total - 3) {
    return [
      1,
      "ellipsis-start",
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total
    ];
  }
  return [
    1,
    "ellipsis-start",
    current - 1,
    current,
    current + 1,
    "ellipsis-end",
    total
  ];
}
