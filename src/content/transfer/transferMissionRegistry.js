const mission = (id,targetKey,context,responseFormat,instruction,items) => Object.freeze({
  id,targetKey,context,responseFormat,instruction,
  evidenceUnit: targetKey === "cvc_short_vowels" ? "short_vowel" : "phonics_pattern",
  prerequisiteKeys:Object.freeze([targetKey]),contentVersion:"transfer-v2-2026.08",
  mechanic:"choice",mechanicRehearsal:Object.freeze({prompt:"Practice: which word has short a, /a/?",choices:Object.freeze(["map","mip"]),answer:"map",incorrectFeedback:"Listen to the middle: mip has /i/. Try the word with /a/.",help:"Choose the word with /a/. This practice does not count."}),
  items:Object.freeze(items.map(item=>Object.freeze(item))),accessibilityAlternative:"keyboard_or_touch_choice",
  masteryEligible:false,review:Object.freeze({status:"approved",reviewedAt:"2026-08-09",evidenceClaim:"separate_transfer_sample"})
});

const CVC=[
  mission("transfer-cvc-new-word","cvc_short_vowels","unfamiliar_word","SHORT_VOWEL_WORD","Pick the word with the short vowel shown.",[
    {id:"cvc-nw-1",prompt:"Which word has short a, /a/?",choices:["dap","dep","dip"],answer:"dap",incorrectFeedback:"Check the middle sound. We need /a/, like map."},{id:"cvc-nw-2",prompt:"Which word has short i, /i/?",choices:["zot","zim","zem"],answer:"zim",incorrectFeedback:"Check the middle sound. We need /i/, like sit."},{id:"cvc-nw-3",prompt:"Which word has short o, /o/?",choices:["vup","vep","vop"],answer:"vop",incorrectFeedback:"Check the middle sound. We need /o/, like hot."}
  ]),
  mission("transfer-cvc-sentence","cvc_short_vowels","controlled_sentence","SHORT_VOWEL_WORD","Choose the word that makes the sentence work.",[
    {id:"cvc-s-1",prompt:"The cat sat on the ___.",choices:["mat","met","mit"],answer:"mat"},{id:"cvc-s-2",prompt:"Dad put a lid on the ___.",choices:["pot","pet","pit"],answer:"pot"},{id:"cvc-s-3",prompt:"The red hen can ___.",choices:["hop","hep","hip"],answer:"hop"}
  ]),
  mission("transfer-cvc-text","cvc_short_vowels","connected_text","SHORT_VOWEL_WORD","Use the tiny text to choose the missing word.",[
    {id:"cvc-t-1",prompt:"Sam has a map. Sam can ___ the path.",choices:["spot","spit","spat"],answer:"spot"},{id:"cvc-t-2",prompt:"The pup is hot. It sits in the ___.",choices:["sun","sin","sen"],answer:"sun"},{id:"cvc-t-3",prompt:"A bug is on the log. The bug can ___.",choices:["run","ran","ren"],answer:"run"}
  ])
];
const DIGRAPHS=[
  mission("transfer-digraph-new-word","digraphs","unfamiliar_word","DIGRAPH_COMPLETE_WORD","Complete a new word with the taught spelling.",[
    {id:"dg-nw-1",prompt:"Finish: __ip",choices:["sh","ch","th"],answer:"sh"},{id:"dg-nw-2",prompt:"Finish: __op",choices:["ch","th","sh"],answer:"ch"},{id:"dg-nw-3",prompt:"Finish: ba__",choices:["th","sh","ch"],answer:"th"}
  ]),
  mission("transfer-digraph-sentence","digraphs","controlled_sentence","DIGRAPH_COMPLETE_WORD","Complete the word that fits the sentence.",[
    {id:"dg-s-1",prompt:"The ___ip is on the sea.",choices:["sh","ch","th"],answer:"sh"},{id:"dg-s-2",prompt:"I can ___op the log.",choices:["ch","sh","th"],answer:"ch"},{id:"dg-s-3",prompt:"We ran on the pa__.",choices:["th","ch","sh"],answer:"th"}
  ]),
  mission("transfer-digraph-text","digraphs","connected_text","DIGRAPH_COMPLETE_WORD","Use the short text to finish the key word.",[
    {id:"dg-t-1",prompt:"Chip has a fish. The fi__ can swim.",choices:["sh","ch","th"],answer:"sh"},{id:"dg-t-2",prompt:"Beth has a bath. The ba__ is hot.",choices:["th","sh","ch"],answer:"th"},{id:"dg-t-3",prompt:"The chick is fed. The ___ick can rest.",choices:["ch","sh","th"],answer:"ch"}
  ])
];
const BLENDS=[
  mission("transfer-blend-new-word","blends","unfamiliar_word","BLEND_COMPLETE_WORD","Complete a new word with its opening blend.",[
    {id:"bl-nw-1",prompt:"Finish: __im",choices:["sl","br","st"],answer:"sl"},{id:"bl-nw-2",prompt:"Finish: __og",choices:["fr","cl","sp"],answer:"fr"},{id:"bl-nw-3",prompt:"Finish: __ap",choices:["cl","dr","sn"],answer:"cl"}
  ]),
  mission("transfer-blend-sentence","blends","controlled_sentence","BLEND_COMPLETE_WORD","Complete the word that makes the sentence work.",[
    {id:"bl-s-1",prompt:"The frog can __im.",choices:["sw","cl","br"],answer:"sw"},{id:"bl-s-2",prompt:"I can __ap my hands.",choices:["cl","fr","sn"],answer:"cl"},{id:"bl-s-3",prompt:"The flag is on a __ick.",choices:["st","dr","pl"],answer:"st"}
  ]),
  mission("transfer-blend-text","blends","connected_text","BLEND_COMPLETE_WORD","Use the short text to finish the key word.",[
    {id:"bl-t-1",prompt:"A crab is on a rock. The __ab can grip.",choices:["cr","st","fl"],answer:"cr"},{id:"bl-t-2",prompt:"The drum is loud. I hit the __um.",choices:["dr","cl","sn"],answer:"dr"},{id:"bl-t-3",prompt:"A plum fell. The __um is soft.",choices:["pl","fr","st"],answer:"pl"}
  ])
];

export const TRANSFER_MISSIONS = Object.freeze([...CVC,...DIGRAPHS,...BLENDS]);
