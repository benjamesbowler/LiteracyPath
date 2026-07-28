import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const PREVIEW_CLASS_A_ID = "00000000-0000-4000-8000-0000000000a1";
const PREVIEW_CLASS_B_ID = "00000000-0000-4000-8000-0000000000b2";

const SETTINGS_SECTIONS = [
  { id: "school", button: "School information", heading: "School name" },
  { id: "site", button: "Class sign-in", heading: "Code expiry and leaderboard" },
  { id: "privacy", button: "Student privacy", heading: "Download or delete student data" },
  { id: "account", button: "Teacher account", heading: "Teacher account" }
];

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the Settings route gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" })
    .fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

function recordBrowserErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(`page: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function expectSettingsRoute(page, section, classId) {
  await expect.poll(() => {
    const hash = new URL(page.url()).hash;
    const [path, query = ""] = hash.replace(/^#/, "").split("?");
    return {
      path,
      classId: new URLSearchParams(query).get("class") || ""
    };
  }).toEqual({
    path: `teacher/settings/${section}`,
    classId
  });
}

async function expectSettingsSection(page, section) {
  const expected = SETTINGS_SECTIONS.find(item => item.id === section);
  const shell = page.locator('main[data-teacher-intent="settings"]');
  await expect(shell.getByRole("heading", {
    name: expected.heading,
    exact: true
  })).toBeVisible({ timeout: 20_000 });
  await expect(shell.getByRole("button", {
    name: expected.button,
    exact: true
  })).toHaveAttribute("aria-current", "page");
}

test("all Settings subsection URLs survive rendering, reload, Back, and Forward", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);
  await logIn(page);

  for (const section of SETTINGS_SECTIONS) {
    await page.goto(
      `/#teacher/settings/${section.id}?class=${AUDIT_CLASS_A_ID}`
    );
    await expectSettingsSection(page, section.id);
    await expectSettingsRoute(page, section.id, AUDIT_CLASS_A_ID);

    await page.reload();
    await expectSettingsSection(page, section.id);
    await expectSettingsRoute(page, section.id, AUDIT_CLASS_A_ID);
  }

  await page.goto(
    `/#teacher/settings/school?class=${AUDIT_CLASS_A_ID}`
  );
  await expectSettingsSection(page, "school");
  for (const section of SETTINGS_SECTIONS.slice(1)) {
    await page.getByRole("button", {
      name: section.button,
      exact: true
    }).click();
    await expectSettingsSection(page, section.id);
    await expectSettingsRoute(page, section.id, AUDIT_CLASS_A_ID);
  }

  for (const section of [...SETTINGS_SECTIONS].reverse().slice(1)) {
    await page.goBack();
    await expectSettingsSection(page, section.id);
    await expectSettingsRoute(page, section.id, AUDIT_CLASS_A_ID);
  }
  for (const section of SETTINGS_SECTIONS.slice(1)) {
    await page.goForward();
    await expectSettingsSection(page, section.id);
    await expectSettingsRoute(page, section.id, AUDIT_CLASS_A_ID);
  }
  expect(browserErrors).toEqual([]);
});

test("class changes keep the active Settings subsection and history context", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);
  await page.goto(
    `/preview/teacher-a11y.html?surface=settings#teacher/settings/site?class=${PREVIEW_CLASS_A_ID}`
  );
  await expectSettingsSection(page, "site");

  const settings = page.locator('main[data-teacher-intent="settings"]');
  const classSelect = settings.getByRole("combobox", {
    name: "Class",
    exact: true
  });
  await expect(classSelect).toHaveValue(PREVIEW_CLASS_A_ID);
  await classSelect.selectOption(PREVIEW_CLASS_B_ID);
  await expectSettingsRoute(page, "site", PREVIEW_CLASS_B_ID);
  await expectSettingsSection(page, "site");

  await settings.getByRole("button", {
    name: "Student privacy",
    exact: true
  }).click();
  await expectSettingsSection(page, "privacy");
  await expectSettingsRoute(page, "privacy", PREVIEW_CLASS_B_ID);

  const privacyClassSelect = settings.getByRole("combobox", {
    name: "Class",
    exact: true
  });
  await expect(privacyClassSelect).toHaveValue(PREVIEW_CLASS_B_ID);
  await privacyClassSelect.selectOption(PREVIEW_CLASS_A_ID);
  await expectSettingsRoute(page, "privacy", PREVIEW_CLASS_A_ID);
  await expectSettingsSection(page, "privacy");

  await page.goBack();
  await expectSettingsSection(page, "privacy");
  await expectSettingsRoute(page, "privacy", PREVIEW_CLASS_B_ID);
  await page.goBack();
  await expectSettingsSection(page, "site");
  await expectSettingsRoute(page, "site", PREVIEW_CLASS_B_ID);
  await page.goForward();
  await expectSettingsSection(page, "privacy");
  await expectSettingsRoute(page, "privacy", PREVIEW_CLASS_B_ID);
  await page.goForward();
  await expectSettingsSection(page, "privacy");
  await expectSettingsRoute(page, "privacy", PREVIEW_CLASS_A_ID);
  expect(browserErrors).toEqual([]);
});
