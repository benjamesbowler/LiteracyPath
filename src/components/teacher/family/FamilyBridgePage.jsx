import { useMemo, useState } from "react";
import { FAMILY_BRIDGE_LANGUAGES } from "../../../content/familyBridge/familyBridgeContent.js";
import { buildFamilyBridgePlan, familyBridgePrintHtml } from "../../../utils/familyBridgePlan.js";
import "../../../styles/family-bridge.css";

export function FamilyBridgePage({ cycleNumber, students = [], onClose }) {
  const [studentId, setStudentId] = useState(students[0]?.id || "class");
  const [language, setLanguage] = useState("en");
  const studentName = studentId === "class" ? "This class" : students.find(student => student.id === studentId)?.name || "Student";
  const plan = useMemo(() => buildFamilyBridgePlan({ cycleNumber, studentName, language }), [cycleNumber, language, studentName]);
  function print() {
    const popup = window.open("", "family-bridge-print", "noopener,noreferrer");
    if (!popup) return;
    popup.document.open(); popup.document.write(familyBridgePrintHtml(plan)); popup.document.close(); popup.focus(); popup.print();
  }
  return <main className="family-bridge" aria-labelledby="family-bridge-title"><header><div><p>Home connection</p><h1 id="family-bridge-title">Family Bridge</h1><span>Five short, low-pressure activities using the class’s current teaching cycle.</span></div><button type="button" onClick={onClose}>Back to resources</button></header><section className="family-bridge-controls" aria-label="Family plan choices"><label>Plan for<select value={studentId} onChange={event=>setStudentId(event.target.value)}><option value="class">Whole class</option>{students.map(student=><option key={student.id} value={student.id}>{student.name}</option>)}</select></label><label>Family language<select value={language} onChange={event=>setLanguage(event.target.value)}>{FAMILY_BRIDGE_LANGUAGES.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label><button className="lp-button lp-button-primary" type="button" onClick={print}>Print family plan</button></section><section className="family-bridge-preview" aria-label="Family plan preview"><header><span>{plan.studentName} · {plan.cycleTitle}</span><h2>{plan.title}</h2><p>{plan.note}</p><p>{plan.languageNote}</p></header><ol>{plan.activities.map(activity=><li key={activity.id}><span>{activity.day}</span><div><strong>{activity.title}</strong><p>{activity.direction}</p></div></li>)}</ol><footer><strong>Privacy by design</strong><p>No family account is needed. The app does not record a child’s voice or image, and it does not claim that a home activity was completed.</p></footer></section></main>;
}
