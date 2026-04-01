import { SUBJECT_OPTIONS } from "@/lib/constants";

export default function TutorFilters({ filters, onChange }) {
  return (
    <div className="card filter-bar">
      <div className="field">
        <label htmlFor="tutor-subject-filter">Subject</label>
        <select
          id="tutor-subject-filter"
          value={filters.subject}
          onChange={(event) => onChange("subject", event.target.value)}
        >
          <option value="">All subjects</option>
          {SUBJECT_OPTIONS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tutor-rate-filter">Max hourly rate</label>
        <input
          id="tutor-rate-filter"
          type="number"
          min="0"
          placeholder="Any"
          value={filters.maxRate}
          onChange={(event) => onChange("maxRate", event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="tutor-sort-filter">Sort</label>
        <select
          id="tutor-sort-filter"
          value={filters.sort}
          onChange={(event) => onChange("sort", event.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="rate-low">Rate: Low to high</option>
          <option value="rate-high">Rate: High to low</option>
        </select>
      </div>
    </div>
  );
}
