// Sentence evidence varies in structure and meaning. Distractors change only the assessed convention.
const rows = [];
const put = (templateId, id, passage, labels, explanation, prompt) => rows.push({templateId, id, passage, labels, explanation, ...(prompt ? {prompt} : {})});
const endSets = [
 ['literacy.punctuation.sentence-fix-easy-1','stop-entry','.', [
 'A duck rests by the pond','My sock has a hole','We share a small desk','The cup is empty','Dad fixed the lamp','A leaf fell on my head','This apple tastes sweet']],
 ['literacy.punctuation.sentence-fix-easy-3','question-entry','?', [
 'Where is my other shoe','May I use that chair','Who made this drawing','Is the door open','When does the game begin','How did the shell get here']],
 ['literacy.punctuation.sentence-fix-easy-6','exclaim-entry','!', [
 'What a huge splash','Stop that ball','Hooray, we found it','Look out below','That hurt','What a wonderful surprise','Help, the tent is falling','Wow, a rainbow']],
 ['literacy.punctuation.sentence-fix-hard-7','stop-detail','.', [
 'After lunch, our class will visit the garden','The small boat floated beneath the wooden bridge','We kept the window shut because the wind was cold','Both of the missing gloves were inside my coat','The bus arrived while we were counting the trees','Before the game began, everyone chose a partner','The roots grew longer when we gave the plant water','A narrow path joins the playground to the field','The book on the highest shelf belongs to our teacher']],
 ['literacy.punctuation.sentence-fix-hard-2','question-detail','?', [
 'Which of these paths leads to the lake','Why did the paper curl when it became wet','How can we carry the model without breaking it','What should we do before the visitors arrive','Where will the birds find food when snow covers the ground','Who will feed the rabbit while we are away','When should we take the seedlings out of their pots','Can you explain why this bridge holds more coins']],
 ['literacy.punctuation.sentence-fix-hard-11','exclaim-detail','!', [
 'What an enormous wave is coming towards us','Hooray, our missing kitten has come home','Stop, the paint on that railing is still wet','Look out, the branch above you is falling','What a magnificent castle you have built','Help, the water is spilling over the edge','Wow, that tiny seed grew into a giant sunflower','Watch out, a bicycle is coming round the corner','How brightly those fireworks light up the sky']],
];
for(const [template,prefix,mark,sentences] of endSets) sentences.forEach((sentence,i) => {
 const other=['.','?','!'].filter(value=>value!==mark);
 put(template,`${prefix}-${i+1}`,`${sentence}___`,[sentence+mark,...other.map(value=>sentence+value)],mark==='.'?'The stated calm telling sentence ends with a full stop.':mark==='?'?'This sentence asks a question, so it ends with a question mark.':'The direction asks for strong feeling, so an exclamation mark fits.');
});
const lists = [
 ['For the picnic we brought','bread','cheese','apples'],
 ['The box held','buttons','ribbons','beads'],
 ['In the garden we planted','beans','peas','carrots'],
 ['Our music group uses','drums','bells','shakers'],
 ['I can see','hills','fields','trees'],
 ['The recipe needs','flour','milk','eggs'],
 ['At the beach we found','shells','stones','seaweed'],
 ['We sorted the shapes into','circles','squares','triangles'],
];
for(const [i,[lead,a,b,c]] of lists.entries()) put('literacy.punctuation.list-comma',`list-${i+1}`,`Write a list of these three things: ${a}; ${b}; ${c}.`,[
 `${lead} ${a}, ${b}, and ${c}.`,`${lead}, ${a} ${b} and ${c}.`,`${lead} ${a} ${b} and, ${c}.`], 'Commas separate the items in the list; they do not separate the verb from its objects.');
const contractions = [
 ['we are','We are ready for our turn.','we’re','wer’e','were'],
 ['he is','He is looking for his coat.','he’s','hes’','hes'],
 ['she is','She is holding the ladder steady.','she’s','sh’es','shes'],
 ['they will','They will meet us after lunch.','they’ll','theyll’','theyll'],
 ['you have','You have left your bottle on the bench.','you’ve','youv’e','youve'],
 ['I have','I have saved a place for you.','I’ve','Iv’e','Ive'],
 ['it will','It will rain before we get home.','it’ll','itl’l','itll'],
 ['does not','The lid does not fit this jar.','doesn’t','does’nt','doesnt'],
];
for(const [i,[expanded,passage,key,a,b]] of contractions.entries()) put('literacy.punctuation.contraction-not',`contract-${i+1}`,passage,[key,a,b],'The apostrophe stands where letters have been left out.',`Which word correctly joins ${expanded.replace(' ',' and ')}?`);
const owners=[['fox','tail'],['child','coat'],['teacher','desk'],['bird','nest'],['dog','collar'],['rabbit','hutch'],['boy','cap'],['driver','seat']];
for(const [i,[owner,object]] of owners.entries()) put('literacy.punctuation.possessive',`owns-${i+1}`,`One ${owner} owns the ${object}.`,[
 `the ${owner}’s ${object}`,`the ${owner}s ${object}`,`the ${owner}s’ ${object}`], 'A singular owner takes an apostrophe before the added s.',`Which phrase shows that the ${object} belongs to one ${owner}?`);
const dialogue = [
 ['Mum','The bread is ready.'],['The driver','Please take a seat.'],['Lina','I found a smooth stone.'],['Our teacher','We will start after break.'],
 ['Dad','Where is the torch?'],['The child','May I borrow a ruler?'],['The captain','Everyone is on board.'],['Sam','What a long tunnel!'],
];
for(const [i,[speaker,words]] of dialogue.entries()) put('literacy.punctuation.speech-marks',`speech-${i+1}`,`${speaker} said these words: ${words}`,[
 `${speaker} said, “${words}”`,`“${speaker} said, ${words}”`,`${speaker} “said, ${words}”`], 'Quotation marks surround the words spoken, not the words naming the speaker.');
const boundaries=[
 ['The kettle boiled','Dad made tea'],['Our team arrived','The game began'],['My shoes were wet','I left them by the door'],['The doorbell rang','We opened the door'],
 ['A tiny root appeared','We drew it in our notebook'],['The light turned green','The cars moved forward'],['The wind grew stronger','We brought the washing inside'],['The glue had dried','Our model was ready'],
];
for(const [i,[first,second]] of boundaries.entries()) {
 const firstWords=first.split(' '), secondWords=second.split(' ');
 put('literacy.punctuation.sentence-break',`boundary-${i+1}`,`${first} ${second.toLowerCase()}`,[`${first}. ${second}.`,`${firstWords[0]}. ${firstWords.slice(1).join(' ')} ${second.toLowerCase()}.`,`${first} ${secondWords[0].toLowerCase()}. ${secondWords.slice(1).join(' ')}.`], 'The full stop separates two complete thoughts. Each new sentence starts with a capital.');
}
const readQuestions=[
 ['Ask who owns the orange bicycle.','Who owns the orange bicycle'],['Ask when the exhibition closes.','When does the exhibition close'],
 ['Ask why the gate must stay shut.','Why must the gate stay shut'],['Ask how the wheels fit onto the model.','How do the wheels fit onto the model'],
 ['Ask whether the soup is still hot.','Is the soup still hot'],['Ask which shelf holds the dictionaries.','Which shelf holds the dictionaries'],
 ['Ask where the river meets the sea.','Where does the river meet the sea'],['Ask how many tickets are needed.','How many tickets do we need'],
 ['Ask whether you may join the game.','May I join the game'],
];
for(const [i,[passage,sentence]] of readQuestions.entries()) put('literacy.punctuation.question-order',`read-question-${i+1}`,passage,[`${sentence}?`,`${sentence}.`,`${sentence}!`], 'The sentence asks the requested question, so its final mark is a question mark.');


const starts=[['Some','___ birds cannot fly.'],['Please','___ close the lid.'],['After','___ lunch we rest.'],['Can','___ you find my sock?']];
for(const [i,[word,passage]] of starts.entries()) put('literacy.capitalization.sentence-fix-easy-0',`start-cap-${i+1}`,passage,[word,word.toLowerCase(),word[0].toLowerCase()+word[1].toUpperCase()+word.slice(2)],'The first word of a sentence begins with a capital letter.');
const names=[
 ['Mia','I sit next to ___ at lunch.'],['Noah','Please give this card to ___.'],['Sara','Is ___ in our group?'],['Omar','The picture was drawn by ___.'],
 ['Lily','We waved when ___ arrived.'],['Jade','Ask ___ where the coats go.'],['Ravi','This peg belongs to ___.'],['Nina','Did ___ find her shoe?'],
];
for(const [i,[name,passage]] of names.entries()) put('literacy.capitalization.sentence-fix-medium-0',`name-entry-${i+1}`,passage,[name,name.toLowerCase(),name[0].toLowerCase()+name[1].toUpperCase()+name.slice(2)],'A person’s name begins with a capital wherever it appears in a sentence.');
const hardNames=[
 ['Elena','After the bell rang, ___ collected the registers.'],['Amir','The medal was presented to ___ at the assembly.'],['Iris','Have you seen the model that ___ built?'],
 ['Felix','Our story is about a fox named ___.'],['Tessa','The box of costumes belongs to ___.'],['Dylan','Before ___ joined the group, we had four players.'],
 ['Hazel','My grandmother, ___, taught me to knit.'],['Soren','Although he was nervous, ___ read his poem aloud.'],['Poppy','The shop was named after its owner, ___.'],
];
for(const [i,[name,passage]] of hardNames.entries()) put('literacy.capitalization.sentence-fix-hard-10',`name-detail-${i+1}`,passage,[name,name.toLowerCase(),name[0].toLowerCase()+name[1].toUpperCase()+name.slice(2)],'The capital identifies the proper name even within a longer sentence.');
const days=[
 ['Tuesday','The library is closed on ___ because the shelves are being repaired.'],['Wednesday','Bring your instrument before the lesson on ___.'],
 ['Friday','If it rains on ___, our picnic will be indoors.'],['Saturday','The match was moved from the weekday to ___.'],
 ['Sunday','Our relatives arrive on ___, just before the school week begins.'],['Monday','Although we started on Friday, the paint will not dry until ___.'],
 ['Thursday','The note says that ___ is the last day to return the form.'],['Tuesday','Which club meets on ___ after the swimming lesson ends?'],
];
for(const [i,[day,passage]] of days.entries()) put('literacy.capitalization.sentence-fix-hard-4',`day-${i+1}`,passage,[day,day.toLowerCase(),day[0].toLowerCase()+day[1].toUpperCase()+day.slice(2)],'The name of a day has an initial capital, including inside a sentence.');
const places=[
 ['Paris','We changed trains in ___.'],['Sydney','My uncle sent a postcard from ___.'],['Kenya','The atlas shows where ___ is.'],['India','Tea is grown in parts of ___.'],
 ['Tokyo','The plane landed in ___ after dark.'],['Peru','Our visitor brought photographs of ___.'],['Canada','Several lakes appear on this map of ___.'],['Nile','The ___ River flows north.'],
];
for(const [i,[place,passage]] of places.entries()) put('literacy.capitalization.sentence-fix-hard-16',`place-${i+1}`,passage,[place,place.toLowerCase(),place[0].toLowerCase()+place[1].toUpperCase()+place.slice(2)],'A named place begins with a capital letter.');
const pronouns=[
 ['When the whistle blew, i stopped running.','i','whistle','running'],['Could i help carry the empty trays?','i','help','trays'],
 ['The coach asked whether i had brought my hat.','i','coach','hat'],['Dad said that i could choose the bedtime story.','i','bedtime','story'],
 ['Even though i felt tired, the walk was enjoyable.','i','felt','walk'],['Mum looked back while i closed the gate.','i','back','gate'],
 ['Nobody knew that i had found the missing piece.','i','missing','piece'],['The part that i like best comes after the song.','i','part','song'],
];
for(const [i,[passage,...labels]] of pronouns.entries()) put('literacy.capitalization.pronoun-i',`pronoun-cap-${i+1}`,passage,labels,'The pronoun I is capitalized even when it is not the first word.');
const months=[
 ['We will see the first school play in january.','january','school','play'],['The diary says our visitors arrive in february.','february','diary','visitors'],
 ['Before march begins, we must return our library books.','march','begins','books'],['Our new timetable starts in may.','may','timetable','starts'],
 ['The garden opens to visitors every june.','june','garden','visitors'],['We have kept rainfall records since july.','july','rainfall','records'],
 ['By september, the leaves on this tree start to change.','september','leaves','tree'],['The last trip of the year takes place in november.','november','trip','year'],
];
for(const [i,[passage,...labels]] of months.entries()) put('literacy.capitalization.month',`month-${i+1}`,passage,labels,'The name of a month begins with a capital letter.');
const edits=[
 ['Write about the child named Leila planting seeds.','Leila planted seeds.','leila planted seeds.','Leila planted Seeds.'],
 ['Write about a parcel arriving for Omar.','A parcel arrived for Omar.','a parcel arrived for Omar.','A parcel arrived for omar.'],
 ['Write that you and your sister cleaned the cage.','My sister and I cleaned the cage.','My sister and i cleaned the cage.','my sister and I cleaned the cage.'],
 ['Write that your class swims on Wednesday.','Our class swims on Wednesday.','Our class swims on wednesday.','our class swims on Wednesday.'],
 ['Write that a trip happens in October.','The trip is in October.','The trip is in october.','the trip is in October.'],
 ['Write that your cousin lives in Madrid.','My cousin lives in Madrid.','My cousin lives in madrid.','my cousin lives in Madrid.'],
 ['Write that the boy named Eli helped you.','Eli helped me carry the box.','eli helped me carry the box.','Eli helped me carry the Box.'],
 ['Write that you will visit a friend on Sunday.','I will visit my friend on Sunday.','i will visit my friend on Sunday.','I will visit my friend on sunday.'],
 ['Write that the dog named Spot slept by the fire.','Spot slept by the fire.','spot slept by the fire.','Spot slept by the Fire.'],
];
for(const [i,[passage,...labels]] of edits.entries()) put('literacy.capitalization.sentence-edit',`edit-cap-${i+1}`,passage,labels,'The sentence starts with a capital; names and I keep their capitals, while ordinary nouns inside the sentence do not take extra capitals.');

const selections=[
 ['mock.text.capital-i','locate-entry',[
 ['our tent has two doors.',0],['Please ask ben to help.',2],['May i have a turn?',1],['The dog belongs to ella.',4],
 ['a tiny bird sang.',0],['After lunch i read.',2],['We made a card for sam.',5],
 ]],
 ['mock.text.capital-day','locate-detail',[
 ['After the concert, we will stay in rome.',7],['The note says our class visits on wednesday.',7],
 ['Before october ends, the clocks will change.',1],['Although i was tired, I finished the last page.',1],
 ['My cousin in Spain sends me a card every december.',9],['While we were away, amir watered all our plants.',4],
 ['The boat follows the river through egypt.',6],
 ]],
];
for(const [template,prefix,specs] of selections) for(const [i,[passage,answerIndex]] of specs.entries()) {
 rows.push({templateId:template,id:`${prefix}-${i+1}`,passage,labels:passage.split(' '),answerIndex,
  explanation:'This word needs a capital because it begins the sentence, is a proper name, or is the pronoun I. The other words already have appropriate capitals.'});
}
put('literacy.capitalization.sentence-fix-hard-16','place-9','The museum is in ___.',['Berlin','berlin','bErlin'],'Berlin is a named city, so its initial letter is capitalized.');
for (const [id, passage, key, a, b] of [
  ['river', 'The longest river in this book is the nile.', 'nile', 'river', 'book'],
  ['city', 'Our train will stop in paris tonight.', 'paris', 'train', 'tonight'],
  ['country', 'The letter came from japan last week.', 'japan', 'letter', 'week'],
  ['continent', 'The map labels the large continent as africa.', 'africa', 'map', 'continent'],
  ['mountain', 'The climbers could see everest from their camp.', 'everest', 'climbers', 'camp'],
  ['ocean', 'Our ship sailed across the atlantic in summer.', 'atlantic', 'ship', 'summer'],
  ['village', 'The bus to windermere leaves after lunch.', 'windermere', 'bus', 'lunch'],
  ['island', 'We saw a volcano when we visited iceland.', 'iceland', 'volcano', 'visited'],
  ['street', 'Turn onto oak Street after the bridge.', 'oak', 'after', 'bridge'],
]) put('literacy.capitalization.place-name',`locate-place-${id}`,passage,[key,a,b],`${key[0].toUpperCase()+key.slice(1)} is part of a place name and needs an initial capital; the other choices are common words.`);
export const WRITING_CONVENTIONS_CAPACITY = Object.freeze(rows);
