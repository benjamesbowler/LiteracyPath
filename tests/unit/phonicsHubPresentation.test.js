import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adventure = readFileSync("src/components/StudentAdventureMapPage.jsx", "utf8");
const adventureCss = readFileSync("src/styles/kids-trail.css", "utf8");
const cycleHub = readFileSync("src/components/elQuest/ElSkillsQuest.jsx", "utf8");
const cyclePicker = cycleHub.slice(
  cycleHub.indexOf("// ── Station picker for the open cycle"),
  cycleHub.indexOf("// ── A live round")
);
const cycleCss = readFileSync("src/styles/skills-block-quest.css", "utf8");
const qualityCss = readFileSync("src/styles/ui-quality-pass.css", "utf8");
const questCss = readFileSync("src/styles/quest.css", "utf8");
const questRuntime = readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");

test("Adventure Map keeps one forward action while enlarging the world on wide screens", () => {
  assert.equal(
    (adventure.match(/setOpenCycleId\(stop\.id\)/g) || []).length,
    1,
    "the map marker and nearby-stop card must not both open the same cycle"
  );
  assert.match(adventure, /scene\.stops\.map\(stop => \([\s\S]*?<span[\s\S]*?role="img"/);
  assert.equal((adventure.match(/data-child-primary/g) || []).length, 1);
  assert.match(adventure, /className="kg-speaker kg-speaker--md kg-glass"/);
  assert.match(adventureCss, /@media \(min-width: 1440px\)[\s\S]*?\.kg-stage \.kg-map \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(276px, 324px\)/);
  assert.match(adventureCss, /\.kg-stage \.kg-map-card \{[\s\S]*?min-height: 68px/);
});

test("cycle picker uses owned world art, explicit states and one promoted station", () => {
  assert.match(cycleHub, /className="skills-block-quest sbq-cycle-hub"/);
  assert.match(cycleHub, /cycleWorld\.backdrop/);
  assert.match(cycleHub, /const stationArt = \[\.\.\.cycleWorld\.scenes, cycleWorld\.banner, cycleWorld\.backdrop\]/);
  assert.match(cycleHub, /stationArt\[index % stationArt\.length\]/);
  assert.match(cycleHub, /data-station-state=\{state\}/);
  assert.equal((cyclePicker.match(/data-child-primary/g) || []).length, 1);
  assert.doesNotMatch(cycleHub, />🔒</);
  assert.match(cycleCss, /\.skills-block-quest\.sbq-cycle-hub \.sbq-station \{[\s\S]*?min-height: 68px/);
  assert.match(cycleCss, /\.sbq-cycle-head \.sbq-ghost-button[\s\S]*?--kg-physical-hit: 56px;[\s\S]*?min-height: 56px/);
  assert.match(cycleCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(cycleCss, /grid-template-rows: repeat\(5, minmax\(68px, 1fr\)\)/);
  assert.match(cycleCss, /\.sbq-station:hover:not\(:disabled\)[\s\S]*?\.sbq-station-art img \{[\s\S]*?transform: scale\(1\.04\)/);
  assert.match(cycleCss, /\.sbq-station:active:not\(:disabled\) \{[\s\S]*?filter: brightness\(0\.97\)/);
  assert.match(cycleHub, /className="sbq-cycle-scroll-hint"/);
  assert.doesNotMatch(cyclePicker, /Choose your next station/);
  assert.match(cycleCss, /\.sbq-cycle-guide span \{[\s\S]*?background: rgba\(255, 250, 236, 0\.96\);[\s\S]*?color: #294B3F/);
});

test("short landscape keeps the map action visible and every cycle station reachable", () => {
  assert.match(
    cycleCss,
    /@media \(max-width: 700px\) and \(max-height: 430px\) and \(orientation: landscape\)[\s\S]*?grid-auto-flow: column;[\s\S]*?overflow-x: auto;[\s\S]*?scroll-snap-type: x proximity/
  );
  assert.match(
    qualityCss,
    /@media \(max-width: 700px\) and \(max-height: 430px\) and \(orientation: landscape\)[\s\S]*?\.kg-stage \.kg-map \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(196px, 38vw\)[\s\S]*?\.kg-map-card--next/
  );
  assert.match(qualityCss, /--kg-header-height: 60px;[\s\S]*?--kg-tab-height: 56px/);
});

test("Sound Seekers keeps controls reachable and moves the compact cue off the route", () => {
  assert.match(questCss, /\.qp-icon-button,[\s\S]*?width: 56px;[\s\S]*?height: 56px/);
  assert.match(questCss, /\.qp-cue\.is-compact \{[\s\S]*?left: max\(16px, env\(safe-area-inset-left\)\)/);
  assert.match(questCss, /\.qp-semantic-choices button \{[\s\S]*?min-height: 56px/);
  assert.match(questRuntime, /const residentSafePoint = anchored\s*\? \{ x: rawX, y: rawY \}\s*: questPixelAvoidActorOverlap/);
});
