// Individually authored comprehension evidence; normal and reserve items share the same quality requirements.
export default {
  "skillId": "cause_effect",
  "skillName": "Cause and Effect",
  "items": [
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "The nights stayed below freezing all week. The pond water turned to solid ice. On Saturday, ducks stood on its frozen top. Their flat feet slid as they tried walking.",
      "prompt": "What happened BECAUSE the nights were so cold?",
      "choices": [
        {
          "t": "ice covered the pond",
          "r": "KEY",
          "k": true
        },
        {
          "t": "ducks covered the pond",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "snow covered the pond",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "leaves covered the pond",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Zack tipped a seed packet too quickly. Seeds fell onto the path beside the flowers. Pigeons saw the seeds and flew down. They pecked at the food on the path.",
      "prompt": "What happened because the seeds spilled on the path?",
      "choices": [
        {
          "t": "birds landed to eat the seeds",
          "r": "KEY",
          "k": true
        },
        {
          "t": "flowers grew across the path",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Zack poured seeds from a packet",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "Zack moved seeds into the flowers",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "The door made a loud noise when opened. Grandma added oil to its stiff hinge. She moved the door to spread the oil. The door then opened quietly without waking Baby.",
      "prompt": "What happened BECAUSE Grandma oiled the hinge?",
      "choices": [
        {
          "t": "the door made no noise",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the door made a loud noise",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the door woke the sleeping baby",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the door’s hinge fell onto the floor",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "No one watered the plant during school break. The break lasted two hot weeks. Its soil became hard and dry. Without water, the leaves began to droop. Children saw the bent leaves when they returned.",
      "prompt": "What happened because the plant had no water?",
      "choices": [
        {
          "t": "the leaves hung down",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the leaves grew larger",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the pot grew heavier",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the soil stayed damp",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Dad left crayons in the very hot car. Heat softened their wax during the day. After lunch, Mina opened the crayon box. The crayons had melted into one colorful lump.",
      "prompt": "What did the hot car do to the crayons?",
      "choices": [
        {
          "t": "the wax colors melted together",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the wax colors broke apart",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the box filled with rainwater",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the box fell off the seat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Leah rubbed a balloon against her soft woollen sweater. Rubbing gave it a tiny electric charge. She held it near her head. The charge pulled her hair toward the balloon.",
      "prompt": "What happened because Leah rubbed the balloon?",
      "choices": [
        {
          "t": "her hair rose toward the balloon",
          "r": "KEY",
          "k": true
        },
        {
          "t": "her hair fell across her face",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her sweater pulled her arm down",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her sweater made the balloon burst",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Snow fell so deeply that roads became unsafe. The school could not open for lessons. Amini heard its name on the radio. Her school was listed among the closed schools.",
      "prompt": "What happened because of the deep snow?",
      "choices": [
        {
          "t": "Amini’s lessons were cancelled",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Amini left her lessons early",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Amini bought a warmer coat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Amini caught a different bus",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Omar forgot the lid on the popcorn pot. The hot corn started to pop and jump. With no lid, pieces flew out. They landed on the counter and kitchen floor.",
      "prompt": "What happened because the lid was off?",
      "choices": [
        {
          "t": "corn spilled outside the pot",
          "r": "KEY",
          "k": true
        },
        {
          "t": "corn stayed under the pot’s lid",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the pot stopped the corn popping",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the lid fell onto the floor",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Water boiled inside the kettle on the stove. Its lid was firmly in place. Steam pushed through the whistle in its lid. The whistle made a loud sound. Auntie took the kettle off the heat.",
      "prompt": "What made the loud whistle sound?",
      "choices": [
        {
          "t": "steam rushing out through the lid",
          "r": "KEY",
          "k": true
        },
        {
          "t": "water pouring out of the kettle",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the lid falling onto the stove",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Auntie lifting the kettle off the heat",
          "r": "D-CAUSE-REVERSE"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Bruno heard the wooden gate creak outside the house. That noise made him bark. Then a delivery worker rang the doorbell. Bruno had barked before the worker reached the door.",
      "prompt": "Why did Bruno bark before the doorbell rang?",
      "choices": [
        {
          "t": "he heard the gate open",
          "r": "KEY",
          "k": true
        },
        {
          "t": "he heard the doorbell ring",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "he saw food in a bowl",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "he saw someone at the window",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Hana drew a chalk rocket on the path. Rain fell on it through the night. Water washed away most of the chalk. Only a faint pink mark remained next morning.",
      "prompt": "Why did the rocket drawing disappear?",
      "choices": [
        {
          "t": "rain carried the chalk away",
          "r": "KEY",
          "k": true
        },
        {
          "t": "feet rubbed the chalk away",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Hana swept the chalk away",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "wind blew the chalk away",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Milly carried ice cream on a warm walk. The heat softened it until it started dripping. She licked fast to catch the drops. White drops still ran down onto her fingers.",
      "prompt": "Why was the ice cream dripping?",
      "choices": [
        {
          "t": "heat turned the ice cream soft",
          "r": "KEY",
          "k": true
        },
        {
          "t": "licking made the cone turn soft",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a hole let water through the cone",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her fingers squeezed through the cone",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Finn called hello inside an empty tunnel. His voice hit the hard walls. The sound bounced back toward his ears. Finn heard his own hello again. Only Finn was inside that tunnel.",
      "prompt": "What sent Finn's voice back to his ears?",
      "choices": [
        {
          "t": "sound returning from the tunnel walls",
          "r": "KEY",
          "k": true
        },
        {
          "t": "a person speaking outside the tunnel",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a train moving through the tunnel",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Finn calling again inside the tunnel",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Mo left his bike outside without shelter all winter. Rain kept wetting the bare metal. The wet metal slowly grew orange rust. By spring, the chain was stiff and rusty.",
      "prompt": "Why did the bike get rusty?",
      "choices": [
        {
          "t": "the metal stayed wet from rain",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the metal dried in warm winter sun",
          "r": "D-OPPOSITE"
        },
        {
          "t": "Mo oiled the chain before every ride",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Mo kept the chain away from rain",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Rosa built a sandcastle near the calm blue sea. Later, the tide rose up the beach. Waves washed over the castle walls. Water flattened them into a smooth little hill.",
      "prompt": "Why did the castle turn into a smooth hill?",
      "choices": [
        {
          "t": "waves covered the castle walls",
          "r": "KEY",
          "k": true
        },
        {
          "t": "wind lifted sand off the walls",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Rosa stamped on the castle walls",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a dog dug into the castle walls",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Two blue curtains hung in two different windows. Sun shone on one for many years. The light slowly made its color fade. The curtain in the shade stayed dark blue.",
      "prompt": "Why did one curtain become pale?",
      "choices": [
        {
          "t": "sunlight slowly faded one curtain",
          "r": "KEY",
          "k": true
        },
        {
          "t": "washing slowly shrank one curtain",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "rainwater slowly stained one curtain",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "someone replaced one old curtain",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "A moth saw a bright yellow porch light outside. The light drew it toward the house. It flew around the lamp again and again. The dark garden stayed behind it.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "The moth approached because the porch was bright.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The lamp shone because the moth flew around it.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "The moth approached because rain filled the garden.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The lamp dimmed because the moth left the garden.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "Pia's shoes fitted at the start of summer. Her feet grew during the following weeks. Now her toes pressed against the shoe ends. The tight shoes made her feet ache.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "Growing feet made the old shoes hurt.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Aching toes made the old shoes shrink.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "The tight shoes made her feet grow.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "Wet shoes made her toes feel cold.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "The bread stayed uncovered on the board overnight. No bag protected it from the dry air. Air dried out its soft edges. By morning, the slices felt hard. Dad wrapped the next loaf after breakfast.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "The bread dried because it was left uncovered.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The bread was uncovered because it had dried.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "The bread dried because the board got cold.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The bread stayed soft because Dad wrapped it.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "Kip made a ramp that sloped down. He let go of a marble at the top. The slope made it roll toward the floor. It stopped when it hit the wall.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "The slope made the marble roll down.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The marble made the ramp slope down.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "The wall made the marble start rolling.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The rug made the marble roll upward.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "Rainwater washed a worm onto the busy school path. A shoe nearly stepped on it. Lina used a leaf to move it away. This kept it safe from passing feet.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "Lina moved the worm to keep it safe.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The worm reached the path because Lina moved it.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "Lina moved the worm because it needed some food.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Lina left the worm because the path was safe.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "The dog came in wearing Dad's large woolly hat. Ivy saw the hat and started laughing. Her family looked at the dog too. They also laughed at its funny hat.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "The hat on the dog made people laugh.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "People laughing made the dog fetch the hat.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "A joke in the newspaper made people laugh.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The hat falling down made the dog bark.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "The candle flame stayed still in the hall. Dad opened the door and let air blow through. The moving air made the flame bend. It flickered until he shut the door.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "Air from the open door bent the flame.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The bending flame pushed the door open.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "Wax from the candle held the door open.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Dad shut the door to make wind blow.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "Suki had a calm and quiet bedtime routine. Papa dimmed the lamp and read a story. The quiet room helped her relax. Soon her eyes closed and she fell asleep.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "The quiet evening helped her go to sleep.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Her sleeping made the quiet evening begin.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "Papa’s loud voice kept her awake all night.",
          "r": "D-OPPOSITE"
        },
        {
          "t": "The bright lamp made her leap out of bed.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "A wasp flew through the window toward an open jam jar. Uncle Josh jumped back when he saw it. His elbow hit a flour bag, tipping it over. Flour fell onto the dishes below. He put the jam away before cleaning the dishes. The bag had been standing open near his arm. Its paper sides could not hold the powder once it tipped. The dishes were directly under the edge of the worktop. The insect never touched either the bag or the dishes.",
      "prompt": "What directly caused the flour to spill?",
      "choices": [
        {
          "t": "his elbow tipped the flour bag over",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the wasp flew toward the open jam",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "flour landed on the dishes below",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "he put away the open jam jar",
          "r": "D-CAUSE-STEP"
        }
      ],
      "media": "text",
      "note": "Identify the contact that spilled the flour, separating trigger, direct mechanism and later cleanup."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "Cold weather cracked the clay pot on the balcony. Soil fell through the crack during the week. Without enough soil holding it, the rosemary became loose. Wind then tipped the plant and pot over. The crash made pigeons fly away. The cracked container had once held the roots firmly upright. Losing that support left a space around the roots. The rosemary was already leaning before the strong gust arrived. The birds had been resting on a different balcony nearby.",
      "prompt": "Why was the rosemary loose before the wind came?",
      "choices": [
        {
          "t": "too little soil held its roots",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the strong wind tipped the plant over",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "the falling pot frightened the pigeons",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "frost had pulled the roots out of the soil",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Connect lost soil to loosened roots within a cold-to-fall chain, excluding the later startled birds."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "Dee left the bath tap running to answer her phone. Water rose over the bath's edge during the long call. It ran through a gap beside the pipe. The water then made a mark on the ceiling below. Dee saw the mark after ending the call. The ceiling mark was directly beneath that part of the bathroom. No pipe had burst inside the wall. A dry towel covered the floor on the other side. The open space around the pipe gave the spilled water a route.",
      "prompt": "Why did the overflowing water reach the ceiling below?",
      "choices": [
        {
          "t": "water ran through the gap by the pipe",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Dee left the room to answer her phone",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "Dee ending her long phone call",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "water rose to the edge of the bath",
          "r": "D-CAUSE-STEP"
        }
      ],
      "media": "text",
      "note": "Locate the pathway linking overflow upstairs to the mark below, rather than its initial distraction."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "Rain flooded the field, so the game moved to the yard. The yard's hard ground made the balls bounce very high. Those high bounces carried balls over the fence. Seven balls landed among Mr. Njoku's tomato plants that afternoon. The school used soft grass for games on dry days. Balls dropped there usually stayed close to the ground. In the yard, the same balls sprang up much farther. The fence had not changed, and the children used ordinary throws.",
      "prompt": "What DIRECTLY made the balls bounce over the fence?",
      "choices": [
        {
          "t": "the hard surface making high bounces",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the muddy surface holding deep water",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "the players planting tall tomato plants",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the fence being moved nearer the field",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the changed playing surface as the link between relocation and unexpectedly high bounces."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "A cup held the freezer door open during the party. Ice cream melted and dripped onto two bags of peas. Dad removed the cup and shut the door. The freezer grew cold again. The drops froze, sticking the bags together. The bags had been separate before the party began. The sticky drops were the only thing joining their surfaces. Cooling changed those drops from a liquid to something hard. Pulling gently at one bag moved the other bag with it.",
      "prompt": "What DIRECTLY made the pea bags stick together?",
      "choices": [
        {
          "t": "the drops turning back into ice",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the door staying open at first",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "Dad taking away the cup by the door",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "the guests putting peas in bags",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Follow melting and refreezing, distinguishing the original open door from the final joining mechanism."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "A backpack pressed several buttons in the crowded lift. That made the lift stop at every floor. Each stop took more time on Priya's trip upstairs. She reached the dentist after her appointment time. She heard her name as she left the lift. The lift moved at its usual speed between the floors. It had no fault, and the doors opened normally. At each empty landing, Priya still had to wait. The accidental button presses had added these waits to her journey.",
      "prompt": "What delayed Priya on the way upstairs?",
      "choices": [
        {
          "t": "stops at every floor delayed her",
          "r": "KEY",
          "k": true
        },
        {
          "t": "a wrong button sent her downstairs",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her dentist called before the agreed time",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she forgot which floor the dentist used",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Connect accidental selections to repeated waiting, excluding a mechanical fault or a changed appointment."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "A gust of wind broke the kite's tail. Without a tail, the kite started to spin. That spin wound its string around a flagpole. The kite stayed there until the school cleaner fetched a ladder. Before the tear, the kite had flown straight above the field. Its long tail had helped keep it steady in the air. The pole stood close to the place where it began turning. Nobody on the ground was winding the line around anything.",
      "prompt": "What wound the string around the flagpole?",
      "choices": [
        {
          "t": "its uncontrolled turning twisted the line",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the cleaner wound its string around the pole",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the wind blew the ladder into the string",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the flagpole bent and caught the kite’s tail",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Trace the missing stabiliser through spinning to the tangled line, rather than attributing it to the rescue."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "Amir's hot shower made the bathroom mirror steam up. He wiped it with a towel. Small towel threads stayed on the damp glass. When the glass dried, he could see those threads. He washed the mirror to remove them. The towel was old, with loose fibres along its edges. Those fibres caught on the wet surface during the first wipe. The steam itself cleared as the room cooled. Even after that, the tiny marks from the cloth were still visible.",
      "prompt": "Why did Amir wash the mirror after wiping it?",
      "choices": [
        {
          "t": "threads from the towel showed on the glass",
          "r": "KEY",
          "k": true
        },
        {
          "t": "steam from the shower covered the whole glass",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "water from the tap ran into the bath",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "soap from the shelf fell onto the towel",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Distinguish the original mist from the new residue caused by the attempted cleaning."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "The fair made more money than usual. Warm, dry weather kept visitors there all afternoon. A new cake stand was very popular and sold out. More families also came because it was a local holiday. The helpers counted the money after closing. Families had time to try games instead of rushing home. The cake stall brought extra spending as well as extra visitors. Helpers compared the total with last year's smaller crowd. Their notes named the weather, holiday and new stall as helpful changes.",
      "prompt": "Which reason for success is NOT given?",
      "choices": [
        {
          "t": "the fair lowered all its prices",
          "r": "KEY",
          "k": true
        },
        {
          "t": "visitors stayed in the good weather",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "many people bought cakes at the stand",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "more families came on the holiday",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Distinguish three supported contributors from an unreported pricing explanation."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "Rui stayed awake late reading his comic. His phone battery ran out, so its alarm did not ring. Thick curtains also kept his room dark after sunrise. Those things helped him sleep past his usual waking time. Normally, daylight through the thin summer curtains helped wake him. These heavier curtains were new for the colder months. His charger was still in his school bag overnight. With both usual wake-up signals missing, his late night mattered even more.",
      "prompt": "Which reason for oversleeping is NOT given?",
      "choices": [
        {
          "t": "someone moved his clock to a later time",
          "r": "KEY",
          "k": true
        },
        {
          "t": "he was tired after staying up late",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "his phone alarm could not ring",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "his curtains kept the room dark",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Combine tiredness and two absent wake-up signals while rejecting an invented clock adjustment."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "Grandpa watered his cactus much more often than it needed. Its pot had no hole to drain extra water. The roots stayed wet and began to rot. Cold air by the window made the plant weaker too. Water collected at the bottom after each extra drink. The wet soil had no chance to dry between waterings. A plant guide described this cactus as needing warm, dry conditions. The soaked roots and cold window worked against those needs.",
      "prompt": "Which cause of damage is NOT described?",
      "choices": [
        {
          "t": "the cactus received too little water",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the cactus received water too often",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the pot kept water around the roots",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the window let cold air reach it",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Track excessive water, trapped drainage and cold rather than confusing damage with drought."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "Several children had colds when they came to school. Rain kept the class crowded indoors all week. The windows stayed shut, so little fresh air came inside. Germs could spread easily in the crowded room. By Friday, more children had colds. The room had enough seats but little space between groups. Children shared the same indoor air throughout each wet day. An open window would have helped replace that air. These conditions helped germs pass between children sharing the room.",
      "prompt": "Which reason for spreading colds is NOT given?",
      "choices": [
        {
          "t": "children spent too much time outside",
          "r": "KEY",
          "k": true
        },
        {
          "t": "children with colds came into school",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "children crowded together in one room",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "children had little fresh air indoors",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Distinguish several stated opportunities for spread from the opposite outdoor explanation."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "The old swing rope was worn after years of weather. Its knot rubbed against a rough branch on every swing. On Sunday, two children sat on the seat together. The worn rope broke under their weight. The rubbing point was thinner than the rest of the rope. A single rider usually placed less strain on that weak spot. This time the extra weight pulled on the damaged fibres together. An adult removed the broken swing so nobody else could use it.",
      "prompt": "Which cause of the break is NOT mentioned?",
      "choices": [
        {
          "t": "someone had cut part of the rope",
          "r": "KEY",
          "k": true
        },
        {
          "t": "rain and sun had worn the rope",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the knot had rubbed against the branch",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "two riders had added weight together",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Combine gradual weakening with the final added load, without inventing deliberate damage."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "A food show put the bakery on television that week. The other bakery in town was closed for repairs. Saturday was also the first day for its special plum tarts. All these things brought a long line of customers. Some customers wanted to visit the shop they had seen. Others usually bought their bread from the closed business nearby. People hoping for tarts joined both groups in the queue. The baker's notebook listed all three sources of the unusually busy morning.",
      "prompt": "Which reason for the line is NOT given?",
      "choices": [
        {
          "t": "the bakery sold everything at half price",
          "r": "KEY",
          "k": true
        },
        {
          "t": "people had seen the bakery on television",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the other bakery was closed for repairs",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the special plum tarts went on sale",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Separate three distinct sources of demand from an unsupported discount explanation."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "The phone rang while the family made lunch. A loud blender mixed a drink. The radio played music at full volume. Cushions also covered the phone, making its sound quieter. Nobody heard it above the other noises. The phone lay on the sofa near the kitchen doorway. Its screen lit up under a fold in the cloth. Sound from the kitchen reached the sofa much more loudly. The missed-call mark remained there after the music and blender stopped.",
      "prompt": "Which reason for missing the call is NOT given?",
      "choices": [
        {
          "t": "a loud drill was working next door",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the blender made a lot of noise",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the radio was playing very loudly",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "cushions made the phone sound quieter",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Combine competing noise with muffling of the signal, rejecting a new unreported sound."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "Rowing home was hard that afternoon. The tide moved against the little boat. Wind from the shore pushed against it too. Both rowers had tired arms after a long swim. They rested before trying the last part of the trip. Each pull moved the oars through water pushing the other way. The breeze acted on the boat above the water as well. Their muscles had already worked hard before the return journey. Together, these difficulties explain why their progress was so slow.",
      "prompt": "Which reason for slow rowing is NOT given?",
      "choices": [
        {
          "t": "water leaked into the bottom of the boat",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the tide moved against the little boat",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "wind pushed back against the little boat",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the rowers had tired arms from swimming",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Combine water movement, wind and fatigue while checking that a leak is never reported."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "Children often gathered wherever the school cat sat. A visitor thought their voices called the cat over. The teacher watched more carefully. The cat chose a sunny place first. Only then did children walk over to sit nearby. On one morning, the children were inside until a late break. The cat was already stretched out beside the warm wall. When a cloud shaded that patch, it moved to another corner. Children joined it there only after they came out for playtime.",
      "prompt": "What caused the children and the cat to gather in the same place?",
      "choices": [
        {
          "t": "the children followed the cat's choice",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the cat followed the children's choice",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "the teacher chose a place for both",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the visitor called the cat to them",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Use observations with children absent to determine which participant chooses first and which follows."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "Jo won three races while wearing her red socks. She said the socks had made her faster. Her coach showed her the training chart from two months. She had practiced on every marked day. The coach said that work had made her faster. The chart also showed her practice times getting shorter each week. Some of those quicker runs happened in plain white socks. Her first prize came after the improvement was already recorded. The rewards followed her speed; they could not explain the earlier progress.",
      "prompt": "What does the passage suggest REALLY made Jo fast?",
      "choices": [
        {
          "t": "the training she had done regularly",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the red socks she wore that day",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the prizes she received after racing",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "the cheering she heard after winning",
          "r": "D-CAUSE-REVERSE"
        }
      ],
      "media": "text",
      "note": "Separate regular practice from a clothing coincidence and from rewards that followed improved performance."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "Dad stepped on a creaky board while fetching Biscuit's meal. Hearing that familiar noise, the dog came into the kitchen. A visitor thought Dad fetched food because Biscuit had arrived. But Dad had started before the dog left its bed. The clock showed the dog's usual feeding time. Dad followed that time even when Biscuit was asleep. His footsteps made the sound that drew the dog closer. The visitor had noticed the response without seeing its earlier trigger.",
      "prompt": "Which explanation fits the order and cause described?",
      "choices": [
        {
          "t": "Dad fetching dinner made Biscuit come into the kitchen",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Biscuit entering the kitchen made Dad start fetching dinner",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "the visitor asking for dinner made Dad fetch dog food",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Biscuit scratching the cupboard reminded Dad to get dinner",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Distinguish a familiar feeding cue from the reversed claim that the arriving dog triggered preparation."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "The crowd sang loudly, encouraging the band to play harder. Hearing the louder band, the crowd sang even louder. The band responded by playing harder again. Both groups kept encouraging each other through the final song. The extra volume did not start with both groups at once. At the first chorus, the audience's strong singing changed the playing. During the next chorus, that stronger playing changed the singing. Looking at only one chorus would miss part of the whole pattern.",
      "prompt": "What does the passage say about the noise?",
      "choices": [
        {
          "t": "each group responded by becoming louder in turn",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the band’s first response caused the earlier crowd singing",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "the louder crowd stopped the band from playing loudly",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the louder band stopped the crowd from singing loudly",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Recognise a feedback loop in which the causal direction alternates across successive responses."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "Umbrellas opened all along the street as rain began. It might look as if opening umbrellas brought the rain. But the first drops landed before any umbrella opened. People opened them to keep those drops off their clothes. One person without an umbrella sheltered beneath a shop roof. Another person waited indoors until the shower became lighter. The drops reached the street in places with no people too. The weather affected the people wherever they chose to shelter.",
      "prompt": "Why do umbrellas and rain arrive together?",
      "choices": [
        {
          "t": "the rain made people open umbrellas",
          "r": "KEY",
          "k": true
        },
        {
          "t": "opening umbrellas made the rain begin",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "people opened umbrellas to bring cooler air",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "opening umbrellas made the rain stop",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Use the earlier rain and rain in empty places to test and reject the reversed direction."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "Tam felt hungry when the ice cream music played. He thought the tune caused his hunger. Mom asked him to notice days without the truck. He was hungry at four on those days too. Lunch was early, and his body needed food again. The truck followed its route even when nobody bought a cone. Tam noticed his empty stomach before hearing it on Tuesday. On Wednesday, the truck never came down their road. He still wanted his usual afternoon snack at about the same time.",
      "prompt": "What REALLY explains Tam's four o'clock hunger?",
      "choices": [
        {
          "t": "a long gap since lunch made him hungry",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the truck's music always made him hungry",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "hearing Mom's question made him need food",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "buying ice cream made the truck arrive",
          "r": "D-CAUSE-REVERSE"
        }
      ],
      "media": "text",
      "note": "Compare truck-present and truck-absent days to separate hunger from a coincident signal and reversed purchase claim."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "A rooster crowed as the sky began to brighten. The farmer joked that its crow had lifted the sun. But dawn came on quiet mornings too. The rooster noticed the early light and began crowing. The bird's coop had a window facing the lightening sky. The farmer could see daylight there before hearing the first call. A recording of yesterday's crow played at noon changed nothing outside. The passage describes this bird responding to dawn, not controlling the time.",
      "prompt": "Which explanation does the passage support?",
      "choices": [
        {
          "t": "the brightening sky prompted the bird’s call",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the rooster’s crow brought the morning light",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "the farmer’s joke made the sky grow bright",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the fading daylight made the rooster call",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Use the timing and an unchanged noon replay to distinguish response to light from causing daylight."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "Big fires often have more firefighters than small fires. Ana wondered which event happened first. Her poster showed that a fire grows before extra crews arrive. More crews are called because a fire has become large. A row of pictures showed a call for help between them. The first crew needed more people to handle the spreading flames. The next picture showed those helpers arriving with extra equipment. The pictures did not show the arriving crews making the fire larger.",
      "prompt": "According to the poster, which event caused the other?",
      "choices": [
        {
          "t": "a larger fire brings extra firefighters",
          "r": "KEY",
          "k": true
        },
        {
          "t": "extra firefighters make a fire grow larger",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "every fire requires the same number of firefighters",
          "r": "D-OPPOSITE"
        },
        {
          "t": "extra crews arrive only after every flame is out",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Track the reason for requesting help and reject interpreting the resulting crew count as the fire's cause."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Joss shook the fizzy drink can all afternoon. Tiny bubbles formed throughout the drink inside the can. The lid kept everything inside until opening. When Dad opened it, foam sprayed out. It splashed across the tablecloth.",
      "prompt": "What happened because the can was shaken?",
      "choices": [
        {
          "t": "foam sprayed from the open can",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the drink froze inside the can",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the lid fell inside the can",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Dad put the can on the table",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Ben left his flashlight shining all night. Using it for so long drained the batteries. The beam was weak when he picked it up. Soon the light went out completely.",
      "prompt": "What happened because the flashlight stayed on all night?",
      "choices": [
        {
          "t": "the batteries lost their power",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the bulb grew much brighter",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the glass cracked from a fall",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Ben switched it on at night",
          "r": "D-CAUSE-REVERSE"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Auntie Bel could not be near cats without sneezing. The doctor called it a cat allergy. At her neighbor's house, a cat climbed onto her. Her eyes watered and she started sneezing.",
      "prompt": "Why was Auntie Bel sneezing?",
      "choices": [
        {
          "t": "being near the cat affected her",
          "r": "KEY",
          "k": true
        },
        {
          "t": "a cold began after she said hello",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her watering eyes frightened the cat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the cat scratched her while she sat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Strawberries stayed forgotten in the fridge for weeks. Over time, they spoiled and grew gray mold. Val found the old box behind the milk. She threw those spoiled berries away.",
      "prompt": "Why was mold covering the strawberries?",
      "choices": [
        {
          "t": "the fruit was left long enough to spoil",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the fridge was kept cold all night",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Val moved the box away from the milk",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the box was opened just before eating",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "Otto kicked the bath plug out by mistake. Water then escaped through the open drain. Nobody noticed until the bath was almost empty. Otto found the plug beside his foot.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "The loose plug let water escape from the bath.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The empty bath made Otto kick out the plug.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "The cold water made the plug leave the drain.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The bath stayed full while the plug was out.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "Nia let go of her balloon inside the room. Then a fan blew air toward it. The air pushed it across the floor. It stopped when it reached the curtain.",
      "prompt": "Which sentence explains what made this happen?",
      "choices": [
        {
          "t": "The fan's moving air pushed the balloon.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The balloon's movement switched on the fan.",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "The curtain pulled the balloon across the room.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The balloon pushed air back through the fan.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Tess sat by the beach holding her fries. A gull flew down toward the food. It grabbed the largest fry with its beak. Then it flew away carrying the stolen food.",
      "prompt": "What happened because the seagull swooped?",
      "choices": [
        {
          "t": "the gull carried away a fry",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Tess carried away the gull",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the gull dropped all the fries",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Tess fed the gull a fish",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Dad pushed a cart through the grocery shop. One front wheel kept making a squeak. Gum stuck in that wheel stopped it turning freely. Dad removed the gum, and the squeak stopped.",
      "prompt": "Why did the cart squeak?",
      "choices": [
        {
          "t": "gum was catching in a wheel",
          "r": "KEY",
          "k": true
        },
        {
          "t": "food was pressing on the handle",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the floor was wet beside the cart",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Dad was pushing an empty cart",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "Marta drank fizzy lemonade too quickly and began to hiccup. The hiccups made her laugh. Laughing made it harder to take another sip. She set the drink down until the hiccups stopped. Then she drank more slowly. She could hold the glass steady despite the little jumps. It was laughing with her mouth open that interrupted drinking. The first hurried mouthfuls had started the trouble. Putting the glass down came later, as a way to wait safely.",
      "prompt": "What directly made taking another sip difficult?",
      "choices": [
        {
          "t": "laughing with her mouth open after hiccuping",
          "r": "KEY",
          "k": true
        },
        {
          "t": "drinking the first mouthfuls of fizzy lemonade",
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "putting the glass down on the table",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "waiting until the hiccups had finally stopped",
          "r": "D-CAUSE-STEP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Find the link from hiccups to interrupted drinking rather than selecting the initial fast sips."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "The paint tin stayed open overnight. A dry skin formed across its surface. Dad stirred that skin into the liquid paint. Bits of skin left small bumps on the painted door. He sanded the dry coat smooth before repainting it. The lid had been left beside the tin, not fitted tightly. Air dried the exposed top while the paint underneath stayed liquid. Stirring broke the skin into pieces instead of dissolving it. Those pieces travelled with the wet paint onto the flat wood.",
      "prompt": "How did the dry skin cause bumps on the door?",
      "choices": [
        {
          "t": "stirring carried bits into the paint applied to the wood",
          "r": "KEY",
          "k": true
        },
        {
          "t": "leaving the tin open made the wooden door shrink",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "sanding pushed dry pieces of wood into the paint tin",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "closing the lid pressed paint against the wooden door",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Trace air exposure through skin formation and mixing to the bumps; identify the middle transfer step."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "The clothes took all day to dry outside. The morning air was misty and damp. The line hung in a shady part of the yard. The clothes were also very wet when Mom hung them up. Drops still hung from the sleeves when they reached the line. The nearby wall kept direct sunshine off the fabric. Even at midday, the surrounding air felt cool and heavy. All three conditions made drying harder than on a bright, breezy morning.",
      "prompt": "Which reason for slow drying is NOT given?",
      "choices": [
        {
          "t": "rain fell on the washing all day",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the air was damp in the morning",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the washing line stayed in the shade",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the clothes went on the line very wet",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Distinguish damp air and soaked fabric from an invented day of rain."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "The hamster escaped through a loose cage door. Its latch did not click shut firmly. A nearby shelf gave it a way down to the floor. Nobody checked the door after the evening feed. The cage was empty next morning. The latch normally held the door against its frame. Without that click, a small push could leave an opening. The shelf ran from just beneath the cage towards a chair. The missed check left this route available throughout the night.",
      "prompt": "Which possible cause is NOT in the passage?",
      "choices": [
        {
          "t": "a child took the hamster home",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the door latch did not hold firmly",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "a shelf made a route to the floor",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the door was not checked after feeding",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Combine an unsecured exit, an accessible route and the missed check without inventing removal by a child."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "A long queue formed at the beach ice cream kiosk. The manager called a helper because service was too slow. The helper opened a second serving window beside the first. A visitor thought the extra window had attracted the crowd. But the queue had been there before the helper arrived. Both windows offered the same cones at the usual price. After they opened together, the queue became shorter. The extra service was a response to the crowd already waiting.",
      "prompt": "Why was the second serving window opened?",
      "choices": [
        {
          "t": "the long queue created a need for faster service",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "the new serving window had created the original queue",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "lower prices at the second window had attracted visitors",
          "r": "D-OPPOSITE"
        },
        {
          "t": "larger cones at the second window needed another helper",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Use the queue before the intervention and its later reduction to distinguish demand from the response."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "Grandpa began yawning during the family card game. Seeing him struggle to stay awake, Leah fetched a pillow. She said his tiredness had reminded her of it. Her brother thought the pillow had made Grandpa sleepy. Yet Grandpa had yawned while it was still inside a cupboard. He had not seen it until Leah brought it over. The pillow might help him rest comfortably now. It could not explain the earlier yawns that prompted Leah to help.",
      "prompt": "What explains why Leah fetched the pillow?",
      "choices": [
        {
          "t": "Grandpa’s earlier yawns showed her that he needed rest",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "seeing the pillow caused Grandpa to start his earlier yawns",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "her brother asked her to use it for the card game",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Grandpa complained that his chair had become too hard",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Separate the response to observed tiredness from a possible later aid to rest using the pillow’s hidden location."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "Theo carried a magnet beside his compass. The magnet pulled the needle away from its correct direction. The group followed that wrong direction at a path junction. They walked in a loop back to their starting point. The path signs were still in their usual places. The walkers were trusting the needle rather than those signs. Their route curved through the wood instead of reaching the pond. Moving the magnet away would remove the source of the false reading.",
      "prompt": "What made the compass show the wrong direction?",
      "choices": [
        {
          "t": "a magnetic object near the pointer",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the group following the wrong direction",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "the group walking back to its starting point",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "rain entering the compass beside the path",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify magnetic interference as the link to a false reading, separating it from the later navigation error."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "The cake candles kept going out. Air blew through the open back door. The ceiling fan pushed more air across the cake. Two cousins laughed so close that their breath reached the flames. Mom moved the cake into a still corner. The flames stayed lit once the cake was away from movement. The new corner was clear of both the doorway and fan. The cousins could still see it from farther back. These changes removed all three sources of moving air.",
      "prompt": "Which cause of the flames going out is NOT given?",
      "choices": [
        {
          "t": "rainwater had made the candles wet",
          "r": "KEY",
          "k": true
        },
        {
          "t": "air blew through the open back door",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the ceiling fan pushed air at the cake",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the cousins breathed right at the flames",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Compare three air movements with the successful still-air condition and reject an unreported wetting cause."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Strong wind tugged at the tent all night. Its pegs pulled loose from the soft ground. Without those anchors, one side of the tent fell. The other side still had firm pegs.",
      "prompt": "Why did the tent fall?",
      "choices": [
        {
          "t": "the wind loosened the pegs",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the wind stopped before dawn",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the pegs held the tent firmly",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the rain washed the tent clean",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "The cup had a small hole underneath. Jo poured water into it at the table. Water escaped through the hole onto the wood. The cup could not keep the water inside.",
      "prompt": "What happened because of the hole?",
      "choices": [
        {
          "t": "water escaped from the cup",
          "r": "KEY",
          "k": true
        },
        {
          "t": "water stayed safely inside the cup",
          "r": "D-OPPOSITE"
        },
        {
          "t": "water rose over the cup’s top edge",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "water pushed the cup off the table",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "A ball rolled into the open doorway. It rested between the door and its frame. Mia pushed the door towards the frame. The ball was in the way, stopping it closing.",
      "prompt": "Which sentence explains what happened?",
      "choices": [
        {
          "t": "Mia could not shut the door because it was blocked.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Mia could not shut the door because its frame broke.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The ball moved outside because the door was closed.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The doorway opened because Mia put the ball away.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Dad wanted the hall for a school meeting. A sign at the corner pointed left. Its arrow was beside the word Hall. Dad followed that direction without asking anyone for help.",
      "prompt": "Why did Dad turn left?",
      "choices": [
        {
          "t": "a direction marker guided him there",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the hall had no sign beside it",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the hall was closed for repair work",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "he wanted to leave the hall quickly",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Asha tested a bridge made from folded paper. She added paper clips to its middle. Their weight became too much for the paper. The bridge bent down under the extra load.",
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
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "because_sentence",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "because_sentence",
      "passage": "Lee’s thick curtains kept daylight outside the bedroom. The room was still dark after breakfast. Lee opened both curtains wide across the window. Sunlight could now enter, making the whole room bright.",
      "prompt": "Which sentence explains what happened?",
      "choices": [
        {
          "t": "The room brightened because Lee let sunlight enter.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Lee closed the curtains because sunlight was entering.",
          "r": "D-OPPOSITE"
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
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_cause",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "find_cause",
      "passage": "Theo wanted a place to sit in the park. A red label warned of wet paint. The paint could mark clothes touching the bench. Theo chose another bench to keep his trousers clean.",
      "prompt": "Why did Theo choose another bench?",
      "choices": [
        {
          "t": "he wanted to avoid the wet paint",
          "r": "KEY",
          "k": true
        },
        {
          "t": "he saw that the label had fallen off",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "he wanted to sit on the wet paint",
          "r": "D-OPPOSITE"
        },
        {
          "t": "he saw that the painted bench was dry",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "find_effect",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "find_effect",
      "passage": "Eva’s toy cart had a wobbly wheel. A loose screw let it move sideways. Eva tightened that screw with a small screwdriver. The firm screw kept the turning wheel steady.",
      "prompt": "What happened because Eva made the screw tight?",
      "choices": [
        {
          "t": "the wheel stopped wobbling",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the screw came loose again",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the wheel fell off completely",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the wheel stopped turning at all",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Identify the stated cause and its direct result, using the mechanism described in the passage."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "Leaves blocked the drain, so rainwater could not flow away. Water gathered on the path and froze overnight. In the morning, the caretaker closed the slippery path. That walkway was the usual route between the gate and classrooms. The drain normally carried puddles away before they became deep. A mat of wet leaves covered its opening this time. Temperatures fell below freezing after sunset. Children used another entrance while the caretaker dealt with the ice.",
      "prompt": "Why was the path closed?",
      "choices": [
        {
          "t": "standing water had turned into slippery ice",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the drain had been cleared of all its leaves",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the caretaker had forgotten where the path went",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the rain had stopped before the water gathered",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Connect a blocked outlet through standing water and freezing to the safety closure."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "The cake sank because the oven door opened too soon. The baker had also used too little flour. She kept the correct cooking time and used fresh eggs. The written recipe gave an amount larger than she had measured. The door should also have stayed closed while the mixture rose. Her kitchen clock matched the time in the recipe. The egg carton showed yesterday's delivery date. Checking these details separated two mistakes from two things done properly.",
      "prompt": "Which cause is NOT given for the sinking cake?",
      "choices": [
        {
          "t": "the eggs were too old to use",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the oven door opened before it should",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "the mixture contained too little flour",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "both the early opening and missing flour",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Check two contributing mistakes against two explicit controls before rejecting an old-egg explanation."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "The heater warmed the room, and then the ice sculpture melted. Turning the heater off slowed the melting. The sculpture had stayed solid before the room became warm. The display stood well away from the switch on the wall. Staff recorded the room temperature beside a picture of the sculpture. The temperature rose before the first drop appeared under the base. At the cooler setting, drops formed less quickly. The order and the changed setting supported the same explanation.",
      "prompt": "Which cause and effect fits the evidence?",
      "choices": [
        {
          "t": "the heater’s warmth caused the ice to melt",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the melting ice caused the heater to switch on",
          "r": "D-CAUSE-REVERSE"
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
      "note": "Use temporal order and the cooler-setting comparison to reject melting as the cause of switching on heat."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "The printer ran out of paper, so the notices were delayed. Without notices, families did not know the new meeting time. Only a few arrived when the meeting began. The meeting had moved from afternoon to morning that week. The school usually sent paper messages home before any change. Staff had prepared them, but the empty tray stopped printing. Families were still following the old time on their calendars. A few already knew because they had spoken to staff.",
      "prompt": "Why did few families arrive at the new time?",
      "choices": [
        {
          "t": "the delayed notices had not told them about it",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the printer had sent them the new time early",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the meeting had already finished before anyone knew",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the families had voted to cancel the meeting",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Link the missing communication to outdated expectations, not merely to the printer fault."
    },
    {
      "u": "multiple_causes",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "multiple_causes",
      "passage": "Several walkers arrived late because a fallen tree blocked the path. Heavy rain also slowed their progress. Their map was correct, and everyone had left on time. The group needed to go around the branches through thick grass. The wet ground also made each step slower and more careful. Landmarks still matched the path shown on their map. Their watches agreed with the planned starting time. The delay happened along the route, rather than before they set off.",
      "prompt": "Which cause of lateness is NOT supported?",
      "choices": [
        {
          "t": "the walkers followed an incorrect map",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the fallen tree blocked their usual path",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "heavy rain slowed their walking speed",
          "r": "D-SUPPORTED-DETAIL"
        },
        {
          "t": "both the fallen tree and the rain",
          "r": "D-SUPPORTED-DETAIL"
        }
      ],
      "media": "text",
      "note": "Combine two journey obstacles while excluding navigation and departure errors using explicit counterevidence."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "A bus broke down, leaving fewer buses on the route. More people waited at each stop. The next bus filled up and could not take everyone. Usually, two services shared the passengers during that busy hour. With one missing, everyone depended on the remaining service. Every seat and safe standing space was already taken. The driver followed the limit for that vehicle. The people left at the stop had to wait for more space.",
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
      "note": "Follow reduced services through accumulated demand to a full vehicle and refused boarding."
    },
    {
      "u": "reversal_trap",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "reversal_trap",
      "passage": "A loose roof tile let rain drip onto the ceiling. The wet patch grew during each storm. After the tile was replaced, the ceiling stayed dry. A roofer found a gap at the edge of that tile. Water could travel from there down to the plaster below. The replacement covered the gap completely. Another storm came after the repair, but no new mark appeared. That comparison showed why the old wet patch had formed indoors.",
      "prompt": "Which explanation matches the events?",
      "choices": [
        {
          "t": "the damaged roof let water make the ceiling wet",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the wet ceiling opened the gap in the roof",
          "r": "D-CAUSE-REVERSE"
        },
        {
          "t": "the new tile caused the old wet patch to grow",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the dry weather broke the tile during the repair",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Link a physical entry path and a successful repair, rather than reversing damage and the resulting wet patch."
    },
    {
      "u": "chain",
      "lvl": 2,
      "ph": 2,
      "v": 23,
      "fmt": "COMPREHENSION",
      "cell": "chain",
      "passage": "A freezer alarm warned that its door had been left open. The warm air softened the frozen food. Staff moved the food to another freezer before it fully thawed. The building itself was much warmer than the freezer's usual setting. A box beside the hinge had stopped the door closing properly. The alarm was a warning about this change, not its cause. Moving the food restored cold conditions around it. The staff then removed the box from the hinge.",
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
          "r": "D-CAUSE-STEP"
        },
        {
          "t": "the freezer door being closed after the move",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Separate the alarm signal and corrective move from the warm air that changed the food."
    }
  ]
};
