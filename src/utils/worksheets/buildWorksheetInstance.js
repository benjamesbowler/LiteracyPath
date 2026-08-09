import { buildWorksheetDocument } from "./worksheetBuilder.js";
import { worksheetEvidenceDescriptor } from "../../content/worksheets/worksheetEvidenceDescriptors.js";

function attribute(source, name) {
  return source.match(new RegExp(`${name}="([^"]*)"`))?.[1] || "";
}

export function worksheetObservableTargets(recipe) {
  const { html, title } = buildWorksheetDocument(recipe);
  const tasks = [...html.matchAll(/<div class="ws-block[^>]*data-task-kind="[^"]+"[^>]*>/g)].map(match => {
    const tag = match[0];
    const taskKind = attribute(tag, "data-task-kind");
    const descriptor = worksheetEvidenceDescriptor(taskKind);
    return Object.freeze({
      taskId: attribute(tag, "data-task-id"),
      taskKind,
      answerReference: attribute(tag, "data-answer") || null,
      descriptor
    });
  });
  return Object.freeze({ title, tasks: Object.freeze(tasks), trackedTasks: Object.freeze(tasks.filter(task => task.descriptor.tracked)) });
}

export function buildWorksheetInstanceRecipe(recipe) {
  const observed = worksheetObservableTargets(recipe);
  if (!observed.trackedTasks.length) throw new Error("This worksheet has no reviewed observation targets.");
  return Object.freeze({
    schemaVersion: 1,
    contentVersion: "worksheet-evidence-v1",
    recipe: Object.freeze({ cycleId: recipe.cycleId, type: recipe.type, pages: recipe.pages }),
    title: observed.title,
    targets: Object.freeze(observed.trackedTasks.map(task => Object.freeze({
      targetKey: task.taskId,
      taskKind: task.taskKind,
      purpose: task.descriptor.purpose,
      observation: task.descriptor.observation
    })))
  });
}
