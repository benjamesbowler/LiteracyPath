"""Derive the finite three-cast jump-row candidate from delivered RGBA.

The accepted Chompy pilot is retained byte-for-byte. Bouncy/Pip are lossless
crops of their current registered sheets, never new poses or source renders.
This authoring command does not select the candidate in normal gameplay.
"""
import hashlib
import json
import pathlib
import time

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = ROOT / ".artifacts/arcade-standard-upgrade/sharp-jump-rows-v31"
WORLDS = {"meadow": "bouncy", "dino": "chompy", "moonwood": "pip"}


def sha(value):
    return hashlib.sha256(value).hexdigest()


def read(path):
    return json.loads(path.read_text())


def entry(metadata, raw):
    return {
        "view": raw["view"], "runtime": raw["runtime"],
        "runtimeBytes": raw["runtimeBytes"], "runtimeSha256": raw["runtimeSha256"],
        "metadata": "/" + str(metadata.relative_to(ROOT / "public")),
        "metadataBytes": metadata.stat().st_size, "metadataSha256": sha(metadata.read_bytes()),
        "decodedBytes": raw["decodedBytes"], "decodedCropSha256": raw["decodedCropSha256"],
    }


def main():
    started = time.monotonic()
    freeze = read(ROOT / ".artifacts/arcade-standard-upgrade/sharp-action-row-pilot-v30/native-freeze.json")
    assert all(sha((ROOT / row["path"]).read_bytes()) == row["sha256"] for row in freeze["source"]), "V30 inputs changed before derivation"
    recipe_hash = sha(pathlib.Path(__file__).read_bytes())
    worlds, receipts = {}, []
    for world, character in WORLDS.items():
        rows = []
        model_hash = sha((ROOT / f"public/game-assets/spell-skate/models/{character}-skater-v2.glb").read_bytes())
        for view in range(8):
            begin = time.monotonic()
            full_meta = ROOT / f"public/game-assets/spell-skate/recovery384/{character}/view-{view}-v2.json"
            full_bytes = full_meta.read_bytes()
            full = json.loads(full_bytes)
            assert full["kind"] == "skater" and full["world"] == world and full["view"] == view
            assert full["modelSha256"] == model_hash and full["format"] == "skater-384-tight-v2"
            full_image = ROOT / ("public" + full["runtime"])
            assert sha(full_image.read_bytes()) == full["runtimeSha256"]
            frames = [frame for frame in full["frames"] if frame["state"] == "jump"]
            assert [frame["phase"] for frame in frames] == [0, .25, .5, .75]
            assert all(frame["cell"] == [index * 384, 1920, 384, 384] for index, frame in enumerate(frames))
            with Image.open(full_image) as image:
                assert image.size == (1536, 3840)
                crop = image.convert("RGBA").crop((0, 1920, 1536, 2304))
            pixels = crop.tobytes()
            public_dir = ROOT / f"public/game-assets/spell-skate/recovery384-action-pilot/{character}/jump"
            source_dir = ROOT / f"source-art/arcade/spell-skate-3d/action-row-pilot/{character}/jump"
            runtime = public_dir / f"view-{view}-v1.webp"
            metadata = public_dir / f"view-{view}-v1.json"
            source = source_dir / f"view-{view}-v1.png"
            encode_seconds = 0
            if world == "dino":
                # Retain the accepted pilot bytes and their original recipe.
                raw = read(metadata)
                assert raw["runtimeSha256"] == sha(runtime.read_bytes())
                assert raw["lineage"]["fullMetadataSha256"] == sha(full_bytes)
                assert raw["lineage"]["fullRuntimeSha256"] == full["runtimeSha256"]
                assert raw["modelSha256"] == model_hash
            else:
                public_dir.mkdir(parents=True, exist_ok=True)
                source_dir.mkdir(parents=True, exist_ok=True)
                crop.save(source)
                encode_begin = time.monotonic()
                crop.save(runtime, "WEBP", lossless=True, exact=True, method=6)
                encode_seconds = time.monotonic() - encode_begin
                adjusted = []
                for frame in frames:
                    adjusted.append({**frame, "fullCell": frame["cell"], "cell": [frame["cell"][0], 0, 384, 384]})
                retained_source = ROOT / f"source-art/arcade/spell-skate-3d/recovery384/{character}/view-{view}/view-{view}-sheet-v2.png"
                raw = {
                    "format": "skater-384-jump-row-pilot-v1", "kind": "skater", "world": world,
                    "character": character, "view": view, "states": ["jump"], "phases": [0, .25, .5, .75],
                    "cell": [384, 384], "viewSheet": [1536, 384], "decodedBytes": 1536 * 384 * 4,
                    "pixelsPerUnit": full["pixelsPerUnit"], "shadowPixelsPerUnit": 256 / full["framing"]["originalOrthoScale"],
                    "modelSha256": model_hash, "frames": adjusted,
                    "runtime": "/" + str(runtime.relative_to(ROOT / "public")), "runtimeBytes": runtime.stat().st_size,
                    "runtimeSha256": sha(runtime.read_bytes()), "source": str(source.relative_to(ROOT)),
                    "sourceSha256": sha(source.read_bytes()), "decodedCropSha256": sha(pixels), "recipeSha256": recipe_hash,
                    "lineage": {"basis": "decoded-current-runtime-RGBA", "fullMetadata": "/" + str(full_meta.relative_to(ROOT / "public")),
                                "fullMetadataSha256": sha(full_bytes), "fullRuntime": full["runtime"], "fullRuntimeSha256": full["runtimeSha256"],
                                "originalSourcePng": str(retained_source.relative_to(ROOT)), "originalSourcePngSha256": sha(retained_source.read_bytes()),
                                "crop": [0, 1920, 1536, 384], "changedChannels": 0},
                }
                metadata.write_text(json.dumps(raw, indent=2) + "\n")
            decode_begin = time.monotonic()
            with Image.open(runtime) as image:
                assert image.size == (1536, 384)
                delivered = image.convert("RGBA").tobytes()
            assert delivered == pixels, f"{world}/{view} changed a decoded RGBA channel"
            assert sha(delivered) == raw["decodedCropSha256"]
            rows.append(entry(metadata, raw))
            receipts.append({"world": world, "view": view, "reusedAcceptedChompy": world == "dino",
                             "changedChannels": 0, "encodeSeconds": encode_seconds,
                             "pillowDecodeSeconds": time.monotonic() - decode_begin, "elapsedSeconds": time.monotonic() - begin})
            crop.close()
            print(json.dumps(receipts[-1]), flush=True)
        worlds[world] = {"character": character, "rows": rows,
                         "maximumEncodedBytes": sum(row["runtimeBytes"] for row in rows),
                         "maximumMetadataEncodedBytes": sum(row["metadataBytes"] for row in rows)}
    unchanged = all(sha((ROOT / row["path"]).read_bytes()) == row["sha256"] for row in freeze["source"])
    assert unchanged, "Existing V30 source/art changed during derivation"
    registry_path = ROOT / "src/components/learn/games/games/sportsJumpRowRegistry.js"
    registry_path.write_text("// Generated from exact current384 decoded RGBA; candidate only until native admission.\n"
                             "// Regenerate with artwork/games/spell-skate/derive_jump_rows.py.\n"
                             "const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};\n"
                             "export const SPORTS_JUMP_ROWS=freeze(" + json.dumps(worlds, indent=2) + ");\n")
    report = {"scope": "Finite24 three-cast jump rows; default normal registry unchanged. Source pixel identity is not browser motion/pacing proof.",
              "worlds": worlds, "receipts": receipts, "maximumRowPairRgbaBytes": 2 * 1536 * 384 * 4,
              "maximumMixedFullPairRgbaBytes": 2 * 1536 * 3840 * 4,
              "old211SourceUnchanged": unchanged, "recipeSha256": recipe_hash,
              "complete": True, "nativeAccepted": False, "elapsedSeconds": time.monotonic() - started}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "source-receipt.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"complete": True, "elapsedSeconds": report["elapsedSeconds"],
                      "worldBytes": {world: {key: data[key] for key in ("maximumEncodedBytes", "maximumMetadataEncodedBytes")} for world, data in worlds.items()}}), flush=True)


if __name__ == "__main__":
    main()
