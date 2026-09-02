import React from "react";
import { createRoot } from "react-dom/client";

import { ContentArtGallery } from "../src/features/soundSeekers/preview/ContentArtGallery.jsx";
import { parseSoundSeekersGalleryQuery } from "../src/features/soundSeekers/preview/galleryReplayRecipes.js";

const root = document.getElementById("sound-seekers-v2-content-root");
if (!root) throw new Error("Sound Seekers v2 gallery root is missing");

try {
  const query = parseSoundSeekersGalleryQuery(window.location.search);
  createRoot(root).render(
    <React.StrictMode>
      <ContentArtGallery query={query} />
    </React.StrictMode>
  );
} catch (error) {
  root.dataset.galleryError = "true";
  root.textContent = `Gallery input rejected: ${error.message}`;
  throw error;
}
