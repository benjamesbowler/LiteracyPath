export const LESSON_RECIPE_SCHEMA_VERSION = 1;
export const LESSON_DURATIONS = Object.freeze([8, 12, 20]);
const REQUIRED_ROLES = Object.freeze(["retrieve", "model", "guide", "apply", "observe"]);

export function createLessonRecipe({ recipeId, durationMinutes, cycleId, targetKey, prerequisiteKeys = [], learnerIds, componentIds, contentVersion, adaptations = [] }) {
  if (!LESSON_DURATIONS.includes(durationMinutes)) throw new Error("Unsupported lesson duration.");
  if (!recipeId || !cycleId || !targetKey || !contentVersion) throw new Error("Lesson identity and content version are required.");
  const uniqueLearners = [...new Set((learnerIds || []).filter(Boolean))];
  if (!uniqueLearners.length) throw new Error("Choose at least one learner.");
  const roles = new Set((componentIds || []).map(component => component.role));
  REQUIRED_ROLES.forEach(role => { if (!roles.has(role)) throw new Error(`Lesson recipe is missing the ${role} component.`); });
  return Object.freeze({
    schemaVersion: LESSON_RECIPE_SCHEMA_VERSION,
    recipeId,
    durationMinutes,
    cycleId,
    targetKey,
    prerequisiteKeys: Object.freeze([...new Set(prerequisiteKeys)]),
    learnerIds: Object.freeze(uniqueLearners),
    componentIds: Object.freeze(componentIds.map(component => Object.freeze({ id: component.id, role: component.role }))),
    contentVersion,
    adaptations: Object.freeze([...new Set(adaptations)])
  });
}

export function validateLessonRecipe(recipe) {
  createLessonRecipe(recipe);
  return true;
}
