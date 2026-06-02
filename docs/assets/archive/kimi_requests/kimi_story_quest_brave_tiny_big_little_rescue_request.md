# Meadow Pals Reading Adventure 04

## Brave and Tiny: The Big Little Rescue

Level A · Interactive Reading Adventure
Focus: problem/solution, spatial words, bravery, careful looking
Main characters: Brave, Tiny, Woolly, Clucky
Setting: Sunny Meadow Farm — big barn, stone wall, flower pot, hay bale, little stream

## Story Data

storyId: `mp_ra_a_04_brave_tiny_big_little_rescue`
title: `Brave and Tiny: The Big Little Rescue`
level: `A`
cycleFocus: `guided_reading_level_a_story_choice`
targetWords: `Brave, Tiny, big, little, up, down, in, on, pot, wall, stream, help`
highFrequencyWords: `I, am, go, to, the, see, can, we, you, is, no, yes, help`

## Character Bible for Kimi

Use the Meadow Pals picture-book style.

Art style:
Bright, friendly picture-book illustration. Bold black outlines. Flat colours. No gradients. No photorealism. Characters are round, chubby, big-eyed, expressive, and child-friendly. Level A images: large characters, simple uncluttered backgrounds, warm vivid colours.

Brave:
Bright yellow chick #FFD700. Tiny — even smaller than Tiny the mouse. No full wings yet, just tiny arm-nubs. Tiny orange beak. Enormous determined eyes. Tiny fists raised. Expression: fearless determination.

Tiny:
Very small pale brown mouse #C49A6C. Oversized round ears. Big black eyes. Small pink nose. Big smile. Confident, cheerful, unbothered by size.

Woolly:
White sheep. Huge cloud of fluffy white wool #F0F0F0 with soft grey shadows. Tiny face framed by wool puffs. Wide slightly startled blue eyes #5B9BD5. Tiny pink nose. Anxious but kind.

Clucky:
Bright red hen #CC3300. Orange beak. Red comb. Wings often on hips. Fussy and opinionated, but helpful when needed.

Sunny Meadow Farm:
Big red barn, stone wall, terracotta flower pots, tall hay bale, little blue stream with stepping stones, flower meadow.

Image rules:

* No text inside images.
* No labels, signs, or readable writing.
* 16:9 horizontal composition.
* Consistent characters across all pages.
* WebP images.
* Keep the scale difference clear: Brave is tiny, Tiny is small, Woolly is huge and fluffy.

## Node Script

### Node p01_start

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p01_start.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p01_start.mp3`

Text:
Brave is little.
Tiny is little too.

Choice prompt:
Who do you help?

Choices:

* Help Brave → p02_brave
* Help Tiny → p02_tiny

Kimi prompt:
Brave the tiny yellow chick and Tiny the small brown mouse standing together in the sunny farmyard. A big barn, stone wall, and hay bale show how small they are. No text.

---

### Node p02_brave

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p02_brave.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p02_brave.mp3`

Text:
You are with Brave.
Brave can help.

Choice prompt:
Where should Brave go?

Choices:

* To the pot → p03_pot
* To the wall → p03_wall

Kimi prompt:
Brave with tiny fists raised, looking determined. A terracotta flower pot is one way and a grey stone wall the other way. No text.

---

### Node p02_tiny

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p02_tiny.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p02_tiny.mp3`

Text:
You are with Tiny.
Tiny sees a problem.

Choice prompt:
What does Tiny see?

Choices:

* A stuck hat → p03_hat
* A sad Woolly → p03_woolly

Kimi prompt:
Tiny standing on a small stone, looking toward a red hat stuck near a flower pot and Woolly looking worried in the distance. No text.

---

### Node p03_pot

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p03_pot.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p03_pot.mp3`

Text:
Brave went to the pot.
The pot was big.

Choice prompt:
What is in the pot?

Choices:

* A hat → p04_hat_in_pot
* Tiny → p04_tiny_in_pot

Kimi prompt:
Brave standing beside a large terracotta flower pot that towers over her. The pot has a small red hat and Tiny’s ears just visible near the rim. No text.

---

### Node p03_wall

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p03_wall.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p03_wall.mp3`

Text:
Brave went to the wall.
The wall was big.

Choice prompt:
What is on the wall?

Choices:

* A feather → p04_feather
* Clucky → p04_clucky_wall

Kimi prompt:
Brave at the base of a tall grey stone wall, looking up. A small red feather rests on top. Clucky is partly visible on the other side, confused. No text.

---

### Node p03_hat

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p03_hat.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p03_hat.mp3`

Text:
Tiny sees a hat.
The hat is stuck.

Choice prompt:
Where is it stuck?

Choices:

* In the pot → p04_hat_in_pot
* On the wall → p04_hat_on_wall

Kimi prompt:
Tiny pointing at a small red hat stuck awkwardly between the flower pot and the stone wall. The hat is reachable only by a tiny helper. No text.

---

### Node p03_woolly

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p03_woolly.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p03_woolly.mp3`

Text:
Woolly is sad.
"My bell is gone."

Choice prompt:
Where should they look?

Choices:

* Under the wool → p04_under_wool
* By the stream → p04_stream

Kimi prompt:
Woolly the huge fluffy sheep looking anxious and sad, tiny face peeking from wool. Tiny stands beside her, looking up kindly. No text.

---

### Node p04_hat_in_pot

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p04_hat_in_pot.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p04_hat_in_pot.mp3`

Text:
The hat is in the pot.
Brave jumps in.

Choice prompt:
What happens?

Choices:

* Brave finds it → p05_hat_found
* Brave gets stuck → p05_brave_stuck

Kimi prompt:
Brave leaping into the large terracotta flower pot with heroic determination. A small red hat is inside. Tiny watches from outside. No text.

---

### Node p04_tiny_in_pot

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p04_tiny_in_pot.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p04_tiny_in_pot.mp3`

Text:
Tiny is in the pot.
Tiny can fit.

Choice prompt:
What does Tiny find?

Choices:

* A hat → p05_hat_found
* A bell → p05_bell_found

Kimi prompt:
Tiny sitting comfortably inside the flower pot with ears poking out, smiling. Brave peers over the edge. A small red hat and tiny bell are visible inside. No text.

---

### Node p04_feather

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p04_feather.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p04_feather.mp3`

Text:
It is a feather.
It is not the hat.

Choice prompt:
Who lost it?

Choices:

* Clucky → p04_clucky_wall
* Brave → p05_feather_brave

Kimi prompt:
Brave holding a small red feather, looking puzzled but determined. The stone wall is behind her. No text.

---

### Node p04_clucky_wall

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p04_clucky_wall.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p04_clucky_wall.mp3`

Text:
Clucky is on the wall.
Clucky is cross.

Choice prompt:
What does Clucky need?

Choices:

* Her hat → p04_hat_on_wall
* Her feather → p05_feather_back

Kimi prompt:
Clucky perched awkwardly on the stone wall, wings on hips, looking fussy and annoyed. Brave stands below, tiny but determined. No text.

---

### Node p04_hat_on_wall

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p04_hat_on_wall.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p04_hat_on_wall.mp3`

Text:
The hat is on the wall.
It is too high.

Choice prompt:
Who can get it?

Choices:

* Tiny → p05_tiny_climbs
* Brave → p05_brave_climbs

Kimi prompt:
A small red hat sits on top of the stone wall. Tiny and Brave stand below looking up. The wall is very tall for them. No text.

---

### Node p04_under_wool

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p04_under_wool.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p04_under_wool.mp3`

Text:
Tiny looks in the wool.
It is very fluffy.

Choice prompt:
What is in there?

Choices:

* The bell → p05_bell_found
* Brave → p05_brave_in_wool

Kimi prompt:
Tiny carefully searching in Woolly’s huge fluffy wool, almost disappearing into it. Woolly looks nervous but hopeful. No text.

---

### Node p04_stream

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p04_stream.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p04_stream.mp3`

Text:
They go to the stream.
The stream is little.

Choice prompt:
What is by the stream?

Choices:

* The bell → p05_bell_stream
* A hat → p03_hat

Kimi prompt:
Tiny and Brave by a little blue stream with stepping stones. A tiny bell glints near a stone, and a red hat is farther away. No text.

---

### Node p05_hat_found

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_hat_found.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_hat_found.mp3`

Text:
They found the hat.
Clucky can have it.

Choice prompt:
Take it to Clucky?

Choices:

* Yes → p07_clucky_happy
* Wait → p06_hat_on_brave

Kimi prompt:
Tiny and Brave proudly holding the small red hat together. Clucky is visible in the background, watching. No text.

---

### Node p06_hat_on_brave

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p06_hat_on_brave.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_hat_on_brave.mp3`

Text:
The hat is on Brave.
Brave feels big.

Choice prompt:
Who gets the hat?

Choices:

* Clucky → p07_clucky_happy
* Brave → p09_fancy_brave_ending

Kimi prompt:
Brave wearing Clucky's red hat, looking proud and much bigger than she is. Tiny looks up at Brave with a warm smile. Clucky waits in the background. No text.

---

### Node p05_brave_stuck

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_brave_stuck.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_brave_stuck.mp3`

Text:
Brave is in the pot.
Brave is stuck.

Choice prompt:
Who helps?

Choices:

* Tiny → p06_tiny_helps
* Woolly → p06_woolly_helps

Kimi prompt:
Brave stuck inside the flower pot, only her head and tiny fists visible. She still looks determined, not scared. Tiny stands beside the pot. No text.

---

### Node p05_bell_found

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_bell_found.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_bell_found.mp3`

Text:
They found the bell.
Woolly can have it.

Choice prompt:
Take it to Woolly?

Choices:

* Yes → p07_woolly_happy
* Ring it first → p06_bell_ring

Kimi prompt:
Tiny and Brave holding a small shiny bell. Woolly waits nearby with wide anxious eyes. No text.

---

### Node p05_feather_brave

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_feather_brave.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_feather_brave.mp3`

Text:
Brave has a feather.
Brave looks fancy.

Choice prompt:
Keep it?

Choices:

* Yes → p09_fancy_brave_ending
* Give it back → p05_feather_back

Kimi prompt:
Brave wearing or holding the red feather proudly like a tiny hero cape or hat decoration. Tiny smiles. No text.

---

### Node p05_feather_back

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_feather_back.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_feather_back.mp3`

Text:
Clucky gets the feather.
Clucky is pleased.

Choice prompt:
What is still missing?

Choices:

* The hat → p04_hat_on_wall
* The bell → p04_under_wool

Kimi prompt:
Brave giving the small feather back to Clucky, who looks pleased but still fussy. Tiny watches. No text.

---

### Node p05_tiny_climbs

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_tiny_climbs.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_tiny_climbs.mp3`

Text:
Tiny climbs up.
Tiny is very good at small.

Choice prompt:
Can Tiny reach it?

Choices:

* Yes → p05_hat_found
* Not yet → p06_brave_boost

Kimi prompt:
Tiny climbing carefully up small gaps in the stone wall, smiling with confidence. Brave watches from below, cheering with tiny fists raised. No text.

---

### Node p05_brave_climbs

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_brave_climbs.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_brave_climbs.mp3`

Text:
Brave climbs up.
Brave is very brave.

Choice prompt:
What happens?

Choices:

* Brave slips → p06_brave_slips
* Tiny helps → p06_brave_boost

Kimi prompt:
Brave climbing the tall stone wall with fierce determination, tiny fists gripping stones. She is very small compared to the wall. No text.

---

### Node p05_brave_in_wool

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_brave_in_wool.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_brave_in_wool.mp3`

Text:
Brave is in the wool.
Only her feet show.

Choice prompt:
Pull Brave out?

Choices:

* Yes → p06_tiny_helps
* Wait → p06_woolly_laughs

Kimi prompt:
Brave almost completely buried in Woolly’s fluffy white wool, only tiny yellow feet visible. Tiny looks amused and ready to help. Woolly looks worried. No text.

---

### Node p05_bell_stream

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p05_bell_stream.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p05_bell_stream.mp3`

Text:
The bell is by the stream.
Tiny can get it.

Choice prompt:
Get the bell?

Choices:

* Yes → p05_bell_found
* Ask Brave → p06_brave_stream

Kimi prompt:
The small bell resting beside a blue stream stone. Tiny reaches for it easily. Brave stands nearby looking ready for action. No text.

---

### Node p06_tiny_helps

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p06_tiny_helps.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_tiny_helps.mp3`

Text:
Tiny helped Brave.
Brave got out.

Choice prompt:
What did they find?

Choices:

* The hat → p05_hat_found
* The bell → p05_bell_found

Kimi prompt:
Tiny pulling Brave out of the flower pot or wool with gentle teamwork. Brave pops free, still determined. No text.

---

### Node p06_woolly_helps

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p06_woolly_helps.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_woolly_helps.mp3`

Text:
Woolly helped.
The pot tipped over.

Choice prompt:
What rolled out?

Choices:

* The hat → p05_hat_found
* The bell → p05_bell_found

Kimi prompt:
Woolly carefully nudging the large flower pot over with her fluffy body. Brave tumbles safely out, and a hat and bell roll nearby. No text.

---

### Node p06_bell_ring

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p06_bell_ring.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_bell_ring.mp3`

Text:
Ring, ring!
Woolly jumped.

Choice prompt:
Say sorry?

Choices:

* Yes → p07_woolly_happy
* Ring again → p09_loud_bell_ending

Kimi prompt:
Brave ringing the tiny bell proudly while Woolly jumps in surprise, wool puffing up. Tiny looks amused. No text.

---

### Node p06_brave_boost

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p06_brave_boost.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_brave_boost.mp3`

Text:
Tiny gave Brave a boost.
Up, up, up!

Choice prompt:
What do they get?

Choices:

* The hat → p05_hat_found
* The feather → p05_feather_back

Kimi prompt:
Tiny standing below and boosting Brave upward toward the top of the stone wall. Brave reaches high with a determined face. No text.

---

### Node p06_brave_slips

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p06_brave_slips.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_brave_slips.mp3`

Text:
Brave slipped down.
Plop.

Choice prompt:
Try again?

Choices:

* Yes → p06_brave_boost
* Ask Tiny → p05_tiny_climbs

Kimi prompt:
Brave sliding gently down the stone wall into a soft patch of grass, looking surprised but still determined. Tiny watches kindly. No text.

---

### Node p06_woolly_laughs

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p06_woolly_laughs.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_woolly_laughs.mp3`

Text:
Woolly giggled.
Brave popped out.

Choice prompt:
What popped out too?

Choices:

* The bell → p05_bell_found
* The hat → p05_hat_found

Kimi prompt:
Woolly giggling softly as Brave pops out of her fluffy wool, with a tiny bell and red hat popping out too. Tiny laughs. No text.

---

### Node p06_brave_stream

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p06_brave_stream.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_brave_stream.mp3`

Text:
Brave jumped in.
Splash!

Choice prompt:
Did Brave get the bell?

Choices:

* Yes → p05_bell_found
* No → p06_tiny_helps

Kimi prompt:
Brave jumping heroically into the shallow stream with a small splash, reaching for the bell. Tiny watches from the bank, smiling. No text.

---

### Node p07_clucky_happy

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p07_clucky_happy.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p07_clucky_happy.mp3`

Text:
Clucky got her hat.
Clucky stood tall.

Choice prompt:
What now?

Choices:

* Help Woolly → p03_woolly
* Finish → p09_helpful_ending

Kimi prompt:
Clucky standing tall and proud wearing her red hat again. Brave and Tiny stand below her looking pleased. No text.

---

### Node p07_woolly_happy

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p07_woolly_happy.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p07_woolly_happy.mp3`

Text:
Woolly got her bell.
Woolly smiled.

Choice prompt:
What now?

Choices:

* Help Clucky → p03_hat
* Finish → p09_helpful_ending

Kimi prompt:
Woolly smiling gently with her small bell returned around her neck or beside her. Tiny and Brave look proud. No text.

---

### Node p09_fancy_brave_ending

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p09_fancy_brave_ending.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p09_fancy_brave_ending.mp3`

Text:
Brave kept the feather.
Brave felt big.

Choice prompt:
Read again?

Choices:

* Read again → p01_start
* Finish → end

Kimi prompt:
Brave wearing the little red feather proudly, looking heroic and larger than life despite being tiny. Tiny smiles beside her. No text.

---

### Node p09_loud_bell_ending

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p09_loud_bell_ending.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p09_loud_bell_ending.mp3`

Text:
Ring, ring, ring!
Oh, Brave!

Choice prompt:
Read again?

Choices:

* Read again → p01_start
* Finish → end

Kimi prompt:
Brave ringing the little bell again and again with huge enthusiasm. Woolly jumps, Clucky flaps, Tiny laughs. Funny noisy ending. No text.

---

### Node p09_helpful_ending

Image: `/images/story-quests/meadow-pals/brave-tiny-rescue/p09_helpful_ending.webp`
Audio: `/audio/story-quests/meadow-pals/brave-tiny-rescue/p09_helpful_ending.mp3`

Text:
Tiny helped.
Brave helped.
Little can help big.

Choice prompt:
Read again?

Choices:

* Read again → p01_start
* Finish → end

Kimi prompt:
Tiny and Brave standing proudly together in the farmyard while Woolly and Clucky smile down at them. Clear warm ending showing little characters helping bigger friends. No text.

---

## Audio Request

Create one MP3 per node using the exact node text only. Warm adult teacher voice. Clear Level A pacing. No music. No sound effects. No extra words. File names must match audio paths exactly.

Include this bridge-node audio as well:

- `/audio/story-quests/meadow-pals/brave-tiny-rescue/p06_hat_on_brave.mp3`: "The hat is on Brave. Brave feels big."
