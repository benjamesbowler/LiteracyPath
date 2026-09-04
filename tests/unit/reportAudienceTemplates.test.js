import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWholeChildAudienceTemplates,
  FAMILY_REPORT_BANNED_TERMS,
  familyReportDisplayText,
  lintFamilyReportPlainLanguage,
  WHOLE_CHILD_REPORT_AUDIENCES
} from "../../src/data/reportAudienceTemplates.js";

const seededWholeChildReport = {
  reportKey: "whole_child",
  studentId: "seeded-learner-1",
  evidence: [
    { evidenceId: "evidence-1" },
    { evidenceId: "evidence-2" },
    { evidenceId: "evidence-3" }
  ],
  concepts: [
    {
      conceptId: "alphabet:letter_name:m",
      domain: "alphabet_knowledge",
      domainLabel: "Alphabet knowledge",
      label: "Uppercase M: letter name",
      status: { id: "secure", label: "Secure" }
    },
    {
      conceptId: "pa:initial:k",
      domain: "phonological_awareness",
      domainLabel: "Phonological awareness",
      label: "Initial sound /k/",
      status: { id: "developing", label: "Developing" }
    },
    {
      conceptId: "phonics:grapheme:sh",
      domain: "phonics",
      domainLabel: "Phonics",
      label: "Sound for sh",
      status: { id: "needs_teaching", label: "Needs support" }
    },
    {
      conceptId: "comprehension:key_details",
      domain: "comprehension",
      domainLabel: "Comprehension",
      label: "Key details",
      status: { id: "not_checked", label: "Not checked" }
    }
  ]
};

test("A7.10 builds three purpose-specific templates from one learner record", () => {
  const templates = buildWholeChildAudienceTemplates({
    report: seededWholeChildReport,
    studentName: "Aarav",
    className: "Audit Class A"
  });
  const teacher = templates[WHOLE_CHILD_REPORT_AUDIENCES.TEACHER];
  const leadership = templates[WHOLE_CHILD_REPORT_AUDIENCES.LEADERSHIP];
  const family = templates[WHOLE_CHILD_REPORT_AUDIENCES.FAMILY];

  assert.deepEqual(Object.keys(templates), [
    WHOLE_CHILD_REPORT_AUDIENCES.TEACHER,
    WHOLE_CHILD_REPORT_AUDIENCES.LEADERSHIP,
    WHOLE_CHILD_REPORT_AUDIENCES.FAMILY
  ]);
  assert.deepEqual(teacher.source, leadership.source);
  assert.deepEqual(leadership.source, family.source);
  assert.equal(teacher.source.studentId, "seeded-learner-1");
  assert.equal(teacher.source.evidenceCount, 3);
  assert.match(teacher.description, /Detailed results, teaching priorities/);
  assert.match(leadership.title, /Class and leadership summary/);
  assert.equal(leadership.metrics[0].value, "3 of 4");
  assert.equal(leadership.metrics[2].value, 2);
  assert.match(family.title, /Aarav’s reading update/);
  assert.deepEqual(family.sections.map(section => section.title), [
    "Summary highlight",
    "What your child can do",
    "What we're working on next",
    "What this means",
    "What you can do at home",
    "Who to talk to"
  ]);
});

test("A7.10 family copy is strengths-based, actionable, jargon-free, and contains no currency", () => {
  const family = buildWholeChildAudienceTemplates({
    report: seededWholeChildReport,
    studentName: "Aarav",
    className: "Audit Class A"
  })[WHOLE_CHILD_REPORT_AUDIENCES.FAMILY];
  const text = familyReportDisplayText(family);

  assert.deepEqual(lintFamilyReportPlainLanguage(family), []);
  assert.match(text, /Aarav has shown strength/);
  assert.match(text, /What you can do at home/);
  assert.match(text, /Play a quick letter game|Say two words aloud|Build one short word/);
  assert.doesNotMatch(text, /[£$€¥]/u);
  FAMILY_REPORT_BANNED_TERMS.forEach(term => {
    assert.doesNotMatch(text, new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i"));
  });
});
