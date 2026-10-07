import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const navigation = ["map", "books", "story", "arcade", "letters", "words", "sounds", "hollow"];
await fs.mkdir(path.join(root, "public/images/navigation/ui"), { recursive: true });
await fs.mkdir(path.join(root, "public/images/brand"), { recursive: true });
for (const name of navigation) {
  await sharp(path.join(root, `public/images/navigation/${name}-icon.webp`))
    .resize({ width: 384, height: 384, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 })
    .toFile(path.join(root, `public/images/navigation/ui/${name}-icon.webp`));
}
for (const [name, width] of [["logo", 768], ["logomark", 192]]) {
  await sharp(path.join(root, `src/assets/${name}.png`))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(root, `src/assets/${name}.webp`));
}
// A padded delivery rendition of the existing owned logo; no invented art.
await sharp(path.join(root, "src/assets/logo.png"))
  .resize(1200, 630, { fit: "contain", background: "#ffffff" })
  .flatten({ background: "#ffffff" })
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "public/images/brand/literacy-guide-share.png"));
console.log("Built 8 navigation, 2 brand and 1 sharing renditions from retained source artwork.");
