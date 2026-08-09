export function buildWorksheetQrPayload({ origin, lookupToken }) {
  if (!/^https?:\/\//.test(origin || "") || !/^[A-Za-z0-9_-]{32,160}$/.test(lookupToken || "")) {
    throw new Error("A secure worksheet lookup token and app origin are required.");
  }
  const params = new URLSearchParams({ worksheet: lookupToken });
  return `${origin.replace(/\/$/, "")}/#teacher/resources/worksheets?${params}`;
}
