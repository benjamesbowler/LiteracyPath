import { createClient } from "@supabase/supabase-js";
import { buildLiveLessonContent } from "../src/content/liveLessons/liveLessonContent.js";
import { buildLessonComponentRegistry } from "../src/content/lessons/lessonComponentRegistry.js";
import { createLessonRecipe } from "../src/utils/lessons/validateLessonRecipe.js";
import { buildWorksheetInstanceRecipe } from "../src/utils/worksheets/buildWorksheetInstance.js";
import { createBlankWorksheetMarks } from "../src/utils/worksheets/worksheetMarks.js";
import { PRESS_ASSETS } from "../src/content/decodablePress/pressAssetRegistry.js";
import { PRESS_PROJECT_TEMPLATES } from "../src/content/decodablePress/pressProjectTemplates.js";
import { getPressWordBank } from "../src/content/decodablePress/pressWordBanks.js";
import { analyzeSentenceDecodability } from "../src/utils/decodablePress/analyzeSentenceDecodability.js";

const url = process.env.LP_AUDIT_SUPABASE_URL;
const anonKey = process.env.LP_AUDIT_SUPABASE_ANON_KEY;
const serviceKey = process.env.LP_AUDIT_SUPABASE_SERVICE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error("Missing the hosted audit credentials.");
}

const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const email = `class-quest-audit-${suffix}@example.invalid`;
const password = `${crypto.randomUUID()}Aa1!`;
const auditName = `[AUDIT ONLY] Class Quest ${suffix}`;
const symbolPassword = "147";
const deviceId = `class-quest-audit-${suffix}`;

let userId = null;
let wrongTeacherUserId = null;
let schoolId = null;
let classId = null;
let studentId = null;
let sessionId = null;
let lessonPlanId = null;
let worksheetInstanceId = null;
let pressProjectId = null;
let pressBookId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unwrap(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function unwrapSingletonArrays(value) {
  let current = value;
  while (Array.isArray(current) && current.length === 1) current = current[0];
  return current;
}

async function assertRemoved(table, column, value) {
  if (!value) return;
  const { count, error } = await service
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);
  if (error) throw new Error(`Cleanup check ${table}: ${error.message}`);
  assert(count === 0, `Cleanup left ${count} row(s) in ${table}.`);
}

try {
  const created = unwrap(await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { audit_only: true, feature: "class_quest_live" }
  }), "Create audit teacher");
  userId = created.user.id;

  unwrap(await service.from("app_admins").insert({ user_id: userId, email }), "Grant audit access");

  const school = unwrap(await service
    .from("schools")
    .insert({ name: auditName })
    .select("id")
    .single(), "Create audit school");
  schoolId = school.id;

  const signedIn = unwrap(await anon.auth.signInWithPassword({ email, password }), "Sign in audit teacher");
  const teacher = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${signedIn.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const classRow = unwrap(await teacher
    .from("classes")
    .insert({ teacher_id: userId, school_id: schoolId, name: auditName })
    .select("id, access_code")
    .single(), "Create audit class");
  classId = classRow.id;

  const student = unwrap(await teacher
    .from("students")
    .insert({ teacher_id: userId, class_id: classId, name: "Audit Learner" })
    .select("id")
    .single(), "Create audit learner");
  studentId = student.id;

  const credential = unwrap(await teacher.rpc("teacher_set_student_symbol_password", {
    p_student_id: studentId,
    p_sequence: symbolPassword,
    p_set_at: new Date().toISOString()
  }), "Set audit sign-in pictures");
  assert(credential?.ok === true, "Picture credential setup was not acknowledged.");

  const login = unwrap(await anon.rpc("student_login", {
    p_student_id: studentId,
    p_sequence: symbolPassword,
    p_device_id: deviceId,
    p_code: classRow.access_code
  }), "Audit learner sign-in");
  assert(login?.ok === true && login.token, "Audit learner sign-in did not issue a token.");

  const content = buildLiveLessonContent("cycle-3");
  assert(content.prompts.length > 0, "Cycle 3 has no live prompts.");
  const prompt = content.prompts[0];
  const started = unwrap(await teacher.rpc("teacher_start_live_lesson", {
    p_class_id: classId,
    p_student_ids: [studentId],
    p_cycle_id: content.cycleId,
    p_day_key: content.day,
    p_content: content,
    p_content_version: content.contentVersion
  }), "Start hosted live lesson");
  assert(started?.ok === true && started.session?.id, "Hosted live lesson did not start.");
  sessionId = started.session.id;

  const moved = unwrap(await teacher.rpc("teacher_set_live_lesson_slide", {
    p_session_id: sessionId,
    p_slide_index: prompt.slideIndex,
    p_client_event_id: `slide-${suffix}`
  }), "Move hosted live lesson");
  assert(moved?.ok === true && moved.current_prompt_id === prompt.id, "Hosted slide did not bind its prompt.");

  const childView = unwrap(await anon.rpc("student_get_live_lesson", {
    p_token: login.token,
    p_slide_index: prompt.slideIndex,
    p_content_ok: true
  }), "Read hosted child prompt");
  assert(childView?.ok === true && childView.session?.prompt?.id === prompt.id, "Child did not receive the current prompt.");
  assert(!Object.hasOwn(childView.session.prompt, "answer"), "Child prompt exposed its answer.");
  assert(childView.session.prompt.evidencePurpose === "diagnostic_not_mastery", "Child prompt lost its diagnostic label.");

  const response = prompt.kind === "arrange_tiles" ? prompt.answer.split("") : prompt.answer;
  const submitted = unwrap(await anon.rpc("student_submit_live_response", {
    p_token: login.token,
    p_session_id: sessionId,
    p_prompt_id: prompt.id,
    p_response: response,
    p_client_event_id: `response-${suffix}`
  }), "Submit hosted child response");
  assert(submitted?.ok === true && submitted.submitted === true, "Child response was not acknowledged.");
  assert(!Object.hasOwn(submitted, "is_correct"), "Child response acknowledgement exposed correctness.");

  const snapshot = unwrap(await teacher.rpc("teacher_get_live_lesson_snapshot", {
    p_session_id: sessionId
  }), "Read hosted teacher snapshot");
  assert(snapshot?.ok === true && snapshot.students?.[0]?.responded === true, "Teacher snapshot did not show the response.");
  assert(snapshot.students[0].is_correct === true, "Teacher-private diagnostic correctness was wrong.");
  assert(snapshot.students[0].connected === true, "Hosted learner presence was not current.");

  const recovered = unwrap(await teacher.rpc("teacher_get_active_live_lesson"), "Recover hosted live lesson");
  assert(recovered?.ok === true && recovered.session?.id === sessionId, "Teacher refresh recovery did not return the active lesson.");

  const exported = unwrap(await teacher.rpc("teacher_export_learner_data", {
    p_student_id: studentId,
    p_requester_role: "school",
    p_verification_method: "authorised_school_official"
  }), "Export hosted learner data");
  assert(exported?.liveLessonParticipation?.length === 1, "Learner export omitted live participation.");
  assert(exported?.liveLessonResponses?.length === 1, "Learner export omitted the live response.");
  const exportedResponse = unwrapSingletonArrays(exported.liveLessonResponses);
  const exportedEvidencePurpose = exportedResponse?.evidence_purpose
    ?? exportedResponse?.evidencePurpose;
  assert(
    exportedEvidencePurpose === "diagnostic_not_mastery",
    `Export lost the diagnostic evidence label (shape: ${JSON.stringify(exported.liveLessonResponses)}).`
  );

  const ended = unwrap(await teacher.rpc("teacher_end_live_lesson", { p_session_id: sessionId }), "End hosted live lesson");
  assert(ended?.ok === true && ended.status === "ended", "Hosted live lesson did not end.");

  const childAfterEnd = unwrap(await anon.rpc("student_get_live_lesson", {
    p_token: login.token,
    p_slide_index: null,
    p_content_ok: true
  }), "Check child view after end");
  assert(childAfterEnd?.ok === true && childAfterEnd.session === null, "Ended lesson remained visible to the child.");

  const lessonRegistry = buildLessonComponentRegistry({ cycleId: "cycle-3", targetKey: "grapheme:n", durationMinutes: 12 });
  const lessonRecipe = createLessonRecipe({
    recipeId: `hosted-lesson-${suffix}`,
    durationMinutes: 12,
    cycleId: "cycle-3",
    targetKey: "grapheme:n",
    learnerIds: [studentId],
    componentIds: Object.values(lessonRegistry.components).map(({ id, role }) => ({ id, role })),
    contentVersion: lessonRegistry.contentVersion
  });
  const planCreated = unwrap(await teacher.rpc("teacher_create_lesson_plan", {
    p_class_id: classId,
    p_intervention_id: null,
    p_learner_ids: [studentId],
    p_recipe: lessonRecipe,
    p_evidence_source: { kind: "teacher_selected", limitations: "No automatic diagnosis or mastery update." },
    p_scheduled_for: null
  }), "Create hosted lesson plan");
  assert(planCreated?.ok === true && planCreated.plan_id, "Hosted lesson plan was not saved.");
  lessonPlanId = planCreated.plan_id;

  const planRead = unwrap(await teacher.rpc("teacher_read_lesson_plan", { p_plan_id: lessonPlanId }), "Read hosted lesson plan");
  assert(planRead?.ok === true && planRead.plan?.recipe?.learnerIds?.includes(studentId), "Hosted plan did not reconstruct its learner group.");
  assert(!Object.hasOwn(planRead.plan.recipe, "learnerIds") || planRead.plan.recipe.learnerIds.length === 1, "Hosted recipe learner group was malformed.");

  const delivery = unwrap(await teacher.rpc("teacher_record_lesson_delivery", {
    p_plan_id: lessonPlanId,
    p_client_event_id: `lesson-delivery-${suffix}`,
    p_learner_ids: [studentId],
    p_completion_state: "delivered",
    p_notes: "Audit-only delivery",
    p_observed_support: { status: "independent" }
  }), "Record hosted lesson delivery");
  assert(delivery?.ok === true && delivery.evidence_purpose === "practice", "Hosted lesson delivery lost its practice evidence label.");

  const lessonExport = unwrap(await teacher.rpc("teacher_export_learner_data", {
    p_student_id: studentId,
    p_requester_role: "school",
    p_verification_method: "authorised_school_official"
  }), "Export hosted lesson-plan evidence");
  assert(lessonExport?.smallGroupLessonPlans?.length === 1, "Learner export omitted the small-group lesson plan.");
  assert(lessonExport?.smallGroupLessonDeliveries?.length === 1, "Learner export omitted the lesson delivery.");
  assert(lessonExport.smallGroupLessonDeliveries[0].evidencePurpose === "practice", "Lesson export lost the practice evidence label.");

  const immutable = unwrap(await teacher.rpc("teacher_update_draft_lesson_plan", {
    p_plan_id: lessonPlanId,
    p_expected_revision: 1,
    p_learner_ids: [studentId],
    p_recipe: lessonRecipe,
    p_scheduled_for: null
  }), "Check delivered lesson immutability");
  assert(immutable?.ok === false && immutable.error === "plan_immutable", "A delivered hosted lesson remained editable.");

  const worksheetRecipe = buildWorksheetInstanceRecipe({ cycleId: "cycle-3", type: "wordBuilding", pages: 1 });
  const worksheetCreated = unwrap(await teacher.rpc("teacher_create_worksheet_instance", { p_class_id: classId, p_learner_ids: [studentId], p_recipe: worksheetRecipe }), "Create hosted tracked worksheet");
  assert(worksheetCreated?.ok === true && worksheetCreated.lookup_token && worksheetCreated.short_code, "Hosted tracked worksheet did not return its one-time lookup details.");
  worksheetInstanceId = worksheetCreated.instance_id;
  assert(!JSON.stringify(worksheetCreated).includes("Audit Learner"), "Tracked worksheet lookup details exposed a learner name.");
  const worksheetResolved = unwrap(await teacher.rpc("teacher_resolve_worksheet_code", { p_code: worksheetCreated.lookup_token }), "Resolve hosted tracked worksheet");
  assert(worksheetResolved?.ok === true && worksheetResolved.instance?.id === worksheetInstanceId, "Hosted worksheet token did not resolve for its teacher.");
  const targetKeys = worksheetRecipe.targets.map(target => target.targetKey);
  const worksheetMarks = createBlankWorksheetMarks([studentId], targetKeys);
  worksheetMarks[0] = { ...worksheetMarks[0], state: "independent" };
  const firstBatch = unwrap(await teacher.rpc("teacher_record_worksheet_observation", { p_instance_id: worksheetInstanceId, p_client_event_id: `worksheet-1-${suffix}`, p_marks: worksheetMarks, p_note: "Audit observation", p_supersedes_batch_id: null }), "Save hosted worksheet observations");
  assert(firstBatch?.ok === true && firstBatch.revision === 1 && firstBatch.evidence_purpose === "practice", "Hosted worksheet observations lost their practice contract.");
  const correctionMarks = worksheetMarks.map((mark, index) => index === 0 ? { ...mark, state: "supported" } : mark);
  const correction = unwrap(await teacher.rpc("teacher_record_worksheet_observation", { p_instance_id: worksheetInstanceId, p_client_event_id: `worksheet-2-${suffix}`, p_marks: correctionMarks, p_note: "Audit correction", p_supersedes_batch_id: firstBatch.batch_id }), "Save hosted worksheet correction");
  assert(correction?.ok === true && correction.revision === 2, "Hosted worksheet correction did not create a new revision.");
  const worksheetHistory = unwrap(await teacher.rpc("teacher_read_worksheet_history", { p_instance_id: worksheetInstanceId }), "Read hosted worksheet history");
  assert(worksheetHistory?.batches?.length === 2 && worksheetHistory.batches[1].supersedes_batch_id === firstBatch.batch_id, "Hosted worksheet history lost its immutable correction chain.");
  const worksheetExport = unwrap(await teacher.rpc("teacher_export_learner_data", { p_student_id: studentId, p_requester_role: "school", p_verification_method: "authorised_school_official" }), "Export hosted worksheet evidence");
  assert(worksheetExport?.paperWorksheetInstances?.length === 1, "Learner export omitted the tracked worksheet instance.");
  assert(worksheetExport?.paperWorksheetObservations?.length === worksheetMarks.length * 2, "Learner export omitted worksheet revision marks.");
  assert(worksheetExport.paperWorksheetObservations.every(mark => mark.evidencePurpose === "practice"), "Worksheet export lost its practice evidence labels.");
  const worksheetClosed = unwrap(await teacher.rpc("teacher_close_worksheet_instance", { p_instance_id: worksheetInstanceId }), "Close hosted tracked worksheet");
  assert(worksheetClosed?.ok === true && worksheetClosed.status === "closed", "Hosted tracked worksheet did not close.");
  const saveAfterClose = unwrap(await teacher.rpc("teacher_record_worksheet_observation", { p_instance_id: worksheetInstanceId, p_client_event_id: `worksheet-closed-${suffix}`, p_marks: worksheetMarks, p_note: "", p_supersedes_batch_id: correction.batch_id }), "Reject observations after close");
  assert(saveAfterClose?.ok === false && saveAfterClose.error === "worksheet_closed", "A closed hosted worksheet accepted new observations.");

  const pressTemplate = PRESS_PROJECT_TEMPLATES[0];
  const pressBank = getPressWordBank(3);
  const pressRules = {
    title: pressTemplate.title,
    projectTitle: pressTemplate.title,
    templateId: pressTemplate.id,
    templateVersion: pressTemplate.version,
    templateDescription: pressTemplate.description,
    pagePrompts: pressTemplate.pagePrompts,
    wordBankId: pressBank.id,
    wordBankVersion: pressBank.version,
    words: pressBank.words,
    highFrequencyWords: pressBank.highFrequencyWords,
    assetIds: PRESS_ASSETS.map(asset => asset.id),
    contentVersion: 1,
    allowClassLibrary: true,
    deadline: ""
  };
  const pressCreated = unwrap(await teacher.rpc("teacher_create_press_project", { p_class_id: classId, p_learner_ids: [studentId], p_project_rules: pressRules }), "Create hosted press project");
  assert(pressCreated?.ok === true && pressCreated.project?.id && pressCreated.assigned_count === 1, "Hosted press project was not assigned.");
  pressProjectId = pressCreated.project.id;
  const childProjects = unwrap(await anon.rpc("student_list_press_projects", { p_token: login.token }), "Read hosted child press projects");
  assert(childProjects?.ok === true && childProjects.projects?.length === 1 && childProjects.projects[0].book === null, "Assigned press project was not privately visible to its learner.");
  const pressPages = pressTemplate.pagePrompts.map((pagePrompt, index) => ({ pageNumber: index + 1, promptId: pagePrompt.id, text: ["The cat is at the mat.", "But it is wet.", "The cat did dig. It did not fit.", "Then the cat sat on the mat."][index], assetId: PRESS_ASSETS[index].id }));
  const pressBook = { title: "The wet mat", planner: { character: "cat", goal: "sit on the mat", obstacle: "the mat is wet", changedAction: "dig a dry spot" }, pages: pressPages };
  const pressValidation = { purpose: "writing_support_not_assessment", pages: pressPages.map(page => analyzeSentenceDecodability({ sentence: page.text, decodableWords: pressBank.words, knownHighFrequencyWords: pressBank.highFrequencyWords })) };
  const pressSaved = unwrap(await anon.rpc("student_save_book_revision", { p_token: login.token, p_project_id: pressProjectId, p_book_id: null, p_client_event_id: `press-save-${suffix}`, p_book: pressBook, p_validation: pressValidation }), "Save hosted press revision");
  assert(pressSaved?.ok === true && pressSaved.revision === 1 && pressSaved.revision_id, "Hosted press revision was not saved append-only.");
  pressBookId = pressSaved.book_id;
  const pressSubmitted = unwrap(await anon.rpc("student_submit_book_revision", { p_token: login.token, p_book_id: pressBookId, p_revision_id: pressSaved.revision_id }), "Submit hosted press revision");
  assert(pressSubmitted?.ok === true && pressSubmitted.status === "submitted", "Hosted press revision was not submitted.");
  const editWhileSubmitted = unwrap(await anon.rpc("student_save_book_revision", { p_token: login.token, p_project_id: pressProjectId, p_book_id: pressBookId, p_client_event_id: `press-locked-${suffix}`, p_book: pressBook, p_validation: pressValidation }), "Reject edit while press revision is submitted");
  assert(editWhileSubmitted?.ok === false && editWhileSubmitted.error === "book_not_editable", "A submitted press revision remained editable.");
  const pressQueue = unwrap(await teacher.rpc("teacher_list_press_work", { p_class_id: classId }), "Read hosted press review queue");
  assert(pressQueue?.ok === true && pressQueue.books?.[0]?.current_revision_id === pressSaved.revision_id, "Teacher press queue did not bind the exact revision.");
  const staleReview = unwrap(await teacher.rpc("teacher_review_book_revision", { p_book_id: pressBookId, p_revision_id: crypto.randomUUID(), p_decision: "approved", p_review: { childFeedback: "", approvedChallenges: [], allowClassLibrary: true } }), "Reject stale press review");
  assert(staleReview?.ok === false && staleReview.error === "stale_or_unsubmitted_revision", "A stale press revision could be approved.");
  const pressApproved = unwrap(await teacher.rpc("teacher_review_book_revision", { p_book_id: pressBookId, p_revision_id: pressSaved.revision_id, p_decision: "approved", p_review: { childFeedback: "Your changed plan makes the ending work.", approvedChallenges: [], allowClassLibrary: true } }), "Approve exact hosted press revision");
  assert(pressApproved?.ok === true && pressApproved.status === "approved_class" && pressApproved.approved_revision_id === pressSaved.revision_id, "Exact hosted press approval did not freeze class visibility.");
  const classPress = unwrap(await anon.rpc("student_read_class_press_library", { p_token: login.token }), "Read hosted class press library");
  assert(classPress?.ok === true && classPress.books?.length === 1 && classPress.books[0].revision_id === pressSaved.revision_id, "Approved exact revision did not appear in the private class library.");
  const wrongEmail = `press-wrong-teacher-${suffix}@example.invalid`;
  const wrongPassword = `${crypto.randomUUID()}Aa1!`;
  const wrongCreated = unwrap(await service.auth.admin.createUser({ email: wrongEmail, password: wrongPassword, email_confirm: true, user_metadata: { audit_only: true, feature: "decodable_press_wrong_teacher" } }), "Create unrelated audit teacher");
  wrongTeacherUserId = wrongCreated.user.id;
  unwrap(await service.from("app_admins").insert({ user_id: wrongTeacherUserId, email: wrongEmail }), "Grant unrelated audit access");
  const wrongSignedIn = unwrap(await anon.auth.signInWithPassword({ email: wrongEmail, password: wrongPassword }), "Sign in unrelated audit teacher");
  const wrongTeacher = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${wrongSignedIn.session.access_token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const copiedClass = unwrap(await wrongTeacher.rpc("teacher_list_press_work", { p_class_id: classId }), "Reject copied class press id");
  assert(copiedClass?.ok === false && copiedClass.error === "class_not_found", "An unrelated teacher could list copied class press work.");
  const copiedBook = unwrap(await wrongTeacher.rpc("teacher_review_book_revision", { p_book_id: pressBookId, p_revision_id: pressSaved.revision_id, p_decision: "approved", p_review: { childFeedback: "", approvedChallenges: [], allowClassLibrary: true } }), "Reject copied press book id");
  assert(copiedBook?.ok === false && copiedBook.error === "book_not_found", "An unrelated teacher could review a copied press book id.");
  const pressExport = unwrap(await teacher.rpc("teacher_export_learner_data", { p_student_id: studentId, p_requester_role: "school", p_verification_method: "authorised_school_official" }), "Export hosted press data");
  assert(pressExport?.decodablePressAssignments?.length === 1 && pressExport?.decodablePressBooks?.length === 1 && pressExport?.decodablePressRevisions?.length === 1 && pressExport?.decodablePressReviews?.length === 1, "Learner export omitted Decodable Press history.");

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "teacher start and slide sync",
      "child-safe prompt",
      "child-safe acknowledgement",
      "teacher-private diagnostic snapshot",
      "active-session recovery",
      "learner data export",
      "lesson end",
      "lesson plan save and read",
      "practice-labelled immutable delivery",
      "lesson-plan learner export",
      "tracked worksheet create and private resolve",
      "honest practice marks and immutable correction",
      "paper worksheet learner export",
      "closed worksheet write rejection",
      "private press assignment and child draft",
      "submitted revision lock and stale-review rejection",
      "exact-revision class-library publication",
      "wrong-teacher class and book isolation",
      "decodable press learner export"
    ]
  }));
} finally {
  if (userId) {
    const { error } = await service.auth.admin.deleteUser(userId);
    if (error) {
      console.error(`Delete audit teacher: ${error.message}`);
      process.exitCode = 1;
    }
  }
  if (wrongTeacherUserId) {
    const { error } = await service.auth.admin.deleteUser(wrongTeacherUserId);
    if (error) {
      console.error(`Delete unrelated audit teacher: ${error.message}`);
      process.exitCode = 1;
    }
  }
  if (schoolId) {
    const { error } = await service.from("schools").delete().eq("id", schoolId);
    if (error) {
      console.error(`Delete audit school: ${error.message}`);
      process.exitCode = 1;
    }
  }
  await assertRemoved("live_lesson_sessions", "id", sessionId);
  await assertRemoved("students", "id", studentId);
  await assertRemoved("classes", "id", classId);
  await assertRemoved("schools", "id", schoolId);
  await assertRemoved("teacher_lesson_plans", "id", lessonPlanId);
  await assertRemoved("worksheet_instances", "id", worksheetInstanceId);
  await assertRemoved("student_book_projects", "id", pressProjectId);
  await assertRemoved("student_books", "id", pressBookId);
}
