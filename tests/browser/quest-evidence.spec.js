import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  sealQuestHumanObservation,
  verifyQuestHumanObservation
} from "../../src/utils/questHumanAcceptance.js";

const EVIDENCE = "/preview/quest-evidence.html";

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

async function fillFirstUseObservation(page, { includeAdultPrompts = true } = {}) {
  await page.getByLabel("Anonymous session code").fill("SESSION-101");
  await page.getByLabel("Observer code").fill("OBS-01");
  await page.getByLabel("Setting code").fill("ROOM-101");
  await page.getByLabel("Child study code").fill("CHILD-101");
  await page.getByLabel("Age in years").fill("6");
  await page.getByLabel("Tasks shown").fill("8");
  await page.getByLabel("Completed without help").fill("7");
  if (includeAdultPrompts) await page.getByLabel("Adult prompts given").fill("1");
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByLabel("Severe frustration incidents").fill("0");
  await page.getByLabel("Enjoyment rating").fill("4");
  await page.getByRole("checkbox", { name: "Consent confirmed No direct identifiers have been entered." }).check();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("field observations require every zero-capable measure and download a verified seal", async ({ page }) => {
  await page.goto(EVIDENCE);
  await page.waitForFunction(() => window.__questEvidenceReady === true);
  await fillFirstUseObservation(page, { includeAdultPrompts: false });

  await page.getByRole("button", { name: "Validate and save observation" }).click();
  await expect(page.getByRole("alert")).toContainText("Adult prompts");
  await expect(page.getByText("0 sealed records", { exact: true })).toBeVisible();

  await page.getByLabel("Adult prompts given").fill("1");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Validate and save observation" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const record = JSON.parse(Buffer.concat(chunks).toString("utf8"));

  expect(record.profileId).toBe("child-first-use");
  expect(record.sessionId).toBe("SESSION-101");
  expect(record.participant.anonymousId).toBe("CHILD-101");
  expect(record.measures.adultPrompts).toBe(1);
  expect((await verifyQuestHumanObservation(record)).status).toBe("valid");
  await expect(page.getByText("1 sealed records", { exact: true })).toBeVisible();
  await expect(page.getByText("Observation validated, sealed, stored locally, and downloaded.", { exact: true })).toBeVisible();
});

test("the evidence console remains accessible and contained on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(EVIDENCE);
  await page.waitForFunction(() => window.__questEvidenceReady === true);

  await expect(page.getByRole("heading", { name: "First-time child play" })).toBeVisible();
  await expect(page.getByRole("button", { name: "01 First use 0 recorded" })).toBeVisible();
  await expect(page.getByRole("button", { name: "02 Repeat play 0 recorded" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const touchFailures = await page.locator("button:visible, a:visible, input:not([type='radio']):not([type='checkbox']):visible, select:visible, summary:visible, .qe-binary label, .qe-consent").evaluateAll(elements => elements
    .map(element => {
      const box = element.getBoundingClientRect();
      return { label: element.getAttribute("aria-label") || element.textContent?.trim() || element.tagName, width: box.width, height: box.height };
    })
    .filter(item => item.width < 40 || item.height < 40));
  expect(touchFailures).toEqual([]);

  const result = await new AxeBuilder({ page }).include(".qe-app").analyze();
  const serious = result.violations.filter(item => ["serious", "critical"].includes(item.impact));
  expect(serious, serious.map(item => `${item.id}: ${item.help}`).join("\n")).toEqual([]);
});

test("imports reject tampering and count only verified unique sessions", async ({ page }) => {
  const record = await sealQuestHumanObservation({
    schemaVersion: 1,
    profileId: "teacher-report",
    sessionId: "SESSION-201",
    observedAt: "2026-07-18T09:00:00.000Z",
    observerId: "OBS-02",
    settingId: "ROOM-202",
    consentConfirmed: true,
    participant: { anonymousId: "ADULT-001", role: "teacher" },
    measures: {
      questionsAsked: 5,
      questionsCorrect: 5,
      nextActionAccurate: true,
      usefulnessRating: 5
    }
  });

  await page.goto(EVIDENCE);
  await page.waitForFunction(() => window.__questEvidenceReady === true);
  const picker = page.locator("input[type='file']");
  await picker.setInputFiles({
    name: "teacher-report-teacher-001.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(record))
  });
  await expect(page.getByText("1 verified record imported.", { exact: true })).toBeVisible();
  await expect(page.getByText("1 sealed records", { exact: true })).toBeVisible();

  await picker.setInputFiles({
    name: "teacher-report-tampered.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...record, settingId: "ROOM-203" }))
  });
  await expect(page.getByRole("status")).toContainText("Integrity seal");
  await expect(page.getByText("1 sealed records", { exact: true })).toBeVisible();
});

test("all five study profiles expose their required observation measures", async ({ page }) => {
  await page.goto(EVIDENCE);
  await page.waitForFunction(() => window.__questEvidenceReady === true);

  await page.getByRole("button", { name: "02 Repeat play 0 recorded" }).click();
  await expect(page.getByRole("heading", { name: "Repeat child play" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Did the child choose to replay?" })).toBeVisible();

  await page.getByRole("button", { name: "03 Rewards 0 recorded" }).click();
  await expect(page.getByRole("heading", { name: "Reward and shop choice" })).toBeVisible();
  await expect(page.getByLabel("Sparks available")).toBeVisible();

  await page.getByRole("button", { name: "04 Adult report 0 recorded" }).click();
  await expect(page.getByRole("heading", { name: "Teacher or parent report" })).toBeVisible();
  await expect(page.getByLabel("Adult role")).toBeVisible();

  await page.getByRole("button", { name: "05 Room audio 0 recorded" }).click();
  await expect(page.getByRole("heading", { name: "Classroom audio" })).toBeVisible();
  await expect(page.getByLabel("Anonymous room profile")).toBeVisible();
  await expect(page.getByLabel("Sensory discomfort incidents")).toBeVisible();
});
