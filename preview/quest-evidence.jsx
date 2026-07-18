import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import QuestFieldStudyConsole from "../src/components/quest/QuestFieldStudyConsole.jsx";
import { registerOfflineShell } from "../src/utils/offlineShell.js";

if (import.meta.env.PROD) void registerOfflineShell();

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <QuestFieldStudyConsole />
  </StrictMode>
);
