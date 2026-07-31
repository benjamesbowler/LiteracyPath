import { expect } from "@playwright/test";

const ADMIN_AREAS = Object.freeze({
  school: {
    toggleName: "School administration",
    navigationName: "School administration pages",
    pickerName: "Choose a school admin page",
    sections: {
      overview: "Overview",
      signups: "Teacher requests",
      schools: "Schools",
      teachers: "Teachers",
      classes: "Classes",
      students: "Students",
      teacherReport: "School reports",
      archive: "Assessment records"
    }
  },
  technical: {
    toggleName: "App checks",
    navigationName: "App checks",
    pickerName: "Choose an app check",
    sections: {
      release: "App readiness",
      guidedInsight: "Reading book checks",
      guidedMediaQa: "Book media checks",
      coverage: "Lesson content checks",
      calibration: "Assessment consistency",
      questionFlags: "Reported questions",
      mapStops: "Student map",
      hollowSpots: "Student rewards"
    }
  }
});

const ADMIN_SECTION_PATHS = Object.freeze({
  overview: "/admin/school/overview",
  signups: "/admin/school/teacher-requests",
  schools: "/admin/school/schools",
  teachers: "/admin/school/teachers",
  classes: "/admin/school/classes",
  students: "/admin/school/students",
  teacherReport: "/admin/school/reports",
  archive: "/admin/school/assessment-records",
  release: "/admin/app/readiness",
  guidedInsight: "/admin/app/reading-book-checks",
  guidedMediaQa: "/admin/app/book-media-checks",
  coverage: "/admin/app/lesson-content-checks",
  calibration: "/admin/app/assessment-consistency",
  questionFlags: "/admin/question-flags",
  mapStops: "/admin/app/student-map",
  hollowSpots: "/admin/app/student-rewards"
});

function adminArea(area) {
  const config = ADMIN_AREAS[area];
  if (!config) throw new Error(`Unknown Admin area: ${area}`);
  return config;
}

function adminSection(area, sectionId) {
  const config = adminArea(area);
  const label = config.sections[sectionId];
  if (!label) throw new Error(`Unknown ${area} Admin section: ${sectionId}`);
  return { config, label };
}

function sectionButton(page, config, label) {
  return page
    .getByRole("navigation", { name: config.navigationName, exact: true })
    .getByRole("button", { name: new RegExp(`^${label}\\b`) });
}

async function activeAdminSectionControl(page, config) {
  const picker = page.getByRole("combobox", {
    name: config.pickerName,
    exact: true
  });
  const navigation = page.getByRole("navigation", {
    name: config.navigationName,
    exact: true
  });

  // Changing Admin areas replaces the responsive section control on the next
  // render. `locator.isVisible()` is an immediate snapshot, so wait until the
  // compact picker or desktop navigation is actually ready before branching.
  await expect.poll(async () => (
    await picker.isVisible() || await navigation.isVisible()
  )).toBe(true);

  return {
    picker,
    compact: await picker.isVisible()
  };
}

export async function openAdminArea(page, area) {
  const config = adminArea(area);
  const toggle = page.getByRole("button", {
    name: config.toggleName,
    exact: true
  });
  if (await toggle.getAttribute("aria-pressed") !== "true") {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  return config;
}

export async function expectAdminSectionAvailable(page, area, sectionId) {
  const { config, label } = adminSection(area, sectionId);
  await openAdminArea(page, area);
  const { picker, compact } = await activeAdminSectionControl(page, config);
  if (compact) {
    await expect(picker.getByRole("option", { name: label, exact: true })).toHaveCount(1);
    return;
  }
  await expect(sectionButton(page, config, label)).toBeVisible();
}

export async function expectAdminSectionUnavailable(page, area, sectionId) {
  const label = Object.values(ADMIN_AREAS)
    .map(config => config.sections[sectionId])
    .find(Boolean);
  if (!label) throw new Error(`Unknown Admin section: ${sectionId}`);
  const config = await openAdminArea(page, area);
  const { picker, compact } = await activeAdminSectionControl(page, config);
  if (compact) {
    await expect(picker.getByRole("option", { name: label, exact: true })).toHaveCount(0);
    return;
  }
  await expect(sectionButton(page, config, label)).toHaveCount(0);
}

export async function openAdminSection(page, area, sectionId) {
  const { config, label } = adminSection(area, sectionId);
  await openAdminArea(page, area);
  const { picker, compact } = await activeAdminSectionControl(page, config);
  if (compact) {
    await picker.selectOption(sectionId);
    if (sectionId !== "questionFlags") {
      await expect(picker).toHaveValue(sectionId);
    }
    await expect.poll(() => new URL(page.url()).pathname)
      .toBe(ADMIN_SECTION_PATHS[sectionId]);
    return;
  }
  const button = sectionButton(page, config, label);
  await button.click();
  if (sectionId !== "questionFlags") {
    await expect(button).toHaveAttribute("aria-current", "page");
  }
  await expect.poll(() => new URL(page.url()).pathname)
    .toBe(ADMIN_SECTION_PATHS[sectionId]);
}

export { ADMIN_AREAS, ADMIN_SECTION_PATHS };
