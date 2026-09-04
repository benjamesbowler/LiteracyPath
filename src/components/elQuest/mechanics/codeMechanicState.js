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

export function createSoundGateState() {
  return { selected: "", committed: false, gateOpen: false };
}

export function selectSoundMagnet(current, selected) {
  return {
    ...current,
    selected: String(selected || ""),
    committed: false,
    gateOpen: false
  };
}

export function commitSoundGate(current, round, supportLevel = 0) {
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
    state: { ...current, committed: true, gateOpen: correct },
    outcome: {
      correct,
      selected: response,
      feedback: correct
        ? `${response} spells ${contrast}. The sound gate opens.`
        : `${response} does not spell ${contrast}. Listen again and choose another magnet.`,
      evidence: evidenceFor(
        round,
        round?.targetGrapheme || round?.answer,
        response,
        supportLevel
      )
    }
  };
}

export function createSceneHuntState() {
  return {
    selectedItems: [],
    // Picture names are part of the task cue, not a hidden support toggle.
    labelsVisible: true,
    checked: false,
    complete: false
  };
}

export function toggleSceneHuntItem(current, word) {
  const item = String(word || "");
  const selectedItems = current.selectedItems.includes(item)
    ? current.selectedItems.filter(selected => selected !== item)
    : [...current.selectedItems, item];
  return { ...current, selectedItems, checked: false, complete: false };
}

export function showSceneHuntLabels(current) {
  return { ...current, labelsVisible: true };
}

export function sceneHuntSupportLevel(baseSupportLevel, current) {
  // Names are always available now, so showing them is not an extra support
  // event that should inflate the evidence level.
  return normalizedSupportLevel(baseSupportLevel);
}

function sameItemSet(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return leftSet.size === rightSet.size
    && [...leftSet].every(item => rightSet.has(item));
}

export function commitSceneHunt(current, round, supportLevel = 0) {
  const selectedItems = [...new Set(current?.selectedItems || [])];
  const targetItems = (round?.objects || [])
    .filter(object => object.matches === true)
    .map(object => String(object.word || ""));
  const correct = sameItemSet(selectedItems, targetItems);
  const ending = round?.construct === "ending_grapheme_pattern_discrimination";
  const relation = ending
    ? "ends with the target pattern"
    : "starts with the target sound";
  const selectedDescription = selectedItems.length
    ? selectedItems.join(", ")
    : "no pictures";
  const effectiveSupport = sceneHuntSupportLevel(supportLevel, current);
  const outcome = {
    correct,
    selected: selectedItems,
    selectedItems,
    feedback: correct
      ? `You tagged every word that ${relation}.`
      : `You tagged ${selectedDescription}. Listen again and tag every word that ${relation}.`,
    evidence: evidenceFor(
      round,
      round?.targetGrapheme,
      selectedItems,
      effectiveSupport
    )
  };
  return {
    state: { ...current, checked: true, complete: correct },
    outcome
  };
}
