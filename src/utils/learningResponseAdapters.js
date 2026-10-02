/** Exact modeled responses for learning surfaces; interaction drafts stay in their native board. */
export function learningExpectedAnswer(question = {}) {
  switch (question.mechanicId) {
    case 'letterPair': return question.partnerForm;
    case 'soundChoice': return question.acceptedAnswers?.[0] || question.targetGrapheme;
    case 'sceneHunt':
    case 'pictureSearch': return (question.objects || []).filter(item => item.matches).map(item => item.id || item.word);
    case 'letterGrid': return (question.cells || []).filter(item => item.matches || (question.targetLetters || []).some(letter => String(item.letter).toLowerCase() === String(letter).toLowerCase())).map(item => item.id || item.letter);
    case 'missingLetter': return question.missingGrapheme;
    case 'rhymePair': return question.rhymingWords || question.correctPairs?.[0] || [];
    default: return question.answer ?? question.expected ?? question.targetGrapheme;
  }
}
/** Continuous traces and memory mismatches are legitimate exploration, not answer probes. */
export function usesLearningResponseEpisode(question = {}) {
  return !['letterTrace', 'wordMemory'].includes(question.mechanicId);
}
export function objectLearningQuestion(round, object) {
  return object ? { ...round, ...object, objects: undefined, id: `${round.id}:object:${object.word}`, targetWord: object.word, itemKey: object.word } : round;
}

export function learningModelPart(value, question = {}) {
  if (value && typeof value === "object") {
    const label = value.label || value.word || value.text || value.letter || value.grapheme;
    return { label: typeof label === "string" ? label : "Match the example", image: value.image || value.imagePath };
  }
  const items = [...(question.answerOptions || []), ...(question.choices || []), ...(question.imageCards || []), ...(question.objects || []), ...(question.cells || []), ...(question.cards || [])];
  const choice = items.find(item => item && typeof item === "object" && [item.id, item.value, item.word, item.label].some(key => String(key ?? "") === String(value)));
  return { label: String(choice?.label || choice?.word || choice?.text || choice?.letter || value || "Match the example"), image: choice?.image || choice?.imagePath || choice?.src };
}
export function learningModelLabel(value, question = {}) {
  return (Array.isArray(value) ? value : [value]).map(item => learningModelPart(item, question).label).join(" · ");
}
