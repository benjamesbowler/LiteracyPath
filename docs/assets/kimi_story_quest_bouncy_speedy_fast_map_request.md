# Meadow Pals Reading Adventure 03

## Bouncy and Speedy: The Very Fast Map

Level A · Interactive Reading Adventure
Focus: sequence, map reading, location choices, prediction
Main characters: Bouncy, Speedy, Tiny, Grumpy
Setting: Sunny Meadow Farm — farmyard, barn, duck pond, big hill, big oak tree

## Story Data

storyId: `mp_ra_a_03_bouncy_speedy_fast_map`
title: `Bouncy and Speedy: The Very Fast Map`
level: `A`
cycleFocus: `guided_reading_level_a_story_choice`
targetWords: `Bouncy, Speedy, map, run, hop, barn, pond, hill, tree, fast, stop`
highFrequencyWords: `I, am, go, to, the, see, can, we, you, is, no, yes`

## Character Bible for Kimi

Use the Meadow Pals picture-book style.

Art style:
Bright, friendly picture-book illustration. Bold black outlines. Flat colours. No gradients. No photorealism. Characters are round, chubby, big-eyed, highly expressive, and child-friendly. Level A images: large characters, simple uncluttered backgrounds, warm vivid colours.

Bouncy:
Pale yellow lamb #FFE566. Fluffy wool. Small floppy ears. Coil-spring legs. Usually mid-hop, feet off ground, yellow stars or motion marks around head. Expression: irrepressible glee.

Speedy:
Black-and-white sheepdog puppy. Black body #1A1A1A, white chest and paws #F5F5F5, white face with black ears. Tongue out, panting. Motion-blur lines behind body. Tail a blur. Expression: enthusiastic and breathless.

Tiny:
Very small pale brown mouse #C49A6C. Oversized round ears. Big black eyes. Small pink nose. Big smile. Far smaller than other characters. Confident and cheerful.

Grumpy:
Dark brown goat #6B4C2A. White scraggly beard. Short curved horns. Heavy-lidded eyes. Downturned mouth. Hooves often crossed. Grumpy but not unkind.

Sunny Meadow Farm:
Big red barn #CC2200 with white trim, duck pond #87CEEB, rolling green hills #A8D86E, big oak tree on the hill, flower meadow, farmyard paths.

Image rules:

* No text inside images.
* No letters, labels, maps with readable writing, or speech bubbles inside images.
* 16:9 horizontal composition.
* Consistent characters across all pages.
* WebP images.
* Simple Level A backgrounds.

## Node Script

### Node p01_start

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p01_start.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p01_start.mp3`

Text:
Bouncy has a map.
Speedy wants to go.

Choice prompt:
Who do you help?

Choices:

* Help Bouncy → p02_bouncy
* Help Speedy → p02_speedy

Kimi prompt:
Bouncy the yellow lamb holding a simple folded map with no readable text, standing beside Speedy the black-and-white puppy in the sunny farmyard. Bouncy is bouncing slightly. Speedy is ready to run. Big red barn behind them. No text.

---

### Node p02_bouncy

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p02_bouncy.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p02_bouncy.mp3`

Text:
You are with Bouncy.
Bouncy hops with the map.

Choice prompt:
Where does Bouncy hop?

Choices:

* To the barn → p03_barn
* To the pond → p03_pond

Kimi prompt:
Bouncy hopping with a folded map in her mouth or hoof, coil-spring legs extended, looking delighted. The barn is visible one way and pond the other way. No text.

---

### Node p02_speedy

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p02_speedy.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p02_speedy.mp3`

Text:
You are with Speedy.
Speedy runs fast.

Choice prompt:
Where does Speedy run?

Choices:

* To the barn → p03_barn_fast
* To the hill → p03_hill_fast

Kimi prompt:
Speedy racing through the farmyard with motion lines, tongue out, map flapping behind her. Barn and hill visible as possible directions. No text.

---

### Node p03_barn

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p03_barn.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p03_barn.mp3`

Text:
Bouncy hops to the barn.
Hop, hop, hop.

Choice prompt:
What is by the barn?

Choices:

* A boot → p04_boot
* Tiny → p04_tiny_map

Kimi prompt:
Bouncy by the big red barn, looking at a muddy boot near the door and Tiny the very small mouse standing nearby. Bouncy looks excited. No text.

---

### Node p03_barn_fast

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p03_barn_fast.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p03_barn_fast.mp3`

Text:
Speedy runs to the barn.
The map flies up.

Choice prompt:
What do you catch?

Choices:

* The map → p04_map_caught
* The boot → p04_boot

Kimi prompt:
Speedy skidding near the big red barn as the folded map flies up in the air. A muddy boot sits nearby. Motion lines everywhere. No text.

---

### Node p03_pond

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p03_pond.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p03_pond.mp3`

Text:
Bouncy hops to the pond.
The map gets wet.

Choice prompt:
What should Bouncy do?

Choices:

* Shake the map → p04_map_splash
* Ask Splashy → p04_splashy_help

Kimi prompt:
Bouncy at the duck pond holding a damp folded map, looking surprised. Water drips from the map. The pond has reeds and lily pads. No text.

---

### Node p03_hill_fast

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p03_hill_fast.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p03_hill_fast.mp3`

Text:
Speedy runs to the hill.
Very, very fast.

Choice prompt:
Can Speedy stop?

Choices:

* Stop now → p04_speedy_stops
* Keep going → p04_too_fast

Kimi prompt:
Speedy racing up the big green hill toward the oak tree, motion blur trailing behind her, eyes excited. The farm is below. No text.

---

### Node p04_boot

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p04_boot.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p04_boot.mp3`

Text:
It is a boot.
It is not the map.

Choice prompt:
Who can help?

Choices:

* Tiny → p04_tiny_map
* Grumpy → p05_grumpy_boot

Kimi prompt:
Bouncy and Speedy staring at a muddy boot. The folded map is not visible. Tiny is tiny in the distance. Grumpy is near the barn with crossed hooves. No text.

---

### Node p04_map_caught

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p04_map_caught.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p04_map_caught.mp3`

Text:
You caught the map.
Speedy did not stop.

Choice prompt:
Where does Speedy go?

Choices:

* To the pond → p03_pond
* To the hill → p03_hill_fast

Kimi prompt:
The map safely caught in the foreground while Speedy continues running away as a black-and-white blur. Bouncy watches with wide eyes. No text.

---

### Node p04_tiny_map

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p04_tiny_map.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p04_tiny_map.mp3`

Text:
Tiny sees the map.
Tiny points up.

Choice prompt:
Where should they go?

Choices:

* To the big tree → p05_big_tree
* To the pond → p03_pond

Kimi prompt:
Tiny the tiny brown mouse standing on a small stone, pointing up toward the big oak tree on the hill. Bouncy and Speedy lean down to listen. No text.

---

### Node p04_map_splash

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p04_map_splash.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p04_map_splash.mp3`

Text:
Bouncy shook the map.
Splash!

Choice prompt:
Who got wet?

Choices:

* Bouncy → p05_bouncy_wet
* Grumpy → p05_grumpy_wet

Kimi prompt:
Bouncy shaking the wet map beside the pond. Water sprays in a wide arc. Bouncy is laughing. Grumpy is nearby in danger of being splashed. No text.

---

### Node p04_splashy_help

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p04_splashy_help.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p04_splashy_help.mp3`

Text:
Splashy helps.
Splashy likes wet maps.

Choice prompt:
Where does the map point?

Choices:

* To the tree → p05_big_tree
* To the mud → p05_muddy_map

Kimi prompt:
Splashy the yellow duckling happily holding the wet map near the pond, delighted by it. Bouncy and Speedy watch. No text.

---

### Node p04_speedy_stops

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p04_speedy_stops.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p04_speedy_stops.mp3`

Text:
Speedy stopped.
Bouncy hopped past.

Choice prompt:
Follow Bouncy?

Choices:

* Yes → p05_big_tree
* No → p05_speedy_waits

Kimi prompt:
Speedy stopped on the hillside, panting. Bouncy hops past her up toward the big oak tree, cheerful and unstoppable. No text.

---

### Node p04_too_fast

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p04_too_fast.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p04_too_fast.mp3`

Text:
Speedy went too fast.
The map went too.

Choice prompt:
Where did it land?

Choices:

* In the tree → p05_big_tree
* In the mud → p05_muddy_map

Kimi prompt:
Speedy racing too fast down the hill while the folded map flies from her mouth toward either the big oak tree or muddy pigpen. Comic motion blur. No text.

---

### Node p05_grumpy_boot

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p05_grumpy_boot.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p05_grumpy_boot.mp3`

Text:
Grumpy sees the boot.
"That is my boot."

Choice prompt:
Does Grumpy help?

Choices:

* Yes → p05_big_tree
* No → p06_lost_again

Kimi prompt:
Grumpy with crossed hooves looking at the muddy boot, recognizing it. Bouncy and Speedy wait hopefully. No text.

---

### Node p05_bouncy_wet

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p05_bouncy_wet.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p05_bouncy_wet.mp3`

Text:
Bouncy is wet.
Bouncy still hops.

Choice prompt:
Hop where?

Choices:

* To the tree → p05_big_tree
* To the barn → p03_barn

Kimi prompt:
Bouncy soaking wet but still hopping happily, droplets flying with each hop. Speedy looks amused. No text.

---

### Node p05_grumpy_wet

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p05_grumpy_wet.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p05_grumpy_wet.mp3`

Text:
Grumpy is wet.
Grumpy is not happy.

Choice prompt:
Run?

Choices:

* Yes → p06_lost_again
* No → p05_big_tree

Kimi prompt:
Grumpy dripping wet with an enormous scowl, beard dripping. Bouncy and Speedy look sheepish. No text.

---

### Node p05_speedy_waits

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p05_speedy_waits.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p05_speedy_waits.mp3`

Text:
Speedy waits.
That is new.

Choice prompt:
Who comes back?

Choices:

* Bouncy → p05_big_tree
* Tiny → p04_tiny_map

Kimi prompt:
Speedy sitting very still on the hill, trying hard to wait, looking surprised by herself. No motion lines. No text.

---

### Node p05_muddy_map

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p05_muddy_map.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p05_muddy_map.mp3`

Text:
The map is in the mud.
Oh no.

Choice prompt:
Who gets it?

Choices:

* Bouncy → p06_bouncy_muddy
* Speedy → p06_speedy_muddy

Kimi prompt:
The folded map stuck in a brown mud puddle. Bouncy and Speedy look down at it, worried and curious. No text.

---

### Node p05_big_tree

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p05_big_tree.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p05_big_tree.mp3`

Text:
They got to the big tree.
The map says stop.

Choice prompt:
Do they stop?

Choices:

* Yes → p07_tree_stop
* No → p06_lost_again

Kimi prompt:
Bouncy, Speedy, and Tiny at the base of the big oak tree. The folded map is open but has no readable text. Everyone looks up. No text.

---

### Node p06_bouncy_muddy

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p06_bouncy_muddy.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p06_bouncy_muddy.mp3`

Text:
Bouncy got the map.
Bouncy got muddy.

Choice prompt:
Is the map okay?

Choices:

* Yes → p05_big_tree
* No → p06_lost_again

Kimi prompt:
Bouncy proudly holding a muddy map, now covered in mud splashes herself, still grinning. No text.

---

### Node p06_speedy_muddy

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p06_speedy_muddy.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p06_speedy_muddy.mp3`

Text:
Speedy got the map.
Speedy slid in mud.

Choice prompt:
Where did Speedy slide?

Choices:

* To the tree → p05_big_tree
* To Grumpy → p05_grumpy_wet

Kimi prompt:
Speedy sliding through mud while holding the map, motion lines mixed with mud streaks. Funny chaotic scene. No text.

---

### Node p06_lost_again

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p06_lost_again.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p06_lost_again.mp3`

Text:
They did not stop.
Now they are lost.

Choice prompt:
Who can help?

Choices:

* Tiny → p04_tiny_map
* The map → p05_big_tree

Kimi prompt:
Bouncy and Speedy standing in a pale green field beyond the farm, looking around confused. The farm is far behind. No text.

---

### Node p07_tree_stop

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p07_tree_stop.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p07_tree_stop.mp3`

Text:
They stopped.
They sat by the tree.

Choice prompt:
What do they see?

Choices:

* The farm → p08_farm_view
* A snack → p08_tiny_snack

Kimi prompt:
Bouncy and Speedy finally sitting calmly under the big oak tree. Tiny sits between them. Everyone looks peaceful. No text.

---

### Node p08_farm_view

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p08_farm_view.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p08_farm_view.mp3`

Text:
They see the farm.
It is very big.

Choice prompt:
Go home?

Choices:

* Yes → p09_home_ending
* One more race → p09_race_ending

Kimi prompt:
View from the big hill under the oak tree, showing the whole Sunny Meadow Farm below. Bouncy, Speedy, and Tiny look out together. No text.

---

### Node p08_tiny_snack

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p08_tiny_snack.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p08_tiny_snack.mp3`

Text:
Tiny has a snack.
It is very, very small.

Choice prompt:
Share it?

Choices:

* Yes → p09_tiny_snack_ending
* No, run home → p09_home_ending

Kimi prompt:
Tiny holding a tiny crumb-like snack proudly. Bouncy and Speedy lean down to look at the impossibly small snack. Funny scale contrast. No text.

---

### Node p09_home_ending

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p09_home_ending.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p09_home_ending.mp3`

Text:
They went home.
They did not run.
Well... not much.

Choice prompt:
Read again?

Choices:

* Read again → p01_start
* Finish → end

Kimi prompt:
Bouncy, Speedy, and Tiny walking calmly back toward the farm, but Speedy’s tail has a tiny motion blur and Bouncy is doing one small hop. Gentle funny ending. No text.

---

### Node p09_race_ending

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p09_race_ending.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p09_race_ending.mp3`

Text:
Bouncy hopped.
Speedy ran.
Oh no!

Choice prompt:
Read again?

Choices:

* Read again → p01_start
* Finish → end

Kimi prompt:
Bouncy and Speedy racing away again from the oak tree, one yellow hop blur and one black-and-white running blur. Tiny watches with an amused smile. No text.

---

### Node p09_tiny_snack_ending

Image: `/images/story-quests/meadow-pals/bouncy-speedy-map/p09_tiny_snack_ending.webp`
Audio: `/audio/story-quests/meadow-pals/bouncy-speedy-map/p09_tiny_snack_ending.mp3`

Text:
Tiny shared the snack.
It was too small.
They all laughed.

Choice prompt:
Read again?

Choices:

* Read again → p01_start
* Finish → end

Kimi prompt:
Tiny offering a comically tiny crumb snack to Bouncy and Speedy. Everyone laughs kindly under the oak tree. No text.

---

## Audio Request

Create one MP3 per node using the exact node text only. Warm adult teacher voice. Clear Level A pacing. No music. No sound effects. No extra words. File names must match audio paths exactly.
