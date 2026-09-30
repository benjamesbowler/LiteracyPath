// A class code locates a roster; it never authenticates a learner. Fragment
// links keep the code out of server logs and ordinary referrer headers.
export function preparedClassCode(hash = "") {
  if (!String(hash).startsWith("#")) return "";
  const code = new URLSearchParams(String(hash).replace(/^#/, "")).get("class") || "";
  return /^[A-Z0-9]{6}$/.test(code) ? code : "";
}
export function preparedClassEntryUrl(origin, code) {
  return /^[A-Z0-9]{6}$/.test(code || "") ? `${new URL(origin).origin}/#class=${code}` : "";
}
