#!/usr/bin/env python3
"""Sound Seekers v3 cast cut-outs.

Two modes:

  bank   — cut a flat-background character line-up (the Meadow Pals production
           bank) into one transparent WebP per character, left→right.
             python3 cut_cast.py bank BANK.png OUT_DIR --names tiny,brave,...
  covers — cut the main character out of book covers with rembg (u2net), keep
           the largest connected component, and write one WebP per cover.
             python3 cut_cast.py covers COVER_DIR OUT_DIR

Every output is trimmed, padded 4%, and scaled so its height is 512 px.
A contact sheet `_sheet.jpg` is written beside the outputs for visual review —
always look at it (feedback_visual_self_review).
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

TARGET_H = 512


def flood_alpha(img, tol=28):
    """Flood-fill the flat background from the four corners to alpha 0."""
    rgba = np.array(img.convert("RGBA"))
    h, w = rgba.shape[:2]
    rgb = rgba[:, :, :3].astype(np.int16)
    corners = [rgb[0, 0], rgb[0, w - 1], rgb[h - 1, 0], rgb[h - 1, w - 1]]
    bg = np.median(np.stack(corners), axis=0)
    dist = np.abs(rgb - bg).sum(axis=2)
    is_bg = dist <= tol
    seen = np.zeros((h, w), dtype=bool)
    q = deque()
    for (y, x) in [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1), (0, w // 2), (h - 1, w // 2), (h // 2, 0), (h // 2, w - 1)]:
        if is_bg[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and is_bg[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    rgba[:, :, 3] = np.where(seen, 0, rgba[:, :, 3])
    # soften the edge: pixels adjacent to background that are close in colour get partial alpha
    return Image.fromarray(rgba, "RGBA")


def components(alpha, min_area):
    """Connected components of alpha>0 (4-neighbour). Returns list of (area, bbox)."""
    h, w = alpha.shape
    mask = alpha > 8
    label = np.zeros((h, w), dtype=np.int32)
    comps = []
    cur = 0
    for y in range(h):
        for x in range(w):
            if mask[y, x] and label[y, x] == 0:
                cur += 1
                q = deque([(y, x)])
                label[y, x] = cur
                area = 0
                x0, y0, x1, y1 = x, y, x, y
                while q:
                    cy, cx = q.popleft()
                    area += 1
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and label[ny, nx] == 0:
                            label[ny, nx] = cur
                            q.append((ny, nx))
                if area >= min_area:
                    comps.append((area, (x0, y0, x1 + 1, y1 + 1), cur))
    return comps, label


def finish(img):
    bbox = img.getbbox()
    if not bbox:
        return None
    img = img.crop(bbox)
    pad = int(max(img.size) * 0.04)
    canvas = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    canvas.paste(img, (pad, pad), img)
    scale = TARGET_H / canvas.height
    return canvas.resize((max(1, round(canvas.width * scale)), TARGET_H), Image.LANCZOS)


def sheet(items, out_path):
    if not items:
        return
    cell = 260
    cols = min(8, len(items))
    rows = (len(items) + cols - 1) // cols
    s = Image.new("RGB", (cols * cell, rows * (cell + 28)), (245, 240, 228))
    from PIL import ImageDraw
    d = ImageDraw.Draw(s)
    for i, (name, im) in enumerate(items):
        t = im.copy()
        t.thumbnail((cell - 20, cell - 20))
        x = (i % cols) * cell + (cell - t.width) // 2
        y = (i // cols) * (cell + 28) + (cell - t.height) // 2
        s.paste(t, (x, y), t)
        d.text(((i % cols) * cell + 8, (i // cols) * (cell + 28) + cell + 4), name, fill=(40, 40, 40))
    s.save(out_path, quality=85)


def mode_bank(bank_path, out_dir, names, crop=None):
    os.makedirs(out_dir, exist_ok=True)
    src = Image.open(bank_path)
    if crop:
        src = src.crop(crop)  # (left, top, right, bottom) — the character band only
    img = flood_alpha(src)
    # crop off the header band (dark title bar) and the label band: keep the middle
    alpha = np.array(img)[:, :, 3]
    comps, label = components(alpha, min_area=4000)
    keep = sorted(comps, key=lambda c: c[1][0])
    # merge components whose x-ranges overlap heavily (e.g. a tail separated from a body)
    merged = []
    for c in keep:
        if merged and c[1][0] < merged[-1][1][2] - 10:
            a, (x0, y0, x1, y1), ids = merged[-1]
            merged[-1] = (a + c[0], (min(x0, c[1][0]), min(y0, c[1][1]), max(x1, c[1][2]), max(y1, c[1][3])), ids + [c[2]])
        else:
            merged.append((c[0], c[1], [c[2]]))
    print(f"{len(merged)} characters found in bank; {len(names)} names given")
    arr = np.array(img)
    items = []
    for i, (area, (x0, y0, x1, y1), ids) in enumerate(merged):
        name = names[i] if i < len(names) else f"char{i:02d}"
        sub = arr[y0:y1, x0:x1].copy()
        sublab = label[y0:y1, x0:x1]
        sub[:, :, 3] = np.where(np.isin(sublab, ids), sub[:, :, 3], 0)
        im = finish(Image.fromarray(sub, "RGBA"))
        im.save(os.path.join(out_dir, f"{name}.webp"), quality=92, method=6)
        items.append((name, im))
        print(f"  {name}: {im.size}")
    sheet(items, os.path.join(out_dir, "_sheet.jpg"))


def mode_covers(cover_dir, out_dir):
    from rembg import new_session, remove
    os.makedirs(out_dir, exist_ok=True)
    session = new_session("u2net")
    items = []
    for fn in sorted(os.listdir(cover_dir)):
        if not fn.lower().endswith((".webp", ".png", ".jpg")):
            continue
        src = Image.open(os.path.join(cover_dir, fn)).convert("RGBA")
        cut = remove(src, session=session, alpha_matting=False)
        alpha = np.array(cut)[:, :, 3]
        comps, label = components(alpha, min_area=3000)
        if not comps:
            print(f"  {fn}: nothing found")
            continue
        comps.sort(key=lambda c: -c[0])
        arr = np.array(cut)
        for rank, (area, (x0, y0, x1, y1), cid) in enumerate(comps[:3]):
            sub = arr[y0:y1, x0:x1].copy()
            sub[:, :, 3] = np.where(label[y0:y1, x0:x1] == cid, sub[:, :, 3], 0)
            im = finish(Image.fromarray(sub, "RGBA"))
            if im is None:
                continue
            name = f"{os.path.splitext(fn)[0]}-{rank}"
            im.save(os.path.join(out_dir, f"{name}.webp"), quality=92, method=6)
            items.append((name, im))
            print(f"  {name}: area {area} size {im.size}")
    sheet(items, os.path.join(out_dir, "_sheet.jpg"))


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "bank":
        names = []
        crop = None
        if "--names" in sys.argv:
            names = sys.argv[sys.argv.index("--names") + 1].split(",")
        if "--crop" in sys.argv:
            crop = tuple(int(v) for v in sys.argv[sys.argv.index("--crop") + 1].split(","))
        mode_bank(sys.argv[2], sys.argv[3], names, crop)
    elif mode == "covers":
        mode_covers(sys.argv[2], sys.argv[3])
    else:
        raise SystemExit(__doc__)
