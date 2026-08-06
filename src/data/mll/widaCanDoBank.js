import {
  MLL_KEY_LANGUAGE_USES,
  MLL_LEVELS,
  MLL_POLICY_VERSION,
  gradeClusterForGrade,
  mllLevelLabel
} from "../../policy/mllLanguagePolicy.js";

/**
 * The WIDA Can Do Descriptors, Key Uses Edition — K, Grade 1, Grades 2-3.
 *
 * Verbatim from WIDA's published PDFs:
 *   https://wida.wisc.edu/sites/default/files/resource/CanDo-KeyUses-Kindergarten.pdf
 *   https://wida.wisc.edu/sites/default/files/resource/CanDo-KeyUses-Gr-1.pdf
 *   https://wida.wisc.edu/sites/default/files/resource/CanDo-KeyUses-Gr-2-3.pdf
 *
 * TWO THINGS TO KNOW BEFORE USING THIS BANK.
 *
 * 1. It is keyed to the **2016** Key Uses — Recount, Explain, Argue, Discuss —
 *    while the current standards use the **2020** Key Language Uses — Narrate,
 *    Inform, Explain, Argue. WIDA split Recount into Narrate and Inform and
 *    absorbed Discuss into Standard 1. There is no 2020-aligned rewrite of the
 *    Can Do Descriptors; WIDA's forward path is the Language Charts, which
 *    become the interpretive tool for ACCESS scores from 2026-27.
 *
 *    `KEY_USE_CROSSWALK_2016_TO_2020` below is **this product's inference**, not
 *    a WIDA-published crosswalk. Every descriptor keeps `keyUse2016` as
 *    provenance so the bank can be re-keyed when WIDA publishes one, without
 *    re-deriving anything.
 *
 * 2. **Level 6 has no descriptors.** That is the source's choice, not an
 *    omission here — the framework declines to define an endpoint at which a
 *    multilingual learner is finished. `descriptorsFor` returns an empty list
 *    and a note, never a fabricated statement.
 *
 * Every descriptor begins with a gerund of an observable action and states a
 * present capability. That is the Can Do Philosophy, and it is why this bank is
 * usable as report copy without rewriting.
 */

export const WIDA_CAN_DO_EDITION = "Can Do Descriptors, Key Uses Edition (2016)";
export const WIDA_CAN_DO_MAX_LEVEL = 5;

export const KEY_USES_2016 = Object.freeze([
  Object.freeze({ id: "recount", label: "Recount", oralOnly: false }),
  Object.freeze({ id: "explain", label: "Explain", oralOnly: false }),
  Object.freeze({ id: "argue", label: "Argue", oralOnly: false }),
  Object.freeze({ id: "discuss", label: "Discuss", oralOnly: true })
]);

/**
 * Inferred, and labelled as such wherever it surfaces.
 *
 * Recount maps to Narrate when the descriptor is time-sequenced and to Inform
 * when it is definitional or descriptive. `recountSplitHint` on each descriptor
 * carries that judgement per row.
 */
export const KEY_USE_CROSSWALK_2016_TO_2020 = Object.freeze({
  recount: Object.freeze(["narrate", "inform"]),
  explain: Object.freeze(["explain"]),
  argue: Object.freeze(["argue"]),
  discuss: Object.freeze([])
});

export const KEY_USE_CROSSWALK_PROVENANCE =
  "WIDA states that Recount (2016) was divided into Narrate and Inform (2020) and that Discuss was absorbed into Standard 1. The row-by-row split below is Literacy Guide's inference, not a WIDA-published crosswalk.";

/**
 * Shape: cluster -> key use -> domain -> [level 1..5].
 * `discuss` is oral language only and is stored as a flat five-item list.
 */
const BANK = Object.freeze({
  K: Object.freeze({
    recount: Object.freeze({
      listening: Object.freeze([
        "Pointing to pictures described orally in context",
        "Responding with gestures to songs, chants, or stories modeled",
        "Acting out songs, chants, stories and poems with gestures",
        "Role playing in response to illustrated stories read aloud",
        "Arranging content-related objects or illustrations according to oral discourse"
      ]),
      speaking: Object.freeze([
        "Repeating words, simple phrases or expressions from familiar stories",
        "Restating some language associated with illustrated short stories",
        "Retelling main events in short narrative stories to peers using pictures",
        "Retelling familiar stories through a series of pictures",
        "Relating school-based content and personal experiences with peers"
      ]),
      reading: Object.freeze([
        "Matching icons and symbols to corresponding pictures",
        "Reproducing content-related information in oral text through drawings",
        "Identifying familiar words in context (e.g., in Big Books or wall charts)",
        "Identifying words in picture dictionaries",
        "Ordering words to form short sentences from oral models"
      ]),
      writing: Object.freeze([
        "Dictating personal information scribed by adults",
        "Drawing and labeling familiar people, objects, or events from models",
        "Reproducing familiar words from labeled models or illustrations",
        "Producing familiar words and phrases from environmental print",
        "Describing everyday experiences using illustrated phrases"
      ])
    }),
    explain: Object.freeze({
      listening: Object.freeze([
        "Identifying illustrated activities described orally",
        "Matching real-life objects to illustrations about their use based on oral descriptions",
        "Identifying language associated with features of objects or print",
        "Drawing individual phases or steps to 'how' questions",
        "Identifying illustrations related to cause and effect from oral information"
      ]),
      speaking: Object.freeze([
        "Identifying familiar objects used in everyday routines and activities",
        "Describing uses of everyday objects or roles of familiar people",
        "Comparing sizes of familiar phenomena",
        "Describing classroom routines",
        "Providing details related to classroom activities and tasks in small groups"
      ]),
      reading: Object.freeze([
        "Matching illustrations with modeled language with a partner",
        "Identifying illustrated words or icons to show why",
        "Pointing out causes or motives in illustrated stories read aloud",
        "Demonstrating the relationship between objects, people, or animals from models",
        "Matching familiar descriptive phrases to objects or illustrations"
      ]),
      writing: Object.freeze([
        "Describing familiar routines by drawing pictures and dictating to adults",
        "Connecting oral language to print",
        "Describing familiar events or phenomena using sentence starters",
        "Describing how to do something through a sequence of pictures",
        "Describing uses of tools or objects with a peer"
      ])
    }),
    argue: Object.freeze({
      listening: Object.freeze([
        "Identifying personal choices from different examples",
        "Discriminating between words and phrases related to personal choices",
        "Acting out opposites using gestures",
        "Drawing to make predictions from illustrated stories read aloud",
        "Agreeing or disagreeing with oral claims using gestures"
      ]),
      speaking: Object.freeze([
        "Stating personal likes from oral prompts",
        "Stating personal preferences",
        "Stating personal preferences or opinions",
        "Expressing likes, dislikes, or preferences with reasons",
        "Offering personal opinions about content-related ideas in small groups"
      ]),
      reading: Object.freeze([
        "Pointing to labeled pictures or objects of personal preferences",
        "Classifying labeled pictures of personal choices from stories",
        "Predicting next steps, actions, or events in informational text",
        "Interpreting pictures in informational text as true or false",
        "Evaluating situations in picture books and matching them to reasons"
      ]),
      writing: Object.freeze([
        "Illustrating likes or dislikes from real-life objects or pictures",
        "Drawing and reproducing words about preferences",
        "Agreeing or disagreeing with choices from models",
        "Producing statements about choices using different models",
        "Making requests to indicate preferences"
      ])
    }),
    discuss: Object.freeze([
      "Attending to the speaker to demonstrate understanding",
      "Addressing others according to relationship",
      "Working together collaboratively (e.g., taking turns, listening)",
      "Proposing ideas to contribute to conversations",
      "Asking questions to extend conversations"
    ])
  }),

  1: Object.freeze({
    recount: Object.freeze({
      listening: Object.freeze([
        "Mimicking gestures or movement associated with oral commands",
        "Acting out oral statements using manipulatives or real-life objects",
        "Sequencing pictures of stories read aloud (e.g., beginning, middle, end)",
        "Identifying characters, plots, and settings from oral stories",
        "Constructing models based on instructions from extended oral discourse"
      ]),
      speaking: Object.freeze([
        "Repeating words, phrases and memorized chunks of language",
        "Stating content-related facts in context (e.g., playing telephone)",
        "Retelling simple stories from picture cues",
        "Restating information with some details",
        "Presenting information on content-related topics"
      ]),
      reading: Object.freeze([
        "Using pictures and illustrations to identify themes or storylines",
        "Pointing to icons, letters, or illustrated words that represent ideas",
        "Identifying Wh-words in questions (e.g., who, what, when)",
        "Identifying the main topic of texts",
        "Distinguishing among characters, settings, and events in narratives"
      ]),
      writing: Object.freeze([
        "Forming words using a variety of strategies",
        "Providing information in graphic organizers",
        "Describing feelings or reactions to personal events or situations",
        "Producing a series of related sentences from transition word starters",
        "Composing stories or narratives using sequential language"
      ])
    }),
    explain: Object.freeze({
      listening: Object.freeze([
        "Identifying real-life objects based on descriptive oral phrases",
        "Classifying real-life objects according to their function based on oral directions",
        "Following peer statements to create projects",
        "Following illustrated content-related procedures shared orally",
        "Organizing causes and effects of various phenomena presented orally"
      ]),
      speaking: Object.freeze([
        "Answering questions with words or phrases (e.g., 'Go washroom.')",
        "Demonstrating how to do something using gestures or real-life objects",
        "Stating associations between two objects, people, or events",
        "Connecting ideas by building on guided conversations with peers",
        "Stating conditions for cause and effect (e.g., 'If it rains, I play inside.')"
      ]),
      reading: Object.freeze([
        "Identifying icons from illustrated texts or media with a partner",
        "Matching descriptive labels or headings to illustrated text",
        "Sorting illustrated content words and phrases into categories",
        "Finding details in illustrated narrative or informational texts",
        "Ordering content-related events according to information in illustrated texts"
      ]),
      writing: Object.freeze([
        "Designing, drawing and labeling content-specific models",
        "Labeling and illustrating observations over time (e.g., growing plants)",
        "Classifying illustrated words and phrases into groups",
        "Describing models related to content-related phenomena in pictures",
        "Describing causes and effects of actions and strategies"
      ])
    }),
    argue: Object.freeze({
      listening: Object.freeze([
        "Answering questions about likes and preferences",
        "Evaluating options to make personal choices from oral simple sentences",
        "Classifying objects according to descriptive oral statements",
        "Organizing information from oral comparisons of people or objects",
        "Identifying claims and reasons from oral discourse"
      ]),
      speaking: Object.freeze([
        "Expressing preferences in naming and pointing to objects",
        "Responding to short statements or questions about choices",
        "Describing characters or objects using pictures or actions",
        "Justifying the use of objects for particular purposes",
        "Comparing and contrasting content-related ideas"
      ]),
      reading: Object.freeze([
        "Categorizing labeled pictures or photographs",
        "Identifying information related to events from graphics",
        "Identifying persuasive words in written phrases or statements",
        "Distinguishing characters' opinions or preferences from illustrated text",
        "Determining what happens next from illustrated observations"
      ]),
      writing: Object.freeze([
        "Indicating agreement with opinions of others using labeled drawings",
        "Producing simple sentences from models about likes, wants, and needs",
        "Participating in interactive journals with peers",
        "Describing patterns in processes and stories to use as evidence",
        "Providing simple edits to peers' writing"
      ])
    }),
    discuss: Object.freeze([
      "Tracking the speakers to demonstrate understanding",
      "Following along familiar routines of small and large groups",
      "Asking clarifying questions",
      "Using intonation appropriate for the purposes of communication",
      "Asking and answering questions to maintain conversations"
    ])
  }),

  "2-3": Object.freeze({
    recount: Object.freeze({
      listening: Object.freeze([
        "Showing what happens next based on familiar oral stories (e.g., by pointing or drawing)",
        "Identifying the 'who,' 'where' and 'when' of illustrated statements",
        "Identifying linking words or phrases related to passage of time in speech",
        "Re-enacting content-related situations or events from oral descriptions",
        "Identifying details of content-related topics from oral discourse"
      ]),
      speaking: Object.freeze([
        "Responding to questions related to stories or experiences (e.g., 'Who came to the door?')",
        "Reproducing facts or statements in context",
        "Retelling simple stories from picture cues",
        "Sequencing events in stories with temporal transitions (e.g., 'After the sun set...')",
        "Describing main ideas of content-related information"
      ]),
      reading: Object.freeze([
        "Identifying key words and phrases in illustrated text",
        "Identifying time-related language in context (e.g., in biographies)",
        "Creating timelines or graphic organizers from illustrated related statements",
        "Ordering a series of events based on familiar texts",
        "Paraphrasing narratives or informational text with support"
      ]),
      writing: Object.freeze([
        "Labeling images that illustrate the steps for different processes",
        "Listing ideas using graphic organizers",
        "Retelling past experiences",
        "Describing a series of events or procedures",
        "Describing the sequence of content-related ideas"
      ])
    }),
    explain: Object.freeze({
      listening: Object.freeze([
        "Pointing to visual characteristics of models or real-life objects from oral clues",
        "Matching oral descriptions to photos, pictures, or icons",
        "Carrying out steps described orally to solve problems",
        "Identifying connectors in speech or text read aloud",
        "Identifying the purpose of language/the message in each content area"
      ]),
      speaking: Object.freeze([
        "Describing the outcomes of experiments or stories with guidance and visual support",
        "Naming steps in processes or procedures",
        "Describing relationships between objects or uses for tools",
        "Stating details of processes or procedures",
        "Connecting ideas in content-related presentations"
      ]),
      reading: Object.freeze([
        "Identifying words and phrases in titles and highlighted texts",
        "Interpreting images, illustrations, and graphics",
        "Sequencing sentences descriptive of processes or procedures in informational texts",
        "Illustrating cause/effect relationships in content area texts",
        "Identifying relevant information from texts on the same content area topic"
      ]),
      writing: Object.freeze([
        "Listing and illustrating ideas",
        "Describing elements of processes or procedures",
        "Comparing causes of different phenomena",
        "Relating details and illustrating stages of different cycles (e.g., frogs, plants)",
        "Describing details of processes, procedures, and events"
      ])
    }),
    argue: Object.freeze({
      listening: Object.freeze([
        "Indicating personal points of view in response to oral phrases or short sentences",
        "Distinguishing opinions from facts from peers' oral presentations",
        "Identifying similarities and differences from oral content-related materials",
        "Interpreting oral information from different sides",
        "Comparing oral arguments with representations and models"
      ]),
      speaking: Object.freeze([
        "Stating a claim or position from models or examples",
        "Telling what comes next and showing why",
        "Describing organizing categories for content-related information",
        "Defending claims or opinions to content-related topics",
        "Expressing and supporting different ideas with examples"
      ]),
      reading: Object.freeze([
        "Identifying facts in illustrated informational text read orally",
        "Distinguishing fact from fiction (e.g., using sentence strips or highlighting texts)",
        "Identifying different ideas or opinions in written texts",
        "Sorting content-related information according to specific criteria (e.g., pros and cons)",
        "Identifying data from written sources to support positions"
      ]),
      writing: Object.freeze([
        "Indicating decisions or preferences through labeled pictures, words, or phrases",
        "Participating in shared opinion writing experiences",
        "Communicating different content-related ideas or opinions",
        "Supporting main ideas or opinions with evidence from texts",
        "Producing persuasive pieces supported by multiple reasons or details"
      ])
    }),
    discuss: Object.freeze([
      "Expressing own ideas through drawings, gestures, words and phrases",
      "Asking yes or no questions to request clarification",
      "Negotiating agreement in small groups",
      "Expressing own ideas and supporting ideas of others",
      "Initiating and maintaining conversations"
    ])
  })
});

/**
 * Rows whose Recount descriptor is time-sequenced map to Narrate; the rest map
 * to Inform. Keyed `cluster:domain:level`. Anything absent defaults to Narrate,
 * which is the closer of the two to the original Recount sense.
 */
const RECOUNT_INFORM_ROWS = new Set([
  "K:reading:1", "K:writing:1", "K:writing:2", "K:reading:4", "K:writing:4",
  "1:speaking:2", "1:reading:2", "1:reading:3", "1:reading:4", "1:writing:2",
  "2-3:speaking:2", "2-3:reading:1", "2-3:writing:1", "2-3:writing:2", "2-3:speaking:5"
]);

function keyUse2020For(keyUse2016, cluster, domain, level) {
  if (keyUse2016 !== "recount") {
    return KEY_USE_CROSSWALK_2016_TO_2020[keyUse2016]?.[0] || "";
  }
  return RECOUNT_INFORM_ROWS.has(`${cluster}:${domain}:${level}`) ? "inform" : "narrate";
}

function normalizeCluster(clusterOrGrade) {
  const raw = String(clusterOrGrade || "").trim();
  if (BANK[raw]) return raw;
  const derived = gradeClusterForGrade(raw);
  return BANK[derived] ? derived : "";
}

function descriptorRow({ cluster, keyUse2016, domain, level, text }) {
  const keyUse2020 = keyUse2020For(keyUse2016, cluster, domain, level);
  return {
    id: `${cluster}:${keyUse2016}:${domain}:${level}`,
    cluster,
    clusterLabel: cluster === "K" ? "Kindergarten" : cluster === "1" ? "Grade 1" : "Grades 2-3",
    domain,
    domainLabel: domain.charAt(0).toUpperCase() + domain.slice(1),
    level,
    levelLabel: mllLevelLabel(level),
    text,
    keyUse2016,
    keyUse2016Label: KEY_USES_2016.find(entry => entry.id === keyUse2016)?.label || "",
    keyUse2020,
    keyUse2020Label: MLL_KEY_LANGUAGE_USES.find(entry => entry.id === keyUse2020)?.label || "",
    crosswalkInferred: keyUse2016 === "recount",
    edition: WIDA_CAN_DO_EDITION,
    policyVersion: MLL_POLICY_VERSION
  };
}

/**
 * Every descriptor for a cluster, level and (optionally) domain or key use.
 *
 * Level 6 returns an empty list with a `note` rather than an invented statement.
 */
export function descriptorsFor({
  grade = "",
  cluster = "",
  level = null,
  domain = "",
  keyUse2020 = "",
  limit = 0
} = {}) {
  const resolvedCluster = normalizeCluster(cluster || grade);
  if (!resolvedCluster) {
    return { cluster: "", descriptors: [], note: "No WIDA grade cluster is set for this student." };
  }
  // `Number(null)` is 0, which is finite — so an unset level would silently
  // filter every descriptor out. Treat null/"" as "no filter", explicitly.
  const levelNumber = level === null || level === undefined || level === "" ? NaN : Number(level);
  if (Number.isFinite(levelNumber) && levelNumber > WIDA_CAN_DO_MAX_LEVEL) {
    return {
      cluster: resolvedCluster,
      descriptors: [],
      note:
        "The Can Do Descriptors stop at Level 5. WIDA deliberately leaves Level 6 open-ended — the framework declines to define a point at which a multilingual learner is finished."
    };
  }

  const clusterBank = BANK[resolvedCluster];
  const results = [];

  KEY_USES_2016.forEach(keyUse => {
    if (keyUse.id === "discuss") {
      if (domain && !["listening", "speaking"].includes(domain)) return;
      if (keyUse2020) return; // Discuss has no 2020 Key Language Use
      clusterBank.discuss.forEach((text, index) => {
        const descriptorLevel = index + 1;
        if (Number.isFinite(levelNumber) && descriptorLevel !== levelNumber) return;
        results.push({
          ...descriptorRow({
            cluster: resolvedCluster,
            keyUse2016: "discuss",
            domain: "oral_language",
            level: descriptorLevel,
            text
          }),
          domainLabel: "Oral language",
          keyUse2020: "",
          keyUse2020Label: "Social and Instructional Language (Standard 1)",
          crosswalkInferred: true
        });
      });
      return;
    }

    Object.entries(clusterBank[keyUse.id]).forEach(([domainId, texts]) => {
      if (domain && domainId !== domain) return;
      texts.forEach((text, index) => {
        const descriptorLevel = index + 1;
        if (Number.isFinite(levelNumber) && descriptorLevel !== levelNumber) return;
        const row = descriptorRow({
          cluster: resolvedCluster,
          keyUse2016: keyUse.id,
          domain: domainId,
          level: descriptorLevel,
          text
        });
        if (keyUse2020 && row.keyUse2020 !== keyUse2020) return;
        results.push(row);
      });
    });
  });

  return {
    cluster: resolvedCluster,
    descriptors: limit > 0 ? results.slice(0, limit) : results,
    total: results.length,
    note: results.length ? "" : "No descriptors match this filter."
  };
}

/**
 * The three to five statements a report prints per domain.
 *
 * Takes the descriptors at the student's working level, which is what "can do
 * now" means. When the working level is a range — which it usually is, because
 * this product emits ranges — it takes the lower bound, because a report should
 * claim what is securely observable rather than the most flattering reading.
 */
export function canDoStatementsForReport({
  grade = "",
  cluster = "",
  levelLow = null,
  domain = "",
  count = 4
} = {}) {
  const level = Number(levelLow);
  if (!Number.isFinite(level) || level < 1) {
    return {
      statements: [],
      note: "No working level has been recorded yet, so no Can Do statements are shown."
    };
  }
  const result = descriptorsFor({ grade, cluster, level: Math.min(level, WIDA_CAN_DO_MAX_LEVEL), domain });
  const statements = result.descriptors.slice(0, count).map(row => ({
    text: row.text,
    keyUse: row.keyUse2020Label || row.keyUse2016Label,
    level: row.level,
    levelLabel: row.levelLabel,
    source: WIDA_CAN_DO_EDITION,
    inferredCrosswalk: row.crosswalkInferred
  }));
  return {
    statements,
    note: result.note || (level > WIDA_CAN_DO_MAX_LEVEL
      ? "Shown at Level 5; the descriptors do not extend to Level 6."
      : "")
  };
}

/** Everything, flattened — for the workbook's descriptor sheet and for tests. */
export function allDescriptors() {
  return ["K", "1", "2-3"].flatMap(cluster => descriptorsFor({ cluster }).descriptors);
}

export function canDoBankStats() {
  const rows = allDescriptors();
  return {
    edition: WIDA_CAN_DO_EDITION,
    total: rows.length,
    clusters: ["K", "1", "2-3"],
    levels: MLL_LEVELS.filter(level => level.level <= WIDA_CAN_DO_MAX_LEVEL).map(level => level.level),
    inferredCrosswalkRows: rows.filter(row => row.crosswalkInferred).length,
    crosswalkProvenance: KEY_USE_CROSSWALK_PROVENANCE
  };
}
