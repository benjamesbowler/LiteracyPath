import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parse } from "@babel/parser";
import ExcelJS from "exceljs";
import { APP_READING_LEVELS, getPublicBookMetadata } from "../../src/utils/guidedReading/bookLevelMetadata.js";
import { GUIDED_READING_BOOK_INDEX } from "../../src/data/generated/guidedReadingBookIndex.generated.js";
import * as readingModule from "../../src/data/guidedReadingBooks.js";
import { buildGuidedReadingReportModel } from "../../src/data/studentReportingWorkspaceModel.js";
import { buildGuidedReadingReportRows, buildGuidedReadingSummary } from "../../src/utils/reportSections.js";
import { collectGuidedReadingCompletionRecords, createGuidedReadingCompletionWorkbook } from "../../src/utils/exportGuidedReadingCompletionExcel.js";
import { buildReadingMasteryTextReport } from "../../src/utils/exportReadingMasteryText.js";
import { createStudentReportWorkbook } from "../../src/utils/exportStudentReportWorkbook.js";

const knownId = "gr-a-26"; // Pets: old placement B, current authored App level C.
const removedId = "removed-book-with-saved-H";
const stamp = "2026-10-29T08:00:00.000Z";

function savedRecord(level, word = "dog") {
  return {
    title: "Saved book title", level, completed: true, completedAt: stamp,
    lastReadAt: stamp, readCount: 2, completedPages: 1, totalPages: 1,
    wholeBookNote: "Retained observation",
    pages: { 0: { wordTexts: [word], wordMarks: { 0: "support" }, updatedAt: stamp } }
  };
}

function cellRows(sheet) {
  const rows = [];
  sheet.eachRow(row => rows.push(row.values.slice(1)));
  return rows;
}

test("report projections resolve a known book's current level and retain saved letters separately", () => {
  assert.equal(getPublicBookMetadata(knownId).appReadingLevel, "C");
  const records = { [knownId]: savedRecord("A"), [removedId]: savedRecord("H", "cat") };
  const before = JSON.stringify(records);
  const model = buildGuidedReadingReportModel({ guidedReadingRecords: records });
  const known = model.books.find(book => book.bookId === knownId);
  const removed = model.books.find(book => book.bookId === removedId);
  assert.equal(known.appReadingLevel, "C");
  assert.equal(known.levelLabel, "App level C");
  assert.equal(known.sourceLevel, "A");
  assert.equal(known.provenance.rawRecord.level, "A");
  assert.equal(removed.appReadingLevel, null);
  assert.equal(removed.levelLabel, "App level pending");
  assert.equal(removed.sourceLevel, "H");
  assert.equal(model.wordRows.find(row => row.bookId === knownId).levelLabel, "App level C");
  assert.equal(model.wordRows.find(row => row.bookId === removedId).levelLabel, "App level pending");
  assert.equal(model.wordRows.find(row => row.bookId === removedId).sourceLevel, "H");
  assert.equal(model.summary.booksCompleted, 2);
  assert.equal(model.summary.wordsNeedingSupportInText, 2);
  assert.equal(model.notes.length, 2);
  assert.equal(JSON.stringify(records), before, "metadata projection must not mutate saved evidence");

  const rows = buildGuidedReadingReportRows(records, readingModule);
  assert.equal(rows.find(row => row.bookId === knownId).level, "C");
  assert.equal(rows.find(row => row.bookId === removedId).sourceLevel, "H");
  const summary = buildGuidedReadingSummary(rows);
  assert.deepEqual(summary.byLevel, [{ level: "C", count: 1 }, { level: "pending", count: 1 }]);
});

test("prepared report rows cannot promote arbitrary saved letters to current App levels", () => {
  const model = buildGuidedReadingReportModel({
    guidedReadingRows: [
      { bookId: knownId, level: "H", readCount: 1 },
      { bookId: removedId, level: "G", readCount: 1 }
    ],
    guidedReadingWordRows: [
      { bookId: knownId, level: "H", word: "dog", mark: "correct" },
      { bookId: removedId, level: "G", word: "cat", mark: "support" }
    ]
  });
  assert.equal(model.books.find(book => book.bookId === knownId).levelLabel, "App level C");
  assert.equal(model.books.find(book => book.bookId === knownId).sourceLevel, "H");
  assert.equal(model.books.find(book => book.bookId === removedId).levelLabel, "App level pending");
  assert.equal(model.wordRows.find(row => row.bookId === removedId).sourceLevel, "G");
});

test("ID-based reports and exports withhold stale levels after a local page retirement", () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: key => key === "lpDeletedMediaManifest"
    ? JSON.stringify([{ assetType: "guided-reading-page", bookId: knownId, pageNumber: 1 }]) : null };
  try {
    const records = { [knownId]: savedRecord("A") };
    const model = buildGuidedReadingReportModel({ guidedReadingRecords: records });
    assert.equal(model.books[0].levelLabel, "App level pending");
    assert.equal(model.books[0].sourceLevel, "A");
    assert.equal(model.wordRows[0].levelLabel, "App level pending");
    const rows = buildGuidedReadingReportRows(records, readingModule);
    assert.equal(rows[0].levelLabel, "App level pending");
    assert.equal(rows[0].sourceLevel, "A");
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});

test("completion workbook cells identify book App levels and never rank a removed book's saved H", async () => {
  const options = {
    students: [{ id: "s1", name: "Reader" }], generatedAt: stamp,
    guidedReadingRecordsByStudent: [{ studentId: "s1", records: {
      [knownId]: savedRecord("A"), [removedId]: savedRecord("H")
    } }]
  };
  const records = collectGuidedReadingCompletionRecords(options);
  assert.equal(records.find(row => row.bookId === knownId).levelLabel, "App level C");
  assert.equal(records.find(row => row.bookId === removedId).sourceLevel, "H");
  const { workbook, data } = await createGuidedReadingCompletionWorkbook(options);
  assert.equal(data.studentSummaryRows[0].highestLevel, "C");
  const completion = workbook.getWorksheet("Student completion");
  assert.ok(cellRows(completion)[0].includes("Book App level"));
  assert.deepEqual(new Set(cellRows(completion).slice(1).map(row => row[4])), new Set(["App level C", "App level pending"]));
  const summary = workbook.getWorksheet("Student summary");
  assert.ok(cellRows(summary)[0].includes("Highest Book App level completed"));
  assert.equal(cellRows(summary)[1][4], "App level C");
});

test("text and student workbook exports resolve by ID even when callers supply a legacy level", async () => {
  const summaries = [knownId, removedId].map(bookId => ({
    bookId, title: bookId, type: "nonfiction", level: "H", correct: 0,
    attempted: 1, accuracy: 0, supportWords: ["dog"], pageNotes: []
  }));
  const text = buildReadingMasteryTextReport({ generatedAt: stamp, guidedReadingSummaries: summaries });
  assert.match(text, /gr-a-26 \(nonfiction, App level C\)/);
  assert.match(text, /removed-book-with-saved-H \(nonfiction, App level pending\)/);
  assert.doesNotMatch(text, /Level H/);
  const workbook = await createStudentReportWorkbook({
    generatedAt: stamp,
    workspace: { guidedReading: {
      books: summaries.map(row => ({ ...row, readCount: 1 })),
      wordRows: summaries.map(row => ({ ...row, word: "dog", statusLabel: "Needs support in this book" }))
    } }
  });
  const rows = cellRows(workbook.getWorksheet("Guided reading"));
  assert.equal(rows.filter(row => row.includes("Book App level")).length, 2);
  assert.equal(rows.filter(row => row.includes("App level C")).length, 2);
  assert.equal(rows.filter(row => row.includes("App level pending")).length, 2);
  assert.ok(!rows.some(row => row.includes("H")), "caller-supplied saved H must not leak into either table");
});

function findFunction(node, name) {
  if (!node || typeof node !== "object") return null;
  if (node.type === "FunctionDeclaration" && node.id?.name === name) return node;
  for (const value of Object.values(node)) {
    const children = Array.isArray(value) ? value : [value];
    for (const child of children) {
      if (child && typeof child === "object") {
        const result = findFunction(child, name);
        if (result) return result;
      }
    }
  }
  return null;
}

test("App reading export exercises A-H counts, pending completions and every book-level column", async () => {
  const source = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
  const node = findFunction(parse(source, { sourceType: "module", plugins: ["jsx"] }), "exportReadingReport");
  assert.ok(node);
  const g = GUIDED_READING_BOOK_INDEX.find(book => book.appReadingLevel === "G");
  const h = GUIDED_READING_BOOK_INDEX.find(book => book.appReadingLevel === "H");
  assert.ok(g && h, "the catalogue supplies real G and H books");
  const records = Object.fromEntries([knownId, g.id, h.id, removedId].map(id => [id, savedRecord("A")]));
  const workbook = new ExcelJS.Workbook();
  let message = "";
  const run = vm.runInNewContext(`(${source.slice(node.start, node.end)})`, {
    APP_READING_LEVELS, getPublicBookMetadata,
    loadGuidedReadingBooksModule: async () => readingModule,
    createExcelWorkbook: async () => workbook,
    guidedReadingRecords: records, studentName: "Reader", studentId: "s1",
    classList: [], selectedClassId: "", formatExportDateForFilename: () => "2026-10-29",
    safeExportFilename: value => value, formatReportDate: value => value || "",
    addWorkbookExportProvenance: async () => {}, downloadBlob: () => {}, Blob,
    setMessage: value => { message = value; }, console
  });
  await run();
  assert.equal(message, "Reading report Excel exported.");
  const metrics = new Map(cellRows(workbook.getWorksheet("Summary")).slice(1));
  for (const level of APP_READING_LEVELS) assert.ok(metrics.has(`Book App level ${level} count`));
  assert.equal(metrics.get("Book App level A count"), 0, "the saved A is not a current book level");
  assert.equal(metrics.get("Book App level C count"), 1);
  assert.equal(metrics.get("Book App level G count"), 1);
  assert.equal(metrics.get("Book App level H count"), 1);
  assert.equal(metrics.get("Book App level pending count"), 1);
  assert.equal(metrics.get("Total Books Read"), 4, "removed-book completion evidence is retained");
  assert.ok(![...metrics.keys()].some(key => /^Level [A-F] count$/.test(key)));
  for (const sheet of workbook.worksheets.slice(1)) {
    assert.ok(cellRows(sheet)[0].includes("Book App level"), sheet.name);
  }
  assert.ok(cellRows(workbook.getWorksheet("Completed Books")).some(row => row.includes("App level pending")));
});
