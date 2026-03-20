export const CATEGORIES = {
  work:     { label: 'Work',     color: '#58a6ff' },
  personal: { label: 'Personal', color: '#bc8cff' },
  health:   { label: 'Health',   color: '#3fb950' },
  learning: { label: 'Learning', color: '#f78166' },
  other:    { label: 'Other',    color: '#8b949e' },
}

export const ACHIEVEMENTS = [
  { id: 'first_task',    title: 'First Steps',      desc: 'Add your first task',              icon: '🌱' },
  { id: 'first_complete',title: 'Done!',             desc: 'Complete your first task',         icon: '✅' },
  { id: 'streak_3',      title: 'On a Roll',         desc: '3-day completion streak',          icon: '🔥' },
  { id: 'streak_7',      title: 'Week Warrior',      desc: '7-day completion streak',          icon: '⚡' },
  { id: 'streak_30',     title: 'Monthly Master',    desc: '30-day completion streak',         icon: '💪' },
  { id: 'tasks_10',      title: 'Getting Started',   desc: 'Complete 10 tasks',                icon: '⭐' },
  { id: 'tasks_50',      title: 'Productivity Pro',  desc: 'Complete 50 tasks',                icon: '🏆' },
  { id: 'tasks_100',     title: 'Century Club',      desc: 'Complete 100 tasks',               icon: '💯' },
  { id: 'active_7',      title: 'Regular',           desc: 'Active on 7 different days',       icon: '📅' },
  { id: 'active_30',     title: 'Consistent',        desc: 'Active on 30 different days',      icon: '🗓' },
  { id: 'active_100',    title: 'Dedicated',         desc: 'Active on 100 different days',     icon: '🎯' },
  { id: 'perfect_day',   title: 'Perfect Day',       desc: 'Complete all tasks in a day (3+)', icon: '✨' },
]

export function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function computeStats(taskData, year) {
  let totalTasks = 0
  let totalCompleted = 0
  let activeDays = 0
  let hasPerfectDay = false
  const categoryTotals = {}

  Object.entries(taskData).forEach(([dateStr, tasks]) => {
    if (!dateStr.startsWith(String(year))) return
    if (!tasks || tasks.length === 0) return
    activeDays++
    const completed = tasks.filter(t => t.completed).length
    totalTasks += tasks.length
    totalCompleted += completed
    if (completed === tasks.length && tasks.length >= 3) hasPerfectDay = true
    tasks.forEach(t => {
      const cat = t.category || 'other'
      categoryTotals[cat] = (categoryTotals[cat] || 0) + 1
    })
  })

  // Current streak (backwards from today)
  let currentStreak = 0
  const today = new Date()
  const d = new Date(today)
  while (true) {
    const dateStr = formatDate(d)
    const tasks = taskData[dateStr]
    if (tasks && tasks.some(t => t.completed)) {
      currentStreak++
      d.setDate(d.getDate() - 1)
    } else if (dateStr === formatDate(today)) {
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  // Longest streak in the given year
  let longestStreak = 0
  let tempStreak = 0
  for (let i = 0; i < 366; i++) {
    const checkDate = new Date(year, 0, 1 + i)
    if (checkDate.getFullYear() !== year) break
    const tasks = taskData[formatDate(checkDate)]
    if (tasks && tasks.some(t => t.completed)) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  return { totalTasks, totalCompleted, activeDays, currentStreak, longestStreak, categoryTotals, hasPerfectDay }
}

export function checkAchievements(taskData) {
  let totalTasks = 0
  let totalCompleted = 0
  let activeDays = 0
  let hasPerfectDay = false
  let longestStreak = 0
  let tempStreak = 0

  const allDates = Object.keys(taskData).sort()
  allDates.forEach(dateStr => {
    const tasks = taskData[dateStr]
    if (!tasks || tasks.length === 0) return
    activeDays++
    const completed = tasks.filter(t => t.completed).length
    totalTasks += tasks.length
    totalCompleted += completed
    if (completed === tasks.length && tasks.length >= 3) hasPerfectDay = true
  })

  if (allDates.length > 0) {
    const startYear = parseInt(allDates[0].slice(0, 4))
    const endYear = parseInt(allDates[allDates.length - 1].slice(0, 4))
    for (let year = startYear; year <= endYear; year++) {
      for (let i = 0; i < 366; i++) {
        const checkDate = new Date(year, 0, 1 + i)
        if (checkDate.getFullYear() !== year) break
        const tasks = taskData[formatDate(checkDate)]
        if (tasks && tasks.some(t => t.completed)) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }
    }
  }

  const unlocked = new Set()
  if (totalTasks >= 1)       unlocked.add('first_task')
  if (totalCompleted >= 1)   unlocked.add('first_complete')
  if (longestStreak >= 3)    unlocked.add('streak_3')
  if (longestStreak >= 7)    unlocked.add('streak_7')
  if (longestStreak >= 30)   unlocked.add('streak_30')
  if (totalCompleted >= 10)  unlocked.add('tasks_10')
  if (totalCompleted >= 50)  unlocked.add('tasks_50')
  if (totalCompleted >= 100) unlocked.add('tasks_100')
  if (activeDays >= 7)       unlocked.add('active_7')
  if (activeDays >= 30)      unlocked.add('active_30')
  if (activeDays >= 100)     unlocked.add('active_100')
  if (hasPerfectDay)         unlocked.add('perfect_day')
  return unlocked
}
