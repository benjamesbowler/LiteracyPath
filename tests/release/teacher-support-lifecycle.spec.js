import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { localDateKey } from "../../src/utils/teacherInterventions.js";
import { completeTeacherClassEntry } from "./support/teacherLanding.js";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const TEACHER_EMAIL = "audit-teacher-a@literacypath.invalid";
const TEACHER_ID = "10000000-0000-4000-8000-000000000001";
const CLASS_ID = "30000000-0000-4000-8000-000000000001";
const STUDENT_ID = "40000000-0000-4000-8000-000000000001";
const PREFIX = `Browser support ${Date.now()}`;
const TEMP_CLASS_ID = randomUUID();
const TEMP_STUDENT_ID = randomUUID();
const TEMP_CLASS_NAME = `${PREFIX} switch class`;
const TEMP_STUDENT_NAME = `${PREFIX} learner`;
const interventionIds = [];

let api;

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

async function login(page) {
  const password = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
  if (!password) throw new Error("LP_AUDIT_TEACHER_PASSWORD is required.");
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill(TEACHER_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page);
}

async function selectTodayClass(page, className) {
  const select = page.getByLabel("Current class");
  await expect(select).toBeEnabled();
  await select.selectOption({ label: className });
  await expect(select.locator("option:checked")).toHaveText(className);
  return select;
}

async function seedIntervention(values) {
  const result = await api.rpc("teacher_create_intervention_plan", {
    p_class_id: CLASS_ID,
    p_owner_label: "Browser lifecycle gate",
    p_group_label: values.group_label,
    p_student_ids: [STUDENT_ID],
    p_focus: "Initial sounds",
    p_activity: "Short guided practice",
    p_planned_for: values.planned_for
  });
  if (result.error) throw new Error(`Support fixture failed: ${result.error.message}`);
  interventionIds.push(result.data.id);
  if (["delivered", "recorded"].includes(values.status)) {
    const delivered = await api.rpc("teacher_mark_intervention_delivered", {
      p_intervention_id: result.data.id
    });
    if (delivered.error) throw new Error(`Support delivery fixture failed: ${delivered.error.message}`);
  }
  if (values.status === "recorded") {
    const recorded = await api.rpc("teacher_record_intervention_outcome", {
      p_intervention_id: result.data.id,
      p_outcome: values.outcome,
      p_outcome_note: values.outcome_note
    });
    if (recorded.error) throw new Error(`Support outcome fixture failed: ${recorded.error.message}`);
  }
}

test.beforeAll(async () => {
  const url = process.env.LP_AUDIT_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.LP_AUDIT_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const password = process.env.LP_AUDIT_TEACHER_PASSWORD;
  if (!url || !key || !password) {
    throw new Error("Audit Supabase URL, anon key, and teacher password are required.");
  }
  api = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const loginResult = await api.auth.signInWithPassword({ email: TEACHER_EMAIL, password });
  if (loginResult.error) throw new Error(`Fixture login failed: ${loginResult.error.message}`);

  const classResult = await api.from("classes").insert({
    id: TEMP_CLASS_ID,
    teacher_id: TEACHER_ID,
    name: TEMP_CLASS_NAME
  });
  if (classResult.error) throw new Error(`Switch-class fixture failed: ${classResult.error.message}`);
  const studentResult = await api.from("students").insert({
    id: TEMP_STUDENT_ID,
    class_id: TEMP_CLASS_ID,
    teacher_id: TEACHER_ID,
    name: TEMP_STUDENT_NAME
  });
  if (studentResult.error) throw new Error(`Switch-student fixture failed: ${studentResult.error.message}`);

  await seedIntervention({
    group_label: `${PREFIX} due today`,
    planned_for: dateOffset(0),
    status: "planned"
  });
  await seedIntervention({
    group_label: `${PREFIX} taught`,
    planned_for: dateOffset(-1),
    status: "delivered"
  });
  await seedIntervention({
    group_label: `${PREFIX} observed`,
    planned_for: dateOffset(-1),
    status: "recorded",
    outcome: "partial",
    outcome_note: "Needed another model"
  });
  await seedIntervention({
    group_label: `${PREFIX} future`,
    planned_for: dateOffset(2),
    status: "planned"
  });
});

test.afterAll(async () => {
  if (!api) return;
  for (const interventionId of interventionIds) {
    const result = await api
      .from("teacher_interventions")
      .select("status")
      .eq("id", interventionId)
      .maybeSingle();
    if (result.data?.status === "planned") {
      await api.rpc("teacher_delete_planned_intervention", {
        p_intervention_id: interventionId
      });
    } else if (result.data?.status === "delivered") {
      await api.rpc("teacher_cancel_intervention", {
        p_intervention_id: interventionId,
        p_reason: "Browser lifecycle gate cleanup"
      });
    }
  }
  await api.from("classes").delete().eq("id", TEMP_CLASS_ID);
  await api.auth.signOut();
});

test("class switching discards an open support edit and its selected learners", async ({ page }) => {
  await login(page);
  const classSelect = await selectTodayClass(page, "Audit Class A");
  const support = page.locator("details.teacher-dashboard-secondary");
  await expect(support).toHaveAttribute("open", "");

  const futureCard = page.getByRole("article", {
    name: `Support plan for ${PREFIX} future`,
    exact: true
  });
  await futureCard.getByRole("button", { name: "Edit or reschedule", exact: true }).click();
  const planner = page.locator(".teacher-intervention-planner");
  await expect(planner.getByLabel("Aarav", { exact: true })).toBeChecked();
  await planner.getByLabel("Group name").fill(`${PREFIX} stale draft`);

  await classSelect.selectOption({ label: TEMP_CLASS_NAME });
  await expect(support).not.toHaveAttribute("open", "");
  await support.locator(":scope > summary").click();
  await expect(page.getByText(`${PREFIX} stale draft`, { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Plan support", exact: true }).click();

  const replacementPlanner = page.locator(".teacher-intervention-planner");
  await expect(replacementPlanner.getByLabel(TEMP_STUDENT_NAME, { exact: true })).not.toBeChecked();
  await expect(replacementPlanner.getByLabel("Aarav", { exact: true })).toHaveCount(0);
  await expect(replacementPlanner.getByRole("button", { name: "Save support plan", exact: true }))
    .toBeDisabled();
});

test("due, taught, and observed support all return to Today after a reload", async ({ page }) => {
  await login(page);
  await selectTodayClass(page, "Audit Class A");

  const expectedQueue = [
    [`${PREFIX} due today`, "Teaching action is due today"],
    [`${PREFIX} taught`, "Support was taught — add what happened"],
    [`${PREFIX} observed`, "Observation saved — review the support"]
  ];
  for (const [group, label] of expectedQueue) {
    const item = page.locator(".teacher-intervention-today li").filter({ hasText: group });
    await expect(item.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.locator("details.teacher-dashboard-secondary > summary"))
    .toContainText("to do");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await selectTodayClass(page, "Audit Class A");
  for (const [group, label] of expectedQueue) {
    const item = page.locator(".teacher-intervention-today li").filter({ hasText: group });
    await expect(item.getByText(label, { exact: true })).toBeVisible();
  }
});

test("a planned support correction survives refresh and an untaught draft can be deleted", async ({
  page
}) => {
  await login(page);
  await selectTodayClass(page, "Audit Class A");
  const futureCardName = `Support plan for ${PREFIX} future`;
  let card = page.getByRole("article", { name: futureCardName, exact: true });
  await card.getByRole("button", { name: "Edit or reschedule", exact: true }).click();

  const planner = page.locator(".teacher-intervention-planner");
  const correctedGroup = `${PREFIX} corrected`;
  await planner.getByLabel("Group name").fill(correctedGroup);
  await planner.getByLabel("Teaching date").fill(dateOffset(3));
  await planner.getByRole("button", { name: "Save plan changes", exact: true }).click();
  await expect(page.getByText(`Support plan updated for ${correctedGroup}.`, { exact: true }))
    .toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await selectTodayClass(page, "Audit Class A");
  card = page.getByRole("article", {
    name: `Support plan for ${correctedGroup}`,
    exact: true
  });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Delete draft", exact: true }).click();
  const deleteConfirmation = card.getByRole("group", {
    name: `Delete support draft for ${correctedGroup}`,
    exact: true
  });
  await deleteConfirmation.getByRole("button", { name: "Delete draft", exact: true }).click();
  await expect(page.getByRole("article", {
    name: `Support plan for ${correctedGroup}`,
    exact: true
  })).toHaveCount(0);

  const supportHistory = page.locator("details.teacher-intervention-history");
  await supportHistory.locator(":scope > summary").click();
  await expect(
    supportHistory.getByText("Untaught draft deleted", { exact: true }).first()
  ).toBeVisible();
  await page.reload();
  await selectTodayClass(page, "Audit Class A");
  await page.locator("details.teacher-intervention-history > summary").click();
  await expect(page.getByText("Untaught draft deleted", { exact: true }).first()).toBeVisible();
});

test("taught support can be cancelled with a durable reason and delivery history", async ({
  page
}) => {
  await login(page);
  await selectTodayClass(page, "Audit Class A");

  const taughtCard = page.getByRole("article", {
    name: `Support plan for ${PREFIX} taught`,
    exact: true
  });
  await taughtCard.getByRole("button", { name: "Cancel taught support", exact: true }).click();
  const cancelConfirmation = taughtCard.getByRole("group", {
    name: `Cancel taught support for ${PREFIX} taught`,
    exact: true
  });
  await cancelConfirmation.getByLabel("Reason for cancelling")
    .fill("Timetable changed after teaching");
  await cancelConfirmation.getByRole("button", {
    name: "Cancel taught support",
    exact: true
  }).click();

  const cancelledHistory = page.locator("details.teacher-intervention-cancelled-history");
  await cancelledHistory.locator(":scope > summary").click();
  await expect(page.getByRole("article", {
    name: `Cancelled support plan for ${PREFIX} taught`,
    exact: true
  })).toContainText("Timetable changed after teaching");

  await page.locator("details.teacher-intervention-history > summary").click();
  await expect(page.getByText("Support marked as taught", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Taught support cancelled", { exact: true }).first()).toBeVisible();

  await page.reload();
  await selectTodayClass(page, "Audit Class A");
  await page.locator("details.teacher-intervention-cancelled-history > summary").click();
  await expect(page.getByRole("article", {
    name: `Cancelled support plan for ${PREFIX} taught`,
    exact: true
  })).toContainText("Timetable changed after teaching");
});
