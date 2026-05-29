import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

const checks = [];

function check(label, passed, detail = "") {
  checks.push({ label, passed, detail });
}

const app = read("src/App.jsx");
const guidedExport = read("src/utils/exportGuidedReadingCompletionExcel.js");
const elExport = read("src/utils/exportElAssessmentExcel.js");
const gitignore = read(".gitignore");
const viteConfig = read("vite.config.js");

check(
  "Guided Reading Excel export uses dynamic ExcelJS import",
  /await\s+import\(["']exceljs["']\)/.test(guidedExport) && !/from\s+["']exceljs["']/.test(guidedExport),
  "ExcelJS must not be statically imported into startup chunks."
);
check(
  "EL assessment Excel export uses dynamic ExcelJS import",
  /await\s+import\(["']exceljs["']\)/.test(elExport) && !/from\s+["']exceljs["']/.test(elExport),
  "ExcelJS must not be statically imported into startup chunks."
);
check(
  "AdminDashboardPage is lazy-loaded",
  /const\s+AdminDashboardPage\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(["']@\/components\/AdminDashboardPage["']\)/s.test(app),
  "Teacher/admin dashboard should stay outside the initial student runtime."
);
check(
  "Vite chunks admin media inventory separately",
  /admin-media-inventory/.test(viteConfig) && /publicMediaInventory/.test(viteConfig),
  "Admin media inventory should remain split from the main app chunk."
);
check(
  ".gitignore excludes dist output",
  /^\/?dist\/?$/m.test(gitignore) || /^\/dist\/$/m.test(gitignore),
  "Local build output should not be committed."
);
check(
  ".gitignore excludes stuck build output",
  /dist_stuck_\*\//.test(gitignore) || /\/dist_stuck_\*\//.test(gitignore),
  "Stuck build folders should not be committed."
);
check(
  ".gitignore excludes delete-quarantine folders",
  /_DELETE_ME_\*\//.test(gitignore) || /\/_DELETE_ME_\*\//.test(gitignore),
  "Local quarantine/delete folders should not be committed."
);
check(
  "Performance audit doc exists",
  exists("docs/implementation/app_performance_audit.md"),
  "docs/implementation/app_performance_audit.md should be present."
);

console.log("Performance Contract Check");
console.table(checks.map(item => ({
  check: item.label,
  passed: item.passed ? "yes" : "no"
})));

const failures = checks.filter(item => !item.passed);
if (failures.length) {
  console.error(failures.map(item => `- ${item.label}: ${item.detail}`).join("\n"));
  process.exit(1);
}
