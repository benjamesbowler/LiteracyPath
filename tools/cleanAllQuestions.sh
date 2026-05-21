#!/bin/bash

echo "======================================"
echo "Cleaning Reading Adventure question bank"
echo "======================================"

echo ""
echo "1. Fixing spelling questions..."
node tools/fixSpellingQuestions.js

echo ""
echo "2. Fixing bad phonics prompts..."
node tools/fixQuestions.js

echo ""
echo "3. Removing bad phonics questions..."
node tools/removeBadPhonicsAll.js
node tools/removeEarlyAdvancedPhonics.js

echo ""
echo "4. Cleaning awkward wording..."
node tools/cleanBadWording.js

echo ""
echo "5. Fixing preposition questions..."
node tools/fixPrepositionQuestions.js

echo ""
echo "6. Removing ambiguous spelling questions..."
node tools/removeAmbiguousSpelling.js

echo ""
echo "7. Removing bad spelling real-word questions..."
node tools/removeBadSpellingRealWords.js

echo ""
echo "8. Removing vague short-vowel questions..."
node tools/removeVagueVowelQuestions.js

echo ""
echo "9. Removing bad rhyming questions..."
node tools/removeBadRhyming.js

echo ""
echo "10. Removing ambiguous antonym questions..."
node tools/removeBadAntonyms.js

echo ""
echo "11. Removing duplicate-choice questions..."
node tools/removeDuplicateChoices.js

node tools/removeMissingPictureQuestions.js

node tools/removeAmbiguousVowels.js

echo ""
echo "12. Assigning images..."
node tools/assignImages.js

echo ""
echo "13. Calibrating difficulty..."
node tools/calibrateDifficulty.js

echo ""
echo "14. Validating final question bank..."
node tools/validateQuestions.js

echo ""
echo "======================================"
echo "Question cleanup complete."
echo "======================================"
