import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CATEGORIES } from '../constants'
import './TaskPanel.css'

function TaskItem({ task, dateStr, onToggle, onDelete, onEdit, shouldReduceMotion }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(task.name)
  const editRef = useRef(null)

  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  const commitEdit = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== task.name) onEdit(task.id, trimmed)
    else setEditName(task.name)
    setEditing(false)
  }

  const handleEditKey = (e) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setEditName(task.name); setEditing(false) }
  }

  const catColor = CATEGORIES[task.category || 'other']?.color || '#8b949e'

  return (
    <motion.div
      className={`task-item ${task.completed ? 'completed' : ''}`}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
    >
      <label className="task-label" onClick={e => editing && e.preventDefault()}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="task-checkbox"
        />
        <span className="task-cat-dot" style={{ background: catColor }} />
        {editing ? (
          <input
            ref={editRef}
            className="task-edit-input"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKey}
            onClick={e => e.preventDefault()}
          />
        ) : (
          <span className="task-name" onDoubleClick={() => !task.completed && setEditing(true)}>
            {task.name}
          </span>
        )}
      </label>
      <div className="task-actions">
        {!task.completed && !editing && (
          <button className="task-edit-btn" onClick={() => setEditing(true)} title="Rename">✎</button>
        )}
        <button className="delete-btn" onClick={() => onDelete(task.id)} title="Delete">×</button>
      </div>
    </motion.div>
  )
}

function TaskPanel({ dateStr, bulkDates, tasks = [], note = '', onAddTask, onToggleTask, onDeleteTask, onEditTask, onNoteChange, onClose }) {
  const [newTask, setNewTask] = useState('')
  const [category, setCategory] = useState('other')
  const [recurring, setRecurring] = useState(false)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const isBulk = !!bulkDates
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    inputRef.current?.focus()
  }, [dateStr, isBulk])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = newTask.trim()
    if (!trimmed) return
    if (isBulk) onAddTask(trimmed, category)
    else onAddTask(trimmed, category, recurring)
    setNewTask('')
    setRecurring(false)
  }

  let title = ''
  if (isBulk) {
    title = `${bulkDates.length} day${bulkDates.length > 1 ? 's' : ''} selected`
  } else {
    const date = new Date(dateStr + 'T12:00:00')
    title = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const completedCount = tasks.filter(t => t.completed).length

  return (
    <motion.div
      className="task-panel-overlay"
      onClick={onClose}
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
    >
      <motion.div
        ref={panelRef}
        className="task-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-panel-title"
        onClick={e => e.stopPropagation()}
        initial={shouldReduceMotion ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
      >
        <div className="task-panel-header">
          <div>
            <h2 id="task-panel-title">{title}</h2>
            {!isBulk && tasks.length > 0 && (
              <p className="task-count">{completedCount}/{tasks.length} tasks completed</p>
            )}
            {isBulk && <p className="task-count">Task will be added to all selected days</p>}
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close task panel">&times;</button>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="task-form-row">
            <input
              ref={inputRef}
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder={isBulk ? 'Add task to all selected days…' : 'Add a new task…'}
              className="task-input"
            />
            <button type="submit" className="add-btn" disabled={!newTask.trim()}>Add</button>
          </div>
          <div className="category-picker">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                className={`cat-chip ${category === key ? 'active' : ''}`}
                style={{ '--cat-color': cat.color }}
                onClick={() => setCategory(key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {!isBulk && (
            <label className="recurring-toggle">
              <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
              <span>Repeat weekly for rest of year</span>
            </label>
          )}
        </form>

        {!isBulk && (
          <>
            <div className="task-list">
              {tasks.length === 0 ? (
                <p className="empty-state">No tasks yet. Add one above!</p>
              ) : (
                tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    dateStr={dateStr}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ))
              )}
            </div>
            <div className="notes-section">
              <label className="notes-label">Day notes</label>
              <textarea
                className="notes-textarea"
                value={note}
                onChange={e => onNoteChange(e.target.value)}
                placeholder="Add notes, context, or reflections for this day…"
                rows={3}
              />
            </div>
          </>
        )}

        {isBulk && (
          <div className="bulk-dates-list">
            <p className="bulk-dates-heading">Selected days:</p>
            {bulkDates.slice(0, 8).map(d => {
              const date = new Date(d + 'T12:00:00')
              return (
                <div key={d} className="bulk-date-item">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              )
            })}
            {bulkDates.length > 8 && (
              <div className="bulk-date-item more">+{bulkDates.length - 8} more</div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default TaskPanel
