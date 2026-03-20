import { useState, useCallback, useEffect } from 'react'
import { formatDate } from '../constants'

const STORAGE_KEY = 'productivity-tracker-data'

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function makeTask(dateStr, name, category) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${dateStr}`,
    name,
    completed: false,
    createdAt: new Date().toISOString(),
    category: category || 'other',
  }
}

export function useTaskData() {
  const [taskData, setTaskData] = useState(loadData)

  useEffect(() => {
    saveData(taskData)
  }, [taskData])

  const addTask = useCallback((dateStr, taskName, category = 'other', recurring = false, year = null) => {
    setTaskData(prev => {
      const newState = { ...prev }
      const dates = [dateStr]

      if (recurring && year) {
        const startDate = new Date(dateStr + 'T12:00:00')
        const yearEnd = new Date(year, 11, 31)
        const d = new Date(startDate)
        d.setDate(d.getDate() + 7)
        while (d <= yearEnd) {
          dates.push(formatDate(d))
          d.setDate(d.getDate() + 7)
        }
      }

      dates.forEach(date => {
        newState[date] = [...(newState[date] || []), makeTask(date, taskName, category)]
      })
      return newState
    })
  }, [])

  const addTaskToMultipleDates = useCallback((dates, taskName, category = 'other') => {
    setTaskData(prev => {
      const newState = { ...prev }
      dates.forEach(date => {
        newState[date] = [...(newState[date] || []), makeTask(date, taskName, category)]
      })
      return newState
    })
  }, [])

  const toggleTask = useCallback((dateStr, taskId) => {
    setTaskData(prev => {
      const dayTasks = (prev[dateStr] || []).map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
      return { ...prev, [dateStr]: dayTasks }
    })
  }, [])

  const deleteTask = useCallback((dateStr, taskId) => {
    setTaskData(prev => {
      const dayTasks = (prev[dateStr] || []).filter(t => t.id !== taskId)
      if (dayTasks.length === 0) {
        const { [dateStr]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [dateStr]: dayTasks }
    })
  }, [])

  const getTasksForDate = useCallback((dateStr) => {
    return taskData[dateStr] || []
  }, [taskData])

  const editTask = useCallback((dateStr, taskId, newName) => {
    setTaskData(prev => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).map(t => t.id === taskId ? { ...t, name: newName } : t),
    }))
  }, [])

  const restoreTask = useCallback((dateStr, task) => {
    setTaskData(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), task],
    }))
  }, [])

  const importData = useCallback((data) => {
    setTaskData(data || {})
  }, [])

  const getCompletionLevel = useCallback((dateStr, categoryFilter = null) => {
    let tasks = taskData[dateStr]
    if (!tasks || tasks.length === 0) return 0
    if (categoryFilter) tasks = tasks.filter(t => (t.category || 'other') === categoryFilter)
    if (tasks.length === 0) return 0
    const completed = tasks.filter(t => t.completed).length
    if (completed === 0) return 1
    if (completed <= 2) return 2
    if (completed <= 4) return 3
    return 4
  }, [taskData])

  return { taskData, addTask, addTaskToMultipleDates, toggleTask, deleteTask, editTask, restoreTask, importData, getTasksForDate, getCompletionLevel }
}
