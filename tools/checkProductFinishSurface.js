#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const failures = [];

function readProjectFile(path) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function requireText(file, needle, message) {
  const source = readProjectFile(file);
  if (!source.includes(needle)) {
    failures.push(message || `${file} is missing "${needle}"`);
  }
}

[
  "## Section 6: Teacher Export Center, Product Finish, And Final Contract Closure",
  "Status: complete in this pass.",
  "six implementation sections"
].forEach(needle => {
  requireText("docs/product-polish-roadmap.md", needle, `Product polish roadmap is missing Section 6 marker: ${needle}`);
});

[
  'id: "exports"',
  'label: "Exports"',
  "Export Center",
  "EL Formal Assessments",
  "formal-report-controls",
  "el-report-control-column",
  "uppercaseName",
  "lowercaseSound",
  "Export Student Excel",
  "Export Guided Reading Excel"
].forEach(needle => {
  requireText("src/components/AdminDashboardPage.jsx", needle, `Teacher export center is missing "${needle}".`);
});

[
  ".formal-evidence-field-list",
  ".el-assessment-export-row",
  ".el-report-control-column"
].forEach(needle => {
  requireText("src/App.css", needle, `Teacher export center styling is missing "${needle}".`);
});

[
  "check:teacher-dashboard-data",
  "check:product-finish-surface"
].forEach(needle => {
  requireText("package.json", needle, `package.json is missing "${needle}".`);
});

if (failures.length) {
  console.error("Product-finish surface check failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Product-finish surface check passed.");
