import {
  LetterPressMechanic,
  SoundChoiceMechanic
} from "./CodeMechanics.jsx";
import {
  LetterGridMechanic,
  MissingLetterMechanic,
  PictureSearchMechanic,
  PictureWordChoiceMechanic,
  SightWordChoiceMechanic,
  WordMemoryMechanic
} from "./SimpleMechanics.jsx";

export const ADVENTURE_MECHANICS = Object.freeze({
  letterPair: LetterPressMechanic,
  soundChoice: SoundChoiceMechanic,
  sceneHunt: PictureSearchMechanic,
  wordMemory: WordMemoryMechanic,
  sightWordChoice: SightWordChoiceMechanic,
  letterGrid: LetterGridMechanic,
  missingLetter: MissingLetterMechanic,
  rhymePair: PictureWordChoiceMechanic,
  compoundPicture: PictureWordChoiceMechanic,
  pictureSearch: PictureSearchMechanic
});
