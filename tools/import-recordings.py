#!/usr/bin/env python3
"""
Map the split/aligned voice recordings into every place the app uses them.

- Sound clips (1-26 letter sounds, 27-32 digraphs) -> every blocklisted grapheme/
  phoneme path with that slug.
- Name clips (33-58) -> public/audio/letter-names/<letter>.mp3.
- Word clips (1-112) -> every <word>.mp3 under public/ EXCEPT the phoneme/grapheme/
  letter-name folders (so a word never clobbers a letter sound/name).
- Clears KNOWN_BAD_AUDIO_PATHS (those clips are now real recordings). Leaves the
  word blocklist (am/ax/of) since those words are not in this batch.

Does NOT delete anything (old files are overwritten in place; git keeps history).
Run:  python3 tools/import-recordings.py
"""
import csv, re, shutil, subprocess, os, pathlib

ROOT = pathlib.Path(".").resolve()
PUB = ROOT / "public"
ST = ROOT / "docs/audio-recording/staged"
snd = lambda i: ST / "sounds" / f"sound-{i:03d}.mp3"
wrd = lambda i: ST / "words" / f"word-{i:03d}.mp3"

# clip 1-112 -> word
words = {int(r[1]): r[2] for r in csv.reader(open(ROOT / "docs/audio-recording/recording_manifest.csv"))
         if r and r[0] == "words-01.mp3"}

# slug -> sound clip number
letters, vowels = "abcdefghijklmnopqrstuvwxyz", "aeiou"
slug2clip = {}
for i, l in enumerate(letters, 1):
    slug2clip[l] = i
    if l in vowels: slug2clip["short_" + l] = i
slug2clip.update({"sh": 27, "ch": 28, "th": 29, "ng": 30, "qu": 31, "ck": 32})

BL = ROOT / "src/data/knownBadWordAudio.js"
bltext = BL.read_text()
sound_paths = sorted(set(re.findall(r'"(/audio/[^"]+\.mp3)"', bltext)))

written, skipped, wordless = 0, [], []

# 1) sounds -> blocklisted grapheme/phoneme paths
for p in sound_paths:
    slug = os.path.basename(p)[:-4]
    c = slug2clip.get(slug)
    tgt = pathlib.Path(str(PUB) + p)
    if c and tgt.exists():
        shutil.copyfile(snd(c), tgt); written += 1
    else:
        skipped.append(p)

# 2) letter NAMES -> letter-names/<letter>.mp3  (clips 33-58)
for i, l in enumerate(letters):
    tgt = PUB / "audio" / "letter-names" / f"{l}.mp3"
    if tgt.exists():
        shutil.copyfile(snd(33 + i), tgt); written += 1

# 3) words -> every <word>.mp3 under public/, excluding the sound/name folders
EXCLUDE = ("/phonemes/", "/graphemes/", "/letter-names/")
for i, w in words.items():
    hits = [h for h in subprocess.run(["find", str(PUB), "-name", f"{w}.mp3"],
            capture_output=True, text=True).stdout.split() if not any(x in h for x in EXCLUDE)]
    if not hits:
        wordless.append(w); continue
    for h in hits:
        shutil.copyfile(wrd(i), h); written += 1

# 4) clear the path blocklist (these are real recordings now); keep the word blocklist
new = re.sub(r'(export const KNOWN_BAD_AUDIO_PATHS = new Set\(\[)[\s\S]*?(\]\);)',
             r'\1\n  // 2026-07-06: replaced by real gold-voice recordings (sounds-01 + words-01 batch).\n\2',
             bltext, count=1)
BL.write_text(new)

print(f"Wrote {written} audio files.")
print(f"Skipped blocklist paths with no slug match ({len(skipped)}): {skipped}")
print(f"Words with no existing target ({len(wordless)}): {sorted(wordless)}")
print("Cleared KNOWN_BAD_AUDIO_PATHS; kept KNOWN_BAD_WORD_AUDIO (am/ax/of not in this batch).")
