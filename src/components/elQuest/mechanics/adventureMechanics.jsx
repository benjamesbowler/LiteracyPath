import {
  LetterPressMechanic,
  SoundChoiceMechanic
} from "./CodeMechanics.jsx";
import {
  LetterGridMechanic,
  MissingLetterMechanic,
  PictureSearchMechanic,
  PictureWordChoiceMechanic,
  WordMemoryMechanic
} from "./SimpleMechanics.jsx";

export const ADVENTURE_MECHANICS = Object.freeze({
  letterPair: LetterPressMechanic,
  soundChoice: SoundChoiceMechanic,
  sceneHunt: PictureSearchMechanic,
  wordMemory: WordMemoryMechanic,
  letterGrid: LetterGridMechanic,
  missingLetter: MissingLetterMechanic,
  rhymePair: PictureWordChoiceMechanic,
  rhymeOdd: PictureWordChoiceMechanic,
  compoundPicture: PictureWordChoiceMechanic,
  pictureSearch: PictureSearchMechanic
});
