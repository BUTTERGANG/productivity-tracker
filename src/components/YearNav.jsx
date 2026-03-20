import './YearNav.css'

const CURRENT_YEAR = new Date().getFullYear()

function YearNav({ year, onYearChange }) {
  return (
    <div className="year-nav">
      <button className="year-btn" onClick={() => onYearChange(year - 1)}>‹</button>
      <span className="year-display">{year}</span>
      <button className="year-btn" onClick={() => onYearChange(year + 1)} disabled={year >= CURRENT_YEAR}>›</button>
    </div>
  )
}

export default YearNav
