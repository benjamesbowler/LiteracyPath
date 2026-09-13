#!/usr/bin/env python3
"""Independently transcribe Missing Sandwich audio with a local cached model.

Example setup: python -m pip install --no-cache-dir faster-whisper==1.2.1
The model path must already exist. This checker disables network model access,
uses no reference transcript as a recognition prompt, and never marks a raw
recognition difference as a confirmed synthesis defect or a listening pass.
"""

import argparse
from datetime import datetime, timezone
import difflib
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import re

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "public/audio/production/en-US/meadow_science/missing-sandwich/manifest.json"


def words(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower().replace("’", "'"))


def differences(expected, heard):
    a, b = words(expected), words(heard)
    return [{"kind": kind, "expected": " ".join(a[i:j]), "recognized": " ".join(b[k:l])}
            for kind, i, j, k, l in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
            if kind != "equal"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--only", help="Comma-separated target IDs such as page-04,word-pancreas")
    parser.add_argument("--skip-words", action="store_true")
    args = parser.parse_args()
    if not (args.model / "model.bin").is_file():
        raise SystemExit("The explicitly supplied offline model path is unavailable.")
    manifest = json.loads(MANIFEST.read_text())
    jobs = [{"id": f"page-{p['pageNumber']:02}", **p} for p in manifest["pages"]]
    jobs.append({"id": "cover", **manifest["title"]})
    if not args.skip_words:
        jobs += [{"id": "word-" + key, **row} for key, row in manifest["words"].items()]
    if args.only:
        selected = set(args.only.split(","))
        jobs = [job for job in jobs if job["id"] in selected]
        assert jobs, "No selected verification targets."
    model = WhisperModel(str(args.model), device="cpu", compute_type="int8", cpu_threads=4, local_files_only=True)
    report = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "bookId": manifest["bookId"], "model": "Systran/faster-whisper-tiny.en",
        "modelSnapshot": args.model.name,
        "modelFileSha256": hashlib.sha256((args.model / "model.bin").read_bytes()).hexdigest(),
        "engine": "faster-whisper", "version": importlib.metadata.version("faster-whisper"),
        "offline": True, "referencePrompt": None, "beamSize": 5, "temperature": 0,
        "limitation": "Automated transcription is an independent screening aid. Differences can be recognition errors, especially for names, isolated words and vocal sound effects. This is not direct listening or human approval.",
        "results": [],
    }
    for job in jobs:
        path = ROOT / "public" / job["audioPath"].lstrip("/")
        actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        assert actual_hash == job["audioSha256"], f"Changed audio: {job['id']}"
        segments, info = model.transcribe(str(path), language="en", beam_size=5, temperature=0,
                                         condition_on_previous_text=False, word_timestamps=True,
                                         vad_filter=False)
        segments = list(segments)
        transcript = " ".join(s.text.strip() for s in segments).strip()
        expected = job.get("displayedText", job.get("text", ""))
        diff = differences(expected, transcript)
        row = {"id": job["id"], "audioPath": job["audioPath"], "audioSha256": actual_hash,
               "expected": expected, "recognized": transcript, "durationSeconds": info.duration,
               "matchesAfterCaseAndPunctuationNormalization": not diff, "rawDifferences": diff,
               "segments": [{"start": s.start, "end": s.end, "text": s.text,
                             "words": [{"start": w.start, "end": w.end, "word": w.word, "probability": w.probability} for w in (s.words or [])]}
                            for s in segments]}
        report["results"].append(row)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps({"id": job["id"], "recognized": transcript, "rawDifferences": diff}, ensure_ascii=False), flush=True)
    report["summary"] = {"filesTranscribed": len(jobs), "exactNormalizedMatches": sum(not r["rawDifferences"] for r in report["results"]),
                         "filesWithRecognitionDifferences": sum(bool(r["rawDifferences"]) for r in report["results"])}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report["summary"]), flush=True)


if __name__ == "__main__":
    main()
