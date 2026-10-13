import { APP_VIEWS } from '../appState/appViews.js';

const DESTINATIONS = Object.freeze({
  [APP_VIEWS.TEACHER_DASHBOARD]: 'Back to Dashboard',
  [APP_VIEWS.TEACHER_CLASSES]: 'Back to Students',
  [APP_VIEWS.TEACHER_RESOURCES]: 'Back to Teach',
  [APP_VIEWS.ASSESSMENTS]: 'Back to Assessments',
  [APP_VIEWS.REPORTS]: 'Back to Reports',
  [APP_VIEWS.TEACHER_GUIDED_READING]: 'Back to Books',
  [APP_VIEWS.WORKSHEETS]: 'Back to Worksheets',
  [APP_VIEWS.PRESENT]: 'Back to Present',
  [APP_VIEWS.TEACHER_SETTINGS]: 'Back to Settings'
});
const key = (teacherId, sessionId) => `lp:teacher-session-return:v1:${encodeURIComponent(teacherId)}:${encodeURIComponent(sessionId)}`;
const fallback = classId => ({ classId: classId || '', returnView: APP_VIEWS.TEACHER_RESOURCES, returnLabel: DESTINATIONS[APP_VIEWS.TEACHER_RESOURCES], audience: 'whole_class', studentIds: [], bookId: '' });

/** Presentation context only: never a URL, login token, or source of ownership. */
export function rememberTeacherSessionReturn({ teacherId, session, context = {}, storage }) {
  if (!teacherId || !session?.id || !session.class_id || (session.teacher_id && session.teacher_id !== teacherId)) return false;
  const returnView = Object.hasOwn(DESTINATIONS, context.returnView) ? context.returnView : APP_VIEWS.TEACHER_RESOURCES;
  const selected = context.audience === 'selected_students' || (!context.audience && context.studentIds?.length);
  const originatingBook = context.returnBookId || context.bookId || context.contentId || "";
  const descriptor = { version: 1, teacherId, sessionId: session.id, classId: session.class_id,
    returnView, returnLabel: DESTINATIONS[returnView], audience: selected ? 'selected_students' : 'whole_class',
    studentIds: selected ? [...new Set((context.studentIds || []).filter(id => typeof id === 'string' && id.length > 0 && id.length <= 120))] : [],
    bookId: returnView === APP_VIEWS.TEACHER_GUIDED_READING && typeof originatingBook === 'string' ? originatingBook.slice(0, 120) : '' };
  try { storage ??= globalThis.sessionStorage; storage?.setItem(key(teacherId, session.id), JSON.stringify(descriptor)); return Boolean(storage); }
  catch { return false; }
}

export function readTeacherSessionReturn({ teacherId, session, storage }) {
  const standard = fallback(session?.class_id);
  if (!teacherId || !session?.id || !session.class_id || (session.teacher_id && session.teacher_id !== teacherId)) return standard;
  try {
    storage ??= globalThis.sessionStorage;
    const value = JSON.parse(storage?.getItem(key(teacherId, session.id)) || 'null');
    if (value?.version !== 1 || value.teacherId !== teacherId || value.sessionId !== session.id || value.classId !== session.class_id
      || !Object.hasOwn(DESTINATIONS, value.returnView) || value.returnLabel !== DESTINATIONS[value.returnView]
      || !['whole_class', 'selected_students'].includes(value.audience) || !Array.isArray(value.studentIds)
      || value.studentIds.some(id => typeof id !== 'string' || !id || id.length > 120)
      || typeof value.bookId !== 'string' || value.bookId.length > 120) return standard;
    // Return only the declared descriptor fields; arbitrary stored route keys
    // cannot reintroduce a hidden learner, active reading session or URL.
    return { classId: value.classId, returnView: value.returnView, returnLabel: value.returnLabel,
      audience: value.audience, studentIds: value.studentIds, bookId: value.bookId };
  } catch { return standard; }
}
