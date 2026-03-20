import { useMemo, useRef, useEffect, useState } from 'react'
import { CATEGORIES } from '../constants'
import './SearchBar.css'

function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function SearchBar({ query, onQueryChange, taskData, onResultClick }) {
  const inputRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const found = []
    Object.entries(taskData).forEach(([dateStr, tasks]) => {
      if (!tasks) return
      tasks.forEach(task => {
        if (task.name.toLowerCase().includes(q)) found.push({ dateStr, task })
      })
    })
    return found.sort((a, b) => b.dateStr.localeCompare(a.dateStr)).slice(0, 30)
  }, [query, taskData])

  useEffect(() => {
    if (results.length > 0) setActiveIndex(0)
  }, [results.length])

  useEffect(() => {
    if (!query.trim() || !results[activeIndex]) return
    const activeEl = document.getElementById(`search-result-${activeIndex}`)
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, query, results])

  // Cmd/Ctrl+K focuses the search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleResultClick = (dateStr) => {
    onResultClick(dateStr)
    onQueryChange('')
  }

  const handleKeyDown = (e) => {
    if (!query.trim()) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
    }
    if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault()
      handleResultClick(results[activeIndex].dateStr)
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onQueryChange('')
    }
  }

  return (
    <div className="search-wrapper">
      <div className="search-input-wrap">
        <svg className="search-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-expanded={query.trim() ? 'true' : 'false'}
          aria-controls="search-results"
          aria-activedescendant={query.trim() && results[activeIndex] ? `search-result-${activeIndex}` : undefined}
          placeholder="Search tasks…"
          className="search-input"
        />
        {query && (
          <button className="search-clear" onClick={() => onQueryChange('')} aria-label="Clear search">&times;</button>
        )}
        <span className="search-kbd">⌘K</span>
      </div>

      {query.trim() && (
        <div className="search-dropdown" role="listbox" id="search-results">
          {results.length === 0 ? (
            <div className="search-empty">No tasks match "{query}"</div>
          ) : (
            <>
              <div className="search-count">{results.length} result{results.length !== 1 ? 's' : ''}</div>
              {results.map(({ dateStr, task }, idx) => {
                const date = new Date(dateStr + 'T12:00:00')
                const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                const catColor = CATEGORIES[task.category || 'other']?.color || '#8b949e'
                const isActive = idx === activeIndex
                return (
                  <div
                    key={`${dateStr}-${task.id}`}
                    id={`search-result-${idx}`}
                    role="option"
                    aria-selected={isActive}
                    className={`search-result${isActive ? ' active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleResultClick(dateStr)}
                  >
                    <span className="search-result-dot" style={{ background: catColor }} />
                    <div className="search-result-body">
                      <span className={`search-result-name ${task.completed ? 'done' : ''}`}>
                        {highlight(task.name, query)}
                      </span>
                      <span className="search-result-date">{label}</span>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
