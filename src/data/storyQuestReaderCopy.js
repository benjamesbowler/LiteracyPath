// Shared by the reader and its recorded-audio generator.
import { isStoryQuestEnding } from "../utils/storyQuestRoutes.js";

export const STORY_QUEST_READER_COPY = Object.freeze([
  "Story Quests", "You choose what happens", "Meadow", "Dino", "Moonwood",
  "Hear the story", "Hear the choices", "Next", "Read again", "Finish",
  "Choose a story", "Continue", "Read with me", "Hear the word", "Hear the letters",
  "Tap a word to hear it.", "Try a different path.", "Back", "More", "Start over",
  "Full screen", "Exit full screen", "The end", "Previous scene",
  "Try another path"
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

export function storyQuestPlayText(play = {}) {
  return spokenSentences([play.prompt, ...(play.actions || []).map(action => action.label)]);
}

export function storyQuestEndingText(page = {}) {
  return spokenSentences([page.endingTitle, page.replayPrompt]);
}

export function storyQuestEndingCountText(found, total) {
  return `${found} of ${total} endings found`;
}

function storyQuestEndingCountItems(quest) {
  const total = quest.pages.filter(isStoryQuestEnding).length;
  return Array.from({ length: total }, (_, index) => ({
    questId: quest.id,
    pageId: "ending-count",
    text: storyQuestEndingCountText(index + 1, total)
  }));
}

export function storyQuestPageExtras(questId, page) {
  return [
    ...(page.play ? [
      { questId, pageId: `${page.id}-explore`, text: storyQuestPlayText(page.play) },
      ...[page.play.prompt, ...page.play.actions.flatMap(action => [action.label, action.reveal])]
        .map(text => ({ questId, pageId: `${page.id}-play-control`, text }))
    ] : []),
    ...(page.endingTitle ? [
      { questId, pageId: `${page.id}-ending`, text: storyQuestEndingText(page) },
      ...[page.endingTitle, page.replayPrompt].filter(Boolean)
        .map(text => ({ questId, pageId: `${page.id}-ending-control`, text }))
    ] : [])
  ];
}

export function storyQuestSpokenItems(quests = []) {
  return [
    ...STORY_QUEST_READER_COPY.map(text => ({ questId: "reader", pageId: "control", text })),
    ...quests.flatMap(quest => [
      { questId: quest.id, pageId: "invitation", text: storyQuestInvitation(quest) },
      ...storyQuestEndingCountItems(quest),
      ...quest.pages.flatMap(page => [
        { questId: quest.id, pageId: page.id, text: page.text.join(" ") },
        { questId: quest.id, pageId: `${page.id}-decision`, text: storyQuestDecisionText(page) },
        ...[page.choicePrompt, page.replayPrompt, ...(page.choices || []).map(choice => choice.label)]
          .filter(Boolean).map(text => ({ questId: quest.id, pageId: `${page.id}-control`, text })),
        ...storyQuestPageExtras(quest.id, page),
        ...(page.text.join(" ").match(/[A-Za-z]+(?:[’'][A-Za-z]+)*/g) || [])
          .map(text => ({ questId: quest.id, pageId: `${page.id}-word`, text }))
      ])
    ])
  ];
}
