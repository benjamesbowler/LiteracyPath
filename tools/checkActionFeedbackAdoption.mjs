import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

const requiredAdoptions = [
  {
    file: "src/components/AppSurface.jsx",
    required: ["LazyActionFeedback", "el-benchmark-hub-message"],
    forbidden: [
      /className=\{`message el-benchmark-hub-message/
    ]
  },
  {
    file: "src/components/TeacherDashboardPage.jsx",
    required: ["ActionFeedback", "kind: \"undo\"", "Undo archive for"],
    forbidden: [
      /teacher-class-code-status" role="status"/,
      /message teacher-dashboard-message/
    ]
  },
  {
    file: "src/components/FinishedReportPage.jsx",
    required: ["kind: \"pending\"", "kind: \"success\"", "kind: \"error\"", "feedback={actionFeedback}"],
    forbidden: [/setExportStatus\(/]
  },
  {
    file: "src/components/reports/StudentReportShell.jsx",
    required: ["ActionFeedback", "feedback={feedback || statusMessage}"],
    forbidden: [/<p className="lg-report-live-message"/]
  },
  {
    file: "src/components/reports/ElFormalAssessmentsPanel.jsx",
    required: ["ActionFeedback", "kind: \"pending\"", "kind: \"success\"", "kind: \"error\""],
    forbidden: [/<p className="message" role="status"/]
  }
];

const failures = [];
for (const adoption of requiredAdoptions) {
  const source = read(adoption.file);
  for (const token of adoption.required) {
    if (!source.includes(token)) failures.push(`${adoption.file}: missing ${JSON.stringify(token)}`);
  }
  for (const pattern of adoption.forbidden) {
    if (pattern.test(source)) failures.push(`${adoption.file}: forbidden ad-hoc feedback pattern ${pattern}`);
  }
}

const componentSource = read("src/components/ActionFeedback.jsx");
for (const semantic of [
  "aria-atomic=\"true\"",
  "aria-live={isError ? \"assertive\" : \"polite\"}",
  "aria-busy={normalized.kind === \"pending\" ? \"true\" : undefined}",
  "role={isError ? \"alert\" : \"status\"}",
  "data-action-feedback"
]) {
  if (!componentSource.includes(semantic)) {
    failures.push(`src/components/ActionFeedback.jsx: missing semantic contract ${semantic}`);
  }
}

if (failures.length) {
  console.error("Shared action feedback adoption guard failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Shared action feedback adoption guard passed: clipboard, sync, loading, print, export, and undo use one semantic pattern.");
}
