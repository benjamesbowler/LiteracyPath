const TABLES = new Set(
  "activity_sync_health answers app_admins app_config assessment_attempts assessment_question_reports assessment_sessions classes el_assessment_reports entitlements guided_reading_book_reviews item_mastery mastery pending_teacher_accounts reading_sessions schools student_book_project_learners student_book_projects student_book_reviews student_book_revisions student_books student_progress students teacher_account_decision_events teacher_instructional_group_reviews teacher_instructional_groups teacher_intervention_events teacher_interventions teacher_lesson_delivery_students teacher_lesson_plan_deliveries teacher_lesson_plan_students teacher_lesson_plans worksheet_bank worksheet_instance_students worksheet_instances worksheet_observation_batches worksheet_observation_marks".split(" ")
);
const RPCS = new Set(
  "admin_error_monitor_summary admin_get_school_retention_policy admin_list_deletion_propagation admin_preview_school_retention admin_recent_error_events admin_review_assessment_question_report admin_run_school_retention admin_save_school_retention_policy admin_set_teacher_account_status admin_verify_deletion_propagation find_or_create_school get_game_leaderboard report_app_error report_assessment_question search_school_names set_app_config student_class_by_code student_complete_maths_assignment student_get_live_lesson student_get_progress student_get_reading_session student_list_maths_assignments student_list_press_projects student_log_activity_v2 student_login student_read_class_press_library student_record_maths_evidence student_report_activity_sync_health student_save_book_revision student_save_progress student_submit_book_revision student_submit_live_response teacher_assign_instructional_group_follow_up teacher_cancel_intervention teacher_class_access_log teacher_class_access_summary teacher_close_worksheet_instance teacher_complete_learner_deletion teacher_create_demo_class teacher_create_insight_intervention teacher_create_intervention_follow_up teacher_create_intervention_plan teacher_create_lesson_plan teacher_create_maths_assignment teacher_create_press_project teacher_create_worksheet_instance teacher_delete_empty_class teacher_delete_learner_data_staged teacher_delete_planned_intervention teacher_delete_saved_assessment_report teacher_end_live_lesson teacher_end_reading_session teacher_export_learner_data teacher_get_active_live_lesson teacher_get_learner_deletion_status teacher_get_live_lesson_snapshot teacher_get_reading_session_presence teacher_list_learner_data_rights teacher_list_maths_assignments teacher_list_press_work teacher_mark_intervention_delivered teacher_prepare_learner_deletion teacher_read_lesson_plan teacher_read_maths_evidence teacher_read_worksheet_history teacher_record_insight_observation teacher_record_intervention_outcome teacher_record_lesson_delivery teacher_record_maths_evidence teacher_record_worksheet_observation teacher_regenerate_class_code teacher_reset_student_progress teacher_resolve_worksheet_code teacher_review_book_revision teacher_review_instructional_group teacher_review_intervention teacher_save_instructional_group teacher_save_reading_marks teacher_set_class_code_expiry teacher_set_class_leaderboard_scope teacher_set_live_lesson_slide teacher_set_reading_session_page teacher_set_school teacher_set_student_archived teacher_set_student_symbol_password teacher_start_live_lesson teacher_start_reading_session teacher_transfer_student teacher_update_draft_lesson_plan teacher_update_planned_intervention".split(" ")
);

// Properties the JavaScript engine, `await`, and devtools may probe on any
// object. Reading them must never throw, or the client stops being inspectable.
const ENGINE_PROBES = new Set([
  "then", "catch", "finally", "constructor", "toJSON", "inspect", "nodeType"
]);

export const FACADE_TABLES = Object.freeze([...TABLES].sort());
export const FACADE_RPCS = Object.freeze([...RPCS].sort());

let validatorPromise = null;
function loadValidators() {
  if (!validatorPromise) {
    validatorPromise = Promise.all([
      import("./client.js"),
      import("./auth.js")
    ]);
  }
  return validatorPromise;
}

function validateResponse(kind, resource, result) {
  return loadValidators().then(([client]) => client.validateSupabaseResponse(kind, resource, result));
}

function wrapQuery(query, kind, resource) {
  return new Proxy(query, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (property === "then") {
        return (resolve, reject) => value.call(
          target,
          result => validateResponse(kind, resource, result)
        ).then(resolve, reject);
      }
      if (typeof value !== "function") return value;
      return (...args) => {
        const next = value.apply(target, args);
        return next && typeof next.then === "function"
          ? wrapQuery(next, kind, resource)
          : next;
      };
    }
  });
}

function wrapAuth(auth) {
  return new Proxy(auth, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      if (property === "onAuthStateChange") {
        return callback => value.call(target, (event, session) => {
          if (session !== null && (typeof session !== "object" || Array.isArray(session))) {
            throw new TypeError("auth.session must be an object.");
          }
          if (session?.user?.id !== undefined && typeof session.user.id !== "string") {
            throw new TypeError("auth.session.user.id must be a string.");
          }
          callback(event, session);
        });
      }
      return (...args) => {
        const result = value.apply(target, args);
        return result && typeof result.then === "function"
          ? result.then(response => loadValidators().then(([, authBoundary]) => (
              authBoundary.validateAuthResponse(response, `auth.${String(property)}`)
            )))
          : result;
      };
    }
  });
}

/**
 * Keep the raw SDK object private and expose only registered, response-checked
 * table, RPC, and authentication operations.
 *
 * @template {object} T
 * @param {T} rawClient
 * @returns {T}
 */
/**
 * EPHEMERAL MODE. When on, this client reaches the network for nothing at all.
 *
 * The anonymous try-mode's entire legal basis is that it collects nothing from
 * a child. Because every Supabase call in the application passes through the
 * Proxy below — enforced by tools/checkSupabaseDomainBoundaries.mjs, which
 * fails the build on any raw `.from(` or `.rpc(` elsewhere — one refusal here
 * covers the whole surface, including features written long after this.
 *
 * It THROWS rather than quietly returning nothing. A silent no-op would let a
 * caller believe a write succeeded, and the failure would surface later as data
 * that mysteriously vanished. A loud throw in development is exactly what stops
 * someone wiring a persistent feature into a mode that must not persist.
 */
let ephemeralMode = false;

export function setEphemeralNetworkMode(enabled) {
  ephemeralMode = Boolean(enabled);
}

export function isEphemeralNetworkMode() {
  return ephemeralMode;
}

function refuseInEphemeralMode(kind, name) {
  throw new Error(
    `Ephemeral session: refused ${kind} "${name}". This mode stores and sends nothing — `
    + "no account, no identifier, no row. A feature that needs the network does not "
    + "belong in the anonymous try-mode."
  );
}

export function createValidatedSupabaseClient(rawClient) {
  if (!rawClient || typeof rawClient !== "object") {
    throw new TypeError("Supabase client must be an object.");
  }
  const auth = wrapAuth(rawClient.auth);
  return new Proxy(rawClient, {
    get(target, property) {
      if (property === "auth") {
        // Signing in is itself a collection event, and the try-mode has no
        // account to sign into.
        if (ephemeralMode) refuseInEphemeralMode("auth access", "auth");
        return auth;
      }
      if (property === "table") {
        return table => {
          if (ephemeralMode) refuseInEphemeralMode("table access", table);
          if (!TABLES.has(table)) throw new TypeError(`Unregistered Supabase table: ${table}`);
          return wrapQuery(target.from(table), "table", table);
        };
      }
      if (property === "call") {
        return (name, args) => {
          if (ephemeralMode) refuseInEphemeralMode("RPC", name);
          if (!RPCS.has(name)) throw new TypeError(`Unregistered Supabase RPC: ${name}`);
          return wrapQuery(target.rpc(name, args), "rpc", name);
        };
      }
      // Default-DENY on every real property of the raw SDK client.
      //
      // This trap used to name only `from` and `rpc` and pass everything else
      // through, which left the boundary bypassable in one hop:
      // `supabase.schema("public").from("students")` hands back a raw,
      // unchecked PostgrestClient, and the CI regex in
      // tools/checkSupabaseDomainBoundaries.mjs cannot see that shape either.
      // The same is true of `rest`, `storage`, `functions`, `realtime` and
      // `channel`. An allowlist that must enumerate every escape hatch the SDK
      // might add in a future version is not an allowlist.
      //
      // Symbols and absent properties still resolve normally, so `await`,
      // `console.log` and devtools inspection keep working — only a genuine
      // attempt to reach around the boundary throws.
      if (typeof property === "symbol") return Reflect.get(target, property, target);
      if (!ENGINE_PROBES.has(property) && Reflect.has(target, property)) {
        throw new TypeError(
          `Direct Supabase ${String(property)} access is private; use the domain boundary.`
        );
      }
      return undefined;
    }
  });
}
