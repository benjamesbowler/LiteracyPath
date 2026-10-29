import assert from "node:assert/strict";
import test from "node:test";

import { GUIDED_READING_BOOK_INDEX } from "../../src/data/generated/guidedReadingBookIndex.generated.js";
import { buildDailyMission } from "../../src/utils/dailyMission.js";

const SUN = "gr-a-27";
const LUNCHBOX = "willow-street-the-lunchbox-mix-up";
const WHEEL = "willow-street-the-squeaky-wheel";
const SHY = "meadow-pals-09-shy-comes-out-to-play";
const HUNGRY = "meadow-pals-12-hungry-eats-everything";
const READ_ALOUD = "meadow-pals-science-01-missing-sandwich";

function quarantineExcept(ids) {
  const allowed = new Set(ids);
  return GUIDED_READING_BOOK_INDEX.filter(book => !allowed.has(book.id)).map(book => book.id);
}

function withRecords(scope, records, callback) {
  const previousWindow = globalThis.window;
  const values = new Map([[
    `literacyPath.guidedReadingRecords.${encodeURIComponent(scope)}`,
    JSON.stringify(records)
  ]]);
  globalThis.window = {
    localStorage: {
      getItem: key => values.get(key) ?? null
    }
  };
  try {
    return callback();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}

test("daily mission describes The Sun by its current App D review rather than internal B placement", () => {
  assert.equal(GUIDED_READING_BOOK_INDEX.find(book => book.id === SUN).level, "B");
  withRecords("sun-reader", {}, () => {
    const { book } = buildDailyMission("sun-reader", quarantineExcept([SUN]));
    assert.equal(book.bookId, SUN);
    assert.equal(book.detail, "App level D");
    assert.match(book.why, /App level D/);
    assert.doesNotMatch(book.why, /Level B/);
  });
});

test("the lowest unread pool uses App complexity even when internal placement orders the books differently", () => {
  withRecords("complexity-order", {}, () => {
    const { book } = buildDailyMission("complexity-order", quarantineExcept([SUN, LUNCHBOX]));
    assert.equal(book.bookId, LUNCHBOX, "App C precedes App D despite internal C following internal B");
    assert.equal(book.detail, "App level C");
  });
});

test("books sharing an App band remain in one rotating pool across different internal placements", () => {
  const quarantined = quarantineExcept([SUN, WHEEL]);
  const picks = new Set();
  for (let index = 0; index < 12; index += 1) {
    const scope = `same-app-band-${index}`;
    withRecords(scope, {}, () => {
      const first = buildDailyMission(scope, quarantined).book;
      const repeated = buildDailyMission(scope, quarantined).book;
      assert.deepEqual(first, repeated, "same-day selection must stay deterministic");
      assert.equal(first.detail, "App level D");
      picks.add(first.bookId);
    });
  }
  assert.deepEqual(picks, new Set([SUN, WHEEL]));
});

test("completion history advances the unread App pool and recycles the lowest band only after all books are read", () => {
  const scope = "mission-history";
  const quarantined = quarantineExcept([SHY, HUNGRY]);
  withRecords(scope, { [SHY]: { completed: true } }, () => {
    const { book } = buildDailyMission(scope, quarantined);
    assert.equal(book.bookId, HUNGRY);
    assert.equal(book.detail, "App level B");
  });
  withRecords(scope, { [SHY]: { completed: true }, [HUNGRY]: { completed: true } }, () => {
    const { book } = buildDailyMission(scope, quarantined);
    assert.equal(book.bookId, SHY);
    assert.equal(book.detail, "App level A");
  });
});

test("an unknown book's saved or claimed letters cannot enter the reviewed App pool", () => {
  const pending = {
    id: "mission-unreviewed-fixture",
    title: "Unreviewed fixture",
    level: "A",
    appReadingLevel: "A",
    levelSystem: "literacy-guide-a-h-v1",
    textFingerprint: "unverified-claim",
    readingBandProfile: "standard",
    readingMode: "predictable-levelled"
  };
  GUIDED_READING_BOOK_INDEX.push(pending);
  try {
    withRecords("pending-reader", { [pending.id]: { level: "A" } }, () => {
      const withCurrent = buildDailyMission("pending-reader", quarantineExcept([pending.id, SUN])).book;
      assert.equal(withCurrent.bookId, SUN);
      assert.equal(withCurrent.detail, "App level D");
      const onlyPending = buildDailyMission("pending-reader", quarantineExcept([pending.id])).book;
      assert.equal(onlyPending.bookId, "");
      assert.equal(onlyPending.detail, "");
      assert.doesNotMatch(onlyPending.why, /(?:App level|Level) [A-H]/);
    });
  } finally {
    GUIDED_READING_BOOK_INDEX.pop();
  }
});

test("App metadata preserves the mission's read-aloud segregation and quarantine boundary", () => {
  withRecords("mission-boundaries", {}, () => {
    assert.equal(buildDailyMission("mission-boundaries", quarantineExcept([READ_ALOUD])).book.bookId, "");
    assert.equal(buildDailyMission("mission-boundaries", quarantineExcept([SUN, READ_ALOUD])).book.bookId, SUN);
    assert.equal(buildDailyMission("mission-boundaries", null).book.bookId, "");
    assert.equal(buildDailyMission("mission-boundaries", undefined).book.bookId, "");
  });
});

test("a locally retired page removes its stale public review from mission selection", () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: key => key === "lpDeletedMediaManifest"
    ? JSON.stringify([{ assetType: "guided-reading-page", bookId: SUN, pageNumber: 1 }]) : null };
  try {
    withRecords("retired-page", {}, () => {
      assert.equal(buildDailyMission("retired-page", quarantineExcept([SUN])).book.bookId, "");
      assert.equal(buildDailyMission("retired-page", quarantineExcept([SUN, LUNCHBOX])).book.bookId, LUNCHBOX);
    });
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
