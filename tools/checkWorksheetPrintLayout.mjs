import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import {
  availableWorksheetTypes,
  buildWorksheetDocument,
  getWorksheetCycle,
  worksheetCycleOptions
} from "../src/utils/worksheets/worksheetBuilder.js";

const failures = [];
let documentsChecked = 0;
let logicalPagesChecked = 0;
let imagesChecked = 0;
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
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

  for (const option of worksheetCycleOptions()) {
    const cycle = getWorksheetCycle(option.id);
    for (const type of availableWorksheetTypes(cycle)) {
      const context = `cycle ${cycle.cycleNumber} ${type}`;
      let { html } = buildWorksheetDocument({ cycleId: cycle.id, type, pages: 6 });
      html = html.replace("<head>", '<head><base href="http://worksheet.local/">');
      await page.setContent(html, { waitUntil: "networkidle" });

      const layout = await page.locator("section.page").evaluateAll(sections => sections.map((section, index) => {
        const footer = section.querySelector(".ws-footer");
        const lastTask = [...section.querySelectorAll(".ws-block")].at(-1);
        return {
          page: index + 1,
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
      if (layout.length !== 6) failures.push({ code: "LOGICAL_PAGE_COUNT", context, expected: 6, actual: layout.length });
      if (physicalPages !== 6) failures.push({ code: "PHYSICAL_PAGE_COUNT", context, expected: 6, actual: physicalPages });
      for (const item of layout.filter(item => item.overlapsFooter)) {
        failures.push({ code: "FOOTER_OVERLAP", context, page: item.page });
      }
      for (const image of imageStates.filter(image => !image.loaded)) {
        failures.push({ code: "IMAGE_LOAD", context, src: image.src });
      }
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

