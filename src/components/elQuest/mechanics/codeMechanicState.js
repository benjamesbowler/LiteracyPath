import { getChildWordAsset } from "../../../data/childAssets.js";

function normalizedSupportLevel(value) {
  const support = Number(value);
  return Number.isFinite(support) ? Math.max(0, Math.floor(support)) : 0;
}

function evidenceFor(round, target, response, supportLevel) {
  return {
    construct: String(round?.construct || ""),
    target: String(target || ""),
    response,
    supportLevel: normalizedSupportLevel(supportLevel)
  };
}

export function resolveScenePicture(word) {
  const asset = getChildWordAsset(word);
  return asset?.image || asset?.fallbackImage || "";
}

export function createLetterPressState() {
  return { selected: "", paired: false };
}

export function pressLetter(current, round, selected, supportLevel = 0) {
  const response = String(selected || "");
  const correct = response === String(round?.answer || round?.partnerForm || "");
  const model = String(round?.modelForm || "");
  const partner = String(round?.partnerForm || round?.answer || "");
  return {
    state: { ...current, selected: response, paired: correct },
    outcome: {
      correct,
      selected: response,
      feedback: correct
        ? `${model} and ${partner} are the same letter pair.`
        : `${response} does not pair with ${model}. Look for its matching letter form.`,
      evidence: evidenceFor(round, partner, response, supportLevel)
    }
  };
}

export function createSoundChoiceState() {
  return { selected: "", committed: false };
}

export function selectSoundChoice(current, selected) {
  return {
    ...current,
    selected: String(selected || ""),
    committed: false
  };
}

export function commitSoundChoice(current, round, supportLevel = 0) {
  const response = String(current?.selected || "");
  const accepted = Array.isArray(round?.acceptedAnswers)
    ? round.acceptedAnswers.map(String)
    : [];
  const correct = response.length > 0 && accepted.includes(response);
  const construct = String(round?.construct || "");
  const contrast = construct === "heard_ending_sound_family_mapping"
    ? "the ending sound family you heard"
    : "the sound you heard";
  return {
    state: { ...current, committed: correct },
    outcome: {
      correct,
      selected: response,
      feedback: correct
        ? `${response} spells ${contrast}.`
        : `${response} does not spell ${contrast}. Listen again and choose another letter.`,
      evidence: evidenceFor(
        round,
        round?.targetGrapheme || round?.answer,
        response,
        supportLevel
      )
    }
  };
}
