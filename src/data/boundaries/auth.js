import { assertOptionalFields, assertPlainRecord } from "./schema.js";

export const AUTH_RPCS = new Set([
  "find_or_create_school",
  "list_school_names",
  "teacher_set_school"
]);

export function validateAuthSession(session, label = "auth.session") {
  if (session === null || session === undefined) return session;
  assertOptionalFields(session, {
    access_token: "string",
    refresh_token: "string",
    expires_at: "number",
    user: "object"
  }, label);
  if (session.user) {
    assertOptionalFields(session.user, {
      id: "string",
      email: "string",
      user_metadata: "object",
      app_metadata: "object"
    }, `${label}.user`);
  }
  return session;
}

export function validateAuthResponse(result, operation = "auth") {
  assertPlainRecord(result, `${operation} response`);
  if (result.error) return result;
  if (result.data !== null && result.data !== undefined) {
    assertPlainRecord(result.data, `${operation}.data`);
    if ("session" in result.data) validateAuthSession(result.data.session, `${operation}.data.session`);
    if (result.data.user) {
      assertOptionalFields(result.data.user, {
        id: "string",
        email: "string"
      }, `${operation}.data.user`);
    }
  }
  return result;
}
