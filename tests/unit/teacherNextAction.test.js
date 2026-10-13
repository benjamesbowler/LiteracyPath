import test from "node:test";
import assert from "node:assert/strict";
import { selectTeacherNextAction } from "../../src/utils/teacherNextAction.js";

test("next action respects recovery, uncertainty and existing evidence conclusions", () => {
  const support = { ready: true, status: { id: "needs_support" } };
  assert.equal(selectTeacherNextAction({ conclusion: support, focus: "beginning sounds" }).kind, "teach");
  assert.equal(selectTeacherNextAction({ conclusion: { ...support, ready: false }, focus: "beginning sounds" }).kind, "assess");
  assert.equal(selectTeacherNextAction({ conclusion: support }).kind, "review");
  assert.equal(selectTeacherNextAction({ conclusion: support, mixed: true, focus: "sounds" }).kind, "review");
  assert.equal(selectTeacherNextAction({ readStatus: "failed", conclusion: support }).kind, "retry");
  assert.equal(selectTeacherNextAction({ readStatus: "loading", activeSession: { status: "paused" } }).kind, "resume");
  assert.equal(selectTeacherNextAction({ activeSession: { status: "completed" } }).kind, "assess");
  assert.equal(selectTeacherNextAction({ conclusion: { ready: true, status: { id: "secure" } } }).kind, "continue");
});
