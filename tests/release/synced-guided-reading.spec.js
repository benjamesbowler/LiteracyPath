import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const liveReady = Boolean(url && anonKey && teacherPassword);

async function expectNoSeriousAccessibilityFindings(page, selector) {
  const result = await new AxeBuilder({ page }).include(selector).analyze();
  expect(result.violations.filter(item => (
    item.impact === "serious" || item.impact === "critical"
  ))).toEqual([]);
}

async function studentSession(client, student, classRow, index) {
  const { data, error } = await client.rpc("student_login", {
    p_student_id: student.id,
    p_sequence: student.symbol_password,
    p_device_id: `reading-e2e-${Date.now()}-${index}`,
    p_code: classRow.access_code
  });
  if (error || data?.ok === false) throw error || new Error(data?.error || "student login failed");
  return {
    token: data.token,
    studentId: data.student_id,
    studentName: data.student_name,
    classId: data.class_id,
    teacherId: data.teacher_id,
    schoolId: data.school_id,
    expiresAt: Date.now() + 11 * 60 * 60 * 1000
  };
}

async function openStudentContext(browser, session) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await context.addInitScript(value => {
    window.localStorage.setItem("lp-student-session-v1", JSON.stringify(value));
  }, session);
  const page = await context.newPage();
  await page.goto("/");
  return { context, page };
}

test("@synced-guided-reading one teacher keeps two student iPads on the frozen page list", async ({ browser }) => {
  test.skip(!liveReady, "Live Supabase and the audit teacher password are required.");
  test.setTimeout(120_000);

  const teacherApi = createClient(url, anonKey);
  const anonymousApi = createClient(url, anonKey, { auth: { persistSession: false } });
  const signIn = await teacherApi.auth.signInWithPassword({
    email: "audit-teacher-a@literacypath.invalid",
    password: teacherPassword
  });
  expect(signIn.error).toBeNull();
  const { data: classes } = await teacherApi.from("classes")
    .select("id,name,access_code")
    .eq("teacher_id", signIn.data.user.id)
    .order("created_at")
    .limit(1);
  const classRow = classes?.[0];
  expect(classRow).toBeTruthy();
  const { data: children } = await teacherApi.from("students")
    .select("id,name,symbol_password")
    .eq("class_id", classRow.id)
    .is("archived_at", null)
    .order("name")
    .limit(2);
  expect(children).toHaveLength(2);

  const sessions = await Promise.all(children.map((child, index) => (
    studentSession(anonymousApi, child, classRow, index)
  )));
  const teacherContext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const teacherPage = await teacherContext.newPage();
  const studentDevices = await Promise.all(sessions.map(session => openStudentContext(browser, session)));

  try {
    await teacherPage.goto("/");
    await teacherPage.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
    await teacherPage.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
    await teacherPage.getByLabel("Password", { exact: true }).fill(teacherPassword);
    await teacherPage.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(teacherPage.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
    await teacherPage.getByLabel("Current class").selectOption(classRow.id);
    await teacherPage.getByRole("button", { name: "Start reading together" }).click();

    const setup = teacherPage.getByRole("dialog", { name: "Start reading together" });
    await expectNoSeriousAccessibilityFindings(teacherPage, ".reading-session-setup");
    await setup.locator(".reading-session-book-grid button").first().click();
    await setup.getByRole("button", { name: "Continue", exact: true }).click();
    for (const child of children) await setup.getByLabel(new RegExp(`^${child.name}`)).check();
    await setup.getByRole("button", { name: "Start reading", exact: true }).click();
    await expect(teacherPage.getByLabel("Reading together controls")).toBeVisible();
    await expectNoSeriousAccessibilityFindings(teacherPage, ".reading-session-bar");

    for (const device of studentDevices) {
      await expect(device.page.getByLabel("Reading together")).toBeVisible({ timeout: 3000 });
      await expect(device.page.getByText("Page 1 of", { exact: false })).toBeAttached();
    }

    await teacherPage.getByRole("button", { name: "Next", exact: true }).click();
    await teacherPage.getByRole("button", { name: "Next", exact: true }).click();
    for (const device of studentDevices) {
      await expect(device.page.getByText("Page 3 of", { exact: false })).toBeAttached({ timeout: 3000 });
    }

    await teacherPage.getByRole("button", { name: "Previous", exact: true }).click();
    for (const device of studentDevices) {
      await expect(device.page.getByText("Page 2 of", { exact: false })).toBeAttached({ timeout: 3000 });
    }

    await teacherPage.getByRole("button", { name: "End session", exact: true }).click();
    await teacherPage.getByRole("dialog", { name: "End reading session" })
      .getByRole("button", { name: "End session", exact: true }).click();
    for (const device of studentDevices) {
      await expect(device.page.getByText("All done reading!", { exact: true })).toBeVisible({ timeout: 3000 });
      await expect(device.page.getByLabel("Reading together")).toHaveCount(0, { timeout: 5000 });
    }
  } finally {
    const { data: active } = await teacherApi.from("reading_sessions")
      .select("id")
      .eq("status", "active");
    for (const session of active || []) {
      await teacherApi.rpc("teacher_end_reading_session", { p_session_id: session.id });
    }
    await Promise.all(studentDevices.map(device => device.context.close()));
    await teacherContext.close();
    await teacherApi.auth.signOut();
  }
});
