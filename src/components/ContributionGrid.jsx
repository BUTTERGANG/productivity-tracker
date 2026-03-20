import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import './ContributionGrid.css'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getYearDays(year) {
  const days = []
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  return days
}

function formatDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTooltip(date, tasks) {
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  if (!tasks || tasks.length === 0) return `${label}\nNo tasks`
  const completed = tasks.filter(t => t.completed).length
  return `${label}\n${completed}/${tasks.length} tasks completed`
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function ContributionGrid({ year, taskData, getCompletionLevel, selectedDate, bulkDates, onDragSelect }) {
  const [dragDates, setDragDates] = useState(new Set())
  const [hoveredDay, setHoveredDay] = useState(null)
  const [hoveredDate, setHoveredDate] = useState(null)
  const [focusedDate, setFocusedDate] = useState(selectedDate || null)
  const [tooltipState, setTooltipState] = useState(null)
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 })
  const isDragging = useRef(false)
  const bulkSet = useMemo(() => new Set(bulkDates || []), [bulkDates])
  const cellRefs = useRef({})
  const tooltipRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  const { weeks, monthPositions, dateIndexMap, indexDateMap } = useMemo(() => {
    const allDays = getYearDays(year)
    const weeks = []
    const monthPositions = []
    let currentWeek = []
    const dateIndexMap = new Map()
    const indexDateMap = new Map()

    const firstDayIndex = (allDays[0].getDay() + 6) % 7
    for (let i = 0; i < firstDayIndex; i++) currentWeek.push(null)

    let lastMonth = -1
    let dayOfYear = 0
    allDays.forEach(date => {
      const dayIndex = (date.getDay() + 6) % 7
      if (dayIndex === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      if (date.getMonth() !== lastMonth) {
        monthPositions.push({ month: date.getMonth(), weekIndex: weeks.length })
        lastMonth = date.getMonth()
      }
      const weekIndex = weeks.length
      const dateStr = formatDateStr(date)
      dateIndexMap.set(dateStr, { weekIndex, dayIndex, dayOfYear })
      indexDateMap.set(`${weekIndex}-${dayIndex}`, dateStr)
      dayOfYear += 1
      currentWeek.push(date)
    })
    if (currentWeek.length > 0) weeks.push(currentWeek)
    return { weeks, monthPositions, dateIndexMap, indexDateMap }
  }, [year])

  const today = formatDateStr(new Date())

  const hoveredColumn = useMemo(() => {
    if (!hoveredDate || !dateIndexMap.has(hoveredDate)) return null
    return dateIndexMap.get(hoveredDate).weekIndex
  }, [hoveredDate, dateIndexMap])

  const updateTooltip = useCallback((dateStr, rect) => {
    if (!dateStr || !rect) {
      setTooltipState(null)
      return
    }
    const date = new Date(dateStr + 'T12:00:00')
    const text = formatTooltip(date, taskData[dateStr])
    setTooltipState({ text, rect })
  }, [taskData])

  const handleMouseDown = useCallback((dateStr, e) => {
    e.preventDefault()
    isDragging.current = true
    setDragDates(new Set([dateStr]))
  }, [])

  const handleMouseEnter = useCallback((dateStr) => {
    if (isDragging.current) {
      setDragDates(prev => new Set([...prev, dateStr]))
    }
  }, [])

  const handleFocus = useCallback((dateStr) => {
    setFocusedDate(dateStr)
    const dayIndex = dateIndexMap.get(dateStr)?.dayIndex
    if (dayIndex !== undefined) setHoveredDay(dayIndex)
    setHoveredDate(dateStr)
    const rect = cellRefs.current[dateStr]?.getBoundingClientRect()
    updateTooltip(dateStr, rect)
  }, [dateIndexMap, updateTooltip])

  useEffect(() => {
    if (!focusedDate && !selectedDate) {
      const firstDate = indexDateMap.get('0-0') || indexDateMap.get('0-1') || indexDateMap.get('0-2')
      if (firstDate) setFocusedDate(firstDate)
    }
  }, [focusedDate, indexDateMap, selectedDate])

  const handleBlur = useCallback(() => {
    setTooltipState(null)
    setHoveredDay(null)
    setHoveredDate(null)
  }, [])

  useEffect(() => {
    if (selectedDate && focusedDate !== selectedDate) {
      setFocusedDate(selectedDate)
    }
  }, [focusedDate, selectedDate])

  const handleKeyDown = useCallback((e, dateStr) => {
    if (!dateIndexMap.has(dateStr)) return
    const { weekIndex, dayIndex } = dateIndexMap.get(dateStr)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onDragSelect([dateStr])
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
      nextWeekIndex = clamp(nextWeekIndex, 0, weeks.length - 1)
      nextDayIndex = clamp(nextDayIndex, 0, 6)
      const nextDate = indexDateMap.get(`${nextWeekIndex}-${nextDayIndex}`)
      if (nextDate) {
        setFocusedDate(nextDate)
        const nextEl = cellRefs.current[nextDate]
        nextEl?.focus()
        const rect = nextEl?.getBoundingClientRect()
        updateTooltip(nextDate, rect)
        const nextDay = dateIndexMap.get(nextDate)?.dayIndex
        if (nextDay !== undefined) setHoveredDay(nextDay)
        setHoveredDate(nextDate)
      }
    }
  }, [dateIndexMap, indexDateMap, onDragSelect, updateTooltip, weeks.length])

  useEffect(() => {
    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      setDragDates(prev => {
        if (prev.size > 0) onDragSelect([...prev].sort())
        return new Set()
      })
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [onDragSelect])

  useEffect(() => {
    if (focusedDate && !dateIndexMap.has(focusedDate)) {
      setFocusedDate(null)
      setTooltipState(null)
    }
  }, [dateIndexMap, focusedDate])

  useEffect(() => {
    if (tooltipState && focusedDate) {
      const rect = cellRefs.current[focusedDate]?.getBoundingClientRect()
      if (rect) updateTooltip(focusedDate, rect)
    }
  }, [focusedDate, tooltipState, updateTooltip])

  useEffect(() => {
    if (tooltipState && tooltipRef.current) {
      setTooltipSize({
        width: tooltipRef.current.offsetWidth,
        height: tooltipRef.current.offsetHeight,
      })
    }
  }, [tooltipState])

  const tooltipStyle = tooltipState?.rect
    ? (() => {
        const padding = 12
        const maxLeft = window.innerWidth - tooltipSize.width - padding
        const maxTop = window.innerHeight - tooltipSize.height - padding
        return {
          left: clamp(tooltipState.rect.right + 10, padding, Math.max(padding, maxLeft)),
          top: clamp(tooltipState.rect.top - 6, padding, Math.max(padding, maxTop)),
        }
      })()
    : null

  return (
    <motion.div
      className="contribution-grid-wrapper"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {tooltipState && tooltipStyle && (
        <div ref={tooltipRef} className="grid-tooltip" style={tooltipStyle}>
          {tooltipState.text.split('\n').map((line, idx) => (
            <div key={idx} className={idx === 0 ? 'grid-tooltip-title' : 'grid-tooltip-line'}>{line}</div>
          ))}
        </div>
      )}
      <div className="month-labels">
        <div className="day-label-spacer" />
        {weeks.map((_, weekIdx) => {
          const mp = monthPositions.find(m => m.weekIndex === weekIdx)
          return (
            <div key={weekIdx} className="month-cell">
              {mp ? MONTH_LABELS[mp.month] : ''}
            </div>
          )
        })}
      </div>

      <div className="grid-body">
        <div className="day-labels">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className={`day-label${hoveredDay !== null && hoveredDay === i ? ' hovered' : ''}`}>{label}</div>
          ))}
        </div>

        <div className="grid-columns">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className={`grid-column${hoveredColumn === weekIdx ? ' hovered' : ''}`}>
              {week.map((date, dayIdx) => {
                if (!date) return <div key={dayIdx} className="grid-cell empty" />
                const dateStr = formatDateStr(date)
                const level = getCompletionLevel(dateStr)
                const isSelected = selectedDate === dateStr
                const isBulkSelected = bulkSet.has(dateStr) || dragDates.has(dateStr)
                const isToday = dateStr === today
                const dayIndex = (date.getDay() + 6) % 7

                return (
                  <motion.div
                    key={dayIdx}
                    ref={el => { cellRefs.current[dateStr] = el }}
                    className={[
                      'grid-cell',
                      `level-${level}`,
                      isSelected ? 'selected' : '',
                      isBulkSelected ? 'bulk-selected' : '',
                      isToday ? 'today' : '',
                      hoveredDay === dayIndex ? 'row-hovered' : '',
                    ].filter(Boolean).join(' ')}
                    tabIndex={focusedDate === dateStr ? 0 : -1}
                    role="button"
                    aria-label={formatTooltip(date, taskData[dateStr]).replace(/\n/g, ' ')}
                    onFocus={() => handleFocus(dateStr)}
                    onBlur={handleBlur}
                    onKeyDown={e => handleKeyDown(e, dateStr)}
                    onMouseDown={e => handleMouseDown(dateStr, e)}
                    onMouseEnter={e => {
                      handleMouseEnter(dateStr)
                      setHoveredDay(dayIndex)
                      setHoveredDate(dateStr)
                      updateTooltip(dateStr, e.currentTarget.getBoundingClientRect())
                    }}
                    onMouseLeave={() => { setHoveredDay(null); setHoveredDate(null); setTooltipState(null) }}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.2 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default ContributionGrid
