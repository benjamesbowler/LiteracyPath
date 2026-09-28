import { expect, test } from "@playwright/test";
import { chooseStudentReportView } from "./support/studentReportNavigation.js";

const completedAt = "2026-09-28T10:00:00.000Z";
const progress = {
  schemaVersion: 2,
  progressEpoch: 2,
  cycles: {
    "cycle-1": { plays: 2, lastPlayedAt: completedAt, lastCheck: {
      version: 1, source: "adventure_map", completedAt,
      questionRecords: [
        { questionId: "saved-first", itemKey: "m", targetWord: "moon", construct: "initial_sound", mechanicId: "sceneHunt", responseStatus: "incorrect", isCorrect: false, selectedAnswer: "net", correctAnswer: "moon" },
        { questionId: "saved-supported", itemKey: "a", targetWord: "cat", construct: "medial_grapheme_completion", mechanicId: "missingLetter", responseStatus: "supported", isCorrect: null, selectedAnswer: "a", correctAnswer: "a", evidence: { independent: false, supportUsed: ["partial_spelling_model"] } }
      ]
    } },
    "cycle-2": { plays: 1, lastPlayedAt: completedAt, stars: 3, lastIndependent: 12, lastTotal: 12 }
  }
};

for (const viewport of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }]) {
  test(`teacher question detail keeps supported and missing practice distinct at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(value => localStorage.setItem("lp-el-quest:student-aarav", JSON.stringify(value)), progress);
    await page.goto("/preview/teacher-a11y.html?surface=report");
    await chooseStudentReportView(page, "skills-check");
    const skills = page.getByRole("region", { name: "Latest assessment teaching detail" });
    await expect(skills).toContainText("1 of 1 independent responses correct");
    await skills.getByText("Targets, recorded responses and teaching moves", { exact: true }).click();
    await expect(skills).toContainText("Question formats: Not recorded.");
    await expect(skills).toContainText("fresh example");

    await chooseStudentReportView(page, "other-learning");
    const latest = page.getByRole("region", { name: "Cycle 1", exact: true });
    await expect(latest).toContainText("0 of 1 independent responses correct; 1 supported");
    await latest.getByText("Targets, recorded responses and teaching moves", { exact: true }).click();
    await expect(latest).toContainText("Selected “net”; expected “moon”");
    await expect(latest).toContainText("Response: “a” (with support");
    await expect(latest).toContainText("supplied letters are support");
    await expect(latest).toContainText("Say “cat”, stretch its sounds");
    await expect(latest).toContainText("do not establish formal mastery");
    const legacy = page.getByRole("region", { name: "Cycle 2", exact: true });
    await expect(legacy).toContainText("Question-level evidence not recorded");
    await expect(legacy).toContainText("coverage are unknown");
    await expect(legacy).not.toContainText("12 of 12");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}
