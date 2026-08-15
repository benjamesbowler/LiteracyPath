import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const read = name => readFileSync(new URL(`../../src/${name}`, import.meta.url), "utf8");
const appSurface = read("components/AppSurface.jsx");
const controller = read("appState/useAppSessionController.js");
const booksPage = read("components/StudentBooksPage.jsx");
const entryPage = read("components/StudentEntryPage.jsx");

function runtimeSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return runtimeSourceFiles(absolute);
    return /\.(?:css|html|js|jsx)$/.test(entry.name) ? [absolute] : [];
  });
}

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

test("the shelf applies the entitlement slice after the publication allowlist", () => {
  const memo = booksPage.slice(booksPage.indexOf("filterPublishedGuidedReadingBooks(runtimeBooks"));
  const publicationAt = memo.indexOf("filterPublishedGuidedReadingBooks");
  const sliceAt = memo.indexOf("filterToEntitlement");
  assert.ok(publicationAt > -1 && sliceAt > publicationAt);
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

  // Lazy-loaded game CSS and generated print/presentation documents are still
  // runtime surfaces. Checking index.html alone allowed an old import to hide
  // until a CI screenshot happened to preload that chunk.
  const runtimeRoots = ["../../src", "../../preview"].map(relative =>
    fileURLToPath(new URL(relative, import.meta.url))
  );
  const externalFontLink = /@import\s+(?:url\()?['"]https:\/\/fonts\.(?:googleapis|gstatic)\.com|<link[^>]+href=['"]https:\/\/fonts\.(?:googleapis|gstatic)\.com/i;
  for (const runtimeRoot of runtimeRoots) {
    for (const file of runtimeSourceFiles(runtimeRoot)) {
      assert.doesNotMatch(
        readFileSync(file, "utf8"),
        externalFontLink,
        `${path.relative(runtimeRoot, file)} can fetch a Google font at runtime`
      );
    }
  }

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

test("a try session is not mistaken for a broken student session", () => {
  // THE BUG: pressing "Start playing" landed the child on the class-code login
  // screen. The recovery guard below returns any student session missing a
  // token to the login flow — and the anonymous try-out deliberately has no
  // token, because obtaining one means the account and the collection the mode
  // exists to avoid. A token-less session read as a half-restored one.
  const surface = read("components/AppSurface.jsx");
  const guard = surface.match(
    /sessionMode === "student"\s*&&[\s\S]{0,200}?!studentSession\?\.token[\s\S]{0,120}?\)\s*\{/
  );
  assert.ok(guard, "the student-session recovery guard has moved or changed shape");
  assert.match(
    guard[0],
    /!trySession/,
    "the recovery guard must exempt the anonymous try-out, which has no token by design"
  );
});

test("nobody without a session asks the database for the book approval list", () => {
  // Two separate problems, one guard. An anonymous visitor on the front page was
  // doing an unauthenticated read of admin review rows; and because that request
  // was still in flight when try-mode began, the Supabase SDK's own retry went
  // out DURING the anonymous session, from inside the SDK where the ephemeral
  // boundary cannot reach it. Verified in a real browser: zero external requests
  // for the whole try session.
  const surface = read("components/AppSurface.jsx");
  const effect = surface.match(
    /useEffect\(\(\) => \{[\s\S]{0,2200}?refreshGuidedReadingReviews\(\);[\s\S]{0,200}?\}, \[[^\]]*\]\);/
  );
  assert.ok(effect, "the guided-reading review effect has moved");
  assert.match(effect[0], /if \(trySession\) return undefined;/,
    "try-mode must not ask for the approval list");
  assert.match(effect[0], /if \(!teacherId && !studentSession\?\.token\) return undefined;/,
    "a visitor with no session must not ask for the approval list");
  assert.match(effect[0], /trySession\]/, "trySession must be in the dependency list");
  assert.match(surface, /guidedReadingPublicationStatus = trySession[\s\S]{0,80}?"unavailable"/);
});

test("the arcade doorway counts the games the session can actually reach", () => {
  // The tile read "11 games" while the sampled arcade held four. The one visitor
  // most likely to count is the one being sold to.
  const home = read("components/StudentHomePage.jsx");
  const counter = home.match(/function arcadeGameCount\(\)[\s\S]{0,320}?\n\}/);
  assert.ok(counter, "arcadeGameCount has moved");
  assert.match(counter[0], /filterSample\("games", GAME_LIST\)/,
    "the doorway count must go through the sample filter");
  assert.match(home, /import \{ filterSample \} from "\.\.\/policy\/freeTierContent\.js"/);
});

test("the sample notice sits after the books, not before them", () => {
  // It was rendered above the shelf, so a child arriving for the first time was
  // congratulated — "You read everything in the free set. Well done!" — before
  // they had opened anything, and the shelf looked empty when it was full.
  const books = read("components/StudentBooksPage.jsx");
  const noteAt = books.indexOf("kg-sample-note");
  const gridAt = books.indexOf("kg-book-card");
  assert.ok(noteAt > 0 && gridAt > 0, "the shelf markup has moved");
  assert.ok(noteAt > gridAt,
    "end-of-shelf copy must render after the book grid, not above it");
});
