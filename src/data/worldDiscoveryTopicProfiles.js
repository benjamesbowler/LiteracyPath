// One topic/type authority for source production and runtime cohort declarations.
// Published cohorts retain their original profile; new profiles never reinterpret them.
export const WORLD_DISCOVERY_TOPIC_PROFILES = Object.freeze({
  original: Object.freeze({
    topics: Object.freeze([
      "identity", "relationships", "community", "fantasy", "geography",
      "space", "animals", "life cycles", "classification", "caring for our world"
    ]),
    requiredType: null,
    topicTypes: Object.freeze({ fantasy: "fiction" })
  }),
  "nonfiction-discovery": Object.freeze({
    topics: Object.freeze([
      "transport", "geography", "human body", "weather and earth", "physics and engineering",
      "technology", "food and making", "animals and habitats", "everyday knowledge", "space and environment"
    ]),
    requiredType: "nonfiction",
    topicTypes: Object.freeze({})
  })
});

export function worldDiscoveryTopicProfile({ firstNumber = 1, lastNumber = 10, topicProfile } = {}) {
  const name = topicProfile ?? "original";
  const profile = WORLD_DISCOVERY_TOPIC_PROFILES[name];
  if (!Object.hasOwn(WORLD_DISCOVERY_TOPIC_PROFILES, name)) throw Error(`Unknown World Discovery topic profile: ${name}`);
  if (![[1, 10], [11, 20], [21, 30]].some(([first, last]) => firstNumber === first && lastNumber === last)) {
    throw Error(`No authorized World Discovery topic profile for range ${firstNumber}–${lastNumber}`);
  }
  if (firstNumber <= 11 && name !== "original") throw Error("Published cohorts 01–20 must retain the original topic profile");
  if (firstNumber === 21 && (topicProfile !== "nonfiction-discovery")) {
    throw Error("Cohort 21–30 requires explicit topicProfile nonfiction-discovery");
  }
  return profile;
}
