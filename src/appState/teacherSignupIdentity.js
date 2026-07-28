function cleanUsernamePart(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}
function randomIdentitySuffix(randomUuid) {
  const uuid = typeof randomUuid === "function"
    ? randomUuid()
    : globalThis.crypto?.randomUUID?.();
  const cleaned = cleanUsernamePart(uuid).replace(/[_-]/g, "");
  if (cleaned.length >= 10) return cleaned.slice(-10);

  // Old embedded browsers may not expose crypto.randomUUID. Random values are
  // not authentication secrets here; the suffix only prevents two internal
  // directory handles from colliding.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    .replace(/[^a-z0-9]/g, "")
    .slice(-10)
    .padStart(10, "0");
}

export function createInternalTeacherUsername(email = "", options = {}) {
  const localPart = String(email || "").split("@")[0];
  const base = cleanUsernamePart(localPart) || "teacher";
  const suffix = randomIdentitySuffix(options.randomUuid);
  // The database contract permits 3–30 characters. The handle is internal,
  // while the teacher-facing identity remains display name + email address.
  return `${base.slice(0, 19)}-${suffix}`.slice(0, 30);
}
