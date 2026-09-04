import { Fragment, createElement } from "react";

export function isSoloCapitalI(word) {
  return String(word ?? "").trim().toLowerCase() === "i";
}

export function ChildWordText({ word }) {
  const text = String(word ?? "").trim();
  if (!isSoloCapitalI(text)) return createElement(Fragment, null, text);
  return createElement("span", { className: "lp-capital-i" }, "I");
}
