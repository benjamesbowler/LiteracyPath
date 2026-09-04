#!/usr/bin/env python3
"""Sound Seekers v3 — cut an OVERLAPPING character line-up into sprites.

The generated line-ups (ChatGPT, Grok) ignore "clear gaps": tails and wings
overlap the neighbour. A plain flood-fill cut then merges neighbours. This
tool uses the book style itself to separate them: every flat colour patch is
enclosed by a bold ink outline, so

  1. foreground = flood-fill of the flat background from the corners,
  2. cells      = connected components of (foreground AND not ink),
  3. each cell is given to a character: cells under a character's core box
     seed that character, every other cell goes to the neighbouring character
     whose seeded colours it matches best (nearest-colour vote, tie → nearest
     core), and ink pixels follow the nearest cell,
  4. one trimmed, padded, 512-px-tall WebP per character + a contact sheet.

Usage:
  python3 cut_lineup.py LINEUP.jpg OUT_DIR --names a,b,c --cores x0-x1,x0-x1,...
    --cores  one horizontal core range per character (pixels), read off the
             image: the range that is ONLY that character (its head/body),
             never a neighbour's overlapping tail or wing.
    --ink 100   luminance below which a pixel counts as ink (default 100)
    --tol 60    background flood tolerance (default 60)
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cut_cast import finish, flood_alpha, sheet  # noqa: E402


def cut_lineup(path, out_dir, names, cores, ink_t=100, tol=60):
    os.makedirs(out_dir, exist_ok=True)
    src = Image.open(path).convert("RGB")
    rgba = np.array(flood_alpha(src, tol=tol))
    rgb = rgba[:, :, :3].astype(np.int16)
    fg = rgba[:, :, 3] > 8
    lum = rgb.mean(axis=2)
    ink = (lum < ink_t) & fg
    cells, ncell = ndi.label(fg & ~ink)
    h, w = fg.shape
    n = len(names)
    assert len(cores) == n, "one core range per name"

    # per-cell facts
    idx = np.arange(1, ncell + 1)
    areas = ndi.sum(np.ones_like(cells), cells, idx)
    cx = ndi.mean(np.tile(np.arange(w), (h, 1)), cells, idx)
    cy = ndi.mean(np.tile(np.arange(h)[:, None], (1, w)), cells, idx)
    means = np.stack([ndi.mean(rgb[:, :, c], cells, idx) for c in range(3)], axis=1)

    # 1. seeds: a cell whose pixels lie mostly inside one core range
    owner = np.full(ncell + 1, -1, dtype=int)
    xs = np.tile(np.arange(w), (h, 1))
    for k, (x0, x1) in enumerate(cores):
        inside = ndi.sum(((xs >= x0) & (xs <= x1)).astype(np.int32), cells, idx)
        frac = inside / np.maximum(areas, 1)
        for i in np.where(frac > 0.85)[0]:
            if owner[i + 1] == -1:
                owner[i + 1] = k
    # colour palettes of the seeded characters
    palettes = []
    for k in range(n):
        mine = [i + 1 for i in range(ncell) if owner[i + 1] == k and areas[i] > 30]
        palettes.append(means[[i - 1 for i in mine]] if mine else np.zeros((0, 3)))

    # 2. everything else: nearest palette colour among neighbouring characters
    centres = [(x0 + x1) / 2 for x0, x1 in cores]
    for i in range(ncell):
        if owner[i + 1] != -1:
            continue
        x = cx[i]
        cand = [k for k in range(n) if cores[k][0] - 260 <= x <= cores[k][1] + 260] or list(range(n))
        best = None
        for k in cand:
            pal = palettes[k]
            if len(pal) == 0:
                continue
            d = np.min(np.abs(pal - means[i]).sum(axis=1))
            d += 0.08 * abs(x - centres[k])  # tie-break towards the nearer core
            if best is None or d < best[0]:
                best = (d, k)
        owner[i + 1] = best[1] if best else min(cand, key=lambda k: abs(x - centres[k]))

    label = owner[cells]  # -1 where ink or background
    label[~fg] = -2
    # 3. ink pixels follow the nearest labelled non-ink pixel
    dist, (iy, ix) = ndi.distance_transform_edt(label == -1, return_indices=True)
    label = np.where(label == -1, label[iy, ix], label)

    items = []
    for k, name in enumerate(names):
        mask = label == k
        if not mask.any():
            print(f"  {name}: nothing found")
            continue
        ys, xs_ = np.where(mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs_.min(), xs_.max() + 1
        sub = rgba[y0:y1, x0:x1].copy()
        sub[:, :, 3] = np.where(mask[y0:y1, x0:x1], sub[:, :, 3], 0)
        # drop fragments that are not the body: anything detached from the
        # largest piece that is small or lies outside the character's core
        comp, nc = ndi.label(sub[:, :, 3] > 8)
        if nc > 1:
            ids = np.arange(1, nc + 1)
            sizes = ndi.sum(np.ones_like(comp), comp, ids)
            xmin = ndi.minimum(np.tile(np.arange(x1 - x0), (y1 - y0, 1)), comp, ids) + x0
            xmax = ndi.maximum(np.tile(np.arange(x1 - x0), (y1 - y0, 1)), comp, ids) + x0
            ymin = ndi.minimum(np.tile(np.arange(y1 - y0)[:, None], (1, x1 - x0)), comp, ids)
            ymax = ndi.maximum(np.tile(np.arange(y1 - y0)[:, None], (1, x1 - x0)), comp, ids)
            main = int(np.argmax(sizes))
            pad = 12
            touches = lambda j: (xmax[j] >= xmin[main] - pad and xmin[j] <= xmax[main] + pad
                                 and ymax[j] >= ymin[main] - pad and ymin[j] <= ymax[main] + pad)
            core0, core1 = cores[k]
            keep_ids = [j + 1 for j in range(nc)
                        if j == main
                        or sizes[j] > 0.2 * sizes.max()
                        or (sizes[j] > 0.01 * sizes.max() and xmax[j] >= core0 and xmin[j] <= core1 and touches(j))]
            sub[:, :, 3] = np.where(np.isin(comp, keep_ids), sub[:, :, 3], 0)
        im = finish(Image.fromarray(sub, "RGBA"))
        im.save(os.path.join(out_dir, f"{name}.webp"), quality=92, method=6)
        items.append((name, im))
        print(f"  {name}: {im.size}")
    sheet(items, os.path.join(out_dir, "_sheet.jpg"))


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 2:
        raise SystemExit(__doc__)
    names = args[args.index("--names") + 1].split(",")
    cores = [tuple(int(v) for v in r.split("-")) for r in args[args.index("--cores") + 1].split(",")]
    ink_t = int(args[args.index("--ink") + 1]) if "--ink" in args else 100
    tol = int(args[args.index("--tol") + 1]) if "--tol" in args else 60
    cut_lineup(args[0], args[1], names, cores, ink_t, tol)
