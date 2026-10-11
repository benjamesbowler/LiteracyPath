const rows=[];
const sourceFile='src/data/literacyMockReadingCapacityNavigation.js';
function contents(id,level,prompt,entries,keyIndex) {
  const labels=entries.map(entry=>level===1?String(entry[1]):`${entry[0]}, page ${entry[1]}`);
  const order=[keyIndex,...entries.map((_,i)=>i).filter(i=>i!==keyIndex)].slice(0,3);
  rows.push({id,sourceFile,templateId:level===1?'literacy.informational_features.contents-bees':'literacy.informational_features.contents-select',
    prompt,passage:`Contents\n${entries.map(([label,page])=>`${label} — page ${page}`).join('\n')}`,
    textFeature:{kind:'contents',title:'Contents',entries:entries.map(([label,page])=>({label,page}))},
    labels:order.map(i=>labels[i]),explanation:`The requested information belongs under “${entries[keyIndex][0]}”, on page ${entries[keyIndex][1]}.`,
    foilReasons:order.slice(1).map(i=>`“${entries[i][0]}” directs the reader to a different topic, not the information requested.`),
    demand:level===1?'Match a named subject to its page in a complete contents list.':'Infer which chapter heading covers a specific information need, then select its page.'});
}
contents('contents-homes',1,'Which page tells about nests?', [['Burrows',2],['Hives',6],['Nests',9]],2);
contents('contents-weather',1,'Which page tells about rain?', [['Rain',4],['Wind',7],['Snow',11]],0);
contents('contents-travel',1,'Which page tells about boats?', [['Trains',3],['Boats',8],['Buses',12]],1);
contents('contents-fruit',1,'Which page tells about apples?', [['Pears',5],['Plums',10],['Apples',14]],2);
contents('contents-pets',1,'Which page tells about rabbits?', [['Rabbits',2],['Goldfish',5],['Dogs',8]],0);
contents('contents-night',1,'Which page tells about stars?', [['The Moon',6],['Stars',12],['Planets',18]],1);
contents('contents-games',1,'Which page tells about hide-and-seek?', [['Tag',3],['Hide-and-seek',6],['Hopscotch',9]],1);
contents('contents-clothes',1,'Which page tells about mittens?', [['Boots',4],['Hats',8],['Mittens',16]],2);
contents('contents-castle',2,'Where should you look to learn how a castle was defended?', [['Cooking and meals in the castle kitchen',5],['Defences',12],['Clothes worn for a royal feast',19]],1);
contents('contents-butterfly',2,'Where should you look to learn what comes out of a chrysalis?', [['From caterpillar to butterfly',7],['Colours on wings',14],['Flowers in a meadow',21]],0);
contents('contents-rescue',2,'Where should you look to learn how rescue workers talk over long distances?', [['Using rescue ropes and ladders',4],['Rescue boats out at sea',11],['Radio contact',18]],2);
contents('contents-kitchen',2,'Where should you look to learn how to store food safely?', [['Keeping food cool',6],['Setting the table',13],['Washing the floor',20]],0);
contents('contents-bridge',2,'Where should you look to learn why a bridge can carry heavy vehicles?', [['Colours for painting a bridge',3],['Strong supports',10],['Choosing the name of a new bridge',17]],1);
contents('contents-fox',2,'Where should you look to learn what young foxes need?', [['Following tracks',8],['Hunting after dark',15],['Inside the family den',22]],2);
contents('contents-seeds',2,'Where should you look to learn how seeds reach new places?', [['Wind, water and animal carriers',5],['Roots beneath the soil',12],['Leaves in sunlight',19]],0);
contents('contents-museum',2,'Where should you look to learn how old objects are protected?', [['Buying an entrance ticket',2],['Cleaning and careful storage',9],['Visiting the café',16]],1);
contents('contents-space',2,'Where should you look to learn about eating during a space journey?', [['Packing meals for the crew',6],['Looking back at Earth',15],['Landing safely',24]],0);

function glossary(id,term,definitions,keyIndex=0,context='') {
  const level=context?2:1;
  const terms=definitions.map(([entryTerm,definition])=>({term:entryTerm,definition}));
  const key=definitions[keyIndex][1];
  rows.push({id,sourceFile,templateId:level===1?'literacy.informational_features.glossary-pup':'literacy.informational_features.glossary-context',
    prompt:level===1?`What does ${term} mean in this glossary?`:'Which glossary meaning fits the sentence?',
    passage:`${context?`${context}\n`:''}Glossary\n${definitions.map(([t,d])=>`${t}: ${d}`).join('\n')}`,
    textFeature:{kind:'glossary',title:'Glossary',...(context?{context}:{}),entries:terms},
    labels:[key,...definitions.filter((_,i)=>i!==keyIndex).map(x=>x[1])],
    explanation:context?`The sentence uses ${term} to mean ${key}; its actions and objects support that sense.`:`The entry labelled ${term} defines it as ${key}.`,
    foilReasons:definitions.filter((_,i)=>i!==keyIndex).map(([other,d])=>context?`“${d}” is not the meaning supported by this sentence.`:`This is the definition supplied for ${other}, not ${term}.`),
    demand:context?'Use sentence context to select the relevant dictionary sense rather than a familiar but incompatible meaning.':'Locate the definition attached to the named entry rather than a nearby entry.'});
}
glossary('glossary-beak','beak',[['wing','a body part used for flying'],['beak','a bird’s hard mouth'],['nest','a place where a bird lays eggs']],1);
glossary('glossary-cub','cub',[['cub','a young bear or lion'],['herd','a group of animals'],['claw','a sharp curved nail']],0);
glossary('glossary-path','path',[['bridge','a structure for crossing a gap'],['bank','land beside a river'],['path','a track used for walking']],2);
glossary('glossary-root','root',[['root','the part of a plant growing down into soil'],['petal','one coloured part of a flower'],['stem','the part that holds leaves up']],0);
glossary('glossary-tool','tool',[['shelter','a place that gives protection'],['tool','an object used to do a job'],['trail','a route across the land']],1);
glossary('glossary-dawn','dawn',[['dusk','the time when daylight fades'],['shade','a place out of direct sunlight'],['dawn','the time when daylight first appears']],2);
glossary('glossary-island','island',[['island','land surrounded by water'],['shore','the edge of land beside water'],['valley','low land between hills']],0);
glossary('glossary-helmet','helmet',[['saddle','a seat on a bicycle'],['pedal','a part pushed by the foot'],['helmet','a hard covering that protects the head']],2);
glossary('glossary-bark-context','bark',[['bark','the rough outer covering of a tree'],['bark','the short loud sound a dog makes'],['branch','a part growing out from a tree trunk']],0,'The gardener noticed deep cracks in the oak’s bark.');
glossary('glossary-jam-context','jam',[['jam','a sweet fruit spread'],['jam','a blockage that stops movement'],['lid','a cover on a container']],1,'The fallen boxes caused a jam in the narrow passage.');
glossary('glossary-seal-context','seal',[['seal','a sea animal with flippers'],['seal','to close something tightly'],['stamp','a small payment label for a letter']],1,'Press the sticky flap down to seal the envelope.');
glossary('glossary-spring-context','spring',[['spring','the season after winter'],['spring','a curled piece of metal that pushes back'],['bud','a small new growth on a plant']],0,'In spring, new leaves opened on the bare branches.');
glossary('glossary-trunk-context','trunk',[['trunk','an elephant’s long nose'],['trunk','the thick main stem of a tree'],['root','a part of a plant usually beneath the soil']],1,'A ladder leaned against the trunk below the lowest branches.');
glossary('glossary-bank-context','bank',[['bank','land beside a river'],['bank','a place that keeps and lends money'],['bridge','a structure crossing water or a gap']],1,'Mum went to the bank to put money into her account.');
glossary('glossary-light-context','light',[['light','not heavy'],['light','brightness that lets you see'],['dark','having little brightness']],0,'The empty basket was light enough for the small child to carry.');
glossary('glossary-match-context','match',[['match','a small stick used to start a flame'],['match','a contest between players or teams'],['score','the points won in a game']],1,'The tennis match ended when the last point was won.');
glossary('glossary-wave-context','wave',[['wave','a raised movement across water'],['wave','to move a hand as a greeting'],['tide','the regular rise and fall of sea level']],1,'We wave to the driver each morning as the bus passes.');

export const readingCapacityNavigation=rows;
