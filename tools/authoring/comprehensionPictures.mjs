import { EXPANSION_COMPREHENSION_PICTURES } from './comprehensionExpansionPictures.mjs';
// Authoritative exact-story image authoring plans and real generation prompts.
export const COMPREHENSION_PICTURES = {
  "muddy-mat": {
    "sourceText": "Muddy sat in the mud. The sun was hot. Muddy got up and ran to a mat. The mat was in a hut. Muddy sat on it. The mat was not hot. Muddy had a nap in the hut.",
    "textSha256": "acc068c527477d85cdbc987c410364d9838290ccfb8f73828fc9a5221419f52d",
    "kind": "comic",
    "panels": [
      {
        "scene": "Muddy sits in a mud patch outdoors under the hot sun.",
        "alt": "Muddy sits in mud in the hot sun."
      },
      {
        "scene": "Muddy moves from the mud towards the open hut doorway; the mat is visibly inside.",
        "alt": "Muddy goes towards the mat in the hut."
      },
      {
        "scene": "Inside that same hut, Muddy sleeps on the mat away from the sun.",
        "alt": "Muddy naps on the mat inside the hut."
      }
    ],
    "alt": "First: Muddy sits in mud in the hot sun. Next: Muddy goes towards the mat in the hut. Last: Muddy naps on the mat inside the hut.",
    "src": "/images/comprehension/passages/muddy-mat.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Use case: illustration-story. Create the FINAL black-and-white colouring-page ESL story picture for LiteracyPath passage 'Muddy and the Mat'. Use the supplied reference ONLY for Muddy's exact face, pig ears, snout, rounded body and fixed outlined mud markings. Canon ID MEADOW-MUDDY: round small pig, no clothing, no extra limbs, four natural pig limbs. Draw one wide landscape THREE-PANEL COMIC, equal panels in one left-to-right row, clearly separated black rectangular borders and white gutters. Plain white background, strong smooth black outlines, large open colouring regions, no grey shading, no text, numbers, captions, speech bubbles, labels, stars, leaves or other decoration. Each panel contains exactly one Muddy. Panel1: Muddy sits in a small mud patch outdoors under the hot sun; show the sun and simple grass. Panel2: Muddy walks from the mud towards the open doorway of a simple small hut; a rectangular woven mat is visibly inside the hut. Panel3: inside that same hut, Muddy sleeps peacefully on that mat away from the sun. Keep hut and mat shapes consistent across panels; show relevant body and objects completely with safe white margins. Friendly simple classroom line-art, immediately readable at tablet size. Exact story: Muddy sat in the mud. The sun was hot. Muddy got up and ran to a mat. The mat was in a hut. Muddy sat on it. The mat was not hot. Muddy had a nap in the hut. No events beyond these; preserve the reference's recognisable Muddy rather than a generic pig."
  },
  "pip-bag": {
    "sourceText": "Pip had a red bag. Pip put a pen in it. Then Pip put a map in the bag. The bag had a rip. The pen fell out. Pip got the pen and put the bag on a peg. Pip got a box for the pen and map.",
    "textSha256": "e86696b19f7ae4db103a90bc22cb6c6d572626e7b6a1fd0f547027c14c645a64",
    "kind": "comic",
    "panels": [
      {
        "scene": "Pip places a pen and folded map into a bag with a visible tear near its bottom.",
        "alt": "Pip packs a pen and map in a torn bag."
      },
      {
        "scene": "The pen has fallen onto the ground below the tear; Pip bends to retrieve it while the map remains in the bag.",
        "alt": "The pen falls through the tear."
      },
      {
        "scene": "The torn bag hangs on a peg. Pip puts the recovered pen and map into an open box below.",
        "alt": "Pip puts the pen and map in a box."
      }
    ],
    "alt": "First: Pip packs a pen and map in a torn bag. Next: The pen falls through the tear. Last: Pip puts the pen and map in a box.",
    "src": "/images/comprehension/passages/pip-bag.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip and the Red Bag\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Exactly one instance of each participating character per panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip had a red bag. Pip put a pen in it. Then Pip put a map in the bag. The bag had a rip. The pen fell out. Pip got the pen and put the bag on a peg. Pip got a box for the pen and map.\n\nFIRST / left panel: Pip places a pen and folded map into a bag with a visible tear near its bottom.\n\nNEXT / middle panel: The pen has fallen onto the ground below the tear; Pip bends to retrieve it while the map remains in the bag.\n\nLAST / right panel: The torn bag hangs on a peg. Pip puts the recovered pen and map into an open box below.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "fluff-log": {
    "sourceText": "Fluff can hop onto a big log. The log rolls, and Fluff falls off. Fluff gets up and puts the log in a pit. The pit is a hole in the ground. The log cannot roll in the pit. Now Fluff can sit on the log.",
    "textSha256": "265b23b0701329d8d2d1e3fd7467bdeb9b3459828ab9a926a752629befdcb0a0",
    "kind": "comic",
    "panels": [
      {
        "scene": "Fluff has just fallen beside a rolling log on flat ground, with paws clear of the log and no injury.",
        "alt": "Fluff falls off the rolling log."
      },
      {
        "scene": "Fluff pushes the same log into a shallow pit, clearly a hole in the ground.",
        "alt": "Fluff puts the log in a hole."
      },
      {
        "scene": "Fluff sits on the log settled securely inside the pit; the log is not rolling.",
        "alt": "Fluff sits on the still log in the hole."
      }
    ],
    "alt": "First: Fluff falls off the rolling log. Next: Fluff puts the log in a hole. Last: Fluff sits on the still log in the hole.",
    "src": "/images/comprehension/passages/fluff-log.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff and the Log\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Exactly one instance of each participating character per panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff can hop onto a big log. The log rolls, and Fluff falls off. Fluff gets up and puts the log in a pit. The pit is a hole in the ground. The log cannot roll in the pit. Now Fluff can sit on the log.\n\nFIRST / left panel: Fluff has just fallen beside a rolling log on flat ground, with paws clear of the log and no injury.\n\nNEXT / middle panel: Fluff pushes the same log into a shallow pit, clearly a hole in the ground.\n\nLAST / right panel: Fluff sits on the log settled securely inside the pit; the log is not rolling.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-cup": {
    "sourceText": "Socks has a cup and a jug of water. Socks pours water from the jug into the cup. Some water spills on the mat. Socks gets a mop and cleans the wet mat. Then Socks fills the cup slowly. This time, no water spills.",
    "textSha256": "d9fc037066187d80af1d57361ebdc082b604302a338b712b276b03e97a17cebd",
    "kind": "comic",
    "panels": [
      {
        "scene": "Socks pours from a water jug into a cup; a small spill lands on the mat beside the cup.",
        "alt": "Water spills onto the mat."
      },
      {
        "scene": "Socks uses a mop on the wet mat; the cup and jug remain nearby.",
        "alt": "Socks mops the wet mat."
      },
      {
        "scene": "Socks carefully tilts the jug over the cup; water enters the cup and the mat has no fresh spill.",
        "alt": "Socks fills the cup without spilling."
      }
    ],
    "alt": "First: Water spills onto the mat. Next: Socks mops the wet mat. Last: Socks fills the cup without spilling.",
    "src": "/images/comprehension/passages/socks-cup.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks and the Cup\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks has a cup and a jug of water. Socks pours water from the jug into the cup. Some water spills on the mat. Socks gets a mop and cleans the wet mat. Then Socks fills the cup slowly. This time, no water spills.\n\nFIRST / left panel: Socks pours from a water jug into a cup; a small spill lands on the mat beside the cup.\n\nNEXT / middle panel: Socks uses a mop on the wet mat; the cup and jug remain nearby.\n\nLAST / right panel: Socks carefully tilts the jug over the cup; water enters the cup and the mat has no fresh spill.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-shed": {
    "sourceText": "Chips has a dish for the fish. The dish is in the shed. Chips opens the shed but cannot see the dish. A big bag is on top of it. Chips moves the bag and gets the dish. Chips puts fish food in the dish, then shuts the shed.",
    "textSha256": "6089722d0847e4ca966d14191e4f9c37c94a388382adaf589455faffbdcdb6d6",
    "kind": "comic",
    "panels": [
      {
        "scene": "At the open shed door, Chips looks at a large bag resting on top of a dish, with the dish rim just visible underneath.",
        "alt": "A bag covers the dish in the shed."
      },
      {
        "scene": "Chips moves the bag aside and lifts out the uncovered dish.",
        "alt": "Chips moves the bag and gets the dish."
      },
      {
        "scene": "Chips holds the dish containing fish-food pellets next to the now closed shed door. No fish in the dish.",
        "alt": "Chips has the fish-food dish beside the shut shed."
      }
    ],
    "alt": "First: A bag covers the dish in the shed. Next: Chips moves the bag and gets the dish. Last: Chips has the fish-food dish beside the shut shed.",
    "src": "/images/comprehension/passages/chips-shed.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips in the Shed\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Exactly one instance of each participating character per panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips has a dish for the fish. The dish is in the shed. Chips opens the shed but cannot see the dish. A big bag is on top of it. Chips moves the bag and gets the dish. Chips puts fish food in the dish, then shuts the shed.\n\nFIRST / left panel: At the open shed door, Chips looks at a large bag resting on top of a dish, with the dish rim just visible underneath.\n\nNEXT / middle panel: Chips moves the bag aside and lifts out the uncovered dish.\n\nLAST / right panel: Chips holds the dish containing fish-food pellets next to the now closed shed door. No fish in the dish.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nCritical anatomy and background correction: Chips has exactly FOUR limbs total in EACH panel: exactly two front limbs used as arms, and exactly two hind legs ending in cloven hooves. Never draw a third arm, spare foreleg, hidden duplicate hoof, or a fifth limb while moving the bag or holding the dish. Pose the two front limbs visibly and separately so their count is unmistakable. The shed interior, floor, walls, bag and all open space are PURE WHITE with outlines only; absolutely no grey interior fill, grey shadow, gradients, hatching or shaded background. Keep both arm silhouettes separate from the bag and dish."
  },
  "chompy-chip": {
    "sourceText": "Chompy has a bag of wood chips. Wood chips are small bits of wood. The path to the bench is muddy. Chompy puts one chip on the path. One chip cannot cover the mud. Chompy adds more chips until the mud is covered. Now Chompy can walk to the bench without getting muddy.",
    "textSha256": "42a32e235bb0b84d3c3c7df06f5c4564ddc53d598318e0fbf1ada0da6b6ffc1d",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chompy stands beside the muddy path to a bench, with one wood chip lying on the mud and a bag of more chips.",
        "alt": "One wood chip lies on the muddy path."
      },
      {
        "scene": "Chompy spreads many small pieces of wood across the remaining mud.",
        "alt": "Chompy covers the mud with more wood chips."
      },
      {
        "scene": "Chompy walks along the fully chip-covered path towards the bench; feet stay above the mud.",
        "alt": "Chompy walks on the wood-chip path."
      }
    ],
    "alt": "First: One wood chip lies on the muddy path. Next: Chompy covers the mud with more wood chips. Last: Chompy walks on the wood-chip path.",
    "src": "/images/comprehension/passages/chompy-chip.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Makes a Chip Path\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy has a bag of wood chips. Wood chips are small bits of wood. The path to the bench is muddy. Chompy puts one chip on the path. One chip cannot cover the mud. Chompy adds more chips until the mud is covered. Now Chompy can walk to the bench without getting muddy.\n\nFIRST / left panel: Chompy stands beside the muddy path to a bench, with one wood chip lying on the mud and a bag of more chips.\n\nNEXT / middle panel: Chompy spreads many small pieces of wood across the remaining mud.\n\nLAST / right panel: Chompy walks along the fully chip-covered path towards the bench; feet stay above the mud.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nColouring-style correction: all mud, puddles and paths remain PURE WHITE inside black outlines. Identify mud using only the puddle perimeter and a few simple interior contour lines, never grey wash, solid fill, shadow, gradient, stipple or hatching. No grey or solid-filled regions anywhere except small eyes and nostrils. Large open areas must stay white in all three panels."
  },
  "fluff-path": {
    "sourceText": "Fluff walks on a path with a bag. A thick branch is on the path. Fluff puts the bag down to move the branch. Fluff pulls the branch off the path. Then Fluff picks up the bag and walks on. Now the branch is not in the way.",
    "textSha256": "5c60dff8b4449abac10a5b0c9e518a6e094b108b9ec4f76d02ce8c4889005c29",
    "kind": "comic",
    "panels": [
      {
        "scene": "Fluff faces a thick branch across the path while carrying a bag.",
        "alt": "A branch blocks Fluff's path."
      },
      {
        "scene": "The bag rests on the ground while Fluff pulls the branch to the side of the path.",
        "alt": "Fluff puts down the bag and moves the branch."
      },
      {
        "scene": "Fluff carries the bag along the clear path; the branch lies fully off to one side.",
        "alt": "Fluff walks on with the bag."
      }
    ],
    "alt": "First: A branch blocks Fluff's path. Next: Fluff puts down the bag and moves the branch. Last: Fluff walks on with the bag.",
    "src": "/images/comprehension/passages/fluff-path.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff and the Branch\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Exactly one instance of each participating character per panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff walks on a path with a bag. A thick branch is on the path. Fluff puts the bag down to move the branch. Fluff pulls the branch off the path. Then Fluff picks up the bag and walks on. Now the branch is not in the way.\n\nFIRST / left panel: Fluff faces a thick branch across the path while carrying a bag.\n\nNEXT / middle panel: The bag rests on the ground while Fluff pulls the branch to the side of the path.\n\nLAST / right panel: Fluff carries the bag along the clear path; the branch lies fully off to one side.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "pip-tent": {
    "sourceText": "Pip puts up a tent. A gust of wind lifts one side. One of the tent pegs is lost. Pip finds the peg in the grass by the tent. Pip pushes the peg into the ground to hold the tent down. The next gust comes, but the tent stays up.",
    "textSha256": "1a09bd19bb0fcd426b1c0dc88960c44c6066c0f878f2471debcc6917eb222958",
    "kind": "comic",
    "panels": [
      {
        "scene": "Wind lifts one loose side of Pip's tent; a single unattached peg is visible in the nearby grass.",
        "alt": "Wind lifts one side of the tent."
      },
      {
        "scene": "Pip pushes the found peg into the ground through the loose tent loop.",
        "alt": "Pip puts the peg into the ground."
      },
      {
        "scene": "The tent stays firmly pegged down while grass bends in another gust; Pip watches beside it.",
        "alt": "The tent stays up in the wind."
      }
    ],
    "alt": "First: Wind lifts one side of the tent. Next: Pip puts the peg into the ground. Last: The tent stays up in the wind.",
    "src": "/images/comprehension/passages/pip-tent.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip and the Tent Peg\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip puts up a tent. A gust of wind lifts one side. One of the tent pegs is lost. Pip finds the peg in the grass by the tent. Pip pushes the peg into the ground to hold the tent down. The next gust comes, but the tent stays up.\n\nFIRST / left panel: Wind lifts one loose side of Pip's tent; a single unattached peg is visible in the nearby grass.\n\nNEXT / middle panel: Pip pushes the found peg into the ground through the loose tent loop.\n\nLAST / right panel: The tent stays firmly pegged down while grass bends in another gust; Pip watches beside it.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nCritical framing: draw Pip smaller within every panel so the entire head, both boots and all fingers are fully visible with generous clear margins. No part of Pip may touch or cross a panel border. Show the peg large and the tent corner safely inside each frame."
  },
  "muddy-cake": {
    "sourceText": "Muddy made a cake. Muddy put the cake on a plate on a table. A ball hit the table and made it shake. The plate slid to the edge of the table. Muddy caught the plate and took the cake inside. The cake was safe on the kitchen table.",
    "textSha256": "f3ac647a57511448055c16297bc50e06ac696ef2e52f4f3191794a9ec37464a0",
    "kind": "comic",
    "panels": [
      {
        "scene": "A ball touches the outdoor table leg; the plate carrying Muddy's cake is sliding towards the tabletop edge.",
        "alt": "A ball shakes the table beneath the cake."
      },
      {
        "scene": "Muddy catches the plate at the edge, keeping the cake intact above the ground.",
        "alt": "Muddy catches the cake plate."
      },
      {
        "scene": "The intact cake and plate rest on the kitchen table indoors, with Muddy beside them.",
        "alt": "The cake is safe on the kitchen table."
      }
    ],
    "alt": "First: A ball shakes the table beneath the cake. Next: Muddy catches the cake plate. Last: The cake is safe on the kitchen table.",
    "src": "/images/comprehension/passages/muddy-cake.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Saves the Cake\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy made a cake. Muddy put the cake on a plate on a table. A ball hit the table and made it shake. The plate slid to the edge of the table. Muddy caught the plate and took the cake inside. The cake was safe on the kitchen table.\n\nFIRST / left panel: A ball touches the outdoor table leg; the plate carrying Muddy's cake is sliding towards the tabletop edge.\n\nNEXT / middle panel: Muddy catches the plate at the edge, keeping the cake intact above the ground.\n\nLAST / right panel: The intact cake and plate rest on the kitchen table indoors, with Muddy beside them.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-kite": {
    "sourceText": "Socks took a kite to the field. Socks held the long kite line and ran. The kite did not go up. The line was stuck under a stone. Socks lifted the stone and pulled the line out. This time, the kite went high in the sky.",
    "textSha256": "a744918e4a4e64454943625f712de34cd460979d86b06854546f85e09edbabbd",
    "kind": "comic",
    "panels": [
      {
        "scene": "In the field, Socks holds the kite line while the kite stays down; a stone visibly traps a section of line.",
        "alt": "A stone traps the kite line."
      },
      {
        "scene": "Socks lifts the stone and pulls the line free from underneath.",
        "alt": "Socks frees the line from under the stone."
      },
      {
        "scene": "Socks holds the free line, which runs uninterrupted to the kite high above the field.",
        "alt": "The kite flies high on the free line."
      }
    ],
    "alt": "First: A stone traps the kite line. Next: Socks frees the line from under the stone. Last: The kite flies high on the free line.",
    "src": "/images/comprehension/passages/socks-kite.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks and the Kite\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks took a kite to the field. Socks held the long kite line and ran. The kite did not go up. The line was stuck under a stone. Socks lifted the stone and pulled the line out. This time, the kite went high in the sky.\n\nFIRST / left panel: In the field, Socks holds the kite line while the kite stays down; a stone visibly traps a section of line.\n\nNEXT / middle panel: Socks lifts the stone and pulls the line free from underneath.\n\nLAST / right panel: Socks holds the free line, which runs uninterrupted to the kite high above the field.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nPhysical continuity and simple geometry: the same kite is a plain diamond with an X cross-frame and NO decorative tail, NO bows, NO ribbons, NO dangling accessories in any panel. The flying string terminates at the visible small centre bridle dot on the kite face, never at a corner. Panel 1: the kite rests fully on the ground; trace one unbroken string from Socks hand down underneath the stone and back up to the centre of the kite face. Panel 2: Socks holds the stone clearly in the air, entirely above the ground, and pulls the freed string with the other hand; that string runs straight to the kite centre, with NO remaining connection to the lifted stone. Panel 3: kite high above, one clear string from hand to the centre of the diamond face. Exactly two arms, two legs, two-button V-neck vest across all panels. No part of string continues outside a panel.\n\nTargeted correction to the supplied comic: in the MIDDLE panel remove the entire unwanted curved black line between the lower hand at waist level and the raised hand holding the stone. There must be completely plain white air between the lower hand and raised stone, apart from Socks' real arm. Retain only the string from the lower hand curving down and right toward the kite. In panels 1 and 2 the string should visibly reach the circular bridle dot at the diamond face centre; add a short curve from the kite's left edge to the dot, distinct from the straight X-frame. Keep all other shapes, all three panels, character, vest and sequence unchanged."
  },
  "pip-home": {
    "sourceText": "Pip came home and found a note on the gate. The note said to look under the rope swing. Pip went to the swing and found a small box. The lost cap was in the box. Pip put on the cap and took the box home.",
    "textSha256": "543e280bb71df763c556ef83a9d0a79487e38b7a461449c1223b6c85cebdc351",
    "kind": "comic",
    "panels": [
      {
        "scene": "Pip finds a note attached to the gate. On its front, print exactly: Look under the rope swing. No other writing.",
        "alt": "Pip finds a note on the gate."
      },
      {
        "scene": "Under a rope swing, Pip opens a small box to reveal a cap.",
        "alt": "Pip finds the cap in a box under the swing."
      },
      {
        "scene": "Pip walks home wearing the recovered cap and carrying the small box.",
        "alt": "Pip carries the box home wearing the cap."
      }
    ],
    "alt": "First: Pip finds a note on the gate. Next: Pip finds the cap in a box under the swing. Last: Pip carries the box home wearing the cap.",
    "src": "/images/comprehension/passages/pip-home.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Finds a Note\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip came home and found a note on the gate. The note said to look under the rope swing. Pip went to the swing and found a small box. The lost cap was in the box. Pip put on the cap and took the box home.\n\nFIRST / left panel: Pip finds a note attached to the gate. On its front, print exactly: Look under the rope swing. No other writing.\n\nNEXT / middle panel: Under a rope swing, Pip opens a small box to reveal a cap.\n\nLAST / right panel: Pip walks home wearing the recovered cap and carrying the small box.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. Only the plot-essential note has writing: \"Look under the rope swing.\" Render it clearly, exactly and horizontally. Other surfaces have no writing. Do not draw the source passage or title into the art."
  },
  "fluff-tune": {
    "sourceText": "Fluff can play a tune on a flute. Fluff plays by the pond. Ducks quack loudly, and Fluff cannot hear the tune. Fluff wants to use the flute in a quiet place. Fluff walks to a tree away from the ducks. Now Fluff can hear the tune.",
    "textSha256": "6eb1e6b9225fba0ff31810b2296942030ef0589d0a92efcc9ea8ca222214f6ba",
    "kind": "comic",
    "panels": [
      {
        "scene": "Fluff holds a flute at the mouth beside the pond; ducks nearby have open beaks. No sound symbols or music notes.",
        "alt": "Fluff plays beside loudly quacking ducks."
      },
      {
        "scene": "Fluff walks away from the pond carrying the flute, towards a separate tree.",
        "alt": "Fluff carries the flute away from the ducks."
      },
      {
        "scene": "Fluff plays the flute under that tree; the distant pond and ducks are small in the background.",
        "alt": "Fluff plays by a tree away from the pond."
      }
    ],
    "alt": "First: Fluff plays beside loudly quacking ducks. Next: Fluff carries the flute away from the ducks. Last: Fluff plays by a tree away from the pond.",
    "src": "/images/comprehension/passages/fluff-tune.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff and the Flute\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Exactly one instance of each participating character per panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff can play a tune on a flute. Fluff plays by the pond. Ducks quack loudly, and Fluff cannot hear the tune. Fluff wants to use the flute in a quiet place. Fluff walks to a tree away from the ducks. Now Fluff can hear the tune.\n\nFIRST / left panel: Fluff holds a flute at the mouth beside the pond; ducks nearby have open beaks. No sound symbols or music notes.\n\nNEXT / middle panel: Fluff walks away from the pond carrying the flute, towards a separate tree.\n\nLAST / right panel: Fluff plays the flute under that tree; the distant pond and ducks are small in the background.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-cube": {
    "sourceText": "Chips has a big ice cube in a tub. Chips wants to use the tub for plants. The ice is stuck in the tub. Chips puts the tub in the sun. The ice melts into water. Chips pours out the water and puts soil in the tub. Now Chips can plant the seeds.",
    "textSha256": "8e331b6170e486c9d77b58d8e9db2e3fd99b73a1883815b84e3f59c3ecafc2ab",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chips looks into a tub containing one large solid ice cube.",
        "alt": "A large ice cube fills the tub."
      },
      {
        "scene": "The same tub sits in sunlight; the cube has become a small remnant surrounded by meltwater.",
        "alt": "The ice melts into water in the sun."
      },
      {
        "scene": "The emptied tub now contains soil; Chips holds seeds ready above it, without established grown plants.",
        "alt": "Chips gets ready to plant seeds in the soil."
      }
    ],
    "alt": "First: A large ice cube fills the tub. Next: The ice melts into water in the sun. Last: Chips gets ready to plant seeds in the soil.",
    "src": "/images/comprehension/passages/chips-cube.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips and the Ice Cube\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips has a big ice cube in a tub. Chips wants to use the tub for plants. The ice is stuck in the tub. Chips puts the tub in the sun. The ice melts into water. Chips pours out the water and puts soil in the tub. Now Chips can plant the seeds.\n\nFIRST / left panel: Chips looks into a tub containing one large solid ice cube.\n\nNEXT / middle panel: The same tub sits in sunlight; the cube has become a small remnant surrounded by meltwater.\n\nLAST / right panel: The emptied tub now contains soil; Chips holds seeds ready above it, without established grown plants.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chompy-game": {
    "sourceText": "Chompy wants to make a game with five stones. Chompy draws a line and puts a cup on its side. Chompy slides a stone from the line to the cup. The stone stops before the cup. Chompy moves the cup closer to the line. The next stone goes into the cup.",
    "textSha256": "b4da73e045076ac3c20c2db4a765ecf29c7610121d2748d87179efe808f3cfa8",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chompy looks at a first stone that has stopped short of a cup lying on its side, beyond a plain start line. Exactly five stones total: four waiting beside the line and one stopped between the line and cup. Show only this stopped moment, not simultaneous sliding.",
        "alt": "The first stone stops before the cup."
      },
      {
        "scene": "Chompy moves the sideways cup nearer the same line; keep the stopped stone visible out of its way.",
        "alt": "Chompy moves the cup closer."
      },
      {
        "scene": "A second stone rests inside the cup after the slide; the other four stones remain outside, five stones total.",
        "alt": "The next stone reaches the cup."
      }
    ],
    "alt": "First: The first stone stops before the cup. Next: Chompy moves the cup closer. Last: The next stone reaches the cup.",
    "src": "/images/comprehension/passages/chompy-game.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Makes a Game\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy wants to make a game with five stones. Chompy draws a line and puts a cup on its side. Chompy slides a stone from the line to the cup. The stone stops before the cup. Chompy moves the cup closer to the line. The next stone goes into the cup.\n\nFIRST / left panel: Chompy looks at a first stone that has stopped short of a cup lying on its side, beyond a plain start line. Exactly five stones total: four waiting beside the line and one stopped between the line and cup. Show only this stopped moment, not simultaneous sliding.\n\nNEXT / middle panel: Chompy moves the sideways cup nearer the same line; keep the stopped stone visible out of its way.\n\nLAST / right panel: A second stone rests inside the cup after the slide; the other four stones remain outside, five stones total.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nCount lock: exactly FIVE stones total in every panel, never six or more. FIRST four waiting at the line plus one stopped short. NEXT preserve those five while moving only the cup closer. LAST one stone inside the sideways cup, one stopped stone outside and three still waiting at the line. Do not draw a hand-held extra stone."
  },
  "muddy-rain": {
    "sourceText": "Muddy puts a pail, a small bucket, outside in the rain. Muddy wants the water for a small plant. The pail has a hole in the bottom. Water drips out. Muddy puts a bowl under the pail. The bowl catches the water. Muddy can water the plant without waiting for more rain.",
    "textSha256": "d350a171054acc3754e13cfb43a054631a2cbba6cee976fae574efe2ae4e1edb",
    "kind": "scene",
    "panels": [
      {
        "scene": "In rain outside, Muddy holds the leaking pail just above a bowl. Water drips through the clearly visible bottom hole directly into the bowl. A small plant waits nearby; Muddy has not watered it yet.",
        "alt": "A bowl catches water dripping through the hole in Muddy's pail."
      }
    ],
    "alt": "A bowl catches water dripping through the hole in Muddy's pail.",
    "src": "/images/comprehension/passages/muddy-rain.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished single coherent landscape story scene for the original Reading Comprehension passage \"Muddy and the Rain Pail\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy puts a pail, a small bucket, outside in the rain. Muddy wants the water for a small plant. The pail has a hole in the bottom. Water drips out. Muddy puts a bowl under the pail. The bowl catches the water. Muddy can water the plant without waiting for more rain.\n\nSCENE: In rain outside, Muddy holds the leaking pail just above a bowl. Water drips through the clearly visible bottom hole directly into the bowl. A small plant waits nearby; Muddy has not watered it yet.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nPRECISION REPAIR: Input image 1 is the approved Muddy model. Input image 2 is a prior otherwise-correct scene to repair. Use image 2 as the scene base. Remove ONLY the extra dangling forelimb/oval on the left side of the torso (below the cheek and left of the belly). Keep exactly TWO forelimbs gripping the pail and exactly TWO grounded hindlegs: FOUR limbs total. Replace the removed hanging limb with a smooth continuous torso outline; any mud marking must be flat irregular flank marking, never an oval arm. Keep the face, pail hole, drops into bowl, rain, plant, remaining arms and feet, composition and black-white colouring style unchanged."
  },
  "pip-play": {
    "sourceText": "Pip plans a puppet play for a sunny day. Pip makes a small stage from a tray. The tray tips to one side on the grass. Pip puts the tray on a low, flat box. Now the stage can stay still. Pip puts the puppets on the stage. The play can begin.",
    "textSha256": "0ce95aacfe63a0fc336be893e0338afc773187363e2306f27d1de02720400533",
    "kind": "comic",
    "panels": [
      {
        "scene": "Pip's tray stage tilts unevenly on the grass; puppets wait beside it.",
        "alt": "The tray tips on the grass."
      },
      {
        "scene": "Pip places the tray level on a low flat box.",
        "alt": "Pip puts the tray on a flat box."
      },
      {
        "scene": "Puppets stand on the stable tray atop the box while Pip gets ready behind the stage.",
        "alt": "The puppets stand on the steady tray stage."
      }
    ],
    "alt": "First: The tray tips on the grass. Next: Pip puts the tray on a flat box. Last: The puppets stand on the steady tray stage.",
    "src": "/images/comprehension/passages/pip-play.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Plans a Play\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip plans a puppet play for a sunny day. Pip makes a small stage from a tray. The tray tips to one side on the grass. Pip puts the tray on a low, flat box. Now the stage can stay still. Pip puts the puppets on the stage. The play can begin.\n\nFIRST / left panel: Pip's tray stage tilts unevenly on the grass; puppets wait beside it.\n\nNEXT / middle panel: Pip places the tray level on a low flat box.\n\nLAST / right panel: Puppets stand on the stable tray atop the box while Pip gets ready behind the stage.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "fluff-seeds": {
    "sourceText": "Fluff plants three seeds in a little pot. Fluff gives the seeds water each week. Two little green plants grow. The third seed has not grown yet. Fluff keeps giving it water and waits. A week later, a third green plant grows. Now all three seeds have grown into plants.",
    "textSha256": "29c021280a8a0fcedb8cc3555e363f6589bba1b6179b3e088bdc07c835346f0b",
    "kind": "comic",
    "panels": [
      {
        "scene": "Fluff plants exactly three distinct seeds in one little pot, before covering them with soil.",
        "alt": "Fluff plants three seeds in a pot."
      },
      {
        "scene": "Two small plants have emerged in that pot; Fluff waters the still bare third planting place.",
        "alt": "Fluff waters the pot with two plants."
      },
      {
        "scene": "Exactly three small plants now grow in the same pot, and Fluff looks at them.",
        "alt": "Three plants grow in the pot."
      }
    ],
    "alt": "First: Fluff plants three seeds in a pot. Next: Fluff waters the pot with two plants. Last: Three plants grow in the pot.",
    "src": "/images/comprehension/passages/fluff-seeds.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff and the Seeds\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff plants three seeds in a little pot. Fluff gives the seeds water each week. Two little green plants grow. The third seed has not grown yet. Fluff keeps giving it water and waits. A week later, a third green plant grows. Now all three seeds have grown into plants.\n\nFIRST / left panel: Fluff plants exactly three distinct seeds in one little pot, before covering them with soil.\n\nNEXT / middle panel: Two small plants have emerged in that pot; Fluff waters the still bare third planting place.\n\nLAST / right panel: Exactly three small plants now grow in the same pot, and Fluff looks at them.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-beach": {
    "sourceText": "Socks walks on the beach by the sea. The wind blows a red cap onto a rock. Socks cannot reach the cap from the sand. Socks uses a long stick to push the cap off the rock. The cap falls onto the sand. Socks picks it up and holds it tight.",
    "textSha256": "a04fa28df601a1ec4d72b059294d0362dc4a689a1557ecf4eac0141f46c2da95",
    "kind": "comic",
    "panels": [
      {
        "scene": "At the beach, a cap rests high on a rock; Socks reaches from the sand but cannot touch it.",
        "alt": "Socks cannot reach the cap on the rock."
      },
      {
        "scene": "Socks uses a long stick from the sand to push the cap off the rock.",
        "alt": "Socks pushes the cap with a long stick."
      },
      {
        "scene": "The cap has landed on the sand; Socks picks it up and holds it close.",
        "alt": "Socks holds the recovered cap on the beach."
      }
    ],
    "alt": "First: Socks cannot reach the cap on the rock. Next: Socks pushes the cap with a long stick. Last: Socks holds the recovered cap on the beach.",
    "src": "/images/comprehension/passages/socks-beach.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks at the Beach\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks walks on the beach by the sea. The wind blows a red cap onto a rock. Socks cannot reach the cap from the sand. Socks uses a long stick to push the cap off the rock. The cap falls onto the sand. Socks picks it up and holds it tight.\n\nFIRST / left panel: At the beach, a cap rests high on a rock; Socks reaches from the sand but cannot touch it.\n\nNEXT / middle panel: Socks uses a long stick from the sand to push the cap off the rock.\n\nLAST / right panel: The cap has landed on the sand; Socks picks it up and holds it close.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-boat": {
    "sourceText": "Chips makes a little boat from a leaf. Chips puts the boat in a small pool of water. A stone in the boat makes it sink. Chips takes out the stone and adds a small, dry stick. The stick does not soak up much water. Now the boat can float across the pool.",
    "textSha256": "c2572f800123c6ff54481a96ef1478b2c4c1d1d7285a848decd3462568b3aee4",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chips puts a leaf boat carrying a stone in a small pool; the weighted leaf sinks below the water surface.",
        "alt": "A stone makes the leaf boat sink."
      },
      {
        "scene": "Chips takes the stone out and places a small dry stick in the same leaf boat.",
        "alt": "Chips replaces the stone with a small stick."
      },
      {
        "scene": "The leaf boat floats across the pool carrying only the stick; Chips watches from the edge.",
        "alt": "The leaf boat floats with the stick."
      }
    ],
    "alt": "First: A stone makes the leaf boat sink. Next: Chips replaces the stone with a small stick. Last: The leaf boat floats with the stick.",
    "src": "/images/comprehension/passages/chips-boat.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips and the Little Boat\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips makes a little boat from a leaf. Chips puts the boat in a small pool of water. A stone in the boat makes it sink. Chips takes out the stone and adds a small, dry stick. The stick does not soak up much water. Now the boat can float across the pool.\n\nFIRST / left panel: Chips puts a leaf boat carrying a stone in a small pool; the weighted leaf sinks below the water surface.\n\nNEXT / middle panel: Chips takes the stone out and places a small dry stick in the same leaf boat.\n\nLAST / right panel: The leaf boat floats across the pool carrying only the stick; Chips watches from the edge.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chompy-snow": {
    "sourceText": "Chompy rolls a ball of snow down a low hill. The snowball gets bigger as it rolls. It rolls fast towards a row of stones. Chompy puts more snow in front of the ball. The ball hits the snow and starts to slow down. It stops before it hits the stones.",
    "textSha256": "196d514829286ce8e0a5115e802f9ce139af31fe369bc6e37cbdcd22a824c74a",
    "kind": "comic",
    "panels": [
      {
        "scene": "A growing snowball rolls down a low snowy hill towards a row of stones; Chompy stands beside its route.",
        "alt": "A snowball rolls towards stones."
      },
      {
        "scene": "Chompy heaps loose snow ahead of the approaching ball and before the stones.",
        "alt": "Chompy puts snow in front of the ball."
      },
      {
        "scene": "The ball rests against the added snow with a clear gap before the untouched stones.",
        "alt": "The snowball stops before the stones."
      }
    ],
    "alt": "First: A snowball rolls towards stones. Next: Chompy puts snow in front of the ball. Last: The snowball stops before the stones.",
    "src": "/images/comprehension/passages/chompy-snow.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy in the Snow\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy rolls a ball of snow down a low hill. The snowball gets bigger as it rolls. It rolls fast towards a row of stones. Chompy puts more snow in front of the ball. The ball hits the snow and starts to slow down. It stops before it hits the stones.\n\nFIRST / left panel: A growing snowball rolls down a low snowy hill towards a row of stones; Chompy stands beside its route.\n\nNEXT / middle panel: Chompy heaps loose snow ahead of the approaching ball and before the stones.\n\nLAST / right panel: The ball rests against the added snow with a clear gap before the untouched stones.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nSpatial lock: In the middle panel the new snow heap is AHEAD of the rolling ball along its route, not on top of or behind the ball. In the last panel the snowball has stopped against that heap with a large clearly visible horizontal gap before the untouched row of stones. The ball never touches any stone. Stones and snow must remain WHITE interiors outlined in black, without grey fills or shaded backgrounds."
  },
  "pip-night": {
    "sourceText": "Pip drops a key in the grass at night. Pip takes a bright light outside to find the key. Pip holds the light high but cannot see the key. Pip moves the light close to the ground. Now Pip sees the key beside a stone. Pip picks up the key and goes inside.",
    "textSha256": "335ce5ea973cc3b8e18f62a6b9f92496d5a65e40f8b6840e58a14c01ecb97600",
    "kind": "comic",
    "panels": [
      {
        "scene": "At night in the grass, Pip holds a lamp high; the small key lies hard to notice near a stone. Use white background with simple moon outline, no dense dark fills.",
        "alt": "Pip searches the grass with a light held high."
      },
      {
        "scene": "Pip lowers the lamp close to the grass, lighting the key beside the stone.",
        "alt": "The low light reveals the key beside a stone."
      },
      {
        "scene": "Pip picks up the key beside the same stone, lamp in the other hand and home doorway nearby.",
        "alt": "Pip picks up the key."
      }
    ],
    "alt": "First: Pip searches the grass with a light held high. Next: The low light reveals the key beside a stone. Last: Pip picks up the key.",
    "src": "/images/comprehension/passages/pip-night.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip and the Night Light\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip drops a key in the grass at night. Pip takes a bright light outside to find the key. Pip holds the light high but cannot see the key. Pip moves the light close to the ground. Now Pip sees the key beside a stone. Pip picks up the key and goes inside.\n\nFIRST / left panel: At night in the grass, Pip holds a lamp high; the small key lies hard to notice near a stone. Use white background with simple moon outline, no dense dark fills.\n\nNEXT / middle panel: Pip lowers the lamp close to the grass, lighting the key beside the stone.\n\nLAST / right panel: Pip picks up the key beside the same stone, lamp in the other hand and home doorway nearby.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "fluff-blue": {
    "sourceText": "Fluff sells seeds at a table. Fluff makes a blue sign that says ten seeds in each bag. Fluff counts the seeds in each bag. One bag has only nine seeds. Fluff adds one more seed to that bag. Then Fluff uses glue to stick the sign to the table.",
    "textSha256": "b378ff3ac11dadb2c530e8a0719d83c11cdba63704753d0ce20da71ac2e4bea8",
    "kind": "comic",
    "panels": [
      {
        "scene": "At the seed table, Fluff counts exactly NINE large separate seeds laid in a clear 3-by-3 square grid beside one open empty bag; a plain sign waits unattached. Exactly three seeds in each of exactly three rows, no seed in either paw.",
        "alt": "Fluff counts nine seeds for one bag."
      },
      {
        "scene": "Fluff has just added one seed below the original 3-by-3 group, making exactly TEN seeds on the tabletop: three rows of three and a separate fourth row with one seed. Both paws are empty, one pointing at the new seed. The open empty bag stays beside them.",
        "alt": "Fluff adds one seed to make ten."
      },
      {
        "scene": "The counted seeds are in the bag. Fluff uses glue to attach the plain sign to the table; leave its entire face blank.",
        "alt": "Fluff glues the sign to the table."
      }
    ],
    "alt": "First: Fluff counts nine seeds for one bag. Next: Fluff adds one seed to make ten. Last: Fluff glues the sign to the table.",
    "src": "/images/comprehension/passages/fluff-blue.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff and the Blue Sign\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff sells seeds at a table. Fluff makes a blue sign that says ten seeds in each bag. Fluff counts the seeds in each bag. One bag has only nine seeds. Fluff adds one more seed to that bag. Then Fluff uses glue to stick the sign to the table.\n\nFIRST / left panel: At the seed table, Fluff counts exactly NINE large separate seeds laid in a clear 3-by-3 square grid beside one open empty bag; a plain sign waits unattached. Exactly three seeds in each of exactly three rows, no seed in either paw.\n\nNEXT / middle panel: Fluff has just added one seed below the original 3-by-3 group, making exactly TEN seeds on the tabletop: three rows of three and a separate fourth row with one seed. Both paws are empty, one pointing at the new seed. The open empty bag stays beside them.\n\nLAST / right panel: The counted seeds are in the bag. Fluff uses glue to attach the plain sign to the table; leave its entire face blank.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nCritical counting lock: left panel NINE seeds as 3 rows of 3; middle panel TEN seeds as 3 rows of 3 plus 1 below. Absolutely no additional seed held in a paw, no hidden extra seed, no decorative seed shapes elsewhere. Draw each seed separately with clear white space so a child can count 9 then 10. The final panel shows a closed full bag and blank sign, with no loose seeds."
  },
  "socks-trail": {
    "sourceText": "Socks puts paper arrows on a trail. The arrows show the way to a picnic. Rain makes one paper arrow wet, and it tears. Socks uses flat stones to make new arrows. The stone arrows stay in place in the rain. Socks follows them to the picnic with a bag of food.",
    "textSha256": "dd6dc61022c425b4a94066a8a8065bbab11161f91911fd905096df68ea818811",
    "kind": "comic",
    "panels": [
      {
        "scene": "Rain falls on a paper arrow on the trail; it is visibly torn and wet. Socks carries a food bag.",
        "alt": "Rain tears a paper trail arrow."
      },
      {
        "scene": "Socks arranges flat stones into an arrow on the ground in place of the torn paper.",
        "alt": "Socks makes a new arrow from stones."
      },
      {
        "scene": "Socks follows intact stone arrows towards a picnic place, still carrying the food bag in rain.",
        "alt": "Socks follows the stone arrows to the picnic."
      }
    ],
    "alt": "First: Rain tears a paper trail arrow. Next: Socks makes a new arrow from stones. Last: Socks follows the stone arrows to the picnic.",
    "src": "/images/comprehension/passages/socks-trail.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Makes a Trail\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks puts paper arrows on a trail. The arrows show the way to a picnic. Rain makes one paper arrow wet, and it tears. Socks uses flat stones to make new arrows. The stone arrows stay in place in the rain. Socks follows them to the picnic with a bag of food.\n\nFIRST / left panel: Rain falls on a paper arrow on the trail; it is visibly torn and wet. Socks carries a food bag.\n\nNEXT / middle panel: Socks arranges flat stones into an arrow on the ground in place of the torn paper.\n\nLAST / right panel: Socks follows intact stone arrows towards a picnic place, still carrying the food bag in rain.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "muddy-seat": {
    "sourceText": "Muddy needs a seat by the tree. Muddy finds a wide board and two short logs. Muddy puts one end of the board on each log. The seat moves from side to side on the bumpy ground. Muddy moves one log to a flat place. Now the seat does not move. Muddy can sit and read.",
    "textSha256": "179e1e132a7efa6bf12b372649c75d06ecaac4300033a1cdd971cfd108d38703",
    "kind": "scene",
    "panels": [
      {
        "scene": "Muddy sits reading on the now level board seat supported by both logs beside the tree. The book has blank pages.",
        "alt": "Muddy reads on the steady seat."
      }
    ],
    "alt": "Muddy reads on the steady seat.",
    "src": "/images/comprehension/passages/muddy-seat.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished single coherent landscape story scene for the original Reading Comprehension passage \"Muddy Makes a Seat\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy needs a seat by the tree. Muddy finds a wide board and two short logs. Muddy puts one end of the board on each log. The seat moves from side to side on the bumpy ground. Muddy moves one log to a flat place. Now the seat does not move. Muddy can sit and read.\n\nSCENE: Muddy sits reading on the now level board seat supported by both logs beside the tree. The book has blank pages.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "muddy-bus-stop": {
    "sourceText": "Muddy waits for a bus by a shop. The sun is hot. Muddy has a hat in a bag. Muddy puts on the hat and sits on a bench. The bus comes and stops by the shop. Muddy gets up and takes the bag onto the bus.",
    "textSha256": "af062d6a77c383d080cf3b42092313aa1dd043f0c2d65be161438c2469ee8eb8",
    "kind": "comic",
    "panels": [
      {
        "scene": "Beside a shop and bus-stop bench in hot sun, Muddy opens a bag containing a hat.",
        "alt": "Muddy finds a hat in the bag at the bus stop."
      },
      {
        "scene": "Muddy wears the hat while sitting on the bench, bag close by.",
        "alt": "Muddy waits on the bench wearing the hat."
      },
      {
        "scene": "A bus has stopped beside the shop with its door open; Muddy boards carrying the bag and wearing the hat. No destination lettering.",
        "alt": "Muddy takes the bag onto the bus."
      }
    ],
    "alt": "First: Muddy finds a hat in the bag at the bus stop. Next: Muddy waits on the bench wearing the hat. Last: Muddy takes the bag onto the bus.",
    "src": "/images/comprehension/passages/muddy-bus-stop.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Waits for the Bus\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy waits for a bus by a shop. The sun is hot. Muddy has a hat in a bag. Muddy puts on the hat and sits on a bench. The bus comes and stops by the shop. Muddy gets up and takes the bag onto the bus.\n\nFIRST / left panel: Beside a shop and bus-stop bench in hot sun, Muddy opens a bag containing a hat.\n\nNEXT / middle panel: Muddy wears the hat while sitting on the bench, bag close by.\n\nLAST / right panel: A bus has stopped beside the shop with its door open; Muddy boards carrying the bag and wearing the hat. No destination lettering.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "muddy-pot-lid": {
    "sourceText": "Muddy has a pot of soup. Muddy wants a lid for the pot. A small lid sits by the sink. It does not fit the big pot. Muddy gets a bigger lid from a shelf. This lid fits, so Muddy puts it on the pot.",
    "textSha256": "0e7297abc3f969075e081dd80725c3c3904dc5c41c8bc07839be6b1acd29c393",
    "kind": "comic",
    "panels": [
      {
        "scene": "At a kitchen counter, Muddy compares a small lid with a clearly wider soup pot; the lid cannot cover its rim.",
        "alt": "The small lid does not fit the big pot."
      },
      {
        "scene": "Muddy lifts a larger lid from a shelf, keeping the too-small lid by the sink. The uncovered soup pot stays on the same counter beside the sink in the foreground; there are no pots on the shelf.",
        "alt": "Muddy gets a bigger lid from the shelf."
      },
      {
        "scene": "The larger lid neatly covers the soup pot; Muddy rests a hand on its handle.",
        "alt": "The bigger lid fits the pot."
      }
    ],
    "alt": "First: The small lid does not fit the big pot. Next: Muddy gets a bigger lid from the shelf. Last: The bigger lid fits the pot.",
    "src": "/images/comprehension/passages/muddy-pot-lid.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Finds a Lid\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy has a pot of soup. Muddy wants a lid for the pot. A small lid sits by the sink. It does not fit the big pot. Muddy gets a bigger lid from a shelf. This lid fits, so Muddy puts it on the pot.\n\nFIRST / left panel: At a kitchen counter, Muddy compares a small lid with a clearly wider soup pot; the lid cannot cover its rim.\n\nNEXT / middle panel: Muddy lifts a larger lid from a shelf, keeping the too-small lid by the sink.\n\nLAST / right panel: The larger lid neatly covers the soup pot; Muddy rests a hand on its handle.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nCritical location continuity: the same uncovered soup pot remains on the kitchen counter beside the sink throughout the first and second panels. In the second panel only the LARGE LID comes from the shelf. Do not draw any pot on any shelf. Third panel the same pot is covered on the same counter."
  },
  "pip-zip": {
    "sourceText": "Pip puts a cap in a bag. Pip pulls the zip, but it stops. Part of the cap is in the zip. Pip opens the zip and pushes the cap down. Then Pip pulls the zip again. This time, the bag closes. Pip takes the bag to the park.",
    "textSha256": "27f47c9c315b38e27a50fe5736e019ad8c798f27741e92622cd421067d844c6a",
    "kind": "comic",
    "panels": [
      {
        "scene": "Pip's bag zipper is stopped by the edge of a cap caught between its teeth.",
        "alt": "The cap catches in the zip."
      },
      {
        "scene": "Pip opens the zip and pushes the whole cap deeper into the bag.",
        "alt": "Pip pushes the cap away from the zip."
      },
      {
        "scene": "Pip carries the completely zipped bag towards a park path; the cap is no longer caught.",
        "alt": "Pip takes the closed bag to the park."
      }
    ],
    "alt": "First: The cap catches in the zip. Next: Pip pushes the cap away from the zip. Last: Pip takes the closed bag to the park.",
    "src": "/images/comprehension/passages/pip-zip.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Closes the Bag\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip puts a cap in a bag. Pip pulls the zip, but it stops. Part of the cap is in the zip. Pip opens the zip and pushes the cap down. Then Pip pulls the zip again. This time, the bag closes. Pip takes the bag to the park.\n\nFIRST / left panel: Pip's bag zipper is stopped by the edge of a cap caught between its teeth.\n\nNEXT / middle panel: Pip opens the zip and pushes the whole cap deeper into the bag.\n\nLAST / right panel: Pip carries the completely zipped bag towards a park path; the cap is no longer caught.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "pip-pet-food": {
    "sourceText": "Pip has food for a pet cat. The food is in a tin. Pip puts some food in a dish. The cat eats it all and sits by Pip. Pip puts the empty dish in the sink. Then Pip shuts the tin and puts it on a shelf.",
    "textSha256": "f718a6de40805b9492575b10dc354c5c0db978758cdd2b515df59fbbc23a7c11",
    "kind": "comic",
    "panels": [
      {
        "scene": "At home, Pip fills a dish from an open food tin while an ordinary pet cat waits nearby; the cat is much smaller than Pip.",
        "alt": "Pip gives the cat food from a tin."
      },
      {
        "scene": "The cat sits beside Pip after eating; Pip puts the now empty dish in the sink. Cat stays below Pip's knee height.",
        "alt": "Pip puts the empty cat dish in the sink."
      },
      {
        "scene": "Pip puts the closed food tin onto a shelf, with the dish still in the sink and the small cat nearby.",
        "alt": "Pip stores the closed tin on the shelf."
      }
    ],
    "alt": "First: Pip gives the cat food from a tin. Next: Pip puts the empty cat dish in the sink. Last: Pip stores the closed tin on the shelf.",
    "src": "/images/comprehension/passages/pip-pet-food.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Feeds the Pet\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip has food for a pet cat. The food is in a tin. Pip puts some food in a dish. The cat eats it all and sits by Pip. Pip puts the empty dish in the sink. Then Pip shuts the tin and puts it on a shelf.\n\nFIRST / left panel: At home, Pip fills a dish from an open food tin while an ordinary pet cat waits nearby; the cat is much smaller than Pip.\n\nNEXT / middle panel: The cat sits beside Pip after eating; Pip puts the now empty dish in the sink. Cat stays below Pip's knee height.\n\nLAST / right panel: Pip puts the closed food tin onto a shelf, with the dish still in the sink and the small cat nearby.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "fluff-broken-pen": {
    "sourceText": "Fluff wants to draw a red hen. Fluff picks up a red pen, but no ink comes out. Fluff tries the pen on some scrap paper. It still makes no mark. Fluff puts the dry pen in the bin. Another red pen works, and Fluff draws the hen.",
    "textSha256": "86c6fe25128aaf0b127e191274c16d5c4c2bbdefc64fae59af70b57f8dd65967",
    "kind": "comic",
    "panels": [
      {
        "scene": "Fluff presses a pen to scrap paper but the paper remains unmarked; a second similar pen waits on the table.",
        "alt": "The dry pen makes no mark."
      },
      {
        "scene": "Fluff drops the failed pen into a bin and takes the second pen.",
        "alt": "Fluff puts the dry pen in the bin."
      },
      {
        "scene": "With the working pen, Fluff draws a simple hen outline on fresh paper; show drawing strokes only, no alphabet or red ink.",
        "alt": "Fluff draws a hen with the working pen."
      }
    ],
    "alt": "First: The dry pen makes no mark. Next: Fluff puts the dry pen in the bin. Last: Fluff draws a hen with the working pen.",
    "src": "/images/comprehension/passages/fluff-broken-pen.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff Tries Two Pens\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff wants to draw a red hen. Fluff picks up a red pen, but no ink comes out. Fluff tries the pen on some scrap paper. It still makes no mark. Fluff puts the dry pen in the bin. Another red pen works, and Fluff draws the hen.\n\nFIRST / left panel: Fluff presses a pen to scrap paper but the paper remains unmarked; a second similar pen waits on the table.\n\nNEXT / middle panel: Fluff drops the failed pen into a bin and takes the second pen.\n\nLAST / right panel: With the working pen, Fluff draws a simple hen outline on fresh paper; show drawing strokes only, no alphabet or red ink.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "fluff-mix": {
    "sourceText": "Fluff puts nuts in a cup. Then Fluff adds raisins and stirs the mix with a spoon. The cup is full, but Fluff has more nuts. Fluff tips the mix into a big bowl. Now there is room for the last nuts. Fluff shares the snack with Socks.",
    "textSha256": "94c95ae5e862891bfc542bd11888efa94fb593d96e8ecacf714194b99608ccb7",
    "kind": "comic",
    "panels": [
      {
        "scene": "Fluff stirs nuts and raisins in a cup filled to its rim; extra nuts wait alongside.",
        "alt": "The cup is too full for more nuts."
      },
      {
        "scene": "Fluff tips that snack mix into a larger bowl with room above it.",
        "alt": "Fluff moves the mix into a big bowl."
      },
      {
        "scene": "Fluff and Socks share the bowl containing the mix and added nuts. They are similar childlike height; preserve distinct puppy and Socks reference identities.",
        "alt": "Fluff and Socks share the snack."
      }
    ],
    "alt": "First: The cup is too full for more nuts. Next: Fluff moves the mix into a big bowl. Last: Fluff and Socks share the snack.",
    "src": "/images/comprehension/passages/fluff-mix.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff Mixes a Snack\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing. GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff puts nuts in a cup. Then Fluff adds raisins and stirs the mix with a spoon. The cup is full, but Fluff has more nuts. Fluff tips the mix into a big bowl. Now there is room for the last nuts. Fluff shares the snack with Socks.\n\nFIRST / left panel: Fluff stirs nuts and raisins in a cup filled to its rim; extra nuts wait alongside.\n\nNEXT / middle panel: Fluff tips that snack mix into a larger bowl with room above it.\n\nLAST / right panel: Fluff and Socks share the bowl containing the mix and added nuts. They are similar childlike height; preserve distinct puppy and Socks reference identities.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-wet-hat": {
    "sourceText": "Socks washes a hat in a tub. The hat is wet. Socks hangs it on a peg outside. Water drips from the hat onto the grass. Later, Socks touches the hat. It is dry now. Socks takes it off the peg and puts it in a bag.",
    "textSha256": "fb2c3c7c8f16943be8486bd02efc0c56d8b53accb8cd9d72e0c04fbea0c652f5",
    "kind": "comic",
    "panels": [
      {
        "scene": "Outside, the washed hat hangs from a peg and drips water onto the grass; Socks stands by the wash tub.",
        "alt": "Water drips from the hat on the peg."
      },
      {
        "scene": "Later, Socks touches the same hat on the peg; no drops remain.",
        "alt": "Socks checks the dry hat."
      },
      {
        "scene": "Socks places the dry hat inside an open bag; the outside peg is now empty.",
        "alt": "Socks puts the dry hat in the bag."
      }
    ],
    "alt": "First: Water drips from the hat on the peg. Next: Socks checks the dry hat. Last: Socks puts the dry hat in the bag.",
    "src": "/images/comprehension/passages/socks-wet-hat.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Dries a Hat\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks washes a hat in a tub. The hat is wet. Socks hangs it on a peg outside. Water drips from the hat onto the grass. Later, Socks touches the hat. It is dry now. Socks takes it off the peg and puts it in a bag.\n\nFIRST / left panel: Outside, the washed hat hangs from a peg and drips water onto the grass; Socks stands by the wash tub.\n\nNEXT / middle panel: Later, Socks touches the same hat on the peg; no drops remain.\n\nLAST / right panel: Socks places the dry hat inside an open bag; the outside peg is now empty.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nStrict single-hat continuity: exactly ONE hat exists per panel. Panel 1 shows that single hat already hanging on the peg and dripping onto grass. The washing tub beside Socks contains only water, NO hat, no hat-shaped object, and Socks' hands rest on the tub rim. Panel 2 shows the same single hat dry on the same peg, touched by Socks. Panel 3 shows that same single hat being placed in the bag and the same peg empty. Never show a washing action simultaneously with a hat already on the peg. Retain the identical two-button V-neck vest and two arms plus two legs throughout."
  },
  "socks-six-pens": {
    "sourceText": "Socks needs six pens for a table. Socks puts five pens in a box and counts them. One more pen is under a book. Socks lifts the book and gets the pen. Now the box has six pens. Socks puts one pen at each place on the table.",
    "textSha256": "9e0de50672541d43283d93b512b965173d65b74adb2732fc471b904702d488e5",
    "kind": "comic",
    "panels": [
      {
        "scene": "Socks counts exactly five separate pens in an open box; the end of a sixth pen peeks from beneath a book nearby.",
        "alt": "Five pens are in the box and one is under a book."
      },
      {
        "scene": "Socks lifts the book and retrieves that sixth pen.",
        "alt": "Socks gets the pen from under the book."
      },
      {
        "scene": "Socks places exactly six pens at six places around a table, one at each place; empty box nearby.",
        "alt": "Six places each have one pen."
      }
    ],
    "alt": "First: Five pens are in the box and one is under a book. Next: Socks gets the pen from under the book. Last: Six places each have one pen.",
    "src": "/images/comprehension/passages/socks-six-pens.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Counts the Pens\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks needs six pens for a table. Socks puts five pens in a box and counts them. One more pen is under a book. Socks lifts the book and gets the pen. Now the box has six pens. Socks puts one pen at each place on the table.\n\nFIRST / left panel: Socks counts exactly five separate pens in an open box; the end of a sixth pen peeks from beneath a book nearby.\n\nNEXT / middle panel: Socks lifts the book and retrieves that sixth pen.\n\nLAST / right panel: Socks places exactly six pens at six places around a table, one at each place; empty box nearby.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-sun-cap": {
    "sourceText": "Chips takes a ball to the park. The sun is hot, so Chips wears a cap. Chips puts a bag beside a tree and kicks the ball. The ball rolls behind the tree. Chips walks around the tree and gets the ball. Then Chips puts it in the bag.",
    "textSha256": "b228d4a40372de224bb95ecc31240aba91191591ad8102734859a8be27828999",
    "kind": "comic",
    "panels": [
      {
        "scene": "In a sunny park, Chips wears a cap and kicks a ball beside a tree; a bag rests beside the trunk.",
        "alt": "Chips plays with a ball beside the tree."
      },
      {
        "scene": "The ball lies behind the tree, and Chips walks around the trunk to reach it; keep the bag in its original place.",
        "alt": "Chips finds the ball behind the tree."
      },
      {
        "scene": "Chips places the recovered ball into the bag beside the tree, still wearing the cap.",
        "alt": "Chips puts the ball in the bag."
      }
    ],
    "alt": "First: Chips plays with a ball beside the tree. Next: Chips finds the ball behind the tree. Last: Chips puts the ball in the bag.",
    "src": "/images/comprehension/passages/chips-sun-cap.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips at the Park\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips takes a ball to the park. The sun is hot, so Chips wears a cap. Chips puts a bag beside a tree and kicks the ball. The ball rolls behind the tree. Chips walks around the tree and gets the ball. Then Chips puts it in the bag.\n\nFIRST / left panel: In a sunny park, Chips wears a cap and kicks a ball beside a tree; a bag rests beside the trunk.\n\nNEXT / middle panel: The ball lies behind the tree, and Chips walks around the trunk to reach it; keep the bag in its original place.\n\nLAST / right panel: Chips places the recovered ball into the bag beside the tree, still wearing the cap.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-map": {
    "sourceText": "Chips has a map of the park. A red dot marks the pond. Chips walks past the swings. Then Chips stops at a fork in the path. The map shows the pond to the left. Chips turns left and finds ducks on the pond. Chips sits on a bench to watch.",
    "textSha256": "831d186999f0accb2098229722a76cfa1e3b842ed009c10ff05b055f0360474a",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chips pauses at a park path fork holding a simple unlettered map; swings are behind, and the left fork curves towards a pond.",
        "alt": "Chips looks at the map at a fork in the path."
      },
      {
        "scene": "Chips walks down the left fork towards the visible pond; no map text or red dot is rendered as a colour cue.",
        "alt": "Chips takes the left path to the pond."
      },
      {
        "scene": "Chips sits on a bench watching ordinary ducks on the pond; the map is folded nearby. Ducks much smaller than Chips.",
        "alt": "Chips watches ducks from a bench."
      }
    ],
    "alt": "First: Chips looks at the map at a fork in the path. Next: Chips takes the left path to the pond. Last: Chips watches ducks from a bench.",
    "src": "/images/comprehension/passages/chips-map.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips Follows a Map\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips has a map of the park. A red dot marks the pond. Chips walks past the swings. Then Chips stops at a fork in the path. The map shows the pond to the left. Chips turns left and finds ducks on the pond. Chips sits on a bench to watch.\n\nFIRST / left panel: Chips pauses at a park path fork holding a simple unlettered map; swings are behind, and the left fork curves towards a pond.\n\nNEXT / middle panel: Chips walks down the left fork towards the visible pond; no map text or red dot is rendered as a colour cue.\n\nLAST / right panel: Chips sits on a bench watching ordinary ducks on the pond; the map is folded nearby. Ducks much smaller than Chips.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chompy-jam": {
    "sourceText": "Chompy has bread and a jar of red jam. Chompy puts a slice of bread on a plate. The jam jar is shut tight. Socks helps open the jar. Chompy spreads jam on the bread with a spoon. Then Chompy cuts the bread in half and gives Socks a piece.",
    "textSha256": "60a5991bcce705c1824170a4c9604f5cd266e72952c5092b109734bed610482e",
    "kind": "comic",
    "panels": [
      {
        "scene": "At a table with bread on a plate, Chompy struggles to turn a closed jam-jar lid.",
        "alt": "The jam jar is shut tight."
      },
      {
        "scene": "Socks helps loosen the lid while Chompy steadies the jar. Socks is shorter than the young tyrannosaur.",
        "alt": "Socks helps Chompy open the jar."
      },
      {
        "scene": "Chompy offers Socks one half of the jam-covered bread; the other half is on the plate and spoon by the open jar. Socks shorter than Chompy.",
        "alt": "Chompy shares the jam bread with Socks."
      }
    ],
    "alt": "First: The jam jar is shut tight. Next: Socks helps Chompy open the jar. Last: Chompy shares the jam bread with Socks.",
    "src": "/images/comprehension/passages/chompy-jam.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Spreads the Jam\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring. DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy has bread and a jar of red jam. Chompy puts a slice of bread on a plate. The jam jar is shut tight. Socks helps open the jar. Chompy spreads jam on the bread with a spoon. Then Chompy cuts the bread in half and gives Socks a piece.\n\nFIRST / left panel: At a table with bread on a plate, Chompy struggles to turn a closed jam-jar lid.\n\nNEXT / middle panel: Socks helps loosen the lid while Chompy steadies the jar. Socks is shorter than the young tyrannosaur.\n\nLAST / right panel: Chompy offers Socks one half of the jam-covered bread; the other half is on the plate and spoon by the open jar. Socks shorter than Chompy.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chompy-bin": {
    "sourceText": "Chompy has an empty can and a paper bag. Two bins stand by the door. One bin is for cans. The other bin is for paper. Chompy reads the words on each bin. Chompy puts the can in the first bin. The bag goes in the paper bin.",
    "textSha256": "aa34e1e0c14b66f3cf1531ab30125890aeb6d45b8989dcfc39288a6b9b0cd7ac",
    "kind": "comic",
    "panels": [
      {
        "scene": "Beside the door, Chompy holds one empty can and one paper bag near exactly two bins. Both label rectangles stay blank.",
        "alt": "Chompy has a can and paper bag by two bins."
      },
      {
        "scene": "Chompy places the can in the first bin; the paper bag remains in the other hand.",
        "alt": "Chompy puts the can in one bin."
      },
      {
        "scene": "Chompy puts the paper bag in the other bin; the first contains the can. Use open tops to show contents without words.",
        "alt": "Chompy puts the paper bag in the other bin."
      }
    ],
    "alt": "First: Chompy has a can and paper bag by two bins. Next: Chompy puts the can in one bin. Last: Chompy puts the paper bag in the other bin.",
    "src": "/images/comprehension/passages/chompy-bin.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Sorts the Rubbish\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Exactly one instance of each participating character per panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy has an empty can and a paper bag. Two bins stand by the door. One bin is for cans. The other bin is for paper. Chompy reads the words on each bin. Chompy puts the can in the first bin. The bag goes in the paper bin.\n\nFIRST / left panel: Beside the door, Chompy holds one empty can and one paper bag near exactly two bins. Both label rectangles stay blank.\n\nNEXT / middle panel: Chompy places the can in the first bin; the paper bag remains in the other hand.\n\nLAST / right panel: Chompy puts the paper bag in the other bin; the first contains the can. Use open tops to show contents without words.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "muddy-shop-list": {
    "sourceText": "Muddy takes a shopping list to the shop. The list says milk, bread and apples. Muddy gets milk from a cold shelf. Then Muddy finds bread and puts it in a basket. The apples are by the door. Muddy adds three apples and pays for the food.",
    "textSha256": "cd549aef8c0edecee2820ec5d517bde358db4ca998a1ff1bec1bd81e657e4404",
    "kind": "comic",
    "panels": [
      {
        "scene": "Inside a shop, Muddy places a milk carton from a chilled shelf in a shopping basket; a plain list is held in the other hand.",
        "alt": "Muddy gets milk from the cold shelf."
      },
      {
        "scene": "Muddy adds a loaf of bread to the basket containing the milk.",
        "alt": "Muddy adds bread to the basket."
      },
      {
        "scene": "Near the shop door and payment counter, the basket holds the milk, bread and exactly three apples. Muddy pays; no price or list writing.",
        "alt": "Muddy pays for milk, bread and three apples."
      }
    ],
    "alt": "First: Muddy gets milk from the cold shelf. Next: Muddy adds bread to the basket. Last: Muddy pays for milk, bread and three apples.",
    "src": "/images/comprehension/passages/muddy-shop-list.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Shops for Lunch\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy takes a shopping list to the shop. The list says milk, bread and apples. Muddy gets milk from a cold shelf. Then Muddy finds bread and puts it in a basket. The apples are by the door. Muddy adds three apples and pays for the food.\n\nFIRST / left panel: Inside a shop, Muddy places a milk carton from a chilled shelf in a shopping basket; a plain list is held in the other hand.\n\nNEXT / middle panel: Muddy adds a loaf of bread to the basket containing the milk.\n\nLAST / right panel: Near the shop door and payment counter, the basket holds the milk, bread and exactly three apples. Muddy pays; no price or list writing.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. The shopping list is plot-essential: write exactly three short lines, milk / bread / apples, with no other words. Do not add labels or answer letters elsewhere. Do not draw the source passage or title into the art."
  },
  "muddy-ring": {
    "sourceText": "Muddy has a small bell with a ring on top. Muddy threads a long string through the ring. Muddy ties the string to a low branch. The bell hangs just above the ground. Muddy pulls the bell and lets go. The bell swings and makes a sound.",
    "textSha256": "e7760a5b2f6f090621d9663c5cb665f7d2591c5048696594ec808c74f94d7e57",
    "kind": "comic",
    "panels": [
      {
        "scene": "Muddy threads one long string through the ring at the top of a small bell.",
        "alt": "Muddy threads string through the bell's ring."
      },
      {
        "scene": "Muddy ties the string onto a low tree branch; the bell hangs just above the ground.",
        "alt": "The bell hangs from a low branch."
      },
      {
        "scene": "Muddy has let go after pulling the bell; it swings just above the ground on the same string. No sound symbols.",
        "alt": "The hanging bell swings after Muddy lets go."
      }
    ],
    "alt": "First: Muddy threads string through the bell's ring. Next: The bell hangs from a low branch. Last: The hanging bell swings after Muddy lets go.",
    "src": "/images/comprehension/passages/muddy-ring.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Hangs the Ring\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy has a small bell with a ring on top. Muddy threads a long string through the ring. Muddy ties the string to a low branch. The bell hangs just above the ground. Muddy pulls the bell and lets go. The bell swings and makes a sound.\n\nFIRST / left panel: Muddy threads one long string through the ring at the top of a small bell.\n\nNEXT / middle panel: Muddy ties the string onto a low tree branch; the bell hangs just above the ground.\n\nLAST / right panel: Muddy has let go after pulling the bell; it swings just above the ground on the same string. No sound symbols.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "pip-lunch-box": {
    "sourceText": "Pip packs lunch in a box. Pip chops a carrot into short sticks. Then Pip adds cheese and a sandwich. The box has no room for an apple. Pip puts the apple in a small bag instead. Pip takes the box and bag to the picnic table.",
    "textSha256": "c2c262a0bff57f42a19eebddeeca756b1b0db8a7f2cbeff1b0e6280b6651cb6e",
    "kind": "comic",
    "panels": [
      {
        "scene": "Pip packs short carrot sticks, cheese and a sandwich into a lunch box; an apple waits outside the full box.",
        "alt": "The lunch box has no room for the apple."
      },
      {
        "scene": "Pip puts the whole apple into a separate small bag.",
        "alt": "Pip puts the apple in a small bag."
      },
      {
        "scene": "At a picnic table, Pip carries the packed lunch box and separate apple bag.",
        "alt": "Pip takes the box and bag to the picnic table."
      }
    ],
    "alt": "First: The lunch box has no room for the apple. Next: Pip puts the apple in a small bag. Last: Pip takes the box and bag to the picnic table.",
    "src": "/images/comprehension/passages/pip-lunch-box.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Packs Lunch\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip packs lunch in a box. Pip chops a carrot into short sticks. Then Pip adds cheese and a sandwich. The box has no room for an apple. Pip puts the apple in a small bag instead. Pip takes the box and bag to the picnic table.\n\nFIRST / left panel: Pip packs short carrot sticks, cheese and a sandwich into a lunch box; an apple waits outside the full box.\n\nNEXT / middle panel: Pip puts the whole apple into a separate small bag.\n\nLAST / right panel: At a picnic table, Pip carries the packed lunch box and separate apple bag.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "pip-sink": {
    "sourceText": "Pip paints a pot pink. After painting, Pip washes the brush in the sink. Pink water splashes onto the side of the sink. Pip gets a cloth and wipes the pink spots. Then Pip rinses the cloth and hangs it up. The brush stands in a jar to dry.",
    "textSha256": "15c7c6dfd2580d8c62d23ac48fdebb5c85df3f33616fe83530c5ccf2b608bc4d",
    "kind": "comic",
    "panels": [
      {
        "scene": "Pip rinses a paintbrush at a sink; water splashes on the sink side and a freshly painted pot stands safely nearby.",
        "alt": "Water splashes as Pip washes the brush."
      },
      {
        "scene": "Pip wipes the splashed spots with a cloth.",
        "alt": "Pip wipes the side of the sink."
      },
      {
        "scene": "The rinsed cloth hangs to dry and the brush stands bristles-up in a jar; Pip is beside the clean sink.",
        "alt": "The cloth and brush dry beside the clean sink."
      }
    ],
    "alt": "First: Water splashes as Pip washes the brush. Next: Pip wipes the side of the sink. Last: The cloth and brush dry beside the clean sink.",
    "src": "/images/comprehension/passages/pip-sink.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Cleans the Sink\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip paints a pot pink. After painting, Pip washes the brush in the sink. Pink water splashes onto the side of the sink. Pip gets a cloth and wipes the pink spots. Then Pip rinses the cloth and hangs it up. The brush stands in a jar to dry.\n\nFIRST / left panel: Pip rinses a paintbrush at a sink; water splashes on the sink side and a freshly painted pot stands safely nearby.\n\nNEXT / middle panel: Pip wipes the splashed spots with a cloth.\n\nLAST / right panel: The rinsed cloth hangs to dry and the brush stands bristles-up in a jar; Pip is beside the clean sink.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nPRECISION BLACK-AND-WHITE REPAIR: Input1 is approved Pip identity, Input2 is a prior otherwise correct comic. Preserve Input2 composition, objects, face and all actions exactly. Remove ONLY the pink/red tint from the pot in the left panel, replacing that fill with pure white. The whole asset must have absolutely no coloured pixels, including pink; pink is named in the text only and children will colour it themselves. Keep every black outline, including the irregular paint-drip outline on the pot. No other changes."
  },
  "fluff-bath-toy": {
    "sourceText": "Fluff finds a bath toy under a shelf. The toy is covered with dust. Fluff fills a bowl with warm water and washes the toy. Then Fluff wipes it with a towel. Fluff puts the clean toy beside the bath. The towel hangs on a hook to dry.",
    "textSha256": "82a18c9b6208bcafda1e2923cc21e61166609060de84838e5942dbd0376a412d",
    "kind": "comic",
    "panels": [
      {
        "scene": "Fluff finds a dusty bath toy beneath a shelf.",
        "alt": "Fluff finds a dusty toy under the shelf."
      },
      {
        "scene": "Fluff washes the toy in a bowl of water, with a towel ready beside it.",
        "alt": "Fluff washes the toy in a bowl."
      },
      {
        "scene": "The clean dry toy sits beside the bath and the used towel hangs on a hook; Fluff has finished wiping.",
        "alt": "The clean toy is by the bath and the towel dries."
      }
    ],
    "alt": "First: Fluff finds a dusty toy under the shelf. Next: Fluff washes the toy in a bowl. Last: The clean toy is by the bath and the towel dries.",
    "src": "/images/comprehension/passages/fluff-bath-toy.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff Washes a Bath Toy\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff finds a bath toy under a shelf. The toy is covered with dust. Fluff fills a bowl with warm water and washes the toy. Then Fluff wipes it with a towel. Fluff puts the clean toy beside the bath. The towel hangs on a hook to dry.\n\nFIRST / left panel: Fluff finds a dusty bath toy beneath a shelf.\n\nNEXT / middle panel: Fluff washes the toy in a bowl of water, with a towel ready beside it.\n\nLAST / right panel: The clean dry toy sits beside the bath and the used towel hangs on a hook; Fluff has finished wiping.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "fluff-clock": {
    "sourceText": "Fluff listens to a clock, but it does not tick. Fluff looks at the back. There is no battery inside. Fluff puts a new battery in the clock and shuts the back. Now the hands move. Fluff hangs the clock above the desk and checks the time.",
    "textSha256": "07e91aaf15e0a9668e4b7997f10e414fc511296292f2c89a68d26c0f0df15d89",
    "kind": "comic",
    "panels": [
      {
        "scene": "Fluff looks into the open back of a clock, showing one empty battery compartment.",
        "alt": "The clock has no battery."
      },
      {
        "scene": "Fluff inserts a new battery in the compartment; keep the front hands out of view.",
        "alt": "Fluff puts a battery in the clock."
      },
      {
        "scene": "The closed clock hangs above a desk and Fluff checks its hands; use unnumbered tick marks only.",
        "alt": "Fluff checks the clock above the desk."
      }
    ],
    "alt": "First: The clock has no battery. Next: Fluff puts a battery in the clock. Last: Fluff checks the clock above the desk.",
    "src": "/images/comprehension/passages/fluff-clock.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff Checks the Clock\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff listens to a clock, but it does not tick. Fluff looks at the back. There is no battery inside. Fluff puts a new battery in the clock and shuts the back. Now the hands move. Fluff hangs the clock above the desk and checks the time.\n\nFIRST / left panel: Fluff looks into the open back of a clock, showing one empty battery compartment.\n\nNEXT / middle panel: Fluff inserts a new battery in the compartment; keep the front hands out of view.\n\nLAST / right panel: The closed clock hangs above a desk and Fluff checks its hands; use unnumbered tick marks only.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-string-beads": {
    "sourceText": "Socks puts beads on a long string. Each bead has a hole through the middle. One bead will not go on. Its hole is full of clay. Socks puts that bead aside and chooses another. Socks ties the ends of the string together. Then Socks hangs the beads by the window.",
    "textSha256": "50598fb59ba725d6bc8495f3a06e10f41ee6cdf5b197bab78cc005df21b4b77a",
    "kind": "comic",
    "panels": [
      {
        "scene": "Socks holds one bead whose central hole is visibly blocked with clay, beside a partially threaded string of beads.",
        "alt": "Clay blocks one bead's hole."
      },
      {
        "scene": "Socks sets that blocked bead aside and threads a different bead with a clear hole.",
        "alt": "Socks chooses a bead with an open hole."
      },
      {
        "scene": "The string ends are tied together and the finished beads hang by the window; the blocked bead remains unused below.",
        "alt": "The tied beads hang by the window."
      }
    ],
    "alt": "First: Clay blocks one bead's hole. Next: Socks chooses a bead with an open hole. Last: The tied beads hang by the window.",
    "src": "/images/comprehension/passages/socks-string-beads.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Threads the Beads\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks puts beads on a long string. Each bead has a hole through the middle. One bead will not go on. Its hole is full of clay. Socks puts that bead aside and chooses another. Socks ties the ends of the string together. Then Socks hangs the beads by the window.\n\nFIRST / left panel: Socks holds one bead whose central hole is visibly blocked with clay, beside a partially threaded string of beads.\n\nNEXT / middle panel: Socks sets that blocked bead aside and threads a different bead with a clear hole.\n\nLAST / right panel: The string ends are tied together and the finished beads hang by the window; the blocked bead remains unused below.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-steps": {
    "sourceText": "Dry leaves cover the steps outside. Socks gets a broom and starts at the top. Socks sweeps each step, moving down towards the path. The leaves and dust fall onto the path. Socks sweeps them into a pile and fills a bag. The last step is clear now.",
    "textSha256": "2fbf5bb58efb950b27d037cebcdf8aeaab50b388075b67281e2f82acc1ac70ec",
    "kind": "comic",
    "panels": [
      {
        "scene": "Socks starts sweeping dry leaves from the top of outside steps with a broom.",
        "alt": "Socks starts sweeping at the top step."
      },
      {
        "scene": "Further down, Socks sweeps leaves off a lower step towards the path; the upper steps are clear.",
        "alt": "Socks sweeps leaves down onto the path."
      },
      {
        "scene": "All steps are clear. Socks fills a bag from the leaf pile on the path with the broom nearby.",
        "alt": "Socks bags the leaves beside the clear steps."
      }
    ],
    "alt": "First: Socks starts sweeping at the top step. Next: Socks sweeps leaves down onto the path. Last: Socks bags the leaves beside the clear steps.",
    "src": "/images/comprehension/passages/socks-steps.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Cleans the Steps\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Dry leaves cover the steps outside. Socks gets a broom and starts at the top. Socks sweeps each step, moving down towards the path. The leaves and dust fall onto the path. Socks sweeps them into a pile and fills a bag. The last step is clear now.\n\nFIRST / left panel: Socks starts sweeping dry leaves from the top of outside steps with a broom.\n\nNEXT / middle panel: Further down, Socks sweeps leaves off a lower step towards the path; the upper steps are clear.\n\nLAST / right panel: All steps are clear. Socks fills a bag from the leaf pile on the path with the broom nearby.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-brush": {
    "sourceText": "Chips uses a brush to paint a wooden box. Green paint sticks to the brush. Chips washes the brush before the paint can dry. Chips squeezes out the water and lays the brush flat. The dry brush goes on a shelf beside the paint.",
    "textSha256": "58b0a4fd63bf91fc577c7027134c0f166c726228cff5a2730d506c1d34205b28",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chips paints a wooden box with a wet brush; an open paint pot is nearby.",
        "alt": "Chips paints a wooden box."
      },
      {
        "scene": "Chips washes paint off the brush in water before it dries on the bristles.",
        "alt": "Chips washes the paint from the brush."
      },
      {
        "scene": "The clean dry brush lies flat on a shelf beside the paint pot; the painted box remains nearby.",
        "alt": "The dry brush lies flat beside the paint."
      }
    ],
    "alt": "First: Chips paints a wooden box. Next: Chips washes the paint from the brush. Last: The dry brush lies flat beside the paint.",
    "src": "/images/comprehension/passages/chips-brush.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips Washes a Brush\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips uses a brush to paint a wooden box. Green paint sticks to the brush. Chips washes the brush before the paint can dry. Chips squeezes out the water and lays the brush flat. The dry brush goes on a shelf beside the paint.\n\nFIRST / left panel: Chips paints a wooden box with a wet brush; an open paint pot is nearby.\n\nNEXT / middle panel: Chips washes paint off the brush in water before it dries on the bristles.\n\nLAST / right panel: The clean dry brush lies flat on a shelf beside the paint pot; the painted box remains nearby.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-chest": {
    "sourceText": "Chips keeps dress-up clothes in a chest. Chips wants a scarf for a puppet. The chest will not open. Chips checks the front and lifts the little latch. Now the lid opens. Chips finds a scarf under a hat. Chips wraps the scarf around the puppet.",
    "textSha256": "ced25bbc7f2591a3352829a4271040415510af8b5ac60a844bfb89606fec276a",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chips faces a shut dress-up chest, holding its lid without opening it because the little front latch is still down.",
        "alt": "The latch keeps the chest shut."
      },
      {
        "scene": "Chips lifts the front latch, with the lid beginning to open.",
        "alt": "Chips lifts the latch."
      },
      {
        "scene": "The chest is open with a hat above the scarf's former place; Chips wraps the recovered scarf around a puppet.",
        "alt": "Chips wraps the scarf around the puppet."
      }
    ],
    "alt": "First: The latch keeps the chest shut. Next: Chips lifts the latch. Last: Chips wraps the scarf around the puppet.",
    "src": "/images/comprehension/passages/chips-chest.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips Opens the Chest\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips keeps dress-up clothes in a chest. Chips wants a scarf for a puppet. The chest will not open. Chips checks the front and lifts the little latch. Now the lid opens. Chips finds a scarf under a hat. Chips wraps the scarf around the puppet.\n\nFIRST / left panel: Chips faces a shut dress-up chest, holding its lid without opening it because the little front latch is still down.\n\nNEXT / middle panel: Chips lifts the front latch, with the lid beginning to open.\n\nLAST / right panel: The chest is open with a hat above the scarf's former place; Chips wraps the recovered scarf around a puppet.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chompy-thin-paper": {
    "sourceText": "Chompy wants to fold a paper hat. The first sheet is thick and hard to fold. Chompy puts it aside and picks a thin sheet. Chompy folds the thin paper with both hands. The hat fits a toy bear. Chompy puts the bear on a chair with its new hat.",
    "textSha256": "3de3f64cfa6344624c649549449028ead2cc302ad3d3ff358f8e2852c4bfabea",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chompy tries to fold a thick paper sheet; it resists and is set beside a thin sheet.",
        "alt": "The thick paper is hard to fold."
      },
      {
        "scene": "Chompy folds the separate thin sheet with both hands; the thick sheet stays unused at the side.",
        "alt": "Chompy folds the thin paper."
      },
      {
        "scene": "A toy bear sits on a chair wearing the finished paper hat, with Chompy nearby. Bear is much smaller than Chompy.",
        "alt": "The toy bear wears the paper hat."
      }
    ],
    "alt": "First: The thick paper is hard to fold. Next: Chompy folds the thin paper. Last: The toy bear wears the paper hat.",
    "src": "/images/comprehension/passages/chompy-thin-paper.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Folds Paper\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy wants to fold a paper hat. The first sheet is thick and hard to fold. Chompy puts it aside and picks a thin sheet. Chompy folds the thin paper with both hands. The hat fits a toy bear. Chompy puts the bear on a chair with its new hat.\n\nFIRST / left panel: Chompy tries to fold a thick paper sheet; it resists and is set beside a thin sheet.\n\nNEXT / middle panel: Chompy folds the separate thin sheet with both hands; the thick sheet stays unused at the side.\n\nLAST / right panel: A toy bear sits on a chair wearing the finished paper hat, with Chompy nearby. Bear is much smaller than Chompy.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chompy-stamp": {
    "sourceText": "Chompy draws a card for Fluff. Chompy writes Fluff’s address on an envelope. The card goes inside. Chompy sticks a stamp in the top corner and closes the envelope. Then Chompy walks to the post box. Chompy drops the envelope through the slot and goes home.",
    "textSha256": "51550dcdf0ed76f0aaf644b338dd98f927055fa10ef35b72935a2a045e36f965",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chompy slides a picture card into an envelope with a blank address face; no lettering or address marks.",
        "alt": "Chompy puts the card in an envelope."
      },
      {
        "scene": "Chompy attaches exactly one plain stamp rectangle in the upper-right corner of the visible plain FRONT address face of the envelope. The flap closes on its unseen back; do not draw diagonal flap seams across the front. The address area stays blank.",
        "alt": "Chompy stamps and closes the envelope."
      },
      {
        "scene": "Chompy drops that envelope through a post-box slot; envelope and slot are large and clear, no postal lettering.",
        "alt": "Chompy posts the envelope through the slot."
      }
    ],
    "alt": "First: Chompy puts the card in an envelope. Next: Chompy stamps and closes the envelope. Last: Chompy posts the envelope through the slot.",
    "src": "/images/comprehension/passages/chompy-stamp.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Posts a Card\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy draws a card for Fluff. Chompy writes Fluff’s address on an envelope. The card goes inside. Chompy sticks a stamp in the top corner and closes the envelope. Then Chompy walks to the post box. Chompy drops the envelope through the slot and goes home.\n\nFIRST / left panel: Chompy slides a picture card into an envelope with a blank address face; no lettering or address marks.\n\nNEXT / middle panel: Chompy attaches exactly one plain stamp rectangle in the upper-right corner of the visible plain FRONT address face of the envelope. The flap closes on its unseen back; do not draw diagonal flap seams across the front. The address area stays blank.\n\nLAST / right panel: Chompy drops that envelope through a post-box slot; envelope and slot are large and clear, no postal lettering.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nPostage-face lock: show the stamp on the plain FRONT face in the upper-right corner, never on the back flap. No diagonal flap seams anywhere on the stamped front face. The flap is on the unseen reverse side. No writing, text marks, brand, numeral or extra stamps."
  },
  "muddy-bike-tyre": {
    "sourceText": "Muddy wants to ride a bike. One tyre looks flat. Muddy puts the bike on its side and gets a pump. Muddy adds air until the tyre feels firm. Then Muddy puts on a helmet and checks the brakes. The bike is ready for a ride in the park.",
    "textSha256": "d1d02b0aa15903bcefc526c41a762dadcb4aac858671df7b7e359a83866ee7ec",
    "kind": "comic",
    "panels": [
      {
        "scene": "Muddy examines a bike with one visibly flat tyre. The bike is stationary.",
        "alt": "Muddy finds a flat bike tyre."
      },
      {
        "scene": "The bike lies on its side while Muddy pumps air into that tyre; hose visibly joins its valve.",
        "alt": "Muddy pumps up the tyre."
      },
      {
        "scene": "Muddy wears a helmet and checks the brakes on the upright bike with both tyres firm, before riding.",
        "alt": "Muddy checks the ready bike while wearing a helmet."
      }
    ],
    "alt": "First: Muddy finds a flat bike tyre. Next: Muddy pumps up the tyre. Last: Muddy checks the ready bike while wearing a helmet.",
    "src": "/images/comprehension/passages/muddy-bike-tyre.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Pumps the Tyre\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy wants to ride a bike. One tyre looks flat. Muddy puts the bike on its side and gets a pump. Muddy adds air until the tyre feels firm. Then Muddy puts on a helmet and checks the brakes. The bike is ready for a ride in the park.\n\nFIRST / left panel: Muddy examines a bike with one visibly flat tyre. The bike is stationary.\n\nNEXT / middle panel: The bike lies on its side while Muddy pumps air into that tyre; hose visibly joins its valve.\n\nLAST / right panel: Muddy wears a helmet and checks the brakes on the upright bike with both tyres firm, before riding.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "muddy-gate": {
    "sourceText": "Muddy made a small garden beside the house. The garden has a gate. A stone is in the space under the gate. Muddy tries to close it, but the stone stops it. Muddy moves the stone beside a pot. Now the gate closes and stays shut.",
    "textSha256": "4538be2df656803a393ad031c11d023f74d55544e5e2670f5d435c3f25f5f5b3",
    "kind": "comic",
    "panels": [
      {
        "scene": "Muddy tries to close a small garden gate beside the house; a stone visibly blocks the space beneath it.",
        "alt": "A stone stops the garden gate closing."
      },
      {
        "scene": "Muddy moves the stone to the ground beside a pot, clearing the gate's swing.",
        "alt": "Muddy puts the stone beside a pot."
      },
      {
        "scene": "The gate is fully shut; Muddy stands beside it and the stone remains away by the pot.",
        "alt": "The clear garden gate stays shut."
      }
    ],
    "alt": "First: A stone stops the garden gate closing. Next: Muddy puts the stone beside a pot. Last: The clear garden gate stays shut.",
    "src": "/images/comprehension/passages/muddy-gate.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Closes the Gate\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy made a small garden beside the house. The garden has a gate. A stone is in the space under the gate. Muddy tries to close it, but the stone stops it. Muddy moves the stone beside a pot. Now the gate closes and stays shut.\n\nFIRST / left panel: Muddy tries to close a small garden gate beside the house; a stone visibly blocks the space beneath it.\n\nNEXT / middle panel: Muddy moves the stone to the ground beside a pot, clearing the gate's swing.\n\nLAST / right panel: The gate is fully shut; Muddy stands beside it and the stone remains away by the pot.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "pip-tape": {
    "sourceText": "Pip turns a page in a picture book. The page has a small tear near the bottom. Pip puts the book flat on a table. Pip holds the torn parts together and adds clear tape. The tape keeps the parts in place. Pip turns the page slowly and keeps reading.",
    "textSha256": "f7a3f8ca89a3cbf79ce84793cdd6271a9ecdf2d6f102dfdf8a568291c54eab22",
    "kind": "comic",
    "panels": [
      {
        "scene": "Pip sees a small tear near the bottom of a picture-book page; the book has pictures without lettering. The intact opposite page has a simple unlettered tree picture.",
        "alt": "Pip finds a torn book page."
      },
      {
        "scene": "The book lies flat on the table while Pip holds the torn edges together and applies clear tape. Keep that same unlettered tree picture on the intact page.",
        "alt": "Pip tapes the torn parts together."
      },
      {
        "scene": "Pip gently turns the repaired page, with the taped lower edge visibly joined and the book supported. The intact page retains the same tree picture; no page text.",
        "alt": "Pip turns the repaired page slowly."
      }
    ],
    "alt": "First: Pip finds a torn book page. Next: Pip tapes the torn parts together. Last: Pip turns the repaired page slowly.",
    "src": "/images/comprehension/passages/pip-tape.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Mends a Page\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip turns a page in a picture book. The page has a small tear near the bottom. Pip puts the book flat on a table. Pip holds the torn parts together and adds clear tape. The tape keeps the parts in place. Pip turns the page slowly and keeps reading.\n\nFIRST / left panel: Pip sees a small tear near the bottom of a picture-book page; the book has pictures without lettering.\n\nNEXT / middle panel: The book lies flat on the table while Pip holds the torn edges together and applies clear tape.\n\nLAST / right panel: Pip gently turns the repaired page, with the taped lower edge visibly joined and the book supported.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. The book is a picture book being read: show one simple unlettered tree picture on its intact page. The opposite page has the tear being repaired. Do not leave the picture book blank. All other surfaces have no writing. Do not draw the source passage or title into the art.\n\nKeep the same simple uncoloured tree illustration visible on the intact page throughout the three panels; the tear and clear repair tape are on the opposite page. This picture inside the book is a small plain drawing, not a new story event. Keep everything black outlines on pure white; no coloured fill."
  },
  "pip-cone": {
    "sourceText": "Pip comes home with wet boots. Water drips onto the floor by the door. Pip takes off the boots and gets a mop. After mopping, Pip puts a cone beside the damp spot. The cone shows where to walk around. When the floor is dry, Pip puts the cone away.",
    "textSha256": "adaa72f894bc00cbd72f685601a9b866daed5c15611fae37f51acfb48e7f26f8",
    "kind": "comic",
    "panels": [
      {
        "scene": "By the doorway, water drips from Pip's boots onto the floor.",
        "alt": "Pip's wet boots drip by the door."
      },
      {
        "scene": "Boots are off. Pip has mopped and places a plain cone beside the remaining damp patch, leaving walking space around it.",
        "alt": "Pip marks the damp floor with a cone."
      },
      {
        "scene": "The floor is dry without a puddle, and Pip carries the cone away from that spot.",
        "alt": "Pip puts the cone away after the floor dries."
      }
    ],
    "alt": "First: Pip's wet boots drip by the door. Next: Pip marks the damp floor with a cone. Last: Pip puts the cone away after the floor dries.",
    "src": "/images/comprehension/passages/pip-cone.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Marks a Wet Floor\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip comes home with wet boots. Water drips onto the floor by the door. Pip takes off the boots and gets a mop. After mopping, Pip puts a cone beside the damp spot. The cone shows where to walk around. When the floor is dry, Pip puts the cone away.\n\nFIRST / left panel: By the doorway, water drips from Pip's boots onto the floor.\n\nNEXT / middle panel: Boots are off. Pip has mopped and places a plain cone beside the remaining damp patch, leaving walking space around it.\n\nLAST / right panel: The floor is dry without a puddle, and Pip carries the cone away from that spot.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nPRECISION FOOTWEAR REPAIR: Input1 is approved Pip identity; input2 is a prior otherwise-correct comic. Preserve the first panel exactly: Pip removes a dripping boot by the door. In ONLY the second and third panels, remove the boots from Pip and show his two bare feet, with the removed pair of wet boots standing together by the doorway in the background. In the third panel Pip carries the cone away on a now dry floor; he must not put wet boots back on. Keep all other faces, objects, black outlines and actions exactly as input2. No colour or grey fills.\n\nFINAL PRECISION STATE REPAIR: Use input2 as the otherwise-correct barefoot comic. In ONLY the third/right panel, erase the two small outlined water-drop/oval shapes immediately beneath/beside the stored boots at the far left. The final floor must be completely dry. Leave the first two panels, bare feet, removed boots, cone, hands, face and all other outlines exactly unchanged. Do not add anything."
  },
  "fluff-hike": {
    "sourceText": "Fluff takes water on a hike. The path climbs a hill. At the top, Fluff stops by a wide tree. Fluff puts the bag on the ground and drinks some water. A bench is on the other side of the tree. Fluff sits there before walking down the hill.",
    "textSha256": "80c444f294e7369ad758be501925bf0f078646c10e141b1170e389d680e05911",
    "kind": "scene",
    "panels": [
      {
        "scene": "At the top of the hill, Fluff rests on the bench on the far side of a wide tree. The bag remains on the ground where Fluff stopped to drink, on the near side of the tree; the hill path slopes down nearby.",
        "alt": "Fluff rests on a bench beyond the wide tree at the top of the hill."
      }
    ],
    "alt": "Fluff rests on a bench beyond the wide tree at the top of the hill.",
    "src": "/images/comprehension/passages/fluff-hike.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished single coherent landscape story scene for the original Reading Comprehension passage \"Fluff Stops on a Hike\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff takes water on a hike. The path climbs a hill. At the top, Fluff stops by a wide tree. Fluff puts the bag on the ground and drinks some water. A bench is on the other side of the tree. Fluff sits there before walking down the hill.\n\nSCENE: At the top of the hill, Fluff rests on the bench on the far side of a wide tree. The bag remains on the ground where Fluff stopped to drink, on the near side of the tree; the hill path slopes down nearby.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-hose": {
    "sourceText": "Socks comes home and checks a rose plant. The soil in its pot is dry. Socks turns on the hose, but no water comes out. The hose is bent under a chair leg. Socks moves the chair and straightens the hose. Water comes out, and Socks waters the plant.",
    "textSha256": "21c6dd1b4f8e28c46f07d19a3b97040564b9e34988ad57fad46efddcee5e0d05",
    "kind": "comic",
    "panels": [
      {
        "scene": "Beside a dry potted rose, Socks holds a hose with no water emerging; the hose is sharply bent under a chair leg.",
        "alt": "A chair leg bends the hose shut."
      },
      {
        "scene": "Socks moves the chair off the hose and straightens the bend.",
        "alt": "Socks frees and straightens the hose."
      },
      {
        "scene": "Water flows from the straight hose onto the soil in the rose pot; the chair stays clear.",
        "alt": "Socks waters the rose with the flowing hose."
      }
    ],
    "alt": "First: A chair leg bends the hose shut. Next: Socks frees and straightens the hose. Last: Socks waters the rose with the flowing hose.",
    "src": "/images/comprehension/passages/socks-hose.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Uses the Hose\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks comes home and checks a rose plant. The soil in its pot is dry. Socks turns on the hose, but no water comes out. The hose is bent under a chair leg. Socks moves the chair and straightens the hose. Water comes out, and Socks waters the plant.\n\nFIRST / left panel: Beside a dry potted rose, Socks holds a hose with no water emerging; the hose is sharply bent under a chair leg.\n\nNEXT / middle panel: Socks moves the chair off the hose and straightens the bend.\n\nLAST / right panel: Water flows from the straight hose onto the soil in the rose pot; the chair stays clear.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nPrecise anatomy correction for the supplied candidate image: change only the rightmost panel. Socks must have exactly TWO arms and TWO hands total. Keep the one lower hand gripping the hose/nozzle handle and the one hand naturally resting at the side. Remove the extra hand-shaped lobes above the nozzle: the top of the nozzle is a plain smooth mechanical tube, never another hand or fingers. Preserve the other panels, hose/nozzle, flowing water into rose-pot soil, chair position, monkey identity, vest, tail and all story states. Keep genuine unfilled black outlines on white; no coloured fills."
  },
  "chips-race": {
    "sourceText": "Chips sets up a toy car race. Chips draws a line on a long board. Five toy cars wait at the line. Chips lifts one end of the board with a block. The cars roll down together. The yellow car stops first. The red car rolls to the end.",
    "textSha256": "aa89496ab4c79171510236ae3e39160db6c1a9c66270c02aa12a49f0784270ff",
    "kind": "comic",
    "panels": [
      {
        "scene": "Exactly five toy cars wait on a plain line across a long board; Chips holds a block at one end.",
        "alt": "Five toy cars wait on the board's line."
      },
      {
        "scene": "The block supports one end of the board and all five cars roll down the slope.",
        "alt": "Chips makes a slope and the cars roll down."
      },
      {
        "scene": "One car has stopped partway while another reaches the board's end; the other three are still between them. No colour keys or winner markings.",
        "alt": "One car stops early and another reaches the end."
      }
    ],
    "alt": "First: Five toy cars wait on the board's line. Next: Chips makes a slope and the cars roll down. Last: One car stops early and another reaches the end.",
    "src": "/images/comprehension/passages/chips-race.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips Sets Up a Race\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips sets up a toy car race. Chips draws a line on a long board. Five toy cars wait at the line. Chips lifts one end of the board with a block. The cars roll down together. The yellow car stops first. The red car rolls to the end.\n\nFIRST / left panel: Exactly five toy cars wait on a plain line across a long board; Chips holds a block at one end.\n\nNEXT / middle panel: The block supports one end of the board and all five cars roll down the slope.\n\nLAST / right panel: One car has stopped partway while another reaches the board's end; the other three are still between them. No colour keys or winner markings.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nFinal-panel count lock: keep exactly FIVE cars visible in ALL three panels. In the LAST panel one car is stopped high on the board, exactly THREE other cars are midway down, and one car is at the far end: 1+3+1=5 total. Never omit one of the five. Keep each separate with clear gaps, no overlapping cars.\n\nMiddle-panel count correction: exactly FIVE separate rolling cars must be visible in the middle panel, arranged one at the top, THREE spaced along the middle, and one at the bottom. Count the middle panel independently: 1+3+1=5. Do not hide or omit a car behind Chips or another car. Leave sufficient visible board length for all five cars. The first and last panels ALSO retain exactly five cars; this constraint applies to ALL THREE panels."
  },
  "chompy-case": {
    "sourceText": "Chompy packs a small case for a visit. A shirt, socks and a book fit inside. Pip has a case the same size and colour. Chompy writes a name on a card. The card hangs from the handle. Both cases sit by the door. Chompy can find the right case by reading the name.",
    "textSha256": "cf7061c79eb67c56e9a3a8d00e36e7593fa606451af6117f362c9e640791e17f",
    "kind": "comic",
    "panels": [
      {
        "scene": "Chompy packs a shirt, socks and a book in an open small case; Pip's second case of the same shape and size sits beside it. Pip is shorter than Chompy.",
        "alt": "Chompy packs a case beside Pip's matching case."
      },
      {
        "scene": "Chompy attaches a plain name-card rectangle to the packed case's handle; do not draw writing or substitute symbols.",
        "alt": "Chompy hangs a card from the case handle."
      },
      {
        "scene": "Both closed cases sit by the door; Chompy looks at the card on the correct handle. Pip stands beside the other case, shorter than Chompy.",
        "alt": "Chompy checks the card on the case by the door."
      }
    ],
    "alt": "First: Chompy packs a case beside Pip's matching case. Next: Chompy hangs a card from the case handle. Last: Chompy checks the card on the case by the door.",
    "src": "/images/comprehension/passages/chompy-case.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Packs a Case\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks. DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy packs a small case for a visit. A shirt, socks and a book fit inside. Pip has a case the same size and colour. Chompy writes a name on a card. The card hangs from the handle. Both cases sit by the door. Chompy can find the right case by reading the name.\n\nFIRST / left panel: Chompy packs a shirt, socks and a book in an open small case; Pip's second case of the same shape and size sits beside it. Pip is shorter than Chompy.\n\nNEXT / middle panel: Chompy attaches a plain name-card rectangle to the packed case's handle; do not draw writing or substitute symbols.\n\nLAST / right panel: Both closed cases sit by the door; Chompy looks at the card on the correct handle. Pip stands beside the other case, shorter than Chompy.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "muddy-train": {
    "sourceText": "Muddy waits for a train behind the yellow line. The train stops beside the platform. Muddy checks the number on the door. It matches the number on the ticket. Muddy steps onto the train and finds a seat. The doors close before the train moves away.",
    "textSha256": "ed8149822c9dfca0bf6e6c3e0714040974699e45a8e666e9f86a5d1180d3b2d1",
    "kind": "comic",
    "panels": [
      {
        "scene": "Muddy waits safely behind a platform line while a train stops alongside; no numbers or station lettering.",
        "alt": "Muddy waits behind the platform line."
      },
      {
        "scene": "At the stopped train's open door, Muddy compares a ticket with the plain number-plate area; both stay unlettered. The ticket and train door each clearly display the same single numeral 2.",
        "alt": "Muddy checks the ticket at the train door."
      },
      {
        "scene": "Muddy sits inside the train with the carriage doors visibly closed; show no open doorway or boarding movement.",
        "alt": "Muddy sits inside after the train doors close."
      }
    ],
    "alt": "First: Muddy waits behind the platform line. Next: Muddy checks the ticket at the train door. Last: Muddy sits inside after the train doors close.",
    "src": "/images/comprehension/passages/muddy-train.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Takes the Train\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy waits for a train behind the yellow line. The train stops beside the platform. Muddy checks the number on the door. It matches the number on the ticket. Muddy steps onto the train and finds a seat. The doors close before the train moves away.\n\nFIRST / left panel: Muddy waits safely behind a platform line while a train stops alongside; no numbers or station lettering.\n\nNEXT / middle panel: At the stopped train's open door, Muddy compares a ticket with the plain number-plate area; both stay unlettered.\n\nLAST / right panel: Muddy sits inside the train with the carriage doors visibly closed; show no open doorway or boarding movement.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. The matching ticket and train door numbers are plot-essential: print the same single large numeral 2 on both, clearly visible. No other writing or numbers. Do not draw the source passage or title into the art.\n\nThe ticket and train door in the middle panel must each clearly display the same single numeral 2; this is the only permitted printed numeral, required by the actual story. Ignore the general no-number instruction only for these two matching numbers."
  },
  "muddy-hay": {
    "sourceText": "Muddy helps at a farm for a day. Dry hay is in a tray by the rabbit pen. Muddy fills the rack with hay. Some hay falls onto the floor outside the pen. Muddy sweeps it up and puts it in a bucket. The rabbits pull hay from the rack and eat.",
    "textSha256": "e74568a81e69c78b8a84760971ac56870e9377c93f3361c346542b3bf8a768e6",
    "kind": "comic",
    "panels": [
      {
        "scene": "At the farm, Muddy fills a rack inside the rabbit pen with dry hay from a tray outside. Rabbits are small ordinary animals below Muddy's knee.",
        "alt": "Muddy fills the rabbits' hay rack."
      },
      {
        "scene": "Some hay lies outside the pen; Muddy sweeps it into a bucket, with the filled rack still visible.",
        "alt": "Muddy sweeps spilled hay into a bucket."
      },
      {
        "scene": "Small rabbits pull hay from the rack and eat while Muddy stands outside beside the cleared floor and bucket.",
        "alt": "The rabbits eat from the filled rack."
      }
    ],
    "alt": "First: Muddy fills the rabbits' hay rack. Next: Muddy sweeps spilled hay into a bucket. Last: The rabbits eat from the filled rack.",
    "src": "/images/comprehension/passages/muddy-hay.webp",
    "referencePath": "/images/worksheets/muddy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Muddy Fills the Hay Rack\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Muddy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Muddy helps at a farm for a day. Dry hay is in a tray by the rabbit pen. Muddy fills the rack with hay. Some hay falls onto the floor outside the pen. Muddy sweeps it up and puts it in a bucket. The rabbits pull hay from the rack and eat.\n\nFIRST / left panel: At the farm, Muddy fills a rack inside the rabbit pen with dry hay from a tray outside. Rabbits are small ordinary animals below Muddy's knee.\n\nNEXT / middle panel: Some hay lies outside the pen; Muddy sweeps it into a bucket, with the filled rack still visible.\n\nLAST / right panel: Small rabbits pull hay from the rack and eat while Muddy stands outside beside the cleared floor and bucket.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "pip-sheep": {
    "sourceText": "Pip sees three sheep in a field. Two sheep stand by a tree. Pip cannot see the third sheep from the gate. Pip walks along the fence and looks behind a bush. The third sheep is resting there. Pip can see all three sheep from this spot.",
    "textSha256": "726ad428e65060e99d97bbb1ac085cff38d00f32dfdefb9b3becfcfd3d564586",
    "kind": "scene",
    "panels": [
      {
        "scene": "From the new position, Pip can see all three sheep: two standing by the tree and one resting behind the bush. All sheep waist-high to Pip.",
        "alt": "Pip sees all three sheep from the new spot."
      }
    ],
    "alt": "Pip sees all three sheep from the new spot.",
    "src": "/images/comprehension/passages/pip-sheep.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished single coherent landscape story scene for the original Reading Comprehension passage \"Pip Counts the Sheep\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip sees three sheep in a field. Two sheep stand by a tree. Pip cannot see the third sheep from the gate. Pip walks along the fence and looks behind a bush. The third sheep is resting there. Pip can see all three sheep from this spot.\n\nSCENE: From the new position, Pip can see all three sheep: two standing by the tree and one resting behind the bush. All sheep waist-high to Pip.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "pip-tea": {
    "sourceText": "Pip makes tea with mint leaves and warm water. Pip waits until the tea is cool. Then Pip puts ice in two cups. Pip pours tea into each cup and adds a lemon slice. Socks takes one cup to the garden table. Pip carries the other cup and a plate of crackers.",
    "textSha256": "bea22cac5efff1550e9ba2173bae912d3fcc03e7425e243542f25c81d824ef3f",
    "kind": "comic",
    "panels": [
      {
        "scene": "Pip pours cooled mint tea into exactly two cups containing ice, with mint leaves nearby.",
        "alt": "Pip pours cool tea into two cups with ice."
      },
      {
        "scene": "Pip adds one lemon slice to each cup, and a plate of crackers waits beside them.",
        "alt": "Pip adds lemon to the two cups."
      },
      {
        "scene": "Socks carries one cup to a garden table; Pip follows with the other cup and crackers. Socks is shorter than Pip.",
        "alt": "Pip and Socks take the tea and crackers outside."
      }
    ],
    "alt": "First: Pip pours cool tea into two cups with ice. Next: Pip adds lemon to the two cups. Last: Pip and Socks take the tea and crackers outside.",
    "src": "/images/comprehension/passages/pip-tea.webp",
    "referencePath": "/images/worksheets/pip-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Pip Makes Cold Tea\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks. GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Pip. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Pip makes tea with mint leaves and warm water. Pip waits until the tea is cool. Then Pip puts ice in two cups. Pip pours tea into each cup and adds a lemon slice. Socks takes one cup to the garden table. Pip carries the other cup and a plate of crackers.\n\nFIRST / left panel: Pip pours cooled mint tea into exactly two cups containing ice, with mint leaves nearby.\n\nNEXT / middle panel: Pip adds one lemon slice to each cup, and a plate of crackers waits beside them.\n\nLAST / right panel: Socks carries one cup to a garden table; Pip follows with the other cup and crackers. Socks is shorter than Pip.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "fluff-toast": {
    "sourceText": "Fluff puts bread in the toaster. Fluff takes off a coat while the bread cooks. When the toast pops up, Fluff puts it on a plate. Fluff spreads butter on one slice and jam on the other. Fluff carries the plate to the table with a cup of milk.",
    "textSha256": "d1c40a00ee1f2acfe35a2518c89373a4b0e46bb5d733dafac744814d86628d29",
    "kind": "scene",
    "panels": [
      {
        "scene": "At the table, Fluff sets down a plate with butter on one slice and jam on the other, beside a cup of milk.",
        "alt": "Fluff brings the two toast slices and milk to the table."
      }
    ],
    "alt": "Fluff brings the two toast slices and milk to the table.",
    "src": "/images/comprehension/passages/fluff-toast.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished single coherent landscape story scene for the original Reading Comprehension passage \"Fluff Makes Toast\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff puts bread in the toaster. Fluff takes off a coat while the bread cooks. When the toast pops up, Fluff puts it on a plate. Fluff spreads butter on one slice and jam on the other. Fluff carries the plate to the table with a cup of milk.\n\nSCENE: At the table, Fluff sets down a plate with butter on one slice and jam on the other, beside a cup of milk.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "fluff-snow-boots": {
    "sourceText": "Fluff walks home through the snow. Snow sticks to the boots. At the door, Fluff brushes the snow off outside. Then Fluff puts the boots on a tray below the window. A little water drips into the tray as the last snow melts. The floor stays dry.",
    "textSha256": "a5343332eed51e00774d53ff9c8a93715f2cc559d8370c61c1061c180b5c3c2c",
    "kind": "comic",
    "panels": [
      {
        "scene": "Outside the doorway, Fluff brushes snow off the boots before entering.",
        "alt": "Fluff brushes snow from the boots outside."
      },
      {
        "scene": "Inside, both removed boots stand on one tray beneath the window, with a little snow still on them.",
        "alt": "Fluff puts the boots on a tray below the window."
      },
      {
        "scene": "A few drops from the last melting snow stay within that tray; the surrounding floor is dry, and Fluff looks at it.",
        "alt": "The tray catches melting snow and keeps the floor dry."
      }
    ],
    "alt": "First: Fluff brushes snow from the boots outside. Next: Fluff puts the boots on a tray below the window. Last: The tray catches melting snow and keeps the floor dry.",
    "src": "/images/comprehension/passages/fluff-snow-boots.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff Leaves Snow Outside\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff walks home through the snow. Snow sticks to the boots. At the door, Fluff brushes the snow off outside. Then Fluff puts the boots on a tray below the window. A little water drips into the tray as the last snow melts. The floor stays dry.\n\nFIRST / left panel: Outside the doorway, Fluff brushes snow off the boots before entering.\n\nNEXT / middle panel: Inside, both removed boots stand on one tray beneath the window, with a little snow still on them.\n\nLAST / right panel: A few drops from the last melting snow stay within that tray; the surrounding floor is dry, and Fluff looks at it.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nLead and melting correction: show exactly ONE Fluff in EACH of the three panels, including the middle panel beside the boot tray. Fluff is placing the two removed boots on the tray in the middle. Final panel: the boots are almost completely free of snow, with ONLY one tiny remaining patch melting and a few water drops caught INSIDE the tray. No large snow caps or snow heaps on the final boots. All floor outside the tray is completely dry."
  },
  "fluff-night-bag": {
    "sourceText": "Fluff packs a swimming bag at night. A towel and goggles go inside. Fluff turns on a bright light to check the bag. The swimsuit is still on the bed. Fluff folds it and adds it to the bag. Then Fluff puts the full bag beside the door for morning.",
    "textSha256": "ea24a37f78513dd8ec7508b94b52f12b0bb59858fd175278696973b096098996",
    "kind": "comic",
    "panels": [
      {
        "scene": "At night, Fluff packs a towel and goggles into a swimming bag; a swimsuit lies separately on the bed.",
        "alt": "Fluff packs the towel and goggles."
      },
      {
        "scene": "Under a bright lamp, Fluff notices and folds the swimsuit from the bed; the open bag remains nearby.",
        "alt": "Fluff folds the swimsuit left on the bed."
      },
      {
        "scene": "Fluff puts the full bag by the door with towel, goggles and folded swimsuit just visible at its opening.",
        "alt": "The packed swimming bag waits by the door."
      }
    ],
    "alt": "First: Fluff packs the towel and goggles. Next: Fluff folds the swimsuit left on the bed. Last: The packed swimming bag waits by the door.",
    "src": "/images/comprehension/passages/fluff-night-bag.webp",
    "referencePath": "/images/worksheets/fluff-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Fluff Packs at Night\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-FLUFF, Little Literacy Guides companion Fluff: small shaggy brown puppy, floppy furry ears, fluffy muzzle and chest, black nose, round eyes, rounded paws and short furry tail. Preserve reference shaggy silhouette without hatching; no default clothing.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Fluff. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Fluff packs a swimming bag at night. A towel and goggles go inside. Fluff turns on a bright light to check the bag. The swimsuit is still on the bed. Fluff folds it and adds it to the bag. Then Fluff puts the full bag beside the door for morning.\n\nFIRST / left panel: At night, Fluff packs a towel and goggles into a swimming bag; a swimsuit lies separately on the bed.\n\nNEXT / middle panel: Under a bright lamp, Fluff notices and folds the swimsuit from the bed; the open bag remains nearby.\n\nLAST / right panel: Fluff puts the full bag by the door with towel, goggles and folded swimsuit just visible at its opening.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nNight-window colouring correction: every part of the window and night sky remains PURE WHITE with only a simple outlined crescent moon to indicate night. Absolutely NO black sky, solid black window rectangle, grey fill, shaded room or large dark region anywhere. All sky, window glass, walls, bag and clothes have white interiors bounded by black lines."
  },
  "socks-blue-glue": {
    "sourceText": "Socks covers a small box with blue paper. One corner of the paper sticks up. Socks puts glue under that corner and presses it down. Socks holds it still while the glue dries. Then Socks puts pencils in the box. The blue box stands on the desk beside a notebook.",
    "textSha256": "832ab2046402b659738b6ab46663cf2665fd79946a588140b54e4a84d6c64ba5",
    "kind": "comic",
    "panels": [
      {
        "scene": "On a desk, Socks examines a paper-covered box with one loose corner sticking up.",
        "alt": "One paper corner lifts off the box."
      },
      {
        "scene": "Socks applies glue beneath that corner and holds it pressed flat against the box.",
        "alt": "Socks glues and holds the loose corner down."
      },
      {
        "scene": "The dry smooth paper-covered box holds pencils beside an unlettered notebook on the desk; Socks stands nearby.",
        "alt": "Pencils stand in the finished box."
      }
    ],
    "alt": "First: One paper corner lifts off the box. Next: Socks glues and holds the loose corner down. Last: Pencils stand in the finished box.",
    "src": "/images/comprehension/passages/socks-blue-glue.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Makes a Blue Box\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks covers a small box with blue paper. One corner of the paper sticks up. Socks puts glue under that corner and presses it down. Socks holds it still while the glue dries. Then Socks puts pencils in the box. The blue box stands on the desk beside a notebook.\n\nFIRST / left panel: On a desk, Socks examines a paper-covered box with one loose corner sticking up.\n\nNEXT / middle panel: Socks applies glue beneath that corner and holds it pressed flat against the box.\n\nLAST / right panel: The dry smooth paper-covered box holds pencils beside an unlettered notebook on the desk; Socks stands nearby.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-field": {
    "sourceText": "Socks walks across a field after a picnic. A piece of paper lies on the grass. Socks picks it up and looks for more litter. A bottle is under the picnic table. Socks puts the paper and bottle in a bag. Socks carries the bag to the bins by the gate.",
    "textSha256": "07037e852c782aa6c16190ecc73cf8e745c0ff6c6dd2e3350fd35101589efbf8",
    "kind": "comic",
    "panels": [
      {
        "scene": "After a picnic, Socks picks up a paper scrap from grass beside the picnic table; a bottle is visible beneath the table.",
        "alt": "Socks picks up litter in the field."
      },
      {
        "scene": "Socks puts the recovered paper and bottle together into a bag.",
        "alt": "Socks puts the paper and bottle in a bag."
      },
      {
        "scene": "Socks carries that litter bag to bins beside the gate; the picnic area behind is clear.",
        "alt": "Socks takes the litter bag to the bins."
      }
    ],
    "alt": "First: Socks picks up litter in the field. Next: Socks puts the paper and bottle in a bag. Last: Socks takes the litter bag to the bins.",
    "src": "/images/comprehension/passages/socks-field.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Picks Up Litter\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks walks across a field after a picnic. A piece of paper lies on the grass. Socks picks it up and looks for more litter. A bottle is under the picnic table. Socks puts the paper and bottle in a bag. Socks carries the bag to the bins by the gate.\n\nFIRST / left panel: After a picnic, Socks picks up a paper scrap from grass beside the picnic table; a bottle is visible beneath the table.\n\nNEXT / middle panel: Socks puts the recovered paper and bottle together into a bag.\n\nLAST / right panel: Socks carries that litter bag to bins beside the gate; the picnic area behind is clear.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "socks-these-boxes": {
    "sourceText": "Socks reads a label on two boxes. It says these boxes are for books. Socks looks inside and finds blocks in one box. Socks moves the blocks to the toy shelf. Then Socks fills both boxes with books. The boxes go on the bottom shelf beside the reading mat.",
    "textSha256": "78d3e9410890412907612002b05004e1740b3ac9022cdfde17142624f929799d",
    "kind": "comic",
    "panels": [
      {
        "scene": "Socks opens two boxes whose labels each clearly read Books; one contains blocks rather than books.",
        "alt": "Socks finds blocks in one book box."
      },
      {
        "scene": "Socks moves those blocks onto the toy shelf, leaving both boxes ready for books.",
        "alt": "Socks moves the blocks to the toy shelf."
      },
      {
        "scene": "Both boxes now hold books and sit on the bottom shelf beside the reading mat; Socks finishes placing them.",
        "alt": "The two book boxes sit beside the reading mat."
      }
    ],
    "alt": "First: Socks finds blocks in one book box. Next: Socks moves the blocks to the toy shelf. Last: The two book boxes sit beside the reading mat.",
    "src": "/images/comprehension/passages/socks-these-boxes.webp",
    "referencePath": "/images/worksheets/socks-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Socks Checks Two Boxes\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-SOCKS, the existing Little Literacy Guides monkey, explicitly selected by the user on 27 October 2026: small round monkey, large circular ears, heart-shaped pale face patch, forehead tuft, round cheek marks, short buttoned vest with two buttons, curled tail, two natural arms and two legs. Match the supplied current Guide outline exactly. Never substitute the Aiden and Betty dog; no canine muzzle, dog ears or harness. All fur, face, vest and hands/feet remain unfilled black outlines on white for colouring.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Socks. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Socks reads a label on two boxes. It says these boxes are for books. Socks looks inside and finds blocks in one box. Socks moves the blocks to the toy shelf. Then Socks fills both boxes with books. The boxes go on the bottom shelf beside the reading mat.\n\nFIRST / left panel: Socks opens two boxes whose labels each clearly read Books; one contains blocks rather than books.\n\nNEXT / middle panel: Socks moves those blocks onto the toy shelf, leaving both boxes ready for books.\n\nLAST / right panel: Both boxes now hold books and sit on the bottom shelf beside the reading mat; Socks finishes placing them.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. The plot-essential label on each of the two boxes reads exactly Books. Render that one word clearly on both boxes; no other writing or numbers. Do not draw the source passage or title into the art.\n\nPrecise correction for the supplied candidate image: preserve the first and middle panels and both exact readable Books labels. Change only the rightmost panel so BOTH book-filled boxes unmistakably sit ON the bottom shelf of the bookcase, not on the floor. Draw a single low raised shelf plank with visible front edge and supports directly underneath both boxes. The reading mat stays separately on the floor in front of that shelf. Socks kneels outside the shelf and finishes putting a book into the right box. Keep exactly two boxes, each label reading Books with no other text, both holding books; preserve monkey anatomy and all other story states. Unfilled black outlines on white only."
  },
  "chips-stew": {
    "sourceText": "Chips sat at the table with a bowl of stew. Steam rose from the bowl. Chips blew on a small spoonful. The stew was still too hot to eat. Chips waited and stirred it slowly. Later, Chips tried another spoonful. This time, the stew was cool enough.",
    "textSha256": "4e5f7312fea73db6dda9a79234b996631aa607dd7a47d483566f28c03650fc45",
    "kind": "comic",
    "panels": [
      {
        "scene": "At a table, Chips blows on a small spoonful above a bowl of steaming stew, without eating it yet.",
        "alt": "Chips blows on the hot stew."
      },
      {
        "scene": "Chips slowly stirs the bowl while waiting; fewer simple steam wisps rise.",
        "alt": "Chips stirs and waits for the stew to cool."
      },
      {
        "scene": "Later, Chips tastes a small spoonful from the same bowl comfortably; no steam or extra meal items.",
        "alt": "Chips tastes the cooled stew."
      }
    ],
    "alt": "First: Chips blows on the hot stew. Next: Chips stirs and waits for the stew to cool. Last: Chips tastes the cooled stew.",
    "src": "/images/comprehension/passages/chips-stew.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips Tries the Stew\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips sat at the table with a bowl of stew. Steam rose from the bowl. Chips blew on a small spoonful. The stew was still too hot to eat. Chips waited and stirred it slowly. Later, Chips tried another spoonful. This time, the stew was cool enough.\n\nFIRST / left panel: At a table, Chips blows on a small spoonful above a bowl of steaming stew, without eating it yet.\n\nNEXT / middle panel: Chips slowly stirs the bowl while waiting; fewer simple steam wisps rise.\n\nLAST / right panel: Later, Chips tastes a small spoonful from the same bowl comfortably; no steam or extra meal items.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-raincoat": {
    "sourceText": "Rain falls while Chips waits by the door. Chips gets a raincoat from a hook. The coat has sleeves that cover both hands. It is too big. Chips hangs it back and takes a smaller coat. This coat fits. Chips puts on boots and walks outside to meet Pip.",
    "textSha256": "e72593dd3bffe5b3057d9aef8df4dd4419f23a4bdcf664638296df3e50d5497d",
    "kind": "comic",
    "panels": [
      {
        "scene": "By the door with rain outside, Chips tries a too-large raincoat whose sleeves fully cover both front hooves.",
        "alt": "The first raincoat covers Chips's hands."
      },
      {
        "scene": "The big coat is back on its hook; Chips puts on a smaller coat whose sleeves stop above the front hooves.",
        "alt": "Chips chooses a coat that fits."
      },
      {
        "scene": "Chips wears that smaller coat and boots outside beside Pip in rain. Pip is slightly taller than Chips.",
        "alt": "Chips meets Pip wearing the fitting coat and boots."
      }
    ],
    "alt": "First: The first raincoat covers Chips's hands. Next: Chips chooses a coat that fits. Last: Chips meets Pip wearing the fitting coat and boots.",
    "src": "/images/comprehension/passages/chips-raincoat.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips Finds a Raincoat\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks. GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Rain falls while Chips waits by the door. Chips gets a raincoat from a hook. The coat has sleeves that cover both hands. It is too big. Chips hangs it back and takes a smaller coat. This coat fits. Chips puts on boots and walks outside to meet Pip.\n\nFIRST / left panel: By the door with rain outside, Chips tries a too-large raincoat whose sleeves fully cover both front hooves.\n\nNEXT / middle panel: The big coat is back on its hook; Chips puts on a smaller coat whose sleeves stop above the front hooves.\n\nLAST / right panel: Chips wears that smaller coat and boots outside beside Pip in rain. Pip is slightly taller than Chips.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chips-day-trip": {
    "sourceText": "Chips packs for a day trip. A water bottle, an apple and a map sit on a tray. Chips puts the bottle and apple in a bag. Chips wants the map in a small pocket. The open map is too wide. Chips folds the map and puts it in the pocket. Then Chips puts the tray away.",
    "textSha256": "a5dd2a08584932441d6d7a5fb0c1d6f0590896cdc3cece219031114895bc7e1d",
    "kind": "comic",
    "panels": [
      {
        "scene": "A tray holds one water bottle, one apple and an unfolded map beside Chips's open trip bag.",
        "alt": "Chips gets a bottle, apple and map ready."
      },
      {
        "scene": "Bottle and apple are in the bag; Chips folds the map to fit its small pocket.",
        "alt": "Chips folds the wide map for the small pocket."
      },
      {
        "scene": "The folded map fits in the bag pocket, with bottle and apple packed; Chips puts the empty tray away.",
        "alt": "Chips finishes packing and puts away the tray."
      }
    ],
    "alt": "First: Chips gets a bottle, apple and map ready. Next: Chips folds the wide map for the small pocket. Last: Chips finishes packing and puts away the tray.",
    "src": "/images/comprehension/passages/chips-day-trip.webp",
    "referencePath": "/images/worksheets/chips-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chips Gets Ready for a Day Trip\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: GUIDE-CHIPS, Little Literacy Guides companion Chips: small white-and-brown patched goat, two short ridged backward-curving horns, broad sideways ears, forehead tuft, fixed eye and body patch outlines, collar with one hanging bell, cloven hooves. Preserve the exact reference markings as unfilled shapes.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chips. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chips packs for a day trip. A water bottle, an apple and a map sit on a tray. Chips puts the bottle and apple in a bag. Chips wants the map in a small pocket. The open map is too wide. Chips folds the map and puts it in the pocket. Then Chips puts the tray away.\n\nFIRST / left panel: A tray holds one water bottle, one apple and an unfolded map beside Chips's open trip bag.\n\nNEXT / middle panel: Bottle and apple are in the bag; Chips folds the map to fit its small pocket.\n\nLAST / right panel: The folded map fits in the bag pocket, with bottle and apple packed; Chips puts the empty tray away.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chompy-teeth": {
    "sourceText": "Chompy squeezes toothpaste onto a brush. Chompy brushes the front teeth, then the back teeth. In the mirror, Chompy sees foam around the mouth. Chompy spits the foam into the sink and rinses the brush. The brush goes in a cup. Chompy wipes the mouth with a clean towel.",
    "textSha256": "be09b520be97056c58e896b4ecdeaffcf6f1d23fe6a864ca7081ffbae8e6c3ab",
    "kind": "comic",
    "panels": [
      {
        "scene": "At the bathroom sink, Chompy brushes teeth while looking into the mirror; foam is visible around the mouth.",
        "alt": "Chompy brushes teeth at the mirror."
      },
      {
        "scene": "Chompy spits foam into the sink and rinses the brush under the tap; keep the neckerchief out of the water.",
        "alt": "Chompy rinses after brushing."
      },
      {
        "scene": "The clean brush stands in a cup while Chompy wipes the mouth with a clean towel.",
        "alt": "Chompy wipes the mouth with the brush in its cup."
      }
    ],
    "alt": "First: Chompy brushes teeth at the mirror. Next: Chompy rinses after brushing. Last: Chompy wipes the mouth with the brush in its cup.",
    "src": "/images/comprehension/passages/chompy-teeth.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Brushes Teeth\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy squeezes toothpaste onto a brush. Chompy brushes the front teeth, then the back teeth. In the mirror, Chompy sees foam around the mouth. Chompy spits the foam into the sink and rinses the brush. The brush goes in a cup. Chompy wipes the mouth with a clean towel.\n\nFIRST / left panel: At the bathroom sink, Chompy brushes teeth while looking into the mirror; foam is visible around the mouth.\n\nNEXT / middle panel: Chompy spits foam into the sink and rinses the brush under the tap; keep the neckerchief out of the water.\n\nLAST / right panel: The clean brush stands in a cup while Chompy wipes the mouth with a clean towel.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art."
  },
  "chompy-peach": {
    "sourceText": "Chompy washes a peach for a snack. Chompy asks Muddy to cut it around the hard stone. Muddy puts the slices on a plate. Chompy gives Muddy and Pip two slices each. Chompy eats the last slice. The stone goes in the food bin. Muddy washes the knife and plate.",
    "textSha256": "d4e2ad2b64764b66d98ab13fe4a3158f6034abdd13c23b77d04197889e3f0c65",
    "kind": "comic",
    "panels": [
      {
        "scene": "At a counter, Muddy cuts the washed peach around its hard stone while Chompy watches. Chompy is taller than Muddy; knife remains in Muddy's hand over the board.",
        "alt": "Muddy cuts the peach around its stone."
      },
      {
        "scene": "Chompy shares exactly five peach slices: Muddy holds two, Pip holds two, and Chompy holds the last one. Chompy tallest, Pip slightly taller than Muddy.",
        "alt": "Chompy shares two slices each with Muddy and Pip."
      },
      {
        "scene": "The peach stone is in the food bin, and Muddy washes the knife and empty plate at the sink; Chompy has finished the last slice nearby. Chompy taller than Muddy.",
        "alt": "Muddy washes up after the peach snack."
      }
    ],
    "alt": "First: Muddy cuts the peach around its stone. Next: Chompy shares two slices each with Muddy and Pip. Last: Muddy washes up after the peach snack.",
    "src": "/images/comprehension/passages/chompy-peach.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Shares a Peach\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes. MOON-PIP, Moonwood Pip: small woodland boy, tousled brown hair, large pointed ears, green short-sleeve wrap tunic with hood, chest tie and buckled belt. Match reference face and clothing in line art. No wings or large added cheek marks. DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy washes a peach for a snack. Chompy asks Muddy to cut it around the hard stone. Muddy puts the slices on a plate. Chompy gives Muddy and Pip two slices each. Chompy eats the last slice. The stone goes in the food bin. Muddy washes the knife and plate.\n\nFIRST / left panel: At a counter, Muddy cuts the washed peach around its hard stone while Chompy watches. Chompy is taller than Muddy; knife remains in Muddy's hand over the board.\n\nNEXT / middle panel: Chompy shares exactly five peach slices: Muddy holds two, Pip holds two, and Chompy holds the last one. Chompy tallest, Pip slightly taller than Muddy.\n\nLAST / right panel: The peach stone is in the food bin, and Muddy washes the knife and empty plate at the sink; Chompy has finished the last slice nearby. Chompy taller than Muddy.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nSingle-pit continuity lock: this is ONE peach with exactly ONE hard stone total. If two fruit halves are visible in the first panel, only ONE half contains the single stone; the other has an EMPTY cavity. Muddy cuts fruit around that stone, never cuts through the stone. In the final panel the food bin contains exactly that SAME ONE whole stone, with no duplicated pits or extra fruit slices. Preserve the middle panel exactly FIVE slices: Muddy holds2, Pip holds2, Chompy holds1.\n\nStrict five-slice and cleanup correction: middle panel shows exactly FIVE slices TOTAL across ALL hands, plate and surfaces: two in Muddy hands, two in Pip hands, one in Chompy hand. The middle plate is COMPLETELY EMPTY, with ZERO extra slices anywhere. Last panel: food bin contains exactly ONE peach stone and NOTHING ELSE: no peels, scraps or slices. Muddy visibly washes BOTH the knife and the empty plate at the sink, one held in each of the two hands. Never omit the knife or add a third hand."
  },
  "chompy-road": {
    "sourceText": "Chompy puts on a coat and walks with Muddy. They stop at a crossing by the road. A red light tells them to wait. Chompy presses the button. The walking light turns green. They check that the cars have stopped. Then they walk across together and reach the library.",
    "textSha256": "60755dd1a4f10517f41a86775664743de26aa0f49efb1a50c3a7fefe8953b02a",
    "kind": "comic",
    "panels": [
      {
        "scene": "Wearing a coat, Chompy waits with Muddy at a road crossing and presses the button. Both stay on the pavement; traffic signal uses an unfilled stop-lamp circle, no letters. Chompy taller than Muddy.",
        "alt": "Chompy presses the crossing button beside Muddy."
      },
      {
        "scene": "Both look towards stationary cars before stepping off the pavement; the pedestrian lamp shows a simple walking-person symbol. Chompy taller than Muddy.",
        "alt": "Chompy and Muddy check the cars have stopped."
      },
      {
        "scene": "They walk together across the clear crossing towards the library building; all cars stay stopped. Blank library sign area. Chompy taller than Muddy.",
        "alt": "Chompy and Muddy cross together towards the library."
      }
    ],
    "alt": "First: Chompy presses the crossing button beside Muddy. Next: Chompy and Muddy check the cars have stopped. Last: Chompy and Muddy cross together towards the library.",
    "src": "/images/comprehension/passages/chompy-road.webp",
    "referencePath": "/images/worksheets/chompy-colouring.webp",
    "prompt": "Create one finished three-panel story comic in one wide horizontal raster, three equal panels read left to right for the original Reading Comprehension passage \"Chompy Crosses the Road\".\n\nBlack-and-white colouring-page illustration: clean confident black outlines on pure white, big open colouring areas, uncluttered setting, no grey washes, crosshatching, texture or heavy dark fills. Essential faces, limbs and props stay inside an 8% safe inset in every panel. Objects must be large enough to recognise on a tablet.\n\nCharacter identity and inspected visual references: MEADOW-MUDDY, Meadow Pals Muddy: round pink pig, broad oval two-nostril snout, triangular ears, small hair tuft, fixed irregular mud-patch outlines on both cheeks, lower forelimbs and belly, no default clothing. Preserve the exact reference patch map as unfilled outline shapes. DINO-CHOMPY, Dino Pals Chompy: friendly young orange tyrannosaur with large rounded head, pale muzzle and belly, small triangular back ridges, fixed outlined oval head/body spots, two short arms, two sturdy legs, one tail and white triangular neckerchief tied at the side. Preserve the reference body plan and scarf.\n\nPreserve each character and prop design across panels. Each panel contains exactly one Chompy. Include supporting characters ONLY in panels whose scene explicitly names them; never repeat the whole listed cast in every panel; no extra limbs, fused bodies or humanised animal species changes. Supporting animals retain the relative size stated in the scene plan. Render colours only as unfilled black outlines; do not invent patterns, labels or symbols to stand for colour.\n\nExact source text (authority for events and order): Chompy puts on a coat and walks with Muddy. They stop at a crossing by the road. A red light tells them to wait. Chompy presses the button. The walking light turns green. They check that the cars have stopped. Then they walk across together and reach the library.\n\nFIRST / left panel: Wearing a coat, Chompy waits with Muddy at a road crossing and presses the button. Both stay on the pavement; traffic signal uses an unfilled stop-lamp circle, no letters. Chompy taller than Muddy.\n\nNEXT / middle panel: Both look towards stationary cars before stepping off the pavement; the pedestrian lamp shows a simple walking-person symbol. Chompy taller than Muddy.\n\nLAST / right panel: They walk together across the clear crossing towards the library building; all cars stay stopped. Blank library sign area. Chompy taller than Muddy.\n\nOnly depict the specified moment in each panel; do not merge before/after states, introduce extra events, add unrelated scenery, add speech balloons, thought balloons, music notation, pseudo-writing, captions, panel numbers, answer letters, correct-answer markers or letter cues. All signs, notes, addresses, book pages and name cards are blank shapes unless a scene explicitly permits a non-letter object symbol. Do not draw the source passage or title into the art.\n\nCrossing-direction and colouring lock: final panel is a REAR or THREE-QUARTER BACK view of Chompy and Muddy walking AWAY from the viewer across the zebra crossing TOWARDS the library at the far end. Never face them towards the viewer or away from the library. All cars are stopped behind their stop lines outside the pedestrian crossing. Middle panel: both characters turn their heads to check the stopped cars before stepping off the pavement. Chompy retains the coat and neckerchief in all panels. Road, coats and ground interiors remain PURE WHITE with black outlines only, no grey wash, shaded road, filled clothing, gradients or shadows."
  },
  ...EXPANSION_COMPREHENSION_PICTURES
};

export function passagePicture(passage) {
  if (!passage || typeof passage.id !== 'string' || typeof passage.text !== 'string') return null;
  const picture = Object.hasOwn(COMPREHENSION_PICTURES, passage.id) ? COMPREHENSION_PICTURES[passage.id] : null;
  return picture?.sourceText === passage.text ? picture : null;
}
