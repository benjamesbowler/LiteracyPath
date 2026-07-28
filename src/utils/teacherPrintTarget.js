export const TEACHER_PRINT_TARGETS = Object.freeze({
  CLASS: "class",
  EL_CLASS: "el-class"
});

export function printTeacherDocument(target, printAction) {
  if (typeof document === "undefined") {
    throw new Error("Printing is only available in a browser.");
  }
  const body = document.body;
  const previousTarget = body.dataset.teacherPrintTarget;
  body.dataset.teacherPrintTarget = target;
  try {
    const action = printAction || (() => window.print());
    return action();
  } finally {
    if (previousTarget) {
      body.dataset.teacherPrintTarget = previousTarget;
    } else {
      delete body.dataset.teacherPrintTarget;
    }
  }
}
