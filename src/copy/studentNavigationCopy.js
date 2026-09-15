// Exact Home/Books copy shared with the compact navigation-audio generator.
// These formatters take display facts; they never load learning or book data.
export const STUDENT_HOME_ACTIVITY_TITLES = Object.freeze({
  "sound-seekers": "The Sound Trail",
  "phonics-learning": "Letters",
  "adventure-map": "Adventure Map",
  arcade: "Arcade",
  "story-quests": "Story Quests",
  "reading-library": "Books",
  "my-hollow": "My Hollow"
});

export const STUDENT_HOME_COPY = Object.freeze({
  teacherPicked: "Your teacher picked this",
  continue: "Carry on where you stopped",
  start: "Start here",
  explore: "Or go anywhere you like",
  unreadableProgress: "We could not find your last stop.",
  phonicsStop: "Letters and sounds",
  storiesStop: "A story you choose",
  hollowStop: "Your own place",
  fallbackBookTitle: "Pick a book",
  fallbackGameTitle: "Play a game",
  soundStop: (index, name) => `Stop ${index} — ${name}`,
  mapStop: cycleNumber => `Stop ${cycleNumber} on the map`,
  bookStop: title => `Your book — ${title}`,
  gameStop: title => `Your game — ${title}`
});

export function homeHeroInstruction(cardState) {
  if (cardState?.label === "Teacher picked") return STUDENT_HOME_COPY.teacherPicked;
  if (cardState?.label === "Continue") return STUDENT_HOME_COPY.continue;
  return STUDENT_HOME_COPY.start;
}

export function studentBookPanelAudioText(resuming, title) {
  return `${resuming ? "You stopped here." : "Start here."} ${title}.`;
}
