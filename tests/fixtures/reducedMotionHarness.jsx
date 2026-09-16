import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useReducedMotion } from "../../src/hooks/useReducedMotion.js";

function Preference() {
  return <output aria-label="Motion preference">{useReducedMotion() ? "reduced" : "full"}</output>;
}
createRoot(document.getElementById("root")).render(<StrictMode><Preference /></StrictMode>);
