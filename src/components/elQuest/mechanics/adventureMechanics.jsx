import {
  LetterPressMechanic,
  SceneHuntMechanic,
  SoundGateMechanic
} from "./CodeMechanics.jsx";
import {
  SoundBoxesMechanic,
  WordMachineMechanic,
  WordWindowMechanic
} from "./WordMechanics.jsx";
import {
  CoverClueMechanic,
  LetterTraceMechanic,
  PoemSpotlightMechanic
} from "./TextMechanics.jsx";
import {
  HeartWordMechanic,
  PatternSortMechanic,
  PhraseFlowMechanic,
  WordChainMechanic
} from "./FluencyMechanics.jsx";

export const ADVENTURE_MECHANICS = Object.freeze({
  letterPair: LetterPressMechanic,
  soundGate: SoundGateMechanic,
  sceneHunt: SceneHuntMechanic,
  wordWindow: WordWindowMechanic,
  soundBoxes: SoundBoxesMechanic,
  wordMachine: WordMachineMechanic,
  poemSpotlight: PoemSpotlightMechanic,
  coverClue: CoverClueMechanic,
  letterTrace: LetterTraceMechanic,
  patternSort: PatternSortMechanic,
  wordChain: WordChainMechanic,
  phraseFlow: PhraseFlowMechanic,
  heartWord: HeartWordMechanic
});
