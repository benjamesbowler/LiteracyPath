async function call(client, name, params) {
  if (!client || typeof client.call !== "function") throw new Error("press_service_unavailable");
  const { data, error } = await client.call(name, params);
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "The book request could not be completed.");
  return data;
}

export function createPressProject(client, { classId, learnerIds, projectRules }) {
  return call(client, "teacher_create_press_project", { p_class_id: classId, p_learner_ids: learnerIds, p_project_rules: projectRules });
}
export function listPressWork(client, classId) { return call(client, "teacher_list_press_work", { p_class_id: classId }); }
export function reviewPressRevision(client, { bookId, revisionId, decision, review }) { return call(client, "teacher_review_book_revision", { p_book_id: bookId, p_revision_id: revisionId, p_decision: decision, p_review: review }); }
export function listStudentPressProjects(client, token) { return call(client, "student_list_press_projects", { p_token: token }); }
export function saveStudentPressRevision(client, { token, projectId, bookId = null, clientEventId, book, validation }) { return call(client, "student_save_book_revision", { p_token: token, p_project_id: projectId, p_book_id: bookId, p_client_event_id: clientEventId, p_book: book, p_validation: validation }); }
export function submitStudentPressRevision(client, { token, bookId, revisionId }) { return call(client, "student_submit_book_revision", { p_token: token, p_book_id: bookId, p_revision_id: revisionId }); }
export function readClassPressLibrary(client, token) { return call(client, "student_read_class_press_library", { p_token: token }); }
