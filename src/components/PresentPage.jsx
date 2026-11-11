import { useEffect, useMemo, useRef, useState } from "react";
import { TeacherPageShell, TeacherPageHeader, TeacherFilterBar } from "./teacher/ui/TeacherPrimitives.jsx";
import { presentationCycleOptions, openCyclePresentation, PRESENTATION_DAYS } from "../utils/present/presentationBuilder.js";
import { readPresentWorkspaceState, readSavedPresentWorkspaceState, rememberPresentWorkspaceState } from "../utils/present/presentWorkspaceState.js";
import "../styles/worksheets.css";
import "../styles/present.css";

export function PresentPage({ classId = "", currentCycleId = "", ...props }) {
  return <DailyPresentPage key={`${classId || "unscoped"}:${currentCycleId}`} classId={classId} currentCycleId={currentCycleId} {...props} />;
}

function DailyPresentPage({ classId, currentCycleId, onBack }) {
  const cycles = useMemo(() => presentationCycleOptions().filter(item => item.type !== "assessment"), []);
  const [initial] = useState(() => readPresentWorkspaceState({ classId, currentCycleId, cycleOptions: cycles }));
  const [cycleId, setCycleId] = useState(initial.cycleId);
  const [day, setDay] = useState(initial.day);
  const [savedLesson, setSavedLesson] = useState(() => readSavedPresentWorkspaceState({ classId, cycleOptions: cycles }));
  const [notice, setNotice] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const fallbackRef = useRef("");
  const exportRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => () => exportRef.current?.abort(), []);
  useEffect(() => () => { if (fallbackRef.current) URL.revokeObjectURL(fallbackRef.current); }, []);

  async function downloadPowerPoint() {
    const controller = new AbortController();
    exportRef.current = controller;
    setExporting(true);
    setFallbackUrl("");
    setNotice("Preparing the PowerPoint…");
    try {
      const { downloadPresentationPowerPoint } = await import("../utils/present/presentationPowerPoint.js");
      await downloadPresentationPowerPoint(cycleId, { day, signal: controller.signal, onProgress: setNotice });
      setNotice("PowerPoint downloaded. Open it in PowerPoint and choose Slide Show. On Mac, choose Pointer Options → Visible for the activity buttons.");
    } catch (error) {
      if (error.name !== "AbortError") setNotice(error.message || "The PowerPoint could not download. Please try again.");
    } finally {
      if (!controller.signal.aborted) setExporting(false);
      exportRef.current = null;
    }
  }

  function present() {
    setNotice("");
    setFallbackUrl("");
    if (fallbackRef.current) URL.revokeObjectURL(fallbackRef.current);
    fallbackRef.current = "";
    try {
      const result = openCyclePresentation(cycleId, { day, startIndex: 0 });
      const lesson = { cycleId, day, format: "core", preview: 0 };
      if (rememberPresentWorkspaceState(classId, lesson)) setSavedLesson(lesson);
      if (!result.ok) {
        fallbackRef.current = result.url || "";
        setFallbackUrl(result.url || "");
        setNotice("Your browser blocked the presentation window. Open it here.");
      }
    } catch {
      setNotice("The presentation could not open. Please try again.");
    }
  }

  return <TeacherPageShell className="ws-page pr-page pr-daily-page" product="present" intent="resources" data-teacher-route="present">
    {onBack && <nav className="ws-route-nav" aria-label="Present navigation"><button className="ws-back" type="button" onClick={onBack}>← Back to Teach</button></nav>}
    <TeacherPageHeader title="Present" description="Monday–Thursday: 15–20 minutes · Friday review: 30 minutes" />
    <p className="ws-context">{initial.cycleId ? `Current class cycle: ${cycles.find(item => item.id === currentCycleId)?.label}.` : "Choose a cycle for this lesson. The class teaching cycle is not set."} {cycleId && cycleId !== currentCycleId && "Your choice applies to this lesson only."}</p>
    {savedLesson && <p className="ws-note">Saved lesson: {cycles.find(item => item.id === savedLesson.cycleId)?.label}, {PRESENTATION_DAYS.find(item => item.value === savedLesson.day)?.label}. <button type="button" className="ws-ghost" disabled={exporting} onClick={() => { setCycleId(savedLesson.cycleId); setDay(savedLesson.day); setNotice("Saved lesson selected. Present opens it from the beginning."); }}>Use saved lesson</button></p>}
    <TeacherFilterBar className="pr-daily-chooser" label="Choose your daily presentation">
      <label htmlFor="present-cycle">Cycle<select aria-label="Cycle" id="present-cycle" value={cycleId} disabled={exporting} onChange={event => { setCycleId(event.target.value); setNotice(""); }}>
        <option value="">Choose a cycle</option>{cycles.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></label>
      <label htmlFor="present-day">Day<select aria-label="Day" id="present-day" value={day} disabled={exporting} onChange={event => { setDay(event.target.value); setNotice(""); }}>
        {PRESENTATION_DAYS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select></label>
      <button className="ws-primary pr-present" type="button" onClick={present} disabled={!cycleId || exporting}>Present</button>
      <button className="ws-ghost" type="button" onClick={downloadPowerPoint} disabled={!cycleId || exporting}>{exporting ? "Preparing PowerPoint…" : "Download PowerPoint"}</button>
      {initial.cycleId && cycleId !== currentCycleId && <button className="ws-ghost" type="button" disabled={exporting} onClick={() => { setCycleId(initial.cycleId); setDay(initial.day); setNotice(""); }}>Use current class lesson</button>}
    </TeacherFilterBar>
    <p className="ws-note">Download a complete lesson with pictures, sound and clickable activities for offline PowerPoint Slide Show. Reading time and card comparisons are teacher-paced. Writing practice includes stroke direction arrows.</p>
    {notice && <p className="ws-note" role="status">{notice}{fallbackUrl && <> <a href={fallbackUrl} target="_blank" rel="noreferrer">Open presentation</a></>}</p>}
  </TeacherPageShell>;
}
