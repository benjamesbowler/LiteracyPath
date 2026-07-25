import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

test("A8.6 deliberate redacted error reaches the release-tagged admin monitor", async ({
  page
}) => {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the error-monitoring gate.");
  }

  await page.goto("/");
  const delivery = await page.evaluate(async () => {
    const monitor = await import("/src/utils/errorLog.js");
    const error = new Error(
      "Aarav answered spoon; teacher@example.com; answer=spoon; bearer secret-token"
    );
    error.stack = [
      `Error: ${error.message}`,
      "    at DeliberateMonitorProbe (https://literacy.guide/assets/index.js?learner=Aarav&answer=spoon:1:1)"
    ].join("\n");
    const event = monitor.buildRemoteErrorEvent({
      label: "Assessment screen crashed before fallback.",
      error,
      source: "release-gate",
      sampleRate: 1
    });
    return monitor.reportRemoteError(event, { random: () => 0 });
  });
  expect(delivery.ok).toBe(true);

  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-admin@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true })).toBeVisible();

  const monitor = page.getByRole("region", { name: "Fleet error monitor" });
  await expect(monitor).toHaveAttribute("data-monitor-state", "ready", { timeout: 20_000 });
  await expect(monitor).toContainText("AuditMonitorError");
  await expect(monitor).toContainText("Error");
  await expect(monitor).toContainText("release-gate");
  await expect(monitor).toContainText(/release (local-unversioned|[A-Za-z0-9._:-]+)/);
  await expect(monitor).toContainText("Within budget");
  await expect(monitor).toContainText("assets/index.js:1:1");
  await expect(monitor).not.toContainText("Aarav");
  await expect(monitor).not.toContainText("spoon");
  await expect(monitor).not.toContainText("teacher@example.com");
  await expect(monitor).not.toContainText("secret-token");
});
