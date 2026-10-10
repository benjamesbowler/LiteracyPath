import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

// Every row retains an entry task's exact question operation. Harder demand
// comes from competing relevant facts, clause relations or converging clues.
const rows = [];
const add = (skill, construct, id, prompt, passage, key, d1, d2, explanation, demand) =>
  rows.push({ skill, construct, id, prompt, passage, labels: [key,d1,d2], explanation, demand });
add('key_details','what_happened','parcel','What did Leila put in the parcel?',
  'Leila packed a gift for her cousin. She placed a blue scarf in the parcel, then picked up a yellow card. The card stayed on the table because she had not written in it. A red ribbon went around the closed parcel.',
  'a blue scarf','a yellow card','a red ribbon','The scarf went inside; the card stayed out and the ribbon went around the parcel.','Distinguish three related objects by their different roles.');
add('key_details','what_happened','soup','What did Owen add after tasting the soup?',
  'Owen stirred the soup and added carrots. After it cooked, he tasted a spoonful. It needed more flavour, so he added a little salt. He put the pepper back without using it, then served the soup.',
  'a little salt','some carrots','some pepper','Salt was added after the tasting; carrots went in earlier and pepper was not used.','Retrieve an action conditional on its position among three plausible ingredient details.');
add('key_details','where','museum','Where did the children leave their bags?',
  'The children entered the museum through the garden door. They walked past the gift shop to lockers beside the stairs. Their bags stayed in the lockers while they visited the dinosaur room. At lunch, they collected their bags and carried them outside.',
  'in lockers beside the stairs','inside the gift shop','in the dinosaur room','The bags stayed in the lockers during the visit.','Track an object separately from its owners across several named places.');
add('key_details','where','ticket','Where was the ticket when Mum found it?',
  'Ari checked his jacket pocket for the ticket, but found only a wrapper. Mum looked under his chair without success. She finally saw the ticket between two pages of his book. Ari put it safely in his pocket after she handed it back.',
  'between pages of the book','inside the jacket pocket','under the chair','Mum found it in the book; the pocket became its later location.','Distinguish the discovery location from an earlier search and a later destination.');
add('key_details','who','model','Who fixed the model roof?',
  'Noor built the walls of the model house. Eli made the roof, but one corner came loose. Tessa held the walls steady while Noor glued the roof back together. Eli painted the door after the glue dried.',
  'Noor','Eli','Tessa','Noor glued the roof back together; Eli originally made it and Tessa held the walls.','Separate the repairer from the maker and helper.');
add('key_details','who','plant','Who watered the plant on Friday?',
  'Mira usually watered the class plant. On Friday she was absent, so Ben asked Lila to do the job. Lila filled the jug and watered the dry soil. Ben wiped up the water that spilled on the table.',
  'Lila','Mira','Ben','Lila did the watering on Friday despite Mira’s usual responsibility and Ben’s request.','Retrieve an exception to the usual actor among three related roles.');
add('key_details','number_detail','shelves','How many books went on the top shelf?',
  'The class sorted twelve books. Five stories went on the bottom shelf. Four nature books fitted on the top shelf. The remaining three books stayed on the table until the class found another shelf for them.',
  'four','five','three','Four nature books went on the top shelf.','Select the number attached to a specified destination among three explicit counts.');
add('key_details','number_detail','bus','How many children waited for the second bus?',
  'Twenty children needed a lift to the farm. Twelve boarded the first bus. Eight waited for the second bus with their teacher. Each bus had two adults aboard when it left, but the teachers were counted separately from the children.',
  'eight','twelve','two','Eight children waited; twelve had already boarded and two counts adults.','Keep the requested group and transport stage distinct from other explicit counts.');

for (const [construct, specs] of Object.entries({
  mostly_about_fiction: [
    ['bridge','Lena’s toy car could not cross the gap between two boxes. Her first paper bridge sagged. She folded the paper into ridges and tried again. This time the car crossed safely. Lena used what she saw to improve her design.','Lena tests and improves a paper bridge.','Lena pushes a toy car across two boxes.','Lena chooses a new toy car to buy.'],
    ['garden','A fox kept taking carrots from Bear’s garden. Bear first built a tall fence, but the fox dug beneath it. Bear then offered the fox a small plot to grow carrots. Soon they both had carrots, and the digging stopped.','Bear solves a garden problem by sharing space.','Bear builds a tall fence around carrots.','Bear leaves the garden to find another home.'],
  ],
  mostly_about_info: [
    ['roots','Roots do more than hold a plant in place. They take in water from the soil. Some roots also store food for later growth. Their jobs happen underground, so we may not notice how much the plant depends on them.','Roots perform several jobs that help plants live.','Roots hold plants firmly in the ground.','All roots store exactly the same amount of food.'],
    ['beaver','Beavers build dams from branches and mud. The dam slows water and creates a deeper pond. A pond can protect the entrance to a beaver’s home and give other animals a place to live. A beaver’s building changes its surroundings.','Beaver dams change the water and help animals.','Beavers collect branches to build dams.','Beavers build dams mainly to give other animals homes.'],
  ],
  mostly_about_everyday: [
    ['market','Our class planned a small market. We wrote signs, counted the things for sale, and decided fair prices. During the market, we took turns helping visitors and recording money. Afterwards, everyone checked the totals together.','The class shares the jobs of running a market.','The class writes signs showing fair prices.','Visitors decide which class should run a market.'],
    ['library','The library wanted more families to visit. It opened on Saturday mornings and added story sessions. Volunteers made a quiet corner for adults and a low shelf for children. More families began staying to read together.','The library makes changes that welcome families.','Volunteers put children’s books on a low shelf.','Families stop visiting because the library is quiet.'],
  ],
})) for (const [id,passage,key,d1,d2] of specs) add('main_idea',construct,id,'What is this passage mostly about?',passage,key,d1,d2,
  `${key} covers the whole passage. The narrower true detail describes only one part.`, 'Choose a whole-passage idea over a true supporting detail and a plausible misinterpretation.');

add('inference','feeling_from_evidence','stage','How does Mara most likely feel?',
  'Mara had rehearsed her song all week. Now she stood behind the curtain, twisting the edge of her sleeve. When her name was called, she took a deep breath and checked the opening words again before stepping forward.',
  'nervous about performing','bored with the song','angry with the audience','Twisting her sleeve, breathing deeply and checking known words converge on nervousness.','Combine three indirect behavioural clues while rejecting plausible event-related feelings.');
add('inference','feeling_from_evidence','reunion','How does Dev most likely feel?',
  'Dev saw his sister at the station after her long trip. He ran towards her, dropped his bag and hugged her tightly. He began asking questions before she could answer the first one. He kept smiling all the way home.',
  'excited to see his sister','worried that she is leaving','proud of finishing his own trip','Running to hug her, eager questions and smiling support excitement at the reunion.','Combine actions and dialogue behaviour; distinguish whose trip has ended.');
add('inference','where_am_i','repair','Where is Imani most likely?',
  'Imani heard wheels spinning while an adult tightened a chain. Pumps stood beside a rack of helmets. She pointed to her flat tyre, and the adult lifted her bicycle onto a stand to examine it.',
  'in a bicycle repair shop','at a bicycle race starting line','inside a toy shop','Repair work, pumps and examining the flat tyre together identify the repair shop.','Integrate three setting clues that distinguish related bicycle locations.');
add('inference','where_am_i','bakery','Where is Tom most likely?',
  'Tom waited beside trays of warm rolls. An adult behind the counter slid a loaf into a paper bag. Through an open doorway, Tom saw someone taking another tray from a large oven. He counted coins for his turn.',
  'in a bakery','in a family kitchen','at a school lunch table','The counter, payment and baking beyond it jointly indicate a bakery.','Use commercial and production clues to distinguish places where bread is present.');
add('inference','what_happens_next','kite','What will most likely happen next?',
  'A gust pulled the kite string from Rosa’s hand. The kite caught in a low branch beyond her reach. Rosa fetched a long broom and asked Dad to come with her. Dad held the broom while Rosa pointed at the branch.',
  'Dad will use the broom to free the kite.','Rosa will fly a second kite from the roof.','Dad will sweep the path and leave the kite.','The problem, chosen tool and pointing action support using the broom to retrieve the kite.','Predict a solution from a problem plus two preparations, not from a stated next event.');
add('inference','what_happens_next','plant','What will most likely happen next?',
  'The seedling leaned towards the sunny window. Its pot was dry and light when Max lifted it. Max brought a jug of water and placed a saucer beneath the pot. He checked that the hole underneath was clear.',
  'Max will water the seedling.','Max will move the seedling into a larger pot.','Max will turn the pot to face the window.','Dry soil, the water jug and drainage preparations support watering. Checking the drainage hole does not establish a need for a larger pot; the window explains the plant’s lean, not the purpose of the jug and saucer.','Combine condition and preparations to infer the immediate action.');

const causes = [
  ['find_effect','shade','What happened because the awning was opened?', 'The café tables were in hot sunlight. A worker opened the awning above them, and the tables became shaded. Later, a breeze moved the leaves nearby. Customers sat under the awning with their drinks.', 'The tables became shaded.','A breeze began moving the leaves.','The worker brought out more tables.','Opening the awning blocked sunlight; the later breeze is only a nearby event.'],
  ['find_effect','blocked','What happened because leaves blocked the drain?', 'Rain usually ran down the clear drain. This time wet leaves covered the opening. Water collected on the path until a caretaker removed the leaves. Then the water flowed away again.', 'Water collected on the path.','The rain stopped falling.','The leaves grew on the path.','The blocked opening stopped drainage; removing the leaves reversed the effect.'],
  ['find_cause','bell','Why did the bell fail to ring?', 'The class waited for the bell, but heard nothing. Its battery had run out. A loose sign beside the bell rattled in the wind. When a new battery was fitted, the bell rang loudly again.', 'Its battery had run out.','A sign rattled beside it.','The class was waiting quietly.','Replacing the battery restores the bell, supporting the stated cause rather than the nearby noise.'],
  ['find_cause','cake','Why did the cake stick to the tin?', 'Jules carefully measured the ingredients, but forgot to grease the tin. When the cake cooled, it stuck to the metal. The next cake used the same recipe in a greased tin and came out easily.', 'The first tin was not greased.','The ingredients were carefully measured.','Both cakes used the same recipe.','The difference between the two trials is whether the tin was greased.'],
  ['because_sentence','ice','Which sentence explains what made this happen?', 'The puddle was liquid at bedtime. Overnight the temperature dropped below freezing. By morning, a thin layer of ice covered it. The sun rose after the ice had already formed.', 'The cold night made the puddle freeze.','The sunrise made the puddle freeze.','The ice made the night become cold.','The temperature drop preceded and caused the freezing; the other options confuse timing or reverse cause.'],
  ['because_sentence','sail','Which sentence explains what made this happen?', 'A model boat sat still on the water. Mei blew towards its sail, and the boat moved away. When she stopped blowing, it slowed. Her hand never touched the boat.', 'Air pushing the sail made the boat move.','Mei’s hand pushing the boat made it move.','The moving boat made Mei start blowing.','The sail receives the moving air; the text excludes hand contact and shows the correct direction of cause.'],
];
for (const [construct,id,prompt,passage,key,d1,d2,explanation] of causes) add('cause_effect',construct,id,prompt,passage,key,d1,d2,explanation,
  'Distinguish a causal link from a nearby event or reversed explanation using evidence across the passage.');

const themes = [
 ['lesson_mistake_fixed','estimate','Milo guessed how much string his model needed and cut it too short. Instead of throwing the model away, he measured each side, joined a fresh length and tried again. On the next model he measured before cutting.','Use a mistake to improve how you work.','Finishing a model quickly matters more than measuring.','Replace a failed model with a different project.'],
 ['lesson_mistake_fixed','interrupt','Nia kept answering before her partner finished speaking, and they built the wrong shape. She apologized and listened to the whole plan. Together they rebuilt it. During the next task she waited until her partner had finished.','Change an unhelpful habit after seeing its effect.','A partner should repeat a plan after every action.','Finishing the shape matters more than hearing each idea.'],
 ['lesson_kindness_returned','welcome','A new child stood alone at lunch. Sam made room and asked him to join the table. Weeks later, Sam forgot his lunch. The same child offered part of his sandwich without being asked.','Small acts of kindness can lead to kindness in return.','Wait for a chance to repay help before offering it.','Good friends should offer the same kind of help each time.'],
 ['lesson_kindness_returned','snow','Ruth cleared snow from her elderly neighbour’s path. She did it again after the next storm without asking for anything. When Ruth’s bike broke, the neighbour showed her how to mend it. They began helping each other often.','Helping others can build a caring relationship.','Teaching a skill is more helpful than doing a job.','A friendly favour needs to be repaid immediately.'],
 ['lesson_effort_pays','skate','Kai fell many times while learning to skate. He practised stopping on a safe patch each afternoon. A month later he stopped in time when a small child crossed his path. He knew the practice had helped.','Regular practice can prepare you for an important moment.','Falling shows which activities you should stop doing.','You learn most by watching others practise.'],
 ['lesson_effort_pays','seed','Ada’s first seedlings dried out. She learned when to water and checked the next plants each morning. Several weeks later they grew strong enough to plant outside. She kept caring for them even after the first flowers opened.','Patient, steady care can help an effort succeed.','New plants need exactly the same care each day.','Flowers show that a plant no longer needs attention.'],
];
for(const [construct,id,passage,key,d1,d2] of themes) add('theme',construct,id,'What lesson does this story teach?',passage,key,d1,d2,
  `${key} connects the character’s actions with the outcome; the other lessons conflict with that pattern.`,
  'Infer a transferable lesson from changes over time rather than select a literal plot detail.');

const contexts = [
 ['definition_clue','bank','bank','We stopped by the river bank, the raised land along the edge of the water. Dad checked the map while I watched a beetle in the grass. No buildings stood nearby; the river curved around the bank before flowing under a bridge.','land beside a river','a place that keeps money','the bottom of the river'],
 ['definition_clue','draft','draft','A draft, or first version of a piece of writing, lay on Mina’s desk. She crossed out one sentence and added a better ending. Her final copy would come later. The open window moved the paper, but did not change the words.','a first version of writing','a current of cool air','a finished printed book'],
 ['example_clue','shelter','shelters','The animals found shelters during the storm. A rabbit stayed in its burrow. Birds huddled inside a hollow tree. Even a beetle hid under a curled leaf, out of the driving rain.','places that give protection','places where food is cooked','places that make rain'],
 ['example_clue','transparent','transparent','We tested several transparent things. We could see the garden through clear glass and watch a fish through a clear plastic sheet. Light passed through both so we could see what was beyond them.','clear enough to see through','shiny enough to reflect a face','strong enough not to bend'],
 ['action_clue','hesitated','hesitated','Leila hesitated at the edge of the stepping stones. She lifted one foot, put it down again, and checked the gap before moving. Her friends waited while she decided whether the next stone was close enough.','paused because she was unsure','hurried without looking','refused to move for the whole day'],
 ['action_clue','inspected','inspected','The mechanic inspected the wheel. She turned it slowly, looked closely at each part and tested where the rubbing sound came from. Only after these checks did she reach for a tool.','examined carefully','replaced immediately','cleaned with a cloth'],
];
for(const [construct,id,word,passage,key,d1,d2] of contexts) add('context_clues',construct,id,`In this passage, what does "${word}" mean?`,passage,key,d1,d2,
  `The supplied ${construct === 'definition_clue' ? 'definition' : construct === 'example_clue' ? 'examples' : 'actions'} support “${key}”. The alternatives fit neither the complete context nor the described evidence.`,
  'Resolve a competing sense or a close meaning using the declared clue type across sentences.');

export function buildLiteracyMockComprehensionDepthItems(bank) {
  return rows.flatMap(row => {
    const source = bank.find(item => item.skillId === row.skill && item.constructClaim === row.construct && item.level === 1);
    if (!source) throw new Error(`Missing comprehension depth task: ${row.skill}/${row.construct}`);
    const versions = [source];
    const listening = bank.find(item => item.skillId === `listen_${row.skill}` && item.constructClaim === `listening_${row.construct}` && item.level === 1);
    if (listening) versions.push(listening);
    return versions.map(template => {
      const id = `mock.depth.${template.skillId}.${row.id}`;
      const choices = row.labels.map((label,index)=>({id:`c${index}`,label}));
      const cues = [{role:'instruction',text:row.prompt,path:getLedaInstructionAudioPath(row.prompt)}];
      if(template.modality==='listening') cues.unshift({role:'passage',text:row.passage,path:getLedaInstructionAudioPath(row.passage)});
      if(template.requiredAudioCues.some(cue=>cue.role==='choice')) cues.push(...choices.map(choice=>({role:'choice',choiceId:choice.id,value:choice.label,text:choice.label,path:getLedaWordAudioPath(choice.label)||getLedaInstructionAudioPath(choice.label)})));
      return {...template,id,sourceItemId:id,canonicalItemId:id.replace('listen_',''),level:2,prompt:row.prompt,passage:row.passage,
        choices,answer:'c0',targetWord:'',image:'',imageAlt:'',requiredAudioCues:cues,stimulusKey:row.passage.toLowerCase(),
        exposureFamilyId:`mock-depth:${row.skill}:${row.id}`,explanation:row.explanation,difficultyEvidence:row.demand,
        distractorRationales:{c1:`${row.labels[1]} is not supported by the complete evidence. ${row.explanation}`,c2:`${row.labels[2]} is not supported by the complete evidence. ${row.explanation}`},
        sourceProvenance:{kind:'original_mock_depth',file:'src/data/literacyMockComprehensionDepth.js',sourceId:row.id},
        mediaDecision:{role:'text-only',paths:[],constructReview:'approved',answerNeutral:'approved',reason:'Complete authored passage supplies the exact evidence under the unchanged reading or listening access contract.'}};
    });
  });
}
