import { COMPREHENSION_PASSAGES } from '../comprehension/passages.js';
import { getElSkillsBlockCycle } from '../../data/elSkillsBlockCycles.js';

// One manuscript per week. Existing passages and their exact questions are reused
// without rewriting their text, pictures or recordings. All are read-together
// resources, never calibrated independent-reading books or assessment evidence.
const reused = {14:'muddy-pot-lid',19:'muddy-tub-boats',20:'muddy-ten-eggs',23:'muddy-ring',25:'muddy-mat'};
// cycle, title, focus examples, ordered sentences, three authored questions.
// Question format: prompt, answer, three alternatives, exact sentence indices.
const drafts = [
 [1,'Muddy and the Ant',['ant','mat'],[
  'I am Muddy.','An ant is on my mat.','I lift the ant.','The ant is on a leaf.'],[
  ['Who is telling the story?','Muddy',['Splashy','Clucky','Tiny'],[0]],
  ['Where is the ant at first?','On the mat',['On a log','In a cup','In a hat'],[1]],
  ['Where is the ant at the end?','On a leaf',['In the mud','On the mat','In a box'],[3]]]],
 [2,'The Mat Tips',['tips','sits'],[
  'Muddy sits on a mat.','The mat tips.','Muddy gets off.','The mat is flat.'],[
  ['What does Muddy sit on?','A mat',['A log','A box','A rock'],[0]],
  ['What happens to the mat?','It tips',['It rips','It gets wet','It rolls away'],[1]],
  ['What does Muddy do when it tips?','Gets off',['Gets a hat','Has a nap','Gets a cup'],[2]]]],
 [3,'An Ant in the Tin',['ant','in','tin'],[
  'An ant is in a tin.','Muddy tips the tin.','The ant and Muddy sit on the mat.'],[
  ['What is in the tin?','An ant',['A nut','A leaf','A sock'],[0]],
  ['What does Muddy tip?','The tin',['The mat','A cup','A box'],[1]],
  ['Where do the ant and Muddy sit?','On the mat',['In a hut','On a log','In the tin'],[2]]]],
 [4,'The Fan',['fan','dog'],[
  'Muddy is hot.','Speedy the dog has a fan.','Muddy fans his face.','Now Muddy is cool.'],[
  ['How is Muddy at first?','Hot',['Cold','Wet','Sleepy'],[0]],
  ['Who has the fan at first?','Speedy',['Muddy','Splashy','Tiny'],[1]],
  ['What helps Muddy get cool?','The fan',['The tin','A hat','A cup'],[2,3]]]],
 [5,'The Log',['on','log'],[
  'Muddy sits on a log.','The log rolls.','No, Muddy cannot sit on it.','So Muddy lets it go and sits on the mat.'],[
  ['What does Muddy sit on first?','A log',['A mat','A box','A wall'],[0]],
  ['Why can Muddy not sit on the log?','It rolls',['It is wet','It is hot','It is too small'],[1,2]],
  ['Where does Muddy sit at the end?','On the mat',['On the log','In the mud','In a tin'],[3]]]],
 [6,'My Red Hat',['red','hat'],[
  'My red hat is in the mud.','Muddy runs to it.','How do I get my hat?','Muddy lifts it with a stick.','The hat is back on Muddy.'],[
  ['Where is the hat at first?','In the mud',['On a log','In a box','In the pond'],[0]],
  ['What colour is the hat?','Red',['Blue','Green','Black'],[0]],
  ['How does Muddy lift the hat?','With a stick',['With a net','With a cup','With a fan'],[3]]]],
 [7,'The Tin in the Mud',['tin','mud'],[
  'The tin fell into the mud.','Muddy said the tin was stuck.','Muddy pulls it with a stick.','Out comes the tin!','Muddy sets it on a log.'],[
  ['What fell into the mud?','A tin',['A hat','A mat','A fan'],[0]],
  ['How does Muddy pull it out?','With a stick',['With a hat','With a net','With a box'],[2]],
  ['Where is the tin at the end?','On a log',['In the mud','In a hut','On the mat'],[4]]]],
 [8,'The Wet Bag',['bag','wet'],[
  'Muddy has a bag.','That bag is wet.','It is not a bed for an ant.','Muddy sets the bag in the sun.','Now the bag is dry.'],[
  ['What is wet?','The bag',['The mat','The hat','The log'],[1]],
  ['Why is the bag not a bed for the ant?','It is wet',['It is red','It is big','It is soft'],[1,2]],
  ['Where does Muddy put the bag?','In the sun',['In the mud','In a box','In the pond'],[3]]]],
 [9,'A Quilt for Splashy',['quilt','up'],[
  'Splashy has a quilt.','She tugs it up.','It slips off.','Muddy lifts it for her.','He tucks it in.','Sit with me, said Muddy.'],[
  ['What does Splashy have?','A quilt',['A hat','A bag','A cup'],[0]],
  ['What happens when Splashy tugs it up?','It slips off',['It gets wet','It tears','It falls in mud'],[1,2]],
  ['Who tucks the quilt in?','Muddy',['Clucky','Tiny','Woolly'],[4]]]],
 [10,'Can You Get the Cap?',['cap','get'],[
  'Muddy and Splashy are at the pond.','A cap is on a log.','Can you get it, Splashy?','Splashy swims as Muddy holds the log.','Splashy gets the cap.'],[
  ['Where are Muddy and Splashy?','At the pond',['In the barn','By a wall','In a hut'],[0]],
  ['What is on the log?','A cap',['A cup','A bag','A quilt'],[1]],
  ['What does Muddy hold?','The log',['The cap','A stick','A net'],[3]]]],
 [11,'The Box',['pig','yells','box'],[
  'Muddy the pig was in a box.','The box tips on its side.','Muddy yells for help.','Splashy lifts the lid.','Now I can see the sun, said Muddy.'],[
  ['Where was Muddy?','In a box',['In a hut','In a tub','In a bag'],[0]],
  ['What happens to the box?','It tips on its side',['It gets wet','It rolls into the pond','It rips'],[1]],
  ['How does Splashy help?','Lifts the lid',['Gets a mat','Gets a fan','Lifts a log'],[3]]]],
 [12,'A Vest for Muddy',['vest','red'],[
  'Muddy has a red vest for the farm picnic.','It will not fit.','Is it for me or for Tiny?','Tiny puts on the vest.','It fits Tiny!'],[
  ['What colour is the vest?','Red',['Blue','Green','Yellow'],[0]],
  ['What is wrong when Muddy tries it?','It will not fit',['It is wet','It has a rip','It has no buttons'],[1]],
  ['Who does the vest fit?','Tiny',['Muddy','Splashy','Clucky'],[3,4]]]],
 [13,'The Jam Jar',['kit','jam','zip'],[
  'Muddy has jam in his picnic kit.','The zip is stuck.','Clucky gets her peg.','She lifts the zip with the peg.','Now Muddy can get the jam.'],[
  ['What is in the picnic kit?','Jam',['Milk','Hay','Nuts'],[0]],
  ['What is stuck?','The zip',['The jar lid','The peg','The door'],[1]],
  ['How does Clucky help?','Lifts the zip with a peg',['Cuts the kit','Pulls out the jam','Gets a new jar'],[3]]]],
 [15,'The Thin Stick',['shell','chick','thin'],[
  'Muddy and Brave the chick look for a shell.','The shell is in a thin crack by the pond.','Muddy cannot reach it.','Brave lifts it with a thin stick.','Good work, Brave, said Muddy.'],[
  ['What are Muddy and Brave looking for?','A shell',['A hat','A ring','A cup'],[0]],
  ['Where is the shell?','In a crack',['In a box','On a mat','Under a hat'],[1]],
  ['How does Brave lift the shell?','With a thin stick',['With a net','With a cup','With a peg'],[3]]]],
 [16,'The Ball by the Wall',['mat','ball','wall'],[
  'Muddy has a ball.','They all watch it roll to the wall.','The ball is stuck in a gap.','Try this, says Splashy.','Muddy pushes a stick into the gap.','Out pops the ball onto the mat!'],[
  ['What rolls to the wall?','A ball',['A tin','A log','A shell'],[0,1]],
  ['Why can Muddy not pick it up?','It is stuck in a gap',['It is too hot','It is in the pond','It is too heavy'],[2]],
  ['What does Muddy use?','A stick',['A cup','A hat','A net'],[4]]]],
 [17,'The Little Tin',['six','tin'],[
  'Muddy has six figs in a little tin.','Tiny would like a fig.','The lid will not lift.','Muddy and Tiny each pull one side.','The lid pops off.','Now they can each have a fig.'],[
  ['How many figs are in the tin?','Six',['Two','Four','Ten'],[0]],
  ['What will not lift?','The lid',['The tin','The mat','The box'],[2]],
  ['How do they open the tin?','Each pulls one side',['They tip it over','They cut a hole','They get another tin'],[3,4]]]],
 [18,'More Pots',['pot','log'],[
  'Muddy and Splashy have pots for seeds.','Muddy has one pot.','Splashy brings two more pots from the barn.','One pot has a crack.','Muddy puts that pot by a log for bugs.','Now seeds and bugs have a home.'],[
  ['What are the pots for at first?','Seeds',['Jam','Shells','Milk'],[0]],
  ['What is wrong with one pot?','It has a crack',['It is wet','It has no bottom','It is full of mud'],[3]],
  ['Who gets the cracked pot as a home?','Bugs',['Hens','Ducks','Cats'],[4,5]]]],
 [21,'Who Has the Whisk?',['whisk','when'],[
  'What can Muddy use to mix eggs?','Who has the whisk?','Clucky has it in a pot.','When she lifts it, the handle slips.','Muddy catches the whisk.','Now Clucky can mix the eggs in the pot.'],[
  ['What do they want to mix?','Eggs',['Jam','Sand','Hay'],[0]],
  ['Who has the whisk at first?','Clucky',['Muddy','Splashy','Tiny'],[2]],
  ['What does Muddy catch?','The whisk',['The pot','An egg','A cup'],[4]]]],
 [22,'The Pink Cup',['pink','sink'],[
  'Muddy has a pink cup.','It goes under the tap by the barn.','Why does the sink fill up?','A leaf blocks the hole.','Muddy lifts out the leaf.','The water goes down and the sink is empty.'],[
  ['What colour is the cup?','Pink',['Red','Blue','Green'],[0]],
  ['Why does the sink fill up?','A leaf blocks the hole',['The cup is too big','The tap is off','The sink has a crack'],[3]],
  ['What does Muddy do?','Lifts out the leaf',['Adds more water','Gets another cup','Puts in a stick'],[4]]]],
 [24,'Which Bell?',['off','miss','buzz','bell'],[
  'Muddy hears a buzz by the bell.','Which bug is it?','A bee lands on the bell.','Muddy will miss the picnic call.','He waits for the bee to fly off.','Then Muddy rings the bell for lunch.'],[
  ['What makes the buzz?','A bee',['A duck','A hen','A mouse'],[2]],
  ['Where does the bee land?','On the bell',['On a cup','On a hat','On a log'],[2]],
  ['When does Muddy ring the bell?','After the bee flies off',['While the bee is on it','Before the bee lands','Before he hears a buzz'],[4,5]]]],
 [26,'Try My Way',['try','my'],[
  'My hat is stuck by the pond, said Muddy.','Why not try a stick, said Splashy.','The stick is too short.','Muddy finds a longer stick by the barn.','This time the stick reaches the hat.','Muddy lifts the hat onto the grass.'],[
  ['What is stuck?','A hat',['A cup','A bell','A ball'],[0]],
  ['Why does the first stick not work?','It is too short',['It is too wet','It is too heavy','It is bent'],[2]],
  ['What helps Muddy get the hat?','A longer stick',['A smaller cup','A shorter stick','A bigger hat'],[3,4,5]]]],
 [27,'Half for a Friend',['first','friend','half'],[
  'Muddy has a big apple for his friend Splashy.','First he puts it on a flat log.','The apple rolls into the grass.','Muddy picks it up and washes it.','Clucky cuts it in half.','Muddy and Splashy each eat half by the pond.'],[
  ['Who is the apple for?','Splashy',['Clucky','Tiny','Brave'],[0]],
  ['What happens on the log?','The apple rolls off',['The apple breaks','The log falls','The apple gets cut'],[1,2]],
  ['How much does each friend eat?','Half the apple',['A whole apple','Two apples','No apple'],[5]]]]
];

const words = text => text.toLowerCase().match(/\b[a-z]+\b/g) || [];
function curriculum(cycleNumber) { return getElSkillsBlockCycle(`cycle-${cycleNumber}`); }
export function cycleShortLearningWords(passage, day = 'friday') {
 const days = ['monday','tuesday','wednesday','thursday','friday'];
 const index = Math.max(0,days.indexOf(day));
 const week = curriculum(passage.cycleNumber);
 const prior = Array.from({length:passage.cycleNumber-1},(_,i)=>curriculum(i+1).highFrequencyWords).flat();
 const split = Math.ceil(week.highFrequencyWords.length/2);
 const current = index>=3?week.highFrequencyWords:index===2?week.highFrequencyWords.slice(0,split):[];
 // Sound examples are adult-supported whole words, not a decodability claim.
 const focus = passage.targetWords.filter(word=>index>=1 || !week.focusLetters?.length || week.focusLetters[0].spelling && word.includes(week.focusLetters[0].spelling));
 const eligible = new Set([...prior,...current,...focus].map(w=>w.toLowerCase()));
 return [...new Set(words(passage.text).filter(w=>eligible.has(w)))];
}
function finish(p,cycleNumber,sourcePassageId='') {
 const week = curriculum(cycleNumber);
 const cumulativeSightWords = Array.from({length:cycleNumber},(_,i)=>curriculum(i+1).highFrequencyWords).flat();
 return Object.freeze({...p,id:`cycle-short-${cycleNumber}`,cycleNumber,sourcePassageId,
  collection:'Cycle Shorts',world:'Sunny Meadow Farm',readingMode:'Supported Read-Together',
  weeklySightWords:week.highFrequencyWords, cumulativeSightWords,
  focus:`Cycle ${cycleNumber} · ${week.focusLetters?.map(c=>c.label||c.spelling).join(' / ')||'Familiar sounds'}`,
  supportWords:[...new Set(words(p.text).filter(w=>!cumulativeSightWords.map(v=>v.toLowerCase()).includes(w)))],
  prerequisites:['Read character names and unfamiliar words together','Practise this cycle’s sounds and sight words'],
  wordHelp:p.wordHelp||[],wordCount:words(p.text).length,
  questions:p.questions.map((q,i)=>({...q,id:`cycle-short-${cycleNumber}-q${i+1}`}))});
}
const authored = new Map(drafts.map(([n,title,targetWords,sentences,qs])=>[n,finish({title,targetWords,sentences,text:sentences.join(' '),character:'muddy',family:'short',draw:'Retell what happened first, next and last.',questions:qs.map(([prompt,answer,distractors,evidence])=>({prompt,answer,options:[answer,...distractors],evidence:evidence.map(i=>sentences[i])}))},n)]));
export const CYCLE_SHORTS = Array.from({length:27},(_,i)=>{
 const n=i+1,id=reused[n];
 if(!id)return authored.get(n);
 const source=COMPREHENSION_PASSAGES.find(p=>p.id===id);
 if(!source)throw new Error(`Missing Cycle Shorts source ${id}`);
 return finish(source,n,id);
});
export function cycleShortFor(cycleNumber) { return CYCLE_SHORTS[Number(cycleNumber)-1]||null; }
