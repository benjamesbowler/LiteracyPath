// One-off patch applier for the comprehension longest-answer rebalance.
// Rewrites ONE distractor per flagged item to within [keyLen, 1.2*keyLen].
// Verifies: unique item line per id, `from` appears exactly once on the line,
// and the replacement length is within bounds of the item's answer length.
// Deleted after use — not part of the repo toolchain.
import fs from "node:fs";

const patches = [
  // ── qbAssess_main_idea.js ──────────────────────────────────────────────
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_001", "How to train a dog", "How to train a young dog"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_002", "Where butterflies lay eggs", "Where butterflies lay their eggs"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_003", "How to Get a Library Card", "How to Get Your First Library Card"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_004", "How to cook vegetables", "How to cook vegetables for dinner"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_005", "It is fun to play in the rain", "It is fun to play outside in the rain"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_006", "The Best Sports to Play", "The Best Sports to Play with Friends"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_010", "How spiders care for their young", "How mother spiders care for their young"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_012", "What happens during dreaming", "What happens in the brain during dreaming"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_014", "Famous Mountains Around the World", "The Most Famous Mountains Around the World"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_016", "How animals find shelter in forests", "How woodland animals find shelter in forests"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_017", "Why explorers travelled to new places", "Why explorers travelled to faraway new places"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_019", "How to purify water at home", "How families can purify drinking water at home"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_021", "How far the Moon is from Earth", "How far away the Moon is from Earth"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_022", "Foods That Are Bad for You", "Foods That Are Bad for Your Body"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_023", "Animals that live in rivers", "Animals that live in big rivers"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_024", "Why soap is better than water alone", "Why soap always works better than plain water"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_025", "How glaciers form over thousands of years", "How glaciers slowly form over many thousands of years"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_026", "Why tadpoles live in water", "Why tadpoles live in ponds and streams"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_027", "How Mountains Protect Countries", "How Mountains Have Protected Countries Through History"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_028", "What happens when air moves", "What happens when air moves quickly"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_029", "The difference between mammals and birds", "The most important differences between mammals and birds"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_032", "Animals That Live Without Water", "Animals That Can Live Without Much Water"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_033", "How long different materials last", "How long different materials last in nature"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_034", "How fossils of dinosaurs are found", "How the fossils of dinosaurs are found and studied"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_035", "When to help people you don't know", "When you should help people you do not know well"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_036", "The plates that make up the ocean floor", "The rocky plates that make up the ocean floor"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_037", "How the Body Uses Energy", "How the Body Uses Energy During the Day"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l1_038", "What to do if you smell smoke", "What you should do if you smell smoke at home"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_001", "The alpha wolf leads the pack on hunts", "The alpha wolf always leads the pack on its daily hunts"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_002", "Printing presses could produce hundreds of copies", "Printing presses could produce many hundreds of copies"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_003", "How Coastlines Are Formed", "How the World's Rocky Coastlines Are Slowly Formed"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_004", "Edison invented many devices used in daily life", "Edison invented many clever devices that are used in daily life"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_005", "The equipment needed on a space station", "The special equipment needed on a space station"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_006", "How salmon find the stream where they were born", "How salmon find their way back to the stream where they were born"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_008", "Children benefit from learning about growing food", "Children benefit greatly from learning about growing food"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_010", "Women were excluded from the original Olympics", "Women were completely excluded from the original ancient Olympics"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_011", "Experts have found that all screens damage children's health", "Experts have found that all screens seriously damage children's health"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_012", "The Importance of Hygiene in Medicine", "The Importance of Hygiene in the History of Modern Medicine"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_013", "Animals have adapted to survive in the Sahara", "Many desert animals have adapted to survive in the harsh Sahara"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_016", "Urban farming will feed the world's growing cities", "Urban farming alone will feed all of the world's fast-growing cities"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_017", "How Carts Changed Ancient Trade", "How Wooden Carts Changed Trade in the Ancient World"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_018", "Tortoises need sunlight to regulate their body temperature", "Tortoises need warm sunlight every day to regulate their body temperature"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_019", "Adults who had childhood friends are more successful", "Adults who had close childhood friends are more successful in life"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_020", "How plants survive in hot, dry conditions", "How desert plants manage to survive in very hot, dry conditions"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_021", "Solar panels are found in many different locations", "Solar panels can now be found in many different locations around the world"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_022", "Libraries provide more services than just lending books", "Libraries provide many more services than simply lending out books"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_023", "Animal Intelligence in the Wild", "Surprising Examples of Animal Intelligence in the Wild"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_024", "Volunteering makes people happier and more connected", "Volunteering makes people much happier and more connected to others"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_025", "Why children learn languages faster than adults", "Why young children are able to learn brand new languages much faster than adults"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_026", "Social media causes anxiety and poor sleep", "Social media use always causes serious anxiety and very poor sleep at night"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_027", "Bee populations are being harmed by pesticides and habitat loss", "Bee populations everywhere are being harmed by pesticides and habitat loss"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_028", "Why Solar Farms Are Built in Deserts", "Why Enormous Solar Farms Are Usually Built in Hot Deserts"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_029", "More than 1,500 people died when the Titanic sank", "More than 1,500 passengers and crew died when the Titanic sank at sea"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_030", "Scientists and engineers are inspired by space travel", "Many young scientists and engineers say they are inspired by space travel"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_031", "Trade routes followed the paths of rivers", "Ancient trade routes usually followed the winding paths of rivers"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_032", "Indigenous languages contain knowledge about the natural world", "Indigenous languages contain precious, detailed knowledge about the natural world"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_034", "Oceans produce more than half of our oxygen", "The world's oceans produce more than half of the oxygen we breathe"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_036", "The fire led to the creation of fire insurance", "The terrible fire eventually led to the creation of the first fire insurance companies"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_037", "Factory robots can work faster and more accurately than humans", "Modern factory robots can work much faster and far more accurately than humans"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l2_038", "Microplastics come from broken-down plastic and clothing fibres", "Microplastics come from broken-down plastic bags, bottles and clothing fibres"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_001", "Amara works harder than everyone else in her class", "Amara always works much harder than everyone else in her class"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_002", "Local markets are better for communities than large shops", "Local street markets are always better for communities than large shops"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_003", "Schools should give students more time to sleep between exams", "Schools should give their students much more time to rest and sleep between exams"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_004", "Trawling ships destroy fish populations and hurt local communities", "Large trawling ships destroy entire fish populations and badly hurt the small local fishing communities nearby"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_005", "Research shows modern people interact less than in the past", "New research shows that modern people interact face to face far less than in the past"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_006", "Acts of kindness are most meaningful when people know who helped them", "Acts of kindness are always the most meaningful when people know exactly who helped them"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_009", "The deep ocean contains creatures adapted to extreme heat and pressure", "The deepest parts of the ocean contain strange creatures that have adapted to extreme heat and crushing pressure"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_010", "Some argue that large-scale food production helps reduce hunger", "Some people argue that large-scale food production by big companies actually helps reduce world hunger overall"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_011", "Many people campaigned against the Vietnam Veterans Memorial design", "Many angry people campaigned loudly against the Vietnam Veterans Memorial design"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_012", "Experts are always more cautious than non-experts", "True experts are always far more cautious in their claims than non-experts"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_013", "Electric light has changed the way people live and work at night", "The invention of electric light has completely changed the way people live and work at night"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_015", "Two hundred people attended a public meeting to save the community centre", "More than two hundred local people attended a crowded public meeting to save the community centre"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_016", "Social media algorithms show people content they already agree with", "Social media algorithms are designed to show people news and content that they already agree with"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_017", "Omar's notebooks were published in an academic journal after his death", "Omar's detailed nature notebooks were finally published in an academic journal after his death"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_018", "Some languages describe time and numbers in fundamentally different ways", "Some rare languages describe time, colour and numbers in fundamentally different ways from English"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_019", "Bloodletting and geocentrism were once widely accepted but have since been disproved", "Bloodletting and geocentrism were once very widely accepted ideas but have since been completely disproved"],
  ["src/data/qbAssess_main_idea.js", "qa_mi_l3_020", "Art teachers should be more careful about how they talk to young students", "All art teachers should be much more careful about the way they talk to young students about their early work"],

  // ── qbAssess_inf.js ────────────────────────────────────────────────────
  ["src/data/qbAssess_inf.js", "qa_inf_l1_002", "Cold and snowy", "Cold and snowing"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_003", "The dog needs to go outside", "The dog needs to go outside right now"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_004", "Still hungry", "Still quite hungry"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_007", "Confident and calm", "Confident and very calm"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_008", "The audience is leaving", "The audience is getting up to leave"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_009", "A sports race", "A school sports day running race"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_011", "He forgot something important", "He forgot something very important"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_013", "Fall asleep in the sun", "Fall asleep in a warm patch of sun"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_015", "Surprised", "Very surprised"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_016", "She was meeting a friend", "She was waiting to meet a friend there"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_017", "He wanted to rest", "He wanted a short rest"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_020", "She is struggling to read it", "She is struggling to read the words"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_022", "Confused", "Surprised"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_026", "Going home for dinner", "Going straight home to eat his dinner"],
  ["src/data/qbAssess_inf.js", "qa_inf_l1_030", "Move to a new house", "Move to a brand new house"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_001", "He doesn't want to go on the trip", "He has decided he does not want to go on the class trip"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_003", "He was surprised she had noticed the notice", "He was very surprised that she had even noticed the notice"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_004", "He is a gardener who is admiring the plants", "He is a professional gardener who is quietly admiring the front garden"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_006", "Confused about which shop to choose", "Confused about which shop she should choose"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_007", "The children are arriving at school", "The children are just arriving at school for the morning"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_008", "The second route was more scenic", "The second route was much more scenic and relaxing to drive"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_009", "He has already been told his mark", "He has already been told his exam mark and does not need to look again"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_013", "She is always in a rush", "She is always in a big rush and never plans anything ahead"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_015", "He is waiting for a friend to arrive", "He is waiting patiently for a good friend to arrive soon"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_016", "She enjoys reading all kinds of writing", "She simply enjoys reading all kinds of letters and writing"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_017", "She was upset no one had told her", "She was upset that no one had told her about the plan"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_018", "She had been told to repeat it by her supervisor", "She had been strictly told to repeat the whole test by her supervisor"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_019", "The bakery has the best bread anyone has ever tasted", "The little bakery truly has the best bread that anyone has ever tasted"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_020", "She has forgotten his childhood", "She has forgotten everything about his early childhood"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_021", "They decided they would wait for the teacher", "They decided that they would rather wait quietly for the teacher"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_022", "She had been planning to stop at that point all along", "She had secretly been planning to stop at that exact spot all along anyway"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_023", "He is deliberately disobeying his teacher", "He is deliberately and stubbornly disobeying his patient teacher"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_025", "He is hiding the fact that he is in pain", "He is carefully hiding the fact that he is in real pain"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_026", "He himself loves music", "He himself loves listening to loud music"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_028", "He is paid to tidy the garden", "He is being paid by the family to tidy up the garden"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_029", "The local government organised the response", "The local government carefully organised the whole flood response"],
  ["src/data/qbAssess_inf.js", "qa_inf_l2_030", "She is being invited to an interview", "She is simply being invited to another round of interviews by the judges"],

  // ── qbAssess_cause_effect.js ───────────────────────────────────────────
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_002", "She was late for school", "She was very late for school"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_006", "She had to make more toast", "She had to stop and make some more toast"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_013", "He had to restart the computer", "He had to restart the old computer"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_015", "She had drunk too much water", "She had drunk too much fizzy water"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_016", "Someone kicked it shut", "Someone kicked it shut by mistake"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_018", "People had to leave their homes", "Some people had to leave their homes"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_023", "The tyres were flat", "The bike tyres were flat"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_029", "The temperature was too low", "The oven temperature was set too low"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l1_030", "The battery was old and damaged", "The phone battery was old and damaged"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_002", "She was allergic to her cat", "She had suddenly become allergic to her fluffy pet cat"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_004", "The rivers dried up completely", "The local rivers dried up completely"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_005", "She had been given extra help from her teacher", "She had been given lots of extra help from her teacher"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_007", "The museum ran a television advertisement", "The museum ran a big television advertisement"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_009", "A delivery had been delayed from the warehouse", "A large delivery had been badly delayed from the main warehouse"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_014", "He crashed and bent the wheel", "He crashed straight into the kerb and badly bent the front wheel"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_016", "Noise levels rose and local shops closed", "Noise levels rose sharply and several local shops closed"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_017", "She had been carrying a very heavy pack", "She had been carrying a very heavy pack up steep hills"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_021", "The cheese melted and made a mess", "The cheese melted everywhere and made a big mess"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_022", "Most birds were rescued before the oil reached them", "Most of the seabirds were safely rescued before the oil slick reached them"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_023", "House prices in the area rose because of the park", "House prices in the whole area rose because of the park"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_025", "The theatre closed permanently and the staff lost their jobs", "The old theatre closed permanently and all the staff lost their jobs"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_026", "He found it hard to make friends in his class", "He found it very hard to make any new friends in his class"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_027", "A disease swept through the island's plant life", "A fast-moving disease quickly swept through all of the island's plant life"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l2_029", "A storm was approaching quickly", "A dangerous storm was approaching quickly"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_003", "Low snowpack → warm winter → rivers dried up → farms failed → restrictions imposed", "Low snowpack → warm winter → rivers dried up completely → farms failed → restrictions imposed"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_004", "Families moving away to find work elsewhere", "Many families moving away to find new work elsewhere"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_007", "Heavy autumn rain fell directly into the river", "Heavy autumn rain fell directly into the river for many days"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_012", "Walking and cycling became less common because distances between places grew", "Walking and cycling became far less common simply because the distances between everyday places grew"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_013", "Her grandmother moved to the city where the language was not spoken", "Her grandmother moved away to the big city where the old language was not spoken"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_015", "Schools in the district working together on a shared programme", "All of the schools in the district working together on a shared programme"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_017", "People in the area were told to boil their drinking water", "People in the whole area were told to boil their drinking water"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_019", "People felt embarrassed to say they were not generous", "Most people felt too embarrassed to admit to the researchers that they were not generous"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_020", "Drivers began taking alternative routes to avoid the camera", "Many drivers soon began taking alternative routes to avoid the camera"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_021", "Parents became confused about whether to vaccinate their children", "Many parents became very confused about whether to vaccinate their children"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_023", "Their test scores rose and they were given more challenging books to read", "Their test scores rose steadily and they were given more challenging books to read"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_024", "Archaeologists discovered that ancient Romans had a higher standard of living than expected", "Archaeologists later discovered that many ancient Romans had a far higher standard of living than expected"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_026", "Engineers failed to warn the town before the storms arrived", "The engineers failed to warn the town before the winter storms arrived"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_027", "More staff shouted → pupils ate faster → food waste fell → lessons started sooner", "More staff shouted loudly → pupils ate their food much faster → food waste fell → afternoon lessons started sooner"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_028", "Air pollution increased because leaves trapped heat", "Air pollution increased because the leaves trapped warm air"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_029", "The school made homework easier for pupils who arrived early", "The school made all of the homework much easier for the pupils who arrived early"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_030", "Fruit became sweeter because it stayed cold for longer", "The fruit became much sweeter because it stayed cold for far longer"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_031", "Fewer people used the road after the cycle lanes opened", "Far fewer people used the busy main road after the new cycle lanes opened"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_032", "The museum required every school to create a club after visiting", "The museum required every visiting school to create a science club after each visit"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_034", "Doctors delayed procedures → musicians arrived → parents became anxious → children settled", "Doctors delayed the procedures → the musicians arrived late → parents became anxious → children settled"],
  ["src/data/qbAssess_cause_effect.js", "qa_ce_l3_035", "The company hired more customer support staff", "The software company hired many more customer support staff members"],

  // ── questionBankExpansion14.js (theme) ─────────────────────────────────
  ["src/data/questionBankExpansion14.js", "qb14_th_002", "crying is a sign of weakness", "crying is always a sign of weakness"],
  ["src/data/questionBankExpansion14.js", "qb14_th_004", "ants are smarter than grasshoppers", "ants are much smarter than lazy grasshoppers"],
  ["src/data/questionBankExpansion14.js", "qb14_th_005", "arguments cause problems", "arguments cause big problems"],
  ["src/data/questionBankExpansion14.js", "qb14_th_006", "lions are not as strong as they seem", "lions are not nearly as strong as they seem to be"],
  ["src/data/questionBankExpansion14.js", "qb14_th_008", "water is more precious than gold", "water is far more precious than shiny gold"],
  ["src/data/questionBankExpansion14.js", "qb14_th_009", "clothes are not important at school", "clothes are not very important for school children"],
  ["src/data/questionBankExpansion14.js", "qb14_th_013", "new ideas can be dangerous", "new ideas from outside can be dangerous for a kingdom"],
  ["src/data/questionBankExpansion14.js", "qb14_th_015", "arguments about colours are pointless", "silly arguments about simple colours are completely pointless"],
  ["src/data/questionBankExpansion14.js", "qb14_th_016", "singing is better than painting", "singing is always much better than careful painting"],
  ["src/data/questionBankExpansion14.js", "qb14_th_017", "logs are heavy to carry", "heavy logs are far too heavy for one animal to carry"],
  ["src/data/questionBankExpansion14.js", "qb14_th_018", "stories use nature as symbols", "stories often use nature as symbols for ideas"],
  ["src/data/questionBankExpansion14.js", "qb14_th_019", "games bring people together", "playground games bring new people together at school"],
  ["src/data/questionBankExpansion14.js", "qb14_th_022", "wishes never come true", "wishes never really come true at all"],
  ["src/data/questionBankExpansion14.js", "qb14_th_023", "travellers should always have a map", "careful travellers should always carry a good map with them"],
  ["src/data/questionBankExpansion14.js", "qb14_th_024", "reeds are stronger than oak trees", "the thin bending reeds are secretly much stronger than the mighty oak trees"],
  ["src/data/questionBankExpansion14.js", "qb14_th_025", "winning is not everything", "winning games is not everything"],
  ["src/data/questionBankExpansion14.js", "qb14_th_029", "one egg a day is not enough", "one single golden egg each day is simply not enough"],
  ["src/data/questionBankExpansion14.js", "qb14_th_030", "storytellers are wise people", "storytellers are the wisest people in any village"],
  ["src/data/questionBankExpansion14.js", "qb14_th_031", "home is always the best place", "home is always the very best place for every person to stay"],
  ["src/data/questionBankExpansion14.js", "qb14_th_032", "villages are friendly places", "small villages are usually the friendliest places to live"],
  ["src/data/questionBankExpansion14.js", "qb14_th_034", "food tastes better when shared", "food always tastes so much better when it is shared"],
  ["src/data/questionBankExpansion14.js", "qb14_th_035", "ships need lighthouses", "ships at sea need lighthouses to guide them safely home"],
  ["src/data/questionBankExpansion14.js", "qb14_th_040", "history repeats itself", "history will always repeat itself over and over again"],
  ["src/data/questionBankExpansion14.js", "qb14_th_046", "racing and studying are the same", "racing and studying are exactly the same thing"],
  ["src/data/questionBankExpansion14.js", "qb14_th_048", "friendship is a common topic in stories", "friendship is a very common topic in children's stories"],
  ["src/data/questionBankExpansion14.js", "qb14_th_058", "young trees are impatient", "young trees are always impatient"]
];

const audit = JSON.parse(fs.readFileSync("docs/validation/checkpoint_integrity_audit.json", "utf8"));
const keyById = new Map(audit.flaggedLongestItems.map(item => [item.id, item.answer]));

const problems = [];
const byFile = new Map();
patches.forEach(patch => {
  const [file] = patch;
  const list = byFile.get(file) || [];
  list.push(patch);
  byFile.set(file, list);
});

for (const [file, filePatches] of byFile) {
  let text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  for (const [, id, from, to] of filePatches) {
    const key = keyById.get(id);
    if (!key) { problems.push(`${id}: not in flagged list`); continue; }
    if (to.length < key.length) problems.push(`${id}: replacement too short (${to.length} < key ${key.length})`);
    if (to.length > Math.ceil(key.length * 1.2)) problems.push(`${id}: replacement too long (${to.length} > ${Math.ceil(key.length * 1.2)})`);
    const lineIndexes = lines.map((line, i) => line.includes(`"${id}"`) ? i : -1).filter(i => i >= 0);
    if (lineIndexes.length !== 1) { problems.push(`${id}: found ${lineIndexes.length} lines in ${file}`); continue; }
    const line = lines[lineIndexes[0]];
    const occurrences = line.split(`"${from}"`).length - 1;
    if (occurrences !== 1) { problems.push(`${id}: "${from}" occurs ${occurrences}x on its line`); continue; }
    lines[lineIndexes[0]] = line.replace(`"${from}"`, `"${to}"`);
  }
  fs.writeFileSync(file, lines.join("\n"));
  console.log(`patched ${filePatches.length} items in ${file}`);
}

if (problems.length) {
  console.error(`PROBLEMS (${problems.length}):`);
  problems.forEach(p => console.error("  " + p));
  process.exit(1);
}
console.log(`All ${patches.length} patches applied and verified.`);
