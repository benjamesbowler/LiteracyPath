import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import {
  availableWorksheetTypes,
  buildWorksheetDocument,
  buildWorksheetAnswerKeyDocument,
  getWorksheetCycle,
  worksheetCycleOptions
} from "../src/utils/worksheets/worksheetBuilder.js";

const failures = [];
const recipes = worksheetCycleOptions().flatMap(option => availableWorksheetTypes(getWorksheetCycle(option.id)).map(type => ({ cycleId: option.id, type, pages: 6 })));
// Short packs and alternate starting Guides must preserve pagination too.
const guideIds = ["muddy", "chompy", "pip", "fluff", "chips", "socks"];
for (const cycleNumber of [1, 26]) {
  for (const guideId of guideIds) {
    for (const pages of [1, 4, 6]) recipes.push({ cycleId: `cycle-${cycleNumber}`, type: `characterColouring:${guideId}`, pages });
  }
}
for (const cycleNumber of [1, 10, 26]) {
  for (const type of availableWorksheetTypes(getWorksheetCycle(`cycle-${cycleNumber}`))) {
    for (const pages of [1, 4, 6]) recipes.push({ cycleId: `cycle-${cycleNumber}`, type, pages, answerKey: true });
  }
}
let documentsChecked = 0;
let logicalPagesChecked = 0;
let imagesChecked = 0;
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 696, height: 1123 } });
  await page.emulateMedia({ media: "print" });
  await page.route("http://worksheet.local/**", async route => {
    const pathname = new URL(route.request().url()).pathname;
    const assetPath = path.join(process.cwd(), "public", pathname.slice(1));
    try {
      await route.fulfill({ status: 200, body: await fs.readFile(assetPath) });
    } catch {
      await route.fulfill({ status: 404, body: "missing" });
    }
  });

  for (const recipe of recipes) {
      const cycle = getWorksheetCycle(recipe.cycleId);
      const context = `cycle ${cycle.cycleNumber} ${recipe.type}${recipe.answerKey ? " teacher key" : ""} (${recipe.pages} pages)`;
      let { html } = (recipe.answerKey ? buildWorksheetAnswerKeyDocument : buildWorksheetDocument)(recipe);
      html = html.replace("<head>", '<head><base href="http://worksheet.local/">');
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.locator("img").evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));

      const layout = await page.locator("section.page").evaluateAll(sections => sections.map((section, index) => {
        const footer = section.querySelector(".ws-footer");
        const lastTask = [...section.querySelectorAll(".ws-block, .ws-answer-task")].at(-1);
        return {
          page: index + 1,
          tooTall: section.getBoundingClientRect().height > (297 - 2 * 13) * 96 / 25.4,
          clipped: [...section.querySelectorAll(".ws-block, .ws-block *, .ws-answer-task, .ws-answer-task *")].some(element => element.getBoundingClientRect().right > section.getBoundingClientRect().right + 1 || element.getBoundingClientRect().left < section.getBoundingClientRect().left - 1),
          overlapsFooter: Boolean(lastTask && footer && lastTask.getBoundingClientRect().bottom > footer.getBoundingClientRect().top)
        };
      }));
      const imageStates = await page.locator("img").evaluateAll(images => images.map(image => ({
        src: image.getAttribute("src"),
        loaded: image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
      })));
      const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
      const physicalPages = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;

      documentsChecked += 1;
      logicalPagesChecked += layout.length;
      imagesChecked += imageStates.length;
      if (layout.length !== recipe.pages) failures.push({ code: "LOGICAL_PAGE_COUNT", context, expected: recipe.pages, actual: layout.length });
      if (physicalPages !== recipe.pages) failures.push({ code: "PHYSICAL_PAGE_COUNT", context, expected: recipe.pages, actual: physicalPages });
      for (const item of layout.filter(item => item.tooTall || item.clipped)) {
        failures.push({ code: item.tooTall ? "PAGE_OVERFLOW" : "HORIZONTAL_CLIP", context, page: item.page });
      }
      for (const item of layout.filter(item => item.overlapsFooter)) {
        failures.push({ code: "FOOTER_OVERLAP", context, page: item.page });
      }
      for (const image of imageStates.filter(image => !image.loaded)) {
        failures.push({ code: "IMAGE_LOAD", context, src: image.src });
      }
  }
} finally {
  await browser?.close();
}

const summary = {
  documentsChecked,
  logicalPagesChecked,
  imagesChecked,
  failures: failures.length
};

if (failures.length) {
  console.error(JSON.stringify({ summary, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ summary, status: "PASS" }, null, 2));
}
