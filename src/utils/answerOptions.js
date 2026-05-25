export function getAnswerOptionLabel(option) {
  if (option == null) return "";
  if (typeof option === "string" || typeof option === "number") return String(option);
  if (typeof option !== "object") return String(option || "");

  return String(
    option.label ??
    option.text ??
    option.word ??
    option.value ??
    option.answer ??
    option.title ??
    ""
  ).trim();
}

export function getAnswerOptionValue(option) {
  if (option == null) return "";
  if (typeof option === "string" || typeof option === "number") return String(option);
  if (typeof option !== "object") return String(option || "");

  return String(
    option.value ??
    option.answer ??
    option.word ??
    option.label ??
    option.text ??
    option.title ??
    ""
  ).trim();
}

export function normalizeAnswerOption(option) {
  const label = getAnswerOptionLabel(option);
  const value = getAnswerOptionValue(option) || label;

  return {
    label,
    value,
    raw: option
  };
}

export function getAnswerOptionMedia(option = {}) {
  if (!option || typeof option !== "object") {
    return {
      image: "",
      audio: "",
      alt: ""
    };
  }

  return {
    image: option.image || option.imageUrl || option.imagePath || "",
    audio: option.audio || option.audioUrl || option.audioPath || "",
    alt: option.alt || option.imageAlt || ""
  };
}
