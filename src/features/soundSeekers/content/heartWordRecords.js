const INTRODUCTIONS = Object.freeze([
  ["s1", ["a"]],
  ["s3", ["I", "the"]], ["s4", ["is"]], ["s5", ["to", "go"]],
  ["s6", ["my", "and"]], ["s7", ["he", "she"]], ["s8", ["we", "me"]],
  ["s9", ["be", "was"]], ["s10", ["no", "you"]], ["s11", ["they", "all"]],
  ["s12", ["her", "are"]], ["s13", ["said", "so"]], ["s14", ["have", "like"]],
  ["s15", ["some", "come"]], ["s16", ["were", "there"]], ["s17", ["little", "one"]],
  ["s18", ["do", "when"]], ["s19", ["out", "what"]], ["s20", ["oh", "their"]],
  ["s21", ["people", "called"]], ["s22", ["looked", "asked"]],
  ["s23", ["your", "water"]], ["s24", ["where", "who"]],
  ["s25", ["again", "thought"]], ["s26", ["through", "work"]],
  ["s27", ["any", "many"]], ["s28", ["laughed", "because"]],
  ["s29", ["different", "eyes"]], ["s30", ["friends", "once"]],
  ["s31", ["please", "could"]], ["s32", ["would", "should"]]
]);

export const HEART_WORD_RECORDS = Object.freeze(INTRODUCTIONS.flatMap(([stopId, words]) =>
  words.map((display, index) => Object.freeze({
    recordId: `hw:${display.toLowerCase()}`,
    category: "heartWords",
    contentId: `heart-word:${display.toLowerCase()}`,
    targetId: `hw:${display.toLowerCase()}`,
    wordId: display.toLowerCase(),
    display,
    pronunciationId: display.toLowerCase(),
    introductionStopId: stopId,
    introductionSlotId: `heart-slot-${stopId}-${index + 1}`,
    slotIds: Object.freeze([`heart-slot-${stopId}-${index + 1}`])
  }))));
