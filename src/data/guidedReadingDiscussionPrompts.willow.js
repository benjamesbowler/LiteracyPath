// Static teacher-only discussion support for the twenty Willow Street Readers.
// Each visual move names evidence on one exact final reading page.
const record = (oralPrompt, listenFor, page, visualPrompt, lookFor) => Object.freeze({
  oral: Object.freeze({ prompt: oralPrompt, listenFor }),
  visual: Object.freeze({ page, prompt: visualPrompt, lookFor })
});

export const GUIDED_READING_DISCUSSION_PROMPTS_WILLOW = Object.freeze({
  "willow-street-the-lunchbox-mix-up": record(
    "How do Maya and Samir check that their lunches are right?",
    "They check the labels and return the swapped things. Maya spots the spoon left behind, and Samir returns it.",
    7,
    "Which items on page 7 prove both lunches are correct now?",
    "Finds Maya's green apple and spoon together, plus Samir's blue cup and orange napkin."
  ),
  "willow-street-the-lost-library-book": record(
    "Why did the dry leaf give Leo a better idea than searching another shelf?",
    "Explains that the leaf came from the outside bench where Zoe left the book.",
    5,
    "What small clue falls from Zoe's blue bag on page 5?",
    "Points to the dry brown leaf dropping beside the empty bag."
  ),
  "willow-street-the-windy-picnic": record(
    "What two changes finally kept the windy picnic in place?",
    "Names moving beside the hedge and weighting four cloth corners with food boxes.",
    6,
    "How does page 6 show that every cloth corner is secured?",
    "Locates one closed food box on each of the four striped-cloth corners."
  ),
  "willow-street-the-puddle-plan": record(
    "What does Leo’s muddy shoe show them about the first route?",
    "The edge is soft. Samir tests the stones, and the friends use the firm route to the shed.",
    6,
    "Follow the safe path marked on page 6 from puddle to shed.",
    "Traces the curved dry stones between the two orange cones and the shed."
  ),
  "willow-street-the-squeaky-wheel": record(
    "Why does the cart need more than another push?",
    "Pushing does not fix the squeak. The gardener puts oil on the dry axle so the wheel turns quietly.",
    5,
    "Where does the gardener place the single oil drop on page 5?",
    "Finds the oil-can spout touching the axle hub at the center of the near front wheel."
  ),
  "willow-street-the-garden-gate": record(
    "How did looking underneath change Maya and Leo's gate plan?",
    "Describes finding the stone, closing the gate, moving it, and sweeping grit.",
    3,
    "What exactly prevents the green gate moving on page 3?",
    "Shows the loose gray stone wedged below the bottom rail."
  ),
  "willow-street-nanis-chapati-lunch": record(
    "Why did folding the chapatis solve Maya's packing problem?",
    "Explains that triangles left room beside the sealed lentil pot.",
    6,
    "Compare the folded chapatis and lentil pot on page 6.",
    "Notices the chapati triangles fitting neatly beside the small sealed pot."
  ),
  "willow-street-dumplings-for-new-year": record(
    "What did Zoe change when her first dumpling would not close?",
    "Mentions using less filling and pinching the full curved edge without gaps.",
    5,
    "How can you see Zoe sealing her dumpling on page 5?",
    "Follows her fingers pinching the crescent edge while the filling stays enclosed."
  ),
  "willow-street-drums-for-carnival": record(
    "What does Leo change after his early beat covers the call?",
    "He listens for the call to finish before playing the answer.",
    5,
    "How does Mr Baptiste show Leo that it is his turn?",
    "Mr Baptiste points toward Leo, who watches with his hands ready at the drum."
  ),
  "willow-street-eid-morning-with-samir": record(
    "How did helping at the welcome table lead Samir to Maya?",
    "Connects carrying the shared food parcel with finding Maya beside the dates.",
    7,
    "What is Maya preparing when Samir finds her on page 7?",
    "Identifies the bowl of dates and bright folded napkins on the welcome table."
  ),
  "willow-street-grow-a-bean-in-a-jar": record(
    "What changes show that the bean has begun growing?",
    "Names the opened seed coat, downward white root, and upward green shoot.",
    7,
    "Use page 7 to compare the new root and shoot directions.",
    "Finds the white root pointing down and pale green shoot curving up."
  ),
  "willow-street-make-a-paper-kite": record(
    "Why does Samir inspect three connections before flying the kite?",
    "Explains how secure tape, tail, and centered line keep the kite together and balanced.",
    6,
    "Which parts does Samir inspect on page 6 before leaving?",
    "Locates the flat tape strips, tied ribbon tail, centered line, and unbroken paper."
  ),
  "willow-street-build-a-cardboard-ramp": record(
    "How can adding one book change the toy car's journey?",
    "Predicts that a slightly higher stable ramp can change how far the released car rolls.",
    8,
    "What evidence on page 8 lets Leo compare both rolls?",
    "Points to the first blue mark and second yellow mark at the two stopping places."
  ),
  "willow-street-make-fruit-and-yoghurt-cups": record(
    "Which actions keep the fruit-and-yogurt cups safe, clean, and cold?",
    "Recalls the allergy check, hand and fruit washing, adult cutting, clean spoons, lids, and refrigeration.",
    6,
    "How do the clear cups on page 6 reveal the layer order?",
    "Traces yogurt, fruit, then the second yogurt layer through each cup."
  ),
  "willow-street-from-wheat-to-bread": record(
    "Which two changes turn wheat grain into dough that can rise?",
    "Describes milling grain into flour, then mixing flour with water, yeast, and salt.",
    6,
    "What visible difference between the two bowls on page 6 shows rising?",
    "Compares the same dough before resting with its larger expanded volume afterwards."
  ),
  "willow-street-where-rainwater-goes": record(
    "Why does rainwater follow more than one path after landing?",
    "Distinguishes soaking into loose soil from running over hard sloping surfaces.",
    4,
    "Which parts in this picture collect or carry rainwater?",
    "Identifies the gutter along the roof, the black pipes, the covered water butt, and the drain beside it."
  ),
  "willow-street-inside-a-fire-station": record(
    "What work makes a fire crew ready before and after emergencies?",
    "Combines equipment checks, protective clothing, teamwork, cleaning, and repeated training.",
    4,
    "Which pieces of equipment can you find on the fire engine?",
    "Finds hoses, water controls, hand tools, and the ladders on the roof."
  ),
  "willow-street-how-paper-is-recycled": record(
    "How does water help old paper become usable fibers again?",
    "Explains that water and mixing separate paper into pulp before screening and pressing.",
    6,
    "What are the rollers squeezing out of the wet paper?",
    "Sees water dripping below the rollers while the paper continues through them."
  ),
  "willow-street-a-snail-comes-out-at-night": record(
    "How does a damp night help the snail move and feed?",
    "Links moisture with emerging, gliding on mucus, finding food, and avoiding dry air.",
    4,
    "Where are the snail's tiny eyes visible on page 4?",
    "Finds one dark eye spot at the tip of each longer upper tentacle."
  ),
  "willow-street-how-a-book-is-made": record(
    "How do different people's jobs build one finished book?",
    "Orders writing, editing, illustrating, designing, printing, folding, binding, and delivery.",
    7,
    "Which parts are joined to form the book on page 7?",
    "Identifies folded page groups fixed at the spine inside the sturdy cover."
  )
});
