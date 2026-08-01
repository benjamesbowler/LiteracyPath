#!/usr/bin/env python3
"""Generate one lossless speech file directly from Kokoro phoneme tokens."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import soundfile as sf
from kokoro import KModel, KPipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phonemes", help="Kokoro/IPA phoneme token string")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--voice", default="af_heart")
    parser.add_argument("--speed", default=1.0, type=float)
    parser.add_argument("--manifest", type=Path, help="JSON array of batch synthesis jobs")
    return parser.parse_args()


def normalized_phone_map(phonemes: str) -> tuple[str, list[int]]:
    ignored = {"ˈ", "ˌ", "ː", " "}
    normalized: list[str] = []
    original_indices: list[int] = []
    for index, character in enumerate(phonemes):
        if character in ignored:
            continue
        normalized.append(character)
        original_indices.append(index)
    return "".join(normalized), original_indices


def crop_to_target(
    audio,
    durations: list[int],
    phonemes: str,
    target: str,
):
    normalized_source, source_indices = normalized_phone_map(phonemes)
    normalized_target, _ = normalized_phone_map(target)
    target_start = normalized_source.find(normalized_target)
    if target_start < 0:
        raise RuntimeError(
            f"Target /{target}/ was not found in anchor phonemes /{phonemes}/"
        )
    original_start = source_indices[target_start]
    original_end = source_indices[target_start + len(normalized_target) - 1] + 1
    while original_end < len(phonemes) and phonemes[original_end] == "ː":
        original_end += 1

    samples_per_frame = 600
    start = max(0, int(sum(durations[: original_start + 1]) * samples_per_frame))
    end = min(audio.numel(), int(sum(durations[: original_end + 1]) * samples_per_frame))
    if end <= start:
        raise RuntimeError(f"Invalid target timing for /{target}/ in /{phonemes}/")
    return audio[start:end], (original_start, original_end)


def main() -> None:
    args = parse_args()
    if args.manifest:
        jobs = json.loads(args.manifest.read_text(encoding="utf-8"))
    elif args.phonemes and args.output:
        jobs = [
            {
                "phonemes": args.phonemes,
                "output": str(args.output),
                "voice": args.voice,
                "speed": args.speed,
            }
        ]
    else:
        raise SystemExit("Provide --manifest or both --phonemes and --output")

    model = KModel(repo_id="hexgrad/Kokoro-82M").eval()
    pipeline = KPipeline(
        lang_code="a",
        repo_id="hexgrad/Kokoro-82M",
        model=model,
        device="cpu",
    )
    for job in jobs:
        output = Path(job["output"])
        output.parent.mkdir(parents=True, exist_ok=True)
        if job.get("anchor"):
            result = next(
                pipeline(
                    job["anchor"],
                    voice=job.get("voice", "af_heart"),
                    speed=float(job.get("speed", 1.0)),
                    split_pattern=None,
                    model=model,
                )
            )
        else:
            result = next(
                pipeline.generate_from_tokens(
                    job["phonemes"],
                    voice=job.get("voice", "af_heart"),
                    speed=float(job.get("speed", 1.0)),
                    model=model,
                )
            )
        if result.audio is None or result.audio.numel() == 0:
            raise RuntimeError(f"Kokoro produced no audio for {job['phonemes']!r}")
        audio = result.audio
        durations = result.pred_dur.tolist() if result.pred_dur is not None else []
        selected = None
        if job.get("anchor") and job.get("targetPhonemes") and len(durations) >= 3:
            if job.get("anchorOutput"):
                anchor_output = Path(job["anchorOutput"])
                anchor_output.parent.mkdir(parents=True, exist_ok=True)
                sf.write(anchor_output, audio.numpy(), 24_000, subtype="FLOAT")
            audio, selected = crop_to_target(
                audio,
                durations,
                result.phonemes,
                job["targetPhonemes"],
            )
        elif job.get("cropBoundaryFrames", True) and len(durations) >= 3:
            samples_per_frame = 600
            start = max(0, int(durations[0] * samples_per_frame))
            end = min(audio.numel(), int(sum(durations[:-1]) * samples_per_frame))
            if end > start:
                audio = audio[start:end]
        sf.write(output, audio.numpy(), 24_000, subtype="FLOAT")
        print(
            f"phonemes={result.phonemes!r} target={job.get('targetPhonemes')!r} "
            f"selected={selected} voice={job.get('voice', 'af_heart')} "
            f"durations={durations} samples={audio.numel()} output={output}"
        )


if __name__ == "__main__":
    main()
