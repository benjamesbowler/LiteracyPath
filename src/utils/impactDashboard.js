const DAY_MS = 86400000;
export const MIN_COMPARABLE_LEARNERS = 3;
const accuracy = rows => rows.length ? rows.filter(row => row.is_correct === true).length / rows.length * 100 : null;

export function buildImpactDashboard({ answers = [], studentIds = [], windowDays = 28, now = new Date() } = {}) {
  const end = new Date(now).getTime(), currentStart = end - windowDays * DAY_MS, priorStart = end - windowDays * 2 * DAY_MS;
  const allowed = new Set(studentIds.map(String));
  const scoped = answers.filter(row => allowed.has(String(row.student_id)) && Number.isFinite(new Date(row.answered_at).getTime()));
  const learners = [...allowed].map(studentId => { const rows=scoped.filter(row=>String(row.student_id)===studentId);const current=rows.filter(row=>{const at=new Date(row.answered_at).getTime();return at>=currentStart&&at<=end});const prior=rows.filter(row=>{const at=new Date(row.answered_at).getTime();return at>=priorStart&&at<currentStart});return{studentId,current,prior,comparable:current.length>=5&&prior.length>=5} });
  const comparable=learners.filter(row=>row.comparable);
  const enoughLearners = comparable.length >= MIN_COMPARABLE_LEARNERS;
  const currentAccuracy=enoughLearners?comparable.reduce((sum,row)=>sum+accuracy(row.current),0)/comparable.length:null;
  const priorAccuracy=enoughLearners?comparable.reduce((sum,row)=>sum+accuracy(row.prior),0)/comparable.length:null;
  const changePp=currentAccuracy===null?null:currentAccuracy-priorAccuracy;
  const skillNames=[...new Set(scoped.map(row=>String(row.skill||row.diagnostic_target||"").trim()).filter(Boolean))];
  const skills=skillNames.flatMap(skill=>{const changes=comparable.flatMap(learner=>{const current=learner.current.filter(row=>(row.skill||row.diagnostic_target)===skill),prior=learner.prior.filter(row=>(row.skill||row.diagnostic_target)===skill);return current.length>=3&&prior.length>=3?[{current:accuracy(current),prior:accuracy(prior)}]:[]});if(changes.length<MIN_COMPARABLE_LEARNERS)return[];const current=changes.reduce((sum,row)=>sum+row.current,0)/changes.length,prior=changes.reduce((sum,row)=>sum+row.prior,0)/changes.length;return[{skill,learnerCount:changes.length,currentAccuracy:current,priorAccuracy:prior,changePp:current-prior}]}).sort((a,b)=>b.changePp-a.changePp);
  return{schemaVersion:2,windowDays,currentStart:new Date(currentStart).toISOString(),currentEnd:new Date(end).toISOString(),priorStart:new Date(priorStart).toISOString(),comparableLearners:comparable.length,totalLearners:allowed.size,currentAccuracy,priorAccuracy,changePp,interpretation:changePp===null?"insufficient":changePp>=3?"higher":changePp<=-3?"lower":"similar",skills,claim:"observed_association_not_causal_impact",minimumResponsesPerLearnerPerWindow:5,minimumComparableLearners:MIN_COMPARABLE_LEARNERS};
}

export function impactDashboardCsv(model) {
  const rows=[["metric","current","prior","change_percentage_points","comparable_learners"],["class_equal_learner_accuracy",model.currentAccuracy?.toFixed(1)||"",model.priorAccuracy?.toFixed(1)||"",model.changePp?.toFixed(1)||"",model.comparableLearners],...model.skills.map(row=>[`skill:${row.skill}`,row.currentAccuracy.toFixed(1),row.priorAccuracy.toFixed(1),row.changePp.toFixed(1),row.learnerCount]),[],["claim",model.claim],["window_days",model.windowDays],["minimum_responses_per_learner_per_window",model.minimumResponsesPerLearnerPerWindow],["minimum_comparable_learners",model.minimumComparableLearners]];
  return rows.map(row=>row.map(value=>`"${String(value??"").replaceAll('"','""')}"`).join(",")).join("\n");
}
