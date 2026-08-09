export const TRANSFER_CONTEXTS = Object.freeze({
  unfamiliar_word: Object.freeze({ label: "New word", claim: "Shows one use of taught code in an unfamiliar word." }),
  controlled_sentence: Object.freeze({ label: "Sentence", claim: "Shows one use in a controlled sentence context." }),
  connected_text: Object.freeze({ label: "Short text", claim: "Shows one use in a short connected-text context." })
});

export const TRANSFER_WORKLOAD_POLICY = Object.freeze({ maxOffersPerDay: 1, avoidRepeatDays: 3, itemCount: 3 });
