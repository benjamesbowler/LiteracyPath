import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData
} from "../src/data/elAssessmentReportStore.js";
import {
  createClassElAssessmentWorkbook,
  createStudentElAssessmentWorkbook
} from "../src/utils/exportElAssessmentExcel.js";
import {
  createGuidedReadingCompletionWorkbook
} from "../src/utils/exportGuidedReadingCompletionExcel.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(repoRoot, "tests", "fixtures", "exportCompatibility.snapshot.json");
const distAssetsPath = path.join(repoRoot, "dist", "assets");
const generatedAt = "2026-07-23T12:00:00.000Z";
const maxHeapGrowthBytes = 160 * 1024 * 1024;
const maxRssGrowthBytes = 224 * 1024 * 1024;

function ordered(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(ordered);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, ordered(item)])
  );
}

function compactStyle(cell) {
  const style = {};
  if (cell.numFmt && cell.numFmt !== "General") style.numFmt = cell.numFmt;
  if (cell.font && Object.keys(cell.font).length) style.font = ordered(cell.font);
  if (cell.fill && Object.keys(cell.fill).length) style.fill = ordered(cell.fill);
  if (cell.border && Object.keys(cell.border).length) style.border = ordered(cell.border);
  if (cell.alignment && Object.keys(cell.alignment).length) style.alignment = ordered(cell.alignment);
  if (cell.protection && Object.keys(cell.protection).length) style.protection = ordered(cell.protection);
  return style;
}

function normalizeWorkbook(workbook) {
  return {
    creator: workbook.creator || "",
    worksheets: workbook.worksheets.map(sheet => ({
      name: sheet.name,
      state: sheet.state,
      views: ordered(sheet.views || []),
      merges: [...(sheet.model?.merges || [])].sort(),
      columns: Array.from({ length: sheet.actualColumnCount }, (_, index) => {
        const column = sheet.getColumn(index + 1);
        return {
          width: column.width ?? null,
          hidden: Boolean(column.hidden)
        };
      }),
      rows: Array.from({ length: sheet.actualRowCount }, (_, rowIndex) => {
        const row = sheet.getRow(rowIndex + 1);
        return {
          height: row.height ?? null,
          hidden: Boolean(row.hidden),
          cells: Array.from({ length: sheet.actualColumnCount }, (_, columnIndex) => {
            const cell = row.getCell(columnIndex + 1);
            return {
              value: ordered(cell.value),
              style: compactStyle(cell)
            };
          })
        };
      })
    }))
  };
}

function workbookSummary(normalized) {
  return {
    sheetNames: normalized.worksheets.map(sheet => sheet.name),
    rows: normalized.worksheets.reduce((sum, sheet) => sum + sheet.rows.length, 0),
    cells: normalized.worksheets.reduce(
      (sum, sheet) => sum + sheet.rows.reduce((rowSum, row) => rowSum + row.cells.length, 0),
      0
    )
  };
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function serializeAndNormalize(workbook) {
  const module = await import("exceljs");
  const ExcelJS = module.default || module["module.exports"] || module;
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  return {
    buffer,
    normalized: normalizeWorkbook(reloaded)
  };
}

function guidedReadingFixture(itemCount = 2) {
  const records = {};
  for (let index = 0; index < itemCount; index += 1) {
    const number = String(index + 1).padStart(3, "0");
    records[`snapshot-book-${number}`] = {
      title: `Snapshot Book ${number}`,
      seriesTitle: "Compatibility Readers",
      level: index % 2 === 0 ? "A" : "B",
      totalPages: 4,
      completedPages: 4,
      completed: true,
      completedAt: `2026-07-${String((index % 20) + 1).padStart(2, "0")}T09:00:00.000Z`,
      lastReadAt: `2026-07-${String((index % 20) + 1).padStart(2, "0")}T09:30:00.000Z`,
      readCount: (index % 3) + 1,
      pages: {
        "1": {
          wordMarks: {
            [`word-${number}`]: true
          }
        }
      }
    };
  }
  return {
    generatedAt,
    classes: [{ id: "snapshot-class", name: "Snapshot Class" }],
    students: [{
      id: "snapshot-student",
      name: "Snapshot Student",
      class_id: "snapshot-class"
    }],
    guidedReadingRecordsByStudent: [{
      studentId: "snapshot-student",
      records
    }]
  };
}

function elReports() {
  const students = [{
    id: "snapshot-student",
    name: "Snapshot Student",
    class_id: "snapshot-class"
  }];
  const classes = [{ id: "snapshot-class", name: "Snapshot Class" }];
  const studentAssessmentHistory = [{
    attemptId: "snapshot-letter-attempt",
    assessmentType: "el_letter_assessment",
    skillId: "el_letter_assessment",
    skillName: "Letter Name and Sound Recognition",
    studentId: "snapshot-student",
    studentName: "Snapshot Student",
    classId: "snapshot-class",
    teacherId: "snapshot-teacher",
    administrationStatus: "completed",
    completedAt: "2026-07-22T10:05:00.000Z",
    updatedAt: "2026-07-22T10:05:00.000Z",
    totalQuestions: 1,
    correctCount: 1,
    accuracy: 100,
    passed: true,
    questionRecords: [{
      questionId: "snapshot-uppercase-m-name",
      itemType: "letter_name",
      itemKey: "m",
      targetLetter: "M",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: "2026-07-22T10:04:00.000Z"
    }]
  }];
  const student = buildStudentElAssessmentReportData({
    assessmentHistory: studentAssessmentHistory,
    students,
    classes,
    studentId: "snapshot-student",
    classId: "snapshot-class",
    teacherId: "snapshot-teacher",
    now: generatedAt
  });
  const classReport = buildClassElAssessmentReportData({
    students,
    classes,
    classId: "snapshot-class",
    teacherId: "snapshot-teacher",
    now: generatedAt
  });
  return {
    student: {
      ...student,
      reportId: "snapshot-student-report",
      generatedAt
    },
    classReport: {
      ...classReport,
      reportId: "snapshot-class-report",
      generatedAt
    }
  };
}

async function currentSnapshots() {
  const reports = elReports();
  const guidedReading = await createGuidedReadingCompletionWorkbook(guidedReadingFixture());
  const workbooks = {
    guidedReading: guidedReading.workbook,
    studentEl: await createStudentElAssessmentWorkbook(reports.student),
    classEl: await createClassElAssessmentWorkbook(reports.classReport)
  };
  const snapshots = {};
  const normalizedWorkbooks = {};
  for (const [id, workbook] of Object.entries(workbooks)) {
    const { normalized } = await serializeAndNormalize(workbook);
    normalizedWorkbooks[id] = normalized;
    snapshots[id] = {
      sha256: digest(normalized),
      ...workbookSummary(normalized)
    };
  }
  return { snapshots, normalizedWorkbooks };
}

function assertLazyCspCompatibleBundle() {
  if (!existsSync(distAssetsPath)) {
    throw new Error("dist/assets is missing; run npm run build before the export compatibility gate.");
  }
  const sourceFiles = [
    "src/utils/metricDefinitions.js",
    "src/utils/exportElAssessmentExcel.js",
    "src/utils/exportGuidedReadingCompletionExcel.js"
  ];
  for (const relativePath of sourceFiles) {
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
    assert.doesNotMatch(
      source,
      /(?:^|\n)\s*import\s+[^(\n]+?\s+from\s+["']exceljs["']/,
      `${relativePath} must not statically import ExcelJS`
    );
    assert.match(source, /import\(["']exceljs["']\)/, `${relativePath} must lazy-load ExcelJS`);
  }

  const files = readdirSync(distAssetsPath);
  const exportChunk = files.find(file => /^report-export-libs-.*\.js$/.test(file));
  assert.ok(exportChunk, "the user-action-only report export chunk is missing");
  const exportSource = readFileSync(path.join(distAssetsPath, exportChunk), "utf8");
  assert.doesNotMatch(exportSource, /(^|[^\w$.])eval\s*\(/, "the report export chunk contains direct eval");
  const lazyLoaderChunks = files.filter(file => (
    /^(?:metricDefinitions|exportElAssessmentExcel|exportGuidedReadingCompletionExcel)-.*\.js$/.test(file)
  ));
  assert.equal(lazyLoaderChunks.length, 3, "the three report export loader chunks are missing");
  for (const loaderChunk of lazyLoaderChunks) {
    const loaderSource = readFileSync(path.join(distAssetsPath, loaderChunk), "utf8");
    assert.match(
      loaderSource,
      new RegExp(`import\\([^)]*${exportChunk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      `${loaderChunk} must lazy-load the report library`
    );
  }

  const entryMetadata = JSON.parse(
    readFileSync(path.join(repoRoot, "dist", "bundle-metadata.json"), "utf8")
  ).chunks.find(chunk => chunk.isEntry);
  assert.ok(entryMetadata, "bundle metadata has no entry chunk");
  const entrySource = readFileSync(path.join(repoRoot, "dist", entryMetadata.fileName), "utf8");
  assert.ok(
    lazyLoaderChunks.some(loaderChunk => entrySource.includes(loaderChunk)),
    "the main app must reach a lazy report loader"
  );
  assert.doesNotMatch(
    entrySource,
    new RegExp(`(?:^|;)import[^;(]*${exportChunk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    "the main app statically imports the report library"
  );
}

async function assertLargeExportMemory() {
  global.gc?.();
  const before = process.memoryUsage();
  const samples = [before];
  const { workbook } = await createGuidedReadingCompletionWorkbook(guidedReadingFixture(500));
  samples.push(process.memoryUsage());
  const module = await import("exceljs");
  const ExcelJS = module.default || module["module.exports"] || module;
  const buffer = await workbook.xlsx.writeBuffer();
  samples.push(process.memoryUsage());
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  samples.push(process.memoryUsage());

  const rowCount = reloaded.getWorksheet("Student completion")?.actualRowCount || 0;
  assert.equal(rowCount, 501, "the 500-item export lost rows after XLSX serialization");
  const heapGrowthBytes = Math.max(...samples.map(sample => sample.heapUsed)) - before.heapUsed;
  const rssGrowthBytes = Math.max(...samples.map(sample => sample.rss)) - before.rss;
  assert.ok(
    heapGrowthBytes <= maxHeapGrowthBytes,
    `500-item export heap growth ${heapGrowthBytes} exceeds ${maxHeapGrowthBytes}`
  );
  assert.ok(
    rssGrowthBytes <= maxRssGrowthBytes,
    `500-item export RSS growth ${rssGrowthBytes} exceeds ${maxRssGrowthBytes}`
  );
  return {
    rows: rowCount - 1,
    xlsxBytes: buffer.byteLength,
    heapGrowthBytes,
    rssGrowthBytes
  };
}

async function main() {
  const { snapshots, normalizedWorkbooks } = await currentSnapshots();
  if (process.argv.includes("--print-normalized")) {
    console.log(JSON.stringify({ schemaVersion: 1, normalizedWorkbooks }, null, 2));
    return;
  }
  if (process.argv.includes("--print-snapshots")) {
    console.log(JSON.stringify({ schemaVersion: 1, snapshots }, null, 2));
    return;
  }
  const expected = JSON.parse(readFileSync(snapshotPath, "utf8"));
  assert.equal(expected.schemaVersion, 1);
  assert.deepEqual(snapshots, expected.snapshots, "export semantic snapshots changed");
  assertLazyCspCompatibleBundle();
  const memory = await assertLargeExportMemory();
  console.log(
    `Export compatibility passed: 3 semantic snapshots, lazy CSP-safe chunk, `
    + `${memory.rows} rows, ${memory.xlsxBytes} XLSX bytes, `
    + `${memory.heapGrowthBytes} heap bytes, ${memory.rssGrowthBytes} RSS bytes.`
  );
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
