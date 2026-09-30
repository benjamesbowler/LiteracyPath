#!/usr/bin/env python3
"""Screen Story Quest speech locally with an explicitly supplied cached model.

Uses faster-whisper 1.2.1; no reference-text prompt and no network access.
Recognition differences require investigation, not automatic content changes.
"""
import argparse
from datetime import datetime, timezone
import difflib
import hashlib
import importlib.metadata
import json
import os
import numpy as np
from pathlib import Path
import re

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

ROOT = Path(__file__).resolve().parents[1]


def words(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower().replace('’', "'"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--only', help='Optional comma-separated manifest keys')
    parser.add_argument('--differences-from', type=Path, help='Recheck only differences from a previous report')
    args = parser.parse_args()
    assert (args.model / 'model.bin').is_file(), 'Explicit offline model missing'
    manifest = json.loads((ROOT / 'src/content/storyQuestNarrationManifest.generated.json').read_text())
    jobs = manifest['clips']
    if args.differences_from:
        selected = {row['key'] for row in json.loads(args.differences_from.read_text())['results'] if row['rawDifferences']}
        jobs = [job for job in jobs if job['key'] in selected]
    if args.only:
        selected = set(args.only.split(','))
        jobs = [job for job in jobs if job['key'] in selected]
        assert jobs, 'No matching keys'
    model = WhisperModel(str(args.model), device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
    report = {
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'engine': 'faster-whisper', 'version': importlib.metadata.version('faster-whisper'),
        'modelSha256': hashlib.sha256((args.model / 'model.bin').read_bytes()).hexdigest(),
        'offline': True, 'referencePrompt': None,
        'recognitionPaddingSeconds': {'before': 0.25, 'after': 0.5},
        'limitation': 'Independent automated speech screening. Recognition differences, particularly names and isolated words, are not confirmed synthesis errors. This is not human listening.',
        'results': []
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    for index, job in enumerate(jobs):
        audio = ROOT / 'public' / job['audioPath'].lstrip('/')
        assert hashlib.sha256(audio.read_bytes()).hexdigest() == job['audioSha256'], job['key']
        waveform = decode_audio(str(audio), sampling_rate=16000)
        padded = np.pad(waveform, (4000, 8000))
        segments, info = model.transcribe(padded, language='en', beam_size=5, temperature=0,
                                         condition_on_previous_text=False, word_timestamps=True, vad_filter=False)
        segments = list(segments)
        transcript = ' '.join(s.text.strip() for s in segments).strip()
        expected, recognized = words(job['text']), words(transcript)
        differences = [{'kind': kind, 'expected': ' '.join(expected[a:b]), 'recognized': ' '.join(recognized[c:d])}
                       for kind, a, b, c, d in difflib.SequenceMatcher(None, expected, recognized, autojunk=False).get_opcodes()
                       if kind != 'equal']
        report['results'].append({
            'key': job['key'], 'audioPath': job['audioPath'], 'audioSha256': job['audioSha256'],
            'expected': job['text'], 'recognized': transcript, 'durationSeconds': len(waveform) / 16000,
            'rawDifferences': differences,
            'segments': [{'start': s.start, 'end': s.end, 'text': s.text,
                          'words': [{'start': w.start, 'end': w.end, 'word': w.word, 'probability': w.probability}
                                    for w in (s.words or [])]} for s in segments]
        })
        if (index + 1) % 25 == 0 or index + 1 == len(jobs):
            args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
            print(f"Screened {index + 1}/{len(jobs)} clips", flush=True)
    report['summary'] = {
        'filesTranscribed': len(jobs),
        'exactNormalizedMatches': sum(not r['rawDifferences'] for r in report['results']),
        'recognitionDifferencesToInvestigate': sum(bool(r['rawDifferences']) for r in report['results'])
    }
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report['summary']), flush=True)


if __name__ == '__main__':
    main()
