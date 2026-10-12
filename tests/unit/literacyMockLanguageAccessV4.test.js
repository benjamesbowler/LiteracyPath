import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, normalizeLiteracyMockItem, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { normalizeSpokenCloze } from '../../src/utils/assessmentSpokenText.js';
import {
  correctLiteracyMockLanguageAccessV4, buildLiteracyMockLanguageAccessV4, literacyMockLanguageAccessV4MissingAudio,
} from '../../src/data/literacyMockLanguageAccessV4.js';

const v3 = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v3', includeUnavailable: true });
const original = JSON.stringify(v3);
const bank = v3.map(item => correctLiteracyMockLanguageAccessV4(item, v3));
const additions = buildLiteracyMockLanguageAccessV4(bank);
const byId = id => bank.find(item => item.id === id);
const key = item => item.choices.find(choice => choice.id === item.answer)?.label;
const old = id => v3.find(item => item.id === id);
const normalize = value => String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

test('v4 language changes preserve the complete historical objects and source exposure identities', () => {
  assert.equal(JSON.stringify(v3), original);
  assert.equal(bank.filter(item => item.sourceProvenance?.v4LanguageCorrection).length, 372);
  for (const item of bank.filter(item => item.sourceProvenance?.v4LanguageCorrection)) {
    assert.equal(item.contentVersion, 'literacy-mock-v4');
    assert.equal(item.canonicalItemId, old(item.id).canonicalItemId);
    assert.equal(item.exposureFamilyId, old(item.id).exposureFamilyId);
    assert.equal(item.image, old(item.id).image);
    assert.equal(item.passage, old(item.id).passage);
    assert.equal(item.prompt, old(item.id).prompt);
    assert.equal(item.answer, old(item.id).answer);
    assert.deepEqual(item.choices, old(item.id).choices);
    const { itemSnapshot, ...fields } = item;
    assert.deepEqual(itemSnapshot, fields);
    assert.equal(itemSnapshot.itemSnapshot, undefined);
  }
});

test('all pictured preposition siblings lose unsupported harder labels without losing their actual required scenes', () => {
  const pictures = bank.filter(item => item.skillId === 'prepositions');
  assert.equal(pictures.length, 180);
  for (const item of pictures) {
    assert.equal(item.level, 1, item.id);
    assert.equal(item.demandCeiling, 1, item.id);
    assert.deepEqual(item.requiredImagePaths, old(item.id).requiredImagePaths);
    assert.ok(item.requiredImagePaths.length > 0, item.id);
  }
  const pencil = byId('mock.capacity.language.spatial.inverse_spatial_relation.2.pencil-among-crayons');
  assert.equal(key(pencil), 'around the pencil');
  assert.equal(pencil.constructClaim, 'inverse_spatial_relation');
  assert.match(pencil.image, /pencil-among-crayons/);
  assert.equal(pencil.level, 1);
  assert.equal(old(pencil.id).level, 2);
});

// Independent oracle reads the literal child-facing statements. It enumerates
// all possible relative heights, rather than trusting authored demand labels,
// an answer map, the generator's key or a claimed number of inference steps.
function spatialFacts(item) {
  const premises = [...item.passage.matchAll(/The ([^.]+?) (?:is|are) (above|below|level with) the ([^.]+?)\./g)]
    .map(([, left, relation, right]) => ({ left, relation, right }));
  const query = /The ([^.]+?) (?:is|are) ___ the ([^.]+?)\.$/.exec(item.passage);
  assert.ok(query, item.id);
  return { premises, left: query[1], right: query[2] };
}

function possibleRelations(premises, left, right) {
  const names = [...new Set([...premises.flatMap(fact => [fact.left, fact.right]), left, right])];
  const relation = (a, b) => a > b ? 'above' : a < b ? 'below' : 'level with';
  const results = new Set();
  const visit = values => {
    if (values.length < names.length) {
      for (let height = 0; height <= 3; height++) visit([...values, height]);
      return;
    }
    const heights = Object.fromEntries(names.map((name, index) => [name, values[index]]));
    if (premises.every(fact => relation(heights[fact.left], heights[fact.right]) === fact.relation)) {
      results.add(relation(heights[left], heights[right]));
    }
  };
  visit([]);
  return results;
}

test('every new spatial key is the sole relation supported by the literal premises', () => {
  assert.equal(additions.length, 40);
  for (const item of additions) {
    const { premises, left, right } = spatialFacts(item);
    assert.equal(premises.length, item.level);
    assert.equal(new Set(premises.flatMap(fact => [fact.left, fact.right])).size, item.level === 1 ? 2 : 3);
    assert.deepEqual([...possibleRelations(premises, left, right)], [key(item)], item.id);
    assert.deepEqual(item.choices.map(choice => choice.label), ['above', 'below', 'level with']);
    assert.equal(scoreLiteracyMockResponse(item, item.answer), true);
    for (const foil of item.choices.filter(choice => choice.id !== item.answer)) {
      assert.equal(scoreLiteracyMockResponse(item, foil.id), false);
    }
  }
});

test('every harder spatial response requires BOTH relations; removing either makes the endpoint relation indeterminate', () => {
  for (const item of additions.filter(item => item.level === 2)) {
    const { premises, left, right } = spatialFacts(item);
    assert.ok(!premises.some(fact => new Set([fact.left, fact.right]).has(left)
      && new Set([fact.left, fact.right]).has(right)), item.id);
    for (let removed = 0; removed < premises.length; removed++) {
      assert.ok(possibleRelations(premises.filter((_, index) => index !== removed), left, right).size > 1,
        `${item.id}: relation ${removed + 1} must affect the answer`);
    }
  }
  const entry = additions.find(item => item.id === 'mock.v4.prepositions.kitchen-shelves.l1');
  const harder = additions.find(item => item.id === 'mock.v4.prepositions.kitchen-shelves.l2');
  assert.equal(entry.passage, 'In the kitchen cupboard. The bowl is above the cup. The cup is ___ the bowl.');
  assert.equal(harder.passage, 'In the kitchen cupboard. The bowl is above the cup. The cup is above the plate. The plate is ___ the bowl.');
  assert.equal(key(entry), 'below');
  assert.equal(key(harder), 'below');
  assert.equal(sameLiteracyMockTask(entry, harder), true);
});

test('new spatial access is identical at both levels and survives runtime normalization', () => {
  for (const authored of additions) {
    const item = normalizeLiteracyMockItem(authored, { contentVersion: 'literacy-mock-v4' });
    assert.equal(item.constructClaim, 'oral_spatial_relation_reasoning');
    assert.equal(item.modality, 'recognition');
    assert.equal(item.evidenceModality, 'audio+text');
    assert.equal(item.oralLanguageAccess, true);
    assert.equal(item.passageAccess, 'audio+text');
    assert.equal(item.displayPassageDuringResponse, true);
    assert.deepEqual(item.requiredImagePaths, []);
    assert.deepEqual(item.requiredAudioCues.map(cue => cue.role), ['instruction', 'passage', 'choice', 'choice', 'choice']);
    assert.equal(item.requiredAudioCues.find(cue => cue.role === 'passage').text, normalizeSpokenCloze(item.passage));
    assert.ok(!item.requiredAudioCues.find(cue => cue.role === 'passage').text.includes('___'));
    assert.ok(item.requiredAudioCues.find(cue => cue.role === 'passage').text.includes('…'));
    assert.equal(item.demandCeiling, undefined);
    assert.equal(item.taskDemand.relationCount, item.level);
    assert.equal(item.mediaReady, item.requiredAudioCues.every(cue => Boolean(cue.path)));
  }
});

test('twenty semantic spatial arrangements share family identities across levels and support fresh sittings', () => {
  const families = [...new Set(additions.map(item => item.exposureFamilyId))];
  assert.equal(families.length, 20);
  assert.equal(new Set(additions.map(item => item.passage)).size, 40);
  assert.equal(new Set(additions.map(item => item.taskDemand.context)).size, 20);
  for (const family of families) {
    const pair = additions.filter(item => item.exposureFamilyId === family);
    assert.deepEqual(pair.map(item => item.level), [1, 2]);
    assert.equal(sameLiteracyMockTask(...pair), true);
    assert.equal(pair[1].taskDemand.premises[0], pair[0].taskDemand.premises[0]);
    assert.notEqual(pair[1].taskDemand.query, pair[0].taskDemand.query);
  }
  // Conservative family exclusions retire both levels when either is used.
  // Two entry -> extension -> extension sittings consume six arrangements.
  const used = new Set();
  for (let sitting = 0; sitting < 2; sitting++) {
    for (const level of [1, 2, 2]) {
      const fresh = additions.find(item => item.level === level && !used.has(item.exposureFamilyId));
      assert.ok(fresh);
      used.add(fresh.exposureFamilyId);
    }
  }
  for (const level of [1, 2]) assert.equal(additions.filter(item => item.level === level && !used.has(item.exposureFamilyId)).length, 14);
  assert.throws(() => buildLiteracyMockLanguageAccessV4([]), /normalized prepositions template/);
});

test('regular or unchanged contextual plural cases are demoted while real changed morphology remains harder', () => {
  const guitar = byId('lp3.plurals.l2.C.plural_in_sentence.v9');
  assert.equal(guitar.passage, 'There are two ___. Each one has six strings.');
  assert.equal(key(guitar), 'guitars');
  assert.equal(guitar.level, 1);
  assert.equal(byId('lp3.plurals.l2.B.plural_in_sentence.v2').level, 1);
  assert.equal(key(byId('lp3.plurals.l2.B.plural_in_sentence.v2')), 'peach');
  assert.equal(byId('lp3.plurals.l2.C.plural_irregular.v9').level, 1);
  assert.equal(key(byId('lp3.plurals.l2.C.plural_irregular.v9')), 'sheep');
  const harder = bank.filter(item => item.skillId === 'plurals' && item.constructClaim === 'plural_number_in_context' && item.level === 2);
  assert.equal(harder.length, 13);
  const singulars = { babies: 'baby', ladies: 'lady', parties: 'party', men: 'man', children: 'child',
    leaves: 'leaf', wolves: 'wolf', knives: 'knife', puppies: 'puppy', loaves: 'loaf', stories: 'story', shelves: 'shelf' };
  for (const item of harder) {
    assert.ok(singulars[key(item)], item.id);
    assert.ok(item.choices.some(choice => choice.label === singulars[key(item)]), item.id);
    assert.notEqual(key(item), `${singulars[key(item)]}s`, item.id);
  }
  for (const item of bank.filter(item => item.skillId === 'plurals' && item.constructClaim === 'plural_add_es')) {
    assert.equal(item.level, 1);
    assert.equal(item.demandCeiling, 1);
  }
  assert.equal(bank.filter(item => item.skillId === 'plurals' && item.constructClaim === 'plural_add_es').length, 20);
  const wishes = bank.find(item => item.constructClaim === 'plural_add_es' && key(item) === 'wishes');
  const watches = bank.find(item => item.constructClaim === 'plural_add_es' && key(item) === 'watches');
  assert.ok(wishes.choices.some(choice => choice.label === 'wish'));
  assert.ok(watches.choices.some(choice => choice.label === 'watch'));
  assert.equal(old(wishes.id).level, 2);
  assert.equal(old(watches.id).level, 1);
  assert.equal(wishes.level, watches.level);
});

test('every affix-meaning scenario and every choice is orally accessible at both levels', () => {
  const items = bank.filter(item => item.skillId === 'prefix_suffix' && item.constructClaim === 'apply_affix_meaning_in_context');
  assert.equal(items.length, 50);
  for (const item of items) {
    assert.equal(item.oralLanguageAccess, true);
    assert.equal(item.evidenceModality, 'audio+text');
    assert.equal(item.passageAccess, 'audio+text');
    const requiredContext = normalize(normalizeSpokenCloze(item.passage || item.prompt));
    assert.ok(item.requiredAudioCues.some(cue => ['instruction', 'passage'].includes(cue.role)
      && normalize(cue.text).includes(requiredContext)), item.id);
    for (const choice of item.choices) assert.ok(item.requiredAudioCues.some(cue => cue.role === 'choice'
      && cue.choiceId === choice.id && cue.text === choice.label), item.id);
    if (item.level === 1) assert.deepEqual(item.requiredAudioCues, old(item.id).requiredAudioCues);
  }
  const careless = byId('mock.depth.affix-careless');
  assert.equal(careless.requiredAudioCues[0].role, 'passage');
  assert.equal(careless.requiredAudioCues[0].text, 'Rae knew the pot was fragile but tossed it into the box without taking care.');
  assert.equal(key(careless), 'careless');
  assert.equal(careless.modality, byId('lp3.prefixes_suffixes.l1.A.prefix_un.v1').modality);
  assert.equal(careless.constructClaim, byId('lp3.prefixes_suffixes.l1.A.prefix_un.v1').constructClaim);
});

test('poetry rhyme selection and feature classification are honest separate fixed tasks', () => {
  const rhyme = bank.filter(item => item.constructClaim === 'identify_rhyme_words_in_poem');
  const features = bank.filter(item => item.constructClaim === 'identify_poetry_features');
  assert.equal(rhyme.length, 10);
  assert.equal(features.length, 10);
  assert.ok(rhyme.every(item => /Which two words rhyme/.test(item.prompt)));
  assert.ok(features.every(item => /Which feature makes this text a poem/.test(item.prompt)));
  assert.equal(sameLiteracyMockTask(rhyme[0], features[0]), false);
  for (const item of [...rhyme, ...features]) {
    assert.equal(item.level, 1);
    assert.equal(item.demandCeiling, 1);
    assert.equal(item.modality, 'reading');
    assert.deepEqual(item.requiredAudioCues.map(cue => cue.role), ['instruction']);
  }
});

test('directly tagged target quotes are demoted; the three untagged continuation targets retain real speaker demand', () => {
  const direct = byId('mock.capacity.literary_craft.speaker-one-more');
  assert.match(direct.passage, /“One more, please,” said Lou/);
  assert.equal(direct.level, 1);
  const harder = bank.filter(item => item.skillId === 'literary_craft' && item.constructClaim === 'speaker' && item.level === 2);
  assert.deepEqual(harder.map(item => item.id).sort(), [
    'mock.depth.speaker-turn-hard', 'mock.capacity.literary_craft.speaker-train-change', 'mock.capacity.literary_craft.speaker-different-plan',
  ].sort());
  const cases = [
    ['mock.depth.speaker-turn-hard', /“Yes,” replied Mo\. “We can go now\.”/, 'Mo'],
    ['mock.capacity.literary_craft.speaker-train-change', /“I can see the steps,” said Jay\. “We still have time\.”/, 'Jay'],
    ['mock.capacity.literary_craft.speaker-different-plan', /“We can spread the blanket on the floor,” said Dad\. “The picnic can still go ahead\.”/, 'Dad'],
  ];
  for (const [id, dependency, answer] of cases) {
    const item = byId(id);
    assert.match(item.passage, dependency);
    assert.equal(key(item), answer);
    assert.equal(item.level, 2);
    assert.equal(item.demandCeiling, undefined);
    assert.deepEqual(item, old(id));
  }
  assert.equal(bank.filter(item => item.skillId === 'literary_craft' && item.constructClaim === 'speaker' && item.level === 1).length, 17);
});

test('tense wallpaper and unchanged three-event prerequisite chains cannot be published as harder versions', () => {
  for (const [skill, claim] of [['writing_revision', 'verb_tense'], ['writing_organization', 'coherent_event_order']]) {
    const items = bank.filter(item => item.skillId === skill && item.constructClaim === claim);
    assert.equal(items.length, 20);
    assert.equal(v3.filter(item => item.skillId === skill && item.constructClaim === claim && item.level === 2).length, 10);
    for (const item of items) {
      assert.equal(item.level, 1);
      assert.equal(item.demandCeiling, 1);
      assert.equal(item.format, old(item.id).format);
      assert.equal(item.answerMode, old(item.id).answerMode);
      assert.deepEqual(item.requiredAudioCues, old(item.id).requiredAudioCues);
    }
  }
  const tense = bank.find(item => item.skillId === 'writing_revision' && item.constructClaim === 'verb_tense' && /Last Friday/.test(item.passage));
  assert.equal(key(tense), 'walked');
  assert.match(tense.passage, /bus most days.*Last Friday/s);
  const order = bank.find(item => item.skillId === 'writing_organization' && item.constructClaim === 'coherent_event_order');
  assert.equal(order.choices.length, 3);
  assert.equal(order.format, 'order');
});

test('pronoun levels require literal same-referent grammatical-form competition without a supplied answer model', () => {
  const items = bank.filter(item => item.skillId === 'writing_revision' && item.constructClaim === 'pronoun');
  // Independent linguistic classes, not the author's item-ID certification.
  const formClasses = [['i', 'me', 'my', 'mine'], ['we', 'us', 'our', 'ours'],
    ['he', 'him', 'his'], ['she', 'her', 'hers'], ['they', 'them', 'their', 'theirs']];
  const requiresFormChoice = item => {
    const answer = key(item).toLowerCase();
    const sameReferent = formClasses.find(forms => forms.includes(answer));
    const hasConfound = sameReferent && item.choices.some(choice => choice.id !== item.answer
      && sameReferent.includes(choice.label.toLowerCase()));
    const suppliedModel = item.passage.toLowerCase().split(/[^a-z]+/).includes(answer);
    return Boolean(hasConfound && !suppliedModel);
  };
  assert.equal(items.length, 20);
  assert.equal(items.filter(item => item.level === 1).length, 13);
  assert.equal(items.filter(item => item.level === 2).length, 7);
  for (const item of items) {
    assert.equal(item.level, requiresFormChoice(item) ? 2 : 1, item.id);
    assert.equal(item.demandCeiling, undefined, item.id);
    assert.equal(item.oralLanguageAccess, true, item.id);
    assert.deepEqual(item.requiredAudioCues, old(item.id).requiredAudioCues);
  }
  const simple = byId('mock.capacity.writing.pronoun-entry-brother');
  assert.deepEqual(simple.choices.map(choice => choice.label), ['He', 'She', 'It']);
  const harder = byId('mock.capacity.writing.pronoun-hard-male-object');
  assert.match(harder.passage, /I passed it to ___/);
  assert.deepEqual(harder.choices.map(choice => choice.label), ['him', 'he', 'her']);
  assert.equal(key(harder), 'him');
  assert.ok(sameLiteracyMockTask(simple, harder));
  const reflexive = byId('mock.capacity.writing.pronoun-hard-reflexive');
  assert.deepEqual(reflexive.choices.map(choice => choice.label), ['himself', 'herself', 'themselves']);
  assert.equal(reflexive.level, 1);
  assert.equal(old(reflexive.id).level, 2);
  const supplied = byId('mock.capacity.writing.pronoun-entry-speaker');
  assert.match(supplied.passage, /ticket to me.*for ___/);
  assert.equal(supplied.level, 1);
  assert.equal(new Set(items.filter(item => item.level === 2).map(item => item.exposureFamilyId)).size, 7);
});

test('finite-verb-only and same-number agreement shortcuts stay entry while genuine clause and head conflicts remain', () => {
  const finiteOnly = byId('mock.capacity.writing.complete-hard-subject');
  assert.deepEqual(finiteOnly.choices.map(choice => choice.label), [
    'The basket full of apples fell over.', 'The basket full of fresh apples.', 'Beside the basket full of apples.',
  ]);
  assert.equal(finiteOnly.level, 1);
  assert.equal(old(finiteOnly.id).level, 2);
  const clause = byId('mock.capacity.writing.complete-hard-relative');
  assert.deepEqual(clause.choices.map(choice => choice.label), [
    'The child who found the shell showed it to us.', 'The child who found the shiny shell.', 'When the child found the shell.',
  ]);
  assert.ok(clause.choices.every(choice => /found/.test(choice.label)));
  assert.equal(clause.level, 2);
  assert.ok(sameLiteracyMockTask(finiteOnly, clause));
  const aligned = byId('mock.capacity.writing.agreement-hard-both');
  assert.equal(aligned.passage, 'Both of the doors ___ fresh paint now.');
  assert.equal(key(aligned), 'need');
  assert.equal(aligned.level, 1);
  assert.equal(old(aligned.id).level, 2);
  const conflict = byId('mock.capacity.writing.agreement-hard-one');
  assert.equal(conflict.passage, 'One of the children ___ the register every morning.');
  assert.deepEqual(conflict.choices.map(choice => choice.label), ['carries', 'carry', 'carrying']);
  assert.equal(key(conflict), 'carries');
  assert.equal(conflict.level, 2);
  assert.ok(sameLiteracyMockTask(aligned, conflict));
  for (const claim of ['complete_sentence', 'agreement']) {
    const harder = bank.filter(item => item.skillId === 'writing_revision' && item.constructClaim === claim
      && item.oralLanguageAccess && item.level === 2);
    assert.equal(harder.length, 9, claim);
    assert.equal(new Set(harder.map(item => item.exposureFamilyId)).size, 9, claim);
  }
  for (const item of [finiteOnly, aligned]) {
    assert.equal(item.demandCeiling, undefined);
    assert.deepEqual(item.requiredAudioCues, old(item.id).requiredAudioCues);
  }
});

test('one supplied connecting relation has a fixed ceiling, and writing keeps an actual phrase/clause ordering ladder', () => {
  const connectors = bank.filter(item => item.skillId === 'writing_organization' && item.constructClaim === 'connecting_word');
  assert.equal(connectors.length, 30);
  assert.equal(connectors.filter(item => old(item.id).level === 2).length, 20);
  for (const item of connectors) {
    assert.equal(item.level, 1, item.id);
    assert.equal(item.demandCeiling, 1, item.id);
    assert.deepEqual(item.requiredAudioCues, old(item.id).requiredAudioCues);
  }
  const entry = byId('mock.capacity.writing.link-entry-result');
  const formerlyHard = byId('mock.capacity.writing.link-detail-result');
  assert.match(entry.passage, /Show the result/);
  assert.match(formerlyHard.passage, /As a result/);
  assert.equal(key(entry), 'so');
  assert.equal(key(formerlyHard), 'so');
  assert.equal(entry.level, formerlyHard.level);
  const order = bank.filter(item => item.skillId === 'writing_organization' && item.constructClaim === 'sentence_word_order');
  assert.equal(order.filter(item => item.level === 1).length, 11);
  assert.equal(order.filter(item => item.level === 2).length, 10);
  for (const item of order.filter(item => item.level === 2)) {
    assert.equal(item.demandCeiling, undefined);
    assert.ok(item.choices.some(choice => /^(under|beside|through|before|until|because|although)$/i.test(choice.label.replace(/,$/, ''))), item.id);
    assert.equal(item.format, 'order');
    assert.equal(item.oralLanguageAccess, true);
  }
  assert.deepEqual(byId('mock.sentence.puppy').choices.map(choice => choice.label), ['The', 'puppy', 'sleeps.']);
  assert.deepEqual(byId('mock.sentence.because').choices.map(choice => choice.label), ['We', 'went', 'inside', 'because', 'it', 'rained.']);
  assert.ok(sameLiteracyMockTask(byId('mock.sentence.puppy'), byId('mock.sentence.because')));
});

test('exact required cues are reviewable and pending cues block availability; a same-topic recording cannot substitute', () => {
  const corrected = bank.filter(item => item.sourceProvenance?.v4LanguageCorrection);
  const all = [...corrected, ...additions];
  const work = literacyMockLanguageAccessV4MissingAudio(all);
  assert.equal(new Set(work.map(cue => `${cue.role}:${cue.text}`)).size, work.length);
  assert.equal(additions.flatMap(item => item.requiredAudioCues.filter(cue => cue.role === 'passage')).length, 40);
  assert.equal(corrected.filter(item => item.skillId === 'prefix_suffix').flatMap(item => item.requiredAudioCues.filter(cue => cue.role === 'passage')).length, 10);
  assert.ok(additions.every(item => item.requiredAudioCues.some(cue => cue.role === 'instruction' && cue.text === 'Which phrase fits?')));
  assert.ok(additions.every(item => item.requiredAudioCues.some(cue => cue.role === 'choice' && cue.text === 'level with')));
  const expectedPending = new Set(all.flatMap(item => item.requiredAudioCues.filter(cue => !cue.path)
    .map(cue => `${cue.role}:${cue.text}`)));
  assert.deepEqual(new Set(work.map(cue => `${cue.role}:${cue.text}`)), expectedPending);
  for (const item of all) {
    assert.equal(item.mediaReady, item.requiredAudioCues.every(cue => Boolean(cue.path)));
    for (const cue of item.requiredAudioCues.filter(cue => !cue.path)) {
      assert.ok(work.find(entry => entry.role === cue.role && entry.text === cue.text && entry.itemIds.includes(item.id)));
    }
  }
  const careless = old('mock.depth.affix-careless');
  const wrongPassage = { requiredAudioCues: [{ role: 'passage', text: 'Rae is careful.', path: '/unrelated.mp3' }] };
  const correctedCareless = correctLiteracyMockLanguageAccessV4(careless, [wrongPassage]);
  assert.notEqual(correctedCareless.requiredAudioCues.find(cue => cue.role === 'passage').path, '/unrelated.mp3');
});
