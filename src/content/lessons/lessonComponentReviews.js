export const LESSON_COMPONENT_CONTENT_VERSION = "small-group-phonics-v1";

export function reviewedCycleComponent(component) {
  return Object.freeze({
    ...component,
    review: Object.freeze({
      status: "approved",
      authority: "elSkillsBlockCycles",
      contentVersion: LESSON_COMPONENT_CONTENT_VERSION
    })
  });
}
