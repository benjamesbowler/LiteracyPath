# Media Overwrite Risk Audit

Date: 2026-07-04T15:06:25.941Z

This guardrail checks current Git changes under:

- public/images
- public/audio
- public/guided-reading
- public/media

## Summary

| Metric | Count |
| --- | --- |
| Changed paths in live media roots | 90 |
| Changed media files | 90 |
| Deleted paths | 0 |
| Temp/source paths | 0 |
| Non-webp image paths changed | 0 |
| Warnings | 92 |
| Failures | 0 |

## Result

PASS

## Warnings

- Live media folder changes detected. Review before committing to avoid overwriting approved media.
- modified: public/audio/child-mode/clean-human/graphemes/consonants/b.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/c.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/d.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/f.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/g.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/h.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/j.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/k.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/l.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/m.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/n.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/p.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/q.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/r.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/s.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/t.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/v.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/w.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/x.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/y.mp3
- modified: public/audio/child-mode/clean-human/graphemes/consonants/z.mp3
- modified: public/audio/child-mode/clean-human/graphemes/digraphs_blends/ch.mp3
- modified: public/audio/child-mode/clean-human/graphemes/digraphs_blends/ck.mp3
- modified: public/audio/child-mode/clean-human/graphemes/digraphs_blends/ng.mp3
- added: public/audio/child-mode/clean-human/graphemes/digraphs_blends/qu.mp3
- modified: public/audio/child-mode/clean-human/graphemes/digraphs_blends/sh.mp3
- modified: public/audio/child-mode/clean-human/graphemes/digraphs_blends/th.mp3
- modified: public/audio/child-mode/clean-human/graphemes/short_vowels/short_a.mp3
- modified: public/audio/child-mode/clean-human/graphemes/short_vowels/short_e.mp3
- modified: public/audio/child-mode/clean-human/graphemes/short_vowels/short_i.mp3
- modified: public/audio/child-mode/clean-human/graphemes/short_vowels/short_o.mp3
- modified: public/audio/child-mode/clean-human/graphemes/short_vowels/short_u.mp3
- modified: public/audio/letter-names/a.mp3
- modified: public/audio/letter-names/b.mp3
- modified: public/audio/letter-names/c.mp3
- modified: public/audio/letter-names/d.mp3
- modified: public/audio/letter-names/e.mp3
- modified: public/audio/letter-names/f.mp3
- modified: public/audio/letter-names/g.mp3
- modified: public/audio/letter-names/h.mp3
- modified: public/audio/letter-names/i.mp3
- modified: public/audio/letter-names/j.mp3
- modified: public/audio/letter-names/k.mp3
- modified: public/audio/letter-names/l.mp3
- modified: public/audio/letter-names/m.mp3
- modified: public/audio/letter-names/n.mp3
- modified: public/audio/letter-names/o.mp3
- modified: public/audio/letter-names/p.mp3
- modified: public/audio/letter-names/q.mp3
- modified: public/audio/letter-names/r.mp3
- modified: public/audio/letter-names/s.mp3
- modified: public/audio/letter-names/t.mp3
- modified: public/audio/letter-names/u.mp3
- modified: public/audio/letter-names/v.mp3
- modified: public/audio/letter-names/w.mp3
- modified: public/audio/letter-names/x.mp3
- modified: public/audio/letter-names/y.mp3
- modified: public/audio/letter-names/z.mp3
- modified: public/audio/phonemes/b.mp3
- modified: public/audio/phonemes/c.mp3
- modified: public/audio/phonemes/ch.mp3
- added: public/audio/phonemes/ck.mp3
- modified: public/audio/phonemes/d.mp3
- modified: public/audio/phonemes/f.mp3
- modified: public/audio/phonemes/g.mp3
- modified: public/audio/phonemes/h.mp3
- modified: public/audio/phonemes/j.mp3
- modified: public/audio/phonemes/k.mp3
- modified: public/audio/phonemes/l.mp3
- modified: public/audio/phonemes/m.mp3
- modified: public/audio/phonemes/n.mp3
- modified: public/audio/phonemes/ng.mp3
- modified: public/audio/phonemes/p.mp3
- modified: public/audio/phonemes/q.mp3
- modified: public/audio/phonemes/qu.mp3
- modified: public/audio/phonemes/r.mp3
- modified: public/audio/phonemes/s.mp3
- modified: public/audio/phonemes/sh.mp3
- modified: public/audio/phonemes/short_a.mp3
- modified: public/audio/phonemes/short_e.mp3
- modified: public/audio/phonemes/short_i.mp3
- modified: public/audio/phonemes/short_o.mp3
- modified: public/audio/phonemes/short_u.mp3
- modified: public/audio/phonemes/t.mp3
- modified: public/audio/phonemes/th.mp3
- modified: public/audio/phonemes/v.mp3
- modified: public/audio/phonemes/w.mp3
- modified: public/audio/phonemes/x.mp3
- modified: public/audio/phonemes/y.mp3
- modified: public/audio/phonemes/z.mp3
- 90 media files changed. This should be a dedicated media import commit.

## Failures

_None._

## Changed Live Media Paths

| Status | Path | Kind | Risk |
| --- | --- | --- | --- |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/b.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/c.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/d.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/f.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/g.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/h.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/j.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/k.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/l.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/m.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/n.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/p.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/q.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/r.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/s.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/t.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/v.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/w.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/x.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/y.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/consonants/z.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/digraphs_blends/ch.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/digraphs_blends/ck.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/digraphs_blends/ng.mp3 | media | review |
| added | public/audio/child-mode/clean-human/graphemes/digraphs_blends/qu.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/digraphs_blends/sh.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/digraphs_blends/th.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/short_vowels/short_a.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/short_vowels/short_e.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/short_vowels/short_i.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/short_vowels/short_o.mp3 | media | review |
| modified | public/audio/child-mode/clean-human/graphemes/short_vowels/short_u.mp3 | media | review |
| modified | public/audio/letter-names/a.mp3 | media | review |
| modified | public/audio/letter-names/b.mp3 | media | review |
| modified | public/audio/letter-names/c.mp3 | media | review |
| modified | public/audio/letter-names/d.mp3 | media | review |
| modified | public/audio/letter-names/e.mp3 | media | review |
| modified | public/audio/letter-names/f.mp3 | media | review |
| modified | public/audio/letter-names/g.mp3 | media | review |
| modified | public/audio/letter-names/h.mp3 | media | review |
| modified | public/audio/letter-names/i.mp3 | media | review |
| modified | public/audio/letter-names/j.mp3 | media | review |
| modified | public/audio/letter-names/k.mp3 | media | review |
| modified | public/audio/letter-names/l.mp3 | media | review |
| modified | public/audio/letter-names/m.mp3 | media | review |
| modified | public/audio/letter-names/n.mp3 | media | review |
| modified | public/audio/letter-names/o.mp3 | media | review |
| modified | public/audio/letter-names/p.mp3 | media | review |
| modified | public/audio/letter-names/q.mp3 | media | review |
| modified | public/audio/letter-names/r.mp3 | media | review |
| modified | public/audio/letter-names/s.mp3 | media | review |
| modified | public/audio/letter-names/t.mp3 | media | review |
| modified | public/audio/letter-names/u.mp3 | media | review |
| modified | public/audio/letter-names/v.mp3 | media | review |
| modified | public/audio/letter-names/w.mp3 | media | review |
| modified | public/audio/letter-names/x.mp3 | media | review |
| modified | public/audio/letter-names/y.mp3 | media | review |
| modified | public/audio/letter-names/z.mp3 | media | review |
| modified | public/audio/phonemes/b.mp3 | media | review |
| modified | public/audio/phonemes/c.mp3 | media | review |
| modified | public/audio/phonemes/ch.mp3 | media | review |
| added | public/audio/phonemes/ck.mp3 | media | review |
| modified | public/audio/phonemes/d.mp3 | media | review |
| modified | public/audio/phonemes/f.mp3 | media | review |
| modified | public/audio/phonemes/g.mp3 | media | review |
| modified | public/audio/phonemes/h.mp3 | media | review |
| modified | public/audio/phonemes/j.mp3 | media | review |
| modified | public/audio/phonemes/k.mp3 | media | review |
| modified | public/audio/phonemes/l.mp3 | media | review |
| modified | public/audio/phonemes/m.mp3 | media | review |
| modified | public/audio/phonemes/n.mp3 | media | review |
| modified | public/audio/phonemes/ng.mp3 | media | review |
| modified | public/audio/phonemes/p.mp3 | media | review |
| modified | public/audio/phonemes/q.mp3 | media | review |
| modified | public/audio/phonemes/qu.mp3 | media | review |
| modified | public/audio/phonemes/r.mp3 | media | review |
| modified | public/audio/phonemes/s.mp3 | media | review |
| modified | public/audio/phonemes/sh.mp3 | media | review |
| modified | public/audio/phonemes/short_a.mp3 | media | review |
| modified | public/audio/phonemes/short_e.mp3 | media | review |
| modified | public/audio/phonemes/short_i.mp3 | media | review |
| modified | public/audio/phonemes/short_o.mp3 | media | review |
| modified | public/audio/phonemes/short_u.mp3 | media | review |
| modified | public/audio/phonemes/t.mp3 | media | review |
| modified | public/audio/phonemes/th.mp3 | media | review |
| modified | public/audio/phonemes/v.mp3 | media | review |
| modified | public/audio/phonemes/w.mp3 | media | review |
| modified | public/audio/phonemes/x.mp3 | media | review |
| modified | public/audio/phonemes/y.mp3 | media | review |
| modified | public/audio/phonemes/z.mp3 | media | review |
