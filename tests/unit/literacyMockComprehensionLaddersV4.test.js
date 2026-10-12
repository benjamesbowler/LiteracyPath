import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { literacyMockTaskKey } from '../../src/utils/literacyMockConditions.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { buildLiteracyMockComprehensionLaddersV4, correctLiteracyMockComprehensionV4,
  MOCK_V4_COMPREHENSION_APPROVED_TASKS, MOCK_V4_COMPREHENSION_FIXED_ONLY_CLAIMS } from '../../src/data/literacyMockComprehensionLaddersV4.js';

const original = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v3', includeUnavailable: true });
const originalBytes = JSON.stringify(original);
const sources = buildLiteracyMockComprehensionLaddersV4(original);
const bank = sources.map(item => normalizeLiteracyMockItem(item, { contentVersion: 'literacy-mock-v4' }));
const find = (skill, claim, level, id) => bank.find(item => item.id === `mock.v4.comprehension.${skill}.${claim}.l${level}.${id}`);
const labels = item => item.choices.map(choice => choice.label);
const key = item => item.choices.find(choice => choice.id === item.answer).label;
const includes = (text, phrase, message) => assert.ok(text.toLowerCase().includes(phrase.toLowerCase()), `${message}: ${phrase}`);

// These independent matrices name the expected response and the actual
// competing roles. They do not read the author's taskDemand/proof fields.
const detailOracles = {
  what_happened: {
    parcel: ['a scarf', 'put the scarf inside', 'card stayed beside', 'ribbon went around'],
    puppet: ['a split pin', 'split pin to join its moving arm', 'glue held a crack', 'tape covered the stand'],
    plant: ['a stick', 'stick held the stem upright', 'soil covered the roots', 'saucer caught water'],
    boat: ['a rope', 'pulled it ashore with a rope', 'steered with a paddle', 'cloth over the seats'],
    bread: ['a towel', 'covered it with a towel', 'board stayed underneath', 'sliced the bread with a knife'],
    kite: ['a pole', 'pole to lift the kite', 'tugging it caught the kite', 'carried it home in a bag'],
    model: ['some clips', 'clips held the removable roof', 'tape joined the model’s walls', 'paint covered the walls'],
    lantern: ['a lamp', 'lamp inside the lantern', 'handle above it', 'paper around its frame'],
    picnic: ['some milk', 'milk went in the cooler', 'bread went in a basket', 'apples went in a bag'],
    nest: ['some feathers', 'lined the inside with feathers', 'outside of its nest from twigs', 'mud fixed the nest'],
  },
  where: {
    museum: ['in the lockers', 'bags stayed in the lockers', 'entered through the garden', 'visited the dinosaur room'],
    banner: ['above the hall entrance', 'hung it above the hall entrance', 'painted the banner on the playground floor', 'flags stayed beneath the walkway'],
    boots: ['on the porch', 'left them on the porch', 'boots along the muddy path', 'ate lunch in the kitchen'],
    cake: ['on the wire rack', 'wire rack to cool', 'cake baked in the oven', 'carried it to the table for tea'],
    book: ['inside Noor’s bag', 'book stayed inside the bag', 'borrowed a book from the library', 'played on the court'],
    rabbit: ['inside the pen', 'into a pen while she cleaned', 'returned it to the cage afterwards', 'food in the shed'],
    letters: ['in a covered bag', 'bag stayed on his back', 'letters from the post office', 'opened it at Badger’s door'],
    seeds: ['inside the cups', 'cups by the window, where the first shoots appeared', 'dry seeds in a jar', 'young plants into the garden'],
    tools: ['inside the shed', 'put the tools in the shed', 'tools beside the fence', 'waited beneath a tree'],
    puzzle: ['on a tray', 'slid it onto a tray', 'began the puzzle on the table', 'empty box stayed on the table'],
  },
  who: {
    roof: ['Noor', 'Noor glued the roof', 'Eli made the model’s roof', 'Tessa held the walls'],
    clock: ['Ren', 'Ren pressed the clock', 'Iris moved the white pieces', 'Malik recorded the final score'],
    bread: ['Finn’s aunt', 'aunt brought bread', 'Finn packed apples', 'cousin carried the blanket'],
    map: ['Uma', 'Uma held it and used its marks', 'Leo drew the map', 'Kit checked the time'],
    scarf: ['Gran', 'Gran knitted it into a scarf', 'Dad wrapped the finished scarf', 'Bea chose the wool'],
    garden: ['Sam', 'Sam watered the plants', 'Jo planted the seeds', 'Eve picked the ripe tomatoes'],
    costume: ['Ada', 'Ada stitched the seam', 'Ben made a costume', 'Lou held the loose cloth'],
    bird: ['the keeper', 'keeper cared for its wing and opened the cage', 'Mira found the injured bird', 'brother carried the empty cage'],
    poster: ['the teacher', 'teacher chose the wall', 'Hana drew it', 'Bo carried it to the hall'],
    soup: ['Dad', 'Dad filled the bowls', 'Mum cooked the soup', 'Sam laid out spoons'],
  },
};

test('22 exact tasks have ten independently distinct paired families and no inherited ceilings', () => {
  assert.equal(sources.length, 440);
  assert.equal(new Set(bank.map(item => item.id)).size, 440);
  const tasks = new Map();
  for (const item of bank) {
    const task = literacyMockTaskKey(item);
    if (!tasks.has(task)) tasks.set(task, []);
    tasks.get(task).push(item);
    assert.equal(item.format, 'choice');
    assert.equal(item.choices.length, 3);
    assert.equal(new Set(labels(item)).size, 3, item.id);
    assert.equal(item.demandCeiling, undefined, item.id);
    assert.equal(item.ceilingReason, undefined, item.id);
    assert.equal(item.ceilingNextTask, undefined, item.id);
  }
  assert.deepEqual(new Set(tasks.keys()), new Set(MOCK_V4_COMPREHENSION_APPROVED_TASKS.map(literacyMockTaskKey)));
  for (const items of tasks.values()) for (const level of [1, 2]) {
    const group = items.filter(item => item.level === level);
    assert.equal(group.length, 10);
    assert.equal(new Set(group.map(item => item.exposureFamilyId)).size, 10);
    assert.equal(new Set(group.map(item => item.passage)).size, 10);
    // An entry reference can be followed by a six-item harder round without
    // counting its paired context or listening twin as fresh.
    const familiar = items.find(item => item.level === 1).exposureFamilyId;
    assert.equal(group.filter(item => item.exposureFamilyId !== familiar).length, 9);
  }
});

test('every actor/object/place key and both foil roles agree with the literal authored context', () => {
  for (const [claim, rows] of Object.entries(detailOracles)) for (const [id, [answer, ...facts]] of Object.entries(rows)) {
    for (const level of [1, 2]) {
      const item = find('key_details', claim, level, id);
      assert.equal(key(item), answer, item.id);
      const twin = find('listen_key_details', claim, level, id);
      assert.equal(twin.passage, item.passage);
      assert.deepEqual(labels(twin), labels(item));
      assert.equal(key(twin), answer);
    }
    for (const fact of facts) includes(find('key_details', claim, 2, id).passage, fact, id);
  }
});

// [query attributes, expected count, competing counts with their one-match
// attributes, exact supporting clauses]. No arithmetic supplies these keys.
const countOracles = {
  maps: [['on the cart', 'borrow'], 'three', ['five', 'two'], ['Three maps on the cart could be borrowed', 'Five maps on the cart had to stay', 'Two maps beside the desk']],
  books: [['story books', 'top shelf'], 'four', ['six', 'five'], ['Four story books stood on the top shelf', 'six nature books', 'Five more story books stood on the bottom shelf']],
  seats: [['window', 'free'], 'two', ['four', 'three'], ['Two seats beside the window were free', 'Four other window seats had coats', 'Three seats near the door']],
  plants: [['flowering', 'inside'], 'six', ['four', 'three'], ['Six flowering plants grew inside the greenhouse', 'four plants with only leaves', 'Three more flowering plants stood outside']],
  cups: [['clean', 'tray'], 'five', ['two', 'four'], ['Five clean cups were on the tray', 'Two used cups were on the tray', 'Four clean cups remained in the cupboard']],
  bikes: [['children’s', 'repair'], 'three', ['five', 'two'], ['Three children’s bikes needed repair', 'five children’s bikes were ready', 'Two adults’ bikes also needed repair']],
  tickets: [['evening', 'sale'], 'four', ['six', 'three'], ['Four evening tickets were left for sale', 'Six evening tickets were set aside', 'Three afternoon tickets were still for sale']],
  birds: [['small', 'feeder'], 'two', ['one', 'four'], ['Two small birds perched on the feeder', 'one large bird', 'Four small birds waited on the fence']],
  pencils: [['red', 'sharpened'], 'five', ['three', 'four'], ['Five red pencils were sharpened', 'Three red pencils still had blunt tips', 'Four blue pencils were sharpened']],
  boats: [['sailing', 'jetty'], 'three', ['two', 'four'], ['Three sailing boats were tied beside the jetty', 'two rowing boats', 'Four other sailing boats lay farther out']],
};

test('every count question binds two attributes; every count foil fits only one', () => {
  const answerPositions = new Set();
  for (const [id, [attributes, answer, foils, facts]] of Object.entries(countOracles)) {
    const item = find('key_details', 'number_detail', 2, id);
    for (const attribute of attributes) includes(item.prompt, attribute, item.id);
    assert.equal(key(item), answer, item.id);
    assert.deepEqual(labels(item).filter(label => label !== answer), foils);
    for (const fact of facts) includes(item.passage, fact, item.id);
    const countWords = item.passage.toLowerCase().match(/\b(one|two|three|four|five|six)\b/g);
    assert.ok(countWords.includes(answer));
    answerPositions.add(countWords.indexOf(answer));
    assert.equal(key(find('key_details', 'number_detail', 1, id)), answer);
  }
  assert.ok(answerPositions.size >= 3, 'the first/last spoken count must not be a pool-wide key');
});

const eventAliases = {
  photo: [/hang|hung/, /mov/, /open/], club: [/check/, /hand/, /chose|choos/], garden: [/gloves/, /pick/, /fill/],
  picnic: [/unfold/, /clos/, /count/], art: [/wash/, /draw|drew/, /fetch/], music: [/sung|sang|sing/, /mov/, /clap/],
  library: [/clos/, /look/, /switch/], boat: [/wav/, /tying|tied/, /put/], puppet: [/open/, /nam/, /mov/],
  walk: [/count/, /tak|took/, /ate|eat/],
};

test('every harder timeline is solved from literal temporal links, not mention order', () => {
  for (const [id, aliases] of Object.entries(eventAliases)) {
    const entry = find('sequencing', 'story_event_order', 1, id);
    const item = find('sequencing', 'story_event_order', 2, id);
    const event = phrase => {
      const hits = aliases.flatMap((pattern, index) => pattern.test(phrase.toLowerCase()) ? [index] : []);
      assert.equal(hits.length, 1, `${id}: ambiguous event phrase ${phrase}`);
      return hits[0];
    };
    const sentences = item.passage.split('.').map(text => text.trim()).filter(Boolean);
    assert.equal(sentences.length, 2, id);
    const edges = sentences.map(sentence => {
      let match = sentence.match(/^Before (.*), (.*)$/i);
      if (match) return [event(match[2]), event(match[1])];
      match = sentence.match(/^(.*) before (.*)$/i);
      if (match) return [event(match[1]), event(match[2])];
      match = sentence.match(/^(.*) after (.*)$/i);
      assert.ok(match, sentence);
      return [event(match[2]), event(match[1])];
    });
    assert.deepEqual(edges.sort((a, b) => a[0] - b[0]), [[0, 1], [1, 2]], id);
    assert.equal(event(sentences[0].split(/ after /i)[0]), 2, 'first mention is the final event');
    assert.equal(event(key(item)), 0, 'the keyed response must be the solved earliest event');
    assert.deepEqual(labels(item), labels(entry));
    const firstPositions = aliases.map(pattern => entry.passage.toLowerCase().search(pattern));
    assert.ok(firstPositions[0] < firstPositions[1] && firstPositions[1] < firstPositions[2], id);
  }
});

const causeOracles = {
  lamp: ['A fresh battery was fitted.', 'The lamp lit.', ['flat battery', 'stayed dark', 'same fan and mat', 'still lit with the fresh battery']],
  tin: ['The tin was greased.', 'The cake came out easily.', ['ungreased tin', 'it stuck', 'same recipe and used the same spoon', 'greased tin', 'different spoon']],
  drain: ['The drain was cleared.', 'Water flowed away.', ['leaf-blocked drain', 'water collected', 'rain continued', 'next rainy day', 'fence paint had dried']],
  boat: ['Air blew towards the sail.', 'The boat moved.', ['fan faced away', 'boat stayed still', 'keeping the flag in place', 'after she put the flag away']],
  wheel: ['The brake pad was moved clear.', 'The wheel turned freely.', ['pad rubbed the wheel', 'hard to turn', 'same cloth again', 'still turned freely later']],
  shade: ['The awning was opened.', 'The table became shaded.', ['awning shut', 'sunlight fell on the table', 'bell kept ringing', 'stayed shaded after the bell stopped']],
  tent: ['The loose rope was tightened.', 'The tent stood upright.', ['straight poles and a loose rope', 'without moving the poles', 'stayed upright after Kim moved a bag out']],
  ice: ['The cup was put in the freezer.', 'The water froze.', ['stayed liquid on a blue tray in a warm room', 'same cup and tray went into a freezer', 'second cup froze', 'red tray']],
  bridge: ['Ridges were folded into the paper.', 'The bridge held the car.', ['flat paper sagged', 'same paper', 'same boxes', 'folded paper also held the car', 'boxes were exchanged']],
  lid: ['The waterproof lid was closed.', 'The lunch stayed dry.', ['box was open in a basket', 'same basket during more rain', 'closed box kept lunch dry', 'without the basket']],
};

test('all three causal question operations use the actual isolated condition and outcome', () => {
  for (const [id, [cause, effect, observations]] of Object.entries(causeOracles)) for (const level of [1, 2]) {
    const causeItem = find('cause_effect', 'find_cause', level, id);
    const effectItem = find('cause_effect', 'find_effect', level, id);
    const sentenceItem = find('cause_effect', 'because_sentence', level, id);
    assert.equal(key(causeItem), cause, causeItem.id);
    assert.equal(key(effectItem), effect, effectItem.id);
    assert.equal(key(sentenceItem), `${effect.slice(0, -1)} because ${cause[0].toLowerCase()}${cause.slice(1)}`);
    assert.equal(causeItem.passage, effectItem.passage);
    assert.equal(causeItem.passage, sentenceItem.passage);
    if (level === 2) for (const fact of observations) includes(causeItem.passage, fact, id);
    for (const item of [causeItem, effectItem, sentenceItem]) {
      const listening = bank.find(twin => twin.id === item.id.replace('.cause_effect.', '.listen_cause_effect.'));
      assert.equal(listening.passage, item.passage);
      assert.equal(key(listening), key(item));
      assert.ok(labels(item).every(label => !/\bnever\b|\bnot\b/.test(label)), item.id);
    }
  }
});

const mainOracles = {
  roots: ['Roots support plants and supply their needs.', 'hold a plant upright', 'take in water', 'store food'],
  compost: ['Composting reuses scraps to improve garden soil.', 'put leaves and fruit peel in a heap', 'break the scraps down', 'mix the finished material into soil'],
  duck: ['Feather layers keep swimming ducks warm and dry.', 'trap warm air', 'water roll off'],
  seeds: ['Seeds reach new places in several ways.', 'carry them on the wind', 'cling to fur', 'birds carry seeds'],
  worms: ['Worms change soil by tunnelling and feeding.', 'tunnels that let air and water enter', 'pull dead leaves down', 'mix material'],
  shadow: ['Light and position change a toy’s shadow.', 'shifts the shadow', 'makes its shadow larger'],
  bees: ['Flower visits feed bees and help plants.', 'nectar to take to its hive', 'helping that plant make seeds'],
  pond: ['Ponds meet frogs’ needs through their lives.', 'hiding places for frogs', 'provide food', 'young begin life there'],
  rain: ['Collecting rain provides water for dry days.', 'pipe into a tank', 'screen catches leaves', 'stored water for plants'],
  owl: ['Several body features help owls hunt at night.', 'see in dim light', 'hearing helps', 'flight quiet'],
};

test('all informational main ideas cover connected evidence; neither true partial foil covers all parts', () => {
  for (const [id, [answer, ...parts]] of Object.entries(mainOracles)) {
    const item = find('main_idea', 'mostly_about_info', 2, id);
    assert.equal(key(item), answer, id);
    for (const fact of parts) includes(item.passage, fact, id);
    assert.ok(!item.passage.toLowerCase().split('.')[0].includes(answer.toLowerCase().slice(0, -1)), id);
    assert.ok(labels(item).every(label => !/\bnot\b|\bnever\b|\balways\b/.test(label)), id);
    assert.notDeepEqual(labels(item), labels(find('main_idea', 'mostly_about_info', 1, id)));
  }
});

const themeOracles = {
  check: ['Checking details before finishing can prevent mistakes.', 'measured before trying again', 'checked a list'],
  listen: ['Hear the whole message before deciding what to do.', 'full plan before rebuilding', 'whole request before answering'],
  cause: ['Find the cause before repeating an unsuccessful fix.', 'caught stone', 'blocked hole'],
  help: ['Explaining a problem can help you get useful help.', 'told Gran', 'telling his teacher'],
  adapt: ['Try a different approach when the first one fails.', 'turned it sideways', 'hand signal'],
  needs: ['Adjust what you do to fit different needs.', 'suit the soil', 'job that suited the child'],
  test: ['Test a small part before completing the whole job.', 'paint on a scrap', 'string through one hole'],
  feedback: ['Use specific feedback to improve unclear work.', 'which marks were confusing', 'show where they got lost'],
  slow: ['Pause at important points to avoid repeating errors.', 'difficult folds', 'check the names'],
  record: ['Record useful details before they are easy to forget.', 'labelled the next pots', 'marked the parts'],
};

test('every harder theme has two substantively different episodes and two useful partial lessons', () => {
  let longestKeys = 0;
  for (const [id, [answer, firstRepair, secondRepair]] of Object.entries(themeOracles)) {
    const entry = find('theme', 'lesson_mistake_fixed', 1, id);
    const item = find('theme', 'lesson_mistake_fixed', 2, id);
    assert.equal(key(entry), answer, id);
    assert.equal(key(item), answer, id);
    includes(item.passage, firstRepair, id);
    includes(item.passage, secondRepair, id);
    assert.notDeepEqual(labels(entry).slice(1), labels(item).slice(1), 'entry must not offer a valid lesson from its sole episode as a foil');
    assert.ok(labels(item).every(label => !/\bnot\b|\bnever\b|\balways\b/.test(label)), id);
    if (key(item).length > Math.max(...labels(item).slice(1).map(text => text.length))) longestKeys++;
  }
  assert.ok(longestKeys <= 4, 'longest option must not solve almost every harder theme');
});

const supportOracles = {
  coat: ['warm', 'dry', 'hood traps warm air and sheds rain', 'cuffs trap warm air', 'pockets shed rain'],
  bridge: ['heavy', 'boats', 'strong supports for heavy trucks and rises for boats', 'pillars carry heavy loads', 'platform moves aside for boats'],
  box: ['bumps', 'rain', 'cushions the model and keeps rain out', 'divider cushions its sides', 'cover keeps rain out'],
  path: ['dark', 'rain', 'lit arrows point along a covered walkway', 'lamps also light the open steps', 'shelter keeps one resting bench dry'],
  nest: ['dry', 'cats', 'covered nesting box has a high entrance beyond a cat’s reach', 'high open platform', 'covered low basket stays dry'],
  cup: ['hold', 'warm', 'handle fits a child’s hand', 'plain handle is easy to grip', 'lid slows cooling'],
  seat: ['reach', 'safely', 'raised seat has a secure strap', 'raised cushion also lifts', 'low strapped seat holds'],
  plant: ['deep', 'save', 'long roots reach deep water and thick leaves store', 'long roots reach deep water beneath thin leaves', 'shallow roots'],
  library: ['quiet', 'wheelchair', 'quiet ground-floor room has a wide level doorway', 'quiet room is upstairs', 'busy ground-floor play area'],
  shelter: ['sun', 'rain', 'solid roof and closed sides block sunlight and blowing rain', 'slatted roof shades', 'clear side screen stops blowing rain'],
};

const supportKeys = {
  coat: 'The lined hood traps warm air and sheds rain.',
  bridge: 'The strong deck carries trucks and rises for boats.',
  box: 'The padded sleeve cushions the model and keeps rain out.',
  path: 'Lit arrows guide walkers beneath a covered walkway.',
  nest: 'The high covered box keeps rain and cats away.',
  cup: 'The handled insulated cup is easy to grip and slows cooling.',
  seat: 'The raised strapped seat lifts and secures the child.',
  plant: 'Long roots reach deep water and thick leaves store it.',
  library: 'The quiet ground-floor room has a wide level doorway.',
  shelter: 'The solid roof and closed sides block sun and rain.',
};

test('every supporting-detail extension asks for two properties and distinguishes the two one-property foils', () => {
  for (const [id, [a, b, ...facts]] of Object.entries(supportOracles)) {
    const entry = find('informational_features', 'supporting_detail', 1, id);
    const item = find('informational_features', 'supporting_detail', 2, id);
    assert.equal(key(item), supportKeys[id]);
    includes(item.prompt, a, id);
    includes(item.prompt, b, id);
    for (const fact of facts) includes(item.passage, fact, id);
    assert.notEqual(entry.prompt, item.prompt);
    assert.ok(labels(item).every(label => !/\bnot\b|\bnever\b/.test(label)), id);
  }
});

const purposeOracles = {
  repair: ['to encourage people to bring items for repair', 'Bring an item on Saturday', 'tighten wheels', 'favourite toy useful again'],
  walk: ['to help walkers prepare for the planned route', 'Before leaving, fill', 'field with little shade', 'bag is light enough'],
  pond: ['to persuade visitors to dispose of litter safely', 'Use them for your rubbish', 'mistaken for food', 'bins stand beside both gates'],
  dog: ['to help people identify and report a missing dog', 'please tell the park keeper', 'hide under a bench', 'slipped out near the park'],
  museum: ['to explain entry arrangements for different visitors', 'Children enter free with an adult', 'before ten should use the front doors', 'groups should show their booking'],
  river: ['to warn walkers and direct them to a safe route', 'Take the upper route', 'links the playground and bridge', 'signs mark the closed path'],
  plant: ['to give a safe sequence for planting and watering', 'Fill a pot with soil', 'needs moisture', 'deep water can harm'],
  books: ['to help readers compare books for different interests', 'choose the one that suits', 'River Birds has clear pictures', 'Pip’s Picnic is a funny story'],
  weather: ['to report and compare the class’s weather observations', 'notes compare the two mornings', 'checked the sky and thermometer', 'Monday was rainy and warm'],
  thanks: ['to thank the owner and explain why the help mattered', 'grateful for the chance', 'returned the keys', 'backstage space'],
};

test('all purpose keys infer the whole communicative goal; each foil refers to an actual supporting part', () => {
  for (const [id, [answer, whole, partial1, partial2]] of Object.entries(purposeOracles)) {
    const item = find('informational_features', 'purpose', 2, id);
    assert.equal(key(item), answer, id);
    for (const fact of [whole, partial1, partial2]) includes(item.passage, fact, id);
    assert.equal(item.prompt, 'What is the main purpose of this text?');
    assert.ok(labels(item).every(label => label.startsWith('to ')));
    assert.ok(labels(item).every(label => !/\bnever\b|\balways\b/.test(label)), id);
    assert.ok(!item.passage.includes('chart below'), 'no absent chart is supplied as evidence');
  }
});

test('access remains identical within every pair and exact missing recordings fail closed', () => {
  for (const source of sources) {
    const item = bank.find(candidate => candidate.id === source.id);
    const listening = item.modality === 'listening';
    assert.equal(item.displayPassageDuringResponse, !listening);
    assert.equal(item.evidenceModality, listening ? 'audio' : 'text');
    assert.equal(item.hideWrittenLabels, false);
    assert.deepEqual(item.requiredAudioCues.map(cue => cue.role), listening ? ['passage', 'instruction', 'choice', 'choice', 'choice'] : ['instruction']);
    for (const cue of item.requiredAudioCues) {
      const expected = cue.role === 'choice' ? getLedaWordAudioPath(cue.text) || getLedaInstructionAudioPath(cue.text) : getLedaInstructionAudioPath(cue.text);
      assert.equal(cue.path, expected, `${item.id}: ${cue.text}`);
      if (cue.path) assert.ok(fs.existsSync(`public${cue.path}`), cue.path);
      if (cue.role === 'passage') assert.equal(cue.text, item.passage);
      if (cue.role === 'instruction') assert.equal(cue.text, item.prompt);
      if (cue.role === 'choice') assert.equal(cue.text, item.choices.find(choice => choice.id === cue.choiceId).label);
    }
    assert.equal(item.mediaReady, item.requiredAudioCues.every(cue => Boolean(cue.path)), item.id);
    assert.deepEqual(source.missingAudioCues.map(cue => cue.text), item.requiredAudioCues.filter(cue => !cue.path).map(cue => cue.text));
  }
});

test('paired levels, related question operations and reading/listening twins never create false freshness', () => {
  for (const item of bank) {
    const pair = bank.find(candidate => candidate.id === item.id.replace(/\.l[12]\./, `.l${item.level === 1 ? 2 : 1}.`));
    assert.ok(pair, item.id);
    assert.equal(item.exposureFamilyId, pair.exposureFamilyId);
    assert.ok(item.canonicalPassageId && pair.canonicalPassageId);
    assert.equal(literacyMockTaskKey(item), literacyMockTaskKey(pair));
    if (item.skillId.startsWith('listen_')) {
      const twin = bank.find(candidate => candidate.id === item.id.replace('listen_', ''));
      assert.equal(item.exposureFamilyId, twin.exposureFamilyId);
      assert.equal(item.canonicalItemId, twin.canonicalItemId);
    }
  }
  for (const id of Object.keys(causeOracles)) {
    const shared = ['find_cause', 'find_effect', 'because_sentence'].map(claim => find('cause_effect', claim, 2, id));
    assert.equal(new Set(shared.map(item => item.exposureFamilyId)).size, 1);
  }
});

test('v3 remains byte-identical and unsupported harder predecessors are honest fixed entry evidence', () => {
  let changed = 0;
  for (const item of original) {
    const corrected = correctLiteracyMockComprehensionV4(item);
    if (corrected === item) continue;
    changed++;
    assert.equal(corrected.level, 1, item.id);
    assert.equal(corrected.demandCeiling, 1);
    assert.equal(corrected.adaptiveMixedEligible, false);
    assert.equal(corrected.constructClaim, item.constructClaim);
    assert.equal(corrected.modality, item.modality);
    assert.equal(corrected.passage, item.passage);
    assert.deepEqual(corrected.choices, item.choices);
    assert.equal(corrected.itemSnapshot.level, 1);
    assert.equal(correctLiteracyMockComprehensionV4(corrected), corrected);
  }
  assert.ok(changed > 1000);
  assert.equal(JSON.stringify(original), originalBytes);
  for (const excluded of MOCK_V4_COMPREHENSION_FIXED_ONLY_CLAIMS) {
    assert.ok(!bank.some(item => item.skillId === excluded.skillId && item.constructClaim === excluded.constructClaim));
    for (const item of original.filter(candidate => candidate.skillId === excluded.skillId && candidate.constructClaim === excluded.constructClaim)) assert.equal(correctLiteracyMockComprehensionV4(item).demandCeiling, 1);
  }
});
