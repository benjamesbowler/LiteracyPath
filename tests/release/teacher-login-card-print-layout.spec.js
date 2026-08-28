import { expect, test } from "@playwright/test";

function signInCardPage(pageNumber, pageCount) {
  const cards = Array.from({ length: 4 }, (_unused, cardIndex) => `
    <article class="teacher-print-login-card">
      <p>School</p>
      <h4>Student ${((pageNumber - 1) * 4) + cardIndex + 1}</h4>
      <span>Class · Code ABC123</span>
      <small>picture code</small>
    </article>
  `).join("");

  return `
    <section class="teacher-login-card-page">
      <header class="teacher-login-card-page-header">
        <div>
          <p>School</p>
          <h3>Class sign-in cards</h3>
          <span>Class code ABC123</span>
        </div>
        <small>Page ${pageNumber} of ${pageCount}</small>
      </header>
      <div class="teacher-login-card-sheet">${cards}</div>
    </section>
  `;
}

test("@teacher-login-card-print-layout prints the complete class as one multi-page job", async ({
  page
}) => {
  const pageCount = 3;
  const cardPages = Array.from(
    { length: pageCount },
    (_unused, pageIndex) => signInCardPage(pageIndex + 1, pageCount)
  ).join("");

  await page.setContent(`
    <div class="lg-app-shell">
      <aside class="lg-sidebar">Teacher navigation</aside>
      <div class="lg-content-area">
        <div class="app">
          <main class="teacher-login-card-route" data-teacher-route="login-cards">
            <div class="teacher-login-card-pages">${cardPages}</div>
          </main>
        </div>
      </div>
    </div>
  `);
  await page.addStyleTag({ path: "src/styles/lg-design-system.css" });
  await page.addStyleTag({ path: "src/App.css" });
  await page.addStyleTag({ path: "src/styles/ui-quality-pass.css" });
  await page.emulateMedia({ media: "print" });

  await expect(page.locator(".teacher-login-card-page")).toHaveCount(pageCount);
  await expect(page.locator(".lg-app-shell")).toHaveCSS("overflow", "visible");
  await expect(page.locator(".lg-content-area")).toHaveCSS("overflow", "visible");
  const viewportHeight = page.viewportSize()?.height || 0;
  const shellHeight = await page.locator(".lg-app-shell").evaluate(
    element => element.getBoundingClientRect().height
  );
  const contentHeight = await page.locator(".lg-content-area").evaluate(
    element => element.getBoundingClientRect().height
  );
  expect(shellHeight).toBeGreaterThan(viewportHeight * 2);
  expect(contentHeight).toBeGreaterThan(viewportHeight * 2);

  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const printedPageCount = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
  expect(printedPageCount).toBe(pageCount);
});
