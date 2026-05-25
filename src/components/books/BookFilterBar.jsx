import { collectBookFilterOptions } from "../../content/books/bookFilters.js";

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="pd-filter-field">
      <span>{label}</span>
      <select value={value || ""} onChange={event => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function BookFilterBar({ books, filters, onFiltersChange }) {
  const options = collectBookFilterOptions(books);

  function setFilter(key, value) {
    onFiltersChange({ ...filters, [key]: value });
  }

  return (
    <div className="pd-book-filter-bar" aria-label="Public-domain book filters">
      <FilterSelect label="Grade" value={filters.gradeBand} options={options.gradeBands} onChange={value => setFilter("gradeBand", value)} />
      <FilterSelect label="Difficulty" value={filters.difficulty} options={options.difficulties} onChange={value => setFilter("difficulty", value)} />
      <FilterSelect label="Tag" value={filters.tag} options={options.tags} onChange={value => setFilter("tag", value)} />
      <FilterSelect label="Skill" value={filters.skill} options={options.skills} onChange={value => setFilter("skill", value)} />
      <button className="lp-button lp-button-secondary" onClick={() => onFiltersChange({})} type="button">
        Reset
      </button>
    </div>
  );
}
