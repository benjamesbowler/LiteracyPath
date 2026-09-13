#!/usr/bin/env python3
"""Produce the exact Missing Sandwich page/word audio with the established cast.

Requires the existing gcloud application-default connection, Node, ffmpeg, and
numpy. Text comes from the current, dependency-free book source. Raw synthesis
stays in ignored task scratch until --clean-scratch is explicitly requested.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
import argparse
import base64
import hashlib
import io
import json
import re
import shutil
import subprocess
import time
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/data/meadowPalsScienceBooks.js"
OUT = ROOT / "public/audio/production/en-US/meadow_science/missing-sandwich"
PUBLIC = "/audio/production/en-US/meadow_science/missing-sandwich"
GENERATED = ROOT / "src/data/generated/meadowPalsScienceNarration.generated.js"
SCRATCH = ROOT / ".artifacts/digestive-system-storyboard/audio-work"
PROJECT = "project-3c66c1c8-cc9e-4d6d-bdf"
ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"
SR = 48000
BOOK_ID = "meadow-pals-science-01-missing-sandwich"
VOICE_SOURCE = (
    "../Little-Literacy-Animation/Meadow-Pals/Episodes/Bouncy-and-the-Squeak/"
    "Audio/audio-manifest.json"
)
VOICES = {
    "narrator": {
        "voice": "en-US-Chirp3-HD-Leda",
        "engine": "Google Cloud Text-to-Speech Chirp 3 HD",
        "languageCode": "en-US",
        "source": "src/data/ledaProductionVoice.js",
    },
    "MEADOW-MUDDY": {
        "voice": "Algieba",
        "engine": "gemini-2.5-pro-tts",
        "languageCode": "en-GB",
        "direction": "Warm smooth male British pig character, relaxed practical kindness, reassuring and thoughtful. No grunting. About125 words per minute.",
        "source": VOICE_SOURCE,
    },
    "MEADOW-SPLASHY": {
        "voice": "Laomedeia",
        "engine": "gemini-2.5-pro-tts",
        "languageCode": "en-GB",
        "direction": "Bright upbeat female British duck character, eager and helpful, clear sunny voice with lively but natural rhythm. No quacking. About135 words per minute.",
        "source": VOICE_SOURCE,
    },
}

# Each item names the actual speaker of successive quoted passages. Speech tags
# remain in Leda's narration and every word stays in its original position.
DIALOGUE = {
    1: ["MEADOW-MUDDY", "MEADOW-SPLASHY"],
    2: ["MEADOW-MUDDY"],
    3: ["MEADOW-MUDDY", "MEADOW-SPLASHY"],
    4: ["MEADOW-MUDDY", "MEADOW-SPLASHY", "MEADOW-SPLASHY"],
    5: ["MEADOW-MUDDY", "MEADOW-SPLASHY"],
    6: ["MEADOW-MUDDY"],
    7: ["MEADOW-MUDDY", "MEADOW-MUDDY"],
    8: ["MEADOW-MUDDY", "MEADOW-SPLASHY"],
    9: ["MEADOW-MUDDY"],
    10: ["MEADOW-MUDDY", "MEADOW-MUDDY"],
    11: ["MEADOW-MUDDY"],
    12: ["MEADOW-MUDDY", "MEADOW-SPLASHY", "MEADOW-SPLASHY"],
}
ACTING = {
    1: "Muddy is sincerely surprised about wasting a sandwich; Splashy is curious and inviting.",
    2: "Muddy is surprised and delighted that spit has a job; emphasize JOB gently without shouting.",
    3: "Amused discovery; Splashy's squeeze, squeeze has a gentle playful rhythm.",
    4: "Muddy enjoys the idea of mud soup. Splashy's correction is amused and helpful, never scolding.",
    5: "Sound surprised and curious while keeping every supplied word crisp and intelligible. If the line begins SMALL, say small as one clear syllable, without shouting, then stretch on and on slightly. Do not speak character names that are absent from the supplied text.",
    6: "Muddy is warmly impressed by all the teamwork.",
    7: "Muddy has suddenly spotted the important clue. Give the discovery a natural lift.",
    8: "Muddy is excited by play. Splashy gently brings attention back to the remaining food.",
    9: "Muddy recognizes something familiar, with quiet dry humor.",
    10: "Muddy is playfully making a sound with his mouth. Pffft is one short, gentle voiced raspberry, not letter names. The next line is an innocent comic explanation.",
    11: "Muddy has found the exit, with a satisfied little discovery.",
    12: "Muddy proudly solves the science mystery. Splashy teases affectionately about the muddy noseprint, curious and amused.",
}
WORD_PRONUNCIATIONS = {
    "churned": "tʃɝnd",
    "esophagus": "ɪˈsɑfəɡəs",
}


def digest(value):
    if not isinstance(value, bytes):
        value = value.encode("utf-8")
    return hashlib.sha256(value).hexdigest()


def canonical_json(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def run(args, **kwargs):
    result = subprocess.run(args, capture_output=True, **kwargs)
    if result.returncode:
        detail = result.stderr
        if isinstance(detail, bytes):
            detail = detail.decode("utf-8", errors="replace")
        raise RuntimeError(f"{args[0]} failed: {str(detail)[-1200:]}")
    return result.stdout


def read_book():
    code = "import {MEADOW_PALS_SCIENCE_BOOKS as books} from './src/data/meadowPalsScienceBooks.js'; process.stdout.write(JSON.stringify(books[0]));"
    book = json.loads(run(["node", "--input-type=module", "-e", code], cwd=ROOT, text=True))
    assert book["id"] == BOOK_ID and len(book["pages"]) == 12
    return book


def text_without_quotes(text):
    return re.sub(r"\s+", " ", text.replace('"', "")).strip()


def page_segments(number, text):
    quoted = re.findall(r'"([^\"]*)"', text)
    assert len(quoted) == len(DIALOGUE[number]), (number, len(quoted))
    segments = []
    speaker_index = 0
    for part in re.split(r'("[^\"]*")', text):
        if not part.strip():
            continue
        part = part.strip()
        speaker = "narrator"
        if part.startswith('"'):
            speaker = DIALOGUE[number][speaker_index]
            speaker_index += 1
            part = part[1:-1]
        segments.append({"speaker": speaker, "text": part})
    assert text_without_quotes(" ".join(s["text"] for s in segments)) == text_without_quotes(text)
    return segments


def make_payload(segment, page_number=None, isolated=False):
    profile = VOICES[segment["speaker"]]
    voice = {"languageCode": profile["languageCode"], "name": profile["voice"]}
    entry = {"text": segment["text"]}
    if segment["speaker"] != "narrator":
        voice["modelName"] = profile["engine"]
        entry["prompt"] = (
            "Original family-cartoon performance. Use a consistent natural British English accent. "
            "Read only the exact supplied text, with natural punctuation and brief thoughtful pauses. "
            "No introduction, speaker names, added words, music or sound effects. "
            "Clean close-microphone speech at natural conversational volume. "
            + profile["direction"] + " " + ACTING[page_number]
        )
        if entry["text"].endswith(","):
            # These are complete quoted phrases followed by narrator tags.
            # A terminal stop preserves every spoken word and avoids an open
            # comma inviting the generative speech model to continue the story.
            entry["text"] = entry["text"][:-1] + "."
            entry["prompt"] += " This is the complete short line. Stop immediately after the exact supplied words; do not continue the sentence or add another thought."
        if segment["text"].lower().strip("!.") == "pffft":
            entry["prompt"] = (
                profile["direction"] + " Produce only one brief, gentle mouth-made voiced raspberry, about half a second long. "
                "The supplied text is this single onomatopoeia. Do not spell letters. "
                "No sentence, commentary, explanation or added words before or after the raspberry. End immediately."
            )
    config = {"audioEncoding": "LINEAR16", "sampleRateHertz": 24000 if segment["speaker"] == "narrator" else SR}
    if isolated:
        config["speakingRate"] = 0.85
        pronunciation = WORD_PRONUNCIATIONS.get(segment["text"].lower())
        if pronunciation:
            entry["customPronunciations"] = {"pronunciations": [{
                "phrase": segment["text"], "phoneticEncoding": "PHONETIC_ENCODING_IPA", "pronunciation": pronunciation,
            }]}
    return {"input": entry, "voice": voice, "audioConfig": config}


def pcm_from_wav(data):
    with wave.open(io.BytesIO(data)) as source:
        assert source.getnchannels() == 1 and source.getsampwidth() == 2
        return np.frombuffer(source.readframes(source.getnframes()), dtype="<i2"), source.getframerate()


def longest_full_scale_run(pcm):
    mask = np.abs(pcm.astype(np.int32)) >= 32767
    padded = np.r_[False, mask, False].astype(np.int8)
    changes = np.diff(padded)
    starts = np.flatnonzero(changes == 1)
    stops = np.flatnonzero(changes == -1)
    return int((stops - starts).max()) if len(starts) else 0


def signal(pcm, sample_rate):
    floating = pcm.astype(np.float64) / 32768
    peak = float(np.max(np.abs(floating))) if len(pcm) else 0
    return {
        "durationSeconds": round(len(pcm) / sample_rate, 6),
        "sampleRate": sample_rate,
        "channels": 1,
        "peakDbfs": round(float(20 * np.log10(max(peak, 1e-10))), 4),
        "clippedSamples": int(np.count_nonzero(np.abs(pcm.astype(np.int32)) >= 32767)),
        "longestClippedRunSamples": longest_full_scale_run(pcm),
    }


def synthesize(job, token, rejected_takes=0):
    raw_path = SCRATCH / f"{job['requestSha256']}.wav"
    if not raw_path.exists():
        config = "\n".join(f"{key} = {json.dumps(value)}" for key, value in [
            ("url", ENDPOINT),
            ("header", "Authorization: Bearer " + token),
            ("header", "x-goog-user-project: " + PROJECT),
            ("header", "Content-Type: application/json"),
            ("data", json.dumps(job["payload"])),
        ])
        for attempt in range(4):
            result = subprocess.run(
                ["curl", "--silent", "--show-error", "--fail-with-body", "--connect-timeout", "15", "--max-time", "180", "--config", "-"],
                input=config, text=True, capture_output=True, timeout=195,
            )
            if result.returncode == 0:
                response = json.loads(result.stdout)
                raw_path.write_bytes(base64.b64decode(response["audioContent"]))
                break
            if attempt == 3:
                try:
                    error = json.loads(result.stdout).get("error", {})
                    reason = f"{error.get('status')}: {str(error.get('message'))[:450]}"
                except (ValueError, TypeError):
                    reason = f"curl failed ({result.returncode})"
                raise RuntimeError(f"{job['id']}: {reason}")
            time.sleep(2 ** (attempt + 1))
    raw_pcm, raw_sr = pcm_from_wav(raw_path.read_bytes())
    raw_signal = signal(raw_pcm, raw_sr)
    assert raw_signal["durationSeconds"] > 0.18 and raw_signal["peakDbfs"] > -45, job["id"]
    # Cut only silent borders; retain a 100 ms lead and 160 ms tail around the
    # activity detector, with a threshold low enough to retain quiet consonants.
    unit = max(1, raw_sr // 100)
    energy = np.array([np.sqrt(np.mean((raw_pcm[i:i+unit].astype(float) / 32768) ** 2)) for i in range(0, len(raw_pcm), unit)])
    active = np.flatnonzero(energy > 0.001)
    assert len(active), job["id"]
    start = max(0, int(active[0] * unit - 0.10 * raw_sr))
    end = min(len(raw_pcm), int((active[-1] + 1) * unit + 0.16 * raw_sr))
    processed_path = SCRATCH / f"{job['requestSha256']}-prepared.wav"
    filters = (
        f"atrim=start_sample={start}:end_sample={end},asetpts=PTS-STARTPTS,"
        "loudnorm=I=-22:TP=-3:LRA=7,afade=t=in:st=0:d=0.008"
    )
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw_path), "-af", filters,
         "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(processed_path)])
    pcm, _ = pcm_from_wav(processed_path.read_bytes())
    word_count = len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", job["text"]))
    maximum_seconds = max(6.0, word_count * 60 / 65 + 3.0)
    if job["speaker"] != "narrator" and job["text"].lower().strip("!.") == "pffft":
        maximum_seconds = 1.8
    if len(pcm) / SR > maximum_seconds:
        rejected_duration = round(len(pcm) / SR, 3)
        raw_path.unlink()
        processed_path.unlink()
        print(f"REJECTED {job['id']}: {rejected_duration}s for {word_count} supplied words; suspected continuation.", flush=True)
        if rejected_takes >= 2:
            raise RuntimeError(f"Repeated overlong generated speech for {job['id']}; no final clip written.")
        return synthesize(job, token, rejected_takes + 1)
    result = {key: value for key, value in job.items() if key != "payload"}
    result.update({"rawAudioSha256": digest(raw_path.read_bytes()), "sourceSignal": raw_signal,
                   "trimStartSeconds": round(start/raw_sr, 6), "trimEndSeconds": round((len(raw_pcm)-end)/raw_sr, 6),
                   "preparedPath": str(processed_path), "durationSeconds": round(len(pcm)/SR, 6)})
    print(f"SYNTHESIZED {job['id']} {result['voice']} {result['durationSeconds']:.2f}s", flush=True)
    return result


def write_wav(path, pcm):
    with wave.open(str(path), "wb") as target:
        target.setparams((1, 2, SR, 0, "NONE", "not compressed"))
        target.writeframes(pcm.astype("<i2").tobytes())


def encode_mp3(source, destination):
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(source),
         "-af", "loudnorm=I=-22:TP=-2.5:LRA=7", "-ar", str(SR), "-ac", "1",
         "-c:a", "libmp3lame", "-b:a", "128k", "-map_metadata", "-1", str(destination)])


def verify_mp3(path):
    raw = run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path),
               "-ar", str(SR), "-ac", "1", "-f", "s16le", "-"])
    measurement = signal(np.frombuffer(raw, dtype="<i2"), SR)
    if measurement["durationSeconds"] <= 0.2 or measurement["clippedSamples"]:
        raise RuntimeError(f"Invalid final audio signal: {path.name} {measurement}")
    loud = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "loudnorm=I=-22:TP=-2.5:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    matches = re.findall(r"\{\s*\"input_i\".*?\}", loud.stderr, re.S)
    if not matches:
        raise RuntimeError(f"No loudness measurement: {path.name}")
    stats = json.loads(matches[-1])
    measurement.update({"integratedLufs": float(stats["input_i"]), "truePeakDbtp": float(stats["input_tp"]), "loudnessRangeLu": float(stats["input_lra"])})
    return measurement


def assemble(label, displayed_text, segments, jobs):
    chunks = [np.zeros(round(0.15 * SR), dtype="<i2")]
    cursor = len(chunks[0])
    records = []
    for index, segment in enumerate(segments):
        row = jobs[f"{label}-{index+1:02}"]
        pcm, sample_rate = pcm_from_wav(Path(row["preparedPath"]).read_bytes())
        assert sample_rate == SR
        chunks.append(pcm)
        record = {key: value for key, value in row.items() if key != "preparedPath"}
        record["startSeconds"] = round(cursor / SR, 6)
        cursor += len(pcm)
        record["endSeconds"] = round(cursor / SR, 6)
        records.append(record)
        if index < len(segments)-1:
            # A dialogue tag connects closely to its phrase; independent turns
            # get a little more breathing room. Existing punctuation remains.
            following = segments[index+1]
            gap = 0.10 if following["speaker"] == "narrator" and following["text"].lower().startswith("said ") else 0.18
            silence = np.zeros(round(gap * SR), dtype="<i2")
            chunks.append(silence)
            cursor += len(silence)
    chunks.append(np.zeros(round(0.25 * SR), dtype="<i2"))
    wav_path = SCRATCH / f"{label}-assembled.wav"
    write_wav(wav_path, np.concatenate(chunks))
    relative_mp3 = f"words/{label.removeprefix('word-')}.mp3" if label.startswith("word-") else f"{label}.mp3"
    mp3_path = OUT / relative_mp3
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    encode_mp3(wav_path, mp3_path)
    measured = verify_mp3(mp3_path)
    return {"bookId": BOOK_ID, "displayedText": displayed_text, "textSha256": digest(displayed_text),
            "audioPath": f"{PUBLIC}/{relative_mp3}", "audioSha256": digest(mp3_path.read_bytes()),
            "durationSeconds": measured["durationSeconds"], "signal": measured, "segments": records}


def valid_existing(row, text, segments, page_number=None, isolated=False):
    if not row or row.get("displayedText") != text:
        return False
    previous_segments = row.get("segments", [])
    if len(previous_segments) != len(segments):
        return False
    for previous, segment in zip(previous_segments, segments):
        payload = make_payload(segment, page_number, isolated=isolated)
        if previous.get("requestSha256") != digest(canonical_json(payload)):
            return False
    path = ROOT / "public" / row["audioPath"].lstrip("/")
    return path.exists() and digest(path.read_bytes()) == row["audioSha256"]


def write_outputs(manifest):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    page_map = {f"{BOOK_ID}::{p['pageNumber']}": p for p in manifest["pages"]}
    title_map = {BOOK_ID: manifest["title"]} if manifest.get("title") else {}
    body = "// Generated by tools/generateMissingSandwichAudio.py from the current exact manuscript.\n"
    for name, data in [("MEADOW_PALS_SCIENCE_NARRATION", page_map), ("MEADOW_PALS_SCIENCE_TITLE_NARRATION", title_map), ("MEADOW_PALS_SCIENCE_WORD_AUDIO", manifest.get("words", {}))]:
        body += f"export const {name} = {json.dumps(data, ensure_ascii=False, indent=2)};\n"
    GENERATED.write_text(body)


def reuse_muddy_sound_word(manifest):
    """The printed raspberry replays the exact performed sound, never letter names."""
    page = next(row for row in manifest["pages"] if row["pageNumber"] == 10)
    source = next(row for row in page["segments"] if row["id"] == "page-10-02")
    assert source["speaker"] == "MEADOW-MUDDY" and source["text"] == "Pffft!"
    assert source["voice"] == "Algieba" and source["engine"] == "gemini-2.5-pro-tts"
    existing = manifest["words"].get("pffft", {})
    destination = OUT / "words/pffft.mp3"
    if (existing.get("kind") == "character-sound-replay"
            and existing.get("reusedFrom", {}).get("audioSha256") == page["audioSha256"]
            and destination.exists() and digest(destination.read_bytes()) == existing.get("audioSha256")):
        return
    prepared = SCRATCH / "pffft-from-page-10.wav"
    page_path = ROOT / "public" / page["audioPath"].lstrip("/")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(page_path),
         "-ss", str(source["startSeconds"]), "-t", str(source["durationSeconds"]),
         "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(prepared)])
    segment = {**source, "id": "word-pffft-01", "text": "pffft", "preparedPath": str(prepared)}
    record = assemble("word-pffft", "pffft", [{"speaker": "MEADOW-MUDDY", "text": "pffft"}], {segment["id"]: segment})
    record.update({"text": "pffft", "voice": source["voice"], "engine": source["engine"],
                   "kind": "character-sound-replay", "speaker": "MEADOW-MUDDY",
                   "reusedFrom": {"pageNumber": 10, "segmentId": source["id"], "audioPath": page["audioPath"],
                                  "audioSha256": page["audioSha256"], "startSeconds": source["startSeconds"],
                                  "durationSeconds": source["durationSeconds"]},
                   "reason": "The printed onomatopoeia replays Muddy's exact clean raspberry. Leda letter-name spelling is rejected; this exception applies only to pffft."})
    manifest["words"]["pffft"] = record
    print("REUSED clean Muddy raspberry for the single pffft sound-word exception.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--words-json", type=Path, help="JSON array of exact missing tappable words")
    parser.add_argument("--plan-only", action="store_true", help="Write exact API payloads locally; do not authenticate or synthesize")
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--clean-scratch", action="store_true")
    args = parser.parse_args()
    book = read_book()
    manifest_path = OUT / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {
        "schemaVersion": 1, "bookId": BOOK_ID, "source": str(SOURCE.relative_to(ROOT)),
        "generatedAt": datetime.now(timezone.utc).isoformat(), "voices": VOICES, "pages": [], "words": {},
        "processing": {"sampleRate": SR, "channels": 1, "mp3Kbps": 128, "targetIntegratedLufs": -22, "truePeakCeilingDbtp": -2.5, "backgroundMusic": False},
        "review": {"script": "Every segment reconstructs the exact manuscript in order, excluding only quotation marks and whitespace.", "listening": "Not established by signal or text-hash checks.", "humanApproval": "Not claimed."},
    }
    if args.verify_only:
        assert len(manifest["pages"]) == 12 and manifest.get("title")
        for row in manifest["pages"] + [manifest["title"]] + list(manifest["words"].values()):
            path = ROOT / "public" / row["audioPath"].lstrip("/")
            assert digest(path.read_bytes()) == row["audioSha256"]
            verify_mp3(path)
        for page in book["pages"]:
            row = next(item for item in manifest["pages"] if item["pageNumber"] == page["pageNumber"])
            assert row["displayedText"] == page["text"]
            assert text_without_quotes(" ".join(s["text"] for s in row["segments"])) == text_without_quotes(page["text"])
        print(f"VERIFIED 12 pages, cover, {len(manifest['words'])} words; exact text, hashes, decode and zero final clipped samples.")
        if args.clean_scratch and SCRATCH.exists():
            shutil.rmtree(SCRATCH)
            print("REMOVED reproducible raw/processed task audio scratch; production MP3s and provenance preserved.")
        return
    OUT.mkdir(parents=True, exist_ok=True)
    SCRATCH.mkdir(parents=True, exist_ok=True)
    targets = []
    previous = {row["pageNumber"]: row for row in manifest["pages"]}
    for page in book["pages"]:
        number = page["pageNumber"]
        segments = page_segments(number, page["text"])
        if not valid_existing(previous.get(number), page["text"], segments, number):
            targets.append((f"page-{number:02}", page["text"], segments, number))
    title_text = book["titlePageText"]
    title_segments = [{"speaker": "narrator", "text": title_text}]
    if not valid_existing(manifest.get("title"), title_text, title_segments):
        targets.append(("cover", title_text, title_segments, None))
    missing_words = json.loads(args.words_json.read_text()) if args.words_json else list(manifest.get("words", {}))
    word_jobs = []
    for word in missing_words:
        word = word.strip()
        key = word.lower()
        if key == "pffft":
            continue
        segments = [{"speaker": "narrator", "text": word}]
        if valid_existing(manifest["words"].get(key), word, segments, isolated=True):
            continue
        word_jobs.append(("word-" + re.sub(r"[^a-z0-9]+", "-", key).strip("-"), word, segments, None))
    jobs = []
    for label, _, segments, number in targets + word_jobs:
        for index, segment in enumerate(segments):
            payload = make_payload(segment, number, isolated=label.startswith("word-"))
            profile = VOICES[segment["speaker"]]
            jobs.append({"id": f"{label}-{index+1:02}", **segment, "synthesisText": payload["input"]["text"], "customPronunciations": payload["input"].get("customPronunciations"), "voice": profile["voice"], "engine": profile["engine"], "languageCode": profile["languageCode"], "payload": payload, "requestSha256": digest(canonical_json(payload))})
    print(f"PLAN {len(targets)} page/title targets, {len(word_jobs)} words, {len(jobs)} exact speech segments.", flush=True)
    if args.plan_only:
        plan = {"destination": ENDPOINT, "bookId": BOOK_ID, "voices": VOICES,
                "personalData": False, "authenticationEmbedded": False, "requests": jobs}
        plan_path = SCRATCH.parent / "audio-request-plan.json"
        plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")
        print(f"LOCAL REQUEST PLAN {plan_path.relative_to(ROOT)}; no network calls made.")
        return
    unique_jobs = {}
    for job in jobs:
        unique_jobs.setdefault(job["requestSha256"], job)
    token = run(["gcloud", "auth", "application-default", "print-access-token"], text=True).strip() if jobs else ""
    by_request = {}
    with ThreadPoolExecutor(max_workers=2) as pool:
        for future in as_completed([pool.submit(synthesize, job, token) for job in unique_jobs.values()]):
            row = future.result()
            by_request[row["requestSha256"]] = row
    complete = {job["id"]: {**by_request[job["requestSha256"]], "id": job["id"]} for job in jobs}
    for label, text, segments, number in targets:
        record = assemble(label, text, segments, complete)
        if number is None:
            record.update({"voice": VOICES["narrator"]["voice"], "engine": VOICES["narrator"]["engine"]})
            manifest["title"] = record
        else:
            record["pageNumber"] = number
            previous[number] = record
        print(f"ASSEMBLED {label} {record['durationSeconds']:.2f}s", flush=True)
    manifest["pages"] = [previous[number] for number in sorted(previous)]
    for label, word, segments, _ in word_jobs:
        record = assemble(label, word, segments, complete)
        record.update({"text": word, "voice": VOICES["narrator"]["voice"], "engine": VOICES["narrator"]["engine"]})
        manifest["words"][word.lower()] = record
    if "pffft" in [word.lower() for word in missing_words] or "pffft" in manifest["words"]:
        reuse_muddy_sound_word(manifest)
    manifest["manuscriptSha256"] = digest(json.dumps([p["text"] for p in book["pages"]], ensure_ascii=False, separators=(",", ":")))
    write_outputs(manifest)
    print(f"AUDIO COMPLETE {len(manifest['pages'])} pages + title + {len(manifest['words'])} words, {sum(p['durationSeconds'] for p in manifest['pages']):.2f}s page audio.", flush=True)


if __name__ == "__main__":
    main()
