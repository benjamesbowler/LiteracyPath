import {
  assertOptionalFields,
  assertPlainRecord,
  DomainBoundaryError,
  isPlainRecord
} from "./schema.js";

export const GUARDIAN_RPCS = new Set([
  "guardian_accept_invite",
  "guardian_get_portal",
  "guardian_invite_preview",
  "guardian_record_report_event",
  "guardian_update_preferences",
  "teacher_cancel_guardian_invite",
  "teacher_create_guardian_invite",
  "teacher_list_guardian_access",
  "teacher_release_family_report",
  "teacher_revoke_guardian_access",
  "teacher_withdraw_family_report"
]);

function validateLearner(row, label) {
  assertPlainRecord(row, label);
  assertOptionalFields(row, {
    id: "string",
    name: "string",
    classLabel: "string",
    schoolName: "string"
  }, label);
}

function validateReport(row, label) {
  assertPlainRecord(row, label);
  assertOptionalFields(row, {
    id: "string",
    title: "string",
    publishedAt: "string",
    publishedLabel: "string",
    summary: "string",
    snapshot: "object"
  }, label);
  if (row.snapshot) validateSnapshot(row.snapshot, `${label}.snapshot`);
}

function validateStringArray(value, label) {
  if (!Array.isArray(value)) return;
  value.forEach((item, index) => {
    if (typeof item !== "string") throw new DomainBoundaryError(`${label}[${index}] must be text.`);
  });
}

function validateSnapshot(snapshot, label) {
  assertPlainRecord(snapshot, label);
  assertOptionalFields(snapshot, {
    schemaVersion: "integer",
    learner: "object",
    updatedLabel: "string",
    highlight: "string",
    strengths: "array",
    canDo: "array",
    nextFocus: "array",
    meaning: "string",
    progress: "array",
    atHome: "object",
    recentReading: "array",
    contact: "object"
  }, label);
  if (snapshot.schemaVersion !== 1) throw new DomainBoundaryError(`${label}.schemaVersion must be 1.`);
  validateLearner(snapshot.learner, `${label}.learner`);
  validateStringArray(snapshot.strengths, `${label}.strengths`);
  validateStringArray(snapshot.canDo, `${label}.canDo`);
  validateStringArray(snapshot.nextFocus, `${label}.nextFocus`);
  snapshot.progress?.forEach((item, index) => {
    const itemLabel = `${label}.progress[${index}]`;
    assertPlainRecord(item, itemLabel);
    assertOptionalFields(item, { id: "string", label: "string", status: "string", detail: "string" }, itemLabel);
  });
  if (snapshot.atHome) {
    assertOptionalFields(snapshot.atHome, {
      title: "string",
      introduction: "string",
      durationLabel: "string",
      language: "string",
      activities: "array",
      privacyText: "string"
    }, `${label}.atHome`);
    snapshot.atHome.activities?.forEach((item, index) => {
      const itemLabel = `${label}.atHome.activities[${index}]`;
      assertPlainRecord(item, itemLabel);
      assertOptionalFields(item, { moment: "string", title: "string", direction: "string" }, itemLabel);
    });
  }
  if (snapshot.contact) {
    assertOptionalFields(snapshot.contact, { name: "string", email: "string", message: "string" }, `${label}.contact`);
  }
}

function validatePortal(row, label) {
  assertOptionalFields(row, {
    ok: "boolean",
    error: "string",
    profile: "object",
    children: "array"
  }, label);
  if (isPlainRecord(row.profile)) {
    assertOptionalFields(row.profile, {
      user_id: "string",
      email: "string",
      display_name: "string",
      preferred_language: "string",
      report_notifications: "boolean"
    }, `${label}.profile`);
  }
  if (Array.isArray(row.children)) {
    row.children.forEach((child, index) => {
      const childLabel = `${label}.children[${index}]`;
      assertPlainRecord(child, childLabel);
      assertOptionalFields(child, {
        learner: "object",
        latest_snapshot: "object",
        reports: "array"
      }, childLabel);
      if (child.learner) validateLearner(child.learner, `${childLabel}.learner`);
      if (child.latest_snapshot) validateSnapshot(child.latest_snapshot, `${childLabel}.latest_snapshot`);
      child.reports?.forEach((report, reportIndex) => (
        validateReport(report, `${childLabel}.reports[${reportIndex}]`)
      ));
    });
  }
}

function validateTeacherAccess(row, label) {
  assertOptionalFields(row, {
    ok: "boolean",
    error: "string",
    invites: "array",
    links: "array",
    reports: "array"
  }, label);
  for (const [field, items] of Object.entries({
    invites: row.invites,
    links: row.links,
    reports: row.reports
  })) {
    if (!Array.isArray(items)) continue;
    items.forEach((item, index) => {
      assertPlainRecord(item, `${label}.${field}[${index}]`);
      assertOptionalFields(item, {
        id: "string",
        guardian_user_id: "string",
        guardian_email: "string",
        display_name: "string",
        title: "string",
        expires_at: "string",
        created_at: "string",
        released_at: "string"
      }, `${label}.${field}[${index}]`);
    });
  }
}

export function validateGuardianRpcData(name, data) {
  if (!GUARDIAN_RPCS.has(name)) return null;
  if (data === null || data === undefined) return data;
  if (!isPlainRecord(data)) {
    throw new DomainBoundaryError(`rpc.${name} must return an object.`);
  }
  const label = `rpc.${name}`;
  assertOptionalFields(data, {
    ok: "boolean",
    error: "string",
    invite_id: "string",
    token: "string",
    guardian_email: "string",
    expires_at: "string",
    student_name: "string",
    school_name: "string",
    student_id: "string",
    link_id: "string",
    report_id: "string",
    released_at: "string"
  }, label);
  if (name === "guardian_get_portal") validatePortal(data, label);
  if (name === "teacher_list_guardian_access") validateTeacherAccess(data, label);
  return data;
}
