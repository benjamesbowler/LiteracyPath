import { expect, test } from "@playwright/test";

const CLASS_A_ID = "00000000-0000-4000-8000-0000000000a1";
const CLASS_B_ID = "00000000-0000-4000-8000-0000000000b2";
const previewOrigin = process.env.PLAYWRIGHT_PREVIEW_ORIGIN || "";

function recordBrowserErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(`page: ${error.message}`));
  page.on("console", message => {
    // The isolated preview server intentionally has no hosted Supabase credentials.
    // This boot warning is outside the truth fixture; all other console errors fail.
    if (
      message.type() === "error"
      && !message.text().startsWith("[Literacy Guide] Supabase frontend environment is MISSING")
    ) {
      errors.push(`console: ${message.text()}`);
    }
  });
  return errors;
}

function settingsUrl(query = "", section = "site") {
  const search = query ? `?surface=settings&${query}` : "?surface=settings";
  return `${previewOrigin}/preview/teacher-a11y.html${search}#teacher/settings/${section}?class=${CLASS_A_ID}`;
}

test("Settings pauses class and privacy actions until current reads are complete", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);

  await page.goto(settingsUrl("settingsClassRead=loading"));
  const settings = page.getByRole("main");
  await expect(settings.getByRole("status")).toContainText("Loading classes");
  await expect(settings.getByRole("combobox", { name: "Class", exact: true }))
    .toBeDisabled();
  await expect(settings.getByRole("button", { name: "New code", exact: true }))
    .toHaveCount(0);

  await page.goto(settingsUrl("settingsClassRead=error"));
  await expect(settings.getByRole("alert")).toContainText("We couldn't load the class list");
  await settings.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(settings.getByText("READ42", { exact: true })).toBeVisible();

  await page.goto(settingsUrl("settingsClassRead=truncated"));
  await expect(settings.getByRole("alert")).toContainText("We couldn't load every class");
  await expect(settings.getByRole("button", { name: "New code", exact: true }))
    .toHaveCount(0);

  await page.goto(settingsUrl("settingsStudentRead=loading", "privacy"));
  await expect(settings.getByRole("status")).toContainText("Loading students");
  await expect(settings.getByRole("combobox", { name: "Student", exact: true }))
    .toHaveCount(0);

  await page.goto(settingsUrl("settingsStudentRead=error", "privacy"));
  await expect(settings.getByRole("alert")).toContainText("We couldn't load the student list");
  await settings.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(settings.getByRole("combobox", { name: "Student", exact: true }))
    .toBeEnabled();

  await page.goto(settingsUrl("settingsStudentRead=truncated", "privacy"));
  await expect(settings.getByRole("alert")).toContainText("We couldn't load every student");
  await expect(settings.getByRole("button", { name: "Open privacy request", exact: true }))
    .toHaveCount(0);

  await page.goto(settingsUrl("settingsProfile=loading", "school"));
  await expect(settings.getByRole("status")).toContainText("Loading account details");
  await expect(settings.getByRole("textbox", { name: "School name", exact: true }))
    .toHaveCount(0);

  await page.goto(settingsUrl("settingsProfile=loading", "account"));
  await expect(settings.getByText("Account details are still loading.", { exact: true }))
    .toBeVisible();
  await expect(settings.getByText("audit-teacher-a@literacypath.invalid", {
    exact: true
  })).toHaveCount(0);
  await expect(settings.getByRole("button", { name: "Sign out", exact: true }))
    .toBeEnabled();

  expect(browserErrors).toEqual([]);
});

test("a failed saved-school lookup cannot become an editable blank school", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);
  await page.goto(settingsUrl("settingsSchoolRead=error", "school"));
  const settings = page.getByRole("main");

  await expect(settings.getByRole("alert")).toContainText(
    "We couldn't load the saved school name"
  );
  await expect(settings.getByRole("alert")).toContainText(
    "A blank school name has not been assumed"
  );
  await expect(settings.getByRole("textbox", {
    name: "School name",
    exact: true
  })).toHaveCount(0);
  await expect(settings.getByRole("button", {
    name: "Save school information",
    exact: true
  })).toHaveCount(0);

  await settings.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(settings.getByRole("textbox", {
    name: "School name",
    exact: true
  })).toHaveValue("LiteracyPath Audit School");
  await expect(settings.getByRole("button", {
    name: "Save school information",
    exact: true
  })).toBeEnabled();

  expect(browserErrors).toEqual([]);
});

test("summary failure cannot clear or strand a successful sign-in history read", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);
  await page.goto(settingsUrl(
    "settingsAccessSummary=error&settingsAccessLog=success"
  ));
  const settings = page.getByRole("main");
  const summary = settings.locator(".teacher-class-access-summary");

  await expect(summary).toContainText(
    "We couldn't load recent sign-in activity."
  );
  await settings.getByRole("button", {
    name: "See sign-in history",
    exact: true
  }).click();

  const history = settings.getByRole("region", {
    name: "Class sign-in history"
  });
  await expect(history).toContainText("Student signed in");
  await expect(history).toContainText("Classroom tablet");
  await expect(history.getByRole("alert")).toHaveCount(0);
  await expect(summary).toContainText(
    "We couldn't load recent sign-in activity."
  );
  await expect(summary).not.toContainText("Checking recent sign-in activity");

  expect(browserErrors).toEqual([]);
});

test("a returned class code remains visible when the following class refresh fails", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);
  await page.goto(settingsUrl("settingsCodeRefresh=fail"));
  const settings = page.getByRole("main");
  await expect(settings.getByText("READ42", { exact: true })).toBeVisible();

  await settings.getByRole("button", { name: "New code", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Make a new class code?" });
  await dialog.getByRole("button", { name: "Make a new code", exact: true }).click();

  await expect(settings.getByText("READ43", { exact: true })).toBeVisible();
  await expect(settings.locator(".teacher-settings-status")).toContainText(
    "New class code READ43 is ready"
  );
  await expect(settings.locator(".teacher-settings-status")).toContainText(
    "couldn't refresh the class list"
  );
  await expect(settings.getByText(
    "Other class settings stay paused until the class list refreshes.",
    { exact: false }
  )).toBeVisible();
  await settings.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(settings.getByText("READ43", { exact: true })).toBeVisible();
  await expect(settings.locator(".teacher-settings-status"))
    .toContainText("Class list refreshed.");

  expect(browserErrors).toEqual([]);
});

test("completed deletion removes the stale student even when roster refresh fails", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);
  await page.goto(settingsUrl("settingsStudentRefresh=fail-once", "privacy"));
  const settings = page.getByRole("main");
  const studentSelect = settings.getByRole("combobox", {
    name: "Student",
    exact: true
  });
  await studentSelect.selectOption({ label: "Aarav" });
  await settings.getByRole("button", { name: "Open privacy request", exact: true })
    .click();

  const dialog = page.getByRole("dialog", { name: "Data choices for Aarav" });
  await dialog.getByLabel("Who made the request?").selectOption({
    label: "School or district"
  });
  await dialog.getByLabel("How was identity and authority verified?").selectOption({
    label: "Authorised school official"
  });
  await dialog.getByRole("button", { name: "Review deletion request", exact: true })
    .click();
  await dialog.getByLabel("Exact confirmation").fill("DELETE LEARNER DATA");
  await dialog.getByRole("button", { name: "Delete all student data", exact: true })
    .click();

  await expect(dialog).toHaveCount(0);
  await expect(studentSelect.locator("option", { hasText: "Aarav" })).toHaveCount(0);
  await expect(settings.getByRole("alert")).toContainText(
    "Aarav's data and saved results were deleted permanently"
  );
  await expect(settings.getByRole("alert")).toContainText(
    "couldn't refresh the student list"
  );
  await settings.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(settings.getByRole("status")).toContainText("Student list refreshed.");
  await expect(studentSelect.locator("option", { hasText: "Aarav" })).toHaveCount(0);

  expect(browserErrors).toEqual([]);
});

test("a held class-A save never publishes its status under class B", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);
  await page.goto(settingsUrl("settingsMutation=held"));
  const settings = page.getByRole("main");
  const classSelect = settings.getByRole("combobox", {
    name: "Class",
    exact: true
  });
  const expiry = settings.getByRole("combobox", {
    name: "Code expires",
    exact: true
  });

  await expiry.selectOption("7");
  await expect(settings.locator(".teacher-settings-status"))
    .toContainText("Saving class-code expiry");
  await classSelect.selectOption(CLASS_B_ID);
  await expect(settings.getByText("BOOK27", { exact: true })).toBeVisible();
  await page.evaluate(() => window.__releaseSettingsMutation());
  await expect(settings.getByText("Class-code expiry saved.", { exact: true }))
    .toHaveCount(0);
  await expect(expiry.locator("option:checked")).toHaveText("Never");

  await classSelect.selectOption(CLASS_A_ID);
  await expect(expiry.locator("option:checked")).toHaveText(/^Stops working on /);
  await expect(settings.getByText("Class-code expiry saved.", { exact: true }))
    .toHaveCount(0);

  expect(browserErrors).toEqual([]);
});

test("whole-school leaderboard visibility needs confirmation before one scoped save", async ({
  page
}) => {
  const browserErrors = recordBrowserErrors(page);
  await page.goto(settingsUrl());
  const settings = page.getByRole("main");
  const schoolScope = settings.getByRole("radio", { name: "Whole school", exact: true });
  const classScope = settings.getByRole("radio", { name: "This class only", exact: true });

  await expect(classScope).toBeChecked();
  await schoolScope.click();

  const dialog = page.getByRole("dialog", { name: "Show whole-school leaderboard?" });
  await expect(dialog).toContainText(
    "Show nickname-only scores from other classes at this school? No real names are shown."
  );
  await expect(classScope).toBeChecked();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();

  await expect(dialog).toHaveCount(0);
  await expect(schoolScope).toBeFocused();
  await expect(classScope).toBeChecked();
  await expect.poll(() => page.evaluate(() => window.__teacherSettingsRpcCalls || []))
    .toEqual([]);

  await schoolScope.click();
  await dialog.getByRole("button", { name: "Show whole-school board", exact: true }).click();

  await expect(schoolScope).toBeChecked();
  await expect(settings.locator(".teacher-settings-status")).toContainText(
    "The leaderboard now includes made-up student nicknames from this school."
  );
  await expect.poll(() => page.evaluate(() => window.__teacherSettingsRpcCalls || []))
    .toEqual([{
      operation: "teacher_set_class_leaderboard_scope",
      payload: {
        p_class_id: CLASS_A_ID,
        p_scope: "school"
      }
    }]);

  expect(browserErrors).toEqual([]);
});

test("a failed whole-school leaderboard save remains in the dialog for retry", async ({ page }) => {
  const browserErrors = recordBrowserErrors(page);
  await page.goto(settingsUrl("settingsLeaderboardScope=fail-once"));
  const settings = page.getByRole("main");
  const schoolScope = settings.getByRole("radio", { name: "Whole school", exact: true });

  await schoolScope.click();
  const dialog = page.getByRole("dialog", { name: "Show whole-school leaderboard?" });
  await dialog.getByRole("button", { name: "Show whole-school board", exact: true }).click();

  await expect(dialog).toContainText("Leaderboard visibility was not changed.");
  await expect(schoolScope).not.toBeChecked();
  await dialog.getByRole("button", { name: "Show whole-school board", exact: true }).click();

  await expect(dialog).toHaveCount(0);
  await expect(schoolScope).toBeChecked();
  await expect.poll(() => page.evaluate(() => window.__teacherSettingsRpcCalls || []))
    .toHaveLength(2);
  expect(browserErrors).toEqual([]);
});
