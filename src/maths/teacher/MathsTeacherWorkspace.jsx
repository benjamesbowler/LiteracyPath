import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Books,
  ChartBar,
  CheckCircle,
  ClipboardText,
  House,
  Printer,
  ProjectorScreen,
  ShieldCheck,
  Sparkle,
  UsersThree
} from "@phosphor-icons/react";
import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";
import { mathsActivityRecipesBySkill, MATHS_CONTENT_VERSION } from "../learn/mathsActivityRecipes.js";
import { MathsManipulative } from "../manipulatives/MathsManipulative.jsx";
import { createManipulativeState } from "../manipulatives/mathsManipulatives.js";
import { mathsStories } from "../stories/mathsStoryCatalog.js";
import { mathsSongs } from "../music/mathsSongs.js";
import { mathsGames } from "../games/mathsGames.js";
import { readTeacherMathsEvidence, readTeacherMathsSyncHealth, recordTeacherMathsEvidence } from "../data/mathsEvidenceStore.js";
import { buildMathsClassGroups, buildMathsClassReport, buildMathsLearnerReport, MATHS_EVIDENCE_STATUSES } from "../reporting/mathsReporting.js";
import { MathsAudioButton, MathsSongPlayer } from "../media/MathsAudioButton.jsx";
import { buildMathsWorksheetTasks, MATHS_WORKSHEET_LEVELS, worksheetTemplatesForSkill } from "./mathsWorksheetTasks.js";
import { buildMathsSmallGroupPlan, MATHS_PRESENTATION_MODE_LABELS, MATHS_PRESENTATION_PROFILES } from "./mathsTeachingPlans.js";
import "../../styles/maths-platform.css";
import "../../styles/maths-platform-v2.css";

const MODE_COPY = {
  overview: ["Maths teaching", "Plan, teach, check and respond from one evidence-safe workspace."],
  assessments: ["Maths skills checks", "Short formative checks across the eight approved Foundation number skills."],
  reports: ["Maths reports", "Evidence basis, representations, freshness, possible patterns and next teaching actions."],
  resources: ["Maths resources", "Lessons, number stories, classroom chants, games and family activities."],
  present: ["Maths presentation", "Whole-class number talks with controlled reveal and representation switching."],
  worksheets: ["Maths worksheet studio", "Print-ready, grayscale-safe practice with an answer page."],
  groups: ["Small-group composer", "Create a teachable routine from real class evidence or teacher choice."]
};

function Header({ mode, className, studentCount }) {
  const [title, description] = MODE_COPY[mode];
  return <header className="maths-workspace-header maths-workspace-header-v2"><div><p><Sparkle aria-hidden="true" size={16} weight="fill" /> Foundation number sense</p><h1>{title}</h1><span>{description}</span></div><div className="maths-class-chip maths-class-chip-v2"><UsersThree aria-hidden="true" size={28} weight="duotone" /><span><strong>{className || "Choose a class"}</strong>{Number.isInteger(studentCount) && <small>{studentCount} learners</small>}</span></div></header>;
}

export function MathsWorkspaceNav({ onNavigate }) {
  const cards = [
    ["present", "Present", "Lead a number talk", ProjectorScreen], ["groups", "Small groups", "Compose a targeted lesson", UsersThree],
    ["assessments", "Skills checks", "Choose a formative check", ClipboardText], ["reports", "Reports", "See evidence and next actions", ChartBar],
    ["worksheets", "Worksheets", "Build and print practice", Printer], ["resources", "Resource library", "Stories, songs and games", Books]
  ];
  return <div className="maths-tool-grid maths-tool-grid-v2">{cards.map(([mode, title, description, Icon], index) => <button key={mode} onClick={() => onNavigate(mode)} type="button"><span><Icon aria-hidden="true" size={28} weight="duotone" /></span><strong>{title}</strong><small>{description}</small><em>{index === 0 ? "Open next" : "Open"} <ArrowRight aria-hidden="true" size={16} /></em></button>)}</div>;
}

function Overview({ onNavigate, studentCount = 0 }) {
  return <div className="maths-overview-v2"><section className="maths-teacher-callout maths-teacher-callout-v2"><div><p className="maths-stage-label">Start here today</p><strong>Lead a five-minute number talk</strong><p>Open a model, ask what learners notice, then use the class response to choose a small-group follow-up.</p><div><button className="maths-primary" onClick={() => onNavigate("present")} type="button">Open presentation <ArrowRight aria-hidden="true" size={18} /></button><button onClick={() => onNavigate("groups")} type="button">Plan a small group</button></div></div><div className="maths-today-model" aria-label="A five-frame showing four counters" role="img"><span /><span /><span /><span /><i /></div></section><section className="maths-overview-snapshot" aria-label="Maths release snapshot"><article><CheckCircle aria-hidden="true" size={26} weight="duotone" /><span><strong>8</strong><small>released learning goals</small></span></article><article><ClipboardText aria-hidden="true" size={26} weight="duotone" /><span><strong>160</strong><small>authored assessment models</small></span></article><article><UsersThree aria-hidden="true" size={26} weight="duotone" /><span><strong>{studentCount || "—"}</strong><small>learners in this class</small></span></article></section><section className="maths-overview-tools"><header><div><p className="maths-stage-label">Teaching toolkit</p><h2>What do you need to do?</h2></div><span>Every tool uses the same eight learning goals.</span></header><MathsWorkspaceNav onNavigate={onNavigate} /></section><section className="maths-evidence-policy maths-evidence-policy-v2"><header><ShieldCheck aria-hidden="true" size={28} weight="duotone" /><div><h2>Clear, safe evidence</h2><p>What the current Foundation release can—and cannot—say.</p></div></header><div><article><strong>Formative, not a score</strong><p>Practice and short checks suggest the next teaching action. No single activity declares mastery.</p></article><article><strong>Private by design</strong><p>No child voice, face, camera, image upload or public sharing is used in Maths.</p></article><article><strong>Honest scope</strong><p>Number sense is released now. Measurement, shape, pattern, time and data stay clearly marked as future areas.</p></article></div></section></div>;
}

function AssignmentBuilder({ client, classId, students }) {
  const intent = (() => { try { return JSON.parse(sessionStorage.getItem("lp-maths-resource-intent") || "null"); } catch { return null; } })();
  const [skillId, setSkillId] = useState(() => APPROVED_FOUNDATION_SKILL_IDS.includes(intent?.skillId) ? intent.skillId : "F-N-PART-10");
  const [activityType, setActivityType] = useState(() => intent?.activityType === "skills_check" ? "skills_check" : "lesson");
  const [selected, setSelected] = useState(() => students.map(student => student.id));
  const [dueAt, setDueAt] = useState("");
  const [state, setState] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [listState, setListState] = useState(classId ? "loading" : "no-class");
  const alignedStory = mathsStories.find(item => (
    item.skillIds.includes(skillId) && item.releaseStatus === "approved"
  ));
  const alignedGame = mathsGames.find(game => game.skillIds.includes(skillId));
  useEffect(() => {
    try { sessionStorage.removeItem("lp-maths-resource-intent"); } catch { /* storage is optional */ }
  }, []);
  const changeSkill = nextSkillId => {
    const nextStory = mathsStories.find(item => item.skillIds.includes(nextSkillId) && item.releaseStatus === "approved");
    const nextGame = mathsGames.find(game => game.skillIds.includes(nextSkillId));
    setSkillId(nextSkillId);
    if (activityType === "number_story" && !nextStory) setActivityType("lesson");
    if (activityType === "game" && !nextGame) setActivityType("lesson");
  };
  const refreshAssignments = async ({ showLoading = true } = {}) => {
    if (!classId || !client?.call) return;
    if (showLoading) setListState("loading");
    try {
      const { data, error } = await client.call("teacher_list_maths_assignments", { p_class_id: classId, p_include_archived: false });
      if (error || !data?.ok) throw error || new Error(data?.error || "assignment_read_failed");
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
      setListState("ready");
    } catch {
      setListState("error");
    }
  };
  useEffect(() => {
    let current = true;
    if (!classId || !client?.call) return undefined;
    client.call("teacher_list_maths_assignments", { p_class_id: classId, p_include_archived: false })
      .then(({ data, error }) => {
        if (!current) return;
        if (error || !data?.ok) throw error || new Error(data?.error || "assignment_read_failed");
        setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
        setListState("ready");
      })
      .catch(() => { if (current) setListState("error"); });
    return () => { current = false; };
  }, [classId, client]);
  const create = async () => {
    if (!classId || !selected.length) { setState("Choose a class and at least one learner."); return; }
    if (activityType === "number_story" && !alignedStory) {
      setState("No released number story matches this learning goal yet. Choose another goal or activity.");
      return;
    }
    if (activityType === "game" && !alignedGame) {
      setState("No released practice game matches this learning goal yet. Choose another goal or activity.");
      return;
    }
    setState("Assigning…");
    const activityId = activityType === "lesson"
      ? mathsActivityRecipesBySkill[skillId][0].id
      : activityType === "skills_check"
        ? `check:${skillId}`
        : activityType === "game"
          ? alignedGame.id
          : alignedStory.id;
    const title = `${mathsSkillById[skillId].childLabel} · ${activityType.replaceAll("_", " ")}`;
    try {
      const { data, error } = await client.call("teacher_create_maths_assignment", {
        p_class_id: classId, p_skill_id: skillId, p_activity_type: activityType,
        p_activity_id: activityId, p_title: title, p_student_ids: selected,
        p_due_at: dueAt ? new Date(`${dueAt}T23:59:00`).toISOString() : null
      });
      if (error || !data?.ok) setState("The assignment could not be created. Your choices are still here.");
      else { setState(`Assigned to ${data.assignedCount || selected.length} learners.`); await refreshAssignments(); }
    } catch {
      setState("The assignment could not be created. Your choices are still here.");
    }
  };
  const archive = async id => {
    setState("Archiving…");
    try {
      const { data, error } = await client.call("teacher_archive_maths_assignment", { p_class_id: classId, p_assignment_id: id });
      if (error || !data?.ok) throw error || new Error(data?.error || "archive_failed");
      setState("Assignment archived.");
      await refreshAssignments();
    } catch { setState("The assignment could not be archived."); }
  };
  return <section className="maths-assignment-builder"><div className="maths-section-title"><div><p>Cloud-saved student worklist</p><h2>Assign Maths practice</h2></div></div><div className="maths-assignment-form"><label>Learning goal<select value={skillId} onChange={event => changeSkill(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><label>Activity<select value={activityType} onChange={event => setActivityType(event.target.value)}><option value="lesson">Maths lesson</option><option value="skills_check">Skills check</option><option disabled={!alignedGame} value="game">Practice game{alignedGame ? "" : " (not released for this goal)"}</option><option disabled={!alignedStory} value="number_story">Number story{alignedStory ? "" : " (not released for this goal)"}</option></select></label><label>Due date (optional)<input type="date" value={dueAt} onChange={event => setDueAt(event.target.value)} /></label></div><fieldset className="maths-assignment-learners"><legend>Learners ({selected.length} selected)</legend><button onClick={() => setSelected(students.map(student => student.id))} type="button">Select all</button><button onClick={() => setSelected([])} type="button">Clear</button><div>{students.map(student => <label key={student.id}><input checked={selected.includes(student.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, student.id] : ids.filter(id => id !== student.id))} type="checkbox" />{student.name}</label>)}</div></fieldset><button className="maths-primary" onClick={create} type="button">Assign to selected learners</button><p role="status">{state}</p><section className="maths-assignment-manager"><div><h3>Active assignments</h3><button onClick={() => refreshAssignments()} type="button">Refresh</button></div>{listState === "loading" && <p>Loading assignments…</p>}{listState === "error" && <p>Assignments could not be loaded. Nothing was changed.</p>}{listState === "ready" && !assignments.length && <p>No active Maths assignments.</p>}{listState === "ready" && assignments.map(assignment => <article key={assignment.id}><div><strong>{assignment.title}</strong><small>{assignment.completedCount} of {assignment.assignedCount} complete</small></div><progress aria-label={`${assignment.completedCount} of ${assignment.assignedCount} complete`} max={assignment.assignedCount || 1} value={assignment.completedCount || 0} /><button onClick={() => archive(assignment.id)} type="button">Archive</button></article>)}</section></section>;
}

function CheckLauncher({ onNavigate }) {
  const assignCheck = skillId => {
    try { sessionStorage.setItem("lp-maths-resource-intent", JSON.stringify({ skillId, activityType: "skills_check" })); } catch { /* navigation still works */ }
    onNavigate("resources");
  };
  return <section className="maths-resource-list"><div className="maths-section-title"><div><p>Six interaction blueprints · 160 explicitly authored models · four countable surface variants each</p><h2>Choose the learning goal</h2></div></div>{APPROVED_FOUNDATION_SKILL_IDS.map(skillId => <article key={skillId}><div><small>{mathsSkillById[skillId].assessmentBlueprintIds.join(" · ")}</small><h3>{mathsSkillById[skillId].childLabel}</h3><p>{mathsSkillById[skillId].teacherIntent}</p></div><button onClick={() => assignCheck(skillId)} type="button">Assign check</button></article>)}</section>;
}

function ResourceLibrary({ client, classId, students }) {
  const rosterKey = `${classId}:${students.map(student => student.id).join(",")}`;
  return <div className="maths-library-sections"><AssignmentBuilder key={rosterKey} classId={classId} client={client} students={students} /><section><div className="maths-section-title"><div><p>40 structured activities</p><h2>Lesson recipes</h2></div></div><div className="maths-compact-grid">{APPROVED_FOUNDATION_SKILL_IDS.map(skillId => <article key={skillId}><strong>{mathsSkillById[skillId].childLabel}</strong><span>{mathsActivityRecipesBySkill[skillId].length} activities</span><small>Retrieve · model · make · apply · transfer</small><MathsAudioButton client={client} compact requestId={mathsActivityRecipesBySkill[skillId][0].instructionAudioId} /></article>)}</div></section><section><div className="maths-section-title"><div><p>Original number narratives</p><h2>Number stories</h2></div></div><div className="maths-compact-grid">{mathsStories.map(story => <article key={story.id}><span className={`maths-release-pill is-${story.releaseStatus}`}>{story.releaseStatus === "approved" ? "Released" : "Curriculum pending"}</span><strong>{story.title}</strong><small>{story.mathsPromise}</small>{story.releaseStatus === "approved" && <MathsAudioButton client={client} compact label="Hear page one" requestId={`story:${story.id}:page:1`} />}</article>)}</div></section><section><div className="maths-section-title"><div><p>Movement and retrieval</p><h2>Classroom chants and games</h2></div></div><div className="maths-compact-grid">{mathsSongs.map(item => <article key={item.id}><strong>{item.title}</strong><small>{item.tempo} BPM original classroom chant</small><MathsSongPlayer client={client} compact song={item} /></article>)}{mathsGames.map(item => <article key={item.id}><strong>{item.title}</strong><small>{item.rounds} untimed decisions · {item.skillIds.map(id => mathsSkillById[id]?.childLabel).join(" · ")}</small></article>)}</div></section><FamilyBridge /></div>;
}

function FamilyBridge() {
  const [skillId, setSkillId] = useState("F-N-PART-10");
  const activity = {
    "F-N-SEQ-20": "Write 0 to 10 on scraps of paper. Mix them, rebuild the line, then hide one number and ask what is missing.",
    "F-N-COUNT-10": "Find up to ten safe household objects. Move each object once while counting. Ask: ‘How many altogether?’",
    "F-N-COUNT-20": "Find a larger collection. Make a group of ten first, then count on for the extras.",
    "F-N-SUBITISE-5": "Show up to five fingers for two seconds. Hide them and ask: ‘How many did you see? How did you see it?’",
    "F-N-MATCH": "Choose a numeral from 1 to 10 and make a matching collection with safe objects.",
    "F-N-COMPARE": "Make two small collections. Match objects one-to-one and ask which has more, fewer or the same.",
    "F-N-PART-5": "Put five safe objects on two plates. Move one object and say both parts and the whole.",
    "F-N-PART-10": "Find ten safe objects. Put six on one plate and the rest on another. Ask: ‘How many are on each plate? How many altogether?’"
  }[skillId];
  const print = () => window.print();
  return <section className="maths-family-bridge" id="maths-family-bridge"><div><p>No family account · no child media</p><h2>Five-minute Family Bridge</h2></div><label>Learning goal<select onChange={event => setSkillId(event.target.value)} value={skillId}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><article><strong>Try this together</strong><p>{activity}</p><small>Notice the strategy, not speed. Stop while it still feels warm and successful.</small></article><button onClick={print} type="button">Print family card</button></section>;
}

function seededManipulativeState(id, quantity) {
  const state = createManipulativeState(id, { maximum: Math.max(5, quantity) });
  if (id === "counter_tray") return { ...state, counters: Array.from({ length: quantity }, (_, index) => ({ id: `counter-${index + 1}`, groupId: "a", slot: index })) };
  if (["five_frame", "ten_frame"].includes(id)) return { ...state, cells: state.cells.map((_, index) => index < quantity ? "part_a" : "empty") };
  if (id === "number_line") return { ...state, current: quantity, jumps: quantity ? [{ from: 0, to: quantity, direction: "forward", magnitude: quantity }] : [] };
  if (id === "part_whole") return { ...state, whole: quantity, parts: [Math.floor(quantity / 2), Math.ceil(quantity / 2)] };
  return state;
}

function PresentationModels({ profile, quantity, mode }) {
  const primaryId = profile.model === "number_line" ? "number_line"
    : profile.model === "part_whole" ? "part_whole"
      : profile.model === "compare" ? "ten_frame"
        : profile.model === "double_ten_frame" ? "ten_frame"
          : profile.model === "numeral_match" ? "ten_frame"
            : profile.model === "two_colour_frame" ? "ten_frame"
              : profile.model;
  const maximum = profile.model === "double_ten_frame" ? 20 : profile.maximum;
  const primaryState = seededManipulativeState(primaryId, quantity);
  if (profile.model === "two_colour_frame") {
    const split = Math.max(1, quantity - 3);
    primaryState.cells = primaryState.cells.map((_, index) => index < split ? "part_a" : index < quantity ? "part_b" : "empty");
  }
  if (profile.model === "compare") {
    const other = Math.max(profile.minimum, quantity - 2);
    return <div className="maths-presentation-model-pair" aria-label={`Compare ${quantity} and ${other}`}><MathsManipulative id="ten_frame" initialState={seededManipulativeState("ten_frame", quantity)} key={`left-${quantity}`} maximum={10} mode="presentation" /><MathsManipulative id="ten_frame" initialState={seededManipulativeState("ten_frame", other)} key={`right-${other}`} maximum={10} mode="presentation" /></div>;
  }
  if (mode === "same") {
    return <div className="maths-presentation-model-pair" aria-label={`Two ways to show ${quantity}`}><MathsManipulative id={primaryId} initialState={primaryState} key={`primary-${primaryId}-${quantity}`} maximum={maximum} mode="presentation" /><MathsManipulative id="counter_tray" initialState={seededManipulativeState("counter_tray", quantity)} key={`tray-${quantity}`} maximum={maximum} mode="presentation" /></div>;
  }
  return <div className="maths-presentation-single">{profile.model === "numeral_match" && <div className="maths-presentation-numeral" aria-label={`Numeral ${quantity}`}>{quantity}</div>}<MathsManipulative id={primaryId} initialState={primaryState} key={`${primaryId}-${quantity}-${mode}`} maximum={maximum} mode="presentation" /></div>;
}

function Presentation() {
  const [skillId, setSkillId] = useState("F-N-SUBITISE-5");
  const [mode, setMode] = useState("flash");
  const [revealed, setRevealed] = useState(false);
  const [quantity, setQuantity] = useState(5);
  const [flashing, setFlashing] = useState(false);
  const profile = MATHS_PRESENTATION_PROFILES[skillId];
  const trueFalse = profile.trueFalse(quantity);
  const changeSkill = nextSkillId => {
    const nextProfile = MATHS_PRESENTATION_PROFILES[nextSkillId];
    setSkillId(nextSkillId);
    setQuantity(nextProfile.defaultQuantity);
    setMode(nextProfile.modes[0]);
    setRevealed(false);
    setFlashing(false);
  };
  const flash = () => { setFlashing(true); window.setTimeout(() => setFlashing(false), 1500); };
  const prompt = mode === "flash" ? flashing ? "Look now" : "How many did you see?"
    : mode === "same" ? `How are these two models both ${quantity}?`
      : mode === "truefalse" ? `${trueFalse.statement} True or false?`
        : mode === "compare" ? "Which collection has more? How do you know?"
          : mode === "build" ? `Build ${quantity}. What changes each time?`
            : "What do you notice? What do you wonder?";
  return <section className="maths-presentation"><aside><label>Learning goal<select value={skillId} onChange={event => changeSkill(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><label>Number talk<select value={mode} onChange={event => { setMode(event.target.value); setRevealed(false); }}>{profile.modes.map(id => <option key={id} value={id}>{MATHS_PRESENTATION_MODE_LABELS[id]}</option>)}</select></label><label>Quantity <output aria-live="polite">{quantity}</output><input aria-label="Presentation quantity" type="range" min={profile.minimum} max={profile.maximum} value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label>{mode === "flash" && <button onClick={flash} type="button">Flash for 1.5 seconds</button>}<button onClick={() => setRevealed(value => !value)} type="button">{revealed ? "Hide teacher reveal" : "Reveal teacher prompt"}</button></aside><div className="maths-presentation-stage"><p>{prompt}</p><div className={mode === "flash" && !flashing ? "maths-flash-cover" : ""}><PresentationModels mode={mode} profile={profile} quantity={quantity} /></div>{revealed && <aside className="maths-teacher-reveal"><strong>{mode === "truefalse" ? "Answer and reasoning" : "Listen for"}</strong><span>{mode === "truefalse" ? `${trueFalse.answer ? "True" : "False"}. Ask the learner to prove it with the model.` : mathsSkillById[skillId].vocabulary.join(", ")}</span></aside>}</div></section>;
}

function WorksheetVisual({ task }) {
  if (task.kind === "part_whole") return <div className="maths-print-part-whole"><strong>{task.whole}</strong><span>{task.known}</span><span>?</span></div>;
  if (task.kind === "number_line") return <div className="maths-print-number-line" aria-label={`Number line from zero to ${task.maximum}`}><div>{Array.from({ length: task.maximum + 1 }, (_, number) => <span className={number === task.start ? "is-start" : number === task.end ? "is-end" : ""} key={number}>{number}</span>)}</div><small>Draw hops above the line.</small></div>;
  if (task.kind === "dot_match") return <div className="maths-print-dot-match"><div>{Array.from({ length: task.value }, (_, index) => <i key={index} />)}</div><p>{task.options.map(option => <span key={option}>{option}</span>)}</p></div>;
  if (task.kind === "compare") return <div className="maths-print-compare" aria-label={`${task.left} objects on the left and ${task.right} on the right`}><div>{Array.from({ length: task.left }, (_, index) => <i key={index} />)}</div><strong>more · fewer · same</strong><div>{Array.from({ length: task.right }, (_, index) => <i key={index} />)}</div></div>;
  if (task.kind === "cut_build") return <div className="maths-print-cut-build">{task.cards.map((card, index) => <span key={`${card}-${index}`}>{card}</span>)}</div>;
  return <div className={`maths-print-frame cells-${task.capacity}`}>{Array.from({ length: task.capacity }, (_, index) => <span key={index} />)}</div>;
}

function WorksheetStudio() {
  const [skillId, setSkillId] = useState("F-N-PART-10");
  const [template, setTemplate] = useState("frame");
  const [version, setVersion] = useState("A");
  const [level, setLevel] = useState("core");
  const templates = worksheetTemplatesForSkill(skillId);
  const tasks = buildMathsWorksheetTasks({ skillId, template, version, level });
  const changeSkill = nextSkillId => {
    setSkillId(nextSkillId);
    const nextTemplates = worksheetTemplatesForSkill(nextSkillId);
    setTemplate(nextTemplates[0].id);
  };
  return <section className="maths-worksheet-studio"><aside><label>Learning goal<select value={skillId} onChange={event => changeSkill(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><label>Template<select value={template} onChange={event => setTemplate(event.target.value)}>{templates.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Level<select value={level} onChange={event => setLevel(event.target.value)}>{Object.entries(MATHS_WORKSHEET_LEVELS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label><label>Balanced version<select value={version} onChange={event => setVersion(event.target.value)}><option value="A">Version A</option><option value="B">Version B</option></select></label><button onClick={() => window.print()} type="button">Print worksheet + answers</button></aside><div className="maths-print-sheet"><header><div><small>{MATHS_WORKSHEET_LEVELS[level].label} · Version {version}</small><h2>{mathsSkillById[skillId].childLabel}</h2></div><span>Name ____________________</span></header><ol>{tasks.map(task => <li key={task.id}><p>{task.prompt}</p><WorksheetVisual task={task} /></li>)}</ol><footer>Maths practice · no speed score · each picture is part of the task</footer><section className="maths-answer-page"><h2>Teacher answer guide · {MATHS_WORKSHEET_LEVELS[level].label} · Version {version}</h2><ol>{tasks.map(task => <li key={task.id}>{task.answer}</li>)}</ol></section></div></section>;
}

function Reports({ client, classId, students }) {
  const [events, setEvents] = useState([]);
  const [syncHealth, setSyncHealth] = useState([]);
  const [state, setState] = useState(classId ? "loading" : "no-class");
  const [studentId, setStudentId] = useState("");
  const [skillId, setSkillId] = useState("F-N-PART-10");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateWindow, setDateWindow] = useState("90");
  const [reportNow] = useState(() => Date.now());
  useEffect(() => {
    let current = true;
    if (!classId) return undefined;
    Promise.resolve()
      .then(() => { if (current) setState("loading"); return Promise.all([readTeacherMathsEvidence({ client, classId, limit: 5_000 }), readTeacherMathsSyncHealth({ client, classId })]); })
      .then(([rows, health]) => { if (current) { setEvents(rows); setSyncHealth(health); setState("ready"); } })
      .catch(() => { if (current) setState("error"); });
    return () => { current = false; };
  }, [classId, client]);
  const visibleEvents = useMemo(() => {
    const oldest = dateWindow === "all" ? 0 : reportNow - Number(dateWindow) * 86_400_000;
    return events.filter(event => (sourceFilter === "all" || (event.evidence?.source || event.eventType) === sourceFilter) && (!oldest || new Date(event.occurredAt).getTime() >= oldest));
  }, [dateWindow, events, reportNow, sourceFilter]);
  const report = buildMathsLearnerReport(visibleEvents, studentId);
  const classReport = buildMathsClassReport(visibleEvents, students);
  const classSkill = classReport.find(row => row.skillId === skillId) || classReport[0];
  const selectedSync = studentId ? syncHealth.find(row => row.studentId === studentId) : null;
  const pendingCount = syncHealth.reduce((sum, row) => sum + Number(row.pending || 0), 0);
  const rejectedCount = syncHealth.reduce((sum, row) => sum + Number(row.rejected || 0), 0);
  const syncMessage = studentId
    ? selectedSync ? `${selectedSync.pending} pending · ${selectedSync.rejected} rejected · last report ${new Date(selectedSync.reportedAt).toLocaleString()}` : "No device sync report yet for this learner."
    : `${syncHealth.length} learner device${syncHealth.length === 1 ? "" : "s"} reported · ${pendingCount} pending · ${rejectedCount} rejected`;
  const sources = [...new Set(events.map(event => event.evidence?.source || event.eventType).filter(Boolean))].sort();
  const exportCsv = () => {
    const header = ["learner", "skill", "status", "freshness", "basis", "next_action"];
    const rows = students.flatMap(student => buildMathsLearnerReport(visibleEvents, student.id).map(row => [student.name, row.label, row.status, row.freshness, row.evidenceNote, row.nextAction]));
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `maths-formative-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return <section className="maths-reports"><div className="maths-report-controls"><label>View<select value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">Whole class distribution</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>{!studentId && <label>Learning goal<select value={skillId} onChange={event => setSkillId(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label>}<label>Evidence source<select value={sourceFilter} onChange={event => setSourceFilter(event.target.value)}><option value="all">All sources</option>{sources.map(source => <option key={source} value={source}>{source.replaceAll("_", " ")}</option>)}</select></label><label>Date range<select value={dateWindow} onChange={event => setDateWindow(event.target.value)}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="180">Last 180 days</option><option value="all">All loaded evidence</option></select></label><div className="maths-report-actions"><button onClick={exportCsv} type="button">Export CSV</button><button onClick={() => window.print()} type="button">Print report</button></div><p><strong>Secure is disabled.</strong> Statuses describe the available formative evidence; they are not calibrated mastery levels.</p>{events.length >= 5000 && <p className="maths-inline-warning" role="status">This view reached the 5,000-event safety limit. Narrow the date or source filter before drawing a class-wide conclusion.</p>}<p className={rejectedCount ? "maths-sync-health is-alert" : "maths-sync-health"}><strong>Evidence sync:</strong> {syncMessage}</p></div>{state === "no-class" && <div className="maths-empty-state"><h2>Choose a class first</h2><p>Reports never combine evidence across classes.</p></div>}{state === "loading" && <p role="status">Loading Maths evidence…</p>}{state === "error" && <div className="maths-empty-state"><h2>Evidence could not be loaded</h2><p>Nothing has been treated as missing. Refresh and try again.</p></div>}{state === "ready" && !studentId && classSkill && <div className="maths-class-distribution"><header><div><p>Selected learning goal</p><h2>{classSkill.label}</h2></div><strong>{classSkill.checkedCount} of {classSkill.learnerCount} learners with evidence</strong></header><div className="maths-status-distribution">{MATHS_EVIDENCE_STATUSES.map(status => <article key={status}><span className={`maths-status is-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span><strong>{classSkill.statusCounts[status] || 0}</strong></article>)}</div><div className="maths-class-learner-rows">{classSkill.learnerRows.map(({ student, report: row }) => <article key={student.id}><strong>{student.name}</strong><span className={`maths-status is-${row.status.toLowerCase().replaceAll(" ", "-")}`}>{row.status}</span><small>{row.evidenceNote}</small></article>)}</div><p><strong>Next teaching action:</strong> {classSkill.nextAction}</p></div>}{state === "ready" && studentId && <div className="maths-report-table" role="table" aria-label="Maths skill evidence"><div role="row"><strong role="columnheader">Learning goal</strong><strong role="columnheader">Current evidence</strong><strong role="columnheader">Basis</strong><strong role="columnheader">Next teaching action</strong></div>{report.map(row => <article key={row.skillId} role="row"><div role="cell"><strong>{row.label}</strong><small>{row.skillId}</small></div><div role="cell"><span className={`maths-status is-${row.status.toLowerCase().replaceAll(" ", "-")}`}>{row.status}</span><small>{row.freshness}</small></div><div role="cell"><span>{row.evidenceNote}</span>{row.possiblePatterns.length > 0 && <><small>Pattern to check across repeated items: {row.possiblePatterns.join(", ")}</small><small>{row.checkQuestion}</small></>}</div><div role="cell"><p>{row.nextAction}</p><details><summary>View evidence items</summary><ul>{visibleEvents.filter(event => event.studentId === studentId && event.skillId === row.skillId).slice(-20).reverse().map(event => <li key={event.id || `${event.occurredAt}-${event.evidence?.itemKey}`}><strong>{new Date(event.occurredAt).toLocaleDateString()}</strong> · {(event.evidence?.source || event.eventType).replaceAll("_", " ")} · {(event.evidence?.representation || "representation not recorded").replaceAll("_", " ")}</li>)}</ul></details></div></article>)}</div>}</section>;
}

function SmallGroups({ client, teacherId, classId, students }) {
  const [events, setEvents] = useState([]);
  const [evidenceState, setEvidenceState] = useState(classId ? "loading" : "no-class");
  const [skillId, setSkillId] = useState("F-N-PART-10");
  const [selected, setSelected] = useState([]);
  const [duration, setDuration] = useState(12);
  const [saveState, setSaveState] = useState("");
  useEffect(() => {
    let current = true;
    if (!classId) return undefined;
    Promise.resolve()
      .then(() => { if (current) setEvidenceState("loading"); return readTeacherMathsEvidence({ client, classId, limit: 5000 }); })
      .then(rows => { if (current) { setEvents(rows); setEvidenceState("ready"); } })
      .catch(() => { if (current) setEvidenceState("error"); });
    return () => { current = false; };
  }, [classId, client]);
  const groups = buildMathsClassGroups(events, students, skillId);
  const recipes = mathsActivityRecipesBySkill[skillId];
  const plan = useMemo(() => buildMathsSmallGroupPlan({ skillId, duration, recipes }), [duration, recipes, skillId]);
  const recordObservation = async (student, outcome) => {
    setSaveState("Saving observation…");
    try {
      const result = await recordTeacherMathsEvidence({ client, teacherId, classId, studentId: student.id, skillId, eventType: "lesson_exit_observation", contentVersion: MATHS_CONTENT_VERSION, evidence: { schemaVersion: 1, source: "small_group_exit", sessionId: `teacher-${classId}-${skillId}-${new Date().toISOString().slice(0, 10)}`, lessonDurationMinutes: duration, outcome, representation: plan.at(-1).manipulativeId, recipeIds: plan.map(recipe => recipe.id) } });
      setSaveState(result.cloudSaved ? `Saved for ${student.name}.` : result.queued ? "Saved on this device; it will sync automatically." : "The observation could not be saved.");
    } catch {
      setSaveState("The observation could not be saved. Nothing was marked as missing or incorrect.");
    }
  };
  const groupLabels = { notChecked: "Not checked — gather neutral evidence", reconnect: "Reconnect", build: "Build", extend: "Extend" };
  return <section className="maths-small-groups"><aside><label>Target skill<select value={skillId} onChange={event => setSkillId(event.target.value)}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><fieldset><legend>Lesson length</legend>{[8, 12, 20].map(value => <button className={duration === value ? "is-selected" : ""} key={value} onClick={() => setDuration(value)} type="button">{value} min</button>)}</fieldset><div className="maths-suggested-groups"><strong>Evidence-informed suggestions for this goal</strong>{evidenceState === "loading" && <p role="status">Loading class evidence…</p>}{evidenceState === "error" && <p className="maths-inline-error" role="alert">Class evidence could not be loaded. Suggested groups are paused so missing data is not treated as “Not checked”.</p>}{evidenceState === "ready" && Object.entries(groups).map(([key, rows]) => <button key={key} onClick={() => setSelected(rows.map(row => row.student.id))} type="button"><span>{groupLabels[key] || key}</span><small>{rows.length} learners</small></button>)}</div><fieldset className="maths-learner-list"><legend>Learners ({selected.length} selected)</legend>{students.map(student => <label key={student.id}><input checked={selected.includes(student.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, student.id] : ids.filter(id => id !== student.id))} type="checkbox" />{student.name}</label>)}</fieldset></aside><div className="maths-group-plan"><header><p>{duration}-minute lesson · {selected.length} learners</p><h2>{mathsSkillById[skillId].childLabel}</h2></header><ol>{plan.map((recipe, index) => <li key={recipe.id}><span>{index + 1}</span><div><small>{recipe.minutes} min · {recipe.phase}</small><h3>{recipe.instructionText}</h3><MathsAudioButton client={client} compact requestId={recipe.instructionAudioId} /><p><strong>Look and listen for:</strong> {recipe.likelyResponse}</p><p><strong>Diagnostic check:</strong> {recipe.teacherCheck}</p><p><strong>If the model does not yet match:</strong> {recipe.repair}</p></div></li>)}</ol><section className="maths-exit-observation"><h3>Exit observation</h3><p>Record only what you directly observed. “Not checked” is valid and creates no negative result.</p>{students.filter(student => selected.includes(student.id)).map(student => <div key={student.id}><strong>{student.name}</strong><button onClick={() => recordObservation(student, "demonstrated")} type="button">Demonstrated</button><button onClick={() => recordObservation(student, "not_yet")} type="button">Not yet</button><button onClick={() => recordObservation(student, "not_checked")} type="button">Not checked</button></div>)}<p role="status">{saveState}</p></section></div></section>;
}

export function MathsTeacherWorkspace({ mode = "overview", className = "", studentCount = null, classId = "", students = [], client, teacherId, onNavigate }) {
  const tabs = [["overview", "Home", House], ["present", "Present", ProjectorScreen], ["groups", "Groups", UsersThree], ["assessments", "Checks", ClipboardText], ["reports", "Reports", ChartBar], ["worksheets", "Worksheets", Printer], ["resources", "Resources", Books]];
  return <main className="maths-teacher-workspace maths-teacher-workspace-v2" data-maths-teacher-mode={mode}><nav aria-label="Maths teacher tools" className="maths-teacher-tabs">{tabs.map(([id, label, Icon]) => <button aria-current={mode === id ? "page" : undefined} key={id} onClick={() => onNavigate(id)} type="button"><Icon aria-hidden="true" size={18} weight={mode === id ? "fill" : "regular"} />{label}</button>)}</nav><Header className={className} mode={mode} studentCount={studentCount} />{mode === "overview" && <Overview onNavigate={onNavigate} studentCount={studentCount} />}{mode === "assessments" && <CheckLauncher onNavigate={onNavigate} />}{mode === "resources" && <ResourceLibrary classId={classId} client={client} students={students} />}{mode === "present" && <Presentation />}{mode === "worksheets" && <WorksheetStudio />}{mode === "reports" && <Reports classId={classId} client={client} students={students} />}{mode === "groups" && <SmallGroups classId={classId} client={client} students={students} teacherId={teacherId} />}</main>;
}
