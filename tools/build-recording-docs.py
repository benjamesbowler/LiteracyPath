#!/usr/bin/env python3
"""
Build the voice-recording Word documents for LiteracyPath.

Deterministic: reads the app's own curriculum data (as source text, no import
needed), dedupes, EXCLUDES blocklisted words, and writes a split .docx set +
a CSV manifest into docs/audio-recording/.

SOUNDS and SENTENCES are kept in SEPARATE files (never mixed). ~10 files total.

Run:  python3 tools/build-recording-docs.py
"""
import re, csv, pathlib
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "audio-recording"
OUT.mkdir(parents=True, exist_ok=True)

def read(p): return (ROOT / p).read_text(encoding="utf-8")

# ---- SOUNDS (reused from docs/RECORDING_SCRIPT.md, human pronunciation guidance) ----
LETTER_SOUNDS = [
 'the sound "a" as at the start of APPLE — "aaa" (never "ay")',
 'the sound "b" as in BAT — one crisp "b"',
 'the sound "c" as in CAT — one crisp "k"',
 'the sound "d" as in DOG — one crisp "d"',
 'the sound "e" as at the start of EGG — "eh" (never "ee")',
 'the sound "f" — stretchy "fff"',
 'the hard sound "g" as in GOAT — one crisp "g"',
 'the sound "h" — a soft breathy "hhh"',
 'the sound "i" as at the start of IGLOO — "ih" (never "eye")',
 'the sound "j" as in JAM',
 'the sound "k" as in KITE — one crisp "k"',
 'the sound "l" — stretchy "lll"',
 'the sound "m" — stretchy "mmm"',
 'the sound "n" — stretchy "nnn"',
 'the sound "o" as at the start of OCTOPUS — "o" as in hot (never "oh")',
 'the sound "p" — one crisp "p"',
 'the sound "q" as at the start of QUEEN — "kw"',
 'the sound "r" — stretchy "rrr" as in run',
 'the sound "s" — stretchy "sss"',
 'the sound "t" — one crisp "t"',
 'the sound "u" as at the start of UMBRELLA — "uh" as in cup (never "you")',
 'the sound "v" — stretchy "vvv"',
 'the sound "w" as in WEB — "wuh", as light as you can',
 'the sound "x" as at the END of BOX — "ks"',
 'the sound "y" as in YES — "yuh", as light as you can',
 'the sound "z" — stretchy "zzz"',
]
DIGRAPH_SOUNDS = [
 'the sound "sh" as in SHIP — "shhh"',
 'the sound "ch" as in CHAT',
 'the sound "th" as in THUMB (soft, no voice)',
 'the sound "ng" as at the end of RING',
 'the sound "qu" as in QUEEN — "kw"',
 'the sound "ck" as at the end of DUCK — one crisp "k"',
]
LETTER_NAMES = ['ay','bee','see','dee','ee','eff','jee','aitch','eye','jay','kay','el','em','en',
 'oh','pee','cue','ar','ess','tee','you','vee','double-you','ex','why','zee']
LETTER_NAMES = [f'the LETTER NAME "{n}"' for n in LETTER_NAMES]

# ---- BLOCKLIST (never record these) ----
bl_txt = read("src/data/knownBadWordAudio.js")
m = re.search(r"KNOWN_BAD_WORD_AUDIO\s*=\s*new Set\(\[([^\]]*)\]", bl_txt)
BLOCK = set(re.findall(r'"([^"]+)"', m.group(1))) if m else set()

def qwords(block):
    return re.findall(r'"([a-zA-Z][a-zA-Z\'\- ]*?)"', block)

# ---- WORDS ----
words = set()
# High-frequency words (bands 1_25, 26_50, 51_75, 76_100)
hfw = read("src/data/highFrequencyWordBands.js")
for band in ["1_25","26_50","51_75","76_100"]:
    mm = re.search(r"HFW_WORDS_%s\s*=\s*\[([^\]]*)\]" % band, hfw)
    if mm:
        for w in qwords(mm.group(1)): words.add(w.strip().lower())
# CVC word-family build words
cvc = read("src/data/cvcWordFamilies.js")
for arr in re.findall(r"buildWords:\s*\[([^\]]*)\]", cvc):
    for w in qwords(arr): words.add(w.strip().lower())
# 500-word vocabulary lexicon
lex = read("src/data/vocabularyMediaLexicon.js")
for w in re.findall(r'"word":\s*"([^"]+)"', lex): words.add(w.strip().lower())
# the three short whole words from the sounds script
for w in ["am","ax","of"]: words.add(w)
# poem find-words
poems_src = read("src/data/elCyclePoems.js")
for arr in re.findall(r"findWords:\s*\[([^\]]*)\]", poems_src):
    for w in qwords(arr): words.add(w.strip().lower())

# NOTE: blocklisted words are INCLUDED - in this app the blocklist means the
# current recording is defective and NEEDS re-recording (they are priority items).
words = sorted(w for w in words if w and re.fullmatch(r"[a-z][a-z'\- ]*", w))

# ---- SENTENCES (poem lines) ----
sentences = []
for lines_block in re.findall(r"lines:\s*\[((?:[^\[\]]|\\.)*)\]", poems_src):
    for s in re.findall(r'"((?:[^"\\]|\\.)*)"', lines_block):
        s = s.replace('\\"', '"').replace("\\\\", "\\").strip()
        if s: sentences.append(s)

# ---------- assemble files (~10 total; sounds & sentences never mixed) ----------
def chunk(lst, n):
    k, out, i = -(-len(lst)//n), [], 0
    for _ in range(n):
        out.append(lst[i:i+k]); i += k
    return [c for c in out if c]

files = []
files.append(("sounds-01", "SOUNDS & LETTER NAMES",
    LETTER_SOUNDS + DIGRAPH_SOUNDS + LETTER_NAMES))
for i, part in enumerate(chunk(words, 6), 1):
    files.append((f"words-{i:02d}", f"WORDS (part {i})", part))
for i, part in enumerate(chunk(sentences, 3), 1):
    files.append((f"sentences-{i:02d}", f"SENTENCES (part {i})", part))

# ---------- write the master Word document ----------
INSTR = [
 "Record in a quiet room. Phone or laptop mic is fine — hold it ~20cm away and keep the same distance the whole time.",
 "Speak warmly and clearly, like reading to a class of 5-year-olds — the SAME warm voice for every file.",
 "Say each item ONCE, then stay SILENT for a slow “one-banana, two-banana” (~2 seconds) before the next. The silence is essential — it's how the clips get split.",
 "For the SOUNDS file: say the SOUND, not the letter name, unless it says “LETTER NAME”. Stop sounds = one crisp sound, no “uh” after. Stretchy sounds = hold about half a second.",
 "If you fluff one, just pause and say the SAME item again — the last good take is kept. Don't restart the file.",
 "Save/export each file as mp3 (m4a or wav is also fine) named EXACTLY as the heading says (e.g. words-01.mp3). Do the files in order.",
]

def heading(doc, text, size=15, color=(20,24,60)):
    p = doc.add_paragraph(); r = p.add_run(text); r.bold = True
    r.font.size = Pt(size); r.font.color.rgb = RGBColor(*color); return p

doc = Document()
t = doc.add_paragraph(); tr = t.add_run("LiteracyPath — Voice Recording Script")
tr.bold = True; tr.font.size = Pt(22)
doc.add_paragraph("Everything the app needs recorded, split into files. Sounds, words and sentences are in separate files so nothing gets mixed up.")
heading(doc, "How to record")
for i, s in enumerate(INSTR, 1):
    doc.add_paragraph(s, style="List Number")
heading(doc, "File summary")
tbl = doc.add_table(rows=1, cols=3); tbl.style = "Light Grid Accent 1"
for c, h in zip(tbl.rows[0].cells, ["Save as", "Contents", "Items"]): c.text = h
total = 0
for name, label, items in files:
    total += len(items)
    row = tbl.add_row().cells
    row[0].text = f"{name}.mp3"; row[1].text = label; row[2].text = str(len(items))
doc.add_paragraph(f"\nTotal items to record: {total}  (across {len(files)} files).")

for name, label, items in files:
    doc.add_page_break()
    heading(doc, f"{label}", 17, (176,96,26) if name.startswith("words") else (40,120,90) if name.startswith("sent") else (20,24,60))
    p = doc.add_paragraph(); r = p.add_run(f"Save this file as:  {name}.mp3")
    r.bold = True; r.font.size = Pt(12)
    doc.add_paragraph("Say each item once, then ~2 seconds of silence.").italic = True
    for i, it in enumerate(items, 1):
        doc.add_paragraph(f"{i}.  {it}")

master = OUT / "LiteracyPath_Recording_Script.docx"
doc.save(master)

# ---------- CSV manifest (auditable) ----------
with open(OUT / "recording_manifest.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["file","index","item"])
    for name, label, items in files:
        for i, it in enumerate(items, 1): w.writerow([f"{name}.mp3", i, it])

# ---------- report ----------
print("Blocklisted words INCLUDED as priority re-records:", sorted(BLOCK))
print("Unique WORDS:", len(words))
print("SENTENCES:", len(sentences))
print("SOUNDS+NAMES:", len(files[0][2]))
print("Files:", len(files), "| total items:", total)
for name, label, items in files: print(f"  {name}.mp3  {label:22} {len(items):4} items")
print("Wrote:", master)
