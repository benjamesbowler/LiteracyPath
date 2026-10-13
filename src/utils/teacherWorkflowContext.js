import { resolveLaunchAudience } from './teacherLaunchContext.js';

/** A reporting priority id identifies a concept; the report owns the learner. */
export function reportPriorityForStudent(priority, studentId) {
  return priority && studentId ? { ...priority, id: studentId, studentId } : null;
}

export function readingLaunchContext(context = {}, classId, students = []) {
  if (!classId || (context.classId && context.classId !== classId)) return null;
  const studentIds = context.audience === 'whole_class'
    ? resolveLaunchAudience(context, students).students.map(student => student.id)
    : [...(context.studentIds || [])];
  return { ...context, classId, studentIds };
}

/** Browsing books never implicitly adopts an active group's book or audience. */
export function teacherReadingRouteContext({ session, teacherId, classId, params }) {
  const active = Boolean(session?.id && session.teacher_id === teacherId
    && session.class_id === classId && params.get('readingSession') === session.id);
  return {
    active,
    key: active ? session.id : 'browse',
    bookId: active ? session.book_id : params.get('book') || ''
  };
}

/** Restore the session class before clearing learner context or changing route. */
export async function navigateToTeacherSession({ session, teacherId, classId, nextView,
  routeContext = {}, selectClass, clearLearner, navigate }) {
  if (!session?.class_id || (session.teacher_id && session.teacher_id !== teacherId)) return false;
  if (session.class_id !== classId) {
    try { if (!await selectClass(session.class_id)) return false; }
    catch { return false; }
  }
  clearLearner();
  navigate(nextView, { ...routeContext, classId: session.class_id, learnerId: '', groupId: 'all' });
  return true;
}
