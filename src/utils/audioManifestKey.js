export async function getGeneratedAudioKey(normalizedText = "") {
  const text = String(normalizedText || "");
  if (!text || !globalThis.crypto?.subtle) return "";
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(text)
  );
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
