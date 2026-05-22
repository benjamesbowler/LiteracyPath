# LiteracyPath — Child Learning Experience Layer
### Design Document v1

---

## Framing Note

This document designs the child-facing experience layer only. The existing adaptive assessment engine, mastery tracking, EL assessment infrastructure, teacher dashboards, analytics, and reporting systems are preserved exactly as they are. This design sits on top of that engine like a stage set over a working theatre — the machinery beneath keeps running; the child sees only the performance.

Every design decision here serves one goal: a child between the ages of 5 and 7 should feel that practicing phonics is something they choose to do, not something done to them.

---

## 1. Child Mode Philosophy

### The Emotional Contract

Teacher Mode is a tool. Child Mode is a place.

When a teacher opens LiteracyPath they need information fast. Clarity, density, and efficiency are virtues. When a child opens LiteracyPath they need to feel something first — safe, curious, welcomed, capable. Information architecture is irrelevant to them. Emotional architecture is everything.

The philosophical difference between the two modes is not cosmetic. It is structural. Teacher Mode answers questions. Child Mode asks them — in the form of curiosity, wonder, and the gentle pull of what happens next.

### Core Emotional Principles

**The child is never a student in Child Mode.** They are an explorer, a helper, a discoverer. The framing of every activity is: you are doing something in a world, not completing an exercise in an app.

**Effort should feel worthwhile immediately.** A child who gets something right should feel something real within half a second. Not a score update. Not a progress bar increment. A sound, an animation, a character reaction — something that says: *that mattered*.

**Getting something wrong is not failing.** It is the world gently redirecting. No red. No harsh sounds. No explicit failure states. The world says: *try again* in the same tone it says *well done*.

**The world should feel alive whether or not the child is actively interacting.** Idle moments — the child thinking, the child looking away, the child pausing — should be filled with soft ambient life. A character blinks. A leaf drifts. A creature stretches. The world is patient.

**Progress should be visible, spatial, and emotional — never numerical.** A child doesn't need to know their accuracy percentage. They need to see the world getting more beautiful, their companion getting bigger, their collection getting fuller. These are the same information. One is motivating; the other is anxiety-inducing.

### Visual Language Separation

Teacher Mode and Child Mode should feel like completely different products to adult eyes — while sharing the same underlying data. If a teacher accidentally enters Child Mode, they should immediately know it. If a child accidentally opens Teacher Mode (which should not be possible, but architecturally), they should find it completely unengaging.

Teacher Mode visual language: clean, professional, information-dense, neutral palette, standard UI conventions.

Child Mode visual language: illustrated, organic, warm, character-driven, world-immersive, minimal visible UI chrome.

The two modes share one thing: they are both trustworthy. The teacher trusts the data. The child trusts the world.

---

## 2. Skill Tree Redesign

### Philosophy: The World IS the Skill Tree

The phonics progression is not presented to the child as a skill tree, a curriculum map, or a learning path. It is presented as a world — a series of places, each with its own character, environment, and set of adventures. Progressing through the curriculum is indistinguishable, from the child's perspective, from exploring a world.

The mapping is invisible. Every world corresponds to a phonics tier. Every path within a world corresponds to a skill cluster. Every mission corresponds to a skill item's assessment stage (introduction → practice → mastery confirmation). The child sees exploration. The engine sees assessment data.

### World Structure

The complete LiteracyPath world is organized into seven regions. Each region is a distinct visual and emotional environment. Each maps to the phonics progression tiers from the Question Model Framework.

**World 1: The Whispering Meadow**
Phonics tier: Initial sounds, final sounds, letter-sound correspondence
Environment: Twilight meadow, fireflies, warm amber light, a growing moon
Emotional tone: Safe, gentle, welcoming — the child's first home in the app
Character: Pip (small luminous owl, clumsy and warm)
Visual theme: Soft watercolor, organic shapes, maximum warmth

**World 2: The Echo Caves**
Phonics tier: CVC words, short vowels
Environment: Luminous underground caverns, crystal formations, underground lakes
Emotional tone: Curious, slightly mysterious, discoveries around every corner
Character: Rumble (a gentle cave creature who speaks in echoes)
Visual theme: Deep teals and ambers, crystalline highlights, cave wonder

**World 3: The Blend Bridge**
Phonics tier: Consonant blends, onset-rime
Environment: A vast bridge network over clouds, engineering and construction
Emotional tone: Adventurous, physical, building-focused
Character: Bridget (a young engineer who builds things with sounds)
Visual theme: Warm industrial, blueprints, cloud sky, copper and steel

**World 4: The Vowel Valley**
Phonics tier: Digraphs, long vowels
Environment: A lush valley with distinct areas for each vowel sound
Emotional tone: Abundant, colorful, harvest-like richness
Character: Vela (a gardener who grows different plants for each sound)
Visual theme: Deep botanical illustration, rich greens, vowel-color associations

**World 5: The River of Stars**
Phonics tier: Vowel teams
Environment: A wide river under a star-filled sky, navigation and discovery
Emotional tone: Expansive, calming, slightly epic
Character: Marina (a river guide who navigates by sound-stars)
Visual theme: Deep night blue, star reflections, silver and gold

**World 6: The Crystal Heights**
Phonics tier: R-controlled vowels, advanced patterns
Environment: High mountain crystal formations, rare and beautiful
Emotional tone: Achievement, precision, the feeling of mastery
Character: Elder Crix (an ancient crystalline being who speaks in patterns)
Visual theme: Crystalline whites and sharp gold, thin air, vast views

**World 7: The Story Shores**
Phonics tier: Comprehension, fluency, advanced morphology
Environment: A coastal world where stories wash in with the tide
Emotional tone: Narrative, imaginative, the widest possible horizon
Character: Sol (a storyteller who collects tales)
Visual theme: Sandy warmth, ocean blue, story-scroll aesthetics

### Path Structure Within Each World

Each world contains **3–4 paths**. A path is a visible route through a section of the world — a forest trail, a cave passage, a bridge span. Paths correspond to skill clusters within the world's tier.

Within the Echo Caves (CVC world), paths are:

- **The Short-A Tunnel:** CVC words with short /ă/
- **The Short-E Chamber:** CVC words with short /ĕ/
- **The Short-I Grotto:** CVC words with short /ĭ/
- **The Short-O Pool:** CVC words with short /ŏ/
- **The Short-U Spring:** CVC words with short /ŭ/

Each path contains **4–6 missions**. Missions are visible as locations along the path — a crystal cluster, a cave opening, a underground waterfall, an underground garden.

### Mission Structure

A mission is the atomic unit of child-facing play. It corresponds to a set of questions targeting a specific item at a specific assessment stage.

From the child's perspective: a mission is a place with a story, an activity, a reward, and a completion state.

From the engine's perspective: a mission delivers 5–8 questions of a defined format type (introduction, practice, or mastery confirmation) for a specific phonics item, records responses, updates item state, and triggers the next adaptive decision.

Missions have:
- A name (evocative, narrative, never academic)
- A visual scene (unique illustration)
- A narrative wrapper (2–3 sentences from the world character)
- An activity type (one of the defined interaction formats)
- A completion state (the scene resolves beautifully)
- A reward (one collectible item from the world's set)
- A star rating (1–3, based on accuracy, displayed as world-appropriate icons)

### Unlock Logic (Visible to Child)

**Path unlock:** A path unlocks when the prerequisite skill cluster shows sufficient item coverage. The child sees the path as initially fogged, overgrown, or underwater — present in the world but not yet accessible. When the prerequisite is met, the obstruction clears with an animation and Rumble (or the world character) says: "Oh! The cave passage is open!"

**Mission unlock within a path:** Missions unlock sequentially. The first mission in a path is always available when the path unlocks. Subsequent missions unlock when the previous mission has been completed (any star rating). The child always has 1–2 missions available and can see 1–2 more that are almost-accessible (the fog is thinner, a light is visible through it).

**World unlock:** A world unlocks when 80% of the previous world's items have reached mastery state. The child sees the new world appear at the edge of the map — a distant glow, a new horizon — before it becomes fully accessible.

**Replay availability:** All completed missions can be replayed for higher star ratings. Replay is always available, always rewarded (with a smaller reward than the first completion), and never mandatory.

### Visual Progression Map

The world map is the child's primary navigation and progress visualization system.

**Design principles:**
- The map is a wide, illustrated scene — not a UI diagram
- Progress is shown spatially: completed missions glow warmly, available missions pulse gently, locked missions are present but softened
- The child's avatar is visible on the map, positioned at their current location
- The map scrolls (swipe to explore) but always opens centered on the child's current position
- Multiple worlds are visible on a single large map, but non-current worlds are distant and slightly atmospheric — visible, desirable, not yet fully detailed

**Map states:**
- Completed path: All missions glowing with their star ratings, path itself lit
- Current path: Active mission pulsing, completed missions lit, upcoming missions softly visible through fog
- Locked path: Environmental occlusion (fog, overgrowth, water) — no UI lock icons
- Available world: Glowing at the horizon, world character visible in silhouette
- Completed world: Rich, detailed, fully lit — a beautiful record of accomplishment

---

## 3. CVC Activity Redesign

### The Problem with Current CVC Presentation

The current CVC system presents written word choices and asks the child to read them. For a kindergartner at the beginning of their CVC journey, this is like asking someone to swim before teaching them to float. The activity is text-heavy, visually static, and provides no scaffolding for the child who cannot yet decode the written choices.

The redesign addresses this by making the activity multi-modal: the child always has an audio path (they can hear any choice), a visual path (images support meaning), and a print path (the written word). As the child progresses, the scaffolding is gradually removed — but it is always available on demand.

### Activity Type 1: Sound Finder (ACI — Introduction Level)

**Concept:** The child hears an anchor word from the world character. They must find the written choice that begins with the same sound.

**Visual design:**
The scene shows 4 illustrated cards floating in the environment. Each card shows:
- A word in large, clear type (28pt minimum)
- An illustration above the word (a small, clean, iconic image of the object)
- A speaker icon below the word

The world character is in the scene, animated, holding up or pointing toward an anchor object (the anchor word made physical — the character holds a moon, a sun, a fish).

**Interaction:**
1. Character animation plays: the character holds up the anchor object and speaks: "Which word starts like [anchor word]?"
2. Four illustrated cards appear with a gentle staggered entrance
3. Child can tap the speaker icon on any card to hear that word (TTS whole word — never isolated phoneme)
4. Child taps the card they believe is correct
5. Correct: card blooms with warm light, illustration animates briefly (the cat waves, the sun shines, the map unfolds), micro-reward releases
6. Redirect: card gently shakes, character tilts head, anchor word replays automatically

**ESL accommodations:**
- All images are universally recognizable (cat, sun, fish, map — not culturally specific objects)
- The speaker icon on each card is always available — no child is required to read without audio support
- At the earliest introduction level, the correct card and all distractors are maximally phonetically distinct

**Progression within this activity type:**
- Level 1: Image + word + speaker icon on all cards. 1 correct, 3 clearly different distractors.
- Level 2: Image + word. Speaker icon available but not prominent. 1 correct, 3 distractors including one with the same initial letter but different sound.
- Level 3: Word only. Speaker available on tap. OOS variant (3 match, find the different one).

### Activity Type 2: Echo Drop (APM — CVC Listening)

**Concept:** The world character speaks a CVC word. The child finds the written word from 4 choices. All choices share consonant frames and differ only in vowel — requiring genuine phonological discrimination.

**Visual design:**
The scene shows 4 large word cards arranged in a 2×2 grid. Cards are clean and uncluttered — word only, large type, warm card background. Above the cards, the world character is animated in a speaking pose.

A visual audio indicator plays when the character speaks — an animated sound wave or a glowing mouth — making it clear that audio is happening and drawing the child's attention to listening.

**Interaction:**
1. Character speaks the target word automatically on scene load
2. Child sees 4 word cards (all same consonant frame, different vowels: cat / cot / cut / cit)
3. Child can tap the character to replay the spoken word (no text prompt needed — the character is the replay button)
4. Child taps a card
5. Correct: warm card expansion, micro-reward, character celebration
6. Redirect: gentle shake, character says the word again, child retries

**The critical validity element:** All four choices look similar (same length, same consonant letters, same card design). The only distinguishing feature is the vowel. This defeats visual guessing strategies completely — the child must process the vowel sound to answer correctly.

**ESL accommodations:**
- No cultural vocabulary in CVC words — cat, bed, hop, mud, not culturally specific items
- Speaker tap on character is always available
- At introduction level, choices differ in two positions (cat / dog / pen / hug), making the discrimination easier before narrowing to single-vowel differences

**Adaptive use of this activity type:**
This is the primary mastery-confirmation activity for CVC. The minimal pair structure (same consonants, different vowel) is the phonics framework's MPD format. It should not appear until the child has seen the target vowel in the Sound Finder activity. The adaptive engine controls this sequencing; the child experiences it as the world naturally becoming more interesting over time.

### Activity Type 3: Picture Bridge (Image-Supported Decoding)

**Concept:** The child sees a picture. Below the picture, they see 3–4 written words. They tap the word that matches the picture. This is print-to-meaning decoding in the most concrete possible form.

**Visual design:**
A large, clear illustration occupies the top half of the activity area. The illustration is simple, iconic, and universally recognizable (a cat, a red bed, a mop, a big bug). Below the illustration, 3–4 word cards are arranged in a row.

**Interaction:**
1. Illustration appears with a gentle entrance animation
2. Character says: "Find the word for this picture."
3. Word cards appear below
4. Child can tap the illustration to hear the word spoken (important for ESL learners who may not recognize the object)
5. Child taps the matching word card
6. Correct: the illustration and word connect with a visual line of light, then merge — the word literally joins the picture. Micro-reward releases.
7. Redirect: the chosen word shakes gently, the illustration pulses to draw attention back to it

**Why this activity is important:**
Picture Bridge is the activity that most directly tests decoding — the mapping from print to meaning — rather than just phonological awareness. A child who can match "cat" to a picture of a cat has demonstrated that they decoded the word, not just recognized a sound pattern. It is also the most accessible format for ESL learners and pre-readers.

**Progression:**
- Level 1: Picture shown, choices are maximally different (cat / bus / egg / map — all very different words)
- Level 2: Choices share initial consonant (cat / cap / cup / cut)
- Level 3: Choices are minimal pairs (cat / cot — 2 choices, then 3 choices as discrimination sharpens)

### Activity Type 4: Build-a-Word (Drag/Drop Phoneme Assembly)

**Concept:** The child sees a picture and hears the word. Below the picture, a word frame shows blank spaces (one per letter). Letter tiles float in the scene. The child drags the correct tiles into the frame.

**Visual design:**
Top half: the illustration and word frame (3 blank spaces for a CVC word, each space a rounded rectangle with a warm border).

Bottom half: 6–8 letter tiles floating gently in the scene. Each tile shows one letter in large, clear type. Tiles have slight physical personality — they float up and down slightly on individual rhythms, giving the scene life.

**Interaction:**
1. Illustration appears. Character speaks the word.
2. The word frame is shown with blank spaces — children can see how many sounds the word has.
3. Letter tiles are available to drag.
4. Child drags a tile toward the frame. When it enters the correct position's zone, the frame space glows warmly.
5. Correct placement: tile snaps into position with a satisfying click-and-bounce. The tile changes color slightly — settled, placed, certain.
6. Incorrect placement: tile floats back to its starting position with a gentle drift animation. Character says the word again.
7. When all three spaces are filled correctly: the completed word glows, the illustration animates, the character celebrates, larger reward releases.

**Scaffolding at introduction level:**
The initial consonant tile is already placed in the frame (greyed out, not draggable) — the child only drags the vowel and final consonant. This reduces cognitive load for the youngest users while still requiring phoneme-level engagement.

**Why drag/drop:**
Dragging letter tiles creates physical engagement with the word's structure. The child sees — spatially and motorically — that words are made of parts. This embodied understanding of phoneme segmentation is developmentally significant and cannot be achieved through tapping alone.

**ESL note:**
The illustration tap-to-hear is critical here. A child who doesn't recognize the word "hug" in English will not know what letters to place. The audio scaffold makes the activity accessible to beginning English learners.

### Activity Type 5: Tap-the-Sound (OOS — Odd One Out)

**Concept:** 4 word cards are shown. 3 share a target sound (initial, final, or medial). One does not. The child taps the one that doesn't belong.

**Visual design:**
4 cards arranged in a 2×2 grid. Each card shows a word and (at introduction level) an image. The character is in the scene, holding a sorting basket or a similar visual metaphor for "which one is different."

**Interaction:**
1. Character says: "Three of these words start the same way. Which one is different?"
2. Cards are shown. Speaker icon available on each.
3. Child taps the card they believe doesn't belong.
4. Correct: the 3 matching cards group together with a visual pulse. The odd-one-out card spins away playfully to a "different" zone. Celebration.
5. Redirect: gentle shake. Character says one of the matching words and asks: "Which ones sound like this one?"

**Why this format:**
The OOS format defeats visual scanning strategies. All four words look similar (same card design, same format). The child cannot identify the odd one out by visual features — they must activate and compare phonemes. This is the practice-level format for initial and final sounds per the phonics framework.

---

## 4. Child Activity Screen

### Layout Philosophy

The activity screen is divided into two emotional zones that must feel integrated, not separated.

**The World Zone (top ~55% of screen):**
This is the world. The illustrated scene. The character. The environment that gives the activity meaning. This zone is never static — it breathes, reacts, and evolves.

**The Interaction Zone (bottom ~45% of screen):**
This is where the child acts. Cards, tiles, choices, drag targets. Clean, warm, generous touch targets. The interaction zone has a soft rounded top edge — it curves up into the world zone like a gentle hill, not a hard line.

These two zones are in continuous conversation. When the child answers correctly in the interaction zone, the world zone reacts. The character jumps. A flower blooms. A light appears. The world and the activity are one thing.

### Touch Zone Design

**Primary touch targets (word cards, letter tiles, illustrated choices):**
- Minimum size: 88×88pt (Apple HIG guideline for children's apps)
- Corner radius: 16pt minimum
- Internal padding: 20pt on all sides
- Touch target extends 12pt beyond visible edge (invisible extension)
- No targets within 16pt of each other (prevents accidental wrong taps)

**Secondary touch targets (speaker icon, character tap-to-replay):**
- Minimum size: 44×44pt
- Always positioned away from primary targets
- Visual distinction from primary targets (icon, not card)

**Forbidden touch zones:**
The top 20% of the screen (world zone atmospheric area) should not contain tappable elements — this area is for visual context and emotional atmosphere, not interaction. Placing interactive elements here creates accidental taps and breaks immersion.

### Animation Behavior

**On question arrival:**
The interaction zone slides up from the bottom over 280ms with an ease-out curve. Cards within the zone arrive in a staggered sequence — each card 80ms after the previous. The stagger gives the eye time to track each card individually, reducing the feeling of being overwhelmed.

**On character speech:**
The character in the world zone plays a speaking animation synchronized to the spoken prompt. The character's body language conveys the emotional content of the prompt (wondering, excited, gentle, proud) — not just mouth movement.

**On touch-acknowledge (before answer is processed):**
The touched element scales to 95% on touch-down and returns to 100% on release. This is immediate (sub-16ms) and conveys that the interface has registered the child's intent before processing the answer. This tiny response is more important than it sounds — children who tap and see no immediate response assume the tap didn't register and tap again.

**On correct answer:**
A three-part sequence, total 800ms:
1. The chosen card expands to 108% scale over 150ms (spring easing)
2. A warm gold glow radiates from the card center over 200ms
3. The micro-reward (star fragment) releases from the card and arcs to the collection indicator over 450ms

Simultaneously: character in world zone plays a reaction animation (100ms delay from correct detection — allows the child to see the card glow before the character reacts, creating a satisfying sequential acknowledgment).

**On redirect (incorrect answer):**
A two-part sequence, total 500ms:
1. The chosen card oscillates horizontally (3 cycles, 8pt amplitude, ease-out decay) over 400ms
2. The card returns to its default state with the character playing a gentle wondering animation

No color change on redirect. The card looks exactly the same as before after the redirect — just slightly wrong-feeling for a moment. This prevents the red-means-wrong psychological association and keeps all incorrect cards available for re-selection.

**On scene complete:**
The world zone expands to fill the full screen over 600ms. The interaction zone slides down and off. The scene reaches its resolved beautiful state. The character performs the session's most elaborate animation. This full-screen moment is the emotional peak of the activity.

### Reward Moments

Three tiers of reward moment, each with distinct visual and audio character:

**Tier 1 — Per-question micro-reward (0.6 seconds):**
Star fragment arcs from correct card to collection jar. Light chime. Character micro-reaction (quick head-bob or wing-flick). Subtle enough not to break flow but satisfying enough to register.

**Tier 2 — Per-streak acknowledgment (at 3 and 5 consecutive correct):**
The collection jar pulses warmly. A secondary chime harmonizes with the main chime. The character does a small celebration — bigger than the micro-reaction but still brief (0.8 seconds). The world zone brightens slightly — more light, more life.

**Tier 3 — Mission complete (8–10 seconds, full screen):**
The full scene transformation sequence. The character's peak animation. The reward item drop. The star rating reveal. This is the session's set piece — it should feel earned and genuinely delightful.

### Audio Behavior

**Auto-play:** Every question's spokenPrompt plays automatically on question arrival, after the card stagger animation completes (300ms delay — wait for cards to be visible before speaking about them).

**Replay trigger:** Tapping the character in the world zone replays the spoken prompt. Tapping a card's speaker icon (where present) plays that word. Both are always available throughout the question.

**No audio overlap:** If the child taps to replay while audio is playing, the current audio stops and replays from the beginning. No queuing. No double-play.

**Adaptive audio scaffolding:** For items flagged as inconsistent or struggling, the replay prompt plays automatically after 4 seconds of inactivity (no tap detected). This gentle automatic replay is a low-intervention scaffold that doesn't require any visible teacher-assistance signal.

**Sound levels:** Game audio (music, effects) is at a lower volume than spoken prompts by default. Spoken prompts are the most important audio signal and must never be drowned out by environmental sound.

### Image Usage Rules

Following the phonics framework's image validity guidance:

**Use images when:**
- The activity is at introduction level for any skill
- The child has been flagged as ESL
- The activity tests phonological awareness (not decoding) — images reduce language processing load and let the child focus on sound
- The word being illustrated is a concrete noun that maps to a universally recognizable object

**Remove images when:**
- The activity is at practice or mastery confirmation level
- The question is testing decoding (reading the written word) — images beside choices give away the answer without requiring print processing
- The OOS format is in use — images would create visual discrimination that bypasses phonological comparison

**Image quality standards:**
Simple, clean, iconic illustration style. Maximum 4 distinguishable elements per image. No text within images. No culturally specific settings, clothing, or references. Consistent illustration style across all images in the app.

---

## 5. Progression UX

### Stars (Mission Rating)

Each mission awards 1–3 stars based on accuracy. Stars are displayed as world-appropriate icons rather than generic yellow stars:

- Whispering Meadow: moon phases
- Echo Caves: crystal shards
- Blend Bridge: bridge bolts
- Vowel Valley: flower petals
- River of Stars: actual star reflections

**Display timing:** Stars are revealed one at a time on the mission complete screen, each with a small chime and scale-pop animation. A 300ms pause between each star. The child watches them arrive.

**Communication:** Stars are always framed positively. 1 star: "You found 1 crystal shard! Keep exploring for more." 3 stars: "Perfect! Three crystal shards!" Never: "You scored 33%." Never: a sad or empty state that communicates failure.

**Re-play stars:** A child who replays a mission and earns more stars sees the new stars replace the old ones with a satisfying upgrade animation — the existing star(s) shine, then the new ones join them.

### Unlockables

**Collectible items (mission rewards):**
One unique item per mission, per world. Items are displayed in the child's personal collection space. They serve no gameplay function beyond collection satisfaction and display. The completionist desire to collect all items in a set is a powerful long-term engagement driver.

**World cosmetics (path completion rewards):**
Completing all missions on a path unlocks a cosmetic for the child's avatar or personal space specific to that world's theme.

**Companion accessories (mastery milestones):**
Every 5 mastery milestones, the companion gains a visible new accessory or behavior. These are the highest-value cosmetic rewards and require sustained engagement across multiple sessions.

**Discovery items (exploration rewards):**
Occasional items are hidden in the world map itself — a glowing object in a corner of the illustration that the child finds by tapping while exploring the map. These are not tied to assessment performance. They reward curiosity and environmental engagement. Important: discovery items must not be necessary for any progression path — they are pure bonus.

### Companion Reactions

The companion character (different per world, but persistent across the child's experience) has three types of reactions that occur throughout a session:

**Session start:** The companion does a visible greeting animation when the child arrives. The animation scales with streak length — on day 1, a small wave; on a 7-day streak, an elaborate greeting sequence.

**Mastery milestone:** When a mastery event occurs (between sessions, on next launch), the companion reacts with their most elaborate animation — the emotional peak of their behavioral range.

**Idle reactions:** The companion occasionally reacts to the child's activity during a session without being prompted. A long streak of correct answers makes the companion increasingly animated. An extended period of incorrect answers makes the companion move closer to the child's avatar, as if offering encouragement.

These behaviors require no explicit design triggers — they respond to session data (streak length, accuracy rate) with continuous behavioral states, not discrete events.

### Streaks

Streaks track consecutive days with at least one completed mission.

**Streak display:** A flame icon on the home screen, visible from day 3. The flame grows visually through 5 stages across the first 30 days.

**Streak rewards (days):**
- Day 3: Small companion accessory
- Day 7: World decoration (seasonal change in current world)
- Day 14: Named milestone event + rare collectible
- Day 30: Permanent world decoration + unique avatar item

**Streak break:** The flame quietly disappears. No notification. No guilt-inducing message. On return: warm welcome, streak begins rebuilding. The app never punishes absence.

**Anti-manipulation principle:** The streak system is designed to reward consistent engagement, not to create anxiety about breaking streaks. Any streak mechanic that makes a child feel bad about missing a day is rejected regardless of engagement metrics.

### Level-Ups (World Transitions)

When a child completes enough of a world to unlock the next one, a **World Transition Event** occurs. This is the highest-tier progression celebration in the app.

**Sequence:**
1. The current world's completion is shown on the map — fully lit, all missions glowing
2. The world character delivers a farewell: short, warm, personal ("You did it, [Name]. The meadow is full of moonlight now. I'll always be here when you want to come back.")
3. A journey animation plays — the child's avatar is shown traveling from the completed world toward the new one (10–12 seconds, skippable)
4. The new world is revealed in full visual richness — a proper reveal, not just an unlock
5. The new world's character introduces themselves with a brief narrative
6. The child is in the new world, with its first path available

**Important:** The child can always return to completed worlds to replay missions, collect missed items, and improve star ratings. Completing a world is never goodbye — it is an expansion of available space.

### Progression Map (Session Level)

During a session, the child's position on the world map's path is shown as a simple visual position indicator — a small avatar icon on the path, moving forward as missions are completed.

This session-level progress indicator is distinct from the overall world map. It shows only the current path — a simplified, zoomed-in view of the 4–6 missions on the current path, with completed missions glowing behind and the next mission visible ahead. The child can see how far they've come in this session and how much further the current path extends.

No percentages. No "3 out of 6 missions." Just the avatar on a path, behind them light, ahead of them glow.

---

## 6. Adaptive Experience Layer

### The Design Challenge

The adaptive engine makes continuous decisions: which items to show, which formats to use, when to introduce new items, when to remediate struggling items, when to confirm mastery. These decisions, if exposed to the child, would feel algorithmic and potentially discouraging. A child who sees "remediation mode activated" has a worse experience and (research suggests) lower performance on the very items being remediated.

The design challenge is to express every adaptive decision through the world's natural language — the narrative, the visual environment, the character's behavior — so that the child experiences the adaptation as the world responding to them, not the system managing them.

### Remediation as World Behavior

**When an item needs repeated exposure (practicing stage, multiple attempts):**
The adaptive engine shows this item again. The world expresses this as: Rumble (the cave character) has found another crystal that needs help. The narrative wrapper is different — it's a new scene even if the phonological content is similar. The child experiences variety, not repetition.

**When an item is inconsistent (correct sometimes, incorrect others):**
The engine prioritizes this item and uses a simpler format (from ACI back toward VPM, or from OOS back toward ACI). The child experiences this as a slightly easier mission — one they find satisfying rather than frustrating. The character might say: "Oh, this one's a bit trickier. Take your time." This is not condescension — it normalizes variable difficulty as world character rather than system intervention.

**When an item is repeatedly failed (6+ attempts below 60% accuracy):**
The engine removes the item from the active rotation temporarily and substitutes a mastered item. The child experiences a session that feels suddenly easier — a confidence reset. The character expresses warmth and continuity: "Let's find some crystals we know first." The item is flagged for teacher attention; the child is shielded from the experience of failing at the same thing repeatedly.

### Difficulty Invisibility Through Format Control

The phonics framework defines three format levels: introduction, practice, mastery confirmation. The adaptive engine selects format based on item state. The child sees only activity type, not format level.

An introduction-level Sound Finder activity and a practice-level Sound Finder activity look identical to the child. The difference is in the distractor quality (clearly different vs. phonetically similar) and the presence of image support. The child does not know that image support has been removed because they've progressed — they simply notice (if they notice at all) that the cards look slightly different this time.

This is the key principle: **adaptive difficulty is expressed through visual design choices, not through UI labels or explicit difficulty indicators.**

### Mastery as World Building

When an item reaches mastered state (per the threshold rules: 3 of 4 correct, last correct, across 2+ sessions), the adaptive engine triggers a world building event:

In the Echo Caves, a new crystal formation appears in the cave background. It is small, warm, and permanent. The cave is visually richer than it was before. Over time, as more items are mastered, the cave becomes spectacularly beautiful — an environment that is visibly the product of the child's learning.

The child does not know that a specific mastery threshold was crossed. They see: the cave is more beautiful than yesterday. They know: something good happened. They feel: I made that happen.

This is assessment made visible as art. The world's beauty is the mastery data, expressed in a form that a 5-year-old can feel proud of.

### Review as Reunion

Spaced review (returning to mastered items for retention checks) is expressed as character encounters — Rumble has found an old friend who wants to play again. The activity format is the same but the framing is warmer: familiar, brief, celebratory rather than remedial.

A correct response on a spaced review item is treated as a slightly bigger celebration than a standard correct response — the implication being that this was a reunion, and reunions are worth celebrating. An incorrect response on a spaced review item is treated identically to any other incorrect response — gentle redirect, immediate retry.

The engine demotes the item's state accordingly (mastered → attempting if 2 incorrect within 7 days). The child experiences: "Hmm, that one needs more practice." The character might say: "That one snuck away for a bit — let's find it again." The demotion is not communicated. The continuation is.

---

## 7. MVP Vertical Slice

### Selection Rationale

The best first playable slice is the **Echo Caves, Short-A Path** — the first path of World 2.

This is not the very first world (that is the Whispering Meadow, which handles initial sounds) — it is the second world, which handles CVC. The rationale for choosing CVC rather than initial sounds as the MVP:

- CVC is the skill area with the most significant current UX weakness (text-heavy, no visual scaffolding)
- CVC missions can demonstrate all five activity types (Sound Finder, Echo Drop, Picture Bridge, Build-a-Word, Tap-the-Sound)
- The Echo Caves visual environment is distinctive and demonstrable
- The Short-A minimal pair system (cat/cot/cut/cit) is the phonics framework's most educationally rigorous format and is worth demonstrating early
- CVC is the skill level where the most current users are spending the most time

However, if the Whispering Meadow (initial sounds) is already under development per the vertical slice document, this MVP slice can be built as the second deliverable — treating the Meadow slice as Phase 1 and the Echo Caves Short-A path as Phase 2.

### Exact Scope

**World:** Echo Caves
**Path:** The Short-A Tunnel
**Missions:** 4 (one for each format level: introduction, practice, practice-OOS, mastery confirmation)
**Character:** Rumble (cave creature)
**Activity types:** Echo Drop (primary), Sound Finder (introduction mission), Tap-the-Sound (OOS mission)
**CVC items targeted:** cat, bat, map, hat, cap, ran, pan, man, can, nap

### Mission 1: "The Crystal Hum" (Introduction)

**Format:** Sound Finder (ACI), introduction level
**Activity:** Rumble has heard a humming crystal but can't find it — only the right words will make it glow. The child hears an anchor word and taps the word card that starts the same way.
**Images:** Present on all cards (introduction level)
**Distractors:** Clearly different initial sounds (cat vs. dog, sun, pig)
**Reward:** Crystal Fragment (Tier 1 collectible)

### Mission 2: "Rumble's Lost Crystals" (Practice — Echo Drop)

**Format:** APM (audio to print), practice level — minimal pairs
**Activity:** Rumble speaks a CVC word. The child must find the correct written form among 4 choices with the same consonant frame, different vowel (cat/cot/cut/cit).
**Images:** Removed (practice level)
**Scaffold:** Tapping Rumble replays the spoken word; after 4 seconds of inactivity, word replays automatically
**Reward:** Cave Moss Gem (Tier 1 collectible)

### Mission 3: "The Four Tunnel Crystals" (Practice — OOS)

**Format:** OOS (odd-one-out), practice level
**Activity:** 4 word cards shown. Three have the same short-a vowel sound. One does not (a short-u or short-o intruder). Child taps the different one.
**Images:** Removed
**Scaffold:** Rumble says one of the matching words to establish the pattern before the child must select
**Reward:** Ancient Cave Pearl (Tier 1 collectible)

### Mission 4: "Deep Crystal Mastery" (Mastery Confirmation)

**Format:** MPD (minimal pair discrimination), mastery confirmation
**Activity:** Rumble speaks a target word. Four choices all share the same consonant frame. Child must identify the correct vowel match. Two near-miss choices (correct consonants, wrong vowels). One complete non-match.
**Images:** None
**Scaffold:** Character tap-to-replay only (no auto-replay — mastery confirmation requires independent performance)
**Reward:** Heart Crystal (Tier 2 collectible — slightly rarer visual than Tier 1)

### Screen Flow

```
Home Screen (Echo Caves visible on map)
    ↓ tap world
Echo Caves World Map
    ↓ tap Short-A Tunnel path
Path view (4 missions visible on tunnel illustration)
    ↓ tap Mission 1
Mission 1 intro screen (Rumble animation, 2-sentence narrative)
    ↓ tap "Let's Go"
Activity Screen — 5 questions (Sound Finder format)
    ↓ question 5 correct
Mission 1 Complete screen (scene resolved, reward drop, star rating)
    ↓ tap "Keep Going"
Path view (Mission 2 now pulsing)
    ↓ tap Mission 2
... (repeat for missions 2–4)
    ↓ Mission 4 complete
Path Complete screen (full tunnel lit, Rumble farewell animation, path cosmetic reward)
    ↓ return to map
Echo Caves World Map (Short-A Tunnel glowing, Short-E Chamber visible through thinning fog)
```

### What This Slice Demonstrates

**To a child:** A complete, satisfying journey through one cave tunnel. 4 scenes, a companion character, a collection of 4 items, a visible world that changed as they played. Approximately 20–25 minutes of content at a typical kindergarten pace.

**To a teacher (via existing dashboard):** Accurate assessment data on 10 short-a CVC items across 4 format levels. Item-level mastery states populated for all 10 items. Inconsistency flags if applicable.

**To a product stakeholder:** All five core activity types demonstrated. The visual and audio design vocabulary established. The adaptive layer functioning (different children will encounter different mission orderings based on their item states). The reward system complete.

**To a developer:** A clear component architecture. The activity screen is the same component for all 4 missions — only the format type, question content, and scaffolding level change. The world map, path view, mission intro, activity screen, and mission complete screen are all distinct, reusable components.

### Build Priority Within the Slice

**Build first:** The activity screen component with card interaction, audio auto-play, correct/redirect feedback states, and micro-reward animation. This is the engine of the entire child experience. Everything else is wrapper.

**Build second:** The mission complete screen. The emotional payoff of a session is more important than elaborate navigation. A child who finishes a mission and sees a warm, delightful completion screen will return — even if the world map behind it is simplified.

**Build third:** The world map and path view. Navigation can be simplified in the MVP (a flat list of 4 missions presented as a path illustration) and made more elaborate in Phase 2.

**Build fourth:** The reward and collection system. Collectible items can be shown as simple illustrated cards in Phase 1 without a full collection shelf UI.

**Build last (but before ship):** Rumble's character animations and the ambient scene behavior. These are the polish that makes the world feel alive — they should not block the core interaction loop but must be present before any child user sees the product.

### What to Defer

**World map scrolling and multi-world view:** Phase 2. Phase 1 shows a single world.

**Build-a-Word drag/drop activity:** Phase 2. The drag mechanic requires careful touch implementation and is not needed for the Short-A path slice.

**Companion growth states beyond state 1:** Phase 2. Rumble at growth state 1 (small, mostly stationary, simple reactions) is sufficient for the MVP.

**All audio beyond TTS and basic sound effects:** Phase 2. Ambient music and elaborate sound design come after the core interaction is proven.

**The personal space / collection shelf:** Phase 2. Phase 1 shows a simple "your items" screen without the full Pip's Hollow interior treatment.

---

*LiteracyPath Child Learning Experience Layer v1*
*Companion documents: Whispering Meadow Vertical Slice v1, Phonics Question Model Framework v1*
*Next: Echo Caves Short-A Path detailed design*