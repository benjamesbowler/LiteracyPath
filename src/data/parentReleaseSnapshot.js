import {
  buildWholeChildAudienceTemplates,
  WHOLE_CHILD_REPORT_AUDIENCES
} from "./reportAudienceTemplates.js";
import { lintParentAreaPlainLanguage } from "./parentAreaModel.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function identityText(value, fallback, limit) {
  const text = value == null || value === "" ? fallback : value;
  if (typeof text !== "string" || !text.trim() || text.length > limit || /[\p{Cc}]/u.test(text)) {
    throw new Error("Check the learner, class, school and teacher details before previewing.");
  }
  return text.trim();
}

export function buildParentReleaseSnapshot({
  workspace,
  studentId,
  studentName,
  className,
  schoolName,
  teacherName = "Class teacher",
  teacherEmail = ""
}) {
  const wholeChild = workspace?.wholeChild || {};
  const family = buildWholeChildAudienceTemplates({
    report: wholeChild,
    studentName: "Your child"
  })[WHOLE_CHILD_REPORT_AUDIENCES.FAMILY];
  const sections = Object.fromEntries(asArray(family.sections).map(section => [section.id, section]));
  const homeSupport = sections.what_you_can_do_at_home;
  const strengths = asArray(sections.what_your_child_can_do?.items).slice(0, 4);
  const nextFocus = asArray(sections.working_on_next?.items).slice(0, 2);
  const snapshot = {
    schemaVersion: 1,
    updatedLabel: `Released ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`,
    highlight: family.description,
    strengths,
    canDo: strengths,
    nextFocus,
    meaning: sections.what_this_means.description,
    progress: family.progress,
    atHome: {
      title: homeSupport.title,
      introduction: homeSupport.description,
      durationLabel: "",
      language: "en",
      activities: asArray(homeSupport.items).map(direction => ({ moment: "", title: "", direction })),
      privacyText: "Home practice is not recorded and does not change the school report."
    },
    contact: {
      message: "Contact the class teacher if you would like to talk about this update."
    }
  };
  const issues = lintParentAreaPlainLanguage(snapshot);
  if (issues.length) {
    throw new Error(`The family report contains internal wording: ${issues.join(", ")}`);
  }
  if (typeof teacherEmail !== "string" || teacherEmail.length > 320
    || (teacherEmail && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(teacherEmail))) {
    throw new Error("Check the teacher’s contact email before previewing.");
  }
  return {
    ...snapshot,
    learner: {
      id: identityText(studentId, "", 120),
      name: identityText(studentName, "", 200),
      classLabel: identityText(className, "Class not shown", 200),
      schoolName: identityText(schoolName, "Your school", 200)
    },
    contact: {
      ...snapshot.contact,
      name: identityText(teacherName, "Class teacher", 200),
      email: teacherEmail
    }
  };
}
