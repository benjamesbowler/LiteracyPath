import { PRESS_STORY_CHOICES } from "../../content/decodablePress/pressStoryPrompts.js";

const FIELDS = [
  ["character", "Who is your character?", PRESS_STORY_CHOICES.characters],
  ["setting", "Where are they?", PRESS_STORY_CHOICES.settings],
  ["goal", "What do they want?", PRESS_STORY_CHOICES.goals],
  ["obstacle", "What gets in the way?", PRESS_STORY_CHOICES.obstacles],
  ["changedAction", "What do they change?", PRESS_STORY_CHOICES.changedActions]
];

export function StoryPlanner({ value, onChange, disabled = false }) {
  return <section className="press-planner" aria-labelledby="press-plan-title"><h2 id="press-plan-title">Plan the tiny story</h2><p>Pick ideas, then make them your own on each page.</p><div>{FIELDS.map(([key,label,options]) => <label key={key}>{label}<select disabled={disabled} value={value[key] || ""} onChange={event => onChange({ ...value, [key]: event.target.value })}><option value="">Choose one</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>)}</div></section>;
}
