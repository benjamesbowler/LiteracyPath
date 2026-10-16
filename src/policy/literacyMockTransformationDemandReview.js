// Literal review of every V9 band-5 sounds item reachable before this overlay.
// Only these exact reviewed identities at areas-v5 / band 5 are withdrawn.
// Published V1–V8 demand claims and the five source-dependent V9 additions
// retain their existing validity. Broad sounds: https://github.com/cmusphinx/cmudict.
// Each row: id, operation, source:sounds, anchor:sounds, key:sounds, two foils, defect.
const rows = [
  ["literacy.sound_manipulation.change-initial-cat","substitute_initial","cat:K AE T","house:HH AW S","hat:HH AE T","cat:K AE T","cap:K AE P","replacement_edge"],
  ["literacy.sound_manipulation.change-initial-pan","substitute_initial","pan:P AE N","fish:F IH SH","fan:F AE N","pan:P AE N","pin:P IH N","replacement_edge"],
  ["literacy.sound_manipulation.change-final-map","substitute_final","map:M AE P","boat:B OW T","mat:M AE T","map:M AE P","tap:T AE P","replacement_edge"],
  ["literacy.sound_manipulation.change-final-bag","substitute_final","bag:B AE G","hat:HH AE T","bat:B AE T","bag:B AE G","bug:B AH G","replacement_edge"],
  ["literacy.sound_manipulation.delete-s-swing","delete_phoneme","swing:S W IH NG","","wing:W IH NG","sing:S IH NG","ring:R IH NG","source_isolation"],
  ["literacy.sound_manipulation.delete-s-snow","delete_phoneme","snow:S N OW","","no:N OW","so:S OW","sun:S AH N","deleted_edge"],
  ["literacy.sound_manipulation.add-s-top","add_phoneme","top:T AA P","sun:S AH N","stop:S T AA P","top:T AA P","spot:S P AA T",null],
  ["literacy.sound_manipulation.add-s-pin","add_phoneme","pin:P IH N","sock:S AA K","spin:S P IH N","pin:P IH N","sip:S IH P","phoneme_count"],
  ["mock.capacity.foundation.oral.substitute_initial.dog.leaf","substitute_initial","dog:D AO G","leaf:L IY F","log:L AO G","dog:D AO G","dig:D IH G","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_initial.pig.water","substitute_initial","pig:P IH G","water:W AO T ER","wig:W IH G","pin:P IH N","pig:P IH G","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_initial.hen.table","substitute_initial","hen:HH EH N","table:T EY B AH L","ten:T EH N","hen:HH EH N","pen:P EH N","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_initial.map.sock","substitute_initial","map:M AE P","sock:S AA K","sap:S AE P","map:M AE P","mat:M AE T","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_initial.bag.rabbit","substitute_initial","bag:B AE G","rabbit:R AE B AH T","rag:R AE G","big:B IH G","bag:B AE G","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_initial.net.sun","substitute_initial","net:N EH T","sun:S AH N","set:S EH T","net:N EH T","nut:N AH T","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_initial.bed.rabbit","substitute_initial","bed:B EH D","rabbit:R AE B AH T","red:R EH D","bed:B EH D","bet:B EH T","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_initial.cat.moon","substitute_initial","cat:K AE T","moon:M UW N","mat:M AE T","cut:K AH T","cat:K AE T","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_final.cat.cup","substitute_final","cat:K AE T","cup:K AH P","cap:K AE P","cat:K AE T","can:K AE N","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_final.cup.hat","substitute_final","cup:K AH P","hat:HH AE T","cut:K AH T","cup:K AH P","cap:K AE P","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_final.pin.cat","substitute_final","pin:P IH N","cat:K AE T","pit:P IH T","pan:P AE N","pin:P IH N","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_final.bed.hat","substitute_final","bed:B EH D","hat:HH AE T","bet:B EH T","bed:B EH D","bid:B IH D","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_final.bag.sun","substitute_final","bag:B AE G","sun:S AH N","ban:B AE N","bag:B AE G","bug:B AH G","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_final.fan.cat","substitute_final","fan:F AE N","cat:K AE T","fat:F AE T","fin:F IH N","fan:F AE N","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_final.tap.sun","substitute_final","tap:T AE P","sun:S AH N","tan:T AE N","tap:T AE P","tip:T IH P","replacement_edge"],
  ["mock.capacity.foundation.oral.substitute_final.net.duck","substitute_final","net:N EH T","duck:D AH K","neck:N EH K","net:N EH T","nest:N EH S T","replacement_edge"],
  ["mock.capacity.foundation.oral.delete_phoneme.clap.first","delete_phoneme","clap:K L AE P","","lap:L AE P","cap:K AE P","clap:K L AE P","deleted_edge"],
  ["mock.capacity.foundation.oral.delete_phoneme.slip.first","delete_phoneme","slip:S L IH P","","lip:L IH P","slip:S L IH P","sip:S IH P","deleted_edge"],
  ["mock.capacity.foundation.oral.delete_phoneme.smile.first","delete_phoneme","smile:S M AY L","","mile:M AY L","smile:S M AY L","slim:S L IH M","deleted_edge"],
  ["mock.capacity.foundation.oral.delete_phoneme.train.first","delete_phoneme","train:T R EY N","","rain:R EY N","tray:T R EY","train:T R EY N","deleted_edge"],
  ["mock.capacity.foundation.oral.delete_phoneme.glow.first","delete_phoneme","glow:G L OW","","low:L OW","glow:G L OW","go:G OW","deleted_edge"],
  ["mock.capacity.foundation.oral.delete_phoneme.stop.first","delete_phoneme","stop:S T AA P","","top:T AA P","stop:S T AA P","step:S T EH P","deleted_edge"],
  ["mock.capacity.foundation.oral.delete_phoneme.spot.first","delete_phoneme","spot:S P AA T","","pot:P AA T","spit:S P IH T","spot:S P AA T","deleted_edge"],
  ["mock.capacity.foundation.oral.delete_phoneme.stack.first","delete_phoneme","stack:S T AE K","","tack:T AE K","stack:S T AE K","sack:S AE K","deleted_edge"],
  ["mock.capacity.foundation.oral.add_phoneme.lip.cat","add_phoneme","lip:L IH P","cat:K AE T","clip:K L IH P","lip:L IH P","clap:K L AE P",null],
  ["mock.capacity.foundation.oral.add_phoneme.lock.cat","add_phoneme","lock:L AA K","cat:K AE T","clock:K L AA K","cluck:K L AH K","lock:L AA K",null],
  ["mock.capacity.foundation.oral.add_phoneme.rain.tiger","add_phoneme","rain:R EY N","tiger:T AY G ER","train:T R EY N","rain:R EY N","tray:T R EY","phoneme_count"],
  ["mock.capacity.foundation.oral.add_phoneme.pot.sun","add_phoneme","pot:P AA T","sun:S AH N","spot:S P AA T","pot:P AA T","stop:S T AA P",null],
  ["mock.capacity.foundation.oral.add_phoneme.tar.sun","add_phoneme","tar:T AA R","sun:S AH N","star:S T AA R","sat:S AE T","tar:T AA R","phoneme_count"],
  ["mock.capacity.foundation.oral.add_phoneme.lap.cat","add_phoneme","lap:L AE P","cat:K AE T","clap:K L AE P","lap:L AE P","cap:K AE P","phoneme_count"],
  ["mock.capacity.foundation.oral.add_phoneme.mile.sun","add_phoneme","mile:M AY L","sun:S AH N","smile:S M AY L","mile:M AY L","slim:S L IH M",null],
  ["mock.capacity.foundation.oral.add_phoneme.low.goat","add_phoneme","low:L OW","goat:G OW T","glow:G L OW","go:G OW","low:L OW","phoneme_count"],
];
const spoken = text => { const [word, sounds = ''] = text.split(':'); return Object.freeze({ word, phonemes: Object.freeze(sounds.split(' ').filter(Boolean)) }); };
export const LITERACY_V9_REVIEWED_TRANSFORMATIONS = Object.freeze(rows.map(([id, operation, source, anchor, answer, foilA, foilB, defect]) => Object.freeze({
  id, operation, source: spoken(source), anchor: spoken(anchor), answer: spoken(answer), foils: Object.freeze([spoken(foilA), spoken(foilB)]), defect,
})));
const reasons = {
  replacement_edge: 'The replacement edge sound alone uniquely identifies the keyed option. Retaining and transforming the original word is not required.',
  deleted_edge: 'Only the keyed option lacks the source initial sound. An initial-sound comparison alone answers the question without retaining the transformed remainder.',
  phoneme_count: 'Only the keyed option has the greatest phoneme count. Counting option phonemes can identify it without retaining the original word or performing the addition.',
  source_isolation: 'All options retain the same vowel and ending. Isolating the source second phoneme alone identifies the key without retaining and transforming the rest of the word.',
};
export const LITERACY_V9_TRANSFORMATION_QUARANTINE = Object.freeze(LITERACY_V9_REVIEWED_TRANSFORMATIONS.filter(row => row.defect).map(row => Object.freeze({
  id: row.id, issue: Object.freeze({ code: `transformation_${row.defect}_shortcut`, sourceWord: row.source.word, answer: row.answer.word,
    reason: reasons[row.defect] }),
})));
export const LITERACY_V9_TRANSFORMATION_QUARANTINED_ITEM_IDS = Object.freeze(LITERACY_V9_TRANSFORMATION_QUARANTINE.map(row => row.id));
export const LITERACY_V9_REVIEWED_LOWER_SOUND_SHORTCUTS = Object.freeze([
  { id: 'mock.v8.sounds.medial.hand', band: 3, targetWord: 'hand', targetPhonemes: ['HH', 'AE', 'N', 'D'],
    words: ['hat', 'bed', 'pig'], phones: [['HH', 'AE', 'T'], ['B', 'EH', 'D'], ['P', 'IH', 'G']], answer: 'hat', position: 'initial',
    reason: 'Only hat shares the initial HH sound of hand. An initial-sound match answers this supposed internal-vowel comparison without comparing the vowel.' },
  { id: 'literacy.sound_manipulation.blend-cup', band: 4, targetWord: 'cup', targetPhonemes: ['K', 'AH', 'P'],
    words: ['cup', 'cub', 'cut'], phones: [['K', 'AH', 'P'], ['K', 'AH', 'B'], ['K', 'AH', 'T']], answer: 'cup', position: 'final',
    reason: 'All choices share the first two phonemes. Only cup matches the final P cue, so identifying one final sound answers the supposed three-phoneme blend.' },
  { id: 'literacy.sound_manipulation.blend-hen', band: 4, targetWord: 'hen', targetPhonemes: ['HH', 'EH', 'N'],
    words: ['hen', 'ten', 'pen'], phones: [['HH', 'EH', 'N'], ['T', 'EH', 'N'], ['P', 'EH', 'N']], answer: 'hen', position: 'initial',
    reason: 'All choices share the vowel and ending. Only hen matches the initial HH cue, so identifying one initial sound answers the supposed three-phoneme blend.' },
  { id: 'mock.v9.sounds.blend.fed', band: 4, targetWord: 'fed', targetPhonemes: ['F', 'EH', 'D'],
    words: ['fed', 'bed', 'red'], phones: [['F', 'EH', 'D'], ['B', 'EH', 'D'], ['R', 'EH', 'D']], answer: 'fed', position: 'initial',
    reason: 'All choices share the vowel and ending. Only fed matches the initial F cue, so identifying one initial sound answers the supposed three-phoneme blend.' },
  { id: 'mock.v9.sounds.blend.hot', band: 4, targetWord: 'hot', targetPhonemes: ['HH', 'AA', 'T'],
    words: ['hot', 'hat', 'hut'], phones: [['HH', 'AA', 'T'], ['HH', 'AE', 'T'], ['HH', 'AH', 'T']], answer: 'hot', position: 'medial',
    reason: 'All choices share the initial and final phonemes. Only hot matches the internal AA cue, so identifying one vowel answers the supposed three-phoneme blend.' },
].map(row => Object.freeze({ ...row, words: Object.freeze(row.words), targetPhonemes: Object.freeze(row.targetPhonemes),
  phones: Object.freeze(row.phones.map(Object.freeze)) })));
export const LITERACY_V9_LOWER_SOUND_QUARANTINE = Object.freeze(LITERACY_V9_REVIEWED_LOWER_SOUND_SHORTCUTS.map(row => Object.freeze({
  id: row.id, adaptiveAreaBand: row.band, issue: Object.freeze({ code: 'single_phoneme_demand_shortcut',
    target: row.targetWord, answer: row.answer, position: row.position, reason: row.reason }),
})));
const issues = new Map([
  ...LITERACY_V9_TRANSFORMATION_QUARANTINE.map(row => [row.id, { issue: row.issue, band: 5 }]),
  ...LITERACY_V9_LOWER_SOUND_QUARANTINE.map(row => [row.id, { issue: row.issue, band: row.adaptiveAreaBand }]),
]);
export function literacyV9ReviewedTransformationIssue(ids, snapshot = {}) {
  if (snapshot.adaptiveAreaVersion !== 'areas-v5') return null;
  // The current mixed route retires these old demand claims with a null band.
  // Focused checks still use quality eligibility, so preserve the same narrow
  // withdrawal in V10 rather than reviving the defective old options there.
  if (snapshot.contentVersion === 'literacy-mock-v10' && snapshot.adaptiveAreaBand === null) {
    return ids.map(id => issues.get(id)).find(Boolean)?.issue || null;
  }
  if (!Number.isInteger(snapshot.adaptiveAreaBand)) return null;
  return ids.map(id => issues.get(id)).find(row => row?.band === snapshot.adaptiveAreaBand)?.issue || null;
}
