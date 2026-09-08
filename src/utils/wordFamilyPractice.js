export function familyPracticeOptions(words = [], familyId = "") {
  return words
    .filter(item => item?.familyId === familyId)
    .map(item => ({
      onset: item.onset || item.word?.[0] || "",
      word: item.word || ""
    }));
}

export function nextFamilyTarget(words = [], familyId = "", builtWords = []) {
  const built = builtWords instanceof Set ? builtWords : new Set(builtWords);
  return words.find(item => item?.familyId === familyId && item.word && !built.has(item.word))?.word || "";
}
