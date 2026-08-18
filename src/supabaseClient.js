import { createClient } from "@supabase/supabase-js";
import { createValidatedSupabaseClient } from "./data/boundaries/facade.js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// FAIL FAST, FAIL LOUD (REVIEW.md, Engineer #4). The old mock resolved every
// call quietly, so a deploy with missing env vars LOOKED alive while saving
// nothing — the worst possible failure for an app holding children's
// progress. Reads still resolve empty (previews and screenshots depend on
// that), but every WRITE now screams in the console with a stack trace and
// raises an app-visible event so the shell can show a banner.
function shoutUnconfiguredWrite(operation) {
  console.error(
    `[Literacy Guide] BLOCKED ${operation}: Supabase is NOT configured, nothing is being saved. `
    + "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deploy environment.",
    new Error("unconfigured supabase write").stack
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lp-supabase-unconfigured", { detail: { operation } }));
  }
}

function createMissingSupabaseClient() {
  const missingConfigError = {
    message: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend environment."
  };

  function response(data = null) {
    return Promise.resolve({ data, error: missingConfigError });
  }

  function queryBuilder(table) {
    const builder = {
      select: () => builder,
      insert: () => { shoutUnconfiguredWrite(`insert into "${table}"`); return builder; },
      upsert: () => { shoutUnconfiguredWrite(`upsert into "${table}"`); return builder; },
      update: () => { shoutUnconfiguredWrite(`update of "${table}"`); return builder; },
      delete: () => { shoutUnconfiguredWrite(`delete from "${table}"`); return builder; },
      order: () => builder,
      eq: () => builder,
      neq: () => builder,
      in: () => builder,
      is: () => builder,
      not: () => builder,
      or: () => builder,
      limit: () => builder,
      range: () => builder,
      single: () => response(),
      maybeSingle: () => response(),
      then: (resolve, reject) => response([]).then(resolve, reject),
      catch: reject => response([]).catch(reject)
    };

    return builder;
  }

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: missingConfigError }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }),
      signUp: () => { shoutUnconfiguredWrite("auth.signUp"); return response(); },
      signInWithPassword: () => { shoutUnconfiguredWrite("auth.signInWithPassword"); return response(); },
      resetPasswordForEmail: () => { shoutUnconfiguredWrite("auth.resetPasswordForEmail"); return response(); },
      updateUser: () => { shoutUnconfiguredWrite("auth.updateUser"); return response(); },
      signOut: () => response()
    },
    from: table => queryBuilder(table),
    rpc: name => queryBuilder(`rpc:${name}`)
  };
}

if (!isSupabaseConfigured) {
  console.error(
    "[Literacy Guide] Supabase frontend environment is MISSING. The app will render, "
    + "but logins fail and NO progress is saved. Set VITE_SUPABASE_URL and "
    + "VITE_SUPABASE_ANON_KEY before trusting anything this build appears to do."
  );
}

const rawSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMissingSupabaseClient();

export const supabase = createValidatedSupabaseClient(rawSupabase);
