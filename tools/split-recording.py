#!/usr/bin/env python3
"""
Split one voice-recording take into individual, trimmed, loudness-normalised mp3
clips — one per spoken item, cut on the ~2s silences. Uses ffmpeg only.

AUTO-TUNES ffmpeg silencedetect until the number of speech regions exactly matches
the expected count, so clips stay aligned with the script. If it can't hit the
exact count it reports the closest and warns — it does NOT guess.

Usage:
  python3 tools/split-recording.py <input> <expected_count> <out_prefix> <out_dir>
"""
import sys, re, subprocess, pathlib

inp, expected, prefix, outdir = sys.argv[1], int(sys.argv[2]), sys.argv[3], pathlib.Path(sys.argv[4])
outdir.mkdir(parents=True, exist_ok=True)

def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)

dur = float(run(["ffprobe","-v","error","-show_entries","format=duration",
                 "-of","default=nk=1:nw=1", inp]).stdout.strip())

def regions(noise, d):
    out = run(["ffmpeg","-hide_banner","-i",inp,"-af",
               f"silencedetect=noise={noise}dB:d={d}","-f","null","-"]).stderr
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", out)]
    ends   = [float(x) for x in re.findall(r"silence_end: (-?[\d.]+)", out)]
    if len(starts) == len(ends) + 1: ends = ends + [dur]  # file ends in silence
    sil = list(zip(starts, ends))
    regs, cur = [], 0.0
    for s, e in sil:
        if s - cur > 0.12: regs.append((max(0.0, cur), s))
        cur = e
    if dur - cur > 0.12: regs.append((cur, dur))
    return regs

best = None
for noise in (-50, -48, -45, -42, -40, -38, -36, -34, -32, -30):
    for d in (1.5, 1.3, 1.1, 0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.40, 0.35, 0.30):
        regs = regions(noise, d)
        n = len(regs)
        if best is None or abs(n - expected) < abs(len(best[2]) - expected):
            best = (noise, d, regs)
        if n == expected: best = (noise, d, regs); break
    if len(best[2]) == expected: break

noise, d, regs = best
n = len(regs)
print(("EXACT" if n == expected else f"CLOSEST {n}/{expected} — REVIEW") +
      f": silencedetect noise={noise}dB d={d}s -> {n} clips")

TARGET = -18.0   # every clip is brought to this mean loudness (dB) so they match
def seg_mean(a, b):
    err = run(["ffmpeg","-hide_banner","-ss",f"{a:.3f}","-to",f"{b:.3f}","-i",inp,
               "-af","volumedetect","-f","null","-"]).stderr
    m = re.search(r"mean_volume: (-?[\d.]+) dB", err)
    return float(m.group(1)) if m else TARGET

durs, ins = [], []
for i, (a, b) in enumerate(regs, 1):
    A, B = max(0.0, a - 0.06), min(dur, b + 0.06)
    mean = seg_mean(A, B); ins.append(mean)
    gain = max(-8.0, min(18.0, TARGET - mean))     # exact gain to hit target, capped for safety
    out = outdir / f"{prefix}-{i:03d}.mp3"
    run(["ffmpeg","-y","-hide_banner","-loglevel","error","-ss",f"{A:.3f}","-to",f"{B:.3f}","-i",inp,
         "-af",f"volume={gain:.2f}dB,alimiter=limit=0.95","-ar","44100","-ac","1","-b:a","128k", str(out)])
    durs.append(b - a)

print(f"Exported {n} clips -> {outdir}")
print(f"Original loudness varied {min(ins):.1f}..{max(ins):.1f} dB  ->  all matched to ~{TARGET:.0f} dB")
sus = [i+1 for i, x in enumerate(durs) if x < 0.22 or x > 3.0]
if sus: print("REVIEW clip #s (short/long):", sus)
