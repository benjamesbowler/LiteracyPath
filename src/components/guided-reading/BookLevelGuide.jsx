import { APP_READING_LEVELS, APP_READING_LEVEL_DESCRIPTIONS } from "../../utils/guidedReading/bookLevelMetadata.js";
import "../../styles/book-levels.css";

export default function BookLevelGuide() {
  return <details className="book-level-guide">
    <summary>About App levels A–H</summary>
    <p>App levels describe the language and ideas in a book. They are editorial estimates, not a test result or an official publisher level.</p>
    <dl>{APP_READING_LEVELS.map(level => <div key={level}>
      <dt>App level {level}</dt><dd>{APP_READING_LEVEL_DESCRIPTIONS[level]}</dd>
    </div>)}</dl>
    <p>A decodable book also needs the right phonics knowledge. Read-together books can be enjoyed with support at any App level.</p>
  </details>;
}
