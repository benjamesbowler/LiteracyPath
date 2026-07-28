import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { createInternalTeacherUsername } from "../../src/appState/teacherSignupIdentity.js";

let AuthPage;
let vite;
const controllerSource = readFileSync(
  new URL("../../src/appState/useAppSessionController.js", import.meta.url),
  "utf8"
);

const noop = () => {};

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ AuthPage } = await vite.ssrLoadModule("/src/components/AuthPage.jsx"));
});

test.after(async () => {
  await vite?.close();
});

function renderAuthPage(overrides = {}) {
  return renderToStaticMarkup(
    React.createElement(AuthPage, {
      authEmail: "",
      authPassword: "",
      authDisplayName: "",
      authSchoolName: "",
      authLoading: false,
      authMessage: "",
      setAuthMode: noop,
      setAuthEmail: noop,
      setAuthPassword: noop,
      setAuthDisplayName: noop,
      setAuthSchoolName: noop,
      signUpTeacher: noop,
      logInTeacher: noop,
      requestPasswordReset: noop,
      completePasswordReset: noop,
      logInDemoTeacher: noop,
      ...overrides
    })
  );
}

test("teacher sign-in uses a real form with required credentials", () => {
  const html = renderAuthPage();

  assert.match(html, /<form class="auth-form">/);
  assert.match(html, /<input[^>]*required=""[^>]*type="email"/);
  assert.match(html, /id="teacher-auth-password"[^>]*required=""/);
  assert.match(html, /type="submit"[^>]*>Sign in<\/button>/);
});

test("password visibility control is available without submitting the form", () => {
  const html = renderAuthPage();

  assert.match(
    html,
    /class="auth-password-toggle"[^>]*type="button"[^>]*>Show<\/button>/
  );
  assert.match(html, /aria-pressed="false"/);
});

test("signup asks only for teacher-facing identity and clearly labels email", () => {
  const html = renderAuthPage({ authMode: "signup" });

  assert.match(html, /Email address/);
  assert.match(html, /Name shown in LiteracyPath/);
  assert.match(html, />School</);
  assert.match(html, />Password</);
  assert.doesNotMatch(html, /Account name/);
  assert.doesNotMatch(html, /authUsername/);
  assert.doesNotMatch(html, /The name you will use to sign in/);
  assert.doesNotMatch(html, />Username</);
  assert.match(controllerSource, /createInternalTeacherUsername\(email\)/);
  assert.match(controllerSource, /username_unavailable[\s\S]*createInternalTeacherUsername\(email\)/);
});

test("signup creates a valid unique internal handle without teacher input", () => {
  const first = createInternalTeacherUsername("Ms.Rivera+reading@example.com", {
    randomUuid: () => "00000000-0000-4000-8000-000000000001"
  });
  const second = createInternalTeacherUsername("Ms.Rivera+reading@example.com", {
    randomUuid: () => "00000000-0000-4000-8000-000000000002"
  });

  assert.match(first, /^[a-z0-9_-]{3,30}$/);
  assert.ok(first.length <= 30);
  assert.notEqual(first, second);
});
