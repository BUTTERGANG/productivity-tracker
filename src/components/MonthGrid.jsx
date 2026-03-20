import { useMemo, useRef, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { formatDate } from '../constants'
import './MonthGrid.css'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function MonthGrid({ year, month, taskData, getCompletionLevel, onDayClick, onMonthChange }) {
  const { cells, daysInMonth, dateIndexMap, indexDateMap, weeksCount } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayIdx = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0
    const weeksCount = Math.ceil((firstDayIdx + daysInMonth) / 7)
    const cells = []
    const dateIndexMap = new Map()
    const indexDateMap = new Map()
    for (let i = 0; i < firstDayIdx; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const dayIndex = (date.getDay() + 6) % 7
      const weekIndex = Math.floor((firstDayIdx + d - 1) / 7)
      const dateStr = formatDate(date)
      dateIndexMap.set(dateStr, { weekIndex, dayIndex })
      indexDateMap.set(`${weekIndex}-${dayIndex}`, dateStr)
      cells.push(date)
    }
    return { cells, daysInMonth, dateIndexMap, indexDateMap, weeksCount }
  }, [year, month])

  const [focusedDate, setFocusedDate] = useState(null)
  const cellRefs = useRef({})
  const longPressRef = useRef(null)
  const longPressFired = useRef(false)
  const pointerStartRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!focusedDate) {
      const firstDate = indexDateMap.get('0-0') || indexDateMap.get('0-1') || indexDateMap.get('0-2')
      if (firstDate) setFocusedDate(firstDate)
    }
  }, [focusedDate, indexDateMap])

  const today = formatDate(new Date())

  const handleKeyDown = (e, dateStr) => {
    if (!dateIndexMap.has(dateStr)) return
    const { weekIndex, dayIndex } = dateIndexMap.get(dateStr)

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onDayClick(dateStr)
      return
    }

    let nextWeekIndex = weekIndex
    let nextDayIndex = dayIndex

    if (e.key === 'ArrowLeft') nextWeekIndex = weekIndex - 1
    if (e.key === 'ArrowRight') nextWeekIndex = weekIndex + 1
    if (e.key === 'ArrowUp') nextDayIndex = dayIndex - 1
    if (e.key === 'ArrowDown') nextDayIndex = dayIndex + 1

    if (nextWeekIndex !== weekIndex || nextDayIndex !== dayIndex) {
      e.preventDefault()
      nextWeekIndex = Math.max(0, Math.min(nextWeekIndex, weeksCount - 1))
      nextDayIndex = Math.max(0, Math.min(nextDayIndex, 6))
      const nextDate = indexDateMap.get(`${nextWeekIndex}-${nextDayIndex}`)
      if (nextDate) {
        setFocusedDate(nextDate)
        cellRefs.current[nextDate]?.focus()
      }
    }
  }

  const startLongPress = (dateStr, e) => {
    if (e.pointerType === 'mouse') return
    if (longPressRef.current) clearTimeout(longPressRef.current)
    longPressFired.current = false
    pointerStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
    e.currentTarget?.setPointerCapture?.(e.pointerId)
    longPressRef.current = setTimeout(() => {
      longPressFired.current = true
      onDayClick(dateStr)
    }, 450)
  }

  const cancelLongPress = (target, pointerId) => {
    if (longPressRef.current) clearTimeout(longPressRef.current)
    longPressRef.current = null
    if (target && pointerId !== undefined && target.hasPointerCapture?.(pointerId)) {
      target.releasePointerCapture?.(pointerId)
    }
    pointerStartRef.current = null
  }

  const handlePointerMove = (e) => {
    if (e.pointerType === 'mouse' || !pointerStartRef.current) return
    if (pointerStartRef.current.pointerId !== e.pointerId) return
    const dx = Math.abs(e.clientX - pointerStartRef.current.x)
    const dy = Math.abs(e.clientY - pointerStartRef.current.y)
    if (dx > 8 || dy > 8) {
      cancelLongPress(e.currentTarget, e.pointerId)
    }
  }

  return (
    <motion.div
      className="month-grid-wrapper"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="month-grid-nav">
        <button className="month-nav-btn" onClick={() => onMonthChange(-1)}>‹</button>
        <span className="month-grid-title">{MONTH_NAMES[month]} {year}</span>
        <button className="month-nav-btn" onClick={() => onMonthChange(1)}>›</button>
      </div>

      <div className="month-grid">
        {DAY_HEADERS.map(d => (
          <div key={d} className="month-day-header">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} className="month-day-pad" />
          const dateStr = formatDate(date)
          const level = getCompletionLevel(dateStr)
          const tasks = taskData[dateStr]
          const completed = tasks ? tasks.filter(t => t.completed).length : 0
          const total = tasks ? tasks.length : 0
          const isToday = dateStr === today

          return (
            <motion.div
              key={dateStr}
              ref={el => { cellRefs.current[dateStr] = el }}
              className={`month-day level-${level}${isToday ? ' today' : ''}`}
              tabIndex={focusedDate === dateStr ? 0 : -1}
              role="button"
              aria-label={`${dateStr} ${completed}/${total} tasks completed`}
              onFocus={() => setFocusedDate(dateStr)}
              onKeyDown={e => handleKeyDown(e, dateStr)}
              onPointerDown={e => startLongPress(dateStr, e)}
              onPointerUp={e => {
                if (e.pointerType === 'mouse') {
                  onDayClick(dateStr)
                } else if (!longPressFired.current) {
                  onDayClick(dateStr)
                }
                cancelLongPress(e.currentTarget, e.pointerId)
              }}
              onPointerLeave={e => cancelLongPress(e.currentTarget, e.pointerId)}
              onPointerCancel={e => cancelLongPress(e.currentTarget, e.pointerId)}
              onPointerMove={handlePointerMove}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            >
              <span className="month-day-num">{date.getDate()}</span>
              {total > 0 && (
                <span className="month-day-count">{completed}/{total}</span>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="month-grid-legend">
        <span className="legend-dot level-0" />
        <span className="legend-dot level-1" />
        <span className="legend-dot level-2" />
        <span className="legend-dot level-3" />
        <span className="legend-dot level-4" />
        <span className="month-legend-label">None → Some → All done</span>
      </div>
    </motion.div>
  )
}

export default MonthGrid
