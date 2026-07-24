import fs from "node:fs";

import {
  buildMediaBoardModel,
  mediaBoardPath,
  renderMediaBoard
} from "./mediaBoard.mjs";

fs.writeFileSync(mediaBoardPath, renderMediaBoard(buildMediaBoardModel()));
console.log("Wrote docs/release/MEDIA_BOARD.md");
