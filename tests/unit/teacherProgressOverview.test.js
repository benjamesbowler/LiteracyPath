import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  PROGRESS_ITEM_MIN_ATTEMPTS,
  PROGRESS_MIN_RESPONSES,
  buildTeacherProgressOverview
} from "../../src/utils/teacherProgressOverview.js";

const rows = [
  {
    id: "aarav",
    name: "Aarav",
    answered: 20,
    correct: 18,
    accuracy: 90,
    masteredCount: 3,
    currentSkill: "CVC Short Vowels",
    evidenceSkills: ["Initial Sounds", "Final Sounds", "CVC Short Vowels"],
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
    correct: 6,
    accuracy: 30,
    masteredCount: 0,
    currentSkill: "Initial Sounds",
    evidenceSkills: ["Initial Sounds", "Final Sounds", "CVC Short Vowels"],
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
    correct: 9,
    accuracy: 75,
    masteredCount: 2,
    currentSkill: "CVC Short Vowels",
    evidenceSkills: ["Initial Sounds", "Final Sounds", "CVC Short Vowels"],
    soundSeekers: {
      lastActiveAt: "2026-07-23T09:00:00.000Z",
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
const POLICY_NOW = new Date("2026-07-24T12:00:00.000Z");

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
  const summary = buildTeacherProgressOverview(rows, { now: POLICY_NOW });
  const counts = Object.fromEntries(summary.distribution.map(band => [band.id, band.count]));

  assert.equal(PROGRESS_MIN_RESPONSES, 8);
  assert.deepEqual(counts, {
    secure: 1,
    developing: 1,
    "needs-support": 1,
    not_enough_evidence: 1
  });
  assert.equal(summary.classMedian, 75);
});

test("class accuracy exposes learner-weighted and response-weighted views with evidence counts", () => {
  const { classAccuracy } = buildTeacherProgressOverview(rows, { now: POLICY_NOW });

  assert.equal(classAccuracy.learnerWeightedAccuracy, 65);
  assert.equal(classAccuracy.responseWeightedAccuracy, 63.5);
  assert.equal(classAccuracy.policyReadyLearnerCount, 3);
  assert.equal(classAccuracy.totalLearnerCount, 4);
  assert.equal(classAccuracy.responseCount, 52);
  assert.equal(classAccuracy.comparability.comparable, true);
  assert.equal(classAccuracy.headlineAccuracy, 65);
});

test("weak class comparability suppresses the single headline without hiding both views", () => {
  const imbalanced = [
    {
      id: "one",
      name: "One",
      answered: 8,
      accuracy: 100,
      evidenceSkills: ["Initial Sounds", "Final Sounds"],
      lastActive: "2026-07-23T09:00:00.000Z"
    },
    {
      id: "two",
      name: "Two",
      answered: 40,
      accuracy: 50,
      evidenceSkills: ["Initial Sounds", "Final Sounds"],
      lastActive: "2026-07-23T09:00:00.000Z"
    }
  ];
  const { classAccuracy } = buildTeacherProgressOverview(imbalanced, { now: POLICY_NOW });

  assert.equal(classAccuracy.learnerWeightedAccuracy, 75);
  assert.equal(classAccuracy.responseWeightedAccuracy, 58.3);
  assert.equal(classAccuracy.comparability.comparable, false);
  assert.equal(classAccuracy.headlineAccuracy, null);
  assert.match(classAccuracy.comparability.reason, /5:1 response imbalance/);
});

test("coverage distinguishes evidence presence, policy readiness, and exact item reach", () => {
  const { coverage } = buildTeacherProgressOverview(rows, { now: POLICY_NOW });

  assert.deepEqual({
    totalLearners: coverage.totalLearners,
    learnersWithAnyEvidence: coverage.learnersWithAnyEvidence,
    learnersPolicyReady: coverage.learnersPolicyReady,
    learnerPercent: coverage.learnerPercent,
    policyReadyPercent: coverage.policyReadyPercent,
    responseCount: coverage.responseCount,
    itemTargetsSeen: coverage.itemTargetsSeen,
    itemTargetCount: coverage.itemTargetCount,
    itemPercent: coverage.itemPercent
  }, {
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
  assert.equal(coverage.evidence.confidence.label, "Results coverage");
});

test("groups expose transparent shared-focus and shared-item membership", () => {
  const { groups } = buildTeacherProgressOverview(rows, { now: POLICY_NOW });
  const soundGroup = groups.find(group => group.id === "sound:m");
  const focusGroup = groups.find(group => group.id === "focus:cvc short vowels");

  assert.deepEqual(soundGroup.learners.map(learner => learner.name), ["Aisha", "Camila"]);
  assert.equal(soundGroup.basis, "Shared Sound Seekers re-teaching results");
  assert.deepEqual(focusGroup.learners.map(learner => learner.name), ["Aarav", "Camila"]);
  assert.equal(focusGroup.basis, "Shared current curriculum focus");
});

test("outliers require policy-ready evidence and a 15-point median distance", () => {
  const { outliers } = buildTeacherProgressOverview(rows, { now: POLICY_NOW });

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

test("evidence bases expose attempts, diversity, recency, confidence, and support use", () => {
  const summary = buildTeacherProgressOverview(rows, { now: POLICY_NOW });
  const aisha = summary.rows.find(row => row.id === "aisha");
  const item = aisha.itemEvidence.find(row => row.id === "m");

  assert.equal(PROGRESS_ITEM_MIN_ATTEMPTS, 3);
  assert.equal(aisha.evidence.attemptsLabel, "20 scored responses");
  assert.equal(aisha.evidence.diversityLabel, "3 check skills");
  assert.equal(aisha.evidence.recencyLabel, "23 Jul 2026");
  assert.match(aisha.evidence.confidenceLabel, /^Stronger results/);
  assert.equal(aisha.evidence.supportUseLabel, "0 supported of 12 recorded Sound Seekers encounters");
  assert.equal(item.policyReady, true);
  assert.match(item.evidence.confidenceLabel, /^Limited diversity/);
});

test("a sparse child renders Not enough results instead of a bare percentage", () => {
  const sparse = {
    id: "amara",
    name: "Amara",
    answered: 1,
    accuracy: 100,
    masteredCount: 0,
    currentSkill: "Final Sounds",
    evidenceSkills: ["Final Sounds"],
    lastActive: "2026-07-23T08:00:00.000Z",
    soundSeekers: null
  };
  const summary = buildTeacherProgressOverview([sparse], { now: POLICY_NOW });

  assert.equal(summary.rows[0].evidence.ready, false);
  assert.equal(summary.rows[0].evidence.confidence.label, "Not enough results");

  const html = renderToStaticMarkup(
    React.createElement(TeacherProgressOverview, {
      className: "Audit Class A",
      classList: [{ id: "class-a", name: "Audit Class A" }],
      selectedClassId: "class-a",
      rows: [sparse],
      selectedLearnerId: "amara",
      policyNow: POLICY_NOW,
      onSelectClass() {},
      onSelectLearner() {},
      onClearLearner() {},
      onOpenReports() {}
    })
  );

  assert.match(html, /Too few results for an accuracy figure/);
  assert.doesNotMatch(html, /100% accuracy/);
  assert.match(html, /aria-label="Amara result conclusion results used"/);
  for (const label of ["Attempts", "Diversity", "Recency", "Confidence", "Support use"]) {
    assert.match(html, new RegExp(`<dt>${label}</dt>`));
  }
});

test("class-first progress renders all four insights and a learner item path", () => {
  const html = renderToStaticMarkup(
    React.createElement(TeacherProgressOverview, {
      className: "Audit Class A",
      classList: [{ id: "class-a", name: "Audit Class A" }],
      selectedClassId: "class-a",
      rows,
      selectedLearnerId: "aisha",
      policyNow: POLICY_NOW,
      onSelectClass() {},
      onSelectLearner() {},
      onClearLearner() {},
      onOpenReports() {}
    })
  );

  assert.match(html, /aria-label="Class progress overview"/);
  assert.match(html, /aria-label="Class accuracy comparison"/);
  assert.match(html, /Averaging children equally/);
  assert.match(html, /65%/);
  assert.match(html, /3 children have enough results/);
  assert.match(html, /Averaging every answer equally/);
  assert.match(html, /63.5%/);
  assert.match(html, /52 scored answers/);
  for (const label of ["Distribution", "Coverage", "Groups", "Outliers"]) {
    assert.match(html, new RegExp(`>${label}<`));
  }
  assert.match(html, /<h3>Aisha&#x27;s results<\/h3>/);
  assert.match(html, /aria-label="Child progress results: Aisha"/);
  assert.match(html, /<h4>Sound results<\/h4>/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Needs re-teaching · 12 recorded encounters/);
});
