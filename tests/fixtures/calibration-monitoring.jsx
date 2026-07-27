import React from "react";
import { createRoot } from "react-dom/client";

import "../../src/App.css";
import { CalibrationMonitoringPanel } from "../../src/components/admin/CalibrationMonitoringPanel.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <main className="admin-dashboard page-stack calibration-fixture-shell">
      <h1>Admin calibration preview</h1>
      <CalibrationMonitoringPanel />
    </main>
  </React.StrictMode>
);
