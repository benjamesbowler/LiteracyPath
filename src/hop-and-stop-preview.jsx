import { createRoot } from "react-dom/client";
import { HopAndStopUnit } from "./components/action-songs/HopAndStopUnit.jsx";

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
const songAvailable = new URLSearchParams(window.location.search).get("song") !== "unavailable";
root.render(<HopAndStopUnit songAvailable={songAvailable} />);
if (import.meta.hot) import.meta.hot.dispose(data => { data.root = root; });
