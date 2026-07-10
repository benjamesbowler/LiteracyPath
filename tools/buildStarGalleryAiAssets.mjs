import { mkdirSync } from "node:fs";
import sharp from "sharp";

const [
  meadowSource,
  dinoSource,
  moonwoodSource,
  guideSheetSource,
  meadowGuideSource,
  dinoGuideSource,
  moonwoodGuideSource
] = process.argv.slice(2);

if (!meadowSource || !dinoSource || !moonwoodSource || !guideSheetSource) {
  console.error("Usage: node tools/buildStarGalleryAiAssets.mjs <meadow.png> <dino.png> <moonwood.png> <guide-sheet.png>");
  process.exit(1);
}

const OUT_DIR = "public/images/learn-games/ps1-arcade";
const ART_DIR = "public/images/learn-games/art";

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(ART_DIR, { recursive: true });

async function writeScene(source, target) {
  await sharp(source)
    .resize(1280, 720, { fit: "cover", position: "center" })
    .modulate({ saturation: 1.04, brightness: 0.96 })
    .sharpen({ sigma: 0.45, m1: 0.8, m2: 0.35 })
    .webp({ quality: 82, effort: 5 })
    .toFile(target);
}

async function keyMagenta(source) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += info.channels) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const magentaDistance = Math.abs(r - 255) + Math.abs(g) + Math.abs(b - 255);
    const isKey = magentaDistance < 120 || (r > 148 && b > 148 && g < 164 && r + b - g * 2 > 166);
    if (isKey) {
      data[index + 3] = 0;
    } else if (r > 150 && b > 145 && g < 145 && r + b - g * 2 > 190) {
      data[index + 3] = Math.min(data[index + 3], 150);
    }
  }

  const alphaBefore = new Uint8Array(info.width * info.height);
  for (let index = 0, pixel = 0; index < data.length; index += info.channels, pixel += 1) {
    alphaBefore[pixel] = data[index + 3];
  }

  for (let y = 1; y < info.height - 1; y += 1) {
    for (let x = 1; x < info.width - 1; x += 1) {
      const pixel = y * info.width + x;
      const index = pixel * info.channels;
      if (alphaBefore[pixel] === 0) continue;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const spill = r > 120 && b > 120 && g < 150 && r + b - g * 2 > 130;
      if (!spill) continue;
      let touchesKey = false;
      for (let oy = -2; oy <= 2 && !touchesKey; oy += 1) {
        for (let ox = -2; ox <= 2; ox += 1) {
          const nearX = x + ox;
          const nearY = y + oy;
          if (nearX < 0 || nearX >= info.width || nearY < 0 || nearY >= info.height) continue;
          if (alphaBefore[nearY * info.width + nearX] === 0) {
            touchesKey = true;
            break;
          }
        }
      }
      if (touchesKey) {
        data[index + 3] = 0;
      } else {
        data[index] = Math.min(r, 78);
        data[index + 1] = Math.min(Math.max(g, 22), 78);
        data[index + 2] = Math.min(b, 118);
        data[index + 3] = Math.min(data[index + 3], 190);
      }
    }
  }

  return { data, info };
}

function findBounds(data, info, region) {
  let left = region.left + region.width;
  let right = region.left;
  let top = info.height;
  let bottom = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = region.left; x < region.left + region.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha > 16) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }

  const pad = Math.round(Math.min(info.width, info.height) * 0.025);
  return {
    left: Math.max(0, left - pad),
    top: Math.max(0, top - pad),
    width: Math.max(1, Math.min(info.width - Math.max(0, left - pad), right - left + pad * 2)),
    height: Math.max(1, Math.min(info.height - Math.max(0, top - pad), bottom - top + pad * 2))
  };
}

async function writeGuideSprites(source) {
  const keyed = await keyMagenta(source);
  const base = sharp(keyed.data, {
    raw: {
      width: keyed.info.width,
      height: keyed.info.height,
      channels: keyed.info.channels
    }
  });
  const third = Math.floor(keyed.info.width / 3);
  const regions = [
    { name: "meadow", left: 0, width: third + 28 },
    { name: "dino", left: third + 30, width: third - 8 },
    { name: "moonwood", left: third * 2 + 26, width: keyed.info.width - (third * 2 + 26) }
  ];

  for (const region of regions) {
    const bounds = findBounds(keyed.data, keyed.info, region);
    await base
      .clone()
      .extract(bounds)
      .resize(520, 520, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: 88, alphaQuality: 92, effort: 5 })
      .toFile(`${OUT_DIR}/star-gallery-guide-${region.name}-v2.webp`);
  }
}

async function writeSingleGuideSprite(source, name) {
  const keyed = await keyMagenta(source);
  const bounds = findBounds(keyed.data, keyed.info, { left: 0, width: keyed.info.width });
  await sharp(keyed.data, {
    raw: {
      width: keyed.info.width,
      height: keyed.info.height,
      channels: keyed.info.channels
    }
  })
    .extract(bounds)
    .resize(540, 540, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 88, alphaQuality: 94, effort: 5 })
    .toFile(`${OUT_DIR}/star-gallery-guide-${name}-v2.webp`);
}

async function writeIcon(source) {
  const starOverlay = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="42%" r="72%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="0.68" stop-color="#050714" stop-opacity=".04"/>
          <stop offset="1" stop-color="#050714" stop-opacity=".72"/>
        </radialGradient>
        <filter id="g" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>
      <rect width="512" height="512" rx="72" fill="url(#v)"/>
      <polygon points="256,54 302,188 444,188 329,271 374,408 256,324 138,408 183,271 68,188 210,188"
        fill="#ffdd58" stroke="#fff5b8" stroke-width="17" stroke-linejoin="round"/>
      <polygon points="256,89 288,204 403,202 310,267 344,374 256,308 168,374 202,267 109,202 224,204"
        fill="#ffb83e" opacity=".84"/>
      <circle cx="256" cy="256" r="158" fill="#73fff0" opacity=".18" filter="url(#g)"/>
    </svg>
  `);
  await sharp(source)
    .resize(512, 512, { fit: "cover", position: "center" })
    .composite([{ input: starOverlay, blend: "over" }])
    .webp({ quality: 86, effort: 5 })
    .toFile(`${ART_DIR}/star-gallery.webp`);
}

await writeScene(meadowSource, `${OUT_DIR}/star-gallery-meadow-bg-v2.webp`);
await writeScene(dinoSource, `${OUT_DIR}/star-gallery-dino-bg-v2.webp`);
await writeScene(moonwoodSource, `${OUT_DIR}/star-gallery-moonwood-bg-v2.webp`);
if (meadowGuideSource && dinoGuideSource && moonwoodGuideSource) {
  await writeSingleGuideSprite(meadowGuideSource, "meadow");
  await writeSingleGuideSprite(dinoGuideSource, "dino");
  await writeSingleGuideSprite(moonwoodGuideSource, "moonwood");
} else {
  await writeGuideSprites(guideSheetSource);
}
await writeIcon(moonwoodSource);

console.log("Built AI Star Gallery WebP assets.");
