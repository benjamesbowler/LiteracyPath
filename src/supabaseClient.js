import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createMissingSupabaseClient() {
  const missingConfigError = {
    message: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend environment."
  };

  function response(data = null) {
    return Promise.resolve({ data, error: missingConfigError });
  }

  function queryBuilder() {
    const builder = {
      select: () => builder,
      insert: () => builder,
      upsert: () => builder,
      update: () => builder,
      delete: () => builder,
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
      signUp: () => response(),
      signInWithPassword: () => response(),
      signOut: () => response()
    },
    from: () => queryBuilder()
  };
}

if (!isSupabaseConfigured) {
  console.error("Supabase frontend environment is missing. The app will show the login screen, but Supabase actions will be unavailable.");
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMissingSupabaseClient();
