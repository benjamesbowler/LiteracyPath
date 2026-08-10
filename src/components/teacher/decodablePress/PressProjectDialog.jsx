import { useMemo, useState } from "react";
import { PRESS_ASSETS } from "../../../content/decodablePress/pressAssetRegistry.js";
import { PRESS_PROJECT_TEMPLATES } from "../../../content/decodablePress/pressProjectTemplates.js";
import { getPressWordBank } from "../../../content/decodablePress/pressWordBanks.js";
import { createPressProject } from "../../../data/decodablePress/decodablePress.js";
import { TeacherDialog } from "../ui/TeacherDialog.jsx";

export function PressProjectDialog({ client, classId, cycleId, students, onClose, onCreated }) {
  const cycleNumber = Number(String(cycleId).match(/\d+/)?.[0] || 1);
  const bank = useMemo(() => getPressWordBank(cycleNumber), [cycleNumber]);
  const [templateId, setTemplateId] = useState(PRESS_PROJECT_TEMPLATES[0].id);
  const [learnerIds, setLearnerIds] = useState(students.map(student => student.id));
  const [allowClass, setAllowClass] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const template = PRESS_PROJECT_TEMPLATES.find(item => item.id === templateId);

  function toggle(id) { setLearnerIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); }
  async function create() {
    if (!client) { setMessage("The private project service is not available in this preview."); return; }
    setBusy(true); setMessage("");
    try {
      const projectRules = { title: template.title, projectTitle: template.title, templateId: template.id, templateVersion: template.version, templateDescription: template.description, pagePrompts: template.pagePrompts, wordBankId: bank.id, wordBankVersion: bank.version, words: bank.words, highFrequencyWords: bank.highFrequencyWords, assetIds: PRESS_ASSETS.map(asset => asset.id), contentVersion: 1, allowClassLibrary: allowClass, deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : "" };
      await createPressProject(client, { classId, learnerIds, projectRules });
      await onCreated(); onClose();
    } catch { setMessage("The project could not be created. Your choices are still here; try again."); }
    finally { setBusy(false); }
  }

  return <TeacherDialog className="press-project-dialog" labelledBy="press-project-title" onClose={onClose} busy={busy}>
    <header><div><p>New Class Decodable Press project</p><h2 id="press-project-title">Assign a meaningful four-page story</h2></div><button type="button" onClick={onClose}>Close</button></header>
    <label>Story shape<select value={templateId} onChange={event => setTemplateId(event.target.value)}><option value={PRESS_PROJECT_TEMPLATES[0].id}>{PRESS_PROJECT_TEMPLATES[0].title}</option>{PRESS_PROJECT_TEMPLATES.slice(1).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <p>{template.description}</p>
    <section><h3>Frozen curriculum pack</h3><p>Cycle {cycleNumber} · {bank.words.length} decodable words · {bank.highFrequencyWords.length} approved known words · {PRESS_ASSETS.length} local scenes</p></section>
    <fieldset><legend>Learners</legend>{students.map(student => <label key={student.id}><input type="checkbox" checked={learnerIds.includes(student.id)} onChange={() => toggle(student.id)} />{student.name}</label>)}</fieldset>
    <label>Deadline (optional)<input type="date" value={deadline} onChange={event => setDeadline(event.target.value)} /></label>
    <label className="press-class-library-check"><input type="checkbox" checked={allowClass} onChange={event => setAllowClass(event.target.checked)} /> Let me approve exact revisions for the private class library</label>
    <p className="press-privacy-note">No camera, child image upload, voice recording, public sharing, comments, or likes.</p>
    <button type="button" disabled={busy || !learnerIds.length} onClick={create}>{busy ? "Creating…" : "Create private project"}</button>{message && <p role="alert">{message}</p>}
  </TeacherDialog>;
}
