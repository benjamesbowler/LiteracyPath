import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const PREVIEW_CLASS_A_ID = "00000000-0000-4000-8000-0000000000a1";
const PREVIEW_CLASS_B_ID = "00000000-0000-4000-8000-0000000000b2";

// Teacher-area redesign v2: Settings opens on a grid of doorway cards and each
// card opens the section that already existed. The sections keep their
// bookmarkable URLs; what changed is that you reach them from a card rather
// than from a permanent left-hand rail, so a section change is now two history
// entries (back to the overview, then into the next section).
const SETTINGS_SECTIONS = [
  { id: "school", card: "Open school information", heading: "School name" },
  { id: "site", card: "Manage classes", heading: "Classes and groups" },
  { id: "privacy", card: "Open data rights", heading: "Download or delete student data" },
  { id: "account", card: "Open teacher account", heading: "Teacher account" }
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

// An empty section means the card overview, whose address is the bare route.
async function expectSettingsRoute(page, section, classId) {
  await expect.poll(() => {
    const hash = new URL(page.url()).hash;
    const [path, query = ""] = hash.replace(/^#/, "").split("?");
    return {
      path,
      classId: new URLSearchParams(query).get("class") || ""
    };
  }).toEqual({
    path: section ? `teacher/settings/${section}` : "teacher/settings",
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
    name: "Back to settings",
    exact: true
  })).toBeVisible();
}

async function expectSettingsOverview(page) {
  const shell = page.locator('main[data-teacher-intent="settings"]');
  await expect(shell.getByRole("heading", {
    name: "Class and account",
    exact: true
  })).toBeVisible({ timeout: 20_000 });
  for (const section of SETTINGS_SECTIONS) {
    await expect(shell.getByRole("button", {
      name: section.card,
      exact: true
    })).toBeVisible();
  }
}

async function openSettingsCard(page, section) {
  const expected = SETTINGS_SECTIONS.find(item => item.id === section);
  await page.locator('main[data-teacher-intent="settings"]').getByRole("button", {
    name: expected.card,
    exact: true
  }).click();
}

async function backToSettings(page) {
  await page.locator('main[data-teacher-intent="settings"]').getByRole("button", {
    name: "Back to settings",
    exact: true
  }).click();
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

  await page.goto(`/#teacher/settings?class=${AUDIT_CLASS_A_ID}`);
  await expectSettingsOverview(page);
  await expectSettingsRoute(page, "", AUDIT_CLASS_A_ID);

  for (const section of SETTINGS_SECTIONS) {
    await openSettingsCard(page, section.id);
    await expectSettingsSection(page, section.id);
    await expectSettingsRoute(page, section.id, AUDIT_CLASS_A_ID);
    await backToSettings(page);
    await expectSettingsOverview(page);
    await expectSettingsRoute(page, "", AUDIT_CLASS_A_ID);
  }

  for (const section of [...SETTINGS_SECTIONS].reverse()) {
    await page.goBack();
    await expectSettingsSection(page, section.id);
    await expectSettingsRoute(page, section.id, AUDIT_CLASS_A_ID);
    await page.goBack();
    await expectSettingsOverview(page);
    await expectSettingsRoute(page, "", AUDIT_CLASS_A_ID);
  }
  for (const section of SETTINGS_SECTIONS) {
    await page.goForward();
    await expectSettingsSection(page, section.id);
    await expectSettingsRoute(page, section.id, AUDIT_CLASS_A_ID);
    await page.goForward();
    await expectSettingsOverview(page);
    await expectSettingsRoute(page, "", AUDIT_CLASS_A_ID);
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

  await backToSettings(page);
  await expectSettingsOverview(page);
  await expectSettingsRoute(page, "", PREVIEW_CLASS_B_ID);

  await openSettingsCard(page, "privacy");
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
  await expectSettingsOverview(page);
  await expectSettingsRoute(page, "", PREVIEW_CLASS_B_ID);
  await page.goBack();
  await expectSettingsSection(page, "site");
  await expectSettingsRoute(page, "site", PREVIEW_CLASS_B_ID);
  await page.goForward();
  await expectSettingsOverview(page);
  await expectSettingsRoute(page, "", PREVIEW_CLASS_B_ID);
  await page.goForward();
  await expectSettingsSection(page, "privacy");
  await expectSettingsRoute(page, "privacy", PREVIEW_CLASS_B_ID);
  await page.goForward();
  await expectSettingsSection(page, "privacy");
  await expectSettingsRoute(page, "privacy", PREVIEW_CLASS_A_ID);
  expect(browserErrors).toEqual([]);
});
