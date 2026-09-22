// Individually authored comprehension evidence; normal and reserve items share the same quality requirements.
export default {
  "skillId": "sequencing",
  "skillName": "Sequencing",
  "items": [
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The box was beside a sunny window. Its lid had a soft cushion on top. The cat jumped onto the box. Then it curled into a ball. Last, it fell asleep.",
      "prompt": "What happened first?",
      "spoken": "The cat jumped onto the box. Then it curled into a ball. Last, it fell asleep. What happened first?",
      "choices": [
        {
          "t": "jumped on the box",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "curled into a ball",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "fell asleep",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The seed needed water and soil to grow. Its pot had little holes underneath for drainage. Mia planted a seed in soil. She watered it each day. Later, a green shoot grew.",
      "prompt": "What happened first?",
      "spoken": "Mia planted a seed in soil. She watered it each day. Later, a green shoot grew. What happened first?",
      "choices": [
        {
          "t": "put in the seed",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "watered the soil",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "saw a green shoot",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "There was mud on both of his hands. The soap and tap were beside the sink. Ben wet his hands. Then he rubbed soap over them. Last, he rinsed the bubbles away.",
      "prompt": "What happened first?",
      "spoken": "Ben wet his hands. Then he rubbed soap over them. Last, he rinsed the bubbles away. What happened first?",
      "choices": [
        {
          "t": "wet his hands",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "rubbed in soap",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "rinsed his hands",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Zara was getting ready for a woodland walk. Her shoes had laces instead of straps. Zara pulled on a sock. Then she put on its shoe. Last, she tied the laces.",
      "prompt": "What happened first?",
      "spoken": "Zara pulled on a sock. Then she put on its shoe. Last, she tied the laces. What happened first?",
      "choices": [
        {
          "t": "pulled on a sock",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "put on the shoe",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "tied the laces",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The bread was soft and pale at breakfast. Dad liked his butter on hot, crisp toast. Dad put bread in the toaster. The toast popped up. Then he spread butter on it.",
      "prompt": "What happened first?",
      "spoken": "Dad put bread in the toaster. The toast popped up. Then he spread butter on it. What happened first?",
      "choices": [
        {
          "t": "put bread in",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "toast popped up",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "spread the butter",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The dog loved fetching things in the park. Noah had one tennis ball for their game. Noah threw the ball. The dog chased it. Then the dog brought it back.",
      "prompt": "What happened first?",
      "spoken": "Noah threw the ball. The dog chased it. Then the dog brought it back. What happened first?",
      "choices": [
        {
          "t": "threw the ball",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "dog chased it",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "dog brought it back",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Lina wanted a sunshine picture for her window. Her blank paper had space for one sun. Lina drew a circle. Then she added sun rays. Last, she coloured the sun yellow.",
      "prompt": "What happened first?",
      "spoken": "Lina drew a circle. Then she added sun rays. Last, she coloured the sun yellow. What happened first?",
      "choices": [
        {
          "t": "drew a circle",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "added the rays",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "colored the sun",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Omar wanted a tower taller than his knee. The flat carpet was clear of other toys. Omar set down his blocks. He stacked them into a tower. Then he smiled at the tall tower.",
      "prompt": "What happened first?",
      "spoken": "Omar set down his blocks. He stacked them into a tower. Then he smiled at the tall tower. What happened first?",
      "choices": [
        {
          "t": "set down blocks",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "stacked the tower",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "smiled at the tower",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Ava had two bread slices for her lunch. The cheese would go between them, not outside. Ava put bread on a plate. She added cheese to one slice. Then she closed the sandwich.",
      "prompt": "What happened in the middle?",
      "spoken": "Ava put bread on a plate. She added cheese to one slice. Then she closed the sandwich. What happened in the middle?",
      "choices": [
        {
          "t": "added the cheese",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "laid down bread",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "closed the sandwich",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Heavy rain was falling outside Eli’s front door. His feet and head needed protection from it. Eli put on his boots. Then he opened his umbrella. Last, he walked outside.",
      "prompt": "What happened in the middle?",
      "spoken": "Eli put on his boots. Then he opened his umbrella. Last, he walked outside. What happened in the middle?",
      "choices": [
        {
          "t": "opened an umbrella",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "put on boots",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "walked outside",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The story was too long for one sitting. A bookmark would keep her place until tomorrow. The girl opened her book. She read a page. Then she put a bookmark inside.",
      "prompt": "What happened in the middle?",
      "spoken": "The girl opened her book. She read a page. Then she put a bookmark inside. What happened in the middle?",
      "choices": [
        {
          "t": "read the page",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "opened the book",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "put in a bookmark",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Kai was thirsty after a game outside. His cup was empty beside the kitchen tap. Kai filled a cup with water. He drank the water. Then he put the cup in the sink.",
      "prompt": "What happened in the middle?",
      "spoken": "Kai filled a cup with water. He drank the water. Then he put the cup in the sink. What happened in the middle?",
      "choices": [
        {
          "t": "drank the water",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "filled the cup",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "put cup in sink",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The shell could not go into the pan. The egg needed mixing for a soft omelette. Mom cracked an egg into a bowl. She whisked it with a fork. Then she cooked it in a pan.",
      "prompt": "What happened in the middle?",
      "spoken": "Mom cracked an egg into a bowl. She whisked it with a fork. Then she cooked it in a pan. What happened in the middle?",
      "choices": [
        {
          "t": "whisked the egg",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "cracked the egg",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "cooked the egg",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The teams had the same score before this. One more goal would put his team ahead. The boy kicked the ball. It went into the goal. Then his team cheered.",
      "prompt": "What happened in the middle?",
      "spoken": "The boy kicked the ball. It went into the goal. Then his team cheered. What happened in the middle?",
      "choices": [
        {
          "t": "ball went in goal",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "kicked the ball",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "team cheered",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The dog had dirt stuck in its coat. Its clean fur needed care before brushing. Nia washed the muddy dog. She dried its fur. Then she brushed its fur smooth.",
      "prompt": "What happened in the middle?",
      "spoken": "Nia washed the muddy dog. She dried its fur. Then she brushed its fur smooth. What happened in the middle?",
      "choices": [
        {
          "t": "dried its fur",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "washed the dog",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "brushed the fur smooth",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The dough was for one long bread loaf. A tray was ready beside the warm oven. The baker mixed some dough. She shaped it into a loaf. Then she put it in the oven.",
      "prompt": "What happened in the middle?",
      "spoken": "The baker mixed some dough. She shaped it into a loaf. Then she put it in the oven. What happened in the middle?",
      "choices": [
        {
          "t": "shaped the loaf",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "mixed the dough",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "put loaf in oven",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "Sam was ready to clean his teeth. The brush was beside the bathroom sink. Sam put toothpaste on his brush. He brushed his teeth. Then he spat out the toothpaste.",
      "prompt": "What happened last?",
      "spoken": "Sam put toothpaste on his brush. He brushed his teeth. Then he spat out the toothpaste. What happened last?",
      "choices": [
        {
          "t": "spat out the toothpaste",
          "r": "KEY",
          "k": true
        },
        {
          "t": "added toothpaste",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "brushed his teeth",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The child wanted something that could glide. A flat sheet would not fly like a plane. The child found some paper. She folded it into a plane. Then she flew it across the room.",
      "prompt": "What happened last?",
      "spoken": "The child found some paper. She folded it into a plane. Then she flew it across the room. What happened last?",
      "choices": [
        {
          "t": "flew the plane",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "found the paper",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "folded a plane",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The tree had ripe fruit within Ivy’s reach. Dust covered the skin of the lowest apples. Ivy picked an apple. She washed it under the tap. Then she took a bite.",
      "prompt": "What happened last?",
      "spoken": "Ivy picked an apple. She washed it under the tap. Then she took a bite. What happened last?",
      "choices": [
        {
          "t": "bit the apple",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "picked the apple",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "washed the apple",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "Deep snow covered the ground beside the house. The snowman needed a body underneath its head. The boy rolled a large snowball. He added a smaller one for the head. Then he gave the snowman a hat.",
      "prompt": "What happened last?",
      "spoken": "The boy rolled a large snowball. He added a smaller one for the head. Then he gave the snowman a hat. What happened last?",
      "choices": [
        {
          "t": "added the hat",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "made a snowball",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "added the head",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The paper and ribbon were for a birthday. Ana wanted her friend’s present to be covered. Ana wrapped the gift. She tied a bow around it. Then she gave it to her friend.",
      "prompt": "What happened last?",
      "spoken": "Ana wrapped the gift. She tied a bow around it. Then she gave it to her friend. What happened last?",
      "choices": [
        {
          "t": "gave the gift",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "wrapped the gift",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "tied the bow",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The playground needed a shady place for summer. The young tree had bare roots for planting. The class dug a hole. They planted a tree in it. Then they watered its roots.",
      "prompt": "What happened last?",
      "spoken": "The class dug a hole. They planted a tree in it. Then they watered its roots. What happened last?",
      "choices": [
        {
          "t": "watered the roots",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "dug the hole",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "planted the tree",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The bag was beside Leo’s untidy picnic spot. Its opening needed closing before the final lift. Leo filled a bag with rubbish. He tied the bag shut. Then he put it in the bin.",
      "prompt": "What happened last?",
      "spoken": "Leo filled a bag with rubbish. He tied the bag shut. Then he put it in the bin. What happened last?",
      "choices": [
        {
          "t": "put bag in trash can",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "filled the bag",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "tied the bag",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The class was on a trip by bus. The children were safely seated near the doors. The driver was at the front. The bus stopped. Its doors opened. Then the children stepped off.",
      "prompt": "What happened last?",
      "spoken": "The bus stopped. Its doors opened. Then the children stepped off. What happened last?",
      "choices": [
        {
          "t": "children stepped off",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "bus stopped",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "doors opened",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Rae wanted a bright star for her card. An outline would help her keep its shape. Rae picked up a pencil. She drew a star. Then she coloured it red.",
      "prompt": "What happened first?",
      "spoken": "Rae picked up a pencil. She drew a star. Then she coloured it red. What happened first?",
      "choices": [
        {
          "t": "picked up pencil",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "drew the star",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "colored it red",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": true,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The little pony was outside its grassy field. The gate was the only safe way in. Max opened the gate. He led the pony through. Then he shut the gate.",
      "prompt": "What happened in the middle?",
      "spoken": "Max opened the gate. He led the pony through. Then he shut the gate. What happened in the middle?",
      "choices": [
        {
          "t": "led pony through",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "opened the gate",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "shut the gate",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": true,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The frog’s skin was getting dry in sunlight. The nearby pond was cool and deep. The frog sat by the pond. It jumped into the water. Then it swam away.",
      "prompt": "What happened last?",
      "spoken": "The frog sat by the pond. It jumped into the water. Then it swam away. What happened last?",
      "choices": [
        {
          "t": "frog swam away",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "frog sat",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "frog jumped",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": true,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Jo’s breakfast things were on the kitchen table. Her cereal was crisp before the milk touched it. Jo poured cereal into a bowl. She added milk. Then she ate her breakfast.",
      "prompt": "What happened first?",
      "spoken": "Jo poured cereal into a bowl. She added milk. Then she ate her breakfast. What happened first?",
      "choices": [
        {
          "t": "poured cereal",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "added milk",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "ate breakfast",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": true,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Snow lay outside the warm kitchen. His ears needed covering along with his body. The child zipped up a coat. He put on a hat. Then he went into the snow.",
      "prompt": "What happened in the middle?",
      "spoken": "The child zipped up a coat. He put on a hat. Then he went into the snow. What happened in the middle?",
      "choices": [
        {
          "t": "put on the hat",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "zipped the coat",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "went into the snow",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": true,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The wooden shelf was for clean, dry dishes. Elva’s plate was greasy after the evening meal. Elva washed a plate. She dried it. Then she put it on the shelf.",
      "prompt": "What happened last?",
      "spoken": "Mia washed a plate. She dried it. Then she put it on the shelf. What happened last?",
      "choices": [
        {
          "t": "put plate on shelf",
          "k": true,
          "r": "KEY"
        },
        {
          "t": "washed the plate",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "dried the plate",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": true,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The berries were ready for jam, but still dusty. First, Hana washed them in a bowl of clean water. Only the fruit belonged in the cooking pot. She then boiled the berries with sugar until thick. A cold plate would show whether the mixture was ready. Next, she tested a spoonful on that plate. The small sample held its shape instead of running. Only after that test did she fill the clean jars. Runny jam would have needed more cooking before this final step.",
      "prompt": "What happened immediately before Hana filled the jars?",
      "choices": [
        {
          "t": "tested a small spoonful",
          "r": "KEY",
          "k": true
        },
        {
          "t": "washed the dusty fruit",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "boiled fruit with sugar",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "filled the clean jars",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Place the readiness test between cooking and storing; each option is an actual process stage."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The class watched one egg in a warm incubator. On the first day, Ms Vale placed the egg inside. Its shell was smooth and whole at that point. On day nineteen, a small crack appeared in the shell. A day after the crack, children heard a quiet cheep. The chick was still hidden, although they could hear it. On day twenty-one, the chick finally hatched from the shell. Their chart had four pictures showing these changes. Each picture had the day written beneath it.",
      "prompt": "What happened just after the first crack appeared?",
      "choices": [
        {
          "t": "a quiet cheep came from inside",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the egg went into the incubator",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "a small crack appeared in the shell",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the chick came out of the shell",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Order four dated stages and select the event between cracking and hatching."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "Otto was small enough for the barber's special high chair. First, the barber fastened a gown around his shoulders. Its smooth cloth would keep loose hair off his shirt. Then the barber cut Otto's hair with scissors. The hand mirror beside the chair could show the back. After the haircut, the barber held up that mirror. Otto could see the short, even shape all around. Last, the barber offered him a wrapped lollipop. The treat was for after the check, not during cutting.",
      "prompt": "What happened directly before Otto was offered the lollipop?",
      "choices": [
        {
          "t": "the barber showed the finished haircut",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the barber covered Otto’s shirt",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the barber shortened Otto’s hair",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the barber offered Otto a sweet",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Use the final inspection to place the reward after checking, not merely after any earlier action."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The museum trip had four parts on the teacher's plan. At the entrance, children left their bags in numbered lockers. Large bags were not allowed beside the delicate displays. Next came their visit to the dinosaur gallery upstairs. Lunch was the next part of the plan. The class ate in the courtyard beyond that gallery. Before leaving, they collected their bags from the lockers. Each child still had the same numbered key. The plan put collecting bags after lunch, not before the exhibition.",
      "prompt": "Which part came immediately before lunch?",
      "choices": [
        {
          "t": "visiting the dinosaur display",
          "r": "KEY",
          "k": true
        },
        {
          "t": "leaving bags at the entrance",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "eating in the courtyard",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "collecting bags before departure",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Track a four-part visit and distinguish two uses of the same locker location."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The lettuce seeds began life in a tray indoors. Maya sowed them there during the cold weeks of March. A warm windowsill protected them from frost outside. In April, she moved the young plants into the garden. The nights were mild enough for outdoor growing by then. After the move, she watered the growing lettuces throughout May. Their roots needed moisture while the leaves became bigger. In June, she cut the leafy heads for lunch. Her calendar showed one main stage in each month.",
      "prompt": "What happened immediately after the lettuces moved outside?",
      "choices": [
        {
          "t": "they received water while growing",
          "r": "KEY",
          "k": true
        },
        {
          "t": "their seeds went into an indoor tray",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "their leaves were cut for lunch",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the young plants moved into the garden",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Use dated growing stages to locate the care period between transplanting and harvest."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "Euan's boots were muddy before his football match. The evening before it, he cleaned the mud away. Clean studs would grip the field better than clogged ones. At noon on match day, he checked the team list. His name was beside the left-wing position. At one, the whole team began its warm-up together. That exercise prepared their muscles for running across the field. At two, the referee blew the starting whistle. Euan's schedule put preparation before play across two separate days.",
      "prompt": "Which event came directly before the team began warming up?",
      "choices": [
        {
          "t": "Euan checked where he would play",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Euan cleaned his muddy boots",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the team began its warm-up",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the referee started the match",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Separate the previous evening from three match-day times and select the nearest prior event."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "Asha compared her shadow with marks on the playground. At nine, she marked its long outline towards the fence. At noon, she marked a short shape by her feet. The midday Sun was high above the playground. At three, she marked a longer outline on the opposite side. The Sun was lower and in a different direction. At five, she marked the longest evening outline towards the hedge. Four coloured outlines recorded the four checks. Each colour belonged to one time on her chart.",
      "prompt": "Which outline did Asha mark immediately after the short midday one?",
      "choices": [
        {
          "t": "the longer shape on the opposite side",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the morning shape towards the fence",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the short shape beside her feet",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the evening shape towards the hedge",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Combine time and direction to distinguish two different long shadows."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The bookcase was too heavy to shift while full. First, Ren removed every book from its shelves. The empty wooden frame was much easier to move. Next, he moved the bookcase away from the wall. A thick line of dust lay behind its old position. He then vacuumed that newly uncovered strip of floor. Last, he put the books onto the shelves again. The bookcase now stood a little farther from the wall. Cleaning the hidden floor required the earlier moving step.",
      "prompt": "What happened immediately before the books went back?",
      "choices": [
        {
          "t": "Ren cleaned the hidden strip of floor",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Ren emptied all the shelves",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "Ren moved the wooden bookcase",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "Ren put the books onto the shelves",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Distinguish removing books, moving furniture and cleaning before the final restoration."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Noor showed her finished birthday cake to her little sister. The cherries on its top looked bright against the white icing. Just before showing it, Noor had placed those cherries carefully. The icing beneath them had gone on earlier. Under that soft layer was a sponge she had baked first. The cake could not have icing while still raw batter. Each part needed the part beneath it to be ready. Her sister saw only the finished cake, not its earlier stages. The sponge formed the base beneath both kinds of decoration.",
      "prompt": "Which task had Noor completed first?",
      "choices": [
        {
          "t": "baking the sponge for the cake",
          "r": "KEY",
          "k": true
        },
        {
          "t": "covering the sponge with icing",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "placing cherries on the white top",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "showing the finished cake to her sister",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Reconstruct layers of preparation from a finished cake described in reverse order."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Theo came inside wearing wet gloves after an afternoon outdoors. Just before that, he had been pulling his sled uphill. He started sledding only after finishing a snowman near the gate. That snowman was possible because snow had fallen during the night. The fresh snow was deep enough for both winter activities. His gloves were wool, with no waterproof cover over them. The final place in this account is the warm house. The overnight snowfall had provided material for the later snowman.",
      "prompt": "Which event came immediately before Theo went sledding?",
      "choices": [
        {
          "t": "he finished the snowman near the gate",
          "r": "KEY",
          "k": true
        },
        {
          "t": "snow fell during the night",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "he pulled the sled up the hill",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "he came into the warm house",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Work backwards through explicitly linked events to identify the predecessor of sledding."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The flower bed was wet when Aisha put the watering can away. She had just watered the new marigolds with it. Earlier, she had planted those small flowers in the cleared soil. Clearing the bed had meant pulling out its crowded weeds first. Those weeds would have competed with the new plants for space. The marigolds now had room around each little stem. Water could reach their roots through the loose bare soil. The empty can belonged on a shelf beside the back door.",
      "prompt": "What had to happen before Aisha planted the marigolds?",
      "choices": [
        {
          "t": "she cleared the weeds from the soil",
          "r": "KEY",
          "k": true
        },
        {
          "t": "she watered the newly planted flowers",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "she put the empty watering can away",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "she planted the marigolds in the bed",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Infer the preparation step from a backwards account and its stated purpose."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Rio's shoe was safe on the pier after the rescue. The lifeguard had lifted it from the water with a pole. Before lifting it, she had fetched that pole from her hut. Rio's call for help had sent her to the hut. He had called because his shoe had fallen into the water. The pole was long enough to reach below the pier. Rio stayed well back from the edge throughout the rescue. No one needed to enter the water to retrieve the shoe.",
      "prompt": "What happened immediately before Rio called for help?",
      "choices": [
        {
          "t": "his shoe fell from the pier",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the lifeguard fetched her long pole",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the lifeguard lifted the shoe out",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "he called to the lifeguard for help",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Reconstruct the cause-and-response order from a rescue narrated backwards."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The parcel for Aunt Mara already had an address on top. Ffion had written it after closing the box with tape. Before taping it, she had packed three wrapped jam jars inside. Earlier still, she had filled those jars with homemade jam. Paper around the jars kept their glass sides apart. The closed box left no room for another jar inside. The address belonged on the outside, where the post office could see. Each of these four jobs depended on the previous one being finished.",
      "prompt": "What did Ffion do immediately before closing the box?",
      "choices": [
        {
          "t": "packed the wrapped jars inside it",
          "r": "KEY",
          "k": true
        },
        {
          "t": "filled the jars with homemade jam",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "closed the lid using strong tape",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "wrote Aunt Mara’s address on top",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Reconstruct a packing sequence from the finished addressed parcel; all choices are stated jobs."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Rafi performed his part in the finished school play. The performance had come after several weeks of rehearsals. Those practices were possible once the teacher had chosen the cast. Rafi's audition had happened before that choice of actors. During the audition, every child had a chance to read. The teacher needed to know who suited each role. The rehearsal weeks were for learning the chosen roles together. The audience saw the finished performance, not that earlier work. Four stages led from trying out to the final play.",
      "prompt": "Which stage came first in preparing the play?",
      "choices": [
        {
          "t": "Rafi tried out during the audition",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the teacher chose the actors for roles",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the cast rehearsed the play together",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the actors performed for the audience",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Trace a performance back through practice and selection to the prerequisite audition."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The top of the wormery had a layer of dead leaves. Jude had added them after placing worms on the soil. Before the worms went in, he had made damp soil layers. The empty clear jar had been set on a tray first. The tray protected the table from loose soil and water. Clear sides made the layers easy to see from outside. The leaves were food above the worms' damp home. Soil supported the worms, while leaves rested above their new home.",
      "prompt": "What happened immediately before the worms went into the jar?",
      "choices": [
        {
          "t": "Jude built the damp layers of soil",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Jude placed the empty jar on its tray",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "Jude put the worms on the soil",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "Jude added dead leaves above the worms",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Reconstruct an assembly order from top-down description without inventing later worm behaviour."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The teams ate orange slices during their half-time break. The referee's half-time whistle had sounded just before the break. Elin had scored shortly before that whistle. Jo's goal was earlier than Elin's, in the opening minutes. Both goals were marked in order on the score sheet. The orange slices belonged to the rest period, not play. Four moments stood out in the coach's account of the half. The whistle separated playing time from time for food and rest.",
      "prompt": "Which event came immediately before the half-time whistle?",
      "choices": [
        {
          "t": "Elin scored her goal",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Jo scored in the opening minutes",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the teams ate their orange slices",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the referee signalled the half-time break",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Use a reverse account and relative timing to distinguish two similar scoring events."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "A letter begins its journey in a street postbox. A postal worker first empties the box into a collection bag. Letters for many different places are mixed together there. At the sorting centre, workers sort them by their destinations. Each group is ready for a different delivery area. A truck then carries the sorted letters to the local office. Finally, a carrier delivers each letter to the address on it. The address matters during sorting as well as at the end. These are four main stages of the journey.",
      "prompt": "What happens immediately after the postbox is emptied?",
      "choices": [
        {
          "t": "the letters are sorted by destination",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the letters travel to the local office",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the carrier delivers to each address",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the worker collects letters from the box",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Use destination grouping to place sorting between collection and transport."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "This chocolate workshop begins with cocoa beans ready for processing. Workers first dry the beans on wide trays in sunshine. Moisture needs to leave before the next stage. Then the workers roast those dried beans using heat. Roasting develops the flavour used in the finished chocolate. Next, a machine grinds the roasted beans into a smooth paste. Finally, workers mix the paste with the recipe's sugar and milk. Grinding makes small pieces suitable for mixing with those ingredients. The workshop diagram shows these four stages in order.",
      "prompt": "Which stage comes immediately before roasting?",
      "choices": [
        {
          "t": "drying the beans in sunshine",
          "r": "KEY",
          "k": true
        },
        {
          "t": "grinding the beans into a paste",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "mixing paste with sugar and milk",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "heating the dried beans in the roaster",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Place removal of moisture before heating and distinguish it from later grinding and mixing."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "At this recycling plant, used glass follows four main stages. Workers first sort the glass into groups by colour. Keeping colours separate helps control the colour of new glass. A machine then crushes each group into small pieces. Those smaller pieces are easier to heat evenly. Next, a very hot furnace melts the crushed glass. Finally, the liquid glass is shaped into new containers. Hard pieces cannot fill a container mould like flowing glass. The plant keeps each stage in its own marked area.",
      "prompt": "What happens immediately after the glass is crushed?",
      "choices": [
        {
          "t": "the pieces are melted in a furnace",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the glass is separated by colour",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the soft glass becomes new containers",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the sorted glass is broken into pieces",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Use the change from solid fragments to flowing material to locate melting before shaping."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "Ari's family had a little tradition for a lost tooth. First, his loose tooth fell out during breakfast. It was one of the baby teeth already ready to go. That night, Ari put the tooth beneath his pillow. While he slept, Dad exchanged it for a small coin. In the morning, Ari found the coin in its place. Dad's exchange explains why the objects were there at different times. The four events begin with losing the tooth and end with discovery.",
      "prompt": "What happened directly after Ari put the tooth under his pillow?",
      "choices": [
        {
          "t": "Dad exchanged the tooth for a coin",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the loose tooth fell out at breakfast",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "Ari found the coin in the morning",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "Ari placed the tooth beneath his pillow",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Follow the stated family tradition across waking and sleeping, using its explicit real-world mechanism."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "Bees make honey through several connected stages in their hive. First, foraging bees collect sweet nectar from flowers. That liquid contains more water than finished honey does. Next, hive bees place the prepared nectar in wax cells. They then fan their wings across those open cells. Moving air helps water leave the nectar as it thickens. Finally, bees seal the ready honey beneath wax covers. The cells need to stay open during the fanning stage. A cover belongs at the end of this four-stage account.",
      "prompt": "What do the bees do just before covering the cells?",
      "choices": [
        {
          "t": "move air across the open cells",
          "r": "KEY",
          "k": true
        },
        {
          "t": "collect sweet liquid from flowers",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "place nectar into the wax cells",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "seal the finished honey under wax",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Connect water removal to keeping cells open before the final sealing step."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "The rescue station has four main actions after an emergency call. First, the alarm sounds to summon the waiting crew. The crew then puts on waterproof suits and safety equipment. Those clothes protect them during work on cold, rough water. Next, they launch the rescue boat from its covered slipway. Only once afloat do they follow directions towards the reported location. The caller's position guides this final journey. Dressing belongs before launch because the crew must be protected already. The training chart keeps these four actions in order.",
      "prompt": "What comes immediately after the crew dresses for the rescue?",
      "choices": [
        {
          "t": "the rescue boat enters the water",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the station alarm calls the crew",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the crew puts on its protective clothes",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the boat heads towards the reported location",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Distinguish equipping, launching and travelling using their practical dependencies."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "A borrowed library book follows four steps on this return route. First, the reader slides it through the return slot. That slot leads to a padded box behind the counter. Next, a librarian checks the book for damage. This book has a loose page that needs attention. A helper then repairs the page with suitable binding tape. Finally, the librarian puts the repaired book back on its shelf. Checking first prevents damaged books returning straight to readers. A loose page could otherwise fall out during the next loan.",
      "prompt": "What happens directly after the book enters the return slot?",
      "choices": [
        {
          "t": "the librarian checks its condition",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the helper repairs its loose page",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the repaired book returns to its shelf",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the reader slides it into the box",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Place inspection before repair and shelving, without assuming another later loan occurs."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "At the soup garden, carrots follow four stages before cooking. First, children sow the seeds in loose garden soil. The growing roots will need space beneath the surface. Next comes a period of watering the developing carrot plants. Their leaves above ground help the roots grow below. When the carrots are ready, the children pull them from the soil. Finally, they wash the harvested roots in clean water. Soil belongs in the garden, not in the soup pot. Harvest must therefore come before this last cleaning stage.",
      "prompt": "Which stage comes immediately before the carrots are pulled up?",
      "choices": [
        {
          "t": "watering the plants while they grow",
          "r": "KEY",
          "k": true
        },
        {
          "t": "washing soil from the harvested roots",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "putting carrot seeds into the soil",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "pulling the ready carrots from the ground",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Track a biological growing period between sowing and harvest, separating plant care from food cleaning."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The library display was a tower made from large books. On Monday, Kit built the first three layers. On Tuesday, she added two heavy atlases at the bottom. That wider base made the tower less likely to fall. On Wednesday, she tested its steadiness with a marble on top. The little ball stayed still instead of rolling off. On Friday, she returned every book to its shelf. The display space was needed for the next class. The four dated jobs belonged to the same project.",
      "prompt": "What happened immediately before Kit tested the tower?",
      "choices": [
        {
          "t": "she made the base wider with atlases",
          "r": "KEY",
          "k": true
        },
        {
          "t": "she built its first three layers",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "she tested it with a marble",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "she returned its books to their shelves",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Place a strengthening step between initial building and the stability test."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The neighbours planned an outdoor film on the lawn. Before sunset, they spread blankets in front of the screen. The ground was dry, and the blankets marked each family's place. At six, helpers served snacks beside the garden gate. Everyone would have food ready before the screen became bright. At seven, the film began on the large white sheet. After the final scene, the families watched stars above the garden. By then the sky was fully dark. Their evening had followed the four parts of the plan.",
      "prompt": "Which event immediately followed laying out the blankets?",
      "choices": [
        {
          "t": "serving snacks near the gate",
          "r": "KEY",
          "k": true
        },
        {
          "t": "beginning the film on the screen",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "watching stars above the garden",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "spreading blankets across the lawn",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Use the evening schedule to place the meal between preparation and the film."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The rising tide washed away the castle's little shell windows. Leila had fitted those shells after making a tower of sand. The tower came from turning a full bucket onto the beach. Before turning it, she had packed the bucket tightly with sand. A firm shape would hold together better than loose handfuls. The shells needed that standing tower as their base. The sea reached the windows only at the end. The last event needed no bucket, shells or other building tools.",
      "prompt": "Which event happened first?",
      "choices": [
        {
          "t": "packing sand firmly into the bucket",
          "r": "KEY",
          "k": true
        },
        {
          "t": "turning out the bucket to make a tower",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "fitting shell windows into the tower",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the tide washed away the shell windows",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Work from destruction back through decoration and shaping to the necessary initial preparation."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The hall was quiet after helpers returned its borrowed chairs. Before that job, the choir had sung the concert's final song. The audience had taken their seats before any music began. Earlier still, a van had delivered the chairs to the hall. They were needed because the room normally had empty floors. Their rows gave every visitor a place to sit. The audience needed seats that had arrived before the performance. The empty floor gave the choir space for practice between concerts.",
      "prompt": "Which event happened first?",
      "choices": [
        {
          "t": "the van delivered chairs to the hall",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the audience sat down for the concert",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the choir sang its last song",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the helpers returned the borrowed chairs",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Infer the necessary preparation before seating from a concert told in reverse."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "A wool spinner shows four stages for making yarn from fleece. First, the fleece is washed to remove dirt and grease. The clean fibres are still tangled together at this point. Next, they are combed so the fibres lie alongside each other. That preparation makes the next job much easier. The spinner then twists the prepared fibres into a long yarn. Finally, the yarn is wound into a ball for storage. Combing prepares loose fibres; winding holds yarn already made. Those jobs belong on opposite sides of spinning.",
      "prompt": "Which stage follows washing the fleece?",
      "choices": [
        {
          "t": "combing the clean fibres into line",
          "r": "KEY",
          "k": true
        },
        {
          "t": "twisting prepared fibres into long yarn",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "winding finished yarn into a ball",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "removing dirt and grease with water",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Distinguish aligning loose fibres from later twisting and storing the finished yarn."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "The rescue centre describes four stages for this injured hedgehog. First, a vet examines its wound and general condition. The examination helps staff plan the care it needs. Next, trained helpers care for it in a warm indoor pen. Food and treatment support its recovery during that period. Once well, it moves to a larger sheltered outdoor pen. There it has more space to prepare for returning outside. Finally, staff release the healthy hedgehog in a suitable place. Release follows recovery, rather than taking the place of treatment.",
      "prompt": "What happens just before the hedgehog moves to the outdoor pen?",
      "choices": [
        {
          "t": "it receives care in the indoor pen",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the vet examines its injury and health",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "staff release it in a suitable place",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "it moves into the sheltered outdoor pen",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Order examination, recovery, outdoor preparation and release using the animal’s changing condition."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "On Monday, a red glove fell beside the school gate. Its owner was already far down the road. On Tuesday, a neighbour put it on the low wall. The raised spot was easier for passing families to see. On Wednesday, frost covered the glove's woollen fingers. Cold nights had left white crystals on the wall too. On Thursday, its owner collected it from that same place. A name inside the cuff confirmed that it was hers. These four events explain its journey back to its owner.",
      "prompt": "What happened just after the glove was placed on the wall?",
      "choices": [
        {
          "t": "frost covered its woollen fingers",
          "r": "KEY",
          "k": true
        },
        {
          "t": "it fell beside the school gate",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "it was raised onto the wall",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "its owner collected it again",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Follow one object across locations and days rather than treating finding and returning as adjacent."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "This crossing has four stages shown on its instruction card. First, a person presses the crossing button. That request does not make the road safe immediately. Next, the traffic light turns red for the cars. After cars have stopped, the walking signal appears for people. Finally, that walking signal changes to a flashing warning. The warning means no new walker should begin crossing. People already crossing can finish while the cars remain stopped. The order separates asking to cross from being told it is safe.",
      "prompt": "What signal comes immediately after the traffic light turns red?",
      "choices": [
        {
          "t": "the walking signal appears for people",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the crossing button is pressed",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the walking signal gives its flashing warning",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the red light tells cars to stop",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Distinguish the request, traffic stop, crossing permission and final warning in the stated system."
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The race had one clear turning point. A cone stood across the field from the start. The runner heard the signal. She ran to the cone. Then she touched it.",
      "prompt": "What happened first?",
      "choices": [
        {
          "t": "heard the signal",
          "r": "KEY",
          "k": true
        },
        {
          "t": "ran to the cone",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "touched the cone",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "The runner heard the signal. She ran to the cone. Then she touched it. What happened first?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The rolled map showed the whole town. Ada needed to mark the place for catching trains. Ada unrolled the map. She found the station. Then she circled it with a pencil.",
      "prompt": "What happened in the middle?",
      "choices": [
        {
          "t": "found the station",
          "r": "KEY",
          "k": true
        },
        {
          "t": "unrolled the map",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "circled the station",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "Ada unrolled the map. She found the station. Then she circled it with a pencil. What happened in the middle?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The nut had a shell too hard for biting. The solid path could help break it open. A crow picked up a nut. It dropped the nut onto a hard path. Then it ate from the broken shell.",
      "prompt": "What happened last?",
      "choices": [
        {
          "t": "ate from the shell",
          "r": "KEY",
          "k": true
        },
        {
          "t": "picked up the nut",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "dropped it on the path",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "A crow picked up a nut. It dropped the nut onto a hard path. Then it ate from the broken shell. What happened last?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Liam was inside with the front door closed. The window showed who was standing outside. Liam heard a knock. He looked through the window. Then he opened the door for Dad.",
      "prompt": "What happened first?",
      "choices": [
        {
          "t": "heard a knock",
          "r": "KEY",
          "k": true
        },
        {
          "t": "looked through the window",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "opened the door",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "Liam heard a knock. He looked through the window. Then he opened the door for Dad. What happened first?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "A rope held the little boat beside the bank. It needed releasing before the journey could begin. The sailor untied the rope. She pushed the boat from the bank. Then she began rowing.",
      "prompt": "What happened in the middle?",
      "choices": [
        {
          "t": "pushed the boat away",
          "r": "KEY",
          "k": true
        },
        {
          "t": "untied the rope",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "began rowing",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "The sailor untied the rope. She pushed the boat from the bank. Then she began rowing. What happened in the middle?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "A butterfly’s wings need drying before flight. The sheltered stem was safe for this slow change. A caterpillar changed into a chrysalis. Later, a butterfly came out. Finally, it flew away on its dry wings.",
      "prompt": "What happened last?",
      "choices": [
        {
          "t": "flew away",
          "r": "KEY",
          "k": true
        },
        {
          "t": "changed into a chrysalis",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "came out as a butterfly",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "A caterpillar changed into a chrysalis. Later, a butterfly came out. It waited, then flew away on dry wings. What happened last?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The price depended on the parcel’s weight. Sera was at the counter inside the post office. Sera weighed the parcel. She paid for a stamp. Then she posted the parcel.",
      "prompt": "What happened first?",
      "choices": [
        {
          "t": "weighed the parcel",
          "r": "KEY",
          "k": true
        },
        {
          "t": "paid for a stamp",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "posted the parcel",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "Sera weighed the parcel. She paid for a stamp. Then she posted the parcel. What happened first?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The audience was quiet in the small hall. The musician’s flute was still beside her chair. The musician lifted her flute. She played a tune. Then she bowed to the listeners.",
      "prompt": "What happened in the middle?",
      "choices": [
        {
          "t": "played a tune",
          "r": "KEY",
          "k": true
        },
        {
          "t": "lifted her flute",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "bowed to the listeners",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "The musician lifted her flute. She played a tune. Then she bowed to the listeners. What happened in the middle?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The banana still had its thick yellow skin. Smaller pieces would be easy for both children. Raj peeled a banana. He cut it into slices. Then he shared the slices with his sister.",
      "prompt": "What happened last?",
      "choices": [
        {
          "t": "shared the slices",
          "r": "KEY",
          "k": true
        },
        {
          "t": "peeled the banana",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "cut it into slices",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "Raj peeled a banana. He cut it into slices. Then he shared the slices with his sister. What happened last?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 23,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The floor had crumbs and sticky drink marks. Loose dirt needed clearing before the mop could help. The worker swept the floor. She washed it with a mop. Then she left it to dry.",
      "prompt": "What happened first?",
      "choices": [
        {
          "t": "swept the floor",
          "r": "KEY",
          "k": true
        },
        {
          "t": "washed it with a mop",
          "r": "D-SEQUENCE-START"
        },
        {
          "t": "left it to dry",
          "r": "D-SEQUENCE-END"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the requested ordinal among exactly three narrated events; context describes the setting or purpose.",
      "spoken": "The worker swept the floor. She washed it with a mop. Then she left it to dry. What happened first?",
      "displayPassageDuringResponse": true,
      "constructClaim": "story_event_order",
      "evidenceModality": "audio+text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The class had four jobs before its concert. On Monday, the children chose a song with a repeated chorus. Its words were short enough for everyone to remember. On Tuesday, they learned those words with their music teacher. On Wednesday, they added actions to go with the chorus. Each movement matched something named in the song. On Friday, they performed the song for their families. The words and actions were both part of that performance. Their wall chart showed the four stages in separate boxes.",
      "prompt": "Which job came directly before adding the actions?",
      "choices": [
        {
          "t": "learning the chosen song’s words",
          "r": "KEY",
          "k": true
        },
        {
          "t": "choosing a song for the concert",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "adding movements to the chorus",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "performing for their families",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Place learning words between choosing the material and adding a second performance demand."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The repaired vase stood on display beside the classroom window. Before displaying it, Soraya had glued its two pieces together. The pieces had needed cleaning before the glue could hold. She had found them in a dusty cupboard before that cleaning. Fine dust can stop glue touching the surfaces firmly. Both pieces belonged to the same small clay vase. Its matching edges showed where the join needed to be. Cleaning was important because the dusty edges needed a firm bond.",
      "prompt": "What happened immediately before Soraya cleaned the pieces?",
      "choices": [
        {
          "t": "she found them in the dusty cupboard",
          "r": "KEY",
          "k": true
        },
        {
          "t": "she joined them together with glue",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "she put the repaired vase on display",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "she cleaned dust from both broken pieces",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Reconstruct discovery, preparation, repair and display; every option is an event actually described."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "A wooden sign needs four preparation steps in this workshop. First, the maker rubs the rough board with sandpaper. A smooth surface is easier to write and paint on. Next, she draws the planned letters lightly in pencil. Those lines guide the brush during the following stage. She then paints the letters along the pencil shapes. The back needs hooks rather than painted letters. Last, she attaches hanging hooks to the back of the board. The hooks allow the prepared sign to hang from a rail.",
      "prompt": "What happens directly after drawing the pencil letters?",
      "choices": [
        {
          "t": "the letters are painted along their shapes",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the rough wood is smoothed with sandpaper",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the hanging hooks are fitted to the back",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the planned letters are drawn in pencil",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Use the guiding role of the pencil outline to locate painting before mounting hardware."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The walking tour started at the old town's stone castle. The guide showed the group its tall gate and towers. After the castle visit, the group walked down to the harbour. Fishing boats filled the water beside the narrow path. Next, everyone visited the little shops by the harbour wall. The shops sold postcards showing both boats and the castle. Finally, the group returned to its hotel beyond the square. The guide's map used four numbered stops for the day. Those numbers matched the route they had followed.",
      "prompt": "Which stop came directly after the castle?",
      "choices": [
        {
          "t": "the harbour with the fishing boats",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the small shops beside the wall",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the hotel beyond the square",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the castle with its tall towers",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Track four connected stops and distinguish the harbour from the adjacent shops."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The finished class poster hung beside the library door. Its photos had been glued down before it could hang there. Before gluing, Bo had arranged those pictures on the painted background. That background had dried before any photos touched it. Wet paint could have stuck to the pictures in unwanted places. Dry paint let Bo compare different spaces without a mess. The glue made the final arrangement stay in place. The last stage required photos that would stay attached when upright.",
      "prompt": "What happened directly before Bo glued the photos down?",
      "choices": [
        {
          "t": "he arranged them on the dry background",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the painted background became dry",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "he hung the finished poster by the door",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "he fastened the photos with glue",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Distinguish dry preparation from trial arrangement and final fastening in a reverse account."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "This classroom bottle already contains water and a little sand. Its lid is tight enough to prevent any leaks. First, Tessa shakes the sealed bottle until the water looks cloudy. Next, she sets it upright on the table. During the third stage, the grains settle towards the bottom. Gravity pulls the heavier sand out of the cloudy mixture. Finally, Tessa records the clear water above the settled layer. The still bottle makes that layer easier to observe. Her recording belongs after settling, not while the grains are moving.",
      "prompt": "What does Tessa do immediately after shaking the bottle?",
      "choices": [
        {
          "t": "places it upright on the table",
          "r": "KEY",
          "k": true
        },
        {
          "t": "waits while the grains settle down",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "records the clear layer above the sand",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "shakes the sealed bottle until cloudy",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Separate movement, placement, settling and final observation in a simple mixture investigation."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The rescue crew had a call from an island. A visitor there needed a safe way back to shore. First, the crew launched its boat from the slipway. Next, it crossed the narrow channel to the island. The water between the island and mainland was too deep for walking. At the island, the waiting visitor came aboard. Only then did the crew return to the mainland. The boat had an empty passenger seat on the outward crossing. That seat was occupied during the final part of the rescue.",
      "prompt": "What happened between launching and taking the visitor aboard?",
      "choices": [
        {
          "t": "the boat crossed towards the island",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the boat returned to the mainland",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the visitor climbed into the boat",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "the crew launched from the slipway",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Identify the connecting journey between departure and boarding using the changing passenger state."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The framed photograph had a blue prize ribbon beside it. Before framing it, Malik had entered its paper print in a contest. Before entering, he had printed his chosen photograph at home. The picture itself came from an earlier trip to the harbour. He had taken it while gulls rested on a fishing boat. The camera image needed to become a print for this contest. Its rules required paper entries instead of files on a screen. The frame protected that same print after the contest was over.",
      "prompt": "Which of these steps happened first?",
      "choices": [
        {
          "t": "Malik took the picture at the harbour",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Malik printed the picture at home",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "Malik entered the print in a contest",
          "r": "D-SEQUENCE-SWAP"
        },
        {
          "t": "Malik put the print into its frame",
          "r": "D-SEQUENCE-SWAP"
        }
      ],
      "media": "text",
      "note": "Track one image across taking, printing, entering and framing, described backwards."
    }
  ]
};
