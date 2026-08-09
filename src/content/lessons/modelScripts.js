export function modelScriptFor(card) {
  if (!card?.spelling || !card?.sound) throw new Error("A reviewed sound card is required.");
  return Object.freeze({
    teacherText: card.teacherScript || `Show ${card.spelling}. Say ${card.sound}. Learners echo, then find the spelling.`,
    learnerTask: `Watch, echo ${card.sound}, then point to ${card.spelling}.`,
    articulation: card.articulation || "Keep the sound precise and avoid adding an extra vowel."
  });
}
