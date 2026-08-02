/*
 * Story-Bible-native Guided Reading additions, authored 2026-08-01.
 *
 * Unlike the legacy series packs, these books are born from one reviewed source:
 * manuscript, causal evidence, illustration blueprint and exact narration text stay
 * together. Stable media paths remain conventional so the runtime and release gates
 * can treat these books exactly like the older packs.
 */

const normalizeReadingText = text => String(text || "").replace(/\s+([.,!?;:])/g, "$1").replace(/\s{2,}/g, " ").trim();

const wordAudio = word => `/guided-reading/audio/words/${String(word).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")}.mp3`;

const words = text => normalizeReadingText(text)
  .replace(/[.,!?;:()"]+/g, "")
  .split(/\s+/)
  .filter(Boolean)
  .map(word => ({ text: word, audioPath: wordAudio(word) }));

const pathFor = (seriesId, bookNumber, name) =>
  `/guided-reading/series/${seriesId}/book-${String(bookNumber).padStart(2, "0")}/${name}`;

const SERIES = Object.freeze({
  meadow: Object.freeze({
    seriesId: "meadow-pals",
    seriesTitle: "Meadow Pals",
    level: "A",
    ageRange: "4-5",
    author: "Nora Bell",
    illustrator: "LiteracyPath Studio",
    setting: "Sunny Meadow Farm in clear natural daylight: red barn, duck pond, mud wallow, big oak, hill, stone wall, hay, flower meadow and stream. No magic, text or human objects beyond simple farm materials.",
    style: "bright uncluttered children's storybook art, rounded farm characters, warm natural daylight, simple depth, one large readable action",
    characterReference: Object.freeze({
      muddy: "MEADOW-MUDDY — round pink pig with fixed dark mud-patch map, pig snout and ears; sensory, eager and persistent.",
      splashy: "MEADOW-SPLASHY — small yellow duckling with orange beak and feet; observant, practical and water-confident.",
      woolly: "MEADOW-WOOLLY — cream-yellow lamb with natural wool silhouette; gentle, patient and steady.",
      shy: "MEADOW-SHY — small grey mouse with rounded ears and tail; quiet, cautious and observant.",
      cuddly: "MEADOW-CUDDLY — orange cat with visible whiskers and cat tail; warm, enthusiastic and affectionate.",
      bouncy: "MEADOW-BOUNCY — yellow woolly lamb with two coil-spring legs and two visible feet; energetic and optimistic; never a dinosaur.",
      tiny: "MEADOW-TINY — very small grey field mouse and the smallest recurring Meadow character; resourceful and willing.",
      brave: "MEADOW-BRAVE — small yellow chick, smaller than Clucky and Woolly; bold, curious and action-first.",
      grumpy: "MEADOW-GRUMPY — stocky dark-brown goat with long backward-curving grey-tan horns, white muzzle and chin patch, short tail and black hooves; gruff face and stable scale; values quiet, privacy and direct boundaries; never a pig.",
      giggly: "MEADOW-GIGGLY — plump white goose with broad white wings, orange beak, orange webbed feet and large expressive eyes; finds humour quickly and repairs consequences; never a pig or russet hen."
    })
  }),
  dino: Object.freeze({
    seriesId: "dino-pals",
    seriesTitle: "Dino Pals",
    level: "B",
    ageRange: "5-6",
    author: "Nora Bell",
    illustrator: "LiteracyPath Studio",
    setting: "Sunny Hollow in warm daylight: Cozy Cave, Berry Bush Corner, Big Flat Rock, Muddy Puddle Pool, stream, Fernwood and long meadow. Colourful rounded prehistoric valley with no unexplained magic.",
    style: "colourful textured children's storybook art, rounded young dinosaurs, large readable gestures, warm prehistoric valley, clear physical comedy",
    characterReference: Object.freeze({
      fancy: "DINO-FANCY — purple plated young dinosaur with fixed plate shape, palette and scale; expressive and exacting.",
      shy: "DINO-SHY — small mint-green long-necked young dinosaur with darker teal oval spots, short smooth head, four sturdy feet and slender tail; no back plates; quiet, observant and considered; visibly distinct from Fancy and every Meadow mouse.",
      flappy: "DINO-FLAPPY — small feathered orange-brown young dinosaur with cream belly, long feathered wings tipped tan-blue and stable clawed feet; plausible short glides only.",
      clumsy: "DINO-CLUMSY — tall sky-blue long-necked young dinosaur with darker blue oval spots, four sturdy feet and long tapering tail; no back plates; careful observation makes the same body useful.",
      sneezy: "DINO-SNEEZY — small yellow-green young parasaurolophus with one backward-curving green crest, darker green spots and four feet; warns, prepares and repairs around sneezes.",
      sunny: "DINO-SUNNY — yellow-orange triceratops with fixed horns and frill; playful and hopeful.",
      grumpy: "DINO-GRUMPY — low heavy grey ankylosaur with tan armour plates and club tail; no shell.",
      chompy: "DINO-CHOMPY — orange young tyrannosaur with pale muzzle and belly plus white neckerchief.",
      bossy: "DINO-BOSSY — teal young pterodactyl with pink wing membranes; leaf clipboard appears only while carried.",
      zippy: "DINO-ZIPPY — red-yellow young velociraptor with fixed rainbow scarf.",
      honky: "DINO-HONKY — coral young parasaurolophus with large fixed rainbow crest.",
      cheeky: "DINO-CHEEKY — purple young oviraptor with stable orange spots and expressive grin.",
      wiggly: "DINO-WIGGLY — approved pale-blue long-tailed young dinosaur model with fixed body and scale.",
      dozy: "DINO-DOZY — purple sleepy young dinosaur; the blue pillow moves only when shown moving."
    })
  }),
  moonwood: Object.freeze({
    seriesId: "moonwood-tales",
    seriesTitle: "Moonwood Tales",
    level: "C",
    ageRange: "7-9",
    author: "Lina Moss",
    illustrator: "LiteracyPath Studio",
    setting: "Moonwood at night in the approved painterly style: Hollow Oak, Crystal Stream, Fog Marsh, Deep Dark, old roots, glow cave, Fern's garden and star rooms. Controlled glow and rule-bound magic only.",
    style: "cohesive painterly moonlit woodland fantasy, rich readable backgrounds, controlled blue-gold glow, tactile bark and foliage, never flat cel art",
    characterReference: Object.freeze({
      pip: "MOON-PIP — small brown-haired woodland boy in green with pointed ears; quick, curious and observant.",
      stone: "MOON-STONE — very large grey stone giant with broad hands, always two to three times Pip's height; slow, literal and gentle.",
      fern: "MOON-FERN — tall green fern sprite with fixed leaf-body silhouette; calm, musical and attentive to living things.",
      wren: "MOON-WREN — small dark-haired child witch in fixed blue-purple pointed hat and robe; inventive, eager and bookish.",
      luna: "MOON-LUNA — owl with cream facial disc, brown-grey feathers and real wing anatomy; observant, ethical and patient.",
      burrow: "MOON-BURROW — brown mole with round glasses and digging paws; maps appear only while carried or shown.",
      flint: "MOON-FLINT — red-brown-haired woodland boy in practical brown explorer clothes; lantern light is stateful.",
      glimmer: "MOON-GLIMMER — young dragon with purple-blue scales, gold highlights, small wings and teal eyes; cinnamon warmth follows stated safety rules.",
      spark: "MOON-SPARK — junior wizard with bright red hair, freckles, red-gold robe and oversized wand; spells are tested and rule-bound."
    })
  })
});

const SCORECARD = Object.freeze({
  character: 4,
  goal: 4,
  causality: 4,
  obstacle: 4,
  agency: 4,
  ending: 4,
  language: 4,
  voice: 4,
  delight: 4,
  canon: 4,
  illustration: 4,
  audio: 4
});

function createBook(definition) {
  const series = SERIES[definition.world];
  const illustrationBlueprint = definition.pages.map(([text, scene], index) => Object.freeze({
    pageNumber: index + 1,
    exactText: normalizeReadingText(text),
    canonIds: Object.freeze(definition.canonIds),
    location: definition.location,
    state: scene,
    constraints: "Show exactly this beat and state; preserve cast identity, relative scale, direction, carried props and preceding consequences; keep faces, limbs and props inside the 8% safe area; no embedded text, extra characters, duplicate bodies, malformed limbs or faceless scenery."
  }));

  return Object.freeze({
    id: definition.id,
    seriesId: series.seriesId,
    seriesTitle: series.seriesTitle,
    seriesName: series.seriesTitle,
    title: definition.title,
    type: "fiction",
    category: "fiction",
    level: series.level,
    guidedReadingLevel: series.level,
    ageRange: series.ageRange,
    bookNumber: definition.bookNumber,
    order: definition.bookNumber,
    author: series.author,
    illustrator: series.illustrator,
    status: "approved",
    qaStatus: "approved",
    qaNotes: "Story-Bible-native release: manuscript, page blueprint, exact-text narration and media are locked together.",
    active: true,
    visible: true,
    teacherPreviewOnly: false,
    source: "guided_reading_world_expansion_2026_08_01",
    coverImage: pathFor(series.seriesId, definition.bookNumber, "cover.webp"),
    targetSkills: [`level-${series.level.toLowerCase()}`, "fiction", series.seriesId, ...definition.targetSkills],
    sightWords: definition.sightWords,
    targetPatterns: [`level-${series.level.toLowerCase()}`, "fiction", "causal-story"],
    theme: definition.theme,
    characterReference: Object.fromEntries(definition.cast.map(name => [name, series.characterReference[name]])),
    settingReference: series.setting,
    imageGenerationReference: `${series.style}. ${series.setting} Use the locked character descriptions and relative scale. One coherent moment per page; no captions, page numbers, signatures or watermarks.`,
    expectedStoryPageCount: definition.pages.length,
    availableStoryPageCount: definition.pages.length,
    missingStoryPages: Object.freeze([]),
    storyBibleReview: Object.freeze({
      format: "guided-reading-book",
      kind: "fiction",
      level: series.level,
      canonIds: Object.freeze(definition.canonIds),
      storyPromise: definition.storyPromise,
      storySpine: definition.storySpine,
      failedAttempt: definition.failedAttempt,
      turningPoint: definition.turningPoint,
      resolution: definition.resolution,
      landing: definition.landing,
      duplicateAudit: definition.duplicateAudit,
      policyVersion: "2026-07-31.1",
      reviewer: "Codex Story Bible editorial review",
      reviewedAt: "2026-08-01",
      scores: SCORECARD,
      mandatoryViolations: Object.freeze([]),
      illustrationBlueprint: Object.freeze(illustrationBlueprint),
      audioBlueprint: Object.freeze(definition.pages.map(([text], index) => Object.freeze({
        pageNumber: index + 1,
        exactText: normalizeReadingText(text),
        voice: "en-US-Chirp3-HD-Leda",
        wordForWordRequired: true
      }))),
      pages: Object.freeze(definition.pages.map(([text]) => normalizeReadingText(text)))
    }),
    pages: Object.freeze(definition.pages.map(([text, scene], index) => {
      const pageNumber = index + 1;
      const pagePath = pathFor(series.seriesId, definition.bookNumber, `page-${String(pageNumber).padStart(3, "0")}.webp`);
      const audioPath = pathFor(series.seriesId, definition.bookNumber, `audio/page-${String(pageNumber).padStart(3, "0")}.mp3`);
      const cleanText = normalizeReadingText(text);
      return Object.freeze({
        pageNumber,
        text: cleanText,
        pageAudioText: cleanText,
        image: pagePath,
        audio: audioPath,
        pageAudio: audioPath,
        words: words(cleanText),
        imageAlt: scene,
        pageDescription: scene,
        illustrationPrompt: `${series.style}. ${definition.location}. ${scene} ${illustrationBlueprint[index].constraints}`,
        embeddedImageText: "",
        qaStatus: "approved",
        qaNotes: "Released from the locked Story Bible manuscript and page blueprint.",
        active: true
      });
    }))
  });
}

const books = [
  {
    world: "meadow", bookNumber: 26, id: "meadow-pals-26-muddys-cool-wall", title: "Muddy's Cool Wall",
    theme: "testing sun-dried mud blocks to shade a wallow", cast: ["muddy"], canonIds: ["MEADOW-MUDDY"], location: "the mud wallow beside Sunny Meadow's stone wall at late morning",
    storyPromise: "Muddy must shade his wallow before noon warms it, but his wet mud wall will not stand.",
    storySpine: "Muddy wants a cool wallow, but wet blocks slump, so he dries a second set before stacking a shade wall.",
    failedAttempt: "Muddy stacks wet mud blocks and the soft wall slumps flat.", turningPoint: "Muddy feels the fallen blocks harden in sunshine and changes the order of his work.",
    resolution: "Dry blocks hold a small wall that shades the pool.", landing: "Muddy settles into the cool mud beneath the wall he tested.",
    duplicateAudit: "Distinct from bath and splash stories: the engine is material drying and load-bearing construction, not cleanliness or considerate water play.",
    targetSkills: ["material-change", "problem-solution"], sightWords: ["the", "a", "he", "into", "his", "one"],
    pages: [
      ["Muddy wants a cool mud pool.", "Muddy stands in a small sunlit wallow and studies the hot open edge."],
      ["He stacks wet mud blocks.", "Muddy carefully stacks three visibly wet rectangular mud blocks beside the pool."],
      ["The soft wall slumps down.", "The wet blocks slump into one low heap while Muddy steps back in surprise."],
      ["Sunshine warms the open pool.", "The fallen wall lies flat and bright noon sunshine reaches the whole pool."],
      ["Muddy dries new blocks.", "Muddy lays separate fresh mud blocks in a tidy sunlit row to harden."],
      ["He stacks the hard blocks.", "The visibly dry firm blocks stack into a short stable wall under Muddy's hooves."],
      ["The wall makes cool shade.", "The completed wall casts one clear shadow across half the wallow."],
      ["Muddy sinks into cool mud.", "Muddy relaxes contentedly in the shaded half with the intact dry wall beside him."]
    ]
  },
  {
    world: "meadow", bookNumber: 27, id: "meadow-pals-27-splashys-reed-boat", title: "Splashy's Reed Boat",
    theme: "changing sail height to make a reed boat travel straight", cast: ["splashy"], canonIds: ["MEADOW-SPLASHY"], location: "the duck pond and its reed-lined downstream edge in gentle daylight",
    storyPromise: "Splashy must sail her reed boat across the pond before the breeze turns, but its tall sail makes it spin.",
    storySpine: "Splashy launches a reed boat, but a tall sail spins it in circles, so she lowers the sail and gains control.",
    failedAttempt: "Splashy pushes the spinning boat harder and it circles back again.", turningPoint: "Splashy notices the tall sail catching too much side wind.",
    resolution: "A lower sail lets the reed boat glide straight across.", landing: "Splashy meets the boat downstream and inspects its straight wake.",
    duplicateAudit: "Distinct from puddle play, stream rescues and lost-item searches: the causal engine is sail area and steering.",
    targetSkills: ["wind", "testing-design"], sightWords: ["a", "the", "it", "she", "with", "one"],
    pages: [
      ["Splashy builds a reed boat.", "Splashy beside the pond ties three reeds into one tiny boat with a tall leaf sail."],
      ["She sends it across.", "Splashy releases the complete reed boat from the near bank toward open water."],
      ["Wind spins the little boat.", "The tall leaf sail catches a side breeze and the boat turns in a clear circle."],
      ["Splashy pushes it harder.", "Splashy gives the circling boat one determined push with her orange foot."],
      ["It spins back again.", "The boat completes another circle and returns nose-first beside surprised Splashy."],
      ["Splashy lowers the tall sail.", "Splashy folds and reties the same leaf sail at half its former height."],
      ["The boat glides straight.", "The low-sailed reed boat leaves one straight wake across calm pond water."],
      ["Splashy meets it downstream.", "Splashy waits proudly at the downstream reeds as the intact boat reaches her."]
    ]
  },
  {
    world: "meadow", bookNumber: 28, id: "meadow-pals-28-woollys-wool-cloud", title: "Woolly's Wool Cloud",
    theme: "using sticky mud to hold a shed-wool picture", cast: ["woolly", "muddy"], canonIds: ["MEADOW-WOOLLY", "MEADOW-MUDDY"], location: "a simple craft board beside the red barn in breezy daylight",
    storyPromise: "Woolly must finish a wool cloud picture before the breeze rises, but every loose piece blows away.",
    storySpine: "Woolly arranges shed wool into a cloud, but wind scatters it, so Muddy's thin mud layer becomes a natural paste.",
    failedAttempt: "The unfastened wool blows off the board before the picture can hold.", turningPoint: "Woolly sees wet wool stick to one small muddy corner.",
    resolution: "A thin mud layer grips the wool until sunshine dries the board.", landing: "Woolly's cloud picture stays above its small muddy rain line.",
    duplicateAudit: "Distinct from baking, parties and garden growth: the engine is a tactile two-material art process.",
    targetSkills: ["art-process", "materials"], sightWords: ["a", "the", "she", "down", "every", "her"],
    pages: [
      ["Woolly wants a cloud picture.", "Woolly studies a clean low wooden board with a simple cloud shape laid in loose shed wool."],
      ["She gathers soft shed wool.", "Woolly gathers only loose shed wool into a small neat pile; her coat remains full."],
      ["Wind scatters every fluffy piece.", "A breeze lifts the loose wool pieces away from the bare board in different directions."],
      ["Woolly chases the flying wool.", "Woolly trots after the last drifting pieces beside the barn."],
      ["Muddy spreads thin sticky mud.", "Muddy uses one hoof to spread a thin even mud layer over the same board."],
      ["Woolly pats the wool down.", "Woolly presses the recovered wool pieces into a clear cloud silhouette on wet mud."],
      ["Sunshine dries the muddy board.", "Warm sunshine dries the board while every wool piece remains fixed in place."],
      ["Her wool cloud stays put.", "Woolly and Muddy view the finished tactile cloud picture standing firmly by the barn."]
    ]
  },
  {
    world: "meadow", bookNumber: 29, id: "meadow-pals-29-shys-pond-rings", title: "Shy's Pond Rings",
    theme: "patient observation reveals a hidden pond frog", cast: ["shy"], canonIds: ["MEADOW-SHY", "MEADOW-LOCAL-29-GREEN-FROG"], location: "the quiet duck pond bank with tall grass and one loose pebble",
    storyPromise: "Shy must discover what makes rings on the pond before they fade, but her first step scares it away.",
    storySpine: "Shy follows mysterious pond rings, but a loose stone stops them, so she waits behind grass and sees the frog emerge.",
    failedAttempt: "Shy's careful approach dislodges a pebble whose splash makes every ring vanish.", turningPoint: "Shy chooses a still hidden viewpoint instead of moving closer.",
    resolution: "A small green frog surfaces and reveals the ring-maker.", landing: "Shy watches the frog's bright leap without disturbing it.",
    duplicateAudit: "Distinct from social-shyness stories and Moonwood sound mysteries: this is a daylight wildlife observation solved through patient stillness.",
    targetSkills: ["observation", "pond-life"], sightWords: ["the", "a", "she", "one", "its", "at"],
    pages: [
      ["Shy sees rings on pond.", "Tiny grey Shy notices three clean circular ripples on otherwise still pond water."],
      ["She seeks the hidden swimmer.", "Shy peers toward the rings from the grassy bank without any creature visible."],
      ["Shy creeps along the bank.", "Shy takes one cautious step along the bank toward the fading rings."],
      ["Her loose stone splashes loudly.", "One small pebble slips beneath Shy's paw and splashes into the pond."],
      ["The rings vanish at once.", "The pond surface becomes completely still while Shy pauses and watches."],
      ["Shy waits behind tall grass.", "Shy sits quietly concealed behind tall grass with a clear view of the water."],
      ["A green frog pops up.", "One small ordinary green frog surfaces at the exact centre of new ripples."],
      ["Shy sees its bright leap.", "The frog makes one lively leap above the water as Shy watches from her hiding place."]
    ]
  },
  {
    world: "meadow", bookNumber: 30, id: "meadow-pals-30-cuddlys-yarn-ball", title: "Cuddly's Yarn Ball",
    theme: "untangling yarn by following it backward", cast: ["cuddly"], canonIds: ["MEADOW-CUDDLY"], location: "the big oak's low roots beside the flower meadow",
    storyPromise: "Cuddly must roll a loose red yarn strand before supper, but pulling it tightens three hidden knots.",
    storySpine: "Cuddly pulls tangled yarn and worsens its knots, then follows the strand backward and frees each loop before rolling it.",
    failedAttempt: "Pulling the far end cinches three loops around separate oak roots.", turningPoint: "Cuddly stops pulling and traces the strand from the free end.",
    resolution: "Reversing through each loop releases the yarn into one round ball.", landing: "Cuddly gives the tidy ball one satisfied cat-paw tap.",
    duplicateAudit: "Distinct from stuck-wool and lost-object plots: this is an ordered untangling problem driven by direction reversal.",
    targetSkills: ["sequence", "spatial-reasoning"], sightWords: ["a", "the", "she", "one", "three", "each"],
    pages: [
      ["Cuddly finds loose red yarn.", "Orange cat Cuddly finds one long red yarn strand snaking around three oak roots."],
      ["She wants one round ball.", "Cuddly holds the free end and imagines the loose strand rolled into a tidy ball."],
      ["Cuddly pulls the long strand.", "Cuddly leans backward and pulls while the yarn tightens around the roots."],
      ["Three knots grow even tighter.", "Three distinct red loops cinch tightly around three separate roots."],
      ["Cuddly follows the strand backward.", "Cuddly walks along the yarn from its free end toward the nearest root."],
      ["She frees each little loop.", "Cuddly lifts the last of three loosened loops safely over its root."],
      ["The red yarn rolls round.", "Cuddly rolls the fully free red strand into one neat round ball."],
      ["Cuddly pats her tidy ball.", "Cuddly gives the finished yarn ball one playful paw tap beside clear untangled roots."]
    ]
  },
  {
    world: "meadow", bookNumber: 31, id: "meadow-pals-31-bouncys-hay-lift", title: "Bouncy's Hay Lift",
    theme: "controlling spring height to stack one hay bale", cast: ["bouncy", "woolly"], canonIds: ["MEADOW-BOUNCY", "MEADOW-WOOLLY"], location: "the red barn's low hay stack in clear afternoon light",
    storyPromise: "Bouncy must place the final hay bale on Woolly's stack, but her biggest spring sends it too far.",
    storySpine: "Bouncy uses a full spring to lift hay, overshoots the stack, then compresses both springs for one controlled bounce.",
    failedAttempt: "Bouncy's first full-height bounce launches the bale past the stack into an empty cart.", turningPoint: "Bouncy compares the cart's lower height with the stack and shortens her spring extension.",
    resolution: "A small centred bounce places the bale squarely on top.", landing: "Bouncy stands on two feet beside the stable completed stack.",
    duplicateAudit: "Distinct from racing and collision stories: the engine is calibrated vertical force and a precise hay-stacking task.",
    targetSkills: ["force", "control"], sightWords: ["the", "a", "she", "one", "with", "on"],
    pages: [
      ["Bouncy stacks hay for Woolly.", "Meadow Bouncy the yellow spring-legged lamb places hay beside Woolly's nearly complete stack."],
      ["The top bale sits high.", "One empty top position is clearly visible above the stack while Bouncy looks upward."],
      ["Bouncy springs with one bale.", "Bouncy holds one small bale and extends both coil legs with both feet visible."],
      ["The bale flies past.", "The bale arcs beyond the stack while Bouncy lands safely on two attached feet."],
      ["It lands inside the cart.", "The intact bale lands in an empty wooden hay cart behind the stack."],
      ["Bouncy lowers both strong springs.", "Bouncy deliberately compresses both coil legs equally beside the recovered bale."],
      ["She makes one small bounce.", "One short controlled bounce lifts the bale directly above the stack."],
      ["The bale fits on top.", "The bale rests squarely on the stable stack as Bouncy and Woolly inspect it."]
    ]
  },
  {
    world: "meadow", bookNumber: 32, id: "meadow-pals-32-tinys-giant-berry", title: "Tiny's Giant Berry",
    theme: "using a pebble wedge and a sideways turn to roll a berry", cast: ["tiny"], canonIds: ["MEADOW-TINY"], location: "the gentle hill path between the berry hedge and big oak",
    storyPromise: "Tiny must roll a giant berry home before dusk, but one raised root sends it backward downhill.",
    storySpine: "Tiny pushes a berry straight at a root and loses ground, then wedges it and turns its narrow side through the gap.",
    failedAttempt: "A direct push cannot lift the berry over the root and it rolls backward.", turningPoint: "Tiny sees that the berry is narrower from one side and blocks the rollback with a pebble.",
    resolution: "The wedged berry turns sideways and rolls through the root gap.", landing: "Tiny walks beside the berry on the final level path.",
    duplicateAudit: "Distinct from key and hat retrievals: Tiny solves a transport geometry problem without crawling into a small space.",
    targetSkills: ["shape", "simple-machines"], sightWords: ["a", "the", "he", "one", "with", "past"],
    pages: [
      ["Tiny finds a giant berry.", "Very small Tiny stands beside one oval red berry several times his body size."],
      ["He rolls it toward home.", "Tiny pushes the giant berry along the gentle hill path toward the big oak."],
      ["The berry meets one root.", "The wide side of the berry stops against one raised oak root."],
      ["Tiny pushes with both paws.", "Tiny braces both paws against the berry while it remains blocked by the root."],
      ["The berry rolls back downhill.", "The berry rolls a short safe distance backward as Tiny steps aside."],
      ["Tiny wedges a flat pebble.", "Tiny places one flat pebble behind the berry to prevent another rollback."],
      ["He turns the berry sideways.", "Tiny rotates the oval berry so its narrow end faces the root gap."],
      ["Tiny rolls it past safely.", "The berry passes through the gap and Tiny guides it along level ground."]
    ]
  },
  {
    world: "meadow", bookNumber: 33, id: "meadow-pals-33-braves-beetle-bridge", title: "Brave's Beetle Bridge",
    theme: "guiding a beetle with shelter rather than pushing", cast: ["brave"], canonIds: ["MEADOW-BRAVE", "MEADOW-LOCAL-33-BEETLE"], location: "a busy sunlit farm path beside the flower meadow",
    storyPromise: "Brave must help a beetle cross the farm path before the herd passes, but touching its shell makes it curl shut.",
    storySpine: "Brave nudges a beetle and stops its movement, then builds a shaded leaf tunnel that the beetle chooses to follow.",
    failedAttempt: "Brave's direct nudge makes the ordinary beetle curl tightly and remain still.", turningPoint: "Brave notices the beetle uncurl toward the shade under one leaf.",
    resolution: "A leaf tunnel guides the beetle across without another touch.", landing: "Brave watches the beetle reach flowers before distant hooves pass.",
    duplicateAudit: "Distinct from climbing and rescues by force: the engine is ordinary beetle behaviour and an indirect habitat-shaped solution.",
    targetSkills: ["animal-behaviour", "care"], sightWords: ["a", "the", "it", "one", "he", "through"],
    pages: [
      ["A beetle waits on path.", "One small shiny ordinary beetle stands in the centre of a broad farm path."],
      ["Brave wants it safely across.", "Small yellow chick Brave studies the beetle and the flower meadow across the path."],
      ["Brave nudges its shiny shell.", "Brave gives the beetle shell one very gentle beak nudge."],
      ["The beetle curls up tight.", "The beetle curls into a still compact shape while Brave looks concerned."],
      ["Brave builds a leaf tunnel.", "Brave arches overlapping green leaves into a shaded tunnel across the path."],
      ["He waits beside the opening.", "Brave sits clear of the tunnel entrance and patiently watches."],
      ["The beetle walks straight through.", "The uncurled beetle walks through the shaded leaf tunnel toward flowers."],
      ["Brave sees it reach flowers.", "The beetle reaches the flower edge while Brave remains safely beside the path."]
    ]
  },
  {
    world: "meadow", bookNumber: 34, id: "meadow-pals-34-grumpys-sun-clock", title: "Grumpy's Sun Clock",
    theme: "tracking the oak shadow to keep lunch cool", cast: ["grumpy"], canonIds: ["MEADOW-GRUMPY"], location: "the big oak and its moving daylight shadow across flat meadow stones",
    storyPromise: "Grumpy must keep lunch cool until noon, but the oak's shadow keeps moving away from his basket.",
    storySpine: "Grumpy moves lunch after one morning shadow and loses shade again, then tracks the shadow with stones to predict noon.",
    failedAttempt: "Dragging the basket to the current shadow works briefly before sunlight reaches it again.", turningPoint: "Grumpy notices the shadow edge crossing the ground in one steady direction.",
    resolution: "A row of timed stones shows where the oak's noon shade will fall.", landing: "Grumpy opens a cool lunch basket exactly at noon.",
    duplicateAudit: "Distinct from quiet-rest and garden secrecy: the engine is observing predictable shadow movement over time.",
    targetSkills: ["light-shadow", "prediction"], sightWords: ["the", "at", "he", "one", "his", "in"],
    pages: [
      ["Grumpy keeps lunch for noon.", "Grumpy places one closed lunch basket in the big oak's cool morning shadow."],
      ["He marks the morning shadow.", "Grumpy sets one pale stone exactly at the shadow's edge."],
      ["Sunlight reaches the basket.", "The oak shadow has moved beyond the basket and warm light touches its lid."],
      ["Grumpy drags lunch into shade.", "Grumpy pulls the same basket into the shadow's new position."],
      ["The shade moves once more.", "The shadow edge moves past a second time while Grumpy watches closely."],
      ["Grumpy watches its steady path.", "Grumpy compares two stone marks aligned along the shadow's direction."],
      ["He adds one noon stone.", "Grumpy places a third stone ahead where the moving shadow will reach at noon."],
      ["His lunch stays cool there.", "At overhead noon light the basket rests in oak shade beside the predicted stone."]
    ]
  },
  {
    world: "meadow", bookNumber: 35, id: "meadow-pals-35-gigglys-round-wheel", title: "Giggly's Round Wheel",
    theme: "repairing a flower cart with a round wood slice", cast: ["giggly"], canonIds: ["MEADOW-GIGGLY"], location: "the flower meadow path leading to the red barn",
    storyPromise: "Giggly must deliver eight flowers before they wilt, but her cart's broken wheel has one square edge.",
    storySpine: "Giggly pulls a damaged cart faster and spills its flowers, then replaces the uneven wheel with a round wood slice.",
    failedAttempt: "Pulling faster magnifies every bump and throws the flower pots onto soft grass.", turningPoint: "Giggly stops laughing at the bumps and compares the broken wheel with a round wood slice.",
    resolution: "The round replacement turns smoothly and carries all eight flowers.", landing: "Giggly delivers the upright flowers and spins the repaired wheel once.",
    duplicateAudit: "Distinct from spilled food and baking messes: the engine is wheel shape, rotation and a concrete mechanical repair.",
    targetSkills: ["shape", "repair"], sightWords: ["a", "the", "one", "she", "every", "her"],
    pages: [
      ["Giggly pulls a flower cart.", "Giggly pulls a small cart holding eight upright potted meadow flowers."],
      ["One broken wheel bumps hard.", "One wooden wheel has a clearly missing curved section and bumps on its flat edge."],
      ["Giggly pulls much faster.", "Giggly increases speed while the damaged wheel jolts the cart more sharply."],
      ["Flowers bounce onto soft grass.", "All eight pots tumble safely onto grass without breaking while the cart stops."],
      ["Giggly stops and looks closely.", "Giggly pauses beside the broken wheel and studies its flat edge."],
      ["A round wood slice fits.", "Giggly aligns one smooth round wood slice on the empty axle."],
      ["The cart rolls without bumps.", "The repaired round wheel turns smoothly with all eight pots upright again."],
      ["Giggly delivers every flower.", "Giggly arrives at the red barn with eight intact flowers and the round wheel visible."]
    ]
  },

  {
    world: "dino", bookNumber: 21, id: "dino-pals-21-fancys-moonleaf-arch", title: "Fancy's Moonleaf Arch",
    theme: "building a stable decorative arch with flat stones", cast: ["fancy", "grumpy", "wiggly"], canonIds: ["DINO-FANCY", "DINO-GRUMPY", "DINO-WIGGLY"], location: "Big Flat Rock beside the long meadow before sunset",
    storyPromise: "Fancy must finish a moonleaf arch before sunset, but its round foundation stones roll in the breeze.",
    storySpine: "Fancy's tall arch topples from rolling stones, so she rebuilds a lower curve on flat stones with Wiggly and Grumpy.",
    failedAttempt: "A breeze rolls the three round base stones and collapses the first tall arch.", turningPoint: "Fancy studies the fallen parts and chooses stable shapes rather than greater height.",
    resolution: "Flat stones, a low branch curve and secure knots hold the arch.", landing: "Sunset shines through the sturdy purple-leaf opening.",
    duplicateAudit: "Distinct from tree-house construction and Fancy's sail repair: this plot tests foundation shape and arch stability.",
    targetSkills: ["stability", "collaboration"], sightWords: ["the", "one", "three", "she", "with", "every"],
    pages: [
      ["Fancy wants a moonleaf arch ready before sunset.", "Fancy arranges purple moon-shaped leaves and long branches beside Big Flat Rock; sun is lowering."],
      ["She balances long branches on three round stones.", "Three visibly round base stones support a tall narrow branch arch while Fancy adjusts it."],
      ["A breeze rolls the stones. The whole arch falls.", "Wind rolls the round stones apart and the branches fall harmlessly onto grass."],
      ["Fancy studies the pieces instead of stacking again.", "Fancy crouches thoughtfully beside separated leaves, branches and rolling stones."],
      ["Grumpy brings flat stones that cannot roll.", "Low heavy Grumpy pushes three broad flat stones into a stable row."],
      ["Wiggly bends two branches into a low curve.", "Pale-blue Wiggly uses his long body carefully to bend two branches over the bases."],
      ["Fancy ties moonleaves where every knot can hold.", "Fancy secures each purple leaf with visible grass knots on the low arch."],
      ["Sunset shines through her sturdy purple arch.", "Fancy, Grumpy and Wiggly stand beside the intact arch glowing in warm sunset light."]
    ]
  },
  {
    world: "dino", bookNumber: 22, id: "dino-pals-22-shys-sinking-path", title: "Shy's Sinking Path",
    theme: "reading animal tracks to mark a safe detour", cast: ["shy"], canonIds: ["DINO-SHY"], location: "Fernwood's damp path near Berry Bush Corner after rain",
    storyPromise: "Shy must mark a safe berry route before the picnic baskets arrive, but his first stepping stone sinks into hidden mud.",
    storySpine: "Shy tests a bubbling path and loses a flat stone, then follows dry beetle tracks and marks their firm detour.",
    failedAttempt: "The apparently flat centre stone sinks when Shy tests it at the bubbling patch.", turningPoint: "Shy notices tiny beetles crossing dry ground around the mud rather than through it.",
    resolution: "Yellow leaves clearly mark the firm beetle route for every basket carrier.", landing: "Shy watches the last basket reach the picnic with clean feet.",
    duplicateAudit: "Distinct from lost-path stories: Shy is not lost; he diagnoses subsurface mud using visible wildlife evidence and creates an accessible detour.",
    targetSkills: ["evidence", "safety"], sightWords: ["the", "one", "under", "before", "where", "every"],
    pages: [
      ["Shy spots bubbles under the Fernwood path.", "Dino Shy studies small water bubbles rising through a muddy patch in Fernwood."],
      ["Berry baskets will cross before the picnic.", "Several filled berry baskets wait in the distance while Shy checks the route."],
      ["Shy lays one flat stone across the bubbles.", "Shy carefully places one broad flat stone over the suspicious patch."],
      ["The stone sinks. Mud covers the usual trail.", "The testing stone sinks visibly below mud while Shy remains on firm ground."],
      ["Shy notices tiny beetles walking around the mud.", "A clear line of ordinary beetles follows dry ground around the muddy patch."],
      ["Their dry track circles the sinking path.", "Shy traces the firm curved beetle route with one claw."],
      ["Shy lines the safe track with yellow leaves.", "Bright yellow leaves form an unmistakable detour around the mud."],
      ["Every berry basket follows Shy's bright detour.", "Dino Pals carry baskets along the marked dry curve while Shy watches quietly."]
    ]
  },
  {
    world: "dino", bookNumber: 23, id: "dino-pals-23-flappys-fern-delivery", title: "Flappy's Fern Delivery",
    theme: "reducing wind drag by rolling a wide fern", cast: ["flappy", "wiggly"], canonIds: ["DINO-FLAPPY", "DINO-WIGGLY"], location: "the stream crossing between Fernwood and Cozy Cave under gathering rain clouds",
    storyPromise: "Flappy must carry a roof fern to Cozy Cave before rain, but the wide leaf catches the crosswind.",
    storySpine: "Flappy tries gliding with an open fern and spins, then rolls and ties it into a narrow bundle that flies straight.",
    failedAttempt: "Crosswind catches both wide sides of the open fern and turns Flappy around.", turningPoint: "Flappy compares the leaf's wide open shape with its narrow rolled shape.",
    resolution: "A tied narrow bundle hangs steadily beneath Flappy's safe low glide.", landing: "The fern opens into a dry entrance roof before the first rain.",
    duplicateAudit: "Distinct from high-branch flight and general storm preparation: the engine is aerodynamic drag and reshaping one delivery object.",
    targetSkills: ["air-resistance", "delivery"], sightWords: ["the", "one", "before", "he", "with", "under"],
    pages: [
      ["Flappy must carry one wide fern before rain.", "Flappy holds one very broad fern near the stream as dark rain clouds gather."],
      ["He grips the middle and begins a low glide.", "Flappy launches into a plausible low glide holding the fern's centre."],
      ["Wind catches both sides. The fern spins Flappy.", "A crosswind turns the open leaf and Flappy in one controlled airborne half-circle."],
      ["Flappy lands safely but cannot see ahead.", "Flappy stands safely while the broad fern blocks most of his forward view."],
      ["He rolls the fern into one narrow bundle.", "Flappy rolls the same intact fern lengthwise into a tight narrow cylinder."],
      ["Wiggly ties it with a long grass loop.", "Wiggly secures the rolled fern with one visible long grass tie."],
      ["Flappy glides straight with the bundle below.", "Flappy makes a straight low glide with the narrow bundle hanging beneath him."],
      ["The fern roof covers Cozy Cave before rain.", "The opened fern forms a dry small awning at Cozy Cave as first drops fall beyond it."]
    ]
  },
  {
    world: "dino", bookNumber: 24, id: "dino-pals-24-clumsys-steady-bowls", title: "Clumsy's Steady Bowls",
    theme: "matching water-bowl size to stable ground", cast: ["clumsy"], canonIds: ["DINO-CLUMSY"], location: "the long meadow route from the stream to Big Flat Rock",
    storyPromise: "Clumsy must place four water bowls before the games begin, but carrying them stacked sends every bowl rolling.",
    storySpine: "Clumsy stacks four bowls and loses them on a turn, then observes where each stops and places them by size and terrain.",
    failedAttempt: "One turn tips the four-bowl stack and sends differently sized bowls rolling downhill.", turningPoint: "Clumsy notices each bowl naturally stops at ground that fits its width.",
    resolution: "One-at-a-time delivery places the wide bowl on rock and smaller bowls between steady roots.", landing: "The whole drinking route remains upright through the games.",
    duplicateAudit: "Distinct from pillow retrieval and generic accidents: the failure reveals a size-and-surface pattern that Clumsy deliberately applies.",
    targetSkills: ["sorting", "stability"], sightWords: ["the", "four", "one", "each", "where", "between"],
    pages: [
      ["Clumsy must place four water bowls before the games.", "Tall Clumsy stands by four clean empty bowls of visibly different widths near the stream."],
      ["He stacks all four bowls across his back.", "Four nested but unstable bowls sit high across Clumsy's back as he starts walking."],
      ["One turn sends every bowl rolling downhill.", "All four bowls roll harmlessly apart on grass after Clumsy turns."],
      ["Clumsy follows and watches where each bowl stops.", "Clumsy observes four bowls stopped at different terrain features down the slope."],
      ["The widest bowl rests beside Big Flat Rock.", "The widest bowl sits level against Big Flat Rock's stable edge."],
      ["Small bowls fit between roots where feet cannot tip them.", "The smaller bowls nest securely in separate shallow spaces between roots."],
      ["Clumsy carries one filled bowl at a time.", "Clumsy carefully carries a single water-filled bowl low and level."],
      ["The drinking route stays full and steady.", "Four filled upright bowls remain stable along the meadow route during the games."]
    ]
  },
  {
    world: "dino", bookNumber: 25, id: "dino-pals-25-sneezys-seed-cloud", title: "Sneezy's Seed Cloud",
    theme: "using a damp leaf to collect airborne seed fluff", cast: ["sneezy", "sunny", "dozy"], canonIds: ["DINO-SNEEZY", "DINO-SUNNY", "DINO-DOZY"], location: "the entrance to Cozy Cave beside the stream on a dry breezy day",
    storyPromise: "Sneezy must clear tickly seed fluff before Dozy's nap, but one careful sneeze makes a larger cloud.",
    storySpine: "Sneezy tries to blow seed fluff away and disperses it, then notices damp seeds sticking and sweeps them onto a wet leaf.",
    failedAttempt: "Even after warning everyone, Sneezy's directed sneeze explodes the dry fluff across the cave mouth.", turningPoint: "Sneezy sees that stream-damp seeds stay fixed instead of floating.",
    resolution: "A broad wet leaf traps the fluff while Sneezy sweeps it clear.", landing: "Dozy enters the clean cave and the collected seeds are planted outside.",
    duplicateAudit: "Distinct from waterfall clearing and magic sneezes: the sneeze fails, while moisture and deliberate cleanup solve airborne seed dispersal.",
    targetSkills: ["seed-dispersal", "repair"], sightWords: ["the", "before", "one", "he", "onto", "outside"],
    pages: [
      ["Dry seed fluff drifts toward Cozy Cave.", "A visible cloud of harmless white fern seed fluff approaches Cozy Cave's entrance."],
      ["Sneezy must clear it before Dozy naps.", "Sneezy stands ready outside while Dozy approaches carrying his blue pillow."],
      ["He warns everyone then blows one careful sneeze.", "Sneezy signals Sunny and Dozy back before directing one sneeze away from them."],
      ["The fluff bursts into a bigger tickly cloud.", "The sneeze disperses the dry seed fluff across the entire cave entrance."],
      ["Sneezy notices wet seeds sticking beside the stream.", "Sneezy examines a small patch of identical fluff held fast on a damp stream stone."],
      ["Sunny dampens one broad leaf with clean water.", "Sunny dips one large clean fern leaf edge into the clear stream."],
      ["Sneezy sweeps the fluff onto the wet leaf.", "Sneezy uses the damp leaf to collect the loose fluff into one contained layer."],
      ["Dozy enters while Sneezy plants seeds outside.", "Dozy carries his pillow into the clear cave as Sneezy tips seeds onto bare soil outside."]
    ]
  },
  {
    world: "dino", bookNumber: 26, id: "dino-pals-26-sunnys-two-part-picnic", title: "Sunny's Two-Part Picnic",
    theme: "using the edge of shade to meet two temperature needs", cast: ["sunny", "grumpy", "chompy"], canonIds: ["DINO-SUNNY", "DINO-GRUMPY", "DINO-CHOMPY"], location: "Big Flat Rock where one sharp fern shadow divides warm and cool ground",
    storyPromise: "Sunny must seat Grumpy and Chompy for lunch before noon, but one shaded spot makes Chompy's berries cold and damp.",
    storySpine: "Sunny puts both friends in deep shade, satisfying only Grumpy, then divides the picnic along the sun-and-shade line.",
    failedAttempt: "The all-shade picnic cools Grumpy but leaves Chompy's berries damp and unappealing.", turningPoint: "Sunny notices the rock's clear boundary between warm sun and cool shade.",
    resolution: "Two connected halves give Grumpy cool space and Chompy warm berries.", landing: "Sunny serves one shared picnic across the visible temperature line.",
    duplicateAudit: "Distinct from food hunts and consent repairs: the problem is simultaneous contrasting temperature needs solved by spatial zoning.",
    targetSkills: ["contrasting-needs", "sun-shade"], sightWords: ["the", "one", "before", "but", "on", "across"],
    pages: [
      ["Sunny chooses Big Flat Rock for a picnic.", "Sunny arranges a small picnic basket at Big Flat Rock in midday light."],
      ["Grumpy wants shade. Chompy wants warm berries.", "Grumpy points toward cool fern shade while Chompy holds a bowl of berries toward sunlight."],
      ["Sunny moves everyone beneath one thick fern.", "Sunny moves both mats and the berry bowl fully under dense fern shade."],
      ["Grumpy cools down but Chompy's berries stay damp.", "Grumpy rests comfortably while Chompy examines visibly cool dewy berries."],
      ["Sunny studies the rock's sharp line of shade.", "Sunny looks at a crisp boundary dividing sunlit and shaded halves of the rock."],
      ["She places Grumpy's mat on the cool half.", "Grumpy's mat sits completely within the cool shaded half with clear personal space."],
      ["Chompy warms berries on the sunny half.", "Chompy's berry bowl sits in warm sunlight on the connected other half."],
      ["Sunny serves one picnic across two temperatures.", "Sunny sits at the boundary while Grumpy and Chompy enjoy their chosen adjacent halves."],
    ]
  },
  {
    world: "dino", bookNumber: 27, id: "dino-pals-27-bossys-three-paths", title: "Bossy's Three Paths",
    theme: "designing different crossing routes for different bodies", cast: ["bossy", "zippy", "grumpy"], canonIds: ["DINO-BOSSY", "DINO-ZIPPY", "DINO-GRUMPY"], location: "Muddy Puddle Pool at its narrow meadow crossing",
    storyPromise: "Bossy must get every Pal across Muddy Puddle Pool before lunch, but her equal stepping-stone gaps fit only Zippy.",
    storySpine: "Bossy's uniform crossing strands Grumpy mid-route, so she tests comfortable gaps and builds three marked paths.",
    failedAttempt: "Grumpy cannot safely reach the next equally spaced stone that Zippy crossed easily.", turningPoint: "Bossy asks bodies of different sizes to test one comfortable step before rebuilding.",
    resolution: "Stone, branch and edge routes create three usable crossings.", landing: "Bossy's clipboard shows three routes while large and small Pals cross dry.",
    duplicateAudit: "Distinct from Bossy's overloaded picnic and storm plans: this is an accessibility design problem where equality fails and fit matters.",
    targetSkills: ["accessibility", "measurement"], sightWords: ["the", "every", "before", "one", "three", "without"],
    pages: [
      ["Bossy plans eight stones across Muddy Puddle Pool.", "Bossy holds her leaf clipboard beside a row of eight equally spaced stepping stones."],
      ["The equal gaps fit Zippy's quick feet.", "Zippy crosses the regular gaps easily with his rainbow scarf fixed in place."],
      ["Grumpy reaches the middle and cannot step farther.", "Low heavy Grumpy pauses safely on a broad middle stone before a gap too wide for him."],
      ["Bossy's perfect row works for only one Pal.", "Bossy studies Zippy across the pool and Grumpy paused halfway on the same route."],
      ["She asks each dinosaur to test one comfortable gap.", "Bossy records measured test steps from differently sized Pals on her carried clipboard."],
      ["Stone and branch stations replace the equal row.", "Three clearly different routes use close stones, one stable branch and the shallow edge."],
      ["Bossy marks all three routes on her clipboard.", "Bossy's leaf clipboard carries three simple non-letter route diagrams matching the crossings."],
      ["Large and small Pals cross without splashing.", "Grumpy, Zippy and other varied Pals use different dry routes successfully."],
    ]
  },
  {
    world: "dino", bookNumber: 28, id: "dino-pals-28-honkys-echo-tunnel", title: "Honky's Echo Tunnel",
    theme: "using short echoes and moving air to identify an open tunnel", cast: ["honky"], canonIds: ["DINO-HONKY"], location: "a newly exposed three-way tunnel just behind Cozy Cave",
    storyPromise: "Honky must identify which new tunnel reaches the stream before dusk, but his biggest call hides every direction in crashing echoes.",
    storySpine: "Honky floods three branches with one huge call, then tests them separately with short notes and listens for moving air.",
    failedAttempt: "One enormous call rebounds from all three branches at once and gives no usable direction.", turningPoint: "Honky separates the test into one short note at each branch and notices air movement.",
    resolution: "Two deep closed echoes and one soft airy answer identify the stream branch.", landing: "Honky marks the open route and returns rather than entering alone.",
    duplicateAudit: "Distinct from inside-voice and storm-guidance stories: Honky uses controlled acoustics as measurement, not volume etiquette or broadcasting.",
    targetSkills: ["sound", "inquiry"], sightWords: ["the", "one", "three", "which", "each", "with"],
    pages: [
      ["Honky finds three tunnels behind Cozy Cave.", "Honky stands at one safe chamber where three distinct dark tunnel mouths branch apart."],
      ["He wants the tunnel that reaches the stream.", "Honky compares the three entrances while a small airflow bends one nearby fern."],
      ["Honky sends his biggest call into the chamber.", "Honky releases one powerful call from his fixed rainbow crest while standing at the junction."],
      ["Crashing echoes hide every direction at once.", "Visible vibration ripples rebound chaotically from all three tunnel mouths as Honky covers his ears."],
      ["Honky taps one short note near each branch.", "Honky tests the first of three branches with a brief controlled note."],
      ["Two branches answer with deep closed echoes.", "Two tunnel mouths show tight returning ripple patterns against visible end walls."],
      ["One branch answers softly with moving stream air.", "The third tunnel shows a faint receding ripple and cool air lifting a fern toward Honky."],
      ["Honky marks the open tunnel and turns back.", "Honky places one bright stone at the airy branch then safely walks back toward Cozy Cave."],
    ]
  },
  {
    world: "dino", bookNumber: 29, id: "dino-pals-29-cheekys-shadow-show", title: "Cheeky's Shadow Show",
    theme: "moving a shadow screen to catch low sunlight", cast: ["cheeky", "fancy", "wiggly"], canonIds: ["DINO-CHEEKY", "DINO-FANCY", "DINO-WIGGLY"], location: "Big Flat Rock and the western hill from noon to sunset",
    storyPromise: "Cheeky must make a giant shadow dinosaur before the evening show, but noon light falls straight down behind his leaf screen.",
    storySpine: "Cheeky performs behind a noon-lit leaf and produces no useful shadow, then moves the screen west for long evening light.",
    failedAttempt: "Waving harder beneath overhead light shows only Cheeky's feet at the bottom of the screen.", turningPoint: "Cheeky notices the western hill shadows stretching as the sun lowers.",
    resolution: "The relocated screen catches a long silhouette that Fancy and Wiggly enlarge.", landing: "Their giant shadow dinosaur bows to the invited audience.",
    duplicateAudit: "Distinct from prank stories and races: the humour is a consent-based performance built from changing light angle.",
    targetSkills: ["shadow", "performance"], sightWords: ["the", "a", "one", "behind", "beside", "their"],
    pages: [
      ["Cheeky plans a shadow show beside Big Flat Rock.", "Cheeky sets one broad upright leaf screen beside Big Flat Rock with show props neatly ready."],
      ["He shapes a funny dinosaur behind the leaf.", "Cheeky poses behind the screen with harmless branch shapes forming playful ears."],
      ["Noon light falls straight down. No shadow appears.", "Overhead sun leaves the leaf face bright and almost blank despite Cheeky's pose."],
      ["Cheeky waves harder but shows only his feet.", "Only Cheeky's small foot shadows appear at the screen's bottom while he waves."],
      ["Long hill shadows point away from the sunset.", "Cheeky studies long clear tree shadows stretching from the western hill."],
      ["Cheeky moves the leaf beside the western hill.", "Cheeky relocates the same screen to catch low amber sunlight from behind."],
      ["Fancy adds ears while Wiggly adds a tail.", "Cheeky, Fancy and Wiggly combine readable silhouettes with Fancy's plates and Wiggly's long tail."],
      ["Their giant shadow dinosaur bows to the Pals.", "One huge playful dinosaur silhouette bows on the screen before a delighted seated audience."],
    ]
  },
  {
    world: "dino", bookNumber: 30, id: "dino-pals-30-dozy-stops-the-melon", title: "Dozy Stops the Melon",
    theme: "using a grassy dip and pillow as a gentle rolling stop", cast: ["dozy", "zippy"], canonIds: ["DINO-DOZY", "DINO-ZIPPY"], location: "the sloping long meadow above a narrow grassy dip",
    storyPromise: "Dozy must guard one round melon until lunch, but it rolls downhill with his blue pillow.",
    storySpine: "Dozy wedges a melon beside his pillow and accidentally starts both rolling; Zippy's chase worsens it, so Dozy blocks a grassy dip ahead.",
    failedAttempt: "Zippy catches up and bumps the rolling melon faster instead of stopping it.", turningPoint: "Slow Dozy studies the hill ahead and chooses the narrow dip rather than chasing from behind.",
    resolution: "Dozy lays his pillow across the dip and catches the melon gently.", landing: "The melon rests beside Dozy while Zippy walks the final stretch.",
    duplicateAudit: "Distinct from waking and dream stories: Dozy's calm pace and stateful pillow solve a rolling-object interception problem.",
    targetSkills: ["motion", "prediction"], sightWords: ["the", "one", "until", "his", "both", "across"],
    pages: [
      ["Dozy agrees to guard one round melon.", "Dozy stands beside one large round melon on the upper meadow with his blue pillow."],
      ["He wedges it beside his blue pillow.", "The melon rests against the clearly visible blue pillow on sloped grass."],
      ["Dozy stretches. The melon nudges the pillow away.", "Dozy stretches gently as the melon begins pushing the pillow downhill."],
      ["Both roll down the long meadow.", "The round melon and blue pillow roll together down a broad safe grassy slope."],
      ["Zippy chases them but bumps the melon faster.", "Zippy reaches the melon and accidentally taps it faster while his scarf streams behind."],
      ["Dozy walks toward the narrow grassy dip ahead.", "Dozy takes a calm diagonal route toward a visible narrow dip below the rolling objects."],
      ["He places his pillow across the dip.", "Dozy retrieves and lays the blue pillow securely across the dip before the melon arrives."],
      ["The melon stops gently beside sleepy Dozy.", "The melon settles softly against the pillow while Dozy rests beside it and Zippy slows."],
    ]
  },

  {
    world: "moonwood", bookNumber: 26, id: "moonwood-tales-c-26", title: "Pip and the Bell Below",
    theme: "tracing vibration to secure an underground bell rope", cast: ["pip", "burrow"], canonIds: ["MOON-PIP", "MOON-BURROW"], location: "Hollow Oak's lantern hall and the old roots directly beneath it during a windy moonlit night",
    storyPromise: "Pip must quiet Hollow Oak's bell before its lanterns shake loose, but holding the visible rope makes the ringing worse.",
    storySpine: "Pip restrains the upper bell rope and increases the ringing, then traces vibration below and secures a wind-pulled buried branch.",
    failedAttempt: "Holding the visible rope transmits stronger underground tugs and makes the bell ring harder.", turningPoint: "Pip feels each chime travel upward through the floor roots and asks Burrow to expose the hidden linkage.",
    resolution: "A loop around a smooth root peg keeps the buried branch from pulling the lower rope.", landing: "Pip rehanges one lantern beside the silent bell while wind bends harmlessly outside.",
    duplicateAudit: "Distinct from sound-source and Hollow Oak room searches: this mystery is solved through mechanical vibration and a two-sided rope system.",
    targetSkills: ["vibration", "mechanism"], sightWords: ["the", "before", "through", "while", "under", "one"],
    pages: [
      ["A bell rings under Hollow Oak although nobody pulls its rope.", "Pip looks up at a swinging brass root bell and untouched hanging rope inside Hollow Oak."],
      ["Pip must quiet it before the hanging lanterns shake loose.", "Several secured lanterns tremble on hooks while Pip reaches toward the bell rope."],
      ["He holds the rope still but the bell rings harder.", "Pip grips the visible rope with both hands as the bell swings more strongly."],
      ["Pip feels each chime tremble upward through the roots.", "Pip kneels with one hand on a vibrating floor root while the bell rings above."],
      ["Burrow uncovers a buried branch tugging the bell's lower rope.", "Burrow digs carefully below to reveal one branch connected to a lower rope section."],
      ["Wind bends an old tree and pulls that branch underground.", "A cutaway-like single scene shows the outside tree bending and its buried branch tugging the rope."],
      ["Pip wedges the branch free but one gust knocks it back.", "Pip's temporary wood wedge slips aside as the branch moves again; nobody is in danger."],
      ["He loops the loose rope around one smooth root peg.", "Pip deliberately ties the lower rope to one rounded fixed root peg beside Burrow."],
      ["The wind bends harmlessly while the bell remains still.", "Outside branches sway through a window while the indoor bell and lanterns hang motionless."],
      ["Pip hangs one fallen lantern beside the silent bell.", "Small Pip rehanges one intact lantern below the now-still bell as Burrow watches."],
    ]
  },
  {
    world: "moonwood", bookNumber: 27, id: "moonwood-tales-c-27", title: "Stone and the Glassleaf Moonbeam",
    theme: "reflecting moonlight into a shadowed glassleaf garden", cast: ["stone", "fern", "pip"], canonIds: ["MOON-STONE", "MOON-FERN", "MOON-PIP"], location: "Fern's glassleaf bed between Crystal Stream and old roots during one clear moonrise",
    storyPromise: "Stone must help Fern open the glassleaf buds before moonrise passes, but his enormous shadow blocks their only beam.",
    storySpine: "Stone tries working inside the garden and shades it, then redirects reflected stream light from outside the fragile bed.",
    failedAttempt: "Moving within the root ring keeps Stone's huge body between the moon and the buds.", turningPoint: "Pip notices a silver patch of stream light reaching beneath the roots from the opposite side.",
    resolution: "Stone tilts a flat wet rock until reflected moonlight enters the bed and opens every bud.", landing: "Stone watches the glassleaf bells reflect tiny moon shapes onto his hands.",
    duplicateAudit: "Distinct from bridge courage and stream force stories: the engine is reflection geometry and Stone helping without entering a small space.",
    targetSkills: ["reflection", "scale"], sightWords: ["the", "before", "between", "until", "every", "onto"],
    pages: [
      ["Fern's glassleaf buds need one moonbeam before they close.", "Fern kneels beside closed translucent glassleaf buds under old roots as moonrise begins."],
      ["Stone offers to clear the branches shading their garden.", "Stone stands two to three times Pip's height and reaches toward fallen branches outside the bed."],
      ["His enormous shadow covers every bud while he works.", "Stone's correctly scaled body casts one large clear shadow across all closed buds."],
      ["Stone moves left but the curving roots block his reach.", "Stone shifts outside the bed and stretches carefully around roots without touching plants."],
      ["Pip spots silver stream light beneath the opposite roots.", "Pip points to a bright reflected patch from Crystal Stream under the garden's far roots."],
      ["Stone carries one flat wet rock beside the stream.", "Stone lifts one broad wet reflective rock while tiny Pip guides from a safe distance."],
      ["His first tilt sends the moonbeam above the buds.", "The reflected beam visibly lands on bark above the closed glassleaf bed."],
      ["Fern guides Stone's hands one finger-width lower.", "Fern signals a tiny downward adjustment while Stone holds the rock steadily outside the bed."],
      ["Reflected moonlight opens every glassleaf bell.", "All translucent buds open into bell shapes under one redirected silver beam."],
      ["Tiny moon shapes shine across Stone's broad hands.", "Open glassleaves cast delicate reflected moon shapes onto Stone's enormous gentle hands."],
    ]
  },
  {
    world: "moonwood", bookNumber: 28, id: "moonwood-tales-c-28", title: "Fern and the Humming Root",
    theme: "guiding a sound-copying root with spaced taps", cast: ["fern", "luna"], canonIds: ["MOON-FERN", "MOON-LUNA", "MOON-LOCAL-28-HUMMING-ROOT"], location: "Hollow Oak's front step and one empty wooden arch frame before Luna's night class",
    storyPromise: "Fern must clear Hollow Oak's step before Luna's class, but the silver root copies every calming note with another loop.",
    storySpine: "Fern sings to a note-copying root and worsens its tangle, then uses silence and spaced taps to guide one controlled curve.",
    failedAttempt: "Fern's calming phrase produces a new root loop for every note and tangles the railing.", turningPoint: "Fern notices the root becomes completely still whenever the clearing falls silent.",
    resolution: "Three spaced taps lead the root around an empty frame instead of across the step.", landing: "Luna's class enters through a stable living silver arch.",
    duplicateAudit: "Distinct from overgrowth and root-song reversals: this root has one explicit sound-copying rule solved by rhythm and silence.",
    targetSkills: ["pattern", "rule-based-magic"], sightWords: ["the", "every", "before", "whenever", "instead", "through"],
    pages: [
      ["A silver root curls across Hollow Oak's front step.", "One story-local silver root crosses the step in a single loose curve; no face or limbs."],
      ["Fern hears it hum every note the forest makes.", "Fern listens as tiny vibration rings travel from night sounds along the silver root."],
      ["She must clear the step before Luna's night class.", "Luna waits with several young owl pupils beyond the blocked but safe step."],
      ["Fern sings calmly. The root copies each note with a loop.", "Each visible sung note corresponds to one new root loop around the railing."],
      ["More singing ties three tight loops around the rail.", "Exactly three silver loops now bind the railing while Fern stops singing."],
      ["Fern notices the root rests whenever the clearing falls silent.", "In a visibly quiet clearing the root lies completely still and Fern studies it."],
      ["She taps once beside an empty wooden frame.", "Fern taps one side of a simple empty arch frame placed clear of the step."],
      ["The root follows that single vibration instead of many songs.", "The root grows one controlled curve toward the tapped frame and away from the step."],
      ["Three spaced taps guide it around the frame.", "Fern makes a third measured tap as the root completes a stable arch around the frame."],
      ["Luna's class enters beneath the living silver arch.", "Luna and young owls pass safely under the finished silver-root arch while Fern watches."],
    ]
  },
  {
    world: "moonwood", bookNumber: 29, id: "moonwood-tales-c-29", title: "Wren's One-Object Pocket",
    theme: "using a one-object spell to carry a bundled harvest", cast: ["wren", "fern"], canonIds: ["MOON-WREN", "MOON-FERN"], location: "Fern's garden path to Hollow Oak as a brief night rain approaches",
    storyPromise: "Wren must carry ten dry moonberries inside before rain, but her weightless pocket keeps only one object.",
    storySpine: "Wren loads separate berries and unknowingly ejects each previous one, then wraps the harvest into one leaf bundle that fits the spell's rule.",
    failedAttempt: "Each new berry entering the pocket pops the previous berry onto the path behind Wren.", turningPoint: "Wren reaches Hollow Oak with one berry and sees one broad leaf holding the other nine together.",
    resolution: "The tied bundle counts as one whole object and travels safely in the pocket.", landing: "Ten dry berries fill Fern's bowl while rain drums outside.",
    duplicateAudit: "Distinct from wrong and backwards spells: the spell works exactly as declared; Wren revises how she defines the carried object.",
    targetSkills: ["classification", "rule-based-magic"], sightWords: ["the", "one", "before", "inside", "only", "whole"],
    pages: [
      ["Rain threatens Fern's ten dry moonberries.", "Fern guards exactly ten pale moonberries on a garden cloth beneath approaching rain clouds."],
      ["Wren promises to carry them inside before the first drop.", "Wren opens one robe pocket beside the ten berries while Hollow Oak glows nearby."],
      ["Her pocket spell holds one object without weight.", "A clear single-object gold symbol glows above the empty pocket; no letters or pseudo-writing."],
      ["Wren drops berry after berry inside.", "Wren places another berry into the pocket while earlier berries begin appearing behind her."],
      ["Each new berry pops the last one onto the path.", "A causal sequence is clear: one entering berry and one previous berry gently popping out behind."],
      ["She reaches Hollow Oak carrying only one berry.", "Surprised Wren opens the pocket at Hollow Oak and finds exactly one berry."],
      ["One broad leaf can hold the other nine together.", "Wren sees exactly nine berries resting together on one broad leaf along her return path."],
      ["Wren ties all ten berries inside the leaf.", "Wren adds the final berry and ties one secure leaf bundle containing exactly ten."],
      ["The single bundle slips into the weightless pocket.", "The complete tied bundle enters the pocket with nothing popping out."],
      ["Rain drums outside while ten berries fill Fern's bowl.", "Inside Hollow Oak Fern counts exactly ten dry berries in a bowl as rain shows through the window."],
    ]
  },
  {
    world: "moonwood", bookNumber: 30, id: "moonwood-tales-c-30", title: "Luna and the Wandering Constellation",
    theme: "using the real sky to restore a tangled star mobile", cast: ["luna"], canonIds: ["MOON-LUNA"], location: "Hollow Oak's round-roofed star room after a windy night",
    storyPromise: "Luna must restore the seven-star mobile before her pupils arrive, but sorting by size makes the wrong constellation.",
    storySpine: "Luna neatly orders tangled glass stars by size, then rejects that plausible pattern and aligns their shadows with the real sky.",
    failedAttempt: "The size-sorted stars form a tidy row that matches no constellation in the ceiling light.", turningPoint: "Luna opens the roof and identifies the red eastern star among three silver points.",
    resolution: "Turning each thread until its shadow matches the sky restores the seven-light owl.", landing: "The pupils trace the correct owl shape and Luna secures the window latch.",
    duplicateAudit: "Distinct from fallen star rescue and Memory Room ordering: the engine is evidence-based astronomical alignment of a model.",
    targetSkills: ["model", "constellation"], sightWords: ["the", "before", "seven", "until", "among", "after"],
    pages: [
      ["Luna finds the star-room mobile tangled after a windy night.", "Luna flies beside seven tangled coloured glass stars hanging from crossed threads."],
      ["She must restore its pattern before the young owls arrive.", "Luna studies the tangled mobile while young owl silhouettes approach outside the round door."],
      ["Luna sorts the glass stars from smallest to largest.", "Seven glass stars hang in one tidy size-ordered row under Luna's careful wing."],
      ["The neat row forms no constellation in the ceiling light.", "Seven separate reflections make a straight line rather than a recognizable shape."],
      ["She opens the round roof window and studies the true stars.", "Luna uses her wings to open the round roof aperture onto a clear night sky."],
      ["One red star hangs east of three silver points.", "The sky clearly shows one red star to the east of three close silver stars."],
      ["Luna turns each thread until its shadow matches the sky.", "Luna adjusts threads one at a time while their reflected positions approach the sky pattern."],
      ["The mobile's seven lights join into an owl shape.", "Exactly seven reflected lights now form one clear owl constellation on the ceiling."],
      ["Young owls enter and trace that shape overhead.", "Several young owls look up and trace the seven-light owl with wing tips."],
      ["Luna ties the window latch before the next wind.", "Luna secures the roof latch with her beak and wing while the restored mobile hangs still."],
    ]
  },
  {
    world: "moonwood", bookNumber: 31, id: "moonwood-tales-c-31", title: "Burrow's Round Tunnel",
    theme: "measuring a root circle to find a firm tunnel crossing", cast: ["burrow", "fern"], canonIds: ["MOON-BURROW", "MOON-FERN"], location: "the old roots between Hollow Oak and Fern's garden above a safe shallow tunnel",
    storyPromise: "Burrow must dig a short garden tunnel before planting begins, but one curving root sends him back to his own shovel.",
    storySpine: "Burrow follows a blocking root in a full circle, then measures it and finds one firm crossing beneath its deepest point.",
    failedAttempt: "Following the root's easy curve produces a circular tunnel that returns to the starting entrance.", turningPoint: "Burrow marks the root and measures the complete circle instead of treating it as a line.",
    resolution: "A checked firm gap beneath the deepest root creates a direct safe route.", landing: "Fern plants moss over both entrances while Burrow adds the hidden circle to his map.",
    duplicateAudit: "Distinct from changing-map and getting-lost stories: the map is not the cause or answer; three-dimensional root geometry is.",
    targetSkills: ["geometry", "mapping"], sightWords: ["the", "before", "beneath", "instead", "through", "both"],
    pages: [
      ["Burrow plans a short tunnel from Hollow Oak to Fern's garden.", "Burrow holds a simple line map between two visible surface landmarks with his shovel ready."],
      ["His map shows one straight line beneath the clearing.", "A simple non-letter diagram shows one straight route while Burrow begins below ground."],
      ["A thick root bends his tunnel left.", "One enormous curved root blocks the direct tunnel and Burrow turns left around it."],
      ["Burrow follows it and emerges beside his starting shovel.", "Burrow pops up beside the same shovel and entrance with comic surprise."],
      ["He marks the curved root and measures its full circle.", "Burrow uses small clay dots and a cord to record the complete underground root circle."],
      ["A narrow firm gap crosses beneath its deepest point.", "Burrow identifies one compact-soil gap directly under the root's deepest curve."],
      ["Burrow checks the soil then digs through that gap.", "Burrow presses the firm soil first and then digs a safe narrow crossing."],
      ["The new tunnel rises beneath Fern's empty potting bench.", "Burrow emerges at the intended garden endpoint beneath an empty sturdy wooden bench."],
      ["Fern plants soft moss above both safe entrances.", "Fern places moss around two clearly separate reinforced tunnel entrances."],
      ["Burrow adds the hidden root circle to his map.", "Burrow draws one circular root symbol on his map while keeping round glasses fixed."],
    ]
  },
  {
    world: "moonwood", bookNumber: 32, id: "moonwood-tales-c-32", title: "Flint's Two Shadows",
    theme: "removing a beam-splitting crystal from a lantern", cast: ["flint", "pip"], canonIds: ["MOON-FLINT", "MOON-PIP"], location: "the fern path at the safe edge of Deep Dark before a night map delivery",
    storyPromise: "Flint must test his lantern before entering Deep Dark, but every root casts two conflicting shadows.",
    storySpine: "Flint covers a panel and follows the wrong doubled shadow, then Pip finds a crystal splitting the beam beneath the handle.",
    failedAttempt: "Covering one panel does not remove the second beam, and following its darker shadow leads into a fern wall.", turningPoint: "Pip looks at the lantern rather than the path and spots the angled crystal.",
    resolution: "Flint removes and pouches the crystal so one low beam makes reliable root shadows.", landing: "Flint enters Deep Dark only after the lantern passes the second test.",
    duplicateAudit: "Distinct from lost-glow and pathfinding books: the location is known; the problem is optical instrument validation and false evidence.",
    targetSkills: ["light", "testing-tools"], sightWords: ["the", "before", "every", "beneath", "again", "into"],
    pages: [
      ["Flint tests his lantern before carrying maps through Deep Dark.", "Flint holds his stateful lit lantern low beside rolled maps at Deep Dark's edge."],
      ["Every root casts two shadows in different directions.", "Each nearby root has exactly two distinct shadows from the lantern's split beam."],
      ["He covers one lantern panel but both shadows remain.", "Flint covers one glass panel with a gloved hand while two shadows stay visible."],
      ["Flint follows the darker shadow and meets a fern wall.", "Flint safely stops nose-to-leaf at a dense harmless fern wall beside the known path."],
      ["Pip notices one bright crystal beneath the lantern handle.", "Small Pip points to one angled clear crystal caught under the lantern handle."],
      ["The crystal splits the beam through its angled sides.", "Close readable view of one beam entering the crystal and two light beams leaving it."],
      ["Flint pulls it free but drops it into the beam again.", "The removed crystal falls safely across the light and briefly recreates two beams."],
      ["He wraps the crystal inside his brown pouch.", "Flint securely wraps and closes the crystal inside one brown explorer pouch."],
      ["One clear shadow now points away from every root.", "The tested lantern produces one clean shadow per root along the open path."],
      ["Flint enters Deep Dark with the tested lantern held low.", "Flint walks into Deep Dark carrying the low steady lantern while Pip watches from the safe edge."],
    ]
  },
  {
    world: "moonwood", bookNumber: 33, id: "moonwood-tales-c-33", title: "Glimmer and the Sticky Stars",
    theme: "warming a glued paper-star stack slowly from below", cast: ["glimmer", "luna"], canonIds: ["MOON-GLIMMER", "MOON-LUNA"], location: "Hollow Oak's star room beside a marked circular warming area",
    storyPromise: "Glimmer must separate Luna's paper stars before class, but direct cinnamon warmth curls the top star while the sap stays cold.",
    storySpine: "Glimmer warms a sap-glued stack directly and damages its shape, then heats a rock at a safe distance to soften every layer slowly.",
    failedAttempt: "Direct warmth curls the exposed star points without reaching the cold sap between deeper sheets.", turningPoint: "Glimmer stops, measures three tail-lengths and changes from direct air to stored warmth beneath the stack.",
    resolution: "A gently warmed rock softens each layer evenly so the stars separate intact.", landing: "The repaired paper stars turn overhead during Luna's lesson.",
    duplicateAudit: "Distinct from flame-practice stories: Glimmer applies established safe warmth to a specific material-transfer problem, with no new fire ability.",
    targetSkills: ["heat-transfer", "safety"], sightWords: ["the", "before", "while", "beneath", "each", "without"],
    pages: [
      ["Cold tree sap glues Luna's paper stars into one stack.", "Luna shows Glimmer a stiff stack of cut paper stars joined by visible amber tree sap."],
      ["Glimmer must separate them before the star room opens.", "Glimmer studies the stack beside the marked circular warming area and closed classroom door."],
      ["He blows cinnamon warmth directly across the top star.", "Glimmer uses warm breath without flame directly over the top paper star."],
      ["Its points curl inward while the deeper sap stays cold.", "Only the top star's points curl; deeper sheets remain visibly stuck by hard sap."],
      ["Glimmer stops and measures three tail-lengths from the table.", "Glimmer marks a safe three-tail-length distance on the floor and fully stops warming."],
      ["He warms one flat rock inside the marked circle.", "Glimmer gently warms one flat rock within the established safety circle; no flame."],
      ["Luna slides the warm rock beneath the paper stack.", "Luna uses owl wings and beak naturally to slide the warm flat rock beneath the stack."],
      ["Heat rises slowly and softens every layer of sap.", "Gentle warmth rises from below and the amber sap visibly softens through all layers."],
      ["Glimmer lifts each flat star without tearing a point.", "Glimmer carefully separates intact flat stars one by one with natural dragon claws."],
      ["The repaired stars turn above Luna's evening lesson.", "The complete intact paper-star mobile rotates overhead as Luna teaches and Glimmer watches."],
    ]
  },
  {
    world: "moonwood", bookNumber: 34, id: "moonwood-tales-c-34", title: "Spark's Ten-Count Hook",
    theme: "using a temporary copy spell as a mould", cast: ["spark", "luna", "fern"], canonIds: ["MOON-SPARK", "MOON-LUNA", "MOON-FERN"], location: "Hollow Oak's lowest lantern rail beside Fern's root-fibre worktable",
    storyPromise: "Spark must replace a broken lantern hook before moonrise, but every copied hook vanishes after exactly ten counts.",
    storySpine: "Spark hangs a lantern from a ten-count copy and nearly drops it, then uses the temporary shape to mould a lasting root-fibre hook.",
    failedAttempt: "The copied hook vanishes precisely at count ten while Luna catches the lantern safely.", turningPoint: "Spark accepts that repetition cannot alter the spell's duration and uses its accurate shape instead.",
    resolution: "Soft clay records the copy, and Fern's dried root fibre fills the curved mould.", landing: "The permanent hook holds while Spark counts far beyond ten.",
    duplicateAudit: "Distinct from failed spell-correction plots: the spell is never fixed; its strict time limit becomes a manufacturing tool.",
    targetSkills: ["moulding", "rule-based-magic"], sightWords: ["the", "before", "exactly", "after", "inside", "beyond"],
    pages: [
      ["Hollow Oak needs a new curved hook for its lowest lantern.", "Spark examines one broken curved hook beside Hollow Oak's lowest unlit lantern."],
      ["Spark's copy spell lasts exactly ten spoken counts.", "Spark casts one clearly temporary gold copy beside the intact matching hook; ten glow dots indicate duration."],
      ["He copies the good hook and hangs the lantern immediately.", "Spark hangs the lantern on the glowing copied hook while keeping the original nearby."],
      ["At count ten the copy vanishes and Luna catches the lantern.", "The gold hook disappears as Luna safely catches the descending lantern with natural wings and feet."],
      ["Repeating the spell cannot make the copy last longer.", "A second copied hook fades at the same tenth glow dot while Spark observes instead of loading it."],
      ["Spark presses soft clay around the next ten-count copy.", "Spark packs soft clay around a third temporary curved hook without attaching a lantern."],
      ["The shape vanishes but leaves a perfect curved mould.", "The gold copy is gone and a clean curved hollow remains in the clay."],
      ["Fern packs the mould with strong root fibre.", "Fern presses visible woven root fibre into the complete clay mould."],
      ["The fibre dries into a solid matching hook.", "A dry permanent root-fibre hook comes cleanly from the mould and matches the original curve."],
      ["Spark hangs the lantern and counts far past ten.", "The lantern remains securely hung on the permanent hook as Spark happily counts many glow dots."],
    ]
  },
  {
    world: "moonwood", bookNumber: 35, id: "moonwood-tales-c-35", title: "Pip and Stone Tune the Root Chimes",
    theme: "matching four chimes to four different touching tools", cast: ["pip", "stone", "luna"], canonIds: ["MOON-PIP", "MOON-STONE", "MOON-LUNA"], location: "Hollow Oak's four root chimes before a moonrise gathering",
    storyPromise: "Pip and Stone must tune four root chimes before Luna opens the doors, but Stone's one large pebble makes every note collide.",
    storySpine: "Stone strikes every differently sized chime with one tool and twists the smallest, then Pip matches four touches to four chimes.",
    failedAttempt: "The same large pebble produces harsh overlapping notes and twists the smallest chime on its cord.", turningPoint: "Pip tests an acorn, leaf stem, smooth stone and fingertip separately and hears four clear responses.",
    resolution: "Stone steadies the cord while Pip sequences the four matched tools from low roots upward.", landing: "One clear pattern crosses Moonwood as Luna opens the gathering doors.",
    duplicateAudit: "Distinct from loud-noise mysteries and the underground bell mechanism: this is instrument tuning through material matching and precise cooperation.",
    targetSkills: ["sound-quality", "sequence"], sightWords: ["the", "four", "before", "while", "each", "from"],
    pages: [
      ["Hollow Oak's four root chimes sound wrong before moonrise.", "Exactly four differently sized root chimes hang unevenly inside Hollow Oak."],
      ["Pip and Stone must tune them before Luna opens the doors.", "Tiny Pip and Stone at two-to-three-times his height inspect the four chimes while Luna waits outside."],
      ["Stone taps every chime with the same large pebble.", "Stone gently uses one large pebble on each of the four chimes while Pip listens."],
      ["Four harsh notes collide and the smallest chime twists.", "Four overlapping vibration patterns surround one visibly twisted but unbroken smallest chime."],
      ["Pip tests an acorn, leaf stem, smooth stone, and fingertip.", "Pip lays out exactly four tools and tests them one at a time."],
      ["Each chime answers clearly to one different touch.", "Four chimes pair visibly with acorn, leaf stem, smooth stone and Pip's fingertip."],
      ["Stone steadies the twisted chime with one careful finger.", "Huge Stone uses one fingertip delicately to straighten the smallest chime's cord."],
      ["Pip places each matching object beneath its chime.", "Exactly four objects sit beneath their four matching chimes with no written labels."],
      ["Together they play the notes from low roots upward.", "Pip touches the smaller chimes while Stone precisely taps larger ones in an upward sequence."],
      ["Luna opens the doors as one clear pattern crosses Moonwood.", "Luna opens Hollow Oak's doors while four harmonious sound ripples travel into the moonlit forest."],
    ]
  }
].map(createBook);

export const guidedReadingWorldExpansionBooks = Object.freeze(books);
