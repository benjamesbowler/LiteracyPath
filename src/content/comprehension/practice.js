import { shuffleAnswerPositions } from '../../utils/answerPositionShuffle.js';
const VERSION=2;
const newSeed=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}:${Math.random()}`;
export function initialPractice(passage,runSeed=newSeed()) { return {version:VERSION,passageId:passage.id,runSeed,reads:[false,false,false],responses:{},completed:false}; }
export function practiceQuestion(passage,state,index){
 const question=passage.questions[index];
 return {...question,options:shuffleAnswerPositions(question.options,`${state.runSeed}:${passage.id}:${question.id}`)};
}
export function reducePractice(passage,state,action) {
 if(action.type==='reset')return initialPractice(passage);
 if(action.type==='read'&&Number.isInteger(action.index)&&action.index>=0&&action.index<3){
  return {...state,reads:state.reads.map((v,i)=>i===action.index?!v:v)};
 }
 const q=passage.questions.find(q=>q.id===action.questionId);
 if(action.type!=='answer'||!q||!q.options.includes(action.value))return state;
 const old=state.responses[q.id];
 if(old?.correct)return state;
 const responses={...state.responses,[q.id]:{first:old?.first??action.value,last:action.value,attempts:(old?.attempts||0)+1,correct:action.value===q.answer}};
 return {...state,responses,completed:passage.questions.every(q=>responses[q.id]?.correct===true)};
}
function key(scope,p) {return `lp-comprehension:v${VERSION}:${encodeURIComponent(scope)}:${p.id}`;}
function valid(p,s) {
 if(!s||typeof s.runSeed!=='string'||!s.runSeed.length||s.runSeed.length>200||s.version!==VERSION||s.passageId!==p.id||!Array.isArray(s.reads)||s.reads.length!==3||s.reads.some(v=>typeof v!=='boolean')||!s.responses||typeof s.responses!=='object'||Array.isArray(s.responses))return false;
 for(const [id,r] of Object.entries(s.responses)){
  const q=p.questions.find(q=>q.id===id);
  if(!q||!r||!q.options.includes(r.first)||!q.options.includes(r.last)||!Number.isSafeInteger(r.attempts)||r.attempts<1||r.attempts>1000||r.correct!==(r.last===q.answer))return false;
  if(r.attempts===1&&r.first!==r.last)return false;
 }
 return s.completed===p.questions.every(q=>s.responses[q.id]?.correct===true);
}
export function readPractice(storage,scope,p) {
 try{const s=JSON.parse(storage?.getItem(key(scope,p))||'null');if(valid(p,s))return s;}catch{/* start a new local run */}
 const fresh=initialPractice(p);savePractice(storage,scope,p,fresh);return fresh;
}
export function savePractice(storage,scope,p,state) {
 try{if(!scope||!valid(p,state)||!storage)return false;storage.setItem(key(scope,p),JSON.stringify(state));return true;}catch{return false;}
}
