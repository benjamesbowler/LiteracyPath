# Kimi Digraphs Media Request

Generate the replacement media pack for LiteracyPath Digraphs assessment questions.

## Output Folders

- Images: `public/images/assessment/digraphs/{word}.webp`
- Audio: `public/audio/assessment/digraphs/{word}.mp3`

## Image Rules

- 4:3 landscape WebP.
- Bright, child-safe K-2 literacy assessment style.
- Show the target object/action clearly.
- No printed words, letters, captions, signs, labels, speech bubbles, UI, or readable text.
- Simple background, warm natural colors, clear focus.

## Audio Rules

- MP3.
- Clear adult voice.
- Say only the target word.
- No article, sentence, sound effects, music, or extra silence.

## Image Requests

| Digraph | Word | Output path | Visual description |
|---|---|---|---|
| ch | chair | `/images/assessment/digraphs/chair.webp` | a chair beside a small table |
| ch | cheese | `/images/assessment/digraphs/cheese.webp` | a piece of cheese on a plate |
| ch | chick | `/images/assessment/digraphs/chick.webp` | a fluffy chick standing in soft grass |
| ch | chip | `/images/assessment/digraphs/chip.webp` | a single snack chip in a small bowl |
| ch | cherry | `/images/assessment/digraphs/cherry.webp` | two cherries with stems |
| ch | chain | `/images/assessment/digraphs/chain.webp` | a short chain on a table |
| ch | bench | `/images/assessment/digraphs/bench.webp` | a park bench under a tree |
| ch | beach | `/images/assessment/digraphs/beach.webp` | a clean beach with sand and water |
| ch | lunch | `/images/assessment/digraphs/lunch.webp` | a lunch box with healthy food |
| ch | watch | `/images/assessment/digraphs/watch.webp` | a wristwatch on a table |
| sh | ship | `/images/assessment/digraphs/ship.webp` | a toy ship floating in water |
| sh | sheep | `/images/assessment/digraphs/sheep.webp` | a sheep standing in a field |
| sh | shell | `/images/assessment/digraphs/shell.webp` | a seashell on sand |
| sh | shark | `/images/assessment/digraphs/shark.webp` | a friendly cartoon shark swimming in blue water |
| sh | shoe | `/images/assessment/digraphs/shoe.webp` | one shoe on a mat |
| sh | shirt | `/images/assessment/digraphs/shirt.webp` | a plain shirt hanging on a hook |
| sh | brush | `/images/assessment/digraphs/brush.webp` | a hairbrush on a dresser |
| sh | dish | `/images/assessment/digraphs/dish.webp` | a clean dish on a table |
| sh | fish | `/images/assessment/digraphs/fish.webp` | a fish swimming in a bowl |
| sh | wish | `/images/assessment/digraphs/wish.webp` | a child blowing out birthday candles with no writing |
| th | thumb | `/images/assessment/digraphs/thumb.webp` | a child giving a thumbs-up |
| th | three | `/images/assessment/digraphs/three.webp` | three toy blocks grouped together |
| th | thorn | `/images/assessment/digraphs/thorn.webp` | a thorn on a rose stem, shown safely |
| th | thread | `/images/assessment/digraphs/thread.webp` | a spool of thread beside a needle, shown safely |
| th | thimble | `/images/assessment/digraphs/thimble.webp` | a thimble on a sewing table |
| th | thunder | `/images/assessment/digraphs/thunder.webp` | storm clouds with lightning far away |
| th | bath | `/images/assessment/digraphs/bath.webp` | a bathtub with bubbles |
| th | moth | `/images/assessment/digraphs/moth.webp` | a moth resting on a leaf |
| th | tooth | `/images/assessment/digraphs/tooth.webp` | a clean tooth model beside a toothbrush |
| th | cloth | `/images/assessment/digraphs/cloth.webp` | a folded cleaning cloth on a table |
| wh | whale | `/images/assessment/digraphs/whale.webp` | a whale swimming in the ocean |
| wh | wheel | `/images/assessment/digraphs/wheel.webp` | a wheel leaning against a wall |
| wh | whistle | `/images/assessment/digraphs/whistle.webp` | a whistle on a lanyard |
| wh | whisk | `/images/assessment/digraphs/whisk.webp` | a kitchen whisk in a mixing bowl |
| wh | wheat | `/images/assessment/digraphs/wheat.webp` | stalks of wheat in a field |
| wh | whisker | `/images/assessment/digraphs/whisker.webp` | a close view of a cat's whiskers |
| wh | wheelbarrow | `/images/assessment/digraphs/wheelbarrow.webp` | a wheelbarrow in a garden |
| wh | white | `/images/assessment/digraphs/white.webp` | a white crayon beside white paper |
| wh | whirlpool | `/images/assessment/digraphs/whirlpool.webp` | a safe swirling water pattern in a sink |
| wh | wharf | `/images/assessment/digraphs/wharf.webp` | a wooden wharf by calm water |
| ph | phone | `/images/assessment/digraphs/phone.webp` | a simple phone on a table |
| ph | photo | `/images/assessment/digraphs/photo.webp` | a blank photo frame on a shelf |
| ph | dolphin | `/images/assessment/digraphs/dolphin.webp` | a dolphin jumping out of water |
| ph | elephant | `/images/assessment/digraphs/elephant.webp` | an elephant standing in grass |
| ph | trophy | `/images/assessment/digraphs/trophy.webp` | a trophy cup with no writing |
| ph | graph | `/images/assessment/digraphs/graph.webp` | a simple bar graph with no numbers or letters |
| ph | sphere | `/images/assessment/digraphs/sphere.webp` | a smooth ball-shaped sphere on a table |
| ph | headphones | `/images/assessment/digraphs/headphones.webp` | headphones on a desk |
| ph | microphone | `/images/assessment/digraphs/microphone.webp` | a microphone on a stand |
| ph | pheasant | `/images/assessment/digraphs/pheasant.webp` | a pheasant standing in grass |
| ck | duck | `/images/assessment/digraphs/duck.webp` | a duck swimming in a pond |
| ck | clock | `/images/assessment/digraphs/clock.webp` | a round classroom clock with no numbers |
| ck | sock | `/images/assessment/digraphs/sock.webp` | one sock on a laundry basket |
| ck | rock | `/images/assessment/digraphs/rock.webp` | a smooth rock on the ground |
| ck | truck | `/images/assessment/digraphs/truck.webp` | a toy truck on a rug |
| ck | block | `/images/assessment/digraphs/block.webp` | a toy block on a rug |
| ck | brick | `/images/assessment/digraphs/brick.webp` | a single brick on the ground |
| ck | stick | `/images/assessment/digraphs/stick.webp` | a stick lying on grass |
| ck | lock | `/images/assessment/digraphs/lock.webp` | a padlock on a table |
| ck | neck | `/images/assessment/digraphs/neck.webp` | a child wearing a scarf around the neck |

## Audio Requests

Create one MP3 per word at the matching path below. The script is exactly the word.

| Digraph | Word | Output path |
|---|---|---|
| ch | chair | `/audio/assessment/digraphs/chair.mp3` |
| ch | cheese | `/audio/assessment/digraphs/cheese.mp3` |
| ch | chick | `/audio/assessment/digraphs/chick.mp3` |
| ch | chip | `/audio/assessment/digraphs/chip.mp3` |
| ch | cherry | `/audio/assessment/digraphs/cherry.mp3` |
| ch | chain | `/audio/assessment/digraphs/chain.mp3` |
| ch | bench | `/audio/assessment/digraphs/bench.mp3` |
| ch | beach | `/audio/assessment/digraphs/beach.mp3` |
| ch | lunch | `/audio/assessment/digraphs/lunch.mp3` |
| ch | watch | `/audio/assessment/digraphs/watch.mp3` |
| sh | ship | `/audio/assessment/digraphs/ship.mp3` |
| sh | sheep | `/audio/assessment/digraphs/sheep.mp3` |
| sh | shell | `/audio/assessment/digraphs/shell.mp3` |
| sh | shark | `/audio/assessment/digraphs/shark.mp3` |
| sh | shoe | `/audio/assessment/digraphs/shoe.mp3` |
| sh | shirt | `/audio/assessment/digraphs/shirt.mp3` |
| sh | brush | `/audio/assessment/digraphs/brush.mp3` |
| sh | dish | `/audio/assessment/digraphs/dish.mp3` |
| sh | fish | `/audio/assessment/digraphs/fish.mp3` |
| sh | wish | `/audio/assessment/digraphs/wish.mp3` |
| th | thumb | `/audio/assessment/digraphs/thumb.mp3` |
| th | three | `/audio/assessment/digraphs/three.mp3` |
| th | thorn | `/audio/assessment/digraphs/thorn.mp3` |
| th | thread | `/audio/assessment/digraphs/thread.mp3` |
| th | thimble | `/audio/assessment/digraphs/thimble.mp3` |
| th | thunder | `/audio/assessment/digraphs/thunder.mp3` |
| th | bath | `/audio/assessment/digraphs/bath.mp3` |
| th | moth | `/audio/assessment/digraphs/moth.mp3` |
| th | tooth | `/audio/assessment/digraphs/tooth.mp3` |
| th | cloth | `/audio/assessment/digraphs/cloth.mp3` |
| wh | whale | `/audio/assessment/digraphs/whale.mp3` |
| wh | wheel | `/audio/assessment/digraphs/wheel.mp3` |
| wh | whistle | `/audio/assessment/digraphs/whistle.mp3` |
| wh | whisk | `/audio/assessment/digraphs/whisk.mp3` |
| wh | wheat | `/audio/assessment/digraphs/wheat.mp3` |
| wh | whisker | `/audio/assessment/digraphs/whisker.mp3` |
| wh | wheelbarrow | `/audio/assessment/digraphs/wheelbarrow.mp3` |
| wh | white | `/audio/assessment/digraphs/white.mp3` |
| wh | whirlpool | `/audio/assessment/digraphs/whirlpool.mp3` |
| wh | wharf | `/audio/assessment/digraphs/wharf.mp3` |
| ph | phone | `/audio/assessment/digraphs/phone.mp3` |
| ph | photo | `/audio/assessment/digraphs/photo.mp3` |
| ph | dolphin | `/audio/assessment/digraphs/dolphin.mp3` |
| ph | elephant | `/audio/assessment/digraphs/elephant.mp3` |
| ph | trophy | `/audio/assessment/digraphs/trophy.mp3` |
| ph | graph | `/audio/assessment/digraphs/graph.mp3` |
| ph | sphere | `/audio/assessment/digraphs/sphere.mp3` |
| ph | headphones | `/audio/assessment/digraphs/headphones.mp3` |
| ph | microphone | `/audio/assessment/digraphs/microphone.mp3` |
| ph | pheasant | `/audio/assessment/digraphs/pheasant.mp3` |
| ck | duck | `/audio/assessment/digraphs/duck.mp3` |
| ck | clock | `/audio/assessment/digraphs/clock.mp3` |
| ck | sock | `/audio/assessment/digraphs/sock.mp3` |
| ck | rock | `/audio/assessment/digraphs/rock.mp3` |
| ck | truck | `/audio/assessment/digraphs/truck.mp3` |
| ck | block | `/audio/assessment/digraphs/block.mp3` |
| ck | brick | `/audio/assessment/digraphs/brick.mp3` |
| ck | stick | `/audio/assessment/digraphs/stick.mp3` |
| ck | lock | `/audio/assessment/digraphs/lock.mp3` |
| ck | neck | `/audio/assessment/digraphs/neck.mp3` |
