import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

// ── WHAT THIS FILE PINS ─────────────────────────────────────────────────────
//
// One rule, four surfaces: a number the app has not read yet is never shown as
// a zero, and "you have nothing" is never said before the request that would
// prove it has come back.
//
// Each of these was a real defect. Today cleared its student list on a class
// change and immediately reported "No student needs a review". The Checks and
// Reports funnels read an empty class list on a fresh sign-in as "make your
// class first". The intervention panel started with loading already false, so
// a failed read looked exactly like a teacher who had planned nothing.

let TeacherAssessmentsPage;
let TeacherIntentPage;
let TeacherReportsHubPage;
let TeacherStudentsPage;
let TeacherTodayPage;
let InterventionLoop;
let TeacherActivitySyncHealth;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  TeacherAssessmentsPage = (await vite.ssrLoadModule(
    "/src/components/TeacherAssessmentsPage.jsx"
  )).TeacherAssessmentsPage;
  TeacherReportsHubPage = (await vite.ssrLoadModule(
    "/src/components/TeacherReportsHubPage.jsx"
  )).TeacherReportsHubPage;
  TeacherIntentPage = (await vite.ssrLoadModule(
    "/src/components/teacher/TeacherIntentPage.jsx"
  )).TeacherIntentPage;
  TeacherTodayPage = (await vite.ssrLoadModule(
    "/src/components/TeacherTodayPage.jsx"
  )).TeacherTodayPage;
  TeacherStudentsPage = (await vite.ssrLoadModule(
    "/src/components/TeacherStudentsPage.jsx"
  )).TeacherStudentsPage;
  InterventionLoop = (await vite.ssrLoadModule(
    "/src/components/teacher/InterventionLoop.jsx"
  )).InterventionLoop;
  TeacherActivitySyncHealth = (await vite.ssrLoadModule(
    "/src/components/teacher/TeacherActivitySyncHealth.jsx"
  )).TeacherActivitySyncHealth;
});

test.after(async () => {
  await vite?.close();
});

test("existing teachers must choose a verified class before Today opens", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherTodayPage, {
    classList: [
      { id: "class-willow", name: "Willow Class", studentCount: 18 },
      { id: "class-oak", name: "Oak Class", studentCount: 21 }
    ],
    selectedClassId: "",
    loadingClasses: false,
    teacherId: "teacher-a"
  }));

  assert.match(html, /Choose your class/);
  assert.match(html, /Willow Class/);
  assert.match(html, /18 students/);
  assert.match(html, /Oak Class/);
  assert.doesNotMatch(html, /Create your first class/);
  assert.doesNotMatch(html, /Today ·/);
});

test("a verified new teacher account gets first-class creation directly", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherTodayPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: false,
    teacherId: "teacher-new",
    newClassName: "",
    setNewClassName: () => {},
    createClass: async () => true
  }));

  assert.match(html, /Create your first class/);
  assert.match(html, /Class name/);
  assert.match(html, /For example, Willow Class/);
  assert.match(html, /type="submit"/);
  assert.doesNotMatch(html, /Choose your class/);
  assert.doesNotMatch(html, /Today ·/);
});

// A fresh sign-in: the class request is in flight, so there is no class list and
// no selected class yet. That is not the same as having no classes.
test("the checks funnel waits instead of telling a teacher to make their first class", () => {
  const loading = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: true,
    routeHash: "#teacher/checks"
  }));
  assert.match(loading, /data-teacher-state="loading"/);
  assert.doesNotMatch(loading, /Make your class first/);

  const settled = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: false,
    routeHash: "#teacher/checks"
  }));
  assert.match(settled, /data-teacher-state="empty"/);
  assert.match(settled, /Make your class first/);
});

test("the reports funnel always keeps its class and student recovery steps available", () => {
  const loading = renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: true,
    routeHash: "#teacher/reports",
    renderStudentReport: () => null,
    renderClassReport: () => null
  }));
  assert.match(loading, /Choose a class/);
  assert.match(loading, /Getting your classes/);
  assert.match(loading, /Who are the reports for\?/);
  assert.doesNotMatch(loading, /No progress results yet/);

  const settled = renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: false,
    routeHash: "#teacher/reports",
    renderStudentReport: () => null,
    renderClassReport: () => null
  }));
  assert.match(settled, /Choose a class/);
  assert.match(settled, /No classes are available yet/);
  assert.match(settled, /Go to Students/);
  assert.doesNotMatch(settled, /No progress results yet/);
});

test("the resources page uses the same loading signal as the two funnels", () => {
  const loading = renderToStaticMarkup(React.createElement(TeacherIntentPage, {
    intent: "resources",
    classList: [],
    selectedClassId: "",
    loadingClasses: true
  }));
  assert.match(loading, /data-teacher-surface="resources"/);
  assert.match(loading, /data-teacher-state="loading"/);

  const settled = renderToStaticMarkup(React.createElement(TeacherIntentPage, {
    intent: "resources",
    classList: [],
    selectedClassId: "",
    loadingClasses: false
  }));
  assert.doesNotMatch(settled, /data-teacher-state="loading"/);
});

test("every teacher entry surface treats a failed class read as retryable, never empty", () => {
  const failedRead = {
    status: "error",
    teacherId: "teacher-a",
    lastCompleteTeacherId: "",
    attempt: 1
  };
  const common = {
    classList: [],
    classListReadState: failedRead,
    teacherId: "teacher-a",
    selectedClassId: "class-from-link"
  };
  const pages = [
    {
      name: "Today",
      html: renderToStaticMarkup(React.createElement(TeacherTodayPage, {
        ...common,
        loadClasses: () => {}
      }))
    },
    {
      name: "Students",
      html: renderToStaticMarkup(React.createElement(TeacherStudentsPage, {
        ...common,
        loadClasses: () => {},
        newClassName: "",
        skillTree: []
      }))
    },
    {
      name: "Assessments",
      html: renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
        ...common,
        onRetryClasses: () => {},
        routeHash: "#teacher/checks?class=class-from-link"
      }))
    },
    {
      name: "Reports",
      html: renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
        ...common,
        onRetryClasses: () => {},
        renderStudentReport: () => null,
        renderClassReport: () => null,
        routeHash: "#teacher/reports?class=class-from-link"
      }))
    },
    {
      name: "Resources",
      html: renderToStaticMarkup(React.createElement(TeacherIntentPage, {
        ...common,
        intent: "resources",
        onRetryClasses: () => {}
      }))
    }
  ];

  pages.forEach(({ name, html }) => {
    assert.match(html, /data-teacher-state="partial"/, `${name} must show an incomplete read`);
    assert.match(html, /class list could not be (?:confirmed|loaded)/i, `${name} must explain the failed class read`);
    assert.match(html, /Try loading again/, `${name} must provide a real retry`);
    assert.doesNotMatch(html, /Make your class first|No classes yet|No classes are available yet/, `${name} must not invent an empty account`);
    assert.doesNotMatch(html, /You can assess now|Use available resources|Review available results/, `${name} must stay fail-closed`);
  });
});

test("a safety-limit class read is labelled as incomplete on every class entry surface", () => {
  const truncatedRead = {
    status: "truncated",
    teacherId: "teacher-a",
    lastCompleteTeacherId: "",
    attempt: 1
  };
  const common = {
    classList: [],
    classListReadState: truncatedRead,
    teacherId: "teacher-a",
    selectedClassId: "class-from-link"
  };
  const pages = [
    renderToStaticMarkup(React.createElement(TeacherTodayPage, {
      ...common,
      loadClasses: () => {}
    })),
    renderToStaticMarkup(React.createElement(TeacherStudentsPage, {
      ...common,
      loadClasses: () => {},
      newClassName: "",
      skillTree: []
    })),
    renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
      ...common,
      onRetryClasses: () => {}
    })),
    renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
      ...common,
      onRetryClasses: () => {},
      renderStudentReport: () => null,
      renderClassReport: () => null
    })),
    renderToStaticMarkup(React.createElement(TeacherIntentPage, {
      ...common,
      intent: "resources",
      onRetryClasses: () => {}
    }))
  ];

  pages.forEach(html => {
    assert.match(html, /safety limit/i);
    assert.match(html, /Try loading again/);
    assert.doesNotMatch(html, /Make your class first|No classes yet|No classes are available yet/);
  });
});

test("Today shows the loading state rather than a briefing full of zeros", () => {
  const shared = {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    selectedClassId: "class-a",
    studentList: [],
    classDashboard: []
  };

  const loading = renderToStaticMarkup(React.createElement(TeacherTodayPage, {
    ...shared,
    loadingStudents: true
  }));
  assert.match(loading, /data-teacher-surface="today"/);
  assert.match(loading, /data-teacher-state="loading"/);
  assert.match(loading, /aria-busy="true"/);
  assert.doesNotMatch(loading, /No student needs a review/);
  assert.doesNotMatch(loading, /Today&#x27;s class briefing|Today's class briefing/);
  // v2 Dashboard: the class name lives in the shared context bar above the
  // page, so the page itself must not invent zeros while loading — the header
  // still frames the briefing without claiming any figures.
  assert.match(loading, /Start with these students/);
  assert.doesNotMatch(loading, /0 of 0/);

  const settled = renderToStaticMarkup(React.createElement(TeacherTodayPage, {
    ...shared,
    loadingStudents: false
  }));
  assert.doesNotMatch(settled, /data-teacher-state="loading"/);
  assert.match(settled, /No student needs a review/);
});

test("an initial roster error gives Today a retry instead of an empty-class conclusion", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherTodayPage, {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    selectedClassId: "class-a",
    studentList: [],
    classDashboard: [],
    studentListReadState: {
      status: "incomplete",
      classId: "class-a",
      lastCompleteClassId: "",
      reason: "unavailable"
    }
  }));

  assert.match(html, /data-teacher-state="partial"/);
  assert.match(html, /The student list could not be confirmed/);
  assert.match(html, /Try loading again/);
  assert.doesNotMatch(html, /0 students/);
  assert.doesNotMatch(html, /No student needs a review/);
  assert.doesNotMatch(html, /Add your students/);
});

test("a failed class switch never displays the previous class roster or first-student setup", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherStudentsPage, {
    classList: [{ id: "class-b", name: "Audit Class B", access_code: "5678" }],
    selectedClassId: "class-b",
    studentList: [{
      id: "student-a",
      name: "Aaron",
      class_id: "class-a",
      symbol_password: "123"
    }],
    studentListReadState: {
      status: "incomplete",
      classId: "class-b",
      lastCompleteClassId: "class-a",
      reason: "unavailable"
    },
    newClassName: "",
    skillTree: []
  }));

  assert.match(html, /data-teacher-state="partial"/);
  assert.match(html, /The student list could not be confirmed/);
  assert.match(html, /Try loading again/);
  assert.doesNotMatch(html, /Aaron/);
  assert.doesNotMatch(html, /Add your first student to Audit Class B/);
});

test("a truncated roster read is labelled as incomplete and remains retryable", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherStudentsPage, {
    classList: [{ id: "class-a", name: "Audit Class A", access_code: "1234" }],
    selectedClassId: "class-a",
    studentList: [],
    studentListReadState: {
      status: "incomplete",
      classId: "class-a",
      lastCompleteClassId: "",
      reason: "truncated"
    },
    newClassName: "",
    skillTree: []
  }));

  assert.match(html, /read reached its safety limit/);
  assert.match(html, /Try loading again/);
  assert.doesNotMatch(html, /Add your first student to Audit Class A/);
});

test("checks and reports never call a failed or truncated roster an empty class", () => {
  for (const status of ["error", "truncated"]) {
    const common = {
      classList: [{ id: "class-a", name: "Audit Class A" }],
      classListReadState: {
        status: "complete",
        teacherId: "teacher-a",
        lastCompleteTeacherId: "teacher-a"
      },
      teacherId: "teacher-a",
      selectedClassId: "class-a",
      className: "Audit Class A",
      studentList: [],
      studentListReadState: {
        status,
        classId: "class-a",
        lastCompleteClassId: "",
        reason: status === "truncated" ? "truncated" : "unavailable"
      },
      onRetryStudents: () => {}
    };
    const checks = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
      ...common
    }));
    const reports = renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
      ...common,
      renderStudentReport: () => null,
      renderClassReport: () => null
    }));

    for (const html of [checks, reports]) {
      assert.match(html, /Try loading students again/);
      assert.doesNotMatch(html, /No students in this class yet/);
      assert.match(
        html,
        status === "truncated" ? /safety limit/ : /could not be confirmed/
      );
    }
  }
});

test("a failed class-dashboard switch never exposes the previous class learner", () => {
  const common = {
    classList: [{ id: "class-b", name: "Audit Class B" }],
    classListReadState: {
      status: "complete",
      teacherId: "teacher-a",
      lastCompleteTeacherId: "teacher-a"
    },
    teacherId: "teacher-a",
    selectedClassId: "class-b",
    className: "Audit Class B",
    studentList: [{
      id: "student-b",
      name: "Bella",
      class_id: "class-b",
      symbol_password: "123"
    }],
    studentListReadState: {
      status: "complete",
      classId: "class-b",
      lastCompleteClassId: "class-b"
    },
    studentRows: [{
      id: "student-a",
      name: "Aaron",
      classId: "class-a",
      evidenceReadStatus: "complete"
    }],
    classDashboard: [{
      id: "student-a",
      name: "Aaron",
      classId: "class-a",
      evidenceReadStatus: "complete"
    }],
    classDashboardReadState: {
      status: "error",
      classId: "class-b",
      lastCompleteClassId: "class-a",
      reason: "unavailable"
    },
    onRetryClassDashboard: () => {},
    loadClassDashboard: () => {}
  };
  const checks = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, common));
  const reports = renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
    ...common,
    renderStudentReport: () => null,
    renderClassReport: () => null
  }));
  const students = renderToStaticMarkup(React.createElement(TeacherStudentsPage, {
    ...common,
    newClassName: "",
    skillTree: []
  }));

  for (const html of [checks, reports, students]) {
    assert.match(html, /Bella/);
    assert.doesNotMatch(html, /Aaron/);
    assert.match(html, /class progress|Class results|saved results/i);
  }
  assert.match(checks, /Try loading class progress again/);
  assert.match(reports, /Try loading class progress again/);
  assert.match(students, /Try loading again/);
});

test("a stale class id settles on a chooser instead of an endless loading state", () => {
  const common = {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    classListReadState: {
      status: "complete",
      teacherId: "teacher-a",
      lastCompleteTeacherId: "teacher-a"
    },
    teacherId: "teacher-a",
    selectedClassId: "deleted-class",
    className: "",
    studentListReadState: {
      status: "complete",
      classId: "deleted-class",
      lastCompleteClassId: "deleted-class"
    },
    classDashboardReadState: {
      status: "complete",
      classId: "deleted-class",
      lastCompleteClassId: "deleted-class"
    }
  };
  const students = renderToStaticMarkup(React.createElement(TeacherStudentsPage, {
    ...common,
    newClassName: "",
    skillTree: []
  }));
  const today = renderToStaticMarkup(React.createElement(TeacherTodayPage, common));

  assert.match(students, /Choose a class/);
  assert.doesNotMatch(students, /data-teacher-state="loading"/);
  assert.doesNotMatch(students, /No classes yet/);
  // A stale saved class cannot reopen Today; the focused chooser takes over
  // instead of leaving the page spinning on an unavailable selection.
  assert.match(today, /Choose a class to see today/);
  assert.doesNotMatch(today, /data-teacher-state="loading"/);
  assert.doesNotMatch(today, /No classes yet/);
});

test("an incomplete result read pauses Today instead of making a recommendation", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherTodayPage, {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    selectedClassId: "class-a",
    studentList: [{ id: "student-a", name: "Aaron" }],
    classDashboard: [{
      id: "student-a",
      answered: 12,
      correct: 3,
      accuracy: 25,
      masteredCount: 4,
      currentSkill: "Initial sounds",
      evidenceReadStatus: "incomplete",
      evidenceMissingSources: ["student_answers"]
    }],
    loadingStudents: false,
    loadClassDashboard: () => {}
  }));

  assert.match(html, /data-teacher-state="partial"/);
  assert.match(html, /Some class information could not be loaded/);
  assert.match(html, /Today&#x27;s suggestions are paused|Today&apos;s suggestions are paused/);
  assert.match(html, /Try loading again/);
  assert.doesNotMatch(html, /Today&#x27;s class briefing|Today's class briefing/);
  assert.doesNotMatch(html, /Aaron[\s\S]*needs more practice/);
});

test("Students keeps roster controls available but hides incomplete learning figures", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherStudentsPage, {
    classList: [{ id: "class-a", name: "Audit Class A", access_code: "1234" }],
    selectedClassId: "class-a",
    studentList: [{
      id: "student-a",
      name: "Aaron",
      symbol_password: "123"
    }],
    classDashboard: [{
      id: "student-a",
      answered: 12,
      correct: 3,
      accuracy: 25,
      masteredCount: 4,
      currentSkill: "Initial sounds",
      lastActive: "2026-07-27T08:00:00.000Z",
      evidenceReadStatus: "incomplete",
      evidenceMissingSources: ["student_answers"]
    }],
    loadingStudents: false,
    loadClassDashboard: () => {},
    newClassName: "",
    skillTree: Array.from({ length: 30 }, (_unused, index) => ({ id: `skill-${index}` }))
  }));

  assert.match(html, /data-teacher-state="partial"/);
  assert.match(html, /names and sign-in can still be managed/);
  assert.match(html, /Aaron/);
  assert.match(html, /Some results could not load/);
  assert.match(html, /Results unavailable/);
  // v2 Students: the roster row stays selectable and the class-list tools stay
  // open, so a teacher can still manage names and sign-in while the learning
  // figures are withheld. The per-student sign-in editor moved into the panel
  // that a row fills.
  assert.match(html, /teacher-roster-name teacher-open-student/);
  assert.match(html, /Add students and set up sign-in/);
  assert.match(html, /Sign-in ready/);
  assert.doesNotMatch(html, /Recognise Aaron&#x27;s progress|Reteach Initial sounds/);
});

test("the intervention panel does not claim an empty plan list before it has read one", () => {
  const html = renderToStaticMarkup(React.createElement(InterventionLoop, {
    supabase: {},
    teacherId: "teacher-1",
    classId: "class-a",
    className: "Audit Class A",
    rows: []
  }));
  assert.match(html, /Loading your teaching plans/);
  assert.doesNotMatch(html, /No interventions planned for this class/);
});

test("saving and syncing shows no counts while it is still checking", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherActivitySyncHealth, {
    supabase: {},
    classId: "class-a",
    className: "Audit Class A"
  }));
  assert.match(html, /Checking whether results are reaching your dashboard/);
  // "Saved 0 of 0" under a "Checking" header reads as a confirmed zero.
  assert.doesNotMatch(html, /<dl>/);
  assert.doesNotMatch(html, /0 of 0/);
});
