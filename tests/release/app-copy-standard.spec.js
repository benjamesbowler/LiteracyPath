import { expect, test } from "@playwright/test";

const TEACHER_BANNED = /\b(?:evidence|learning event|telemetry|sync health|policy-ready|learner-weighted|response-weighted|cumulative|roster administration|access activity|drill down|provenance|contract|scope|baseline|BOY|MOY|EOY|learners?|students?|assessments?|checkpoints?|logins?)\b|(?<!privacy )\bpolicy\b/i;
const CHILD_BANNED = /\b(?:assessments?|evidence|learners?|students?|checkpoints?|wrong|failed|incorrect|needs teaching|not[-_ ]assessed)\b/i;
const RAW_TOKEN = /\b(?:level-[a-z]|[a-z0-9]+(?:_[a-z0-9]+){1,})\b/i;
const FRACTION = /\b\d+\s*\/\s*\d+\b/;

async function renderedCopy(page) {
  return page.locator("body").evaluate(body => {
    const attributes = Array.from(body.querySelectorAll("[aria-label], [aria-description], [title], [placeholder], [alt]"))
      .flatMap(element => ["aria-label", "aria-description", "title", "placeholder", "alt"]
        .map(name => element.getAttribute(name))
        .filter(Boolean));
    const copy = body.cloneNode(true);
    copy.querySelectorAll("script, style, noscript").forEach(element => element.remove());
    return [copy.textContent, ...attributes].join("\n");
  });
}

for (const surface of ["today", "classes", "assess", "progress", "resources", "report", "assessment", "guided-reading"]) {
  test(`teacher ${surface} uses plain product language`, async ({ page }) => {
    await page.goto(`/preview/teacher-a11y.html?surface=${surface}`);
    await expect(page.locator("body")).not.toBeEmpty();
    const copy = await renderedCopy(page);
    expect(copy).not.toMatch(TEACHER_BANNED);
    expect(copy).not.toMatch(RAW_TOKEN);
  });
}

for (const surface of ["student-login", "student-home", "phonics", "arcade", "adventure-map", "sound-seekers", "story-quests", "reading-library", "my-hollow"]) {
  test(`child ${surface} uses child-safe language`, async ({ page }) => {
    await page.goto(`/preview/child-surfaces.html?surface=${surface}`);
    await expect(page.locator("body")).not.toBeEmpty();
    const copy = await renderedCopy(page);
    expect(copy).not.toMatch(CHILD_BANNED);
    expect(copy).not.toMatch(RAW_TOKEN);
    expect(copy).not.toMatch(FRACTION);

    const actionLines = await page.locator("button:visible, [data-child-instruction]:visible").evaluateAll(elements => (
      elements.flatMap(element => String(element.innerText || "").split(/\n+/))
    ));
    for (const line of actionLines.map(value => value.trim()).filter(Boolean)) {
      expect(line.split(/\s+/).length, `${surface}: “${line}”`).toBeLessThanOrEqual(8);
    }
  });
}
