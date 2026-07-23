import React from "react";
import { createRoot } from "react-dom/client";
import "../../src/App.css";
import { TeacherSurfaceStateFixtureSheet } from "../../src/components/teacher/ui/TeacherSurfaceState.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TeacherSurfaceStateFixtureSheet />
  </React.StrictMode>
);
