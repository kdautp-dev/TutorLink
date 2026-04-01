import { SUBJECT_OPTIONS } from "@/lib/constants";

export default function PostFilters({ filters, onChange }) {
  return (
    <div className="card filter-bar">
      <div className="field">
        <label htmlFor="subject-filter">Subject</label>
        <select
          id="subject-filter"
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
        <label htmlFor="price-filter">Max price</label>
        <input
          id="price-filter"
          type="number"
          min="0"
          placeholder="Any"
          value={filters.maxPrice}
          onChange={(event) => onChange("maxPrice", event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="sort-filter">Sort</label>
        <select
          id="sort-filter"
          value={filters.sort}
          onChange={(event) => onChange("sort", event.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to high</option>
          <option value="price-high">Price: High to low</option>
        </select>
      </div>
    </div>
  );
}
