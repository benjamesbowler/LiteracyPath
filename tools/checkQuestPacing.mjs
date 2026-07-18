import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUEST_STOPS } from "../src/data/questSequence.js";
import { buildTrailSection } from "../src/utils/questHub.js";
import {
  QUEST_PHYSICAL_ACTION_BUDGET,
  budgetPhysicalSection
} from "../src/utils/questPhysicalPlan.js";
import {
  buildPhysicalTask,
  physicalResponsesInSection
} from "../src/utils/questPhysicalMechanics.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "docs", "previews", "quest-release", "journey-pacing-report.json");

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function longestRun(values, predicate) {
  let longest = 0;
  let current = 0;
  for (const value of values) {
    current = predicate(value) ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

const stops = QUEST_STOPS.map(stop => {
  const fullSection = buildTrailSection(stop.id, { seed: stop.index });
  const section = budgetPhysicalSection(fullSection);
  const tasks = section.encounters.flatMap(encounter => (
    encounter.beats.map((beat, beatIndex) => {
      const task = buildPhysicalTask(section, encounter, beat, beatIndex);
      return {
        encounter: encounter.kind,
        mechanic: task?.mechanic || null,
        pattern: task?.verbPattern || null,
        chapterAuthored: Boolean(task?.chapterAuthored),
        stages: task?.stages.length || 0,
        actions: task?.stages.map(stage => stage.playerAction) || []
      };
    })
  ));
  return {
    id: stop.id,
    name: stop.name,
    chapterId: section.chapter?.id || null,
    chapterTitle: section.chapter?.title || null,
    chapterStop: section.chapterStop,
    actions: physicalResponsesInSection(section),
    encounters: section.encounters.length,
    beats: tasks.length,
    deferredBeats: section.physicalPlan.deferredBeats,
    patterns: [...new Set(tasks.map(task => task.pattern).filter(Boolean))],
    tasks
  };
});

const actionCounts = stops.map(stop => stop.actions);
const chapters = Object.values(Object.groupBy(stops, stop => stop.chapterId)).map(chapterStops => {
  const chapterCounts = chapterStops.map(stop => stop.actions);
  return {
    id: chapterStops[0].chapterId,
    title: chapterStops[0].chapterTitle,
    actions: chapterCounts,
    averageActions: Number((chapterCounts.reduce((sum, value) => sum + value, 0) / chapterCounts.length).toFixed(2)),
    minimumActions: Math.min(...chapterCounts),
    maximumActions: Math.max(...chapterCounts)
  };
});

const summary = {
  stopCount: stops.length,
  actionBudget: QUEST_PHYSICAL_ACTION_BUDGET,
  totalActions: actionCounts.reduce((sum, value) => sum + value, 0),
  averageActions: Number((actionCounts.reduce((sum, value) => sum + value, 0) / actionCounts.length).toFixed(2)),
  minimumActions: Math.min(...actionCounts),
  maximumActions: Math.max(...actionCounts),
  maximumLoadStops: stops.filter(stop => stop.actions === QUEST_PHYSICAL_ACTION_BUDGET).map(stop => stop.id),
  longestMaximumLoadRun: longestRun(stops, stop => stop.actions === QUEST_PHYSICAL_ACTION_BUDGET),
  chapterSummaries: chapters
};

requireCondition(stops.length === 40, `expected 40 stops, found ${stops.length}`);
requireCondition(summary.maximumActions <= QUEST_PHYSICAL_ACTION_BUDGET, `a stop exceeds ${QUEST_PHYSICAL_ACTION_BUDGET} actions`);
requireCondition(summary.minimumActions >= 4, `a stop collapsed below four physical actions`);
requireCondition(summary.averageActions >= 5.5 && summary.averageActions <= 7.25, `journey average ${summary.averageActions} is outside the child-sized pacing band`);
requireCondition(summary.longestMaximumLoadRun <= 3, `${summary.longestMaximumLoadRun} maximum-load stops run back to back`);
requireCondition(chapters.every(chapter => chapter.averageActions >= 5.5 && chapter.averageActions <= 7.5), "a chapter falls outside the pacing band");

for (const stop of stops) {
  requireCondition(stop.actions === stop.tasks.reduce((sum, task) => sum + task.stages, 0), `${stop.id} reports the wrong action count`);
  for (const task of stop.tasks) {
    if (task.mechanic === "herd-and-sort") {
      requireCondition(task.stages <= 3, `${stop.id} contains a ${task.stages}-placement sound sort`);
    }
    if (task.chapterAuthored && ["pursuit", "sort"].includes(task.pattern)) {
      requireCondition(task.stages === 2, `${stop.id} ${task.mechanic} is not a two-part physical verb`);
    }
  }
}

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify({ summary, stops }, null, 2)}\n`, "utf8");

console.log(
  `Quest pacing check passed: ${summary.stopCount} stops, ${summary.minimumActions}-${summary.maximumActions} actions, `
  + `${summary.averageActions} average, maximum-load streak ${summary.longestMaximumLoadRun}.`
);
