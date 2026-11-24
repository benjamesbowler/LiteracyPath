import { getLedaProductionAudioPath } from './ledaProductionAudio.js';
import { getLiteracyMockAudioV11Path } from './literacyMockAudioV11.js';
import { normalizeLedaAudioText } from './normalizeLedaAudioText.js';

const contrasts = {
  measure: 'Use the same conditions when making a fair comparison.',
  team: 'Agree on a plan before working together.',
  small: 'Test a small part before completing the whole job.',
  space: 'Leave shared spaces clear for the people who need them.',
  record: 'Record useful details before they are easy to forget.',
  turns: 'Wait for a clear turn when people share an activity.',
  tools: 'Return shared things to the place where others expect them.',
  guide: 'Give specific details when another person needs to find something.',
  gather: 'Gather the needed materials before beginning the job.',
  view: 'Check what another person can actually see.',
  supplies: 'Share what is available so everyone can take part.',
  trials: 'Keep an earlier version when trying an uncertain change.',
  role: 'Try an unfamiliar role before deciding it is not for you.',
  limits: 'Choose a manageable part and share work that is too much.',
  care: 'Protect work from the conditions that could damage it.',
  coach: 'Give useful guidance while leaving another person a chance to try.',
};

// Each row was read beside its mistake, correction, and (where present) second episode.
// These are sensible alternatives for a child in this setting. None explains the repair.
// The two original true-but-partial lessons stay in the two-episode task.
const lessonAlternatives = {
  check:'gather trials supplies',listen:'gather record turns',cause:'tools small trials',
  help:'coach team tools',adapt:'small gather tools',needs:'record gather care',
  test:'care gather team',feedback:'care gather trials',slow:'trials small gather',record:'care supplies turns',
  permission:'tools supplies record','shared-space':'care gather team','turn-taking':'role guide team',
  'fair-materials':'gather tools trials','returning-tools':'guide record supplies','owning-errors':'record turns tools',
  'keeping-promises':'tools supplies turns','fair-comparisons':'turns team role','check-assumptions':'tools gather trials',
  'resolve-disagreement':'supplies space tools','recognise-limits':'space gather tools','repairing-harm':'trials supplies record',
  'let-others-learn':'role guide supplies','losing-well':'role turns supplies','try-a-role':'turns guide team',
  'ask-before-helping':'gather supplies tools','needs-before-extras':'gather trials care','shared-supplies':'tools record turns',
  'welcome-newcomers':'role turns supplies','clear-directions':'space turns team','look-for-evidence':'record care tools',
  'small-contributions':'turns space tools','small-trial':'gather care trials','check-the-request':'record tools turns',
  'wait-for-the-change':'gather space trials','manageable-parts':'record role turns','choose-fitting-tools':'gather supplies tools',
  'leave-working-space':'supplies record care','keep-a-record':'turns team measure','complete-information':'team care tools',
  'mark-before-removing':'tools care gather','fix-the-cause':'trials tools record','change-a-failed-method':'small gather care',
  'check-identity':'space care guide','prepare-the-earlier-step':'care small supplies','consider-another-view':'team turns record',
  'gather-first':'care trials tools','respect-capacity':'tools supplies measure','protect-from-conditions':'record trials gather',
  'make-a-visible-guide':'gather turns tools','tell-people-a-change':'record space turns','compare-with-the-original':'small trials care',
  'keep-working-parts-free':'trials small gather','search-in-order':'tools supplies care','use-the-same-reference':'record trials gather',
  'ask-about-the-need':'small record supplies','enough-not-most':'supplies gather trials','check-each-part':'record team trials',
  'keep-a-way-back':'care record tools','choose-by-the-job':'small supplies care',
};

function audio(text) {
  const path = getLiteracyMockAudioV11Path(text) || getLedaProductionAudioPath(text);
  if (!path) throw new Error('Missing reviewed recording for ' + text);
  return path;
}

function revise(item, fields, operation, proof) {
  const updated = {...item, ...fields};
  const byId = new Map(updated.choices.map(choice => [choice.id, choice]));
  const requiredAudioCues = item.requiredAudioCues.map(cue => {
    if (cue.role === 'choice') {
      const choice = byId.get(cue.choiceId);
      if (!choice) throw new Error('Missing recorded response for ' + item.id);
      return {...cue, text:choice.label, value:choice.label, path:choice.audioPath};
    }
    const text = cue.role === 'instruction' ? updated.prompt : cue.role === 'passage' ? updated.passage : cue.text;
    return text !== cue.text ? {...cue, text, path:audio(text)} : cue;
  });
  const requiredImagePaths = [...new Set([updated.image, ...updated.choices.map(c => c.image)].filter(Boolean))];
  return {...updated, requiredAudioCues, requiredAudioPaths:[...new Set(requiredAudioCues.map(cue=>cue.path))],
    requiredImagePaths, mediaDecision:{...updated.mediaDecision, paths:requiredImagePaths},
    sourceProvenance:{...item.sourceProvenance, v15Review:{file:'src/data/literacyMockReviewedComprehension.js',operation}},
    taskDemand:{...updated.taskDemand, reviewed:true, proof:{...updated.taskDemand?.proof, ...proof}},
  };
}

function relabel(item, labels) {
  return item.choices.map(choice => {
    const label = labels[choice.id];
    if (!label || label === choice.label) return choice;
    const audioPath = choice.audioPath && (normalizeLedaAudioText(label) === normalizeLedaAudioText(choice.label) ? choice.audioPath : audio(label));
    return {...choice, label, ...(audioPath && {audioPath})};
  });
}
function lesson(item) {
  const parts = item.id.split('.');
  const slug = /^b[56]$/.test(parts.at(-2)) ? parts.at(-3) : parts.at(-2);
  const alternatives = lessonAlternatives[slug]?.split(' ').map(key=>contrasts[key]);
  if (!alternatives?.every(Boolean)) throw new Error('Unreviewed lesson: ' + item.id);
  const twoEpisodes = item.adaptiveAreaBand === 6;
  const labels = twoEpisodes ? {c3:alternatives[0]} : {c1:alternatives[0],c2:alternatives[1],c3:alternatives[2]};
  const choices = relabel(item,labels);
  const key = choices.find(choice=>choice.id===item.answer).label;
  const distractorRationales = {...item.distractorRationales};
  for (const [id,label] of Object.entries(labels)) {
    distractorRationales[id] = '“' + label + '” suggests a different solution. The repair in the story supports “' + key + '”.';
  }
  return revise(item,{choices,distractorRationales},'infer-supported-lesson',{
    supportedLesson:key, competingLessons:Object.values(labels),
    foils:choices.filter(c=>c.id!==item.answer).map(c=>distractorRationales[c.id]),
  });
}

const capPrompt = 'Which sentence uses capital letters correctly?';
const upper = word => word[0].toUpperCase() + word.slice(1);
const startWords = {
  'sentence-fix-easy-0':['The','They'], 'sentence-fix-easy-5':['The','We'],
  'sentence-fix-medium-3':['They','The'], 'sentence-fix-medium-9':['The','We'],
  'start-cap-1':['Some','They'], 'start-cap-2':['Please','Our'],
  'start-cap-3':['After','They'], 'start-cap-4':['Can','The'],
};
function capitalize(item) {
  const slug = item.id.split('.').at(-2);
  const form = startWords[slug];
  let passage = item.passage;
  let labels;
  if (form) {
    const [key, other] = form;
    // Two alternatives begin with capitals. Only one also completes the sentence.
    labels = {c0:key,c1:key.toLowerCase(),c2:other,c3:other.toLowerCase()};
  } else {
    const correct = item.choices.find(c=>c.id===item.answer).label;
    // A metalinguistic instruction that spells out a required proper name leaks the answer.
    // The four sentences themselves provide all the context a pupil needs.
    passage = '';
    const words = correct.split(' ');
    const firstLower = words[0][0].toLowerCase()+words[0].slice(1);
    const proper = words.findIndex((word,index)=> index>0 && /^[A-Z]/.test(word));
    const otherIndex = proper>0 ? proper : words.length-1;
    const other = words[otherIndex];
    const changeOther = proper>0 ? other[0].toLowerCase()+other.slice(1) : upper(other);
    const version = (initial,changed) => words.map((word,i) => i===0 ? initial : i===otherIndex && changed ? changeOther : word).join(' ');
    labels = {c0:correct,c1:version(firstLower,false),c2:version(words[0],true),c3:version(firstLower,true)};
  }
  const choices = relabel(item,labels);
  const distractorRationales = Object.fromEntries(choices.filter(c=>c.id!==item.answer).map(c=>[c.id,
    form ? 'Read the first word with the rest of the sentence and check its capital.' : 'Compare the sentence start, names, and common words with the capitalization in “'+labels.c0+'”.']));
  return revise(item,{choices,passage,prompt:form?item.prompt:capPrompt,distractorRationales,
    ...(!passage && item.passage && {canonicalPassageId:'',stimulusKey:'response-evidence:'+JSON.stringify(choices.map(c=>c.label))})},'capitalize-in-context',
    {retained:labels.c0,rejected:choices.filter(c=>c.id!==item.answer).map(c=>c.label)});
}

function sentenceTiles(item) {
  // The game scores word order. Printed letters and punctuation on loose word tiles
  // formerly gave away both end positions before the child considered the sentence.
  const labels = Object.fromEntries(item.choices.map(c=>[c.id,c.label.toLowerCase().replace(/[.!?]$/,'')]));
  // Both “rings loudly” and “loudly rings” are grammatical. Keep the same subject
  // with a complement whose position genuinely matters.
  if (item.answer.map(id=>labels[id]).join(' ')==='this bell rings loudly') Object.assign(labels,{c2:'needs',c3:'fixing'});
  const orderedWords = item.answer.map(id=>labels[id]);
  return revise(item,{choices:relabel(item,labels),explanation:upper(orderedWords.join(' '))+'.',
    stimulusKey:'response-evidence:'+JSON.stringify(orderedWords)},'assemble-word-order',{orderedWords});
}

function relevance(item) {
  const missing = item.choices.filter(c=>!item.passage.includes(c.label));
  if (!missing.length) return item;
  if (missing.length!==1 || missing[0].id===item.answer) throw new Error('Unreviewed paragraph: '+item.id);
  // This is the original fourth, on-topic detail. Put it in the actual paragraph
  // so every displayed candidate can genuinely be selected for removal.
  const detail = missing[0].label;
  const passage = item.passage+' '+detail;
  return revise(item,{passage,canonicalPassageId:passage.toLowerCase(),stimulusKey:passage.toLowerCase()},'edit-existing-paragraph',
    {sourceSentences:item.choices.map(c=>c.label),offTopic:item.choices.find(c=>c.id===item.answer).label});
}

// The first image matches the whole utterance. The second depicts the same
// object in another relation or action. A child cannot solve these by naming it.
// Source-target keys identify historical slots only. New exposure follows the evidence.
const sentenceScenes = {
  ball:['The ball is below the shelf.','ball-below-shelf','ball-between-boxes','book-on-shelf','shoe-under-stool'],
  apple:['We picked apples from the tree.','s:child-picks-apple','s:child-washes-apple','s:children-plant-tree','s:child-picks-up-pencil'],
  sun:['The sun is behind the cloud.','sun-behind-cloud','s:child-colours-sun','cat-behind-sofa','light-above-table'],
  bird:['The bird flies over the tree.','p:bird_above_tree','p:bear_behind_tree','eagle-over-mountain','p:plane_over_town'],
  fish:['The fish is in the bowl.','fish-in-bowl','fish-below-boat','pencils-in-cup','kitten-in-basket'],
  book:['The book is on the shelf.','book-on-shelf','p:cup_between_books','ball-below-shelf','hat-on-stool'],
  clock:['The child is behind the curtain.','p:child_behind_curtain','child-between-trees','p:bear_behind_tree','p:ball_on_chair'],
  banana:['The cat is inside the tent.','kitten-inside-tent','cat-behind-sofa','child-inside-bus','p:rain_through_tent_crack'],
  box:['The cat is behind the sofa.','cat-behind-sofa','kitten-in-basket','sun-behind-cloud','dog-next-to-bench'],
  key:['Open the gate.','s:child-opens-gate','s:child-shuts-gate','s:child-opens-book','s:child-opens-umbrella'],
  bear:['A frog jumped into the pond.','s:frog-jumps-into-pond','s:frog-sits-by-pond','s:frog-swims-away','s:cat-jumps-on-box'],
  basket:['The dog is in front of the house.','dog-in-front-of-house','dog-next-to-bench','flower-in-front-of-fence','p:bike_in_front_of_garage'],
  bench:['The lamp is beside the bed.','lamp-next-to-bed','light-above-table','dog-next-to-bench','hat-on-stool'],
  boot:['Put on boots.','s:child-puts-on-rain-boots','s:child-ties-shoes','s:child-puts-on-winter-hat','s:child-opens-umbrella'],
  cheese:['I kick the ball hard.','s:child-kicks-football','s:child-throws-ball','s:dog-chases-ball','s:football-enters-goal'],
  door:['Shut the gate.','s:child-shuts-gate','s:child-opens-gate','s:child-opens-book','s:child-zips-coat'],
  drum:['The hat is on the head.','hat-on-head','hat-on-stool','shoe-under-stool','scarf-on-chair'],
  elephant:['The balloon is above the child.','balloon-above-child','balloon-between-kites','child-between-trees','clock-above-picture'],
  face:['The child stands between two trees.','child-between-trees','child-inside-bus','balloon-between-kites','p:bear_behind_tree'],
  foot:['The dog was under the table.','p:dog_under_table','dog-in-front-of-house','football-under-table','p:slippers_under_bed'],
  glass:['Fill the cup with water.','s:child-fills-cup','s:child-drinks-water','s:child-puts-cup-in-sink','s:child-waters-seed'],
  grapes:['We wrap a small gift.','s:child-wraps-gift','s:child-gives-gift','s:child-ties-rubbish-bag','s:child-folds-paper-plane'],
  horse:['The flower is in front of the fence.','flower-in-front-of-fence','butterfly-among-flowers','dog-in-front-of-house','p:fence_around_garden'],
  milk:['Drink the water from the cup.','s:child-drinks-water','s:child-fills-cup','s:child-puts-cup-in-sink','s:child-eats-cereal'],
  nose:['The cup is beside the plate.','p:cup_next_to_plate','p:cup_between_books','p:shoes_near_door','p:rabbit_beside_basket'],
  shirt:['Put on the hat.','s:child-puts-on-winter-hat','s:child-adds-snowman-hat','s:child-puts-on-shirt','s:child-zips-coat'],
  train:['The train goes through the tunnel.','p:train_through_tunnel','l:train-on-bridge','p:bike_in_front_of_garage','p:horse_over_gate'],
  truck:['The fish is below the boat.','fish-below-boat','fish-in-bowl','ball-below-shelf','bridge-over-stream'],
  ladder:['I wash my hands with soap.','s:child-soaps-hands','s:child-wets-hands','s:child-washes-plate','s:child-dries-plate'],
  beach:['We make a tower with blocks.','s:child-stacks-tower','s:child-sets-blocks','s:child-builds-snowman-head','s:child-ties-gift-bow'],
  cookie:['Put in a bookmark.','s:child-adds-bookmark','s:child-opens-book','s:child-rolls-snowball','s:child-picks-up-pencil'],
  crayon:['Pick up the pencil.','s:child-picks-up-pencil','s:child-draws-star','s:child-picks-apple','s:child-finds-paper'],
  ruler:['Put the seed in the hole.','s:child-plants-seed','s:child-waters-seed','s:children-dig-hole','s:child-pours-cereal'],
  scissors:['The lamp is above the table.','light-above-table','lamp-next-to-bed','clock-above-picture','football-under-table'],
  lion:['The duck is outside the pond.','duck-outside-pond','duck-among-geese','kite-over-pond','ball-outside-basket'],
  tiger:['The ball is under the table.','football-under-table','ball-below-shelf','light-above-table','dog-next-to-bench'],
  zebra:['We brush our teeth.','s:child-brushes-teeth','s:child-brushes-dog','s:child-soaps-hands','s:child-bites-apple'],
  monkey:['Plant a new tree.','s:children-plant-tree','s:children-water-tree','s:child-plants-seed','s:children-dig-hole'],
};

const altLabels = {
  'p:dog_under_table':'dog under a table','p:child_behind_curtain':'child behind a curtain',
  's:child-sets-blocks':'child laying out blocks','s:child-ties-gift-bow':'child tying a bow on a gift',
  's:child-soaps-hands':'child rubbing soap on both hands','s:child-wets-hands':'child wetting hands under a tap',
  's:child-washes-plate':'child washing a plate','s:child-fills-cup':'child filling a cup',
  's:child-drinks-water':'child drinking from a cup','s:child-adds-milk':'child pouring milk',
  's:children-leave-school-bus':'children stepping off a bus','s:school-bus-stops':'bus at a stop',
};

function picture(code) {
  const [kind, name] = code.includes(':') ? code.split(':') : ['g',code];
  const base = {g:'assessment/grammar-scenes',p:'prepositions',s:'assessment/generated/sequencing',l:'assessment/literacy-classroom'}[kind];
  const image = '/images/'+base+'/'+name+(kind==='p'?'.png':'.webp');
  const label = altLabels[code] || name.replace(/[-_]/g,' ');
  return {label,image,imageAlt:label};
}
function scene(item) {
  const row = sentenceScenes[item.targetWord];
  if (!row) return {...item,adaptiveMixedEligible:false};
  const [passage,...codes] = row;
  const choices = item.choices.map(choice=>({id:choice.id,...picture(codes[Number(choice.id.slice(1))])}));
  const key = choices.find(c=>c.id===item.answer);
  const identity = 'mock-v15:scene:'+codes[0];
  const related = {
    's:child-opens-gate':'gate-action','s:child-shuts-gate':'gate-action',
    's:child-fills-cup':'water-cup','s:child-drinks-water':'water-cup',
    'fish-in-bowl':'fish-position','fish-below-boat':'fish-position',
    'light-above-table':'lamp-position','lamp-next-to-bed':'lamp-position',
    'kitten-inside-tent':'cat-position','cat-behind-sofa':'cat-position',
  };
  const family = related[codes[0]] ? 'mock-v15:scene-family:'+related[codes[0]] : identity;
  const competingScene = choices.find(c=>c.id==='c1').label;
  return revise(item,{choices,passage,targetWord:'',imageAlt:'',canonicalItemId:identity,canonicalPassageId:passage.toLowerCase(),
    exposureFamilyId:family,stimulusKey:passage.toLowerCase(),
    explanation:'The matching picture shows '+key.label+'.',
    mediaDecision:{type:'meaningful_existing_raster',reason:'Compare the pictured actions and relationships against the complete recording.'},
    distractorRationales:Object.fromEntries(choices.filter(c=>c.id!==item.answer).map(c=>[c.id,'This picture shows '+c.label+'. The recorded sentence describes '+key.label+'.'])),
    taskDemand:{operation:'find_spoken_referent',features:{spokenSentence:1,picturedScenes:4}},
  },'understand-spoken-scene',{sentence:passage,matchedScene:key.label,competingScene});
}

const secondUnsupportedDetail = {
  roots:'Gardeners choose plants for a new garden.', duck:'Frogs catch insects away from water.',
  worms:'People sort seeds before planting.',shadow:'A shadow changes the shape of a toy.',
  bees:'Bees visit roses and daisies.', backpack:'How lunchbox parts separate food and keep it inside.',
  'bus-stop':'How signs and staff help travellers find their trains.',
  lunchbox:'How deep sides and straps hold picnic things securely.',
  'library-returns':'How volunteers gather books and help visitors choose.',
  'weather-notebook':'How to pick seeds for a new flower bed.',
  'model-workshop':'How to fix a broken classroom toy.',
  'school-garden':'Gardeners choose plants for a new garden.',
  'drinking-station':'How helpers clean and sort materials for building.',
  'book-swap':'How returned books are checked in and sorted.',
  'station-information':'How an arrival board helps people plan their journey.',
  'lost-property':'How labelled tubs separate parcels for different classrooms.',
  'class-kitchen':'How rinsing empty tubs removes sticky food.',
  'playground-check':'How a leader counts walkers before the group leaves.',
  'evening-route':'How maps and helpers answer different visitors’ questions.',
  'school-deliveries':'How the office records and returns lost objects.',
  'costume-room':'How tickets guide families to their rows and seats.',
  'sports-centre':'How helpers answer questions about lessons and clubs.',
  'music-loans':'How returned books are checked in and sorted.',
  'walking-group':'How lamps reveal uneven ground on the arrival path.',
};
function pairedDetails(item) {
  const parts = item.id.split('.');
  const topic = parts.at(-2)==='b4' ? parts.at(-3) : parts.at(-2);
  if (!secondUnsupportedDetail[topic]) return item;
  const choices = relabel(item,{c0:secondUnsupportedDetail[topic]});
  const answer = ['c1','c2'];
  const supportingDetails = answer.map(id=>choices.find(c=>c.id===id).label);
  const unsupported = choices.filter(c=>!answer.includes(c.id));
  const prompt = 'Choose the two details that support the main idea.';
  return revise(item,{format:'multi_select',answerMode:'set',answer,selectCount:2,selectAllThatApply:false,prompt,choices,
    explanation:supportingDetails.join(' '),
    distractorRationales:Object.fromEntries(unsupported.map(c=>[c.id,'“'+c.label+'” introduces a detail outside the passage.'])),
    taskDemand:{...item.taskDemand,features:{requiredEvidenceParts:2,supportingDetailsToSelect:2}},
  },'select-two-supporting-details',{key:supportingDetails,foils:unsupported.map(c=>c.label),supportingDetails});
}

function orderEvents(item) {
  const chronology = item.taskDemand?.proof?.chronology;
  if (chronology?.length!==3 || !item.passage.includes(' At the end,')) return item;
  // Use a different question for some stories, consistently in both modalities.
  // Asking for the middle of the original four-event account would have two answers.
  const usesMiddle = [...chronology[0]].reduce((sum,c)=>sum+c.charCodeAt(0),0)%2===0;
  if (!usesMiddle) return item;
  const passage = item.passage.split(' At the end,')[0];
  const answer = item.choices.find(c=>c.label===chronology[1]).id;
  const foilReason = label => label===chronology[0] ? 'This happens before the middle event.'
    : label===chronology[2] ? 'This happens after the middle event.' : 'This event does not occur in the recorded or printed account.';
  const distractorRationales = Object.fromEntries(item.choices.filter(c=>c.id!==answer).map(c=>[c.id,foilReason(c.label)]));
  return revise(item,{passage,answer,prompt:'What happened in the middle?',explanation:chronology.join(' → '),
    canonicalPassageId:passage.toLowerCase(),stimulusKey:passage.toLowerCase(),distractorRationales,
    taskDemand:{...item.taskDemand,features:{temporalLinks:2,presentationConflicts:1,responseEvents:4},
      proof:{chronology}},
  },'recover-middle-event',{key:chronology[1],foils:Object.values(distractorRationales)});
}

// Rear-position and embedded clauses make finding a boundary different from
// counting a fixed number of words after the first comma. Each pair stands on
// its own; splitting at the conjunction would leave an incomplete thought.
const richerBoundaries = {
  'stop-detail-1':['the latch clicked','our dog woke when the door swung shut'],
  'stop-detail-2':['ice covered the puddle','we walked along the path that the farmer had cleared'],
  'stop-detail-3':['the mouse hid','the owl listened until the squeaking stopped'],
  'stop-detail-4':['the players gathered by the goal','everyone turned when the whistle blew'],
  'stop-detail-5':['the towel lay in a puddle','the swimmer chose one that was still dry'],
  'stop-detail-6':['the phone rang','the caller asked for the child who had found her dog'],
  'stop-detail-7':['rain soaked the tent','the bags stayed dry because we covered them'],
  'stop-detail-8':['the puppy curled up','its eyes closed while the child made its bed'],
  'stop-detail-9':['the rope broke','the worker tied on another before she lifted the bucket'],
  'exclaim-detail-1':['milk spread across the table','the child fetched a cloth before it reached the book'],
  'exclaim-detail-2':['the gardener brought water','a tiny shoot grew where she had planted the seed'],
  'exclaim-detail-3':['the string snapped','the kite drifted until its tail caught in a tree'],
  'exclaim-detail-4':['the bus stopped','the driver closed the door after the children got off'],
  'exclaim-detail-5':['the lamp went dark','the child found the torch that she kept by the bed'],
  'exclaim-detail-6':['the baby cried','her father rocked her until she fell asleep'],
  'exclaim-detail-7':['the ice began to melt','the worker emptied the tray before it could spill'],
  'exclaim-detail-8':['two pictures covered the table','the teacher hung them up after the paint dried'],
  'exclaim-detail-9':['the sheep left the field','the farmer shut the gate when the last lamb was through'],
};
function findBoundary(item) {
  const slug = item.id.split('.').at(-2);
  const replacement = richerBoundaries[slug];
  const edited = item.choices.find(c=>c.id===item.answer).label;
  const parts = edited.replace(/[.!?]$/,'').split(/\.\s+/);
  if (parts.length!==2) return item;
  const useTokens = replacement || [...parts[0]].reduce((sum,c)=>sum+c.charCodeAt(0),0)%2===0;
  if (!useTokens) return item;
  const sentences = replacement || parts.map(text=>text.toLowerCase());
  const passage = upper(sentences.join(' '));
  const choices = passage.split(/\s+/).map((label,tokenIndex)=>({id:'w'+tokenIndex,label,tokenIndex}));
  const last = sentences[0].split(/\s+/).length - 1;
  const answer = choices[last].id;
  const dependentClause = replacement ? replacement[1].match(/\b(when|that|until|because|who|while|before|where|after) .+$/)?.[0] : item.taskDemand?.dependentClause;
  const completeSentences = sentences.map(text=>upper(text)+'.');
  return revise(item,{format:'select_text',answerMode:'exact',passage,answer,choices,prompt:'Which word ends the first sentence?',
    displayPassageDuringResponse:true,explanation:completeSentences.join(' '),
    ...(replacement && {canonicalPassageId:passage.toLowerCase(),stimulusKey:passage.toLowerCase()}),
    distractorRationales:Object.fromEntries(choices.filter(c=>c.id!==answer).map(c=>[c.id,'The first complete sentence is “'+completeSentences[0]+'”'])),
    taskDemand:{operation:'locate_sentence_boundary',dependentClause:dependentClause || false,features:{completeClauses:2}},
  },'locate-sentence-boundary',{completeSentences,firstBoundaryIndex:last,dependentClause:dependentClause || false});
}

const ambiguousReadingPictures = new Set(['mock.v8.reading.0.mat.v11','mock.v8.reading.1.pup.v11','mock.v12.beginner-reading.1.run']);
export function reviewComprehensionItem(item) {
  if (!item.adaptiveMixedEligible || item.tutorialOnly) return item;
  const band = item.adaptiveAreaBand;
  if (item.domainId==='writing') {
    if (band===1 && item.skillId==='capitalization') return capitalize(item);
    if (band===2 && item.format==='order') return sentenceTiles(item);
    if ([3,5].includes(band) && item.prompt==='Which choice separates the two complete sentences?') return findBoundary(item);
    if (band===5 && item.prompt==='Which sentence belongs in a different paragraph?') return relevance(item);
    return item;
  }
  if (!['listening','reading'].includes(item.domainId)) return item;
  if (ambiguousReadingPictures.has(item.id)) return {...item,adaptiveMixedEligible:false};
  if (item.domainId==='listening' && band===1) return scene(item);
  if (band===3) return orderEvents(item);
  if (band===4 && item.taskDemand?.operation==='mostly_about_info') return pairedDetails(item);
  if (band>=5 && item.constructClaim?.endsWith('lesson_mistake_fixed')) return lesson(item);
  return item;
}

export function reviewedComprehensionBand(item) {
  const op = item.sourceProvenance?.v15Review?.operation;
  const proof = item.taskDemand?.proof;
  if (!op || !proof || !item.adaptiveMixedEligible) return null;
  const choices = item.choices;
  const key = choices.find(c=>c.id===item.answer)?.label;
  switch (op) {
    case 'understand-spoken-scene': {
      const row = Object.values(sentenceScenes).find(([line])=>line===item.passage);
      return row && !item.displayPassageDuringResponse && item.hideWrittenLabels && choices.length===4
        && item.requiredAudioCues.some(c=>c.role==='passage' && c.text===row[0] && c.path)
        && choices.every(c=>c.image===picture(row[1+Number(c.id.slice(1))]).image)
        && key===proof.matchedScene && proof.competingScene!==key ? 1 : null;
    }
    case 'capitalize-in-context':
      return choices.length===4 && new Set(choices.map(c=>c.label)).size===4 && key===proof.retained
        && choices.filter(c=>/^[A-Z]/.test(c.label)).length===2
        && !item.requiredAudioCues.some(c=>c.role==='choice' || c.role==='passage') ? 1 : null;
    case 'assemble-word-order':
      return item.format==='order' && item.answer.length===choices.length
        && choices.every(c=>/^[a-z]+$/.test(c.label))
        && item.answer.every((id,i)=>choices.find(c=>c.id===id)?.label===proof.orderedWords[i]) ? 2 : null;
    case 'locate-sentence-boundary': {
      if (item.format!=='select_text' || !item.displayPassageDuringResponse || proof.completeSentences?.length!==2) return null;
      const tokens = [...choices].sort((a,b)=>a.tokenIndex-b.tokenIndex);
      const cut = proof.firstBoundaryIndex;
      const normalized = s=>s.replace(/[.!?]$/,'').toLowerCase();
      if (tokens[cut]?.id!==item.answer || tokens.map(c=>c.label).join(' ')!==item.passage
        || normalized(tokens.slice(0,cut+1).map(c=>c.label).join(' '))!==normalized(proof.completeSentences[0])
        || normalized(tokens.slice(cut+1).map(c=>c.label).join(' '))!==normalized(proof.completeSentences[1])) return null;
      return proof.dependentClause && item.passage.toLowerCase().includes(proof.dependentClause.toLowerCase()) ? 5 : 3;
    }
    case 'recover-middle-event':
      return proof.chronology?.length===3 && key===proof.chronology[1] && !/at the end/i.test(item.passage)
        && /before|after/i.test(item.passage) && proof.chronology.every(label=>choices.some(c=>c.label===label))
        && item.prompt==='What happened in the middle?' ? 3 : null;
    case 'select-two-supporting-details':
      return item.format==='multi_select' && item.answerMode==='set' && item.selectCount===2 && item.answer?.length===2
        && new Set(proof.supportingDetails).size===2 && item.answer.every((id,i)=>choices.find(c=>c.id===id)?.label===proof.supportingDetails[i])
        && choices.filter(c=>!item.answer.includes(c.id)).every(c=>proof.foils.includes(c.label)) ? 4 : null;
    case 'edit-existing-paragraph':
      return key===proof.offTopic && choices.length===4 && choices.every(c=>item.passage.includes(c.label)) ? 5 : null;
    case 'infer-supported-lesson':
      if (key!==proof.supportedLesson || !proof.competingLessons.every(label=>choices.some(c=>c.label===label && c.id!==item.answer))) return null;
      if (proof.competingLessons.length===3 && item.taskDemand.features?.episodesToIntegrate===1) return 5;
      if (proof.competingLessons.length===1 && item.taskDemand.features?.episodesToIntegrate===2
        && item.taskDemand.features?.plausiblePartialLessons>=2 && ['c1','c2'].every(id=>item.distractorRationales[id])) return 6;
      return null;
    default: return null;
  }
}
