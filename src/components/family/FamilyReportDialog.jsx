import { useEffect, useRef } from "react";
import { Printer, X } from "@phosphor-icons/react";
import { FAMILY_COPY } from "../../copy/familyCopy.js";
import { buildFamilyReportSections } from "../../data/parentAreaModel.js";
import { familyReportModelForRelease } from "../../data/familyReportDocument.js";

export function FamilyReportDialog({ report, ...props }) {
  return report ? <OpenReportDialog key={report.id} report={report} {...props} /> : null;
}

function OpenReportDialog({ report, model, onClose, onPrint, printMessage = "", printing = false }) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog.showModal();
    titleRef.current?.focus();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus();
      else document.getElementById("parent-main")?.focus();
    };
  }, []);

  const reportModel = familyReportModelForRelease(report, model);
  const sections = buildFamilyReportSections(reportModel);
  const copy = FAMILY_COPY.reportSections;

  return <dialog ref={dialogRef} className="parent-report-dialog" aria-labelledby="parent-report-title"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div>
      <header>
        <div>
          <span>{copy.releasedBySchool}</span>
          <h1 id="parent-report-title" ref={titleRef} tabIndex={-1}>{report.title}</h1>
          <p>{report.publishedLabel}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={copy.closeReport}><X size={22} aria-hidden="true" /></button>
      </header>
      {sections.map(section => <section key={section.id}>
        <h2>{section.title}</h2>
        <p>{section.description}</p>
        {section.items.length
          ? <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>
          : section.emptyMessage && <p>{section.emptyMessage}</p>}
      </section>)}
      {printMessage && <p role="alert">{printMessage}</p>}
      <footer>
        <button type="button" className="pa-button pa-button-secondary" onClick={() => onPrint(report, model)} disabled={printing}>
          <Printer size={18} aria-hidden="true" />{printing ? "Preparing report…" : copy.printOrSave}
        </button>
        <button type="button" className="pa-button pa-button-primary" onClick={onClose}>{copy.close}</button>
      </footer>
    </div>
  </dialog>;
}
