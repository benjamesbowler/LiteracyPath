#!/usr/bin/env node

import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/App.css", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../src/components/AdminDashboardPage.jsx", import.meta.url), "utf8");
const appPages = readFileSync(new URL("../src/components/AppPages.jsx", import.meta.url), "utf8");
const learnArea = readFileSync(new URL("../src/components/LearnAreaPage.jsx", import.meta.url), "utf8");
const failures = [];

function expect(source, token, message) {
  if (!source.includes(token)) failures.push(message);
}

expect(dashboard, "Choose dashboard section", "Teacher Dashboard mobile section dropdown is missing.");
expect(dashboard, "teacher-section-select", "Teacher Dashboard section select class is missing.");
expect(dashboard, "detailed-report-controls", "Detailed report controls must use responsive control grid.");
expect(dashboard, "EL Formal Assessments", "Teacher Dashboard reports must expose EL Formal Assessments.");
expect(dashboard, "formal-report-controls", "EL Formal Assessment controls must use responsive controls.");
expect(dashboard, "bounded-report-table", "Detailed report tables must be bounded/sectioned.");
expect(dashboard, "detailed-report-section", "Reports must use expandable/sectioned layout.");
expect(dashboard, "No guided reading records yet", "Guided Reading report empty state is missing.");

expect(css, "@media (max-width: 640px)", "Mobile breakpoint is missing.");
expect(css, ".teacher-dashboard .admin-section-tabs", "Teacher Dashboard tabs must be hidden/replaced on mobile.");
expect(css, ".teacher-dashboard .teacher-section-select", "Teacher Dashboard mobile selector CSS is missing.");
expect(css, ".admin-table thead", "Responsive table card conversion is missing.");
expect(css, ".bounded-report-table", "Bounded report table CSS is missing.");
expect(css, ".detailed-report-controls", "Detailed report responsive controls CSS is missing.");
expect(css, ".formal-report-controls", "EL Formal Assessment responsive controls CSS is missing.");
expect(css, ".detailed-report-section-toggles", "Report section checkbox layout CSS is missing.");
expect(css, ".detailed-report-actions", "Report export actions mobile stacking CSS is missing.");
expect(css, ".guided-reader-shell.fullscreen .guided-page-controls", "Guided Reading fullscreen controls must have mobile-safe layout.");
expect(css, ".guided-reader-shell.fullscreen .guided-page-layout", "Guided Reading fullscreen page layout must be constrained.");
expect(appPages, "guided-fullscreen-info", "Guided Reading fullscreen mode must explain the reduced reading/listening controls.");
expect(appPages, "Previous", "Guided Reading fullscreen mode must expose Previous control.");
expect(appPages, "Next", "Guided Reading fullscreen mode must expose Next control.");
expect(learnArea, "learn-mobile-cycle-select", "Learn Area mobile cycle selector is missing.");
expect(learnArea, "learn-mobile-section-select", "Learn Area mobile section selector is missing.");
expect(learnArea, "learn-fullscreen-mode", "Learn Area full-screen lesson mode is missing.");
expect(learnArea, "Exit Learn Mode", "Learn Area full-screen mode must expose Exit Learn Mode.");
expect(learnArea, "learn-section-cards", "Learn Area visual section cards are missing.");
expect(learnArea, "learn-letter-tile", "Learn Area letter tiles are missing.");
expect(learnArea, "learn-hfw-card", "Learn Area HFW cards are missing.");
expect(learnArea, "worksheet-generator", "Learn Area worksheet generator is missing.");

if (appPages.includes(">Reports</button>") || appPages.includes("goToReports")) {
  failures.push("Standalone Reports main navigation returned.");
}

if (/img\s+[^>]*src=["']https?:\/\//.test(learnArea)) {
  failures.push("Learn Area should not hotlink external images.");
}

if (/(^|[^!])\bisTeacherMode\s*&&\s*activeSection\s*===\s*"assessmentAudio"/.test(dashboard)) {
  failures.push("Technical Assessment Audio Coverage must not render in teacher mode.");
}

if (failures.length) {
  console.error(failures.map(item => `FAIL: ${item}`).join("\n"));
  process.exit(1);
}

console.log("Mobile layout contracts passed.");
