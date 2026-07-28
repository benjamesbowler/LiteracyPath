import test from "node:test";
import assert from "node:assert/strict";
import {
  worksheetCycleOptions,
  worksheetCycleLabel,
  availableWorksheetTypes,
  getWorksheetCycle,
  buildWorksheetDocument
} from "../../src/utils/worksheets/worksheetBuilder.js";

const cycle10 = getWorksheetCycle("cycle-10");
const cycle26 = getWorksheetCycle("cycle-26");

test("cycle options are the numbered cycles", () => {
  const opts = worksheetCycleOptions();
  assert.ok(opts.length >= 27);
  assert.ok(opts.every(o => o.id && o.cycleNumber && o.title));
});

test("cycle labels never repeat the generated cycle prefix", () => {
  assert.equal(
    worksheetCycleLabel({ cycleNumber: 1, title: "Cycle 1: Meet A and M" }),
    "Cycle 1: Meet A and M"
  );
  assert.equal(worksheetCycleLabel({ cycleNumber: 2, title: "Cycle 2" }), "Cycle 2");
  assert.equal(worksheetCycleLabel({ cycleNumber: 8, title: "B and W" }), "Cycle 8: B and W");
  assert.ok(worksheetCycleOptions().every(option => (
    !/^Cycle \d+\s*[—-]\s*Cycle \d+/i.test(worksheetCycleLabel(option))
  )));
});

test("available types match the cycle's content", () => {
  const t10 = availableWorksheetTypes(cycle10);
  assert.ok(t10.includes("letterFormation"));
  assert.ok(t10.includes("wordBuilding"));
  assert.ok(t10.includes("sightWords"));
  assert.ok(!t10.includes("patternFluency"));

  const t26 = availableWorksheetTypes(cycle26);
  assert.ok(t26.includes("patternFluency"));
  assert.ok(t26.includes("sightWords"));
  assert.ok(!t26.includes("letterFormation"), "fluency cycles have no letter formation");
});

test("buildWorksheetDocument is deterministic (same recipe = same bytes)", () => {
  const recipe = { cycleId: "cycle-10", type: "wordBuilding", pages: 3 };
  const a = buildWorksheetDocument(recipe);
  const b = buildWorksheetDocument(recipe);
  assert.equal(a.html, b.html);
  assert.equal(a.title, b.title);
});

test("each available type builds a valid multi-page document", () => {
  for (const cycle of [cycle10, cycle26]) {
    for (const type of availableWorksheetTypes(cycle)) {
      const { html, title } = buildWorksheetDocument({ cycleId: cycle.id, type, pages: 2 });
      assert.ok(html.startsWith("<!doctype html>"), `${type} should be a full doc`);
      assert.equal((html.match(/class="page"/g) || []).length, 2, `${type} should have 2 pages`);
      assert.ok(html.includes(`Cycle ${cycle.cycleNumber}`), `${type} should name the cycle`);
      assert.ok(title.includes(`Cycle ${cycle.cycleNumber}`));
    }
  }
});

test("requesting a type a cycle does not support throws", () => {
  assert.throws(() => buildWorksheetDocument({ cycleId: "cycle-26", type: "letterFormation", pages: 1 }));
});

test("page count is clamped to a sensible range", () => {
  const big = buildWorksheetDocument({ cycleId: "cycle-10", type: "sightWords", pages: 99 });
  assert.ok((big.html.match(/class="page"/g) || []).length <= 8);
  const zero = buildWorksheetDocument({ cycleId: "cycle-10", type: "sightWords", pages: 0 });
  assert.equal((zero.html.match(/class="page"/g) || []).length, 1);
});

// ── Content-quality guarantees, checked for EVERY cycle ──────────────────────
const allCycles = worksheetCycleOptions().map(o => getWorksheetCycle(o.id));

function pageBody(html) {
  // Everything between <body> and </body>, header/footer stripped of the
  // cycle number so only real CONTENT is compared across cycles.
  return html.slice(html.indexOf("<body>"), html.indexOf("</body>"))
    .replace(/Cycle \d+[^<]*/g, "")
    .replace(/<div class="ws-head">[\s\S]*?<\/div>\s*<\/div>/g, "");
}

test("no two cycles print the same worksheet content", () => {
  for (const type of ["letterFormation", "wordBuilding", "sightWords", "patternFluency"]) {
    const seen = new Map();
    for (const cycle of allCycles) {
      if (!availableWorksheetTypes(cycle).includes(type)) continue;
      const body = pageBody(buildWorksheetDocument({ cycleId: cycle.id, type, pages: 2 }).html);
      const clash = seen.get(body);
      assert.ok(!clash, `${type}: cycle ${cycle.cycleNumber} prints the same content as cycle ${clash}`);
      seen.set(body, cycle.cycleNumber);
    }
    assert.ok(seen.size > 0, `${type} built for at least one cycle`);
  }
});

test("the letter hunt always contains exactly six of the target letter", () => {
  for (const cycle of allCycles) {
    if (!availableWorksheetTypes(cycle).includes("letterFormation")) continue;
    for (let page = 0; page < 3; page += 1) {
      const { html } = buildWorksheetDocument({ cycleId: cycle.id, type: "letterFormation", pages: page + 1 });
      const hunts = [...html.matchAll(/Circle every <b>(\w+)<\/b>[^<]*<\/div>\s*<div class="ws-find">([\s\S]*?)<\/div>/g)];
      assert.ok(hunts.length >= 1, `cycle ${cycle.cycleNumber} has a letter hunt`);
      for (const [, target, cells] of hunts) {
        const letters = [...cells.matchAll(/<span>(\w+)<\/span>/g)].map(m => m[1]);
        const count = letters.filter(l => l === target).length;
        assert.equal(count, 6, `cycle ${cycle.cycleNumber}: hunt for "${target}" contains ${count}, not 6`);
      }
    }
  }
});

test("every sight-word page uses that cycle's own words in real sentences", () => {
  for (const cycle of allCycles) {
    if (!availableWorksheetTypes(cycle).includes("sightWords")) continue;
    const { html } = buildWorksheetDocument({ cycleId: cycle.id, type: "sightWords", pages: 1 });
    const own = (cycle.highFrequencyWords || []).map(w => String(w).toLowerCase());
    assert.ok(own.some(w => html.includes(`<span class="ws-trace">${w}</span>`)),
      `cycle ${cycle.cycleNumber}: no own word traced`);
    assert.ok(html.includes("Finish each sentence"), `cycle ${cycle.cycleNumber}: no cloze sentences`);
  }
});

test("fluency worksheets drill that cycle's own pattern", () => {
  const c25 = buildWorksheetDocument({ cycleId: "cycle-25", type: "patternFluency", pages: 1 }).html;
  const c26 = buildWorksheetDocument({ cycleId: "cycle-26", type: "patternFluency", pages: 1 }).html;
  const c27 = buildWorksheetDocument({ cycleId: "cycle-27", type: "patternFluency", pages: 1 }).html;
  assert.ok(c25.includes("end with -ay"), "cycle 25 sorts -ay words (day/say)");
  assert.ok(c26.includes("end with y"), "cycle 26 sorts -y words (by/my/why/try)");
  assert.ok(c27.includes("end with -ck"), "cycle 27 reviews -ck words");
  for (const [n, html] of [[25, c25], [26, c26], [27, c27]]) {
    assert.ok(html.includes("Circle these words"), `cycle ${n} has the poem find-words task`);
  }
});
