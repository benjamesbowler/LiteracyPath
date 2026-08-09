export function buildSmallGroupLesson({ recipe, componentRegistry }) {
  const steps = recipe.componentIds.map(({ id, role }) => {
    const component = componentRegistry[id];
    if (!component) throw new Error(`Unknown lesson component: ${id}`);
    if (component.role !== role) throw new Error(`Lesson component role mismatch: ${id}`);
    if (component.review?.status !== "approved") throw new Error(`Lesson component is not approved: ${id}`);
    return component;
  });
  return Object.freeze({
    schemaVersion: recipe.schemaVersion,
    recipeId: recipe.recipeId,
    cycleId: recipe.cycleId,
    targetKey: recipe.targetKey,
    durationMinutes: recipe.durationMinutes,
    learnerIds: recipe.learnerIds,
    contentVersion: recipe.contentVersion,
    adaptations: recipe.adaptations,
    evidencePurpose: "practice",
    evidenceLimit: "Teacher observation from this lesson does not update mastery automatically.",
    steps: Object.freeze(steps.map((component, index) => Object.freeze({
      stepNumber: index + 1,
      id: component.id,
      role: component.role,
      title: component.title,
      teacherText: component.teacherText,
      learnerTask: component.learnerTask,
      materials: Object.freeze([...(component.materials || [])]),
      examples: Object.freeze([...(component.examples || [])]),
      application: component.role === "apply" ? Object.freeze({ bookId: component.bookId, bookTitle: component.bookTitle, bookLevel: component.bookLevel, highFrequencyWords: component.highFrequencyWords, contentLimit: component.contentLimit }) : null
    })))
  });
}
