import { buildFamilyReportSections, buildParentAreaModel } from "./parentAreaModel.js";
import { FAMILY_COPY } from "../copy/familyCopy.js";

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'"
  })[character]);
}

function printSection(section) {
  const items = section.items?.length
    ? `<ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : section.emptyMessage
      ? `<p>${escapeHtml(section.emptyMessage)}</p>`
      : "";
  return `<section><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.description)}</p>${items}</section>`;
}

export function familyReportModelForRelease(report, currentModel) {
  return report?.snapshot
    ? buildParentAreaModel({ ...report.snapshot, reports: [] })
    : currentModel;
}

export function familyReportPrintableHtml({ title, model }) {
  const sections = buildFamilyReportSections(model);
  const notice = FAMILY_COPY.reportSections.printNotice.replace("{school}", model.learner.schoolName);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>@page{margin:14mm}body{font:16px/1.5 Arial,sans-serif;color:#172033;max-width:760px;margin:auto}header{border-bottom:3px solid #0c6b65;padding-bottom:14px}h1{font-size:28px;margin:.25rem 0}h2{font-size:19px;color:#084e4a;margin-top:24px}section{break-inside:avoid}li{margin:.4rem 0}.meta{color:#586579}.notice{margin-top:28px;border-top:1px solid #dbe3e8;padding-top:12px;color:#586579;font-size:13px}</style></head><body><header><small>${escapeHtml(FAMILY_COPY.reportSections.printHeading)}</small><h1>${escapeHtml(title)}</h1><p class="meta">${escapeHtml(model.updatedLabel)}</p></header>${sections.map(printSection).join("")}<p class="notice">${escapeHtml(notice)}</p></body></html>`;
}
