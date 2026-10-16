// Literal review of the 71 V9 band-2 rhyme sources available on 16 October 2026.
// Sound keys use broad CMU English phoneme symbols (stress omitted):
// https://github.com/cmusphinx/cmudict. This is a final-sound strategy review,
// not acoustic approval or a claim that every accent merges the same vowels.
// Each row is [published id, target:rime, key:rime, ...foil:rime].
// Published source JSON and historical V1–V8 demand classifications stay intact.
const rows = [
  ["lp3.rhyming.l1.B.at.v2","sat:AE T","mat:AE T","nut:AH T","bag:AE G","sun:AH N"],
  ["lp3.rhyming.l1.C.at.v3","bat:AE T","rat:AE T","ham:AE M","bag:AE G","pot:AA T"],
  ["lp3.rhyming.l1.A.an.v1","man:AE N","pan:AE N","map:AE P","pin:IH N","jam:AE M"],
  ["lp3.rhyming.l1.B.an.v2","can:AE N","fan:AE N","cap:AE P","nut:AH T","bag:AE G"],
  ["lp3.rhyming.l1.C.an.v3","tan:AE N","van:AE N","hen:EH N","rat:AE T","tie:AY"],
  ["lp3.rhyming.l1.A.ap.v1","cap:AE P","map:AE P","jam:AE M","cat:AE T","cup:AH P"],
  ["lp3.rhyming.l1.B.ap.v2","map:AE P","cap:AE P","mat:AE T","mop:AA P","bag:AE G"],
  ["lp3.rhyming.l1.C.ap.v3","lap:AE P","cap:AE P","leg:EH G","hen:EH N","ham:AE M"],
  ["lp3.rhyming.l1.A.am.v1","ham:AE M","jam:AE M","drum:AH M","bag:AE G","hat:AE T"],
  ["lp3.rhyming.l1.B.am.v2","ram:AE M","ham:AE M","cap:AE P","rat:AE T","mug:AH G"],
  ["lp3.rhyming.l1.C.am.v3","jam:AE M","ham:AE M","jug:AH G","mug:AH G","bat:AE T"],
  ["lp3.rhyming.l1.A.ag.v1","bag:AE G","flag:AE G","bat:AE T","bug:AH G","map:AE P"],
  ["lp3.rhyming.l1.B.ag.v2","rag:AE G","bag:AE G","leg:EH G","jam:AE M","rat:AE T"],
  ["lp3.rhyming.l1.C.ag.v3","tag:AE G","flag:AE G","ham:AE M","tie:AY","dog:AO G"],
  ["lp3.rhyming.l1.A.ub.v1","cub:AH B","tub:AH B","cup:AH P","bed:EH D","mug:AH G"],
  ["lp3.rhyming.l1.B.ub.v2","rub:AH B","tub:AH B","rat:AE T","dog:AO G","sun:AH N"],
  ["lp3.rhyming.l1.C.ub.v3","sub:AH B","tub:AH B","pig:IH G","nut:AH T","sun:AH N"],
  ["lp3.rhyming.l1.A.ed.v1","red:EH D","bed:EH D","hen:EH N","rat:AE T","bag:AE G"],
  ["lp3.rhyming.l1.B.ed.v2","fed:EH D","sled:EH D","fan:AE N","mud:AH D","pen:EH N"],
  ["lp3.rhyming.l1.C.ed.v3","wed:EH D","bed:EH D","web:EH B","bag:AE G","pen:EH N"],
  ["lp3.rhyming.l1.A.en.v1","den:EH N","hen:EH N","pin:IH N","bed:EH D","dog:AO G"],
  ["lp3.rhyming.l1.B.en.v2","men:EH N","pen:EH N","bed:EH D","meat:IY T","sun:AH N"],
  ["lp3.rhyming.l1.C.en.v3","ten:EH N","hen:EH N","tent:EH N T","nut:AH T","web:EH B"],
  ["lp3.rhyming.l1.A.et.v1","pet:EH T","net:EH T","pen:EH N","nut:AH T","leg:EH G"],
  ["lp3.rhyming.l1.B.et.v2","wet:EH T","net:EH T","nut:AH T","hen:EH N","web:EH B"],
  ["lp3.rhyming.l1.C.et.v3","set:EH T","net:EH T","egg:EH G","sun:AH N","cup:AH P"],
  ["lp3.rhyming.l1.A.eg.v1","peg:EH G","leg:EH G","pen:EH N","bag:AE G","hen:EH N"],
  ["lp3.rhyming.l1.B.eg.v2","leg:EH G","egg:EH G","lamp:AE M P","bug:AH G","pen:EH N"],
  ["lp3.rhyming.l1.C.eg.v3","leg:EH G","peg:EH G","log:AO G","net:EH T","lamp:AE M P"],
  ["lp3.rhyming.l1.A.ig.v1","fig:IH G","pig:IH G","pin:IH N","fish:IH SH","dog:AO G"],
  ["lp3.rhyming.l1.B.ig.v2","twig:IH G","wig:IH G","tent:EH N T","bug:AH G","web:EH B"],
  ["lp3.rhyming.l1.C.ig.v3","jig:IH G","pig:IH G","jam:AE M","log:AO G","lid:IH D"],
  ["lp3.rhyming.l1.A.in.v1","win:IH N","pin:IH N","nut:AH T","pig:IH G","web:EH B"],
  ["lp3.rhyming.l1.B.in.v2","pin:IH N","tin:IH N","lid:IH D","pig:IH G","pen:EH N"],
  ["lp3.rhyming.l1.C.in.v3","chin:IH N","pin:IH N","chick:IH K","map:AE P","lid:IH D"],
  ["lp3.rhyming.l1.A.ip.v1","dip:IH P","ship:IH P","dog:AO G","cup:AH P","pin:IH N"],
  ["lp3.rhyming.l1.B.ip.v2","rip:IH P","ship:IH P","mop:AA P","pig:IH G","ring:IH NG"],
  ["lp3.rhyming.l1.C.ip.v3","lip:IH P","ship:IH P","leg:EH G","lion:AH N","pot:AA T"],
  ["lp3.rhyming.l1.A.ock.v1","dock:AA K","clock:AA K","dog:AO G","hat:AE T","pot:AA T"],
  ["lp3.rhyming.l1.B.ock.v2","lock:AA K","sock:AA K","lamp:AE M P","bed:EH D","pot:AA T"],
  ["lp3.rhyming.l1.C.ock.v3","sock:AA K","rock:AA K","bed:EH D","pot:AA T","sun:AH N"],
  ["lp3.rhyming.l1.A.og.v1","fog:AA G","dog:AO G","mop:AA P","fox:AA K S","bag:AE G"],
  ["lp3.rhyming.l1.B.og.v2","jog:AA G","log:AO G","jam:AE M","leg:EH G","pot:AA T"],
  ["lp3.rhyming.l1.C.og.v3","hog:AA G","frog:AA G","hen:EH N","nut:AH T","pot:AA T"],
  ["lp3.rhyming.l1.A.op.v1","pop:AA P","mop:AA P","map:AE P","log:AO G","pot:AA T"],
  ["lp3.rhyming.l1.B.op.v2","drop:AA P","mop:AA P","dog:AO G","drum:AH M","cup:AH P"],
  ["lp3.rhyming.l1.C.op.v3","stop:AA P","mop:AA P","star:AA R","cap:AE P","pot:AA T"],
  ["lp3.rhyming.l1.A.ot.v1","not:AA T","pot:AA T","nut:AH T","hat:AE T","dog:AO G"],
  ["lp3.rhyming.l1.B.ot.v2","got:AA T","dot:AA T","hat:AE T","log:AO G","goat:OW T"],
  ["lp3.rhyming.l1.C.ot.v3","lot:AA T","pot:AA T","net:EH T","log:AO G","pig:IH G"],
  ["lp3.rhyming.l1.A.ug.v1","tug:AH G","bug:AH G","tub:AH B","bag:AE G","sun:AH N"],
  ["lp3.rhyming.l1.B.ug.v2","dug:AH G","bug:AH G","duck:AH K","leg:EH G","cup:AH P"],
  ["lp3.rhyming.l1.C.ug.v3","hug:AH G","mug:AH G","dog:AO G","sun:AH N","hat:AE T"],
  ["lp3.rhyming.l1.A.un.v1","fun:AH N","sun:AH N","mug:AH G","fan:AE N","pin:IH N"],
  ["lp3.rhyming.l1.B.un.v2","bun:AH N","sun:AH N","bug:AH G","hen:EH N","cup:AH P"],
  ["lp3.rhyming.l1.C.un.v3","run:AH N","bun:AH N","rat:AE T","map:AE P","mug:AH G"],
  ["lp3.rhyming.l1.A.up.v1","pup:AH P","cup:AH P","mop:AA P","bug:AH G","pin:IH N"],
  ["lp3.rhyming.l1.C.up.v3","up:AH P","cup:AH P","umbrella:AH","cap:AE P","mud:AH D"],
  ["lp3.rhyming.l1.A.ut.v1","shut:AH T","nut:AH T","ship:IH P","pot:AA T","bug:AH G"],
  ["lp3.rhyming.l1.B.ut.v2","but:AH T","nut:AH T","hat:AE T","sun:AH N","bug:AH G"],
  ["lp3.rhyming.l1.C.ut.v3","cut:AH T","nut:AH T","mug:AH G","cup:AH P","net:EH T"],
  ["mock.depth.phonics.rhyme-coat","coat:OW T","boat:OW T","cat:AE T","cake:EY K"],
  ["mock.depth.phonics.rhyme-train","train:EY N","plane:EY N","tree:IY","pen:EH N"],
  ["mock.capacity.foundation.spoken-comparison.spoken_rhyme_discrimination.light","light:AY T","kite:AY T","cat:AE T","bike:AY K"],
  ["mock.capacity.foundation.spoken-comparison.spoken_rhyme_discrimination.spoon","spoon:UW N","moon:UW N","man:AE N","boot:UW T"],
  ["mock.capacity.foundation.spoken-comparison.spoken_rhyme_discrimination.crow","crow:OW","snow:OW","nose:OW Z","cow:AW"],
  ["mock.capacity.foundation.spoken-comparison.spoken_rhyme_discrimination.sheep","sheep:IY P","jeep:IY P","ship:IH P","leaf:IY F"],
  ["mock.capacity.foundation.spoken-comparison.spoken_rhyme_discrimination.bell","bell:EH L","shell:EH L","ball:AO L","bed:EH D"],
  ["mock.capacity.foundation.spoken-comparison.spoken_rhyme_discrimination.star","star:AA R","car:AA R","farm:AA R M","door:AO R"],
  ["mock.capacity.foundation.spoken-comparison.spoken_rhyme_discrimination.chair","chair:EH R","bear:EH R","deer:IH R","bed:EH D"],
  ["mock.capacity.foundation.spoken-comparison.spoken_rhyme_discrimination.house","house:AW S","mouse:AW S","horse:AO R S","cow:AW"],
];
const spoken = text => {
  const [word, sounds] = text.split(':');
  return Object.freeze({ word, rime: Object.freeze(sounds.split(' ')) });
};
export const LITERACY_V9_REVIEWED_RHYME_DEMAND = Object.freeze(rows.map(([id, target, answer, ...foils]) => Object.freeze({
  id, target: spoken(target), answer: spoken(answer), foils: Object.freeze(foils.map(spoken)),
})));

/** The literal reviewed sound units, never spelling, establish this shortcut.
 * A second same-final option forces the vowel to distinguish the intended rhyme. */
export function reviewedRhymeHasFinalOnlyShortcut(proof) {
  const finalPhoneme = proof.target.rime.at(-1);
  return proof.answer.rime.at(-1) === finalPhoneme
    && !proof.foils.some(choice => choice.rime.at(-1) === finalPhoneme);
}

export const LITERACY_V9_RHYME_FINAL_ONLY_QUARANTINE = Object.freeze(LITERACY_V9_REVIEWED_RHYME_DEMAND
  .filter(reviewedRhymeHasFinalOnlyShortcut).map(proof => Object.freeze({
    id: proof.id,
    issue: Object.freeze({ code: 'rhyme_final_sound_shortcut', target: proof.target.word, answer: proof.answer.word,
      finalPhoneme: proof.target.rime.at(-1),
      reason: `The correct rhyme ${proof.answer.word} is the only choice sharing the final sound of ${proof.target.word}. A final-sound match alone answers this question, so it cannot establish the declared vowel-and-ending rhyme demand.`,
    }),
  })));
// Jog/log remains reachable in the current route. Unlike fog/dog (owned by
// reading), it needs an explicit withdrawal: English pronunciations can retain
// the AA/AO vowel distinction rather than the assumed rhyme. Do not infer an
// accent's vowel merger from spelling or a generic short-o family label.
export const LITERACY_V9_RHYME_QUARANTINE = Object.freeze([
  ...LITERACY_V9_RHYME_FINAL_ONLY_QUARANTINE,
  Object.freeze({ id: 'lp3.rhyming.l1.B.og.v2', issue: Object.freeze({
    code: 'accent_sensitive_rhyme', target: 'jog', answer: 'log', targetRime: 'AA G', answerRime: 'AO G',
    reason: 'Jog and log can have different vowels in English (AA versus AO). This question relies on an accent-dependent rhyme and cannot reliably establish the declared vowel-and-ending comparison.',
  }) }),
]);
export const LITERACY_V9_RHYME_QUARANTINED_ITEM_IDS = Object.freeze(LITERACY_V9_RHYME_QUARANTINE.map(row => row.id));
const issues = new Map(LITERACY_V9_RHYME_QUARANTINE.map(row => [row.id, row.issue]));

/** The same immutable source can be valid at its older published demand. Only
 * its V9 areas-v5 band-2 claim is withdrawn; compact IDs cannot imply a version. */
export function literacyV9ReviewedRhymeIssue(ids, snapshot = {}) {
  if (snapshot.adaptiveAreaVersion !== 'areas-v5' || snapshot.adaptiveAreaBand !== 2) return null;
  return ids.map(id => issues.get(id)).find(Boolean) || null;
}
