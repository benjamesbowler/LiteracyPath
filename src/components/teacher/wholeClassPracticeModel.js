import { shuffleLiteracyMock } from '../../utils/literacyMockPlanner.js';
import { canonicalLiteracyIdentity } from '../../utils/literacyEvidence.js';
import { isLiteracyItemEligible } from '../../policy/literacyItemEligibility.js';
import { LITERACY_MOCK_AREA_ORDER } from '../../policy/literacyMockAdaptivePolicy.js';

export const WHOLE_CLASS_CYCLE_ACTIVITIES = Object.freeze([
  ['pictureSound', 'Sound Safari'], ['letterMatch', 'Letter Friends'],
  ['rhymeMatch', 'Rhyme Picnic'], ['wordBuild', 'Word Workshop'],
  ['soundSort', 'Sound Delivery'], ['letterTrace', 'Rainbow Writing']
]);

export function wholeClassMockPool(bank, area = 'all', band = '0') {
  return bank.filter(item => !item.tutorialOnly && item.mediaReady && item.adaptiveMixedEligible
    && isLiteracyItemEligible(item) && (area === 'all' || item.domainId === area)
    && (band === 'all' || item.adaptiveAreaBand === Number(band)));
}

// Interleave the available areas after shuffling their questions. Practice never adapts a
// learner, submits an assessment event or claims a fresh independent result.
export function wholeClassMockRounds(bank, { area = 'all', band = '0', seed, count = 12 } = {}) {
  const shuffled = shuffleLiteracyMock(wholeClassMockPool(bank, area, band), seed);
  const groups = new Map(LITERACY_MOCK_AREA_ORDER.map(id => [id, []]));
  const seen = new Set();
  for (const item of shuffled) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    groups.get(item.domainId)?.push(item);
  }
  const rounds = [];
  while ([...groups.values()].some(group => group.length)) {
    for (const group of groups.values()) if (group.length) rounds.push(group.shift());
  }
  return count === 'all' ? rounds : rounds.slice(0, Number(count));
}

// Class practice uses its own disposable observations. These are never child
// assessment evidence and are never sent to the server or teacher reports.
export function createWholeClassMockSession(bank, {area='all',band='adaptive',seed,count=12}={}) {
  const adaptive=band==='adaptive' || band==='all';
  const pool=wholeClassMockPool(bank,area,'all');
  const targetCount=count==='all' ? pool.length : Number(count);
  const session={seed,area,adaptive,targetCount,rounds:[],attempts:{},nextAreaIndex:0,
    progress:Object.fromEntries(LITERACY_MOCK_AREA_ORDER.map(id=>[id,{band:0,maxBand:Math.max(0,...pool.filter(item=>item.domainId===id).map(item=>item.adaptiveAreaBand))}]))};
  if (!adaptive) return {...session,rounds:wholeClassMockRounds(bank,{area,band,seed,count})};
  return advanceWholeClassMockSession(bank,session);
}

function freshClassItem(item,offered) {
  const identity=canonicalLiteracyIdentity(item);
  return !offered.some(previous=>{
    const seen=canonicalLiteracyIdentity(previous);
    return ['itemId','passageKey','familyId'].some(key=>identity[key] && identity[key]===seen[key]);
  });
}

export function advanceWholeClassMockSession(bank,session) {
  if (!session.adaptive || session.exhausted || session.rounds.length>=session.targetCount) return session;
  const areas=LITERACY_MOCK_AREA_ORDER.filter(id=>session.area==='all' || session.area===id);
  for(let offset=0;offset<areas.length;offset++) {
    const cursor=(session.nextAreaIndex+offset)%areas.length,area=areas[cursor];
    const band=session.progress[area].band;
    const candidates=wholeClassMockPool(bank,area,String(band)).filter(item=>freshClassItem(item,session.rounds));
    const next=shuffleLiteracyMock(candidates,`${session.seed}:${area}:${band}:${session.rounds.length}`)[0];
    if(next) return {...session,rounds:[...session.rounds,next],nextAreaIndex:(cursor+1)%areas.length};
  }
  // Exhaustion is availability, never permission to jump to a harder bank.
  return {...session,exhausted:true};
}

export function recordWholeClassMockAttempt(session,index,{correct,revealed=false}={}) {
  if(!session.adaptive || index!==session.rounds.length-1) return session;
  const item=session.rounds[index];
  if(!item) return session;
  const previous=session.attempts[index];
  if(previous?.attempted || previous?.revealed && !revealed) return session;
  if(typeof correct!=='boolean' && !revealed) return session;
  const attempts={...session.attempts,[index]:{attempted:typeof correct==='boolean',revealed,correct}};
  const current=session.progress[item.domainId];
  if(!current || current.band!==item.adaptiveAreaBand) return {...session,attempts};
  // This is short, unscored group practice, not an individual ability estimate.
  // Requiring three observations in each of eight interleaved areas made even
  // a perfect 24-question class round stay at First steps throughout.
  const next={...current,band:revealed ? current.band
    : Math.max(0,Math.min(current.maxBand,current.band+(correct ? 1 : -1)))};
  return {...session,attempts,progress:{...session.progress,[item.domainId]:next}};
}

export function wholeClassMockAnswer(item) {
  if (item.format === 'build_word') return String(item.answer);
  const ids = Array.isArray(item.answer) ? item.answer : [item.answer];
  return ids.map((id, index) => {
    const label = item.choices.find(choice => choice.id === id)?.label || 'Picture answer';
    if (item.format === 'select_text') {
      const position = item.choices.find(choice => choice.id === id)?.tokenIndex;
      return Number.isInteger(position) ? `${label} (word ${position + 1})` : label;
    }
    return item.format === 'match' ? `${item.matchTargets[index]?.label || `Space ${index + 1}`}: ${label}` : label;
  }).join(item.format === 'order' ? ' ' : ' · ');
}
