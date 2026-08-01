import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_AREAS,
  ADMIN_SECTION_PATHS,
  openAdminSection
} from "./adminNavigation.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const supabaseUrl = process.env.LP_AUDIT_SUPABASE_URL
  || process.env.VITE_SUPABASE_URL
  || "";
const supabaseKey = process.env.LP_AUDIT_SUPABASE_ANON_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
  || "";

const ADMIN_SECTIONS = [
  ...Object.entries(ADMIN_AREAS.school.sections).map(([sectionId, label]) => ({
    area: "school",
    sectionId,
    label,
    path: ADMIN_SECTION_PATHS[sectionId]
  })),
  ...Object.entries(ADMIN_AREAS.technical.sections).map(([sectionId, label]) => ({
    area: "technical",
    sectionId,
    label,
    path: ADMIN_SECTION_PATHS[sectionId]
  }))
];

test.describe.configure({ timeout: 180_000 });

async function logInAdmin(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the Admin route gate.");
  }
  await page.goto("/");
  await page.getByRole("button", {
    name: "Teachers: Literacy Guide Teacher Tools"
  }).click();
  await page.getByRole("textbox", { name: "Email address" })
    .fill("audit-admin@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true }))
    .toBeVisible({ timeout: 20_000 });
}

async function expectAdminSection(page, section) {
  await expect.poll(() => new URL(page.url()).pathname).toBe(section.path);
  if (section.sectionId === "questionFlags") {
    await expect(page.getByRole("heading", {
      name: "Reported questions",
      exact: true
    })).toBeVisible({ timeout: 20_000 });
    return;
  }

  await expect(page.getByRole("heading", {
    name: "Admin Dashboard",
    exact: true
  })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", {
    name: section.area === "school" ? "School administration" : "App checks",
    exact: true
  })).toHaveAttribute("aria-pressed", "true");

  const picker = page.getByRole("combobox", {
    name: section.area === "school"
      ? "Choose a school admin page"
      : "Choose an app check",
    exact: true
  });
  if (await picker.isVisible()) {
    await expect(picker).toHaveValue(section.sectionId);
    return;
  }
  await expect(
    page.getByRole("navigation", {
      name: section.area === "school"
        ? "School administration pages"
        : "App checks",
      exact: true
    }).getByRole("button", {
      name: new RegExp(`^${section.label}\\b`)
    })
  ).toHaveAttribute("aria-current", "page");
}

async function createPendingTeacherRequest() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Local Supabase URL and publishable key are required.");
  }
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `admin-review-${suffix}@literacypath.invalid`;
  const api = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  const { error } = await api.auth.signUp({
    email,
    password: `Review-${suffix}-Pass!`,
    options: {
      data: {
        account_status: "pending",
        username: `review_${suffix.replace(/[^a-z0-9]/gi, "").slice(-18)}`,
        display_name: "Admin Review Teacher",
        school_name: "[AUDIT ONLY] LiteracyPath Seed School"
      }
    }
  });
  await api.auth.signOut();
  expect(error, error?.message).toBeNull();
  return email;
}

test("all 17 Admin pages own cold links, reload and browser history", async ({
  page
}) => {
  await logInAdmin(page);

  for (const section of ADMIN_SECTIONS) {
    await page.goto(section.path);
    await expectAdminSection(page, section);
  }

  for (const sectionId of ["signups", "coverage", "questionFlags"]) {
    const section = ADMIN_SECTIONS.find(row => row.sectionId === sectionId);
    await page.goto(section.path);
    await expectAdminSection(page, section);
    await page.reload();
    await expectAdminSection(page, section);
  }

  await page.goto(ADMIN_SECTION_PATHS.overview);
  const historySections = [
    ADMIN_SECTIONS.find(row => row.sectionId === "schools"),
    ADMIN_SECTIONS.find(row => row.sectionId === "release"),
    ADMIN_SECTIONS.find(row => row.sectionId === "guidedMediaQa")
  ];
  for (const section of historySections) {
    await openAdminSection(page, section.area, section.sectionId);
    await expectAdminSection(page, section);
  }
  for (const section of [...historySections].reverse().slice(1)) {
    await page.goBack();
    await expectAdminSection(page, section);
  }
  for (const section of historySections.slice(1)) {
    await page.goForward();
    await expectAdminSection(page, section);
  }

  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Dashboard", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Today", exact: true }))
    .toBeVisible();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await expect(page).toHaveURL(/#teacher\/dashboard/);
});

test("every Admin page remains addressable through the compact mobile picker", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await logInAdmin(page);
  for (const section of ADMIN_SECTIONS) {
    await page.goto(section.path);
    await expectAdminSection(page, section);
  }
});

test("teacher request decisions confirm, prevent double-submit and retry failures", async ({
  page
}) => {
  const requestEmail = await createPendingTeacherRequest();
  await logInAdmin(page);
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await openAdminSection(page, "school", "signups");

  let accountRow = page.getByRole("row").filter({ hasText: requestEmail });
  await expect(accountRow).toBeVisible({ timeout: 20_000 });
  await expect(accountRow).toContainText("[AUDIT ONLY] LiteracyPath Seed School");

  await accountRow.getByRole("button", { name: "Approve", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Confirm approval" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(accountRow).toContainText("pending");

  await accountRow.getByRole("button", { name: "Reject", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Confirm rejection" });
  const confirm = dialog.getByRole("button", {
    name: "Confirm rejection",
    exact: true
  });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Reason for rejection")
    .fill("Employment could not be confirmed by the school.");
  await expect(confirm).toBeEnabled();

  let releaseFailedRequest;
  let markRequestStarted;
  const requestStarted = new Promise(resolve => {
    markRequestStarted = resolve;
  });
  const holdFailedRequest = new Promise(resolve => {
    releaseFailedRequest = resolve;
  });
  let interceptedRequests = 0;
  await page.route("**/rest/v1/rpc/admin_set_teacher_account_status", async route => {
    interceptedRequests += 1;
    markRequestStarted();
    await holdFailedRequest;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Temporary review failure" })
    });
  });

  await confirm.click();
  await requestStarted;
  await expect(dialog.getByRole("button", {
    name: "Saving decision…",
    exact: true
  })).toBeDisabled();
  expect(interceptedRequests).toBe(1);
  releaseFailedRequest();
  await expect(dialog.getByRole("alert"))
    .toContainText("decision was not saved");
  await page.unroute("**/rest/v1/rpc/admin_set_teacher_account_status");

  await dialog.getByRole("button", {
    name: "Confirm rejection",
    exact: true
  }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status"))
    .toContainText("Admin Review Teacher was rejected.");

  await page.getByLabel("Show reviewed accounts").check();
  accountRow = page.getByRole("row").filter({ hasText: requestEmail });
  await expect(accountRow).toContainText("rejected");
  await expect(accountRow)
    .toContainText("Employment could not be confirmed by the school.");
});
