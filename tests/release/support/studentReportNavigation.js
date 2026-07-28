import { expect } from "@playwright/test";
import {
  STUDENT_REPORT_VIEWS
} from "../../../src/components/reports/studentReportUiUtils.js";

const REPORT_VIEW_BY_ID = new Map(
  STUDENT_REPORT_VIEWS.map(view => [view.id, view])
);

function reportView(viewId) {
  const view = REPORT_VIEW_BY_ID.get(viewId);
  if (!view) throw new Error(`Unknown student report view: ${viewId}`);
  return view;
}

function startsWithLabel(label) {
  const escaped = String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}`);
}

function compactReportSelect(page) {
  return page.getByRole("combobox", {
    name: "Choose a report",
    exact: true
  });
}

async function revealDesktopReportLink(nav, viewId) {
  const link = nav.getByRole("link", {
    name: startsWithLabel(reportView(viewId).shortLabel)
  });
  if (await link.isVisible()) return link;

  const more = nav.locator("details.lg-report-nav-more");
  if (await more.count() && !await more.evaluate(element => element.open)) {
    await more.locator(":scope > summary").click();
  }
  return link;
}

export async function expectStudentReportViewsAvailable(page, viewIds) {
  const select = compactReportSelect(page);
  const compact = await select.isVisible();
  const nav = page.getByRole("navigation", { name: "Student reports" });

  for (const viewId of viewIds) {
    const view = reportView(viewId);
    await expect(select.locator(`option[value="${view.id}"]`)).toHaveText(view.label);
    if (!compact) {
      await expect(await revealDesktopReportLink(nav, view.id)).toBeVisible();
    }
  }

  if (compact) {
    await expect(select).toBeVisible();
  } else {
    await expect(nav).toBeVisible();
  }
}

export async function chooseStudentReportView(page, viewId) {
  const view = reportView(viewId);
  const select = compactReportSelect(page);

  if (await select.isVisible()) {
    await select.selectOption(view.id);
    await expect(select).toHaveValue(view.id);
  } else {
    const nav = page.getByRole("navigation", { name: "Student reports" });
    const link = await revealDesktopReportLink(nav, view.id);
    await expect(link).toBeVisible();
    await link.click();
  }

  await expect(page.getByRole("heading", {
    name: view.label,
    exact: true
  })).toBeVisible();
}
