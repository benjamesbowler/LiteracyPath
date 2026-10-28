// Exact published V11 snapshots whose optional audio resolution changed when
// the current Skills vocabulary received new recordings. Never rewrite history.
const snapshots = [
  {
    "id": "lp3.antonyms_synonyms.l1.A.synonym_concrete.v1.v11",
    "contentVersion": "literacy-mock-v11",
    "skillId": "antonyms_synonyms",
    "domainId": "vocabulary",
    "mapDomainId": "vocabulary",
    "level": 1,
    "format": "choice",
    "answerMode": "exact",
    "prompt": "Find two words that mean the same.",
    "passage": "",
    "choices": [
      {
        "id": "c0",
        "label": "happy — glad",
        "audioPath": "/audio/production/en-US/isolated_word/happy-glad-679672ce5e.mp3"
      },
      {
        "id": "c1",
        "label": "happy — sad",
        "audioPath": "/audio/production/en-US/isolated_word/happy-sad-6fef063fdd.mp3"
      },
      {
        "id": "c2",
        "label": "happy — angry",
        "audioPath": "/audio/production/en-US/mock-v11/b13e37f5e47eb400de.mp3"
      },
      {
        "id": "c3",
        "label": "happy — tired",
        "audioPath": "/audio/production/en-US/mock-v11/eb1a9d203c535c4bdc.mp3"
      }
    ],
    "answer": "c0",
    "targetWord": "",
    "renderTargetText": false,
    "image": "",
    "imageAlt": "",
    "modality": "recognition",
    "displayPassageDuringResponse": true,
    "hideWrittenLabels": false,
    "tutorialOnly": false,
    "requiredAudioCues": [
      {
        "role": "instruction",
        "text": "Find two words that mean the same.",
        "path": "/audio/production/en-US/assessment_prompt/find-two-words-that-mean-the-same-2006bd171b.mp3"
      },
      {
        "role": "choice",
        "choiceId": "c0",
        "text": "happy — glad",
        "value": "happy — glad",
        "path": "/audio/production/en-US/isolated_word/happy-glad-679672ce5e.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c1",
        "text": "happy — sad",
        "value": "happy — sad",
        "path": "/audio/production/en-US/isolated_word/happy-sad-6fef063fdd.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c2",
        "text": "happy — angry",
        "value": "happy — angry",
        "path": "/audio/production/en-US/mock-v11/b13e37f5e47eb400de.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c3",
        "text": "happy — tired",
        "value": "happy — tired",
        "path": "/audio/production/en-US/mock-v11/eb1a9d203c535c4bdc.mp3",
        "required": true
      }
    ],
    "requiredAudioPaths": [
      "/audio/production/en-US/assessment_prompt/find-two-words-that-mean-the-same-2006bd171b.mp3",
      "/audio/production/en-US/isolated_word/happy-glad-679672ce5e.mp3",
      "/audio/production/en-US/isolated_word/happy-sad-6fef063fdd.mp3",
      "/audio/production/en-US/mock-v11/b13e37f5e47eb400de.mp3",
      "/audio/production/en-US/mock-v11/eb1a9d203c535c4bdc.mp3"
    ],
    "stimulusKey": "v11-relation:synonym:glad:happy",
    "canonicalItemId": "lp3.antonyms_synonyms.l1.A.synonym_concrete.v1.v11",
    "exposureFamilyId": "source-item:lp3.antonyms_synonyms.l1.A.synonym_concrete.v1",
    "constructClaim": "synonym_concrete",
    "sourceItemId": "lp3.antonyms_synonyms.l1.A.synonym_concrete.v1.v11",
    "sourceFormat": "choice",
    "sourceProvenance": {
      "generatedBy": "assessment-rebuild-gate",
      "sourceFile": "tools/assessmentRebuild/authoring/antonyms_synonyms.mjs",
      "wave": "",
      "standardVersion": "v3",
      "v11MeaningChoices": {
        "file": "src/data/literacyMockFourChoiceMeaningV11.js",
        "originalId": "lp3.antonyms_synonyms.l1.A.synonym_concrete.v1",
        "authoredFourth": true,
        "familiarWordRelationRepair": true,
        "priorStimulusKey": "response-evidence:[\"happy — glad\"]"
      }
    },
    "mediaDecision": {
      "role": "text-and-audio",
      "paths": [],
      "constructReview": "approved",
      "answerNeutral": "approved",
      "reason": "Familiar spoken and printed word pairs measure one meaning relation. Exact response recordings are required; no image or unrelated vocabulary is introduced."
    },
    "distractorRationales": {
      "c1": "sad names a different action, feeling or property; it does not mean happy.",
      "c2": "angry names a different action, feeling or property; it does not mean happy.",
      "c3": "tired names a different action, feeling or property; it does not mean happy."
    },
    "requiredImagePaths": [],
    "mediaReady": true,
    "adaptiveMixedEligible": true,
    "adaptiveAreaVersion": "areas-v6",
    "adaptiveAreaBand": 2,
    "adaptiveDemand": {
      "operation": "relate_word_meanings",
      "requires": "Relate individual words by synonym or antonym meaning."
    },
    "canonicalPassageId": "v11-relation:synonym:glad:happy",
    "explanation": "happy and glad mean about the same.",
    "lexicalExposureWords": [
      "happy",
      "glad",
      "sad",
      "angry",
      "tired"
    ],
    "taskDemand": {
      "choiceCount": 4
    },
    "missingAudioCues": []
  },
  {
    "id": "lp3.antonyms_synonyms.l1.A.antonym_picture.v1.v11",
    "contentVersion": "literacy-mock-v11",
    "skillId": "antonyms_synonyms",
    "domainId": "vocabulary",
    "mapDomainId": "vocabulary",
    "level": 1,
    "format": "choice",
    "answerMode": "exact",
    "prompt": "Which words mean the opposite?",
    "passage": "",
    "choices": [
      {
        "id": "c0",
        "label": "awake — asleep",
        "audioPath": "/audio/production/en-US/isolated_word/awake-asleep-a5c6f3b020.mp3"
      },
      {
        "id": "c1",
        "label": "awake — happy",
        "audioPath": "/audio/production/en-US/mock-v11/fc444853b9664986cc.mp3"
      },
      {
        "id": "c2",
        "label": "awake — busy",
        "audioPath": "/audio/production/en-US/mock-v11/03d6565d3f0f9585bd.mp3"
      },
      {
        "id": "c3",
        "label": "awake — tired",
        "audioPath": "/audio/production/en-US/mock-v11/1613d1262f41d3b91c.mp3"
      }
    ],
    "answer": "c0",
    "targetWord": "",
    "renderTargetText": false,
    "image": "",
    "imageAlt": "",
    "modality": "recognition",
    "displayPassageDuringResponse": true,
    "hideWrittenLabels": false,
    "tutorialOnly": false,
    "requiredAudioCues": [
      {
        "role": "instruction",
        "text": "Which words mean the opposite?",
        "path": "/audio/production/en-US/mock-v11/433f9bc6d1866bcdab.mp3"
      },
      {
        "role": "choice",
        "choiceId": "c0",
        "text": "awake — asleep",
        "value": "awake — asleep",
        "path": "/audio/production/en-US/isolated_word/awake-asleep-a5c6f3b020.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c1",
        "text": "awake — happy",
        "value": "awake — happy",
        "path": "/audio/production/en-US/mock-v11/fc444853b9664986cc.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c2",
        "text": "awake — busy",
        "value": "awake — busy",
        "path": "/audio/production/en-US/mock-v11/03d6565d3f0f9585bd.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c3",
        "text": "awake — tired",
        "value": "awake — tired",
        "path": "/audio/production/en-US/mock-v11/1613d1262f41d3b91c.mp3",
        "required": true
      }
    ],
    "requiredAudioPaths": [
      "/audio/production/en-US/mock-v11/433f9bc6d1866bcdab.mp3",
      "/audio/production/en-US/isolated_word/awake-asleep-a5c6f3b020.mp3",
      "/audio/production/en-US/mock-v11/fc444853b9664986cc.mp3",
      "/audio/production/en-US/mock-v11/03d6565d3f0f9585bd.mp3",
      "/audio/production/en-US/mock-v11/1613d1262f41d3b91c.mp3"
    ],
    "stimulusKey": "v11-relation:opposite:asleep:awake",
    "canonicalItemId": "lp3.antonyms_synonyms.l1.A.antonym_picture.v1.v11",
    "exposureFamilyId": "source-item:lp3.antonyms_synonyms.l1.A.antonym_picture.v1",
    "constructClaim": "antonym_picture",
    "sourceItemId": "lp3.antonyms_synonyms.l1.A.antonym_picture.v1.v11",
    "sourceFormat": "choice",
    "sourceProvenance": {
      "generatedBy": "assessment-rebuild-gate",
      "sourceFile": "tools/assessmentRebuild/authoring/antonyms_synonyms.mjs",
      "wave": "",
      "standardVersion": "v3",
      "v11MeaningChoices": {
        "file": "src/data/literacyMockFourChoiceMeaningV11.js",
        "originalId": "lp3.antonyms_synonyms.l1.A.antonym_picture.v1",
        "authoredFourth": true,
        "familiarWordRelationRepair": true,
        "priorStimulusKey": "response-evidence:[\"awake — asleep\"]"
      }
    },
    "mediaDecision": {
      "role": "text-and-audio",
      "paths": [],
      "constructReview": "approved",
      "answerNeutral": "approved",
      "reason": "Familiar spoken and printed word pairs measure one meaning relation. Exact response recordings are required; no image or unrelated vocabulary is introduced."
    },
    "distractorRationales": {
      "c1": "happy names a related action, property or idea, but does not reverse the meaning of awake.",
      "c2": "busy names a related action, property or idea, but does not reverse the meaning of awake.",
      "c3": "tired names a related action, property or idea, but does not reverse the meaning of awake."
    },
    "requiredImagePaths": [],
    "mediaReady": true,
    "adaptiveMixedEligible": true,
    "adaptiveAreaVersion": "areas-v6",
    "adaptiveAreaBand": 2,
    "adaptiveDemand": {
      "operation": "relate_word_meanings",
      "requires": "Relate individual words by synonym or antonym meaning."
    },
    "canonicalPassageId": "v11-relation:opposite:asleep:awake",
    "explanation": "awake and asleep name opposite meanings.",
    "lexicalExposureWords": [
      "awake",
      "asleep",
      "happy",
      "busy",
      "tired"
    ],
    "taskDemand": {
      "choiceCount": 4
    },
    "missingAudioCues": []
  },
  {
    "id": "lp3.antonyms_synonyms.l1.C.antonym_picture.v103.v11",
    "contentVersion": "literacy-mock-v11",
    "skillId": "antonyms_synonyms",
    "domainId": "vocabulary",
    "mapDomainId": "vocabulary",
    "level": 1,
    "format": "choice",
    "answerMode": "exact",
    "prompt": "Which words mean the opposite?",
    "passage": "",
    "choices": [
      {
        "id": "c0",
        "label": "awake — asleep",
        "audioPath": "/audio/production/en-US/isolated_word/awake-asleep-a5c6f3b020.mp3"
      },
      {
        "id": "c1",
        "label": "awake — happy",
        "audioPath": "/audio/production/en-US/mock-v11/fc444853b9664986cc.mp3"
      },
      {
        "id": "c2",
        "label": "awake — busy",
        "audioPath": "/audio/production/en-US/mock-v11/03d6565d3f0f9585bd.mp3"
      },
      {
        "id": "c3",
        "label": "awake — tired",
        "audioPath": "/audio/production/en-US/mock-v11/1613d1262f41d3b91c.mp3"
      }
    ],
    "answer": "c0",
    "targetWord": "",
    "renderTargetText": false,
    "image": "",
    "imageAlt": "",
    "modality": "recognition",
    "displayPassageDuringResponse": true,
    "hideWrittenLabels": false,
    "tutorialOnly": false,
    "requiredAudioCues": [
      {
        "role": "instruction",
        "text": "Which words mean the opposite?",
        "path": "/audio/production/en-US/mock-v11/433f9bc6d1866bcdab.mp3"
      },
      {
        "role": "choice",
        "choiceId": "c0",
        "text": "awake — asleep",
        "value": "awake — asleep",
        "path": "/audio/production/en-US/isolated_word/awake-asleep-a5c6f3b020.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c1",
        "text": "awake — happy",
        "value": "awake — happy",
        "path": "/audio/production/en-US/mock-v11/fc444853b9664986cc.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c2",
        "text": "awake — busy",
        "value": "awake — busy",
        "path": "/audio/production/en-US/mock-v11/03d6565d3f0f9585bd.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c3",
        "text": "awake — tired",
        "value": "awake — tired",
        "path": "/audio/production/en-US/mock-v11/1613d1262f41d3b91c.mp3",
        "required": true
      }
    ],
    "requiredAudioPaths": [
      "/audio/production/en-US/mock-v11/433f9bc6d1866bcdab.mp3",
      "/audio/production/en-US/isolated_word/awake-asleep-a5c6f3b020.mp3",
      "/audio/production/en-US/mock-v11/fc444853b9664986cc.mp3",
      "/audio/production/en-US/mock-v11/03d6565d3f0f9585bd.mp3",
      "/audio/production/en-US/mock-v11/1613d1262f41d3b91c.mp3"
    ],
    "stimulusKey": "v11-relation:opposite:asleep:awake",
    "canonicalItemId": "lp3.antonyms_synonyms.l1.C.antonym_picture.v103.v11",
    "exposureFamilyId": "source-item:lp3.antonyms_synonyms.l1.C.antonym_picture.v103",
    "constructClaim": "antonym_picture",
    "sourceItemId": "lp3.antonyms_synonyms.l1.C.antonym_picture.v103.v11",
    "sourceFormat": "choice",
    "sourceProvenance": {
      "generatedBy": "assessment-rebuild-gate",
      "sourceFile": "tools/assessmentRebuild/authoring/antonyms_synonyms.mjs",
      "wave": "",
      "standardVersion": "v3",
      "v11MeaningChoices": {
        "file": "src/data/literacyMockFourChoiceMeaningV11.js",
        "originalId": "lp3.antonyms_synonyms.l1.C.antonym_picture.v103",
        "authoredFourth": true,
        "familiarWordRelationRepair": true,
        "priorStimulusKey": "response-evidence:[\"awake — asleep\"]"
      }
    },
    "mediaDecision": {
      "role": "text-and-audio",
      "paths": [],
      "constructReview": "approved",
      "answerNeutral": "approved",
      "reason": "Familiar spoken and printed word pairs measure one meaning relation. Exact response recordings are required; no image or unrelated vocabulary is introduced."
    },
    "distractorRationales": {
      "c1": "happy names a related action, property or idea, but does not reverse the meaning of awake.",
      "c2": "busy names a related action, property or idea, but does not reverse the meaning of awake.",
      "c3": "tired names a related action, property or idea, but does not reverse the meaning of awake."
    },
    "requiredImagePaths": [],
    "mediaReady": true,
    "adaptiveMixedEligible": true,
    "adaptiveAreaVersion": "areas-v6",
    "adaptiveAreaBand": 2,
    "adaptiveDemand": {
      "operation": "relate_word_meanings",
      "requires": "Relate individual words by synonym or antonym meaning."
    },
    "canonicalPassageId": "v11-relation:opposite:asleep:awake",
    "explanation": "awake and asleep name opposite meanings.",
    "lexicalExposureWords": [
      "awake",
      "asleep",
      "happy",
      "busy",
      "tired"
    ],
    "taskDemand": {
      "choiceCount": 4
    },
    "missingAudioCues": []
  },
  {
    "id": "mock.capacity.language.same-fortunate-lucky.v11",
    "contentVersion": "literacy-mock-v11",
    "skillId": "antonyms_synonyms",
    "domainId": "vocabulary",
    "mapDomainId": "vocabulary",
    "level": 2,
    "format": "choice",
    "answerMode": "exact",
    "prompt": "Find two words that mean the same.",
    "passage": "",
    "choices": [
      {
        "id": "c0",
        "label": "happy — glad",
        "audioPath": "/audio/production/en-US/isolated_word/happy-glad-679672ce5e.mp3"
      },
      {
        "id": "c1",
        "label": "happy — sad",
        "audioPath": "/audio/production/en-US/isolated_word/happy-sad-6fef063fdd.mp3"
      },
      {
        "id": "c2",
        "label": "happy — angry",
        "audioPath": "/audio/production/en-US/mock-v11/b13e37f5e47eb400de.mp3"
      },
      {
        "id": "c3",
        "label": "happy — tired",
        "audioPath": "/audio/production/en-US/mock-v11/eb1a9d203c535c4bdc.mp3"
      }
    ],
    "answer": "c0",
    "targetWord": "",
    "renderTargetText": false,
    "image": "",
    "imageAlt": "",
    "modality": "recognition",
    "displayPassageDuringResponse": true,
    "hideWrittenLabels": false,
    "tutorialOnly": false,
    "requiredAudioCues": [
      {
        "role": "instruction",
        "text": "Find two words that mean the same.",
        "path": "/audio/production/en-US/assessment_prompt/find-two-words-that-mean-the-same-2006bd171b.mp3"
      },
      {
        "role": "choice",
        "choiceId": "c0",
        "text": "happy — glad",
        "value": "happy — glad",
        "path": "/audio/production/en-US/isolated_word/happy-glad-679672ce5e.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c1",
        "text": "happy — sad",
        "value": "happy — sad",
        "path": "/audio/production/en-US/isolated_word/happy-sad-6fef063fdd.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c2",
        "text": "happy — angry",
        "value": "happy — angry",
        "path": "/audio/production/en-US/mock-v11/b13e37f5e47eb400de.mp3",
        "required": true
      },
      {
        "role": "choice",
        "choiceId": "c3",
        "text": "happy — tired",
        "value": "happy — tired",
        "path": "/audio/production/en-US/mock-v11/eb1a9d203c535c4bdc.mp3",
        "required": true
      }
    ],
    "requiredAudioPaths": [
      "/audio/production/en-US/assessment_prompt/find-two-words-that-mean-the-same-2006bd171b.mp3",
      "/audio/production/en-US/isolated_word/happy-glad-679672ce5e.mp3",
      "/audio/production/en-US/isolated_word/happy-sad-6fef063fdd.mp3",
      "/audio/production/en-US/mock-v11/b13e37f5e47eb400de.mp3",
      "/audio/production/en-US/mock-v11/eb1a9d203c535c4bdc.mp3"
    ],
    "stimulusKey": "v11-relation:synonym:glad:happy",
    "canonicalItemId": "mock.capacity.language.same-fortunate-lucky.v11",
    "exposureFamilyId": "mock-language-capacity:same-fortunate-lucky",
    "constructClaim": "synonym_concrete",
    "sourceItemId": "mock.capacity.language.same-fortunate-lucky.v11",
    "sourceFormat": "choice",
    "sourceProvenance": {
      "kind": "original_mock_capacity",
      "file": "src/data/literacyMockLanguageCapacity.js",
      "sourceId": "same-fortunate-lucky",
      "taskTemplate": "mock.depth.synonym_concrete-reluctant",
      "v11MeaningChoices": {
        "file": "src/data/literacyMockFourChoiceMeaningV11.js",
        "originalId": "mock.capacity.language.same-fortunate-lucky",
        "authoredFourth": true,
        "familiarWordRelationRepair": true,
        "priorStimulusKey": "response-evidence:[\"fortunate — lucky\"]"
      }
    },
    "mediaDecision": {
      "role": "text-and-audio",
      "paths": [],
      "constructReview": "approved",
      "answerNeutral": "approved",
      "reason": "Familiar spoken and printed word pairs measure one meaning relation. Exact response recordings are required; no image or unrelated vocabulary is introduced."
    },
    "distractorRationales": {
      "c1": "sad names a different action, feeling or property; it does not mean happy.",
      "c2": "angry names a different action, feeling or property; it does not mean happy.",
      "c3": "tired names a different action, feeling or property; it does not mean happy."
    },
    "explanation": "happy and glad mean about the same.",
    "difficultyEvidence": "Discriminate related alternatives using the exact contextual, morphological or semantic evidence.",
    "requiredImagePaths": [],
    "mediaReady": true,
    "adaptiveMixedEligible": true,
    "adaptiveAreaVersion": "areas-v6",
    "adaptiveAreaBand": 2,
    "adaptiveDemand": {
      "operation": "relate_word_meanings",
      "requires": "Relate individual words by synonym or antonym meaning."
    },
    "canonicalPassageId": "v11-relation:synonym:glad:happy",
    "lexicalExposureWords": [
      "happy",
      "glad",
      "sad",
      "angry",
      "tired"
    ],
    "taskDemand": {
      "choiceCount": 4
    },
    "missingAudioCues": []
  }
];
const originals = new Map(snapshots.map(item => [item.id,item]));
export function retainPublishedV11Audio(items) {
  return items.map(item => {
    const snapshot = originals.get(item.id);
    return snapshot ? {...snapshot, itemSnapshot:snapshot} : item;
  });
}
