// Individually authored comprehension evidence; normal and reserve items share the same quality requirements.
export default {
  "skillId": "sentence_comprehension",
  "skillName": "Sentence Comprehension",
  "items": [
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "Granny Bola planted red flowers beside the garden path.",
      "prompt": "What did Granny Bola plant?",
      "choices": [
        {
          "t": "red flowers along the garden path",
          "r": "KEY",
          "k": true
        },
        {
          "t": "red flowers far from the garden path",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "green beans along the garden path",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "green beans far from the garden path",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "The dentist gave Milo a sticker for sitting calmly.",
      "prompt": "What did Milo get from the dentist?",
      "choices": [
        {
          "t": "a sticker as a reward",
          "r": "KEY",
          "k": true
        },
        {
          "t": "a toy as a reward",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a brush for his teeth",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a sticker for his sister",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "Our mail carrier whistles music along the whole street.",
      "prompt": "Who whistles along the street?",
      "choices": [
        {
          "t": "the person who brings letters",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the person who sells bread",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the person who drives buses",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the person who sweeps paths",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "Baby Ren stacked four wooden blocks by himself.",
      "prompt": "Who stacked the four blocks?",
      "choices": [
        {
          "t": "Ren did it alone",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Ren and his dad",
          "r": "D-OPPOSITE"
        },
        {
          "t": "Ren and his sister",
          "r": "D-OPPOSITE"
        },
        {
          "t": "Ren and his friend",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "Uncle Dip burned two slices of toast before breakfast.",
      "prompt": "What went wrong before breakfast?",
      "choices": [
        {
          "t": "his toast got too dark",
          "r": "KEY",
          "k": true
        },
        {
          "t": "his toast fell onto the floor",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "his tea spilled on the table",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "his cups broke on the floor",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "The twins painted their bedroom door bright orange.",
      "prompt": "What did the twins paint?",
      "choices": [
        {
          "t": "the entrance to their bedroom",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the inside wall of their bedroom",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the entrance to their kitchen",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the inside wall of their kitchen",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "A magpie took the shiny bottle top from outside.",
      "prompt": "What did the bird take?",
      "choices": [
        {
          "t": "the top from a bottle",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the side of a box",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the lid from a jar",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the handle of a cup",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "Miss Faro fixed a wobbly table with folded card.",
      "prompt": "What did Miss Faro fix?",
      "choices": [
        {
          "t": "a table that was not steady",
          "r": "KEY",
          "k": true
        },
        {
          "t": "a chair that was not steady",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a table with a wet top",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a chair with a torn seat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "The choir practices in the hall every Tuesday.",
      "prompt": "When does the choir practice?",
      "choices": [
        {
          "t": "on Tuesday each week",
          "r": "KEY",
          "k": true
        },
        {
          "t": "on Friday each week",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "on Monday each week",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "on Sunday each week",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "Dad stores his glasses in an empty fruit bowl.",
      "prompt": "Where does Dad keep his glasses?",
      "choices": [
        {
          "t": "inside a bowl for fruit",
          "r": "KEY",
          "k": true
        },
        {
          "t": "beside a bowl for fruit",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "inside a box for toys",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "beside a box for toys",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "The frog hid under the largest pond leaf.",
      "prompt": "Where did the frog hide?",
      "choices": [
        {
          "t": "below the biggest leaf",
          "r": "KEY",
          "k": true
        },
        {
          "t": "above the biggest leaf",
          "r": "D-OPPOSITE"
        },
        {
          "t": "below the smallest leaf",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "above the smallest leaf",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "Swimming lessons at our school start after lunch every Friday.",
      "prompt": "When do swimming lessons start?",
      "choices": [
        {
          "t": "when Friday’s lunch is over",
          "r": "KEY",
          "k": true
        },
        {
          "t": "before Friday’s lunch has started",
          "r": "D-OPPOSITE"
        },
        {
          "t": "when Monday’s lunch is over",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "before Monday’s lunch has started",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "Mom parks her bike behind the recycling bins.",
      "prompt": "Where does Mom park her bike?",
      "choices": [
        {
          "t": "at the back of the bins",
          "r": "KEY",
          "k": true
        },
        {
          "t": "at the front of the bins",
          "r": "D-OPPOSITE"
        },
        {
          "t": "on the left of the bins",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "on the right of the bins",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "The market opens at seven in the morning.",
      "prompt": "When does the market first open?",
      "choices": [
        {
          "t": "at seven before lunch",
          "r": "KEY",
          "k": true
        },
        {
          "t": "at seven after lunch",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "at nine before lunch",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "at nine after lunch",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "Grandpa naps in the striped chair beside the roses.",
      "prompt": "Where does Grandpa nap?",
      "choices": [
        {
          "t": "on the chair near the flowers",
          "r": "KEY",
          "k": true
        },
        {
          "t": "on the chair near the window",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "on the bench near the flowers",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "on the bench near the window",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "The kitten was found inside the tall cupboard.",
      "prompt": "Where was the kitten found?",
      "choices": [
        {
          "t": "in the cupboard",
          "r": "KEY",
          "k": true
        },
        {
          "t": "on the cupboard",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "by the cupboard",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "under the cupboard",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text"
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "A girl in rain boots jumps over a puddle.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "A girl is sleeping in her warm bed indoors.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "A boy in rain boots is filling a puddle.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "A girl is painting a picture of rainy weather.",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "image-required",
      "img": "scene-girl-jumps-puddle",
      "imgAlt": "A girl in yellow rain boots jumping over a puddle.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "Two boys are carrying a ladder past the bakery.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Two boys are buying some buns at the bakery.",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "One boy is climbing up a ladder at home.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "Two bakers are carrying a table along the street.",
          "r": "D-VISUAL-NEIGHBOR"
        }
      ],
      "media": "image-required",
      "img": "scene-boys-ladder-bakery",
      "imgAlt": "Two boys carrying a long ladder past a bakery.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "A cat is sleeping curled inside an open umbrella.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "A cat is hiding indoors away from the rain.",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "A dog is sleeping beneath an umbrella near a door.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "A cat is playing with a loose ball of wool.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "image-required",
      "img": "scene-cat-umbrella",
      "imgAlt": "A cat asleep inside an open umbrella.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "Grandpa and a child are flying a red kite.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Grandpa is buying a red ball for a child.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "Two children are flying a pair of colourful kites.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "Grandpa is reading a book about different kinds of kites.",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "image-required",
      "img": "scene-grandad-child-red-kite",
      "imgAlt": "A grandpa and one child flying one red kite together.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "One red sock is falling from the hanging clothesline.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "One red sock is hanging safely on the clothesline.",
          "r": "D-OPPOSITE"
        },
        {
          "t": "The empty clothesline is swinging around in the wind.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "Someone is ironing a red shirt on an ironing board.",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "image-required",
      "img": "scene-red-sock-falling",
      "imgAlt": "One red sock dropping from a full clothesline toward the grass.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "Three ducks wait in line at the ice cream truck.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Three children are feeding ducks beside the quiet pond.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "An ice cream truck is driving past a farm.",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "One duck is swimming away from a small boat.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "image-required",
      "img": "scene-ducks-ice-cream-van",
      "imgAlt": "Exactly three ducks waiting at an ice cream truck.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "A boy is holding up a huge red jelly.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "A boy is eating from a small red bowl.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "A boy is dropping a tray full of red apples.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "A boy is washing a tall and empty glass.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "image-required",
      "img": "scene-boy-giant-jelly",
      "imgAlt": "A boy holding a tray with a huge red jelly above his head.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "A snowman is wearing a pair of sunglasses in sunshine.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "A snowman is slowly melting away in the rain.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "A child is wearing dark sunglasses at the beach.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "A snowman is wearing a warm scarf at night.",
          "r": "D-VISUAL-NEIGHBOR"
        }
      ],
      "media": "image-required",
      "img": "scene-snowman-sunglasses",
      "imgAlt": "A snowman wearing sunglasses on a sunny winter day.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "Pia tiptoed past the sleeping dog beside the doorway.",
      "prompt": "How did Pia move past the dog?",
      "choices": [
        {
          "t": "she stepped quietly on her toes",
          "r": "KEY",
          "k": true
        },
        {
          "t": "she ran quickly on the grass",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she jumped over its soft bed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she crawled under its low bench",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "The waiter carried six plates on one arm.",
      "prompt": "How did the waiter carry the plates?",
      "choices": [
        {
          "t": "balanced on his arm",
          "r": "KEY",
          "k": true
        },
        {
          "t": "stacked on a tray",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "packed in a box",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "spread on a cart",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "Grandma squeezed three lemons to make a drink.",
      "prompt": "How did Grandma make juice from the lemons?",
      "choices": [
        {
          "t": "she pressed the fruit",
          "r": "KEY",
          "k": true
        },
        {
          "t": "she peeled the fruit",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she boiled the fruit",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she chopped the fruit",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "The goalkeeper tipped the ball above the goal.",
      "prompt": "What did the goalkeeper do to the ball?",
      "choices": [
        {
          "t": "knocked it over the goal",
          "r": "KEY",
          "k": true
        },
        {
          "t": "caught it inside the goal",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "rolled it beside the goal",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "kicked it under the goal",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "Kofi taped the torn map back together on his desk.",
      "prompt": "What did Kofi do to the map?",
      "choices": [
        {
          "t": "joined its torn parts with tape",
          "r": "KEY",
          "k": true
        },
        {
          "t": "cut its folded parts with scissors",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "drew its missing roads with pencil",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "hung its top edge with string",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "The parrot copied Grandpa's loud cough throughout the whole afternoon.",
      "prompt": "What did the parrot do all afternoon?",
      "choices": [
        {
          "t": "copied the sound of Grandpa's cough",
          "r": "KEY",
          "k": true
        },
        {
          "t": "sang a song about Grandpa's cough",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "copied Grandpa's loud sneeze",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "whistled a tune while Grandpa coughed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "Ada rolled the biggest snowball in the street.",
      "prompt": "What did Ada do with the snow?",
      "choices": [
        {
          "t": "rolled it into a large ball",
          "r": "KEY",
          "k": true
        },
        {
          "t": "pressed it into a tall wall",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "dug it into a deep hole",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "shaped it into a small chair",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "The librarian stamped the return date inside my borrowed book.",
      "prompt": "What did the librarian do inside the book?",
      "choices": [
        {
          "t": "printed a date using a stamp",
          "r": "KEY",
          "k": true
        },
        {
          "t": "drew a face using a pencil",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "stuck a picture onto a page",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "wrote a price across the cover",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Because the lift was broken, the movers carried our furniture up the stairs.",
      "prompt": "Why did the movers use the stairs?",
      "choices": [
        {
          "t": "the lift could not work",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the stairs would save time",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the lift had no space",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the stairs were less steep",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Connect the failed lift with the alternative route used for moving furniture."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Rosa wore boots much bigger than her feet, so her footprints looked huge.",
      "prompt": "Why did Rosa leave huge footprints?",
      "choices": [
        {
          "t": "her boots were larger than her feet",
          "r": "KEY",
          "k": true
        },
        {
          "t": "her feet were larger than her boots",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the ground was softer than usual",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the mud was deeper than usual",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Relate the borrowed boot size to the marks, rather than assuming Rosa's feet were huge."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Although rain moved the picnic inside, everyone still enjoyed sharing the birthday cake.",
      "prompt": "What stayed enjoyable despite the rain?",
      "choices": [
        {
          "t": "sharing cake inside with everyone",
          "r": "KEY",
          "k": true
        },
        {
          "t": "sharing cake outside in the rain",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "sharing picnic games with everyone",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "sharing games outside in the rain",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Interpret although: moving indoors did not prevent enjoyment of the picnic."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "The sea looked calm from the beach, but a sign warned against swimming.",
      "prompt": "What does the sentence tell us about swimming?",
      "choices": [
        {
          "t": "the calm water might be unsafe",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the calm water must be safe",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the calm water would be warm",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the calm water would be shallow",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Reconcile calm appearance with the warning that limits what can be concluded."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Jin saved his pocket money because he wanted to buy Mom a birthday plant.",
      "prompt": "Why did Jin save his money?",
      "choices": [
        {
          "t": "for a plant to give Mom",
          "r": "KEY",
          "k": true
        },
        {
          "t": "for a plant to keep himself",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "for a present from his mom",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "for a present from his friend",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Connect saving with the purpose and intended recipient of the purchase."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "The bench still had wet paint, so a sign warned people against sitting there.",
      "prompt": "Why was the sign there?",
      "choices": [
        {
          "t": "to keep people off wet paint",
          "r": "KEY",
          "k": true
        },
        {
          "t": "to help people find a seat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to show people a new path",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to ask people to paint benches",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Connect the wet surface with the warning against sitting there."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Although Tara practiced in goal all week, she played forward in the final match.",
      "prompt": "How did Tara's match role differ from her practice role?",
      "choices": [
        {
          "t": "she attacked after practicing as goalkeeper",
          "r": "KEY",
          "k": true
        },
        {
          "t": "she kept goal after practicing as attacker",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she watched after practicing as goalkeeper",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she attacked after practicing as a helper",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Integrate the contrasting practice and match roles rather than retrieving one position."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Although the bread smelled good, it stayed untouched on the fair stall until opening time.",
      "prompt": "What happened to the bread before the fair?",
      "choices": [
        {
          "t": "it was left for later",
          "r": "KEY",
          "k": true
        },
        {
          "t": "it was eaten straight away",
          "r": "D-OPPOSITE"
        },
        {
          "t": "it was thrown in the bin",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "it was cut for a picnic",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Retain the negative clause despite the tempting food described first."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Maya passed her younger brother the brush because he wanted to paint the fence.",
      "prompt": "Who wanted to paint?",
      "choices": [
        {
          "t": "Maya's brother",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Maya herself",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Maya's sister",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Maya's mother",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "note": "Resolve he to the male recipient, not the person passing the brush."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "The hungry gull followed the fishing boat until it sailed away from the harbour.",
      "prompt": "What sailed away?",
      "choices": [
        {
          "t": "the fishing boat",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the following gull",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a passing ferry",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a small sailboat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "note": "Resolve it through the sailing action among a bird and a boat."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Sam lent Elise his new pencil, and she chewed its end during the lesson.",
      "prompt": "Whose pencil did Elise chew?",
      "choices": [
        {
          "t": "Sam's pencil",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Elise's pencil",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the teacher's pencil",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her brother's pencil",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "note": "Track his and she across lending and chewing to preserve ownership."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "The twins visited Auntie Vee on Sunday, and she taught them a new game.",
      "prompt": "Who taught the game?",
      "choices": [
        {
          "t": "Auntie Vee",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the twins",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "their mother",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "their grandpa",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "note": "Resolve singular she separately from plural them across the clauses."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Nia put a seedling beside two tall cacti, but it soon grew taller than them.",
      "prompt": "What grew taller?",
      "choices": [
        {
          "t": "the seedling",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the two cacti",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the plant shelf",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the flower pot",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "note": "Resolve singular it against plural them while comparing the plants."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Carmen proudly showed Grandpa the small robot that she had built from empty boxes.",
      "prompt": "Who built the robot?",
      "choices": [
        {
          "t": "Carmen",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Grandpa",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her dad",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her brother",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "note": "Resolve she inside a relative clause to the person who made the robot."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "The keeper fed the hungry penguins, so they were full before the first visitors arrived.",
      "prompt": "Who was full?",
      "choices": [
        {
          "t": "the penguins",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the visitors",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the keepers",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the seals",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "note": "Resolve they to the fed animals rather than the later visitors."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Effie waved to her cousin on the platform until the train had passed him.",
      "prompt": "Who did the train pass?",
      "choices": [
        {
          "t": "Effie's cousin",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Effie herself",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the train driver",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the ticket seller",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "note": "Resolve him to the person on the platform, not the passenger or driver."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "By lunchtime on Monday, every ticket for the puppet show had already been sold.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "No tickets were left by lunch.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Some tickets were left after lunch.",
          "r": "D-OPPOSITE"
        },
        {
          "t": "New tickets went on sale at lunch.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The puppet show was canceled at lunch.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Preserve every and by lunchtime when recasting sold tickets as none remaining."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "Ravi knows the route to the swimming pool without needing to ask for directions.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "Ravi can find his way there easily.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Ravi needs help to find his way.",
          "r": "D-OPPOSITE"
        },
        {
          "t": "Ravi has never gone to the pool.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Ravi always takes a new route there.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Restate knowing a route without help as finding the way independently."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "The whole class stood up before the final whistle ended the exciting football match.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "Everyone rose before the match finished.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Everyone rose after the match finished.",
          "r": "D-OPPOSITE"
        },
        {
          "t": "Everyone left before the match finished.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Everyone sat until the match finished.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Preserve the whole group, the action and its timing relative to the final whistle."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "Dad said he could smell the soup even from outside the closed kitchen door.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "Dad could smell the soup through the closed door.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Dad could smell the soup only beside the cooker.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Dad opened the kitchen door before smelling the soup.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Dad said the closed door kept the smell inside.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Preserve the surprising distance and closed barrier in the reported smell."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "Omar had stopped waiting calmly long before the late bus finally came around the corner.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "Omar grew impatient while waiting for the bus.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Omar stayed calm while waiting for the bus.",
          "r": "D-OPPOSITE"
        },
        {
          "t": "Omar missed the bus because he arrived late.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Omar left calmly before the bus arrived.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Restate stopped waiting calmly as growing impatient before the arrival."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "The new puppy chewed every shoe in the house while everyone was outside gardening.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "No shoe escaped the puppy's chewing.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Some shoes escaped the puppy's chewing.",
          "r": "D-OPPOSITE"
        },
        {
          "t": "The puppy only chewed its own toys.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The puppy carried shoes without chewing them.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Translate every shoe into no shoe escaping while keeping the puppy as agent."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "Lila found it hard to keep the birthday surprise a secret until her sister arrived.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "Hiding the birthday surprise from her sister was difficult.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Forgetting the birthday surprise before her sister arrived was difficult.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Hearing about her sister’s surprise made Lila feel worried.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Telling her sister the birthday surprise made Lila happy.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Restate the difficulty of withholding a surprise without turning it into forgetting."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "During the sudden storm, small balls of ice bounced all over the garden trampoline.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "Hail bounced across the trampoline during the storm.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Rain flowed beneath the trampoline during the storm.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Leaves stuck to the trampoline during the storm.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Wind lifted the trampoline up during the storm.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Replace the description of falling ice with hail while preserving its movement."
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "Auntie Meg won a prize for her huge pumpkin.",
      "prompt": "What won Auntie Meg a prize?",
      "choices": [
        {
          "t": "her very large pumpkin",
          "r": "KEY",
          "k": true
        },
        {
          "t": "her very large carrot",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her very small pumpkin",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her very small carrot",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 1,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "The school hamster sleeps all day and runs overnight.",
      "prompt": "When does the school hamster run?",
      "choices": [
        {
          "t": "during the night",
          "r": "KEY",
          "k": true
        },
        {
          "t": "during the day",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "only before lunch",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "only after lunch",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "A small dog leads a tall man down the street.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "A tall man is carrying a small dog along.",
          "r": "D-VISUAL-NEIGHBOR"
        },
        {
          "t": "Two dogs are running after a ball in the park.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "A man is buying a dog lead in a shop.",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "image-required",
      "img": "scene-small-dog-leads-tall-man",
      "imgAlt": "A very small dog leading a very tall man down a street.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true,
      "retention": true
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 1,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "The baker pressed a flower shape into each bread roll.",
      "prompt": "What did the baker do to each roll?",
      "choices": [
        {
          "t": "pressed in a flower design",
          "r": "KEY",
          "k": true
        },
        {
          "t": "cut it into a flower shape",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "painted on a flower design",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "tied it with a flower ribbon",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "literal_who_what",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "literal_who_what",
      "passage": "Little Ivo taught the parrot to say good morning.",
      "prompt": "Who taught the bird its greeting?",
      "choices": [
        {
          "t": "the child called Ivo",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the child’s mother",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the child’s neighbour",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the child’s grandfather",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "literal_where_when",
      "lvl": 1,
      "ph": 2,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "literal_where_when",
      "passage": "Robi’s sports clothes fill a drawer below his bed.",
      "prompt": "Where does Robi keep his sports clothes?",
      "choices": [
        {
          "t": "in the drawer under his bed",
          "r": "KEY",
          "k": true
        },
        {
          "t": "in the basket under his bed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "in the drawer beside his bed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "in the basket beside his bed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true
    },
    {
      "u": "picture_match",
      "lvl": 1,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "picture_match",
      "prompt": "Which sentence tells about this picture?",
      "spoken": "Look carefully at the picture. Which sentence tells about it?",
      "choices": [
        {
          "t": "The whole family is sleeping together on the sofa.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The whole family is eating together at the table.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The whole family is watching television from the sofa.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The whole family is reading together on the floor.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "image-required",
      "img": "scene-family-asleep-film",
      "imgAlt": "A family asleep together on a sofa beside a television.",
      "mediaRole": "scoring-evidence",
      "evidenceModality": "image+sentence",
      "constructClaim": "picture_to_sentence_meaning",
      "suppressStimulusAudio": true,
      "retention": true
    },
    {
      "u": "literal_action",
      "lvl": 1,
      "ph": 2,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "literal_action",
      "passage": "Mrs Cho got the ball down with a mop.",
      "prompt": "How did Mrs Cho get the ball down?",
      "choices": [
        {
          "t": "used a mop to reach it",
          "r": "KEY",
          "k": true
        },
        {
          "t": "climbed a ladder to reach it",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "threw a stick to move it",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "shook a branch to move it",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Identify the stated action or its manner without adding an unstated event."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Baby Bo blew all the birthday candles out, so Mom carefully lit them again.",
      "prompt": "Why did Mom light the candles again?",
      "choices": [
        {
          "t": "Bo had blown them out",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Bo had put them away",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the wind had blown them out",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the rain had made them wet",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Connect the extinguished candles with the reason for repeating an action."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Although the wait for lunch was long, Grandma thought the dumplings were worth it.",
      "prompt": "What did Grandma think about waiting?",
      "choices": [
        {
          "t": "the food made the wait worthwhile",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the food made the wait pointless",
          "r": "D-OPPOSITE"
        },
        {
          "t": "the line was too short to join",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the line was too noisy to join",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Interpret the positive judgement despite the negative waiting experience."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Priya read a bedtime story to her little brother until he finally fell asleep.",
      "prompt": "Who fell asleep?",
      "choices": [
        {
          "t": "her brother",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Priya",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her mother",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her sister",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "retention": true,
      "note": "Resolve he to the listener rather than the reader."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 2,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "The coach thanked the waiting parents because they had packed the cones after practice.",
      "prompt": "Who packed the cones?",
      "choices": [
        {
          "t": "the parents",
          "r": "KEY",
          "k": true
        },
        {
          "t": "the coach",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the players",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the referee",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "retention": true,
      "note": "Resolve they to the thanked group and their earlier contribution."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 1,
      "v": 10,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "When the children returned that afternoon, the incoming tide had covered their whole sandcastle.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "When the children returned, the whole castle was underwater.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "When the children returned, only the castle’s base was underwater.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The tide reached the whole castle after the children returned.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The children returned before the water reached their castle.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Retain both complete coverage and the deadline of the children’s return."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 2,
      "v": 9,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "The cheese smelled so bad that everyone opened the windows to let fresh air inside.",
      "prompt": "Which sentence means the SAME?",
      "choices": [
        {
          "t": "People let fresh air in because of the cheese.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "People let fresh air in to cool the cheese.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "People shut the windows to hide the cheese smell.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "People shut the windows because the cheese was cold.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Preserve the reason for opening the windows, rather than reversing the action."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "The window cleaner kept wiping the glass while he waved to the passing children.",
      "prompt": "What happened while the cleaner greeted the children?",
      "choices": [
        {
          "t": "he continued cleaning the window",
          "r": "KEY",
          "k": true
        },
        {
          "t": "he left the window to join them",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "he stopped cleaning to ask for help",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "he finished work and packed his cloths",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "retention": true,
      "note": "Recognise that the greeting and the cleaning happened together."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 1,
      "v": 11,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Grandma passed Jonah her spare glasses after he spotted a tiny bird in the hedge.",
      "prompt": "Who spotted the bird?",
      "choices": [
        {
          "t": "Jonah",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Grandma",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a bus driver",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "a gardener",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "copyExempt": "pronoun-reference-label",
      "retention": true,
      "note": "Resolve he to the bird spotter rather than the person handing over glasses."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "The lift was already full of passengers, so Mei waited downstairs for the next one.",
      "prompt": "Why did Mei wait?",
      "choices": [
        {
          "t": "there was no room inside the lift",
          "r": "KEY",
          "k": true
        },
        {
          "t": "her friends were waiting on the ground floor",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the lift could not reach the top floor",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she wanted to use the stairs instead",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Connect the lack of space in one lift with waiting for another."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "While Leo carried only the empty tray, Hana took all the drinks to the picnic table.",
      "prompt": "How were the things Leo and Hana carried different?",
      "choices": [
        {
          "t": "Leo had the empty tray; Hana had drinks",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Leo had drinks; Hana had the empty tray",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Leo had the table; Hana had both loads",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Leo had both loads; Hana had the table",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Integrate both carriers and distinguish an empty container from its usual contents."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Nina showed her drawings to Alex, and he chose the picture with a boat.",
      "prompt": "Who does \"He\" mean?",
      "choices": [
        {
          "t": "Alex, the person viewing Nina’s pictures",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Nina, the person showing Alex her pictures",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the person sailing in the drawn boat",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the teacher looking over Nina’s shoulder",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Resolve he to the viewer rather than the owner of the drawings."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "The children must wait outside the locked gate until an adult opens it for them.",
      "prompt": "Which sentence has the same meaning?",
      "choices": [
        {
          "t": "Children can enter after an adult opens the gate.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Children can open the gate whenever they reach it.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The gate closes only after the children have left.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "An adult must wait outside while children go in.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Preserve the adult-opening condition that determines when children may enter."
    },
    {
      "u": "two_clause",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "two_clause",
      "passage": "Before the visitors arrived, Arlo moved his models to make room for their bags.",
      "prompt": "Why did Arlo move his models before the visit?",
      "choices": [
        {
          "t": "to free a place for the visitors' bags",
          "r": "KEY",
          "k": true
        },
        {
          "t": "to show the visitors every model he owned",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to carry his models away with the visitors",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to pack his models inside the visitors' bags",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Connect an earlier action with its purpose for arriving visitors."
    },
    {
      "u": "pronoun_reference",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "pronoun_reference",
      "passage": "Amina gave the old coats to her neighbours, and they carried them to the shelter.",
      "prompt": "Who does \"They\" refer to?",
      "choices": [
        {
          "t": "the neighbours receiving the coats",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Amina carrying her old clothes",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the people already at the shelter",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the coats lying in the bag",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Resolve they to the recipients and them to the objects being carried."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "Only children who brought a permission slip could leave school to join the woodland walk.",
      "prompt": "Which sentence has the same meaning?",
      "choices": [
        {
          "t": "A permission slip was needed to go on the walk.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Every child went walking before returning to the school.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Children staying at school had all brought permission slips.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Ms Moss took the whole class out for a walk.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        }
      ],
      "media": "text",
      "note": "Interpret only as a necessary condition rather than universal permission."
    },
    {
      "u": "best_restatement",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "best_restatement",
      "passage": "Lena decorated every folded card except the blue one, which she left completely plain.",
      "prompt": "Which sentence has the same meaning?",
      "choices": [
        {
          "t": "The blue card alone had no decoration.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The blue card alone had some decoration.",
          "r": "D-OPPOSITE"
        },
        {
          "t": "None of the folded cards had any decoration.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "All of the folded cards had some decoration.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Interpret every except as one excluded card, not a sequence of craft steps."
    }
  ]
};
