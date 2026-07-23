import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInterventionTodayQueue,
  interventionStatusLabel,
  localDateKey
} from "../../src/utils/teacherInterventions.js";

test("intervention Today queue resurfaces overdue plans and ineffective reviews", () => {
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
    ["overdue", "overdue"]
  ]);
  assert.equal(queue[0].queueLabel, "Ineffective — follow-up needed");
});

test("intervention status labels expose the next required lifecycle action", () => {
  assert.equal(interventionStatusLabel({ status: "planned" }), "Planned · delivery needed");
  assert.equal(interventionStatusLabel({ status: "delivered" }), "Delivered · outcome needed");
  assert.equal(interventionStatusLabel({ status: "recorded" }), "Outcome recorded · review needed");
  assert.equal(
    interventionStatusLabel({ status: "reviewed", follow_up_required: true }),
    "Reviewed · follow-up needed"
  );
});

test("local date keys do not shift a teacher date through UTC", () => {
  assert.equal(localDateKey(new Date(2026, 6, 23, 0, 5)), "2026-07-23");
  assert.equal(localDateKey("not-a-date"), "");
});
