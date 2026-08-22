function requireOk(data, fallback) {
  if (!data?.ok) {
    const error = new Error(data?.error || fallback);
    error.code = data?.error || "guardian_portal_error";
    throw error;
  }
  return data;
}

async function call(client, name, parameters, fallback) {
  const { data, error } = await client.call(name, parameters);
  if (error) throw error;
  return requireOk(data, fallback);
}

export const guardianPortalApi = Object.freeze({
  previewInvite: (client, token) => call(
    client,
    "guardian_invite_preview",
    { p_token: token },
    "This invitation is no longer available."
  ),
  acceptInvite: (client, { token, displayName, termsVersion, privacyVersion }) => call(
    client,
    "guardian_accept_invite",
    {
      p_token: token,
      p_display_name: displayName,
      p_terms_version: termsVersion,
      p_privacy_version: privacyVersion
    },
    "The invitation could not be accepted."
  ),
  getPortal: client => call(client, "guardian_get_portal", {}, "The family area could not be loaded."),
  updatePreferences: (client, { preferredLanguage, reportNotifications }) => call(
    client,
    "guardian_update_preferences",
    {
      p_preferred_language: preferredLanguage,
      p_report_notifications: reportNotifications
    },
    "Your preferences could not be saved."
  ),
  recordReportEvent: (client, { reportId, eventType }) => call(
    client,
    "guardian_record_report_event",
    { p_report_id: reportId, p_event_type: eventType },
    "The report event could not be recorded."
  ),
  createInvite: (client, { studentId, guardianEmail, expiresDays = 7 }) => call(
    client,
    "teacher_create_guardian_invite",
    {
      p_student_id: studentId,
      p_guardian_email: guardianEmail,
      p_expires_days: expiresDays
    },
    "The family invitation could not be created."
  ),
  listAccess: (client, studentId) => call(
    client,
    "teacher_list_guardian_access",
    { p_student_id: studentId },
    "Family access could not be loaded."
  ),
  cancelInvite: (client, inviteId) => call(
    client,
    "teacher_cancel_guardian_invite",
    { p_invite_id: inviteId },
    "The invitation could not be cancelled."
  ),
  revokeAccess: (client, { studentId, guardianUserId }) => call(
    client,
    "teacher_revoke_guardian_access",
    { p_student_id: studentId, p_guardian_user_id: guardianUserId },
    "Family access could not be removed."
  ),
  releaseReport: (client, { studentId, title, snapshot }) => call(
    client,
    "teacher_release_family_report",
    { p_student_id: studentId, p_title: title, p_snapshot: snapshot },
    "The family report could not be released."
  ),
  withdrawReport: (client, reportId) => call(
    client,
    "teacher_withdraw_family_report",
    { p_report_id: reportId },
    "The family report could not be withdrawn."
  )
});
