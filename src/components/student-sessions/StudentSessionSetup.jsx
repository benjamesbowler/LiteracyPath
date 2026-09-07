import { useEffect, useMemo, useState } from "react";

import { startStudentFocusSession } from "../../data/studentFocusSessionCore.js";
import {
  STUDENT_ADVENTURE_MAP_MODES,
  STUDENT_CYCLE_PRACTICE_MODES,
  STUDENT_FOCUS_AUDIENCES,
  STUDENT_SKILL_ASSIGNMENT_MODES,
  buildStudentFocusAssignments,
  hasCompleteStudentFocusSkillsEvidence,
  resolveStudentFocusAudience
} from "../../policy/studentFocusAssignments.js";
import {
  STUDENT_FOCUS_TARGET_OPTIONS,
  STUDENT_FOCUS_TARGETS
} from "../../policy/studentFocusTargets.js";
import { guidedReadingBandLabel, guidedReadingModeLabel } from "../../policy/guidedReadingCatalogPolicy.js";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";

const GUIDED_READING_TOGETHER = "guided_reading";
const ADVENTURE_MAP_SPACE_COUNT = 27;

function buildAdventureMapSpaces(cycles, landmarksByPart, parts) {
  const cycleByNumber = new Map(
    cycles
      .filter(cycle => Number.isInteger(cycle?.cycleNumber))
      .map(cycle => [cycle.cycleNumber, cycle])
  );

  return Array.from({ length: ADVENTURE_MAP_SPACE_COUNT }, (_, index) => {
    const cycleNumber = index + 1;
    const cycle = cycleByNumber.get(cycleNumber);
    const part = parts.find(item => cycleNumber >= item.first && cycleNumber <= item.last);
    const spaceName = part
      ? landmarksByPart?.[part.id]?.[cycleNumber - part.first]
      : "";
    if (!cycle?.id || cycle.id !== `cycle-${cycleNumber}` || !part || !spaceName) {
      throw new Error("Adventure Map catalogue is incomplete.");
    }
    return {
      cycleId: cycle.id,
      cycleNumber,
      cycleTitle: cycle.title,
      partId: part.id,
      partName: part.name,
      spaceName
    };
  });
}

function activityLabel(target) {
  if (target === STUDENT_FOCUS_TARGETS.ARCADE_GAME) return "One Game";
  return STUDENT_FOCUS_TARGET_OPTIONS.find(option => option.id === target)?.label || "Student session";
}

export function StudentSessionSetup({
  client,
  classId,
  className = "",
  students = [],
  classDashboard = [],
  assessmentHistory = [],
  assessmentHistoryReady = false,
  assessmentHistoryLoading = false,
  skillTree = [],
  initialStudentIds = [],
  initialTarget = STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT,
  onClose,
  onStarted,
  onStartGuidedReading
}) {
  const availableStudents = useMemo(
    () => students.filter(student => student?.id && !student.archived_at),
    [students]
  );
  const requestedStudentIds = useMemo(() => {
    const requested = new Set(initialStudentIds.filter(Boolean).map(String));
    return availableStudents
      .filter(student => requested.has(String(student.id)))
      .map(student => student.id);
  }, [availableStudents, initialStudentIds]);
  const hasRequestedStudentIds = initialStudentIds.some(Boolean);
  const startsWithWholeClass = !hasRequestedStudentIds
    || (availableStudents.length > 0 && requestedStudentIds.length === availableStudents.length);

  const [target, setTarget] = useState(initialTarget);
  const [audience, setAudience] = useState(() => startsWithWholeClass
    ? STUDENT_FOCUS_AUDIENCES.WHOLE_CLASS
    : STUDENT_FOCUS_AUDIENCES.SELECTED_STUDENTS);
  const [selectedStudentIds, setSelectedStudentIds] = useState(() => (
    startsWithWholeClass ? [] : requestedStudentIds
  ));
  const [skillAssignmentMode, setSkillAssignmentMode] = useState(
    STUDENT_SKILL_ASSIGNMENT_MODES.EACH_CHILD_NEXT
  );
  const [commonSkillId, setCommonSkillId] = useState(() => skillTree[0]?.id || "");
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [bookLoadStatus, setBookLoadStatus] = useState("idle");
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState("");
  const [gameLoadStatus, setGameLoadStatus] = useState("idle");
  const [adventureMapMode, setAdventureMapMode] = useState(
    STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT
  );
  const [mapSpaces, setMapSpaces] = useState([]);
  const [mapSpaceId, setMapSpaceId] = useState("");
  const [mapSpaceLoadStatus, setMapSpaceLoadStatus] = useState("idle");
  const [cycleOptions, setCycleOptions] = useState([]);
  const [cycleLoadStatus, setCycleLoadStatus] = useState("idle");
  const [cyclePracticeMode, setCyclePracticeMode] = useState(
    STUDENT_CYCLE_PRACTICE_MODES.ONE_CYCLE_FOR_EVERYONE
  );
  const [commonCycleId, setCommonCycleId] = useState("cycle-1");
  const [cycleByStudent, setCycleByStudent] = useState({});
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (target !== STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK) return undefined;
    let active = true;
    Promise.all([
      import("../../utils/guidedReading/runtimeBooks.js"),
      import("../../data/guidedReadingPublication.js")
    ]).then(async ([runtimeModule, publicationModule]) => {
      const reviewState = await publicationModule.loadGuidedReadingBookReviews({ client });
      if (!active) return;
      if (!reviewState.complete) {
        setBooks([]);
        setBookId("");
        setBookLoadStatus("error");
        return;
      }
      const quarantinedBookIds = publicationModule.quarantinedGuidedReadingBookIds(reviewState.rows);
      const publishedBooks = publicationModule.filterPublishedGuidedReadingBooks(
        runtimeModule.getRuntimeGuidedReadingBooks(),
        quarantinedBookIds
      );
      setBooks(publishedBooks);
      setBookId(current => publishedBooks.some(book => book.id === current) ? current : "");
      setBookLoadStatus("ready");
    }).catch(() => {
      if (!active) return;
      setBooks([]);
      setBookId("");
      setBookLoadStatus("error");
    });
    return () => { active = false; };
  }, [catalogReloadKey, client, target]);

  useEffect(() => {
    if (target !== STUDENT_FOCUS_TARGETS.ARCADE_GAME) return undefined;
    let active = true;
    import("../../data/learnGamesData.js").then(module => {
      if (!active) return;
      const availableGames = module.GAME_LIST.filter(game => game?.id && !game.hidden);
      setGames(availableGames);
      setGameId(current => availableGames.some(game => game.id === current) ? current : "");
      setGameLoadStatus("ready");
    }).catch(() => {
      if (!active) return;
      setGames([]);
      setGameId("");
      setGameLoadStatus("error");
    });
    return () => { active = false; };
  }, [catalogReloadKey, target]);

  useEffect(() => {
    if (target !== STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE) return undefined;
    let active = true;
    import("../../data/elSkillsBlockCycles.js").then(module => {
      if (!active) return;
      const cycles = module.elSkillsBlockCycles.filter(cycle => Number.isInteger(cycle?.cycleNumber));
      setCycleOptions(cycles);
      setCommonCycleId(current => cycles.some(cycle => cycle.id === current) ? current : cycles[0]?.id || "");
      setCycleByStudent(current => Object.fromEntries(
        Object.entries(current).filter(([studentId]) => availableStudents.some(student => String(student.id) === String(studentId)))
      ));
      setCycleLoadStatus("ready");
    }).catch(() => {
      if (!active) return;
      setCycleOptions([]);
      setCycleLoadStatus("error");
    });
    return () => { active = false; };
  }, [availableStudents, catalogReloadKey, target]);

  useEffect(() => {
    if (target !== STUDENT_FOCUS_TARGETS.ADVENTURE_MAP) return undefined;
    let active = true;
    Promise.all([
      import("../../data/elSkillsBlockCycles.js"),
      import("../../data/mapStops.js"),
      import("../../policy/childTrailPolicy.js")
    ]).then(([cyclesModule, mapModule, trailModule]) => {
      if (!active) return;
      const availableMapSpaces = buildAdventureMapSpaces(
        cyclesModule.elSkillsBlockCycles,
        mapModule.WORLD_LANDMARKS_WIDE,
        trailModule.ADVENTURE_MAP_PARTS
      );
      setMapSpaces(availableMapSpaces);
      setMapSpaceId(current => (
        availableMapSpaces.some(space => space.cycleId === current) ? current : ""
      ));
      setMapSpaceLoadStatus("ready");
    }).catch(() => {
      if (!active) return;
      setMapSpaces([]);
      setMapSpaceId("");
      setMapSpaceLoadStatus("error");
    });
    return () => { active = false; };
  }, [catalogReloadKey, target]);

  const dashboardById = useMemo(
    () => new Map(classDashboard.map(row => [String(row.id), row])),
    [classDashboard]
  );
  const audienceSelection = useMemo(() => resolveStudentFocusAudience({
    audience,
    students: availableStudents,
    selectedStudentIds
  }), [audience, availableStudents, selectedStudentIds]);
  const validSelectedStudentCount = useMemo(() => {
    const selected = new Set(selectedStudentIds.map(String));
    return availableStudents.filter(student => selected.has(String(student.id))).length;
  }, [availableStudents, selectedStudentIds]);
  const selectedBook = useMemo(
    () => books.find(book => book.id === bookId) || null,
    [bookId, books]
  );
  const selectedGame = useMemo(
    () => games.find(game => game.id === gameId) || null,
    [gameId, games]
  );
  const selectedMapSpace = useMemo(
    () => mapSpaces.find(space => space.cycleId === mapSpaceId) || null,
    [mapSpaceId, mapSpaces]
  );
  const commonCycle = useMemo(
    () => cycleOptions.find(cycle => cycle.id === commonCycleId) || null,
    [commonCycleId, cycleOptions]
  );
  const mapSpaceGroups = useMemo(() => (
    [...new Set(mapSpaces.map(space => space.partName))].map(partName => ({
      partName,
      spaces: mapSpaces.filter(space => space.partName === partName)
    }))
  ), [mapSpaces]);
  const resolvedCommonSkillId = skillTree.some(skill => skill.id === commonSkillId)
    ? commonSkillId
    : skillTree[0]?.id || "";
  const assignments = useMemo(() => buildStudentFocusAssignments({
    target,
    students: audienceSelection.students,
    classDashboard,
    skillTree,
    assessmentHistory,
    skillAssignmentMode,
    commonSkillId: resolvedCommonSkillId,
    selectedBook,
    selectedGame,
    adventureMapMode,
    selectedMapSpace,
    cyclePracticeMode,
    commonCycle,
    cycleByStudent
  }), [
    adventureMapMode,
    assessmentHistory,
    audienceSelection.students,
    classDashboard,
    commonCycle,
    cycleByStudent,
    cyclePracticeMode,
    resolvedCommonSkillId,
    selectedBook,
    selectedGame,
    selectedMapSpace,
    skillAssignmentMode,
    skillTree,
    target
  ]);
  const skillsEvidenceReady = hasCompleteStudentFocusSkillsEvidence({
    assessmentHistoryReady,
    students: audienceSelection.students,
    classDashboard
  });
  const skillsAssignmentsReady = target !== STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT
    || audienceSelection.students.every(student => assignments[student.id]?.skill_id);
  const exactChoiceReady = target === STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK
    ? bookLoadStatus === "ready" && Boolean(selectedBook)
    : target === STUDENT_FOCUS_TARGETS.ARCADE_GAME
      ? gameLoadStatus === "ready" && Boolean(selectedGame)
      : target === STUDENT_FOCUS_TARGETS.ADVENTURE_MAP
        ? adventureMapMode === STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT
          || (mapSpaceLoadStatus === "ready" && Boolean(selectedMapSpace))
      : target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE
        ? cycleLoadStatus === "ready"
          && Boolean(commonCycle)
          && (cyclePracticeMode === STUDENT_CYCLE_PRACTICE_MODES.ONE_CYCLE_FOR_EVERYONE
            || audienceSelection.students.every(student => cycleOptions.some(cycle => cycle.id === cycleByStudent?.[student.id]?.id)))
      : true;
  const canStart = audienceSelection.students.length > 0
    && exactChoiceReady
    && skillsAssignmentsReady
    && (target !== STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT || skillsEvidenceReady)
    && !busy;

  function chooseTarget(nextTarget) {
    if (nextTarget !== target && nextTarget === STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK) {
      setBookLoadStatus("loading");
    }
    if (nextTarget !== target && nextTarget === STUDENT_FOCUS_TARGETS.ARCADE_GAME) {
      setGameLoadStatus("loading");
    }
    if (nextTarget !== target && nextTarget === STUDENT_FOCUS_TARGETS.ADVENTURE_MAP) {
      setMapSpaceLoadStatus("loading");
    }
    if (nextTarget !== target && nextTarget === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE) {
      setCycleLoadStatus("loading");
    }
    setTarget(nextTarget);
    setMessage("");
  }

  function chooseAudience(nextAudience) {
    setAudience(nextAudience);
    setMessage("");
  }

  function retryCatalog(kind) {
    if (kind === "book") setBookLoadStatus("loading");
    if (kind === "game") setGameLoadStatus("loading");
    if (kind === "map") setMapSpaceLoadStatus("loading");
    if (kind === "cycle") setCycleLoadStatus("loading");
    setCatalogReloadKey(current => current + 1);
  }

  function toggleStudent(studentId) {
    setMessage("");
    setSelectedStudentIds(current => current.includes(studentId)
      ? current.filter(id => id !== studentId)
      : [...current, studentId]);
  }

  async function start() {
    if (busy) return;
    if (target === GUIDED_READING_TOGETHER) {
      onClose?.();
      onStartGuidedReading?.();
      return;
    }
    if (!audienceSelection.students.length) {
      setMessage("Choose at least one student before starting this session.");
      return;
    }
    if (target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT && !skillsEvidenceReady) {
      setMessage(assessmentHistoryLoading
        ? "The complete saved assessment history must finish loading before this session can start."
        : "The complete saved assessment history is unavailable. Try loading it again before starting this session.");
      return;
    }
    if (!exactChoiceReady) {
      if (target === STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK) {
        setMessage("Choose one available Guided Reading book before starting.");
      } else if (target === STUDENT_FOCUS_TARGETS.ARCADE_GAME) {
        setMessage("Choose one available game before starting.");
      } else if (target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE) {
        setMessage("Choose a cycle for this session, or set one for every selected student.");
      } else {
        setMessage("Choose one available Adventure Map space before starting.");
      }
      return;
    }
    if (!skillsAssignmentsReady) {
      setMessage("Choose a valid skill before starting the assessment.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const data = await startStudentFocusSession({
        client,
        classId,
        target,
        wholeClass: audienceSelection.wholeClass,
        studentIds: audienceSelection.studentIds,
        assignments,
        durationMinutes
      });
      if (data?.ok === false) {
        const busyStudent = availableStudents.find(student => student.id === data.student_id);
        setMessage(data.error === "student_busy"
          ? `${busyStudent?.name || "That student"} is already in another teacher-controlled session.`
          : "The student session could not start. The class roster or selected content may have changed. Check it and try again.");
        return;
      }
      onStarted?.(data.session);
    } catch {
      setMessage("The student session could not start. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const selectedActivityLabel = activityLabel(target);
  const chosenSkill = skillTree.find(skill => skill.id === resolvedCommonSkillId);
  const chosenContentLabel = target === STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK
    ? selectedBook?.title || ""
    : target === STUDENT_FOCUS_TARGETS.ARCADE_GAME
      ? selectedGame?.title || ""
      : target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT
        ? skillAssignmentMode === STUDENT_SKILL_ASSIGNMENT_MODES.ONE_SKILL_FOR_EVERYONE
          ? chosenSkill?.label || ""
          : "Each child's next skill"
    : target === STUDENT_FOCUS_TARGETS.ADVENTURE_MAP
          ? adventureMapMode === STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT
            ? "Each child's current space"
            : selectedMapSpace
              ? `${selectedMapSpace.spaceName}, Cycle ${selectedMapSpace.cycleNumber}`
              : ""
        : target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE
          ? cyclePracticeMode === STUDENT_CYCLE_PRACTICE_MODES.ONE_CYCLE_FOR_EVERYONE
            ? commonCycle?.title || ""
            : "Each student’s selected cycle"
        : "";
  const audienceLabel = audienceSelection.wholeClass
    ? `Whole class, ${audienceSelection.students.length} active student${audienceSelection.students.length === 1 ? "" : "s"}`
    : `${audienceSelection.students.length} selected student${audienceSelection.students.length === 1 ? "" : "s"}`;
  const startButtonLabel = audienceSelection.wholeClass
    ? "Start for whole class"
    : `Start for ${audienceSelection.students.length} student${audienceSelection.students.length === 1 ? "" : "s"}`;

  return (
    <div className="student-session-modal-backdrop">
      <TeacherDialog busy={busy} className="student-session-setup" label="Start student session" onClose={onClose}>
        <header className="student-session-setup-header">
          <div>
            <p className="panel-label">Student sessions</p>
            <h2>Control student iPads</h2>
            <p>{className ? `${className} · ` : ""}Choose one activity, its exact content when needed, and who should use it.</p>
          </div>
          <button className="lp-button lp-button-secondary" onClick={onClose} type="button">Close</button>
        </header>

        <section className="student-session-section" aria-labelledby="student-session-activity-title">
          <h3 id="student-session-activity-title">1. Choose the activity</h3>
          <div className="student-session-targets">
            {STUDENT_FOCUS_TARGET_OPTIONS.map(option => (
              <button
                aria-pressed={target === option.id}
                className={target === option.id ? "selected" : ""}
                key={option.id}
                onClick={() => chooseTarget(option.id)}
                type="button"
              >
                <strong>{activityLabel(option.id)}</strong>
                <span>{option.description}</span>
              </button>
            ))}
            <button
              aria-pressed={target === GUIDED_READING_TOGETHER}
              className={target === GUIDED_READING_TOGETHER ? "selected" : ""}
              onClick={() => chooseTarget(GUIDED_READING_TOGETHER)}
              type="button"
            >
              <strong>Guided Reading Together</strong>
              <span>Teacher-led shared reading with one book and a group of up to six students.</span>
            </button>
          </div>

          {target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT && (
            <fieldset className="student-session-activity-config">
              <legend>Skills choice</legend>
              <div className="student-session-config-options">
                <button
                  aria-pressed={skillAssignmentMode === STUDENT_SKILL_ASSIGNMENT_MODES.EACH_CHILD_NEXT}
                  className={skillAssignmentMode === STUDENT_SKILL_ASSIGNMENT_MODES.EACH_CHILD_NEXT ? "selected" : ""}
                  onClick={() => {
                    setSkillAssignmentMode(STUDENT_SKILL_ASSIGNMENT_MODES.EACH_CHILD_NEXT);
                    setMessage("");
                  }}
                  type="button"
                >
                  <strong>Each child&apos;s next skill</strong>
                  <span>Use each child&apos;s current skill and next eligible phase.</span>
                </button>
                <button
                  aria-pressed={skillAssignmentMode === STUDENT_SKILL_ASSIGNMENT_MODES.ONE_SKILL_FOR_EVERYONE}
                  className={skillAssignmentMode === STUDENT_SKILL_ASSIGNMENT_MODES.ONE_SKILL_FOR_EVERYONE ? "selected" : ""}
                  onClick={() => {
                    setSkillAssignmentMode(STUDENT_SKILL_ASSIGNMENT_MODES.ONE_SKILL_FOR_EVERYONE);
                    setMessage("");
                  }}
                  type="button"
                >
                  <strong>One skill for everyone</strong>
                  <span>Use one skill, while keeping each child at their own next eligible phase.</span>
                </button>
              </div>
              {skillAssignmentMode === STUDENT_SKILL_ASSIGNMENT_MODES.ONE_SKILL_FOR_EVERYONE && (
                <label htmlFor="student-session-common-skill">
                  Skill for everyone
                  <select
                    id="student-session-common-skill"
                    value={resolvedCommonSkillId}
                    onChange={event => {
                      setCommonSkillId(event.target.value);
                      setMessage("");
                    }}
                  >
                    {skillTree.map(skill => <option key={skill.id} value={skill.id}>{skill.label}</option>)}
                  </select>
                </label>
              )}
            </fieldset>
          )}

          {target === STUDENT_FOCUS_TARGETS.ADVENTURE_MAP && (
            <fieldset className="student-session-activity-config">
              <legend>Map choice</legend>
              <div className="student-session-config-options">
                <button
                  aria-pressed={adventureMapMode === STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT}
                  className={adventureMapMode === STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT ? "selected" : ""}
                  onClick={() => {
                    setAdventureMapMode(STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT);
                    setMessage("");
                  }}
                  type="button"
                >
                  <strong>Each child&apos;s current space</strong>
                  <span>Open the map at each child&apos;s own saved place.</span>
                </button>
                <button
                  aria-pressed={adventureMapMode === STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE}
                  className={adventureMapMode === STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE ? "selected" : ""}
                  onClick={() => {
                    setAdventureMapMode(STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE);
                    setMessage("");
                  }}
                  type="button"
                >
                  <strong>One space for everyone</strong>
                  <span>Open the same map space for every chosen student.</span>
                </button>
              </div>
              {adventureMapMode === STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE && (
                <>
                  <label htmlFor="student-session-map-space">
                    Adventure Map space
                    <select
                      disabled={mapSpaceLoadStatus !== "ready"}
                      id="student-session-map-space"
                      value={mapSpaceId}
                      onChange={event => {
                        setMapSpaceId(event.target.value);
                        setMessage("");
                      }}
                    >
                      <option value="">Choose one map space</option>
                      {mapSpaceGroups.map(group => (
                        <optgroup key={group.partName} label={group.partName}>
                          {group.spaces.map(space => (
                            <option key={space.cycleId} value={space.cycleId}>
                              {space.spaceName} · {space.cycleTitle}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  {mapSpaceLoadStatus === "loading" && <p role="status">Loading Adventure Map spaces…</p>}
                  {mapSpaceLoadStatus === "error" && (
                    <div className="student-session-catalog-error">
                      <p role="alert">The Adventure Map spaces could not be loaded.</p>
                      <button className="text-button" onClick={() => retryCatalog("map")} type="button">Try loading map spaces again</button>
                    </div>
                  )}
                </>
              )}
            </fieldset>
          )}

          {target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE && (
            <fieldset className="student-session-activity-config">
              <legend>Choose a cycle</legend>
              <p className="student-session-cycle-help">
                {cyclePracticeMode === STUDENT_CYCLE_PRACTICE_MODES.CYCLE_PER_STUDENT
                  ? "Use the selected cycle as the default, then adjust any student below."
                  : "Everyone starts in the same Cycle Practice activity."}
              </p>
              <div className="student-session-cycle-picker" aria-label="Cycle choices">
                {cycleOptions.map(cycle => (
                  <button
                    key={cycle.id}
                    aria-pressed={commonCycleId === cycle.id}
                    className={commonCycleId === cycle.id ? "selected" : ""}
                    disabled={cycleLoadStatus !== "ready"}
                    onClick={() => {
                      setCommonCycleId(cycle.id);
                      setMessage("");
                    }}
                    type="button"
                  >
                    <span>Cycle {cycle.cycleNumber}</span>
                    <strong>{cycle.title}</strong>
                  </button>
                ))}
              </div>
              {cycleLoadStatus === "loading" && <p role="status">Loading Cycle Practice cycles…</p>}
              {cycleLoadStatus === "error" && (
                <div className="student-session-catalog-error">
                  <p role="alert">Cycle Practice cycles could not be loaded.</p>
                  <button className="text-button" onClick={() => retryCatalog("cycle")} type="button">Try loading cycles again</button>
                </div>
              )}
              {cyclePracticeMode === STUDENT_CYCLE_PRACTICE_MODES.CYCLE_PER_STUDENT && (
                <div className="student-session-cycle-list">
                  <p>Set the exact cycle for each selected student.</p>
                  {audienceSelection.students.map(student => (
                    <label key={student.id} htmlFor={`student-session-cycle-${student.id}`}>
                      {student.name}
                      <select
                        disabled={cycleLoadStatus !== "ready"}
                        id={`student-session-cycle-${student.id}`}
                        value={cycleByStudent[student.id]?.id || commonCycleId}
                        onChange={event => {
                          const cycle = cycleOptions.find(option => option.id === event.target.value);
                          setCycleByStudent(current => ({ ...current, [student.id]: cycle }));
                          setMessage("");
                        }}
                      >
                        {cycleOptions.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.title}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              <button
                className="student-session-cycle-advanced"
                aria-pressed={cyclePracticeMode === STUDENT_CYCLE_PRACTICE_MODES.CYCLE_PER_STUDENT}
                onClick={() => {
                  setCyclePracticeMode(current => current === STUDENT_CYCLE_PRACTICE_MODES.CYCLE_PER_STUDENT
                    ? STUDENT_CYCLE_PRACTICE_MODES.ONE_CYCLE_FOR_EVERYONE
                    : STUDENT_CYCLE_PRACTICE_MODES.CYCLE_PER_STUDENT);
                  setMessage("");
                }}
                type="button"
              >
                {cyclePracticeMode === STUDENT_CYCLE_PRACTICE_MODES.CYCLE_PER_STUDENT
                  ? "Use one cycle for everyone"
                  : "Set a different cycle for each student"}
              </button>
            </fieldset>
          )}

          {target === STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK && (
            <div className="student-session-activity-config">
              <label htmlFor="student-session-book">
                Guided Reading book
                <select
                  disabled={bookLoadStatus !== "ready"}
                  id="student-session-book"
                  value={bookId}
                  onChange={event => {
                    setBookId(event.target.value);
                    setMessage("");
                  }}
                >
                  <option value="">Choose one available book</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} ({guidedReadingBandLabel(book.readingBandProfile, book.level)}, {guidedReadingModeLabel(book.readingMode)}, {book.pages.length} pages)
                    </option>
                  ))}
                </select>
              </label>
              {bookLoadStatus === "loading" && <p role="status">Loading available books…</p>}
              {bookLoadStatus === "error" && (
                <div className="student-session-catalog-error">
                  <p role="alert">Available books could not be verified. Try again when the connection is available.</p>
                  <button className="text-button" onClick={() => retryCatalog("book")} type="button">Try loading books again</button>
                </div>
              )}
              {bookLoadStatus === "ready" && books.length === 0 && <p>No available Guided Reading books were found.</p>}
            </div>
          )}

          {target === STUDENT_FOCUS_TARGETS.ARCADE_GAME && (
            <div className="student-session-activity-config">
              <label htmlFor="student-session-game">
                Game
                <select
                  disabled={gameLoadStatus !== "ready"}
                  id="student-session-game"
                  value={gameId}
                  onChange={event => {
                    setGameId(event.target.value);
                    setMessage("");
                  }}
                >
                  <option value="">Choose one available game</option>
                  {games.map(game => (
                    <option key={game.id} value={game.id}>{game.title} ({game.skill})</option>
                  ))}
                </select>
              </label>
              {gameLoadStatus === "loading" && <p role="status">Loading available games…</p>}
              {gameLoadStatus === "error" && (
                <div className="student-session-catalog-error">
                  <p role="alert">The available games could not be loaded.</p>
                  <button className="text-button" onClick={() => retryCatalog("game")} type="button">Try loading games again</button>
                </div>
              )}
              {gameLoadStatus === "ready" && games.length === 0 && <p>No available games were found.</p>}
            </div>
          )}
        </section>

        {target !== GUIDED_READING_TOGETHER && (
          <section className="student-session-section" aria-labelledby="student-session-students-title">
            <h3 id="student-session-students-title">2. Choose who uses it</h3>
            <div className="student-session-audience-options" role="group" aria-labelledby="student-session-students-title">
              <button
                aria-pressed={audience === STUDENT_FOCUS_AUDIENCES.WHOLE_CLASS}
                className={audience === STUDENT_FOCUS_AUDIENCES.WHOLE_CLASS ? "selected" : ""}
                onClick={() => chooseAudience(STUDENT_FOCUS_AUDIENCES.WHOLE_CLASS)}
                type="button"
              >
                <strong>Whole class</strong>
                <span>Every active student in this class. The active roster is checked again when the session starts.</span>
              </button>
              <button
                aria-pressed={audience === STUDENT_FOCUS_AUDIENCES.SELECTED_STUDENTS}
                className={audience === STUDENT_FOCUS_AUDIENCES.SELECTED_STUDENTS ? "selected" : ""}
                onClick={() => chooseAudience(STUDENT_FOCUS_AUDIENCES.SELECTED_STUDENTS)}
                type="button"
              >
                <strong>Choose students</strong>
                <span>{validSelectedStudentCount
                  ? `${validSelectedStudentCount} currently selected.`
                  : "Pick one or more students from the class list."}</span>
              </button>
            </div>
            {availableStudents.length === 0 && <p className="student-session-audience-note" role="status">No active students are available in this class.</p>}
            {target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT
              && audienceSelection.students.length > 0
              && !skillsEvidenceReady
              && <p className="student-session-audience-note" role="status">{assessmentHistoryLoading
                ? "Complete assessment history is still loading."
                : "Complete assessment history is unavailable. Reload it before starting a Skills session."}</p>}

            {audience === STUDENT_FOCUS_AUDIENCES.SELECTED_STUDENTS && (
              <div className="student-session-selected-audience">
                <div className="student-session-section-heading">
                  <p aria-live="polite">{audienceLabel}</p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSelectedStudentIds([]);
                      setMessage("");
                    }}
                    type="button"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="student-session-student-list">
                  {availableStudents.map(student => {
                    const dashboard = dashboardById.get(String(student.id));
                    const assignment = assignments[student.id];
                    return (
                      <label key={student.id}>
                        <input
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          type="checkbox"
                        />
                        <span>
                          <strong>{student.name}</strong>
                          <small>{target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT
                            ? dashboard?.evidenceReadStatus === "complete"
                              ? assignment?.skill_id
                                ? `${assignment.skill_label}, Level ${assignment.level} phase ${assignment.phase}`
                                : "No eligible skill is available"
                              : "Assessment evidence still loading"
                            : student.symbol_password ? "Ready to sign in" : "Sign-in pictures needed"}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {target !== GUIDED_READING_TOGETHER && (
          <section className="student-session-section student-session-start" aria-labelledby="student-session-finish-title">
            <div>
              <h3 id="student-session-finish-title">3. Check and start</h3>
              <p className="student-session-start-summary">
                <strong>{selectedActivityLabel}{chosenContentLabel ? `: ${chosenContentLabel}` : ""}</strong>
                <span>{audienceLabel}</span>
              </p>
              <label htmlFor="student-session-expiry">
                Safety expiry
                <select
                  id="student-session-expiry"
                  value={durationMinutes}
                  onChange={event => setDurationMinutes(Number(event.target.value))}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>2 hours</option>
                </select>
              </label>
            </div>
            <button
              className="lp-button lp-button-primary"
              disabled={!canStart}
              onClick={start}
              type="button"
            >
              {busy ? "Starting…" : startButtonLabel}
            </button>
          </section>
        )}

        {target === GUIDED_READING_TOGETHER && (
          <section className="student-session-section student-session-guided-start" aria-labelledby="student-session-guided-title">
            <div>
              <h3 id="student-session-guided-title">2. Choose the book and reading group</h3>
              <p>Guided Reading Together is a separate teacher-led session for up to six students.</p>
            </div>
            <button className="lp-button lp-button-primary" onClick={start} type="button">Choose book and up to six students</button>
          </section>
        )}
        {message && <p className="student-session-message" role="alert">{message}</p>}
      </TeacherDialog>
    </div>
  );
}
