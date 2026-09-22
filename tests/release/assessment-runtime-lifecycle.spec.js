import { expect, test } from "@playwright/test";

const PAGE = "/tests/fixtures/assessment-runtime-lifecycle.html";
test.setTimeout(120_000);
test.beforeEach(async ({ page }) => {
  page.runtimeErrors = [];
  page.on("pageerror", error => page.runtimeErrors.push(error.message));
  await page.route("**/src/supabaseClient*", route => route.fulfill({ contentType: "application/javascript", body: `
    export const isSupabaseConfigured = true;
    const response = {data:null,error:null};
    function builder(table) { const value = { then: (yes,no) => Promise.resolve(response).then(yes,no) };
      for (const method of ['select','insert','upsert','update','eq','in','order','limit','single','maybeSingle']) value[method] = (...args) => { if (['insert','upsert'].includes(method)) { const rows=JSON.parse(localStorage.getItem('runtime-test-writes')||'[]');rows.push({table,method,rows:args[0]});localStorage.setItem('runtime-test-writes',JSON.stringify(rows)); } return value; }; return value; }
    export const supabase = { table:builder, from:builder, call:async(name,args)=>{ const rows=JSON.parse(localStorage.getItem('runtime-test-writes')||'[]'); rows.push({rpc:name,args}); localStorage.setItem('runtime-test-writes',JSON.stringify(rows)); return {data:{ok:true},error:null}; }, auth:{getSession:async()=>({data:{session:{user:{id:'runtime-integration-teacher'}}},error:null}),getUser:async()=>({data:{user:{id:'runtime-integration-teacher'}},error:null})} };`
  }));
  await page.goto(PAGE);
  await expect(page.getByRole("button", { name: "Start Initial Sounds", exact: true })).toBeVisible({ timeout: 30_000 });
});
test.afterEach(async ({ page }) => { expect(page.runtimeErrors).toEqual([]); });
async function answer(page, correct = true) {
  await expect.poll(() => page.evaluate(() => Boolean(window.assessmentIntegration?.state.currentQuestion && !window.assessmentIntegration.state.assessmentTransitioning))).toBe(true);
  await expect(page.locator('[data-assessment-question-id][aria-busy="false"]').last()).toBeVisible();
  await page.evaluate(right => window.assessmentIntegration[right ? "correct" : "incorrect"](), correct);
}
async function finish(page, count) { for (let index = 0; index < count; index++) await answer(page); await expect(page.getByText("Assessment complete", { exact: true })).toBeVisible(); }
async function snapshot(page) { return page.evaluate(() => ({ state: window.assessmentIntegration.state, plan: window.assessmentIntegration.plan, attempts: window.assessmentIntegration.attempts() })); }

test("real runner keeps Initial Sounds phase-specific and learner summaries isolated", async ({ page }, info) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.getByRole("button", { name: "Start Initial Sounds", exact: true }).click();
  await finish(page, 10);
  let result = await snapshot(page);
  expect(result.attempts).toHaveLength(1);
  expect(new Set(result.attempts[0].questionRecords.map(row => row.phase))).toEqual(new Set([1]));
  expect(result.state.checkpointDecision.skillStatus.level1.passed).toBe(false);
  await page.getByRole("button", { name: "Continue Level 1 Phase 2", exact: true }).click();
  await finish(page, 10);
  result = await snapshot(page);
  expect(result.state.checkpointDecision.skillStatus.level1.passed).toBe(true);
  await page.getByRole("button", { name: "Switch learner", exact: true }).click();
  await page.getByRole("button", { name: "Start Initial Sounds", exact: true }).click();
  for (let i = 0; i < 10; i++) await answer(page, false);
  await expect(page.getByText("Assessment complete", { exact: true })).toBeVisible();
  result = await snapshot(page);
  expect(result.state.checkpointDecision.skillStatus.nextSkillUnlocked).toBe(false);
  const writes = await page.evaluate(() => JSON.parse(localStorage.getItem("runtime-test-writes") || "[]"));
  expect(writes.filter(row => row.table === "mastery" && row.rows.student_id === "B").at(-1).rows.mastered).toBe(false);
  await page.screenshot({ path: info.outputPath("learner-isolation.png") });
  expect(errors).toEqual([]);
});

test("stop/restart cannot stitch passes; reload resumes the same complete form", async ({ page }) => {
  let abandonedIds = [];
  for (let pass = 0; pass < 2; pass++) {
    await page.getByRole("button", { name: "Start Nouns", exact: true }).click();
    for (let i = 0; i < 4; i++) await answer(page);
    const current = await snapshot(page);
    expect(current.plan.questionIds.some(id => abandonedIds.includes(id))).toBe(false);
    abandonedIds = current.plan.questionIds;
    await page.getByRole("button", { name: "Stop check", exact: true }).click();
  }
  await page.getByRole("button", { name: "Start Nouns", exact: true }).click();
  await answer(page);
  const before = await snapshot(page);
  expect(before.plan.phase).toBe(1);
  expect(before.attempts).toHaveLength(0);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(window.assessmentIntegration?.state.currentQuestion))).toBe(true);
  const resumed = await snapshot(page);
  expect(resumed.plan.questionIds).toEqual(before.plan.questionIds);
  expect(resumed.state.roundAnswers).toHaveLength(1);
  await finish(page, 7);
  const after = await snapshot(page);
  expect(after.attempts).toHaveLength(1);
  expect(after.attempts[0].questionRecords).toHaveLength(8);
  expect(after.state.checkpointDecision.skillStatus.level1.phases[1].passed).toBe(true);
  expect(after.state.checkpointDecision.skillStatus.level1.phases[2].passed).toBe(false);
});

test("failed recorded replay replaces the question unscored and the full sitting still completes", async ({ page }, info) => {
  const heldRoutes = []; let failAudio = false;
  await page.route("**/*.mp3", route => { if (failAudio) return route.abort("failed"); heldRoutes.push(route); });
  await page.getByRole("button", { name: "Start Rhyming", exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(window.assessmentIntegration?.state.currentQuestion))).toBe(true);
  const oldId = (await snapshot(page)).state.currentQuestion.id;
  const replay = page.getByRole("button", { name: /Hear (the )?word|Listen to (the )?word|Replay word/i }).first();
  if (await replay.count()) await replay.click();
  else await page.evaluate(() => { void window.assessmentIntegration.replay(); });
  await expect.poll(() => page.evaluate(() => Boolean(window.assessmentIntegration.plan.audioPending))).toBe(true);
  await page.evaluate(() => { void window.assessmentIntegration.correct(); });
  expect((await snapshot(page)).state.roundAnswers).toHaveLength(0);
  failAudio = true;
  await Promise.all(heldRoutes.map(route => route.abort("failed")));
  await expect.poll(() => page.evaluate(id => window.assessmentIntegration?.state.currentQuestion?.id !== id && Boolean(window.assessmentIntegration?.state.currentQuestion), oldId)).toBe(true);
  let result = await snapshot(page);
  expect(result.state.roundAnswers).toHaveLength(0);
  expect(result.plan.mediaFailures).toHaveLength(1);
  expect(result.plan.mediaFailures[0].responseStatus).toBe("media_failed");
  await page.unroute("**/*.mp3");
  await finish(page, result.plan.sittingSize);
  result = await snapshot(page);
  expect(result.attempts[0].questionRecords.filter(row => row.responseStatus === "media_failed")).toHaveLength(1);
  expect(result.state.checkpointDecision.skillStatus.evidence.scored).toBe(result.plan.sittingSize);
  await page.screenshot({ path: info.outputPath("audio-failure-recovered.png") });
});

test("exhausted media offers a working reload without passing a short form", async ({ page }) => {
  await page.route("**/*.mp3", route => route.abort("failed"));
  await page.getByRole("button", { name: "Start Rhyming", exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(window.assessmentIntegration?.state.currentQuestion))).toBe(true);
  await page.evaluate(() => window.assessmentIntegration.restrictToSitting());
  await page.getByRole("button", { name: /Hear (the )?word|Listen to (the )?word|Replay word/i }).first().click();
  await expect(page.getByRole("button", { name: "Try loading the check again" })).toBeVisible();
  let result = await snapshot(page);
  expect(result.attempts).toHaveLength(0);
  expect(result.state.roundAnswers).toHaveLength(0);
  await page.unroute("**/*.mp3");
  await page.getByRole("button", { name: "Try loading the check again" }).click();
  await expect.poll(() => page.evaluate(() => Boolean(window.assessmentIntegration?.state.currentQuestion))).toBe(true);
  result = await snapshot(page);
  await finish(page, result.plan.sittingSize);
  expect((await snapshot(page)).attempts).toHaveLength(1);
});

test("slow evidence images block scored taps and actual image failure replaces the item", async ({ page }) => {
  const held = [], imageRoute = /\/images\/.*\.(?:webp|png|jpe?g)(?:\?.*)?$/;
  await page.route(imageRoute, route => { held.push(route); });
  await page.getByRole("button", { name: "Start Initial Sounds", exact: true }).click();
  await expect(page.getByText("Loading the pictures…", { exact: true })).toBeVisible();
  const before = await snapshot(page);
  const card = page.locator(`[data-assessment-question-id="${before.state.currentQuestion.id}"]`);
  await expect(card).toHaveAttribute("inert", "");
  await card.locator("button").first().click({ force: true });
  expect((await snapshot(page)).state.roundAnswers).toHaveLength(0);
  await page.unroute(imageRoute);
  await Promise.all(held.map(route => route.abort("failed")));
  await expect.poll(() => page.evaluate(id => Boolean(window.assessmentIntegration.state.currentQuestion) && window.assessmentIntegration.state.currentQuestion.id !== id, before.state.currentQuestion.id)).toBe(true);
  const result = await snapshot(page);
  expect(result.state.roundAnswers).toHaveLength(0);
  expect(result.plan.mediaFailures[0].mediaKind).toBe("picture");
  await finish(page, result.plan.sittingSize);
});

test("real retention route waits three days and eight reserved answers produce Secure", async ({ page }, info) => {
  await page.evaluate(async () => {
    const { getSkillBlueprint } = await import("/src/content/blueprints/skillBlueprints.js");
    const skillId = "nouns", size = getSkillBlueprint(skillId).sitting, timestamp = new Date(Date.now() - 4 * 86400000).toISOString();
    for (const level of [1,2]) for (const phase of [1,2]) window.assessmentIntegration.seed({studentId:"A",skillId,skillName:"Nouns",skillLevel:level,skillPhase:phase,attemptId:`seed-${level}-${phase}`,assessmentType:"skill_checkpoint",administrationStatus:"completed",totalQuestions:size,completedAt:timestamp,questionRecords:Array.from({length:size},(_,i)=>({questionId:`seed-${level}-${phase}-${i}`,skillId,level,phase,itemKey:getSkillBlueprint(skillId).unitsByLevel[level][0],isCorrect:true,responseStatus:"correct",timestamp}))});
  });
  await page.getByRole("button", { name: "Start Nouns", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Retention check · Nouns" })).toBeVisible();
  let result = await snapshot(page);
  expect(result.plan.mode).toBe("retention");
  expect(result.plan.questionIds).toHaveLength(8);
  await finish(page, 8);
  result = await snapshot(page);
  expect(result.state.checkpointDecision.skillStatus.status).toBe("secure");
  await expect(page.getByText("Practice needed", { exact: true })).toHaveCount(0);
  await expect(page.getByText("More coverage needed", { exact: true })).toHaveCount(0);
  expect(result.state.checkpointDecision.coverage.total).toBe(7);
  expect(result.attempts.find(row => row.assessmentType === "retention").questionRecords).toHaveLength(8);
  await page.screenshot({ path: info.outputPath("retention-secure.png") });
});

test("a token-scoped assignment keeps its phase and recognizes compact prior evidence", async ({ page }) => {
  await page.evaluate(() => {
    const timestamp = new Date().toISOString();
    window.assessmentIntegration.assignFocus({ id: "assigned-session", teacher_id: "runtime-integration-teacher", class_id: "local-test-class", target: "skills_assessment", resolved_config: { skill_id: "nouns", level: 1, phase: 2 }, prior_attempts: [{
      attemptId: "prior-phase-one", skillId: "nouns", skillLevel: 1, skillPhase: 1, totalQuestions: 8, completedAt: timestamp,
      questionRecords: Array.from({ length: 8 }, (_, i) => ({ questionId: `prior-${i}`, level: 1, phase: 1, itemKey: "common_nouns", responseStatus: "correct", isCorrect: true, timestamp }))
    }] });
  });
  await expect.poll(() => page.evaluate(() => window.assessmentIntegration.state.studentFocusSession?.id)).toBe("assigned-session");
  await page.getByRole("button", { name: "Start Nouns", exact: true }).click();
  await finish(page, 8);
  const result = await snapshot(page);
  expect(result.state.checkpointDecision.skillStatus.level1.passed).toBe(true);
  const writes = await page.evaluate(() => JSON.parse(localStorage.getItem("runtime-test-writes") || "[]"));
  const answers = writes.filter(row => row.rpc === "student_save_focus_assessment_answer");
  expect(answers).toHaveLength(8);
  expect(answers.every(row => row.args.p_session_id === "assigned-session" && row.args.p_answer.level === 1 && row.args.p_answer.phase === 2)).toBe(true);
  const completed = writes.find(row => row.rpc === "student_complete_focus_assessment");
  expect(completed.args.p_attempt.skillLevel).toBe(1);
  expect(completed.args.p_attempt.skillPhase).toBe(2);
  expect(new Set(completed.args.p_attempt.questionRecords.map(row => row.phase))).toEqual(new Set([2]));
});
