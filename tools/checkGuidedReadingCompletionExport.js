#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  createGuidedReadingCompletionWorkbook,
  GUIDED_READING_COMPLETION_HEADERS,
  GUIDED_READING_COMPLETION_SHEETS
} from "../src/utils/exportGuidedReadingCompletionExcel.js";

const failures = [];
const adminSource = readFileSync(new URL("../src/components/AdminDashboardPage.jsx", import.meta.url), "utf8");
const helperSource = readFileSync(new URL("../src/utils/exportGuidedReadingCompletionExcel.js", import.meta.url), "utf8");

if (!adminSource.includes("Export Guided Reading Completion Excel")) {
  failures.push("Dashboard export button text is missing.");
}
if (!helperSource.includes("exportGuidedReadingCompletionExcel")) {
  failures.push("Guided Reading completion export helper is missing.");
}

const { workbook, data } = await createGuidedReadingCompletionWorkbook({
  classes: [{ id: "class-1", name: "Class A" }],
  students: [{ id: "student-1", name: "Sample Student", class_id: "class-1" }],
  guidedReadingRecordsByStudent: [{
    studentId: "student-1",
    records: {
      "missing-book-id": {
        title: "Old Removed Book",
        level: "A",
        completed: true,
        completedAt: "2026-05-01T00:00:00.000Z",
        lastReadAt: "2026-05-02T00:00:00.000Z",
        readCount: 2,
        completedPages: 4,
        totalPages: 4,
        pages: {
          0: { wordMarks: { 0: "correct", 1: "support" } }
        }
      }
    }
  }]
});

const sheetNames = workbook.worksheets.map(sheet => sheet.name);
Object.values(GUIDED_READING_COMPLETION_SHEETS).forEach(sheetName => {
  if (!sheetNames.includes(sheetName)) failures.push(`Workbook missing sheet: ${sheetName}`);
});

Object.entries(GUIDED_READING_COMPLETION_HEADERS).forEach(([key, headers]) => {
  const sheet = workbook.getWorksheet(GUIDED_READING_COMPLETION_SHEETS[key]);
  const actualHeaders = sheet.getRow(1).values.slice(1);
  headers.forEach(header => {
    if (!actualHeaders.includes(header)) failures.push(`${sheet.name} missing header: ${header}`);
  });
});

if (data.totals.totalCompletedBooks !== 1) {
  failures.push("Mock completed book was not counted.");
}
if (data.studentCompletionRows[0]?.bookTitle !== "Old Removed Book") {
  failures.push("Missing book lookup fallback did not preserve record title.");
}

const emptyResult = await createGuidedReadingCompletionWorkbook({
  classes: [],
  students: [],
  guidedReadingRecordsByStudent: []
});
if (!emptyResult.workbook.getWorksheet("Summary")) {
  failures.push("Empty export did not create Summary sheet.");
}

if (failures.length) {
  console.error("Guided Reading completion export contract failures:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Guided Reading completion export contract passed.");
console.log(`Workbook sheets: ${sheetNames.join(", ")}`);
console.log(`Mock completed books: ${data.totals.totalCompletedBooks}`);
