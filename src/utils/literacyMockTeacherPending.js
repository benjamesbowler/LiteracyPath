const PREFIX = 'lp-mock-teacher-pending-v1:';
const kinds = new Set(['preparation', 'control', 'evidence']);
const key = (teacherId, classId) => `${PREFIX}${encodeURIComponent(teacherId)}:${encodeURIComponent(classId)}`;
const storageError = () => new Error('This browser could not keep the retry details. No new action was sent. Check site storage and try again.');

export function readMockTeacherPending(teacherId, classId, storage = globalThis.localStorage) {
  if (!teacherId || !classId || !storage) throw storageError();
  const raw = storage.getItem(key(teacherId, classId));
  if (!raw) return null;
  let record;
  try { record = JSON.parse(raw); } catch { throw new Error('The earlier action could not be read. Keep this browser open and recover its retry details before starting another action.'); }
  if (record?.teacherId !== teacherId || record.classId !== classId || !kinds.has(record.kind)
    || !record.args || typeof record.args.requestId !== 'string' || !record.args.requestId
    || (record.kind === 'preparation' && record.args.classId !== classId)) throw storageError();
  return record;
}

export function saveMockTeacherPending(teacherId, classId, kind, args, storage = globalThis.localStorage) {
  if (!kinds.has(kind) || !args?.requestId) throw storageError();
  const previous = readMockTeacherPending(teacherId, classId, storage);
  if (previous && (previous.kind !== kind || previous.args.requestId !== args.requestId
    || JSON.stringify(previous.args) !== JSON.stringify(args))) {
    throw new Error('An earlier action is waiting for confirmation. Reload and retry that same action first.');
  }
  const record = { teacherId, classId, kind, args };
  try {
    const serialized = JSON.stringify(record);
    storage.setItem(key(teacherId, classId), serialized);
    if (storage.getItem(key(teacherId, classId)) !== serialized) throw storageError();
  } catch { throw storageError(); }
  return record;
}

export function clearMockTeacherPending(teacherId, classId, requestId, storage = globalThis.localStorage) {
  const record = readMockTeacherPending(teacherId, classId, storage);
  if (!record || record.args.requestId !== requestId) return;
  storage.removeItem(key(teacherId, classId));
  if (storage.getItem(key(teacherId, classId))) throw new Error('The confirmed action could not clear its retry details. Reload to recover the same result.');
}
