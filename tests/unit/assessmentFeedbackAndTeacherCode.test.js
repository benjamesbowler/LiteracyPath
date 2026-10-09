import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const appPagesSource = readFileSync(
  new URL("../../src/components/AppPages.jsx", import.meta.url),
  "utf8"
);
const teacherContextSource = readFileSync(
  new URL("../../src/components/teacher/TeacherContextBar.jsx", import.meta.url),
  "utf8"
);
const appSurfaceSource = readFileSync(
  new URL("../../src/components/AppSurface.jsx", import.meta.url),
  "utf8"
);

test("assessment feedback is concise and has no extra-click controls", () => {
  const start=appPagesSource.indexOf("const renderFeedbackCard =");
  const section=appPagesSource.slice(start,appPagesSource.indexOf("const hasValidAssessmentTransitionState",start));
  const expression=section.match(/<h2>\{([\s\S]+?)\}<\/h2>/)?.[1];
  assert.ok(expression,"feedback must keep one concise heading");
  const heading=(independentAssessment,childPractice,isCorrect,practiceFeedbackOnly=false)=>vm.runInNewContext(expression,{independentAssessment,childPractice,practiceFeedbackOnly,feedback:{isCorrect}});
  assert.equal(heading(true,false,false),"Answer saved");
  assert.equal(heading(false,false,true),"Correct");
  assert.equal(heading(false,false,false),"Incorrect");
  assert.equal(heading(false,true,false),"Not yet");
  assert.equal(heading(false,true,false,true),"Incorrect");
  assert.equal(heading(false,true,null),"Next time");
  assert.match(appPagesSource, /<p>\{feedback\.explanation\}<\/p>/);
  assert.match(appPagesSource, /feedback-auto-advance">Next question…/);
  assert.match(appPagesSource, /actions\.setFeedback\(null\);\s*actions\.pickQuestion\(\);/);
  assert.doesNotMatch(appPagesSource, /← Change my answer/);
});

test("teacher context bar keeps the student sign-in code beside the class", () => {
  assert.match(teacherContextSource, /School and class/);
  assert.match(teacherContextSource, /Student sign-in code/);
  assert.match(teacherContextSource, /Copy student sign-in code \$\{classCode\}/);
  assert.match(appSurfaceSource, /access_code/);
  assert.match(appSurfaceSource, /accessCode/);
});
