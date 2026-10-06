"""Bounded derivatives of retained original empty-space illustrations.

No characters, words, lane geometry or HUD is baked into these backgrounds.
Run only under the explicit CPU encoding window; imports perform no I/O.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compile_world(root, world):
    from PIL import Image
    source_dir = root / "source-art/arcade/rocket-run/space-venues"
    authority = json.loads((source_dir / "source-manifest.json").read_text())
    source = source_dir / (world + "-distant-sky-v1.png")
    # Check the retained manifest packet rather than accepting a same-name PNG.
    rows = authority.get("worlds", authority.get("assets", []))
    if isinstance(rows, dict):
        rows = list(rows.values())
    matches = [row for row in rows if row.get("world") == world or row.get("source", "").endswith(source.name)]
    if len(matches) != 1 or matches[0].get("sourceSha256") != digest(source):
        raise ValueError("The retained original sky/provenance hash is required")
    with Image.open(source) as image:
        original = image.convert("RGB")
    out = root / "public/game-assets/rocket-run/space-venues"
    out.mkdir(parents=True, exist_ok=True)
    result = {}
    for key, width, quality in [("primary", 1280, 85), ("independent", 720, 84), ("embedded", 320, 83)]:
        height = round(original.height * width / original.width)
        view = original.resize((width, height), Image.Resampling.LANCZOS)
        path = out / (world + "-distant-sky-" + key + "-v1.webp")
        view.save(path, "WEBP", quality=quality, method=4)
        with Image.open(path) as decoded:
            if decoded.size != view.size or decoded.mode not in ["RGB", "RGBA"]:
                raise ValueError("Actual decoded sky derivative dimensions changed")
        url = "/" + str(path.relative_to(root / "public"))
        result[key] = {"runtime": url, "width": width, "height": height, "runtimeSha256": digest(path),
                       "runtimeBytes": path.stat().st_size, "decodedBaseBytes": width * height * 4,
                       "source": str(source.relative_to(root)), "sourceSha256": digest(source), "sourceSize": list(original.size),
                       "resized": True, "resize": "Whole empty background retained; Lanczos; no crop or gameplay content",
                       "encoding": "WebP lossy original background only; source PNG retained"}
        if key == "embedded":
            payload = base64.b64encode(path.read_bytes()).decode("ascii")
            inline_runtime = "data:image/webp;base64," + payload
            result[key].update({"fileRuntime": url, "runtime": inline_runtime,
                                "inlineBytes": len(inline_runtime.encode("ascii")), "deliveryPolicy": "Network-independent actual retained sky derivative"})
    result.update({"world": world, "status": "ENCODED retained empty scenery; native composition unverified",
                   "creator": "LiteracyGuide original illustrated space settings", "containsGameplay": False,
                   "nativeReview": "UNKNOWN"})
    (source_dir / (world + "-delivery-v1.json")).write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"world": world, "runtimeBytes": sum(result[key]["runtimeBytes"] for key in ["primary", "independent", "embedded"]),
                      "decodedBaseBytes": sum(result[key]["decodedBaseBytes"] for key in ["primary", "independent", "embedded"])}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--world", choices=["meadow", "dino", "moonwood"], required=True)
    args = parser.parse_args()
    compile_world(args.root.resolve(), args.world)


if __name__ == "__main__":
    main()
