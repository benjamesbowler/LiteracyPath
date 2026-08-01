import test from "node:test";
import assert from "node:assert/strict";
import {
  worksheetCycleOptions,
  worksheetCycleLabel,
  availableWorksheetTypes,
  getWorksheetCycle,
  buildWorksheetDocument,
  embedWorksheetImages,
  WORKSHEET_PAGE_STAGES
} from "../../src/utils/worksheets/worksheetBuilder.js";

const cycle10 = getWorksheetCycle("cycle-10");
const cycle26 = getWorksheetCycle("cycle-26");

test("cycle options are the numbered cycles", () => {
  const opts = worksheetCycleOptions();
  assert.ok(opts.length >= 27);
  assert.ok(opts.every(o => o.id && o.cycleNumber && o.title));
});

test("cycle labels name what the cycle covers and never repeat the prefix", () => {
  // The curriculum data leaves most titles as a bare "Cycle N"; the label must
  // still say what that cycle teaches, so a teacher can pick at a glance.
  assert.equal(
    worksheetCycleLabel({ cycleNumber: 1, title: "Cycle 1: Meet A and M" }),
    "Cycle 1 · Meet A and M"
  );
  assert.equal(worksheetCycleLabel({ cycleNumber: 8, title: "B and W" }), "Cycle 8 · B and W");

  const labels = worksheetCycleOptions().map(option => worksheetCycleLabel(option));
  assert.equal(labels.length, 27);
  for (const label of labels) {
    assert.doesNotMatch(label, /^Cycle \d+$/, `"${label}" must name its content`);
    assert.doesNotMatch(label, /^Cycle \d+\s*[—·-]\s*Cycle \d+/i, `"${label}" repeats the prefix`);
  }
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

  const cycle1 = getWorksheetCycle("cycle-1");
  assert.ok(!availableWorksheetTypes(cycle1).includes("wordBuilding"),
    "cycle 1 cannot build complete words before enough letters are taught");
  const cycle2 = getWorksheetCycle("cycle-2");
  assert.ok(!availableWorksheetTypes(cycle2).includes("wordBuilding"),
    "cycle 2 has only one unambiguous pictured decodable word");
});

test("buildWorksheetDocument is deterministic (same recipe = same bytes)", () => {
  const recipe = { cycleId: "cycle-10", type: "wordBuilding", pages: 3 };
  const a = buildWorksheetDocument(recipe);
  const b = buildWorksheetDocument(recipe);
  assert.equal(a.html, b.html);
  assert.equal(a.title, b.title);
});

test("worksheet stage headings and explanations use simple child language", () => {
  const text = WORKSHEET_PAGE_STAGES.map(stage => `${stage.label} ${stage.purpose}`).join(" ");
  assert.match(text, /Watch and try/);
  assert.match(text, /Pick the right one/);
  assert.doesNotMatch(text, /Meet it|visible cue|plausible alternatives|construct|context|retrieve|independently/i);

  const { html } = buildWorksheetDocument({ cycleId: "cycle-10", type: "wordBuilding", pages: 6 });
  assert.doesNotMatch(html, /Meet it|visible cue|plausible alternatives|construct or complete|different task or context|retrieve the learning/i);
  assert.doesNotMatch(html, /opening letter|focus letter|named spelling pattern|under its spelling pattern/i);
  assert.doesNotMatch(html, /Cycle 10\s*·\s*Cycle 10/i, "the child should not see a repeated cycle name");
});

test("print preparation embeds real worksheet pictures as data URLs", async () => {
  const { html } = buildWorksheetDocument({ cycleId: "cycle-10", type: "wordBuilding", pages: 1 });
  const requested = [];
  const prepared = await embedWorksheetImages(html, {
    fetchImpl: async source => {
      requested.push(source);
      return {
        ok: true,
        blob: async () => new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" })
      };
    }
  });

  assert.ok(requested.length > 0, "the representative worksheet should request pictures");
  assert.equal(new Set(requested).size, requested.length, "each shared picture is fetched once");
  assert.doesNotMatch(prepared, /<img\b[^>]*\bsrc="\//i);
  assert.match(prepared, /<img\b[^>]*\bsrc="data:image\/png;base64,iVBORw=="/i);
});

test("print preparation refuses to print a pack with a missing picture", async () => {
  const { html } = buildWorksheetDocument({ cycleId: "cycle-10", type: "wordBuilding", pages: 1 });
  await assert.rejects(
    embedWorksheetImages(html, { fetchImpl: async () => ({ ok: false }) }),
    /Worksheet picture could not be loaded/
  );
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
  assert.equal((big.html.match(/class="page"/g) || []).length, 6);
  const zero = buildWorksheetDocument({ cycleId: "cycle-10", type: "sightWords", pages: 0 });
  assert.equal((zero.html.match(/class="page"/g) || []).length, 1);
});

// ── Content-quality guarantees, checked for EVERY cycle ──────────────────────
const allCycles = worksheetCycleOptions().map(o => getWorksheetCycle(o.id));

function taughtLettersThrough(cycleNumber) {
  const taught = new Set();
  for (const cycle of allCycles) {
    if (cycle.cycleNumber > cycleNumber) break;
    for (const item of cycle.focusLetters || []) {
      const spelling = String(item.spelling || "").toLowerCase();
      if (/^[a-z]{1,2}$/.test(spelling)) taught.add(spelling);
    }
  }
  return taught;
}

function pageBody(html) {
  // Everything between <body> and </body>, header/footer stripped of the
  // cycle number so only real CONTENT is compared across cycles.
  return html.slice(html.indexOf("<body>"), html.indexOf("</body>"))
    .replace(/Cycle \d+[^<]*/g, "")
    .replace(/<div class="ws-head">[\s\S]*?<\/div>\s*<\/div>/g, "");
}

function worksheetPages(html) {
  return [...html.matchAll(/<section class="page"[\s\S]*?<\/section>/g)].map(match => match[0]);
}

function semanticPageBody(page) {
  return page
    .replace(/^[\s\S]*?<div class="ws-stage">[\s\S]*?<\/div>/, "")
    .replace(/<div class="ws-footer">[\s\S]*?<\/div>[\s\S]*$/, "")
    .replace(/\sdata-(?:worksheet-page|worksheet-stage|task-id)="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
      if (page === 0) continue;
      assert.ok(hunts.length >= 1, `cycle ${cycle.cycleNumber} has a letter hunt by page ${page + 1}`);
      for (const [, target, cells] of hunts) {
        const letters = [...cells.matchAll(/<span>(\w+)<\/span>/g)].map(m => m[1]);
        const count = letters.filter(l => l === target).length;
        assert.equal(count, 6, `cycle ${cycle.cycleNumber}: hunt for "${target}" contains ${count}, not 6`);
        const taught = taughtLettersThrough(cycle.cycleNumber);
        assert.ok(letters.every(letter => taught.has(letter.toLowerCase())),
          `cycle ${cycle.cycleNumber}: hunt contains a letter that has not been taught`);
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

test("known sight-word contrast pairs have answer-determining cloze context", () => {
  const cycle2 = buildWorksheetDocument({ cycleId: "cycle-2", type: "sightWords", pages: 3 }).html;
  assert.ok(cycle2.includes("The word for one is"), "a/the contrast identifies a as the word for one");
  assert.ok(cycle2.includes("for a dog we both know"), "a/the contrast gives the a shared known-dog cue");

  const cycle13 = buildWorksheetDocument({ cycleId: "cycle-13", type: "sightWords", pages: 3 }).html;
  assert.ok(cycle13.includes("belongs to Mum"), "her is anchored to Mum");
  assert.ok(cycle13.includes("belongs to Dad"), "his is anchored to Dad");
});

test("every missing-letter prompt has a picture cue", () => {
  for (const cycle of allCycles) {
    if (!availableWorksheetTypes(cycle).includes("wordBuilding")) continue;
    const { html } = buildWorksheetDocument({ cycleId: cycle.id, type: "wordBuilding", pages: 3 });
    const prompts = [...html.matchAll(/<div class="ws-fill"[^>]*>([\s\S]*?)<\/div>/g)].map(match => match[1]);
    assert.ok(prompts.length > 0, `cycle ${cycle.cycleNumber}: no missing-letter prompts`);
    for (const prompt of prompts) {
      assert.match(prompt, /<img class="ws-cue"[^>]+alt="[^"]+"/,
        `cycle ${cycle.cycleNumber}: missing-letter prompt has no image`);
    }
  }
});

test("the first eligible beginner worksheet models _nt with an ant picture", () => {
  const eligible = allCycles.find(cycle => {
    if (!availableWorksheetTypes(cycle).includes("wordBuilding")) return false;
    const { html } = buildWorksheetDocument({ cycleId: cycle.id, type: "wordBuilding", pages: 1 });
    return html.includes('alt="ant"');
  });
  assert.ok(eligible, "an eligible cycle should contain the ant image");
  const { html } = buildWorksheetDocument({ cycleId: eligible.id, type: "wordBuilding", pages: 1 });
  assert.match(html, /alt="ant"[^>]*\/><span class="ws-blank"><\/span>nt/,
    "ant should appear as a pictured _nt prompt");
});

test("worksheet picture cues exclude known ambiguous or answer-leaking assets", () => {
  const forbidden = ["bank", "pink", "sat", "six", "thin", "think", "who"];
  for (const cycle of allCycles) {
    for (const type of availableWorksheetTypes(cycle)) {
      const { html } = buildWorksheetDocument({ cycleId: cycle.id, type, pages: 6 });
      for (const word of forbidden) {
        assert.ok(!html.includes(`alt="${word}"`),
          `cycle ${cycle.cycleNumber} ${type}: unsuitable ${word} cue was emitted`);
      }
    }
  }
});

test("fluency worksheets drill that cycle's own pattern", () => {
  const c25 = buildWorksheetDocument({ cycleId: "cycle-25", type: "patternFluency", pages: 6 }).html;
  const c26 = buildWorksheetDocument({ cycleId: "cycle-26", type: "patternFluency", pages: 6 }).html;
  const c27 = buildWorksheetDocument({ cycleId: "cycle-27", type: "patternFluency", pages: 6 }).html;
  assert.ok(c25.includes("end with -ay"), "cycle 25 sorts -ay words (day/say)");
  assert.ok(c26.includes("end with y"), "cycle 26 sorts -y words (by/my/why/try)");
  assert.ok(c27.includes("end with -ck"), "cycle 27 reviews -ck words");
  for (const [n, html] of [[25, c25], [26, c26], [27, c27]]) {
    assert.ok(html.includes("Circle these words"), `cycle ${n} has the poem find-words task`);
  }
});

test("every six-page pack has all six stages and six unique instructional pages", () => {
  const expectedStages = WORKSHEET_PAGE_STAGES.map(stage => stage.id);
  for (const cycle of allCycles) {
    for (const type of availableWorksheetTypes(cycle)) {
      const { html } = buildWorksheetDocument({ cycleId: cycle.id, type, pages: 6 });
      const pages = worksheetPages(html);
      assert.equal(pages.length, 6, `cycle ${cycle.cycleNumber} ${type}: page count`);
      const stages = pages.map(page => page.match(/data-worksheet-stage="([^"]+)"/)?.[1]);
      assert.deepEqual(stages, expectedStages, `cycle ${cycle.cycleNumber} ${type}: stage order`);
      assert.equal(new Set(pages.map(semanticPageBody)).size, 6,
        `cycle ${cycle.cycleNumber} ${type}: repeated instructional page`);
      for (const [index, page] of pages.entries()) {
        const taskKinds = [...page.matchAll(/data-task-kind="([^"]+)"/g)].map(match => match[1]);
        assert.ok(taskKinds.length >= 2,
          `cycle ${cycle.cycleNumber} ${type} page ${index + 1}: fewer than two task blocks`);
      }
    }
  }
});

test("print documents are self-contained and expose stable task metadata", () => {
  for (const cycle of allCycles) {
    for (const type of availableWorksheetTypes(cycle)) {
      const { html } = buildWorksheetDocument({ cycleId: cycle.id, type, pages: 6 });
      assert.match(html, /^<!doctype html><html lang="en">/);
      assert.doesNotMatch(html, /https?:\/\//i, `${cycle.cycleNumber} ${type}: external print dependency`);
      assert.match(html, /break-inside: avoid/);
      const taskIds = [...html.matchAll(/data-task-id="([^"]+)"/g)].map(match => match[1]);
      assert.ok(taskIds.length > 0);
      assert.equal(new Set(taskIds).size, taskIds.length,
        `cycle ${cycle.cycleNumber} ${type}: duplicate task ids`);
    }
  }
});
