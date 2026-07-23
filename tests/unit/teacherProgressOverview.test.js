import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  PROGRESS_MIN_RESPONSES,
  buildTeacherProgressOverview
} from "../../src/utils/teacherProgressOverview.js";

const rows = [
  {
    id: "aarav",
    name: "Aarav",
    answered: 20,
    accuracy: 90,
    masteredCount: 3,
    currentSkill: "CVC Short Vowels",
    soundSeekers: {
      lastActiveAt: "2026-07-23T09:00:00.000Z",
      heat: [
        {
          id: "m",
          label: "m",
          stopName: "Moss Gate",
          bucket: "got-it",
          seen: 10,
          independentSeen: 10,
          accuracy: 90
        },
        {
          id: "sh",
          label: "sh",
          stopName: "Shell Crossing",
          bucket: "got-it",
          seen: 8,
          independentSeen: 8,
          accuracy: 88
        }
      ]
    }
  },
  {
    id: "aisha",
    name: "Aisha",
    answered: 20,
    accuracy: 30,
    masteredCount: 0,
    currentSkill: "Initial Sounds",
    soundSeekers: {
      lastActiveAt: "2026-07-23T09:00:00.000Z",
      heat: [
        {
          id: "m",
          label: "m",
          stopName: "Moss Gate",
          bucket: "reteach",
          seen: 12,
          independentSeen: 12,
          accuracy: 33
        },
        {
          id: "sh",
          label: "sh",
          stopName: "Shell Crossing",
          bucket: "unseen",
          seen: 0,
          independentSeen: 0,
          accuracy: null
        }
      ]
    }
  },
  {
    id: "camila",
    name: "Camila",
    answered: 12,
    accuracy: 75,
    masteredCount: 2,
    currentSkill: "CVC Short Vowels",
    soundSeekers: {
      heat: [
        {
          id: "m",
          label: "m",
          stopName: "Moss Gate",
          bucket: "reteach",
          seen: 8,
          independentSeen: 8,
          accuracy: 63
        },
        {
          id: "sh",
          label: "sh",
          stopName: "Shell Crossing",
          bucket: "unseen",
          seen: 0,
          independentSeen: 0,
          accuracy: null
        }
      ]
    }
  },
  {
    id: "bao",
    name: "Bao",
    answered: 0,
    accuracy: 0,
    masteredCount: 0,
    currentSkill: "Not started",
    soundSeekers: null
  }
];

let TeacherProgressOverview;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const module = await vite.ssrLoadModule(
    "/src/components/teacher/TeacherProgressOverview.jsx"
  );
  TeacherProgressOverview = module.TeacherProgressOverview;
});

test.after(async () => {
  await vite?.close();
});

test("class distribution keeps sparse evidence outside accuracy bands", () => {
  const summary = buildTeacherProgressOverview(rows);
  const counts = Object.fromEntries(summary.distribution.map(band => [band.id, band.count]));

  assert.equal(PROGRESS_MIN_RESPONSES, 8);
  assert.deepEqual(counts, {
    secure: 1,
    developing: 1,
    "needs-support": 1,
    insufficient: 1
  });
  assert.equal(summary.classMedian, 75);
});

test("coverage distinguishes evidence presence, policy readiness, and exact item reach", () => {
  const { coverage } = buildTeacherProgressOverview(rows);

  assert.deepEqual(coverage, {
    totalLearners: 4,
    learnersWithAnyEvidence: 3,
    learnersPolicyReady: 3,
    learnerPercent: 75,
    policyReadyPercent: 75,
    responseCount: 52,
    itemTargetsSeen: 2,
    itemTargetCount: 2,
    itemPercent: 100
  });
});

test("groups expose transparent shared-focus and shared-item membership", () => {
  const { groups } = buildTeacherProgressOverview(rows);
  const soundGroup = groups.find(group => group.id === "sound:m");
  const focusGroup = groups.find(group => group.id === "focus:cvc short vowels");

  assert.deepEqual(soundGroup.learners.map(learner => learner.name), ["Aisha", "Camila"]);
  assert.equal(soundGroup.basis, "Shared Sound Seekers re-teaching evidence");
  assert.deepEqual(focusGroup.learners.map(learner => learner.name), ["Aarav", "Camila"]);
  assert.equal(focusGroup.basis, "Shared current curriculum focus");
});

test("outliers require policy-ready evidence and a 15-point median distance", () => {
  const { outliers } = buildTeacherProgressOverview(rows);

  assert.deepEqual(
    outliers.map(row => ({
      name: row.name,
      difference: row.difference,
      direction: row.direction
    })),
    [
      { name: "Aisha", difference: -45, direction: "below" },
      { name: "Aarav", difference: 15, direction: "above" }
    ]
  );
  assert.ok(outliers.every(row => row.name !== "Bao"));
});

test("class-first progress renders all four insights and a learner item path", () => {
  const html = renderToStaticMarkup(
    React.createElement(TeacherProgressOverview, {
      className: "Audit Class A",
      classList: [{ id: "class-a", name: "Audit Class A" }],
      selectedClassId: "class-a",
      rows,
      selectedLearnerId: "aisha",
      onSelectClass() {},
      onSelectLearner() {},
      onClearLearner() {},
      onOpenReports() {}
    })
  );

  assert.match(html, /aria-label="Class progress overview"/);
  for (const label of ["Distribution", "Coverage", "Groups", "Outliers"]) {
    assert.match(html, new RegExp(`>${label}<`));
  }
  assert.match(html, /Review Aisha evidence/);
  assert.match(html, /aria-label="Learner progress evidence: Aisha"/);
  assert.match(html, /<h4>Sound item evidence<\/h4>/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Needs re-teaching · 12 recorded encounters/);
});
