import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

test("teacher report copy uses student and assessment language", async t => {
  const vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  t.after(() => vite.close());
  const { teacherReportText } = await vite.ssrLoadModule(
    "/src/components/reports/teacherReportCopy.jsx"
  );
  assert.equal(
    teacherReportText("This child completed two checks and was checked."),
    "This student completed two assessments and was checked."
  );
  assert.equal(
    teacherReportText("Children with saved check results"),
    "Students with saved assessment results"
  );
  assert.equal(
    teacherReportText("Check the student details, then check again."),
    "Review the student details, then review again."
  );
  assert.equal(
    teacherReportText("The learner is not checked yet."),
    "The student is not checked yet."
  );
  assert.equal(teacherReportText(4), 4);
  assert.equal(teacherReportText(null), null);
});
