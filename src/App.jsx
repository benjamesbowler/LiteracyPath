import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import "./App.css";
import { supabase } from "./supabaseClient";
import { getMasteryRule } from "./masterySystem";
import { skillTree } from "./skillTree";
import {
  AdminDashboardPage,
  AdvancedPhonicsPatternAssessmentPage,
  AssessmentPage,
  AuthPage,
  DashboardSummary,
  FinishedReportPage,
  LetterAssessmentPage,
  QuestionFlagDialog,
  StudentOverviewPage,
  StudentSelectPage,
  TopNavigation
} from "./components/AppPages";

import { masteryCoreQuestions } from "./data/masteryCoreQuestions";
import { masteryExtraQuestions } from "./data/masteryExtraQuestions";

import { templateQuestions } from "./data/templateQuestions";
import { templateExpansion } from "./data/templateExpansion";
import { templateExpansion2 } from "./data/templateExpansion2";
import { templateExpansion3 } from "./data/templateExpansion3";
import { templateExpansion4 } from "./data/templateExpansion4";
import { templateExpansion5 } from "./data/templateExpansion5";
import { templateExpansion6 } from "./data/templateExpansion6";
import { templateExpansion7 } from "./data/templateExpansion7";
import { generatedQuestions } from "./data/generatedQuestions";
import { fixSentenceQuestions } from "./data/fixSentenceQuestions";
import { templateComprehensionAdvanced } from "./data/templateComprehensionAdvanced";
import { advancedPhonicsPatterns } from "./data/advancedPhonicsPatterns";
import { audioManifest, audioTextIndex } from "./data/audioManifest";
import {
  applyQuestionFormatMetadata,
  getQuestionFormatMetadata,
  isMasteryEligible
} from "./questionFormatFramework";

// dynamic mastery system

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function getStageIndex(question) {
  const skill = normalize(question.skill);

  const exactIndex = skillTree.findIndex(stage =>
    stage.match.some(term => skill === normalize(term))
  );

  if (exactIndex !== -1) return exactIndex;

  return skillTree.findIndex(stage =>
    stage.match.some(term =>
      skill.includes(normalize(term)) ||
      normalize(term).includes(skill)
    )
  );
}

function isFixSentenceQuestion(question) {
  return question?.questionType === "fix_sentence";
}

function normalizeSentenceAnswer(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function comparableSentenceAnswer(text) {
  return normalizeSentenceAnswer(text).toLowerCase();
}

function getQuestionPrompt(question) {
  return question.prompt || question.question || "";
}

function getQuestionAnswer(question) {
  return isFixSentenceQuestion(question)
    ? question.correctSentence
    : question.answer;
}

function normalizeItemKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/^\/|\/$/g, "")
    .trim();
}

function inferItemMetadata(question) {
  if (!question) return null;
  if (question.itemKey && question.itemType) {
    return {
      itemKey: normalizeItemKey(question.itemKey),
      itemType: question.itemType
    };
  }

  const skill = normalize(question.skill);
  const answer = normalizeItemKey(getQuestionAnswer(question));
  const diagnosticTarget = normalizeItemKey(question.diagnosticTarget || "");
  const text = normalizeItemKey([
    question.question,
    question.spokenPrompt,
    question.audioText,
    question.answer,
    question.passage
  ].filter(Boolean).join(" "));

  if (!answer) return null;

  if (skill.includes("high-frequency") || skill.includes("sight")) {
    return { itemKey: answer, itemType: "sight_word" };
  }

  if (skill.includes("rhym")) {
    const rhymeMatch = text.match(/rhymes? with ([a-z]+)/);
    const family = rhymeMatch?.[1]?.slice(-2) || answer.slice(-2);
    return family ? { itemKey: family, itemType: "rhyming_family" } : null;
  }

  if (skill.includes("initial")) {
    const soundMatch = text.match(/\/([a-z]{1,3})\//);
    return {
      itemKey: soundMatch?.[1] || answer[0],
      itemType: "initial_sound"
    };
  }

  if (skill.includes("letter sound")) {
    const soundMatch = text.match(/letter ['"]?([a-z])['"]?/);
    return {
      itemKey: soundMatch?.[1] || answer[0],
      itemType: "letter_sound"
    };
  }

  if (skill.includes("cvc")) {
    return { itemKey: answer, itemType: "cvc_word" };
  }

  if (skill.includes("short vowel")) {
    const vowel = ["a", "e", "i", "o", "u"].find(letter => answer.includes(letter));
    return vowel ? { itemKey: vowel, itemType: "short_vowel" } : null;
  }

  if (skill.includes("blend")) {
    const match = text.match(/\b(bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr|sc|sk|sm|sn|sp|st|sw)\b/);
    return { itemKey: match?.[1] || answer.slice(0, 2), itemType: "phonics_pattern" };
  }

  if (skill.includes("digraph")) {
    const match = text.match(/\b(sh|ch|th|wh|ph)\b/);
    return { itemKey: match?.[1] || answer.slice(0, 2), itemType: "phonics_pattern" };
  }

  if (skill.includes("long vowel")) {
    const match = text.match(/long ([aeiou])/);
    return match ? { itemKey: match[1] + "_e", itemType: "phonics_pattern" } : null;
  }

  if (skill.includes("vowel team")) {
    const match = text.match(/\b(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew|oi|oy|ou|aw)\b/);
    return match ? { itemKey: match[1], itemType: "phonics_pattern" } : null;
  }

  if (skill.includes("r-controlled") || skill.includes("r controlled")) {
    const match = text.match(/\b(ar|er|ir|or|ur)\b/);
    return match ? { itemKey: match[1], itemType: "phonics_pattern" } : null;
  }

  if (diagnosticTarget && /^(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew|oi|oy|ou|aw|ar|er|ir|or|ur|sh|ch|th|wh|ph|[a-z]{1,2})/.test(diagnosticTarget)) {
    return { itemKey: diagnosticTarget.split(/\s+/)[0], itemType: "phonics_pattern" };
  }

  return null;
}

function applyItemMetadata(question) {
  const metadata = inferItemMetadata(question);
  return metadata
    ? { ...question, itemKey: metadata.itemKey, itemType: metadata.itemType }
    : question;
}

function isMissingTableError(error, tableName) {
  return error?.code === "42P01" || new RegExp("relation .*" + tableName + ".* does not exist", "i").test(error?.message || "");
}

function isMissingItemMasteryTableError(error) {
  return isMissingTableError(error, "item_mastery");
}

function calculateWeaknessSnapshot(answerHistory) {
  const groupedTargets = new Map();
  const groupedStages = new Map();

  answerHistory.forEach(record => {
    const stage = record.stage || record.skill || "Unknown skill";
    const target = record.diagnosticTarget || "general";
    const targetKey = `${stage}::${target}`;

    if (!groupedTargets.has(targetKey)) {
      groupedTargets.set(targetKey, {
        stage,
        skill: record.skill || stage,
        target,
        correct: 0,
        incorrect: 0,
        total: 0
      });
    }

    if (!groupedStages.has(stage)) {
      groupedStages.set(stage, {
        stage,
        correct: 0,
        incorrect: 0,
        total: 0
      });
    }

    const targetStats = groupedTargets.get(targetKey);
    const stageStats = groupedStages.get(stage);

    targetStats.total += 1;
    stageStats.total += 1;

    if (record.isCorrect) {
      targetStats.correct += 1;
      stageStats.correct += 1;
    } else {
      targetStats.incorrect += 1;
      stageStats.incorrect += 1;
    }
  });

  const withScores = stats => ({
    ...stats,
    accuracy: stats.total ? stats.correct / stats.total : 0,
    weaknessScore: stats.incorrect * 2 + (stats.total ? 1 - stats.correct / stats.total : 0)
  });

  const targets =
    [...groupedTargets.values()].map(withScores);

  const stages =
    [...groupedStages.values()].map(withScores);

  const needsPractice =
    targets
      .filter(item => item.incorrect > 0)
      .sort((a, b) =>
        b.weaknessScore - a.weaknessScore ||
        a.accuracy - b.accuracy ||
        b.total - a.total
      );

  const strongest =
    targets
      .filter(item => item.total >= 2 && item.accuracy >= 0.8)
      .sort((a, b) =>
        b.accuracy - a.accuracy ||
        b.total - a.total
      );

  return {
    stages,
    targets,
    strongest,
    needsPractice,
    suggestedNextFocus: needsPractice[0] || null
  };
}

function isQuestionValid(q) {
  if (!q) return false;
  if (!q.id || !q.skill || !getQuestionPrompt(q) || !getQuestionAnswer(q)) return false;

  if (isFixSentenceQuestion(q)) {
    const tiles = q.tiles || q.choices;

    if (!q.brokenSentence || !Array.isArray(tiles) || tiles.length < 2) return false;
    return getStageIndex(q) !== -1;
  }

  if (!Array.isArray(q.choices) || q.choices.length < 2) return false;
  if (!q.choices.includes(q.answer)) return false;

  const lowerChoices = q.choices.map(c => normalize(c));
  if (new Set(lowerChoices).size !== lowerChoices.length) return false;

  const questionText = normalize(q.question);
  const allText = [q.question, q.skill, q.passage, ...q.choices].join(" ").toLowerCase();

  if (questionText.includes("silent letter")) return false;
  if (allText.includes("sun") && allText.includes("son") && allText.includes("middle")) return false;
  if (questionText.includes("which word spells")) return false;
  if (questionText.includes("matches the picture") && !q.imagePath) return false;

  return getStageIndex(q) !== -1;
}

const allQuestions = [
  ...masteryCoreQuestions,
  ...masteryExtraQuestions,
  ...templateQuestions,
  ...templateExpansion,
  ...templateExpansion2,
  ...templateExpansion3,
  ...templateExpansion4,
  ...templateExpansion5,
  ...templateExpansion6,
  ...templateExpansion7,
  ...generatedQuestions,
  ...fixSentenceQuestions,
  ...templateComprehensionAdvanced
].filter(isQuestionValid).map(question =>
  applyQuestionFormatMetadata(applyItemMetadata(question))
);

const letterAssessmentOrder = [
  "m", "T", "b", "S", "a", "F", "d", "R", "p", "E", "g", "H", "c",
  "M", "t", "B", "s", "A", "f", "D", "r", "P", "e", "G", "h", "C",
  "y", "K", "o", "J", "w", "Z", "x", "V", "l", "N", "q", "U", "i",
  "Y", "k", "O", "j", "W", "z", "X", "v", "L", "n", "Q", "u", "I"
];

export default function App() {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [classDashboard, setClassDashboard] = useState([]);
  const [showClassDashboard, setShowClassDashboard] = useState(false);
  const [appView, setAppView] = useState("select");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [roundAnswers, setRoundAnswers] = useState([]);
  const [usedByStage, setUsedByStage] = useState({});
  const [mastery, setMastery] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [message, setMessage] = useState("");
  const [teacherUser, setTeacherUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminFlagStatusFilter, setAdminFlagStatusFilter] = useState("open");
  const [adminFlags, setAdminFlags] = useState([]);
  const [adminTeachers, setAdminTeachers] = useState([]);
  const [adminClasses, setAdminClasses] = useState([]);
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagIssueType, setFlagIssueType] = useState("Confusing wording");
  const [flagNote, setFlagNote] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctAnswered, setCorrectAnswered] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [allowPassageAudio, setAllowPassageAudio] = useState(false);

  const [assessmentMode, setAssessmentMode] =
    useState("mastery");

  const [letterIndex, setLetterIndex] =
    useState(0);

  const [letterAssessment, setLetterAssessment] =
    useState([]);

  const [patternIndex, setPatternIndex] =
    useState(0);

  const [patternAssessment, setPatternAssessment] =
    useState([]);

  const [patternAttempt, setPatternAttempt] =
    useState(0);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [itemMastery, setItemMastery] = useState({});
  const [itemSessionSeen, setItemSessionSeen] = useState({});

  const currentStage = skillTree[currentSkillIndex];

  const masteryRule =
    getMasteryRule(currentStage.label);

  const ROUND_LENGTH =
    masteryRule.roundLength;

  const PASS_SCORE =
    masteryRule.passScore;

  const currentStageQuestions =
    allQuestions.filter(q =>
      getStageIndex(q) === currentSkillIndex
    );

  const weaknessSnapshot =
    calculateWeaknessSnapshot(answerHistory);

  const teacherId =
    teacherUser?.id || null;

  const profileStorageKey =
    teacherId ? `readingMasteryProfile:${teacherId}` : null;

  function clearTeacherState() {
    setStudentName("");
    setStudentId(null);
    setStudentList([]);
    setClassList([]);
    setSelectedClassId(null);
    setNewClassName("");
    setClassDashboard([]);
    setShowClassDashboard(false);
    setAppView("select");
    setNameSaved(false);
    setCurrentSkillIndex(0);
    setRoundAnswers([]);
    setUsedByStage({});
    setMastery({});
    setCurrentQuestion(null);
    setFeedback(null);
    setMessage("");
    setFlagDialogOpen(false);
    setAdminFlags([]);
    setAdminTeachers([]);
    setAdminClasses([]);
    setAdminStudents([]);
    setIsAdmin(false);
    setTotalAnswered(0);
    setCorrectAnswered(0);
    setShowReport(false);
    setAssessmentMode("mastery");
    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setAnswerHistory([]);
    setItemMastery({});
    setItemSessionSeen({});
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setTeacherUser(data.session?.user || null);
      setAuthReady(true);
    });

    const { data: authListener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setTeacherUser(session?.user || null);
        setAuthReady(true);
      });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!teacherId) {
      setIsAdmin(false);
      return;
    }

    checkAdminStatus(teacherId);
  }, [teacherId]);

  useEffect(() => {
    if (isAdmin && appView === "admin") {
      loadAdminDashboard(adminFlagStatusFilter);
    }
  }, [isAdmin, appView]);

  useEffect(() => {
    if (!authReady) return;

    setProfileLoaded(false);

    if (!teacherId || !profileStorageKey) {
      clearTeacherState();
      setProfileLoaded(true);
      return;
    }

    loadClasses();

    const saved = localStorage.getItem(profileStorageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        const savedStudentName = data.studentName || "";
        const savedClassId = data.selectedClassId || null;

        setStudentName(savedStudentName);
        setStudentId(data.studentId || null);
        setSelectedClassId(savedClassId);
        setNameSaved(Boolean(savedStudentName));
        setAppView(data.appView || (savedStudentName ? "overview" : "select"));
        setAssessmentMode(data.assessmentMode || "mastery");
        setCurrentSkillIndex(data.currentSkillIndex || 0);
        setRoundAnswers(data.roundAnswers || []);
        setUsedByStage(data.usedByStage || {});
        setMastery(data.mastery || {});
        setTotalAnswered(data.totalAnswered || 0);
        setCorrectAnswered(data.correctAnswered || 0);
        setLetterIndex(data.letterIndex || 0);
        setLetterAssessment(data.letterAssessment || []);
        setPatternIndex(data.patternIndex || 0);
        setPatternAssessment(data.patternAssessment || []);
        setPatternAttempt(data.patternAttempt || 0);
        setAnswerHistory(data.answerHistory || []);
        setItemMastery(data.itemMastery || {});
        setItemSessionSeen({});

        loadStudents(savedClassId);
      } catch (error) {
        console.warn("Could not restore saved reading profile.", error);
        localStorage.removeItem(profileStorageKey);
        loadStudents();
      }
    } else {
      loadStudents();
    }

    setProfileLoaded(true);
  }, [authReady, teacherId, profileStorageKey]);

  useEffect(() => {
    if (!profileLoaded || !profileStorageKey) return;

    localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        studentName,
        studentId,
        selectedClassId,
        appView,
        assessmentMode,
        currentSkillIndex,
        roundAnswers,
        usedByStage,
        mastery,
        totalAnswered,
        correctAnswered,
        letterIndex,
        letterAssessment,
        patternIndex,
        patternAssessment,
        patternAttempt,
        answerHistory,
        itemMastery
      })
    );
  }, [
    profileLoaded,
    studentName,
    studentId,
    selectedClassId,
    appView,
    assessmentMode,
    currentSkillIndex,
    roundAnswers,
    usedByStage,
    mastery,
    totalAnswered,
    correctAnswered,
    letterIndex,
    letterAssessment,
    patternIndex,
    patternAssessment,
    patternAttempt,
    answerHistory,
    itemMastery,
    profileStorageKey
  ]);


  async function checkAdminStatus(userId = teacherId) {
    if (!userId) {
      setIsAdmin(false);
      return false;
    }

    const { data, error } = await supabase
      .from("app_admins")
      .select("id, user_id, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (!isMissingTableError(error, "app_admins")) {
        console.warn("Admin status check failed.", error);
      }
      setIsAdmin(false);
      return false;
    }

    const nextIsAdmin = Boolean(data?.user_id);
    setIsAdmin(nextIsAdmin);
    return nextIsAdmin;
  }

  function buildTeacherRows(classes = [], students = [], answers = [], flags = []) {
    const teacherMap = new Map();

    function ensureTeacher(id, email = "") {
      if (!id) return null;
      if (!teacherMap.has(id)) {
        teacherMap.set(id, {
          id,
          email: email || "Email unavailable",
          classes: 0,
          students: 0,
          answers: 0,
          flags: 0
        });
      }

      const row = teacherMap.get(id);
      if (email && row.email === "Email unavailable") row.email = email;
      return row;
    }

    classes.forEach(row => {
      const teacher = ensureTeacher(row.teacher_id);
      if (teacher) teacher.classes += 1;
    });

    students.forEach(row => {
      const teacher = ensureTeacher(row.teacher_id);
      if (teacher) teacher.students += 1;
    });

    answers.forEach(row => {
      const teacher = ensureTeacher(row.teacher_id);
      if (teacher) teacher.answers += 1;
    });

    flags.forEach(row => {
      const teacher = ensureTeacher(row.teacher_id, row.teacher_email);
      if (teacher) teacher.flags += 1;
    });

    return [...teacherMap.values()].sort((a, b) => a.email.localeCompare(b.email));
  }

  async function loadAdminDashboard(statusFilter = adminFlagStatusFilter) {
    if (!isAdmin) return;

    setAdminLoading(true);

    const flagQuery = supabase
      .from("question_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") flagQuery.eq("status", statusFilter);

    const [flagsResult, classesResult, studentsResult, answersResult] = await Promise.all([
      flagQuery,
      supabase.from("classes").select("id, name, teacher_id, created_at").order("created_at", { ascending: false }),
      supabase.from("students").select("id, name, class_id, teacher_id, created_at").order("created_at", { ascending: false }),
      supabase.from("answers").select("id, teacher_id, student_id")
    ]);

    setAdminLoading(false);

    const firstError = flagsResult.error || classesResult.error || studentsResult.error || answersResult.error;
    if (firstError) {
      console.error("Admin dashboard load error:", firstError);
      setMessage("Could not load admin dashboard. Check admin RLS policies and migration.");
      return;
    }

    const classes = classesResult.data || [];
    const students = studentsResult.data || [];
    const flags = flagsResult.data || [];
    const answers = answersResult.data || [];
    const classById = new Map(classes.map(row => [row.id, row]));
    const studentById = new Map(students.map(row => [row.id, row]));
    const studentCounts = new Map();

    students.forEach(student => {
      studentCounts.set(student.class_id, (studentCounts.get(student.class_id) || 0) + 1);
    });

    const flagsWithNames = flags.map(flag => ({
      ...flag,
      class_name: classById.get(flag.class_id)?.name || "Class unavailable",
      student_name: studentById.get(flag.student_id)?.name || "Student unavailable"
    }));

    const classRows = classes.map(row => ({
      ...row,
      studentCount: studentCounts.get(row.id) || 0
    }));

    const studentRows = students.map(row => ({
      ...row,
      className: classById.get(row.class_id)?.name || "Class unavailable"
    }));

    setAdminFlags(flagsWithNames);
    setAdminClasses(classRows);
    setAdminStudents(studentRows);
    setAdminTeachers(buildTeacherRows(classes, students, answers, flags));
  }

  function openAdminDashboard() {
    setAppView("admin");
    loadAdminDashboard(adminFlagStatusFilter);
  }

  async function updateQuestionFlagStatus(flagId, status) {
    if (!isAdmin || !flagId) return;

    const patch = status === "resolved"
      ? {
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: teacherId
        }
      : {
          status: "open",
          resolved_at: null,
          resolved_by: null
        };

    const { error } = await supabase
      .from("question_flags")
      .update(patch)
      .eq("id", flagId);

    if (error) {
      console.error("Update question flag error:", error);
      setMessage("Could not update question flag.");
      return;
    }

    await loadAdminDashboard(adminFlagStatusFilter);
    setMessage(status === "resolved" ? "Flag marked resolved." : "Flag reopened.");
  }

  async function deleteOptionalTableRows(tableName, columnName, values) {
    if (!values || values.length === 0) return null;

    const { error } = await supabase
      .from(tableName)
      .delete()
      .in(columnName, values);

    if (error && !isMissingTableError(error, tableName)) return error;
    return null;
  }

  async function adminDeleteStudent(selectedStudentId, selectedStudentName = "this student") {
    if (!isAdmin || !selectedStudentId) return;

    const confirmed = window.confirm(
      `Admin delete ${selectedStudentName}? This removes the student and associated assessment data.`
    );

    if (!confirmed) return;

    const ids = [selectedStudentId];
    const errors = [];

    for (const [tableName, columnName] of [
      ["answers", "student_id"],
      ["mastery", "student_id"],
      ["item_mastery", "student_id"],
      ["assessment_sessions", "student_id"],
      ["question_flags", "student_id"]
    ]) {
      const error = await deleteOptionalTableRows(tableName, columnName, ids);
      if (error) errors.push(error);
    }

    const { error: studentError } = await supabase
      .from("students")
      .delete()
      .eq("id", selectedStudentId);

    if (studentError) errors.push(studentError);

    if (errors.length > 0) {
      console.error("Admin delete student error:", errors[0]);
      setMessage("Could not delete student from admin dashboard.");
      return;
    }

    await loadAdminDashboard(adminFlagStatusFilter);
    setMessage(`Deleted ${selectedStudentName}.`);
  }

  async function adminDeleteClass(classId, className = "this class") {
    if (!isAdmin || !classId) return;

    const confirmed = window.confirm(
      `Admin delete ${className}? This removes the class, its students, and associated assessment data.`
    );

    if (!confirmed) return;

    const { data: students, error: lookupError } = await supabase
      .from("students")
      .select("id")
      .eq("class_id", classId);

    if (lookupError) {
      console.error("Admin class student lookup error:", lookupError);
      setMessage("Could not delete class from admin dashboard.");
      return;
    }

    const studentIds = (students || []).map(row => row.id);
    const errors = [];

    if (studentIds.length > 0) {
      for (const [tableName, columnName] of [
        ["answers", "student_id"],
        ["mastery", "student_id"],
        ["item_mastery", "student_id"],
        ["assessment_sessions", "student_id"],
        ["question_flags", "student_id"]
      ]) {
        const error = await deleteOptionalTableRows(tableName, columnName, studentIds);
        if (error) errors.push(error);
      }
    }

    const { error: flagClassError } = await supabase
      .from("question_flags")
      .delete()
      .eq("class_id", classId);

    if (flagClassError && !isMissingTableError(flagClassError, "question_flags")) errors.push(flagClassError);

    const { error: studentsError } = await supabase
      .from("students")
      .delete()
      .eq("class_id", classId);

    if (studentsError) errors.push(studentsError);

    const { error: classError } = await supabase
      .from("classes")
      .delete()
      .eq("id", classId);

    if (classError) errors.push(classError);

    if (errors.length > 0) {
      console.error("Admin delete class error:", errors[0]);
      setMessage("Could not delete class from admin dashboard.");
      return;
    }

    await loadAdminDashboard(adminFlagStatusFilter);
    setMessage(`Deleted ${className}.`);
  }

  async function signUpTeacher() {
    const email = authEmail.trim();
    if (!email || !authPassword) {
      setAuthMessage("Enter an email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password: authPassword
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Account created. Check your email if confirmation is enabled, then log in.");
  }

  async function logInTeacher() {
    const email = authEmail.trim();
    if (!email || !authPassword) {
      setAuthMessage("Enter an email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: authPassword
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthPassword("");
    setAuthMessage("");
  }

  async function logOutTeacher() {
    await supabase.auth.signOut();
    clearTeacherState();
    setAuthPassword("");
    setAuthMessage("Logged out.");
  }

  async function loadClasses() {
    if (!teacherId) {
      setClassList([]);
      return;
    }

    const { data, error } = await supabase
      .from("classes")
      .select("id, name, created_at")
      .eq("teacher_id", teacherId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Load classes error:", error);
      setMessage("Could not load classes from cloud.");
      return;
    }

    setClassList(data || []);
  }

  async function createClass() {
    const clean = newClassName.trim();
    if (!clean) return;

    if (!teacherId) {
      setMessage("Please log in first.");
      return;
    }

    const { data, error } = await supabase
      .from("classes")
      .insert({ name: clean, teacher_id: teacherId })
      .select()
      .single();

    if (error) {
      console.error("Create class error:", error);
      setMessage("Could not create class.");
      return;
    }

    setNewClassName("");
    setSelectedClassId(data.id);
    await loadClasses();
    await loadStudents(data.id);
    setMessage(`Class created: ${clean}`);
  }

  async function loadStudents(classId = selectedClassId) {
    if (!teacherId || !classId) {
      setStudentList([]);
      setLoadingStudents(false);
      return;
    }

    setLoadingStudents(true);

    const { data, error } = await supabase
      .from("students")
      .select("id, name, class_id, created_at")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Load students error:", error);
      setMessage("Could not load students from cloud.");
      setLoadingStudents(false);
      return;
    }

    setStudentList(data || []);
    setLoadingStudents(false);
  }

  async function loadClassDashboard(classId = selectedClassId) {
    if (!teacherId) {
      setMessage("Please log in first.");
      return;
    }

    if (!classId) {
      setMessage("Select a class first.");
      return;
    }

    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id, name, created_at")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .order("name", { ascending: true });

    if (studentsError) {
      console.error("Dashboard students error:", studentsError);
      setMessage("Could not load class dashboard.");
      return;
    }

    const studentIds =
      (students || []).map(s => s.id);

    if (studentIds.length === 0) {
      setClassDashboard([]);
      setShowClassDashboard(true);
      return;
    }

    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .eq("teacher_id", teacherId)
      .in("student_id", studentIds)
      .order("answered_at", { ascending: true });

    if (answersError) {
      console.error("Dashboard answers error:", answersError);
    }


    const { data: masteryRows, error: masteryError } = await supabase
      .from("mastery")
      .select("*")
      .eq("teacher_id", teacherId)
      .in("student_id", studentIds)
      .order("updated_at", { ascending: true });

    if (masteryError) {
      console.error("Dashboard mastery error:", masteryError);
    }

    const rows =
      (students || []).map(student => {
        const studentAnswers =
          (answers || []).filter(a =>
            a.student_id === student.id
          );

        const studentMastery =
          (masteryRows || []).filter(m =>
            m.student_id === student.id
          );

        const correct =
          studentAnswers.filter(a => a.is_correct).length;

        const accuracy =
          studentAnswers.length === 0
            ? 0
            : Math.round((correct / studentAnswers.length) * 100);

        const mastered =
          studentMastery.filter(m => m.mastered);

        const masteredIds =
          new Set(mastered.map(m => m.skill_id));

        const firstUnmastered =
          skillTree.find(stage =>
            !masteredIds.has(stage.id)
          );

        const lastAnswer =
          studentAnswers[studentAnswers.length - 1];

        return {
          id: student.id,
          name: student.name,
          answered: studentAnswers.length,
          correct,
          accuracy,
          masteredCount: mastered.length,
          currentSkill: firstUnmastered?.label || "Completed",
          lastActive: lastAnswer?.answered_at || "No activity yet"
        };
      });

    setClassDashboard(rows);
    setShowClassDashboard(true);
  }

  async function deleteStudent(selectedStudentId, selectedStudentName = "this student") {
    if (!teacherId || !selectedStudentId) return;

    const confirmed = window.confirm(
      `Delete ${selectedStudentName}? This removes the student and their assessment records.`
    );

    if (!confirmed) return;

    const { error: answersError } = await supabase
      .from("answers")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId);

    const { error: masteryError } = await supabase
      .from("mastery")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId);

    const { error: itemMasteryError } = await supabase
      .from("item_mastery")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId);

    const { error: studentError } = await supabase
      .from("students")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("id", selectedStudentId);

    const blockingItemMasteryError =
      itemMasteryError && !isMissingItemMasteryTableError(itemMasteryError);

    if (answersError || masteryError || blockingItemMasteryError || studentError) {
      console.error("Delete student error:", answersError || masteryError || blockingItemMasteryError || studentError);
      setMessage("Could not delete student.");
      return;
    }

    if (studentId === selectedStudentId) {
      setStudentId(null);
      setStudentName("");
      setNameSaved(false);
      setAnswerHistory([]);
      setItemMastery({});
      setItemSessionSeen({});
      setMastery({});
      setRoundAnswers([]);
      setCurrentQuestion(null);
      setFeedback(null);
      setAppView("select");
    }

    await loadStudents(selectedClassId);
    await loadClassDashboard(selectedClassId);
    setMessage(`Deleted ${selectedStudentName}.`);
  }

  async function deleteClass(classId = selectedClassId) {
    if (!teacherId || !classId) return;

    const className =
      classList.find(cls => cls.id === classId)?.name || "this class";

    const confirmed = window.confirm(
      `Delete ${className}? This removes the class, students, answers, and mastery records.`
    );

    if (!confirmed) return;

    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId);

    if (studentsError) {
      console.error("Delete class student lookup error:", studentsError);
      setMessage("Could not delete class.");
      return;
    }

    const studentIds =
      (students || []).map(student => student.id);

    if (studentIds.length > 0) {
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .eq("teacher_id", teacherId)
        .in("student_id", studentIds);

      const { error: masteryError } = await supabase
        .from("mastery")
        .delete()
        .eq("teacher_id", teacherId)
        .in("student_id", studentIds);

      const { error: itemMasteryError } = await supabase
        .from("item_mastery")
        .delete()
        .eq("teacher_id", teacherId)
        .in("student_id", studentIds);

      const blockingItemMasteryError =
        itemMasteryError && !isMissingItemMasteryTableError(itemMasteryError);

      if (answersError || masteryError || blockingItemMasteryError) {
        console.error("Delete class data error:", answersError || masteryError || blockingItemMasteryError);
        setMessage("Could not delete class data.");
        return;
      }
    }

    const { error: deleteStudentsError } = await supabase
      .from("students")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("class_id", classId);

    const { error: deleteClassError } = await supabase
      .from("classes")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("id", classId);

    if (deleteStudentsError || deleteClassError) {
      console.error("Delete class error:", deleteStudentsError || deleteClassError);
      setMessage("Could not delete class.");
      return;
    }

    if (selectedClassId === classId) {
      setSelectedClassId(null);
      setStudentList([]);
      setClassDashboard([]);
      setShowClassDashboard(false);
    }

    if (studentId && studentIds.includes(studentId)) {
      setStudentId(null);
      setStudentName("");
      setNameSaved(false);
      setAnswerHistory([]);
      setItemMastery({});
      setItemSessionSeen({});
      setMastery({});
      setRoundAnswers([]);
      setCurrentQuestion(null);
      setFeedback(null);
      setAppView("select");
    }

    await loadClasses();
    setMessage(`Deleted ${className}.`);
  }


  async function loadStudentProgress(selectedStudentId, selectedStudentName) {
    setStudentId(selectedStudentId);
    setStudentName(selectedStudentName);
    setNameSaved(true);
    setAppView("overview");

    const { data: answerRows, error: answerError } = await supabase
      .from("answers")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId)
      .order("answered_at", { ascending: true });

    if (answerError) {
      console.error("Load answers error:", answerError);
    }

    const rebuiltHistory =
      (answerRows || []).map(row => ({
        date: row.answered_at,
        skill: row.skill,
        stage: row.stage,
        diagnosticTarget: row.diagnostic_target,
        question: row.question,
        passage: row.passage || "",
        chosen: row.chosen_answer,
        correct: row.correct_answer,
        isCorrect: row.is_correct
      }));

    setAnswerHistory(rebuiltHistory);
    setTotalAnswered(rebuiltHistory.length);
    setCorrectAnswered(rebuiltHistory.filter(x => x.isCorrect).length);

    const { data: itemMasteryRows, error: itemMasteryError } = await supabase
      .from("item_mastery")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId)
      .order("updated_at", { ascending: true });

    if (itemMasteryError && !isMissingItemMasteryTableError(itemMasteryError)) {
      console.error("Load item mastery error:", itemMasteryError);
    }

    const rebuiltItemMastery = {};

    (itemMasteryRows || []).forEach(row => {
      const key = getItemMasteryStateKey(row.item_key, row.item_type);
      rebuiltItemMastery[key] = normalizeItemMasteryRow(row);
    });

    setItemMastery(rebuiltItemMastery);
    setItemSessionSeen({});

    const { data: masteryRows, error: masteryError } = await supabase
      .from("mastery")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId)
      .order("updated_at", { ascending: true });

    if (masteryError) {
      console.error("Load mastery error:", masteryError);
    }

    const rebuiltMastery = {};

    (masteryRows || []).forEach(row => {
      rebuiltMastery[row.skill_id] = {
        attempts: row.attempts || 1,
        mastered: row.mastered || false,
        lastScore: row.last_score,
        lastTotal: row.last_total
      };
    });

    setMastery(rebuiltMastery);

    const firstUnmastered =
      skillTree.findIndex(stage =>
        !rebuiltMastery[stage.id]?.mastered
      );

    setCurrentSkillIndex(firstUnmastered === -1 ? skillTree.length - 1 : firstUnmastered);
    setRoundAnswers([]);
    setCurrentQuestion(null);
    setFeedback(null);
    setMessage(`Loaded ${selectedStudentName}.`);
  }


  async function saveStudentName() {
    const clean = studentName.trim();
    if (!clean) return;

    if (!teacherId) {
      setMessage("Please log in first.");
      return;
    }

    setStudentName(clean);
    setNameSaved(true);

    if (!studentId) {
      if (!selectedClassId) {
        setMessage("Please select or create a class first.");
        return;
      }

      const { data, error } = await supabase
        .from("students")
        .insert({
          name: clean,
          class_id: selectedClassId,
          teacher_id: teacherId
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase student save error:", error);
        setMessage("Student saved locally, but cloud save failed.");
        return;
      }

      setStudentId(data.id);
      setMessage("Student saved to cloud.");
      setAppView("overview");
    }
  }

  function getAvailableStageQuestions(stageIndex) {
    const stage = skillTree[stageIndex];
    if (!stage) return [];

    const stageQuestions = allQuestions.filter(q => getStageIndex(q) === stageIndex);
    const used = usedByStage[stage.id] || [];

    let available = stageQuestions.filter(q => !used.includes(q.id));

    // Do not recycle questions too quickly.
    // Only reset used questions when there are not enough left for a full round.
    if (available.length < ROUND_LENGTH) {
      const keepRecent =
        used.slice(-ROUND_LENGTH * 3);

      available =
        stageQuestions.filter(q =>
          !keepRecent.includes(q.id)
        );

      setUsedByStage(prev => ({
        ...prev,
        [stage.id]: keepRecent
      }));
    }

    return available;
  }

  function getAttemptedStageLabels() {
    return new Set(
      answerHistory
        .map(record => record.stage)
        .filter(Boolean)
    );
  }

  function getReviewQuestionPool() {
    const attemptedStageLabels =
      getAttemptedStageLabels();

    if (attemptedStageLabels.size === 0) return [];

    const allowedStageLabels =
      new Set(
        skillTree
          .slice(0, currentSkillIndex + 1)
          .map(stage => stage.label)
          .filter(label => attemptedStageLabels.has(label))
      );

    if (allowedStageLabels.size === 0) return [];

    const usedQuestionIds =
      new Set(Object.values(usedByStage).flat());

    for (const weakness of weaknessSnapshot.needsPractice) {
      if (!allowedStageLabels.has(weakness.stage)) continue;

      const matches =
        allQuestions.filter(question => {
          const stageIndex = getStageIndex(question);
          const stage = skillTree[stageIndex];

          return (
            stage &&
            allowedStageLabels.has(stage.label) &&
            getDiagnosticTarget(question) === weakness.target &&
            !usedQuestionIds.has(question.id)
          );
        });

      if (matches.length > 0) {
        return shuffleArray(matches);
      }
    }

    return [];
  }

  function prepareQuestion(question, isTargetedReview = false) {
    return {
      ...question,
      isTargetedReview,
      choices: Array.isArray(question.choices)
        ? shuffleArray(question.choices)
        : question.choices
    };
  }

  function pickQuestion(mode = assessmentMode, answeredCount = roundAnswers.length) {
    setMessage("");
    setShowConfetti(false);
    setShowReport(false);

    if (mode === "targetedReview") {
      const reviewPool =
        getReviewQuestionPool();

      if (reviewPool.length === 0) {
        setMessage("No targeted review questions are available yet. Complete more mastery questions first.");
        return;
      }

      setCurrentQuestion(prepareQuestion(reviewPool[0], true));
      return;
    }

    const available = getAvailableStageQuestions(currentSkillIndex);

    if (available.length === 0) {
      setMessage(`No questions found for ${currentStage.label}.`);
      return;
    }

    const shouldInjectReview =
      mode === "mastery" &&
      answeredCount > 0 &&
      (answeredCount + 1) % 5 === 0;

    if (shouldInjectReview) {
      const reviewPool =
        getReviewQuestionPool();

      if (reviewPool.length > 0) {
        setCurrentQuestion(prepareQuestion(reviewPool[0], true));
        return;
      }
    }

    const targetsAlreadyInRound =
      answeredCount > 0
        ? answerHistory
          .slice(-answeredCount)
          .filter(item => item.stage === currentStage.label)
          .map(item => item.diagnosticTarget)
        : [];

    const unusedTargets =
      available.filter(q =>
        !targetsAlreadyInRound.includes(getDiagnosticTarget(q))
      );

    const pool =
      unusedTargets.length > 0
        ? unusedTargets
        : available;

    const picked = shuffleArray(pool)[0];

    setCurrentQuestion(prepareQuestion(picked));
  }


  function getItemMasteryStateKey(itemKey, itemType) {
    return normalizeItemKey(itemType) + "::" + normalizeItemKey(itemKey);
  }

  function normalizeItemMasteryRow(row) {
    return {
      itemKey: normalizeItemKey(row.item_key),
      itemType: row.item_type,
      attempts: Number(row.attempts || 0),
      correct: Number(row.correct || 0),
      lastSeen: row.last_seen || null,
      lastResult: Boolean(row.last_result),
      sessionsSeen: Number(row.sessions_seen || 0),
      mastered: Boolean(row.mastered),
      formatTypes: row.formatTypes || [],
      hadPTDExposure: Boolean(row.hadPTDExposure),
      crossPatternExposure: Boolean(row.crossPatternExposure),
      phonicsPositions: row.phonicsPositions || [],
      masteryBlockers: row.masteryBlockers || [],
      updatedAt: row.updated_at || null
    };
  }

  function nextItemMasteryRow(previous, metadata, isCorrect, isNewSessionSeen, formatMetadata) {
    const attempts = (previous?.attempts || 0) + 1;
    const correct = (previous?.correct || 0) + (isCorrect ? 1 : 0);
    const sessionsSeen = (previous?.sessionsSeen || 0) + (isNewSessionSeen ? 1 : 0);
    const formatTypes = Array.from(new Set([
      ...(previous?.formatTypes || []),
      formatMetadata.formatType
    ].filter(Boolean)));
    const phonicsPositions = Array.from(new Set([
      ...(previous?.phonicsPositions || []),
      formatMetadata.phonicsPosition
    ].filter(position => position && position !== "unknown")));
    const evidence = {
      formatTypes,
      phonicsPositions,
      hadPTDExposure: Boolean(previous?.hadPTDExposure || formatMetadata.hadPTD),
      crossPatternExposure: Boolean(previous?.crossPatternExposure || formatMetadata.crossPatternGroup || formatMetadata.formatType === "CPS")
    };
    const eligibility = isMasteryEligible(evidence, metadata.itemType, metadata.itemKey);
    const baseMastered = attempts >= 4 && correct >= 3 && isCorrect && sessionsSeen >= 2;
    const mastered = baseMastered && eligibility.eligible;

    return {
      itemKey: metadata.itemKey,
      itemType: metadata.itemType,
      attempts,
      correct,
      lastSeen: new Date().toISOString(),
      lastResult: isCorrect,
      sessionsSeen,
      mastered,
      formatTypes,
      hadPTDExposure: evidence.hadPTDExposure,
      crossPatternExposure: evidence.crossPatternExposure,
      phonicsPositions,
      masteryBlockers: eligibility.blockers
    };
  }

  async function saveItemMasteryToSupabase(row) {
    if (!studentId || !teacherId || !row?.itemKey || !row?.itemType) return;

    const { error } = await supabase
      .from("item_mastery")
      .upsert(
        {
          student_id: studentId,
          teacher_id: teacherId,
          item_key: row.itemKey,
          item_type: row.itemType,
          attempts: row.attempts,
          correct: row.correct,
          last_seen: row.lastSeen,
          last_result: row.lastResult,
          sessions_seen: row.sessionsSeen,
          mastered: row.mastered,
          updated_at: new Date().toISOString()
        },
        { onConflict: "teacher_id,student_id,item_key,item_type" }
      );

    if (error && !isMissingItemMasteryTableError(error)) {
      console.error("Supabase item mastery save error:", error);
    }
  }

  function updateItemMastery(source, isCorrect) {
    const metadata = inferItemMetadata(source);
    if (!metadata?.itemKey || !metadata?.itemType) return;

    const formatMetadata = getQuestionFormatMetadata(source);
    const key = getItemMasteryStateKey(metadata.itemKey, metadata.itemType);
    const isNewSessionSeen = !itemSessionSeen[key];

    setItemSessionSeen(prev => ({
      ...prev,
      [key]: true
    }));

    setItemMastery(prev => {
      const nextRow = nextItemMasteryRow(prev[key], metadata, isCorrect, isNewSessionSeen, formatMetadata);
      saveItemMasteryToSupabase(nextRow);

      return {
        ...prev,
        [key]: nextRow
      };
    });
  }

  function getItemMasterySnapshot() {
    const trackedItems = allQuestions
      .map(question => inferItemMetadata(question))
      .filter(Boolean)
      .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType));

    letterAssessmentOrder.forEach(letter => {
      trackedItems.push(getItemMasteryStateKey(letter, "letter_name"));
      trackedItems.push(getItemMasteryStateKey(letter, "letter_sound"));
    });

    advancedPhonicsPatterns.forEach(pattern => {
      trackedItems.push(getItemMasteryStateKey(pattern.pattern, "phonics_pattern"));
      pattern.examples.forEach(example => {
        trackedItems.push(getItemMasteryStateKey(example, "phonics_pattern_word"));
      });
    });

    const trackedUnique = new Set(trackedItems);
    const rows = Object.values(itemMastery || {});
    const ranked = rows
      .filter(row => row.itemKey && row.itemType)
      .sort((a, b) =>
        Number(b.mastered) - Number(a.mastered) ||
        b.attempts - a.attempts ||
        a.itemType.localeCompare(b.itemType) ||
        a.itemKey.localeCompare(b.itemKey)
      );

    return {
      mastered: ranked.filter(row => row.mastered).slice(0, 12),
      attempting: ranked.filter(row => !row.mastered).slice(0, 12),
      evidence: ranked.slice(0, 16),
      unseenCount: Math.max(0, trackedUnique.size - rows.length),
      trackedCount: trackedUnique.size
    };
  }

  async function saveAnswerToSupabase(record) {
    if (!studentId || !teacherId) return;

    const { error } = await supabase
      .from("answers")
      .insert({
        student_id: studentId,
        teacher_id: teacherId,
        skill: record.skill,
        stage: record.stage,
        diagnostic_target: record.diagnosticTarget,
        question: record.question,
        passage: record.passage,
        chosen_answer: record.chosen,
        correct_answer: record.correct,
        is_correct: record.isCorrect
      });

    if (error) {
      console.error("Supabase answer save error:", error);
    }
  }

  async function saveMasteryToSupabase(stage, score, total, mastered) {
    if (!studentId || !teacherId) return;

    const { error } = await supabase
      .from("mastery")
      .insert({
        student_id: studentId,
        teacher_id: teacherId,
        skill_id: stage.id,
        skill_label: stage.label,
        mastered,
        attempts: 1,
        last_score: score,
        last_total: total
      });

    if (error) {
      console.error("Supabase mastery save error:", error);
    }
  }


  function answerQuestion(choice) {
    if (!currentQuestion) return;

    const correctAnswer = getQuestionAnswer(currentQuestion);
    const submittedAnswer = isFixSentenceQuestion(currentQuestion)
      ? normalizeSentenceAnswer(choice)
      : choice;
    const isCorrect = isFixSentenceQuestion(currentQuestion)
      ? comparableSentenceAnswer(submittedAnswer) === comparableSentenceAnswer(correctAnswer)
      : submittedAnswer === correctAnswer;
    const questionStage =
      skillTree[getStageIndex(currentQuestion)] || currentStage;
    const stage = currentStage;
    const nextRound = [...roundAnswers, isCorrect];

    setUsedByStage(prev => ({
      ...prev,
      [questionStage.id]: [...(prev[questionStage.id] || []), currentQuestion.id]
    }));

    setTotalAnswered(n => n + 1);

    const answerRecord = {
      date: new Date().toLocaleString(),
      skill: currentQuestion.skill,
      stage: questionStage.label,
      question: getQuestionPrompt(currentQuestion),
      passage: currentQuestion.passage || "",
      chosen: submittedAnswer,
      correct: correctAnswer,
      isCorrect,
      diagnosticTarget: getDiagnosticTarget(currentQuestion)
    };

    setAnswerHistory(prev => [
      ...prev,
      answerRecord
    ]);

    saveAnswerToSupabase(answerRecord);
    updateItemMastery(currentQuestion, isCorrect);

    if (isCorrect) {
      setCorrectAnswered(n => n + 1);
      setShowConfetti(true);
    }

    if (assessmentMode === "targetedReview") {
      if (nextRound.length >= ROUND_LENGTH) {
        setTimeout(() => {
          setAppView("finished");
          setShowReport(true);
        }, 500);

        setRoundAnswers([]);
      } else {
        setRoundAnswers(nextRound);
      }

      setFeedback({
        isCorrect,
        chosen: submittedAnswer,
        correct: correctAnswer,
        skill: currentQuestion.skill,
        explanation: getTeachingTip(currentQuestion, submittedAnswer, isCorrect)
      });

      setCurrentQuestion(null);
      return;
    }

    if (nextRound.length >= ROUND_LENGTH) {
      const score = nextRound.filter(Boolean).length;
      const mastered = score >= PASS_SCORE;

      setMastery(prev => ({
        ...prev,
        [stage.id]: {
          attempts: (prev[stage.id]?.attempts || 0) + 1,
          mastered: mastered || prev[stage.id]?.mastered || false,
          lastScore: score,
          lastTotal: ROUND_LENGTH
        }
      }));

      saveMasteryToSupabase(stage, score, ROUND_LENGTH, mastered);

      if (mastered) {
        setCurrentSkillIndex(index => Math.min(index + 1, skillTree.length - 1));
      }

      setTimeout(() => {
        setAppView("finished");
        setShowReport(true);
      }, 500);

      setRoundAnswers([]);
    } else {
      setRoundAnswers(nextRound);
    }

    setFeedback({
      isCorrect,
      chosen: submittedAnswer,
      correct: correctAnswer,
      skill: currentQuestion.skill,
      explanation: getTeachingTip(currentQuestion, submittedAnswer, isCorrect)
    });

    setCurrentQuestion(null);
  }

  function getTeachingTip(question, choice, isCorrect) {
    const skill = normalize(question.skill);
    const answer = String(getQuestionAnswer(question) || "");

    if (isCorrect) return "Good job. You used the skill correctly.";

    if (isFixSentenceQuestion(question)) {
      return `The corrected sentence is "${answer}". Check the capital letter, word order, and ending punctuation.`;
    }

    if (skill.includes("initial")) {
      return `The correct answer is "${answer}". Listen to the first sound in the word.`;
    }

    if (skill.includes("final")) {
      return `The correct answer is "${answer}". Listen to the last sound in the word.`;
    }

    if (skill.includes("rhym")) {
      return `The correct answer is "${answer}". Rhyming words have the same ending sound.`;
    }

    if (skill.includes("short vowel") || skill.includes("cvc")) {
      return `The correct answer is "${answer}". Listen carefully to the vowel sound in the middle of the word.`;
    }

    if (skill.includes("high-frequency")) {
      return `The correct answer is "${answer}". This is a high-frequency word. These words appear often when we read.`;
    }

    if (skill.includes("blend")) {
      return `The correct answer is "${answer}". A blend has two consonant sounds together, like bl, st, or cr.`;
    }

    if (skill.includes("digraph")) {
      return `The correct answer is "${answer}". A digraph is two letters making one sound, like sh, ch, th, or wh.`;
    }

    if (skill.includes("preposition")) {
      return `The correct answer is "${answer}". A preposition tells where something is.`;
    }

    if (skill.includes("plural")) {
      return `The correct answer is "${answer}". A plural means more than one.`;
    }

    if (skill.includes("comprehension") || skill.includes("details") || skill.includes("main idea") || skill.includes("inference")) {
      return `The correct answer is "${answer}". Look back at the passage and use the details to help you.`;
    }

    return `The correct answer is "${answer}". Review the skill and try the next one.`;
  }

  function normalizeAudioText(text) {
    return String(text || "")
      .normalize("NFKC")
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function speakWithBrowser(text) {
    if (!text) return;

    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
      console.warn("Browser speech synthesis is unavailable.");
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.lang = "en-US";

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn("Browser speech synthesis failed.", error);
    }
  }

  async function speakText(text) {
    if (!text) return;

    const normalizedText = normalizeAudioText(text);
    const audioKey = audioTextIndex[normalizedText];
    const audioEntry = audioKey ? audioManifest[audioKey] : null;

    if (audioEntry?.path) {
      const audioPaths = audioEntry.kinds?.includes("choice")
        ? [`/audio/choices/${audioKey}.mp3`, audioEntry.path]
        : [audioEntry.path];

      try {
        for (const audioPath of audioPaths) {
          const response = await fetch(audioPath, { method: "HEAD" });

          if (response.ok) {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }

            const audio = new Audio(audioPath);
            await audio.play();
            return;
          }
        }
      } catch (error) {
        console.warn("Local audio unavailable, using browser speech.", error);
      }
    }

    speakWithBrowser(text);
  }

  function shouldShowImage(question) {
    const skill = normalize(question.skill);

    return Boolean(question.imagePath) && (
      question.question === "Listen and find the word." ||
      skill.includes("vocabulary") ||
      skill.includes("preposition") ||
      skill.includes("emotion") ||
      skill.includes("picture comprehension")
    );
  }


  function flagCurrentQuestion() {
    if (!currentQuestion) return;

    setFlagIssueType("Confusing wording");
    setFlagNote("");
    setFlagDialogOpen(true);
  }

  async function submitQuestionFlag() {
    if (!teacherId || !currentQuestion) {
      setMessage("Please log in and select a question first.");
      return;
    }

    const questionId = currentQuestion.id || getQuestionPrompt(currentQuestion);
    const choices = currentQuestion.choices || currentQuestion.tiles || [];

    setFlagSubmitting(true);

    const { data: existingFlag, error: existingError } = await supabase
      .from("question_flags")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("question_id", questionId)
      .eq("status", "open")
      .maybeSingle();

    if (existingError && !isMissingTableError(existingError, "question_flags")) {
      console.error("Question flag duplicate check error:", existingError);
      setFlagSubmitting(false);
      setMessage("Could not check existing question flags.");
      return;
    }

    if (existingFlag) {
      setFlagSubmitting(false);
      setFlagDialogOpen(false);
      setMessage("This question is already flagged.");
      return;
    }

    const { error } = await supabase
      .from("question_flags")
      .insert({
        teacher_id: teacherId,
        teacher_email: teacherUser?.email || null,
        student_id: studentId,
        class_id: selectedClassId,
        question_id: questionId,
        question_text: getQuestionPrompt(currentQuestion),
        choices,
        correct_answer: getQuestionAnswer(currentQuestion),
        skill: currentQuestion.skill || currentStage?.label || "Unknown skill",
        diagnostic_target: currentQuestion.diagnosticTarget || getDiagnosticTarget(currentQuestion),
        mode: assessmentMode,
        issue_type: flagIssueType,
        note: flagNote.trim(),
        status: "open"
      });

    setFlagSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        setFlagDialogOpen(false);
        setMessage("This question is already flagged.");
        return;
      }

      console.error("Question flag submit error:", error);
      setMessage("Could not flag question. Make sure the question flag migration has been run.");
      return;
    }

    setFlagDialogOpen(false);
    setMessage("Question flagged for review.");
  }

  function getDiagnosticTarget(question) {
    const skill =
      normalize(question.skill);

    const text =
      [
        question.question,
        question.answer,
        question.passage
      ].join(" ").toLowerCase();

    if (skill.includes("initial")) {
      const match =
        text.match(/\/([a-z]+)\//);

      if (match) return `initial /${match[1]}/`;

      const word =
        String(question.answer || "").toLowerCase();

      return word
        ? `initial ${word[0]}`
        : "initial sound";
    }

    if (skill.includes("final")) {
      const match =
        text.match(/\/([a-z]+)\//);

      if (match) return `final /${match[1]}/`;

      const word =
        String(question.answer || "").toLowerCase();

      return word
        ? `final ${word[word.length - 1]}`
        : "final sound";
    }

    if (skill.includes("rhym")) {
      const match =
        text.match(/rhymes with ([a-z]+)/);

      return match
        ? `rhymes with ${match[1]}`
        : "rhyming";
    }

    if (skill.includes("short vowel") || skill.includes("cvc")) {
      const answer =
        String(question.answer || "").toLowerCase();

      if (/[a]/.test(answer)) return "short a";
      if (/[e]/.test(answer)) return "short e";
      if (/[i]/.test(answer)) return "short i";
      if (/[o]/.test(answer)) return "short o";
      if (/[u]/.test(answer)) return "short u";

      return "short vowel";
    }

    if (skill.includes("blend")) {
      const match =
        text.match(/(bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr|sc|sk|sm|sn|sp|st|sw)/);

      return match
        ? `${match[1]} blend`
        : "blend";
    }

    if (skill.includes("digraph")) {
      const match =
        text.match(/(sh|ch|th|wh|ph)/);

      return match
        ? `${match[1]} digraph`
        : "digraph";
    }

    if (skill.includes("long vowel")) {
      const match =
        text.match(/long ([aeiou])/);

      return match
        ? `long ${match[1]}`
        : "long vowel";
    }

    if (skill.includes("vowel team")) {
      const match =
        text.match(/(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew)/);

      return match
        ? `${match[1]} vowel team`
        : "vowel team";
    }

    if (skill.includes("r-controlled") || skill.includes("r controlled")) {
      const match =
        text.match(/(ar|er|ir|or|ur)/);

      return match
        ? `${match[1]} r-controlled`
        : "r-controlled vowel";
    }

    if (skill.includes("high-frequency")) {
      return String(question.answer || "high-frequency word");
    }

    if (skill.includes("preposition")) {
      return String(question.answer || "preposition");
    }

    if (skill.includes("plural")) {
      return String(question.answer || "plural");
    }

    if (skill.includes("prefix") || skill.includes("suffix")) {
      return String(question.answer || "morphology");
    }

    if (skill.includes("homophone")) {
      return String(question.answer || "homophone");
    }

    if (skill.includes("main idea")) return "main idea";
    if (skill.includes("key details")) return "key details";
    if (skill.includes("sequencing")) return "sequencing";
    if (skill.includes("cause")) return "cause and effect";
    if (skill.includes("context")) return "context clues";
    if (skill.includes("theme")) return "theme";
    if (skill.includes("inference")) return "inference";

    return question.skill || "general skill";
  }

  function summarizeTargets(records) {
    const targetStats = {};

    records.forEach(record => {
      const target =
        record.diagnosticTarget || "general";

      if (!targetStats[target]) {
        targetStats[target] = {
          correct: 0,
          total: 0
        };
      }

      targetStats[target].total += 1;

      if (record.isCorrect) {
        targetStats[target].correct += 1;
      }
    });

    const secure = [];
    const developing = [];
    const needsPractice = [];

    Object.entries(targetStats).forEach(([target, stats]) => {
      const accuracy =
        stats.correct / stats.total;

      const label =
        `${target} (${stats.correct}/${stats.total})`;

      if (stats.total >= 2 && accuracy >= 0.9) {
        secure.push(label);
      } else if (accuracy >= 0.6) {
        developing.push(label);
      } else {
        needsPractice.push(label);
      }
    });

    return {
      secure,
      developing,
      needsPractice
    };
  }


  const letterItems = letterAssessmentOrder.map(letter => ({
    display: letter,
    type: letter === letter.toUpperCase() ? "uppercase" : "lowercase"
  }));

  const patternItems = advancedPhonicsPatterns.map((item, index) => ({
    ...item,
    exampleWord: item.examples[(patternAttempt + index) % item.examples.length]
  }));

  function startAdvancedPhonicsAssessment() {
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(attempt => attempt + 1);
    setAppView("advancedPhonics");
  }

  function recordPatternResult(soundCorrect, wordCorrect) {
    const current =
      patternItems[patternIndex];

    updateItemMastery(
      {
        itemKey: current.pattern,
        itemType: "phonics_pattern"
      },
      soundCorrect
    );

    updateItemMastery(
      {
        itemKey: current.exampleWord,
        itemType: "phonics_pattern_word"
      },
      wordCorrect
    );

    setPatternAssessment(prev => [
      ...prev,
      {
        pattern: current.pattern,
        exampleWord: current.exampleWord,
        soundCorrect,
        wordCorrect
      }
    ]);

    setPatternIndex(prev => prev + 1);
  }

  function resetPatternAssessment() {
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(attempt => attempt + 1);
  }

  function recordLetterResult(knowsName, knowsSound) {
    const current =
      letterItems[letterIndex];

    updateItemMastery(
      {
        itemKey: current.display,
        itemType: "letter_name"
      },
      knowsName
    );

    updateItemMastery(
      {
        itemKey: current.display,
        itemType: "letter_sound"
      },
      knowsSound
    );

    setLetterAssessment(prev => [
      ...prev,
      {
        letter: current.display,
        type: current.type,
        knowsName,
        knowsSound
      }
    ]);

    setLetterIndex(prev => prev + 1);
  }

  function resetLetterAssessment() {
    setLetterIndex(0);
    setLetterAssessment([]);
  }

  async function exportLetterAssessment() {
    const today =
      new Date().toISOString().slice(0, 10);

    const safeName =
      (studentName || "Unnamed student")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const uppercaseResults =
      new Map(
        letterAssessment
          .filter(item => item.type === "uppercase")
          .map(item => [item.letter.toUpperCase(), item])
      );

    const lowercaseResults =
      new Map(
        letterAssessment
          .filter(item => item.type === "lowercase")
          .map(item => [item.letter.toUpperCase(), item])
      );

    const countKnown = (results, field) =>
      alphabet.filter(letter => results.get(letter)?.[field]).length;

    const ExcelJS =
      (await import("exceljs")).default;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Letter Assessment");

    const colors = {
      title: "FF1F4E79",
      section: "FF3478F6",
      summary: "FFEAF2FF",
      border: "FFB7C2D0",
      yes: "FFD9EAD3",
      no: "FFF4CCCC",
      white: "FFFFFFFF"
    };

    worksheet.columns = [
      { width: 10 },
      { width: 18 },
      { width: 18 },
      { width: 4 },
      { width: 10 },
      { width: 18 },
      { width: 18 }
    ];

    worksheet.mergeCells("A1:G1");
    worksheet.getCell("A1").value = "EL Letter Name and Sound Assessment";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: colors.white } };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.title }
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells("A2:G2");
    worksheet.getCell("A2").value = `Student: ${studentName || "Unnamed student"}`;
    worksheet.mergeCells("A3:G3");
    worksheet.getCell("A3").value = `Date: ${today}`;

    ["A2", "A3"].forEach(cellRef => {
      worksheet.getCell(cellRef).font = { bold: true, size: 12 };
      worksheet.getCell(cellRef).alignment = { horizontal: "center" };
    });

    const summaryValues = [
      ["A5", "Total Names Known", countKnown(uppercaseResults, "knowsName") + countKnown(lowercaseResults, "knowsName")],
      ["C5", "Total Sounds Known", countKnown(uppercaseResults, "knowsSound") + countKnown(lowercaseResults, "knowsSound")],
      ["E5", "Uppercase Names Known", countKnown(uppercaseResults, "knowsName")],
      ["A7", "Uppercase Sounds Known", countKnown(uppercaseResults, "knowsSound")],
      ["C7", "Lowercase Names Known", countKnown(lowercaseResults, "knowsName")],
      ["E7", "Lowercase Sounds Known", countKnown(lowercaseResults, "knowsSound")]
    ];

    summaryValues.forEach(([cellRef, label, value]) => {
      const cell = worksheet.getCell(cellRef);
      const valueCell = worksheet.getCell(cellRef.replace(/[A-Z]+/, match =>
        String.fromCharCode(match.charCodeAt(0) + 1)
      ));

      cell.value = label;
      valueCell.value = value;
      cell.font = { bold: true };
      valueCell.font = { bold: true, size: 14 };
      valueCell.alignment = { horizontal: "center" };

      [cell, valueCell].forEach(summaryCell => {
        summaryCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: colors.summary }
        };
        summaryCell.border = {
          top: { style: "thin", color: { argb: colors.border } },
          right: { style: "thin", color: { argb: colors.border } },
          bottom: { style: "thin", color: { argb: colors.border } },
          left: { style: "thin", color: { argb: colors.border } }
        };
      });
    });

    function styleSectionHeader(rowNumber, startCol, endCol, title) {
      worksheet.mergeCells(rowNumber, startCol, rowNumber, endCol);
      const cell = worksheet.getCell(rowNumber, startCol);
      cell.value = title;
      cell.font = { bold: true, color: { argb: colors.white } };
      cell.alignment = { horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colors.section }
      };
    }

    function styleCell(cell) {
      cell.border = {
        top: { style: "thin", color: { argb: colors.border } },
        right: { style: "thin", color: { argb: colors.border } },
        bottom: { style: "thin", color: { argb: colors.border } },
        left: { style: "thin", color: { argb: colors.border } }
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }

    function styleResultCell(cell) {
      styleCell(cell);
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: cell.value === "Y" ? colors.yes : colors.no }
      };
    }

    function writeLetterTable({ title, startCol, letters, results }) {
      const headerRow = 10;
      styleSectionHeader(headerRow, startCol, startCol + 2, title);

      const columns = ["Letter", "Knows Name", "Knows Sound"];
      columns.forEach((heading, index) => {
        const cell = worksheet.getCell(headerRow + 1, startCol + index);
        cell.value = heading;
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9EAF7" }
        };
        styleCell(cell);
      });

      letters.forEach((letter, index) => {
        const rowNumber = headerRow + 2 + index;
        const result = results.get(letter.toUpperCase());
        const values = [
          letter,
          result?.knowsName ? "Y" : "N",
          result?.knowsSound ? "Y" : "N"
        ];

        values.forEach((value, columnIndex) => {
          const cell = worksheet.getCell(rowNumber, startCol + columnIndex);
          cell.value = value;
          if (columnIndex === 0) {
            styleCell(cell);
            cell.font = { bold: true };
          } else {
            styleResultCell(cell);
          }
        });
      });
    }

    writeLetterTable({
      title: "Uppercase Letters",
      startCol: 1,
      letters: alphabet,
      results: uppercaseResults
    });

    writeLetterTable({
      title: "Lowercase Letters",
      startCol: 5,
      letters: alphabet.map(letter => letter.toLowerCase()),
      results: lowercaseResults
    });

    worksheet.views = [{ state: "frozen", ySplit: 10 }];

    const workbookBuffer =
      await workbook.xlsx.writeBuffer();

    const blob = new Blob([workbookBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName}_letter_name_sound_assessment_${today}.xlsx`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function exportPatternAssessment() {
    const today =
      new Date().toISOString().slice(0, 10);

    const safeName =
      (studentName || "Unnamed student")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

    const results =
      new Map(patternAssessment.map(item => [item.pattern, item]));

    const totalSoundCorrect =
      patternAssessment.filter(item => item.soundCorrect).length;

    const totalWordCorrect =
      patternAssessment.filter(item => item.wordCorrect).length;

    const totalBothCorrect =
      patternAssessment.filter(item => item.soundCorrect && item.wordCorrect).length;

    const ExcelJS =
      (await import("exceljs")).default;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Advanced Phonics");

    const colors = {
      title: "FF1F4E79",
      section: "FF3478F6",
      summary: "FFEAF2FF",
      border: "FFB7C2D0",
      yes: "FFD9EAD3",
      no: "FFF4CCCC",
      white: "FFFFFFFF"
    };

    worksheet.columns = [
      { width: 16 },
      { width: 22 },
      { width: 16 },
      { width: 16 }
    ];

    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "Advanced Phonics Pattern Assessment";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: colors.white } };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.title }
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value = `Student: ${studentName || "Unnamed student"}`;
    worksheet.mergeCells("A3:D3");
    worksheet.getCell("A3").value = `Date: ${today}`;

    ["A2", "A3"].forEach(cellRef => {
      worksheet.getCell(cellRef).font = { bold: true, size: 12 };
      worksheet.getCell(cellRef).alignment = { horizontal: "center" };
    });

    const summaryRows = [
      ["A5", "Patterns assessed", patternAssessment.length],
      ["C5", "Sound correct", totalSoundCorrect],
      ["A7", "Word correct", totalWordCorrect],
      ["C7", "Both correct", totalBothCorrect]
    ];

    summaryRows.forEach(([cellRef, label, value]) => {
      const cell = worksheet.getCell(cellRef);
      const valueCell = worksheet.getCell(cellRef.replace(/[A-Z]+/, match =>
        String.fromCharCode(match.charCodeAt(0) + 1)
      ));

      cell.value = label;
      valueCell.value = value;
      cell.font = { bold: true };
      valueCell.font = { bold: true, size: 14 };
      valueCell.alignment = { horizontal: "center" };

      [cell, valueCell].forEach(summaryCell => {
        summaryCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: colors.summary }
        };
        summaryCell.border = {
          top: { style: "thin", color: { argb: colors.border } },
          right: { style: "thin", color: { argb: colors.border } },
          bottom: { style: "thin", color: { argb: colors.border } },
          left: { style: "thin", color: { argb: colors.border } }
        };
      });
    });

    function styleCell(cell) {
      cell.border = {
        top: { style: "thin", color: { argb: colors.border } },
        right: { style: "thin", color: { argb: colors.border } },
        bottom: { style: "thin", color: { argb: colors.border } },
        left: { style: "thin", color: { argb: colors.border } }
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }

    function styleResultCell(cell) {
      styleCell(cell);
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: cell.value === "Y" ? colors.yes : colors.no }
      };
    }

    worksheet.mergeCells("A10:D10");
    worksheet.getCell("A10").value = "Pattern Results";
    worksheet.getCell("A10").font = { bold: true, color: { argb: colors.white } };
    worksheet.getCell("A10").alignment = { horizontal: "center" };
    worksheet.getCell("A10").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.section }
    };

    ["Pattern", "Example Word", "Sound Correct", "Word Correct"].forEach((heading, index) => {
      const cell = worksheet.getCell(11, index + 1);
      cell.value = heading;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EAF7" }
      };
      styleCell(cell);
    });

    patternItems.forEach((item, index) => {
      const result = results.get(item.pattern);
      const values = [
        item.pattern,
        result?.exampleWord || item.exampleWord,
        result?.soundCorrect ? "Y" : "N",
        result?.wordCorrect ? "Y" : "N"
      ];

      values.forEach((value, columnIndex) => {
        const cell = worksheet.getCell(index + 12, columnIndex + 1);
        cell.value = value;

        if (columnIndex < 2) {
          styleCell(cell);
          if (columnIndex === 0) cell.font = { bold: true };
        } else {
          styleResultCell(cell);
        }
      });
    });

    worksheet.views = [{ state: "frozen", ySplit: 10 }];

    const workbookBuffer =
      await workbook.xlsx.writeBuffer();

    const blob = new Blob([workbookBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName}_advanced_phonics_pattern_assessment_${today}.xlsx`;
    link.click();

    URL.revokeObjectURL(url);
  }


  function exportCSVData() {
    const today =
      new Date().toISOString().slice(0, 10);

    const safeName =
      (studentName || "Unnamed student")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

    const rows = [
      [
        "Date",
        "Student",
        "Skill",
        "Diagnostic Target",
        "Question",
        "Student Answer",
        "Correct Answer",
        "Result"
      ]
    ];

    answerHistory.forEach(item => {
      rows.push([
        item.date || "",
        studentName || "Unnamed student",
        item.stage || item.skill || "",
        item.diagnosticTarget || "",
        `${item.passage ? item.passage + " " : ""}${item.question || ""}`,
        item.chosen || "",
        item.correct || "",
        item.isCorrect ? "Correct" : "Incorrect"
      ]);
    });

    const csv =
      rows
        .map(row =>
          row
            .map(cell =>
              `"${String(cell).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName}_reading_data_${today}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }


  function startAssessment() {
    setAssessmentMode("mastery");
    setFeedback(null);
    setCurrentQuestion(null);
    setShowReport(false);
    setRoundAnswers([]);
    setMessage("");
    setAppView("assessment");
    pickQuestion("mastery", 0);
  }

  function startTargetedReview() {
    setAssessmentMode("targetedReview");
    setFeedback(null);
    setCurrentQuestion(null);
    setShowReport(false);
    setRoundAnswers([]);
    setMessage("");
    setAppView("assessment");
    pickQuestion("targetedReview", 0);
  }

  function endAssessment() {
    setCurrentQuestion(null);
    setFeedback(null);
    setShowReport(true);
    setAppView("finished");
  }

  function goToOverview() {
    setCurrentQuestion(null);
    setFeedback(null);
    setShowReport(false);
    setAppView("overview");
  }


  function exportData() {
    const today =
      new Date().toISOString().slice(0, 10);

    const safeName =
      (studentName || "Unnamed student")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

    function summarizeSkill(stage) {
      const records =
        answerHistory.filter(item =>
          item.stage === stage.label
        );

      const data =
        mastery[stage.id];

      if (records.length === 0 && !data) {
        return `${stage.label}: Not yet reached or tested.`;
      }

      if (records.length === 0) {
        return `${stage.label}: Started, but no individual question data has been recorded yet.`;
      }

      const correct =
        records.filter(r => r.isCorrect).length;

      const summary =
        summarizeTargets(records);

      let note =
        `${stage.label}: ${correct}/${records.length} correct. `;

      if (data?.mastered) {
        note += `Status: mastered. `;
      } else if (stage.id === currentStage.id) {
        note += `Status: current working skill. `;
      } else {
        note += `Status: attempted but not yet mastered. `;
      }

      note += `\nSecure: ${
        summary.secure.length
          ? summary.secure.join(", ")
          : "No secure subskills recorded yet."
      }`;

      note += `\nDeveloping: ${
        summary.developing.length
          ? summary.developing.join(", ")
          : "No developing subskills recorded yet."
      }`;

      note += `\nNeeds practice: ${
        summary.needsPractice.length
          ? summary.needsPractice.join(", ")
          : "No specific needs recorded yet."
      }`;

      return note;
    }

    const reportText = `
Reading Mastery Report

Student: ${studentName || "Unnamed student"}
Date: ${today}

Overall Summary
Questions answered: ${totalAnswered}
Correct answers: ${correctAnswered}
Accuracy: ${accuracy}%

Current Position
Current skill: ${currentSkillIndex + 1}. ${currentStage.label}
Current round score: ${roundCorrect}/${ROUND_LENGTH}
Mastery rule: ${PASS_SCORE}/${ROUND_LENGTH} correct to unlock the next skill.

Teacher Notes by Skill

${skillTree.map(stage => summarizeSkill(stage)).join("\n\n")}

Recent Question Evidence

${answerHistory.slice(-30).map((item, index) => {
  return `${index + 1}. Skill: ${item.stage}
Question: ${item.passage ? item.passage + " " : ""}${item.question}
Student answered: ${item.chosen}
Correct answer: ${item.correct}
Result: ${item.isCorrect ? "Correct" : "Incorrect"}`;
}).join("\n\n")}
`.trim();

    const blob = new Blob([reportText], {
      type: "text/plain"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName}_reading_mastery_report_${today}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function resetStudent() {
    if (profileStorageKey) {
      localStorage.removeItem(profileStorageKey);
    }

    clearTeacherState();
    loadClasses();
  }

  function switchStudent() {
    setNameSaved(false);
    setStudentId(null);
    setStudentName("");
    setCurrentQuestion(null);
    setFeedback(null);
    setMessage("");
    setShowClassDashboard(false);
    setAppView("select");
    loadClasses();
    loadStudents(selectedClassId);
  }

  function viewReport() {
    setShowReport(true);
    setAppView("finished");
  }

  function changeAdminFlagStatusFilter(nextStatus) {
    setAdminFlagStatusFilter(nextStatus);
    loadAdminDashboard(nextStatus);
  }


  if (!authReady) {
    return (
      <div className="app">
        <div className="card page-card page-stack auth-card">
          <h2>Loading teacher session...</h2>
        </div>
      </div>
    );
  }

  if (!teacherUser) {
    return (
      <div className="app">
        <motion.div
          className="hero"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1>Reading Mastery</h1>
          <p>Structured EL-style reading skill progression</p>
        </motion.div>

        <AuthPage
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authLoading={authLoading}
          authMessage={authMessage}
          signUpTeacher={signUpTeacher}
          logInTeacher={logInTeacher}
        />
      </div>
    );
  }

  const roundCorrect = roundAnswers.filter(Boolean).length;
  const roundProgress = Math.round((roundAnswers.length / ROUND_LENGTH) * 100);
  const accuracy = totalAnswered === 0 ? 0 : Math.round((correctAnswered / totalAnswered) * 100);
  const isFocusedAssessment =
    appView === "assessment" ||
    appView === "letters" ||
    appView === "advancedPhonics";

  return (
    <div className={isFocusedAssessment ? "app assessment-app" : "app"}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={90} />}

      {!isFocusedAssessment && (
        <TopNavigation
          appView={appView}
          nameSaved={nameSaved}
          studentName={studentName}
          currentStage={currentStage}
          goToOverview={goToOverview}
          switchStudent={switchStudent}
          viewReport={viewReport}
          teacherEmail={teacherUser.email}
          logOutTeacher={logOutTeacher}
          isAdmin={isAdmin}
          openAdminDashboard={openAdminDashboard}
        />
      )}

      {!isFocusedAssessment && (
        <motion.div
          className="hero"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1>Reading Mastery</h1>
          <p>Structured EL-style reading skill progression</p>

          {appView === "select" && !nameSaved && (
            <StudentSelectPage
              classList={classList}
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              setStudentList={setStudentList}
              loadStudents={loadStudents}
              newClassName={newClassName}
              setNewClassName={setNewClassName}
              createClass={createClass}
              loadClassDashboard={loadClassDashboard}
              studentList={studentList}
              loadingStudents={loadingStudents}
              loadStudentProgress={loadStudentProgress}
              studentName={studentName}
              setStudentName={setStudentName}
              saveStudentName={saveStudentName}
              showClassDashboard={showClassDashboard}
              classDashboard={classDashboard}
              skillTree={skillTree}
              setShowClassDashboard={setShowClassDashboard}
              deleteClass={deleteClass}
              deleteStudent={deleteStudent}
            />
          )}

          {nameSaved && <h2>Student: {studentName}</h2>}
        </motion.div>
      )}

      {appView === "admin" && isAdmin && (
        <AdminDashboardPage
          flags={adminFlags}
          teachers={adminTeachers}
          classes={adminClasses}
          students={adminStudents}
          statusFilter={adminFlagStatusFilter}
          setStatusFilter={changeAdminFlagStatusFilter}
          loading={adminLoading}
          refreshDashboard={() => loadAdminDashboard(adminFlagStatusFilter)}
          resolveFlag={flagId => updateQuestionFlagStatus(flagId, "resolved")}
          reopenFlag={flagId => updateQuestionFlagStatus(flagId, "open")}
          deleteClass={adminDeleteClass}
          deleteStudent={adminDeleteStudent}
          message={message}
        />
      )}

      {appView === "overview" && nameSaved && (
        <StudentOverviewPage
          studentName={studentName}
          currentSkillIndex={currentSkillIndex}
          currentStage={currentStage}
          accuracy={accuracy}
          totalAnswered={totalAnswered}
          passScore={PASS_SCORE}
          roundLength={ROUND_LENGTH}
          skillTree={skillTree}
          setCurrentSkillIndex={setCurrentSkillIndex}
          setRoundAnswers={setRoundAnswers}
          setCurrentQuestion={setCurrentQuestion}
          setFeedback={setFeedback}
          setMessage={setMessage}
          startAssessment={startAssessment}
          startAdvancedPhonicsAssessment={startAdvancedPhonicsAssessment}
          startTargetedReview={startTargetedReview}
          weaknessSnapshot={weaknessSnapshot}
          itemMasterySnapshot={getItemMasterySnapshot()}
          setAppView={setAppView}
          switchStudent={switchStudent}
        />
      )}

      {!isFocusedAssessment && appView !== "admin" && (
        <DashboardSummary
          currentSkillIndex={currentSkillIndex}
          skillTree={skillTree}
          currentStage={currentStage}
          roundCorrect={roundCorrect}
          roundLength={ROUND_LENGTH}
          accuracy={accuracy}
        />
      )}

      {appView === "letters" && (
        <LetterAssessmentPage
          studentName={studentName}
          letterIndex={letterIndex}
          letterItems={letterItems}
          endAssessment={endAssessment}
          recordLetterResult={recordLetterResult}
          letterAssessment={letterAssessment}
          exportLetterAssessment={exportLetterAssessment}
          resetLetterAssessment={resetLetterAssessment}
        />
      )}

      {appView === "advancedPhonics" && (
        <AdvancedPhonicsPatternAssessmentPage
          studentName={studentName}
          patternIndex={patternIndex}
          patternItems={patternItems}
          endAssessment={endAssessment}
          recordPatternResult={recordPatternResult}
          patternAssessment={patternAssessment}
          exportPatternAssessment={exportPatternAssessment}
          resetPatternAssessment={resetPatternAssessment}
        />
      )}

      {appView === "assessment" && (
        <AssessmentPage
          currentQuestion={currentQuestion}
          feedback={feedback}
          studentName={studentName}
          currentSkillIndex={currentSkillIndex}
          currentStage={currentStage}
          setFeedback={setFeedback}
          pickQuestion={pickQuestion}
          roundAnswers={roundAnswers}
          roundLength={ROUND_LENGTH}
          roundProgress={roundProgress}
          shouldShowImage={shouldShowImage}
          flagCurrentQuestion={flagCurrentQuestion}
          answerQuestion={answerQuestion}
          speakText={speakText}
          message={message}
          endAssessment={endAssessment}
          assessmentMode={assessmentMode}
        />
      )}

      <QuestionFlagDialog
        open={flagDialogOpen}
        question={currentQuestion}
        issueType={flagIssueType}
        setIssueType={setFlagIssueType}
        note={flagNote}
        setNote={setFlagNote}
        submitting={flagSubmitting}
        onSubmit={submitQuestionFlag}
        onCancel={() => setFlagDialogOpen(false)}
        getDiagnosticTarget={getDiagnosticTarget}
      />

      {appView === "finished" && (
        <FinishedReportPage
          startAssessment={startAssessment}
          goToOverview={goToOverview}
          studentName={studentName}
          totalAnswered={totalAnswered}
          accuracy={accuracy}
          currentStage={currentStage}
          currentSkillIndex={currentSkillIndex}
          setCurrentSkillIndex={setCurrentSkillIndex}
          setRoundAnswers={setRoundAnswers}
          setCurrentQuestion={setCurrentQuestion}
          setFeedback={setFeedback}
          setMessage={setMessage}
          skillTree={skillTree}
          currentStageQuestions={currentStageQuestions}
          mastery={mastery}
          allowPassageAudio={allowPassageAudio}
          setAllowPassageAudio={setAllowPassageAudio}
          exportData={exportData}
          exportCSVData={exportCSVData}
        />
      )}

      {!isFocusedAssessment && appView !== "overview" && appView !== "admin" && (
        <div className="footer-utility-actions">
          <button className="report-button" onClick={switchStudent}>
            Switch Student
          </button>

          <button className="reset-button" onClick={resetStudent}>
            Reset Student
          </button>
        </div>
      )}
    </div>
  );
}
