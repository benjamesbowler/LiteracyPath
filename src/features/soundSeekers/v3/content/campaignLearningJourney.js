import { CAMPAIGN_STAGES,CAMPAIGN_MISSIONS } from './campaign.js';
// Explicit practice crosswalk, not equivalence with an EL Cycle Check. Several
// EL cycles revisit a spelling: a stage number must never stand in for a cycle.
const rows=[
 [1,['s1'],'a, m'],[2,['s1'],'t, s'],[3,['s2'],'n, i'],[4,['s2'],'f, d'],
 [5,['s3'],'o, l'],[6,['s3'],'r, h'],[7,['s1','s2','s3'],'Early sound and word review'],
 [8,['s4'],'b, w'],[9,['s4'],'qu, u'],[10,['s5'],'c, g'],[11,['s5','s6'],'p, y, x'],
 [12,['s6'],'e, v'],[13,['s6','s7'],'k, j, z'],[14,['s8'],'Blending and word review'],
 [15,['s9','s10'],'sh, ch, th'],[16,['s1','s7','s8'],'Short a and word-family practice'],
 [17,['s2','s8'],'Short i word practice'],[18,['s3','s8'],'Short o word practice'],
 [19,['s4','s8'],'Short u word practice'],[20,['s6','s8'],'Short e word practice'],
 [21,['s11'],'wh'],[22,['s11'],'nk'],[23,['s10','s17'],'ng and word families'],
 [24,['s7','s17'],'ff, ll, ss, zz'],[25,['s8','s17'],'Connected word review'],
 [26,['s16','s17'],'Pattern and final-y practice'],[27,['s8','s17'],'Cumulative reading practice']
];
export const CAMPAIGN_EL_PRACTICE=Object.freeze(rows.map(([cycleNumber,anchorIds,focus])=>Object.freeze({cycleNumber,anchorIds,focus,stageIds:CAMPAIGN_STAGES.filter(s=>s.anchorIds.some(id=>anchorIds.includes(id))).map(s=>s.id),alignment:'related-practice-not-cycle-assessment'})));
export const CAMPAIGN_BEYOND_EL=Object.freeze([
 {name:'Long vowels and vowel teams',anchors:Array.from({length:13},(_,i)=>`s${i+18}`)},
 {name:'R-controlled vowels and alternative spellings',anchors:Array.from({length:7},(_,i)=>`s${i+31}`)},
 {name:'Word endings and longer words',anchors:['s38','s39','s40']}
]);
export function learningJourneyForStage(stageId){const stage=CAMPAIGN_STAGES.find(s=>s.id===stageId);if(!stage)return null;return {cycles:CAMPAIGN_EL_PRACTICE.filter(c=>c.stageIds.includes(stageId)).map(c=>c.cycleNumber),extensions:CAMPAIGN_BEYOND_EL.filter(c=>c.anchors.some(a=>stage.anchorIds.includes(a))).map(c=>c.name)};}
export function campaignPacingPlan(){return {basis:'authoring-estimate-not-observed-playtime',mainMissionMinutes:CAMPAIGN_MISSIONS.filter(m=>m.kind==='main').reduce((n,m)=>n+m.estimatedMinutes,0),explorationMinutes:CAMPAIGN_STAGES.reduce((n,s)=>n+s.explorationMinutes,0),optionalExcluded:true,minimumPlayTimeEnforced:false};}
