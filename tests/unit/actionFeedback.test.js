import assert from "node:assert/strict";
import test from "node:test";
import {
  inferActionFeedbackKind,
  normalizeActionFeedback
} from "../../src/utils/actionFeedback.js";

test("system feedback inference distinguishes pending, success, error, and neutral messages", () => {
  assert.equal(inferActionFeedbackKind("Loading saved reports..."), "pending");
  assert.equal(inferActionFeedbackKind("Class code copied."), "success");
  assert.equal(inferActionFeedbackKind("The export could not be created."), "error");
  assert.equal(inferActionFeedbackKind("Review this learner."), "info");
});

test("explicit action feedback kinds win and undo retains its action", () => {
  const onAction = () => {};
  const feedback = normalizeActionFeedback({
    kind: "undo",
    message: "Ava archived.",
    actionLabel: "Undo archive for Ava",
    onAction
  });
  assert.equal(feedback.kind, "undo");
  assert.equal(feedback.actionLabel, "Undo archive for Ava");
  assert.equal(feedback.onAction, onAction);
});

test("empty action feedback stays unmounted", () => {
  assert.equal(normalizeActionFeedback(null), null);
  assert.equal(normalizeActionFeedback(""), null);
});
