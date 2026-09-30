// Shared by the reader and its recorded-audio generator.
export const STORY_QUEST_READER_COPY = Object.freeze([
  "Story Quests", "You choose what happens", "Meadow", "Dino", "Moonwood",
  "Hear the story", "Hear the choices", "Next", "Read again", "Finish",
  "Choose a story", "Continue", "Read with me", "Hear the word", "Hear the letters",
  "Tap a word to hear it.", "Try a different path.", "Back", "More", "Start over",
  "Full screen", "Exit full screen", "The end", "Previous scene"
]);

function spokenSentences(parts) {
  return parts.filter(Boolean).map(part => {
    const text = String(part).trim();
    return /[.!?]$/.test(text) ? text : `${text}.`;
  }).join(" ");
}

export function storyQuestInvitation(quest = {}) {
  return spokenSentences([quest.shortTitle || quest.title, quest.hook]);
}

export function storyQuestDecisionText(page = {}) {
  return spokenSentences([page.choicePrompt, ...(page.choices || []).map(choice => choice.label)]);
}

export function storyQuestSpokenItems(quests = []) {
  return [
    ...STORY_QUEST_READER_COPY.map(text => ({ questId: "reader", pageId: "control", text })),
    ...quests.flatMap(quest => [
      { questId: quest.id, pageId: "invitation", text: storyQuestInvitation(quest) },
      ...quest.pages.flatMap(page => [
        { questId: quest.id, pageId: page.id, text: page.text.join(" ") },
        { questId: quest.id, pageId: `${page.id}-decision`, text: storyQuestDecisionText(page) },
        ...[page.choicePrompt, page.replayPrompt, ...(page.choices || []).map(choice => choice.label)]
          .filter(Boolean).map(text => ({ questId: quest.id, pageId: `${page.id}-control`, text })),
        ...(page.text.join(" ").match(/[A-Za-z]+(?:[’'][A-Za-z]+)*/g) || [])
          .map(text => ({ questId: quest.id, pageId: `${page.id}-word`, text }))
      ])
    ])
  ];
}
