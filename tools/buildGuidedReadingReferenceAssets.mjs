import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "public");
const characterDir = path.join(publicDir, "guided-reading/reference/characters");

const publicPath = value => path.join(publicDir, value.replace(/^\//, ""));

async function buildCharacterCrop({ source, output, crop, width, height }) {
  await sharp(publicPath(source))
    .extract(crop)
    .resize(width, height, {
      fit: "contain",
      background: { r: 238, g: 238, b: 228, alpha: 1 }
    })
    .webp({ quality: 88 })
    .toFile(path.join(characterDir, output));
}

async function buildMoonwoodCastSheet() {
  const panelWidth = 512;
  const panelHeight = 288;
  const columns = 2;
  const covers = Array.from({ length: 10 }, (_, index) => {
    const bookNumber = String(index + 1).padStart(2, "0");
    return publicPath(`/guided-reading/series/moonwood-tales/book-${bookNumber}/cover.webp`);
  });

  const panels = await Promise.all(
    covers.map(cover =>
      sharp(cover)
        .resize(panelWidth, panelHeight, { fit: "cover", position: "attention" })
        .webp({ quality: 86 })
        .toBuffer()
    )
  );

  await sharp({
    create: {
      width: panelWidth * columns,
      height: panelHeight * Math.ceil(panels.length / columns),
      channels: 3,
      background: { r: 28, g: 43, b: 38 }
    }
  })
    .composite(
      panels.map((input, index) => ({
        input,
        left: (index % columns) * panelWidth,
        top: Math.floor(index / columns) * panelHeight
      }))
    )
    .webp({ quality: 88 })
    .toFile(path.join(characterDir, "moonwood-cast-master.webp"));
}

await Promise.all([
  buildCharacterCrop({
    source: "/guided-reading/series/moonwood-tales/book-11/page-007.webp",
    output: "toadling-master.webp",
    crop: { left: 285, top: 690, width: 360, height: 330 },
    width: 720,
    height: 660
  }),
  buildCharacterCrop({
    source: "/guided-reading/series/moonwood-tales/book-12/page-002.webp",
    output: "dewdrop-master.webp",
    crop: { left: 90, top: 330, width: 380, height: 570 },
    width: 688,
    height: 912
  }),
  buildMoonwoodCastSheet()
]);

console.log("Built guided-reading character reference assets.");
