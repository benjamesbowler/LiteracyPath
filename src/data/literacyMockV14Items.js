import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

export const LITERACY_MOCK_V14_ORIGINAL_SOURCE = 'src/data/literacyMockV14Items.js';
const domainGroups = {phonics:'foundations', print:'foundations', reading:'comprehension', vocabulary:'vocabulary'};

function original(id, domainId, skillId, band, prompt, format, labels, correct, operation, requires, extras = {}) {
  const path = getLedaInstructionAudioPath(prompt);
  if (!path) throw Error('Missing exact recorded direction: ' + prompt);
  const choices = labels.map((label,i)=>({id:'c'+i,label}));
  const answerMode = format==='multi_select' ? 'set' : 'exact';
  const answer = format==='build_word' ? correct : Array.isArray(correct) ? correct.map(i=>choices[i].id) : choices[correct].id;
  const requiredAudioCues = [{role:'instruction',text:prompt,path,required:true},...(extras.requiredAudioCues || [])];
  if (requiredAudioCues.some(c=>!c.path)) throw Error('Missing audio: '+id);
  const fullId = 'mock.v14.' + id;
  const item = {
    id:fullId,canonicalItemId:fullId,sourceItemId:fullId,sourceFormat:format,domainId,mapDomainId:domainGroups[domainId],skillId,
    format,answerMode,answer,choices,prompt,passage:'',targetWord:'',renderTargetText:false,image:'',imageAlt:'',
    modality:'reading',evidenceModality:'text',displayPassageDuringResponse:true,hideWrittenLabels:false,tutorialOnly:false,
    level:band<3 ? 1 : 2,adaptiveAreaBand:band,adaptiveAreaVersion:'areas-v6',adaptiveMixedEligible:true,mediaReady:true,
    constructClaim:operation,adaptiveDemand:{operation,requires},difficultyEvidence:requires,
    stimulusKey:extras.passage || fullId,exposureFamilyId:'source-item:'+fullId,
    sourceProvenance:{kind:'original_literacy_guide',file:LITERACY_MOCK_V14_ORIGINAL_SOURCE,sourceId:fullId},
    requiredImagePaths:[],mediaDecision:{role:'text-only',paths:[],constructReview:'approved',answerNeutral:'not-applicable: printed evidence',reason:'The pupil independently reads the printed evidence.'},
    ...extras, requiredAudioCues, requiredAudioPaths:[...new Set(requiredAudioCues.map(c=>c.path))],
  };
  if (item.passage) item.canonicalPassageId = item.passage.toLowerCase();
  if (format==='multi_select') {
    item.selectAllThatApply=true;
    item.selectCount=answer.length;
  }
  return item;
}

// Every animal in the choices appears in the passage. Answering requires
// reading what each animal does, rather than guessing which animals can swim.
const swimming = [
  ['pond-rail','The frog and the duck swam past the rail. The goose stood on a rock. The turtle sat on a log.', ['goose','duck','turtle','frog'],[1,3]],
  ['river-bend','At the river bend, a seal swam after a fish. The fish swam under a boat. A gull and a crab stayed on the sand.', ['seal','gull','fish','crab'],[0,2]],
  ['at-the-bridge','A swan swam under the bridge. A dog swam beside it. A duck swam behind them. A frog sat on the bank.', ['dog','frog','duck','swan'],[0,2,3]],
  ['lily-pad','A fish swam under a lily pad. A frog swam over to the pad. A bee rested on the flower and a bird sat on a twig.', ['bee','bird','fish','frog'],[2,3]],
  ['island','A rat swam to the island. A duck slept on the shore. A turtle swam away from the island. A snail rested on a stone.', ['turtle','duck','rat','snail'],[0,2]],
  ['pool','The penguin stood on the ice. The otter, seal, and duck swam from one end of the pool to the other.', ['penguin','seal','duck','otter'],[1,2,3]],
];

const sequences = [
  ['paper-kite','Before she tied on the tail, Pia folded the paper. Once the tail was on, she took the kite outside.','What happened first?',['Pia tied on the tail.','Pia folded the paper.','Pia took the kite outside.','Pia flew the kite.'],1],
  ['chick','After the chick pecked a hole, it pushed its head out. It rested before it stepped out of the shell.','What happened last?',['It rested.','It pecked a hole.','It stepped out of the shell.','It pushed its head out.'],2],
  ['berry-ink','Sol crushed berries before he added water. He stirred the mixture and used it to paint a dot.','What happened first?',['Sol added water.','Sol painted a dot.','Sol stirred the mixture.','Sol crushed berries.'],3],
  ['coat-hook','Mae found a button after she hung up her wet coat. She put the button in a cup before she dried the floor.','What happened last?',['Mae dried the floor.','Mae hung up her coat.','Mae found a button.','Mae put the button in a cup.'],0],
  ['little-boat','Before Amir set his boat in the water, he fixed its sail. The boat floated across the tub. He lifted it out on the other side.','What happened first?',['Amir lifted the boat out.','Amir set the boat in the water.','Amir fixed its sail.','The boat floated across the tub.'],2],
  ['roof-drip','The roof dripped on a stool. After moving the stool, Len fetched a bucket. Then he placed the bucket under the drip.','What happened last?',['Len fetched a bucket.','The roof dripped on a stool.','Len moved the stool.','Len put the bucket under the drip.'],3],
];

const mainIdeas = [
  ['nest-material','A robin carried dry grass to a branch. It pressed mud around the grass. Then it tucked soft strands inside for its eggs.','How a robin builds a nest.',['Where a robin carries dry grass.','How a robin builds a nest.','How mud holds grass in place.','What lines a nest for eggs.']],
  ['labels','One drawer holds buttons. Another holds string. We drew a button on the first drawer and a coil of string on the other. Now everyone can find what they need.','Pictures help people find supplies.',['String goes inside a drawer.','String makes a coil when it is wound.','Pictures help people find supplies.','One drawer has a button on its label.']],
  ['dune-grass','Wind pushes loose sand along the beach. On the dune, long grass roots hold the sand in place. Even after a windy day, the grassy dune is still there.','Grass helps a sand dune stay in place.',['Grass helps a sand dune stay in place.','Wind blows loose sand along the beach.','Grass has long roots under the sand.','The dune is still there after one windy day.']],
  ['drum-messages','At rehearsal, one drum beat means stop. Two quick beats mean turn. When the drums go quiet, the dancers wait for the next signal.','The dancers follow signals from the drums.',['Two quick beats tell the dancers to turn.','One drum beat means stop.','The dancers wait when the drumming stops.','The dancers follow signals from the drums.']],
  ['seed-travel','Burrs cling to a fox as it walks. Winged seeds spin away in the wind. Other seeds float down a stream. Each can start a plant far from the parent plant.','Seeds travel to new places in several ways.',['Moving water carries seeds downstream.','Seeds travel to new places in several ways.','Winged seeds spin in the wind.','Burrs can hold on to fur.']],
  ['safe-crossing','A sign asks drivers to slow down by the pond. A low fence keeps frogs off the road. A tunnel under the road lets them reach the water.','People made a safer path for frogs.',['Drivers slow down near the pond.','A fence keeps frogs away from cars.','People made a safer path for frogs.','A tunnel runs under the road.']],
];

// All three graphemes must be supplied for CVCs. The next demand adds a
// consonant cluster; silent-e, digraph and dialect-dependent targets are excluded.
const dictations = [
  ['rag','p e'],['yam','n u'],['lad','b i'],['vet','f a'],['dim','t o'],['rug','b a'],['fib','p e'],['jog','d u'],
  ['vest','f a'],['twin','d e'],['nest','m i'],['snip','t a'],['help','b i'],['spun','t o'],['trim','p a'],['bent','d i'],['kept','g o'],['fist','p e'],['best','p u'],
];

const wordBoundaries = [
  ['mitt','A red mitt fell. We picked it up.'], ['sand','We dug in the sand. The tide came in.'],
  ['pears','Can you reach the pears? I can get a stool.'],['bell','When does the bell ring? We are ready.'],
  ['quiet','Please keep quiet. The baby is asleep.'],['rope','Who needs this rope? We can tie the boat.'],
];

const categories = [
  ['tool','Choose all the tools.',['hammer','pear','saw','tiger'],[0,2]],
  ['tool','Choose all the tools.',['rabbit','ruler','banana','scissors'],[1,3]],
  ['tool','Choose all the tools.',['wrench','apple','broom','hammer'],[0,2,3]],
  ['living','Choose all the living things that grow.',['tree','bell','goat','clock'],[0,2]],
  ['living','Choose all the living things that grow.',['boat','frog','bee','horse'],[1,2,3]],
  ['living','Choose all the living things that grow.',['snake','tiger','chair','shoe'],[0,1]],
];

export function newLiteracyMockV14Items(pictures) {
  const items=[];
  for (const [slug,passage,labels,keys] of swimming) {
    items.push(original('read.'+slug,'reading','key_details',2,'Choose all the animals swimming in this story.','multi_select',labels,keys,
      'retrieve_printed_details','Read the account and identify every swimmer, separating the actions of named animals.',
      {passage,exposureFamilyId:'reading:swimming-animals',explanation:labels.filter((_,i)=>keys.includes(i)).join(' and ')+' swam. The other named animals stayed out of the water.'}));
  }
  for (const [slug,passage,prompt,labels,key] of sequences) {
    items.push(original('read.'+slug,'reading','sequencing',3,prompt,'choice',labels,key,'order_printed_events',
      'Use time words to recover the sequence of at least three events.',{passage,explanation:labels[key]}));
  }
  for (const [slug,passage,answer,labels] of mainIdeas) {
    items.push(original('read.'+slug,'reading','main_idea',4,'What is this passage mostly about?','choice',labels,labels.indexOf(answer),
      'integrate_printed_details','Combine details across sentences to identify the idea that covers the whole passage.',{passage,explanation:answer}));
  }
  for (const [word,foilLetters] of dictations) {
    const units=[...word],band=units.length===3 ? 2 : 3;
    const labels=[...units,...foilLetters.split(' ')];
    items.push(original('spell.'+word,'phonics','cvc_short_vowels',band,'Build the word you hear.','build_word',labels,word,
      band===2 ? 'encode_cvc' : 'encode_consonant_blend',
      'Represent each of the '+units.length+' phonemes of the dictated word with its ordered grapheme.',{
        targetWord:word,alphabetSpelling:true,responseLength:units.length,modality:'recognition',evidenceModality:'audio+print',
        stimulusKey:word,canonicalPassageId:word,exposureFamilyId:'mock-foundation-word:'+word,
        mediaDecision:{role:'audio-and-print',paths:[],constructReview:'approved',reason:'An exact spoken target supplies the word. Its letters are the response.'},
        requiredAudioCues:[{role:'target_word',text:word,path:getLedaWordAudioPath(word),required:true}],
        explanation:'The letters in '+word+' are '+units.join(', ')+'.',
      }));
  }
  for (const [slug,passage] of wordBoundaries) {
    const labels=passage.split(' '),key=labels.findIndex(word=>/[.!?]$/.test(word));
    const item=original('print.'+slug,'print','print_concepts',4,'Which word ends the first sentence?','select_text',labels,key,'locate_sentence_boundary',
      'Distinguish a boundary inside a two-sentence passage from the end of the whole passage.',{passage,explanation:labels[key]+' ends the first sentence.'});
    item.choices=item.choices.map((c,tokenIndex)=>({...c,tokenIndex}));
    items.push(item);
  }
  for (const [category,prompt,labels,keys] of categories) {
    const item=original('sort.'+labels.join('-'),'vocabulary','picture_vocabulary',2,prompt,'multi_select',labels,keys,
      'classify_related_referents','Recognize each pictured referent and apply a shared category rule across the full set.',{
        modality:'listening',evidenceModality:'audio+image',hideWrittenLabels:true,
        explanation:labels.filter((_,i)=>keys.includes(i)).join(', ')+' belong to the requested group.',
      });
    item.choices=item.choices.map(c=>{
      if (!pictures.has(c.label)) throw Error('Missing exact category image: '+c.label);
      return {...c,...pictures.get(c.label)};
    });
    item.requiredImagePaths=item.choices.map(c=>c.image);
    item.mediaDecision={role:'answer-cards',paths:item.requiredImagePaths,constructReview:'approved',answerNeutral:'not-applicable-scoring-options',reason:'Separate existing illustrated choices supply each named referent.'};
    item.exposureFamilyId='category:'+category;
    items.push(item);
  }
  return items;
}
