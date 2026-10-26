import { expect, test } from "@playwright/test";

async function downloadText(download) {
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// Decode independently of the production serializer, including multiline cells.
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (!quoted && (char === "," || char === "\n")) {
      row.push(field); field = "";
      if (char === "\n") { rows.push(row); row = []; }
    } else field += char;
  }
  row.push(field); rows.push(row);
  return rows;
}

test("teacher raw CSV download neutralizes learner fields and version provenance, preserving evidence", async ({ page }) => {
  await page.goto("/tests/fixtures/csv-export-security/index.html");
  await page.getByText("Download report", { exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export raw rows", exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("class-report-attempts.csv");
  const rows = parseCsv(await downloadText(download));
  const original = await page.evaluate(() => window.csvFixture.attempts[0]);
  const data = rows[rows.findIndex(row => row[0] === "attemptId") + 1];
  expect(data[0]).toBe(`'${original.attemptId}`);
  expect(data[1]).toBe(original.studentName);
  expect(data.slice(8, 11)).toEqual(["2", "1", "50"]);
  expect(data[11]).toBe(`'${original.status}`);
  expect(rows.find(row => row[1] === "App version(s)")?.[2]).toBe(`'${original.appVersion}`);
  expect(rows.find(row => row[1] === "Content version(s)")?.[2]).toBe(`'${original.contentVersion}`);
  expect(await page.evaluate(() => JSON.stringify(window.csvFixture))).toBe(await page.evaluate(() => window.csvFixtureOriginal));
});

test("answer history download protects question and answer text including fullwidth operators", async ({ page }) => {
  await page.goto("/tests/fixtures/csv-export-security/index.html");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download answer history fixture", exact: true }).click();
  const rows = parseCsv(await downloadText(await downloaded));
  const original = await page.evaluate(() => window.csvFixture.answers[0]);
  const data = rows[rows.findIndex(row => row[0] === "Date") + 1];
  expect(data[7]).toBe(`'${original.question}`);
  expect(data[8]).toBe(`'${original.chosen}`);
  expect(data[9]).toBe(original.correct);
  expect(rows.find(row => row[1] === "Content version(s)")?.[2]).toBe(`'${original.contentVersion}`);
  expect(await page.evaluate(() => JSON.stringify(window.csvFixture))).toBe(await page.evaluate(() => window.csvFixtureOriginal));
});


test("media review CSV download treats notes and content as literal text", async ({ page }) => {
  const item = {
    reviewId: "csv-security-item", area: "assessment", skillId: "initial_sounds", status: "accepted",
    questionId: "csv-security-question", targetWord: "sun", imagePath: "",
    text: '＝HYPERLINK("https://example.invalid","content")',
    notes: '\u200b  =HYPERLINK("https://example.invalid","notes")',
    answerChoices: ["safe", 'word, "字"\nnext line'], correctAnswer: "safe"
  };
  await page.route("**/src/data/generated/mediaQaReviewItems.generated.js", route => route.fulfill({
    contentType: "application/javascript",
    body: `export const mediaQaReviewItems = ${JSON.stringify([item])};`
  }));
  await page.goto("/tests/fixtures/csv-export-security/index.html?media");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export visible CSV", exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("literacypath-media-qa-review.csv");
  const rows = parseCsv(await downloadText(download));
  expect(rows).toHaveLength(2);
  expect(rows[1][5]).toBe(`'${item.text}`);
  expect(rows[1][6]).toBe(item.answerChoices.join(" | "));
  expect(rows[1][9]).toBe(`'${item.notes}`);
});
