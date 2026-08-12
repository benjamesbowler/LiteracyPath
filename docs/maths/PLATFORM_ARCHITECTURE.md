# Maths platform architecture and code contracts

## 1. Architecture decision

Use a modular monolith inside the existing React/Vite application and linked
Supabase project. Introduce a stable `subject` boundary at navigation, content,
evidence and reporting layers. Shared entities remain shared; subject-specific
learning data is namespaced.

### Reuse unchanged

- teacher authentication and approval;
- schools, classes, learners and archive rules;
- picture-code sign-in and child session token;
- teacher shell, navigation and responsive primitives;
- retry queues and offline-safe inserts;
- export provenance, data rights and deletion workflows;
- error monitoring and PostgREST function verification.

### New subject modules

```text
src/maths/
├── curriculum/
│   ├── mathsSkillTree.js
│   ├── mathsCycles.js
│   ├── mathsPrerequisites.js
│   └── standardsCrosswalk.js
├── assessment/
│   ├── mathsAssessmentBlueprints.js
│   ├── mathsAssessmentBank.js
│   ├── mathsAssessmentController.js
│   ├── mathsEvidencePolicy.js
│   └── mathsMisconceptionEngine.js
├── manipulatives/
│   ├── CounterTray.jsx
│   ├── FiveFrame.jsx
│   ├── TenFrame.jsx
│   ├── Rekenrek.jsx
│   ├── NumberLine.jsx
│   ├── PartWholeModel.jsx
│   ├── BaseTenBlocks.jsx
│   ├── BarModel.jsx
│   ├── BalanceScale.jsx
│   ├── ClockFace.jsx
│   ├── CoinTray.jsx
│   └── ShapeBuilder.jsx
├── learn/
│   ├── MathsHome.jsx
│   ├── MathsLessonPlayer.jsx
│   ├── MathsPracticeRouter.jsx
│   └── activities/
├── stories/
│   ├── mathsStoryCatalog.js
│   ├── MathsStoryReader.jsx
│   └── mathsStoryQuestions.js
├── games/
│   ├── MathsArcade.jsx
│   └── games/
├── teacher/
│   ├── MathsTeacherWorkspace.jsx
│   └── mathsWorksheetTasks.js
├── reports/
│   ├── mathsReportingModel.js
│   ├── MathsClassReport.jsx
│   └── MathsLearnerReport.jsx
└── policy/
    ├── mathsLearningPolicy.js
    ├── mathsStatusPolicy.js
    └── mathsAccessibilityPolicy.js
```

## 2. Shared subject registry

Create `src/subjects/subjectRegistry.js`:

```js
export const SUBJECT_IDS = Object.freeze({
  LITERACY: "literacy",
  MATHS: "maths"
});

export const SUBJECTS = Object.freeze({
  literacy: Object.freeze({
    id: "literacy",
    label: "Literacy",
    icon: "book-open",
    studentHomeView: "studentHome",
    teacherHomeView: "teacherDashboard"
  }),
  maths: Object.freeze({
    id: "maths",
    label: "Maths",
    icon: "shapes",
    studentHomeView: "mathsStudentHome",
    teacherHomeView: "mathsTeacherDashboard"
  })
});

export function assertSubjectId(value) {
  if (!SUBJECTS[value]) throw new Error(`Unknown subject: ${value}`);
  return value;
}
```

Add these view IDs to `src/appState/appViews.js`:

```js
MATHS_STUDENT_HOME: "mathsStudentHome",
MATHS_LEARN: "mathsLearn",
MATHS_STORIES: "mathsStories",
MATHS_ARCADE: "mathsArcade",
MATHS_ASSESSMENT: "mathsAssessment",
MATHS_TEACHER_DASHBOARD: "mathsTeacherDashboard",
MATHS_TEACHER_ASSESSMENTS: "mathsTeacherAssessments",
MATHS_TEACHER_REPORTS: "mathsTeacherReports",
MATHS_TEACHER_RESOURCES: "mathsTeacherResources",
MATHS_PRESENT: "mathsPresent",
MATHS_WORKSHEETS: "mathsWorksheets",
MATHS_SMALL_GROUPS: "mathsSmallGroups"
```

The URL contract is `#maths/<surface>?class=<uuid>&learner=<uuid>`. Existing
literacy hashes remain valid. The active subject is derived from the route and may
be cached as a preference; cached state never overrides an explicit URL.

## 3. Curriculum contracts

Create `src/maths/curriculum/mathsSkillTree.js`:

```js
/** @typedef {"F"|"1"|"2"} MathsYear */
/** @typedef {"number"|"algebra"|"measurement"|"space"|"statistics"|"probability"} MathsStrand */

export const mathsSkillTree = Object.freeze([
  {
    id: "F-N-COUNT-10",
    subject: "maths",
    year: "F",
    strand: "number",
    label: "Count collections to 10",
    prerequisiteIds: [],
    representations: ["objects", "fingers", "five_frame", "numeral"],
    assessmentBlueprintIds: ["count_collection", "make_quantity"],
    misconceptionIds: ["unstable_order", "one_to_one", "cardinality"],
    standards: ["AC9MFN01", "CCSS.K.CC.B.4", "CCSS.K.CC.B.5"]
  }
]);
```

Every skill record must contain:

```ts
type MathsSkill = {
  id: string;
  subject: "maths";
  year: "F" | "1" | "2";
  strand: "number" | "algebra" | "measurement" | "space" | "statistics" | "probability";
  label: string;
  childLabel: string;
  teacherIntent: string;
  prerequisiteIds: string[];
  representations: MathsRepresentationId[];
  vocabulary: string[];
  assessmentBlueprintIds: string[];
  misconceptionIds: string[];
  transferContexts: string[];
  standards: string[];
};
```

## 4. Activity and evidence contracts

All learning and assessment interactions emit the same event shape:

```ts
type MathsEvidenceEvent = {
  eventId: string;
  subject: "maths";
  studentId: string;
  classId: string;
  skillId: string;
  activityId: string;
  source: "formal_assessment" | "teacher_observation" | "guided_practice" | "independent_practice" | "game" | "story_discussion";
  responseStatus: "correct" | "incorrect" | "not_checked" | "discontinued";
  representation: MathsRepresentationId;
  promptVersion: string;
  itemKey: string;
  response: Record<string, unknown>;
  expected: Record<string, unknown>;
  strategyCode: string | null;
  misconceptionCodes: string[];
  hintCount: number;
  attemptCount: number;
  elapsedMs: number | null;
  occurredAt: string;
};
```

`elapsedMs` supports UX diagnosis and optional fluency investigation. It is not a
mastery input in Foundation–Year 2 v1.

### Evidence weighting

```js
export const MATHS_EVIDENCE_POLICY = Object.freeze({
  formal_assessment: { scored: true, canCreateSecure: true },
  teacher_observation: { scored: true, canCreateSecure: true },
  independent_practice: { scored: true, canCreateSecure: false },
  guided_practice: { scored: false, canCreateSecure: false },
  game: { scored: false, canCreateSecure: false },
  story_discussion: { scored: false, canCreateSecure: false }
});
```

## 5. Supabase migration

Create one additive migration. Do not add a second project.

```sql
create table public.maths_evidence_events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  student_id uuid not null,
  client_event_id uuid not null,
  skill_id text not null,
  activity_id text not null,
  source text not null check (source in (
    'formal_assessment','teacher_observation','guided_practice',
    'independent_practice','game','story_discussion'
  )),
  response_status text not null check (response_status in (
    'correct','incorrect','not_checked','discontinued'
  )),
  representation text not null,
  prompt_version text not null,
  item_key text not null,
  response jsonb not null default '{}'::jsonb,
  expected jsonb not null default '{}'::jsonb,
  strategy_code text,
  misconception_codes text[] not null default '{}',
  hint_count integer not null default 0 check (hint_count >= 0),
  attempt_count integer not null default 1 check (attempt_count > 0),
  elapsed_ms integer check (elapsed_ms is null or elapsed_ms >= 0),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, client_event_id),
  foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id) on delete cascade,
  foreign key (student_id, teacher_id)
    references public.students(id, teacher_id) on delete cascade
);

create index maths_evidence_student_skill_time
  on public.maths_evidence_events(student_id, skill_id, occurred_at desc);
create index maths_evidence_teacher_class_time
  on public.maths_evidence_events(teacher_id, class_id, occurred_at desc);

alter table public.maths_evidence_events enable row level security;

create policy "Teachers read owned maths evidence"
on public.maths_evidence_events for select to authenticated
using (teacher_id = auth.uid());

create or replace function public.student_record_maths_evidence(
  p_token text,
  p_event jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_student public.students;
  v_id uuid;
  v_event_id uuid;
  v_source text;
  v_status text;
begin
  if p_event is null or jsonb_typeof(p_event) <> 'object'
     or octet_length(p_event::text) > 16384 then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  begin
    v_event_id := (p_event->>'eventId')::uuid;
  exception when invalid_text_representation then
    return jsonb_build_object('ok', false, 'error', 'invalid_event_id');
  end;

  v_source := p_event->>'source';
  v_status := p_event->>'responseStatus';
  if nullif(btrim(coalesce(p_event->>'skillId','')), '') is null
     or char_length(p_event->>'skillId') > 120
     or nullif(btrim(coalesce(p_event->>'activityId','')), '') is null
     or char_length(p_event->>'activityId') > 120
     or nullif(btrim(coalesce(p_event->>'representation','')), '') is null
     or char_length(p_event->>'representation') > 80
     or nullif(btrim(coalesce(p_event->>'promptVersion','')), '') is null
     or char_length(p_event->>'promptVersion') > 80
     or nullif(btrim(coalesce(p_event->>'itemKey','')), '') is null
     or char_length(p_event->>'itemKey') > 160
     or v_source not in ('formal_assessment','teacher_observation','guided_practice','independent_practice','game','story_discussion')
     or v_status not in ('correct','incorrect','not_checked','discontinued') then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  v_student := public.student_from_token(p_token);
  if v_student.id is null or v_student.archived_at is not null then
    return jsonb_build_object('ok', false, 'error', 'invalid_student');
  end if;

  insert into public.maths_evidence_events (
    teacher_id,class_id,student_id,client_event_id,skill_id,activity_id,
    source,response_status,representation,prompt_version,item_key,response,
    expected,strategy_code,misconception_codes,hint_count,attempt_count,
    elapsed_ms,occurred_at
  ) values (
    v_student.teacher_id,v_student.class_id,v_student.id,
    v_event_id,p_event->>'skillId',p_event->>'activityId',
    v_source,v_status,p_event->>'representation',
    p_event->>'promptVersion',p_event->>'itemKey',
    coalesce(p_event->'response','{}'::jsonb),
    coalesce(p_event->'expected','{}'::jsonb),
    nullif(p_event->>'strategyCode',''),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_event->'misconceptionCodes','[]'::jsonb))), '{}'),
    coalesce((p_event->>'hintCount')::integer,0),
    coalesce((p_event->>'attemptCount')::integer,1),
    nullif(p_event->>'elapsedMs','')::integer,
    coalesce((p_event->>'occurredAt')::timestamptz,now())
  ) on conflict (student_id, client_event_id) do update
    set occurred_at = excluded.occurred_at
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.student_record_maths_evidence(text,jsonb) from public;
grant execute on function public.student_record_maths_evidence(text,jsonb)
  to anon, authenticated;
```

This uses the current `(id, teacher_id)` student ownership key and
`public.student_from_token(text)` token resolver. The implementation migration must
also extend the current learner export/delete functions, follow the latest
security-definer boundary and be added to the live verification manifest.

## 6. Derived mastery

Do not store a single mutable percentage as truth. Derive a snapshot from immutable
evidence and optionally cache it.

```ts
type MathsSkillSnapshot = {
  skillId: string;
  status: "secure" | "developing" | "needs_support" |
    "not_enough_evidence" | "not_checked" | "mixed_evidence";
  formalEvidenceCount: number;
  correctCount: number;
  representationsSeen: string[];
  misconceptionCodes: string[];
  lastCheckedAt: string | null;
  retainedAt: string | null;
  nextActionId: string;
};
```

The initial status policy is evidence-volume and recency based, not speed based.
Exact thresholds must be calibrated with real pilot data before `Secure` is enabled
for production reporting. Until then, formal assessment results display item-level
evidence and `Not enough results` rather than an invented mastery claim.

## 7. Error handling and offline behaviour

- Every child event receives a UUID before submission.
- Failed writes enter the existing retry queue and remain visible as pending.
- Duplicate retries are idempotent by `(student_id, client_event_id)`.
- Media load failure replaces an item before the learner responds; it does not
  count as incorrect.
- Interrupted formal assessments save a resumable immutable draft.
- Teacher reports distinguish `pending sync`, `not checked` and `incorrect`.
- No route may silently fall back from Maths to a Literacy skill.

## 8. Locale and accessibility

Create `src/maths/locale/mathsLocale.js` with:

```ts
type MathsLocale = {
  locale: string;
  mathsLabel: string;
  decimalSeparator: "." | ",";
  currencyCode: string;
  currencySymbol: string;
  coinSetId: string;
  dateOrder: "DMY" | "MDY";
  measurementSystem: "metric" | "customary";
};
```

Launch default: `en-AU`, AUD, metric, `Maths`. The architecture permits `en-US`,
USD, customary units and `Math` without duplicating content logic.

All manipulative actions require tap/keyboard alternatives to drag, 56px minimum
targets, visible focus, colour-independent states, reduced motion and written
equivalents for audio. Number Stories never require reading to demonstrate maths.
