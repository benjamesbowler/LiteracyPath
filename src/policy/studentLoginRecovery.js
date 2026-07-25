export const STUDENT_LOGIN_RECOVERY_STATES = Object.freeze({
  "code-not-found": Object.freeze({
    id: "code-not-found",
    title: "That code was not found",
    detail: "Check each letter and number. Your code is still in the box.",
    image: "/images/pals/poses/meadow-think.webp",
    audioKey: "did-not-match"
  }),
  "code-expired": Object.freeze({
    id: "code-expired",
    title: "Ask for the new class code",
    detail: "This class code has finished. Your teacher can show you the new one.",
    image: "/images/pals/poses/meadow-wave.webp",
    audioKey: "ask-teacher"
  }),
  "rate-limited": Object.freeze({
    id: "rate-limited",
    title: "Take a short break",
    detail: "There were too many tries on this device. Wait two minutes, then ask your teacher.",
    image: "/images/pals/poses/dino-think.webp",
    audioKey: "try-again"
  }),
  offline: Object.freeze({
    id: "offline",
    title: "You are offline",
    detail: "Reconnect this device, then try the same code again.",
    image: "/images/pals/poses/dino-think.webp",
    audioKey: "try-again"
  }),
  "ask-teacher": Object.freeze({
    id: "ask-teacher",
    title: "Ask your teacher",
    detail: "The class list could not open. Your teacher can check the class code.",
    image: "/images/pals/poses/meadow-wave.webp",
    audioKey: "ask-teacher"
  })
});

function networkFailure(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    error?.status === 0
    || ["network_error", "fetch_error", "offline"].includes(code)
    || /failed to fetch|network|offline|load failed/.test(message)
  );
}

export function classifyStudentCodeRecovery({
  data,
  error,
  online = true
} = {}) {
  if (data?.error === "not_found") {
    return STUDENT_LOGIN_RECOVERY_STATES["code-not-found"];
  }
  if (data?.error === "code_expired") {
    return STUDENT_LOGIN_RECOVERY_STATES["code-expired"];
  }
  if (data?.error === "rate_limited" || data?.error === "invalid_device") {
    return STUDENT_LOGIN_RECOVERY_STATES["rate-limited"];
  }
  if (!online || networkFailure(error)) {
    return STUDENT_LOGIN_RECOVERY_STATES.offline;
  }
  return STUDENT_LOGIN_RECOVERY_STATES["ask-teacher"];
}
