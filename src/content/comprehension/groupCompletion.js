// Teacher-controlled class checks are separate from learner practice and print
// selection. One passage per key avoids overwriting another tab's class checks.
const VERSION = 1;
export function groupCompletionPrefix(scope) {
 return typeof scope === 'string' && scope.trim()
  ? `lp-comprehension-whole-group:${encodeURIComponent(scope)}:` : null;
}
export function groupCompletionKey(scope, passageId) {
 const prefix = groupCompletionPrefix(scope);
 return prefix && typeof passageId === 'string' && passageId
  ? `${prefix}${encodeURIComponent(passageId)}` : null;
}
export function readGroupCompletion(storage, scope, passageIds) {
 const completed = [];
 if (!groupCompletionPrefix(scope)) return {completed, status:'needs-class'};
 if (!storage) return {completed, status:'unavailable'};
 let invalid = false;
 try {
  for (const id of new Set(passageIds)) {
   const raw = storage.getItem(groupCompletionKey(scope, id));
   if (raw == null) continue;
   let record;
   try { record = JSON.parse(raw); } catch { invalid = true; continue; }
   if (record?.version !== VERSION || record.passageId !== id || typeof record.completed !== 'boolean') { invalid = true; continue; }
   if (record.completed) completed.push(id);
  }
  return {completed, status:invalid?'invalid':'ready'};
 } catch { return {completed, status:'unavailable'}; }
}
export function saveGroupCompletion(storage, scope, passageId, completed) {
 const key = groupCompletionKey(scope, passageId);
 if (!key || !storage || typeof completed !== 'boolean') return false;
 try {
  storage.setItem(key, JSON.stringify({version:VERSION, passageId, completed}));
  return true;
 } catch { return false; }
}
