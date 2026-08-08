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
  // The header button is a door, not the disclosure. The honest "nothing is
  // saved" wording lives on the page it opens, where an adult has stopped to
  // read — a top-bar button is not the place for a paragraph.
  assert.match(entryPage, /className="lp-landing-try"/);
  assert.match(entryPage, /Try for free/);
  assert.match(appSurface, /onTry=\{\(\) => setEntryMode\("try"\)\}/);
  const notice = read("policy/tryModeSession.js");
  assert.match(notice, /nothing about your child is stored or sent anywhere/i);
});

test("the child sees where the shelf stops, with the grown-up told why", () => {
  assert.match(booksPage, /kg-sample-note/);
  assert.match(booksPage, /sampleLimitCopy\.childHeading/);
  assert.match(booksPage, /sampleLimitCopy\.adultBody/);
});

test("the sample scope is set with the other two boundaries, and cleared with them", () => {
  const start = controller.slice(controller.indexOf("function startTryMode"));
  const body = start.slice(0, start.indexOf("function endTryMode"));
  assert.match(body, /setSampleContentScope\(true\)/);
  assert.ok(
    body.indexOf("setEphemeralNetworkMode(true)") < body.indexOf("APP_VIEWS.STUDENT_HOME"),
    "boundaries must close before a child surface is shown"
  );
  const end = controller.slice(controller.indexOf("function endTryMode"), controller.indexOf("function restoreStudentSession"));
  assert.match(end, /setSampleContentScope\(false\)/);
});

test("games, phonics cycles and story quests all read the sample scope", () => {
  const surfaces = {
    "components/learn/games/GameArcadeHub.jsx": /filterSample\("games"/,
    "components/StudentAdventureMapPage.jsx": /filterSample\("cycles"/,
    "components/StudentStoryQuestsPage.jsx": /filterSample\("storyQuests"/
  };
  for (const [file, pattern] of Object.entries(surfaces)) {
    assert.match(read(file), pattern, `${file} does not apply the sample`);
  }
});

test("sampled surfaces compute per render, not at module load", () => {
  // The scope is set when a try session starts, long after these modules are
  // evaluated. A module-level constant would capture the full list forever.
  const hub = read("components/learn/games/GameArcadeHub.jsx");
  assert.ok(!/^const (ARCADE_GAMES|PRACTICE_GAMES|TABS) =/m.test(hub),
    "arcade shelves must be functions, not module constants");
  const map = read("components/StudentAdventureMapPage.jsx");
  assert.ok(!/^const PLAYABLE_CYCLES =/m.test(map),
    "playable cycles must be a function, not a module constant");
});

test("no font is fetched from Google, and the CSP would not allow it", () => {
  // The last third-party request from a child's browser. On the school product
  // it was a negotiable subprocessor; on an anonymous children's try-out it is
  // a request to Google before the child has touched anything, which undercuts
  // the one claim the whole mode rests on.
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html),
    "index.html still links Google Fonts");

  // Belt and braces: even if a link came back, the CSP now refuses it, so the
  // regression is visible in the browser console rather than silent.
  const vercel = readFileSync(new URL("../../vercel.json", import.meta.url), "utf8");
  assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(vercel),
    "the CSP still permits Google font domains");

  // And the families are actually present, so this is a swap rather than a deletion.
  const fonts = readFileSync(new URL("../../src/styles/fonts.js", import.meta.url), "utf8");
  for (const family of ["anton", "baloo-2", "press-start-2p", "fredoka", "inter", "lexend", "nunito"]) {
    assert.match(fonts, new RegExp(`@fontsource/${family}/`), `${family} is not self-hosted`);
  }
  const main = readFileSync(new URL("../../src/main.jsx", import.meta.url), "utf8");
  assert.match(main, /import '\.\/styles\/fonts\.js'/);
});

test("the landing page keeps exactly two side-by-side destination cards", () => {
  // A third item was added to that grid on 2026-08-07 and broke the two-column
  // layout. The try-out entry belongs in the header, not in this grid.
  const entry = readFileSync(new URL("../../src/components/StudentEntryPage.jsx", import.meta.url), "utf8");
  // Matched with a trailing space so `student-entry-card-text` — which appears
  // inside each card — is not counted as a card itself.
  const cards = entry.match(/className="student-entry-card /g) || [];
  assert.equal(cards.length, 2, `expected 2 destination cards, found ${cards.length}`);
  assert.ok(!/student-entry-try/.test(entry), "the try entry must not sit in the card grid");
  assert.match(entry, /className="lp-landing-try"/);
});
