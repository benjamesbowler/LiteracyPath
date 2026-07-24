import {
  getGuidedReadingProgress,
  guidedReadingBooks
} from "../data/guidedReadingBooks.js";
import {
  buildReportContextRows,
  REPORT_INFO_SHEET_NAME
} from "./exportReportSections.js";
import {
  addMetricDefinitionsWorksheet,
  METRIC_DEFINITIONS_SHEET_NAME
} from "./metricDefinitions.js";
import {
  addExportProvenanceWorksheet,
  buildExportProvenanceRows,
  REPORT_PROVENANCE_SHEET_NAME
} from "./exportProvenance.js";

export const GUIDED_READING_COMPLETION_SHEETS = {
  reportInfo: REPORT_INFO_SHEET_NAME,
  summary: "Summary",
  studentCompletion: "Student Completion",
  booksCompleted: "Books Completed",
  studentSummary: "Student Summary",
  provenance: REPORT_PROVENANCE_SHEET_NAME,
  definitions: METRIC_DEFINITIONS_SHEET_NAME
};

export const GUIDED_READING_COMPLETION_HEADERS = {
  reportInfo: ["Field", "Value"],
  summary: [
    "Class Name",
    "Total Students",
    "Total Completed Books",
    "Total Unique Books Completed",
    "Total Guided Reading Sessions",
    "Export Date"
  ],
  studentCompletion: [
    "Student Name",
    "Class Name",
    "Book Title",
    "Series",
    "Level",
    "Book ID",
    "Completed",
    "Completion Date",
    "Read Count",
    "Reread Count",
    "Last Read Date",
    "Pages Read",
    "Total Pages",
    "Marked Words Count",
    "Notes / Status"
  ],
  booksCompleted: [
    "Book Title",
    "Series",
    "Level",
    "Book ID",
    "Students Completed",
    "Total Completions",
    "Total Reads",
    "Total Rereads",
    "Last Completed Date"
  ],
  studentSummary: [
    "Student Name",
    "Class Name",
    "Books Completed",
    "Unique Books Completed",
    "Highest Guided Reading Level Completed",
    "Total Reads",
    "Total Rereads",
    "Last Guided Reading Date",
    "Recent Book"
  ]
};

const STORAGE_PREFIX = "guidedReadingAssessment:";

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function safeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date;
}

function formatDate(value) {
  const date = safeDate(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

function getClassName(student = {}, classes = []) {
  if (student.className) return student.className;
  return classes.find(row => row.id === student.class_id || row.id === student.classId)?.name || "Unknown Class";
}

function getBookSeries(book = {}, record = {}) {
  return book.seriesTitle || book.seriesName || record.seriesTitle || "";
}

function getMarkedWordsCount(record = {}) {
  return Object.values(record.pages || {}).reduce((sum, page) =>
    sum + Object.values(page.wordMarks || {}).filter(Boolean).length,
  0);
}

function getRecordNotes(record = {}, progress = {}) {
  if (record.wholeBookNote) return record.wholeBookNote;
  if (progress.completed) return "Completed";
  if (progress.completedPages > 0) return "Partial progress";
  return "No records yet";
}

function getStorageRecords({ students = [], teacherId = "" } = {}) {
  if (typeof localStorage === "undefined") return [];
  const studentIdSet = new Set(students.map(student => student.id).filter(Boolean));
  const rows = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || "";
    if (!key.startsWith(STORAGE_PREFIX)) continue;
    const [, keyTeacherId = "", keyStudentId = ""] = key.split(":");
    if (teacherId && keyTeacherId && keyTeacherId !== teacherId) continue;
    if (studentIdSet.size > 0 && keyStudentId && !studentIdSet.has(keyStudentId)) continue;
    rows.push({
      teacherId: keyTeacherId,
      studentId: keyStudentId,
      records: safeJsonParse(localStorage.getItem(key), {})
    });
  }

  return rows;
}

export function collectGuidedReadingCompletionRecords({
  students = [],
  classes = [],
  guidedReadingRecordsByStudent = [],
  teacherId = ""
} = {}) {
  const bookById = new Map(guidedReadingBooks.map(book => [book.id, book]));
  const studentById = new Map(students.map(student => [student.id, student]));
  const storageRows = guidedReadingRecordsByStudent.length
    ? guidedReadingRecordsByStudent
    : getStorageRecords({ students, teacherId });
  const completionRows = [];

  storageRows.forEach(row => {
    const student = studentById.get(row.studentId) || {
      id: row.studentId,
      name: row.studentName || "Unknown Student",
      class_id: row.classId || ""
    };
    const className = getClassName(student, classes);
    Object.entries(row.records || {}).forEach(([bookId, record]) => {
      const book = bookById.get(bookId) || {};
      const progress = getGuidedReadingProgress(book, {
        ...record,
        bookId,
        studentId: row.studentId
      });
      const completed = Boolean(progress.completed);
      const readCount = Math.max(0, Number(progress.readCount || 0));
      // Rereads only make sense after a completion; partial reads of an
      // unfinished book must not count as rereads.
      const rereadCount = completed ? Math.max(0, readCount - 1) : 0;
      completionRows.push({
        studentId: row.studentId,
        studentName: student.name || record.studentName || "Unknown Student",
        className,
        bookId,
        bookTitle: book.title || record.title || bookId || "Unknown Book",
        series: getBookSeries(book, record),
        level: book.level || record.level || progress.level || "",
        completed,
        // Completion evidence and first-read evidence are distinct. A book can
        // be complete while its historical completion timestamp is unknown.
        completionDate: completed ? formatDate(record.completedAt) : "",
        lastReadDate: formatDate(progress.lastReadAt),
        readCount,
        rereadCount,
        pagesRead: Number(progress.completedPages || 0),
        totalPages: Number(progress.totalPages || book.pages?.length || record.totalPages || 0),
        markedWordsCount: getMarkedWordsCount(record),
        notes: getRecordNotes(record, progress),
        rawLastReadAt: progress.lastReadAt || record.updatedAt || "",
        rawCompletedAt: completed ? (record.completedAt || "") : ""
      });
    });
  });

  return completionRows.sort((a, b) =>
    a.studentName.localeCompare(b.studentName) ||
    a.level.localeCompare(b.level) ||
    a.bookTitle.localeCompare(b.bookTitle)
  );
}

export function buildGuidedReadingCompletionWorkbookData(options = {}) {
  const rows = collectGuidedReadingCompletionRecords(options);
  const completedRows = rows.filter(row => row.completed);
  const students = options.students || [];
  const uniqueCompletedBooks = new Set(completedRows.map(row => row.bookId).filter(Boolean));
  const classNames = Array.from(new Set([
    ...students.map(student => getClassName(student, options.classes || [])),
    ...rows.map(row => row.className)
  ].filter(Boolean)));
  const exportDate = new Date(options.generatedAt || Date.now());
  if (Number.isNaN(exportDate.getTime())) {
    throw new Error("Guided Reading export generatedAt must be a valid date.");
  }
  const summaryRows = (classNames.length ? classNames : ["Unknown Class"]).map(className => {
    const classStudents = students.filter(student => getClassName(student, options.classes || []) === className);
    const classRows = rows.filter(row => row.className === className);
    const classCompleted = classRows.filter(row => row.completed);
    return {
      className,
      totalStudents: classStudents.length || new Set(classRows.map(row => row.studentId)).size,
      totalCompletedBooks: classCompleted.length,
      totalUniqueBooksCompleted: new Set(classCompleted.map(row => row.bookId)).size,
      totalGuidedReadingSessions: classRows.reduce((sum, row) => sum + row.readCount, 0),
      exportDate: formatDate(exportDate)
    };
  });

  const booksById = new Map();
  completedRows.forEach(row => {
    const existing = booksById.get(row.bookId) || {
      bookTitle: row.bookTitle,
      series: row.series,
      level: row.level,
      bookId: row.bookId,
      studentsCompleted: new Set(),
      totalCompletions: 0,
      totalReads: 0,
      totalRereads: 0,
      lastCompletedRaw: "",
      lastCompletedDate: ""
    };
    existing.studentsCompleted.add(row.studentId || row.studentName);
    existing.totalCompletions += 1;
    existing.totalReads += row.readCount;
    existing.totalRereads += row.rereadCount;
    // Compare on the raw ISO timestamps (formatted dates don't sort), and use
    // only completion timestamps — a later reread is not a completion date.
    existing.lastCompletedRaw = [existing.lastCompletedRaw, row.rawCompletedAt]
      .filter(Boolean)
      .sort()
      .at(-1) || "";
    existing.lastCompletedDate = existing.lastCompletedRaw ? formatDate(existing.lastCompletedRaw) : "";
    booksById.set(row.bookId, existing);
  });

  const studentMap = new Map();
  rows.forEach(row => {
    const existing = studentMap.get(row.studentId || row.studentName) || {
      studentId: row.studentId || "",
      studentName: row.studentName,
      className: row.className,
      completedBookIds: new Set(),
      booksCompleted: 0,
      totalReads: 0,
      totalRereads: 0,
      highestLevel: "",
      lastGuidedReadingDate: "",
      recentBook: ""
    };
    existing.totalReads += row.readCount;
    if (row.completed) {
      existing.booksCompleted += 1;
      existing.completedBookIds.add(row.bookId);
      existing.highestLevel = [existing.highestLevel, row.level].filter(Boolean).sort().at(-1) || "";
      existing.totalRereads += row.rereadCount;
    }
    const rowDate = row.lastReadDate || row.completionDate;
    if (rowDate && (!existing.lastGuidedReadingDate || rowDate >= existing.lastGuidedReadingDate)) {
      existing.lastGuidedReadingDate = rowDate;
      existing.recentBook = row.bookTitle;
    }
    studentMap.set(row.studentId || row.studentName, existing);
  });

  students.forEach(student => {
    const key = student.id || student.name;
    if (studentMap.has(key)) return;
    studentMap.set(key, {
      studentId: student.id || "",
      studentName: student.name || "Unknown Student",
      className: getClassName(student, options.classes || []),
      completedBookIds: new Set(),
      booksCompleted: 0,
      totalReads: 0,
      totalRereads: 0,
      highestLevel: "",
      lastGuidedReadingDate: "",
      recentBook: ""
    });
  });

  const studentSummaryRows = Array.from(studentMap.values()).map(row => ({
    ...row,
    uniqueBooksCompleted: row.completedBookIds.size
  }));
  const reportInfoRows = buildReportContextRows({
    reportTitle: "Guided Reading Completion",
    generatedAt: exportDate,
    classNames,
    studentCount: students.length || new Set(rows.map(row => row.studentId)).size,
    extraRows: [
      { field: "Guided Reading Sessions", value: rows.reduce((sum, row) => sum + row.readCount, 0) }
    ]
  });
  const provenanceRows = buildExportProvenanceRows({
    reportTitle: "Guided Reading Completion",
    schoolName: options.schoolName,
    classNames,
    learnerCount: students.length || new Set(rows.map(row => row.studentId)).size,
    generatedAt: exportDate,
    timeZone: options.timeZone,
    filters: options.filters || "Included roster and all available Guided Reading completion records",
    evidenceSource: rows.map(row => ({
      completedAt: row.rawCompletedAt,
      observedAt: row.rawLastReadAt
    })),
    appVersion: options.appVersion,
    definitions: `Definitions are included in the ${METRIC_DEFINITIONS_SHEET_NAME} sheet.`
  });

  return {
    generatedAt: exportDate.toISOString(),
    reportInfoRows,
    provenanceRows,
    summaryRows,
    studentCompletionRows: rows,
    booksCompletedRows: Array.from(booksById.values()).map(row => ({
      ...row,
      studentsCompleted: row.studentsCompleted.size
    })),
    studentSummaryRows,
    totals: {
      totalStudents: students.length || new Set(rows.map(row => row.studentId)).size,
      totalCompletedBooks: completedRows.length,
      totalUniqueBooksCompleted: uniqueCompletedBooks.size,
      totalGuidedReadingSessions: rows.reduce((sum, row) => sum + row.readCount, 0)
    }
  };
}

function addRowsOrEmpty(sheet, rows, mapper) {
  if (!rows.length) {
    sheet.addRow(mapper(null));
    return;
  }
  rows.forEach(row => sheet.addRow(mapper(row)));
}

function styleWorksheet(sheet) {
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFF6FF" }
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

export async function createGuidedReadingCompletionWorkbook(options = {}) {
  const module = await import("exceljs");
  const ExcelJS = module.default || module["module.exports"] || module;
  const workbook = new ExcelJS.Workbook();
  const data = buildGuidedReadingCompletionWorkbookData(options);

  workbook.creator = "Literacy Guide";
  workbook.created = new Date(data.generatedAt);

  const infoSheet = workbook.addWorksheet(GUIDED_READING_COMPLETION_SHEETS.reportInfo);
  infoSheet.columns = GUIDED_READING_COMPLETION_HEADERS.reportInfo.map(header => ({
    header,
    key: header,
    width: header === "Field" ? 32 : 56
  }));
  data.reportInfoRows.forEach(row => infoSheet.addRow({ Field: row.field, Value: row.value }));

  const summarySheet = workbook.addWorksheet(GUIDED_READING_COMPLETION_SHEETS.summary);
  summarySheet.columns = GUIDED_READING_COMPLETION_HEADERS.summary.map(header => ({ header, key: header, width: 28 }));
  addRowsOrEmpty(summarySheet, data.summaryRows, row => row ? {
    "Class Name": row.className,
    "Total Students": row.totalStudents,
    "Total Completed Books": row.totalCompletedBooks,
    "Total Unique Books Completed": row.totalUniqueBooksCompleted,
    "Total Guided Reading Sessions": row.totalGuidedReadingSessions,
    "Export Date": row.exportDate
  } : {
    "Class Name": "No records yet",
    "Total Students": 0,
    "Total Completed Books": 0,
    "Total Unique Books Completed": 0,
    "Total Guided Reading Sessions": 0,
    "Export Date": formatDate(new Date())
  });

  const completionSheet = workbook.addWorksheet(GUIDED_READING_COMPLETION_SHEETS.studentCompletion);
  completionSheet.columns = GUIDED_READING_COMPLETION_HEADERS.studentCompletion.map(header => ({ header, key: header, width: header.length > 18 ? 28 : 18 }));
  addRowsOrEmpty(completionSheet, data.studentCompletionRows, row => row ? {
    "Student Name": row.studentName,
    "Class Name": row.className,
    "Book Title": row.bookTitle,
    "Series": row.series,
    "Level": row.level,
    "Book ID": row.bookId,
    "Completed": row.completed ? "Yes" : "No",
    "Completion Date": row.completionDate,
    "Read Count": row.readCount,
    "Reread Count": row.rereadCount,
    "Last Read Date": row.lastReadDate,
    "Pages Read": row.pagesRead,
    "Total Pages": row.totalPages,
    "Marked Words Count": row.markedWordsCount,
    "Notes / Status": row.notes
  } : {
    "Student Name": "No records yet",
    "Class Name": "",
    "Book Title": "",
    "Series": "",
    "Level": "",
    "Book ID": "",
    "Completed": "No",
    "Completion Date": "",
    "Read Count": 0,
    "Reread Count": 0,
    "Last Read Date": "",
    "Pages Read": 0,
    "Total Pages": 0,
    "Marked Words Count": 0,
    "Notes / Status": "No guided reading completion records yet"
  });

  const booksSheet = workbook.addWorksheet(GUIDED_READING_COMPLETION_SHEETS.booksCompleted);
  booksSheet.columns = GUIDED_READING_COMPLETION_HEADERS.booksCompleted.map(header => ({ header, key: header, width: 26 }));
  addRowsOrEmpty(booksSheet, data.booksCompletedRows, row => row ? {
    "Book Title": row.bookTitle,
    "Series": row.series,
    "Level": row.level,
    "Book ID": row.bookId,
    "Students Completed": row.studentsCompleted,
    "Total Completions": row.totalCompletions,
    "Total Reads": row.totalReads,
    "Total Rereads": row.totalRereads,
    "Last Completed Date": row.lastCompletedDate
  } : {
    "Book Title": "No records yet",
    "Series": "",
    "Level": "",
    "Book ID": "",
    "Students Completed": 0,
    "Total Completions": 0,
    "Total Reads": 0,
    "Total Rereads": 0,
    "Last Completed Date": ""
  });

  const studentSheet = workbook.addWorksheet(GUIDED_READING_COMPLETION_SHEETS.studentSummary);
  studentSheet.columns = GUIDED_READING_COMPLETION_HEADERS.studentSummary.map(header => ({ header, key: header, width: 28 }));
  addRowsOrEmpty(studentSheet, data.studentSummaryRows, row => row ? {
    "Student Name": row.studentName,
    "Class Name": row.className,
    "Books Completed": row.booksCompleted,
    "Unique Books Completed": row.uniqueBooksCompleted,
    "Highest Guided Reading Level Completed": row.highestLevel,
    "Total Reads": row.totalReads,
    "Total Rereads": row.totalRereads,
    "Last Guided Reading Date": row.lastGuidedReadingDate,
    "Recent Book": row.recentBook
  } : {
    "Student Name": "No records yet",
    "Class Name": "",
    "Books Completed": 0,
    "Unique Books Completed": 0,
    "Highest Guided Reading Level Completed": "",
    "Total Reads": 0,
    "Total Rereads": 0,
    "Last Guided Reading Date": "",
    "Recent Book": ""
  });

  addExportProvenanceWorksheet(workbook, data.provenanceRows);
  addMetricDefinitionsWorksheet(workbook, { generatedAt: data.generatedAt });
  workbook.worksheets.forEach(styleWorksheet);
  return { workbook, data };
}

export async function exportGuidedReadingCompletionExcel(options = {}) {
  const { workbook, data } = await createGuidedReadingCompletionWorkbook(options);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `guided-reading-completion-export-${formatDate(new Date())}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
  return data;
}
