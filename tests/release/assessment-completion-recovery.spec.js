import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 320, height: 568 }]) {
  test(`completed assessment retains answers through refused and retried saves at ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/src/supabaseClient.js*", route => route.fulfill({
      contentType: "application/javascript",
      body: `export const isSupabaseConfigured = true;
        export const supabase = { call: async (name,args) => {
          const response = await fetch('/__preview_assessment_completion__', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,args})});
          return {data:await response.json(),error:null};
        }};`
    }));
    const calls = [];
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await page.route("**/__preview_assessment_completion__", async route => {
      calls.push(route.request().postDataJSON());
      if (calls.length > 1) await held;
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(
        calls.length === 1 ? { ok: false, error: "temporary_save_failure" } : { ok: true, duplicate: true }
      ) });
    });
    await page.goto("/preview/assessment-media-evidence.html?scenario=completion-recovery");
    const retry = page.getByRole("button", { name: "Try saving again", exact: true });
    await expect(page.getByRole("heading", { name: "Let’s save your answers" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Your answers are still here");
    await expect(retry).toBeVisible();
    await expect(page.getByRole("button", { name: /^(Start|Next Question)/ })).toHaveCount(0);
    for (const control of [retry, page.getByRole("alert"), page.getByRole("heading", { name: "Let’s save your answers" })]) {
      const bounds = await control.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    const notice = await page.locator(".student-session-notice--inline").boundingBox();
    const heading = await page.getByRole("heading", { name: "Let’s save your answers" }).boundingBox();
    expect(notice.height).toBeLessThanOrEqual(100);
    expect(notice.y + notice.height).toBeLessThanOrEqual(heading.y);
    await page.screenshot({ path: testInfo.outputPath("assessment-save-retry.png") });
    await retry.click();
    await expect(page.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
    await expect(page.getByRole("heading", { name: "Saving your assessment…" })).toBeVisible();
    await expect.poll(() => calls.length).toBe(2);
    expect(calls[0]).toEqual(calls[1]);
    expect(calls[0].name).toBe("student_complete_focus_assessment");
    expect(calls[0].args.p_attempt.attemptId.length).toBeLessThanOrEqual(200);
    expect(calls[0].args.p_attempt.questionRecords).toHaveLength(10);
    release();
    await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible();
    expect(calls).toHaveLength(2);
    expect(errors).toEqual([]);
  });
}
