# Kimi Audio Re-record — STRICT Plain Text Only

The last audio batch was defective in two ways: some files read SSML
markup aloud ("speak prosody rate equals slow" before the line) and some
single words were spelled letter-by-letter instead of spoken.

NON-NEGOTIABLE rules for every file in this request:
- Input is PLAIN TEXT only. No SSML, no <speak>, no <prosody>, no tags.
- Say the word or sentence naturally ONCE. Never spell out letters.
- Warm, clear British English female narrator (same voice as before).
- After generating, LISTEN to 3 random files before delivering.

## 1. Game instruction lines -> public/audio/learn-games/instructions/
(filename = the slug; record the sentence naturally)
- build-the-word-you-hear.mp3 - "Build the word you hear."
- find-the-matching-sight-words.mp3 - "Find the matching sight words."
- find-the-rhyming-words.mp3 - "Find the rhyming words."
- hop-on-the-next-word.mp3 - "Hop on the next word."
- listen-then-tap-the-matching-word.mp3 - "Listen, then tap the matching word."
- pick-a-beginning-sound.mp3 - "Pick a beginning sound."
- read-the-sentence-and-choose.mp3 - "Read the sentence and choose."
- touch-each-sound-then-blend-the-word.mp3 - "Touch each sound, then blend the word."

## 2. Game sentences -> public/audio/learn-games/sentences/
All 21 sentences from the earlier sentences request, re-recorded under
the strict rules (same filenames as before).

## 3. Words heard spelled out -> public/audio/child-mode/words/
- jig.mp3 - "jig"
- for.mp3 - "for"
(If any other word in the app sounds spelled out or robotic, tell Claude
the word - it gets added here with the same filename convention.)
