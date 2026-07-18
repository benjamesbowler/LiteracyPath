// THE QUESTION TYPE GUIDE (REVIEW.md, Educator #1).
//
// The app's question formats are engineering labels
// (INITIAL_SOUND_PAIR_SELECT); teachers think in pedagogy (phonemic
// awareness, decoding, sight words). This table is the bridge: what the
// child actually does, which literacy skill a correct answer proves, and —
// the part teachers value — what a MISS usually means, phrased in the same
// language as the published K-2 exit-ticket materials vendored under
// tools/rubrics/. Plain data so tests, the dashboard and any future report
// can share it.
export const QUESTION_TYPE_GUIDE = [
  {
    id: "INITIAL_SOUND_PAIR_SELECT",
    name: "First-sound pairs",
    what: "Hear a sound, then pick the two pictures whose names START with it.",
    skill: "Phonemic awareness · initial sounds",
    onMiss: "The child may not yet isolate the first sound of a spoken word. Practise saying words slowly and stretching the first sound: mmm-map."
  },
  {
    id: "FINAL_SOUND_PAIR_SELECT",
    name: "Last-sound pairs",
    what: "Hear a sound, then pick the two pictures whose names END with it.",
    skill: "Phonemic awareness · final sounds",
    onMiss: "Ending sounds are harder to hear than starting ones. Say word pairs and ask what comes last: cat — t, sun — n."
  },
  {
    id: "RHYME_PAIR_SELECT",
    name: "Rhyme pairs",
    what: "Pick the two pictures whose names rhyme.",
    skill: "Phonological awareness · rhyme",
    onMiss: "The child may be matching meaning instead of sound (cat with dog). Play odd-one-out with three spoken words, two rhyming."
  },
  {
    id: "BLEND_SOUNDS",
    name: "Blend the sounds",
    what: "Hear sounds said slowly (c…a…t), then choose the word they make.",
    skill: "Phonemic awareness · blending",
    onMiss: "Blending is the engine of decoding. Practise robot talk: say a word one sound at a time and let the child say it fast."
  },
  {
    id: "PUT_SOUNDS_IN_ORDER",
    name: "Sounds in order",
    what: "Break a heard word into its sounds and place them in order.",
    skill: "Phonemic awareness · segmenting",
    onMiss: "Segmenting feeds spelling. Tap a finger per sound while saying the word, then count the taps."
  },
  {
    id: "SHORT_VOWEL_WORD",
    name: "Short-vowel words",
    what: "Read or build a short-vowel word (CVC) and match it to a picture or sound.",
    skill: "Decoding · short vowels",
    onMiss: "Confusing a/e/i/o/u mid-word is normal early on. Contrast minimal pairs out loud: pin vs pen, cat vs cot."
  },
  {
    id: "BLEND_IMAGE_CHOICE",
    name: "Blends · choose the picture",
    what: "Read a word starting or ending with a consonant blend (st, tr, mp) and pick its picture.",
    skill: "Decoding · consonant blends",
    onMiss: "The child may drop one letter of the blend (sop for stop). Read the blend slowly as two sounds said quickly."
  },
  {
    id: "BLEND_COMPLETE_WORD",
    name: "Blends · finish the word",
    what: "Choose the blend that completes a word shown with its picture.",
    skill: "Spelling · consonant blends",
    onMiss: "Producing a blend is harder than reading one. Build the word with letter tiles, saying each sound while placing it."
  },
  {
    id: "DIGRAPH_IMAGE_CHOICE",
    name: "Digraphs · choose the picture",
    what: "Read a word with sh, ch, th or ng and pick its picture.",
    skill: "Decoding · digraphs",
    onMiss: "The child may read the two letters as separate sounds (s-h). Teach it as two letters, one sound with a gesture."
  },
  {
    id: "DIGRAPH_COMPLETE_WORD",
    name: "Digraphs · finish the word",
    what: "Choose the digraph that completes a word shown with its picture.",
    skill: "Spelling · digraphs",
    onMiss: "Say the word slowly and ask where the special sound lives: start or end?"
  },
  {
    id: "LONG_VOWEL_SILENT_E_PATTERN",
    name: "Magic e words",
    what: "Read or complete a split-digraph word (cake, bike, home).",
    skill: "Decoding · long vowels (a–e pattern)",
    onMiss: "The child may read the short vowel (cap for cape). Show the pairs side by side and let the e do its magic out loud."
  },
  {
    id: "LONG_VOWEL_TEAM_COMPLETE",
    name: "Vowel teams",
    what: "Choose the vowel team (ai, ee, oa) that completes a word.",
    skill: "Decoding · long vowels (vowel teams)",
    onMiss: "Teams are learned by pattern family. Collect words that share one team before mixing teams."
  },
  {
    id: "HFW_AUDIO_FIND_WORD",
    name: "Sight words · find it",
    what: "Hear a tricky word and find it among lookalikes.",
    skill: "Sight words · recognition",
    onMiss: "The child may be guessing from the first letter. Flash the word, cover it, and ask them to picture it."
  },
  {
    id: "HFW_LETTER_BUILD",
    name: "Sight words · build it",
    what: "Build a tricky word letter by letter from a spoken prompt.",
    skill: "Sight words · spelling",
    onMiss: "Building needs full recall, not recognition. Say it, spell it aloud together, write it, check it."
  },
  {
    id: "HFW_SENTENCE_SPELL",
    name: "Sight words · use it",
    what: "Complete a real sentence with the right tricky word.",
    skill: "Sight words · in context",
    onMiss: "The word is known alone but not in use. Read the whole sentence aloud with the child before choosing."
  },
  {
    id: "SENTENCE_MATCHES_PICTURE",
    name: "Sentence and picture",
    what: "Read a full sentence and pick the picture it describes.",
    skill: "Comprehension · sentence level",
    onMiss: "Decoding may be consuming all attention, leaving none for meaning. Re-read the sentence twice: once to say it, once to picture it."
  },
  {
    id: "GRAMMAR_IMAGE_CHOICE",
    name: "Grammar · choose the picture",
    what: "Pick the picture matching a grammatical form (one dog / two dogs).",
    skill: "Language · grammar basics",
    onMiss: "Highlight the small word or ending that changed the meaning, then act it out."
  },
  {
    id: "GRAMMAR_SENTENCE_FIT",
    name: "Grammar · fit the sentence",
    what: "Choose the word that fits the sentence grammatically.",
    skill: "Language · grammar in context",
    onMiss: "Read the sentence with each option out loud — young ears often catch what young eyes miss."
  }
];
