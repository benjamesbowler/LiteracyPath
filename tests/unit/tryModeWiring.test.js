import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = name => readFileSync(new URL(`../../src/${name}`, import.meta.url), "utf8");
const appSurface = read("components/AppSurface.jsx");
const controller = read("appState/useAppSessionController.js");
const booksPage = read("components/StudentBooksPage.jsx");
const entryPage = read("components/StudentEntryPage.jsx");

test("try-mode closes the network BEFORE any child surface can mount", () => {
  // Order is the whole guarantee. A surface that mounted first would fire its
  // reads against a live client.
  const start = controller.slice(controller.indexOf("function startTryMode"));
  const body = start.slice(0, start.indexOf("function endTryMode"));
  const storageAt = body.indexOf("beginTryModeSession");
  const networkAt = body.indexOf("setEphemeralNetworkMode(true)");
  const viewAt = body.indexOf("APP_VIEWS.STUDENT_HOME");

  assert.ok(storageAt > -1 && networkAt > -1 && viewAt > -1);
  assert.ok(storageAt < networkAt, "storage must be swapped before the network is closed");
  assert.ok(networkAt < viewAt, "the network must be closed before a child surface is shown");
});

test("a failed storage swap refuses the demo rather than degrading it", () => {
  // Running against real storage would collect from a child while the previous
  // screen promised it would not.
  assert.match(controller, /if \(!session\) return null;/);
  assert.match(appSurface, /if \(!startTryMode\(level\)\) setTryUnavailable\(true\)/);
  assert.match(appSurface, /unavailable=\{tryUnavailable\}/);
});

test("try-mode never configures progress sync or hydrates cloud progress", () => {
  const start = controller.indexOf("function startTryMode");
  const body = controller.slice(start, controller.indexOf("function endTryMode"));
  // A mode that promises to send nothing should not be making requests and
  // swallowing the refusals.
  assert.ok(!/configureProgressSync/.test(body), "try-mode must not configure progress sync");
  assert.ok(!/hydrateCloudProgress/.test(body), "try-mode must not hydrate cloud progress");
  assert.ok(!/localStorage\.setItem/.test(body), "try-mode must not write a session record");
});

test("ending a try session restores storage and reopens the network", () => {
  const end = controller.slice(controller.indexOf("function endTryMode"));
  const body = end.slice(0, 900);
  assert.match(body, /trySession\?\.end\?\.\(\)/);
  assert.match(body, /setEphemeralNetworkMode\(false\)/);
});

test("the exit screen names the nickname captured before teardown", () => {
  // By the time it renders the session object is gone.
  assert.match(appSurface, /setEndedTryNickname\(trySession\?\.nickname \|\| ""\)/);
  const finish = appSurface.slice(appSurface.indexOf("function finishTrySession"));
  const captureAt = finish.indexOf("setEndedTryNickname");
  const teardownAt = finish.indexOf("endTryMode()");
  assert.ok(captureAt < teardownAt, "capture the nickname before ending the session");
});

test("the shelf applies the entitlement slice after the publication blocklist", () => {
  // The two fail in OPPOSITE directions and the order encodes which wins.
  const memo = booksPage.slice(booksPage.indexOf("filterPublishedGuidedReadingBooks(runtimeBooks"));
  const blocklistAt = memo.indexOf("filterPublishedGuidedReadingBooks");
  const sliceAt = memo.indexOf("filterToEntitlement");
  assert.ok(blocklistAt > -1 && sliceAt > blocklistAt);
  assert.match(booksPage, /hasFullContent: !allowedBookIds/);
});

test("a full-content session passes no allowed list, so nothing changes for it", () => {
  assert.match(appSurface, /trySession \? sampleBookIds\(GUIDED_READING_BOOK_INDEX\) : null/);
  assert.match(appSurface, /allowedBookIds=\{sampleBookIdSet\}/);
  assert.match(appSurface, /sampleLimitCopy=\{trySession \? SAMPLE_LIMIT_COPY : null\}/);
});

test("the try entry exists and says what it costs", () => {
  assert.match(entryPage, /onTry/);
  assert.match(entryPage, /nothing is saved/i);
  assert.match(appSurface, /onTry=\{\(\) => setEntryMode\("try"\)\}/);
});

test("the child sees where the shelf stops, with the grown-up told why", () => {
  assert.match(booksPage, /kg-sample-note/);
  assert.match(booksPage, /sampleLimitCopy\.childHeading/);
  assert.match(booksPage, /sampleLimitCopy\.adultBody/);
});
