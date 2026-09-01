import { QUEST_STOPS } from "../../../data/questSequence.js";
import { getInstructionContract } from "./instructionContracts.js";
import { SOUND_SEEKERS_CHAPTERS } from "./chapters/index.js";
import {
  SOUND_SEEKERS_WORDS,
  assertShippingPronunciationLexicon,
  getPronunciation
} from "./pronunciationLexicon.js";
import { SOUND_SEEKERS_REVIEW_SOURCE_ID } from "./reviewSequences.js";
import { createTeachSequence } from "../engine/teachSequence.js";

const TARGET_DECISION_IDS = new Set([
  "echo-search-find-source",
  "contrast-sort-place-sound",
  "memory-delivery-deliver-sound"
]);
const WORD_DECISION_IDS = new Set([
  "contrast-sort-place-decoded-word",
  "word-forge-place-tile",
  "blend-bridge-choose-meaning",
  "blend-bridge-choose-novel-meaning",
  "memory-delivery-deliver-decoded-word"
]);
const ALLOWED_HEART_ACTIVITIES = Object.freeze([
  "recognition",
  "heart_part_mapping",
  "encoding",
  "sentence_use"
]);
const HEART_ACTIVITY_SET = new Set(ALLOWED_HEART_ACTIVITIES);

function semanticLabel(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase()
    .replace(/^s\d+-/u, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function semanticList(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map(semanticLabel)
    .filter(Boolean))];
}

export function canonicalCognitiveSignature(context = {}) {
  return [
    semanticLabel(context.contentCategory),
    semanticLabel(context.activityFocus),
    semanticLabel(context.constructId),
    semanticLabel(context.decisionConstruct),
    semanticLabel(context.inputConstruct),
    semanticLabel(context.correctionConstruct),
    semanticLabel(context.physicalActionConstruct),
    semanticLabel(context.evidenceConstruct),
    semanticLabel(context.decisionModel),
    semanticLabel(context.inputPattern),
    semanticLabel(context.failureOrCorrectionModel),
    semanticLabel(context.learningConsequenceModel),
    semanticList(context.mechanicRoles).sort().join(","),
    semanticList(context.physicalActionRoles).join(",")
  ].join("|");
}

function contentBinding({ slotId, requiredActivityType, actionId, visitOwnerId = actionId, isVisitOwner = true }) {
  return Object.freeze({
    category: "heartWords",
    slotId,
    contentInstanceId: `heart-content-instance:${slotId}`,
    visitOwnerId,
    actionUseId: `${actionId}:content-use`,
    requiredActivityType,
    isVisitOwner
  });
}

const HEART_WORD_BIOME_KITS = Object.freeze({
  "seedwake-meadow": Object.freeze({ place: "Seedwake Meadow", carrier: "seed lantern", route: "dawn path", recipientRole: "meadow path keeper" }),
  "river-gardens": Object.freeze({ place: "River Gardens", carrier: "pollen ferry", route: "canal route", recipientRole: "river cargo keeper" }),
  "fossil-canyon": Object.freeze({ place: "Fossil Canyon", carrier: "amber marker", route: "fossil trail", recipientRole: "excavation trail keeper" }),
  "forge-settlement": Object.freeze({ place: "Forge Settlement", carrier: "copper gear", route: "foundry line", recipientRole: "forge instruction keeper" }),
  "glass-marsh": Object.freeze({ place: "Glass Marsh", carrier: "mirror reed", route: "glass causeway", recipientRole: "marsh route keeper" }),
  "storm-coast": Object.freeze({ place: "Storm Coast", carrier: "signal shell", route: "harbour path", recipientRole: "coast signal keeper" }),
  "lantern-forest": Object.freeze({ place: "Lantern Forest", carrier: "mothlight leaf", route: "living map", recipientRole: "forest map keeper" }),
  "star-reach": Object.freeze({ place: "Star Reach", carrier: "comet crystal", route: "sky road", recipientRole: "star road keeper" })
});

const HEART_WORD_ACTIVITY_MODELS = Object.freeze([
  Object.freeze({
    activityFocus: "recognition",
    constructId: "whole_word_identity",
    childDecision: "Find the same word.",
    decisionModel: "identify the exact whole-word match",
    inputLayer: "one printed heart-word model with controlled visual choices",
    correctionLayer: "re-show the model and compare the full letter sequence",
    learningConsequence: "whole-word identity becomes available for fluent recognition",
    mechanicRoles: ["whole-word model", "whole-word choices"],
    physical: "select the exact printed word",
    rule: "accepts only an exact whole-word match",
    consequence: "the recognized word remains visible"
  }),
  Object.freeze({
    activityFocus: "heart_part_mapping",
    constructId: "irregular_unit_location",
    childDecision: "Mark the heart part.",
    decisionModel: "locate the irregular sound-spelling unit",
    inputLayer: "one spoken and printed heart word with selectable spelling units",
    correctionLayer: "replay the word and mark the regular units before the irregular unit",
    learningConsequence: "the irregular sound-spelling mapping is stored explicitly",
    mechanicRoles: ["spoken heart word", "selectable spelling units"],
    physical: "mark the irregular spelling unit",
    rule: "responds only to the irregular sound-spelling unit",
    consequence: "the heart part gains a durable marker"
  }),
  Object.freeze({
    activityFocus: "encoding",
    constructId: "ordered_word_spelling",
    childDecision: "Build the heart word.",
    decisionModel: "construct the remembered spelling in order",
    inputLayer: "one spoken heart word with ordered slots and a constrained letter bank",
    correctionLayer: "preserve correct letters and replay the word before the open slot",
    learningConsequence: "the complete orthographic sequence is rehearsed from memory",
    mechanicRoles: ["spoken heart word", "ordered spelling slots", "letter bank"],
    physical: "place letters into ordered word slots",
    rule: "moves only when the remembered spelling is complete",
    consequence: "the encoded word becomes a reusable label"
  }),
  Object.freeze({
    activityFocus: "sentence_use",
    constructId: "connected_sentence_completion",
    childDecision: "Place the word in the sentence.",
    decisionModel: "select the heart word that completes connected meaning",
    inputLayer: "one oral illustrated sentence with a gap and controlled word choices",
    correctionLayer: "reread the full sentence and contrast the changed meaning",
    learningConsequence: "the heart word is connected to meaningful sentence use",
    mechanicRoles: ["illustrated sentence", "sentence gap", "heart-word choices"],
    physical: "place the heart word into the sentence gap",
    rule: "accepts only the heart word that completes the sentence meaning",
    consequence: "the completed sentence advances the scene"
  })
]);

const HEART_WORD_MECHANIC_RECIPES = Object.freeze([
  Object.freeze({ id: "visible-reference", decisionFrame: "commit after an always-visible reference", inputPattern: "reference stays visible beside three stable choices", correction: "point to the first differing feature before retry", progress: "open one route marker after a verified response", roles: ["persistent reference", "stable choice set"], physical: "turn one choice marker", rule: "keeps the reference visible until a choice is committed", consequence: "one route marker opens" }),
  Object.freeze({ id: "covered-delay", decisionFrame: "retrieve after a brief covered delay", inputPattern: "reference appears alone and is covered before choices arrive", correction: "uncover the reference once and restart the same delay", progress: "bank one delayed-recall token after success", roles: ["coverable reference", "delayed choice set"], physical: "lift a cover and press one choice", rule: "hides the reference before presenting the choices", consequence: "one recall token is banked" }),
  Object.freeze({ id: "moving-choice", decisionFrame: "select while choices move through one decision point", inputPattern: "choices arrive one at a time on a slow untimed track", correction: "pause the track and replay the cue beside the missed choice", progress: "move the carrier one measured step", roles: ["single decision point", "untimed moving choices"], physical: "stop the track at one choice", rule: "presents one moving choice at a time without a speed score", consequence: "the carrier moves one step" }),
  Object.freeze({ id: "near-match", decisionFrame: "choose between one correct item and one near-match", inputPattern: "one correct item and one near-match are shown as a pair", correction: "magnify the exact differing feature on both items", progress: "clear one false trail before opening the true trail", roles: ["near-match pair", "difference lens"], physical: "select one item from the pair", rule: "keeps both candidates visible until one response is committed", consequence: "the false trail closes" }),
  Object.freeze({ id: "memory-grid", decisionFrame: "recover one learned response from a memory grid", inputPattern: "one relevant response is hidden among controlled distractors", correction: "restore the original cue above the unchanged grid", progress: "store one completed match in a visible collection", roles: ["memory grid", "retained cue card"], physical: "select one response card", rule: "uses one selectable response per attempt", consequence: "one memory match joins the collection" }),
  Object.freeze({ id: "route-fork", decisionFrame: "choose a branch only after inspecting both route labels", inputPattern: "two route labels sit at one untimed fork", correction: "return to the fork and replay the cue above both labels", progress: "open one correct route segment", roles: ["route fork", "paired route labels"], physical: "move a route token onto one branch", rule: "holds both branches closed until their labels have been inspected", consequence: "one route segment opens" }),
  Object.freeze({ id: "fixed-zones", decisionFrame: "place one response before the next response appears", inputPattern: "one response appears above fixed destination zones", correction: "return the response and show the contrast cue between destinations", progress: "fill one cell in a placement meter", roles: ["single presented response", "fixed destination zones"], physical: "place one response into its destination", rule: "reveals the next response only after the current placement", consequence: "one meter cell fills" }),
  Object.freeze({ id: "station-route", decisionFrame: "complete the current station in a visible route", inputPattern: "the target appears at one active numbered station", correction: "retry only the active station while earlier stations remain complete", progress: "preserve each completed station on a route strip", roles: ["active numbered station", "persistent route strip"], physical: "complete one station response", rule: "shows only one active station decision at a time", consequence: "one station locks into the route strip" }),
  Object.freeze({ id: "fading-cue", decisionFrame: "respond after the cue fades from view", inputPattern: "the cue fades gradually before a stable response field appears", correction: "restore the cue at full strength and repeat the fade", progress: "light one memory beacon", roles: ["fading cue", "stable response field"], physical: "select one response after the fade", rule: "waits for the cue to fade before a response can be selected", consequence: "one memory beacon lights" }),
  Object.freeze({ id: "minimal-contrast", decisionFrame: "discriminate between two minimally different candidates", inputPattern: "two near-matches differ at one instruction-relevant feature", correction: "isolate and name the differing feature before retry", progress: "award one precision marker", roles: ["minimal contrast pair", "feature marker"], physical: "place one marker under one candidate", rule: "holds the response until the decisive feature is inspected", consequence: "one precision marker is awarded" }),
  Object.freeze({ id: "changed-view", decisionFrame: "recover the target across a controlled before-and-after view", inputPattern: "a worked view closes and returns with one controlled change", correction: "replay the before-and-after views side by side", progress: "repair the changed display", roles: ["before view", "changed view"], physical: "respond to one changed display", rule: "changes exactly one construct-relevant feature between views", consequence: "the changed display is repaired" }),
  Object.freeze({ id: "complete-cue-gate", decisionFrame: "wait for a complete cue before responses unlock", inputPattern: "responses remain covered until the full visual and spoken cue finishes", correction: "replay the complete cue without shortening it", progress: "earn one attentive-listening seal", roles: ["complete multimodal cue", "locked response field"], physical: "select one response after the cue", rule: "prevents a response before the complete cue has played", consequence: "one listening seal appears" }),
  Object.freeze({ id: "constrained-frame", decisionFrame: "complete a response in a constrained frame", inputPattern: "only construct-relevant responses and one diagnostic distractor are available", correction: "retain the confirmed response state and return the same distractor", progress: "assemble one durable record", roles: ["constrained response bank", "response frame"], physical: "place one response into the frame", rule: "keeps confirmed response state fixed during repair", consequence: "one durable record is stored" }),
  Object.freeze({ id: "purposeful-blank", decisionFrame: "complete one purposeful blank in a worked example", inputPattern: "a nearly complete example exposes one construct-relevant blank", correction: "highlight the adjacent anchor without filling the blank", progress: "complete one bridge segment", roles: ["worked example", "single purposeful blank"], physical: "place one response into the blank", rule: "accepts only the response supported by the adjacent anchor", consequence: "one bridge segment completes" }),
  Object.freeze({ id: "proposal-check", decisionFrame: "inspect one proposal before choosing the supported response", inputPattern: "one proposed response appears beside one controlled alternative", correction: "show one counterexample and return the same choices", progress: "stamp one independently verified response", roles: ["proposed response", "controlled alternative"], physical: "select one supported response", rule: "requires the proposal to be inspected before commitment", consequence: "one verified-response stamp appears" }),
  Object.freeze({ id: "separated-stations", decisionFrame: "combine a separated cue stage and response stage", inputPattern: "the cue appears at one station and responses at a second nearby station", correction: "return to the cue station while preserving the same responses", progress: "extend one two-station route", roles: ["cue station", "response station"], physical: "commit one response at the second station", rule: "separates cue inspection from response commitment", consequence: "one two-station route extends" }),
  Object.freeze({ id: "intervening-animation", decisionFrame: "retrieve after one neutral system animation", inputPattern: "a neutral animation occurs between the cue and stable responses", correction: "remove the animation and replay the original sequence", progress: "store one interference-resistant memory token", roles: ["initial cue", "neutral system animation", "delayed responses"], physical: "select one response after the animation", rule: "lets the system insert one neutral event before the response", consequence: "one durable memory token is stored" }),
  Object.freeze({ id: "changed-presentation", decisionFrame: "identify the same learning target in a changed presentation", inputPattern: "the target returns with a controlled change of size case or layout", correction: "align the two presentations and expose their invariant feature", progress: "connect two presentation nodes", roles: ["original presentation", "changed presentation"], physical: "select one response in the changed presentation", rule: "changes presentation while preserving the learning target", consequence: "two representation nodes connect" }),
  Object.freeze({ id: "broken-sample", decisionFrame: "repair one construct-relevant error in a worked sample", inputPattern: "one worked sample contains exactly one construct-relevant error", correction: "mark the first mismatch while leaving the response to the child", progress: "restore one broken mechanism", roles: ["broken worked sample", "single repair response"], physical: "place one corrective response", rule: "contains one visible error with one response point", consequence: "one mechanism returns to working order" }),
  Object.freeze({ id: "transfer-context", decisionFrame: "apply the same decision in one new connected context", inputPattern: "a completed model is followed by one structurally matched new context", correction: "return briefly to the model and map its construct onto the new context", progress: "unlock one transfer badge", roles: ["completed model", "matched transfer context"], physical: "place one response in the new context", rule: "requires the same construct to transfer beyond the worked model", consequence: "one transfer badge unlocks" })
]);

function heartVariant(inputPattern, correction, physical) {
  return Object.freeze({ inputPattern, correction, physical });
}

const HEART_WORD_ACTIVITY_COMPATIBILITY_MATRIX = Object.freeze([
  ["visible-reference", {
    recognition: heartVariant("the complete printed model stays visible beside three complete-word choices", "align the model with the selected whole word and expose the first differing letter", "turn one marker under the exact printed word"),
    heart_part_mapping: heartVariant("the spoken and printed word stays visible with each spelling unit selectable", "replay the word and illuminate every regular unit around the heart part", "turn one marker under the irregular spelling unit"),
    encoding: heartVariant("the spoken word cue stays available above ordered spelling slots and a letter bank", "pin each correct letter and replay the spoken word for the open slot", "turn one letter tile into the next ordered slot"),
    sentence_use: heartVariant("the illustrated sentence stays visible with one gap and complete-word choices", "reread the full sentence and contrast the meaning made by each word choice", "turn one heart-word tile into the sentence gap")
  }],
  ["covered-delay", {
    recognition: heartVariant("the complete printed model is briefly covered before complete-word choices appear", "uncover the same complete word above the unchanged choices", "press the exact printed word after the cover closes"),
    heart_part_mapping: heartVariant("the pronunciation cue is covered while the printed word remains divided into selectable units", "uncover the pronunciation cue above the unchanged spelling units", "mark the irregular spelling unit after the cover closes"),
    encoding: heartVariant("the spoken word cue is briefly covered before ordered slots and letter choices appear", "uncover the same spoken-word cue while retaining confirmed letters", "place the next remembered letter into its ordered slot"),
    sentence_use: heartVariant("the illustrated sentence is briefly covered before its gap and word choices appear", "uncover the same sentence above the unchanged complete-word choices", "place the heart word into the remembered sentence gap")
  }],
  ["moving-choice", {
    recognition: heartVariant("complete printed words move one at a time past the stationary whole-word model", "pause the track with the model beside the same complete-word candidate", "stop the exact printed word at the decision point"),
    heart_part_mapping: heartVariant("one unit focus moves slowly across the visible spoken and printed heart word", "pause the focus and replay the sound for the same spelling unit", "stop the focus on the irregular spelling unit"),
    encoding: heartVariant("letter candidates move one at a time past the next open ordered spelling slot", "pause the current candidate and replay the sound for the same open slot", "stop the correct letter inside the next ordered slot"),
    sentence_use: heartVariant("complete-word choices move one at a time beneath one visible illustrated sentence gap", "pause the current word and reread the full sentence with that choice", "stop the heart word beneath the sentence gap")
  }],
  ["near-match", {
    recognition: heartVariant("one exact whole-word match and one complete near-match appear beside the model", "align both complete words with the model and expose the differing letter", "select the exact whole-word match from the pair"),
    heart_part_mapping: heartVariant("two highlighted units appear inside the same spoken and printed heart word", "replay both unit sounds and illuminate the regular comparison unit", "select the irregular spelling unit from the pair"),
    encoding: heartVariant("two letter candidates appear for the same next ordered spelling slot", "replay the slot sound and retain every earlier correct letter", "place the correct letter into the next ordered slot"),
    sentence_use: heartVariant("two complete heart words appear beneath the same illustrated sentence gap", "reread the sentence with each complete word and contrast the meanings", "place the meaning-matching heart word into the gap")
  }],
  ["memory-grid", {
    recognition: heartVariant("a briefly shown whole-word model is followed by selectable complete-word pair cards", "restore the model above the same complete-word pair cards", "select the pair card carrying the exact whole word"),
    heart_part_mapping: heartVariant("a spoken and printed word is followed by a grid of its selectable unit cards", "restore the full word above the same unit-card grid", "select the card carrying the irregular spelling unit"),
    encoding: heartVariant("the spoken word is followed by one active row of letter cards for the next ordered slot", "restore the spoken cue and retain every completed spelling row", "place one letter card into the next ordered slot"),
    sentence_use: heartVariant("an illustrated sentence is followed by a grid of complete-word cards for its single gap", "restore the full sentence above the same complete-word grid", "place one heart-word card into the sentence gap")
  }],
  ["route-fork", {
    recognition: heartVariant("two branches carry complete printed words beside one whole-word model", "return the route token and align both complete branch labels with the model", "move the token onto the exact whole-word branch"),
    heart_part_mapping: heartVariant("two branches highlight different units inside one spoken and printed heart word", "return the token and replay the sound for each highlighted unit", "move the token onto the irregular-unit branch"),
    encoding: heartVariant("two branches carry letter candidates for one next ordered spelling slot", "return the token and replay the sound for the unchanged open slot", "move the correct letter onto the next spelling branch"),
    sentence_use: heartVariant("two branches carry complete words beneath one illustrated sentence gap", "return the token and reread the sentence with both branch words", "move the token onto the meaning-matching word branch")
  }],
  ["fixed-zones", {
    recognition: heartVariant("one complete word appears above fixed exact-match and nonmatch zones beside the model", "return the complete word and compare its full letter sequence with the model", "place the complete word into the exact-match zone"),
    heart_part_mapping: heartVariant("one highlighted unit appears above fixed regular and heart-part zones inside the full word", "return the unit and replay its sound beside both mapping zones", "place the irregular unit into the heart-part zone"),
    encoding: heartVariant("one letter candidate appears above the next ordered spelling slot and a discard zone", "return the letter and replay the sound for the unchanged open slot", "place the correct letter into the next ordered slot"),
    sentence_use: heartVariant("one complete heart word appears above a sentence gap and a meaning-mismatch zone", "return the word and reread the complete sentence meaning", "place the meaning-matching word into the sentence gap")
  }],
  ["station-route", {
    recognition: heartVariant("the active station shows one whole-word model with complete-word choices", "keep earlier stations complete and restore the same whole-word model", "tap the exact complete word at the active station"),
    heart_part_mapping: heartVariant("the active station shows one spoken and printed word with selectable units", "keep earlier stations complete and replay the same word at the active station", "mark the irregular spelling unit at the active station"),
    encoding: heartVariant("the active station shows one spoken word with ordered slots and a letter bank", "keep earlier stations complete and retain correct letters at the active station", "place the next letter at the active spelling station"),
    sentence_use: heartVariant("the active station shows one illustrated sentence gap with complete-word choices", "keep earlier stations complete and reread the same sentence at the active station", "place the heart word at the active sentence station")
  }],
  ["fading-cue", {
    recognition: heartVariant("the complete printed model fades before stable complete-word choices appear", "restore the complete model at full strength above the same choices", "touch the exact printed word after the model fades"),
    heart_part_mapping: heartVariant("the spoken emphasis fades while the printed word remains divided into selectable units", "restore the spoken emphasis for the same visible spelling units", "touch the irregular spelling unit after the cue fades"),
    encoding: heartVariant("the spoken word cue fades before ordered spelling slots and letter choices appear", "restore the same spoken cue while retaining every correct letter", "place the next letter after the spoken cue fades"),
    sentence_use: heartVariant("the oral illustrated sentence fades before its printed gap and word choices appear", "restore the same full sentence above the unchanged choices", "place the heart word after the sentence cue fades")
  }],
  ["minimal-contrast", {
    recognition: heartVariant("two complete words differ by one letter beside the exact whole-word model", "isolate the differing letter while keeping both complete words visible", "place the marker under the exact whole-word match"),
    heart_part_mapping: heartVariant("two units in one heart word differ in mapping status", "replay each unit sound and expose the regular comparison mapping", "place the marker under the irregular spelling unit"),
    encoding: heartVariant("two letter candidates differ at one feature for the same open spelling slot", "replay the open-slot sound while keeping both letters visible", "place the correct letter into the open spelling slot"),
    sentence_use: heartVariant("two complete heart words create different meanings in one sentence gap", "reread both complete sentence meanings while keeping both words visible", "place the marker under the meaning-matching heart word")
  }],
  ["changed-view", {
    recognition: heartVariant("the model view closes and returns with one complete word changed among whole-word choices", "show the before-and-after complete-word views side by side", "tap the unchanged exact whole word in the returned view"),
    heart_part_mapping: heartVariant("the word view closes and returns with regular units faded around one unchanged irregular unit", "show both unit views and replay the same spoken word", "mark the irregular spelling unit in the returned view"),
    encoding: heartVariant("the spelling view closes and returns with one ordered letter slot open", "show both spelling views and retain every unchanged correct letter", "place the missing letter into the returned spelling"),
    sentence_use: heartVariant("the sentence view closes and returns with one heart word removed from its gap", "show both sentence views and reread the unchanged connected meaning", "place the missing heart word into the returned sentence")
  }],
  ["complete-cue-gate", {
    recognition: heartVariant("complete-word choices remain locked until the full printed and spoken word model finishes", "replay the complete whole-word cue before unlocking the same choices", "select the exact printed word after the gate opens"),
    heart_part_mapping: heartVariant("spelling units remain locked until the full spoken and printed heart word finishes", "replay the complete word before unlocking the same unit choices", "mark the irregular spelling unit after the gate opens"),
    encoding: heartVariant("ordered slots remain locked until the full spoken word cue finishes", "replay the complete spoken word before unlocking the same letter bank", "place the next letter after the spelling gate opens"),
    sentence_use: heartVariant("complete-word choices remain locked until the full oral illustrated sentence finishes", "replay the complete sentence before unlocking the same words", "place the heart word after the sentence gate opens")
  }],
  ["constrained-frame", {
    recognition: heartVariant("a whole-word frame offers complete printed choices and one diagnostic near-match", "pin the exact whole-word model above the unchanged complete choices", "fit the exact complete word into the whole-word frame"),
    heart_part_mapping: heartVariant("a unit frame exposes all units in one spoken and printed word", "pin the regular mappings while leaving every unit selectable", "fit the marker onto the irregular spelling unit"),
    encoding: heartVariant("an ordered spelling frame offers target letters and one diagnostic distractor", "pin each correct letter while returning the same distractor", "fit the next letter into the ordered spelling frame"),
    sentence_use: heartVariant("a sentence frame offers complete heart words and one meaning distractor for its gap", "pin the full sentence meaning above the unchanged word choices", "fit the heart word into the sentence frame")
  }],
  ["purposeful-blank", {
    recognition: heartVariant("a matching board leaves one whole-word place empty beside the complete printed model", "highlight the full model without filling the whole-word place", "place the exact complete word into the matching blank"),
    heart_part_mapping: heartVariant("a full spoken and printed word exposes one selectable mapping position", "highlight the regular units without marking the irregular position", "mark the irregular spelling position in the word"),
    encoding: heartVariant("a complete spelling frame exposes one next ordered letter slot", "highlight the neighboring sound slot without filling the open letter position", "place the correct letter into the spelling blank"),
    sentence_use: heartVariant("an illustrated connected sentence exposes one complete-word gap", "reread the surrounding sentence without filling the word gap", "place the heart word into the sentence blank")
  }],
  ["proposal-check", {
    recognition: heartVariant("one proposed complete-word match appears beside one controlled complete-word alternative", "align both full words with the exact whole-word model", "select the proposal carrying the exact whole word"),
    heart_part_mapping: heartVariant("one proposed heart-part marker appears beside one alternative unit in the full word", "replay both unit sounds without moving either marker", "mark the true irregular spelling unit"),
    encoding: heartVariant("one proposed letter appears beside one alternative for the next ordered spelling slot", "replay the open-slot sound while retaining every earlier letter", "place the correct proposed letter into the spelling"),
    sentence_use: heartVariant("one proposed heart word appears beside one alternative beneath the sentence gap", "reread the sentence with each proposal and contrast the meanings", "place the supported heart word into the sentence")
  }],
  ["separated-stations", {
    recognition: heartVariant("the whole-word model appears at the cue station and complete-word choices at the response station", "return the same complete model while preserving every response word", "select the exact printed word at the response station"),
    heart_part_mapping: heartVariant("the spoken word appears at the cue station and its printed units at the response station", "return the same spoken cue while preserving every printed unit", "mark the irregular spelling unit at the response station"),
    encoding: heartVariant("the spoken word appears at the cue station and ordered slots at the response station", "return the same spoken cue while preserving every placed letter", "place the next letter at the spelling station"),
    sentence_use: heartVariant("the oral illustrated sentence appears at the cue station and word choices at the response station", "return the same sentence while preserving every complete-word choice", "place the heart word at the sentence station")
  }],
  ["intervening-animation", {
    recognition: heartVariant("a complete word model appears before a neutral system animation and stable whole-word choices", "remove the animation and restore the same complete-word sequence", "select the exact printed word after the animation"),
    heart_part_mapping: heartVariant("a spoken and printed word appears before a neutral system animation and selectable units", "remove the animation and restore the same spoken-unit sequence", "mark the irregular spelling unit after the animation"),
    encoding: heartVariant("a spoken word appears before a neutral system animation and ordered spelling slots", "remove the animation and restore the same spoken-word sequence", "place the next letter after the animation"),
    sentence_use: heartVariant("an oral illustrated sentence appears before a neutral system animation and word choices", "remove the animation and restore the same connected sentence", "place the heart word into the sentence after the animation")
  }],
  ["changed-presentation", {
    recognition: heartVariant("the same complete word returns with a controlled change of case size or typeface", "align both full-word presentations and expose their identical letter sequence", "link the exact word across the changed presentation"),
    heart_part_mapping: heartVariant("the same heart word returns in a changed case size or unit layout", "align both word presentations and replay the same irregular mapping", "mark the irregular unit in the changed presentation"),
    encoding: heartVariant("the spoken word returns with a changed letter-bank layout and the same ordered slots", "restore the original layout while retaining the same spelling sequence", "place the next letter in the changed spelling layout"),
    sentence_use: heartVariant("the same sentence meaning returns in a changed illustration and line layout", "align both sentence presentations and reread their shared meaning", "place the heart word in the changed sentence layout")
  }],
  ["broken-sample", {
    recognition: heartVariant("a worked whole-word match contains one complete near-match beside the exact model", "mark the first differing letter while keeping both complete words selectable", "replace the near-match with the exact complete word"),
    heart_part_mapping: heartVariant("a worked heart word marks one regular unit instead of its irregular unit", "replay the full word while leaving the corrected marker to the child", "move the marker onto the irregular spelling unit"),
    encoding: heartVariant("a worked spelling contains one incorrect letter in an ordered slot", "mark the first mismatching slot while retaining every correct letter", "replace the incorrect letter in the ordered spelling"),
    sentence_use: heartVariant("a worked sentence contains one complete heart word that breaks its connected meaning", "reread the changed meaning while leaving the word replacement to the child", "replace the wrong word in the sentence gap")
  }],
  ["transfer-context", {
    recognition: heartVariant("a completed whole-word match is followed by the same complete word in a new visual context", "return to the model and align its full letter sequence with the new context", "select the exact whole word in the new context"),
    heart_part_mapping: heartVariant("a completed heart-part map is followed by the same word in a new visual context", "return to the model and replay its irregular sound-spelling unit", "mark the irregular unit in the new context"),
    encoding: heartVariant("a completed spelling model is followed by an empty ordered label in a new context", "return to the model and map its sound order onto the new label", "place the next letter in the new spelling context"),
    sentence_use: heartVariant("a completed sentence model is followed by one new connected sentence with a word gap", "return to the model and map its meaning role onto the new sentence", "place the heart word in the new sentence context")
  }]
].map(([mechanicFamilyId, variants]) => Object.freeze({
  mechanicFamilyId,
  variants: Object.freeze(variants)
})));

const HEART_WORD_MECHANIC_BY_ID = new Map(HEART_WORD_MECHANIC_RECIPES.map(recipe => [recipe.id, recipe]));
const HEART_WORD_ACTIVITY_BY_FOCUS = new Map(HEART_WORD_ACTIVITY_MODELS.map(activity => [activity.activityFocus, activity]));

const HEART_WORD_PLAY_CONFIGURATIONS = Object.freeze(HEART_WORD_ACTIVITY_COMPATIBILITY_MATRIX.flatMap(entry => {
  const recipe = HEART_WORD_MECHANIC_BY_ID.get(entry.mechanicFamilyId);
  if (!recipe) throw new Error(`${entry.mechanicFamilyId}: missing heart-word mechanic frame`);
  const variantKeys = Object.keys(entry.variants).sort();
  if (variantKeys.length !== ALLOWED_HEART_ACTIVITIES.length
    || variantKeys.some((key, index) => key !== [...ALLOWED_HEART_ACTIVITIES].sort()[index])) {
    throw new Error(`${entry.mechanicFamilyId}: compatibility matrix needs all four heart-word activities`);
  }
  return ALLOWED_HEART_ACTIVITIES.map(activityFocus => {
    const activity = HEART_WORD_ACTIVITY_BY_FOCUS.get(activityFocus);
    const variant = entry.variants[activityFocus];
    return Object.freeze({
      contentCategory: "heartWords",
      mechanicFamilyId: entry.mechanicFamilyId,
      activityFocus,
      constructId: activity.constructId,
      decisionConstruct: activity.constructId,
      inputConstruct: activity.constructId,
      correctionConstruct: activity.constructId,
      physicalActionConstruct: activity.constructId,
      evidenceConstruct: activity.constructId,
      childDecision: activity.childDecision,
      decisionModel: `${activity.decisionModel}; ${recipe.decisionFrame}`,
      inputPattern: `${activity.inputLayer}; ${variant.inputPattern}`,
      failureOrCorrectionModel: `${activity.correctionLayer}; ${variant.correction}`,
      learningConsequenceModel: `${activity.learningConsequence}; ${recipe.progress}`,
      mechanicRoles: Object.freeze([...activity.mechanicRoles, ...recipe.roles]),
      physicalActionRoles: Object.freeze([semanticLabel(variant.physical)]),
      rule: `${activity.rule}; it ${recipe.rule}`,
      objects: Object.freeze([...activity.mechanicRoles, ...recipe.roles]),
      physical: variant.physical,
      consequence: `${activity.consequence}; ${recipe.consequence}`
    });
  });
}));

const HEART_WORD_PLAY_CONFIGURATION_BY_KEY = new Map(HEART_WORD_PLAY_CONFIGURATIONS.map(configuration => [
  `${configuration.mechanicFamilyId}:${configuration.activityFocus}`,
  configuration
]));

if (HEART_WORD_PLAY_CONFIGURATIONS.length !== 80) {
  throw new Error("Sound Seekers needs four coherent activities across twenty heart-word mechanic recipes");
}

const STORY_TRANSFER_ACTIVITY_MODELS = Object.freeze([
  Object.freeze({
    decisionModel: "select the repair action supported by the decoded scene",
    inputLayer: "one controlled scene followed by one repair and one plausible decoy",
    correctionLayer: "reread the action phrase and compare both visible consequences",
    learningConsequence: "connected text controls a meaningful world action",
    mechanicRoles: ["controlled scene", "supported repair", "plausible decoy"]
  }),
  Object.freeze({
    decisionModel: "reject the contradicted action before confirming the supported repair",
    inputLayer: "one controlled scene with paired actions shown before commitment",
    correctionLayer: "mark the contradicted detail and return both actions unchanged",
    learningConsequence: "sentence evidence rules out a plausible wrong action",
    mechanicRoles: ["controlled scene", "contradicted action", "supported repair"]
  })
]);

const STORY_TRANSFER_CONFIGURATIONS = Object.freeze(HEART_WORD_MECHANIC_RECIPES.flatMap(recipe =>
  STORY_TRANSFER_ACTIVITY_MODELS.map(model => Object.freeze({
    activityFocus: "connected_story_choice",
    decisionModel: `${model.decisionModel}; ${recipe.decisionFrame}`,
    inputPattern: `${model.inputLayer}; ${recipe.inputPattern}`,
    failureOrCorrectionModel: `${model.correctionLayer}; ${recipe.correction}`,
    learningConsequenceModel: `${model.learningConsequence}; ${recipe.progress}`,
    mechanicRoles: Object.freeze([...model.mechanicRoles, ...recipe.roles]),
    physicalActionRoles: Object.freeze(["read", "manipulate", semanticLabel(recipe.decisionFrame)])
  }))
));
const WONDER_REPRESENTATION_BY_CHAPTER = Object.freeze({
  "seedwake-meadow": "sound-to-light-ripple",
  "river-gardens": "classified-cargo-restores-waterflow",
  "fossil-canyon": "blended-segments-draw-a-trail-line",
  "forge-settlement": "grapheme-boxes-turn-forge-gears",
  "glass-marsh": "contrast-pairs-reveal-the-safe-path",
  "storm-coast": "remembered-cues-align-the-storm-lens",
  "lantern-forest": "read-phrases-grow-the-living-map",
  "star-reach": "six-sound-powers-join-a-constellation"
});

const DEFAULT_ACTION_MECHANICS = Object.freeze({
  "echo-search-find-source": Object.freeze({ activityFocus: "sound_source_search", decisionModel: "locate the printed source of a heard phoneme", inputPattern: "one heard phoneme with controlled grapheme-bearing choices", failureOrCorrectionModel: "replay the phoneme and preserve the same choice field", learningConsequenceModel: "record one phoneme-to-grapheme retrieval", mechanicRoles: ["heard phoneme cue", "grapheme-bearing choices"] }),
  "contrast-sort-place-sound": Object.freeze({ activityFocus: "sound_contrast_sort", decisionModel: "classify a heard phoneme against controlled sound contrasts", inputPattern: "one heard phoneme token with fixed contrast zones", failureOrCorrectionModel: "replay target and contrast cues before returning the same token", learningConsequenceModel: "record one phoneme contrast classification", mechanicRoles: ["heard phoneme token", "sound contrast zones"] }),
  "contrast-sort-place-decoded-word": Object.freeze({ activityFocus: "decoded_word_sort", decisionModel: "decode a word before classifying its pattern or meaning", inputPattern: "one controlled printed word with fixed classification choices", failureOrCorrectionModel: "reblend the word and contrast the two classification labels", learningConsequenceModel: "record one decoded-word classification", mechanicRoles: ["controlled printed word", "word classification choices"] }),
  "contrast-sort-place-heart-word": Object.freeze({ activityFocus: "heart_part_mapping", decisionModel: "locate and classify an irregular heart-word mapping", inputPattern: "one heart-word instance with selectable spelling units and pattern destinations", failureOrCorrectionModel: "replay the word and mark regular units before retrying the heart part", learningConsequenceModel: "record one explicit irregular sound-spelling mapping", mechanicRoles: ["heart-word instance", "selectable spelling units", "pattern destinations"] }),
  "word-forge-place-tile": Object.freeze({ activityFocus: "word_encoding", decisionModel: "construct a controlled word in phoneme-grapheme order", inputPattern: "one spoken word with ordered slots and a constrained grapheme bank", failureOrCorrectionModel: "retain correct graphemes and replay the phoneme for the open slot", learningConsequenceModel: "record one complete grapheme sequence", mechanicRoles: ["spoken controlled word", "ordered sound slots", "grapheme bank"] }),
  "blend-bridge-choose-meaning": Object.freeze({ activityFocus: "word_meaning_choice", decisionModel: "blend a controlled word before selecting its familiar meaning", inputPattern: "one segmentable printed word with controlled meaning choices", failureOrCorrectionModel: "reblend continuously and contrast the selected meaning with the decoded word", learningConsequenceModel: "record one controlled decoding-to-meaning decision", mechanicRoles: ["segmentable printed word", "controlled meaning choices"] }),
  "blend-bridge-choose-novel-meaning": Object.freeze({ activityFocus: "novel_word_meaning_choice", decisionModel: "independently blend a novel controlled word before selecting meaning", inputPattern: "one unmodelled decodable word with controlled meaning choices", failureOrCorrectionModel: "reveal sound-unit boundaries without supplying the decoded answer", learningConsequenceModel: "record one novel decoding transfer", mechanicRoles: ["novel decodable word", "controlled meaning choices"] }),
  "memory-delivery-deliver-sound": Object.freeze({ activityFocus: "sound_memory_delivery", decisionModel: "retain a heard phoneme across movement before delivering its spelling", inputPattern: "one heard phoneme cue separated from grapheme destinations", failureOrCorrectionModel: "return to the sound cue while preserving the same destinations", learningConsequenceModel: "record one delayed phoneme-to-grapheme retrieval", mechanicRoles: ["heard phoneme cue", "separated grapheme destinations"] }),
  "memory-delivery-deliver-decoded-word": Object.freeze({ activityFocus: "decoded_word_memory_delivery", decisionModel: "retain a decoded word across movement before delivering it", inputPattern: "one controlled printed word separated from meaning destinations", failureOrCorrectionModel: "return to the printed word and reblend before repeating the route", learningConsequenceModel: "record one delayed decoded-word retrieval", mechanicRoles: ["controlled printed word", "separated meaning destinations"] }),
  "memory-delivery-deliver-heart-word": Object.freeze({ activityFocus: "heart_word_memory_delivery", decisionModel: "retain a heart-word identity across movement before delivery", inputPattern: "one heart-word instance separated from a controlled destination", failureOrCorrectionModel: "return to the word and inspect its heart part before repeating the route", learningConsequenceModel: "record one delayed heart-word retrieval", mechanicRoles: ["heart-word instance", "separated delivery destination"] }),
  "memory-delivery-follow-decoded-instruction": Object.freeze({ activityFocus: "decoded_instruction_memory", decisionModel: "decode and retain one instruction before carrying it out", inputPattern: "one controlled written instruction separated from its action site", failureOrCorrectionModel: "return to the instruction and reread without changing the action site", learningConsequenceModel: "record one connected-text instruction transfer", mechanicRoles: ["controlled written instruction", "separated action site"] }),
  "story-power-choose-story-action": Object.freeze({ activityFocus: "connected_story_choice", decisionModel: "decode a connected scene before selecting its meaningful action", inputPattern: "one controlled scene with a repair action and a plausible decoy", failureOrCorrectionModel: "reread the sentence and compare each action consequence", learningConsequenceModel: "record one connected-text meaning transfer", mechanicRoles: ["controlled scene", "repair action", "plausible action decoy"] })
});

const PHYSICAL_ACTION_WORDS = new Set([
  "across", "along", "around",
  "angle", "attach", "balance", "blend", "brush", "build", "carry", "choose", "climb", "cross", "deliver",
  "down", "drag", "drop", "fit", "flip", "follow", "from", "hammer", "hook", "hum", "into", "jump", "lift", "load", "lock", "manipulate",
  "glide", "mark", "move", "open", "orbit", "perform", "place", "play", "pole", "pour", "press", "pull", "pump", "push", "read", "reveal",
  "ring", "roll", "rotate", "scan", "seat", "set", "slide", "snap", "sort", "stamp", "step", "strike", "sweep", "tap",
  "swing", "test", "through", "to", "toss", "trace", "turn", "under", "up", "wade", "walk", "wipe"
]);

const DIRECT_ACTION_START = /^(?:hear|listen|find|choose|place|build|blend|read|carry|deliver|sort|match|tap|finish|set|follow|remember|put|inspect|perform|move|select|write|spell|complete|mark|cover|reveal|trace|drag|turn|point|say|uncover|step|send|guide|make|fill)\b/iu;

function physicalActionRoles(value) {
  const actions = semanticLabel(value).split(" ").filter(token => PHYSICAL_ACTION_WORDS.has(token));
  return Object.freeze(actions.length > 0 ? actions : ["manipulate"]);
}

function directDecisionSteps(value) {
  const source = String(value || "").trim().replace(/[.!?]+$/u, "");
  if (!source) throw new Error("authored action needs a child decision");
  if (/^choose and place\b/iu.test(source)) {
    return Object.freeze(["Choose one sound tile.", "Place the tile in the next word slot."]);
  }
  const clauses = source
    .replace(/,\s*(?:and|then)\s+/giu, ", ")
    .replace(/\s+(?:and|then)\s+/giu, ", ")
    .split(/\s*,\s*/u)
    .map(clause => clause.trim())
    .filter(Boolean)
    .map(clause => clause.replace(/^travel\b/iu, "Move"))
    .map(clause => `${clause.charAt(0).toLocaleUpperCase()}${clause.slice(1)}.`);
  for (const step of clauses) {
    if (!DIRECT_ACTION_START.test(step)) throw new Error(`${step}: visible decision step needs one direct action`);
  }
  return Object.freeze(clauses);
}

function authoredAction(
  instructionId,
  contextId,
  semanticRule,
  childDecision,
  objectIds,
  physicalExpression,
  consequenceId,
  {
    targetId = null,
    wordId = null,
    recipientId = null,
    objectRoles = objectIds.map(semanticLabel),
    recipientRole = recipientId ? "mission resident" : null,
    consequence = semanticLabel(consequenceId),
    contentBinding: authoredContentBinding = null,
    activityFocus = null,
    decisionModel = null,
    inputPattern = null,
    failureOrCorrectionModel = null,
    learningConsequenceModel = null,
    mechanicRoles = null,
    physicalActionRoles: authoredPhysicalActionRoles = null,
    contentCategory = null,
    mechanicFamilyId = null,
    constructId = null,
    decisionConstruct = null,
    inputConstruct = null,
    correctionConstruct = null,
    physicalActionConstruct = null,
    evidenceConstruct = null
  } = {}
) {
  const defaults = DEFAULT_ACTION_MECHANICS[instructionId];
  if (!defaults) throw new Error(`${instructionId}: missing theme-independent action mechanics`);
  const decisionSteps = directDecisionSteps(childDecision);
  return Object.freeze({
    instructionId,
    contextId,
    semanticRule,
    childDecision: decisionSteps[0],
    decisionSteps,
    objectIds: Object.freeze([...objectIds]),
    objectRoles: Object.freeze([...objectRoles]),
    recipientId,
    recipientRole,
    physicalExpression,
    consequenceId,
    consequence,
    targetId,
    wordId,
    contentBinding: authoredContentBinding,
    activityFocus: activityFocus || defaults.activityFocus,
    decisionModel: decisionModel || defaults.decisionModel,
    inputPattern: inputPattern || defaults.inputPattern,
    failureOrCorrectionModel: failureOrCorrectionModel || defaults.failureOrCorrectionModel,
    learningConsequenceModel: learningConsequenceModel || defaults.learningConsequenceModel,
    mechanicRoles: Object.freeze([...(mechanicRoles || defaults.mechanicRoles)]),
    physicalActionRoles: Object.freeze([...(authoredPhysicalActionRoles || physicalActionRoles(physicalExpression))]),
    contentCategory,
    mechanicFamilyId,
    constructId,
    decisionConstruct,
    inputConstruct,
    correctionConstruct,
    physicalActionConstruct,
    evidenceConstruct
  });
}

const A = authoredAction;

const EXPEDITION_BLUEPRINTS = Object.freeze([
  { stopId: "s1", title: "Wake the Seed Lanterns", residentId: "Moss", problemId: "seed-lanterns-dark", previewId: "seedwake-path-dark", relationshipBeatId: "seedwake-s1-moss-trust", consequenceId: "seedwake-path-lit" },
  { stopId: "s2", title: "Rebuild the Fern-Step Song", residentId: "Tumble", problemId: "fern-step-notes-scattered", previewId: "fern-path-broken", relationshipBeatId: "seedwake-s2-tumble-partnership", consequenceId: "fern-steps-sing" },
  { stopId: "s3", title: "Turn the Rook Wind Stones", residentId: "Bramble", problemId: "rook-stones-still", previewId: "rook-hill-windless", relationshipBeatId: "seedwake-s3-bramble-curiosity", consequenceId: "rook-stones-turn" },
  { stopId: "s4", title: "Raise the Otter Ford", residentId: "Tumble", problemId: "otter-ford-submerged", previewId: "meadow-crossing-closed", relationshipBeatId: "seedwake-s4-tumble-confidence", consequenceId: "otter-ford-open" },
  { stopId: "s5", title: "Open Bramble Gate", residentId: "Bramble", problemId: "bramble-gate-asleep", previewId: "meadow-gate-closed", relationshipBeatId: "seedwake-s5-bramble-welcome", consequenceId: "bramble-gate-blooming" },
  { stopId: "s6", title: "Guide the Bluff Bees Home", residentId: "Fizz", problemId: "beehive-paths-crossed", previewId: "river-terraces-unpollinated", relationshipBeatId: "river-s6-fizz-relief", consequenceId: "beehive-bluff-buzzing" },
  { stopId: "s7", title: "Relaunch the Lily Ferry", residentId: "Quill", problemId: "lily-ferry-grounded", previewId: "river-crossing-stalled", relationshipBeatId: "river-s7-quill-teamwork", consequenceId: "lily-ferry-running" },
  { stopId: "s8", title: "Clear Fishpool Reach", residentId: "Rill", problemId: "fishpool-markers-mixed", previewId: "fishpool-channel-hidden", relationshipBeatId: "river-s8-rill-trust", consequenceId: "fishpool-channel-clear" },
  { stopId: "s9", title: "Mend Wheelhouse Bend", residentId: "Fizz", problemId: "wheelhouse-paddles-missing", previewId: "upper-canals-dry", relationshipBeatId: "river-s9-fizz-pride", consequenceId: "wheelhouse-turning" },
  { stopId: "s10", title: "Restart the Singing Weir", residentId: "Rill", problemId: "singing-weir-silent", previewId: "river-gardens-still", relationshipBeatId: "river-s10-rill-celebration", consequenceId: "singing-weir-flowing" },
  { stopId: "s11", title: "Raise the Amber Trail Markers", residentId: "Rook", problemId: "amber-markers-buried", previewId: "dig-route-unmarked", relationshipBeatId: "fossil-s11-rook-respect", consequenceId: "amber-trail-visible" },
  { stopId: "s12", title: "Rebuild the Rattlebones Lift", residentId: "Amber", problemId: "bone-lift-cable-loose", previewId: "dig-team-separated", relationshipBeatId: "fossil-s12-amber-reliance", consequenceId: "rattlebones-lift-running" },
  { stopId: "s13", title: "Reveal the Ash-Flat Trail", residentId: "Claw", problemId: "ash-trail-covered", previewId: "fossil-carts-lost", relationshipBeatId: "fossil-s13-claw-curiosity", consequenceId: "ash-trail-glowing" },
  { stopId: "s14", title: "Bridge Fern Canyon", residentId: "Rook", problemId: "fern-canyon-span-fallen", previewId: "canyon-return-cut-off", relationshipBeatId: "fossil-s14-rook-courage", consequenceId: "fern-canyon-bridged" },
  { stopId: "s15", title: "Reopen Claw Pass", residentId: "Claw", problemId: "claw-pass-sealed", previewId: "excavation-team-divided", relationshipBeatId: "fossil-s15-claw-friendship", consequenceId: "claw-pass-open" },
  { stopId: "s16", title: "Unlock Gearworks Gate", residentId: "Bolt", problemId: "gearworks-lock-misread", previewId: "forge-lane-closed", relationshipBeatId: "forge-s16-bolt-confidence", consequenceId: "gearworks-gate-open" },
  { stopId: "s17", title: "Restart the Ore Hopper", residentId: "Soot", problemId: "ore-hopper-jammed", previewId: "foundry-fuel-stalled", relationshipBeatId: "forge-s17-soot-trust", consequenceId: "ore-hopper-running" },
  { stopId: "s18", title: "Relight the Plate Foundry", residentId: "Bellows", problemId: "plate-foundry-cold", previewId: "machine-plates-unmade", relationshipBeatId: "forge-s18-bellows-respect", consequenceId: "plate-foundry-lit" },
  { stopId: "s19", title: "Release the Night Train", residentId: "Bolt", problemId: "night-train-braked", previewId: "settlement-cargo-waiting", relationshipBeatId: "forge-s19-bolt-partnership", consequenceId: "night-train-running" },
  { stopId: "s20", title: "Ignite the Word Forge", residentId: "Bellows", problemId: "word-forge-rings-dark", previewId: "settlement-machines-still", relationshipBeatId: "forge-s20-bellows-pride", consequenceId: "word-forge-burning" },
  { stopId: "s21", title: "Moor the Reedlight Ferry", residentId: "Ripple", problemId: "reedlight-mooring-lost", previewId: "marsh-landing-drifting", relationshipBeatId: "glass-s21-ripple-relief", consequenceId: "reedlight-ferry-moored" },
  { stopId: "s22", title: "Clear Ripple Pool", residentId: "Mica", problemId: "ripple-pool-reflections-clouded", previewId: "marsh-signals-doubled", relationshipBeatId: "glass-s22-mica-trust", consequenceId: "ripple-pool-clear" },
  { stopId: "s23", title: "Raise the Mica Steps", residentId: "Glint", problemId: "mica-steps-submerged", previewId: "marsh-high-path-lost", relationshipBeatId: "glass-s23-glint-confidence", consequenceId: "mica-steps-raised" },
  { stopId: "s24", title: "Tune Glint Causeway", residentId: "Ripple", problemId: "glint-causeway-out-of-tune", previewId: "glass-route-fractured", relationshipBeatId: "glass-s24-ripple-partnership", consequenceId: "glint-causeway-singing" },
  { stopId: "s25", title: "Relight Mirror Fen", residentId: "Glint", problemId: "mirror-fen-beacon-dark", previewId: "safe-marsh-route-hidden", relationshipBeatId: "glass-s25-glint-friendship", consequenceId: "mirror-fen-lit" },
  { stopId: "s26", title: "Secure Galecliff Path", residentId: "Kelp", problemId: "galecliff-signs-scattered", previewId: "coast-path-unsafe", relationshipBeatId: "storm-s26-kelp-trust", consequenceId: "galecliff-path-secure" },
  { stopId: "s27", title: "Rebuild Shellhaven Roof", residentId: "Boom", problemId: "shellhaven-roof-open", previewId: "harbour-shelter-wet", relationshipBeatId: "storm-s27-boom-relief", consequenceId: "shellhaven-roof-mended" },
  { stopId: "s28", title: "Restore Signal Harbour", residentId: "Prism", problemId: "harbour-signals-dark", previewId: "boats-without-bearing", relationshipBeatId: "storm-s28-prism-confidence", consequenceId: "signal-harbour-lit" },
  { stopId: "s29", title: "Calm Stormglass Cove", residentId: "Kelp", problemId: "stormglass-cove-roaring", previewId: "lens-pieces-unreachable", relationshipBeatId: "storm-s29-kelp-courage", consequenceId: "stormglass-cove-calm" },
  { stopId: "s30", title: "Wake the Thunder Lighthouse", residentId: "Prism", problemId: "thunder-lighthouse-lens-broken", previewId: "harbour-without-beam", relationshipBeatId: "storm-s30-prism-pride", consequenceId: "thunder-lighthouse-awake" },
  { stopId: "s31", title: "Open Mothlight Gate", residentId: "Luma", problemId: "mothlight-gate-unmapped", previewId: "forest-route-looping", relationshipBeatId: "lantern-s31-luma-trust", consequenceId: "mothlight-gate-open" },
  { stopId: "s32", title: "Wake the Echo Roots", residentId: "Wisp", problemId: "echo-roots-asleep", previewId: "root-stairs-folded", relationshipBeatId: "lantern-s32-wisp-curiosity", consequenceId: "echo-roots-awake" },
  { stopId: "s33", title: "Mark Wispwood Turn", residentId: "Orbit", problemId: "wispwood-signs-wandering", previewId: "living-map-incomplete", relationshipBeatId: "lantern-s33-orbit-reliance", consequenceId: "wispwood-turn-marked" },
  { stopId: "s34", title: "Align Orbit Hollow", residentId: "Luma", problemId: "orbit-hollow-rings-misaligned", previewId: "observatory-path-shut", relationshipBeatId: "lantern-s34-luma-partnership", consequenceId: "orbit-hollow-aligned" },
  { stopId: "s35", title: "Turn the Sleeping Observatory", residentId: "Orbit", problemId: "observatory-dome-still", previewId: "forest-sky-unread", relationshipBeatId: "lantern-s35-orbit-friendship", consequenceId: "sleeping-observatory-turning" },
  { stopId: "s36", title: "Raise Comet Stair", residentId: "Comet", problemId: "comet-stair-faded", previewId: "sky-road-unreachable", relationshipBeatId: "star-s36-comet-confidence", consequenceId: "comet-stair-raised" },
  { stopId: "s37", title: "Open Aster Archive", residentId: "Aster", problemId: "aster-archive-locked", previewId: "sky-maps-hidden", relationshipBeatId: "star-s37-aster-trust", consequenceId: "aster-archive-open" },
  { stopId: "s38", title: "Join Dawn Causeway", residentId: "Dawn", problemId: "dawn-causeway-separated", previewId: "star-gardens-divided", relationshipBeatId: "star-s38-dawn-partnership", consequenceId: "dawn-causeway-joined" },
  { stopId: "s39", title: "Complete Reading Skybridge", residentId: "Comet", problemId: "reading-skybridge-unfinished", previewId: "first-star-route-broken", relationshipBeatId: "star-s39-comet-courage", consequenceId: "reading-skybridge-complete" },
  { stopId: "s40", title: "Wake the First Reading Star", residentId: "Dawn", problemId: "first-reading-star-dim", previewId: "sky-road-disconnected", relationshipBeatId: "star-s40-dawn-celebration", consequenceId: "first-reading-star-awake" }
]);

const ACTION_CONFIGS = Object.freeze({
  s1: Object.freeze({
    primary: A("echo-search-find-source", "s1-seed-lantern-search", "Only the lantern carrying the heard /a/ sound wakes.", "Choose which seed lantern hides the heard sound.", ["seed-lantern-a", "seed-lantern-decoys"], "walk-to-and-reveal-a-lantern", "first-seed-lantern-glows", { targetId: "a" }),
    secondary: A("word-forge-place-tile", "s1-path-mat-forge", "The path accepts one tile for every sound in mat.", "Choose and place the next sound tile to build mat.", ["mat-sound-tiles", "seed-path-sockets"], "drag-tiles-into-path-sockets", "first-path-stone-rises", { wordId: "mat" })
  }),
  s2: Object.freeze({
    primary: A("contrast-sort-place-sound", "s2-stream-note-sort", "Fern notes ring only in the tray matching their sound.", "Listen and choose the tray for each /n/ note.", ["fern-note-n", "fern-note-contrasts", "stream-note-trays"], "carry-notes-between-sound-trays", "fern-step-melody-starts", { targetId: "n" }),
    secondary: A("blend-bridge-choose-meaning", "s2-fern-word-bridge", "Blending sit reveals which pose locks the bridge.", "Blend sit and choose the matching action picture.", ["sit-letter-stones", "sit-action-picture", "wrong-action-pictures"], "tap-stones-then-step-onto-meaning", "fern-bridge-holds", { wordId: "sit" })
  }),
  s3: Object.freeze({
    primary: A("memory-delivery-deliver-sound", "s3-rook-note-delivery", "The wind stone turns only when /o/ reaches its matching rune.", "Remember /o/ and carry it to the correct wind stone.", ["o-sound-orb", "wind-stone-runes"], "carry-orb-around-gusts-to-rune", "first-wind-stone-turns", { targetId: "o", recipientId: "Bramble" }),
    secondary: A("word-forge-place-tile", "s3-stone-hot-forge", "The hot word vents enough air to turn the second stone.", "Build hot in sound order to open the vent.", ["hot-forge-tiles", "wind-vent-lock"], "place-hot-tiles-and-pump-bellows", "second-wind-stone-turns", { wordId: "hot" }),
    transfer: A("memory-delivery-follow-decoded-instruction", "s3-wind-stone-instruction", "A decoded route instruction must be remembered across the gust lane.", "Read the instruction, move to the wind stones, then turn the named stone.", ["wind-route-instruction", "left-wind-stone", "right-wind-stone"], "cross-gust-lane-and-turn-named-stone", "rook-wind-stones-align", { recipientId: "Bramble" })
  }),
  s4: Object.freeze({
    primary: A("echo-search-find-source", "s4-ford-sound-search", "The ford peg marked with /b/ lifts one safe plank.", "Find the peg that matches the heard /b/ sound.", ["ford-peg-b", "ford-peg-decoys"], "wade-to-and-pull-a-ford-peg", "first-ford-plank-rises", { targetId: "b" }),
    secondary: A("blend-bridge-choose-meaning", "s4-bun-plank-bridge", "Blending bun identifies the round float that completes the ford.", "Blend bun and choose the matching cargo shape.", ["bun-letter-planks", "round-bun-float", "shape-decoys"], "blend-across-planks-and-push-float", "otter-ford-surface-levels", { wordId: "bun" })
  }),
  s5: Object.freeze({
    primary: A("contrast-sort-place-sound", "s5-gate-vine-sort", "Only vines sorted with the /c/ sound release the gate latch.", "Listen and sort the /c/ vine tags from their contrasts.", ["c-vine-tags", "contrast-vine-tags", "gate-baskets"], "pull-and-hook-vines-onto-baskets", "bramble-latch-revealed", { targetId: "c" }),
    secondary: A("word-forge-place-tile", "s5-cup-key-forge", "The cup key takes one grapheme tile for each sound.", "Build cup to shape the key teeth.", ["cup-key-tiles", "gate-key-blank"], "press-tiles-into-key-blank", "bramble-key-forms", { wordId: "cup" })
  }),
  s6: Object.freeze({
    primary: A("contrast-sort-place-heart-word", "s6-pollen-heart-sort", "Heart-pattern cargo must go to the hive displaying the same remembered part.", "Inspect the heart part and choose its matching hive.", ["heart-word-pollen-cards", "patterned-hives"], "fly-card-to-matching-hive", "first-bee-route-uncrosses", {
      objectRoles: ["heart-word pollen card", "heart-pattern hives"],
      consequence: "the first crossed bee route separates",
      contentBinding: contentBinding({
        slotId: "heart-slot-s6-1",
        requiredActivityType: "heart_part_mapping",
        actionId: "s6-primary",
        visitOwnerId: "s6-heart-1",
        isVisitOwner: false
      }),
      activityFocus: "heart_part_mapping"
    }),
    secondary: A("blend-bridge-choose-meaning", "s6-box-hive-bridge", "Blending box reveals which cargo shape fits the hive lift.", "Blend box and choose the matching container.", ["box-letter-cells", "box-crate", "container-decoys"], "cross-letter-cells-and-load-crate", "bluff-hive-lift-rises", { wordId: "box" })
  }),
  s7: Object.freeze({
    primary: A("memory-delivery-deliver-decoded-word", "s7-jam-crate-delivery", "The ferry bell accepts the remembered decoded cargo label.", "Read jam, remember it, and deliver it to the matching crate.", ["jam-word-label", "jam-jar-crate", "cargo-decoys"], "carry-label-across-tilting-deck", "lily-ferry-bell-rings", { wordId: "jam", recipientId: "Quill" }),
    secondary: A("word-forge-place-tile", "s7-jam-ferry-forge", "The ferry clamp opens when jam is built sound by sound.", "Choose the grapheme tiles that build jam.", ["jam-ferry-tiles", "ferry-clamp"], "snap-tiles-into-ferry-clamp", "lily-ferry-releases", { wordId: "jam" })
  }),
  s8: Object.freeze({
    primary: A("echo-search-find-source", "s8-canal-marker-search", "A remembered sound reveals the canal marker carrying its spelling.", "Hear the review sound and uncover its matching marker.", ["review-sound-orb", "canal-markers"], "pole-between-markers-and-reveal-one", "first-fishpool-marker-corrects"),
    secondary: A("blend-bridge-choose-meaning", "s8-mat-ferry-bridge", "Blending mat identifies the flat patch that seals the ferry deck.", "Blend mat and choose the matching repair patch.", ["mat-letter-buoys", "mat-deck-patch", "repair-decoys"], "step-across-buoys-and-place-patch", "fishpool-ferry-stops-leaking", { wordId: "mat" })
  }),
  s9: Object.freeze({
    primary: A("memory-delivery-deliver-sound", "s9-paddle-cue-delivery", "The remembered /sh/ cue belongs at the paddle marked sh.", "Carry /sh/ past the waterwheel and choose its paddle.", ["sh-sound-cue", "wheelhouse-paddles"], "carry-cue-around-turning-wheel", "first-wheelhouse-paddle-locks", { targetId: "sh", recipientId: "Fizz" }),
    secondary: A("word-forge-place-tile", "s9-ship-paddle-forge", "Building ship shapes the missing paddle blade.", "Place the sound tiles in order to build ship.", ["ship-paddle-tiles", "paddle-blade-mould"], "hammer-tiles-into-paddle-mould", "wheelhouse-paddle-completes", { wordId: "ship" })
  }),
  s10: Object.freeze({
    primary: A("contrast-sort-place-sound", "s10-weir-note-sort", "The weir sings when /th/ notes enter the th channel.", "Sort the heard /th/ notes away from their contrasts.", ["th-water-notes", "contrast-water-notes", "weir-channels"], "sweep-notes-into-water-channels", "weir-harmony-returns", { targetId: "th" }),
    secondary: A("word-forge-place-tile", "s10-thin-rill-forge", "The thin sluice key must be encoded sound by sound.", "Build thin to shape the sluice key.", ["thin-key-tiles", "sluice-key-frame"], "rotate-tiles-and-lock-sound-slots", "singing-weir-gate-unlocks", { wordId: "thin" })
  }),
  s11: Object.freeze({
    primary: A("contrast-sort-place-decoded-word", "s11-rock-marker-sort", "Decoded rock belongs with the marker showing its word pattern.", "Read rock and choose the matching trail-marker family.", ["rock-word-token", "trail-pattern-markers"], "roll-word-stone-to-marker", "amber-marker-rises", { wordId: "rock" }),
    secondary: A("word-forge-place-tile", "s11-rock-marker-forge", "The marker base needs every sound in rock encoded.", "Build rock to repair the marker base.", ["rock-marker-tiles", "amber-marker-base"], "set-tiles-into-marker-base", "amber-marker-locks-upright", { wordId: "rock" })
  }),
  s12: Object.freeze({
    primary: A("memory-delivery-deliver-decoded-word", "s12-hand-rail-delivery", "The remembered decoded word hand names the lift control to use.", "Read hand, carry it, and deliver it to the hand lever.", ["hand-word-ticket", "hand-lever", "lift-control-decoys"], "climb-lift-cage-and-deliver-ticket", "lift-hand-lever-arms", { wordId: "hand", recipientId: "Amber" }),
    secondary: A("blend-bridge-choose-meaning", "s12-hand-rail-bridge", "Blending hand reveals the safety symbol for the repaired rail.", "Blend hand and choose the matching body-part symbol.", ["hand-letter-rungs", "hand-symbol", "symbol-decoys"], "climb-rungs-and-turn-symbol-wheel", "rattlebones-safety-rail-closes", { wordId: "hand" })
  }),
  s13: Object.freeze({
    primary: A("echo-search-find-source", "s13-ash-echo-search", "The /sp/ echo reveals the compass shard marked sp.", "Find the shard that matches the heard /sp/ blend.", ["sp-compass-shard", "ash-shard-decoys"], "brush-ash-and-lift-shard", "ash-compass-starts-glowing", { targetId: "sp" }),
    secondary: A("word-forge-place-tile", "s13-spin-compass-forge", "The compass turns only after spin is encoded in sound order.", "Build spin around the compass rim.", ["spin-rim-tiles", "fossil-compass"], "rotate-and-seat-rim-tiles", "ash-flat-route-points-forward", { wordId: "spin" })
  }),
  s14: Object.freeze({
    primary: A("contrast-sort-place-sound", "s14-bridge-piece-sort", "Bridge pieces beginning /bl/ fit the bluebell-shaped sockets.", "Listen and sort the /bl/ pieces from other blend pieces.", ["bl-bridge-pieces", "contrast-bridge-pieces", "fern-sockets"], "carry-pieces-to-shaped-sockets", "first-canyon-span-locks", { targetId: "bl" }),
    secondary: A("blend-bridge-choose-meaning", "s14-clap-signal-bridge", "Blending clap identifies the action that triggers the counterweight.", "Blend clap and choose the matching action.", ["clap-letter-ledges", "clap-action", "action-decoys"], "cross-ledges-and-clap-counterweight", "fern-canyon-counterweight-rises", { wordId: "clap" })
  }),
  s15: Object.freeze({
    primary: A("memory-delivery-deliver-sound", "s15-pass-cue-delivery", "The remembered /br/ cue opens the matching pass seal.", "Carry /br/ through the tunnel and deliver it to br.", ["br-sound-crystal", "pass-seals"], "carry-crystal-through-falling-dust", "claw-pass-first-seal-opens", { targetId: "br", recipientId: "Claw" }),
    secondary: A("word-forge-place-tile", "s15-frog-signal-forge", "Encoding frog repairs the four-part signal drum.", "Build frog to tune the rescue signal.", ["frog-signal-tiles", "rescue-drum"], "strike-and-seat-signal-tiles", "excavation-team-hears-signal", { wordId: "frog" })
  }),
  s16: Object.freeze({
    primary: A("echo-search-find-source", "s16-gear-echo-search", "The /ie/ value of y reveals the key marked for by.", "Hear /ie/ and find the y key that carries it.", ["y-ie-key", "gear-key-decoys"], "turn-and-test-gear-keys", "gearworks-first-lock-clicks", { targetId: "y_ie" }),
    secondary: A("blend-bridge-choose-meaning", "s16-by-key-bridge", "Blending by reveals the beside-arrow that sets the gate gear.", "Blend by and choose the matching position picture.", ["by-cog-letters", "beside-arrow", "position-decoys"], "turn-letter-cogs-and-pull-arrow", "gearworks-gate-cogs-engage", { wordId: "by" })
  }),
  s17: Object.freeze({
    primary: A("contrast-sort-place-sound", "s17-ore-label-sort", "A review token belongs beside the spelling that matches its sound.", "Hear the review cue and sort it to the matching ore label.", ["review-ore-token", "ore-sound-labels"], "tip-token-into-labelled-hopper", "first-ore-channel-clears"),
    secondary: A("word-forge-place-tile", "s17-ship-chute-forge", "Encoding ship rebuilds the chute command plate.", "Build ship to stamp the chute command.", ["ship-command-tiles", "ore-chute-plate"], "stamp-tiles-into-command-plate", "ore-hopper-chute-opens", { wordId: "ship" })
  }),
  s18: Object.freeze({
    primary: A("memory-delivery-deliver-decoded-word", "s18-cake-mould-delivery", "The decoded word cake names the mould that receives the hot plate.", "Read cake, remember it, and deliver it to the cake mould.", ["cake-word-tag", "cake-mould", "mould-decoys"], "carry-tag-around-furnace-to-mould", "plate-mould-warmer-starts", { wordId: "cake", recipientId: "Bellows" }),
    secondary: A("blend-bridge-choose-meaning", "s18-cake-mould-bridge", "Blending cake identifies the celebration shape for the foundry plate.", "Blend cake and choose its matching picture.", ["cake-letter-plates", "cake-picture", "food-decoys"], "flip-letter-plates-and-press-picture", "plate-foundry-first-casting-cools", { wordId: "cake" })
  }),
  s19: Object.freeze({
    primary: A("echo-search-find-source", "s19-train-signal-search", "The /ie/ signal is hidden behind the i_e lantern.", "Find the signal lantern matching the heard /ie/ sound.", ["i-e-signal-lantern", "train-signal-decoys"], "climb-signal-post-and-reveal-lantern", "night-train-signal-turns-green", { targetId: "i_e" }),
    secondary: A("word-forge-place-tile", "s19-bike-cog-forge", "The brake releases when bike is encoded around the cog.", "Build bike with the split-digraph tiles.", ["bike-cog-tiles", "train-brake-cog"], "fit-tiles-around-brake-cog", "night-train-brake-releases", { wordId: "bike" })
  }),
  s20: Object.freeze({
    primary: A("contrast-sort-place-sound", "s20-forge-token-sort", "Tokens showing /oa/ belong in the o_e forge ring.", "Listen and sort /oa/ tokens into the o_e ring.", ["o-e-forge-tokens", "contrast-forge-tokens", "forge-rings"], "toss-tokens-into-spinning-rings", "outer-word-forge-ring-ignites", { targetId: "o_e" }),
    secondary: A("blend-bridge-choose-meaning", "s20-home-ring-bridge", "Blending home reveals the house symbol that aligns the inner ring.", "Blend home and choose the matching place picture.", ["home-ring-letters", "home-picture", "place-decoys"], "rotate-ring-letters-and-choose-picture", "inner-word-forge-ring-aligns", { wordId: "home" })
  }),
  s21: Object.freeze({
    primary: A("memory-delivery-deliver-sound", "s21-mooring-cue-delivery", "The remembered /yoo/ cue belongs at the u_e mooring post.", "Carry /yoo/ across the reeds and deliver it to u_e.", ["u-e-sound-lantern", "mooring-posts"], "balance-along-reeds-with-lantern", "reedlight-first-rope-tightens", { targetId: "u_e", recipientId: "Ripple" }),
    secondary: A("word-forge-place-tile", "s21-cube-anchor-forge", "Encoding cube reshapes the square anchor latch.", "Build cube to close the anchor latch.", ["cube-anchor-tiles", "square-anchor-latch"], "fit-tiles-into-anchor-latch", "reedlight-ferry-holds-position", { wordId: "cube" })
  }),
  s22: Object.freeze({
    primary: A("echo-search-find-source", "s22-reflection-echo-search", "The /ee/ reflection from e_e reveals the safe pane.", "Find the pane that mirrors the heard /ee/ sound.", ["e-e-reflection-pane", "false-reflection-panes"], "wipe-and-turn-reflection-panes", "ripple-pool-first-reflection-clears", { targetId: "e_e" }),
    secondary: A("blend-bridge-choose-meaning", "s22-theme-glass-bridge", "Blending theme reveals the main-idea emblem that steadies the glass bridge.", "Blend theme and choose the matching idea emblem.", ["theme-glass-letters", "main-idea-emblem", "emblem-decoys"], "cross-glass-letters-and-set-emblem", "ripple-pool-bridge-stabilizes", { wordId: "theme" })
  }),
  s23: Object.freeze({
    primary: A("contrast-sort-place-decoded-word", "s23-rain-step-sort", "Decoded rain belongs with the ai-pattern step.", "Read rain and place it beside the matching spelling pattern.", ["rain-word-drop", "ai-step", "ay-step"], "pour-word-drop-onto-pattern-step", "first-mica-step-rises", { wordId: "rain" }),
    secondary: A("word-forge-place-tile", "s23-rain-step-forge", "Encoding rain fills the four sockets in the next mica step.", "Build rain to raise the next step.", ["rain-step-tiles", "mica-step-sockets"], "step-on-tiles-in-spoken-sound-order", "mica-stair-reaches-high-path", { wordId: "rain" })
  }),
  s24: Object.freeze({
    primary: A("memory-delivery-deliver-decoded-word", "s24-tree-tone-delivery", "The decoded word tree names the tall reed pipe to tune.", "Read tree, remember it, and deliver it to the tree-shaped pipe.", ["tree-word-note", "tree-shaped-pipe", "pipe-decoys"], "carry-note-across-glass-reeds", "first-causeway-pipe-tunes", { wordId: "tree", recipientId: "Ripple" }),
    secondary: A("blend-bridge-choose-meaning", "s24-tree-tone-bridge", "Blending tree identifies the branching silhouette that completes the chord.", "Blend tree and choose its matching silhouette.", ["tree-tone-letters", "tree-silhouette", "silhouette-decoys"], "play-letter-pipes-and-select-silhouette", "glint-causeway-chord-resolves", { wordId: "tree" })
  }),
  s25: Object.freeze({
    primary: A("echo-search-find-source", "s25-beacon-echo-search", "The /ie/ echo from igh reveals the correct mirror lens.", "Find the lens marked igh for the heard /ie/ sound.", ["igh-mirror-lens", "mirror-lens-decoys"], "angle-lenses-toward-echo", "mirror-fen-first-beam-appears", { targetId: "igh" }),
    secondary: A("word-forge-place-tile", "s25-light-lens-forge", "Encoding light focuses the beacon lens sound by sound.", "Build light around the lens rim.", ["light-lens-tiles", "beacon-lens-rim"], "seat-tiles-and-rotate-lens", "mirror-fen-beacon-focuses", { wordId: "light" })
  }),
  s26: Object.freeze({
    primary: A("contrast-sort-place-sound", "s26-cliff-sign-sort", "Signs carrying /oa/ belong on the oa cliff route.", "Listen and sort /oa/ signs away from sound contrasts.", ["oa-cliff-signs", "contrast-cliff-signs", "galecliff-routes"], "plant-signs-in-route-holes", "galecliff-first-turn-marked", { targetId: "oa" }),
    secondary: A("blend-bridge-choose-meaning", "s26-boat-rope-bridge", "Blending boat identifies the vessel that can tow the safety rope.", "Blend boat and choose the matching vessel.", ["boat-rope-letters", "rescue-boat", "vehicle-decoys"], "cross-rope-letters-and-hook-boat", "galecliff-safety-rope-tightens", { wordId: "boat" })
  }),
  s27: Object.freeze({
    primary: A("memory-delivery-deliver-sound", "s27-roof-cue-delivery", "The remembered /oo/ cue belongs at the roof tile marked oo.", "Carry /oo/ through the rain and deliver it to oo.", ["oo-roof-cue", "shellhaven-roof-tiles"], "carry-cue-under-moving-shelters", "first-shellhaven-tile-seals", { targetId: "oo", recipientId: "Boom" }),
    secondary: A("word-forge-place-tile", "s27-moon-tile-forge", "Encoding moon shapes the curved cap tile.", "Build moon to press the roof cap.", ["moon-roof-tiles", "curved-roof-mould"], "fit-tiles-along-a-curved-frame", "shellhaven-roof-cap-locks", { wordId: "moon" })
  }),
  s28: Object.freeze({
    primary: A("echo-search-find-source", "s28-signal-echo-search", "The short /oo/ echo reveals the harbour code marked oo.", "Find the oo code that matches the short sound in book.", ["oo-short-code", "harbour-code-decoys"], "swing-between-signal-posts-and-reveal-code", "signal-harbour-first-lamp-lights", { targetId: "oo_short" }),
    secondary: A("blend-bridge-choose-meaning", "s28-book-code-bridge", "Blending book identifies the logbook that carries the route code.", "Blend book and choose the matching object.", ["book-signal-letters", "harbour-logbook", "object-decoys"], "activate-letter-lamps-and-open-logbook", "signal-harbour-route-code-appears", { wordId: "book" })
  }),
  s29: Object.freeze({
    primary: A("contrast-sort-place-decoded-word", "s29-sound-shell-sort", "Decoded sound belongs beside the ou pattern shell.", "Read sound and choose the shell with its vowel pattern.", ["sound-word-shell", "ou-pattern-shell", "ow-pattern-shell"], "slide-word-shell-into-pattern-cove", "stormglass-first-wave-softens", { wordId: "sound" }),
    secondary: A("word-forge-place-tile", "s29-sound-shell-forge", "Encoding sound tunes every ridge of the calm shell.", "Build sound to tune the shell.", ["sound-shell-tiles", "stormglass-calm-shell"], "press-and-hum-tiles-on-shell", "stormglass-cove-echo-calms", { wordId: "sound" })
  }),
  s30: Object.freeze({
    primary: A("memory-delivery-deliver-decoded-word", "s30-coin-lens-delivery", "The decoded word coin names the round lens piece Prism needs.", "Read coin, remember it, and deliver it to the round lens socket.", ["coin-word-spark", "round-lens-piece", "lens-decoys"], "carry-spark-up-lighthouse-stairs", "thunder-lens-first-ring-locks", { wordId: "coin", recipientId: "Prism" }),
    secondary: A("blend-bridge-choose-meaning", "s30-coin-lens-bridge", "Blending coin identifies the round metal shape that turns the lens gear.", "Blend coin and choose the matching object.", ["coin-lens-letters", "coin-gear-key", "round-object-decoys"], "blend-across-lens-rings-and-turn-key", "thunder-lens-gear-turns", { wordId: "coin" })
  }),
  s31: Object.freeze({
    primary: A("echo-search-find-source", "s31-mothlight-echo-search", "The /ar/ echo reveals the map marker marked ar.", "Find the ar marker that matches the mothlight call.", ["ar-mothlight-marker", "forest-marker-decoys"], "follow-moths-and-reveal-marker", "mothlight-first-route-appears", { targetId: "ar" }),
    secondary: A("word-forge-place-tile", "s31-car-map-forge", "Encoding car stamps the wheeled route symbol on the living map.", "Build car to print the route symbol.", ["car-map-tiles", "living-map-printer"], "press-tiles-and-roll-map-wheel", "mothlight-gate-route-stabilizes", { wordId: "car" })
  }),
  s32: Object.freeze({
    primary: A("contrast-sort-place-sound", "s32-root-token-sort", "Root tokens with /or/ belong at the or root arch.", "Listen and sort /or/ tokens from their contrasts.", ["or-root-tokens", "contrast-root-tokens", "root-arches"], "roll-tokens-down-root-channels", "first-echo-root-wakes", { targetId: "or" }),
    secondary: A("blend-bridge-choose-meaning", "s32-storm-root-bridge", "Blending storm identifies the weather symbol that bends the root stair.", "Blend storm and choose the matching weather picture.", ["storm-root-letters", "storm-picture", "weather-decoys"], "climb-root-letters-and-pull-weather-symbol", "echo-root-stair-unfolds", { wordId: "storm" })
  }),
  s33: Object.freeze({
    primary: A("memory-delivery-deliver-sound", "s33-map-cue-delivery", "The remembered /er/ cue belongs at the ir map post for bird.", "Carry /er/ to the post showing ir.", ["er-map-cue", "er-ir-ur-map-posts"], "carry-cue-through-turning-map-path", "wispwood-first-sign-stops-wandering", { targetId: "er", recipientId: "Orbit" }),
    secondary: A("word-forge-place-tile", "s33-bird-marker-forge", "Encoding bird fixes the bird-shaped marker to the correct turn.", "Build bird on the living marker.", ["bird-marker-tiles", "bird-shaped-marker"], "fit-tiles-into-marker-wings", "wispwood-turn-points-home", { wordId: "bird" })
  }),
  s34: Object.freeze({
    primary: A("echo-search-find-source", "s34-orbit-echo-search", "The /air/ echo reveals the ring marked air.", "Find the orbit ring spelling the heard /air/ sound.", ["air-orbit-ring", "orbit-ring-decoys"], "jump-between-rings-and-reveal-one", "orbit-hollow-first-ring-aligns", { targetId: "air" }),
    secondary: A("blend-bridge-choose-meaning", "s34-chair-ring-bridge", "Blending chair identifies the seat symbol that anchors the orbit ring.", "Blend chair and choose the matching object.", ["chair-orbit-letters", "chair-anchor-symbol", "furniture-decoys"], "cross-orbit-letters-and-lock-symbol", "orbit-hollow-rings-hold", { wordId: "chair" })
  }),
  s35: Object.freeze({
    primary: A("contrast-sort-place-decoded-word", "s35-hear-gear-sort", "Decoded hear belongs with the ear-pattern observatory gear.", "Read hear and choose the gear carrying its vowel pattern.", ["hear-word-gear", "ear-pattern-gear", "air-pattern-gear"], "roll-word-gear-into-pattern-track", "observatory-first-gear-turns", { wordId: "hear" }),
    secondary: A("word-forge-place-tile", "s35-hear-gear-forge", "Encoding hear completes the listening gear around the dome.", "Build hear to repair the dome gear.", ["hear-dome-tiles", "listening-gear"], "set-tiles-around-gear-rim", "sleeping-observatory-dome-unlocks", { wordId: "hear" })
  }),
  s36: Object.freeze({
    primary: A("memory-delivery-deliver-decoded-word", "s36-pure-light-delivery", "The decoded word pure names the clear light crystal Comet needs.", "Read pure, remember it, and deliver it to the clear crystal socket.", ["pure-word-star", "clear-light-crystal", "crystal-decoys"], "carry-star-up-fading-comet-steps", "comet-stair-first-flight-brightens", { wordId: "pure", recipientId: "Comet" }),
    secondary: A("blend-bridge-choose-meaning", "s36-pure-light-bridge", "Blending pure identifies the clean crystal among cloudy choices.", "Blend pure and choose the matching clear crystal.", ["pure-light-letters", "clear-crystal", "cloudy-crystals"], "trace-star-letters-and-lift-crystal", "comet-stair-light-channel-opens", { wordId: "pure" })
  }),
  s37: Object.freeze({
    primary: A("echo-search-find-source", "s37-archive-echo-search", "The /s/ value of c reveals the city archive key.", "Hear /s/ and find the c key that carries it.", ["c-s-archive-key", "archive-key-decoys"], "scan-shelves-and-pull-key", "aster-archive-first-lock-opens", { targetId: "c_s" }),
    secondary: A("word-forge-place-tile", "s37-city-key-forge", "Encoding city cuts the archive key's exact sound ridges.", "Build city to finish the archive key.", ["city-key-tiles", "archive-key-blank"], "trace-tiles-before-stamping-key-ridges", "aster-archive-door-releases", { wordId: "city" })
  }),
  s38: Object.freeze({
    primary: A("contrast-sort-place-decoded-word", "s38-cats-ending-sort", "Decoded cats belongs with the plural-s causeway ending.", "Read cats and choose the ending that means more than one.", ["cats-word-token", "plural-s-ending", "ending-decoys"], "slide-word-token-to-ending-gate", "dawn-causeway-first-joint-connects", { wordId: "cats" }),
    secondary: A("blend-bridge-choose-meaning", "s38-cats-path-bridge", "Blending cats identifies the picture showing more than one cat.", "Blend cats and choose the plural picture.", ["cats-causeway-letters", "multiple-cats-picture", "singular-cat-picture"], "cross-ending-tiles-and-choose-picture", "dawn-causeway-plural-joint-locks", { wordId: "cats" })
  }),
  s39: Object.freeze({
    primary: A("echo-search-find-source", "s39-bridge-cue-search", "The /ul/ ending reveals the plank marked le.", "Hear the ending and find the le plank.", ["le-skybridge-plank", "ending-plank-decoys"], "glide-between-planks-and-reveal-one", "reading-skybridge-first-gap-closes", { targetId: "le" }),
    secondary: A("word-forge-place-tile", "s39-little-plank-forge", "Encoding little fills every sound socket without calling its /ay/ a split digraph.", "Build little to form the long bridge plank.", ["little-plank-tiles", "skybridge-plank-mould"], "fit-tiles-along-plank-mould", "reading-skybridge-main-span-completes", { wordId: "little" })
  }),
  s40: Object.freeze({
    primary: A("echo-search-find-source", "s40-star-echo-search", "The /shun/ ending reveals the ray marked tion.", "Hear /shun/ and find the tion star ray.", ["tion-star-ray", "ending-ray-decoys"], "orbit-rays-and-reveal-one", "first-reading-star-core-brightens", { targetId: "tion" }),
    secondary: A("blend-bridge-choose-meaning", "s40-fiction-ray-bridge", "Blending fiction identifies the made-up story that powers the ray.", "Blend fiction and choose the imaginary-story picture.", ["fiction-ray-letters", "imaginary-story-picture", "fact-picture"], "cross-star-letters-and-aim-story-ray", "first-reading-star-story-ray-connects", { wordId: "fiction" })
  })
});

const BOSS_CONFIGS = Object.freeze({
  s5: A("blend-bridge-choose-novel-meaning", "bramble-gate-novel-decode", "A newly presented cat label opens the animal-shaped gate seal only after independent blending.", "Blend cat without a model and choose its picture.", ["cat-gate-letters", "cat-picture", "animal-decoys"], "cross-novel-letter-vines-and-choose-picture", "bramble-gate-boss-seal-opens", { wordId: "cat" }),
  s10: A("blend-bridge-choose-novel-meaning", "singing-weir-novel-decode", "A newly presented thing label selects the object channel that restarts the weir.", "Blend thing without a model and choose its meaning.", ["thing-weir-letters", "thing-picture", "meaning-decoys"], "cross-novel-water-letters-and-select-picture", "singing-weir-boss-channel-opens", { wordId: "thing" }),
  s15: A("blend-bridge-choose-novel-meaning", "claw-pass-novel-decode", "A newly presented truck label identifies the vehicle strong enough to clear the pass.", "Blend truck without a model and choose the vehicle.", ["truck-pass-letters", "truck-picture", "vehicle-decoys"], "cross-novel-stone-letters-and-select-vehicle", "claw-pass-boss-boulder-moves", { wordId: "truck" }),
  s20: A("blend-bridge-choose-novel-meaning", "word-forge-novel-decode", "A newly presented stone label identifies the material that completes the forge ring.", "Blend stone without a model and choose its picture.", ["stone-forge-letters", "stone-picture", "material-decoys"], "cross-novel-forge-rings-and-select-material", "word-forge-boss-core-ignites", { wordId: "stone" }),
  s25: A("blend-bridge-choose-novel-meaning", "mirror-fen-novel-decode", "A newly presented night label identifies the dark-sky lens setting.", "Blend night without a model and choose the matching sky.", ["night-mirror-letters", "night-sky-picture", "day-sky-picture"], "cross-novel-mirror-letters-and-turn-lens", "mirror-fen-boss-beacon-fires", { wordId: "night" }),
  s30: A("blend-bridge-choose-novel-meaning", "thunder-lighthouse-novel-decode", "A newly presented point label identifies where the lighthouse beam must aim.", "Blend point without a model and choose the pointed target.", ["point-lighthouse-letters", "pointed-target-picture", "shape-decoys"], "cross-novel-lens-letters-and-aim-beam", "thunder-lighthouse-boss-beam-locks", { wordId: "point" }),
  s35: A("blend-bridge-choose-novel-meaning", "observatory-novel-decode", "A newly presented near label identifies the closest star ring.", "Blend near without a model and choose the close object.", ["near-observatory-letters", "near-star-picture", "far-star-picture"], "cross-novel-orbit-letters-and-select-distance", "sleeping-observatory-boss-dome-turns", { wordId: "near" }),
  s40: A("blend-bridge-choose-novel-meaning", "first-reading-star-novel-decode", "A newly presented action label identifies the movement that wakes the reading star.", "Blend action without a model and choose the matching movement.", ["action-star-letters", "action-picture", "object-picture-decoys"], "cross-novel-star-letters-and-perform-choice", "first-reading-star-boss-awakens", { wordId: "action" })
});

function chapterForStop(stopId) {
  const chapter = SOUND_SEEKERS_CHAPTERS.find(item => item.stopIds.includes(stopId));
  if (!chapter) throw new Error(`${stopId}: no Sound Seekers chapter`);
  return chapter;
}

function wordContract(wordId, stopIndex) {
  const pronunciation = getPronunciation(wordId);
  if (!pronunciation) throw new Error(`${wordId}: missing authored pronunciation`);
  const unitTargetIds = pronunciation.units.map(unit => unit.evidenceTargetId);
  if (unitTargetIds.some(targetId => !targetId)) {
    throw new Error(`${wordId}: every assessed unit needs an explicit evidence target`);
  }

  const taughtThroughStop = new Set(QUEST_STOPS
    .filter(stop => stop.index <= stopIndex)
    .flatMap(stop => stop.teach.map(target => target.id)));
  for (const targetId of unitTargetIds) {
    if (!taughtThroughStop.has(targetId)) throw new Error(`${wordId}:${targetId} was not taught by s${stopIndex}`);
  }

  const coveredLetters = new Set(pronunciation.units.flatMap(unit => unit.letterIndices));
  if (coveredLetters.size !== pronunciation.word.length) {
    throw new Error(`${wordId}: pronunciation units do not cover the printed word`);
  }
  return Object.freeze({ wordId: pronunciation.id, unitTargetIds: Object.freeze(unitTargetIds) });
}

function decisionContract(instructionId) {
  const instruction = getInstructionContract(instructionId);
  if (!instruction || instruction.phase !== "decision") {
    throw new Error(`${instructionId || "(none)"}: missing exact decision instruction`);
  }
  return Object.freeze({
    powerId: instruction.powerId,
    instructionId: instruction.instructionId,
    expectedAction: instruction.expectedAction,
    recordsDomain: instruction.recordsDomain
  });
}

function withFirstUseOnboarding(action, seenPowers) {
  if (seenPowers.has(action.powerId)) return action;
  seenPowers.add(action.powerId);
  return {
    ...action,
    onboarding: Object.freeze({ consequenceFree: true, recordsDomain: null })
  };
}

const interactionContexts = new Map();

function registerInteractionContext(config, { role, chapterId }) {
  if (!config?.contextId) throw new Error(`${role}: interaction context id is required`);
  if (interactionContexts.has(config.contextId)) throw new Error(`${config.contextId}: duplicate interaction context`);
  const semanticContext = {
    id: config.contextId,
    chapterId,
    semanticRule: config.semanticRule,
    childDecision: config.childDecision,
    decisionSteps: config.decisionSteps,
    objectIds: config.objectIds,
    objectRoles: config.objectRoles,
    recipientId: config.recipientId,
    recipientRole: config.recipientRole,
    physicalExpression: config.physicalExpression,
    consequenceId: config.consequenceId,
    consequence: config.consequence,
    activityFocus: config.activityFocus,
    decisionModel: config.decisionModel,
    inputPattern: config.inputPattern,
    failureOrCorrectionModel: config.failureOrCorrectionModel,
    learningConsequenceModel: config.learningConsequenceModel,
    mechanicRoles: config.mechanicRoles,
    physicalActionRoles: config.physicalActionRoles,
    contentCategory: config.contentCategory,
    mechanicFamilyId: config.mechanicFamilyId,
    constructId: config.constructId,
    decisionConstruct: config.decisionConstruct,
    inputConstruct: config.inputConstruct,
    correctionConstruct: config.correctionConstruct,
    physicalActionConstruct: config.physicalActionConstruct,
    evidenceConstruct: config.evidenceConstruct
  };
  const context = Object.freeze({
    ...semanticContext,
    cognitiveSignature: canonicalCognitiveSignature(semanticContext)
  });
  interactionContexts.set(context.id, context);
  return context;
}

function actionRecord({ id, kind, config, stop, chapter, localIndex, review }, seenPowers) {
  const contract = decisionContract(config.instructionId);
  registerInteractionContext(config, { chapterId: chapter.id, role: kind === "challenge" ? id.split("-").at(-1) : kind, localIndex });
  const action = {
    id,
    kind,
    configurationId: `${id}-configuration`,
    ...contract,
    contextId: config.contextId
  };
  if (config.contentBinding) action.contentBinding = config.contentBinding;
  if (config.activityFocus) action.activityFocus = config.activityFocus;

  if (TARGET_DECISION_IDS.has(config.instructionId)) {
    if (review) {
      action.targetSourceId = SOUND_SEEKERS_REVIEW_SOURCE_ID;
    } else {
      if (!config.targetId || !stop.teach.some(target => target.id === config.targetId)) {
        throw new Error(`${id}: target action needs a target introduced at ${stop.id}`);
      }
      action.targetIds = Object.freeze([config.targetId]);
    }
  }
  if (WORD_DECISION_IDS.has(config.instructionId)) {
    if (!config.wordId || !stop.words.includes(config.wordId)) {
      throw new Error(`${id}: word action needs a controlled ${stop.id} word`);
    }
    Object.assign(action, wordContract(config.wordId, stop.index));
  }
  return Object.freeze(withFirstUseOnboarding(action, seenPowers));
}

function storyTransferConfig(blueprint) {
  const mechanic = STORY_TRANSFER_CONFIGURATIONS[EXPEDITION_BLUEPRINTS.indexOf(blueprint)];
  if (!mechanic) throw new Error(`${blueprint.stopId}: missing connected-text transfer mechanics`);
  return A(
    "story-power-choose-story-action",
    `${blueprint.stopId}-controlled-scene`,
    `The decoded scene action must repair ${blueprint.problemId} rather than the tempting unrelated action.`,
    "Choose the matching repair.",
    [`${blueprint.stopId}-story-action`, `${blueprint.stopId}-story-decoy`, `${blueprint.stopId}-repair-object`],
    "read-scene-then-manipulate-the-chosen-repair",
    blueprint.consequenceId,
    {
      recipientId: blueprint.residentId,
      activityFocus: mechanic.activityFocus,
      decisionModel: mechanic.decisionModel,
      inputPattern: mechanic.inputPattern,
      failureOrCorrectionModel: mechanic.failureOrCorrectionModel,
      learningConsequenceModel: mechanic.learningConsequenceModel,
      mechanicRoles: mechanic.mechanicRoles,
      physicalActionRoles: mechanic.physicalActionRoles
    }
  );
}

function transferRecord({ blueprint, stop, chapter, localIndex, connectedTextId }, seenPowers) {
  const authoredBossConfig = BOSS_CONFIGS[stop.id] || null;
  const bossRecipe = authoredBossConfig
    ? HEART_WORD_MECHANIC_RECIPES[Object.keys(BOSS_CONFIGS).indexOf(stop.id)]
    : null;
  const bossConfig = authoredBossConfig && bossRecipe ? Object.freeze({
    ...authoredBossConfig,
    decisionModel: `${authoredBossConfig.decisionModel}; ${bossRecipe.decisionFrame}`,
    inputPattern: `${authoredBossConfig.inputPattern}; ${bossRecipe.inputPattern}`,
    failureOrCorrectionModel: `${authoredBossConfig.failureOrCorrectionModel}; ${bossRecipe.correction}`,
    learningConsequenceModel: `${authoredBossConfig.learningConsequenceModel}; ${bossRecipe.progress}`,
    mechanicRoles: Object.freeze([...authoredBossConfig.mechanicRoles, ...bossRecipe.roles]),
    physicalActionRoles: Object.freeze([...authoredBossConfig.physicalActionRoles, semanticLabel(bossRecipe.decisionFrame)])
  }) : null;
  const config = bossConfig || ACTION_CONFIGS[stop.id].transfer || storyTransferConfig(blueprint);
  const action = actionRecord({
    id: `${stop.id}-transfer`,
    kind: "transfer",
    config,
    stop,
    chapter,
    localIndex,
    review: false
  }, seenPowers);
  return Object.freeze({ ...action, connectedTextId });
}

function heartWordOpportunity({ stop, chapter, localIndex, slotId, slotIndex, afterPhaseId }, seenPowers) {
  const id = `${stop.id}-heart-${slotIndex + 1}`;
  const kit = HEART_WORD_BIOME_KITS[chapter.id];
  const pattern = HEART_WORD_PLAY_CONFIGURATIONS[((stop.index - 1) * 2) + slotIndex];
  if (!kit || !pattern) throw new Error(`${id}: missing authored heart-word play configuration`);
  const config = A(
    "memory-delivery-deliver-heart-word",
    `${stop.id}-heart-memory-${slotIndex + 1}`,
    `In ${kit.place}, the ${kit.carrier} ${pattern.rule}.`,
    pattern.childDecision,
    [`${slotId}-content`, `${slotId}-choices`],
    `${pattern.physical} with the ${kit.carrier}`,
    `${id}-delivered`,
    {
      recipientId: chapter.cast.guide.name,
      recipientRole: kit.recipientRole,
      objectRoles: pattern.objects.map(objectRole => `${kit.carrier} ${objectRole}`),
      consequence: `${kit.place} ${kit.route}: ${pattern.consequence}`,
      contentBinding: contentBinding({
        slotId,
        requiredActivityType: pattern.activityFocus,
        actionId: id,
        visitOwnerId: id,
        isVisitOwner: true
      }),
      activityFocus: pattern.activityFocus,
      decisionModel: pattern.decisionModel,
      inputPattern: pattern.inputPattern,
      failureOrCorrectionModel: pattern.failureOrCorrectionModel,
      learningConsequenceModel: pattern.learningConsequenceModel,
      mechanicRoles: pattern.mechanicRoles,
      physicalActionRoles: pattern.physicalActionRoles,
      contentCategory: pattern.contentCategory,
      mechanicFamilyId: pattern.mechanicFamilyId,
      constructId: pattern.constructId,
      decisionConstruct: pattern.decisionConstruct,
      inputConstruct: pattern.inputConstruct,
      correctionConstruct: pattern.correctionConstruct,
      physicalActionConstruct: pattern.physicalActionConstruct,
      evidenceConstruct: pattern.evidenceConstruct
    }
  );
  const contract = decisionContract(config.instructionId);
  registerInteractionContext(config, {
    chapterId: chapter.id,
    role: `heart-${slotIndex + 1}`,
    localIndex
  });
  return Object.freeze(withFirstUseOnboarding({
    id,
    kind: "content_opportunity",
    configurationId: `${id}-configuration`,
    afterPhaseId,
    slotId,
    category: "heartWords",
    ...contract,
    contextId: config.contextId,
    contentBinding: config.contentBinding,
    activityFocus: config.activityFocus,
    evidenceConstruct: config.evidenceConstruct,
    allowedActivityTypes: ALLOWED_HEART_ACTIVITIES,
    resume: Object.freeze({
      checkpointId: id,
      idempotencyKey: `${id}:${slotId}`,
      replayPolicy: "resume_same_slot"
    })
  }, seenPowers));
}

function buildExpedition(blueprint, blueprintIndex, seenPowers) {
  const stop = QUEST_STOPS[blueprintIndex];
  if (!stop || stop.id !== blueprint.stopId) throw new Error(`${blueprint.stopId}: expedition order changed`);
  const chapter = chapterForStop(stop.id);
  const localIndex = chapter.stopIds.indexOf(stop.id);
  const review = stop.teach.length === 0;
  const actionConfigs = ACTION_CONFIGS[stop.id];
  if (!actionConfigs?.primary || !actionConfigs?.secondary) {
    throw new Error(`${stop.id}: missing concrete primary/secondary configuration`);
  }

  const residentNames = new Set([chapter.cast.guide.name, ...chapter.cast.residents.map(resident => resident.name)]);
  if (!residentNames.has(blueprint.residentId)) throw new Error(`${stop.id}:${blueprint.residentId} is not in the chapter cast`);

  const introducedTargetIds = Object.freeze(stop.teach.map(target => target.id));
  const teachSequence = createTeachSequence(stop);
  const teach = Object.freeze({
    mode: review ? "review" : "introduce",
    targetIds: introducedTargetIds,
    reviewSourceId: review ? SOUND_SEEKERS_REVIEW_SOURCE_ID : null,
    instructionIds: Object.freeze(review
      ? ["echo-search-replay"]
      : [...new Set(teachSequence.items.map(item => item.instructionId))]),
    scored: false
  });
  const heartWordSlotIds = Object.freeze([`heart-slot-${stop.id}-1`, `heart-slot-${stop.id}-2`]);
  const connectedTextId = `scene-${stop.id}`;
  const alternatives = stop.teach.some(target => target.kind === "alt")
    ? Object.freeze([`alternative-slot-${stop.id}`])
    : Object.freeze([]);
  const morphology = stop.teach.some(target => target.kind === "morph")
    ? Object.freeze([`morphology-slot-${stop.id}`])
    : Object.freeze([]);
  const contentDeckSlotIds = Object.freeze({
    heartWords: heartWordSlotIds,
    stories: Object.freeze([`story-slot-${stop.id}`]),
    alternatives,
    morphology,
    transfer: Object.freeze([`transfer-slot-${stop.id}`])
  });

  const primary = actionRecord({
    id: `${stop.id}-primary`, kind: "challenge", config: actionConfigs.primary,
    stop, chapter, localIndex, review
  }, seenPowers);
  const secondary = actionRecord({
    id: `${stop.id}-secondary`, kind: "challenge", config: actionConfigs.secondary,
    stop, chapter, localIndex, review
  }, seenPowers);
  if (primary.powerId === secondary.powerId || primary.expectedAction === secondary.expectedAction) {
    throw new Error(`${stop.id}: primary and secondary actions must be cognitively distinct`);
  }

  const transfer = transferRecord({ blueprint, stop, chapter, localIndex, connectedTextId }, seenPowers);
  const phases = Object.freeze([
    Object.freeze({ id: `${stop.id}-arrival`, kind: "arrival", recordsDomain: null }),
    Object.freeze({ id: `${stop.id}-teach`, kind: "teach", recordsDomain: null }),
    primary,
    secondary,
    Object.freeze({ id: `${stop.id}-wonder`, kind: "wonder", recordsDomain: null }),
    transfer,
    Object.freeze({ id: `${stop.id}-payoff`, kind: "payoff", recordsDomain: null })
  ]);
  const heartWordOpportunities = Object.freeze(heartWordSlotIds.map((slotId, slotIndex) => heartWordOpportunity({
    stop,
    chapter,
    localIndex,
    slotId,
    slotIndex,
    afterPhaseId: stop.id === "s6" && slotIndex === 0
      ? `${stop.id}-teach`
      : (slotIndex === 0 ? primary.id : secondary.id)
  }, seenPowers)));

  return Object.freeze({
    id: `expedition-${stop.id}`,
    stopId: stop.id,
    stopIndex: stop.index,
    chapterId: chapter.id,
    title: blueprint.title,
    residentId: blueprint.residentId,
    arrival: Object.freeze({ problemId: blueprint.problemId, consequencePreviewId: blueprint.previewId }),
    teach,
    phases,
    heartWordSlotIds,
    heartWordOpportunities,
    contentDeckSlotIds,
    connectedTextId,
    wonder: Object.freeze({
      id: chapter.wonderId,
      representation: WONDER_REPRESENTATION_BY_CHAPTER[chapter.id]
    }),
    transfer: Object.freeze({ boss: Boolean(BOSS_CONFIGS[stop.id]), imaginary: false }),
    payoff: Object.freeze({
      repairId: chapter.repairBeatIds[localIndex],
      relationshipBeatId: blueprint.relationshipBeatId,
      consequenceId: blueprint.consequenceId
    }),
    resume: Object.freeze({
      safePhaseIds: Object.freeze([
        `${stop.id}-arrival`, `${stop.id}-teach`, `${stop.id}-primary`, `${stop.id}-secondary`,
        `${stop.id}-transfer`, `${stop.id}-payoff`
      ]),
      safeContentOpportunityIds: Object.freeze(heartWordOpportunities.map(opportunity => opportunity.id))
    }),
    naturalStop: true
  });
}

function requiredText(value, field) {
  const normalized = String(value || "").trim();
  if (!normalized) throw new Error(`bound content instance needs ${field}`);
  return normalized;
}

const CONTENT_BINDING_KEYS = Object.freeze([
  "actionUseId", "category", "contentInstanceId", "isVisitOwner", "requiredActivityType", "slotId", "visitOwnerId"
]);
const SERVED_HEART_INSTANCE_KEYS = Object.freeze([
  "answerTokensByActivity", "category", "contentId", "contentInstanceId", "eligibleActivityTypes",
  "journeyStep", "nextState", "ownerActionUseId", "ownerActivityType", "recordId", "slotId",
  "stopId", "targetId", "visitId", "visitOwnerId", "wordId"
]);
const HEART_CATALOG_RECORD_KEYS = Object.freeze([
  "answerTokensByActivity", "category", "contentId", "display", "eligibleActivityTypes", "heartParts",
  "introductionSlotId", "introductionStopId", "meaningId", "pronunciationId", "recordId", "regularParts",
  "slotIds", "targetId", "wordId"
]);

function assertExactRecordShape(record, expectedKeys, label) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new Error(`${label} must match the exact ${label} shape`);
  }
  const keys = Object.keys(record).sort();
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error(`${label} must match the exact ${label} shape`);
  }
}

function validateHeartActivityAnswers(record, label) {
  if (!Array.isArray(record.eligibleActivityTypes)
    || record.eligibleActivityTypes.length === 0
    || new Set(record.eligibleActivityTypes).size !== record.eligibleActivityTypes.length
    || record.eligibleActivityTypes.some(activity => !HEART_ACTIVITY_SET.has(activity))) {
    throw new Error(`${label} has invalid eligible heart-word activities`);
  }
  if (!record.answerTokensByActivity
    || typeof record.answerTokensByActivity !== "object"
    || Array.isArray(record.answerTokensByActivity)) {
    throw new Error(`${label} needs answerTokensByActivity`);
  }
  const answerActivityKeys = Object.keys(record.answerTokensByActivity).sort();
  const eligibleActivityKeys = [...record.eligibleActivityTypes].sort();
  if (answerActivityKeys.length !== eligibleActivityKeys.length
    || answerActivityKeys.some((key, index) => key !== eligibleActivityKeys[index])
    || answerActivityKeys.some(key => {
      const token = record.answerTokensByActivity[key];
      return (typeof token !== "string" && typeof token !== "number") || String(token).length === 0;
    })) {
    throw new Error(`${label} answer tokens must exactly match eligible activities`);
  }
}

function sameStringArray(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sameAnswerTokens(left, right) {
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const keys = Object.keys(left).sort();
  return keys.length === Object.keys(right).length
    && keys.every(key => Object.hasOwn(right, key) && left[key] === right[key]);
}

export function validateBoundContentDecisionSource({ servedInstance, catalogRecord } = {}) {
  assertExactRecordShape(servedInstance, SERVED_HEART_INSTANCE_KEYS, "canonical served instance");
  assertExactRecordShape(catalogRecord, HEART_CATALOG_RECORD_KEYS, "canonical catalog record");

  for (const field of [
    "category", "contentId", "contentInstanceId", "ownerActionUseId", "recordId", "slotId", "stopId",
    "targetId", "visitId", "visitOwnerId", "wordId"
  ]) requiredText(servedInstance[field], `served ${field}`);
  if (servedInstance.category !== "heartWords") throw new Error("canonical served instance must be a heart-word instance");
  if (!Number.isInteger(servedInstance.journeyStep) || servedInstance.journeyStep <= 0) {
    throw new Error("canonical served instance needs a positive journeyStep");
  }
  if (!servedInstance.nextState || typeof servedInstance.nextState !== "object" || Array.isArray(servedInstance.nextState)) {
    throw new Error("canonical served instance needs its reducer nextState");
  }
  if (!HEART_ACTIVITY_SET.has(servedInstance.ownerActivityType)) {
    throw new Error("canonical served instance has an invalid owner activity");
  }
  if (servedInstance.contentInstanceId !== `heart-content-instance:${servedInstance.slotId}`) {
    throw new Error("canonical served instance content identity is inconsistent with its slot");
  }
  if (servedInstance.ownerActionUseId !== `${servedInstance.visitOwnerId}:content-use`) {
    throw new Error("canonical served instance owner action is inconsistent");
  }
  if (!servedInstance.slotId.startsWith(`heart-slot-${servedInstance.stopId}-`)) {
    throw new Error("canonical served instance slot is inconsistent with its stop");
  }
  validateHeartActivityAnswers(servedInstance, "canonical served instance");

  for (const field of [
    "category", "contentId", "display", "introductionSlotId", "introductionStopId", "meaningId",
    "pronunciationId", "recordId", "targetId", "wordId"
  ]) requiredText(catalogRecord[field], `catalog ${field}`);
  if (catalogRecord.category !== "heartWords") throw new Error("canonical catalog record must be a heart-word record");
  if (!Array.isArray(catalogRecord.regularParts)
    || !Array.isArray(catalogRecord.heartParts)
    || !Array.isArray(catalogRecord.slotIds)
    || catalogRecord.slotIds.length === 0
    || !catalogRecord.slotIds.every(slotId => typeof slotId === "string" && slotId.length > 0)
    || !catalogRecord.slotIds.includes(catalogRecord.introductionSlotId)) {
    throw new Error("canonical catalog record has invalid authored part or slot metadata");
  }
  const partIndices = [...catalogRecord.regularParts, ...catalogRecord.heartParts];
  if (partIndices.length === 0
    || partIndices.some(index => !Number.isInteger(index) || index < 0)
    || new Set(partIndices).size !== partIndices.length) {
    throw new Error("canonical catalog record has invalid pronunciation-unit parts");
  }
  validateHeartActivityAnswers(catalogRecord, "canonical catalog record");

  for (const field of ["category", "recordId", "contentId", "targetId", "wordId"]) {
    if (servedInstance[field] !== catalogRecord[field]) {
      throw new Error(`served ${field} does not match canonical catalog ${field}`);
    }
  }
  if (!sameStringArray(servedInstance.eligibleActivityTypes, catalogRecord.eligibleActivityTypes)
    || !sameAnswerTokens(servedInstance.answerTokensByActivity, catalogRecord.answerTokensByActivity)) {
    throw new Error("served activity eligibility and answers do not match the canonical catalog record");
  }
  return Object.freeze({ servedInstance, catalogRecord });
}

function validatedContentBinding(action) {
  const binding = action.contentBinding;
  if (!binding || binding.category !== "heartWords") {
    throw new Error(`${action.id || "decision"}: heart-word decision needs a content binding`);
  }
  assertExactRecordShape(binding, CONTENT_BINDING_KEYS, "content binding");
  for (const field of ["slotId", "contentInstanceId", "visitOwnerId", "actionUseId", "requiredActivityType"]) {
    requiredText(binding[field], field);
  }
  if (binding.contentInstanceId !== `heart-content-instance:${binding.slotId}`) {
    throw new Error(`${action.id}: content instance identity does not match its structural slot`);
  }
  if (binding.actionUseId !== `${action.id}:content-use`) {
    throw new Error(`${action.id}: actionUseId does not match its immutable action`);
  }
  if (typeof binding.isVisitOwner !== "boolean") {
    throw new Error(`${action.id}: content binding needs an explicit visit ownership flag`);
  }
  if (!HEART_ACTIVITY_SET.has(binding.requiredActivityType)) {
    throw new Error(`${action.id}: content binding activity is invalid`);
  }
  return binding;
}

function expeditionHeartWordActions(expedition) {
  return [...(expedition?.phases || []), ...(expedition?.heartWordOpportunities || [])]
    .filter(action => action.recordsDomain === "heart_word_mapping");
}

function sameContentBinding(left, right) {
  return CONTENT_BINDING_KEYS.every(key => left?.[key] === right?.[key]);
}

function canonicalVisitOwnerBinding(action, binding) {
  const expedition = SOUND_SEEKERS_EXPEDITIONS.find(candidate =>
    expeditionHeartWordActions(candidate).some(candidateAction => candidateAction.id === action.id));
  const canonicalAction = expeditionHeartWordActions(expedition)
    .find(candidateAction => candidateAction.id === action.id);
  if (!canonicalAction || !sameContentBinding(binding, canonicalAction.contentBinding)) {
    throw new Error(`${action.id || "decision"}: content binding does not match its canonical visit owner or expedition action`);
  }
  const ownerAction = expeditionHeartWordActions(expedition)
    .find(candidateAction => candidateAction.id === binding.visitOwnerId);
  if (!ownerAction) {
    throw new Error(`${action.id}: canonical visit owner does not resolve to an expedition action`);
  }
  const ownerBinding = validatedContentBinding(ownerAction);
  if (!ownerBinding.isVisitOwner
    || ownerBinding.visitOwnerId !== ownerAction.id
    || ownerBinding.category !== binding.category
    || ownerBinding.slotId !== binding.slotId
    || ownerBinding.contentInstanceId !== binding.contentInstanceId) {
    throw new Error(`${action.id}: canonical visit owner does not own this content instance`);
  }
  return ownerBinding;
}

export function assertExpeditionContentOwnership(expedition = {}) {
  const actions = [...(expedition.phases || []), ...(expedition.heartWordOpportunities || [])]
    .filter(action => action.recordsDomain === "heart_word_mapping");
  const actionsById = new Map(actions.map(action => [action.id, action]));
  const groups = new Map();
  const actionUseIds = new Set();
  for (const action of actions) {
    const binding = validatedContentBinding(action);
    if (!expedition.contentDeckSlotIds?.heartWords?.includes(binding.slotId)) {
      throw new Error(`${action.id}: content binding does not reference an expedition heart-word slot`);
    }
    if (action.kind === "content_opportunity"
      && (action.slotId !== binding.slotId || action.category !== binding.category)) {
      throw new Error(`${action.id}: opportunity slot and category do not match its content binding`);
    }
    if (actionUseIds.has(binding.actionUseId)) {
      throw new Error(`${action.id}: immutable actionUseId must be unique`);
    }
    actionUseIds.add(binding.actionUseId);
    const group = groups.get(binding.contentInstanceId) || [];
    group.push({ action, binding });
    groups.set(binding.contentInstanceId, group);
  }

  for (const [contentInstanceId, group] of groups) {
    const ownerEntries = group.filter(entry => entry.binding.isVisitOwner);
    if (ownerEntries.length !== 1) {
      throw new Error(`${contentInstanceId}: shared content instance needs exactly one visit owner`);
    }
    const owner = ownerEntries[0];
    if (owner.action.kind !== "content_opportunity" || owner.binding.visitOwnerId !== owner.action.id) {
      throw new Error(`${contentInstanceId}: visit owner must be the scheduled content opportunity`);
    }
    if (!actionsById.has(owner.action.id)) {
      throw new Error(`${contentInstanceId}: visit owner does not resolve to an expedition action`);
    }
    for (const entry of group) {
      if (entry.binding.visitOwnerId !== owner.action.id
        || entry.binding.slotId !== owner.binding.slotId
        || entry.binding.category !== owner.binding.category) {
        throw new Error(`${contentInstanceId}: content uses do not agree on visit owner, slot, and category`);
      }
    }
  }
  return true;
}

export function resolveBoundContentDecision(action = {}, source = {}) {
  if (action.recordsDomain !== "heart_word_mapping") {
    throw new Error(`${action.id || "decision"}: content binding resolver requires a heart-word decision`);
  }
  const binding = validatedContentBinding(action);
  const ownerBinding = canonicalVisitOwnerBinding(action, binding);
  const { servedInstance, catalogRecord } = validateBoundContentDecisionSource(source);
  if (servedInstance.category !== binding.category) throw new Error(`${action.id}: content category does not match binding`);
  if (servedInstance.slotId !== binding.slotId) throw new Error(`${action.id}: content slot does not match binding`);
  if (servedInstance.contentInstanceId !== binding.contentInstanceId) {
    throw new Error(`${action.id}: content instance identity does not match binding`);
  }
  if (servedInstance.visitOwnerId !== binding.visitOwnerId) {
    throw new Error(`${action.id}: served visit owner does not match binding`);
  }
  if (servedInstance.ownerActionUseId !== ownerBinding.actionUseId) {
    throw new Error(`${action.id}: served owner action does not match the canonical visit owner`);
  }
  if (servedInstance.ownerActivityType !== ownerBinding.requiredActivityType) {
    throw new Error(`${action.id}: served canonical owner activity does not match the visit owner`);
  }
  const visitId = requiredText(servedInstance.visitId, "visitId");

  const recordId = requiredText(catalogRecord.recordId, "recordId");
  const contentId = requiredText(catalogRecord.contentId, "contentId");
  const targetId = requiredText(catalogRecord.targetId, "targetId");
  const wordId = requiredText(catalogRecord.wordId, "wordId").toLocaleLowerCase();
  if (recordId !== `hw:${wordId}` || targetId !== recordId || contentId !== `heart-word:${wordId}`) {
    throw new Error(`${action.id}: heart-word record, target, and word identities do not agree`);
  }
  if (!catalogRecord.eligibleActivityTypes.includes(binding.requiredActivityType)) {
    throw new Error(`${action.id}: content instance is not eligible for the bound activity`);
  }
  const expectedToken = catalogRecord.answerTokensByActivity[binding.requiredActivityType];
  if ((typeof expectedToken !== "string" && typeof expectedToken !== "number") || String(expectedToken).length === 0) {
    throw new Error(`${action.id}: bound content instance needs an answer token`);
  }
  return Object.freeze({
    ...action,
    actionUseId: binding.actionUseId,
    contentInstanceId: binding.contentInstanceId,
    visitId,
    visitOwnerId: binding.visitOwnerId,
    recordId,
    contentId,
    targetId,
    wordId,
    activityType: binding.requiredActivityType,
    expectedToken
  });
}

export const MAX_DUPLICATE_COGNITIVE_SIGNATURES = 2;

const HEART_WORD_PHYSICAL_CONSTRUCT_PATTERN = Object.freeze({
  recognition: /\bword\b/u,
  heart_part_mapping: /\b(?:irregular|heart)\b[\s\S]*\b(?:unit|part|position)\b/u,
  encoding: /\b(?:letter|spelling)\b/u,
  sentence_use: /^(?=[\s\S]*\bword\b)(?=[\s\S]*\b(?:sentence|gap|meaning)\b)/u
});

function sameNormalizedSemanticList(left, right, { sort = false } = {}) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  const normalizedLeft = left.map(semanticLabel);
  const normalizedRight = right.map(semanticLabel);
  if (sort) {
    normalizedLeft.sort();
    normalizedRight.sort();
  }
  return normalizedLeft.length === normalizedRight.length
    && normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function assertAuthoredHeartWordMatrixRow(context, activity) {
  const expected = HEART_WORD_PLAY_CONFIGURATION_BY_KEY.get(
    `${context.mechanicFamilyId}:${context.activityFocus}`
  );
  if (!expected) {
    throw new Error(`${context.id || "heart-word interaction"}: missing authored matrix row`);
  }
  const exactSemanticFields = [
    "childDecision",
    "decisionModel",
    "inputPattern",
    "failureOrCorrectionModel",
    "learningConsequenceModel"
  ];
  const exactFieldsMatch = exactSemanticFields.every(field =>
    semanticLabel(context[field]) === semanticLabel(expected[field]));
  const kit = HEART_WORD_BIOME_KITS[context.chapterId];
  if (!kit) {
    throw new Error(`${context.id || "heart-word interaction"}: missing canonical biome wrapper`);
  }
  const physicalMatches = semanticLabel(context.physicalExpression)
    === semanticLabel(`${expected.physical} with the ${kit.carrier}`);
  const ruleMatches = semanticLabel(context.semanticRule)
    === semanticLabel(`In ${kit.place}, the ${kit.carrier} ${expected.rule}.`);
  const consequenceMatches = semanticLabel(context.consequence)
    === semanticLabel(`${kit.place} ${kit.route}: ${expected.consequence}`);
  if (!exactFieldsMatch
    || !sameNormalizedSemanticList(context.mechanicRoles, expected.mechanicRoles, { sort: true })
    || !sameNormalizedSemanticList(context.physicalActionRoles, expected.physicalActionRoles)
    || !physicalMatches
    || !ruleMatches
    || !consequenceMatches
    || context.constructId !== activity.constructId) {
    throw new Error(`${context.id || "heart-word interaction"}: semantics do not match the authored matrix row`);
  }
}

export function assertHeartWordInteractionCompatibility(context = {}) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    throw new Error("heart-word interaction compatibility needs one context record");
  }
  if (context.contentCategory !== "heartWords") {
    throw new Error(`${context.id || "heart-word interaction"}: heart-word mechanics cannot cross content categories`);
  }
  const activity = HEART_WORD_ACTIVITY_BY_FOCUS.get(context.activityFocus);
  if (!activity) {
    throw new Error(`${context.id || "heart-word interaction"}: unknown heart-word activity construct`);
  }
  if (!HEART_WORD_MECHANIC_BY_ID.has(context.mechanicFamilyId)) {
    throw new Error(`${context.id || "heart-word interaction"}: unknown mechanic family`);
  }
  const constructFields = [
    "constructId",
    "decisionConstruct",
    "inputConstruct",
    "correctionConstruct",
    "physicalActionConstruct",
    "evidenceConstruct"
  ];
  if (constructFields.some(field => context[field] !== activity.constructId)) {
    throw new Error(`${context.id || "heart-word interaction"}: must preserve a single ${activity.activityFocus} construct`);
  }
  if (context.childDecision !== activity.childDecision
    || !Array.isArray(context.decisionSteps)
    || context.decisionSteps.length !== 1
    || context.decisionSteps[0] !== activity.childDecision) {
    throw new Error(`${context.id || "heart-word interaction"}: child instruction must express only the ${activity.activityFocus} decision`);
  }
  const semanticPrefixes = [
    ["decisionModel", activity.decisionModel],
    ["inputPattern", activity.inputLayer],
    ["failureOrCorrectionModel", activity.correctionLayer],
    ["learningConsequenceModel", activity.learningConsequence]
  ];
  for (const [field, prefix] of semanticPrefixes) {
    if (!String(context[field] || "").startsWith(`${prefix};`)) {
      throw new Error(`${context.id || "heart-word interaction"}: ${field} crosses the ${activity.activityFocus} construct`);
    }
  }
  if (!String(context.semanticRule || "").includes(activity.rule)
    || !String(context.consequence || "").includes(`${activity.consequence};`)) {
    throw new Error(`${context.id || "heart-word interaction"}: rule or consequence crosses the ${activity.activityFocus} construct`);
  }
  const normalizedPhysicalExpression = semanticLabel(context.physicalExpression);
  if (!Array.isArray(context.physicalActionRoles)
    || context.physicalActionRoles.length !== 1
    || !normalizedPhysicalExpression.includes(semanticLabel(context.physicalActionRoles[0]))
    || !HEART_WORD_PHYSICAL_CONSTRUCT_PATTERN[activity.activityFocus].test(normalizedPhysicalExpression)
    || /;|\b(?:and|then|two|three|both)\b/iu.test(context.physicalExpression)) {
    throw new Error(`${context.id || "heart-word interaction"}: physical expression must contain one ${activity.activityFocus} action`);
  }
  assertAuthoredHeartWordMatrixRow(context, activity);
  return true;
}

export function assertSoundSeekersInteractionContexts(records) {
  const contexts = Array.isArray(records) ? records : Object.values(records || {});
  if (contexts.length === 0) throw new Error("Sound Seekers interaction contexts are required");
  const seenIds = new Set();
  const signatureCounts = new Map();
  for (const context of contexts) {
    if (!context || typeof context !== "object") throw new Error("interaction context must be a record");
    if (!String(context.id || "").trim() || seenIds.has(context.id)) throw new Error(`${context.id || "(missing)"}: duplicate or missing interaction context id`);
    seenIds.add(context.id);
    for (const field of [
      "semanticRule",
      "childDecision",
      "physicalExpression",
      "consequence",
      "activityFocus",
      "decisionModel",
      "inputPattern",
      "failureOrCorrectionModel",
      "learningConsequenceModel",
      "cognitiveSignature"
    ]) {
      if (!String(context[field] || "").trim()) throw new Error(`${context.id}: missing ${field}`);
    }
    if ((!Array.isArray(context.objectRoles) || context.objectRoles.length === 0) && !String(context.recipientRole || "").trim()) {
      throw new Error(`${context.id}: meaningful object or recipient roles are required`);
    }
    const canonicalSignature = canonicalCognitiveSignature(context);
    if (context.cognitiveSignature !== canonicalSignature) {
      throw new Error(`${context.id}: cognitive signature must equal its canonical semantic signature`);
    }
    if (!Array.isArray(context.mechanicRoles) || context.mechanicRoles.length === 0
      || !Array.isArray(context.physicalActionRoles) || context.physicalActionRoles.length === 0) {
      throw new Error(`${context.id}: theme-independent mechanic roles are required`);
    }
    if (context.contentCategory === "heartWords" || context.mechanicFamilyId) {
      assertHeartWordInteractionCompatibility(context);
    }
    if (!Array.isArray(context.decisionSteps) || context.decisionSteps.length === 0
      || context.childDecision !== context.decisionSteps[0]) {
      throw new Error(`${context.id}: child decision needs visible one immediate action steps`);
    }
    for (const step of context.decisionSteps) {
      const childWordCount = String(step || "").trim().split(/\s+/u).length;
      const punctuationCount = String(step || "").match(/[.!?]/gu)?.length || 0;
      if (childWordCount > 12
        || /,|;|\b(?:and|then)\b/iu.test(step)
        || punctuationCount !== 1
        || !DIRECT_ACTION_START.test(step)) {
        throw new Error(`${context.id}: each child decision step must contain one immediate action`);
      }
    }
    const count = (signatureCounts.get(context.cognitiveSignature) || 0) + 1;
    signatureCounts.set(context.cognitiveSignature, count);
    if (count > MAX_DUPLICATE_COGNITIVE_SIGNATURES) {
      throw new Error(`${context.id}: cognitive signature repeats more than ${MAX_DUPLICATE_COGNITIVE_SIGNATURES} times`);
    }
  }
  return true;
}

if (EXPEDITION_BLUEPRINTS.length !== QUEST_STOPS.length) {
  throw new Error("Sound Seekers needs one authored expedition blueprint per curriculum stop");
}
if (Object.keys(ACTION_CONFIGS).length !== QUEST_STOPS.length) {
  throw new Error("Sound Seekers needs concrete primary/secondary configurations for all 40 stops");
}

const seenPowers = new Set();
export const SOUND_SEEKERS_EXPEDITIONS = Object.freeze(EXPEDITION_BLUEPRINTS.map(
  (blueprint, index) => buildExpedition(blueprint, index, seenPowers)
));

export const SOUND_SEEKERS_INTERACTION_CONTEXTS = Object.freeze(Object.fromEntries(interactionContexts));
assertSoundSeekersInteractionContexts(SOUND_SEEKERS_INTERACTION_CONTEXTS);
for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
  const actions = [...expedition.phases, ...expedition.heartWordOpportunities].filter(item => item.powerId);
  for (const action of actions) {
    if (!SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId]) {
      throw new Error(`${action.id}: missing interaction context ${action.contextId}`);
    }
  }
  assertExpeditionContentOwnership(expedition);
}

const assessedWordIds = [...new Set(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases
  .map(phase => phase.wordId)
  .filter(Boolean)))];
assertShippingPronunciationLexicon(SOUND_SEEKERS_WORDS, { requiredEvidenceWordIds: assessedWordIds });

export const HEART_WORD_SLOT_IDS = Object.freeze(SOUND_SEEKERS_EXPEDITIONS.flatMap(
  expedition => expedition.heartWordSlotIds
));
export const HEART_WORD_OPPORTUNITY_IDS = Object.freeze(SOUND_SEEKERS_EXPEDITIONS.flatMap(
  expedition => expedition.heartWordOpportunities.map(opportunity => opportunity.id)
));
export const CONNECTED_TEXT_IDS = Object.freeze(SOUND_SEEKERS_EXPEDITIONS.map(
  expedition => expedition.connectedTextId
));
export const CONTENT_DECK_SLOT_IDS = Object.freeze({
  heartWords: HEART_WORD_SLOT_IDS,
  stories: Object.freeze(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.contentDeckSlotIds.stories)),
  alternatives: Object.freeze(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.contentDeckSlotIds.alternatives)),
  morphology: Object.freeze(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.contentDeckSlotIds.morphology)),
  transfer: Object.freeze(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.contentDeckSlotIds.transfer))
});

const expeditionsByStopId = new Map(SOUND_SEEKERS_EXPEDITIONS.map(expedition => [expedition.stopId, expedition]));

export function getExpedition(stopId) {
  return expeditionsByStopId.get(String(stopId || "").trim()) || null;
}
