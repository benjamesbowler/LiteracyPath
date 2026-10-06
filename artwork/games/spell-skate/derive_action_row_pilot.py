"""Finite Chompy jump-row pilot; preserve the currently delivered RGBA exactly.

This derives no poses and changes no source model, animation or registration.
The normal full-sheet registry is deliberately left untouched.
"""
import hashlib
import json
import pathlib
import time

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[3]
PUBLIC = ROOT / "public/game-assets/spell-skate/recovery384-action-pilot/chompy/jump"
SOURCE = ROOT / "source-art/arcade/spell-skate-3d/action-row-pilot/chompy/jump"
REPORT = ROOT / ".artifacts/arcade-standard-upgrade/sharp-action-row-pilot-v30/source-receipt.json"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    started = time.monotonic()
    normal_freeze = json.loads((ROOT / ".artifacts/arcade-standard-upgrade/sharp-bank-admission-v28/source-freeze.json").read_text())
    assert all(sha((ROOT / row["path"]).read_bytes()) == row["sha256"] for row in normal_freeze["source"])
    model = ROOT / "public/game-assets/spell-skate/models/chompy-skater-v2.glb"
    model_hash = sha(model.read_bytes())
    recipe_hash = sha(pathlib.Path(__file__).read_bytes())
    PUBLIC.mkdir(parents=True, exist_ok=True)
    SOURCE.mkdir(parents=True, exist_ok=True)
    rows = []
    for view in range(8):
        begin = time.monotonic()
        full_meta = ROOT / f"public/game-assets/spell-skate/recovery384/chompy/view-{view}-v2.json"
        full_bytes = full_meta.read_bytes()
        raw = json.loads(full_bytes)
        assert raw["kind"] == "skater" and raw["world"] == "dino" and raw["view"] == view
        assert raw["modelSha256"] == model_hash and raw["format"] == "skater-384-tight-v2"
        full_image = ROOT / ("public" + raw["runtime"])
        image_bytes = full_image.read_bytes()
        assert sha(image_bytes) == raw["runtimeSha256"]
        frames = [frame for frame in raw["frames"] if frame["state"] == "jump"]
        assert [frame["phase"] for frame in frames] == [0, .25, .5, .75]
        y = frames[0]["cell"][1]
        assert all(frame["cell"] == [index * 384, y, 384, 384] for index, frame in enumerate(frames))
        with Image.open(full_image) as full:
            assert full.size == (1536, 3840)
            original_crop = full.convert("RGBA").crop((0, y, 1536, y + 384))
        pixel_bytes = original_crop.tobytes()
        runtime = PUBLIC / f"view-{view}-v1.webp"
        source = SOURCE / f"view-{view}-v1.png"
        original_crop.save(source)
        # exact=True retains RGB below zero alpha too. Fidelity is checked on
        # the complete decoded RGBA, not just opaque visible pixels.
        encode_begin = time.monotonic()
        original_crop.save(runtime, "WEBP", lossless=True, exact=True, method=6)
        encode_seconds = time.monotonic() - encode_begin
        decode_begin = time.monotonic()
        with Image.open(runtime) as delivery:
            assert delivery.size == (1536, 384)
            delivery_bytes = delivery.convert("RGBA").tobytes()
        decode_seconds = time.monotonic() - decode_begin
        assert delivery_bytes == pixel_bytes, "Lossless row changed the current delivered RGBA"
        adjusted = []
        for frame in frames:
            current = dict(frame)
            current["fullCell"] = frame["cell"]
            current["cell"] = [frame["cell"][0], 0, 384, 384]
            adjusted.append(current)
        retained_source = ROOT / f"source-art/arcade/spell-skate-3d/recovery384/chompy/view-{view}/view-{view}-sheet-v2.png"
        row = {
            "format": "skater-384-jump-row-pilot-v1", "kind": "skater", "world": "dino", "character": "chompy", "view": view,
            "states": ["jump"], "phases": [0, .25, .5, .75], "cell": [384, 384], "viewSheet": [1536, 384],
            "decodedBytes": 1536 * 384 * 4, "pixelsPerUnit": raw["pixelsPerUnit"], "shadowPixelsPerUnit": 256 / raw["framing"]["originalOrthoScale"],
            "modelSha256": model_hash, "frames": adjusted,
            "runtime": "/" + str(runtime.relative_to(ROOT / "public")), "runtimeBytes": runtime.stat().st_size, "runtimeSha256": sha(runtime.read_bytes()),
            "source": str(source.relative_to(ROOT)), "sourceSha256": sha(source.read_bytes()),
            "decodedCropSha256": sha(pixel_bytes), "recipeSha256": recipe_hash,
            "lineage": {"basis": "decoded-current-runtime-RGBA", "fullMetadata": "/" + str(full_meta.relative_to(ROOT / "public")),
                        "fullMetadataSha256": sha(full_bytes), "fullRuntime": raw["runtime"], "fullRuntimeSha256": raw["runtimeSha256"],
                        "originalSourcePng": str(retained_source.relative_to(ROOT)), "originalSourcePngSha256": sha(retained_source.read_bytes()),
                        "crop": [0, y, 1536, 384], "changedChannels": 0},
        }
        metadata = PUBLIC / f"view-{view}-v1.json"
        metadata.write_text(json.dumps(row, indent=2) + "\n")
        rows.append({"view": view, "runtime": row["runtime"], "runtimeBytes": row["runtimeBytes"], "runtimeSha256": row["runtimeSha256"],
                     "metadata": "/" + str(metadata.relative_to(ROOT / "public")), "metadataBytes": metadata.stat().st_size, "metadataSha256": sha(metadata.read_bytes()),
                     "decodedBytes": row["decodedBytes"], "decodedCropSha256": row["decodedCropSha256"], "lineage": row["lineage"],
                     "encodeSeconds": encode_seconds, "pillowDecodeSeconds": decode_seconds, "elapsedSeconds": time.monotonic() - begin})
        original_crop.close()
        print(json.dumps({"view": view, "runtimeBytes": row["runtimeBytes"], "changedChannels": 0, "elapsedSeconds": rows[-1]["elapsedSeconds"]}), flush=True)
    unchanged = all(sha((ROOT / row["path"]).read_bytes()) == row["sha256"] for row in normal_freeze["source"])
    assert unchanged
    report = {"scope": "Finite source-only eight-view Chompy jump pilot; normal selected bank unchanged. Pillow decode is not browser decode latency or game motion proof.",
              "rows": rows, "encodedEightRowCacheBytes": sum(row["runtimeBytes"] for row in rows),
              "metadataEightRowBytes": sum(row["metadataBytes"] for row in rows), "maximumRowPairRgbaBytes": 2 * 1536 * 384 * 4,
              "modelSha256": model_hash, "recipeSha256": recipe_hash, "normal182SourceUnchanged": unchanged,
              "nativeAccepted": False, "complete": True, "elapsedSeconds": time.monotonic() - started}
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: report[key] for key in ("complete", "elapsedSeconds", "encodedEightRowCacheBytes", "metadataEightRowBytes", "maximumRowPairRgbaBytes", "normal182SourceUnchanged")}), flush=True)


if __name__ == "__main__":
    main()
