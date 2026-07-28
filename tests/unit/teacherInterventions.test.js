import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInterventionTodayQueue,
  interventionStatusLabel,
  localDateKey
} from "../../src/utils/teacherInterventions.js";

test("intervention Today queue resurfaces every unfinished teacher action", () => {
  const queue = buildInterventionTodayQueue([
    {
      id: "effective",
      status: "reviewed",
      outcome: "effective",
      follow_up_required: false,
      next_review_on: "2026-07-20"
    },
    {
      id: "overdue",
      status: "planned",
      planned_for: "2026-07-22",
      follow_up_required: false
    },
    {
      id: "due-today",
      status: "planned",
      planned_for: "2026-07-23",
      follow_up_required: false
    },
    {
      id: "taught",
      status: "delivered",
      delivered_at: "2026-07-23T09:00:00Z",
      planned_for: "2026-07-23"
    },
    {
      id: "observed",
      status: "recorded",
      outcome: "partial",
      recorded_at: "2026-07-23T10:00:00Z",
      planned_for: "2026-07-23"
    },
    {
      id: "cancelled",
      status: "cancelled",
      planned_for: "2026-07-20"
    },
    {
      id: "ineffective",
      status: "reviewed",
      outcome: "ineffective",
      planned_for: "2026-07-23",
      next_review_on: "2026-07-30",
      follow_up_required: true
    }
  ], "2026-07-23");

  assert.deepEqual(queue.map(row => [row.id, row.queueReason]), [
    ["ineffective", "follow-up"],
    ["taught", "record-outcome"],
    ["observed", "review"],
    ["overdue", "overdue"],
    ["due-today", "due-today"]
  ]);
  assert.equal(queue[0].queueLabel, "Support did not help yet — plan a follow-up");
  assert.equal(queue[1].queueLabel, "Support was taught — add what happened");
  assert.equal(queue[2].queueLabel, "Observation saved — review the support");
  assert.equal(queue[4].queueLabel, "Teaching action is due today");
});

test("intervention status labels expose the next required lifecycle action", () => {
  assert.equal(interventionStatusLabel({ status: "planned" }), "Planned · teach next");
  assert.equal(interventionStatusLabel({ status: "cancelled" }), "Cancelled");
  assert.equal(interventionStatusLabel({ status: "delivered" }), "Taught · add what happened");
  assert.equal(interventionStatusLabel({ status: "recorded" }), "Observation saved · review next");
  assert.equal(
    interventionStatusLabel({ status: "reviewed", follow_up_required: true }),
    "Reviewed · follow-up needed"
  );
  assert.equal(
    interventionStatusLabel({ status: "reviewed", outcome: "ineffective", follow_up_required: false }),
    "Reviewed · did not help yet"
  );
  assert.equal(
    interventionStatusLabel({ status: "reviewed", outcome: "partial", follow_up_required: false }),
    "Reviewed · helped a little"
  );
  assert.equal(
    interventionStatusLabel({ status: "reviewed", outcome: "effective", follow_up_required: false }),
    "Reviewed · worked as planned"
  );
});

test("local date keys do not shift a teacher date through UTC", () => {
  assert.equal(localDateKey(new Date(2026, 6, 23, 0, 5)), "2026-07-23");
  assert.equal(localDateKey("not-a-date"), "");
});
