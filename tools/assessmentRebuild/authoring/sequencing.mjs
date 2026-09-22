const K = t => ({t, r: "KEY", k: true});
const P = (t, r) => ({t, r});
// Sequencing: explicit ordinal retrieval at L1; relational and implied order at L2.
// Every alternative is an event from the passage. L1 has three true event choices.
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
      "passage": "The cat jumped onto the box. Then it curled into a ball. Last, it fell asleep.",
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
      "retention": false
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Mia planted a seed in soil. She watered it each day. Later, a green shoot grew.",
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
      "retention": false
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Ben wet his hands. Then he rubbed soap over them. Last, he rinsed the bubbles away.",
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
      "retention": false
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Zara pulled on a sock. Then she put on its shoe. Last, she tied the laces.",
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
      "retention": false
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Dad put bread in the toaster. The toast popped up. Then he spread butter on it.",
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
      "retention": false
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Noah threw the ball. The dog chased it. Then the dog brought it back.",
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
      "retention": false
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Lina drew a circle. Then she added sun rays. Last, she coloured the sun yellow.",
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
      "retention": false
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Omar set down his blocks. He stacked them into a tower. Then he smiled at the tall tower.",
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
      "retention": false
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Ava put bread on a plate. She added cheese to one slice. Then she closed the sandwich.",
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
      "retention": false
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Eli put on his boots. Then he opened his umbrella. Last, he walked outside.",
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
      "retention": false
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The girl opened her book. She read a page. Then she put a bookmark inside.",
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
      "retention": false
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Kai filled a cup with water. He drank the water. Then he put the cup in the sink.",
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
      "retention": false
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Mom cracked an egg into a bowl. She whisked it with a fork. Then she cooked it in a pan.",
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
      "retention": false
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The boy kicked the ball. It went into the goal. Then his team cheered.",
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
      "retention": false
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Nia washed the muddy dog. She dried its fur. Then she brushed its fur smooth.",
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
      "retention": false
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The baker mixed some dough. She shaped it into a loaf. Then she put it in the oven.",
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
      "retention": false
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "Sam put toothpaste on his brush. He brushed his teeth. Then he spat out the toothpaste.",
      "prompt": "What happened last?",
      "spoken": "Sam put toothpaste on his brush. He brushed his teeth. Then he spat out the toothpaste. What happened last?",
      "choices": [K("spat out the toothpaste"), P("added toothpaste", "D-SEQUENCE-START"), P("brushed his teeth", "D-SEQUENCE-END")],
      "media": "text",
      "evidenceModality": "audio+text",
      "constructClaim": "story_event_order",
      "displayPassageDuringResponse": true,
      "retention": false
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The child found some paper. She folded it into a plane. Then she flew it across the room.",
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
      "retention": false
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "Ivy picked an apple. She washed it under the tap. Then she took a bite.",
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
      "retention": false
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The boy rolled a large snowball. He added a smaller one for the head. Then he gave the snowman a hat.",
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
      "retention": false
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "Ana wrapped the gift. She tied a bow around it. Then she gave it to her friend.",
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
      "retention": false
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The class dug a hole. They planted a tree in it. Then they watered its roots.",
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
      "retention": false
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "Leo filled a bag with rubbish. He tied the bag shut. Then he put it in the bin.",
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
      "retention": false
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The bus stopped. Its doors opened. Then the children stepped off.",
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
      "retention": false
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Rae picked up a pencil. She drew a star. Then she coloured it red.",
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
      "retention": true
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Max opened the gate. He led the pony through. Then he shut the gate.",
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
      "retention": true
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "The frog sat by the pond. It jumped into the water. Then it swam away.",
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
      "retention": true
    },
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Jo poured cereal into a bowl. She added milk. Then she ate her breakfast.",
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
      "retention": true
    },
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The child zipped up a coat. He put on a hat. Then he went into the snow.",
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
      "retention": true
    },
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "Mia washed a plate. She dried it. Then she put it on the shelf.",
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
      "retention": true
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "Grandma picked the berries before the sun grew hot. She washed them, then boiled them with sugar. She tested a drop of jam on a cold plate. Once it set, she filled the jars. She added labels after they cooled.",
      "prompt": "What happened right BEFORE the jars were filled?",
      "choices": [
        {
          "t": "the jam passed the test",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the berries were picked",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the berries were washed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the labels went on",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "On day one, six eggs went under the warm lamp. The first crack appeared on day nineteen. Cheeping came from the shells on day twenty. All six chicks hatched the next day. By day twenty-three, their feathers were dry and fluffy.",
      "prompt": "What happened right AFTER the first crack appeared?",
      "choices": [
        {
          "t": "cheeping came from the shells",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the eggs went under the lamp",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the chicks became fluffy",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the six chicks hatched",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "Otto put on a gown for his haircut. The barber sprayed his hair with water, then cut it. Otto checked the finished haircut in a small mirror. After that, the barber took the lollipop jar off the shelf.",
      "prompt": "When did the lollipop jar come down?",
      "choices": [K("after he looked at the finished cut"), P("before he put on the haircut gown", "D-PLAUSIBLE-UNSUPPORTED"), P("while the barber sprayed his hair with water", "D-PLAUSIBLE-UNSUPPORTED"), P("before the barber began cutting his wet hair", "D-OPPOSITE")],
      "media": "text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The class put their coats and bags in lockers. They visited the dinosaur hall before eating lunch downstairs. After lunch, they visited the gift shop. Then they collected their belongings and left.",
      "prompt": "What did the class do right BEFORE lunch?",
      "choices": [
        {
          "t": "visited the dinosaur hall",
          "r": "KEY",
          "k": true
        },
        {
          "t": "put their bags in lockers",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "visited the shop for gifts",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "collected their coats to leave",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "In March, the class planted lettuce seeds in indoor pots. After the last frost in April, they moved the plants outside. They watered the plants and removed slugs throughout May. In June, they cut the lettuce for a salad.",
      "prompt": "When did the plants move outside?",
      "choices": [
        {
          "t": "after the last frost ended",
          "r": "KEY",
          "k": true
        },
        {
          "t": "before the seeds went into pots",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "after the lettuce was cut",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "after the month of slug removal",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The players cleaned their boots the evening before the match. The team list went up at noon on match day. Warm-up laps began at one. At two, the whistle blew to start the game.",
      "prompt": "When were the boots cleaned?",
      "choices": [K("the night ahead of match day"), P("at noon when the team list appeared", "D-PLAUSIBLE-UNSUPPORTED"), P("at two when the opening whistle blew", "D-PLAUSIBLE-UNSUPPORTED"), P("at one when the warm-up laps began", "D-OPPOSITE")],
      "media": "text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "At nine, Asha traced a long shadow stretching to the fence. Just after twelve, it was short and near her friend’s feet. At three, the shadow stretched in the other direction. By five, it was long enough to reach the hedge.",
      "prompt": "What was the shadow like just AFTER twelve?",
      "choices": [K("short, near the friend’s feet"), P("long enough to reach the fence", "D-PLAUSIBLE-UNSUPPORTED"), P("long enough to touch the hedge", "D-PLAUSIBLE-UNSUPPORTED"), P("stretching in the opposite direction", "D-OPPOSITE")],
      "media": "text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "They removed every book before moving the bookcase. Dad moved the empty case across the room. Then he vacuumed the carpet where it had stood. Finally, Robi put the books back in colour order.",
      "prompt": "What happened right BEFORE the books went back?",
      "choices": [
        {
          "t": "Dad cleaned the old spot",
          "r": "KEY",
          "k": true
        },
        {
          "t": "they emptied all the shelves",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Dad moved the empty bookcase",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Robi sorted books into colours",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Noor showed Mum a cake covered in icing and a cherry. The cake had been baked in two round pans. The empty pans were cooling beside the oven. Noor was licking the last icing from her fingers.",
      "prompt": "Which of these must have happened FIRST, before everything else?",
      "choices": [
        {
          "t": "baking the cake in the pans",
          "r": "KEY",
          "k": true
        },
        {
          "t": "putting the cherry onto the icing",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "licking the icing from fingers",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "showing Mum the finished cake",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "events told out of order; reader reconstructs bake → ice → cherry → wash → lick"
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "A snowman stood in the garden wearing Dad’s spare scarf. After building it, the children had ridden their sleds. Now they were back indoors with wet gloves on the rack. Fresh snow still covered the hill.",
      "prompt": "Which of these happened LAST, after all the rest?",
      "choices": [
        {
          "t": "bringing the wet things indoors",
          "r": "KEY",
          "k": true
        },
        {
          "t": "building the snowman with the scarf",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "riding the sleds down the hill",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "snow falling onto the ground",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The flower bed had been full of weeds that morning. Now marigolds grew in the spaces the weeds had occupied. The pulled weeds filled a wheelbarrow by the gate. Juno watered the new plants, then put the can away.",
      "prompt": "What had to happen BEFORE the marigolds were planted?",
      "choices": [
        {
          "t": "removing weeds from the spaces",
          "r": "KEY",
          "k": true
        },
        {
          "t": "watering the newly planted flowers",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "putting the watering can away",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "leaving the plants in the soil",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Rio sat with his rescued flip-flop beside the pool. The lifeguard had used a pole to reach it. She had fetched the pole after Rio called for help. He had called because the shoe fell into the water.",
      "prompt": "What happened just before Rio called for help?",
      "choices": [K("the shoe fell into the water"), P("the lifeguard fetched her long pole", "D-SEQUENCE-SWAP"), P("the lifeguard pulled the shoe to safety", "D-SEQUENCE-END"), P("Rio sat beside the pool with his shoe", "D-SEQUENCE-REVERSE")],
      "media": "text"
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Aunt Zainab had sealed every flap of the box with tape. Wrapped jam jars fitted tightly inside it. She made the jam, filled the jars, then wrapped them. Now she was writing the address on the sealed box.",
      "prompt": "What must have happened BEFORE the box was taped shut?",
      "choices": [
        {
          "t": "placing wrapped jars inside the box",
          "r": "KEY",
          "k": true
        },
        {
          "t": "writing on the sealed box",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "closing the box flaps with tape",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "checking the finished address label",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The school play had ended, and the actors were bowing. They had rehearsed only after the teacher chose the cast. The teacher had chosen them from the children who tried out. Flowers lay on stage beside the finished scenery.",
      "prompt": "Which of these came FIRST, long before tonight?",
      "choices": [
        {
          "t": "children trying out for parts",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the actors bowing after the show",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "rehearsing with the chosen cast",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "performing the play for an audience",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Juno’s wormery held worms tunnelling through layers of sand and soil. She had added the worms only once those layers were ready. Damp leaves covered the top, ready for the worms to eat. She was now washing soil from her trowel.",
      "prompt": "Which of these must have happened BEFORE the worms went in?",
      "choices": [
        {
          "t": "putting sand and soil in layers",
          "r": "KEY",
          "k": true
        },
        {
          "t": "worms making tunnels beside the glass",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "washing the soil from the trowel",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "worms beginning to eat the leaves",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "Ffion scored after the ball bounced to her from a teammate. Earlier, Jo’s shot had bounced off the post into the net. At half-time, the team ate oranges and talked about both goals. They had scored only those two goals so far.",
      "prompt": "Which event happened first?",
      "choices": [
        {
          "t": "Jo’s shot off the post",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Ffion’s shot from a teammate’s pass",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the team eating its oranges",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the team discussing both goals",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "A letter is placed in a street postbox. A worker empties the box into a sack. At the sorting centre, the letter is sorted by postcode. A truck carries it to the right town. Finally, a postal worker delivers it to the address.",
      "prompt": "What happens right AFTER the box is emptied?",
      "choices": [K("the worker sorts it by postcode"), P("the letter enters a street postbox", "D-PLAUSIBLE-UNSUPPORTED"), P("the truck carries it to town", "D-PLAUSIBLE-UNSUPPORTED"), P("a worker delivers it to the address", "D-OPPOSITE")],
      "media": "text"
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "For this recipe, the beans are dried in the sun. Next, they are roasted to develop their flavour. They are then ground into a thick paste. Sugar and milk are added before the mixture sets into bars.",
      "prompt": "What happens right BEFORE the beans are roasted?",
      "choices": [
        {
          "t": "they dry in the sun",
          "r": "KEY",
          "k": true
        },
        {
          "t": "they are ground into paste",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the mixture is shaped into bars",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the sugar and milk are added",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "Used glass bottles are collected and taken to a factory. Workers sort them by colour and crush them into small pieces. A furnace melts those pieces into liquid glass. Machines shape the liquid into new bottles.",
      "prompt": "What happens right AFTER the glass is smashed into small pieces?",
      "choices": [
        {
          "t": "the furnace melts the pieces",
          "r": "KEY",
          "k": true
        },
        {
          "t": "workers collect the used bottles",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "machines shape the new bottles",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "workers sort the bottles by colour",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "Ari described what happened when he lost his tooth. First, it wobbled for several days. Then it fell out while he ate an apple. He put it under his pillow at bedtime. In the morning, he found a coin in its place.",
      "prompt": "In Ari's list, what happens right AFTER the tooth goes under the pillow?",
      "choices": [
        {
          "t": "he finds a coin next morning",
          "r": "KEY",
          "k": true
        },
        {
          "t": "he notices the tooth wobbling",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the tooth falls out while eating",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "he puts the tooth under his pillow",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "Bees collect nectar from flowers and carry it home. Other bees pass it between them, adding substances that change it. They place it in wax cells and fan away excess water. Finally, they cover the cells with wax.",
      "prompt": "What do the bees do right BEFORE capping the cell?",
      "choices": [
        {
          "t": "fan away water from the nectar",
          "r": "KEY",
          "k": true
        },
        {
          "t": "carry nectar home from flowers",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "pass nectar between other bees",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "place fresh nectar into the cells",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "The rescue alarm sounds, and crew members run to the station. They put on their protective clothes and life jackets. Then they launch the boat down the ramp. Once afloat, they receive directions to the person needing help.",
      "prompt": "What happens right AFTER the crew members reach the station?",
      "choices": [
        {
          "t": "they put on protective clothing",
          "r": "KEY",
          "k": true
        },
        {
          "t": "they hear the rescue alarm",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "they launch the boat down the ramp",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "they receive directions while afloat",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "A reader borrows a book and takes it home. Later, the reader puts it through the return slot. Staff check the book and repair any torn pages. Finally, they return it to its place on the shelf.",
      "prompt": "What happens right AFTER the book comes back through the slot?",
      "choices": [
        {
          "t": "staff check it for damage",
          "r": "KEY",
          "k": true
        },
        {
          "t": "a reader borrows it again",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "staff place it on its shelf",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the reader takes it home",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "The class plants vegetable seeds in trays in spring. After the last frost, they move the seedlings into the garden. The plants are watered throughout the growing season. In autumn, the class pulls up the vegetables. They wash and chop them to make soup.",
      "prompt": "What happens right BEFORE the vegetables are pulled?",
      "choices": [
        {
          "t": "watering them through the growing season",
          "r": "KEY",
          "k": true
        },
        {
          "t": "planting their seeds in indoor trays",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "washing and chopping them for soup",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "moving the seedlings into the garden",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "On Monday, the class began two towers of books. By Tuesday, both towers were the same height. On Wednesday, they placed atlases across the gap. A marble rolled over this bridge for the first time Thursday. They returned the books to their shelves on Friday.",
      "prompt": "What happened right BEFORE the marble made its first crossing?",
      "choices": [
        {
          "t": "atlases were laid across the gap",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the two towers were first started",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "books were returned to their shelves",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the towers were built to equal height",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "Before sunset, the family checked their blankets for outdoor movie night. They set out snacks at six. The film began at seven. After it ended, they watched the stars in the dark sky.",
      "prompt": "When were the blankets checked?",
      "choices": [
        {
          "t": "at the start, before sunset",
          "r": "KEY",
          "k": true
        },
        {
          "t": "after the film had finished",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "while they looked at stars",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "when snacks were served at six",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The castle’s towers had bucket-shaped sides. Shells pressed into those sides formed little windows. A feather stood in the highest tower, added after the shells. The tide later washed the finished castle away.",
      "prompt": "Which of these must have happened FIRST?",
      "choices": [
        {
          "t": "packing and turning out bucketfuls of sand",
          "r": "KEY",
          "k": true
        },
        {
          "t": "pressing shell windows into the sides",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "adding the feather to the top tower",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the tide washing the castle away",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The concert had ended, and helpers were returning borrowed chairs. Neighbours had delivered those chairs before anyone began singing. After the last song, the singers had signed a thank-you card. The card now lay on the piano.",
      "prompt": "Which event happened FIRST?",
      "choices": [
        {
          "t": "neighbours delivering the concert chairs",
          "r": "KEY",
          "k": true
        },
        {
          "t": "singers putting their names on the card",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "helpers returning the chairs next door",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the performers finishing their last song",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "First, a sheep is sheared to collect its fleece. The fleece is washed, then combed to untangle the fibres. A spinning wheel twists those fibres into thread. Knitting needles turn the thread into a sweater.",
      "prompt": "What happens right AFTER the fleece is washed?",
      "choices": [
        {
          "t": "combs untangle the clean fibres",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the sheep loses its fleece",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "needles form the finished sweater",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the wheel twists fibres into thread",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "A rescued hedgehog is weighed and checked on arrival. It stays in a warm room until it can feed itself. Next, it moves to an outdoor pen to prepare for release. When ready, it returns to a suitable place in the wild.",
      "prompt": "What happens right BEFORE the hedgehog moves to the outdoor pen?",
      "choices": [
        {
          "t": "it feeds itself in the warm room",
          "r": "KEY",
          "k": true
        },
        {
          "t": "it is weighed when it first arrives",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "it returns to a wild outdoor place",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "it prepares for release in the pen",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The glove fell at the bus stop on Monday. Someone put it on the wall on Tuesday. Frost covered it on Wednesday. Priya recognised it from the bus on Thursday. She collected it and took it home on Friday.",
      "prompt": "What happened right AFTER the glove was put on the wall?",
      "choices": [
        {
          "t": "frost covered its outside",
          "r": "KEY",
          "k": true
        },
        {
          "t": "it fell at the bus stop",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Priya took it home",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Priya spotted it from the bus",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "At this crossing, pressing the button lights up the WAIT sign. The traffic light turns yellow, then red. Next, the walking symbol appears. People cross, and later the symbol starts blinking. Once everyone has finished crossing, cars can move again.",
      "prompt": "What happens right AFTER the traffic light turns red?",
      "choices": [K("the signal shows that people may walk"), P("the traffic light shows its yellow warning", "D-PLAUSIBLE-UNSUPPORTED"), P("the sign tells people they must wait", "D-PLAUSIBLE-UNSUPPORTED"), P("the walking symbol starts blinking at people", "D-OPPOSITE")],
      "media": "text",
      "retention": true
    },
    // Fresh retry stock: four additional questions in each phase.
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The runner heard the signal. She ran to the cone. Then she touched it.",
      "prompt": "What happened first?",
      "choices": [K("heard the signal"), P("ran to the cone", "D-SEQUENCE-START"), P("touched the cone", "D-SEQUENCE-END")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "The runner heard the signal. She ran to the cone. Then she touched it. What happened first?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "Ada unrolled the map. She found the station. Then she circled it with a pencil.",
      "prompt": "What happened in the middle?",
      "choices": [K("found the station"), P("unrolled the map", "D-SEQUENCE-START"), P("circled the station", "D-SEQUENCE-END")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "Ada unrolled the map. She found the station. Then she circled it with a pencil. What happened in the middle?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "A crow picked up a nut. It dropped the nut onto a hard path. Then it ate from the broken shell.",
      "prompt": "What happened last?",
      "choices": [K("ate from the shell"), P("picked up the nut", "D-SEQUENCE-START"), P("dropped it on the path", "D-SEQUENCE-END")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "A crow picked up a nut. It dropped the nut onto a hard path. Then it ate from the broken shell. What happened last?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Liam heard a knock. He looked through the window. Then he opened the door for Dad.",
      "prompt": "What happened first?",
      "choices": [K("heard a knock"), P("looked through the window", "D-SEQUENCE-START"), P("opened the door", "D-SEQUENCE-END")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "Liam heard a knock. He looked through the window. Then he opened the door for Dad. What happened first?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The sailor untied the rope. She pushed the boat from the bank. Then she began rowing.",
      "prompt": "What happened in the middle?",
      "choices": [K("pushed the boat away"), P("untied the rope", "D-SEQUENCE-START"), P("began rowing", "D-SEQUENCE-END")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "The sailor untied the rope. She pushed the boat from the bank. Then she began rowing. What happened in the middle?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "A caterpillar changed into a chrysalis. Later, a butterfly came out. It waited, then flew away on dry wings.",
      "prompt": "What happened last?",
      "choices": [K("flew away"), P("changed into a chrysalis", "D-SEQUENCE-START"), P("came out as a butterfly", "D-SEQUENCE-END")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "A caterpillar changed into a chrysalis. Later, a butterfly came out. It waited, then flew away on dry wings. What happened last?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "Sera weighed the parcel. She paid for a stamp. Then she posted the parcel.",
      "prompt": "What happened first?",
      "choices": [K("weighed the parcel"), P("paid for a stamp", "D-SEQUENCE-START"), P("posted the parcel", "D-SEQUENCE-END")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "Sera weighed the parcel. She paid for a stamp. Then she posted the parcel. What happened first?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "middle_event",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "middle_event",
      "passage": "The musician lifted her flute. She played a tune. Then she bowed to the listeners.",
      "prompt": "What happened in the middle?",
      "choices": [K("played a tune"), P("lifted her flute", "D-SEQUENCE-START"), P("bowed to the listeners", "D-SEQUENCE-END")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "The musician lifted her flute. She played a tune. Then she bowed to the listeners. What happened in the middle?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "last_event",
      "lvl": 1,
      "ph": 1,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "last_event",
      "passage": "Raj peeled a banana. He cut it into slices. Then he shared the slices with his sister.",
      "prompt": "What happened last?",
      "choices": [K("shared the slices"), P("peeled the banana", "D-SEQUENCE-START"), P("cut it into slices", "D-SEQUENCE-END")],
      "media": "text",
      "retention": true,
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "Raj peeled a banana. He cut it into slices. Then he shared the slices with his sister. What happened last?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "first_event",
      "lvl": 1,
      "ph": 2,
      "v": 23,
      "fmt": "COMPREHENSION",
      "cell": "first_event",
      "passage": "The worker swept the floor. She washed it with a mop. Then she left it to dry.",
      "prompt": "What happened first?",
      "choices": [K("swept the floor"), P("washed it with a mop", "D-SEQUENCE-START"), P("left it to dry", "D-SEQUENCE-END")],
      "media": "text",
      "retention": true,
      "note": "Fresh authored retry item: distinct situation and evidence."
    , spoken: "The worker swept the floor. She washed it with a mop. Then she left it to dry. What happened first?", displayPassageDuringResponse: true, constructClaim: "story_event_order", evidenceModality: "audio+text"},
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The class chose a song on Monday and learned its words Tuesday. They added actions on Wednesday. On Thursday, they practiced the complete performance. They performed for families on Friday.",
      "prompt": "What happened immediately before the complete practice?",
      "choices": [K("they worked out movements for the tune"), P("they chose the song for the performance", "D-PLAUSIBLE-UNSUPPORTED"), P("they learned the words for the first time", "D-PLAUSIBLE-UNSUPPORTED"), P("they performed the song for their families", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The museum displayed a repaired vase made from broken pieces. A photo showed those pieces being found underground. Another showed workers cleaning the dirt from them. Only clean pieces had been joined with the special glue.",
      "prompt": "Which event had to happen before cleaning the pieces?",
      "choices": [
        {
          "t": "finding the pieces underground",
          "r": "KEY",
          "k": true
        },
        {
          "t": "joining the pieces with glue",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "putting the vase on display",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "visitors seeing the repaired vase",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "To make the sign, rub the wood smooth first. Next, draw the letters lightly with a pencil. Paint over those letters and let the paint dry. Finally, attach hooks to hang the sign.",
      "prompt": "What happens immediately after drawing the letters?",
      "choices": [
        {
          "t": "paint is added over the pencil marks",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the wooden surface is rubbed smooth",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "hooks are attached to the finished sign",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the painted letters are left to dry",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "We visited the harbour after leaving the castle. Before the castle, we ate breakfast at the hotel. We returned to the hotel only after shopping near the harbour.",
      "prompt": "Which place did we visit immediately after the castle?",
      "choices": [
        {
          "t": "the harbour beside the shops",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the hotel for our breakfast",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the hotel after our shopping",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the shops after leaving the harbour",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The finished poster had photos glued beneath a painted heading. The teacher had allowed glue only after the paint dried. The pupils cut each photo from a magazine before arranging it. Now the poster hung beside the classroom door.",
      "prompt": "What had to finish before the photos could be glued?",
      "choices": [
        {
          "t": "the heading’s paint drying",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the poster hanging on the wall",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the teacher reading the finished poster",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "visitors seeing the photos beside the door",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "process_order",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "process_order",
      "passage": "For this experiment, fill the bottle halfway with water. Add a spoonful of sand, close the lid, and shake. Then stand it upright without moving it. Watch as the sand settles below the clear water.",
      "prompt": "What should happen right after shaking the closed bottle?",
      "choices": [
        {
          "t": "leave it standing still and upright",
          "r": "KEY",
          "k": true
        },
        {
          "t": "add the sand to the water",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "fill the bottle halfway with water",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "close the lid before it spills",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "before_after_relation",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "before_after_relation",
      "passage": "The rescue team received the call before launching their boat. They reached the island after crossing the channel. Once everyone was aboard, they returned to the mainland.",
      "prompt": "What happened between launching and reaching the island?",
      "choices": [
        {
          "t": "the boat crossed the channel",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the team received the first call",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the passengers climbed onto the boat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the boat returned to the mainland",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "implied_order",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "implied_order",
      "passage": "The winning photo now hung in a frame beside the desk. Its owner had entered it in a contest after printing it. The camera still held the original file from the mountain trip. The prize letter arrived before she bought the frame.",
      "prompt": "Which event happened first?",
      "choices": [
        {
          "t": "taking the photo during the trip",
          "r": "KEY",
          "k": true
        },
        {
          "t": "printing the chosen photo for the contest",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "receiving the letter about the prize",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "buying the frame for the winning photo",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    }
]
};
