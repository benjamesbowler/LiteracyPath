import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import { reportPriorityForStudent, readingLaunchContext, teacherReadingRouteContext, navigateToTeacherSession } from '../../src/utils/teacherWorkflowContext.js';
import { rememberTeacherSessionReturn, readTeacherSessionReturn } from '../../src/utils/teacherSessionReturn.js';
import { teacherIntentHash } from '../../src/appState/appViewHelpers.js';
import { APP_VIEWS } from '../../src/appState/appViews.js';

// Exercise the exact AppSurface handlers/prop expressions with a synthetic
// controller. The full app needs auth/content providers unrelated to these
// navigation boundaries; duplicating those handlers in a fixture hid regressions.
const source = readFileSync(new URL('../../src/components/AppSurface.jsx', import.meta.url), 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
const nodes = [];
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type) nodes.push(node);
  for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
}
walk(ast);
const evaluate = (node, context) => new Function(...Object.keys(context), `return (${source.slice(node.start, node.end)});`)(...Object.values(context));
const named = name => nodes.find(node => node.type === 'FunctionDeclaration' && node.id?.name === name)
  || nodes.find(node => node.type === 'VariableDeclarator' && node.id?.name === name)?.init;
const handler = (name, context) => evaluate(named(name), context);
const element = (name, attribute) => nodes.find(node => node.type === 'JSXOpeningElement' && node.name?.name === name && node.attributes.some(prop => prop.name?.name === attribute));
const prop = (node, name, context) => evaluate(node.attributes.find(value => value.name?.name === name).value.expression, context);
const roster = Array.from({ length: 7 }, (_, index) => ({ id: `student-${index}`, name: `Learner ${index}`, class_id: 'class-a' }));
const session = { id: 'reading-a', teacher_id: 'teacher', class_id: 'class-a', book_id: 'original-book', student_ids: ['student-0', 'student-1'] };

test('actual Reports priority callback binds the report learner rather than its concept id', () => {
  let request;
  const plan = handler('planFocusedPractice', {
    selectedClassStudent: id => roster.find(student => student.id === id), studentId: 'student-3', selectedClassId: 'class-a',
    setPracticeRequest: value => { request = value; }, goToTeacherIntent() {}, APP_VIEWS
  });
  const callback = nodes.find(node => node.type === 'JSXAttribute' && node.name?.name === 'onTeachPriority').value.expression;
  const onPriority = evaluate(callback, { planFocusedPractice: plan, reportPriorityForStudent, studentId: 'student-3' });
  onPriority({ id: 'initial_sound_picture_identification', label: 'Initial sounds', reason: 'Confused /m/ and /n/.' });
  assert.equal(request.classId, 'class-a');
  assert.deepEqual(request.recommendation.studentIds, ['student-3']);
  assert.equal(request.recommendation.name, 'Learner 3');
  assert.equal(request.recommendation.focus, 'Initial sounds');
  assert.match(request.recommendation.activity, /Confused \/m\/ and \/n\//);
  assert.equal(reportPriorityForStudent({ id: 'concept' }, ''), null);
});

test('actual whole-class reading handoff retains seven ids into real setup props; direct browse stays unselected', () => {
  let launch, opened = false;
  const open = handler('openReadingTogether', {
    resolveReadingLaunchContext: readingLaunchContext, selectedClassId: 'class-a', studentList: roster, appView: APP_VIEWS.TEACHER_RESOURCES, readTeacherFunnelParams: () => new URLSearchParams(),
    setStudentSessionSetupOpen() {}, setReadingLaunchContext: value => { launch = value; }, setReadingSetupOpen: value => { opened = value; }, setMessage() {}
  });
  open({ classId: 'class-a', audience: 'whole_class', studentIds: [], contentId: 'chosen-book', returnLabel: 'Back to Teach' });
  assert.equal(opened, true);
  const setup = element('ReadingSessionSetup', 'initialStudentIds');
  assert.deepEqual(prop(setup, 'initialStudentIds', { readingLaunchContext: launch }), roster.map(student => student.id));
  assert.equal(prop(setup, 'initialBookId', { readingLaunchContext: launch }), 'chosen-book');
  open({ bookId: 'browse-book', studentIds: [] });
  assert.deepEqual(launch.studentIds, []);
  assert.equal(readingLaunchContext({ classId: 'other' }, 'class-a', roster), null);
});

test('actual class reader props isolate browsing from active session book and audience', () => {
  const reader = element('GuidedReadingPage', 'sessionHost');
  const host = { session };
  for (const [query, teacherId, classId, active, book] of [
    ['book=browse-book', 'teacher', 'class-a', false, 'browse-book'],
    ['', 'teacher', 'class-a', false, ''],
    ['readingSession=reading-a&book=browse-book', 'teacher', 'class-a', true, 'original-book'],
    ['readingSession=reading-a&book=browse-book', 'other', 'class-a', false, 'browse-book'],
    ['readingSession=reading-a&book=browse-book', 'teacher', 'class-b', false, 'browse-book']
  ]) {
    const route = teacherReadingRouteContext({ session, teacherId, classId, params: new URLSearchParams(query) });
    const context = { readingRoute: route, activeReadingView: route.active, readingSessionHost: host };
    assert.equal(prop(reader, 'initialBookId', context), book);
    assert.equal(prop(reader, 'sessionHost', context), active ? host : null);
    assert.equal(prop(reader, 'key', context), active ? session.id : 'browse');
    const studentName = reader.attributes.find(value => value.name?.name === 'studentName').value;
    assert.equal(studentName.value, '');
  }
});

test('actual session-result handler waits for class restore then clears a hidden learner in the resulting hash', async () => {
  const events = [];
  let release, hash;
  const selecting = new Promise(resolve => { release = resolve; });
  const go = handler('goToTeacherIntent', {
    readTeacherFunnelParams: () => new URLSearchParams('class=class-b&learner=hidden-student&group=needs-support'),
    selectedClassId: 'class-b', studentId: 'hidden-student', teacherGroupId: 'needs-support',
    teacherIntentHash, setMessage() {}, pushRouteHash: value => { hash = value; events.push('navigate'); }, setAppView() {}
  });
  const open = handler('openSessionDestination', { navigateToTeacherSession, teacherId: 'teacher', selectedClassId: 'class-b',
    selectTeacherClass: async classId => { events.push(`select:${classId}`); return selecting; },
    clearSelectedLearner: () => events.push('clear'), goToTeacherIntent: go, setMessage: message => events.push(message) });
  const pending = open(session, APP_VIEWS.REPORTS);
  assert.deepEqual(events, ['select:class-a']);
  release(true); await pending;
  assert.deepEqual(events, ['select:class-a', 'clear', 'navigate']);
  const params = new URLSearchParams(hash.split('?')[1]);
  assert.equal(params.get('class'), 'class-a'); assert.equal(params.has('learner'), false); assert.equal(params.get('group'), 'all');
});

test('failed or foreign session navigation cannot clear context or emit a results route', async () => {
  for (const selectClass of [async () => false, async () => { throw new Error('offline'); }]) {
    const events = [];
    const opened = await navigateToTeacherSession({ session, teacherId: 'teacher', classId: 'class-b', selectClass,
      clearLearner: () => events.push('clear'), navigate: () => events.push('navigate') });
    assert.equal(opened, false); assert.deepEqual(events, []);
  }
  const forbidden = () => { throw new Error('must not navigate'); };
  assert.equal(await navigateToTeacherSession({ session, teacherId: 'other', classId: 'class-a', selectClass: forbidden, clearLearner: forbidden, navigate: forbidden }), false);
});

test('actual Return to reading action includes explicit session and original-book route, clearing hidden learner', async () => {
  let args;
  const strip = element('TeacherReadingSessionStrip', 'onOpen');
  prop(strip, 'onOpen', { activeReadingSession: session, APP_VIEWS, openSessionDestination: (...values) => { args = values; } })();
  assert.equal(args[0], session); assert.equal(args[1], APP_VIEWS.TEACHER_GUIDED_READING);
  assert.deepEqual(args[2], { bookId: 'original-book', readingSession: 'reading-a' });
  let route;
  await navigateToTeacherSession({ session, teacherId: 'teacher', classId: 'class-a', nextView: args[1], routeContext: { ...args[2], classId: 'foreign', learnerId: 'hidden' }, clearLearner() {}, navigate: (_, context) => { route = context; } });
  assert.deepEqual(route, { bookId: 'original-book', readingSession: 'reading-a', classId: 'class-a', learnerId: '', groupId: 'all' });
});


test('actual focus start persists origin separately from server session and return restores its class without a learner', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  let adopted, destination;
  const setup = element('StudentSessionSetupDialog', 'onStarted');
  const started = prop(setup, 'onStarted', { teacherId: 'teacher', studentSessionContext: { returnView: APP_VIEWS.REPORTS, audience: 'selected_students', studentIds: ['student-3'] },
    rememberTeacherSessionReturn: options => rememberTeacherSessionReturn({ ...options, storage }), setStudentSessionSetupOpen() {}, studentFocusHost: { adoptSession: value => { adopted = value; } } });
  started(session);
  assert.equal(adopted, session);
  assert.equal(Object.hasOwn(adopted, 'returnView'), false);
  // A subsequent server poll/reload supplies a fresh session object with no UI metadata.
  const polled = JSON.parse(JSON.stringify(session));
  const read = options => readTeacherSessionReturn({ ...options, storage });
  const returned = handler('returnToSessionOrigin', { teacherId: 'teacher', readTeacherSessionReturn: read,
    openSessionDestination: async (record, view, route) => navigateToTeacherSession({ session: record, teacherId: 'teacher', classId: 'class-b', nextView: view, routeContext: route,
      selectClass: async id => id === 'class-a', clearLearner() {}, navigate: (nextView, context) => { destination = { nextView, context }; } }) });
  assert.equal(await returned(polled), true);
  assert.equal(read({ teacherId: 'teacher', session: polled }).returnLabel, 'Back to Reports');
  assert.deepEqual(destination, { nextView: APP_VIEWS.REPORTS, context: { bookId: '', classId: 'class-a', learnerId: '', groupId: 'all' } });
});

test('actual reading completion returns through the saved-origin handler rather than choosing Dashboard', () => {
  const changes = [];
  const ended = handler('handleReadingSessionEnded', { activeReadingSession: session,
    setActiveReadingSession: value => changes.push(['active', value]), setGuidedInitialBookId: value => changes.push(['book', value]),
    returnToSessionOrigin: value => changes.push(['return', value]) });
  ended({ session });
  assert.deepEqual(changes, [['active', null], ['book', ''], ['return', session]]);
});

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const classSelectionContext = teacherSelectionScopeRef => ({ teacherId: 'teacher', teacherSelectionScopeRef,
  setClassDashboard() {}, setSelectedClassId() {}, setTeacherGroupId() {}, setTeacherStudentContext() {},
  setNameSaved() {}, setStudentList() {}, setArchivedStudentList() {} });

test('actual class selection rejects stale dashboards, superseded classes and replaced accounts', async () => {
  const scope = { current: { teacherId: 'teacher', classId: 'class-a' } };
  const stale = handler('selectTeacherClass', { ...classSelectionContext(scope),
    loadStudents: async () => roster, loadClassDashboard: async () => ({ ok: false, stale: true }) });
  assert.equal(await stale('class-b'), false, 'a valid roster cannot make a stale dashboard current');

  const first = deferred();
  const choose = handler('selectTeacherClass', { ...classSelectionContext(scope),
    loadStudents: async id => id === 'class-b' ? first.promise : [],
    loadClassDashboard: async () => ({ ok: true }) });
  const earlier = choose('class-b');
  assert.equal(await choose('class-c'), true);
  first.resolve(roster);
  assert.equal(await earlier, false, 'old classes cannot be restored after a later choice');

  const accountRead = deferred();
  const accountChoice = handler('selectTeacherClass', { ...classSelectionContext(scope),
    loadStudents: () => accountRead.promise, loadClassDashboard: async () => ({ ok: true }) });
  const pending = accountChoice('class-a');
  scope.current = { teacherId: 'other-teacher', classId: 'class-a' };
  accountRead.resolve(roster);
  assert.equal(await pending, false, 'an old account cannot finish a new account navigation');
});

test('same-event class changes cancel the actual progress loader before late writes and the row action before navigation', async () => {
  const controllerSource = readFileSync(new URL('../../src/appState/useAppSessionController.js', import.meta.url), 'utf8');
  const controllerAst = parse(controllerSource, { sourceType: 'module', plugins: ['jsx'] });
  let loaderNode;
  const findLoader = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && node.id?.name === 'loadStudentProgress') loaderNode = node;
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(findLoader); else if (value && typeof value === 'object') findLoader(value);
  };
  findLoader(controllerAst);
  const scope = { current: { teacherId: 'teacher', classId: 'class-a' } };
  const cloud = deferred();
  const progressWrites = [];
  const loaderContext = { selectedClassId: 'class-a', studentId: '', teacherId: 'teacher',
    studentProgressLoadSequenceRef: { current: 0 }, authIdentityGenerationRef: { current: 0 },
    controllerMountedRef: { current: true }, lastAuthUserIdRef: { current: 'teacher' },
    answerInFlightRef: {}, roundItemKeysRef: {}, roundQuestionIdsRef: {}, answerHistoryRef: {},
    elBenchmarkSession: null, loadManualAssessmentDrafts: () => ({}), loadElBenchmarkDraft: () => null,
    hydrateCloudProgress: () => cloud.promise, settleTeacherRead: async () => ({ data: [], records: [], complete: true }),
    APP_VIEWS };
  for (const name of ['setTeacherStudentContext', 'setNameSaved', 'setSelectedStudentEvidenceReady', 'setSelectedStudentEvidenceReadState',
    'setRoundAnswers', 'setRoundItemKeys', 'setRoundQuestionIds', 'setUsedByStage', 'setItemSessionSeen', 'setCurrentQuestion',
    'setFeedback', 'setAssessmentTransitioning', 'setMastery', 'setItemMastery', 'setAnswerHistory', 'setLetterIndex',
    'setLetterAssessment', 'setPatternIndex', 'setPatternAssessment', 'setPatternAttempt', 'setElBenchmarkSession',
    'migrateGuidedReadingStorage', 'configureProgressSync', 'setCheckpointDecision']) loaderContext[name] = value => progressWrites.push([name, value]);
  const actualLoad = new Function(...Object.keys(loaderContext), `return (${controllerSource.slice(loaderNode.start, loaderNode.end)});`)(...Object.values(loaderContext));
  const selectionContext = { teacherSelectionScopeRef: scope, teacherId: 'teacher', selectedClassId: 'class-a', studentId: '',
    selectedClassStudent: () => roster[0], reportStaleStudentSelection() {} };
  const loadSelectedClassStudent = handler('loadSelectedClassStudent', { ...selectionContext, loadStudentProgress: actualLoad });
  const selectStudent = handler('selectStudentIfNeeded', { ...selectionContext, loadSelectedClassStudent });
  const actions = [];
  const onOpen = prop(element('TeacherStudentsPage', 'onOpenElFormalCheck'), 'onOpenElFormalCheck', {
    selectStudentIfNeeded: selectStudent, goToTeacherIntent: () => actions.push('navigate'), APP_VIEWS
  });
  const pending = onOpen(roster[0]);
  const initialWrites = progressWrites.length;
  assert.ok(initialWrites > 0, 'the real loader started before the selection changed');
  const choose = handler('selectTeacherClass', { ...classSelectionContext(scope), loadStudents: async () => [], loadClassDashboard: async () => ({ ok: true }) });
  await choose('class-b');
  // No render is simulated here: selection itself must invalidate the old load.
  cloud.resolve([]);
  await pending;
  assert.equal(progressWrites.length, initialWrites, 'no old evidence can commit after the class switch');
  assert.deepEqual(actions, [], 'the old learner action cannot navigate into the new class');
});

test('actual student selection revalidates teacher context after awaiting evidence', async () => {
  const scope = { current: { teacherId: 'teacher', classId: 'class-a' } };
  const evidence = deferred();
  const select = handler('selectStudentIfNeeded', { teacherSelectionScopeRef: scope, teacherId: 'teacher', selectedClassId: 'class-a', studentId: '',
    selectedClassStudent: () => roster[0], loadSelectedClassStudent: () => evidence.promise, reportStaleStudentSelection() {} });
  const pending = select(roster[0]);
  scope.current = { teacherId: 'other-teacher', classId: 'class-a' };
  evidence.resolve({ syncStatus: 'complete' });
  assert.equal(await pending, false);
});

test('Students own class picker invalidates awaiting row actions before a rerender', () => {
  const previous = { teacherId: 'teacher', classId: 'class-a' };
  const scope = { current: previous };
  const choose = prop(element('TeacherStudentsPage', 'setSelectedClassId'), 'setSelectedClassId', classSelectionContext(scope));
  choose('class-b');
  assert.notEqual(scope.current, previous);
  assert.deepEqual(scope.current, { teacherId: 'teacher', classId: 'class-b' });
});
