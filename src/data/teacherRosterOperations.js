import {
  isLegacyStudentSchemaError,
  isMissingRpcOverload
} from "./classApiCompatibility.js";
import {
  LEARNER_DELETION_CONFIRMATION,
  buildLearnerLocalCleanupProof,
  completeLearnerDeletion,
  deleteLearnerData,
  findPendingLearnerDeletion,
  loadLearnerDeletionStatus,
  prepareLearnerDeletion
} from "./learnerDataRights.js";

const ARCHIVE_RPC = "teacher_set_student_archived";

// One roster removal, one deletion path. The privacy workflow already owns the
// only code that erases a child from the managed database, so the everyday
// "I typed the name wrong" removal routes through exactly that RPC rather than
// growing a second, less audited way to delete a student.
export const ROSTER_DELETION_REQUESTER_ROLE = "school";
export const ROSTER_DELETION_VERIFICATION_METHOD = "authorised_school_official";

const OPERATION_VERBS = Object.freeze({
  archive: "archive",
  restore: "restore",
  transfer: "move",
  delete: "delete"
});

function errorText(error) {
  return [
    error?.message,
    error?.details,
    error?.hint,
    error?.cause?.message
  ].filter(Boolean).join(" ");
}

/**
 * The mock client substituted when the frontend has no database address or key
 * fails every write with this message. Recognising it is the difference between
 * a teacher seeing "try again" forever and being told the site was never
 * connected to a database in the first place.
 */
export function isUnconfiguredBackendError(error) {
  return /supabase is not configured/i.test(errorText(error));
}

export function isNetworkError(error) {
  return /failed to fetch|networkerror|network error|load failed|fetch failed|timed? out/i
    .test(errorText(error));
}

function missingArchiveRpc(error) {
  if (!error) return false;
  // PostgREST answers a call for a function it cannot see with PGRST202. Only
  // one function is called here, so the code alone identifies it, and the
  // name check stays as the documented, readable case.
  return error.code === "PGRST202" || isMissingRpcOverload(error, ARCHIVE_RPC);
}

function noRowsChangedError(verb) {
  return {
    code: "LP_ROSTER_NO_ROWS",
    message: `No student row was changed by this ${verb}.`
  };
}

function settle(result, verb) {
  if (result?.error) return result;
  const rows = Array.isArray(result?.data) ? result.data : (result?.data ? [result.data] : []);
  if (rows.length) return result;
  return { data: result?.data ?? null, error: noRowsChangedError(verb) };
}

/**
 * Turn any failure of a roster change into one plain sentence a teacher can act
 * on. Every branch names what did NOT happen, so a silent no-op can never look
 * like success again.
 */
export function describeRosterOperationError(error, {
  operation = "archive",
  studentName = "that student"
} = {}) {
  const verb = OPERATION_VERBS[operation] || String(operation || "change");
  const name = String(studentName || "that student").trim() || "that student";
  const failed = `We could not ${verb} ${name}.`;

  if (!error) return `${failed} Nothing was changed. Try again.`;

  if (isUnconfiguredBackendError(error)) {
    return `${failed} This copy of the app is not connected to its database, so nothing you change here is being saved. Ask whoever set up the site to add the database address and key, then reload.`;
  }
  if (isNetworkError(error)) {
    return `${failed} We could not reach the server, so nothing was changed. Check the internet connection and try again.`;
  }
  if (error.code === "PGRST202") {
    return `${failed} This site's database is missing a pending update, so the ${verb} could not run. Nothing was changed. Ask whoever manages the database to apply the pending updates, then try again.`;
  }
  if (error.code === "LP_ARCHIVE_UNSUPPORTED" || isLegacyStudentSchemaError(error)) {
    return `${failed} This site's database has not been updated to store archived students yet. Nothing was changed. Ask whoever manages the database to apply the pending updates, then try again.`;
  }
  if (error.code === "42501" || /permission|not authoris|not authoriz/i.test(errorText(error))) {
    return `${failed} This account does not have permission to change ${name}. Sign in again with the teacher account that owns this class, then try again.`;
  }
  if (error.code === "LP_ROSTER_NO_ROWS" || error.code === "P0002" || error.code === "PGRST116") {
    return `${failed} ${name} was not found in this class, so nothing was changed. Someone may have already changed the roster on another device. Reload the page to see who is in the class now.`;
  }
  if (
    operation === "transfer"
    && (error.code === "LP_INVALID_TRANSFER_TARGET" || error.code === "22023")
  ) {
    return `${failed} Choose a different class from this account and try again. Nothing was changed.`;
  }
  if (
    error.code === "LP_LOCAL_CLEANUP_REQUIRED"
    || error.code === "LP_LOCAL_CLEANUP_INCOMPLETE"
    || error.code === "LP_DELETION_MARKER_CLEANUP_FAILED"
    || error.databaseDeleted
  ) {
    return `The saved records for ${name} were removed, but this browser has not finished clearing its local copy. Keep this browser open and choose “Finish cleanup” or delete ${name} again. The privacy request will stay open until that check succeeds.`;
  }
  // Deliberately no raw database prose. A teacher cannot act on "Could not find
  // the function public.teacher_prepare_learner_deletion(p_requester_role,
  // p_student_id, p_verification_method) in the schema cache" — that sentence
  // shipped to a real teacher and made a routine missing-migration look like a
  // broken app.
  //
  // The failure must still be diagnosable, so the short error CODE is kept as a
  // reference the teacher can read aloud or paste into a message. The full text
  // goes to the console for whoever can use it.
  const reference = String(error.code || "").trim();
  return reference
    ? `${failed} Nothing was changed. Try again, and if it keeps happening tell whoever manages the site and quote reference ${reference}.`
    : `${failed} Nothing was changed. Try again, and if it keeps happening tell whoever manages the site.`;
}


export function normalizeRosterStudentName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function invalidRosterInputError(message, code = "LP_INVALID_ROSTER_IMPORT") {
  return {
    data: null,
    error: { code, message }
  };
}

/**
 * Review a pasted or uploaded roster without silently changing the batch.
 * Archived names are kept separate from active duplicates so the teacher is
 * directed to restore the existing learner rather than creating a second row.
 */
export function reviewRosterImportNames(
  names,
  { activeRows = [], archivedRows = [] } = {}
) {
  const keyFor = value => normalizeRosterStudentName(value).toLowerCase();
  const activeNames = new Set(activeRows.map(row => keyFor(row?.name)).filter(Boolean));
  const archivedNames = new Set(archivedRows.map(row => keyFor(row?.name)).filter(Boolean));
  const seenNames = new Set();
  const accepted = [];
  const skipped = [];

  for (const rawName of Array.isArray(names) ? names : []) {
    const name = normalizeRosterStudentName(rawName);
    if (!name) continue;
    const key = keyFor(name);
    if (name.length > 80) {
      skipped.push({ name, reason: "Display names must be 80 characters or fewer" });
    } else if (activeNames.has(key)) {
      skipped.push({ name, reason: "Already in this class" });
    } else if (archivedNames.has(key)) {
      skipped.push({ name, reason: "Already archived — restore this student instead" });
    } else if (seenNames.has(key)) {
      skipped.push({ name, reason: "Repeated in this import" });
    } else {
      seenNames.add(key);
      accepted.push(name);
    }
  }

  return {
    total: accepted.length + skipped.length,
    accepted,
    skipped
  };
}

export async function insertRosterStudents({
  supabase,
  names,
  classId,
  teacherId
}) {
  if (!classId || !teacherId) {
    return invalidRosterInputError("Choose a class before importing students.");
  }
  if (!Array.isArray(names) || names.length === 0 || names.length > 40) {
    return invalidRosterInputError("Import between 1 and 40 students at a time.");
  }
  const normalizedNames = names.map(normalizeRosterStudentName);
  if (normalizedNames.some(name => !name || name.length > 80)) {
    return invalidRosterInputError("Every display name must be between 1 and 80 characters.");
  }
  const normalizedKeys = normalizedNames.map(name => name.toLowerCase());
  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return invalidRosterInputError("The import contains repeated display names.");
  }
  return supabase
    .table("students")
    .insert(normalizedNames.map(name => ({
      name,
      class_id: classId,
      teacher_id: teacherId
    })));
}

/**
 * Archive or restore one student.
 *
 * The owned RPC is the only archive boundary. A frontend-first rolling release
 * must fail closed when that RPC is unavailable: a direct table update cannot
 * prove that every learner session was revoked, so it must never be treated as
 * a safe archive.
 */
export async function setRosterStudentArchived({
  supabase,
  studentId,
  classId,
  archived
}) {
  const verb = archived ? "archive" : "restore";
  const rpcResult = await supabase.call(ARCHIVE_RPC, {
    p_student_id: studentId,
    p_class_id: classId,
    p_archived: Boolean(archived)
  });
  if (!missingArchiveRpc(rpcResult.error)) return settle(rpcResult, verb);

  return {
    data: null,
    error: {
      code: "LP_ARCHIVE_UNSUPPORTED",
      message: "The verified archive function is not available. No roster row or learner session was changed.",
      cause: rpcResult.error
    }
  };
}

/**
 * Permanently remove one student, reusing the verified data-rights deletion
 * exactly as the privacy dialog does. Nothing here is a second delete path:
 * the same prepare-then-delete RPC pair runs, so the same audit record, the
 * same ownership checks and the same residual-record proof still apply.
 *
 * Throws on failure; pass the thrown error to describeRosterOperationError.
 */
export async function deleteRosterStudent({
  supabase,
  studentId,
  studentName = "",
  accountId = "",
  cleanup,
  storage
}) {
  if (typeof cleanup !== "function") {
    const error = new Error(
      "A verified local cleanup step is required before permanent deletion can be completed."
    );
    error.code = "LP_LOCAL_CLEANUP_REQUIRED";
    throw error;
  }

  let prepared = findPendingLearnerDeletion({
    accountId,
    studentId,
    storage
  });
  let databaseResult = null;

  if (prepared) {
    try {
      const status = await loadLearnerDeletionStatus({
        client: supabase,
        preparedRequest: prepared
      });
      if (status.databaseDeleted || status.status === "completed") {
        databaseResult = status;
      } else if (prepared.phase === "database_deleted") {
        const error = new Error(
          "The browser and database disagree about the deletion phase. The request was left open."
        );
        error.code = "LP_DELETION_STATUS_CONFLICT";
        throw error;
      }
    } catch (error) {
      // A durable database-deleted marker means the destructive phase already
      // returned successfully. If its status probe is temporarily offline, it
      // remains safe to repeat local cleanup and the idempotent completion RPC.
      // A merely prepared marker is not enough evidence to retry deletion.
      if (prepared.phase !== "database_deleted" && prepared.phase !== "completed") {
        throw error;
      }
    }
  } else {
    prepared = await prepareLearnerDeletion({
      client: supabase,
      studentId,
      requesterRole: ROSTER_DELETION_REQUESTER_ROLE,
      verificationMethod: ROSTER_DELETION_VERIFICATION_METHOD
    });
  }

  if (!databaseResult) {
    databaseResult = await deleteLearnerData({
      client: supabase,
      studentId,
      preparedRequest: prepared,
      confirmation: LEARNER_DELETION_CONFIRMATION,
      studentName,
      accountId,
      storage
    });
  }

  let localCleanupProof;
  try {
    const cleanupResult = await cleanup({
      studentId,
      studentName,
      preparedRequest: prepared,
      databaseResult
    });
    localCleanupProof = buildLearnerLocalCleanupProof({
      preparedRequest: prepared,
      studentId,
      progressCleanup: cleanupResult?.progressCleanup,
      evidenceCleanup: cleanupResult?.evidenceCleanup
    });
  } catch (source) {
    const error = source instanceof Error
      ? source
      : new Error("The browser-local learner cleanup did not finish.");
    if (!error.code) error.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    error.databaseDeleted = true;
    error.preparedRequest = prepared;
    throw error;
  }

  try {
    return await completeLearnerDeletion({
      client: supabase,
      preparedRequest: prepared,
      localCleanupProof,
      storage
    });
  } catch (source) {
    const error = source instanceof Error
      ? source
      : new Error("The verified deletion request could not be completed.");
    error.databaseDeleted = true;
    error.preparedRequest = prepared;
    throw error;
  }
}

/**
 * Two children in one class really can share a first name, so a repeated name
 * is a warning and never a block. The check covers archived students too: a
 * name that only collides with an archived row is worth flagging, because
 * restoring is nearly always what the teacher meant.
 */
export function findDuplicateRosterName(name, rows = []) {
  const key = normalizeRosterStudentName(name).toLowerCase();
  if (!key) return null;
  return rows.find(row => normalizeRosterStudentName(row?.name).toLowerCase() === key) || null;
}

export async function updateRosterStudentName({
  supabase,
  studentId,
  classId,
  name
}) {
  const normalizedName = normalizeRosterStudentName(name);
  if (!normalizedName) {
    return {
      data: null,
      error: {
        code: "LP_INVALID_STUDENT_NAME",
        message: "Enter a display name."
      }
    };
  }
  if (normalizedName.length > 80) {
    return {
      data: null,
      error: {
        code: "LP_INVALID_STUDENT_NAME",
        message: "Display names must be 80 characters or fewer."
      }
    };
  }
  return supabase
    .table("students")
    .update({ name: normalizedName })
    .eq("id", studentId)
    .eq("class_id", classId)
    .select("id,name,class_id");
}

export async function transferRosterStudent({
  supabase,
  studentId,
  sourceClassId,
  targetClassId
}) {
  if (
    !studentId
    || !sourceClassId
    || !targetClassId
    || sourceClassId === targetClassId
  ) {
    return {
      data: null,
      error: {
        code: "LP_INVALID_TRANSFER_TARGET",
        message: "Choose a different destination class."
      }
    };
  }
  const result = await supabase.call("teacher_transfer_student", {
    p_student_id: studentId,
    p_source_class_id: sourceClassId,
    p_target_class_id: targetClassId
  });
  return settle(result, "transfer");
}
