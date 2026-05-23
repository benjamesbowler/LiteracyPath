import { getChildWordAsset } from "./childAssets.js";
import { getApprovedAudioPath } from "./audioPreferenceManifest.js";

const listenAndFindOverrides = {
  core_cvc_001: ["cat", ["cat", "cap", "dog", "sun"]],
  exp7_cvc_1: ["cat", ["cat", "cap", "dog", "sun"]],
  exp7_cvc_2: ["bed", ["bed", "bad", "bid", "bud"]],
  exp7_cvc_3: ["hat", ["hat", "cat", "bug", "pen"]],
  exp7_cvc_4: ["mud", ["mud", "mug", "map", "bed"]],
  exp7_cvc_5: ["fin", ["fin", "lid", "dog", "cat"]],
  exp7_cvc_6: ["log", ["log", "leg", "bug", "cat"]],
  exp7_cvc_7: ["cup", ["cup", "cap", "cat", "dog"]],
  exp7_cvc_8: ["map", ["map", "mop", "mug", "man"]],
  exp7_cvc_9: ["ram", ["ram", "red", "mug", "cat"]],
  exp7_cvc_10: ["pen", ["pen", "pan", "pig", "pot"]],
  exp7_cvc_11: ["jam", ["jam", "jet", "dog", "sun"]],
  exp7_cvc_12: ["sit", ["sit", "sun", "mug", "bed"]],
  exp7_cvc_13: ["pot", ["pot", "pan", "pen", "pig"]],
  exp7_cvc_14: ["leg", ["leg", "log", "lid", "bug"]],
  exp7_cvc_15: ["bag", ["bag", "bug", "big", "dog"]],
  exp7_cvc_16: ["red", ["red", "ram", "mug", "dog"]],
  exp7_cvc_17: ["nut", ["nut", "net", "nap", "dog"]],
  exp7_cvc_18: ["sun", ["sun", "sit", "mug", "cat"]],
  exp7_cvc_19: ["pig", ["pig", "pan", "pen", "pot"]],
  exp7_cvc_20: ["dot", ["dot", "dog", "dig", "dug"]],
  exp7_cvc_21: ["wig", ["wig", "web", "lid", "sun"]],
  exp7_cvc_22: ["cap", ["cap", "cup", "cat", "dog"]],
  exp7_cvc_23: ["lid", ["lid", "wig", "sit", "cat"]],
  exp7_cvc_24: ["mug", ["mug", "mud", "map", "dog"]],
  exp7_cvc_25: ["van", ["van", "vet", "bat", "cat"]],
  exp7_cvc_26: ["bat", ["bat", "bed", "bug", "cat"]],
  exp7_cvc_27: ["dog", ["dog", "dig", "dug", "cat"]],
  exp7_cvc_28: ["man", ["man", "map", "mop", "mug"]],
  phonics_k_012: ["cat", ["cat", "cap", "dog", "sun"]]
};

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

export function isListenAndFindWordQuestion(question = {}) {
  const text = normalize(question.question || question.prompt);
  const typeText = normalize([question.questionType, question.formatType].join(" "));
  return (
    text === "listen and find the word." ||
    text === "listen and find the word" ||
    typeText.includes("listen_and_find_word") ||
    typeText.includes("heard_word_to_print")
  );
}

function getChoiceAssetMap(choices) {
  return Object.fromEntries(
    choices.map(choice => {
      const asset = getChildWordAsset(choice);
      return [
        choice,
        {
          image: asset?.image || asset?.fallbackImage || "",
          alt: asset?.alt || `Picture for ${choice}`
        }
      ];
    })
  );
}

export function enrichListenAndFindWordQuestion(question = {}) {
  if (!isListenAndFindWordQuestion(question)) return question;

  const override = listenAndFindOverrides[question.id];
  const answer = override?.[0] || question.answer;
  const choices = override?.[1] || question.choices || [];
  const targetAsset = getChildWordAsset(answer);
  const approvedAudioPath = getApprovedAudioPath(answer, targetAsset?.audio || "");

  return {
    ...question,
    question: "Listen and find the word",
    prompt: "Listen and find the word",
    questionType: "listen_and_find_word",
    formatType: "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    spokenPrompt: answer,
    audioText: answer,
    audioPath: approvedAudioPath,
    choices,
    answer,
    choiceImages: getChoiceAssetMap(choices),
    imagePath: ""
  };
}

export function getListenAndFindAssetDiagnostics(question = {}) {
  if (!isListenAndFindWordQuestion(question)) return null;

  const enriched = enrichListenAndFindWordQuestion(question);
  const choices = enriched.choices || [];
  const missingImages = choices.filter(choice => !enriched.choiceImages?.[choice]?.image);
  const missingChoiceAssets = choices.filter(choice => !getChildWordAsset(choice));
  const targetAsset = getChildWordAsset(enriched.answer);

  return {
    question: enriched,
    missingImages,
    missingChoiceAssets,
    missingAudio: !enriched.audioPath || !getApprovedAudioPath(enriched.answer, targetAsset?.audio || ""),
    usesSingleWordAudioText: normalize(enriched.audioText) === normalize(enriched.answer)
  };
}
