import { expect, test } from "@playwright/test";
import { auditClassForEmail, completeTeacherClassEntry } from "./support/teacherLanding.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

const TEACHER_A_EMAIL = "audit-teacher-a@literacypath.invalid";
const TEACHER_B_EMAIL = "audit-teacher-b@literacypath.invalid";
const TEACHER_B_ID = "10000000-0000-4000-8000-000000000002";
const ADMIN_A_EMAIL = "audit-admin@literacypath.invalid";
const ADMIN_A_ID = "12000000-0000-4000-8000-000000000001";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AUDIT_CLASS_B_ID = "30000000-0000-4000-8000-000000000002";
const AARAV_ID = "40000000-0000-4000-8000-000000000001";
const AISHA_ID = "40000000-0000-4000-8000-000000000002";
const MATEO_ID = "40000000-0000-4000-8000-000000000014";

function requireTeacherPassword() {
  if (!teacherPassword) {
    throw new Error(
      "LP_AUDIT_TEACHER_PASSWORD is required for the authenticated teacher route-race gate."
    );
  }
}

async function openTeacherSignIn(page) {
  const heading = page.getByRole("heading", { name: "Teacher sign-in" });
  const teacherEntry = page.getByRole("button", {
    name: "Teachers: Literacy Guide Teacher Tools"
  });
  await expect(heading.or(teacherEntry).first()).toBeVisible();
  if (!await heading.isVisible()) {
    await teacherEntry.click();
  }
  await expect(heading).toBeVisible();
}

async function submitTeacherSignIn(page, email) {
  requireTeacherPassword();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: `Sign out ${email}` })).toBeVisible({
    timeout: 20_000
  });
}

async function logIn(page, email) {
  await page.goto("/");
  await openTeacherSignIn(page);
  await submitTeacherSignIn(page, email);
  await completeTeacherClassEntry(page, auditClassForEmail(email));
}

function isTeacherClassListRequest(request) {
  const requestUrl = new URL(request.url());
  return requestUrl.pathname.endsWith("/rest/v1/classes")
    && requestUrl.searchParams.has("teacher_id")
    && String(requestUrl.searchParams.get("select") || "").includes("leaderboard_scope");
}

/**
 * Fetches one real class-list response immediately, but withholds it from the
 * app until release(). That leaves the old React continuation genuinely
 * pending while a newer route or identity is allowed to finish.
 */
async function createOneShotClassReadDelay(page) {
  let armed = false;
  let released = false;
  let releaseRead;
  let resolveBlocked;
  let rejectBlocked;
  let resolveSettled;
  let rejectSettled;
  const releaseGate = new Promise(resolve => {
    releaseRead = resolve;
  });
  const blocked = new Promise((resolve, reject) => {
    resolveBlocked = resolve;
    rejectBlocked = reject;
  });
  const settled = new Promise((resolve, reject) => {
    resolveSettled = resolve;
    rejectSettled = reject;
  });

  await page.route("**/rest/v1/classes?**", async route => {
    if (!armed || !isTeacherClassListRequest(route.request())) {
      await route.continue();
      return;
    }

    armed = false;
    try {
      const upstream = await route.fetch();
      const body = await upstream.text();
      resolveBlocked({
        body,
        status: upstream.status(),
        url: route.request().url()
      });
      await releaseGate;
      await route.fulfill({ response: upstream, body });
      resolveSettled();
    } catch (error) {
      rejectBlocked(error);
      rejectSettled(error);
      throw error;
    }
  });

  return {
    arm() {
      if (armed) throw new Error("The one-shot class-read delay is already armed.");
      armed = true;
    },
    blocked,
    async release() {
      if (!released) {
        released = true;
        releaseRead();
      }
      await settled;
    }
  };
}

function isAdminAccessRequestFor(request, userId) {
  const requestUrl = new URL(request.url());
  return requestUrl.pathname.endsWith("/rest/v1/app_admins")
    && requestUrl.searchParams.get("user_id") === `eq.${userId}`
    && String(requestUrl.searchParams.get("select") || "").includes("user_id");
}

/**
 * Captures the real positive app_admins response for one authenticated
 * account, but withholds it from React until release(). This proves the
 * identity guard at the actual PostgREST/auth boundary instead of replacing
 * the backend result with a test double.
 */
async function createOneShotAdminAccessDelay(page, userId) {
  let armed = true;
  let released = false;
  let releaseRead;
  let resolveBlocked;
  let rejectBlocked;
  let resolveSettled;
  let rejectSettled;
  const releaseGate = new Promise(resolve => {
    releaseRead = resolve;
  });
  const blocked = new Promise((resolve, reject) => {
    resolveBlocked = resolve;
    rejectBlocked = reject;
  });
  const settled = new Promise((resolve, reject) => {
    resolveSettled = resolve;
    rejectSettled = reject;
  });

  await page.route("**/rest/v1/app_admins?**", async route => {
    if (!armed || !isAdminAccessRequestFor(route.request(), userId)) {
      await route.continue();
      return;
    }

    armed = false;
    try {
      const upstream = await route.fetch();
      const body = await upstream.text();
      resolveBlocked({
        body,
        status: upstream.status(),
        url: route.request().url()
      });
      await releaseGate;
      await route.fulfill({ response: upstream, body });
      resolveSettled();
    } catch (error) {
      rejectBlocked(error);
      rejectSettled(error);
      throw error;
    }
  });

  return {
    blocked,
    async release() {
      if (!released) {
        released = true;
        releaseRead();
      }
      await settled;
    }
  };
}

/**
 * Holds the real lazily loaded teacher-route module. The rest of the signed-in
 * shell remains interactive, so a teacher can make a newer navigation while
 * the older profile restoration is genuinely suspended at its production
 * boundary.
 */
async function createOneShotTeacherRouteRuntimeDelay(page) {
  let armed = true;
  let released = false;
  let releaseRead;
  let resolveBlocked;
  let rejectBlocked;
  let resolveSettled;
  let rejectSettled;
  const releaseGate = new Promise(resolve => {
    releaseRead = resolve;
  });
  const blocked = new Promise((resolve, reject) => {
    resolveBlocked = resolve;
    rejectBlocked = reject;
  });
  const settled = new Promise((resolve, reject) => {
    resolveSettled = resolve;
    rejectSettled = reject;
  });

  await page.route("**/src/appState/routes.js**", async route => {
    if (!armed) {
      await route.continue();
      return;
    }

    armed = false;
    try {
      const upstream = await route.fetch();
      const body = await upstream.text();
      resolveBlocked({
        body,
        status: upstream.status(),
        url: route.request().url()
      });
      await releaseGate;
      await route.fulfill({ response: upstream, body });
      resolveSettled();
    } catch (error) {
      rejectBlocked(error);
      rejectSettled(error);
      throw error;
    }
  });

  return {
    blocked,
    async release() {
      if (!released) {
        released = true;
        releaseRead();
      }
      await settled;
    }
  };
}

async function signOutWithAppAuthClient(page) {
  const signOutError = await page.evaluate(async () => {
    const { supabase } = await import("/src/supabaseClient.js");
    const { error } = await supabase.auth.signOut();
    return error ? { message: error.message || String(error) } : null;
  });
  expect(signOutError).toBeNull();
  await openTeacherSignIn(page);
}

async function navigateHash(page, hash) {
  await page.evaluate(nextHash => {
    window.location.hash = nextHash;
  }, hash);
}

async function readTeacherRoute(page) {
  return page.evaluate(() => {
    const [path, query = ""] = window.location.hash.replace(/^#/, "").split("?");
    const params = new URLSearchParams(query);
    return {
      path,
      classId: params.get("class") || "",
      learnerId: params.get("learner") || "",
      report: params.get("report") || ""
    };
  });
}

async function flushReleasedRead(page) {
  await page.evaluate(() => new Promise(resolve => {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    }, 0);
  }));
}

async function expectFunnelContext(page, {
  classId,
  className,
  funnel,
  heading,
  learnerId,
  learnerName,
  path
}) {
  await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect.poll(() => readTeacherRoute(page)).toMatchObject({
    path,
    classId,
    learnerId
  });
  const shell = page.locator(".lg-app-shell");
  await expect(shell).toHaveAttribute("data-teacher-class-id", classId);
  await expect(shell).toHaveAttribute("data-teacher-learner-id", learnerId);
  const funnelPage = page.locator(`[data-teacher-funnel="${funnel}"]`);
  if (funnel === "checks") {
    // 2026-07-29: the v2 Assessments screen takes its class from the shared
    // context bar and scopes one student select to it, so the class and the
    // student are read from the select's label and its chosen option.
    const studentPanel = funnelPage.locator(".teacher-assess-panel-student");
    await expect(studentPanel).toContainText(`Student in ${className}`);
    await expect(studentPanel.locator("select")).toHaveValue(learnerId);
    await expect(studentPanel.locator("select option:checked")).toHaveText(learnerName);
    return;
  }
  await expect(funnelPage.locator(".teacher-funnel-step[data-step='1']")).toContainText(className);
  await expect(funnelPage.locator(".teacher-funnel-step[data-step='2']")).toContainText(learnerName);
}

for (const section of [
  {
    funnel: "reports",
    heading: "Open a report",
    path: "teacher/reports"
  },
  {
    funnel: "checks",
    heading: "Assess a student",
    path: "teacher/assessments"
  }
]) {
  test(`@teacher-route-race a newer ${section.path} class and student choice survives an older bare-route class read`, async ({
    page
  }) => {
    test.setTimeout(120_000);
    await logIn(page, TEACHER_A_EMAIL);

    await navigateHash(
      page,
      `#${section.path}?class=${AUDIT_CLASS_A_ID}&group=all&learner=${AARAV_ID}`
    );
    await expectFunnelContext(page, {
      ...section,
      classId: AUDIT_CLASS_A_ID,
      className: "Audit Class A",
      learnerId: AARAV_ID,
      learnerName: "Aarav"
    });

    const delayedRead = await createOneShotClassReadDelay(page);
    delayedRead.arm();
    await navigateHash(page, `#${section.path}`);
    const blocked = await delayedRead.blocked;
    expect(blocked.status).toBe(200);
    expect(JSON.parse(blocked.body).map(row => row.name)).toEqual(["Audit Class A"]);

    let released = false;
    try {
      await navigateHash(
        page,
        `#${section.path}?class=${AUDIT_CLASS_A_ID}&group=all&learner=${AISHA_ID}`
      );
      await expectFunnelContext(page, {
        ...section,
        classId: AUDIT_CLASS_A_ID,
        className: "Audit Class A",
        learnerId: AISHA_ID,
        learnerName: "Aisha"
      });

      await delayedRead.release();
      released = true;
      await flushReleasedRead(page);

      await expectFunnelContext(page, {
        ...section,
        classId: AUDIT_CLASS_A_ID,
        className: "Audit Class A",
        learnerId: AISHA_ID,
        learnerName: "Aisha"
      });
    } finally {
      if (!released) await delayedRead.release();
    }
  });
}

async function installDeepReportHistory(page) {
  const reportHash =
    `#teacher/reports/report?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check`;
  await page.evaluate(({ dashboardHash, nextReportHash }) => {
    window.history.replaceState({ auditRoute: "dashboard" }, "", dashboardHash);
    window.history.pushState({ auditRoute: "report" }, "", nextReportHash);
  }, {
    dashboardHash: "#teacher/dashboard",
    nextReportHash: reportHash
  });
  return reportHash;
}

test("@teacher-route-history Back during initial deep-report restoration keeps the Dashboard destination", async ({
  page
}) => {
  test.setTimeout(120_000);
  await logIn(page, TEACHER_A_EMAIL);
  await installDeepReportHistory(page);

  const delayedRead = await createOneShotClassReadDelay(page);
  delayedRead.arm();
  await page.reload({ waitUntil: "domcontentloaded" });
  const blocked = await delayedRead.blocked;
  expect(blocked.status).toBe(200);
  expect(JSON.parse(blocked.body).map(row => row.name)).toEqual(["Audit Class A"]);

  let released = false;
  try {
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Start with these students", exact: true })).toBeVisible({
      timeout: 20_000
    });
    await expect.poll(() => readTeacherRoute(page)).toMatchObject({
      path: "teacher/dashboard",
      learnerId: "",
      report: ""
    });

    await delayedRead.release();
    released = true;
    await flushReleasedRead(page);

    await expect(page.getByRole("heading", { name: "Start with these students", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toHaveCount(0);
    await expect.poll(() => readTeacherRoute(page)).toMatchObject({
      path: "teacher/dashboard",
      learnerId: "",
      report: ""
    });
  } finally {
    if (!released) await delayedRead.release();
  }
});

test("@teacher-route-history Back then Forward during initial deep-report restoration keeps the report destination", async ({
  page
}) => {
  test.setTimeout(120_000);
  await logIn(page, TEACHER_A_EMAIL);
  await installDeepReportHistory(page);

  const delayedRead = await createOneShotClassReadDelay(page);
  delayedRead.arm();
  await page.reload({ waitUntil: "domcontentloaded" });
  const blocked = await delayedRead.blocked;
  expect(blocked.status).toBe(200);

  let released = false;
  try {
    await page.goBack();
    await expect.poll(() => readTeacherRoute(page)).toMatchObject({
      path: "teacher/dashboard"
    });
    await page.goForward();
    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
      timeout: 20_000
    });

    await delayedRead.release();
    released = true;
    await flushReleasedRead(page);

    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "About this report" })).toContainText("Aarav");
    await expect.poll(() => readTeacherRoute(page)).toEqual({
      path: "teacher/reports/report",
      classId: AUDIT_CLASS_A_ID,
      learnerId: AARAV_ID,
      report: "skills-check"
    });
  } finally {
    if (!released) await delayedRead.release();
  }
});

test("@teacher-account-route-race a delayed teacher-A route result cannot repopulate teacher B", async ({
  page
}) => {
  test.setTimeout(120_000);
  await logIn(page, TEACHER_A_EMAIL);

  const delayedRead = await createOneShotClassReadDelay(page);
  delayedRead.arm();
  await navigateHash(
    page,
    `#teacher/assessments?class=${AUDIT_CLASS_A_ID}&group=all&learner=${AARAV_ID}`
  );
  const blocked = await delayedRead.blocked;
  expect(blocked.status).toBe(200);
  expect(JSON.parse(blocked.body).map(row => row.name)).toEqual(["Audit Class A"]);

  let released = false;
  try {
    await page.getByRole("button", { name: `Sign out ${TEACHER_A_EMAIL}` }).click();
    await openTeacherSignIn(page);
    await submitTeacherSignIn(page, TEACHER_B_EMAIL);

    await navigateHash(
      page,
      `#teacher/reports/report?class=${AUDIT_CLASS_B_ID}&learner=${MATEO_ID}&report=skills-check`
    );
    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
      timeout: 20_000
    });
    await expect(page.getByRole("region", { name: "About this report" })).toContainText("Mateo");

    await delayedRead.release();
    released = true;
    await flushReleasedRead(page);

    const shell = page.locator(".lg-app-shell");
    await expect(shell).toHaveAttribute("data-teacher-class-id", AUDIT_CLASS_B_ID);
    await expect(shell).toHaveAttribute("data-teacher-learner-id", MATEO_ID);
    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Assess a student", exact: true }))
      .toHaveCount(0);
    await expect(page.getByRole("region", { name: "About this report" })).toContainText(
      "Audit Class B"
    );
    await expect(page.getByRole("button", { name: `Sign out ${TEACHER_B_EMAIL}` })).toBeVisible();
    await expect.poll(() => readTeacherRoute(page)).toEqual({
      path: "teacher/reports/report",
      classId: AUDIT_CLASS_B_ID,
      learnerId: MATEO_ID,
      report: "skills-check"
    });

    await expect.poll(() => page.evaluate(profileKey => {
      const profile = JSON.parse(window.localStorage.getItem(profileKey) || "{}");
      return {
        appView: profile.appView || "",
        selectedClassId: profile.selectedClassId || "",
        teacherStudentId: profile.teacherStudentId || ""
      };
    }, `readingMasteryProfile:${TEACHER_B_ID}`)).toEqual({
      appView: "finished",
      selectedClassId: AUDIT_CLASS_B_ID,
      teacherStudentId: MATEO_ID
    });
    const teacherBProfile = await page.evaluate(profileKey => (
      window.localStorage.getItem(profileKey) || ""
    ), `readingMasteryProfile:${TEACHER_B_ID}`);
    expect(teacherBProfile).not.toContain(AUDIT_CLASS_A_ID);
    expect(teacherBProfile).not.toContain(AARAV_ID);
  } finally {
    if (!released) await delayedRead.release();
  }
});

test("@teacher-profile-navigation-race Admin stays open when an older profile restore finishes", async ({
  page
}) => {
  test.setTimeout(120_000);
  requireTeacherPassword();
  await page.addInitScript(({ profileKey }) => {
    window.localStorage.setItem(profileKey, JSON.stringify({
      appView: "teacherDashboard",
      selectedClassId: "",
      teacherStudentId: "",
      teacherStudentName: ""
    }));
  }, {
    profileKey: `readingMasteryProfile:${ADMIN_A_ID}`
  });
  const delayedRouteRuntime = await createOneShotTeacherRouteRuntimeDelay(page);

  await page.goto("/");
  await openTeacherSignIn(page);
  await page.getByRole("textbox", { name: "Email" }).fill(ADMIN_A_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  const blocked = await delayedRouteRuntime.blocked;
  expect(blocked.status).toBe(200);
  expect(blocked.url).toContain("/src/appState/routes.js");

  let released = false;
  try {
    const adminButton = page.getByRole("button", { name: "Admin", exact: true });
    await expect(adminButton).toBeVisible({ timeout: 20_000 });
    await adminButton.click();
    await expect(page.getByRole("heading", {
      name: "Admin Dashboard",
      exact: true
    })).toBeVisible({ timeout: 20_000 });

    await delayedRouteRuntime.release();
    released = true;
    await flushReleasedRead(page);

    await expect(page.getByRole("heading", {
      name: "Admin Dashboard",
      exact: true
    })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Start with these students", exact: true })).toHaveCount(0);
  } finally {
    if (!released) await delayedRouteRuntime.release();
  }
});

test("@teacher-admin-account-race a delayed positive admin result cannot grant teacher B privileged UI or stale context", async ({
  page
}) => {
  test.setTimeout(120_000);
  requireTeacherPassword();
  await page.goto(
    `/#teacher/assessments?class=${AUDIT_CLASS_A_ID}&group=all&learner=${AARAV_ID}`
  );
  await openTeacherSignIn(page);

  const delayedAdminRead = await createOneShotAdminAccessDelay(page, ADMIN_A_ID);
  await page.getByRole("textbox", { name: "Email" }).fill(ADMIN_A_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  const blocked = await delayedAdminRead.blocked;
  expect(blocked.status).toBe(200);
  const blockedAdminBody = JSON.parse(blocked.body);
  const blockedAdminRow = Array.isArray(blockedAdminBody)
    ? blockedAdminBody[0]
    : blockedAdminBody;
  expect(blockedAdminRow).toMatchObject({
    user_id: ADMIN_A_ID,
    email: ADMIN_A_EMAIL
  });

  let released = false;
  try {
    await signOutWithAppAuthClient(page);
    await navigateHash(page, "#teacher/dashboard");
    await submitTeacherSignIn(page, TEACHER_B_EMAIL);
    await completeTeacherClassEntry(page, "Audit Class B");

    await navigateHash(
      page,
      `#teacher/reports/report?class=${AUDIT_CLASS_B_ID}&learner=${MATEO_ID}&report=skills-check`
    );
    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
      timeout: 20_000
    });
    await expect(page.getByRole("region", { name: "About this report" })).toContainText("Mateo");
    await expect(page.getByRole("button", { name: "Admin", exact: true })).toHaveCount(0);

    await page.evaluate(() => {
      window.__auditSawStaleAdminUi = false;
      const observeAdminUi = () => {
        const adminButton = Array.from(document.querySelectorAll("button")).find(button => (
          button.textContent?.trim() === "Admin"
          || button.getAttribute("aria-label") === "Admin"
        ));
        if (adminButton) window.__auditSawStaleAdminUi = true;
      };
      observeAdminUi();
      window.__auditAdminUiObserver = new MutationObserver(observeAdminUi);
      window.__auditAdminUiObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    });

    await delayedAdminRead.release();
    released = true;
    await flushReleasedRead(page);

    await expect.poll(() => page.evaluate(() => window.__auditSawStaleAdminUi)).toBe(false);
    await expect(page.getByRole("button", { name: "Admin", exact: true })).toHaveCount(0);
    await expect(page.locator(".admin-dashboard")).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Sign out ${TEACHER_B_EMAIL}` })).toBeVisible();

    const shell = page.locator(".lg-app-shell");
    await expect(shell).toHaveAttribute("data-teacher-class-id", AUDIT_CLASS_B_ID);
    await expect(shell).toHaveAttribute("data-teacher-learner-id", MATEO_ID);
    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "About this report" })).toContainText(
      "Audit Class B"
    );
    await expect.poll(() => readTeacherRoute(page)).toEqual({
      path: "teacher/reports/report",
      classId: AUDIT_CLASS_B_ID,
      learnerId: MATEO_ID,
      report: "skills-check"
    });

    await expect.poll(() => page.evaluate(profileKey => {
      const profile = JSON.parse(window.localStorage.getItem(profileKey) || "{}");
      return {
        appView: profile.appView || "",
        selectedClassId: profile.selectedClassId || "",
        teacherStudentId: profile.teacherStudentId || ""
      };
    }, `readingMasteryProfile:${TEACHER_B_ID}`)).toEqual({
      appView: "finished",
      selectedClassId: AUDIT_CLASS_B_ID,
      teacherStudentId: MATEO_ID
    });
    const teacherBProfile = await page.evaluate(profileKey => (
      window.localStorage.getItem(profileKey) || ""
    ), `readingMasteryProfile:${TEACHER_B_ID}`);
    expect(teacherBProfile).not.toContain(ADMIN_A_ID);
    expect(teacherBProfile).not.toContain(AUDIT_CLASS_A_ID);
    expect(teacherBProfile).not.toContain(AARAV_ID);
  } finally {
    await page.evaluate(() => {
      window.__auditAdminUiObserver?.disconnect();
      delete window.__auditAdminUiObserver;
    }).catch(() => {});
    if (!released) await delayedAdminRead.release();
  }
});
