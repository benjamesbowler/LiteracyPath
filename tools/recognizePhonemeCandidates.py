#!/usr/bin/env python3
"""Independently transcribe pilot audio into phoneme tokens with Wav2Vec2."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
import espeakng_loader
from phonemizer.backend.espeak.wrapper import EspeakWrapper
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor


MODEL_ID = "facebook/wav2vec2-lv-60-espeak-cv-ft"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--summary", required=True, type=Path)
    parser.add_argument("--root", default=Path.cwd(), type=Path)
    return parser.parse_args()


def resample_linear(audio: np.ndarray, source_rate: int, target_rate: int = 16_000) -> np.ndarray:
    if source_rate == target_rate:
        return audio.astype(np.float32)
    source_positions = np.arange(audio.shape[0], dtype=np.float64)
    target_length = max(1, round(audio.shape[0] * target_rate / source_rate))
    target_positions = np.linspace(0, audio.shape[0] - 1, target_length)
    return np.interp(target_positions, source_positions, audio).astype(np.float32)


def normalize_tokens(value: str) -> str:
    return "".join(value.lower().split()).replace("ː", "").replace("ˈ", "").replace("ˌ", "")


def transcribe(audio_path: Path, processor, model) -> str:
    audio, sample_rate = sf.read(audio_path, dtype="float32", always_2d=False)
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    audio = resample_linear(audio, sample_rate)
    inputs = processor(audio, sampling_rate=16_000, return_tensors="pt")
    logits = model(inputs.input_values).logits
    prediction_ids = torch.argmax(logits, dim=-1)
    return processor.batch_decode(prediction_ids)[0].strip()


def main() -> None:
    args = parse_args()
    summary = json.loads(args.summary.read_text(encoding="utf-8"))
    EspeakWrapper.set_library(espeakng_loader.get_library_path())
    EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
    processor = Wav2Vec2Processor.from_pretrained(MODEL_ID, local_files_only=True)
    model = Wav2Vec2ForCTC.from_pretrained(MODEL_ID, local_files_only=True).eval()

    with torch.inference_mode():
        for result in summary["results"]:
            audio_path = args.root / result["processedPath"]
            heard = transcribe(audio_path, processor, model)
            anchor_heard = transcribe(args.root / result["anchorPath"], processor, model)
            expected = normalize_tokens(result["ipa"])
            recognized = normalize_tokens(heard)
            normalized_anchor = normalize_tokens(anchor_heard)
            result["independentRecognition"] = {
                "model": MODEL_ID,
                "heard": heard,
                "anchorHeard": anchor_heard,
                "normalizedExpected": expected,
                "normalizedHeard": recognized,
                "exactMatch": recognized == expected,
                "containsTarget": bool(expected and expected in recognized),
                "anchorContainsTarget": bool(expected and expected in normalized_anchor),
                "limitation": "Isolated-phone recognition is advisory; confirm the forced-aligned clip by ear.",
            }
            print(
                f"{result['takeId']} {result['voice']['id']}: "
                f"expected=/{result['ipa']}/ clip=/{heard or '∅'}/ "
                f"anchor=/{anchor_heard or '∅'}/"
            )

    summary["independentRecognizer"] = {
        "model": MODEL_ID,
        "license": "Apache-2.0",
        "role": "Automated rejection and ranking aid only; not production approval",
    }
    args.summary.write_text(f"{json.dumps(summary, indent=2, ensure_ascii=False)}\n", encoding="utf-8")


if __name__ == "__main__":
    main()
