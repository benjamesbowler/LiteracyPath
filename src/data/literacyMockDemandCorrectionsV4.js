import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

// These corrections belong exclusively to the v4 authoring branch. They are
// applied to copies of normalized v3 items; published v3 snapshots stay intact.
const FILE = 'src/data/literacyMockDemandCorrectionsV4.js';
const ENDING_CLAIMS = new Set(['full_stop', 'question_mark', 'exclamation_mark']);
const BOUNDARY_PROMPT = 'Which choice separates the two complete sentences?';
const clone = value => JSON.parse(JSON.stringify(value));
const normalize = value => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
const capital = value => value[0].toUpperCase() + value.slice(1);
const endingIds = Object.freeze({
  1: [
    ...[1, 3, 6, 9, 11].map(index => `literacy.punctuation.sentence-fix-easy-${index}`),
    ...[1, 4, 7, 10].map(index => `literacy.punctuation.sentence-fix-medium-${index}`),
    ...Array.from({ length: 7 }, (_, index) => `mock.capacity.writing.stop-entry-${index + 1}`),
    ...Array.from({ length: 6 }, (_, index) => `mock.capacity.writing.question-entry-${index + 1}`),
    ...Array.from({ length: 8 }, (_, index) => `mock.capacity.writing.exclaim-entry-${index + 1}`),
  ].sort((a, b) => a.localeCompare(b)),
  2: [
    ...[2, 7, 11, 17].map(index => `literacy.punctuation.sentence-fix-hard-${index}`),
    ...Array.from({ length: 9 }, (_, index) => `mock.capacity.writing.stop-detail-${index + 1}`),
    ...Array.from({ length: 8 }, (_, index) => `mock.capacity.writing.question-detail-${index + 1}`),
    ...Array.from({ length: 9 }, (_, index) => `mock.capacity.writing.exclaim-detail-${index + 1}`),
  ].sort((a, b) => a.localeCompare(b)),
});

// Each row has different events, not merely substituted names or nouns. Entry
// asks for a boundary between two main clauses. Extension retains that action,
// but a dependent clause is a plausible false boundary within the first sentence.
const boundaries = [
  ['the dog ran', 'the cat hid', 'while the dog ate', 'the cat slept', 'the fox ran'],
  ['the rain fell', 'the path flooded', 'because the rain stopped', 'the path dried', 'the children played'],
  ['the bell rang', 'the class lined up', 'when the bell rang', 'the class lined up', 'the teacher counted'],
  ['the sun rose', 'the birds sang', 'before the sun rose', 'the birds woke', 'the farmer got up'],
  ['the cup tipped', 'the milk spilled', 'after the cup tipped', 'the milk spilled', 'the child fetched a cloth'],
  ['the seed grew', 'the flower opened', 'although the soil was dry', 'the seed grew', 'the gardener brought water'],
  ['the wind blew', 'the kite rose', 'while the wind blew', 'the kite rose', 'the string snapped'],
  ['the bus stopped', 'the children got off', 'when the bus stopped', 'the children got off', 'the driver closed the door'],
  ['the lamp broke', 'the room went dark', 'because the lamp broke', 'the room went dark', 'the child found a torch'],
  ['the baby cried', 'the parent picked her up', 'after the baby cried', 'the parent picked her up', 'the baby smiled'],
  ['the ice melted', 'the water dripped', 'when the ice melted', 'the water dripped', 'the worker emptied the tray'],
  ['the boy drew', 'the girl coloured', 'while the boy drew', 'the girl coloured', 'the teacher hung their pictures'],
  ['the gate opened', 'the sheep came out', 'after the gate opened', 'the sheep came out', 'the farmer shut it again'],
  ['the soup cooled', 'the cook tasted it', 'before the soup cooled', 'the cook stirred it', 'the child set the table'],
  ['the clock stopped', 'the child checked it', 'although the clock stopped', 'the class kept working', 'the teacher checked her watch'],
  ['the boat rocked', 'the sailor sat down', 'because the boat rocked', 'the sailor sat down', 'the waves grew smaller'],
  ['the turtle crawled', 'the rabbit hopped', 'while the turtle crawled', 'the rabbit hopped', 'the children watched them'],
  ['the oven beeped', 'the baker took out the bread', 'when the oven beeped', 'the baker took out the bread', 'the helper closed the oven'],
  ['the snow fell', 'the road turned white', 'after the snow fell', 'the road turned white', 'the driver slowed down'],
  ['the paint dried', 'the child hung the picture', 'before the paint dried', 'the child washed the brush', 'the picture stayed on the table'],
  ['the basket fell', 'the apples rolled', 'because the basket fell', 'the apples rolled', 'the shopkeeper picked them up'],
  ['the door shut', 'the latch clicked', 'when the door shut', 'the latch clicked', 'the dog stopped barking'],
  ['the puddle froze', 'the child stayed on the grass', 'although the puddle froze', 'the path stayed clear', 'the children walked to school'],
  ['the mouse squeaked', 'the owl turned its head', 'while the mouse squeaked', 'the owl turned its head', 'the mouse hid'],
  ['the whistle blew', 'the players stopped', 'after the whistle blew', 'the players stopped', 'the referee spoke'],
  ['the towel got wet', 'the swimmer fetched another', 'because the towel got wet', 'the swimmer fetched another', 'the coach opened the cupboard'],
  ['the phone rang', 'the child answered', 'when the phone rang', 'the child answered', 'the caller asked for her mum'],
  ['the tent leaked', 'the campers moved their bags', 'although the tent leaked', 'the bags stayed dry', 'the campers covered the roof'],
  ['the puppy yawned', 'the child made a bed', 'before the puppy slept', 'the child made a bed', 'the puppy curled up'],
  ['the rope broke', 'the bucket dropped', 'after the rope broke', 'the bucket dropped', 'the worker brought a new rope'],
];

function snapshot(item) {
  const result = { ...item, contentVersion: 'literacy-mock-v4' };
  result.requiredAudioPaths = [...new Set(result.requiredAudioCues.map(cue => cue.path).filter(Boolean))];
  result.missingAudioCues = result.requiredAudioCues.filter(cue => !cue.path)
    .map(({ role, text, choiceId }) => ({ role, text, ...(choiceId ? { choiceId } : {}) }));
  result.mediaReady = result.missingAudioCues.length === 0 && result.requiredAudioCues.length > 0;
  result.itemSnapshot = clone(result);
  delete result.itemSnapshot.itemSnapshot;
  return result;
}

function authored(item, fields) {
  const result = { ...item, ...fields, sourceProvenance: {
    ...item.sourceProvenance, v4Correction: { file: FILE, sourceItemId: item.sourceItemId || item.id },
  } };
  // Keep the old canonical item and family identities: exposure to a source
  // cannot be erased by changing its v4 task, text or alternatives.
  result.stimulusKey = normalize(result.passage);
  result.canonicalPassageId = result.stimulusKey;
  result.mediaDecision = { ...item.mediaDecision, role: 'text-only', paths: [],
    construct: result.constructClaim, constructReview: 'approved', answerNeutral: 'approved',
    reason: 'The exact supplied passage is the evidence. Independent reading remains silent; listening requires its exact recordings.',
  };
  delete result.demandCeiling;
  delete result.ceilingReason;
  delete result.ceilingNextTask;
  return snapshot(result);
}

function boundary(item) {
  // Stable IDs make standalone correction and correction of a filtered bank
  // identical. A new sibling must be authored explicitly rather than receiving
  // an accidental copy of the first available boundary item.
  const index = endingIds[item.level]?.indexOf(item.id) ?? -1;
  if (index < 0 || index >= boundaries.length) throw new Error(`Missing v4 boundary source: ${item.id}`);
  const [first, second, dependent, main, last] = boundaries[index];
  let passage; let labels; let demand;
  if (item.level === 1) {
    passage = `${first} ${second}`;
    const words = passage.split(' ');
    const correct = first.split(' ').length;
    const render = split => `${capital(words.slice(0, split).join(' '))}. ${capital(words.slice(split).join(' '))}.`;
    labels = [render(correct), render(2), render(words.length - 1)];
    demand = { operation: 'punctuate_two_sentence_boundary', dependentClause: false,
      mainClauses: [first, second], keyBoundaryAfter: first,
      contrast: 'Separate two simple complete thoughts; reject a split inside either thought.' };
  } else {
    passage = `${dependent}, ${main} ${last}`;
    const mainWords = main.split(' ');
    labels = [
      `${capital(dependent)}, ${main}. ${capital(last)}.`,
      `${capital(dependent)}. ${capital(main)}, ${last}.`,
      `${capital(dependent)}, ${mainWords.slice(0, 2).join(' ')}. ${capital(mainWords.slice(2).join(' '))} ${last}.`,
    ];
    demand = { operation: 'punctuate_two_sentence_boundary', dependentClause: dependent,
      mainClauses: [main, last], keyBoundaryAfter: `${dependent}, ${main}`,
      contrast: 'Distinguish a dependent opening clause from the complete first thought before locating the same two-sentence boundary.' };
  }
  return authored(item, {
    constructClaim: 'punctuate_two_sentence_boundary', passage, prompt: BOUNDARY_PROMPT,
    choices: labels.map((label, index) => ({ id: `c${index}`, label })), answer: 'c0',
    requiredAudioCues: [{ role: 'instruction', text: BOUNDARY_PROMPT,
      path: getLedaInstructionAudioPath(BOUNDARY_PROMPT), required: true }],
    explanation: item.level === 1
      ? `${capital(first)} and ${second} are two complete thoughts. Each ends with a full stop.`
      : `${capital(dependent)} depends on ${main}; together they form the first complete thought. ${capital(last)} is the second.`,
    distractorRationales: {
      c1: item.level === 1 ? 'Splits the first subject from its action.' : 'Treats the dependent opening clause as a sentence and joins the two main clauses with only a comma.',
      c2: 'Splits a subject or action inside a complete thought, leaving a fragment and a run-on.',
    },
    difficultyEvidence: demand.contrast, taskDemand: demand,
  });
}

// The three alternatives remain short, recorded emotion words. A close foil
// shares an observable clue with the key; the child must use its trigger, time
// or the character's relation to the event to choose the best-supported feeling.
const feelings = {
  stage: ['nervous', 'excited', 'confident',
    'She already knows the song, but twists her sleeve and rechecks its opening before performing.',
    'Excitement could explain taking part; restless checking of already-known words favours nervousness.',
    'Practice could support confidence; tense hands and repeated checking contradict ease.'],
  reunion: ['excited', 'relieved', 'proud',
    'Running to embrace her, rapid questions and continued smiling point to eager pleasure at the reunion.',
    'A return may bring relief, but no earlier danger or worry is supplied; her eager actions support excitement.',
    'A completed trip could bring pride to the traveller; Dev did not make the trip.'],
  'first-audition': ['nervous', 'confident', 'disappointed',
    'Knowing the song at home contrasts with restless hands and repeated checks before the audition.',
    'Knowing the song supports this possibility, but his tense checking shows he is not at ease.',
    'An audition can cause disappointment after a decision, but no decision has been made.'],
  'found-ring': ['relieved', 'worried', 'grateful',
    'The missing ring caused repeated searching; finding it ends the searching and brings a long breath and relaxation.',
    'This fits her earlier searching, but the question asks about the end after the ring is found.',
    'Finding a ring can prompt thanks to a helper, but no helper is supplied; ending the worry explains her relaxation.'],
  'unopened-letter': ['curious', 'hopeful', 'worried',
    'Examining the unknown stamp, asking about its sender and finding its country show a wish to learn.',
    'An unopened letter might bring hoped-for news, but no desired news is mentioned; she seeks information about its origin.',
    'An unknown letter might cause worry, but she approaches it and researches it without an avoidance or danger clue.'],
  'cancelled-trip': ['disappointed', 'worried', 'relieved',
    'His earlier eagerness to go, followed by lowering his head and unpacking after cancellation, points to disappointment.',
    'Strong winds could cause worry, but he is no longer going; his actions concern losing the wanted trip.',
    'Cancellation could relieve someone who did not want to go; his eager preparation shows the opposite.'],
  'finished-mural': ['proud', 'grateful', 'excited',
    'Standing taller while showing the fish he painted links his pleasure to his own contribution.',
    'Family attention could prompt gratitude, but he points out and explains his own completed work.',
    'The opening could cause excitement, but the posture and focus on his own painted details specifically support pride.'],
  'pushed-aside': ['frustrated', 'embarrassed', 'nervous',
    'The repeated interruption, pressed lips and firm request to finish connect the tense behaviour to being blocked.',
    'Being interrupted in front of a partner could be embarrassing, but she keeps her plan open and asserts her right to speak.',
    'Tense lips could suggest nerves, but her firm complaint identifies the interruption as the cause.'],
  'surprise-visit': ['surprised', 'relieved', 'proud',
    'Expecting to be alone contrasts with the arrival; raised eyebrows and the exclamation show the unexpected event.',
    'Welcoming visitors could follow relief, but no expected problem or worry has ended.',
    'A smile could accompany pride, but no achievement or personal contribution is supplied.'],
  'team-invitation': ['relieved', 'proud', 'grateful',
    'Wanting to join while standing apart contrasts with relaxed shoulders after the invitation and taking a turn.',
    'Joining a game could feel like success, but the supplied change is release of tension, not pride in an achievement.',
    'An invitation could prompt gratitude, but the described shoulder change most directly supports feeling more at ease.'],
};

const places = {
  repair: ['in a bicycle repair shop', 'inside a bicycle hire shop', 'at a bicycle race starting line',
    'The earlier helmet and rental clues concern hire; after the tyre goes flat, the mechanic’s examination and chain work identify the different current place.',
    'Imani had hired a bicycle that morning and chosen a helmet from a rack. During her ride, a tyre went flat. She pushed the bicycle into a different shop. An adult lifted it onto a stand to examine the tyre while another adult tightened a customer’s bicycle chain. Pumps and helmets stood beside the workbench.'],
  bakery: ['at a bakery selling fresh bread', 'at a market stall selling bread', 'in a family kitchen baking bread',
    'Bread and an oven fit the earlier home activity, and sales fit a stall; baking behind the current counter together with payment identifies a bakery.',
    'Tom had helped his family mix bread dough at home. Later, he went out to buy rolls for lunch. He waited inside a warm shop beside a glass counter. A worker wrapped a loaf for the customer ahead of him. Through an open doorway behind the counter, Tom saw another worker taking rolls from a large oven. He counted his coins.'],
  'returned-books': ['at a library’s book-return desk', 'at a library reading table', 'at a bookshop till',
    'The reading table describes where Lena was earlier; after moving with her borrowed books, the return slot and borrowing card identify the current return desk.',
    'Lena sat at a quiet table to finish her borrowed book. Then she closed it, picked up a second borrowed book and walked across the room. At a counter she placed both books into a return slot. A worker checked her borrowing card. Other people stayed at the tables while Lena waited beside the slot.'],
  'tooth-check': ['in a dentist’s room', 'in a hairdresser’s chair', 'in an eye examination room',
    'The wide chair and mirror overlap with the earlier haircut; the later mouth examination with a small mirror identifies the current dental appointment.',
    'Omar had sat in a wide chair for a haircut that morning. Later, he went to another appointment and sat back in a different wide chair. A bright lamp shone towards his face. The person beside him wore gloves and asked him to open his mouth. She used a small mirror to check each tooth, rather than holding the large mirror he had seen earlier.'],
  'departure-board': ['at a railway station', 'inside a train carriage', 'at an airport gate',
    'The earlier flight explains cases and tickets, but the current track number and waiting before boarding identify a station rather than the airport or a carriage.',
    'The travellers had finished a flight and collected their cases. Next they needed a train to reach their town. They watched a board showing track numbers and departure times. An announcement sent them towards track four. They waited behind the marked line beside the platform, holding their cases and tickets. Their train had not arrived yet.'],
  'animal-check': ['to an animal clinic for a health check', 'to a pet shop to buy a rabbit', 'to a pet show to show a rabbit',
    'The earlier audience and rabbit display fit a show; the later named appointment, examination table and health record identify a different purpose for the current visit.',
    'Priya had shown her rabbit to a group of visitors that morning. In the afternoon, she carried it in a box with air holes to another place. A dog waited beside its owner. A worker called the rabbit’s name and led Priya to a room with scales and an examination table. Priya opened the rabbit’s health card while the worker looked at its ears.'],
  'baking-counter': ['at a bakery selling fresh bread', 'at a bread stall selling ready-made loaves', 'in a family kitchen baking for lunch',
    'The earlier stall sold finished loaves; the current indoor counter combines dough being baked on site with a wrapped purchase and payment.',
    'Suri passed a market stall where finished loaves lay in baskets. She walked on and entered a warm shop. Behind its glass counter, a worker placed soft dough into an oven. Suri chose a seeded loaf from a tray of fresh bread. The worker sliced and wrapped it, then took Suri’s payment.'],
  'paintings-room': ['at a gallery displaying finished paintings', 'at an artist’s studio making paintings', 'at a paint shop selling supplies',
    'The earlier brushes and unfinished picture belong to a working studio; the current public labels, guide and no-touch rule identify a display of finished works.',
    'The family first watched an artist using brushes on an unfinished picture in her workroom. Later they entered a different building. Finished paintings hung on plain walls with small labels naming artists and dates. A guide explained how one painter had used light and shadow. The children were asked to look closely without touching the pictures.'],
  'lane-rope': ['at a swimming pool', 'beside a boating lake', 'at a poolside café',
    'Ravi’s earlier boating and drink explain nearby water and benches; the current lane rope, lifeguard and underwater-breathing instruction identify the lesson setting.',
    'Ravi had watched boats on a lake that morning. After lunch and a drink at an outdoor table, he went to his lesson. He put his towel on a bench and pulled on his goggles. A rope divided the water into lanes. His instructor stood beside a ladder and reminded him to breathe out under water. A lifeguard watched from a tall chair.'],
  'plant-labels': ['at a garden centre selling potted plants', 'at a flower shop selling cut flowers', 'at a vegetable market selling fresh vegetables',
    'Mei’s earlier vegetables and cut flowers concern food and a vase; the current living plants, care labels and potting soil identify a plant that will keep growing.',
    'Mei bought vegetables for dinner and passed a window full of cut flowers in vases. She still needed a plant for her grandmother’s sunny window. In the next shop she walked between rows of living plants in pots. Labels explained how much light each needed. A worker helped her choose one and added a bag of potting soil before Mei paid.'],
};

// Two tempting actions fit an object or problem in each account. The key must
// fit the actual relation among problem, preparations and immediate intention.
const predictions = {
  kite: ['Dad will use the broom to free the kite.', 'Dad will sweep beneath the tree with the broom.', 'Dad will use the broom to knock leaves off the tree.',
    'The broom was for sweeping earlier, but Dad sets the dustpan aside and follows Rosa to the trapped kite; the next use follows the changed goal.',
    'Dad was sweeping leaves beneath a tree when Rosa called him. Her kite had caught in a low branch beyond her reach. Dad set the dustpan beside the path and followed her, still holding the long broom. Rosa pointed to the kite. Dad looked up and raised the broom towards that branch.'],
  plant: ['Max will water the seedling in its old pot.', 'Max will move the seedling into a larger pot.', 'Max will turn the pot to face the window.',
    'The lean and visible root make turning and repotting plausible, but the bigger pot is for later; the jug held above dry soil identifies watering now.',
    'The seedling leaned towards the window, and a root poked through the hole in its pot. Max set a bigger pot on the table for later. The soil in the old pot felt dry and the pot was light. He put a saucer beneath it, brought a jug of water and held the jug over the dry soil.'],
  'loose-shoelace': ['tie her loose lace before joining the running game', 'check the ground for a place to start running', 'wait until the game ends before fixing the lace',
    'The first preparations are for running, but she leaves the starting place and takes both loose lace ends; the immediate plan changes to fixing the shoe.',
    'Nia chose a clear place to start the running game and raised her hand to join. Then she felt a lace brush her ankle and saw that one shoe was untied. The other players began lining up. Nia stepped away from the starting place, bent to her shoe and took one loose end in each hand.'],
  'empty-paint-tray': ['refill the empty tray from the open blue paint tin', 'stir the paint left in the tray with the roller', 'pour the blue paint directly onto the wall',
    'Stirring was useful when paint remained, but the tray is now empty; the painter changes tools and directs the tin towards the tray rather than the wall.',
    'Earlier, the painter had stirred the paint in her tray when its colour looked uneven. Now the roller left a faint patch and there was no paint left in the tray. She put the roller down, opened the blue paint tin and lifted it over the empty tray. She kept the tin away from the wall.'],
  'bus-number-check': ['board the number twelve bus going to the library', 'board the number twelve bus going to the market', 'board the number ten bus going to the library',
    'Ben needs both the route and direction; one bus matches only the number and another matches only the destination.',
    'Ben needed bus twelve to the library. A number twelve bus to the market arrived first, but he kept his travel card in his pocket. Then a number ten bus to the library stopped nearby. Ben stayed where he was. When a number twelve bus showing Library arrived, he took out his card and stepped towards its open door.'],
  'paper-rip': ['attach the sticky tape to join the torn paper edges', 'use the sticky tape to hang the chain on the wall', 'add the sticky tape to an unbroken loop',
    'Hanging was the earlier purpose for the tape, but the chain breaks before reaching the wall; aligning its torn edges establishes the new immediate repair.',
    'Eva took sticky tape to hang a paper chain on the wall. As she lifted the chain, it broke between two loops. She left the wall clear and laid the chain on the table. She brought the torn edges together and held them still with one hand. With the other hand, she peeled a strip of tape.'],
  'overflowing-bin': ['move the recycling from the full bin into the spare bag', 'use the empty bag to cover the full recycling bin', 'put the empty bag inside the already full recycling bin',
    'A bag normally lines an empty bin, but this bin is already full; the opened spare bag beside the checked contents must receive them instead.',
    'The caretaker usually put a clean bag inside an empty bin. Today the recycling bin was still full and its lid would not close. He brought another empty bag, but left it open beside the bin. He checked the recycling label, put on work gloves and reached for the first bottle sticking out of the full bin.'],
  'garden-hose-kink': ['move the chair and straighten the sharply bent hose', 'point the hose nozzle towards another flower to water', 'turn the tap higher and leave the chair there',
    'Changing the flower or increasing the tap addresses other watering problems, but she has already tested the tap; a trapped bend plus reaching for the chair supports removing that obstruction.',
    'Lia moved the nozzle from a small flower to a thirsty rose, but little water came out. She turned the tap higher and tried again. The flow stayed weak. Following the hose, she found it sharply bent beneath a chair leg. She put down the nozzle and reached for the chair with both hands.'],
  'recipe-measure': ['measure one cup of oats to add to the bowl', 'pour oats into the bowl straight from the open jar', 'fill the cup with oats and put it away again',
    'Pouring without measuring fits the earlier bird-feeding job, but this job requires a recipe quantity in the mixing bowl; the cup connects measuring with that new goal.',
    'Uma had poured oats straight from the jar to feed birds that morning. Now she was making biscuits. The recipe said to add one cup of oats. She put the mixing bowl beside the open jar and picked up a measuring cup. She held the cup over the jar so spilled oats would fall back inside.'],
  'quiet-birdwatch': ['look at the bird through the binoculars', 'look through the binoculars at another patch of reeds', 'lower the binoculars and listen without looking',
    'Arun first listened and searched elsewhere; his friend’s new visual clue changes the target, and he turns the binoculars towards that exact spot.',
    'Arun had been listening for a bird hidden in the reeds. He looked through his binoculars at an empty patch, then lowered them when he could not find it. His friend pointed to a brown bird on a stem farther to the left. Arun lifted the binoculars again and turned them towards the stem his friend had shown him.'],
};

function comprehension(item, row, kind) {
  const [key, d1, d2, evidence, extra1, extra2] = row;
  const passage = kind !== 'feeling' && extra1 ? extra1 : item.passage;
  const choices = [key, d1, d2].map((label, index) => ({ id: `c${index}`, label }));
  const cues = [{ role: 'instruction', text: item.prompt, path: getLedaInstructionAudioPath(item.prompt), required: true }];
  if (item.modality === 'listening') {
    const oldPassage = item.requiredAudioCues.find(cue => cue.role === 'passage' && cue.text === passage);
    cues.unshift({ role: 'passage', text: passage, path: oldPassage?.path || getLedaInstructionAudioPath(passage), required: true });
    for (const choice of choices) {
      const old = item.requiredAudioCues.find(cue => cue.role === 'choice' && cue.text === choice.label);
      const path = old?.path || getLedaWordAudioPath(choice.label) || getLedaInstructionAudioPath(choice.label);
      if (path) choice.audioPath = path;
      cues.push({ role: 'choice', text: choice.label, value: choice.label, choiceId: choice.id, path, required: true });
    }
  }
  return authored(item, { passage, choices, answer: 'c0', requiredAudioCues: cues,
    explanation: evidence, difficultyEvidence: evidence,
    distractorRationales: kind === 'feeling' ? { c1: extra1, c2: extra2 } : {
      c1: `Uses a plausible nearby clue without the complete relation. ${evidence}`,
      c2: `Uses a plausible nearby clue without the complete relation. ${evidence}`,
    },
    taskDemand: { operation: item.constructClaim, band: 'competing_interpretations',
      sharedClueFoils: [d1, d2], disambiguatingEvidence: evidence,
      contrast: 'Entry rejects distinct or contradicted interpretations; extension resolves alternatives sharing supplied clues by integrating their trigger, role, time or intention.' },
  });
}

/** Correct normalized source copies only; no writes to v3, media or hosted state. */
export function correctLiteracyMockDemandV4(item, bank = [item]) {
  void bank; // Compatibility with callers applying all v4 corrections together.
  if (item.skillId === 'punctuation' && item.modality === 'recognition' && ENDING_CLAIMS.has(item.constructClaim)) return boundary(item);
  if (!['inference', 'listen_inference'].includes(item.skillId) || item.level !== 2) return item;
  const name = item.id.split('.').at(-1);
  const claim = item.constructClaim.replace(/^listening_/, '');
  if (claim === 'feeling_from_evidence' && feelings[name]) return comprehension(item, feelings[name], 'feeling');
  if (claim === 'where_am_i' && places[name]) return comprehension(item, places[name], 'place');
  if (claim === 'what_happens_next' && predictions[name]) return comprehension(item, predictions[name], 'prediction');
  return item;
}

/** No ID-only copies are added: corrected families already supply ten or more fresh stimuli per level. */
export function buildLiteracyMockDemandItemsV4() { return []; }

export function literacyMockDemandV4MissingAudio(bank) {
  const cues = new Map();
  for (const item of bank) for (const cue of item.missingAudioCues || []) {
    const key = `${cue.role}:${cue.text}`;
    if (!cues.has(key)) cues.set(key, { ...cue, itemIds: [] });
    cues.get(key).itemIds.push(item.id);
  }
  return [...cues.values()];
}
