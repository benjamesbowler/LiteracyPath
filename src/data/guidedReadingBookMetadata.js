// Editorial classification is deliberately authored separately from runtime
// level overrides. A level may be adjusted for a local shelf; its reviewed
// reading-band and reading-mode claims must remain stable.
export const GUIDED_READING_BAND_PROFILES = Object.freeze(["standard", "extended"]);
export const GUIDED_READING_READING_MODES = Object.freeze([
  "decodable",
  "predictable-levelled",
  "supported-read-together"
]);

const STANDARD = Object.freeze({
  readingBandProfile: "standard",
  readingMode: "predictable-levelled"
});
const EXTENDED = Object.freeze({
  readingBandProfile: "extended",
  readingMode: "supported-read-together"
});

const CURRENT_BOOK_IDS = Object.freeze([
  "gr-a-26", "gr-a-27", "gr-a-28", "gr-a-29", "gr-b-31", "gr-b-32", "gr-b-33", "gr-b-34", "gr-b-35", "gr-c-37", "gr-c-38", "gr-c-39", "gr-d-42", "gr-d-43", "gr-d-44", "gr-d-45", "gr-e-46", "gr-e-47", "gr-e-48", "gr-e-49", "gr-e-50",
  "first-facts-level-a-01-colors", "first-facts-level-a-02-farm-animals", "first-facts-level-a-03-big-and-little", "first-facts-level-a-04-water", "first-facts-level-a-05-the-sky", "first-facts-level-a-06-animals-can", "first-facts-level-a-07-bugs", "first-facts-level-a-08-my-pet", "first-facts-level-a-09-hot-and-cold", "first-facts-level-a-10-shapes", "first-facts-level-a-11-at-the-farm", "first-facts-level-a-12-in-the-sea", "first-facts-level-a-13-fruit", "first-facts-level-a-14-the-tree", "first-facts-level-a-15-baby-animals", "first-facts-level-a-16-fast-and-slow", "first-facts-level-a-17-a-seed-grows", "first-facts-level-a-18-my-body", "first-facts-level-a-19-day-and-night", "first-facts-level-a-20-space",
  "first-facts-a-01-look-at-the-colors", "first-facts-a-02-the-four-seasons", "first-facts-a-03-little-seeds-grow", "first-facts-a-04-what-is-weather", "first-facts-a-05-flowers-and-trees", "first-facts-a-06-baby-animals", "first-facts-a-07-animals-on-the-farm", "first-facts-a-08-animals-in-the-ocean", "first-facts-a-09-animals-at-night", "first-facts-a-10-bugs-all-around-us", "first-facts-a-11-pets-we-love", "first-facts-a-12-shapes-everywhere", "first-facts-a-13-big-and-small", "first-facts-a-14-hot-and-cold", "first-facts-a-15-things-that-float-and-sink", "first-facts-a-16-push-and-pull", "first-facts-a-17-hello-sun", "first-facts-a-18-the-moon", "first-facts-a-19-day-and-night", "first-facts-a-20-my-five-senses", "first-facts-a-21-how-i-grow", "first-facts-a-22-staying-healthy", "first-facts-a-23-my-body", "first-facts-a-24-rocks-and-pebbles", "first-facts-a-25-water-everywhere",
  "level-c-nonfiction-01-bees", "level-c-nonfiction-02-volcanoes", "level-c-nonfiction-03-penguins", "level-c-nonfiction-04-the-moon", "level-c-nonfiction-05-how-seeds-grow", "level-c-nonfiction-06-spiders", "level-c-nonfiction-07-under-the-ocean", "level-c-nonfiction-08-butterflies", "level-c-nonfiction-09-caves", "level-c-nonfiction-10-frogs",
  "bob-and-nan-01", "bob-and-nan-02-park", "bob-and-nan-03-fluff", "bob-and-nan-04-beach", "bob-and-nan-05-school", "bob-and-nan-06-zoo", "bob-and-nan-07-birthday", "bob-and-nan-08-sick", "bob-and-nan-09-read", "bob-and-nan-10-vet",
  "james-and-anna-01-space", "james-and-anna-02-chips", "james-and-anna-03-shopping", "james-and-anna-04-dentist", "james-and-anna-05-tree-house", "ja-b-06", "ja-b-07", "ja-b-08", "ja-b-09", "ja-b-10",
  "ab-c-01", "ab-c-02", "ab-c-03", "ab-c-04", "ab-c-05", "ab-c-06", "ab-c-07", "ab-c-08", "ab-c-09", "ab-c-10",
  "dino-pals-01-chompys-big-lunch", "dino-pals-02-sunnys-rainy-day", "dino-pals-03-dozy-wont-wake-up", "dino-pals-04-grumpy-needs-help", "dino-pals-05-bossy-makes-a-plan", "dino-pals-06-bouncy-bumps-into-everything", "dino-pals-07-wigglys-messy-day", "dino-pals-08-zippy-slows-down", "dino-pals-09-honkys-inside-voice", "dino-pals-10-cheekys-prank-goes-wrong", "dino-pals-11-shys-secret-gift", "dino-pals-12-fancys-bad-day", "dino-pals-13-clumsy-to-the-rescue", "dino-pals-14-what-is-flappy", "dino-pals-15-sneezy-and-the-waterfall", "dino-pals-16-chompy-and-grumpys-day-out", "dino-pals-17-the-sunny-hollow-games", "dino-pals-18-dozys-wonderful-dream", "dino-pals-19-zippys-race", "dino-pals-20-the-big-storm",
  "meadow-pals-01-muddy-has-a-bath", "meadow-pals-02-woolly-cant-sleep", "meadow-pals-03-clucky-lays-an-egg", "meadow-pals-04-bouncy-wont-stop", "meadow-pals-05-grumpy-gets-a-surprise", "meadow-pals-06-sleepy-cant-wake-up", "meadow-pals-07-noisy-tries-to-be-quiet", "meadow-pals-08-tiny-is-very-small", "meadow-pals-09-shy-comes-out-to-play", "meadow-pals-10-giggly-has-the-hiccups", "meadow-pals-11-brave-climbs-the-hay-bale", "meadow-pals-12-hungry-eats-everything", "meadow-pals-13-splashy-finds-a-puddle", "meadow-pals-14-speedy-slows-down", "meadow-pals-15-cuddly-wants-a-hug", "meadow-pals-16-muddy-and-splashy-make-a-mess", "meadow-pals-17-bouncy-and-speedy-have-a-race", "meadow-pals-18-noisy-wakes-everyone-up", "meadow-pals-19-tiny-and-brave-go-on-an-adventure", "meadow-pals-20-shy-and-cuddly-find-each-other", "meadow-pals-21-woolly-and-grumpy-are-stuck", "meadow-pals-22-sleepys-big-dream", "meadow-pals-23-giggly-and-clucky-bake-a-cake", "meadow-pals-24-grumpys-secret", "meadow-pals-25-the-big-farm-party",
  "moonwood-tales-c-01", "moonwood-tales-c-02", "moonwood-tales-c-03", "moonwood-tales-c-04", "moonwood-tales-c-05", "moonwood-tales-c-06", "moonwood-tales-c-07", "moonwood-tales-c-08", "moonwood-tales-c-09", "moonwood-tales-c-10", "moonwood-tales-c-11", "moonwood-tales-c-12", "moonwood-tales-c-13", "moonwood-tales-c-14", "moonwood-tales-c-15", "moonwood-tales-c-16", "moonwood-tales-c-17", "moonwood-tales-c-18", "moonwood-tales-c-19", "moonwood-tales-c-20", "moonwood-tales-c-21", "moonwood-tales-c-22", "moonwood-tales-c-23", "moonwood-tales-c-24", "moonwood-tales-c-25",
  "meadow-pals-26-muddys-cool-wall", "meadow-pals-27-splashys-reed-boat", "meadow-pals-28-woollys-wool-cloud", "meadow-pals-29-shys-pond-rings", "meadow-pals-30-cuddlys-yarn-ball", "meadow-pals-31-bouncys-hay-lift", "meadow-pals-32-tinys-giant-berry", "meadow-pals-33-braves-beetle-bridge", "meadow-pals-34-grumpys-sun-clock", "meadow-pals-35-gigglys-round-wheel",
  "dino-pals-21-fancys-moonleaf-arch", "dino-pals-22-shys-sinking-path", "dino-pals-23-flappys-fern-delivery", "dino-pals-24-clumsys-steady-bowls", "dino-pals-25-sneezys-seed-cloud", "dino-pals-26-sunnys-two-part-picnic", "dino-pals-27-bossys-three-paths", "dino-pals-28-honkys-echo-tunnel", "dino-pals-29-cheekys-shadow-show", "dino-pals-30-dozy-stops-the-melon",
  "moonwood-tales-c-26", "moonwood-tales-c-27", "moonwood-tales-c-28", "moonwood-tales-c-29", "moonwood-tales-c-30", "moonwood-tales-c-31", "moonwood-tales-c-32", "moonwood-tales-c-33", "moonwood-tales-c-34", "moonwood-tales-c-35"
]);

export const GUIDED_READING_BOOK_METADATA = Object.freeze(Object.fromEntries(
  CURRENT_BOOK_IDS.map(id => [id, id.startsWith("moonwood-tales-c-") ? EXTENDED : STANDARD])
));

export function getGuidedReadingBookMetadata(bookOrId) {
  const id = typeof bookOrId === "string" ? bookOrId : bookOrId?.id;
  return GUIDED_READING_BOOK_METADATA[id] || null;
}
