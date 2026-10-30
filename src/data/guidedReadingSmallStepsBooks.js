// Original manuscripts and reviewed word records for Small Steps.
// This is the live authority; edit the complete manuscript and refresh its review together.
import { GUIDED_READING_SMALL_STEPS_DESCRIPTIONS } from "./guidedReadingSmallStepsDescriptions.js";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const MANUSCRIPTS = deepFreeze([
  {
    "id": "small-steps-01",
    "number": 1,
    "title": "A Cat on a Mat",
    "afterCycle": 10,
    "focus": "c and short vowels",
    "practiceWords": [
      "cat",
      "mat",
      "sit"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "am",
        "graphemes": [
          "a",
          "m"
        ],
        "sounds": [
          "æ",
          "m"
        ],
        "firstCycle": 1,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "big",
        "graphemes": [
          "b",
          "i",
          "g"
        ],
        "sounds": [
          "b",
          "ɪ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "cat",
        "graphemes": [
          "c",
          "a",
          "t"
        ],
        "sounds": [
          "k",
          "æ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "uː"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "fit",
        "graphemes": [
          "f",
          "i",
          "t"
        ],
        "sounds": [
          "f",
          "ɪ",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Name Sam obeys the same reviewed CVC code as other words."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:6101ba6c8cd6502d",
    "narrator": "Cat; first-person fictional animal narration, with no speech bubbles or human animal anatomy.",
    "cast": [
      "SMALL-CAT",
      "SMALL-SAM"
    ],
    "setting": "One sunny living-room corner; pale wood floor, cream wall, same low window at left throughout.",
    "props": [
      {
        "id": "SS01-MAT",
        "description": "One small round red woven mat, wide enough for seated Sam but not another animal beside him."
      }
    ],
    "coverBrief": "Cat pauses beside Sam, who is sitting cross-legged on the small red mat; Cat studies the crowded edge. Use the locked master, not the eventual solution pose.",
    "storySpine": "When Sam fills the little mat, Cat wants a place on it, but cannot fit beside him, so Cat settles on Sam instead and both fit.",
    "failedAttempt": "Page 4: Cat tries sitting beside Sam but cannot fit on the mat.",
    "turn": "Page 5: Cat uses the space on Sam's lap instead of the crowded mat edge.",
    "resolution": "Page 6: Cat fits comfortably on Sam, who remains on the mat.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I am a cat.",
        "imageBrief": "Cat foreground, Sam already seated on the red mat in background; Cat looks toward the mat.",
        "state": {
          "mat": "Sam seated on it; no spare area",
          "cat": "standing beside mat",
          "sam": "cross-legged; calm"
        }
      },
      {
        "pageNumber": 2,
        "text": "Sam is on the mat.",
        "imageBrief": "Show the mat boundary clearly around Sam's crossed legs; Cat approaches from the same side.",
        "state": {
          "mat": "occupied by Sam",
          "cat": "at mat edge",
          "sam": "seated"
        }
      },
      {
        "pageNumber": 3,
        "text": "Can I fit on the mat?",
        "imageBrief": "Cat examines the narrow space between Sam and the mat edge, lifting one paw toward it.",
        "state": {
          "mat": "still crowded",
          "cat": "testing space beside Sam",
          "sam": "watching Cat"
        }
      },
      {
        "pageNumber": 4,
        "text": "I sit. I do not fit.",
        "imageBrief": "Cat has tried sitting beside Sam; hindquarters extend off the mat onto the wood floor. No pushing, squashing or harm.",
        "state": {
          "mat": "Sam occupies center",
          "cat": "sitting partly off mat; attempt failed",
          "sam": "not moving Cat"
        }
      },
      {
        "pageNumber": 5,
        "text": "Sam is big.\nI sit on Sam.",
        "imageBrief": "Cat deliberately steps onto Sam's crossed legs and lowers into his lap; Sam leaves an open comfortable lap.",
        "state": {
          "mat": "Sam seated",
          "cat": "settling on Sam's lap",
          "sam": "welcoming Cat; hands relaxed"
        }
      },
      {
        "pageNumber": 6,
        "text": "I fit!",
        "imageBrief": "Cat curled comfortably on Sam's lap, whole pair over the red mat; Sam smiles at the quiet reversal. Four natural cat paws may be folded/occluded, not duplicated.",
        "state": {
          "mat": "accommodates both via Sam's lap",
          "cat": "comfortable curl",
          "sam": "seated with Cat"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What did Cat change after trying to sit beside Sam?",
        "listenFor": "Cat sat on Sam instead, so Cat could fit too."
      },
      "visual": {
        "page": 4,
        "prompt": "Point to the part of Cat that does not fit on the mat.",
        "lookFor": "Cat's hindquarters extend beyond the red mat onto the wooden floor beside Sam."
      }
    }
  },
  {
    "id": "small-steps-02",
    "number": 2,
    "title": "Mud on a Rug",
    "afterCycle": 10,
    "focus": "short u and g",
    "practiceWords": [
      "mud",
      "rug",
      "rag",
      "rub"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "no",
        "cycle": 5,
        "reason": "The vowel is long /oʊ/, not short o; exact HFW introduced in Cycle 5."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "hat",
        "graphemes": [
          "h",
          "a",
          "t"
        ],
        "sounds": [
          "h",
          "æ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "mud",
        "graphemes": [
          "m",
          "u",
          "d"
        ],
        "sounds": [
          "m",
          "ʌ",
          "d"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "no",
        "graphemes": [
          "n",
          "o"
        ],
        "sounds": [
          "n",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "The vowel is long /oʊ/, not short o; exact HFW introduced in Cycle 5."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rag",
        "graphemes": [
          "r",
          "a",
          "g"
        ],
        "sounds": [
          "ɹ",
          "æ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rub",
        "graphemes": [
          "r",
          "u",
          "b"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tub",
        "graphemes": [
          "t",
          "u",
          "b"
        ],
        "sounds": [
          "t",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:384d936b43a3c1fd",
    "narrator": "Dot, first person.",
    "cast": [
      "SMALL-DOT"
    ],
    "setting": "Same back-door utility area; pale tile floor, low blue tub beside the door; daylight unchanged.",
    "props": [
      {
        "id": "SS02-RUG",
        "description": "Small washable cream rag rug with blue border."
      },
      {
        "id": "SS02-RAG",
        "description": "One plain yellow cleaning rag, initially clean then muddy, rinsed clean."
      },
      {
        "id": "SS02-TUB",
        "description": "Low shallow blue tub with clear water present from page 1; water becomes slightly brown after rinse."
      },
      {
        "id": "SS02-HAT",
        "description": "Dot's simple blue sunhat worn throughout, bob visible beneath; small mud mark is planted at page 4."
      }
    ],
    "coverBrief": "Dot kneels beside the muddy cream rug, yellow rag in hand; blue tub and blue hat already present. Do not reveal the clean ending.",
    "storySpine": "When Dot's muddy shoe marks a washable rug, she wants the mud gone, but her muddy rag smears it, so she rinses the rag in a tub and wipes again, leaving the rug clean and a tiny unnoticed mark on her hat.",
    "failedAttempt": "Pages 2–4: rubbing with the same dirty rag spreads the mud.",
    "turn": "Pages 5–6: Dot cleans the rag before using it again.",
    "resolution": "Page 7 explicitly confirms no mud on the rug; page 8 pays off the small hat smear established during the failed attempt.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Mud is on the rug.",
        "imageBrief": "Dot notices one muddy shoe mark on the rug; one of her white trainer soles has mud. Yellow rag and blue water tub visible nearby.",
        "state": {
          "rug": "one mud mark",
          "rag": "clean nearby",
          "tub": "clear shallow water",
          "hat": "clean on Dot"
        }
      },
      {
        "pageNumber": 2,
        "text": "I rub the rug.",
        "imageBrief": "Dot rubs the mark with the yellow rag, lifting a little mud.",
        "state": {
          "rug": "partly smeared",
          "rag": "muddy patch developing",
          "tub": "clear",
          "hat": "clean"
        }
      },
      {
        "pageNumber": 3,
        "text": "Mud is on my rag.",
        "imageBrief": "Dot holds up the now muddy rag to inspect it; rug still visibly marked.",
        "state": {
          "rug": "mud remains",
          "rag": "clearly muddy",
          "tub": "clear",
          "hat": "clean"
        }
      },
      {
        "pageNumber": 4,
        "text": "I rub.\nMud is on my rug!",
        "imageBrief": "Using the dirty rag again makes a wider smear. Dot has adjusted her hat with a muddy fingertip, leaving one small mark at the brim; make the cause visible without adding a second central problem.",
        "state": {
          "rug": "wider smear",
          "rag": "muddy",
          "tub": "clear",
          "hat": "tiny mud mark now present"
        }
      },
      {
        "pageNumber": 5,
        "text": "I rub my rag in a tub.",
        "imageBrief": "Dot rubs the rag underwater in the existing shallow blue tub; rug stays marked beside her.",
        "state": {
          "rug": "still marked",
          "rag": "being rinsed",
          "tub": "water turning slightly brown",
          "hat": "same tiny mark"
        }
      },
      {
        "pageNumber": 6,
        "text": "No mud on my rag.\nI rub the rug.",
        "imageBrief": "Dot uses the visibly rinsed yellow rag on the rug, lifting the remaining smear. Keep tub water slightly brown.",
        "state": {
          "rug": "last smear being removed",
          "rag": "rinsed before second wipe",
          "tub": "slightly brown",
          "hat": "same mark"
        }
      },
      {
        "pageNumber": 7,
        "text": "No mud on the rug!",
        "imageBrief": "Dot holds up the now clean small rug; no original mud remains on its cream center or blue border.",
        "state": {
          "rug": "clean",
          "rag": "used at tub edge",
          "tub": "slightly brown",
          "hat": "small mark remains"
        }
      },
      {
        "pageNumber": 8,
        "text": "Mud is on my hat!",
        "imageBrief": "Dot notices the small established mark on her blue hat; amused close reaction, clean rug still in view. This is a small comic callback, not a new spreading mess.",
        "state": {
          "rug": "clean and usable",
          "rag": "at tub edge",
          "tub": "slightly brown",
          "hat": "same small mark; now noticed"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why did Dot clean the rag before rubbing the rug again?",
        "listenFor": "The muddy rag was spreading mud. The clean rag helped her remove it."
      },
      "visual": {
        "page": 4,
        "prompt": "What on this page shows that rubbing again did not solve the problem?",
        "lookFor": "The rug has a wider brown smear, and the same yellow rag is muddy."
      }
    }
  },
  {
    "id": "small-steps-03",
    "number": 3,
    "title": "A Pup in a Box",
    "afterCycle": 11,
    "focus": "p and final x",
    "practiceWords": [
      "pup",
      "box",
      "big"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "no",
        "cycle": 5,
        "reason": "The vowel is long /oʊ/, not short o; exact HFW introduced in Cycle 5."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "big",
        "graphemes": [
          "b",
          "i",
          "g"
        ],
        "sounds": [
          "b",
          "ɪ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Final x is the explicitly taught two-sound chunk ks; this is not a one-phoneme claim."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "fit",
        "graphemes": [
          "f",
          "i",
          "t"
        ],
        "sounds": [
          "f",
          "ɪ",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "hat",
        "graphemes": [
          "h",
          "a",
          "t"
        ],
        "sounds": [
          "h",
          "æ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "no",
        "graphemes": [
          "n",
          "o"
        ],
        "sounds": [
          "n",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "The vowel is long /oʊ/, not short o; exact HFW introduced in Cycle 5."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "pup",
        "graphemes": [
          "p",
          "u",
          "p"
        ],
        "sounds": [
          "p",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tug",
        "graphemes": [
          "t",
          "u",
          "g"
        ],
        "sounds": [
          "t",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:062d684321e7cc62",
    "narrator": "Sam, first person.",
    "cast": [
      "SMALL-SAM",
      "SMALL-PUP"
    ],
    "setting": "Same tidy living room; pale wooden floor; two open empty cardboard boxes established on page 1.",
    "props": [
      {
        "id": "SS03-SMALL-BOX",
        "description": "Plain low open cardboard box too small for Pup; wide opening fits on top of Sam's head without covering his face."
      },
      {
        "id": "SS03-BIG-BOX",
        "description": "Plain large open cardboard box, low enough for Pup to step in naturally; no lid, strings or tape."
      }
    ],
    "coverBrief": "Sam and Pup inspect the small open box while the bigger box is visible behind them; no animal enclosed or forced into a container.",
    "storySpine": "Sam wants Pup to settle in a box, but the first box is too small, so Sam brings a bigger open box; Pup fits, and Sam turns the small box into a funny hat.",
    "failedAttempt": "Pages 2–3: the first open box is too small for Pup to sit in.",
    "turn": "Page 4: Sam brings the larger box already visible in the room.",
    "resolution": "Page 6 explicitly places Pup in the big box; page 7 reuses the rejected small box as Sam's hat.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Can the pup fit in a box?",
        "imageBrief": "Sam gestures toward the small open box; Pup sniffs it. Larger open box visible across the room.",
        "state": {
          "smallBox": "open and empty",
          "bigBox": "open in background",
          "pup": "beside small box",
          "sam": "considering fit"
        }
      },
      {
        "pageNumber": 2,
        "text": "“Pup, sit in the box.”",
        "imageBrief": "Sam gives a friendly invitation; Pup voluntarily places front paws in the small box but cannot settle its whole body.",
        "state": {
          "smallBox": "Pup testing opening",
          "bigBox": "unchanged",
          "pup": "not seated; free to move",
          "sam": "hands away"
        }
      },
      {
        "pageNumber": 3,
        "text": "No.\nThe box is not big.",
        "imageBrief": "Pup stands beside the small box again; Sam sees the mismatch. No collapsed box or injury.",
        "state": {
          "smallBox": "too small and empty",
          "bigBox": "still available",
          "pup": "outside and comfortable",
          "sam": "recognizes size problem"
        }
      },
      {
        "pageNumber": 4,
        "text": "I tug a big box.",
        "imageBrief": "Sam pulls the larger empty box along the floor toward Pup. Pup and small box remain behind him.",
        "state": {
          "smallBox": "empty at original spot",
          "bigBox": "moving toward Pup",
          "pup": "watching",
          "sam": "pulling empty big box"
        }
      },
      {
        "pageNumber": 5,
        "text": "“Pup, sit in the big box.”",
        "imageBrief": "Sam gestures toward the larger open box; Pup steps over the low side unaided.",
        "state": {
          "smallBox": "unchanged",
          "bigBox": "Pup entering",
          "pup": "voluntary step into big box",
          "sam": "inviting"
        }
      },
      {
        "pageNumber": 6,
        "text": "The pup is in the big box.",
        "imageBrief": "Pup sits comfortably with ample room in the open big box; Sam looks pleased, small box still nearby.",
        "state": {
          "smallBox": "still empty",
          "bigBox": "comfortably holds Pup",
          "pup": "sitting relaxed",
          "sam": "noticing small box"
        }
      },
      {
        "pageNumber": 7,
        "text": "My hat is a box!",
        "imageBrief": "Sam wears the small open box lightly as a silly hat with face completely visible; Pup remains settled in the big box. Preserve two boxes only.",
        "state": {
          "smallBox": "on Sam's head as hat",
          "bigBox": "Pup remains inside",
          "pup": "relaxed",
          "sam": "amused"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What did Sam change so Pup could fit?",
        "listenFor": "He brought a bigger box. The small box became his hat."
      },
      "visual": {
        "page": 6,
        "prompt": "Point to the space that shows Pup fits in this box.",
        "lookFor": "There is room around Pup inside the open big box; Pup is comfortably seated."
      }
    }
  },
  {
    "id": "small-steps-04",
    "number": 4,
    "title": "Yum! A Bun!",
    "afterCycle": 11,
    "focus": "y at the start of a word",
    "practiceWords": [
      "yum",
      "bun",
      "fan"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "bun",
        "graphemes": [
          "b",
          "u",
          "n"
        ],
        "sounds": [
          "b",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "cut",
        "graphemes": [
          "c",
          "u",
          "t"
        ],
        "sounds": [
          "k",
          "ʌ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "fan",
        "graphemes": [
          "f",
          "a",
          "n"
        ],
        "sounds": [
          "f",
          "æ",
          "n"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "hot",
        "graphemes": [
          "h",
          "o",
          "t"
        ],
        "sounds": [
          "h",
          "ɑ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "yum",
        "graphemes": [
          "y",
          "u",
          "m"
        ],
        "sounds": [
          "j",
          "ʌ",
          "m"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Initial y is consonant /j/; this is a genuine food-reaction utterance."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:ba3695acb62fdcdb",
    "narrator": "Dot, first person; three pages of brief speech/reaction.",
    "cast": [
      "SMALL-DOT",
      "SMALL-DAD"
    ],
    "setting": "Same kitchen table, daylight; Dot seated, Dad beside table throughout.",
    "props": [
      {
        "id": "SS04-BUN",
        "description": "One plain round bun on a white plate, whole through page 4, cut into two halves on page 5; one bite missing only on page 8."
      },
      {
        "id": "SS04-FAN",
        "description": "Simple blue folded paper fan, no printed marks."
      },
      {
        "id": "SS04-KNIFE",
        "description": "Small plain table knife used only by Dad on page 5, then set aside beyond Dot's hands."
      }
    ],
    "coverBrief": "Dot looks eagerly at one bun on a plate; Dad nearby and blue fan on table. Gentle heat wisps indicate the obstacle without a burn or frightened expression.",
    "storySpine": "Dot wants to eat a bun, but it is too hot, so after fanning the whole bun fails she asks Dad to cut it and fans the pieces; the bun cools and she enjoys it.",
    "failedAttempt": "Pages 3–4: a quick fan of the whole bun does not cool it enough.",
    "turn": "Page 5: Dot asks Dad to cut the bun, changing the cooling setup before fanning again.",
    "resolution": "Page 7 states that the bun is no longer hot; page 8's genuine eating reaction pays off the opening Yum.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "“Yum! A bun!”",
        "imageBrief": "Dot smiles at the bun, hands safely beside the plate; Dad present in the same green shirt and tan trousers.",
        "state": {
          "bun": "whole; warm wisps",
          "fan": "on table",
          "knife": "with Dad out of Dot's reach",
          "dot": "eager"
        }
      },
      {
        "pageNumber": 2,
        "text": "The bun is hot.",
        "imageBrief": "Dot pauses before eating and sees warmth rising; no direct hot-food touch, red skin or injury.",
        "state": {
          "bun": "whole and too hot",
          "fan": "ready on table",
          "knife": "unchanged",
          "dot": "waiting"
        }
      },
      {
        "pageNumber": 3,
        "text": "I fan the bun.",
        "imageBrief": "Dot uses the blue paper fan toward the whole bun; Dad watches without taking over.",
        "state": {
          "bun": "whole; still warm",
          "fan": "in Dot's hand",
          "knife": "unchanged",
          "dot": "first cooling attempt"
        }
      },
      {
        "pageNumber": 4,
        "text": "The bun is hot!",
        "imageBrief": "Dot stops fanning and notices it still needs cooling; show remaining gentle heat wisps, no bite yet.",
        "state": {
          "bun": "whole and still too hot",
          "fan": "lowered",
          "knife": "unchanged",
          "dot": "attempt not enough"
        }
      },
      {
        "pageNumber": 5,
        "text": "“Dad, cut the bun.”",
        "imageBrief": "Dot points toward the bun; Dad cuts it into exactly two halves with the small table knife.",
        "state": {
          "bun": "cut into two halves",
          "fan": "with Dot",
          "knife": "used by Dad",
          "dot": "asks for a changed setup"
        }
      },
      {
        "pageNumber": 6,
        "text": "I fan the bun.",
        "imageBrief": "Dot fans the two bun halves; Dad has set the knife aside. Time passes through the action, not a new location.",
        "state": {
          "bun": "two halves cooling",
          "fan": "used by Dot",
          "knife": "set safely aside",
          "dot": "second attempt"
        }
      },
      {
        "pageNumber": 7,
        "text": "The bun is not hot.",
        "imageBrief": "Dot and Dad look at the cooled halves; no heat wisps remain and no bite yet.",
        "state": {
          "bun": "cooled; two halves",
          "fan": "set down",
          "knife": "aside",
          "dot": "ready to eat"
        }
      },
      {
        "pageNumber": 8,
        "text": "“Yum!”",
        "imageBrief": "Dot enjoys a bite from one half; the other half stays on the plate. Dad shares the satisfied moment, not a giant celebration.",
        "state": {
          "bun": "one bite from one half; other half intact",
          "fan": "on table",
          "knife": "aside",
          "dot": "eating happily"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What changed after the first fanning did not work?",
        "listenFor": "Dad cut the bun, and Dot fanned it again. Then it was not hot."
      },
      "visual": {
        "page": 5,
        "prompt": "What is Dad changing about the bun?",
        "lookFor": "The same single bun is being cut into two halves on its plate."
      }
    }
  },
  {
    "id": "small-steps-05",
    "number": 5,
    "title": "A Vet and a Hen",
    "afterCycle": 12,
    "focus": "short e and v",
    "practiceWords": [
      "vet",
      "hen",
      "pet"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Final x is the explicitly taught two-sound chunk ks; this is not a one-phoneme claim."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Decodable after Cycle 12 from g/e/t even though get is later listed for HFW review."
      },
      {
        "word": "hen",
        "graphemes": [
          "h",
          "e",
          "n"
        ],
        "sounds": [
          "h",
          "ɛ",
          "n"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "lap",
        "graphemes": [
          "l",
          "a",
          "p"
        ],
        "sounds": [
          "l",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "pet",
        "graphemes": [
          "p",
          "e",
          "t"
        ],
        "sounds": [
          "p",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "tap",
        "graphemes": [
          "t",
          "a",
          "p"
        ],
        "sounds": [
          "t",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "vet",
        "graphemes": [
          "v",
          "e",
          "t"
        ],
        "sounds": [
          "v",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:1c8890532ededb32",
    "narrator": "Dot, first person.",
    "cast": [
      "SMALL-DOT",
      "SMALL-DAD",
      "SMALL-HEN"
    ],
    "setting": "Quiet farm veterinary room with cream walls, low wooden bench, closed exterior door and pale clean floor; no other animals.",
    "props": [
      {
        "id": "SS05-BOX",
        "description": "One wide open low cardboard carrier with folded towel; safe open resting place, never closed around the hen."
      },
      {
        "id": "SS05-STETHOSCOPE",
        "description": "Plain dark stethoscope around Dad's neck, no lettering; no procedure required."
      },
      {
        "id": "SS05-MAT",
        "description": "One plain pale-green washable floor mat."
      }
    ],
    "coverBrief": "Dot and Dad kneel a short distance from the open hen carrier; hen looks out. Dad retains canonical green shirt and carries one plain stethoscope. No white-coat character replacement or invented labels.",
    "storySpine": "Dot wants the hen to settle for Dad the vet, but lifting it onto her lap fails, so Dot and Dad sit lower and invite the hen to approach; it settles on Dot's lap for a gentle pet.",
    "failedAttempt": "Pages 3–4: Dot's attempt to settle the hen on her lap fails and it hops down.",
    "turn": "Pages 5–6: Dot and Dad sit on the floor and Dot taps her lap instead of pursuing the hen.",
    "resolution": "Pages 7–8 explicitly place the hen on Dot's lap and show the calm gentle interaction.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dad is a vet.",
        "imageBrief": "Dad in canonical clothes with one plain stethoscope; Dot beside him and open hen carrier on low bench.",
        "state": {
          "hen": "in open carrier",
          "dot": "beside bench",
          "dad": "nearby and calm",
          "carrier": "open on low bench"
        }
      },
      {
        "pageNumber": 2,
        "text": "The hen is in a box.",
        "imageBrief": "Show hen standing comfortably in the open low carrier; Dot studies it. Same room and Dad nearby.",
        "state": {
          "hen": "inside open carrier",
          "dot": "preparing to help",
          "dad": "supervising",
          "carrier": "open"
        }
      },
      {
        "pageNumber": 3,
        "text": "I get the hen.",
        "imageBrief": "Under Dad's nearby guidance, Dot gently lifts the calm hen with both hands supporting its body, close to her lap, never by wings or feet.",
        "state": {
          "hen": "supported just above Dot's lap",
          "dot": "seated on low bench",
          "dad": "within reach",
          "carrier": "empty and open"
        }
      },
      {
        "pageNumber": 4,
        "text": "The hen is not on my lap.",
        "imageBrief": "Hen has hopped down safely onto the low floor mat; Dot's hands open without chasing it. No long fall or frantic bird.",
        "state": {
          "hen": "on floor mat",
          "dot": "lap empty",
          "dad": "watching calmly",
          "carrier": "empty"
        }
      },
      {
        "pageNumber": 5,
        "text": "The vet and I sit.",
        "imageBrief": "Dot and Dad sit on the floor at the hen's level, giving it space; bench and carrier remain in same places.",
        "state": {
          "hen": "on floor mat nearby",
          "dot": "seated on floor",
          "dad": "seated beside Dot",
          "carrier": "empty"
        }
      },
      {
        "pageNumber": 6,
        "text": "I tap my lap.",
        "imageBrief": "Dot gently taps her purple trousers on her lap; hen turns toward her voluntarily. Dad waits.",
        "state": {
          "hen": "approaching Dot",
          "dot": "inviting, not grabbing",
          "dad": "waiting",
          "carrier": "empty"
        }
      },
      {
        "pageNumber": 7,
        "text": "The hen is on my lap.",
        "imageBrief": "Hen has voluntarily stepped onto seated Dot's lap; its natural feet rest supported on her purple trousers.",
        "state": {
          "hen": "settled on Dot's lap",
          "dot": "still and relaxed",
          "dad": "beside her",
          "carrier": "empty"
        }
      },
      {
        "pageNumber": 8,
        "text": "The vet and I pet the hen.",
        "imageBrief": "Dot and Dad gently stroke hen's back while it stays relaxed on Dot's lap; natural wings folded, no extra limbs or implied treatment.",
        "state": {
          "hen": "calm on lap",
          "dot": "gentle contact",
          "dad": "gentle contact",
          "carrier": "open nearby"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What did Dot and the vet do differently after the hen hopped down?",
        "listenFor": "They sat lower and waited. Dot tapped her lap, and the hen came to her."
      },
      "visual": {
        "page": 5,
        "prompt": "What changed about where Dot and Dad are sitting?",
        "lookFor": "They are now on the floor at the hen's level rather than above it on the bench."
      }
    }
  },
  {
    "id": "small-steps-06",
    "number": 6,
    "title": "Sam and the Jam",
    "afterCycle": 13,
    "focus": "j",
    "practiceWords": [
      "jam",
      "lid",
      "tug"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "bun",
        "graphemes": [
          "b",
          "u",
          "n"
        ],
        "sounds": [
          "b",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "dip",
        "graphemes": [
          "d",
          "i",
          "p"
        ],
        "sounds": [
          "d",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "jam",
        "graphemes": [
          "j",
          "a",
          "m"
        ],
        "sounds": [
          "dʒ",
          "æ",
          "m"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "lid",
        "graphemes": [
          "l",
          "i",
          "d"
        ],
        "sounds": [
          "l",
          "ɪ",
          "d"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "pot",
        "graphemes": [
          "p",
          "o",
          "t"
        ],
        "sounds": [
          "p",
          "ɑ",
          "t"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Name Sam obeys the same reviewed CVC code as other words."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tug",
        "graphemes": [
          "t",
          "u",
          "g"
        ],
        "sounds": [
          "t",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:c57415aa1acde29c",
    "narrator": "Sam, first person.",
    "cast": [
      "SMALL-SAM",
      "SMALL-DAD"
    ],
    "setting": "Same kitchen table, one white plate and jam pot; daytime.",
    "props": [
      {
        "id": "SS06-JAM-POT",
        "description": "Short round clear plastic pot of red jam with a blue SNAP-ON lid, not a screw-top glass jar; snap rim makes upward tug plausible."
      },
      {
        "id": "SS06-BUN",
        "description": "One plain bun on white plate; no bite until after dip, not necessary to depict."
      },
      {
        "id": "SS06-LID",
        "description": "The same blue snap-on lid, attached through page 5, held away by page 6."
      }
    ],
    "coverBrief": "Sam tries the blue snap-on lid on the red jam pot, Dad beside him, bun and plate visible. No text on pot.",
    "storySpine": "Sam wants jam for his bun, but he cannot lift the pot's tight lid, so he asks Dad and they pull together; the lid opens, Sam dips his bun, and a small jam spot on Dad reveals how enthusiastic their tug was.",
    "failedAttempt": "Pages 2–3: Sam's solo tug leaves the snap-on lid in place.",
    "turn": "Pages 4–5: Sam asks for help and joins Dad in a coordinated pull rather than giving up or watching Dad solve it alone.",
    "resolution": "Pages 6–7 show the lid off the pot and Sam dipping his bun; page 8 notices the small jam spot planted during the opening.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "The jam is in a pot.",
        "imageBrief": "Sam looks from the closed clear jam pot to the plain bun; Dad nearby, ready to join but not acting yet.",
        "state": {
          "pot": "closed; jam inside",
          "lid": "attached",
          "bun": "whole on plate",
          "dad": "clean shirt"
        }
      },
      {
        "pageNumber": 2,
        "text": "I tug at the lid.",
        "imageBrief": "Sam pulls upward on the flexible snap lid while the pot stays on the table; no knife or unsafe prying.",
        "state": {
          "pot": "still closed",
          "lid": "under Sam's hands",
          "bun": "unchanged",
          "dad": "watching"
        }
      },
      {
        "pageNumber": 3,
        "text": "The lid is on the pot.",
        "imageBrief": "The lid remains firmly attached; Sam pauses and looks toward Dad.",
        "state": {
          "pot": "still closed",
          "lid": "attached",
          "bun": "unchanged",
          "dad": "available to help"
        }
      },
      {
        "pageNumber": 4,
        "text": "“Dad, tug at the lid.”",
        "imageBrief": "Sam invites Dad to help, keeping his own hand on one side of the lid.",
        "state": {
          "pot": "closed",
          "lid": "Sam holds one side",
          "bun": "unchanged",
          "dad": "reaching to other side"
        }
      },
      {
        "pageNumber": 5,
        "text": "Dad and I tug.",
        "imageBrief": "Sam and Dad pull upward together at opposite sides of the same flexible lid; tiny jam spot reaches Dad's lower green shirt as edge starts to release.",
        "state": {
          "pot": "lid edge releasing",
          "lid": "both holding it",
          "bun": "unchanged",
          "dad": "one small red jam spot planted"
        }
      },
      {
        "pageNumber": 6,
        "text": "The lid is not on the pot.",
        "imageBrief": "Lid held clear of the now open jam pot; one small spot remains on Dad's shirt.",
        "state": {
          "pot": "open",
          "lid": "separate above table",
          "bun": "whole",
          "dad": "same jam spot"
        }
      },
      {
        "pageNumber": 7,
        "text": "I dip my bun in the jam.",
        "imageBrief": "Sam dips one edge of the bun into the open pot; Dad sets lid on table. No extra buns appear.",
        "state": {
          "pot": "open",
          "lid": "on table",
          "bun": "one edge in jam",
          "dad": "same jam spot"
        }
      },
      {
        "pageNumber": 8,
        "text": "Jam is on Dad!",
        "imageBrief": "Sam notices the tiny established jam spot on Dad's shirt; Dad looks down with a playful surprised expression. Open pot, blue lid and jam-dipped bun remain visible.",
        "state": {
          "pot": "open and usable",
          "lid": "on table",
          "bun": "jam on one edge",
          "dad": "same small spot; now noticed"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How did Sam help open the pot after his first tug failed?",
        "listenFor": "He asked Dad and pulled with him. Then he could dip the bun in the jam."
      },
      "visual": {
        "page": 6,
        "prompt": "Point to the evidence that their tug worked.",
        "lookFor": "The blue lid is separate from the open jam pot."
      }
    }
  },
  {
    "id": "small-steps-07",
    "number": 7,
    "title": "Sam Can Zip",
    "afterCycle": 13,
    "focus": "z",
    "practiceWords": [
      "zip",
      "bag",
      "log"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "no",
        "cycle": 5,
        "reason": "The vowel is long /oʊ/, not short o; exact HFW introduced in Cycle 5."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "bag",
        "graphemes": [
          "b",
          "a",
          "g"
        ],
        "sounds": [
          "b",
          "æ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "hat",
        "graphemes": [
          "h",
          "a",
          "t"
        ],
        "sounds": [
          "h",
          "æ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "log",
        "graphemes": [
          "l",
          "o",
          "g"
        ],
        "sounds": [
          "l",
          "ɑ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "mug",
        "graphemes": [
          "m",
          "u",
          "g"
        ],
        "sounds": [
          "m",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "no",
        "graphemes": [
          "n",
          "o"
        ],
        "sounds": [
          "n",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "The vowel is long /oʊ/, not short o; exact HFW introduced in Cycle 5."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Name Sam obeys the same reviewed CVC code as other words."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tug",
        "graphemes": [
          "t",
          "u",
          "g"
        ],
        "sounds": [
          "t",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "zip",
        "graphemes": [
          "z",
          "i",
          "p"
        ],
        "sounds": [
          "z",
          "ɪ",
          "p"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:dfcc78a95f0b34be",
    "narrator": "Sam, first person.",
    "cast": [
      "SMALL-SAM"
    ],
    "setting": "Same living-room floor beside a low cupboard, daylight; preparation for a small outing without adding a travel scene.",
    "props": [
      {
        "id": "SS07-BAG",
        "description": "One red soft-sided day bag with black zipper and single large black pull; empty initially, open until page 7."
      },
      {
        "id": "SS07-HAT",
        "description": "One simple blue sunhat, packed on page 1 and never duplicated."
      },
      {
        "id": "SS07-MUG",
        "description": "One small unbreakable yellow camping mug, packed on page 2."
      },
      {
        "id": "SS07-LOG",
        "description": "One comically oversized but manageable rounded dry log, about two bag-widths long; no splinters, printed markings or animal inside."
      },
      {
        "id": "SS07-MAT",
        "description": "One plain green rectangular mat beside bag from first page."
      }
    ],
    "coverBrief": "Sam considers the open red bag and the too-large log, with blue hat and yellow mug nearby. Show one of each prop only; the joke is overpacking, not a dangerous load.",
    "storySpine": "Sam packs a hat, mug and absurdly large log, but cannot close his bag, so he removes the log and the bag zips shut.",
    "failedAttempt": "Pages 4–5: pulling cannot close the bag around the protruding log.",
    "turn": "Page 6: Sam changes the contents instead of pulling harder.",
    "resolution": "Page 7 explicitly zips the bag, with the oversized log left visibly on the mat.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "A hat is in my bag.",
        "imageBrief": "Sam has placed the blue hat inside the open red bag; yellow mug and large log await beside the same green mat.",
        "state": {
          "bag": "open with hat",
          "hat": "inside",
          "mug": "outside",
          "log": "outside",
          "zipper": "fully open"
        }
      },
      {
        "pageNumber": 2,
        "text": "A mug is in my bag.",
        "imageBrief": "Sam adds the yellow camping mug beside the hat; log remains outside.",
        "state": {
          "bag": "open with hat and mug",
          "hat": "inside",
          "mug": "inside",
          "log": "outside",
          "zipper": "open"
        }
      },
      {
        "pageNumber": 3,
        "text": "A log is in my bag!",
        "imageBrief": "Sam has put the oversized log partly into the bag; it visibly protrudes and pushes the sides apart. Hat and mug are still inside.",
        "state": {
          "bag": "overfilled",
          "hat": "inside",
          "mug": "inside",
          "log": "protruding from bag",
          "zipper": "cannot meet"
        }
      },
      {
        "pageNumber": 4,
        "text": "Can I zip my bag?",
        "imageBrief": "Sam studies the separated zipper edges around the protruding log and takes the pull.",
        "state": {
          "bag": "overfilled",
          "hat": "inside",
          "mug": "inside",
          "log": "protruding",
          "zipper": "open; Sam holds pull"
        }
      },
      {
        "pageNumber": 5,
        "text": "I tug. No!",
        "imageBrief": "Sam gives a small unsuccessful tug; the zipper remains apart, no torn bag or painful hand.",
        "state": {
          "bag": "unchanged and undamaged",
          "hat": "inside",
          "mug": "inside",
          "log": "still blocks closure",
          "zipper": "failed to close"
        }
      },
      {
        "pageNumber": 6,
        "text": "I set the log on a mat.",
        "imageBrief": "Sam lifts out the one log and places it on the established green mat; bag sides relax with hat and mug inside.",
        "state": {
          "bag": "now fits contents",
          "hat": "inside",
          "mug": "inside",
          "log": "on green mat",
          "zipper": "ready to close"
        }
      },
      {
        "pageNumber": 7,
        "text": "I zip my bag!",
        "imageBrief": "Sam closes the red bag successfully; the absurd log sits beside it on the mat, making the solution and joke clear. No new companion or object.",
        "state": {
          "bag": "closed and usable",
          "hat": "inside",
          "mug": "inside",
          "log": "left on mat",
          "zipper": "fully closed"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why could Sam zip the bag at the end?",
        "listenFor": "He took the big log out. The hat and mug fit without it."
      },
      "visual": {
        "page": 6,
        "prompt": "Point to what Sam removed from the bag.",
        "lookFor": "The one oversized log is on the green mat; the hat and mug remain in the bag."
      }
    }
  },
  {
    "id": "small-steps-08",
    "number": 8,
    "title": "A Hat for Dad",
    "afterCycle": 14,
    "focus": "short vowels and single consonants",
    "practiceWords": [
      "hat",
      "cap",
      "red"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "big",
        "graphemes": [
          "b",
          "i",
          "g"
        ],
        "sounds": [
          "b",
          "ɪ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "cap",
        "graphemes": [
          "c",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Capitalized name/role uses the same pronunciation, with no name exemption."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "ɡ",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "hat",
        "graphemes": [
          "h",
          "a",
          "t"
        ],
        "sounds": [
          "h",
          "æ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "run",
        "graphemes": [
          "r",
          "u",
          "n"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:c3d247f26c816cc6",
    "narrator": "SMALL-SAM",
    "cast": [
      "SMALL-SAM",
      "SMALL-DAD"
    ],
    "setting": "One uncluttered home playroom in daylight: cream wall, low wooden bench, pale wood floor, blue rectangular rug. Keep the entire short run indoors in this safe room.",
    "props": [
      {
        "id": "adult-red-hat",
        "design": "One red soft brimmed adult hat; same large crown throughout; never magically shrinks."
      },
      {
        "id": "child-red-cap",
        "design": "One red child-size baseball cap with a short brim, introduced beside the hat on page1; no writing or badge."
      },
      {
        "id": "blue-rug",
        "design": "Flat blue rectangular rug with no curled edges."
      }
    ],
    "coverBrief": "Sam wears the correctly fitting red cap beside Dad wearing the large red brimmed hat. Same master clothing and scale, warm home playroom, both smiling mid-step with full feet visible. No words.",
    "storySpine": "Sam tries a grown-up hat, discovers its size is the problem, and chooses a cap while Dad enjoys the big hat.",
    "failedAttempt": "The large hat slips from Sam as he runs and lands on the rug.",
    "turn": "Sam deliberately gives Dad the large hat, then chooses the small cap introduced at the start.",
    "resolution": "Sam gives the oversize hat to Dad, then runs in the smaller cap; both enjoy the game with securely fitting hats.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I get a red hat\nand a red cap.",
        "imageBrief": "Sam studies the large soft red brimmed hat and small red cap side by side on the low bench. Dad is nearby. Make the two hat shapes and sizes immediately distinguishable.",
        "state": {
          "hat": "on bench",
          "cap": "on bench",
          "Sam": "choosing",
          "Dad": "nearby"
        }
      },
      {
        "pageNumber": 2,
        "text": "I run in the big hat.",
        "imageBrief": "Sam takes a playful short run across the open rug wearing the oversized brimmed hat; it slides toward his eyes. Dad watches from the same room. Cap stays on bench.",
        "state": {
          "hat": "on Sam; loose and slipping",
          "cap": "bench",
          "Sam": "running"
        }
      },
      {
        "pageNumber": 3,
        "text": "The hat is on the rug!",
        "imageBrief": "The single red brimmed hat lands softly on the blue rug behind Sam, whose head is now bare. Clear surprised reaction; do not show him hurt or falling.",
        "state": {
          "hat": "on rug",
          "cap": "bench",
          "Sam": "bareheaded, stopped"
        }
      },
      {
        "pageNumber": 4,
        "text": "I get the hat.",
        "imageBrief": "Sam bends to retrieve the one large hat from the rug and looks toward Dad; cap remains visible on the bench.",
        "state": {
          "hat": "in Sam hands",
          "cap": "bench",
          "Sam": "choosing a new wearer"
        }
      },
      {
        "pageNumber": 5,
        "text": "I set the big hat on Dad.",
        "imageBrief": "Dad kneels to child height as Sam places the large red hat on his head. Both hands belong to Sam, and Dad retains green shirt/tan trousers.",
        "state": {
          "hat": "being set on Dad",
          "cap": "bench",
          "Dad": "kneeling"
        }
      },
      {
        "pageNumber": 6,
        "text": "The big hat is for Dad.",
        "imageBrief": "Dad stands in the comfortably fitting brimmed hat. Sam looks at its secure fit and then toward the smaller cap on the bench. No new hat appears.",
        "state": {
          "hat": "securely on Dad",
          "cap": "bench",
          "Sam": "noticing the smaller cap"
        }
      },
      {
        "pageNumber": 7,
        "text": "I run in the red cap.",
        "imageBrief": "Sam now takes a few playful running steps in the correctly fitting red baseball cap, with eyes unobstructed and cap secure. Dad keeps the larger brimmed hat. Bench is empty.",
        "state": {
          "hat": "on Dad",
          "cap": "on Sam; correct fit",
          "bench": "empty",
          "Sam": "running in secure cap"
        }
      },
      {
        "pageNumber": 8,
        "text": "Dad and I run.",
        "imageBrief": "Sam and Dad take matching comically small jogging steps across the clear playroom, both correctly fitting hats staying on. Their fixed clothing and full feet remain visible.",
        "state": {
          "hat": "on Dad, secure",
          "cap": "on Sam, secure",
          "ending": "shared game works"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why did Sam give Dad the big hat?",
        "listenFor": "The big hat slipped from Sam, but it fit Dad; Sam used the smaller cap. Evidence: pages2–3 and5–7."
      },
      "visual": {
        "page": 7,
        "prompt": "Point to Sam's cap. What shows that it fits?",
        "lookFor": "Sam wears the small cap with eyes clear; Dad wears the large brimmed hat. Compare with the slipping hat on page2."
      }
    }
  },
  {
    "id": "small-steps-09",
    "number": 9,
    "title": "A Nap in the Shop",
    "afterCycle": 15,
    "focus": "sh",
    "practiceWords": [
      "shop",
      "shut",
      "nap"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "am",
        "graphemes": [
          "a",
          "m"
        ],
        "sounds": [
          "æ",
          "m"
        ],
        "firstCycle": 1,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Final x represents the taught /ks/ chunk (two consonant sounds), first available Cycle11."
      },
      {
        "word": "cat",
        "graphemes": [
          "c",
          "a",
          "t"
        ],
        "sounds": [
          "k",
          "æ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "chat",
        "graphemes": [
          "ch",
          "a",
          "t"
        ],
        "sounds": [
          "tʃ",
          "æ",
          "t"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "ɡ",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "nap",
        "graphemes": [
          "n",
          "a",
          "p"
        ],
        "sounds": [
          "n",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Capitalized name/role uses the same pronunciation, with no name exemption."
      },
      {
        "word": "shop",
        "graphemes": [
          "sh",
          "o",
          "p"
        ],
        "sounds": [
          "ʃ",
          "ɑ",
          "p"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "shut",
        "graphemes": [
          "sh",
          "u",
          "t"
        ],
        "sounds": [
          "ʃ",
          "ʌ",
          "t"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:82312a8e71832b7e",
    "narrator": "SMALL-CAT",
    "cast": [
      "SMALL-SAM",
      "SMALL-DOT",
      "SMALL-CAT"
    ],
    "setting": "One home playroom corner in daylight. A small pretend shop made from a low brown cardboard stall has a simple hinged counter flap. No generated sign or printed prices.",
    "props": [
      {
        "id": "pretend-shop",
        "design": "Low plain brown cardboard stall with a hinged counter flap. No printed sign or prices."
      },
      {
        "id": "cat-box",
        "design": "One roomy open brown box beside the stall from the opening. Low safe sides, no lid, never covered or sealed."
      }
    ],
    "coverBrief": "Ginger-and-white cat with green collar curls in one open brown box beside a low cardboard pretend shop. Sam and Dot share a quiet smile beside the closed counter flap. Warm playroom, gentle humor, no words.",
    "storySpine": "A cat naps in the children's pretend shop, wakes when they chat, and chooses a box; the children notice and close the game quietly so the cat can settle.",
    "failedAttempt": "The cat's first nap is interrupted by the children chatting beside it.",
    "turn": "The cat moves into an open box; Sam and Dot notice its need for rest and shut their pretend shop.",
    "resolution": "The cat naps comfortably in the open box while the children finish their game quietly.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I am a cat.",
        "imageBrief": "Introduce the established ginger-and-white cat with green collar beside the children's low cardboard pretend shop. One roomy open brown box stands beside the stall. First-person animal narration does not imply human speech, gestures or clothing.",
        "state": {
          "cat": "awake, near stall",
          "shop": "open",
          "box": "empty and open"
        }
      },
      {
        "pageNumber": 2,
        "text": "I nap in the shop.",
        "imageBrief": "Cat sleeps comfortably on the clear lower shelf of the low stall. Its nose is unobstructed and natural paws curl beneath it. Sam and Dot approach the counter; box remains open beside stall.",
        "state": {
          "cat": "napping on lower stall shelf",
          "shop": "open",
          "box": "empty"
        }
      },
      {
        "pageNumber": 3,
        "text": "Sam and Dot chat.",
        "imageBrief": "Sam and Dot face each other at the pretend counter, mouths naturally open in animated conversation. The nearby cat's ears perk and eyes begin to open. No written speech or sound marks.",
        "state": {
          "children": "chatting beside cat",
          "cat": "waking",
          "shop": "open"
        }
      },
      {
        "pageNumber": 4,
        "text": "I sit up.",
        "imageBrief": "Cat sits upright on the lower shelf, fully awake with mildly surprised ears. Children begin to notice the cat. Preserve one cat, four natural legs and one tail.",
        "state": {
          "cat": "awake and sitting up",
          "children": "noticing interruption",
          "box": "available"
        }
      },
      {
        "pageNumber": 5,
        "text": "I get in a box.",
        "imageBrief": "Cat steps into the one roomy open brown box beside the stall. Sam and Dot watch its choice; it remains free to enter and leave.",
        "state": {
          "cat": "entering open box",
          "children": "watching",
          "shop": "open"
        }
      },
      {
        "pageNumber": 6,
        "text": "Sam and Dot shut the shop.",
        "imageBrief": "The children jointly close the cardboard counter flap and stop their conversation, wearing gentle quiet expressions. The cat box is beside the stall and remains uncovered.",
        "state": {
          "shop": "counter flap closed",
          "children": "quiet",
          "cat": "curling up in uncovered box"
        }
      },
      {
        "pageNumber": 7,
        "text": "I nap in the box.",
        "imageBrief": "Cat sleeps curled in the same open box. Sam and Dot sit quietly nearby with the pretend stall closed. Face, collar and unobstructed nose remain clear.",
        "state": {
          "cat": "napping safely in open box",
          "shop": "closed",
          "children": "quiet",
          "ending": "interrupted rest restored"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What changes so the cat can rest again?",
        "listenFor": "The cat wakes during the children's chat, moves to a box, and the children shut the shop quietly. The cat naps again. Evidence: pages2–7."
      },
      "visual": {
        "page": 4,
        "prompt": "How is the cat different from page2? What has just happened?",
        "lookFor": "It is upright and awake rather than curled asleep; Sam and Dot were chatting beside it on page3."
      }
    }
  },
  {
    "id": "small-steps-10",
    "number": 10,
    "title": "A Chip on a Chin",
    "afterCycle": 15,
    "focus": "ch",
    "practiceWords": [
      "chip",
      "chin",
      "dish"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "good",
        "cycle": 15,
        "reason": "Whole word taught in Cycle15; oo /ʊ/ is not in the regular code. Use it only as the exact taught word."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; final y is /aɪ/, not the initial consonant /j/ taught in Cycle11."
      },
      {
        "word": "of",
        "cycle": 4,
        "reason": "Whole word taught in Cycle4; o is schwa and f spells /v/ in this word."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      },
      {
        "word": "your",
        "cycle": 14,
        "reason": "Whole word taught in Cycle14; our is an untaught r-controlled vowel spelling. This record uses U.S. /jʊɹ/; /jɔɹ/ and reduced /jɚ/ are ordinary variants, not new code."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "big",
        "graphemes": [
          "b",
          "i",
          "g"
        ],
        "sounds": [
          "b",
          "ɪ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "bin",
        "graphemes": [
          "b",
          "i",
          "n"
        ],
        "sounds": [
          "b",
          "ɪ",
          "n"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "bit",
        "graphemes": [
          "b",
          "i",
          "t"
        ],
        "sounds": [
          "b",
          "ɪ",
          "t"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "chin",
        "graphemes": [
          "ch",
          "i",
          "n"
        ],
        "sounds": [
          "tʃ",
          "ɪ",
          "n"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "chip",
        "graphemes": [
          "ch",
          "i",
          "p"
        ],
        "sounds": [
          "tʃ",
          "ɪ",
          "p"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "dish",
        "graphemes": [
          "d",
          "i",
          "sh"
        ],
        "sounds": [
          "d",
          "ɪ",
          "ʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "ɡ",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "good",
        "graphemes": [
          "g",
          "oo",
          "d"
        ],
        "sounds": [
          "ɡ",
          "ʊ",
          "d"
        ],
        "firstCycle": 15,
        "type": "exception",
        "note": "Whole word taught in Cycle15; oo /ʊ/ is not in the regular code. Use it only as the exact taught word."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "mud",
        "graphemes": [
          "m",
          "u",
          "d"
        ],
        "sounds": [
          "m",
          "ʌ",
          "d"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; final y is /aɪ/, not the initial consonant /j/ taught in Cycle11."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "of",
        "graphemes": [
          "o",
          "f"
        ],
        "sounds": [
          "ə",
          "v"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Whole word taught in Cycle4; o is schwa and f spells /v/ in this word."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      },
      {
        "word": "this",
        "graphemes": [
          "th",
          "i",
          "s"
        ],
        "sounds": [
          "ð",
          "ɪ",
          "s"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Voiced th /ð/, first regular by Cycle15; do not use the unvoiced /θ/ sound."
      },
      {
        "word": "your",
        "graphemes": [
          "y",
          "our"
        ],
        "sounds": [
          "j",
          "ʊɹ"
        ],
        "firstCycle": 14,
        "type": "exception",
        "note": "Whole word taught in Cycle14; our is an untaught r-controlled vowel spelling. This record uses U.S. /jʊɹ/; /jɔɹ/ and reduced /jɚ/ are ordinary variants, not new code."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:191b9cd75d9ff20a",
    "narrator": "SMALL-SAM",
    "cast": [
      "SMALL-SAM",
      "SMALL-DOT",
      "SMALL-DAD"
    ],
    "setting": "One supervised picnic beside a garden table in daylight. Small muddy patch is beside the table, not the eating surface. Clean food stays in the blue dish; waste goes in the nearby bin.",
    "props": [
      {
        "id": "blue-dish",
        "design": "One blue dish on picnic table containing clean potato chips."
      },
      {
        "id": "dropped-chip",
        "design": "One large golden potato chip, becomes visibly muddy on page2 and stays in bin after page3; never served again."
      },
      {
        "id": "clean-chip",
        "design": "A different clean golden chip Dad takes from dish; one small dry fragment reaches Sam chin."
      },
      {
        "id": "bin",
        "design": "Small plain outdoor waste bin beside table, safely away from food."
      },
      {
        "id": "paper-napkin",
        "design": "One plain paper napkin available on picnic table from page1. Sam uses it to lift the muddy chip into the bin so he does not handle dirty food with the hand used for his fresh snack."
      }
    ],
    "coverBrief": "Sam smiles with one tiny golden chip fragment resting on his chin; Dot notices with friendly amusement, Dad and blue clean-food dish nearby. Natural anatomy, safe picnic setting, no words.",
    "storySpine": "Sam drops a chip, discards it safely, receives a clean chip in a dish and enjoys it; Dot spots a funny fragment on his chin, which he removes.",
    "failedAttempt": "The first chip lands in mud and cannot be eaten.",
    "turn": "Sam puts that chip in the bin; Dad gives him a clean one from a dish.",
    "resolution": "Sam removes the crumb from his chin after Dot playfully notices it.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I get a big chip.",
        "imageBrief": "Sam receives one large golden chip from Dad at the picnic table. Dad holds a blue dish ready for serving. Dot sits nearby; a plain paper napkin is on the table, and the small muddy patch is visible on the ground.",
        "state": {
          "firstChip": "clean in Sam hand",
          "cleanDish": "table",
          "chin": "clean"
        }
      },
      {
        "pageNumber": 2,
        "text": "The chip is in the mud!",
        "imageBrief": "The first chip lands in the small muddy patch below Sam hand. Sam looks surprised; the dish on the table remains clean and separate.",
        "state": {
          "firstChip": "muddy on ground",
          "dish": "clean",
          "chin": "clean"
        }
      },
      {
        "pageNumber": 3,
        "text": "I set the chip in the bin.",
        "imageBrief": "Sam lifts the muddy chip with the paper napkin and drops both into the bin while Dad supervises. Keep his fingers protected by the napkin, away from mud. Do not show the muddy chip near his mouth or back in the clean dish.",
        "state": {
          "firstChip": "in bin permanently",
          "Sam": "discarding",
          "dish": "clean",
          "napkin": "discarded with muddy chip; clean snack hand does not touch mud"
        }
      },
      {
        "pageNumber": 4,
        "text": "I get a chip in a dish.",
        "imageBrief": "Dad hands Sam the blue dish with a new visibly clean chip on it. Sam receives the dish and chip together. Dirty chip and used napkin remain in the bin; no muddy hand touches the fresh food.",
        "state": {
          "secondChip": "clean, served in blue dish to Sam",
          "firstChip": "bin",
          "chin": "clean",
          "dish": "in Sam hands"
        }
      },
      {
        "pageNumber": 5,
        "text": "“This chip is good!”",
        "imageBrief": "Sam tastes a small bite of the clean chip with a pleased expression as he says it is good. The blue dish rests in his other hand or on the table. One tiny dry fragment is just reaching his chin; no choking pose.",
        "state": {
          "secondChip": "bitten",
          "fragment": "falling toward chin",
          "dish": "table",
          "speaker": "Sam"
        }
      },
      {
        "pageNumber": 6,
        "text": "A bit of chip is on my chin.",
        "imageBrief": "Readable close view of Sam noticing exactly one small golden chip fragment on his chin. He glances downward with a surprised smile while Dot also notices it. The blue food dish is clearly separate; no extra food on clothes or face.",
        "state": {
          "fragment": "on Sam chin",
          "Sam": "noticing fragment with surprise",
          "Dot": "noticing"
        }
      },
      {
        "pageNumber": 7,
        "text": "“Is your chin a dish?”",
        "imageBrief": "Dot asks the playful question with a smile, pointing gently toward her own chin rather than poking Sam. Sam smiles at the comparison with the blue dish; the single fragment remains on his chin.",
        "state": {
          "fragment": "still on Sam chin",
          "speaker": "Dot",
          "mood": "shared friendly joke"
        }
      },
      {
        "pageNumber": 8,
        "text": "I get the bit of chip.\n“It is not!”",
        "imageBrief": "Sam removes the single fragment with his own fingers and laughs with Dot. His chin is now clear; the clean dish and discarded dirty chip remain separate.",
        "state": {
          "fragment": "removed in Sam fingers",
          "chin": "clear",
          "ending": "safe snack and shared joke"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Sam do after the chip lands in mud?",
        "listenFor": "He puts it in the bin. Then he gets a new chip in a dish and enjoys that clean chip. Evidence: pages2–5."
      },
      "visual": {
        "page": 6,
        "prompt": "Where is the little bit of chip? What makes the picture funny?",
        "lookFor": "The fragment is on Sam's chin rather than in the blue dish. Sam and Dot notice the harmless mix-up."
      }
    }
  },
  {
    "id": "small-steps-11",
    "number": 11,
    "title": "This and That",
    "afterCycle": 15,
    "focus": "th, sh and ch",
    "practiceWords": [
      "this",
      "that",
      "thin",
      "fin"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Final x represents the taught /ks/ chunk (two consonant sounds), first available Cycle11."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "fat",
        "graphemes": [
          "f",
          "a",
          "t"
        ],
        "sounds": [
          "f",
          "æ",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "fin",
        "graphemes": [
          "f",
          "i",
          "n"
        ],
        "sounds": [
          "f",
          "ɪ",
          "n"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "fish",
        "graphemes": [
          "f",
          "i",
          "sh"
        ],
        "sounds": [
          "f",
          "ɪ",
          "ʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "ɡ",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "kit",
        "graphemes": [
          "k",
          "i",
          "t"
        ],
        "sounds": [
          "k",
          "ɪ",
          "t"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "leg",
        "graphemes": [
          "l",
          "e",
          "g"
        ],
        "sounds": [
          "l",
          "ɛ",
          "ɡ"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "that",
        "graphemes": [
          "th",
          "a",
          "t"
        ],
        "sounds": [
          "ð",
          "æ",
          "t"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Voiced th /ð/, first regular by Cycle15; do not use the unvoiced /θ/ sound."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      },
      {
        "word": "thin",
        "graphemes": [
          "th",
          "i",
          "n"
        ],
        "sounds": [
          "θ",
          "ɪ",
          "n"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Unvoiced th /θ/, first regular by Cycle15; contrasted with voiced this/that."
      },
      {
        "word": "this",
        "graphemes": [
          "th",
          "i",
          "s"
        ],
        "sounds": [
          "ð",
          "ɪ",
          "s"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Voiced th /ð/, first regular by Cycle15; do not use the unvoiced /θ/ sound."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:bac73f1aeaac227e",
    "narrator": "SMALL-SAM",
    "cast": [
      "SMALL-SAM",
      "SMALL-DOT"
    ],
    "setting": "One low indoor craft table in daylight. Pre-cut reusable felt shapes attach by safe fabric tabs. No scissors, glue gun, pins, printed labels or live animal.",
    "props": [
      {
        "id": "fish-body",
        "design": "One flat oval turquoise felt fish body with tail and one simple eye; initially missing its side fin."
      },
      {
        "id": "thin-fin",
        "design": "One thin blue triangular felt fin, visibly distinct from the leg."
      },
      {
        "id": "fat-leg",
        "design": "One broad yellow felt animal leg/foot from the mixed kit, deliberately wrong for fish; no body-shaming character joke."
      },
      {
        "id": "kit-box",
        "design": "One open plain craft box, holding surplus shapes without readable text."
      }
    ],
    "coverBrief": "Sam holds a funny flat turquoise felt fish with a yellow leg attached, while Dot holds up the correct thin blue fin. Friendly shared surprise, same master clothing, craft table, no words.",
    "storySpine": "Sam and Dot make a fish from a mixed shape kit, laugh at a misplaced leg, then replace it with the correct fin.",
    "failedAttempt": "Sam attaches a chunky leg to the fish body instead of its thin fin.",
    "turn": "Dot points out that the attached part is not a fin; Sam removes it.",
    "resolution": "Sam attaches the thin fin and the pair recognize their completed fish.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dot and I get a fish kit.",
        "imageBrief": "Sam and Dot open the felt fish kit together at the low table. One turquoise fish body, blue fin and broad yellow felt leg are ready inside the plain box. No tools or live fish.",
        "state": {
          "fish": "missing fin",
          "fin": "on table",
          "leg": "on table",
          "box": "open"
        }
      },
      {
        "pageNumber": 2,
        "text": "I get a thin fin\nand a fat leg.",
        "imageBrief": "Sam holds the thin blue triangular fin in one hand and broad yellow felt leg in the other. Dot watches and the turquoise fish body rests flat on the table.",
        "state": {
          "fin": "Sam hand",
          "leg": "Sam other hand",
          "fish": "table"
        }
      },
      {
        "pageNumber": 3,
        "text": "I set the leg on the fish.",
        "imageBrief": "Sam attaches the yellow leg where the fish side fin should be. The unused blue fin lies beside it. The absurd walking-fish shape is immediately readable.",
        "state": {
          "leg": "attached to fish",
          "fin": "table",
          "fish": "funny wrong part"
        }
      },
      {
        "pageNumber": 4,
        "text": "“That is not a fin!”",
        "imageBrief": "Dot points to the attached yellow leg with friendly surprise; Sam looks at the shape and the unused blue fin. No scolding, ridicule or extra parts.",
        "state": {
          "leg": "still attached",
          "fin": "visible on table",
          "speaker": "Dot"
        }
      },
      {
        "pageNumber": 5,
        "text": "I set the leg in the box.",
        "imageBrief": "Sam removes the yellow leg and places it into the open kit box. Fish is again missing its side fin; blue fin remains on table.",
        "state": {
          "leg": "in box",
          "fish": "missing fin again",
          "fin": "table"
        }
      },
      {
        "pageNumber": 6,
        "text": "I set the thin fin on the fish.",
        "imageBrief": "Sam attaches the thin blue fin to the fish body in the same location. Dot steadies the flat felt body. Yellow leg stays in box.",
        "state": {
          "leg": "box",
          "fin": "attached correctly",
          "fish": "complete"
        }
      },
      {
        "pageNumber": 7,
        "text": "“This is a fish!”",
        "imageBrief": "Sam and Dot proudly hold the completed felt fish together. Blue fin stays attached, no leg remains, and yellow leg is visible in the box below. Shared satisfaction rather than a moral caption.",
        "state": {
          "fish": "complete, held together",
          "leg": "box",
          "speaker": "Sam",
          "ending": "recognizable fish"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How does Sam fix the fish?",
        "listenFor": "He takes the leg off, puts it in the box, and sets the thin fin on the fish. Evidence: pages3–6."
      },
      "visual": {
        "page": 3,
        "prompt": "Which part looks wrong on the fish? Point to the part that could replace it.",
        "lookFor": "The yellow leg is attached; the blue fin lies unused beside it. Both must be clearly visible."
      }
    }
  },
  {
    "id": "small-steps-12",
    "number": 12,
    "title": "A Ball in the Hall",
    "afterCycle": 16,
    "focus": "the all word family",
    "practiceWords": [
      "ball",
      "fall",
      "hall"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "ball",
        "graphemes": [
          "b",
          "all"
        ],
        "sounds": [
          "b",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Explicitly taught all rime, first available Cycle16. This record uses U.S. /ɔl/; /ɑl/ is accepted in cot-caught merged accents. The chunk has vowel plus /l/, not one phoneme."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "fall",
        "graphemes": [
          "f",
          "all"
        ],
        "sounds": [
          "f",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Explicitly taught all rime, first available Cycle16. This record uses U.S. /ɔl/; /ɑl/ is accepted in cot-caught merged accents. The chunk has vowel plus /l/, not one phoneme."
      },
      {
        "word": "fit",
        "graphemes": [
          "f",
          "i",
          "t"
        ],
        "sounds": [
          "f",
          "ɪ",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "ɡ",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "hall",
        "graphemes": [
          "h",
          "all"
        ],
        "sounds": [
          "h",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Explicitly taught all rime, first available Cycle16. This record uses U.S. /ɔl/; /ɑl/ is accepted in cot-caught merged accents. The chunk has vowel plus /l/, not one phoneme."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "iː"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      },
      {
        "word": "tin",
        "graphemes": [
          "t",
          "i",
          "n"
        ],
        "sounds": [
          "t",
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:31235ecfeb728152",
    "narrator": "SMALL-SAM",
    "cast": [
      "SMALL-SAM"
    ],
    "setting": "One broad, uncluttered home hall in daylight, with flat blue mat and pale wood floor; no stairs or running near a doorway.",
    "props": [
      {
        "id": "red-ball",
        "design": "One small red soft ball, always smaller than tin opening."
      },
      {
        "id": "round-tin",
        "design": "One open round blue metal tin with smooth rolled rim, no lid anywhere. Keep upright and the same size throughout."
      },
      {
        "id": "hall-mat",
        "design": "One flat blue mat beside tin; stable position, no trip hazard."
      }
    ],
    "coverBrief": "Sam studies the red ball balancing precariously on the edge of an open blue tin in the bright hall. Whole objects and face visible; no words.",
    "storySpine": "Sam tries to rest a ball on a tin, sees it fall onto the mat and changes from placing it on the tin to placing it inside.",
    "failedAttempt": "The ball balances on the open tin rim and falls onto the mat.",
    "turn": "Sam considers whether it will fit inside the tin instead.",
    "resolution": "The ball rests securely inside the tin and does not fall.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I get a ball and a tin.",
        "imageBrief": "Sam kneels in the hall beside one red ball and one upright open blue tin. Show that the tin opening is comfortably wider than the ball; no lid.",
        "state": {
          "ball": "in Sam hand",
          "tin": "upright, empty, open",
          "mat": "beside tin"
        }
      },
      {
        "pageNumber": 2,
        "text": "I set the ball on the tin.",
        "imageBrief": "Sam balances the red ball on the near curved rim rather than inside the open tin. A slight outward lean shows why it cannot stay; keep tin upright.",
        "state": {
          "ball": "on rim, unstable",
          "tin": "empty/open",
          "Sam": "releasing ball"
        }
      },
      {
        "pageNumber": 3,
        "text": "I see the ball fall.",
        "imageBrief": "Sam watches the one red ball fall from the open tin rim onto the adjacent blue mat. Show one ball in one clear position just above the mat, not a duplicate motion sequence. Tin stays upright and unchanged.",
        "state": {
          "ball": "falling to mat",
          "tin": "upright and empty",
          "Sam": "surprised"
        }
      },
      {
        "pageNumber": 4,
        "text": "“Can the ball fit in the tin?”",
        "imageBrief": "Sam holds the recovered ball over the open tin and looks down into its roomy interior while asking the question. No added lid or magic enlargement.",
        "state": {
          "ball": "held above opening",
          "tin": "same size, empty",
          "speaker": "Sam"
        }
      },
      {
        "pageNumber": 5,
        "text": "I set the ball in the tin.",
        "imageBrief": "Sam lowers the one ball completely inside the open tin. Its red upper surface is visible below the rim; show the successful change from on to in.",
        "state": {
          "ball": "inside tin",
          "tin": "upright",
          "Sam": "placing carefully"
        }
      },
      {
        "pageNumber": 6,
        "text": "I sit. The ball is in the tin.",
        "imageBrief": "Sam sits contentedly beside the open tin, both hands away. The red ball stays visibly below the rim inside the unchanged tin; its stable position answers the earlier failed attempt.",
        "state": {
          "ball": "stable inside tin",
          "Sam": "sitting, hands away",
          "ending": "ball stays put"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Sam change so the ball stays put?",
        "listenFor": "He puts it inside the tin instead of on the rim. Evidence: pages2–3 and5–6."
      },
      "visual": {
        "page": 5,
        "prompt": "Where is the ball now? Compare this with page2.",
        "lookFor": "Its red surface is below the rim inside the tin. Earlier it sat on the edge and fell."
      }
    }
  },
  {
    "id": "small-steps-13",
    "number": 13,
    "title": "A Pig Can Dig",
    "afterCycle": 17,
    "focus": "short i",
    "practiceWords": [
      "pig",
      "dig",
      "pit"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; o is /u/, not regular short /ɑ/."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; final y is /aɪ/, not the initial consonant /j/ taught in Cycle11."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "am",
        "graphemes": [
          "a",
          "m"
        ],
        "sounds": [
          "æ",
          "m"
        ],
        "firstCycle": 1,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Whole word taught in Cycle3; final /nd/ cluster lies outside this first collection VC/CVC shape contract. Teach exact word, not arbitrary blends."
      },
      {
        "word": "big",
        "graphemes": [
          "b",
          "i",
          "g"
        ],
        "sounds": [
          "b",
          "ɪ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "chin",
        "graphemes": [
          "ch",
          "i",
          "n"
        ],
        "sounds": [
          "tʃ",
          "ɪ",
          "n"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "dig",
        "graphemes": [
          "d",
          "i",
          "g"
        ],
        "sounds": [
          "d",
          "ɪ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; o is /u/, not regular short /ɑ/."
      },
      {
        "word": "fit",
        "graphemes": [
          "f",
          "i",
          "t"
        ],
        "sounds": [
          "f",
          "ɪ",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "hot",
        "graphemes": [
          "h",
          "o",
          "t"
        ],
        "sounds": [
          "h",
          "ɑ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "mud",
        "graphemes": [
          "m",
          "u",
          "d"
        ],
        "sounds": [
          "m",
          "ʌ",
          "d"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; final y is /aɪ/, not the initial consonant /j/ taught in Cycle11."
      },
      {
        "word": "nap",
        "graphemes": [
          "n",
          "a",
          "p"
        ],
        "sounds": [
          "n",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "pig",
        "graphemes": [
          "p",
          "i",
          "g"
        ],
        "sounds": [
          "p",
          "ɪ",
          "ɡ"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "pit",
        "graphemes": [
          "p",
          "i",
          "t"
        ],
        "sounds": [
          "p",
          "ɪ",
          "t"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:996578e9c54dfe5c",
    "narrator": "SMALL-LOCAL-PIG-13",
    "cast": [
      "SMALL-LOCAL-PIG-13"
    ],
    "setting": "A calm fenced farm paddock in warm daylight. One existing shallow muddy patch with a small amount of visible water; the pig is never trapped or submerged.",
    "props": [
      {
        "id": "pig-model",
        "design": "One natural young pink pig, round snout, two upright ears, four short legs with dark cloven hooves, one curly tail; no clothes or human hands. Book-specific design must be locked before art."
      },
      {
        "id": "mud-patch",
        "design": "One already-wet shallow mud patch; digging widens the hollow gradually, never creates water by magic."
      },
      {
        "id": "chin-spot",
        "design": "One small dark mud spot reaches pig chin on page6 and remains at ending."
      }
    ],
    "coverBrief": "Natural pink pig settles happily into a shallow muddy hollow, with one small mud spot on its chin. Four-legged farm animal, warm simple paddock, no words or anthropomorphic clothing.",
    "storySpine": "A hot pig tries to make a comfortable mud hollow, finds it too small, digs it wider and settles into a cooling wallow.",
    "failedAttempt": "The first small pit cannot fit the pig comfortably.",
    "turn": "The pig digs more instead of forcing itself into the small hollow.",
    "resolution": "The pig settles in the bigger muddy pit with a comic mud spot on its chin, then naps.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I am a pig. I am hot.",
        "imageBrief": "The natural pink pig stands beside an existing wet mud patch in sunlight, looking warm and seeking comfort. All four legs, snout, ears and curly tail match its book model. The pig narrates in an imagined first-person voice but remains a natural animal with no speech bubble or human gesture.",
        "state": {
          "pig": "warm, beside mud",
          "mud": "already wet and shallow",
          "chin": "clean"
        }
      },
      {
        "pageNumber": 2,
        "text": "I dig in the mud.",
        "imageBrief": "Pig roots and digs with its snout and front hooves in the same muddy patch. Show one small hollow beginning to form, with existing moisture visible.",
        "state": {
          "pig": "digging naturally",
          "pit": "small",
          "chin": "clean"
        }
      },
      {
        "pageNumber": 3,
        "text": "I do not fit in the pit.",
        "imageBrief": "Pig tries to settle its body in the small hollow, but its hindquarters remain perched outside. It is not trapped; the shallow hole is clearly too narrow.",
        "state": {
          "pig": "trying small pit, uncomfortable",
          "pit": "too narrow",
          "chin": "clean"
        }
      },
      {
        "pageNumber": 4,
        "text": "I dig and dig.",
        "imageBrief": "Pig uses snout and front hooves to widen the same hollow, pushing mud gently outward. Do not add a shovel, hands, a new pond or other animals.",
        "state": {
          "pig": "widening hollow",
          "pit": "growing wider",
          "water": "same existing mud moisture"
        }
      },
      {
        "pageNumber": 5,
        "text": "I sit in the big pit.",
        "imageBrief": "The natural pig lowers its body into a relaxed sitting/settled posture in the wide shallow mud pit. Its head and nose stay above the mud. A small splash from settling is just about to reach the chin.",
        "state": {
          "pig": "comfortably wallowing",
          "pit": "wide enough",
          "chin": "about to receive splash"
        }
      },
      {
        "pageNumber": 6,
        "text": "Mud is on my chin!",
        "imageBrief": "The pig notices the one small mud spot now on its chin, with a pleasantly surprised face; it remains comfortably settled in the shallow mud.",
        "state": {
          "pig": "settled",
          "chin": "one mud spot",
          "pit": "unchanged"
        }
      },
      {
        "pageNumber": 7,
        "text": "I nap in the mud.",
        "imageBrief": "Pig rests contentedly in the comfortable shallow mud with eyes closed, nose fully clear and the same small spot on its chin. Warm paddock continues unchanged.",
        "state": {
          "pig": "resting comfortably",
          "chin": "same mud spot",
          "ending": "hot pig now settled and comfortable"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why does the pig dig more?",
        "listenFor": "The first pit is too small to fit. Digging widens it, so the pig can sit and rest comfortably. Evidence: pages2–5."
      },
      "visual": {
        "page": 3,
        "prompt": "What shows that the pit is too small?",
        "lookFor": "The pig cannot settle its body inside; part of its body remains outside the narrow shallow hollow."
      }
    }
  },
  {
    "id": "small-steps-14",
    "number": 14,
    "title": "A Dot on a Map",
    "afterCycle": 18,
    "focus": "short o",
    "practiceWords": [
      "dot",
      "log",
      "map"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "look",
        "cycle": 15,
        "reason": "Whole word taught in Cycle15; oo /ʊ/ is not in the regular code. Do not generalize it to other oo words."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Indefinite article commonly /ə/ in connected speech; whole word taught in Cycle2, not short-a decoding."
      },
      {
        "word": "cap",
        "graphemes": [
          "c",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "ɡ",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "hut",
        "graphemes": [
          "h",
          "u",
          "t"
        ],
        "sounds": [
          "h",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun I taught in Cycle1; /aɪ/ is not the short-i correspondence."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Whole word taught in Cycle4; s spells /z/ here, not the regular /s/ correspondence."
      },
      {
        "word": "log",
        "graphemes": [
          "l",
          "o",
          "g"
        ],
        "sounds": [
          "l",
          "ɑ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "look",
        "graphemes": [
          "l",
          "oo",
          "k"
        ],
        "sounds": [
          "l",
          "ʊ",
          "k"
        ],
        "firstCycle": 15,
        "type": "exception",
        "note": "Whole word taught in Cycle15; oo /ʊ/ is not in the regular code. Do not generalize it to other oo words."
      },
      {
        "word": "map",
        "graphemes": [
          "m",
          "a",
          "p"
        ],
        "sounds": [
          "m",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "run",
        "graphemes": [
          "r",
          "u",
          "n"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole word taught in Cycle2. Use /ðə/ before these consonant-led words; schwa spelling is not regular short e."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:57bb276a8ca1fc82",
    "narrator": "SMALL-DOT",
    "cast": [
      "SMALL-SAM",
      "SMALL-DOT"
    ],
    "setting": "One enclosed garden in daylight with a low play hut at left and a safe knee-high hollow log at right. The log is stable on the ground and easily reached without climbing.",
    "props": [
      {
        "id": "red-cap",
        "design": "One plain red child-size cap hidden in low hollow log on page1 and remaining there until page7."
      },
      {
        "id": "picture-map",
        "design": "One cream paper picture map: clear hut icon at left, clear hollow-log icon at right, one red dot directly on log icon. No letters, labels, arrows with text or changing dot position."
      },
      {
        "id": "hut-and-log",
        "design": "Distinct square play hut and horizontal hollow log in fixed garden positions."
      }
    ],
    "coverBrief": "Dot holds a simple picture map with one red dot on its log icon; real safe hollow log and play hut appear behind. A little red cap peeks from the log. No embedded lettering.",
    "storySpine": "Dot looks for a red cap, gets a picture map, guesses the hut, then checks the dot location and finds the cap in the log.",
    "failedAttempt": "Dot looks in the hut, but the cap is not there.",
    "turn": "Dot studies the map again and notices its dot marks the log.",
    "resolution": "Dot follows the corrected clue and retrieves the cap on-page.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I look for a red cap.",
        "imageBrief": "Dot searches the familiar garden for one red cap. Sam stands nearby holding the cream picture map. A tiny edge of the cap is visible inside the low hollow log to the reader; Dot has not noticed it. The play hut remains at left.",
        "state": {
          "cap": "inside low log before opening",
          "Dot": "looking for cap",
          "Sam": "holding map",
          "hut": "empty"
        }
      },
      {
        "pageNumber": 2,
        "text": "I get a map.",
        "imageBrief": "Sam hands Dot the cream picture map. Show both fixed icons and the red dot on the log icon. The real cap remains in the log, not in Sam hand.",
        "state": {
          "map": "in Dot hands",
          "cap": "log",
          "Sam": "finished giving map"
        }
      },
      {
        "pageNumber": 3,
        "text": "I run to the hut.",
        "imageBrief": "Dot makes a quick first guess and runs a few safe steps to the low play hut without checking the map closely. Sam watches; log and cap remain in their original place.",
        "state": {
          "Dot": "at hut",
          "map": "in Dot hand",
          "cap": "log",
          "firstGuess": "hut"
        }
      },
      {
        "pageNumber": 4,
        "text": "The cap is not in the hut.",
        "imageBrief": "Dot peers into the clearly empty play hut, puzzled. Keep the cap absent from this space and the map in her hand; no duplicate cap or new hiding place.",
        "state": {
          "hut": "empty",
          "Dot": "puzzled",
          "cap": "still log",
          "map": "unchanged"
        }
      },
      {
        "pageNumber": 5,
        "text": "The dot is on a log!",
        "imageBrief": "Close view of Dot looking carefully at the map and pointing to its one red dot on the hollow-log icon. The hut icon remains separate. This page refers to the pictured map, not a new red mark on the real log. No printed words.",
        "state": {
          "Dot": "checking the clue",
          "mapDot": "on log icon, unchanged",
          "cap": "still real log"
        }
      },
      {
        "pageNumber": 6,
        "text": "I run to the log.",
        "imageBrief": "Dot moves across the same safe garden to the low hollow log, map held securely. The cap can just be seen in the hollow, without changing its location.",
        "state": {
          "Dot": "arriving at log",
          "map": "in hand",
          "cap": "inside log"
        }
      },
      {
        "pageNumber": 7,
        "text": "I get the red cap!",
        "imageBrief": "Dot retrieves the single red cap from the low hollow log and beams toward Sam. Map remains in her other hand; log is now empty. No speech bubble or extra exclamation text.",
        "state": {
          "cap": "in Dot hand",
          "map": "in other hand",
          "log": "empty",
          "speaker": "first-person narrator Dot",
          "ending": "clue followed and cap found"
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What helps Dot find the cap after looking in the hut?",
        "listenFor": "She checks the map and notices the dot on the log picture, then runs to the real log and retrieves the cap. Evidence: pages4–7."
      },
      "visual": {
        "page": 5,
        "prompt": "Point to the map clue Dot needs. Which real place does it show?",
        "lookFor": "The red dot is on the hollow-log icon, not the hut icon. The same log was established in pages1–2."
      }
    }
  },
  {
    "id": "small-steps-15",
    "number": 15,
    "title": "A Pup in a Tub",
    "afterCycle": 19,
    "focus": "short u",
    "practiceWords": [
      "pup",
      "tub",
      "mud"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "out",
        "cycle": 19,
        "reason": "Cycle 19 taught whole word; ou /aʊ/ is not a general vowel-team permission."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "am",
        "graphemes": [
          "a",
          "m"
        ],
        "sounds": [
          "æ",
          "m"
        ],
        "firstCycle": 1,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "dip",
        "graphemes": [
          "d",
          "i",
          "p"
        ],
        "sounds": [
          "d",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable CVC word using already-taught d, short i and p."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "mud",
        "graphemes": [
          "m",
          "u",
          "d"
        ],
        "sounds": [
          "m",
          "ʌ",
          "d"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "out",
        "graphemes": [
          "ou",
          "t"
        ],
        "sounds": [
          "aʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "Cycle 19 taught whole word; ou /aʊ/ is not a general vowel-team permission."
      },
      {
        "word": "pup",
        "graphemes": [
          "p",
          "u",
          "p"
        ],
        "sounds": [
          "p",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "rag",
        "graphemes": [
          "r",
          "a",
          "g"
        ],
        "sounds": [
          "ɹ",
          "æ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "rub",
        "graphemes": [
          "r",
          "u",
          "b"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      },
      {
        "word": "tub",
        "graphemes": [
          "t",
          "u",
          "b"
        ],
        "sounds": [
          "t",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "wet",
        "graphemes": [
          "w",
          "e",
          "t"
        ],
        "sounds": [
          "w",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "with",
        "graphemes": [
          "w",
          "i",
          "th"
        ],
        "sounds": [
          "w",
          "ɪ",
          "ð"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Uses voiced th /ð/; unvoiced /wɪθ/ is an accepted U.S. pronunciation variant, also taught in Cycle 15."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:60eb2077db6d9cfd",
    "narrator": "SMALL-SAM",
    "cast": [
      "SMALL-SAM",
      "SMALL-DAD",
      "SMALL-PUP"
    ],
    "setting": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
    "props": [
      {
        "id": "tub",
        "description": "One roomy round pale-blue wash tub, comfortably large for Pup to stand and turn; shallow warm paw-depth water from page 2 onward. Same tub, dimensions and position throughout; no second basin."
      },
      {
        "id": "rag",
        "description": "One cream cotton washcloth, dry at first; remains too dry to remove the main mud patch on pages 3–4, becomes wet on page 5, then takes the brown mud on pages 6–7."
      }
    ],
    "coverBrief": "Sam crouches beside muddy Pup standing comfortably in the single roomy pale-blue tub. Sam is about to dip one cream rag into the shallow water; the mud patch on Pup and the cloth make the cleaning problem visible. Dad stands nearby. All four puppy paws, the full tub rim and Sam’s caring hand remain readable. Use the locked Small Steps cast master: Sam in mustard-yellow T-shirt/navy full-length overalls/white trainers; Dad in forest-green shirt/tan trousers/brown shoes; brown-and-white floppy-eared Pup with red collar. Draw only this cast. Clean bright flat cartoon, crisp continuous outlines, natural animal anatomy, smooth colors without paint or grain, landscape composition with complete key shapes and safe insets. No embedded lettering.",
    "storySpine": "When Pup comes in muddy, Sam puts him in a roomy tub and tries rubbing with a dry rag; the mud stays, so Sam wets the rag and rubs the mud off, before clean Pup shakes a little water onto Sam.",
    "failedAttempt": "Pages 3–4: the dry rag does not remove the main mud patch; Sam notices that the cloth is not wet.",
    "turn": "Page 5: Sam dips the same rag into the tub, changing the cleaning method rather than the container.",
    "resolution": "Pages 6–8: the wet rag removes the mud, clean Pup comes out, and his harmless shake gives Sam a wet-shirt payoff.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "The pup is in the mud.",
        "imageBrief": "Pup stands cheerfully in a small mud patch with brown mud on his lower legs and one flank. Sam notices. Dad, one roomy pale-blue wash tub and one dry cream rag are visible in the same garden wash area. No second tub appears.",
        "state": {
          "location": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-PUP"
          ],
          "beat": "Pup muddy; one roomy tub available; cloth dry.",
          "continuity": "One roomy pale-blue tub and one cream cloth throughout. The cloth changes dry → wet → muddy; Pup changes muddy → clean → out. Only the pictured action changes state."
        }
      },
      {
        "pageNumber": 2,
        "text": "I put the pup in a tub.",
        "imageBrief": "Sam gently settles Pup standing comfortably in the single roomy blue tub with shallow paw-depth water. There is ample room around all four paws. The main flank mud patch is above the water and remains visible. Dad stays close; the cream rag beside Sam is still dry.",
        "state": {
          "location": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-PUP"
          ],
          "beat": "Pup in the adequately sized tub; main mud patch remains; cloth dry.",
          "continuity": "One roomy pale-blue tub and one cream cloth throughout. The cloth changes dry → wet → muddy; Pup changes muddy → clean → out. Only the pictured action changes state."
        }
      },
      {
        "pageNumber": 3,
        "text": "I rub the pup with a rag.",
        "imageBrief": "Sam gently rubs the main muddy flank patch with the dry cream cloth, away from eyes and ears. The stiff dry cloth picks up little or no mud and the main patch remains. Pup is comfortable; Dad observes without taking over.",
        "state": {
          "location": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-PUP"
          ],
          "beat": "First attempt: dry rubbing does not remove the main mud patch.",
          "continuity": "One roomy pale-blue tub and one cream cloth throughout. The cloth changes dry → wet → muddy; Pup changes muddy → clean → out. Only the pictured action changes state."
        }
      },
      {
        "pageNumber": 4,
        "text": "The rag is not wet.",
        "imageBrief": "Sam pauses and feels the dry cloth between his fingers, then looks toward the shallow tub water. The main mud patch remains on Pup above the waterline. Keep the same single cloth, tub and puppy position; Dad remains nearby.",
        "state": {
          "location": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-PUP"
          ],
          "beat": "Sam notices why the dry-rag attempt has not worked.",
          "continuity": "One roomy pale-blue tub and one cream cloth throughout. The cloth changes dry → wet → muddy; Pup changes muddy → clean → out. Only the pictured action changes state."
        }
      },
      {
        "pageNumber": 5,
        "text": "I dip the rag in the tub.",
        "imageBrief": "Sam dips the same cream rag into the shallow water beside Pup’s paws. Pup stands comfortably with plenty of room. The cloth darkens naturally as it becomes damp; no soap bottle, second cloth or second tub appears.",
        "state": {
          "location": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-PUP"
          ],
          "beat": "Turn: Sam wets the existing cloth.",
          "continuity": "One roomy pale-blue tub and one cream cloth throughout. The cloth changes dry → wet → muddy; Pup changes muddy → clean → out. Only the pictured action changes state."
        }
      },
      {
        "pageNumber": 6,
        "text": "I rub the pup\nwith the wet rag.",
        "imageBrief": "Sam gently rubs the same muddy flank with the now-wet cream cloth. Show the brown mud transferring onto the rag and clean brown-and-white fur emerging underneath. Pup’s natural markings and red collar remain unchanged.",
        "state": {
          "location": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-PUP"
          ],
          "beat": "Improved method: the wet cloth removes the mud.",
          "continuity": "One roomy pale-blue tub and one cream cloth throughout. The cloth changes dry → wet → muddy; Pup changes muddy → clean → out. Only the pictured action changes state."
        }
      },
      {
        "pageNumber": 7,
        "text": "The mud is on the rag.",
        "imageBrief": "Sam holds the visibly brown-stained cloth above the same tub. Pup now has clean brown-and-white fur with no mud remaining. Dad watches the completed wash; the damp cloth contains the removed mud.",
        "state": {
          "location": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-PUP"
          ],
          "beat": "Pup clean; removed mud on the wet cloth.",
          "continuity": "One roomy pale-blue tub and one cream cloth throughout. The cloth changes dry → wet → muddy; Pup changes muddy → clean → out. Only the pictured action changes state."
        }
      },
      {
        "pageNumber": 8,
        "text": "The pup is out.\nI am wet!",
        "imageBrief": "Clean Pup stands safely outside the same roomy tub and gives one natural whole-body shake. A few droplets land on Sam’s mustard shirt and Sam laughs. Retain one puppy with four natural legs, one dirty cloth, one tub and Dad nearby.",
        "state": {
          "location": "Sunny paved garden washing area beside a muddy patch. Dad remains nearby throughout; no bath occurs indoors and the weather never changes.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-PUP"
          ],
          "beat": "Bath finished; clean Pup is out; Sam gets the harmless splash payoff.",
          "continuity": "One roomy pale-blue tub and one cream cloth throughout. The cloth changes dry → wet → muddy; Pup changes muddy → clean → out. Only the pictured action changes state."
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why does Sam dip the rag in the tub after the first rub?",
        "listenFor": "The rag is dry and the mud stays on Pup. Sam wets the same rag, then rubs the mud off onto it."
      },
      "visual": {
        "page": 6,
        "prompt": "Compare this cloth and Pup’s side with page 3. What shows that Sam’s new try is working?",
        "lookFor": "The wet cloth takes on the brown mud while Pup’s clean fur appears; it is the same cloth and the same roomy tub."
      }
    }
  },
  {
    "id": "small-steps-16",
    "number": 16,
    "title": "Get the Red Net",
    "afterCycle": 20,
    "focus": "short e",
    "practiceWords": [
      "get",
      "red",
      "net"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "ball",
        "graphemes": [
          "b",
          "all"
        ],
        "sounds": [
          "b",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Taught all rime /ɔl/ contains vowel plus consonant, not one phoneme; merged U.S. /ɑl/ is also accepted."
      },
      {
        "word": "big",
        "graphemes": [
          "b",
          "i",
          "g"
        ],
        "sounds": [
          "b",
          "ɪ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "dip",
        "graphemes": [
          "d",
          "i",
          "p"
        ],
        "sounds": [
          "d",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "ɡ",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "lob",
        "graphemes": [
          "l",
          "o",
          "b"
        ],
        "sounds": [
          "l",
          "ɑ",
          "b"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "net",
        "graphemes": [
          "n",
          "e",
          "t"
        ],
        "sounds": [
          "n",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      },
      {
        "word": "tub",
        "graphemes": [
          "t",
          "u",
          "b"
        ],
        "sounds": [
          "t",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "wet",
        "graphemes": [
          "w",
          "e",
          "t"
        ],
        "sounds": [
          "w",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:9755a9d4179bd54c",
    "narrator": "SMALL-DOT",
    "cast": [
      "SMALL-DOT",
      "SMALL-DAD"
    ],
    "setting": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
    "props": [
      {
        "id": "ball",
        "description": "One small blue foam ball; floats in the tub, is retrieved wet, then caught by Dad."
      },
      {
        "id": "tub",
        "description": "Wide light-gray water-play tub with only a few centimeters of water, too wide for the little cup to easily collect the center ball from Dot’s position."
      },
      {
        "id": "cup",
        "description": "Small yellow plastic cup, never changes size or color."
      },
      {
        "id": "net",
        "description": "One broad red-rimmed net with white mesh and a short red handle, visible from page 1."
      },
      {
        "id": "mat",
        "description": "Small pale-green rectangular tool mat on the patio next to Dot."
      }
    ],
    "coverBrief": "Dot reaches the broad red net toward the single floating blue ball in the wide shallow tub. Dad waits on the paving with open playful hands. The unsuccessful yellow cup lies beside the pale-green tool mat. No extra balls, fish, deep water or text. Use the locked Small Steps cast master: Sam in mustard-yellow T-shirt/navy full-length overalls/white trainers; Dot in teal T-shirt/purple full-length trousers/white trainers; Dad in forest-green shirt/tan trousers/brown shoes; ginger-and-white Cat with green collar; brown-and-white floppy-eared Pup with red collar. Draw only the listed cast. Clean bright flat cartoon, crisp continuous outlines, natural animal anatomy, smooth colors without paint or grain, landscape composition with complete key shapes and safe insets. No embedded lettering.",
    "storySpine": "During a supervised water game, Dot wants a floating ball, but a cup misses it; she changes to a broad red net, retrieves the ball, and tosses the wet ball to an eagerly waiting Dad.",
    "failedAttempt": "Pages 2–3: the cup slips beside the floating ball and comes up without it.",
    "turn": "Page 4: Dot chooses the broad net instead of the cup.",
    "resolution": "Pages 5–8: the ball comes out in the net, Dot puts the tool down, and Dad catches the wet ball with a comic splash.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "The ball is in a big tub.",
        "imageBrief": "Establish one blue foam ball floating near the center of the wide shallow gray tub. Dot stands on the paving; Dad kneels nearby with playful open hands. Yellow cup, red net and green mat are already present.",
        "state": {
          "location": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Goal object: one floating blue ball; tools available.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 2,
        "text": "I dip a cup in the tub.",
        "imageBrief": "Dot leans safely from the paving and lowers the small yellow cup toward the ball. Her feet stay on the ground and Dad is within reach. The ball slips just beside the cup rim.",
        "state": {
          "location": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "First attempt uses the small cup.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 3,
        "text": "The ball is not in the cup.",
        "imageBrief": "Dot lifts the yellow cup with only water in it. The blue ball still floats in the same tub. Dad looks at the missed ball; red net remains unused beside the mat.",
        "state": {
          "location": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Failed attempt: the ball remains in the tub.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 4,
        "text": "I get the red net.",
        "imageBrief": "Dot puts down the yellow cup and picks up the clearly larger red net from the mat. Make the deliberate tool change the focal action.",
        "state": {
          "location": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Turn: Dot chooses the broad net.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 5,
        "text": "The ball is in the net!",
        "imageBrief": "Dot lifts the one blue ball clear of the shallow tub in the white mesh basket. Water drips harmlessly back into the tub. Dad offers open hands to continue their game.",
        "state": {
          "location": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Ball retrieved; the net works.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 6,
        "text": "I put the net on the mat.",
        "imageBrief": "Dot holds the wet blue ball in one hand while putting the empty red net on the pale-green tool mat with the other. Cup stays beside the tub. Dad is ready to receive the ball.",
        "state": {
          "location": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Tool stored; Dot has the retrieved wet ball.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 7,
        "text": "I lob the wet ball at Dad.",
        "imageBrief": "Dot makes a gentle short underhand toss of the soft blue ball toward Dad’s open hands at close range. Dad is willingly joining the game; no distressed reaction or head-directed throw.",
        "state": {
          "location": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "The recovered ball is used in their game.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 8,
        "text": "Dad is wet!",
        "imageBrief": "Dad catches the same wet blue ball; a small comic spray dots the front of his forest-green shirt. He and Dot laugh. The net remains on the mat and the yellow cup remains beside the shallow tub.",
        "state": {
          "location": "Sunny level patio with a broad shallow water-play tub. Dot and Dad stay on the dry paving; no one enters the tub. This is a ball game, not a water rescue.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Goal completed; Dad’s happy damp-shirt reaction is the prepared payoff.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Dot change after the cup misses the ball?",
        "listenFor": "She uses the red net. Its broad basket holds the ball so she can lift it out and play with Dad."
      },
      "visual": {
        "page": 5,
        "prompt": "Look at the net and compare it with the cup on page 3. Why does this tool help?",
        "lookFor": "The wide mesh basket reaches under and holds the one blue ball; the small cup missed it."
      }
    }
  },
  {
    "id": "small-steps-17",
    "number": 17,
    "title": "When Can the Van Whiz?",
    "afterCycle": 21,
    "focus": "wh",
    "practiceWords": [
      "when",
      "whiz",
      "van"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "out",
        "cycle": 19,
        "reason": "Cycle 19 taught whole word; ou /aʊ/ is not a general vowel-team permission."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "let",
        "graphemes": [
          "l",
          "e",
          "t"
        ],
        "sounds": [
          "l",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "log",
        "graphemes": [
          "l",
          "o",
          "g"
        ],
        "sounds": [
          "l",
          "ɑ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "out",
        "graphemes": [
          "ou",
          "t"
        ],
        "sounds": [
          "aʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "Cycle 19 taught whole word; ou /aʊ/ is not a general vowel-team permission."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      },
      {
        "word": "tip",
        "graphemes": [
          "t",
          "i",
          "p"
        ],
        "sounds": [
          "t",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "tug",
        "graphemes": [
          "t",
          "u",
          "g"
        ],
        "sounds": [
          "t",
          "ʌ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "van",
        "graphemes": [
          "v",
          "a",
          "n"
        ],
        "sounds": [
          "v",
          "æ",
          "n"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "when",
        "graphemes": [
          "wh",
          "e",
          "n"
        ],
        "sounds": [
          "w",
          "ɛ",
          "n"
        ],
        "firstCycle": 21,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "whiz",
        "graphemes": [
          "wh",
          "i",
          "z"
        ],
        "sounds": [
          "w",
          "ɪ",
          "z"
        ],
        "firstCycle": 21,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:554423702d953b4f",
    "narrator": "SMALL-SAM",
    "cast": [
      "SMALL-SAM",
      "SMALL-DAD"
    ],
    "setting": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
    "props": [
      {
        "id": "van",
        "description": "One palm-sized red toy van with black wheels and cream windows, no logo or lettering; unmistakably a toy beside Sam’s hands."
      },
      {
        "id": "log",
        "description": "Lightweight 25-centimeter hollow wooden play-log tunnel, not a heavy natural trunk; a small internal lip catches the loose van when tugged from the near opening. Tipping redirects it toward the wider opening. No climbing or real vehicle."
      },
      {
        "id": "path",
        "description": "Tan toy-road strip on the pale-blue mat, ending at Dad’s brown shoe. No printed words."
      }
    ],
    "coverBrief": "Sam studies the red toy van peeking from the hollow play-log tunnel on the floor mat; one hand is ready to tilt the small tunnel. Dad sits nearby at the end of the toy road. Make toy scale unmistakable and keep the tunnel light, low and safe. Use the locked Small Steps cast master: Sam in mustard-yellow T-shirt/navy full-length overalls/white trainers; Dot in teal T-shirt/purple full-length trousers/white trainers; Dad in forest-green shirt/tan trousers/brown shoes; ginger-and-white Cat with green collar; brown-and-white floppy-eared Pup with red collar. Draw only the listed cast. Clean bright flat cartoon, crisp continuous outlines, natural animal anatomy, smooth colors without paint or grain, landscape composition with complete key shapes and safe insets. No embedded lettering.",
    "storySpine": "Sam’s toy van sits inside a hollow play-log tunnel; tugging leaves it there, so Sam tips the lightweight tunnel, lets the van out, and sends it along the play path until it parks on Dad’s shoe.",
    "failedAttempt": "Pages 2–3: tugging from the awkward tunnel opening fails; the van remains inside.",
    "turn": "Page 5: Sam tips the lightweight toy tunnel to let gravity move the loose van toward its wide opening.",
    "resolution": "Pages 6–8: the van is out and can roll along the path again, ending with an absurd parking place on Dad.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "The van is in a log.",
        "imageBrief": "Show a small red toy van partly visible inside a hollow wooden play tunnel on the floor mat. Sam kneels beside it. Dad sits at the far end of the tan toy path, with his brown shoe beside its endpoint.",
        "state": {
          "location": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ],
          "beat": "Van inside the toy tunnel; goal is to get it rolling again.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 2,
        "text": "I tug on the van.",
        "imageBrief": "Sam gently tries to pull the red toy van from the near tunnel opening. A little internal lip obstructs this awkward route; the wheels and van remain intact. Dad watches without taking over.",
        "state": {
          "location": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ],
          "beat": "First attempt: a gentle tug from the near opening.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 3,
        "text": "The van is in the log!",
        "imageBrief": "The van is still inside after the tug. Sam’s hand has eased back; his thoughtful expression and unchanged van position show that the first attempt did not work. Keep the path and Dad fixed.",
        "state": {
          "location": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ],
          "beat": "Failed attempt costs a page: van remains inside.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 4,
        "text": "When can the van whiz?",
        "imageBrief": "Sam pauses and looks from the caught van to the wider far opening and the flat toy path. The shape of the lightweight tunnel makes the alternate direction visible. No new tool or prop appears.",
        "state": {
          "location": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ],
          "beat": "Sam considers a different way to free the van.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 5,
        "text": "I tip the log.",
        "imageBrief": "Sam raises the near end of the small hollow toy tunnel slightly, directing the loose red van toward the wider far opening. Dad remains nearby; this is a small floor toy, never a trunk or a climb.",
        "state": {
          "location": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ],
          "beat": "Turn: Sam changes the tunnel angle and exit direction.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 6,
        "text": "The van is out!",
        "imageBrief": "The one red van has rolled out onto the tan toy path, intact. Sam lowers the empty lightweight tunnel beside the road. The previously used opening and wide exit remain consistent.",
        "state": {
          "location": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ],
          "beat": "The obstruction is resolved; van is free.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 7,
        "text": "I let the van whiz.",
        "imageBrief": "Sam gently releases/pushes the toy van along the clear low path toward Dad. Show motion by wheels and a restrained motion mark, with no duplicate vehicle. Tunnel stays beside the path.",
        "state": {
          "location": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ],
          "beat": "The van rolls freely along the path.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 8,
        "text": "Whiz! The van is on Dad!",
        "imageBrief": "The toy van has parked harmlessly on the toe of Dad’s brown shoe at the path’s end. Dad lifts that toe a little and grins; Sam laughs at the silly parking spot. Retain one van and the same low floor-play setting.",
        "state": {
          "location": "Warm daylight playroom with one pale-blue floor mat and a simple tan toy-road path, without printed road labels. Dad sits at the path’s end throughout.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ],
          "beat": "Goal achieved with the prepared silly parking payoff; no new problem.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Sam do differently after tugging fails?",
        "listenFor": "He tips the little play-log so the van can come out through the other opening. Then the van can roll again."
      },
      "visual": {
        "page": 8,
        "prompt": "Where did the van finally park? Find that place in the opening picture too.",
        "lookFor": "The same tiny red van is on Dad’s brown shoe, which was already beside the end of the toy path on page 1."
      }
    }
  },
  {
    "id": "small-steps-18",
    "number": 18,
    "title": "Pink Ink",
    "afterCycle": 22,
    "focus": "nk",
    "practiceWords": [
      "pink",
      "ink",
      "sink"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "dab",
        "graphemes": [
          "d",
          "a",
          "b"
        ],
        "sounds": [
          "d",
          "æ",
          "b"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "ink",
        "graphemes": [
          "i",
          "nk"
        ],
        "sounds": [
          "ɪ",
          "ŋk"
        ],
        "firstCycle": 22,
        "type": "regular",
        "note": "Final nk is the explicitly taught /ŋk/ chunk; it contains two phonemes."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "pink",
        "graphemes": [
          "p",
          "i",
          "nk"
        ],
        "sounds": [
          "p",
          "ɪ",
          "ŋk"
        ],
        "firstCycle": 22,
        "type": "regular",
        "note": "Final nk is the explicitly taught /ŋk/ chunk; it contains two phonemes."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "rag",
        "graphemes": [
          "r",
          "a",
          "g"
        ],
        "sounds": [
          "ɹ",
          "æ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "rub",
        "graphemes": [
          "r",
          "u",
          "b"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "sink",
        "graphemes": [
          "s",
          "i",
          "nk"
        ],
        "sounds": [
          "s",
          "ɪ",
          "ŋk"
        ],
        "firstCycle": 22,
        "type": "regular",
        "note": "Final nk is the explicitly taught /ŋk/ chunk; it contains two phonemes."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      },
      {
        "word": "wet",
        "graphemes": [
          "w",
          "e",
          "t"
        ],
        "sounds": [
          "w",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "with",
        "graphemes": [
          "w",
          "i",
          "th"
        ],
        "sounds": [
          "w",
          "ɪ",
          "ð"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Uses voiced th /ð/; unvoiced /wɪθ/ is an accepted U.S. pronunciation variant, also taught in Cycle 15."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:5c4ea7485784ad47",
    "narrator": "SMALL-DOT",
    "cast": [
      "SMALL-DOT",
      "SMALL-DAD"
    ],
    "setting": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
    "props": [
      {
        "id": "ink",
        "description": "One small unlabelled jar of washable, non-toxic pink craft ink, upright after its small spill; never present as a drink."
      },
      {
        "id": "mat",
        "description": "One cream silicone craft mat, nonabsorbent and easy to wipe clean; returns to the same cream color."
      },
      {
        "id": "rag",
        "description": "One cream cotton rag, initially dry, then wet, then visibly pink."
      },
      {
        "id": "sink",
        "description": "The adjacent sink with low running tap; Dot can reach it with feet on the floor. Dad supervises without doing the cleaning."
      }
    ],
    "coverBrief": "Dot studies a small pink ink patch on the cream craft mat, with a cream rag ready nearby and the sink visible behind. Keep the ink jar upright, unlabelled and distinct from a drinking cup. Dad is nearby. Use the locked Small Steps cast master: Sam in mustard-yellow T-shirt/navy full-length overalls/white trainers; Dot in teal T-shirt/purple full-length trousers/white trainers; Dad in forest-green shirt/tan trousers/brown shoes; ginger-and-white Cat with green collar; brown-and-white floppy-eared Pup with red collar. Draw only the listed cast. Clean bright flat cartoon, crisp continuous outlines, natural animal anatomy, smooth colors without paint or grain, landscape composition with complete key shapes and safe insets. No embedded lettering.",
    "storySpine": "A small spill of washable pink ink marks Dot’s work mat; rubbing spreads it, so she wets a cloth in the sink and dabs the ink away, leaving a clean mat and a very pink rag.",
    "failedAttempt": "Pages 2–3: rubbing the spill with a fingertip spreads it across the mat instead of removing it.",
    "turn": "Pages 4–6: Dot changes to a wet rag and dabs rather than smears.",
    "resolution": "Pages 7–8: the mat’s cream surface is restored and the rag carries the pink ink; a tiny pink fingertip is a prepared visual callback.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Pink ink is on the mat.",
        "imageBrief": "Establish the small pink spill on the single cream silicone mat. Dot looks at it; the jar is now upright. The clean dry rag and adjacent sink are visible. Dad stands nearby.",
        "state": {
          "location": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Opening problem: pink ink marks the cream mat.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 2,
        "text": "I rub the ink.",
        "imageBrief": "Dot rubs the spill with one fingertip; the washable ink smears into a wider patch. Leave a small pink mark on that fingertip for the ending callback. No other surface is stained.",
        "state": {
          "location": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "First attempt spreads rather than removes the ink.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 3,
        "text": "The mat is pink!",
        "imageBrief": "Show the widened pink smear covering much of the cream mat, with Dot’s surprised expression. The jar remains upright; the unused cream rag is still clean.",
        "state": {
          "location": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Consequence of rubbing: a bigger pink patch.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 4,
        "text": "I put a rag in the sink.",
        "imageBrief": "Dot puts the one cream rag under the low running tap in the adjacent sink, feet on the floor; Dad is nearby. The marked work mat remains on the same table in view.",
        "state": {
          "location": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Turn begins: Dot changes to a wet cleaning tool.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 5,
        "text": "The rag is wet.",
        "imageBrief": "Dot lifts the damp cream rag above the sink with a few clear droplets. Dad turns off the tap without taking the rag; the jar and marked mat remain on the table.",
        "state": {
          "location": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "The rag is now wet and ready.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 6,
        "text": "I dab the mat\nwith the wet rag.",
        "imageBrief": "Dot presses and lifts the wet cloth on the ink rather than rubbing sideways. A cream cleared area and pink absorbed cloth make the improved method visible. Same mat and jar, no replacement mat.",
        "state": {
          "location": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Dabbing transfers the washable ink from mat to rag.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 7,
        "text": "The mat is not pink.",
        "imageBrief": "The original cream mat is clean again; Dot holds the pink-stained cloth beside it. Show the same mat corners and jar position so this cannot read as a fresh replacement.",
        "state": {
          "location": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Central problem resolved: the mat has its original cream surface.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 8,
        "text": "The rag is pink!",
        "imageBrief": "Dot holds up the very pink rag with a satisfied amused expression. Her one small pink fingertip from page 2 is visible as a secondary joke; the clean cream mat stays in the frame. Dad smiles nearby.",
        "state": {
          "location": "Daylight kitchen craft table beside a low accessible sink. Dad stays nearby. One washable nonabsorbent cream work mat; no ink on furniture or floor.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Ink has moved to the rag; clean mat and tiny fingertip callback land the story.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why does Dot change from rubbing to using a wet rag?",
        "listenFor": "Rubbing spreads the ink. The wet rag picks the ink up when she dabs; the mat becomes clean and the rag becomes pink."
      },
      "visual": {
        "page": 6,
        "prompt": "What in the picture shows that dabbing is working?",
        "lookFor": "The mat is becoming cream again while the damp cloth takes on the pink ink; it is the same mat, not a new one."
      }
    }
  },
  {
    "id": "small-steps-19",
    "number": 19,
    "title": "Sing a Song",
    "afterCycle": 23,
    "focus": "ng",
    "practiceWords": [
      "sing",
      "song",
      "bang"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Cycle 3 taught whole word; final /nd/ cluster exceeds this collection’s default shape. Use careful /ænd/; reduced /ənd/ is a speech variant, not new decoding code."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Cycle 3 taught whole word; final /nd/ cluster exceeds this collection’s default shape. Use careful /ænd/; reduced /ənd/ is a speech variant, not new decoding code."
      },
      {
        "word": "bang",
        "graphemes": [
          "b",
          "a",
          "ng"
        ],
        "sounds": [
          "b",
          "æ",
          "ŋ"
        ],
        "firstCycle": 23,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Final x is the explicitly taught /ks/ chunk, not one phoneme."
      },
      {
        "word": "cat",
        "graphemes": [
          "c",
          "a",
          "t"
        ],
        "sounds": [
          "k",
          "æ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "hush",
        "graphemes": [
          "h",
          "u",
          "sh"
        ],
        "sounds": [
          "h",
          "ʌ",
          "ʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "pan",
        "graphemes": [
          "p",
          "a",
          "n"
        ],
        "sounds": [
          "p",
          "æ",
          "n"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Sam is decoded by the same taught CVC code; a name is not an automatic exception."
      },
      {
        "word": "sing",
        "graphemes": [
          "s",
          "i",
          "ng"
        ],
        "sounds": [
          "s",
          "ɪ",
          "ŋ"
        ],
        "firstCycle": 23,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "song",
        "graphemes": [
          "s",
          "o",
          "ng"
        ],
        "sounds": [
          "s",
          "ɑ",
          "ŋ"
        ],
        "firstCycle": 23,
        "type": "regular",
        "note": "Uses the accepted merged-U.S. short-o /ɑ/ pronunciation; ng is /ŋ/, not /n/ plus /g/."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:e84e58297a29a70f",
    "narrator": "SMALL-SAM",
    "cast": [
      "SMALL-SAM",
      "SMALL-DAD",
      "SMALL-CAT"
    ],
    "setting": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
    "props": [
      {
        "id": "pan",
        "description": "One small lightweight metal pan used as a pretend percussion instrument, never a hot cooking pan; handle and shape stay fixed."
      },
      {
        "id": "box",
        "description": "One plain open cardboard box, initially empty, then Cat’s temporary hiding place; always open and unsealed."
      },
      {
        "id": "rug",
        "description": "One pale-blue rug, large enough for Dad and Sam to sit and Cat to settle safely on the pan."
      }
    ],
    "coverBrief": "Sam sings with hands open, Dad listens warmly, and the ginger-and-white Cat sits snugly on the silent metal pan beside the open cardboard box. The expression and pan make a gentle visual joke without human animal hands or clothing. Use the locked Small Steps cast master: Sam in mustard-yellow T-shirt/navy full-length overalls/white trainers; Dot in teal T-shirt/purple full-length trousers/white trainers; Dad in forest-green shirt/tan trousers/brown shoes; ginger-and-white Cat with green collar; brown-and-white floppy-eared Pup with red collar. Draw only the listed cast. Clean bright flat cartoon, crisp continuous outlines, natural animal anatomy, smooth colors without paint or grain, landscape composition with complete key shapes and safe insets. No embedded lettering.",
    "storySpine": "Sam wants to perform a song but his pan-banging drives Cat into a box and makes Dad ask for the song instead; Sam puts the pan down, sings with Dad, and Cat quietly claims the noisy pan.",
    "failedAttempt": "Pages 2–4: Sam adds loud pan-banging; Cat hides and Dad asks Sam to stop the noise and sing.",
    "turn": "Page 5: Sam puts the pan on the rug and changes his performance.",
    "resolution": "Pages 6–8: Sam and Dad sing together; Cat leaves hiding and settles on the silent pan, a visual joke that also shows the changed soundscape.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I sing a song.",
        "imageBrief": "Sam sings in the living room. Dad listens from the rug; Cat lies comfortably nearby. The small unheated pan and open empty cardboard box are visible from the start.",
        "state": {
          "location": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-CAT"
          ],
          "beat": "Sam’s goal is a song for the others.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 2,
        "text": "I bang on a pan.",
        "imageBrief": "Sam pats the lightweight pan rhythmically with an open hand, adding a sudden louder accompaniment. Dad flinches slightly; Cat starts toward the already established open box. No stick or extra prop appears.",
        "state": {
          "location": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-CAT"
          ],
          "beat": "The noisy accompaniment causes discomfort.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 3,
        "text": "The cat is in a box.",
        "imageBrief": "Cat has retreated into the open box, ears angled back naturally; Dad turns toward Sam. Sam notices the response. The pan remains in his hands and the box is never shut.",
        "state": {
          "location": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-CAT"
          ],
          "beat": "Readable social effect: Cat hides after the banging.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 4,
        "text": "“Hush, Sam! Sing the song!”",
        "imageBrief": "Dad gently raises one open palm and asks for the song instead of the pan noise. Sam pauses with the pan lowered. Cat stays in the open box. Avoid an angry or shaming adult pose.",
        "state": {
          "location": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-CAT"
          ],
          "beat": "Dad names the boundary and gives a concrete alternative.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 5,
        "text": "I put the pan on the rug.",
        "imageBrief": "Sam puts the pan flat on the pale-blue rug, away from the box. His hands come away from it. Dad relaxes; Cat begins to peer from the open box.",
        "state": {
          "location": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-CAT"
          ],
          "beat": "Sam acts on the boundary: the pan stops.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 6,
        "text": "I sing the song.",
        "imageBrief": "Sam sings without touching the pan. Dad listens comfortably and Cat steps out of the box toward the pan. Keep one pan and one cat, with natural paws and no music-note lettering.",
        "state": {
          "location": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-CAT"
          ],
          "beat": "The original performance resumes in a gentler form.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 7,
        "text": "Dad and I sing the song.",
        "imageBrief": "Dad joins Sam in singing, both smiling naturally. Cat approaches the silent pan. The open cardboard box is now empty in the same place.",
        "state": {
          "location": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-CAT"
          ],
          "beat": "Shared performance succeeds; listener becomes a willing participant.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 8,
        "text": "The cat is on the pan!",
        "imageBrief": "Cat settles comfortably across the cool small pan on the rug, as though reserving it against further banging. Dad and Sam smile at the funny seat while their shared song remains the context.",
        "state": {
          "location": "Comfortable daylight living room with one pale-blue rug. Dad and Cat are present from page 1; one open cardboard box stays at the side of the rug.",
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD",
            "SMALL-CAT"
          ],
          "beat": "Cat is out of hiding; the quiet pan-seat is the earned joke.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How can you tell that Sam’s first performance bothered the others, and what does he change?",
        "listenFor": "Cat hides and Dad says “Hush.” Sam puts down the pan and sings; Dad joins and Cat comes back out."
      },
      "visual": {
        "page": 8,
        "prompt": "Compare Cat here with Cat on page 3. What tells you the situation has changed?",
        "lookFor": "Cat is relaxed on the silent pan instead of hiding inside the box; Sam has stopped banging and is singing with Dad."
      }
    }
  },
  {
    "id": "small-steps-20",
    "number": 20,
    "title": "A Bell in a Mess",
    "afterCycle": 24,
    "focus": "final ff, ss, zz and ll",
    "practiceWords": [
      "bell",
      "mess",
      "fuzz",
      "puff"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article /ə/ is the Cycle 2 whole word, not short a."
      },
      {
        "word": "bell",
        "graphemes": [
          "b",
          "e",
          "ll"
        ],
        "sounds": [
          "b",
          "ɛ",
          "l"
        ],
        "firstCycle": 24,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "bin",
        "graphemes": [
          "b",
          "i",
          "n"
        ],
        "sounds": [
          "b",
          "ɪ",
          "n"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "ding",
        "graphemes": [
          "d",
          "i",
          "ng"
        ],
        "sounds": [
          "d",
          "ɪ",
          "ŋ"
        ],
        "firstCycle": 23,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "fuzz",
        "graphemes": [
          "f",
          "u",
          "zz"
        ],
        "sounds": [
          "f",
          "ʌ",
          "z"
        ],
        "firstCycle": 24,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Cycle 1 taught pronoun I; its /aɪ/ value does not license long-i spellings generally."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Cycle 4 taught word; s represents /z/, not the default taught /s/."
      },
      {
        "word": "mess",
        "graphemes": [
          "m",
          "e",
          "ss"
        ],
        "sounds": [
          "m",
          "ɛ",
          "s"
        ],
        "firstCycle": 24,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "puff",
        "graphemes": [
          "p",
          "u",
          "ff"
        ],
        "sounds": [
          "p",
          "ʌ",
          "f"
        ],
        "firstCycle": 24,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "Cycle 19 taught whole word; u represents /ʊ/, not short u /ʌ/."
      },
      {
        "word": "ring",
        "graphemes": [
          "r",
          "i",
          "ng"
        ],
        "sounds": [
          "ɹ",
          "ɪ",
          "ŋ"
        ],
        "firstCycle": 23,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Cycle 2 taught whole word; e is unstressed /ə/. The /ði/ spoken variant before a vowel is also the same taught whole word, never a general e rule."
      },
      {
        "word": "tip",
        "graphemes": [
          "t",
          "i",
          "p"
        ],
        "sounds": [
          "t",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:b837bdf6ccfd4f61",
    "narrator": "SMALL-DOT",
    "cast": [
      "SMALL-DOT",
      "SMALL-DAD"
    ],
    "setting": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
    "props": [
      {
        "id": "bell",
        "description": "One small silver handbell with a rounded blue handle, hidden at the bottom of the yellow cup until page 6; audible when the cup tips and the bell’s clapper moves."
      },
      {
        "id": "cup",
        "description": "One opaque yellow plastic craft cup, upright and partly covered by fluff at first; tips safely on the low tabletop without breaking."
      },
      {
        "id": "fuzz",
        "description": "One loose soft blue cotton craft-fluff clump, initially obscuring the cup; a gentle puff moves it onto the rug, then Dot puts it in the bin. No loose airborne cloud."
      },
      {
        "id": "bin",
        "description": "One small green open craft bin beside the table, empty at first."
      }
    ],
    "coverBrief": "Dot peers at the yellow craft cup amid one soft blue fluff clump on the low table; a small silver glint and blue handle hint at the hidden handbell without giving the full reveal. The pale-blue rug and empty green bin are visible; Dad watches nearby. Use the locked Small Steps cast master: Sam in mustard-yellow T-shirt/navy full-length overalls/white trainers; Dot in teal T-shirt/purple full-length trousers/white trainers; Dad in forest-green shirt/tan trousers/brown shoes; ginger-and-white Cat with green collar; brown-and-white floppy-eared Pup with red collar. Draw only the listed cast. Clean bright flat cartoon, crisp continuous outlines, natural animal anatomy, smooth colors without paint or grain, landscape composition with complete key shapes and safe insets. No embedded lettering.",
    "storySpine": "Dot wants a small bell hidden in craft materials; puffing at the fuzz only spreads it onto the rug, so she tips an uncovered cup, hears the bell inside, puts the fuzz away and rings the recovered bell.",
    "failedAttempt": "Pages 2–4: a gentle puff scatters the craft fluff and reveals no bell in it.",
    "turn": "Page 5: Dot investigates the cup that the moving fluff has uncovered; its sound gives the useful clue.",
    "resolution": "Pages 6–8: the bell is identified inside the cup, Dot tidies the fluff into a bin, then rings the recovered bell.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "The bell is in a mess.",
        "imageBrief": "Dot searches the low craft table. The single yellow cup is partly hidden by soft blue craft fluff; the bell is concealed inside it, not separately visible. Dad and the green empty bin are nearby.",
        "state": {
          "location": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Goal: find the hidden bell amid the craft mess.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 2,
        "text": "I puff on the fuzz.",
        "imageBrief": "Dot gives one gentle puff toward the blue craft fluff, making the single loose clump slide from the low table toward the rug. The yellow cup starts to emerge; avoid airborne fibers or a huge cloud.",
        "state": {
          "location": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "First attempt moves the fluff.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 3,
        "text": "The fuzz is on the rug.",
        "imageBrief": "The soft blue clump is now on the pale-blue rug, leaving the upright yellow cup exposed on the table. Dot looks from the moved clump to the cup.",
        "state": {
          "location": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "The first attempt has spread the mess, not found the bell.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 4,
        "text": "The bell is not in the fuzz.",
        "imageBrief": "Dot checks the one blue fluff clump on the rug; no bell is in it. The exposed yellow cup remains in view on the low table, ready for a new approach.",
        "state": {
          "location": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "The failed search has a definite negative result.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 5,
        "text": "I tip the cup. Ding!",
        "imageBrief": "Dot gently tips the yellow cup on the tabletop. The concealed handbell inside shifts enough for its clapper to sound; a small blue handle begins to show, but the bell remains inside the tilted cup.",
        "state": {
          "location": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Turn: the cup’s sound points to the bell.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 6,
        "text": "The bell is in the cup!",
        "imageBrief": "Show the tilted yellow cup with the single silver handbell and rounded blue handle clearly inside. Dot’s face shows recognition; no second bell appears outside.",
        "state": {
          "location": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "The hidden bell has been found.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 7,
        "text": "I put the fuzz in a bin.",
        "imageBrief": "Dot gathers the one loose blue craft-fluff clump into the green bin. The recovered bell now rests beside the yellow cup on the low table. Dad stays nearby; the rug is clear again.",
        "state": {
          "location": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Dot repairs the mess caused by her failed attempt.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      },
      {
        "pageNumber": 8,
        "text": "I ring the bell. Ding!",
        "imageBrief": "Dot holds and rings the single silver handbell with blue handle. Dad enjoys the little celebration. The yellow cup is upright, the green bin contains the fluff, and the table and rug are usable again.",
        "state": {
          "location": "Daylight craft corner with a low wooden table, pale-blue rug and small waste bin. Dad stays nearby. Ordinary craft materials, no text or chemical supplies.",
          "cast": [
            "SMALL-DOT",
            "SMALL-DAD"
          ],
          "beat": "Bell recovered and working; craft mess tidied; sound pays off the clue.",
          "continuity": "Keep all named models, prop colors/counts, setting and before/after states fixed; only the pictured action changes state."
        }
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What clue helps Dot find the bell, and what does she do about the mess she made?",
        "listenFor": "Tipping the cup makes a ding, so she finds the bell inside. She puts the fuzz in the bin before ringing the bell."
      },
      "visual": {
        "page": 8,
        "prompt": "Find the cup, fuzz, bin and bell. How are their positions different from page 1?",
        "lookFor": "The bell is in Dot’s hand, the cup is upright and no longer hidden, the fuzz is in the bin, and the rug is clear."
      }
    }
  }
]);

export const GUIDED_READING_SMALL_STEPS_BOOKS = Object.freeze(MANUSCRIPTS.map(row => {
  const folder = "/guided-reading/small-steps/book-" + String(row.number).padStart(2, "0");
  const decodableScope = deepFreeze({
    id: row.id + ":v1", version: "2026-10-28.1", afterCycle: row.afterCycle,
    focus: row.focus, practiceWords: row.practiceWords, exceptions: row.exceptions, wordRecords: row.wordRecords,
    reviewedTextFingerprint: row.reviewedTextFingerprint, reviewedAt: "2026-10-28",
    reviewMethod: "Independent complete-manuscript, title, pronunciation and cumulative-code review",
    wordShape: "VC/CVC with explicitly taught qu, x, all, nk, ng and doubled-final chunks; declared whole-word exceptions"
  });
  return deepFreeze({
    id: row.id, title: row.title, type: "fiction", level: "B", guidedReadingLevel: "B",
    readingBandProfile: "standard", readingMode: "decodable",
    collection: "Small Steps", seriesTitle: "Small Steps", seriesId: "small-steps", seriesOrder: row.number,
    interestAge: "4–7; also suitable for older beginners", active: true, qaStatus: "approved",
    decodableScope, fullTextDecodingEvidence: decodableScope,
    narrator: row.narrator, cast: row.cast, setting: row.setting, props: row.props,
    coverImage: folder + "/cover.webp", cover: folder + "/cover.webp", coverUrl: folder + "/cover.webp", coverBrief: row.coverBrief,
    storyBibleReview: {kind:"fiction",storySpine:row.storySpine,failedAttempt:row.failedAttempt,turn:row.turn,resolution:row.resolution,canonIds:row.cast},
    pages: row.pages.map(page => ({
      ...page, image: folder + "/page-" + String(page.pageNumber).padStart(2, "0") + ".webp",
      pageAudioText: page.text,
      imageAlt: GUIDED_READING_SMALL_STEPS_DESCRIPTIONS[row.id][page.pageNumber - 1],
      pageDescription: GUIDED_READING_SMALL_STEPS_DESCRIPTIONS[row.id][page.pageNumber - 1],
      embeddedImageText: "", active: true, qaStatus: "approved", narrationNeedsRebuild: true
    })),
    discussion: row.discussion
  });
}));

export const GUIDED_READING_DISCUSSION_PROMPTS_SMALL_STEPS = Object.freeze(Object.fromEntries(
  GUIDED_READING_SMALL_STEPS_BOOKS.map(book => [book.id, book.discussion])
));
