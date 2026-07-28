import { expect, test } from "@playwright/test";

const SEEDED_SCHOOL_NAME = "[AUDIT ONLY] LiteracyPath Seed School";
const PRIVATE_FIXTURE_MARKERS = [
  "audit-teacher-a@literacypath.invalid",
  "audit-teacher-b@literacypath.invalid",
  "Audit Class A",
  "Audit Class B",
  "Aarav",
  "Aisha",
  "10000000-0000-4000-8000-000000000001",
  "30000000-0000-4000-8000-000000000001",
  "40000000-0000-4000-8000-000000000001"
];
const PRIVATE_REST_RESOURCES = new Set([
  "answers",
  "assessment_attempts",
  "assessment_sessions",
  "classes",
  "el_assessment_reports",
  "item_mastery",
  "mastery",
  "pending_teacher_accounts",
  "schools",
  "student_progress",
  "students",
  "teacher_instructional_groups",
  "teacher_interventions"
]);

function restResource(requestUrl) {
  const url = new URL(requestUrl);
  const marker = "/rest/v1/";
  const markerIndex = url.pathname.indexOf(marker);
  if (markerIndex < 0) return "";
  return url.pathname.slice(markerIndex + marker.length).split("/")[0] || "";
}

test(
  "D-082 @signed-out-school-autocomplete returns name-only audit-school suggestions through the anonymous database boundary",
  async ({ context, page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedRestRequests = [];
    const failedRestResponses = [];
    const observedRestRequests = [];

    page.on("console", message => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("requestfailed", request => {
      if (restResource(request.url())) {
        failedRestRequests.push({
          failure: request.failure()?.errorText || "unknown request failure",
          method: request.method(),
          url: request.url()
        });
      }
    });
    page.on("response", response => {
      const resource = restResource(response.url());
      if (resource && response.status() >= 400) {
        failedRestResponses.push({
          resource,
          status: response.status(),
          url: response.url()
        });
      }
    });
    page.on("request", request => {
      const resource = restResource(request.url());
      if (!resource) return;
      observedRestRequests.push({
        method: request.method(),
        resource,
        url: request.url()
      });
    });

    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();

    await page.getByRole("button", {
      name: "Teachers: Literacy Guide Teacher Tools"
    }).click();
    await expect(page.getByRole("heading", { name: "Teacher sign-in" })).toBeVisible();

    const schoolNamesResponsePromise = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname.endsWith("/rest/v1/rpc/list_school_names");
    });
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("heading", {
      name: "Create teacher account",
      exact: true
    })).toBeVisible();

    const schoolNamesResponse = await schoolNamesResponsePromise;
    const schoolNamesRequest = schoolNamesResponse.request();
    const schoolNamesRequestHeaders = schoolNamesRequest.headers();
    const publicApiKey = schoolNamesRequestHeaders.apikey || "";
    const authorization = schoolNamesRequestHeaders.authorization || "";

    expect(schoolNamesRequest.method()).toBe("POST");
    expect(schoolNamesRequest.postDataJSON() || {}).toEqual({});
    expect(schoolNamesResponse.status()).toBe(200);
    expect(publicApiKey).not.toBe("");
    expect(authorization).toBe(`Bearer ${publicApiKey}`);

    const schoolRows = await schoolNamesResponse.json();
    expect(Array.isArray(schoolRows)).toBe(true);
    expect(schoolRows.length).toBeGreaterThan(0);
    expect(schoolRows).toContainEqual({ name: SEEDED_SCHOOL_NAME });
    for (const row of schoolRows) {
      expect(row).not.toBeNull();
      expect(Array.isArray(row)).toBe(false);
      expect(Object.keys(row)).toEqual(["name"]);
      expect(typeof row.name).toBe("string");
    }

    const schoolInput = page.locator('input[list][placeholder="Choose your school or type a new one"]');
    await expect(schoolInput).toBeVisible();
    const linkedListId = await schoolInput.getAttribute("list");
    expect(linkedListId).toBeTruthy();

    const renderedSchoolNames = await page.locator("datalist").evaluateAll(
      (lists, expectedListId) => {
        const linkedList = lists.find(list => list.id === expectedListId);
        return linkedList
          ? [...linkedList.querySelectorAll("option")].map(option => option.value)
          : [];
      },
      linkedListId
    );
    expect(renderedSchoolNames).toEqual(schoolRows.map(row => row.name));
    expect(renderedSchoolNames).toContain(SEEDED_SCHOOL_NAME);
    await schoolInput.fill(SEEDED_SCHOOL_NAME);
    await expect(schoolInput).toHaveValue(SEEDED_SCHOOL_NAME);

    await page.waitForLoadState("networkidle");

    const privateRequests = observedRestRequests.filter(request => (
      PRIVATE_REST_RESOURCES.has(request.resource)
      || (
        request.resource === "rpc"
        && !request.url.endsWith("/rest/v1/rpc/list_school_names")
      )
    ));
    expect(privateRequests).toEqual([]);

    const responseText = JSON.stringify(schoolRows);
    const visibleText = await page.locator("body").innerText();
    for (const marker of PRIVATE_FIXTURE_MARKERS) {
      expect(responseText).not.toContain(marker);
      expect(visibleText).not.toContain(marker);
    }
    expect(responseText).not.toMatch(
      /"(?:id|school_id|teacher_id|class_id|student_id|email|display_name)"\s*:/
    );
    expect(visibleText).not.toMatch(
      /(?:permission denied|row-level security|schema cache|list_school_names|PostgREST)/i
    );

    const storedAuthSessions = await page.evaluate(() => (
      Object.entries(window.localStorage)
        .filter(([key, value]) => (
          /auth-token/i.test(key)
          && typeof value === "string"
          && /"access_token"\s*:\s*"[^"]+"/i.test(value)
        ))
    ));
    expect(storedAuthSessions).toEqual([]);
    expect(failedRestRequests).toEqual([]);
    expect(failedRestResponses).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  }
);
