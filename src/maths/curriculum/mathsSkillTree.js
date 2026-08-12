import { prerequisiteIdsForMathsSkill } from "./mathsPrerequisites.js";
import { standardsForMathsSkill } from "./standardsCrosswalk.js";

export const MATHS_RELEASE_STATUSES = Object.freeze({
  APPROVED: "approved",
  PLANNED: "planned"
});

export const APPROVED_FOUNDATION_SKILL_IDS = Object.freeze([
  "F-N-SEQ-20",
  "F-N-COUNT-10",
  "F-N-COUNT-20",
  "F-N-SUBITISE-5",
  "F-N-MATCH",
  "F-N-COMPARE",
  "F-N-PART-5",
  "F-N-PART-10"
]);

const approvedSkillIds = new Set(APPROVED_FOUNDATION_SKILL_IDS);

const SKILL_DEFINITIONS = [
  {
    id: "F-N-SEQ-20", year: "F", strand: "number",
    label: "Say and order the number sequence from 0 to 20",
    childLabel: "Put numbers in order",
    teacherIntent: "Build a stable forwards and backwards number-word sequence and connect each word to its numeral.",
    representations: ["numeral_track", "objects", "numeral_cards"],
    vocabulary: ["before", "after", "next", "zero"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["unstable_order", "teen_reversal"],
    transferContexts: ["line_up_positions", "calendar_numbers", "page_numbers"],
    nextActions: [
      "Build and read a movable 0–20 numeral track, then hide one card at a time.",
      "Count a fixed row of objects and match the spoken sequence to the numerals."
    ]
  },
  {
    id: "F-N-COUNT-10", year: "F", strand: "number",
    label: "Count collections to 10",
    childLabel: "Count a group to 10",
    teacherIntent: "Coordinate one number word with each object and use the final number to name the whole collection.",
    representations: ["objects", "fingers", "five_frame", "ten_frame", "numeral"],
    vocabulary: ["count", "how many", "altogether", "last number"],
    assessmentBlueprintIds: ["count_collection", "make_quantity"],
    misconceptionIds: ["unstable_order", "one_to_one", "cardinality"],
    transferContexts: ["snack_sets", "classroom_objects", "nature_collections"],
    nextActions: [
      "Move each object into a counted area while saying one number word.",
      "Cover the collection after counting and ask how many without recounting."
    ]
  },
  {
    id: "F-N-COUNT-20", year: "F", strand: "number",
    label: "Count collections to 20",
    childLabel: "Count a bigger group",
    teacherIntent: "Extend one-to-one counting and cardinality beyond 10 using structured groups.",
    representations: ["objects", "ten_frames", "numeral_track", "numeral"],
    vocabulary: ["count on", "ten", "more", "altogether"],
    assessmentBlueprintIds: ["count_collection", "make_quantity"],
    misconceptionIds: ["unstable_order", "one_to_one", "cardinality"],
    transferContexts: ["class_collections", "steps", "construction_sets"],
    nextActions: [
      "Organise the collection as ten and some more before counting the whole set.",
      "Vary the spacing and arrangement while keeping the quantity unchanged."
    ]
  },
  {
    id: "F-N-SUBITISE-5", year: "F", strand: "number",
    label: "Recognise quantities to 5 without counting each item",
    childLabel: "See how many quickly",
    teacherIntent: "Recognise small quantities across familiar and unfamiliar arrangements and explain the parts seen.",
    representations: ["dice_pattern", "fingers", "five_frame", "scattered_dots"],
    vocabulary: ["how many", "I saw", "part", "whole"],
    assessmentBlueprintIds: ["quick_quantity"],
    misconceptionIds: ["counts_all", "canonical_pattern_only"],
    transferContexts: ["game_dice", "finger_patterns", "small_collections"],
    nextActions: [
      "Flash quantities for a moment, then ask how the learner saw the amount.",
      "Show the same quantity in a frame, on fingers and as scattered dots."
    ]
  },
  {
    id: "F-N-MATCH", year: "F", strand: "number",
    label: "Connect number names, numerals and quantities",
    childLabel: "Match a number to its group",
    teacherIntent: "Connect spoken number words, written numerals and collections as three representations of one quantity.",
    representations: ["objects", "numeral", "number_word", "ten_frame"],
    vocabulary: ["number", "numeral", "quantity", "matches"],
    assessmentBlueprintIds: ["representation_match", "make_quantity"],
    misconceptionIds: ["numeral_only_recognition", "cardinality"],
    transferContexts: ["labels", "game_cards", "classroom_counts"],
    nextActions: [
      "Build a collection, say its number name and choose the matching numeral.",
      "Start from a numeral and make the quantity in a different representation."
    ]
  },
  {
    id: "F-N-COMPARE", year: "F", strand: "number",
    label: "Compare collections to 20",
    childLabel: "Find more, fewer or the same",
    teacherIntent: "Compare quantities independently of object size, colour or the length of a spread-out row.",
    representations: ["matched_rows", "ten_frames", "objects", "numerals"],
    vocabulary: ["more", "fewer", "same", "equal"],
    assessmentBlueprintIds: ["compare_quantities"],
    misconceptionIds: ["spatial_extent_bias", "more_means_bigger_objects"],
    transferContexts: ["sharing_materials", "team_sets", "nature_collections"],
    nextActions: [
      "Match two collections one-to-one before naming which has more or fewer.",
      "Spread the smaller set farther apart and ask whether the quantity changed."
    ]
  },
  {
    id: "F-N-PART-5", year: "F", strand: "number",
    label: "Partition and combine quantities to 5",
    childLabel: "Make 5 in different ways",
    teacherIntent: "See a whole to 5 as two parts that can be separated and recombined without changing the total.",
    representations: ["part_whole", "fingers", "five_frame", "two_colour_counters"],
    vocabulary: ["part", "whole", "altogether", "split"],
    assessmentBlueprintIds: ["part_whole", "make_quantity"],
    misconceptionIds: ["whole_part_confusion", "recounts_given_part"],
    transferContexts: ["two_plates", "hidden_objects", "finger_patterns"],
    nextActions: [
      "Split five two-colour counters, then name both parts and the whole.",
      "Hide one part and use the visible part to work out what is missing."
    ]
  },
  {
    id: "F-N-PART-10", year: "F", strand: "number",
    label: "Partition and combine quantities to 10",
    childLabel: "Make 10 in different ways",
    teacherIntent: "Develop flexible part–whole structures to 10 rather than memorising one partition.",
    representations: ["ten_frame", "part_whole", "two_colour_counters", "fingers"],
    vocabulary: ["part", "whole", "ten", "missing part"],
    assessmentBlueprintIds: ["part_whole", "make_quantity"],
    misconceptionIds: ["whole_part_confusion", "single_partition_only"],
    transferContexts: ["ten_frame_games", "two_groups", "hidden_objects"],
    nextActions: [
      "Turn over counters in a full ten frame and name both complementary parts.",
      "Record several ways to make 10 with pictures before introducing equations."
    ]
  },
  {
    id: "F-N-ADD-TAKE", year: "F", strand: "number",
    label: "Model adding to and taking from quantities to 10",
    childLabel: "Add some or take some away",
    teacherIntent: "Act out change stories and connect the action, resulting quantity and mathematical language.",
    representations: ["counters", "story_mat", "part_whole"],
    vocabulary: ["add", "take away", "now", "altogether"],
    assessmentBlueprintIds: ["part_whole", "make_quantity"],
    misconceptionIds: ["action_direction_confusion", "whole_part_confusion"],
    transferContexts: ["toy_stories", "snack_stories", "joining_groups"]
  },
  {
    id: "F-N-SHARE", year: "F", strand: "number",
    label: "Model equal sharing",
    childLabel: "Share things fairly",
    teacherIntent: "Deal a collection one at a time into equal groups and check that each group has the same quantity.",
    representations: ["counters", "plates", "groups"],
    vocabulary: ["share", "equal", "each", "fair"],
    assessmentBlueprintIds: ["group_and_share"],
    misconceptionIds: ["unequal_dealing", "groups_vs_group_size"],
    transferContexts: ["picnic_sharing", "team_groups", "class_materials"]
  },
  {
    id: "F-A-PATTERN", year: "F", strand: "algebra",
    label: "Copy and continue repeating patterns",
    childLabel: "Find what repeats",
    teacherIntent: "Identify the smallest repeating unit and use it to continue and create a pattern.",
    representations: ["objects", "sound_pattern", "movement_pattern"],
    vocabulary: ["pattern", "repeat", "unit", "next"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["surface_copy_only", "pattern_unit_confusion"],
    transferContexts: ["bead_strings", "clapping", "movement_sequences"]
  },
  {
    id: "F-M-COMPARE", year: "F", strand: "measurement",
    label: "Directly compare length, mass, capacity and duration",
    childLabel: "Compare how long, heavy or full",
    teacherIntent: "Compare one measurable attribute at a time using aligned or directly matched objects.",
    representations: ["real_objects", "balance", "containers", "event_cards"],
    vocabulary: ["longer", "shorter", "heavier", "holds more"],
    assessmentBlueprintIds: ["measure_compare"],
    misconceptionIds: ["misaligned_origin", "surface_feature_bias"],
    transferContexts: ["classroom_objects", "water_play", "daily_events"]
  },
  {
    id: "F-M-TIME", year: "F", strand: "measurement",
    label: "Sequence familiar events and times of day",
    childLabel: "Put the day in order",
    teacherIntent: "Order familiar events using before, after, morning, afternoon and night.",
    representations: ["picture_timeline", "event_cards"],
    vocabulary: ["before", "after", "morning", "night"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["preference_as_sequence", "time_language_confusion"],
    transferContexts: ["school_day", "home_routines", "story_events"]
  },
  {
    id: "F-SP-SHAPES", year: "F", strand: "space",
    label: "Name, create and sort familiar shapes",
    childLabel: "Make and sort shapes",
    teacherIntent: "Attend to defining properties across different sizes and orientations.",
    representations: ["physical_shapes", "rotated_shapes", "shape_builder"],
    vocabulary: ["side", "corner", "curved", "straight"],
    assessmentBlueprintIds: ["shape_attribute"],
    misconceptionIds: ["prototype_only", "orientation_defines_shape"],
    transferContexts: ["block_building", "signs", "shape_hunts"]
  },
  {
    id: "F-ST-DATA", year: "F", strand: "statistics",
    label: "Collect, sort and compare categorical data",
    childLabel: "Sort and count information",
    teacherIntent: "Sort objects by one stated category and compare the resulting counts.",
    representations: ["sorted_objects", "picture_graph"],
    vocabulary: ["sort", "group", "most", "least"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["inconsistent_category", "inconsistent_icon_count"],
    transferContexts: ["class_preferences", "nature_sort", "toy_categories"]
  },

  {
    id: "1-N-SEQ-120", year: "1", strand: "number",
    label: "Read, represent and order numbers to at least 120",
    childLabel: "Explore numbers to 120",
    teacherIntent: "Connect the spoken and written sequence through decade transitions and beyond 100.",
    representations: ["number_line", "number_chart", "bundled_objects"],
    vocabulary: ["before", "after", "between", "hundred"],
    assessmentBlueprintIds: ["representation_match", "number_line_move"],
    misconceptionIds: ["hundred_as_endpoint", "decade_transition_error"],
    transferContexts: ["charts", "collections", "page_numbers"]
  },
  {
    id: "1-N-PLACE", year: "1", strand: "number",
    label: "Partition two-digit numbers into tens and ones",
    childLabel: "Build tens and ones",
    teacherIntent: "Treat a two-digit number as composed units of ten and one, not two separate digit counts.",
    representations: ["bundles", "base_ten", "place_value_chart", "numerals"],
    vocabulary: ["tens", "ones", "digit", "place"],
    assessmentBlueprintIds: ["representation_match", "make_quantity"],
    misconceptionIds: ["digits_as_separate_counts", "place_value_reversal"],
    transferContexts: ["straw_bundles", "collections", "scoreboards"]
  },
  {
    id: "1-N-PARTITION", year: "1", strand: "number",
    label: "Partition numbers flexibly",
    childLabel: "Split numbers in different ways",
    teacherIntent: "Rename a quantity using multiple valid partitions, including non-standard partitions.",
    representations: ["part_whole", "base_ten", "equations"],
    vocabulary: ["partition", "rename", "part", "whole"],
    assessmentBlueprintIds: ["part_whole", "representation_match"],
    misconceptionIds: ["standard_partition_only", "quantity_changes_when_partitioned"],
    transferContexts: ["bundling", "money", "addition_strategies"]
  },
  {
    id: "1-N-SKIP", year: "1", strand: "number",
    label: "Quantify by 2s, 5s and 10s",
    childLabel: "Count equal groups",
    teacherIntent: "Connect skip-count words to equal groups and accumulated quantity.",
    representations: ["grouped_objects", "number_line", "number_chart"],
    vocabulary: ["groups of", "skip count", "total", "equal"],
    assessmentBlueprintIds: ["group_and_share", "number_line_move"],
    misconceptionIds: ["recites_without_grouping", "group_size_confusion"],
    transferContexts: ["pairs", "five_frames", "ten_bundles"]
  },
  {
    id: "1-N-ADD-20", year: "1", strand: "number",
    label: "Solve addition problems to 20",
    childLabel: "Add to 20",
    teacherIntent: "Use part–whole and count-on strategies rather than recounting both sets from one.",
    representations: ["ten_frames", "number_line", "part_whole", "equations"],
    vocabulary: ["add", "sum", "count on", "altogether"],
    assessmentBlueprintIds: ["number_line_move", "part_whole"],
    misconceptionIds: ["counts_all", "counts_start_as_one"],
    transferContexts: ["joining_stories", "games", "shopping_sets"]
  },
  {
    id: "1-N-SUB-20", year: "1", strand: "number",
    label: "Solve subtraction problems to 20",
    childLabel: "Subtract to 20",
    teacherIntent: "Model subtraction as take-away and difference, selecting a representation that matches the story.",
    representations: ["take_away", "comparison_rows", "number_line", "part_whole"],
    vocabulary: ["subtract", "difference", "left", "fewer"],
    assessmentBlueprintIds: ["number_line_move", "part_whole"],
    misconceptionIds: ["subtraction_always_take_away", "direction_confusion"],
    transferContexts: ["change_stories", "comparison_stories", "missing_parts"]
  },
  {
    id: "1-N-FACTS", year: "1", strand: "number",
    label: "Develop addition and subtraction facts to 10",
    childLabel: "Use number facts to 10",
    teacherIntent: "Derive facts from part–whole structures, doubles and complements instead of isolated recall.",
    representations: ["number_bonds", "ten_frame", "part_whole"],
    vocabulary: ["fact", "double", "make ten", "related"],
    assessmentBlueprintIds: ["part_whole", "representation_match"],
    misconceptionIds: ["recall_detached_from_structure", "operation_pair_disconnect"],
    transferContexts: ["quick_games", "story_problems", "mental_calculation"]
  },
  {
    id: "1-N-SHARE-GROUP", year: "1", strand: "number",
    label: "Model equal sharing and grouping",
    childLabel: "Share and make equal groups",
    teacherIntent: "Distinguish the number of groups from the number in each group.",
    representations: ["counters", "arrays", "group_mats"],
    vocabulary: ["share", "group", "each", "equal"],
    assessmentBlueprintIds: ["group_and_share"],
    misconceptionIds: ["groups_vs_group_size", "unequal_dealing"],
    transferContexts: ["packing", "teams", "fair_shares"]
  },
  {
    id: "1-A-PATTERN", year: "1", strand: "algebra",
    label: "Create skip-count and repeating patterns",
    childLabel: "Make and explain patterns",
    teacherIntent: "State the rule that generates a pattern and use it to continue the pattern.",
    representations: ["objects", "number_chart", "movement_pattern"],
    vocabulary: ["rule", "repeat", "increase", "pattern"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["surface_copy_only", "rule_not_structure"],
    transferContexts: ["designs", "rhythms", "number_sequences"]
  },
  {
    id: "1-M-LENGTH", year: "1", strand: "measurement",
    label: "Measure length with uniform informal units",
    childLabel: "Measure with equal units",
    teacherIntent: "Place equal units end-to-end with no gaps or overlaps and count units, not boundary marks.",
    representations: ["tiles", "cubes", "unit_strips"],
    vocabulary: ["length", "unit", "longer", "measure"],
    assessmentBlueprintIds: ["measure_compare"],
    misconceptionIds: ["gaps_overlaps", "counts_marks"],
    transferContexts: ["desk_objects", "paths", "construction"]
  },
  {
    id: "1-M-COMPARE", year: "1", strand: "measurement",
    label: "Compare length, mass, capacity and duration",
    childLabel: "Compare measurements",
    teacherIntent: "Choose and compare one attribute directly or indirectly without importing another attribute.",
    representations: ["direct_comparison", "balance", "containers", "timelines"],
    vocabulary: ["compare", "mass", "capacity", "duration"],
    assessmentBlueprintIds: ["measure_compare"],
    misconceptionIds: ["attribute_contamination", "misaligned_origin"],
    transferContexts: ["classroom_objects", "recipes", "daily_events"]
  },
  {
    id: "1-M-TIME", year: "1", strand: "measurement",
    label: "Describe duration and sequence events",
    childLabel: "Talk about when things happen",
    teacherIntent: "Use time language and clock landmarks to order and compare familiar durations.",
    representations: ["timeline", "clock_landmarks", "event_cards"],
    vocabulary: ["duration", "earlier", "later", "o'clock"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["time_language_confusion", "sequence_duration_confusion"],
    transferContexts: ["school_timetable", "routines", "journeys"]
  },
  {
    id: "1-M-MONEY", year: "1", strand: "measurement",
    label: "Recognise Australian coins by attributes and value",
    childLabel: "Know Australian coins",
    teacherIntent: "Attend to coin value and identifying attributes rather than physical size alone.",
    representations: ["aud_coin_images", "coin_sets", "value_labels"],
    vocabulary: ["coin", "cents", "dollar", "value"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["larger_coin_greater_value", "coin_count_is_value"],
    transferContexts: ["shops", "coin_sorting", "price_matching"]
  },
  {
    id: "1-SP-SHAPES", year: "1", strand: "space",
    label: "Classify and compose 2D and 3D shapes",
    childLabel: "Build and sort shapes",
    teacherIntent: "Classify shapes by properties and compose larger shapes from smaller parts.",
    representations: ["shape_builder", "physical_solids", "rotated_shapes"],
    vocabulary: ["face", "edge", "side", "compose"],
    assessmentBlueprintIds: ["shape_attribute"],
    misconceptionIds: ["prototype_only", "name_overrides_properties"],
    transferContexts: ["construction", "art", "packaging"]
  },
  {
    id: "1-SP-POSITION", year: "1", strand: "space",
    label: "Give and follow directions",
    childLabel: "Follow and give directions",
    teacherIntent: "Describe position and movement from an agreed viewpoint using precise directional language.",
    representations: ["grid", "route", "body_movement"],
    vocabulary: ["left", "right", "turn", "between"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["left_right_perspective", "route_order_confusion"],
    transferContexts: ["classroom_routes", "maps", "movement_games"]
  },
  {
    id: "1-ST-DATA", year: "1", strand: "statistics",
    label: "Collect and represent categorical data",
    childLabel: "Make a picture graph",
    teacherIntent: "Collect one response per item and represent categories with a consistent one-to-one scale.",
    representations: ["tally", "picture_graph", "sorted_table"],
    vocabulary: ["data", "category", "tally", "most"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["inconsistent_icon_scale", "category_overlap"],
    transferContexts: ["class_surveys", "weather", "collections"]
  },
  {
    id: "1-P-CHANCE", year: "1", strand: "probability",
    label: "Describe outcomes using everyday chance language",
    childLabel: "Talk about what might happen",
    teacherIntent: "Distinguish impossible, possible and certain outcomes in familiar situations.",
    representations: ["event_cards", "simple_simulator"],
    vocabulary: ["impossible", "possible", "certain", "chance"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["possible_means_certain", "preference_predicts_outcome"],
    transferContexts: ["weather", "games", "daily_events"]
  },

  {
    id: "2-N-SEQ-1000", year: "2", strand: "number",
    label: "Order and represent numbers to 1,000",
    childLabel: "Explore numbers to 1,000",
    teacherIntent: "Compare and locate three-digit numbers using place value rather than isolated digit size.",
    representations: ["number_line", "number_chart", "base_ten"],
    vocabulary: ["hundreds", "between", "greater", "less"],
    assessmentBlueprintIds: ["representation_match", "number_line_move"],
    misconceptionIds: ["digitwise_comparison", "place_value_reversal"],
    transferContexts: ["distances", "collections", "scoreboards"]
  },
  {
    id: "2-N-PLACE", year: "2", strand: "number",
    label: "Partition, rearrange and rename two- and three-digit numbers",
    childLabel: "Rename hundreds, tens and ones",
    teacherIntent: "Regroup units while preserving quantity and use zero as a place holder.",
    representations: ["base_ten", "place_value_chart", "expanded_form"],
    vocabulary: ["hundreds", "tens", "ones", "rename"],
    assessmentBlueprintIds: ["representation_match", "make_quantity"],
    misconceptionIds: ["zero_placeholder_ignored", "quantity_changes_when_regrouped"],
    transferContexts: ["bundles", "money", "measurement_numbers"]
  },
  {
    id: "2-N-ADD-SUB", year: "2", strand: "number",
    label: "Add and subtract using place-value strategies",
    childLabel: "Add and subtract bigger numbers",
    teacherIntent: "Partition and recombine quantities by place value, recording partial results coherently.",
    representations: ["base_ten", "open_number_line", "equations"],
    vocabulary: ["partition", "bridge ten", "difference", "strategy"],
    assessmentBlueprintIds: ["number_line_move", "representation_match"],
    misconceptionIds: ["concatenates_partial_results", "place_value_misalignment"],
    transferContexts: ["shopping", "distances", "collections"]
  },
  {
    id: "2-N-FACTS-20", year: "2", strand: "number",
    label: "Recall and explain addition and subtraction facts within 20",
    childLabel: "Use facts within 20",
    teacherIntent: "Explain fact relationships through make-ten, doubles and inverse structures.",
    representations: ["number_bonds", "make_ten", "doubles", "equations"],
    vocabulary: ["inverse", "double", "near double", "make ten"],
    assessmentBlueprintIds: ["part_whole", "representation_match"],
    misconceptionIds: ["fact_recall_detached_from_structure", "inverse_disconnect"],
    transferContexts: ["mental_calculation", "games", "story_problems"]
  },
  {
    id: "2-N-MULT-2", year: "2", strand: "number",
    label: "Model and recall multiplication by twos",
    childLabel: "Make and count groups of 2",
    teacherIntent: "Connect equal groups of two, repeated addition, skip counting and twos facts.",
    representations: ["equal_groups", "arrays", "number_line"],
    vocabulary: ["groups of", "times", "twice", "total"],
    assessmentBlueprintIds: ["group_and_share", "representation_match"],
    misconceptionIds: ["adds_two_only_once", "groups_vs_group_size"],
    transferContexts: ["pairs", "wheels", "team_lines"]
  },
  {
    id: "2-N-GROUP-SHARE", year: "2", strand: "number",
    label: "Solve grouping and sharing problems",
    childLabel: "Solve equal-group problems",
    teacherIntent: "Interpret whether a situation asks for the number of groups or the number in each group.",
    representations: ["arrays", "equal_groups", "bar_model"],
    vocabulary: ["groups", "each", "share", "remainder"],
    assessmentBlueprintIds: ["group_and_share"],
    misconceptionIds: ["groups_vs_group_size", "remainder_ignored"],
    transferContexts: ["packing", "sharing_food", "teams"]
  },
  {
    id: "2-N-FRACTIONS", year: "2", strand: "number",
    label: "Represent halves, quarters and eighths in measure",
    childLabel: "Make equal fraction parts",
    teacherIntent: "Create equal-sized parts of one whole and relate the number of parts to their size.",
    representations: ["fraction_strips", "shapes", "collections", "measure"],
    vocabulary: ["half", "quarter", "eighth", "equal parts"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["equal_looking_not_equal_size", "part_count_size_reversal"],
    transferContexts: ["food_sharing", "length", "folding"]
  },
  {
    id: "2-N-MONEY", year: "2", strand: "number",
    label: "Model practical money transactions",
    childLabel: "Make and compare money amounts",
    teacherIntent: "Compose a value from Australian coins and reason about total value rather than coin count.",
    representations: ["aud_coin_tray", "number_line", "price_tags"],
    vocabulary: ["value", "total", "change", "dollars"],
    assessmentBlueprintIds: ["make_quantity", "representation_match"],
    misconceptionIds: ["coin_count_is_value", "larger_coin_greater_value"],
    transferContexts: ["shops", "class_market", "saving"]
  },
  {
    id: "2-A-PATTERN", year: "2", strand: "algebra",
    label: "Continue additive increasing and decreasing patterns",
    childLabel: "Find an adding or subtracting rule",
    teacherIntent: "Identify a constant additive change and apply it forwards and backwards.",
    representations: ["number_line", "table", "objects"],
    vocabulary: ["increase", "decrease", "rule", "difference"],
    assessmentBlueprintIds: ["number_line_move", "representation_match"],
    misconceptionIds: ["visual_repeat_not_additive_rule", "direction_confusion"],
    transferContexts: ["saving_patterns", "staircases", "number_sequences"]
  },
  {
    id: "2-M-MEASURE", year: "2", strand: "measurement",
    label: "Measure and compare with uniform informal units",
    childLabel: "Measure and compare carefully",
    teacherIntent: "Select a uniform unit, align the origin and account for changes in unit size.",
    representations: ["unnumbered_ruler", "uniform_units", "comparison_table"],
    vocabulary: ["unit", "length", "capacity", "mass"],
    assessmentBlueprintIds: ["measure_compare"],
    misconceptionIds: ["unit_change_ignored", "misaligned_origin", "gaps_overlaps"],
    transferContexts: ["design", "recipes", "classroom_measurement"]
  },
  {
    id: "2-M-CALENDAR", year: "2", strand: "measurement",
    label: "Determine days between calendar events",
    childLabel: "Count days on a calendar",
    teacherIntent: "Track elapsed days across weeks while distinguishing inclusive and exclusive counts.",
    representations: ["calendar", "timeline"],
    vocabulary: ["date", "week", "between", "elapsed"],
    assessmentBlueprintIds: ["number_line_move"],
    misconceptionIds: ["inclusive_exclusive_count", "week_boundary_error"],
    transferContexts: ["events", "birthdays", "school_plans"]
  },
  {
    id: "2-M-TIME", year: "2", strand: "measurement",
    label: "Read hour, half-hour and quarter-hour times",
    childLabel: "Read an analogue clock",
    teacherIntent: "Coordinate hour- and minute-hand positions at hour, half-hour and quarter-hour landmarks.",
    representations: ["analogue_clock", "timeline", "digital_time"],
    vocabulary: ["hour", "half past", "quarter past", "quarter to"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["hour_hand_position_ignored", "hand_role_reversal"],
    transferContexts: ["timetables", "routines", "appointments"]
  },
  {
    id: "2-SP-SHAPES", year: "2", strand: "space",
    label: "Compare and construct shapes by attributes",
    childLabel: "Describe and build shapes",
    teacherIntent: "Use defining attributes to compare and construct two- and three-dimensional shapes.",
    representations: ["shape_builder", "simple_nets", "physical_solids"],
    vocabulary: ["attribute", "face", "edge", "vertex"],
    assessmentBlueprintIds: ["shape_attribute"],
    misconceptionIds: ["name_overrides_properties", "prototype_only"],
    transferContexts: ["construction", "packaging", "design"]
  },
  {
    id: "2-SP-MAPS", year: "2", strand: "space",
    label: "Interpret simple maps and relative position",
    childLabel: "Read and make simple maps",
    teacherIntent: "Maintain directional relationships when reading or rotating a simple map.",
    representations: ["grid_map", "route", "aerial_plan"],
    vocabulary: ["map", "route", "relative", "direction"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["map_rotation_direction_error", "viewpoint_confusion"],
    transferContexts: ["school_maps", "treasure_maps", "neighbourhood_routes"]
  },
  {
    id: "2-ST-DATA", year: "2", strand: "statistics",
    label: "Create and compare data displays",
    childLabel: "Make and read data displays",
    teacherIntent: "Represent data with a stated scale and compare categories using the values, not visual area alone.",
    representations: ["tally", "table", "picture_graph", "column_graph"],
    vocabulary: ["scale", "category", "frequency", "compare"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["visual_height_not_scale", "inconsistent_scale"],
    transferContexts: ["surveys", "observations", "class_investigations"]
  },
  {
    id: "2-P-CHANCE", year: "2", strand: "probability",
    label: "Identify practical activities involving chance",
    childLabel: "Investigate chance",
    teacherIntent: "Describe chance in practical situations without treating a short run of outcomes as proof of certainty.",
    representations: ["event_simulator", "outcome_table", "event_cards"],
    vocabulary: ["chance", "outcome", "likely", "unlikely"],
    assessmentBlueprintIds: ["representation_match"],
    misconceptionIds: ["short_run_proves_certainty", "recent_outcome_predicts_next"],
    transferContexts: ["spinners", "weather", "class_games"]
  }
];

function freezeStrings(values = []) {
  return Object.freeze([...values]);
}
function defaultNextActions(definition) {
  return [
    `Model ${definition.childLabel.toLowerCase()} with ${definition.representations[0].replaceAll("_", " ")}.`,
    "Check the same mathematical idea in a second representation before moving on."
  ];
}

function defineMathsSkill(definition) {
  const releaseStatus = approvedSkillIds.has(definition.id)
    ? MATHS_RELEASE_STATUSES.APPROVED
    : MATHS_RELEASE_STATUSES.PLANNED;
  return Object.freeze({
    id: definition.id,
    subject: "maths",
    year: definition.year,
    strand: definition.strand,
    label: definition.label,
    childLabel: definition.childLabel,
    teacherIntent: definition.teacherIntent,
    prerequisiteIds: freezeStrings(prerequisiteIdsForMathsSkill(definition.id)),
    representations: freezeStrings(definition.representations),
    vocabulary: freezeStrings(definition.vocabulary),
    assessmentBlueprintIds: freezeStrings(definition.assessmentBlueprintIds),
    misconceptionIds: freezeStrings(definition.misconceptionIds),
    transferContexts: freezeStrings(definition.transferContexts),
    standards: freezeStrings(standardsForMathsSkill(definition.id)),
    releaseStatus,
    nextActions: freezeStrings(definition.nextActions || defaultNextActions(definition))
  });
}

export const mathsSkillTree = Object.freeze(SKILL_DEFINITIONS.map(defineMathsSkill));

export const mathsSkillById = Object.freeze(
  Object.fromEntries(mathsSkillTree.map(skill => [skill.id, skill]))
);

export function approvedMathsSkills() {
  return mathsSkillTree.filter(skill => skill.releaseStatus === MATHS_RELEASE_STATUSES.APPROVED);
}

export function mathsSkillsForYear(year, { includePlanned = true } = {}) {
  return mathsSkillTree.filter(skill => (
    skill.year === String(year)
    && (includePlanned || skill.releaseStatus === MATHS_RELEASE_STATUSES.APPROVED)
  ));
}
