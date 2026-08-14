import { mathsStories } from "../stories/mathsStoryCatalog.js";
import { mathsAssessmentBank } from "../assessment/mathsAssessmentBank.js";
import { mathsActivityRecipes, mathsLessonInstruction, mathsLessonInstructionAudioId } from "../learn/mathsActivityRecipes.js";
import { mathsSongs } from "../music/mathsSongs.js";
import { mathsGames } from "../games/mathsGames.js";

const normalize = value => String(value || "").replace(/\s+/g, " ").trim();

export const mathsAudioRequests = Object.freeze([
  Object.freeze({ id: "maths-home:intro", role: "maths_instruction", exactText: "Choose a guided lesson, skills check, number story, or Arcade game. You can hear the instructions whenever you need them.", ownerId: "maths-home" }),
  Object.freeze({ id: "maths-check:intro", role: "maths_instruction", exactText: "This check has six calm Maths decisions. There is no timer or score, and you can choose not sure yet.", ownerId: "maths-check" }),
  Object.freeze({ id: "maths-arcade:intro", role: "maths_instruction", exactText: "Choose a game world. The Maths action moves the game forward. There is no timer and there are no lives.", ownerId: "maths-arcade" }),
  ...mathsGames.flatMap(game => [
    Object.freeze({ id: `arcade:${game.id}:instruction`, role: "maths_instruction", exactText: normalize(game.instructionText), ownerId: game.id }),
    Object.freeze({ id: `arcade:${game.id}:success`, role: "maths_instruction", exactText: normalize(game.successText), ownerId: game.id }),
    Object.freeze({ id: `arcade:${game.id}:repair`, role: "maths_instruction", exactText: normalize(game.repairText), ownerId: game.id })
  ]),
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
