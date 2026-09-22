// Literal causal evidence at L1; linked mechanisms and competing explanations at L2.
// Every level contains 32 mastery items (16 per phase) and 8 reserves.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });
const it = (u, lvl, ph, v, passage, prompt, choices, extra = {}) => ({
  u,
  lvl,
  ph,
  v,
  fmt: "COMPREHENSION",
  cell: u,
  passage,
  prompt: u === "because_sentence" ? "Which sentence explains what made this happen?" : prompt,
  choices,
  media: "text",
  ...extra
});

export default {
  skillId: "cause_effect",
  skillName: "Cause and Effect",
  items: [
    // ============ LEVEL 1 · find_effect (8) ============
    it("find_effect", 1, 1, 1,
      "The nights stayed below freezing all week. The pond water turned to solid ice. On Saturday, ducks stood on its frozen top. Their flat feet slid as they tried walking.",
      "What happened BECAUSE the nights were so cold?",
      [K("ice covered the pond"), P("ducks covered the pond", "D-PLAUSIBLE-UNSUPPORTED"), P("snow covered the pond", "D-PLAUSIBLE-UNSUPPORTED"), P("leaves covered the pond", "D-OPPOSITE")]),
    it("find_effect", 1, 1, 2,
      "Zack tipped a seed packet too quickly. Seeds fell onto the path beside the flowers. Pigeons saw the seeds and flew down. They pecked at the food on the path.",
      "What happened because the seeds spilled on the path?",
      [K("birds landed to eat the seeds"), P("flowers grew across the path", "D-PLAUSIBLE-UNSUPPORTED"), P("Zack poured seeds from a packet", "D-PLAUSIBLE-UNSUPPORTED"), P("Zack moved seeds into the flowers", "D-OPPOSITE")]),
    it("find_effect", 1, 1, 3,
      "The door made a loud noise when opened. Grandma added oil to its stiff hinge. She moved the door to spread the oil. The door then opened quietly without waking Baby.",
      "What happened BECAUSE Grandma oiled the hinge?",
      [K("the door made no noise"), P("the door made a loud noise", "D-PLAUSIBLE-UNSUPPORTED"), P("the door woke the sleeping baby", "D-PLAUSIBLE-UNSUPPORTED"), P("the door’s hinge fell onto the floor", "D-OPPOSITE")]),
    it("find_effect", 1, 1, 4,
      "No one watered the plant during school break. Its soil became hard and dry. Without water, the leaves began to droop. Children saw the bent leaves when they returned.",
      "What happened because the plant had no water?",
      [K("the leaves hung down"), P("the leaves grew larger", "D-PLAUSIBLE-UNSUPPORTED"), P("the pot grew heavier", "D-PLAUSIBLE-UNSUPPORTED"), P("the soil stayed damp", "D-OPPOSITE")]),
    it("find_effect", 1, 2, 5,
      "Dad left crayons in the hot car. Heat softened their wax during the day. After lunch, Mina opened the crayon box. The crayons had melted into one colorful lump.",
      "What did the hot car do to the crayons?",
      [K("the wax colors melted together"), P("the wax colors broke apart", "D-PLAUSIBLE-UNSUPPORTED"), P("the box filled with rainwater", "D-PLAUSIBLE-UNSUPPORTED"), P("the box fell off the seat", "D-OPPOSITE")]),
    it("find_effect", 1, 2, 6,
      "Leah rubbed a balloon against her sweater. Rubbing gave it a tiny electric charge. She held it near her head. The charge pulled her hair toward the balloon.",
      "What happened because Leah rubbed the balloon?",
      [K("her hair rose toward the balloon"), P("her hair fell across her face", "D-PLAUSIBLE-UNSUPPORTED"), P("her sweater pulled her arm down", "D-PLAUSIBLE-UNSUPPORTED"), P("her sweater made the balloon burst", "D-OPPOSITE")]),
    it("find_effect", 1, 2, 7,
      "Snow fell so deeply that roads became unsafe. The school could not open for lessons. Amini heard its name on the radio. Her school was listed among the closed schools.",
      "What happened because of the deep snow?",
      [K("Amini’s lessons were cancelled"), P("Amini left her lessons early", "D-PLAUSIBLE-UNSUPPORTED"), P("Amini bought a warmer coat", "D-PLAUSIBLE-UNSUPPORTED"), P("Amini caught a different bus", "D-OPPOSITE")]),
    it("find_effect", 1, 2, 8,
      "Omar forgot the lid on the popcorn pot. The hot corn started to pop and jump. With no lid, pieces flew out. They landed on the counter and kitchen floor.",
      "What happened because the lid was off?",
      [K("corn spilled outside the pot"), P("corn stayed under the pot’s lid", "D-PLAUSIBLE-UNSUPPORTED"), P("the pot stopped the corn popping", "D-PLAUSIBLE-UNSUPPORTED"), P("the lid fell onto the floor", "D-OPPOSITE")]),

    // ============ LEVEL 1 · find_cause (8) ============
    it("find_cause", 1, 1, 1,
      "Water boiled inside the kettle on the stove. Steam pushed through the whistle in its lid. The whistle made a loud sound. Auntie took the kettle off the heat.",
      "What made the loud whistle sound?",
      [K("steam rushing out through the lid"), P("water pouring out of the kettle", "D-PLAUSIBLE-UNSUPPORTED"), P("the lid falling onto the stove", "D-PLAUSIBLE-UNSUPPORTED"), P("Auntie lifting the kettle off the heat", "D-OPPOSITE")]),
    it("find_cause", 1, 1, 2,
      "Bruno heard the gate creak outside the house. That noise made him bark. Then a delivery worker rang the doorbell. Bruno had barked before the worker reached the door.",
      "Why did Bruno bark before the doorbell rang?",
      [K("he heard the gate open"), P("he heard the doorbell ring", "D-PLAUSIBLE-UNSUPPORTED"), P("he saw food in a bowl", "D-PLAUSIBLE-UNSUPPORTED"), P("he saw someone at the window", "D-OPPOSITE")]),
    it("find_cause", 1, 1, 3,
      "Hana drew a chalk rocket on the path. Rain fell on it through the night. Water washed away most of the chalk. Only a faint pink mark remained next morning.",
      "Why did the rocket drawing disappear?",
      [K("rain carried the chalk away"), P("feet rubbed the chalk away", "D-PLAUSIBLE-UNSUPPORTED"), P("Hana swept the chalk away", "D-PLAUSIBLE-UNSUPPORTED"), P("wind blew the chalk away", "D-OPPOSITE")]),
    it("find_cause", 1, 1, 4,
      "Milly carried ice cream on a warm walk. The heat softened it until it started dripping. She licked fast to catch the drops. White drops still ran down onto her fingers.",
      "Why was the ice cream dripping?",
      [K("heat turned the ice cream soft"), P("licking made the cone turn soft", "D-PLAUSIBLE-UNSUPPORTED"), P("a hole let water through the cone", "D-PLAUSIBLE-UNSUPPORTED"), P("her fingers squeezed through the cone", "D-OPPOSITE")],
      { note: "licking fast is the RESPONSE to melting, not the cause of drips" }),
    it("find_cause", 1, 2, 5,
      "Finn called hello inside an empty tunnel. His voice hit the hard walls. The sound bounced back toward his ears. Finn heard his own hello again.",
      "What sent Finn's voice back to his ears?",
      [K("sound returning from the tunnel walls"), P("a person speaking outside the tunnel", "D-PLAUSIBLE-UNSUPPORTED"), P("a train moving through the tunnel", "D-PLAUSIBLE-UNSUPPORTED"), P("Finn calling again inside the tunnel", "D-OPPOSITE")]),
    it("find_cause", 1, 2, 6,
      "Mo left his bike outside all winter. Rain kept wetting the bare metal. The wet metal slowly grew orange rust. By spring, the chain was stiff and rusty.",
      "Why did the bike get rusty?",
      [K("the metal stayed wet from rain"), P("the metal dried in warm winter sun", "D-PLAUSIBLE-UNSUPPORTED"), P("Mo oiled the chain before every ride", "D-PLAUSIBLE-UNSUPPORTED"), P("Mo kept the chain away from rain", "D-OPPOSITE")]),
    it("find_cause", 1, 2, 7,
      "Rosa built a sandcastle near the sea. Later, the tide rose up the beach. Waves washed over the castle walls. Water flattened them into a smooth little hill.",
      "Why did the castle turn into a smooth hill?",
      [K("waves covered the castle walls"), P("wind lifted sand off the walls", "D-PLAUSIBLE-UNSUPPORTED"), P("Rosa stamped on the castle walls", "D-PLAUSIBLE-UNSUPPORTED"), P("a dog dug into the castle walls", "D-OPPOSITE")]),
    it("find_cause", 1, 2, 8,
      "Two blue curtains hung in different windows. Sun shone on one for many years. The light slowly made its color fade. The curtain in the shade stayed dark blue.",
      "Why did one curtain become pale?",
      [K("sunlight slowly faded one curtain"), P("washing slowly shrank one curtain", "D-PLAUSIBLE-UNSUPPORTED"), P("rainwater slowly stained one curtain", "D-PLAUSIBLE-UNSUPPORTED"), P("someone replaced one old curtain", "D-OPPOSITE")]),

    // ============ LEVEL 1 · because_sentence (8) ============
    it("because_sentence", 1, 1, 1,
      "A moth saw a bright porch light. The light drew it toward the house. It flew around the lamp again and again. The dark garden stayed behind it.",
      "Choose the sentence that says it best.",
      [K("The moth approached because the porch was bright."), P("The lamp shone because the moth flew around it.", "D-PLAUSIBLE-UNSUPPORTED"), P("The moth approached because rain filled the garden.", "D-PLAUSIBLE-UNSUPPORTED"), P("The lamp dimmed because the moth left the garden.", "D-OPPOSITE")]),
    it("because_sentence", 1, 1, 2,
      "Pia's shoes fitted at the start of summer. Her feet grew during the following weeks. Now her toes pressed against the shoe ends. The tight shoes made her feet ache.",
      "Choose the sentence that says it best.",
      [K("Growing feet made the old shoes hurt."), P("Aching toes made the old shoes shrink.", "D-PLAUSIBLE-UNSUPPORTED"), P("The tight shoes made her feet grow.", "D-PLAUSIBLE-UNSUPPORTED"), P("Wet shoes made her toes feel cold.", "D-OPPOSITE")]),
    it("because_sentence", 1, 1, 3,
      "The bread stayed uncovered on the board overnight. Air dried out its soft edges. By morning, the slices felt hard. Dad wrapped the next loaf after breakfast.",
      "Choose the sentence that says it best.",
      [K("The bread dried because it was left uncovered."), P("The bread was uncovered because it had dried.", "D-PLAUSIBLE-UNSUPPORTED"), P("The bread dried because the board got cold.", "D-PLAUSIBLE-UNSUPPORTED"), P("The bread stayed soft because Dad wrapped it.", "D-OPPOSITE")]),
    it("because_sentence", 1, 1, 4,
      "Kip made a ramp that sloped down. He let go of a marble at the top. The slope made it roll toward the floor. It stopped when it hit the wall.",
      "Choose the sentence that says it best.",
      [K("The slope made the marble roll down."), P("The marble made the ramp slope down.", "D-PLAUSIBLE-UNSUPPORTED"), P("The wall made the marble start rolling.", "D-PLAUSIBLE-UNSUPPORTED"), P("The rug made the marble roll upward.", "D-OPPOSITE")]),
    it("because_sentence", 1, 2, 5,
      "Rainwater washed a worm onto the busy path. A shoe nearly stepped on it. Lina used a leaf to move it away. This kept it safe from passing feet.",
      "Choose the sentence that says it best.",
      [K("Lina moved the worm to keep it safe."), P("The worm reached the path because Lina moved it.", "D-SEQUENCE-SWAP"), P("Lina moved the worm because it needed some food.", "D-PLAUSIBLE-UNSUPPORTED"), P("Lina left the worm because the path was safe.", "D-OPPOSITE")]),
    it("because_sentence", 1, 2, 6,
      "The dog came in wearing Dad's large hat. Ivy saw the hat and started laughing. Her family looked at the dog too. They also laughed at its funny hat.",
      "Choose the sentence that says it best.",
      [K("The hat on the dog made people laugh."), P("People laughing made the dog fetch the hat.", "D-PLAUSIBLE-UNSUPPORTED"), P("A joke in the newspaper made people laugh.", "D-PLAUSIBLE-UNSUPPORTED"), P("The hat falling down made the dog bark.", "D-OPPOSITE")]),
    it("because_sentence", 1, 2, 7,
      "The candle flame stayed still in the hall. Dad opened the door and let air blow through. The moving air made the flame bend. It flickered until he shut the door.",
      "Choose the sentence that says it best.",
      [K("Air from the open door bent the flame."), P("The bending flame pushed the door open.", "D-PLAUSIBLE-UNSUPPORTED"), P("Wax from the candle held the door open.", "D-PLAUSIBLE-UNSUPPORTED"), P("Dad shut the door to make wind blow.", "D-OPPOSITE")]),
    it("because_sentence", 1, 2, 8,
      "Suki had a calm bedtime routine. Papa dimmed the lamp and read a story. The quiet room helped her relax. Soon her eyes closed and she fell asleep.",
      "Choose the sentence that says it best.",
      [K("The quiet evening helped her go to sleep."), P("Her sleeping made the quiet evening begin.", "D-PLAUSIBLE-UNSUPPORTED"), P("Papa’s loud voice kept her awake all night.", "D-PLAUSIBLE-UNSUPPORTED"), P("The bright lamp made her leap out of bed.", "D-OPPOSITE")]),

    // ============ LEVEL 2 · chain (8) ============
    it("chain", 2, 1, 1,
      "A wasp flew through the window toward an open jam jar. Uncle Josh jumped back when he saw it. His elbow hit a flour bag, tipping it over. Flour fell onto the dishes below. He put the jam away before cleaning the dishes.",
      "What happened DIRECTLY before the flour fell?",
      [K("his elbow tipped the flour bag over"), P("the wasp flew toward the open jam", "D-PLAUSIBLE-UNSUPPORTED"), P("flour landed on the dishes below", "D-PLAUSIBLE-UNSUPPORTED"), P("he put away the open jam jar", "D-OPPOSITE")],
      { note: "Identify the immediate link in a four-event chain." }),
    it("chain", 2, 1, 2,
      "Cold weather cracked the clay pot on the balcony. Soil fell through the crack during the week. Without enough soil holding it, the rosemary became loose. Wind then tipped the plant and pot over. The crash made pigeons fly away.",
      "Why was the rosemary loose before the wind came?",
      [K("too little soil held its roots"), P("the flying pigeons hit its leaves", "D-PLAUSIBLE-UNSUPPORTED"), P("the falling pot frightened the pigeons", "D-PLAUSIBLE-UNSUPPORTED"), P("the frost made its leaves grow heavier", "D-OPPOSITE")], { note: "Trace how the cracked pot changed the support around the roots." }),
    it("chain", 2, 1, 3,
      "Dee left the bath tap running to answer her phone. Water rose over the bath's edge during the long call. It ran through a gap beside the pipe. The water then made a mark on the ceiling below. Dee saw the mark after ending the call.",
      "What carried water to the ceiling below?",
      [K("water ran through the gap by the pipe"), P("Dee left the room to answer her phone", "D-PLAUSIBLE-UNSUPPORTED"), P("Dee ended the call and put her phone down", "D-PLAUSIBLE-UNSUPPORTED"), P("water rose to the edge of the bath", "D-OPPOSITE")], { note: "Locate the connecting link, not the start or later discovery." }),
    it("chain", 2, 1, 4,
      "Rain flooded the field, so the game moved to the yard. The yard's hard ground made the balls bounce very high. Those high bounces carried balls over the fence. Seven balls landed among Mr. Njoku's tomato plants that afternoon.",
      "What DIRECTLY made the balls bounce over the fence?",
      [K("the hard surface making high bounces"), P("the muddy surface holding deep water", "D-PLAUSIBLE-UNSUPPORTED"), P("the players planting tall tomato plants", "D-PLAUSIBLE-UNSUPPORTED"), P("the fence being moved nearer the field", "D-OPPOSITE")],
      { note: "Ask explicitly for the immediate physical cause, not the upstream rain." }),
    it("chain", 2, 2, 5,
      "A cup held the freezer door open during the party. Ice cream melted and dripped onto two bags of peas. Dad removed the cup and shut the door. The freezer grew cold again. The drops froze, sticking the bags together.",
      "What DIRECTLY made the pea bags stick together?",
      [K("the drops turning back into ice"), P("the door staying open at first", "D-PLAUSIBLE-UNSUPPORTED"), P("Dad taking the cup off the shelf", "D-PLAUSIBLE-UNSUPPORTED"), P("the guests putting peas in bags", "D-OPPOSITE")], { note: "Follow melting and refreezing as two different stages." }),
    it("chain", 2, 2, 6,
      "A backpack pressed several buttons in the crowded lift. That made the lift stop at every floor. Each stop took more time on Priya's trip upstairs. She reached the dentist after her appointment time. She heard her name as she left the lift.",
      "What delayed Priya on the way upstairs?",
      [K("stops at every floor delayed her"), P("a wrong button sent her downstairs", "D-PLAUSIBLE-UNSUPPORTED"), P("her dentist called before the agreed time", "D-PLAUSIBLE-UNSUPPORTED"), P("she forgot which floor the dentist used", "D-OPPOSITE")], { note: "Separate the time-consuming middle action from its trigger and consequence." }),
    it("chain", 2, 2, 7,
      "A gust of wind broke the kite's tail. Without a tail, the kite started to spin. That spin wound its string around a flagpole. The kite stayed there until the school cleaner fetched a ladder.",
      "What wound the string around the flagpole?",
      [K("its uncontrolled turning twisted the line"), P("the cleaner wound its string around the pole", "D-PLAUSIBLE-UNSUPPORTED"), P("the wind blew the ladder into the string", "D-PLAUSIBLE-UNSUPPORTED"), P("the flagpole bent and caught the kite’s tail", "D-OPPOSITE")], { note: "Identify the middle motion linking damage to the tangled string." }),
    it("chain", 2, 2, 8,
      "Amir's hot shower made the bathroom mirror steam up. He wiped it with a towel. Small towel threads stayed on the damp glass. When the glass dried, he could see those threads. He washed the mirror to remove them.",
      "Why did Amir wash the mirror after wiping it?",
      [K("threads from the towel showed on the glass"), P("steam from the shower covered the whole glass", "D-PLAUSIBLE-UNSUPPORTED"), P("water from the tap ran into the bath", "D-PLAUSIBLE-UNSUPPORTED"), P("soap from the shelf fell onto the towel", "D-OPPOSITE")], { note: "Combine the first repair with the new problem it caused." }),

    // ============ LEVEL 2 · multiple_causes (8) ============
    it("multiple_causes", 2, 1, 1,
      "The fair made more money than usual. Warm, dry weather kept visitors there all afternoon. A new cake stand was very popular and sold out. More families also came because it was a local holiday. The helpers counted the money after closing.",
      "Which reason for success is NOT given?",
      [K("the fair lowered all its prices"), P("visitors stayed in the good weather", "D-PLAUSIBLE-UNSUPPORTED"), P("many people bought cakes at the stand", "D-PLAUSIBLE-UNSUPPORTED"), P("more families came on the holiday", "D-OPPOSITE")],
      { note: "NOT-a-cause format: three real causes, one invented" }),
    it("multiple_causes", 2, 1, 2,
      "Rui stayed awake late reading his comic. His phone battery ran out, so its alarm did not ring. Thick curtains also kept his room dark after sunrise. Those things helped him sleep past his usual waking time.",
      "Which reason for oversleeping is NOT given?",
      [K("someone moved his clock to a later time"), P("he was tired after staying up late", "D-PLAUSIBLE-UNSUPPORTED"), P("his phone alarm could not ring", "D-PLAUSIBLE-UNSUPPORTED"), P("his curtains kept the room dark", "D-OPPOSITE")]),
    it("multiple_causes", 2, 1, 3,
      "Grandpa watered his cactus much more often than it needed. Its pot had no hole to drain extra water. The roots stayed wet and began to rot. Cold air by the window made the plant weaker too.",
      "Which cause of damage is NOT described?",
      [K("the cactus received too little water"), P("the cactus received water too often", "D-PLAUSIBLE-UNSUPPORTED"), P("the pot kept water around the roots", "D-PLAUSIBLE-UNSUPPORTED"), P("the window let cold air reach it", "D-OPPOSITE")],
      { note: "the invented option is the intuitive-but-backwards cause" }),
    it("multiple_causes", 2, 1, 4,
      "Several children had colds when they came to school. Rain kept the class crowded indoors all week. The windows stayed shut, so little fresh air came inside. Germs could spread easily in the crowded room. By Friday, more children had colds.",
      "Which reason for spreading colds is NOT given?",
      [K("children spent too much time outside"), P("children with colds came into school", "D-PLAUSIBLE-UNSUPPORTED"), P("children crowded together in one room", "D-PLAUSIBLE-UNSUPPORTED"), P("children had little fresh air indoors", "D-OPPOSITE")]),
    it("multiple_causes", 2, 2, 5,
      "The old swing rope was worn after years of weather. Its knot rubbed against a rough branch on every swing. On Sunday, two children sat on the seat together. The worn rope broke under their weight.",
      "Which cause of the break is NOT mentioned?",
      [K("someone had cut part of the rope"), P("rain and sun had worn the rope", "D-PLAUSIBLE-UNSUPPORTED"), P("the knot had rubbed against the branch", "D-PLAUSIBLE-UNSUPPORTED"), P("two riders had added weight together", "D-OPPOSITE")]),
    it("multiple_causes", 2, 2, 6,
      "A food show put the bakery on television that week. The other bakery in town was closed for repairs. Saturday was also the first day for its special plum tarts. All these things brought a long line of customers.",
      "Which reason for the line is NOT given?",
      [K("the bakery sold everything at half price"), P("people had seen the bakery on television", "D-PLAUSIBLE-UNSUPPORTED"), P("the other bakery was closed for repairs", "D-PLAUSIBLE-UNSUPPORTED"), P("the special plum tarts went on sale", "D-OPPOSITE")]),
    it("multiple_causes", 2, 2, 7,
      "The phone rang while the family made lunch. A loud blender mixed a drink. The radio played music at full volume. Cushions also covered the phone, making its sound quieter. Nobody heard it above the other noises.",
      "Which reason for missing the call is NOT given?",
      [K("a loud drill was working next door"), P("the blender made a lot of noise", "D-PLAUSIBLE-UNSUPPORTED"), P("the radio was playing very loudly", "D-PLAUSIBLE-UNSUPPORTED"), P("cushions made the phone sound quieter", "D-OPPOSITE")]),
    it("multiple_causes", 2, 2, 8,
      "Rowing home was hard that afternoon. The tide moved against the little boat. Wind from the shore pushed against it too. Both rowers had tired arms after a long swim. They rested before trying the last part of the trip.",
      "Which reason for slow rowing is NOT given?",
      [K("water leaked into the bottom of the boat"), P("the tide moved against the little boat", "D-PLAUSIBLE-UNSUPPORTED"), P("wind pushed back against the little boat", "D-PLAUSIBLE-UNSUPPORTED"), P("the rowers had tired arms from swimming", "D-OPPOSITE")]),

    // ============ LEVEL 2 · reversal_trap (8) ============
    it("reversal_trap", 2, 1, 1,
      "Children often gathered wherever the school cat sat. A visitor thought their voices called the cat over. The teacher watched more carefully. The cat chose a sunny place first. Only then did children walk over to sit nearby.",
      "What caused the children and the cat to gather in the same place?",
      [K("the children followed the cat's choice"), P("the cat followed the children's choice", "D-PLAUSIBLE-UNSUPPORTED"), P("the teacher chose a place for both", "D-PLAUSIBLE-UNSUPPORTED"), P("the visitor called the cat to them", "D-OPPOSITE")]),
    it("reversal_trap", 2, 1, 2,
      "Jo won three races while wearing her red socks. She said the socks had made her faster. Her coach showed her the training chart from two months. She had practiced on every marked day. The coach said that work had made her faster.",
      "What does the passage suggest REALLY made Jo fast?",
      [K("the training she had done regularly"), P("the red socks she wore that day", "D-PLAUSIBLE-UNSUPPORTED"), P("the prizes she received after racing", "D-PLAUSIBLE-UNSUPPORTED"), P("the cheering she heard after winning", "D-OPPOSITE")]),
    it("reversal_trap", 2, 1, 3,
      "A board creaked whenever Dad fetched the dog food. Biscuit heard it and came into the kitchen. A visitor thought the creak made food appear. Dad explained that his steps made the noise. He was bringing food because it was feeding time.",
      "What REALLY brought the food?",
      [K("the dog’s meal was due, so Dad fetched it"), P("Biscuit’s arrival made the food bowl fill itself", "D-PLAUSIBLE-UNSUPPORTED"), P("the creaking board made food appear in the kitchen", "D-PLAUSIBLE-UNSUPPORTED"), P("the visitor’s steps opened the cupboard of dog food", "D-OPPOSITE")]),
    it("reversal_trap", 2, 1, 4,
      "The crowd sang loudly, encouraging the band to play harder. Hearing the louder band, the crowd sang even louder. The band responded by playing harder again. Both groups kept encouraging each other through the final song.",
      "What does the passage say about the noise?",
      [K("each group made the other get louder"), P("only the band made the crowd louder", "D-PLAUSIBLE-UNSUPPORTED"), P("only the crowd made the band louder", "D-PLAUSIBLE-UNSUPPORTED"), P("each group became quieter as the other sang", "D-OPPOSITE")],
      { note: "two-way causation — the honest answer is the loop itself" }),
    it("reversal_trap", 2, 2, 5,
      "Umbrellas opened all along the street as rain began. It might look as if opening umbrellas brought the rain. But the first drops landed before any umbrella opened. People opened them to keep those drops off their clothes.",
      "Why do umbrellas and rain arrive together?",
      [K("the rain made people open umbrellas"), P("opening umbrellas made the rain begin", "D-PLAUSIBLE-UNSUPPORTED"), P("people opened umbrellas to bring cooler air", "D-PLAUSIBLE-UNSUPPORTED"), P("opening umbrellas made the rain stop", "D-OPPOSITE")]),
    it("reversal_trap", 2, 2, 6,
      "Tam felt hungry when the ice cream music played. He thought the tune caused his hunger. Mom asked him to notice days without the truck. He was hungry at four on those days too. Lunch was early, and his body needed food again.",
      "What REALLY explains Tam's four o'clock hunger?",
      [K("a long gap since lunch made him hungry"), P("the truck's music always made him hungry", "D-PLAUSIBLE-UNSUPPORTED"), P("hearing Mom's question made him need food", "D-PLAUSIBLE-UNSUPPORTED"), P("buying ice cream made the truck arrive", "D-OPPOSITE")]),
    it("reversal_trap", 2, 2, 7,
      "A rooster crowed as the sky began to brighten. The farmer joked that its crow had lifted the sun. But dawn came on quiet mornings too. The rooster noticed the early light and began crowing.",
      "Which explanation does the passage support?",
      [K("the brightening sky prompted the bird’s call"), P("the rooster’s crow brought the morning light", "D-PLAUSIBLE-UNSUPPORTED"), P("the farmer’s joke made the sky grow bright", "D-PLAUSIBLE-UNSUPPORTED"), P("the fading daylight made the rooster call", "D-OPPOSITE")]),
    it("reversal_trap", 2, 2, 8,
      "Big fires often have more firefighters than small fires. Ana wondered which event happened first. Her poster showed that a fire grows before extra crews arrive. More crews are called because a fire has become large.",
      "According to the poster, which event caused the other?",
      [K("a larger fire brings extra firefighters"), P("extra firefighters make a fire grow larger", "D-PLAUSIBLE-UNSUPPORTED"), P("fewer firefighters always stop a fire growing", "D-PLAUSIBLE-UNSUPPORTED"), P("a poster tells firefighters to light a fire", "D-OPPOSITE")]),

    // ============ RETENTION RESERVE (8 L1 + 8 L2) ============
    it("find_effect", 1, 1, 9,
      "Joss shook the fizzy drink can all afternoon. Tiny bubbles built up inside the closed can. When Dad opened it, foam sprayed out. It splashed across the tablecloth.",
      "What happened because the can was shaken?",
      [K("foam sprayed from the open can"), P("the drink froze inside the can", "D-PLAUSIBLE-UNSUPPORTED"), P("the lid fell inside the can", "D-PLAUSIBLE-UNSUPPORTED"), P("Dad put the can on the table", "D-OPPOSITE")], { retention: true }),
    it("find_effect", 1, 2, 10,
      "Ben left his flashlight shining all night. Using it for so long drained the batteries. The beam was weak when he picked it up. Soon the light went out completely.",
      "What happened because the flashlight stayed on all night?",
      [K("the batteries lost their power"), P("the bulb grew much brighter", "D-PLAUSIBLE-UNSUPPORTED"), P("the glass cracked from a fall", "D-PLAUSIBLE-UNSUPPORTED"), P("Ben switched it on at night", "D-OPPOSITE")], { retention: true }),
    it("find_cause", 1, 1, 9,
      "Auntie Bel could not be near cats without sneezing. The doctor called it a cat allergy. At her neighbor's house, a cat climbed onto her. Her eyes watered and she started sneezing.",
      "Why was Auntie Bel sneezing?",
      [K("being near the cat affected her"), P("a cold began after she said hello", "D-PLAUSIBLE-UNSUPPORTED"), P("her watering eyes frightened the cat", "D-PLAUSIBLE-UNSUPPORTED"), P("the cat scratched her while she sat", "D-OPPOSITE")], { retention: true }),
    it("find_cause", 1, 2, 10,
      "Strawberries stayed forgotten in the fridge for weeks. Over time, they spoiled and grew gray mold. Val found the old box behind the milk. She threw those spoiled berries away.",
      "Why was mold covering the strawberries?",
      [K("the fruit was left long enough to spoil"), P("the fridge was kept cold all night", "D-PLAUSIBLE-UNSUPPORTED"), P("Val moved the box away from the milk", "D-PLAUSIBLE-UNSUPPORTED"), P("the box was opened just before eating", "D-OPPOSITE")], { retention: true }),
    it("because_sentence", 1, 1, 9,
      "Otto kicked the bath plug out by mistake. Water then escaped through the open drain. Nobody noticed until the bath was almost empty. Otto found the plug beside his foot.",
      "Choose the sentence that says it best.",
      [K("The loose plug let water escape from the bath."), P("The empty bath made Otto kick out the plug.", "D-PLAUSIBLE-UNSUPPORTED"), P("The cold water made the plug leave the drain.", "D-PLAUSIBLE-UNSUPPORTED"), P("The bath stayed full while the plug was out.", "D-OPPOSITE")], { retention: true }),
    it("because_sentence", 1, 2, 10,
      "Nia let go of her balloon inside the room. Then a fan blew air toward it. The air pushed it across the floor. It stopped when it reached the curtain.",
      "Choose the sentence that says it best.",
      [K("The fan's moving air pushed the balloon."), P("The balloon's movement switched on the fan.", "D-PLAUSIBLE-UNSUPPORTED"), P("The curtain pulled the balloon across the room.", "D-PLAUSIBLE-UNSUPPORTED"), P("The balloon pushed air back through the fan.", "D-OPPOSITE")], { retention: true }),
    it("find_effect", 1, 1, 11,
      "Pia sat by the beach holding her fries. A gull flew down toward the food. It grabbed the largest fry with its beak. Then it flew away carrying the stolen food.",
      "What happened because the seagull swooped?",
      [K("the gull carried away a fry"), P("Pia carried away the gull", "D-PLAUSIBLE-UNSUPPORTED"), P("the gull dropped all the fries", "D-PLAUSIBLE-UNSUPPORTED"), P("Pia fed the gull a fish", "D-OPPOSITE")], { retention: true }),
    it("find_cause", 1, 1, 11,
      "Dad pushed a cart through the grocery shop. One front wheel kept making a squeak. Gum stuck in that wheel stopped it turning freely. Dad removed the gum, and the squeak stopped.",
      "Why did the cart squeak?",
      [K("gum was catching in a wheel"), P("food was pressing on the handle", "D-PLAUSIBLE-UNSUPPORTED"), P("the floor was wet beside the cart", "D-PLAUSIBLE-UNSUPPORTED"), P("Dad was pushing an empty cart", "D-OPPOSITE")], { retention: true }),
    it("chain", 2, 1, 9,
      "Marta drank fizzy lemonade too quickly and began to hiccup. The hiccups made her laugh. Laughing made it harder to take another sip. She set the drink down until the hiccups stopped. Then she drank more slowly.",
      "What started the whole chain?",
      [K("taking hurried sips of a bubbly drink"), P("laughing when the first hiccup began", "D-PLAUSIBLE-UNSUPPORTED"), P("leaving the fizzy lemonade on the table", "D-PLAUSIBLE-UNSUPPORTED"), P("waiting until the laughing and hiccups stopped", "D-OPPOSITE")], { retention: true }),
    it("chain", 2, 2, 10,
      "The paint tin stayed open overnight. A dry skin formed across its surface. Dad stirred that skin into the liquid paint. Bits of skin left small bumps on the painted door. He sanded the dry coat smooth before repainting it.",
      "What was wrong with the door's first coat of paint?",
      [K("its surface felt lumpy instead of smooth"), P("its surface stayed wet after the tin was closed", "D-PLAUSIBLE-UNSUPPORTED"), P("its surface had places without any paint", "D-PLAUSIBLE-UNSUPPORTED"), P("its surface showed long hairs from the brush", "D-OPPOSITE")],
      { retention: true, note: "the open tin is the first link; the operative cause of repainting is the lumpy coat" }),
    it("multiple_causes", 2, 1, 9,
      "The clothes took all day to dry outside. The morning air was misty and damp. The line hung in a shady part of the yard. The clothes were also very wet when Mom hung them up.",
      "Which reason for slow drying is NOT given?",
      [K("rain fell on the washing all day"), P("the air was damp in the morning", "D-PLAUSIBLE-UNSUPPORTED"), P("the washing line stayed in the shade", "D-PLAUSIBLE-UNSUPPORTED"), P("the clothes went on the line very wet", "D-OPPOSITE")], { retention: true }),
    it("multiple_causes", 2, 2, 10,
      "The hamster escaped through a loose cage door. Its latch did not click shut firmly. A nearby shelf gave it a way down to the floor. Nobody checked the door after the evening feed. The cage was empty next morning.",
      "Which possible cause is NOT in the passage?",
      [K("a child took the hamster home"), P("the door latch did not hold firmly", "D-PLAUSIBLE-UNSUPPORTED"), P("a shelf made a route to the floor", "D-PLAUSIBLE-UNSUPPORTED"), P("the door was not checked after feeding", "D-OPPOSITE")], { retention: true }),
    it("reversal_trap", 2, 1, 9,
      "During sunny weather, ice cream sales went up. Sunburn became more common at the same time. Children checked why both things happened. The sun made people want cold treats. Sunlight also caused skin to burn. The treats did not cause the sunburn.",
      "What REALLY links ice cream and sunburn?",
      [K("sunny weather brings both changes"), P("buying ice cream causes skin to burn", "D-PLAUSIBLE-UNSUPPORTED"), P("getting sunburn makes people buy cones", "D-PLAUSIBLE-UNSUPPORTED"), P("selling more cones makes sunlight stronger", "D-OPPOSITE")], { retention: true }),
    it("reversal_trap", 2, 2, 10,
      "Grandpa yawned as the streetlights came on each evening. He joked that his yawn switched them on. A light sensor actually switched them on when darkness came. Grandpa grew sleepy because it was late in his day. Neither event caused the other one.",
      "What REALLY explains the lights and the yawns?",
      [K("both happen as the day grows late"), P("his first yawn switches the lights on", "D-PLAUSIBLE-UNSUPPORTED"), P("the streetlights always make him yawn", "D-PLAUSIBLE-UNSUPPORTED"), P("his chair controls the streetlight switch", "D-OPPOSITE")], { retention: true }),
    it("chain", 2, 1, 11,
      "Theo carried a magnet beside his compass. The magnet pulled the needle away from its correct direction. The group followed that wrong direction at a path junction. They walked in a loop back to their starting point.",
      "What made the compass show the wrong direction?",
      [K("a magnetic object near the pointer"), P("the group following a sign at the junction", "D-PLAUSIBLE-UNSUPPORTED"), P("the group walking back to its starting point", "D-PLAUSIBLE-UNSUPPORTED"), P("rain entering the compass beside the path", "D-OPPOSITE")], { retention: true }),
    it("multiple_causes", 2, 1, 11,
      "The cake candles kept going out. Air blew through the open back door. The ceiling fan pushed more air across the cake. Two cousins laughed so close that their breath reached the flames. Mom moved the cake into a still corner.",
      "Which cause of the flames going out is NOT given?",
      [K("rainwater had made the candles wet"), P("air blew through the open back door", "D-PLAUSIBLE-UNSUPPORTED"), P("the ceiling fan pushed air at the cake", "D-PLAUSIBLE-UNSUPPORTED"), P("the cousins breathed right at the flames", "D-OPPOSITE")], { retention: true }),
    // Fresh retry stock: four additional questions in each phase.
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "The tent pegs pulled loose in the strong wind. Without the pegs, one side of the tent fell.",
      "prompt": "Why did the tent fall?",
      "choices": [K("the wind loosened the pegs"), P("the wind stopped before dawn", "D-PLAUSIBLE-UNSUPPORTED"), P("the pegs held the tent firmly", "D-PLAUSIBLE-UNSUPPORTED"), P("the rain washed the tent clean", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "The cup had a small hole in its base. As Jo filled it, water leaked onto the table.",
      "prompt": "What happened because of the hole?",
      "choices": [
        {
          "t": "water escaped from the cup",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the table made the cup wobble",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Jo put the cup away empty",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the tap stopped running water",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "A ball rolled into the open doorway. It blocked the door. Mia could not close it.",
      "prompt": "Which sentence explains what happened?",
      "choices": [
        {
          "t": "Mia could not shut the door because it was blocked.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Mia could not shut the door because she lost it.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The ball moved outside because the door was closed.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The doorway opened because Mia put the ball away.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "The sign pointed left toward the hall. Dad followed it and reached the hall without asking.",
      "prompt": "Why did Dad turn left?",
      "choices": [K("a direction marker guided him there"), P("the hall had no sign beside it", "D-PLAUSIBLE-UNSUPPORTED"), P("the hall was closed for repair work", "D-PLAUSIBLE-UNSUPPORTED"), P("he wanted to leave the hall quickly", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Asha added more paper clips to her model bridge. Their weight became too much, and the bridge bent.",
      "prompt": "What did the extra weight do?",
      "choices": [
        {
          "t": "made the model bridge bend",
          "r": "KEY",
          "k": true
        },
        {
          "t": "made the bridge grow wider",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "helped the bridge hold more weight",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "removed clips from the bridge",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "The room was dark until Lee opened the curtains. Sunlight came through, making the room bright.",
      "prompt": "Which sentence explains what happened?",
      "choices": [
        {
          "t": "The room brightened because Lee let sunlight enter.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Lee closed the curtains because sunlight was entering.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The sun rose because Lee opened the curtains.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The room darkened because the curtains were open.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "A red label warned that the paint was wet. Theo saw it and chose a different bench.",
      "prompt": "Why did Theo choose another bench?",
      "choices": [K("he wanted to avoid the wet paint"), P("he saw that the label had fallen off", "D-PLAUSIBLE-UNSUPPORTED"), P("he wanted to sit on the wet paint", "D-PLAUSIBLE-UNSUPPORTED"), P("he saw that the painted bench was dry", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "The wheel’s screw was loose, so it kept wobbling. Eva tightened the screw. Then the wheel turned smoothly.",
      "prompt": "What happened after Eva tightened the screw?",
      "choices": [
        {
          "t": "the wheel stopped wobbling",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the screw came loose again",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the wheel fell off completely",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the wheel stopped turning at all",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "Leaves blocked the drain, so rainwater could not flow away. Water gathered on the path and froze overnight. In the morning, the caretaker closed the slippery path.",
      "prompt": "Why was the path closed?",
      "choices": [
        {
          "t": "standing water had turned into slippery ice",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the drain had been cleared of all its leaves",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the caretaker had forgotten where the path went",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the rain had stopped before the water gathered",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "The cake sank because the oven door opened too soon. The baker had also used too little flour. She kept the correct cooking time and used fresh eggs.",
      "prompt": "Which cause is NOT given for the sinking cake?",
      "choices": [
        {
          "t": "the eggs were too old to use",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the oven door opened before it should",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the mixture contained too little flour",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "both the early opening and missing flour",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "The heater warmed the room, and then the ice sculpture melted. Turning the heater off slowed the melting. The sculpture had stayed solid before the room became warm.",
      "prompt": "Which cause and effect fits the evidence?",
      "choices": [
        {
          "t": "the heater’s warmth caused the ice to melt",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the melting ice caused the heater to switch on",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the solid ice caused the room to become warmer",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "switching off the heater caused faster melting",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "The printer ran out of paper, so the notices were delayed. Without notices, families did not know the new meeting time. Only a few arrived when the meeting began.",
      "prompt": "Why did few families arrive at the new time?",
      "choices": [
        {
          "t": "the delayed notices had not told them about it",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the printer had sent them the new time early",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the meeting had already finished before anyone knew",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the families had voted to cancel the meeting",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "Several walkers arrived late because a fallen tree blocked the path. Heavy rain also slowed their progress. Their map was correct, and everyone had left on time.",
      "prompt": "Which cause of lateness is NOT supported?",
      "choices": [
        {
          "t": "the walkers followed an incorrect map",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the fallen tree blocked their usual path",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "heavy rain slowed their walking speed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "both the fallen tree and the rain",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "A bus broke down, leaving fewer buses on the route. More people waited at each stop. The next bus filled up and could not take everyone.",
      "prompt": "Why could some passengers not board the next bus?",
      "choices": [
        {
          "t": "fewer working buses had made that bus too full",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the passengers had arrived before any bus broke down",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the stops had been moved away from the route",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "more empty buses had arrived at the same time",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "A loose roof tile let rain drip onto the ceiling. The wet patch grew during each storm. After the tile was replaced, the ceiling stayed dry.",
      "prompt": "Which explanation matches the events?",
      "choices": [
        {
          "t": "the damaged roof let water make the ceiling wet",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the wet ceiling made the rain fall onto the roof",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the new tile caused the old wet patch to grow",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the dry weather broke the tile during the repair",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 23,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "A freezer alarm warned that its door had been left open. The warm air softened the frozen food. Staff moved the food to another freezer before it fully thawed.",
      "prompt": "What directly made the food soften?",
      "choices": [
        {
          "t": "warm air entering through the open door",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the alarm sounding inside the cold room",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "staff moving it into another working freezer",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the freezer door being closed after the move",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    }
]
};
