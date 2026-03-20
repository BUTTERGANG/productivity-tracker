import { CATEGORIES } from '../constants'
import './CategoryFilter.css'

function CategoryFilter({ activeCategory, onCategoryChange }) {
  return (
    <div className="category-filter">
      <button
        className={`cat-filter-chip ${!activeCategory ? 'active all' : ''}`}
        onClick={() => onCategoryChange(null)}
      >
        All
      </button>
      {Object.entries(CATEGORIES).map(([key, cat]) => (
        <button
          key={key}
          className={`cat-filter-chip ${activeCategory === key ? 'active' : ''}`}
          style={{ '--cat-color': cat.color }}
          onClick={() => onCategoryChange(activeCategory === key ? null : key)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
