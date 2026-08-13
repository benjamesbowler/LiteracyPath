import { mathsStories } from "../stories/mathsStoryCatalog.js";
import { mathsAssessmentBank } from "../assessment/mathsAssessmentBank.js";
import { mathsActivityRecipes, mathsLessonInstruction, mathsLessonInstructionAudioId } from "../learn/mathsActivityRecipes.js";
import { mathsSongs } from "../music/mathsSongs.js";

const normalize = value => String(value || "").replace(/\s+/g, " ").trim();

export const mathsAudioRequests = Object.freeze([
  ...mathsStories.flatMap(story => story.pages.map(page => Object.freeze({
    id: `story:${story.id}:page:${page.pageNumber}`,
    role: "maths_story_page",
    exactText: normalize(page.exactText),
    ownerId: story.id
  }))),
  ...mathsAssessmentBank.flatMap(item => item.surfaceVariants.map(surface => Object.freeze({
    id: `assessment:${item.id}:${surface.id}:prompt`,
    role: "maths_instruction",
    exactText: normalize(surface.promptText),
    ownerId: `${item.id}:${surface.id}`
  }))),
  ...mathsActivityRecipes.map(recipe => Object.freeze({
    id: `activity:${recipe.id}:instruction`,
    role: "maths_instruction",
    exactText: normalize(recipe.instructionText),
    ownerId: recipe.id
  })),
  ...mathsActivityRecipes.flatMap(recipe => ["notice", "explain", "check"].map(stage => Object.freeze({
    id: mathsLessonInstructionAudioId(recipe, stage),
    role: "maths_instruction",
    exactText: normalize(mathsLessonInstruction(recipe, stage)),
    ownerId: `${recipe.skillId}:${stage}`
  }))),
  ...mathsSongs.map(song => Object.freeze({
    id: `song:${song.id}:guide`,
    role: "maths_song_guide",
    exactText: normalize(song.lyrics),
    ownerId: song.id
  }))
]);
