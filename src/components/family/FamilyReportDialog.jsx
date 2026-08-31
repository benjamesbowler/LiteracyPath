import { Printer, X } from "@phosphor-icons/react";
import { FAMILY_COPY } from "../../copy/familyCopy.js";
import { buildFamilyReportSections, buildParentAreaModel } from "../../data/parentAreaModel.js";

export function FamilyReportDialog({ report, model, onClose, onPrint }) {
  if (!report) return null;
  const reportModel = report.snapshot ? buildParentAreaModel({ ...report.snapshot, reports: [] }) : model;
  const sections = buildFamilyReportSections(reportModel);
  const copy = FAMILY_COPY.reportSections;
  return <div className="parent-report-dialog" role="dialog" aria-modal="true" aria-labelledby="parent-report-title"><div><header><div><span>{copy.releasedBySchool}</span><h1 id="parent-report-title">{report.title}</h1><p>{report.publishedLabel}</p></div><button type="button" onClick={onClose} aria-label={copy.closeReport}><X size={22} /></button></header>{sections.map(section => <section key={section.id}><h2>{section.title}</h2><p>{section.description}</p>{section.items.length ? <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul> : section.emptyMessage ? <p>{section.emptyMessage}</p> : null}</section>)}<footer><button type="button" className="pa-button pa-button-secondary" onClick={() => onPrint(report, reportModel)}><Printer size={18} />{copy.printOrSave}</button><button type="button" className="pa-button pa-button-primary" onClick={onClose}>{copy.close}</button></footer></div></div>;
}
