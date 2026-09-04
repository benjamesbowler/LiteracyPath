import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let SoundSeekersRoute;
let vite;

before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ default: SoundSeekersRoute } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/SoundSeekersRoute.jsx"
  ));
});

after(async () => {
  await vite?.close();
});

test("Sound Seekers route leaves portal ownership to the client during SSR", () => {
  assert.equal(typeof document, "undefined");
  assert.equal(renderToStaticMarkup(React.createElement(SoundSeekersRoute, {
    progressScopeKey: "route-isolation-ssr",
    isSoundEnabled: false,
    onExit() {}
  })), "");
});
