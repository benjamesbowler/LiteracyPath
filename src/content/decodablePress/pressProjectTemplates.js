export const PRESS_PROJECT_TEMPLATES = Object.freeze([
  Object.freeze({
    id: "try-again-tale",
    version: 1,
    title: "A try-again tale",
    description: "A tiny character wants something, the first plan fails, and a changed plan earns the ending.",
    pagePrompts: Object.freeze([
      Object.freeze({ id: "goal", label: "What does your character want?", frame: "The ___ wants ___." }),
      Object.freeze({ id: "obstacle", label: "What gets in the way?", frame: "But ___ cannot ___." }),
      Object.freeze({ id: "attempt", label: "What do they try first?", frame: "___ tries ___. It does not work." }),
      Object.freeze({ id: "ending", label: "What do they change?", frame: "Then ___ ___. At last, ___." })
    ]),
    review: Object.freeze({ status: "approved", reviewedAt: "2026-08-09", ageRange: "5-9", narrativeChecks: Object.freeze(["specific goal", "concrete obstacle", "failed first attempt", "changed action", "earned ending"]) })
  }),
  Object.freeze({
    id: "helping-hand",
    version: 1,
    title: "A helpful surprise",
    description: "Two characters solve a practical problem by noticing what the other needs.",
    pagePrompts: Object.freeze([
      Object.freeze({ id: "need", label: "Who needs help, and with what?", frame: "___ has a problem." }),
      Object.freeze({ id: "miss", label: "What helpful idea does not work yet?", frame: "___ tries to help, but ___." }),
      Object.freeze({ id: "notice", label: "What important clue do they notice?", frame: "Then ___ sees ___." }),
      Object.freeze({ id: "solve", label: "How do they use the clue together?", frame: "Together, they ___." })
    ]),
    review: Object.freeze({ status: "approved", reviewedAt: "2026-08-09", ageRange: "5-9", narrativeChecks: Object.freeze(["agency for both characters", "no rescue stereotype", "observable clue", "earned solution"]) })
  })
]);

export function getPressProjectTemplate(templateId) {
  return PRESS_PROJECT_TEMPLATES.find(template => template.id === templateId) || null;
}
