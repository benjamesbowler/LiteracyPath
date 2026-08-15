import { openHtmlDocument } from "./openHtmlDocument.js";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Opens a print-ready certificate in a new window. Elegant, school-printable.
export function printCertificate({ studentName = "Reader", achievement = "", detail = "" }) {
  const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const html = `<!doctype html>
<html><head><title>Certificate</title>
<style>
  @page { size: landscape; margin: 0; }
  body { margin: 0; font-family: Inter, "Segoe UI", Arial, sans-serif; }
  .cert {
    box-sizing: border-box; width: 100vw; height: 100vh;
    display: grid; place-content: center; gap: 14px; text-align: center;
    background:
      radial-gradient(500px 360px at 10% 0%, rgba(12,107,101,0.10), transparent 60%),
      radial-gradient(460px 320px at 92% 100%, rgba(214,138,17,0.10), transparent 60%),
      #FCFDFD;
    border: 14px solid #0C6B65; outline: 3px solid #D68A11; outline-offset: -22px;
    padding: 56px;
  }
  .kicker { color: #0C6B65; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; font-size: 13px; }
  h1 { margin: 0; font-family: Lexend, "Arial Rounded MT Bold", "Segoe UI", Arial, sans-serif; font-weight: 600; font-size: 52px; color: #101828; }
  .ach { margin: 0; font-family: Lexend, "Arial Rounded MT Bold", "Segoe UI", Arial, sans-serif; font-size: 24px; color: #0C6B65; font-weight: 600; }
  .detail { margin: 0; color: #475569; font-size: 16px; }
  .date { margin-top: 18px; color: #98A2B3; font-size: 13px; }
  .rule { width: 220px; height: 2px; background: #D68A11; margin: 6px auto; }
</style></head>
<body>
  <div class="cert">
    <p class="kicker">Literacy Guide · Certificate of Achievement</p>
    <h1>${esc(studentName)}</h1>
    <div class="rule"></div>
    <p class="ach">${esc(achievement)}</p>
    ${detail ? `<p class="detail">${esc(detail)}</p>` : ""}
    <p class="date">${esc(date)}</p>
  </div>
</body></html>`;
  return openHtmlDocument({
    html,
    name: "lp-certificate",
    features: "width=900,height=700",
    autoPrint: true
  }).ok;
}
