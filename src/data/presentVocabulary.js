import { PRESENT_NARRATION_AUDIO, PRESENT_NARRATION_METADATA } from "./generated/presentNarration.generated.js";
import { normalizeLedaAudioText } from "./normalizeLedaAudioText.js";
import { getChildWordAsset } from "./childAssets.js";
// Picture-supported shared reading for every Present cycle. Adults support
// untaught code. Each short caption refers to the mapped shared word artwork.
export const PRESENT_VOCABULARY = {
  1: [
    { word: "apple", sentence: "An apple is a fruit." },
    { word: "map", sentence: "This is a map." }
  ],
  2: [
    { word: "tent", sentence: "This is a tent." },
    { word: "sock", sentence: "I put a sock on my foot." }
  ],
  3: [
    { word: "nest", sentence: "A bird has a nest." },
    { word: "igloo", sentence: "An igloo is made of snow." }
  ],
  4: [
    { word: "fan", sentence: "A fan moves air." },
    { word: "dog", sentence: "This is a dog." }
  ],
  5: [
    { word: "octopus", sentence: "An octopus has eight arms." },
    { word: "log", sentence: "This is a log." }
  ],
  6: [
    { word: "rug", sentence: "A rug goes on the floor." },
    { word: "hen", sentence: "This is a hen." }
  ],
  7: [
    { word: "mouse", sentence: "A mouse is small." },
    { word: "lamp", sentence: "A lamp gives us light." }
  ],
  8: [
    { word: "bag", sentence: "This is a bag." },
    { word: "web", sentence: "A spider makes a web." }
  ],
  9: [
    { word: "quilt", sentence: "A quilt keeps us warm." },
    { word: "umbrella", sentence: "An umbrella keeps rain off." }
  ],
  10: [
    { word: "cup", sentence: "I can drink from a cup." },
    { word: "goat", sentence: "This is a goat." }
  ],
  11: [
    { word: "pan", sentence: "This is a pan." },
    { word: "box", sentence: "I can put things in a box." }
  ],
  12: [
    { word: "egg", sentence: "An egg has a shell." },
    { word: "vest", sentence: "This vest has no sleeves." }
  ],
  13: [
    { word: "kite", sentence: "A kite flies in the wind." },
    { word: "jug", sentence: "I can pour from a jug." }
  ],
  14: [
    { word: "van", sentence: "A van has wheels." },
    { word: "jump", sentence: "I can jump." }
  ],
  15: [
    { word: "shell", sentence: "This is a shell." },
    { word: "chair", sentence: "I can sit on a chair." }
  ],
  16: [
    { word: "ball", sentence: "I can roll a ball." },
    { word: "call", sentence: "I can call on a phone." }
  ],
  17: [
    { word: "ink", sentence: "I can write with ink." },
    { word: "pig", sentence: "This is a pig." }
  ],
  18: [
    { word: "ox", sentence: "An ox is a big animal." },
    { word: "pot", sentence: "This is a pot." }
  ],
  19: [
    { word: "sun", sentence: "The sun gives us light." },
    { word: "under", sentence: "The cat is under the table." }
  ],
  20: [
    { word: "net", sentence: "This is a net." },
    { word: "elephant", sentence: "An elephant has a trunk." }
  ],
  21: [
    { word: "whale", sentence: "A whale lives in water." },
    { word: "wheel", sentence: "A wheel can turn." }
  ],
  22: [
    { word: "sink", sentence: "This is a sink." },
    { word: "pink", sentence: "The paint is pink." }
  ],
  23: [
    { word: "ring", sentence: "A ring goes on a finger." },
    { word: "sing", sentence: "I can sing." }
  ],
  24: [
    { word: "bell", sentence: "A bell can ring." },
    { word: "dress", sentence: "This is a dress." }
  ],
  25: [
    { word: "day", sentence: "It is day." },
    { word: "stay", sentence: "The dog can stay." }
  ],
  26: [
    { word: "cry", sentence: "People can cry." },
    { word: "shy", sentence: "People can feel shy." }
  ],
  27: [
    { word: "song", sentence: "We can sing a song." },
    { word: "long", sentence: "The snake is long." }
  ]
};

// Mini-lessons are authored by meaning. Existing isolated-object pictures are
// labelled vocabulary support unless a proposition scene was actually inspected.
const MEANING_ROWS = [
 ['apple','A round fruit that grows on a tree.','We eat an apple.','A stone is not an apple.','Pretend to bite crunchy fruit.','What fruit grows on a tree?'],
 ['map','A picture that shows where places are.','Use a map to find a road.','A story picture without places is not a map.','Point to a pretend route.','What helps us find places?'],
 ['tent','A cloth shelter people can sleep in.','Campers sleep in a tent.','A brick house is not a tent.','Make a roof with your hands.','What cloth shelter could we camp in?'],
 ['sock','Clothing that covers a foot.','A sock goes inside a shoe.','A glove covers a hand.','Point to your ankle.','What clothing covers a foot?'],
 ['nest','A place a bird builds for eggs or young.','A bird rests in its nest.','A dog bed is not a bird nest.','Cup your hands.','Where can a bird keep its eggs?'],
 ['igloo','A shelter built from blocks of snow.','Snow blocks form an igloo.','A sandcastle is not an igloo.','Make a dome with your arms.','What shelter is made of snow blocks?'],
 ['fan','A tool that moves air.','A fan helps us feel cool.','A lamp makes light, not a breeze.','Wave a hand beside your face.','What tool moves air?'],
 ['dog','An animal often kept as a pet.','A dog can wag its tail.','A hen is a bird, not a dog.','Mime wagging a tail.','What pet can wag its tail and bark?'],
 ['octopus','A sea animal with eight arms.','An octopus swims in the sea.','A fish has fins, not eight arms.','Wiggle fingers like arms.','Which sea animal has eight arms?'],
 ['log','A thick piece of a tree trunk.','A fallen log lies on the ground.','A small leaf is not a log.','Stretch arms along a pretend log.','What thick piece comes from a tree trunk?'],
 ['rug','A floor covering smaller than the whole floor.','A rug lies by the bed.','A blanket on a bed is not a floor rug.','Point down at the floor.','What soft covering lies on the floor?'],
 ['hen','An adult female chicken.','A hen can lay eggs.','A duck is a different bird.','Fold arms like wings.','Which chicken can lay eggs?'],
 ['mouse','A small animal with a long thin tail.','A mouse can hide in a small hole.','An elephant is much larger.','Make tiny steps with fingers.','What small animal has a thin tail?'],
 ['lamp','A thing that gives light.','Turn on a lamp to read.','A cup does not give light.','Open fingers like light rays.','What can give us light indoors?'],
 ['bag','A container used to carry things.','Put a book in a bag.','A flat plate does not close around books.','Mime lifting bag handles.','What can carry your books?'],
 ['web','Threads a spider makes.','A spider catches insects in a web.','A bird nest is not a spider web.','Spread fingers like threads.','What does a spider make?'],
 ['quilt','A warm cover made from stitched pieces.','Sleep under a quilt.','An umbrella is not a bed cover.','Mime pulling a cover up.','What stitched cover keeps us warm?'],
 ['umbrella','A cover held above us to keep off rain.','Open an umbrella in rain.','A cup catches water but does not cover us.','Hold a pretend handle overhead.','What can keep rain off your head?'],
 ['cup','A small container to drink from.','Drink water from a cup.','A sock cannot hold a drink safely.','Mime drinking.','What can we drink from?'],
 ['goat','A farm animal with hooves, often horns.','A goat eats plants.','A hen has feathers, not hooves.','Make horns with fingers.','Which farm animal often has horns and hooves?'],
 ['pan','A container used to cook food.','Cook an egg in a pan.','A hat is not for cooking.','Mime holding a pan handle.','What can we cook an egg in?'],
 ['box','A container with flat sides.','Put toys in a box.','A loose rug is not a container.','Outline a square with hands.','What flat-sided container can hold toys?'],
 ['egg','A round or oval thing laid by a bird.','A chick can hatch from an egg.','A ball does not hatch.','Cup an imaginary egg gently.','What can a chick hatch from?'],
 ['vest','Clothing for the body with no sleeves.','Wear a vest over a shirt.','A coat with sleeves is not this vest.','Point to bare upper arms.','Which clothing has no sleeves?'],
 ['kite','A light object flown on a string in wind.','A kite flies above the park.','A paper on a desk is not flying on a string.','Hold a string and look up.','What can fly on a string?'],
 ['jug','A container with a handle for pouring.','Pour water from a jug.','A flat plate is not for pouring water.','Mime tilting a jug.','What can you pour water from?'],
 ['van','A road vehicle that carries people or things.','A van carries boxes.','A boat travels on water.','Mime steering a wheel.','What road vehicle can carry many boxes?'],
 ['jump','Push off so both feet leave the ground.','Jump over a small line.','Walking keeps one foot on the ground.','Lift two fingers together; seated option.','What movement takes both feet off the ground?'],
 ['shell','A hard outer covering of some animals.','A snail has a shell.','Soft fur is not a shell.','Curve hands around a pretend snail.','What hard covering can protect a snail?'],
 ['chair','A seat for one person, usually with a back.','Sit on a chair.','A table is for placing things.','Point to your seat.','What seat has a back?'],
 ['ball','A round object used in games.','Roll a ball across the floor.','A box has corners.','Make a circle with hands.','What round object can we roll?'],
 ['call','Speak to someone, sometimes using a phone.','Call a friend on a phone.','Silent looking is not calling.','Hold a pretend phone.','What can we do to talk by phone?'],
 ['ink','Coloured liquid used for writing or printing.','A pen writes with ink.','A pencil uses a solid lead, not ink.','Mime writing with a pen.','What liquid does a pen use?'],
 ['pig','A farm animal with a snout.','A pig roots in soil with its snout.','A goat has a different nose.','Point to a pretend snout.','Which farm animal has a snout?'],
 ['ox','A large farm animal used to pull heavy loads.','An ox can pull a cart.','A mouse is not a large farm animal.','Mime pulling with both hands.','What large farm animal can pull a cart?'],
 ['pot','A container used for cooking or growing plants.','A plant grows in a pot.','A flat mat is not a pot.','Curve hands around a pot.','What can hold soil for a plant?'],
 ['sun','The star that gives Earth light and warmth.','Sunlight warms the ground.','A lamp is made by people.','Open arms like rays.','What gives Earth light in the daytime?'],
 ['under','Below something.','Put a toy under a chair.','A toy on top is not under it.','Put one hand below the other.','Put your hand below the desk: where is it?'],
 ['net','Threads joined with spaces between them.','Catch a ball in a net.','A solid wall has no net spaces.','Spread fingers like a mesh.','What mesh can catch a ball?'],
 ['elephant','A very large animal with a trunk.','An elephant uses its trunk to pick things up.','A dog has no trunk.','Swing an arm like a trunk.','Which large animal has a trunk?'],
 ['whale','A large sea mammal that breathes air.','A whale rises to breathe.','A fish breathes through gills.','Make a whale spout with hands.','Which sea mammal comes up to breathe?'],
 ['wheel','A round part that turns to help things move.','A van moves on wheels.','A fixed square block cannot roll smoothly.','Turn hands around in a circle.','What round part helps a van move?'],
 ['sink','A basin where we wash with water.','Wash hands in a sink.','A bed is not for washing hands.','Mime washing hands.','Where can we wash our hands?'],
 ['pink','A pale reddish colour.','This paint is pink.','Blue paint is not pink.','Point to the pink colour.','Find the pale reddish colour.'],
 ['ring','A small circle worn on a finger.','Wear a ring on a finger.','A necklace goes around a neck.','Touch a finger.','What small circle can go on a finger?'],
 ['sing','Use your voice to make a tune.','Sing a song with a friend.','Speaking without a tune is not singing.','Mime singing; do not require sound.','What do you do with your voice to make a tune?'],
 ['bell','An object that rings when struck or shaken.','A bell rings to get attention.','A soft pillow does not ring.','Mime shaking a bell.','What object can make a ringing sound?'],
 ['dress','A piece of clothing with a skirt attached.','Wear a dress.','Separate trousers are not a dress.','Outline a skirt with hands.','Which clothing has an attached skirt?'],
 ['day','The time when the sun lights our sky.','We see daylight in the day.','A dark night is not daytime.','Open hands like a sunrise.','What is the light part between nights?'],
 ['stay','Remain in the same place.','The dog can stay by the door.','Running away is not staying.','Hold palms still.','What does a dog do when it remains here?'],
 ['cry','Have tears, sometimes when sad or hurt.','A child may cry after a fall.','Smiling while playing is not evidence of crying.','Trace a pretend tear down a cheek.','What might someone do when tears come?'],
 ['shy','Feeling unsure about meeting or speaking to people.','Someone may feel shy in a new group.','Quietness alone does not prove shyness.','Hold a hand near the chest, with no required expression.','What feeling might someone have in a new group?'],
 ['song','Words and music people can sing.','We sing a song together.','A spoken shopping list is not a song.','Mime singing a tune.','What has words and a tune to sing?'],
 ['long','Reaching a large distance from end to end.','A snake can be long.','A short stub is not long.','Spread hands far apart.','Show a large distance from end to end.']
];
const MEANING=Object.fromEntries(MEANING_ROWS.map(([word,definition,example,nonExample,gesture,retrievalCue])=>[word,{definition,example,nonExample,gesture,retrievalCue,answer:word}]));
// Caption questions target what the exact sentence says, separately from the
// vocabulary-name retrieval cue. Alternatives describe acceptable oral/acted
// meanings; the teacher samples the response rather than scoring button clicks.
const CAPTION_MEANING_ROWS = [
 ['apple','What kind of food is an apple?',['a fruit','fruit']],
 ['map','What is this?',['a map','map']],
 ['tent','What is this?',['a tent','tent']],
 ['sock','Where do I put the sock?',['on my foot','on a foot','foot']],
 ['nest','What does the bird have?',['a nest','nest']],
 ['igloo','What is an igloo made of?',['snow','blocks of snow']],
 ['fan','What does a fan move?',['air']],
 ['dog','What is this?',['a dog','dog']],
 ['octopus','How many arms does an octopus have?',['eight','eight arms','8']],
 ['log','What is this?',['a log','log']],
 ['rug','Where does a rug go?',['on the floor','the floor','floor']],
 ['hen','What is this?',['a hen','hen']],
 ['mouse','What does the sentence tell us about the mouse?',['It is small.','small']],
 ['lamp','What does a lamp give us?',['light']],
 ['bag','What is this?',['a bag','bag']],
 ['web','What does a spider make?',['a web','web']],
 ['quilt','How does a quilt help us?',['It keeps us warm.','keeps us warm','warm']],
 ['umbrella','What does an umbrella keep off?',['rain','the rain']],
 ['cup','What can I do with a cup?',['drink from it','drink']],
 ['goat','What is this?',['a goat','goat']],
 ['pan','What is this?',['a pan','pan']],
 ['box','What can I put in a box?',['things','objects','toys']],
 ['egg','What does an egg have?',['a shell','shell']],
 ['vest','What does this vest NOT have?',['sleeves','no sleeves']],
 ['kite','What makes the kite fly in this sentence?',['the wind','wind']],
 ['jug','What can I do with a jug?',['pour from it','pour']],
 ['van','What does a van have?',['wheels']],
 ['jump','What can I do? Show the movement or say it.',['jump','I can jump.','a jump gesture']],
 ['shell','What is this?',['a shell','shell']],
 ['chair','What can I do on a chair?',['sit','sit on it']],
 ['ball','What can I do with a ball?',['roll it','roll']],
 ['call','What can I use to call?',['a phone','phone']],
 ['ink','What can I write with?',['ink']],
 ['pig','What is this?',['a pig','pig']],
 ['ox','What kind of animal is an ox in this sentence?',['a big animal','big','a large animal']],
 ['pot','What is this?',['a pot','pot']],
 ['sun','What does the sun give us?',['light']],
 ['under','Where is the cat?',['under the table','below the table']],
 ['net','What is this?',['a net','net']],
 ['elephant','What does an elephant have?',['a trunk','trunk']],
 ['whale','Where does a whale live?',['in water','water','the sea']],
 ['wheel','What can a wheel do? Show or say it.',['turn','a turning gesture']],
 ['sink','What is this?',['a sink','sink']],
 ['pink','What colour is the paint?',['pink']],
 ['ring','Where does a ring go?',['on a finger','a finger','finger']],
 ['sing','What can I do with my voice in this sentence?',['sing','I can sing.']],
 ['bell','What can a bell do?',['ring','make a ringing sound']],
 ['dress','What is this?',['a dress','dress']],
 ['day','Is this sentence about day or night?',['day','It is day.']],
 ['stay','What can the dog do?',['stay','remain in the same place']],
 ['cry','What can people do?',['cry','have tears']],
 ['shy','How can people feel?',['shy','They can feel shy.']],
 ['song','What can we sing?',['a song','song']],
 ['long','What does the sentence tell us about the snake?',['It is long.','long']]
];
export const PRESENT_CAPTION_MEANING=Object.fromEntries(CAPTION_MEANING_ROWS.map(([word,question,acceptedResponses])=>[word,{question,acceptedResponses}]));
const EXACT_SENTENCE_AUDIO={
 'An apple is a fruit.':'/audio/production/en-US/guided_page/an-apple-is-a-fruit-39fe64c23d.mp3',
 'This is a map.':'/audio/production/en-US/instruction/this-is-a-map-565e9bf4b8.mp3',
 'This is a dog.':'/audio/production/en-US/instruction/this-is-a-dog-ad588aad85.mp3',
 'The snake is long.':'/audio/production/en-US/assessment_passage/the-snake-is-long-3f850d3a33.mp3'
};
function sentenceMedia(sentence) {
 const key=normalizeLedaAudioText(sentence);
 const metadata=PRESENT_NARRATION_METADATA[key]||null;
 const audioPath=PRESENT_NARRATION_AUDIO[key]||EXACT_SENTENCE_AUDIO[sentence]||'';
 const humanListening=metadata?.humanListening||'unknown';
 const reviewState=audioPath?`recording-resolved-human-listening-${humanListening}`:'unavailable';
 return {audioPath,audioReviewState:reviewState,mediaGap:audioPath?'':`Exact natural sentence recording required: ${sentence}`,metadata,humanListening};
}
const VERIFIED_PROPOSITION_WORDS=new Set(['under','pink','call','stay','sing','cry','song']);
const SCENE_REQUIREMENTS={
 sock:'A person putting a sock onto a foot.',nest:'A bird with its nest.',igloo:'An igloo visibly built from snow blocks.',fan:'A fan with a meaningful air-motion cue.',octopus:'An octopus with all eight arms visible.',rug:'A rug on the floor.',mouse:'A mouse beside a familiar scale reference.',lamp:'A lamp emitting light.',web:'A spider with its web.',quilt:'A person warm under a quilt.',umbrella:'An umbrella shielding someone from rain.',cup:'A person drinking from a cup.',box:'A person putting objects into a box.',egg:'An egg with its shell visible.',vest:'A vest with clearly absent sleeves.',kite:'A kite flying on a string in wind.',jug:'A person pouring liquid from a jug.',van:'A van with visible wheels.',jump:'A person with both feet airborne.',chair:'A person sitting on a chair.',ball:'A person rolling a ball.',call:'A person using a phone to speak.',ink:'A person writing with an ink pen.',ox:'An ox with a clear scale reference.',sun:'Sunlight reaching the ground.',under:'A cat below a table; both cat and table visible.',elephant:'An elephant with a visible trunk.',whale:'A whale in water.',wheel:'A wheel with a meaningful turning cue.',pink:'Pink paint clearly visible.',ring:'A ring worn on a finger.',sing:'A person singing into a microphone.',bell:'A bell with a meaningful ringing cue.',day:'A daylight scene.',stay:'A dog remaining in place.',cry:'A person with visible tears; no smiling-play substitute.',shy:'A person in a new social group; adult labels the possible feeling without inferring it from appearance.',song:'A person singing; teacher and class supply the plural we in the caption through shared singing.',long:'A snake with its full length clearly visible.'
};
for(const [cycleNumber,cards] of Object.entries(PRESENT_VOCABULARY)) for(const card of cards){
 const meaning=MEANING[card.word];
 const captionMeaning=PRESENT_CAPTION_MEANING[card.word];
 const sentenceAudio=sentenceMedia(card.sentence);
 const {audioPath}=sentenceAudio;
 Object.assign(card,{id:`present-c${cycleNumber}-${card.word}`,readingPurpose:'supported-shared-reading',allowedSupport:['teacher-natural-sentence-model','word-tracking','picture-vocabulary','gesture'],childReadingClaim:false,audioTranscript:card.sentence,audioPath,audioRole:'sentence',audioReviewState:sentenceAudio.audioReviewState,mediaGap:sentenceAudio.mediaGap,imagePath:card.word==='cry'?'/images/assessment/language/variants/antonyms-synonyms/cry-weep-01.webp':card.word==='song'?'/images/assessment/generated/concepts/sing.webp':getChildWordAsset(card.word)?.image||'',imageRole:card.word==='song'?'action-support':VERIFIED_PROPOSITION_WORDS.has(card.word)?'proposition-scene':'vocabulary-support',sceneRequirements:SCENE_REQUIREMENTS[card.word]||`An unmistakable ${card.word}; adult establishes the caption meaning.`,sceneGap:card.word==='song'?'One singer supports the action; a plural singing scene is still required for the full proposition.':VERIFIED_PROPOSITION_WORDS.has(card.word)?'':`A verified proposition scene is not established for: ${card.sentence}`,meaningPrompt:captionMeaning.question,acceptedResponses:captionMeaning.acceptedResponses,definition:meaning.definition,example:meaning.example,nonExample:meaning.nonExample,partnerFrame:`I can tell you about ${card.word}: ___.`,retrievalCue:meaning.retrievalCue,vocabularyAcceptedResponses:[card.word,...(card.word==='under'?['under the desk','below the desk']:card.word==='long'?['hands spread far apart']:[])],gesture:meaning.gesture,teacher:{model:meaning.example,likelyError:`Confusing ${card.word} with the contrast: ${meaning.nonExample}`,correction:`Explain: ${meaning.definition} Then compare the example and non-example.`,support:meaning.gesture,stretch:`Give a fresh example of ${card.word} and explain why it fits.`},alternatives:[{word:cards.find(other=>other!==card)?.word,rationale:'Different meaning in the same weekly gallery; adult names both before receptive vocabulary matching.'}],alternativeReviewState:'authored-semantic-rationale-image-label-listening-unverified',mediaEvidence:{audio:{sourceAuthority:'src/data/generated/presentNarration.generated.js; canonical production audio catalogues',source:sentenceAudio.metadata?.sourceManifest||'existing Leda recording catalogue',rightsAuthority:sentenceAudio.metadata?.rightsSource||'docs/audio/PHONEME_RECORDING_STANDARD.md and existing recording provenance',reviewState:sentenceAudio.audioReviewState,humanListening:sentenceAudio.humanListening,role:'sentence',dialect:'en-US'},image:{sourceAuthority:'src/data/childAssets.js; src/data/childWordImageOverrides.js; shared media manifest',source:'src/data/childAssets.js image catalogue',rightsAuthority:'existing asset manifest and source-art provenance',reviewState:VERIFIED_PROPOSITION_WORDS.has(card.word)?'parent-visual-inspection-2026-10-11':'existing-catalogue-no-proposition-review-in-this-task'}},evidenceClaim:'supported-participation'});
}

const underVocabulary=Object.values(PRESENT_VOCABULARY).flat().find(card=>card.word==='under');
underVocabulary.contrastScenes=[
 {id:'under',imagePath:'/images/child-mode/initial-sounds/under.webp',meaning:'The cat is under the table.',sceneRequirements:'The orange cat is below the wooden tabletop, between the same table legs.',sourceAuthority:'src/data/childAssets.js; source-art/present/vocabulary-contrast/manifest.json',rightsAuthority:'Existing original image catalogue; matching-source receipt in source-art/present/vocabulary-contrast/manifest.json',reviewState:'parent visual inspection 2026-10-11'},
 {id:'on',imagePath:'/images/present/vocabulary/cat-on-table.webp',meaning:'The same cat is on the same table.',sceneRequirements:'The same orange cat is on top of the same wooden table.',sourceAuthority:'source-art/present/vocabulary-contrast/manifest.json',rightsAuthority:'Original matching scene edit; source-art/present/vocabulary-contrast/manifest.json provenance',reviewState:'parent visual inspection 2026-10-11'}
];
underVocabulary.freshScene={id:'dog-under',imagePath:'/images/present/vocabulary/dog-under-table.webp',meaning:'The dog is under the table.',sceneRequirements:'A brown dog below a tabletop; a different subject from the teaching pair.',prompt:'Where is the dog? Point, act or tell.',acceptedResponses:['under the table','below the table'],expressiveFrame:'The dog is ___ the table.',sourceAuthority:'source-art/present/vocabulary-contrast/manifest.json',rightsAuthority:'Existing original dog_under_table.png; derived asset and source hash in source-art/present/vocabulary-contrast/manifest.json',reviewState:'parent visual inspection 2026-10-11'};

export const PRESENT_SENTENCE_MEDIA_GAPS=Object.values(PRESENT_VOCABULARY).flat().filter(card=>card.mediaGap||card.sceneGap).map(({id,sentence,mediaGap,sceneGap,sceneRequirements})=>({id,sentence,audioGap:mediaGap,sceneGap,sceneRequirements}));
export const PRESENT_CHILD_READING_SENTENCES=[
 {id:'cat-sat',sentence:'A cat sat.',readingPurpose:'code-controlled-child-reading',requiredGraphemes:['c','a','t','s'],requiredHighFrequencyWords:['a'],imagePath:'/images/present/sentences/cat-sat.webp',sceneRequirements:'A cat seated.',meaningPrompt:'What did the cat do?',acceptedResponses:['sat','The cat sat.'],audioTranscript:'A cat sat.',audioPath:'',mediaGap:'Exact natural sentence recording required.'},
 {id:'cat-ran',sentence:'A cat ran.',readingPurpose:'code-controlled-child-reading',requiredGraphemes:['c','a','t','r','n'],requiredHighFrequencyWords:['a'],imagePath:'/images/present/sentences/cat-ran.webp',sceneRequirements:'The same cat running.',meaningPrompt:'What changed in the sentence?',acceptedResponses:['sat changed to ran','The cat ran.'],audioTranscript:'A cat ran.',audioPath:'',mediaGap:'Exact natural sentence recording required.'}
];
for(const card of PRESENT_CHILD_READING_SENTENCES){
 const media=sentenceMedia(card.sentence);
 Object.assign(card,{audioPath:media.audioPath,audioReviewState:media.audioReviewState,mediaGap:media.mediaGap,audioRole:'sentence',mediaEvidence:{audio:{sourceAuthority:'src/data/generated/presentNarration.generated.js',source:media.metadata?.sourceManifest||'',rightsAuthority:media.metadata?.rightsSource||'existing authorised recording workflow',reviewState:media.audioReviewState,humanListening:media.humanListening,role:'sentence',dialect:'en-US'}}});
}
export function getPresentChildReadingSentences(graphemes=[],highFrequencyWords=[]){
 const taught=new Set(graphemes);const hfw=new Set(highFrequencyWords.map(word=>word.toLowerCase()));
 return PRESENT_CHILD_READING_SENTENCES.filter(card=>card.requiredGraphemes.every(g=>taught.has(g))&&card.requiredHighFrequencyWords.every(word=>hfw.has(word)));
}
