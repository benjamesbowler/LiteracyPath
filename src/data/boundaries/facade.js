const TABLES = new Set(
  "activity_sync_health answers app_admins app_config assessment_attempts assessment_sessions classes el_assessment_reports item_mastery mastery pending_teacher_accounts schools student_progress students teacher_instructional_group_reviews teacher_instructional_groups teacher_interventions worksheet_bank".split(" ")
);
const RPCS = new Set(
  "admin_error_monitor_summary admin_get_school_retention_policy admin_list_deletion_propagation admin_preview_school_retention admin_recent_error_events admin_run_school_retention admin_save_school_retention_policy admin_verify_deletion_propagation find_or_create_school get_game_leaderboard list_school_names report_app_error set_app_config student_class_by_code student_get_progress student_log_activity_v2 student_login student_report_activity_sync_health student_save_progress teacher_assign_instructional_group_follow_up teacher_class_access_log teacher_class_access_summary teacher_create_demo_class teacher_create_insight_intervention teacher_create_intervention_follow_up teacher_delete_learner_data teacher_export_learner_data teacher_list_learner_data_rights teacher_prepare_learner_deletion teacher_record_insight_observation teacher_regenerate_class_code teacher_review_instructional_group teacher_save_instructional_group teacher_set_class_code_expiry teacher_set_class_leaderboard_scope teacher_set_school teacher_set_student_archived".split(" ")
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
export function createValidatedSupabaseClient(rawClient) {
  if (!rawClient || typeof rawClient !== "object") {
    throw new TypeError("Supabase client must be an object.");
  }
  const auth = wrapAuth(rawClient.auth);
  return new Proxy(rawClient, {
    get(target, property) {
      if (property === "auth") return auth;
      if (property === "table") {
        return table => {
          if (!TABLES.has(table)) throw new TypeError(`Unregistered Supabase table: ${table}`);
          return wrapQuery(target.from(table), "table", table);
        };
      }
      if (property === "call") {
        return (name, args) => {
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
