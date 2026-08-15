import { expect } from "@playwright/test";

const ADMIN_SECTIONS = Object.freeze({
  overview: Object.freeze({ label: "Overview", path: "/admin/school/overview" }),
  signups: Object.freeze({ label: "Teacher requests", path: "/admin/school/teacher-requests" }),
  schools: Object.freeze({ label: "Schools", path: "/admin/school/schools" }),
  teachers: Object.freeze({ label: "Teachers", path: "/admin/school/teachers" }),
  classes: Object.freeze({ label: "Classes", path: "/admin/school/classes" }),
  students: Object.freeze({ label: "Student data", path: "/admin/school/students" }),
  operations: Object.freeze({ label: "Support & safety", path: "/admin/operations/support" })
});

const ADMIN_AREAS = Object.freeze({
  operations: Object.freeze({
    navigationName: "Admin pages",
    pickerName: "Choose an admin page",
    sections: Object.freeze(Object.fromEntries(
      Object.entries(ADMIN_SECTIONS).map(([id, section]) => [id, section.label])
    ))
  })
});

const ADMIN_SECTION_PATHS = Object.freeze(Object.fromEntries(
  Object.entries(ADMIN_SECTIONS).map(([id, section]) => [id, section.path])
));

function sectionConfig(sectionId) {
  const section = ADMIN_SECTIONS[sectionId];
  if (!section) throw new Error(`Unknown current Admin section: ${sectionId}`);
  return section;
}

async function activeAdminSectionControl(page) {
  // A cold hosted database can take longer than the default assertion window
  // to finish the first admin read. The heading and responsive controls are
  // mounted together, so use the page heading as the explicit ready contract.
  await expect(page.getByRole("heading", {
    name: "Admin Dashboard",
    exact: true
  }).last()).toBeVisible({ timeout: 20_000 });
  const picker = page.getByRole("combobox", { name: "Choose an admin page" }).last();
  const navigation = page.getByRole("navigation", { name: "Admin pages" }).last();
  const compact = await picker.isVisible();
  await expect(compact ? picker : navigation).toBeVisible();
  return { picker, navigation, compact };
}

// Kept as a compatibility helper for release specs while Admin is one area.
export async function openAdminArea(page) {
  await activeAdminSectionControl(page);
  return ADMIN_AREAS.operations;
}

export async function expectAdminSectionAvailable(page, _area, sectionId) {
  const section = sectionConfig(sectionId);
  const { picker, navigation, compact } = await activeAdminSectionControl(page);
  if (compact) {
    await expect(picker.getByRole("option", { name: section.label, exact: true })).toHaveCount(1);
    return;
  }
  await expect(navigation.getByRole("button", {
    name: new RegExp(`^${section.label}\\b`)
  })).toBeVisible();
}

export async function expectAdminSectionUnavailable(page, _area, sectionId) {
  const retiredLabels = {
    release: "App readiness",
    guidedInsight: "Reading book checks",
    guidedMediaQa: "Book media checks",
    coverage: "Lesson content checks",
    calibration: "Assessment consistency",
    mapStops: "Student map",
    hollowSpots: "Student rewards",
    teacherReport: "School reports",
    archive: "Assessment records"
  };
  const label = retiredLabels[sectionId] || ADMIN_SECTIONS[sectionId]?.label || sectionId;
  const { picker, navigation, compact } = await activeAdminSectionControl(page);
  if (compact) {
    await expect(picker.getByRole("option", { name: label, exact: true })).toHaveCount(0);
    return;
  }
  await expect(navigation.getByRole("button", {
    name: new RegExp(`^${label}\\b`)
  })).toHaveCount(0);
}

export async function openAdminSection(page, areaOrSectionId, maybeSectionId) {
  const sectionId = maybeSectionId || areaOrSectionId;
  if (sectionId === "questionFlags") {
    await openAdminSection(page, "operations");
    await page.getByRole("button", { name: "Open reported questions", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/admin/question-flags");
    return;
  }
  const section = sectionConfig(sectionId);
  const { picker, navigation, compact } = await activeAdminSectionControl(page);
  if (compact) {
    await picker.selectOption(sectionId);
    await expect(picker).toHaveValue(sectionId);
  } else {
    const button = navigation.getByRole("button", {
      name: new RegExp(`^${section.label}\\b`)
    });
    await button.click();
    await expect(button).toHaveAttribute("aria-current", "page");
  }
  await expect.poll(() => new URL(page.url()).pathname).toBe(section.path);
}

export { ADMIN_AREAS, ADMIN_SECTIONS, ADMIN_SECTION_PATHS };
