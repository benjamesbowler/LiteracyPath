import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  A11Y_KEY_MODAL_STATES,
  A11Y_PRIMARY_ROUTES,
  A11Y_VIEWPORTS
} from "../../src/accessibility/primaryRouteInventory.js";

function blockingViolations(result) {
  return result.violations
    .filter(violation => violation.impact === "serious" || violation.impact === "critical")
    .map(violation => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map(node => node.target.join(" "))
    }));
}

async function expectNoBlockingViolations(page, state, selector = "body") {
  const result = await new AxeBuilder({ page }).include(selector).analyze();
  expect(blockingViolations(result), `${state} has serious or critical accessibility violations`).toEqual([]);
}

async function waitForRoute(page, route) {
  await page.goto(route.url, { waitUntil: "domcontentloaded" });
  if (route.audience === "teacher") {
    await expect(page.locator('[data-a11y-seed="teacher-a"]')).toBeVisible();
  } else {
    await expect(page.locator(`[data-preview-surface="${route.id}"]`)).toBeVisible();
  }
  if (route.settledSelector) {
    await page.waitForFunction(selector => {
      const element = document.querySelector(selector);
      return element && Number.parseFloat(getComputedStyle(element).opacity) >= 0.99;
    }, route.settledSelector);
  }
  await expect(page.locator("body")).not.toHaveText(/Something went wrong|Page unavailable/);
}

for (const viewport of A11Y_VIEWPORTS) {
  for (const route of A11Y_PRIMARY_ROUTES) {
    test(`A3.3 ${route.id} has zero serious/critical Axe findings at ${viewport.id}`, async ({
      page
    }) => {
      test.setTimeout(45_000);
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForRoute(page, route);
      await expectNoBlockingViolations(page, `${route.id} at ${viewport.id}`);
      expect(pageErrors).toEqual([]);
    });
  }

  for (const state of A11Y_KEY_MODAL_STATES) {
    test(`A3.3 ${state.id} has zero serious/critical Axe findings at ${viewport.id}`, async ({
      page
    }) => {
      test.setTimeout(45_000);
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(state.url, { waitUntil: "domcontentloaded" });
      if (state.openSummary) {
        await page.getByText(state.openSummary, { exact: true }).click();
      }
      if (state.openControl) {
        await page.getByRole("button", { name: state.openControl, exact: true }).first().click();
      }
      const role = state.alertDialog ? "alertdialog" : state.regionRole ? "region" : "dialog";
      await expect(page.getByRole(role, { name: state.dialogName })).toBeVisible();
      await expectNoBlockingViolations(page, `${state.id} at ${viewport.id}`);
      expect(pageErrors).toEqual([]);
    });
  }
}
