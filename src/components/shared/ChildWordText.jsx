import { Fragment, createElement } from "react";
import { isSoloCapitalI } from "./childWordTextUtils.js";

export function ChildWordText({ word }) {
  const text = String(word ?? "").trim();
  if (!isSoloCapitalI(text)) return createElement(Fragment, null, text);
  return createElement("span", { className: "lp-capital-i" }, "I");
}
